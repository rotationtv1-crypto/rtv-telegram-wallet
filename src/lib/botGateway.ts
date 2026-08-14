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

import { getBot, listBots, registerBot } from './telegramCloudSdk';
import { validateTelegramData } from './telegramAuth';

export interface BotRouteConfig {
  botId: string;
  botName: string;
  botToken: string;
  webAppUrl: string;
  webhookPath: string;
  isErotica?: boolean;
}

// Registered bots in the orchestrator
const BOT_CONFIGS: BotRouteConfig[] = [
  {
    botId: 'main',
    botName: '@base44_229784_bot',
    botToken: '', // Set from env at runtime
    webAppUrl: 'https://rotationtv-mini-app.pages.dev',
    webhookPath: '/telegram/webhook',
  },
  {
    botId: 'erotica',
    botName: '@RotationtvErotica_Bot',
    botToken: '', // Set from env at runtime
    webAppUrl: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
    webhookPath: '/telegram/erotica/webhook',
    isErotica: true,
  },
];

/**
 * Initialize bot registry from environment variables.
 */
export function initBotRegistry(env: Record<string, any>): void {
  // Register main bot
  if (env.TELEGRAM_BOT_TOKEN_6) {
    registerBot({
      botId: 'main',
      botToken: env.TELEGRAM_BOT_TOKEN_6,
      botName: '@base44_229784_bot',
      webAppUrl: 'https://rotationtv-mini-app.pages.dev',
    });
    BOT_CONFIGS[0].botToken = env.TELEGRAM_BOT_TOKEN_6;
  }

  // Register erotica bot
  if (env.TELEGRAM_BOT_TOKEN_7) {
    registerBot({
      botId: 'erotica',
      botToken: env.TELEGRAM_BOT_TOKEN_7,
      botName: '@RotationtvErotica_Bot',
      webAppUrl: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
    });
    BOT_CONFIGS[1].botToken = env.TELEGRAM_BOT_TOKEN_7;
  }

  // Support dynamic bot registration via env
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
 * Resolve which bot a webhook URL belongs to.
 */
export function resolveBot(pathname: string): BotRouteConfig | null {
  // Legacy paths
  if (pathname === '/telegram/webhook' || pathname === '/telegram/wallet/webhook') {
    return BOT_CONFIGS[0];
  }
  if (pathname === '/telegram/erotica/webhook') {
    return BOT_CONFIGS[1];
  }

  // Dynamic paths: /telegram/bot/{botId}/webhook
  const match = pathname.match(/^\/telegram\/bot\/([^\/]+)\/webhook$/);
  if (match) {
    const botId = match[1];
    return BOT_CONFIGS.find(b => b.botId === botId) || null;
  }

  return null;
}

/**
 * Validate that a webhook request came from Telegram by checking
 * the update structure. For Cloud SDK init, validate initData.
 */
export async function validateWebhookRequest(
  body: any,
  botConfig: BotRouteConfig
): Promise<boolean> {
  // Telegram webhook updates always have update_id
  if (!body || typeof body.update_id === 'undefined') return false;
  return true;
}

/**
 * Get all bot configurations.
 */
export function getAllBots(): BotRouteConfig[] {
  return BOT_CONFIGS.filter(b => b.botToken.length > 0);
}

/**
 * Get a bot by its ID.
 */
export function getBotById(botId: string): BotRouteConfig | undefined {
  return BOT_CONFIGS.find(b => b.botId === botId);
}

export default {
  initBotRegistry,
  resolveBot,
  validateWebhookRequest,
  getAllBots,
  getBotById,
  BOT_CONFIGS,
};
