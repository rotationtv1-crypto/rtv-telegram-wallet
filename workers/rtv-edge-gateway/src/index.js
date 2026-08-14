/**
 * RTV Edge Gateway v4.0.0 — Telegram Native Payments Only
 * Rails: Telegram Stars (XTR) + USDT (TON Connect)
 * NO internal_rtv, NO RTV token conversions, NO third-party gateways
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RTV-Signature',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (path === '/health') return json({ status: 'healthy', version: '4.0.0', rails: ['telegram_stars', 'usdt_ton_connect'], note: 'Telegram native payments only — no RTV token', entity: 'Darrel-spell-living-trust' }, cors);
      if (path.startsWith('/api/pay/')) return handlePay(request, env, path, cors);
      if (path.startsWith('/api/ai/')) return handleAI(request, env, path, cors);
      if (path.startsWith('/api/voice/')) return handleVoice(request, env, path, cors);
      if (path.startsWith('/api/blockchain/')) return handleBlockchain(request, env, path, cors);
      if (path.startsWith('/api/auth/')) return handleAuth(request, env, path, cors);
      if (path.startsWith('/api/users/')) return handleUsers(request, env, path, cors);
      if (path.startsWith('/api/stars/')) return handleStars(request, env, path, cors);
      return json({ error: 'Not found', path }, cors, 404);
    } catch (e) { return json({ error: e.message }, cors, 500); }
  }
};
function json(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }

// ─── Telegram Stars Payment Handler ───────────────────────────────────
async function handleStars(request, env, path, cors) {
  const sub = path.replace('/api/stars/', '');
  
  // GET /api/stars/catalog — full Stars pricing catalog
  if (sub === 'catalog' && request.method === 'GET') {
    return json({
      currency: 'XTR',
      catalog: {
        gifts: [
          { id: 'rose', label: '🌹 Rose', stars: 1 },
          { id: 'beer', label: '🍺 Beer', stars: 5 },
          { id: 'fire', label: '🔥 Fire', stars: 10 },
          { id: 'diamond', label: '💎 Diamond', stars: 50 },
          { id: 'rocket', label: '🚀 Rocket', stars: 100 },
          { id: 'crown', label: '👑 Crown', stars: 500 },
        ],
        subscriptions: [
          { id: 'basic', label: 'Basic — 1 Host', stars: 100, duration: 'monthly' },
          { id: 'pro', label: 'Pro — 3 Hosts', stars: 300, duration: 'monthly' },
          { id: 'enterprise', label: 'Enterprise — All 6 Hosts', stars: 999, duration: 'monthly' },
        ],
        hosts: [
          { id: 'leo', label: 'LEO (Anchor) — 1hr', stars: 100 },
          { id: 'maya', label: 'MAYA (Energetic) — 1hr', stars: 100 },
          { id: 'omar', label: 'OMAR (Chill) — 1hr', stars: 80 },
        ],
      },
      entity: 'Darrel-spell-living-trust',
    }, cors);
  }
  
  // POST /api/stars/invoice — create invoice link for Mini App
  if (sub === 'invoice' && request.method === 'POST') {
    const b = await request.json();
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return json({ ok: false, error: 'Bot token not configured' }, cors, 503);
    
    const r = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: b.title || 'RotationTV Purchase',
        description: b.description || 'Digital goods & services',
        payload: JSON.stringify({ ...b.payload, entity: 'Darrel-spell-living-trust' }),
        currency: 'XTR',
        prices: b.prices || [{ label: b.label || 'Item', amount: b.stars || 1 }],
      }),
    });
    const d = await r.json();
    if (d.ok) return json({ ok: true, invoice_url: d.result }, cors);
    return json({ ok: false, error: d.description }, cors, 400);
  }
  
  return json({ error: 'Stars endpoint not found' }, cors, 404);
}

// ─── Payment Handler (Stars + USDT only, no RTV) ──────────────────────
async function handlePay(request, env, path, cors) {
  const sub = path.replace('/api/pay/', '');
  
  // Available payment rails
  if (sub === 'rails') return json({
    rails: [
      { name: 'telegram_stars', currency: 'XTR', fee: '0%', settlement: 'instant', note: 'Primary — digital goods only' },
      { name: 'usdt_ton_connect', currency: 'USDT', fee: '~0.5%', settlement: '5s', note: 'Crypto via TON Connect' },
    ],
    purged: ['internal_rtv', 'stripe', 'paypal'],
    entity: 'Darrel-spell-living-trust',
  }, cors);
  
  // Stars purchase (direct — no RTV conversion)
  if (sub === 'buy/stars') {
    const b = await request.json();
    const stars = b.stars_amount || 100;
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: b.title || `Purchase ${stars} Stars`,
        description: b.description || 'RotationTV digital goods & services',
        payload: JSON.stringify({ user_id: b.telegram_id, stars, type: b.type || 'purchase', entity: 'Darrel-spell-living-trust', ts: Date.now() }),
        currency: 'XTR',
        prices: [{ label: `${stars} Stars`, amount: stars }],
      }),
    });
    const d = await r.json();
    if (d.ok) return json({ ok: true, invoice_url: d.result, stars, currency: 'XTR' }, cors);
    return json({ ok: false, error: d.description }, cors, 400);
  }
  
  // USDT via TON Connect
  if (sub === 'buy/usdt') {
    const b = await request.json();
    return json({
      ok: true,
      method: 'ton_connect',
      usdt_amount: b.usdt_amount || 1,
      wallet: 'EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC',
      entity: 'Darrel-spell-living-trust',
    }, cors);
  }
  
  // Balance (Stars + USDT, no RTV)
  if (sub === 'balance') return json({ stars_balance: null, usdt_balance: null, note: 'Check Telegram Settings for Stars balance' }, cors);
  
  // Stripe/PayPal purged
  if (sub.includes('stripe') || sub.includes('paypal')) return json({ error: 'Purged. Telegram native payments only.', entity: 'Darrel-spell-living-trust' }, cors, 410);
  
  return json({ error: 'Payment endpoint not found' }, cors, 404);
}

// ─── AI Handler (unchanged) ───────────────────────────────────────────
async function handleAI(request, env, path, cors) {
  const sub = path.replace('/api/ai/', '');
  if (sub === 'providers') return json({ providers: [{ name: 'claude', model: 'claude-sonnet-4-6', status: 'active' }, { name: 'gemini', model: 'gemini-2.5-flash', status: 'active' }, { name: 'venice', status: 'credits_needed' }] }, cors);
  if (sub === 'chat') {
    const b = await request.json(); const p = b.provider || 'gemini'; const msgs = b.messages || [];
    let url, hdrs, body;
    if (p === 'gemini') { url = `https://generativelanguage.googleapis.com/v1beta/models/${b.model || 'gemini-2.5-flash'}:generateContent?key=${env.GEMINI_API_KEY}`; hdrs = { 'Content-Type': 'application/json' }; body = { contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }; }
    else if (p === 'venice') { url = 'https://api.venice.ai/api/v1/chat/completions'; hdrs = { 'Authorization': `Bearer ${env.VENICE_API_KEY}`, 'Content-Type': 'application/json' }; body = { model: b.model || 'venice-uncensored', messages: msgs, max_tokens: b.max_tokens || 4096 }; }
    else return json({ error: `Unknown: ${p}` }, cors, 400);
    const r = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify(body) });
    return json(await r.json(), cors, r.status);
  }
  return json({ error: 'AI endpoint not found' }, cors, 404);
}

// ─── Voice / Blockchain / Auth / Users (unchanged) ────────────────────
async function handleVoice(request, env, path, cors) {
  const sub = path.replace('/api/voice/', '');
  if (sub === 'inbound') { const xml = '<?xml version="1.0"?><Response><Say>Welcome to RotationTV Network.</Say><Dial>+18446092087</Dial></Response>'; return new Response(xml, { headers: { 'Content-Type': 'text/xml', ...cors } }); }
  if (sub === 'sms') return json({ status: 'received' }, cors);
  if (sub === 'numbers') return json({ numbers: [{ phone: '+18446092087', provider: 'twilio', capabilities: ['sms', 'voice', 'mms'] }] }, cors);
  return json({ error: 'Voice endpoint not found' }, cors, 404);
}

async function handleBlockchain(request, env, path, cors) {
  const sub = path.replace('/api/blockchain/', '');
  if (sub === 'ton/info') { const r = await fetch(env.TON_RPC_ENDPOINT || 'https://ton-chainstack.com/v3/mainchainInfo'); return json({ network: 'TON', data: await r.json() }, cors); }
  if (sub === 'solana/info') { const r = await fetch(env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }) }); return json({ network: 'Solana', data: await r.json() }, cors); }
  return json({ error: 'Blockchain endpoint not found' }, cors, 404);
}

async function handleAuth(request, env, path, cors) {
  const sub = path.replace('/api/auth/', '');
  if (sub === 'telegram') return json({ status: 'ok', method: 'telegram_initdata' }, cors);
  return json({ error: 'Auth endpoint not found' }, cors, 404);
}

async function handleUsers(request, env, path, cors) {
  const sub = path.replace('/api/users/', '');
  if (sub === 'me') return json({ user: null, note: 'Authenticate via Telegram' }, cors);
  return json({ error: 'Users endpoint not found' }, cors, 404);
}
