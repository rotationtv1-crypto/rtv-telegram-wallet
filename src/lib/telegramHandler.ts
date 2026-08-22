/**
 * RotationTV — Telegram Message Handler
 * ======================================
 * Direct Telegram ingress with integrated Venice AI inference.
 * Handles incoming messages from the Telegram webhook and routes them
 * to the appropriate AI backend (Venice or Kimi-Claw).
 *
 * Also handles Mini App → Bot data via message.web_app_data (sendData).
 *
 * @module telegramHandler
 */

import { handleVeniceInference } from './veniceAiRouter';
import { orchestrateAgenticWorkflow } from './agentService';

export interface TelegramHandlerEnv {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_TOKEN_MAIN?: string;
  VENICE_API_KEY: string;
  VENICE_API_KEY_2?: string;
  VENICE_API_KEY_3?: string;
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;
  GOOGLE_SEARCH_API_KEY?: string;
  GOOGLE_CX_ID?: string;
}

interface TelegramMessage {
  chat: { id: number; type?: string };
  text?: string;
  from?: { id: number; first_name?: string; username?: string };
  web_app_data?: { data: string };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    data: string;
    message: { chat: { id: number } };
    from: { id: number; first_name: string };
  };
}

/**
 * Send a text message back to a Telegram chat
 */
export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  return response.ok;
}

/**
 * Core message handler used by dynamic bot routing (index.ts).
 * Processes web_app_data, commands, and AI chat.
 */
export async function handleTelegramMessage(
  message: TelegramMessage,
  env: any,
  botToken: string,
  _isErotica = false
): Promise<void> {
  const token = botToken || env.TELEGRAM_BOT_TOKEN_MAIN || env.TELEGRAM_BOT_TOKEN;
  if (!token || !message) return;

  // === WEB APP DATA (Mini App sendData) ===
  if (message.web_app_data) {
    const raw = message.web_app_data.data || '';
    const chatId = message.chat.id;
    const userId = message.from?.id;

    console.log(`[web_app_data] user=${userId} len=${raw.length}`);

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // plain string is valid
    }

    let reply = '✅ Data received from Mini App.';

    if (parsed?.action) {
      switch (parsed.action) {
        case 'onboarding_complete':
          reply = `🎉 Welcome ${message.from?.first_name || 'there'}!\n\nYour profile is saved. Open the Mini App anytime via the menu button.`;
          // TODO: persist to Supabase users / profiles table
          break;
        case 'preference_update':
          reply = '⚙️ Preferences updated.';
          break;
        case 'gift_selected':
          reply = `🎁 Selection received: ${parsed.gift || 'gift'} (${parsed.stars || '?'}⭐)`;
          break;
        case 'close':
          reply = 'Mini App closed. Data saved.';
          break;
        default:
          reply = `📦 Received action: ${parsed.action}`;
      }
    } else if (raw) {
      reply = `📦 Received: ${raw.slice(0, 120)}`;
    }

    await sendTelegramMessage(token, chatId, reply);
    return;
  }

  // Text messages only from here
  if (!message.text) return;

  const chatId = message.chat.id;
  const text = message.text;
  const userName = message.from?.first_name || 'there';

  // Command routing
  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].toLowerCase().split('@')[0];

    switch (cmd) {
      case '/start':
        await sendTelegramMessage(
          token,
          chatId,
          `Welcome to RotationTV, ${userName}! 🔴\n\n` +
            `I'm your AI broadcast assistant. Ask me anything about the ecosystem, ` +
            `or tap the menu button to open the Mini App.\n\n` +
            `Commands:\n` +
            `/ask <question> — Ask me anything (Venice AI)\n` +
            `/research <topic> — Deep web research (Kimi-Claw)\n` +
            `/balance — Check your wallet\n` +
            `/subscribe — View plans`,
          {
            inline_keyboard: [
              [{ text: '🔴 Open RotationTV', web_app: { url: 'https://rotationtv-mini-app.pages.dev' } }],
            ],
          }
        );
        return;

      case '/help':
        await sendTelegramMessage(
          token,
          chatId,
          'RotationTV Bot Commands:\n\n' +
            '/ask <question> — AI inference via Venice\n' +
            '/research <topic> — Web-grounded research via Kimi-Claw\n' +
            '/balance — Wallet balance\n' +
            '/subscribe — Subscription plans\n' +
            '/start — Restart'
        );
        return;

      default:
        break;
    }
  }

  // AI routing
  let prompt = text;
  let useKimiClaw = false;

  if (text.toLowerCase().startsWith('/research ')) {
    prompt = text.substring(10);
    useKimiClaw = true;
  } else if (text.toLowerCase().startsWith('/ask ')) {
    prompt = text.substring(5);
  }

  if (!prompt.trim()) return;

  try {
    let responseText: string;

    if (useKimiClaw) {
      const result = await orchestrateAgenticWorkflow(prompt, undefined, {
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        GEMINI_API_KEY_2: env.GEMINI_API_KEY_2,
        GOOGLE_SEARCH_API_KEY: env.GOOGLE_SEARCH_API_KEY,
        GOOGLE_CX_ID: env.GOOGLE_CX_ID,
        TELEGRAM_BOT_TOKEN: token,
      });
      responseText = result.response;
      if (result.sources?.length > 0) {
        responseText += '\n\n📊 Sources:\n' + result.sources.slice(0, 3).map((s: any) => `• ${s.link}`).join('\n');
      }
    } else {
      const result = await handleVeniceInference(prompt, {
        VENICE_API_KEY: env.VENICE_API_KEY,
        VENICE_API_KEY_2: env.VENICE_API_KEY_2,
        VENICE_API_KEY_3: env.VENICE_API_KEY_3,
      });
      responseText = result.text;
    }

    if (responseText.length > 4096) {
      responseText = responseText.substring(0, 4090) + '...';
    }

    await sendTelegramMessage(token, chatId, responseText);
  } catch (err: any) {
    await sendTelegramMessage(token, chatId, `⚠️ AI error: ${err.message}`);
  }
}

/**
 * Handle an incoming Telegram update (message or callback).
 * Routes to Venice AI for general chat, Kimi-Claw for research queries.
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate,
  env: TelegramHandlerEnv
): Promise<Response> {
  const token = env.TELEGRAM_BOT_TOKEN_MAIN || env.TELEGRAM_BOT_TOKEN;

  // Handle callback queries (inline button presses)
  if (update.callback_query) {
    const { id, data, message } = update.callback_query;
    const chatId = message.chat.id;

    await sendTelegramMessage(token, chatId, `Action: ${data}`);
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id }),
    });

    return new Response('ok', { status: 200 });
  }

  const msg = update.message;
  if (msg) {
    await handleTelegramMessage(msg, env, token);
  }

  return new Response('ok', { status: 200 });
}
