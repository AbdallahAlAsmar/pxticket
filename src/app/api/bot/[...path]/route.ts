import { auth } from "@/lib/auth";
import { botFetch, BotApiError, fetchUserGuilds } from "@/lib/bot-api";
import {
  getCached,
  invalidateCachePrefix,
  rateLimit,
  setCached,
} from "@/lib/rate-limit";
import { hasGuildAdmin } from "@/lib/utils";
import { mergeDashboardGuilds } from "@/lib/guild-list";
import { NextResponse } from "next/server";

async function assertCanManage(
  guildId: string,
  userId: string,
  accessToken?: string
) {
  if (accessToken) {
    try {
      const guilds = await fetchUserGuilds(accessToken);
      const g = guilds.find((x) => x.id === guildId);
      if (g && (g.owner || hasGuildAdmin(g.permissions))) {
        return true;
      }
      if (g) {
        return false;
      }
    } catch {
      // Fall through when Discord OAuth token is stale.
    }
  }

  try {
    const result = await botFetch<{ canManage: boolean }>(
      `/guilds/${guildId}/can-manage/${userId}`
    );
    return Boolean(result.canManage);
  } catch (error) {
    throw new BotApiError(
      error instanceof Error
        ? `Permission check failed: ${error.message}`
        : "Permission check failed",
      error instanceof BotApiError ? error.status : 502
    );
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(ctx, "GET");
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(ctx, "POST", req);
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(ctx, "PUT", req);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(ctx, "PATCH", req);
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(ctx, "DELETE", req);
}

function cacheTtlForPath(botPath: string) {
  if (botPath.endsWith("/emojis")) return 600_000; // 10 min — emojis rarely change
  if (botPath.endsWith("/channels") || botPath.endsWith("/roles")) return 60_000;
  if (botPath.endsWith("/bootstrap")) return 20_000;
  if (botPath === "/guilds") return 20_000;
  return 12_000;
}

async function proxy(
  ctx: { params: Promise<{ path: string[] }> },
  method: string,
  req?: Request
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`user:${session.user.id}`, 90, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Too many requests. Slow down and try again shortly.",
          retryAfter: limited.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfter) },
        }
      );
    }

    const { path } = await ctx.params;
    const segments = path || [];
    const botPath = `/${segments.join("/")}`;

    // Special: merge Discord user guilds with bot guilds
    if (method === "GET" && segments.length === 1 && segments[0] === "guilds") {
      const cacheKey = `guilds-list:${session.user.id}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached.body, {
          headers: { "X-Cache": "HIT" },
        });
      }

      if (!session.accessToken) {
        throw new BotApiError(
          "Your Discord session has no guild access. Sign out and sign back in.",
          401
        );
      }

      const [botData, userGuilds] = await Promise.all([
        botFetch<{
          guilds: Array<{
            id: string;
            name: string;
            icon: string | null;
            memberCount?: number;
          }>;
        }>("/guilds"),
        fetchUserGuilds(session.accessToken),
      ]);

      const clientId = process.env.DISCORD_CLIENT_ID;
      if (!clientId) {
        throw new BotApiError("DISCORD_CLIENT_ID is not configured.", 500);
      }

      const payload = {
        guilds: mergeDashboardGuilds(userGuilds, botData.guilds, clientId),
      };
      setCached(cacheKey, payload, 200, 5_000);
      return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
    }

    const guildId =
      segments[0] === "guilds" && segments[1] ? segments[1] : null;
    if (guildId) {
      const allowed = await assertCanManage(
        guildId,
        session.user.id,
        session.accessToken
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "You need Manage Server permission in this guild." },
          { status: 403 }
        );
      }
    }

    if (method === "GET") {
      const cacheKey = `get:${session.user.id}:${botPath}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached.body, {
          headers: { "X-Cache": "HIT" },
        });
      }

      const data = await botFetch(botPath, { method: "GET" });
      setCached(cacheKey, data, 200, cacheTtlForPath(botPath));
      return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
    }

    const body =
      req && method !== "DELETE" ? await req.text() : undefined;

    const data = await botFetch(botPath, {
      method,
      body: body || undefined,
    });

    // Mutations invalidate cached reads for that guild / global list.
    if (guildId) {
      invalidateCachePrefix(`get:${session.user.id}:/guilds/${guildId}`);
    }
    invalidateCachePrefix(`guilds-list:${session.user.id}`);
    invalidateCachePrefix(`get:${session.user.id}:/guilds`);

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    const status = error instanceof BotApiError ? error.status : 500;
    const details = error instanceof BotApiError ? error.details : undefined;
    return NextResponse.json({ error: message, details }, { status });
  }
}
