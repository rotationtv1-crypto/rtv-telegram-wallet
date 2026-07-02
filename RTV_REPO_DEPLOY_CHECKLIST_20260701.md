# RTV REPO DEPLOYMENT CHECKLIST
## Front-End + Back-End — Complete Pre-Flight
### July 1, 2026

---

## PRE-FLIGHT: ENVIRONMENT & SECRETS

### Cloudflare
- [ ] CLOUDFLARE_API_TOKEN set (cfat_iEDzh... — VERIFIED ✅)
- [ ] CLOUDFLARE_ACCOUNT_ID set (7e431c541ea0f39d7f7fe5fd9f06eada)
- [ ] Zone-route permission token created (for custom domains)
- [ ] workers.dev subdomain active (rotationtvaicom ✅)

### Telegram
- [ ] @ROTATIONEROTICA_BOT token — EXPIRED, need new from @BotFather
- [ ] @RotationPayBot token — EXPIRED, need new from @BotFather
- [ ] @RTVSrotationBot token — EXPIRED, need new from @BotFather
- [ ] @base44_229784_bot token — LIVE ✅

### Database
- [ ] SUPABASE_URL set (https://xynkgaxfwvpcixissxdz.supabase.co)
- [ ] BASE44_SERVICE_ROLE_KEY — NOT SET (critical blocker)
- [ ] SUPABASE_DB_URL — for Drizzle ORM connections
- [ ] D1 database active (rotation-erotica-db ✅)

### AI Providers
- [ ] ANTHROPIC_API_KEY — set ✅
- [ ] GEMINI_API_KEY — set ✅
- [ ] VENICE_API_KEY — set but $0 credits
- [ ] KIMI_API_KEY — wrong platform key, need developer key

### Blockchain
- [ ] TON_RPC_ENDPOINT — Chainstack v3 (verified live)
- [ ] SOLANA_RPC_ENDPOINT — Chainstack primary node
- [ ] RTV_TOKEN_MINT — NOT SET
- [ ] Treasury wallet funded with SOL for gas (~0.1 SOL needed)

### Integrations
- [ ] DISCORD_WEBHOOK_URL — NOT SET
- [ ] STRIPE_WEBHOOK_SECRET — NOT SET
- [ ] Twilio — active ✅ (+18446092087)

---

## FRONT-END CHECKLIST

### Build
- [ ] Node.js 22+ installed
- [ ] npm install completed
- [ ] TypeScript compilation passes (tsc --noEmit)
- [ ] Vite build succeeds (npm run build → dist/)
- [ ] No console errors in production build

### Pages (19 total)
- [ ] OwnerPanel.jsx — Presidential dashboard renders
- [ ] OwnerGate.jsx — Auth gate functional
- [ ] CommandCenter.jsx — System overview loads
- [ ] EcosystemHub.jsx — 9 companies display
- [ ] RTVWallet.jsx — Token wallet connects to API
- [ ] RotationPayDashboard.jsx — Payment management loads
- [ ] RotationPayCheckout.jsx — Checkout flow completes
- [ ] Web3Command.jsx — Blockchain operations panel
- [ ] RTVTrading.jsx — Trading UI functional
- [ ] StreamPlayer.jsx — Stream player initializes
- [ ] TelegramMiniApp.tsx — Mini App loads in Telegram
- [ ] TelegramMiniApp.jsx — Alt Mini App version
- [ ] MarketingCommandCenter.jsx — Campaign manager loads
- [ ] MentorCouncil.jsx — Mentor dashboard renders
- [ ] CustomerMentor.jsx — Customer mentor UI
- [ ] PricingCommand.jsx — Pricing management
- [ ] CreditsDashboard.jsx — Credit balance display
- [ ] VoIPManager.jsx — Call management UI
- [ ] DiscoverScreen.tsx — Discovery feed loads

### Brand Compliance
- [ ] Neon-lime #CCFF00 applied to all primary UI
- [ ] Obsidian #0A0A0A background everywhere
- [ ] RTV "R" logo with rotation arrows present
- [ ] "RotationTV NETWORK" + "2036" in footer/header
- [ ] Erotica pages use rose-gold on #0F0A0D
- [ ] Inter font for headlines, JetBrains Mono for data
- [ ] Mobile-responsive on all pages
- [ ] Telegram Mini App viewport configured

### Deploy
- [ ] Cloudflare Pages project created
- [ ] dist/ folder deployed to Pages
- [ ] Custom domain mapped (rotationtvai.com → pages.dev)
- [ ] Environment variables set in Pages dashboard:
  - [ ] VITE_API_URL = https://rtv-edge-gateway.rotationtvaicom.workers.dev
  - [ ] VITE_TELEGRAM_BOT = @ROTATIONEROTICA_BOT
  - [ ] VITE_SUPABASE_URL = https://xynkgaxfwvpcixissxdz.supabase.co
  - [ ] VITE_RTV_PARITY = 0.01
- [ ] HTTPS enforced
- [ ] SPA redirect rule (/* → /index.html)

---

## BACK-END CHECKLIST

### Cloudflare Workers (3)
- [ ] rtv-edge-gateway deployed ✅
  - [ ] /health returns 200
  - [ ] /api/pay/rails returns sovereign rails
  - [ ] /api/ai/providers returns 4 providers
  - [ ] /api/auth/verify processes HMAC-SHA256
  - [ ] Secrets injected (5) ✅
- [ ] rtv-payments deployed ✅
  - [ ] /health returns 200
  - [ ] /api/buy/stars creates Telegram invoice
  - [ ] /api/buy/ton returns TON payment info
  - [ ] /stripe returns 410 GONE
  - [ ] Secrets injected (5) ✅
- [ ] rtv-blockchain deployed ✅
  - [ ] /health returns 200
  - [ ] /api/ton/info returns TON mainchain data
  - [ ] /api/solana/info returns Solana health
  - [ ] /api/nft/list returns 27 assets
  - [ ] Secrets injected (5) ✅

### Base44 Backend Functions (35)
- [ ] All 35 functions deployed (HTTP 403 = exists) ✅
- [ ] JWT gates applied to TIER 1 (financial) — PENDING
- [ ] JWT gates applied to TIER 2 (AI) — PENDING
- [ ] JWT gates applied to TIER 3 (monitoring) — PENDING
- [ ] TIER 4 (public) verified with own auth layer — PENDING

### Payment Functions
- [ ] rtvPaymentHub — Telegram bot commands working
- [ ] rtvPayoutEngine — Creator payouts with 80/15/5 split
- [ ] stripe-webhook — HMAC verification working
- [ ] rotationPayGateway — 10-rail router (3 active sovereign)
- [ ] rotationPayConnect — 4 merchant plans returning correct pricing
- [ ] telegramWalletBridge — Telegram @wallet deep links
- [ ] create-payment customer-caching bug FIXED and deployed — PENDING

### AI Functions
- [ ] openClawOrchestrator — 9 AXIS agents responding
- [ ] veniceGateway — deployed (blocked by $0 credits)
- [ ] deepThinkerMasterEngine — analysis engine running
- [ ] All Claude/Gemini calls returning 200

### Blockchain Functions
- [ ] sovereignVaultBridge — vault operations
- [ ] vaultInitVerify — mint verification
- [ ] 4 Chainstack Solana nodes responding
- [ ] TON v3 REST endpoint live

### Webhook Consolidation
- [ ] telegram-webhook-unified (v7) — ACTIVE, keeping
- [ ] telegram-webhook (legacy) — DECOMMISSION
- [ ] rotationtv-telegram-webhook — DECOMMISSION
- [ ] rotationpaybot-webhook — DECOMMISSION
- [ ] Canonical webhook URLs documented

---

## ENTITY SCHEMA CHECKLIST (24 schemas)

### User & Auth
- [ ] RTVUser — creates on /start command
- [ ] Web3Wallet — connects via wallet adapter
- [ ] WalletIntegration — auto-sync enabled

### Payments
- [ ] RotationPayTransaction — logs all transactions (BLOCKED: needs SERVICE_ROLE_KEY)
- [ ] PaymentRoute — 3 sovereign active, 7 disabled
- [ ] RotationPayMerchant — 4 plans configured
- [ ] RTVAPIKey — API key generation working

### Blockchain
- [ ] RTVToken — balance tracking
- [ ] NFTAsset — 27 assets seeded
- [ ] RTVMintOperation — mint logging
- [ ] BalanceCheck — balance history
- [ ] ChainstackNode — 4 nodes seeded
- [ ] Web3Session — session management

### Creator Economy
- [ ] LiveStream — stream sessions
- [ ] StreamTip — tip records with combos
- [ ] GiftItem — virtual gifts configured
- [ ] PKBattle — battle system
- [ ] CreatorSubscription — subscription tiers
- [ ] CreatorPayout — payout records
- [ ] CreatorEarning — earning summaries
- [ ] CreatorWithdrawal — withdrawal requests
- [ ] CreatorMilestone — 4 milestone types
- [ ] ComboMultiplier — 6 combo tiers seeded
- [ ] RevenueSplit — 3 presets seeded (Standard/VIP/Agency)
- [ ] SubscriptionTier — tier definitions

### Infrastructure
- [ ] RTVCompany — 9 companies seeded
- [ ] OmegaAuditLog — audit trail (BLOCKED: needs SERVICE_ROLE_KEY)

---

## REPO SPLIT CHECKLIST

### RotationPay-Core (NEW REPO)
- [ ] Repo created on GitHub
- [ ] 9 payment functions extracted
- [ ] Payment entity schemas included
- [ ] Stripe integration (approved for non-adult)
- [ ] Bot webhook wired to @RotationPayBot
- [ ] wrangler.jsonc with routes
- [ ] README with API documentation

### RTV-Token-Services (NEW REPO)
- [ ] Repo created on GitHub
- [ ] 6 blockchain functions extracted
- [ ] Blockchain entity schemas included
- [ ] 4 Chainstack node configs
- [ ] Bot webhook wired to @RTVSrotationBot
- [ ] Solana/TON integration code
- [ ] NFT metadata files

### Rotation-Erotica (NEW REPO — ISOLATED)
- [ ] Repo created on GitHub
- [ ] 5 content functions extracted
- [ ] Creator economy entity schemas included
- [ ] NO STRIPE CODE PRESENT (verified)
- [ ] Bot webhook wired to @ROTATIONEROTICA_BOT
- [ ] Telegram Stars + TON + RTV rails only
- [ ] Age gate (18+) implemented
- [ ] CCBill: approved or stripped (DARREL DECISION)

### Shared Monorepo (rtv-telegram-wallet — STAYS)
- [ ] Cloudflare Worker source code
- [ ] Shared libraries (env.ts, supabase.js, ai-gateway.ts)
- [ ] All 6 playbooks
- [ ] Brand rules and assets
- [ ] Deployment scripts
- [ ] This checklist document

---

## GO / NO-GO DECISION GATES

### GATE 1: Security (must pass before any deploy)
- [ ] All financial functions have JWT gates
- [ ] Legacy webhooks decommissioned
- [ ] No Stripe code in Erotica repo
- [ ] HMAC-SHA256 auth verified

### GATE 2: Infrastructure (must pass before launch)
- [ ] BASE44_SERVICE_ROLE_KEY set
- [ ] All 3 Cloudflare Workers responding
- [ ] Frontend deployed to Cloudflare Pages
- [ ] Custom domains wired (or workers.dev fallback)

### GATE 3: Launch Readiness (must pass before public announcement)
- [ ] Telegram bots responding to /start
- [ ] Payment flow tested end-to-end (Stars → RTV credit)
- [ ] $1 Stripe test cycle passed (non-Erotica)
- [ ] Discord server live with 5 channels
- [ ] First marketing campaign scheduled
- [ ] Venice AI credits added (or launch without)

---

## FINAL SIGN-OFF

```
□ Security Gate: PASS / FAIL
□ Infrastructure Gate: PASS / FAIL
□ Launch Readiness Gate: PASS / FAIL

Darrel (Owner & CEO): _________________  Date: _________
Nick Smiley (Lead AI Tech): _________________  Date: _________
```

---
*RTV Repo Deployment Checklist v1.0 | July 1, 2026*
*Use this checklist for every deployment cycle*
