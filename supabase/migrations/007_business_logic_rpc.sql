-- ============================================================
-- ROTATIONTV — SUPABASE BUSINESS LOGIC + TIER ENGINE
-- Migration 007
-- Run in: Supabase Dashboard → SQL Editor
-- Project: xynkgaxfwvpcixissxdz
-- ============================================================

-- ============================================================
-- 1. UPGRADE_USER_TIER RPC
-- Atomic tier upgrade triggered by payment webhooks (Tribute/Stripe/TON)
-- ============================================================

CREATE OR REPLACE FUNCTION upgrade_user_tier(
  target_telegram_id BIGINT,
  new_tier TEXT DEFAULT 'premium'
)
RETURNS TABLE(success BOOLEAN, user_id UUID, previous_tier TEXT, new_tier TEXT, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_previous_tier TEXT;
  v_error TEXT;
BEGIN
  -- Find user by Telegram ID
  SELECT id, plan INTO v_user_id, v_previous_tier
  FROM profiles
  WHERE telegram_id = target_telegram_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'User not found with telegram_id: ' || target_telegram_id;
    RETURN;
  END IF;

  -- Atomic tier upgrade
  UPDATE profiles
  SET
    plan = new_tier,
    content_tier = CASE
      WHEN new_tier IN ('pro', 'enterprise', 'premium') THEN 'premium'
      ELSE content_tier
    END,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Log the tier change
  INSERT INTO system_logs (event, status, metadata)
  VALUES (
    'tier_upgrade',
    'success',
    jsonb_build_object(
      'user_id', v_user_id,
      'telegram_id', target_telegram_id,
      'previous_tier', v_previous_tier,
      'new_tier', new_tier,
      'timestamp', NOW()
    )
  );

  RETURN QUERY SELECT TRUE, v_user_id, v_previous_tier, new_tier, NULL::TEXT;
END;
$$;

-- Grant execute to service_role (bypasses RLS)
GRANT EXECUTE ON FUNCTION upgrade_user_tier(BIGINT, TEXT) TO service_role;

-- ============================================================
-- 2. PROCESS_TRIBUTE_PAYMENT RPC
-- Called by the Tribute webhook handler to atomically process
-- a payment event: log + update subscription + trigger tier upgrade
-- ============================================================

CREATE OR REPLACE FUNCTION process_tribute_payment(
  p_event_type TEXT,
  p_user_telegram_id BIGINT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_tribute_subscription_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, event_id UUID, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_tier TEXT;
BEGIN
  -- Generate event ID
  v_event_id := gen_random_uuid();

  -- Determine tier from amount
  v_tier := CASE
    WHEN p_amount >= 99.99 THEN 'enterprise'
    WHEN p_amount >= 29.99 THEN 'pro'
    WHEN p_amount >= 9.99 THEN 'premium'
    ELSE 'free'
  END;

  -- Insert payment record
  INSERT INTO payments (
    amount, currency, status, provider, provider_payment_id, metadata
  ) VALUES (
    p_amount, p_currency, 'completed', 'tribute',
    p_tribute_subscription_id, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  -- Insert subscription record if subscription event
  IF p_event_type IN ('new_subscription', 'renewed_subscription') AND p_tribute_subscription_id IS NOT NULL THEN
    INSERT INTO creator_subscriptions (
      subscriber_id, tier, amount, currency, status, provider_subscription_id
    ) VALUES (
      p_user_telegram_id, v_tier, p_amount, p_currency, 'active', p_tribute_subscription_id
    )
    ON CONFLICT (provider_subscription_id) DO UPDATE
    SET status = 'active', updated_at = NOW();
  END IF;

  -- Upgrade user tier
  IF p_event_type IN ('new_subscription', 'renewed_subscription', 'new_donation', 'recurrent_donation') THEN
    PERFORM upgrade_user_tier(p_user_telegram_id, v_tier);
  END IF;

  -- Log
  INSERT INTO system_logs (event, status, metadata)
  VALUES (
    'tribute_payment',
    'success',
    jsonb_build_object(
      'event_type', p_event_type,
      'amount', p_amount,
      'currency', p_currency,
      'tier', v_tier,
      'subscription_id', p_tribute_subscription_id
    )
  );

  RETURN QUERY SELECT TRUE, v_event_id, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  v_error := SQLERRM;
  INSERT INTO system_logs (event, status, metadata)
  VALUES ('tribute_payment', 'error', jsonb_build_object('error', v_error, 'event_type', p_event_type));
  RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
END;
$$;

GRANT EXECUTE ON FUNCTION process_tribute_payment(TEXT, BIGINT, NUMERIC, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 3. GET_USER_WALLET_BALANCE RPC
-- Atomic wallet balance lookup (bypasses RLS for service calls)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_wallet_balance(
  p_user_telegram_id BIGINT
)
RETURNS TABLE(wallet_address TEXT, balance NUMERIC, currency TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.wallet_address, w.balance, w.currency, w.updated_at
  FROM wallets w
  JOIN profiles p ON w.user_id = p.id
  WHERE p.telegram_id = p_user_telegram_id
  ORDER BY w.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_user_wallet_balance(BIGINT) TO service_role;

-- ============================================================
-- 4. RECORD_REVENUE_SPLIT RPC
-- Applies the 80/15/5 revenue split to a transaction
-- 80% creator / 15% platform / 5% agency
-- ============================================================

CREATE OR REPLACE FUNCTION record_revenue_split(
  p_transaction_id UUID,
  p_gross_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_creator_id UUID DEFAULT NULL,
  p_agency_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, creator_amount NUMERIC, platform_amount NUMERIC, agency_amount NUMERIC, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_agency_amount NUMERIC;
BEGIN
  -- Calculate splits: 80/15/5
  v_creator_amount := ROUND(p_gross_amount * 0.80, 2);
  v_platform_amount := ROUND(p_gross_amount * 0.15, 2);
  v_agency_amount := ROUND(p_gross_amount * 0.05, 2);

  -- Insert revenue records
  INSERT INTO creator_revenue (creator_id, transaction_id, amount, currency, split_type)
  VALUES
    (p_creator_id, p_transaction_id, v_creator_amount, p_currency, 'creator_80'),
    (NULL, p_transaction_id, v_platform_amount, p_currency, 'platform_15'),
    (p_agency_id, p_transaction_id, v_agency_amount, p_currency, 'agency_5');

  -- Update platform treasury
  INSERT INTO platform_treasury (amount, currency, source, transaction_id)
  VALUES (v_platform_amount, p_currency, 'platform_split', p_transaction_id);

  RETURN QUERY SELECT TRUE, v_creator_amount, v_platform_amount, v_agency_amount, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION record_revenue_split(UUID, NUMERIC, TEXT, UUID, UUID) TO service_role;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Test tier upgrade:
--   SELECT * FROM upgrade_user_tier(123456789, 'premium');
--
-- Test revenue split:
--   SELECT * FROM record_revenue_split(
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     29.99, 'USD'
--   );
--
-- Test wallet balance:
--   SELECT * FROM get_user_wallet_balance(123456789);
