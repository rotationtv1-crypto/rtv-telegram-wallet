-- ============================================================
-- RotationTV Network — VOD Feed + AI Content Pipeline
-- "Tubi on Telegram" persistent content library
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- TABLE: vod_library — All video-on-demand content
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vod_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES public.rtv_users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'talk'
    CHECK (category IN ('gaming','music','talk','dance','lifestyle','cooking','pk_battle','multi_guest','event','irl','education','comedy','ai_generated','highlights','clip')),
  tags TEXT[] DEFAULT '{}',

  -- Cloudflare Stream references
  cloudflare_video_id TEXT,
  playback_url TEXT,          -- HLS/DASH from CF Stream
  thumbnail_url TEXT,
  duration_sec INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,

  -- Source tracking
  source_type TEXT NOT NULL DEFAULT 'live_recording'
    CHECK (source_type IN ('live_recording','upload','ai_generated','clip','highlight','short')),
  source_stream_id UUID REFERENCES public.live_streams(id),

  -- AI content pipeline
  ai_summary TEXT,                    -- Auto-generated summary
  ai_transcript TEXT,                 -- Full transcript (Whisper)
  ai_chapters JSONB DEFAULT '[]',    -- [{start_sec, title}]
  ai_mood TEXT CHECK (ai_mood IN ('energetic','chill','funny','educational','dramatic','romantic','hype')),
  ai_content_flags TEXT[] DEFAULT '{}',  -- Moderation flags
  ai_embedding VECTOR(1536),         -- pgvector for similarity search

  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  avg_watch_pct REAL DEFAULT 0,     -- Average % watched

  -- Monetization
  is_premium BOOLEAN DEFAULT false,
  price_rtv REAL DEFAULT 0,          -- 0 = free, >0 = paid VOD
  ad_breaks JSONB DEFAULT '[]',     -- [{start_sec, duration_sec, type}]

  -- Availability
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','ready','failed','archived','flagged','deleted')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,           -- For time-limited content
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: feed_algorithm — Personalized feed config
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feed_algorithm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.rtv_users(id),

  -- User preferences (learned + explicit)
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_creators TEXT[] DEFAULT '{}',
  preferred_moods TEXT[] DEFAULT '{}',
  language_pref TEXT DEFAULT 'en',

  -- Weights for feed ranking
  weight_following REAL DEFAULT 0.30,     -- Boost from subscribed creators
  weight_category REAL DEFAULT 0.25,     -- Category match
  weight_mood REAL DEFAULT 0.15,         -- Mood match
  weight_freshness REAL DEFAULT 0.15,    -- Newer = higher
  weight_engagement REAL DEFAULT 0.10,   -- Views/likes ratio
  weight_diversity REAL DEFAULT 0.05,    -- Explore new content

  -- Feed state
  last_served_at TIMESTAMPTZ,
  feed_version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: feed_interactions — Tracks what user does with feed
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feed_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.rtv_users(id),
  vod_id UUID NOT NULL REFERENCES public.vod_library(id),

  action TEXT NOT NULL CHECK (action IN ('impression','view','watch_25','watch_50','watch_75','watch_100','like','dislike','share','save','comment','skip','click_thumbnail','click_creator')),

  watch_duration_sec INTEGER DEFAULT 0,
  position_in_feed INTEGER,          -- Where in the feed this appeared

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: ai_content_queue — AI generation pipeline
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES public.rtv_users(id),

  -- What to generate
  job_type TEXT NOT NULL CHECK (job_type IN ('summarize','transcribe','chapters','mood_detect','clip_extract','highlight_reel','thumbnail_generate','short_form','translate','moderate')),
  source_vod_id UUID REFERENCES public.vod_library(id),
  source_stream_id UUID REFERENCES public.live_streams(id),

  -- Config
  config JSONB DEFAULT '{}',         -- Job-specific params

  -- Status
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  priority INTEGER DEFAULT 5,        -- 1 = highest, 10 = lowest
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Results
  result JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timing
  queued_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Cost tracking
  tokens_used INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: vod_comments — Comments on VOD content
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vod_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vod_id UUID NOT NULL REFERENCES public.vod_library(id),
  user_id TEXT NOT NULL REFERENCES public.rtv_users(id),
  parent_id UUID REFERENCES public.vod_comments(id),

  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive','neutral','negative','toxic')),

  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  status TEXT DEFAULT 'active' CHECK (status IN ('active','hidden','deleted','flagged')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: vod_playlists — Curated collections
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vod_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT REFERENCES public.rtv_users(id),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  vod_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vod_creator ON public.vod_library(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_vod_category ON public.vod_library(category, status);
CREATE INDEX IF NOT EXISTS idx_vod_published ON public.vod_library(published_at DESC) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_vod_featured ON public.vod_library(is_featured, featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_vod_source_stream ON public.vod_library(source_stream_id) WHERE source_stream_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vod_mood ON public.vod_library(ai_mood) WHERE ai_mood IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feed_interactions_user ON public.feed_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_vod ON public.feed_interactions(vod_id, action);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_action ON public.feed_interactions(user_id, action);

CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON public.ai_content_queue(status, priority) WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_ai_queue_creator ON public.ai_content_queue(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_vod_comments_vod ON public.vod_comments(vod_id, created_at DESC) WHERE status = 'active';

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.vod_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_algorithm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_playlists ENABLE ROW LEVEL SECURITY;

-- VOD: public read (ready content), creator write own
CREATE POLICY "vod_public_read" ON public.vod_library
  FOR SELECT TO authenticated USING (status = 'ready');
CREATE POLICY "vod_creator_read" ON public.vod_library
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "vod_creator_insert" ON public.vod_library
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "vod_creator_update" ON public.vod_library
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "vod_admin_read" ON public.vod_library
  FOR SELECT TO authenticated USING (is_admin());

-- Feed algorithm: user sees own
CREATE POLICY "feed_algo_self_read" ON public.feed_algorithm
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "feed_algo_self_update" ON public.feed_algorithm
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- Feed interactions: user writes own
CREATE POLICY "feed_interactions_self_insert" ON public.feed_interactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "feed_interactions_self_read" ON public.feed_interactions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- AI content queue: creator sees own, admin sees all
CREATE POLICY "ai_queue_creator_read" ON public.ai_content_queue
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "ai_queue_creator_insert" ON public.ai_content_queue
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "ai_queue_admin_read" ON public.ai_content_queue
  FOR SELECT TO authenticated USING (is_admin());

-- VOD comments: public read, user write own
CREATE POLICY "vod_comments_public_read" ON public.vod_comments
  FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "vod_comments_user_insert" ON public.vod_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- VOD playlists: public read, creator write own
CREATE POLICY "vod_playlists_public_read" ON public.vod_playlists
  FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "vod_playlists_creator_read" ON public.vod_playlists
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "vod_playlists_creator_insert" ON public.vod_playlists
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "vod_playlists_creator_update" ON public.vod_playlists
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: auto-create VOD from ended stream
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_create_vod_from_stream()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'live' THEN
    INSERT INTO public.vod_library (
      creator_id, title, description, category, tags,
      cloudflare_video_id, playback_url, thumbnail_url, recording_url,
      duration_sec, source_type, source_stream_id,
      view_count, tip_count, total_tips_rtv,
      status, published_at
    ) VALUES (
      NEW.creator_id, NEW.title, NEW.description, NEW.category, NEW.tags,
      NEW.cloudflare_stream_id, NEW.playback_url, NEW.thumbnail_url, NEW.recording_url,
      NEW.duration_sec, 'live_recording', NEW.id,
      NEW.viewer_count, NEW.tip_count, NEW.total_tips_rtv,
      'processing', now()
    );

    -- Queue AI jobs for the new VOD
    INSERT INTO public.ai_content_queue (creator_id, job_type, source_vod_id, source_stream_id, priority)
    SELECT NEW.creator_id, job, currval('vod_library_id_seq')::uuid, NEW.id, prio
    FROM (VALUES
      ('transcribe', 2),
      ('summarize', 3),
      ('chapters', 4),
      ('mood_detect', 5),
      ('thumbnail_generate', 6),
      ('moderate', 1)
    ) AS t(job, prio);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_vod
  AFTER UPDATE ON public.live_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_vod_from_stream();

-- ═══════════════════════════════════════════════════════════
-- FUNCTION: personalized feed query
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_mood TEXT DEFAULT NULL
)
RETURNS SETOF public.vod_library
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT v.*
  FROM public.vod_library v
  LEFT JOIN public.feed_algorithm fa ON fa.user_id = p_user_id
  WHERE v.status = 'ready'
    AND (p_category IS NULL OR v.category = p_category)
    AND (p_mood IS NULL OR v.ai_mood = p_mood)
    AND v.published_at <= now()
    AND (v.expires_at IS NULL OR v.expires_at > now())
  ORDER BY
    -- Following boost
    CASE WHEN v.creator_id = ANY(COALESCE(fa.preferred_creators, '{}')) THEN 0 ELSE 1 END,
    -- Category match
    CASE WHEN v.category = ANY(COALESCE(fa.preferred_categories, '{}')) THEN 0 ELSE 1 END,
    -- Mood match
    CASE WHEN v.ai_mood = ANY(COALESCE(fa.preferred_moods, '{}')) THEN 0 ELSE 1 END,
    -- Freshness
    v.published_at DESC,
    -- Engagement
    v.view_count DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

REVOKE EXECUTE ON FUNCTION public.get_personalized_feed(TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM anon;
