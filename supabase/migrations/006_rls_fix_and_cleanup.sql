-- ============================================================
-- ROTATIONTV — SUPABASE RLS FIX & SCHEMA CLEANUP
-- Run in: Supabase Dashboard → SQL Editor
-- Project: xynkgaxfwvpcixissxdz (main RTV ecosystem)
-- Date: July 17, 2026
-- ============================================================

-- ============================================================
-- FIX 1: PROFILES TABLE RLS INFINITE RECURSION
-- ============================================================
-- The "Admins can view all profiles" policy queries `profiles`
-- FROM WITHIN the profiles RLS policy → infinite recursion → HTTP 500
-- Fix: Use JWT claim instead of querying the table

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'user_role' = 'admin'
  );

-- Also fix the UPDATE policy to allow admin updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'user_role' = 'admin');

-- ============================================================
-- FIX 2: CREATE SECURITY DEFINER FUNCTION FOR PROFILE LOOKUPS
-- ============================================================
-- This bypasses RLS for internal service calls
-- (e.g., worker checking if a user is admin)

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = user_id;
$$;

-- ============================================================
-- FIX 3: SEED ADMIN PROFILE
-- ============================================================
-- Insert the platform admin user (replace UUID with your auth.uid)
-- Run this AFTER creating your auth user via Supabase Auth

INSERT INTO profiles (id, email, full_name, role, plan, is_active, content_tier)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with your auth user ID
  'rotationtimmy@gmail.com',
  'Timothy Robert',
  'admin',
  'enterprise',
  true,
  'premium'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIX 4: PRUNE DUPLICATE PASCALCASE TABLES
-- ============================================================
-- These 5 PascalCase tables duplicate snake_case tables
-- Migrate data first, then drop

-- 4a. Migrate RotationPay_Ledger → rtv_ledger
INSERT INTO rtv_ledger (
  user_id, amount, asset, status, message, metadata, created_at
)
SELECT
  user_id::text,
  amount,
  asset,
  status,
  message,
  metadata,
  created_at
FROM "RotationPay_Ledger"
WHERE NOT EXISTS (
  SELECT 1 FROM rtv_ledger r
  WHERE r.created_at = "RotationPay_Ledger".created_at
  AND r.amount = "RotationPay_Ledger".amount
);

-- 4b. Migrate Omni_Logs → system_logs
INSERT INTO system_logs (event, status, metadata, created_at)
SELECT
  event_type,
  severity,
  payload::jsonb,
  created_at
FROM "Omni_Logs"
WHERE NOT EXISTS (
  SELECT 1 FROM system_logs s
  WHERE s.created_at = "Omni_Logs".created_at
);

-- 4c. Drop empty duplicates (verify 0 rows first!)
DO $$
DECLARE
  c1 int; c2 int; c3 int;
BEGIN
  SELECT COUNT(*) INTO c1 FROM "CreatorPayout";
  SELECT COUNT(*) INTO c2 FROM "AcademyCredit";
  SELECT COUNT(*) INTO c3 FROM "AgencyRoster";

  IF c1 = 0 THEN
    DROP TABLE IF EXISTS "CreatorPayout" CASCADE;
    RAISE NOTICE 'Dropped CreatorPayout (empty)';
  ELSE
    RAISE NOTICE 'CreatorPayout has % rows — migrate first', c1;
  END IF;

  IF c2 = 0 THEN
    DROP TABLE IF EXISTS "AcademyCredit" CASCADE;
    RAISE NOTICE 'Dropped AcademyCredit (empty)';
  ELSE
    RAISE NOTICE 'AcademyCredit has % rows — migrate first', c2;
  END IF;

  IF c3 = 0 THEN
    DROP TABLE IF EXISTS "AgencyRoster" CASCADE;
    RAISE NOTICE 'Dropped AgencyRoster (empty)';
  ELSE
    RAISE NOTICE 'AgencyRoster has % rows — migrate first', c3;
  END IF;
END $$;

-- 4d. Drop migrated tables (after data is safe in snake_case tables)
-- Uncomment after verifying migration success
-- DROP TABLE IF EXISTS "RotationPay_Ledger" CASCADE;
-- DROP TABLE IF EXISTS "Omni_Logs" CASCADE;

-- ============================================================
-- FIX 5: CREATE TRIGGER FOR AUTO-NEW-USER PROFILE
-- ============================================================
-- Auto-create a profile row when a new auth user signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    'free',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VERIFICATION QUERIES (run after fixes)
-- ============================================================
-- Check RLS no longer recurses:
--   SELECT * FROM profiles LIMIT 1;
--   (should return rows without 500 error when authenticated)
--
-- Check tables count:
--   SELECT COUNT(*) FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace;
--
-- Check policies count:
--   SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
