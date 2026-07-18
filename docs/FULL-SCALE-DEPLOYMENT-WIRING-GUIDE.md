# RotationTV — Full Scale Deployment Wiring Guide
**Version:** 7.1.0 | **Date:** July 17, 2026 | **Org:** ROTATIONTVNETWORK LLC

---

## TABLE OF CONTENTS
1. Current System State (Verified)
2. What's Live vs What's Blocked
3. Secret Injection Sequence
4. Worker Deployment Sequence
5. Supabase Fix Sequence
6. Telegram Bot Rewiring
7. Tribute Payment Activation
8. Post-Deploy Verification Checklist
9. Emergency Rollback
10. Architecture Diagram

---

## 1. CURRENT SYSTEM STATE (Verified July 17, 2026)

### Codebase
- **52 source files**, **12,844 lines** total
- **Version:** 6.2.0 (index.ts includes Tribute integration)
- **Git:** S3-backed repo, all commits pushed
- **Latest commit:** f40b3b2f (Tribute payment integration)

### Live Infrastructure

| Component | Status | Detail |
|-----------|--------|--------|
| rotationtv-live-ai-clones | ✅ LIVE | v6.1.0, 9 endpoints active |
| rtv-payments | ⚠️ Error 1042 | Stale code, needs redeploy |
| rtv-stream | ⚠️ Error 1042 | Stale code, needs redeploy |
| rtv-blockchain | ⚠️ Error 1042 | Stale code, needs redeploy |
| rtv-edge-gateway | ⚠️ Error 1042 | Stale code, needs redeploy |
| rotationtv-erotica-bot | ⚠️ Error 1042 | Stale code, needs redeploy |
| rotationtv-venice-ai | ⚠️ Error 1042 | Stale code, needs redeploy |

### Supabase (Main: xynkgaxfwvpcixissxdz)
- **72 tables** — ALL have RLS enabled ✅
- **72 tables** — ALL have policies ✅
- **0 tables** without policies ✅
- **profiles RLS recursion** — Still active (Fix 1 below)
- **Tables with data:** system_logs (642), Omni_Logs (9), RotationPay_Ledger (6), telegram_bots (3), wallets (1), rtv_wallets (1)
- **Pro plan** ($25/mo), PostgreSQL 17

### Telegram Bots
| Bot | Status | Webhook |
|-----|--------|---------|
| @base44_229784_bot (TOKEN_6) | ✅ ALIVE | /telegram/webhook |
| @RotationtvErotica_Bot (TOKEN_7) | ✅ ALIVE | /telegram/erotica/webhook |
| @RTVFaucetBot | Registered, no token | — |
| @RTVSupportBot | Registered, no token | — |
| @RTVUniversityBot | Registered, no token | — |
| All other tokens | DEAD/COMPROMISED | REVOKE via @BotFather |

### AI Providers
| Provider | Status | Models | Daily Limit |
|----------|--------|--------|-------------|
| Venice AI | ✅ 3 live keys | 99 models | $50/day |
| Gemini | ✅ 2 live keys | 50 models each | — |
| Kimi AI | ❌ Wrong format | — | $25/day |
| OpenAI | ❌ Not set | — | $100/day |
| Workers AI | ✅ Available | Built-in | $20/day |
| **Total cap** | | | **$175/day** |

---

## 2. WHAT'S LIVE vs WHAT'S BLOCKED

### ✅ LIVE RIGHT NOW
- Main worker (rotationtv-live-ai-clones) serving 9 API endpoints
- Venice AI generating 6 host broadcast scripts
- Gemini as secondary AI (50 models)
- Both Telegram bots responding to messages
- Supabase storing data (642 log entries, 3 bot configs, wallet data)
- Tribute webhook handler code (committed, needs deploy)

### ❌ BLOCKED BY CF TOKEN
The Cloudflare API token is the SINGLE GATE for:
1. Deploying updated index.ts (v6.2.0 with Tribute routes)
2. Redeploying 6 broken workers (Error 1042)
3. Setting worker secrets (SUPABASE_SERVICE_ROLE_KEY, TRIBUTE_API_KEY, etc.)
4. Pushing the null guard fix to the main bot webhook

### 🔧 FIXABLE NOW (No CF token needed)
1. Run Supabase RLS fix (SQL Editor in dashboard)
2. Prune duplicate PascalCase tables
3. Seed admin profile
4. Register new Telegram bot tokens via @BotFather
5. Get Tribute API key from Creator Dashboard

---

## 3. SECRET INJECTION SEQUENCE

Once you have a valid CF token, run these in order:

```bash
# ════════════════════════════════════════════
# STEP 0: Set environment
# ════════════════════════════════════════════
export CLOUDFLARE_API_TOKEN=<your_new_token>
export CLOUDFLARE_ACCOUNT_ID=947b01a53876bee16fa0e8360c880aca

# ════════════════════════════════════════════
# STEP 1: Retrieve Supabase service_role key
# ════════════════════════════════════════════
SERVICE_KEY=$(curl -s \
  "https://api.supabase.com/v1/projects/xynkgaxfwvpcixissxdz/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq -r '.[] | select(.name=="service_role") | .api_key')

ANON_KEY=$(curl -s \
  "https://api.supabase.com/v1/projects/xynkgaxfwvpcixissxdz/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq -r '.[] | select(.name=="anon") | .api_key')

# ════════════════════════════════════════════
# STEP 2: Inject secrets to main worker
# ════════════════════════════════════════════
cd rotationtv

# Supabase
echo "$SERVICE_KEY" | npx wrangler secret put SUPABASE_SERVICE_KEY
echo "$ANON_KEY" | npx wrangler secret put SUPABASE_ANON_KEY

# Telegram
echo "8620919936:AA..." | npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN

# Tribute
echo "trbt_..." | npx wrangler secret put TRIBUTE_API_KEY

# Chainstack (already set, verify)
echo "$CHAINSTACK_TON_RPC_V2" | npx wrangler secret put CHAINSTACK_TON_RPC_V2
echo "$CHAINSTACK_TON_RPC_V3" | npx wrangler secret put CHAINSTACK_TON_RPC_V3

# Venice (verify, already set)
echo "$VENICE_API_KEY" | npx wrangler secret put VENICE_API_KEY

# ════════════════════════════════════════════
# STEP 3: Inject remaining secrets (when available)
# ════════════════════════════════════════════
# echo "sk-..." | npx wrangler secret put OPENAI_API_KEY
# echo "sk-..." | npx wrangler secret put KIMI_API_KEY
# echo "sk_live_..." | npx wrangler secret put STRIPE_SECRET_KEY
# echo "..." | npx wrangler secret put HELIUS_API_KEY
```

---

## 4. WORKER DEPLOYMENT SEQUENCE

```bash
# ════════════════════════════════════════════
# PHASE 1: Deploy main worker (rotationtv-live-ai-clones)
# ════════════════════════════════════════════
cd rotationtv
npx wrangler deploy

# This deploys:
# - 698-line index.ts with all routes including Tribute
# - 6 AI host configurations
# - Stream rooms (Durable Objects)
# - Creator payout workflow
# - Telegram webhooks (main + erotica)
# - Venice AI gateway
# - Solana failover engine
# - CostGuard middleware
# - Tribute webhook handler

# ════════════════════════════════════════════
# PHASE 2: Verify main worker
# ════════════════════════════════════════════
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/
# Expected: { "status": "ok", "version": "6.2.0", ... }

curl -X POST https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/host-lines \
  -H "Content-Type: application/json" \
  -d '{"hostId":"leo","context":{"mode":"cold_start"}}'
# Expected: { "lines": "..." }

# ════════════════════════════════════════════
# PHASE 3: Deploy satellite workers (when ready)
# ════════════════════════════════════════════
# These require their own wrangler configs and secrets

# rtv-payments
# npx wrangler deploy --config workers/rtv-payments/wrangler.jsonc
# Secrets: SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY

# rtv-stream
# npx wrangler deploy --config workers/rtv-stream/wrangler.jsonc
# Secrets: SUPABASE_SERVICE_KEY

# rtv-blockchain
# npx wrangler deploy --config workers/rtv-blockchain/wrangler.jsonc
# Secrets: CHAINSTACK_TON_RPC_V2, CHAINSTACK_TON_RPC_V3, HELIUS_API_KEY
```

---

## 5. SUPABASE FIX SEQUENCE

Run in Supabase Dashboard → SQL Editor (project: xynkgaxfwvpcixissxdz):

### Step 1: Fix profiles RLS recursion
```sql
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'user_role' = 'admin'
  );
```

### Step 2: Create SECURITY DEFINER function
```sql
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = user_id;
$$;
```

### Step 3: Prune duplicate tables
```sql
-- Verify empty first:
SELECT COUNT(*) FROM "CreatorPayout"; -- 0
SELECT COUNT(*) FROM "AcademyCredit"; -- 0
SELECT COUNT(*) FROM "AgencyRoster"; -- 0

-- Drop empty
DROP TABLE IF EXISTS "CreatorPayout" CASCADE;
DROP TABLE IF EXISTS "AcademyCredit" CASCADE;
DROP TABLE IF EXISTS "AgencyRoster" CASCADE;

-- Migrate data from non-empty duplicates
INSERT INTO rtv_ledger (user_id, amount, asset, status, message, metadata, created_at)
SELECT user_id::text, amount, asset, status, message, metadata, created_at
FROM "RotationPay_Ledger"
ON CONFLICT DO NOTHING;

INSERT INTO system_logs (event, status, metadata, created_at)
SELECT event_type, severity, payload::jsonb, created_at
FROM "Omni_Logs"
ON CONFLICT DO NOTHING;

-- Then drop
DROP TABLE IF EXISTS "RotationPay_Ledger" CASCADE;
DROP TABLE IF EXISTS "Omni_Logs" CASCADE;
```

### Step 4: Seed admin profile + auto-trigger
```sql
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan, is_active)
  VALUES (NEW.id, NEW.email, 'user', 'free', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Full SQL file:** `rotationtv/supabase/migrations/006_rls_fix_and_cleanup.sql`

---

## 6. TELEGRAM BOT REWIRING

### Active Bots (No Action Needed)
- @base44_229784_bot — ALIVE, webhook set
- @RotationtvErotica_Bot — ALIVE, webhook set

### Bots Needing Fresh Tokens
```bash
# 1. Open @BotFather in Telegram
# 2. Send /revoke to revoke compromised tokens
# 3. Send /newbot to create new tokens for:
#    - @RTVFaucetBot (faucet)
#    - @RTVSupportBot (support)
#    - @RTVUniversityBot (university)
# 4. Copy new tokens and provide to agent
```

### Set Webhooks (After Deploy)
```bash
# Main bot
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_6}/setWebhook" \
  -d "url=https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/webhook"

# Erotica bot
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_7}/setWebhook" \
  -d "url=https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/erotica/webhook"

# Set menu buttons
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_6}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button":{"type":"web_app","text":"🔴 Open RotationTV","web_app":{"url":"https://rotationtv-live-ai-clones.rotationtimmy.workers.dev"}}}'

curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_7}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button":{"type":"web_app","text":"🔴 RotationTV Erotica","web_app":{"url":"https://rotationtv-live-ai-clones.rotationtimmy.workers.dev"}}}'
```

---

## 7. TRIBUTE PAYMENT ACTIVATION

### Step 1: Get API Key
1. Go to https://tribute.tg (Tribute Creator Dashboard)
2. Settings (⋯ menu) → API Keys
3. Generate API key
4. Copy the key

### Step 2: Set Webhook URL
In Tribute Dashboard → Webhook settings:
```
https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/tribute/webhook
```

### Step 3: Inject Secret to Worker
```bash
echo "trbt_..." | npx wrangler secret put TRIBUTE_API_KEY
```

### Step 4: Deploy
```bash
npx wrangler deploy
```

### Step 5: Test
```bash
# Verify route exists
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/tribute/subscriptions
# Should return your Tribute subscription tiers

# List orders
curl "https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/tribute/orders?limit=10"
```

### Tribute Webhook Flow
```
Tribute Payment Event
    ↓
POST /api/tribute/webhook
    ↓
HMAC-SHA256 Verification (trbt-signature header)
    ↓
Event Router (10 event types)
    ↓
Supabase Insert (payments, creator_subscriptions, creator_revenue, content_access)
    ↓
80/15/5 Revenue Split Applied
    ↓
Return 200 OK
```

---

## 8. POST-DEPLOY VERIFICATION CHECKLIST

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 1 | Main worker health | `curl .../ ` | status: ok, version: 6.2.0 |
| 2 | Tribute route | `curl .../api/tribute/subscriptions` | JSON with tiers |
| 3 | Venice host gen | `POST .../api/venice/host-lines` | 200 + monologue |
| 4 | Main bot alive | `GET api.telegram.org/.../getMe` | ok: true |
| 5 | Erotica bot alive | `GET api.telegram.org/.../getMe` | ok: true |
| 6 | Main bot webhook | `GET api.telegram.org/.../getWebhookInfo` | url set, no errors |
| 7 | Erotica bot webhook | Same | url set, no errors |
| 8 | Supabase profiles | `SELECT * FROM profiles LIMIT 1` | No 500 error |
| 9 | TON RPC | `POST getMasterchainInfo` | result with seqno |
| 10 | Solana RPC | `POST getHealth` | "ok" |
| 11 | CostGuard | `GET .../api/spend/dashboard` | JSON with spend |
| 12 | Telegram buy | Send /buy to bot | Invoice appears |

---

## 9. EMERGENCY ROLLBACK

If deployment causes issues:

```bash
# List worker versions
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback

# Or pin to specific version
npx wrangler rollback <version-id>
```

### Reset Telegram webhooks to old URL
```bash
curl "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -d "url=" # Clear webhook
```

---

## 10. ARCHITECTURE DIAGRAM

```
                    ┌─────────────────────────┐
                    │    TELEGRAM MINI APP     │
                    │  (React SPA — 10 screens)│
                    │  RotationTVMiniApp.jsx   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   CLOUDFLARE WORKERS    │
                    │  rotationtv-live-ai-     │
                    │  clones (v6.2.0)        │
                    │                         │
                    │  Routes:                │
                    │  /api/stream/*          │
                    │  /api/payout/*          │
                    │  /api/venice/*          │
                    │  /api/kimi/*            │
                    │  /api/ton/*             │
                    │  /api/solana/*          │
                    │  /api/bridge/*          │
                    │  /api/tribute/*  ← NEW  │
                    │  /api/heygen/*          │
                    │  /api/erotica/*         │
                    │  /api/admin/*           │
                    │  /telegram/webhook      │
                    │  /telegram/erotica/wh   │
                    │                         │
                    │  Bindings:              │
                    │  STREAM_ROOM (DO)       │
                    │  RTV_STREAM_AGENT (DO)  │
                    │  CREATOR_PAYOUT (WF)    │
                    │  TIP_QUEUE (Queue)      │
                    │  KV_SPEND (KV)          │
                    │  ASSETS (SPA files)     │
                    └──┬──────────┬──────────┬┘
                       │          │          │
           ┌───────────▼┐  ┌─────▼────┐  ┌──▼──────────┐
           │  SUPABASE  │  │  AI APIs │  │  BLOCKCHAIN  │
           │  72 tables │  │ Venice×3 │  │ TON(Chainstk)│
           │  2 projects│  │ Gemini×2 │  │ Solana(×4)  │
           │  RLS: 72/72│  │ Kimi     │  │ Bridge(Sym)  │
           └────────────┘  │ OpenAI   │  └─────────────┘
                           └─────────┘
                    ┌─────────────────────────┐
                    │    PAYMENT RAILS        │
                    │  Telegram Stars ✅      │
                    │  TON Wallet ✅          │
                    │  Tribute ✅ (NEW)       │
                    │  Stripe ❌ (no key)     │
                    │  PayPal ❌ (no config)  │
                    └─────────────────────────┘
```

---

## SOURCE FILE INVENTORY

| File | Lines | Status |
|------|-------|--------|
| src/index.ts | 698 | v6.2.0 with Tribute routes |
| src/lib/tributeGateway.ts | 430 | NEW — Tribute webhook + API |
| src/lib/veniceGateway.ts | 713 | Venice AI pipeline |
| src/lib/rotationPayWalletBot.ts | 889 | Telegram wallet bot |
| src/lib/super-agent.ts | 643 | Super agent bot |
| src/lib/kimiGateway.ts | 519 | Kimi AI gateway |
| src/lib/supabase.ts | 517 | Supabase client |
| src/lib/stripePayouts.ts | 523 | 80/15/5 payout engine |
| src/lib/costGuard.ts | 464 | Spend limits |
| src/lib/solanaEngine.ts | 392 | Solana failover |
| src/lib/tokenManager.ts | 345 | CF token manager |
| src/lib/crossChainBridge.ts | 307 | TON↔SOL bridge |
| src/lib/erotikaImagePipeline.ts | 295 | Adult content pipeline |
| src/lib/telegramPayments.ts | 225 | Stars invoices |
| src/lib/tonTradingEngine.ts | 179 | TON trading |
| src/broadcast/AIHostEngine.js | 170 | AI host engine |
| src/broadcast/AI_HOSTS_CONFIG.js | 133 | 6 hosts + handoff |
| src/broadcast/BroadcastGrid.jsx | 452 | 2×3 grid UI |
| src/components/GoLiveModal.tsx | 472 | Camera + mic preview |
| src/components/LiveHostOverlay.tsx | 206 | LIVE badge + mic |
| src/agents/RTVStreamAgent.ts | 400 | AI moderation agent |
| src/agents/StreamRoom.ts | — | DO WebSocket rooms |
| src/workflows/CreatorPayoutWorkflow.ts | 128 | Payout workflow |
| **TOTAL** | **12,844** | Full ecosystem |
