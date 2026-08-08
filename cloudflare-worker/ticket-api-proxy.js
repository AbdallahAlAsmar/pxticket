/**
 * Cloudflare Worker — bridges Vercel (ports 80/443 only) → bot-hosting :21024
 *
 * Deploy: https://dash.cloudflare.com → Workers → Create → paste this file
 * Route: *.workers.dev is fine
 *
 * Env vars (Worker Settings → Variables):
 *   UPSTREAM = http://fi7.bot-hosting.net:21024
 *
 * Then set on Vercel:
 *   BOT_API_URL = https://YOUR_WORKER.workers.dev/ticket-api
 */

export default {
  async fetch(request, env) {
    const upstreamBase = (env.UPSTREAM || "http://fi7.bot-hosting.net:21024").replace(
      /\/+$/,
      ""
    );
    const incoming = new URL(request.url);

    // Allow health ping on worker root
    if (incoming.pathname === "/" || incoming.pathname === "/health") {
      return Response.json({
        ok: true,
        proxy: "pxticket-worker",
        upstream: upstreamBase,
      });
    }

    const targetUrl = `${upstreamBase}${incoming.pathname}${incoming.search}`;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const headers = new Headers();
    for (const name of [
      "content-type",
      "authorization",
      "x-api-secret",
      "accept",
      "user-agent",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : request.body,
        redirect: "manual",
      });

      const out = new Headers(upstream.headers);
      for (const [k, v] of Object.entries(corsHeaders())) {
        out.set(k, v);
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: out,
      });
    } catch (error) {
      return Response.json(
        {
          error: "Upstream unreachable",
          detail: error instanceof Error ? error.message : String(error),
          targetUrl,
        },
        { status: 502, headers: corsHeaders() }
      );
    }
  },
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "Content-Type, Authorization, X-API-Secret",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };
}
