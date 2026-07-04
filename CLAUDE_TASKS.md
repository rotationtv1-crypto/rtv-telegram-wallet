# CLAUDE_TASKS.md — Manual Tasks for Claude
# Updated: 2026-07-04 v2 — includes Rotation Erotica security fixes

> These tasks require browser auth, interactive dashboards, or manual CLI work.
> Mira built the code. Claude fetches the auth.

## 🔴 TASK 1: SECRET ROTATION (CRITICAL — DO FIRST)

**Why:** User exposed 8+ bot tokens and 2 Cloudflare tokens in chat. All are compromised.

### Steps:
1. Open @BotFather in Telegram
2. For EACH bot, send `/revoke` and select the bot:
   - `@Rotationtv_Bot`
   - `@Rotationwindows_bot`
   - `@Rotationtvnetwork_bot`
   - Any other RTV bots
3. BotFather returns new tokens — copy to password manager ONLY
4. For Cloudflare: go to https://dash.cloudflare.com/profile/api-tokens
   - Revoke the exposed token
   - Create new token with these permissions:
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

   # Edge Gateway (Rotation Erotica)
   cd rtv-edge-gateway && npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler secret put CF_ACCOUNT_ID
   npx wrangler secret put CF_STREAM_TOKEN
   npx wrangler secret put CF_STREAM_SIGNING_KEY
   ```
6. Update `.env` from template: `cp .env.rotationtv.example .env.rotationtv`

**Time:** 30 min
**Status:** 🔴 NOT STARTED

---

## 🔴 TASK 2: APPLY SECURITY HARDENING TO ROTATION EROTICA (CRITICAL)

**Why:** `transfer_rtv` has no caller-identity check — any authenticated user can drain any other user's balance. `gift_transactions` allows free gift fabrication. `live_rooms` allows stream key overwrite.

### Steps:
1. Go to https://supabase.com/dashboard
2. Select project **zzybjoowhkwuomnpixuy** (Rotation Erotica)
3. Open SQL Editor
4. Run the migration from:
   `supabase/migrations-rotation-erotica/20260704_security_hardening.sql`
5. Verify fixes:
   ```sql
   -- transfer_rtv should reject non-service calls
   SELECT proacl FROM pg_proc WHERE proname = 'transfer_rtv';
   -- Should show only postgres/service_role

   -- gift_transactions INSERT policy should be gone
   SELECT polname FROM pg_policy WHERE polrelid = 'gift_transactions'::regclass;
   -- Should NOT contain "Authenticated users send gifts"

   -- Trigger should exist on live_rooms
   SELECT tgname FROM pg_trigger WHERE tgrelid = 'live_rooms'::regclass;
   -- Should contain "trg_protect_live_rooms_stream_columns"
   ```
6. Manual test: attempt `POST /rest/v1/rpc/transfer_rtv` with anon key as non-owner → must fail

**Time:** 15 min
**Status:** 🔴 NOT STARTED

---

## 🟡 TASK 3: SUPABASE DATABASE SETUP (RTV Ecosystem)

**Why:** Consolidated schema needs to be applied to the live Supabase instance.

### Steps:
1. Go to https://supabase.com/dashboard → select RTV project (xynkgaxfwvpcixissxdz)
2. Open SQL Editor
3. Run `supabase/migrations/00000_consolidated_schema.sql`
4. Run `supabase/migrations/20260704_oauth_telegram_auth.sql`
5. Verify all 21 tables created (18 core + 3 auth)
6. Verify RLS enabled on all tables
7. Verify seed data (12 channels, 5 plans, 8 tribute tiers)
8. Create Supabase Storage buckets:
   - `film-assets` (public)
   - `stream-thumbnails` (public)
   - `avatars` (public)
9. Enable Supabase Auth providers:
   - Telegram (via custom auth bridge)
   - Google OAuth
   - GitHub OAuth
   - Discord OAuth
10. Test: `SELECT * FROM public."CatalogChannel";` → 12 rows

**Time:** 25 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 4: TELEGRAM BOT CONFIGURATION

**Why:** Bots need commands, descriptions, and profile pictures.

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

**Why:** Venice AI router + edge gateway need to be deployed.

### Steps:
1. Deploy Venice AI Worker:
   ```bash
   cd workers
   npm install
   npx wrangler login
   npx wrangler secret put VENICE_API_KEY
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler deploy
   ```
2. Deploy Edge Gateway:
   ```bash
   cd rtv-edge-gateway
   npm install
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler secret put CF_ACCOUNT_ID
   npx wrangler secret put CF_STREAM_TOKEN
   npx wrangler secret put CF_STREAM_SIGNING_KEY
   npx wrangler deploy
   ```
3. Create KV namespace for rate limiting:
   ```bash
   npx wrangler kv:namespace create RATE_LIMIT_KV
   # Update wrangler.toml with the returned ID
   ```
4. Test both workers:
   ```bash
   curl https://rotationtv-venice-ai.<ACCOUNT>.workers.dev/
   curl https://rtv-edge-gateway.<ACCOUNT>.workers.dev/
   ```

**Time:** 20 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 6: COMPOSIO INTEGRATION SETUP

**Why:** Composio connects 200+ apps for automation — GitHub, Gmail, Slack, Notion, Google Calendar, etc.

### Steps:
1. Connect core services via Mira:
   - GitHub: already connected ✅
   - Supabase: already connected ✅
   - Vercel: already connected ✅
   - ElevenLabs: already connected ✅
   - HeyGen: already connected ✅
2. Reconnect expired services:
   - Google Docs (expired)
   - Google Drive (expired)
   - Google Sheets (expired)
   - Google Calendar (expired)
   - Gmail (expired)
   - Brevo (expired)
   - Canva (expired)
3. Set up event triggers:
   - GitHub: new PR → notify in Telegram
   - Gmail: new email from Stripe → log to Supabase
   - Google Calendar: new event → remind in Telegram
4. Test automation: create a GitHub issue → verify notification arrives

**Time:** 20 min
**Status:** 🟡 NOT STARTED

---

## 🟢 TASK 7: DOMAIN & DNS

**Why:** Custom domain for the platform.

### Steps:
1. In Cloudflare dashboard → Add domain (e.g., `rotationtv.app`)
2. Update nameservers at registrar
3. Wait for DNS propagation
4. Add custom domain to Workers
5. Enable SSL (automatic via Cloudflare)

**Time:** 10 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 8: END-TO-END TESTING

**Why:** Verify the full pipeline works.

### Steps:
1. Send `/ai hello` to @Rotationtv_Bot → Venice AI response
2. Send `/image a sunset over mountains` → generated image
3. Send `/voice Hello from RotationTV` → voice message
4. Test film generation:
   ```bash
   curl -X POST https://<PROJECT>.supabase.co/functions/v1/film-generator      -H "Authorization: Bearer <CRON_SECRET>"      -H "Content-Type: application/json"      -d '{"film_id": null}'
   ```
5. Test catalog browsing in Mini App
6. Test tribute flow: send 10 RTV to a creator
7. Test subscription: subscribe to Basic plan
8. Test edge gateway: create stream → verify CF Stream live input
9. Test gift send: send gift → verify transfer_rtv called → verify gift_transactions row
10. Test stream webhook: verify status transitions (offline → live → offline)

**Time:** 25 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 9: CLEAN UP OLD MIGRATIONS

**Why:** 10 scattered migration files have duplicate table definitions. The consolidated schema replaces them all.

### Steps:
1. Verify consolidated schema is applied (Task 3)
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
4. Also delete obsolete: `20260625000002_edge_gateway_streaming.sql` (targeted wrong project)
5. Update README to reference the clean migration set

**Time:** 10 min
**Status:** 🟢 NOT STARTED

---

## Summary

| # | Task | Priority | Time | Status |
|---|------|----------|------|--------|
| 1 | Secret Rotation | 🔴 CRITICAL | 30m | NOT STARTED |
| 2 | Security Hardening (Rotation Erotica) | 🔴 CRITICAL | 15m | NOT STARTED |
| 3 | Supabase Database (RTV Ecosystem) | 🟡 HIGH | 25m | NOT STARTED |
| 4 | Telegram Bot Config | 🟡 HIGH | 15m | NOT STARTED |
| 5 | Cloudflare Workers Deploy | 🟡 HIGH | 20m | NOT STARTED |
| 6 | Composio Integration Setup | 🟡 HIGH | 20m | NOT STARTED |
| 7 | Domain & DNS | 🟢 NORMAL | 10m | NOT STARTED |
| 8 | End-to-End Testing | 🟢 NORMAL | 25m | NOT STARTED |
| 9 | Clean Up Old Migrations | 🟢 NORMAL | 10m | NOT STARTED |

**Total estimated time: ~3 hours**

> ⚠️ Tasks 1 and 2 are CRITICAL. Do them first.
> Task 2 (security hardening) is independent of Task 1 — can be done in parallel.
