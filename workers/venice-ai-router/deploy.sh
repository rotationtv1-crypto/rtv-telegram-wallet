#!/bin/bash
# ============================================================
# Deploy Venice AI Worker to Cloudflare
# ============================================================

set -e

WORKER_NAME="rotationtv-venice-ai"
WORKER_DIR="workers/venice-ai-router"

echo "🧠 Deploying $WORKER_NAME..."

cd "$WORKER_DIR"

# Install dependencies
npm install

# Deploy worker
npx wrangler deploy

echo ""
echo "✅ Worker deployed!"
echo ""
echo "Next steps:"
echo "1. Set secrets:"
echo "   wrangler secret put VENICE_API_KEY"
echo "   wrangler secret put TELEGRAM_BOT_TOKEN"
echo "   wrangler secret put SUPABASE_URL"
echo "   wrangler secret put SUPABASE_SERVICE_KEY"
echo ""
echo "2. Set Telegram webhook:"
echo "   curl -s 'https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<WORKER>.<ACCOUNT>.workers.dev'"
echo ""
echo "3. Test: send /ai hello to your bot"
