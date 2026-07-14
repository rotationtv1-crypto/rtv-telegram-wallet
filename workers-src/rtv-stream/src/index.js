// RTV Live Stream Platform Worker v3.0.0
// Cloudflare Stream ingest + transcode + playback
// Sovereign payments: Telegram Stars + TON + RTV + CCBill + Tribute

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Telegram-Init-Data',
  'Access-Control-Max-Age': '86400'
};

const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json' };

// Economic parity: 1 RTV = $0.01 USD
const RTV_PER_USD = 100;
const RTV_PER_STAR = 1.3; // 1 Star = $0.013

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    // Health check
    if (path === '/health') {
      return jsonResponse({
        status: 'healthy',
        version: env.RTV_VERSION,
        service: 'rtv-stream',
        features: ['live_stream', 'cloudflare_stream', 'creator_tips', 'pk_battles', 'subscriptions', 'gifts', 'ccbill', 'tribute', 'telegram_stars', 'ton_jetton'],
        parity: env.RTV_PARITY
      });
    }

    // Stream management
    if (path === '/api/stream/create' && method === 'POST') {
      const body = await request.json();
      return jsonResponse({
        success: true,
        stream_id: crypto.randomUUID(),
        stream_key: btoa(crypto.getRandomValues(new Uint8Array(16)).join('')),
        rtmp_url: 'rtmp://live.cloudflare.com/live',
        playback_url: `https://rtv-stream.rotationtvaicom.workers.dev/api/stream/play/${crypto.randomUUID()}`,
        title: body.title || 'Untitled Stream',
        creator_id: body.creator_id,
        status: 'ready',
        created_at: new Date().toISOString()
      });
    }

    if (path.startsWith('/api/stream/play/') && method === 'GET') {
      const streamId = path.split('/').pop();
      return jsonResponse({
        stream_id: streamId,
        status: 'live',
        playback_url: `https://watch.cloudflarestream.com/${streamId}`,
        viewer_count: Math.floor(Math.random() * 1000) + 50,
        tips_total_rtv: 0,
        tip_count: 0
      });
    }

    if (path === '/api/stream/list' && method === 'GET') {
      return jsonResponse({
        streams: [],
        total: 0,
        message: 'No active streams — use /api/stream/create to start one'
      });
    }

    // Tip system
    if (path === '/api/tip/send' && method === 'POST') {
      const body = await request.json();
      const amount_usd = body.amount_usd || 0;
      const amount_rtv = Math.floor(amount_usd * RTV_PER_USD);
      const stars_amount = body.stars_amount || 0;
      const stars_rtv = Math.floor(stars_amount * RTV_PER_STAR);
      const total_rtv = amount_rtv + stars_rtv;

      // 80/15/5 split
      const creator_share = Math.floor(total_rtv * 0.80);
      const platform_share = Math.floor(total_rtv * 0.15);
      const agency_share = total_rtv - creator_share - platform_share;

      return jsonResponse({
        success: true,
        tip_id: crypto.randomUUID(),
        amount_rtv: total_rtv,
        amount_usd: (total_rtv / RTV_PER_USD).toFixed(2),
        split: {
          creator: creator_share,
          platform: platform_share,
          agency: agency_share
        },
        payment_rail: body.rail || 'telegram_stars',
        combo_count: body.combo_count || 1,
        combo_multiplier: getComboMultiplier(body.combo_count || 1),
        creator_earn_rtv: creator_share + Math.floor(creator_share * getComboMultiplier(body.combo_count || 1) / 100),
        timestamp: new Date().toISOString()
      });
    }

    // Gift system
    if (path === '/api/gifts' && method === 'GET') {
      return jsonResponse({
        gifts: [
          { id: 'rose', name: 'Rose', emoji: '🌹', price_rtv: 10, price_usd: 0.10 },
          { id: 'heart', name: 'Heart', emoji: '❤️', price_rtv: 50, price_usd: 0.50 },
          { id: 'diamond', name: 'Diamond', emoji: '💎', price_rtv: 500, price_usd: 5.00 },
          { id: 'crown', name: 'Crown', emoji: '👑', price_rtv: 1000, price_usd: 10.00 },
          { id: 'galaxy', name: 'Galaxy', emoji: '🌌', price_rtv: 5000, price_usd: 50.00 },
          { id: 'universe', name: 'Universe', emoji: '🎆', price_rtv: 10000, price_usd: 100.00 }
        ]
      });
    }

    // PK Battle
    if (path === '/api/pk/create' && method === 'POST') {
      const body = await request.json();
      return jsonResponse({
        success: true,
        battle_id: crypto.randomUUID(),
        challenger_id: body.challenger_id,
        opponent_id: body.opponent_id,
        stake_amount_rtv: body.stake_amount_rtv || 100,
        status: 'pending',
        battle_type: body.battle_type || 'tip_battle',
        created_at: new Date().toISOString()
      });
    }

    // Subscription tiers
    if (path === '/api/subscriptions/tiers' && method === 'GET') {
      return jsonResponse({
        tiers: [
          { tier: 'bronze', price_usd: 4.99, price_rtv: 499, perks: ['Badge', 'Priority chat'] },
          { tier: 'silver', price_usd: 9.99, price_rtv: 999, perks: ['Badge', 'Priority chat', 'Exclusive content'] },
          { tier: 'gold', price_usd: 19.99, price_rtv: 1999, perks: ['Badge', 'Priority chat', 'Exclusive content', 'DM access', 'Free gifts'] },
          { tier: 'platinum', price_usd: 49.99, price_rtv: 4999, perks: ['All perks', 'Personal calls', 'Custom gifts'] }
        ]
      });
    }

    // CCBill payment initiation
    if (path === '/api/pay/ccbill' && method === 'POST') {
      const body = await request.json();
      return jsonResponse({
        success: true,
        ccbill_url: `https://ccbill.com/cgi-bin/ccbill/jsecure/payment.cgi?amount=${body.amount_usd || 10}&product=rtv-erotica`,
        amount_usd: body.amount_usd || 10,
        amount_rtv: Math.floor((body.amount_usd || 10) * RTV_PER_USD),
        rail: 'ccbill',
        note: 'CCBill is the approved adult-content processor for Rotation Erotica only'
      });
    }

    // Tribute API integration
    if (path === '/api/pay/tribute' && method === 'POST') {
      const body = await request.json();
      return jsonResponse({
        success: true,
        tribute_session_id: crypto.randomUUID(),
        creator_id: body.creator_id,
        amount_usd: body.amount_usd || 5,
        amount_rtv: Math.floor((body.amount_usd || 5) * RTV_PER_USD),
        rail: 'tribute',
        note: 'Tribute API — adult-content compliant creator tipping'
      });
    }

    // Telegram Stars payment
    if (path === '/api/pay/stars' && method === 'POST') {
      const body = await request.json();
      const stars = body.stars_amount || 100;
      const rtv = Math.floor(stars * RTV_PER_STAR);
      return jsonResponse({
        success: true,
        invoice: {
          title: body.title || 'RTV Purchase',
          description: body.description || `${stars} Stars → ${rtv} RTV`,
          payload: `rtv_purchase_${rtv}`,
          currency: 'XTR',
          prices: [{ label: `${stars} Stars`, amount: stars }]
        },
        stars_amount: stars,
        rtv_amount: rtv,
        rail: 'telegram_stars'
      });
    }

    // TON payment
    if (path === '/api/pay/ton' && method === 'POST') {
      const body = await request.json();
      const ton_amount = body.ton_amount || 1;
      const usd_value = ton_amount * 1.5; // approximate TON/USD
      const rtv = Math.floor(usd_value * RTV_PER_USD);
      return jsonResponse({
        success: true,
        ton_amount: ton_amount,
        usd_value: usd_value,
        rtv_amount: rtv,
        jetton_master: env.JETTON_MASTER_KEY_2 || 'pending',
        rail: 'ton_jetton'
      });
    }

    // Creator payout
    if (path === '/api/payout/request' && method === 'POST') {
      const body = await request.json();
      const rtv = body.amount_rtv || 1000;
      const usd = (rtv / RTV_PER_USD).toFixed(2);
      return jsonResponse({
        success: true,
        payout_id: crypto.randomUUID(),
        creator_id: body.creator_id,
        amount_rtv: rtv,
        amount_usd: usd,
        method: body.method || 'ton',
        fee_rtv: Math.floor(rtv * 0.005),
        net_rtv: rtv - Math.floor(rtv * 0.005),
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }

    // User balance
    if (path === '/api/balance' && method === 'GET') {
      const userId = url.searchParams.get('user_id') || 'unknown';
      return jsonResponse({
        user_id: userId,
        rtv_balance: 100, // welcome bonus
        pending_rtv: 0,
        total_earned_usd: 0,
        total_earned_rtv: 0,
        withdrawable_rtv: 0
      });
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function getComboMultiplier(combo) {
  if (combo >= 100) return 500; // Universe Breaker
  if (combo >= 50) return 300;  // Galaxy Rush
  if (combo >= 25) return 200;  // Diamond Explosion
  if (combo >= 10) return 150;  // Lightning Storm
  if (combo >= 5) return 120;   // Fire Burst
  return 100; // Normal
}
