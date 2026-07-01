/**
 * RTV Environment Configuration
 * Centralized env var access for all workers and functions
 */
export function getEnv(env: Record<string, string | undefined>) {
  return {
    // Cloudflare
    CF_ACCOUNT_ID: env.CF_ACCOUNT_ID || '',
    // Telegram
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN || '',
    // Database (Supabase)
    SUPABASE_URL: env.SUPABASE_URL || 'https://xynkgaxfwvpcixissxdz.supabase.co',
    SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || '',
    SUPABASE_DB_URL: env.SUPABASE_DB_URL || '',
    // Blockchain
    TON_RPC_ENDPOINT: env.TON_RPC_ENDPOINT || '',
    SOLANA_RPC_ENDPOINT: env.SOLANA_RPC_ENDPOINT || '',
    // AI Providers
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || '',
    GEMINI_API_KEY: env.GEMINI_API_KEY || '',
    VENICE_API_KEY: env.VENICE_API_KEY || '',
    KIMI_API_KEY: env.KIMI_API_KEY || '',
    // RTV Economics
    RTV_PARITY: 0.01, // 1 RTV = $0.01 USD
    STAR_USD: 0.013,  // 1 Telegram Star = $0.013 USD
    TON_USD: 1.5,     // 1 TON ≈ $1.50 USD
    // Revenue Split (Sovereign)
    CREATOR_SHARE: 0.80,
    PLATFORM_SHARE: 0.15,
    AGENCY_SHARE: 0.05,
  };
}

/**
 * Convert USD to RTV tokens
 */
export function usdToRtv(usd: number): number {
  return Math.floor(usd / 0.01);
}

/**
 * Convert Telegram Stars to RTV
 */
export function starsToRtv(stars: number): number {
  const usd = stars * 0.013;
  return usdToRtv(usd);
}

/**
 * Convert TON to RTV
 */
export function tonToRtv(ton: number): number {
  const usd = ton * 1.5;
  return usdToRtv(usd);
}
