/**
 * QUARANTINED — Stripe / multi-rail user payment surface DISABLED
 * ================================================================
 * Policy (2026-08-22):
 *   User-facing digital goods & tips = Telegram Stars (XTR) ONLY.
 *   See: frontend/src/hooks/useStarsPayment.ts
 *        src/lib/telegramStars.ts
 *
 * TON is allowed ONLY as backend creator payout rail (not user checkout).
 * RTV-token / Stripe / PayPal / Solana checkout paths are retired.
 *
 * All previous exports now return HTTP 410 semantics when routed.
 */

export interface PayoutRequest {
  user_id: string;
  amount_usd: number;
  method: 'ton'; // only backend TON remaining
  destination?: string;
}

export function calculateSplit(grossUSD: number) {
  const creator = +(grossUSD * 0.8).toFixed(4);
  const platform = +(grossUSD * 0.15).toFixed(4);
  const agency = +(grossUSD - creator - platform).toFixed(4);
  return {
    gross_usd: grossUSD,
    creator_usd: creator,
    platform_usd: platform,
    agency_usd: agency,
  };
}

/** @deprecated Stripe Connect removed from user surface */
export async function createStripeConnectAccount(): Promise<never> {
  throw new Error('STRIPE_PURGED: use Telegram Stars (XTR) only');
}

/** @deprecated */
export async function createStripePaymentIntent(): Promise<never> {
  throw new Error('STRIPE_PURGED: use Telegram Stars (XTR) only');
}

/** @deprecated */
export async function createStripeCheckoutSession(): Promise<never> {
  throw new Error('STRIPE_PURGED: use Telegram Stars (XTR) only');
}

/** @deprecated */
export async function createStripeTransfer(): Promise<never> {
  throw new Error('STRIPE_PURGED: creator payouts via TON backend only');
}

/** Backend-only TON payout queue (no user-facing RTV coin checkout) */
export async function processPayout(
  req: PayoutRequest
): Promise<{ success: boolean; tx_id: string; method: string }> {
  if (req.method !== 'ton') {
    throw new Error('Only method=ton allowed. Stripe/PayPal/RTV-token paths quarantined.');
  }
  if (!req.destination) throw new Error('TON destination address required');
  if (req.amount_usd < 10) throw new Error('Minimum payout $10');
  // Actual Jetton transfer is executed by payment-gateway worker, not here.
  return {
    success: true,
    tx_id: `TON_QUEUED_${Date.now()}`,
    method: 'ton',
  };
}

/** Route handler: all former Stripe/RTV checkout routes → 410 Gone */
export async function routePayoutRequest(
  request: Request,
  url: URL,
  _env: unknown
): Promise<Response | null> {
  const p = url.pathname;
  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (
    !p.startsWith('/api/payout') &&
    !p.startsWith('/api/stripe') &&
    !p.startsWith('/api/credits')
  ) {
    return null;
  }

  // Allow only split calculator (read-only) and TON process
  if (p === '/api/payout/split' && request.method === 'GET') {
    const gross = parseFloat(url.searchParams.get('amount') || '0');
    if (!gross || gross <= 0) {
      return new Response(JSON.stringify({ error: 'amount required' }), {
        status: 400,
        headers: CORS,
      });
    }
    return new Response(
      JSON.stringify({ success: true, ...calculateSplit(gross), split: '80/15/5' }),
      { headers: CORS }
    );
  }

  if (p === '/api/payout/process' && request.method === 'POST') {
    try {
      const body = (await request.json()) as PayoutRequest;
      const result = await processPayout(body);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: CORS,
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400,
        headers: CORS,
      });
    }
  }

  // Everything else (Stripe connect, checkout, credits packages, RTV token sales) → 410
  return new Response(
    JSON.stringify({
      error: 'GONE',
      message:
        'Stripe / RTV-token / multi-rail user checkout is quarantined. Use Telegram Stars (XTR) via /api/stars/invoice.',
      policy: 'TELEGRAM_STARS_ONLY',
    }),
    { status: 410, headers: CORS }
  );
}
