# KEY ROTATION — Production Runbook

**RotationTV Network LLC | Entity: Darrel-spell-living-trust**

Automated + semi-automated rotation for every secret in `SECRETS_REGISTRY.md`.

## Principles

1. **Never log or commit secret values.** Only metadata (which key, when, success/fail).
2. **Rotate after any history scrub** (see `docs/SECURITY-SECRET-SCRUB.md`).
3. **Telegram bot tokens require human step** — BotFather has no public token-creation API.
4. **Cloudflare / GitHub / Wrangler can be fully automated** with proper admin tokens.
5. **Venice multi-key** supports cycling PRIMARY → SECONDARY → TERTIARY without downtime.

## Quick Start

### Manual (local)

```bash
# Dry-run (shows plan, writes nothing)
./scripts/rotate/orchestrate.sh --dry-run

# Rotate Cloudflare + Wrangler + GitHub secrets
./scripts/rotate/orchestrate.sh --providers=cloudflare,wrangler,github

# Full cycle including Telegram checklist notification
./scripts/rotate/orchestrate.sh --all
```

### CI (GitHub Actions)

1. Go to **Actions → Rotate Secrets → Run workflow**
2. Choose providers / dry-run
3. Workflow uses repository secrets:
   - `ROTATION_CF_API_TOKEN` (Cloudflare token with Account.API Tokens Edit)
   - `ROTATION_GITHUB_TOKEN` (PAT with `secrets` + `actions` scope, or use `GITHUB_TOKEN` with permissions)
   - `CLOUDFLARE_ACCOUNT_ID`
   - Existing worker secrets remain the source of truth until rotated

Schedule: monthly on the 1st (configurable in workflow).

## Provider Details

| Provider | Automation level | Notes |
|----------|------------------|-------|
| Cloudflare API tokens | Full | Create new → update consumers → revoke old |
| GitHub Actions secrets | Full | REST API update |
| Wrangler Worker secrets | Full | `wrangler secret put` via CI or local |
| Venice AI keys | Cycle | Swap primary/secondary/tertiary in registry + workers |
| Telegram bot tokens | Semi | Checklist + optional Telegram alert; human uses @BotFather |
| Kimi / Gemini / others | Semi | Notification only; rotate on provider console |
| Supabase | Semi | Dashboard or Management API |

## Required Admin Secrets (one-time setup)

Store these in GitHub → Settings → Secrets → Actions:

```
ROTATION_CF_API_TOKEN=          # CF token that can create/revoke other tokens
ROTATION_GITHUB_TOKEN=          # fine-grained PAT or classic with secrets:write
CLOUDFLARE_ACCOUNT_ID=
ROTATION_NOTIFY_WEBHOOK=        # optional Slack/Telegram webhook for alerts
```

## After every rotation

1. Confirm health: `curl $WORKER_URL/api/kimi/health` and bot webhook info
2. Confirm Stars invoices still work (test gift of 1⭐)
3. Update `SECRETS_REGISTRY.md` timestamps (no values)
4. Close related security issues if complete

## Telegram Bot Token Rotation Procedure (human)

1. Open @BotFather → `/mybots` → select bot → API Token → Revoke
2. Copy new token
3. `npx wrangler secret put TELEGRAM_BOT_TOKEN_6` (or _7, etc.)
4. Re-set webhooks via `botGateway` / Cloud SDK `setBotWebhook`
5. Verify with `getWebhookInfo`

The rotation workflow emits this checklist automatically when `--providers=telegram` is selected.

## Audit

All runs append a line to `rotation-audit.log` (local) or create a GitHub Action summary (CI). Format:

```
2026-08-15T20:00:00Z | cloudflare | success | token_id=abc123 | rotated_by=ci
2026-08-15T20:00:05Z | telegram   | pending_human | bots=main,erotica
```

Never includes secret material.
