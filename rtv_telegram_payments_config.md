# Telegram Payments 2.0 Configuration
## RTV Sovereign Payment Integration

### Test Environment
- Test Store: https://t.me/TestStore
- Test Card: 4242 4242 4242 4242
- Security Code: Any 3 digits
- Expiry Date: Any future date
- Shop Bot: @ShopBot (start message with @ShopBot + space to send products)

### Production Setup (Sovereign Rails Only)
1. **Telegram Stars (XTR)** — Primary fiat on-ramp
   - Currency: XTR
   - provider_token: "" (empty string = Stars payment)
   - 1 Star = $0.013 USD
   - 1 RTV = $0.01 USD
   - Formula: stars_amount × 0.013 / 0.01 = RTV tokens

2. **TON Jetton** — Primary blockchain settlement
   - Wallet: EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC
   - Fee: 0.5%
   - Settlement: ~5 seconds

3. **Internal RTV Credits** — Rewards, airdrops, referrals
   - Fee: 0%
   - Settlement: Instant
   - Use: Welcome bonus (100 RTV), creator rewards, milestone bonuses

### Bot Commands
/start — Onboard + 100 RTV welcome bonus
/help — Show all commands
/price — Current RTV price (1 RTV = $0.01 USD)
/buy [amount] — Purchase RTV via Stripe (PURGED — redirect to /stars)
/stars [amount] — Purchase RTV via Telegram Stars
/balance — Show RTV balance + USD value
/payout [amount] — Request creator payout
/transactions — Show transaction history

### API Endpoints (Cloudflare Workers)
POST /api/buy/stars — Create Telegram Stars invoice
POST /api/buy/ton — Create TON payment request
GET  /api/balance/:userId — Get user balance
GET  /api/rails — List active payment rails
POST /api/payout — Process creator payout

### Webhook
- Telegram webhook → rtvPaymentHub backend function
- Handles: message, pre_checkout_query, successful_payment
- Allowed updates configured via setWebhook

### Compliance
- Age gate on Mini App (18+ verification)
- HMAC-SHA256 initData verification for all Telegram auth
- No Stripe for adult content (ToS compliance)
- No third-party payment processors (sovereign only)
