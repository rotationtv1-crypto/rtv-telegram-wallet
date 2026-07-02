-- RTV Cloudflare D1 Wrapper Setup
-- Bridges Cloudflare D1 edge storage ↔ Supabase Postgres
-- Account: 7e431c541ea0f39d7f7fe5fd9f06eada

-- The D1 wrapper is INSTALLED. Configure it with:
-- API URL: https://api.cloudflare.com/client/v4/accounts/7e431c541ea0f39d7f7fe5fd9f06eada/d1/database
-- Account ID: 7e431c541ea0f39d7f7fe5fd9f06eada
-- Database ID: (from Cloudflare D1 dashboard — rotation-erotica-db)
-- CF D1 API Token: (use CLOUDFLARE_API_TOKEN_5)

-- Create foreign tables for D1 data
-- These tables bridge D1 edge storage to Supabase

-- Example: Bridge user sessions from D1 edge
CREATE FOREIGN TABLE IF NOT EXISTS d1_user_sessions (
  id text,
  user_id text,
  wallet_address text,
  telegram_id text,
  created_at timestamp,
  expires_at timestamp,
  status text
) SERVER d1_server OPTIONS (table 'user_sessions');

-- Example: Bridge payment cache from D1 edge
CREATE FOREIGN TABLE IF NOT EXISTS d1_payment_cache (
  id text,
  tx_hash text,
  amount_rtv integer,
  amount_usd numeric,
  rail text,
  status text,
  created_at timestamp
) SERVER d1_server OPTIONS (table 'payment_cache');

-- Example: Bridge stream metadata from D1 edge
CREATE FOREIGN TABLE IF NOT EXISTS d1_stream_metadata (
  id text,
  stream_id text,
  creator_id text,
  viewer_count integer,
  tip_count integer,
  status text,
  updated_at timestamp
) SERVER d1_server OPTIONS (table 'stream_metadata');

-- Query D1 data from Supabase:
-- SELECT * FROM d1_user_sessions WHERE status = 'active';
-- SELECT * FROM d1_payment_cache WHERE rail = 'telegram_stars';

