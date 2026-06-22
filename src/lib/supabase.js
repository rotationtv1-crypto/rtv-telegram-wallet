/**
 * rtv-telegram-wallet — Supabase client
 */

// Keys: SUPABASE_SECRET_KEY (sb_secret_...) for server | NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...) for client
// Both require: apikey header + Authorization: Bearer header
const SUPABASE_URL = 'https://xynkgaxfwvpcixissxdz.supabase.co';

function getKey() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return key;
}

async function sbFetch(path, opts = {}) {
  const key = getKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${opts.method || 'GET'} ${path} → ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

module.exports = {
  async getWallet(telegramId) {
    const rows = await sbFetch(`/rtv_wallets?telegram_id=eq.${telegramId}&limit=1`);
    return rows?.[0] ?? null;
  },

  async createWallet(telegramId, username) {
    const walletAddress = `RTV${String(telegramId).slice(-8)}${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const record = {
      telegram_id: String(telegramId),
      username: username || null,
      wallet_address: walletAddress,
      rtv_balance: 0,
      usdt_balance: 0,
      ton_balance: 0,
      apy_rate: 4.5,
      staked_rtv: 0,
      referral_code: `RTV${String(telegramId).slice(-4)}X${Math.floor(Math.random()*99)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return sbFetch('/rtv_wallets', {
      method: 'POST',
      body: JSON.stringify(record),
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    });
  },

  async creditRtv(telegramId, amount) {
    try {
      return await sbFetch('/rpc/credit_rtv', {
        method: 'POST',
        body: JSON.stringify({ p_telegram_id: String(telegramId), p_amount: amount }),
      });
    } catch {
      // Fallback: direct update
      const wallet = await this.getWallet(telegramId);
      if (!wallet) return null;
      return sbFetch(`/rtv_wallets?telegram_id=eq.${telegramId}`, {
        method: 'PATCH',
        body: JSON.stringify({ rtv_balance: (wallet.rtv_balance || 0) + amount, updated_at: new Date().toISOString() }),
        prefer: 'return=representation',
      });
    }
  },

  async recordTransaction(record) {
    return sbFetch('/rtv_transactions', {
      method: 'POST',
      body: JSON.stringify({ ...record, created_at: new Date().toISOString() }),
      prefer: 'return=minimal',
    }).catch(err => console.warn('[TelegramWallet] tx persist failed:', err.message));
  },

  async getFaucetConfig() {
    const rows = await sbFetch('/faucet_config?limit=1');
    return rows?.[0] ?? { daily_amount: 100, cooldown_hours: 24 };
  },

  async checkFaucetClaim(telegramId) {
    const rows = await sbFetch(
      `/faucet_claims?telegram_id=eq.${telegramId}&order=created_at.desc&limit=1`
    );
    return rows?.[0] ?? null;
  },

  async recordFaucetClaim(telegramId, amount) {
    return sbFetch('/faucet_claims', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: String(telegramId),
        amount,
        created_at: new Date().toISOString(),
      }),
      prefer: 'return=minimal',
    });
  },

  async getTokenConfig() {
    const rows = await sbFetch('/rtv_token_config?limit=1');
    return rows?.[0] ?? null;
  },

  async getSovereignWallet() {
    const rows = await sbFetch('/sovereign_wallets?limit=1');
    return rows?.[0] ?? null;
  },

  async auditLog(action, meta = {}) {
    return sbFetch('/audit_log', {
      method: 'POST',
      body: JSON.stringify({ action, metadata: meta, created_at: new Date().toISOString() }),
      prefer: 'return=minimal',
    }).catch(() => {});
  },
};
