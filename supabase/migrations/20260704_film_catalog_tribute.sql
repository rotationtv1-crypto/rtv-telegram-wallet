-- ============================================================
-- RotationTV Network — Enterprise Film Catalog + Tribute Pricing
-- Xfinity-style tiered cable platform replica
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- TABLE: FilmCatalog — Master content library
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."FilmCatalog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identity
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  synopsis TEXT,                        -- Long-form plot summary
  genre TEXT NOT NULL DEFAULT 'drama',
  sub_genres TEXT[] DEFAULT '{}',
  rating TEXT NOT NULL DEFAULT 'TV-MA'
    CHECK (rating IN ('TV-Y','TV-Y7','TV-G','TV-PG','TV-14','TV-MA','R','NC-17')),
  content_flags TEXT[] DEFAULT '{}',    -- 'violence','language','nudity','drug_use','horror'

  -- Production metadata
  studio TEXT,                          -- Production studio name
  director TEXT,
  cast_names TEXT[] DEFAULT '{}',
  release_year INTEGER,
  runtime_min INTEGER NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'en',
  subtitles_available TEXT[] DEFAULT '{en}',
  aspect_ratio TEXT DEFAULT '16:9',
  resolution TEXT DEFAULT '4K' CHECK (resolution IN ('720p','1080p','4K','8K')),
  hdr BOOLEAN DEFAULT false,

  -- Cloudflare Stream references
  cloudflare_video_id TEXT,
  cloudflare_uid TEXT,
  playback_url TEXT,
  download_url TEXT,
  trailer_url TEXT,
  thumbnail_url TEXT,
  poster_url TEXT,                      -- Portrait poster
  banner_url TEXT,                      -- Landscape banner

  -- AI Generation Pipeline
  generation_status TEXT DEFAULT 'pending'
    CHECK (generation_status IN ('pending','scripting','storyboarding','rendering','voicing','compositing','qc','ready','failed','archived')),
  ai_script TEXT,                       -- Generated screenplay
  ai_storyboard JSONB DEFAULT '[]',    -- [{scene_num, description, duration_sec, camera_angle, dialogue}]
  ai_scenes JSONB DEFAULT '[]',        -- [{scene_num, video_url, audio_url, duration_sec}]
  ai_narration_url TEXT,               -- TTS narration track
  ai_soundtrack_url TEXT,              -- Background music
  ai_total_render_time_sec REAL DEFAULT 0,
  ai_generation_cost_usd REAL DEFAULT 0,

  -- Source tracking
  source_type TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (source_type IN ('ai_generated','live_recording','upload','licensed','clip_compilation','short_form')),
  source_vod_id UUID,
  source_stream_id UUID,

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_watch_pct REAL DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tribute_count INTEGER DEFAULT 0,
  total_tributes_rtv REAL DEFAULT 0,

  -- Monetization
  is_free BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_pay_per_view BOOLEAN DEFAULT false,
  price_rtv REAL DEFAULT 0,
  price_usd REAL DEFAULT 0,
  rental_price_rtv REAL DEFAULT 0,      -- 48hr rental
  rental_price_usd REAL DEFAULT 0,
  tribute_min_rtv REAL DEFAULT 1,       -- Minimum tribute to creator
  tribute_suggested_rtv REAL DEFAULT 10,
  ad_breaks JSONB DEFAULT '[]',
  revenue_split JSONB DEFAULT '{"creator":0.80,"platform":0.15,"agency":0.05}',

  -- Availability
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','processing','ready','published','featured','flagged','archived','deleted')),
  published_at TIMESTAMPTZ,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  exclusive_until TIMESTAMPTZ,          -- Premium exclusive window

  -- Catalog organization
  collection_id UUID,                   -- Belongs to series/collection
  episode_number INTEGER,
  season_number INTEGER,
  sort_priority INTEGER DEFAULT 0,       -- Higher = shown first
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  is_trending BOOLEAN DEFAULT false,
  trending_score REAL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: FilmCollection — Series, franchises, bundles
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."FilmCollection" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  collection_type TEXT NOT NULL DEFAULT 'series'
    CHECK (collection_type IN ('series','franchise','bundle','festival','curated','genre_pack')),
  poster_url TEXT,
  banner_url TEXT,
  film_ids UUID[] DEFAULT '{}',
  total_seasons INTEGER DEFAULT 1,
  total_episodes INTEGER DEFAULT 0,
  total_runtime_min INTEGER DEFAULT 0,
  genre TEXT DEFAULT 'drama',
  rating TEXT DEFAULT 'TV-MA',
  is_exclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: TributePricing — Xfinity-style tier pricing
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."TributePricing" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier definition
  tier_name TEXT NOT NULL,
  tier_slug TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL DEFAULT 0,  -- 0=free, 1=basic, 2=premium, 3=platinum
  description TEXT,
  icon_url TEXT,
  badge_color TEXT DEFAULT '#8B5CF6',

  -- Pricing
  monthly_price_rtv REAL NOT NULL DEFAULT 0,
  monthly_price_usd REAL NOT NULL DEFAULT 0,
  annual_price_rtv REAL,                  -- Discounted annual
  annual_price_usd REAL,

  -- Content access
  max_resolution TEXT DEFAULT '1080p',
  max_streams INTEGER DEFAULT 1,          -- Simultaneous streams
  catalog_access TEXT[] DEFAULT '{free}', -- Which catalog tiers accessible
  ad_free BOOLEAN DEFAULT false,
  offline_downloads INTEGER DEFAULT 0,    -- Number of offline downloads
  early_access BOOLEAN DEFAULT false,     -- New releases 24h early
  exclusive_content BOOLEAN DEFAULT false,
  ai_content_credits INTEGER DEFAULT 0,   -- Monthly AI generation credits
  tribute_discount_pct REAL DEFAULT 0,    -- Discount on tributes

  -- Features
  features JSONB DEFAULT '[]',            -- [{icon, label, description}]
  is_popular BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: UserSubscription — User tier subscriptions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."UserSubscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  tier_id UUID NOT NULL REFERENCES public."TributePricing"(id),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','past_due','cancelled','expired','trial')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Payment
  payment_method TEXT DEFAULT 'rtv_token',
  last_payment_rtv REAL DEFAULT 0,
  last_payment_usd REAL DEFAULT 0,
  next_billing_date TIMESTAMPTZ,

  -- Usage
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_remaining INTEGER DEFAULT 0,
  offline_downloads_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, tier_id, status)
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: TributeTransaction — Tribute payments log
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."TributeTransaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  recipient_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  film_id UUID REFERENCES public."FilmCatalog"(id),

  amount_rtv REAL NOT NULL CHECK (amount_rtv > 0),
  amount_usd REAL NOT NULL,
  platform_fee_rtv REAL NOT NULL DEFAULT 0,
  agency_fee_rtv REAL NOT NULL DEFAULT 0,
  creator_share_rtv REAL NOT NULL DEFAULT 0,

  tribute_type TEXT NOT NULL DEFAULT 'content'
    CHECK (tribute_type IN ('content','creator','series','episode','bonus','super_tribute')),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','failed','refunded')),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: FilmGenerationJob — AI film production queue
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."FilmGenerationJob" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  film_id UUID REFERENCES public."FilmCatalog"(id),

  -- Generation config
  job_type TEXT NOT NULL CHECK (job_type IN (
    'script','storyboard','scene_render','voice_over','soundtrack',
    'composite','thumbnail','poster','trailer','full_film','short_form','clip'
  )),
  config JSONB DEFAULT '{}',

  -- Pipeline stage
  stage TEXT NOT NULL DEFAULT 'queued'
    CHECK (stage IN ('queued','scripting','storyboarding','rendering','voicing','compositing','qc','delivering','completed','failed')),
  stage_progress REAL DEFAULT 0,         -- 0.0 to 1.0
  stage_message TEXT,

  -- Dependencies
  depends_on UUID[] DEFAULT '{}',         -- Job IDs that must complete first
  output_artifacts JSONB DEFAULT '{}',    -- {video_url, audio_url, image_url, etc.}

  -- Resource tracking
  gpu_hours REAL DEFAULT 0,
  venice_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,

  -- Retry
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,

  queued_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  priority INTEGER DEFAULT 5
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_film_catalog_genre ON public."FilmCatalog"(genre, status);
CREATE INDEX IF NOT EXISTS idx_film_catalog_rating ON public."FilmCatalog"(rating, status);
CREATE INDEX IF NOT EXISTS idx_film_catalog_published ON public."FilmCatalog"(published_at DESC) WHERE status IN ('published','featured');
CREATE INDEX IF NOT EXISTS idx_film_catalog_trending ON public."FilmCatalog"(trending_score DESC) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_film_catalog_creator ON public."FilmCatalog"(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_film_catalog_collection ON public."FilmCatalog"(collection_id) WHERE collection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_film_catalog_premium ON public."FilmCatalog"(is_premium, status) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_film_catalog_ppv ON public."FilmCatalog"(is_pay_per_view, status) WHERE is_pay_per_view = true;

CREATE INDEX IF NOT EXISTS idx_tribute_pricing_tier ON public."TributePricing"(tier_level, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_sub_user ON public."UserSubscription"(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tribute_tx_sender ON public."TributeTransaction"(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribute_tx_recipient ON public."TributeTransaction"(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribute_tx_film ON public."TributeTransaction"(film_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_film_gen_job_status ON public."FilmGenerationJob"(stage, priority) WHERE stage IN ('queued','scripting','storyboarding','rendering','voicing','compositing');
CREATE INDEX IF NOT EXISTS idx_film_gen_job_creator ON public."FilmGenerationJob"(creator_id, stage);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public."FilmCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FilmCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TributePricing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TributeTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FilmGenerationJob" ENABLE ROW LEVEL SECURITY;

-- FilmCatalog: published content is public, creators see own
CREATE POLICY "film_catalog_published_read" ON public."FilmCatalog"
  FOR SELECT TO authenticated USING (status IN ('published','featured'));
CREATE POLICY "film_catalog_creator_read" ON public."FilmCatalog"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_catalog_creator_insert" ON public."FilmCatalog"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "film_catalog_creator_update" ON public."FilmCatalog"
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_catalog_admin_read" ON public."FilmCatalog"
  FOR SELECT TO authenticated USING (is_admin());

-- FilmCollection: public read
CREATE POLICY "film_collection_public_read" ON public."FilmCollection"
  FOR SELECT TO authenticated USING (true);

-- TributePricing: public read (it's a catalog)
CREATE POLICY "tribute_pricing_public_read" ON public."TributePricing"
  FOR SELECT TO authenticated USING (true);

-- UserSubscription: user sees own
CREATE POLICY "user_sub_self_read" ON public."UserSubscription"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "user_sub_self_insert" ON public."UserSubscription"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_sub_self_update" ON public."UserSubscription"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- TributeTransaction: sender/recipient see own
CREATE POLICY "tribute_tx_sender_read" ON public."TributeTransaction"
  FOR SELECT TO authenticated USING (sender_id = auth.uid()::text);
CREATE POLICY "tribute_tx_recipient_read" ON public."TributeTransaction"
  FOR SELECT TO authenticated USING (recipient_id = auth.uid()::text);
CREATE POLICY "tribute_tx_sender_insert" ON public."TributeTransaction"
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()::text);

-- FilmGenerationJob: creator sees own
CREATE POLICY "film_gen_creator_read" ON public."FilmGenerationJob"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_creator_insert" ON public."FilmGenerationJob"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_admin_read" ON public."FilmGenerationJob"
  FOR SELECT TO authenticated USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- SEED: Xfinity-style Tribute Pricing Tiers
-- ═══════════════════════════════════════════════════════════

INSERT INTO public."TributePricing" (tier_name, tier_slug, tier_level, description, monthly_price_rtv, monthly_price_usd, annual_price_rtv, annual_price_usd, max_resolution, max_streams, catalog_access, ad_free, offline_downloads, early_access, exclusive_content, ai_content_credits, tribute_discount_pct, features, is_popular, is_default, sort_order) VALUES

-- Free Tier
('Free', 'free', 0, 'Watch free content with ads. Limited catalog access.',
 0, 0, NULL, NULL,
 '720p', 1, ARRAY['free'], false, 0, false, false, 0, 0,
 '[{"icon":"📺","label":"Free Content","description":"Access free movies and clips"},{"icon":"📢","label":"Ad-Supported","description":"Short ad breaks between content"}]'::jsonb,
 false, true, 0),

-- Basic Tier
('Basic', 'basic', 1, 'Full catalog access. HD streaming. Ad-light experience.',
 99, 4.99, 990, 49.90,
 '1080p', 1, ARRAY['free','basic'], false, 0, false, false, 5, 0,
 '[{"icon":"🎬","label":"Full Catalog","description":"All basic-tier movies and series"},{"icon":"📺","label":"HD Streaming","description":"1080p quality on all content"},{"icon":"🤖","label":"5 AI Credits","description":"Generate 5 AI content pieces monthly"},{"icon":"📢","label":"Reduced Ads","description":"Fewer ad interruptions"}]'::jsonb,
 true, false, 1),

-- Premium Tier
('Premium', 'premium', 2, '4K HDR streaming. Ad-free. Early access. AI generation.',
 299, 14.99, 2990, 149.90,
 '4K', 2, ARRAY['free','basic','premium'], true, 5, true, false, 25, 10,
 '[{"icon":"🎬","label":"Premium Catalog","description":"Everything in Basic + exclusive content"},{"icon":"✨","label":"4K HDR","description":"Ultra HD with HDR support"},{"icon":"🚫","label":"Ad-Free","description":"Zero ad interruptions"},{"icon":"⏰","label":"Early Access","description":"New releases 24 hours early"},{"icon":"🤖","label":"25 AI Credits","description":"Generate 25 AI content pieces monthly"},{"icon":"💾","label":"5 Downloads","description":"Download for offline viewing"},{"icon":"💰","label":"10% Tribute Discount","description":"Save on creator tributes"}]'::jsonb,
 false, false, 2),

-- Platinum Tier
('Platinum', 'platinum', 3, '8K streaming. Everything unlocked. Unlimited AI. VIP tributes.',
 599, 29.99, 5990, 299.90,
 '8K', 4, ARRAY['free','basic','premium','platinum'], true, 20, true, true, 100, 25,
 '[{"icon":"👑","label":"Full Platform Access","description":"Every movie, series, and exclusive"},{"icon":"🔮","label":"8K Streaming","description":"Maximum quality available"},{"icon":"🚫","label":"Ad-Free","description":"Zero ads forever"},{"icon":"⏰","label":"Instant Access","description":"New releases immediately"},{"icon":"🤖","label":"100 AI Credits","description":"Full AI generation suite"},{"icon":"💾","label":"20 Downloads","description":"Massive offline library"},{"icon":"💰","label":"25% Tribute Discount","description":"Maximum tribute savings"},{"icon":"🎯","label":"4 Simultaneous Streams","description":"Share with household"},{"icon":"🎭","label":"Exclusive Content","description":"Platinum-only movies and series"}]'::jsonb,
 false, false, 3);

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: Process tribute payment (atomic)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.process_tribute(
  p_sender_id TEXT,
  p_recipient_id TEXT,
  p_film_id UUID,
  p_amount_rtv REAL,
  p_tribute_type TEXT DEFAULT 'content',
  p_message TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_platform_fee REAL;
  v_agency_fee REAL;
  v_creator_share REAL;
  v_split JSONB;
  v_tribute_id UUID;
  v_sender_balance REAL;
BEGIN
  -- Get revenue split from film
  SELECT revenue_split INTO v_split FROM public."FilmCatalog" WHERE id = p_film_id;

  IF v_split IS NULL THEN
    v_split := '{"creator":0.80,"platform":0.15,"agency":0.05}'::jsonb;
  END IF;

  v_creator_share := p_amount_rtv * COALESCE((v_split->>'creator')::real, 0.80);
  v_platform_fee := p_amount_rtv * COALESCE((v_split->>'platform')::real, 0.15);
  v_agency_fee := p_amount_rtv * COALESCE((v_split->>'agency')::real, 0.05);

  -- Check sender balance (simplified — real version checks TON wallet)
  SELECT COALESCE(rtv_balance, 0) INTO v_sender_balance
  FROM public."RtvUser" WHERE id = p_sender_id;

  IF v_sender_balance < p_amount_rtv THEN
    RETURN jsonb_build_object('status', 'insufficient_balance', 'balance', v_sender_balance, 'required', p_amount_rtv);
  END IF;

  -- Deduct from sender
  UPDATE public."RtvUser" SET rtv_balance = rtv_balance - p_amount_rtv WHERE id = p_sender_id;

  -- Credit creator
  UPDATE public."RtvUser" SET rtv_balance = rtv_balance + v_creator_share WHERE id = p_recipient_id;

  -- Credit platform wallet (tracked separately)
  -- Agency fee goes to agency owner if applicable

  -- Record transaction
  INSERT INTO public."TributeTransaction" (
    sender_id, recipient_id, film_id,
    amount_rtv, amount_usd,
    platform_fee_rtv, agency_fee_rtv, creator_share_rtv,
    tribute_type, message, is_anonymous, status
  ) VALUES (
    p_sender_id, p_recipient_id, p_film_id,
    p_amount_rtv, p_amount_rtv * 0.01,
    v_platform_fee, v_agency_fee, v_creator_share,
    p_tribute_type, p_message, p_is_anonymous, 'completed'
  ) RETURNING id INTO v_tribute_id;

  -- Update film tribute count
  UPDATE public."FilmCatalog" SET
    tribute_count = tribute_count + 1,
    total_tributes_rtv = total_tributes_rtv + p_amount_rtv
  WHERE id = p_film_id;

  RETURN jsonb_build_object(
    'status', 'completed',
    'tribute_id', v_tribute_id,
    'amount_rtv', p_amount_rtv,
    'creator_share', v_creator_share,
    'platform_fee', v_platform_fee,
    'agency_fee', v_agency_fee
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_tribute(TEXT, TEXT, UUID, REAL, TEXT, TEXT, BOOLEAN) FROM anon;

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: Get catalog by tier (Xfinity-style browsing)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_catalog_by_tier(
  p_user_id TEXT,
  p_genre TEXT DEFAULT NULL,
  p_rating TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 40,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public."FilmCatalog"
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT f.*
  FROM public."FilmCatalog" f
  LEFT JOIN public."UserSubscription" us ON us.user_id = p_user_id AND us.status = 'active'
  LEFT JOIN public."TributePricing" tp ON tp.id = us.tier_id
  WHERE f.status IN ('published', 'featured')
    AND (p_genre IS NULL OR f.genre = p_genre)
    AND (p_rating IS NULL OR f.rating = p_rating)
    AND (
      f.is_free = true
      OR f.is_premium = false
      OR (f.is_premium = true AND tp.tier_level >= 2)
      OR (f.is_pay_per_view = true)
    )
    AND (f.available_from IS NULL OR f.available_from <= now())
    AND (f.available_until IS NULL OR f.available_until > now())
  ORDER BY
    f.is_featured DESC,
    f.is_trending DESC,
    f.trending_score DESC,
    f.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

REVOKE EXECUTE ON FUNCTION public.get_catalog_by_tier(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM anon;
