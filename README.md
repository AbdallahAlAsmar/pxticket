# PX Ticket Dashboard

Web control panel for the Discord ticket bot. Hosted at [pxticket.vercel.app](https://pxticket.vercel.app).

## Features

- Discord OAuth login (admin / manage-server only)
- Servers you own or can manage, with PX Ticket servers first and one-click bot invites for other servers
- Live Discord embed preview while editing
- Create / edit / publish ticket panels (categories, roles, questions)
- Rules panels with publish
- Guild settings (log channel, support roles, emojis, language, transcripts)
- Three.js landing scene + motion throughout the UI

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with Discord application OAuth credentials and the bot API URL/secret.

### Discord Developer Portal

1. Create (or open) the same Discord application as the ticket bot
2. OAuth2 → Redirects → add:
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://pxticket.vercel.app/api/auth/callback/discord`
3. Copy Client ID + Client Secret into env

### Bot side (shared host — same as bot_control)

The web API listens on Bot-Hosting's injected `SERVER_PORT` (25011) bound to `0.0.0.0`. The public HTTPS origin is `https://noxes.apps.bot-hosting.cloud` (do not add `:25011`).

`ticket_bot` listens on **localhost only** (`127.0.0.1:3847`). The license API (or bot_control if enabled) proxies:

`https://noxes.apps.bot-hosting.cloud/ticket-api/*` → `http://127.0.0.1:3847/*`

In `ticket_bot/.env`:

```env
DASHBOARD_API_SECRET=long_random_string
DASHBOARD_API_HOST=127.0.0.1
DASHBOARD_API_PORT=3847
```

In Vercel / `.env.local`:

```env
BOT_API_URL=https://noxes.apps.bot-hosting.cloud/ticket-api
BOT_API_SECRET=long_random_string
```

Restart supervisor (or bot_control + ticket_bot) after env changes.

## Deploy to Vercel

1. Import the `pxticket` folder as a Vercel project
2. Set domain `pxticket.vercel.app`
3. Add all env vars from `.env.example`
4. Deploy

`BOT_API_URL` must use the shared host proxy path above (not a second public port).