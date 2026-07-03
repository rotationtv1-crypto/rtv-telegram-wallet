// RTV Live Stream Platform Worker v4.1.0
// WebRTC (WHIP/WHEP) via Cloudflare Stream + sovereign payments.
//
// Stream state lives in a Durable Object (StreamRegistry) so it PERSISTS across
// isolates. The previous version kept `activeStreams` in an in-memory Map, which
// a stateless Worker loses between requests — streams vanished and
// /api/stream/list returned empty.

const CF_ACCOUNT_ID = "7e431c541ea0f39d7f7fe5fd9f06eada";
const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Telegram-Init-Data",
  "Content-Type": "application/json",
};

// Economic parity: 1 RTV = $0.01 USD
const RTV_PER_USD = 100;
const RTV_PER_STAR = 1.3; // 1 Star = $0.013

const GIFTS = [
  { id: "rose", name: "Rose", emoji: "🌹", price_rtv: 10, price_usd: 0.1, category: "basic" },
  { id: "heart", name: "Heart", emoji: "❤️", price_rtv: 50, price_usd: 0.5, category: "basic" },
  { id: "diamond", name: "Diamond", emoji: "💎", price_rtv: 500, price_usd: 5, category: "premium" },
  { id: "crown", name: "Crown", emoji: "👑", price_rtv: 1000, price_usd: 10, category: "premium" },
  { id: "galaxy", name: "Galaxy", emoji: "🌌", price_rtv: 5000, price_usd: 50, category: "legendary" },
  { id: "universe", name: "Universe", emoji: "🎆", price_rtv: 10000, price_usd: 100, category: "legendary" },
];

const TIERS = [
  { tier: "bronze", price_usd: 4.99, price_rtv: 499, perks: ["Badge", "Priority chat"] },
  { tier: "silver", price_usd: 9.99, price_rtv: 999, perks: ["Badge", "Priority chat", "Exclusive content"] },
  { tier: "gold", price_usd: 19.99, price_rtv: 1999, perks: ["Badge", "Priority chat", "Exclusive content", "DM access", "Free gifts"] },
  { tier: "platinum", price_usd: 49.99, price_rtv: 4999, perks: ["All perks", "Personal calls", "Custom gifts"] },
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function getComboMultiplier(combo) {
  if (combo >= 100) return 500;
  if (combo >= 50) return 300;
  if (combo >= 25) return 200;
  if (combo >= 10) return 150;
  if (combo >= 5) return 120;
  return 100;
}

// The singleton stream registry Durable Object stub (one global instance).
function registry(env) {
  const id = env.STREAM_REGISTRY.idFromName("global");
  return env.STREAM_REGISTRY.get(id);
}

// Call the DO over its internal fetch protocol.
async function doCall(env, action, { method = "GET", body } = {}) {
  const res = await registry(env).fetch(`https://stream-registry${action}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Durable Object: global registry of active streams (persistent).
// SQLite-backed (see wrangler.jsonc migrations: new_sqlite_classes) so it runs
// without the classic-DO paid requirement.
// ---------------------------------------------------------------------------
export class StreamRegistry {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const action = url.pathname;

    if (action === "/create") {
      const stream = await request.json();
      await this.ctx.storage.put(`stream:${stream.stream_id}`, stream);
      return Response.json(stream);
    }

    if (action === "/get") {
      const id = url.searchParams.get("id");
      const stream = await this.ctx.storage.get(`stream:${id}`);
      return Response.json(stream ?? null);
    }

    if (action === "/list") {
      const map = await this.ctx.storage.list({ prefix: "stream:" });
      const streams = [...map.values()].filter((s) => s.status === "live");
      return Response.json(streams);
    }

    if (action === "/end") {
      const { id } = await request.json();
      const stream = await this.ctx.storage.get(`stream:${id}`);
      if (!stream) return Response.json(null);
      await this.ctx.storage.delete(`stream:${id}`);
      return Response.json({ ...stream, status: "ended", ended_at: new Date().toISOString() });
    }

    if (action === "/tip") {
      const { id, amount_rtv } = await request.json();
      const stream = await this.ctx.storage.get(`stream:${id}`);
      if (stream) {
        stream.tip_count = (stream.tip_count || 0) + 1;
        stream.total_tips_rtv = (stream.total_tips_rtv || 0) + (amount_rtv || 0);
        await this.ctx.storage.put(`stream:${id}`, stream);
      }
      return Response.json(stream ?? null);
    }

    return new Response("not found", { status: 404 });
  }
}

// ---------------------------------------------------------------------------
// Worker entrypoint.
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { headers: CORS });

    if (path === "/health") {
      return json({
        status: "healthy",
        version: env.RTV_VERSION || "4.1.0",
        service: "rtv-stream",
        protocol: "WebRTC (WHIP/WHEP)",
        state: "durable-object",
        features: ["go_live", "watch", "gifts", "tips", "subscriptions", "pk_battles"],
        parity: env.RTV_PARITY || "1 RTV = $0.01 USD",
      });
    }

    // ---- Stream management (persistent via Durable Object) ----
    if (path === "/api/stream/create" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const token = env.CLOUDFLARE_API_TOKEN || "";
      let streamId = `rtv_${Date.now()}`;
      let whipUrl = `https://customer-mock.cloudflarestream.com/${streamId}/webRTC/publish`;
      let whepUrl = `https://customer-mock.cloudflarestream.com/${streamId}/webRTC/play`;

      // Try to provision a real Cloudflare Stream WebRTC live input.
      if (token) {
        try {
          const cfRes = await fetch(`${CF_API_BASE}/live_inputs`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              meta: { name: body.title || "RTV Stream", creator: body.creator_id || "unknown" },
              recording: { mode: "automatic" },
            }),
          });
          const cfData = await cfRes.json();
          if (cfData.success && cfData.result) {
            streamId = cfData.result.uid;
            whipUrl = cfData.result.webRTC?.url || whipUrl;
            whepUrl = cfData.result.webRTCPlayback?.url || whepUrl;
          }
        } catch {
          // fall back to mock URLs above
        }
      }

      const stream = {
        stream_id: streamId,
        title: body.title || "RTV Stream",
        creator_id: body.creator_id || "unknown",
        status: "live",
        whip_url: whipUrl,
        whep_url: whepUrl,
        viewer_count: 0,
        tip_count: 0,
        total_tips_rtv: 0,
        started_at: new Date().toISOString(),
      };
      await doCall(env, "/create", { method: "POST", body: stream });

      return json({
        success: true,
        ...stream,
        message: "Go Live! Camera will open automatically. Tap End Stream when done.",
        note: "WebRTC mode — no RTMP, no stream keys needed.",
      });
    }

    if (path === "/api/stream/list" && method === "GET") {
      const streams = await doCall(env, "/list");
      return json({
        streams: streams.map((s) => ({
          stream_id: s.stream_id,
          title: s.title,
          creator_id: s.creator_id,
          status: s.status,
          viewer_count: s.viewer_count,
          whep_url: s.whep_url,
          started_at: s.started_at,
        })),
        total: streams.length,
      });
    }

    const endMatch = path.match(/^\/api\/stream\/([^/]+)\/end$/);
    if (endMatch && method === "POST") {
      const ended = await doCall(env, "/end", { method: "POST", body: { id: endMatch[1] } });
      if (!ended) return json({ error: "Stream not found" }, 404);
      const durationSec = Math.floor((Date.now() - new Date(ended.started_at).getTime()) / 1000);
      return json({ success: true, message: "Stream ended. Recording will be available shortly.", duration_sec: durationSec });
    }

    const getMatch = path.match(/^\/api\/stream\/([^/]+)$/);
    if (getMatch && method === "GET") {
      const stream = await doCall(env, `/get?id=${encodeURIComponent(getMatch[1])}`);
      if (!stream) return json({ error: "Stream not found" }, 404);
      return json({ success: true, stream });
    }

    // ---- Tips (updates the stream's counters in the DO) ----
    if (path === "/api/tip/send" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const amountRtv = Math.floor((body.amount_usd || 0) * RTV_PER_USD);
      const starsRtv = Math.floor((body.stars_amount || 0) * RTV_PER_STAR);
      const totalRtv = amountRtv + starsRtv;
      const combo = body.combo_count || 1;
      const multiplier = getComboMultiplier(combo);

      const creatorShare = Math.floor(totalRtv * 0.8);
      const platformShare = Math.floor(totalRtv * 0.15);
      const agencyShare = totalRtv - creatorShare - platformShare;

      if (body.stream_id) {
        await doCall(env, "/tip", { method: "POST", body: { id: body.stream_id, amount_rtv: totalRtv } });
      }

      return json({
        success: true,
        tip_id: crypto.randomUUID(),
        amount_rtv: totalRtv,
        amount_usd: (totalRtv / RTV_PER_USD).toFixed(2),
        split: { creator: creatorShare, platform: platformShare, agency: agencyShare },
        combo_count: combo,
        combo_multiplier: multiplier,
        creator_earn_rtv: creatorShare + Math.floor((creatorShare * multiplier) / 100),
        payment_rail: body.rail || "telegram_stars",
        timestamp: new Date().toISOString(),
      });
    }

    // ---- Static catalogs & payment initiation (stateless) ----
    if (path === "/api/gifts" && method === "GET") {
      return json({ gifts: GIFTS, total: GIFTS.length });
    }

    if (path === "/api/subscriptions/tiers" && method === "GET") {
      return json({ tiers: TIERS, total: TIERS.length });
    }

    if (path === "/api/pay/stars" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const stars = body.stars_amount || 100;
      const rtv = Math.floor(stars * RTV_PER_STAR);
      return json({
        success: true,
        invoice: {
          title: body.title || "RTV Purchase",
          description: body.description || `${stars} Stars → ${rtv} RTV`,
          payload: `rtv_purchase_${rtv}`,
          currency: "XTR",
          prices: [{ label: `${stars} Stars`, amount: stars }],
        },
        stars_amount: stars,
        rtv_amount: rtv,
        rail: "telegram_stars",
      });
    }

    if (path === "/api/pay/ton" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const tonAmount = body.ton_amount || 1;
      const usdValue = tonAmount * 1.5;
      const rtv = Math.floor(usdValue * RTV_PER_USD);
      return json({ success: true, ton_amount: tonAmount, usd_value: usdValue, rtv_amount: rtv, rail: "ton_jetton" });
    }

    if (path === "/api/balance" && method === "GET") {
      const userId = url.searchParams.get("user_id") || "unknown";
      return json({ user_id: userId, rtv_balance: 100, pending_rtv: 0, withdrawable_rtv: 0, parity: "1 RTV = $0.01 USD" });
    }

    return json({
      service: "rtv-stream",
      version: env.RTV_VERSION || "4.1.0",
      endpoints: [
        "/health",
        "/api/stream/create",
        "/api/stream/list",
        "/api/stream/:id",
        "/api/stream/:id/end",
        "/api/tip/send",
        "/api/gifts",
        "/api/subscriptions/tiers",
        "/api/pay/stars",
        "/api/pay/ton",
        "/api/balance",
      ],
    });
  },
};
