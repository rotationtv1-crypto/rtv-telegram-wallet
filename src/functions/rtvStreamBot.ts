// RTV Stream Bot Handler — Telegram commands for live streaming
// Handles: /stream, /watch, /tip, /gift, /pk, /subscribe, /balance, /buy, /payout

const STREAM_API = 'https://rtv-stream.rotationtvaicom.workers.dev';
const PAYMENTS_API = 'https://rtv-payments.rotationtvaicom.workers.dev';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  // Handle Telegram webhook
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const message = body.message;
      if (!message) return new Response(JSON.stringify({ ok: true }), { headers: cors });

      const text = message.text || '';
      const chatId = message.chat.id;
      const userId = message.from.id;
      const username = message.from.username || message.from.first_name || 'User';
      const token = process.env.TELEGRAM_BOT_TOKEN_2_2 || '';

      let responseText = '';
      let keyboard: any = null;

      if (text === '/start') {
        responseText = `🎬 Welcome to RotationTV Network, ${username}!\n\nYou've received 100 RTV welcome bonus! 🎁\n\nHere's what you can do:\n🔴 /stream — Go live\n📺 /watch — Browse streams\n💎 /tip — Tip a creator\n🎁 /gift — Send gifts\n⚔️ /pk — PK battle\n⭐ /subscribe — Subscribe\n💰 /balance — Check balance\n🛒 /buy — Buy RTV tokens\n💸 /payout — Request payout\n\nLearn it. Live it. Love it.`;
        keyboard = {
          inline_keyboard: [[
            { text: '🔴 Go Live', callback_data: 'stream' },
            { text: '📺 Watch', callback_data: 'watch' }
          ], [
            { text: '💰 Balance', callback_data: 'balance' },
            { text: '🛒 Buy RTV', callback_data: 'buy' }
          ]]
        };
      } else if (text === '/stream' || text === '/stream@base44_229784_bot') {
        const res = await fetch(`${STREAM_API}/api/stream/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `${username}'s Stream`, creator_id: `tg_${userId}` })
        });
        const data = await res.json();
        responseText = `🔴 Stream Created!\n\nStream ID: ${data.stream_id?.slice(0, 16)}...\nRTMP URL: ${data.rtmp_url}\n\nUse this RTMP URL in OBS/streaming software to go live!\n\nPlayback: ${data.playback_url?.slice(0, 50)}...`;
      } else if (text === '/watch' || text === '/watch@base44_229784_bot') {
        responseText = `📺 Live Streams\n\nNo active streams right now.\n\nBe the first to go live with /stream`;
      } else if (text === '/tip' || text === '/tip@base44_229784_bot') {
        responseText = `💎 Tip a Creator\n\nAmount options:\n🌹 10 RTV ($0.10)\n❤️ 50 RTV ($0.50)\n💎 500 RTV ($5.00)\n👑 1,000 RTV ($10.00)\n🌌 5,000 RTV ($50.00)\n🎆 10,000 RTV ($100.00)\n\nUse: /tip [amount] [streamer]\nExample: /tip 100 @streamer`;
      } else if (text === '/gift' || text === '/gift@base44_229784_bot') {
        const res = await fetch(`${STREAM_API}/api/gifts`);
        const data = await res.json();
        const gifts = (data.gifts || []).map(g => `${g.emoji} ${g.name}: ${g.price_rtv} RTV ($${g.price_usd})`).join('\n');
        responseText = `🎁 Available Gifts\n\n${gifts}\n\nUse: /gift [name] [streamer]`;
      } else if (text === '/pk' || text === '/pk@base44_229784_bot') {
        responseText = `⚔️ PK Battle\n\nChallenge a creator!\nUse: /pk [streamer] [stake]\nExample: /pk @streamer 500\n\nWinner takes the pot!';
      } else if (text === '/subscribe' || text === '/subscribe@base44_229784_bot') {
        const res = await fetch(`${STREAM_API}/api/subscriptions/tiers`);
        const data = await res.json();
        const tiers = (data.tiers || []).map(t => `${t.tier.toUpperCase()}: $${t.price_usd}/mo (${t.price_rtv} RTV)\n  ${t.perks.join(', ')}`).join('\n\n');
        responseText = `⭐ Subscription Tiers\n\n${tiers}`;
      } else if (text === '/balance' || text === '/balance@base44_229784_bot') {
        const res = await fetch(`${STREAM_API}/api/balance?user_id=tg_${userId}`);
        const data = await res.json();
        responseText = `💰 Your Balance\n\nRTV: ${data.rtv_balance}\nUSD: $${(data.rtv_balance * 0.01).toFixed(2)}\nWithdrawable: ${data.withdrawable_rtv} RTV\n\n1 RTV = $0.01 USD`;
      } else if (text === '/buy' || text === '/buy@base44_229784_bot') {
        responseText = `🛒 Buy RTV Tokens\n\nPayment methods:\n⭐ Telegram Stars — 1 Star = 1.3 RTV\n🪙 TON Jetton — 1 TON ≈ 150 RTV\n\nUse the Mini App button below to purchase!`;
        keyboard = {
          inline_keyboard: [[
            { text: '⭐ Buy with Stars', web_app: { url: 'https://rtv-frontend.pages.dev/#/pay' } },
            { text: '💰 Wallet', web_app: { url: 'https://rtv-frontend.pages.dev/#/wallet' } }
          ]]
        };
      } else if (text === '/payout' || text === '/payout@base44_229784_bot') {
        responseText = `💸 Creator Payout\n\nRequest a payout for your earnings.\nUse: /payout [amount] [method]\nMethods: TON, Stars\n\nFee: 0.5% (sovereign rail)`;
      } else if (text === '/help' || text === '/help@base44_229784_bot') {
        responseText = `📋 RTV Commands\n\n/stream — Go live\n/watch — Browse streams\n/tip — Tip a creator\n/gift — Send gifts\n/pk — PK battle\n/subscribe — Subscribe to creator\n/balance — Check your balance\n/buy — Buy RTV tokens\n/payout — Request payout\n/prices — Subscription tiers\n/help — This message`;
      } else if (text === '/prices' || text === '/prices@base44_229784_bot') {
        const res = await fetch(`${STREAM_API}/api/subscriptions/tiers`);
        const data = await res.json();
        const tiers = (data.tiers || []).map(t => `${t.tier}: $${t.price_usd}/mo`).join(' | ');
        responseText = `⭐ Prices\n\n${tiers}\n\n1 RTV = $0.01 USD`;
      } else {
        // Non-command message
        if (text && !text.startsWith('/')) {
          responseText = `Hi ${username}! Use /help to see all commands. 🔴`;
        }
      }

      if (responseText) {
        const sendBody: any = {
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML'
        };
        if (keyboard) sendBody.reply_markup = keyboard;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sendBody)
        });
      }

      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  // GET — status
  return new Response(JSON.stringify({
    service: 'rtv-stream-bot',
    status: 'live',
    commands: ['/start', '/stream', '/watch', '/tip', '/gift', '/pk', '/subscribe', '/balance', '/buy', '/payout', '/help'],
    mini_app: 'https://rtv-frontend.pages.dev',
    stream_api: STREAM_API
  }), { headers: cors });
}
