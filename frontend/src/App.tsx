import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useStarsPayment } from './hooks/useStarsPayment';
import { decodeState } from './utils/base44';
import { sendChat, fetchLiveStreams } from './services/api';

const THEME = {
  bg: '#0D0D0D', surface: '#1A1A2E', card: '#16213E', text: '#FFFFFF',
  textSecondary: '#B2B2B2', accent: '#6C5CE7', accent2: '#A29BFE',
  teal: '#00CEC9', success: '#00B894', error: '#FF6B6B', warning: '#FDCB6E',
};

const AI_HOSTS = [
  { id: 'leo', name: 'LEO', role: 'Anchor', emoji: '🎙️', color: '#6C5CE7', rate: 100 },
  { id: 'maya', name: 'MAYA', role: 'Energetic', emoji: '⚡', color: '#A29BFE', rate: 100 },
  { id: 'reed', name: 'DR. REED', role: 'Analyst', emoji: '📊', color: '#00CEC9', rate: 150 },
  { id: 'zara', name: 'ZARA', role: 'Wildcard', emoji: '🔥', color: '#FF6B6B', rate: 130 },
  { id: 'omar', name: 'OMAR', role: 'Chill', emoji: '🌊', color: '#00B894', rate: 80 },
  { id: 'lina', name: 'LINA', role: 'Co-Host', emoji: '✨', color: '#FDCB6E', rate: 100 },
];

const GIFTS = [
  { id: 'rose', label: '🌹 Rose', stars: 1 },
  { id: 'beer', label: '🍺 Beer', stars: 5 },
  { id: 'fire', label: '🔥 Fire', stars: 10 },
  { id: 'diamond', label: '💎 Diamond', stars: 50 },
  { id: 'rocket', label: '🚀 Rocket', stars: 100 },
  { id: 'crown', label: '👑 Crown', stars: 500 },
];

const SUBSCRIPTIONS = [
  { id: 'basic', label: 'Basic', hosts: '1 Host', stars: 100, perks: ['1 AI Host','Standard quality','Chat access'] },
  { id: 'pro', label: 'Pro', hosts: '3 Hosts', stars: 300, perks: ['3 AI Hosts','HD quality','Priority chat','Gift sending'] },
  { id: 'enterprise', label: 'Enterprise', hosts: 'All 6 Hosts', stars: 999, perks: ['All 6 AI Hosts','4K quality','VIP chat','Custom requests','No ads'] },
];

type Tab = 'discover' | 'wallet' | 'stream' | 'profile';
interface Message { role: 'user'|'agent'; text: string; timestamp: number; }

export default function App() {
  const { tg, user, initData, startParam } = useTelegram();
  const { pay, paying } = useStarsPayment();
  const [tab, setTab] = useState<Tab>('discover');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streams, setStreams] = useState<any[]>([]);
  const [selectedHost, setSelectedHost] = useState<string|null>(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showGiftBar, setShowGiftBar] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => {
    if (tg) { tg.expand(); tg.ready(); tg.setHeaderColor?.('#0D0D0D'); tg.setBackgroundColor?.('#0D0D0D'); }
  }, [tg]);

  useEffect(() => {
    fetchLiveStreams().then(data => {
      if (data?.streams) setStreams(data.streams);
      else setStreams(AI_HOSTS.map(h => ({ ...h, live: false, viewers: 0 })));
    }).catch(() => setStreams(AI_HOSTS.map(h => ({ ...h, live: false, viewers: 0 }))));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); tg?.HapticFeedback?.notificationOccurred('success'); };

  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    const result = await pay(gift);
    if (result === 'paid') showToast(`Sent ${gift.label} ⭐`);
  };

  const handleSubscribe = async (sub: typeof SUBSCRIPTIONS[0]) => {
    const result = await pay({ id: sub.id, label: sub.label, stars: sub.stars } as any);
    if (result === 'paid') { showToast(`Subscribed to ${sub.label}! ⭐`); setShowSubscribe(false); }
  };

  const handleChat = useCallback(async () => {
    if (!input.trim() || chatLoading) return;
    setMessages(prev => [...prev, { role: 'user', text: input, timestamp: Date.now() }]);
    setInput(''); setChatLoading(true);
    try {
      const res = await sendChat(input, initData);
      setMessages(prev => [...prev, { role: 'agent', text: res?.text || 'Connection established. How can I assist you on RotationTV?', timestamp: Date.now() }]);
    } catch { setMessages(prev => [...prev, { role: 'agent', text: 'Live AI is processing. The Venice pipeline is active.', timestamp: Date.now() }]); }
    setChatLoading(false);
  }, [input, chatLoading, initData]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: 60, background: THEME.bg, color: THEME.text, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(108,92,231,0.15)', position: 'sticky', top: 0, zIndex: 10, background: THEME.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})` }}>R</div>
          <div><div style={{ fontSize: 16, fontWeight: 700 }}>RotationTV</div><div style={{ fontSize: 10, color: THEME.textSecondary }}>{user ? `@${user.username || 'viewer'}` : 'Network'}</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: THEME.teal, fontSize: 12, fontWeight: 600 }}>⭐ Stars</span></div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'discover' && (
          <div>
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>LIVE NOW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' }}>
              {streams.map((s: any) => (
                <div key={s.id} onClick={() => setSelectedHost(s.id)} style={{ background: THEME.card, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: selectedHost === s.id ? `2px solid ${THEME.accent}` : '1px solid rgba(108,92,231,0.15)' }}>
                  <div style={{ height: 80, background: `linear-gradient(135deg, ${s.color || THEME.accent}33, ${s.color || THEME.accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{s.emoji || '🎬'}</div>
                  <div style={{ padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{s.name || s.id}</span>
                      <span style={{ fontSize: 9, color: s.live ? THEME.success : THEME.textSecondary }}>{s.live ? '● LIVE' : 'Offline'}</span>
                    </div>
                    <div style={{ fontSize: 9, color: THEME.textSecondary }}>{s.role || ''} · {s.viewers || 0} watching</div>
                    <div style={{ fontSize: 10, color: THEME.accent2, fontWeight: 600 }}>{s.rate || 0} ⭐/hr</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8 }}>
              <button onClick={() => setShowGiftBar(true)} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${THEME.accent}`, background: 'rgba(108,92,231,0.1)', color: THEME.accent2, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🎁 Send Gift</button>
              <button onClick={() => setShowSubscribe(true)} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>⭐ Subscribe</button>
            </div>
          </div>
        )}
        {tab === 'stream' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textSecondary, marginBottom: 10 }}>SELECT AI HOST</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AI_HOSTS.map(h => (
                <div key={h.id} onClick={() => setSelectedHost(h.id)} style={{ padding: '10px 14px', borderRadius: 12, cursor: 'pointer', background: selectedHost === h.id ? 'rgba(108,92,231,0.2)' : THEME.card, border: selectedHost === h.id ? `2px solid ${THEME.accent}` : '1px solid rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{h.emoji}</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>{h.name}</div><div style={{ fontSize: 9, color: THEME.textSecondary }}>{h.role} · {h.rate}⭐</div></div>
                </div>
              ))}
            </div>
            {selectedHost && (
              <div>
                <button onClick={() => setShowGiftBar(true)} style={{ marginTop: 12, width: '100%', padding: 10, borderRadius: 12, border: `1px solid ${THEME.accent}`, background: 'rgba(108,92,231,0.1)', color: THEME.accent2, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🎁 Send Gift to Host</button>
                <div style={{ background: THEME.surface, borderRadius: 12, margin: '12px 0', display: 'flex', flexDirection: 'column', maxHeight: 240, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid rgba(108,92,231,0.15)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{AI_HOSTS.find(h => h.id === selectedHost)?.emoji} {AI_HOSTS.find(h => h.id === selectedHost)?.name}</span>
                    <span style={{ fontSize: 10, color: THEME.teal }}>● LIVE AI</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160 }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.4, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? THEME.accent : THEME.card }}>{m.text}</div>
                    ))}
                    {chatLoading && <div style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 12, alignSelf: 'flex-start', background: THEME.card, opacity: 0.6 }}>...</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid rgba(108,92,231,0.15)' }}>
                    <input style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid rgba(108,92,231,0.2)', background: THEME.bg, color: '#fff', fontSize: 12, outline: 'none' }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder={`Message ${AI_HOSTS.find(h => h.id === selectedHost)?.name}...`} />
                    <button style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: THEME.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={handleChat}>Send</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'wallet' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ background: THEME.card, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: THEME.textSecondary }}>Your Stars Balance</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: THEME.accent2, margin: '8px 0' }}>⭐ 0</div>
              <div style={{ fontSize: 10, color: THEME.textSecondary }}>Telegram Stars · 1 ⭐ ≈ $0.013</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>PAYMENT METHODS</div>
            <div style={{ background: THEME.card, borderRadius: 12, padding: 14, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}><span style={{ fontSize: 13 }}>⭐ Telegram Stars</span><span style={{ fontSize: 10, color: THEME.success }}>Active</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ fontSize: 13 }}>💎 USDT (TON Connect)</span><span style={{ fontSize: 10, color: THEME.success }}>Active</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ fontSize: 13, color: THEME.error }}>🪙 RTV Token</span><span style={{ fontSize: 10, color: THEME.error }}>Purged</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}><span style={{ fontSize: 13, color: THEME.error }}>💳 Stripe</span><span style={{ fontSize: 10, color: THEME.error }}>Purged</span></div>
            </div>
            <button onClick={() => setShowSubscribe(true)} style={{ marginTop: 16, width: '100%', padding: 14, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>⭐ Upgrade Subscription</button>
            <div style={{ marginTop: 12, fontSize: 9, color: THEME.textSecondary, textAlign: 'center' }}>Entity: Darrel-spell-living-trust</div>
          </div>
        )}
        {tab === 'profile' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ background: THEME.card, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>{user?.photo_url ? <img src={user.photo_url} style={{ width: 64, height: 64, borderRadius: 32 }} /> : '👤'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{user?.first_name || 'RotationTV'} {user?.last_name || 'Viewer'}</div>
              <div style={{ fontSize: 11, color: THEME.textSecondary }}>@{user?.username || 'guest'}</div>
              <div style={{ fontSize: 10, color: THEME.accent2, marginTop: 6 }}>Free Tier · ⭐ 0</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>ACTIVITY</div>
            <div style={{ background: THEME.card, borderRadius: 12, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: 12, padding: '6px 0' }}>🎁 Gifts sent: 0</div>
              <div style={{ fontSize: 12, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>📺 Streams watched: 0</div>
              <div style={{ fontSize: 12, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>⭐ Total spent: 0</div>
              <div style={{ fontSize: 12, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>🤖 AI chats: 0</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>ABOUT</div>
            <div style={{ background: THEME.card, borderRadius: 12, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.6 }}>RotationTV Network — AI-powered live streaming with 6 virtual hosts. Telegram native payments only (Stars + USDT). Revenue split: 80% creator / 15% platform / 5% agency.</div>
              <div style={{ fontSize: 9, color: THEME.textSecondary, marginTop: 8 }}>Entity: Darrel-spell-living-trust · v6.4.1</div>
            </div>
          </div>
        )}
      </div>

      {showGiftBar && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', background: 'rgba(13,13,13,0.95)', borderTop: '1px solid rgba(108,92,231,0.25)' }}>
          {GIFTS.map(g => (
            <button key={g.id} disabled={paying} onClick={() => handleSendGift(g)} style={{ minWidth: 56, padding: '6px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(108,92,231,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>{g.label.split(' ')[0]}</span>
              <span style={{ fontSize: 9, color: THEME.accent2, fontWeight: 700 }}>{paying ? '...' : `${g.stars} ⭐`}</span>
            </button>
          ))}
          <button onClick={() => setShowGiftBar(false)} style={{ minWidth: 56, padding: '6px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${THEME.error}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: THEME.error }}>✕</button>
        </div>
      )}

      {showSubscribe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowSubscribe(false)}>
          <div style={{ background: THEME.surface, borderRadius: 16, padding: 20, width: '90%', maxWidth: 360, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Choose Your Plan</div>
            {SUBSCRIPTIONS.map(s => (
              <div key={s.id} style={{ background: THEME.card, borderRadius: 12, padding: 14, margin: '8px 0', border: '1px solid rgba(108,92,231,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary }}>{s.hosts}</div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary }}>{s.perks.join(' • ')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.accent2 }}>{s.stars}</div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary }}>Stars/mo</div>
                    <button onClick={() => handleSubscribe(s)} style={{ marginTop: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: THEME.accent, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Subscribe</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowSubscribe(false)} style={{ marginTop: 12, width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: THEME.textSecondary, fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: THEME.card, padding: '10px 20px', borderRadius: 20, border: '1px solid rgba(0,184,148,0.3)', fontSize: 13, zIndex: 300 }}>{toast}</div>}

      <div style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: THEME.surface, borderTop: '1px solid rgba(108,92,231,0.2)', zIndex: 100 }}>
        {[
          { icon: '🔍', label: 'Discover', key: 'discover' as Tab },
          { icon: '📺', label: 'Stream', key: 'stream' as Tab },
          { icon: '⭐', label: 'Wallet', key: 'wallet' as Tab },
          { icon: '👤', label: 'Profile', key: 'profile' as Tab },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', color: tab === t.key ? THEME.accent2 : THEME.textSecondary }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
