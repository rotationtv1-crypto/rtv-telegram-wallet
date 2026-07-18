-- ═══════════════════════════════════════════════════════════════════════════
-- RotationTV Live AI Clones — Supabase Schema
-- Full platform: users, streams, tips, gifts, mining, trading, moderation
-- Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id       BIGINT UNIQUE NOT NULL,
  username          TEXT,
  display_name      TEXT,
  avatar_url        TEXT,
  email             TEXT,
  is_creator        BOOLEAN DEFAULT FALSE,
  is_verified       BOOLEAN DEFAULT FALSE,
  verified_age      BOOLEAN DEFAULT FALSE,
  verified_at       TIMESTAMPTZ,
  role              TEXT DEFAULT 'viewer' CHECK (role IN ('viewer','creator','agency','admin')),
  rtv_balance       DECIMAL(18,4) DEFAULT 0,
  total_earnings    DECIMAL(18,4) DEFAULT 0,
  total_followers   INTEGER DEFAULT 0,
  total_views       INTEGER DEFAULT 0,
  ecosystem         TEXT DEFAULT 'rotationtv',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STREAMS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_streams (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  title                   TEXT,
  description             TEXT,
  category                TEXT DEFAULT 'general',
  stream_key              TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  cloudflare_stream_id    TEXT,
  cloudflare_playback_url TEXT,
  cloudflare_rtmp_url     TEXT,
  thumbnail_url           TEXT,
  status                  TEXT DEFAULT 'offline' CHECK (status IN ('offline','live','ended')),
  viewer_count            INTEGER DEFAULT 0,
  peak_viewers            INTEGER DEFAULT 0,
  total_viewers           INTEGER DEFAULT 0,
  total_tips_rtv          DECIMAL(18,4) DEFAULT 0,
  total_tips_usd          DECIMAL(12,2) DEFAULT 0,
  is_recording            BOOLEAN DEFAULT TRUE,
  is_archived             BOOLEAN DEFAULT FALSE,
  recording_url           TEXT,
  tags                    TEXT[] DEFAULT '{}',
  started_at              TIMESTAMPTZ,
  ended_at                TIMESTAMPTZ,
  duration_sec            INTEGER,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GIFTS CATALOGUE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gifts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  emoji         TEXT NOT NULL,
  price_rtv     DECIMAL(18,4) NOT NULL,
  price_usd     DECIMAL(12,4) GENERATED ALWAYS AS (price_rtv * 0.01) STORED,
  category      TEXT DEFAULT 'standard',
  animation_url TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default gifts
INSERT INTO gifts (name, emoji, price_rtv, category, sort_order) VALUES
  ('Rose',        '🌹',  5,     'basic',    1),
  ('Heart',       '❤️',  10,    'basic',    2),
  ('Star',        '⭐',  25,    'basic',    3),
  ('Crown',       '👑',  100,   'premium',  4),
  ('Diamond',     '💎',  500,   'premium',  5),
  ('Rocket',      '🚀',  1000,  'premium',  6),
  ('RTV Logo',    '⚡',  2500,  'exclusive',7),
  ('Presidential','🏛️', 10000, 'exclusive',8)
ON CONFLICT DO NOTHING;

-- ─── TIPS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tips (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id     UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id),
  receiver_id   UUID REFERENCES users(id),
  gift_id       UUID REFERENCES gifts(id),
  gift_name     TEXT,
  gift_emoji    TEXT,
  amount_rtv    DECIMAL(18,4) NOT NULL,
  amount_usd    DECIMAL(12,4) GENERATED ALWAYS AS (amount_rtv * 0.01) STORED,
  combo_count   INTEGER DEFAULT 1,
  message       TEXT,
  is_anonymous  BOOLEAN DEFAULT FALSE,
  -- Revenue split
  creator_rtv   DECIMAL(18,4) GENERATED ALWAYS AS (amount_rtv * 0.80) STORED,
  platform_rtv  DECIMAL(18,4) GENERATED ALWAYS AS (amount_rtv * 0.15) STORED,
  agency_rtv    DECIMAL(18,4) GENERATED ALWAYS AS (amount_rtv * 0.05) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PK BATTLES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pk_battles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id_a     UUID REFERENCES live_streams(id),
  stream_id_b     UUID REFERENCES live_streams(id),
  creator_a_id    UUID REFERENCES users(id),
  creator_b_id    UUID REFERENCES users(id),
  score_a         DECIMAL(18,4) DEFAULT 0,
  score_b         DECIMAL(18,4) DEFAULT 0,
  winner_id       UUID REFERENCES users(id),
  winner_rtv      DECIMAL(18,4) DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','ended')),
  duration_sec    INTEGER DEFAULT 300,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MINING REWARDS (Proof of Activity) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mining_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_id     BIGINT NOT NULL,
  activity_type   TEXT NOT NULL CHECK (activity_type IN (
                    'stream_hour','tip_sent','tip_received','pk_win',
                    'daily_login','referral','watch_hour','subscription'
                  )),
  reward_rtv      DECIMAL(18,4) NOT NULL,
  wallet_address  TEXT,
  tx_hash         TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','distributed','failed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Mining reward rates
CREATE TABLE IF NOT EXISTS mining_rates (
  activity_type   TEXT PRIMARY KEY,
  reward_rtv      DECIMAL(18,4) NOT NULL,
  cooldown_sec    INTEGER DEFAULT 3600,
  daily_cap       INTEGER DEFAULT 10,
  is_active       BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO mining_rates (activity_type, reward_rtv, cooldown_sec, daily_cap) VALUES
  ('stream_hour',  25,    3600,  8),
  ('tip_sent',     1,     0,     100),
  ('tip_received', 2,     0,     500),
  ('pk_win',       100,   86400, 3),
  ('daily_login',  10,    86400, 1),
  ('referral',     50,    0,     20),
  ('watch_hour',   5,     3600,  4),
  ('subscription', 100,   2592000, 1)
ON CONFLICT DO NOTHING;

-- ─── AI BROADCAST SESSIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_broadcast_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id       UUID REFERENCES live_streams(id),
  active_host     TEXT NOT NULL CHECK (active_host IN ('LEO','MAYA','DR_REED','ZARA','OMAR','LINA')),
  host_started_at TIMESTAMPTZ DEFAULT NOW(),
  fatigue_level   DECIMAL(5,2) DEFAULT 0,
  handoff_reason  TEXT,
  human_detected  BOOLEAN DEFAULT FALSE,
  viewer_count    INTEGER DEFAULT 0,
  messages_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MODERATION LOG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id       UUID REFERENCES live_streams(id),
  user_id         UUID REFERENCES users(id),
  telegram_id     BIGINT,
  content         TEXT,
  action          TEXT NOT NULL CHECK (action IN ('allow','warn','ban')),
  category        TEXT CHECK (category IN ('none','harassment','hate_speech','sexual_content','spam','scam','violence','illegal')),
  severity        DECIMAL(4,2),
  confidence      DECIMAL(4,2),
  reason          TEXT,
  ai_model        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('basic','pro','enterprise')),
  price_usd       DECIMAL(12,2) NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trial')),
  stripe_sub_id   TEXT,
  ton_tx_hash     TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plan rates
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price_usd   DECIMAL(12,2) NOT NULL,
  features    JSONB,
  is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO subscription_plans (id, name, price_usd, features) VALUES
  ('basic',      'Basic',      9.99,  '{"hd_streaming":false,"ai_features":false,"priority_support":false}'),
  ('pro',        'Pro',        29.99, '{"hd_streaming":true,"ai_features":true,"priority_support":false}'),
  ('enterprise', 'Enterprise', 99.99, '{"hd_streaming":true,"ai_features":true,"priority_support":true,"white_label":true}')
ON CONFLICT DO NOTHING;

-- ─── FOLLOWS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_telegram_id      ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role);
CREATE INDEX IF NOT EXISTS idx_live_streams_status    ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_creator   ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_tips_stream_id         ON tips(stream_id);
CREATE INDEX IF NOT EXISTS idx_tips_sender            ON tips(sender_id);
CREATE INDEX IF NOT EXISTS idx_tips_receiver          ON tips(receiver_id);
CREATE INDEX IF NOT EXISTS idx_tips_created           ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mining_user_id         ON mining_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_telegram        ON mining_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_moderation_stream      ON moderation_log(stream_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user     ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower       ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following      ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id, read);

-- ═══ ROW LEVEL SECURITY ═════════════════════════════════════════════════════
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- Users: public profiles visible, private data own only
CREATE POLICY "users_public_read" ON users FOR SELECT USING (TRUE);
CREATE POLICY "users_own_update"  ON users FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Streams: all public, only creator can update
CREATE POLICY "streams_public_read"  ON live_streams FOR SELECT USING (TRUE);
CREATE POLICY "streams_creator_write" ON live_streams FOR ALL USING (auth.uid()::text = creator_id::text OR auth.role() = 'service_role');

-- Tips: visible to sender and receiver
CREATE POLICY "tips_own_read" ON tips FOR SELECT USING (
  auth.uid()::text = sender_id::text OR
  auth.uid()::text = receiver_id::text OR
  auth.role() = 'service_role'
);

-- Mining: own records only
CREATE POLICY "mining_own" ON mining_events FOR ALL USING (
  auth.uid()::text = user_id::text OR auth.role() = 'service_role'
);

-- Subscriptions: own only
CREATE POLICY "subs_own" ON subscriptions FOR ALL USING (
  auth.uid()::text = user_id::text OR auth.role() = 'service_role'
);

-- Notifications: own only
CREATE POLICY "notif_own" ON notifications FOR ALL USING (
  auth.uid()::text = user_id::text OR auth.role() = 'service_role'
);

-- Follows: public
CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_own_write"   ON follows FOR ALL USING (
  auth.uid()::text = follower_id::text OR auth.role() = 'service_role'
);

-- Moderation: admin/service role only
CREATE POLICY "mod_log_service_only" ON moderation_log FOR ALL USING (
  auth.role() = 'service_role'
);

-- ═══ TRIGGERS ═══════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update follower count on follow/unfollow
CREATE OR REPLACE FUNCTION sync_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET total_followers = total_followers + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET total_followers = GREATEST(0, total_followers - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follows_count_sync
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION sync_follower_count();

-- Auto-update creator earnings when tip inserted
CREATE OR REPLACE FUNCTION sync_creator_earnings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
    SET total_earnings = total_earnings + NEW.creator_rtv,
        rtv_balance    = rtv_balance + NEW.creator_rtv,
        updated_at     = NOW()
    WHERE id = NEW.receiver_id;
  -- Update stream tip total
  UPDATE live_streams
    SET total_tips_rtv = total_tips_rtv + NEW.amount_rtv,
        total_tips_usd = total_tips_usd + (NEW.amount_rtv * 0.01)
    WHERE id = NEW.stream_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tips_earnings_sync
  AFTER INSERT ON tips
  FOR EACH ROW EXECUTE FUNCTION sync_creator_earnings();

-- ═══════════════════════════════════════════════════════════════════════════
-- Rotationtvnetwork LLC | Presidential Authority: Darrel | 2026
-- ═══════════════════════════════════════════════════════════════════════════
