const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

function start() {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '👋 Welcome to RTV Wallet!\n\nUse /balance, /send, or /receive to get started.');
  });

  bot.onText(/\/balance/, (msg) => {
    // TODO: integrate wallet.getBalance()
    bot.sendMessage(msg.chat.id, '💰 Balance: coming soon');
  });

  bot.onText(/\/send/, (msg) => {
    bot.sendMessage(msg.chat.id, '📤 Send: coming soon');
  });

  bot.onText(/\/receive/, (msg) => {
    bot.sendMessage(msg.chat.id, '📥 Your receive address: coming soon');
  });

  console.log('✅ Bot is running and listening...');
}

module.exports = { start };
