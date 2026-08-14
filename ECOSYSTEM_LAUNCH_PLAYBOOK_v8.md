# ROTATIONTV ECOSYSTEM — LAUNCH PLAYBOOK v8
## Full-Stack Deployment & Verification Guide
### August 14, 2026

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│  TELEGRAM MINI APP (React + Vite)                                    │
│  Served as static assets from Cloudflare Worker                      │
│  dist/index.html + dist/assets/index-*.js                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CLOUDFLARE ACCOUNT 1: rotationtimmy (947b01a...)                    │
│  ├── rotationtv-live-ai-clones (v6.1.0 LIVE, v6.4.1 staged)         │
│  │   ├── Durable Objects: StreamRoom, RTVStreamAgent                │
│  │   ├── KV: KV_SPEND (rate limiting)                               │
│  │   ├── Queue: tip-queue                                           │
│  │   ├── Workflow: CreatorPayoutWorkflow                            │
│  │   └── Assets: dist/ (frontend)                                   │
│  │   Routes: /api/venice, /api/chat, /api/stream/*, /telegram/*    │
│  │                                                                  │
│  CLOUDFLARE ACCOUNT 2: rotationtvaicom (7e431c5...)                 │
│  ├── rtv-ai-gateway (v2.1.0 LIVE — JUST DEPLOYED)                  │
│  │   Secrets: GEMINI_API_KEY, VENICE_API_KEY/2/3, SUPABASE_*        │
│  │   Routes: /ai/chat, /ai/moderate, /ai/ensemble, /telegram/*     │
│  │   AI: Gemini 2.5 Flash + Venice 3-key rotation                   │
│  │                                                                  │
│  ├── rtv-stream (v4.0.0 LIVE)                                       │
│  │   Protocol: WebRTC WHIP/WHEP                                     │
│  │   Features: go_live, watch, gifts, tips, subscriptions          │
│  │                                                                  │
│  ├── rtv-blockchain (HTTP 404 — needs redeploy)                     │
│  ├── rtv-edge-gateway (HTTP 404 — needs redeploy)                   │
│  ├── rtv-payments (HTTP 404 — needs redeploy)                       │
│  ├── rtv-operator-bot (HTTP 200 — minimal)                          │
│  └── rtv-bot-console (HTTP 200 — minimal)                           │
│                                                                      │
│  SUPABASE: xynkgaxfwvpcixissxdz (main)                               │
│  ├── 76 tables, RLS enabled on 72+                                  │
│  ├── profiles table has RLS recursion bug (42P17)                   │
│  └── Fix: rtv_supabase_fix_v8.sql (ready to execute)                │
│                                                                      │
│  TELEGRAM BOTS:                                                      │
│  ├── @base44_229784_bot (main) → ALIVE                              │
│  └── @RotationtvErotica_Bot → ALIVE                                 │
│                                                                      │
│  GITHUB: rotationtv1-crypto (35 repos)                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. VERIFICATION RESULTS

### Build & Compile — PASS
- Frontend: 17 modules transformed, 8.76KB JS, 0.49KB HTML
- Worker: 2.65MB upload, all bindings resolve (DO, KV, Queue, Workflow, Assets)

### API Integration — PASS
- Main Worker: all 6 endpoints return 200
- AI Gateway: Gemini + Venice both responding with live text
- Stream Worker: v4.0.0, WebRTC WHIP/WHEP, all features listed
- Telegram webhooks: both bots responding

### State Management — PASS
- zustand store: user, activeStream, initUser, setActiveStream
- Tab management: discover, wallet, profile, trading
- No stale state issues detected

### UI/UX Flow — PASS
- 11 components, 20+ pages
- Flow: Discover → Go Live → Stream Active → End Stream
- GoLiveModal: WHIP WebRTC negotiation + camera/mic + preview

### Auth & Session — PASS
- telegramAuth.ts: HMAC-SHA256 validation via Web Crypto API
- useTelegram() hook: initData, startParam, theme sync
- Frontend passes initData to backend on every API call

### Mobile Responsiveness — PASS
- Viewport locked, max-width 480px, Telegram WebApp expand()
- Bottom tab bar fixed, touch-optimized

---

## 3. DEPLOYMENT STATUS

### DONE (Account 2 — rotationtvaicom)
- rtv-ai-gateway v2.1.0 deployed with:
  - Gemini model fix (gemini-pro → gemini-2.5-flash)
  - Venice 3-key rotation set (VENICE_API_KEY/2/3)
  - GEMINI_API_KEY updated
  - Telegram webhook responding

### READY TO DEPLOY (Account 2 — token works)
- rtv-blockchain (27 secrets already bound)
- rtv-edge-gateway (36 secrets, incl Twilio + SendGrid)
- rtv-payments (28 secrets, incl STRIPE_SECRET_KEY)
- rtv-operator-bot, rtv-bot-console (minimal)

### BLOCKED (Account 1 — rotationtimmy)
- rotationtv-live-ai-clones v6.4.1 (main worker + frontend)
- Needs: Cloudflare API token with Workers:Edit scope
- Get it: dash.cloudflare.com → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"

### BLOCKED (Supabase)
- Token expired — needs re-authorization
- SQL fix ready: rtv_supabase_fix_v8.sql

---

## 4. DEPLOYMENT COMMANDS

### Account 2 (works now):
```bash
export CLOUDFLARE_API_TOKEN="[REDACTED — CF API TOKEN]"
export CLOUDFLARE_ACCOUNT_ID="7e431c541ea0f39d7f7fe5fd9f06eada"
cd /tmp/rtv-ai-gateway && npx wrangler deploy
```

### Account 1 (needs token):
```bash
export CLOUDFLARE_API_TOKEN="<NEW_TOKEN>"
export CLOUDFLARE_ACCOUNT_ID="947b01a53876bee16fa0e8360c880aca"
cd /tmp/rtv-telegram-wallet
npm run build && npx wrangler deploy
```

---

## 5. REMAINING BLOCKERS

1. CF token for rotationtimmy account (DEPLOY GATE for main worker)
2. Supabase token expired (can't execute SQL fix)
3. 3 secondary workers at 404 (can deploy now with working token)
4. 3 compromised Telegram bot tokens (revoke via @BotFather)
