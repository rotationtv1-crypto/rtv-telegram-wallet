import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.pathname;
  const body = await req.json().catch(() => ({}));

  const SUPABASE_URL = "https://xynkgaxfwvpcixissxdz.supabase.co";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("JWT_TOKEN_4") || "";
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";

  // ── Health check ─────────────────────────────────
  if (path.endsWith("/health") || path.endsWith("/auth/health")) {
    return Response.json({
      success: true,
      service: "rtv-auth-gateway",
      telegram_verify: !!BOT_TOKEN,
      supabase_auth: true,
      oauth_providers: ["google", "github", "discord", "slack", "linkedin", "notion", "apple", "facebook", "twitter"],
      email_otp: true,
      phone_otp: true,
      sms_provider: "twilio",
      supabase_url: SUPABASE_URL,
    }, { headers: corsHeaders });
  }

  // ── Telegram initData verification ───────────────
  if (path.endsWith("/telegram-verify") || path.endsWith("/auth/telegram")) {
    const { initData } = body;
    if (!initData) {
      return Response.json({ error: "initData required" }, { status: 400, headers: corsHeaders });
    }

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return Response.json({ error: "No hash in initData" }, { status: 400, headers: corsHeaders });
    }

    params.delete("hash");
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode("WebAppData");
    const secretKey = await crypto.subtle.importKey("raw", secretKeyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const secret = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(BOT_TOKEN));
    const validationKey = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const calculatedHash = await crypto.subtle.sign("HMAC", validationKey, encoder.encode(sortedParams));
    const calculatedHex = Array.from(new Uint8Array(calculatedHash)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (calculatedHex !== hash) {
      return Response.json({ error: "Hash mismatch — invalid initData" }, { status: 401, headers: corsHeaders });
    }

    const authDate = parseInt(params.get("auth_date") || "0");
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return Response.json({ error: "InitData expired (>24h)" }, { status: 401, headers: corsHeaders });
    }

    const userStr = params.get("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      return Response.json({ error: "No user data in initData" }, { status: 400, headers: corsHeaders });
    }

    // Create or update RTVUser
    try {
      const existing = await base44.entities.RTVUser.filter({ telegram_id: String(user.id) });

      if (existing && existing.length > 0) {
        const updated = await base44.entities.RTVUser.update(existing[0].id, {
          username: user.username,
          display_name: `${user.first_name} ${user.last_name || ""}`.trim(),
          avatar_url: user.photo_url,
          last_active_at: new Date().toISOString(),
          status: "active",
        });
        return Response.json({ success: true, user, rtv_user: updated, action: "updated" }, { headers: corsHeaders });
      } else {
        const newUser = await base44.entities.RTVUser.create({
          telegram_id: String(user.id),
          username: user.username,
          display_name: `${user.first_name} ${user.last_name || ""}`.trim(),
          avatar_url: user.photo_url,
          role: "user",
          status: "active",
          rtv_balance: 0,
          pending_balance: 0,
          total_earnings_usd: 0,
          total_earnings_rtv: 0,
          is_verified: false,
          kyc_status: "unverified",
          safety_score: 100,
          reputation_tier: "new",
          loyalty_tier: "bronze",
          referral_code: `RTV${user.id}`,
          last_active_at: new Date().toISOString(),
        });
        return Response.json({ success: true, user, rtv_user: newUser, action: "created" }, { headers: corsHeaders });
      }
    } catch (e) {
      return Response.json({ success: true, user, warning: "Base44 write deferred: " + e.message }, { headers: corsHeaders });
    }
  }

  // ── Supabase OAuth URL ───────────────────────────
  if (path.endsWith("/oauth-url") || path.endsWith("/auth/oauth-url")) {
    const { provider, redirectTo } = body;
    if (!provider) {
      return Response.json({ error: "provider required" }, { status: 400, headers: corsHeaders });
    }
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectTo || SUPABASE_URL + "/auth/v1/callback"}`;
    return Response.json({ success: true, oauth_url: oauthUrl, provider }, { headers: corsHeaders });
  }

  // ── List OAuth providers ─────────────────────────
  if (path.endsWith("/oauth-providers") || path.endsWith("/auth/providers")) {
    return Response.json({
      success: true,
      providers: [
        { id: "google", name: "Google", icon: "🔍" },
        { id: "github", name: "GitHub", icon: "🐙" },
        { id: "discord", name: "Discord", icon: "🎮" },
        { id: "slack", name: "Slack", icon: "💬" },
        { id: "linkedin", name: "LinkedIn", icon: "💼" },
        { id: "notion", name: "Notion", icon: "📝" },
        { id: "apple", name: "Apple", icon: "🍎" },
        { id: "facebook", name: "Facebook", icon: "📘" },
        { id: "twitter", name: "X/Twitter", icon: "🐦" },
        { id: "spotify", name: "Spotify", icon: "🎵" },
        { id: "twitch", name: "Twitch", icon: "🎮" },
      ],
    }, { headers: corsHeaders });
  }

  // ── Email OTP ────────────────────────────────────
  if (path.endsWith("/email-otp") || path.endsWith("/auth/email-otp")) {
    const { email } = body;
    if (!email) {
      return Response.json({ error: "email required" }, { status: 400, headers: corsHeaders });
    }
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, create_user: true }),
    });
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ success: false, error: `Email OTP failed: ${error}` }, { status: 500, headers: corsHeaders });
    }
    return Response.json({ success: true, message: "OTP sent to email" }, { headers: corsHeaders });
  }

  // ── Email OTP verify ─────────────────────────────
  if (path.endsWith("/email-verify") || path.endsWith("/auth/email-verify")) {
    const { email, token } = body;
    if (!email || !token) {
      return Response.json({ error: "email and token required" }, { status: 400, headers: corsHeaders });
    }
    const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, token, type: "email" }),
    });
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ success: false, error: `Email verification failed: ${error}` }, { status: 401, headers: corsHeaders });
    }
    const session = await response.json();
    return Response.json({ success: true, session }, { headers: corsHeaders });
  }

  // ── Phone OTP ────────────────────────────────────
  if (path.endsWith("/phone-otp") || path.endsWith("/auth/phone-otp")) {
    const { phone } = body;
    if (!phone) {
      return Response.json({ error: "phone required" }, { status: 400, headers: corsHeaders });
    }
    const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ phone, create_user: true, channel: "sms" }),
    });
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ success: false, error: `Phone OTP failed: ${error}` }, { status: 500, headers: corsHeaders });
    }
    return Response.json({ success: true, message: "OTP sent to phone via Twilio SMS" }, { headers: corsHeaders });
  }

  // ── Phone OTP verify ─────────────────────────────
  if (path.endsWith("/phone-verify") || path.endsWith("/auth/phone-verify")) {
    const { phone, token } = body;
    if (!phone || !token) {
      return Response.json({ error: "phone and token required" }, { status: 400, headers: corsHeaders });
    }
    const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ phone, token, type: "sms" }),
    });
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ success: false, error: `Phone verification failed: ${error}` }, { status: 401, headers: corsHeaders });
    }
    const session = await response.json();
    return Response.json({ success: true, session }, { headers: corsHeaders });
  }

  return Response.json({
    error: "Unknown endpoint",
    endpoints: [
      "/health",
      "/telegram-verify — POST {initData}",
      "/oauth-url — POST {provider, redirectTo?}",
      "/oauth-providers — GET",
      "/email-otp — POST {email}",
      "/email-verify — POST {email, token}",
      "/phone-otp — POST {phone}",
      "/phone-verify — POST {phone, token}",
    ],
  }, { status: 404, headers: corsHeaders });
});