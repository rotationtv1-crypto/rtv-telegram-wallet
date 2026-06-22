const TelegramBot = require('node-telegram-bot-api');
const db = require('../lib/supabase.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');

const bot = new TelegramBot(token, { polling: true });

async function getOrCreateWallet(msg) {
  const telegramId = String(msg.from.id);
  const username = msg.from.username || msg.from.first_name || 'User';
  let wallet = await db.getWallet(telegramId).catch(() => null);
  if (!wallet) {
    wallet = await db.createWallet(telegramId, username).catch(() => null);
  }
  return wallet;
}

function formatBalance(wallet) {
  return [
    '💼 *RTV Wallet Balance*',
    '',
    `🪙 RTV: \`${(wallet.rtv_balance || 0).toFixed(2)}\``,
    `💵 USDT: \`${(wallet.usdt_balance || 0).toFixed(2)}\``,
    `⛓️ TON: \`${(wallet.ton_balance || 0).toFixed(4)}\``,
    `🔒 Staked: \`${(wallet.staked_rtv || 0).toFixed(2)} RTV\``,
    `📈 APY: \`${wallet.apy_rate || 4.5}%\``,
    '',
    `🏷 Address: \`${wallet.wallet_address}\``,
    `🎁 Referral: \`${wallet.referral_code || 'N/A'}\``,
  ].join('\n');
}

function start() {
  bot.onText(/\/start/, async (msg) => {
    const wallet = await getOrCreateWallet(msg);
    const name = msg.from.first_name || 'Sovereign';
    let reply = `👋 Welcome to *RTV Wallet*, ${name}!\n\n`;
    if (wallet) {
      reply += `✅ Wallet linked: \`${wallet.wallet_address}\`\n\n`;
    }
    reply += [
      '🏦 *Commands:*',
      '/balance — View your RTV, USDT & TON balances',
      '/faucet — Claim daily RTV tokens',
      '/send — Transfer RTV to another wallet',
      '/receive — Get your deposit address',
      '/stake — Stake RTV for 4.5% APY',
      '/history — Recent transactions',
      '/help — All commands',
    ].join('\n');
    bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    db.auditLog('wallet_start', { telegram_id: String(msg.from.id) });
  });

  bot.onText(/\/balance/, async (msg) => {
    const wallet = await getOrCreateWallet(msg);
    if (!wallet) {
      return bot.sendMessage(msg.chat.id, '⚠️ Could not fetch wallet. Try /start first.');
    }
    bot.sendMessage(msg.chat.id, formatBalance(wallet), { parse_mode: 'Markdown' });
  });

  bot.onText(/\/faucet/, async (msg) => {
    const telegramId = String(msg.from.id);
    try {
      const [faucetConfig, lastClaim] = await Promise.all([
        db.getFaucetConfig().catch(() => ({ daily_amount: 100, cooldown_hours: 24 })),
        db.checkFaucetClaim(telegramId).catch(() => null),
      ]);

      // Check cooldown
      if (lastClaim) {
        const lastClaimTime = new Date(lastClaim.created_at).getTime();
        const cooldownMs = (faucetConfig.cooldown_hours || 24) * 3600 * 1000;
        const nextClaim = lastClaimTime + cooldownMs;
        if (Date.now() < nextClaim) {
          const hoursLeft = ((nextClaim - Date.now()) / 3600000).toFixed(1);
          return bot.sendMessage(msg.chat.id,
            `⏳ Faucet cooldown active.\n\nNext claim in: *${hoursLeft}h*\nCome back later, Sovereign! 💎`,
            { parse_mode: 'Markdown' }
          );
        }
      }

      const amount = faucetConfig.daily_amount || 100;
      await Promise.all([
        db.creditRtv(telegramId, amount),
        db.recordFaucetClaim(telegramId, amount),
      ]);

      const wallet = await db.getWallet(telegramId).catch(() => null);
      bot.sendMessage(msg.chat.id,
        `✅ *Faucet Claimed!*\n\n+${amount} RTV credited to your wallet.\nNew balance: \`${(wallet?.rtv_balance || amount).toFixed(2)} RTV\`\n\n🔥 Come back in 24h for your next claim!`,
        { parse_mode: 'Markdown' }
      );
      db.auditLog('faucet_claimed', { telegram_id: telegramId, amount });
    } catch (err) {
      console.error('[Faucet]', err.message);
      bot.sendMessage(msg.chat.id, '⚠️ Faucet service temporarily unavailable. Try again shortly.');
    }
  });

  bot.onText(/\/receive/, async (msg) => {
    const wallet = await getOrCreateWallet(msg);
    if (!wallet) return bot.sendMessage(msg.chat.id, '⚠️ Wallet not found. Use /start to register.');
    bot.sendMessage(msg.chat.id,
      `📥 *Your Deposit Address*\n\n\`${wallet.wallet_address}\`\n\nSend RTV tokens to this address to fund your wallet.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/send (.+)/, async (msg, match) => {
    bot.sendMessage(msg.chat.id,
      '📤 *Send RTV*\n\nFormat: /send <address> <amount>\n\nExample: `/send RTV123456 50`\n\n⚠️ Transfers are irreversible — double check the address!',
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/history/, async (msg) => {
    const telegramId = String(msg.from.id);
    try {
      // Would query rtv_transactions filtered by telegram_id
      bot.sendMessage(msg.chat.id,
        '📋 *Transaction History*\n\nHistory sync coming online. Check back soon!\n\nUse /balance to see current holdings.',
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      bot.sendMessage(msg.chat.id, '⚠️ Could not fetch history.');
    }
  });

  bot.onText(/\/stake/, async (msg) => {
    const wallet = await getOrCreateWallet(msg);
    if (!wallet) return bot.sendMessage(msg.chat.id, '⚠️ Wallet not found.');
    const tokenConfig = await db.getTokenConfig().catch(() => null);
    const apy = tokenConfig?.apy_rate || wallet.apy_rate || 4.5;
    bot.sendMessage(msg.chat.id,
      `🔒 *Stake RTV*\n\nCurrent APY: *${apy}%*\nYour balance: \`${(wallet.rtv_balance || 0).toFixed(2)} RTV\`\nStaked: \`${(wallet.staked_rtv || 0).toFixed(2)} RTV\`\n\n💎 Staking locks your RTV and earns rewards daily.\n\nTo stake, reply: /stake <amount>`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
      '🤖 *RTV Wallet Commands*\n\n/start — Register & link wallet\n/balance — Live wallet balances\n/faucet — Daily RTV claim\n/receive — Deposit address\n/send — Transfer RTV\n/stake — Stake for APY\n/history — Transactions\n/help — This menu',
      { parse_mode: 'Markdown' }
    );
  });

  console.log('✅ RTV Wallet Bot running with live Supabase data');
}

module.exports = { start };
