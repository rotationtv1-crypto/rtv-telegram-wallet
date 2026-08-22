/** Telegram Mini App -> bot bridge helpers. */

export const TELEGRAM_WEB_APP_MAX_BYTES = 4096;

type TelegramWebApp = {
  sendData?: (data: string) => void;
  close?: () => void;
};

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

/**
 * Sends a compact event to the bot. Telegram limits sendData payloads to 4096
 * UTF-8 bytes; oversized payloads close gracefully instead of throwing.
 */
export function sendMiniAppData(
  type: string,
  payload: Record<string, unknown> = {}
): boolean {
  const tg = (globalThis as any).Telegram?.WebApp as TelegramWebApp | undefined;
  if (!tg?.sendData) {
    tg?.close?.();
    return false;
  }

  const data = JSON.stringify({ type, ...payload });
  if (byteLength(data) > TELEGRAM_WEB_APP_MAX_BYTES) {
    tg.close?.();
    return false;
  }

  try {
    tg.sendData(data);
    tg.close?.();
    return true;
  } catch {
    tg.close?.();
    return false;
  }
}
