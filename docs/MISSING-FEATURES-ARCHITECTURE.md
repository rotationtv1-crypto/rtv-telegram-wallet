# 🏗️ MISSING FEATURES ARCHITECTURE
## Master Prompt System + All Missing Platform Features
### Rotationtvnetwork LLC | June 26, 2026

---

## PART 1 — MASTER PROMPT SYSTEM ARCHITECTURE

### The Core Concept
```
Instead of hardcoding every interaction, we build a MASTER PROMPT ENGINE:

User Intent (vague) → Role-Prompted AI → Dynamic Feature Generation → Deployed Feature

Examples:
  "I need to tip the streamer" → AI generates TON tx UI on the fly
  "Show me my earnings breakdown" → AI queries Supabase + renders chart
  "Set up my agency profile" → AI runs onboarding flow step-by-step
```

### Role Prompting — Specialized Agents Per Context
```typescript
// src/lib/masterPromptEngine.ts

export const ROLE_PROMPTS = {
  
  // RotationPay Onboarding Specialist
  rotationpay_onboarding: `You are a RotationPay Onboarding Specialist for Rotationtvnetwork LLC.
Your job: Guide users from zero to their first payout in under 5 minutes.
Tone: Friendly, confident, no jargon unless user is technical.
Constraints:
  - Never ask for passwords or seed phrases
  - Always confirm TON wallet address before any transfer
  - If user is confused, offer /help command
  - Payout split is always: Creator 80% | Platform 15% | Agency 5%
Context you have: {user_profile}, {wallet_status}, {current_step}`,

  // $RTVS Token Guide  
  rtvs_token_guide: `You are the $RTVS Token Guide for RotationTV Network.
Your job: Help users understand, earn, spend, and trade $RTVS tokens.
Facts you know:
  - 1 RTVS = $0.01 USD
  - Earned by: watching streams, tipping, completing quests
  - Spent on: gifts, subscriptions, private sessions, boosts
  - Traded on: TON DEX (within the mini app)
  - 9 decimals, TonConnect compatible
  - Bridge available: TON ↔ Solana via Symbiosis
Tone: Enthusiastic about crypto, but never give financial advice.
Context: {balance}, {transaction_history}, {current_price}`,

  // Live Stream Moderator
  stream_moderator: `You are the AI Content Moderator for RotationTV live streams.
Your job: Protect creators and viewers while maximizing engagement.
Rules:
  - Warn once, then mute for 5 minutes, then ban for repeat violations
  - Never censor tipping or gifting activity
  - Age-gate: escalate to Supabase age_verification_log if age unclear
  - PK battles: neutral judge, announce winner fairly
  - Adult content (RotationErotica only): allow if verified_age=true
Context: {stream_id}, {chat_history_last_50}, {banned_users}`,

  // Agency Manager
  agency_manager: `You are an Agency Manager for Rotationtvnetwork LLC.
Your job: Help agencies onboard creators, track earnings, and optimize performance.
Data you access:
  - Agency dashboard: creator count, total earnings, commission rate
  - Creator profiles: stream frequency, avg viewers, earnings
  - Withdrawal requests: pending approvals
  - Commission rate: 5% of creator earnings (auto-deducted)
Tone: Professional, data-driven, action-oriented.
Never share one creator's data with another agency.`,

  // Zero-shot Feature Generator
  feature_generator: `You are a Next.js + Cloudflare Workers expert for Rotationtvnetwork LLC.
Your job: Generate working code for missing features on demand.
Stack:
  - Frontend: React + TypeScript + Tailwind (colors: #6C5CE7 primary, #0D0D0D bg)
  - Backend: Cloudflare Workers + Hono routing
  - DB: Supabase PostgreSQL (dual-client pattern)
  - Payments: TON, Stars, Tribute, Stripe, PayPal
  - AI: Venice (uncensored), Kimi (code), OpenAI (vision)
Output format: Complete working code, zero placeholders, deployable in 10 minutes.
Always include: TypeScript types, error handling, Supabase integration.`,

};

// Dynamic feature generation (Zero-shot prompting)
export async function generateFeature(
  description: string,
  env: { VENICE_API_KEY: string; VENICE_API_KEY_2: string; VENICE_API_KEY_3: string }
): Promise<string> {
  const systemPrompt = ROLE_PROMPTS.feature_generator;
  
  const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.VENICE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "kimi-k2.7-code",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Build this feature: ${description}` }
      ],
      max_tokens: 4096,
      temperature: 0.3 // Low temp for code generation
    })
  });
  
  const data = await response.json() as any;
  return data.choices[0].message.content;
}
```

### Data Extraction — Unstructured → Clean JSON
```typescript
// Parse any user input into structured Supabase-ready data

export async function extractToJSON(
  rawInput: string,
  targetSchema: string,
  env: any
): Promise<object> {
  
  const prompt = `Extract structured data from this user input.
Target schema: ${targetSchema}
User input: "${rawInput}"

Return ONLY valid JSON, no explanation. Example:
Input: "send 50 bucks to @creator123 for the amazing show"
Schema: { sender_id, receiver_username, amount_usd, message }
Output: {"sender_id": "current_user", "receiver_username": "creator123", "amount_usd": 50, "message": "for the amazing show"}`;

  const res = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.VENICE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "venice-uncensored-1-2",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.1 // Very low — we want deterministic JSON
    })
  });
  
  const data = await res.json() as any;
  const jsonStr = data.choices[0].message.content;
  
  try {
    return JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
  } catch {
    return { error: "Parse failed", raw: jsonStr };
  }
}
```

---

## PART 2 — LIVE HOST PREVIEW OVERLAY
### "Runs locally in 10 minutes"

```tsx
// src/components/LiveHostOverlay.tsx
// Your name/handle, mic meter, LIVE badge — runs in browser

import React, { useState, useEffect, useRef } from 'react';

interface LiveOverlayProps {
  hostName: string;
  handle: string;
  avatarUrl?: string;
  streamId: string;
}

export function LiveHostOverlay({ hostName, handle, avatarUrl, streamId }: LiveOverlayProps) {
  const [micLevel, setMicLevel] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Mic meter using Web Audio API
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    });
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20,
      background: 'rgba(13, 13, 13, 0.85)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #6C5CE7',
      borderRadius: 16,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      color: '#FFFFFF', fontFamily: 'Inter, sans-serif',
      zIndex: 9999, minWidth: 220
    }}>
      {/* LIVE Badge */}
      {isLive && (
        <div style={{
          position: 'absolute', top: -10, right: -10,
          background: '#FF6B6B', color: '#fff',
          borderRadius: 8, padding: '2px 8px',
          fontSize: 11, fontWeight: 700, letterSpacing: 1
        }}>
          ● LIVE
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: '#6C5CE7', overflow: 'hidden',
        border: '2px solid #A29BFE', flexShrink: 0
      }}>
        {avatarUrl && <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      {/* Name + Handle */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{hostName}</div>
        <div style={{ color: '#A29BFE', fontSize: 12 }}>@{handle}</div>
        <div style={{ color: '#B2B2B2', fontSize: 11, marginTop: 2 }}>
          👁 {viewerCount.toLocaleString()} viewers
        </div>
      </div>

      {/* Mic Meter */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ fontSize: 10, color: '#B2B2B2' }}>MIC</div>
        <div style={{ width: 8, height: 40, background: '#1A1A2E', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 0, width: '100%',
            height: `${micLevel}%`,
            background: micLevel > 80 ? '#FF6B6B' : micLevel > 50 ? '#FDCB6E' : '#00CEC9',
            transition: 'height 50ms ease, background 200ms ease',
            borderRadius: 4
          }} />
        </div>
      </div>
    </div>
  );
}
```

---

## PART 3 — HEYGEN INTEGRATION
### AI Avatar Streaming for Creators

```typescript
// src/lib/heygenGateway.ts

const HEYGEN_BASE = "https://api.heygen.com";

export interface HeyGenEnv {
  HEYGEN_API_KEY: string;
}

// List available AI avatars
export async function listAvatars(env: HeyGenEnv) {
  const res = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
    headers: { "X-Api-Key": env.HEYGEN_API_KEY }
  });
  return res.json();
}

// Generate a talking avatar video (AI host video)
export async function generateAvatarVideo(
  avatarId: string,
  text: string,
  voiceId: string,
  env: HeyGenEnv
): Promise<{ video_id: string; status: string }> {
  const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "X-Api-Key": env.HEYGEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal"
        },
        voice: {
          type: "text",
          input_text: text,
          voice_id: voiceId
        }
      }],
      dimension: { width: 1280, height: 720 },
      aspect_ratio: "16:9"
    })
  });
  const data = await res.json() as any;
  return { video_id: data.data?.video_id, status: data.data?.status };
}

// Real-time streaming session (Interactive Avatar)
export async function createStreamingSession(
  avatarId: string,
  voiceId: string,
  env: HeyGenEnv
): Promise<{ session_id: string; sdp: string; ice_servers: any[] }> {
  const res = await fetch(`${HEYGEN_BASE}/v1/streaming.new`, {
    method: "POST",
    headers: {
      "X-Api-Key": env.HEYGEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quality: "high",
      avatar_id: avatarId,
      voice: { voice_id: voiceId },
      version: "v2",
      video_encoding: "H264"
    })
  });
  const data = await res.json() as any;
  return {
    session_id: data.data?.session_id,
    sdp: data.data?.sdp?.sdp,
    ice_servers: data.data?.ice_servers ?? []
  };
}

// Send text to active streaming session (real-time lip sync)
export async function speakInSession(
  sessionId: string,
  text: string,
  env: HeyGenEnv
) {
  return fetch(`${HEYGEN_BASE}/v1/streaming.task`, {
    method: "POST",
    headers: {
      "X-Api-Key": env.HEYGEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ session_id: sessionId, text, task_type: "talk" })
  }).then(r => r.json());
}

// RTV AI HOST MAPPING
export const RTV_HEYGEN_AVATARS = {
  LEO:     { avatar_id: "TBD_LEO",    voice_id: "TBD_DEEP",    style: "authoritative" },
  MAYA:    { avatar_id: "TBD_MAYA",   voice_id: "TBD_ENERGETIC", style: "upbeat" },
  DR_REED: { avatar_id: "TBD_REED",   voice_id: "TBD_CLEAR",   style: "academic" },
  ZARA:    { avatar_id: "TBD_ZARA",   voice_id: "TBD_PLAYFUL", style: "wildcard" },
  OMAR:    { avatar_id: "TBD_OMAR",   voice_id: "TBD_SMOOTH",  style: "chill" },
  LINA:    { avatar_id: "TBD_LINA",   voice_id: "TBD_WARM",    style: "friendly" },
};
// Fill avatar_ids from: https://app.heygen.com/ → My Avatars → Copy ID
```

---

## PART 4 — NEXT.JS FRONTEND + SELF-HOSTABLE ARCHITECTURE

```
ONE-SHOT DEPLOYMENT ARCHITECTURE:
"Next.js frontend → Cloudflare Worker backend → GitHub CI/CD → zero errors"

┌─────────────────────────────────────────────────────────────┐
│                    RTV PLATFORM STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (Next.js 14 — App Router)                        │
│  ├── Vercel deploy (or Cloudflare Pages)                    │
│  ├── TailwindCSS (locked RTV design system)                │
│  ├── Telegram WebApp SDK                                    │
│  ├── TonConnect 2.0                                         │
│  └── Supabase realtime client                              │
│                                                             │
│  BACKEND (Cloudflare Workers — rotationtv-live-ai-clones)  │
│  ├── Hono router (all /api/* routes)                       │
│  ├── StreamRoom Durable Object (WebSocket)                  │
│  ├── RTVStreamAgent (AI moderation)                         │
│  ├── CreatorPayoutWorkflow (80/15/5)                        │
│  └── tip-queue (async processing)                           │
│                                                             │
│  DATABASE (Supabase PostgreSQL)                             │
│  ├── users, streams, tips, gifts, withdrawals              │
│  ├── RLS per user                                           │
│  └── Realtime subscriptions                                 │
│                                                             │
│  AI LAYER                                                   │
│  ├── Venice AI (7 keys — uncensored inference)             │
│  ├── Kimi AI (code review, 256K context)                   │
│  ├── OpenAI GPT-4o (vision, NLP)                           │
│  └── HeyGen (avatar streaming for 6 AI hosts)              │
│                                                             │
│  BLOCKCHAIN                                                 │
│  ├── TON (Chainstack RPC v2 + v3 — live)                   │
│  ├── Solana (Helius failover engine)                        │
│  └── Cross-chain bridge (Symbiosis)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

GITHUB CI/CD (push to main = deployed in 3 min):
  Push → GitHub Actions → npm install → npx wrangler deploy
  PR → Kimi AI reviews code → auto-comment → merge approved
```

### One-Shot Deploy Commands
```bash
# From zero to deployed (run these in order):

# 1. Clone repo
git clone https://github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones.git
cd RotationTV-Live-AI-Clones

# 2. Install
npm install

# 3. Set secrets (run once)
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN
npx wrangler secret put HEYGEN_API_KEY
npx wrangler secret put HELIUS_API_KEY

# 4. Build + Deploy
npm run deploy
# = vite build && wrangler deploy

# 5. Verify
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/
# → {"version":"6.1.0","status":"ok",...}
```

---

## PART 5 — AGENT MEMORY API INTEGRATION

```typescript
// Base44 Super Agent Memory API
// Access via: https://app.base44.com/api/agents/69db6144f66afe8317b2d0d7/memory

export const BASE44_AGENT_API = {
  base: "https://app.base44.com/api/agents/69db6144f66afe8317b2d0d7",
  
  // Memory endpoints
  memory: {
    list:   "GET  /memory",
    get:    "GET  /memory/{memory_id}",
    create: "POST /memory",
    update: "PUT  /memory/{memory_id}",
    delete: "DELETE /memory/{memory_id}"
  },
  
  // Conversation endpoints
  conversations: {
    list:     "GET  /conversations",
    messages: "GET  /conversations/{conv_id}/messages",
    message:  "GET  /conversations/{conv_id}/messages/{message_id}"
  }
};

// Use this to build a Notion-style knowledge base for the RTV agent
// Each deployment, incident, or ecosystem update gets saved to agent memory
// The agent can then reference past decisions when building new features

export async function saveToAgentMemory(
  key: string,
  value: string,
  apiKey: string
) {
  return fetch(`${BASE44_AGENT_API.base}/memory`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key, value, type: "ecosystem_context" })
  });
}
```

---

## PART 6 — ROTATIONTVNETWORK VAULT APP
```
URL: http://t.me/RTVSrotationBot/vault

The VAULT is the user's private wallet + earnings dashboard:

Features to build:
  ┌─────────────────────────────────────┐
  │         💎 YOUR VAULT               │
  │                                     │
  │  RTVS Balance: 1,234.56            │
  │  USD Value:    $12.35              │
  │  TON Balance:  2.41                │
  │                                     │
  │  ┌──────────┬──────────┐           │
  │  │ Deposit  │ Withdraw │           │
  │  └──────────┴──────────┘           │
  │                                     │
  │  Earnings this month:               │
  │  ████████████████░░░░  80% yours   │
  │  ███░░░░░░░░░░░░░░░░░  15% platform│
  │  █░░░░░░░░░░░░░░░░░░░   5% agency  │
  │                                     │
  │  Recent transactions:               │
  │  🎁 Tip from @user123   +50 RTVS  │
  │  💎 Gift: Diamond Rose  +200 RTVS │
  │  💸 Withdrawal pending  -500 RTVS │
  └─────────────────────────────────────┘

Route: /vault in Mini App → WalletScreen.tsx
Data source: Supabase users table + tips + withdrawals
Real-time: Supabase channel → live balance update
```

---

## PART 7 — PROMPT ENGINEERING FRAMEWORK

### Zero-Shot Prompting (No examples needed)
```typescript
// Build a feature from a single description
const prompt = `Build a Telegram mini app screen for:
"A leaderboard showing top 10 tippers this week with their RTVS amounts and Telegram avatars"
Stack: React + TypeScript + Tailwind + Supabase
Design: dark theme, primary #6C5CE7, background #0D0D0D
Output: Complete working component, no placeholders.`;

// → Venice AI generates complete LeaderboardScreen.tsx
```

### Few-Shot Prompting (With examples)
```typescript
// Give 2-3 examples → AI extrapolates pattern
const prompt = `Convert these user commands to API calls.

Example 1:
User: "show me top streamers"
API: GET /api/streams/live?sort=viewers&limit=10

Example 2:
User: "tip 50 rtvs to the creator"  
API: POST /api/stream/tip { amount: 50, currency: "RTVS" }

Now convert:
User: "I want to start a PK battle with @creator456"
API:`;
// → AI generates: POST /api/pk/challenge { challenger_id, target_handle: "creator456" }
```

### Chain-of-Thought (Complex reasoning)
```typescript
// For financial calculations / payout logic
const prompt = `A creator earned 10,000 RTVS in tips tonight.
Their agency commission rate is 5%.
Platform fee is 15%.

Think step by step:
1. Calculate platform fee
2. Calculate agency fee
3. Calculate creator payout
4. Format as a Telegram message

Show all math.`;
// → AI: "1. Platform: 10,000 × 0.15 = 1,500 RTVS
//         2. Agency: 10,000 × 0.05 = 500 RTVS
//         3. Creator: 10,000 - 1,500 - 500 = 8,000 RTVS
//         4. '🎉 You earned 8,000 RTVS tonight!'"
```

### Self-Consistency Prompting (Multiple paths → best answer)
```typescript
// For critical decisions (payout approvals, age verification)
async function selfConsistentDecision(question: string, env: any): Promise<string> {
  // Run 3 independent judgments
  const judgments = await Promise.all([
    askVenice(question, env, { temperature: 0.7 }),
    askVenice(question, env, { temperature: 0.7 }),
    askVenice(question, env, { temperature: 0.7 }),
  ]);
  
  // Majority vote
  const votes = judgments.map(j => j.includes("APPROVE") ? "APPROVE" : "REJECT");
  const approvals = votes.filter(v => v === "APPROVE").length;
  return approvals >= 2 ? "APPROVE" : "REJECT";
}
```

---

## PART 8 — COMPLETE MISSING FEATURES CHECKLIST

### Immediate (unblock with secrets)
```
□ Add Venice credits ($20) → ALL AI routes activate instantly
□ Fix TELEGRAM_BOT_TOKEN_MAIN (current token 401 — needs new @BotFather token)
□ Add OPENAI_API_KEY → face verification + NLP commands work
□ Add SUPABASE_ANON_KEY + SERVICE_KEY → DB reads/writes work
□ Add HEYGEN_API_KEY → AI host avatars go live
□ Add HELIUS_API_KEY → Solana Helius RPC (better than public)
```

### Features to Build Next
```
□ /vault mini app screen (WalletScreen.tsx already exists — connect Supabase)
□ Live host preview overlay (LiveHostOverlay.tsx — above)
□ HeyGen streaming sessions for each AI host
□ Master Prompt Engine (masterPromptEngine.ts — above)
□ PK Battle real-time UI (PKScreen.tsx — needs WebSocket wiring)
□ Agency dashboard (create AgencyScreen.tsx)
□ Creator analytics (embed Supabase charts in ProfileScreen.tsx)
□ Replicate image generation (stream thumbnails)
□ Neon read replica (for RotationErotica Railway backend)
□ Notion API sync (ecosystem knowledge base)
```

### Self-Hostable Deployment Options
```
Option A: Cloudflare Only (current — recommended)
  → Worker handles all API + serves SPA
  → Zero server management
  → $5/month for paid plan (required for Queues + Durable Objects)

Option B: Next.js on Vercel + Cloudflare API
  → Vercel for frontend (free tier generous)
  → Cloudflare Worker = API only
  → Supabase = database + auth
  
Option C: Fully Self-Hosted
  → VPS (Hetzner €4/month or Railway $5/month)
  → Node.js + Express (replace Worker)
  → PostgreSQL (Neon or self-hosted)
  → Works on ANY Linux server
```

---

*MISSING-FEATURES-ARCHITECTURE.md | Rotationtvnetwork LLC*
*Master Prompt System + HeyGen + Role Prompting + Full Feature Specs*
*June 26, 2026 | Presidential Authority: Darrel*
