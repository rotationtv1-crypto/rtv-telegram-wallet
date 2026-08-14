import { SUBSCRIPTIONS, THEME } from '../constants';
import { useStarsPayment } from '../hooks/useStarsPayment';
import { useStore } from '../store/useStore';

interface SubscribeModalProps {
  onClose: () => void;
}

export function SubscribeModal({ onClose }: SubscribeModalProps) {
  const { pay, paying } = useStarsPayment();
  const { showToast, setSubscription, addSpent } = useStore();

  const handleSubscribe = async (sub: typeof SUBSCRIPTIONS[0]) => {
    const result = await pay({ id: sub.id, label: sub.label, stars: sub.stars } as any);
    if (result === 'paid') {
      showToast(`Subscribed to ${sub.label}! ⭐`);
      setSubscription(sub.id as any);
      addSpent(sub.stars);
      onClose();
    } else if (result === 'error') {
      showToast('Payment failed');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.surface, borderRadius: THEME.radius.lg, padding: 20,
          width: '90%', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Choose Your Plan</div>
        {SUBSCRIPTIONS.map((s) => (
          <div
            key={s.id}
            style={{
              background: THEME.card, borderRadius: THEME.radius.md, padding: 14,
              margin: '8px 0', border: `1px solid ${THEME.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 10, color: THEME.textSecondary }}>{s.hosts}</div>
                <div style={{ fontSize: 10, color: THEME.textSecondary }}>{s.perks.join(' • ')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: THEME.accent2 }}>{s.stars}</div>
                <div style={{ fontSize: 10, color: THEME.textSecondary }}>Stars/mo</div>
                <button
                  onClick={() => handleSubscribe(s)}
                  disabled={paying}
                  style={{
                    marginTop: 6, padding: '6px 12px', borderRadius: THEME.radius.sm,
                    border: 'none', background: s.color, color: '#fff',
                    fontSize: 11, fontWeight: 700, cursor: paying ? 'wait' : 'pointer',
                    opacity: paying ? 0.5 : 1,
                  }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: 12, width: '100%', padding: 10, borderRadius: THEME.radius.md,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: THEME.textSecondary, fontSize: 13, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
