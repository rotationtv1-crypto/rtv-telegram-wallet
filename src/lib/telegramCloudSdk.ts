/**
 * RotationTV — Telegram Cloud SDK Client
 * ======================================
 * Unified client for Telegram Bot API + Cloud SDK endpoints.
 * Supports multi-bot routing: each call targets a specific bot by ID.
 *
 * @module telegramCloudSdk
 */

interface BotConfig {
  botId: string;
  botToken: string;
  botName: string;
  webAppUrl: string;
}

// In-memory bot registry (persisted to KV in production)
const botRegistry = new Map<string, BotConfig>();

/**
 * Register a bot into the orchestrator.
 */
export function registerBot(config: BotConfig): void {
  botRegistry.set(config.botId, config);
}

/**
 * Get a bot's config by ID.
 */
export function getBot(botId: string): BotConfig | undefined {
  return botRegistry.get(botId);
}

/**
 * List all registered bots.
 */
export function listBots(): BotConfig[] {
  return Array.from(botRegistry.values());
}

/**
 * Core API caller — routes to Telegram Bot API for a specific bot.
 */
async function tgApiCall(botId: string, method: string, body?: any): Promise<any> {
  const bot = getBot(botId);
  if (!bot) throw new Error(`Bot ${botId} not registered`);

  const res = await fetch(`https://api.telegram.org/bot${bot.botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json() as { ok: boolean; description?: string; result?: any };
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
  return data.result;
}

// ── Cloud SDK Methods ──────────────────────────────────────────

/** Get user info from Telegram */
export async function getUser(botId: string, userId: number) {
  return tgApiCall(botId, 'getChat', { chat_id: userId });
}

/** Get chat info */
export async function getChat(botId: string, chatId: number | string) {
  return tgApiCall(botId, 'getChat', { chat_id: chatId });
}

/** Send a message as the bot */
export async function sendMessage(botId: string, chatId: number | string, text: string, extra?: any) {
  return tgApiCall(botId, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

/** Edit a message */
export async function editMessage(botId: string, chatId: number, messageId: number, text: string, extra?: any) {
  return tgApiCall(botId, 'editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra });
}

/** Delete a message */
export async function deleteMessage(botId: string, chatId: number, messageId: number) {
  return tgApiCall(botId, 'deleteMessage', { chat_id: chatId, message_id: messageId });
}

/** Upload a file to Telegram */
export async function uploadFile(botId: string, chatId: number | string, file: Blob, filename: string) {
  const bot = getBot(botId);
  if (!bot) throw new Error(`Bot ${botId} not registered`);

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('document', file, filename);

  const res = await fetch(`https://api.telegram.org/bot${bot.botToken}/sendDocument`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json() as { ok: boolean; description?: string; result?: any };
  if (!data.ok) throw new Error(`Upload failed: ${data.description}`);
  return data.result;
}

/** Download a file from Telegram */
export async function downloadFile(botId: string, fileId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const bot = getBot(botId);
  if (!bot) throw new Error(`Bot ${botId} not registered`);

  const fileRes = await fetch(`https://api.telegram.org/bot${bot.botToken}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json() as { ok: boolean; description?: string; result?: { file_path?: string } };
  if (!fileData.ok) return { ok: false, error: fileData.description };

  const filePath = fileData.result?.file_path;
  if (!filePath) return { ok: false, error: 'missing file_path' };
  const url = `https://api.telegram.org/file/bot${bot.botToken}/${filePath}`;
  return { ok: true, url };
}

/** Generic method invoker — for any Telegram Bot API method */
export async function invokeMethod(botId: string, method: string, params?: any) {
  return tgApiCall(botId, method, params);
}

/** Set the menu button for a bot (WebApp launcher) */
export async function setWebAppMenuButton(botId: string, text: string, webAppUrl: string) {
  return tgApiCall(botId, 'setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text,
      web_app: { url: webAppUrl },
    },
  });
}

/** Set webhook for a bot */
export async function setBotWebhook(botId: string, webhookUrl: string) {
  return tgApiCall(botId, 'setWebhook', { url: webhookUrl, allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'shipping_query'] });
}

/** Get webhook info */
export async function getWebhookInfo(botId: string) {
  return tgApiCall(botId, 'getWebhookInfo');
}

/** Answer a callback query */
export async function answerCallbackQuery(botId: string, callbackQueryId: string, text?: string) {
  return tgApiCall(botId, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

/** Answer a pre-checkout query (for Stars payments) */
export async function answerPreCheckoutQuery(botId: string, preCheckoutQueryId: string, ok: boolean, errorMessage?: string) {
  return tgApiCall(botId, 'answerPreCheckoutQuery', { pre_checkout_query_id: preCheckoutQueryId, ok, error_message: errorMessage });
}

/** Create a Stars invoice link */
export async function createStarsInvoice(botId: string, params: {
  chatId: number | string;
  title: string;
  description: string;
  stars: number;
  payload: string;
}) {
  return tgApiCall(botId, 'createInvoiceLink', {
    chat_id: params.chatId,
    title: params.title,
    description: params.description,
    payload: params.payload,
    currency: 'XTR',
    prices: [{ label: params.title, amount: params.stars }],
    provider_token: '',
  });
}

export default {
  registerBot,
  getBot,
  listBots,
  getUser,
  getChat,
  sendMessage,
  editMessage,
  deleteMessage,
  uploadFile,
  downloadFile,
  invokeMethod,
  setWebAppMenuButton,
  setBotWebhook,
  getWebhookInfo,
  answerCallbackQuery,
  answerPreCheckoutQuery,
  createStarsInvoice,
};
