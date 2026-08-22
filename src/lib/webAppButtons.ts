/**
 * RotationTV — Inline WebApp + keyboard helpers
 * Telegram Bot API web_app buttons (no secrets in source)
 *
 * @module webAppButtons
 */

export function miniAppInlineKeyboard(
  webAppUrl: string,
  label = '🚀 Open RotationTV'
) {
  return {
    inline_keyboard: [[{ text: label, web_app: { url: webAppUrl } }]],
  };
}

export function dualActionKeyboard(webAppUrl: string, tonviewerUrl?: string) {
  const rows: Array<Array<{ text: string; web_app?: { url: string }; url?: string }>> = [
    [{ text: '🚀 Open App', web_app: { url: webAppUrl } }],
  ];
  if (tonviewerUrl) {
    rows.push([{ text: '🔍 View on Tonviewer', url: tonviewerUrl }]);
  }
  return { inline_keyboard: rows };
}

export function eroticaInlineKeyboard(
  webAppUrl = 'https://rotationtv-mini-app.pages.dev?bot=erotica'
) {
  return miniAppInlineKeyboard(webAppUrl, '🚀 Open Erotica');
}

export default {
  miniAppInlineKeyboard,
  dualActionKeyboard,
  eroticaInlineKeyboard,
};
