#!/usr/bin/env bash
# kimi-fetch.sh — Infrastructure Audit Suite
# Generates 8 output files: security advisors, ACLs, RLS, probes, edge functions, logs, schema, summary

set -euo pipefail

OUTPUT_DIR="${OUTPUT_DIR:-$(pwd)/fetch-output-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "${OUTPUT_DIR}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S']) ⚠${NC} $1"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S']) ✗${NC} $1"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S']) ℹ${NC} $1"; }

gen_01_security_advisors() {
  local f="${OUTPUT_DIR}/01-security-advisors.sql"
  cat > "$f" << 'EOF'
-- Check for tables without RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%' 
ORDER BY tablename;

-- Check for functions with PUBLIC execute
SELECT n.nspname AS schema, p.proname AS function, 
       pg_get_function_identity_arguments(p.oid) AS args,
       p.proacl::text AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proacl::text LIKE '%=X/%'
ORDER BY p.proname;

-- Check RLS policies per table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for exposed sensitive columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name ~* 'password|secret|token|key|private|seed|mnemonic'
  AND table_schema = 'public';
EOF
  log "01-security-advisors.sql → ${f}"
}

gen_02_function_acl() {
  local f="${OUTPUT_DIR}/02-function-acl.sql"
  cat > "$f" << 'EOF'
REVOKE ALL ON FUNCTION transfer_rtv(bigint, bigint, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION rtv_send_gift(bigint, bigint, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION request_payout(bigint, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_adjust_balance(bigint, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION mint_rtv(bigint, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION burn_rtv(bigint, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION transfer_rtv(bigint, bigint, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION rtv_send_gift(bigint, bigint, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION request_payout(bigint, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION admin_adjust_balance(bigint, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION mint_rtv(bigint, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION burn_rtv(bigint, numeric) TO service_role;
EOF
  log "02-function-acl.sql → ${f}"
}

gen_03_rls_policies() {
  local f="${OUTPUT_DIR}/03-rls-policies.sql"
  cat > "$f" << 'EOF'
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

CREATE POLICY IF NOT EXISTS "Users own their profile" 
ON users FOR ALL USING (telegram_id = current_setting('app.current_user_id')::bigint);
CREATE POLICY IF NOT EXISTS "Users see own wallet" 
ON wallets FOR ALL USING (telegram_id = current_setting('app.current_user_id')::bigint);
CREATE POLICY IF NOT EXISTS "Public can view live streams" 
ON streams FOR SELECT USING (status = 'live');
CREATE POLICY IF NOT EXISTS "Creator owns their stream" 
ON streams FOR UPDATE USING (creator_id = current_setting('app.current_user_id')::bigint);
EOF
  log "03-rls-policies.sql → ${f}"
}

gen_04_live_probes() {
  local f="${OUTPUT_DIR}/04-live-probes.sh"
  cat > "$f" << 'PROBES'
#!/usr/bin/env bash
BASE_URL="${1:-https://rotationtv-live-ai-clones.rotationtv.workers.dev}"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
pass=0; fail=0
check() {
  local method="$1"; local endpoint="$2"; local expect="$3"; local desc="$4"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")
  if [[ "$code" == "$expect" ]]; then echo -e "${GREEN}PASS${NC} $method $endpoint → $code ($desc)"; ((pass++));
  else echo -e "${RED}FAIL${NC} $method $endpoint → $code expected $expect ($desc)"; ((fail++)); fi
}
echo "=== RotationTV Live Security Probes ==="
check GET  "/api/health"                200 "Health check"
check GET  "/api/streams"               200 "Public streams"
check POST "/api/gifts/send"            401 "Gift send requires auth"
check GET  "/api/wallets/balance"       401 "Wallet requires auth"
check POST "/api/payouts/request"       401 "Payout requires auth"
check POST "/api/streams/create"        401 "Stream create requires auth"
check POST "/api/streams/999/end"       401 "Stream end requires auth"
check GET  "/api/admin/users"          403 "Admin blocked"
check POST "/api/admin/adjust-balance"  403 "Admin function blocked"
echo "=== Results: $pass passed, $fail failed ==="
[[ $fail -eq 0 ]] && exit 0 || exit 1
PROBES
  chmod +x "$f"; log "04-live-probes.sh → ${f}"
}

gen_05_edge_functions() {
  local f="${OUTPUT_DIR}/05-edge-functions.md"
  cat > "$f" << 'EOF'
# Edge Functions — Run: npx supabase functions list
## Key Functions: rotation-pay-gateway, create-payment, request-payout,
## go-live, create-stream-upload, cloudflare-stream-webhook,
## chainstack-node-gateway, command-center, team-auth, rtv-validator
EOF
  log "05-edge-functions.md → ${f}"
}

gen_06_logs_guide() {
  local f="${OUTPUT_DIR}/06-logs-guide.md"
  cat > "$f" << 'EOF'
# Logs Guide
## Supabase: npx supabase logs db --tail
## Workers: npx wrangler tail
## Edge Functions: npx supabase functions logs [name] --tail
EOF
  log "06-logs-guide.md → ${f}"
}

gen_07_schema_snapshot() {
  local f="${OUTPUT_DIR}/07-schema-snapshot.sql"
  cat > "$f" << 'EOF'
SELECT table_name, COUNT(column_name) AS cols FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name;
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
EOF
  log "07-schema-snapshot.sql → ${f}"
}

gen_08_summary() {
  local f="${OUTPUT_DIR}/08-summary-report.md"
  cat > "$f" << EOF
# Audit Summary — Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
## Status: ACTIVE_HEALTHY
## Next: Run 04-live-probes.sh, verify JWT-disabled functions, top up Venice AI if needed
EOF
  log "08-summary-report.md → ${f}"
}

main() {
  log "Kimi Fetch — Audit Suite"; log "Output: ${OUTPUT_DIR}"; echo ""
  gen_01_security_advisors; gen_02_function_acl; gen_03_rls_policies
  gen_04_live_probes; gen_05_edge_functions; gen_06_logs_guide
  gen_07_schema_snapshot; gen_08_summary
  echo ""; log "All 8 files in ${OUTPUT_DIR}"; ls -la "${OUTPUT_DIR}"
}
main "$@"
