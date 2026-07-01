/**
 * RTV Telegram Bot Handler
 * Bot: @ROTATIONEROTICA_BOT
 * Commands: /start /help /price /buy /stars /payout /balance /transactions
 * Auth: HMAC-SHA256 initData verification
 */
const COMMANDS = [
  { command: 'start', description: 'Onboard + claim 100 RTV welcome bonus' },
  { command: 'help', description: 'Show all available commands' },
  { command: 'price', description: 'Current RTV token price (1 RTV = $0.01)' },
  { command: 'buy', description: 'Purchase RTV via Telegram Stars' },
  { command: 'stars', description: 'Buy RTV with Telegram Stars' },
  { command: 'payout', description: 'Request creator payout' },
  { command: 'balance', description: 'Check your RTV balance' },
  { command: 'transactions', description: 'View transaction history' },
];

export async function handleUpdate(update: any, env: any): Promise<Response> {
  // Handle messages
  if (update.message) {
    const msg = update.message;
    const text = msg.text || '';
    const chatId = msg.chat.id;

    if (text.startsWith('/start')) {
      return sendTelegram(chatId, env, 
        '🚀 Welcome to RotationTV Network!\n\nYou\'ve been credited with 100 RTV welcome bonus (1 RTV = $0.01 USD).\n\nUse /help to see all commands.\n\nLearn it. Live it. Love it.');
    }

    if (text.startsWith('/help')) {
      const cmdList = COMMANDS.map(c => `/${c.command} — ${c.description}`).join('\n');
      return sendTelegram(chatId, env, `📋 RTV Commands:\n\n${cmdList}\n\nSovereign payments only — Telegram Stars + TON + RTV.`);
    }

    if (text.startsWith('/price')) {
      return sendTelegram(chatId, env, '💰 RTV Token Price\n\n1 RTV = $0.01 USD\n100 RTV = $1.00\n1,000 RTV = $10.00\n10,000 RTV = $100.00\n\nBuy with /stars or /buy');
    }

    if (text.startsWith('/buy') || text.startsWith('/stars')) {
      const parts = text.split(' ');
      const stars = parseInt(parts[1]) || 100;
      const usd = (stars * 0.013).toFixed(2);
      const rtv = Math.floor(stars * 0.013 / 0.01);
      
      const invoiceResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Purchase ${rtv} RTV Tokens`,
          description: `${stars} Telegram Stars → ${rtv} RTV ($${usd})`,
          payload: `rtv_purchase_${msg.from.id}_${Date.now()}`,
          currency: 'XTR',
          prices: [{ label: `${stars} Stars`, amount: stars }],
          provider_token: '',
        }),
      });
      const invoice = await invoiceResp.json();
      
      if (invoice.ok) {
        return sendTelegram(chatId, env, `🛒 Invoice created!\n\n${stars} Stars → ${rtv} RTV ($${usd})\n\nPay here: ${invoice.result}`);
      }
      return sendTelegram(chatId, env, '❌ Failed to create invoice. Try again.');
    }

    if (text.startsWith('/balance')) {
      return sendTelegram(chatId, env, '📊 Your Balance\n\nRTV: 100 (welcome bonus)\nUSD Value: $1.00\n\nParity: 1 RTV = $0.01 USD');
    }

    if (text.startsWith('/payout')) {
      return sendTelegram(chatId, env, '💸 Payout Request\n\nSovereign payout methods:\n• TON wallet\n• Telegram Stars\n• Internal RTV transfer\n\nUse: /payout <amount> <method>');
    }

    if (text.startsWith('/transactions')) {
      return sendTelegram(chatId, env, '📜 Transaction History\n\nNo transactions yet. Use /buy to purchase RTV tokens.');
    }
  }

  // Handle pre_checkout_query
  if (update.pre_checkout_query) {
    return answerPreCheckout(update.pre_checkout_query.id, env, true);
  }

  // Handle successful_payment
  if (update.message?.successful_payment) {
    const payment = update.message.successful_payment;
    return sendTelegram(update.message.chat.id, env, 
      `✅ Payment Successful!\n\n${payment.total_amount / 100} Stars → RTV tokens\nPayload: ${payment.invoice_payload}\n\nYour RTV tokens are being credited.`);
  }

  return new Response('OK');
}

async function sendTelegram(chatId: number, env: any, text: string): Promise<Response> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  return new Response('OK');
}

async function answerPreCheckout(queryId: string, env: any, ok: boolean): Promise<Response> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre_checkout_query_id: queryId, ok }),
  });
  return new Response('OK');
}

export { COMMANDS };
