-- ═══════════════════════════════════════════════════════════════
-- Rotation Erotica 🌹 — Supabase Schema Migration
-- Agency backend, creator payouts, stream management, onboarding
-- ═══════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── AGENCIES ───
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  website TEXT,
  description TEXT,
  creator_count INTEGER DEFAULT 0,
  monthly_revenue_usd DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'enterprise')),
  revenue_share_pct DECIMAL(5, 2) DEFAULT 20.00,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  api_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CREATORS ───
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'verified', 'premium')),
  stream_key TEXT UNIQUE,
  stream_active BOOLEAN DEFAULT FALSE,
  ton_wallet_address TEXT,
  balance_ton DECIMAL(18, 9) DEFAULT 0,
  balance_usd DECIMAL(12, 2) DEFAULT 0,
  total_earnings_usd DECIMAL(12, 2) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYOUTS ───
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  amount_usd DECIMAL(12, 2) NOT NULL,
  amount_ton DECIMAL(18, 9),
  method TEXT NOT NULL CHECK (method IN ('stripe', 'ton', 'paypal', 'internal')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_transfer_id TEXT,
  ton_tx_hash TEXT,
  tx_signature TEXT,
  min_withdrawal_usd DECIMAL(12, 2) DEFAULT 10.00,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB
);

-- ─── STREAMS ───
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  stream_key TEXT UNIQUE NOT NULL,
  cloudflare_stream_id TEXT,
  cloudflare_playback_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  is_recording BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── KYC DOCUMENTS ───
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'proof_of_address', 'business_license', 'tax_id')),
  file_url TEXT NOT NULL,
  file_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REFERRAL TRACKING ───
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  referred_creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_usd DECIMAL(12, 2) DEFAULT 5.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'paid')),
  qualified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRANSACTIONS (Deposits / Tips / Withdrawals) ───
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('deposit', 'tip', 'withdrawal', 'payout', 'referral_bonus', 'adjustment')),
  amount_usd DECIMAL(12, 2) NOT NULL,
  amount_ton DECIMAL(18, 9),
  ton_tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WEBHOOK EVENTS (Idempotency) ───
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('stripe', 'telegram', 'cloudflare', 'ton', 'internal')),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX idx_creators_agency_id ON creators(agency_id);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_referral_code ON creators(referral_code);
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_agency_id ON payouts(agency_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_streams_creator_id ON streams(creator_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_tx_type ON transactions(tx_type);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_kyc_documents_agency_id ON kyc_documents(agency_id);

-- ═══ ROW LEVEL SECURITY ═══
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Agencies can see their own data
CREATE POLICY "agencies_select_own" ON agencies FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');
CREATE POLICY "agencies_update_own" ON agencies FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Creators visible to their agency
CREATE POLICY "creators_select_own_agency" ON creators FOR SELECT USING (
  agency_id IN (SELECT id FROM agencies WHERE id::text = auth.uid()::text)
  OR auth.role() = 'service_role'
);

-- Payouts visible to owning agency/creator
CREATE POLICY "payouts_select_own" ON payouts FOR SELECT USING (
  agency_id IN (SELECT id FROM agencies WHERE id::text = auth.uid()::text)
  OR auth.role() = 'service_role'
);

-- Streams visible to owning agency
CREATE POLICY "streams_select_own" ON streams FOR SELECT USING (
  creator_id IN (
    SELECT c.id FROM creators c
    JOIN agencies a ON c.agency_id = a.id
    WHERE a.id::text = auth.uid()::text
  )
  OR auth.role() = 'service_role'
);

-- ═══ TRIGGERS — auto-update updated_at ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agencies_updated BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER creators_updated BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ AUTO-GENERATE REFERRAL CODE ON CREATOR INSERT ═══
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = 'ref_' || substr(encode(gen_random_bytes(6), 'hex'), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_referral_code BEFORE INSERT ON creators
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();