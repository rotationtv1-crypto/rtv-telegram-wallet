/**
 * ROTATIONTVNETWORK LLC — MAIN CLOUDFLARE WORKER
 * Version: 6.4.0 — Full Production Build
 *
 * Routes:
 *   / — Health check
 *   /stream/* — Durable Object WebSocket rooms
 *   /agent/* — RTVStreamAgent (AI moderation)
 *   /api/stream/* — Stream lifecycle (init, tip, end)
 *   /api/payout/* — Creator payout workflow
 *   /api/kimi/* — Kimi AI gateway (code review, analysis, host lines)
 *   /api/venice/* — Venice AI gateway (uncensored, adult content, ZARA)
 *   /api/venice/adult — Age-gated (requires Supabase verified_age)
 *   /api/ton/* — TON wallet & trading routes
 *   /api/solana/* — Solana engine (balances, history, USDC verify, NFT gate)
 *   /api/bridge/* — Cross-chain bridge (TON↔SOL via Symbiosis)
 *   /api/admin/* — Admin dashboard (signed requests only)
 *   /api/spend/* — Cost guard dashboard
 *   /api/tribute/* — Tribute payment webhooks + API proxy
 *
 * Security:
 *   - Rate limiting (per IP + per user) via KV sliding window
 *   - Cost circuit breakers (per provider daily limits)
 *   - HMAC-SHA256 request signing for admin routes
 *   - Age verification gate for adult content
 *   - SIEM logging to Supabase + Analytics Engine
 *
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

import { StreamRoom } from "./agents/StreamRoom";
import { RTVStreamAgent } from "./agents/RTVStreamAgent";
import { orchestrateAgenticWorkflow, encodeState, decodeState } from "./lib/agentService";
import { authenticateTelegramUser, validateTelegramData } from "./lib/telegramAuth";
import { handleTributeWebhook, handleTributeGetSubscriptions, handleTributeGetOrders } from "./lib/tributeGateway";
import { handleVeniceInference } from "./lib/veniceAiRouter";
import { handleTelegramUpdate, sendTelegramMessage } from "./lib/telegramHandler";
import { initStream, endStream, getActiveStreams, recordViewer } from "./lib/streamOrchestrator";
import { CreatorPayoutWorkflow } from "./workflows/CreatorPayoutWorkflow";
import { trackEvent } from "./lib/analytics";
import { routeAgentRequest } from "agents";
import { routeKimiRequest } from "./lib/kimiGateway";
import { routeVeniceRequest } from "./lib/veniceGateway";
import { routeHeyGenRequest } from "./lib/heygenGateway";
import { routeEroticaImageRequest } from "./lib/erotikaImagePipeline";
import { routeWalletBot } from "./lib/rotationPayWalletBot";
import { routeTONRequest } from "./lib/tonRoutes";
import { routePayoutRequest } from "./lib/stripePayouts";
import { createSuperAgentBot } from "./lib/super-agent";
import { webhookCallback } from "grammy";
import { routeTelegramAdmin } from "./lib/telegramAdmin";
import { routeTONRequest as routeTonRequest } from "./lib/tonRoutes";
import { routeSolanaRequest } from "./lib/solanaEngine";
import { routeBridgeRequest } from "./lib/crossChainBridge";
import {
  createSupabaseClient,
  authenticateTelegramUser,
  getCurrentUser,
  getLiveStreams,
  createStream,
  updateStreamStatus,
} from "./lib/supabase";
import { createStripeCheckoutSession } from "./lib/stripePayouts";
import {
  CostGuard,
  RateLimiter,
  logSIEMEvent,
  verifyRequestSignature,
  guardAIRequest,
} from "./lib/costGuard";

export { StreamRoom };
export { RTVStreamAgent };
export { CreatorPayoutWorkflow };

// ─── ENVIRONMENT ──────────────────────────────────────────────────────────────

interface Env {
  // Durable Objects
  STREAM_ROOM: DurableObjectNamespace;
  RTV_STREAM_AGENT: AgentNamespace;
  // Workflow + Queue
  CREATOR_PAYOUT_WORKFLOW: Workflow;
  TIP_QUEUE: Queue;
  // Storage
  STREAM_ANALYTICS: AnalyticsEngineDataset;
  ASSETS_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  // Browser Rendering
  BROWSER_RENDERING: Fetcher;
  // KV for rate limiting + spend tracking
  KV_SPEND: KVNamespace;
  // AI Keys (secrets)
  OPENAI_API_KEY: string;
  KIMI_API_KEY: string;
  VENICE_API_KEY: string;
  VENICE_API_KEY_2: string;
  VENICE_API_KEY_3?: string;
  MASTER_CF_TOKEN: string;
  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  // Solana
  HELIUS_API_KEY?: string;
  QUICKNODE_RPC?: string;
  ALCHEMY_RPC?: string;
  RTVS_MINT_SOLANA?: string;
  PLATFORM_WALLET_SOL?: string;
  // Bridge
  SYMBIOSIS_API_KEY?: string;
  PLATFORM_WALLET_TON?: string;
  // HeyGen
  HEYGEN_API_KEY?: string;
  // Telegram
  TELEGRAM_BOT_TOKEN_MAIN?: string;
  TELEGRAM_BOT_TOKEN_EROTICA?: string;
  TELEGRAM_ADMIN_KEY?: string;
  // Chainstack
  CHAINSTACK_TON_RPC_V2?: string;
  CHAINSTACK_TON_RPC_V3?: string;
  CHAINSTACK_API_KEY?: string;
  // Venice extra keys
  VENICE_API_KEY_4?: string;
  VENICE_API_KEY_6?: string;
  VENICE_API_KEY_7?: string;
  // Security
  REQUEST_SIGNING_SECRET?: string;
  // Tribute (tribute.tg)
  TRIBUTE_API_KEY?: string;
  // Google Custom Search (Kimi-Claw)
  GOOGLE_SEARCH_API_KEY?: string;
  GOOGLE_CX_ID?: string;
  // Cloudflare Stream
  CF_STREAM_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  // Gemini AI
  GEMINI_API_KEY?: string;
  GEMINI_API_KEY_2?: string;
  // Config vars
  MODEL?: string;
  PAYOUT_ENGINE_URL: string;
  API_BASE: string;
}

// ─── TIP MESSAGE ──────────────────────────────────────────────────────────────

interface TipMessage {
  stream_id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  gift_name: string;
  gift_emoji: string;
  amount_rtv: number;
  amount_usd: number;
  combo_count: number;
  message?: string;
  is_anonymous?: boolean;
  ts: string;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Timestamp",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ─── IP EXTRACTION ────────────────────────────────────────────────────────────

function getIP(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

// ─── MAIN FETCH HANDLER ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // ── Health check ────────────────────────────────────────────────────────
    if (pathname === "/") {
      return json({
        status: "ok",
        service: "rotationtv-live-ai-clones",
        version: "6.1.0",
        account: "947b01a53876bee16fa0e8360c880aca",
        presidential_authority: "Darrel",
        ai_providers: ["openai", "kimi", "venice", "cloudflare_workers_ai"],
        endpoints: [
          "/api/stream/*",
          "/api/payout/*",
          "/api/kimi/*",
          "/api/venice/*",
          "/api/ton/*",
          "/api/solana/*",
          "/api/bridge/*",
          "/api/spend/dashboard",
          "/api/admin/*",
          "/api/tribute/*",
          "/api/chat",
          "/api/auth/telegram",
          "/api/encode-state",
          "/api/venice/inference",
          "/api/stream/orchestrate/init",
          "/api/stream/orchestrate/end",
          "/api/stream/active",
        ],
        workers_dev: "https://rotationtv-live-ai-clones.rotationtimmy.workers.dev",
        supabase: env.SUPABASE_URL ?? "not set",
      });
    }

    // ── Agents (RTVStreamAgent DO) ───────────────────────────────────────────
    if (pathname.startsWith("/agent/")) {
      const agentResp = await routeAgentRequest(request, env);
      if (agentResp) return agentResp;
    }

    // ── Stream WebSocket rooms (Durable Objects) ─────────────────────────────
    if (pathname.startsWith("/stream/")) {
      const streamId = pathname.split("/")[2];
      const roomPath = pathname.replace(`/stream/${streamId}`, "") || "/state";
      const roomId = env.STREAM_ROOM.idFromName(streamId);
      const roomStub = env.STREAM_ROOM.get(roomId);
      return roomStub.fetch(new Request(new URL(roomPath, url.origin), request));
    }

    // ── Kimi AI routes ───────────────────────────────────────────────────────
    if (pathname.startsWith("/api/kimi/")) {
      // Rate limit: 30 req / min per IP on AI endpoints
      if (env.KV_SPEND) {
        const limiter = new RateLimiter(env.KV_SPEND);
        const rl = await limiter.check(getIP(request), "kimi", 30, 60);
        if (!rl.allowed) {
          return json({ error: "Rate limit exceeded", reset_in: rl.reset_in }, 429);
        }
      }
      const kimiResp = await routeKimiRequest(request, url, env);
      if (kimiResp) return kimiResp;
    }

    // ── Venice AI routes ─────────────────────────────────────────────────────
    if (pathname.startsWith("/api/venice/")) {
      // Stricter rate limit on adult/generation endpoints
      if (env.KV_SPEND) {
        const limit = pathname.includes("/adult") || pathname.includes("/zara") ? 10 : 30;
        const limiter = new RateLimiter(env.KV_SPEND);
        const rl = await limiter.check(getIP(request), "venice", limit, 60);
        if (!rl.allowed) {
          return json({ error: "Rate limit exceeded", reset_in: rl.reset_in }, 429);
        }
      }

      // Cost guard for generation routes
      if (request.method === "POST" && env.KV_SPEND) {
        const guard = await guardAIRequest(request.clone(), env, {
          provider: "venice",
          model: "venice-uncensored-1-2",
          estimatedPromptLength: 500,
          estimatedOutputTokens: 800,
        });
        if (!guard.allowed && guard.response) return guard.response;
      }

      const veniceResp = await routeVeniceRequest(request, url, env);
      if (veniceResp) return veniceResp;
    }

    // ── TON routes ───────────────────────────────────────────────────────────
    if (pathname.startsWith("/api/ton/")) {
      const tonResp = await routeTonRequest(request, url, env as any);
      if (tonResp) return tonResp;
    }

    // ── Solana routes ────────────────────────────────────────────────────────
    if (pathname.startsWith("/api/solana/")) {
      if (env.KV_SPEND) {
        const limiter = new RateLimiter(env.KV_SPEND);
        const rl = await limiter.check(getIP(request), "solana", 60, 60);
        if (!rl.allowed) return json({ error: "Rate limit exceeded", reset_in: rl.reset_in }, 429);
      }
      const solResp = await routeSolanaRequest(request, url, env);
      if (solResp) return solResp;
    }

    // ── Cross-chain bridge routes ────────────────────────────────────────────
    if (pathname.startsWith("/api/bridge/")) {
      if (env.KV_SPEND) {
        const limiter = new RateLimiter(env.KV_SPEND);
        const rl = await limiter.check(getIP(request), "bridge", 30, 60);
        if (!rl.allowed) return json({ error: "Rate limit exceeded", reset_in: rl.reset_in }, 429);
      }
      const bridgeResp = await routeBridgeRequest(request, url, env);
      if (bridgeResp) return bridgeResp;
    }

    // ── HeyGen AI Avatar routes ──────────────────────────────────────────────
    if (pathname.startsWith("/api/heygen/")) {
      const heygenResp = await routeHeyGenRequest(request, url, env as any);
      if (heygenResp) return heygenResp;
    }

    // ── @RotationPayWallet_bot webhook ───────────────────────────────────────
    if (pathname === "/telegram/webhook" || pathname === "/telegram/wallet/webhook") {
      if (!env.TELEGRAM_BOT_TOKEN_MAIN && !env.TELEGRAM_BOT_TOKEN) {
        // Token not yet set — ack Telegram so it doesn't disable webhook
        return json({ ok: true, status: "pending_token" });
      }
      const botResp = await routeWalletBot(request, env as any);
      if (botResp) return botResp;
    }

    // ── Stripe Connect + PayPal Multiparty + Credits ─────────────────────
    if (pathname.startsWith("/api/payout") || pathname.startsWith("/api/stripe") || pathname.startsWith("/api/credits")) {
      const payoutResp = await routePayoutRequest(request, url, env as any);
      if (payoutResp) return payoutResp;
    }

    // ── @ROTATIONEROTICA_BOT webhook (Super Agent — 18+ platform) ─────────
    if (pathname === "/telegram/erotica/webhook") {
      if (!env.TELEGRAM_BOT_TOKEN_EROTICA) {
        return json({ ok: true, status: "pending_token" });
      }
      const eroticaBot = createSuperAgentBot(env as any, env.TELEGRAM_BOT_TOKEN_EROTICA);
      const handleUpdate = webhookCallback(eroticaBot, "cloudflare-mod");
      return handleUpdate(request);
    }

    // ── Telegram bot admin (menu buttons, webhooks, identity) ─────────────
    if (pathname.startsWith("/api/admin/telegram/")) {
      const tgAdminResp = await routeTelegramAdmin(request, url, env as any);
      if (tgAdminResp) return tgAdminResp;
    }

    // ── RotationErotica Image Pipeline ───────────────────────────────────────
    if (pathname.startsWith("/api/erotica/")) {
      // Age gate enforced inside routeEroticaImageRequest
      const eroticaResp = await routeEroticaImageRequest(request, url, env as any);
      if (eroticaResp) return eroticaResp;
    }

    // ── Tribute (tribute.tg) webhook + API proxy ─────────────────────────────
    if (pathname === "/api/tribute/webhook") {
      const tributeEnv = {
        TRIBUTE_API_KEY: env.TRIBUTE_API_KEY || "",
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || "",
      };
      return handleTributeWebhook(request, tributeEnv);
    }
    if (pathname === "/api/tribute/subscriptions") {
      const tributeEnv = {
        TRIBUTE_API_KEY: env.TRIBUTE_API_KEY || "",
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || "",
      };
      return handleTributeGetSubscriptions(tributeEnv);
    }
    if (pathname === "/api/tribute/orders") {
      const tributeEnv = {
        TRIBUTE_API_KEY: env.TRIBUTE_API_KEY || "",
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || "",
      };
      return handleTributeGetOrders(tributeEnv, url);
    }


    // ── Kimi-Claw Agentic Chat (Gemini + Google Search) ─────────────────────
    if (pathname === "/api/chat" && request.method === "POST") {
      const authorization = request.headers.get("Authorization");
      if (!authorization) return json({ error: "Unauthorized payload source" }, 401);

      const valid = await validateTelegramData(authorization, env.TELEGRAM_BOT_TOKEN_MAIN || env.TELEGRAM_BOT_TOKEN || "");
      if (!valid) return json({ error: "Invalid Telegram initData" }, 401);

      const body = await request.json<{ prompt: string; encodedState?: string }>();
      if (!body.prompt) return json({ error: "Missing prompt" }, 400);

      try {
        const result = await orchestrateAgenticWorkflow(body.prompt, body.encodedState, {
          GEMINI_API_KEY: env.GEMINI_API_KEY || "",
          GEMINI_API_KEY_2: env.GEMINI_API_KEY_2 || "",
          GOOGLE_SEARCH_API_KEY: env.GOOGLE_SEARCH_API_KEY || "",
          GOOGLE_CX_ID: env.GOOGLE_CX_ID || "",
          TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN_MAIN || "",
        });
        return json(result);
      } catch (err: any) {
        return json({ error: err.message }, 500);
      }
    }

    // ── State encoding endpoint (for deep link generation) ──────────────────
    if (pathname === "/api/encode-state" && request.method === "POST") {
      const body = await request.json();
      const encoded = encodeState(body);
      return json({ encoded, deep_link: `t.me/${"base44_229784_bot"}?startapp=${encoded}` });
    }

    // ── Telegram user authentication ────────────────────────────────────────
    if (pathname === "/api/auth/telegram" && request.method === "POST") {
      const body = await request.json<{ initData: string }>();
      const auth = await authenticateTelegramUser(body.initData, env.TELEGRAM_BOT_TOKEN_MAIN || "");
      if (!auth) return json({ error: "Invalid initData" }, 401);
      return json({ user: auth.user, authenticated: true });
    }
    // ── Stream lifecycle ─────────────────────────────────────────────────────

    // ── Venice AI direct inference (multi-key router) ──────────────────────
    if (pathname === "/api/venice/inference" && request.method === "POST") {
      const body = await request.json<{ prompt: string; model?: string }>();
      if (!body.prompt) return json({ error: "Missing prompt" }, 400);
      try {
        const result = await handleVeniceInference(body.prompt, {
          VENICE_API_KEY: env.VENICE_API_KEY || "",
          VENICE_API_KEY_2: env.VENICE_API_KEY_2 || "",
          VENICE_API_KEY_3: env.VENICE_API_KEY_3 || "",
        }, body.model || "venice-uncensored-1-2");
        return json(result);
      } catch (err: any) {
        return json({ error: err.message }, 500);
      }
    }

    // ── Stream orchestrator (WHIP/WHEP provisioning) ────────────────────────
    if (pathname === "/api/stream/orchestrate/init" && request.method === "POST") {
      const body = await request.json<{ host_id: string; title: string }>();
      const result = await initStream(body.host_id, body.title, {
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || "",
        CF_STREAM_API_TOKEN: env.CF_STREAM_API_TOKEN || "",
        CF_ACCOUNT_ID: env.CF_ACCOUNT_ID || "",
      });
      return json(result);
    }
    if (pathname === "/api/stream/orchestrate/end" && request.method === "POST") {
      const body = await request.json<{ stream_id: string }>();
      const result = await endStream(body.stream_id, {
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || "",
        CF_STREAM_API_TOKEN: env.CF_STREAM_API_TOKEN || "",
        CF_ACCOUNT_ID: env.CF_ACCOUNT_ID || "",
      });
      return json(result);
    }
    if (pathname === "/api/stream/active" && request.method === "GET") {
      const streams = await getActiveStreams({
        SUPABASE_URL: env.SUPABASE_URL || "",
        SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || "",
        CF_STREAM_API_TOKEN: env.CF_STREAM_API_TOKEN || "",
        CF_ACCOUNT_ID: env.CF_ACCOUNT_ID || "",
      });
      return json({ streams });
    }

    // POST /api/stream/init
    if (pathname === "/api/stream/init" && request.method === "POST") {
      const body = await request.json<any>();
      const streamId = body.stream_id || crypto.randomUUID();
      const roomId = env.STREAM_ROOM.idFromName(streamId);
      const roomStub = env.STREAM_ROOM.get(roomId);
      const roomResp = await roomStub.fetch(
        new Request(new URL("/init", url.origin), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      const data = await roomResp.json();
      trackEvent(env.STREAM_ANALYTICS, {
        event_type: "creator_join",
        user_id: body.creator_id,
        stream_id: streamId,
        creator_id: body.creator_id,
        ts: Date.now(),
      });
      await logSIEMEvent({ level: "info", event: "stream_init", actor: body.creator_id, resource: streamId }, env);
      return json(data);
    }

    // POST /api/stream/tip
    if (pathname === "/api/stream/tip" && request.method === "POST") {
      const body = await request.json<TipMessage>();
      body.ts = new Date().toISOString();

      // Rate limit tips: 20/min per sender
      if (env.KV_SPEND) {
        const limiter = new RateLimiter(env.KV_SPEND);
        const rl = await limiter.check(body.sender_id, "tip", 20, 60);
        if (!rl.allowed) return json({ error: "Tip rate limit exceeded" }, 429);
      }

      await env.TIP_QUEUE.send(body);
      const roomId = env.STREAM_ROOM.idFromName(body.stream_id);
      const roomStub = env.STREAM_ROOM.get(roomId);
      await roomStub.fetch(
        new Request(new URL("/tip", url.origin), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount_rtv: body.amount_rtv,
            user_id: body.sender_id,
            username: body.sender_id,
            gift_emoji: body.gift_emoji,
          }),
        })
      );
      trackEvent(env.STREAM_ANALYTICS, {
        event_type: "tip_sent",
        user_id: body.sender_id,
        stream_id: body.stream_id,
        creator_id: body.receiver_id,
        amount_rtv: body.amount_rtv,
        amount_usd: body.amount_usd,
        gift_id: body.gift_id,
        ts: Date.now(),
      });
      return json({ success: true, queued: true });
    }

    // POST /api/stream/end
    if (pathname === "/api/stream/end" && request.method === "POST") {
      const body = await request.json<any>();
      const roomId = env.STREAM_ROOM.idFromName(body.stream_id);
      const roomStub = env.STREAM_ROOM.get(roomId);
      const data = await (
        await roomStub.fetch(
          new Request(new URL("/end", url.origin), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        )
      ).json();
      await logSIEMEvent({ level: "info", event: "stream_end", actor: body.creator_id, resource: body.stream_id }, env);
      return json(data);
    }

    // ── GET /api/payment/create — Stripe Checkout redirect (RTV top-up) ────
    if (pathname === "/api/payment/create" && request.method === "GET") {
      const amount = parseFloat(url.searchParams.get("amount") || "0");
      const userId = url.searchParams.get("user_id") || "";
      if (!amount || amount <= 0 || !userId) return json({ error: "amount and user_id required" }, 400);
      if (!env.STRIPE_SECRET_KEY) {
        return json({ error: "Payments not configured yet — Stripe key missing" }, 503);
      }
      try {
        const session = await createStripeCheckoutSession(
          `RTV Top-up ($${amount})`,
          amount,
          `${url.origin}/?payment=success`,
          `${url.origin}/?payment=cancelled`,
          env.STRIPE_SECRET_KEY,
          { user_id: userId, type: "rtv_topup", amount_usd: String(amount) }
        );
        return Response.redirect(session.checkout_url, 302);
      } catch (e: any) {
        return json({ error: e.message || "Checkout session failed" }, 500);
      }
    }

    // ── POST /api/auth — Telegram Mini App authentication ──────────────────
    if (pathname === "/api/auth" && request.method === "POST") {
      try {
        const { telegram_id, username, first_name, last_name, photo_url } = await request.json<any>();
        if (!telegram_id) return json({ error: "telegram_id required" }, 400);
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
        const db = createSupabaseClient(env as any);
        const displayName = [first_name, last_name].filter(Boolean).join(" ") || username || `User${telegram_id}`;
        const existingBefore = await getCurrentUser(db, telegram_id);
        const user = await authenticateTelegramUser(db, telegram_id, username ?? "", displayName, photo_url);
        return json({ user, welcome_bonus: !existingBefore });
      } catch (e: any) {
        return json({ error: e.message || "Auth failed" }, 500);
      }
    }

    // ── GET /api/gifts — gift catalog (from migration 002 seed data) ───────
    if (pathname === "/api/gifts" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
      const db = createSupabaseClient(env as any);
      const gifts = await db.select<any>("gifts", "order=sort_order.asc&select=*");
      return json({ gifts });
    }

    // ── GET /api/leaderboards — top creators by earnings ────────────────────
    if (pathname === "/api/leaderboards" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
      const db = createSupabaseClient(env as any);
      const entries = await db.select<any>("users", "order=total_earnings.desc&limit=50&select=id,username,display_name,avatar_url,total_earnings,total_followers,reputation_tier");
      return json({ entries });
    }

    // ── POST /api/become-creator — upgrade viewer → creator role ───────────
    if (pathname === "/api/become-creator" && request.method === "POST") {
      try {
        const { user_id } = await request.json<any>();
        if (!user_id) return json({ error: "user_id required" }, 400);
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
        const db = createSupabaseClient(env as any);
        const ok = await db.update("users", `id=eq.${user_id}`, { is_creator: true, role: "creator", updated_at: new Date().toISOString() });
        return json({ success: ok });
      } catch (e: any) {
        return json({ error: e.message || "Failed to become creator" }, 500);
      }
    }

    // ── GET /api/pk/active — active PK (creator battle) sessions ────────────
    if (pathname === "/api/pk/active" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
      const db = createSupabaseClient(env as any);
      const battles = await db.select<any>("pk_battles", "status=eq.active&order=created_at.desc&limit=20&select=*");
      return json({ battles });
    }

    // ── POST /api/stream/create-input — create Cloudflare Stream live input ─
    if (pathname === "/api/stream/create-input" && request.method === "POST") {
      try {
        const { creator_id, title, category } = await request.json<any>();
        if (!creator_id) return json({ error: "creator_id required" }, 400);
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
        const db = createSupabaseClient(env as any);
        const streamKey = crypto.randomUUID();
        const stream = await createStream(db, creator_id, { title, category, stream_key: streamKey });
        return json({ stream, stream_key: streamKey, rtmp_url: "rtmps://live.cloudflare.com:443/live", playback_id: streamKey });
      } catch (e: any) {
        return json({ error: e.message || "Failed to create stream input" }, 500);
      }
    }

    // ── POST /api/streams/start — mark stream as live ───────────────────────
    if (pathname === "/api/streams/start" && request.method === "POST") {
      try {
        const { creator_id, title, category } = await request.json<any>();
        if (!creator_id) return json({ error: "creator_id required" }, 400);
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);
        const db = createSupabaseClient(env as any);
        const streamKey = crypto.randomUUID();
        const stream = await createStream(db, creator_id, { title, category, stream_key: streamKey });
        if (stream) await updateStreamStatus(db, stream.stream_key, "live");
        return json({ success: true, stream_id: stream?.id, stream_key: streamKey });
      } catch (e: any) {
        return json({ error: e.message || "Failed to start stream" }, 500);
      }
    }

    // GET /api/streams/live
    if (pathname === "/api/streams/live" && request.method === "GET") {
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        const db = createSupabaseClient(env as any);
        const streams = await getLiveStreams(db, 50);
        return json({ streams });
      }
      return json({ streams: [], message: "Supabase not configured" });
    }

    // ── Payout routes ────────────────────────────────────────────────────────

    // POST /api/payout/trigger
    if (pathname === "/api/payout/trigger" && request.method === "POST") {
      const { creator_id, period, stream_ids } = await request.json<any>();
      const instance = await env.CREATOR_PAYOUT_WORKFLOW.create({
        id: crypto.randomUUID(),
        params: { creator_id, period, stream_ids },
      });
      return json({ id: instance.id, status: await instance.status() });
    }

    // GET /api/payout/status
    if (pathname === "/api/payout/status" && request.method === "GET") {
      const instanceId = url.searchParams.get("instanceId");
      if (!instanceId) return json({ error: "Missing instanceId" }, 400);
      const instance = await env.CREATOR_PAYOUT_WORKFLOW.get(instanceId);
      return json({ status: await instance.status() });
    }

    // ── Spend / Cost Dashboard ────────────────────────────────────────────────

    // GET /api/spend/dashboard
    if (pathname === "/api/spend/dashboard" && request.method === "GET") {
      // Require signed request for dashboard
      if (env.REQUEST_SIGNING_SECRET) {
        const sig = request.headers.get("X-Signature") ?? "";
        const ts  = request.headers.get("X-Timestamp") ?? "";
        const valid = await verifyRequestSignature(`${ts}:dashboard`, sig, env.REQUEST_SIGNING_SECRET);
        if (!valid) return json({ error: "Invalid signature" }, 401);
      }
      if (!env.KV_SPEND) return json({ error: "KV_SPEND not bound" }, 503);
      const guard = new CostGuard(env);
      const dashboard = await guard.getDashboard();
      return json(dashboard);
    }

    // ── Admin routes (HMAC-signed only) ───────────────────────────────────────

    if (pathname.startsWith("/api/admin/")) {
      const sig = request.headers.get("X-Signature") ?? "";
      const ts  = request.headers.get("X-Timestamp") ?? "";

      if (!env.REQUEST_SIGNING_SECRET) {
        return json({ error: "Admin endpoints require REQUEST_SIGNING_SECRET" }, 503);
      }

      // Timestamp must be within 5 minutes
      const tsNum = parseInt(ts, 10);
      if (isNaN(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) {
        return json({ error: "Request timestamp expired" }, 401);
      }

      const body = request.method !== "GET" ? await request.text() : "";
      const valid = await verifyRequestSignature(`${ts}:${pathname}:${body}`, sig, env.REQUEST_SIGNING_SECRET);
      if (!valid) {
        await logSIEMEvent({
          level: "critical",
          event: "invalid_admin_signature",
          actor: getIP(request),
          resource: pathname,
        }, env);
        return json({ error: "Unauthorized — invalid signature" }, 401);
      }

      // GET /api/admin/secrets — list worker secrets (names only)
      if (pathname === "/api/admin/secrets" && request.method === "GET") {
        return json({
          worker: "rotationtv-live-ai-clones",
          secrets: ["KIMI_API_KEY", "VENICE_API_KEY", "VENICE_API_KEY_2", "VENICE_API_KEY_3", "MASTER_CF_TOKEN"],
          note: "Values are never returned — names only",
        });
      }

      // GET /api/admin/status — full ecosystem health
      if (pathname === "/api/admin/status" && request.method === "GET") {
        const checks = await Promise.allSettled([
          env.SUPABASE_URL ? fetch(`${env.SUPABASE_URL}/rest/v1/`, {
            headers: { apikey: env.SUPABASE_SERVICE_KEY ?? "" },
          }).then(r => ({ service: "supabase", ok: r.ok })) : Promise.resolve({ service: "supabase", ok: false }),
        ]);

        const guard = env.KV_SPEND ? new CostGuard(env) : null;
        const spend = guard ? await guard.getDashboard() : null;

        return json({
          worker: "ok",
          supabase: checks[0].status === "fulfilled" ? (checks[0].value as any).ok : false,
          kv: !!env.KV_SPEND,
          r2: !!env.ASSETS_BUCKET,
          spend,
          timestamp: new Date().toISOString(),
        });
      }

      return json({ error: "Admin route not found" }, 404);
    }

    // ── Static assets (SPA fallback) ─────────────────────────────────────────
    return env.ASSETS.fetch(request);
  },

  // ─── QUEUE CONSUMER (Tip Processing) ────────────────────────────────────────
  async queue(batch: MessageBatch<TipMessage>, env: Env): Promise<void> {
    const tips = batch.messages.map(msg => msg.body);

    try {
      for (const tip of tips) {
        // Record cost (queue processing is free, but log for audit)
        await logSIEMEvent({
          level: "info",
          event: "tip_processed",
          actor: tip.sender_id,
          resource: tip.stream_id,
          data: { amount_rtv: tip.amount_rtv, amount_usd: tip.amount_usd, gift: tip.gift_name },
        }, env);

        // Forward to payout engine
        const response = await fetch(env.PAYOUT_ENGINE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process_tip", payload: tip }),
        });

        if (!response.ok) throw new Error(`Payout engine: ${response.status}`);
      }

      for (const msg of batch.messages) msg.ack();
      console.log(`✅ Processed ${tips.length} tip(s)`);
    } catch (err) {
      console.error("❌ Tip batch failed:", err);
      for (const msg of batch.messages) msg.retry({ delaySeconds: 60 });
    }
  },
};
