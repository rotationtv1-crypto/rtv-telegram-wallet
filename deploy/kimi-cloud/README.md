# kimi-cloud Packaging (Docker + Kubernetes)

**Entity: Darrel-spell-living-trust**  
Primary production remains **Cloudflare Workers + wrangler**.  
This package enables hybrid / self-hosted / private-cloud / k8s runs of the same logic.

## Quick start (Docker)

```bash
# From repo root
docker build -f deploy/kimi-cloud/Dockerfile -t rtv-kimi-cloud:latest .

docker run --rm -p 8080:8080 \
  -e KIMI_API_KEY=$KIMI_API_KEY \
  -e TELEGRAM_BOT_TOKEN_6=$TELEGRAM_BOT_TOKEN_6 \
  -e TELEGRAM_BOT_TOKEN_7=$TELEGRAM_BOT_TOKEN_7 \
  rtv-kimi-cloud:latest

curl http://localhost:8080/api/kimi/health
```

## Kubernetes

```bash
# 1. Secret
cp deploy/kimi-cloud/k8s/secret.example.yaml /tmp/rtv-secret.yaml
# edit real values
kubectl apply -f /tmp/rtv-secret.yaml

# 2. Deploy + Service
kubectl apply -f deploy/kimi-cloud/k8s/deployment.yaml
kubectl apply -f deploy/kimi-cloud/k8s/service.yaml

# 3. Ingress + ACME (see deploy/acme/)
kubectl apply -f deploy/acme/cluster-issuer.yaml
kubectl apply -f deploy/acme/ingress.yaml

# 4. Test
kubectl port-forward svc/rtv-kimi-cloud 8080:80
curl http://localhost:8080/api/kimi/health
```

## Multi-bot credential isolation

- Each bot token lives in its own secret key (`TELEGRAM_BOT_TOKEN_6`, `_7`, …)
- `server.mjs` and `telegramCloudSdk.ts` never share tokens across bots
- Webhook path `/webhook/<botId>` maps to isolated token
- Never log or return token values

## Cloud SDK gaps
`src/lib/telegramCloudSdk.ts` already implements the full surface used by the orchestrator:
getUser, getChat, sendMessage, editMessage, deleteMessage, uploadFile, downloadFile,
invokeMethod, setWebAppMenuButton, setBotWebhook, getWebhookInfo, answerCallbackQuery,
answerPreCheckoutQuery, createStarsInvoice.

No remaining method gaps for Stars + multi-bot.

## Next
- When full Hono/Worker adapter is ready, replace the thin `server.mjs` with the real entry while keeping the same Dockerfile / probes.
- Multi-domain DNS + ACME via `deploy/multi-domain` + `deploy/acme`.
