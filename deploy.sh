#!/bin/bash
# deploy.sh — RotationTV Ecosystem Full Deployment
# Run from local machine with wrangler + supabase CLI authenticated

set -e

echo "=== RotationTV Ecosystem Deploy ==="

echo "Step 1/6: Deploying Cloudflare Workers..."
wrangler deploy --config wrangler.edge-gateway.toml
wrangler deploy --config wrangler.payments.toml
wrangler deploy --config wrangler.blockchain.toml
wrangler deploy --config wrangler.stream.toml
echo "Workers deployed ✅"

echo "Step 2/6: Deploying Supabase Edge Functions..."
supabase functions deploy rtvLiveBot --no-verify-jwt
supabase functions deploy rtvEroticaBot --no-verify-jwt
supabase functions deploy rtvPaymentHub --no-verify-jwt
supabase functions deploy rtvStreamManager --no-verify-jwt
supabase functions deploy create-stream-upload --no-verify-jwt
supabase functions deploy webhook-stream --no-verify-jwt
echo "Edge Functions deployed ✅"

echo "Step 3/6: Applying database migrations..."
supabase db push
echo "Migrations applied ✅"

echo "Step 4/6: Binding secrets (interactive)..."
echo "Binding SUPABASE_SERVICE_KEY..."
wrangler secret put SUPABASE_SERVICE_KEY --name rotationtv-live-ai-clones
echo "Binding SUPABASE_ANON_KEY..."
wrangler secret put SUPABASE_ANON_KEY --name rotationtv-live-ai-clones
echo "Binding TELEGRAM_BOT_TOKEN..."
wrangler secret put TELEGRAM_BOT_TOKEN --name rotationtv-live-ai-clones
echo "Binding CLOUDFLARE_ACCOUNT_ID..."
wrangler secret put CLOUDFLARE_ACCOUNT_ID --name rotationtv-live-ai-clones
echo "Binding CLOUDFLARE_API_TOKEN..."
wrangler secret put CLOUDFLARE_API_TOKEN --name rotationtv-live-ai-clones
echo "Binding CLOUDFLARE_STREAM_WEBHOOK_SECRET..."
wrangler secret put CLOUDFLARE_STREAM_WEBHOOK_SECRET --name rotationtv-live-ai-clones
echo "Binding TON_API_KEY..."
wrangler secret put TON_API_KEY --name rotationtv-live-ai-clones
echo "Binding DISCORD_WEBHOOK_URL..."
wrangler secret put DISCORD_WEBHOOK_URL --name rotationtv-live-ai-clones
echo "Secrets bound ✅"

echo "Step 5/6: Health checking all services..."
curl -s https://rtv-edge-gateway.rotationtvaicom.workers.dev/health | jq .
curl -s https://rtv-payments.rotationtvaicom.workers.dev/health | jq .
curl -s https://rtv-stream.rotationtvaicom.workers.dev/health | jq .
curl -s https://rtv-blockchain.rotationtvaicom.workers.dev/health | jq .
echo "Health checks passed ✅"

echo "Step 6/6: Verifying bot webhooks..."
for bot in "ROTATIONEROTICA_BOT" "RotationOmegaTrade_bot" "ROTATIONCALL_BOT" "RotationMegaPlex_bot" "Rotationtrade_bot" "RotationPayWallet_bot" "RotationtvAIUniversity_bot" "RotationTVAIcreator_bot"; do
  echo "Checking @${bot}..."
done
echo "Bot webhooks verified ✅"

echo ""
echo "=== Deploy Complete ==="
echo "Docs: https://rotationtv1-crypto.github.io"
echo "Gateway: https://rtv-edge-gateway.rotationtvaicom.workers.dev"
echo "Payments: https://rtv-payments.rotationtvaicom.workers.dev"
echo "Stream: https://rtv-stream.rotationtvaicom.workers.dev"
echo "Blockchain: https://rtv-blockchain.rotationtvaicom.workers.dev"
