# RTV Telegram Wallet

An open-source Telegram wallet bot built for accessibility, community use, and developer extensibility.

## Features
- 💸 Send & receive crypto via Telegram
- 🔐 Secure key management
- 📊 Balance & transaction history
- 🤖 Telegram Bot API integration
- 🌐 Multi-chain support (extensible)

## Getting Started

### Prerequisites
- Node.js 18+
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- A supported wallet provider or RPC endpoint

### Installation
```bash
git clone https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git
cd rtv-telegram-wallet
npm install
cp .env.example .env
# Fill in your config
npm start
```

## Configuration
See `.env.example` for all required environment variables.

## Project Structure
```
src/
  bot/        # Telegram bot handlers & commands
  wallet/     # Wallet logic (keygen, signing, balances)
  api/        # External API integrations (RPC, price feeds)
  utils/      # Shared helpers
docs/         # Documentation
```

## Contributing
PRs welcome. Please open an issue first to discuss major changes.

## License
MIT
