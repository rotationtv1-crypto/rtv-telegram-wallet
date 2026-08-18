/**
 * RotationTV — Tribute API Integration Bridge
 * ============================================
 * Integrates Tribute (tribute.tg) creator monetization platform
 * with the RotationTV ecosystem via Cloudflare Workers.
 *
 * Architecture:
 *   Tribute → POST /api/tribute/webhook → verify HMAC → process event → Supabase
 *   Worker → GET /api/tribute/orders → Tribute API → return to frontend
 *   Worker → GET /api/tribute/subscriptions → Tribute API → return to frontend
 *
 * Signature (official):
 *   Header: trbt-signature
 *   Algo:   HMAC-SHA256(raw body bytes, API key)
 *   Docs:   https://wiki.tribute.tg/for-content-creators/api-documentation/webhooks
 *
 * Revenue model: 80/15/5 split applied to all Tribute transactions.
 *
 * @module tributeGateway
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface TributeEnv {
  TRIBUTE_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface TributeWebhookEvent {
  name: string;
  created_at: string;
  sent_at: string;
  payload: any;
}

export interface TributeSubscription {
  subscriptionId: number;
  name: string;
  currency: string;
  periods: Array<{
    periodId: number;
    period: string;
    price: number;
  }>;
}

export interface TributeOrder {
  id: number;
  status: string;
  created: string;
  fullName: string;
  email: string;
  phone: string;
  telegramID: number;
  items: Array<{
    id: number;
    price: number;
    quantity: number;
    currency: string;
    name: string;
  }>;
  deliveryCost: number;
  currency: string;
}

// ─── WEBHOOK SIGNATURE VERIFICATION ───────────────────────────────────────────

/** Constant-time string compare (avoids early-exit timing leaks). */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  // btoa is available in Workers
  return btoa(binary);
}

/**
 * Verify the trbt-signature header using HMAC-SHA256.
 * Tribute signs the raw request body with your API key.
 * Accepts hex (preferred) or base64 encodings — docs do not pin one.
 *
 * @returns true only when signature matches and apiKey is non-empty
 */
export async function verifyTributeSignature(
  body: string,
  signature: string | null,
  apiKey: string
): Promise<boolean> {
  if (!signature || !apiKey) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const expectedHex = bytesToHex(mac);
  const expectedB64 = bytesToBase64(mac);

  const provided = signature.trim();

  // Most providers send lowercase hex; normalize hex path only
  if (/^[0-9a-fA-F]+$/.test(provided) && provided.length === expectedHex.length) {
    return timingSafeEqualStr(provided.toLowerCase(), expectedHex);
  }

  // Fallback: base64
  if (timingSafeEqualStr(provided, expectedB64)) return true;

  return false;
}

// ─── TRIBUTE REST API CALLS ──────────────────────────────────────────────────

const TRIBUTE_BASE = 'https://tribute.tg/api/v1';

/** GET /subscriptions — list creator's subscription tiers */
export async function getTributeSubscriptions(env: TributeEnv): Promise<TributeSubscription[]> {
  const resp = await fetch(`${TRIBUTE_BASE}/subscriptions`, {
    headers: { 'Api-Key': env.TRIBUTE_API_KEY, Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Tribute API error ${resp.status}: ${await resp.text()}`);
  }

  const data = (await resp.json()) as { result: TributeSubscription[] };
  return data.result || [];
}

/** GET /physical/orders — list physical product orders */
export async function getTributeOrders(
  env: TributeEnv,
  opts?: { status?: string; limit?: number; page?: number }
): Promise<{ rows: TributeOrder[]; meta: any }> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.page) params.set('page', String(opts.page));

  const resp = await fetch(`${TRIBUTE_BASE}/physical/orders?${params}`, {
    headers: { 'Api-Key': env.TRIBUTE_API_KEY, Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Tribute API error ${resp.status}: ${await resp.text()}`);
  }

  return await resp.json();
}

// ─── 80/15/5 REVENUE SPLIT ────────────────────────────────────────────────────

export interface RevenueSplit {
  gross: number;
  currency: string;
  creator_amount: number; // 80%
  platform_amount: number; // 15%
  agency_amount: number; // 5%
}

export function calculateTributeSplit(amount: number, currency: string): RevenueSplit {
  const creator = +(amount * 0.8).toFixed(4);
  const platform = +(amount * 0.15).toFixed(4);
  const agency = +(amount - creator - platform).toFixed(4);

  return {
    gross: amount,
    currency,
    creator_amount: creator,
    platform_amount: platform,
    agency_amount: agency,
  };
}

// ─── SUPABASE INTEGRATION ─────────────────────────────────────────────────────

async function supabaseInsert(env: TributeEnv, table: string, data: object) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(`[tribute] skip insert ${table}: Supabase not configured`);
    return null;
  }

  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase insert error ${resp.status}: ${text}`);
  }

  return await resp.json();
}

/** Mark Telegram user as premium after verified Tribute payment */
async function grantPremiumAccess(
  env: TributeEnv,
  telegramUserId: number | string | undefined,
  meta: Record<string, unknown>
) {
  if (!telegramUserId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;

  const tgId = String(telegramUserId);
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(tgId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        premium_active: true,
        premium_provider: 'tribute',
        premium_meta: meta,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!resp.ok) {
    console.warn(`[tribute] premium grant failed for tg=${tgId}: ${resp.status}`);
  }
}

// ─── WEBHOOK EVENT PROCESSORS ────────────────────────────────────────────────

/**
 * Process a Tribute webhook event and write to Supabase.
 * Routes each event type to the appropriate table + revenue logic.
 * Call only after signature verification succeeds.
 */
export async function processTributeWebhook(
  env: TributeEnv,
  event: TributeWebhookEvent
): Promise<{ status: string; action: string }> {
  const { name, payload } = event;

  switch (name) {
    case 'new_subscription': {
      const amount = Number(payload.amount ?? payload.price ?? 0);
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);

      await supabaseInsert(env, 'creator_subscriptions', {
        fan_id: null,
        creator_id: null,
        tier: payload.subscription_name,
        price_usd: payload.price,
        payment_method: 'tribute',
        status: 'active',
        current_period_start: event.created_at,
        current_period_end: payload.expires_at,
        metadata: {
          tribute_subscription_id: payload.subscription_id,
          telegram_user_id: payload.telegram_user_id,
          type: payload.type,
          ...payload,
        },
      });

      await supabaseInsert(env, 'payments', {
        amount,
        currency,
        status: 'completed',
        provider: 'tribute',
        provider_payment_id: `sub_${payload.subscription_id}_${payload.telegram_user_id}`,
        net_amount: split.creator_amount,
        description: `Tribute subscription: ${payload.subscription_name || 'premium'}`,
        metadata: { event: name, split, telegram_user_id: payload.telegram_user_id },
      });

      await supabaseInsert(env, 'creator_revenue', {
        gross_amount: amount,
        platform_fee_pct: 15,
        creator_pct: 80,
        creator_payout: split.creator_amount,
        platform_payout: split.platform_amount,
        status: 'pending_payout',
        payout_rail: 'tribute',
        usd_amount: amount,
      });

      await grantPremiumAccess(env, payload.telegram_user_id, {
        subscription_id: payload.subscription_id,
        subscription_name: payload.subscription_name,
        expires_at: payload.expires_at,
        amount,
        currency,
      });

      return { status: 'ok', action: 'subscription_created' };
    }

    case 'cancelled_subscription': {
      await supabaseInsert(env, 'creator_subscriptions', {
        tier: payload.subscription_name,
        payment_method: 'tribute',
        status: 'cancelled',
        current_period_end: payload.expires_at,
        metadata: {
          tribute_subscription_id: payload.subscription_id,
          cancel_reason: payload.cancel_reason,
          telegram_user_id: payload.telegram_user_id,
        },
      });
      return { status: 'ok', action: 'subscription_cancelled' };
    }

    case 'renewed_subscription': {
      const amount = Number(payload.amount ?? payload.price ?? 0);
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);

      await supabaseInsert(env, 'creator_revenue', {
        gross_amount: amount,
        platform_fee_pct: 15,
        creator_pct: 80,
        creator_payout: split.creator_amount,
        platform_payout: split.platform_amount,
        status: 'pending_payout',
        payout_rail: 'tribute',
        usd_amount: amount,
      });

      await grantPremiumAccess(env, payload.telegram_user_id, {
        subscription_id: payload.subscription_id,
        renewed: true,
        expires_at: payload.expires_at,
      });

      return { status: 'ok', action: 'subscription_renewed' };
    }

    case 'new_donation': {
      const amount = Number(payload.amount ?? 0);
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);
      await supabaseInsert(env, 'payments', {
        amount,
        currency,
        status: 'completed',
        provider: 'tribute',
        provider_payment_id: `donation_${payload.telegram_user_id}_${Date.now()}`,
        net_amount: split.creator_amount,
        description: `Tribute donation from ${payload.telegram_username || 'user'}`,
        metadata: { ...payload, split },
      });
      return { status: 'ok', action: 'donation_processed' };
    }

    case 'recurrent_donation': {
      const amount = Number(payload.amount ?? 0);
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);
      await supabaseInsert(env, 'payments', {
        amount,
        currency,
        status: 'completed',
        provider: 'tribute',
        provider_payment_id: `recurrent_donation_${payload.telegram_user_id}_${Date.now()}`,
        net_amount: split.creator_amount,
        description: `Tribute recurring donation from ${payload.telegram_username || 'user'}`,
        metadata: { ...payload, split },
      });
      return { status: 'ok', action: 'recurrent_donation_processed' };
    }

    case 'cancelled_donation': {
      return { status: 'ok', action: 'donation_cancelled' };
    }

    case 'new_digital_product': {
      const amount = Number(payload.amount ?? 0);
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);
      await supabaseInsert(env, 'payments', {
        amount,
        currency,
        status: 'completed',
        provider: 'tribute',
        provider_payment_id: `digital_${payload.telegram_user_id}_${Date.now()}`,
        net_amount: split.creator_amount,
        description: `Tribute digital product: ${payload.product_name || 'digital product'}`,
        metadata: { ...payload, split },
      });
      await supabaseInsert(env, 'content_access', {
        access_type: 'digital_product',
        expires_at: null,
        granted_at: event.created_at,
        metadata: { tribute_purchase_id: payload.purchase_id, ...payload },
      });
      await grantPremiumAccess(env, payload.telegram_user_id, {
        product: payload.product_name,
        purchase_id: payload.purchase_id,
      });
      return { status: 'ok', action: 'digital_product_purchased' };
    }

    case 'digital_product_refunded': {
      await supabaseInsert(env, 'payments', {
        amount: -(payload.amount || 0),
        currency: payload.currency || 'usd',
        status: 'refunded',
        provider: 'tribute',
        provider_payment_id: `refund_${payload.purchase_id}`,
        description: `Tribute refund for digital product`,
        metadata: { ...payload, original_purchase_id: payload.purchase_id },
      });
      return { status: 'ok', action: 'digital_product_refunded' };
    }

    case 'physical_order_created': {
      await supabaseInsert(env, 'payments', {
        amount: payload.total || 0,
        currency: payload.currency || 'usd',
        status: 'pending',
        provider: 'tribute',
        description: `Physical order #${payload.order_id}`,
        metadata: payload,
      });
      return { status: 'ok', action: 'physical_order_created' };
    }

    case 'physical_order_shipped': {
      return { status: 'ok', action: 'physical_order_shipped' };
    }

    case 'physical_order_canceled': {
      return { status: 'ok', action: 'physical_order_canceled' };
    }

    // Shop events (amount often in minor units)
    case 'shop_order': {
      const amountRaw = Number(payload.amount ?? 0);
      // Tribute shop amounts are commonly minor units (e.g. 999 = $9.99)
      const amount = amountRaw >= 100 ? amountRaw / 100 : amountRaw;
      const currency = String(payload.currency || 'usd');
      const split = calculateTributeSplit(amount, currency);

      await supabaseInsert(env, 'payments', {
        amount,
        currency,
        status: payload.status || 'paid',
        provider: 'tribute',
        provider_payment_id: payload.uuid || `shop_${Date.now()}`,
        net_amount: split.creator_amount,
        description: 'Tribute shop order',
        metadata: { ...payload, split },
      });

      await grantPremiumAccess(env, payload.customerId || payload.telegram_user_id, {
        shop_uuid: payload.uuid,
        amount,
        currency,
      });

      return { status: 'ok', action: 'shop_order_paid' };
    }

    default:
      await supabaseInsert(env, 'system_logs', {
        event: `tribute_unknown_event:${name}`,
        status: 'unknown',
        metadata: event,
      });
      return { status: 'ok', action: 'unknown_event_logged' };
  }
}

// ─── HTTP HANDLER (for Worker route) ──────────────────────────────────────────

export async function handleTributeWebhook(
  request: Request,
  env: TributeEnv
): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  if (!env.TRIBUTE_API_KEY) {
    console.error('[tribute] TRIBUTE_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 503,
      headers,
    });
  }

  // MUST use raw body text — never re-serialize JSON before verifying
  const body = await request.text();
  const signature = request.headers.get('trbt-signature');

  const valid = await verifyTributeSignature(body, signature, env.TRIBUTE_API_KEY);
  if (!valid) {
    console.warn('[tribute] invalid trbt-signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers,
    });
  }

  let event: TributeWebhookEvent;
  try {
    event = JSON.parse(body) as TributeWebhookEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers,
    });
  }

  if (!event?.name) {
    return new Response(JSON.stringify({ error: 'Missing event name' }), {
      status: 400,
      headers,
    });
  }

  try {
    const result = await processTributeWebhook(env, event);
    return new Response(JSON.stringify({ status: 'ok', ...result }), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    // Log but return 200 so Tribute does not retry forever on our DB bugs
    await supabaseInsert(env, 'system_logs', {
      event: 'tribute_webhook_error',
      status: 'error',
      metadata: { error: err?.message, event_name: event.name },
    }).catch(() => {});

    return new Response(JSON.stringify({ status: 'ok', error: 'internal' }), {
      status: 200,
      headers,
    });
  }
}

/** GET /api/tribute/subscriptions — proxy to Tribute API */
export async function handleTributeGetSubscriptions(env: TributeEnv): Promise<Response> {
  try {
    const subs = await getTributeSubscriptions(env);
    return new Response(JSON.stringify({ subscriptions: subs }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** GET /api/tribute/orders — proxy to Tribute API */
export async function handleTributeGetOrders(
  env: TributeEnv,
  url: URL
): Promise<Response> {
  try {
    const status = url.searchParams.get('status') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');

    const orders = await getTributeOrders(env, { status, limit, page });
    return new Response(JSON.stringify(orders), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
