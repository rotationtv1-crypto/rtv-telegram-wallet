// @RotationPayBot v2.1 — TON Jetton LIVE 2026-04-26 — RotationTV Token Wallet — Full Web3 Unified
// PayPal + TG Wallet + Solana/$RTV + Stripe + Venmo + Zelle + USDC
// Web3 Unification: $RTV Infinite Wealth Engine activated
// Presidential Authority: Darrel — RotationTV Network
// "Learn it. Live it. Love it."

const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY";
const PORTAL_URL = "https://rotationtvai.com";
const TG_WALLET = "https://t.me/wallet";
const BOT_USERNAME = "RotationPayBot";
const DASHBOARD_API = "https://69db6144f66afe8317b2d0d7.base44.app/functions/rtvWalletDashboard";
const RTVS_TON_JETTON = "EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC";
const RTVS_TON_OWNER = "UQC1H7DA27OA_HqCmU72w7ZmTYEh_Hx1bBPku0FSdo9EHU4k";
const RTVS_SOLANA_MINT = "GStxrfBdQvPb2hEdSR8ehrw6Es2rcaGSVAGwRNEHCHTL";
const TONVIEWER_URL = `https://tonviewer.com/${RTVS_TON_JETTON}`;

// $RTV Infinite Wealth Engine — price tiers + staking multipliers
const RTV_PACKAGES = [
  { label: "Starter", amount: "2,500 $RTV", price: "$99", multiplier: "1x", tier: "Community" },
  { label: "Builder", amount: "10,000 $RTV", price: "$349", multiplier: "2x staking", tier: "Ecosystem" },
  { label: "Sovereign", amount: "50,000 $RTV", price: "$1,499", multiplier: "5x staking", tier: "Presidential" },
];

Deno.serve(async (req) => {
  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
    if (!BOT_TOKEN) return Response.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const message = body.message;
    const callback = body.callback_query;

    async function send(chat_id: any, text: string, extra: any = {}) {
      return fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", ...extra }),
      });
    }

    // Full Web3 Unified Main Keyboard
    const MAIN_KB = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💎 Telegram Wallet (USDT/TON/BTC)", callback_data: "pay_telegram_wallet" }],
          [{ text: "🅿️ PayPal", callback_data: "pay_paypal" }, { text: "💳 Card (Stripe)", callback_data: "pay_stripe" }],
          [{ text: "⭐ Telegram Stars", callback_data: "pay_usdt" }, { text: "⭐ Buy Stars", callback_data: "buy_stars" }],
          [{ text: "⚡ All 7 Rails", callback_data: "check_rails" }, { text: "🔗 Refer & Earn", callback_data: "refer_earn" }],
          [{ text: "🌐 Web3 Status", callback_data: "web3_status" }, { text: "💹 $RTV Engine", callback_data: "rtv_engine" }],
          [{ text: "🏛️ Open RotationTV Portal", url: PORTAL_URL }],
        ]
      }
    };

    // ─── CALLBACK QUERIES ──────────────────────────────────────────────
    if (callback) {
      const chat_id = callback.message?.chat?.id;
      const user_id = callback.from?.id;
      const data = callback.data;

      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callback.id, text: "⚡ Loading..." }),
      });

      const backBtn = [{ text: "⬅️ Main Menu", callback_data: "main_menu" }];

      if (data === "pay_paypal") {
        await send(chat_id, `🅿️ *PayPal — RotationPay Gateway*\n\n✅ Accepted in 200+ countries\n✅ Instant settlement\n✅ Trusted by 400M+ users\n\n_Earn 2% $RTV cashback on every payment._`, {
          reply_markup: { inline_keyboard: [[{ text: "🅿️ Pay with PayPal →", url: PAYPAL_LINK }], backBtn] }
        });

      } else if (data === "pay_telegram_wallet") {
        await send(chat_id,
          `💎 *Telegram Wallet — Web3 Native*\n\n` +
          `Pay with:\n• USDT — stable, global\n• TON — Telegram's blockchain\n• BTC — original store of value\n• Gold — precious metal-backed\n\n` +
          `✅ 150M+ users · *0% fees* · Instant\n✅ Web3 native — no bank needed\n\n` +
          `_Connect once. Pay anywhere in the Telegram universe._`, {
          reply_markup: { inline_keyboard: [[{ text: "💎 Open Telegram Wallet →", url: TG_WALLET }], backBtn] }
        });

      } else if (data === "pay_usdt") {
        await send(chat_id,
          `◎ *Solana / $RTV — Fastest Rail*\n\n` +
          `⚡ 2-second finality\n⚡ ~$0.0001 per transaction\n⚡ Powered by Chainstack nodes\n\n` +
          `🪙 *Earn 2% $RTV cashback* on every Solana payment\n🔗 All transactions verified on-chain\n\n` +
          `_$RTV is the resonant frequency of the RotationTV ecosystem._`, {
          reply_markup: { inline_keyboard: [
            [{ text: "◎ Open Solana Portal →", url: PORTAL_URL }],
            [{ text: "⭐ Buy Stars First →", callback_data: "buy_stars" }],
            backBtn,
          ]}
        });

      } else if (data === "pay_stripe") {
        await send(chat_id, `💳 *Card Payment — Stripe*\n\nVisa · Mastercard · Amex · Discover\n\n✅ Global · Secure · Instant authorization\n_2.9% + $0.30 per transaction_`, {
          reply_markup: { inline_keyboard: [[{ text: "💳 Pay with Card →", url: PORTAL_URL }], backBtn] }
        });

      } else if (data === "buy_stars") {
        await send(chat_id,
          `⚡ *$RTV Infinite Wealth Engine*\n\n` +
          `$RTV is the resonant token of the RotationTV Network — every company in the ecosystem feeds value back into $RTV.\n\n` +
          `*3 Tiers of Infinite Accumulation:*\n\n` +
          `🟡 *Starter* — 2,500 $RTV\n   Price: $99 | Tier: Community\n\n` +
          `🟠 *Builder* — 10,000 $RTV\n   Price: $349 | 2x staking multiplier | Tier: Ecosystem\n\n` +
          `🔴 *Sovereign* — 50,000 $RTV\n   Price: $1,499 | 5x staking multiplier | Tier: Presidential\n\n` +
          `_Every $RTV you hold earns cashback, staking rewards, and ecosystem dividends as the network grows._\n\n` +
          `Choose your payment rail:`, {
          reply_markup: { inline_keyboard: [
            [{ text: "🅿️ PayPal →", url: PAYPAL_LINK }, { text: "💎 TG Wallet →", url: TG_WALLET }],
            [{ text: "💳 Card / Stripe →", url: PORTAL_URL }, { text: "◎ Solana →", url: PORTAL_URL }],
            backBtn,
          ]}
        });

      } else if (data === "check_rails") {
        await send(chat_id,
          `⚡ *RotationPay — 7 Unified Payment Rails*\n\n` +
          `🟢 💎 *Telegram Wallet* — USDT/TON/BTC/Gold — *0%* — Instant\n` +
          `🟢 🅿️ *PayPal* — 200+ countries — 3.49%+$0.49 — Instant\n` +
          `🟢 ◎ *Solana/$RTV* — ~$0.0001 — *2 seconds*\n` +
          `🟢 💳 *Stripe Card* — Global — 2.9%+$0.30\n` +
          `🟢 💸 *Venmo* — US — *0%* — 30min\n` +
          `🟢 🏦 *Zelle* — US — *0%* — 5min\n` +
          `🟢 🪙 *USDC/Coinbase* — Global — 1% — 10sec\n\n` +
          `*7 rails. One gateway. Zero friction.*\n_We keep business rotating globally. 🌍_`,
          { reply_markup: { inline_keyboard: [backBtn] } }
        );

      } else if (data === "refer_earn") {
        const userRefLink = `t.me/${BOT_USERNAME}?start=ref_${user_id}`;
        const shareText = encodeURIComponent("💎 Join RotationTV Token Wallet — 7 payment rails, earn $RTV cashback. Learn it. Live it. Love it. 🚀 rotationtvai.com");
        await send(chat_id,
          `🔗 *Refer & Earn — Build Your $RTV Army*\n\n` +
          `*Your Referral Link:*\n\`${userRefLink}\`\n\n` +
          `*What you earn:*\n` +
          `🪙 $RTV tokens for every referral\n` +
          `💰 5% Telegram commission on their spending (1 month)\n` +
          `📈 Network grows → $RTV value grows\n\n` +
          `*Drop it everywhere:*\n` +
          `Twitter · Discord · Instagram · WhatsApp · LinkedIn\n\n` +
          `_The RotationTV referral army starts with YOU. Every person you bring in resonates value back to your $RTV stack._ ⚡`, {
          reply_markup: { inline_keyboard: [
            [{ text: "📢 Share to Telegram →", url: `https://t.me/share/url?url=${encodeURIComponent(userRefLink)}&text=${shareText}` }],
            backBtn,
          ]}
        });

      } else if (data === "web3_status") {
        await send(chat_id,
          `🌐 *Web3 Unification Status — RotationTV Network*\n\n` +
          `⛓️ *Blockchain Layer*\n` +
          `✅ Solana Mainnet — LIVE\n` +
          `✅ Chainstack RPC/WSS — ACTIVE\n` +
          `✅ $RTV (Solana) — DEPLOYED\n` +
          `✅ $RTVS (TON Jetton) — LIVE \`EQB2wn8L...ygxC\`\n` +
          `✅ NFT Diplomas — MINTING\n\n` +
          `💳 *Payment Layer*\n` +
          `✅ RotationPay Gateway — 7 rails LIVE\n` +
          `✅ PayPal — 200+ countries\n` +
          `✅ Telegram Wallet — Web3 native\n` +
          `✅ Stripe/Venmo/Zelle — ACTIVE\n\n` +
          `🤖 *AI Layer*\n` +
          `✅ @RotationPayBot — LIVE\n` +
          `✅ RotationCall AI Voice — ACTIVE\n` +
          `✅ EmergentLabs — BUILD MODE\n` +
          `✅ OpenClaw Agents — DEPLOYED\n\n` +
          `🎓 *Education Layer*\n` +
          `✅ RTV AI University — ENROLLING\n` +
          `✅ NFT Credentials — ON-CHAIN\n\n` +
          `_Presidential Authority: Darrel — Owner & CEO_\n_"Learn it. Live it. Love it." 🏛️_`,
          { reply_markup: { inline_keyboard: [[{ text: "🌐 Full Portal →", url: PORTAL_URL }], backBtn] } }
        );

      } else if (data === "rtv_engine") {
        await send(chat_id,
          `💹 *$RTV Infinite Wealth Engine*\n\n` +
          `⚡ *Tesla Resonance Network Architecture:*\n\n` +
          `Every company in the RotationTV ecosystem feeds energy back into $RTV:\n\n` +
          `◎ RotationPay → 2% cashback in $RTV\n` +
          `🎓 RTV University → $RTV for course completion\n` +
          `📞 RotationCall → $RTV for enterprise plans\n` +
          `🎨 Bigo Agency → $RTV for creative projects\n` +
          `🚚 White Logistics → $RTV for shipping rewards\n` +
          `⚖️ Pretrial Services → $RTV for platform access\n` +
          `🔬 EmergentLabs → $RTV for build credits\n\n` +
          `*The flywheel:*\n` +
          `Spend $RTV → Get services → Earn $RTV back → Network grows → $RTV value increases → ♾️\n\n` +
          `_This is not speculation. This is ecosystem utility. Every dollar spent in the RTV ecosystem becomes $RTV wealth._\n\n` +
          `*Current Packages:*\n` +
          `🟡 2,500 $RTV — $99 (1x)\n` +
          `🟠 10,000 $RTV — $349 (2x staking)\n` +
          `🔴 50,000 $RTV — $1,499 (5x staking)`,
          { reply_markup: { inline_keyboard: [
            [{ text: "⭐ Buy Stars Now →", callback_data: "buy_stars" }],
            [{ text: "◎ Solana Portal →", url: PORTAL_URL }],
            backBtn,
          ]}}
        );

      } else if (data === "main_menu") {
        await send(chat_id, `🏛️ *RotationTV Token Wallet*\n\n_"Learn it. Live it. Love it."_ 🚀\n\nChoose your path:`, MAIN_KB);
      }

      return Response.json({ ok: true });
    }

    // ─── MESSAGES ──────────────────────────────────────────────────────
    if (!message) return Response.json({ ok: true });

    const chat_id = message.chat?.id;
    const user_id = message.from?.id;
    const raw_text = message.text || "";
    const text = raw_text.toLowerCase().trim();
    const first_name = message.from?.first_name || "there";

    // Referral tracking
    if (raw_text.startsWith("/start ref_")) {
      await send(chat_id,
        `🏛️ *Welcome to RotationTV Token Wallet, ${first_name}!*\n\n` +
        `You joined via a referral — your friend earns $RTV every time you use the bot! 🎉\n\n` +
        `⚡ You're now connected to the $RTV Infinite Wealth Engine.\n` +
        `Every transaction earns cashback. Every referral builds your stack.\n\n` +
        `_"Learn it. Live it. Love it."_ 🚀`,
        MAIN_KB
      );
      return Response.json({ ok: true });
    }

    if (text === "/start") {
      await send(chat_id,
        `🏛️ *Welcome to RotationTV Token Wallet, ${first_name}!*\n\n` +
        `The official Web3 payment gateway of RotationTV Network.\n\n` +
        `⚡ *7 rails. Zero friction. Infinite $RTV:*\n` +
        `💎 Telegram Wallet — USDT/TON/BTC/Gold\n` +
        `🅿️ PayPal — 200+ countries, instant\n` +
        `◎ Solana/$RTV — 2-second blockchain\n` +
        `💳 Stripe — Visa/MC/Amex\n` +
        `💸 Venmo + Zelle — 0% US transfers\n` +
        `🪙 Coinbase USDC — stablecoin\n\n` +
        `🪙 *Every payment earns 2% $RTV cashback*\n` +
        `🔗 *Refer friends → earn $RTV + 5% commission*\n\n` +
        `_"Learn it. Live it. Love it."_ 🚀`,
        MAIN_KB
      );

    } else if (text === "/web3" || text === "/status") {
      await send(chat_id,
        `🌐 *Web3 Unification — RotationTV Network*\n\n` +
        `✅ Solana Mainnet — LIVE\n` +
        `✅ $RTV (Solana) — DEPLOYED\n` +
          `✅ $RTVS (TON Jetton) — LIVE \`EQB2wn8L...ygxC\`\n` +
        `✅ Chainstack Nodes — ACTIVE\n` +
        `✅ 7 Payment Rails — LIVE\n` +
        `✅ NFT Diplomas — MINTING\n` +
        `✅ RotationCall — AI VOICE LIVE\n` +
        `✅ Referral Engine — RUNNING\n` +
        `✅ Omega Audit — ENGAGED\n\n` +
        `_Darrel — Owner & CEO — Presidential Authority_\n🌐 rotationtvai.com`
      );

    } else if (text === "/rtv" || text === "/token") {
      await send(chat_id,
        `⚡ *$RTV Infinite Wealth Engine*\n\n` +
        `$RTV is the resonant frequency of the RotationTV ecosystem.\n\n` +
        `*3 Tiers:*\n` +
        `🟡 2,500 $RTV — $99 (Community)\n` +
        `🟠 10,000 $RTV — $349 (Ecosystem · 2x staking)\n` +
        `🔴 50,000 $RTV — $1,499 (Presidential · 5x staking)\n\n` +
        `_9 companies feed value into $RTV. The flywheel never stops._ ♾️`, {
        reply_markup: { inline_keyboard: [
          [{ text: "🅿️ PayPal", url: PAYPAL_LINK }, { text: "💎 TG Wallet", url: TG_WALLET }],
          [{ text: "💳 Card", url: PORTAL_URL }, { text: "◎ Solana", url: PORTAL_URL }],
        ]}
      });

    } else if (text === "/refer" || text === "/referral") {
      const userRefLink = `t.me/${BOT_USERNAME}?start=ref_${user_id}`;
      const shareText = encodeURIComponent("💎 Join RotationTV Token Wallet — 7 payment rails, earn $RTV cashback. Learn it. Live it. Love it. 🚀 rotationtvai.com");
      await send(chat_id,
        `🔗 *Your $RTV Referral Link*\n\n\`${userRefLink}\`\n\n` +
        `Earn *$RTV tokens + 5% Telegram commission* on every referral's spending for 1 month!\n\n` +
        `*Share everywhere:*\nTwitter · Discord · Instagram · LinkedIn · WhatsApp\n\n` +
        `_Build the referral army. Build your $RTV stack. Build infinite wealth._ ⚡`, {
        reply_markup: { inline_keyboard: [[{ text: "📢 Share Now →", url: `https://t.me/share/url?url=${encodeURIComponent(userRefLink)}&text=${shareText}` }]] }
      });

    } else if (text === "/pay" || text === "/payment") {
      await send(chat_id, `💰 *RotationPay — Choose Your Rail:*`, MAIN_KB);

    } else if (text === "/paypal") {
      await send(chat_id, `🅿️ PayPal — instant, 200+ countries. Earn 2% $RTV cashback.`, {
        reply_markup: { inline_keyboard: [[{ text: "🅿️ Pay →", url: PAYPAL_LINK }]] }
      });

    } else if (text === "/wallet") {
      await send(chat_id, `💎 Telegram Wallet — USDT/TON/BTC. 0% fees. Web3 native.`, {
        reply_markup: { inline_keyboard: [[{ text: "💎 Open →", url: TG_WALLET }]] }
      });

    } else if (text === "/solana") {
      await send(chat_id, `◎ Solana/$RTV — 2sec finality. Earn 2% $RTV cashback. Chainstack powered.`, {
        reply_markup: { inline_keyboard: [[{ text: "◎ Portal →", url: PORTAL_URL }]] }
      });

    } else if (text === "/balance" || text === "/wallet_dashboard") {
      // Live wallet dashboard — calls rtvWalletDashboard function
      await send(chat_id, `⏳ _Fetching live $RTV data from Chainstack..._`);
      try {
        const dashRes = await fetch(DASHBOARD_API, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dashboard", telegram_id: user_id }),
        });
        const dashData = await dashRes.json();
        if (dashData.error === "no_wallet") {
          await send(chat_id,
            `🔗 *No Wallet Connected*

Send your Solana public key to connect:

\`/connect_wallet YOUR_WALLET_ADDRESS\`

_Example:_
\`/connect_wallet GStxrfBdQvPb...\``, {
            reply_markup: { inline_keyboard: [[{ text: "◎ Get Solana Wallet →", url: PORTAL_URL }]] }
          });
        } else if (dashData.dashboard_message) {
          await send(chat_id, dashData.dashboard_message, {
            reply_markup: { inline_keyboard: [
              [{ text: "🔄 Refresh", callback_data: "refresh_balance" }, { text: "⚡ Resonance Meter", callback_data: "resonance_meter" }],
              [{ text: "🪙 Buy More $RTV →", callback_data: "buy_stars" }],
            ]}
          });
        } else {
          await send(chat_id, `⚠️ Could not fetch balance. Try again in a moment.`);
        }
      } catch (e) {
        await send(chat_id, `⚠️ RPC error. Chainstack nodes are active — try /balance again.`);
      }

    } else if (text.startsWith("/connect_wallet")) {
      // /connect_wallet <SOLANA_ADDRESS>
      const parts = raw_text.trim().split(/\s+/);
      const addr = parts[1];
      if (!addr) {
        await send(chat_id,
          `🔗 *Connect Your Solana Wallet*

Send your public key:

\`/connect_wallet YOUR_WALLET_ADDRESS\`

_Your public key starts with a capital letter and is ~44 characters. Never share your private key or seed phrase._`
        );
      } else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
        await send(chat_id, `❌ *Invalid address.* Solana addresses are 32-44 characters. Try again:
\`/connect_wallet YOUR_ADDRESS\``);
      } else {
        await send(chat_id, `⏳ _Connecting wallet to RotationTV ecosystem..._`);
        try {
          const connectRes = await fetch(DASHBOARD_API, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "connect_wallet", telegram_id: user_id, wallet_address: addr }),
          });
          const connectData = await connectRes.json();
          if (connectData.success) {
            await send(chat_id,
              `✅ *Wallet Connected!*

\`${addr.slice(0,6)}...${addr.slice(-4)}\`

⚡ Your $RTV resonance field is now ACTIVE.
Use /balance to see your live dashboard.`, {
              reply_markup: { inline_keyboard: [[{ text: "💹 View Dashboard →", callback_data: "refresh_balance" }]] }
            });
          } else {
            await send(chat_id, `❌ Connection failed. Check the address and try again.`);
          }
        } catch (e) {
          await send(chat_id, `⚠️ Connection error. Try again in a moment.`);
        }
      }

    } else if (text === "/rails") {
      await send(chat_id,
        `⚡ *7 Unified Rails*\n\n` +
        `🟢 💎 TG Wallet — 0% — Instant\n` +
        `🟢 🅿️ PayPal — 3.49% — Instant\n` +
        `🟢 ◎ Solana/$RTV — ~$0.0001 — 2sec\n` +
        `🟢 💳 Stripe — 2.9%\n` +
        `🟢 💸 Venmo — 0% — 30min\n` +
        `🟢 🏦 Zelle — 0% — 5min\n` +
        `🟢 🪙 USDC — 1% — 10sec`
      );

    } else if (text === "/university") {
      await send(chat_id,
        `🎓 *RTV AI University*\n\n` +
        `• AI Creator Certification — $49/mo\n` +
        `• Web3 Developer Track — $297/mo\n` +
        `• NFT Diploma — On-chain credential\n\n` +
        `🪙 *Earn $RTV tokens for every course completed*\n` +
        `🏛️ NFT Diploma = credential that lives on Solana forever`, {
        reply_markup: { inline_keyboard: [
          [{ text: "🎓 Enroll Now →", url: PORTAL_URL }],
          [{ text: "🅿️ PayPal", url: PAYPAL_LINK }, { text: "💎 TG Wallet", url: TG_WALLET }],
        ]}
      });

    } else if (text === "/support") {
      await send(chat_id,
        `🛟 *RotationTV Support*\n\n` +
        `📧 rotationtv1@gmail.com\n` +
        `🌐 rotationtvai.com\n` +
        `📱 @RotationPayBot\n\n` +
        `_"Learn it. Live it. Love it."_ 🏛️`
      );

    } else if (text === "/invoice") {
      await send(chat_id, `📄 Generate invoices with all 7 payment rails at the portal.`, {
        reply_markup: { inline_keyboard: [[{ text: "📄 Invoice Portal →", url: PORTAL_URL }]] }
      });

    } else if (text === "/tesla" || text === "/⚡") {
      await send(chat_id,
        `⚡ *Tesla Resonance Protocol — $RTV*\n\n` +
        `_"If you only knew the magnificence of the 3, 6 and 9..."_\n— Nikola Tesla\n\n` +
        `The $RTV token operates like a Tesla Coil:\n\n` +
        `🔵 *Input:* Any of 7 payment rails\n` +
        `⚡ *Resonance:* 9 companies amplify the signal\n` +
        `🔴 *Output:* Infinite $RTV wealth generation\n\n` +
        `Every transaction through RotationPay, every course at RTV University, every call on RotationCall — all feed electromagnetic energy back into the $RTV resonance field.\n\n` +
        `_The network IS the Tesla Coil. $RTV IS the free energy._\n\n` +
        `*Your move:* Buy $RTV. Stake it. Watch the resonance multiply. ♾️`, {
        reply_markup: { inline_keyboard: [
          [{ text: "⚡ Activate Wealth Engine →", callback_data: "rtv_engine" }],
          [{ text: "⭐ Buy Stars →", callback_data: "buy_stars" }],
        ]}
      });

    } else {
      await send(chat_id, `🏛️ *RotationTV Token Wallet*\n\n_"Learn it. Live it. Love it."_ ⚡\n\nChoose your path:`, MAIN_KB);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
