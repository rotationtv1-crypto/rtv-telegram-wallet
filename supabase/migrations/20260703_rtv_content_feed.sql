-- RotationTV Network — Persistent Content Feed (Tubi on Telegram)
-- Creates the content library table for VOD + AI-generated content

CREATE TABLE IF NOT EXISTS rtv_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  
  -- Creator info
  creator_id TEXT NOT NULL, -- telegram_id or 'AI-Venice-{channel}'
  creator_name TEXT,
  creator_type TEXT NOT NULL DEFAULT 'human' CHECK (creator_type IN ('human', 'ai', 'official')),
  
  -- Video details
  video_url TEXT NOT NULL,           -- Cloudflare R2 or Stream playback URL
  thumbnail_url TEXT,
  hls_url TEXT,                      -- HLS manifest for Roku/TV
  duration_sec INTEGER DEFAULT 0,
  resolution TEXT DEFAULT '720p',
  
  -- Source tracking
  source_type TEXT NOT NULL DEFAULT 'vod' CHECK (source_type IN ('vod', 'live_recording', 'ai_generated', 'official')),
  source_stream_id TEXT,             -- original live stream ID if recorded
  ai_model TEXT,                     -- Venice AI model used (if AI-generated)
  ai_prompt TEXT,                    -- prompt used for AI generation
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  tip_count INTEGER DEFAULT 0,
  tip_total_rtv DECIMAL DEFAULT 0,
  tip_total_usd DECIMAL DEFAULT 0,
  
  -- Monetization
  is_premium BOOLEAN DEFAULT FALSE,
  premium_price_stars INTEGER,       -- Telegram Stars price for premium content
  premium_price_rtv DECIMAL,         -- RTV token price
  is_ad_supported BOOLEAN DEFAULT TRUE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'expired', 'removed')),
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for feed queries
CREATE INDEX idx_content_category ON rtv_content(category) WHERE status = 'active';
CREATE INDEX idx_content_creator ON rtv_content(creator_id) WHERE status = 'active';
CREATE INDEX idx_content_featured ON rtv_content(is_featured) WHERE status = 'active' AND is_featured = true;
CREATE INDEX idx_content_trending ON rtv_content(view_count DESC, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_content_new ON rtv_content(created_at DESC) WHERE status = 'active';
CREATE INDEX idx_content_ai ON rtv_content(creator_type) WHERE status = 'active' AND creator_type = 'ai';
CREATE INDEX idx_content_premium ON rtv_content(is_premium) WHERE status = 'active' AND is_premium = true;
CREATE INDEX idx_content_source_type ON rtv_content(source_type) WHERE status = 'active';

-- AI channels table (for automated content generation)
CREATE TABLE IF NOT EXISTS rtv_ai_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Generation config
  venice_model TEXT DEFAULT 'seedance-2-0-text-to-video',
  duration_sec INTEGER DEFAULT 5,
  resolution TEXT DEFAULT '720p',
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Schedule
  generate_interval_hours INTEGER DEFAULT 8, -- how often to generate
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  
  -- Content prompt template
  prompt_template TEXT NOT NULL, -- e.g. "Breaking {category} news: {topic}. Cyberpunk style, neon colors."
  topic_source TEXT DEFAULT 'trending', -- trending, manual, ai_generated
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  total_videos_generated INTEGER DEFAULT 0,
  total_cost_usd DECIMAL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default AI channels
INSERT INTO rtv_ai_channels (channel_name, description, category, prompt_template, generate_interval_hours) VALUES
  ('RTV News', 'Crypto and Web3 news summaries', 'news', 'Breaking crypto news: {topic}. Futuristic cyberpunk style with neon-lime accents.', 8),
  ('RTV Market', 'Token price analysis and market updates', 'finance', 'Market analysis: {topic}. Data visualization with holographic charts.', 4),
  ('RTV Education', 'AI and Web3 tutorial clips', 'education', 'Tutorial: {topic}. Clean modern style with screen recording aesthetic.', 24),
  ('RTV Culture', 'Urban culture and creator economy highlights', 'culture', 'Culture spotlight: {topic}. Vibrant urban aesthetic with street art style.', 168),
  ('RTV Promo', 'Ecosystem company promotional content', 'promo', 'Promo for {topic}: RotationTV Network ecosystem. Cyberpunk corporate style with neon-lime branding.', 168)
ON CONFLICT (channel_name) DO NOTHING;

-- Feed views table (for analytics)
CREATE TABLE IF NOT EXISTS rtv_feed_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES rtv_content(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL, -- telegram_id
  viewed_at TIMESTAMPTZ DEFAULT now(),
  watch_duration_sec INTEGER DEFAULT 0,
  tipped BOOLEAN DEFAULT FALSE,
  shared BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_views_content ON rtv_feed_views(content_id);
CREATE INDEX idx_views_viewer ON rtv_feed_views(viewer_id);

-- Row Level Security
ALTER TABLE rtv_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtv_ai_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtv_feed_views ENABLE ROW LEVEL SECURITY;

-- Public can read active content
CREATE POLICY "public_read_content" ON rtv_content
  FOR SELECT USING (status = 'active');

-- Only service role can insert/update content
CREATE POLICY "service_insert_content" ON rtv_content
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_update_content" ON rtv_content
  FOR UPDATE USING (true);

-- Public can read active AI channels
CREATE POLICY "public_read_channels" ON rtv_ai_channels
  FOR SELECT USING (is_active = true);

-- Viewers can see their own views
CREATE POLICY "viewer_own_views" ON rtv_feed_views
  FOR SELECT USING (true);

CREATE POLICY "service_insert_views" ON rtv_feed_views
  FOR INSERT WITH CHECK (true);
