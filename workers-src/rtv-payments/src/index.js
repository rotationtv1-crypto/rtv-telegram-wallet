/**
 * RTV Payments Worker v4.0.0 — Telegram Native Payments Only
 * Rails: Telegram Stars (XTR) + USDT (TON Connect)
 * NO internal_rtv, NO RTV token, NO Stripe, NO PayPal
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (path === '/health') return j({ status: 'healthy', version: '4.0.0', rails: ['telegram_stars', 'usdt_ton_connect'], note: 'Telegram native payments only', entity: 'Darrel-spell-living-trust' }, cors);
      if (path === '/api/rails') return j({ active: [{ name: 'telegram_stars', currency: 'XTR', fee: '0%', settlement: 'instant' }, { name: 'usdt_ton_connect', currency: 'USDT', fee: '~0.5%', settlement: '5s' }], purged: ['internal_rtv', 'stripe', 'paypal', 'venmo', 'zelle', 'coinbase', 'nmi', 'solana', 'rtv_token'], entity: 'Darrel-spell-living-trust' }, cors);
      if (path === '/api/stars/catalog') return j({ currency: 'XTR', catalog: { gifts: [{ id: 'rose', label: '🌹 Rose', stars: 1 }, { id: 'fire', label: '🔥 Fire', stars: 10 }, { id: 'diamond', label: '💎 Diamond', stars: 50 }, { id: 'rocket', label: '🚀 Rocket', stars: 100 }, { id: 'crown', label: '👑 Crown', stars: 500 }], subscriptions: [{ id: 'basic', label: 'Basic', stars: 100, duration: 'monthly' }, { id: 'pro', label: 'Pro', stars: 300, duration: 'monthly' }, { id: 'enterprise', label: 'Enterprise', stars: 999, duration: 'monthly' }] }, entity: 'Darrel-spell-living-trust' }, cors);
      if (path === '/api/balance') return j({ stars: null, usdt: null, note: 'Check Telegram Settings' }, cors);
      if (path.startsWith('/stripe') || path.startsWith('/paypal') || path.includes('rtv_token')) return j({ error: 'Purged. Telegram native payments only.' }, cors, 410);
      return j({ error: 'Not found' }, cors, 404);
    } catch (e) { return j({ error: e.message }, cors, 500); }
  }
};
function j(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }
