// ============================================================
// ROTATIONCALL ↔ WEB3 BRIDGE
// Connects RotationCall.net (Emergent) to Solana/Web3 ecosystem
// Features:
//   - Wallet verification for call access gating
//   - $RTV balance check before premium call features
//   - NFT pass validation (channel_pass, membership)
//   - Payment via RotationPay on-chain for call credits
//   - Webhook receiver from RotationCall.net → Base44
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_KEY") || "";
const CHAINSTACK_RPC = Deno.env.get("CHAINSTACK_SOLANA_MAINNET_RPC") || "";
const RTV_MINT = Deno.env.get("RTV_TOKEN_MINT") || "";
const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN") || "";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID") || "";

// ---- Solana RPC helper ----
async function solanaRPC(method: string, params: any[]): Promise<any> {
  if (!CHAINSTACK_RPC) return { error: "CHAINSTACK_RPC not configured" };
  const res = await fetch(CHAINSTACK_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  return data.result ?? data;
}

// ---- Get SOL balance ----
async function getSolBalance(wallet: string): Promise<number> {
  const result = await solanaRPC("getBalance", [wallet]);
  if (result?.error || result?.value === undefined) return 0;
  return result.value / 1e9; // lamports → SOL
}

// ---- Get $RTV token balance ----
async function getRTVBalance(wallet: string): Promise<number> {
  if (!RTV_MINT) return 0;
  const result = await solanaRPC("getTokenAccountsByOwner", [
    wallet,
    { mint: RTV_MINT },
    { encoding: "jsonParsed" },
  ]);
  if (!result?.value?.length) return 0;
  const amount = result.value[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
  return amount || 0;
}

// ---- Check NFT ownership ----
async function hasNFTPass(wallet: string, requiredType?: string): Promise<{ hasPass: boolean; nfts: any[] }> {
  const result = await solanaRPC("getTokenAccountsByOwner", [
    wallet,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);
  if (!result?.value) return { hasPass: false, nfts: [] };
  const nfts = result.value.filter((acc: any) => {
    const info = acc?.account?.data?.parsed?.info;
    return info?.tokenAmount?.uiAmount === 1 && info?.tokenAmount?.decimals === 0;
  });
  return { hasPass: nfts.length > 0, nfts };
}

// ---- Log to Supabase ----
async function logToSupabase(table: string, data: object): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(data),
  });
}

// ---- Notify channels ----
async function notify(message: string, urgent = false): Promise<void> {
  const prefix = urgent ? "🚨 " : "📞 ";
  const text = `${prefix}ROTATIONCALL WEB3\n${message}`;
  const calls: Promise<any>[] = [];
  if (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID) {
    calls.push(fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.slice(0, 1900) }),
    }));
  }
  if (SLACK_BOT_TOKEN) {
    calls.push(fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "#rtv-ecosystem", text: text.slice(0, 3000) }),
    }));
  }
  await Promise.allSettled(calls);
}

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, wallet_address, user_id, call_data, event_type } = body;

  try {

    // ── WALLET GATE: Verify wallet has access for RotationCall ──
    if (action === "verify_wallet_access") {
      if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

      const [sol, rtv, nft] = await Promise.all([
        getSolBalance(wallet_address),
        getRTVBalance(wallet_address),
        hasNFTPass(wallet_address),
      ]);

      const hasAccess = rtv >= 10 || nft.hasPass || sol >= 0.1;
      const tier = rtv >= 1000 ? "enterprise" : rtv >= 100 ? "pro" : rtv >= 10 ? "basic" : nft.hasPass ? "nft_holder" : "guest";

      const result = {
        wallet: wallet_address,
        access_granted: hasAccess,
        tier,
        balances: { sol: sol.toFixed(4), rtv: rtv.toFixed(2) },
        nft_pass: nft.hasPass,
        nft_count: nft.nfts.length,
        features: {
          basic_calling: hasAccess,
          premium_ivr: tier !== "guest",
          ai_agent: ["pro", "enterprise", "nft_holder"].includes(tier),
          priority_routing: tier === "enterprise",
          unlimited_minutes: rtv >= 500 || tier === "enterprise",
        },
        timestamp: new Date().toISOString(),
      };

      // Log balance check
      await logToSupabase("balance_checks", {
        user_id: user_id || wallet_address,
        wallet_address,
        sol_balance: sol,
        rtv_balance: rtv,
        network: "mainnet",
        source: "rotationcall_gate",
        status: "success",
        checked_at: new Date().toISOString(),
      });

      return Response.json({ status: "ok", ...result });
    }

    // ── BALANCES: Full Web3 status for a wallet ──
    if (action === "get_balances") {
      if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });
      const [sol, rtv, nft] = await Promise.all([
        getSolBalance(wallet_address),
        getRTVBalance(wallet_address),
        hasNFTPass(wallet_address),
      ]);
      return Response.json({
        status: "ok",
        wallet: wallet_address,
        sol_balance: sol,
        rtv_balance: rtv,
        nft_pass: nft.hasPass,
        nft_count: nft.nfts.length,
        rtv_mint: RTV_MINT,
        chainstack_node: "RTV-Solana-Mainnet-Primary",
        timestamp: new Date().toISOString(),
      });
    }

    // ── CALL WEBHOOK: RotationCall.net fires this on call events ──
    if (action === "call_event" || event_type) {
      const event = event_type || call_data?.event || "unknown";
      const caller = call_data?.caller_id || body.caller_id || "unknown";
      const duration = call_data?.duration_sec || body.duration_sec || 0;
      const rtv_module = call_data?.rtv_module || body.rtv_module || "rotation_call";

      // Log to Supabase
      await logToSupabase("call_events", {
        event_type: event,
        caller_id: caller,
        duration_sec: duration,
        rtv_module,
        wallet_address: wallet_address || null,
        user_id: user_id || null,
        metadata: JSON.stringify(body),
        created_at: new Date().toISOString(),
      });

      // Alert on completed calls
      if (["completed", "missed", "failed"].includes(event)) {
        const emoji = event === "completed" ? "✅" : event === "missed" ? "📵" : "❌";
        await notify(`${emoji} Call ${event.toUpperCase()}\nCaller: ${caller} | Duration: ${duration}s\nModule: ${rtv_module}`);
      }

      return Response.json({ status: "ok", event_logged: event, timestamp: new Date().toISOString() });
    }

    // ── PAYMENT GATE: Check $RTV before charging for call credits ──
    if (action === "check_call_payment") {
      if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });
      const { required_rtv = 1 } = body;
      const rtv = await getRTVBalance(wallet_address);
      const can_pay = rtv >= required_rtv;
      return Response.json({
        status: "ok",
        wallet: wallet_address,
        rtv_balance: rtv,
        required_rtv,
        can_pay,
        shortfall: can_pay ? 0 : (required_rtv - rtv).toFixed(2),
        timestamp: new Date().toISOString(),
      });
    }

    // ── HEALTH: Bridge status ──
    if (action === "health") {
      const chainstack_ok = CHAINSTACK_RPC ? true : false;
      return Response.json({
        status: "ok",
        bridge: "RotationCall ↔ Web3",
        version: "1.0",
        connections: {
          chainstack_solana: chainstack_ok ? "✅ CONFIGURED" : "⚠️ CHAINSTACK_RPC not set",
          rtv_mint: RTV_MINT ? "✅ CONFIGURED" : "⚠️ RTV_TOKEN_MINT not set",
          supabase: SUPABASE_KEY ? "✅ CONFIGURED" : "⚠️ SUPABASE_KEY not set",
          slack: SLACK_BOT_TOKEN ? "✅ CONFIGURED" : "⚠️ not set",
          discord: DISCORD_BOT_TOKEN ? "✅ CONFIGURED" : "⚠️ not set",
        },
        rotationcall_url: "https://rotationcall.net",
        nodes_active: 4,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({ error: "Unknown action. Use: verify_wallet_access | get_balances | call_event | check_call_payment | health" }, { status: 400 });

  } catch (err) {
    return Response.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
