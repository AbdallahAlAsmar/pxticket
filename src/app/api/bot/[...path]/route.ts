import { auth } from "@/lib/auth";
import { botFetch, BotApiError, fetchUserGuilds } from "@/lib/bot-api";
import { hasGuildAdmin } from "@/lib/utils";
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
      // User is in Discord guild list but lacks admin — deny without bot roundtrip.
      if (g) {
        return false;
      }
    } catch {
      // Fall through to bot membership check when Discord OAuth token is stale.
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

    const { path } = await ctx.params;
    const segments = path || [];
    const botPath = `/${segments.join("/")}`;

    // Special: merge Discord user guilds with bot guilds
    if (method === "GET" && segments.length === 1 && segments[0] === "guilds") {
      const [botData, userGuilds] = await Promise.all([
        botFetch<{
          guilds: Array<{
            id: string;
            name: string;
            icon: string | null;
            memberCount?: number;
          }>;
        }>("/guilds"),
        session.accessToken
          ? fetchUserGuilds(session.accessToken).catch(() => [])
          : Promise.resolve([]),
      ]);

      const botIds = new Set(botData.guilds.map((g) => g.id));
      const manageable = userGuilds.filter(
        (g) => botIds.has(g.id) && (g.owner || hasGuildAdmin(g.permissions))
      );

      // If Discord OAuth guilds failed/empty, fall back to bot can-manage checks.
      let guilds = manageable.map((g) => {
        const botGuild = botData.guilds.find((b) => b.id === g.id);
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          permissions: g.permissions,
          botPresent: true,
          canManage: true,
          memberCount: botGuild?.memberCount,
        };
      });

      if (!guilds.length && botData.guilds.length) {
        const checks = await Promise.all(
          botData.guilds.map(async (g) => {
            try {
              const result = await botFetch<{ canManage: boolean }>(
                `/guilds/${g.id}/can-manage/${session.user.id}`
              );
              return result.canManage ? g : null;
            } catch {
              return null;
            }
          })
        );
        guilds = checks.filter(Boolean).map((g) => ({
          id: g!.id,
          name: g!.name,
          icon: g!.icon,
          permissions: "",
          botPresent: true,
          canManage: true,
          memberCount: g!.memberCount,
        }));
      }

      return NextResponse.json({ guilds });
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

    const body =
      req && method !== "GET" && method !== "DELETE"
        ? await req.text()
        : undefined;

    const data = await botFetch(botPath, {
      method,
      body: body || undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    const status = error instanceof BotApiError ? error.status : 500;
    const details = error instanceof BotApiError ? error.details : undefined;
    return NextResponse.json({ error: message, details }, { status });
  }
}
