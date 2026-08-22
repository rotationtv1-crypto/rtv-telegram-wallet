# Go Live — Production Architecture

## Flow

1. User opens **Go Live** in Mini App (`GoLiveModal.tsx`)
2. Browser/Telegram prompts **camera + mic** via `getUserMedia`
3. `POST /api/stream/create-input` → Cloudflare Stream `live_inputs`
4. Response includes `rtmp_url`, `stream_key`, `playback.hls`
5. `POST /api/streams/start` → Supabase `is_live: true`
6. Creator publishes (OBS or in-app) with RTMP URL + key
7. Viewers use HLS / CF playback

## Deploy handlers

Map routes on your Worker / Supabase Edge / Deno Deploy:

| Path | File |
|------|------|
| `POST /api/stream/create-input` | `src/functions/stream-create-input.ts` |
| `POST /api/streams/start` | `src/functions/streams-start.ts` |

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

## Response contract (locked to UI)

```json
{
  "success": true,
  "rtmp_url": "rtmps://live.cloudflare.com:443/live/...",
  "stream_key": "...",
  "playback": { "hls": "https://.../manifest/video.m3u8" },
  "cf_stream_uid": "...",
  "stream_id": "..."
}
```

## Related

- LiveKit parallel path: `wss://stream.rotationtv.network` + `rtv-livekit-agents`
- Issue #21 tracks this contract
