/**
 * RotationTV — Unified Bot Gateway Router
 * ========================================
 * Routes incoming Telegram webhook updates to the correct bot handler
 * based on the bot ID in the URL path. All bots share the same backend.
 *
 * URL pattern: /telegram/bot/{botId}/webhook
 * Also supports legacy: /telegram/webhook, /telegram/erotica/webhook
 *
 * @module botGateway
 */

import {
  getBot,
  listBots,
  registerBot,
  setWebAppMenuButton,
} from './telegramCloudSdk';
import { validateTelegramData } from './telegramAuth';
import {
  createWebAppMenuButton,
  miniAppInlineKeyboard,
  type WebAppButtonOptions,
} from './webAppButtons';

export interface BotRouteConfig {
  botId: string;
  botName: string;
  botToken: string;
  webAppUrl: string;
  webhookPath: string;
  isErotica?: boolean;
}

export interface TokenBotConfig {
  token: string;
  menuOptions: WebAppButtonOptions;
}

// Registered bots in the orchestrator
const BOT_CONFIGS: BotRouteConfig[] = [
  {
    botId: 'main',
    botName: '@base44_229784_bot',
    botToken: '',
    webAppUrl: 'https://rotationtv-mini-app.pages.dev',
    webhookPath: '/telegram/webhook',
  },
  {
    botId: 'erotica',
    botName: '@RotationtvErotica_Bot',
    botToken: '',
    webAppUrl: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
    webhookPath: '/telegram/erotica/webhook',
    isErotica: true,
  },
];

/**
 * Initialize bot registry from environment variables.
 */
export function initBotRegistry(env: Record<string, any>): void {
  if (env.TELEGRAM_BOT_TOKEN_6) {
    registerBot({
      botId: 'main',
      botToken: env.TELEGRAM_BOT_TOKEN_6,
      botName: '@base44_229784_bot',
      webAppUrl: 'https://rotationtv-mini-app.pages.dev',
    });
    BOT_CONFIGS[0].botToken = env.TELEGRAM_BOT_TOKEN_6;
  }

  if (env.TELEGRAM_BOT_TOKEN_7) {
    registerBot({
      botId: 'erotica',
      botToken: env.TELEGRAM_BOT_TOKEN_7,
      botName: '@RotationtvErotica_Bot',
      webAppUrl: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
    });
    BOT_CONFIGS[1].botToken = env.TELEGRAM_BOT_TOKEN_7;
  }

  for (let i = 8; i <= 20; i++) {
    const token = env[`TELEGRAM_BOT_TOKEN_${i}`];
    if (token) {
      const botId = `bot_${i}`;
      registerBot({
        botId,
        botToken: token,
        botName: `Bot ${i}`,
        webAppUrl: `https://rotationtv-mini-app.pages.dev?bot=${botId}`,
      });
      BOT_CONFIGS.push({
        botId,
        botName: `Bot ${i}`,
        botToken: token,
        webAppUrl: `https://rotationtv-mini-app.pages.dev?bot=${botId}`,
        webhookPath: `/telegram/bot/${botId}/webhook`,
      });
    }
  }
}

/**
 * Token-based menu apply (does not require registry). Safe for one-shot scripts.
 * Never logs full token.
 */
export async function applyWebAppMenuButtonToBot(
  config: TokenBotConfig
): Promise<{ success: boolean; botToken: string; error?: string }> {
  const masked = config.token.slice(0, 10) + '...';
  const url = `https://api.telegram.org/bot${config.token}/setChatMenuButton`;
  const payload = {
    menu_button: createWebAppMenuButton(config.menuOptions),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok: boolean; description?: string };

    if (!response.ok || !data.ok) {
      return {
        success: false,
        botToken: masked,
        error: data.description || `HTTP ${response.status}`,
      };
    }
    return { success: true, botToken: masked };
  } catch (err) {
    return {
      success: false,
      botToken: masked,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function applyAllBotMenuButtons(bots: TokenBotConfig[]) {
  return Promise.all(bots.map((bot) => applyWebAppMenuButtonToBot(bot)));
}

/**
 * Registry-based: apply menu buttons for all bots that have tokens loaded.
 * Prefer this inside the Worker after initBotRegistry(env).
 */
export async function applyWebAppMenuButtons(
  _env?: Record<string, any>
): Promise<{ ok: string[]; failed: string[] }> {
  const ok: string[] = [];
  const failed: string[] = [];

  const targets = getAllBots().map((b) => ({
    id: b.botId,
    text:
      b.isErotica || b.botId === 'erotica' ? 'Open Erotica' : 'Open RotationTV',
    url: b.webAppUrl || 'https://rotationtv-mini-app.pages.dev',
  }));

  for (const t of targets) {
    try {
      await setWebAppMenuButton(t.id, t.text, t.url);
      ok.push(t.id);
    } catch (e: any) {
      console.error(`setWebAppMenuButton failed for ${t.id}:`, e?.message || e);
      failed.push(t.id);
    }
  }
  return { ok, failed };
}

export function getInlineKeyboardForBot(botId: string) {
  const bot = getBotById(botId);
  const url = bot?.webAppUrl || 'https://rotationtv-mini-app.pages.dev';
  const label =
    bot?.isErotica || botId === 'erotica'
      ? '🚀 Open Erotica'
      : '🚀 Open RotationTV';
  return miniAppInlineKeyboard(url, label);
}

export function resolveBot(pathname: string): BotRouteConfig | null {
  if (
    pathname === '/telegram/webhook' ||
    pathname === '/telegram/wallet/webhook'
  ) {
    return BOT_CONFIGS[0];
  }
  if (pathname === '/telegram/erotica/webhook') {
    return BOT_CONFIGS[1];
  }

  const match = pathname.match(/^\/telegram\/bot\/([^\/]+)\/webhook$/);
  if (match) {
    const botId = match[1];
    return BOT_CONFIGS.find((b) => b.botId === botId) || null;
  }

  return null;
}

export async function validateWebhookRequest(
  body: any,
  _botConfig: BotRouteConfig
): Promise<boolean> {
  if (!body || typeof body.update_id === 'undefined') return false;
  return true;
}

export function getAllBots(): BotRouteConfig[] {
  return BOT_CONFIGS.filter((b) => b.botToken.length > 0);
}

export function getBotById(botId: string): BotRouteConfig | undefined {
  return BOT_CONFIGS.find((b) => b.botId === botId);
}

export default {
  initBotRegistry,
  applyWebAppMenuButtonToBot,
  applyAllBotMenuButtons,
  applyWebAppMenuButtons,
  getInlineKeyboardForBot,
  resolveBot,
  validateWebhookRequest,
  getAllBots,
  getBotById,
  BOT_CONFIGS,
};
