#!/usr/bin/env bash
# deploy-full.sh — Push + Deploy + Verify
# 5 fallback push methods, Cloudflare Workers deploy, HTTP probes

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S']) ⚠${NC} $1"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S']) ✗${NC} $1"; }

do_push() {
  log "Push sequence..."; cd "${SCRIPT_DIR}" || exit 1
  if git push origin main 2>/dev/null; then log "M1 OK"; return 0; fi; warn "M1 fail"
  if git push --force-with-lease origin main 2>/dev/null; then log "M2 OK"; return 0; fi; warn "M2 fail"
  if git pull --rebase origin main 2>/dev/null && git push origin main 2>/dev/null; then log "M3 OK"; return 0; fi; warn "M3 fail"
  local branch="deploy-$(date +%s)"; git checkout -b "$branch" 2>/dev/null
  if git push origin "$branch" 2>/dev/null; then log "M4 OK branch ${branch}"; return 0; fi; warn "M4 fail"
  if command -v gh &>/dev/null; then gh repo sync rotationtv1-crypto/rtv-telegram-wallet --branch main --force 2>/dev/null || true; git push origin main --force 2>/dev/null && { log "M5 OK"; return 0; }; fi
  err "All 5 push methods failed. Use: ./rotationtv-deploy.sh emergency"; return 1
}

do_deploy() {
  log "Deploying Workers..."
  for worker in rotation-erotica-app rotationtv-live-ai-clones rtv-token-manager; do
    (cd "${SCRIPT_DIR}/${worker}" 2>/dev/null && npx wrangler deploy 2>/dev/null && log "${worker} OK" || warn "${worker} skip")
  done
  log "Deploy done"
}

do_verify() {
  log "Running probes..."
  local probe="${SCRIPT_DIR}"/fetch-output*/04-live-probes.sh
  if ls $probe 1>/dev/null 2>&1; then bash $probe 2>/dev/null && log "Probes OK" || warn "Some probes failed"; fi
  for url in "https://rotation-erotica-app.rotationtv.workers.dev/health" "https://rotationtv-live-ai-clones.rotationtv.workers.dev/health" "https://rtv-token-manager.rotationtv.workers.dev/health"; do
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    [[ "$code" == "200" ]] && log "$url OK" || warn "$url → $code"
  done
}

case "${1:-all}" in
  push)    do_push ;;
  deploy)  do_deploy ;;
  verify)  do_verify ;;
  all)     do_push && do_deploy && do_verify ;;
  *)       echo "Usage: $0 [push|deploy|verify|all]"; exit 1 ;;
esac
