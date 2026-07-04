# rtv-edge-gateway

Edge gateway for RotationTV streaming + gifting. Targets the real Rotation Erotica schema.

## Auth Model

Uses **Supabase session tokens** (not raw Telegram initData). The Mini App client calls `telegram-auth-bridge` once to get a Supabase session, then passes `Authorization: Bearer <token>` to this worker.

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/api/stream/create` | Yes | Create live stream (CF Stream + live_rooms) |
| POST | `/api/stream/:id/end` | Yes | End stream (owner only) |
| GET | `/api/stream/:id/play` | No | Get WHEP playback URL |
| GET | `/api/streams` | No | List live streams |
| POST | `/api/gift/send` | Yes | Send gift (server-priced, no client amount) |
| POST | `/webhook/stream` | CF | Cloudflare Stream webhook |

## Security

- `transfer_rtv` only callable by service_role (client direct RPC blocked)
- Gift amounts priced server-side from `gifts` catalog (client never supplies amount)
- `live_rooms` stream credentials protected by trigger (creators can't overwrite)
- Rate limiting on gift sends (20/min via KV)

## Deploy

```bash
npm install
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put CF_STREAM_API_TOKEN
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_STREAM_SIGNING_KEY
npx wrangler secret put WEBHOOK_SECRET
npx wrangler deploy
```
