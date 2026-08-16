# kimi-cloud Packaging

Container + Kubernetes packaging for the RotationTV worker (Kimi gateway, Stars, Telegram routes).

**Primary production path remains Cloudflare Workers + wrangler.**  
This package enables hybrid, self-hosted, or k8s runs ("kimi-cloud").

Entity: Darrel-spell-living-trust

## Quick start (Docker)

```bash
# From repo root
docker build -f deploy/kimi-cloud/Dockerfile -t rtv-kimi-cloud:latest .

docker run --rm -p 8080:8080 \
  -e KIMI_API_KEY=sk-... \
  -e TELEGRAM_BOT_TOKEN_6=... \
  rtv-kimi-cloud:latest

curl http://localhost:8080/api/kimi/health
```

The default CMD is a minimal health listener. For full routes, replace the entrypoint with your Hono/Node adapter or:

```bash
npx wrangler dev --local --port 8080
```

## Kubernetes

```bash
# 1. Create secret from example
cp deploy/kimi-cloud/k8s/secret.example.yaml /tmp/rtv-secret.yaml
# edit /tmp/rtv-secret.yaml with real keys
kubectl apply -f /tmp/rtv-secret.yaml

# 2. Deploy
kubectl apply -f deploy/kimi-cloud/k8s/deployment.yaml
kubectl apply -f deploy/kimi-cloud/k8s/service.yaml

# 3. Port-forward for test
kubectl port-forward svc/rtv-kimi-cloud 8080:80
curl http://localhost:8080/api/kimi/health
```

## Env vars (minimum)

| Variable | Required | Description |
|----------|----------|-------------|
| `KIMI_API_KEY` | Yes for Kimi routes | Moonshot API key |
| `TELEGRAM_BOT_TOKEN_6` | For main bot | Main bot token |
| `TELEGRAM_BOT_TOKEN_7` | For erotica | Erotica bot token |
| `PORT` | No (default 8080) | Listen port |

## Next steps

- Wire a real Node/Hono entry that imports `routeKimiRequest` + Stars handlers
- Add Ingress + cert-manager for ACME (see issue #12)
- Multi-domain: `api.` → this service, `app.` → WebApp, `bot.` → gateway

Related issues: #11 (this packaging), #12 (domains/ACME), #7 (WebApp hosting)
