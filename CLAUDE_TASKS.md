# CLAUDE_TASKS.md — Manual Tasks for Claude

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
   cd workers/venice-ai-router
   npx wrangler login
   npx wrangler secret put VENICE_API_KEY
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   ```
6. Update `.env` from template: `cp .env.rotationtv.example .env.rotationtv`

**Time:** 30 min
**Status:** 🔴 NOT STARTED

---

## 🟡 TASK 2: SUPABASE DATABASE SETUP

**Why:** Consolidated schema needs to be applied to the live Supabase instance.

### Steps:
1. Go to https://supabase.com/dashboard → select RTV project
2. Open SQL Editor
3. Run `supabase/migrations/00000_consolidated_schema.sql` (the single consolidated file)
4. Verify all 18 tables created:
   - RtvUser, CreatorProfile, LiveStream, VodLibrary
   - CatalogChannel, CatalogVod, FilmCollection
   - SubscriptionPlan, UserSubscription
   - TributeTier, TributeTransaction, TransferGift
   - FilmGeneration, AiCronConfig
   - OmegaAuditLog, AgencyRoster, CreatorPayout, AcademyCredit
5. Verify RLS is enabled on all tables
6. Verify seed data inserted (channels, plans, tribute tiers)
7. Create Supabase Storage buckets:
   - `film-assets` (public)
   - `stream-thumbnails` (public)
   - `avatars` (public)
8. Test: `SELECT * FROM public."CatalogChannel";` should return 12 rows

**Time:** 20 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 3: TELEGRAM BOT CONFIGURATION

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
   curl -s "https://api.telegram.org/bot<NEW_TOKEN>/setWebhook?url=https://rotationtv-venice-ai.<ACCOUNT>.workers.dev"
   ```

**Time:** 15 min
**Status:** 🟡 NOT STARTED

---

## 🟡 TASK 4: CLOUDFLARE WORKERS DEPLOY

**Why:** Venice AI router and edge gateway need to be deployed.

### Steps:
1. `cd workers/venice-ai-router`
2. `npm install`
3. `npx wrangler login`
4. Bind secrets (from Task 1):
   ```bash
   npx wrangler secret put VENICE_API_KEY
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   ```
5. `npx wrangler deploy`
6. Note the deployed URL (e.g., `https://rotationtv-venice-ai.<account>.workers.dev`)
7. Test: `curl https://rotationtv-venice-ai.<account>.workers.dev/` should return "alive"
8. Deploy rtvEdgeGateway worker similarly

**Time:** 15 min
**Status:** 🟡 NOT STARTED

---

## 🟢 TASK 5: DOMAIN & DNS

**Why:** Custom domain for the platform.

### Steps:
1. In Cloudflare dashboard → Add domain (e.g., `rotationtv.app`)
2. Update nameservers at registrar
3. Wait for DNS propagation
4. Add custom domain to Workers:
   ```bash
   npx wrangler domains add rotationtv.app
   ```
5. Enable SSL (Cloudflare does this automatically)

**Time:** 10 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 6: END-TO-END TESTING

**Why:** Verify the full pipeline works.

### Steps:
1. Send `/ai hello` to @Rotationtv_Bot → should get Venice AI response
2. Send `/image a sunset over mountains` → should get generated image
3. Send `/voice Hello from RotationTV` → should get voice message
4. Check Supabase `OmegaAuditLog` → should have AI request entries
5. Test film generation:
   ```bash
   curl -X POST https://<PROJECT>.supabase.co/functions/v1/film-generator      -H "Authorization: Bearer <CRON_SECRET>"      -H "Content-Type: application/json"      -d '{"film_id": null}'
   ```
6. Test catalog browsing in Mini App
7. Test tribute flow: send 10 RTV to a creator
8. Test subscription: subscribe to Basic plan

**Time:** 20 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 7: MONITORING & ALERTS

**Why:** Know when things break.

### Steps:
1. In Cloudflare dashboard → Workers → rotationtv-venice-ai → Metrics
2. Enable email alerts for error rate > 5%
3. In Supabase dashboard → Database → Logs
4. Set up pg_cron for health checks:
   ```sql
   SELECT cron.schedule('health-check', '*/5 * * * *', $$
     INSERT INTO public."OmegaAuditLog" (actor_id, action_type, resource_type, metadata)
     VALUES ('system', 'health_check', 'platform', '{"status":"alive"}'::jsonb);
   $$);
   ```
5. Create Telegram alert channel for errors

**Time:** 15 min
**Status:** 🟢 NOT STARTED

---

## 🟢 TASK 8: CLEAN UP OLD MIGRATIONS

**Why:** 10 scattered migration files have duplicate table definitions. The consolidated schema replaces them all.

### Steps:
1. In Supabase SQL Editor, verify consolidated schema is applied
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
3. Keep only: `00000_consolidated_schema.sql`
4. Update README to reference the single migration

**Time:** 10 min
**Status:** 🟢 NOT STARTED

---

## Summary

| # | Task | Priority | Time | Status |
|---|------|----------|------|--------|
| 1 | Secret Rotation | 🔴 CRITICAL | 30m | NOT STARTED |
| 2 | Supabase Database | 🟡 HIGH | 20m | NOT STARTED |
| 3 | Telegram Bot Config | 🟡 HIGH | 15m | NOT STARTED |
| 4 | Cloudflare Workers | 🟡 HIGH | 15m | NOT STARTED |
| 5 | Domain & DNS | 🟢 NORMAL | 10m | NOT STARTED |
| 6 | End-to-End Testing | 🟢 NORMAL | 20m | NOT STARTED |
| 7 | Monitoring & Alerts | 🟢 NORMAL | 15m | NOT STARTED |
| 8 | Clean Up Migrations | 🟢 NORMAL | 10m | NOT STARTED |

**Total estimated time: ~2.5 hours**

> ⚠️ Task 1 (Secret Rotation) MUST be done first. All exposed tokens are compromised.
