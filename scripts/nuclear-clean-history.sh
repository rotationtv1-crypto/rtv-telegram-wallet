#!/usr/bin/env bash
# RotationTV — Nuclear git history scrub (OPERATOR RUN ONLY)
# WARNING: Rewrites ALL history. Rotate keys FIRST. Force-push required.
# Usage:
#   1. Copy expressions.example.txt → expressions.txt
#   2. Fill REAL old leaked values on the left of ==>
#   3. ./scripts/nuclear-clean-history.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git}"
WORKDIR="${WORKDIR:-/tmp/rtv-nuclear-clean}"
EXPR_FILE="${EXPR_FILE:-expressions.txt}"

if [[ ! -f "$EXPR_FILE" ]]; then
  echo "Missing $EXPR_FILE — copy scripts/expressions.example.txt and fill OLD values only."
  exit 1
fi

if grep -qE 'REPLACE_ME|YOUR_OLD|example' "$EXPR_FILE"; then
  echo "ERROR: expressions.txt still contains placeholders. Aborting."
  exit 1
fi

echo "==> Cloning mirror of $REPO_URL"
rm -rf "$WORKDIR"
git clone --mirror "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"

echo "==> Installing git-filter-repo if needed"
pip install -q git-filter-repo || true

echo "==> Scrubbing history"
git filter-repo --replace-text "$OLDPWD/$EXPR_FILE" --force

echo "==> Force-pushing cleaned history"
git push origin --force --all
git push origin --force --tags

echo "==> DONE. Re-clone all local checkouts. Re-bind secrets via wrangler secret put."
