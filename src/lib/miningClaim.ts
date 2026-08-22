/**
 * RotationTV — Mining Reward → Jetton Claim
 * =========================================
 * Converts scored mining activity into a claimable Jetton transfer.
 * Flow:
 *  1. User accumulates points via processMiningReward (tonTradingEngine)
 *  2. User calls /api/ton/mining/claim
 *  3. Worker verifies score, deducts, prepares or executes transfer from treasury
 *
 * Entity: Darrel-spell-living-trust
 * Production model: prepare unsigned transfer (safer) or treasury-signed (admin only)
 */

export interface MiningClaimEnv {
  RTVS_JETTON: string;
  CHAINSTACK_V3: string;
  /** Platform treasury Jetton wallet (holds claimable rewards) */
  TREASURY_JETTON_WALLET: string;
  /** Optional: Analytics / D1 / Supabase for score ledger */
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** Conversion rate: 1 mining point = X RTVS */
  POINTS_TO_RTVS?: number;
}

export interface ClaimRequest {
  user_id: string;
  wallet_address: string; // TON address that will receive RTVS
  points_to_claim: number;
}

export interface ClaimResult {
  ok: boolean;
  claimed_points?: number;
  rtvs_amount?: number;
  prepared?: {
    to: string;
    value: string;
    body: string;
  };
  tx_hash?: string;
  error?: string;
  remaining_points?: number;
}

const DEFAULT_RATE = 0.01; // 100 points = 1 RTVS (tune in env)

/**
 * Fetch current claimable points for a user.
 * Replace the Supabase call with your actual ledger (D1, KV, Analytics).
 */
async function getClaimablePoints(
  userId: string,
  env: MiningClaimEnv
): Promise<{ points: number; last_claim_at?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    // Fallback / demo mode — return 0 so production never invents balances
    return { points: 0 };
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/mining_scores?user_id=eq.${encodeURIComponent(userId)}&select=points,last_claim_at`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) return { points: 0 };
  const rows = await res.json() as any[];
  return {
    points: rows[0]?.points ?? 0,
    last_claim_at: rows[0]?.last_claim_at,
  };
}

/**
 * Atomically deduct claimed points (SECURITY DEFINER style).
 */
async function deductPoints(
  userId: string,
  points: number,
  env: MiningClaimEnv
): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;

  // Prefer an RPC: claim_mining_points(user_id, points)
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/claim_mining_points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_user_id: userId, p_points: points }),
  });
  return res.ok;
}

/**
 * Prepare a Jetton transfer from treasury → user.
 * Uses the same builder as Task 1.
 */
import { buildJettonTransfer } from './jettonTransfer';

export async function prepareMiningClaim(
  req: ClaimRequest,
  env: MiningClaimEnv
): Promise<ClaimResult> {
  if (!req.user_id || !req.wallet_address || req.points_to_claim <= 0) {
    return { ok: false, error: 'user_id, wallet_address, points_to_claim required' };
  }

  const { points } = await getClaimablePoints(req.user_id, env);
  if (points < req.points_to_claim) {
    return {
      ok: false,
      error: 'Insufficient claimable points',
      remaining_points: points,
    };
  }

  const rate = env.POINTS_TO_RTVS ?? DEFAULT_RATE;
  const rtvsAmount = Number((req.points_to_claim * rate).toFixed(9));
  if (rtvsAmount <= 0) {
    return { ok: false, error: 'Claim amount too small after conversion' };
  }

  // Deduct first (prevent double-claim)
  const deducted = await deductPoints(req.user_id, req.points_to_claim, env);
  if (!deducted) {
    return { ok: false, error: 'Failed to lock points — try again' };
  }

  // Prepare transfer from treasury Jetton wallet → user
  const prepared = buildJettonTransfer({
    jettonWalletAddress: env.TREASURY_JETTON_WALLET,
    toAddress: req.wallet_address,
    amount: rtvsAmount,
    comment: `RTV mining claim | ${req.user_id} | ${req.points_to_claim} pts`,
    responseAddress: env.TREASURY_JETTON_WALLET,
  });

  return {
    ok: true,
    claimed_points: req.points_to_claim,
    rtvs_amount: rtvsAmount,
    prepared: {
      to: prepared.to,
      value: prepared.value,
      body: prepared.body,
    },
    remaining_points: points - req.points_to_claim,
  };
}

/**
 * Worker route: POST /api/ton/mining/claim
 * Body: { user_id, wallet_address, points_to_claim }
 *
 * Returns a prepared transfer that an authorized treasury signer
 * (or admin bot) must sign and broadcast.
 * For fully automated payouts, move signing to a secure offline / KMS path.
 */
export async function miningClaimRoute(
  request: Request,
  env: MiningClaimEnv
): Promise<Response> {
  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json() as ClaimRequest;
    const result = await prepareMiningClaim(body, env);
    return Response.json(result, {
      status: result.ok ? 200 : 400,
      headers: CORS,
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500, headers: CORS });
  }
}
