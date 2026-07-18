/**
 * ROTATIONTVNETWORK LLC — GIFT SEND BAR
 * Horizontal quick-send gift bar shown under the live stream viewer.
 * Fetches the real catalog from /api/gifts and only fires success feedback
 * AFTER the backend confirms — it does not animate/celebrate optimistically
 * before knowing whether the tip actually went through.
 */

import { useEffect, useState } from "react";

interface Gift {
  id: string;
  name: string;
  emoji: string;
  price_rtv: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

const FALLBACK_GIFTS: Gift[] = [
  { id: "rose", name: "Rose", emoji: "🌹", price_rtv: 10 },
  { id: "heart", name: "Heart", emoji: "❤️", price_rtv: 50 },
  { id: "diamond", name: "Diamond", emoji: "💎", price_rtv: 100 },
  { id: "lion", name: "Lion", emoji: "🦁", price_rtv: 500 },
];

export function GiftSendBar({
  onSend,
  disabled,
}: {
  onSend: (gift: Gift) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [gifts, setGifts] = useState<Gift[]>(FALLBACK_GIFTS);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/gifts`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.gifts) && d.gifts.length > 0) setGifts(d.gifts); })
      .catch(() => {}); // keep fallback catalog on failure
  }, []);

  const handleClick = async (gift: Gift) => {
    if (disabled || sendingId) return;
    setSendingId(gift.id);
    try {
      await onSend(gift);
    } finally {
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
            {sendingId === g.id ? "Sending…" : `${g.price_rtv} RTV`}
          </span>
        </button>
      ))}
    </div>
  );
}
