# RTV Edge Gateway

Cloudflare Worker for the Rotation Erotica streaming + gifting platform.

## Auth Model

Uses **Supabase sessions** obtained via `telegram-auth-bridge` — NOT raw Telegram `initData`. The Mini App client calls the bridge once, gets a Supabase session, and passes `Authorization: Bearer <token>` to this worker.

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/stream/create` | Supabase | Create live stream (CF Stream + DB row) |
| POST | `/api/stream/:id/end` | Supabase | End stream (owner only) |
| GET | `/api/stream/:id/play` | None | Get WHEP playback URL |
| GET | `/api/streams` | None | List live streams |
| POST | `/api/gift/send` | Supabase | Send gift (server-priced, rate-limited) |
| POST | `/webhook/stream` | HMAC | Cloudflare Stream events |

## Security

- `transfer_rtv` restricted to service_role only — no client RPC calls
- Gift prices looked up server-side — no client-supplied amounts
- `live_rooms` server-controlled columns protected by trigger
- Rate limiting on gift sends (10/30s per user per room)

## Deploy

```bash
npm install
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_STREAM_TOKEN
npx wrangler secret put CF_STREAM_SIGNING_KEY
npx wrangler deploy
```
