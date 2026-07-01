/**
 * RTV Ecosystem Database Connection
 * 
 * Adapted from Kimi Code CLI output (Drizzle ORM MySQL/PlanetScale)
 * to RTV's actual stack (Drizzle ORM PostgreSQL/Supabase).
 * 
 * ORIGINAL (Kimi-generated):
 *   drizzle-orm/mysql2 + PlanetScale mode + Node.js server
 * 
 * RTV REALITY:
 *   drizzle-orm/postgres-js + Supabase PostgreSQL + Cloudflare Workers edge
 * 
 * @author RTV AI Command Center
 * @version 1.0.0
 * @date 2026-07-01
 */

// ============================================================
// OPTION A: Drizzle ORM + PostgreSQL (Direct SQL)
// For Cloudflare Workers with postgres-js driver
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    // Supabase connection string (pooler for edge runtime)
    const connectionString = env.databaseUrl || process.env.SUPABASE_DB_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL or SUPABASE_DB_URL is required");
    }

    // postgres-js client optimized for Cloudflare Workers
    const client = postgres(connectionString, {
      prepare: false,        // Required for edge runtime (no prepared statements)
      max: 1,                // Single connection for serverless/edge
      idle_timeout: 20,      // Close idle connections after 20s
      connect_timeout: 10,   // Timeout after 10s if can't connect
      ssl: 'require',        // Supabase requires SSL
      max_lifetime: 60 * 5,  // Recycle connection every 5 minutes
    });

    // NOTE: No "mode" parameter needed for postgres-js
    // (Kimi's "mode: planetscale" was MySQL-specific)
    instance = drizzle(client, {
      schema: fullSchema,
    });
  }
  return instance;
}

// ============================================================
// OPTION B: Supabase JS Client (For simpler use cases)
// Use this for entity CRUD without complex joins
// ============================================================

import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const url = env.supabaseUrl || process.env.SUPABASE_URL || 
      "https://xynkgaxfwvpcixissxdz.supabase.co";
    const key = env.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY;
    
    if (!key) {
      throw new Error("SUPABASE_SERVICE_KEY is required");
    }

    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        headers: { "x-rtv-client": "edge-gateway" }
      },
      db: { schema: "public" },
    });
  }
  return supabaseInstance;
}

// ============================================================
// OPTION C: Base44 Entity SDK (For backend functions)
// Use this inside Base44 deployed functions
// ============================================================

// import { createClientFromRequest } from "@base44/sdk";
// 
// export function getBase44(req: Request) {
//   return createClientFromRequest(req);
// }
// 
// // Service role (admin access, bypasses RLS)
// export function getBase44Admin() {
//   return base44.asServiceRole.entities;
// }
//
// Usage:
//   const base44 = getBase44(req);
//   const users = await base44.entities.RTVUser.list();
//   const tx = await base44.entities.RotationPayTransaction.create({...});

// ============================================================
// SOVEREIGN PAYMENT HELPERS (Telegram Stars + TON only)
// ============================================================

/**
 * Log a sovereign payment transaction to the database
 * @param tx Transaction details
 */
export async function logPayment(tx: {
  user_id?: string;
  telegram_id?: string;
  amount_usd: number;
  payment_rail: "telegram_stars" | "ton_jetton" | "internal_rtv";
  tx_type: "purchase" | "payout" | "reward" | "transfer" | "airdrop";
  signature?: string;
  status: "pending" | "confirmed" | "failed";
}) {
  const db = getDb();
  const rtv_amount = Math.floor(tx.amount_usd / 0.01); // 1 RTV = $0.01 USD

  const [record] = await db.insert(schema.rotationPayTransactions).values({
    userId: tx.user_id || null,
    amount: tx.amount_usd,
    amountRtv: rtv_amount,
    currency: "RTV",
    paymentRail: tx.payment_rail,
    txType: tx.tx_type,
    signature: tx.signature || null,
    blockchainConfirmed: tx.payment_rail !== "internal_rtv",
    status: tx.status,
    timestamp: new Date(),
  }).returning();

  return record;
}

/**
 * Get user balance (RTV + USD equivalent)
 */
export async function getUserBalance(userId: string) {
  const db = getDb();
  const [balance] = await db.select()
    .from(schema.rtvTokens)
    .where(eq(schema.rtvTokens.userId, userId))
    .limit(1);

  const rtv = balance?.balance || 0;
  return {
    rtv_balance: rtv,
    locked_balance: balance?.lockedBalance || 0,
    staking_rewards: balance?.stakingRewards || 0,
    usd_value: (rtv * 0.01).toFixed(2), // 1 RTV = $0.01
  };
}

/**
 * Process creator payout with 80/15/5 revenue split
 */
export async function processPayout(data: {
  creator_id: string;
  amount_rtv: number;
  method: "ton" | "telegram_stars" | "internal";
  destination_address?: string;
}) {
  const db = getDb();
  const amount_usd = data.amount_rtv * 0.01;

  // Sovereign revenue split: 80% creator / 15% platform / 5% agency
  const creator_rtv = Math.floor(data.amount_rtv * 0.80);
  const platform_rtv = Math.floor(data.amount_rtv * 0.15);
  const agency_rtv = Math.floor(data.amount_rtv * 0.05);

  const [payout] = await db.insert(schema.creatorPayouts).values({
    creatorId: data.creator_id,
    amountUsd: amount_usd,
    amountRtv: data.amount_rtv,
    method: data.method,
    destinationAddress: data.destination_address || null,
    feeUsd: amount_usd * 0.20,
    netUsd: amount_usd * 0.80,
    creatorNetUsd: amount_usd * 0.80,
    agencyCutUsd: amount_usd * 0.05,
    status: "pending",
    requestedAt: new Date(),
  }).returning();

  return {
    payout_id: payout.id,
    total_rtv: data.amount_rtv,
    creator_share_rtv: creator_rtv,
    platform_fee_rtv: platform_rtv,
    agency_fee_rtv: agency_rtv,
    creator_net_usd: (amount_usd * 0.80).toFixed(2),
    parity: "1 RTV = $0.01 USD",
  };
}

// ============================================================
// TELEGRAM STARS INVOICE HELPER
// ============================================================

/**
 * Create a Telegram Stars invoice for RTV token purchase
 * Uses Telegram Payments 2.0 with XTR currency (test: 4242 4242 4242 4242)
 */
export async function createStarsInvoice(params: {
  telegram_id: string;
  stars_amount: number;
  bot_token: string;
}) {
  const STAR_USD_VALUE = 0.013; // 1 Star = $0.013 USD
  const RTV_USD_PARITY = 0.01;  // 1 RTV = $0.01 USD

  const usd_value = params.stars_amount * STAR_USD_VALUE;
  const rtv_to_receive = Math.floor(usd_value / RTV_USD_PARITY);

  const payload = `rtv_purchase_${params.telegram_id}_${Date.now()}`;

  const response = await fetch(
    `https://api.telegram.org/bot${params.bot_token}/createInvoiceLink`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Purchase ${rtv_to_receive} RTV Tokens`,
        description: `${params.stars_amount} Telegram Stars → ${rtv_to_receive} RTV`,
        payload: payload,
        currency: "XTR",
        prices: [{
          label: `${params.stars_amount} Stars`,
          amount: params.stars_amount,
        }],
        provider_token: "", // Empty = Telegram Stars payment
      }),
    }
  );

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return {
    invoice_url: data.result,
    stars_amount: params.stars_amount,
    usd_value: usd_value.toFixed(2),
    rtv_to_receive: rtv_to_receive,
    payload: payload,
  };
}

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

/**
 * Expected environment variables:
 * 
 * # Supabase (Primary Database)
 * SUPABASE_URL=https://xynkgaxfwvpcixissxdz.supabase.co
 * SUPABASE_SERVICE_KEY=<service-role-key>
 * SUPABASE_DB_URL=postgresql://postgres:[password]@db.xynkgaxfwvpcixissxdz.supabase.co:5432/postgres
 * 
 * # Cloudflare (Edge Compute)
 * CLOUDFLARE_API_TOKEN_5=<CLOUDFLARE_API_TOKEN>
 * CLOUDFLARE_ACCOUNT_ID=<CLOUDFLARE_ACCOUNT_ID>
 * 
 * # Telegram (Bot + Payments)
 * TELEGRAM_BOT_TOKEN=<bot-token>
 * 
 * # Blockchain (TON primary, Solana secondary)
 * TON_RPC_ENDPOINT=<chainstack-v3-endpoint>
 * SOLANA_RPC_ENDPOINT=<chainstack-primary-node>
 * 
 * # AI Providers
 * ANTHROPIC_API_KEY=<claude-key>
 * GEMINI_API_KEY=<gemini-key>
 * VENICE_API_KEY=<venice-key>
 */