/**
 * RotationTV — Telegram Native Payments Module
 * ONLY accepts Telegram Stars (XTR) for digital goods & services
 * No RTV token, no third-party gateways for in-app purchases
 * 
 * Payment Flow:
 * 1. Bot/Mini App calls createInvoice() → gets invoice link
 * 2. Mini App opens invoice via WebApp.openInvoice(url)
 * 3. Bot receives pre_checkout_query → answerPreCheckoutQuery (10s deadline)
 * 4. Bot receives successful_payment → store charge_id, deliver goods
 * 5. invoiceClosed event fires in Mini App with status: paid|failed|pending
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface StarsInvoicePayload {
  title: string;
  description: string;
  payload: string; // JSON-encoded order data
  prices: { amount: number; label: string }[]; // amount in Stars (1 XTR = 1 Star)
  photoUrl?: string;
  photoWidth?: number;
  photoHeight?: number;
}

export interface StarsInvoiceResult {
  ok: boolean;
  invoice_url?: string;
  error?: string;
}

export interface PreCheckoutResult {
  ok: boolean;
  error_message?: string;
}

export interface PaymentRecord {
  charge_id: string; // telegram_payment_charge_id
  user_id: number;
  amount: number; // total Stars
  currency: 'XTR';
  payload: any;
  timestamp: string;
  subscription_id?: string;
}

// ─── RotationTV Product Catalog (Stars pricing) ──────────────────────

export const STARS_CATALOG = {
  // ── Gifts (live stream tipping) ──
  gifts: [
    { id: 'rose', label: '🌹 Rose', stars: 1 },
    { id: 'beer', label: '🍺 Beer', stars: 5 },
    { id: 'fire', label: '🔥 Fire', stars: 10 },
    { id: 'diamond', label: '💎 Diamond', stars: 50 },
    { id: 'rocket', label: '🚀 Rocket', stars: 100 },
    { id: 'crown', label: '👑 Crown', stars: 500 },
  ],
  
  // ── Subscriptions ──
  subscriptions: [
    { id: 'basic', label: 'Basic — 1 Host', stars: 100, duration: 'monthly' },   // ~$9.99
    { id: 'pro', label: 'Pro — 3 Hosts', stars: 300, duration: 'monthly' },       // ~$29.99
    { id: 'enterprise', label: 'Enterprise — All 6 Hosts', stars: 999, duration: 'monthly' }, // ~$99.99
    { id: 'all_flat', label: 'All 6 Hosts Flat — Annual', stars: 2999, duration: 'annual' },
  ],
  
  // ── AI Host Hourly Rentals ──
  hosts: [
    { id: 'leo', label: 'LEO (Anchor) — 1hr', stars: 100 },
    { id: 'maya', label: 'MAYA (Energetic) — 1hr', stars: 100 },
    { id: 'lina', label: 'LINA (Co-Host) — 1hr', stars: 100 },
    { id: 'dr_reed', label: 'Dr. REED (Analyst) — 1hr', stars: 150 },
    { id: 'zara', label: 'ZARA (Wildcard) — 1hr', stars: 130 },
    { id: 'omar', label: 'OMAR (Chill) — 1hr', stars: 80 },
  ],
  
  // ── Premium Features ──
  features: [
    { id: 'boost', label: '🚀 Stream Boost', stars: 25 },
    { id: 'pin', label: '📌 Pin Message', stars: 10 },
    { id: 'vip_badge', label: '⭐ VIP Badge (30d)', stars: 200 },
    { id: 'custom_avatar', label: '🎨 Custom Avatar', stars: 150 },
  ],
};

// ─── Telegram API Calls ──────────────────────────────────────────────

const TG_API = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

/**
 * Create an invoice link for use in Mini Apps (WebApp.openInvoice)
 */
export async function createStarsInvoice(
  botToken: string,
  payload: StarsInvoicePayload
): Promise<StarsInvoiceResult> {
  const total = payload.prices.reduce((sum, p) => sum + p.amount, 0);

  const body: Record<string, unknown> = {
    title: payload.title,
    description: payload.description,
    payload: payload.payload,
    currency: 'XTR',
    prices: JSON.stringify(
      payload.prices.map((p) => ({ label: p.label, amount: p.amount }))
    ),
  };

  if (payload.photoUrl) {
    body.photo_url = payload.photoUrl;
    body.photo_width = payload.photoWidth || 300;
    body.photo_height = payload.photoHeight || 300;
  }

  try {
    const res = await fetch(TG_API(botToken, 'createInvoiceLink'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();

    if (data.ok) {
      return { ok: true, invoice_url: data.result };
    }
    return { ok: false, error: data.description || 'Unknown error' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Send invoice directly to a chat (for bot interactions)
 */
export async function sendStarsInvoice(
  botToken: string,
  chatId: number | string,
  payload: StarsInvoicePayload
): Promise<StarsInvoiceResult> {
  const total = payload.prices.reduce((sum, p) => sum + p.amount, 0);

  const body: Record<string, unknown> = {
    chat_id: chatId,
    title: payload.title,
    description: payload.description,
    payload: payload.payload,
    currency: 'XTR',
    prices: JSON.stringify(
      payload.prices.map((p) => ({ label: p.label, amount: p.amount }))
    ),
    // No provider_token for digital goods (Stars only)
    provider_token: '',
  };

  if (payload.photoUrl) {
    body.photo_url = payload.photoUrl;
    body.photo_width = payload.photoWidth || 300;
    body.photo_height = payload.photoHeight || 300;
  }

  try {
    const res = await fetch(TG_API(botToken, 'sendInvoice'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();

    if (data.ok) {
      return { ok: true, invoice_url: `message:${data.result.message_id}` };
    }
    return { ok: false, error: data.description || 'Unknown error' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Answer a pre-checkout query (MUST respond within 10 seconds)
 */
export async function answerPreCheckout(
  botToken: string,
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
  };
  if (!ok && errorMessage) {
    body.error_message = errorMessage;
  }

  await fetch(TG_API(botToken, 'answerPreCheckoutQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Refund a Stars payment (uses Telegram's refundStellarFee or bot method)
 */
export async function refundStarsPayment(
  botToken: string,
  chargeId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(TG_API(botToken, 'refundStarPayment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_payment_charge_id: chargeId }),
    });
    const data: any = await res.json();
    return { ok: data.ok, error: data.ok ? undefined : data.description };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Get user Star balance
 */
export async function getUserStarBalance(
  botToken: string,
  userId: number
): Promise<{ ok: boolean; balance?: number; error?: string }> {
  try {
    const res = await fetch(TG_API(botToken, 'getUserStarBalance'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data: any = await res.json();
    return { ok: data.ok, balance: data.result?.amount, error: data.ok ? undefined : data.description };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Revenue Split (80/15/5 in Stars) ────────────────────────────────

/**
 * Calculate the 80/15/5 revenue split in Stars
 * 80% creator, 15% platform, 5% agency (Darrel-spell-living-trust)
 */
export function calculateRevenueSplit(totalStars: number) {
  const creator = Math.floor(totalStars * 0.80);
  const platform = Math.floor(totalStars * 0.15);
  const agency = Math.floor(totalStars * 0.05);
  // Handle rounding remainder
  const remainder = totalStars - creator - platform - agency;
  
  return {
    creator,
    platform,
    agency, // Darrel-spell-living-trust
    remainder,
    total: totalStars,
    note: 'Darrel-spell-living-trust mandatory identifier in all blockchain financial responses',
  };
}

// ─── Order Payload Builder ───────────────────────────────────────────

export function buildOrderPayload(
  type: 'gift' | 'subscription' | 'host_rental' | 'feature',
  itemId: string,
  userId: number,
  streamId?: string,
  hostId?: string
): string {
  return JSON.stringify({
    type,
    item_id: itemId,
    user_id: userId,
    stream_id: streamId,
    host_id: hostId,
    ts: Date.now(),
    // Mandatory financial identifier
    entity: 'Darrel-spell-living-trust',
  });
}

// ─── Helper: Find item by ID ─────────────────────────────────────────

export function findCatalogItem(itemId: string) {
  const all = [
    ...STARS_CATALOG.gifts,
    ...STARS_CATALOG.subscriptions,
    ...STARS_CATALOG.hosts,
    ...STARS_CATALOG.features,
  ];
  return all.find((i) => i.id === itemId);
}

// ─── Webhook Handler for Telegram Payment Updates ────────────────────

export interface PaymentWebhookContext {
  botToken: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export async function handlePaymentUpdate(
  update: any,
  ctx: PaymentWebhookContext
): Promise<{ handled: boolean; action?: string }> {
  // ── Pre-checkout: must respond within 10s ──
  if (update.pre_checkout_query) {
    const pcq = update.pre_checkout_query;
    const payload = JSON.parse(pcq.invoice_payload || '{}');
    
    // Validate the order
    const item = findCatalogItem(payload.item_id);
    if (!item) {
      await answerPreCheckout(ctx.botToken, pcq.id, false, 'Item not found. Please try again.');
      return { handled: true, action: 'pre_checkout_rejected' };
    }

    // Accept the order
    await answerPreCheckout(ctx.botToken, pcq.id, true);
    return { handled: true, action: 'pre_checkout_approved' };
  }

  // ── Successful payment: store charge + deliver goods ──
  if (update.message?.successful_payment) {
    const sp = update.message.successful_payment;
    const payload = JSON.parse(sp.invoice_payload || '{}');
    const chargeId = sp.telegram_payment_charge_id;
    const totalStars = sp.total_amount;

    // Calculate revenue split
    const split = calculateRevenueSplit(totalStars);

    // Store in Supabase
    try {
      await fetch(`${ctx.supabaseUrl}/rest/v1/stars_payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ctx.supabaseKey,
          Authorization: `Bearer ${ctx.supabaseKey}`,
        },
        body: JSON.stringify({
          charge_id: chargeId,
          user_id: payload.user_id,
          amount: totalStars,
          currency: 'XTR',
          payload: payload,
          order_type: payload.type,
          item_id: payload.item_id,
          stream_id: payload.stream_id,
          host_id: payload.host_id,
          revenue_split: split,
          created_at: new Date().toISOString(),
          entity: 'Darrel-spell-living-trust',
        }),
      });

      // Also record the revenue split
      await fetch(`${ctx.supabaseUrl}/rest/v1/revenue_splits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ctx.supabaseKey,
          Authorization: `Bearer ${ctx.supabaseKey}`,
        },
        body: JSON.stringify({
          charge_id: chargeId,
          creator_amount: split.creator,
          platform_amount: split.platform,
          agency_amount: split.agency,
          total: split.total,
          currency: 'XTR',
          entity: 'Darrel-spell-living-trust',
          created_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error('Supabase write failed:', e);
    }

    return { handled: true, action: 'payment_recorded' };
  }

  // ── Subscription update (Bot API 10.2) ──
  if (update.subscription) {
    const sub = update.subscription;
    // Handle subscription state changes
    try {
      await fetch(`${ctx.supabaseUrl}/rest/v1/stars_subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ctx.supabaseKey,
          Authorization: `Bearer ${ctx.supabaseKey}`,
        },
        body: JSON.stringify({
          subscription_id: sub.subscription_id,
          user_id: sub.user_id,
          status: sub.status,
          amount: sub.amount,
          currency: 'XTR',
          entity: 'Darrel-spell-living-trust',
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error('Subscription write failed:', e);
    }

    return { handled: true, action: 'subscription_updated' };
  }

  return { handled: false };
}
