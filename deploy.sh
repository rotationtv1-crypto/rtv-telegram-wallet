#!/bin/bash
# RTV Deployment Script — Deploys all Cloudflare Workers
# Usage: CLOUDFLARE_API_TOKEN=cfat_xxx ./deploy.sh

set -e

echo "🚀 RTV Sovereign Deployment Starting..."
echo ""

# Check token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set"
  exit 1
fi

export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID="7e431c541ea0f39d7f7fe5fd9f06eada"

# Deploy Edge Gateway
echo "📦 Deploying rtv-edge-gateway..."
npx wrangler deploy --config workers/rtv-edge-gateway/wrangler.jsonc 2>&1
echo "✅ Edge Gateway deployed"
echo ""

# Deploy Payments
echo "📦 Deploying rtv-payments..."
npx wrangler deploy --config workers/rtv-payments/wrangler.jsonc 2>&1
echo "✅ Payments deployed"
echo ""

# Deploy Blockchain
echo "📦 Deploying rtv-blockchain..."
npx wrangler deploy --config workers/rtv-blockchain/wrangler.jsonc 2>&1
echo "✅ Blockchain deployed"
echo ""

# Deploy Stream (was live but missing from this pipeline — source now canonical)
echo "📦 Deploying rtv-stream..."
npx wrangler deploy --config workers/rtv-stream/wrangler.jsonc 2>&1
echo "✅ Stream deployed"
echo ""

# NOTE: rtv-bot-console is live on Cloudflare but has NO source in this repo.
# It is deployed from a separate repo and is intentionally NOT handled here.

echo "🎉 All workers deployed!"
echo ""
echo "Endpoints:"
echo "  Edge Gateway:  https://rtv-edge-gateway.rotationtvaicom.workers.dev"
echo "  Payments:      https://rtv-payments.rotationtvaicom.workers.dev"
echo "  Blockchain:    https://rtv-blockchain.rotationtvaicom.workers.dev"
echo "  Stream:        https://rtv-stream.rotationtvaicom.workers.dev"
