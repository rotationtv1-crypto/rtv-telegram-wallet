import { useStore } from '../store/useStore';
import { THEME } from '../constants';

export function ProfileScreen() {
  const { user, giftsSent, streamsWatched, totalSpent, aiChats, subscription } = useStore();

  const stats = [
    { icon: '🎁', label: 'Gifts sent', value: giftsSent },
    { icon: '📺', label: 'Streams watched', value: streamsWatched },
    { icon: '⭐', label: 'Total spent', value: totalSpent },
    { icon: '🤖', label: 'AI chats', value: aiChats },
  ];

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* User Card */}
      <div style={{ background: THEME.card, borderRadius: THEME.radius.lg, padding: 20, textAlign: 'center' }}>
        {user?.photo_url ? (
          <img src={user.photo_url} style={{ width: 64, height: 64, borderRadius: 32 }} alt="avatar" />
        ) : (
          <div style={{ fontSize: 40 }}>👤</div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>
          {user?.first_name || 'RotationTV'} {user?.last_name || 'Viewer'}
        </div>
        <div style={{ fontSize: 11, color: THEME.textSecondary }}>@{user?.username || 'guest'}</div>
        <div style={{
          display: 'inline-block', marginTop: 6, padding: '3px 10px',
          borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: subscription === 'free' ? 'rgba(178,178,178,0.15)' : `${THEME.accent}20`,
          color: subscription === 'free' ? THEME.textSecondary : THEME.accent2,
        }}>
          {subscription.toUpperCase()} TIER · ⭐ {totalSpent}
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>ACTIVITY</div>
      <div style={{ background: THEME.card, borderRadius: THEME.radius.md, padding: 14, marginTop: 8 }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <span style={{ fontSize: 12 }}>{s.icon} {s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: THEME.accent2 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>SETTINGS</div>
      <div style={{ background: THEME.card, borderRadius: THEME.radius.md, padding: 14, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <span style={{ fontSize: 12 }}>🔔 Notifications</span>
          <span style={{ fontSize: 10, color: THEME.success }}>On</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 12 }}>🌙 Dark mode</span>
          <span style={{ fontSize: 10, color: THEME.success }}>Always</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 12 }}>🌐 Language</span>
          <span style={{ fontSize: 10, color: THEME.textSecondary }}>English</span>
        </div>
      </div>

      {/* About */}
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>ABOUT</div>
      <div style={{ background: THEME.card, borderRadius: THEME.radius.md, padding: 14, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.6 }}>
          RotationTV Network — AI-powered live streaming with 6 virtual hosts.
          Telegram native payments only (Stars + USDT).
          Revenue split: 80% creator / 15% platform / 5% agency.
        </div>
        <div style={{ fontSize: 9, color: THEME.textSecondary, marginTop: 8 }}>
          Entity: Darrel-spell-living-trust · v7.0.0
        </div>
      </div>
    </div>
  );
}
