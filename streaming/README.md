# RTV WebRTC Streaming — Bigo/Tango Architecture

## NO RTMP. NO Stream Keys. Pure WebRTC.

### Files:
- `webrtc/whip-client.js` — Publisher (creator camera → Cloudflare Stream via WHIP)
- `webrtc/whep-client.js` — Viewer (Cloudflare Stream → viewer via WHEP)
- `mini-app/rtv-go-live.html` — One-tap Go Live Mini App interface
- `rtv_webrtc_streaming_playbook_v5_20260703.md` — Complete architecture guide

### How it works:
1. Creator taps "Go Live" in Telegram Mini App
2. Browser asks for camera permission
3. getUserMedia() captures camera + mic
4. POST to Cloudflare Stream API creates a Live Input
5. WHIP client publishes camera → Cloudflare edge via WebRTC
6. Viewers connect via WHEP — sub-second latency, unlimited viewers

### What's NOT used:
- ❌ RTMP (rtmp://live.cloudflare.com/live)
- ❌ Stream keys
- ❌ OBS or any encoding software
- ❌ SRT protocol

### Required secrets on rtv-stream Worker:
- CLOUDFLARE_STREAM_TOKEN (with Stream:Edit permission)
- CLOUDFLARE_ACCOUNT_ID
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_URL
