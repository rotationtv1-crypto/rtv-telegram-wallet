#!/usr/bin/env bash
# Deploy Standalone Web App to Cloudflare Pages
# Entity: Darrel-spell-living-trust
set -euo pipefail

PROJECT="rtv-webapp"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "→ Building WebApp..."
cd "$ROOT/frontend"
npm ci
# Ensure web entry exists
if [[ ! -f web.html ]]; then
  cat > web.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RotationTV Web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/web/main.tsx"></script>
  </body>
</html>
EOF
fi

npm run build:web || npx vite build --config ../deploy/webapp/vite.web.config.ts

echo "→ Deploying to Cloudflare Pages ($PROJECT)..."
npx wrangler pages deploy dist-web --project-name="$PROJECT" --branch=main

echo "→ Done. Attach custom domain app.rotationtv.network in CF dashboard."
echo "   Set VITE_API_BASE=https://api.rotationtv.network in Pages env."
