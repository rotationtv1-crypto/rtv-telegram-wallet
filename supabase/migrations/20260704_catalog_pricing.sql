-- ============================================================
-- RotationTV Network — Enterprise VOD Catalog + Pricing
-- Xfinity-style streaming catalog with tribute tiers
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- TABLE: CatalogChannel — Xfinity-style channel lineup
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."CatalogChannel" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  category TEXT NOT NULL DEFAULT 'entertainment'
    CHECK (category IN ('entertainment','lifestyle','music','gaming','education','comedy','talk','sports','news','cinematic','shorts')),
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free','basic','premium','vip','platinum')),
  price_rtv REAL DEFAULT 0,
  price_usd REAL DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','coming_soon')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: CatalogVod — Full film/content library
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."CatalogVod" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public."CatalogChannel"(id),
  creator_id TEXT REFERENCES public."RtvUser"(id),

  -- Content metadata
  title TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,                     -- Long-form plot summary
  genre TEXT[] DEFAULT '{}',
  subgenre TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating TEXT DEFAULT 'TV-MA'
    CHECK (rating IN ('TV-Y','TV-Y7','TV-G','TV-PG','TV-14','TV-MA','R','NC-17','UR')),
  content_flags TEXT[] DEFAULT '{}', -- 'mature','violence','language','nudity','drug_use'
  release_year INTEGER,
  runtime_minutes INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  subtitles TEXT[] DEFAULT '{}',

  -- Media assets
  cloudflare_video_id TEXT,
  playback_url TEXT,
  trailer_url TEXT,
  poster_url TEXT,                   -- Portrait poster
  backdrop_url TEXT,                 -- Landscape backdrop
  thumbnail_url TEXT,

  -- AI-generated content
  ai_summary TEXT,
  ai_transcript TEXT,
  ai_chapters JSONB DEFAULT '[]',
  ai_mood TEXT CHECK (ai_mood IN ('energetic','chill','funny','educational','dramatic','romantic','hype','dark','suspenseful','inspiring')),
  ai_script TEXT,                    -- Full AI-generated screenplay
  ai_storyboard JSONB DEFAULT '[]', -- [{scene_num, description, image_prompt, duration_sec}]

  -- Source tracking
  source_type TEXT NOT NULL DEFAULT 'live_recording'
    CHECK (source_type IN ('live_recording','upload','ai_generated','clip','highlight','short','film','series_episode','documentary','special')),
  source_stream_id UUID,
  episode_number INTEGER,
  season_number INTEGER,
  series_id UUID REFERENCES public."CatalogVod"(id),  -- Self-ref for series

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  avg_watch_pct REAL DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,

  -- Monetization
  access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free','basic','premium','vip','platinum','pay_per_view','rental')),
  price_rtv REAL DEFAULT 0,
  price_usd REAL DEFAULT 0,
  rental_price_rtv REAL DEFAULT 0,
  rental_duration_hours INTEGER DEFAULT 48,
  is_premium BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  exclusive_until TIMESTAMPTZ,

  -- Tribute system (tips during viewing)
  tribute_enabled BOOLEAN DEFAULT true,
  tribute_tiers JSONB DEFAULT '[]',  -- [{name, amount_rtv, perks}]
  total_tributes_rtv REAL DEFAULT 0,
  total_tributes_count INTEGER DEFAULT 0,

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','ready','premiere','live','ended','failed','archived','flagged','deleted')),
  premiere_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  is_trending BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: SubscriptionPlan — Xfinity-style packages
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."SubscriptionPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tier TEXT NOT NULL
    CHECK (tier IN ('free','basic','premium','vip','platinum')),

  -- Pricing
  price_rtv_monthly REAL NOT NULL DEFAULT 0,
  price_usd_monthly REAL NOT NULL DEFAULT 0,
  price_rtv_yearly REAL DEFAULT 0,
  price_usd_yearly REAL DEFAULT 0,

  -- Features
  max_streams INTEGER DEFAULT 1,
  max_resolution TEXT DEFAULT '720p'
    CHECK (max_resolution IN ('480p','720p','1080p','4k')),
  concurrent_devices INTEGER DEFAULT 1,
  offline_downloads INTEGER DEFAULT 0,
  ad_free BOOLEAN DEFAULT false,
  exclusive_content BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  ai_clone_access BOOLEAN DEFAULT false,
  creator_tools BOOLEAN DEFAULT false,

  -- Included channels
  included_channel_ids UUID[] DEFAULT '{}',
  included_genres TEXT[] DEFAULT '{}',

  -- Trial
  trial_days INTEGER DEFAULT 0,

  sort_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: TributeTier — Tipping levels during content viewing
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."TributeTier" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  amount_rtv REAL NOT NULL,
  amount_usd REAL NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '💎',
  animation_url TEXT,
  sound_url TEXT,
  display_color TEXT DEFAULT '#FFD700',
  is_animated BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: FilmGeneration — AI cinematic content pipeline
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."FilmGeneration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES public."RtvUser"(id),

  -- Film spec
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  subgenre TEXT[] DEFAULT '{}',
  synopsis TEXT,
  tone TEXT DEFAULT 'dramatic'
    CHECK (tone IN ('suspenseful','heartwarming','humorous','dramatic','dark','inspiring','romantic','thrilling','chill','hype')),
  setting TEXT,
  era TEXT,
  runtime_target_minutes INTEGER DEFAULT 15,
  rating TEXT DEFAULT 'TV-MA',

  -- Characters
  characters JSONB DEFAULT '[]',
  -- [{name, age, gender, personality, background, appearance, voice_id}]

  -- Generation config
  ai_model TEXT DEFAULT 'zai-org-glm-5-2',
  image_model TEXT DEFAULT 'z-image-turbo',
  tts_model TEXT DEFAULT 'tts-elevenlabs-turbo-v2-5',
  voice_cast JSONB DEFAULT '{}',
  -- {character_name: voice_id}

  -- Generation state
  status TEXT NOT NULL DEFAULT 'drafting'
    CHECK (status IN ('drafting','scripting','storyboarding','rendering','voicing','compositing','review','ready','failed','cancelled')),
  current_step TEXT,
  progress_pct REAL DEFAULT 0,

  -- Generated assets
  script TEXT,
  storyboard JSONB DEFAULT '[]',
  scenes JSONB DEFAULT '[]',
  -- [{scene_num, dialogue, narration, image_prompt, tts_text, duration_sec, transition}]

  voice_tracks JSONB DEFAULT '{}',
  -- {character_name: storage_path}

  final_video_url TEXT,
  final_duration_sec INTEGER DEFAULT 0,

  -- Cost tracking
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  tts_seconds REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,

  -- Output
  catalog_vod_id UUID REFERENCES public."CatalogVod"(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: UserSubscription — Active subscriptions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."UserSubscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  plan_id UUID NOT NULL REFERENCES public."SubscriptionPlan"(id),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','expired','trial','past_due')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment
  payment_method TEXT DEFAULT 'rtv_token'
    CHECK (payment_method IN ('rtv_token','ton','usd','stripe','free')),
  last_payment_rtv REAL DEFAULT 0,
  last_payment_usd REAL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, plan_id, status)
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_catalog_channel_slug ON public."CatalogChannel"(slug) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_catalog_channel_tier ON public."CatalogChannel"(tier, sort_order) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_catalog_vod_channel ON public."CatalogVod"(channel_id, status) WHERE status IN ('ready','premiere','live');
CREATE INDEX IF NOT EXISTS idx_catalog_vod_genre ON public."CatalogVod"(genre) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_catalog_vod_tier ON public."CatalogVod"(access_tier, published_at DESC) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_catalog_vod_featured ON public."CatalogVod"(is_featured, featured_until) WHERE is_featured = true AND status = 'ready';
CREATE INDEX IF NOT EXISTS idx_catalog_vod_trending ON public."CatalogVod"(is_trending, view_count DESC) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_catalog_vod_series ON public."CatalogVod"(series_id, season_number, episode_number) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_vod_creator ON public."CatalogVod"(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_sub_plan_tier ON public."SubscriptionPlan"(tier, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_film_gen_status ON public."FilmGeneration"(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_film_gen_creator ON public."FilmGeneration"(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_user_sub_user ON public."UserSubscription"(user_id, status) WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public."CatalogChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CatalogVod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TributeTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FilmGeneration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSubscription" ENABLE ROW LEVEL SECURITY;

-- CatalogChannel: public read
CREATE POLICY "catalog_channel_public_read" ON public."CatalogChannel"
  FOR SELECT TO authenticated USING (status = 'active');

-- CatalogVod: tier-gated read
CREATE POLICY "catalog_vod_free_read" ON public."CatalogVod"
  FOR SELECT TO authenticated USING (access_tier = 'free' AND status IN ('ready','premiere','live'));
CREATE POLICY "catalog_vod_subscriber_read" ON public."CatalogVod"
  FOR SELECT TO authenticated USING (
    status IN ('ready','premiere','live') AND (
      access_tier = 'free' OR
      EXISTS (SELECT 1 FROM public."UserSubscription" us
        JOIN public."SubscriptionPlan" sp ON sp.id = us.plan_id
        WHERE us.user_id = auth.uid()::text AND us.status = 'active'
        AND sp.tier >= public."CatalogVod".access_tier)
    )
  );
CREATE POLICY "catalog_vod_creator_read" ON public."CatalogVod"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_creator_insert" ON public."CatalogVod"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_creator_update" ON public."CatalogVod"
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_admin_read" ON public."CatalogVod"
  FOR SELECT TO authenticated USING (is_admin());

-- SubscriptionPlan: public read
CREATE POLICY "sub_plan_public_read" ON public."SubscriptionPlan"
  FOR SELECT TO authenticated USING (status = 'active');

-- TributeTier: public read
CREATE POLICY "tribute_tier_public_read" ON public."TributeTier"
  FOR SELECT TO authenticated USING (status = 'active');

-- FilmGeneration: creator owns
CREATE POLICY "film_gen_creator_read" ON public."FilmGeneration"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_creator_insert" ON public."FilmGeneration"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_creator_update" ON public."FilmGeneration"
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);

-- UserSubscription: user owns
CREATE POLICY "user_sub_self_read" ON public."UserSubscription"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "user_sub_self_insert" ON public."UserSubscription"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- SEED DATA: Xfinity-style channel lineup
-- ═══════════════════════════════════════════════════════════

INSERT INTO public."CatalogChannel" (name, slug, description, category, tier, price_rtv_monthly, sort_order) VALUES
('RotationTV Live', 'rtv-live', 'Live streaming from top creators', 'entertainment', 'free', 0, 1),
('RTV Cinema', 'rtv-cinema', 'Cable-grade cinematic films and series', 'cinematic', 'basic', 50, 2),
('RTV Shorts', 'rtv-shorts', 'Quick hits, clips, and highlights', 'shorts', 'free', 0, 3),
('RTV Music', 'rtv-music', 'Live performances, DJ sets, music videos', 'music', 'free', 0, 4),
('RTV Gaming', 'rtv-gaming', 'Gaming streams, tournaments, PK battles', 'gaming', 'free', 0, 5),
('RTV Talk', 'rtv-talk', 'Talk shows, interviews, podcasts', 'talk', 'free', 0, 6),
('RTV Lifestyle', 'rtv-lifestyle', 'Cooking, fitness, daily life streams', 'lifestyle', 'free', 0, 7),
('RTV Comedy', 'rtv-comedy', 'Stand-up, improv, comedy sketches', 'comedy', 'free', 0, 8),
('RTV Education', 'rtv-education', 'Tutorials, courses, skill building', 'education', 'basic', 25, 9),
('RTV Premium', 'rtv-premium', 'Exclusive content, early access, no ads', 'entertainment', 'premium', 150, 10),
('RTV VIP', 'rtv-vip', 'VIP access, AI clones, creator tools', 'entertainment', 'vip', 500, 11),
('RTV Platinum', 'rtv-platinum', 'Everything unlocked, priority everything', 'entertainment', 'platinum', 1000, 12);

-- Seed subscription plans
INSERT INTO public."SubscriptionPlan" (name, slug, description, tier, price_rtv_monthly, price_usd_monthly, max_streams, max_resolution, concurrent_devices, offline_downloads, ad_free, exclusive_content, priority_support, ai_clone_access, creator_tools, trial_days, sort_order, is_popular) VALUES
('Free', 'free', 'Watch free channels and content', 'free', 0, 0, 1, '720p', 1, 0, false, false, false, false, false, 0, 1, true),
('Basic', 'basic', 'Unlock cinema, education, and ad-light viewing', 'basic', 50, 4.99, 2, '1080p', 2, 5, false, false, false, false, false, 7, 2, true),
('Premium', 'premium', 'Full library, no ads, exclusive premieres', 'premium', 150, 14.99, 3, '4k', 3, 20, true, true, true, false, false, 14, 3, true),
('VIP', 'vip', 'AI clone access, creator tools, priority support', 'vip', 500, 49.99, 5, '4k', 5, 50, true, true, true, true, true, 30, 4, false),
('Platinum', 'platinum', 'Everything unlocked, unlimited everything', 'platinum', 1000, 99.99, 10, '4k', 10, 999, true, true, true, true, true, 30, 5, false);

-- Seed tribute tiers
INSERT INTO public."TributeTier" (name, slug, amount_rtv, amount_usd, emoji, display_color, sort_order) VALUES
('Rose', 'rose', 1, 0.01, '🌹', '#FF6B6B', 1),
('Diamond', 'diamond', 10, 0.10, '💎', '#00D4FF', 2),
('Crown', 'crown', 50, 0.50, '👑', '#FFD700', 3),
('Rocket', 'rocket', 100, 1.00, '🚀', '#FF4500', 4),
('Castle', 'castle', 500, 5.00, '🏰', '#9B59B6', 5),
('Planet', 'planet', 1000, 10.00, '🪐', '#2ECC71', 6),
('Galaxy', 'galaxy', 5000, 50.00, '🌌', '#E74C3C', 7),
('Universe', 'universe', 10000, 100.00, '🌌', '#F39C12', 8);
