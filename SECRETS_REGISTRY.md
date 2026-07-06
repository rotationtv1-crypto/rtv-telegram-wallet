# ============================================================
# RotationTV Network — MASTER SECRETS REGISTRY v2
# Updated: 2026-07-06 — Added erotica bot + Venice keys
# Structure only — NO values. Fill from vault.
# NEVER paste tokens in chat. Use CLI: npx wrangler secret put <KEY>
# ============================================================

# ═══════════════════════════════════════════════════════════
# TELEGRAM BOT TOKENS
# Get from @BotFather → /token (after /revoke of old tokens)
# ═══════════════════════════════════════════════════════════
TELEGRAM_BOT_TOKEN_ROTATIONTV=          # @Rotationtv_Bot
TELEGRAM_BOT_TOKEN_ROTATIONWINDOWS=     # @Rotationwindows_bot
TELEGRAM_BOT_TOKEN_ROTATIONTVNETWORK=   # @Rotationtvnetwork_bot
TELEGRAM_BOT_TOKEN_EROTICA=             # @RotationtvErotica_Bot (NEW)

# ═══════════════════════════════════════════════════════════
# VENICE AI (3 keys for fallback rotation)
# https://venice.ai/settings/api → API Keys
# ⚠️ 2 keys were exposed in docx — MUST revoke + regenerate
# ═══════════════════════════════════════════════════════════
VENICE_API_KEY_PRIMARY=                 # Primary key
VENICE_API_KEY_SECONDARY=              # Fallback key 1
VENICE_API_KEY_TERTIARY=              # Fallback key 2

# ═══════════════════════════════════════════════════════════
# SUPABASE — Main RTV Ecosystem Project
# Dashboard → Settings → API
# ═══════════════════════════════════════════════════════════
SUPABASE_URL_MAIN=https://xynkgaxfwvpcixissxdz.supabase.co
SUPABASE_ANON_KEY_MAIN=
SUPABASE_SERVICE_KEY_MAIN=

# ═══════════════════════════════════════════════════════════
# SUPABASE — Rotation Erotica Project
# Dashboard → Settings → API
# ═══════════════════════════════════════════════════════════
SUPABASE_URL_EROTICA=https://zzybjoowhkwuomnpixuy.supabase.co
SUPABASE_ANON_KEY_EROTICA=
SUPABASE_SERVICE_KEY_EROTICA=

# ═══════════════════════════════════════════════════════════
# CLOUDFLARE
# Dashboard → My Profile → API Tokens → Create Token
# ⚠️ 1 API token + 1 PAT exposed — MUST revoke + regenerate
# ═══════════════════════════════════════════════════════════
CF_API_TOKEN=
CF_ACCOUNT_ID=
CF_STREAM_API_TOKEN=
CF_STREAM_SIGNING_KEY=
CF_STREAM_TOKEN=

# ═══════════════════════════════════════════════════════════
# AI PROVIDERS
# ═══════════════════════════════════════════════════════════
GEMINI_API_KEY=
CLAUDE_API_KEY=
ELEVENLABS_API_KEY=
HEYGEN_API_KEY=

# ═══════════════════════════════════════════════════════════
# TON BLOCKCHAIN
# ═══════════════════════════════════════════════════════════
TON_RPC_URL=https://toncenter.com/api/v2
TON_API_KEY=
TON_WALLET_SEED=                        # 24-word mnemonic (NEVER in chat)
TON_WALLET_ADDRESS=

# ═══════════════════════════════════════════════════════════
# PAYMENTS
# ═══════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# ═══════════════════════════════════════════════════════════
# VERCEL (3 accounts)
# ═══════════════════════════════════════════════════════════
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# ═══════════════════════════════════════════════════════════
# COMMUNICATIONS
# ═══════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
BREVO_API_KEY=                          # EXPIRED — reconnect

# ═══════════════════════════════════════════════════════════
# GOOGLE WORKSPACE (EXPIRED — reconnect)
# ═══════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# ═══════════════════════════════════════════════════════════
# INTERNAL
# ═══════════════════════════════════════════════════════════
CRON_SECRET=rtv-cron-secret-change-this
AI_GATEWAY_API_KEY=
WEBHOOK_SECRET=

# ═══════════════════════════════════════════════════════════
# WORKER SECRET BINDINGS (per worker)
# ═══════════════════════════════════════════════════════════
#
# workers/ (Venice AI Telegram Bot):
#   VENICE_API_KEY, TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY
#
# rtv-edge-gateway/ (Streaming + Gifting):
#   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY,
#   CF_STREAM_API_TOKEN, CF_ACCOUNT_ID, CF_STREAM_SIGNING_KEY, WEBHOOK_SECRET
#
# erotica-bot/ (Avatar Designer):
#   VENICE_API_KEY, TELEGRAM_BOT_TOKEN, SUPABASE_URL,
#   SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, CF_ACCOUNT_ID, CF_STREAM_TOKEN
#
# ai-gateway/ (Unified AI Gateway):
#   GEMINI_API_KEY, CLAUDE_API_KEY, VENICE_API_KEY,
#   API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
