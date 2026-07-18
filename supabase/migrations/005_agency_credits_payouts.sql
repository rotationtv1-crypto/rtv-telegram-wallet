-- ============================================================
-- MIGRATION 005 — Agency+, Host Pricing, Credits Systems, Payouts
-- RotationTV Network LLC | June 28, 2026
-- ============================================================

-- ── 1. PLATFORM PLANS (creator subscription tiers) ───────────────────────
DROP TABLE IF EXISTS subscription_plans CASCADE;
CREATE TABLE subscription_plans (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  price_usd     DECIMAL(12,2) NOT NULL,
  price_rtv     DECIMAL(18,4) GENERATED ALWAYS AS (price_usd / 0.01) STORED,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  features      JSONB DEFAULT '[]',
  max_viewers   INTEGER DEFAULT 1000,
  max_storage_gb INTEGER DEFAULT 10,
  ai_credits_mo INTEGER DEFAULT 0,      -- included AI credits per month
  priority_support BOOLEAN DEFAULT FALSE,
  badge_color   TEXT DEFAULT '#6C5CE7',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (id, name, price_usd, billing_cycle, features, max_viewers, max_storage_gb, ai_credits_mo, priority_support, badge_color, sort_order) VALUES
-- VIEWER PLANS (fan subscriptions to creators)
('viewer_basic',    'Basic',      9.99,  'monthly', '["All photos","Monthly live access","DM access","HD streams"]', 500, 5, 0, FALSE, '#6C5CE7', 10),
('viewer_pro',      'Pro',       29.99,  'monthly', '["All content","Weekly lives","Priority DMs","Video vault","Custom requests","4K streams"]', 2000, 20, 0, FALSE, '#A29BFE', 20),
('viewer_enterprise','VIP Elite', 99.99, 'monthly', '["Everything in Pro","Private shows","1-on-1 sessions","Dedicated manager","White-glove service"]', 999999, 100, 0, TRUE, '#00CEC9', 30),

-- CREATOR PLANS (what creators pay to host)
('creator_starter', 'Creator Starter', 0.00, 'monthly', '["Go live","Basic analytics","Tip collection","TON/Stripe payouts"]', 100, 5, 50, FALSE, '#00B894', 40),
('creator_pro',     'Creator Pro',    29.99, 'monthly', '["Everything in Starter","AI co-host","Advanced analytics","Custom RTMP","Priority queue","500 AI credits/mo"]', 5000, 50, 500, FALSE, '#6C5CE7', 50),
('creator_elite',   'Creator Elite',  99.99, 'monthly', '["Everything in Pro","Dedicated node","Agency dashboard","Revenue share boost","2000 AI credits/mo","Manager access"]', 999999, 200, 2000, TRUE, '#FDCB6E', 60),

-- AGENCY PLANS
('agency_basic',    'Agency Basic',   199.00, 'monthly', '["Up to 10 creators","Agency analytics","Batch payouts","Basic support"]', 999999, 500, 1000, FALSE, '#FF6B35', 70),
('agency_pro',      'Agency Pro',     499.00, 'monthly', '["Up to 50 creators","White-label","Custom branding","Priority nodes","5000 AI credits/mo","Dedicated manager"]', 999999, 2000, 5000, TRUE, '#E17055', 80),
('agency_enterprise','Agency Enterprise', 1499.00, 'monthly', '["Unlimited creators","Full white-label","Custom integrations","SLA 99.99%","Unlimited AI credits","24/7 support"]', 999999, 99999, -1, TRUE, '#FF4444', 90),

-- HOST PLANS (AI host engine)
('host_basic',      'AI Host Basic',   49.99, 'monthly', '["3 AI hosts","8h runtime/day","Basic TTS","Script generation"]', 1000, 10, 200, FALSE, '#A29BFE', 100),
('host_pro',        'AI Host Pro',    149.99, 'monthly', '["6 AI hosts","24h runtime","HeyGen avatars","Multi-language","1000 AI credits/mo"]', 10000, 50, 1000, FALSE, '#6C5CE7', 110),
('host_enterprise', 'AI Host Elite',  499.99, 'monthly', '["Unlimited hosts","Real-time face-swap","Custom personas","API access","Unlimited credits"]', 999999, 500, -1, TRUE, '#00CEC9', 120);

-- ── 2. CREDIT SYSTEMS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- "Starter Pack", "Pro Bundle"
  company       TEXT NOT NULL,                    -- "emergentlabs", "rotationtv", "replit_style"
  credits       INTEGER NOT NULL,                 -- number of AI credits
  bonus_credits INTEGER DEFAULT 0,                -- bonus on top
  price_usd     DECIMAL(12,2) NOT NULL,
  price_rtv     DECIMAL(18,4),                   -- optional: pay in RTVS
  stripe_price_id TEXT,                           -- Stripe Price ID (from Stripe dashboard)
  description   TEXT,
  features      JSONB DEFAULT '[]',
  expires_days  INTEGER DEFAULT 365,              -- credits expire after N days (0 = never)
  is_subscription BOOLEAN DEFAULT FALSE,          -- true = monthly recurring
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO credit_packages (name, company, credits, bonus_credits, price_usd, description, features, expires_days, sort_order) VALUES
-- EmergentLabs AI Credits (EmergentLabs company in ecosystem)
('EmergentLabs Starter',  'emergentlabs',  100,    0,   5.00,  'Entry-level AI credits for EmergentLabs platform', '["100 AI requests","Venice uncensored","Kimi code review","Basic analytics"]', 365, 10),
('EmergentLabs Basic',    'emergentlabs',  500,   50,  20.00,  'Standard credit bundle with 10% bonus',            '["550 AI requests","Priority queue","All models","30-day usage analytics"]', 365, 20),
('EmergentLabs Pro',      'emergentlabs', 2000,  400,  60.00,  'Professional bundle — 20% bonus credits',          '["2400 AI requests","Batch processing","API access","Custom prompts","Priority GPU"]', 365, 30),
('EmergentLabs Elite',    'emergentlabs', 10000, 3000, 250.00, 'Elite bundle — 30% bonus + priority access',       '["13000 AI requests","Dedicated inference","SLA 99.9%","Custom models","Account manager"]', 365, 40),
('EmergentLabs Unlimited','emergentlabs', -1,    0,    500.00, 'Unlimited monthly credits — Replit-style subscription', '["Unlimited requests","All models","Dedicated nodes","Priority support","Custom rate limits"]', 30, 50),

-- RTV Platform Credits (for tips, streaming, AI hosts)
('RTV Micro Pack',   'rotationtv',  1000,    0,    5.00,  '1000 RTVS — starter pack', '["1000 RTVS tokens","Instant delivery","All platforms"]', 0, 60),
('RTV Standard',     'rotationtv',  5000,  500,   20.00,  '5000 RTVS + 500 bonus',    '["5500 RTVS tokens","10% bonus","Priority processing"]', 0, 70),
('RTV Premium',      'rotationtv', 25000, 5000,   80.00,  '25K RTVS + 5K bonus',      '["30000 RTVS tokens","20% bonus","VIP badge","Custom profile"]', 0, 80),
('RTV Whale',        'rotationtv',100000,30000,  250.00,  '100K RTVS + 30K bonus',    '["130000 RTVS tokens","30% bonus","Agency access","Dedicated manager","PK invites"]', 0, 90),

-- Replit-style: compute credits for RotationErotica content generation
('Content Gen Starter',  'emergentlabs',  50,    0,    9.99,  'AI content generation — 50 image/video credits',  '["50 AI generations","Venice image pipeline","All styles","HD quality"]', 30, 100),
('Content Gen Pro',      'emergentlabs', 250,   50,   39.99,  '250 generations + 50 bonus — monthly',           '["300 AI generations","4K quality","Commercial license","Priority queue"]', 30, 110),
('Content Gen Unlimited','emergentlabs',  -1,    0,   99.99,  'Unlimited AI content generation — monthly',      '["Unlimited generations","Fastest GPU","Commercial license","API access","White-label"]', 30, 120);

-- ── 3. USER CREDIT LEDGER ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company       TEXT NOT NULL DEFAULT 'rotationtv',
  credit_type   TEXT NOT NULL DEFAULT 'ai',        -- 'ai', 'rtvs', 'content_gen', 'stream'
  balance       INTEGER NOT NULL DEFAULT 0,
  used_total    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  plan_id       TEXT REFERENCES subscription_plans(id),
  stripe_sub_id TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company, credit_type)
);

-- Credit transactions (audit log)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company       TEXT NOT NULL DEFAULT 'rotationtv',
  credit_type   TEXT NOT NULL DEFAULT 'ai',
  amount        INTEGER NOT NULL,                  -- positive=add, negative=deduct
  balance_after INTEGER NOT NULL,
  reason        TEXT NOT NULL,                     -- 'purchase', 'usage', 'bonus', 'refund', 'expiry'
  package_id    UUID REFERENCES credit_packages(id),
  stripe_payment_id TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_user_credits_user ON user_credits(user_id);

-- ── 4. STRIPE CONNECT — CREATOR ACCOUNTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id     TEXT NOT NULL UNIQUE,      -- acct_xxx — connected account
  account_type          TEXT DEFAULT 'express',     -- 'express', 'standard', 'custom'
  country               TEXT DEFAULT 'US',
  currency              TEXT DEFAULT 'usd',
  payouts_enabled       BOOLEAN DEFAULT FALSE,
  charges_enabled       BOOLEAN DEFAULT FALSE,
  details_submitted     BOOLEAN DEFAULT FALSE,
  onboarding_url        TEXT,
  onboarding_expires_at TIMESTAMPTZ,
  default_payout_method TEXT DEFAULT 'stripe',
  minimum_payout_usd    DECIMAL(12,2) DEFAULT 10.00,
  payout_schedule       TEXT DEFAULT 'weekly',     -- 'daily', 'weekly', 'monthly', 'manual'
  payout_day            TEXT DEFAULT 'monday',
  total_paid_out_usd    DECIMAL(18,4) DEFAULT 0,
  pending_balance_usd   DECIMAL(18,4) DEFAULT 0,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. PAYPAL MULTIPARTY PAYOUTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paypal_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  paypal_email    TEXT NOT NULL,
  paypal_payer_id TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  currency        TEXT DEFAULT 'USD',
  min_payout_usd  DECIMAL(12,2) DEFAULT 10.00,
  total_paid_usd  DECIMAL(18,4) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. PAYOUT QUEUE (unified — Stripe + PayPal + TON + Tribute) ──────────
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS stripe_transfer_id    TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS paypal_payout_id      TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS ton_tx_hash           TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS fee_usd               DECIMAL(12,4) DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS net_usd               DECIMAL(12,4);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_at          TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS failure_reason        TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS retry_count           INTEGER DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS platform_share_usd    DECIMAL(12,4);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS agency_share_usd      DECIMAL(12,4);

-- ── 7. TRIBUTE PAYMENT SYSTEM ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tributes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES users(id),
  receiver_id     UUID NOT NULL REFERENCES users(id),
  amount_usd      DECIMAL(12,2) NOT NULL,
  amount_rtv      DECIMAL(18,4) GENERATED ALWAYS AS (amount_usd / 0.01) STORED,
  message         TEXT,
  is_anonymous    BOOLEAN DEFAULT FALSE,
  platform_fee    DECIMAL(12,4) GENERATED ALWAYS AS (amount_usd * 0.15) STORED,
  agency_fee      DECIMAL(12,4) GENERATED ALWAYS AS (amount_usd * 0.05) STORED,
  creator_net     DECIMAL(12,4) GENERATED ALWAYS AS (amount_usd * 0.80) STORED,
  stripe_charge_id TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded','disputed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. AGENCY+ HOST PRICING ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS host_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID REFERENCES users(id),      -- NULL = platform default
  host_id         TEXT NOT NULL,                  -- 'LEO', 'MAYA', 'DR_REED', 'ZARA', 'OMAR', 'LINA'
  host_name       TEXT NOT NULL,
  pricing_model   TEXT DEFAULT 'per_hour',        -- 'per_hour', 'per_stream', 'flat_monthly', 'revenue_share'
  price_usd       DECIMAL(12,2) NOT NULL,
  price_rtv       DECIMAL(18,4) GENERATED ALWAYS AS (price_usd / 0.01) STORED,
  min_hours       DECIMAL(4,1) DEFAULT 1.0,
  max_hours       DECIMAL(4,1) DEFAULT 24.0,
  revenue_share_pct DECIMAL(5,2) DEFAULT 0,       -- % of stream revenue (for rev-share model)
  ai_credits_per_hour INTEGER DEFAULT 10,
  tts_provider    TEXT DEFAULT 'elevenlabs',      -- 'elevenlabs', 'heygen', 'workers_ai', 'openai'
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Default platform host pricing
INSERT INTO host_pricing (host_id, host_name, pricing_model, price_usd, min_hours, max_hours, revenue_share_pct, ai_credits_per_hour, tts_provider) VALUES
('LEO',     'LEO — The Anchor',      'per_hour', 9.99,   1, 24, 5.0,  15, 'elevenlabs'),
('MAYA',    'MAYA — Energetic',      'per_hour', 9.99,   1, 24, 5.0,  15, 'elevenlabs'),
('DR_REED', 'DR. REED — Analyst',   'per_hour', 14.99,  1, 12, 7.5,  20, 'heygen'),
('ZARA',    'ZARA — Wildcard',       'per_hour', 12.99,  1, 24, 6.0,  18, 'venice_ai'),
('OMAR',    'OMAR — Chill',          'per_hour', 7.99,   1, 24, 4.0,  10, 'workers_ai'),
('LINA',    'LINA — Co-Host',        'per_hour', 9.99,   1, 24, 5.0,  12, 'elevenlabs'),
-- Bundle: all 6 hosts
('ALL_HOSTS','Full Broadcast Grid',  'flat_monthly', 299.00, 0, 0, 15.0, 100, 'mixed');

-- ── 9. AGENCY CREATOR ROSTER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agency_creators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES users(id),
  creator_id      UUID NOT NULL REFERENCES users(id),
  commission_pct  DECIMAL(5,2) DEFAULT 5.00,      -- agency cut (default 5%)
  contract_start  DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end    DATE,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','paused','terminated')),
  custom_split    JSONB DEFAULT '{"creator": 80, "platform": 15, "agency": 5}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, creator_id)
);

-- ── 10. PAYOUT SCHEDULES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) UNIQUE,
  method          TEXT NOT NULL DEFAULT 'stripe',  -- 'stripe','paypal','ton','tribute','manual'
  frequency       TEXT NOT NULL DEFAULT 'weekly',  -- 'daily','weekly','biweekly','monthly','manual'
  day_of_week     INTEGER DEFAULT 1,               -- 0=Sun, 1=Mon
  min_amount_usd  DECIMAL(12,2) DEFAULT 10.00,
  auto_payout     BOOLEAN DEFAULT TRUE,
  stripe_account_id TEXT,
  paypal_email    TEXT,
  ton_address     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX idx_stripe_accounts_user    ON stripe_accounts(user_id);
CREATE INDEX idx_paypal_accounts_user    ON paypal_accounts(user_id);
CREATE INDEX idx_tributes_receiver       ON tributes(receiver_id, created_at DESC);
CREATE INDEX idx_agency_creators_agency  ON agency_creators(agency_id);
CREATE INDEX idx_host_pricing_host       ON host_pricing(host_id);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE credit_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_creators        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_credits"   ON user_credits       FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "users_own_stripe"    ON stripe_accounts    FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "users_own_paypal"    ON paypal_accounts    FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "users_own_tributes"  ON tributes           FOR SELECT USING (auth.uid()::text IN (sender_id::text, receiver_id::text));
CREATE POLICY "agency_own_roster"   ON agency_creators    FOR ALL USING (auth.uid()::text = agency_id::text);
