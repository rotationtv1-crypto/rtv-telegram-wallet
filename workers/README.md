# RotationTV Cloudflare Workers

Edge compute for the RotationTV ecosystem.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/telegram/webhook` | Telegram bot webhook |
| POST | `/v1/chat` | Direct AI chat |
| POST | `/v1/image` | Direct image generation |
| POST | `/v1/tts` | Direct TTS |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/ai <question>` | Chat with Venice AI |
| `/image <desc>` | Generate image |
| `/voice <text>` | Text to speech |
| `/moderate <text>` | Content moderation |
| `/wallet` | Check $RTV balance |
| `/help` | Show commands |

## Deploy

```bash
npm install
npx wrangler login
npx wrangler secret put VENICE_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler deploy
```

## Set Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://rotationtv-venice-ai.<ACCOUNT>.workers.dev/telegram/webhook"
```
