# Multi-Domain Routing (app. / api. / bot.)

**Entity: Darrel-spell-living-trust**

| Subdomain | Target | Purpose |
|-----------|--------|---------|
| `app.rotationtv.network` | Cloudflare Pages (rtv-webapp) | Standalone WebApp.tsx |
| `api.rotationtv.network` | Cloudflare Worker (rotationtv-live-ai-clones) | Backend + Stars + Kimi + Telegram webhooks |
| `bot.rotationtv.network` | Same Worker or dedicated gateway Worker | Multi-bot webhook entry (optional split) |
| `mini.rotationtv.network` | Mini App Pages / Workers | Telegram Mini App only (optional) |

## Cloudflare (recommended — zero extra infra)

### 1. DNS (Cloudflare DNS for rotationtv.network)
```
CNAME  app   rtv-webapp.pages.dev          Proxied
CNAME  api   rotationtv-live-ai-clones.rotationtimmy.workers.dev   Proxied
# or use Worker custom domain binding
```

### 2. Worker Custom Domain (wrangler)
Uncomment / add in wrangler.jsonc:

```jsonc
"routes": [
  { "pattern": "api.rotationtv.network/*", "zone_name": "rotationtv.network" },
  { "pattern": "bot.rotationtv.network/*", "zone_name": "rotationtv.network" }
]
```

Then:
```bash
npx wrangler deploy
# or
npx wrangler domains add api.rotationtv.network
```

### 3. Pages Custom Domain
Dashboard → Pages → rtv-webapp → Custom domains → Add `app.rotationtv.network`

### 4. CORS (must allow)
In Worker `src/index.ts` (or Hono middleware):
```ts
const ALLOWED = [
  'https://app.rotationtv.network',
  'https://mini.rotationtv.network',
  'https://t.me',
  // local
  'http://localhost:5173',
  'http://localhost:5174',
];
```

## Self-hosted alternative (Caddy + k8s / Docker)

See `Caddyfile` and the k8s Ingress in `../acme/`.

## Telegram Bot Webhooks
Point each bot’s webhook to:
```
https://api.rotationtv.network/webhook/<botId>
# or
https://bot.rotationtv.network/webhook/<botId>
```
botGateway.ts already supports path-based multi-bot routing.
