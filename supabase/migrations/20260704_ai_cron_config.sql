-- ============================================================
-- RotationTV Network — AI Content Processor Cron + Config
-- Triggers the Edge Function every 2 minutes
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- pg_cron: Process AI content queue every 2 minutes
-- ═══════════════════════════════════════════════════════════

SELECT cron.schedule(
  'process-ai-content-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xynkgaxfwvpcixissxdz.supabase.co/functions/v1/ai-content-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer rtv-ai-processor'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ═══════════════════════════════════════════════════════════
-- pg_cron: Auto-retry failed jobs every 15 minutes
-- ═══════════════════════════════════════════════════════════

SELECT cron.schedule(
  'retry-failed-ai-jobs',
  '*/15 * * * *',
  $$
  UPDATE public."AiContentQueue"
  SET status = 'queued', error_message = NULL
  WHERE status = 'failed'
    AND attempts < max_attempts
    AND queued_at > now() - interval '1 hour';
  $$
);

-- ═══════════════════════════════════════════════════════════
-- pg_cron: Clean up old completed jobs (daily at 3am)
-- ═══════════════════════════════════════════════════════════

SELECT cron.schedule(
  'cleanup-ai-queue',
  '0 3 * * *',
  $$
  DELETE FROM public."AiContentQueue"
  WHERE status = 'completed'
    AND completed_at < now() - interval '7 days';
  $$
);

-- ═══════════════════════════════════════════════════════════
-- pg_cron: Update feed algorithm weights (hourly)
-- ═══════════════════════════════════════════════════════════

SELECT cron.schedule(
  'update-feed-algorithm',
  '0 * * * *',
  $$
  -- Update preferred categories based on last 24h interactions
  UPDATE public."FeedAlgorithm" fa
  SET 
    preferred_categories = (
      SELECT array_agg(DISTINCT v.category)
      FROM public."FeedInteraction" fi
      JOIN public."VodLibrary" v ON v.id = fi.vod_id
      WHERE fi.user_id = fa.user_id
        AND fi.action IN ('view', 'watch_50', 'like', 'save')
        AND fi.created_at > now() - interval '24 hours'
    ),
    preferred_creators = (
      SELECT array_agg(DISTINCT v.creator_id)
      FROM public."FeedInteraction" fi
      JOIN public."VodLibrary" v ON v.id = fi.vod_id
      WHERE fi.user_id = fa.user_id
        AND fi.action IN ('view', 'watch_75', 'like', 'save', 'click_creator')
        AND fi.created_at > now() - interval '7 days'
    ),
    preferred_moods = (
      SELECT array_agg(DISTINCT v.ai_mood)
      FROM public."FeedInteraction" fi
      JOIN public."VodLibrary" v ON v.id = fi.vod_id
      WHERE fi.user_id = fa.user_id
        AND fi.action IN ('watch_75', 'watch_100', 'like', 'save')
        AND fi.created_at > now() - interval '7 days'
        AND v.ai_mood IS NOT NULL
    ),
    updated_at = now()
  WHERE fa.last_served_at IS NOT NULL;
  $$
);
