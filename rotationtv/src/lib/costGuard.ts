/**
 * ROTATIONTVNETWORK LLC — COST GUARD + CIRCUIT BREAKER
 *
 * Hard spending limits and circuit breakers for all AI API calls.
 * Uses Cloudflare KV for persistent daily spend tracking across all Worker instances.
 *
 * Protects: Venice AI · Kimi AI · OpenAI · Cloudflare Workers AI
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

// ─── SPEND LIMITS ─────────────────────────────────────────────────────────────

export const DAILY_LIMITS_USD = {
  venice:    50.00,   // Venice AI (adult content, ZARA, moderation)
  kimi:      25.00,   // Kimi AI (code review, analysis)
  openai:    100.00,  // OpenAI GPT-4o (super agent, TTS, vision)
  workers_ai: 20.00, // Cloudflare Workers AI (llama-guard, deepgram TTS)
  total:     175.00,  // Hard total across all providers
} as const;

// Per-tier creator daily limits (RTV tokens they can spend)
export const CREATOR_TIER_LIMITS_RTV = {
  basic:      1_000,   // 1,000 RTV = $10/day
  premium:    5_000,   // 5,000 RTV = $50/day
  agency:    20_000,   // 20,000 RTV = $200/day
  vip:       50_000,   // 50,000 RTV = $500/day
  unlimited: 999_999,
} as const;

// ─── TOKEN COST ESTIMATES (per 1M tokens, USD) ───────────────────────────────

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Venice
  "venice-uncensored-1-2":             { input: 0.50,  output: 0.90 },
  "venice-uncensored-role-play":       { input: 1.00,  output: 2.00 },
  "gemma-4-uncensored":                { input: 0.25,  output: 0.50 },
  "qwen3-5-9b":                        { input: 0.08,  output: 0.15 },
  "e2ee-venice-uncensored-24b-p":      { input: 0.60,  output: 1.15 },
  "e2ee-gemma-4-26b-a4b-uncensored-p": { input: 0.45,  output: 0.88 },
  // Kimi / Moonshot
  "kimi-k2.7-code":    { input: 0.50,  output: 2.50 },
  "kimi-k2.5":         { input: 0.50,  output: 2.50 },
  "moonshot-v1-128k":  { input: 0.50,  output: 1.50 },
  // OpenAI
  "gpt-4o":            { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":       { input: 0.15,  output: 0.60 },
  "tts-1":             { input: 0,     output: 15.00 },  // per 1M chars
  // Cloudflare Workers AI (approximate)
  "@cf/meta/llama-guard-3-8b": { input: 0.10, output: 0.10 },
};

// ─── KV KEYS ─────────────────────────────────────────────────────────────────

function todayKey(provider: string): string {
  return `spend:${provider}:${new Date().toISOString().slice(0, 10)}`;
}
function creatorKey(creatorId: string): string {
  return `creator_spend:${creatorId}:${new Date().toISOString().slice(0, 10)}`;
}

// ─── COST ESTIMATOR ──────────────────────────────────────────────────────────

/** Rough token count (4 chars ≈ 1 token) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Estimate USD cost for a request */
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model];
  if (!costs) return 0.001; // conservative fallback
  return (
    (inputTokens  / 1_000_000) * costs.input +
    (outputTokens / 1_000_000) * costs.output
  );
}

// ─── CIRCUIT BREAKER ENV ─────────────────────────────────────────────────────

export interface CostGuardEnv {
  KV_SPEND: KVNamespace;
}

// ─── CIRCUIT BREAKER CLASS ────────────────────────────────────────────────────

export class CostGuard {
  private kv: KVNamespace;

  constructor(env: CostGuardEnv) {
    this.kv = env.KV_SPEND;
  }

  /** Get today's spend for a provider (USD) */
  async getDailySpend(provider: keyof typeof DAILY_LIMITS_USD): Promise<number> {
    const val = await this.kv.get(todayKey(provider));
    return parseFloat(val ?? "0");
  }

  /** Get today's total spend across all providers */
  async getTotalSpend(): Promise<number> {
    const providers: Array<keyof typeof DAILY_LIMITS_USD> = ["venice", "kimi", "openai", "workers_ai"];
    const spends = await Promise.all(providers.map(p => this.getDailySpend(p)));
    return spends.reduce((a, b) => a + b, 0);
  }

  /**
   * Pre-flight check before an AI call.
   * Returns { allowed: true } or { allowed: false, reason: string }
   */
  async preflightCheck(
    provider: keyof typeof DAILY_LIMITS_USD,
    model: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): Promise<{ allowed: boolean; reason?: string; estimated_cost: number }> {
    const estimated = estimateCost(model, estimatedInputTokens, estimatedOutputTokens);

    const [providerSpend, totalSpend] = await Promise.all([
      this.getDailySpend(provider),
      this.getTotalSpend(),
    ]);

    const providerLimit = DAILY_LIMITS_USD[provider];
    const totalLimit = DAILY_LIMITS_USD.total;

    if (providerSpend + estimated > providerLimit) {
      return {
        allowed: false,
        reason: `Daily ${provider} limit of $${providerLimit} reached ($${providerSpend.toFixed(2)} used)`,
        estimated_cost: estimated,
      };
    }

    if (totalSpend + estimated > totalLimit) {
      return {
        allowed: false,
        reason: `Daily total AI spend limit of $${totalLimit} reached ($${totalSpend.toFixed(2)} used)`,
        estimated_cost: estimated,
      };
    }

    return { allowed: true, estimated_cost: estimated };
  }

  /**
   * Record actual cost after a successful AI call.
   */
  async recordSpend(
    provider: keyof typeof DAILY_LIMITS_USD,
    actualCostUsd: number
  ): Promise<void> {
    const key = todayKey(provider);
    const current = parseFloat((await this.kv.get(key)) ?? "0");
    const newVal = (current + actualCostUsd).toFixed(6);
    // TTL: 48 hours (auto-cleans after the day rolls over)
    await this.kv.put(key, newVal, { expirationTtl: 48 * 3600 });
  }

  /**
   * Get full spend dashboard (all providers, today).
   */
  async getDashboard(): Promise<{
    date: string;
    providers: Record<string, { spent: number; limit: number; remaining: number; pct: number }>;
    total: { spent: number; limit: number; remaining: number; pct: number };
    status: "healthy" | "warning" | "critical";
  }> {
    const providers: Array<keyof typeof DAILY_LIMITS_USD> = ["venice", "kimi", "openai", "workers_ai"];
    const spends = await Promise.all(providers.map(p => this.getDailySpend(p)));

    const result: Record<string, { spent: number; limit: number; remaining: number; pct: number }> = {};
    let totalSpent = 0;

    providers.forEach((p, i) => {
      const spent = spends[i];
      const limit = DAILY_LIMITS_USD[p];
      const remaining = Math.max(0, limit - spent);
      const pct = Math.round((spent / limit) * 100);
      result[p] = { spent: parseFloat(spent.toFixed(4)), limit, remaining: parseFloat(remaining.toFixed(4)), pct };
      totalSpent += spent;
    });

    const totalLimit = DAILY_LIMITS_USD.total;
    const totalPct = Math.round((totalSpent / totalLimit) * 100);

    return {
      date: new Date().toISOString().slice(0, 10),
      providers: result,
      total: {
        spent: parseFloat(totalSpent.toFixed(4)),
        limit: totalLimit,
        remaining: parseFloat(Math.max(0, totalLimit - totalSpent).toFixed(4)),
        pct: totalPct,
      },
      status: totalPct >= 90 ? "critical" : totalPct >= 70 ? "warning" : "healthy",
    };
  }

  // ── Per-creator spend tracking ─────────────────────────────────────────────

  async getCreatorSpend(creatorId: string): Promise<number> {
    const val = await this.kv.get(creatorKey(creatorId));
    return parseFloat(val ?? "0");
  }

  async checkCreatorLimit(
    creatorId: string,
    tier: keyof typeof CREATOR_TIER_LIMITS_RTV,
    amountRtv: number
  ): Promise<{ allowed: boolean; used: number; limit: number; reason?: string }> {
    const used = await this.getCreatorSpend(creatorId);
    const limit = CREATOR_TIER_LIMITS_RTV[tier];
    if (used + amountRtv > limit) {
      return { allowed: false, used, limit, reason: `Daily ${tier} limit of ${limit} RTV reached` };
    }
    return { allowed: true, used, limit };
  }

  async recordCreatorSpend(creatorId: string, amountRtv: number): Promise<void> {
    const key = creatorKey(creatorId);
    const current = parseFloat((await this.kv.get(key)) ?? "0");
    await this.kv.put(key, (current + amountRtv).toFixed(0), { expirationTtl: 48 * 3600 });
  }
}

// ─── RATE LIMITER (per IP / user) ────────────────────────────────────────────

export class RateLimiter {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Sliding window rate limiter.
   * @returns { allowed: boolean, remaining: number, reset_in: number }
   */
  async check(
    identifier: string,   // IP or telegram_id
    endpoint: string,
    limit: number,        // max requests
    windowSecs: number    // window in seconds
  ): Promise<{ allowed: boolean; remaining: number; reset_in: number }> {
    const key = `rl:${endpoint}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSecs;

    // Get existing timestamps
    const raw = await this.kv.get(key);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Keep only timestamps within window
    const recent = timestamps.filter(t => t > windowStart);

    if (recent.length >= limit) {
      const oldest = Math.min(...recent);
      const reset_in = oldest + windowSecs - now;
      return { allowed: false, remaining: 0, reset_in };
    }

    // Add current timestamp
    recent.push(now);
    await this.kv.put(key, JSON.stringify(recent), { expirationTtl: windowSecs * 2 });

    return { allowed: true, remaining: limit - recent.length, reset_in: windowSecs };
  }
}

// ─── REQUEST SIGNER ──────────────────────────────────────────────────────────

/**
 * HMAC-SHA256 request signing for Worker ↔ Origin communication.
 * Sign outbound requests, verify inbound ones.
 */
export async function signRequest(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyRequestSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await signRequest(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── SIEM LOGGER ─────────────────────────────────────────────────────────────

export interface SIEMEvent {
  ts: string;
  level: "info" | "warn" | "error" | "critical";
  event: string;
  actor?: string;        // telegram_id or IP
  resource?: string;     // endpoint, model, stream_id
  data?: Record<string, any>;
  account: "rotationtv";
}

/**
 * Log security + spend events to external SIEM.
 * Configured for Supabase (primary) with Cloudflare Analytics as backup.
 */
export async function logSIEMEvent(
  event: Omit<SIEMEvent, "ts" | "account">,
  env: {
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_KEY?: string;
    STREAM_ANALYTICS?: AnalyticsEngineDataset;
  }
): Promise<void> {
  const payload: SIEMEvent = {
    ...event,
    ts: new Date().toISOString(),
    account: "rotationtv",
  };

  // Primary: Supabase moderation_log table
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    fetch(`${env.SUPABASE_URL}/rest/v1/moderation_log`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        content: event.event,
        action: event.level === "critical" || event.level === "error" ? "ban" : event.level === "warn" ? "warn" : "allow",
        category: event.data?.category ?? "none",
        severity: { info: 0, warn: 3, error: 7, critical: 10 }[event.level],
        reason: JSON.stringify(event.data ?? {}),
        ai_model: event.resource ?? "system",
        created_at: payload.ts,
      }),
    }).catch(() => { /* silent */ });
  }

  // Backup: Cloudflare Analytics Engine
  if (env.STREAM_ANALYTICS) {
    try {
      env.STREAM_ANALYTICS.writeDataPoint({
        indexes: [event.event],
        blobs: [
          event.actor ?? "",
          event.resource ?? "",
          event.level,
          JSON.stringify(event.data ?? {}),
        ],
        doubles: [{ info: 0, warn: 1, error: 2, critical: 3 }[event.level]],
      });
    } catch { /* silent */ }
  }
}

// ─── GUARD MIDDLEWARE ─────────────────────────────────────────────────────────

/**
 * Full guard middleware — rate limit + cost check + SIEM log.
 * Call at the top of any AI-powered route.
 */
export async function guardAIRequest(
  request: Request,
  env: CostGuardEnv & {
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_KEY?: string;
    STREAM_ANALYTICS?: AnalyticsEngineDataset;
    REQUEST_SIGNING_SECRET?: string;
  },
  options: {
    provider: keyof typeof DAILY_LIMITS_USD;
    model: string;
    estimatedPromptLength: number;
    estimatedOutputTokens?: number;
    rateLimit?: { limit: number; windowSecs: number };
  }
): Promise<{ allowed: boolean; response?: Response; estimated_cost: number }> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const guard = new CostGuard(env);
  const limiter = new RateLimiter(env.KV_SPEND);

  // 1. Rate limiting
  if (options.rateLimit) {
    const rl = await limiter.check(
      ip,
      options.provider,
      options.rateLimit.limit,
      options.rateLimit.windowSecs
    );
    if (!rl.allowed) {
      await logSIEMEvent({
        level: "warn",
        event: "rate_limit_exceeded",
        actor: ip,
        resource: options.provider,
        data: { reset_in: rl.reset_in },
      }, env);
      return {
        allowed: false,
        estimated_cost: 0,
        response: new Response(JSON.stringify({
          error: "Rate limit exceeded",
          reset_in: rl.reset_in,
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rl.reset_in),
            "X-RateLimit-Remaining": "0",
          },
        }),
      };
    }
  }

  // 2. Cost preflight
  const inputTokens = estimateTokens(options.estimatedPromptLength.toString().repeat(options.estimatedPromptLength));
  const preflight = await guard.preflightCheck(
    options.provider,
    options.model,
    Math.ceil(options.estimatedPromptLength / 4),
    options.estimatedOutputTokens ?? 500
  );

  if (!preflight.allowed) {
    await logSIEMEvent({
      level: "critical",
      event: "spend_limit_exceeded",
      resource: options.provider,
      data: { reason: preflight.reason, model: options.model },
    }, env);
    return {
      allowed: false,
      estimated_cost: preflight.estimated_cost,
      response: new Response(JSON.stringify({
        error: "AI spending limit reached for today",
        reason: preflight.reason,
        retry_after: "tomorrow 00:00 UTC",
      }), { status: 503, headers: { "Content-Type": "application/json" } }),
    };
  }

  return { allowed: true, estimated_cost: preflight.estimated_cost };
}
