import { useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useStore } from './store/useStore';
import { THEME } from './constants';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { StreamScreen } from './screens/StreamScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { GiftBar } from './components/GiftBar';
import { SubscribeModal } from './components/SubscribeModal';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';

export default function App() {
  const { tg, user, initData, startParam } = useTelegram();
  const {
    tab, setTelegramData, showGiftBar, toggleGiftBar,
    showSubscribe, toggleSubscribe,
  } = useStore();

  // Initialize Telegram + store
  useEffect(() => {
    if (tg) {
      tg.expand();
      tg.ready();
      tg.setHeaderColor?.('#0D0D0D');
      tg.setBackgroundColor?.('#0D0D0D');
    }
    if (user) {
      setTelegramData(user, initData, startParam);
    }
  }, [tg, user, initData, startParam, setTelegramData]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: 60,
        background: THEME.bg,
        color: THEME.text,
        fontFamily: THEME.font,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${THEME.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: THEME.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: THEME.radius.sm,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: '#fff',
              background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>RotationTV</div>
            <div style={{ fontSize: 10, color: THEME.textSecondary }}>
              {user ? `@${user.username || 'viewer'}` : 'Network'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: THEME.teal, fontSize: 12, fontWeight: 600 }}>⭐ Stars</span>
        </div>
      </div>

      {/* Screen Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'discover' && <DiscoverScreen />}
        {tab === 'stream' && <StreamScreen />}
        {tab === 'wallet' && <WalletScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </div>

      {/* Gift Bar */}
      {showGiftBar && <GiftBar onClose={() => toggleGiftBar(false)} />}

      {/* Subscribe Modal */}
      {showSubscribe && <SubscribeModal onClose={() => toggleSubscribe(false)} />}

      {/* Toast */}
      <Toast />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
