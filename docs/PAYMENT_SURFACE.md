# Payment Surface — Locked Policy

**Effective: 2026-08-22**  
**Entity: Darrel-spell-living-trust**

## User-facing (Mini App / Bot)

| Allowed | Path |
|---------|------|
| ✅ Telegram Stars (XTR) | `frontend/src/hooks/useStarsPayment.ts` |
| ✅ Stars invoice + webhook | `src/lib/telegramStars.ts` |
| ✅ Bot API `createInvoiceLink` / `openInvoice` | currency must be `XTR` |

**Nothing else is user-facing.**

## Backend-only

| Allowed | Notes |
|---------|-------|
| TON Jetton transfer | Creator **payouts** only (not user checkout, not RTV-coin sales) |
| Tribute webhook | Incoming TON support events → ledger |

## Quarantined (HTTP 410)

- Stripe PaymentIntent / Checkout / Connect
- PayPal / Venmo / Zelle / Coinbase rails
- Solana / $RTV token user payments
- `RotationPayCheckout` multi-rail UI
- `stripe-webhook` Deno handler

## Onboarding

Telegram does **not** require gender or age collection.

- **Age gate**: only if the product is adult content (legal/compliance), not a Telegram requirement.
- **Gender**: optional profile field only — never block app entry.
- Do not add mandatory onboarding steps that Telegram does not require.

## Agents / Workers assignment

| Component | Owner |
|-----------|--------|
| Stars invoice + pre_checkout | `telegramStars.ts` + bot webhook Worker |
| Mini App pay button | `useStarsPayment` → `/api/stars/invoice` |
| Edge gateway | `rtv-edge-gateway` (streams/gifts auth) |
| Creator TON payout | payment-gateway / tonRoutes (backend) |
| Pages deploy | `.github/workflows/deploy-pages.yml` (PR #29) |
