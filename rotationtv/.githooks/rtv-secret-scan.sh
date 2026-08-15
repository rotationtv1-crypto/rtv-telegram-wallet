#!/usr/bin/env bash
# RTV custom secret scanner — blocks commit if any secret pattern is found
# Entity: Darrel-spell-living-trust

set -e

# Patterns to detect
PATTERNS=(
  # Telegram bot tokens: 8-12 digits : 35+ alphanumeric
  '[0-9]\{8,12\}:[A-Za-z0-9_-]\{35,\}'
  # Cloudflare API tokens
  'cfat_[A-Za-z0-9]\{20,\}'
  'cfut_[A-Za-z0-9]\{20,\}'
  # Supabase JWT
  'eyJ[A-Za-z0-9_-]\{20,\}\.[A-Za-z0-9_-]\{20,\}\.[A-Za-z0-9_-]\{20,\}'
  # Venice API keys
  'sk_V[0-9]_[A-Za-z0-9]\{20,\}'
  # Stripe keys
  'sk_live_[A-Za-z0-9]\{20,\}'
  'pk_live_[A-Za-z0-9]\{20,\}'
  # GitHub tokens
  'ghp_[A-Za-z0-9]\{30,\}'
  'gho_[A-Za-z0-9]\{30,\}'
  # Private keys
  'BEGIN.*PRIVATE KEY'
)

# Get staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -v -E '\.(lock|md)$' || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

FOUND=0
for file in $STAGED; do
  for pattern in "${PATTERNS[@]}"; do
    MATCH=$(git diff --cached "$file" | grep -E "^[\+\+]" | grep -E "$pattern" || true)
    if [ -n "$MATCH" ]; then
      echo "❌ BLOCKED: Secret pattern '$pattern' found in $file:"
      echo "   $MATCH" | head -3
      FOUND=1
    fi
  done
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "🚫 COMMIT REJECTED — Remove secrets before committing."
  echo "   Use env vars or wrangler secrets — never hardcode."
  echo ""
  exit 1
fi

exit 0
