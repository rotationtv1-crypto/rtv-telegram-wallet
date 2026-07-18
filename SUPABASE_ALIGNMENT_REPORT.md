# Supabase Full Alignment Report
**Generated:** 2026-07-16
**Projects:** rotationtvai-ecosystem (main) + Rotation Erotica

---

## 1. PROJECT STATUS

| Project | Ref | Status | Plan |
|---------|-----|--------|------|
| rotationtvai-ecosystem | xynkgaxfwvpcixissxdz | ACTIVE_HEALTHY | Pro ($25/mo) |
| Rotation Erotica | zzybjoowhkwuomnpixuy | ACTIVE_HEALTHY | Free (was nearly paused) |

---

## 2. MAIN PROJECT SCHEMA (80 tables)

### Naming Inconsistencies
- **PascalCase (no underscore):** AcademyCredit, AgencyRoster, CreatorPayout
- **PascalCase (with underscore):** Omni_Logs, RotationPay_Ledger
- **snake_case (standard):** 70 tables
- **Views (v_):** v_mint_by_provider, v_mint_dashboard, v_mint_stats, v_mint_volume_hourly, v_sovereign_ledger

### Duplicate / Overlapping Tables
| PascalCase Table | snake_case Equivalent | Action |
|-----------------|----------------------|--------|
| CreatorPayout (0 rows) | creator_payouts (0 rows) | DROP CreatorPayout — empty duplicate |
| AcademyCredit (0 rows) | user_credits (0 rows) | DROP AcademyCredit — empty duplicate |
| AgencyRoster (0 rows) | team_members (0 rows) | DROP AgencyRoster — empty duplicate |
| RotationPay_Ledger (6 rows) | rtv_ledger (0 rows) | MIGRATE 6 rows → rtv_ledger, then DROP |
| Omni_Logs (9 rows) | system_logs (554 rows) | MIGRATE 9 rows → system_logs, then DROP |

### Tables With Data
| Table | Rows | Key Data |
|-------|------|----------|
| system_logs | 554 | Stale upload cleanup events |
| Omni_Logs | 9 | Ledger init, Jetton master verified, Manus webhook |
| RotationPay_Ledger | 6 | First sale rewards, $RTVS handshake |
| telegram_bots | 3 | RTV Faucet Bot, RTV Support Bot, RTV University Bot |
| rtv_wallets | 1 | RotationtvBot wallet (100 RTV balance) |
| wallets | 1 | Sovereign TON wallet (1B RTVS, 0.052 TON) |
| wallet_transactions | 3+ | CONTRACT_DEPLOY + MINT events |

---

## 3. CRITICAL BUG: profiles RLS Infinite Recursion

### Root Cause
The "Admins can view all profiles" RLS policy queries the `profiles` table from within the policy itself:

```sql
-- PROBLEMATIC POLICY:
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

This triggers RLS on `profiles` → which evaluates the policy → which queries `profiles` → infinite recursion → HTTP 500.

### Fix (requires write access — use Supabase Dashboard SQL Editor)
```sql
-- Drop the recursive policy
DROP POLICY "Admins can view all profiles" ON profiles;

-- Replace with JWT-based check (no table query needed)
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.jwt() ->> 'user_role' = 'admin'
);

-- Alternative: use a SECURITY DEFINER function to break recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Then update policy:
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (public.is_admin());
```

---

## 4. ROTATION EROTICA SCHEMA (15 tables)

Clean snake_case naming. No duplicates detected.
- content_posts, content_unlocks, creator_profiles, follows, gifts, gift_transactions
- live_rooms, post_likes, profiles, reports, room_messages, rtv_transactions
- stream_viewers, subscriptions, telegram_identities

---

## 5. ALIGNMENT ACTION PLAN

### Phase 1: Fix RLS Bug (CRITICAL — blocks all profile queries)
1. Open Supabase Dashboard → SQL Editor
2. Run the fix script above (drop recursive policy, create JWT-based one)
3. Test: `SELECT * FROM profiles LIMIT 1;` should return without 500

### Phase 2: Prune Duplicate Tables
1. Migrate 6 rows from RotationPay_Ledger → rtv_ledger
2. Migrate 9 rows from Omni_Logs → system_logs
3. DROP empty tables: CreatorPayout, AcademyCredit, AgencyRoster
4. DROP migrated tables: RotationPay_Ledger, Omni_Logs
5. Result: 75 → 70 tables (all snake_case + 5 views)

### Phase 3: Standardize Remaining Tables
- All 70 tables should be snake_case
- Verify all tables have proper RLS policies (not recursive)
- Add missing RLS on tables that need it
- Create indexes on frequently queried columns

### Phase 4: Seed Data
- profiles table is EMPTY — needs at least the admin user
- telegram_bots has 3 bots but no token hashes set
- rtv_wallets has 1 wallet — needs proper seeding

---

## 6. SERVICE ROLE KEY — NOW ACCESSIBLE

The Supabase connector can retrieve the service_role key via Management API.
This key bypasses RLS and can be used for:
- Reading/writing any table via PostgREST
- Server-side operations in Cloudflare Workers
- Seeding data and fixing schemas

**To set as worker secret:**
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config workers/rtv-payments/wrangler.jsonc
```
