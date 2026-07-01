// $RTV Wallet Dashboard + Resonance Meter
// Real-time SOL balance, $RTVS balance, recent transactions
// /connect_wallet flow — Telegram user ID → Solana pubkey
// Tesla Resonance Meter — live energy flow across 9 companies
// Presidential Authority: Darrel — RotationTV Network

import { app as createApp } from "https://esm.sh/@base44/sdk@latest";
const app = createApp("69db6144f66afe8317b2d0d7");

const RPC = Deno.env.get("CHAINSTACK_SOLANA_MAINNET_RPC") || "";
const RTV_MINT = Deno.env.get("RTV_TOKEN_MINT_ADDRESS") || "";

// ─── RPC HELPER ──────────────────────────────────────────────────────────────
async function rpc(method: string, params: any[]) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  return data.result;
}

// ─── GET SOL BALANCE ─────────────────────────────────────────────────────────
async function getSolBalance(wallet: string): Promise<number> {
  const result = await rpc("getBalance", [wallet, { commitment: "confirmed" }]);
  return (result?.value || 0) / 1e9;
}

// ─── GET $RTV TOKEN BALANCE ──────────────────────────────────────────────────
async function getRTVBalance(wallet: string, mint: string): Promise<{ balance: number; decimals: number; raw: string }> {
  if (!mint) return { balance: 0, decimals: 9, raw: "0" };
  const result = await rpc("getTokenAccountsByOwner", [
    wallet,
    { mint },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);
  const accounts = result?.value || [];
  if (accounts.length === 0) return { balance: 0, decimals: 9, raw: "0" };
  const info = accounts[0]?.account?.data?.parsed?.info?.tokenAmount;
  return {
    balance: parseFloat(info?.uiAmountString || "0"),
    decimals: info?.decimals || 9,
    raw: info?.amount || "0",
  };
}

// ─── GET RECENT TOKEN TRANSACTIONS ───────────────────────────────────────────
async function getRecentTx(wallet: string, limit = 5): Promise<string[]> {
  const sigs = await rpc("getSignaturesForAddress", [wallet, { limit }]);
  if (!sigs || sigs.length === 0) return [];
  return sigs.map((s: any) => {
    const time = s.blockTime ? new Date(s.blockTime * 1000).toLocaleDateString() : "recent";
    const status = s.err ? "❌ Failed" : "✅ Confirmed";
    const shortSig = `${s.signature.slice(0, 8)}...${s.signature.slice(-4)}`;
    return `${status} · ${shortSig} · ${time}`;
  });
}

// ─── FORMAT WALLET DASHBOARD MESSAGE ─────────────────────────────────────────
function formatDashboard(wallet: string, sol: number, rtv: { balance: number }, txs: string[], stakeMultiplier: string) {
  const rtvFormatted = rtv.balance.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const solFormatted = sol.toFixed(4);
  const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  // Tesla Resonance tier
  const tier = rtv.balance >= 50000 ? "🔴 Sovereign · 5x staking" :
               rtv.balance >= 10000 ? "🟠 Builder · 2x staking" :
               rtv.balance > 0     ? "🟡 Starter · 1x staking" : "⚪ No $RTV yet";

  let txBlock = txs.length > 0
    ? txs.map(t => `  • ${t}`).join("\n")
    : "  No recent transactions";

  return (
    `⚡ *$RTV Wallet Dashboard*\n\n` +
    `🔑 *Wallet:* \`${shortWallet}\`\n\n` +
    `💰 *Balances:*\n` +
    `  ◎ SOL: \`${solFormatted}\`\n` +
    `  🪙 $RTV: \`${rtvFormatted}\`\n\n` +
    `⚡ *Resonance Tier:* ${tier}\n\n` +
    `📊 *Recent Transactions:*\n${txBlock}\n\n` +
    `_Tesla Coil spinning. Energy flowing. $RTV compounding._ ♾️\n` +
    `🌐 rotationtvai.com`
  );
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req: Request) {
  const body = await req.json();
  const { action, telegram_id, wallet_address, mint_address } = body;

  const mintToUse = mint_address || RTV_MINT;

  // ── CONNECT WALLET ──────────────────────────────────────────────────────────
  if (action === "connect_wallet") {
    if (!telegram_id || !wallet_address) {
      return Response.json({ error: "telegram_id and wallet_address required" }, { status: 400 });
    }

    // Basic Solana address validation
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)) {
      return Response.json({ error: "Invalid Solana wallet address" }, { status: 400 });
    }

    try {
      // Check if already connected
      const existing = await app.asServiceRole.entities.WalletIntegration.filter({
        user_id: telegram_id,
        chain: "solana",
      });

      if (existing && existing.length > 0) {
        // Update existing
        await app.asServiceRole.entities.WalletIntegration.update(existing[0].id, {
          wallet_address,
          status: "active",
          last_balance_check: new Date().toISOString(),
        });
      } else {
        // Create new
        await app.asServiceRole.entities.WalletIntegration.create({
          user_id: String(telegram_id),
          wallet_address,
          wallet_provider: "solana",
          chain: "solana",
          network: "mainnet-beta",
          is_primary: true,
          is_verified: false,
          auto_sync: true,
          status: "active",
          connected_at: new Date().toISOString(),
          last_balance_check: new Date().toISOString(),
        });
      }

      return Response.json({ success: true, action: "wallet_connected", wallet_address });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // ── GET WALLET DASHBOARD ────────────────────────────────────────────────────
  if (action === "dashboard" || action === "balance") {
    if (!telegram_id) {
      return Response.json({ error: "telegram_id required" }, { status: 400 });
    }

    try {
      // Find connected wallet
      const wallets = await app.asServiceRole.entities.WalletIntegration.filter({
        user_id: String(telegram_id),
        chain: "solana",
      });

      if (!wallets || wallets.length === 0) {
        return Response.json({ error: "no_wallet", message: "No wallet connected. Use /connect_wallet first." });
      }

      const wallet = wallets[0].wallet_address;

      // Fetch live data from Chainstack
      const [sol, rtv, txs] = await Promise.all([
        getSolBalance(wallet),
        getRTVBalance(wallet, mintToUse),
        getRecentTx(wallet, 5),
      ]);

      const stakeMultiplier = rtv.balance >= 50000 ? "5x" : rtv.balance >= 10000 ? "2x" : "1x";

      // Update balance record
      try {
        await app.asServiceRole.entities.BalanceCheck.create({
          wallet_address: wallet,
          user_id: String(telegram_id),
          sol_balance: sol,
          rtv_balance: rtv.balance,
          rtv_mint_address: mintToUse,
          network: "mainnet-beta",
          source: "chainstack",
          chainstack_node_used: "RTV-Solana-Mainnet-Primary",
          status: "success",
          checked_at: new Date().toISOString(),
          response_time_ms: 0,
        });
      } catch (e) { /* non-blocking */ }

      const dashboard = formatDashboard(wallet, sol, rtv, txs, stakeMultiplier);

      return Response.json({
        success: true,
        wallet,
        sol_balance: sol,
        rtv_balance: rtv.balance,
        rtv_tier: stakeMultiplier,
        recent_tx_count: txs.length,
        dashboard_message: dashboard,
      });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // ── RESONANCE METER — 9 Company Energy Flow ─────────────────────────────────
  if (action === "resonance_meter") {
    try {
      const [txCount, balanceChecks] = await Promise.all([
        app.asServiceRole.entities.RotationPayTransaction.filter({ status: "confirmed" }),
        app.asServiceRole.entities.BalanceCheck.filter({ status: "success" }),
      ]);

      const totalTx = txCount?.length || 0;
      const totalChecks = balanceChecks?.length || 0;

      const companies = [
        { name: "RotationPay", emoji: "◎", role: "AC Power Grid", energy: totalTx > 0 ? "🟢 LIVE" : "🟡 WARM" },
        { name: "$RTV Token", emoji: "⚡", role: "Tesla Coil", energy: "🔴 RESONATING" },
        { name: "RotationCall", emoji: "📞", role: "Wireless Radio", energy: "🟢 LIVE" },
        { name: "RTV University", emoji: "🎓", role: "Free Knowledge", energy: "🟢 ENROLLING" },
        { name: "EmergentLabs", emoji: "🔬", role: "Wardenclyffe Tower", energy: "🟢 BUILD MODE" },
        { name: "OpenClaw", emoji: "🤖", role: "Autonomous Machines", energy: "🟢 DEPLOYED" },
        { name: "White Logistics", emoji: "🚚", role: "Copper Wire", energy: "🟢 ROUTING" },
        { name: "Bigo Agency", emoji: "🎨", role: "Transformer", energy: "🟢 CONVERTING" },
        { name: "Pretrial Svcs", emoji: "⚖️", role: "Circuit Breaker", energy: "🟢 BALANCED" },
      ];

      const meter = companies.map(c => `${c.emoji} *${c.name}* — ${c.role}\n   ${c.energy}`).join("\n\n");

      return Response.json({
        success: true,
        resonance_meter: meter,
        total_transactions: totalTx,
        total_balance_checks: totalChecks,
        coil_status: "SPINNING",
        message:
          `⚡ *$RTV Tesla Resonance Meter*\n\n` +
          `_9 frequencies. 1 coil. Infinite energy._\n\n` +
          `${meter}\n\n` +
          `📊 Confirmed Txs: ${totalTx} · Balance Checks: ${totalChecks}\n\n` +
          `_"If you only knew the magnificence of the 3, 6 and 9..."_ ♾️`,
      });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // ── DISCONNECT WALLET ───────────────────────────────────────────────────────
  if (action === "disconnect_wallet") {
    if (!telegram_id) return Response.json({ error: "telegram_id required" }, { status: 400 });
    try {
      const wallets = await app.asServiceRole.entities.WalletIntegration.filter({ user_id: String(telegram_id) });
      for (const w of wallets || []) {
        await app.asServiceRole.entities.WalletIntegration.update(w.id, { status: "disconnected" });
      }
      return Response.json({ success: true, message: "Wallet disconnected" });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
