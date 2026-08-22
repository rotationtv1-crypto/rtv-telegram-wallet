declare global {
  interface Window {
    Telegram?: { WebApp: any };
  }
}

/**
 * Send structured data from the Mini App back to the bot via sendData.
 * Telegram limit: 4096 bytes. Closes the Mini App after send.
 */
export function sendMiniAppData(payload: Record<string, any> | string): boolean {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  if (!tg?.sendData) {
    console.warn('[RTV] Telegram.WebApp.sendData not available');
    return false;
  }

  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (data.length > 4096) {
    console.error('[RTV] sendData payload exceeds 4096 bytes');
    return false;
  }

  tg.sendData(data);
  try {
    tg.close();
  } catch {
    // ignore
  }
  return true;
}

export function useTelegram() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
}
