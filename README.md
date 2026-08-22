# RotationTV Network — Telegram Stars + Cloudflare Platform

> "Learn it. Live it. Love it. — We keep business rotating globally."

## Architecture (active)

```
rotationtv1-crypto/rtv-telegram-wallet
├── src/
│   ├── lib/                  # telegramStars, telegramCloudSdk, botGateway, webAuth, …
│   ├── hooks/                # useStarsPayment, …
│   ├── pages/ + screens/     # Mini App UI
│   ├── functions/            # Bot / edge handlers
│   └── …
├── deploy/
│   ├── multi-domain/         # Cloudflare routes + custom domain notes
│   └── ORCHESTRATOR_DEPLOYMENT.md
├── wrangler.jsonc            # Cloudflare Worker + assets config
├── package.json
└── .github/workflows/        # CI (typecheck / gated deploy)
```

Legacy packages under `deploy/kimi-cloud`, `deploy/webapp`, `deploy/acme` are **REMOVED** (stubs only).

## Payment surface (user-facing)

| Rail              | Currency | Notes                          |
|-------------------|----------|--------------------------------|
| Telegram Stars    | XTR      | Primary — tips, gifts, subs    |
| TON / Jetton      | TON      | Supported where implemented    |

Stripe payment-create paths are quarantined (HTTP 410).  
Do not re-introduce user-facing RTV-token or Stripe checkout for digital goods/services inside Telegram.

## Cloudflare deploy

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN   # and other secrets
npx wrangler deploy
```

See `deploy/multi-domain/README.md` for `api.` / `bot.` custom domains and Universal SSL.

CI deploys only when `CLOUDFLARE_API_TOKEN` is set in repo secrets.

## Verification checklist

- [ ] Stars invoice path (createInvoiceLink → openInvoice → pre_checkout → successful_payment)
- [ ] No active Stripe / RTV-token purchase UI for in-app digital goods
- [ ] Webhook routing isolated per bot
- [ ] Typecheck + CI green

---
Owner: Rotationtvnetwork LLC
