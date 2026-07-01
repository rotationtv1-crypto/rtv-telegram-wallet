// ============================================================
// ROTATIONCALL ↔ EMERGENT SYNC ENGINE
// Direct bridge between Base44 and RotationCall.net (Emergent)
// Triggers builds, reads project status, pushes config updates
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

const EMERGENTLABS_API_KEY = Deno.env.get("EMERGENTLABS_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const CHAINSTACK_RPC = Deno.env.get("CHAINSTACK_SOLANA_MAINNET_RPC") || "";

// Emergent project endpoint for RotationCall
const EMERGENT_PROJECT_URL = "https://rotationcall.net";
const EMERGENT_API_BASE = "https://api.emergent.sh/v1";

async function callEmergent(path: string, method = "GET", body?: object): Promise<any> {
  if (!EMERGENTLABS_API_KEY) return { error: "EMERGENTLABS_API_KEY not configured" };
  try {
    const res = await fetch(`${EMERGENT_API_BASE}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${EMERGENTLABS_API_KEY}`,
        "x-api-key": EMERGENTLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    try { return { status: res.status, data: JSON.parse(text) }; }
    catch { return { status: res.status, raw: text }; }
  } catch (e) {
    return { error: String(e) };
  }
}

async function supabaseWrite(table: string, data: object): Promise<any> {
  if (!SUPABASE_SERVICE_KEY) return { error: "No service key" };
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
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function solanaHealth(): Promise<string> {
  if (!CHAINSTACK_RPC) return "⚠️ RPC not configured";
  try {
    const res = await fetch(CHAINSTACK_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: [] }),
    });
    const d = await res.json();
    return d.result === "ok" ? "✅ HEALTHY" : `⚠️ ${JSON.stringify(d)}`;
  } catch (e) {
    return `❌ ${String(e)}`;
  }
}

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action = "status" } = body;

  // ── FULL STATUS ──
  if (action === "status") {
    const [emergentProjects, solana] = await Promise.all([
      callEmergent("/projects"),
      solanaHealth(),
    ]);

    // Try alternate Emergent endpoints
    const emergentMe = await callEmergent("/me");
    const emergentApps = await callEmergent("/apps");

    return Response.json({
      status: "ok",
      rotationcall_site: EMERGENT_PROJECT_URL,
      solana_node: solana,
      emergent_key_present: !!EMERGENTLABS_API_KEY,
      supabase_key_present: !!SUPABASE_SERVICE_KEY,
      emergent_api_responses: {
        projects: emergentProjects,
        me: emergentMe,
        apps: emergentApps,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ── LOG A CALL EVENT TO SUPABASE ──
  if (action === "log_call") {
    const result = await supabaseWrite("call_events", {
      event_type: body.event_type || "test",
      caller_id: body.caller_id || "test_caller",
      duration_sec: body.duration_sec || 0,
      rtv_module: "rotation_call",
      wallet_address: body.wallet_address || null,
      user_id: body.user_id || null,
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
    });
    return Response.json({ status: "ok", supabase_result: result, timestamp: new Date().toISOString() });
  }

  // ── PUSH CONFIG TO EMERGENT PROJECT ──
  if (action === "push_config") {
    // Send environment config as a message to the Emergent agent
    const configPayload = {
      project: "rotationcall",
      web3_bridge: "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationCallWeb3Bridge",
      supabase_url: SUPABASE_URL,
      chainstack_active: !!CHAINSTACK_RPC,
      features: {
        wallet_gating: true,
        rtv_payment: true,
        nft_pass: true,
        call_logging: true,
        ai_ivr: true,
      },
      twilio_number: "+18333666923",
      login_types: ["employee", "client", "admin"],
    };

    const result = await callEmergent("/projects/rotationcall/config", "POST", configPayload);

    return Response.json({
      status: "ok",
      config_pushed: configPayload,
      emergent_response: result,
      timestamp: new Date().toISOString(),
    });
  }

  // ── SUPABASE SQL SETUP ──
  if (action === "get_setup_sql") {
    return Response.json({
      status: "ok",
      instructions: "Run this SQL in Supabase SQL Editor → https://supabase.com/dashboard/project/xynkgaxfwvpcixissxdz/sql",
      sql: `
-- RotationCall Tables Setup
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS call_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  caller_id text,
  duration_sec integer DEFAULT 0,
  rtv_module text DEFAULT 'rotation_call',
  wallet_address text,
  user_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balance_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  wallet_address text NOT NULL,
  sol_balance numeric DEFAULT 0,
  rtv_balance numeric DEFAULT 0,
  network text DEFAULT 'mainnet',
  source text DEFAULT 'rotationcall_gate',
  status text DEFAULT 'success',
  checked_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rotationcall_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type text CHECK (user_type IN ('employee','client','admin')),
  user_id text,
  wallet_address text,
  session_token text,
  login_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  status text DEFAULT 'active',
  ip_address text,
  metadata jsonb DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_events_created ON call_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_events_caller ON call_events(caller_id);
CREATE INDEX IF NOT EXISTS idx_balance_wallet ON balance_checks(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON rotationcall_sessions(user_id);

-- Enable RLS
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotationcall_sessions ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY IF NOT EXISTS "service_role_all_call_events"
  ON call_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_role_all_balance_checks"
  ON balance_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_role_all_sessions"
  ON rotationcall_sessions FOR ALL USING (true) WITH CHECK (true);

SELECT 'RotationCall tables ready ✅' as status;
      `.trim(),
    });
  }

  return Response.json({
    error: "Unknown action",
    available: ["status", "log_call", "push_config", "get_setup_sql"],
  }, { status: 400 });
}
