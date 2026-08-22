/**
 * RTV Stream Bot Handler — Telegram commands for live streaming
 * Stars-only (XTR). No RTV-token or Stripe payment paths.
 * Cloudflare Workers compatible.
 */

const STREAM_API = 'https://api.rotationtv.network'; // multi-domain target

export default async function handler(req: Request, env?: { TELEGRAM_BOT_TOKEN?: string }): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json() as any;
      const message = body.message;
      if (!message) {
        return new Response(JSON.stringify({ ok: true }), { headers: cors });
      }

      const text: string = message.text || '';
      const chatId = message.chat.id;
      const userId = message.from.id;
      const token = (env?.TELEGRAM_BOT_TOKEN) || '';

      let responseText = '';
      let keyboard: any = undefined;

      if (text.startsWith('/start') || text.startsWith('/help')) {
        responseText =
          `🎥 <b>RotationTV Stream Bot</b>\n\n` +
          `Commands:\n` +
          `/stream — Go live\n` +
          `/watch — Browse live streams\n` +
          `/gift — Send Stars gift\n` +
          `/tip — Tip with Stars\n` +
          `/subscribe — View tiers (Stars)\n` +
          `/balance — Your Stars balance\n\n` +
          `All payments: Telegram Stars (XTR) only.`;
        keyboard = {
          inline_keyboard: [[
            { text: '⭐ Open Mini App', web_app: { url: 'https://app.rotationtv.network' } },
          ]],
        };
      } else if (text.startsWith('/gift') || text.startsWith('/tip')) {
        responseText =
          `⭐ <b>Send with Telegram Stars</b>\n\n` +
          `Open the Mini App to choose a gift or tip amount.\n` +
          `Native invoice flow (createInvoiceLink → openInvoice).`;
        keyboard = {
          inline_keyboard: [[
            { text: '⭐ Send Stars Gift / Tip', web_app: { url: 'https://app.rotationtv.network/#/gifts' } },
          ]],
        };
      } else if (text.startsWith('/subscribe')) {
        responseText =
          `⭐ <b>Subscription Tiers (Stars)</b>\n\n` +
          `Open the Mini App to view and purchase tiers with XTR.`;
        keyboard = {
          inline_keyboard: [[
            { text: '⭐ View Plans', web_app: { url: 'https://app.rotationtv.network/#/subscribe' } },
          ]],
        };
      } else if (text.startsWith('/balance')) {
        responseText =
          `⭐ Balance is shown inside the Mini App wallet (Telegram Stars).\n` +
          `No external RTV-token balance is used for tips/gifts/subs.`;
        keyboard = {
          inline_keyboard: [[
            { text: '⭐ Open Wallet', web_app: { url: 'https://app.rotationtv.network/#/wallet' } },
          ]],
        };
      } else if (text.startsWith('/stream') || text.startsWith('/watch')) {
        responseText = `🎥 Open the Mini App to go live or watch streams.`;
        keyboard = {
          inline_keyboard: [[
            { text: '🎥 Mini App', web_app: { url: 'https://app.rotationtv.network' } },
          ]],
        };
      } else {
        responseText = `Unknown command. Try /help`;
      }

      if (responseText && token) {
        const sendBody: any = {
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML',
        };
        if (keyboard) sendBody.reply_markup = keyboard;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sendBody),
        });
      }

      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || 'handler error' }), {
        status: 500,
        headers: cors,
      });
    }
  }

  return new Response(
    JSON.stringify({
      service: 'rtv-stream-bot',
      status: 'ok',
      payments: 'Telegram Stars (XTR) only',
      commands: ['/start', '/help', '/stream', '/watch', '/gift', '/tip', '/subscribe', '/balance'],
    }),
    { headers: cors }
  );
}
