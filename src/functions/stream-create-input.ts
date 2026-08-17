/**
 * POST /api/stream/create-input
 * Production Go Live — Cloudflare Stream live_inputs
 * Response shape matches GoLiveModal.tsx expectations.
 *
 * Secrets (wrangler secret put):
 *   CLOUDFLARE_ACCOUNT_ID | CF_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN  | CF_STREAM_API_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   TELEGRAM_BOT_TOKEN (optional HMAC)
 */

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Init-Data",
};

function env(key: string, ...alts: string[]): string {
  for (const k of [key, ...alts]) {
    const v = Deno.env.get(k);
    if (v) return v;
  }
  return "";
}

async function createLiveInput(accountId: string, token: string, meta: Record<string, string>) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meta,
        recording: { mode: "automatic", timeoutSeconds: 14400 },
      }),
    }
  );
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Cloudflare Stream live_inputs failed");
  }
  return data.result;
}

Deno.serve(async (req) => {
  const start = Date.now();
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return Response.json({ success: false, error: "POST required" }, { status: 405, headers: CORS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const accountId = env("CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
    const token = env("CLOUDFLARE_API_TOKEN", "CF_STREAM_API_TOKEN", "CF_API_TOKEN");
    const supabaseUrl = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY");

    if (!accountId || !token) {
      return Response.json(
        {
          success: false,
          error: "Cloudflare Stream secrets missing (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)",
          latency_ms: Date.now() - start,
        },
        { status: 503, headers: CORS }
      );
    }

    const creatorId = String(body.creator_id || body.user_id || "0");
    const title = String(body.title || "Live Stream").slice(0, 80);
    const category = String(body.category || "talk");
    const creatorName = String(body.creator_name || "Creator");

    const input = await createLiveInput(accountId, token, {
      creator_id: creatorId,
      title,
      category,
      ecosystem: "RotationTV",
    });

    const uid = input.uid as string;
    const rtmpUrl =
      input.rtmps?.url ||
      input.webRTC?.url ||
      `rtmps://live.cloudflare.com:443/live/${uid}`;
    const streamKey =
      input.rtmps?.streamKey ||
      input.rtmps?.stream_key ||
      uid;
    const hls = `https://customer-${accountId}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
    const playbackFallback = `https://videodelivery.net/${uid}`;

    let streamId: string | null = null;
    if (supabaseUrl && serviceKey) {
      const ins = await fetch(`${supabaseUrl}/rest/v1/streams`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          creator_id: creatorId,
          creator_name: creatorName,
          title,
          category,
          is_live: false,
          status: "ready",
          cf_stream_uid: uid,
          rtmp_url: rtmpUrl,
          stream_url: playbackFallback,
          started_at: new Date().toISOString(),
        }),
      });
      const rows = await ins.json().catch(() => null);
      streamId = rows?.[0]?.id ?? rows?.id ?? null;
    }

    // Contract expected by GoLiveModal.tsx
    return Response.json(
      {
        success: true,
        stream_id: streamId,
        cf_stream_uid: uid,
        rtmp_url: rtmpUrl,
        stream_key: streamKey,
        playback: {
          hls,
          url: playbackFallback,
        },
        creator_id: creatorId,
        title,
        category,
        latency_ms: Date.now() - start,
      },
      { headers: CORS }
    );
  } catch (e: any) {
    return Response.json(
      {
        success: false,
        error: e?.message || "stream create failed",
        latency_ms: Date.now() - start,
      },
      { status: 500, headers: CORS }
    );
  }
});
