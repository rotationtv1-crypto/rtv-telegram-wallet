/**
 * RotationTV — Inline WebApp + menu button helpers
 * Telegram Bot API web_app payloads (no secrets in source)
 *
 * @module webAppButtons
 */

export interface WebAppButtonOptions {
  text: string;
  url: string;
}

/** Payload for setChatMenuButton (persistent bottom-left launcher) */
export function createWebAppMenuButton(options: WebAppButtonOptions) {
  return {
    type: 'web_app' as const,
    text: options.text,
    web_app: { url: options.url },
  };
}

/** Inline keyboard with a single web_app button */
export function createInlineWebAppKeyboard(options: WebAppButtonOptions) {
  return {
    inline_keyboard: [
      [
        {
          text: options.text,
          web_app: { url: options.url },
        },
      ],
    ],
  };
}

/** Alias used by handlers */
export function miniAppInlineKeyboard(
  webAppUrl: string,
  label = '🚀 Open RotationTV'
) {
  return createInlineWebAppKeyboard({ text: label, url: webAppUrl });
}

export function dualActionKeyboard(webAppUrl: string, tonviewerUrl?: string) {
  const rows: Array<
    Array<{ text: string; web_app?: { url: string }; url?: string }>
  > = [[{ text: '🚀 Open App', web_app: { url: webAppUrl } }]];
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
  createWebAppMenuButton,
  createInlineWebAppKeyboard,
  miniAppInlineKeyboard,
  dualActionKeyboard,
  eroticaInlineKeyboard,
};
