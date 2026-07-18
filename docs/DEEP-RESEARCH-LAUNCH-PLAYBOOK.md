# 🧠 DEEP RESEARCH — FULL LAUNCH PLAYBOOK
## Rotationtvnetwork LLC | Presidential Authority: Darrel
## Systems Logic • Architecture Guides • Build Commands • Launch Sequence
## June 28, 2026 — Think Mode | Complete Knowledge Base

---

# TABLE OF CONTENTS

1. [How the Stack Works — Systems Logic](#1-systems-logic)
2. [Live Host Overlay — Build Now](#2-live-host-overlay)
3. [Creator Subscription & Content Vault](#3-subscription-vault)
4. [ML + Live Streaming Platform Architecture](#4-ml-streaming-arch)
5. [Next.js Frontend — Full Spec](#5-nextjs-frontend)
6. [AI Agent Orchestration — Master Prompt Engine](#6-prompt-engine)
7. [Tango-Style Feature Blueprint](#7-tango-features)
8. [Video Processing Pipeline](#8-video-pipeline)
9. [$RTVS Jetton Launch Guide](#9-rtvs-token)
10. [Zero to Deployed — One Shot Commands](#10-one-shot-deploy)
11. [Ecosystem Secrets Checklist](#11-secrets)
12. [Revenue & Monetization Engine](#12-monetization)
13. [Agency Management System](#13-agency)
14. [Error Playbook — Fix Every Known Error](#14-errors)
15. [Production Launch Sequence](#15-launch)

---

# 1. SYSTEMS LOGIC — HOW IT ALL CONNECTS

```
TELEGRAM USER
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  TELEGRAM MINI APP (React/Vite → dist/ → CF Assets)     │
│  URL: t.me/rotation_live_bot/app                        │
│  Screens: Home, Wallet, Discover, Gifts, PK, Profile    │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/WS
                      ▼
┌─────────────────────────────────────────────────────────┐
│  CLOUDFLARE WORKER  v6.1.3                              │
│  rotationtv-live-ai-clones.rotationtimmy.workers.dev    │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Venice  │ │   Kimi   │ │  Solana  │ │  Bridge  │  │
│  │  AI      │ │   AI     │ │  Engine  │ │ TON↔SOL  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   TON    │ │  HeyGen  │ │CostGuard │ │  KV Rate │  │
│  │  Routes  │ │ Gateway  │ │ +SIEM    │ │  Limiter │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │  StreamRoom  │  │  RTVStreamAgent (AI Moderation)│  │
│  │  Durable Obj │  │  Durable Object + AI reasoning │  │
│  └──────────────┘  └────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CreatorPayoutWorkflow — 80/15/5 durable steps   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  SUPABASE    │ │  TON     │ │  CLOUDFLARE  │
│  PostgreSQL  │ │ Chainstack│ │  STREAM      │
│  + RLS       │ │  RPC v2/3│ │  (RTMP/HLS)  │
│  + Auth      │ │          │ │              │
│  + Edge Fns  │ └──────────┘ └──────────────┘
└──────────────┘
```

## Data Flow — Tip Transaction
```
User taps "Gift" → React Component
  → POST /api/stream/tip { gift_id, amount_rtv }
  → Worker validates: KV rate limiter (20/min)
  → CostGuard checks daily spend
  → TIP_QUEUE.send({ stream_id, sender, receiver, amount })
  → StreamRoom DO broadcasts gift animation to all viewers
  → Queue Consumer triggers CreatorPayoutWorkflow
  → Workflow step 1: Supabase INSERT tips table
  → Workflow step 2: Update creator_wallet balance
  → Workflow step 3: 80/15/5 split calculation
  → Workflow step 4: Supabase UPDATE balances
  → Workflow step 5: Notify creator (Telegram bot)
```

## Data Flow — Live Stream
```
Creator taps "Go Live" → GoLiveModal.tsx
  → POST /api/stream/create-input → Cloudflare Stream API
  → Returns: RTMP URL + stream key
  → Creator connects OBS/mobile to RTMP
  → CF Stream: ingest → transcode → HLS segments → R2
  → StreamRoom DO: WebSocket room created for stream_id
  → RTVStreamAgent: AI moderation starts watching
  → Viewers connect via StreamPlayer.jsx → HLS.js playback
  → AgentChat.tsx: real-time gift/chat/moderation overlay
```

## Data Flow — AI Hosts
```
Stream starts → BroadcastGrid.jsx renders 2x3 grid
  → Each host: HeyGen avatar (streaming session)
  → AIHostEngine.js: TTS + fatigue simulation
  → Handoff detection: WebSocket message type="human_detected"
  → Active host plays exitLine → freezes → human takes over
  → Venice AI (ZARA slot): generates uncensored host lines
  → Kimi AI: code review + ecosystem analysis in background
```

---

# 2. LIVE HOST OVERLAY — BUILD NOW (10 MINUTES)

## What It Is
A transparent overlay on top of any stream showing:
- Host name/handle badge (bottom-left)
- LIVE badge with pulse animation (top-left)
- Mic meter (real-time audio level bar)
- Viewer count
- Running time

## Component Code
```tsx
// src/components/LiveHostOverlay.tsx
// Drop this onto any stream — runs locally in 10 min

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveHostOverlayProps {
  hostName: string;
  handle: string;
  viewerCount: number;
  streamStartTime: Date;
  isLive: boolean;
  avatarUrl?: string;
}

export function LiveHostOverlay({
  hostName,
  handle,
  viewerCount,
  streamStartTime,
  isLive,
  avatarUrl,
}: LiveHostOverlayProps) {
  const [duration, setDuration] = useState("00:00");
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // ── Stream timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - streamStartTime.getTime()) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setDuration(
        h > 0
          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, streamStartTime]);

  // ── Mic meter via Web Audio API ───────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, avg * 2.5));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.warn("Mic access denied — mic meter disabled");
      }
    })();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isLive]);

  const formatViewers = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── LIVE badge ── */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 flex items-center gap-2"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 rounded-full bg-red-500"
              style={{ boxShadow: "0 0 8px #FF4444" }}
            />
            <span
              className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
              style={{
                background: "#FF4444",
                color: "#fff",
                fontSize: "11px",
                letterSpacing: "0.15em",
              }}
            >
              LIVE
            </span>
            <span
              className="text-xs"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 6,
                backdropFilter: "blur(8px)",
              }}
            >
              {duration}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Viewer count ── */}
      <div
        className="absolute top-3 right-3"
        style={{
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: 8,
          backdropFilter: "blur(8px)",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>👁</span>
        <span>{formatViewers(viewerCount)}</span>
      </div>

      {/* ── Host badge + mic meter ── */}
      <div
        className="absolute bottom-4 left-3"
        style={{
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(12px)",
          borderRadius: 12,
          padding: "8px 12px",
          border: "1px solid rgba(108,92,231,0.4)",
          minWidth: 160,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={hostName}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
            />
          )}
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              {hostName}
            </div>
            <div style={{ color: "#A29BFE", fontSize: 12 }}>@{handle}</div>
          </div>
        </div>

        {/* Mic meter */}
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: `${micLevel}%` }}
              transition={{ duration: 0.05 }}
              style={{
                height: "100%",
                background: micLevel > 70
                  ? "#FF6B6B"
                  : micLevel > 40
                  ? "#FDCB6E"
                  : "#00CEC9",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
            🎙 {micLevel < 5 ? "MUTED" : "LIVE MIC"}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Usage — Drop It In
```tsx
// In StreamPlayer.jsx — wrap with relative position
<div className="relative w-full h-full">
  <video ref={videoRef} className="w-full h-full object-cover" />
  <LiveHostOverlay
    hostName={creator.display_name}
    handle={creator.username}
    viewerCount={viewerCount}
    streamStartTime={new Date(stream.started_at)}
    isLive={stream.status === "live"}
    avatarUrl={creator.avatar_url}
  />
</div>
```

---

# 3. CREATOR SUBSCRIPTION & CONTENT VAULT

## Architecture
```
Creator uploads content → R2 Storage (private)
Creator sets subscription tier ($9.99 / $29.99 / $99.99)
Fan pays → Stripe/TON/Stars
Supabase: INSERT subscriptions { fan_id, creator_id, tier, expires_at }
Fan requests content → Worker checks subscription
Worker: SELECT subscriptions WHERE fan_id=X AND creator_id=Y AND expires_at > NOW()
If valid → R2 signed URL (15 min expiry) → serve content
If invalid → 402 Payment Required + paywall UI
```

## Supabase Migration — Content Vault
```sql
-- Migration: 004_content_vault.sql

-- Content library
CREATE TABLE creator_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'photo', 'album', 'live_replay')),
  r2_key TEXT NOT NULL,          -- private R2 path
  thumbnail_r2_key TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  tier_required TEXT DEFAULT 'basic' CHECK (tier_required IN ('free', 'basic', 'pro', 'enterprise')),
  price_rtv INT DEFAULT 0,       -- for pay-per-view
  is_published BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
  price_usd DECIMAL(10,2) NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'ton', 'stars', 'paypal', 'tribute')),
  payment_ref TEXT,              -- Stripe subscription ID or TON tx hash
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fan_id, creator_id)
);

-- Pay-per-view access
CREATE TABLE ppv_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID REFERENCES users(id),
  content_id UUID REFERENCES creator_content(id),
  price_rtv INT NOT NULL,
  payment_ref TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: creators see own content, fans see subscribed content
ALTER TABLE creator_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators_own_content" ON creator_content
  USING (creator_id = auth.uid() OR is_published = true);

CREATE POLICY "active_subscriptions" ON creator_subscriptions
  USING (fan_id = auth.uid() OR creator_id = auth.uid());

-- Index for fast subscription checks
CREATE INDEX idx_subs_fan_creator ON creator_subscriptions(fan_id, creator_id);
CREATE INDEX idx_subs_expires ON creator_subscriptions(expires_at);
CREATE INDEX idx_content_creator ON creator_content(creator_id, is_published);
```

## Worker Route — Subscription Gate
```typescript
// Add to src/index.ts

// GET /api/content/:contentId — subscription-gated R2 access
if (pathname.startsWith("/api/content/") && request.method === "GET") {
  const contentId = pathname.split("/")[3];
  const fanId = request.headers.get("X-User-Id");
  
  if (!fanId) return json({ error: "Authentication required" }, 401);
  
  // Check subscription via Supabase
  const sub = await supabase.from("creator_subscriptions")
    .select("tier, expires_at")
    .eq("fan_id", fanId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .single();
  
  if (!sub.data) return json({ 
    error: "Subscription required", 
    subscribe_url: "/subscribe" 
  }, 402);
  
  // Get content + generate signed R2 URL
  const content = await supabase.from("creator_content")
    .select("r2_key, tier_required")
    .eq("id", contentId)
    .single();
  
  const tierRank = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  if (tierRank[sub.data.tier] < tierRank[content.data.tier_required]) {
    return json({ error: "Upgrade required", current: sub.data.tier }, 403);
  }
  
  // R2 signed URL (15 min)
  const signedUrl = await generateR2SignedUrl(env, content.data.r2_key, 900);
  return json({ url: signedUrl, expires_in: 900 });
}
```

---

# 4. ML + LIVE STREAMING PLATFORM ARCHITECTURE

## The Full Stack
```
INGEST LAYER
  Creator → OBS/Mobile → RTMP push
  → Cloudflare Stream (ingest endpoint per creator)
  → Auto-transcode: 1080p/720p/480p/360p (H.264 + H.265)
  → HLS segments → R2 storage
  → WebRTC (low latency mode <1s) for PK battles

DELIVERY LAYER
  → Cloudflare CDN (global edge)
  → HLS.js player in React (StreamPlayer.jsx ✅ exists)
  → Adaptive bitrate (ABR) — auto quality switch
  → DASH as fallback for iOS

ML LAYER (on Cloudflare Workers AI)
  Model 1: llama-guard-3-8b → content moderation frame-by-frame
  Model 2: whisper-large-v3 → real-time speech-to-text (chat captions)
  Model 3: flux-1-schnell → AI thumbnail generation
  Model 4: llama-3.3-70b → RTVStreamAgent AI brain
  Model 5: text-embeddings-ada-002 → semantic search (clip discovery)

REALTIME LAYER
  → StreamRoom Durable Object (WebSocket hub ✅ exists)
  → Channel types: chat | gift | pk | system | moderation
  → Fanout: 1 DO → 10,000 simultaneous viewers
  → PK battles: 2 DOs connected via Websocket bridge

ANALYTICS LAYER
  → Cloudflare Analytics Engine (STREAM_ANALYTICS binding ✅)
  → Events: view_start, view_end, gift_sent, chat_msg, pk_vote
  → Retention curves: minute-by-minute viewer drop-off
  → Creator dashboard: real-time + historical
```

## Workers AI — ML Integration
```typescript
// src/lib/workersAI.ts — ML pipeline on edge

export class WorkersAIEngine {
  constructor(private AI: Ai) {}

  // Real-time content moderation (runs on every chat message)
  async moderateText(text: string): Promise<{
    safe: boolean;
    category: string;
    confidence: number;
  }> {
    const result = await this.AI.run("@cf/meta/llama-guard-3-8b", {
      messages: [{ role: "user", content: text }]
    });
    const isSafe = result.response?.includes("safe") ?? true;
    return {
      safe: isSafe,
      category: isSafe ? "clean" : "violation",
      confidence: 0.95
    };
  }

  // Real-time speech captions (audio chunk → text)
  async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
    const result = await this.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio: [...new Uint8Array(audioBuffer)]
    });
    return result.text || "";
  }

  // AI thumbnail generation (from stream title + category)
  async generateThumbnail(prompt: string): Promise<ArrayBuffer> {
    const result = await this.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: `${prompt}, livestream thumbnail, vibrant, 16:9 ratio, no text`,
      num_steps: 4
    });
    return result.image as ArrayBuffer;
  }

  // Semantic search for stream discovery
  async embedQuery(text: string): Promise<number[]> {
    const result = await this.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: [text]
    });
    return result.data[0];
  }

  // AI host line generation (ZARA + others via Venice when live)
  async generateHostLine(
    host: string,
    context: string,
    veniceKey: string
  ): Promise<string> {
    const hostPersona = {
      LEO: "professional anchor, calm, authoritative",
      MAYA: "energetic, laughs, high-energy reactions",
      "DR. REED": "analytical, slow speech, thoughtful",
      ZARA: "wildcard, provocative, unfiltered",
      OMAR: "chill, laid-back, smooth delivery",
      LINA: "co-host, supportive, bridges conversation"
    }[host] || "professional";

    const res = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${veniceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "venice-uncensored-1-2",
        messages: [
          {
            role: "system",
            content: `You are ${host}, a live streaming AI host. Persona: ${hostPersona}. Generate ONE punchy line under 20 words. Context: ${context}`
          }
        ],
        max_tokens: 50,
        temperature: 0.9
      })
    });
    const d = await res.json() as any;
    return d.choices?.[0]?.message?.content || `${host} is live!`;
  }
}
```

---

# 5. NEXT.JS FRONTEND — FULL SPEC

## Why Next.js over Vite React
```
Current: Vite React → Telegram Mini App only
Next.js: 
  ✅ SSR/ISR → SEO for public stream pages
  ✅ App Router → file-based routing
  ✅ Server Components → no client JS for static parts
  ✅ Edge Runtime → deploy to Cloudflare Pages
  ✅ API Routes → thin BFF layer before CF Worker
  ✅ Image optimization → stream thumbnails
  ✅ Streaming UI → React Suspense with live data
```

## Project Structure
```
rotation-nextjs/
├── app/
│   ├── layout.tsx              # Root layout + theme
│   ├── page.tsx                # Home (discover streams)
│   ├── live/[streamId]/
│   │   └── page.tsx            # Live stream page
│   ├── creator/[handle]/
│   │   ├── page.tsx            # Creator profile
│   │   └── subscribe/page.tsx  # Subscription flow
│   ├── vault/page.tsx          # Content vault
│   ├── wallet/page.tsx         # $RTVS wallet
│   ├── broadcast/page.tsx      # AI 6-host broadcast grid
│   └── api/
│       ├── stream/route.ts     # Proxy to CF Worker
│       └── auth/route.ts       # Telegram auth verify
├── components/
│   ├── stream/
│   │   ├── StreamPlayer.tsx    # HLS.js player
│   │   ├── LiveChat.tsx        # WebSocket chat
│   │   ├── GiftPanel.tsx       # Gift sending UI
│   │   └── PKBattle.tsx        # PK battle progress bar
│   ├── creator/
│   │   ├── CreatorCard.tsx     # Stream preview card
│   │   ├── SubscribeModal.tsx  # Subscription modal
│   │   └── EarningsWidget.tsx  # Creator dashboard
│   ├── broadcast/
│   │   ├── BroadcastGrid.tsx   # 2x3 AI host grid
│   │   ├── HostCard.tsx        # Individual host
│   │   └── AIHostEngine.tsx    # TTS + fatigue sim
│   └── ui/
│       ├── LiveHostOverlay.tsx # ✅ Built in section 2
│       ├── RTVSBalance.tsx     # Token balance
│       └── GlassCard.tsx       # Glassmorphism card
├── lib/
│   ├── api.ts                  # CF Worker client
│   ├── supabase-client.ts      # Public Supabase client
│   └── ton-connect.ts          # TonConnect integration
└── styles/
    └── globals.css             # OKLch design tokens
```

## Deploy to Cloudflare Pages
```bash
# Install
npx create-next-app@latest rotation-nextjs --typescript --tailwind --app

# Add CF Pages adapter
npm install @cloudflare/next-on-pages
npm install -D wrangler

# next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { runtime: 'edge' }
}

# pages.config.json (wrangler-adjacent)
# Deploy:
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

---

# 6. AI AGENT ORCHESTRATION — MASTER PROMPT ENGINE

## Zero-Shot, Few-Shot, Chain-of-Thought

```
ZERO-SHOT: Ask model to do task with no examples
  Use for: content moderation, translation, classification
  Example: "Is this chat message harmful? Message: [text]"
  
FEW-SHOT: Give 2-3 examples before the task  
  Use for: gift description generation, host lines, bio writing
  Example:
    "Input: spicy_queen → Output: 🌶️ Spicy Queen lights up every room
     Input: crypto_king → Output: 👑 Crypto King rules the blockchain
     Input: [handle] → Output: ???"
     
CHAIN-OF-THOUGHT: Force model to reason step by step
  Use for: payout calculations, fraud detection, complex routing
  Example:
    "Think step by step:
     1. Creator earned 5000 RTVS this stream
     2. Platform takes 15% = 750 RTVS
     3. Agency takes 5% = 250 RTVS
     4. Creator receives 80% = 4000 RTVS
     Final answer: Transfer 4000 RTVS to creator wallet EQxxxx"
```

## Role Prompts Per Agent
```typescript
// Master prompt catalog — all 6 agent roles

SYSTEM PROMPTS = {
  
  stream_moderator: `
    You are RTV-MOD, the AI content moderator for RotationTV.
    Rules you enforce:
    - No doxxing (sharing personal info without consent)
    - No spam (same message 3x in 30 seconds = auto-mute)
    - No illegal content requests
    - Adult content: ALLOWED if stream.category = 'adult' AND viewer.verified_age = true
    - PK battles: stay neutral, count votes fairly
    Actions available: warn | mute_5min | mute_1hr | ban | escalate_human
    Always explain bans to the creator via Telegram.
    Current stream context: {stream_id} | Category: {category} | Creator: {creator_name}
  `,
  
  kimi_code_reviewer: `
    You are Kimi, the automated code reviewer for Rotationtvnetwork LLC.
    Stack: TypeScript, Cloudflare Workers, React, Supabase.
    Grade PRs on a scale A-F where:
    A = Production ready, no issues
    B = Minor improvements suggested
    C = Functional but needs refactor
    D = Has bugs, needs fixing before merge
    F = Do not merge — critical security or logic errors
    Focus on: security vulnerabilities, Supabase RLS bypass, secret exposure,
              revenue calculation errors (80/15/5), rate limit bypass.
    Output format: Grade: [A-F] | Summary: [1 sentence] | Issues: [bullet list]
  `,
  
  venice_zara: `
    You are ZARA, the wildcard AI host on RotationTV.
    Personality: Unfiltered, provocative, keeps it real, never boring.
    You can be edgy but never cruel. You entertain — always.
    Platform context: Live streaming, crypto tipping, 18+ verified users.
    Your lines should: shock slightly, make people react, drive tips.
    Max 15 words per line. End with energy.
    Never break character. Never explain your reasoning. Just be ZARA.
  `,
  
  payout_auditor: `
    You are the Payout Auditor for Rotationtvnetwork LLC.
    Every calculation must be exact. The formula is non-negotiable:
    Creator: 80% | Platform: 15% | Agency: 5%
    1 RTVS = $0.01 USD (fixed during beta)
    You verify: incoming tip amount → split → wallet deltas → Supabase records
    Flag discrepancies > 1 RTVS immediately to Darrel via Telegram.
    Never approve a payout with incomplete verification.
  `
}
```

---

# 7. TANGO-STYLE FEATURE BLUEPRINT

## Tango's Core Revenue Features (what we replicate)
```
Feature          | Tango Implementation    | RTV Implementation
─────────────────────────────────────────────────────────────────
Virtual Gifts    | Coins → gifts → cash    | RTVS tokens → gifts → 80%
PK Battles       | 2 creators compete      | PKScreen.tsx ✅ (enhance)
Subscription     | Monthly fan sub         | creator_subscriptions table
Private Shows    | 1-on-1 paid sessions    | RotationErotica private mode
Rankings         | Leaderboard weekly      | RanksScreen.tsx ✅ exists
Mining           | Watch-to-earn           | MiningScreen.tsx ✅ exists
Diamonds         | Withdraw to cash        | RTVS → TON → USDT
Agency Model     | 20% agency cut          | 5% agency (better for creators)
```

## PK Battle Enhancement
```typescript
// Current: PKScreen.tsx is basic
// Enhance: Add real-time progress bar + WebSocket sync

// WebSocket message types (StreamRoom.ts handles these):
type PKBattleMessage = {
  type: "pk_start" | "pk_vote" | "pk_end";
  creator_a: string;
  creator_b: string;
  creator_a_score: number;  // RTVS tipped
  creator_b_score: number;
  winner?: string;
  time_remaining: number;   // seconds
};
```

## Mining System Enhancement
```typescript
// Watch-to-earn: viewers earn RTVS for watching
// Current: MiningScreen.tsx exists but passive
// Enhance: Active mining events

type MiningEvent = {
  event_type: "quiz" | "prediction" | "reaction" | "watch_streak";
  reward_rtvs: number;    // 1-50 RTVS
  expires_in_seconds: 30; // urgent
  correct_answer?: string;
};

// Worker route to trigger mining:
// POST /api/mining/trigger { stream_id, event_type }
// → StreamRoom broadcasts mining event
// → Viewer responds within 30s
// → POST /api/mining/claim { event_id, user_id, answer }
// → Worker validates + credits RTVS
```

---

# 8. VIDEO PROCESSING PIPELINE

## Cloudflare Stream Full Setup
```bash
# 1. Create live input per creator
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/stream/live_inputs" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meta": { "name": "Creator: @handle" },
    "recording": { "mode": "automatic", "requireSignedURLs": true },
    "defaultCreator": "creator-id-here",
    "allowedOrigins": ["rotationtv.network", "*.rotationtimmy.workers.dev"]
  }'

# Response gives:
# uid: live input ID
# rtmps.url: rtmps://live.cloudflare.com:443/live/  
# rtmps.streamKey: creator's private key (store in Supabase)
# webRTC.url: WebRTC ingest URL (for mobile, <1s latency)
```

## R2 + Stream Integration
```bash
# Create R2 bucket for stream assets
npx wrangler r2 bucket create rtv-assets

# Add to wrangler.jsonc (uncomment R2 section):
# {
#   "binding": "ASSETS_BUCKET",
#   "bucket_name": "rtv-assets"
# }

# Custom domain for CDN:
# CNAME: assets.rotationtv.network → rtv-assets.rotationtimmy.workers.dev
```

## AI Thumbnail Generation Pipeline
```typescript
// Runs after stream ends (or on-demand)
async function generateStreamThumbnail(
  streamId: string,
  title: string,
  category: string,
  ai: Ai,
  bucket: R2Bucket
): Promise<string> {
  const prompt = `
    ${title} — ${category} live stream thumbnail.
    Style: vibrant, eye-catching, dark background (#0D0D0D),
    purple accent (#6C5CE7), professional streaming aesthetic.
    NO text in image. 16:9 aspect ratio.
  `;
  
  const image = await ai.run("@cf/black-forest-labs/flux-1-schnell", {
    prompt,
    num_steps: 4,
    guidance: 3.5
  });
  
  const key = `thumbnails/${streamId}.png`;
  await bucket.put(key, image.image, {
    httpMetadata: { contentType: "image/png" }
  });
  
  return `https://assets.rotationtv.network/${key}`;
}
```

---

# 9. $RTVS TOKEN LAUNCH GUIDE

## Phase 1: TON Jetton (TEP-74 Standard)
```bash
# Prerequisites
npm install -g @ton-community/blueprint
mkdir rtvs-token && cd rtvs-token
npm create ton@latest . -- --type func-empty

# blueprint.config.ts (use Chainstack endpoint)
export const config = {
  network: {
    endpoint: "CHAINSTACK_TON_RPC_V2",  // your live endpoint ✅
    type: "mainnet",
    version: "v2"
  }
};
```

## Token Parameters
```
Name:          RTV Sovereign
Symbol:        RTVS
Decimals:      9
Total Supply:  1,250,000,000 RTVS (1.25 billion)
Price (beta):  $0.01 USD = 1 RTVS
Distribution:
  40% — Platform rewards (mining, watch-to-earn)
  25% — Team (2-year vest, 6-month cliff)
  20% — Liquidity (TON DEX + Symbiosis bridge)
  10% — Creator incentives (first 6 months)
   5% — Reserve (emergencies)
```

## Deploy Commands
```bash
# 1. Compile contracts
npx blueprint build

# 2. Test on testnet first
npx blueprint test

# 3. Deploy minter to testnet
npx blueprint run deployJettonMinter --testnet

# 4. Fund testnet wallet (Chainstack MCP faucet)
# mcp_chainstack_request_testnet_funds({ network: "ton", address: "YOUR_ADDR" })

# 5. Verify seqno incremented (mint happened)
curl -s "CHAINSTACK_TON_RPC_V3/api/v3/jetton/masters?address=MINTER_ADDR"

# 6. Deploy to mainnet (when ready)
npx blueprint run deployJettonMinter --mainnet

# 7. Update worker secret:
echo "MINTER_ADDRESS_HERE" | npx wrangler secret put RTVS_MINT_TON
```

## Phase 2: Solana SPL Token
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Create token
spl-token create-token --decimals 9

# Create token account
spl-token create-account TOKEN_MINT_ADDRESS

# Mint initial supply (1.25B × 10^9)
spl-token mint TOKEN_MINT_ADDRESS 1250000000

# Update worker:
echo "SPL_TOKEN_MINT" | npx wrangler secret put RTVS_MINT_SOLANA

# Bridge is ready: /api/bridge/quote handles TON↔SOL ✅
```

---

# 10. ZERO TO DEPLOYED — ONE SHOT COMMANDS

## Current State: 7 endpoints live, 5 secrets needed

```bash
# ════════════════════════════════════════════════
# STEP 1: Get your secrets (manual — 10 minutes)
# ════════════════════════════════════════════════

# A) Venice AI credits → venice.ai/settings/api → Add $50
#    (instant unlock — 7 keys waiting, 90 models)

# B) OpenAI API key → platform.openai.com
export OPENAI_KEY="sk-..."

# C) Supabase keys → app.supabase.com → project → Settings → API
export SUPA_ANON="eyJ..."
export SUPA_SERVICE="eyJ..."

# D) New Telegram bot token → @BotFather → /newbot or /token
export TG_TOKEN_MAIN="7xxx:xxxx"

# E) HeyGen API key → app.heygen.com → Settings → API → Generate
export HEYGEN_KEY="..."

# F) Kimi (Moonshot) → platform.moonshot.ai → API Keys
export KIMI_KEY="sk-..."

# ════════════════════════════════════════════════
# STEP 2: Inject all secrets (30 seconds)
# ════════════════════════════════════════════════
cd rotationtv

echo "$OPENAI_KEY"   | npx wrangler secret put OPENAI_API_KEY
echo "$SUPA_ANON"    | npx wrangler secret put SUPABASE_ANON_KEY
echo "$SUPA_SERVICE" | npx wrangler secret put SUPABASE_SERVICE_KEY
echo "$TG_TOKEN_MAIN"| npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
echo "$HEYGEN_KEY"   | npx wrangler secret put HEYGEN_API_KEY
echo "$KIMI_KEY"     | npx wrangler secret put KIMI_API_KEY

# ════════════════════════════════════════════════
# STEP 3: Run Supabase migrations
# ════════════════════════════════════════════════
npx supabase db push --db-url "postgresql://postgres:[SERVICE_KEY]@db.xynkgaxfwvpcixissxdz.supabase.co:5432/postgres"

# ════════════════════════════════════════════════
# STEP 4: Set Telegram webhook
# ════════════════════════════════════════════════
curl "https://api.telegram.org/bot$TG_TOKEN_MAIN/setWebhook?url=https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/webhook"

# ════════════════════════════════════════════════
# STEP 5: Deploy final build
# ════════════════════════════════════════════════
npx wrangler deploy

# ════════════════════════════════════════════════
# STEP 6: Verify ALL endpoints
# ════════════════════════════════════════════════
BASE="https://rotationtv-live-ai-clones.rotationtimmy.workers.dev"
for ep in / /api/venice/health /api/kimi/health /api/ton/metrics /api/solana/health /api/bridge/health /api/heygen/health; do
  echo "$ep → $(curl -s $BASE$ep | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("status","ok"))')"
done
```

---

# 11. ECOSYSTEM SECRETS CHECKLIST

## Complete Secrets Map

| Secret | Where to Get | Where It Goes | Status |
|--------|-------------|---------------|--------|
| VENICE_API_KEY | venice.ai | CF Worker ✅ | needs credits |
| VENICE_API_KEY_2/_3/_4/_6/_7 | same | CF Worker ✅ | needs credits |
| KIMI_API_KEY | platform.moonshot.ai | CF Worker | wrong key |
| OPENAI_API_KEY | platform.openai.com | CF Worker | missing |
| SUPABASE_ANON_KEY | app.supabase.com | CF Worker | missing |
| SUPABASE_SERVICE_KEY | app.supabase.com | CF Worker | missing |
| TELEGRAM_BOT_TOKEN_MAIN | @BotFather | CF Worker ✅ | 401 (revoked) |
| TELEGRAM_BOT_TOKEN_EROTICA | @BotFather | CF Worker ✅ | live |
| CHAINSTACK_TON_RPC_V2 | console.chainstack.com | CF Worker ✅ | live |
| CHAINSTACK_TON_RPC_V3 | console.chainstack.com | CF Worker ✅ | live |
| HEYGEN_API_KEY | app.heygen.com | CF Worker | missing |
| HELIUS_API_KEY | helius.dev (free) | CF Worker | missing |
| MASTER_CF_TOKEN | CF Dashboard | CF Worker ✅ | live |
| REQUEST_SIGNING_SECRET | generated ✅ | CF Worker ✅ | live |
| GITHUB_TOKEN | github.com/settings | GitHub Actions | missing |
| CLOUDFLARE_API_TOKEN | CF Dashboard | GitHub Actions | in secrets |
| RTVS_MINT_TON | after token deploy | CF Worker | pending |
| RTVS_MINT_SOLANA | after token deploy | CF Worker | pending |
| PLATFORM_WALLET_SOL | solana keygen | CF Worker | pending |
| PLATFORM_WALLET_TON | tonkeeper | CF Worker | pending |

## GitHub Actions Secrets (repo: RotationTV-Live-AI-Clones)
```
Settings → Secrets → New repository secret:
  CLOUDFLARE_API_TOKEN = cfat_REDACTED
  CLOUDFLARE_ACCOUNT_ID = 947b01a53876bee16fa0e8360c880aca
  OPENAI_API_KEY = sk-...
  KIMI_API_KEY = sk-... (from moonshot.ai)
```

---

# 12. REVENUE & MONETIZATION ENGINE

## 9 Revenue Streams Mapped
```
1. LIVE TIPS (primary)
   Creator earns RTVS from live gifts → 80/15/5 split ✅
   Implementation: TIP_QUEUE → CreatorPayoutWorkflow ✅

2. SUBSCRIPTIONS
   Fan pays monthly → unlocks creator vault
   Tiers: $9.99 / $29.99 / $99.99 ← match RotationPay plans
   Implementation: creator_subscriptions table (build section 3)

3. PAY-PER-VIEW  
   One-time content purchase (RTVS or fiat)
   ppv_access table (build section 3)
   
4. PK BATTLE WAGERS
   Viewers bet RTVS on creator A vs B
   Winner fan pool: 90% to backers, 10% to platform
   
5. WATCH-TO-EARN (Mining)
   Viewers earn 1-5 RTVS per 10 min watched
   Costs platform ~$0.001/viewer/hr at scale
   
6. AGENCY COMMISSION
   5% of all creator earnings via agency
   auto-deducted in CreatorPayoutWorkflow ✅

7. PLATFORM SUBSCRIPTION (Enterprise)
   RotationErotica agencies: $99.99/mo
   Full API access + white-label widget

8. TRIBUTE INTEGRATION
   tribute.co.uk API for direct creator payments
   5% platform fee on all tribute payments

9. $RTVS TOKEN
   Platform earns on: bridge fees (0.3%), DEX LP fees,
   initial token sale, staking rewards
```

## Daily Revenue Calculator
```typescript
function dailyRevenue(metrics: {
  liveViewers: number;
  avgTipPerViewer: number;  // RTVS
  subscribers: number;
  avgSubTier: number;       // $ USD
  pkBattles: number;
  avgPKWager: number;       // RTVS
}) {
  const RTVS_USD = 0.01;
  
  const tipRevenue = metrics.liveViewers * metrics.avgTipPerViewer * RTVS_USD * 0.15;
  const subRevenue = metrics.subscribers * metrics.avgSubTier / 30;  // daily
  const pkRevenue = metrics.pkBattles * metrics.avgPKWager * RTVS_USD * 0.10;
  
  return {
    tips: tipRevenue.toFixed(2),
    subs: subRevenue.toFixed(2),
    pk: pkRevenue.toFixed(2),
    total: (tipRevenue + subRevenue + pkRevenue).toFixed(2)
  };
}

// Example: 1000 viewers, 50 RTVS avg tip, 200 subscribers @ $29.99, 10 PKs @ 1000 RTVS
// Tips: 1000 × 50 × 0.01 × 0.15 = $75/day
// Subs: 200 × $29.99 / 30 = $200/day
// PK: 10 × 1000 × 0.01 × 0.10 = $10/day
// Total: $285/day = $8,550/month
```

---

# 13. AGENCY MANAGEMENT SYSTEM

## Data Model
```sql
-- agencies table (already in migration 002)
-- Add these:

CREATE TABLE agency_creators (
  agency_id UUID REFERENCES agencies(id),
  creator_id UUID REFERENCES users(id),
  commission_rate DECIMAL DEFAULT 0.05,  -- 5%
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  PRIMARY KEY (agency_id, creator_id)
);

-- Agency dashboard view
CREATE VIEW agency_dashboard AS
SELECT 
  a.id as agency_id,
  a.name as agency_name,
  COUNT(DISTINCT ac.creator_id) as creator_count,
  SUM(t.amount_rtv * 0.05) as total_commission_rtvs,
  SUM(t.amount_rtv * 0.05 * 0.01) as total_commission_usd
FROM agencies a
JOIN agency_creators ac ON a.id = ac.agency_id
JOIN tips t ON t.receiver_id = ac.creator_id
GROUP BY a.id, a.name;
```

## 9 Companies in Ecosystem
```
1. rotationtv-network    → Main streaming platform
2. rotationpay          → Payment rails (Stripe + TON + Stars)
3. rotationcall         → WebRTC 1-on-1 video (CF Calls)
4. rtv-university       → Creator education + courses  
5. bigo-agency          → Creator agency (manages live streamers)
6. white-logistics      → Physical merchandise + shipping
7. pretrial-services    → Legal/compliance (age verification)
8. emergentlabs         → R&D (AI research, new features)
9. openclaw             → Open source tools + SDK
```

---

# 14. ERROR PLAYBOOK — FIX EVERY KNOWN ERROR

## Error 1: Kimi `key_set_but_unreachable`
```bash
# Cause: Wrong key format (CF token injected instead of Moonshot sk-)
# Fix:
# 1. Go to platform.moonshot.ai → API Keys → Create
# 2. Key starts with: sk-
echo "sk-YOUR_MOONSHOT_KEY" | npx wrangler secret put KIMI_API_KEY
# 3. Test:
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health
# Expected: { "status": "ok" }
```

## Error 2: Venice `402 Payment Required` on all completions
```bash
# Cause: $0 credits on all Venice keys
# Fix: venice.ai/settings/api → Add Payment → $50 minimum
# All 7 keys share the same account balance — one payment unlocks all
# Test immediately after payment:
curl -X POST "https://api.venice.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"venice-uncensored-1-2","messages":[{"role":"user","content":"test"}],"max_tokens":5}'
# Expected: { "choices": [{ "message": { "content": "Hello..." }}]}
```

## Error 3: Telegram Bot `401 Unauthorized`
```bash
# Cause: Bot token was revoked or regenerated
# Fix:
# 1. Telegram → @BotFather → /mybots → @RotationTVNetwork_bot → API Token → Revoke + Generate
# 2. Copy new token (format: 7xxxxx:xxxxx)
echo "NEW_TOKEN_HERE" | npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
# 3. Re-set webhook:
curl "https://api.telegram.org/botNEW_TOKEN/setWebhook?url=https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/telegram/webhook"
```

## Error 4: Wrangler v4 Queue Format Error
```bash
# Cause: v4 changed queue binding format
# Old (broken): { "binding": "TIP_QUEUE", "name": "tip-queue" }
# Fixed (✅ already in wrangler.jsonc): { "binding": "TIP_QUEUE", "queue": "tip-queue" }
# This is already fixed in v6.1.3
```

## Error 5: SPA Assets Swallowing API Routes
```bash
# Cause: assets.run_worker_first not set
# Fixed (✅ already): "run_worker_first": true in wrangler.jsonc assets block
# If still happening: check pathname starts with /api/ in index.ts routing
```

## Error 6: Supabase `row-level security violation`
```bash
# Cause: Using anon key for admin operations
# Fix: Use service key for server-side operations
# Pattern (enforced in supabase.ts):
#   Browser → public client (anon key) → RLS enforced
#   Worker  → admin client (service key) → RLS bypassed
const adminClient = createClient(url, SERVICE_KEY);  // ✅ worker-side only
const publicClient = createClient(url, ANON_KEY);     // ✅ browser-side only
```

## Error 7: TON Transaction Not Found
```bash
# Cause: TON finality is ~5 seconds — check too fast
# Fix: Poll with 6s delay
const waitForTONTx = async (txHash: string) => {
  await new Promise(r => setTimeout(r, 6000));
  const res = await fetch(`${CHAINSTACK_TON_RPC_V3}/api/v3/transactions?hash=${txHash}`);
  return res.json();
};
```

## Error 8: R2 403 Forbidden on Signed URL
```bash
# Cause: R2 bucket not activated or ASSETS_BUCKET binding missing
# Fix:
# 1. Cloudflare Dashboard → R2 → Create bucket "rtv-assets"
# 2. Uncomment R2 section in wrangler.jsonc
# 3. redeploy: npx wrangler deploy
```

## Error 9: Durable Object `class not exported`
```bash
# Cause: Old wrangler format vs v4 export requirements
# Fix: Ensure index.ts exports:
export { StreamRoom } from "./agents/StreamRoom";
export { RTVStreamAgent } from "./agents/RTVStreamAgent";
# Both already correct in v6.1.3 ✅
```

## Error 10: Analytics Engine `503 Service Unavailable`
```bash
# Cause: Analytics Engine binding referenced but not activated
# Fix: Comment out STREAM_ANALYTICS in wrangler.jsonc until enabled:
# Cloudflare Dashboard → Workers → Analytics Engine → Enable
# Then uncomment: { "binding": "STREAM_ANALYTICS", "dataset": "rtv_events" }
```

---

# 15. PRODUCTION LAUNCH SEQUENCE

## Phase 1 — Brain Activation (TODAY, 30 min)
```
□ 1. Add Venice credits ($50) → venice.ai/settings/api
     → All 7 AI keys unlock instantly
     → Test: /api/venice/health → status: "active"

□ 2. Get real Kimi key → platform.moonshot.ai
     → echo "sk-..." | npx wrangler secret put KIMI_API_KEY
     → Test: /api/kimi/health → status: "ok"

□ 3. Get OpenAI key → platform.openai.com
     → echo "sk-..." | npx wrangler secret put OPENAI_API_KEY
     → Unlocks: face verification, TTS, vision analysis
```

## Phase 2 — Database Live (30 min)
```
□ 4. Get Supabase keys → app.supabase.com → xynkgaxfwvpcixissxdz → Settings → API
     → echo "eyJ..." | npx wrangler secret put SUPABASE_ANON_KEY
     → echo "eyJ..." | npx wrangler secret put SUPABASE_SERVICE_KEY

□ 5. Run migrations
     → Supabase Dashboard → SQL Editor → paste 001, 002, 003 migrations
     → Run each in order

□ 6. New Telegram bot token
     → @BotFather → @RotationTVNetwork_bot → API Token
     → echo "7xxx:xxx" | npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
     → Set webhook (command above)
```

## Phase 3 — Avatars + Stream (1 hour)
```
□ 7. HeyGen API key → app.heygen.com → Settings → API → Generate
     → echo "..." | npx wrangler secret put HEYGEN_API_KEY
     → Test: /api/heygen/health → status: "key_set"

□ 8. Enable R2
     → CF Dashboard → R2 → Create bucket "rtv-assets"
     → Uncomment R2 in wrangler.jsonc → npx wrangler deploy

□ 9. Enable Cloudflare Stream
     → CF Dashboard → Stream → Enable
     → Test live input creation via /api/stream/create-input
```

## Phase 4 — Token Launch (2-3 hours)
```
□ 10. Deploy $RTVS Jetton on TON testnet
      → npm create ton@latest rtvs-token
      → npx blueprint deploy --testnet
      → Test transfers + verify metadata

□ 11. Deploy to TON mainnet
      → npx blueprint deploy --mainnet
      → echo "MINTER_ADDR" | npx wrangler secret put RTVS_MINT_TON

□ 12. Deploy $RTVS SPL on Solana
      → spl-token create-token --decimals 9
      → echo "MINT_ADDR" | npx wrangler secret put RTVS_MINT_SOLANA
      → Bridge ready: /api/bridge/quote ✅
```

## Phase 5 — Full Launch (24-48 hours)
```
□ 13. RotationErotica Railway deploy
      → Railway.app → New project → GitHub → RotationErotica
      → Set env: SUPABASE_URL, SERVICE_KEY, VENICE_API_KEY, etc.

□ 14. Content vault migration (section 3 SQL)
      → Paste 004_content_vault.sql into Supabase SQL editor

□ 15. Next.js frontend deploy (section 5)
      → Next.js → CF Pages → custom domain: rotationtv.network

□ 16. Announce on Telegram
      → @RotationTVNetwork_bot broadcasts: "🚀 RotationTV is LIVE"
      → Include mini app link, RTVS price, first stream scheduled
```

---

# APPENDIX: DESIGN SPEC LOCKED VALUES

```
Colors (DO NOT CHANGE):
  Primary:    #6C5CE7  oklch(57% 0.24 289)
  Secondary:  #A29BFE  oklch(72% 0.16 289)
  Accent:     #00CEC9  oklch(76% 0.14 190)
  Background: #0D0D0D  oklch(6% 0.005 289)
  Surface:    #1A1A2E  oklch(12% 0.02 265)
  Card:       #16213E  oklch(16% 0.02 240)
  Text:       #FFFFFF / #B2B2B2

Fonts:
  Primary: Inter (400/500/600/700/800)
  Mono:    JetBrains Mono

Border Radius: 8/12/16/24px scale

AI Hosts (LOCKED):
  LEO    — pos 0 — Anchor — calm professional
  MAYA   — pos 1 — Energetic — high energy
  DR.REED— pos 2 — Analyst — measured deep
  ZARA   — pos 3 — Wildcard — unfiltered
  OMAR   — pos 4 — Chill — smooth delivery
  LINA   — pos 5 — Co-Host — bridges conversation

Revenue (IMMUTABLE): 80% creator / 15% platform / 5% agency
Token: $RTVS | 9 decimals | 1 RTVS = $0.01 | TonConnect

Worker URL: https://rotationtv-live-ai-clones.rotationtimmy.workers.dev
Version: v6.1.3 | ID: 94b8184f-cae3-499f-8d91-7b3bae98159a
```

---

*Rotationtvnetwork LLC | Presidential Authority: Darrel | June 28, 2026*
*Deep Research Edition — All Systems Logic, Playbooks & Build Guides*
