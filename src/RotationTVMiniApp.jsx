// ============================================
// ROTATIONTV MINI APP — Full Frontend
// Theme: $RTVS + Telegram Market Focus
// Payments: TON + Stars + Tribute + Stripe + PayPal
// DO NOT MODIFY THEME/GRAPHICS/SPECS
// ============================================

import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnect } from '@tonconnect/ui-react';

// ============================================
// LOCKED THEME — DO NOT CHANGE
// ============================================
const THEME = {
  colors: {
    primary: '#6C5CE7',
    secondary: '#A29BFE',
    accent: '#00CEC9',
    background: '#0D0D0D',
    surface: '#1A1A2E',
    card: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#B2B2B2',
    success: '#00B894',
    error: '#FF6B6B',
    warning: '#FDCB6E',
    stripe: '#635BFF',
    paypal: '#003087',
    tribute: '#FF6B35',
  },
  fonts: {
    primary: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
};

// ============================================
// TOKEN DATA
// ============================================
const RTVS_TOKEN = {
  name: 'RotationTV',
  symbol: '$RTVS',
  decimals: 9,
  contractAddress: 'EQ...',
  icon: '📺',
};

// ============================================
// PAYMENT METHODS
// ============================================
const PAYMENT_METHODS = {
  ton:     { name: 'TON Wallet',      icon: '🔷', color: '#0098EA' },
  stars:   { name: 'Telegram Stars',  icon: '⭐', color: '#FFCA28' },
  tribute: { name: 'Tribute',         icon: '🔥', color: THEME.colors.tribute },
  stripe:  { name: 'Card (Stripe)',   icon: '💳', color: THEME.colors.stripe },
  paypal:  { name: 'PayPal',          icon: '🅿️', color: THEME.colors.paypal },
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================
const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: { ton: 10, stars: 50, tribute: 9.99, stripe: 9.99, paypal: 9.99 },
    features: ['Access to channels', 'Basic support', 'Weekly updates'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { ton: 50, stars: 250, tribute: 29.99, stripe: 29.99, paypal: 29.99 },
    features: ['All Basic features', 'Priority support', 'Daily updates', 'NFT access'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { ton: 200, stars: 1000, tribute: 99.99, stripe: 99.99, paypal: 99.99 },
    features: ['All Pro features', '24/7 support', 'Custom integrations', 'API access', 'White-label'],
  },
];

// ============================================
// NAV ICONS
// ============================================
function getNavIcon(tab) {
  const icons = { home: '🏠', wallet: '💳', subscribe: '⭐', market: '📈', command: '🎛️' };
  return icons[tab] || '•';
}

// ============================================
// HOME SCREEN
// ============================================
function HomeScreen({ setActiveTab }) {
  const [price] = useState('$0.00');
  const [change] = useState('+0.00%');

  return (
    <div style={s.screen}>
      <div style={s.hero}>
        <h1 style={s.heroTitle}>
          Welcome to <span style={{ color: THEME.colors.primary }}>RotationTV</span>
        </h1>
        <p style={s.heroSub}>The future of Telegram entertainment & commerce</p>
      </div>

      {/* Token Price Card */}
      <div style={s.card}>
        <div style={s.row}>
          <span style={{ fontSize: 28 }}>{RTVS_TOKEN.icon}</span>
          <span style={s.tokenSymbol}>{RTVS_TOKEN.symbol}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Price</span>
          <span style={s.value}>{price}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>24h Change</span>
          <span style={{ ...s.value, color: THEME.colors.success }}>{change}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={s.actionGrid}>
        <button style={s.actionBtn} onClick={() => setActiveTab('wallet')}>💳 Wallet</button>
        <button style={s.actionBtn} onClick={() => setActiveTab('subscribe')}>⭐ Plans</button>
        <button style={s.actionBtn} onClick={() => setActiveTab('market')}>📈 Market</button>
        <button style={s.actionBtn} onClick={() => setActiveTab('command')}>🎛️ Control</button>
      </div>

      {/* Live Broadcast Banner */}
      <div style={s.broadcastBanner}>
        <span style={s.liveDot} />
        <span style={{ color: THEME.colors.text, fontSize: 13 }}>
          AI Hosts are live on <b>RotationTV</b>
        </span>
      </div>
    </div>
  );
}

// ============================================
// WALLET SCREEN
// ============================================
function WalletScreen() {
  const { connected, wallet } = useTonConnect();

  return (
    <div style={s.screen}>
      <h2 style={s.screenTitle}>💳 Wallet</h2>
      <div style={s.card}>
        {connected ? (
          <>
            <p style={s.label}>Connected</p>
            <p style={{ ...s.value, fontSize: 12, wordBreak: 'break-all' }}>
              {wallet?.account?.address || 'Loading...'}
            </p>
          </>
        ) : (
          <p style={s.label}>Connect your TON wallet to continue</p>
        )}
        <div style={{ marginTop: 16 }}>
          <TonConnectButton />
        </div>
      </div>

      {connected && (
        <div style={s.card}>
          <div style={s.row}>
            <span style={s.label}>{RTVS_TOKEN.symbol} Balance</span>
            <span style={s.value}>0.00</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>TON Balance</span>
            <span style={s.value}>0.00</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUBSCRIBE SCREEN
// ============================================
function SubscribeScreen({ onSelectPlan }) {
  const [selectedMethod, setSelectedMethod] = useState('stripe');

  return (
    <div style={s.screen}>
      <h2 style={s.screenTitle}>⭐ Subscription Plans</h2>

      {/* Payment Method Selector */}
      <div style={s.methodRow}>
        {Object.entries(PAYMENT_METHODS).map(([key, m]) => (
          <button
            key={key}
            style={{
              ...s.methodBtn,
              border: selectedMethod === key
                ? `2px solid ${m.color}`
                : `1px solid ${THEME.colors.surface}`,
            }}
            onClick={() => setSelectedMethod(key)}
          >
            <span>{m.icon}</span>
            <span style={{ fontSize: 9, color: THEME.colors.textSecondary }}>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Plan Cards */}
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          style={{
            ...s.card,
            border: plan.popular
              ? `2px solid ${THEME.colors.primary}`
              : `1px solid ${THEME.colors.surface}`,
          }}
        >
          {plan.popular && (
            <div style={s.popularBadge}>⭐ Most Popular</div>
          )}
          <div style={s.row}>
            <span style={{ ...s.value, fontSize: 18 }}>{plan.name}</span>
            <span style={{ color: THEME.colors.accent, fontWeight: 700 }}>
              {PAYMENT_METHODS[selectedMethod]?.icon}{' '}
              {selectedMethod === 'stars'
                ? `${plan.price.stars} Stars`
                : selectedMethod === 'ton'
                ? `${plan.price.ton} TON`
                : `$${plan.price[selectedMethod]}/mo`}
            </span>
          </div>
          {plan.features.map((f) => (
            <p key={f} style={s.feature}>✓ {f}</p>
          ))}
          <button
            style={s.ctaBtn}
            onClick={() => onSelectPlan({ ...plan, selectedMethod })}
          >
            Get {plan.name}
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// CHECKOUT SCREEN
// ============================================
function CheckoutScreen({ selectedPlan, paymentMethod, setPaymentMethod, onBack }) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    // TODO: Connect to Stripe / PayPal / Tribute / TON / Stars SDK
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div style={s.screen}>
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <span style={{ fontSize: 64 }}>✅</span>
          <h2 style={{ color: THEME.colors.success, fontFamily: THEME.fonts.primary }}>
            Payment Successful!
          </h2>
          <p style={{ color: THEME.colors.textSecondary }}>
            Welcome to RotationTV {selectedPlan?.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <button style={s.backBtn} onClick={onBack}>← Back</button>
      <h2 style={s.screenTitle}>💳 Checkout</h2>

      {selectedPlan && (
        <div style={s.card}>
          <div style={s.row}>
            <span style={s.label}>Plan</span>
            <span style={s.value}>{selectedPlan.name}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>Payment</span>
            <span style={s.value}>
              {PAYMENT_METHODS[selectedPlan.selectedMethod]?.icon}{' '}
              {PAYMENT_METHODS[selectedPlan.selectedMethod]?.name}
            </span>
          </div>
        </div>
      )}

      <button
        style={{ ...s.ctaBtn, opacity: processing ? 0.6 : 1 }}
        onClick={handlePayment}
        disabled={processing}
      >
        {processing ? 'Processing...' : 'Confirm & Pay'}
      </button>
    </div>
  );
}

// ============================================
// MARKET SCREEN
// ============================================
function MarketScreen() {
  const [tokens] = useState([
    { symbol: 'TON',  price: '$--', change: '--' },
    { symbol: '$RTVS', price: '$--', change: '--' },
    { symbol: 'NOT',  price: '$--', change: '--' },
    { symbol: 'DOGS', price: '$--', change: '--' },
  ]);

  return (
    <div style={s.screen}>
      <h2 style={s.screenTitle}>📈 Market</h2>
      {tokens.map((t) => (
        <div key={t.symbol} style={s.card}>
          <div style={s.row}>
            <span style={s.value}>{t.symbol}</span>
            <span style={s.value}>{t.price}</span>
            <span style={{ color: THEME.colors.success, fontSize: 13 }}>{t.change}</span>
          </div>
        </div>
      ))}
      <p style={{ color: THEME.colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
        Live prices coming soon via DeDust / STON.fi
      </p>
    </div>
  );
}

// ============================================
// COMMAND CENTER
// ============================================
function CommandCenter() {
  return (
    <div style={s.screen}>
      <h2 style={s.screenTitle}>🎛️ Command Center</h2>
      <div style={s.card}>
        <p style={s.label}>Broadcast Controls</p>
        <button style={s.commandBtn}>🔴 Go Live</button>
        <button style={s.commandBtn}>📡 Schedule Broadcast</button>
        <button style={s.commandBtn}>🤖 AI Hosts Dashboard</button>
      </div>
      <div style={s.card}>
        <p style={s.label}>Token Controls</p>
        <button style={s.commandBtn}>🔷 Send $RTVS</button>
        <button style={s.commandBtn}>📊 Analytics</button>
      </div>
    </div>
  );
}

// ============================================
// MAIN MINI APP
// ============================================
export default function RotationTVMiniApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.logo}>
          <span style={{ fontSize: 22 }}>📺</span>
          <span style={s.logoText}>RotationTV</span>
        </div>
        <TonConnectButton />
      </header>

      <main style={s.main}>
        {activeTab === 'home' && <HomeScreen setActiveTab={setActiveTab} />}
        {activeTab === 'wallet' && <WalletScreen />}
        {activeTab === 'market' && <MarketScreen />}
        {activeTab === 'command' && <CommandCenter />}
        {activeTab === 'subscribe' && (
          <SubscribeScreen
            onSelectPlan={(plan) => {
              setSelectedPlan(plan);
              setActiveTab('checkout');
            }}
          />
        )}
        {activeTab === 'checkout' && (
          <CheckoutScreen
            selectedPlan={selectedPlan}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onBack={() => setActiveTab('subscribe')}
          />
        )}
      </main>

      <nav style={s.nav}>
        {['home', 'wallet', 'subscribe', 'market', 'command'].map((tab) => (
          <button
            key={tab}
            style={{
              ...s.navBtn,
              color: activeTab === tab ? THEME.colors.primary : THEME.colors.textSecondary,
              borderTop: activeTab === tab ? `2px solid ${THEME.colors.primary}` : '2px solid transparent',
            }}
            onClick={() => setActiveTab(tab)}
          >
            <span style={{ fontSize: 18 }}>{getNavIcon(tab)}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============================================
// STYLES — LOCKED TO RTVS THEME
// ============================================
const s = {
  container: {
    backgroundColor: THEME.colors.background,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: THEME.fonts.primary,
    maxWidth: 480,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: THEME.colors.surface,
    borderBottom: `1px solid ${THEME.colors.card}`,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoText: {
    color: THEME.colors.text,
    fontWeight: 700,
    fontSize: 18,
    fontFamily: THEME.fonts.primary,
  },
  main: { flex: 1, overflowY: 'auto' },
  nav: {
    display: 'flex',
    backgroundColor: THEME.colors.surface,
    borderTop: `1px solid ${THEME.colors.card}`,
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: THEME.fonts.primary,
    textTransform: 'capitalize',
  },
  screen: { padding: 16 },
  hero: { marginBottom: 20, textAlign: 'center' },
  heroTitle: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 8px',
  },
  heroSub: { color: THEME.colors.textSecondary, fontSize: 14, margin: 0 },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    border: `1px solid ${THEME.colors.surface}`,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { color: THEME.colors.textSecondary, fontSize: 13, margin: 0 },
  value: { color: THEME.colors.text, fontWeight: 600, fontSize: 14 },
  tokenSymbol: {
    color: THEME.colors.primary,
    fontWeight: 700,
    fontSize: 20,
    fontFamily: THEME.fonts.mono,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.text,
    border: `1px solid ${THEME.colors.card}`,
    borderRadius: THEME.borderRadius.md,
    padding: '14px 0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: THEME.fonts.primary,
  },
  broadcastBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: '10px 16px',
    border: `1px solid ${THEME.colors.error}33`,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: THEME.colors.error,
    display: 'inline-block',
  },
  screenTitle: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: 700,
    margin: '0 0 16px',
  },
  methodRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 16,
    overflowX: 'auto',
  },
  methodBtn: {
    backgroundColor: THEME.colors.card,
    color: THEME.colors.text,
    borderRadius: THEME.borderRadius.sm,
    padding: '8px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    minWidth: 60,
    fontFamily: THEME.fonts.primary,
    fontSize: 18,
  },
  popularBadge: {
    backgroundColor: THEME.colors.primary,
    color: THEME.colors.text,
    borderRadius: THEME.borderRadius.sm,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    display: 'inline-block',
  },
  feature: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    margin: '4px 0',
  },
  ctaBtn: {
    backgroundColor: THEME.colors.primary,
    color: THEME.colors.text,
    border: 'none',
    borderRadius: THEME.borderRadius.md,
    padding: '14px 0',
    width: '100%',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 12,
    fontFamily: THEME.fonts.primary,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: THEME.colors.secondary,
    cursor: 'pointer',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: THEME.fonts.primary,
  },
  commandBtn: {
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.text,
    border: `1px solid ${THEME.colors.card}`,
    borderRadius: THEME.borderRadius.sm,
    padding: '12px 16px',
    width: '100%',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 8,
    fontFamily: THEME.fonts.primary,
  },
};
