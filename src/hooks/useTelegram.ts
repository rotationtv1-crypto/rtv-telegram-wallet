declare global {
  interface Window {
    Telegram?: { WebApp: any };
  }
}

export function useTelegram() {
  return typeof window !== "undefined" ? window.Telegram?.WebApp : null;
}
