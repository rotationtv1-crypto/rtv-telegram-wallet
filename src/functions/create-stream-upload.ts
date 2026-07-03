// ============================================================
// CREATE-STREAM-UPLOAD — Authenticated Cloudflare Stream Upload
// RotationTV Network LLC — Sovereign Architecture
// ============================================================
// Flow:
//   1. Mini App sends POST with Telegram initData + stream metadata
//   2. HMAC-SHA256 verification of initData
//   3. Supabase inserts stream record (is_live: false, status: 'pending_upload')
//   4. Cloudflare Stream API generates authenticated upload URL
//   5. Returns upload URL + stream UID to Mini App
//   6. Mini App uploads video via direct-to-cloud URL
//   7. Cloudflare webhook fires on 'live' → /webhook/stream
//   8. Webhook verifies signature → sets is_live: true
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
const CLOUDFLARE_STREAM_WEBHOOK_SECRET = Deno.env.get("CLOUDFLARE_STREAM_WEBHOOK_SECRET") || "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";

// ── CORS ──────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Init-Data, X-RTV-Key",
};

// ── HMAC Verification ─────────────────────────────────
async function verifyInitData(initData: string): Promise<{ valid: boolean; user?: any }> {
  if (!initData || !TELEGRAM_BOT_TOKEN) return { valid: false };

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return { valid: false };

  // Remove hash, sort remaining params
  urlParams.delete("hash");
  const checkArray = [...urlParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  const checkString = checkArray.map(([k, v]) => `${k}=${v}`).join("\n");

  // HMAC-SHA256(key=SHA256(bot_token), data=checkString)
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", encoder.encode(TELEGRAM_BOT_TOKEN));
  const key = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(checkString));

  const sigHex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
  const valid = sigHex === hash;

  if (valid) {
    try {
      const userJson = urlParams.get("user");
      const user = userJson ? JSON.parse(userJson) : null;
      return { valid: true, user };
    } catch {
      return { valid: true };
    }
  }
  return { valid: false };
}

// ── Supabase Helper ────────────────────────────────────
async function sbQuery(table: string, method: string, body?: any, filter?: string) {
  const headers: Record<string, string> = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  if (filter) url += `?${filter}`;

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  return res.json();
}

// ── Cloudflare Stream API ─────────────────────────────
async function createStreamUpload(
  creatorId: string,
  title: string,
  category: string,
  maxDurationSeconds: number = 14400 // 4 hours default
): Promise<{ uid: string; uploadUrl: string; rtmpUrl: string; playbackUrl: string }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meta: {
          creator_id: creatorId,
          title,
          category,
          ecosystem: "RotationTV",
        },
        recording: {
          mode: "automatic",
          timeoutSeconds: maxDurationSeconds,
        },
      }),
    }
  );

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Cloudflare Stream API error");
  }

  const input = data.result;
  return {
    uid: input.uid,
    uploadUrl: input.rtmps?.url || `rtmps://live.cloudflare.com:443/live/${input.uid}`,
    rtmpUrl: input.rtmps?.url || `rtmps://live.cloudflare.com:443/live/${input.uid}`,
    playbackUrl: `https://videodelivery.net/${input.uid}`,
  };
}

// ── Audit Log ─────────────────────────────────────────
async function auditLog(action: string, metadata: Record<string, any>) {
  await sbQuery("wallet_transactions", "POST", {
    telegram_id: metadata.creator_id || "system",
    type: "stream_event",
    amount: 0,
    token: "RTV",
    metadata: { action, ...metadata, timestamp: new Date().toISOString() },
  }).catch(() => {}); // Non-blocking
}

// ── Main Handler ──────────────────────────────────────
Deno.serve(async (req) => {
  const start = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const body = await req.json();
    const initData = req.headers.get("X-Init-Data") || body.init_data || "";

    // ── Step 1: HMAC Verification ──────────────────
    const { valid, user } = await verifyInitData(initData);
    if (!valid) {
      return Response.json({
        success: false,
        error: "HMAC verification failed — invalid initData",
        latency_ms: Date.now() - start,
      }, { status: 401, headers: CORS });
    }

    const creatorId = String(user?.id || body.creator_id || "0");
    const creatorName = user?.first_name || body.creator_name || "Sovereign";
    const title = body.title || `${creatorName}'s Stream`;
    const category = body.category || "general";
    const maxDuration = body.max_duration_seconds || 14400;

    // ── Step 2: Supabase Stream Record ─────────────
    const streamRecord = await sbQuery("streams", "POST", {
      creator_id: creatorId,
      creator_name: creatorName,
      title,
      category,
      is_live: false,
      status: "pending_upload",
      viewer_count: 0,
      gift_total: 0,
      stream_url: "",
      started_at: new Date().toISOString(),
    });

    const streamId = streamRecord?.id || streamRecord?.[0]?.id;

    // ── Step 3: Cloudflare Stream Upload URL ───────
    const streamUpload = await createStreamUpload(
      creatorId,
      title,
      category,
      maxDuration
    );

    // ── Step 4: Update Supabase with Stream UID ────
    await sbQuery("streams", "PATCH", {
      stream_url: streamUpload.playbackUrl,
      cf_stream_uid: streamUpload.uid,
      rtmp_url: streamUpload.rtmpUrl,
      status: "ready_for_upload",
    }, `id=eq.${streamId}`);

    // ── Step 5: Audit Log ─────────────────────────
    await auditLog("create_stream_upload", {
      stream_id: streamId,
      creator_id: creatorId,
      creator_name: creatorName,
      cf_uid: streamUpload.uid,
      title,
      category,
    });

    // ── Step 6: Return to Mini App ─────────────────
    return Response.json({
      success: true,
      stream_id: streamId,
      cf_stream_uid: streamUpload.uid,
      upload_url: streamUpload.uploadUrl,
      rtmp_url: streamUpload.rtmpUrl,
      playback_url: streamUpload.playbackUrl,
      creator_id: creatorId,
      creator_name: creatorName,
      title,
      category,
      status: "ready_for_upload",
      latency_ms: Date.now() - start,
    }, { headers: CORS });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || "Internal server error",
      latency_ms: Date.now() - start,
    }, { status: 500, headers: CORS });
  }
});
