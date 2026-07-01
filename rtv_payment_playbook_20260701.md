# SOVEREIGN PAYMENT SYSTEM PLAYBOOK
## RotationTV Network (RTV) — Telegram Stars + TON Blockchain

---

```
╔═══════════════════════════════════════════════════════════════╗
║          ROTATIONTV SOVEREIGN PAYMENT ARCHITECTURE            ║
║                                                               ║
║   Telegram Stars (XTR) ──► RTV Credits ──► Creator Payouts   ║
║   TON Blockchain      ──► Jettons      ──► On-chain Settle    ║
║   Supabase            ──► Ledger       ──► Revenue Analytics  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## TABLE OF CONTENTS

1. [System Architecture Overview](#1-architecture)
2. [Price Parity & Conversion Engine](#2-price-parity)
3. [Telegram Stars Invoicing](#3-telegram-stars)
4. [TON Jetton Flow](#4-ton-jetton)
5. [Internal RTV Credits System](#5-rtv-credits)
6. [Bot Commands Implementation](#6-bot-commands)
7. [Creator Payout Engine (80/15/5)](#7-payouts)
8. [Revenue Ledger → Supabase](#8-supabase)
9. [Security & Compliance](#9-security)
10. [Deployment Checklist](#10-deployment)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT ENTRY POINTS                         │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Telegram Bot │    │  TON Wallet  │    │   Mini App UI    │  │
│  │ /buy /stars  │    │  EQB2wn8L…  │    │  (WebApp)        │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                      │            │
└─────────┼───────────────────┼──────────────────────┼────────────┘
          │                   │                      │
          ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PAYMENT PROCESSOR LAYER                       │
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────────────────┐  │
│  │  Stars Handler  │         │     TON Listener Service     │  │
│  │  XTR → Credits  │         │  Jetton Transfer → Credits   │  │
│  └────────┬────────┘         └─────────────┬────────────────┘  │
│           │                                 │                   │
│           └─────────────┬───────────────────┘                   │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │   RTV CREDIT ENGINE  │                          │
│              │   Conversion + Fees  │                          │
│              └──────────┬───────────┘                          │
└─────────────────────────┼───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  Creator    │ │  Platform   │ │  Network    │
   │  80% Split  │ │  15% Fee    │ │  5% Reserve │
   └─────────────┘ └─────────────┘ └─────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌──────────────────────┐
              │   SUPABASE LEDGER    │
              │   Real-time Revenue  │
              └──────────────────────┘
```

---

## 2. PRICE PARITY & CONVERSION ENGINE

### Conversion Constants

```
1 RTV Credit  = $0.010 USD
1 Telegram ⭐  = $0.013 USD
1 TON        = Market Price (fetched live)

Conversion Rates:
  Stars → RTV:  1 Star = 1.3 RTV Credits
  RTV → Stars:  1 RTV  = 0.769 Stars (ceil to integer)
  TON → RTV:    Dynamic (CoinGecko API)
```

### `/lib/conversion.ts`

```typescript
// ============================================================
// RTV CONVERSION ENGINE
// RotationTV Network — Sovereign Payment System
// ============================================================

import axios from 'axios';

// ─── CONSTANTS ────────────────────────────────────────────────
export const PRICE_CONSTANTS = {
  RTV_USD:    0.010,        // 1 RTV Credit = $0.01 USD
  STAR_USD:   0.013,        // 1 Telegram Star = $0.013 USD
  XTR_TO_RTV: 1.3,         // Stars → RTV multiplier
  RTV_TO_XTR: 0.769230769, // RTV → Stars multiplier

  // Revenue split basis points (out of 10000)
  CREATOR_BPS:  8000, // 80%
  PLATFORM_BPS: 1500, // 15%
  NETWORK_BPS:   500, //  5%
} as const;

// ─── TON PRICE ORACLE ─────────────────────────────────────────
let cachedTonPrice: number | null = null;
let lastFetch = 0;
const CACHE_TTL = 60_000; // 60 seconds

export async function getTonUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedTonPrice && now - lastFetch < CACHE_TTL) {
    return cachedTonPrice;
  }

  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      { params: { ids: 'the-open-network', vs_currencies: 'usd' } }
    );
    cachedTonPrice = data['the-open-network'].usd;
    lastFetch = now;
    return cachedTonPrice!;
  } catch {
    // Fallback price if API fails
    return cachedTonPrice ?? 5.50;
  }
}

// ─── CONVERSION FUNCTIONS ─────────────────────────────────────
export interface ConversionResult {
  input:       number;
  inputUnit:   string;
  output:      number;
  outputUnit:  string;
  usdValue:    number;
  rate:        number;
  timestamp:   string;
}

/**
 * Stars (XTR) → RTV Credits
 * sendInvoice uses XTR — this converts on successful payment
 */
export function starsToRTV(stars: number): ConversionResult {
  const rtv     = Math.floor(stars * PRICE_CONSTANTS.XTR_TO_RTV);
  const usdVal  = stars * PRICE_CONSTANTS.STAR_USD;
  return {
    input:      stars,
    inputUnit:  'XTR',
    output:     rtv,
    outputUnit: 'RTV',
    usdValue:   usdVal,
    rate:       PRICE_CONSTANTS.XTR_TO_RTV,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * RTV Credits → Stars (for display / invoice pricing)
 * Always ceil — Telegram requires integer stars
 */
export function rtvToStars(rtv: number): number {
  return Math.ceil(rtv * PRICE_CONSTANTS.RTV_TO_XTR);
}

/**
 * TON → RTV Credits
 * Dynamic based on live price oracle
 */
export async function tonToRTV(
  tonAmount: number
): Promise<ConversionResult> {
  const tonUsd  = await getTonUsdPrice();
  const usdVal  = tonAmount * tonUsd;
  const rtv     = Math.floor(usdVal / PRICE_CONSTANTS.RTV_USD);

  return {
    input:      tonAmount,
    inputUnit:  'TON',
    output:     rtv,
    outputUnit: 'RTV',
    usdValue:   usdVal,
    rate:       tonUsd / PRICE_CONSTANTS.RTV_USD,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * RTV Credits → TON (for payouts)
 */
export async function rtvToTon(rtv: number): Promise<number> {
  const tonUsd = await getTonUsdPrice();
  const usdVal = rtv * PRICE_CONSTANTS.RTV_USD;
  return usdVal / tonUsd;
}

// ─── SPLIT CALCULATOR ─────────────────────────────────────────
export interface RevenueSplit {
  gross:    number; // Total RTV received
  creator:  number; // 80% to creator
  platform: number; // 15% to RotationTV
  network:  number; //  5% to reserve
  currency: string;
}

export function calculateSplit(grossRTV: number): RevenueSplit {
  const creator  = Math.floor(grossRTV * PRICE_CONSTANTS.CREATOR_BPS  / 10000);
  const platform = Math.floor(grossRTV * PRICE_CONSTANTS.PLATFORM_BPS / 10000);
  const network  = grossRTV - creator - platform; // remainder = 5%

  return { gross: grossRTV, creator, platform, network, currency: 'RTV' };
}

// ─── PACKAGE BUILDER ──────────────────────────────────────────
export interface CreditPackage {
  id:          string;
  name:        string;
  rtv:         number;
  stars:       number;  // XTR price for Telegram invoice
  usd:         string;
  description: string;
  bonus:       number;  // bonus RTV credits
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id:          'starter',
    name:        '🌱 Starter Pack',
    rtv:         100,
    stars:       77,    // ceil(100 * 0.769) = 77 XTR ≈ $1.00
    usd:         '$1.00',
    description: '100 RTV Credits — Get Started',
    bonus:       0,
  },
  {
    id:          'creator',
    name:        '🎬 Creator Pack',
    rtv:         550,
    stars:       385,   // ceil(550 * 0.769) = 423 XTR but discounted
    usd:         '$5.00',
    description: '500 + 50 Bonus RTV Credits',
    bonus:       50,
  },
  {
    id:          'pro',
    name:        '🚀 Pro Pack',
    rtv:         1200,
    stars:       769,   // $10.00 worth with 20% bonus
    usd:         '$10.00',
    description: '1000 + 200 Bonus RTV Credits',
    bonus:       200,
  },
  {
    id:          'studio',
    name:        '🏆 Studio Pack',
    rtv:         6500,
    stars:       3846,  // $50.00 worth with 30% bonus
    usd:         '$50.00',
    description: '5000 + 1500 Bonus RTV Credits',
    bonus:       1500,
  },
];
```

---

## 3. TELEGRAM STARS INVOICING

### `sendInvoice` Implementation (XTR Currency)

```typescript
// ============================================================
// TELEGRAM STARS INVOICE HANDLER
// Uses Bot API sendInvoice with currency: "XTR"
// ============================================================

import TelegramBot from 'node-telegram-bot-api';
import { CREDIT_PACKAGES, starsToRTV, CreditPackage } from './conversion';
import { creditUserAccount, recordTransaction } from './ledger';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true,
});

// ─── SEND STARS INVOICE ───────────────────────────────────────
export async function sendStarsInvoice(
  chatId:    number,
  userId:    number,
  pkg:       CreditPackage
): Promise<void> {

  // Telegram Stars invoices MUST use currency: "XTR"
  // provider_token must be EMPTY STRING for Stars
  // prices array: label + amount in "nanoStars" (actually just Stars as integer)

  await bot.sendInvoice(
    chatId,
    pkg.name,                              // title
    pkg.description,                       // description
    JSON.stringify({                       // payload (returned in pre-checkout)
      userId,
      packageId: pkg.id,
      rtv:       pkg.rtv,
      bonus:     pkg.bonus,
      type:      'stars_purchase',
      ts:        Date.now(),
    }),
    '',                                    // provider_token = '' for Stars!
    'XTR',                                 // currency = XTR for Telegram Stars
    [{ label: pkg.name, amount: pkg.stars }], // amount in Stars
    {
      // Optional: photo for invoice
      photo_url:    'https://rotationtv.network/assets/credits-card.png',
      photo_width:  640,
      photo_height: 360,
      // Protect from forwarding
      is_flexible:  false,
      // Need shipping? No.
      need_name:      false,
      need_email:     false,
      need_phone:     false,
      need_shipping:  false,
    }
  );

  console.log(`[Stars] Invoice sent to ${userId} for ${pkg.id} (${pkg.stars} XTR)`);
}

// ─── PRE-CHECKOUT HANDLER ─────────────────────────────────────
// MUST answer within 10 seconds or payment fails
bot.on('pre_checkout_query', async (query) => {
  try {
    const payload = JSON.parse(query.invoice_payload);

    // Validate payload
    if (!payload.userId || !payload.packageId || !payload.rtv) {
      await bot.answerPreCheckoutQuery(query.id, false, {
        error_message: 'Invalid purchase data. Please try again.'
      });
      return;
    }

    // Validate package still exists and price matches
    const pkg = CREDIT_PACKAGES.find(p => p.id === payload.packageId);
    if (!pkg || pkg.stars !== query.total_amount) {
      await bot.answerPreCheckoutQuery(query.id, false, {
        error_message: 'Package price mismatch. Please restart purchase.'
      });
      return;
    }

    // Approve the payment
    await bot.answerPreCheckoutQuery(query.id, true);
    console.log(`[Stars] Pre-checkout approved for user ${payload.userId}`);

  } catch (err) {
    console.error('[Stars] Pre-checkout error:', err);
    await bot.answerPreCheckoutQuery(query.id, false, {
      error_message: 'System error. Please try again.'
    });
  }
});

// ─── SUCCESSFUL PAYMENT HANDLER ───────────────────────────────
bot.on('message', async (msg) => {
  if (!msg.successful_payment) return;

  const payment = msg.successful_payment;
  const payload = JSON.parse(payment.invoice_payload);

  console.log(`[Stars] Payment confirmed:`, {
    userId:          payload.userId,
    stars:           payment.total_amount,
    currency:        payment.currency, // XTR
    telegramChargeId: payment.telegram_payment_charge_id,
  });

  // Calculate actual RTV from stars paid
  const conversion  = starsToRTV(payment.total_amount);
  const totalRTV    = conversion.output + (payload.bonus || 0);

  // Credit the user's account
  await creditUserAccount({
    userId:           payload.userId,
    amount:           totalRTV,
    source:           'telegram_stars',
    sourceAmount:     payment.total_amount,
    sourceCurrency:   'XTR',
    telegramChargeId: payment.telegram_payment_charge_id,
    packageId:        payload.packageId,
    usdValue:         conversion.usdValue,
  });

  // Record in Supabase
  await recordTransaction({
    user_id:          payload.userId,
    type:             'deposit',
    method:           'telegram_stars',
    gross_rtv:        totalRTV,
    base_rtv:         conversion.output,
    bonus_rtv:        payload.bonus || 0,
    stars_paid:       payment.total_amount,
    usd_equivalent:   conversion.usdValue,
    tx_ref:           payment.telegram_payment_charge_id,
    package_id:       payload.packageId,
    status:           'confirmed',
  });

  // Notify user
  await bot.sendMessage(
    msg.chat.id,
    `✅ *Payment Confirmed!*\n\n` +
    `💫 Stars Paid: ${payment.total_amount} XTR\n` +
    `🪙 RTV Credited: *${totalRTV.toLocaleString()} RTV*\n` +
    `${payload.bonus > 0 ? `🎁 Includes ${payload.bonus} bonus credits!\n` : ''}` +
    `💵 Value: $${conversion.usdValue.toFixed(2)}\n\n` +
    `Use /balance to check your credits.`,
    { parse_mode: 'Markdown' }
  );
});

// ─── INVOICE KEYBOARD BUILDER ─────────────────────────────────
export function buildPackageKeyboard() {
  return {
    inline_keyboard: CREDIT_PACKAGES.map(pkg => ([{
      text:          `${pkg.name} — ${pkg.stars} ⭐ (${pkg.usd})`,
      callback_data: `buy_stars:${pkg.id}`,
    }])),
  };
}

// ─── CALLBACK HANDLER FOR PACKAGE SELECTION ───────────────────
bot.on('callback_query', async (query) => {
  if (!query.data?.startsWith('buy_stars:')) return;

  const pkgId = query.data.split(':')[1];
  const pkg   = CREDIT_PACKAGES.find(p => p.id === pkgId);

  if (!pkg || !query.message) {
    await bot.answerCallbackQuery(query.id, { text: 'Package not found.' });
    return;
  }

  await bot.answerCallbackQuery(query.id);
  await sendStarsInvoice(
    query.message.chat.id,
    query.from.id,
    pkg
  );
});
```

---

## 4. TON JETTON FLOW

### Wallet & Jetton Configuration

```typescript
// ============================================================
// TON JETTON PAYMENT HANDLER
// RTV Treasury Wallet: EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC
// ============================================================

import { TonClient, Address, fromNano, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { tonToRTV, rtvToTon } from './conversion';
import { creditUserAccount, recordTransaction, getUserByTonWallet } from './ledger';

// ─── CONFIGURATION ────────────────────────────────────────────
export const TON_CONFIG = {
  TREASURY_WALLET: 'EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC',
  NETWORK:         'mainnet' as const,
  // Minimum deposit to process (0.5 TON)
  MIN_DEPOSIT_TON: 0.5,
  // Confirmation blocks required
  CONFIRMATIONS:   3,
  // Polling interval for new transactions
  POLL_INTERVAL_MS: 15_000,
} as const;

// ─── TON CLIENT FACTORY ───────────────────────────────────────
export async function createTonClient(): Promise<TonClient> {
  const endpoint = await getHttpEndpoint({
    network: TON_CONFIG.NETWORK,
  });
  return new TonClient({ endpoint });
}

// ─── TRANSACTION MONITOR ──────────────────────────────────────
interface ProcessedTx {
  hash:      string;
  lt:        bigint;
  processedAt: string;
}

// In-memory processed set (use Redis in production)
const processedTxs = new Set<string>();
let lastLt: bigint = 0n;

export async function startTONListener(): Promise<void> {
  const client  = await createTonClient();
  const address = Address.parse(TON_CONFIG.TREASURY_WALLET);

  console.log(`[TON] Listening for deposits to ${TON_CONFIG.TREASURY_WALLET}`);

  setInterval(async () => {
    try {
      await pollNewTransactions(client, address);
    } catch (err) {
      console.error('[TON] Poll error:', err);
    }
  }, TON_CONFIG.POLL_INTERVAL_MS);
}

async function pollNewTransactions(
  client:  TonClient,
  address: Address
): Promise<void> {

  const txs = await client.getTransactions(address, {
    limit: 20,
  });

  for (const tx of txs) {
    const txHash = tx.hash().toString('hex');

    // Skip already processed
    if (processedTxs.has(txHash)) continue;

    // Only incoming transactions
    if (!tx.inMessage) continue;

    const inMsg = tx.inMessage;
    if (inMsg.info.type !== 'internal') continue;

    const tonAmount = parseFloat(fromNano(inMsg.info.value.coins));

    // Skip dust transactions
    if (tonAmount < TON_CONFIG.MIN_DEPOSIT_TON) {
      processedTxs.add(txHash);
      continue;
    }

    // Extract memo/comment for user identification
    const memo = extractMemo(inMsg);
    const senderAddress = inMsg.info.src.toString();

    console.log(`[TON] New deposit: ${tonAmount} TON from ${senderAddress}`, {
      memo, txHash
    });

    // Process the deposit
    await processTONDeposit({
      txHash,
      senderAddress,
      tonAmount,
      memo,
      lt: tx.lt,
    });

    processedTxs.add(txHash);
    if (tx.lt > lastLt) lastL
