# RTV Network — Cloudflare-First Unified Deployment Blueprint
## No Vercel. Cloudflare for everything. June 2026

> "Learn it. Live it. Love it."

---

## ARCHITECTURE: CLOUDFLARE-ONLY

```
Telegram Mini App
    ↓
Cloudflare Workers (Edge)
    ├── Static Assets (SPA serving)
    ├── Durable Objects (real-time state)
    ├── Cloudflare Stream (RTMP + WebRTC)
    ├── R2 (asset storage)
    ├── Queues (async processing)
    ├── Analytics Engine
    ├── Browser Rendering (AI moderation)
    └── Workflows (durable payouts)
    ↓
Supabase (PostgreSQL + Realtime)
    ├── Database tables
    ├── Realtime subscriptions
    ├── Row-Level Security
    ├── Storage
    └── Auth (Telegram identity)
    ↓
Base44 Backend
    ├── 30+ Entities
    ├── Backend functions
    └── Automations
    ↓
TON / Solana Blockchain
    └── $RTVS / $RTV tokens
```

## WHY CLOUDFLARE (NOT VERCEL)

| Feature | Cloudflare | Vercel |
|---------|:----------:|:------:|
| Streaming (RTMP/WebRTC) | ✅ Native | ❌ None |
| Real-time WebSocket | ✅ Durable Objects | ❌ Not native |
| Edge compute | ✅ 300+ locations | ✅ Good |
| R2 storage | ✅ Zero egress | ❌ Separate |
| Browser Rendering | ✅ Native | ❌ None |
| Queues | ✅ Native | ❌ None |
| Analytics Engine | ✅ Native | ❌ None |
| Workflows | ✅ Native | ❌ None |
| Static sites | ✅ Pages | ✅ Core feature |
| Free tier | 100K req/day | 100GB bandwidth |

**Decision: All frontends move to Cloudflare Pages. All APIs run on Cloudflare Workers. Vercel is removed from the stack.**

---

## REPOSITORY → CLOUDFLARE MAPPING

| Repo | Current | Target | Config |
|------|---------|--------|--------|
| RotationTV-Live-AI-Clones | Cloudflare Worker | ✅ Already CF | wrangler.jsonc (8 bindings) |
| rotation-erotica-app | Vercel | Cloudflare Pages | wrangler.jsonc (Pages mode) |
| RotationErotica | Vercel/Next.js | Cloudflare Pages | Static export |
| rotation-erotica-backend | Base44 functions | Cloudflare Worker | Functions → Worker routes |
| RotationPay- | Vercel/standalone | Cloudflare Pages | wrangler.jsonc |
| Ai-University-Rotation-Omega- | Vercel | Cloudflare Pages | Static export |
| Rotation-mega-Plex- | Vercel | Cloudflare Pages | Static export |
| rtv-anthropic-worker | Cloudflare Worker | ✅ Already CF | APEX AI Gateway |

---

## CLOUDFLARE STREAM (Streaming Platform)

### How It Works
1. Creator pushes RTMP from OBS → Cloudflare Stream ingest
2. Cloudflare transcodes + records automatically
3. Viewers watch via WebRTC (WHEP) for sub-second latency
4. VOD stored in Cloudflare Stream (not R2)
5. AI moderation via Browser Rendering (frame capture every 5s)
6. Chat/tips/PK via StreamRoom Durable Object

### Pricing
- $5 per 1,000 minutes delivered
- $1 per 1,000 minutes stored
- Free tier: 5 minutes

### API Flow
```
POST /api/stream/create
  → Cloudflare Stream API (create live input)
  → Returns: RTMP URL + stream key + playback ID

GET /api/stream/:id
  → Returns: WebRTC playback URL

POST /api/stream/:id/end
  → Ends stream, saves recording
  → Updates Supabase + Base44
```

---

## SUPABASE (FULL FUNCTIONING)

### Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE pk_battles;
```

### Client-side subscription
```typescript
supabase.channel("streams")
  .on("postgres_changes", { event: "*", table: "live_streams" }, handler)
  .subscribe()
```

### RLS Policies
- Creators: SELECT/UPDATE own streams only
- Agencies: SELECT roster data
- Public: SELECT live streams where status = 'live'
- Admin (service role): ALL

---

## DEPLOYMENT SEQUENCE (Cloudflare-only)

### Step 1: RotationTV-Live-AI-Clones (already configured)
```bash
npx wrangler r2 bucket create rtv-assets
npx wrangler queues create tip-queue
npx wrangler queues create tip-queue-dlq
npx wrangler secret put OPENAI_API_KEY
npm run build && npx wrangler deploy
```

### Step 2: rotation-erotica-app → Cloudflare Pages
```bash
pnpm install
pnpm run build  # outputs to dist/public
npx wrangler pages deploy dist/public
```

### Step 3: RotationErotica → Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy out/  # Next.js static export
```

### Step 4: Other repos → Cloudflare Pages
```bash
# Each repo gets: build → wrangler pages deploy
npx wrangler pages deploy <output-dir>
```

### Step 5: Backend functions → Cloudflare Worker routes
```bash
# Move Base44 functions to Worker routes
# Or keep on Base44 and call from Worker via fetch()
```

### Step 6: Telegram bot webhook
```
Set webhook → Cloudflare Worker URL + /api/telegram
Set Mini App URL → Cloudflare Pages URL
```

---

## THE ULTIMATE LOOP (CLOUDFLARE-ONLY)

```
1. User opens Telegram Mini App
   → Cloudflare Pages serves SPA
2. User authenticates
   → Supabase auth (Telegram identity)
3. Creator goes live
   → Cloudflare Stream (RTMP ingest)
   → StreamRoom DO (WebSocket chat/tips)
   → Supabase realtime (viewer count)
4. Viewer sends tip
   → TIP_QUEUE → Payout Engine
   → Supabase transaction log
   → TON blockchain (if crypto)
5. AI moderation
   → Browser Rendering (frame capture)
   → RTVStreamAgent (OpenAI moderation)
   → Supabase audit log
6. Creator payout
   → CreatorPayoutWorkflow (durable)
   → TON transfer or crypto payout
   → Supabase payout record
```

NO VERCEL. NO LIVEKIT. NO AWS.
Just Cloudflare + Supabase + TON + Base44.

---
*RotationTV Network | Cloudflare-First Blueprint | Presidential Authority: Darrel*
