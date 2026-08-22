/**
 * POST /api/streams/start
 * Marks a stream live after create-input succeeds.
 * Called by GoLiveModal after RTMP credentials are returned.
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
    const supabaseUrl = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY");
    const creatorId = String(body.creator_id || "");
    const title = String(body.title || "");
    const category = String(body.category || "talk");
    const streamId = body.stream_id ? String(body.stream_id) : null;
    const cfUid = body.cf_stream_uid ? String(body.cf_stream_uid) : null;

    if (!supabaseUrl || !serviceKey) {
      // Soft-ok: client already has RTMP; ledger optional in degraded mode
      return Response.json(
        {
          success: true,
          degraded: true,
          message: "Supabase not configured — stream may still publish via RTMP",
          latency_ms: Date.now() - start,
        },
        { headers: CORS }
      );
    }

    const patch: Record<string, unknown> = {
      is_live: true,
      status: "live",
      category,
      started_at: new Date().toISOString(),
    };
    if (title) patch.title = title;

    let url = `${supabaseUrl}/rest/v1/streams?`;
    if (streamId) url += `id=eq.${encodeURIComponent(streamId)}`;
    else if (cfUid) url += `cf_stream_uid=eq.${encodeURIComponent(cfUid)}`;
    else if (creatorId) url += `creator_id=eq.${encodeURIComponent(creatorId)}&order=started_at.desc&limit=1`;
    else {
      return Response.json(
        { success: false, error: "stream_id, cf_stream_uid, or creator_id required" },
        { status: 400, headers: CORS }
      );
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    });

    const rows = await res.json().catch(() => []);
    return Response.json(
      {
        success: res.ok,
        stream: Array.isArray(rows) ? rows[0] : rows,
        latency_ms: Date.now() - start,
      },
      { status: res.ok ? 200 : 502, headers: CORS }
    );
  } catch (e: any) {
    return Response.json(
      { success: false, error: e?.message || "streams/start failed", latency_ms: Date.now() - start },
      { status: 500, headers: CORS }
    );
  }
});
