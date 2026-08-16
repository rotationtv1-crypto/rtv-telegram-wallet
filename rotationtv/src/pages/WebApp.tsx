/**
 * RotationTV — Standalone Web App
 * Runs in browser (outside Telegram) with JWT auth + Telegram Cloud SDK identity.
 * Separate hosting from Mini App — serves at app.domain.com
 * Entity: Darrel-spell-living-trust
 */

import { useState, useEffect, useCallback } from 'react';

type User = {
  id: string;
  telegram_id: number;
  username: string;
  display_name: string;
  photo_url: string;
  is_premium: boolean;
  language_code: string;
  stars_balance: number;
  subscription: string;
  gender?: string;
};

type Page = 'onboarding' | 'home' | 'live' | 'discover' | 'wallet' | 'profile';

const API_BASE = window.location.origin.replace('app.', 'api.');

export default function WebApp() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('onboarding');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authenticate = useCallback(async (initData: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('rtv_token', data.token);
        localStorage.setItem('rtv_user', JSON.stringify(data.user));
        setPage(data.user.gender ? 'home' : 'onboarding');
      } else {
        setError(data.error || 'Auth failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('rtv_token');
    const savedUser = localStorage.getItem('rtv_user');
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setToken(savedToken);
        setPage(u.gender ? 'home' : 'onboarding');
        setLoading(false);
        return;
      } catch {}
    }
    setLoading(false);
  }, []);

  const selectGender = async (gender: 'male' | 'female' | 'non-binary') => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/api/user/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gender, step: 'gender' }),
      });
      const updated = { ...user, gender };
      setUser(updated);
      localStorage.setItem('rtv_user', JSON.stringify(updated));
      setPage('home');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0D0D0D',color:'#A29BFE'}}>Loading...</div>;

  if (!user) {
    return (
      <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'#0D0D0D',color:'#FFF',fontFamily:'Inter,sans-serif'}}>
        <div style={{padding:40,textAlign:'center',marginTop:100}}>
          <h1 style={{fontSize:28,color:'#6C5CE7',marginBottom:8}}>🔴 RotationTV</h1>
          <p style={{color:'#B2B2B2',marginBottom:24}}>Live streaming • AI hosts • Stars payments</p>
          <p style={{color:'#B2B2B2',fontSize:14,marginBottom:20}}>Open via Telegram to authenticate with your account.</p>
          {error && <p style={{color:'#FF6B6B',fontSize:14,marginBottom:20}}>{error}</p>}
          <a href="https://t.me/base44_229784_bot" style={{display:'inline-block',background:'#6C5CE7',color:'#FFF',padding:'12px 32px',borderRadius:12,textDecoration:'none',fontWeight:600}}>Open in Telegram</a>
        </div>
      </div>
    );
  }

  if (page === 'onboarding') {
    return (
      <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'#0D0D0D',color:'#FFF',fontFamily:'Inter,sans-serif'}}>
        <div style={{padding:40,textAlign:'center',marginTop:60}}>
          <h2 style={{fontSize:24,color:'#6C5CE7',marginBottom:8}}>Welcome, {user.display_name}</h2>
          <p style={{color:'#B2B2B2',marginBottom:24}}>Select your identity to personalize your experience</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
            <button onClick={() => selectGender('male')} style={{background:'#1A1A2E',color:'#FFF',border:'2px solid #6C5CE7',padding:'16px',borderRadius:12,fontSize:16,cursor:'pointer'}}>👨 Male</button>
            <button onClick={() => selectGender('female')} style={{background:'#1A1A2E',color:'#FFF',border:'2px solid #6C5CE7',padding:'16px',borderRadius:12,fontSize:16,cursor:'pointer'}}>👩 Female</button>
            <button onClick={() => selectGender('non-binary')} style={{background:'#1A1A2E',color:'#FFF',border:'2px solid #6C5CE7',padding:'16px',borderRadius:12,fontSize:16,cursor:'pointer'}}>⚡ Non-binary</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'#0D0D0D',color:'#FFF',fontFamily:'Inter,sans-serif'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'#1A1A2E'}}>
        <span style={{color:'#6C5CE7',fontWeight:700}}>🔴 RotationTV</span>
        <nav style={{display:'flex',gap:8}}>
          <button onClick={() => setPage('home')} style={page==='home'?{background:'#6C5CE7',border:'none',color:'#FFF',padding:'4px 12px',fontSize:14,borderRadius:8,cursor:'pointer'}:{background:'none',border:'none',color:'#B2B2B2',cursor:'pointer',padding:'4px 8px',fontSize:14}}>Home</button>
          <button onClick={() => setPage('discover')} style={page==='discover'?{background:'#6C5CE7',border:'none',color:'#FFF',padding:'4px 12px',fontSize:14,borderRadius:8,cursor:'pointer'}:{background:'none',border:'none',color:'#B2B2B2',cursor:'pointer',padding:'4px 8px',fontSize:14}}>Discover</button>
          <button onClick={() => setPage('wallet')} style={page==='wallet'?{background:'#6C5CE7',border:'none',color:'#FFF',padding:'4px 12px',fontSize:14,borderRadius:8,cursor:'pointer'}:{background:'none',border:'none',color:'#B2B2B2',cursor:'pointer',padding:'4px 8px',fontSize:14}}>Wallet</button>
        </nav>
        <span style={{color:'#00CEC9',fontSize:14}}>{user.stars_balance} ⭐</span>
      </header>
      <main style={{padding:16,paddingBottom:80}}>
        {page === 'home' && <div><h2 style={{color:'#6C5CE7'}}>Welcome back, {user.display_name}</h2><p style={{color:'#B2B2B2'}}>Your AI hosts are ready to broadcast.</p></div>}
        {page === 'discover' && <div><h2 style={{color:'#6C5CE7'}}>Discover Live Streams</h2><p style={{color:'#B2B2B2'}}>Loading streams...</p></div>}
        {page === 'wallet' && <div><h2 style={{color:'#6C5CE7'}}>Your Wallet</h2><p style={{color:'#B2B2B2'}}>Stars Balance: {user.stars_balance} ⭐</p></div>}
      </main>
      <footer style={{position:'fixed',bottom:0,width:'100%',maxWidth:480,padding:12,background:'#1A1A2E',textAlign:'center'}}>
        <button onClick={() => setPage('live')} style={{background:'#FF6B6B',color:'#FFF',border:'none',padding:'12px 48px',borderRadius:24,fontSize:16,fontWeight:700,cursor:'pointer'}}>🔴 Go Live</button>
      </footer>
    </div>
  );
}
