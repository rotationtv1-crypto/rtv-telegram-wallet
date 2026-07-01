// Vault Init Data Verifier — RotationTV Sovereign Vault
// Security sequence: Telegram init data → HMAC verify → Supabase proxy → Stripe routes
// Presidential Authority: Darrel | "Learn it. Live it. Love it."

const SUPABASE_URL  = "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const STRIPE_KEY    = Deno.env.get("STRIPE_SECRET_KEY")    || "";
const BOT_TOKEN     = Deno.env.get("RTVS_BOT_TOKEN") || Deno.env.get("TELEGRAM_BOT_TOKEN") || "";

// ── HMAC-SHA256 verify Telegram init data ─────────────────
async function verifyTelegramInitData(initData: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const params   = new URLSearchParams(initData);
    const hash     = params.get("hash");
    if (!hash) return { valid: false };

    // Build check string — all fields except hash, sorted
    params.delete("hash");
    const entries  = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    // Derive secret key: HMAC-SHA256("WebAppData", bot_token)
    const enc      = new TextEncoder();
    const baseKey  = await crypto.subtle.importKey("raw", enc.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const secretRaw = await crypto.subtle.sign("HMAC", baseKey, enc.encode(BOT_TOKEN));
    const secretKey = await crypto.subtle.importKey("raw", secretRaw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

    // Sign check string
    const sigBuf   = await crypto.subtle.sign("HMAC", secretKey, enc.encode(dataCheckString));
    const sigHex   = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (sigHex !== hash) return { valid: false };

    // Parse user from init data
    const userStr  = params.get("user");
    const user     = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;

    // Verify not stale (max 24h)
    const authDate = parseInt(params.get("auth_date") || "0");
    const age      = Math.floor(Date.now() / 1000) - authDate;
    if (age > 86400) return { valid: false };

    return { valid: true, user };
  } catch (e) {
    return { valid: false };
  }
}

// ── Supabase proxy — signed query ────────────────────────
async function supabaseQuery(table: string, query: Record<string, any>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) params.set(k, String(v));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
    },
  });
  return res.json();
}

// ── Stripe Connect — create account ──────────────────────
async function stripeCreateConnectAccount(email: string, tg_id: string) {
  const deployed = Deno.env.get("DEPLOYED_URL") || "https://rotationtvai.com";
  const body     = new URLSearchParams({
    type:                   "express",
    "email":                email,
    "metadata[tg_id]":      tg_id,
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]":     "true",
  });

  const res = await fetch("https://api.stripe.com/v1/accounts", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_KEY}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  return res.json();
}

// ── Stripe Connect — onboarding link ─────────────────────
async function stripeOnboardingLink(account_id: string) {
  const deployed  = Deno.env.get("DEPLOYED_URL") || "https://rotationtvai.com";
  const body = new URLSearchParams({
    account:     account_id,
    type:        "account_onboarding",
    return_url:  `${deployed}/vault/stripe/return`,
    refresh_url: `${deployed}/vault/stripe/refresh`,
  });

  const res = await fetch("https://api.stripe.com/v1/account_links", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_KEY}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  return res.json();
}

// ── MAIN HANDLER ─────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
    "Content-Type":                 "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url    = new URL(req.url);
  const route  = url.pathname.split("/").pop() || "";
  const body   = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  // ── POST /verify-init-data ────────────────────────────
  if (route === "verify-init-data" || body.action === "verify") {
    const initData = body.init_data || req.headers.get("X-Telegram-Init-Data") || "";

    if (!initData) {
      return new Response(JSON.stringify({ ok: false, error: "init_data required" }), { headers: cors, status: 400 });
    }

    const result = await verifyTelegramInitData(initData);

    if (!result.valid) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid Telegram init data" }), { headers: cors, status: 401 });
    }

    // Bind identity to Supabase
    const { user } = result;
    if (user) {
      const existing = await supabaseQuery("WalletIntegration", {
        "select": "id,wallet_address,rtv_balance,sol_balance",
        "user_id": `eq.${user.id}`,
        "limit":   "1",
      }).catch(() => []);

      return new Response(JSON.stringify({
        ok:         true,
        user,
        wallet:     Array.isArray(existing) ? existing[0] || null : null,
        timestamp:  new Date().toISOString(),
        session:    `vault_${user.id}_${Date.now()}`,
      }), { headers: cors });
    }

    return new Response(JSON.stringify({ ok: true, valid: true }), { headers: cors });
  }

  // ── POST /wallet ──────────────────────────────────────
  if (route === "wallet" || body.action === "wallet") {
    const initData = body.init_data || req.headers.get("X-Telegram-Init-Data") || "";
    const verify   = await verifyTelegramInitData(initData);
    if (!verify.valid) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers: cors, status: 401 });

    const user_id = verify.user?.id;
    const data    = await supabaseQuery("WalletIntegration", {
      select:  "*",
      user_id: `eq.${user_id}`,
      limit:   "1",
    }).catch(() => []);

    const token = await supabaseQuery("RTVToken", {
      select:  "*",
      user_id: `eq.${user_id}`,
      limit:   "1",
    }).catch(() => []);

    return new Response(JSON.stringify({
      ok:     true,
      wallet: Array.isArray(data) ? data[0] || null : null,
      token:  Array.isArray(token) ? token[0] || null : null,
    }), { headers: cors });
  }

  // ── POST /stripe-connect ──────────────────────────────
  if (route === "stripe-connect" || body.action === "stripe_connect") {
    const initData = body.init_data || req.headers.get("X-Telegram-Init-Data") || "";
    const verify   = await verifyTelegramInitData(initData);
    if (!verify.valid) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers: cors, status: 401 });

    const { email } = body;
    if (!email) return new Response(JSON.stringify({ ok: false, error: "email required" }), { headers: cors, status: 400 });

    const account = await stripeCreateConnectAccount(email, String(verify.user?.id || ""));
    if (account.error) return new Response(JSON.stringify({ ok: false, error: account.error }), { headers: cors, status: 400 });

    const link = await stripeOnboardingLink(account.id);
    return new Response(JSON.stringify({ ok: true, account_id: account.id, onboarding_url: link.url }), { headers: cors });
  }

  // ── GET /status ───────────────────────────────────────
  return new Response(JSON.stringify({
    ok:        true,
    service:   "Vault Init Verifier",
    version:   "1.0",
    routes:    ["verify-init-data", "wallet", "stripe-connect"],
    deployed:  "https://rotationtvai.com",
    supabase:  SUPABASE_URL,
    stripe:    STRIPE_KEY ? "configured" : "missing",
    bot_token: BOT_TOKEN ? "configured" : "missing",
    timestamp: new Date().toISOString(),
  }), { headers: cors });
}
