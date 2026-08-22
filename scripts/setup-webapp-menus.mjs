/**
 * One-shot: setChatMenuButton for main + erotica.
 * Pure Node — no TypeScript imports. Tokens from process.env only.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN_MAIN=... TELEGRAM_BOT_TOKEN_EROTICA=... \
 *     node scripts/setup-webapp-menus.mjs
 *
 * Also accepts TELEGRAM_BOT_TOKEN_6 / _7 (Worker binding names).
 * Optional:
 *   MINI_APP_URL=https://rotationtv-mini-app.pages.dev
 */

const MAIN_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN_MAIN || process.env.TELEGRAM_BOT_TOKEN_6;
const EROTICA_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN_EROTICA || process.env.TELEGRAM_BOT_TOKEN_7;
const BASE =
  process.env.MINI_APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://rotationtv-mini-app.pages.dev';

if (!MAIN_TOKEN && !EROTICA_TOKEN) {
  console.error(
    '❌ Set TELEGRAM_BOT_TOKEN_MAIN (or _6) and/or TELEGRAM_BOT_TOKEN_EROTICA (or _7)'
  );
  process.exit(1);
}

async function setMenu(token, text, url) {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setChatMenuButton`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text,
          web_app: { url },
        },
      }),
    }
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || JSON.stringify(data));
  }
  return data;
}

async function main() {
  let errors = 0;

  if (MAIN_TOKEN) {
    try {
      await setMenu(MAIN_TOKEN, 'Open RotationTV', BASE);
      console.log('✅ main menu button OK →', BASE);
    } catch (e) {
      errors++;
      console.error('❌ main failed:', e.message || e);
    }
  }

  if (EROTICA_TOKEN) {
    const eroticaUrl = `${BASE}${BASE.includes('?') ? '&' : '?'}bot=erotica`.replace(
      /\?bot=erotica\?bot=erotica/,
      '?bot=erotica'
    );
    // Prefer explicit query form
    const url = BASE.includes('bot=erotica')
      ? BASE
      : `${BASE.split('?')[0]}?bot=erotica`;
    try {
      await setMenu(EROTICA_TOKEN, 'Open Erotica', url);
      console.log('✅ erotica menu button OK →', url);
    } catch (e) {
      errors++;
      console.error('❌ erotica failed:', e.message || e);
    }
  }

  if (errors) process.exit(1);
  console.log('✨ All configured menu buttons OK.');
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
