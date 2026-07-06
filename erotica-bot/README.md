# @RotationtvErotica_Bot

AI Avatar Designer + Cinematic Feed for the Rotation Erotica platform.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/avatar create` | Step-by-step avatar designer |
| `/avatar generate` | Quick generate with saved settings |
| `/feed` | Browse public avatar feed |
| `/profile` | Your avatar collection |
| `/wallet` | Check $RTV balance |
| `/subscribe` | Premium tier info |
| `/help` | Show all commands |

## Avatar Designer Flow

```
1. /avatar create → Pick gender (Female/Male/Non-Binary/Anime/Realistic)
2. Pick style (Cinematic/Editorial/Noir/Cyberpunk/Fantasy/Glamour/Street/Retro)
3. Describe features (hair, eyes, face)
4. Describe outfit (clothing, accessories)
5. Describe setting (background, mood)
6. 🎬 Venice z-image-turbo generates cinematic portrait
```

## Avatar Styles

| Style | Description | Premium |
|-------|-------------|---------|
| Cinematic | HBO-quality dramatic lighting | No |
| Editorial | Vogue-style fashion | No |
| Noir | High-contrast B&W shadows | No |
| Cyberpunk | Neon futuristic | Yes |
| Fantasy | Ethereal mystical | Yes |
| Glamour | Soft luxurious | No |
| Street | Urban candid | No |
| Retro | 70s/80s vintage | Yes |

## Deploy

```bash
npm install
npx wrangler login
npx wrangler secret put VENICE_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler deploy
```

## Set Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://rotationtv-erotica-bot.<ACCOUNT>.workers.dev/telegram/webhook"
```

## Architecture

```
Telegram User → Bot → Cloudflare Worker → Venice AI (z-image-turbo)
                                    ↓
                              Supabase (avatars + auth + $RTV)
```
