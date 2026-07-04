// ============================================================
// rtv-edge-gateway/src/index.ts
// Reworked for Rotation Erotica real schema (zzybjoowhkwuomnpixuy)
// Auth: Supabase session via telegram-auth-bridge (NOT raw initData)
// Routes: stream CRUD, gift send (server-priced), stream webhook
// ============================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_STREAM_TOKEN: string;
  CF_STREAM_SIGNING_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
}

// ── Auth: Verify Supabase session ──

interface SupabaseUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

async function requireSupabaseUser(request: Request, env: Env): Promise<SupabaseUser> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.slice(7);
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Invalid session: ${res.status}`);
  }

  return await res.json() as SupabaseUser;
}

// ── Supabase helpers (service role) ──

function sbHeaders(env: Env): Record<string, string> {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function sbSelect(env: Env, table: string, query: string): Promise<any[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders(env) });
  if (!res.ok) throw new Error(`SB select ${table}: ${res.status}`);
  return await res.json();
}

async function sbInsert(env: Env, table: string, data: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(env),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`SB insert ${table}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function sbUpdate(env: Env, table: string, data: Record<string, unknown>, query: string): Promise<any> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: sbHeaders(env),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`SB update ${table}: ${res.status}`);
  return await res.json();
}

async function sbRpc(env: Env, fn: string, params: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...sbHeaders(env), 'Prefer': 'return=representation' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`SB rpc ${fn}: ${res.status} ${await res.text()}`);
  return await res.json();
}

// ── Cloudflare Stream ──

async function createLiveInput(env: Env, meta: Record<string, string>): Promise<any> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/live_inputs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_STREAM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meta }),
  });
  if (!res.ok) throw new Error(`CF Stream create: ${res.status}`);
  const data = await res.json();
  return data.result;
}

// ── Rate Limiter ──

async function checkRateLimit(kv: KVNamespace, key: string, max: number, windowSec: number): Promise<boolean> {
  const now = Date.now();
  const count = parseInt(await kv.get(key) || '0');
  if (count >= max) return false;
  await kv.put(key, String(count + 1), { expirationTtl: windowSec });
  return true;
}

// ── Stream Webhook HMAC ──

async function verifyStreamWebhook(request: Request, signingKey: string): Promise<boolean> {
  const signature = request.headers.get('Webhook-Signature');
  if (!signature) return false;
  const body = await request.clone().text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(signingKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return signature === computed;
}

// ── Routes ──

async function handleStreamCreate(request: Request, env: Env, user: SupabaseUser): Promise<Response> {
  const { title } = await request.json() as { title: string };
  if (!title) return json({ error: 'title required' }, 400);

  // Create CF Stream live input
  const liveInput = await createLiveInput(env, { creator_id: user.id, title });

  // Insert into live_rooms — status='offline' until Stream webhook confirms connection
  const room = await sbInsert(env, 'live_rooms', {
    creator_id: user.id,
    title,
    stream_uid: liveInput.uid,
    stream_key: liveInput.rtmps?.streamKey || '',
    whip_url: `https://${liveInput.uid}.cfstream.live/whip`,
    whep_url: `https://${liveInput.uid}.cfstream.live/whep`,
    status: 'offline',
    connection_state: 'disconnected',
  });

  return json({ room });
}

async function handleStreamEnd(request: Request, env: Env, user: SupabaseUser, roomId: string): Promise<Response> {
  // Ownership check
  const rooms = await sbSelect(env, 'live_rooms', `id=eq.${roomId}&creator_id=eq.${user.id}&select=id`);
  if (!rooms?.length) return json({ error: 'Room not found or not owner' }, 404);

  await sbUpdate(env, 'live_rooms', {
    status: 'offline',
    connection_state: 'disconnected',
    ended_at: new Date().toISOString(),
  }, `id=eq.${roomId}`);

  return json({ status: 'ended', room_id: roomId });
}

async function handleStreamPlay(request: Request, env: Env, roomId: string): Promise<Response> {
  const rooms = await sbSelect(env, 'live_rooms', `id=eq.${roomId}&status=eq.live&select=id,whep_url,title,creator_id`);
  if (!rooms?.length) return json({ error: 'Stream not live' }, 404);
  return json({ room: rooms[0] });
}

async function handleStreamList(env: Env): Promise<Response> {
  const rooms = await sbSelect(env, 'live_rooms', 'status=eq.live&select=id,title,whep_url,viewer_count,rtv_earned_session,created_at&order=created_at.desc&limit=50');
  return json({ streams: rooms });
}

async function handleGiftSend(request: Request, env: Env, user: SupabaseUser): Promise<Response> {
  const { room_id, gift_id, message } = await request.json() as { room_id: string; gift_id: string; message?: string };

  if (!room_id || !gift_id) return json({ error: 'room_id and gift_id required' }, 400);

  // Rate limit: 10 gifts per 30 seconds
  const rateKey = `gift:${user.id}:${room_id}`;
  if (!await checkRateLimit(env.RATE_LIMIT_KV, rateKey, 10, 30)) {
    return json({ error: 'Rate limited — slow down' }, 429);
  }

  // Look up gift price server-side (NO client-supplied amount)
  const gifts = await sbSelect(env, 'gifts', `id=eq.${gift_id}&is_active=eq.true&select=id,name,rtv_cost,emoji`);
  if (!gifts?.length) return json({ error: 'Gift not found or inactive' }, 404);
  const gift = gifts[0];

  // Look up room (must be live)
  const rooms = await sbSelect(env, 'live_rooms', `id=eq.${room_id}&status=eq.live&select=id,creator_id`);
  if (!rooms?.length) return json({ error: 'Room not live' }, 400);
  const room = rooms[0];

  // No self-gifting
  if (room.creator_id === user.id) return json({ error: 'Cannot gift yourself' }, 400);

  // Execute transfer via service role (transfer_rtv is now restricted to service_role only)
  const transferResult = await sbRpc(env, 'transfer_rtv', {
    p_sender_id: user.id,
    p_receiver_id: room.creator_id,
    p_amount: gift.rtv_cost,
    p_type: 'gift',
    p_description: gift.name,
    p_reference_id: room_id,
  });

  if (transferResult?.status !== 'completed') {
    return json({ error: 'Transfer failed', detail: transferResult }, 400);
  }

  // Insert gift_transactions row (service role only — client INSERT policy removed)
  const giftTx = await sbInsert(env, 'gift_transactions', {
    sender_id: user.id,
    receiver_id: room.creator_id,
    room_id: room_id,
    gift_id: gift_id,
    rtv_amount: gift.rtv_cost,
    message: message || null,
  });

  // Bump session earnings
  await sbUpdate(env, 'live_rooms', {
    rtv_earned_session: `rtv_earned_session + ${gift.rtv_cost}`,
  }, `id=eq.${room_id}`);

  return json({ status: 'sent', gift: giftTx, transfer: transferResult });
}

async function handleStreamWebhook(request: Request, env: Env): Promise<Response> {
  if (!await verifyStreamWebhook(request, env.CF_STREAM_SIGNING_KEY)) {
    return json({ error: 'Invalid webhook signature' }, 401);
  }

  const event = await request.json() as any;
  const streamUid = event?.live_input_id || event?.uid;
  if (!streamUid) return json({ error: 'Missing stream UID' }, 400);

  switch (event.type || event.event) {
    case 'connected':
    case 'session_start':
      await sbUpdate(env, 'live_rooms', {
        status: 'live',
        connection_state: 'connected',
        started_at: new Date().toISOString(),
      }, `stream_uid=eq.${streamUid}`);
      break;

    case 'disconnected':
    case 'session_end':
      await sbUpdate(env, 'live_rooms', {
        status: 'offline',
        connection_state: 'disconnected',
        ended_at: new Date().toISOString(),
      }, `stream_uid=eq.${streamUid}`);
      break;

    default:
      console.log('Unhandled stream event:', event.type);
  }

  return json({ received: true });
}

// ── Helpers ──

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
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
    if (url.pathname === '/') return json({ status: 'alive', service: 'rtv-edge-gateway' });

    // Stream webhook (no auth — verified via HMAC)
    if (url.pathname === '/webhook/stream' && method === 'POST') {
      return handleStreamWebhook(request, env);
    }

    // Authenticated routes
    let user: SupabaseUser;
    try {
      user = await requireSupabaseUser(request, env);
    } catch (e: any) {
      return json({ error: e.message }, 401);
    }

    // Stream routes
    if (url.pathname === '/api/stream/create' && method === 'POST') return handleStreamCreate(request, env, user);
    if (url.pathname.match(/^\/api\/stream\/[^/]+\/end$/) && method === 'POST') return handleStreamEnd(request, env, user, url.pathname.split('/')[3]);
    if (url.pathname.match(/^\/api\/stream\/[^/]+\/play$/) && method === 'GET') return handleStreamPlay(request, env, url.pathname.split('/')[3]);
    if (url.pathname === '/api/streams' && method === 'GET') return handleStreamList(env);

    // Gift route
    if (url.pathname === '/api/gift/send' && method === 'POST') return handleGiftSend(request, env, user);

    return json({ error: 'Not found' }, 404);
  },
};
