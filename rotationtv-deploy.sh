#!/usr/bin/env bash
# RotationTV Deploy Master — Menu-driven or CLI
# Usage: ./rotationtv-deploy.sh [fetch|push|deploy|verify|full|emergency]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/fetch-output-$(date +%Y%m%d-%H%M%S)"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S']) ℹ${NC} $1"; }

show_menu() {
  clear
  echo "═══════════════════════════════════════════════════"
  echo "  RotationTV Deploy Suite v1.0"
  echo "═══════════════════════════════════════════════════"
  echo ""
  echo "  1) fetch     — Full infrastructure audit"
  echo "  2) push      — Push commits (5 fallback methods)"
  echo "  3) deploy    — Deploy Cloudflare Workers"
  echo "  4) verify    — HTTP probes + security checks"
  echo "  5) full      — Push + Deploy staging + Verify"
  echo "  6) emergency — Create portable bundle"
  echo "  7) exit"
  echo ""
  echo "═══════════════════════════════════════════════════"
}

do_fetch() {
  log "Starting infrastructure audit..."
  export OUTPUT_DIR
  bash "${SCRIPT_DIR}/kimi-fetch.sh" "$@"
}

do_push() {
  log "Pushing commits with fallback methods..."
  bash "${SCRIPT_DIR}/deploy-full.sh" push
}

do_deploy() {
  log "Deploying Cloudflare Workers..."
  bash "${SCRIPT_DIR}/deploy-full.sh" deploy
}

do_verify() {
  log "Running verification probes..."
  bash "${SCRIPT_DIR}/deploy-full.sh" verify
}

do_full() {
  local env="${1:-staging}"
  log "FULL DEPLOY to ${env} starting..."
  do_push || { err "Push failed"; exit 1; }
  do_deploy || { err "Deploy failed"; exit 1; }
  do_verify || { err "Verify failed"; exit 1; }
  log "FULL DEPLOY to ${env} complete ✓"
}

do_emergency() {
  local bundle_dir="${SCRIPT_DIR}/emergency-bundle-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "${bundle_dir}"
  log "Creating emergency bundle at ${bundle_dir}..."
  
  git bundle create "${bundle_dir}/repo.bundle" --all 2>/dev/null || warn "No git repo found"
  cp -r "${SCRIPT_DIR}"/*.sh "${bundle_dir}/" 2>/dev/null || true
  cp -r "${SCRIPT_DIR}"/.*.example "${bundle_dir}/" 2>/dev/null || true
  
  cat > "${bundle_dir}/APPLY.sh" << 'EMERGENCYEOF'
#!/usr/bin/env bash
echo "RotationTV Emergency Apply"
echo "1. git clone from repo.bundle"
echo "2. Copy .env.rotationtv from vault"
echo "3. Run: ./rotationtv-deploy.sh full"
EMERGENCYEOF
  chmod +x "${bundle_dir}/APPLY.sh"
  
  tar czf "${bundle_dir}.tar.gz" -C "${bundle_dir%/*}" "$(basename "${bundle_dir}")"
  log "Emergency bundle ready: ${bundle_dir}.tar.gz"
}

CMD="${1:-}"
if [[ -z "$CMD" ]]; then
  show_menu
  read -rp "Select option [1-7]: " choice
  case $choice in
    1) CMD="fetch" ;;
    2) CMD="push" ;;
    3) CMD="deploy" ;;
    4) CMD="verify" ;;
    5) CMD="full" ;;
    6) CMD="emergency" ;;
    7) exit 0 ;;
    *) err "Invalid choice"; exit 1 ;;
  esac
fi

case "$CMD" in
  fetch)    do_fetch "${@:2}" ;;
  push)     do_push ;;
  deploy)   do_deploy ;;
  verify)   do_verify ;;
  full)     do_full "${2:-staging}" ;;
  emergency) do_emergency ;;
  *)        err "Unknown command: $CMD"; exit 1 ;;
esac
