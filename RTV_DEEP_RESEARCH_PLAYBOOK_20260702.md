# RTV DEEP RESEARCH KNOWLEDGE LOGIC PLAYBOOK
## Complete Build + Use Guide for the RotationTV Network Ecosystem
### July 2, 2026 | Presidential Authority: Darrel

> "Learn it. Live it. Love it. — We keep business rotating globally."

---

## PART 1: REAL CONSTRAINTS (No BS, No "Trust Me Bro")

### The Actual Stack

```
WHAT EXISTS AND WORKS RIGHT NOW:

Frontend:
  - 19 React pages (JSX/TSX) in /pages/ directory
  - NOT deployed to any hosting (sitting in Base44 sandbox)
  - Brand: Neon-lime #CCFF00 on Obsidian #0A0A0A
  - Erotica variant: Rose-gold on #0F0A0D charcoal

Backend:
  - 4 Cloudflare Workers (LIVE at *.rotationtvaicom.workers.dev)
    1. rtv-edge-gateway — 9-company API router
    2. rtv-payments — sovereign payment gateway (Stars + TON + RTV)
    3. rtv-blockchain — TON + Solana blockchain operations
    4. rtv-stream — full streaming platform (NEW)
  - 35 Base44 backend functions (deployed, returning 403 = exist but need auth)
  - All functions need JWT gates (currently open)

Database:
  - 24 Base44 entity schemas (working, RLS enabled)
  - Supabase PostgreSQL (73 tables, 16 RPC functions)
  - Cloudflare D1 (rotation-erotica-db, bridge to Supabase via wrapper)
  - Supabase anon key: BROKEN (94 chars, not JWT format)

Blockchain:
  - TON v3 Chainstack: LIVE (seqno 77028187)
  - TON v2: 405 (use v3 only)
  - Solana: 4 Chainstack nodes registered, but RPC returning 403 from Workers
  - Treasury: 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv (Solana)
  - Private keys: Injected into workers (format may be addresses not keys)

AI:
  - Anthropic Claude: WORKING (via Base44, key 3)
  - Google Gemini: WORKING (4 keys: 3, 4, 5, 6)
  - Venice AI: Keys valid but $0 credits (HTTP 402)
  - Kimi: Consumer key, not developer API key
  - ElevenLabs: Invalid
  - Perplexity: All 3 keys invalid
  - Manus: Endpoint not found

Payments:
  - Telegram Stars: LIVE (sovereign rail)
  - TON Jetton: LIVE (sovereign rail)
  - Internal RTV: LIVE (sovereign rail)
  - CCBill: CONFIGURED (adult-content processor, Erotica only)
  - Tribute: CONFIGURED (creator tipping, Erotica only)
  - Stripe: PURGED from Erotica (HTTP 410), active concept for RotationPay

Storage:
  - Cloudflare R2: 1 bucket (accessible via CF Token 5)
  - Cloudflare KV: 1 namespace
  - Cloudflare D1: 1 database (rotation-erotica-db)

Voice:
  - Twilio: +18446092087 (SMS + Voice + MMS)
  - Webhooks: Wired to rtv-edge-gateway

Messaging:
  - Telegram: @base44_229784_bot LIVE (this agent)
  - 4 other bot tokens: ALL EXPIRED/INVALID
  - WhatsApp: Connected via Base44
  - Discord: OAuth re-authorized, but webhook URL not set
  - Slack: Connected via Base44, but webhook URL not set
```

### What's ACTUALLY Failing (and why)

| Blocker | Root Cause | Fix | Who |
|---------|-----------|-----|-----|
| Supabase anon key | 94 chars, not JWT format (needs eyJ... ~200 chars) | Get correct key from Supabase Dashboard → Settings → API | Darrel |
| Venice AI $0 | Keys valid, no credits | Add $5+ at venice.ai/settings/api | Darrel |
| 4 Telegram bots | Tokens expired or invalid | Generate new tokens via @BotFather | Darrel |
| CF zone routes | No token has "Zone Workers Routes" permission | Create new CF token with that permission | Darrel |
| Frontend not deployed | No Pages project created | Run wrangler pages deploy | Nick |
| ElevenLabs | Invalid API key | Get new key from elevenlabs.io | Darrel |
| Perplexity | All keys invalid | Get new keys from perplexity.ai/settings/api | Darrel |
| Kimi API | Consumer key not developer | Get key from platform.kimi.ai | Darrel |
| BASE44_SERVICE_ROLE_KEY | Not set in environment | Get from Base44 dashboard → Settings → API | Darrel |
| STRIPE_WEBHOOK_SECRET | Not set | Get from Stripe dashboard → Developers → Webhooks | Darrel |
| DISCORD_WEBHOOK_URL | Not set | Create webhook in Discord channel settings | Darrel |
| RTV_TOKEN_MINT | Not set | Get from Solana token registry | Darrel |
| Solana RPC 403 | Chainstack IP whitelist | Whitelist Cloudflare IPs in Chainstack dashboard | Darrel |
| Manus API | Endpoint not found | Get proper API key from open.manus.ai | Darrel |
| SendGrid | Access forbidden | Regenerate key at sendgrid.com | Darrel |

---

## PART 2: STEP-BY-STEP BUILD GUIDE

### STEP 1: Frontend Deployment (Cloudflare Pages)

```bash
# 1. Build the SPA
cd /app/pages
npm install
npm run build  # outputs to dist/

# 2. Create Cloudflare Pages project
npx wrangler pages create rtv-frontend --production-branch main

# 3. Deploy
npx wrangler pages deploy dist --project-name rtv-frontend

# 4. Set environment variables in Pages dashboard:
#    VITE_API_URL = https://rtv-edge-gateway.rotationtvaicom.workers.dev
#    VITE_TELEGRAM_BOT = @ROTATIONEROTICA_BOT
#    VITE_SUPABASE_URL = https://xynkgaxfwvpcixissxdz.supabase.co
#    VITE_RTV_PARITY = 0.01
```

### STEP 2: Backend Function JWT Gates

Every Base44 function needs JWT authentication. Current state: all 35 functions return 403 (exist but unauthenticated).

```typescript
// Add to each function:
export default async function handler(req: Request) {
  // JWT verification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // Verify token with Base44 SDK
  // ... function logic
}
```

### STEP 3: Telegram Bot Setup

```bash
# 1. Go to @BotFather on Telegram
# 2. /newbot → create 4 bots:
#    - @RotationTVNetworkBot (main)
#    - @RotationPayBot (payments)
#    - @RTVSrotationBot (token services)
#    - @ROTATIONEROTICA_BOT (content platform)
# 3. Copy each token
# 4. Set webhook for each:
curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://rtv-edge-gateway.rotationtvaicom.workers.dev/api/bot/<bot_name>"
# 5. Disable Group Privacy for community bots:
#    @BotFather → /mybots → select bot → Bot Settings → Group Privacy → Turn off
```

### STEP 4: Supabase Configuration

```bash
# 1. Get correct API keys:
#    Supabase Dashboard → Project Settings → API
#    - Copy "anon" key (starts with eyJ... ~200 chars)
#    - Copy "service_role" key (starts with eyJ... ~200 chars)

# 2. Set in Base44 Secrets:
#    SUPABASE_ANON_KEY = eyJ... (the real JWT)
#    SUPABASE_SERVICE_ROLE_KEY = eyJ... (the real JWT)
#    BASE44_SERVICE_ROLE_KEY = (from Base44 dashboard)

# 3. Enable Telegram OAuth:
#    Supabase Dashboard → Authentication → Providers → Telegram
#    - Toggle ON
#    - Enter bot token
#    - Redirect URL: https://xynkgaxfwvpcixissxdz.supabase.co/auth/v1/callback

# 4. Install recommended wrappers:
#    Dashboard → Integrations → install:
#    - Slack Wrapper (team comms)
#    - Stripe Wrapper (payment data queries)
#    - Redis Wrapper (edge caching)
```

### STEP 5: Payment System Activation

```bash
# 1. Stripe webhook (for RotationPay, NOT Erotica):
#    Stripe Dashboard → Developers → Webhooks → Add endpoint
#    URL: https://rtv-payments.rotationtvaicom.workers.dev/api/webhook/stripe
#    Events: checkout.session.completed, invoice.paid, payment_intent.succeeded
#    Copy signing secret → set as STRIPE_WEBHOOK_SECRET

# 2. Telegram Stars (already configured):
#    Test with: POST https://rtv-stream.rotationtvaicom.workers.dev/api/pay/stars
#    Body: {"stars_amount": 100}
#    Expected: 100 Stars → 130 RTV

# 3. CCBill (for Erotica):
#    Sign up at ccbill.com → get merchant account
#    Configure payment form with RTV product ID
#    Set webhook URL: https://rtv-stream.rotationtvaicom.workers.dev/api/pay/ccbill/webhook

# 4. Tribute (for Erotica):
#    Configure at tribute platform with API key
#    Webhook: https://rtv-stream.rotationtvaicom.workers.dev/api/pay/tribute/webhook
```

### STEP 6: AI Provider Activation

```bash
# 1. Venice AI:
#    Go to venice.ai → Settings → API → Add Credits ($5 minimum)
#    Keys are already valid — just need balance
#    Monitor will auto-detect activation and fire ecosystem sync

# 2. Kimi (Moonshot):
#    Go to platform.kimi.ai (NOT the chat app)
#    Create developer API key (pay-as-you-go)
#    Replace the consumer key with developer key

# 3. ElevenLabs:
#    Go to elevenlabs.io → Profile → API Keys → Create new key
#    Replace invalid key

# 4. Perplexity:
#    Go to perplexity.ai → Settings → API → Regenerate keys
```

### STEP 7: Blockchain Operations

```bash
# 1. Fix Solana RPC 403:
#    Chainstack Dashboard → Solana node → Access Control
#    Whitelist Cloudflare IP ranges:
#      173.245.48.0/20, 103.21.244.0/22, 103.22.200.0/22,
#      141.171.72.0/22, 108.162.192.0/18, 190.93.240.0/20,
#      188.114.96.0/20, 197.234.240.0/22, 198.41.128.0/17,
#      162.158.0.0/15, 104.16.0.0/13, 104.24.0.0/14,
#      172.64.0.0/13, 131.0.72.0/22

# 2. Fund Solana treasury with gas:
#    Send 0.1 SOL (~$15) to: 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv
#    This enables NFT minting and on-chain transactions

# 3. Set RTV_TOKEN_MINT:
#    Get the token mint address from Solana explorer
#    Set as environment secret
```

---

## PART 3: FRONTEND VERIFICATION CHECKLIST

### Build & Compile Check
```
□ npm install completes with 0 errors
□ TypeScript compilation passes (tsc --noEmit)
□ Vite build succeeds (npm run build → dist/)
□ No "Module not found" errors
□ No TypeScript type errors
□ Bundle size < 500KB gzipped
```

### API Integration Test
```
□ Frontend can reach https://rtv-edge-gateway.rotationtvaicom.workers.dev/health
□ Frontend can reach https://rtv-stream.rotationtvaicom.workers.dev/health
□ Frontend can reach https://rtv-payments.rotationtvaicom.workers.dev/health
□ RTVWallet.jsx connects to /api/balance endpoint
□ RotationPayCheckout.jsx creates payment intents
□ StreamPlayer.jsx loads stream playback
□ TelegramMiniApp.tsx receives initData from Telegram
□ EcosystemHub.jsx loads 9 companies from entity
□ CommandCenter.jsx shows system health
□ OwnerPanel.jsx authenticates via OwnerGate
```

### State Management Review
```
□ No stale state after navigation
□ No undefined variables on initial render
□ Loading states shown during API calls
□ Error states handled (not just console.error)
□ User session persists across page refresh
□ RTV balance updates after transactions
□ Stream viewer count updates in real-time
□ Gift selection state clears after sending
```

### UI/UX Flow Test
```
□ Onboarding: User lands → age gate (if Erotica) → /start → 100 RTV welcome bonus
□ Wallet: View balance → buy RTV → see updated balance → view transactions
□ Stream: Browse streams → join stream → send tip → see combo animation
□ Payment: Select amount → choose rail (Stars/TON/CCBill) → confirm → success
□ Subscription: Browse tiers → select tier → pay → unlock perks
□ PK Battle: Create battle → set stake → opponent joins → battle runs → payout
□ Payout: View earnings → request payout → select method → confirm → pending
```

### Mobile Responsiveness
```
□ iPhone SE (375px) — all pages render correctly
□ iPhone 12 (390px) — all pages render correctly
□ iPad (768px) — layout adapts
□ Desktop (1920px) — layout uses full width
□ Telegram Mini App viewport — fits within Telegram chat
□ Touch targets minimum 44px
□ No horizontal scroll on mobile
□ Font sizes readable on mobile (min 16px body)
```

### Auth & Session Test
```
□ HMAC-SHA256 Telegram initData verification works
□ User session created on /start command
□ Session token persists across page refresh
□ Logout clears session
□ Token refresh works (if implemented)
□ Admin gate (OwnerPanel) requires presidential auth
□ Payment endpoints require authenticated session
□ Payout endpoints require creator verification
```

---

## PART 4: ECOSYSTEM USE GUIDE

### For Darrel (Owner & CEO)

**Daily Operations:**
1. Check ecosystem health: `https://rtv-edge-gateway.rotationtvaicom.workers.dev/health`
2. View command center: Open OwnerPanel page
3. Monitor payments: Check RotationPayTransaction entity
4. Review audit log: Check OmegaAuditLog entity
5. Check bot status: Message @base44_229784_bot on Telegram

**Weekly Operations:**
1. Review creator payouts (rtvPayoutEngine)
2. Check blockchain balances (BalanceCheck entity)
3. Review marketing campaign performance
4. Audit security logs
5. Review and approve new merchants

**Monthly Operations:**
1. Review revenue split performance
2. Check NFT marketplace activity
3. Review token circulation
4. Plan ecosystem expansion
5. Update marketing strategy

### For Nick (Lead AI Technician)

**Build Tasks:**
1. Deploy frontend to Cloudflare Pages
2. Add JWT gates to Base44 functions
3. Wire custom domain routes
4. Debug worker errors
5. Update entity schemas as needed

**Execution Flow:**
```
Darrel gives directive → Nick opens chat with agent
→ Agent validates request → Agent builds/deploys
→ Nick verifies → Reports back to Darrel
```

### For End Users (Telegram)

**Onboarding Flow:**
1. User finds bot link (marketing, referral, search)
2. User sends /start command
3. Bot creates RTVUser record (100 RTV welcome bonus)
4. User sees Mini App menu button
5. User opens Mini App → age gate (if Erotica) → main interface
6. User can: view balance, buy RTV, watch streams, tip creators, subscribe

**Payment Flow:**
1. User selects "Buy RTV"
2. Chooses payment rail (Stars / TON / CCBill)
3. Confirms payment
4. System processes payment
5. RTV balance updates
6. Transaction logged to RotationPayTransaction
7. Audit log mirrors to OmegaAuditLog

**Creator Flow:**
1. Creator signs up → gets verified
2. Starts live stream → viewers join
3. Viewers send gifts/tips → creator earns 80%
4. Combo multipliers activate (up to 500%)
5. Creator requests payout → receives RTV/TON
6. Milestones unlock → bonus RTV rewards

---

## PART 5: ARCHITECTURE DIAGRAM (Real)

```
┌──────────────────────────────────────────────────────────┐
│                    USER (Telegram)                        │
│                                                          │
│  @base44_229784_bot    @ROTATIONEROTICA_BOT              │
│  @RotationPayBot       @RTVSrotationBot                  │
│         │                      │                         │
│         ▼                      ▼                         │
│  ┌─────────────────────────────────────┐                │
│  │      TELEGRAM MINI APP (SPA)         │                │
│  │  React + Vite + Tailwind             │                │
│  │  → Cloudflare Pages (NOT DEPLOYED)   │                │
│  └──────────────┬──────────────────────┘                │
│                 │                                         │
│                 ▼                                         │
│  ┌─────────────────────────────────────┐                │
│  │   CLOUDFLARE WORKERS (4 LIVE)        │                │
│  │                                      │                │
│  │  rtv-edge-gateway                    │                │
│  │    → /api/pay/*                      │                │
│  │    → /api/ai/*                       │                │
│  │    → /api/voice/*                    │                │
│  │    → /api/auth/*                     │                │
│  │                                      │                │
│  │  rtv-payments                        │                │
│  │    → Stars (XTR)                     │                │
│  │    → TON Jetton                      │                │
│  │    → Internal RTV                    │                │
│  │    → Stripe → 410 GONE               │                │
│  │                                      │                │
│  │  rtv-blockchain                      │                │
│  │    → TON v3 (seqno 77028187)         │                │
│  │    → Solana (4 nodes, 403 issue)     │                │
│  │                                      │                │
│  │  rtv-stream                          │                │
│  │    → Stream create/play              │                │
│  │    → Tips + combos                   │                │
│  │    → Gifts (6 tiers)                 │                │
│  │    → Subscriptions (4 tiers)         │                │
│  │    → PK battles                      │                │
│  │    → CCBill + Tribute                │                │
│  └──────────────┬──────────────────────┘                │
│                 │                                         │
│         ┌───────┼───────┐                                │
│         ▼       ▼       ▼                                │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐                  │
│  │ Base44  │ │ Supabase│ │ Chainstack│                  │
│  │Entities │ │ Postgres│ │ Nodes     │                  │
│  │ (24)    │ │ (73 tbl)│ │ TON+SOL  │                  │
│  └─────────┘ └─────────┘ └──────────┘                  │
│                                                          │
│  AI PROVIDERS:                                           │
│  ✅ Claude │ ✅ Gemini │ ⚠️ Venice │ ❌ Kimi            │
│                                                          │
│  PAYMENT RAILS:                                          │
│  ✅ Stars │ ✅ TON │ ✅ RTV │ ✅ CCBill │ ✅ Tribute    │
│                                                          │
│  STORAGE:                                                │
│  R2 (1 bucket) │ KV (1 namespace) │ D1 (1 database)     │
│                                                          │
│  VOICE:                                                  │
│  Twilio +18446092087 (SMS+Voice+MMS)                    │
└──────────────────────────────────────────────────────────┘
```

---

## PART 6: LAUNCH SEQUENCE (Real, Step-by-Step)

### Week 1: Security + Credentials
```
Day 1: Darrel provides correct Supabase anon + service_role keys
Day 2: Darrel generates 4 new Telegram bot tokens via @BotFather
Day 3: Darrel adds $5 Venice AI credits, gets Kimi developer key
Day 4: Darrel sets BASE44_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET
Day 5: Nick adds JWT gates to Tier 1 financial functions
Day 6: Nick decommissions 3 legacy webhook functions
Day 7: Security gate review — go/no-go decision
```

### Week 2: Frontend + Bots
```
Day 8:  Nick deploys frontend to Cloudflare Pages
Day 9:  Nick wires 4 Telegram bot webhooks
Day 10: Nick runs frontend verification checklist (above)
Day 11: Nick tests payment flow end-to-end (Stars → RTV)
Day 12: Darrel creates Cloudflare token with zone-route permission
Day 13: Nick wires custom domains (rotationpay.net, etc.)
Day 14: Infrastructure gate review — go/no-go decision
```

### Week 3: Content + Marketing
```
Day 15: Launch 30-day marketing campaign
Day 16: Post all 9 HeyGen videos across platforms
Day 17: Launch Discord server with 5 channels
Day 18: Start daily content cadence (TikTok, X, LinkedIn)
Day 19: List $RTV on CoinGecko + CoinMarketCap
Day 20: Email capture goes live at rotationtvai.com
Day 21: First "Rotation Report" newsletter sent
```

### Week 4: Scale + Launch
```
Day 22: First paid ad campaigns (Meta + TikTok)
Day 23: 5 KOL partnerships signed
Day 24: $RTV listed on Jupiter DEX
Day 25: RTV AI University first cohort enrolled
Day 26: RotationCall beta users onboarded
Day 27: 1,000 Discord members milestone
Day 28: Launch readiness gate — go/no-go
Day 29: Public launch announcement
Day 30: Press release distributed
```

---

## PART 7: CREDENTIAL CHECKLIST (Darrel's Action Items)

### CRITICAL — Blocks everything:
```
□ 1. Supabase anon key (eyJ... format, ~200 chars) — from Supabase Dashboard → Settings → API
□ 2. Supabase service_role key (eyJ... format) — from same location
□ 3. BASE44_SERVICE_ROLE_KEY — from Base44 dashboard → Settings → API
□ 4. 4 new Telegram bot tokens — from @BotFather (/newbot × 4)
```

### HIGH — Blocks AI + notifications:
```
□ 5. Venice AI credits ($5+) — at venice.ai/settings/api
□ 6. Kimi developer API key — at platform.kimi.ai
□ 7. ElevenLabs API key — at elevenlabs.io
□ 8. DISCORD_WEBHOOK_URL — from Discord channel settings
□ 9. SLACK_WEBHOOK_URL — from Slack app config
```

### MEDIUM — Blocks payments + domains:
```
□ 10. STRIPE_WEBHOOK_SECRET — from Stripe dashboard → Developers → Webhooks
□ 11. RTV_TOKEN_MINT — from Solana explorer (token mint address)
□ 12. CF token with "Zone Workers Routes" permission — from Cloudflare dashboard
□ 13. 0.1 SOL sent to treasury (for gas) — to 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv
□ 14. Chainstack Solana IP whitelist (Cloudflare ranges)
```

### LOW — Nice to have:
```
□ 15. Perplexity API keys (regenerate at perplexity.ai)
□ 16. Manus API key (from open.manus.ai)
□ 17. SendGrid API key (regenerate at sendgrid.com)
□ 18. CCBill merchant account (for Erotica payments)
```

---

*RTV Deep Research Knowledge Logic Playbook v1.0*
*Built by Base44 AI Command Center | July 2, 2026*
*Presidential Authority: Darrel — Owner & CEO*
*"Learn it. Live it. Love it."*
