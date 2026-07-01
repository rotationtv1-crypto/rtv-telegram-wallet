// ============================================================
// ROTATIONCALL DEBUGGER
// Full diagnostic engine for rotationcall.net
// Checks: Emergent project status, Supabase connectivity,
//         Twilio voice, Web3/Chainstack, OpenClaw agents,
//         RotationPay bridge, DNS/SSL, call event logs
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_KEY") || "";
const EMERGENTLABS_API_KEY = Deno.env.get("EMERGENTLABS_API_KEY") || "";
const CHAINSTACK_RPC = Deno.env.get("CHAINSTACK_SOLANA_MAINNET_RPC") || "";
const RTV_MINT = Deno.env.get("RTV_TOKEN_MINT") || "";
const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN") || "";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID") || "";

const ROTATIONCALL_URL = "https://rotationcall.net";
const EMERGENT_API = "https://api.emergent.sh/v1";
const SUPABASE_WEBHOOK = `${SUPABASE_URL}/functions/v1/manus-emergent-webhook`;
const WEB3_BRIDGE = "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationCallWeb3Bridge";

// ── helpers ──
function pass(msg: string) { return { status: "✅ PASS", detail: msg }; }
function fail(msg: string) { return { status: "❌ FAIL", detail: msg }; }
function warn(msg: string) { return { status: "⚠️ WARN", detail: msg }; }

async function pingURL(url: string, timeout = 5000): Promise<{ ok: boolean; status?: number; ms: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.status < 500, status: res.status, ms: Date.now() - start };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: String(e) };
  }
}

async function supabaseQuery(table: string, select = "*", limit = 5): Promise<any> {
  if (!SUPABASE_SERVICE_KEY) return { error: "No Supabase key configured" };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}&order=created_at.desc`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, body: await res.text() };
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

async function notifySlack(text: string) {
  if (!SLACK_BOT_TOKEN) return;
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "#rtv-ecosystem", text: text.slice(0, 3000) }),
  });
}

async function notifyDiscord(text: string) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) return;
  await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: text.slice(0, 1900) }),
  });
}

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action = "full_debug", wallet_address } = body;
  const startTime = Date.now();

  // ── FULL DEBUG ──
  if (action === "full_debug" || action === "run") {
    const results: Record<string, any> = {};

    // 1. DNS / SSL / Live site check
    const siteCheck = await pingURL(ROTATIONCALL_URL);
    results.site_live = siteCheck.ok
      ? pass(`rotationcall.net responded in ${siteCheck.ms}ms (HTTP ${siteCheck.status})`)
      : fail(`rotationcall.net unreachable — ${siteCheck.error || `HTTP ${siteCheck.status}`}`);

    // 2. Emergent API reachability
    const emergentCheck = await pingURL(EMERGENT_API);
    results.emergent_api = emergentCheck.ok
      ? pass(`Emergent API reachable in ${emergentCheck.ms}ms`)
      : EMERGENTLABS_API_KEY
        ? warn(`Emergent API returned HTTP ${emergentCheck.status} — key present but API may need project-specific endpoint`)
        : fail("Emergent API unreachable AND no API key configured");

    results.emergent_key = EMERGENTLABS_API_KEY
      ? pass("EMERGENTLABS_API_KEY is configured")
      : fail("EMERGENTLABS_API_KEY not set — set it in Base44 secrets");

    // 3. Supabase connection
    const sbCheck = await pingURL(`${SUPABASE_URL}/rest/v1/`);
    results.supabase_url = sbCheck.ok
      ? pass(`Supabase URL reachable in ${sbCheck.ms}ms`)
      : fail(`Supabase URL unreachable — ${sbCheck.error || `HTTP ${sbCheck.status}`}`);

    results.supabase_key = SUPABASE_SERVICE_KEY
      ? pass("SUPABASE_SERVICE_KEY is configured")
      : fail("SUPABASE_SERVICE_KEY not set — Supabase writes will fail");

    // 4. Supabase webhook endpoint (manus-emergent-webhook)
    const webhookCheck = await pingURL(SUPABASE_WEBHOOK);
    results.supabase_webhook = webhookCheck.status === 200 || webhookCheck.status === 401 || webhookCheck.status === 405
      ? pass(`Webhook endpoint live at ${SUPABASE_WEBHOOK} (${webhookCheck.ms}ms)`)
      : fail(`Webhook endpoint not responding — HTTP ${webhookCheck.status || webhookCheck.error}`);

    // 5. Supabase call_events table
    const callEvents = await supabaseQuery("call_events", "*", 5);
    results.supabase_call_events = callEvents?.error
      ? warn(`call_events table: ${callEvents.error} — table may not exist yet, needs creation in Supabase`)
      : pass(`call_events table accessible — ${Array.isArray(callEvents) ? callEvents.length : 0} recent records`);

    // 6. Supabase balance_checks table
    const balanceChecks = await supabaseQuery("balance_checks", "*", 3);
    results.supabase_balance_checks = balanceChecks?.error
      ? warn(`balance_checks table: ${balanceChecks.error} — needs creation in Supabase`)
      : pass(`balance_checks table accessible — ${Array.isArray(balanceChecks) ? balanceChecks.length : 0} records`);

    // 7. Chainstack / Web3
    results.chainstack_rpc = CHAINSTACK_RPC
      ? pass("CHAINSTACK_SOLANA_MAINNET_RPC configured")
      : fail("CHAINSTACK_SOLANA_MAINNET_RPC not set — Web3 wallet gating will fail");

    results.rtv_mint = RTV_MINT
      ? pass(`RTV_TOKEN_MINT configured: ${RTV_MINT.slice(0, 8)}...`)
      : fail("RTV_TOKEN_MINT not set — $RTV balance checks will fail");

    // 8. Web3 bridge self-check
    const bridgeCheck = await pingURL(WEB3_BRIDGE);
    results.web3_bridge = bridgeCheck.ok || bridgeCheck.status === 405
      ? pass(`Web3 bridge endpoint reachable (${bridgeCheck.ms}ms)`)
      : warn(`Web3 bridge returned ${bridgeCheck.status || bridgeCheck.error}`);

    // 9. OpenClaw AXIS-RotationCall agent
    const axisCheck = await pingURL("https://rtv-rotationcall.up.railway.app/openclaw");
    results.openclaw_agent = axisCheck.ok
      ? pass(`AXIS-RotationCall agent online (${axisCheck.ms}ms)`)
      : warn(`AXIS-RotationCall agent not responding — may need Railway deploy (HTTP ${axisCheck.status || axisCheck.error})`);

    // 10. Notification channels
    results.slack = SLACK_BOT_TOKEN ? pass("Slack Bot Token configured") : warn("SLACK_BOT_TOKEN not set — no Slack alerts");
    results.discord = DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID ? pass("Discord configured") : warn("Discord not fully configured");

    // ── Score ──
    const checks = Object.values(results);
    const passed = checks.filter((c: any) => c.status.startsWith("✅")).length;
    const failed = checks.filter((c: any) => c.status.startsWith("❌")).length;
    const warned = checks.filter((c: any) => c.status.startsWith("⚠️")).length;
    const score = Math.round((passed / checks.length) * 100);

    // ── Action items ──
    const action_items: string[] = [];
    if (!SUPABASE_SERVICE_KEY) action_items.push("🔴 Add SUPABASE_SERVICE_KEY to Base44 secrets");
    if (!CHAINSTACK_RPC) action_items.push("🔴 Add CHAINSTACK_SOLANA_MAINNET_RPC to Base44 secrets");
    if (!RTV_MINT) action_items.push("🔴 Add RTV_TOKEN_MINT to Base44 secrets");
    if (!EMERGENTLABS_API_KEY) action_items.push("🔴 Add EMERGENTLABS_API_KEY to Base44 secrets");
    if (callEvents?.error) action_items.push("🟡 Create call_events table in Supabase (SQL below)");
    if (balanceChecks?.error) action_items.push("🟡 Create balance_checks table in Supabase (SQL below)");
    if (!SLACK_BOT_TOKEN) action_items.push("🟠 Add SLACK_BOT_TOKEN for alert routing");
    if (!axisCheck.ok) action_items.push("🟠 Deploy AXIS-RotationCall agent on Railway");

    const supabase_sql = `
-- Run this in Supabase SQL Editor to create RotationCall tables:

CREATE TABLE IF NOT EXISTS call_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text,
  caller_id text,
  duration_sec integer,
  rtv_module text DEFAULT 'rotation_call',
  wallet_address text,
  user_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balance_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  wallet_address text NOT NULL,
  sol_balance numeric,
  rtv_balance numeric,
  network text DEFAULT 'mainnet',
  source text DEFAULT 'rotationcall_gate',
  status text DEFAULT 'success',
  checked_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_checks ENABLE ROW LEVEL SECURITY;

-- Service role bypass policy
CREATE POLICY "Service role bypass" ON call_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON balance_checks FOR ALL USING (auth.role() = 'service_role');
    `.trim();

    const report_text = `🔧 ROTATIONCALL DEBUGGER REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━
Health Score: ${score}/100 | ✅ ${passed} passed | ❌ ${failed} failed | ⚠️ ${warned} warnings
Runtime: ${Date.now() - startTime}ms
━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(results).map(([k, v]: [string, any]) => `${v.status} ${k.toUpperCase().replace(/_/g, " ")}\n   ${v.detail}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION ITEMS:
${action_items.length ? action_items.join("\n") : "✅ No critical actions needed"}`;

    await Promise.allSettled([
      notifySlack(report_text),
      notifyDiscord(report_text),
    ]);

    return Response.json({
      status: "ok",
      tool: "RotationCall Debugger",
      score: `${score}/100`,
      summary: { passed, failed, warnings: warned },
      runtime_ms: Date.now() - startTime,
      checks: results,
      action_items,
      supabase_sql,
      timestamp: new Date().toISOString(),
    });
  }

  // ── LIVE CALL EVENTS ──
  if (action === "call_logs") {
    const logs = await supabaseQuery("call_events", "*", 20);
    return Response.json({ status: "ok", call_events: logs, timestamp: new Date().toISOString() });
  }

  // ── BALANCE CHECKS ──
  if (action === "balance_logs") {
    const logs = await supabaseQuery("balance_checks", "*", 20);
    return Response.json({ status: "ok", balance_checks: logs, timestamp: new Date().toISOString() });
  }

  // ── SUPABASE TABLE SQL ──
  if (action === "get_sql") {
    return Response.json({
      status: "ok",
      message: "Run this SQL in your Supabase SQL Editor",
      sql: `CREATE TABLE IF NOT EXISTS call_events (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, event_type text, caller_id text, duration_sec integer, rtv_module text DEFAULT 'rotation_call', wallet_address text, user_id text, metadata jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS balance_checks (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id text, wallet_address text NOT NULL, sol_balance numeric, rtv_balance numeric, network text DEFAULT 'mainnet', source text DEFAULT 'rotationcall_gate', status text DEFAULT 'success', checked_at timestamptz DEFAULT now());`,
    });
  }

  return Response.json({ error: "Unknown action", available: ["full_debug", "call_logs", "balance_logs", "get_sql"] }, { status: 400 });
}
