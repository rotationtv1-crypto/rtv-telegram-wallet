# TASK_ASSIGNMENTS.md — Kimi + Claude Build Split
# Updated: 2026-07-06 — Avatar Designer + Erotica Bot + Security Fixes

> Mira pushed the architecture. Kimi builds the UI. Claude fetches the auth.
> All code targets the RotationTV stack: Cloudflare Workers + Supabase + Venice AI + TON

---

## 🤖 KIMI TASKS (Code — Build & Push)

### K1: Windows 7 Simulator → Cloudflare Worker Assets
**Priority:** 🟡 HIGH | **Time:** 2h | **Repo:** `rtv-telegram-wallet/cloudflare-workers-assets/`

The Windows 7 Simulator HTML (51KB) needs to be served via Cloudflare Workers + Assets, NOT inline in the worker JS (1MB limit).

**Build:**
1. Create `cloudflare-workers-assets/` directory structure:
   ```
   cloudflare-workers-assets/
   ├── src/index.ts          — Worker entry (API routes + asset serving)
   ├── src/router.ts         — Simple HTTP router
   ├── assets/
   │   ├── index.html        — Landing page with app selector
   │   ├── windows.html      — Windows 7 Simulator (51KB)
   │   ├── cloud.html        — Cloud PC interface
   │   └── devsecops.html    — DevSecOps dashboard
   ├── wrangler.jsonc        — Config with assets binding
   ├── package.json
   └── tsconfig.json
   ```
2. Worker handles API routes (`/api/health`, `/api/ai/generate`)
3. Assets binding serves static HTML files at edge (cached, no size limit)
4. Add `.github/workflows/deploy.yml` for CI/CD auto-deploy

**Stack:** TypeScript, Cloudflare Workers, Wrangler 3
**Reference:** `rtv-telegram-wallet/workers/` for existing worker patterns

---

### K2: Avatar Designer Mini App UI
**Priority:** 🟡 HIGH | **Time:** 3h | **Repo:** `rtv-telegram-wallet/mini-app/`

Build the Telegram Mini App frontend for the avatar designer.

**Build:**
1. React + TypeScript + TailwindCSS + Framer Motion
2. Pages:
   - `/avatar/create` — Step-by-step wizard (gender → style → features → outfit → setting)
   - `/avatar/preview` — Live preview with Venice API
   - `/feed` — Masonry grid of public avatars with like/save
   - `/profile` — User's avatar collection
   - `/wallet` — $RTV balance + transaction history
3. Glass morphism UI (dark theme, oklch colors)
4. Telegram WebApp SDK integration (theme, auth, haptic)
5. Connect to `rtv-edge-gateway` API endpoints

**Stack:** Next.js 14, React, TailwindCSS, Framer Motion, Telegram WebApp SDK
**Reference:** `rtv-telegram-wallet/src/components/` for existing UI patterns

---

### K3: Fix Code Language Consistency
**Priority:** 🔴 CRITICAL | **Time:** 1h | **Repo:** All

The codebase has mixed languages from different AI sessions. Standardize:

**Fix:**
1. All Workers → TypeScript (`.ts`), NOT JavaScript (`.js`)
2. All Supabase migrations → SQL with PascalCase table names
3. All React components → `.tsx` with `'use client'` directive
4. All API routes → consistent error handling pattern
5. All `.env.example` files → same format as `SECRETS_REGISTRY.md`
6. Remove any Python files that should be TypeScript
7. Ensure all imports use consistent module resolution

**Standards:**
- Worker entry: `src/index.ts` with `export default { fetch() {} }`
- Supabase queries: use `sbQuery()` helper pattern from erotica-bot
- Error responses: `jsonError(message, status)` pattern
- Auth: `requireSupabaseUser()` for all protected routes

---

### K4: Ecosystem JSON + Venice Memory Sync
**Priority:** 🟢 NORMAL | **Time:** 1h

Build the ecosystem sync script that pushes full context to Venice AI.

**Build:**
1. `scripts/venice-ecosystem-sync.ts` — reads ecosystem JSON, sends to Venice
2. `scripts/ecosystem-context.json` — 9,831 chars, 22 sections
3. Auto-fires on credit detection
4. Maps 90 Venice models, curates 9 for RTV use cases

---

## 👤 CLAUDE TASKS (Manual — Auth & Deploy)

### C1: 🔴 SECRET ROTATION (CRITICAL — DO FIRST)
**Priority:** 🔴 CRITICAL | **Time:** 30m

**Exposed credentials (ALL must be revoked):**
- 8+ Telegram bot tokens (pasted in chat)
- 2 Venice API keys (in docx: `VENICE_INFERENCE_KEY_ycKiTRu...`, `VENICE_INFERENCE_KEY_2uKgVy...`)
- 1 Cloudflare API token (`cfut_6Yx5uspB...`)
- 1 Cloudflare PAT

**Steps:**
1. @BotFather → `/revoke` for ALL bots
2. Venice dashboard → revoke both inference keys → generate new
3. Cloudflare dashboard → revoke exposed tokens → create new with correct permissions
4. Set all new tokens via `npx wrangler secret put <KEY>` (NEVER in chat)
5. Update password manager / vault

---

### C2: 🔴 APPLY SECURITY HARDENING (CRITICAL)
**Priority:** 🔴 CRITICAL | **Time:** 15m

**Apply to Rotation Erotica DB (zzybjoowhkwuomnpixuy):**
1. Run `supabase/migrations-rotation-erotica/20260704_security_hardening.sql`
2. Run `supabase/migrations-rotation-erotica/20260706_avatar_designer_schema.sql`
3. Verify: `transfer_rtv` blocked for anon/authenticated
4. Verify: `gift_transactions` client INSERT policy removed
5. Verify: `live_rooms` column trigger active
6. Verify: `AvatarCollection`, `AvatarSession`, `AvatarStyle` tables created

---

### C3: 🟡 SUPABASE DATABASE SETUP (Main RTV Project)
**Priority:** 🟡 HIGH | **Time:** 20m

**Apply to Main RTV DB (xynkgaxfwvpcixissxdz):**
1. Run `supabase/migrations/00000_consolidated_schema.sql`
2. Run `supabase/migrations/20260704_oauth_telegram_auth.sql`
3. Verify 21 tables, RLS enabled, seed data present
4. Create storage buckets: `film-assets`, `stream-thumbnails`, `avatars`

---

### C4: 🟡 TELEGRAM BOT CONFIGURATION
**Priority:** 🟡 HIGH | **Time:** 15m

**For @RotationtvErotica_Bot:**
1. @BotFather → `/setdescription` → "AI Avatar Designer — Create cinematic AI portraits"
2. `/setabouttext` → "Design your AI avatar with cinematic styles. HBO-quality portraits."
3. `/setcommands` → paste:
   ```
   start - Welcome
   avatar create - Design your AI avatar
   avatar generate - Quick generate
   feed - Browse avatar feed
   profile - Your collection
   wallet - $RTV balance
   subscribe - Premium tiers
   help - Show commands
   ```
4. `/setuserpic` → Upload RTV Erotica logo
5. Set webhook: `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://rotationtv-erotica-bot.<ACCOUNT>.workers.dev/telegram/webhook"`

---

### C5: 🟡 CLOUDFLARE WORKERS DEPLOY
**Priority:** 🟡 HIGH | **Time:** 20m

**Deploy all 3 workers:**
1. `workers/` — Venice AI Telegram bot
2. `rtv-edge-gateway/` — Streaming + gifting edge gateway
3. `erotica-bot/` — Avatar designer bot

**For each:**
```bash
cd <worker-dir> && npm install && npx wrangler deploy
# Bind secrets (from C1)
npx wrangler secret put VENICE_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

---

### C6: 🟡 RECONNECT EXPIRED COMPOSIO SERVICES
**Priority:** 🟡 HIGH | **Time:** 15m

Reconnect 7 expired services:
- googledocs, googledrive, googlesheets, googlecalendar, gmail, brevo, canva

---

### C7: 🟢 END-TO-END TESTING
**Priority:** 🟢 NORMAL | **Time:** 25m

Test all bot commands, avatar flow, gift flow, stream flow, wallet.

---

### C8: 🟢 CLEAN UP OLD MIGRATIONS
**Priority:** 🟢 NORMAL | **Time:** 10m

Delete 9 duplicate migration files. Keep only consolidated schema + OAuth + avatar schema.

---

## 📊 Task Matrix

| Task | Owner | Priority | Time | Depends On |
|------|-------|----------|------|------------|
| K1: Windows 7 Assets | Kimi | 🟡 | 2h | — |
| K2: Avatar Mini App | Kimi | 🟡 | 3h | K1 |
| K3: Code Language Fix | Kimi | 🔴 | 1h | — |
| K4: Venice Sync | Kimi | 🟢 | 1h | C1 |
| C1: Secret Rotation | Claude | 🔴 | 30m | — |
| C2: Security Hardening | Claude | 🔴 | 15m | — |
| C3: Main DB Setup | Claude | 🟡 | 20m | — |
| C4: Bot Config | Claude | 🟡 | 15m | C1 |
| C5: Workers Deploy | Claude | 🟡 | 20m | C1, C2 |
| C6: Reconnect Services | Claude | 🟡 | 15m | — |
| C7: E2E Testing | Claude | 🟢 | 25m | C5 |
| C8: Clean Migrations | Claude | 🟢 | 10m | C3 |

**Critical path:** C1 → C2 → C5 → C7
**Kimi can start:** K1, K2, K3 immediately (no auth dependencies)

---

## 🔀 Handoff Protocol

```
Mira (pushed) ──→ GitHub (rtv-telegram-wallet)
     │                    │
     ├── Kimi reads ──────┤── Builds UI, fixes code, pushes PRs
     │                    │
     └── Claude reads ───┤── Fetches auth, deploys, tests
                          │
                          └──→ Production
```

**Kimi pushes to:** feature branches (`kimi/windows-assets`, `kimi/avatar-miniapp`, `kimi/code-fix`)
**Claude merges to:** `main` after testing
**Mira reviews:** architecture consistency, security, PascalCase compliance
