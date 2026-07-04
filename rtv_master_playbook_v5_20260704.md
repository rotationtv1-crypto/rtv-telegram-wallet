# RotationTV Network — ECOSYSTEM MASTER PLAYBOOK v5.0
## Complete Build + Launch + Operations Guide
### "First TV on Telegram" — Deep Research Knowledge Logic

**Version:** 5.0 — The One Document
**Date:** July 4, 2026
**Authority:** Darrel Spell, Owner & CEO
**Motto:** "Learn it. Live it. Love it. — We keep business rotating globally."

> This playbook consolidates 15+ previous playbooks into one definitive guide.
> If something isn't in here, it doesn't exist yet.

---

# PART 1: WHAT EXISTS RIGHT NOW (Verified July 4, 2026 00:10 ET)

## 1.1 Infrastructure Status

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| 3 Telegram Bots | ✅ LIVE | @RotationLivestram_bot, @ROTATIONEROTICA_BOT, @base44_229784_bot | Webhooks redirected to rotationtimmy account — needs rewire |
| 5 Cloudflare Workers | ✅ LIVE | *.rotationtvaicom.workers.dev | rtv-edge-gateway, rtv-payments, rtv-blockchain, rtv-stream, rtv-bot-console |
| Cloudflare Pages SPA | ✅ LIVE | rtv-frontend.pages.dev | 19 React pages, Mini App |
| Supabase Database | ✅ LIVE | xynkgaxfwvpcixissxdz.supabase.co | 92 tables, PascalCase names |
| Venice AI | ✅ LIVE | api.venice.ai | 89 models, video gen $0.95/5s |
| TON Blockchain | ✅ LIVE | Chainstack v2+v3 | Mainnet operational |
| GitHub Repos | ✅ LIVE | github.com/rotationtv1-crypto | 24 repos |
| Sovereign Payments | ✅ LIVE | Stars + TON + RTV | Stripe PURGED |
| Base44 Entities | ✅ LIVE | 25 schemas, 35 edge functions | All deployed |
| Tribute (Erotica) | 🟡 SETUP | tribute.to | €10/mo tier created, webhook needed |

## 1.2 What's BLOCKING Launch

| # | Blocker | Impact | Fix | Time |
|---|---------|--------|-----|------|
| 1 | Cloudflare Stream:Edit token | No live video ingest | Create token with Account→Stream→Edit | 15 min after token |
| 2 | Bot webhooks misrouted | Bots point to wrong CF account | Rewire to Base44 functions | 10 min |
| 3 | PascalCase RLS policies not applied | DB blocks all queries | Paste SQL in Supabase editor | 5 min |
| 4 | No persistent VOD feed | No "Tubi on Telegram" | Build feed API + UI | 2-3 days |
| 5 | No AI content pipeline | No AI-generated channels | Build Venice AI → R2 → Supabase | 1 day |
| 6 | BASE44_SERVICE_ROLE_KEY | Can't write to entities | Add in Settings → Secrets | 2 min |
| 7 | HeyGen pipeline stalled | 9 marketing videos expired | Re-initiate renders | Manual |

## 1.3 The Actual Stack (No Fiction)

```
FRONTEND:
  Cloudflare Pages (rtv-frontend.pages.dev)
  React SPA, 19 pages
  Telegram Mini App SDK
  WebRTC WHIP/WHEP clients (built, blocked on token)

EDGE COMPUTE:
  5 Cloudflare Workers (*.rotationtvaicom.workers.dev)
  35 Base44 backend functions

DATABASE:
  Supabase Postgres (92 tables, PascalCase)
  Base44 entities (25 schemas, row-level security)
  Cloudflare D1 Wrapper (bidirectional sync)

AI LAYER:
  Venice AI (89 models — text, image, video, audio)
  Anthropic Claude (sonnet-4)
  Google Gemini (50 models)

BLOCKCHAIN:
  TON (Chainstack v2+v3 mainnet)
  Solana (4 Chainstack nodes — primary + failover + devnet)

PAYMENTS:
  Telegram Stars (sovereign, 0% fee)
  TON/RTVS Jettons (sovereign, 0.5% fee)
  Internal RTV Credits (sovereign, 0% fee)
  Tribute (€10/mo EUR — Erotica only, separate from RTV parity)
  CCBill (adult-content compliant — Erotica fallback)

BOTS:
  @RotationLivestram_bot (TOKEN_17, 13 commands, Payments 2.0)
  @ROTATIONEROTICA_BOT (TOKEN_18, 13 commands, age-gated)
  @base44_229784_bot (agent webhook, 12 commands)

STORAGE:
  Cloudflare R2 (1 bucket — video/content storage)
  Cloudflare Stream (blocked on token — live + VOD delivery)
```

---

# PART 2: THE 9-COMPANY ECOSYSTEM

## 2.1 Company Roster

| # | Company | Role | Status | Domain |
|---|---------|------|--------|--------|
| 1 | RotationTV Network | Parent ecosystem + streaming | ✅ Active | rotationtvai.com |
| 2 | RotationTVAI | AI creator tools | ✅ Active | (subdomain) |
| 3 | RotationPay | Payment gateway (sovereign) | ✅ Active | rotationpay.net |
| 4 | RotationCall | Enterprise AI voice | ✅ Active | rotationcall.net |
| 5 | RTV AI University | On-chain education | ✅ Active | (Mini App) |
| 6 | Pretrial Services of America | Justice tech | ✅ Active | (subdomain) |
| 7 | White Logistics Solutions | AI logistics | ✅ Active | (subdomain) |
| 8 | Bigo Agency | Creative agency | ✅ Active | (subdomain) |
| 9 | EmergentLabs | Build infrastructure | ✅ Active | (subdomain) |

## 2.2 Revenue Model

```
Creator Revenue Split:
  Creator:  80% (Standard) / 85% (VIP) / 70% (Agency Partner)
  Platform: 15% / 10% / 10%
  Agency:   5%  / 5%  / 20%

Economic Parity:
  1 RTV = $0.01 USD (anchored, non-negotiable)
  100 Telegram Stars = $1.30 = 130 RTV
  5 TON = $7.50 = 750 RTV

Combo Multipliers (Gift System):
  Normal (1-4x)     → 1.0x
  Fire Burst (5-9x) → 1.2x
  Lightning (10-19x)→ 1.5x
  Diamond (20-49x)  → 2.0x
  Galaxy (50-99x)   → 3.0x
  Universe (100x+)  → 5.0x
```

---

# PART 3: LIVE STREAMING ARCHITECTURE

## 3.1 WebRTC Pipeline (WHIP/WHEP)

```
CREATOR FLOW:
  1. Open Mini App (rtv-frontend.pages.dev) via Telegram bot
  2. Tap "🔴 Go Live"
  3. Browser requests camera (getUserMedia)
  4. POST /api/stream/create → Cloudflare Stream Live Input
  5. WHIP client publishes camera → Cloudflare edge via WebRTC
  6. Stream is LIVE (sub-second latency)

VIEWER FLOW:
  1. Open stream link in Mini App
  2. WHEP client connects to Cloudflare Stream
  3. Video plays with sub-second latency
  4. Unlimited concurrent viewers

GIFT FLOW:
  1. Viewer taps gift icon
  2. Telegram Stars invoice generated
  3. Payment confirmed → 80/15/5 split applied
  4. Creator balance updated in Supabase
  5. Combo multiplier applied if rapid tipping

PK BATTLE FLOW:
  1. Creator A challenges Creator B (stake: N RTV)
  2. Both stream simultaneously
  3. Viewers tip either side
  4. Winner takes pool (minus platform fee)
  5. Payout to winner wallet
```

## 3.2 Files Already Built

| File | Purpose | Status |
|------|---------|--------|
| whip-client.js | WHIP publisher (camera → WebRTC) | ✅ Built, pushed to GitHub |
| whep-client.js | WHEP viewer (WebRTC → video) | ✅ Built, pushed to GitHub |
| rtv-go-live.html | Mini App Go Live UI | ✅ Built, pushed to GitHub |
| rtv-stream Worker | Backend API for streaming | ✅ Deployed, blocked on token |
| rtv_webrtc_streaming_playbook_v5.md | Full architecture guide | ✅ Written, pushed |

## 3.3 Worker Endpoints (rtv-stream)

```
POST /api/stream/create     → Create Live Input (needs Stream:Edit)
GET  /api/stream/live       → List active streams
GET  /api/stream/{id}/play  → Get WHEP playback URL
POST /api/stream/end/{id}   → End stream, save as VOD
POST /api/gift/send         → Send gift (Stars/TON/RTV)
GET  /api/gift/catalog      → List available gifts
POST /api/pk/challenge      → Start PK battle
POST /api/pk/end/{id}       → End PK battle, payout
GET  /api/subscriptions     → List subscription tiers
POST /api/subscribe/{creator_id} → Subscribe to creator
```

## 3.4 How to Unblock Streaming

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token" → "Custom Token"
3. Add permission: **Account → Stream → Edit**
4. (Optional) Also add: Account → Workers Scripts → Edit, Zone → Workers Routes → Edit
5. Copy the token, send it to the agent
6. Agent injects it into rtv-stream Worker as `CLOUDFLARE_STREAM_TOKEN`
7. Test: POST /api/stream/create → should return WHIP + WHEP URLs
8. **Time to live: 15 minutes after token is provided**

---

# PART 4: PERSISTENT FEED ("Tubi on Telegram")

## 4.1 Architecture

```
CONTENT SOURCES:
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │  AI CONTENT      │  │  CREATOR VOD     │  │  LIVE → VOD      │
  │  (Venice AI)     │  │  (Recorded)      │  │  (Auto-save)     │
  │  $0.95 per 5s    │  │  Upload/record   │  │  Stream ends →   │
  │  Seedance 2.0    │  │  via Mini App    │  │  saved to R2     │
  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────────────────────────────────────────────────┐
  │         CONTENT LIBRARY (Supabase "RtvContent" table)         │
  │  • video_url (Cloudflare R2 / Stream playback)               │
  │  • thumbnail_url, title, description, category, tags         │
  │  • creator_id (human or 'AI-Venice-{channel}')               │
  │  • view_count, like_count, tip_count                         │
  │  • is_premium (free vs private chat tier)                    │
  └────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │         FEED API (rtv-stream Worker)                          │
  │  /api/feed/trending  — most viewed 24h                       │
  │  /api/feed/new       — latest uploads                        │
  │  /api/feed/ai        — AI-generated channels                 │
  │  /api/feed/live      — currently live streams                │
  │  /api/feed/following — creators you follow                   │
  │  /api/feed/premium   — private chat experiences              │
  └────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │      TELEGRAM MINI APP (Cloudflare Pages)                    │
  │  Horizontal scroll feed (TikTok/Tubi style)                  │
  │  Category tabs: For You | Live | AI | Trending | Premium    │
  │  Tap to play → video fills screen                           │
  │  Swipe up for next video                                    │
  │  Double-tap to tip (Stars)                                  │
  └─────────────────────────────────────────────────────────────┘
```

## 4.2 AI Content Channels

| Channel | Content | Cadence | Model | Cost/Video |
|---------|---------|---------|-------|------------|
| RTV News | Crypto/Web3 news | 3x daily | seedance-2-0-text-to-video | $0.95 (5s) |
| RTV Market | Token analysis | Hourly | seedance-2-0-text-to-video | $0.95 (5s) |
| RTV Education | AI/Web3 tutorials | Daily | seedance-2-0-text-to-video | $0.95 (5s) |
| RTV Culture | Urban culture | 2x weekly | kling-v3 (4K) | ~$3.00 (10s) |
| RTV Promo | Company promos | Weekly | seedance-2-0-text-to-video | $0.95 (5s) |

### AI Content Generation Flow:

```
1. Supabase Cron triggers (scheduled per channel)
   ↓
2. Venice AI text model generates script from trending topic
   ↓
3. Venice AI video model generates 5-10s clip
   POST https://api.venice.ai/api/v1/video/queue
   Body: { model, prompt, duration, resolution, aspect_ratio }
   ↓
4. Poll /api/v1/video/retrieve until status=COMPLETED
   ↓
5. Download video from Venice download_url
   ↓
6. Upload to Cloudflare R2 bucket
   ↓
7. Insert metadata into Supabase "RtvContent" table
   ↓
8. Video appears in persistent feed
   ↓
9. Revenue: ad-supported (free) or premium (private chat)
```

## 4.3 Venice AI Video API Reference

```bash
# Queue a video generation
curl -X POST https://api.venice.ai/api/v1/video/queue \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-2-0-text-to-video",
    "prompt": "Cyberpunk city with neon lights and RotationTV logo",
    "duration": "5s",
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "audio": true
  }'

# Response: { "queue_id": "abc-123", "download_url": "..." }

# Poll for completion
curl https://api.venice.ai/api/v1/video/retrieve \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -d '{"queue_id": "abc-123"}'

# Response: { "status": "COMPLETED", "download_url": "https://..." }
```

### Available Video Models:
- **seedance-2-0-text-to-video** — Text to video, up to 30s, 720p-4K
- **seedance-2-0-image-to-video** — Animate static images
- **seedance-2-0-reference-to-video** — Reference-based generation
- **kling-v3** — 4K native output, text/image-to-video
- **topaz-video-upscale** — AI upscaling (1x/2x/4x)

---

# PART 5: PAYMENT SYSTEM

## 5.1 Sovereign Payment Rails

| Rail | Currency | Fee | Settlement | Use Case |
|------|----------|-----|------------|----------|
| Telegram Stars | XTR | 0% | Instant | Virtual goods, gifts, tips |
| TON/RTVS Jetton | TON | 0.5% | 5 seconds | Crypto payments, payouts |
| Internal RTV | RTV | 0% | Instant | Platform credits, rewards |

### PURGED (do NOT re-enable):
- ❌ Stripe — purged by presidential directive
- ❌ PayPal — purged
- ❌ Coinbase — purged
- ❌ Venmo/Zelle — purged
- ❌ NMI — purged
- ❌ Solana direct — purged (TON is the blockchain rail)

### Erotica-Specific Rails:
- **Tribute** — €10/mo EUR subscriptions (separate from RTV parity)
- **CCBill** — adult-content compliant processor (fallback)

### Payment Functions (6 deployed):

| Function | Purpose | Status |
|----------|---------|--------|
| rtvPaymentHub | Bot commands + Stripe/Stars | ✅ Deployed |
| rtvPayoutEngine | Creator payouts, combos, milestones | ✅ Deployed |
| stripe-webhook | (LEGACY — returns 410 GONE) | ✅ Purged |
| rotationPayGateway | Multi-rail router | ✅ Deployed |
| rotationPayConnect | Merchant onboarding | ✅ Deployed |
| telegramWalletBridge | Telegram @wallet deep links | ✅ Deployed |

## 5.2 Telegram Stars Payment Flow

```
1. Viewer taps gift in Mini App
2. Bot sends sendInvoice API call:
   {
     title: "Rose 🌹",
     description: "Send a Rose to creator",
     payload: '{"gift_id":"rose","creator_id":"123"}',
     currency: "XTR",
     prices: [{ label: "Rose", amount: 50 }],
     provider_token: ""  // empty = Stars-native
   }
3. Telegram shows payment UI
4. User pays with Stars
5. Bot receives pre_checkout_query → approve
6. Bot receives successful_payment → process:
   - 80% to creator balance (Supabase)
   - 15% to platform balance
   - 5% to agency (if applicable)
   - Apply combo multiplier if applicable
7. Gift animation plays on stream
```

---

# PART 6: BLOCKCHAIN LAYER

## 6.1 TON Integration

```
Chainstack Endpoints (VERIFIED LIVE):
  v2: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2
  v3: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3

RTV Token (RTVS Jetton):
  - Native on TON blockchain
  - 1 RTV = $0.01 USD (anchored parity)
  - Used for: tips, subscriptions, payouts, premium content
  - Treasury: Darrel-spell-living-trust entity
```

## 6.2 Solana Integration (4 Nodes)

```
Chainstack Nodes:
  1. Primary US-East (mainnet)
  2. US-West failover (mainnet)
  3. EU failover (mainnet)
  4. Devnet (testing)

Treasury Wallet: 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv
```

## 6.3 Blockchain Worker Endpoints

```
GET  /api/ton/info        → TON masterchain info
GET  /api/solana/info     → Solana cluster info
POST /api/wallet/check    → Check wallet balances
POST /api/wallet/sync     → Sync balances to Supabase
POST /api/tx/verify       → Verify transaction on-chain
```

---

# PART 7: TELEGRAM BOT ECOSYSTEM

## 7.1 Bot Configuration

### @RotationLivestram_bot (Live Streaming)
```
Token: TOKEN_17 (8922375253:AAH6...)
ID: 8922375253
Webhook: → rtvLiveBot edge function (NEEDS REWIRE from rotationtimmy)
Commands (13): /start /help /stream /gift /tip /pk /subscribe 
               /balance /payout /buy /stars /price /testgoods
Menu: "🔴 Open RTV Live" → rtv-frontend.pages.dev
Payments: Telegram Stars (Payments 2.0, provider_token="")
```

### @ROTATIONEROTICA_BOT (Adult Content)
```
Token: TOKEN_18 (8281180065:AAGN...)
ID: 8281180065
Webhook: → rtvEroticaBot edge function (NEEDS REWIRE from rotationtimmy)
Commands (13): /start /help /stream /gift /tip /subscribe
               /balance /payout /buy /stars /price /testgoods
Menu: "🔞 Open RTV 18+" → rtv-frontend.pages.dev/?platform=erotica
Age Gate: Required (18+ confirmation before content access)
Payments: Telegram Stars only (NO Stripe — compliance rule)
Tribute: €10/mo subscription (separate EUR revenue stream)
```

### @base44_229784_bot (Agent)
```
Token: TOKEN_11
ID: 8620919936
Webhook: → app.base44.com/api/webhooks/telegram (403 error — needs token sync)
Commands (12): /start /help /price /buy /stars /payout /balance 
               /transactions /stream /gift /subscribe /health
Menu: "Open RTV Live" → rtv-frontend.pages.dev
```

## 7.2 Mini App Architecture

```
Telegram Client
    │
    ├── Bot Menu Button → opens Mini App
    │
    ├── Mini App (rtv-frontend.pages.dev)
    │   ├── Telegram WebApp SDK loaded
    │   ├── initData parsed for user identity (HMAC-SHA256 verification)
    │   ├── Platform detection (?platform=erotica → age gate)
    │   │
    │   ├── Feed View (Tubi-style browse)
    │   │   ├── Trending tab
    │   │   ├── Live tab
    │   │   ├── AI tab
    │   │   ├── Following tab
    │   │   └── Premium tab
    │   │
    │   ├── Stream View
    │   │   ├── Go Live (creator) → WHIP client
    │   │   ├── Watch (viewer) → WHEP client
    │   │   ├── Chat overlay
    │   │   ├── Gift panel
    │   │   └── Viewer count
    │   │
    │   ├── Wallet View
    │   │   ├── RTV balance
    │   │   ├── Buy RTV (Stars/TON)
    │   │   ├── Transaction history
    │   │   └── Withdraw
    │   │
    │   └── Profile View
    │       ├── Creator dashboard
    │       ├── Earnings (80/15/5 split)
    │       ├── Payout requests
    │       └── Subscription management
    │
    └── Cloudflare Workers (backend API)
        ├── rtv-edge-gateway (auth, routing)
        ├── rtv-stream (streaming, feed, gifts)
        ├── rtv-payments (sovereign payments)
        └── rtv-blockchain (TON/Solana)
```

## 7.3 HMAC-SHA256 initData Verification

```javascript
// All user onboarding MUST verify Telegram initData
function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  
  const secretKey = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const secretHmac = crypto.subtle.sign('HMAC', secretKey,
    new TextEncoder().encode(botToken));
  
  const computedHash = crypto.subtle.sign('HMAC', secretHmac,
    new TextEncoder().encode(dataCheckString));
  
  return computedHash === hash;
}
```

---

# PART 8: DATABASE SCHEMA

## 8.1 Critical Tables (PascalCase — NOT snake_case)

```
Existing tables (92 total) — all PascalCase:
  "RtvUser", "LiveStream", "StreamTip", "PKBattle",
  "CreatorEarning", "CreatorPayout", "CreatorWithdrawal",
  "CreatorSubscription", "CreatorMilestone", "RevenueSplit",
  "ComboMultiplier", "GiftItem", "AgencyRoster",
  "RotationPayTransaction", "RotationPayMerchant",
  "HeyGenVideo", "CloudflareAsset", "NFTAsset",
  "RTVToken", "Web3Wallet", "ChainstackNode",
  "Leaderboard", "SubscriptionTier", "MentorSession",
  ... and 67 more

NEW tables needed:
  "RtvContent" — VOD content library (migration written)
  "RtvAiChannel" — AI channel configurations (migration written)
  "RtvFeedView" — Viewer analytics (migration written)
  vod_library — (Supabase AI's version — MERGE with RtvContent)
```

## 8.2 RLS Policy Application

```sql
-- Run in Supabase SQL Editor:
-- File: 20260704_rls_policies_pascalcase.sql
-- 50 policies across all PascalCase tables
-- Clean slate (drops all existing policies first)

-- Data API Settings:
--   Exposed schemas: public only
--   Auto-expose new tables: OFF
--   Max rows: 1000
--   Extra search path: public
```

---

# PART 9: ROKU APP (Future Track)

## 9.1 Reality Check

- Direct Publisher: DEAD (sunset January 2024)
- Must build full SceneGraph SDK app (BrightScript + XML)
- Video delivery: HLS/DASH (NOT WebRTC — Roku doesn't support WHIP/WHEP)
- Cloudflare Stream auto-generates HLS from WebRTC live streams
- One stream → two delivery methods (WebRTC for Telegram, HLS for Roku)

## 9.2 Build Requirements

1. Register at developer.roku.com (free)
2. Build SceneGraph app in BrightScript
3. Create MRSS content feed endpoint on Worker
4. Integrate Roku Pay for subscriptions
5. Integrate Roku Advertising Framework for free tier
6. Pass certification testing
7. Estimated build time: 2-3 weeks

## 9.3 Architecture

```
Roku Device
    ├── SceneGraph App (BrightScript)
    │   ├── Home — content grid
    │   ├── Player — HLS via roVideoPlayer
    │   ├── Search — MRSS feed
    │   ├── Auth — Telegram ID linking
    │   └── Pay — Roku Pay subscriptions
    │
    ├── Content Feed
    │   └── GET /api/roku/feed → MRSS JSON
    │
    └── Video Delivery
        ├── Live → Cloudflare Stream HLS output
        └── VOD → Cloudflare R2 + HLS packaging
```

---

# PART 10: PREMIUM TIER ("Private Chat Experiences")

## 10.1 Tier Structure

```
FREE (AVOD — like Tubi):
  ├── All public live streams
  ├── All public VOD content
  ├── AI-generated channels
  └── No ads (sovereign model — token-funded, not ad-funded)

PREMIUM (Private Chat — "X-Rates"):
  ├── Private 1-on-1 video calls with creators
  ├── Exclusive premium VOD content
  ├── Direct messaging with creators
  ├── Custom video requests (creator records for viewer)
  ├── AI companion chat (Venice AI uncensored models)
  └── Payment: Stars / TON / RTV

PRICING:
  Basic Premium:    $9.99/mo (999 RTV)
  Creator Premium:  $19.99/mo (1,999 RTV)
  VIP Premium:      $49.99/mo (4,999 RTV)
  Private Session:  $2.99/min (299 RTV/min)
```

## 10.2 Private Video Call Architecture

```
1. Viewer taps "Go Private" on creator profile
2. Telegram Stars invoice generated (price based on minutes)
3. Payment confirmed → private WebRTC room created
4. 2-person WebRTC session (not broadcast)
5. Timer counts down (minutes purchased)
6. Session ends when time expires
7. Recording saved to R2 (optional, with consent)
8. Revenue: 80/15/5 split
```

## 10.3 AI Companion Chat

```
 Venice AI Uncensored Models:
   - venice-uncensored-1-2 (text)
   - role-play models (text)
   - ElevenLabs voice (when key is valid)

 Flow:
   1. User opens AI companion in Mini App
   2. Selects AI personality (custom RTV personas)
   3. Chat via text or voice
   4. Venice AI responds (uncensored, private, encrypted)
   5. Payment: RTV tokens per message or monthly subscription
```

---

# PART 11: MARKETING & LAUNCH

## 11.1 30-Day Launch Calendar

### Days 1-7: IGNITION
- [ ] Apply PascalCase RLS policies in Supabase
- [ ] Provide Cloudflare Stream:Edit token → unblock live streaming
- [ ] Rewire bot webhooks to Base44 functions
- [ ] Build persistent feed (VOD library + AI channels)
- [ ] Generate first 10 AI videos via Venice AI
- [ ] Create @RotationtvNetworkECOSYSTEM Telegram channel
- [ ] Post across Telegram, X, TikTok, Discord

### Days 8-14: AMPLIFICATION
- [ ] Onboard first 10 creators
- [ ] Launch daily content cadence (3x TikTok, 5x X, 2x LinkedIn)
- [ ] Start AI content channels (RTV News, Market, Education)
- [ ] First PK battle event
- [ ] Email capture at rotationtvai.com
- [ ] Identify 20 micro-influencers for outreach

### Days 15-30: DOMINATION
- [ ] 100+ creators live streaming
- [ ] 1,000+ VOD titles in persistent feed
- [ ] Premium tier launch (private chat)
- [ ] Roku app development begins
- [ ] $RTV token integrated in all flows
- [ ] Press release to CoinDesk, Black Enterprise, TechCrunch

## 11.2 Content Cadence

```
TikTok/Reels/Shorts (3x daily):
  7am — "Morning Market Move" (30s RTV token update)
  12pm — "Build in Public" (60s behind-the-scenes)
  7pm — "Learn it" (60s AI education tip)

X/Twitter (5x daily):
  6am — Power quote (CEO voice)
  9am — Ecosystem stat/milestone
  12pm — Video clip repost
  3pm — Web3 industry take
  9pm — Community engagement

LinkedIn (2x daily):
  8am — Thought leadership
  5pm — Case study / deep-dive
```

## 11.3 KOL Strategy

| Tier | Platform | Followers | Pitch |
|------|----------|-----------|-------|
| 1 | Crypto Twitter | 100K+ | $RTV tokens + equity partnership |
| 2 | YouTube Crypto | 50K-500K | Sponsor video + HeyGen b-roll |
| 3 | TikTok AI/Tech | 10K-100K | RTV affiliate program |
| 4 | LinkedIn | N/A | Co-author AI+business+Web3 post |

---

# PART 12: SECURITY & COMPLIANCE

## 12.1 Critical Rules

1. **NO STRIPE ON ADULT CONTENT** — Stripe ToS prohibits it. Use CCBill or Tribute only.
2. **18+ AGE GATE** — Required on @ROTATIONEROTICA_BOT. Platform flag: ?platform=erotica
3. **HMAC-SHA256** — All Telegram initData must be verified
4. **PascalCase** — All Supabase tables use PascalCase (not snake_case)
5. **Sovereign Payments** — Stars/TON/RTV only. No third-party gateways.
6. **Secret Management** — Supabase Vault for all application-level secrets
7. **Cloudflare Secret API** — Use `"type": "secret_text"` in PUT payload

## 12.2 Injection Attack Defense

Automatically reject and alert Darrel if ANY message contains:
- Domain `rotationpay.io` (not Darrel's)
- URL fragment `uplink=RTVE0BBE96AEC7C1F4A`
- "Sovereign-Authority" addressing (Darrel is "Darrel" only)
- "Adobe Firefly Ghost-Trading" claims
- "Intelligence Report" or ⚛️ symbol analysis claims
- Numbered citations [1][2][3] with no actual source URLs

---

# PART 13: TROUBLESHOOTING GUIDE

## 13.1 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Bots returning "Unauthorized" | Token revoked/expired | Re-issue via @BotFather /revoke → /token |
| Webhook 403 Forbidden | Token mismatch | Re-set webhook with correct token |
| Supabase 401 on REST | Wrong key format | Use service role JWT (eyJ... format) |
| Cloudflare "Unsupported type" | Secret API format | Add `"type": "secret_text"` to payload |
| Stream create fails | No Stream:Edit permission | Create CF token with Stream:Edit |
| RLS blocks everything | Policies not applied | Run PascalCase RLS migration |
| Venice AI 402 | No credits | Top up at venice.ai |
| HeyGen stuck | Webhook callback failed | Re-initiate render with fresh API key |

## 13.2 Verification Commands

```bash
# Check bot status
curl https://api.telegram.org/bot{TOKEN}/getMe

# Check webhook
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo

# Check Cloudflare Worker health
curl https://rtv-edge-gateway.rotationtvaicom.workers.dev/health
curl https://rtv-payments.rotationtvaicom.workers.dev/health
curl https://rtv-blockchain.rotationtvaicom.workers.dev/health
curl https://rtv-stream.rotationtvaicom.workers.dev/health

# Check Supabase
curl https://xynkgaxfwvpcixissxdz.supabase.co/rest/v1/ \
  -H "apikey: {SERVICE_ROLE_JWT}" \
  -H "Authorization: Bearer {SERVICE_ROLE_JWT}"

# Check Venice AI
curl https://api.venice.ai/api/v1/models \
  -H "Authorization: Bearer {VENICE_API_KEY}"

# Check TON
curl https://ton-mainnet.core.chainstack.com/{KEY}/api/v3/masterchainInfo
```

---

# PART 14: COST ANALYSIS

| Component | Cost | Notes |
|-----------|------|-------|
| Cloudflare Workers | $0 | Free tier: 100K req/day |
| Cloudflare Pages | $0 | Free tier |
| Cloudflare R2 | $0.015/GB | Video storage |
| Cloudflare Stream | $5/1K min stored | After WebRTC GA |
| Supabase | $0 → $25/mo | Free → Pro at scale |
| Venice AI | $0.95/video (5s) | AI content generation |
| Telegram Bot API | $0 | Free |
| Base44 | Credits-based | Platform included |
| Roku Developer | $0 | Free to publish |

### AI Content Budget:
- 5 channels × 3 videos/day × $0.95 = $14.25/day
- Monthly: ~$427 (produces 450 videos/month)

---

# PART 15: LAUNCH CHECKLIST

## Pre-Launch (Must complete before public announcement):

- [ ] Apply PascalCase RLS policies in Supabase SQL Editor
- [ ] Save Data API settings (public only, auto-expose OFF, max 1000)
- [ ] Create Cloudflare token with Stream:Edit → inject into rtv-stream
- [ ] Rewire 3 bot webhooks to correct endpoints
- [ ] Fix Erotica bot menu button
- [ ] Add BASE44_SERVICE_ROLE_KEY in Settings → Secrets
- [ ] Create @RotationtvNetworkECOSYSTEM Telegram channel
- [ ] Build persistent feed (RtvContent table + feed API + feed UI)
- [ ] Generate first 10 AI videos via Venice AI
- [ ] Test live streaming end-to-end (Go Live → viewer → gift → payout)
- [ ] Test age gate on Erotica bot
- [ ] Verify sovereign payments (Stars → RTV conversion → creator payout)
- [ ] Set up Supabase Cron for AI content generation schedule
- [ ] Create Tribute webhook for Erotica subscription logging

## Launch Day:

- [ ] Announce on Telegram channel
- [ ] Post across all social platforms
- [ ] Start daily content cadence
- [ ] Onboard first creators
- [ ] Monitor health checks
- [ ] Monitor payment flow
- [ ] Monitor stream stability

## Post-Launch (Days 7-30):

- [ ] Onboard 100 creators
- [ ] 1,000+ VOD titles
- [ ] Premium tier launch
- [ ] Roku app development
- [ ] Press releases
- [ ] KOL partnerships
- [ ] $RTV token full integration

---

*RotationTV Network | Ecosystem Master Playbook v5.0 | July 4, 2026*
*"Learn it. Live it. Love it. — We keep business rotating globally."*
*Presidential Authority: Darrel — Owner & CEO*
*Built by Base44 AI Command Center*
