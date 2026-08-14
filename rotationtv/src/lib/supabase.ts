/**
 * ROTATIONTVNETWORK LLC — SUPABASE FULL INTEGRATION
 * 
 * Architecture:
 *   Telegram Bot → Supabase Auth → PostgreSQL → Realtime → Storage → Edge Functions
 * 
 * Project: xynkgaxfwvpcixissxdz.supabase.co
 * Presidential Authority: Darrel
 */

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_creator: boolean;
  is_verified: boolean;
  verified_age: boolean;
  rtv_balance: number;
  total_earnings: number;
  total_followers: number;
  total_views: number;
  role: 'viewer' | 'creator' | 'agency' | 'admin';
  ecosystem: string;
  created_at: string;
  updated_at: string;
}

export interface LiveStream {
  id: string;
  creator_id: string;
  title: string;
  category: string;
  stream_url: string;
  stream_key: string;
  cloudflare_stream_id: string | null;
  cloudflare_playback_url: string | null;
  thumbnail_url: string | null;
  status: 'offline' | 'live' | 'ended';
  started_at: string | null;
  ended_at: string | null;
  peak_viewers: number;
  viewer_count: number;
  total_viewers: number;
  total_tips: number;
  is_archived: boolean;
  is_recording: boolean;
  recording_url: string | null;
  tags: string[];
  creator?: User;
  created_at: string;
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  price: number;       // in RTV
  price_usd: number;
  category: string;
  animation_url: string | null;
}

export interface Tip {
  id: string;
  stream_id: string;
  sender_id: string;
  receiver_id: string;
  amount_rtv: number;
  amount_usd: number;
  gift_id: string | null;
  gift_name: string | null;
  gift_emoji: string | null;
  combo_count: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount_rtv: number;
  amount_usd: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  ton_address: string;
  ton_tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface Agency {
  id: string;
  owner_id: string;
  agency_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  creator_count: number;
  monthly_revenue_usd: number;
  commission_rate: number;
  revenue_share_pct: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  tier: 'standard' | 'premium' | 'enterprise';
  stripe_account_id: string | null;
  api_key: string | null;
  created_at: string;
}

export interface Creator {
  id: string;
  agency_id: string | null;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  tier: 'standard' | 'verified' | 'premium';
  stream_key: string | null;
  stream_active: boolean;
  ton_wallet_address: string | null;
  balance_ton: number;
  balance_usd: number;
  total_earnings_usd: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  creator_id: string;
  agency_id: string | null;
  tx_type: 'deposit' | 'tip' | 'withdrawal' | 'payout' | 'referral_bonus' | 'adjustment';
  amount_usd: number;
  amount_ton: number | null;
  ton_tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ─── CLOUDFLARE WORKER SUPABASE CLIENT ────────────────────────────────────
// (No @supabase/supabase-js in Workers — use fetch directly)

export class SupabaseWorkerClient {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url.replace(/\/$/, '');
    this.key = key;
  }

  private get headers() {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
  }

  // SELECT
  async select<T = any>(table: string, query?: string): Promise<T[]> {
    const url = `${this.url}/rest/v1/${table}${query ? '?' + query : ''}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      console.error(`Supabase SELECT error [${table}]:`, await res.text());
      return [];
    }
    return res.json();
  }

  // SELECT SINGLE
  async selectOne<T = any>(table: string, query: string): Promise<T | null> {
    const rows = await this.select<T>(table, query + '&limit=1');
    return rows.length > 0 ? rows[0] : null;
  }

  // INSERT
  async insert<T = any>(table: string, data: Partial<T>): Promise<T | null> {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error(`Supabase INSERT error [${table}]:`, await res.text());
      return null;
    }
    const result = await res.json();
    return Array.isArray(result) ? result[0] : result;
  }

  // UPSERT
  async upsert<T = any>(table: string, data: Partial<T>, onConflict: string): Promise<T | null> {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...this.headers, Prefer: `resolution=merge-duplicates,return=representation` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error(`Supabase UPSERT error [${table}]:`, await res.text());
      return null;
    }
    const result = await res.json();
    return Array.isArray(result) ? result[0] : result;
  }

  // UPDATE
  async update<T = any>(table: string, filter: string, data: Partial<T>): Promise<boolean> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error(`Supabase UPDATE error [${table}]:`, await res.text());
      return false;
    }
    return true;
  }

  // DELETE
  async delete(table: string, filter: string): Promise<boolean> {
    const res = await fetch(`${this.url}/rest/v1/${table}?${filter}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    return res.ok;
  }

  // RPC (stored procedures / edge functions)
  async rpc(fn: string, params: Record<string, any>): Promise<any> {
    const res = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.error(`Supabase RPC error [${fn}]:`, await res.text());
      return null;
    }
    return res.json();
  }

  // Edge Function invoke
  async invokeFunction(fn: string, payload: Record<string, any>): Promise<any> {
    const res = await fetch(`${this.url}/functions/v1/${fn}`, {
      method: 'POST',
      headers: { ...this.headers, Authorization: `Bearer ${this.key}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Supabase Function error [${fn}]:`, await res.text());
      return null;
    }
    return res.json();
  }
}

// ─── FACTORY ──────────────────────────────────────────────────────────────

export function createSupabaseClient(env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }): SupabaseWorkerClient {
  return new SupabaseWorkerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}

// ─── USER OPERATIONS ──────────────────────────────────────────────────────

export async function getCurrentUser(db: SupabaseWorkerClient, telegramId: number): Promise<User | null> {
  return db.selectOne<User>('users', `telegram_id=eq.${telegramId}&select=*`);
}

export async function authenticateTelegramUser(
  db: SupabaseWorkerClient,
  telegramId: number,
  username: string,
  displayName: string,
  avatarUrl?: string
): Promise<User> {
  const existing = await getCurrentUser(db, telegramId);

  if (existing) {
    await db.update('users', `telegram_id=eq.${telegramId}`, {
      updated_at: new Date().toISOString(),
      username,
      display_name: displayName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    });
    return { ...existing, username, display_name: displayName };
  }

  const newUser = await db.insert<User>('users', {
    telegram_id: telegramId,
    username,
    display_name: displayName,
    avatar_url: avatarUrl ?? null,
    is_creator: false,
    is_verified: false,
    verified_age: false,
    rtv_balance: 0,
    total_earnings: 0,
    total_followers: 0,
    total_views: 0,
    role: 'viewer',
    ecosystem: 'rotationtv',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (!newUser) throw new Error('Failed to create user');
  return newUser;
}

export async function verifyUserAge(db: SupabaseWorkerClient, telegramId: number): Promise<boolean> {
  return db.update('users', `telegram_id=eq.${telegramId}`, {
    verified_age: true,
    updated_at: new Date().toISOString(),
  });
}

export async function updateRTVBalance(db: SupabaseWorkerClient, telegramId: number, delta: number): Promise<boolean> {
  const user = await getCurrentUser(db, telegramId);
  if (!user) return false;
  const newBalance = Math.max(0, (user.rtv_balance || 0) + delta);
  return db.update('users', `telegram_id=eq.${telegramId}`, {
    rtv_balance: newBalance,
    updated_at: new Date().toISOString(),
  });
}

// ─── STREAM OPERATIONS ────────────────────────────────────────────────────

export async function getLiveStreams(db: SupabaseWorkerClient, limit = 20): Promise<LiveStream[]> {
  return db.select<LiveStream>('streams', `status=eq.live&order=viewer_count.desc&limit=${limit}&select=*,creators(*)`);
}

export async function getStreamByKey(db: SupabaseWorkerClient, streamKey: string): Promise<LiveStream | null> {
  return db.selectOne<LiveStream>('streams', `stream_key=eq.${streamKey}&select=*`);
}

export async function createStream(db: SupabaseWorkerClient, creatorId: string, data: Partial<LiveStream>): Promise<LiveStream | null> {
  return db.insert<LiveStream>('streams', {
    ...data,
    creator_id: creatorId,
    status: 'offline',
    viewer_count: 0,
    peak_viewers: 0,
    total_tips: 0,
    is_recording: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  });
}

export async function updateStreamStatus(
  db: SupabaseWorkerClient,
  streamKey: string,
  status: 'offline' | 'live' | 'ended'
): Promise<boolean> {
  const now = new Date().toISOString();
  return db.update('streams', `stream_key=eq.${streamKey}`, {
    status,
    ...(status === 'live' ? { started_at: now } : {}),
    ...(status === 'ended' ? { ended_at: now } : {}),
  });
}

export async function updateViewerCount(db: SupabaseWorkerClient, streamId: string, count: number): Promise<boolean> {
  return db.update('streams', `id=eq.${streamId}`, {
    viewer_count: count,
  });
}

// ─── TIP / TRANSACTION OPERATIONS ─────────────────────────────────────────

export async function logTip(db: SupabaseWorkerClient, tip: Partial<Tip>): Promise<Tip | null> {
  return db.insert<Tip>('transactions', {
    creator_id: tip.receiver_id,
    tx_type: 'tip',
    amount_usd: tip.amount_usd ?? 0,
    status: 'confirmed',
    description: tip.message ?? `${tip.gift_emoji ?? '💸'} ${tip.gift_name ?? 'Tip'}`,
    metadata: {
      stream_id: tip.stream_id,
      sender_id: tip.sender_id,
      gift_id: tip.gift_id,
      gift_name: tip.gift_name,
      combo_count: tip.combo_count ?? 1,
      amount_rtv: tip.amount_rtv,
    },
    created_at: new Date().toISOString(),
  });
}

export async function getCreatorEarnings(
  db: SupabaseWorkerClient,
  creatorId: string,
  since?: string
): Promise<{ total_rtv: number; total_usd: number; tip_count: number }> {
  const query = `creator_id=eq.${creatorId}&tx_type=eq.tip&status=eq.confirmed${since ? `&created_at=gte.${since}` : ''}`;
  const txs = await db.select<Transaction>('transactions', query);
  return {
    total_rtv: txs.reduce((s, t) => s + (t.metadata?.amount_rtv ?? 0), 0),
    total_usd: txs.reduce((s, t) => s + t.amount_usd, 0),
    tip_count: txs.length,
  };
}

// ─── AGENCY OPERATIONS ────────────────────────────────────────────────────

export async function getAgency(db: SupabaseWorkerClient, agencyId: string): Promise<Agency | null> {
  return db.selectOne<Agency>('agencies', `id=eq.${agencyId}&select=*`);
}

export async function getCreatorsByAgency(db: SupabaseWorkerClient, agencyId: string): Promise<Creator[]> {
  return db.select<Creator>('creators', `agency_id=eq.${agencyId}&status=eq.active&select=*`);
}

// ─── PAYOUT OPERATIONS ────────────────────────────────────────────────────

export async function requestWithdrawal(
  db: SupabaseWorkerClient,
  userId: string,
  amountRtv: number,
  tonAddress: string
): Promise<Withdrawal | null> {
  const amountUsd = +(amountRtv * 0.01).toFixed(2);
  if (amountUsd < 10) throw new Error('Minimum withdrawal is 1000 RTV ($10 USD)');

  return db.insert<Withdrawal>('transactions', {
    creator_id: userId,
    tx_type: 'withdrawal',
    amount_usd: amountUsd,
    status: 'pending',
    description: `Withdrawal of ${amountRtv} RTVS to ${tonAddress}`,
    metadata: { amount_rtv: amountRtv, ton_address: tonAddress },
    created_at: new Date().toISOString(),
  } as any);
}

// ─── REFERRAL OPERATIONS ──────────────────────────────────────────────────

export async function applyReferralCode(db: SupabaseWorkerClient, newUserId: string, referralCode: string): Promise<boolean> {
  const referrer = await db.selectOne<Creator>('creators', `referral_code=eq.${referralCode}&status=eq.active`);
  if (!referrer) return false;

  await db.insert('referrals', {
    referrer_id: referrer.id,
    referred_creator_id: newUserId,
    referral_code: referralCode,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  return true;
}

// ─── WEBHOOK IDEMPOTENCY ──────────────────────────────────────────────────

export async function isWebhookProcessed(db: SupabaseWorkerClient, eventId: string): Promise<boolean> {
  const event = await db.selectOne('webhook_events', `event_id=eq.${eventId}&processed=eq.true`);
  return !!event;
}

export async function markWebhookProcessed(db: SupabaseWorkerClient, source: string, eventId: string, eventType: string, payload: any): Promise<void> {
  await db.upsert('webhook_events', {
    source,
    event_id: eventId,
    event_type: eventType,
    payload,
    processed: true,
    processed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }, 'event_id');
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────

export async function checkSupabaseHealth(url: string, anonKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey },
    });
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

// ─── NEXT.JS / BROWSER CLIENT (for RotationErotica Next.js app) ───────────
// NOTE: Install @supabase/supabase-js for use outside Workers

/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Public browser client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (never expose to browser)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
*/
