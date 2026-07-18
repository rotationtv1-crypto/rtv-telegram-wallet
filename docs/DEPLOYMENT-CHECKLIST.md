# 🚀 ROTATIONTVNETWORK LLC — DEPLOYMENT CHECKLIST
> Version 6.0.0 | Presidential Authority: Darrel | 2026

---

## ☁️ Cloudflare Setup

### 1. Create KV Namespace (required for rate limiting + cost guard)
```bash
npx wrangler kv:namespace create "KV_SPEND"
# → Copy the returned id into wrangler.jsonc → kv_namespaces[0].id

npx wrangler kv:namespace create "KV_SPEND" --preview
# → Copy the returned id into wrangler.jsonc → kv_namespaces[0].preview_id
```

### 2. Inject all secrets
```bash
# AI providers
npx wrangler secret put KIMI_API_KEY         # sk-... from platform.moonshot.ai
npx wrangler secret put VENICE_API_KEY       # VENICE_INFERENCE_KEY_...
npx wrangler secret put VENICE_API_KEY_2     # backup key
npx wrangler secret put OPENAI_API_KEY       # sk-... from platform.openai.com

# Supabase
npx wrangler secret put SUPABASE_SERVICE_KEY # from supabase.com → Project Settings → API
npx wrangler secret put SUPABASE_ANON_KEY

# Telegram bot
npx wrangler secret put TELEGRAM_BOT_TOKEN_MAIN

# Security
npx wrangler secret put REQUEST_SIGNING_SECRET  # random 64-char hex string
# Generate with: openssl rand -hex 32
```

### 3. Enable R2 Storage
- Go to: https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/r2
- Click "Get started" → creates free tier
- Create bucket: `rtv-assets`

### 4. Enable Analytics Engine
- Go to: https://dash.cloudflare.com/947b01a53876bee16fa0e8360c880aca/workers/analytics-engine
- Enable for your account

### 5. Deploy
```bash
cd rotationtv
npm install
npx wrangler deploy
```

### 6. Verify deployment
```bash
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/
# → {"status":"ok","version":"6.0.0",...}

curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health
# → {"status":"connected",...}

curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health
# → {"status":"key_set",...}
```

---

## 🗄️ Supabase Setup

### Run migrations in order:
```bash
# Via Supabase Dashboard → SQL Editor
# Or via CLI: supabase db push

001_initial_schema.sql           # base tables
002_rotationtv_live_schema.sql   # live streaming tables
003_security_cost_protection.sql # rate limits, spend tracking, audit logs
```

### Enable extensions:
```sql
-- In Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS pg_cron;    -- scheduled jobs
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- Schedule daily reset of creator limits
SELECT cron.schedule('reset-creator-limits', '0 0 * * *', 'SELECT reset_daily_creator_limits()');

-- Schedule hourly cleanup of rate limit events  
SELECT cron.schedule('cleanup-rl-events', '0 * * * *', 'SELECT cleanup_rate_limit_events()');
```

---

## 🔐 Security Checklist

- [ ] Cloudflare proxy enabled (orange cloud ☁️) on all DNS records
- [ ] API keys stored as Worker secrets — never in `vars` or committed to git
- [ ] CORS locked to specific origins in production (not `*` on API routes)
- [ ] Rate limiting active at Cloudflare WAF level + Worker level (KV)
- [ ] HMAC-SHA256 request signing on `/api/admin/*` endpoints
- [ ] SIEM logging enabled → Supabase `moderation_log` + Analytics Engine
- [ ] Age verification required before `/api/venice/adult` access
- [ ] KV_SPEND namespace live for circuit breaker
- [ ] `REQUEST_SIGNING_SECRET` set as worker secret (not env var)
- [ ] DDoS protection: Cloudflare "Under Attack" mode ready
  - Dashboard → Security → Settings → Security Level → "I'm Under Attack" (if needed)
- [ ] Cloudflare Access configured for creator dashboard subdomain
  - Dashboard → Access → Applications → Add app.rotationtv.network

---

## 💰 Cost Protection Checklist

- [ ] Venice daily limit: $50 (set in `src/lib/costGuard.ts`)
- [ ] Kimi daily limit: $25
- [ ] OpenAI daily limit: $100
- [ ] Total daily hard cap: $175
- [ ] KV namespace live (circuit breaker uses KV)
- [ ] `/api/spend/dashboard` accessible with signed request
- [ ] Venice credits added: https://venice.ai/settings/api (minimum $10 recommended)
- [ ] Kimi credits added: https://platform.moonshot.ai (minimum $5 recommended)
- [ ] Monitoring alert set if daily spend > 80% of limit

---

## 🌐 Domain Segregation

| Domain | Purpose | Protection |
|--------|---------|-----------|
| `app.rotationtv.network` | Creator dashboard | Cloudflare Access (SSO) |
| `api.rotationtv.network` | API endpoints | WAF + Rate limits |
| `cdn.rotationtv.network` | R2 content CDN | CDN cache rules |
| `*.rotationtimmy.workers.dev` | Workers (dev) | workers.dev subdomain |

### DNS setup (once domain is pointed to Cloudflare):
```
api.rotationtv.network  CNAME  rotationtv-live-ai-clones.rotationtimmy.workers.dev  (proxied)
app.rotationtv.network  CNAME  rotationtv-live-ai-clones.rotationtimmy.workers.dev  (proxied)
cdn.rotationtv.network  CNAME  <R2 bucket public URL>  (proxied)
```

---

## 🔁 API Key Rotation Procedure

When rotating a compromised key:

1. **Generate new key** at the provider dashboard
2. **Inject immediately** (new key is live before old is revoked):
   ```bash
   npx wrangler secret put VENICE_API_KEY
   ```
3. **Revoke old key** at provider dashboard
4. **Log the rotation** in Supabase:
   ```sql
   INSERT INTO api_key_rotation (provider, reason, old_key_hint, new_key_hint, rotated_by)
   VALUES ('venice', 'Scheduled rotation', 'VENI...KEY', 'VENI...NEW', 'darrel');
   ```
5. **Test** the new key:
   ```bash
   curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health
   ```

---

## 📊 GitHub Actions — Required Secrets

Go to: `github.com/rotationtv1-crypto/RotationTV-Live-AI-Clones/settings/secrets/actions`

| Secret | Value | Used By |
|--------|-------|---------|
| `CLOUDFLARE_API_TOKEN` | TOKEN_2 value | deploy.yml |
| `CLOUDFLARE_ACCOUNT_ID` | `947b01a53876bee16fa0e8360c880aca` | deploy.yml |
| `OPENAI_API_KEY` | from OpenAI | deploy.yml |
| `KIMI_API_KEY` | from Moonshot | kimi-review.yml |

---

## ✅ Final Verification

```bash
# 1. Health
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/

# 2. Kimi
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/kimi/health

# 3. Venice  
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/venice/health

# 4. Spend dashboard (requires signed request)
TS=$(date +%s)
SIG=$(echo -n "${TS}:dashboard" | openssl dgst -sha256 -hmac "YOUR_SIGNING_SECRET" | awk '{print $2}')
curl https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/api/spend/dashboard \
  -H "X-Signature: $SIG" \
  -H "X-Timestamp: $TS"
```

---

*Rotationtvnetwork LLC | Deployment Checklist v6.0.0 | Presidential Authority: Darrel*
