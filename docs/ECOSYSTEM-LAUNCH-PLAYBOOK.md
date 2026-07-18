# RotationTV Ecosystem Launch Playbook
**Version:** 7.0.0 | **Date:** July 16, 2026 | **Org:** ROTATIONTVNETWORK LLC

---

## TABLE OF CONTENTS
1. Architecture Overview
2. Live Infrastructure State
3. AI Broadcast System
4. Blockchain & Payments
5. Supabase Database (Full Schema)
6. Telegram Bot Fleet
7. AI Provider Stack
8. Cloudflare Worker Fleet
9. Secret Matrix
10. Revenue Model
11. Launch Sequence
12. Post-Launch Verification
13. Known Issues & Fixes
14. Remaining Blockers

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM MINI APP                         │
│  (React SPA — rotationtv/src/RotationTVMiniApp.jsx)         │
│  10 screens: Discover, Trading, Wallet, Gifts, Mining,     │
│  PK, Ranks, Profile, Erotica, Stream                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   CLOUDFLARE WORKERS    │
          │  (6 workers + 1 live)  │
          └─┬─────────┬─────────┬──┘
            │         │         │
   ┌────────▼──┐  ┌──▼──────┐  ┌▼──────────┐
   │ SUPABASE  │  │ AI APIs │  │ BLOCKCHAIN │
   │ 80 tables │  │ Venice  │  │ TON (CS)  │
   │ 2 projects│  │ Gemini  │  │ Solana    │
   │           │  │ Kimi    │  │ (failover)│
   └───────────┘  │ OpenAI  │  └───────────┘
                  └─────────┘
```

**Stack:** React SPA → Cloudflare Workers (Durable Objects + Queues + KV + Workflows) → Supabase (PostgreSQL + Realtime) → Blockchain (TON/Solana) → AI Providers (Venice/Gemini/Kimi/OpenAI)

---

## 2. LIVE INFRASTRUCTURE STATE

### Cloudflare Workers
| Worker | URL | Status | Version |
|--------|-----|--------|---------|
| rotationtv-live-ai-clones | rotationtv-live-ai-clones.rotationtimmy.workers.dev | ✅ LIVE | v6.1.0 |
| rtv-payments | rtv-payments.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |
| rtv-stream | rtv-stream.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |
| rtv-blockchain | rtv-blockchain.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |
| rtv-edge-gateway | rtv-edge-gateway.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |
| rotationtv-erotica-bot | rotationtv-erotica-bot.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |
| rotationtv-venice-ai | rotationtv-venice-ai.rotationtimmy.workers.dev | ⚠️ Error 1042 | Stale |

**CF Account:** 947b01a53876bee16fa0e8360c880aca (Rotationtimmy@gmail.com)
**Workers subdomain:** rotationtimmy.workers.dev

### Supabase
| Project | Ref | Status | Plan | Tables |
|---------|-----|--------|------|--------|
| rotationtvai-ecosystem | xynkgaxfwvpcixissxdz | ACTIVE_HEALTHY | Pro ($25/mo) | 80 |
| Rotation Erotica | zzybjoowhkwuomnpixuy | ACTIVE_HEALTHY | Free | 15 |

### GitHub
**Repo:** rotationtv1-crypto/rtv-telegram-wallet
**Latest commit:** 58069c99
**All source pushed:** ✅

---

## 3. AI BROADCAST SYSTEM

### 6 AI Hosts (2×3 Grid)

| Host | Role | Personality | Pricing | Avatar |
|------|------|-------------|---------|--------|
| LEO | The Anchor | Professional, warm, slight smirk | $9.99/hr | ✅ Generated |
| MAYA | The Energetic One | High energy, laughs easily | $9.99/hr | ✅ Generated |
| DR. REED | The Analyst | Measured, deep voice, thoughtful | $14.99/hr | ✅ Generated |
| ZARA | The Wildcard | Sarcastic, unfiltered, deadpan | $12.99/hr | ✅ Generated |
| OMAR | The Chill Vibes Guy | Smooth, slow, stoner-wisdom | $7.99/hr | ✅ Generated |
| LINA | The Co-Host | Sweet, professional, natural | $9.99/hr | ✅ Generated |

**All 6: $299/mo flat**

### Handoff Logic
- AI hosts run until human hosts join
- Exit sequence: 2s delay between each AI exit line
- Transition: 1.5s
- Fallback: if no human in 15min, keep 1 AI co-host
- Gender matching: opposite gender to human

### Script Generation Pipeline
- **Provider:** Venice AI (3 live keys, 99 models available)
- **Route:** `POST /api/venice/host-lines`
- **Function:** `generateHostLines()` in veniceGateway.ts
- **Models:** venice-uncensored-1-2, venice-uncensored-role-play, gemma-4-uncensored
- **Status:** All 6 hosts tested and verified ✅

### Still Missing
- TTS voice synthesis (ElevenLabs integration stubbed)
- Avatar animation (HeyGen integration stubbed)
- Real-time broadcast rendering pipeline

---

## 4. BLOCKCHAIN & PAYMENTS

### TON
- **RPC:** Chainstack TON Mainnet (V2 + V3 endpoints, both set as worker secrets)
- **Token:** $RTVS, 9 decimals, TonConnect
- **Jetton Master:** Live on TON Mainnet (verified in Omni_Logs)
- **Sovereign Wallet:** 0.052 TON, 1,000,000,000 RTVS (1 billion tokens)
- **Faucet:** Configured with welcome bonus, streak multipliers, referral system

### Solana
- **Failover Chain:** Helius → QuickNode → Alchemy → Public
- **Public RPC always available** as last resort
- **HELIUS_API_KEY:** Not set (blocks primary failover)
- **Functions:** Balance check, transaction history, USDC payment verification, NFT gating

### Cross-Chain Bridge
- TON ↔ SOL via Symbiosis protocol
- Route: `/api/bridge/*`

### Payment Rails

| Rail | Method | Status |
|------|--------|--------|
| Telegram Stars | In-app purchase | ✅ Coded (4 packages + 3 subscriptions) |
| TON Wallet | TonConnect | ✅ Coded |
| Stripe | Checkout + Connect | ❌ STRIPE_SECRET_KEY not set |
| PayPal | Mass payout API | ❌ Not configured |
| Tribute | Direct transfer | ✅ Coded |

### Star Packages
| Package | Stars | RTV Tokens | Bonus |
|---------|-------|------------|-------|
| Micro | 100 | 1,000 | 0 |
| Standard | 500 | 5,000 | 500 |
| Premium | 2,000 | 25,000 | 5,000 |
| Whale | 5,000 | 100,000 | 30,000 |

### Subscriptions
| Plan | Stars | USD Equivalent |
|------|-------|----------------|
| Basic | 770 | $9.99 |
| Pro | 2,310 | $29.99 |
| VIP Elite | 7,690 | $99.99 |

---

## 5. SUPABASE DATABASE

### Main Project (xynkgaxfwvpcixissxdz) — 80 tables

#### Core Tables (with data)
| Table | Rows | Purpose |
|-------|------|---------|
| system_logs | 570 | System event logging |
| Omni_Logs | 9 | Sovereign ledger events (TO PRUNE) |
| RotationPay_Ledger | 6 | First sale rewards (TO PRUNE) |
| telegram_bots | 3 | Bot registry (Faucet, Support, University) |
| rtv_wallets | 1 | RotationtvBot wallet (100 RTV) |
| wallets | 1 | Sovereign TON wallet |
| wallet_transactions | 3+ | Contract deploy + mint events |
| rtv_transactions | 1 | RTV transfer record |

#### Profiles Table (33 columns)
```
id, email, full_name, username, avatar_url, role, company, plan,
is_active, metadata, created_at, updated_at, platform, telegram_id,
wallet_address, ton_wallet_address, wallet_chain, wallet_verified,
wallet_linked_at, stripe_account_id, stripe_account_status,
stripe_onboarding_url, paypal_email, paypal_payer_id,
payout_preference, payout_split_usd_pct, rtv_balance, rtv_locked,
total_earned_usd, total_earned_rtv, age_verified, age_verified_at,
content_tier
```
**Status:** EMPTY — 0 rows. RLS infinite recursion bug active.

#### Revenue Tables
- `payments` — Stripe/provider payment records
- `creator_payouts` — Payout tracking (USD + RTV, all rails)
- `creator_revenue` — Per-content revenue splits
- `creator_subscriptions` — Fan→creator subscriptions
- `telegram_payment_sessions` — Stars purchase sessions
- `rtv_subscriptions` — RTV token subscriptions
- `rtv_token_purchases` — Token pack purchases
- `platform_treasury` — Platform 15% share ledger
- `stripe_events` — Webhook event log

#### Blockchain Tables
- `ton_transactions` — TON chain transactions
- `crypto_transactions` — Cross-chain crypto
- `wallet_transactions` — Internal wallet transfers
- `sovereign_wallets` — Multi-chain wallet registry
- `wallet_registry` — User wallet addresses
- `ton_nfts` — TON NFT holdings

#### Content Tables
- `content` — Creator content (20 cols, premium gating)
- `content_access` — Access grants
- `rtv_streams` — Stream lifecycle
- `rtv_stream_viewers` — Viewer tracking
- `stream_uploads` — Recorded streams
- `stream_activations` — Go-live events

#### Tables to Prune (5 PascalCase duplicates)
| Table | Rows | Migrate To | Action |
|-------|------|------------|--------|
| CreatorPayout | 0 | creator_payouts | DROP |
| AcademyCredit | 0 | user_credits | DROP |
| AgencyRoster | 0 | team_members | DROP |
| RotationPay_Ledger | 6 | rtv_ledger | MIGRATE then DROP |
| Omni_Logs | 9 | system_logs | MIGRATE then DROP |

### Erotica Project (zzybjoowhkwuomnpixuy) — 15 tables
Clean snake_case, no duplicates:
content_posts, content_unlocks, creator_profiles, follows, gifts, gift_transactions, live_rooms, post_likes, profiles, reports, room_messages, rtv_transactions, stream_viewers, subscriptions, telegram_identities

---

## 6. TELEGRAM BOT FLEET

### Live Bots
| Bot | Username | ID | Token | Status |
|-----|----------|----|-------|--------|
| RotationTV Network | @base44_229784_bot | 8620919936 | TOKEN_6 | ✅ ALIVE |
| RotationTV Erotica | @RotationtvErotica_Bot | 8882738104 | TOKEN_7 | ✅ ALIVE |

### Registered in Supabase (no live tokens)
| Bot | Username | Type | Status |
|-----|----------|------|--------|
| RTV Faucet Bot | @RTVFaucetBot | faucet | Registered, no token |
| RotationTV Support Bot | @RTVSupportBot | support | Registered, no token |
| RTV University Bot | @RTVUniversityBot | university | Registered, no token |

### Dead/Compromised (REVOKE)
All tokens with IDs 8281180065, 8573530835, 8668853562 are DEAD or EXPOSED. Revoke via @BotFather.

### Webhooks
- Main bot: `https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/webhook`
- Erotica bot: `https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/erotica/webhook`
- Both have null guards deployed (commit 0343b9eb)

---

## 7. AI PROVIDER STACK

### CostGuard — Daily Spend Limits
| Provider | Daily Limit (USD) | Status |
|----------|-------------------|--------|
| Venice AI | $50 | ✅ 3 live keys |
| Kimi AI | $25 | ❌ Wrong format key |
| OpenAI | $100 | ❌ Not set |
| Cloudflare Workers AI | $20 | ✅ Available |
| **TOTAL** | **$175** | Hard cap |

### Provider Details

**Venice AI** ✅
- Keys: VENICE_API_KEY, _2, _3 (all live with credits)
- 99 models available including uncensored
- Used for: Host scripts, adult content, ZARA personality, moderation
- Route: `/api/venice/*`

**Gemini** ✅
- Key: GEMINI_API_KEY (verified, 50 models)
- Models: gemini-2.5-flash, gemini-2.5-pro, etc.
- Used as: Secondary AI provider

**Kimi AI** ❌
- Key set but wrong format (cfat_ instead of sk-)
- Used for: PR reviews, intelligent agent responses
- Fix: Get sk- format key from platform.moonshot.ai

**OpenAI** ❌
- Not set
- Used for: Super agent NLP, TTS, vision
- Get key from platform.openai.com

**HeyGen** ⚠️
- Stubbed in heygenGateway.ts
- Used for: Avatar animation
- Needs active API key

**ElevenLabs** ❌
- Key found but invalid
- Used for: TTS voice synthesis
- Needs valid key

---

## 8. CLOUDFLARE WORKER FLEET

### Worker Architecture

**rotationtv-live-ai-clones** (LIVE v6.1.0)
- Entry: Base44-managed (660-line index.ts)
- Bindings: STREAM_ROOM (Durable Object), KV_SPEND, tip-queue, tip-queue-dlq
- Routes: /api/stream/*, /api/payout/*, /api/kimi/*, /api/venice/*, /api/ton/*, /api/solana/*, /api/bridge/*, /api/spend/dashboard, /api/admin/*, /api/heygen/*, /api/erotica/*
- Telegram webhooks: /telegram/webhook, /telegram/erotica/webhook

**rtv-edge-gateway** (Error 1042)
- Purpose: Unified API router for all RTV services
- Entry: workers/rtv-edge-gateway/src/index.js
- Config: workers/rtv-edge-gateway/wrangler.jsonc

**rtv-payments** (Error 1042)
- Purpose: Payment processing + payout engine
- Entry: workers/rtv-payments/src/index.js
- Secrets needed: SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY

**rtv-stream** (Error 1042)
- Purpose: Broadcast lifecycle management
- Entry: workers/rtv-stream/src/index.js
- Secrets needed: SUPABASE_SERVICE_ROLE_KEY

**rtv-blockchain** (Error 1042)
- Purpose: TON/Solana blockchain operations
- Entry: workers/rtv-blockchain/src/index.js
- Secrets needed: CHAINSTACK_TON_RPC, HELIUS_API_KEY

**rotationtv-erotica-bot** (Error 1042)
- Purpose: Adult content Telegram bot
- Entry: erotica-bot/src/index.ts
- Secrets needed: VENICE_API_KEY, TELEGRAM_BOT_TOKEN_7, SUPABASE_SERVICE_ROLE_KEY

**rotationtv-venice-ai** (Error 1042)
- Purpose: Venice AI script generation router
- Entry: workers/venice-ai-router/src/index.ts
- Secrets needed: VENICE_API_KEY

### KV Namespaces
- KV_SPEND (3542f381a0d143318f9061d32661a509) — CostGuard spend tracking

### Queues
- tip-queue (8fb801dd...) — Tip processing
- tip-queue-dlq (4177c698...) — Dead letter queue

### Durable Objects
- STREAM_ROOM — Stream room state (init, tip, end)

---

## 9. SECRET MATRIX

| Secret | Workers | Format | Status | Source |
|--------|---------|--------|--------|--------|
| CLOUDFLARE_API_TOKEN | ALL (deploy) | ~40 char | ❌ Missing Workers:Edit | dash.cloudflare.com |
| VENICE_API_KEY | main, erotica, venice-ai | sk_V2_... | ✅ Live (3 keys) | venice.ai |
| TELEGRAM_BOT_TOKEN_6 | main | digits:AAF... | ✅ Live | @BotFather |
| TELEGRAM_BOT_TOKEN_7 | erotica-bot | digits:AAF... | ✅ Live | @BotFather |
| SUPABASE_SERVICE_ROLE_KEY | main, payments, erotica | eyJ... JWT | ✅ Retrievable | Management API |
| SUPABASE_ANON_KEY | main, erotica | eyJ... JWT | ✅ Retrievable | Management API |
| SUPABASE_URL | ALL | https URL | ✅ Known | Both project URLs |
| KIMI_API_KEY | main | sk-... | ❌ Wrong format | platform.moonshot.ai |
| STRIPE_SECRET_KEY | payments | sk_live_... | ❌ Not set | dashboard.stripe.com |
| OPENAI_API_KEY | main | sk-... | ❌ Not set | platform.openai.com |
| HELIUS_API_KEY | main, blockchain | hex | ❌ Not set | helius.dev |
| CHAINSTACK_TON_RPC_V2 | main | https://... | ✅ Set | chainstack.com |
| CHAINSTACK_TON_RPC_V3 | main | https://... | ✅ Set | chainstack.com |
| REQUEST_SIGNING_SECRET | main | hex | ✅ Set | (generated) |
| GEMINI_API_KEY | (secondary) | AIza... | ✅ Live | ai.google.dev |

---

## 10. REVENUE MODEL

### 80/15/5 Split
```
Gross Payment
    ├── 80% → Creator (via Stripe Connect / PayPal / TON)
    ├── 15% → Platform (ROTATIONTVNETWORK LLC)
    └── 5%  → Agency
```

### Token Economics
- **$RTVS** — 9 decimals, TonConnect
- **Parity:** 1 RTV = $0.01 USD
- **Minting:** 1 billion RTVS minted to sovereign wallet
- **Distribution:** Faucet + Star purchases + subscriptions

### Payout Rails
| Rail | Method | Frequency |
|------|--------|-----------|
| Stripe Connect | Multiparty split | Instant |
| PayPal | Mass payout API | Weekly (Mon 9am UTC) |
| TON | Direct transfer | On-demand |
| Telegram Stars | In-app credit | Instant |

### Creator Tier Limits
| Tier | Daily RTV Spend | USD Equivalent |
|------|----------------|----------------|
| Basic | 1,000 RTV | $10/day |
| Pro | 10,000 RTV | $100/day |
| Enterprise | 50,000 RTV | $500/day |
| Unlimited | 999,999 RTV | ~$10K/day |

---

## 11. LAUNCH SEQUENCE

### Phase 1: Unblock Deployment (USER ACTION)
```
1. Go to dash.cloudflare.com/profile/api-tokens
2. Create Token → "Edit Cloudflare Workers" template
3. Account: Rotationtimmy
4. Copy the ~40 char token
5. Paste to agent
```

### Phase 2: Deploy All Workers
```bash
export CLOUDFLARE_API_TOKEN=<token>
export CLOUDFLARE_ACCOUNT_ID=947b01a53876bee16fa0e8360c880aca

# Deploy in dependency order
npx wrangler deploy --config workers/rtv-edge-gateway/wrangler.jsonc
npx wrangler deploy --config workers/rtv-payments/wrangler.jsonc
npx wrangler deploy --config workers/rtv-stream/wrangler.jsonc
npx wrangler deploy --config workers/rtv-blockchain/wrangler.jsonc
npx wrangler deploy --config workers/venice-ai-router/wrangler.toml
npx wrangler deploy --config erotica-bot/wrangler.toml
```

### Phase 3: Set Worker Secrets
```bash
# Retrieve Supabase keys
SERVICE_KEY=$(curl -s "https://api.supabase.com/v1/projects/xynkgaxfwvpcixissxdz/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.[] | select(.name=="service_role") | .api_key')

# rtv-payments
echo "$SERVICE_KEY" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config workers/rtv-payments/wrangler.jsonc
echo "sk_live_..." | npx wrangler secret put STRIPE_SECRET_KEY --config workers/rtv-payments/wrangler.jsonc

# rtv-stream
echo "$SERVICE_KEY" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config workers/rtv-stream/wrangler.jsonc

# erotica-bot
echo "$VENICE_API_KEY" | npx wrangler secret put VENICE_API_KEY --config erotica-bot/wrangler.toml
echo "$TELEGRAM_BOT_TOKEN_7" | npx wrangler secret put TELEGRAM_BOT_TOKEN --config erotica-bot/wrangler.toml
echo "$SERVICE_KEY" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config erotica-bot/wrangler.toml

# venice-ai
echo "$VENICE_API_KEY" | npx wrangler secret put VENICE_API_KEY --config workers/venice-ai-router/wrangler.toml
```

### Phase 4: Fix Supabase RLS
Run in Supabase Dashboard → SQL Editor:
```sql
DROP POLICY "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

### Phase 5: Prune Duplicate Tables
```sql
-- Migrate data
INSERT INTO rtv_ledger SELECT * FROM "RotationPay_Ledger";
INSERT INTO system_logs (event, status, created_at)
  SELECT event_type, severity, created_at FROM "Omni_Logs";

-- Drop empty duplicates
DROP TABLE "CreatorPayout";
DROP TABLE "AcademyCredit";
DROP TABLE "AgencyRoster";

-- Drop migrated
DROP TABLE "RotationPay_Ledger";
DROP TABLE "Omni_Logs";
```

### Phase 6: Seed Admin Profile
```sql
INSERT INTO profiles (id, email, full_name, role, plan, is_active)
VALUES (auth.uid(), 'rotationtimmy@gmail.com', 'Timothy Robert', 'admin', 'enterprise', true);
```

### Phase 7: Verify
```bash
curl https://rtv-payments.rotationtimmy.workers.dev/
curl https://rtv-stream.rotationtimmy.workers.dev/
curl https://rtv-blockchain.rotationtimmy.workers.dev/
curl https://rtv-edge-gateway.rotationtimmy.workers.dev/
curl https://rotationtv-erotica-bot.rotationtimmy.workers.dev/
curl https://rotationtv-venice-ai.rotationtimmy.workers.dev/
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/host-lines -X POST -d '{"hostId":"leo","context":{"mode":"cold_start"}}'
```

---

## 12. POST-LAUNCH VERIFICATION

| Check | Command | Expected |
|-------|---------|----------|
| Main worker | curl .../ | 200 + JSON status |
| Venice scripts | POST .../api/venice/host-lines | 200 + monologue text |
| Telegram bot | GET api.telegram.org/.../getMe | ok: true |
| Erotica bot | GET api.telegram.org/.../getMe | ok: true |
| Supabase profiles | SELECT * FROM profiles LIMIT 1 | 200 (no RLS 500) |
| TON RPC | POST getMasterchainInfo | result with seqno |
| Solana RPC | POST getHealth | "ok" |
| CostGuard | GET .../api/spend/dashboard | JSON with spend data |
| Stripe webhook | POST .../api/stripe/webhook | 200 |
| Stars purchase | Send /buy to bot | Invoice appears |

---

## 13. KNOWN ISSUES & FIXES

### Critical
1. **CF token missing Workers:Edit** → Create new token (Edit Cloudflare Workers template)
2. **profiles RLS infinite recursion** → Drop recursive policy, use JWT check
3. **5 duplicate PascalCase tables** → Migrate data, DROP tables

### High
4. **KIMI_API_KEY wrong format** → Get sk- key from platform.moonshot.ai
5. **STRIPE_SECRET_KEY not set** → Get from dashboard.stripe.com
6. **OPENAI_API_KEY not set** → Get from platform.openai.com
7. **HELIUS_API_KEY not set** → Get free key from helius.dev
8. **TTS not integrated** → ElevenLabs key invalid, needs replacement
9. **HeyGen not integrated** → Avatar animation stubbed

### Medium
10. **3 Telegram bots registered but no tokens** → Create via @BotFather
11. **6 workers returning Error 1042** → Redeploy with valid CF token
12. **profiles table empty** → Seed admin user after RLS fix

### Low
13. **Railway LiteLLM crashed** → Deployment crashed (berriai/litellm-database)
14. **Stripe sandbox expired** → Sandbox acct_1TLILF6uXd0gkLrQ may be deleted
15. **Git push flaky** → S3 remote occasionally rejects; fetch + rebase resolves

---

## 14. REMAINING BLOCKERS (Priority Order)

| # | Blocker | Impact | Resolution |
|---|---------|--------|------------|
| 1 | CF token missing Workers:Edit | BLOCKS ALL DEPLOYS | Create token via Edit Workers template |
| 2 | profiles RLS recursion | BLOCKS USER QUERIES | Run SQL fix in Dashboard |
| 3 | STRIPE_SECRET_KEY missing | Blocks payment processing | Get from stripe dashboard |
| 4 | OPENAI_API_KEY missing | Blocks NLP/TTS | Get from openai platform |
| 5 | HELIUS_API_KEY missing | Blocks Solana primary RPC | Get from helius.dev |
| 6 | KIMI_API_KEY wrong format | Blocks PR reviews | Get from moonshot.ai |
| 7 | ElevenLabs key invalid | Blocks TTS | Get from elevenlabs.io |
| 8 | 3 bot tokens missing | Blocks faucet/support/university | Create via @BotFather |

---

## SOURCE FILES

| File | Lines | Purpose |
|------|-------|---------|
| rotationtv/src/index.ts | 667 | Main worker entry, all API routes |
| rotationtv/src/lib/veniceGateway.ts | 713 | Venice AI pipeline, host scripts |
| rotationtv/src/lib/rotationPayWalletBot.ts | 889 | Telegram wallet bot logic |
| rotationtv/src/lib/stripePayouts.ts | 523 | 80/15/5 payout engine |
| rotationtv/src/lib/supabase.ts | 517 | Supabase client (dual architecture) |
| rotationtv/src/lib/costGuard.ts | 464 | Spend limits + circuit breaker |
| rotationtv/src/lib/solanaEngine.ts | 392 | Solana RPC failover chain |
| rotationtv/src/lib/tonTradingEngine.ts | 179 | TON trading + mining |
| rotationtv/src/lib/telegramPayments.ts | 225 | Stars invoices + subscriptions |
| rotationtv/src/broadcast/AIHostEngine.js | 170 | AI host broadcast engine |
| rotationtv/src/broadcast/AI_HOSTS_CONFIG.js | 133 | 6 host configs + handoff logic |
| rotationtv/src/broadcast/BroadcastGrid.jsx | 452 | 2×3 grid UI component |
| rotationtv/src/components/GoLiveModal.tsx | 472 | Camera + mic + live preview |
| rotationtv/src/components/LiveHostOverlay.tsx | 206 | LIVE badge + mic meter |
| rotationtv/src/workflows/CreatorPayoutWorkflow.ts | 128 | Payout workflow |
| **TOTAL** | **6,130** | Core ecosystem source |
