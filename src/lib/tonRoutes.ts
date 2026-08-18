/**
 * TON ROUTES — Full Chainstack API Coverage + Jetton Transfer / Mining Claim
 * Exposes all TON v2 + v3 methods as worker endpoints
 * Rotationtvnetwork LLC | June 28, 2026 | Updated Aug 2026
 */

import { prepareTransferRoute } from './jettonTransfer';
import { miningClaimRoute } from './miningClaim';

const V2 = "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2";
const V3 = "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3";
const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

async function tonV2(method: string, params?: Record<string, string>): Promise<any> {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${V2}/${method}${q}`);
  return res.json();
}

async function tonV3(path: string, params?: Record<string, string>): Promise<any> {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${V3}/${path}${q}`);
  return res.json();
}

export async function routeTONRequest(
  request: Request,
  url: URL,
  env?: any
): Promise<Response | null> {
  const p = url.pathname;
  const q = Object.fromEntries(url.searchParams.entries());
  const ok = (d: any) => new Response(JSON.stringify(d), { headers: CORS });

  // ── Jetton prepare-transfer (unsigned payload for TonConnect) ─────────────
  if (p === "/api/ton/jetton/prepare-transfer" && request.method === "POST") {
    if (!env?.RTVS_JETTON) {
      return Response.json({ ok: false, error: "RTVS_JETTON secret not configured" }, { status: 503, headers: CORS });
    }
    const chainstackV3 = env.CHAINSTACK_V3 || env.CHAINSTACK_TON_RPC_V3 || V3;
    return prepareTransferRoute(request, {
      RTVS_JETTON: env.RTVS_JETTON,
      CHAINSTACK_V3: chainstackV3,
    });
  }

  // ── Mining → Jetton claim ─────────────────────────────────────────────────
  if (p === "/api/ton/mining/claim" && request.method === "POST") {
    if (!env?.RTVS_JETTON || !env?.TREASURY_JETTON_WALLET) {
      return Response.json({ ok: false, error: "RTVS_JETTON / TREASURY_JETTON_WALLET secrets required" }, { status: 503, headers: CORS });
    }
    const chainstackV3 = env.CHAINSTACK_V3 || env.CHAINSTACK_TON_RPC_V3 || V3;
    return miningClaimRoute(request, {
      RTVS_JETTON: env.RTVS_JETTON,
      CHAINSTACK_V3: chainstackV3,
      TREASURY_JETTON_WALLET: env.TREASURY_JETTON_WALLET,
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
      POINTS_TO_RTVS: env.POINTS_TO_RTVS ? Number(env.POINTS_TO_RTVS) : undefined,
    });
  }

  // ── HEALTH ────────────────────────────────────────────────────────────────
  if (p === "/api/ton/health" || p === "/api/ton/metrics") {
    const [v2, v3] = await Promise.all([
      tonV2("getMasterchainInfo"),
      tonV3("masterchainInfo"),
    ]);
    return ok({
      status: "ok", v2_seqno: v2.result?.last?.seqno,
      v3_seqno: v3.last?.seqno,
      timestamp: new Date().toISOString(),
    });
  }

  // ── ACCOUNT / WALLET ──────────────────────────────────────────────────────
  if (p === "/api/ton/account" && q.address) {
    return ok(await tonV3("account", { address: q.address }));
  }
  if (p === "/api/ton/balance" && q.address) {
    const d = await tonV2("getAddressBalance", { address: q.address });
    const nanotons = typeof d === "string" ? d : (d.result || "0");
    return ok({ address: q.address, balance_ton: (Number(nanotons) / 1e9).toFixed(9), nanotons });
  }
  if (p === "/api/ton/wallet" && q.address) {
    return ok(await tonV3("wallet", { address: q.address }));
  }
  if (p === "/api/ton/address-info" && q.address) {
    return ok(await tonV2("getAddressInformation", { address: q.address }));
  }

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  if (p === "/api/ton/transactions" && q.address) {
    const limit = q.limit || "20";
    return ok(await tonV3("transactions", { account: q.address, limit, sort: "desc" }));
  }
  if (p === "/api/ton/events" && q.address) {
    return ok(await tonV3("events", { account: q.address, limit: q.limit || "50" }));
  }
  if (p === "/api/ton/pending" && q.address) {
    return ok(await tonV3("pendingTransactions", { account: q.address }));
  }

  // ── JETTON ($RTVS) ────────────────────────────────────────────────────────
  if (p === "/api/ton/jetton/balance" && q.owner && q.jetton) {
    return ok(await tonV3("jetton/wallets", { owner_address: q.owner, jetton_address: q.jetton }));
  }
  if (p === "/api/ton/jetton/transfers" && q.address) {
    const params: Record<string, string> = { account: q.address, limit: q.limit || "50" };
    if (q.jetton) params.jetton_address = q.jetton;
    return ok(await tonV3("jetton/transfers", params));
  }
  if (p === "/api/ton/jetton/metadata" && q.address) {
    return ok(await tonV3("jetton/masters", { address: q.address }));
  }
  if (p === "/api/ton/jetton/holders" && q.address) {
    return ok(await tonV3("jetton/wallets", { jetton_address: q.address, limit: q.limit || "100" }));
  }

  // ── NFT ────────────────────────────────────────────────────────────────────
  if (p === "/api/ton/nft/owned" && q.address) {
    return ok(await tonV3("nft/items", { owner_address: q.address, limit: q.limit || "50" }));
  }
  if (p === "/api/ton/nft/check" && q.address && q.collection) {
    const d = await tonV3("nft/items", { owner_address: q.address, collection: q.collection, limit: "1" });
    const owned = (d as any)?.nft_items?.length > 0;
    return ok({ owns_nft: owned, collection: q.collection, owner: q.address });
  }

  // ── SEND ──────────────────────────────────────────────────────────────────
  if (p === "/api/ton/send" && request.method === "POST") {
    const body = await request.json() as { boc: string };
    const result = await fetch(`${V2}/sendBocReturnHash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boc: body.boc }),
    });
    return ok(await result.json());
  }

  // ── LEADERBOARD (top accounts by TON balance) ─────────────────────────────
  if (p === "/api/ton/leaderboard") {
    return ok(await tonV3("topAccountsByBalance", { limit: q.limit || "20" }));
  }

  // ── CHAIN STATS ────────────────────────────────────────────────────────────
  if (p === "/api/ton/block" && q.seqno) {
    return ok(await tonV2("getBlockHeader", { workchain: "-1", shard: "8000000000000000", seqno: q.seqno }));
  }
  if (p === "/api/ton/consensus") {
    return ok(await tonV2("getConsensusBlock"));
  }

  return null; // not a TON route
}
