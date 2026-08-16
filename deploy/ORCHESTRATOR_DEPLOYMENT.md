# RTV Telegram Orchestrator — Production Deployment Package

**Entity: Darrel-spell-living-trust | 2026-08-16**  
Closes the remaining gaps from the built-vs-needed map.

## 1. Standalone Web App (app.)
- Source of truth: `frontend/src/web/WebApp.tsx` (already Stars-complete)
- Deploy package: `deploy/webapp/`
- Command: `./deploy/webapp/deploy-webapp.sh`
- Domain: `app.rotationtv.network` → Cloudflare Pages project `rtv-webapp`

## 2. Multi-domain routing
- Package: `deploy/multi-domain/`
- Cloudflare routes (preferred) or Caddyfile for self-host
- Mapping:
  - app. → WebApp
  - api. → Worker / kimi-cloud
  - bot. → same Worker (webhook path /webhook/<botId>)

## 3. kimi-cloud packaging
- Package: `deploy/kimi-cloud/`
- Full production Dockerfile + thin Node server entry + k8s Deployment/Service
- Health: `/api/kimi/health`
- Primary runtime remains Cloudflare Workers; this is hybrid/self-host

## 4. ACME HTTPS
- Package: `deploy/acme/`
- Cloudflare Universal SSL (preferred) or cert-manager ClusterIssuer + Ingress
- TLS secret `rtv-tls` for api./bot./app.

## 5. Cloud SDK + multi-bot isolation
- `src/lib/telegramCloudSdk.ts` is complete (no method gaps)
- Tokens isolated per bot ID via env (`TELEGRAM_BOT_TOKEN_6`, `_7`, …)
- Never share credentials across bots; webhook routing is path-based

## Deploy order (Cloudflare first)
1. `npx wrangler deploy` (api. + bot. routes)
2. `./deploy/webapp/deploy-webapp.sh` (app.)
3. DNS CNAME/A records + custom domains
4. (Optional) k8s for hybrid: apply secret → deployment → service → ingress + issuer

## Self-host order
1. Build & push image `rtv-kimi-cloud:latest`
2. Apply secret.example → real secret
3. Apply deployment + service
4. Install cert-manager + apply issuer + ingress
5. Point DNS to LB
6. Host WebApp static files behind Caddy or nginx on app.

## Verification checklist
- [ ] `curl https://api.rotationtv.network/api/kimi/health` → 200 + stars:true
- [ ] `https://app.rotationtv.network` loads WebApp login
- [ ] Stars invoice from WebApp opens Telegram
- [ ] Webhook `/webhook/main` and `/webhook/erotica` isolated
- [ ] gitleaks + pre-commit still green
- [ ] No secrets in frontend bundle or git history

*Presidential Authority: Darrel | Rotationtvnetwork LLC*
