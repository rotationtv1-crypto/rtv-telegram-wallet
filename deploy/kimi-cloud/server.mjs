/**
 * kimi-cloud thin Node entry (Hono-compatible fetch adapter style)
 * Entity: Darrel-spell-living-trust
 *
 * This is the production Docker/k8s entrypoint.
 * It re-exports health + a minimal route table and can be extended
 * to import the full Worker handler once nodejs_compat polyfills are ready.
 *
 * For full parity keep Cloudflare Workers as the primary runtime;
 * use this package for hybrid / private cloud / offline edge.
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 8080);
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const BOT_TOKENS = {
  main: process.env.TELEGRAM_BOT_TOKEN_6 || process.env.TELEGRAM_BOT_TOKEN || '',
  erotica: process.env.TELEGRAM_BOT_TOKEN_7 || '',
};

const ALLOWED_ORIGINS = new Set([
  'https://app.rotationtv.network',
  'https://mini.rotationtv.network',
  'http://localhost:5173',
  'http://localhost:5174',
]);

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.pages.dev')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health — required by k8s probes and load balancers
  if (url.pathname === '/api/kimi/health' || url.pathname === '/health') {
    return json(res, 200, {
      status: 'ok',
      runtime: 'kimi-cloud-node',
      models: ['kimi-k2.7-code', 'kimi-k2.5', 'moonshot-v1-128k'],
      entity: 'Darrel-spell-living-trust',
      stars: true,
      bots_registered: Object.values(BOT_TOKENS).filter(Boolean).length,
      ts: new Date().toISOString(),
    });
  }

  // Multi-bot webhook stub (full logic lives in CF Worker / botGateway)
  if (url.pathname.startsWith('/webhook/')) {
    const botId = url.pathname.split('/')[2] || 'main';
    const token = BOT_TOKENS[botId] || BOT_TOKENS.main;
    if (!token) return json(res, 503, { error: 'bot not configured' });
    // In production pipe the body to the real handler or forward to CF
    return json(res, 200, { ok: true, botId, note: 'forward to full Worker or import botGateway' });
  }

  // Stars invoice proxy stub (full path is CF Worker)
  if (url.pathname === '/api/stars/invoice' && req.method === 'POST') {
    return json(res, 200, {
      ok: true,
      note: 'In production this route is served by the CF Worker; wire createStarsInvoice from telegramCloudSdk here if self-hosting fully.',
    });
  }

  // Catch-all
  json(res, 404, {
    error: 'not found',
    hint: 'Primary runtime is Cloudflare Workers. This package provides health + hybrid entry.',
  });
});

server.listen(PORT, () => {
  console.log(`[kimi-cloud] listening on :${PORT} | entity=Darrel-spell-living-trust`);
});
