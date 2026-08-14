/**
 * RTV Payments Worker v4.0.0 — Telegram Native Payments Only
 * Rails: Telegram Stars (XTR) + USDT (TON Connect)
 * NO internal_rtv, NO RTV token, NO Stripe, NO PayPal
 * All digital goods priced in Stars (XTR) — Telegram's native currency
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (path === '/health') return j({ status: 'healthy', version: '4.0.0', rails: ['telegram_stars', 'usdt_ton_connect'], note: 'Telegram native payments only — no RTV token', entity: 'Darrel-spell-living-trust' }, cors);
      
      if (path === '/api/rails') return j({ 
        active: [
          { name: 'telegram_stars', currency: 'XTR', fee: '0%', settlement: 'instant', note: 'Primary — all digital goods' },
          { name: 'usdt_ton_connect', currency: 'USDT', fee: '~0.5%', settlement: '5s', note: 'Crypto via TON Connect wallet' },
        ], 
        purged: ['internal_rtv', 'stripe', 'paypal', 'venmo', 'zelle', 'coinbase', 'nmi', 'solana', 'rtv_token'],
        entity: 'Darrel-spell-living-trust',
      }, cors);
      
      // Create Stars invoice — direct, no RTV conversion
      if (path === '/api/buy/stars') {
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
        if (d.ok) return j({ ok: true, invoice_url: d.result, stars, currency: 'XTR' }, cors);
        return j({ ok: false, error: d.description }, cors, 400);
      }
      
      // USDT via TON Connect — no RTV conversion
      if (path === '/api/buy/usdt') {
        const b = await request.json();
        return j({ 
          ok: true, 
          method: 'ton_connect',
          usdt_amount: b.usdt_amount || 1,
          wallet: 'EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC',
          entity: 'Darrel-spell-living-trust',
        }, cors);
      }
      
      // Balance — Stars + USDT only
      if (path === '/api/balance') return j({ stars: null, usdt: null, note: 'Check Telegram Settings for Stars balance' }, cors);
      
      // Stars catalog
      if (path === '/api/stars/catalog') return j({
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
        },
        entity: 'Darrel-spell-living-trust',
      }, cors);
      
      // Revenue split (80/15/5 in Stars)
      if (path === '/api/split') {
        const b = await request.json();
        const total = b.total_stars || 100;
        const creator = Math.floor(total * 0.80);
        const platform = Math.floor(total * 0.15);
        const agency = Math.floor(total * 0.05);
        return j({ creator, platform, agency, total, currency: 'XTR', entity: 'Darrel-spell-living-trust' }, cors);
      }
      
      // Purged endpoints
      if (path.startsWith('/stripe') || path.startsWith('/paypal') || path.includes('rtv')) {
        return j({ error: 'Purged. Telegram native payments only (Stars + USDT).', entity: 'Darrel-spell-living-trust' }, cors, 410);
      }
      
      return j({ error: 'Not found' }, cors, 404);
    } catch (e) { return j({ error: e.message }, cors, 500); }
  }
};
function j(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }
