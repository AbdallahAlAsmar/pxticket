# Optional Cloudflare Worker fallback

The normal Vercel configuration should call the HTTPS custom domain directly; the Worker is only a fallback if that route is unavailable.

## 1. Create the Worker

1. Go to [Cloudflare Dashboard → Workers](https://dash.cloudflare.com/) → **Create Worker**
2. Replace the default code with [`ticket-api-proxy.js`](./ticket-api-proxy.js)
3. **Deploy**
4. Settings → Variables → add:
   - `UPSTREAM` = `https://noxes.apps.bot-hosting.cloud`
5. Copy your worker URL, e.g. `https://pxticket-api.YOUR_SUBDOMAIN.workers.dev`

## 2. Use the direct URL (preferred)

Set this in Vercel and redeploy:

```env
BOT_API_URL=https://noxes.apps.bot-hosting.cloud/ticket-api
BOT_API_SECRET=<same as ticket_bot DASHBOARD_API_SECRET>
```

If the direct custom domain is inaccessible from Vercel, deploy this Worker and set `UPSTREAM` as above. Then use the worker URL instead:

```env
BOT_API_URL=https://YOUR_WORKER.workers.dev/ticket-api
BOT_API_SECRET=<same as ticket_bot DASHBOARD_API_SECRET>
```

## 3. Verify

- Bot API: `https://noxes.apps.bot-hosting.cloud/ticket-api/health`
- Site: `https://pxticket.vercel.app/api/status`
