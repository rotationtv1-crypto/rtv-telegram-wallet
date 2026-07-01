# ROTATIONTV NETWORK
## Telegram Bot & Mini App Playbook
### Complete Implementation Guide

---

```
╔═══════════════════════════════════════════════════════════════╗
║  @ROTATIONEROTICA_BOT  ·  ROTATIONTV NETWORK                 ║
║  Neon-Lime Brand System  ·  HMAC-SHA256  ·  Telegram Stars   ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture)
2. [Bot Setup & Configuration](#bot-setup)
3. [8 Bot Commands — Full Implementation](#commands)
4. [Mini App — Frontend](#mini-app-frontend)
5. [HMAC-SHA256 Authentication](#hmac-auth)
6. [Sovereign Payments via Telegram Stars](#payments)
7. [Backend API Server](#backend)
8. [Deployment & Environment](#deployment)

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                   ROTATIONTV NETWORK STACK                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   TELEGRAM LAYER                                              │
│   ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│   │  Bot API    │───▶│  Mini App    │───▶│ Telegram Stars│  │
│   │  Webhooks   │    │  WebApp      │    │   Payments    │  │
│   └─────────────┘    └──────────────┘    └───────────────┘  │
│          │                  │                    │            │
│          ▼                  ▼                    ▼            │
│   ┌────────────────────────────────────────────────────┐    │
│   │              BACKEND API  (Node.js / Express)       │    │
│   │         HMAC-SHA256 Verification Middleware         │    │
│   └────────────────────────────────────────────────────┘    │
│          │                  │                    │            │
│          ▼                  ▼                    ▼            │
│   ┌────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│   │ PostgreSQL │   │    Redis    │   │   S3 / CDN      │   │
│   │  (Users,   │   │  (Sessions, │   │  (Video/Media)  │   │
│   │  Orders)   │   │   Cache)    │   │                 │   │
│   └────────────┘   └─────────────┘   └─────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. BOT SETUP & CONFIGURATION

### 2.1 BotFather Registration

```bash
# Telegram BotFather commands sequence:
/newbot
  → Name: RotationTV Network
  → Username: ROTATIONEROTICA_BOT

/setdescription
  → 🟢 RotationTV Network — Premium adult content rotation.
     Subscribe. Stream. Stay sovereign.

/setabouttext
  → Powered by Telegram Stars · HMAC-Secured · 18+ Only

/setuserpic
  → [upload neon-lime logo asset]

/setcommands
  → start - Launch RotationTV Network
  → subscribe - View subscription tiers
  → browse - Open content browser
  → myaccount - Account dashboard
  → playlist - My saved playlist
  → redeem - Redeem access code
  → leaderboard - Top creators this week
  → support - Contact support

/setmenubutton
  → type: web_app
  → text: 🟢 Open RotationTV
  → url: https://app.rotationtv.network
```

### 2.2 Environment Configuration

```bash
# .env
BOT_TOKEN=7xxxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOT_USERNAME=ROTATIONEROTICA_BOT
WEBHOOK_URL=https://api.rotationtv.network/webhook
WEBHOOK_SECRET=your_webhook_secret_token_here

MINI_APP_URL=https://app.rotationtv.network
API_BASE_URL=https://api.rotationtv.network

HMAC_SECRET=your_hmac_secret_min_32_chars_here

DATABASE_URL=postgresql://user:pass@localhost:5432/rotationtv
REDIS_URL=redis://localhost:6379

STARS_TEST_MODE=false

NODE_ENV=production
PORT=3000
```

### 2.3 Project Structure

```
rotationtv/
├── bot/
│   ├── index.js              # Bot entry point
│   ├── commands/
│   │   ├── start.js
│   │   ├── subscribe.js
│   │   ├── browse.js
│   │   ├── myaccount.js
│   │   ├── playlist.js
│   │   ├── redeem.js
│   │   ├── leaderboard.js
│   │   └── support.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimit.js
│   └── keyboards/
│       └── index.js
├── api/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── content.js
│   │   ├── payments.js
│   │   └── users.js
│   └── middleware/
│       ├── hmac.js
│       └── session.js
├── miniapp/
│   ├── index.html
│   ├── app.js
│   ├── styles/
│   │   └── main.css
│   └── components/
│       ├── Home.js
│       ├── Browse.js
│       ├── Player.js
│       └── Account.js
├── database/
│   ├── schema.sql
│   └── migrations/
├── package.json
└── ecosystem.config.js
```

---

## 3. BOT COMMANDS — FULL IMPLEMENTATION

### 3.1 Main Bot Entry Point

```javascript
// bot/index.js
require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { message }           = require('telegraf/filters');

const startCommand       = require('./commands/start');
const subscribeCommand   = require('./commands/subscribe');
const browseCommand      = require('./commands/browse');
const myaccountCommand   = require('./commands/myaccount');
const playlistCommand    = require('./commands/playlist');
const redeemCommand      = require('./commands/redeem');
const leaderboardCommand = require('./commands/leaderboard');
const supportCommand     = require('./commands/support');
const authMiddleware     = require('./middleware/auth');
const rateLimitMiddleware= require('./middleware/rateLimit');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ── Global Middleware ──────────────────────────────────────────
bot.use(session());
bot.use(rateLimitMiddleware);
bot.use(authMiddleware);

// ── Commands ───────────────────────────────────────────────────
bot.command('start',       startCommand);
bot.command('subscribe',   subscribeCommand);
bot.command('browse',      browseCommand);
bot.command('myaccount',   myaccountCommand);
bot.command('playlist',    playlistCommand);
bot.command('redeem',      redeemCommand);
bot.command('leaderboard', leaderboardCommand);
bot.command('support',     supportCommand);

// ── Callback Query Handler ─────────────────────────────────────
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith('sub_'))       return handleSubscription(ctx, data);
  if (data.startsWith('redeem_'))    return handleRedeem(ctx, data);
  if (data.startsWith('playlist_'))  return handlePlaylistAction(ctx, data);
  if (data === 'open_app')           return ctx.answerCbQuery('Opening RotationTV…');
  
  await ctx.answerCbQuery();
});

// ── Pre-checkout Handler (Stars Payments) ──────────────────────
bot.on('pre_checkout_query', async (ctx) => {
  // Always answer true — validation happens server-side
  await ctx.answerPreCheckoutQuery(true);
});

// ── Successful Payment Handler ────────────────────────────────
bot.on(message('successful_payment'), async (ctx) => {
  const payment = ctx.message.successful_payment;
  await handleSuccessfulPayment(ctx, payment);
});

// ── Launch ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}`, {
    secret_token: process.env.WEBHOOK_SECRET,
  });
  console.log('🟢 RotationTV Bot running via webhook');
} else {
  bot.launch();
  console.log('🟢 RotationTV Bot running via polling');
}

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
```

---

### COMMAND 1 — `/start`

```javascript
// bot/commands/start.js
const { Markup } = require('telegraf');
const db         = require('../../database');

module.exports = async (ctx) => {
  const user     = ctx.from;
  const deeplink = ctx.message.text.split(' ')[1]; // /start <payload>

  // ── Upsert user ──────────────────────────────────────────────
  await db.query(`
    INSERT INTO users (telegram_id, username, first_name, last_name, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (telegram_id) DO UPDATE
      SET username   = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name  = EXCLUDED.last_name,
          last_seen  = NOW()
  `, [user.id, user.username, user.first_name, user.last_name]);

  // ── Handle referral deeplink ──────────────────────────────────
  if (deeplink && deeplink.startsWith('ref_')) {
    const referrerId = deeplink.replace('ref_', '');
    await db.query(`
      INSERT INTO referrals (referred_id, referrer_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT DO NOTHING
    `, [user.id, referrerId]);
  }

  // ── Fetch subscription status ─────────────────────────────────
  const subRow = await db.query(
    `SELECT tier, expires_at FROM subscriptions
     WHERE telegram_id = $1 AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [user.id]
  );
  const hasSub  = subRow.rows.length > 0;
  const subTier = hasSub ? subRow.rows[0].tier : null;

  const greeting = `
╔══════════════════════════════╗
║  🟢  R O T A T I O N T V    ║
║       N E T W O R K         ║
╚══════════════════════════════╝

Welcome, *${escapeMarkdown(user.first_name)}*. 

${hasSub
  ? `✅ Active: *${subTier.toUpperCase()}* tier`
  : `🔓 No active subscription`}

RotationTV is the sovereign adult content network built natively on Telegram. Stream curated rotations, subscribe to creators, and pay with *Telegram Stars* — no banks, no friction.

*What would you like to do?*
`;

  await ctx.replyWithMarkdownV2(
    greeting.replace(/[.!]/g, '\\$&'),
    Markup.inlineKeyboard([
      [
        Markup.button.webApp('🟢 Open RotationTV', process.env.MINI_APP_URL),
      ],
      [
        Markup.button.callback('💎 Subscribe',      'open_subscribe'),
        Markup.button.callback('📺 Browse',         'open_browse'),
      ],
      [
        Markup.button.callback('👤 My Account',     'open_account'),
        Markup.button.callback('🎁 Redeem Code',    'open_redeem'),
      ],
      [
        Markup.button.url(
          '📣 Share RotationTV',
          `https://t.me/share/url?url=https://t.me/ROTATIONEROTICA_BOT?start=ref_${user.id}`
        ),
      ],
    ])
  );
};

function escapeMarkdown(text) {
  return (text || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
```

---

### COMMAND 2 — `/subscribe`

```javascript
// bot/commands/subscribe.js
const { Markup } = require('telegraf');
const db         = require('../../database');

const TIERS = [
  {
    id:       'basic',
    name:     '⚡ BASIC',
    stars:    99,
    duration: 30,
    perks:    ['SD streaming', '50 videos/day', 'Standard rotation'],
  },
  {
    id:       'premium',
    name:     '🟢 PREMIUM',
    stars:    249,
    duration: 30,
    perks:    ['HD streaming', 'Unlimited videos', 'Priority rotation', 'Exclusive drops'],
  },
  {
    id:       'elite',
    name:     '👑 ELITE',
    stars:    599,
    duration: 30,
    perks:    ['4K streaming', 'Offline downloads', 'Creator DMs', 'VIP rotation', 'Early access'],
  },
];

module.exports = async (ctx) => {
  const userId = ctx.from.id;

  // ── Current subscription ──────────────────────────────────────
  const current = await db.query(
    `SELECT tier, expires_at FROM subscriptions
     WHERE telegram_id = $1 AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [userId]
  );

  let currentInfo = '';
  if (current.rows.length > 0) {
    const exp = new Date(current.rows[0].expires_at).toLocaleDateString();
    currentInfo = `\n📋 Current: *${current.rows[0].tier.toUpperCase()}* — expires ${exp}\n`;
  }

  const tierButtons = TIERS.map((tier) => {
    const perkList = tier.perks.map((p) => `  • ${p}`).join('\n');
    return [
      Markup.button.callback(
        `${tier.name}  ·  ⭐ ${tier.stars} Stars/mo`,
        `sub_${tier.id}`
      ),
    ];
  });

  const tierText = TIERS.map((t) =>
    `*${t.name}* — ⭐ ${t.stars} Stars\n${t.perks.map((p) => `  › ${p}`).join('\n')}`
  ).join('\n\n');

  await ctx.replyWithMarkdownV2(
    `🟢 *ROTATIONTV SUBSCRIPTION TIERS*\n${currentInfo}\n${tierText}\n\n_All payments via Telegram Stars\\. No card needed\\._`
      .replace(/[.!]/g, (m) => '\\' + m),
    Markup.inlineKeyboard([
      ...tierButtons,
      [Markup.button.callback('← Back', 'back_start')],
    ])
  );
};

// ── Handle sub_ callback ──────────────────────────────────────
async function handleSubscription(ctx, data) {
  const tierId = data.replace('sub_', '');
  const tier   = TIERS.find((t) => t.id === tierId);
  if (!tier) return ctx.answerCbQuery('Invalid tier');

  await ctx.answerCbQuery(`Initiating ${tier.name} subscription…`);

  // Send Telegram Stars invoice
  await ctx.telegram.sendInvoice(ctx.from.id, {
    title:           `RotationTV ${tier.name}`,
    description:     `30-day ${tier.name} subscription. ${tier.perks.join(', ')}.`,
    payload:         JSON.stringify({ tierId, userId: ctx.from.id, type: 'subscription' }),
    provider_token:  '',                // Empty for Telegram Stars
    currency:        'XTR',            // Telegram Stars currency code
    prices:          [{ label: `${tier.name} — 30 days`, amount: tier.stars }],
    photo_url:       'https://cdn.rotationtv.network/invoice-banner.jpg',
    photo_width:     800,
    photo_height:    400,
    need_name:       false,
    need_email:      false,
    is_flexible:     false,
  });
}

module.exports.handleSubscription = handleSubscription;
module.exports.TIERS               = TIERS;
```

---

### COMMAND 3 — `/browse`

```javascript
// bot/commands/browse.js
const { Markup } = require('telegraf');
const db         = require('../../database');

module.exports = async (ctx) => {
  const userId = ctx.from.id;

  // ── Check access ──────────────────────────────────────────────
  const access = await db.query(
    `SELECT tier FROM subscriptions
     WHERE telegram_id = $1 AND expires_at > NOW()
     LIMIT 1`,
    [userId]
  );

  const hasSub = access.rows.length > 0;

  // ── Fetch featured categories ─────────────────────────────────
  const categories = await db.query(
    `SELECT id, name, slug, video_count, thumbnail_url
     FROM categories WHERE active = true
     ORDER BY sort_order ASC LIMIT 8`
  );

  if (!hasSub) {
    // ── Free preview mode ────────────────────────────────────────
    await ctx.replyWithMarkdownV2(
      `📺 *ROTATIONTV BROWSE*\n\n🔒 Full access requires a subscription\\.\n\nYou can preview *3 free videos* per day\\.\n\n_Subscribe to unlock the full rotation\\._`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('📺 Browse Free Previews', `${process.env.MINI_APP_URL}/browse?preview=1`)],
        [Markup.button.callback('💎 Subscribe Now', 'open_subscribe')],
      ])
    );
    return;
  }

  // ── Full subscriber browse ────────────────────────────────────
  const catList = categories.rows
    .map((c) => `  📂 *${escapeMd(c.name)}* — ${c.video_count} videos`)
    .join('\n');

  await ctx.replyWithMarkdownV2(
    `📺 *ROTATIONTV BROWSE*\n\n*Categories:*\n${catList}\n\n_Open the app for the full experience\\._`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🟢 Open Full Browser', `${process.env.MINI_APP_URL}/browse`)],
      ...categories.rows.slice(0, 4).map((c) => [
        Markup.button.webApp(
          `📂 ${c.name}`,
          `${process.env.MINI_APP_URL}/browse/${c.slug}`
        ),
      ]),
      [Markup.button.callback('← Back', 'back_start')],
    ])
  );
};

function escapeMd(text) {
  return (text || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
```

---

### COMMAND 4 — `/myaccount`

```javascript
// bot/commands/myaccount.js
const { Markup } = require('telegraf');
const db         = require('../../database');

module.exports = async (ctx) => {
  const userId = ctx.from.id;

  // ── Fetch full user profile ───────────────────────────────────
  const [userRow, subRow, statsRow, referralRow] = await Promise.all([
    db.query(`SELECT * FROM users WHERE telegram_id = $1`, [userId]),
    db.query(
      `SELECT tier, stars_spent, expires_at FROM subscriptions
       WHERE telegram_id = $1 AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    ),
    db.query(
      `SELECT videos_watched, total_watch_time_minutes, last_watch
       FROM user_stats WHERE telegram_id = $1`,
      [userId]
    ),
    db.query(
      `SELECT COUNT(*) AS count FROM referrals WHERE referrer_id = $1`,
      [userId]
    ),
  ]);

  const user     = userRow.rows[0] || {};
  const sub      = subRow.rows[0];
  const stats    = statsRow.rows[0] || {};
  const refCount = referralRow.rows[0]?.count || 0;

  const subStatus = sub
    ? `✅ *${sub.tier.toUpperCase()}* — expires ${new Date(sub.expires_at).toLocaleDateString()}`
    : `❌ No active subscription`;

  const watchTime = stats.total_watch_time_minutes
    ? `${Math.floor(stats.total_watch_time_minutes / 60)}h ${stats.total_watch_time_minutes % 60}m`
    : '0m';

  const accountCard = `
👤 *MY ROTATIONTV ACCOUNT*

*User:* @${escapeMd(ctx.from.username || 'anonymous')}
*ID:* \`${userId}\`
*Member since:* ${new Date(user.created_at || Date.now()).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
📋 *SUBSCRIPTION*
${subStatus}

━━━━━━━━━━━━━━━━━━━━
📊 *STATS*
🎬 Videos watched: *${stats.videos_watched || 0}*
⏱ Watch time: *${watchTime}*
👥 Referrals: *${refCount}*
⭐ Stars spent: *${sub?.stars_spent || 0}*
`.trim();

  await ctx.replyWithMarkdownV2(
    accountCard.replace(/[.!]/g, (m) => '\\' + m),
    
