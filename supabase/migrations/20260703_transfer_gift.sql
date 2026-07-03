-- ============================================================
-- TRANSFER_GIFT — Atomic gift transfer with revenue split
-- Security-definer: runs as DB owner, not caller
-- RotationTV Network LLC — Sovereign Architecture
-- ============================================================

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
  v_stream_gift_total INTEGER;
  v_result JSONB;
BEGIN
  -- Lock sender row
  SELECT rtv_balance INTO v_sender_balance
    FROM public.wallets
    WHERE telegram_id = p_sender_telegram_id
    FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient RTV balance');
  END IF;

  -- Get stream creator
  SELECT creator_id, gift_total INTO v_creator_id, v_stream_gift_total
    FROM public.streams
    WHERE id = p_stream_id
    FOR UPDATE;

  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stream not found');
  END IF;

  -- Revenue split: 80/15/5
  v_creator_share := FLOOR(p_amount * 0.80);
  v_platform_share := FLOOR(p_amount * 0.15);
  v_agency_share := p_amount - v_creator_share - v_platform_share;

  -- Deduct from sender
  UPDATE public.wallets
    SET rtv_balance = rtv_balance - p_amount
    WHERE telegram_id = p_sender_telegram_id;

  -- Credit creator
  UPDATE public.wallets
    SET rtv_balance = rtv_balance + v_creator_share
    WHERE telegram_id = v_creator_id;

  -- Update stream gift total
  UPDATE public.streams
    SET gift_total = (gift_total || 0) + p_amount
    WHERE id = p_stream_id;

  -- Log gift
  INSERT INTO public.gift_log (sender_id, stream_id, amount, token)
    VALUES (p_sender_telegram_id, p_stream_id, p_amount, p_token);

  -- Log transaction
  INSERT INTO public.wallet_transactions (telegram_id, type, amount, token, metadata)
    VALUES (
      p_sender_telegram_id,
      'gift',
      p_amount,
      p_token,
      jsonb_build_object(
        'stream_id', p_stream_id,
        'creator_id', v_creator_id,
        'creator_share', v_creator_share,
        'platform_share', v_platform_share,
        'agency_share', v_agency_share
      )
    );

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'creator_share', v_creator_share,
    'platform_share', v_platform_share,
    'agency_share', v_agency_share
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.transfer_gift(TEXT, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_gift(TEXT, UUID, INTEGER, TEXT) TO service_role;
