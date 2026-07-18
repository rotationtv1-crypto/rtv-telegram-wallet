/**
 * ROTATIONTVNETWORK LLC — CROSS-CHAIN BRIDGE
 *
 * TON ↔ Solana bridge via Symbiosis Finance
 * Supported pairs: TON/SOL · USDC/TON · SOL/USDT
 *
 * Flow:
 *   User initiates swap → Symbiosis quotes → User signs →
 *   Symbiosis relayers execute atomic cross-chain swap →
 *   Funds arrive on destination chain in ~30-60 seconds
 *
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

const SYMBIOSIS_API = "https://api-v2.symbiosis.finance/crosschain/v1";

// Symbiosis chain IDs
export const CHAIN_IDS = {
  TON:     39842,  // TON mainnet
  SOLANA:  1399811149, // Solana mainnet (Symbiosis internal ID)
  ETH:     1,
  BSC:     56,
  POLYGON: 137,
} as const;

// Known token addresses for bridge pairs
export const BRIDGE_TOKENS = {
  TON: {
    native:  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",  // native TON
    USDT:    "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA",  // jUSDT on TON
    USDC:    "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",  // jUSDC on TON
  },
  SOLANA: {
    native:  "So11111111111111111111111111111111111111112",          // wrapped SOL
    USDC:    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",       // USDC
    USDT:    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",       // USDT
  },
} as const;

export interface BridgeEnv {
  SYMBIOSIS_API_KEY?: string;  // optional — Symbiosis has free tier
  PLATFORM_WALLET_TON?: string;
  PLATFORM_WALLET_SOL?: string;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SwapQuote {
  from_chain: string;
  to_chain: string;
  from_token: string;
  to_token: string;
  from_amount: string;        // human-readable
  to_amount_expected: string; // human-readable
  to_amount_min: string;      // after slippage
  price_impact_pct: number;
  fee_usd: number;
  estimated_time_sec: number;
  route: string[];
  tx_data?: any;              // Symbiosis transaction payload
}

export interface BridgeStatus {
  tx_hash: string;
  status: "pending" | "in_progress" | "success" | "failed" | "stuck";
  from_chain: string;
  to_chain: string;
  percent_complete: number;
  error?: string;
}

// ─── QUOTE ENGINE ─────────────────────────────────────────────────────────────

/**
 * Get a cross-chain swap quote from Symbiosis.
 * Pair examples: "TON/SOL", "USDC/TON", "SOL/USDT"
 */
export async function getBridgeQuote(
  pair: "TON/SOL" | "USDC/TON" | "SOL/USDT" | "TON/USDT" | "SOL/TON",
  amount: number, // human-readable (e.g. 10 TON)
  fromAddress: string,
  toAddress: string,
  env: BridgeEnv
): Promise<{ success: boolean; quote?: SwapQuote; error?: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.SYMBIOSIS_API_KEY) headers["Authorization"] = `Bearer ${env.SYMBIOSIS_API_KEY}`;

  // Map pair to token addresses + chain IDs
  const pairMap: Record<string, {
    tokenAmountIn: any;
    tokenOut: any;
    from: number;
    to: number;
  }> = {
    "TON/SOL": {
      tokenAmountIn: { chainId: CHAIN_IDS.TON, address: BRIDGE_TOKENS.TON.native, amount: String(Math.floor(amount * 1e9)) },
      tokenOut:      { chainId: CHAIN_IDS.SOLANA, address: BRIDGE_TOKENS.SOLANA.native },
      from: CHAIN_IDS.TON, to: CHAIN_IDS.SOLANA,
    },
    "SOL/TON": {
      tokenAmountIn: { chainId: CHAIN_IDS.SOLANA, address: BRIDGE_TOKENS.SOLANA.native, amount: String(Math.floor(amount * 1e9)) },
      tokenOut:      { chainId: CHAIN_IDS.TON, address: BRIDGE_TOKENS.TON.native },
      from: CHAIN_IDS.SOLANA, to: CHAIN_IDS.TON,
    },
    "USDC/TON": {
      tokenAmountIn: { chainId: CHAIN_IDS.SOLANA, address: BRIDGE_TOKENS.SOLANA.USDC, amount: String(Math.floor(amount * 1e6)) },
      tokenOut:      { chainId: CHAIN_IDS.TON, address: BRIDGE_TOKENS.TON.USDC },
      from: CHAIN_IDS.SOLANA, to: CHAIN_IDS.TON,
    },
    "SOL/USDT": {
      tokenAmountIn: { chainId: CHAIN_IDS.SOLANA, address: BRIDGE_TOKENS.SOLANA.native, amount: String(Math.floor(amount * 1e9)) },
      tokenOut:      { chainId: CHAIN_IDS.SOLANA, address: BRIDGE_TOKENS.SOLANA.USDT },
      from: CHAIN_IDS.SOLANA, to: CHAIN_IDS.SOLANA,
    },
    "TON/USDT": {
      tokenAmountIn: { chainId: CHAIN_IDS.TON, address: BRIDGE_TOKENS.TON.native, amount: String(Math.floor(amount * 1e9)) },
      tokenOut:      { chainId: CHAIN_IDS.TON, address: BRIDGE_TOKENS.TON.USDT },
      from: CHAIN_IDS.TON, to: CHAIN_IDS.TON,
    },
  };

  const config = pairMap[pair];
  if (!config) return { success: false, error: `Unsupported pair: ${pair}` };

  try {
    const res = await fetch(`${SYMBIOSIS_API}/swap`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tokenAmountIn: config.tokenAmountIn,
        tokenOut:      config.tokenOut,
        from:          fromAddress,
        to:            toAddress,
        slippage:      300, // 3% slippage tolerance (300 bps)
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Symbiosis API ${res.status}: ${errText.slice(0, 100)}` };
    }

    const data = await res.json() as any;

    const quote: SwapQuote = {
      from_chain:           pair.split("/")[0],
      to_chain:             pair.split("/")[1],
      from_token:           pair.split("/")[0],
      to_token:             pair.split("/")[1],
      from_amount:          String(amount),
      to_amount_expected:   data.tokenAmountOut?.amount ?? "0",
      to_amount_min:        data.tokenAmountOutMin?.amount ?? "0",
      price_impact_pct:     parseFloat(data.priceImpact ?? "0"),
      fee_usd:              parseFloat(data.fees?.[0]?.value ?? "0"),
      estimated_time_sec:   45, // ~30-60s typical
      route:                data.route?.map((r: any) => r.provider ?? r) ?? [pair],
      tx_data:              data.tx ?? data.transactionRequest ?? null,
    };

    return { success: true, quote };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get estimated bridge status by transaction hash.
 */
export async function getBridgeStatus(
  txHash: string,
  fromChainId: number,
  env: BridgeEnv
): Promise<BridgeStatus> {
  const headers: Record<string, string> = {};
  if (env.SYMBIOSIS_API_KEY) headers["Authorization"] = `Bearer ${env.SYMBIOSIS_API_KEY}`;

  try {
    const res = await fetch(
      `${SYMBIOSIS_API}/tx/${txHash}?chainId=${fromChainId}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Status API ${res.status}`);
    const data = await res.json() as any;

    return {
      tx_hash:          txHash,
      status:           data.status?.toLowerCase() ?? "pending",
      from_chain:       String(fromChainId),
      to_chain:         data.toChainId ? String(data.toChainId) : "?",
      percent_complete: data.status === "SUCCESS" ? 100 : data.status === "PENDING" ? 25 : 50,
      error:            data.error,
    };
  } catch (e: any) {
    return {
      tx_hash: txHash,
      status: "pending",
      from_chain: String(fromChainId),
      to_chain: "?",
      percent_complete: 0,
      error: e.message,
    };
  }
}

// ─── RTV CREATOR BRIDGE FLOW ──────────────────────────────────────────────────

/**
 * Creator withdraws earnings from TON → Solana USDC.
 * Used in CreatorPayoutWorkflow when creator prefers Solana payout.
 */
export async function creatorBridgePayout(
  amountTon: number,
  creatorTonWallet: string,
  creatorSolWallet: string,
  env: BridgeEnv
): Promise<{ success: boolean; quote?: SwapQuote; instructions?: string; error?: string }> {
  const { success, quote, error } = await getBridgeQuote(
    "TON/SOL",
    amountTon,
    creatorTonWallet,
    creatorSolWallet,
    env
  );

  if (!success || !quote) return { success: false, error };

  const instructions = [
    `Bridge ${amountTon} TON → SOL via Symbiosis`,
    `Expected received: ~${parseFloat(quote.to_amount_expected) / 1e9} SOL`,
    `Bridge fee: ~$${quote.fee_usd.toFixed(3)}`,
    `Estimated time: ~${quote.estimated_time_sec}s`,
    `Sign the transaction with your TON wallet to execute.`,
  ].join("\n");

  return { success: true, quote, instructions };
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

export async function routeBridgeRequest(
  request: Request,
  url: URL,
  env: BridgeEnv
): Promise<Response | null> {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  const path = url.pathname;

  // GET /api/bridge/health
  if (path === "/api/bridge/health" && request.method === "GET") {
    return json({
      status: "ok",
      provider: "symbiosis",
      supported_pairs: ["TON/SOL", "SOL/TON", "USDC/TON", "SOL/USDT", "TON/USDT"],
      chain_ids: CHAIN_IDS,
      estimated_time_sec: 45,
      docs: "https://docs.symbiosis.finance",
    });
  }

  // GET /api/bridge/pairs
  if (path === "/api/bridge/pairs" && request.method === "GET") {
    return json({
      pairs: [
        { pair: "TON/SOL",  from: "TON",    to: "SOL",  fee_pct: "~0.3%", time_sec: 45 },
        { pair: "SOL/TON",  from: "SOL",    to: "TON",  fee_pct: "~0.3%", time_sec: 45 },
        { pair: "USDC/TON", from: "USDC",   to: "jUSDC_TON", fee_pct: "~0.1%", time_sec: 30 },
        { pair: "SOL/USDT", from: "SOL",    to: "USDT", fee_pct: "~0.3%", time_sec: 45 },
        { pair: "TON/USDT", from: "TON",    to: "jUSDT_TON", fee_pct: "~0.1%", time_sec: 20 },
      ],
    });
  }

  // POST /api/bridge/quote
  if (path === "/api/bridge/quote" && request.method === "POST") {
    try {
      const { pair, amount, from_address, to_address } = await request.json() as any;
      if (!pair || !amount || !from_address || !to_address)
        return json({ error: "pair, amount, from_address, to_address required" }, 400);
      const result = await getBridgeQuote(pair, amount, from_address, to_address, env);
      return json(result);
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // GET /api/bridge/status?tx=...&chain=...
  if (path === "/api/bridge/status" && request.method === "GET") {
    const txHash  = url.searchParams.get("tx");
    const chainId = parseInt(url.searchParams.get("chain") ?? "0");
    if (!txHash) return json({ error: "tx param required" }, 400);
    const status = await getBridgeStatus(txHash, chainId || CHAIN_IDS.TON, env);
    return json({ success: true, ...status });
  }

  return null;
}
