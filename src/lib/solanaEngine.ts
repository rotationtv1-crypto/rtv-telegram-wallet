/**
 * ROTATIONTVNETWORK LLC — SOLANA ENGINE
 *
 * Primary blockchain layer: Solana
 * RPC: Helius (primary) → QuickNode → Alchemy (fallback chain)
 *
 * Handles:
 * - USDC payments + token balances
 * - Transaction history + real-time webhooks
 * - NFT gate for premium stream access
 * - SPL token transfers ($RTVS on Solana side)
 * - Streaming payment micro-transactions
 *
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

export interface SolanaEnv {
  HELIUS_API_KEY?: string;
  QUICKNODE_RPC?: string;
  ALCHEMY_RPC?: string;
  RTVS_MINT_SOLANA?: string;   // SPL token mint address
  PLATFORM_WALLET_SOL?: string; // Platform treasury wallet
}

// ─── RPC FAILOVER CHAIN ───────────────────────────────────────────────────────

const HELIUS_RPC    = (key: string) => `https://mainnet.helius-rpc.com/?api-key=${key}`;
const QUICKNODE_RPC = (url: string) => url;
const ALCHEMY_RPC   = (url: string) => url;
const PUBLIC_RPC    = "https://api.mainnet-beta.solana.com";

function getRpcEndpoints(env: SolanaEnv): string[] {
  const endpoints: string[] = [];
  if (env.HELIUS_API_KEY)  endpoints.push(HELIUS_RPC(env.HELIUS_API_KEY));
  if (env.QUICKNODE_RPC)   endpoints.push(QUICKNODE_RPC(env.QUICKNODE_RPC));
  if (env.ALCHEMY_RPC)     endpoints.push(ALCHEMY_RPC(env.ALCHEMY_RPC));
  endpoints.push(PUBLIC_RPC); // always available fallback
  return endpoints;
}

/** JSON-RPC request with automatic RPC failover */
async function solanaRPC(
  method: string,
  params: any[],
  env: SolanaEnv
): Promise<any> {
  const endpoints = getRpcEndpoints(env);
  let lastErr: Error | null = null;

  for (const rpc of endpoints) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as any;
      if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
      return data.result;
    } catch (e: any) {
      lastErr = e;
      continue; // try next endpoint
    }
  }
  throw new Error(`All Solana RPC endpoints failed: ${lastErr?.message}`);
}

// ─── KNOWN SOLANA TOKEN MINTS ─────────────────────────────────────────────────

export const SOLANA_MINTS = {
  USDC:  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT:  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  SOL:   "So11111111111111111111111111111111111111112",
  // RTVS on Solana will be set via env.RTVS_MINT_SOLANA
} as const;

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1brs";

// ─── BALANCE QUERIES ──────────────────────────────────────────────────────────

/** Get native SOL balance for a wallet */
export async function getSolBalance(
  walletAddress: string,
  env: SolanaEnv
): Promise<{ sol: number; lamports: number }> {
  const lamports = await solanaRPC("getBalance", [walletAddress, { commitment: "confirmed" }], env);
  return { lamports, sol: lamports / 1e9 };
}

/** Get all SPL token balances for a wallet */
export async function getTokenBalances(
  walletAddress: string,
  env: SolanaEnv
): Promise<Array<{ mint: string; symbol: string; balance: number; decimals: number; uiAmount: number }>> {
  const result = await solanaRPC("getTokenAccountsByOwner", [
    walletAddress,
    { programId: TOKEN_PROGRAM_ID },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ], env);

  const accounts = result?.value ?? [];
  const balances = accounts.map((acc: any) => {
    const info = acc.account.data.parsed.info;
    const mint = info.mint;
    const decimals = info.tokenAmount.decimals;
    const uiAmount = info.tokenAmount.uiAmount ?? 0;
    const balance = parseInt(info.tokenAmount.amount ?? "0");

    // Label known mints
    let symbol = "UNKNOWN";
    if (mint === SOLANA_MINTS.USDC) symbol = "USDC";
    else if (mint === SOLANA_MINTS.USDT) symbol = "USDT";
    else if (env.RTVS_MINT_SOLANA && mint === env.RTVS_MINT_SOLANA) symbol = "RTVS";

    return { mint, symbol, balance, decimals, uiAmount };
  });

  return balances.filter(b => b.uiAmount > 0);
}

/** Get full wallet summary: SOL + all tokens */
export async function getWalletSummary(
  walletAddress: string,
  env: SolanaEnv
): Promise<{
  address: string;
  sol: { sol: number; lamports: number };
  tokens: Array<{ mint: string; symbol: string; uiAmount: number; decimals: number }>;
  usdc_balance: number;
  rtvs_balance: number;
  timestamp: string;
}> {
  const [sol, tokens] = await Promise.all([
    getSolBalance(walletAddress, env),
    getTokenBalances(walletAddress, env).catch(() => []),
  ]);

  const usdc = tokens.find(t => t.symbol === "USDC")?.uiAmount ?? 0;
  const rtvs = tokens.find(t => t.symbol === "RTVS")?.uiAmount ?? 0;

  return {
    address: walletAddress,
    sol,
    tokens,
    usdc_balance: usdc,
    rtvs_balance: rtvs,
    timestamp: new Date().toISOString(),
  };
}

// ─── TRANSACTION HISTORY ──────────────────────────────────────────────────────

/** Get recent transaction signatures for a wallet */
export async function getTransactionHistory(
  walletAddress: string,
  env: SolanaEnv,
  limit = 20
): Promise<Array<{ signature: string; slot: number; err: any; blockTime: number | null; memo: string | null }>> {
  const sigs = await solanaRPC("getSignaturesForAddress", [
    walletAddress,
    { limit, commitment: "confirmed" },
  ], env);

  return (sigs ?? []).map((s: any) => ({
    signature: s.signature,
    slot: s.slot,
    err: s.err,
    blockTime: s.blockTime,
    memo: s.memo ?? null,
  }));
}

/** Get a specific transaction's details */
export async function getTransaction(
  signature: string,
  env: SolanaEnv
): Promise<any> {
  return solanaRPC("getTransaction", [
    signature,
    { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
  ], env);
}

// ─── PAYMENT HELPERS ─────────────────────────────────────────────────────────

/**
 * Verify a Solana USDC tip payment.
 * Used after a user claims they've sent USDC — verify on-chain before crediting.
 */
export async function verifyUSDCPayment(
  signature: string,
  expectedRecipient: string,
  expectedAmountUsdc: number,
  env: SolanaEnv
): Promise<{ verified: boolean; actual_amount: number; reason?: string }> {
  try {
    const tx = await getTransaction(signature, env);
    if (!tx) return { verified: false, actual_amount: 0, reason: "Transaction not found" };

    const meta = tx.meta;
    if (meta?.err) return { verified: false, actual_amount: 0, reason: "Transaction failed on-chain" };

    // Scan token balance changes for USDC transfer to expected recipient
    const postBalances = meta?.postTokenBalances ?? [];
    const preBalances  = meta?.preTokenBalances  ?? [];

    for (const post of postBalances) {
      if (post.mint !== SOLANA_MINTS.USDC) continue;
      if (post.owner !== expectedRecipient) continue;

      const pre = preBalances.find((p: any) => p.accountIndex === post.accountIndex);
      const preAmount  = pre?.uiTokenAmount?.uiAmount ?? 0;
      const postAmount = post.uiTokenAmount?.uiAmount ?? 0;
      const received   = postAmount - preAmount;

      if (received >= expectedAmountUsdc * 0.99) { // 1% slippage tolerance
        return { verified: true, actual_amount: received };
      }
    }

    return { verified: false, actual_amount: 0, reason: "USDC transfer to recipient not found in transaction" };
  } catch (e: any) {
    return { verified: false, actual_amount: 0, reason: e.message };
  }
}

// ─── NFT GATE ─────────────────────────────────────────────────────────────────

/**
 * Check if a wallet holds a specific NFT (for premium stream access).
 * Uses Helius DAS API (Digital Asset Standard) for NFT lookup.
 */
export async function checkNFTGate(
  walletAddress: string,
  collectionAddress: string,
  env: SolanaEnv
): Promise<{ holds: boolean; count: number; assets: string[] }> {
  if (!env.HELIUS_API_KEY) {
    return { holds: false, count: 0, assets: [] };
  }

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "rtv-nft-gate",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: { showCollectionMetadata: true },
        },
      }),
    });

    const data = await res.json() as any;
    const items = data?.result?.items ?? [];

    const matching = items.filter((asset: any) =>
      asset?.grouping?.some((g: any) =>
        g.group_key === "collection" && g.group_value === collectionAddress
      )
    );

    return {
      holds: matching.length > 0,
      count: matching.length,
      assets: matching.map((a: any) => a.id),
    };
  } catch {
    return { holds: false, count: 0, assets: [] };
  }
}

// ─── WEBSOCKET SUBSCRIPTION BUILDER ──────────────────────────────────────────

/**
 * Build the WebSocket subscription payload for real-time account monitoring.
 * Use this in a separate WebSocket connection to wss://mainnet.helius-rpc.com/
 */
export function buildAccountSubscription(walletAddress: string): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "accountSubscribe",
    params: [walletAddress, { encoding: "base64", commitment: "confirmed" }],
  });
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export async function routeSolanaRequest(
  request: Request,
  url: URL,
  env: SolanaEnv
): Promise<Response | null> {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  const path = url.pathname;

  // GET /api/solana/health
  if (path === "/api/solana/health" && request.method === "GET") {
    const rpcs = getRpcEndpoints(env);
    return json({
      status: "ok",
      rpc_count: rpcs.length,
      primary_rpc: env.HELIUS_API_KEY ? "helius" : env.QUICKNODE_RPC ? "quicknode" : "public",
      rtvs_mint: env.RTVS_MINT_SOLANA ?? "not_set",
      platform_wallet: env.PLATFORM_WALLET_SOL ?? "not_set",
      known_mints: SOLANA_MINTS,
    });
  }

  // GET /api/solana/balance?wallet=...
  if (path === "/api/solana/balance" && request.method === "GET") {
    const wallet = url.searchParams.get("wallet");
    if (!wallet) return json({ error: "wallet param required" }, 400);
    try {
      const summary = await getWalletSummary(wallet, env);
      return json({ success: true, ...summary });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // GET /api/solana/history?wallet=...&limit=20
  if (path === "/api/solana/history" && request.method === "GET") {
    const wallet = url.searchParams.get("wallet");
    const limit  = parseInt(url.searchParams.get("limit") ?? "20");
    if (!wallet) return json({ error: "wallet param required" }, 400);
    try {
      const history = await getTransactionHistory(wallet, env, Math.min(limit, 50));
      return json({ success: true, transactions: history, count: history.length });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // GET /api/solana/tx?sig=...
  if (path === "/api/solana/tx" && request.method === "GET") {
    const sig = url.searchParams.get("sig");
    if (!sig) return json({ error: "sig param required" }, 400);
    try {
      const tx = await getTransaction(sig, env);
      return json({ success: true, transaction: tx });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // POST /api/solana/verify-payment
  if (path === "/api/solana/verify-payment" && request.method === "POST") {
    try {
      const { signature, recipient, amount_usdc } = await request.json() as any;
      if (!signature || !recipient || !amount_usdc)
        return json({ error: "signature, recipient, amount_usdc required" }, 400);
      const result = await verifyUSDCPayment(signature, recipient, amount_usdc, env);
      return json({ success: true, ...result });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // POST /api/solana/nft-gate
  if (path === "/api/solana/nft-gate" && request.method === "POST") {
    try {
      const { wallet, collection } = await request.json() as any;
      if (!wallet || !collection) return json({ error: "wallet and collection required" }, 400);
      const result = await checkNFTGate(wallet, collection, env);
      return json({ success: true, ...result });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  return null; // not a Solana route
}
