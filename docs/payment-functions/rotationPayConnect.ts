// RotationPay Stripe Connect + API Key Reseller Engine
// Rothschild Mode — Full multiparty payment architecture
// Presidential Authority: Darrel — RotationTV Network

import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2024-06-20" });

function generateAPIKey(prefix: string = "rtv"): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const random = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}_live_${random}`;
}

function generateTestKey(prefix: string = "rtv"): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const random = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}_test_${random}`;
}

const PLANS: Record<string, { price_usd: number; revenue_share_pct: number; rtv_cashback_pct: number; rate_limit: number; monthly_calls: number; rails: string[]; audit_tier: string }> = {
  starter: {
    price_usd: 99,
    revenue_share_pct: 0.8,
    rtv_cashback_pct: 1.0,
    rate_limit: 100,
    monthly_calls: 10000,
    rails: ["stripe_card", "venmo", "cash_app"],
    audit_tier: "standard"
  },
  growth: {
    price_usd: 299,
    revenue_share_pct: 1.2,
    rtv_cashback_pct: 2.0,
    rate_limit: 500,
    monthly_calls: 100000,
    rails: ["stripe_card", "venmo", "cash_app", "zelle", "usdc"],
    audit_tier: "premium"
  },
  enterprise: {
    price_usd: 999,
    revenue_share_pct: 2.0,
    rtv_cashback_pct: 3.0,
    rate_limit: 2000,
    monthly_calls: 1000000,
    rails: ["stripe_card", "venmo", "cash_app", "zelle", "usdc", "solana_rtv"],
    audit_tier: "rothschild"
  },
  reseller: {
    price_usd: 497,
    revenue_share_pct: 1.5,
    rtv_cashback_pct: 2.5,
    rate_limit: 1000,
    monthly_calls: 500000,
    rails: ["stripe_card", "venmo", "cash_app", "zelle", "usdc", "solana_rtv"],
    audit_tier: "rothschild"
  }
};

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-rtv-api-key",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const base44 = (await import("https://cdn.jsdelivr.net/npm/@base44/sdk/dist/index.js")).default;
  const app = base44.init({ appId: "69db6144f66afe8317b2d0d7" });

  try {
    const { action, ...body } = await req.json();

    // =============================================
    // ACTION: CREATE MERCHANT + STRIPE CONNECT ACCOUNT
    // =============================================
    if (action === "create_merchant") {
      const { business_name, email, owner_name, plan = "starter", business_type = "individual", country = "US" } = body;

      if (!business_name || !email) {
        return new Response(JSON.stringify({ error: "business_name and email required" }), { status: 400, headers: cors });
      }

      const planConfig = PLANS[plan] || PLANS.starter;

      // Create Stripe Connect account for merchant
      const stripeAccount = await stripe.accounts.create({
        type: "express",
        country,
        email,
        business_type,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          rtv_merchant: "true",
          plan,
          business_name,
          owner_name,
          created_by: "rotationpay_platform"
        }
      });

      // Create onboarding link
      const onboardingLink = await stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: "https://rotationtvai.com/merchant/reauth",
        return_url: "https://rotationtvai.com/merchant/success",
        type: "account_onboarding",
      });

      // Generate API keys
      const liveKey = generateAPIKey("rtv");
      const testKey = generateTestKey("rtv");

      // Save merchant to Base44
      const merchant = await app.asServiceRole.entities.RotationPayMerchant.create({
        business_name,
        owner_name: owner_name || "",
        email,
        business_type,
        stripe_account_id: stripeAccount.id,
        stripe_onboarding_url: onboardingLink.url,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        api_key: liveKey,
        api_key_live: liveKey,
        api_key_test: testKey,
        plan,
        monthly_volume: 0,
        total_volume: 0,
        revenue_share_pct: planConfig.revenue_share_pct,
        rtv_cashback_pct: planConfig.rtv_cashback_pct,
        status: "onboarding",
        rails_enabled: planConfig.rails,
        country,
        currency: "usd",
        kyc_verified: false,
        audit_tier: planConfig.audit_tier,
        notes: `Plan: ${plan} | Rate limit: ${planConfig.rate_limit}/min | Monthly calls: ${planConfig.monthly_calls}`
      });

      // Save API key record
      await app.asServiceRole.entities.RTVAPIKey.create({
        merchant_id: merchant.id,
        key_name: `${business_name} — Live Key`,
        api_key: liveKey,
        key_type: "live",
        permissions: ["payments:create", "payments:read", "webhooks:manage", "rtv:transfer"],
        rate_limit_per_min: planConfig.rate_limit,
        monthly_call_limit: planConfig.monthly_calls,
        calls_this_month: 0,
        status: "active",
        environment: "live",
        revenue_generated: 0
      });

      // Audit log
      await app.asServiceRole.entities.OmegaAuditLog.create({
        audit_id: `OMEGA-${Date.now()}`,
        event_type: "merchant_created",
        entity: "RotationPayMerchant",
        entity_id: merchant.id,
        actor: email,
        actor_role: "merchant",
        amount_usd: planConfig.price_usd,
        amount_rtv: 0,
        rail: "stripe_connect",
        risk_score: 10,
        flags: [],
        jurisdiction: country,
        tax_category: "platform_fee",
        is_suspicious: false,
        reviewed_by: "OMEGA_AUTO",
        notes: `New merchant onboarded: ${business_name} | Plan: ${plan}`
      });

      return new Response(JSON.stringify({
        success: true,
        merchant_id: merchant.id,
        stripe_account_id: stripeAccount.id,
        onboarding_url: onboardingLink.url,
        api_keys: {
          live: liveKey,
          test: testKey,
          instructions: "Use x-rtv-api-key header on all RotationPay API calls"
        },
        plan_details: {
          plan,
          monthly_price: `$${planConfig.price_usd}`,
          revenue_share: `${planConfig.revenue_share_pct}%`,
          rtv_cashback: `${planConfig.rtv_cashback_pct}%`,
          rails: planConfig.rails,
          rate_limit: `${planConfig.rate_limit} req/min`,
          audit_tier: planConfig.audit_tier
        },
        next_step: "Complete Stripe onboarding at the URL above to enable payments",
        powered_by: "RotationTV Network — We Keep Business Rotating Globally"
      }), { headers: cors });
    }

    // =============================================
    // ACTION: CREATE CHECKOUT SESSION FOR MERCHANT PLAN
    // =============================================
    if (action === "create_plan_checkout") {
      const { plan = "starter", email, merchant_name } = body;
      const PRICE_MAP: Record<string, string> = {
        starter: "price_1TPvzu6uXd0gkLrQmP1gGIRK",
        growth: "price_1TPvzr6uXd0gkLrQxVPFcEEe",
        enterprise: "price_1TPvzw6uXd0gkLrQtwYJF8qn",
        rtv_pack: "price_1TPvzz6uXd0gkLrQwC6zA7ma"
      };

      const priceId = PRICE_MAP[plan];
      if (!priceId) return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: cors });

      const session = await stripe.checkout.sessions.create({
        mode: plan === "rtv_pack" ? "payment" : "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: email,
        success_url: `https://rotationtvai.com/merchant/success?session={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://rotationtvai.com/merchant/pricing`,
        metadata: { plan, merchant_name: merchant_name || "", source: "rotationpay_platform" },
        subscription_data: plan !== "rtv_pack" ? {
          metadata: { plan, rtv_cashback: String(PLANS[plan]?.rtv_cashback_pct || 1) }
        } : undefined
      });

      return new Response(JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        plan
      }), { headers: cors });
    }

    // =============================================
    // ACTION: PROCESS PAYMENT via RTV rails
    // =============================================
    if (action === "process_payment") {
      const { api_key, amount_usd, currency = "usd", rail = "stripe_card", recipient, description, metadata = {} } = body;

      if (!api_key || !amount_usd) {
        return new Response(JSON.stringify({ error: "api_key and amount_usd required" }), { status: 400, headers: cors });
      }

      // Validate API key
      const merchants = await app.asServiceRole.entities.RotationPayMerchant.filter({ api_key });
      if (!merchants.length) {
        await app.asServiceRole.entities.OmegaAuditLog.create({
          audit_id: `OMEGA-${Date.now()}`,
          event_type: "invalid_api_key_attempt",
          entity: "payment",
          actor: "unknown",
          actor_role: "anonymous",
          amount_usd: Number(amount_usd),
          risk_score: 95,
          flags: ["INVALID_KEY", "SECURITY_ALERT"],
          is_suspicious: true,
          reviewed_by: "OMEGA_AUTO",
          notes: "Payment attempted with invalid API key — blocked"
        });
        return new Response(JSON.stringify({ error: "Invalid API key", code: "AUTH_FAILED" }), { status: 401, headers: cors });
      }

      const merchant = merchants[0];
      const planConfig = PLANS[merchant.plan] || PLANS.starter;
      const platformFee = Math.round(amount_usd * 100 * (planConfig.revenue_share_pct / 100));
      const rtvCashback = amount_usd * (planConfig.rtv_cashback_pct / 100);

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount_usd * 100),
        currency,
        description: description || `RotationPay payment via ${rail}`,
        metadata: {
          merchant_id: merchant.id,
          merchant_name: merchant.business_name,
          rail,
          rtv_cashback: String(rtvCashback),
          ...metadata
        },
        ...(merchant.stripe_account_id ? {
          application_fee_amount: platformFee,
          transfer_data: { destination: merchant.stripe_account_id }
        } : {})
      });

      // Log to audit
      await app.asServiceRole.entities.OmegaAuditLog.create({
        audit_id: `OMEGA-${Date.now()}`,
        event_type: "payment_initiated",
        entity: "RotationPayTransaction",
        entity_id: paymentIntent.id,
        actor: merchant.email,
        actor_role: "merchant",
        amount_usd: Number(amount_usd),
        amount_rtv: rtvCashback,
        rail,
        stripe_event_id: paymentIntent.id,
        risk_score: 15,
        flags: [],
        jurisdiction: merchant.country || "US",
        tax_category: "payment",
        is_suspicious: false,
        reviewed_by: "OMEGA_AUTO",
        notes: `Payment via ${rail} | Platform fee: $${(platformFee / 100).toFixed(2)} | RTV cashback: ${rtvCashback.toFixed(4)}`
      });

      // Update merchant volume
      await app.asServiceRole.entities.RotationPayMerchant.update(merchant.id, {
        monthly_volume: (merchant.monthly_volume || 0) + Number(amount_usd),
        total_volume: (merchant.total_volume || 0) + Number(amount_usd)
      });

      return new Response(JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount_usd,
        platform_fee_usd: (platformFee / 100).toFixed(2),
        rtv_cashback: rtvCashback.toFixed(4),
        rail,
        status: paymentIntent.status,
        merchant: merchant.business_name
      }), { headers: cors });
    }

    // =============================================
    // ACTION: OMEGA AUDIT REPORT
    // =============================================
    if (action === "omega_audit") {
      const { period = "24h", auth_token } = body;

      // Presidential auth check
      if (auth_token !== "DARREL_OMEGA_2026") {
        return new Response(JSON.stringify({ error: "UNAUTHORIZED — Presidential access required", code: "OMEGA_LOCK" }), { status: 403, headers: cors });
      }

      const [merchants, apiKeys, auditLogs] = await Promise.all([
        app.asServiceRole.entities.RotationPayMerchant.list(),
        app.asServiceRole.entities.RTVAPIKey.list(),
        app.asServiceRole.entities.OmegaAuditLog.list()
      ]);

      const totalVolume = merchants.reduce((s: number, m: any) => s + (m.total_volume || 0), 0);
      const activeKeys = apiKeys.filter((k: any) => k.status === "active").length;
      const suspiciousEvents = auditLogs.filter((l: any) => l.is_suspicious).length;
      const totalRevenue = merchants.reduce((s: number, m: any) => s + ((m.total_volume || 0) * ((m.revenue_share_pct || 1) / 100)), 0);

      return new Response(JSON.stringify({
        omega_report: {
          timestamp: new Date().toISOString(),
          authority: "DARREL — PRESIDENTIAL",
          classification: "ROTHSCHILD_MODE",
          period,
          merchants: {
            total: merchants.length,
            active: merchants.filter((m: any) => m.status === "active").length,
            onboarding: merchants.filter((m: any) => m.status === "onboarding").length,
            total_volume_usd: totalVolume,
            platform_revenue_usd: totalRevenue
          },
          api_keys: {
            total_issued: apiKeys.length,
            active: activeKeys,
            revoked: apiKeys.filter((k: any) => k.status === "revoked").length
          },
          security: {
            total_events: auditLogs.length,
            suspicious_events: suspiciousEvents,
            risk_level: suspiciousEvents > 10 ? "HIGH" : suspiciousEvents > 3 ? "MEDIUM" : "LOW",
            last_audit: new Date().toISOString()
          },
          stripe: {
            account_id: "acct_1TLILF6uXd0gkLrQ",
            charges_enabled: false,
            action_required: "Complete Stripe account verification at dashboard.stripe.com to enable live payments"
          },
          rtv_token: {
            price_usd: 0.001,
            cashback_distributed_usd: totalVolume * 0.02,
            network: "Solana Mainnet"
          }
        },
        powered_by: "RotationTV Network OMEGA Architecture v2026"
      }), { headers: cors });
    }

    // =============================================
    // ACTION: LIST MERCHANTS (admin)
    // =============================================
    if (action === "list_merchants") {
      const { auth_token } = body;
      if (auth_token !== "DARREL_OMEGA_2026") {
        return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 403, headers: cors });
      }
      const merchants = await app.asServiceRole.entities.RotationPayMerchant.list();
      return new Response(JSON.stringify({ merchants, total: merchants.length }), { headers: cors });
    }

    // =============================================
    // ACTION: REVOKE API KEY
    // =============================================
    if (action === "revoke_key") {
      const { key_id, auth_token } = body;
      if (auth_token !== "DARREL_OMEGA_2026") {
        return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 403, headers: cors });
      }
      await app.asServiceRole.entities.RTVAPIKey.update(key_id, { status: "revoked" });
      await app.asServiceRole.entities.OmegaAuditLog.create({
        audit_id: `OMEGA-${Date.now()}`,
        event_type: "api_key_revoked",
        entity: "RTVAPIKey",
        entity_id: key_id,
        actor: "DARREL",
        actor_role: "presidential",
        risk_score: 5,
        flags: ["KEY_REVOKED"],
        is_suspicious: false,
        reviewed_by: "DARREL_PRESIDENTIAL",
        notes: "API key revoked by presidential authority"
      });
      return new Response(JSON.stringify({ success: true, message: "Key revoked" }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: "Unknown action", available_actions: ["create_merchant", "create_plan_checkout", "process_payment", "omega_audit", "list_merchants", "revoke_key"] }), { status: 400, headers: cors });

  } catch (err: any) {
    console.error("RotationPay Connect Error:", err);
    return new Response(JSON.stringify({ error: err.message, code: "SERVER_ERROR" }), { status: 500, headers: cors });
  }
}
