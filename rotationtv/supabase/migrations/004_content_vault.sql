-- Migration: 004_content_vault.sql
-- Creator Content Vault + Subscription System
-- Rotationtvnetwork LLC | June 28, 2026

-- ── Creator Content Library ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('video','photo','album','live_replay','audio')) DEFAULT 'video',
  r2_key TEXT NOT NULL,
  thumbnail_r2_key TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  tier_required TEXT DEFAULT 'basic' CHECK (tier_required IN ('free','basic','pro','enterprise')),
  price_rtv INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_nsfw BOOLEAN DEFAULT false,
  age_restricted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Creator Subscriptions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic','pro','enterprise')),
  price_usd DECIMAL(10,2) NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('stripe','ton','stars','paypal','tribute')),
  payment_ref TEXT,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','paused')),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fan_id, creator_id)
);

-- ── Pay-Per-View Access ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ppv_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES creator_content(id) ON DELETE CASCADE,
  price_rtv INT NOT NULL,
  price_usd DECIMAL(10,2),
  payment_method TEXT,
  payment_ref TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (fan_id, content_id) -- dedupe
) ON CONFLICT DO NOTHING;

-- ── Content Reactions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES creator_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like','love','fire','wow','sad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES creator_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES content_comments(id),
  body TEXT NOT NULL CHECK (char_length(body) <= 500),
  is_moderated BOOLEAN DEFAULT false,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_creator ON creator_content(creator_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_type ON creator_content(content_type, is_published);
CREATE INDEX IF NOT EXISTS idx_subs_fan_creator ON creator_subscriptions(fan_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_subs_expires ON creator_subscriptions(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_subs_creator ON creator_subscriptions(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_ppv_fan ON ppv_access(fan_id, content_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE creator_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppv_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Creators see own content; public sees published free content
CREATE POLICY "content_creator_own" ON creator_content
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "content_public_free" ON creator_content
  FOR SELECT USING (is_published = true AND tier_required = 'free');

-- Fans see their own subscriptions
CREATE POLICY "subs_own_fan" ON creator_subscriptions
  FOR ALL USING (fan_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "ppv_own_fan" ON ppv_access
  FOR ALL USING (fan_id = auth.uid());

CREATE POLICY "comments_read" ON content_comments
  FOR SELECT USING (is_moderated = false);

CREATE POLICY "comments_write" ON content_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── Trigger: update updated_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creator_content_updated_at
  BEFORE UPDATE ON creator_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
