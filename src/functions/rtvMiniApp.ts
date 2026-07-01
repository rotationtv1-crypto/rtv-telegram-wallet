// RTV Mini App — Self-contained HTML served as a backend function
// Opens inside Telegram as a Mini App

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>RotationTV Network</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { background: #0A0A0A; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding-bottom: 80px; }
:root { --neon: #CCFF00; --blue: #00BFFF; --purple: #9945FF; --red: #FF6B6B; --card: rgba(204,255,0,0.04); --border: rgba(204,255,0,0.12); --muted: rgba(255,255,255,0.35); --sub: rgba(255,255,255,0.6); }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 10px; }
.card.glow { box-shadow: 0 0 20px rgba(204,255,0,0.1); }
.btn { width: 100%; padding: 15px; border: none; border-radius: 14px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all .2s; }
.btn-primary { background: var(--neon); color: #0A0A0A; }
.btn-blue { background: var(--blue); color: #0A0A0A; }
.btn-small { padding: 11px; font-size: 13px; }
.badge { background: rgba(204,255,0,0.1); border: 1px solid rgba(204,255,0,0.25); color: var(--neon); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; }
.header { padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); margin-bottom: 12px; position: sticky; top: 0; background: #0A0A0A; z-index: 100; }
.logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #CCFF00, #00BFFF); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #0A0A0A; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tab { position: fixed; bottom: 0; left: 0; right: 0; background: #0A0A0A; border-top: 1px solid var(--border); display: flex; gap: 4px; padding: 8px 12px; z-index: 1000; }
.tab-btn { flex: 1; padding: 10px 4px; border: none; border-radius: 12px; background: transparent; color: var(--muted); font-weight: 700; font-size: 11px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .2s; }
.tab-btn.active { background: rgba(204,255,0,0.08); color: var(--neon); }
.tab-icon { font-size: 20px; }
.screen { padding: 0 12px; display: none; }
.screen.active { display: block; }
.gift-item { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px; cursor: pointer; text-align: center; transition: all .2s; }
.gift-item.selected { border-color: var(--neon); background: rgba(204,255,0,0.08); }
.gift-emoji { font-size: 28px; }
.gift-name { font-size: 11px; font-weight: 700; margin-top: 4px; }
.gift-price { font-size: 10px; color: var(--neon); }
.gift-usd { font-size: 9px; color: var(--muted); }
.toast { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); background: var(--neon); color: #0A0A0A; font-weight: 800; font-size: 12px; padding: 8px 18px; border-radius: 20px; z-index: 9999; animation: fadein .25s; }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
.bal-num { font-size: 42px; font-weight: 900; color: var(--neon); line-height: 1; }
.bal-usd { font-size: 14px; color: var(--sub); margin-top: 6px; }
.stat-box { text-align: center; padding: 16px; }
.stat-val { font-size: 20px; font-weight: 800; }
.stat-label { font-size: 10px; color: var(--muted); }
.tier-card { border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 10px; }
.tier-card.platinum { border-color: var(--neon); box-shadow: 0 0 20px rgba(204,255,0,0.1); }
.filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-weight: 700; font-size: 11px; cursor: pointer; }
.filter-btn.active { border-color: var(--neon); background: rgba(204,255,0,0.08); color: var(--neon); }
.loading { text-align: center; padding: 40px; }
.spinner { font-size: 48px; animation: spin 2s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
</head>
<body>

<div class="header">
  <div class="logo">
    <div class="logo-icon">R</div>
    <div>
      <div style="font-size:14px;font-weight:800">RotationTV</div>
      <div style="font-size:9px;color:var(--neon)">Learn it. Live it. Love it.</div>
    </div>
  </div>
  <span class="badge">2036</span>
</div>

<div id="toast" style="display:none" class="toast"></div>

<!-- HOME -->
<div id="screen-home" class="screen active">
  <div class="card glow" style="text-align:center;padding:24px">
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">RTV BALANCE</div>
    <div id="home-balance" class="bal-num">...</div>
    <div id="home-usd" class="bal-usd">≈ $0.00 USD</div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary btn-small" onclick="showScreen('wallet')">💰 Wallet</button>
      <button class="btn btn-blue btn-small" onclick="showScreen('discover')">🔴 Discover</button>
    </div>
  </div>
  <div class="grid2" style="margin-top:4px">
    <div class="card" style="text-align:center;padding:20px;cursor:pointer" onclick="showScreen('discover')">
      <div style="font-size:28px">📺</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px">Discover</div>
      <div style="font-size:10px;color:var(--muted)" id="live-count">0 live</div>
    </div>
    <div class="card" style="text-align:center;padding:20px;cursor:pointer" onclick="showScreen('gifts')">
      <div style="font-size:28px">🎁</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px">Gifts</div>
      <div style="font-size:10px;color:var(--muted)">10 available</div>
    </div>
    <div class="card" style="text-align:center;padding:20px;cursor:pointer" onclick="showScreen('subs')">
      <div style="font-size:28px">⭐</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px">Subscribe</div>
      <div style="font-size:10px;color:var(--muted)">4 tiers from $4.99</div>
    </div>
    <div class="card" style="text-align:center;padding:20px;cursor:pointer" onclick="showScreen('profile')">
      <div style="font-size:28px">👤</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px">Profile</div>
      <div style="font-size:10px;color:var(--muted)" id="home-kyc">Unverified</div>
    </div>
  </div>
  <div class="card" style="margin-top:4px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:var(--neon);display:inline-block"></span>
      <span style="font-size:12px;font-weight:700">Ecosystem Status</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      <span class="badge">9 Companies</span>
      <span class="badge" style="color:var(--blue);border-color:rgba(0,191,255,0.25);background:rgba(0,191,255,0.1)">4 Nodes</span>
      <span class="badge" style="color:var(--purple);border-color:rgba(153,69,255,0.25);background:rgba(153,69,255,0.1)">10 Rails</span>
    </div>
  </div>
</div>

<!-- DISCOVER -->
<div id="screen-discover" class="screen">
  <div style="display:flex;gap:6px;margin-bottom:12px">
    <button class="filter-btn active" onclick="filterStreams('all',this)">All</button>
    <button class="filter-btn" onclick="filterStreams('live',this)">Live</button>
    <button class="filter-btn" onclick="filterStreams('scheduled',this)">Scheduled</button>
  </div>
  <div id="streams-list">
    <div class="card" style="text-align:center;padding:40px">
      <div style="font-size:36px;margin-bottom:8px">📺</div>
      <div style="font-size:14px;font-weight:700">No streams yet</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Be the first to go live!</div>
    </div>
  </div>
</div>

<!-- GIFTS -->
<div id="screen-gifts" class="screen">
  <div class="card" style="text-align:center;padding:20px">
    <div style="font-size:22px;font-weight:800">Send Gifts</div>
    <div style="font-size:12px;color:var(--sub);margin-top:4px">1 RTV = $0.01 · Combo multipliers apply</div>
  </div>
  <div id="gifts-grid" class="grid3"></div>
  <div id="gift-detail" style="display:none"></div>
</div>

<!-- SUBS -->
<div id="screen-subs" class="screen">
  <div class="card" style="text-align:center;padding:20px">
    <div style="font-size:22px;font-weight:800">Subscription Tiers</div>
    <div style="font-size:12px;color:var(--sub);margin-top:4px">Unlock exclusive creator content</div>
  </div>
  <div id="tiers-list"></div>
</div>

<!-- WALLET -->
<div id="screen-wallet" class="screen">
  <div class="card glow" style="text-align:center;padding:24px">
    <div style="font-size:11px;color:var(--muted)">TOTAL BALANCE</div>
    <div id="wallet-balance" class="bal-num">...</div>
    <div id="wallet-usd" class="bal-usd">≈ $0.00 USD</div>
  </div>
  <div class="grid2">
    <div class="card stat-box"><div id="wallet-pending" class="stat-val" style="color:var(--blue)">0</div><div class="stat-label">Pending RTV</div></div>
    <div class="card stat-box"><div id="wallet-earned" class="stat-val" style="color:var(--neon)">0</div><div class="stat-label">Total Earned</div></div>
  </div>
  <div class="card">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">Quick Actions</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-small" onclick="openLink('https://rotationtvai.com/wallet')">📥 Deposit RTV</button>
      <button class="btn btn-blue btn-small" onclick="openLink('https://rotationtvai.com/wallet')">📤 Withdraw</button>
    </div>
  </div>
  <div class="card">
    <div style="font-size:12px;font-weight:700;margin-bottom:8px">Wallet Info</div>
    <div id="wallet-info" style="font-size:11px;color:var(--sub);line-height:1.8">Loading...</div>
  </div>
</div>

<!-- PROFILE -->
<div id="screen-profile" class="screen">
  <div class="card glow" style="text-align:center;padding:24px">
    <div style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px;background:linear-gradient(135deg,#CCFF00,#00BFFF);display:flex;align-items:center;justify-content:center;font-size:32px">👤</div>
    <div id="prof-name" style="font-size:18px;font-weight:800">RTV User</div>
    <div id="prof-username" style="font-size:12px;color:var(--sub);margin-top:2px">@unknown</div>
    <div style="display:flex;gap:6px;justify-content:center;margin-top:8px" id="prof-badges"></div>
  </div>
  <div class="card">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">Stats</div>
    <div class="grid2" id="prof-stats"></div>
  </div>
  <div class="card">
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">Verification</div>
    <div id="prof-verify" style="font-size:11px;color:var(--sub);line-height:1.8">Loading...</div>
  </div>
</div>

<!-- BOTTOM NAV -->
<div class="tab">
  <button class="tab-btn active" onclick="showScreen('home')"><span class="tab-icon">🏠</span>Home</button>
  <button class="tab-btn" onclick="showScreen('discover')"><span class="tab-icon">📺</span>Discover</button>
  <button class="tab-btn" onclick="showScreen('gifts')"><span class="tab-icon">🎁</span>Gifts</button>
  <button class="tab-btn" onclick="showScreen('subs')"><span class="tab-icon">⭐</span>Subs</button>
  <button class="tab-btn" onclick="showScreen('profile')"><span class="tab-icon">👤</span>Me</button>
</div>

<script>
const API = "https://69db6144f66afe8317b2d0d7.base44.app/functions";
let tg = window.Telegram?.WebApp;
let tgUser = tg?.initDataUnsafe?.user;
let gifts = [], tiers = [], streams = [], selectedGift = null, combo = 1;

if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#0A0A0A'); tg.setBackgroundColor('#0A0A0A'); }

function fmt(n,d=2) { return Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function fmt0(n) { return Number(n||0).toLocaleString('en-US'); }
function rtvToUsd(r) { return (Number(r||0)*0.01); }
function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',3000); }
function openLink(u) { if(tg) tg.openLink(u); else window.open(u); }

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  event?.target?.closest('.tab-btn')?.classList.add('active');
}

async function apiCall(fn, body) {
  try { const r=await fetch(API+'/'+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}); return await r.json(); }
  catch(e) { return null; }
}

// Load data
async function loadData() {
  // Gifts
  const g = await apiCall('rtvEdgeGateway',{action:'gifts'});
  if(g?.gifts) { gifts=g.gifts; renderGifts(); }
  // Tiers
  const t = await apiCall('rtvEdgeGateway',{action:'tiers'});
  if(t?.tiers) { tiers=t.tiers; renderTiers(); }
  // Streams
  const s = await apiCall('rtvEdgeGateway',{action:'streams'});
  if(s?.streams) { streams=s.streams; renderStreams(); document.getElementById('live-count').textContent=streams.filter(x=>x.status==='live').length+' live'; }
  // User balance (from auth gateway)
  if(tg?.initData) {
    const u = await apiCall('rtvAuthGateway',{initData:tg.initData});
    if(u?.user||u?.rtv_user) {
      const user = u.user||u.rtv_user;
      updateBalance(user);
      updateProfile(user);
    }
  }
}

function updateBalance(u) {
  const bal = u.rtv_balance||0;
  const usd = rtvToUsd(bal);
  document.getElementById('home-balance').textContent = fmt0(bal);
  document.getElementById('home-usd').textContent = '≈ $'+fmt(usd)+' USD';
  document.getElementById('wallet-balance').textContent = fmt0(bal);
  document.getElementById('wallet-usd').textContent = '≈ $'+fmt(usd)+' USD';
  document.getElementById('wallet-pending').textContent = fmt0(u.pending_balance||0);
  document.getElementById('wallet-earned').textContent = fmt0(u.total_earnings_rtv||0);
  document.getElementById('home-kyc').textContent = u.kyc_status||'unverified';
  document.getElementById('wallet-info').innerHTML =
    'Telegram ID: <code style="color:var(--neon)">'+(u.telegram_id||'—')+'</code><br>'+
    'Role: <span style="color:var(--neon)">'+(u.role||'user')+'</span><br>'+
    'KYC: <span style="color:'+(u.kyc_status==='verified'?'var(--neon)':'var(--red)')+'">'+(u.kyc_status||'unverified')+'</span><br>'+
    'Tier: <span style="color:var(--neon)">'+(u.loyalty_tier||'bronze')+'</span><br>'+
    'Referral: <code style="color:var(--blue)">'+(u.referral_code||'—')+'</code>';
}

function updateProfile(u) {
  document.getElementById('prof-name').textContent = u.display_name||u.username||'RTV User';
  document.getElementById('prof-username').textContent = '@'+(u.username||'unknown');
  let badges = '';
  badges += '<span class="badge">'+(u.loyalty_tier||'bronze')+'</span>';
  if(u.is_verified) badges += '<span class="badge" style="color:var(--blue);border-color:rgba(0,191,255,0.25);background:rgba(0,191,255,0.1)">Verified</span>';
  document.getElementById('prof-badges').innerHTML = badges;
  document.getElementById('prof-stats').innerHTML =
    '<div class="stat-box"><div class="stat-val" style="color:var(--neon)">'+(u.followers_count||0)+'</div><div class="stat-label">Followers</div></div>'+
    '<div class="stat-box"><div class="stat-val" style="color:var(--blue)">'+(u.stream_count||0)+'</div><div class="stat-label">Streams</div></div>'+
    '<div class="stat-box"><div class="stat-val" style="color:var(--purple)">'+(u.total_stream_hours||0)+'h</div><div class="stat-label">Stream Time</div></div>'+
    '<div class="stat-box"><div class="stat-val" style="color:var(--neon)">'+(u.safety_score||100)+'</div><div class="stat-label">Safety</div></div>';
  document.getElementById('prof-verify').innerHTML =
    'Email: <span style="color:'+(u.email?'var(--neon)':'var(--muted)')+'">'+(u.email||'Not set')+'</span><br>'+
    'Phone: <span style="color:'+(u.phone?'var(--neon)':'var(--muted)')+'">'+(u.phone||'Not set')+'</span><br>'+
    'KYC: <span style="color:'+(u.kyc_status==='verified'?'var(--neon)':'var(--red)')+'">'+(u.kyc_status||'unverified')+'</span><br>'+
    'Age Verified: <span style="color:'+(u.age_verified?'var(--neon)':'var(--red)')+'">'+(u.age_verified?'Yes':'No')+'</span>';
}

function renderGifts() {
  const grid = document.getElementById('gifts-grid');
  grid.innerHTML = gifts.map(g=>
    '<div class="gift-item" onclick="selectGift('+JSON.stringify(g).replace(/"/g,'&quot;')+')" data-id="'+g.id+'">'+
    '<div class="gift-emoji">'+g.emoji+'</div>'+
    '<div class="gift-name">'+g.name+'</div>'+
    '<div class="gift-price">'+fmt0(g.price_rtv)+' RTV</div>'+
    '<div class="gift-usd">$'+fmt(g.price_usd)+'</div></div>'
  ).join('');
}

function selectGift(g) {
  selectedGift=g; combo=1;
  document.querySelectorAll('.gift-item').forEach(el=>el.classList.remove('selected'));
  event.target.closest('.gift-item').classList.add('selected');
  const d = document.getElementById('gift-detail');
  d.style.display='block';
  d.innerHTML = '<div class="card glow">'+
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">'+
    '<span style="font-size:32px">'+g.emoji+'</span>'+
    '<div><div style="font-size:14px;font-weight:800">'+g.name+'</div>'+
    '<div style="font-size:11px;color:var(--neon)">'+fmt0(g.price_rtv*combo)+' RTV ($'+fmt(g.price_usd*combo)+')</div></div></div>'+
    '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Combo: '+combo+'x</div>'+
    '<input type="range" min="1" max="100" value="1" style="width:100%;accent-color:#CCFF00" onchange="updateCombo(this.value,'+JSON.stringify(g).replace(/"/g,'&quot;')+')" /></div>'+
    '<button class="btn btn-primary" onclick="sendGift()">Send '+fmt0(g.price_rtv)+' RTV</button></div>';
}

function updateCombo(v,g) {
  combo=Number(v);
  const d=document.querySelector('#gift-detail .card');
  if(d) {
    d.querySelector('.neon-price')?.remove();
    const btn=d.querySelector('button');
    if(btn) btn.textContent='Send '+fmt0(g.price_rtv*combo)+' RTV';
    const priceEl=d.querySelector('div[style*="color:var(--neon)"]');
    if(priceEl) priceEl.textContent=fmt0(g.price_rtv*combo)+' RTV ($'+fmt(g.price_usd*combo)+')';
  }
}

async function sendGift() {
  if(!selectedGift) return;
  showToast('Sending '+fmt0(selectedGift.price_rtv*combo)+' RTV...');
  const res = await apiCall('rtvPayoutEngine',{action:'process_tip',gift_id:selectedGift.id,gift_name:selectedGift.name,amount_rtv:selectedGift.price_rtv*combo,combo_count:combo,sender_id:tgUser?.id});
  if(res?.success) showToast('Sent '+fmt0(selectedGift.price_rtv*combo)+' RTV '+selectedGift.emoji+'!');
  else showToast(res?.error||'Gift failed');
  document.getElementById('gift-detail').style.display='none';
}

function renderTiers() {
  document.getElementById('tiers-list').innerHTML = tiers.map(t=>
    '<div class="tier-card'+(t.tier_name==='platinum'?' platinum':'')+'">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
    '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">'+(t.badge_emoji||'⭐')+'</span>'+
    '<span style="font-size:16px;font-weight:800;text-transform:capitalize">'+t.tier_name+'</span></div>'+
    '<div style="text-align:right"><div style="font-size:18px;font-weight:800;color:var(--neon)">$'+fmt(t.price_usd_monthly)+'</div>'+
    '<div style="font-size:10px;color:var(--muted)">/mo · '+fmt0(t.price_rtv_monthly)+' RTV</div></div></div>'+
    (t.perks?'<div style="margin-bottom:10px">'+t.perks.slice(0,4).map(p=>'<div style="font-size:11px;color:var(--sub);margin-bottom:2px">✓ '+p+'</div>').join('')+'</div>':'')+
    '<button class="btn btn-primary btn-small" onclick="subscribe('+JSON.stringify(t).replace(/"/g,'&quot;')+')">Subscribe '+(t.badge_emoji||'⭐')+'</button></div>'
  ).join('');
}

async function subscribe(t) {
  showToast('Subscribing to '+t.tier_name+'...');
  const res = await apiCall('rtvPayoutEngine',{action:'subscribe',tier:t.tier_name,price_usd:t.price_usd_monthly,price_rtv:t.price_rtv_monthly,subscriber_id:tgUser?.id});
  if(res?.success) showToast('Subscribed to '+t.tier_name+' '+(t.badge_emoji||'⭐'));
  else showToast(res?.error||'Subscribe failed');
}

function renderStreams() {
  const list = document.getElementById('streams-list');
  if(!streams||streams.length===0) return;
  list.innerHTML = streams.map(s=>
    '<div class="card'+(s.status==='live'?' glow':'')+'">'+
    '<div style="display:flex;gap:12px">'+
    '<div style="width:60px;height:60px;border-radius:14px;flex-shrink:0;background:linear-gradient(135deg,#CCFF00,#00BFFF);display:flex;align-items:center;justify-content:center;font-size:24px">🎬</div>'+
    '<div style="flex:1;min-width:0">'+
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'+
    (s.status==='live'?'<span style="background:var(--red);color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px">LIVE</span>':'')+
    '<span style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(s.title||'Untitled')+'</span></div>'+
    '<div style="font-size:11px;color:var(--sub)">'+(s.category||'General')+' · '+(s.viewer_count||0)+' viewers</div>'+
    (s.total_tips_rtv>0?'<div style="font-size:10px;color:var(--neon);margin-top:4px">🎁 '+fmt0(s.total_tips_rtv)+' RTV tipped</div>':'')+
    '</div></div></div>'
  ).join('');
}

function filterStreams(f,btn) {
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  let list = streams;
  if(f!=='all') list = streams.filter(s=>s.status===f);
  // re-render
  const el = document.getElementById('streams-list');
  if(list.length===0) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px"><div style="font-size:36px;margin-bottom:8px">📺</div><div style="font-size:14px;font-weight:700">No '+f+' streams</div></div>';
  } else { streams=list; renderStreams(); }
}

loadData();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
});