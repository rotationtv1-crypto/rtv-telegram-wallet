/**
 * RTV Entity Schema Definitions
 * These map to Base44 entity schemas and Supabase tables
 */
export const ENTITIES = {
  // Users
  RTVUser: 'rtv_users',
  Web3Wallet: 'web3_wallets',
  WalletIntegration: 'wallet_integrations',
  // Payments (Sovereign)
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
} as const;

export type EntityName = keyof typeof ENTITIES;

/**
 * Sovereign payment rails (Stripe PURGED)
 */
export const SOVEREIGN_RAILS = ['telegram_stars', 'ton_jetton', 'internal_rtv'] as const;
export const PURGED_RAILS = ['stripe', 'paypal', 'venmo', 'zelle', 'coinbase', 'nmi', 'solana'] as const;
