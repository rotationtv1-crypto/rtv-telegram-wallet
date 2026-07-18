/**
 * STRIPE CONNECT + PAYPAL MULTIPARTY + TRIBUTE PAYOUT ENGINE
 * Rotationtvnetwork LLC | 80/15/5 Revenue Split | June 28, 2026
 *
 * Stripe Connect Express:
 *   - Creators onboard via Express (fastest, Stripe handles KYC)
 *   - Multiparty: Platform charges buyer → splits to creator instantly
 *   - Weekly batch payouts every Monday 9am UTC
 *
 * PayPal Multiparty:
 *   - PayPal Payouts API (mass payout to multiple recipients)
 *   - Same 80/15/5 split enforced server-side
 *
 * Tribute: Direct platform-to-creator via Stripe transfer
 */

// ── Types ────────────────────────────────────────────────────────────────
export interface StripeConnectSetup {
  user_id: string;
  email: string;
  country?: string;
  refresh_url: string;
  return_url: string;
}

export interface PayoutRequest {
  user_id: string;
  amount_usd: number;
  method: 'stripe' | 'paypal' | 'ton' | 'tribute';
  destination?: string;     // wallet addr for TON, email for PayPal
  stripe_account_id?: string;
}

export interface SplitResult {
  gross_usd: number;
  creator_usd: number;   // 80%
  platform_usd: number;  // 15%
  agency_usd: number;    // 5%
  creator_rtv: number;
}

// ── Revenue split calculator ──────────────────────────────────────────────
export function calculateSplit(
  grossUSD: number,
  customSplit?: { creator: number; platform: number; agency: number }
): SplitResult {
  const split = customSplit || { creator: 80, platform: 15, agency: 5 };
  const creator = +(grossUSD * split.creator / 100).toFixed(4);
  const platform = +(grossUSD * split.platform / 100).toFixed(4);
  const agency = +(grossUSD - creator - platform).toFixed(4);
  return {
    gross_usd: grossUSD,
    creator_usd: creator,
    platform_usd: platform,
    agency_usd: agency,
    creator_rtv: Math.floor(creator / 0.01),
  };
}

// ── Credit system ─────────────────────────────────────────────────────────
export interface CreditOperation {
  user_id: string;
  company: 'emergentlabs' | 'rotationtv' | string;
  credit_type: 'ai' | 'rtvs' | 'content_gen' | 'stream';
  amount: number;         // positive=add, negative=deduct
  reason: string;
  metadata?: Record<string, any>;
}

// Credit costs per operation
export const CREDIT_COSTS = {
  // AI inference costs
  venice_chat_message:    1,    // 1 credit per Venice chat completion
  venice_image_gen:       10,   // 10 credits per image
  kimi_code_review:       5,    // 5 credits per Kimi review
  openai_vision:          8,    // 8 credits per vision call
  heygen_avatar_minute:   15,   // 15 credits per minute of HeyGen

  // Stream costs
  ai_host_per_hour:       60,   // 60 credits/hr (1 per minute)
  stream_hd_per_hour:     10,   // HD encoding
  stream_4k_per_hour:     30,   // 4K encoding

  // Content generation
  content_gen_image:      10,
  content_gen_video_10s:  50,
  content_gen_tts_1min:   5,
} as const;

// ── Stripe Connect functions (server-side Cloudflare Worker) ──────────────

export async function createStripeConnectAccount(
  setup: StripeConnectSetup,
  stripeSecretKey: string
): Promise<{ account_id: string; onboarding_url: string; expires_at: string }> {
  // Step 1: Create Express account
  const accountRes = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      type: "express",
      country: setup.country || "US",
      email: setup.email,
      "capabilities[transfers][requested]": "true",
      "capabilities[card_payments][requested]": "true",
      "business_type": "individual",
      "settings[payouts][schedule][interval]": "weekly",
      "settings[payouts][schedule][weekly_anchor]": "monday",
    }).toString(),
  });

  if (!accountRes.ok) {
    const err = await accountRes.json() as any;
    throw new Error(`Stripe account creation failed: ${err.error?.message}`);
  }

  const account = await accountRes.json() as any;

  // Step 2: Create account link (onboarding URL)
  const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: account.id,
      refresh_url: setup.refresh_url,
      return_url: setup.return_url,
      type: "account_onboarding",
    }).toString(),
  });

  const link = await linkRes.json() as any;

  return {
    account_id: account.id,
    onboarding_url: link.url,
    expires_at: new Date(link.expires_at * 1000).toISOString(),
  };
}

export async function createStripePaymentIntent(
  amountUSD: number,
  creatorStripeAccountId: string,
  stripeSecretKey: string,
  metadata: Record<string, string> = {}
): Promise<{ client_secret: string; payment_intent_id: string }> {
  const amountCents = Math.round(amountUSD * 100);
  const platformFeeCents = Math.round(amountCents * 0.20); // 15% platform + 5% agency

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Account": creatorStripeAccountId, // charge on connected account
    },
    body: new URLSearchParams({
      amount: amountCents.toString(),
      currency: "usd",
      "automatic_payment_methods[enabled]": "true",
      application_fee_amount: platformFeeCents.toString(),  // platform keeps 20%
      "transfer_data[destination]": creatorStripeAccountId, // 80% → creator
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])),
    }).toString(),
  });

  const pi = await res.json() as any;
  if (!res.ok) throw new Error(pi.error?.message || "PaymentIntent failed");

  return {
    client_secret: pi.client_secret,
    payment_intent_id: pi.id,
  };
}

export async function createStripeTransfer(
  amountUSD: number,
  destinationAccountId: string,
  stripeSecretKey: string,
  description = "RTV Creator Payout"
): Promise<{ transfer_id: string; amount_usd: number }> {
  const amountCents = Math.round(amountUSD * 100);

  const res = await fetch("https://api.stripe.com/v1/transfers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: amountCents.toString(),
      currency: "usd",
      destination: destinationAccountId,
      description,
    }).toString(),
  });

  const transfer = await res.json() as any;
  if (!res.ok) throw new Error(transfer.error?.message || "Transfer failed");

  return { transfer_id: transfer.id, amount_usd: amountUSD };
}

export async function getStripeAccountStatus(
  connectedAccountId: string,
  stripeSecretKey: string
): Promise<{
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: string[];
}> {
  const res = await fetch(`https://api.stripe.com/v1/accounts/${connectedAccountId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const account = await res.json() as any;
  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements?.currently_due || [],
  };
}

// ── Stripe Checkout — subscription plans ──────────────────────────────────
export async function createStripeCheckoutSession(
  planId: string,
  priceUSD: number,
  successUrl: string,
  cancelUrl: string,
  stripeSecretKey: string,
  metadata: Record<string, string> = {}
): Promise<{ checkout_url: string; session_id: string }> {
  const amountCents = Math.round(priceUSD * 100);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": planId,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][unit_amount]": amountCents.toString(),
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])),
    }).toString(),
  });

  const session = await res.json() as any;
  if (!res.ok) throw new Error(session.error?.message || "Checkout failed");

  return { checkout_url: session.url, session_id: session.id };
}

// ── PayPal Multiparty Payouts ─────────────────────────────────────────────
export async function createPayPalPayout(
  recipients: Array<{ email: string; amount_usd: number; note?: string }>,
  paypalClientId: string,
  paypalSecret: string,
  sandbox = false
): Promise<{ payout_batch_id: string; status: string }> {
  const baseUrl = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  // Get OAuth token
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenRes.json() as any;
  const token = tokenData.access_token;

  // Create payout
  const items = recipients.map((r, i) => ({
    recipient_type: "EMAIL",
    amount: {
      value: r.amount_usd.toFixed(2),
      currency: "USD",
    },
    receiver: r.email,
    note: r.note || "RotationTV Creator Payout",
    sender_item_id: `rtv_payout_${Date.now()}_${i}`,
  }));

  const payoutRes = await fetch(`${baseUrl}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `RTV_BATCH_${Date.now()}`,
        email_subject: "Your RotationTV Creator Payout",
        email_message: "Your earnings from RotationTV Network are on their way!",
      },
      items,
    }),
  });

  const payout = await payoutRes.json() as any;
  if (!payoutRes.ok) throw new Error(JSON.stringify(payout));

  return {
    payout_batch_id: payout.batch_header?.payout_batch_id,
    status: payout.batch_header?.batch_status,
  };
}

// ── Main payout orchestrator ──────────────────────────────────────────────
export async function processPayout(
  req: PayoutRequest,
  env: {
    STRIPE_SECRET_KEY: string;
    PAYPAL_CLIENT_ID?: string;
    PAYPAL_SECRET?: string;
    CHAINSTACK_TON_RPC_V2: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
  }
): Promise<{ success: boolean; tx_id: string; method: string; amount_usd: number; net_usd: number }> {
  const FEE_STRIPE = 0.25;   // $0.25 flat fee
  const FEE_PAYPAL = 0.50;   // $0.50 flat fee
  const net = req.amount_usd - (req.method === 'paypal' ? FEE_PAYPAL : FEE_STRIPE);

  switch (req.method) {
    case 'stripe': {
      if (!req.stripe_account_id) throw new Error("stripe_account_id required");
      const result = await createStripeTransfer(
        net, req.stripe_account_id, env.STRIPE_SECRET_KEY,
        `RTV Creator Payout — ${new Date().toLocaleDateString()}`
      );
      return { success: true, tx_id: result.transfer_id, method: 'stripe', amount_usd: req.amount_usd, net_usd: net };
    }

    case 'paypal': {
      if (!req.destination) throw new Error("PayPal email required as destination");
      if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) throw new Error("PayPal not configured");
      const result = await createPayPalPayout(
        [{ email: req.destination, amount_usd: net, note: "RotationTV Creator Payout" }],
        env.PAYPAL_CLIENT_ID, env.PAYPAL_SECRET
      );
      return { success: true, tx_id: result.payout_batch_id, method: 'paypal', amount_usd: req.amount_usd, net_usd: net };
    }

    case 'ton': {
      // TON withdrawal — returns tx hash (actual signing needs user's wallet)
      return { success: true, tx_id: `TON_QUEUED_${Date.now()}`, method: 'ton', amount_usd: req.amount_usd, net_usd: net };
    }

    case 'tribute': {
      // Tribute = manual Stripe transfer to creator's connected account
      if (!req.stripe_account_id) throw new Error("Stripe account required for tribute payout");
      const result = await createStripeTransfer(
        net, req.stripe_account_id, env.STRIPE_SECRET_KEY, "Tribute Payout"
      );
      return { success: true, tx_id: result.transfer_id, method: 'tribute', amount_usd: req.amount_usd, net_usd: net };
    }

    default:
      throw new Error(`Unknown payout method: ${req.method}`);
  }
}

// ── API route handler ─────────────────────────────────────────────────────
export async function routePayoutRequest(
  request: Request,
  url: URL,
  env: any
): Promise<Response | null> {
  const p = url.pathname;
  const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  const ok = (d: any) => new Response(JSON.stringify(d), { headers: CORS });
  const err = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), { status, headers: CORS });

  if (!p.startsWith("/api/payout") && !p.startsWith("/api/stripe") && !p.startsWith("/api/credits")) return null;

  // ── GET /api/payout/plans — all subscription plans ─────────────────────
  if (p === "/api/payout/plans" && request.method === "GET") {
    return ok({
      viewer_plans: [
        { id: "viewer_basic",      name: "Basic",      price_usd: 9.99,  features: ["All photos","Monthly live","DM access","HD streams"], badge: "#6C5CE7" },
        { id: "viewer_pro",        name: "Pro",        price_usd: 29.99, features: ["All content","Weekly lives","Priority DMs","4K vault"], badge: "#A29BFE" },
        { id: "viewer_enterprise", name: "VIP Elite",  price_usd: 99.99, features: ["Private shows","1-on-1 sessions","Dedicated manager"], badge: "#00CEC9" },
      ],
      creator_plans: [
        { id: "creator_starter",   name: "Creator Starter",   price_usd: 0.00,  features: ["Go live","Tips","Basic analytics","TON/Stripe payouts"], ai_credits: 50 },
        { id: "creator_pro",       name: "Creator Pro",       price_usd: 29.99, features: ["AI co-host","Advanced analytics","Custom RTMP","500 credits/mo"], ai_credits: 500 },
        { id: "creator_elite",     name: "Creator Elite",     price_usd: 99.99, features: ["Dedicated node","Revenue boost","2000 credits/mo","Manager"], ai_credits: 2000 },
      ],
      agency_plans: [
        { id: "agency_basic",      name: "Agency Basic",      price_usd: 199.00, features: ["10 creators","Batch payouts","Analytics"], ai_credits: 1000 },
        { id: "agency_pro",        name: "Agency Pro",        price_usd: 499.00, features: ["50 creators","White-label","5000 credits/mo","Manager"], ai_credits: 5000 },
        { id: "agency_enterprise", name: "Agency Enterprise", price_usd: 1499.00, features: ["Unlimited creators","Full white-label","Unlimited credits","SLA"], ai_credits: -1 },
      ],
      host_plans: [
        { id: "host_basic",        name: "AI Host Basic",     price_usd: 49.99,  features: ["3 AI hosts","8h/day","Basic TTS","Scripts"], ai_credits: 200 },
        { id: "host_pro",          name: "AI Host Pro",       price_usd: 149.99, features: ["6 hosts","24h","HeyGen avatars","Multi-language"], ai_credits: 1000 },
        { id: "host_enterprise",   name: "AI Host Elite",     price_usd: 499.99, features: ["Unlimited hosts","Face-swap","Custom personas","API"], ai_credits: -1 },
      ],
      revenue_split: { creator: "80%", platform: "15%", agency: "5%" },
    });
  }

  // ── GET /api/credits/packages — all credit packages ────────────────────
  if (p === "/api/credits/packages" && request.method === "GET") {
    return ok({
      emergentlabs: [
        { name: "Starter",   credits: 100,    bonus: 0,    price_usd: 5.00,  price_per_credit: 0.050 },
        { name: "Basic",     credits: 500,    bonus: 50,   price_usd: 20.00, price_per_credit: 0.036 },
        { name: "Pro",       credits: 2000,   bonus: 400,  price_usd: 60.00, price_per_credit: 0.025 },
        { name: "Elite",     credits: 10000,  bonus: 3000, price_usd: 250.00,price_per_credit: 0.019 },
        { name: "Unlimited", credits: -1,     bonus: 0,    price_usd: 500.00,price_per_credit: 0 },
      ],
      rtv_tokens: [
        { name: "Micro",    rtvs: 1000,   bonus: 0,     price_usd: 5.00 },
        { name: "Standard", rtvs: 5000,   bonus: 500,   price_usd: 20.00 },
        { name: "Premium",  rtvs: 25000,  bonus: 5000,  price_usd: 80.00 },
        { name: "Whale",    rtvs: 100000, bonus: 30000, price_usd: 250.00 },
      ],
      content_gen: [
        { name: "Starter",   gens: 50,  price_usd: 9.99,  billing: "monthly" },
        { name: "Pro",       gens: 250, price_usd: 39.99, billing: "monthly" },
        { name: "Unlimited", gens: -1,  price_usd: 99.99, billing: "monthly" },
      ],
      credit_costs: CREDIT_COSTS,
    });
  }

  // ── POST /api/stripe/connect — create Stripe Connect account ───────────
  if (p === "/api/stripe/connect" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      if (!env.STRIPE_SECRET_KEY) return err("Stripe not configured", 503);
      const result = await createStripeConnectAccount(
        { ...body, refresh_url: `${url.origin}/stripe/reauth`, return_url: `${url.origin}/stripe/return` },
        env.STRIPE_SECRET_KEY
      );
      return ok({ success: true, ...result });
    } catch (e: any) { return err(e.message, 500); }
  }

  // ── GET /api/stripe/account-status — check Connect status ──────────────
  if (p === "/api/stripe/account-status" && request.method === "GET") {
    const accountId = url.searchParams.get("account_id");
    if (!accountId) return err("account_id required");
    try {
      const status = await getStripeAccountStatus(accountId, env.STRIPE_SECRET_KEY);
      return ok({ success: true, ...status });
    } catch (e: any) { return err(e.message, 500); }
  }

  // ── POST /api/stripe/checkout — create subscription checkout ───────────
  if (p === "/api/stripe/checkout" && request.method === "POST") {
    try {
      const { plan_id, price_usd, success_url, cancel_url, metadata } = await request.json() as any;
      if (!env.STRIPE_SECRET_KEY) return err("Stripe not configured", 503);
      const result = await createStripeCheckoutSession(
        plan_id, price_usd,
        success_url || `${url.origin}/?success=1`,
        cancel_url || `${url.origin}/?cancel=1`,
        env.STRIPE_SECRET_KEY,
        metadata || {}
      );
      return ok({ success: true, ...result });
    } catch (e: any) { return err(e.message, 500); }
  }

  // ── POST /api/payout/process — trigger a creator payout ────────────────
  if (p === "/api/payout/process" && request.method === "POST") {
    try {
      const body = await request.json() as PayoutRequest;
      if (!body.user_id || !body.amount_usd || !body.method) {
        return err("user_id, amount_usd, method required");
      }
      if (body.amount_usd < 10) return err("Minimum payout: $10.00");
      const result = await processPayout(body, env);
      return ok({ success: true, ...result });
    } catch (e: any) { return err(e.message, 500); }
  }

  // ── GET /api/payout/split — calculate revenue split ────────────────────
  if (p === "/api/payout/split" && request.method === "GET") {
    const gross = parseFloat(url.searchParams.get("amount") || "0");
    if (!gross || gross <= 0) return err("amount required");
    return ok({ success: true, ...calculateSplit(gross), split: "80/15/5" });
  }

  // ── GET /api/payout/host-pricing — AI host rates ───────────────────────
  if (p === "/api/payout/host-pricing" && request.method === "GET") {
    return ok({
      success: true,
      hosts: [
        { id: "LEO",      name: "LEO — The Anchor",    price_per_hour: 9.99,  tts: "ElevenLabs",   revenue_share: "5%", credits_per_hour: 15 },
        { id: "MAYA",     name: "MAYA — Energetic",    price_per_hour: 9.99,  tts: "ElevenLabs",   revenue_share: "5%", credits_per_hour: 15 },
        { id: "DR_REED",  name: "DR. REED — Analyst",  price_per_hour: 14.99, tts: "HeyGen",       revenue_share: "7.5%",credits_per_hour: 20 },
        { id: "ZARA",     name: "ZARA — Wildcard",     price_per_hour: 12.99, tts: "Venice AI",    revenue_share: "6%", credits_per_hour: 18 },
        { id: "OMAR",     name: "OMAR — Chill",        price_per_hour: 7.99,  tts: "Workers AI",   revenue_share: "4%", credits_per_hour: 10 },
        { id: "LINA",     name: "LINA — Co-Host",      price_per_hour: 9.99,  tts: "ElevenLabs",   revenue_share: "5%", credits_per_hour: 12 },
        { id: "ALL_HOSTS",name: "Full Broadcast Grid", price_flat_month: 299.00, tts: "Mixed",      revenue_share: "15%",credits_per_hour: 100 },
      ],
      billing_note: "Per-hour charged at stream end. Revenue share deducted from gross before 80/15/5 split.",
    });
  }

  return null;
}
