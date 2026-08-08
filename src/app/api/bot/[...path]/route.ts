import { auth } from "@/lib/auth";
import { botFetch, BotApiError, fetchUserGuilds } from "@/lib/bot-api";
import { hasGuildAdmin } from "@/lib/utils";
import { NextResponse } from "next/server";

async function assertCanManage(guildId: string, userId: string, accessToken?: string) {
  if (accessToken) {
    const guilds = await fetchUserGuilds(accessToken);
    const g = guilds.find((x) => x.id === guildId);
    if (g && (g.owner || hasGuildAdmin(g.permissions))) {
      return true;
    }
  }
  const result = await botFetch<{ canManage: boolean }>(
    `/guilds/${guildId}/can-manage/${userId}`
  );
  return result.canManage;
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const segments = path || [];
  const botPath = `/${segments.join("/")}`;

  // Special: merge Discord user guilds with bot guilds
  if (method === "GET" && segments.length === 1 && segments[0] === "guilds") {
    try {
      const [botData, userGuilds] = await Promise.all([
        botFetch<{ guilds: Array<{ id: string; name: string; icon: string | null; memberCount?: number }> }>(
          "/guilds"
        ),
        session.accessToken
          ? fetchUserGuilds(session.accessToken).catch(() => [])
          : Promise.resolve([]),
      ]);

      const botIds = new Set(botData.guilds.map((g) => g.id));
      const manageable = userGuilds.filter(
        (g) => botIds.has(g.id) && (g.owner || hasGuildAdmin(g.permissions))
      );

      const guilds = manageable.map((g) => {
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

      return NextResponse.json({ guilds });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load guilds";
      const status = error instanceof BotApiError ? error.status : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const guildId = segments[0] === "guilds" && segments[1] ? segments[1] : null;
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

  try {
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
    return NextResponse.json({ error: message }, { status });
  }
}
