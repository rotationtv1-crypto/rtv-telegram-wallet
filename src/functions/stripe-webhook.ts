import { createClient } from 'npm:@base44/sdk@0.8.23';

// ============================================================
// STRIPE WEBHOOK HANDLER — RotationTV Network
// Handles: checkout, invoices, subscriptions, payment intents
// - Verifies Stripe signature (HMAC-SHA256) before trusting body
// - Logs EVERY payment event to RotationPayTransaction
// - Mirrors every event to OmegaAuditLog with risk scoring
// Learn it. Live it. Love it.
// ============================================================

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID') ?? '69db6144f66afe8317b2d0d7',
  serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') ?? '',
});

// --- Stripe signature verification (no SDK needed) ---
// Validates the `Stripe-Signature` header against the raw body using the
// webhook signing secret. Rejects forged or replayed (>5min) events.
async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => p.split('=').map((s) => s.trim())),
  );
  const timestamp = parts['t'];
  const expected = parts['v1'];
  if (!timestamp || !expected) return false;

  // replay protection
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > toleranceSec) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload),
  );
  const computed = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // constant-time compare
  if (computed.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

// --- helper: normalize any Stripe payment event into a ledger row ---
function extractPayment(eventType: string, data: any) {
  switch (eventType) {
    case 'checkout.session.completed':
      return {
        amount: (data.amount_total || 0) / 100,
        currency: (data.currency || 'usd').toUpperCase(),
        email: data.customer_details?.email || 'unknown',
        product: data.metadata?.product_name || 'RTV Product',
        tx_type: 'payment',
      };
    case 'invoice.paid':
      return {
        amount: (data.amount_paid || 0) / 100,
        currency: (data.currency || 'usd').toUpperCase(),
        email: data.customer_email || 'unknown',
        product: 'Subscription invoice',
        tx_type: 'subscription',
      };
    case 'payment_intent.succeeded':
      return {
        amount: (data.amount || 0) / 100,
        currency: (data.currency || 'usd').toUpperCase(),
        email: data.receipt_email || 'unknown',
        product: data.metadata?.product_name || 'RTV Payment',
        tx_type: 'payment',
      };
    default:
      return null;
  }
}

async function notify(msg: string, embed?: any) {
  const slack = Deno.env.get('SLACK_WEBHOOK_URL') || '';
  const discord = Deno.env.get('DISCORD_WEBHOOK_URL') || '';
  const jobs: Promise<unknown>[] = [];
  if (slack) {
    jobs.push(fetch(slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg }),
    }));
  }
  if (discord && embed) {
    jobs.push(fetch(discord, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    }));
  }
  await Promise.allSettled(jobs);
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    // 1) VERIFY SIGNATURE — reject forged calls.
    // In test mode without a secret configured, allow but flag it.
    const testMode = !webhookSecret;
    if (!testMode) {
      const valid = await verifyStripeSignature(rawBody, sig, webhookSecret);
      if (!valid) {
        console.error('❌ Stripe signature verification FAILED — rejecting');
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = event.type;
    const data = event.data?.object || {};
    console.log(`⚡ Stripe webhook: ${eventType} (verified=${!testMode})`);

    const payment = extractPayment(eventType, data);

    // 2) LOG PAYMENT EVENTS TO LEDGER (every type, not just checkout)
    if (payment) {
      await base44.asServiceRole.entities.RotationPayTransaction.create({
        tx_type: payment.tx_type,
        amount: payment.amount,
        currency: payment.currency,
        payment_rail: 'stripe',
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        blockchain_confirmed: false,
      });

      const msg = `💳 *NEW PAYMENT — RotationTV Network*\nProduct: ${payment.product}\nAmount: $${payment.amount} ${payment.currency}\nCustomer: ${payment.email}\nStatus: ✅ CONFIRMED`;
      await notify(msg, {
        title: '💳 New Payment Received',
        color: 3066993,
        fields: [
          { name: 'Product', value: payment.product, inline: true },
          { name: 'Amount', value: `$${payment.amount} ${payment.currency}`, inline: true },
          { name: 'Customer', value: payment.email, inline: false },
        ],
        footer: { text: 'RotationTV Network — RotationPay' },
        timestamp: new Date().toISOString(),
      });
    } else {
      // subscription lifecycle + unhandled: log only
      console.log(`ℹ️ Non-ledger event: ${eventType}`);
    }

    // 3) MIRROR EVERYTHING TO OMEGA AUDIT LOG (compliance trail)
    const amountUsd = payment?.amount ?? 0;
    const flags: string[] = [];
    if (testMode) flags.push('UNVERIFIED_NO_SECRET');
    if (amountUsd >= 5000) flags.push('HIGH_VALUE');
    // crude risk score: high-value or unverified raises it
    const riskScore = Math.min(
      100,
      (testMode ? 40 : 0) + (amountUsd >= 5000 ? 40 : amountUsd >= 999 ? 20 : 0),
    );
    await base44.asServiceRole.entities.OmegaAuditLog.create({
      audit_id: `stripe_${event.id || crypto.randomUUID()}`,
      event_type: eventType,
      entity: 'RotationPayTransaction',
      actor: payment?.email || 'stripe',
      actor_role: 'system',
      amount_usd: amountUsd,
      rail: 'stripe',
      stripe_event_id: event.id || null,
      risk_score: riskScore,
      flags,
      is_suspicious: riskScore >= 60,
      notes: payment ? 'Payment logged to ledger' : 'Lifecycle/unhandled event',
      raw_payload: JSON.stringify(event).slice(0, 4000),
    });

    return Response.json({ received: true, event: eventType, logged: !!payment });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
