-- ============================================================
-- SECURITY HARDENING — Rotation Erotica Project
-- Target: zzybjoowhkwuomnpixuy (NOT xynkgaxfwvpcixissxdz)
-- This file is an AUDIT TRAIL only. Apply directly via:
--   Supabase Dashboard → SQL Editor → paste & run
--   OR: supabase --project-ref zzybjoowhkwuomnpixuy db push
-- Date: 2026-07-04
-- Found by: Claude audit
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- FIX 1 (CRITICAL): transfer_rtv has no caller-identity check
-- Any authenticated user can drain any other user's balance
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_rtv(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount_rtv REAL,
  p_transfer_type TEXT DEFAULT 'gift',
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance REAL;
  v_result JSONB;
BEGIN
  -- CRITICAL: Caller identity check
  -- Only service_role can call for any sender; authenticated users can only send as themselves
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_sender_id THEN
    RAISE EXCEPTION 'FORBIDDEN: caller identity mismatch';
  END IF;

  -- Validate amount
  IF p_amount_rtv <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be positive');
  END IF;

  -- Check sender balance
  SELECT COALESCE(rtv_balance, 0) INTO v_sender_balance
  FROM profiles WHERE id = p_sender_id;

  IF v_sender_balance < p_amount_rtv THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance', 'balance', v_sender_balance, 'required', p_amount_rtv);
  END IF;

  -- Deduct from sender
  UPDATE profiles SET rtv_balance = rtv_balance - p_amount_rtv WHERE id = p_sender_id;

  -- Credit receiver
  UPDATE profiles SET rtv_balance = rtv_balance + p_amount_rtv WHERE id = p_receiver_id;

  -- Log transaction
  INSERT INTO rtv_transactions (sender_id, receiver_id, amount_rtv, transfer_type, description, reference_id, status)
  VALUES (p_sender_id, p_receiver_id, p_amount_rtv, p_transfer_type, p_description, p_reference_id, 'completed')
  RETURNING jsonb_build_object(
    'status', 'completed',
    'transaction_id', id,
    'amount_rtv', p_amount_rtv,
    'sender_id', p_sender_id,
    'receiver_id', p_receiver_id
  ) INTO v_result;

  RETURN v_result;
END; $$;

-- Defense in depth: block direct RPC calls from non-service roles
REVOKE EXECUTE ON FUNCTION public.transfer_rtv(UUID, UUID, REAL, TEXT, TEXT, TEXT) FROM authenticated, anon;

-- ═══════════════════════════════════════════════════════════
-- FIX 2: gift_transactions INSERT policy lets clients fabricate free gifts
-- Drop the client INSERT policy — all gift rows written by worker service_role
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Authenticated users send gifts" ON public.gift_transactions;

-- Keep SELECT policy for public gift feed
-- (If there's a "Users can view gifts" policy, leave it)

-- ═══════════════════════════════════════════════════════════
-- FIX 3: live_rooms ALL policy lets creators overwrite stream credentials
-- Add BEFORE UPDATE trigger to protect server-controlled columns
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_live_rooms_stream_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only service_role can modify these columns
  IF auth.role() <> 'service_role' THEN
    IF NEW.stream_key IS DISTINCT FROM OLD.stream_key THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify stream_key directly';
    END IF;
    IF NEW.stream_uid IS DISTINCT FROM OLD.stream_uid THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify stream_uid directly';
    END IF;
    IF NEW.whip_url IS DISTINCT FROM OLD.whip_url THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify whip_url directly';
    END IF;
    IF NEW.whep_url IS DISTINCT FROM OLD.whep_url THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify whep_url directly';
    END IF;
    IF NEW.connection_state IS DISTINCT FROM OLD.connection_state THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify connection_state directly';
    END IF;
    IF NEW.rtv_earned_session IS DISTINCT FROM OLD.rtv_earned_session THEN
      RAISE EXCEPTION 'FORBIDDEN: cannot modify rtv_earned_session directly';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.protect_live_rooms_stream_columns() FROM PUBLIC, authenticated, anon;

CREATE TRIGGER trg_protect_live_rooms_columns
  BEFORE UPDATE ON public.live_rooms
  FOR EACH ROW EXECUTE FUNCTION public.protect_live_rooms_stream_columns();

-- ═══════════════════════════════════════════════════════════
-- FIX 4: Revoke direct execution of SECURITY DEFINER functions
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.prune_stale_stream_viewers() FROM PUBLIC, authenticated, anon;

-- ═══════════════════════════════════════════════════════════
-- FIX 5: Set search_path on flagged functions
-- ═══════════════════════════════════════════════════════════

ALTER FUNCTION public.transfer_rtv(UUID, UUID, REAL, TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.prune_stale_stream_viewers() SET search_path = public;
ALTER FUNCTION public.protect_live_rooms_stream_columns() SET search_path = public;

-- ═══════════════════════════════════════════════════════════
-- FIX 6: Add gift_transactions to realtime publication
-- Enables viewer-side gift overlays via postgres_changes
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after applying)
-- ═══════════════════════════════════════════════════════════

-- 1. transfer_rtv should NOT be executable by authenticated/anon
-- SELECT proacl FROM pg_proc WHERE proname = 'transfer_rtv';
-- Expected: only postgres/service_role entries

-- 2. gift_transactions should have NO client INSERT policy
-- SELECT polname FROM pg_policy WHERE polrelid = 'gift_transactions'::regclass;
-- Expected: no "Authenticated users send gifts" policy

-- 3. live_rooms trigger should exist
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'live_rooms'::regclass;
-- Expected: trg_protect_live_rooms_columns

-- 4. Attempt direct RPC call (should fail):
-- POST /rest/v1/rpc/transfer_rtv with anon key → 403/permission denied
