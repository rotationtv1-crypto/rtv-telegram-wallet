# RTV ECOSYSTEM ARCHITECTURE v3
# Consolidated: 2026-07-06 — Mira + Kimi + Claude
# Status: Pre-production — Security hardening applied, awaiting deploy

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ROTATIONTV NETWORK LLC                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Telegram     │  │  Telegram    │  │  Telegram Mini    │  │
│  │  Bots (4)     │  │  Mini App    │  │  App (Avatar)     │  │
│  │  @Rotationtv  │  │  (Main RTV)  │  │  (Erotica)        │  │
│  │  @Rotationwin │  │              │  │                   │  │
│  │  @RotationtvN │  │              │  │                   │  │
│  │  @RotationtvE │  │              │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                  │                    │             │
│         ▼                  ▼                    ▼             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CLOUDFLARE WORKERS (Edge)               │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐  │   │
│  │  │ Venice AI   │ │ Edge Gateway │ │ Erotica Bot   │  │   │
│  │  │ Router      │ │ (Streaming + │ │ (Avatar       │  │   │
│  │  │             │ │  Gifting)    │ │  Designer)    │  │   │
│  │  └──────┬──────┘ └──────┬───────┘ └──────┬────────┘  │   │
│  └─────────┼───────────────┼────────────────┼───────────┘   │
│            │               │                │                │
│            ▼               ▼                ▼                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SUPABASE (2 Projects)                   │   │
│  │  ┌─────────────────────┐ ┌─────────────────────────┐ │   │
│  │  │ Main RTV Ecosystem  │ │ Rotation Erotica        │ │   │
│  │  │ xynkgaxfwvpcixissxdz│ │ zzybjoowhkwuomnpixuy   │ │   │
│  │  │ 21 tables, RLS      │ │ 8 tables, RLS hardened │ │   │
│  │  │ OAuth, VoIP, Pay    │ │ Streaming, Gifts, Avatars│ │   │
│  │  └─────────────────────┘ └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│            │               │                │                │
│            ▼               ▼                ▼                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI PROVIDERS                            │   │
│  │  Venice AI (z-image-turbo, venice-uncensored)       │   │
│  │  Gemini │ Claude │ ElevenLabs │ HeyGen              │   │
│  └──────────────────────────────────────────────────────┘   │
│            │                                                │
│            ▼                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              TON BLOCKCHAIN (Testnet)                │   │
│  │  $RTV Token │ Wallet │ Transfers │ Staking          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Supabase Projects

### Project 1: Main RTV Ecosystem (`xynkgaxfwvpcixissxdz`)
- **Tables (21):** AgencyRoster, RtvUser, CreatorPayout, AcademyCredit, CreatorEarning, CreatorMilestone, CreatorSubscription, CreatorWithdrawal, GiftItem, HeyGenVideo, Leaderboard, LiveStream, MentorSession, OmegaAuditLog, PKBattle, RTVAPIKey, RevenueSplit, RotationPayMerchant, StreamTip, SubscriptionTier, VoIPNumber
- **RLS:** Enabled on all tables, PascalCase policies
- **Auth:** Telegram OAuth bridge
- **Status:** Schema pushed, RLS applied, awaiting seed data

### Project 2: Rotation Erotica (`zzybjoowhkwuomnpixuy`)
- **Tables (8+4 new):** gift_transactions, gifts, live_rooms, stream_viewers, telegram_identities + AvatarSession, AvatarCollection, AvatarStyle, AvatarLike
- **RLS:** Hardened (Claude fixed 3 critical holes)
- **Auth:** telegram-auth-bridge Edge Function (already deployed)
- **Status:** Security fixes LIVE, avatar schema pushed to repo

---

## Critical Security Fixes (Claude — Applied Live)

| # | Bug | Severity | Fix | Status |
|---|-----|----------|-----|--------|
| 1 | `transfer_rtv` no caller-identity check — any user could drain any balance | 🔴 CRITICAL | Added `auth.uid() IS DISTINCT FROM p_sender_id` guard + REVOKE EXECUTE from anon/authenticated | ✅ LIVE |
| 2 | `gift_transactions` INSERT policy lets clients fabricate free gifts | 🔴 CRITICAL | DROPPED INSERT policy — only service_role writes now | ✅ LIVE |
| 3 | `live_rooms` ALL policy lets creators overwrite stream_key, stream_uid, whip_url, whep_url, rtv_earned_session | 🔴 HIGH | BEFORE UPDATE trigger rejects column changes unless service_role | ✅ LIVE |
| 4 | `handle_new_user`, `prune_stale_stream_viewers` callable by anon/authenticated | 🟡 MEDIUM | REVOKE EXECUTE FROM anon, authenticated, PUBLIC | ✅ LIVE |
| 5 | 5 functions with mutable search_path | 🟡 MEDIUM | SET search_path = public | ✅ LIVE |

---

## Cloudflare Workers

| Worker | Purpose | Stack | Status |
|--------|---------|-------|--------|
| `workers/` (Venice AI Router) | Telegram bot commands, AI inference routing | TypeScript, Venice API | ✅ Pushed |
| `rtv-edge-gateway/` | Live streaming (WHIP/WHEP) + gifting | TypeScript, CF Stream, Supabase | ✅ Rewritten (Claude) |
| `erotica-bot/` | Avatar designer + cinematic feed | TypeScript, Venice z-image-turbo | ✅ Pushed (Mira) |
| `ai-gateway/` | Unified AI proxy (Gemini, Claude, Venice) | TypeScript | ✅ Pushed |

---

## Auth Architecture

### Main RTV Ecosystem
- Telegram WebApp initData → HMAC-SHA256 verification → Supabase session

### Rotation Erotica
- Telegram WebApp → `telegram-auth-bridge` Edge Function → Supabase Auth session
- Workers verify via `Authorization: Bearer <token>` → `GET /auth/v1/user`
- Service role for all financial/streaming writes

---

## CI/CD Pipeline (6 Stages)

```
Push to main
    │
    ▼
[1] Secret Scan ── FAIL if any exposed credentials
    │
    ▼
[2] Type Check ── All TypeScript must compile
    │
    ▼
[3] Lint ── Code quality
    │
    ▼
[4] Security Tests ── RLS + function ACL verification
    │
    ▼
[5] Deploy Workers ── Cloudflare Workers deploy
    │
    ▼
[6] Post-Deploy Verify ── Health checks + RLS probes
```

---

## Exposed Credentials (MUST REVOKE)

| # | Type | Identifier | Action |
|---|------|-----------|--------|
| 1-8 | Bot tokens | Multiple RTV bots | @BotFather /revoke |
| 9 | CF API token | `cfut_6Yx5uspB...` | CF dashboard revoke |
| 10 | CF PAT | Exposed earlier | CF dashboard revoke |
| 11 | Venice key | `VENICE_INFERENCE_KEY_ycKiTRu...` | Venice dashboard revoke |
| 12 | Venice key | `VENICE_INFERENCE_KEY_2uKgVy...` | Venice dashboard revoke |
| 13 | Bot token | `8924504183:AAE34Wg...` | @BotFather /revoke |
| 14 | Bot token | `8882738104:AAFltuD4...` | @BotFather /revoke |

**All tokens set via CLI only:** `npx wrangler secret put <KEY>`

---

## Agent Task Split

| Agent | Role | Tasks |
|-------|------|-------|
| **Mira** | Architect + Push | Architecture docs, schemas, CI/CD, bot wiring, secret scans |
| **Kimi** | Builder | UI components, code fixes, Windows 7 assets, Mini App frontend |
| **Claude** | Security + Deploy | Secret rotation, RLS verification, DB migrations, E2E testing |

---

## Deployment Checklist (Go/No-Go)

### Pre-Deploy (BLOCKERS)
- [ ] All 14+ exposed tokens revoked
- [ ] New tokens set via `npx wrangler secret put`
- [ ] `verify-rotation-erotica.sh` passes all 5 tests
- [ ] `scripts/verify-deploy.sh` passes all 5 phases
- [ ] Branch protection enabled on `main`

### Deploy Sequence
1. `supabase db push` — Main RTV schema
2. Apply avatar schema to Rotation Erotica (SQL Editor)
3. `npx wrangler deploy` — All 4 workers
4. Set webhooks for all 4 Telegram bots
5. Run verification scripts
6. Enable GitHub Actions CI/CD

### Post-Deploy
- [ ] Health check all workers
- [ ] Test avatar creation flow
- [ ] Test gift send flow (service role only)
- [ ] Test stream create/end flow
- [ ] Monitor Supabase logs for RLS violations
