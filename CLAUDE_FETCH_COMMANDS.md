# CLAUDE FETCH COMMANDS — Rotation Erotica
# Run these in Claude's terminal after switching project context
# Project: zzybjoowhkwuomnpixuy
# Updated: 2026-07-06

---

## 1. Security Advisors

```
mcp_Supabase_get_advisors(type: "security")
```

**Expected results after hardening:**
- ✅ `transfer_rtv` NOT flagged as "executable by authenticated"
- ✅ `handle_new_user`, `prune_stale_stream_viewers` cleared
- ⚠️ `protect_live_rooms_stream_columns` may still show (trigger function — acceptable, errors outside trigger context)

---

## 2. Policy Inventory (SQL Editor)

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:**
- `gift_transactions` has NO INSERT policy (only SELECT)
- `live_rooms` has row-ownership policies + column trigger protection
- `AvatarCollection` has public read + self CRUD
- `AvatarSession` has self-only access

---

## 3. Function ACL Verification (SQL Editor)

```sql
SELECT proname, proacl::text
FROM pg_proc
WHERE proname IN (
  'transfer_rtv',
  'handle_new_user',
  'prune_stale_stream_viewers',
  'protect_live_rooms_stream_columns',
  'like_avatar'
)
ORDER BY proname;
```

**Expected:** Only `postgres` and `service_role` in ACL for all five. No `=X/authenticated` or `=X/anon` entries.

---

## 4. RLS Enabled Check (SQL Editor)

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** `rowsecurity = true` for ALL tables.

---

## 5. Edge Function Inventory

```
mcp_Supabase_list_functions()
```

**Expected:** `telegram-auth-bridge` listed and deployed.

---

## 6. Recent Logs

```bash
# Auth logs (check for brute force attempts)
mcp_Supabase_get_logs(service: "auth", limit: 50)

# Postgres logs (check for RLS bypass attempts)
mcp_Supabase_get_logs(service: "postgres", limit: 50)

# Edge function logs
mcp_Supabase_get_logs(service: "edge", limit: 50)
```

---

## 7. Apply Avatar Schema (if not yet applied)

Run in SQL Editor:
```sql
-- File: supabase/migrations-rotation-erotica/20260706_avatar_designer_schema.sql
-- Creates: AvatarSession, AvatarCollection, AvatarStyle, AvatarLike
-- + like_avatar function
-- + realtime publication
```

Copy the SQL from the repo file and paste into Supabase SQL Editor.

---

## 8. Verify Avatar Tables

```sql
SELECT count(*) FROM public."AvatarStyle";
```

**Expected:** 8 rows (seeded styles: cinematic, editorial, noir, cyberpunk, fantasy, glamour, street, retro).

---

## 9. Push Claude's 3 Commits

```bash
cd /path/to/rotationtv-ecosystem-audit-rnyh4a
git remote -v  # confirm origin
git push origin claude/rotationtv-ecosystem-audit-rnyh4a
```

If "repository not found":
```bash
git remote set-url origin https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git
git push origin claude/rotationtv-ecosystem-audit-rnyh4a
```

---

## 10. Post-Deploy Verification

```bash
chmod +x scripts/verify-rotation-erotica.sh
SUPABASE_ANON_KEY_EROTICA=<key> SUPABASE_SERVICE_KEY_EROTICA=<key> ./scripts/verify-rotation-erotica.sh
```

All 6 tests must pass before production traffic.
