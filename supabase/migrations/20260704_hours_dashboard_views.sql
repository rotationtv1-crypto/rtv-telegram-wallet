-- ============================================================
-- RotationTV Network — Creator Hours Dashboard Views
-- Bigo Live-style: hours, tears (tips), monthly tracking
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- VIEW 1: Creator Monthly Summary (Bigo "Monthly Report")
-- Core dashboard card — hours, tears, earnings, rank
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.creator_monthly_summary AS
WITH monthly_streams AS (
  SELECT
    creator_id,
    DATE_TRUNC('month', started_at) AS period,
    COUNT(*) AS total_streams,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS total_hours,
    COALESCE(SUM(viewer_count), 0) AS peak_viewers_sum,
    COALESCE(MAX(viewer_count), 0) AS max_viewers,
    COALESCE(SUM(tip_count), 0) AS total_tips_count,
    COALESCE(SUM(total_tips_rtv), 0) AS total_tears_rtv,
    COALESCE(SUM(total_tips_usd), 0) AS total_tears_usd,
    COALESCE(SUM(unique_tippers), 0) AS unique_tippers
  FROM public.live_streams
  WHERE status IN ('live', 'ended')
    AND started_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY creator_id, DATE_TRUNC('month', started_at)
),
monthly_earnings AS (
  SELECT
    creator_id,
    COALESCE(SUM(gross_tips_rtv), 0) AS gross_tips_rtv,
    COALESCE(SUM(creator_share_rtv), 0) AS net_earnings_rtv,
    COALESCE(SUM(creator_share_usd), 0) AS net_earnings_usd,
    COALESCE(SUM(platform_fee_rtv), 0) AS platform_fee_rtv,
    COALESCE(SUM(agency_fee_rtv), 0) AS agency_fee_rtv,
    COALESCE(SUM(tip_count), 0) AS tip_count,
    COALESCE(SUM(unique_tippers), 0) AS unique_tippers
  FROM public.creator_earnings
  WHERE period_type = 'monthly'
    AND period_start >= DATE_TRUNC('month', CURRENT_DATE)::text
  GROUP BY creator_id
),
monthly_subs AS (
  SELECT
    creator_id,
    COUNT(*) AS active_subscribers,
    COALESCE(SUM(price_rtv), 0) AS subscription_revenue_rtv
  FROM public.creator_subscriptions
  WHERE status = 'active'
    AND expires_at >= CURRENT_DATE::text
  GROUP BY creator_id
),
ranked AS (
  SELECT
    ms.creator_id,
    ms.total_hours,
    ROW_NUMBER() OVER (ORDER BY ms.total_tears_rtv DESC) AS tear_rank,
    ROW_NUMBER() OVER (ORDER BY ms.total_hours DESC) AS hours_rank
  FROM monthly_streams ms
)
SELECT
  u.id AS user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.role,
  u.agency_id,
  u.loyalty_tier,
  u.reputation_tier,
  u.followers_count,

  -- Hours
  COALESCE(ms.total_streams, 0) AS monthly_streams,
  COALESCE(ms.total_hours, 0) AS monthly_hours,
  ROUND(COALESCE(ms.total_hours, 0)::numeric, 1) AS monthly_hours_display,
  COALESCE(ms.max_viewers, 0) AS peak_viewers,

  -- Tears (Bigo terminology for virtual gifts/tips)
  COALESCE(ms.total_tears_rtv, 0) AS monthly_tears_rtv,
  COALESCE(ms.total_tears_usd, 0) AS monthly_tears_usd,
  COALESCE(ms.total_tips_count, 0) AS monthly_tip_count,
  COALESCE(ms.unique_tippers, 0) AS monthly_unique_tippers,

  -- Earnings
  COALESCE(me.net_earnings_rtv, 0) AS net_earnings_rtv,
  COALESCE(me.net_earnings_usd, 0) AS net_earnings_usd,
  COALESCE(me.platform_fee_rtv, 0) AS platform_fee_rtv,
  COALESCE(me.agency_fee_rtv, 0) AS agency_fee_rtv,

  -- Subscribers
  COALESCE(subs.active_subscribers, 0) AS active_subscribers,
  COALESCE(subs.subscription_revenue_rtv, 0) AS subscription_revenue_rtv,

  -- Rankings
  COALESCE(r.tear_rank, 9999) AS tear_rank,
  COALESCE(r.hours_rank, 9999) AS hours_rank,

  -- Computed
  COALESCE(ms.total_tears_rtv, 0) + COALESCE(subs.subscription_revenue_rtv, 0) AS total_monthly_revenue_rtv,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS current_period

FROM public.rtv_users u
LEFT JOIN monthly_streams ms ON u.id = ms.creator_id
LEFT JOIN monthly_earnings me ON u.id = me.creator_id
LEFT JOIN monthly_subs subs ON u.id = subs.creator_id
LEFT JOIN ranked r ON u.id = r.creator_id
WHERE u.is_creator = true AND u.status = 'active';

-- ═══════════════════════════════════════════════════════════
-- VIEW 2: Creator Daily Hours (Bigo "Today's Stats")
-- Per-day breakdown for the weekly chart
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.creator_daily_hours AS
SELECT
  creator_id,
  DATE(started_at) AS stream_date,
  COUNT(*) AS streams_that_day,
  COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS hours_streamed,
  COALESCE(SUM(total_tips_rtv), 0) AS tears_rtv,
  COALESCE(SUM(viewer_count), 0) AS total_viewers,
  COALESCE(MAX(viewer_count), 0) AS peak_viewers
FROM public.live_streams
WHERE status IN ('live', 'ended')
  AND started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY creator_id, DATE(started_at)
ORDER BY creator_id, stream_date DESC;

-- ═══════════════════════════════════════════════════════════
-- VIEW 3: Creator Weekly Hours (Bigo "This Week")
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.creator_weekly_hours AS
SELECT
  creator_id,
  DATE_TRUNC('week', started_at) AS week_start,
  COUNT(*) AS total_streams,
  COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS total_hours,
  COALESCE(SUM(total_tips_rtv), 0) AS tears_rtv,
  COALESCE(SUM(total_tips_usd), 0) AS tears_usd,
  COALESCE(SUM(tip_count), 0) AS tip_count,
  COALESCE(MAX(viewer_count), 0) AS peak_viewers
FROM public.live_streams
WHERE status IN ('live', 'ended')
  AND started_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '4 weeks'
GROUP BY creator_id, DATE_TRUNC('week', started_at)
ORDER BY creator_id, week_start DESC;

-- ═══════════════════════════════════════════════════════════
-- VIEW 4: Global Leaderboard (Bigo "Ranking")
-- Top creators by tears and hours
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.global_creator_leaderboard AS
WITH monthly AS (
  SELECT
    creator_id,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS total_hours,
    COALESCE(SUM(total_tips_rtv), 0) AS total_tears_rtv,
    COALESCE(SUM(total_tips_usd), 0) AS total_tears_usd,
    COALESCE(SUM(tip_count), 0) AS tip_count,
    COALESCE(SUM(unique_tippers), 0) AS unique_tippers,
    COALESCE(MAX(viewer_count), 0) AS peak_viewers
  FROM public.live_streams
  WHERE status IN ('live', 'ended')
    AND started_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY creator_id
)
SELECT
  ROW_NUMBER() OVER (ORDER BY m.total_tears_rtv DESC) AS tear_rank,
  ROW_NUMBER() OVER (ORDER BY m.total_hours DESC) AS hours_rank,
  u.id AS creator_id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.loyalty_tier,
  u.reputation_tier,
  u.followers_count,
  m.total_hours,
  ROUND(m.total_hours::numeric, 1) AS hours_display,
  m.total_tears_rtv,
  m.total_tears_usd,
  m.tip_count,
  m.unique_tippers,
  m.peak_viewers,
  COALESCE(subs.active_subs, 0) AS active_subscribers
FROM monthly m
JOIN public.rtv_users u ON u.id = m.creator_id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS active_subs
  FROM public.creator_subscriptions cs
  WHERE cs.creator_id = u.id AND cs.status = 'active'
) subs ON true
WHERE u.is_creator = true AND u.status = 'active'
ORDER BY m.total_tears_rtv DESC;

-- ═══════════════════════════════════════════════════════════
-- VIEW 5: Agency Roster Dashboard (Bigo "Agency Center")
-- Agency owner sees all managed creators' stats
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.agency_roster_dashboard AS
SELECT
  ar.id AS agency_id,
  ar.agency_name,
  ar.owner_id,
  ar.tier AS agency_tier,
  ar.commission_rate_pct,
  ar.creator_count,
  u.id AS creator_id,
  u.username AS creator_username,
  u.display_name AS creator_display_name,
  u.avatar_url AS creator_avatar,
  u.loyalty_tier AS creator_tier,
  u.reputation_tier,
  u.followers_count,
  COALESCE(ms.monthly_hours, 0) AS creator_monthly_hours,
  COALESCE(ms.monthly_tears_rtv, 0) AS creator_tears_rtv,
  COALESCE(ms.net_earnings_rtv, 0) AS creator_net_rtv,
  COALESCE(ms.net_earnings_usd, 0) AS creator_net_usd,
  COALESCE(ms.active_subscribers, 0) AS creator_active_subs,
  ROUND(COALESCE(ms.monthly_hours, 0)::numeric, 1) AS hours_display
FROM public.agency_roster ar
CROSS JOIN LATERAL unnest(ar.creator_ids) AS cid
JOIN public.rtv_users u ON u.id = cid
LEFT JOIN public.creator_monthly_summary ms ON ms.user_id = cid
WHERE ar.status = 'approved';

-- ═══════════════════════════════════════════════════════════
-- VIEW 6: Hour Rate Calculator (Bigo "Earnings Estimate")
-- Given target hours, estimate earnings
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.creator_hour_rate AS
WITH last_30d AS (
  SELECT
    creator_id,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS total_hours,
    COALESCE(SUM(total_tips_rtv), 0) AS total_tears_rtv,
    COALESCE(SUM(total_tips_usd), 0) AS total_tears_usd
  FROM public.live_streams
  WHERE status IN ('live', 'ended')
    AND started_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY creator_id
)
SELECT
  creator_id,
  total_hours,
  total_tears_rtv,
  total_tears_usd,
  CASE WHEN total_hours > 0 THEN ROUND(total_tears_rtv / total_hours, 2) ELSE 0 END AS tears_per_hour_rtv,
  CASE WHEN total_hours > 0 THEN ROUND(total_tears_usd / total_hours, 4) ELSE 0 END AS tears_per_hour_usd,
  CASE WHEN total_hours > 0 THEN ROUND((total_tears_rtv * 0.80) / total_hours, 2) ELSE 0 END AS net_per_hour_rtv,
  CASE WHEN total_hours > 0 THEN ROUND((total_tears_usd * 0.80) / total_hours, 4) ELSE 0 END AS net_per_hour_usd
FROM last_30d;

-- ═══════════════════════════════════════════════════════════
-- SECURITY: Enable RLS on views with security_invoker
-- ═══════════════════════════════════════════════════════════

ALTER VIEW public.creator_monthly_summary SET (security_invoker = true);
ALTER VIEW public.creator_daily_hours SET (security_invoker = true);
ALTER VIEW public.creator_weekly_hours SET (security_invoker = true);
ALTER VIEW public.global_creator_leaderboard SET (security_invoker = true);
ALTER VIEW public.agency_roster_dashboard SET (security_invoker = true);
ALTER VIEW public.creator_hour_rate SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════
-- INDEXES for dashboard query performance
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_live_streams_creator_month 
  ON public.live_streams (creator_id, DATE_TRUNC('month', started_at))
  WHERE status IN ('live', 'ended');

CREATE INDEX IF NOT EXISTS idx_live_streams_creator_date 
  ON public.live_streams (creator_id, DATE(started_at))
  WHERE status IN ('live', 'ended');

CREATE INDEX IF NOT EXISTS idx_creator_earnings_monthly 
  ON public.creator_earnings (creator_id, period_type, period_start)
  WHERE period_type = 'monthly';

CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_active 
  ON public.creator_subscriptions (creator_id, status)
  WHERE status = 'active';
