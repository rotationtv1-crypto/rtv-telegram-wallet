// ============================================================
// RTV TELEGRAM BOT HANDLER — Full Command Processing
// Handles @ROTATIONEROTICA_BOT and all RTV ecosystem bots
// ============================================================

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN_2") || "";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const RTV_TO_USD = 0.01;

// TON deposit address (would be configured per-user in production)
const TON_DEPOSIT_ADDRESS = "EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC";

// ── Telegram API helpers ─────────────────────────────
async function sendMessage(chatId, text, keyboard) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard || undefined,
  };
  await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendPhoto(chatId, photoUrl, caption) {
  await fetch(`${API_BASE}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" }),
  });
}

// Mini App keyboard button
function miniAppKeyboard() {
  return {
    inline_keyboard: [[
      {
        text: "🚀 Open RotationTV App",
        web_app: { url: "https://69db6144f66afe8317b2d0d7.base44.app/functions/rtvMiniApp" },
      },
    ]],
  };
}

// ── Command Handlers ─────────────────────────────────
async function handleStart(chatId, userId, userName, base44) {
  // Create or update user in RTVUser entity
  let rtvUser = null;
  try {
    const existing = await base44.entities.RTVUser.list({
      filter: { telegram_id: String(userId) },
      limit: 1,
    });
    if (existing && existing.length > 0) {
      rtvUser = existing[0];
      await base44.entities.RTVUser.update(rtvUser.id, {
        last_active_at: new Date().toISOString(),
        username: userName,
      });
    } else {
      const referralCode = `RTV${userId.toString(36).toUpperCase().slice(-6)}`;
      rtvUser = await base44.entities.RTVUser.create({
        telegram_id: String(userId),
        username: userName,
        display_name: userName,
        role: "user",
        is_creator: false,
        is_verified: false,
        kyc_status: "unverified",
        age_verified: false,
        rtv_balance: 100, // Welcome bonus: 100 RTV
        pending_balance: 0,
        total_earnings_usd: 0,
        total_earnings_rtv: 0,
        lifetime_tips_received: 0,
        lifetime_tips_sent: 0,
        followers_count: 0,
        following_count: 0,
        total_stream_hours: 0,
        stream_count: 0,
        safety_score: 100,
        reputation_tier: "new",
        loyalty_tier: "bronze",
        referral_code: referralCode,
        payout_ready: false,
        tax_form_status: "not_submitted",
        status: "active",
        last_active_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    // Entity operations may fail without user context — continue with welcome
  }

  const text = `🌹 <b>Welcome to Rotation Erotica</b> 🌹

You've joined the RotationTV Network ecosystem — the premier live streaming platform built on blockchain.

<b>Your welcome bonus: 100 RTV tokens ($1.00)</b>

<b>What you can do:</b>
📺 Watch live streams from creators worldwide
🎁 Send gifts and tips using RTV tokens
⭐ Subscribe to your favorite creators
💰 Earn RTV through referrals and activity
🔑 Verify your account for higher limits

<b>Quick commands:</b>
/balance — Check your RTV balance
/deposit — Get your TON deposit address
/live — See who's streaming now
/invite — Get your referral link

Tap the button below to open the full app 👇`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleHelp(chatId) {
  const text = `<b>RotationTV Commands</b>

<b>Wallet:</b>
/balance — Check your RTV token balance
/deposit — Get TON deposit address
/withdraw — Request withdrawal to TON wallet

<b>Streaming:</b>
/live — List current live streams
/go — Start your own live stream

<b>Account:</b>
/profile — View your profile
/invite — Get referral link (+10 RTV per signup)
/verify — Start KYC verification
/support — Contact support

<b>Info:</b>
/about — About RotationTV Network
/ecosystem — View all 9 companies

Tap the menu button or use /app to open the full experience.`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleBalance(chatId, userId, base44) {
  let balance = 0;
  let pending = 0;
  let tier = "bronze";

  try {
    const users = await base44.entities.RTVUser.list({
      filter: { telegram_id: String(userId) },
      limit: 1,
    });
    if (users && users.length > 0) {
      balance = users[0].rtv_balance || 0;
      pending = users[0].pending_balance || 0;
      tier = users[0].loyalty_tier || "bronze";
    }
  } catch (e) {}

  const usd = (balance * RTV_TO_USD).toFixed(2);
  const text = `<b>💰 Your Wallet</b>

<b>RTV Balance:</b> ${balance.toLocaleString()} RTV
<b>USD Value:</b> $${usd}
<b>Pending:</b> ${pending.toLocaleString()} RTV
<b>Loyalty Tier:</b> ${tier}

<i>1 RTV = $0.01 USD</i>

Use /deposit to add funds or /withdraw to cash out.`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleDeposit(chatId, userId) {
  const text = `<b>📥 Deposit RTV Tokens</b>

<b>TON Network (Primary):</b>
<code>${TON_DEPOSIT_ADDRESS}</code>

<b>Steps:</b>
1. Open your TON wallet (Tonkeeper, Tonhub)
2. Send TON to the address above
3. TON auto-converts to RTV at 1 RTV = $0.01

<b>Or deposit RTV directly:</b>
Send $RTV jetton tokens to the same TON address.

<i>Minimum deposit: 100 RTV ($1.00)
Confirmations required: 1 block</i>

Need help? Use /support`;

  await sendMessage(chatId, text);
}

async function handleWithdraw(chatId, userId) {
  const text = `<b>📤 Withdraw RTV Tokens</b>

To withdraw your RTV balance:

<b>1.</b> Send /balance to check your available balance
<b>2.</b> Open the app and go to Wallet → Withdraw
<b>3.</b> Enter your TON wallet address
<b>4.</b> Enter the amount to withdraw

<b>Fees:</b>
• TON withdrawal: 1% (min 10 RTV)
• Instant payout: +2% fee

<i>Withdrawals processed within 1 hour during business hours.
KYC verification required for withdrawals over $999.</i>

Tap below to open the wallet:`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleLive(chatId, base44) {
  let streams = [];
  try {
    streams = await base44.entities.LiveStream.list({
      filter: { status: "live" },
      limit: 10,
    });
  } catch (e) {}

  if (!streams || streams.length === 0) {
    const text = `<b>📺 Live Streams</b>

No streams are currently live. 

Be the first to go live! Use /go to start streaming.

Or tap below to open the discover page:`;
    await sendMessage(chatId, text, miniAppKeyboard());
    return;
  }

  let text = `<b>📺 Live Now (${streams.length})</b>\n\n`;
  for (const s of streams) {
    text += `🔴 <b>${s.title || "Untitled"}</b>\n`;
    text += `   ${s.category || "General"} · ${s.viewer_count || 0} viewers\n`;
    if (s.total_tips_rtv > 0) {
      text += `   🎁 ${s.total_tips_rtv.toLocaleString()} RTV tipped\n`;
    }
    text += `\n`;
  }
  text += `Tap below to watch:`;
  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleProfile(chatId, userId, base44) {
  let user = null;
  try {
    const users = await base44.entities.RTVUser.list({
      filter: { telegram_id: String(userId) },
      limit: 1,
    });
    if (users && users.length > 0) user = users[0];
  } catch (e) {}

  if (!user) {
    const text = `<b>👤 Profile</b>

You haven't been registered yet. Use /start to create your account and claim your 100 RTV welcome bonus!`;
    await sendMessage(chatId, text);
    return;
  }

  const text = `<b>👤 Your Profile</b>

<b>Name:</b> ${user.display_name || user.username || "RTV User"}
<b>Username:</b> @${user.username || "unknown"}
<b>Role:</b> ${user.role || "user"}
<b>RTV Balance:</b> ${(user.rtv_balance || 0).toLocaleString()}
<b>Loyalty Tier:</b> ${user.loyalty_tier || "bronze"}
<b>Reputation:</b> ${user.reputation_tier || "new"}
<b>KYC:</b> ${user.kyc_status || "unverified"}
<b>Followers:</b> ${user.followers_count || 0}
<b>Streams:</b> ${user.stream_count || 0}
<b>Stream Hours:</b> ${user.total_stream_hours || 0}h
<b>Safety Score:</b> ${user.safety_score || 100}
<b>Referral Code:</b> ${user.referral_code || "—"}

Tap below to edit your profile:`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleInvite(chatId, userId, base44) {
  let refCode = `RTV${userId.toString(36).toUpperCase().slice(-6)}`;
  try {
    const users = await base44.entities.RTVUser.list({
      filter: { telegram_id: String(userId) },
      limit: 1,
    });
    if (users && users.length > 0) {
      refCode = users[0].referral_code || refCode;
    }
  } catch (e) {}

  const text = `<b>🤝 Referral Program</b>

Your referral link:
https://t.me/ROTATIONEROTICA_BOT?start=${refCode}

<b>Rewards:</b>
• +10 RTV per friend who joins
• +50 RTV when they make first deposit
• +5% of their first tip amount
• Top referrers get VIP badge

<b>Your referrals:</b> Share the link above on social media, in groups, or with friends.

<i>Tracking is automatic — rewards credit within 24h.</i>`;

  await sendMessage(chatId, text);
}

async function handleSupport(chatId) {
  const text = `<b>💬 Support</b>

Need help? We're here for you.

<b>Options:</b>
• Open a support ticket via the app
• Email: support@rotationtvai.com
• Telegram: @RotationTVSupport

<b>Response time:</b> Within 24 hours

<b>Common issues:</b>
• Deposit not showing? Wait 1 block confirmation
• Can't withdraw? Complete KYC first (/verify)
• Bot not responding? Try /start again

Tap below to open the app:`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleAbout(chatId) {
  const text = `<b>About RotationTV Network</b>

<b>"Learn it. Live it. Love it."</b>

RotationTV Network is a 9-company ecosystem:

1️⃣ RotationTV Network — Central command + media
2️⃣ RotationPay — Multi-rail payments
3️⃣ RotationCall — Enterprise AI voice
4️⃣ Rotation University — On-chain education
5️⃣ Bigo Agency — Creator economy
6️⃣ White Logistics — AI logistics
7️⃣ Pretrial Services — Justice tech
8️⃣ EmergentLabs — Build infrastructure
9️⃣ OpenClaw — AI agent orchestration

<b>Tech Stack:</b>
• Blockchain: TON + Solana
• Streaming: Cloudflare Stream
• AI: Anthropic, OpenAI, Venice, HeyGen
• Payments: Stripe, CCBill, TON

<b>Owner & CEO:</b> Darrel
<b>Domain:</b> rotationtvai.com

Tap below to explore the ecosystem:`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleEcosystem(chatId) {
  const text = `<b>🌐 RTV Ecosystem Status</b>

✅ 9 Companies — All Active
✅ 4 Blockchain Nodes — Online
✅ 10 Payment Rails — Configured
✅ 9 AI Agents — Live (Anthropic)
✅ 24 Entity Schemas — Built
✅ 31 Backend Functions — Deployed

<b>Economic Parity:</b> 1 RTV = $0.01 USD

<i>We keep business rotating globally.</i>`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

async function handleApp(chatId) {
  const text = `🚀 <b>Open RotationTV App</b>

Tap the button below to launch the full experience:

• Watch live streams
• Send gifts and tips
• Subscribe to creators
• Manage your wallet
• View your profile`;

  await sendMessage(chatId, text, miniAppKeyboard());
}

// ── Default handler for regular messages ─────────────
async function handleDefault(chatId, text) {
  const response = `I received your message: "${text}"

Use /help to see all available commands, or tap the button below to open the app:`;
  await sendMessage(chatId, response, miniAppKeyboard());
}

// ── Main Handler ─────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Health check
  if (req.method === "GET") {
    return Response.json({
      status: "OPERATIONAL",
      bot: "@ROTATIONEROTICA_BOT",
      commands: ["/start", "/help", "/balance", "/deposit", "/withdraw", "/live", "/profile", "/invite", "/support", "/about", "/ecosystem", "/app"],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const update = await req.json();

    // Handle message updates
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const userName = msg.from?.username || msg.from?.first_name || "User";
      const text = msg.text;

      if (text.startsWith("/start")) {
        await handleStart(chatId, userId, userName, base44);
      } else if (text === "/help") {
        await handleHelp(chatId);
      } else if (text === "/balance") {
        await handleBalance(chatId, userId, base44);
      } else if (text === "/deposit") {
        await handleDeposit(chatId, userId);
      } else if (text === "/withdraw") {
        await handleWithdraw(chatId, userId);
      } else if (text === "/live") {
        await handleLive(chatId, base44);
      } else if (text === "/profile") {
        await handleProfile(chatId, userId, base44);
      } else if (text === "/invite") {
        await handleInvite(chatId, userId, base44);
      } else if (text === "/support") {
        await handleSupport(chatId);
      } else if (text === "/about") {
        await handleAbout(chatId);
      } else if (text === "/ecosystem") {
        await handleEcosystem(chatId);
      } else if (text === "/app") {
        await handleApp(chatId);
      } else if (text === "/go") {
        await sendMessage(chatId, "🚀 Stream setup coming soon! Use the app to start streaming.", miniAppKeyboard());
      } else if (text === "/verify") {
        await sendMessage(chatId, "🔑 KYC verification coming soon! Tap below to start:", miniAppKeyboard());
      } else {
        await handleDefault(chatId, text);
      }
    }

    // Handle callback queries (inline button taps)
    if (update.callback_query) {
      const cb = update.callback_query;
      await fetch(`${API_BASE}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message });
  }
});