-- ============================================================
-- RotationTV Network LLC — Definitive RLS + Data API Hardening
-- Resolves: "RLS Disabled in Public" lint on all 24 tables
-- Enables: Full role-based access (viewer/creator/agency/mod/admin)
-- Date: 2026-07-04
-- ============================================================
--
-- DESIGN DECISION: Dual approach
--   1. Stored agency_id on creator-owned tables (earnings, payouts, withdrawals)
--   2. Roster membership via agency_roster.creator_ids for cross-table queries
--   This gives both simple policy checks AND roster-scoped analytics
--
-- AUTH CONTEXT: Supabase JWT maps to rtv_users
--   auth.uid() → rtv_users.id (Supabase auth UUID)
--   auth.jwt()->>'sub' → telegram_id (Telegram user ID)
--   We use rtv_users.id as the primary key for all ownership checks

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Enable RLS on ALL 24 tables (kills every lint item)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.agency_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_forwarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloudflare_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heygen_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pk_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtv_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtv_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_pay_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_numbers ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Helper functions (SECURITY DEFINER, scoped access)
-- ═══════════════════════════════════════════════════════════

-- Resolve auth.uid() to the user's rtv_users.id
CREATE OR REPLACE FUNCTION public.current_rtv_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id::text FROM public.rtv_users
    WHERE id = auth.uid()::text
    LIMIT 1;
$$;

-- Resolve current user's role
CREATE OR REPLACE FUNCTION public.current_rtv_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(role, 'viewer') FROM public.rtv_users
    WHERE id = auth.uid()::text
    LIMIT 1;
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rtv_users
    WHERE id = auth.uid()::text AND role = 'admin'
  );
$$;

-- Check if current user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rtv_users
    WHERE id = auth.uid()::text AND role IN ('moderator', 'admin')
  );
$$;

-- Check if current user owns a specific agency roster
CREATE OR REPLACE FUNCTION public.is_agency_owner(roster_row_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_roster
    WHERE id = roster_row_id AND owner_id = auth.uid()::text
  );
$$;

-- Get all creator IDs managed by current user's agencies
CREATE OR REPLACE FUNCTION public.my_managed_creator_ids()
RETURNS SETOF TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT unnest(creator_ids) FROM public.agency_roster
    WHERE owner_id = auth.uid()::text AND status = 'approved';
$$;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Revoke EXECUTE on helpers from anon (security)
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.current_rtv_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_rtv_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_agency_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_managed_creator_ids() FROM anon;

-- ═══════════════════════════════════════════════════════════
-- STEP 4: RLS Policies — Role Matrix Implementation
-- ═══════════════════════════════════════════════════════════
--
-- ROLE          | READ                              | WRITE
-- ─────────────┼───────────────────────────────────┼──────────────────────────
-- viewer        | public content only               | none
-- creator       | own data + public content         | own streams, tips, subs
-- agency        | own roster + managed creators     | roster updates
-- moderator     | all streams + moderation data      | stream moderation actions
-- admin         | everything                        | audit logs, api keys
-- service_role  | bypasses RLS (used by Workers)    | bypasses RLS

-- ─────────────────────────────────────────────────────────
-- 4a. RTV_USERS
-- ─────────────────────────────────────────────────────────

-- Anyone authenticated can read basic user info (public profiles)
CREATE POLICY "rtv_users_public_read" ON public.rtv_users
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Users can read + update their own full profile
CREATE POLICY "rtv_users_self_read" ON public.rtv_users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "rtv_users_self_update" ON public.rtv_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Admins can read all users (including suspended/banned)
CREATE POLICY "rtv_users_admin_read" ON public.rtv_users
  FOR SELECT TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────────────────
-- 4b. AGENCY_ROSTER — The lint target table
-- ─────────────────────────────────────────────────────────

-- Agency owner reads their own roster
CREATE POLICY "agency_roster_owner_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

-- Agency owner updates their own roster
CREATE POLICY "agency_roster_owner_update" ON public.agency_roster
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

-- Creators can see which agency they belong to
CREATE POLICY "agency_roster_member_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text = ANY(creator_ids)
  );

-- Admins see all rosters
CREATE POLICY "agency_roster_admin_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────────────────
-- 4c. CREATOR_EARNINGS — Dual ownership (creator + agency)
-- ─────────────────────────────────────────────────────────

-- Creator sees own earnings
CREATE POLICY "creator_earnings_self_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

-- Agency sees earnings of managed creators (via stored agency_id)
CREATE POLICY "creator_earnings_agency_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (
    creator_id IN (SELECT my_managed_creator_ids())
  );

-- Admin sees all
CREATE POLICY "creator_earnings_admin_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────────────────
-- 4d. LIVE_STREAMS — Public read, creator write, moderator override
-- ─────────────────────────────────────────────────────────

-- Public can see active/completed streams
CREATE POLICY "live_streams_public_read" ON public.live_streams
  FOR SELECT TO authenticated
  USING (status IN ('live', 'ended', 'scheduled'));

-- Creator sees all their own streams (including failed/drafts)
CREATE POLICY "live_streams_creator_read" ON public.live_streams
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

-- Creator can insert new stream
CREATE POLICY "live_streams_creator_insert" ON public.live_streams
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- Creator can update own stream (title, status, etc.)
CREATE POLICY "live_streams_creator_update" ON public.live_streams
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()::text);

-- Moderator/admin can update any stream (moderation flags, force-end)
CREATE POLICY "live_streams_moderator_update" ON public.live_streams
  FOR UPDATE TO authenticated
  USING (is_moderator_or_admin());

-- ─────────────────────────────────────────────────────────
-- 4e. STREAM_TIPS — Sender sees own, creator sees received
-- ─────────────────────────────────────────────────────────

CREATE POLICY "stream_tips_sender_read" ON public.stream_tips
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid()::text);

CREATE POLICY "stream_tips_creator_read" ON public.stream_tips
  FOR SELECT TO authenticated
  USING (
    stream_id IN (SELECT id FROM public.live_streams WHERE creator_id = auth.uid()::text)
  );

CREATE POLICY "stream_tips_sender_insert" ON public.stream_tips
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()::text);

-- Agency sees tips for managed creators' streams
CREATE POLICY "stream_tips_agency_read" ON public.stream_tips
  FOR SELECT TO authenticated
  USING (
    stream_id IN (
      SELECT id FROM public.live_streams
      WHERE creator_id IN (SELECT my_managed_creator_ids())
    )
  );

-- ─────────────────────────────────────────────────────────
-- 4f. CREATOR_SUBSCRIPTIONS — Dual ownership
-- ─────────────────────────────────────────────────────────

CREATE POLICY "creator_subscriptions_subscriber_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated
  USING (subscriber_id = auth.uid()::text);

CREATE POLICY "creator_subscriptions_creator_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_subscriptions_insert" ON public.creator_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (subscriber_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4g. CREATOR_PAYOUTS — Creator + agency
-- ─────────────────────────────────────────────────────────

CREATE POLICY "creator_payouts_self_read" ON public.creator_payouts
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_payouts_agency_read" ON public.creator_payouts
  FOR SELECT TO authenticated
  USING (creator_id IN (SELECT my_managed_creator_ids()));

CREATE POLICY "creator_payouts_self_insert" ON public.creator_payouts
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4h. CREATOR_WITHDRAWALS — Creator only
-- ─────────────────────────────────────────────────────────

CREATE POLICY "creator_withdrawals_self_read" ON public.creator_withdrawals
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_withdrawals_self_insert" ON public.creator_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4i. PK_BATTLES — Dual participant + public
-- ─────────────────────────────────────────────────────────

CREATE POLICY "pk_battles_public_read" ON public.pk_battles
  FOR SELECT TO authenticated
  USING (status IN ('live', 'completed'));

CREATE POLICY "pk_battles_participant_read" ON public.pk_battles
  FOR SELECT TO authenticated
  USING (creator_a_id = auth.uid()::text OR creator_b_id = auth.uid()::text);

CREATE POLICY "pk_battles_creator_insert" ON public.pk_battles
  FOR INSERT TO authenticated
  WITH CHECK (creator_a_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4j. ACADEMY_CREDITS — User self-service
-- ─────────────────────────────────────────────────────────

CREATE POLICY "academy_credits_self_read" ON public.academy_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "academy_credits_self_insert" ON public.academy_credits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4k. PUBLIC CATALOG TABLES (gifts, tiers, leaderboards)
-- ─────────────────────────────────────────────────────────

CREATE POLICY "gift_items_public_read" ON public.gift_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "subscription_tiers_public_read" ON public.subscription_tiers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "leaderboards_public_read" ON public.leaderboards
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────
-- 4l. CREATOR-ONLY TABLES (milestones, heygen, revenue splits)
-- ─────────────────────────────────────────────────────────

CREATE POLICY "creator_milestones_self_read" ON public.creator_milestones
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "heygen_videos_self_read" ON public.heygen_videos
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "heygen_videos_self_insert" ON public.heygen_videos
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "revenue_splits_self_read" ON public.revenue_splits
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "revenue_splits_agency_read" ON public.revenue_splits
  FOR SELECT TO authenticated
  USING (creator_id IN (SELECT my_managed_creator_ids()));

-- ─────────────────────────────────────────────────────────
-- 4m. DUAL-PARTICIPANT TABLES (mentor, voip, call forwarding)
-- ─────────────────────────────────────────────────────────

CREATE POLICY "mentor_sessions_participant_read" ON public.mentor_sessions
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid()::text OR mentee_id = auth.uid()::text);

CREATE POLICY "voip_numbers_self_read" ON public.voip_numbers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "call_forwarding_self_read" ON public.call_forwarding
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "call_forwarding_self_update" ON public.call_forwarding
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "combo_multipliers_self_read" ON public.combo_multipliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4n. MERCHANT TABLE
-- ─────────────────────────────────────────────────────────

CREATE POLICY "rotation_pay_merchants_self_read" ON public.rotation_pay_merchants
  FOR SELECT TO authenticated
  USING (merchant_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────
-- 4o. ADMIN-ONLY TABLES (audit logs, api keys, cloudflare assets)
-- ─────────────────────────────────────────────────────────

CREATE POLICY "omega_audit_logs_admin_only" ON public.omega_audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "rtv_api_keys_admin_only" ON public.rtv_api_keys
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "cloudflare_assets_admin_only" ON public.cloudflare_assets
  FOR SELECT TO authenticated
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- STEP 5: Harden Data API settings
-- ═══════════════════════════════════════════════════════════
-- Run these in the Supabase Dashboard → Data API → Settings:
--
-- 1. Exposed schemas: public ONLY (not extensions)
-- 2. Max rows: 1000 (prevents mass data exfiltration)
-- 3. Auto-expose new tables: OFF (manual control)
-- 4. Extra search path: public (only)
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- STEP 6: Verification queries (run after deploy)
-- ═══════════════════════════════════════════════════════════

-- Verify RLS is enabled on ALL tables:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';

-- Verify no policies are missing for critical tables:
-- SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';

-- Test as authenticated user:
-- SET request.jwt.claims = '{"sub": "TEST_USER_ID", "role": "authenticated"}';
-- SELECT * FROM public.agency_roster; -- Should return only owned rosters
-- SELECT * FROM public.creator_earnings; -- Should return only own earnings
-- RESET request.jwt.claims;
