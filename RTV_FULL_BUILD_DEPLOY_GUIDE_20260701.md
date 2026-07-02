# RTV FULL ECOSYSTEM BUILD & DEPLOY GUIDE
## Complete Execution Package — Deep Research Knowledge Logic
### July 1, 2026 | Presidential Authority: Darrel

> "Learn it. Live it. Love it. — We keep business rotating globally."

---

## TABLE OF CONTENTS
1. Ecosystem Architecture Overview
2. The 9 Companies — Build Status & Integration Map
3. Front-End Deployment Guide (Cloudflare Pages)
4. Back-End Deployment Guide (Cloudflare Workers + Base44)
5. Entity Schema & Database Guide
6. Blockchain & Tokenomics Guide
7. Payment System Guide (Sovereign Rails)
8. AI Provider Integration Guide
9. Telegram Bot & Mini App Guide
10. Marketing & Growth Guide
11. Security & Compliance Guide
12. Launch Sequence (Step-by-Step)

---

## 1. ECOSYSTEM ARCHITECTURE OVERVIEW

### Core Stack
```
┌─────────────────────────────────────────────┐
│           ROTATIONTV NETWORK                 │
│         rotationtvai.com (primary)           │
├─────────────────────────────────────────────┤
│  FRONTEND: React + Vite + Tailwind          │
│  → Cloudflare Pages (SPA hosting)           │
├─────────────────────────────────────────────┤
│  BACKEND: Cloudflare Workers (edge compute) │
│  + Base44 Backend Functions (entity CRUD)   │
├─────────────────────────────────────────────┤
│  DATABASE: Supabase PostgreSQL              │
│  + Base44 Entity Schemas (24 tables)        │
│  + Cloudflare D1 (edge storage)             │
├─────────────────────────────────────────────┤
│  STORAGE: Cloudflare R2 (media/assets)      │
│  + KV (key-value cache)                     │
├─────────────────────────────────────────────┤
│  BLOCKCHAIN: Solana (4 Chainstack nodes)    │
│  + TON (v3 REST, Chainstack)                │
├─────────────────────────────────────────────┤
│  AI: Anthropic Claude | Google Gemini |     │
│      Venice AI | Kimi/Moonshot              │
├─────────────────────────────────────────────┤
│  MESSAGING: Telegram (bots + Mini App)      │
│  + WhatsApp + Discord + Slack               │
├─────────────────────────────────────────────┤
│  VOICE: Twilio (+18446092087)               │
│  → RotationCall AI voice platform           │
└─────────────────────────────────────────────┘
```

### Three-Tier Deployment Model
- **Tier 1: Cloudflare Workers** — Real-time edge compute (API routing, payments, blockchain)
- **Tier 2: Base44 Functions** — Entity CRUD, business logic, AI orchestration
- **Tier 3: Supabase** — Database, auth, real-time subscriptions, edge functions

### Workers.dev URLs (LIVE)
- Edge Gateway: `https://rtv-edge-gateway.rotationtvaicom.workers.dev`
- Payments: `https://rtv-payments.rotationtvaicom.workers.dev`
- Blockchain: `https://rtv-blockchain.rotationtvaicom.workers.dev`

### Custom Domains (PENDING — need zone-route permission)
- `rotationpay.net` → rtv-payments worker
- `rotationcall.net` → rtv-edge-gateway worker
- `rotationomega.org` → rtv-edge-gateway + rtv-blockchain

---

## 2. THE 9 COMPANIES — BUILD STATUS & INTEGRATION MAP

### Company Roster
| # | Company | Domain | Category | Status | Bot | Repo Target |
|---|---------|--------|----------|--------|-----|-------------|
| 1 | RotationTV Network | rotationtvai.com | Media | ACTIVE | — | Shared monorepo |
| 2 | RotationPay | rotationpay.com | Payments | ACTIVE | @RotationPayBot | RotationPay-Core |
| 3 | RotationCall | rotationcall.net | VoIP AI | ACTIVE | — | RTV-Token-Services |
| 4 | Rotation University | rotationtvai.com | Education | ACTIVE | — | Shared monorepo |
| 5 | Bigo Agency | bigo.agency | Creative | ACTIVE | — | Shared monorepo |
| 6 | White Logistics | whitelogistics.solutions | Logistics | ACTIVE | — | Shared monorepo |
| 7 | EmergentLabs | emergent.sh | AI Platform | ACTIVE | — | Shared monorepo |
| 8 | OpenClaw | openclaw.dev | Infrastructure | ACTIVE | — | Shared monorepo |
| 9 | Pretrial Services | pretrialservicesamerica.com | Legal | ACTIVE | — | Shared monorepo |

### Bot-Repo Split (3 standalone repos)
| Repo | Bot | Functions | Payment Rails | Compliance |
|------|-----|-----------|---------------|------------|
| RotationPay-Core | @RotationPayBot | 9 payment functions | Stripe + Stars + TON + RTV | Standard KYC |
| RTV-Token-Services | @RTVSrotationBot | 6 blockchain functions | Stars + TON + RTV | Crypto-native |
| Rotation-Erotica | @ROTATIONEROTICA_BOT | 5 content functions | Stars + TON + RTV ONLY | NO STRIPE (adult content) |

---

## 3. FRONT-END DEPLOYMENT GUIDE

### Tech Stack
- React 18 + Vite 5 + TypeScript
- Tailwind CSS (neon-lime #CCFF00 on obsidian #0A0A0A)
- Telegram Mini App SDK integration
- Cloudflare Pages (SPA hosting)

### Pages Inventory (19 pages)
| Page | File | Purpose | Status |
|------|------|---------|--------|
| Owner Panel | OwnerPanel.jsx | Presidential dashboard | DEPLOYED |
| Owner Gate | OwnerGate.jsx | Auth gate for admin | DEPLOYED |
| Command Center | CommandCenter.jsx | System overview | DEPLOYED |
| Ecosystem Hub | EcosystemHub.jsx | 9-company overview | DEPLOYED |
| RTV Wallet | RTVWallet.jsx | Token wallet UI | DEPLOYED |
| RotationPay Dashboard | RotationPayDashboard.jsx | Payment management | DEPLOYED |
| RotationPay Checkout | RotationPayCheckout.jsx | Checkout flow | DEPLOYED |
| Web3 Command | Web3Command.jsx | Blockchain operations | DEPLOYED |
| RTV Trading | RTVTrading.jsx | Token trading UI | DEPLOYED |
| Stream Player | StreamPlayer.jsx | Live streaming viewer | DEPLOYED |
| Telegram Mini App | TelegramMiniApp.tsx | Mini App (rose-gold) | DEPLOYED |
| Telegram Mini App v2 | TelegramMiniApp.jsx | Mini App (alt version) | DEPLOYED |
| Marketing Command | MarketingCommandCenter.jsx | Campaign management | DEPLOYED |
| Mentor Council | MentorCouncil.jsx | AI mentor dashboard | DEPLOYED |
| Customer Mentor | CustomerMentor.jsx | Customer-facing mentor | DEPLOYED |
| Pricing Command | PricingCommand.jsx | Pricing management | DEPLOYED |
| Credits Dashboard | CreditsDashboard.jsx | Credit balance view | DEPLOYED |
| VoIP Manager | VoIPManager.jsx | Call management | DEPLOYED |
| Discover Screen | DiscoverScreen.tsx | Content discovery | DEPLOYED |

### Front-End Deployment Steps

#### Step 1: Build the SPA
```bash
npm install
npm run build  # Output: dist/
```

#### Step 2: Deploy to Cloudflare Pages
```bash
# Create Pages project
npx wrangler pages create rtv-frontend

# Deploy
npx wrangler pages deploy dist --project-name=rtv-frontend
```

#### Step 3: Configure Custom Domain
- Add custom domain in Cloudflare Pages dashboard
- Map: rotationtvai.com → rtv-frontend.pages.dev
- DNS automatically configured via Cloudflare

#### Step 4: Environment Variables (Pages)
Set in Cloudflare Pages → Settings → Environment Variables:
- `VITE_API_URL` = `https://rtv-edge-gateway.rotationtvaicom.workers.dev`
- `VITE_TELEGRAM_BOT` = `@ROTATIONEROTICA_BOT`
- `VITE_SUPABASE_URL` = `https://xynkgaxfwvpcixissxdz.supabase.co`
- `VITE_RTV_PARITY` = `0.01`

### Brand Guidelines
- Primary: Neon-lime #CCFF00
- Background: Obsidian #0A0A0A
- Accent: Electric blue #00BFFF
- Text: Holographic white
- Erotica variant: Rose-gold on #0F0A0D charcoal
- Font: Inter (headlines) + JetBrains Mono (code/data)
- Logo: "R" with rotation arrows + "RotationTV NETWORK" + "2036"

---

## 4. BACK-END DEPLOYMENT GUIDE

### Cloudflare Workers (3 workers)

#### Worker 1: rtv-edge-gateway
**Purpose:** Unified API router for all 9 companies
**Routes:**
- `GET /health` — System health
- `POST /api/pay/*` — Sovereign payments
- `POST /api/ai/chat` — AI provider routing
- `GET /api/voice/*` — Twilio voice/sms webhooks
- `GET /api/blockchain/*` — TON + Solana info
- `POST /api/auth/verify` — HMAC-SHA256 Telegram auth
- `GET /api/users/*` — User management

**Deploy:**
```bash
cd workers/rtv-edge-gateway
npx wrangler deploy
```

**Secrets:**
- ANTHROPIC_API_KEY ✅
- GEMINI_API_KEY ✅
- VENICE_API_KEY ✅
- KIMI_API_KEY ✅
- TELEGRAM_BOT_TOKEN ✅

#### Worker 2: rtv-payments
**Purpose:** Sovereign payment gateway
**Rails:** Telegram Stars (XTR) + TON Jetton + Internal RTV
**Stripe:** PURGED (returns HTTP 410)

**Deploy:**
```bash
cd workers/rtv-payments
npx wrangler deploy
```

#### Worker 3: rtv-blockchain
**Purpose:** TON + Solana blockchain gateway
**Treasury:** 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv

**Deploy:**
```bash
cd workers/rtv-blockchain
npx wrangler deploy
```

### Base44 Backend Functions (35 functions)

#### Payment Functions (9)
| Function | Purpose | Deploy Status |
|----------|---------|---------------|
| rtvPaymentHub | Telegram bot + payment processing | LIVE (403) |
| rtvPayoutEngine | Creator payouts (80/15/5 split) | LIVE (403) |
| stripe-webhook | Stripe webhook handler | LIVE (403) |
| rotationPayGateway | 10-rail payment router | LIVE (403) |
| rotationPayConnect | Merchant onboarding (Stripe Connect) | LIVE (403) |
| rotationPayBot | @RotationPayBot handler | LIVE (403) |
| rotationPayWebhook | Payment webhook receiver | LIVE (403) |
| telegramWalletBridge | Telegram @wallet deep links | LIVE (403) |
| rtvWalletDashboard | Wallet dashboard API | LIVE (403) |

#### AI Functions (8)
| Function | Purpose | Deploy Status |
|----------|---------|---------------|
| openClawOrchestrator | 9 AXIS AI agents (Claude Sonnet 4) | LIVE (403) |
| veniceGateway | Venice AI integration | LIVE (403) |
| deepThinkerMasterEngine | AI deep analysis engine | LIVE (403) |
| rtvDeepThinkEngine | Deep thinking processor | LIVE (403) |
| emergentClaudeUnified | Claude unified interface | LIVE (403) |
| openClawEmergentBridge | OpenClaw ↔ Emergent bridge | LIVE (403) |
| rtvMasterEnhancement | System enhancement engine | LIVE (403) |
| dailyEcosystemEnhancement | Daily auto-improvement | LIVE (403) |

#### Blockchain Functions (6)
| Function | Purpose | Deploy Status |
|----------|---------|---------------|
| sovereignVaultBridge | Vault operations | LIVE (403) |
| vaultInitVerify | Mint verification | LIVE (403) |
| rtvsSovereignBot | @RTVSrotationBot handler | LIVE (403) |
| rtvAuthGateway | HMAC-SHA256 auth gateway | LIVE (403) |
| rtvEdgeGateway | Edge gateway API | LIVE (403) |
| rtvMiniApp | Mini App backend | LIVE (403) |

#### Content & Community Functions (5)
| Function | Purpose | Deploy Status |
|----------|---------|---------------|
| telegramBotHandler | @ROTATIONEROTICA_BOT handler | LIVE (403) |
| bigoModeratorBot | Content moderation bot | LIVE (403) |
| rtvMentorEngine | AI mentor system | LIVE (403) |
| customerMentorBot | Customer-facing mentor | LIVE (403) |
| rtvPromoBroadcast | Marketing broadcaster | LIVE (403) |

#### Infrastructure Functions (7)
| Function | Purpose | Deploy Status |
|----------|---------|---------------|
| ecosystemHealthCheck | System health monitor | LIVE (403) |
| githubDigestPoster | GitHub activity digest | LIVE (403) |
| gmailEcosystemMonitor | Gmail monitoring | LIVE (403) |
| rotationCallDebugger | Call debugging | LIVE (403) |
| rotationCallEmergentSync | Call sync | LIVE (403) |
| rotationCallWeb3Bridge | Web3 call bridge | LIVE (403) |
| rtvVoiceEngine | Voice synthesis | LIVE (403) |

---

## 5. ENTITY SCHEMA & DATABASE GUIDE

### 24 Active Entity Schemas

#### User & Auth (3)
- **RTVUser** — Telegram users, creators, KYC, balances, reputation
- **Web3Wallet** — Connected wallets (Solana/TON)
- **WalletIntegration** — Wallet verification + auto-sync

#### Payments (4)
- **RotationPayTransaction** — All payment transactions (sovereign + Stripe)
- **PaymentRoute** — 10 payment rails (3 sovereign active, 7 disabled)
- **RotationPayMerchant** — Merchant accounts (4 plans)
- **RTVAPIKey** — API keys for merchant integrations

#### Blockchain (6)
- **RTVToken** — Token balances + staking rewards
- **NFTAsset** — 27 NFT assets (TON + Solana mirrored)
- **RTVMintOperation** — Mint operations log
- **BalanceCheck** — Balance check history
- **ChainstackNode** — 4 Solana nodes (Primary, US-West, EU, Devnet)
- **Web3Session** — Auth sessions

#### Creator Economy (12)
- **LiveStream** — Stream sessions with viewer counts + tips
- **StreamTip** — Individual tip records with combo multipliers
- **GiftItem** — Virtual gifts with prices + animations
- **PKBattle** — Creator battles with staking
- **CreatorSubscription** — Subscription tiers + billing
- **CreatorPayout** — Payout records with 80/15/5 split
- **CreatorEarning** — Period earnings summaries
- **CreatorWithdrawal** — Withdrawal requests
- **CreatorMilestone** — Achievement rewards
- **ComboMultiplier** — 6 combo tiers (Normal → Universe Breaker)
- **RevenueSplit** — 3 presets (Standard, VIP, Agency)
- **SubscriptionTier** — Subscription tier definitions

#### Infrastructure (3)
- **RTVCompany** — 9 company registry
- **DNSRecord** — DNS management
- **OmegaAuditLog** — Security audit trail

#### Content & Education (2)
- **HeyGenVideo** — Video rendering pipeline
- **CloudflareAsset** — Cloudflare-hosted media

#### Voice (2)
- **VoIPNumber** — Twilio phone numbers
- **CallForwarding** — Call routing rules

#### Community (2)
- **MentorSession** — AI mentor sessions
- **Leaderboard** — Creator rankings

#### External Integrations (5)
- **EmergentIntegration** — Emergent.sh projects
- **EmergentBuild** — Build records
- **ManusAITask** — Manus AI tasks
- **ManusWebhook** — Manus webhooks
- **OpenClawAgent** — AI agent configs
- **OpenClawConfig** — OpenClaw configurations
- **ReplitAgent** — Replit agent configs

### Database Architecture
```
Base44 Entity SDK (primary CRUD)
    ↕
Supabase PostgreSQL (source of truth)
    ↕
Cloudflare D1 (edge cache, rotation-erotica-db)
```

### Key Economic Constants
- 1 RTV = $0.01 USD (fixed parity)
- 1 Telegram Star = $0.013 USD → 1.3 RTV
- 1 TON ≈ $1.50 USD → 150 RTV
- Revenue split: 80% creator / 15% platform / 5% agency
- Welcome bonus: 100 RTV (new users)

---

## 6. BLOCKCHAIN & TOKENOMICS GUIDE

### Solana Infrastructure (4 Chainstack Nodes)
| Node | Region | Purpose | Status |
|------|--------|---------|--------|
| Primary | US-East | Mainnet RPC + WSS | ACTIVE |
| Failover 1 | US-West | Mainnet RPC backup | ACTIVE |
| Failover 2 | EU | Mainnet RPC backup | ACTIVE |
| Devnet | — | Testing | ACTIVE |

### TON Infrastructure
- Chainstack v3 REST endpoint: LIVE (seqno verified)
- Chainstack v2 endpoint: 405 (use v3 only)
- Primary wallet: TON-native (holds $RTVS)

### Treasury Wallets
- Solana: `7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv`
- BTC: `bc1q7sl2yt2vaz2krlx5jmsxw3aprl7cm979fkwale`
- Ethereum: `0x7EbdBD2ED34D05655877a8B9A18955731Bf95133`

### NFT Marketplace
- 27 active assets
- Mirrored across TON and Solana mainnets
- NFT diplomas for RTV University graduates
- Metadata stored in docs/nft-metadata/

### Token Operations
- Mint: via RTVMintOperation entity + rtv-blockchain worker
- Transfer: via sovereign payment rails
- Stake: via vault-auto-stake function
- Balance check: via BalanceCheck entity + 4-node failover

---

## 7. PAYMENT SYSTEM GUIDE (Sovereign Rails)

### Active Rails
| Rail | Currency | Fee | Settlement | Use Case |
|------|----------|-----|------------|----------|
| Telegram Stars | XTR | 0% | Instant | Consumer purchases |
| TON Jetton | TON | 0.5% | ~5 seconds | Crypto-native users |
| Internal RTV | RTV | 0% | Instant | Rewards, airdrops, referrals |

### Purged Rails (HTTP 410)
Stripe, PayPal, Venmo, Zelle, Coinbase, NMI, Solana (in Erotica context)

### Payment Flow
```
User sends /buy or /stars command
    ↓
rtvPaymentHub creates Telegram Stars invoice
    ↓
User pays with Stars (XTR)
    ↓
Telegram sends successful_payment update
    ↓
rtvPaymentHub logs to RotationPayTransaction
    ↓
User RTV balance updated in RTVToken entity
    ↓
OmegaAuditLog mirrors transaction
```

### Merchant Onboarding (rotationPayConnect)
4 plans:
- Starter: $99/mo
- Growth: $299/mo
- Enterprise: $999/mo
- Reseller: $497/mo

### Creator Payout Engine (rtvPayoutEngine)
- Process tips with combo multipliers (6 tiers)
- Process PK battle winnings
- Check milestones (followers, hours, tips, PK wins)
- Request withdrawals (TON, Stars, Internal)
- Subscribe to creator tiers

### Compliance Matrix
- **RotationPay:** Stripe ✅ | Stars ✅ | TON ✅ | RTV ✅
- **Rotation Erotica:** Stripe ❌ | Stars ✅ | TON ✅ | RTV ✅ | CCBill ⚠️ (Darrel decision)
- **All others:** Stripe ✅ | Stars ✅ | TON ✅ | RTV ✅

---

## 8. AI PROVIDER INTEGRATION GUIDE

### Active Providers
| Provider | Model | Status | Use Case |
|----------|-------|--------|----------|
| Anthropic | claude-sonnet-4-6 | ✅ ACTIVE | Primary AI, OpenClaw orchestrator |
| Google | gemini-2.0-flash | ✅ ACTIVE | Fast inference, multimodal |
| Venice AI | venice-uncensored | ⚠️ $0 CREDITS | Moderation, uncensored tasks |
| Kimi/Moonshot | moonshot-v1 | ❌ KEY INVALID | Needs developer key |

### AI Provider Routing (rtv-edge-gateway /api/ai/chat)
```
POST /api/ai/chat
{
  "provider": "claude" | "gemini" | "venice" | "kimi",
  "model": "optional model override",
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 4096
}
```

### OpenClaw Orchestrator
- 9 specialized AXIS AI agents
- Powered by Anthropic Claude Sonnet 4
- Agents: Payment, Blockchain, Content, Marketing, Voice, Auth, Health, Mentor, Enhancement
- Deployed via openClawOrchestrator function

### Venice AI Activation
1. Darrel adds $5+ credits at venice.ai
2. Hourly monitor auto-detects HTTP 200
3. venice-ecosystem-sync fires (pushes 9,831-char context)
4. Models live: venice-uncensored, zai-org-glm-5-1, qwen3-vl-235b-a22b

### Kimi Key Fix
- Current key (sk-kimi-): Consumer chat app key — WRONG PLATFORM
- Need: Developer API key from platform.kimi.ai (pay-as-you-go)
- OR: Kimi Code membership at kimi.com/code (OAuth)
- Base URLs are NOT interchangeable: api.kimi.com ≠ api.moonshot.cn

---

## 9. TELEGRAM BOT & MINI APP GUIDE

### Active Bots
| Bot | Username | Purpose | Status |
|-----|----------|---------|--------|
| Base44 Agent | @base44_229784_bot | This AI agent | LIVE |
| Rotation Erotica | @ROTATIONEROTICA_BOT | Content platform | LIVE |
| RotationPay | @RotationPayBot | Payments | TOKEN EXPIRED |
| RTV Token | @RTVSrotationBot | Token services | TOKEN EXPIRED |

### Bot Commands (@ROTATIONEROTICA_BOT)
- `/start` — Onboard + 100 RTV welcome bonus
- `/help` — Show all commands
- `/price` — RTV token price (1 RTV = $0.01)
- `/buy [amount]` — Purchase RTV via Stars
- `/stars [amount]` — Buy RTV with Telegram Stars
- `/payout [amount]` — Request creator payout
- `/balance` — Check RTV balance
- `/transactions` — View transaction history

### Mini App
- URL: Base44 superagent chat URL
- Menu button: "Open RTV" (configured)
- Brand: Rose-gold on #0F0A0D charcoal (Erotica variant)
- Age gate: 18+ verification required
- Auth: HMAC-SHA256 initData verification

### Webhook Configuration
- Active webhook: → rtvPaymentHub function
- Allowed updates: message, pre_checkout_query, successful_payment
- Dead webhooks (3): Need decommissioning

### Telegram Payments 2.0
- Currency: XTR (Stars)
- provider_token: "" (empty string = Stars payment)
- Test card: 4242 4242 4242 4242
- Test store: t.me/TestStore
- @ShopBot for test products

---

## 10. MARKETING & GROWTH GUIDE

### Content Cadence (Daily)
- TikTok/Reels/Shorts: 3x/day (7am, 12pm, 7pm ET)
- X/Twitter: 5x/day (6am, 9am, 12pm, 3pm, 9pm ET)
- LinkedIn: 2x/day (8am, 5pm ET)
- YouTube Long: 2x/week

### 30-Day Campaign Phases
- Days 1-7: AWARENESS (post all 9 HeyGen videos, launch Discord)
- Days 8-14: ENGAGEMENT (KOL partnerships, community building)
- Days 15-30: CONVERSION (paid ads, exchange listings, merchant signup)

### $RTV Token Marketing
- Phase 1: List on CoinGecko + CoinMarketCap
- Phase 2: Launch RTV DAO, NFT diplomas, staking rewards
- Phase 3: DEX listings (Jupiter, Raydium) → CEX (MEXC, Gate.io)

### 9-Brand Promo System
- rtvPromoBroadcast function with 6 campaign templates
- Launch, Creator, Token, Web3, FOMO, Daily
- Telegram + Discord distribution channels

---

## 11. SECURITY & COMPLIANCE GUIDE

### Authentication
- HMAC-SHA256 Telegram initData (mandatory for all user onboarding)
- JWT gates needed on 35 Base44 functions (currently open)
- 4-tier JWT rollout plan (financial first, public last)

### Payment Compliance
- Stripe PROHIBITED for adult content (ToS violation → account freeze)
- Erotica platform: Telegram Stars + TON + RTV only
- CCBill: pending Darrel's presidential decision
- KYC via RTVUser entity (kyc_status field)

### Audit Trail
- OmegaAuditLog entity mirrors all transactions
- Risk scoring per transaction
- IP address + jurisdiction tracking
- Suspicious flag system

### Injection Attack Defense
- Active block list: rotationpay.io, Sovereign-Authority, Adobe Firefly Ghost-Trading
- Auto-reject messages with [1][2][3] citations without URLs
- Reject "Shall I..." consent-fishing patterns
- Darrel-only authority for major decisions

---

## 12. LAUNCH SEQUENCE (Step-by-Step)

### PHASE 1: SECURITY (Days 1-7)
1. Get new Telegram bot tokens from @BotFather (3 bots)
2. Decommission 3 legacy webhook functions
3. Add JWT gates to TIER 1 financial functions
4. Set BASE44_SERVICE_ROLE_KEY (Darrel provides)
5. Set STRIPE_WEBHOOK_SECRET (Darrel provides)
6. Set DISCORD_WEBHOOK_URL (Darrel provides)
7. Run $1 Stripe test cycle (after fix deploy)

### PHASE 2: REPO SPLIT (Days 8-14)
1. Create RotationPay-Core repo → extract 9 payment functions
2. Create RTV-Token-Services repo → extract 6 blockchain functions
3. Create Rotation-Erotica repo → extract 5 content functions
4. Verify Stripe completely absent from Erotica repo
5. Wire each repo to its respective bot webhook

### PHASE 3: INFRASTRUCTURE (Days 15-21)
1. Deploy Cloudflare Pages (frontend SPA)
2. Wire custom domain routes (need zone-route permission token)
3. Add Venice AI credits ($5+)
4. Fix Kimi API key (get from platform.kimi.ai)
5. Set remaining secrets (RTV_TOKEN_MINT, TON_RPC, SOLANA_RPC)

### PHASE 4: LAUNCH (Days 22-30)
1. Trigger Telegram bot /start commands
2. Launch 30-day marketing campaign
3. List $RTV on CoinGecko + CoinMarketCap
4. Open Discord server with 5 core channels
5. Start daily content cadence
6. First "Rotation Report" newsletter
7. Solana Foundation grant application

---

## CREDENTIAL STATUS SUMMARY

### ✅ WORKING
- Cloudflare API Token 5 (cfat_iEDzh...) — full Workers/Pages/R2/KV/D1 access
- Anthropic API Key 3 — Claude Sonnet 4 confirmed
- Gemini API Keys 3 & 4 — 50 models accessible
- Twilio — +18446092087 (SMS + Voice + MMS)
- Telegram @base44_229784_bot — this agent
- Supabase project — 73 tables, 16 RPC functions

### ❌ BROKEN / MISSING
- Telegram bot tokens (RotationPay, RTVSrotationBot) — expired
- BASE44_SERVICE_ROLE_KEY — not set
- STRIPE_WEBHOOK_SECRET — not set
- DISCORD_WEBHOOK_URL — not set
- RTV_TOKEN_MINT — not set
- Venice AI credits — $0 balance
- Kimi API key — wrong platform key
- ElevenLabs — invalid key
- Manus API — malformed token
- Perplexity — invalid keys
- SendGrid — access forbidden

### 🔄 NEEDS DARREL ACTION
- New Telegram bot tokens (via @BotFather)
- BASE44_SERVICE_ROLE_KEY (from Base44 dashboard)
- STRIPE_WEBHOOK_SECRET (from Stripe dashboard)
- DISCORD_WEBHOOK_URL (from Discord channel settings)
- Venice AI credits ($5+ at venice.ai)
- Kimi developer API key (from platform.kimi.ai)
- Cloudflare token with zone-route permission (for custom domains)
- CCBill decision (approve or strip from Erotica)

---
*RTV Full Ecosystem Build & Deploy Guide v1.0 | July 1, 2026*
*Built by Base44 AI Command Center*
*Presidential Authority: Darrel — Owner & CEO*
