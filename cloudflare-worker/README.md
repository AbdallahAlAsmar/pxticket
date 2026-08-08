# Cloudflare Worker (required for Vercel)

Vercel serverless functions can only make outbound requests to ports **80** and **443**.
`http://fi7.bot-hosting.net:21024` works from your PC, but **fails on Vercel** (`fetch failed`, no outgoing requests).

## 1. Create the Worker

1. Go to [Cloudflare Dashboard → Workers](https://dash.cloudflare.com/) → **Create Worker**
2. Replace the default code with [`ticket-api-proxy.js`](./ticket-api-proxy.js)
3. **Deploy**
4. Settings → Variables → add:
   - `UPSTREAM` = `http://fi7.bot-hosting.net:21024`
5. Copy your worker URL, e.g. `https://pxticket-api.YOUR_SUBDOMAIN.workers.dev`

## 2. Point Vercel at the Worker

```env
BOT_API_URL=https://pxticket-api.YOUR_SUBDOMAIN.workers.dev/ticket-api
BOT_API_SECRET=<same as ticket_bot DASHBOARD_API_SECRET>
```

Redeploy Vercel after saving.

## 3. Verify

- Worker: `https://YOUR_WORKER.workers.dev/ticket-api/health`
- Site: `https://pxticket.vercel.app/api/status`
