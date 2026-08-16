/**
 * RotationTV — Standalone Web App
 * Browser version with JWT auth, same backend as Mini App.
 * Expanded parity: Stars balance display + gift / subscription invoice flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { sendChat, fetchLiveStreams } from '../services/api';

const THEME = {
  bg: '#0D0D0D', surface: '#1A1A2E', card: '#16213E', text: '#FFFFFF',
  textSecondary: '#B2B2B2', accent: '#6C5CE7', accent2: '#A29BFE',
  teal: '#00CEC9', success: '#00B894', error: '#FF6B6B', warning: '#FDCB6E',
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

const GIFTS = [
  { id: 'rose', label: '🌹 Rose', stars: 1 },
  { id: 'beer', label: '🍺 Beer', stars: 5 },
  { id: 'diamond', label: '💎 Diamond', stars: 50 },
  { id: 'crown', label: '👑 Crown', stars: 500 },
];

const PLANS = [
  { id: 'basic', label: 'Basic', stars: 100 },
  { id: 'pro', label: 'Pro', stars: 300 },
  { id: 'enterprise', label: 'Enterprise', stars: 999 },
];

export default function WebApp() {
  const [jwt, setJwt] = useState<string | null>(localStorage.getItem('rtv_jwt'));
  const [user, setUser] = useState<any>(null);
  const [loginUrl, setLoginUrl] = useState('');
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(!jwt);
  const [starsBalance, setStarsBalance] = useState(0);
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (jwt) {
      fetch(`${API_BASE}/api/web/verify`, { headers: { Authorization: `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => {
          if (d.valid) {
            setUser(d.user);
            setShowLogin(false);
            if (typeof d.stars_balance === 'number') setStarsBalance(d.stars_balance);
          } else {
            localStorage.removeItem('rtv_jwt');
            setJwt(null);
            setShowLogin(true);
          }
        }).catch(() => setShowLogin(true));
    }
  }, [jwt]);

  useEffect(() => {
    fetchLiveStreams().then(d => setStreams(d?.streams || [])).catch(() => setStreams([]));
  }, []);

  const handleLogin = useCallback(async () => {
    if (!loginUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/web/auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: loginUrl }),
      });
      const data = await res.json();
      if (data.jwt) {
        localStorage.setItem('rtv_jwt', data.jwt);
        setJwt(data.jwt); setUser(data.user); setShowLogin(false);
        if (typeof data.stars_balance === 'number') setStarsBalance(data.stars_balance);
      }
    } catch {}
    setLoading(false);
  }, [loginUrl]);

  const handleLogout = () => {
    localStorage.removeItem('rtv_jwt');
    setJwt(null); setUser(null); setShowLogin(true); setStarsBalance(0);
  };

  const payStars = async (item: { id: string; label: string; stars: number }, type: 'gift' | 'subscription' = 'gift') => {
    if (paying) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_BASE}/api/stars/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          type,
          item_id: item.id,
          stars_amount: item.stars,
          title: item.label,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.invoice_url) {
        showToast('Invoice failed');
        setPaying(false);
        return;
      }
      // Browser: open Telegram invoice link (user completes in Telegram)
      window.open(data.invoice_url, '_blank');
      showToast(`Opened ${item.label} (${item.stars}⭐)`);
    } catch {
      showToast('Payment error');
    }
    setPaying(false);
  };

  if (showLogin) {
    return (
      <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '90%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>RotationTV</div>
          <div style={{ fontSize: 14, color: THEME.textSecondary, marginBottom: 24 }}>Web Version · Telegram Login</div>
          <div style={{ background: THEME.card, borderRadius: 16, padding: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: THEME.accent2, marginBottom: 8 }}>How to login:</div>
            <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.8 }}>
              1. Open any RotationTV bot in Telegram<br/>2. Send /login command<br/>3. Copy the login link<br/>4. Paste it below
            </div>
          </div>
          <textarea style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: `1px solid ${THEME.accent}40`, background: THEME.surface, color: THEME.text, fontSize: 11, minHeight: 60, resize: 'none' }} placeholder="Paste Telegram login link..." value={loginUrl} onChange={e => setLoginUrl(e.target.value)} />
          <button onClick={handleLogin} disabled={loading || !loginUrl.trim()} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer', opacity: loading || !loginUrl.trim() ? 0.5 : 1 }}>{loading ? 'Authenticating...' : 'Login with Telegram'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: THEME.card, border: `1px solid ${THEME.accent}`, padding: '8px 16px', borderRadius: 12, zIndex: 50, fontSize: 12 }}>{toast}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${THEME.accent}20`, position: 'sticky', top: 0, background: THEME.bg, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>R</div>
          <div><div style={{ fontSize: 16, fontWeight: 700 }}>RotationTV</div><div style={{ fontSize: 10, color: THEME.textSecondary }}>@{user?.username || 'user'} · Web</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent2 }}>⭐ {starsBalance}</div>
          <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${THEME.error}40`, background: 'transparent', color: THEME.error, fontSize: 11, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textSecondary, marginBottom: 12 }}>Welcome, {user?.firstName || 'User'}</div>

        {/* Stars / Gifts */}
        <div style={{ background: THEME.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⭐ Send Gift (Stars)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GIFTS.map(g => (
              <button key={g.id} disabled={paying} onClick={() => payStars(g, 'gift')} style={{ padding: 12, borderRadius: 10, border: `1px solid ${THEME.accent}40`, background: THEME.surface, color: THEME.text, cursor: paying ? 'wait' : 'pointer', fontSize: 12 }}>
                {g.label}<br/><span style={{ color: THEME.accent2 }}>{g.stars}⭐</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div style={{ background: THEME.card, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Subscriptions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANS.map(p => (
              <button key={p.id} disabled={paying} onClick={() => payStars(p, 'subscription')} style={{ padding: 12, borderRadius: 10, border: `1px solid ${THEME.accent}40`, background: THEME.surface, color: THEME.text, cursor: paying ? 'wait' : 'pointer', fontSize: 12, textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.label}</span>
                <span style={{ color: THEME.accent2 }}>{p.stars}⭐ / mo</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>LIVE STREAMS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {streams.map((s, i) => (
            <div key={i} style={{ background: THEME.card, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name || s.id}</div>
              <div style={{ fontSize: 10, color: s.live ? THEME.success : THEME.textSecondary }}>{s.live ? '● LIVE' : 'Offline'}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: THEME.textSecondary, textAlign: 'center', padding: 16 }}>Entity: Darrel-spell-living-trust · Web v1.1</div>
    </div>
  );
}
