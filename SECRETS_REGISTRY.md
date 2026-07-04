# ============================================================
# RotationTV Network — MASTER SECRETS REGISTRY
# All secrets across all services. Structure only — NO values.
# Fill from your vault/password manager.
# NEVER paste tokens in chat. Use CLI: npx wrangler secret put <KEY>
# ============================================================

# ═══════════════════════════════════════════════════════════
# TELEGRAM BOT TOKENS (3 bots)
# Get from @BotFather → /token (after /revoke of old tokens)
# ═══════════════════════════════════════════════════════════
TELEGRAM_BOT_TOKEN_ROTATIONTV=          # @Rotationtv_Bot
TELEGRAM_BOT_TOKEN_ROTATIONWINDOWS=     # @Rotationwindows_bot
TELEGRAM_BOT_TOKEN_ROTATIONTVNETWORK=   # @Rotationtvnetwork_bot

# ═══════════════════════════════════════════════════════════
# SUPABASE — Main RTV Ecosystem Project
# Dashboard → Settings → API
# ═══════════════════════════════════════════════════════════
SUPABASE_URL_MAIN=https://xynkgaxfwvpcixissxdz.supabase.co
SUPABASE_ANON_KEY_MAIN=                # public, safe for client
SUPABASE_SERVICE_KEY_MAIN=             # secret, server-only

# ═══════════════════════════════════════════════════════════
# SUPABASE — Rotation Erotica Project
# Dashboard → Settings → API
# ═══════════════════════════════════════════════════════════
SUPABASE_URL_EROTICA=https://zzybjoowhkwuomnpixuy.supabase.co
SUPABASE_ANON_KEY_EROTICA=             # public, safe for client
SUPABASE_SERVICE_KEY_EROTICA=          # secret, server-only

# ═══════════════════════════════════════════════════════════
# CLOUDFLARE
# Dashboard → My Profile → API Tokens → Create Token
# ═══════════════════════════════════════════════════════════
CF_API_TOKEN=                           # General API token
CF_ACCOUNT_ID=                          # Account ID
CF_STREAM_API_TOKEN=                    # Stream-specific token
CF_STREAM_SIGNING_KEY=                  # Stream signing key
CF_STREAM_TOKEN=                        # Stream edit token (if separate)

# ═══════════════════════════════════════════════════════════
# AI PROVIDERS
# ═══════════════════════════════════════════════════════════
VENICE_API_KEY=                         # https://venice.ai → Settings → API Keys
GEMINI_API_KEY=                         # Google AI Studio → API Keys
CLAUDE_API_KEY=                         # https://console.anthropic.com → API Keys
ELEVENLABS_API_KEY=                     # https://elevenlabs.io → Profile → API Keys
HEYGEN_API_KEY=                         # https://heygen.com → API Keys

# ═══════════════════════════════════════════════════════════
# TON BLOCKCHAIN
# ═══════════════════════════════════════════════════════════
TON_RPC_URL=https://toncenter.com/api/v2
TON_API_KEY=                            # TonCenter API key
TON_WALLET_SEED=                        # 24-word mnemonic (NEVER in chat)
TON_WALLET_ADDRESS=                     # Wallet address

# ═══════════════════════════════════════════════════════════
# PAYMENTS
# ═══════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=                      # Stripe dashboard → API Keys
STRIPE_PUBLISHABLE_KEY=                 # Public key
STRIPE_WEBHOOK_SECRET=                  # Webhook signing secret

# ═══════════════════════════════════════════════════════════
# VERCEL (3 accounts)
# ═══════════════════════════════════════════════════════════
VERCEL_TOKEN=                           # Vercel dashboard → Settings → Tokens
VERCEL_ORG_ID=                          # Organization ID
VERCEL_PROJECT_ID=                      # Project ID

# ═══════════════════════════════════════════════════════════
# COMMUNICATIONS
# ═══════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=                     # Twilio console
TWILIO_AUTH_TOKEN=                      # Twilio console
TWILIO_PHONE_NUMBER=                   # Twilio console
BREVO_API_KEY=                          # Brevo (Sendinblue) — EXPIRED, reconnect

# ═══════════════════════════════════════════════════════════
# GOOGLE WORKSPACE (EXPIRED — reconnect)
# ═══════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=                       # Google Cloud Console
GOOGLE_CLIENT_SECRET=                   # Google Cloud Console
GOOGLE_REFRESH_TOKEN=                   # OAuth refresh token

# ═══════════════════════════════════════════════════════════
# INTERNAL
# ═══════════════════════════════════════════════════════════
CRON_SECRET=rtv-cron-secret-change-this  # Protects Edge Function endpoints
AI_GATEWAY_API_KEY=                     # Gateway auth key
WEBHOOK_SECRET=                         # Webhook signing secret

# ═══════════════════════════════════════════════════════════
# COMPOSIO (integration layer)
# ═══════════════════════════════════════════════════════════
# No separate keys needed — Composio handles OAuth flows
# Reconnect expired services via Mira: "connect googledocs", etc.
