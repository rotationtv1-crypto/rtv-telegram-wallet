#!/usr/bin/env bash
# ============================================================
# ROTATIONTV — DEPLOY FIRST AI ACTIVE HOST (LEO)
# Kicks off the very first AI-hosted broadcast segment before
# any human creator has gone live. Calls the deployed worker's
# Venice-powered host-lines route, which generates LEO's real
# opening script (his personality is pulled straight from the
# locked AI_HOSTS_CONFIG.js — nothing hardcoded per-run).
#
# Usage:
#   ./scripts/deploy-first-host.sh
#   HOST_ID=maya ./scripts/deploy-first-host.sh   # launch a different host
# ============================================================
set -euo pipefail

WORKER_URL="${WORKER_URL:-https://rotationtv-live-ai-clones.rotationtimmy.workers.dev}"
HOST_ID="${HOST_ID:-leo}"
TOPIC="${TOPIC:-RotationTV going live for the very first time}"

echo "════════════════════════════════════════════════════"
echo "  ROTATIONTV — LAUNCHING FIRST AI HOST: ${HOST_ID^^}"
echo "════════════════════════════════════════════════════"
echo ""
echo "→ Worker: $WORKER_URL"
echo "→ Host:   $HOST_ID"
echo "→ Topic:  $TOPIC"
echo ""

RESPONSE=$(curl -s "$WORKER_URL/api/venice/host-lines" \
  -H "Content-Type: application/json" \
  -d "{
    \"hostId\": \"$HOST_ID\",
    \"topic\": \"$TOPIC\",
    \"viewer_count\": 0,
    \"is_first_broadcast\": true,
    \"segment_number\": 1
  }")

SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS" != "True" ]; then
  echo "❌ Failed to generate opening script. Raw response:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Script generated successfully via Venice AI"
echo ""
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "────────────────────────────────────────────────────"
echo "NEXT STEP: feed this script into the render pipeline:"
echo "  1. HeyGen avatar (rotationtv/src/lib/heygenGateway.ts) for face + voice, OR"
echo "  2. AIHostEngine.speak() → ElevenLabs/OpenAI Realtime TTS (still stubbed)"
echo "  3. Go live via GoLiveModal, feed intro_line → lines → exit_line in sequence"
echo "────────────────────────────────────────────────────"
