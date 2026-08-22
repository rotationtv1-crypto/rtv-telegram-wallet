/**
 * Hono route module: admin-guarded WebApp menu setup
 * Mount under your Worker entry:
 *
 *   import { mountSetupMenuRoutes } from './routes/setupMenu';
 *   mountSetupMenuRoutes(app);
 *
 * Requires env: ADMIN_SECRET, TELEGRAM_BOT_TOKEN_6 / _7 (or MAIN / EROTICA aliases)
 */

import type { Hono } from 'hono';
import {
  applyAllBotMenuButtons,
  applyWebAppMenuButtons,
  initBotRegistry,
  type TokenBotConfig,
} from '../../src/lib/botGateway';

type Bindings = {
  ADMIN_SECRET?: string;
  TELEGRAM_BOT_TOKEN_MAIN?: string;
  TELEGRAM_BOT_TOKEN_EROTICA?: string;
  TELEGRAM_BOT_TOKEN_6?: string;
  TELEGRAM_BOT_TOKEN_7?: string;
  MINI_APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  EROTICA_APP_URL?: string;
};

export function mountSetupMenuRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.use('/api/bots/*', async (c, next) => {
    const adminSecret = c.env.ADMIN_SECRET;
    const authHeader = c.req.header('Authorization');
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });

  app.post('/api/bots/setup-menu-all', async (c) => {
    const env = c.env;
    const base =
      env.MINI_APP_URL ||
      env.NEXT_PUBLIC_APP_URL ||
      'https://rotationtv-mini-app.pages.dev';
    const eroticaUrl =
      env.EROTICA_APP_URL || `${base.split('?')[0]}?bot=erotica`;

    const mainToken = env.TELEGRAM_BOT_TOKEN_MAIN || env.TELEGRAM_BOT_TOKEN_6;
    const eroticaToken =
      env.TELEGRAM_BOT_TOKEN_EROTICA || env.TELEGRAM_BOT_TOKEN_7;

    // Prefer registry path when tokens are bound as _6/_7
    initBotRegistry(env as any);
    const registryResult = await applyWebAppMenuButtons(env as any);
    if (registryResult.ok.length > 0 && registryResult.failed.length === 0) {
      return c.json({ success: true, mode: 'registry', ...registryResult });
    }

    // Fallback: direct token apply
    const bots: TokenBotConfig[] = [];
    if (mainToken) {
      bots.push({
        token: mainToken,
        menuOptions: { text: 'Open RotationTV', url: base },
      });
    }
    if (eroticaToken) {
      bots.push({
        token: eroticaToken,
        menuOptions: { text: 'Open Erotica', url: eroticaUrl },
      });
    }

    if (bots.length === 0) {
      return c.json(
        { error: 'No bot tokens in worker bindings', registry: registryResult },
        400
      );
    }

    const results = await applyAllBotMenuButtons(bots);
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return c.json({ success: false, mode: 'token', results }, 502);
    }
    return c.json({ success: true, mode: 'token', results });
  });

  app.post('/api/bots/:botId/setup-menu', async (c) => {
    const botId = c.req.param('botId');
    initBotRegistry(c.env as any);
    const { setWebAppMenuButton } = await import('../../src/lib/telegramCloudSdk');
    const { getBotById } = await import('../../src/lib/botGateway');
    const bot = getBotById(botId);
    if (!bot?.botToken) {
      return c.json({ error: 'BOT_NOT_REGISTERED' }, 404);
    }
    const text =
      bot.isErotica || botId === 'erotica' ? 'Open Erotica' : 'Open RotationTV';
    const url = bot.webAppUrl || 'https://rotationtv-mini-app.pages.dev';
    try {
      await setWebAppMenuButton(botId, text, url);
      return c.json({ ok: true, botId, menu: { text, url } });
    } catch (e: any) {
      return c.json({ ok: false, error: e.message }, 500);
    }
  });
}

export default mountSetupMenuRoutes;
