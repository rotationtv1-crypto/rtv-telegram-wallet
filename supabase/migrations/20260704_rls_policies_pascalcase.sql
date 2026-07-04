-- ============================================================
-- RotationTV Network — CORRECTED RLS Policies (PascalCase)
-- Matches actual Supabase table names
-- Date: 2026-07-04
-- ============================================================
-- 
-- CRITICAL: Your database uses PascalCase table names:
--   "AgencyRoster", "AcademyCredit", "CreatorPayout", etc.
--   NOT snake_case (agency_roster, academy_credits, etc.)
--
-- This file uses the CORRECT names from your actual schema.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Helper Functions (SECURITY DEFINER)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_rtv_user_id()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id::text FROM public."RtvUser" WHERE id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_rtv_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(role, 'viewer') FROM public."RtvUser" WHERE id = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public."RtvUser" WHERE id = auth.uid()::text AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public."RtvUser" WHERE id = auth.uid()::text AND role IN ('moderator', 'admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_agency_owner(roster_row_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public."AgencyRoster" WHERE id = roster_row_id AND owner_id = auth.uid()::text);
$$;

CREATE OR REPLACE FUNCTION public.my_managed_creator_ids()
RETURNS SETOF TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT unnest(creator_ids) FROM public."AgencyRoster" WHERE owner_id = auth.uid()::text AND status = 'approved';
$$;

-- Revoke anon EXECUTE
REVOKE EXECUTE ON FUNCTION public.current_rtv_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_rtv_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_agency_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_managed_creator_ids() FROM anon;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Drop ALL existing policies (clean slate)
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- STEP 3: RLS Policies — All Tables (PascalCase)
-- ═══════════════════════════════════════════════════════════

-- ── RtvUser ──
CREATE POLICY "rtv_users_active_read" ON public."RtvUser"
  FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "rtv_users_self_read" ON public."RtvUser"
  FOR SELECT TO authenticated USING (id = auth.uid()::text);
CREATE POLICY "rtv_users_self_update" ON public."RtvUser"
  FOR UPDATE TO authenticated USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY "rtv_users_admin_read" ON public."RtvUser"
  FOR SELECT TO authenticated USING (is_admin());

-- ── AgencyRoster (THE LINT TARGET) ──
CREATE POLICY "agency_roster_owner_read" ON public."AgencyRoster"
  FOR SELECT TO authenticated USING (owner_id = auth.uid()::text);
CREATE POLICY "agency_roster_owner_update" ON public."AgencyRoster"
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()::text) WITH CHECK (owner_id = auth.uid()::text);
CREATE POLICY "agency_roster_member_read" ON public."AgencyRoster"
  FOR SELECT TO authenticated USING (auth.uid()::text = ANY(creator_ids));
CREATE POLICY "agency_roster_admin_read" ON public."AgencyRoster"
  FOR SELECT TO authenticated USING (is_admin());

-- ── CreatorEarning ──
CREATE POLICY "creator_earnings_self_read" ON public."CreatorEarning"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_earnings_agency_read" ON public."CreatorEarning"
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));
CREATE POLICY "creator_earnings_admin_read" ON public."CreatorEarning"
  FOR SELECT TO authenticated USING (is_admin());

-- ── LiveStream ──
CREATE POLICY "live_streams_public_read" ON public."LiveStream"
  FOR SELECT TO authenticated USING (status IN ('live', 'ended', 'scheduled'));
CREATE POLICY "live_streams_creator_read" ON public."LiveStream"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_creator_insert" ON public."LiveStream"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_creator_update" ON public."LiveStream"
  FOR UPDATE TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "live_streams_moderator_update" ON public."LiveStream"
  FOR UPDATE TO authenticated USING (is_moderator_or_admin());

-- ── StreamTip ──
CREATE POLICY "stream_tips_sender_read" ON public."StreamTip"
  FOR SELECT TO authenticated USING (sender_id = auth.uid()::text);
CREATE POLICY "stream_tips_creator_read" ON public."StreamTip"
  FOR SELECT TO authenticated USING (stream_id IN (SELECT id FROM public."LiveStream" WHERE creator_id = auth.uid()::text));
CREATE POLICY "stream_tips_sender_insert" ON public."StreamTip"
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid()::text);
CREATE POLICY "stream_tips_agency_read" ON public."StreamTip"
  FOR SELECT TO authenticated USING (stream_id IN (SELECT id FROM public."LiveStream" WHERE creator_id IN (SELECT my_managed_creator_ids())));

-- ── CreatorSubscription ──
CREATE POLICY "creator_subscriptions_subscriber_read" ON public."CreatorSubscription"
  FOR SELECT TO authenticated USING (subscriber_id = auth.uid()::text);
CREATE POLICY "creator_subscriptions_creator_read" ON public."CreatorSubscription"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_subscriptions_insert" ON public."CreatorSubscription"
  FOR INSERT TO authenticated WITH CHECK (subscriber_id = auth.uid()::text);

-- ── CreatorPayout ──
CREATE POLICY "creator_payouts_self_read" ON public."CreatorPayout"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_payouts_agency_read" ON public."CreatorPayout"
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));
CREATE POLICY "creator_payouts_self_insert" ON public."CreatorPayout"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);

-- ── CreatorWithdrawal ──
CREATE POLICY "creator_withdrawals_self_read" ON public."CreatorWithdrawal"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "creator_withdrawals_self_insert" ON public."CreatorWithdrawal"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);

-- ── PkBattle ──
CREATE POLICY "pk_battles_public_read" ON public."PkBattle"
  FOR SELECT TO authenticated USING (status IN ('live', 'completed'));
CREATE POLICY "pk_battles_participant_read" ON public."PkBattle"
  FOR SELECT TO authenticated USING (creator_a_id = auth.uid()::text OR creator_b_id = auth.uid()::text);
CREATE POLICY "pk_battles_creator_insert" ON public."PkBattle"
  FOR INSERT TO authenticated WITH CHECK (creator_a_id = auth.uid()::text);

-- ── AcademyCredit ──
CREATE POLICY "academy_credits_self_read" ON public."AcademyCredit"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "academy_credits_self_insert" ON public."AcademyCredit"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- ── GiftItem (public catalog) ──
CREATE POLICY "gift_items_public_read" ON public."GiftItem"
  FOR SELECT TO authenticated USING (true);

-- ── SubscriptionTier (public catalog) ──
CREATE POLICY "subscription_tiers_public_read" ON public."SubscriptionTier"
  FOR SELECT TO authenticated USING (true);

-- ── Leaderboard (public) ──
CREATE POLICY "leaderboards_public_read" ON public."Leaderboard"
  FOR SELECT TO authenticated USING (true);

-- ── CreatorMilestone ──
CREATE POLICY "creator_milestones_self_read" ON public."CreatorMilestone"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);

-- ── HeygenVideo ──
CREATE POLICY "heygen_videos_self_read" ON public."HeygenVideo"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "heygen_videos_self_insert" ON public."HeygenVideo"
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid()::text);

-- ── RevenueSplit ──
CREATE POLICY "revenue_splits_self_read" ON public."RevenueSplit"
  FOR SELECT TO authenticated USING (creator_id = auth.uid()::text);
CREATE POLICY "revenue_splits_agency_read" ON public."RevenueSplit"
  FOR SELECT TO authenticated USING (creator_id IN (SELECT my_managed_creator_ids()));

-- ── MentorSession ──
CREATE POLICY "mentor_sessions_participant_read" ON public."MentorSession"
  FOR SELECT TO authenticated USING (mentor_id = auth.uid()::text OR mentee_id = auth.uid()::text);

-- ── VoipNumber ──
CREATE POLICY "voip_numbers_self_read" ON public."VoipNumber"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- ── CallForwarding ──
CREATE POLICY "call_forwarding_self_read" ON public."CallForwarding"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "call_forwarding_self_update" ON public."CallForwarding"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- ── ComboMultiplier ──
CREATE POLICY "combo_multipliers_self_read" ON public."ComboMultiplier"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- ── RotationPayMerchant ──
CREATE POLICY "rotation_pay_merchants_self_read" ON public."RotationPayMerchant"
  FOR SELECT TO authenticated USING (merchant_id = auth.uid()::text);

-- ── OmegaAuditLog (admin only) ──
CREATE POLICY "omega_audit_logs_admin_only" ON public."OmegaAuditLog"
  FOR SELECT TO authenticated USING (is_admin());

-- ── RtvApiKey (admin only) ──
CREATE POLICY "rtv_api_keys_admin_only" ON public."RtvApiKey"
  FOR SELECT TO authenticated USING (is_admin());

-- ── CloudflareAsset (admin only) ──
CREATE POLICY "cloudflare_assets_admin_only" ON public."CloudflareAsset"
  FOR SELECT TO authenticated USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- STEP 4: Verification
-- ═══════════════════════════════════════════════════════════
-- Run after paste:
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
--   ORDER BY relname;
-- Expected: ALL true
--
-- SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- Expected: 35+ policies across all tables
