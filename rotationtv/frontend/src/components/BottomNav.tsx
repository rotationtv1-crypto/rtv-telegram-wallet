import { NAV_ITEMS, THEME } from '../constants';
import { useStore } from '../store/useStore';

export function BottomNav() {
  const { tab, setTab } = useStore();

  return (
    <div
      style={{
        display: 'flex',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        background: THEME.surface,
        borderTop: `1px solid ${THEME.borderActive}`,
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t.key ? THEME.accent2 : THEME.textSecondary,
          }}
        >
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
