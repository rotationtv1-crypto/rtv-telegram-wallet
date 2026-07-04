# RotationTV Network — Full Launch Playbook v4
## "First TV on Telegram" — Tubi-Scale Persistent Feed + Live Streaming + AI Content

**Version:** 4.0 — Honest Constraints Edition
**Date:** July 3, 2026
**Authority:** Darrel Spell, Owner & CEO
**Status:** Real build plan with actual constraints, not aspirational fiction

---

## THE HONEST TRUTH — What's Real, What's Failing, What's Needed

### What's ACTUALLY LIVE right now:

| Component | Status | Where It's Hosted |
|-----------|--------|-------------------|
| 3 Telegram Bots | ✅ LIVE | @RotationLivestram_bot, @ROTATIONEROTICA_BOT, @base44_229784_bot |
| 4 Cloudflare Workers | ✅ LIVE | rtv-edge-gateway, rtv-payments, rtv-blockchain, rtv-stream (.rotationtvaicom.workers.dev) |
| rtv-bot-console Worker | ✅ LIVE | HTML console at rtv-bot-console.rotationtvaicom.workers.dev |
| Cloudflare Pages SPA | ✅ LIVE | rtv-frontend.pages.dev (19 React pages) |
| Supabase Database | ✅ LIVE | 92 tables, xynkgaxfwvpcixissxdz.supabase.co |
| Venice AI | ✅ LIVE | 89 models, video generation at $0.95/5s |
| Sovereign Payments | ✅ LIVE | Telegram Stars + TON/RTVS |
| Base44 Entities | ✅ LIVE | 25 entity schemas, 35 edge functions |
| GitHub Repos | ✅ LIVE | 24 repos under rotationtv1-crypto |
| TON Blockchain | ✅ LIVE | Chainstack v2+v3 endpoints |

### What's FAILING (the real constraints):

| Blocker | Why It Fails | Impact |
|---------|-------------|--------|
| Cloudflare Stream:Edit token | 3 token attempts, all zero permissions | Can't create Live Inputs for WebRTC streaming |
| No persistent VOD feed | Only live streaming code exists, no content discovery | Can't be "Tubi on Telegram" without a content library |
| No AI content pipeline | Venice AI can generate video but no automation to create/store/serve content | AI-hosted channels don't exist yet |
| HeyGen pipeline stalled | Stuck since April 24, webhook callbacks failing | 9 marketing videos expired |
| No Roku app | Direct Publisher sunset Jan 2024, need full SceneGraph SDK | Can't be on TV without building a BrightScript app |
| Supabase anon key 401 | Both sb_publishable_ and eyJ anon JWT fail on REST | Client-side Supabase calls don't work (server-side does) |
| Telegram channel missing | @RotationtvNetworkECOSYSTEM not created by Darrel | Marketing CTAs point to dead destination |

### What's NOT real (despite what other AIs claimed):
- ❌ "6 bots" — we have 3
- ❌ "31 repos" — we have 24
- ❌ "72 tables" — we have 92
- ❌ "Stripe + PayPal" — PURGED, sovereign only
- ❌ "Phase 1 COMPLETE" — streaming not operational
- ❌ "Fortune 500 quality" — we're pre-launch with real blockers

---

## THE VISION — What We're Building

RotationTV Network will be the **first television platform native to Telegram**.

Not just live streaming (Bigo/Tango). Not just VOD (Tubi/Hulu). Both.

### The 3-Layer Content Model:

```
Layer 1: LIVE (Human Creators)
  ├── WebRTC streaming via Telegram Mini App
  ├── One-tap "Go Live" — camera → Cloudflare Stream → viewers
  ├── Gifts, PK battles, subscriptions (sovereign payments)
  └── Sub-second latency, unlimited viewers

Layer 2: VOD (Persistent Feed — "Tubi on Telegram")
  ├── AI-generated content channels (Venice AI video)
  ├── Creator-recorded streams → saved as VOD
  ├── Content discovery feed (recommendation engine)
  ├── Free + ad-supported (AVOD model like Tubi)
  └── Premium tier with private chat experiences

Layer 3: TV (Roku + Smart TV)
  ├── Roku SceneGraph app (BrightScript)
  ├── HLS/DASH playback of VOD content
  ├── MRSS content feed for Roku Search
  └── Remote-control navigation (not touch)
```

---

## LAYER 1: LIVE STREAMING — The Real Build

### Stack:
- Publisher: WebRTC (WHIP) → browser camera → Cloudflare Stream
- Viewer: WebRTC (WHEP) → Cloudflare Stream → browser video element
- Worker: rtv-stream (Cloudflare Worker, LIVE at rtv-stream.rotationtvaicom.workers.dev)
- Frontend: rtv-go-live.html (Mini App, built and pushed to GitHub)
- Payments: Telegram Stars (sovereign, no Stripe)

### What's built:
- ✅ whip-client.js — WHIP publisher (~100 lines, zero dependencies)
- ✅ whep-client.js — WHEP viewer (~90 lines, zero dependencies)
- ✅ rtv-go-live.html — Mini App UI with one-tap Go Live
- ✅ Worker routes designed: /api/stream/create, /api/stream/live, /api/stream/{id}/play, /api/stream/end/{id}
- ✅ Gift system with 6 gift types (Rose → Crown, 1-500 Stars)
- ✅ 80/15/5 revenue split (creator/platform/agency)

### What's blocking:
- 🔴 CLOUDFLARE_STREAM_TOKEN with Stream:Edit permission
  - This token lets the Worker call POST /stream/live_inputs to create WebRTC endpoints
  - Without it, the "Go Live" button fails at the API call
  - 3 tokens created so far all had zero permissions
  - SOLUTION: Create token with "Account → Stream → Edit" explicitly checked

### What happens when the token is provided:
1. I inject it as a secret into rtv-stream Worker
2. The /api/stream/create endpoint starts working
3. Creator taps "Go Live" → camera opens → WHIP connects → LIVE
4. Viewer opens stream link → WHEP connects → watching with sub-second latency
5. Gifts flow via Telegram Stars → creator payout via 80/15/5 split

### Time to live after token: 15 minutes

---

## LAYER 2: PERSISTENT FEED — "Tubi on Telegram"

This is the layer that doesn't exist yet. This is what makes us "bigger than Hulu" — a persistent content library that's always available, not just when someone is live.

### Architecture:

```
┌─────────────────────────────────────────────────────────┐
│                 PERSISTENT FEED ARCHITECTURE              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  AI CONTENT   │    │  CREATOR VOD │    │  LIVE →    │ │
│  │  (Venice AI)  │    │  (Recorded)  │    │  VOD AUTO  │ │
│  │               │    │              │    │  -SAVE     │ │
│  └──────┬───────┘    └──────┬───────┘    └─────┬──────┘ │
│         │                   │                  │         │
│         ▼                   ▼                  ▼         │
│  ┌─────────────────────────────────────────────────────┐│
│  │           CONTENT LIBRARY (Supabase)                 ││
│  │  Table: rtv_content                                 ││
│  │  • video_url (Cloudflare R2 / Stream playback)      ││
│  │  • thumbnail_url                                    ││
│  │  • title, description, category, tags               ││
│  │  • duration, resolution, language                   ││
│  │  • creator_id (human or 'AI-Venice')                ││
│  │  • view_count, like_count, tip_count                ││
│  │  • is_premium (free vs private chat tier)           ││
│  │  • created_at, expires_at                           ││
│  └──────────────────────┬──────────────────────────────┘│
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │         RECOMMENDATION FEED (Worker)                  ││
│  │  /api/feed/trending — most viewed last 24h           ││
│  │  /api/feed/new — latest uploads                      ││
│  │  /api/feed/ai — AI-generated channels                ││
│  │  /api/feed/live — currently live streams             ││
│  │  /api/feed/following — creators you follow           ││
│  │  /api/feed/premium — private chat experiences        ││
│  └──────────────────────┬──────────────────────────────┘│
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │      TELEGRAM MINI APP (Cloudflare Pages)             ││
│  │  Horizontal scroll feed (like TikTok/Tubi)           ││
│  │  Category tabs: For You | Live | AI | Trending       ││
│  │  Tap to play → video fills screen                    ││
│  │  Swipe up for next video                             ││
│  │  Double-tap to tip (Stars)                           ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### AI Content Generation Pipeline (Venice AI):

Venice AI can generate video. Confirmed working:
- API: POST https://api.venice.ai/api/v1/video/queue
- Cost: $0.95 for 5s 720p video
- Models: seedance-2-0-text-to-video, kling-v3 (4K)
- Max duration: 30 seconds
- Supports: text-to-video, image-to-video, reference-to-video, audio

### AI Channel Concept:

Instead of one-off videos, we create **AI channels** — automated content pipelines that generate videos on a schedule:

| Channel | Content | Schedule | Model |
|---------|---------|----------|-------|
| RTV News | Crypto/Web3 news summaries | 3x daily | seedance-2-0-text-to-video |
| RTV Market | Token price analysis videos | Hourly | seedance-2-0-text-to-video |
| RTV Education | AI/Web3 tutorial clips | Daily | seedance-2-0-text-to-video |
| RTV Culture | Urban culture highlights | 2x weekly | kling-v3 (4K) |
| RTV Promo | Ecosystem company promos | Weekly | seedance-2-0-text-to-video |

### AI Content Generation Flow:

```
1. Scheduled trigger (Supabase Cron or Base44 automation)
   ↓
2. Venice AI text model generates script from topic
   ↓
3. Venice AI video model generates 5-10s clip from script
   ↓
4. Video downloaded from Venice → uploaded to Cloudflare R2
   ↓
5. Metadata stored in Supabase rtv_content table
   ↓
6. Video appears in persistent feed for viewers
   ↓
7. Revenue: ad-supported (free) or premium (private chat)
```

### Content Storage:
- Videos: Cloudflare R2 bucket (already have 1 R2 bucket)
- Thumbnails: Cloudflare R2 or generate via Venice AI image models
- Metadata: Supabase rtv_content table (new table needed)
- Delivery: Cloudflare Stream playback URLs or R2 public URLs

### What needs to be built for Layer 2:
1. **rtv_content table** in Supabase (content library schema)
2. **AI content generation Worker** — scheduled job that calls Venice AI, downloads video, stores in R2
3. **Feed API endpoints** on rtv-stream Worker — /api/feed/trending, /api/feed/new, /api/feed/ai, /api/feed/live
4. **Feed UI** in Mini App — horizontal scroll, category tabs, video player
5. **Cloudflare R2 integration** — upload/download videos from the edge

### Estimated build time: 2-3 days (once Stream token is in)

---

## LAYER 3: ROKU APP — TV on the Big Screen

### The Real Constraint:
Roku's Direct Publisher program was **sunset January 2024**. You can no longer create a simple feed-based Roku channel. The only path is building a full **SceneGraph SDK app** in BrightScript — Roku's proprietary language.

### What This Means:
- A Roku app is a real development project (not a feed submission)
- BrightScript is similar to BASIC but with modern features
- SceneGraph uses XML + BrightScript for UI
- Video playback uses HLS or DASH (NOT WebRTC — Roku doesn't support WHIP/WHEP)
- Content must be in HLS/DASH format (Cloudflare Stream can transcode live → HLS)

### Roku App Architecture:

```
Roku Device
    │
    ├── SceneGraph App (BrightScript + XML)
    │   ├── Home Screen — content grid (trending, live, categories)
    │   ├── Video Player — HLS playback via roVideoPlayer
    │   ├── Search — Roku Search integration (MRSS feed)
    │   ├── Auth — Telegram ID linking (QR code or code entry)
    │   └── Monetization — Roku Pay (subscriptions) + Ads (RAF)
    │
    ├── Content Feed (JSON API from our Worker)
    │   ├── GET /api/roku/feed → MRSS-formatted content list
    │   ├── GET /api/roku/categories → category grid
    │   └── GET /api/roku/search → search results
    │
    └── Video Delivery
        ├── Live streams → Cloudflare Stream HLS output
        └── VOD content → Cloudflare R2 + HLS packaging
```

### Key Insight: Cloudflare Stream bridges WebRTC and HLS

When a creator goes live via WebRTC (WHIP), Cloudflare Stream automatically creates an HLS output. This means:
- Telegram Mini App viewers watch via WebRTC (sub-second latency)
- Roku viewers watch the SAME stream via HLS (2-5 second latency, but TV-grade)
- VOD content is stored as HLS by Cloudflare Stream for replay

This is the architecture that makes "TV on Telegram" real — one stream, two delivery methods.

### Roku Build Requirements:
1. Roku developer account ($0, register at developer.roku.com)
2. SceneGraph SDK app (BrightScript + XML)
3. MRSS content feed endpoint on our Worker
4. HLS video delivery (Cloudflare Stream handles this)
5. Roku Pay integration for premium subscriptions
6. Roku Advertising Framework for free tier ads
7. Certification testing before publication

### Estimated build time: 2-3 weeks (separate from Telegram launch)

---

## THE "PRIVATE CHAT" PREMIUM TIER

### What it is:
A premium content tier where viewers pay for private, 1-on-1 experiences with creators — similar to OnlyFans but on Telegram, using sovereign payments (Stars/TON/RTV).

### Architecture:

```
Free Tier (AVOD — like Tubi)
  ├── All public live streams
  ├── All public VOD content
  ├── AI-generated channels
  └── Ad-supported (or no ads — sovereign model)

Premium Tier (Private Chat — "X-Rates")
  ├── Private 1-on-1 video calls with creators
  ├── Exclusive premium VOD content
  ├── Direct messaging with creators
  ├── Custom video requests (creator records for viewer)
  ├── AI companion chat (Venice AI uncensored models)
  └── Payment: Telegram Stars / TON / RTV credits
```

### Premium Features:
1. **Private Video Call** — creator and viewer in a WebRTC room (2-person, not broadcast)
2. **Exclusive Content** — premium-tagged VOD only accessible to paying subscribers
3. **Direct Chat** — Telegram-based DM with creator (rate-limited for free, unlimited for premium)
4. **Custom Requests** — viewer pays RTV tokens for custom video from creator
5. **AI Companion** — Venice AI uncensored model as a chat companion (text + voice)

### Payment Flow:
```
Viewer taps "Go Private" → Telegram Stars invoice → payment confirmed
  → Private WebRTC room created → 1-on-1 video starts
  → Timer counts down (minutes purchased) → session ends when time expires
```

### Compliance:
- 18+ age gate (already built for Erotica platform)
- Creator verification (KYC via Supabase)
- Content moderation (AI + human review)
- Payment via sovereign rails only (no Stripe on adult content)

---

## THE ACTUAL TECH STACK — No Fiction

### Where Everything Is Hosted:

| Component | Hosted On | URL/Endpoint |
|-----------|-----------|-------------|
| Frontend SPA | Cloudflare Pages | rtv-frontend.pages.dev |
| Edge Gateway | Cloudflare Worker | rtv-edge-gateway.rotationtvaicom.workers.dev |
| Payments | Cloudflare Worker | rtv-payments.rotationtvaicom.workers.dev |
| Blockchain | Cloudflare Worker | rtv-blockchain.rotationtvaicom.workers.dev |
| Streaming | Cloudflare Worker | rtv-stream.rotationtvaicom.workers.dev |
| Console | Cloudflare Worker | rtv-bot-console.rotationtvaicom.workers.dev |
| Database | Supabase | xynkgaxfwvpcixissxdz.supabase.co |
| AI (text/image/video) | Venice AI | api.venice.ai |
| AI (text) | Anthropic | api.anthropic.com |
| AI (text) | Google Gemini | generativelanguage.googleapis.com |
| Bot 1 (Live) | Base44 edge function | @RotationLivestram_bot |
| Bot 2 (Erotica) | Base44 edge function | @ROTATIONEROTICA_BOT |
| Bot 3 (Agent) | Base44 webhook | @base44_229784_bot |
| Video Storage | Cloudflare R2 | (1 bucket active) |
| Video Delivery | Cloudflare Stream | (needs Stream:Edit token) |
| GitHub | GitHub.com | github.com/rotationtv1-crypto |
| Domain | DNS zones | rotationpay.net, rotationcall.net, rotationomega.org |

### What We Are NOT Using:
- ❌ Vercel (replaced by Cloudflare)
- ❌ MongoDB (replaced by Supabase Postgres)
- ❌ Stripe (purged — sovereign payments only)
- ❌ PayPal (purged)
- ❌ RTMP/OBS (replaced by WebRTC WHIP/WHEP)
- ❌ Next.js (we use React SPA, not SSR)
- ❌ Rails (we use Cloudflare Workers + React)

---

## LAUNCH SEQUENCE — What Actually Needs to Happen

### Phase 1: UNBLOCK STREAMING (Darrel action needed)
- [ ] Create Cloudflare token with Stream:Edit permission
- [ ] Send token to agent for injection into rtv-stream Worker
- [ ] Agent injects token → tests Live Input creation → confirms WHIP/WHEP works

### Phase 2: BUILD PERSISTENT FEED (Agent builds, 2-3 days)
- [ ] Create rtv_content table in Supabase (content library schema)
- [ ] Build feed API endpoints on rtv-stream Worker
- [ ] Build AI content generation pipeline (Venice AI → R2 → Supabase)
- [ ] Build feed UI in Mini App (horizontal scroll, categories, player)
- [ ] Set up Supabase Cron for scheduled AI content generation
- [ ] Test: AI generates 5s video → stored in R2 → appears in feed → viewer watches

### Phase 3: GO LIVE (Creator onboarding)
- [ ] Creator opens Mini App → taps "Go Live" → camera opens → streaming
- [ ] Live stream auto-recorded → saved as VOD after stream ends
- [ ] VOD appears in persistent feed for replay
- [ ] Gifts flow via Telegram Stars → 80/15/5 payout
- [ ] Test 10 creators going live simultaneously

### Phase 4: PREMIUM TIER
- [ ] Build "Go Private" feature (1-on-1 WebRTC rooms)
- [ ] Build exclusive content tagging in rtv_content table
- [ ] Build AI companion chat (Venice uncensored models)
- [ ] Build subscription tiers in Mini App
- [ ] Test: viewer pays Stars → private session starts → timer counts → ends

### Phase 5: ROKU APP (2-3 weeks, separate track)
- [ ] Register Roku developer account
- [ ] Build SceneGraph app (BrightScript + XML)
- [ ] Build MRSS feed endpoint on Worker
- [ ] Integrate Roku Pay for subscriptions
- [ ] Integrate Roku Advertising Framework for free tier
- [ ] Pass certification testing
- [ ] Publish to Roku Channel Store

### Phase 6: SCALE
- [ ] AI channels running 24/7 (Venice AI generating content on schedule)
- [ ] 100+ creators live streaming
- [ ] 10,000+ VOD titles in persistent feed
- [ ] Roku app live in Channel Store
- [ ] Marketing campaign across Telegram, X, TikTok, Discord
- [ ] $RTV token integrated into all payment flows

---

## WHAT I CAN BUILD RIGHT NOW (without the Stream token)

Even without the Stream:Edit token, I can start building Layer 2 (persistent feed):

1. **rtv_content table** in Supabase — content library schema
2. **AI content generation pipeline** — Venice AI → video → R2 → Supabase
3. **Feed API endpoints** — trending, new, AI, live categories
4. **Feed UI in Mini App** — horizontal scroll video player
5. **First AI-generated videos** — test Venice AI video generation end-to-end

This means the "Tubi on Telegram" persistent feed can start being built immediately, in parallel with unblocking the live streaming.

---

## COST ANALYSIS — Real Numbers

| Component | Cost | Notes |
|-----------|------|-------|
| Cloudflare Workers | $0 (free tier: 100K req/day) | We're well within limits |
| Cloudflare Pages | $0 (free tier) | Unlimited static hosting |
| Cloudflare R2 | $0.015/GB stored + $0 egress | Video storage |
| Cloudflare Stream | $5/1K min stored + $1/1K min delivered | After WebRTC GA |
| Supabase | $0 (free tier: 500MB DB, 50K MAU) | May need Pro ($25/mo) for scale |
| Venice AI | ~$0.95 per 5s video | $5.70 per 30s clip |
| Telegram Bot API | $0 | Free for bots |
| Base44 | Credits-based | Included in platform |
| Roku Developer | $0 | Free to publish |

### AI Content Cost Example:
- 5 AI channels × 3 videos/day × $0.95/video = $14.25/day
- Monthly: ~$427 for AI-generated content
- This produces 450 videos/month (5s each) = 37.5 minutes of content
- For 30s videos: $5.70 × 15/day = $85.50/day = ~$2,565/month
- This produces 450 videos/month (30s each) = 225 minutes of content

### Revenue Model:
- Free tier: Ad-supported (or sovereign — no ads, token-funded)
- Premium tier: $9.99-$49.99/month (Telegram Stars equivalent)
- Creator gifts: 80/15/5 split (creator/platform/agency)
- Token integration: $RTV used for tips, subscriptions, premium features

---

*RotationTV Network | Full Launch Playbook v4.0 | July 3, 2026*
*"Learn it. Live it. Love it. — We keep business rotating globally."*
*Presidential Authority: Darrel — Owner & CEO*
