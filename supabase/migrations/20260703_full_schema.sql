-- ============================================================
-- RTV Ecosystem — Supabase PostgreSQL Schema
-- Auto-generated from rotationtv1-crypto/rtv-telegram-wallet
-- Source: src/entities/*.json (24 entity definitions)
-- ============================================================

-- Table: AcademyCredit
CREATE TABLE IF NOT EXISTS public.academy_credit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  credit_type TEXT CHECK (credit_type IN ('earned', 'purchased', 'granted', 'bonus', 'referral')) NOT NULL,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  description TEXT,
  course_id TEXT,
  course_name TEXT,
  nft_diploma_minted BOOLEAN,
  nft_mint_address TEXT,
  rtv_module TEXT,
  transaction_ref TEXT,
  expires_at TEXT,
  status TEXT CHECK (status IN ('active', 'expired', 'pending', 'cancelled')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: AgencyRoster
CREATE TABLE IF NOT EXISTS public.agency_roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  website TEXT,
  description TEXT,
  creator_ids JSONB,
  creator_count NUMERIC,
  tier TEXT CHECK (tier IN ('starter', 'growth', 'professional', 'enterprise')),
  commission_rate_pct NUMERIC,
  total_earnings_usd NUMERIC,
  monthly_revenue_usd NUMERIC,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN,
  api_key TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) NOT NULL,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CallForwarding
CREATE TABLE IF NOT EXISTS public.call_forwarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voip_number_id TEXT NOT NULL,
  phone_number TEXT,
  rule_name TEXT,
  condition TEXT CHECK (condition IN ('always', 'busy', 'no_answer', 'unavailable', 'time_based')) NOT NULL,
  destination TEXT NOT NULL,
  ring_timeout_sec NUMERIC,
  whisper_message TEXT,
  enabled BOOLEAN NOT NULL,
  priority NUMERIC,
  schedule_start TEXT,
  schedule_end TEXT,
  days_of_week JSONB,
  rtv_module TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CloudflareAsset
CREATE TABLE IF NOT EXISTS public.cloudflare_asset (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT,
  asset_type TEXT CHECK (asset_type IN ('stream_video', 'r2_object', 'worker', 'page', 'kv_store')),
  cloudflare_id TEXT,
  cloudflare_url TEXT,
  rtv_module TEXT,
  company TEXT,
  size_bytes NUMERIC,
  duration_sec NUMERIC,
  status TEXT CHECK (status IN ('active', 'processing', 'error', 'archived')),
  upload_date TEXT,
  playback_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: ComboMultiplier
CREATE TABLE IF NOT EXISTS public.combo_multiplier (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_id TEXT,
  gift_name TEXT,
  min_combo NUMERIC NOT NULL,
  max_combo NUMERIC NOT NULL,
  multiplier NUMERIC NOT NULL,
  bonus_creator_rtv NUMERIC,
  bonus_platform_rtv NUMERIC,
  effect_name TEXT NOT NULL,
  effect_color TEXT,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CreatorEarning
CREATE TABLE IF NOT EXISTS public.creator_earning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'lifetime')) NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT,
  gross_tips_rtv NUMERIC NOT NULL,
  gross_tips_usd NUMERIC,
  creator_share_rtv NUMERIC NOT NULL,
  creator_share_usd NUMERIC,
  platform_fee_rtv NUMERIC NOT NULL,
  platform_fee_usd NUMERIC,
  agency_fee_rtv NUMERIC,
  agency_fee_usd NUMERIC,
  agency_id TEXT,
  tip_count NUMERIC,
  unique_tippers NUMERIC,
  subscription_revenue_rtv NUMERIC,
  subscription_revenue_usd NUMERIC,
  pk_winnings_rtv NUMERIC,
  pk_winnings_usd NUMERIC,
  bonus_rtv NUMERIC,
  bonus_usd NUMERIC,
  total_net_rtv NUMERIC NOT NULL,
  total_net_usd NUMERIC,
  withdrawable_rtv NUMERIC,
  withdrawn_rtv NUMERIC,
  status TEXT CHECK (status IN ('accruing', 'finalized', 'paid', 'disputed')) NOT NULL,
  finalized_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CreatorMilestone
CREATE TABLE IF NOT EXISTS public.creator_milestone (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN ('first_stream', 'followers_100', 'followers_500', 'followers_1k', 'followers_10k')) NOT NULL,
  milestone_name TEXT NOT NULL,
  reward_rtv NUMERIC,
  reward_badge TEXT,
  achieved_at TEXT NOT NULL,
  notified BOOLEAN,
  metadata TEXT,
  status TEXT CHECK (status IN ('achieved', 'rewarded', 'pending_notification')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CreatorPayout
CREATE TABLE IF NOT EXISTS public.creator_payout (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  agency_id TEXT,
  amount_usd NUMERIC NOT NULL,
  amount_rtv NUMERIC,
  method TEXT CHECK (method IN ('stripe', 'ton', 'paypal', 'internal', 'bank_transfer')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  stripe_transfer_id TEXT,
  ton_tx_hash TEXT,
  ton_address TEXT,
  fee_usd NUMERIC,
  net_usd NUMERIC,
  agency_cut_usd NUMERIC,
  creator_net_usd NUMERIC,
  period_start TEXT,
  period_end TEXT,
  tx_count NUMERIC,
  requested_at TEXT,
  processed_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CreatorSubscription
CREATE TABLE IF NOT EXISTS public.creator_subscription (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) NOT NULL,
  price_usd NUMERIC,
  price_rtv NUMERIC,
  creator_share_rtv NUMERIC,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'paused', 'trial')) NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  started_at TEXT,
  expires_at TEXT,
  next_billing_at TEXT,
  cancelled_at TEXT,
  auto_renew BOOLEAN,
  perks_unlocked JSONB,
  payment_method TEXT CHECK (payment_method IN ('rtv_balance', 'stripe', 'ton', 'free_trial')),
  stripe_subscription_id TEXT,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: CreatorWithdrawal
CREATE TABLE IF NOT EXISTS public.creator_withdrawal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  amount_rtv NUMERIC NOT NULL,
  amount_usd NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('ton_wallet', 'solana_wallet', 'stripe_direct', 'paypal', 'crypto_bot')) NOT NULL,
  destination_address TEXT,
  fee_rtv NUMERIC,
  fee_usd NUMERIC,
  net_rtv NUMERIC,
  net_usd NUMERIC,
  tx_hash TEXT,
  stripe_transfer_id TEXT,
  status TEXT CHECK (status IN ('requested', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  requested_at TEXT,
  processed_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  agency_id TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: GiftItem
CREATE TABLE IF NOT EXISTS public.gift_item (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  price_rtv NUMERIC NOT NULL,
  price_usd NUMERIC,
  category TEXT CHECK (category IN ('basic', 'premium', 'legendary', 'seasonal', 'exclusive')) NOT NULL,
  animation_url TEXT,
  animation_duration_sec NUMERIC,
  is_limited_edition BOOLEAN,
  available_from TEXT,
  available_until TEXT,
  creator_share_pct NUMERIC,
  platform_share_pct NUMERIC,
  agency_share_pct NUMERIC,
  combo_multiplier NUMERIC,
  max_combo NUMERIC,
  description TEXT,
  sort_order NUMERIC,
  is_active BOOLEAN NOT NULL,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: HeyGenVideo
CREATE TABLE IF NOT EXISTS public.hey_gen_video (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT,
  session_id TEXT,
  title TEXT,
  company TEXT,
  rtv_module TEXT,
  status TEXT CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  script TEXT,
  avatar_id TEXT,
  voice_id TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  heygen_page_url TEXT,
  duration_sec NUMERIC,
  triggered_by TEXT,
  callback_received BOOLEAN,
  created_at TEXT,
  completed_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT CHECK (leaderboard_type IN ('top_earners_weekly', 'top_earners_monthly', 'top_earners_alltime', 'top_tippers', 'most_viewed')) NOT NULL,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'alltime')) NOT NULL,
  entries JSONB NOT NULL,
  total_entries NUMERIC,
  updated_at TEXT,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: LiveStream
CREATE TABLE IF NOT EXISTS public.live_stream (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('gaming', 'music', 'talk', 'dance', 'lifestyle')) NOT NULL,
  stream_key TEXT,
  rtmp_url TEXT,
  playback_url TEXT,
  cloudflare_stream_id TEXT,
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('scheduled', 'waiting', 'live', 'ended', 'failed')) NOT NULL,
  room_type TEXT CHECK (room_type IN ('solo', 'multi_guest', 'pk_battle', 'event')) NOT NULL,
  max_guests NUMERIC,
  guest_ids JSONB,
  viewer_count NUMERIC,
  peak_viewers NUMERIC,
  total_tips_rtv NUMERIC,
  total_tips_usd NUMERIC,
  tip_count NUMERIC,
  unique_tippers NUMERIC,
  top_tipper_id TEXT,
  top_tip_amount NUMERIC,
  started_at TEXT,
  ended_at TEXT,
  duration_sec NUMERIC,
  is_recording BOOLEAN,
  recording_url TEXT,
  is_archived BOOLEAN,
  tags JSONB,
  language TEXT,
  country TEXT,
  is_age_restricted BOOLEAN,
  moderation_flags JSONB,
  scheduled_at TEXT,
  event_ticket_price_usd NUMERIC,
  event_capacity NUMERIC,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: MentorSession
CREATE TABLE IF NOT EXISTS public.mentor_session (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_name TEXT,
  user_email TEXT,
  mentor_id TEXT,
  messages JSONB,
  topic TEXT,
  company_interest TEXT,
  lead_score NUMERIC,
  converted BOOLEAN,
  conversion_type TEXT,
  total_messages NUMERIC,
  last_active TEXT,
  referral_code TEXT,
  status TEXT CHECK (status IN ('active', 'closed', 'converted', 'follow_up')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: OmegaAuditLog
CREATE TABLE IF NOT EXISTS public.omega_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id TEXT,
  event_type TEXT,
  entity TEXT,
  entity_id TEXT,
  actor TEXT,
  actor_role TEXT,
  ip_address TEXT,
  amount_usd NUMERIC,
  amount_rtv NUMERIC,
  rail TEXT,
  stripe_event_id TEXT,
  risk_score NUMERIC,
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

-- Table: PKBattle
CREATE TABLE IF NOT EXISTS public.pk_battle (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id TEXT NOT NULL,
  opponent_id TEXT NOT NULL,
  stream_id TEXT,
  stake_amount_rtv NUMERIC NOT NULL,
  battle_type TEXT CHECK (battle_type IN ('standard', 'premium', 'tournament', 'custom')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled')) NOT NULL,
  winner_id TEXT,
  loser_id TEXT,
  challenger_tips_rtv NUMERIC,
  opponent_tips_rtv NUMERIC,
  challenger_tipper_count NUMERIC,
  opponent_tipper_count NUMERIC,
  total_pool_rtv NUMERIC,
  winner_payout_rtv NUMERIC,
  loser_payout_rtv NUMERIC,
  platform_fee_rtv NUMERIC,
  duration_min NUMERIC,
  started_at TEXT,
  ended_at TEXT,
  viewers_peak NUMERIC,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: RTVAPIKey
CREATE TABLE IF NOT EXISTS public.rtv_api_key (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id TEXT,
  key_name TEXT,
  api_key TEXT,
  key_type TEXT CHECK (key_type IN ('live', 'test', 'webhook', 'reseller')),
  permissions JSONB,
  rate_limit_per_min NUMERIC,
  monthly_call_limit NUMERIC,
  calls_this_month NUMERIC,
  last_used TEXT,
  expires_at TEXT,
  status TEXT CHECK (status IN ('active', 'revoked', 'expired', 'pending')),
  ip_whitelist JSONB,
  environment TEXT CHECK (environment IN ('live', 'sandbox')),
  revenue_generated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: RTVUser
CREATE TABLE IF NOT EXISTS public.rtv_user (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id NUMERIC,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  language TEXT CHECK (language IN ('en', 'es', 'pt', 'fr', 'ar')),
  role TEXT CHECK (role IN ('viewer', 'creator', 'moderator', 'admin', 'agency')) NOT NULL,
  is_creator BOOLEAN,
  is_verified BOOLEAN,
  verification_type TEXT CHECK (verification_type IN ('none', 'email', 'phone', 'identity', 'blue_check')),
  age_verified BOOLEAN,
  kyc_status TEXT CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
  rtv_balance NUMERIC,
  pending_balance NUMERIC,
  total_earnings_usd NUMERIC,
  total_earnings_rtv NUMERIC,
  lifetime_tips_received NUMERIC,
  lifetime_tips_sent NUMERIC,
  followers_count NUMERIC,
  following_count NUMERIC,
  total_stream_hours NUMERIC,
  stream_count NUMERIC,
  safety_score NUMERIC,
  reputation_tier TEXT CHECK (reputation_tier IN ('new', 'rising', 'established', 'elite', 'legendary')),
  loyalty_tier TEXT CHECK (loyalty_tier IN ('none', 'bronze', 'silver', 'gold', 'platinum')),
  referral_code TEXT,
  referred_by TEXT,
  agency_id TEXT,
  ton_wallet_address TEXT,
  social_links JSONB,
  tags JSONB,
  payout_ready BOOLEAN,
  tax_form_status TEXT CHECK (tax_form_status IN ('not_submitted', 'pending', 'approved', 'expired')),
  status TEXT CHECK (status IN ('active', 'suspended', 'banned', 'deleted')) NOT NULL,
  last_active_at TEXT,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: RevenueSplit
CREATE TABLE IF NOT EXISTS public.revenue_split (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  split_name TEXT NOT NULL,
  creator_share_pct NUMERIC NOT NULL,
  platform_share_pct NUMERIC NOT NULL,
  agency_share_pct NUMERIC NOT NULL,
  creator_tier_multiplier NUMERIC,
  min_payout_usd NUMERIC,
  payout_schedule TEXT CHECK (payout_schedule IN ('weekly', 'biweekly', 'monthly', 'instant')) NOT NULL,
  instant_payout_fee_pct NUMERIC,
  combo_bonus_pct NUMERIC,
  pk_winner_bonus_pct NUMERIC,
  first_stream_bonus_rtv NUMERIC,
  milestone_bonus_rtv NUMERIC,
  is_default BOOLEAN,
  is_active BOOLEAN NOT NULL,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: RotationPayMerchant
CREATE TABLE IF NOT EXISTS public.rotation_pay_merchant (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company', 'nonprofit', 'government_entity')),
  stripe_account_id TEXT,
  stripe_onboarding_url TEXT,
  stripe_charges_enabled BOOLEAN,
  stripe_payouts_enabled BOOLEAN,
  paypal_merchant_id TEXT,
  api_key TEXT,
  api_key_live TEXT,
  api_key_test TEXT,
  plan TEXT CHECK (plan IN ('starter', 'growth', 'enterprise', 'reseller')),
  monthly_volume NUMERIC,
  total_volume NUMERIC,
  revenue_share_pct NUMERIC,
  rtv_cashback_pct NUMERIC,
  status TEXT CHECK (status IN ('pending', 'onboarding', 'active', 'suspended', 'churned')),
  rails_enabled JSONB,
  webhook_url TEXT,
  country TEXT,
  currency TEXT,
  kyc_verified BOOLEAN,
  audit_tier TEXT CHECK (audit_tier IN ('standard', 'premium', 'rothschild')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: StreamTip
CREATE TABLE IF NOT EXISTS public.stream_tip (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  gift_id TEXT,
  gift_name TEXT,
  gift_emoji TEXT,
  amount_rtv NUMERIC NOT NULL,
  amount_usd NUMERIC,
  creator_earn_rtv NUMERIC,
  creator_earn_usd NUMERIC,
  platform_fee_rtv NUMERIC,
  agency_fee_rtv NUMERIC,
  combo_count NUMERIC,
  combo_bonus_rtv NUMERIC,
  message TEXT,
  is_anonymous BOOLEAN,
  is_pinned BOOLEAN,
  pk_battle_id TEXT,
  pk_side TEXT CHECK (pk_side IN ('challenger', 'opponent')),
  status TEXT CHECK (status IN ('completed', 'reversed', 'failed')) NOT NULL,
  created_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: SubscriptionTier
CREATE TABLE IF NOT EXISTS public.subscription_tier (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')) NOT NULL,
  price_usd_monthly NUMERIC NOT NULL,
  price_rtv_monthly NUMERIC,
  price_usd_quarterly NUMERIC,
  price_usd_annual NUMERIC,
  perks JSONB,
  badge_emoji TEXT,
  badge_color TEXT,
  priority_chat BOOLEAN,
  dm_access BOOLEAN,
  exclusive_content BOOLEAN,
  discount_on_gifts_pct NUMERIC,
  free_gifts_monthly NUMERIC,
  is_active BOOLEAN NOT NULL,
  sort_order NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: VoIPNumber
CREATE TABLE IF NOT EXISTS public.voip_number (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  friendly_name TEXT,
  provider TEXT CHECK (provider IN ('twilio', 'vonage', 'bandwidth', 'telnyx', 'sinch')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'porting', 'released')) NOT NULL,
  capabilities JSONB,
  rtv_module TEXT,
  user_id TEXT,
  monthly_cost NUMERIC,
  provisioned_at TEXT,
  region TEXT,
  country_code TEXT,
  forwarding_enabled BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security Policies
ALTER TABLE public.academy_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_forwarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloudflare_asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_multiplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_withdrawal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hey_gen_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pk_battle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtv_api_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtv_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_split ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_pay_merchant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_number ENABLE ROW LEVEL SECURITY;

-- End of schema