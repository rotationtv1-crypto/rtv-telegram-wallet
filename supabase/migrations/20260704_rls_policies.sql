-- ============================================================
-- RotationTV Network LLC — Complete RLS Policy Suite
-- Generated from entity schema analysis (24 tables)
-- Date: 2026-07-04
-- ============================================================
-- 
-- OWNERSHIP COLUMNS (extracted from entity JSONs):
--   AgencyRoster.owner_id          → RTVUser ID of agency owner
--   AgencyRoster.creator_ids      → Array of RTVUser IDs managed by agency
--   AcademyCredit.user_id         → Owner of the credit
--   RTVUser.telegram_id           → Primary identifier (mapped from auth.jwt)
--   RTVUser.role                  → [viewer, creator, moderator, admin, agency]
--   RTVUser.agency_id             → Agency/manager ID if signed with one
--   CreatorEarning.creator_id     → RTVUser ID of the creator
--   CreatorEarning.agency_id      → AgencyRoster ID if creator belongs to agency
--   LiveStream.creator_id         → RTVUser ID of the streamer
--   CreatorSubscription.creator_id → Creator being subscribed to
--   CreatorSubscription.subscriber_id → User who subscribed
--   StreamTip.sender_id           → Tip sender
--   StreamTip.stream_id           → Stream receiving tip
--   PKBattle.creator_a_id         → First PK contestant
--   PKBattle.creator_b_id         → Second PK contestant
--   CreatorPayout.creator_id      → Creator requesting payout
--   CreatorWithdrawal.creator_id  → Creator requesting withdrawal
--   CreatorMilestone.creator_id   → Creator achieving milestone
--   HeyGenVideo.creator_id        → Creator who generated video
--   MentorSession.mentor_id       → Mentor user ID
--   MentorSession.mentee_id       → Mentee user ID
--   VoIPNumber.user_id            → User assigned the number
--   CallForwarding.user_id        → User with forwarding rules
--   ComboMultiplier.user_id       → User with active combo
--   Leaderboard.user_id           → User in leaderboard
--   CloudflareAsset.domain        → Domain for asset
--   RTVAPIKey.service             → Service the key is for
--   OmegaAuditLog.agent_type      → Type of agent that logged
--   RevenueSplit.creator_id       → Creator in revenue split
--   RotationPayMerchant.merchant_id → Merchant ID
--   SubscriptionTier.tier_name    → Tier identifier
--   GiftItem.category             → Gift category

-- ═══════════════════════════════════════════════════════════
-- HELPER: Get current user's telegram_id from JWT
-- ═══════════════════════════════════════════════════════════
-- Supabase Auth JWT contains:
--   auth.jwt()->>'telegram_id'  → mapped from custom claim
--   auth.uid()                  → Supabase auth user UUID
-- We use a lookup function to resolve telegram_id from auth.uid()

CREATE OR REPLACE FUNCTION public.current_user_telegram_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT telegram_id FROM public.rtv_users
    WHERE id = auth.uid()::text
    LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════
-- HELPER: Get current user's role
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.rtv_users
    WHERE id = auth.uid()::text
    LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════
-- HELPER: Check if current user is agency owner for a roster
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_agency_owner(roster_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_roster
    WHERE id = roster_id
      AND owner_id = auth.uid()::text
  );
$$;

-- ═══════════════════════════════════════════════════════════
-- 1. RTV USERS — Own data only (viewers/creators)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "users_read_own" ON public.rtv_users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR telegram_id = auth.jwt()->>'sub');

CREATE POLICY "users_update_own" ON public.rtv_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Admins can read all users
CREATE POLICY "users_admin_read" ON public.rtv_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- 2. AGENCY ROSTER — Agency owners see their roster only
-- ═══════════════════════════════════════════════════════════

-- Agency owner can SELECT their own roster
CREATE POLICY "agency_roster_owner_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

-- Agency owner can UPDATE their own roster
CREATE POLICY "agency_roster_owner_update" ON public.agency_roster
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

-- Creators can see which agency they belong to (via agency_id on RTVUser)
CREATE POLICY "agency_roster_creator_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rtv_users u
      WHERE u.id = auth.uid()::text
        AND u.agency_id = agency_roster.id::text
    )
  );

-- Admins can see all rosters
CREATE POLICY "agency_roster_admin_read" ON public.agency_roster
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- 3. CREATOR EARNINGS — Creator sees own, agency sees their roster
-- ═══════════════════════════════════════════════════════════

-- Creator sees their own earnings
CREATE POLICY "creator_earnings_self_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

-- Agency owner sees earnings for creators in their roster
CREATE POLICY "creator_earnings_agency_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (
    agency_id IN (
      SELECT id::text FROM public.agency_roster
      WHERE owner_id = auth.uid()::text
    )
  );

-- Admin sees all
CREATE POLICY "creator_earnings_admin_read" ON public.creator_earnings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- 4. LIVE STREAMS — Public read, creator write own
-- ═══════════════════════════════════════════════════════════

-- Anyone can see live streams (public content)
CREATE POLICY "live_streams_public_read" ON public.live_streams
  FOR SELECT TO authenticated
  USING (true);

-- Creator can insert their own stream
CREATE POLICY "live_streams_creator_insert" ON public.live_streams
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- Creator can update their own stream (status, title, etc.)
CREATE POLICY "live_streams_creator_update" ON public.live_streams
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()::text);

-- Moderators can update any stream (moderation flags, force-end)
CREATE POLICY "live_streams_moderator_update" ON public.live_streams
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role IN ('moderator', 'admin'))
  );

-- ═══════════════════════════════════════════════════════════
-- 5. STREAM TIPS — Sender sees own, creator sees received
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "stream_tips_sender_read" ON public.stream_tips
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid()::text);

CREATE POLICY "stream_tips_creator_read" ON public.stream_tips
  FOR SELECT TO authenticated
  USING (
    stream_id IN (
      SELECT id FROM public.live_streams WHERE creator_id = auth.uid()::text
    )
  );

CREATE POLICY "stream_tips_insert" ON public.stream_tips
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 6. CREATOR SUBSCRIPTIONS — Subscriber sees own, creator sees received
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "creator_subscriptions_subscriber_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated
  USING (subscriber_id = auth.uid()::text);

CREATE POLICY "creator_subscriptions_creator_read" ON public.creator_subscriptions
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_subscriptions_insert" ON public.creator_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (subscriber_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 7. CREATOR PAYOUTS — Creator sees own, agency sees roster
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "creator_payouts_self_read" ON public.creator_payouts
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_payouts_agency_read" ON public.creator_payouts
  FOR SELECT TO authenticated
  USING (
    creator_id IN (
      SELECT unnest(creator_ids) FROM public.agency_roster
      WHERE owner_id = auth.uid()::text
    )
  );

CREATE POLICY "creator_payouts_insert" ON public.creator_payouts
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 8. CREATOR WITHDRAWALS — Creator sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "creator_withdrawals_self_read" ON public.creator_withdrawals
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "creator_withdrawals_insert" ON public.creator_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 9. PK BATTLES — Participants see own, public see live
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "pk_battles_public_read" ON public.pk_battles
  FOR SELECT TO authenticated
  USING (status = 'live' OR status = 'completed');

CREATE POLICY "pk_battles_participant_read" ON public.pk_battles
  FOR SELECT TO authenticated
  USING (creator_a_id = auth.uid()::text OR creator_b_id = auth.uid()::text);

CREATE POLICY "pk_battles_creator_insert" ON public.pk_battles
  FOR INSERT TO authenticated
  WITH CHECK (creator_a_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 10. ACADEMY CREDITS — User sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "academy_credits_self_read" ON public.academy_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "academy_credits_self_insert" ON public.academy_credits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 11. GIFT ITEMS — Public read (catalog)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "gift_items_public_read" ON public.gift_items
  FOR SELECT TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- 12. SUBSCRIPTION TIERS — Public read (catalog)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "subscription_tiers_public_read" ON public.subscription_tiers
  FOR SELECT TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- 13. LEADERBOARDS — Public read
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "leaderboards_public_read" ON public.leaderboards
  FOR SELECT TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- 14. HEYGEN VIDEOS — Creator sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "heygen_videos_self_read" ON public.heygen_videos
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "heygen_videos_self_insert" ON public.heygen_videos
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 15. MENTOR SESSIONS — Mentor and mentee both see session
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "mentor_sessions_participant_read" ON public.mentor_sessions
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid()::text OR mentee_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 16. VOIP NUMBERS — User sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "voip_numbers_self_read" ON public.voip_numbers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 17. CALL FORWARDING — User sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "call_forwarding_self_read" ON public.call_forwarding
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "call_forwarding_self_update" ON public.call_forwarding
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 18. COMBO MULTIPLIERS — User sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "combo_multipliers_self_read" ON public.combo_multipliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 19. CREATOR MILESTONES — Creator sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "creator_milestones_self_read" ON public.creator_milestones
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 20. REVENUE SPLITS — Creator sees own, agency sees roster
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "revenue_splits_self_read" ON public.revenue_splits
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid()::text);

CREATE POLICY "revenue_splits_agency_read" ON public.revenue_splits
  FOR SELECT TO authenticated
  USING (
    creator_id IN (
      SELECT unnest(creator_ids) FROM public.agency_roster
      WHERE owner_id = auth.uid()::text
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 21. ROTATIONPAY MERCHANTS — Merchant sees own
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "rotation_pay_merchants_self_read" ON public.rotation_pay_merchants
  FOR SELECT TO authenticated
  USING (merchant_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- 22. OMEGA AUDIT LOGS — Admin only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "omega_audit_logs_admin_read" ON public.omega_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- 23. RTV API KEYS — Admin only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "rtv_api_keys_admin_read" ON public.rtv_api_keys
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════
-- 24. CLOUDFLARE ASSETS — Admin only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "cloudflare_assets_admin_read" ON public.cloudflare_assets
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rtv_users WHERE id = auth.uid()::text AND role = 'admin')
  );
