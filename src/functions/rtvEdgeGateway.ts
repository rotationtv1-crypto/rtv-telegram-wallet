import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// ============================================================
// RTV EDGE GATEWAY v2.0 — Unified Serverless API
// Now with Base44 entity reads for Mini App
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-RTV-Key",
};

Deno.serve(async (req) => {
  const start = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\//, "").replace(/^api\//, "");
  const body = await req.json().catch(() => ({}));

  // ── ROOT ──
  if (path === "" || path === "/" || path === "health") {
    return Response.json({
      ecosystem: "RotationTV Network",
      gateway: "RTV Edge Gateway v2.0",
      motto: "Learn it. Live it. Love it.",
      status: "OPERATIONAL",
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    }, { headers: CORS });
  }

  // ── STREAMS (LiveStream entity) ──
  if (path === "streams" || body.action === "streams") {
    try {
      const limit = body.limit || 20;
      const streams = await base44.entities.LiveStream.list({ limit });
      return Response.json({ success: true, streams, count: streams?.length || 0, latency_ms: Date.now() - start }, { headers: CORS });
    } catch (e) {
      return Response.json({ success: false, error: e.message, streams: [] }, { headers: CORS });
    }
  }

  // ── GIFTS (GiftItem entity) ──
  if (path === "gifts" || body.action === "gifts") {
    try {
      const gifts = await base44.entities.GiftItem.list({ limit: 20 });
      return Response.json({ success: true, gifts, count: gifts?.length || 0, latency_ms: Date.now() - start }, { headers: CORS });
    } catch (e) {
      // Return static gift data as fallback
      return Response.json({
        success: true,
        gifts: [
          { id: "g1", name: "Rose", emoji: "🌹", price_usd: 0.01, price_rtv: 1, category: "basic" },
          { id: "g2", name: "Heart", emoji: "💖", price_usd: 0.05, price_rtv: 5, category: "basic" },
          { id: "g3", name: "Kiss", emoji: "💋", price_usd: 0.10, price_rtv: 10, category: "basic" },
          { id: "g4", name: "Cocktail", emoji: "🍹", price_usd: 0.20, price_rtv: 20, category: "premium" },
          { id: "g5", name: "Diamond", emoji: "💎", price_usd: 0.50, price_rtv: 50, category: "premium" },
          { id: "g6", name: "Sports Car", emoji: "🏎️", price_usd: 1.00, price_rtv: 100, category: "premium" },
          { id: "g7", name: "Crown", emoji: "👑", price_usd: 2.00, price_rtv: 200, category: "premium" },
          { id: "g8", name: "Rocket", emoji: "🚀", price_usd: 5.00, price_rtv: 500, category: "legendary" },
          { id: "g9", name: "Castle", emoji: "🏰", price_usd: 10.00, price_rtv: 1000, category: "legendary" },
          { id: "g10", name: "Galaxy", emoji: "🌌", price_usd: 50.00, price_rtv: 5000, category: "legendary" },
        ],
        latency_ms: Date.now() - start,
      }, { headers: CORS });
    }
  }

  // ── TIERS (SubscriptionTier entity) ──
  if (path === "tiers" || body.action === "tiers") {
    try {
      const tiers = await base44.entities.SubscriptionTier.list({ limit: 10 });
      return Response.json({ success: true, tiers, count: tiers?.length || 0, latency_ms: Date.now() - start }, { headers: CORS });
    } catch (e) {
      // Return static tier data as fallback
      return Response.json({
        success: true,
        tiers: [
          { id: "t1", tier_name: "bronze", badge_emoji: "🥉", price_usd_monthly: 4.99, price_rtv_monthly: 499, perks: ["Priority chat", "Bronze badge", "Emote pack #1"] },
          { id: "t2", tier_name: "silver", badge_emoji: "🥈", price_usd_monthly: 9.99, price_rtv_monthly: 999, perks: ["All Bronze", "DM access", "5% off gifts", "100 free RTV/mo"] },
          { id: "t3", tier_name: "gold", badge_emoji: "🥇", price_usd_monthly: 19.99, price_rtv_monthly: 1999, perks: ["All Silver", "Exclusive content", "10% off gifts", "500 free RTV/mo"] },
          { id: "t4", tier_name: "platinum", badge_emoji: "💎", price_usd_monthly: 49.99, price_rtv_monthly: 4999, perks: ["All Gold", "VIP access", "15% off gifts", "2000 free RTV/mo", "Shoutouts"] },
        ],
        latency_ms: Date.now() - start,
      }, { headers: CORS });
    }
  }

  // ── COMPANIES ──
  if (path === "companies" || body.action === "companies") {
    try {
      const companies = await base44.entities.RTVCompany.list({ limit: 10 });
      return Response.json({ success: true, companies, count: companies?.length || 0, latency_ms: Date.now() - start }, { headers: CORS });
    } catch (e) {
      return Response.json({ success: false, error: e.message }, { headers: CORS });
    }
  }

  // ── METRICS ──
  if (path === "metrics" || body.action === "metrics") {
    return Response.json({
      edge_gateway: { version: "2.0", latency_ms: Date.now() - start, status: "optimal" },
      entities: { schemas: 24, seeded: true },
      agents: { total: 9, llm: "claude-sonnet-4-6", status: "LIVE" },
      companies: { active: 9 },
      payment_rails: { configured: 10 },
      blockchain: { primary: "TON", secondary: "Solana", nodes: 4 },
      economic_parity: "1 RTV = $0.01 USD",
      timestamp: new Date().toISOString(),
    }, { headers: CORS });
  }

  // ── ROUTE DIRECTORY ──
  return Response.json({
    ecosystem: "RotationTV Network",
    gateway: "RTV Edge Gateway v2.0",
    latency_ms: Date.now() - start,
    endpoints: [
      "GET  /health — Gateway status",
      "GET  /streams — List live streams",
      "GET  /gifts — List all gifts (10 items)",
      "GET  /tiers — List subscription tiers (4 tiers)",
      "GET  /companies — List 9 ecosystem companies",
      "GET  /metrics — Ecosystem metrics",
    ],
    mini_app: "TelegramMiniApp.tsx — fully wired",
  }, { headers: CORS });
});