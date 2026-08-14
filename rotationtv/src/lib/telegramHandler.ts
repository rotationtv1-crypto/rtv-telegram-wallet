/**
 * RotationTV — Telegram Message Handler
 * ======================================
 * Direct Telegram ingress with integrated Venice AI inference.
 * Handles incoming messages from the Telegram webhook and routes them
 * to the appropriate AI backend (Venice or Kimi-Claw).
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

interface TelegramUpdate {
  message?: {
    chat: { id: number; type: string };
    text: string;
    from: { id: number; first_name: string; username?: string };
  };
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

  // Handle text messages
  const msg = update.message;
  if (!msg || !msg.text) {
    return new Response('ok', { status: 200 });
  }

  const chatId = msg.chat.id;
  const text = msg.text;
  const userName = msg.from?.first_name || 'there';

  // Command routing
  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].toLowerCase();

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
              [{ text: '🔴 Open RotationTV', web_app: { url: 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev' } }],
            ],
          }
        );
        return new Response('ok', { status: 200 });

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
        return new Response('ok', { status: 200 });

      default:
        // Fall through to AI handling for unknown commands
        break;
    }
  }

  // AI routing: /research → Kimi-Claw, /ask or plain text → Venice
  let prompt = text;
  let useKimiClaw = false;

  if (text.toLowerCase().startsWith('/research ')) {
    prompt = text.substring(10);
    useKimiClaw = true;
  } else if (text.toLowerCase().startsWith('/ask ')) {
    prompt = text.substring(5);
  }

  if (!prompt.trim()) {
    return new Response('ok', { status: 200 });
  }

  try {
    let responseText: string;

    if (useKimiClaw) {
      // Kimi-Claw: Google Search → Gemini synthesis
      const result = await orchestrateAgenticWorkflow(prompt, undefined, {
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        GEMINI_API_KEY_2: env.GEMINI_API_KEY_2,
        GOOGLE_SEARCH_API_KEY: env.GOOGLE_SEARCH_API_KEY,
        GOOGLE_CX_ID: env.GOOGLE_CX_ID,
        TELEGRAM_BOT_TOKEN: token,
      });
      responseText = result.response;
      if (result.sources.length > 0) {
        responseText += '\n\n📊 Sources:\n' + result.sources.slice(0, 3).map(s => `• ${s.link}`).join('\n');
      }
    } else {
      // Venice AI: direct inference with key rotation
      const result = await handleVeniceInference(prompt, {
        VENICE_API_KEY: env.VENICE_API_KEY,
        VENICE_API_KEY_2: env.VENICE_API_KEY_2,
        VENICE_API_KEY_3: env.VENICE_API_KEY_3,
      });
      responseText = result.text;
    }

    // Telegram messages have a 4096 character limit
    if (responseText.length > 4096) {
      responseText = responseText.substring(0, 4090) + '...';
    }

    await sendTelegramMessage(token, chatId, responseText);
  } catch (err: any) {
    await sendTelegramMessage(token, chatId, `⚠️ AI error: ${err.message}`);
  }

  return new Response('ok', { status: 200 });
}
