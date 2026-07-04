-- ============================================================
-- RotationTV Network LLC — Full Supabase Schema (v2 Fixed)
-- Generated from rtv-telegram-wallet/src/entities/*.json (24 entities)
-- Project ref: xynkgaxfwvpcixissxdz
-- Date: 2026-07-04
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academy_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id TEXT,
credit_type TEXT,
amount NUMERIC(18, 8),
balance_after NUMERIC(18, 8),
description TEXT,
course_id TEXT,
course_name TEXT,
nft_diploma_minted BOOLEAN,
nft_mint_address TEXT,
rtv_module TEXT,
transaction_ref TEXT,
expires_at TEXT,
status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agency_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
agency_name TEXT,
owner_name TEXT,
owner_id TEXT,
email TEXT,
phone TEXT,
country TEXT,
website TEXT,
description TEXT,
creator_ids JSONB,
creator_count NUMERIC(18, 8) DEFAULT 0,
tier TEXT DEFAULT 'starter',
commission_rate_pct NUMERIC(18, 8) DEFAULT 20,
total_earnings_usd NUMERIC(18, 8) DEFAULT 0,
monthly_revenue_usd NUMERIC(18, 8) DEFAULT 0,
stripe_account_id TEXT,
stripe_onboarding_complete BOOLEAN DEFAULT false,
api_key TEXT,
status TEXT DEFAULT 'pending',
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_forwarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
voip_number_id TEXT,
phone_number TEXT,
rule_name TEXT,
condition TEXT,
destination TEXT,
ring_timeout_sec NUMERIC(18, 8),
whisper_message TEXT,
enabled BOOLEAN,
priority NUMERIC(18, 8),
schedule_start TEXT,
schedule_end TEXT,
days_of_week JSONB,
rtv_module TEXT,
user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cloudflare_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
asset_name TEXT,
asset_type TEXT,
cloudflare_id TEXT,
cloudflare_url TEXT,
rtv_module TEXT,
company TEXT,
size_bytes NUMERIC(18, 8),
duration_sec NUMERIC(18, 8),
status TEXT,
upload_date TEXT,
playback_url TEXT,
thumbnail_url TEXT,
metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combo_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
gift_id TEXT,
gift_name TEXT,
min_combo NUMERIC(18, 8),
max_combo NUMERIC(18, 8),
multiplier NUMERIC(18, 8),
bonus_creator_rtv NUMERIC(18, 8),
bonus_platform_rtv NUMERIC(18, 8),
effect_name TEXT,
effect_color TEXT,
is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
period_type TEXT,
period_start TEXT,
period_end TEXT,
gross_tips_rtv NUMERIC(18, 8),
gross_tips_usd NUMERIC(18, 8),
creator_share_rtv NUMERIC(18, 8),
creator_share_usd NUMERIC(18, 8),
platform_fee_rtv NUMERIC(18, 8),
platform_fee_usd NUMERIC(18, 8),
agency_fee_rtv NUMERIC(18, 8),
agency_fee_usd NUMERIC(18, 8),
agency_id TEXT,
tip_count NUMERIC(18, 8),
unique_tippers NUMERIC(18, 8),
subscription_revenue_rtv NUMERIC(18, 8),
subscription_revenue_usd NUMERIC(18, 8),
pk_winnings_rtv NUMERIC(18, 8),
pk_winnings_usd NUMERIC(18, 8),
bonus_rtv NUMERIC(18, 8),
bonus_usd NUMERIC(18, 8),
total_net_rtv NUMERIC(18, 8),
total_net_usd NUMERIC(18, 8),
withdrawable_rtv NUMERIC(18, 8),
withdrawn_rtv NUMERIC(18, 8),
status TEXT,
finalized_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
milestone_type TEXT,
milestone_name TEXT,
reward_rtv NUMERIC(18, 8),
reward_badge TEXT,
achieved_at TEXT,
notified BOOLEAN,
metadata TEXT,
status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
agency_id TEXT,
amount_usd NUMERIC(18, 8),
amount_rtv NUMERIC(18, 8),
method TEXT DEFAULT 'stripe',
status TEXT DEFAULT 'pending',
stripe_transfer_id TEXT,
ton_tx_hash TEXT,
ton_address TEXT,
fee_usd NUMERIC(18, 8) DEFAULT 0,
net_usd NUMERIC(18, 8),
agency_cut_usd NUMERIC(18, 8) DEFAULT 0,
creator_net_usd NUMERIC(18, 8),
period_start TEXT,
period_end TEXT,
tx_count NUMERIC(18, 8),
requested_at TEXT,
processed_at TEXT,
completed_at TEXT,
error_message TEXT,
metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
subscriber_id TEXT,
tier TEXT DEFAULT 'bronze',
price_usd NUMERIC(18, 8),
price_rtv NUMERIC(18, 8),
creator_share_rtv NUMERIC(18, 8),
status TEXT DEFAULT 'active',
billing_cycle TEXT DEFAULT 'monthly',
started_at TEXT,
expires_at TEXT,
next_billing_at TEXT,
cancelled_at TEXT,
auto_renew BOOLEAN DEFAULT true,
perks_unlocked JSONB,
payment_method TEXT DEFAULT 'rtv_balance',
stripe_subscription_id TEXT,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
amount_rtv NUMERIC(18, 8),
amount_usd NUMERIC(18, 8),
method TEXT,
destination_address TEXT,
fee_rtv NUMERIC(18, 8),
fee_usd NUMERIC(18, 8),
net_rtv NUMERIC(18, 8),
net_usd NUMERIC(18, 8),
tx_hash TEXT,
stripe_transfer_id TEXT,
status TEXT,
requested_at TEXT,
processed_at TEXT,
completed_at TEXT,
error_message TEXT,
agency_id TEXT,
review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT,
emoji TEXT,
price_rtv NUMERIC(18, 8),
price_usd NUMERIC(18, 8),
category TEXT DEFAULT 'basic',
animation_url TEXT,
animation_duration_sec NUMERIC(18, 8) DEFAULT 3,
is_limited_edition BOOLEAN DEFAULT false,
available_from TEXT,
available_until TEXT,
creator_share_pct NUMERIC(18, 8) DEFAULT 80,
platform_share_pct NUMERIC(18, 8) DEFAULT 15,
agency_share_pct NUMERIC(18, 8) DEFAULT 5,
combo_multiplier NUMERIC(18, 8) DEFAULT 1,
max_combo NUMERIC(18, 8) DEFAULT 100,
description TEXT,
sort_order NUMERIC(18, 8) DEFAULT 0,
is_active BOOLEAN DEFAULT true,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.heygen_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
video_id TEXT,
session_id TEXT,
title TEXT,
company TEXT,
rtv_module TEXT,
status TEXT,
script TEXT,
avatar_id TEXT,
voice_id TEXT,
video_url TEXT,
thumbnail_url TEXT,
heygen_page_url TEXT,
duration_sec NUMERIC(18, 8),
triggered_by TEXT,
callback_received BOOLEAN,
created_at TEXT,
completed_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
leaderboard_type TEXT,
period TEXT DEFAULT 'weekly',
entries JSONB,
total_entries NUMERIC(18, 8) DEFAULT 0,
updated_at TEXT,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
creator_id TEXT,
title TEXT,
description TEXT,
category TEXT DEFAULT 'talk',
stream_key TEXT,
rtmp_url TEXT DEFAULT 'rtmp://live.rotationtv.network/live',
playback_url TEXT,
cloudflare_stream_id TEXT,
thumbnail_url TEXT,
status TEXT DEFAULT 'scheduled',
room_type TEXT DEFAULT 'solo',
max_guests NUMERIC(18, 8) DEFAULT 0,
guest_ids JSONB,
viewer_count NUMERIC(18, 8) DEFAULT 0,
peak_viewers NUMERIC(18, 8) DEFAULT 0,
total_tips_rtv NUMERIC(18, 8) DEFAULT 0,
total_tips_usd NUMERIC(18, 8) DEFAULT 0,
tip_count NUMERIC(18, 8) DEFAULT 0,
unique_tippers NUMERIC(18, 8) DEFAULT 0,
top_tipper_id TEXT,
top_tip_amount NUMERIC(18, 8) DEFAULT 0,
started_at TEXT,
ended_at TEXT,
duration_sec NUMERIC(18, 8) DEFAULT 0,
is_recording BOOLEAN DEFAULT true,
recording_url TEXT,
is_archived BOOLEAN DEFAULT false,
tags JSONB,
language TEXT DEFAULT 'en',
country TEXT,
is_age_restricted BOOLEAN DEFAULT false,
moderation_flags JSONB,
scheduled_at TEXT,
event_ticket_price_usd NUMERIC(18, 8) DEFAULT 0,
event_capacity NUMERIC(18, 8) DEFAULT 0,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
session_id TEXT,
user_name TEXT,
user_email TEXT,
mentor_id TEXT,
messages JSONB,
topic TEXT,
company_interest TEXT,
lead_score NUMERIC(18, 8),
converted BOOLEAN,
conversion_type TEXT,
total_messages NUMERIC(18, 8),
last_active TEXT,
referral_code TEXT,
status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.omega_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
audit_id TEXT,
event_type TEXT,
entity TEXT,
entity_id TEXT,
actor TEXT,
actor_role TEXT,
ip_address TEXT,
amount_usd NUMERIC(18, 8),
amount_rtv NUMERIC(18, 8),
rail TEXT,
stripe_event_id TEXT,
risk_score NUMERIC(18, 8),
flags JSONB,
jurisdiction TEXT,
tax_category TEXT,
is_suspicious BOOLEAN,
reviewed_by TEXT,
notes TEXT,
raw_payload TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pk_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
challenger_id TEXT,
opponent_id TEXT,
stream_id TEXT,
stake_amount_rtv NUMERIC(18, 8),
battle_type TEXT DEFAULT 'standard',
status TEXT DEFAULT 'pending',
winner_id TEXT,
loser_id TEXT,
challenger_tips_rtv NUMERIC(18, 8) DEFAULT 0,
opponent_tips_rtv NUMERIC(18, 8) DEFAULT 0,
challenger_tipper_count NUMERIC(18, 8) DEFAULT 0,
opponent_tipper_count NUMERIC(18, 8) DEFAULT 0,
total_pool_rtv NUMERIC(18, 8) DEFAULT 0,
winner_payout_rtv NUMERIC(18, 8),
loser_payout_rtv NUMERIC(18, 8),
platform_fee_rtv NUMERIC(18, 8),
duration_min NUMERIC(18, 8) DEFAULT 10,
started_at TEXT,
ended_at TEXT,
viewers_peak NUMERIC(18, 8) DEFAULT 0,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rtv_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
merchant_id TEXT,
key_name TEXT,
api_key TEXT,
key_type TEXT,
permissions JSONB,
rate_limit_per_min NUMERIC(18, 8),
monthly_call_limit NUMERIC(18, 8),
calls_this_month NUMERIC(18, 8),
last_used TEXT,
expires_at TEXT,
status TEXT,
ip_whitelist JSONB,
environment TEXT,
revenue_generated NUMERIC(18, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rtv_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
telegram_id NUMERIC(18, 8),
username TEXT,
display_name TEXT,
avatar_url TEXT,
bio TEXT,
email TEXT,
phone TEXT,
country TEXT,
language TEXT DEFAULT 'en',
role TEXT DEFAULT 'viewer',
is_creator BOOLEAN DEFAULT false,
is_verified BOOLEAN DEFAULT false,
verification_type TEXT DEFAULT 'none',
age_verified BOOLEAN DEFAULT false,
kyc_status TEXT DEFAULT 'not_started',
rtv_balance NUMERIC(18, 8) DEFAULT 0,
pending_balance NUMERIC(18, 8) DEFAULT 0,
total_earnings_usd NUMERIC(18, 8) DEFAULT 0,
total_earnings_rtv NUMERIC(18, 8) DEFAULT 0,
lifetime_tips_received NUMERIC(18, 8) DEFAULT 0,
lifetime_tips_sent NUMERIC(18, 8) DEFAULT 0,
followers_count NUMERIC(18, 8) DEFAULT 0,
following_count NUMERIC(18, 8) DEFAULT 0,
total_stream_hours NUMERIC(18, 8) DEFAULT 0,
stream_count NUMERIC(18, 8) DEFAULT 0,
safety_score NUMERIC(18, 8) DEFAULT 100,
reputation_tier TEXT DEFAULT 'new',
loyalty_tier TEXT DEFAULT 'none',
referral_code TEXT,
referred_by TEXT,
agency_id TEXT,
ton_wallet_address TEXT,
social_links JSONB,
tags JSONB,
payout_ready BOOLEAN DEFAULT false,
tax_form_status TEXT DEFAULT 'not_submitted',
status TEXT DEFAULT 'active',
last_active_at TEXT,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
split_name TEXT,
creator_share_pct NUMERIC(18, 8),
platform_share_pct NUMERIC(18, 8),
agency_share_pct NUMERIC(18, 8),
creator_tier_multiplier NUMERIC(18, 8),
min_payout_usd NUMERIC(18, 8),
payout_schedule TEXT,
instant_payout_fee_pct NUMERIC(18, 8),
combo_bonus_pct NUMERIC(18, 8),
pk_winner_bonus_pct NUMERIC(18, 8),
first_stream_bonus_rtv NUMERIC(18, 8),
milestone_bonus_rtv NUMERIC(18, 8),
is_default BOOLEAN,
is_active BOOLEAN,
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rotation_pay_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
business_name TEXT,
owner_name TEXT,
email TEXT,
phone TEXT,
business_type TEXT,
stripe_account_id TEXT,
stripe_onboarding_url TEXT,
stripe_charges_enabled BOOLEAN,
stripe_payouts_enabled BOOLEAN,
paypal_merchant_id TEXT,
api_key TEXT,
api_key_live TEXT,
api_key_test TEXT,
plan TEXT,
monthly_volume NUMERIC(18, 8),
total_volume NUMERIC(18, 8),
revenue_share_pct NUMERIC(18, 8),
rtv_cashback_pct NUMERIC(18, 8),
status TEXT,
rails_enabled JSONB,
webhook_url TEXT,
country TEXT,
currency TEXT,
kyc_verified BOOLEAN,
audit_tier TEXT,
notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stream_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
stream_id TEXT,
sender_id TEXT,
receiver_id TEXT,
gift_id TEXT,
gift_name TEXT,
gift_emoji TEXT,
amount_rtv NUMERIC(18, 8),
amount_usd NUMERIC(18, 8),
creator_earn_rtv NUMERIC(18, 8),
creator_earn_usd NUMERIC(18, 8),
platform_fee_rtv NUMERIC(18, 8),
agency_fee_rtv NUMERIC(18, 8),
combo_count NUMERIC(18, 8) DEFAULT 1,
combo_bonus_rtv NUMERIC(18, 8) DEFAULT 0,
message TEXT,
is_anonymous BOOLEAN DEFAULT false,
is_pinned BOOLEAN DEFAULT false,
pk_battle_id TEXT,
pk_side TEXT,
status TEXT DEFAULT 'completed',
created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tier_name TEXT,
price_usd_monthly NUMERIC(18, 8),
price_rtv_monthly NUMERIC(18, 8),
price_usd_quarterly NUMERIC(18, 8),
price_usd_annual NUMERIC(18, 8),
perks JSONB,
badge_emoji TEXT,
badge_color TEXT,
priority_chat BOOLEAN DEFAULT false,
dm_access BOOLEAN DEFAULT false,
exclusive_content BOOLEAN DEFAULT false,
discount_on_gifts_pct NUMERIC(18, 8) DEFAULT 0,
free_gifts_monthly NUMERIC(18, 8) DEFAULT 0,
is_active BOOLEAN DEFAULT true,
sort_order NUMERIC(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voip_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
phone_number TEXT,
friendly_name TEXT,
provider TEXT,
status TEXT,
capabilities JSONB,
rtv_module TEXT,
user_id TEXT,
monthly_cost NUMERIC(18, 8),
provisioned_at TEXT,
region TEXT,
country_code TEXT,
forwarding_enabled BOOLEAN,
notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════

ALTER TABLE public.academy_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_roster ENABLE ROW LEVEL SECURITY;
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

-- Service role bypasses RLS (used by Cloudflare Workers)
-- Authenticated users subject to RLS policies

-- ═══════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════

CREATE POLICY "streams_public_read" ON public.live_streams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "streams_insert" ON public.live_streams
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "streams_update" ON public.live_streams
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "users_own_data" ON public.rtv_users
  FOR ALL TO authenticated USING (telegram_id = auth.jwt->>'telegram_id');

CREATE POLICY "gifts_public_read" ON public.gift_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tiers_public_read" ON public.subscription_tiers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "leaderboards_public_read" ON public.leaderboards
  FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════

CREATE INDEX idx_live_streams_0 ON public.live_streams(is_live, viewer_count DESC);
CREATE INDEX idx_live_streams_1 ON public.live_streams(creator_id);
CREATE INDEX idx_live_streams_2 ON public.live_streams(category);
CREATE INDEX idx_rtv_users_0 ON public.rtv_users(telegram_id);
CREATE INDEX idx_rtv_users_1 ON public.rtv_users(username);
CREATE INDEX idx_rtv_users_2 ON public.rtv_users(tier);
CREATE INDEX idx_creator_earnings_0 ON public.creator_earnings(creator_id, period);
CREATE INDEX idx_creator_payouts_0 ON public.creator_payouts(creator_id, status);
CREATE INDEX idx_creator_payouts_1 ON public.creator_payouts(status, requested_at);
CREATE INDEX idx_creator_subscriptions_0 ON public.creator_subscriptions(creator_id);
CREATE INDEX idx_creator_subscriptions_1 ON public.creator_subscriptions(subscriber_id);
CREATE INDEX idx_gift_items_0 ON public.gift_items(category);
CREATE INDEX idx_gift_items_1 ON public.gift_items(price_rtv);
CREATE INDEX idx_stream_tips_0 ON public.stream_tips(stream_id, created_at DESC);
CREATE INDEX idx_stream_tips_1 ON public.stream_tips(sender_id);
CREATE INDEX idx_pk_battles_0 ON public.pk_battles(status);
CREATE INDEX idx_pk_battles_1 ON public.pk_battles(creator_a_id, creator_b_id);
CREATE INDEX idx_omega_audit_logs_0 ON public.omega_audit_logs(agent_type, created_at DESC);
CREATE INDEX idx_rtv_api_keys_0 ON public.rtv_api_keys(service, status);
CREATE INDEX idx_revenue_splits_0 ON public.revenue_splits(creator_id, period);
CREATE INDEX idx_leaderboards_0 ON public.leaderboards(leaderboard_type, rank);
CREATE INDEX idx_voip_numbers_0 ON public.voip_numbers(user_id);
CREATE INDEX idx_voip_numbers_1 ON public.voip_numbers(status);
CREATE INDEX idx_agency_roster_0 ON public.agency_roster(agency_id);
CREATE INDEX idx_agency_roster_1 ON public.agency_roster(creator_id, status);
CREATE INDEX idx_call_forwarding_0 ON public.call_forwarding(user_id);
CREATE INDEX idx_call_forwarding_1 ON public.call_forwarding(enabled);
CREATE INDEX idx_combo_multipliers_0 ON public.combo_multipliers(user_id);
CREATE INDEX idx_combo_multipliers_1 ON public.combo_multipliers(expires_at);
CREATE INDEX idx_creator_milestones_0 ON public.creator_milestones(creator_id, milestone_type);
CREATE INDEX idx_creator_withdrawals_0 ON public.creator_withdrawals(creator_id, status);
CREATE INDEX idx_heygen_videos_0 ON public.heygen_videos(creator_id, status);
CREATE INDEX idx_mentor_sessions_0 ON public.mentor_sessions(mentor_id);
CREATE INDEX idx_mentor_sessions_1 ON public.mentor_sessions(mentee_id, status);
CREATE INDEX idx_rotation_pay_merchants_0 ON public.rotation_pay_merchants(merchant_id);
CREATE INDEX idx_rotation_pay_merchants_1 ON public.rotation_pay_merchants(status);
CREATE INDEX idx_academy_credits_0 ON public.academy_credits(telegram_id, credit_type);
CREATE INDEX idx_cloudflare_assets_0 ON public.cloudflare_assets(asset_type);
CREATE INDEX idx_cloudflare_assets_1 ON public.cloudflare_assets(domain);


-- ═══════════════════════════════════════════════════
-- ATOMIC FUNCTIONS
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_gift(
  p_sender_telegram_id TEXT,
  p_stream_id UUID,
  p_amount INTEGER,
  p_token TEXT DEFAULT 'RTV'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_balance NUMERIC(18, 8);
  v_creator_id TEXT;
  v_creator_share INTEGER;
  v_platform_share INTEGER;
  v_agency_share INTEGER;
BEGIN
  SELECT rtv_balance INTO v_sender_balance
    FROM public.rtv_users WHERE telegram_id = p_sender_telegram_id FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient RTV balance');
  END IF;

  SELECT creator_id INTO v_creator_id
    FROM public.live_streams WHERE id = p_stream_id FOR UPDATE;

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stream not found');
  END IF;

  v_creator_share := FLOOR(p_amount * 0.80);
  v_platform_share := FLOOR(p_amount * 0.15);
  v_agency_share := p_amount - v_creator_share - v_platform_share;

  UPDATE public.rtv_users SET rtv_balance = rtv_balance - p_amount
    WHERE telegram_id = p_sender_telegram_id;

  UPDATE public.rtv_users SET rtv_balance = rtv_balance + v_creator_share
    WHERE telegram_id = v_creator_id;

  UPDATE public.live_streams SET gift_total = COALESCE(gift_total, 0) + p_amount
    WHERE id = p_stream_id;

  INSERT INTO public.stream_tips (sender_id, stream_id, amount, token)
    VALUES (p_sender_telegram_id, p_stream_id, p_amount, p_token);

  RETURN jsonb_build_object(
    'success', true, 'amount', p_amount,
    'creator_share', v_creator_share,
    'platform_share', v_platform_share,
    'agency_share', v_agency_share
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_gift(TEXT, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_gift(TEXT, UUID, INTEGER, TEXT) TO service_role;
