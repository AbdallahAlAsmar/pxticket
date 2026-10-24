const BOT_API_URL = process.env.BOT_API_URL || "";
const BOT_API_SECRET = process.env.BOT_API_SECRET || "";

export class BotApiError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function assertBotConfig() {
  if (!BOT_API_SECRET) {
    throw new BotApiError(
      "BOT_API_SECRET is not configured in Vercel.",
      500
    );
  }
  if (!BOT_API_URL) {
    throw new BotApiError(
      "BOT_API_URL is not configured in Vercel. Set it to https://noxes.apps.bot-hosting.cloud/ticket-api.",
      500
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(BOT_API_URL);
  } catch {
    throw new BotApiError(`BOT_API_URL is invalid: ${BOT_API_URL}`, 500);
  }

  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    throw new BotApiError(
      `Vercel cannot reach ${parsed.host} — use the HTTPS custom domain without a custom port: https://noxes.apps.bot-hosting.cloud/ticket-api`,
      500,
      { host: parsed.host, port: parsed.port }
    );
  }

  if (
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "localhost"
  ) {
    throw new BotApiError(
      "BOT_API_URL points at localhost, which does not work on Vercel.",
      500
    );
  }
}

export async function botFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  assertBotConfig();

  const url = `${BOT_API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("X-API-Secret", BOT_API_SECRET);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new BotApiError(
      `Could not reach bot API at ${BOT_API_URL} (${message}). Check that the host binds to SERVER_PORT=25011 on 0.0.0.0 and the custom domain routes to the running app.`,
      502,
      { url: BOT_API_URL }
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BotApiError(
      (data as { error?: string }).error || `Bot API error (${res.status})`,
      res.status,
      data as Record<string, unknown>
    );
  }
  return data as T;
}

export async function fetchUserGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new BotApiError("Failed to fetch Discord guilds", res.status);
  }
  return res.json() as Promise<
    Array<{
      id: string;
      name: string;
      icon: string | null;
      owner: boolean;
      permissions: string;
    }>
  >;
}
