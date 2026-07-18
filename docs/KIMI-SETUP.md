# 🤖 KIMI AI INTEGRATION — ROTATIONTVNETWORK LLC
> Moonshot AI | Presidential Authority: Darrel | 2026

---

## What Kimi Does in This Ecosystem

Kimi is the **third AI provider** alongside GPT-4o and Cloudflare Workers AI.

| Task | Model | Where Used |
|------|-------|-----------|
| Code review + generation | kimi-k2.7-code | All PRs, live dev assist |
| Strategic analysis | kimi-k2.5 | CEO dashboard, ecosystem insights |
| Broadcast host lines | kimi-k2.5 | AI host script generation |
| Stream chat moderation | kimi-k2.5 | Fast fallback for high-volume chats |
| Document extraction | moonshot-v1-128k | Long contract/doc processing |

---

## Step 1 — Get Your KIMI_API_KEY

1. Go to: **https://platform.moonshot.ai**
2. Register / Login with Google or email
3. Click **"API Key Management"** in the sidebar
4. Click **"Create API Key"**
5. Name it: `RTV-Production`
6. Copy the key — starts with `sk-...`

---

## Step 2 — Add the Key Everywhere

### Cloudflare Worker (Main Platform)
```bash
cd rotationtv
npx wrangler secret put KIMI_API_KEY
# Paste: sk-your-kimi-key
```

### GitHub Actions (PR Auto-Review)
```
1. Go to: github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones
2. Settings → Secrets and variables → Actions
3. New repository secret:
   Name:  KIMI_API_KEY
   Value: sk-your-kimi-key
```

### Token Manager Worker (for external agents)
```bash
npx wrangler secret put KIMI_API_KEY \
  --name rtv-token-manager
# Paste: sk-your-kimi-key
```

---

## Step 3 — Verify Connection

After deploying:
```bash
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health
```

Expected response:
```json
{
  "status": "connected",
  "models": ["kimi-k2.7-code", "kimi-k2.5", "moonshot-v1-128k"],
  "base_url": "https://api.moonshot.ai/v1"
}
```

---

## Live API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kimi/health` | Connection status |
| GET | `/api/kimi/models` | Available models |
| POST | `/api/kimi/chat` | Chat completion |
| POST | `/api/kimi/review` | Code review (structured JSON) |
| POST | `/api/kimi/analyze` | Ecosystem analysis |
| POST | `/api/kimi/host` | Generate AI host broadcast lines |
| POST | `/api/kimi/moderate` | Moderate stream chat message |

---

## Usage Examples

### Ask Kimi anything (chat)
```bash
curl -X POST https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How do I optimize the payout workflow?"}],
    "model": "kimi-k2.5"
  }'
```

### Code review
```bash
curl -X POST .../api/kimi/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x = ...",
    "filename": "src/lib/tokenManager.ts",
    "language": "typescript"
  }'
```

### Generate AI host lines
```bash
curl -X POST .../api/kimi/host \
  -H "Content-Type: application/json" \
  -d '{
    "host": "LEO",
    "topic": "RTVS token just hit 1000 holders",
    "context": {"viewer_count": 847, "trending_gifts": ["Crown", "Diamond"]}
  }'
```

### Moderate a chat message
```bash
curl -X POST .../api/kimi/moderate \
  -H "Content-Type: application/json" \
  -d '{"message": "send me your address", "username": "user123"}'
```

---

## Available Models

| Model | Context | Best For | Default Temp |
|-------|---------|----------|-------------|
| `kimi-k2.7-code` | 256K | Code gen, review, debugging | 0.2 |
| `kimi-k2.5` | 256K | Reasoning, strategy, writing | 0.7 |
| `moonshot-v1-128k` | 128K | Documents, extraction | 0.5 |

---

## GitHub PR Auto-Review

The `.github/workflows/kimi-review.yml` action:
- Triggers on every PR to `main` or `dev`
- Reviews all changed `.ts`, `.tsx`, `.js`, `.jsx`, `.sql` files
- Posts structured review comment directly on the PR
- Grades each file A–F with issue count + summary
- Uses **kimi-k2.7-code** (best code model)

**Required GitHub secret:** `KIMI_API_KEY`

---

## Token for External Kimi Agent

To give Kimi AI gateway its own Cloudflare token:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create Custom Token → Name: `RTV-Agent-KimiAI`
3. Permissions:
   - `Workers Scripts: Edit`
   - `Workers KV Storage: Edit`
4. Account: Rotationtimmy (947b01a53876bee16fa0e8360c880aca)
5. No expiry
6. Inject into worker:
```bash
npx wrangler secret put KIMI_CF_TOKEN
```

Track this token at:
```
GET https://rtv-token-manager.rotationtimmy.workers.dev/agents
```

---

## Architecture

```
User Request
    ↓
Cloudflare Worker (rotationtv-live-ai-clones)
    ↓ /api/kimi/*
kimiGateway.ts → routeKimiRequest()
    ↓
https://api.moonshot.ai/v1/chat/completions
    ↓
kimi-k2.7-code / kimi-k2.5 / moonshot-v1-128k
    ↓
Structured Response (JSON / text)
```

---

*Rotationtvnetwork LLC | Kimi AI Integration | Presidential Authority: Darrel | 2026*
