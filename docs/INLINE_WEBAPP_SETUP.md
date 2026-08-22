# Inline WebApp Menu Setup

## Overview

Registers Telegram **menu buttons** and **inline `web_app` keyboards** so both primary bots open the production Mini App.

| Bot | Menu label | URL |
|-----|------------|-----|
| main | Open RotationTV | `https://rotationtv-mini-app.pages.dev` |
| erotica | Open Erotica | `https://rotationtv-mini-app.pages.dev?bot=erotica` |

Standalone wallet (Vercel) is separate from the Telegram Mini App surface. Prefer **Pages Mini App URLs** for menu buttons so `Telegram.WebApp.initData` is present.

## Environment

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN_MAIN` or `TELEGRAM_BOT_TOKEN_6` | Main bot token |
| `TELEGRAM_BOT_TOKEN_EROTICA` or `TELEGRAM_BOT_TOKEN_7` | Erotica bot token |
| `ADMIN_SECRET` | Bearer token for Worker setup routes |
| `MINI_APP_URL` / `NEXT_PUBLIC_APP_URL` | Override Mini App base URL |
| `EROTICA_APP_URL` | Override erotica Mini App URL |

Never commit tokens. Use `wrangler secret put` / CI secrets only.

## Method A — One-shot local script

```bash
TELEGRAM_BOT_TOKEN_MAIN=... TELEGRAM_BOT_TOKEN_EROTICA=... \
  node scripts/setup-webapp-menus.mjs
```

Pure Node (no TS loader required).

## Method B — Cloudflare Worker

1. Mount routes in Worker entry:

```ts
import { mountSetupMenuRoutes } from './routes/setupMenu';
mountSetupMenuRoutes(app);
```

2. Bind secrets: `ADMIN_SECRET`, bot tokens.

3. Call:

```bash
curl -X POST https://<your-worker>/api/bots/setup-menu-all \
  -H "Authorization: Bearer <ADMIN_SECRET>"

curl -X POST https://<your-worker>/api/bots/main/setup-menu \
  -H "Authorization: Bearer <ADMIN_SECRET>"
```

## Handler usage

```ts
import { getInlineKeyboardForBot } from '../lib/botGateway';

await sendMessage(botId, chatId, welcomeText, {
  reply_markup: getInlineKeyboardForBot('erotica'),
});
```

## Test matrix

1. Menu button visible bottom-left for both bots  
2. Tap opens Mini App; `Telegram.WebApp.initData` non-empty  
3. `/start` includes working inline WebApp button  
4. Stars `openInvoice` still works inside Mini App  
5. Erotica opens with `?bot=erotica`  
6. Unauthorized `POST /api/bots/setup-menu-all` → 401  

## Compliance

- Stars-only payment path unchanged  
- No secrets in source  
- Telegram Cloud SDK / Bot API only  

Entity: Darrel-spell-living-trust
