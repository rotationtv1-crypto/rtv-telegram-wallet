// ============================================================
// ROTATIONPAY GATEWAY — MULTI-RAIL PAYMENT ENGINE
// Routes payments via Solana, Stripe, Coinbase, Venmo, Zelle, NMI
// $RTV token validation via Chainstack
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const CHAINSTACK_RPC = Deno.env.get("CHAINSTACK_SOLANA_MAINNET_RPC") || "";
const RTV_MINT = Deno.env.get("RTV_TOKEN_MINT") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN") || "";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID") || "";

// ── Supabase write ──
async function dbWrite(table: string, data: object): Promise<any> {
  if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.startsWith("sb_publishable")) {
    return { error: "Need service_role key — not publishable key" };
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(data),
  });
  return { http: res.status, data: await res.json().catch(() => null) };
}

// ── Solana: get SOL balance ──
async function getSolBalance(wallet: string): Promise<number> {
  if (!CHAINSTACK_RPC) return -1;
  const res = await fetch(CHAINSTACK_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [wallet] }),
  });
  const d = await res.json();
  return d?.result?.value ? d.result.value / 1e9 : 0; // lamports → SOL
}

// ── Solana: get $RTV token balance ──
async function getRTVBalance(wallet: string): Promise<number> {
  if (!CHAINSTACK_RPC || !RTV_MINT) return -1;
  try {
    const res = await fetch(CHAINSTACK_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "getTokenAccountsByOwner",
        params: [wallet, { mint: RTV_MINT }, { encoding: "jsonParsed" }],
      }),
    });
    const d = await res.json();
    const accounts = d?.result?.value || [];
    if (accounts.length === 0) return 0;
    return accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
  } catch { return -1; }
}

// ── Solana: get current slot (health check) ──
async function getSolanaSlot(): Promise<number> {
  if (!CHAINSTACK_RPC) return -1;
  const res = await fetch(CHAINSTACK_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [] }),
  });
  const d = await res.json();
  return d?.result || -1;
}

// ── Alert ──
async function alert(text: string) {
  await Promise.allSettled([
    SLACK_BOT_TOKEN && fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "#rtv-payments", text: text.slice(0, 3000) }),
    }),
    (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID) && fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.slice(0, 1900) }),
    }),
  ]);
}

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action = "health" } = body;

  // ── HEALTH CHECK ──
  if (action === "health") {
    const slot = await getSolanaSlot();
    return Response.json({
      status: "ok",
      service: "RotationPay Gateway",
      blockchain: slot > 0 ? `✅ Solana slot ${slot}` : "❌ Chainstack not responding",
      supabase: SUPABASE_SERVICE_KEY && !SUPABASE_SERVICE_KEY.startsWith("sb_publishable") ? "✅ service_role key ready" : "❌ Need service_role key",
      stripe: STRIPE_SECRET_KEY ? "✅ configured" : "⚠️ not configured",
      rtv_mint: RTV_MINT ? `✅ ${RTV_MINT.slice(0, 8)}...` : "❌ not configured",
      rails: ["solana", "stripe", "paypal", "coinbase", "venmo", "zelle", "nmi"],
      timestamp: new Date().toISOString(),
    });
  }

  // ── VALIDATE WALLET ──
  if (action === "validate_wallet") {
    const { wallet_address, min_rtv = 0, min_sol = 0 } = body;
    if (!wallet_address) return Response.json({ error: "wallet_address required" }, { status: 400 });

    const [sol, rtv] = await Promise.all([getSolBalance(wallet_address), getRTVBalance(wallet_address)]);

    const valid = sol >= min_sol && rtv >= min_rtv;
    return Response.json({
      status: "ok",
      wallet: wallet_address,
      sol_balance: sol,
      rtv_balance: rtv,
      min_sol_required: min_sol,
      min_rtv_required: min_rtv,
      validated: valid,
      gate: valid ? "✅ ACCESS GRANTED" : "❌ INSUFFICIENT BALANCE",
      timestamp: new Date().toISOString(),
    });
  }

  // ── PROCESS PAYMENT ──
  if (action === "process_payment") {
    const {
      rail = "stripe",         // solana | stripe | coinbase | venmo | zelle | nmi
      amount,                  // USD amount
      currency = "USD",
      sender_wallet,
      recipient_wallet,
      tenant_id,
      require_rtv = false,
      min_rtv_balance = 0,
      user_id,
      metadata = {},
    } = body;

    if (!amount) return Response.json({ error: "amount required" }, { status: 400 });

    // Validate $RTV gate if required
    let rtv_balance = 0;
    if (require_rtv && sender_wallet) {
      rtv_balance = await getRTVBalance(sender_wallet);
      if (rtv_balance < min_rtv_balance) {
        return Response.json({
          status: "rejected",
          reason: `Insufficient $RTV balance — need ${min_rtv_balance}, have ${rtv_balance}`,
          gate: "❌ RTV_GATE_FAILED",
        }, { status: 403 });
      }
    }

    // Route by rail
    let rail_result: any = {};
    let tx_status = "pending";
    let signature = null;

    if (rail === "stripe" && STRIPE_SECRET_KEY) {
      const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: String(Math.round(amount * 100)),
          currency: currency.toLowerCase(),
          automatic_payment_methods: "enabled",
          metadata: JSON.stringify({ tenant_id, user_id, rtv_balance }),
        }),
      });
      rail_result = await stripeRes.json();
      signature = rail_result.id;
      tx_status = rail_result.status || "pending";
    } else if (rail === "paypal") {
      rail_result = {
        rail: "paypal",
        status: "redirect",
        paypal_link: "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY",
        note: "Redirect customer to PayPal checkout link",
        fee_percent: 3.49,
        fee_fixed: 0.49,
      };
      signature = "paypal_" + Date.now();
      tx_status = "pending_paypal_redirect";
    } else if (rail === "solana") {
      // For Solana, we log the intent and return instructions for client-side signing
      rail_result = {
        instruction: "Client must sign transaction",
        recipient: recipient_wallet,
        amount_sol: amount / 100, // approximate
        note: "Submit signed tx signature back via confirm_tx action",
      };
      tx_status = "awaiting_signature";
    } else {
      // Other rails (coinbase, venmo, zelle, nmi) — webhook-based, log intent
      rail_result = {
        rail,
        status: "intent_logged",
        note: `${rail} integration webhook will confirm. Add ${rail.toUpperCase()}_WEBHOOK_URL to secrets.`,
      };
      tx_status = "intent_logged";
    }

    // Log to Supabase
    const txLog = await dbWrite("rotation_pay_transactions", {
      amount,
      currency,
      payment_rail: rail,
      sender_wallet: sender_wallet || null,
      recipient_wallet: recipient_wallet || null,
      signature: signature || null,
      status: tx_status,
      user_id: user_id || null,
      channel_id: tenant_id || null,
      tx_type: "payment",
      timestamp: new Date().toISOString(),
      blockchain_confirmed: false,
    });

    // Alert on large transactions
    if (amount >= 100) {
      await alert(`💰 RotationPay: $${amount} ${currency} via ${rail.toUpperCase()}\nTenant: ${tenant_id || "N/A"}\nStatus: ${tx_status}\nWallet: ${sender_wallet || "N/A"}`);
    }

    return Response.json({
      status: "ok",
      transaction: { rail, amount, currency, status: tx_status, signature, rtv_balance },
      rail_result,
      supabase_log: txLog,
      timestamp: new Date().toISOString(),
    });
  }

  // ── CONFIRM SOLANA TX ──
  if (action === "confirm_tx") {
    const { signature } = body;
    if (!signature) return Response.json({ error: "signature required" }, { status: 400 });

    const res = await fetch(CHAINSTACK_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }] }),
    });
    const d = await res.json();
    const confirmed = !!d?.result;

    return Response.json({
      status: "ok",
      signature,
      confirmed,
      blockchain_data: d?.result || null,
      timestamp: new Date().toISOString(),
    });
  }

  // ── ECOSYSTEM REPORT ──
  if (action === "report") {
    const slot = await getSolanaSlot();
    return Response.json({
      status: "ok",
      service: "RotationPay Gateway",
      solana_slot: slot,
      rails_active: ["stripe", "solana", "paypal", "coinbase_intent", "venmo_intent", "zelle_intent", "nmi_intent"],
      rails_pending_secrets: [
        !STRIPE_SECRET_KEY && "STRIPE_SECRET_KEY",
        !RTV_MINT && "RTV_TOKEN_MINT",
        "COINBASE_WEBHOOK_URL",
        "VENMO_WEBHOOK_URL",
        "ZELLE_WEBHOOK_URL",
        "NMI_GATEWAY_URL",
      ].filter(Boolean),
      rtv_gating: RTV_MINT ? "active" : "needs RTV_TOKEN_MINT",
      timestamp: new Date().toISOString(),
    });
  }

  return Response.json({ error: "Unknown action", available: ["health", "validate_wallet", "process_payment", "confirm_tx", "report"] }, { status: 400 });
}
