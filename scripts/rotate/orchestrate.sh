#!/usr/bin/env bash
# RotationTV — Key rotation orchestrator
# Entity: Darrel-spell-living-trust
# Never prints secret values.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AUDIT="${ROOT}/rotation-audit.log"
DRY_RUN=false
PROVIDERS=""

log() {
  local msg="$(date -u +%Y-%m-%dT%H:%M:%SZ) | $*"
  echo "$msg"
  echo "$msg" >> "$AUDIT"
}

usage() {
  cat <<EOF
Usage: $0 [--dry-run] [--providers=cloudflare,github,wrangler,telegram,venice] [--all]

Examples:
  $0 --dry-run
  $0 --providers=cloudflare,wrangler
  $0 --all
EOF
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --all) PROVIDERS="cloudflare,github,wrangler,telegram,venice" ;;
    --providers=*) PROVIDERS="${arg#--providers=}" ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $arg"; usage ;;
  esac
done

if [[ -z "$PROVIDERS" ]]; then
  echo "Specify --providers=... or --all"
  usage
fi

IFS=',' read -ra LIST <<< "$PROVIDERS"

log "START | dry_run=$DRY_RUN | providers=$PROVIDERS | by=${USER:-ci}"

for p in "${LIST[@]}"; do
  p="$(echo "$p" | tr -d ' ')"
  case "$p" in
    cloudflare)
      if [[ "$DRY_RUN" == true ]]; then
        log "cloudflare | dry-run | would create new API token + revoke old"
      else
        if [[ -x "$ROOT/scripts/rotate/cloudflare.sh" ]]; then
          "$ROOT/scripts/rotate/cloudflare.sh" && log "cloudflare | success" || log "cloudflare | failure"
        else
          log "cloudflare | skipped | script missing"
        fi
      fi
      ;;
    github)
      if [[ "$DRY_RUN" == true ]]; then
        log "github | dry-run | would update repository secrets via API"
      else
        if [[ -x "$ROOT/scripts/rotate/github-secrets.sh" ]]; then
          "$ROOT/scripts/rotate/github-secrets.sh" && log "github | success" || log "github | failure"
        else
          log "github | skipped | script missing"
        fi
      fi
      ;;
    wrangler)
      if [[ "$DRY_RUN" == true ]]; then
        log "wrangler | dry-run | would wrangler secret put for worker bindings"
      else
        if [[ -x "$ROOT/scripts/rotate/wrangler.sh" ]]; then
          "$ROOT/scripts/rotate/wrangler.sh" && log "wrangler | success" || log "wrangler | failure"
        else
          log "wrangler | skipped | script missing"
        fi
      fi
      ;;
    telegram)
      log "telegram | pending_human | open @BotFather → revoke → new token → wrangler secret put TELEGRAM_BOT_TOKEN_* → re-set webhooks"
      if [[ -n "${ROTATION_NOTIFY_WEBHOOK:-}" ]]; then
        curl -sS -X POST "$ROTATION_NOTIFY_WEBHOOK" \
          -H 'Content-Type: application/json' \
          -d '{"text":"RTV rotation: Telegram bot tokens require human step via @BotFather. See docs/KEY-ROTATION.md"}' \
          >/dev/null || true
      fi
      ;;
    venice)
      if [[ "$DRY_RUN" == true ]]; then
        log "venice | dry-run | would cycle PRIMARY/SECONDARY/TERTIARY"
      else
        log "venice | pending_config | update VENICE_API_KEY_* order in workers + registry (no auto-revoke API)"
      fi
      ;;
    *)
      log "$p | unknown_provider | skipped"
      ;;
  esac
done

log "END | completed"
echo "Audit written to $AUDIT"
