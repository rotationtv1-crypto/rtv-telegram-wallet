-- ============================================================
-- SECURITY HARDENING — Rotation Erotica (zzybjoowhkwuomnpixuy)
-- CRITICAL: Fixes fund-drain bug in transfer_rtv + gift fraud + stream key overwrite
-- This file targets a DIFFERENT Supabase project than this repo's
-- default migration target. Apply manually via SQL Editor on
-- project zzybjoowhkwuomnpixuy.
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- FIX 1: transfer_rtv — add caller-identity guard (CRITICAL)
-- Any authenticated user could drain any other user's balance
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_rtv(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount NUMERIC,
  p_type TEXT DEFAULT 'gift',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- GUARD: Only service_role can call this, OR the caller must be the sender
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('service_role', 'supabase_admin')
     AND auth.uid() IS DISTINCT FROM p_sender_id
  THEN
    RAISE EXCEPTION 'FORBIDDEN: caller identity does not match sender_id';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be positive');
  END IF;

  -- Check sender balance
  SELECT COALESCE(rtv_balance, 0) INTO v_sender_balance
  FROM profiles WHERE id = p_sender_id;

  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance', 'balance', v_sender_balance, 'required', p_amount);
  END IF;

  -- Deduct from sender
  UPDATE profiles SET rtv_balance = rtv_balance - p_amount WHERE id = p_sender_id;

  -- Credit receiver
  UPDATE profiles SET rtv_balance = rtv_balance + p_amount WHERE id = p_receiver_id;

  -- Log transaction
  INSERT INTO rtv_transactions (sender_id, receiver_id, amount, type, description, reference_id, status)
  VALUES (p_sender_id, p_receiver_id, p_amount, p_type, p_description, p_reference_id, 'completed')
  RETURNING jsonb_build_object(
    'status', 'completed',
    'transaction_id', id,
    'amount', p_amount,
    'sender_balance_after', (SELECT rtv_balance FROM profiles WHERE id = p_sender_id),
    'receiver_balance_after', (SELECT rtv_balance FROM profiles WHERE id = p_receiver_id)
  ) INTO v_result;

  RETURN v_result;
END; $$;

-- Defense in depth: block direct RPC calls from non-service roles
REVOKE EXECUTE ON FUNCTION public.transfer_rtv(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) FROM authenticated, anon;

-- ═══════════════════════════════════════════════════════════
-- FIX 2: gift_transactions — remove client INSERT policy
-- Clients could fabricate free gifts with no balance deduction
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Authenticated users send gifts" ON public.gift_transactions;
-- All gift rows now written by worker service_role only
-- Keep SELECT policy for public gift feed

-- ═══════════════════════════════════════════════════════════
-- FIX 3: live_rooms — column-level protection via trigger
-- Creators could overwrite stream_key, stream_uid, whip_url,
-- whep_url, connection_state, rtv_earned_session directly
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_live_rooms_stream_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only service_role can modify server-controlled columns
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('service_role', 'supabase_admin') THEN
    IF NEW.stream_key IS DISTINCT FROM OLD.stream_key
       OR NEW.stream_uid IS DISTINCT FROM OLD.stream_uid
       OR NEW.whip_url IS DISTINCT FROM OLD.whip_url
       OR NEW.whep_url IS DISTINCT FROM OLD.whep_url
       OR NEW.connection_state IS DISTINCT FROM OLD.connection_state
       OR NEW.rtv_earned_session IS DISTINCT FROM OLD.rtv_earned_session
    THEN
      RAISE EXCEPTION 'FORBIDDEN: server-controlled columns cannot be modified by non-service roles';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.protect_live_rooms_stream_columns() FROM PUBLIC, authenticated, anon;

DROP TRIGGER IF EXISTS trg_protect_live_rooms_stream_columns ON public.live_rooms;
CREATE TRIGGER trg_protect_live_rooms_stream_columns
  BEFORE UPDATE ON public.live_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_live_rooms_stream_columns();

-- ═══════════════════════════════════════════════════════════
-- FIX 4: Revoke direct execution on exposed SECURITY DEFINER functions
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.prune_stale_stream_viewers() FROM PUBLIC, authenticated, anon;

-- ═══════════════════════════════════════════════════════════
-- FIX 5: Set search_path on flagged functions
-- ═══════════════════════════════════════════════════════════

ALTER FUNCTION public.transfer_rtv(UUID, UUID, NUMERIC, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.prune_stale_stream_viewers() SET search_path = public;
ALTER FUNCTION public.protect_live_rooms_stream_columns() SET search_path = public;

-- ═══════════════════════════════════════════════════════════
-- FIX 6: Add gift_transactions to realtime publication
-- Enables viewer-side gift overlays via postgres_changes
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;
