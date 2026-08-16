#!/usr/bin/env bash
# RotationTV — Nuclear history scrub helper
# Entity: Darrel-spell-living-trust
#
# Usage:
#   1. Create expressions.txt with real leaked values (old==>REMOVED_...)
#   2. ./scripts/scrub-history.sh /path/to/expressions.txt
#
# This script clones a mirror, runs git-filter-repo, then prints the force-push commands.
# It does NOT push automatically (safety).

set -euo pipefail

EXPRESSIONS="${1:-}"
if [[ -z "$EXPRESSIONS" || ! -f "$EXPRESSIONS" ]]; then
  echo "Usage: $0 /path/to/expressions.txt"
  echo "Create expressions.txt first (see docs/SECURITY-SECRET-SCRUB.md)"
  exit 1
fi

if ! command -v git-filter-repo &>/dev/null; then
  echo "Install git-filter-repo: pip install git-filter-repo"
  exit 1
fi

REPO_URL="https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git"
WORK_DIR="$(mktemp -d)/rtv-scrub"

echo "[1/4] Cloning mirror into $WORK_DIR"
git clone --mirror "$REPO_URL" "$WORK_DIR"
cd "$WORK_DIR"

echo "[2/4] Running git filter-repo --replace-text"
git filter-repo --replace-text "$EXPRESSIONS" --force

echo "[3/4] Quick verification (common patterns)"
if git log --all -p 2>/dev/null | grep -E 'sk-[a-zA-Z0-9]{20,}|[0-9]{8,10}:[A-Za-z0-9_-]{35}' | head -5; then
  echo "WARNING: Possible remaining token-like strings. Review manually."
else
  echo "No obvious high-entropy token patterns found in recent scan."
fi

echo "[4/4] Ready for force-push. Review, then run:"
echo ""
echo "  cd $WORK_DIR"
echo "  git remote add origin $REPO_URL   # if needed"
echo "  git push origin --force --all"
echo "  git push origin --force --tags"
echo ""
echo "After push: ROTATE EVERY SECRET that was scrubbed."
echo "Then force all collaborators to re-clone."
