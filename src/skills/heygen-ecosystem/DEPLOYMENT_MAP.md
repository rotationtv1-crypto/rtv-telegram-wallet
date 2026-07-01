# RTV HeyGen Ecosystem — Deployment Map

## Platform Routing

| Platform | Method | Trigger |
|----------|--------|---------|
| Base44 | POST /rotationPayWebhook | Video complete callback |
| Manus | Webhook POST | Company event detected |
| Vercel | env var HEYGEN_API_KEY | CI/CD video builds |
| Supabase | Edge Function trigger | DB event → video |
| Telegram | Bot message | Video link delivery |
| Discord | Bot message | Video link + preview |
| GitHub Actions | Secrets | Automated video releases |

## Company → Video Pipeline

```
Company Event
    ↓
heygen_master_mode.py --company <id> --event <type>
    ↓
Template Selected (templates/<company>-<type>.md)
    ↓
HeyGen CLI → video-agent create
    ↓
Video URL Generated
    ↓
Webhook → Base44 rotationPayWebhook
    ↓
Slack + Discord notification (Darrel)
    ↓
ManusAITask + ManusWebhook entities logged
```

## Companies Active
- rotationtvnetwork → command_center
- rotationtvai → ai_platform
- rotationpay → rotation_pay
- emergentlabs → emergent
- bigoagency → bigo
- whiteindustries → white_industries

## Priority Videos (First Run Order)
1. rtv-command-center-intro (RTV identity video)
2. rotationpay-update (daily payment summary)
3. emergentlabs-intro (AI platform positioning)
4. bigo-agency-intro (agency credentials)
5. white-industries-intro (industrial profile)
