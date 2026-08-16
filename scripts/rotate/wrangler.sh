#!/usr/bin/env bash
# Push rotated secrets into Cloudflare Workers via wrangler.
# Requires: CLOUDFLARE_API_TOKEN (or ROTATION_CF_API_TOKEN), wrangler installed.
# Entity: Darrel-spell-living-trust
# Values come from environment; never hardcoded.

set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "[wrangler] npx required"
  exit 1
fi

export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${ROTATION_CF_API_TOKEN:-}}"
if [[ -z "${CLOUDFLARE_API_TOKEN}" ]]; then
  echo "[wrangler] CLOUDFLARE_API_TOKEN or ROTATION_CF_API_TOKEN required"
  exit 1
fi

put_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "[wrangler] skip $name (empty)"
    return 0
  fi
  # Pipe value so it never appears in process list as argv
  echo "$value" | npx wrangler secret put "$name" >/dev/null
  echo "[wrangler] put $name"
}

# Inject from CI secrets / env after human or upstream rotation:
# put_secret "TELEGRAM_BOT_TOKEN_6" "${TELEGRAM_BOT_TOKEN_6:-}"
# put_secret "TELEGRAM_BOT_TOKEN_7" "${TELEGRAM_BOT_TOKEN_7:-}"
# put_secret "KIMI_API_KEY" "${KIMI_API_KEY:-}"
# put_secret "VENICE_API_KEY" "${VENICE_API_KEY_PRIMARY:-}"

echo "[wrangler] Template ready. Uncomment put_secret lines and supply env values in CI."
exit 0
