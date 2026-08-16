#!/usr/bin/env bash
# Rotate Cloudflare API tokens (create new, optionally revoke old).
# Requires: ROTATION_CF_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
# Entity: Darrel-spell-living-trust
# Never echoes token values.

set -euo pipefail

: "${ROTATION_CF_API_TOKEN:?ROTATION_CF_API_TOKEN required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID required}"

API="https://api.cloudflare.com/client/v4"
AUTH_HEADER="Authorization: Bearer ${ROTATION_CF_API_TOKEN}"

echo "[cloudflare] Creating new API token with Workers + Account scope..."

# Minimal token template — adjust policies to least privilege for your account
CREATE_PAYLOAD=$(cat <<EOF
{
  "name": "rtv-rotated-$(date -u +%Y%m%d%H%M)",
  "policies": [
    {
      "effect": "allow",
      "resources": {
        "com.cloudflare.api.account.${CLOUDFLARE_ACCOUNT_ID}": "*"
      },
      "permission_groups": [
        { "id": "c8fed203ed3043cba015a93ad1616f1f" },
        { "id": "1a71c052dfc347e5a6e7f5ad45b4d7b8" }
      ]
    }
  ]
}
EOF
)

# Note: permission_groups IDs differ per account; list them first if create fails:
# curl -s -H "$AUTH_HEADER" "$API/user/tokens/permission_groups" | jq .

RESP=$(curl -sS -X POST "$API/user/tokens" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD" || true)

if echo "$RESP" | grep -q '"success":true'; then
  NEW_ID=$(echo "$RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
  echo "[cloudflare] New token created id=${NEW_ID}"
  echo "[cloudflare] VALUE is only in API response — copy once into vault / wrangler / GitHub secret"
  echo "[cloudflare] Then revoke previous token via dashboard or API"
  # Optional revoke of a known old token id:
  # curl -sS -X DELETE "$API/user/tokens/${OLD_TOKEN_ID}" -H "$AUTH_HEADER"
  exit 0
else
  echo "[cloudflare] Create failed or permission_groups need adjustment. Response (sanitized):"
  echo "$RESP" | sed 's/"value":"[^"]*"/"value":"***"/g' | head -c 500
  exit 1
fi
