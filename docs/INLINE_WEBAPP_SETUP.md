# Inline WebApp + Menu Button Setup

## What this adds

1. **Persistent menu button** (bottom-left) launching the Mini App for each bot
2. **Inline `web_app` keyboards** via `getInlineKeyboardForBot(botId)`
3. **One-shot script** `scripts/setup-webapp-menus.mjs` (tokens from env only)
4. **API routes** (wire in Worker entry):
   - `POST /api/bots/:botId/setup-menu`
   - `POST /api/bots/setup-menu-all`

## Production URLs

- Main: `https://rotationtv-mini-app.pages.dev`
- Erotica: `https://rotationtv-mini-app.pages.dev?bot=erotica`

## Wire routes (Hono example)

```ts
import { applyWebAppMenuButtons, getBotById, getInlineKeyboardForBot } from './lib/botGateway';
import { setWebAppMenuButton } from './lib/telegramCloudSdk';

app.post('/api/bots/:botId/setup-menu', async (c) => {
  const botId = c.req.param('botId');
  const bot = getBotById(botId);
  if (!bot?.botToken) return c.json({ error: 'BOT_NOT_REGISTERED' }, 404);
  const text = bot.isErotica || botId === 'erotica' ? 'Open Erotica' : 'Open RotationTV';
  const url = bot.webAppUrl || 'https://rotationtv-mini-app.pages.dev';
  try {
    await setWebAppMenuButton(botId, text, url);
    return c.json({ ok: true, botId, menu: { text, url } });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

app.post('/api/bots/setup-menu-all', async (c) => {
  const result = await applyWebAppMenuButtons(c.env as any);
  return c.json(result);
});
```

## After deploy

```bash
# From CI or local (secrets in env only)
TELEGRAM_BOT_TOKEN_MAIN=... TELEGRAM_BOT_TOKEN_EROTICA=... \
  node scripts/setup-webapp-menus.mjs

# Or via Worker
curl -X POST https://<worker>/api/bots/setup-menu-all
```

## Handler usage

```ts
import { getInlineKeyboardForBot } from '../lib/botGateway';

await sendMessage(chatId, welcomeText, {
  reply_markup: getInlineKeyboardForBot('erotica'),
});
```

## Test matrix

1. Menu button visible for both bots
2. Tap opens Mini App with valid `initData`
3. `/start` includes working inline WebApp button
4. Stars `openInvoice` still works inside Mini App
5. Erotica URL includes `?bot=erotica`

Entity: Darrel-spell-living-trust
