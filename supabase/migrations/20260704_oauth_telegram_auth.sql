-- ============================================================
-- RotationTV — Supabase OAuth + Telegram Auth
-- Enables Telegram login for Mini App + Web Dashboard
-- Date: 2026-07-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- Telegram Auth State (for OAuth flow)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."TelegramAuthState" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  auth_date BIGINT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  supabase_user_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_auth_telegram_id ON public."TelegramAuthState"(telegram_id) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_tg_auth_expires ON public."TelegramAuthState"(expires_at) WHERE is_verified = false;

-- ═══════════════════════════════════════════════════════════
-- OAuth Tokens (for connected services)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."OAuthToken" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  provider TEXT NOT NULL CHECK (provider IN ('telegram','google','github','discord','twitter','tiktok','instagram')),
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON public."OAuthToken"(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON public."OAuthToken"(provider, provider_user_id);

-- ═══════════════════════════════════════════════════════════
-- Session Management
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."UserSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public."RtvUser"(id),
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_token ON public."UserSession"(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_session_user ON public."UserSession"(user_id, is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public."TelegramAuthState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OAuthToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tg_auth_self_read" ON public."TelegramAuthState"
  FOR SELECT TO authenticated USING (telegram_id = (SELECT telegram_id FROM public."RtvUser" WHERE id = auth.uid()::text));
CREATE POLICY "tg_auth_service_insert" ON public."TelegramAuthState"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tg_auth_service_update" ON public."TelegramAuthState"
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "oauth_self_read" ON public."OAuthToken"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "oauth_self_insert" ON public."OAuthToken"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "oauth_self_update" ON public."OAuthToken"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "oauth_self_delete" ON public."OAuthToken"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "session_self_read" ON public."UserSession"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "session_self_insert" ON public."UserSession"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "session_self_update" ON public."UserSession"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "session_self_delete" ON public."UserSession"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- Functions: Telegram Login Verification
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.verify_telegram_login(
  p_id BIGINT,
  p_first_name TEXT,
  p_last_name TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_auth_date BIGINT,
  p_hash TEXT,
  p_bot_token TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_check_string TEXT;
  v_secret_key TEXT;
  v_computed_hash TEXT;
  v_user_id TEXT;
  v_session_token TEXT;
  v_result JSONB;
BEGIN
  -- Step 1: Compute SHA256 of bot token
  v_secret_key := encode(digest(p_bot_token, 'sha256'), 'hex');

  -- Step 2: Build check string (sorted alphabetically)
  v_check_string := concat_ws('\n',
    'auth_date=' || p_auth_date,
    'first_name=' || COALESCE(p_first_name, ''),
    'id=' || p_id,
    CASE WHEN p_last_name IS NOT NULL THEN 'last_name=' || p_last_name END,
    CASE WHEN p_photo_url IS NOT NULL THEN 'photo_url=' || p_photo_url END,
    CASE WHEN p_username IS NOT NULL THEN 'username=' || p_username END
  );

  -- Step 3: Compute HMAC-SHA256
  v_computed_hash := encode(hmac(v_check_string::bytea, v_secret_key::bytea, 'sha256'), 'hex');

  -- Step 4: Verify hash
  IF v_computed_hash != p_hash THEN
    RETURN jsonb_build_object('status', 'invalid', 'error', 'Hash verification failed');
  END IF;

  -- Step 5: Check auth_date (must be within 24 hours)
  IF extract(epoch from now()) - p_auth_date > 86400 THEN
    RETURN jsonb_build_object('status', 'expired', 'error', 'Auth data too old');
  END IF;

  -- Step 6: Find or create user
  SELECT id INTO v_user_id FROM public."RtvUser" WHERE telegram_id = p_id;

  IF v_user_id IS NULL THEN
    INSERT INTO public."RtvUser" (id, telegram_id, username, display_name, avatar_url, role, rtv_balance)
    VALUES (
      'tg_' || p_id,
      p_id,
      p_username,
      COALESCE(p_first_name, 'User_' || p_id),
      p_photo_url,
      'viewer',
      0
    )
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE public."RtvUser" SET
      username = COALESCE(p_username, username),
      display_name = COALESCE(p_first_name, display_name),
      avatar_url = COALESCE(p_photo_url, avatar_url),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Step 7: Create session
  v_session_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public."UserSession" (user_id, session_token, expires_at)
  VALUES (v_user_id, v_session_token, now() + interval '30 days');

  -- Step 8: Record auth state
  INSERT INTO public."TelegramAuthState" (telegram_id, auth_date, first_name, last_name, username, photo_url, hash, is_verified, supabase_user_id, expires_at)
  VALUES (p_id, p_auth_date, p_first_name, p_last_name, p_username, p_photo_url, p_hash, true, 
    (SELECT id FROM auth.users WHERE id = auth.uid()), now() + interval '1 hour');

  RETURN jsonb_build_object(
    'status', 'verified',
    'user_id', v_user_id,
    'session_token', v_session_token,
    'telegram_id', p_id,
    'username', p_username,
    'display_name', p_first_name
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.verify_telegram_login FROM anon;

-- ═══════════════════════════════════════════════════════════
-- Function: Link OAuth Provider
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.link_oauth_provider(
  p_user_id TEXT,
  p_provider TEXT,
  p_provider_user_id TEXT,
  p_access_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_scope TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  INSERT INTO public."OAuthToken" (user_id, provider, provider_user_id, access_token, refresh_token, scope, expires_at)
  VALUES (p_user_id, p_provider, p_provider_user_id, p_access_token, p_refresh_token, p_scope, p_expires_at)
  ON CONFLICT (provider, provider_user_id) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    scope = EXCLUDED.scope,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO v_token_id;

  -- Audit
  INSERT INTO public."OmegaAuditLog" (actor_id, action_type, resource_type, resource_id, metadata)
  VALUES (p_user_id, 'oauth_link', p_provider, p_provider_user_id, '{"action":"link"}'::jsonb);

  RETURN jsonb_build_object('status', 'linked', 'token_id', v_token_id, 'provider', p_provider);
END; $$;

REVOKE EXECUTE ON FUNCTION public.link_oauth_provider FROM anon;

-- ═══════════════════════════════════════════════════════════
-- Function: Validate Session
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_session public."UserSession";
  v_user public."RtvUser";
BEGIN
  SELECT * INTO v_session FROM public."UserSession"
  WHERE session_token = p_session_token AND is_active = true AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  UPDATE public."UserSession" SET last_activity = now() WHERE id = v_session.id;

  SELECT * INTO v_user FROM public."RtvUser" WHERE id = v_session.user_id;

  RETURN jsonb_build_object(
    'status', 'valid',
    'user_id', v_user.id,
    'telegram_id', v_user.telegram_id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'role', v_user.role,
    'rtv_balance', v_user.rtv_balance,
    'is_admin', v_user.is_admin
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.validate_session FROM anon;
