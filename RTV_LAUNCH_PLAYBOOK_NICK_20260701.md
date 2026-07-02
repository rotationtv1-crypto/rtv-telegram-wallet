# RTV ECOSYSTEM — LAUNCH PLAYBOOK FOR NICK
## Lead AI Technician Execution Guide
### July 1, 2026 — Presidential Authority: Darrel

> **Classification:** Internal — Execution Guide
> **Distribution:** Nick Smiley (Lead AI Technician)
> **Authority:** Darrel (Owner & CEO) — all major decisions require his approval

---

## EXECUTIVE SUMMARY

The RTV ecosystem has 35 deployed Base44 backend functions, 3 live Cloudflare Workers, 24 entity schemas, and 19 frontend pages. The infrastructure is functional but requires consolidation before launch. This playbook covers 5 critical work streams and a go/no-go checklist.

---

## 1. BOT-REPO SPLIT PLAN

### Current State
All code is in one monorepo: `rotationtv1-crypto/rtv-telegram-wallet` (149 files). Three bots serve different business lines and must be separated for compliance and maintainability.

### Target Architecture

#### Repo 1: `RotationPay-Core` (Payment Infrastructure)
- **Bot:** @RotationPayBot
- **Business:** Payments, wallet, payouts, merchant onboarding
- **Functions to extract:**
  - rotationPayBot, rotationPayGateway, rotationPayConnect
  - rotationPayWebhook, rtvPaymentHub, rtvPayoutEngine
  - stripe-webhook, telegramWalletBridge, rtvWalletDashboard
- **Payment Rails:** Stripe (approved for non-adult), Telegram Stars, TON, Internal RTV
- **Revenue Model:** Merchant subscription tiers ($99/$299/$999/$497) + transaction fees

#### Repo 2: `RTV-Token-Services` (Blockchain & Tokenomics)
- **Bot:** @RTVSrotationBot
- **Business:** Token vault, staking, mining tracker, NFT operations
- **Functions to extract:**
  - sovereignVaultBridge, vaultInitVerify, rtvsSovereignBot
  - rtvAuthGateway, rtvEdgeGateway (blockchain routes)
  - rtvMiniApp (token dashboard portions)
- **Infrastructure:** 4 Chainstack Solana nodes, TON v3 RPC
- **Revenue Model:** Staking tier fees, Jupiter DEX fees, NFT minting fees
- **Treasury:** 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv (Solana)

#### Repo 3: `Rotation-Erotica` (Adult Content — ISOLATED)
- **Bot:** @ROTATIONEROTICA_BOT
- **Business:** Live streaming, creator tips, subscriptions, PK battles
- **Functions to extract:**
  - telegramBotHandler, bigoModeratorBot
  - rtvMentorEngine, customerMentorBot
  - rtvPromoBroadcast (erotica campaigns)
- **Infrastructure:** Cloudflare D1 (rotation-erotica-db), R2 storage, KV
- **Payment Rails:** TELEGRAM-NATIVE ONLY — Stars, TON, Internal RTV
- **COMPLIANCE: NO STRIPE. NO PAYPAL. NO VENMO. NO ZELLE.**
  - Stripe ToS PROHIBITS adult content — risks freezing ALL ecosystem accounts
  - CCBILL: PRESIDENTIAL DECISION REQUIRED (approve or strip)
  - Crypto-only (TON/RTV) is the safest sovereign option

#### Shared Monorepo (stays): `rtv-telegram-wallet`
- Cloudflare Worker source code, shared libraries, entity schemas, playbooks

---

## 2. WEBHOOK CONSOLIDATION

### Problem
Four Telegram webhook functions deployed, but Telegram only delivers to ONE URL per bot.

### Action
| Function | Status | Action |
|----------|--------|--------|
| telegram-webhook-unified (v7) | ACTIVE | KEEP |
| telegram-webhook (legacy) | DEAD | DECOMMISSION |
| rotationtv-telegram-webhook | DEAD | DECOMMISSION |
| rotationpaybot-webhook | DEAD | DECOMMISSION |

### Steps
1. Verify active webhook per bot via Telegram getWebhookInfo API
2. Confirm unified handler is the active endpoint
3. For dead functions: set verify_jwt: true, remove Telegram update handling
4. Document canonical webhook URLs in repo README

---

## 3. JWT GATE ROLLOUT

### Problem
All 35 deployed functions have NO JWT configuration — they accept unauthenticated requests.

### TIER 1 — Gate immediately (financial/auth):
rtvPaymentHub, rtvPayoutEngine, stripe-webhook, rotationPayGateway, rotationPayConnect, rotationPayBot, rtvAuthGateway, sovereignVaultBridge, vaultInitVerify, rtvsSovereignBot, telegramWalletBridge, rtvWalletDashboard

### TIER 2 — Gate after testing (AI/automation):
openClawOrchestrator, veniceGateway, deepThinkerMasterEngine, rtvDeepThinkEngine, emergentClaudeUnified, openClawEmergentBridge, rtvMasterEnhancement, dailyEcosystemEnhancement

### TIER 3 — Gate last (monitoring):
ecosystemHealthCheck, githubDigestPoster, gmailEcosystemMonitor, rtvPromoBroadcast, rotationCallDebugger, rotationCallEmergentSync, rotationCallWeb3Bridge

### TIER 4 — Keep public (own auth layer):
rtvEdgeGateway (Cloudflare Worker), rtvMiniApp (HMAC-SHA256), rtvMentorEngine, customerMentorBot, bigoModeratorBot, telegramBotHandler, rotationPayWebhook

---

## 4. RAIL COMPLIANCE MATRIX

| Business | Stripe | PayPal | Stars | TON | RTV | CCBill | Crypto |
|----------|--------|--------|-------|-----|-----|--------|--------|
| RotationPay | YES | YES | YES | YES | YES | NO | YES |
| RTV Token | NO | NO | YES | YES | YES | NO | YES |
| RotationCall | YES | YES | YES | NO | YES | NO | NO |
| RTV University | YES | YES | YES | YES | YES | NO | YES |
| Rotation Erotica | NO | NO | YES | YES | YES | DARREL DECIDES | YES |
| Bigo Agency | YES | YES | YES | YES | YES | NO | YES |
| White Logistics | YES | YES | NO | NO | YES | NO | NO |

**CRITICAL:** Stripe + Adult Content = ACCOUNT FREEZE. Never route Stripe through Erotica.

---

## 5. VENICE AI ACTIVATION

1. Darrel adds $5+ credits at venice.ai
2. Hourly monitor detects HTTP 200 (auto-fires)
3. venice-ecosystem-sync pushes 9,831-char context to Venice memory
4. Darrel gets auto-notified
5. Models live: venice-uncensored (moderation), glm-5-1 (reasoning), qwen3-vl (multimodal)

---

## 6. DRIZZLE CODE ADVISORY

The Kimi-generated Drizzle code uses MySQL/PlanetScale — INCOMPATIBLE with our Supabase PostgreSQL stack. Already adapted in `rtv_db_getdb.ts` (pushed to repo). Do NOT wire the MySQL version anywhere.

---

## 7. GO/NO-GO CHECKLIST

### BLOCKERS (must fix):
- [ ] Telegram bot token expired (401) — get new from @BotFather
- [ ] BASE44_SERVICE_ROLE_KEY — not set, no entity writes possible
- [ ] STRIPE_WEBHOOK_SECRET — not set, signature verification fails
- [ ] 3 dead webhook functions — decommission
- [ ] JWT gates on financial functions — open auth risk
- [ ] CCBill decision — Darrel must approve or strip

### IMPORTANT (first week):
- [ ] Venice AI credits ($0 balance)
- [ ] Cloudflare zone routes (token lacks permission)
- [ ] DISCORD_WEBHOOK_URL, RTV_TOKEN_MINT, TON/SOLANA endpoints
- [ ] Kimi API key (need developer key from platform.kimi.ai)
- [ ] Bot-repo split (3 repos)

### READY:
- [x] 3 Cloudflare Workers live
- [x] 15 secrets injected
- [x] 149-file monorepo
- [x] 35 backend functions deployed
- [x] 24 entity schemas active
- [x] 19 frontend pages deployed
- [x] Sovereign payment rails wired
- [x] Stripe purged from Erotica
- [x] 6 ecosystem playbooks (145,718 chars)
- [x] HMAC-SHA256 Telegram auth
- [x] 80/15/5 revenue split configured
- [x] 8 Telegram bot commands wired
- [x] Cloudflare D1/R2/KV active

---

## EXECUTION PRIORITY

**Week 1 — Security:** New bot token, decommission webhooks, JWT gates, service role key
**Week 2 — Split:** Create 3 repos, extract functions, verify Stripe absent from Erotica
**Week 3 — Launch:** Remaining secrets, $1 Stripe test, domain routes, Venice activation

---

*Darrel dictates. Nick executes. The system powers the operation.*
*RTV Launch Playbook v1.0 | July 1, 2026*
