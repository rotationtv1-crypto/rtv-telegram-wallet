// ============================================================
// WEBHOOK/STREAM — Cloudflare Stream Event Handler
// Verifies webhook signatures to prevent is_live spoofing
// RotationTV Network LLC — Sovereign Architecture
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const CLOUDFLARE_STREAM_WEBHOOK_SECRET = Deno.env.get("CLOUDFLARE_STREAM_WEBHOOK_SECRET") || "";
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Webhook-Signature",
};

// ── Webhook Signature Verification ─────────────────────
async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  if (!CLOUDFLARE_STREAM_WEBHOOK_SECRET || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CLOUDFLARE_STREAM_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = [...new Uint8Array(sig)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === signature;
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

// ── Main Handler ──────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("Webhook-Signature") || "";

    // ── Verify signature ──────────────────────────
    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return Response.json({
        success: false,
        error: "Webhook signature verification failed",
      }, { status: 401, headers: CORS });
    }

    const event = JSON.parse(rawBody);
    const streamUid = event.uid || event.stream_uid;
    const eventType = event.event || event.type;

    // ── Process events ────────────────────────────
    if (eventType === "live") {
      // Stream went live
      await sbQuery("streams", "PATCH", {
        is_live: true,
        status: "live",
        started_at: new Date().toISOString(),
      }, `cf_stream_uid=eq.${streamUid}`);

      // Discord notification
      if (DISCORD_WEBHOOK_URL) {
        const stream = await sbQuery("streams", "GET", undefined, `cf_stream_uid=eq.${streamUid}&select=creator_name,title`);
        const s = stream?.[0] || {};
        fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🔴 **${s.creator_name || "Creator"}** is now LIVE: ${s.title || "Untitled"}`,
          }),
        }).catch(() => {});
      }
    }

    if (eventType === "ended" || eventType === "offline") {
      // Stream ended
      await sbQuery("streams", "PATCH", {
        is_live: false,
        status: "ended",
        ended_at: new Date().toISOString(),
      }, `cf_stream_uid=eq.${streamUid}`);
    }

    if (eventType === "error") {
      // Stream error
      await sbQuery("streams", "PATCH", {
        is_live: false,
        status: "error",
        error_message: event.message || "Unknown error",
      }, `cf_stream_uid=eq.${streamUid}`);
    }

    return Response.json({ success: true, event: eventType }, { headers: CORS });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || "Webhook processing error",
    }, { status: 500, headers: CORS });
  }
});
