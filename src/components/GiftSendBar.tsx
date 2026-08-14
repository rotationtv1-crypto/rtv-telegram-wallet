/**
 * ROTATIONTVNETWORK LLC — GIFT SEND BAR (Stars Edition)
 * ONLY accepts Telegram Stars (XTR) — no RTV token, no third-party gateways
 * Uses WebApp.openInvoice() for native Telegram payment flow
 */

import { useEffect, useState } from "react";

interface Gift {
  id: string;
  name: string;
  emoji: string;
  stars: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Stars catalog — these are the ONLY accepted payments
const STARS_GIFTS: Gift[] = [
  { id: "rose", name: "Rose", emoji: "🌹", stars: 1 },
  { id: "beer", name: "Beer", emoji: "🍺", stars: 5 },
  { id: "fire", name: "Fire", emoji: "🔥", stars: 10 },
  { id: "diamond", name: "Diamond", emoji: "💎", stars: 50 },
  { id: "rocket", name: "Rocket", emoji: "🚀", stars: 100 },
  { id: "crown", name: "Crown", emoji: "👑", stars: 500 },
];

export function GiftSendBar({
  onSend,
  disabled,
  streamId,
}: {
  onSend: (gift: Gift) => void | Promise<void>;
  disabled?: boolean;
  streamId?: string;
}) {
  const [gifts, setGifts] = useState<Gift[]>(STARS_GIFTS);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [tgWebApp, setTgWebApp] = useState<any>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      setTgWebApp(tg);
      // Listen for invoice closed events
      tg.onEvent('invoiceClosed', (data: any) => {
        if (data.status === 'paid') {
          const gift = STARS_GIFTS.find(g => g.id === sendingId);
          if (gift) onSend(gift);
        }
        setSendingId(null);
      });
    }

    // Fetch stars catalog from backend
    fetch(`${API_BASE}/api/gifts`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.gifts) && d.gifts.length > 0 && d.gifts[0].stars !== undefined) {
          setGifts(d.gifts);
        }
      })
      .catch(() => {});
  }, []);

  const handleClick = async (gift: Gift) => {
    if (disabled || sendingId) return;
    setSendingId(gift.id);

    try {
      // Request invoice link from backend
      const res = await fetch(`${API_BASE}/api/stars/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gift",
          item_id: gift.id,
          stream_id: streamId,
        }),
      });
      const data = await res.json();

      if (data.ok && data.invoice_url && tgWebApp) {
        // Open native Telegram Stars payment
        tgWebApp.openInvoice(data.invoice_url, (result: string) => {
          if (result === 'paid') {
            onSend(gift);
          }
          setSendingId(null);
        });
      } else if (data.ok && !tgWebApp) {
        // Fallback: open in browser (not in Telegram context)
        window.open(data.invoice_url, '_blank');
        setSendingId(null);
      } else {
        console.error('Invoice creation failed:', data.error);
        setSendingId(null);
      }
    } catch (e) {
      console.error('Payment error:', e);
      setSendingId(null);
    }
  };

  return (
    <div
      className="flex gap-2 px-3 py-2 overflow-x-auto"
      style={{
        background: "rgba(13,13,13,0.9)",
        borderTop: "1px solid rgba(108,92,231,0.25)",
      }}
    >
      {gifts.map((g) => (
        <button
          key={g.id}
          disabled={disabled || sendingId !== null}
          onClick={() => handleClick(g)}
          className="flex flex-col items-center justify-center flex-shrink-0"
          style={{
            minWidth: 64,
            padding: "6px 8px",
            borderRadius: 12,
            background: sendingId === g.id ? "rgba(108,92,231,0.25)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(108,92,231,0.3)",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: 22 }}>{g.emoji}</span>
          <span style={{ color: "#A29BFE", fontSize: 10, fontWeight: 700, marginTop: 2 }}>
            {sendingId === g.id ? "Pay…" : `${g.stars} ⭐`}
          </span>
        </button>
      ))}
    </div>
  );
}
