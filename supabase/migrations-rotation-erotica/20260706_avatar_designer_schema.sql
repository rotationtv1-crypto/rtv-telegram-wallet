-- ============================================================
-- Avatar Designer Schema — Rotation Erotica Project
-- Target: zzybjoowhkwuomnpixuy
-- Tables: AvatarSession, AvatarCollection, AvatarStyle
-- Date: 2026-07-06
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- Avatar Design Sessions (temporary — cleared after generation)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."AvatarSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'gender' CHECK (step IN ('gender','style','features','outfit','setting','generate')),
  params JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_avatar_session_user ON public."AvatarSession"(user_id);

ALTER TABLE public."AvatarSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_session_self" ON public."AvatarSession"
  FOR ALL TO authenticated USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- Avatar Collection (permanent — user's generated avatars)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."AvatarCollection" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female','male','nonbinary','anime','realistic')),
  style TEXT NOT NULL CHECK (style IN ('cinematic','editorial','noir','cyberpunk','fantasy','glamour','street','retro')),
  features TEXT,
  outfit TEXT,
  setting TEXT,
  image_url TEXT,
  image_storage_path TEXT,
  is_public BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_collection_user ON public."AvatarCollection"(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avatar_collection_public ON public."AvatarCollection"(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_avatar_collection_style ON public."AvatarCollection"(style, is_public) WHERE is_public = true;

ALTER TABLE public."AvatarCollection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_collection_self_read" ON public."AvatarCollection"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "avatar_collection_public_read" ON public."AvatarCollection"
  FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "avatar_collection_self_insert" ON public."AvatarCollection"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "avatar_collection_self_update" ON public."AvatarCollection"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "avatar_collection_self_delete" ON public."AvatarCollection"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- Avatar Styles Catalog (reference data)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."AvatarStyle" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  negative_prompt TEXT,
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public."AvatarStyle" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_style_public_read" ON public."AvatarStyle"
  FOR SELECT TO authenticated USING (true);

-- Seed avatar styles
INSERT INTO public."AvatarStyle" (slug, name, description, prompt_template, is_premium, sort_order) VALUES
('cinematic', 'Cinematic', 'Dramatic lighting, film grain, HBO quality', 'Cinematic portrait photography, dramatic lighting, film grain, shallow depth of field, editorial fashion, moody atmosphere', false, 1),
('editorial', 'Editorial', 'High fashion, Vogue-style', 'High fashion editorial, studio lighting, Vogue-style composition, clean background, professional retouching', false, 2),
('noir', 'Film Noir', 'High contrast B&W, shadows', 'Film noir style, high contrast black and white, dramatic shadows, mysterious atmosphere, 1940s aesthetic', false, 3),
('cyberpunk', 'Cyberpunk', 'Neon, futuristic, holographic', 'Cyberpunk aesthetic, neon lighting, futuristic cityscape, holographic elements, rain-slicked streets', true, 4),
('fantasy', 'Dark Fantasy', 'Ethereal, mystical, painterly', 'Dark fantasy, ethereal lighting, mystical elements, ornate details, painterly quality', true, 5),
('glamour', 'Glamour', 'Soft lighting, luxurious', 'Glamour photography, soft lighting, luxurious setting, elegant styling, magazine cover quality', false, 6),
('street', 'Street', 'Urban, natural, candid', 'Street photography, urban environment, natural lighting, candid feel, editorial edge', false, 7),
('retro', 'Retro', '70s/80s vintage film', 'Retro 70s/80s aesthetic, warm tones, vintage film look, nostalgic atmosphere', true, 8);

-- ═══════════════════════════════════════════════════════════
-- Avatar Likes (social engagement)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public."AvatarLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  avatar_id UUID NOT NULL REFERENCES public."AvatarCollection"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, avatar_id)
);

CREATE INDEX IF NOT EXISTS idx_avatar_like_avatar ON public."AvatarLike"(avatar_id);

ALTER TABLE public."AvatarLike" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatar_like_self" ON public."AvatarLike"
  FOR ALL TO authenticated USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- Function: Increment avatar likes
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.like_avatar(p_avatar_id UUID, p_user_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_liked BOOLEAN;
BEGIN
  -- Check if already liked
  SELECT EXISTS(SELECT 1 FROM public."AvatarLike" WHERE avatar_id = p_avatar_id AND user_id = p_user_id) INTO v_already_liked;

  IF v_already_liked THEN
    -- Unlike
    DELETE FROM public."AvatarLike" WHERE avatar_id = p_avatar_id AND user_id = p_user_id;
    UPDATE public."AvatarCollection" SET likes = GREATEST(likes - 1, 0) WHERE id = p_avatar_id;
    RETURN jsonb_build_object('status', 'unliked', 'avatar_id', p_avatar_id);
  ELSE
    -- Like
    INSERT INTO public."AvatarLike" (user_id, avatar_id) VALUES (p_user_id, p_avatar_id);
    UPDATE public."AvatarCollection" SET likes = likes + 1 WHERE id = p_avatar_id;
    RETURN jsonb_build_object('status', 'liked', 'avatar_id', p_avatar_id);
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.like_avatar(UUID, TEXT) FROM anon;

-- ═══════════════════════════════════════════════════════════
-- Add avatar tables to realtime publication
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public."AvatarCollection";
ALTER PUBLICATION supabase_realtime ADD TABLE public."AvatarLike";
