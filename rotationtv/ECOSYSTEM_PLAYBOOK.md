# 🎬 ROTATIONTVNETWORK LLC — ECOSYSTEM LAUNCH PLAYBOOK
> Version 6.0.0 | Presidential Authority: Darrel | June 26, 2026
> Comprehensive guide: Architecture → Secrets → Launch Sequence → Operations

---

## 1. ECOSYSTEM MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROTATIONTVNETWORK LLC                        │
│                  Presidential Authority: Darrel                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌────────────┐    ┌─────────────────┐
   │ Telegram  │    │ Cloudflare │    │   Supabase DB   │
   │ Mini App  │    │  Workers   │    │ (PostgreSQL)    │
   │ (React)   │    │  (Edge)    │    │ xynkgaxfwvpc... │
   └─────┬─────┘    └─────┬──────┘    └────────┬────────┘
         │                │                    │
         │    WebSocket   │    REST/Service     │
         └───────────────►│◄───────────────────┘
                          │
          ┌───────────────┼────────────────────┐
          ▼               ▼                    ▼
   ┌────────────┐  ┌────────────┐      ┌──────────────┐
   │ StreamRoom │  │RTVStream   │      │  Creator     │
   │ (DO + WS)  │  │Agent (DO)  │      │  Payout      │
   │ Real-time  │  │AI Moderate │      │  Workflow    │
   └────────────┘  └────────────┘      └──────────────┘
          │               │
          ▼               ▼
   ┌────────────────────────────────────────────────┐
   │              AI PROVIDER LAYER                 │
   │  OpenAI GPT-4o  │  Kimi K2.7  │  Venice AI   │
   │  (moderation,   │  (code rev, │  (uncensored, │
   │   TTS, vision)  │   analysis) │   adult 18+)  │
   └────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │         BLOCKCHAIN LAYER             │
   │  TON Network │ Solana │ ETH/ERC-20  │
   │  $RTVS Token │ 9 dec  │ TonConnect  │
   └──────────────────────────────────────┘
```

---

## 2. LIVE INFRASTRUCTURE

### Cloudflare Account
- **Account:** Rotationtimmy@gmail.com
- **Account ID:** `947b01a53876bee16fa0e8360c880aca`
- **Workers subdomain:** `rotationtimmy.workers.dev`
- **Stream subdomain:** `customer-n6iqbvyr2svw15o3.cloudflarestream.com`

### Workers (3 deployed)
| Worker | URL | Status | Purpose |
|--------|-----|--------|---------|
| `rotationtv-live-ai-clones` | https://rotationtv-live-ai-clones.rotationtimmy.workers.dev | ✅ v5 live | Main platform |
| `rtv-token-manager` | https://rtv-token-manager.rotationtimmy.workers.dev | ✅ live | Token registry |
| `rotation-erotica-app` | https://rotation-erotica-app.rotationtimmy.workers.dev | ✅ stub | Adult platform |

### Durable Objects (main worker)
| Binding | Class | Purpose |
|---------|-------|---------|
| `STREAM_ROOM` | StreamRoom | WebSocket chat rooms, tips, PK battles |
| `RTV_STREAM_AGENT` | RTVStreamAgent | AI moderation, insights, scheduling |

### Queues
| Queue | ID | Purpose |
|-------|-----|---------|
| `tip-queue` | `8fb801dd9f5e43218ed0d1edc3274d67` | Async tip processing |
| `tip-queue-dlq` | `4177c698ae1e4107b73ad2eba99627f4` | Dead letter / retry |

### KV Namespaces
| Binding | ID | Purpose |
|---------|-----|---------|
| `KV_SPEND` | `3542f381a0d143318f9061d32661a509` | Rate limits + spend tracking |
| `KV_SPEND_preview` | `8239c2789892466c9d92be6fec589453` | Local dev |

### Cloudflare Calls
| App | ID | Purpose |
|-----|-----|---------|
| `Rotation-Erotica-Cloud` | `2024532ace8ea0f84e62bc78c089784f` | WebRTC real-time video |

---

## 3. SECRETS — FULL REGISTRY

### Injected on `rotationtv-live-ai-clones` (CONFIRMED ✅)
| Secret | Status | Notes |
|--------|--------|-------|
| `KIMI_API_KEY` | ✅ Injected | Moonshot API — needs platform.moonshot.ai key |
| `VENICE_API_KEY` | ✅ Injected | `VENICE_INFERENCE_KEY_2uKg...` — NO credits yet |
| `VENICE_API_KEY_2` | ✅ Injected | `VENICE_INFERENCE_KEY_ycKi...` — backup |
| `MASTER_CF_TOKEN` | ✅ Injected | Cloudflare `cfat_LSKx...` — full account access |
| `REQUEST_SIGNING_SECRET` | ✅ Injected | HMAC-SHA256 64-char hex |

### Still Needed (BLOCKERS)
| Secret | Where to get | Inject with |
|--------|-------------|-------------|
| `OPENAI_API_KEY` | platform.openai.com → API Keys | `npx wrangler secret put OPENAI_API_KEY` |
| `SUPABASE_SERVICE_KEY` | supabase.com → Project Settings → API → service_role | `npx wrangler secret put SUPABASE_SERVICE_KEY` |
| `SUPABASE_ANON_KEY` | supabase.com → Project Settings → API → anon | `npx wrangler secret put SUPABASE_ANON_KEY` |
| `TELEGRAM_BOT_TOKEN_MAIN` | @BotFather on Telegram | `npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN` |
| `KIMI_API_KEY` (real) | platform.moonshot.ai → API Keys → starts with `sk-` | `npx wrangler secret put KIMI_API_KEY` |

### For rtv-telegram-wallet (separate deployment)
| Secret | Notes |
|--------|-------|
| `TELEGRAM_BOT_TOKEN` | Wallet bot token from @BotFather |
| `ANTHROPIC_API_KEY` | Claude for APEX AI gateway |
| `GEMINI_API_KEY_1..5` | Up to 5 keys for quota rotation |
| `SUPABASE_URL` | `https://xynkgaxfwvpcixissxdz.supabase.co` |
| `SUPABASE_KEY` | anon key |

---

## 4. CODEBASE ARCHITECTURE

### Source Files — 33 files, 5,697 lines, 225KB
```
src/
├── index.ts                    440 lines  Main Worker + all routes
├── agents/
│   ├── RTVStreamAgent.ts       400 lines  AI moderation DO
│   └── StreamRoom.ts           171 lines  WebSocket room DO
├── components/
│   ├── AgentChat.tsx           146 lines  Live AI moderation chat
│   ├── EcosystemHome.tsx        23 lines  9-company home screen
│   └── GoLiveModal.tsx         133 lines  Go live + RTMP output
├── hooks/
│   ├── useStreamAgent.ts        71 lines  WebSocket → RTVStreamAgent
│   └── useTelegram.ts            9 lines  Telegram WebApp hook
├── lib/
│   ├── costGuard.ts            464 lines  Circuit breaker + rate limiter
│   ├── kimiGateway.ts          519 lines  Kimi AI (code, analysis, hosts)
│   ├── veniceGateway.ts        557 lines  Venice AI (uncensored, 18+)
│   ├── supabase.ts             517 lines  Full Supabase client (no SDK)
│   ├── super-agent.ts          626 lines  Telegram bot (NLP, vision, TTS)
│   ├── tokenManager.ts         345 lines  CF token registry
│   ├── tonTradingEngine.ts     179 lines  TON/RTVS trading logic
│   ├── r2Storage.ts             39 lines  R2 asset helper
│   ├── analytics.ts             32 lines  Analytics Engine helper
│   └── ...6 more               ---
├── screens/                    (6 screens: Discover, Gifts, PK, Profile, Ranks, Wallet)
├── store/useStore.ts            63 lines  Zustand state
└── workflows/
    └── CreatorPayoutWorkflow.ts 128 lines  80/15/5 durable payout
```

### SQL Migrations — 793 lines total
| File | Lines | Tables |
|------|-------|--------|
| `001_initial_schema.sql` | 226 | Base users, wallets, transactions |
| `002_rotationtv_live_schema.sql` | 362 | Streams, gifts, tips, PK battles, mining, subscriptions |
| `003_security_cost_protection.sql` | 205 | creator_limits, ai_spend_log, circuit_breaker, age_verification |

---

## 5. AI PROVIDER REGISTRY

### Venice AI (Uncensored Layer)
- **Base URL:** https://api.venice.ai/api/v1
- **Key status:** Auth valid, **$0 credits** (add at https://venice.ai/settings/api)
- **Models (90 total):**

| Model | Context | Price/1M out | Use |
|-------|---------|-------------|-----|
| `venice-uncensored-1-2` | 128K | $0.90 | General uncensored |
| `venice-uncensored-role-play` | 128K | $2.00 | RotationErotica, ZARA |
| `gemma-4-uncensored` | 256K | $0.50 | Cheap uncensored |
| `e2ee-venice-uncensored-24b-p` | 32K | $1.15 | Private + E2EE |
| `qwen3-5-9b` | 256K | $0.15 | Moderation (cheapest) |
| `grok-4-20` | **2M** | $2.83 | Massive context tasks |
| `kimi-k2-7-code` | 256K | — | Code (via Venice) |
| `claude-opus-4-8` | 256K | — | Complex reasoning |

**API Routes wired:**
`/api/venice/health` · `/chat` · `/adult` (age-gated) · `/moderate` · `/zara` · `/dm` · `/prompt`

### Kimi AI (Moonshot)
- **Base URL:** https://api.moonshot.ai/v1
- **Key status:** Injected, **needs real `sk-` key** from platform.moonshot.ai
- **Models:** kimi-k2.7-code (256K) · kimi-k2.5 (256K) · moonshot-v1-128k

**API Routes wired:**
`/api/kimi/health` · `/chat` · `/review` · `/analyze` · `/host` · `/moderate`

### OpenAI (GPT-4o)
- **Key status:** NOT YET SET
- **Used for:** RTVStreamAgent moderation, TTS, vision (/face command)

### Cloudflare Workers AI (Free tier)
- **Models:** GPT-OSS-120B, Llama 3.3-70B, FLUX-2, Deepgram TTS, Whisper, Llama Guard 3-8B, MeloTTS
- **Status:** Available immediately (no key needed, billed to CF account)

---

## 6. BLOCKCHAIN + PAYMENTS

### $RTVS Token
- **Network:** TON
- **Decimals:** 9
- **Rate:** 1 RTV = $0.01 USD
- **Wallet integration:** TonConnect (Mini App)
- **Contract:** TBD (not yet deployed)

### Revenue Split (80/15/5)
- **80%** → Creator (auto-paid via CreatorPayoutWorkflow)
- **15%** → Rotationtvnetwork platform
- **5%** → Agency (if creator is agency-represented)

### Payment Rails (10 total)
| Method | Status | Notes |
|--------|--------|-------|
| TON Wallet | ✅ Wired | TonConnect, native in Mini App |
| Telegram Stars | ✅ Wired | Native Telegram payments |
| Tribute | ✅ Wired | Direct fan support |
| Stripe | ⚠️ Key needed | Web checkout |
| PayPal | ⚠️ Key needed | Web checkout |
| USDT (TON) | 🔧 Planned | Stablecoin tips |
| RTVS Token | 🔧 Planned | Native token tips |
| ETH | 🔧 Planned | wallet-adapter (Solana forks) |
| Solana | 🔧 Planned | wallet-adapter in repo |
| Mining | 🔧 Live UI | MiningScreen built |

### Subscription Plans
| Plan | Price | Access |
|------|-------|--------|
| Basic | $9.99/mo | Standard streams |
| Pro | $29.99/mo | HD + AI features |
| Enterprise | $99.99/mo | Full platform + API |

---

## 7. GITHUB REPOS

### rotationtv1-crypto org — 11 repos
| Repo | Type | Status | Key Tech |
|------|------|--------|---------|
| `RotationTV-Live-AI-Clones` | 🔒 Private | Main platform | TS, Workers, DO, Queues |
| `rtv-telegram-wallet` | 🌐 Public | ✅ Active | JS, Telegram bot, TON |
| `RotationErotica` | 🔒 Private | Stub | Next.js 14, Supabase |
| `ton-assets` | 🌐 Fork | Reference | TON token assets |
| `supabase` | 🌐 Fork | Reference | Supabase platform |
| `wallet-adapter` | 🌐 Fork | Reference | Solana wallets |
| `supabase-mcp` | 🌐 Fork | Reference | MCP connector |
| `dev-portal` | 🌐 Fork | Reference | Chainstack docs |
| `fvm-mainnet-docker` | 🌐 Fork | Reference | FVM node |
| `stuntbanana` | 🌐 Other | Unrelated | VOIP tool |

### rtv-telegram-wallet — Key files
- `src/bot/bot.js` — Telegram bot commands (/balance, /stake, /send, /receive)
- `src/lib/ai-gateway.ts` — APEX AI gateway (Anthropic + Gemini key pool rotation)
- `src/lib/supabase.js` — Wallet DB operations

---

## 8. 9-COMPANY ECOSYSTEM

From `src/lib/rtvEcosystem.ts`:

| Company | Vertical | Notes |
|---------|---------|-------|
| `rotationtv-network` | Live streaming | Main platform |
| `rotationpay` | Payments | Payment processor |
| `rotationcall` | WebRTC | Calls App (CF Calls) |
| `rtv-university` | Education | Streaming courses |
| `bigo-agency` | Talent agency | Creator management |
| `white-logistics` | Logistics | — |
| `pretrial-services` | Legal/services | — |
| `emergentlabs` | Tech lab | AI experiments |
| `openclaw` | — | — |

---

## 9. COST PROTECTION SYSTEM

### Daily Spend Limits (costGuard.ts)
| Provider | Daily Limit | Rate Limit |
|----------|------------|------------|
| Venice AI | $50 | 30 req/min (adult: 10/min) |
| Kimi AI | $25 | 30 req/min |
| OpenAI | $100 | Standard |
| Workers AI | $20 | Standard |
| **TOTAL HARD CAP** | **$175** | — |

### Creator Tier Limits (RTV/day)
| Tier | Daily RTV | USD Equiv |
|------|-----------|----------|
| basic | 1,000 | $10 |
| premium | 5,000 | $50 |
| agency | 20,000 | $200 |
| vip | 50,000 | $500 |

### Circuit Breaker
- KV_SPEND namespace tracks spend across all Worker instances
- Pre-flight check before every AI call
- Auto-blocks if daily limit would be exceeded
- SIEM events logged to Supabase `moderation_log`

---

## 10. AI BROADCAST SYSTEM

### 6 AI Hosts (2×3 Grid — LOCKED)
| # | Name | Gender | Personality | Specialty |
|---|------|--------|-------------|---------|
| 1 | LEO | Male 30s | Professional, warm, slight smirk | News, intros, transitions |
| 2 | MAYA | Female 20s | High energy, loud laugh | Hype, audience engagement |
| 3 | DR. REED | Male 40s | Measured, deep voice, thoughtful | Deep dives, tech/science |
| 4 | ZARA | Female 25s | Sarcastic, unfiltered, meme-brained | Hot takes, roasting |
| 5 | OMAR | Male 35s | Smooth, slow, stoner-wisdom | Vibe setting, transitions |
| 6 | LINA | Female 20s | Sweet, poised, natural | Interviews, reading chat |

### Handoff Logic
1. AI finishes sentence
2. Camera pulls back to full grid
3. Each AI says exit line (2s apart)
4. All wave simultaneously
5. Grid fades → dissolve to human hosts
6. Human: "Rotation TV is live — thanks for bearing with the bots!"

### Fallback Rules
- 1 human arrives → 1 AI stays to co-host (personality matched)
- No humans in 15 min → AI runs full show + disclaimer
- Connection drop → AI auto-fills "technical difficulties" mode

---

## 11. SECURITY ARCHITECTURE

### Defense Layers
```
Internet → Cloudflare DDoS/WAF → Workers Rate Limit (KV) → App Logic
```

1. **Cloudflare WAF** — DDoS, bot detection, "Under Attack" mode
2. **Rate Limiter** (RateLimiter class) — sliding window per IP + user_id via KV
3. **Cost Guard** (CostGuard class) — daily $ limits per AI provider
4. **HMAC-SHA256 signing** — admin routes require `X-Signature` + `X-Timestamp`
5. **Replay protection** — timestamps rejected if >5 minutes old
6. **Age gate** — `/api/venice/adult` requires `verified_age=true` in Supabase
7. **SIEM logging** — all events → Supabase `moderation_log` + Analytics Engine

### Domain Segregation Plan
| Domain | Purpose | Protection |
|--------|---------|-----------|
| `app.rotationtv.network` | Creator dashboard | Cloudflare Access SSO |
| `api.rotationtv.network` | API endpoints | WAF + rate limits |
| `cdn.rotationtv.network` | R2 content CDN | Cache rules |

---

## 12. LAUNCH SEQUENCE — ORDERED CHECKLIST

### PHASE 1: Immediate (< 30 minutes)

**Step 1 — Create KV namespace and update wrangler.jsonc**
```bash
cd rotationtv
npx wrangler kv:namespace create "KV_SPEND"
# Update wrangler.jsonc with returned ID (already done in workspace)
```

**Step 2 — Deploy v6.0.0**
```bash
cd rotationtv
npm install
npx wrangler deploy
```
→ Pushes: Kimi routes, Venice routes, cost guard, rate limiter, HMAC admin, v6.0.0 version string

**Step 3 — Verify deploy**
```bash
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/
# Expect: {"version":"6.0.0",...}

curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health
# Expect: {"status":"key_set",...} or {"status":"connected",...}

curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health
# Expect: {"status":"key_set","total_models_available":90,...}
```

**Step 4 — Add Venice credits**
→ https://venice.ai/settings/api → Add balance ($10 minimum)
→ Venice becomes fully live instantly

---

### PHASE 2: Core Secrets (< 1 hour)

**Step 5 — OpenAI API key**
```bash
npx wrangler secret put OPENAI_API_KEY
# Get from: platform.openai.com/api-keys
```

**Step 6 — Kimi API key (real sk- key)**
```bash
npx wrangler secret put KIMI_API_KEY
# Get from: platform.moonshot.ai → API Keys
# Format: sk-XXXXXXXXXXXXXXXXXXXXXXXXX
```

**Step 7 — Supabase keys**
```bash
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put SUPABASE_ANON_KEY
# Get from: app.supabase.com → xynkgaxfwvpcixissxdz → Settings → API
```

**Step 8 — Telegram bot token**
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
# Get from: @BotFather → /newbot or /token
```

---

### PHASE 3: Database (< 30 minutes)

**Step 9 — Run Supabase migrations**
```
1. Go to: app.supabase.com → xynkgaxfwvpcixissxdz → SQL Editor
2. Run in order:
   → supabase/migrations/001_initial_schema.sql
   → supabase/migrations/002_rotationtv_live_schema.sql
   → supabase/migrations/003_security_cost_protection.sql
3. Enable extensions:
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   SELECT cron.schedule('reset-creator-limits', '0 0 * * *', 'SELECT reset_daily_creator_limits()');
   SELECT cron.schedule('cleanup-rl-events', '0 * * * *', 'SELECT cleanup_rate_limit_events()');
```

---

### PHASE 4: Infrastructure (< 2 hours)

**Step 10 — Enable R2**
→ https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/r2
→ Get Started → Create bucket: `rtv-assets`

**Step 11 — Enable Analytics Engine**
→ https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/workers/analytics-engine

**Step 12 — GitHub Actions secrets**
```
github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones
→ Settings → Secrets → Actions → New repository secret:
  CLOUDFLARE_API_TOKEN  = cfat_LSKx... (TOKEN_2)
  CLOUDFLARE_ACCOUNT_ID = 947b01a53876bee16fa0e8360c880aca
  OPENAI_API_KEY        = sk-...
  KIMI_API_KEY          = sk-...
```

**Step 13 — Push code to GitHub**
```bash
cd rotationtv
git init  # if not already
git remote add origin https://github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones.git
git add .
git commit -m "feat: v6.0.0 — full production build with Kimi/Venice/CostGuard"
git push origin main
# → Triggers GitHub Actions deploy.yml automatically
```

---

### PHASE 5: Launch (< 1 day)

**Step 14 — Deploy rtv-telegram-wallet**
```bash
git clone https://github.com/rotationtv1-crypto/rtv-telegram-wallet
cd rtv-telegram-wallet
cp .env.example .env
# Fill in: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY
npm install
npm start
# Or deploy to Railway/Render for persistent hosting
```

**Step 15 — Wire Telegram Mini App**
```
1. @BotFather → /newapp or link existing bot
2. Set Mini App URL to: https://rotationtv-live-ai-clones.rotationtimmy.workers.dev
3. Test: Open Mini App in Telegram → should load React app
```

**Step 16 — Test end-to-end flow**
```
1. Open Telegram → find bot → /start
2. Open Mini App → should show Home screen (6 AI hosts grid)
3. Tap Go Live → GoLiveModal opens
4. Create test stream → StreamRoom DO initializes
5. Send test tip → queued → processed → payout triggered
6. Check Supabase → confirm records in streams + tips tables
7. Check KV_SPEND → confirm rate limit tracking active
8. Hit /api/spend/dashboard → confirm cost guard working
```

---

## 13. MONITORING + OPERATIONS

### Health Check Endpoints
```bash
# Main worker
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/

# AI layer
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health

# Token manager
curl https://rtv-token-manager.rotationtimmy.workers.dev/
curl https://rtv-token-manager.rotationtimmy.workers.dev/capabilities

# Spend dashboard (requires HMAC signature)
TS=$(date +%s)
SIG=$(echo -n "${TS}:dashboard" | openssl dgst -sha256 -hmac "$REQUEST_SIGNING_SECRET" | awk '{print $2}')
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/spend/dashboard \
  -H "X-Signature: $SIG" -H "X-Timestamp: $TS"
```

### Key Metrics to Watch
- Daily AI spend (Venice + Kimi + OpenAI) vs $175 limit
- Rate limit hits per hour (abnormal = bot/abuse)
- Tip queue depth (tip-queue consumer lag)
- Supabase DB connections
- Cloudflare Stream concurrent inputs

### Incident Runbook
| Alert | Action |
|-------|--------|
| Venice 402 errors | Check balance at venice.ai/settings/api |
| Kimi 401 errors | Rotate KIMI_API_KEY |
| Spend > 80% | Review ai_spend_log, throttle non-critical routes |
| Rate limit spike | Enable Cloudflare "Under Attack" mode |
| Queue DLQ filling | Check PAYOUT_ENGINE_URL connectivity |

---

## 14. BLOCKERS SUMMARY

| # | Blocker | Time to Fix | Impact |
|---|---------|------------|--------|
| 1 | `wrangler deploy` (v6.0.0 not live) | 2 min | Kimi/Venice routes 404 |
| 2 | Venice credits = $0 | 2 min | No uncensored AI |
| 3 | OPENAI_API_KEY missing | 5 min | No moderation/TTS/vision |
| 4 | KIMI_API_KEY (real sk- key) | 5 min | No code review |
| 5 | SUPABASE_SERVICE_KEY missing | 5 min | No DB write from worker |
| 6 | TELEGRAM_BOT_TOKEN missing | 5 min | No bot commands |
| 7 | R2 bucket not enabled | 10 min | No asset storage |
| 8 | Supabase migrations not run | 20 min | No schema |
| 9 | GitHub Actions secrets missing | 10 min | No CI/CD push |

**Minimum to go live:** Blockers 1 + 2 = 4 minutes total.
Everything else is additive.

---

## 15. QUICK REFERENCE

| Item | Value |
|------|-------|
| Main worker URL | https://rotationtv-live-ai-clones.rotationtimmy.workers.dev |
| Token manager URL | https://rtv-token-manager.rotationtimmy.workers.dev |
| Supabase project | https://xynkgaxfwvpcixissxdz.supabase.co |
| CF Account ID | `947b01a53876bee16fa0e8360c880aca` |
| CF Stream subdomain | `customer-n6iqbvyr2svw15o3.cloudflarestream.com` |
| CF Calls App ID | `2024532ace8ea0f84e62bc78c089784f` |
| KV_SPEND ID | `3542f381a0d143318f9061d32661a509` |
| Tip queue ID | `8fb801dd9f5e43218ed0d1edc3274d67` |
| GitHub org | https://github.com/rotationtv1-crypto |
| Venice dashboard | https://venice.ai/settings/api |
| Kimi dashboard | https://platform.moonshot.ai |
| R2 activation | https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/r2 |
| Analytics Engine | https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/workers/analytics-engine |

---


---

## 16. BLOCKCHAIN LAYER — SOLANA + TON + BRIDGE

### Primary Chain: Solana
- **RPC Chain:** Helius → QuickNode → Alchemy → public.mainnet (auto-failover)
- **Key actions:** SOL balance, SPL token balances, transaction history, USDC verify, NFT gate
- **USDC mint:** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **USDT mint:** `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

**API Routes:** `/api/solana/health` · `/balance` · `/history` · `/tx` · `/verify-payment` · `/nft-gate`

### Secondary Chain: TON
- **Native token:** $RTVS (9 decimals, TonConnect wallet)
- **API:** tonapi.io v2 for jetton data, transactions, pricing
- **API Routes:** `/api/ton/metrics` · `/mine` · `/leaderboard` · `/pairs` · `/trade` · `/pools` · `/orderbook`

### Cross-Chain Bridge: Symbiosis Finance
- **Supported pairs:** TON/SOL · SOL/TON · USDC/TON · SOL/USDT · TON/USDT
- **Method:** Atomic cross-chain swaps (no wrapped tokens)
- **Time:** ~30-60 seconds
- **Slippage:** 3% tolerance (300 bps)
- **API Routes:** `/api/bridge/health` · `/pairs` · `/quote` · `/status`

### New Files Added
| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/solanaEngine.ts` | 393 | Solana RPC failover, balances, verify, NFT gate |
| `src/lib/crossChainBridge.ts` | 308 | Symbiosis bridge integration, creator payout |

### Secrets Needed for Blockchain Layer
```bash
npx wrangler secret put HELIUS_API_KEY       # helius.dev — free tier available
npx wrangler secret put RTVS_MINT_SOLANA     # RTVS SPL token mint address
npx wrangler secret put PLATFORM_WALLET_SOL  # Solana treasury wallet
npx wrangler secret put PLATFORM_WALLET_TON  # TON treasury wallet
# Optional:
npx wrangler secret put QUICKNODE_RPC        # QuickNode Solana RPC URL
npx wrangler secret put SYMBIOSIS_API_KEY    # Symbiosis has free tier — optional
```

---

*ECOSYSTEM_PLAYBOOK.md updated v6.1.0 — Solana + Bridge layer added*

*Rotationtvnetwork LLC | ECOSYSTEM_PLAYBOOK.md v6.1.0 | Presidential Authority: Darrel | June 26, 2026*
