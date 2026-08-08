const BOT_API_URL = process.env.BOT_API_URL || "http://127.0.0.1:3847";
const BOT_API_SECRET = process.env.BOT_API_SECRET || "";

export class BotApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function botFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!BOT_API_SECRET) {
    throw new BotApiError(
      "BOT_API_SECRET is not configured. Set it in your environment.",
      500
    );
  }

  const url = `${BOT_API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("X-API-Secret", BOT_API_SECRET);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BotApiError(
      (data as { error?: string }).error || `Bot API error (${res.status})`,
      res.status
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
