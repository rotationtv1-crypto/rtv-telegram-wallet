/**
 * TELEGRAM NATIVE PAYMENTS — Telegram Stars (XTR)
 * Rotationtvnetwork LLC | June 2026
 *
 * Telegram Stars requires NO external payment processor — it's Telegram's
 * own in-chat currency. Works for 18+ content (unlike Stripe/PayPal which
 * prohibit adult content). This is why Stars is a locked payment method
 * in the RTV spec alongside TON, Tribute, Stripe, PayPal.
 *
 * Flow: sendInvoice (currency="XTR", provider_token="") → user pays in Telegram
 *       → pre_checkout_query (must answer within 10s) → successful_payment update
 */

import { Bot, InlineKeyboard } from "grammy";

// 1 Telegram Star ≈ $0.013 USD (Telegram's official rate). We price in Stars directly.
export const STAR_PACKAGES = [
  { id: "stars_micro",   label: "Micro Pack",   stars: 100,  rtvs: 1000,   bonus_rtvs: 0 },
  { id: "stars_standard",label: "Standard Pack", stars: 500,  rtvs: 5000,   bonus_rtvs: 500 },
  { id: "stars_premium", label: "Premium Pack",  stars: 2000, rtvs: 25000,  bonus_rtvs: 5000 },
  { id: "stars_whale",   label: "Whale Pack",    stars: 5000, rtvs: 100000, bonus_rtvs: 30000 },
] as const;

export const STAR_SUBSCRIPTIONS = [
  { id: "sub_basic",      label: "Basic Sub",     stars: 770,  plan: "viewer_basic" },   // ~$9.99
  { id: "sub_pro",        label: "Pro Sub",       stars: 2310, plan: "viewer_pro" },      // ~$29.99
  { id: "sub_vip",        label: "VIP Elite Sub", stars: 7690, plan: "viewer_enterprise" },// ~$99.99
] as const;

interface TelegramInvoicePayload {
  type: "credit_pack" | "subscription" | "tip";
  user_id: string;
  package_id?: string;
  plan_id?: string;
  creator_id?: string;   // for tips
  amount_stars: number;
}

// ── Build & send a Stars invoice ──────────────────────────────────────────
export async function sendStarsInvoice(
  bot: Bot,
  chatId: number,
  title: string,
  description: string,
  payload: TelegramInvoicePayload,
  starsAmount: number
): Promise<void> {
  await bot.api.sendInvoice(
    chatId,
    title,
    description,
    JSON.stringify(payload),
    "XTR",                                    // Telegram Stars currency code
    [{ label: title, amount: starsAmount }],  // Stars has no decimal subdivision
    { provider_token: "" }                     // empty for Stars (no external provider)
  );
}

// ── /buy command handler — shows package menu ────────────────────────────
export async function handleBuyCommand(bot: Bot, ctx: any) {
  const kb = new InlineKeyboard();
  for (const pkg of STAR_PACKAGES) {
    kb.text(`⭐ ${pkg.label} — ${pkg.stars} Stars → ${pkg.rtvs + pkg.bonus_rtvs} RTVS`, `buy_${pkg.id}`).row();
  }
  kb.text("💎 Subscriptions →", "buy_subs_menu");

  await ctx.reply(
    `⭐ <b>Buy RTVS with Telegram Stars</b>\n\n` +
    STAR_PACKAGES.map(p =>
      `<b>${p.label}</b>: ${p.stars}⭐ → ${p.rtvs.toLocaleString()} RTVS${p.bonus_rtvs ? ` + ${p.bonus_rtvs.toLocaleString()} bonus` : ""}`
    ).join("\n") +
    `\n\n<i>Tap a package below to pay instantly with Telegram Stars — no card needed.</i>`,
    { parse_mode: "HTML", reply_markup: kb }
  );
}

// ── Callback query router for buy_* buttons ───────────────────────────────
export async function handleBuyCallback(
  bot: Bot,
  ctx: any,
  userId: string
): Promise<boolean> {
  const data = ctx.callbackQuery?.data as string;
  if (!data?.startsWith("buy_")) return false;

  await ctx.answerCallbackQuery();

  if (data === "buy_subs_menu") {
    const kb = new InlineKeyboard();
    for (const sub of STAR_SUBSCRIPTIONS) {
      kb.text(`⭐ ${sub.label} — ${sub.stars} Stars/mo`, `buy_${sub.id}`).row();
    }
    await ctx.reply(
      `💎 <b>Monthly Subscriptions (via Stars)</b>\n\n` +
      STAR_SUBSCRIPTIONS.map(s => `<b>${s.label}</b>: ${s.stars}⭐/month`).join("\n"),
      { parse_mode: "HTML", reply_markup: kb }
    );
    return true;
  }

  const pkgId = data.replace("buy_", "");
  const pkg = STAR_PACKAGES.find(p => p.id === pkgId);
  const sub = STAR_SUBSCRIPTIONS.find(s => s.id === pkgId);

  if (pkg) {
    await sendStarsInvoice(
      bot, ctx.chat.id,
      `${pkg.label} — RotationTV`,
      `${pkg.rtvs.toLocaleString()} RTVS${pkg.bonus_rtvs ? ` + ${pkg.bonus_rtvs.toLocaleString()} bonus` : ""} instantly credited to your wallet.`,
      { type: "credit_pack", user_id: userId, package_id: pkg.id, amount_stars: pkg.stars },
      pkg.stars
    );
    return true;
  }

  if (sub) {
    await sendStarsInvoice(
      bot, ctx.chat.id,
      `${sub.label} — RotationTV`,
      `Monthly subscription — renews automatically via Stars.`,
      { type: "subscription", user_id: userId, plan_id: sub.plan, amount_stars: sub.stars },
      sub.stars
    );
    return true;
  }

  return false;
}

// ── pre_checkout_query — MUST answer within 10 seconds ────────────────────
export function registerPreCheckout(bot: Bot) {
  bot.on("pre_checkout_query", async (ctx) => {
    // Always approve — Stars payments are pre-validated by Telegram
    await ctx.answerPreCheckoutQuery(true).catch(() => {});
  });
}

// ── successful_payment — credit the user ─────────────────────────────────
export function registerSuccessfulPayment(
  bot: Bot,
  onCredit: (userId: string, payload: TelegramInvoicePayload, starsAmount: number) => Promise<void>
) {
  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    if (!payment) return;

    let payload: TelegramInvoicePayload;
    try {
      payload = JSON.parse(payment.invoice_payload);
    } catch {
      return;
    }

    await onCredit(payload.user_id, payload, payment.total_amount);

    const pkg = STAR_PACKAGES.find(p => p.id === payload.package_id);
    const sub = STAR_SUBSCRIPTIONS.find(s => s.id === payload.plan_id);

    await ctx.reply(
      `✅ <b>Payment Successful!</b>\n\n` +
      (pkg
        ? `💰 <b>${(pkg.rtvs + pkg.bonus_rtvs).toLocaleString()} RTVS</b> credited to your wallet!`
        : sub
        ? `💎 <b>${sub.label}</b> activated! Renews monthly.`
        : `Your purchase was credited.`) +
      `\n\n⭐ Paid: ${payment.total_amount} Stars\n` +
      `<i>Charge ID: ${payment.telegram_payment_charge_id.slice(0, 16)}...</i>\n\n` +
      `Use /balance to see your updated wallet.`,
      { parse_mode: "HTML" }
    );
  });
}

// ── Supabase credit helper (shared) ───────────────────────────────────────
export async function creditUserFromStarsPurchase(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string },
  telegramUserId: string,
  payload: TelegramInvoicePayload,
  starsAmount: number
): Promise<void> {
  const headers = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  // Find user
  const userRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUserId}&select=id,rtvs_balance`,
    { headers }
  );
  const users = await userRes.json() as any[];
  const user = users?.[0];
  if (!user) return;

  if (payload.type === "credit_pack") {
    const pkg = STAR_PACKAGES.find(p => p.id === payload.package_id);
    if (!pkg) return;
    const totalRtvs = pkg.rtvs + pkg.bonus_rtvs;

    await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ rtvs_balance: (user.rtvs_balance || 0) + totalRtvs }),
    });

    await fetch(`${env.SUPABASE_URL}/rest/v1/credit_transactions`, {
      method: "POST", headers,
      body: JSON.stringify({
        user_id: user.id, company: "rotationtv", credit_type: "rtvs",
        amount: totalRtvs, balance_after: (user.rtvs_balance || 0) + totalRtvs,
        reason: "purchase", metadata: { via: "telegram_stars", stars: starsAmount },
      }),
    }).catch(() => {});
  }

  if (payload.type === "subscription" && payload.plan_id) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/subscriptions`, {
      method: "POST", headers,
      body: JSON.stringify({
        user_id: user.id, plan: payload.plan_id, price_usd: starsAmount * 0.013,
        status: "active", started_at: new Date().toISOString(),
      }),
    }).catch(() => {});
  }
}
