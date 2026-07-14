/**
 * RTV Payments Worker v3.0.0 — Sovereign Payment Gateway
 * Rails: Telegram Stars (XTR) + TON Jetton + Internal RTV
 * Stripe: PURGED (returns 410 GONE)
 * Parity: 1 RTV = $0.01 USD
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (path === '/health') return j({ status: 'healthy', version: '3.0.0', rails: ['telegram_stars', 'ton_jetton', 'internal_rtv'], parity: env.RTV_PARITY }, cors);
      if (path === '/api/rails') return j({ active: [{ name: 'telegram_stars', currency: 'XTR', fee: '0%', settlement: 'instant' }, { name: 'ton_jetton', currency: 'TON', fee: '0.5%', settlement: '5s' }, { name: 'internal_rtv', currency: 'RTV', fee: '0%', settlement: 'instant' }], purged: ['stripe', 'paypal', 'venmo', 'zelle', 'coinbase', 'nmi', 'solana'], parity: env.RTV_PARITY }, cors);
      if (path === '/api/buy/stars') { const b = await request.json(); const s = b.stars_amount || 100; const usd = s * 0.013; const rtv = Math.floor(usd / 0.01); const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `Buy ${rtv} RTV`, description: `${s} Stars -> ${rtv} RTV`, payload: `rtv_${b.telegram_id}_${Date.now()}`, currency: 'XTR', prices: [{ label: `${s} Stars`, amount: s }], provider_token: '' }) }); const d = await r.json(); return j({ invoice_url: d.result, stars: s, usd: usd.toFixed(2), rtv, parity: env.RTV_PARITY }, cors); }
      if (path === '/api/buy/ton') { const b = await request.json(); const t = b.ton_amount || 1; const usd = t * 1.5; const rtv = Math.floor(usd / 0.01); return j({ ton: t, usd: usd.toFixed(2), rtv, wallet: 'EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC' }, cors); }
      if (path === '/api/balance') return j({ rtv: 0, usd: '0.00', parity: env.RTV_PARITY }, cors);
      if (path.startsWith('/stripe')) return j({ error: 'Stripe purged. Sovereign only.' }, cors, 410);
      return j({ error: 'Not found' }, cors, 404);
    } catch (e) { return j({ error: e.message }, cors, 500); }
  }
};
function j(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }
