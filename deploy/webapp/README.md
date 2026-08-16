# Standalone Web App Deployment (app.rotationtv.network)

**Entity: Darrel-spell-living-trust**  
**Primary: Cloudflare Pages** (separate from Mini App which stays on Workers + Telegram WebApp)

WebApp.tsx already exists with full Stars parity (balance, gifts, subscriptions, JWT auth).  
This package gives it independent hosting so Mini App (Telegram-only) and Web App (browser) never share the same SPA root.

## Build & Deploy (Cloudflare Pages)

```bash
# From repo root
cd frontend
npm ci
npm run build:web   # produces dist-web/ (see vite.web.config.ts)

# Or use the monorepo script
npx wrangler pages deploy dist-web --project-name=rtv-webapp --branch=main
```

### Required Pages Project Settings
- Framework preset: Vite
- Build command: `cd frontend && npm run build:web`
- Output directory: `dist-web` (or `frontend/dist-web`)
- Environment variables (Pages → Settings → Environment):
  - `VITE_API_BASE` = `https://api.rotationtv.network`  (or current workers.dev until multi-domain live)
  - `VITE_STARS_ENABLED` = `true`

### Custom Domain
1. Cloudflare Dashboard → Pages → rtv-webapp → Custom domains
2. Add `app.rotationtv.network`
3. Create CNAME `app` → `rtv-webapp.pages.dev` (or the Pages target)
4. Enable Always Use HTTPS + Automatic HTTPS Rewrites

## Alternative: Vercel / Netlify / self-host
Any static host works. The SPA is pure client-side + JWT. No server-side rendering required.

```bash
# Vercel
vercel --prod --cwd frontend --build-env VITE_API_BASE=https://api.rotationtv.network
```

## Local dev
```bash
cd frontend
npm run dev:web   # vite --config vite.web.config.ts --port 5174
```

## Security notes
- JWT only in localStorage + Authorization header
- All Stars invoices open Telegram deep links / invoice_url (user completes payment inside Telegram)
- No secrets in the frontend bundle
- CORS must allow app.rotationtv.network on the backend (api.)
