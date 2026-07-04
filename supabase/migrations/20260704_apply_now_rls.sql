-- ============================================================
-- PASTE THIS INTO SUPABASE SQL EDITOR NOW
-- Resolves: ALL "RLS Disabled in Public" lint items
-- Resolves: SECURITY DEFINER function exposure lint items
-- Resolves: Data API hardening
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- PART 1: Enable RLS on ALL tables (kills every lint item)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.agency_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academy_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.call_forwarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cloudflare_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.combo_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.heygen_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.omega_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pk_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rtv_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rtv_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rotation_pay_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voip_numbers ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- PART 2: Helper functions (SECURITY DEFINER)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_rtv_user_id()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id::text FROM public.rtv_users WHERE id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_rtv_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(role, 'viewer') FROM public.rtv_users WHERE id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role IN ('moderator', 'admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_agency_owner(roster_row_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.agency_roster WHERE id = roster_row_id AND owner_id = auth.uid()::text);
$$;

CREATE OR REPLACE FUNCTION public.my_managed_creator_ids()
RETURNS SETOF TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT unnest(creator_ids) FROM public.agency_roster WHERE owner_id = auth.uid()::text AND status = 'approved';
$$;

-- ═══════════════════════════════════════════════════════════
-- PART 3: Revoke anon EXECUTE on helpers (kills lint)
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.current_rtv_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_rtv_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_agency_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_managed_creator_ids() FROM anon;

-- ═══════════════════════════════════════════════════════════
-- PART 4: RLS Policies — Full Role Matrix
-- ═══════════════════════════════════════════════════════════

-- Drop existing policies first (clean slate)
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── RTV_USERS ──
CREATE POLICY "rtv_users_active_read" ON public.rtv_users
  FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "rtv_users_self_read" ON public.rtv_users
  FOR SELECT TO authenticated USING (id = auth.uid()::text);
CREATE POLICY "rtv_users_self_update" ON public.rtv_users
  FOR UPDATE TO authenticated USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY "rtv_users_admin_read" ON public.rtv_users
  FOR SELECT TO authenticated USING (is_admin());

-- ── AGENCY_ROSTER (the lint target) ──
CREATE POLICY "agency_roster_owner_read" ON public.agency_roster
  FOR SELECT TO authenticated USING (owner_id = auth.uid()::text);
CREATE POLICY "agency_roster_owner_update" ON public.agency_roster
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()::text) WITH CHECK (owner_id = auth.uid()::text);
CREATE POLICY "agency_roster_member_read" ON public.agency_roster
  FOR SELECT TO authenticated USING (auth.uid()::text = ANY(creator_ids));
CREATE POLICY "agency_roster_admin_read" ON public.agency_roster
  FOR SELECT TO authenticated USING (is_admin());

-- ── CREATOR_EARNINGS ──
CREATE POLICY "creator_earnings_self_read" ON public.creator_earnings
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_earnings_agency_read" ON public.creator_earnings
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));
CREATE POLICY "creator_earnings_admin_read" ON public.creator_earnings
  FOR SELECT TO authenticated USING (is_admin());

-- ── LIVE_STREAMS ──
CREATE POLICY "live_streams_public_read" ON public.live_streams
  FOR SELECT TO authenticated USING (status IN ('live', 'ended', 'scheduled'));
CREATE POLICY "live_streams_creator_read" ON public.live_streams
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_creator_insert" ON public.live_streams
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_creator_update" ON public.live_streams
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_moderator_update" ON public.live_streams
  FOR UPDATE TO authenticated USING (is_moderator_or_admin());

-- ── STREAM_TIPS ──
CREATE POLICY "stream_tips_sender_read" ON public.stream_tips
  FOR SELECT TO authenticated USING (sender_id = auth.uid()::text);
CREATE POLICY "stream_tips_creator_read" ON public.stream_tips
  FOR SELECT TO authenticated USING (stream_id IN (SELECT id FROM public.live_streams WHERE creator_id = auth.uid()::text));
CREATE POLICY "stream_tips_sender_insert" ON public.stream_tips
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()::text);
CREATE POLICY "stream_tips_agency_read" ON public.stream_tips
  FOR SELECT TO authenticated USING (stream_id IN (SELECT id FROM public.live_streams WHERE creator_id IN (SELECT my_managed_creator_ids())));

-- ── CREATOR_SUBSCRIPTIONS ──
CREATE POLICY "creator_subscriptions_subscriber_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated USING (subscriber_id = auth.uid()::text);
CREATE POLICY "creator_subscriptions_creator_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_subscriptions_insert" ON public.creator_subscriptions
  FOR INSERT TO authenticated WITH CHECK (subscriber_id = auth.uid()::text);

-- ── CREATOR_PAYOUTS ──
CREATE POLICY "creator_payouts_self_read" ON public.creator_payouts
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_payouts_agency_read" ON public.creator_payouts
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));
CREATE POLICY "creator_payouts_self_insert" ON public.creator_payouts
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);

-- ── CREATOR_WITHDRAWALS ──
CREATE POLICY "creator_withdrawals_self_read" ON public.creator_withdrawals
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_withdrawals_self_insert" ON public.creator_withdrawals
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);

-- ── PK_BATTLES ──
CREATE POLICY "pk_battles_public_read" ON public.pk_battles
  FOR SELECT TO authenticated USING (status IN ('live', 'completed'));
CREATE POLICY "pk_battles_participant_read" ON public.pk_battles
  FOR SELECT TO authenticated USING (creator_a_id = auth.uid()::text OR creator_b_id = auth.uid()::text);
CREATE POLICY "pk_battles_creator_insert" ON public.pk_battles
  FOR INSERT TO authenticated WITH CHECK (creator_a_id = auth.uid()::text);

-- ── ACADEMY_CREDITS ──
CREATE POLICY "academy_credits_self_read" ON public.academy_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "academy_credits_self_insert" ON public.academy_credits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- ── PUBLIC CATALOG ──
CREATE POLICY "gift_items_public_read" ON public.gift_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscription_tiers_public_read" ON public.subscription_tiers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "leaderboards_public_read" ON public.leaderboards
  FOR SELECT TO authenticated USING (true);

-- ── CREATOR-ONLY ──
CREATE POLICY "creator_milestones_self_read" ON public.creator_milestones
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "heygen_videos_self_read" ON public.heygen_videos
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "heygen_videos_self_insert" ON public.heygen_videos
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "revenue_splits_self_read" ON public.revenue_splits
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "revenue_splits_agency_read" ON public.revenue_splits
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));

-- ── DUAL-PARTICIPANT ──
CREATE POLICY "mentor_sessions_participant_read" ON public.mentor_sessions
  FOR SELECT TO authenticated USING (mentor_id = auth.uid()::text OR mentee_id = auth.uid()::text);
CREATE POLICY "voip_numbers_self_read" ON public.voip_numbers
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "call_forwarding_self_read" ON public.call_forwarding
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "call_forwarding_self_update" ON public.call_forwarding
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "combo_multipliers_self_read" ON public.combo_multipliers
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- ── MERCHANT ──
CREATE POLICY "rotation_pay_merchants_self_read" ON public.rotation_pay_merchants
  FOR SELECT TO authenticated USING (merchant_id = auth.uid()::text);

-- ── ADMIN-ONLY ──
CREATE POLICY "omega_audit_logs_admin_only" ON public.omega_audit_logs
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "rtv_api_keys_admin_only" ON public.rtv_api_keys
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "cloudflare_assets_admin_only" ON public.cloudflare_assets
  FOR SELECT TO authenticated USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- PART 5: Dashboard Views (security_invoker = true)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.creator_monthly_summary AS
WITH monthly_streams AS (
  SELECT creator_id,
    COUNT(*) AS total_streams,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 3600), 0) AS total_hours,
    COALESCE(MAX(viewer_count), 0) AS max_viewers,
    COALESCE(SUM(total_tips_rtv), 0) AS total_tears_rtv,
    COALESCE(SUM(total_tips_usd), 0) AS total_tears_usd,
    COALESCE(SUM(tip_count), 0) AS total_tips_count,
    COALESCE(SUM(unique_tippers), 0) AS unique_tippers
  FROM public.live_streams
  WHERE status IN ('live', 'ended') AND started_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY creator_id
),
monthly_earnings AS (
  SELECT creator_id,
    COALESCE(SUM(creator_share_rtv), 0) AS net_earnings_rtv,
    COALESCE(SUM(creator_share_usd), 0) AS net_earnings_usd,
    COALESCE(SUM(platform_fee_rtv), 0) AS platform_fee_rtv,
    COALESCE(SUM(agency_fee_rtv), 0) AS agency_fee_rtv
  FROM public.creator_earnings
  WHERE period_type = 'monthly' AND period_start >= DATE_TRUNC('month', CURRENT_DATE)::text
  GROUP BY creator_id
),
monthly_subs AS (
  SELECT creator_id, COUNT(*) AS active_subscribers,
    COALESCE(SUM(price_rtv), 0) AS subscription_revenue_rtv
  FROM public.creator_subscriptions WHERE status = 'active' AND expires_at >= CURRENT_DATE::text
  GROUP BY creator_id
),
ranked AS (
  SELECT creator_id, total_hours,
    ROW_NUMBER() OVER (ORDER BY total_tears_rtv DESC) AS tear_rank,
    ROW_NUMBER() OVER (ORDER BY total_hours DESC) AS hours_rank
  FROM monthly_streams
)
SELECT u.id AS user_id, u.username, u.display_name, u.avatar_url, u.role, u.agency_id,
  u.loyalty_tier, u.reputation_tier, u.followers_count,
  COALESCE(ms.total_streams, 0) AS monthly_streams,
  COALESCE(ms.total_hours, 0) AS monthly_hours,
  ROUND(COALESCE(ms.total_hours, 0)::numeric, 1) AS monthly_hours_display,
  COALESCE(ms.max_viewers, 0) AS peak_viewers,
  COALESCE(ms.total_tears_rtv, 0) AS monthly_tears_rtv,
  COALESCE(ms.total_tears_usd, 0) AS monthly_tears_usd,
  COALESCE(ms.total_tips_count, 0) AS monthly_tip_count,
  COALESCE(ms.unique_tippers, 0) AS monthly_unique_tippers,
  COALESCE(me.net_earnings_rtv, 0) AS net_earnings_rtv,
  COALESCE(me.net_earnings_usd, 0) AS net_earnings_usd,
  COALESCE(me.platform_fee_rtv, 0) AS platform_fee_rtv,
  COALESCE(me.agency_fee_rtv, 0) AS agency_fee_rtv,
  COALESCE(subs.active_subscribers, 0) AS active_subscribers,
  COALESCE(subs.subscription_revenue_rtv, 0) AS subscription_revenue_rtv,
  COALESCE(r.tear_rank, 9999) AS tear_rank,
  COALESCE(r.hours_rank, 9999) AS hours_rank,
  COALESCE(ms.total_tears_rtv, 0) + COALESCE(subs.subscription_revenue_rtv, 0) AS total_monthly_revenue_rtv,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS current_period
FROM public.rtv_users u
LEFT JOIN monthly_streams ms ON u.id = ms.creator_id
LEFT JOIN monthly_earnings me ON u.id = me.creator_id
LEFT JOIN monthly_subs subs ON u.id = subs.creator_id
LEFT JOIN ranked r ON u.id = r.creator_id
WHERE u.is_creator = true AND u.status = 'active';

ALTER VIEW public.creator_monthly_summary SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════
-- PART 6: Verification (run after paste)
-- ═══════════════════════════════════════════════════════════
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
--   ORDER BY relname;
-- Expected: ALL rows show relrowsecurity = true
