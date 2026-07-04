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

// How long a viewer heartbeat (a play-endpoint poll) counts as "still watching"
const VIEWER_PRESENCE_WINDOW_MS = 30_000;

function sbConfigured(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);
}

async function sbFetch(env, pathAndQuery, options = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

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
      const creatorId = body.creator_id;
      if (!creatorId) {
        return jsonResponse({ success: false, error: 'creator_id is required' }, 400);
      }
      if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_STREAM_TOKEN) {
        return jsonResponse({
          success: false,
          error: 'Stream is not configured on this Worker (missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_TOKEN secret)'
        }, 500);
      }

      const title = body.title || 'Untitled Stream';
      const category = body.category || 'general';

      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_STREAM_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meta: { creator_id: creatorId, title, category, ecosystem: 'RotationTV' },
            recording: { mode: 'automatic', timeoutSeconds: 14400 }
          })
        }
      );

      const cfData = await cfRes.json();
      if (!cfRes.ok || !cfData.success) {
        // Surface Cloudflare's actual error (e.g. missing Stream:Edit permission)
        // instead of a generic 500, so the permission gap is directly visible.
        return jsonResponse({
          success: false,
          error: cfData.errors?.[0]?.message || `Cloudflare Stream API error (HTTP ${cfRes.status})`,
          cf_status: cfRes.status
        }, cfRes.status === 401 || cfRes.status === 403 ? cfRes.status : 502);
      }

      const input = cfData.result;

      // Best-effort: persist the stream row so play/tip endpoints have
      // something to attach viewer presence and tip stats to. Cloudflare
      // already created the live input, so a storage hiccup here shouldn't
      // fail the whole request — surface it as a warning instead.
      let storageWarning;
      if (sbConfigured(env)) {
        const insertRes = await sbFetch(env, 'live_streams', {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            creator_id: creatorId,
            title,
            category,
            cloudflare_stream_id: input.uid,
            rtmp_url: input.rtmps?.url,
            playback_url: input.webRTCPlayback?.url,
            status: 'live',
            started_at: new Date().toISOString()
          })
        }).catch((err) => ({ ok: false, statusText: err.message }));
        if (!insertRes.ok) {
          storageWarning = 'stream created on Cloudflare but failed to persist to live_streams — viewer_count/tips will not track for this stream';
        }
      } else {
        storageWarning = 'SUPABASE_URL/SUPABASE_SERVICE_KEY not configured — viewer_count/tips will not track for this stream';
      }

      return jsonResponse({
        success: true,
        stream_id: input.uid,
        whip_url: input.webRTC?.url,
        whep_url: input.webRTCPlayback?.url,
        rtmp_url: input.rtmps?.url,
        rtmp_stream_key: input.rtmps?.streamKey,
        title,
        category,
        creator_id: creatorId,
        status: 'ready',
        created_at: new Date().toISOString(),
        ...(storageWarning ? { storage_warning: storageWarning } : {})
      });
    }

    if (path.startsWith('/api/stream/play/') && method === 'GET') {
      const streamId = path.split('/').pop();
      if (!streamId) {
        return jsonResponse({ success: false, error: 'stream_id is required' }, 400);
      }
      if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_STREAM_TOKEN) {
        return jsonResponse({
          success: false,
          error: 'Stream is not configured on this Worker (missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_TOKEN secret)'
        }, 500);
      }

      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${streamId}`,
        { headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_STREAM_TOKEN}` } }
      );

      const cfData = await cfRes.json();
      if (cfRes.status === 404) {
        return jsonResponse({ success: false, error: 'stream not found', stream_id: streamId }, 404);
      }
      if (!cfRes.ok || !cfData.success) {
        return jsonResponse({
          success: false,
          error: cfData.errors?.[0]?.message || `Cloudflare Stream API error (HTTP ${cfRes.status})`,
          cf_status: cfRes.status
        }, cfRes.status === 401 || cfRes.status === 403 ? cfRes.status : 502);
      }

      const input = cfData.result;
      const connectionState = input.status?.current?.state || 'disconnected';
      const isLive = connectionState === 'connected' || connectionState === 'reconnected';

      let viewerCount = 0;
      let tipsTotalRtv = 0;
      let tipCount = 0;

      if (sbConfigured(env)) {
        // Heartbeat: a viewer polling this endpoint counts as "still watching".
        // Upsert on (stream_id, viewer_id) so repeated polls refresh last_seen_at
        // instead of creating duplicate rows.
        const viewerId = url.searchParams.get('viewer_id');
        if (viewerId) {
          await sbFetch(env, 'stream_viewers?on_conflict=stream_id,viewer_id', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({
              stream_id: streamId,
              viewer_id: viewerId,
              last_seen_at: new Date().toISOString()
            })
          }).catch(() => {});
        }

        const presenceCutoff = new Date(Date.now() - VIEWER_PRESENCE_WINDOW_MS).toISOString();
        const viewerCountRes = await sbFetch(
          env,
          `stream_viewers?stream_id=eq.${encodeURIComponent(streamId)}&last_seen_at=gte.${encodeURIComponent(presenceCutoff)}&select=viewer_id`,
          { headers: { 'Prefer': 'count=exact' } }
        ).catch(() => null);
        if (viewerCountRes?.ok) {
          viewerCount = Number(viewerCountRes.headers.get('content-range')?.split('/')?.[1]) || 0;
        }

        const streamRowRes = await sbFetch(
          env,
          `live_streams?cloudflare_stream_id=eq.${encodeURIComponent(streamId)}&select=total_tips_rtv,tip_count`
        ).catch(() => null);
        if (streamRowRes?.ok) {
          const [streamRow] = await streamRowRes.json().catch(() => []);
          if (streamRow) {
            tipsTotalRtv = Number(streamRow.total_tips_rtv) || 0;
            tipCount = Number(streamRow.tip_count) || 0;
          }
        }
      }

      return jsonResponse({
        success: true,
        stream_id: input.uid,
        status: isLive ? 'live' : 'offline',
        connection_state: connectionState,
        whip_url: input.webRTC?.url,
        whep_url: input.webRTCPlayback?.url,
        viewer_count: viewerCount,
        tips_total_rtv: tipsTotalRtv,
        tip_count: tipCount,
        ...(sbConfigured(env) ? {} : { storage_warning: 'SUPABASE_URL/SUPABASE_SERVICE_KEY not configured — viewer_count/tips are always 0' })
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
      const streamId = body.stream_id;
      const senderId = body.sender_id;
      const receiverId = body.receiver_id || body.creator_id;
      if (!streamId || !senderId || !receiverId) {
        return jsonResponse({ success: false, error: 'stream_id, sender_id, and receiver_id are required' }, 400);
      }
      if (!sbConfigured(env)) {
        return jsonResponse({
          success: false,
          error: 'Tip storage is not configured on this Worker (missing SUPABASE_URL or SUPABASE_SERVICE_KEY secret)'
        }, 500);
      }

      const amount_usd = body.amount_usd || 0;
      const amount_rtv = Math.floor(amount_usd * RTV_PER_USD);
      const stars_amount = body.stars_amount || 0;
      const stars_rtv = Math.floor(stars_amount * RTV_PER_STAR);
      const total_rtv = amount_rtv + stars_rtv;
      const combo_count = body.combo_count || 1;
      const combo_multiplier = getComboMultiplier(combo_count);

      // 80/15/5 split
      const creator_share = Math.floor(total_rtv * 0.80);
      const platform_share = Math.floor(total_rtv * 0.15);
      const agency_share = total_rtv - creator_share - platform_share;
      const creator_earn_rtv = creator_share + Math.floor(creator_share * combo_multiplier / 100);

      const insertRes = await sbFetch(env, 'stream_tips', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          stream_id: streamId,
          sender_id: senderId,
          receiver_id: receiverId,
          gift_id: body.gift_id || null,
          gift_name: body.gift_name || null,
          gift_emoji: body.gift_emoji || null,
          amount_rtv: total_rtv,
          amount_usd,
          creator_earn_rtv,
          platform_fee_rtv: platform_share,
          agency_fee_rtv: agency_share,
          combo_count,
          message: body.message || null,
          is_anonymous: Boolean(body.is_anonymous),
          status: 'completed'
        })
      });

      if (!insertRes.ok) {
        return jsonResponse({
          success: false,
          error: 'failed to record tip',
          detail: await insertRes.text().catch(() => insertRes.statusText)
        }, 502);
      }

      const [tipRow] = await insertRes.json().catch(() => []);

      // Atomic counter update — a single UPDATE, not a JS read-modify-write,
      // so concurrent tips on the same stream can't clobber each other.
      const rpcRes = await sbFetch(env, 'rpc/increment_stream_tip_stats', {
        method: 'POST',
        body: JSON.stringify({
          p_cloudflare_stream_id: streamId,
          p_amount_rtv: total_rtv,
          p_tipper_id: senderId
        })
      }).catch(() => ({ ok: false }));

      return jsonResponse({
        success: true,
        tip_id: tipRow?.id || null,
        amount_rtv: total_rtv,
        amount_usd: (total_rtv / RTV_PER_USD).toFixed(2),
        split: {
          creator: creator_share,
          platform: platform_share,
          agency: agency_share
        },
        payment_rail: body.rail || 'telegram_stars',
        combo_count,
        combo_multiplier,
        creator_earn_rtv,
        timestamp: new Date().toISOString(),
        ...(rpcRes.ok ? {} : { storage_warning: 'tip recorded but stream tip_count/total_tips_rtv counters failed to update' })
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
