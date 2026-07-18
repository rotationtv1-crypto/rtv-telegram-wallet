# 🎬 ROTATIONTVNETWORK LLC — MASTER LAUNCH PLAYBOOK
### Deep Research Edition — v7.0.0
> Presidential Authority: Darrel | June 26, 2026
> Complete system guide: architecture, secrets, deployment, operations, monetization

---

## TABLE OF CONTENTS

1. [Live System Status](#1-live-system-status)
2. [Full Architecture Map](#2-full-architecture-map)
3. [RotationTV Live — Main Platform](#3-rotationtv-live--main-platform)
4. [RotationErotica — Adult Platform](#4-rotationerotica--adult-platform)
5. [AI Layer — Venice + Kimi + HeyGen + OpenAI](#5-ai-layer--venice--kimi--heygen--openai)
6. [Blockchain Layer — TON + Solana + Bridge](#6-blockchain-layer--ton--solana--bridge)
7. [Payment Rails — 10 Methods](#7-payment-rails--10-methods)
8. [Telegram Bots](#8-telegram-bots)
9. [Database — Supabase](#9-database--supabase)
10. [Cloudflare Infrastructure](#10-cloudflare-infrastructure)
11. [GitHub + CI/CD](#11-github--cicd)
12. [Secrets Master Registry](#12-secrets-master-registry)
13. [Launch Sequence — Phase by Phase](#13-launch-sequence--phase-by-phase)
14. [Monetization Playbook](#14-monetization-playbook)
15. [Operations & Monitoring](#15-operations--monitoring)
16. [Deep Research: Venice AI](#16-deep-research-venice-ai)
17. [Deep Research: TON + Chainstack](#17-deep-research-ton--chainstack)
18. [Deep Research: HeyGen AI Video](#18-deep-research-heygen-ai-video)
19. [Deep Research: Railway Deployment](#19-deep-research-railway-deployment)
20. [9-Company Ecosystem](#20-9-company-ecosystem)
21. [Quick Reference Card](#21-quick-reference-card)

---

## 1. LIVE SYSTEM STATUS

> Last audited: June 26, 2026 — All data pulled live from APIs

### Workers (3 deployed — Cloudflare Account: Rotationtimmy)
| Worker | URL | Version | Secrets |
|--------|-----|---------|---------|
| `rotationtv-live-ai-clones` | https://rotationtv-live-ai-clones.rotationtimmy.workers.dev | v5.0.0 (v6.1.0 staged) | **9 secrets** |
| `rtv-token-manager` | https://rtv-token-manager.rotationtimmy.workers.dev | live | 4 secrets |
| `rotation-erotica-app` | https://rotation-erotica-app.rotationtimmy.workers.dev | stub | 1 secret |

### Confirmed Live Secrets — rotationtv-live-ai-clones
```
CHAINSTACK_TON_RPC_V2     ✅  TON v2 endpoint (Chainstack, live HTTP 200)
CHAINSTACK_TON_RPC_V3     ✅  TON v3 endpoint (Chainstack, live HTTP 200)
KIMI_API_KEY              ✅  Moonshot AI (needs real sk- key for full function)
MASTER_CF_TOKEN           ✅  Cloudflare full-account token
REQUEST_SIGNING_SECRET    ✅  HMAC-SHA256 admin auth
TELEGRAM_BOT_TOKEN_EROTICA ✅  @ROTATIONEROTICA_BOT token
VENICE_API_KEY            ✅  Primary (auth valid — 90 models — needs credits)
VENICE_API_KEY_2          ✅  Fallback 1
VENICE_API_KEY_3          ✅  Fallback 2
```

### Infrastructure
| Service | Status | Notes |
|---------|--------|-------|
| TON Chainstack v2 | ✅ LIVE | Seqno ~75,886,000 |
| TON Chainstack v3 | ✅ LIVE | Jetton transfers, 200 OK |
| Supabase | ✅ LIVE | xynkgaxfwvpcixissxdz — rotation-omega-notify deployed |
| Venice AI | ✅ AUTH VALID | 90 models — needs credits |
| tip-queue | ✅ Provisioned | 8fb801dd9f5e43218ed0d1edc3274d67 |
| tip-queue-dlq | ✅ Provisioned | 4177c698ae1e4107b73ad2eba99627f4 |
| KV_SPEND | ✅ Live | 3542f381a0d143318f9061d32661a509 |
| @ROTATIONEROTICA_BOT | ✅ Token set | Needs Railway/worker deployment |

---

## 2. FULL ARCHITECTURE MAP

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       ROTATIONTVNETWORK LLC v7.0                             │
│                    Presidential Authority: Darrel                             │
└─────────────────────┬────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────────┐
│  TELEGRAM    │ │ TELEGRAM     │ │   WEB FRONTEND    │
│  MINI APP    │ │ EROTICA BOT  │ │   (Base44/React)  │
│  @RTVLIVE    │ │ @EROTICA_BOT │ │   rotationtv.net  │
└──────┬───────┘ └──────┬───────┘ └─────────┬─────────┘
       │                │                   │
       └────────────────┼───────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │     CLOUDFLARE WORKERS EDGE        │
        │  rotationtv-live-ai-clones (main)  │
        │  rotation-erotica-app (adult)      │
        │  rtv-token-manager (registry)      │
        └──────┬──────────────────┬──────────┘
               │                  │
        ┌──────┴──────┐    ┌──────┴──────────┐
        ▼             ▼    ▼                 ▼
  ┌──────────┐  ┌──────────┐  ┌──────────────────┐
  │StreamRoom│  │RTVStream │  │ RAILWAY EXPRESS  │
  │  (DO)    │  │Agent (DO)│  │  RotationErotica │
  │WebSocket │  │AI Mod.   │  │  (Next.js 14)    │
  └──────────┘  └──────────┘  └─────────┬────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                     ▼
             ┌────────────┐      ┌────────────┐      ┌──────────────┐
             │  SUPABASE  │      │  VENICE AI │      │  HEYGEN AI   │
             │ PostgreSQL │      │  90 models │      │  Video Clone │
             │  + Edge    │      │ 6 uncensor │      │  Streaming   │
             │ Functions  │      │ 14 E2EE    │      │  Avatar      │
             └────────────┘      └────────────┘      └──────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │     BLOCKCHAIN LAYER      │
        │  TON (Chainstack RPC)     │
        │  Solana (Helius RPC)      │
        │  $RTVS Token (9 dec)      │
        │  Symbiosis Bridge         │
        └───────────────────────────┘
```

---

## 3. ROTATIONTV LIVE — MAIN PLATFORM

### What it is
The primary Telegram Mini App — a live streaming platform with:
- 6 AI host broadcast grid (LEO, MAYA, DR. REED, ZARA, OMAR, LINA)
- Real-time WebSocket chat rooms (Durable Objects)
- Creator monetization: tips, gifts, PK battles, subscriptions
- AI moderation via RTVStreamAgent
- 80/15/5 revenue split: creator/platform/agency

### Source Files (35 files, 6,433 lines)
| Directory | Purpose |
|-----------|---------|
| `src/index.ts` | Main Cloudflare Worker — all API routes |
| `src/agents/StreamRoom.ts` | Durable Object WebSocket room |
| `src/agents/RTVStreamAgent.ts` | AI moderation agent |
| `src/lib/veniceGateway.ts` | Venice AI — 3-key rotation |
| `src/lib/kimiGateway.ts` | Kimi AI — code + analysis |
| `src/lib/supabase.ts` | Full Supabase client (no SDK, fetch-based) |
| `src/lib/super-agent.ts` | Telegram bot NLP + vision + TTS |
| `src/lib/solanaEngine.ts` | Solana RPC failover + payment verify |
| `src/lib/crossChainBridge.ts` | TON↔SOL via Symbiosis |
| `src/lib/tonTradingEngine.ts` | RTVS trading + mining rewards |
| `src/lib/costGuard.ts` | Rate limiter + circuit breaker |
| `src/workflows/CreatorPayoutWorkflow.ts` | Durable payout (80/15/5) |

### API Routes (Complete)
```
GET  /                            Health check, version, ecosystem info
WS   /stream/:streamId            WebSocket (StreamRoom DO)
WS   /agent/:streamId             WebSocket (RTVStreamAgent DO)
POST /api/stream/init             Start new stream
POST /api/stream/tip              Send tip (queued)
POST /api/stream/end              End stream + trigger payout
POST /api/payout/creator          Manual payout trigger
GET  /api/payout/status/:id       Payout workflow status

GET  /api/kimi/health             Kimi connection status
POST /api/kimi/chat               General Kimi chat
POST /api/kimi/review             PR code review
POST /api/kimi/analyze            Code analysis
POST /api/kimi/host               AI host line generation
POST /api/kimi/moderate           Content moderation

GET  /api/venice/health           Venice + key pool status
POST /api/venice/chat             General Venice chat
POST /api/venice/adult            Age-gated (18+ verified)
POST /api/venice/moderate         Adult-aware moderation
POST /api/venice/zara             ZARA AI host lines (uncensored)
POST /api/venice/dm               Creator DM persona assistant
POST /api/venice/prompt           NSFW image prompt generator

GET  /api/ton/metrics             RTVS token metrics
POST /api/ton/mine                Mining reward
GET  /api/ton/leaderboard         Mining leaderboard
GET  /api/ton/pairs               Trading pairs
POST /api/ton/trade               Execute trade
GET  /api/ton/pools               Liquidity pools
GET  /api/ton/orderbook           Order book

GET  /api/solana/health           Solana RPC status
GET  /api/solana/balance          Wallet balance (SOL + SPL)
GET  /api/solana/history          Transaction history
GET  /api/solana/tx               Specific transaction
POST /api/solana/verify-payment   Verify USDC tip on-chain
POST /api/solana/nft-gate         NFT-based access check

GET  /api/bridge/health           Symbiosis bridge status
GET  /api/bridge/pairs            Supported pairs
POST /api/bridge/quote            Cross-chain swap quote
GET  /api/bridge/status           Swap status by tx hash

GET  /api/spend/dashboard         Cost guard (signed)
POST /api/admin/*                 Admin (HMAC required)
```

### Mini App Screens (6)
| Screen | File | Purpose |
|--------|------|---------|
| Home | App.tsx | 6-host AI grid + stream viewer |
| Discover | DiscoverScreen.tsx | Browse live creators |
| Gifts | GiftsScreen.tsx | Send virtual gifts |
| PK Battle | PKScreen.tsx | Creator vs creator battles |
| Profile | ProfileScreen.tsx | User profile + stats |
| Ranks | RanksScreen.tsx | Leaderboard |
| Wallet | WalletScreen.tsx | RTVS + TON + USDC |
| Trading | TradingScreen.tsx | AMM + orderbook |
| Mining | MiningScreen.tsx | Proof-of-activity mining |

---

## 4. ROTATIONEROTICA — ADULT PLATFORM

### What it is
18+ premium live streaming and content platform:
- Venice uncensored AI for content generation
- HeyGen AI video avatars for adult creators
- Cloudflare Calls for WebRTC private sessions
- Age verification via Supabase biometric log
- Agency management for talent

### Project Structure (from provided spec)
```
RotationErotica/
├── .github/workflows/
│   ├── rotationtv-deploy.yml    CI/CD → Railway
│   └── pr-preview.yml           PR preview environments
├── src/
│   ├── api/                     Express routes
│   │   ├── agencies/            Agency CRUD
│   │   ├── creators/            Creator management
│   │   ├── payouts/             80/15/5 payouts
│   │   ├── streams/             Stream lifecycle
│   │   ├── tributes/            Tribute payments
│   │   ├── ai/                  Venice/HeyGen/Replicate proxy
│   │   ├── research/            Deep Research Agent
│   │   └── webhooks/            Stripe + TON webhooks
│   ├── bot/                     Telegraf (@ROTATIONEROTICA_BOT)
│   ├── blockchain/              TON integration
│   ├── workers/index.ts         Cloudflare Worker (Hono)
│   └── lib/
│       ├── venice.ts            Venice client
│       ├── supabase.ts          Supabase client
│       ├── stripe.ts            Stripe client
│       ├── ton.ts               TON client
│       └── master-prompt.ts     Master Prompt Router
├── supabase/
│   ├── migrations/              SQL migrations
│   └── functions/
│       ├── venice-proxy/        Venice edge proxy
│       └── stripe-webhook/      Stripe webhook handler
├── base44/                      Base44 exported frontend
├── railway.toml                 Railway deployment config
└── wrangler.toml                Cloudflare Worker config
```

### Telegram Bot — @ROTATIONEROTICA_BOT
- **Token:** ✅ Injected as `TELEGRAM_BOT_TOKEN` on `rotation-erotica-app` worker
- **Framework:** Telegraf
- **Commands:**
  - `/start` — Welcome + age verification prompt
  - `/subscribe` — Premium access tiers
  - `/creators` — Browse verified creators
  - `/agency` — Agency portal
  - `/tip` — Send tribute
  - `/session` — Start private session

### Age Verification Flow
```
1. User sends /start to @ROTATIONEROTICA_BOT
2. Bot sends age verification prompt
3. User submits ID photo → /face command (GPT-4o Vision)
4. Face analysis + age estimation → Supabase age_verification_log
5. If 18+ confirmed → verified_age = true in users table
6. Venice /api/venice/adult route unlocked
7. HeyGen avatar sessions unlocked
8. RotationErotica full access granted
```

### Deployment: Railway
```bash
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 60
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Railway Env Vars needed:**
```
TELEGRAM_BOT_TOKEN     = (already injected to CF worker — also set in Railway)
VENICE_API_KEY         = (pull from GitHub Secrets vault — never hardcode, even partially)
SUPABASE_URL           = https://xynkgaxfwvpcixissxdz.supabase.co   (public URL, safe)
SUPABASE_SERVICE_KEY   = (needs your Supabase service key — pull from GitHub Secrets vault)
STRIPE_SECRET_KEY      = sk_live_... or sk_test_... (pull from GitHub Secrets vault)
HEYGEN_API_KEY         = (from app.heygen.com → Settings → API — pull from GitHub Secrets vault)
CLOUDFLARE_ACCOUNT_ID  = (pull from GitHub Secrets vault — not itself secret, but keep out of docs)
CLOUDFLARE_API_TOKEN   = (pull from GitHub Secrets vault — never hardcode, even partially)
TON_RPC_URL            = https://ton-mainnet.core.chainstack.com/.../api/v2
```
_Redacted 2026-07-03: this section previously listed real partial key prefixes and the real Cloudflare account ID. Docs should reference where a secret lives, never show any part of the value — even a prefix is enough to narrow brute-force/reconstruction risk if this repo's access ever changes._

---

## 5. AI LAYER — VENICE + KIMI + HEYGEN + OPENAI

### Venice AI (Primary Uncensored Brain)

**Auth:** ✅ Valid | **Models:** 90 | **Credits:** $0 (add at venice.ai/settings/api)

**Key Rotation — 3-key pool (all 3 slots set on worker):**
```
Attempt 1 → VENICE_API_KEY    (primary)   → rotate on 402/429
Attempt 2 → VENICE_API_KEY_2  (fallback)  → rotate on 402/429
Attempt 3 → VENICE_API_KEY_3  (backup)    → rotate on 402/429
           → throw "All keys exhausted"
```

**Model Selection Guide:**
| Use Case | Model | Price/1M out | Notes |
|----------|-------|-------------|-------|
| General chat | `venice-uncensored-1-2` | $0.90 | Best general uncensored |
| Adult content | `venice-uncensored-role-play` | $2.00 | RotationErotica |
| Cheap uncensored | `gemma-4-uncensored` | $0.50 | High volume |
| Private E2EE | `e2ee-venice-uncensored-24b-p` | $1.15 | Zero server logs |
| Ultra-cheap | `qwen3-5-9b` | $0.15 | Moderation at scale |
| Code review | `kimi-k2-7-code` | — | Via Venice proxy |
| Vision tasks | `venice-uncensored-1-2` | $0.90 | Supports images |
| Pro reasoning | `claude-opus-4-8-fast` | $60.00 | High-stakes only |
| Massive context | `grok-4-20` | $2.83 | 2M token context |

**6 Gateway Actions wired in veniceGateway.ts:**
```typescript
POST /api/venice/chat      → veniceChat()           General AI
POST /api/venice/adult     → generateAdultContent() Age-gated
POST /api/venice/moderate  → veniceModerate()       Content check
POST /api/venice/zara      → generateZaraLines()    AI host scripts
POST /api/venice/dm        → creatorDMAssistant()   Fan DM persona
POST /api/venice/prompt    → generateNSFWPrompt()   Image prompts
GET  /api/venice/health    → healthCheck()           Status + key pool
```

### Kimi AI (Moonshot — Code + Analysis)
- **Base URL:** https://api.moonshot.ai/v1
- **Status:** Key slot set — needs real `sk-` key from platform.moonshot.ai
- **Best for:** Code review (PR automation), ecosystem analysis, host script generation
- **Models:** kimi-k2.7-code (256K) · kimi-k2.5 (256K) · moonshot-v1-128k

**Get your key:**
```
1. Go to platform.moonshot.ai
2. Create account → API Keys
3. npx wrangler secret put KIMI_API_KEY
   (enter your sk-XXXX key)
```

### HeyGen AI Video Avatars
- **Dashboard:** https://app.heygen.com/
- **Purpose:** AI video clone avatars for RotationErotica creators
- **API:** https://api.heygen.com/v2
- **Auth:** HTTP 401 — needs HEYGEN_API_KEY

**Capabilities:**
- Streaming Avatar — real-time interactive AI video clone
- Custom voice + appearance
- Script-to-video generation
- Private session rooms (1:1 with fans)

**Get your key:**
```
1. app.heygen.com → Settings → API
2. Generate API key
3. npx wrangler secret put HEYGEN_API_KEY
4. Also set in Railway env for RotationErotica Express API
```

**Integration pattern (RotationErotica ai/ route):**
```typescript
// POST /api/ai/heygen/session
const session = await fetch('https://api.heygen.com/v1/streaming.new', {
  method: 'POST',
  headers: { 'X-Api-Key': env.HEYGEN_API_KEY },
  body: JSON.stringify({
    quality: 'high',
    avatar_id: creatorAvatarId,
    voice: { voice_id: creatorVoiceId },
    video_encoding: 'H264',
  })
});
```

### OpenAI (Vision + TTS + Moderation)
- **Status:** OPENAI_API_KEY not yet set
- **Used for:** /face command (age verification), stream moderation, TTS
- **Get:** platform.openai.com → API Keys

```bash
npx wrangler secret put OPENAI_API_KEY
```

---

## 6. BLOCKCHAIN LAYER — TON + SOLANA + BRIDGE

### TON Network — Chainstack RPC ✅ LIVE

**Endpoints (both confirmed 200 — seqno ~75.8M):**
```
v2: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2
v3: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3
```

**v2 Methods (REST):**
```
GET /getMasterchainInfo       Chain head
GET /getBalance?address=X     TON balance
GET /getTransactions          Transaction history
GET /sendBoc                  Send signed transaction
GET /getTokenData?address=X   Jetton metadata
```

**v3 Methods (OpenAPI):**
```
GET /masterchainInfo          Chain info + seqno
GET /jetton/transfers         Jetton transfer events
GET /jetton/burns             Token burn events
GET /events?account=X         All account events
GET /transactions?account=X   Transactions
POST /message                 Broadcast transaction
```

**$RTVS Token:**
- Network: TON mainnet
- Decimals: 9
- Rate: 1 RTVS = $0.01 USD
- Wallet: TonConnect 2.0
- Contract: TBD (not yet deployed — deploy via TON contract toolkit)

**Mining Rewards (tonTradingEngine.ts):**
| Activity | RTVS Reward |
|----------|------------|
| stream_hour | 25 |
| tip_sent | 1 |
| tip_received | 2 |
| pk_win | 100 |
| pk_participate | 20 |
| new_follower | 5 |
| daily_login | 10 |
| referral | 50 |
| course_complete | 100 |
| milestone_hit | 500 |

**Multipliers:** streak (+10% per day, max 2x) · VIP (1.5x) · Sovereign (2x)

### Solana — RPC Failover Chain

**Endpoints (auto-failover in solanaEngine.ts):**
```
1. Helius:   https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
2. QuickNode: ${QUICKNODE_RPC}
3. Alchemy:   ${ALCHEMY_RPC}
4. Public:    https://api.mainnet-beta.solana.com
```

**Capabilities:**
- SOL + all SPL token balances in one call
- USDC payment verification (on-chain confirm before crediting tips)
- NFT gate for premium stream access (Helius DAS API)
- Transaction history (up to 50 signatures)

**Token addresses:**
```
USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
RTVS: (set via RTVS_MINT_SOLANA secret after token deploy)
```

### Cross-Chain Bridge — Symbiosis Finance

**Supported pairs:**
```
TON/SOL   → ~45s, 3% slippage
SOL/TON   → ~45s, 3% slippage
USDC/TON  → ~30s, 0.1% fee
SOL/USDT  → ~45s, 3% slippage
TON/USDT  → ~20s, 0.1% fee
```

**Creator payout bridge flow:**
```
Creator earns in RTVS (TON)
  → Platform calls creatorBridgePayout()
  → Symbiosis quotes TON/SOL swap
  → Creator signs with TonConnect
  → Funds arrive in creator's Solana wallet in ~45s
  → USDC conversion optional (second swap)
```

---

## 7. PAYMENT RAILS — 10 METHODS

| # | Method | Chain | Status | Notes |
|---|--------|-------|--------|-------|
| 1 | TON Wallet | TON | ✅ Wired | TonConnect, native Mini App |
| 2 | Telegram Stars | Telegram | ✅ Wired | Native Telegram payments |
| 3 | Tribute | Web | ✅ Wired | Direct fan support |
| 4 | Stripe | Web | ⚠️ Key needed | sk_live_... |
| 5 | PayPal | Web | ⚠️ Key needed | Web checkout |
| 6 | USDC (Solana) | Solana | ✅ Verify built | verifyUSDCPayment() |
| 7 | $RTVS Token | TON | 🔧 Contract needed | AMM built |
| 8 | USDT (TON) | TON | 🔧 Planned | jUSDT on TON |
| 9 | Solana Pay | Solana | 🔧 Planned | wallet-adapter |
| 10 | Symbiosis Bridge | Cross-chain | ✅ Wired | Swap any→any |

### Revenue Split (80/15/5)
```
Creator receives:  80% of all tips/gifts/subscriptions
Platform takes:    15% (Rotationtvnetwork LLC)
Agency receives:    5% (if creator is agency-represented)

Payout engine: CreatorPayoutWorkflow.ts (Cloudflare Durable Workflow)
Payout triggers: stream end, daily settlement, manual request
```

### Subscription Plans
```
Basic:      $9.99/mo — Standard streams, Mini App access
Pro:        $29.99/mo — HD streams, AI features, early access
Enterprise: $99.99/mo — Full API access, white-label, priority support
```

---

## 8. TELEGRAM BOTS

### Bot 1 — RotationTV Main Bot
- **Token:** `TELEGRAM_BOT_TOKEN_MAIN` — NOT YET SET
- **Framework:** GrammY (in super-agent.ts)
- **Commands:**
  - `/start` — Welcome + wallet creation
  - `/live` — Browse live streams
  - `/wallet` — View RTVS + TON + USDC balance
  - `/mine` — Check mining rewards
  - `/tip` — Send tip to creator
  - `/pk` — PK battle challenges
  - `/ai` — Chat with AI host
  - `/face` — Age verification (vision)

### Bot 2 — @ROTATIONEROTICA_BOT ✅
- **Token:** ✅ `TELEGRAM_BOT_TOKEN_EROTICA` set on main worker
- **Token on rotation-erotica-app worker:** ✅ `TELEGRAM_BOT_TOKEN` set
- **Framework:** Telegraf (RotationErotica bot/ directory)
- **Purpose:** Adult platform — age-verified fan engagement, private sessions

### Bot 3 — RTV Wallet Bot (rtv-telegram-wallet repo)
- **Token:** Set as `TELEGRAM_BOT_TOKEN` in wallet bot .env
- **Framework:** node-telegram-bot-api
- **Commands:** /balance /faucet /send /receive /stake /history
- **AI:** APEX AI Gateway (Anthropic claude-3-5-haiku + Gemini key rotation)

### Setting up MAIN Bot Token:
```bash
# Create via @BotFather:
# 1. Open Telegram → @BotFather
# 2. /newbot → name: RotationTV → username: ROTATIONTV_BOT
# 3. Copy token
npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
# Paste token when prompted

# Register webhook:
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/telegram/webhook"}'
```

---

## 9. DATABASE — SUPABASE

**Project:** `xynkgaxfwvpcixissxdz.supabase.co`
**Status:** Reachable ✅ | rotation-omega-notify edge function deployed ✅

### Schema (3 migrations — 793 lines total)

#### Migration 001 — Initial Schema (226 lines)
```sql
users              -- telegram_id, full_name, username, role, verified_age
wallets            -- user_id, wallet_address, rtv_balance, ton_balance, usdt_balance
transactions       -- from/to, amount, token, tx_hash, status
```

#### Migration 002 — RTV Live (362 lines)
```sql
live_streams       -- creator_id, stream_key, status, viewer_count, tip_total
gifts              -- sender_id, recipient_id, gift_type, amount, stream_id
tips               -- sender_id, creator_id, amount, token, verified_tx
pk_battles         -- challenger_id, opponent_id, start_time, winner_id, votes
mining_events      -- user_id, activity_type, reward, multiplier, streak_days
ai_broadcast_sessions -- host_name, stream_id, start_time, lines_spoken
moderation_log     -- stream_id, event_type, action, severity, ai_model_used
subscriptions      -- user_id, tier, status, stripe_id, expires_at
follows            -- follower_id, creator_id, notify_on_live
notifications      -- user_id, type, data, read, created_at
```

#### Migration 003 — Security + Cost Protection (205 lines)
```sql
creator_limits     -- user_id, tier, daily_rtvs_limit, current_usage
ai_spend_log       -- provider, model, tokens_in, tokens_out, cost_usd, request_id
rate_limit_events  -- ip, user_id, endpoint, window_start, count
circuit_breaker    -- provider, status, tripped_at, reset_at
age_verification_log -- user_id, method, result, confidence, verified_at
domain_config      -- domain, company_id, features_enabled, age_gated
```

### Edge Functions (2 deployed)
| Function | URL | Status |
|----------|-----|--------|
| `rotation-omega-notify` | https://xynkgaxfwvpcixissxdz.supabase.co/functions/v1/rotation-omega-notify | ✅ Deployed (400 = needs auth) |
| `venice-proxy` | TBD | Deploy from RotationErotica/supabase/functions/ |
| `stripe-webhook` | TBD | Deploy from RotationErotica/supabase/functions/ |

### Getting Supabase Keys:
```
1. app.supabase.com → xynkgaxfwvpcixissxdz → Settings → API
2. Copy:
   - "URL" → SUPABASE_URL
   - "anon public" → SUPABASE_ANON_KEY
   - "service_role secret" → SUPABASE_SERVICE_KEY

npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
```

### Running Migrations:
```
1. app.supabase.com → xynkgaxfwvpcixissxdz → SQL Editor
2. Run each file in order:
   → supabase/migrations/001_initial_schema.sql
   → supabase/migrations/002_rotationtv_live_schema.sql
   → supabase/migrations/003_security_cost_protection.sql
3. Enable pg_cron for scheduled jobs:
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   SELECT cron.schedule('daily-reset', '0 0 * * *', 'SELECT reset_daily_creator_limits()');
```

---

## 10. CLOUDFLARE INFRASTRUCTURE

### Account: Rotationtimmy@gmail.com
- **Account ID:** `947b01a53876bee16fa0e8360c880aca`
- **Workers subdomain:** `rotationtimmy.workers.dev`
- **Stream subdomain:** `customer-n6iqbvyr2svw15o3.cloudflarestream.com`
- **Calls App:** `2024532ace8ea0f84e62bc78c089784f` (Rotation-Erotica-Cloud)

### Account 2
- **Account ID:** `7e431c541ea0f39d7f7fe5fd9f06eada`
- **Token:** MASTER_CF_TOKEN (verified active)
- **Workers:** 0 (available for RotationErotica CF worker)

### Durable Objects
```
STREAM_ROOM       → StreamRoom.ts       WebSocket rooms
RTV_STREAM_AGENT  → RTVStreamAgent.ts   AI moderation
```

### Queues
```
tip-queue     8fb801dd9f5e43218ed0d1edc3274d67  producer+consumer
tip-queue-dlq 4177c698ae1e4107b73ad2eba99627f4  dead letter
```

### KV Namespaces
```
KV_SPEND         3542f381a0d143318f9061d32661a509  rate limits + spend
KV_SPEND_preview 8239c2789892466c9d92be6fec589453  local dev
```

### Still Needs Manual Activation
```
R2 bucket → https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/r2
  → Create bucket: "rtv-assets"
  → Used for: stream thumbnails, creator avatars, AI host images

Analytics Engine → https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/workers/analytics-engine
  → Used by: STREAM_ANALYTICS.writeDataPoint() in mining + trading
```

### Deploy v6.1.0 to Wire:
```bash
cd rotationtv
npm install
npx wrangler deploy
# Takes ~30 seconds
# Confirms: ✅ rotationtv-live-ai-clones v6.1.0 deployed
```

---

## 11. GITHUB + CI/CD

### Organization: rotationtv1-crypto
| Repo | Visibility | Purpose | Last Push |
|------|-----------|---------|-----------|
| RotationTV-Live-AI-Clones | 🔒 Private | Main platform | Jun 22 |
| RotationErotica | 🔒 Private | Adult platform | — |
| rtv-telegram-wallet | 🌐 Public | Wallet bot | Jun 22 |
| ton-assets, supabase, wallet-adapter, supabase-mcp | 🌐 Forks | Reference | Jun 16 |

### GitHub Actions — 2 Workflows

#### rotationtv-deploy.yml / deploy.yml
```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

#### pr-preview.yml / kimi-review.yml
- Auto-reviews PRs using Kimi AI
- Creates Railway preview environments for PRs
- Comments review on PR

### GitHub Secrets Required:
```
Settings → Secrets → Actions → New repository secret:

CLOUDFLARE_API_TOKEN    = cfat_LSKx... (MASTER_CF_TOKEN value)
CLOUDFLARE_ACCOUNT_ID   = 947b01a53876bee16fa0e8360c880aca
OPENAI_API_KEY          = sk-...
KIMI_API_KEY            = sk-... (from platform.moonshot.ai)
RAILWAY_TOKEN           = (from railway.com → Account Settings)
SUPABASE_ACCESS_TOKEN   = (from app.supabase.com → Account → Access Tokens)
```

### Push Code to GitHub:
```bash
cd rotationtv
git init
git remote add origin https://github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones.git
git add .
git commit -m "feat: v6.1.0 — Solana engine, cross-chain bridge, Venice 3-key rotation"
git push origin main
# → Triggers deploy.yml automatically → wrangler deploy runs
```

---

## 12. SECRETS MASTER REGISTRY

### rotationtv-live-ai-clones — 9 of 9 INJECTED ✅
| Secret | Status | Source |
|--------|--------|--------|
| CHAINSTACK_TON_RPC_V2 | ✅ | Injected June 26 |
| CHAINSTACK_TON_RPC_V3 | ✅ | Injected June 26 |
| KIMI_API_KEY | ✅ | Placeholder — needs real sk- key |
| MASTER_CF_TOKEN | ✅ | cfat_LSKx... |
| REQUEST_SIGNING_SECRET | ✅ | HMAC-SHA256 64-char hex |
| TELEGRAM_BOT_TOKEN_EROTICA | ✅ | @ROTATIONEROTICA_BOT |
| VENICE_API_KEY | ✅ | VENICE_INFERENCE_KEY_2uKg... |
| VENICE_API_KEY_2 | ✅ | VENICE_INFERENCE_KEY_ycKi... |
| VENICE_API_KEY_3 | ✅ | Rotation slot 3 |

### Still Needed (BLOCKERS)
| Secret | Source | Command |
|--------|--------|---------|
| `OPENAI_API_KEY` | platform.openai.com → API Keys | `npx wrangler secret put OPENAI_API_KEY` |
| `SUPABASE_URL` | app.supabase.com → Settings → API | `npx wrangler secret put SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | app.supabase.com → Settings → API | `npx wrangler secret put SUPABASE_SERVICE_KEY` |
| `SUPABASE_ANON_KEY` | app.supabase.com → Settings → API | `npx wrangler secret put SUPABASE_ANON_KEY` |
| `TELEGRAM_BOT_TOKEN_MAIN` | @BotFather → /token | `npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN` |
| `KIMI_API_KEY` (real) | platform.moonshot.ai → sk- key | `npx wrangler secret put KIMI_API_KEY` |
| `HEYGEN_API_KEY` | app.heygen.com → Settings → API | `npx wrangler secret put HEYGEN_API_KEY` |
| `HELIUS_API_KEY` | helius.dev (free tier) | `npx wrangler secret put HELIUS_API_KEY` |

### rotation-erotica-app — 1 of N INJECTED
| Secret | Status | Notes |
|--------|--------|-------|
| `TELEGRAM_BOT_TOKEN` | ✅ | @ROTATIONEROTICA_BOT |
| `VENICE_API_KEY` | ⚠️ | Add: same key as main |
| `SUPABASE_URL` | ⚠️ | Add when available |
| `SUPABASE_SERVICE_KEY` | ⚠️ | Add when available |

### Injecting All Remaining Secrets at Once:
```bash
# Run each interactively — paste value when prompted
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
npx wrangler secret put KIMI_API_KEY
npx wrangler secret put HEYGEN_API_KEY
npx wrangler secret put HELIUS_API_KEY
```

---

## 13. LAUNCH SEQUENCE — PHASE BY PHASE

### PHASE 0 — NOW (4 minutes) ⚡
```
☑ wrangler deploy   → npx wrangler deploy (from rotationtv dir)
☑ Venice credits    → venice.ai/settings/api → add $20+
```
**Result:** v6.1.0 live, Venice brain active, all 17 blockchain routes live

### PHASE 1 — TODAY (1 hour)
```
□ Add OPENAI_API_KEY          → Vision + TTS + moderation active
□ Add SUPABASE keys (3)       → DB writes from worker active
□ Add TELEGRAM_BOT_TOKEN_MAIN → Main bot goes live
□ Run SQL migrations (3)      → Database schema created
□ Push code to GitHub         → CI/CD pipeline active
```
**Result:** Full platform live, Telegram bot active, DB connected

### PHASE 2 — THIS WEEK (1-2 days)
```
□ Add KIMI_API_KEY (real sk-)  → Code review + host lines active
□ Add HEYGEN_API_KEY           → AI avatar streaming active
□ Add HELIUS_API_KEY (free)    → NFT gating + Solana premium features
□ Enable R2 bucket (1 click)   → Asset CDN active
□ Enable Analytics Engine       → Stream analytics active
□ Set GitHub Actions secrets   → Auto-deploy on git push
□ Deploy rtv-telegram-wallet   → Wallet bot live
```
**Result:** Full AI stack live, Solana features active, CI/CD automated

### PHASE 3 — LAUNCH WEEK (3-5 days)
```
□ Add STRIPE_SECRET_KEY        → Web subscriptions active
□ Deploy RotationErotica       → Railway deploy with all env vars
□ Age verification flow test   → /face command end-to-end
□ Deploy Supabase edge functions → venice-proxy + stripe-webhook
□ Register Telegram Mini App   → @BotFather → /newapp
□ Set custom domain            → rotationtv.network → Cloudflare DNS
□ Deploy $RTVS token           → TON mainnet contract
□ Add Venice credits headroom  → $100+
□ Load test tip flow           → StreamRoom → tip-queue → payout
□ Announce soft launch         → Telegram channels
```

### PHASE 4 — GROWTH (Week 2+)
```
□ Onboard first 10 creators    → Agency portal
□ Set up RTVS/TON liquidity    → tonTradingEngine AMM
□ Enable Chainstack TON webhooks → Real-time event notifications
□ Launch RotationErotica adult platform
□ Deploy 9 company sub-portals  → rtvEcosystem.ts companies
□ Integrate Replicate for AI image generation
□ Launch $RTVS token on DEX    → Ston.fi or Dedust
```

---

## 14. MONETIZATION PLAYBOOK

### Stream Revenue Streams
```
1. Tips:          Fan → Creator (80/15/5 split)
2. Gifts:         Virtual gifts (emojis, animations) → monetized
3. Subscriptions: $9.99 / $29.99 / $99.99/mo
4. PK Battles:    Entry fees → winner takes pool
5. Mining:        Activity rewards → buy back from AMM
6. Private Sessions: 1:1 with creator (HeyGen avatar)
7. Agency Cut:    5% of all managed creator earnings
8. Platform Fee:  15% of all transactions
```

### $RTVS Token Economy
```
Minting:    Mining rewards (activity-based)
Burning:    5% of platform fees burned quarterly
Utility:    Subscribe, tip, unlock features, vote on platform direction
Trading:    AMM pools (RTVS/TON, RTVS/USDT)
Staking:    4.5% APY (wallet bot /stake command)
Price:      1 RTVS = $0.01 USD (initial)
```

### Agency Model
```
Agencies sign creators → take 5% of creator earnings
Platform handles:
  - Payment processing
  - Content moderation (Venice AI)
  - Age verification
  - Payout automation
  - Dispute resolution
```

### Competitive Moat
```
✅ Venice AI (uncensored) + OpenAI (moderation) = best of both worlds
✅ TON-native (Telegram ecosystem = 900M+ users)
✅ Cross-chain (TON + Solana) = broadest audience
✅ 10 payment rails = minimal friction
✅ Agency model = B2B revenue on top of B2C
✅ 9-company ecosystem = locked-in user journey
✅ Cloudflare edge = globally fast, zero cold starts
✅ E2EE Venice models = true creator privacy
```

---

## 15. OPERATIONS & MONITORING

### Health Check Commands
```bash
# Main worker
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/

# AI health (after deploy v6.1.0)
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health

# Blockchain health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/solana/health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/bridge/health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/ton/metrics

# TON direct
curl https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3/masterchainInfo
```

### Cost Protection (costGuard.ts)
| Provider | Daily Cap | Rate Limit |
|----------|----------|------------|
| Venice AI | $50 | 30/min (adult: 10/min) |
| Kimi AI | $25 | 30/min |
| OpenAI | $100 | Standard |
| **TOTAL** | **$175** | — |

### Incident Runbook
| Alert | Cause | Fix |
|-------|-------|-----|
| Venice 402 on all 3 keys | Credits exhausted | Add credits at venice.ai |
| Venice 429 cycling | Rate limit | Reduce request volume |
| Supabase 401 | Wrong anon key | Recheck Settings → API |
| TON 500 | Chainstack issue | Switch to tonapi.io |
| Tip queue DLQ growing | Payout engine down | Check PAYOUT_ENGINE_URL |
| KV_SPEND circuit tripped | Spend limit hit | Review ai_spend_log |

---

## 16. DEEP RESEARCH: VENICE AI

### What makes Venice different
Venice routes all AI inference through their own infrastructure with a privacy guarantee: **no training on user data, no logs retained, end-to-end encrypted (E2EE) option**. This is why it's the backbone of RotationErotica — adult content can't be run on OpenAI/Anthropic APIs.

### E2EE Models (14 available)
E2EE models use client-side encryption — Venice's servers cannot read the plaintext:
```
e2ee-venice-uncensored-24b-p    ← Best for sensitive adult content
e2ee-gemma-4-26b-a4b-uncensored-p
e2ee-qwen3-6-35b-a3b-uncensored-p
e2ee-gpt-oss-20b-p
e2ee-gpt-oss-120b-p
e2ee-qwen3-30b-a3b-p
```
Use for: Private fan DMs, creator coaching, sensitive content that must never be logged.

### System Prompt Suppression
Setting `include_venice_system_prompt: false` removes Venice's default AI persona, giving maximum freedom for role-play, adult, and uncensored content.

### Model Pricing Strategy
```
Cheapest viable:    qwen3-5-9b            $0.15/1M out  → Bulk moderation
Standard uncensored: gemma-4-uncensored   $0.50/1M out  → General content
Premium uncensored:  venice-uncensored-1-2 $0.90/1M out → Main platform
Adult role-play:    venice-uncensored-role-play $2.00/1M → RotationErotica
E2EE private:       e2ee-venice-uncensored-24b-p $1.15/1M → Creator privacy
Top-tier reasoning: claude-opus-4-8-fast  $60.00/1M out → Complex decisions
```

---

## 17. DEEP RESEARCH: TON + CHAINSTACK

### Why TON for RTV
- **Telegram-native**: 900M+ Telegram users = zero onboarding friction
- **TonConnect 2.0**: Deep-links into Tonkeeper, MyTonWallet, official Telegram wallet
- **Jettons (TON tokens)**: Full ERC-20 equivalent via TIP-74 standard
- **Micro-payments**: ~0.01 TON per transaction = ideal for streaming tips

### Chainstack vs alternatives
| Provider | Free tier | Reliability | Notes |
|----------|----------|-------------|-------|
| Chainstack | ✅ 3M requests/mo | 99.9% SLA | Your active endpoint |
| tonapi.io | ✅ Limited | Good | Good fallback |
| toncenter.com | ✅ Rate-limited | Community | Avoid for production |
| Public mainnet | ✅ Unlimited | Varies | Last resort only |

### TON v2 vs v3
```
v2: Mature, widely supported, most SDKs use this
    GET https://.../api/v2/getMasterchainInfo
    Works with TonWeb, TonSDK, official clients

v3: Newer, OpenAPI spec, richer event model
    GET https://.../api/v3/masterchainInfo
    Better for jetton transfer tracking
    Use this for RTVS token event webhooks
```

### $RTVS Token Deployment Guide
```
1. Install TON contract toolkit:
   npm install -g @ton/blueprint

2. Create jetton contract:
   npx blueprint create jetton

3. Configure:
   - name: "RTV Sovereign"
   - symbol: "RTVS"
   - decimals: 9
   - total_supply: 1,250,000,000 RTVS

4. Deploy to mainnet:
   npx blueprint run --testnet  # test first
   npx blueprint run --mainnet  # go live

5. Verify on tonviewer.com
6. List on Ston.fi DEX for liquidity
7. Set RTVS_JETTON env var to contract address
```

---

## 18. DEEP RESEARCH: HEYGEN AI VIDEO

### What HeyGen provides for RTV
- **Streaming Avatar API**: Real-time interactive AI video avatar (WebRTC)
- **Video Generation**: Script → video in minutes
- **Voice Cloning**: Clone creator's voice for AI persona
- **Custom Appearance**: Upload creator photo → AI maintains likeness

### Streaming Avatar Architecture (RotationErotica)
```
Fan opens private session
  → POST /api/ai/heygen/session (Railway Express)
  → HeyGen creates streaming session
  → Returns: session_id, access_token, realtime_endpoint
  → Fan browser connects to realtime_endpoint (WebRTC)
  → Fan types messages → AI avatar speaks in creator's voice
  → Session logs to Supabase
  → Fan pays per-minute via TON microtransactions
```

### Integration Code Pattern
```typescript
// src/api/ai/heygen-session.ts
async function createAvatarSession(creatorId: string, env: Env) {
  const creator = await supabase.from('creators').select('heygen_avatar_id, heygen_voice_id').eq('id', creatorId);
  
  const session = await fetch('https://api.heygen.com/v1/streaming.new', {
    method: 'POST',
    headers: { 'X-Api-Key': env.HEYGEN_API_KEY },
    body: JSON.stringify({
      quality: 'high',
      avatar_id: creator.heygen_avatar_id,
      voice: { voice_id: creator.heygen_voice_id },
      video_encoding: 'H264',
      knowledge_base_id: creator.knowledge_base_id, // creator's FAQ/persona
    })
  });
  
  return session.json(); // { session_id, access_token, realtime_endpoint }
}
```

### Getting HeyGen API Key
```
1. app.heygen.com → Sign in
2. Settings → API Keys → Generate
3. Copy key (starts with "MGU...")
4. npx wrangler secret put HEYGEN_API_KEY
5. Also add to Railway env vars for RotationErotica
```

---

## 19. DEEP RESEARCH: RAILWAY DEPLOYMENT

### Why Railway for RotationErotica
Cloudflare Workers have a 128MB memory limit and no persistent filesystem. Railway hosts a full Node.js/Express app with persistent connections, better for:
- Long-running bot processes (Telegraf polling)
- File uploads/processing
- Supabase edge function orchestration
- HeyGen session management

### Complete railway.toml
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 60
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "rotation-erotica-api"
source = "."

[[services]]
name = "rotation-erotica-bot"
source = "."
startCommand = "npm run bot"
```

### Deployment Steps
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd RotationErotica
railway init

# 4. Set env vars
railway variables set TELEGRAM_BOT_TOKEN="your_token"
railway variables set VENICE_API_KEY="your_key"
railway variables set SUPABASE_URL="https://xynkgaxfwvpcixissxdz.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="your_service_key"
railway variables set HEYGEN_API_KEY="your_key"
railway variables set STRIPE_SECRET_KEY="sk_live_..."

# 5. Deploy
railway up

# 6. Get public URL
railway domain
```

### PR Preview Environments (pr-preview.yml)
Each PR gets its own Railway deployment for staging:
```yaml
# .github/workflows/pr-preview.yml
on:
  pull_request:
    branches: [main]
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy preview
        uses: railwayapp/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          environment: "pr-${{ github.event.pull_request.number }}"
```

---

## 20. 9-COMPANY ECOSYSTEM

From `src/lib/rtvEcosystem.ts` — the full Rotationtvnetwork LLC portfolio:

| Company | Platform Role | Revenue Model |
|---------|--------------|---------------|
| **rotationtv-network** | Live streaming + Mini App | Subscriptions, tips, ads |
| **rotationpay** | Payment processing | Transaction fees |
| **rotationcall** | WebRTC video calls | Per-minute billing |
| **rtv-university** | Creator education | Course sales |
| **bigo-agency** | Talent management | 5% creator cut |
| **white-logistics** | B2B fulfillment | Contract fees |
| **pretrial-services** | Legal tech | Subscription SaaS |
| **emergentlabs** | AI experimentation | API licensing |
| **openclaw** | Open source tools | Sponsorship |

### Cross-Company Data Flow
```
User registers on rotationtv-network
  → rotationpay handles all payments
  → rotationcall provides 1:1 sessions
  → rtv-university offers creator courses
  → bigo-agency onboards professional creators
  → emergentlabs powers AI features (Venice, Kimi, HeyGen)
  → rotationpay settles to creator wallets
```

---

## 21. QUICK REFERENCE CARD

### Live URLs
```
Main Worker:    https://rotationtv-live-ai-clones.rotationtimmy.workers.dev
Token Manager:  https://rtv-token-manager.rotationtimmy.workers.dev
Erotica Stub:   https://rotation-erotica-app.rotationtimmy.workers.dev
Supabase:       https://xynkgaxfwvpcixissxdz.supabase.co
TON RPC v2:     https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2
TON RPC v3:     https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3
Omega Notify:   https://xynkgaxfwvpcixissxdz.supabase.co/functions/v1/rotation-omega-notify
```

### Account IDs
```
CF Account 1:   947b01a53876bee16fa0e8360c880aca  (Rotationtimmy)
CF Account 2:   7e431c541ea0f39d7f7fe5fd9f06eada
CF Calls App:   2024532ace8ea0f84e62bc78c089784f
KV_SPEND:       3542f381a0d143318f9061d32661a509
tip-queue:      8fb801dd9f5e43218ed0d1edc3274d67
```

### API Dashboards
```
Venice:       https://venice.ai/settings/api               (add credits)
Kimi:         https://platform.moonshot.ai                 (get sk- key)
HeyGen:       https://app.heygen.com/                      (get API key)
Helius:       https://dashboard.helius.dev/                (free tier)
Railway:      https://railway.app/                         (RotationErotica)
Supabase:     https://app.supabase.com/                   (run migrations)
R2:           https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/r2
Analytics:    https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/workers/analytics-engine
GitHub:       https://github.com/rotationtv1-crypto
```

### Deploy Commands
```bash
# Deploy main worker
cd rotationtv && npx wrangler deploy

# Deploy RotationErotica (Railway)
cd RotationErotica && railway up

# Inject a secret
npx wrangler secret put SECRET_NAME

# Run Supabase migrations
supabase db push --db-url postgresql://...

# Check worker logs
npx wrangler tail rotationtv-live-ai-clones
```

### Blockers (in priority order)
```
1. npx wrangler deploy          → 2 min   → v6.1.0 live, 17 routes active
2. Venice credits ($20+)        → 2 min   → AI brain active
3. OPENAI_API_KEY               → 5 min   → Vision, TTS, moderation
4. SUPABASE keys (3 vars)       → 5 min   → Database connected
5. TELEGRAM_BOT_TOKEN_MAIN      → 5 min   → Main bot live
6. SQL migrations (3 files)     → 20 min  → Schema created
7. KIMI_API_KEY (real sk-)      → 5 min   → Code review + analysis
8. HEYGEN_API_KEY               → 5 min   → AI avatars active
9. R2 bucket (1 click)          → 2 min   → CDN active
10. GitHub Actions secrets      → 10 min  → CI/CD automated
```

---

*MASTER-LAUNCH-PLAYBOOK.md v7.0.0 | Rotationtvnetwork LLC | Presidential Authority: Darrel | June 26, 2026*
*Deep research across: Cloudflare Workers, Venice AI (90 models), Chainstack TON RPC, Supabase, HeyGen, Railway, Solana, Symbiosis Bridge, Telegram bots*
