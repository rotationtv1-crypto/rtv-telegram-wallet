# RTV Telegram Orchestrator — Cloudflare Deployment Package

**No fake live claims.** Artifacts only. Deploy requires your Cloudflare account + secrets.

## Cancelled (explicit)
1. ~~Standalone Web App separate hosting~~ — cancelled
3. ~~kimi-cloud Docker / k8s packaging~~ — cancelled

## Active remaining
2. Multi-domain routing (Cloudflare-native)
4. ACME / HTTPS → Cloudflare Universal SSL + Custom Domains (no cert-manager needed)
5. Cloud SDK method surface + multi-bot credential isolation (already present in `src/lib/telegramCloudSdk.ts` + `botGateway.ts`)

## Cloudflare-first order
1. Set secrets on the Worker:
   ```
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   # etc.
   ```
2. Add routes / custom domains in `wrangler.jsonc` (see `deploy/multi-domain/`)
3. `npx wrangler deploy`
4. Cloudflare DNS → Proxied CNAMEs or Worker custom domains for `api.` / `bot.`
5. Pages custom domain for Mini App if using separate Pages project
6. Enable Always Use HTTPS + Automatic HTTPS Rewrites (Universal SSL)

## Verification (after you deploy)
- [ ] `curl https://api.rotationtv.network/health` (or your worker URL) returns 200
- [ ] Webhook path `/webhook/<botId>` isolated per bot token env
- [ ] Stars invoice path only (no Stripe / RTV-token user-facing)
- [ ] gitleaks + typecheck green in CI

## Inactive code policy
Any reference that is not actively used or that re-introduces Stripe / RTV-token payment surfaces for tips/subs/gifts must be removed or quarantined. Prefer GitHub Actions + wrangler over external self-host packages.
