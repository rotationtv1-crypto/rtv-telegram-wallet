# RotationTV AI Gateway

Unified AI API gateway for the RotationTV ecosystem. Routes requests to Gemini, Claude, and Venice AI.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/chat` | Chat completion (auto-routes to provider) |
| POST | `/v1/ensemble` | Multi-provider ensemble mode |
| POST | `/v1/image` | Image generation (Venice z-image-turbo) |
| POST | `/v1/tts` | Text-to-speech (Venice TTS) |

## Quick Start

```bash
cp .env.example .env  # Fill in API keys
npm install
npm run dev
```

## Provider Routing

| Model prefix | Provider |
|---------------|----------|
| `gemini-*` | Google Gemini |
| `claude-*` | Anthropic Claude |
| Everything else | Venice AI (default) |

## Architecture

```
Telegram Bot → Cloudflare Worker → AI Gateway → Gemini/Claude/Venice
                                        ↓
                                  Supabase (audit log)
```
