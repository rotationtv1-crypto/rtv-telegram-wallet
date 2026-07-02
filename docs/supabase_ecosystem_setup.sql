-- RTV Ecosystem Supabase Setup
-- Project: rotationtvai-ecosystem (xynkgaxfwvpcixissxdz)
-- Org: rotationtv1-crypto
-- July 2, 2026

-- ============================================
-- 1. VAULT — Store encrypted ecosystem secrets
-- ============================================

-- Store blockchain treasury addresses
INSERT INTO vault.secrets (name, secret, description)
VALUES 
  ('solana_treasury', '7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv', 'Solana treasury wallet address'),
  ('btc_segwit', 'bc1q7sl2yt2vaz2krlx5jmsxw3aprl7cm979fkwale', 'Bitcoin segwit address'),
  ('eth_treasury', '0x7EbdBD2ED34D05655877a8B9A18955731Bf95133', 'Ethereum treasury address'),
  ('rtv_parity', '0.01', '1 RTV = 0.01 USD economic parity')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- ============================================
-- 2. OAUTH — Telegram auth configuration
-- ============================================

-- Enable Telegram OAuth provider
-- In Supabase Dashboard → Authentication → Providers → Telegram:
-- 1. Enable Telegram provider
-- 2. Set Bot Token: from @BotFather
-- 3. Set Redirect URL: https://xynkgaxfwvpcixissxdz.supabase.co/auth/v1/callback
-- 4. Add to allowed URLs: https://rotationtvai.com

-- ============================================
-- 3. DATABASE WEBHOOKS — Real-time event triggers
-- ============================================

-- Create webhook for payment events
-- In Supabase Dashboard → Database → Webhooks:
-- 1. Create webhook on 'rotationpay_transactions' table
-- 2. Events: INSERT
-- 3. URL: https://rtv-payments.rotationtvaicom.workers.dev/api/webhook/supabase
-- 4. Send in JSON format

-- Create webhook for user registration
-- 1. Create webhook on 'rtv_users' table  
-- 2. Events: INSERT
-- 3. URL: https://rtv-edge-gateway.rotationtvaicom.workers.dev/api/users/new
-- 4. Send in JSON format

-- ============================================
-- 4. CRON JOBS — Scheduled ecosystem tasks
-- ============================================

-- Schedule daily ecosystem report
SELECT cron.schedule(
  'rtv-daily-report',
  '0 8 * * *',
  'SELECT * FROM public.generate_daily_report()'
);

-- Schedule hourly balance check
SELECT cron.schedule(
  'rtv-balance-check',
  '0 * * * *',
  'SELECT * FROM public.check_all_balances()'
);

-- Schedule weekly payout processing
SELECT cron.schedule(
  'rtv-weekly-payouts',
  '0 0 * * 1',
  'SELECT * FROM public.process_pending_payouts()'
);

-- ============================================
-- 5. QUEUES — Message queue for async processing
-- ============================================

-- Create payment processing queue
SELECT pgq.create_queue('payment_processing');

-- Create notification queue
SELECT pgq.create_queue('notifications');

-- Create AI processing queue
SELECT pgq.create_queue('ai_processing');

-- ============================================
-- 6. STRIPE SYNC ENGINE
-- ============================================

-- The Stripe Sync Engine auto-creates these tables:
-- stripe.customers
-- stripe.subscriptions  
-- stripe.invoices
-- stripe.payment_intents
-- stripe.charges
-- stripe.products
-- stripe.prices

-- To enable: Go to Supabase Dashboard → Integrations → Stripe Sync Engine → Connect
-- This will start syncing Stripe data to Postgres automatically

-- ============================================
-- 7. CLOUDFLARE D1 WRAPPER (available to install)
-- ============================================

-- The D1 Wrapper allows reading/writing Cloudflare D1 databases from Postgres
-- To install: Supabase Dashboard → Integrations → Cloudflare D1 Wrapper → Install
-- Config: Account ID = 7e431c541ea0f39d7f7fe5fd9f06eada
-- This bridges D1 edge storage ↔ Supabase Postgres

