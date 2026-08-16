/**
 * RotationTV — Multi-Domain Router
 * Routes requests based on hostname:
 *   api.domain.com  → backend API + worker
 *   app.domain.com  → standalone WebApp (dist-web)
 *   bot.domain.com  → Telegram bot gateway
 * Entity: Darrel-spell-living-trust
 */

export type Domain = 'api' | 'app' | 'bot' | 'unknown';

export function getDomain(hostname: string): Domain {
  if (hostname.startsWith('api.')) return 'api';
  if (hostname.startsWith('app.')) return 'app';
  if (hostname.startsWith('bot.')) return 'bot';
  return 'unknown';
}

export function getWebAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>RotationTV — Web App</title>
  <style>
    body { margin: 0; background: #0D0D0D; color: #FFF; font-family: Inter, sans-serif; }
    #root { max-width: 480px; margin: 0 auto; min-height: 100vh; }
  </style>
  <script src="/assets/webapp.js" defer></script>
</head>
<body><div id="root"></div></body>
</html>`;
}
