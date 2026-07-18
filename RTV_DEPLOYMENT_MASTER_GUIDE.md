# ROTATIONTV NETWORK — DEPLOYMENT MASTER PLAYBOOK (2026-07-16)
## Definitive Production Deployment & Secret Management Guide
### "Learn it. Live it. Love it. — We keep business rotating globally."

---

## 1. WORKER INVENTORY
Every active Cloudflare Worker in the RotationTV Ecosystem, including entry points, bindings, build commands, and target deploy states.

| Worker Name | Workspace Path | Entry Point | Required Secrets | Bindings (KV, D1, DO) | Deploy Command | Current Live Status |
|---|---|---|---|---|---|---|
| **rtv-edge-gateway** | `/app/workers/rtv-edge-gateway` | `src/index.js` | `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `VENICE_API_KEY`, `KIMI_API_KEY` | None | `wrangler deploy --config wrangler.jsonc` | Deployed & Routing (`rtv-edge-gateway.rotationtvaicom.workers.dev`) |
| **rtv-payments** | `/app/workers/rtv-payments` | `src/index.js` | `TELEGRAM_BOT_TOKEN` | None | `wrangler deploy --config wrangler.jsonc` | Deployed (`rtv-payments.rotationtvaicom.workers.dev`) |
| **rtv-blockchain** | `/app/workers/rtv-blockchain` | `src/index.js` | `TON_RPC_ENDPOINT`, `SOLANA_RPC_ENDPOINT` | None | `wrangler deploy --config wrangler.jsonc` | Deployed (`rtv-blockchain.rotationtvaicom.workers.dev`) |
| **rtv-stream** | `/app/workers/rtv-stream` | `src/index.js` | `CLOUDFLARE_STREAM_TOKEN` (alias: `CF_STREAM_TOKEN`) | None | `wrangler deploy --config wrangler.jsonc` | Deployed (`rtv-stream.rotationtvaicom.workers.dev`) |
| **rotationtv-venice-ai** | `/app/workers/venice-ai-router` | `src/index.ts` | `VENICE_API_KEY`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | None | `wrangler deploy --config wrangler.toml` | Needs Deploy / Key Update |
| **rotationtv-erotica-bot** | `/app/erotica-bot` | `src/index.ts` | `VENICE_API_KEY`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN` | `RATE_LIMIT_KV` (KVNamespace) | `wrangler deploy --config wrangler.toml` | Needs Deploy / Key Update |

---

## 2. SECRET MATRIX
Comprehensive registry of all environment secrets across the ecosystem.

| Secret Name | Consuming Workers / Services | Format / Expected Syntax | Status | Source / Where to Retrieve |
|---|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `rtv-edge-gateway`, `rtv-payments`, `venice-ai-router`, `erotica-bot`, `rtv-telegram-wallet` (Express) | `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ` | 🟡 EXPIRED (Needs Regen) | Contact `@BotFather` on Telegram |
| `VENICE_API_KEY` | `rtv-edge-gateway`, `venice-ai-router`, `erotica-bot`, `rtv-telegram-wallet` (React Frontend) | `v-api-key_...` | 🟢 SET ($0 balance) | Venice AI Console (`venice.ai/settings/api`) |
| `SUPABASE_URL` | `venice-ai-router`, `erotica-bot`, `rtv-telegram-wallet` (Express & React) | `https://<project-id>.supabase.co` | 🟢 SET (`xynkgaxfwvpcixissxdz`) | Supabase Settings → API |
| `SUPABASE_SERVICE_KEY` (alias: `SUPABASE_SECRET_KEY`) | `venice-ai-router`, `erotica-bot`, `rtv-telegram-wallet` (Express) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT) | 🔴 MISSING (Critical Blocker) | Supabase Settings → API (Service Role Key) |
| `SUPABASE_ANON_KEY` | `erotica-bot`, `rtv-telegram-wallet` (React Frontend) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT) | 🟢 SET | Supabase Settings → API (Anon Key) |
| `ANTHROPIC_API_KEY` (alias: `ANTHROPIC_API_KEY_LIVE`) | `rtv-edge-gateway`, `rtv-telegram-wallet` (Express) | `sk-ant-api03-...` | 🟢 SET | Anthropic Console (`console.anthropic.com`) |
| `GEMINI_API_KEY` | `rtv-edge-gateway`, `rtv-telegram-wallet` (Express) | `AIzaSy...` (39 chars) | 🟢 SET (Pool keys 1-5 support) | Google AI Studio (`aistudio.google.com`) |
| `KIMI_API_KEY` | `rtv-edge-gateway` | Platform key format | 🔴 INVALID | Moonshot AI Developer Console |
| `CLOUDFLARE_STREAM_TOKEN` (alias: `CF_STREAM_TOKEN`) | `rtv-stream`, `erotica-bot` | Cloudflare API Token | 🔴 MISSING (Critical Blocker) | Cloudflare Profile → API Tokens → Account: Stream: Edit |
| `CF_ACCOUNT_ID` | `erotica-bot` | `7e431c541ea0f39d7f7fe5fd9f06eada` | 🟢 SET | Cloudflare Dashboard |
| `TON_RPC_ENDPOINT` | `rtv-blockchain`, `rtv-edge-gateway` | URL | 🟢 SET | Chainstack TON Endpoint (v3 Mainnet) |
| `SOLANA_RPC_ENDPOINT` (alias: `SOLANA_RPC`) | `rtv-blockchain`, `rtv-edge-gateway` | URL | 🟢 SET | Chainstack Solana Endpoint |

---

## 3. DEPENDENCY GRAPH
The conceptual architecture and flow of interactions showing downstream consumer dependencies.

```
                    ┌─────────────────────────┐
                    │  Telegram Bot Platform  │
                    │   (User Entry Point)    │
                    └────────────┬────────────┘
                                 │ Webhooks / API
                                 ▼
                    ┌─────────────────────────┐
                    │   rtv-edge-gateway      │
                    │   (Unified Router)      │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ rtv-payments  │           │  rtv-stream   │           │rtv-blockchain │
└──────┬────────┘           └──────┬────────┘           └──────┬────────┘
       │                           │                           │
       ├─► Stars (Telegram)        ├─► CF Stream Live Ingest   ├─► TON (Chainstack)
       ├─► TON Jetton ($RTV)       ├─► CF R2 Storage           └─► Solana Nodes
       └─► Internal RTV (Supabase) └─► Tribute / CCBill
                                   │
                                   ▼
                            ┌───────────────┐
                            │   Supabase    │
                            │ (PostgreSQL)  │
                            └───────────────┘
                                   ▲
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
     ┌─────────────────┐                       ┌─────────────────┐
     │erotica-bot (CF) │                       │venice-ai-router │
     └────────┬────────┘                       └────────┬────────┘
              │                                         │
              └──────────────────┬──────────────────────┘
                                 ▼
                          ┌───────────────┐
                          │   Venice AI   │
                          │ (Uncensored)  │
                          └───────────────┘
```

---

## 4. STEP-BY-STEP DEPLOYMENT SEQUENCE

Execute deployment in the following strict order to ensure configurations, routing networks, and database entries connect perfectly.

### Step 1: Revoke and Provision New Telegram Bot Tokens
If tokens have expired, obtain fresh ones from `@BotFather`.
Set up 4 bots:
1. `@Rotationtv_Bot` (Main mini app gateway)
2. `@Rotationwindows_bot` (Desktop emulator)
3. `@Rotationtvnetwork_bot` (Admin/DevSecOps console)
4. `@RotationtvErotica_Bot` (AI Avatar Designer)

### Step 2: Inject Global and Worker Secrets
Navigate to each worker directory and set secrets:

```bash
# 1. Edge Gateway
cd /app/workers/rtv-edge-gateway
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put VENICE_API_KEY

# 2. Payments Gate
cd /app/workers/rtv-payments
wrangler secret put TELEGRAM_BOT_TOKEN

# 3. Blockchain Gate
cd /app/workers/rtv-blockchain
wrangler secret put TON_RPC_ENDPOINT
wrangler secret put SOLANA_RPC_ENDPOINT

# 4. Live Stream Engine
cd /app/workers/rtv-stream
wrangler secret put CLOUDFLARE_STREAM_TOKEN

# 5. Venice AI Webhook Router
cd /app/workers/venice-ai-router
wrangler secret put VENICE_API_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY

# 6. Erotica Bot Worker
cd /app/erotica-bot
wrangler secret put VENICE_API_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put CF_STREAM_TOKEN
```

### Step 3: Trigger Cloudflare Workers Builds & Deployment
Deploy the primary network stack first, followed by downstream sub-workers.

```bash
# Deploys Gateway, Payments, and Blockchain workers in sequence
cd /app
npm run deploy:all

# Deploy Live Stream worker
cd /app/workers/rtv-stream
wrangler deploy --config wrangler.jsonc

# Deploy Venice Router
cd /app/workers/venice-ai-router
wrangler deploy --config wrangler.toml

# Deploy Erotica Bot
cd /app/erotica-bot
wrangler deploy --config wrangler.toml
```

### Step 4: Map Bot Webhooks to Live Workers
Run webhook initialization requests to register bot tokens with Telegram's routing system:

```bash
# Connect @ROTATIONEROTICA_BOT to the erotica bot worker
curl -X POST "https://api.telegram.org/bot<EROTICA_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rotationtv-erotica-bot.rotationtvaicom.workers.dev/"}'

# Connect @Rotationtv_Bot to the Venice router / edge gateway
curl -X POST "https://api.telegram.org/bot<MAIN_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rotationtv-venice-ai.rotationtvaicom.workers.dev/"}'
```

---

## 5. POST-DEPLOYMENT VERIFICATION

Confirm each endpoint responds correctly using standard HTTP validation:

### 1. Edge Gateway `/health` Verification
```bash
curl -i https://rtv-edge-gateway.rotationtvaicom.workers.dev/health
```
*Expected response:* HTTP 200 OK with `{"status":"healthy","version":"3.0.0"}`

### 2. Edge Gateway Payments Integration
```bash
curl -i https://rtv-edge-gateway.rotationtvaicom.workers.dev/api/pay/rails
```
*Expected response:* HTTP 200 OK showing Telegram Stars, TON, and internal RTV; Stripe marked as purged (HTTP 410).

### 3. Edge Gateway AI Capabilities
```bash
curl -i https://rtv-edge-gateway.rotationtvaicom.workers.dev/api/ai/providers
```
*Expected response:* JSON mapping Anthropic (active), Gemini (active), and Venice (pending credits).

### 4. Payments Worker Failsafe Test (Stripe Purge Confirm)
```bash
curl -i https://rtv-payments.rotationtvaicom.workers.dev/stripe
```
*Expected response:* HTTP 410 GONE.

### 5. Blockchain Gateway Verification
```bash
curl -i https://rtv-blockchain.rotationtvaicom.workers.dev/health
```
*Expected response:* HTTP 200 OK with `{"status":"healthy","networks":{"ton":"primary","solana":"secondary"}}`.

### 6. Streaming Worker Verification
```bash
curl -i https://rtv-stream.rotationtvaicom.workers.dev/health
```
*Expected response:* HTTP 200 OK containing active features list and RTV/USD parity value (`1 RTV = 0.01 USD`).

---

## 6. REMAINING BLOCKERS & RESOLUTION STEPS

### Blocker 1: Missing `SUPABASE_SERVICE_KEY`
* **Impact:** DB queries failing. Workers (`erotica-bot`, `venice-ai-router`) cannot write transaction state, audit logs, or session records to Supabase.
* **Resolution Steps:**
  1. Access the Supabase Console for Project `xynkgaxfwvpcixissxdz`.
  2. Go to **Settings** → **API**.
  3. Copy the **Service Role JWT** (`service_role` secret).
  4. Inject the token immediately into `erotica-bot`, `venice-ai-router`, and `/app/src/lib/supabase.js` (`SUPABASE_SECRET_KEY`).

### Blocker 2: Missing `CLOUDFLARE_STREAM_TOKEN`
* **Impact:** WHIP/WHEP stream generation endpoints fail. Live streaming remains completely disabled.
* **Resolution Steps:**
  1. Log into the Cloudflare Dashboard.
  2. Navigate to **My Profile** → **API Tokens** → **Create Token** → **Custom Token**.
  3. Grant the token permission: **Account** → **Stream** → **Edit**.
  4. Save and set this token as the `CLOUDFLARE_STREAM_TOKEN` secret in the `rtv-stream` and `erotica-bot` workers.

### Blocker 3: Expired Telegram Bot Tokens
* **Impact:** `@Rotationtv_Bot`, `@ROTATIONEROTICA_BOT`, and `@RotationPayBot` are offline and refuse webhook mapping.
* **Resolution Steps:**
  1. Message `@BotFather` on Telegram.
  2. Select `/revoke` for each bot to reset their authorization tokens.
  3. Run `/token` to grab fresh strings.
  4. Ingress those tokens into Cloudflare Secrets immediately.

### Blocker 4: Venice AI Balance Exhaustion ($0.00)
* **Impact:** AI image creation and Uncensored Chat models refuse requests with 402/429 limits.
* **Resolution Steps:**
  1. Log into [venice.ai/settings/api](https://venice.ai/settings/api).
  2. Top up account balance (minimum $10 recommended).
