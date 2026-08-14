import { useStore } from '../store/useStore';
import { THEME } from '../constants';

export function WalletScreen() {
  const { starsBalance, subscription, toggleSubscribe } = useStore();

  const paymentMethods = [
    { icon: '⭐', name: 'Telegram Stars', status: 'Active', color: THEME.success },
    { icon: '💎', name: 'USDT (TON Connect)', status: 'Active', color: THEME.success },
    { icon: '🪙', name: 'RTV Token', status: 'Purged', color: THEME.error, strikethrough: true },
    { icon: '💳', name: 'Stripe', status: 'Purged', color: THEME.error, strikethrough: true },
    { icon: '💰', name: 'PayPal', status: 'Purged', color: THEME.error, strikethrough: true },
  ];

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Balance Card */}
      <div style={{ background: THEME.card, borderRadius: THEME.radius.lg, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: THEME.textSecondary }}>Your Stars Balance</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: THEME.accent2, margin: '8px 0' }}>
          ⭐ {starsBalance.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: THEME.textSecondary }}>Telegram Stars · 1 ⭐ ≈ $0.013</div>
        {subscription !== 'free' && (
          <div style={{
            marginTop: 8, display: 'inline-block',
            padding: '4px 12px', borderRadius: 20,
            background: `${THEME.success}20`, color: THEME.success,
            fontSize: 10, fontWeight: 700,
          }}>
            {subscription.toUpperCase()} TIER
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>
        PAYMENT METHODS
      </div>
      <div style={{ background: THEME.card, borderRadius: THEME.radius.md, padding: 14, marginTop: 8 }}>
        {paymentMethods.map((m, i) => (
          <div
            key={m.name}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderTop: i > 0 ? `1px solid rgba(255,255,255,0.05)` : 'none',
            }}
          >
            <span style={{ fontSize: 13, textDecoration: m.strikethrough ? 'line-through' : 'none', color: m.strikethrough ? THEME.error : THEME.text }}>
              {m.icon} {m.name}
            </span>
            <span style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.status}</span>
          </div>
        ))}
      </div>

      {/* Upgrade Button */}
      <button
        onClick={() => toggleSubscribe(true)}
        style={{
          marginTop: 16, width: '100%', padding: 14, borderRadius: THEME.radius.md,
          border: 'none', background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}
      >
        ⭐ Upgrade Subscription
      </button>

      {/* Transaction History */}
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>
        TRANSACTION HISTORY
      </div>
      <div style={{ background: THEME.card, borderRadius: THEME.radius.md, padding: 20, marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 24, opacity: 0.3 }}>🧾</div>
        <div style={{ fontSize: 12, color: THEME.textSecondary, marginTop: 8 }}>No transactions yet</div>
      </div>

      <div style={{ marginTop: 12, fontSize: 9, color: THEME.textSecondary, textAlign: 'center' }}>
        Entity: Darrel-spell-living-trust
      </div>
    </div>
  );
}
