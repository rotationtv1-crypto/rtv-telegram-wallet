# RTV Telegram Orchestrator — Cloudflare Only

**No fake live claims. No self-host packages.**

## Cancelled & Removed
- Standalone WebApp package (`deploy/webapp/`) — REMOVED
- kimi-cloud Docker + k8s (`deploy/kimi-cloud/`) — REMOVED
- cert-manager / Ingress ACME (`deploy/acme/`) — REMOVED

## Active path
1. Multi-domain routing via Cloudflare Worker routes + custom domains (`deploy/multi-domain/`)
2. HTTPS via Cloudflare Universal SSL (no external ACME)
3. Cloud SDK + multi-bot isolation already in `src/lib/telegramCloudSdk.ts` + `botGateway.ts`

## Deploy order
```bash
# Secrets (one-time)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
# ...other secrets

# Routes / domains — see deploy/multi-domain/README.md
npx wrangler deploy
```

## Verification (after you deploy with your account)
- Worker health endpoint returns 200
- `/webhook/<botId>` isolated per bot token
- Stars (XTR) invoice path only
- CI typecheck green

Any remaining Caddy / Docker / k8s files under `deploy/` are stubs marked REMOVED.
