import { useState } from 'react';
import { GIFTS, THEME } from '../constants';
import { useStarsPayment } from '../hooks/useStarsPayment';
import { useStore } from '../store/useStore';

interface GiftBarProps {
  onClose: () => void;
}

export function GiftBar({ onClose }: GiftBarProps) {
  const { pay, paying } = useStarsPayment();
  const { showToast, incrementGiftsSent, addSpent, selectedHost } = useStore();

  const handleSend = async (gift: typeof GIFTS[0]) => {
    const result = await pay(gift);
    if (result === 'paid') {
      showToast(`Sent ${gift.label} ⭐`);
      incrementGiftsSent();
      addSpent(gift.stars);
    } else if (result === 'error') {
      showToast('Payment failed');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        overflowX: 'auto',
        background: 'rgba(13,13,13,0.95)',
        borderTop: `1px solid ${THEME.borderActive}`,
      }}
    >
      {GIFTS.map((g) => (
        <button
          key={g.id}
          disabled={paying}
          onClick={() => handleSend(g)}
          style={{
            minWidth: 56,
            padding: '6px 8px',
            borderRadius: THEME.radius.md,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${THEME.borderActive}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            cursor: paying ? 'wait' : 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>{g.label.split(' ')[0]}</span>
          <span style={{ fontSize: 9, color: THEME.accent2, fontWeight: 700 }}>
            {paying ? '...' : `${g.stars} ⭐`}
          </span>
        </button>
      ))}
      <button
        onClick={onClose}
        style={{
          minWidth: 56,
          padding: '6px 8px',
          borderRadius: THEME.radius.md,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${THEME.error}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: THEME.error,
        }}
      >
        ✕
      </button>
    </div>
  );
}
