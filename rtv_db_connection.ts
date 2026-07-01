/**
 * RTV Ecosystem Database Connection
 * Stack: Supabase PostgreSQL + Cloudflare Workers + Base44 Entities
 * 
 * This replaces the Kimi-generated MySQL/PlanetScale snippet with
 * the actual RTV sovereign infrastructure.
 */

// ============================================================
// OPTION 1: Supabase Client (for Cloudflare Workers)
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = env.SUPABASE_URL || 'https://xynkgaxfwvpcixissxdz.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_KEY;

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { 'x-rtv-client': 'edge-gateway' } }
    });
  }
  return supabaseInstance;
}

// ============================================================
// OPTION 2: Base44 Entity SDK (for backend functions)
// ============================================================
// import base44 from '@base44/sdk';
// 
// export function getDb() {
//   return base44.asServiceRole.entities;
// }
// 
// Usage: const users = await getDb().RTVUser.list();
//        const tx = await getDb().RotationPayTransaction.create({...});

// ============================================================
// OPTION 3: Drizzle ORM with PostgreSQL (if needed for complex queries)
// ============================================================
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// 
// const client = postgres(env.DATABASE_URL, { prepare: false });
// export const db = drizzle(client, { schema: fullSchema });

// ============================================================
// RTV ENTITY SCHEMA MAPPING (replaces @db/schema)
// ============================================================
export const RTV_ENTITIES = {
  // Core Users
  RTVUser: 'rtv_users',
  Web3Wallet: 'web3_wallets',
  WalletIntegration: 'wallet_integrations',
  
  // Payments (Sovereign: Telegram + TON only)
  RotationPayTransaction: 'rotationpay_transactions',
  PaymentRoute: 'payment_routes',
  RotationPayMerchant: 'rotationpay_merchants',
  RTVAPIKey: 'rtv_api_keys',
  
  // Blockchain
  RTVToken: 'rtv_tokens',
  NFTAsset: 'nft_assets',
  RTVMintOperation: 'rtv_mint_operations',
  BalanceCheck: 'balance_checks',
  ChainstackNode: 'chainstack_nodes',
  Web3Session: 'web3_sessions',
  
  // Creator Economy
  LiveStream: 'live_streams',
  StreamTip: 'stream_tips',
  GiftItem: 'gift_items',
  PKBattle: 'pk_battles',
  CreatorSubscription: 'creator_subscriptions',
  CreatorPayout: 'creator_payouts',
  CreatorEarning: 'creator_earnings',
  CreatorWithdrawal: 'creator_withdrawals',
  CreatorMilestone: 'creator_milestones',
  ComboMultiplier: 'combo_multipliers',
  RevenueSplit: 'revenue_splits',
  SubscriptionTier: 'subscription_tiers',
  Leaderboard: 'leaderboards',
  AgencyRoster: 'agency_rosters',
  
  // AI & Content
  HeyGenVideo: 'heygen_videos',
  CloudflareAsset: 'cloudflare_assets',
  
  // Education
  AcademyCredit: 'academy_credits',
  
  // Voice
  VoIPNumber: 'voip_numbers',
  CallForwarding: 'call_forwarding',
  
  // Infrastructure
  RTVCompany: 'rtv_companies',
  DNSRecord: 'dns_records',
  OmegaAuditLog: 'omega_audit_logs',
  
  // Community
  MentorSession: 'mentor_sessions',
  
  // External Integrations
  EmergentIntegration: 'emergent_integrations',
  EmergentBuild: 'emergent_builds',
  ManusAITask: 'manus_ai_tasks',
  ManusWebhook: 'manus_webhooks',
  OpenClawAgent: 'openclaw_agents',
  OpenClawConfig: 'openclaw_configs',
  ReplitAgent: 'replit_agents',
};

// ============================================================
// SOVEREIGN PAYMENT HELPER
// ============================================================
export async function logTransaction(tx: {
  user_id?: string;
  amount: number;
  currency: string;
  payment_rail: 'telegram_stars' | 'ton_jetton' | 'internal_rtv';
  tx_type: string;
  signature?: string;
  status: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(RTV_ENTITIES.RotationPayTransaction)
    .insert({
      ...tx,
      amount_rtv: Math.floor(tx.amount * 100), // 1 RTV = $0.01
      blockchain_confirmed: tx.payment_rail !== 'internal_rtv',
      timestamp: new Date().toISOString(),
    });
  
  if (error) throw new Error(`Transaction log failed: ${error.message}`);
  return data;
}
