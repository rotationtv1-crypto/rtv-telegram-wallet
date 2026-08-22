# Multi-Domain Routing — Cloudflare Native Only

| Subdomain | Target | Purpose |
|-----------|--------|--------|
| `api.rotationtv.network` | Worker (wrangler name) | Backend, Stars webhooks, AI, streams |
| `bot.rotationtv.network` | Same Worker (path `/webhook/<botId>`) | Multi-bot isolation |
| `app.` / Mini App | Cloudflare Pages or Worker assets | Telegram Mini App + wallet UI |

## 1. DNS (Cloudflare zone)
```
CNAME  api   <your-worker>.<account>.workers.dev   Proxied
# Prefer Worker Custom Domain binding instead of CNAME when possible
```

## 2. wrangler.jsonc routes
```jsonc
"routes": [
  { "pattern": "api.rotationtv.network/*", "zone_name": "rotationtv.network" },
  { "pattern": "bot.rotationtv.network/*", "zone_name": "rotationtv.network" }
]
```

Deploy:
```bash
npx wrangler deploy
# or
npx wrangler domains add api.rotationtv.network
```

## 3. HTTPS / ACME
Cloudflare Universal SSL + Custom Hostnames / Custom Domains.  
No separate cert-manager or Caddy required for pure Cloudflare.

## 4. CORS allowlist (Worker)
```ts
const ALLOWED = [
  'https://app.rotationtv.network',
  'https://t.me',
  'http://localhost:5173',
];
```

## 5. Bot webhooks
```
https://api.rotationtv.network/webhook/<botId>
```
`botGateway.ts` already routes by path. Keep one token env var per bot (`TELEGRAM_BOT_TOKEN_<id>`).

Caddy / k8s files under this folder are legacy self-host references only — not required for Cloudflare path.
