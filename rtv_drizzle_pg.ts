/**
 * RTV Drizzle PostgreSQL Connection
 * Adapted from Kimi-generated MySQL version to RTV's actual stack.
 * 
 * Original (Kimi): drizzle-orm/mysql2 + PlanetScale
 * RTV Reality:    drizzle-orm/postgres-js + Supabase PostgreSQL
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const client = postgres(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL, {
      prepare: false,        // Required for Cloudflare Workers
      max: 1,                // Single connection for edge runtime
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    instance = drizzle(client, {
      schema: fullSchema,
      // No mode needed for postgres-js (PlanetScale mode was MySQL-specific)
    });
  }
  return instance;
}

// ============================================================
// SOVEREIGN PAYMENT QUERY HELPERS
// ============================================================

export async function createPaymentTransaction(data: {
  user_id: string;
  amount_usd: number;
  payment_rail: "telegram_stars" | "ton_jetton" | "internal_rtv";
  tx_type: "purchase" | "payout" | "reward" | "transfer";
  signature?: string;
}) {
  const db = getDb();
  const rtvAmount = Math.floor(data.amount_usd * 100); // 1 RTV = $0.01 USD
  
  const [tx] = await db.insert(schema.rotationPayTransactions).values({
    userId: data.user_id,
    amount: data.amount_usd,
    amountRtv: rtvAmount,
    currency: "RTV",
    paymentRail: data.payment_rail,
    txType: data.tx_type,
    signature: data.signature || null,
    blockchainConfirmed: data.payment_rail !== "internal_rtv",
    status: "pending",
    timestamp: new Date(),
  }).returning();
  
  return tx;
}

export async function getUserBalance(userId: string) {
  const db = getDb();
  const [balance] = await db.select()
    .from(schema.rtvTokens)
    .where(eq(schema.rtvTokens.userId, userId));
  
  return {
    rtv_balance: balance?.balance || 0,
    locked_balance: balance?.lockedBalance || 0,
    staking_rewards: balance?.stakingRewards || 0,
    usd_value: (balance?.balance || 0) * 0.01, // 1 RTV = $0.01
  };
}

export async function processCreatorPayout(data: {
  creator_id: string;
  amount_rtv: number;
  method: "ton" | "telegram_stars" | "internal";
  destination_address?: string;
}) {
  const db = getDb();
  const amountUsd = data.amount_rtv * 0.01; // 1 RTV = $0.01
  
  // 80/15/5 revenue split
  const creatorShare = Math.floor(data.amount_rtv * 0.80);
  const platformFee = Math.floor(data.amount_rtv * 0.15);
  const agencyFee = Math.floor(data.amount_rtv * 0.05);
  
  const [payout] = await db.insert(schema.creatorPayouts).values({
    creatorId: data.creator_id,
    amountUsd,
    amountRtv: data.amount_rtv,
    method: data.method,
    destinationAddress: data.destination_address || null,
    feeUsd: amountUsd * 0.20,
    netUsd: amountUsd * 0.80,
    creatorNetUsd: amountUsd * 0.80,
    agencyCutUsd: amountUsd * 0.05,
    status: "pending",
    requestedAt: new Date(),
  }).returning();
  
  return {
    payout_id: payout.id,
    total_rtv: data.amount_rtv,
    creator_share_rtv: creatorShare,
    platform_fee_rtv: platformFee,
    agency_fee_rtv: agencyFee,
    creator_net_usd: amountUsd * 0.80,
  };
}
