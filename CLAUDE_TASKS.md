# CLAUDE_TASKS.md — Manual Tasks for Claude
# Updated: 2026-07-04 — merged security audit findings from Rotation Erotica project

> These tasks require browser auth, interactive dashboards, or manual CLI work.
> Mira built the code. Claude fetches the auth. Claude found the security holes.

## 🔴 TASK 1: SECRET ROTATION (CRITICAL — DO FIRST)

**Why:** User exposed 8+ bot tokens and 2 Cloudflare tokens in chat. All are compromised.

### Steps:
1. Open @BotFather in Telegram
2. For EACH bot, send `/revoke` and select the bot:
   - `@Rotationtv_Bot`
   - `@Rotationwindows_bot`
   - `@Rotationtvnetwork_bot`
3. BotFather returns new tokens — copy to password manager ONLY
4. For Cloudflare: go to https://dash.cloudflare.com/profile/api-tokens
   - Revoke the exposed token
   - Create new token with permissions:
     - Account:Cloudflare Stream:Edit
     - Account:Workers Scripts:Edit
     - Zone:Zone:Read
     - Zone:Workers Routes:Edit
5. Bind secrets via CLI (never in chat):
   ```bash
   # Venice AI Worker
   cd workers && npx wrangler secret put VENICE_API_KEY
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY

   # Edge Gateway Worker
   cd rtv-edge-gateway && npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler secret put CF_STREAM_API_TOKEN
   npx wrangler secret put CF_ACCOUNT_ID
   npx wrangler secret put CF_STREAM_SIGNING_KEY
   npx wrangler secret put WEBHOOK_SECRET
   ```
6. Update `.env` from `SECRETS_REGISTRY.md`

**Time:** 30 min
**Status:** 🔴 NOT STARTED

---

## 🔴 TASK 2: APPLY SECURITY HARDENING (CRITICAL — Rotation Erotica)

**Why:** Claude found 3 critical security holes in the Rotation Erotica Supabase project:
1. `transfer_rtv` has no caller-identity check — any user can drain any balance
2. `gift_transactions` lets clients fabricate free gifts
3. `live_rooms` lets creators overwrite stream credentials

### Steps:
1. Go to https://supabase.com/dashboard → project `zzybjoowhkwuomnpixuy`
2. Open SQL Editor
3. Run `supabase/migrations-rotation-erotica/20260704_security_hardening.sql`
4. Verify:
   ```sql
   -- transfer_rtv should NOT be executable by authenticated/anon
   SELECT proacl FROM pg_proc WHERE proname = 'transfer_rtv';
   -- Expected: only postgres/service_role entries

   -- gift_transactions should have NO client INSERT policy
   SELECT polname FROM pg_policy WHERE polrelid = 'gift_transactions'::regclass;

   -- live_rooms trigger should exist
   SELECT tgname FROM pg_trigger WHERE tgrelid = 'live_rooms'::regclass;
   ```
5. Test: attempt `POST /rest/v1/rpc/transfer_rtv` with anon key → must fail

**Time:** 15 min
**Status:** 🔴 NOT STARTED

---

## 🟡 TASK 3: SUPABASE DATABASE SETUP (Main RTV Project)

**Why:** Consolidated schema needs to be applied to the live Supabase instance.

### Steps:
1. Go to https://supabase.com/dashboard → project `xynkgaxfwvpcixissxdz`
2. Open SQL Editor
3. Run `supabase/migrations/00000_consolidated_schema.sql`
4. Run `supabase/migrations/20260704_oauth_telegram_auth.sql`
5. Verify all 21 tables created (18 core + 3 auth)
6. Verify RLS enabled on all tables
7. Verify seed data (12 channels, 5 plans, 8 tribute tiers)
8. Create storage buckets: `film-assets`, `stream-thumbnails`, `avatars`

**Time:** 20 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 4: TELEGRAM BOT CONFIGURATION

### Steps:
1. Open @BotFather
2. For `@Rotationtv_Bot`:
   - `/setdescription` → "RotationTV Network — Stream, watch, and earn $RTV on Telegram"
   - `/setabouttext` → "Cable-grade streaming on Telegram. Live streams, AI films, $RTV wallet."
   - `/setcommands` → paste:
     ```
     ai - Chat with Venice AI (uncensored)
     image - Generate image with Venice AI
     voice - Text to speech
     moderate - AI content moderation
     wallet - Check $RTV balance
     stream - Start live stream
     watch - Browse catalog
     tribute - Send tribute to creator
     subscribe - Manage subscription
     help - Show all commands
     ```
   - `/setuserpic` → Upload RTV logo
3. Set webhook:
   ```bash
   curl -s "https://api.telegram.org/bot<NEW_TOKEN>/setWebhook?url=https://rotationtv-venice-ai.<ACCOUNT>.workers.dev/telegram/webhook"
   ```

**Time:** 15 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 5: CLOUDFLARE WORKERS DEPLOY

### Steps:
1. Deploy Venice AI Worker:
   ```bash
   cd workers && npm install && npx wrangler deploy
   ```
2. Deploy Edge Gateway:
   ```bash
   cd rtv-edge-gateway && npm install && npx wrangler deploy
   ```
3. Bind all secrets (from Task 1)
4. Test: `curl https://rotationtv-venice-ai.<account>.workers.dev/` → "alive"
5. Test: `curl https://rtv-edge-gateway.<account>.workers.dev/` → "alive"

**Time:** 15 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 6: RECONNECT EXPIRED COMPOSIO SERVICES

**Why:** 7 services are EXPIRED and need reconnection.

### Steps:
1. Tell Mira: "connect googledocs"
2. Follow OAuth flow for each:
   - googledocs
   - googledrive
   - googlesheets
   - googlecalendar
   - gmail
   - brevo
   - canva
3. Verify each shows ACTIVE in connected_apps

**Time:** 15 min
**Status:** 🟡 NOT STARTED

---

## 🟢 TASK 7: END-TO-END TESTING

### Steps:
1. Send `/ai hello` to @Rotationtv_Bot → Venice AI response
2. Send `/image a sunset over mountains` → generated image
3. Send `/voice Hello from RotationTV` → voice message
4. Test film generation via Edge Function
5. Test catalog browsing in Mini App
6. Test gift flow: send 10 RTV to a creator (Rotation Erotica)
7. Test subscription: subscribe to Basic plan (Main RTV)
8. Verify Supabase `OmegaAuditLog` has entries for all actions

**Time:** 20 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 8: CLEAN UP OLD MIGRATIONS

### Steps:
1. Verify consolidated schema is applied
2. Delete old migration files from repo:
   - `20260703_full_schema.sql`
   - `20260703_rtv_content_feed.sql`
   - `20260703_transfer_gift.sql`
   - `20260704_ai_cron_config.sql`
   - `20260704_apply_now_rls.sql`
   - `20260704_catalog_pricing.sql`
   - `20260704_film_catalog_tribute.sql`
   - `20260704_full_schema_v2.sql`
   - `20260704_hours_dashboard_views.sql`
3. Keep only: `00000_consolidated_schema.sql` + `20260704_oauth_telegram_auth.sql`
4. Update README

**Time:** 10 min
**Status:** 🟢 NOT STARTED

---

## Summary

| # | Task | Priority | Time | Status |
|---|------|----------|------|--------|
| 1 | Secret Rotation | 🔴 CRITICAL | 30m | NOT STARTED |
| 2 | Security Hardening (Erotica) | 🔴 CRITICAL | 15m | NOT STARTED |
| 3 | Supabase Database (Main) | 🟡 HIGH | 20m | NOT STARTED |
| 4 | Telegram Bot Config | 🟡 HIGH | 15m | NOT STARTED |
| 5 | Cloudflare Workers Deploy | 🟡 HIGH | 15m | NOT STARTED |
| 6 | Reconnect Expired Services | 🟡 HIGH | 15m | NOT STARTED |
| 7 | End-to-End Testing | 🟢 NORMAL | 20m | NOT STARTED |
| 8 | Clean Up Migrations | 🟢 NORMAL | 10m | NOT STARTED |

**Total estimated time: ~2.5 hours**

> ⚠️ Tasks 1 and 2 are CRITICAL. Do them first.
> Task 1: All exposed tokens are compromised.
> Task 2: Anyone can drain any user's RTV balance right now.
