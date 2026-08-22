/**
 * One-shot: setChatMenuButton for main + erotica bots.
 * Reads tokens from process.env only — never hardcode secrets.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN_MAIN=... TELEGRAM_BOT_TOKEN_EROTICA=... node scripts/setup-webapp-menus.mjs
 *
 * Optional:
 *   MINI_APP_URL=https://rotationtv-mini-app.pages.dev
 */

const MAIN_TOKEN = process.env.TELEGRAM_BOT_TOKEN_MAIN || process.env.TELEGRAM_BOT_TOKEN_6;
const EROTICA_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN_EROTICA || process.env.TELEGRAM_BOT_TOKEN_7;
const BASE = process.env.MINI_APP_URL || 'https://rotationtv-mini-app.pages.dev';

if (!MAIN_TOKEN || !EROTICA_TOKEN) {
  console.error(
    'Set TELEGRAM_BOT_TOKEN_MAIN (or _6) and TELEGRAM_BOT_TOKEN_EROTICA (or _7)'
  );
  process.exit(1);
}

async function setMenu(token, text, url) {
  const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text,
        web_app: { url },
      },
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || JSON.stringify(data));
  }
  return data;
}

async function main() {
  await setMenu(MAIN_TOKEN, 'Open RotationTV', BASE);
  console.log('main menu button OK →', BASE);
  await setMenu(EROTICA_TOKEN, 'Open Erotica', `${BASE}?bot=erotica`);
  console.log('erotica menu button OK →', `${BASE}?bot=erotica`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
