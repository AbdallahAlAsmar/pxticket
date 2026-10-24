import { NextResponse } from "next/server";

/**
 * Public diagnostic (no secrets). Helps confirm Vercel env + upstream reachability.
 * Open: https://pxticket.vercel.app/api/status
 */
export async function GET() {
  const rawUrl = process.env.BOT_API_URL || "";
  const hasSecret = Boolean(process.env.BOT_API_SECRET);
  let parsed: URL | null = null;
  let urlError: string | null = null;

  try {
    parsed = rawUrl ? new URL(rawUrl) : null;
  } catch {
    urlError = "BOT_API_URL is not a valid URL";
  }

  const port = parsed?.port || (parsed?.protocol === "https:" ? "443" : "80");
  const nonStandardPort = Boolean(parsed?.port && parsed.port !== "80" && parsed.port !== "443");

  let upstream: { ok: boolean; status?: number; body?: unknown; error?: string } | null =
    null;

  if (parsed && hasSecret && !nonStandardPort) {
    try {
      const healthUrl = `${rawUrl.replace(/\/$/, "")}/health`;
      const res = await fetch(healthUrl, {
        headers: { "X-API-Secret": process.env.BOT_API_SECRET! },
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      upstream = { ok: res.ok, status: res.status, body };
    } catch (error) {
      upstream = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return NextResponse.json({
    ok: Boolean(parsed && hasSecret && !nonStandardPort && upstream?.ok),
    botApiUrlSet: Boolean(rawUrl),
    botApiSecretSet: hasSecret,
    botApiHost: parsed?.host || null,
    botApiProtocol: parsed?.protocol || null,
    botApiPort: port,
    nonStandardPort,
    warning: nonStandardPort
      ? "Use the HTTPS custom domain without a custom port: https://noxes.apps.bot-hosting.cloud/ticket-api"
      : urlError,
    upstream,
  });
}
