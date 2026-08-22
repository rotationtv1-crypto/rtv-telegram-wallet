# Telegram Mini App + Cloudflare Workers Compliance

RotationTV Network — production baseline for all Mini Apps under the ecosystem.

## Stack pattern (compliant)

```
[Telegram Client]
       │  menu / inline web_app URL (HTTPS Pages)
       ▼
[Mini App frontend — Cloudflare Pages]
       │  Telegram.WebApp.initData (never trust client-only)
       ▼
[Cloudflare Worker — Hono or raw fetch]
       ├─ validate initData (HMAC WebAppData + auth_date)
       ├─ Stars: createInvoiceLink (XTR) / openInvoice
       ├─ webhook: pre_checkout_query ≤ 10s, successful_payment
       └─ Supabase (service role only on edge; RLS for client)
```

## Required secrets (Worker env only)

| Binding | Purpose |
|---------|---------|
| `TELEGRAM_BOT_TOKEN_*` | Per-bot Bot API |
| `ADMIN_SECRET` | Setup / admin routes |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Persistence |
| Webhook secret | `secret_token` on setWebhook |

Never put bot tokens in Vite `VITE_*` / `NEXT_PUBLIC_*`.

## initData validation

Implementation: `src/lib/telegramAuth.ts`

```
secret_key = HMAC_SHA256("WebAppData", bot_token)
hash       = HMAC_SHA256(secret_key, data_check_string)
```

Reject if `auth_date` older than policy (default 24h).

## Payments

- User-facing digital goods: **Telegram Stars only** (`currency: "XTR"`, empty `provider_token`)
- Stripe paths quarantined (`410 GONE`)
- See `docs/PAYMENT_SURFACE.md`

## Menu buttons

- Target **Pages** Mini App URL so Telegram injects real initData
- `scripts/setup-webapp-menus.mjs` or `POST /api/bots/setup-menu-all`

## Gender-segmented onboarding

State machine lives under `rotationtv/src/index.ts` (gender → interestedIn → tiers).
Persist sessions in Supabase with RLS scoped by `telegram_id`.

## Nuclear history purge (operator only)

After rotating any leaked tokens:

1. Do **not** put real secrets in chat or PRs
2. Locally: `git filter-repo --replace-text expressions.txt` with **placeholder** patterns
3. Force-push only after team coordination
4. Rely on gitleaks CI going forward

## Related

- Issue #39 — ecosystem epic
- PR #36 / #38 — menu buttons + Worker wire
