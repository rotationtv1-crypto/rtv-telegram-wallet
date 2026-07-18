/**
 * Telegram WebApp SDK hook
 * Wraps window.Telegram.WebApp for React
 */

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [initData, setInitData] = useState<string>('');
  const [startParam, setStartParam] = useState<string>('');

  useEffect(() => {
    const WebApp = window.Telegram?.WebApp;
    if (!WebApp) return;

    WebApp.ready();
    WebApp.expand();
    WebApp.enableClosingConfirmation();

    setTg(WebApp);
    setUser(WebApp.initDataUnsafe?.user || null);
    setInitData(WebApp.initData || '');
    setStartParam(WebApp.initDataUnsafe?.start_param || '');

    // Set theme
    const colorScheme = WebApp.colorScheme || 'dark';
    WebApp.setHeaderColor(colorScheme === 'dark' ? '#0D0D0D' : '#FFFFFF');
    WebApp.setBackgroundColor(colorScheme === 'dark' ? '#0D0D0D' : '#FFFFFF');
  }, []);

  return { tg, user, initData, startParam };
}
