# RTV WebRTC Streaming Playbook — Bigo/Tango Architecture
## Deep Research Knowledge Logic Guide
### July 2, 2026 | Presidential Authority: Darrel

---

## EXECUTIVE SUMMARY

This playbook replaces ALL legacy RTMP/stream-key streaming with **WebRTC (WHIP/WHEP)** via Cloudflare Stream. Users tap "Go Live" → camera opens → they're live in <1 second. No OBS. No stream keys. No RTMP URLs. This is how Bigo Live and Tango work.

---

## ARCHITECTURE: How Bigo/Tango Actually Work

### What Bigo Live Does
1. User taps "Go Live" button in-app
2. App requests camera/mic permission (native iOS/Android or browser)
3. App opens front camera with beauty filters
4. Video streams via WebRTC to their CDN
5. Viewers tap stream → watch with <500ms latency
6. Gifts, tips, PK battles happen in real-time overlay
7. User taps "End" → stream stops, recording saved

### What We're Building (Same Architecture)
1. User taps "Go Live" in RTV Mini App
2. Browser calls `navigator.mediaDevices.getUserMedia()` → camera opens
3. WHIP client publishes to Cloudflare Stream via WebRTC
4. Cloudflare handles CDN distribution to unlimited viewers
5. Viewers watch via WHEP client → <1s latency
6. Gifts, tips, PK battles via existing RTV API
7. User taps "End Stream" → WebRTC connection closed

### Why NOT RTMP
- RTMP requires OBS or third-party encoder software
- RTMP has 2-10 second latency
- RTMP requires stream keys (security risk, user friction)
- RTMP is a 2009 protocol — dead technology
- WebRTC is the 2026 standard for real-time streaming
- Bigo, Tango, TikTok Live, Instagram Live all use WebRTC

---

## CLOUDFLARE STREAM WebRTC ARCHITECTURE

### Flow Diagram

```
CREATOR (Phone/Browser)          CLOUDFLARE EDGE           VIEWERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Tap "Go Live"                                                  
        │                                                         
        ▼                                                         
2. Mini App calls Worker API                                      
   POST /api/stream/create                                        
        │                                                         
        ▼                                                         
3. Worker calls CF Stream API                                     
   POST /live_inputs                                              
        │                                                         
        ▼                                                         
4. Returns WHIP URL + WHEP URL                                   
        │                                                         
        ▼                                                         
5. getUserMedia() opens camera                                   
        │                                                         
        ▼                                                         
6. WHIP Client → publishes to CF ───→ CF Stream CDN ───→ WHEP Client
   (WebRTC, <1s latency)              (unlimited viewers)   (browser)
        │                                                      │
        ▼                                                      ▼
7. Stream is LIVE                                         Viewer watches
   Gifts/tips/PK overlay                                   <1s latency
        │                                                      │
        ▼                                                      ▼
8. Tap "End Stream"                                        Stream ends
   RTCPeerConnection.close()                              
```

### API Endpoints (Cloudflare Worker)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stream/create` | POST | Create live input → returns WHIP + WHEP URLs |
| `/api/stream/list` | GET | List active streams |
| `/api/stream/:id` | GET | Get stream details + WHEP playback URL |
| `/api/stream/:id/end` | POST | End stream (delete live input) |
| `/api/gifts` | GET | List available gifts |
| `/api/tip/send` | POST | Send tip to creator |
| `/api/subscriptions/tiers` | GET | List subscription tiers |
| `/api/balance` | GET | Get user RTV balance |

### Cloudflare Stream API

**Create Live Input:**
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs
Authorization: Bearer {CF_API_TOKEN}
Content-Type: application/json

{
  "meta": { "name": "creator_12345_stream" },
  "recording": true
}
```

**Response:**
```json
{
  "uid": "1a553f11a88915d093d45eda660d2f8c",
  "webRTC": {
    "url": "https://customer-<CODE>.cloudflarestream.com/<SECRET>/webRTC/publish"
  },
  "webRTCPlayback": {
    "url": "https://customer-<CODE>.cloudflarestream.com/<INPUT_UID>/webRTC/play"
  }
}
```

**Delete Live Input (End Stream):**
```
DELETE https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs/{uid}
Authorization: Bearer {CF_API_TOKEN}
```

---

## MINI APP WebRTC IMPLEMENTATION

### Go Live Flow (Creator)

```javascript
// 1. Call API to create live input
const res = await fetch('/api/stream/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Stream', creator_id: 'tg_12345' })
});
const { whip_url, whep_url, stream_id } = await res.json();

// 2. Open camera
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user', width: 720, height: 1280 },
  audio: true
});

// 3. Show local preview
videoElement.srcObject = stream;
videoElement.muted = true; // mute local audio to prevent echo

// 4. Create WHIP client and start publishing
const whipClient = new WHIPClient(whip_url, videoElement);
// Stream is now LIVE — viewers can watch via whep_url

// 5. End stream
whipClient.close();
stream.getTracks().forEach(t => t.stop());
```

### Watch Flow (Viewer)

```javascript
// 1. Get stream info
const res = await fetch('/api/stream/' + streamId);
const { whep_url } = await res.json();

// 2. Create WHEP client and start watching
const whepClient = new WHEPClient(whep_url, videoElement);
// Video plays with <1s latency
```

### WHIP Client Implementation

```javascript
class WHIPClient {
  constructor(whipUrl, videoElement) {
    this.whipUrl = whipUrl;
    this.videoElement = videoElement;
    this.pc = null;
    this.localStream = videoElement.srcObject;
    this.start();
  }

  async start() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add tracks from the video element's stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIce();

    // POST to WHIP endpoint
    const response = await fetch(this.whipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: this.pc.localDescription.sdp
    });

    const answer = await response.text();
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answer
    });
  }

  waitForIce() {
    return new Promise(resolve => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        this.pc.addEventListener('icegatheringstatechange', () => {
          if (this.pc.iceGatheringState === 'complete') resolve();
        });
        // Timeout after 2s
        setTimeout(resolve, 2000);
      }
    });
  }

  close() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
```

### WHEP Client Implementation

```javascript
class WHEPClient {
  constructor(whepUrl, videoElement) {
    this.whepUrl = whepUrl;
    this.videoElement = videoElement;
    this.pc = null;
    this.start();
  }

  async start() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add transceiver for receiving video + audio
    this.pc.addTransceiver('video', { direction: 'recvonly' });
    this.pc.addTransceiver('audio', { direction: 'recvonly' });

    // Set up remote stream
    const remoteStream = new MediaStream();
    this.pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      this.videoElement.srcObject = remoteStream;
    };

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE
    await this.waitForIce();

    // POST to WHEP endpoint
    const response = await fetch(this.whepUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: this.pc.localDescription.sdp
    });

    const answer = await response.text();
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answer
    });
  }

  waitForIce() {
    return new Promise(resolve => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        this.pc.addEventListener('icegatheringstatechange', () => {
          if (this.pc.iceGatheringState === 'complete') resolve();
        });
        setTimeout(resolve, 2000);
      }
    });
  }

  close() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
```

---

## CLOUDFLARE WORKER (rtv-stream v4.0)

### Key Changes from v3:
- REMOVED: All RTMP URL generation
- REMOVED: All stream key generation
- ADDED: Cloudflare Stream API integration (create/delete live inputs)
- ADDED: WHIP URL + WHEP URL management
- ADDED: Stream state management (pending → live → ended)

### Environment Variables
```
CF_ACCOUNT_ID=7e431c541ea0f39d7f7fe5fd9f06eada
CF_STREAM_API_TOKEN=<Cloudflare API token with Stream permissions>
```

---

## FRONTEND VERIFICATION CHECKLIST

### 1. Build & Compile Check
```bash
cd /tmp/rtv-frontend && npm run build
# Verify: 0 errors, 0 warnings, dist/ folder generated
```

### 2. API Integration Test
- `/api/stream/create` → returns { whip_url, whep_url, stream_id }
- `/api/stream/list` → returns active streams array
- `/api/gifts` → returns 6 gift tiers with prices
- `/api/subscriptions/tiers` → returns 4 subscription tiers
- `/api/balance` → returns RTV balance

### 3. State Management Review
- User state: telegram_id from initData → localStorage persistence
- Stream state: idle → creating → live → ended
- Balance: updated after tip/buy actions
- Navigation: home → stream → gifts → wallet (no stale state)

### 4. UI/UX Flow Test
- Onboarding: Open Mini App → Telegram initData → home screen
- Go Live: Tap button → camera permission → preview → LIVE indicator
- Watch: Tap stream → WHEP player → video plays
- Gift: Tap gift → confirm → balance updates → toast notification
- Buy: Select Stars amount → Telegram invoice → balance updates

### 5. Mobile Responsiveness
- Viewport meta tag: width=device-width, maximum-scale=1.0
- Bottom navigation: fixed position, 4 items
- Cards: responsive grid (1fr 1fr on mobile)
- Video: full-width, aspect-ratio maintained
- Text: 11-22px range, readable on small screens

### 6. Auth & Session Test
- Telegram initData: HMAC-SHA256 verification on backend
- Session: telegram_id persisted in localStorage
- Token refresh: N/A (Telegram WebApp handles session)
- Logout: Clear localStorage → redirect to onboarding

---

## DEPLOYMENT STEPS

1. Deploy `rtv-stream` Worker v4.0 (WebRTC live input management)
2. Update Mini App with WHIP/WHEP clients
3. Build & deploy frontend to Cloudflare Pages
4. Wire bot commands to new stream API
5. Test: Go Live → Watch → Tip → End Stream

---

## COMPETITIVE COMPARISON

| Feature | Bigo Live | Tango | RTV (Ours) |
|---------|----------|-------|------------|
| Go Live | 1 tap | 1 tap | 1 tap |
| Protocol | WebRTC | WebRTC | WebRTC (WHIP) |
| Latency | <500ms | <500ms | <1s |
| Viewer Limit | Unlimited | Unlimited | Unlimited |
| Gifts | Yes | Yes | Yes (6 tiers) |
| PK Battle | Yes | Yes | Yes |
| Subscriptions | Yes | Yes | Yes (4 tiers) |
| Payments | In-app | In-app | Stars/TON/RTV |
| Beauty Filters | Yes | Yes | CSS filters (v1) |
| Multi-Guest | Yes | Yes | Phase 2 |
| Recording | Yes | Yes | Cloudflare auto |
| Crypto Rewards | No | No | ✅ RTV tokens |

### RTV Competitive Advantage
- **Only platform with crypto rewards** (RTV token for every action)
- **Sovereign payments** (no Stripe, no Apple/Google tax)
- **9-company ecosystem** (streaming + payments + AI + education + more)
- **Telegram-native** (2B+ users, no app store needed)

---

*RotationTV Network | WebRTC Streaming Playbook | July 2026*
*Presidential Authority: Darrel — Owner & CEO*
*"Learn it. Live it. Love it. — We keep business rotating globally."*
