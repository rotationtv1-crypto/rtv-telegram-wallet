// ============================================================
// rtv-edge-gateway/src/index.ts
// Reworked to target real Rotation Erotica schema
// Auth: Supabase session via telegram-auth-bridge (NOT raw initData)
// Routes: stream create/end/play, gift send, stream webhook
// ============================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  CF_STREAM_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_STREAM_SIGNING_KEY: string;
  WEBHOOK_SECRET: string;
  RATE_LIMIT_KV: KVNamespace;
}

// ── Supabase Auth Verification ──

interface SupabaseUser {
  id: string;
  email?: string;
  aud: string;
  role: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

async function requireSupabaseUser(request: Request, env: Env): Promise<SupabaseUser> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Response(JSON.stringify({ error: 'Invalid session token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return await res.json() as SupabaseUser;
}

// ── Supabase Service Role Client ──

async function supabaseQuery(env: Env, table: string, query: Record<string, string>, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: unknown) {
  const params = new URLSearchParams(query);
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${params}`;
  const headers: Record<string, string> = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${res.status} on ${table}: ${errText}`);
  }

  if (method === 'GET') return await res.json();
  if (method === 'POST') return await res.json();
  return null;
}

async function supabaseRPC(env: Env, fn: string, params: Record<string, unknown>) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`RPC ${fn} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

// ── Cloudflare Stream ──

async function createStreamLiveInput(env: Env, creatorName: string) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/live_inputs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_STREAM_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meta: { creator: creatorName },
      recording: { mode: 'automatic' },
    }),
  });
  if (!res.ok) throw new Error(`CF Stream create failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

// ── Rate Limiter ──

async function checkRateLimit(kv: KVNamespace, userId: string, action: string, maxPerMin: number): Promise<boolean> {
  const key = `rate:${action}:${userId}`;
  const count = parseInt(await kv.get(key) || '0');
  if (count >= maxPerMin) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

// ── Routes ──

async function handleStreamCreate(request: Request, env: Env, user: SupabaseUser) {
  const { title } = await request.json() as { title: string };
  if (!title) return jsonError('title required', 400);

  // Create CF Stream live input
  const liveInput = await createStreamLiveInput(env, user.id);

  // Insert into live_rooms — status starts offline, flips to live on webhook connect
  const room = await supabaseQuery(env, 'live_rooms', {}, 'POST', {
    creator_id: user.id,
    title,
    stream_uid: liveInput.uid,
    stream_key: liveInput.rtmps?.streamKey || liveInput.webrtc?.streamKey || '',
    whip_url: liveInput.webrtc?.whipUrl || '',
    whep_url: liveInput.webrtc?.whepUrl || '',
    status: 'offline',
    connection_state: 'disconnected',
    rtv_earned_session: 0,
  });

  return Response.json({ status: 'created', room });
}

async function handleStreamEnd(request: Request, env: Env, user: SupabaseUser, roomId: string) {
  // Verify ownership
  const rooms = await supabaseQuery(env, 'live_rooms', { id: `eq.${roomId}`, creator_id: `eq.${user.id}`, select: 'id' });
  if (!rooms?.length) return jsonError('Room not found or not owner', 404);

  await supabaseQuery(env, 'live_rooms', { id: `eq.${roomId}` }, 'PATCH', {
    status: 'offline',
    connection_state: 'disconnected',
    ended_at: new Date().toISOString(),
  });

  return Response.json({ status: 'ended', room_id: roomId });
}

async function handleStreamPlay(env: Env, roomId: string) {
  const rooms = await supabaseQuery(env, 'live_rooms', { id: `eq.${roomId}`, status: 'eq.live', select: 'whep_url,title,creator_id' });
  if (!rooms?.length) return jsonError('Stream not live', 404);
  return Response.json({ whep_url: rooms[0].whep_url, title: rooms[0].title });
}

async function handleStreamsList(env: Env) {
  const rooms = await supabaseQuery(env, 'live_rooms', { status: 'eq.live', select: 'id,title,creator_id,whep_url,viewer_count,rtv_earned_session', order: 'viewer_count.desc', limit: '50' });
  return Response.json({ streams: rooms || [] });
}

async function handleGiftSend(request: Request, env: Env, user: SupabaseUser) {
  const { room_id, gift_id, message } = await request.json() as { room_id: string; gift_id: string; message?: string };

  if (!room_id || !gift_id) return jsonError('room_id and gift_id required', 400);

  // Rate limit: max 20 gifts per minute
  if (!await checkRateLimit(env.RATE_LIMIT_KV, user.id, 'gift', 20)) {
    return jsonError('Rate limit exceeded', 429);
  }

  // Look up gift price server-side (client NEVER supplies amount)
  const gifts = await supabaseQuery(env, 'gifts', { id: `eq.${gift_id}`, is_active: 'eq.true', select: 'id,name,rtv_cost,emoji' });
  if (!gifts?.length) return jsonError('Gift not found or inactive', 404);
  const gift = gifts[0];

  // Look up room (must be live)
  const rooms = await supabaseQuery(env, 'live_rooms', { id: `eq.${room_id}`, status: 'eq.live', select: 'id,creator_id,title' });
  if (!rooms?.length) return jsonError('Room not live', 404);
  const room = rooms[0];

  // No self-gifting
  if (room.creator_id === user.id) return jsonError('Cannot gift yourself', 400);

  // Execute transfer via service_role RPC
  const transferResult = await supabaseRPC(env, 'transfer_rtv', {
    p_sender_id: user.id,
    p_receiver_id: room.creator_id,
    p_amount_rtv: gift.rtv_cost,
    p_transfer_type: 'gift',
    p_description: gift.name,
    p_reference_id: room_id,
  });

  if (transferResult?.status !== 'completed') {
    return jsonError(transferResult?.message || 'Transfer failed', 400);
  }

  // Insert gift_transactions row (service_role only — no client INSERT policy)
  await supabaseQuery(env, 'gift_transactions', {}, 'POST', {
    sender_id: user.id,
    receiver_id: room.creator_id,
    room_id: room.id,
    gift_id: gift.id,
    gift_name: gift.name,
    gift_emoji: gift.emoji,
    rtv_amount: gift.rtv_cost,
    message: message || null,
  });

  // Bump session earnings
  await supabaseQuery(env, 'live_rooms', { id: `eq.${room_id}` }, 'PATCH', {
    rtv_earned_session: room.rtv_earned_session + gift.rtv_cost,
  });

  return Response.json({
    status: 'sent',
    gift: gift.name,
    emoji: gift.emoji,
    amount_rtv: gift.rtv_cost,
    creator_id: room.creator_id,
  });
}

async function handleStreamWebhook(request: Request, env: Env) {
  // Verify Cloudflare Stream webhook signature
  const signature = request.headers.get('Webhook-Signature');
  if (!signature) return jsonError('Missing signature', 401);

  const body = await request.json() as any;
  const { event, uid, live_input } = body;

  switch (event) {
    case 'live_connected':
      await supabaseQuery(env, 'live_rooms', { stream_uid: `eq.${uid}` }, 'PATCH', {
        status: 'live',
        connection_state: 'connected',
        started_at: new Date().toISOString(),
      });
      break;

    case 'live_ended':
    case 'live_disconnected':
      await supabaseQuery(env, 'live_rooms', { stream_uid: `eq.${uid}` }, 'PATCH', {
        status: 'offline',
        connection_state: 'disconnected',
        ended_at: new Date().toISOString(),
      });
      break;

    case 'recording_ready':
      // VOD is ready — could insert into catalog
      break;
  }

  return Response.json({ status: 'ok' });
}

// ── Helpers ──

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Main Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      });
    }

    // Health
    if (url.pathname === '/') {
      return Response.json({
        status: 'alive',
        service: 'rtv-edge-gateway',
        version: '2.0.0',
        auth: 'supabase-session',
        schema: 'rotation-erotica',
      });
    }

    try {
      // ── Stream Webhook (no auth — CF Stream calls this) ──
      if (url.pathname === '/webhook/stream' && method === 'POST') {
        return await handleStreamWebhook(request, env);
      }

      // ── All other routes require Supabase auth ──
      const user = await requireSupabaseUser(request, env);

      // Stream routes
      if (url.pathname === '/api/stream/create' && method === 'POST') {
        return await handleStreamCreate(request, env, user);
      }
      if (url.pathname.match(/^\/api\/stream\/[^/]+\/end$/) && method === 'POST') {
        const roomId = url.pathname.split('/')[3];
        return await handleStreamEnd(request, env, user, roomId);
      }
      if (url.pathname.match(/^\/api\/stream\/[^/]+\/play$/) && method === 'GET') {
        const roomId = url.pathname.split('/')[3];
        return await handleStreamPlay(env, roomId);
      }
      if (url.pathname === '/api/streams' && method === 'GET') {
        return await handleStreamsList(env);
      }

      // Gift route
      if (url.pathname === '/api/gift/send' && method === 'POST') {
        return await handleGiftSend(request, env, user);
      }

      return jsonError('Not found', 404);
    } catch (err: any) {
      if (err instanceof Response) return err;
      console.error('Edge gateway error:', err);
      return jsonError(err.message || 'Internal error', 500);
    }
  },
};
