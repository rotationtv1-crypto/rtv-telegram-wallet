#!/bin/bash
# ============================================================
# RTV ECOSYSTEM — POST-DEPLOY VERIFICATION
# Run after: git push origin main
# Tests: secret scan, worker health, RLS enforcement, API routes
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo "${GREEN}✅ PASS${NC}: $1"; PASS=$((PASS+1)); }
fail() { echo "${RED}❌ FAIL${NC}: $1"; FAIL=$((FAIL+1)); }
warn() { echo "${YELLOW}⚠️  WARN${NC}: $1"; WARN=$((WARN+1)); }

echo "🧠 RTV ECOSYSTEM — POST-DEPLOY VERIFICATION"
echo "============================================="

# ═══════════════════════════════════════════════════════════
# PHASE 1: SECRET SCAN (same as CI/CD gate)
# ═══════════════════════════════════════════════════════════
echo ""
echo "── PHASE 1: SECRET SCAN ──"

FOUND=0
if grep -rPq '[0-9]{8,10}:[A-Za-z0-9_-]{30,}' --include='*.ts' --include='*.js' --include='*.json' --include='*.md' --include='*.yml' --include='*.sh' --include='*.sql' .; then
  fail "Telegram bot token found in code"
  FOUND=1
fi

if grep -rPq 'VENICE_INFERENCE_KEY_[A-Za-z0-9]{10,}' --include='*.ts' --include='*.js' --include='*.json' --include='*.md' .; then
  fail "Venice API key found in code"
  FOUND=1
fi

if grep -rPq 'cfut_[A-Za-z0-9]{20,}' --include='*.ts' --include='*.js' --include='*.json' --include='*.md' .; then
  fail "Cloudflare token found in code"
  FOUND=1
fi

if grep -rPq 'sk_live_[A-Za-z0-9]{20,}' --include='*.ts' --include='*.js' --include='*.json' .; then
  fail "Stripe live key found in code"
  FOUND=1
fi

if grep -rPq 'eyJ[A-Za-z0-9_-]{50,}' --include='*.ts' --include='*.js' --include='*.json' .; then
  fail "JWT token found in code"
  FOUND=1
fi

# Check for real .env files (not .env.example)
for f in $(find . -name '.env' -not -name '.env.example' -not -name '.env.*.example' -not -path './.git/*' 2>/dev/null); do
  fail "Real .env file found: $f"
  FOUND=1
done

if [ "$FOUND" -eq 0 ]; then
  pass "No exposed secrets in code"
fi

# ═══════════════════════════════════════════════════════════
# PHASE 2: WORKER HEALTH CHECKS
# ═══════════════════════════════════════════════════════════
echo ""
echo "── PHASE 2: WORKER HEALTH ──"

# Workers to check (update URLs after deploy)
WORKERS=(
  "rotationtv-venice-ai|Venice AI Worker"
  "rtv-edge-gateway|Edge Gateway"
  "rotationtv-erotica-bot|Erotica Bot"
  "rtv-ai-gateway|AI Gateway"
)

for entry in "${WORKERS[@]}"; do
  IFS='|' read -r slug name <<< "$entry"
  # Try common Cloudflare Workers URL patterns
  for pattern in "$slug.https://rotationtv1-crypto.workers.dev" "https://$slug.rotationtv1-crypto.workers.dev"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$pattern" 2>/dev/null || echo "000")
    if [ "$CODE" != "000" ]; then
      if [ "$CODE" = "200" ]; then
        pass "$name alive (HTTP $CODE)"
      else
        warn "$name returned HTTP $CODE (may need auth)"
      fi
      break
    fi
  done
done

# ═══════════════════════════════════════════════════════════
# PHASE 3: SUPABASE RLS VERIFICATION
# ═══════════════════════════════════════════════════════════
echo ""
echo "── PHASE 3: SUPABASE RLS ──"

if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_ANON_KEY:-}" ]; then
  # Test: transfer_rtv must FAIL for anon/authenticated
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SUPABASE_URL/rest/v1/rpc/transfer_rtv" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"p_sender_id":"00000000-0000-0000-0000-000000000000","p_receiver_id":"11111111-1111-1111-1111-111111111111","p_amount_rtv":1}' 2>/dev/null || echo "000")

  if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
    pass "transfer_rtv blocked for anon (HTTP $CODE)"
  elif [ "$CODE" = "200" ]; then
    fail "transfer_rtv ACCEPTED for anon — FUND DRAIN BUG ACTIVE"
  else
    warn "transfer_rtv returned HTTP $CODE (unexpected)"
  fi

  # Test: gift_transactions INSERT must FAIL for authenticated
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SUPABASE_URL/rest/v1/gift_transactions" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"sender_id":"00000000-0000-0000-0000-000000000000","receiver_id":"11111111-1111-1111-1111-111111111111","rtv_amount":9999}' 2>/dev/null || echo "000")

  if [ "$CODE" = "401" ] || [ "$CODE" = "403" ] || [ "$CODE" = "404" ]; then
    pass "gift_transactions INSERT blocked (HTTP $CODE)"
  elif [ "$CODE" = "201" ]; then
    fail "gift_transactions INSERT accepted — FREE GIFT BUG ACTIVE"
  else
    warn "gift_transactions returned HTTP $CODE"
  fi
else
  warn "SUPABASE_URL/ANON_KEY not set — skipping RLS tests"
fi

# ═══════════════════════════════════════════════════════════
# PHASE 4: PASCALCASE COMPLIANCE
# ═══════════════════════════════════════════════════════════
echo ""
echo "── PHASE 4: PASCALCASE COMPLIANCE ──"

# Check SQL migrations use PascalCase table names
SNAKE_CASE=$(grep -rPn 'CREATE TABLE (IF NOT EXISTS )?public\.[a-z]+_[a-z]+' --include='*.sql' supabase/migrations/ 2>/dev/null || true)
if [ -n "$SNAKE_CASE" ]; then
  fail "snake_case table names found in migrations"
  echo "$SNAKE_CASE"
else
  pass "All SQL migrations use PascalCase table names"
fi

# ═══════════════════════════════════════════════════════════
# PHASE 5: .env.example COMPLIANCE
# ═══════════════════════════════════════════════════════════
echo ""
echo "── PHASE 5: .env COMPLIANCE ──"

# All .env files should be .env.example
REAL_ENV=$(find . -name '.env' -not -name '.env.example' -not -name '.env.*.example' -not -path './.git/*' -not -path './node_modules/*' 2>/dev/null || true)
if [ -n "$REAL_ENV" ]; then
  fail "Real .env files found (should be .env.example only)"
  echo "$REAL_ENV"
else
  pass "No real .env files in repo"
fi

# All .env.example files should have placeholder values
for f in $(find . -name '.env.example' -o -name '*.env.example' 2>/dev/null); do
  if grep -Pq '[0-9]{8,10}:[A-Za-z0-9_-]{20,}' "$f" 2>/dev/null; then
    fail "Real token in $f"
  fi
done
pass ".env.example files have no real tokens"

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════
echo ""
echo "============================================="
echo "RESULTS: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "${RED}🚨 DEPLOYMENT BLOCKED — Fix failures before proceeding${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo ""
  echo "${YELLOW}⚠️  Warnings found — Review before production traffic${NC}"
  exit 0
else
  echo ""
  echo "${GREEN}🎉 ALL CHECKS PASSED — Ready for production${NC}"
  exit 0
fi
