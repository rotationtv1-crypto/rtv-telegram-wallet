# HeyGen → RTV Webhook Contracts

## Video Completed → Base44
POST https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationPayWebhook
{
  "source": "heygen",
  "event_type": "video_completed",
  "title": "string",
  "message": "video_url",
  "data": { "company_id": "string", "video_id": "string", "duration_sec": number },
  "priority": "normal | high",
  "rtv_module": "string"
}

## Base44 → HeyGen (trigger video)
Use heygen_master_mode.py with --company and --event flags

## Supported event_types
- intro: company/brand intro video
- update: daily/weekly ecosystem update
- alert: critical event announcement
- announcement: product launch / news
- report: financial / operational report
