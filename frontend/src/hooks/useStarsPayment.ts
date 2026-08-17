import { useState, useCallback } from 'react';

interface StarsItem {
  id: string;
  label: string;
  stars: number;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

export function useStarsPayment() {
  const [paying, setPaying] = useState(false);
  const tg = (window as any).Telegram?.WebApp;

  const pay = useCallback(async (item: StarsItem): Promise<string> => {
    if (paying) return 'busy';
    setPaying(true);
    try {
      const res = await fetch(`${API_BASE}/api/stars/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gift', item_id: item.id, stars_amount: item.stars, title: item.label }),
      });
      const data = await res.json();
      if (!data.ok || !data.invoice_url) { setPaying(false); return 'error'; }
      if (tg?.openInvoice) {
        return new Promise<string>((resolve) => {
          tg.openInvoice(data.invoice_url, (result: string) => {
            setPaying(false);
            resolve(result);
          });
        });
      } else {
        window.open(data.invoice_url, '_blank');
        setPaying(false);
        return 'opened';
      }
    } catch { setPaying(false); return 'error'; }
  }, [paying, tg]);

  return { pay, paying };
}
