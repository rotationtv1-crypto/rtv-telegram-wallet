# RTV HeyGen Master Mode — Runbook

## Quick Start

### 1. Set API Key
```bash
export HEYGEN_API_KEY=<your-key-from-app.heygen.com/settings/api>
```

### 2. Verify Auth
```bash
python3 heygen_master_mode.py --auth-status
```

### 3. List Available Companies
```bash
python3 heygen_master_mode.py --list-companies
```

### 4. Generate RTV Command Center Intro (First Video)
```bash
python3 heygen_master_mode.py --company rotationtvnetwork --event intro
```

### 5. Generate RotationPay Update
```bash
python3 heygen_master_mode.py --company rotationpay --event update
```

## Webhook Contract
All completed videos POST to:
POST https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationPayWebhook

Payload:
{
  "source": "heygen",
  "event_type": "video_completed",
  "title": "<Company> Video — <event>",
  "message": "<video_url>",
  "priority": "normal",
  "rtv_module": "<module>"
}

## Security
- HEYGEN_API_KEY stored in: Vercel env, Supabase secrets, GitHub Actions secrets, Base44 secrets
- Never commit raw key to GitHub
- Rotate key at: app.heygen.com/settings/api
