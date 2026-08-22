# Stripe purge — GET /api/payment/create

## Status
- `createStripeCheckoutSession` import must be removed from `src/index.ts`
- `GET /api/payment/create` must return HTTP 410 with `TELEGRAM_STARS_ONLY`
- `/api/gifts` block must close before `/api/stars/*` routes
- User payments: `useStarsPayment` + `telegramStars.ts` only

## Policy
User-facing = Telegram Stars (XTR).
TON = backend creator payouts only.
