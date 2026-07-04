-- ============================================================
-- RotationTV Network LLC — Real Viewer Presence + Atomic Tip Stats
-- Backs rtv-stream Worker's /api/stream/play/:id and /api/tip/send,
-- which previously returned viewer_count/tips as hardcoded fakes.
-- Date: 2026-07-04
-- ============================================================

-- Presence table: one row per (stream, viewer), refreshed on each
-- heartbeat (poll of GET /api/stream/play/:id?viewer_id=...).
-- "Currently watching" = last_seen_at within the last 30 seconds.
CREATE TABLE IF NOT EXISTS public.stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id TEXT NOT NULL,   -- cloudflare_stream_id, matches live_streams.cloudflare_stream_id
  viewer_id TEXT NOT NULL,   -- telegram_id of the viewer
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (stream_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_stream_viewers_presence
  ON public.stream_viewers(stream_id, last_seen_at);

ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;

-- The rtv-stream Worker writes with the service role key, which bypasses
-- RLS entirely. This policy only covers direct client reads via PostgREST.
CREATE POLICY "stream_viewers_public_read" ON public.stream_viewers
  FOR SELECT USING (true);

-- Atomic counter update for stream_tips: a single UPDATE statement avoids
-- the lost-update race that a JS-side "read current value, add, write back"
-- would have under concurrent tips on a popular stream.
CREATE OR REPLACE FUNCTION public.increment_stream_tip_stats(
  p_cloudflare_stream_id TEXT,
  p_amount_rtv NUMERIC,
  p_tipper_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.live_streams
  SET
    total_tips_rtv = COALESCE(total_tips_rtv, 0) + p_amount_rtv,
    tip_count = COALESCE(tip_count, 0) + 1,
    top_tipper_id = CASE
      WHEN p_amount_rtv > COALESCE(top_tip_amount, 0) THEN p_tipper_id
      ELSE top_tipper_id
    END,
    top_tip_amount = GREATEST(COALESCE(top_tip_amount, 0), p_amount_rtv),
    updated_at = now()
  WHERE cloudflare_stream_id = p_cloudflare_stream_id;
END;
$$;
