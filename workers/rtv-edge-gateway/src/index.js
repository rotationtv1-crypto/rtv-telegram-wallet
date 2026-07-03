/**
 * RTV Edge Gateway v3.0.0 — Sovereign Edge Gateway
 * Unified API router for all 9 RTV ecosystem companies
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
      if (path === '/health') return json({ status: 'healthy', version: '3.0.0', rails: ['telegram_stars', 'ton_jetton', 'internal_rtv'], parity: '1 RTV = $0.01 USD' }, cors);
      if (path.startsWith('/api/pay/')) return handlePay(request, env, path, cors);
      if (path.startsWith('/api/ai/')) return handleAI(request, env, path, cors);
      if (path.startsWith('/api/voice/')) return handleVoice(request, env, path, cors);
      if (path.startsWith('/api/blockchain/')) return handleBlockchain(request, env, path, cors);
      if (path.startsWith('/api/auth/')) return handleAuth(request, env, path, cors);
      if (path.startsWith('/api/users/')) return handleUsers(request, env, path, cors);
      return json({ error: 'Not found', path }, cors, 404);
    } catch (e) { return json({ error: e.message }, cors, 500); }
  }
};
function json(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }

async function handlePay(request, env, path, cors) {
  const sub = path.replace('/api/pay/', '');
  if (sub === 'rails') return json({ rails: [{ name: 'telegram_stars', currency: 'XTR', fee: '0%', settlement: 'instant' }, { name: 'ton_jetton', currency: 'TON', fee: '0.5%', settlement: '5s' }, { name: 'internal_rtv', currency: 'RTV', fee: '0%', settlement: 'instant' }], parity: '1 RTV = $0.01 USD', stripe: 'PURGED (410)' }, cors);
  if (sub.includes('stripe')) return json({ error: 'Stripe purged. Sovereign only.' }, cors, 410);
  if (sub === 'buy/stars') {
    const b = await request.json(); const stars = b.stars_amount || 100; const usd = stars * 0.013; const rtv = Math.floor(usd / 0.01);
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `Purchase ${rtv} RTV`, description: `${stars} Stars -> ${rtv} RTV`, payload: `rtv_${b.telegram_id}_${Date.now()}`, currency: 'XTR', prices: [{ label: `${stars} Stars`, amount: stars }], provider_token: '' }) });
    const d = await r.json();
    return json({ invoice_url: d.result, stars, usd_value: usd.toFixed(2), rtv_to_receive: rtv, parity: '1 RTV = $0.01' }, cors);
  }
  if (sub === 'buy/ton') {
    const b = await request.json(); const ton = b.ton_amount || 1; const usd = ton * 1.5; const rtv = Math.floor(usd / 0.01);
    return json({ ton_amount: ton, usd_value: usd.toFixed(2), rtv_to_receive: rtv, wallet: 'EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC' }, cors);
  }
  if (sub === 'balance') return json({ rtv_balance: 0, usd_value: '0.00', parity: '1 RTV = $0.01' }, cors);
  return json({ error: 'Payment endpoint not found' }, cors, 404);
}

async function handleAI(request, env, path, cors) {
  const sub = path.replace('/api/ai/', '');
  if (sub === 'providers') return json({ providers: [{ name: 'claude', model: 'claude-sonnet-4-6', status: 'active' }, { name: 'gemini', model: 'gemini-2.0-flash', status: 'active' }, { name: 'venice', status: 'credits_needed' }, { name: 'kimi', status: 'key_invalid' }] }, cors);
  if (sub === 'chat') {
    const b = await request.json(); const p = b.provider || 'claude'; const msgs = b.messages || [];
    let url, hdrs, body;
    if (p === 'claude') { url = 'https://api.anthropic.com/v1/messages'; hdrs = { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }; body = { model: b.model || 'claude-sonnet-4-6', max_tokens: b.max_tokens || 4096, messages: msgs }; }
    else if (p === 'gemini') { url = `https://generativelanguage.googleapis.com/v1beta/models/${b.model || 'gemini-2.0-flash'}:generateContent?key=${env.GEMINI_API_KEY}`; hdrs = { 'Content-Type': 'application/json' }; body = { contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }; }
    else if (p === 'venice') { url = 'https://api.venice.ai/api/v1/chat/completions'; hdrs = { 'Authorization': `Bearer ${env.VENICE_API_KEY}`, 'Content-Type': 'application/json' }; body = { model: b.model || 'venice-uncensored', messages: msgs, max_tokens: b.max_tokens || 4096 }; }
    else return json({ error: `Unknown: ${p}` }, cors, 400);
    const r = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify(body) });
    return json(await r.json(), cors, r.status);
  }
  return json({ error: 'AI endpoint not found' }, cors, 404);
}

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
  if (sub === 'wallet/check') { const b = await request.json(); return json({ wallet: b.address, network: b.network || 'solana', balance: 'pending' }, cors); }
  return json({ error: 'Blockchain endpoint not found' }, cors, 404);
}

async function handleAuth(request, env, path, cors) {
  const sub = path.replace('/api/auth/', '');
  if (sub === 'verify') {
    const b = await request.json(); const initData = b.init_data; const token = env.TELEGRAM_BOT_TOKEN;
    if (!initData || !token) return json({ error: 'Missing init_data or token' }, cors, 400);
    const params = new URLSearchParams(initData); const hash = params.get('hash'); params.delete('hash');
    const dataStr = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
    const enc = new TextEncoder();
    const sk = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sb = await crypto.subtle.sign('HMAC', sk, enc.encode(token));
    const sk2 = await crypto.subtle.importKey('raw', sb, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const h = await crypto.subtle.sign('HMAC', sk2, enc.encode(dataStr));
    const hex = Array.from(new Uint8Array(h)).map(x => x.toString(16).padStart(2, '0')).join('');
    const valid = hex === hash;
    return json({ valid, user: valid ? JSON.parse(params.get('user') || '{}') : null, auth_date: params.get('auth_date') }, cors);
  }
  return json({ error: 'Auth endpoint not found' }, cors, 404);
}

// Supabase is called via its REST (PostgREST) endpoint with the service-role
// key, kept as a Worker secret (never committed). Direct fetch keeps this
// plain-JS worker dependency-free (no @supabase/supabase-js bundle / realtime
// baggage). Set SUPABASE_URL + SUPABASE_SERVICE_KEY via `wrangler secret put`.
function supabaseReady(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);
}
function supabaseHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function handleUsers(request, env, path, cors) {
  const sub = path.replace('/api/users/', '');
  if (!supabaseReady(env)) {
    return json({ error: 'Supabase not configured', hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_KEY worker secrets' }, cors, 503);
  }
  const table = env.SUPABASE_USERS_TABLE || 'rtv_users';
  const base = `${env.SUPABASE_URL}/rest/v1/${table}`;

  if (sub === 'list') {
    const r = await fetch(`${base}?select=*&limit=100`, { headers: { ...supabaseHeaders(env), Prefer: 'count=exact' } });
    if (!r.ok) return json({ error: 'Supabase query failed', status: r.status, detail: await r.text() }, cors, 502);
    const users = await r.json();
    const range = r.headers.get('content-range') || '';
    const total = range.includes('/') ? Number(range.split('/')[1]) : users.length;
    return json({ total, users }, cors);
  }

  if (sub === 'onboard') {
    const b = await request.json();
    if (!b.telegram_id) return json({ error: 'telegram_id required' }, cors, 400);
    const record = { telegram_id: b.telegram_id, rtv_balance: 100, username: b.username ?? null, created_at: new Date().toISOString() };
    const r = await fetch(`${base}?on_conflict=telegram_id`, {
      method: 'POST',
      headers: { ...supabaseHeaders(env), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(record),
    });
    if (!r.ok) return json({ error: 'Supabase upsert failed', status: r.status, detail: await r.text() }, cors, 502);
    const rows = await r.json();
    return json({ success: true, user: rows[0] ?? record, welcome_bonus: 100, currency: 'RTV', parity: '1 RTV = $0.01' }, cors);
  }

  return json({ error: 'User endpoint not found' }, cors, 404);
}
