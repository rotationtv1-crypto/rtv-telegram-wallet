#!/usr/bin/env bash
# Update GitHub Actions secrets via API.
# Requires: ROTATION_GITHUB_TOKEN (or GITHUB_TOKEN with secrets scope), REPO owner/name.
# Entity: Darrel-spell-living-trust
# Does not print secret values.

set -euo pipefail

OWNER="${GITHUB_REPOSITORY_OWNER:-rotationtv1-crypto}"
REPO="${GITHUB_REPOSITORY_NAME:-rtv-telegram-wallet}"
TOKEN="${ROTATION_GITHUB_TOKEN:-${GITHUB_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "[github] ROTATION_GITHUB_TOKEN or GITHUB_TOKEN required"
  exit 1
fi

# Example: set a secret named EXAMPLE_ROTATED from env EXAMPLE_ROTATED_VALUE
# In CI, pass values via workflow secrets / environment, never hardcode.

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "[github] skip $name (empty value)"
    return 0
  fi

  # Public key for encryption
  KEY_JSON=$(curl -sS -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets/public-key")

  KEY_ID=$(echo "$KEY_JSON" | sed -n 's/.*"key_id":"\([^"]*\)".*/\1/p')
  PUB_KEY=$(echo "$KEY_JSON" | sed -n 's/.*"key":"\([^"]*\)".*/\1/p')

  if [[ -z "$KEY_ID" || -z "$PUB_KEY" ]]; then
    echo "[github] failed to fetch public key"
    return 1
  fi

  # Encrypt with libsodium if available; otherwise require pre-encrypted or use gh cli
  if command -v gh >/dev/null 2>&1; then
    echo "$value" | gh secret set "$name" --repo "${OWNER}/${REPO}" --body - >/dev/null
    echo "[github] set $name via gh"
    return 0
  fi

  echo "[github] Install GitHub CLI (gh) for secret encryption, or encrypt manually with libsodium"
  echo "[github] public_key_id=$KEY_ID"
  return 1
}

# Wire real rotations here — values must come from secure env, never from this file.
# Example (uncomment when values are injected by CI):
# set_secret "CLOUDFLARE_API_TOKEN" "${NEW_CF_TOKEN:-}"
# set_secret "KIMI_API_KEY" "${NEW_KIMI_KEY:-}"

echo "[github] Ready. Provide NEW_* env vars and uncomment set_secret calls for production use."
exit 0
