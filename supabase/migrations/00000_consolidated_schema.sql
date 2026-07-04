-- ============================================================
-- RotationTV Network — CONSOLIDATED SCHEMA
-- Single migration: all tables, indexes, RLS, functions, seeds
-- Merges: full_schema, content_feed, transfer_gift, ai_cron,
--         rls_policies, catalog_pricing, film_catalog_tribute,
--         full_schema_v2, hours_dashboard, ai_cron_config
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- CORE USER TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."RtvUser" (
  id TEXT PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer','creator','admin','super_admin')),
  rtv_balance REAL DEFAULT 0,
  ton_wallet_address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CreatorProfile" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE REFERENCES public."RtvUser"(id),
  stage_name TEXT,
  bio TEXT,
  tags TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  ai_clone_id TEXT,
  ai_clone_config JSONB DEFAULT '{}',
  total_tributes_rtv REAL DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','banned','inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- STREAMING & CONTENT
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."LiveStream" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT REFERENCES public."RtvUser"(id),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'entertainment',
  cloudflare_uid TEXT,
  playback_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','failed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_tributes_rtv REAL DEFAULT 0,
  vod_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."VodLibrary" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES public."LiveStream"(id),
  creator_id TEXT REFERENCES public."RtvUser"(id),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'entertainment',
  cloudflare_video_id TEXT,
  playback_url TEXT,
  thumbnail_url TEXT,
  duration_sec INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','ready','failed','archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- CATALOG & CHANNELS (Xfinity-style)
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
  price_rtv_monthly REAL DEFAULT 0,
  price_usd_monthly REAL DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','coming_soon')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CatalogVod" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public."CatalogChannel"(id),
  creator_id TEXT REFERENCES public."RtvUser"(id),
  title TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  genre TEXT[] DEFAULT '{}',
  subgenre TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating TEXT DEFAULT 'TV-MA'
    CHECK (rating IN ('TV-Y','TV-Y7','TV-G','TV-PG','TV-14','TV-MA','R','NC-17','UR')),
  content_flags TEXT[] DEFAULT '{}',
  release_year INTEGER,
  runtime_minutes INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  subtitles TEXT[] DEFAULT '{}',
  cloudflare_video_id TEXT,
  playback_url TEXT,
  trailer_url TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  thumbnail_url TEXT,
  ai_summary TEXT,
  ai_transcript TEXT,
  ai_chapters JSONB DEFAULT '[]',
  ai_mood TEXT CHECK (ai_mood IN ('energetic','chill','funny','educational','dramatic','romantic','hype','dark','suspenseful','inspiring')),
  ai_script TEXT,
  ai_storyboard JSONB DEFAULT '[]',
  source_type TEXT NOT NULL DEFAULT 'live_recording'
    CHECK (source_type IN ('live_recording','upload','ai_generated','clip','highlight','short','film','series_episode','documentary','special')),
  source_stream_id UUID,
  episode_number INTEGER,
  season_number INTEGER,
  series_id UUID REFERENCES public."CatalogVod"(id),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  avg_watch_pct REAL DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  access_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (access_tier IN ('free','basic','premium','vip','platinum','pay_per_view','rental')),
  price_rtv REAL DEFAULT 0,
  price_usd REAL DEFAULT 0,
  rental_price_rtv REAL DEFAULT 0,
  rental_duration_hours INTEGER DEFAULT 48,
  is_premium BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  exclusive_until TIMESTAMPTZ,
  tribute_enabled BOOLEAN DEFAULT true,
  tribute_tiers JSONB DEFAULT '[]',
  total_tributes_rtv REAL DEFAULT 0,
  total_tributes_count INTEGER DEFAULT 0,
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
-- SUBSCRIPTIONS & PRICING
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."SubscriptionPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free','basic','premium','vip','platinum')),
  price_rtv_monthly REAL NOT NULL DEFAULT 0,
  price_usd_monthly REAL NOT NULL DEFAULT 0,
  price_rtv_yearly REAL DEFAULT 0,
  price_usd_yearly REAL DEFAULT 0,
  max_streams INTEGER DEFAULT 1,
  max_resolution TEXT DEFAULT '720p' CHECK (max_resolution IN ('480p','720p','1080p','4k')),
  concurrent_devices INTEGER DEFAULT 1,
  offline_downloads INTEGER DEFAULT 0,
  ad_free BOOLEAN DEFAULT false,
  exclusive_content BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  ai_clone_access BOOLEAN DEFAULT false,
  creator_tools BOOLEAN DEFAULT false,
  included_channel_ids UUID[] DEFAULT '{}',
  included_genres TEXT[] DEFAULT '{}',
  trial_days INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."UserSubscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  plan_id UUID NOT NULL REFERENCES public."SubscriptionPlan"(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trial','past_due')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'rtv_token' CHECK (payment_method IN ('rtv_token','ton','usd','stripe','free')),
  last_payment_rtv REAL DEFAULT 0,
  last_payment_usd REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id, status)
);

-- ═══════════════════════════════════════════════════════════
-- TRIBUTES & TRANSACTIONS
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

CREATE TABLE IF NOT EXISTS public."TributeTransaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  recipient_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  film_id UUID REFERENCES public."CatalogVod"(id),
  stream_id UUID REFERENCES public."LiveStream"(id),
  amount_rtv REAL NOT NULL CHECK (amount_rtv > 0),
  amount_usd REAL NOT NULL DEFAULT 0,
  platform_fee_rtv REAL NOT NULL DEFAULT 0,
  agency_fee_rtv REAL NOT NULL DEFAULT 0,
  creator_share_rtv REAL NOT NULL DEFAULT 0,
  tribute_type TEXT NOT NULL DEFAULT 'content'
    CHECK (tribute_type IN ('content','creator','series','episode','bonus','super_tribute','stream')),
  tier_slug TEXT,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."TransferGift" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  recipient_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  amount_rtv REAL NOT NULL CHECK (amount_rtv > 0),
  message TEXT,
  gift_type TEXT DEFAULT 'tip' CHECK (gift_type IN ('tip','gift','subscription','reward')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- AI & FILM GENERATION
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."FilmGeneration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
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
  characters JSONB DEFAULT '[]',
  ai_model TEXT DEFAULT 'zai-org-glm-5-2',
  image_model TEXT DEFAULT 'z-image-turbo',
  tts_model TEXT DEFAULT 'tts-elevenlabs-turbo-v2-5',
  voice_cast JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'drafting'
    CHECK (status IN ('drafting','scripting','storyboarding','rendering','voicing','compositing','review','ready','failed','cancelled')),
  current_step TEXT,
  progress_pct REAL DEFAULT 0,
  script TEXT,
  storyboard JSONB DEFAULT '[]',
  scenes JSONB DEFAULT '[]',
  voice_tracks JSONB DEFAULT '{}',
  final_video_url TEXT,
  final_duration_sec INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  tts_seconds REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  catalog_vod_id UUID REFERENCES public."CatalogVod"(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AiCronConfig" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cron_expression TEXT NOT NULL,
  function_slug TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- AUDIT & MONITORING
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."OmegaAuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AgencyRoster" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public."RtvUser"(id),
  agency_name TEXT,
  role_in_agency TEXT,
  commission_pct REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CreatorPayout" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT REFERENCES public."RtvUser"(id),
  amount_rtv REAL NOT NULL,
  amount_usd REAL NOT NULL DEFAULT 0,
  payout_method TEXT DEFAULT 'ton' CHECK (payout_method IN ('ton','usdc','bank','rtv_token')),
  ton_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AcademyCredit" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public."RtvUser"(id),
  course_id TEXT,
  credits_earned INTEGER DEFAULT 0,
  certificate_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- DASHBOARD VIEWS
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public."vw_hours_dashboard" AS
SELECT
  u.id AS user_id,
  u.display_name,
  u.role,
  cp.stage_name,
  cp.total_tributes_rtv,
  cp.total_views,
  cp.follower_count,
  cp.is_live,
  COALESCE(SUM(tt.amount_rtv), 0) AS total_tributes_received,
  COUNT(tt.id) AS tribute_count,
  COALESCE(SUM(CASE WHEN tt.created_at >= now() - interval '24 hours' THEN tt.amount_rtv ELSE 0 END), 0) AS tributes_24h,
  COALESCE(SUM(CASE WHEN tt.created_at >= now() - interval '7 days' THEN tt.amount_rtv ELSE 0 END), 0) AS tributes_7d
FROM public."RtvUser" u
LEFT JOIN public."CreatorProfile" cp ON cp.user_id = u.id
LEFT JOIN public."TributeTransaction" tt ON tt.recipient_id = u.id AND tt.status = 'completed'
GROUP BY u.id, u.display_name, u.role, cp.stage_name, cp.total_tributes_rtv, cp.total_views, cp.follower_count, cp.is_live;

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_rtv_user_tg ON public."RtvUser"(telegram_id);
CREATE INDEX IF NOT EXISTS idx_rtv_user_role ON public."RtvUser"(role) WHERE role IN ('creator','admin');
CREATE INDEX IF NOT EXISTS idx_creator_user ON public."CreatorProfile"(user_id, status);
CREATE INDEX IF NOT EXISTS idx_live_stream_creator ON public."LiveStream"(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_live_stream_live ON public."LiveStream"(status) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_vod_creator ON public."VodLibrary"(creator_id, status);
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
CREATE INDEX IF NOT EXISTS idx_user_sub_user ON public."UserSubscription"(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tribute_tx_sender ON public."TributeTransaction"(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribute_tx_recipient ON public."TributeTransaction"(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tribute_tx_film ON public."TributeTransaction"(film_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_film_gen_status ON public."FilmGeneration"(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_film_gen_creator ON public."FilmGeneration"(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public."OmegaAuditLog"(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public."OmegaAuditLog"(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_creator ON public."CreatorPayout"(creator_id, status);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES (PascalCase table names — quoted)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public."RtvUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreatorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LiveStream" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VodLibrary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CatalogChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CatalogVod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FilmCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TributeTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TributeTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TransferGift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FilmGeneration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiCronConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OmegaAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AgencyRoster" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreatorPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AcademyCredit" ENABLE ROW LEVEL SECURITY;

-- RtvUser: self read, admin full
CREATE POLICY "rtv_user_self_read" ON public."RtvUser" FOR SELECT TO authenticated USING (id = auth.uid()::text);
CREATE POLICY "rtv_user_self_update" ON public."RtvUser" FOR UPDATE TO authenticated USING (id = auth.uid()::text);
CREATE POLICY "rtv_user_admin_all" ON public."RtvUser" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- CreatorProfile: public read, creator owns
CREATE POLICY "creator_public_read" ON public."CreatorProfile" FOR SELECT TO authenticated USING (true);
CREATE POLICY "creator_self_update" ON public."CreatorProfile" FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "creator_self_insert" ON public."CreatorProfile" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- LiveStream: public read live, creator owns
CREATE POLICY "stream_public_read" ON public."LiveStream" FOR SELECT TO authenticated USING (status IN ('scheduled','live','ended'));
CREATE POLICY "stream_creator_insert" ON public."LiveStream" FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "stream_creator_update" ON public."LiveStream" FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);

-- VodLibrary: public read ready, creator owns
CREATE POLICY "vod_public_read" ON public."VodLibrary" FOR SELECT TO authenticated USING (status = 'ready');
CREATE POLICY "vod_creator_insert" ON public."VodLibrary" FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "vod_creator_update" ON public."VodLibrary" FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);

-- CatalogChannel: public read
CREATE POLICY "catalog_channel_public_read" ON public."CatalogChannel" FOR SELECT TO authenticated USING (status = 'active');

-- CatalogVod: tier-gated read
CREATE POLICY "catalog_vod_free_read" ON public."CatalogVod" FOR SELECT TO authenticated USING (access_tier = 'free' AND status IN ('ready','premiere','live'));
CREATE POLICY "catalog_vod_subscriber_read" ON public."CatalogVod" FOR SELECT TO authenticated USING (status IN ('ready','premiere','live') AND (access_tier = 'free' OR EXISTS (SELECT 1 FROM public."UserSubscription" us JOIN public."SubscriptionPlan" sp ON sp.id = us.plan_id WHERE us.user_id = auth.uid()::text AND us.status = 'active' AND sp.tier >= public."CatalogVod".access_tier)));
CREATE POLICY "catalog_vod_creator_read" ON public."CatalogVod" FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_creator_insert" ON public."CatalogVod" FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_creator_update" ON public."CatalogVod" FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "catalog_vod_admin_read" ON public."CatalogVod" FOR SELECT TO authenticated USING (is_admin());

-- FilmCollection: public read
CREATE POLICY "film_collection_public_read" ON public."FilmCollection" FOR SELECT TO authenticated USING (true);

-- SubscriptionPlan: public read
CREATE POLICY "sub_plan_public_read" ON public."SubscriptionPlan" FOR SELECT TO authenticated USING (status = 'active');

-- UserSubscription: user owns
CREATE POLICY "user_sub_self_read" ON public."UserSubscription" FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "user_sub_self_insert" ON public."UserSubscription" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_sub_self_update" ON public."UserSubscription" FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- TributeTier: public read
CREATE POLICY "tribute_tier_public_read" ON public."TributeTier" FOR SELECT TO authenticated USING (status = 'active');

-- TributeTransaction: sender/recipient see own
CREATE POLICY "tribute_tx_sender_read" ON public."TributeTransaction" FOR SELECT TO authenticated USING (sender_id = auth.uid()::text);
CREATE POLICY "tribute_tx_recipient_read" ON public."TributeTransaction" FOR SELECT TO authenticated USING (recipient_id = auth.uid()::text);
CREATE POLICY "tribute_tx_sender_insert" ON public."TributeTransaction" FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()::text);

-- TransferGift: sender/recipient see own
CREATE POLICY "transfer_sender_read" ON public."TransferGift" FOR SELECT TO authenticated USING (sender_id = auth.uid()::text);
CREATE POLICY "transfer_recipient_read" ON public."TransferGift" FOR SELECT TO authenticated USING (recipient_id = auth.uid()::text);
CREATE POLICY "transfer_sender_insert" ON public."TransferGift" FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()::text);

-- FilmGeneration: creator owns
CREATE POLICY "film_gen_creator_read" ON public."FilmGeneration" FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_creator_insert" ON public."FilmGeneration" FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_creator_update" ON public."FilmGeneration" FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "film_gen_admin_read" ON public."FilmGeneration" FOR SELECT TO authenticated USING (is_admin());

-- AiCronConfig: admin only
CREATE POLICY "ai_cron_admin_all" ON public."AiCronConfig" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- OmegaAuditLog: admin read
CREATE POLICY "audit_admin_read" ON public."OmegaAuditLog" FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "audit_self_read" ON public."OmegaAuditLog" FOR SELECT TO authenticated USING (actor_id = auth.uid()::text);

-- AgencyRoster: admin
CREATE POLICY "agency_admin_all" ON public."AgencyRoster" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- CreatorPayout: creator read own
CREATE POLICY "payout_creator_read" ON public."CreatorPayout" FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "payout_admin_all" ON public."CreatorPayout" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- AcademyCredit: user read own
CREATE POLICY "academy_self_read" ON public."AcademyCredit" FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "academy_admin_all" ON public."AcademyCredit" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public."RtvUser" WHERE id = auth.uid()::text AND is_admin = true); $$;

CREATE OR REPLACE FUNCTION public.process_tribute(
  p_sender_id TEXT, p_recipient_id TEXT, p_film_id UUID,
  p_amount_rtv REAL, p_tribute_type TEXT DEFAULT 'content',
  p_message TEXT DEFAULT NULL, p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_platform_fee REAL; v_agency_fee REAL; v_creator_share REAL;
  v_split JSONB; v_tribute_id UUID; v_sender_balance REAL;
BEGIN
  SELECT revenue_split INTO v_split FROM public."CatalogVod" WHERE id = p_film_id;
  IF v_split IS NULL THEN v_split := '{"creator":0.80,"platform":0.15,"agency":0.05}'::jsonb; END IF;
  v_creator_share := p_amount_rtv * COALESCE((v_split->>'creator')::real, 0.80);
  v_platform_fee := p_amount_rtv * COALESCE((v_split->>'platform')::real, 0.15);
  v_agency_fee := p_amount_rtv * COALESCE((v_split->>'agency')::real, 0.05);
  SELECT COALESCE(rtv_balance, 0) INTO v_sender_balance FROM public."RtvUser" WHERE id = p_sender_id;
  IF v_sender_balance < p_amount_rtv THEN
    RETURN jsonb_build_object('status','insufficient_balance','balance',v_sender_balance,'required',p_amount_rtv);
  END IF;
  UPDATE public."RtvUser" SET rtv_balance = rtv_balance - p_amount_rtv WHERE id = p_sender_id;
  UPDATE public."RtvUser" SET rtv_balance = rtv_balance + v_creator_share WHERE id = p_recipient_id;
  INSERT INTO public."TributeTransaction" (sender_id, recipient_id, film_id, amount_rtv, amount_usd, platform_fee_rtv, agency_fee_rtv, creator_share_rtv, tribute_type, message, is_anonymous, status)
  VALUES (p_sender_id, p_recipient_id, p_film_id, p_amount_rtv, p_amount_rtv * 0.01, v_platform_fee, v_agency_fee, v_creator_share, p_tribute_type, p_message, p_is_anonymous, 'completed')
  RETURNING id INTO v_tribute_id;
  UPDATE public."CatalogVod" SET tribute_count = COALESCE(tribute_count,0) + 1, total_tributes_rtv = COALESCE(total_tributes_rtv,0) + p_amount_rtv WHERE id = p_film_id;
  RETURN jsonb_build_object('status','completed','tribute_id',v_tribute_id,'amount_rtv',p_amount_rtv,'creator_share',v_creator_share,'platform_fee',v_platform_fee,'agency_fee',v_agency_fee);
END; $$;

REVOKE EXECUTE ON FUNCTION public.process_tribute(TEXT, TEXT, UUID, REAL, TEXT, TEXT, BOOLEAN) FROM anon;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════

-- Channels
INSERT INTO public."CatalogChannel" (name, slug, description, category, tier, price_rtv_monthly, price_usd_monthly, sort_order) VALUES
('RotationTV Live', 'rtv-live', 'Live streaming from top creators', 'entertainment', 'free', 0, 0, 1),
('RTV Cinema', 'rtv-cinema', 'Cable-grade cinematic films and series', 'cinematic', 'basic', 50, 4.99, 2),
('RTV Shorts', 'rtv-shorts', 'Quick hits, clips, and highlights', 'shorts', 'free', 0, 0, 3),
('RTV Music', 'rtv-music', 'Live performances, DJ sets, music videos', 'music', 'free', 0, 0, 4),
('RTV Gaming', 'rtv-gaming', 'Gaming streams, tournaments, PK battles', 'gaming', 'free', 0, 0, 5),
('RTV Talk', 'rtv-talk', 'Talk shows, interviews, podcasts', 'talk', 'free', 0, 0, 6),
('RTV Lifestyle', 'rtv-lifestyle', 'Cooking, fitness, daily life streams', 'lifestyle', 'free', 0, 0, 7),
('RTV Comedy', 'rtv-comedy', 'Stand-up, improv, comedy sketches', 'comedy', 'free', 0, 0, 8),
('RTV Education', 'rtv-education', 'Tutorials, courses, skill building', 'education', 'basic', 25, 2.49, 9),
('RTV Premium', 'rtv-premium', 'Exclusive content, early access, no ads', 'entertainment', 'premium', 150, 14.99, 10),
('RTV VIP', 'rtv-vip', 'VIP access, AI clones, creator tools', 'entertainment', 'vip', 500, 49.99, 11),
('RTV Platinum', 'rtv-platinum', 'Everything unlocked, priority everything', 'entertainment', 'platinum', 1000, 99.99, 12)
ON CONFLICT (slug) DO NOTHING;

-- Subscription Plans
INSERT INTO public."SubscriptionPlan" (name, slug, description, tier, price_rtv_monthly, price_usd_monthly, price_rtv_yearly, price_usd_yearly, max_streams, max_resolution, concurrent_devices, offline_downloads, ad_free, exclusive_content, priority_support, ai_clone_access, creator_tools, trial_days, sort_order, is_popular) VALUES
('Free', 'free', 'Watch free channels and content', 'free', 0, 0, 0, 0, 1, '720p', 1, 0, false, false, false, false, false, 0, 1, true),
('Basic', 'basic', 'Unlock cinema, education, and ad-light viewing', 'basic', 50, 4.99, 490, 49.00, 2, '1080p', 2, 5, false, false, false, false, false, 7, 2, true),
('Premium', 'premium', 'Full library, no ads, exclusive premieres', 'premium', 150, 14.99, 1490, 149.00, 3, '4k', 3, 20, true, true, true, false, false, 14, 3, true),
('VIP', 'vip', 'AI clone access, creator tools, priority support', 'vip', 500, 49.99, 4990, 499.00, 5, '4k', 5, 50, true, true, true, true, true, 30, 4, false),
('Platinum', 'platinum', 'Everything unlocked, unlimited everything', 'platinum', 1000, 99.99, 9990, 999.00, 10, '4k', 10, 999, true, true, true, true, true, 30, 5, false)
ON CONFLICT (slug) DO NOTHING;

-- Tribute Tiers
INSERT INTO public."TributeTier" (name, slug, amount_rtv, amount_usd, emoji, display_color, sort_order) VALUES
('Rose', 'rose', 1, 0.01, '🌹', '#FF6B6B', 1),
('Diamond', 'diamond', 10, 0.10, '💎', '#00D4FF', 2),
('Crown', 'crown', 50, 0.50, '👑', '#FFD700', 3),
('Rocket', 'rocket', 100, 1.00, '🚀', '#FF4500', 4),
('Castle', 'castle', 500, 5.00, '🏰', '#9B59B6', 5),
('Planet', 'planet', 1000, 10.00, '🪐', '#2ECC71', 6),
('Galaxy', 'galaxy', 5000, 50.00, '🌌', '#E74C3C', 7),
('Universe', 'universe', 10000, 100.00, '🌌', '#F39C12', 8)
ON CONFLICT (slug) DO NOTHING;

-- AI Cron Jobs
INSERT INTO public."AiCronConfig" (name, slug, description, cron_expression, function_slug, is_active) VALUES
('Daily Token Report', 'daily-token-report', 'Generate daily token balance and usage report', '0 9 * * 1', 'daily-token-report', true),
('Film Pipeline Processor', 'film-pipeline', 'Process queued film generation jobs', '*/15 * * * *', 'film-generator', true),
('Trending Content Update', 'trending-update', 'Recalculate trending scores for catalog', '0 */2 * * *', 'trending-processor', true)
ON CONFLICT (slug) DO NOTHING;
