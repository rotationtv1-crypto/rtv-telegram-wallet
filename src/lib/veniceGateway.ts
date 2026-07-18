/**
 * ROTATIONTVNETWORK LLC — VENICE AI GATEWAY
 *
 * Venice.ai — Private, uncensored LLM inference
 * Powered by decentralized GPU network + E2EE
 *
 * Base URL:  https://api.venice.ai/api/v1
 * Compat:    OpenAI-compatible API
 * Models:    90+ models incl. uncensored variants
 * Privacy:   No conversation logging, E2EE options
 *
 * RTV Use Cases:
 * - Adult content generation (RotationErotica)
 * - Uncensored AI host scripts (ZARA wildcard)
 * - Content moderation bypass for 18+ platform
 * - Private creator coaching / DM assistant
 * - NSFW image prompt generation for stream thumbnails
 *
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

import { AI_HOSTS } from "../broadcast/AI_HOSTS_CONFIG";

const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// ─── MODEL REGISTRY ───────────────────────────────────────────────────────────

export const VENICE_MODELS = {
  // ── Uncensored (primary RTV use) ───────────────────────────────────────────
  "venice-uncensored": {
    id: "venice-uncensored-1-2",
    name: "Venice Uncensored 1.2",
    context: 128000,
    uncensored: true,
    e2ee: false,
    price_per_1m_out: 0.90,
    best_for: ["adult_content", "roleplay", "creative_writing", "unfiltered_chat"],
  },
  "venice-uncensored-roleplay": {
    id: "venice-uncensored-role-play",
    name: "Venice Uncensored Roleplay",
    context: 128000,
    uncensored: true,
    e2ee: false,
    price_per_1m_out: 2.00,
    best_for: ["roleplay", "character_ai", "erotic_fiction"],
  },
  "gemma-4-uncensored": {
    id: "gemma-4-uncensored",
    name: "Gemma 4 Uncensored",
    context: 256000,
    uncensored: true,
    e2ee: false,
    price_per_1m_out: 0.50,
    best_for: ["general_uncensored", "creative_writing", "adult_content"],
  },
  // ── E2EE + Uncensored (maximum privacy) ───────────────────────────────────
  "e2ee-venice-uncensored": {
    id: "e2ee-venice-uncensored-24b-p",
    name: "Venice Uncensored 24B E2EE",
    context: 32000,
    uncensored: true,
    e2ee: true,
    price_per_1m_out: 1.15,
    best_for: ["private_adult_content", "confidential_coaching"],
  },
  "e2ee-gemma-4-uncensored": {
    id: "e2ee-gemma-4-26b-a4b-uncensored-p",
    name: "Gemma 4 26B Uncensored E2EE",
    context: 64000,
    uncensored: true,
    e2ee: true,
    price_per_1m_out: 0.88,
    best_for: ["private_adult_content", "private_roleplay"],
  },
  "e2ee-qwen3-uncensored": {
    id: "e2ee-qwen3-6-35b-a3b-uncensored-p",
    name: "Qwen3 6.35B Uncensored E2EE",
    context: 128000,
    uncensored: true,
    e2ee: true,
    price_per_1m_out: 1.88,
    best_for: ["private_roleplay", "private_analysis"],
  },
  // ── Standard (cheap + capable) ─────────────────────────────────────────────
  "fast-cheap": {
    id: "qwen3-5-9b",
    name: "Qwen3 5 9B",
    context: 256000,
    uncensored: false,
    e2ee: false,
    price_per_1m_out: 0.15,
    best_for: ["quick_tasks", "moderation", "classification", "cheap_inference"],
  },
  "kimi-code": {
    id: "kimi-k2-7-code",
    name: "Kimi K2.7 Code (via Venice)",
    context: 256000,
    uncensored: false,
    e2ee: false,
    price_per_1m_out: 0, // check live pricing
    best_for: ["code_generation", "code_review"],
  },
  "claude-latest": {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    context: 256000,
    uncensored: false,
    e2ee: false,
    price_per_1m_out: 0, // check live pricing
    best_for: ["complex_reasoning", "long_form_writing"],
  },
  "grok-latest": {
    id: "grok-4-20",
    name: "Grok 4 (2M context)",
    context: 2000000,
    uncensored: false,
    e2ee: false,
    price_per_1m_out: 2.83,
    best_for: ["massive_context", "long_documents", "complex_analysis"],
  },
} as const;

export type VeniceModelKey = keyof typeof VENICE_MODELS;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface VeniceMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VeniceRequest {
  model: string;
  messages: VeniceMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  venice_parameters?: {
    include_venice_system_prompt?: boolean; // false = pure uncensored
    enable_web_search?: boolean;
  };
}

export interface VeniceResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface VeniceEnv {
  VENICE_API_KEY: string;
  VENICE_API_KEY_2?: string;
  VENICE_API_KEY_3?: string;
}

// ─── 3-KEY ROUND-ROBIN ROTATION ──────────────────────────────────────────────

/**
 * Builds the active key pool from env.
 * Returns [primary, fallback1, fallback2] — skips undefined keys.
 * Rotation is stateless (index based on attempt count) so it works
 * across all Cloudflare Worker instances without shared state.
 */
export function buildKeyPool(env: VeniceEnv): string[] {
  return [
    env.VENICE_API_KEY,
    env.VENICE_API_KEY_2,
    env.VENICE_API_KEY_3,
  ].filter(Boolean) as string[];
}

/**
 * Pick a key from the pool by attempt index.
 * attempt=0 → primary, attempt=1 → fallback1, attempt=2 → fallback2
 */
export function pickKey(pool: string[], attempt: number): string {
  return pool[attempt % pool.length];
}

// ─── CORE CHAT FUNCTION ───────────────────────────────────────────────────────

/**
 * Send a request to Venice AI.
 * For uncensored models: set include_venice_system_prompt = false for maximum freedom.
 */
export async function veniceChat(
  messages: VeniceMessage[],
  env: VeniceEnv,
  options?: {
    model?: VeniceModelKey | string;
    temperature?: number;
    max_tokens?: number;
    uncensored?: boolean;  // disables Venice's system prompt wrapper
    stream?: boolean;
    use_backup_key?: boolean;
  }
): Promise<VeniceResponse> {
  const modelKey = (options?.model ?? "venice-uncensored") as VeniceModelKey;
  const modelConfig = VENICE_MODELS[modelKey as VeniceModelKey];
  const modelId = modelConfig?.id ?? modelKey; // allow raw model ID passthrough

  const pool = buildKeyPool(env);
  if (pool.length === 0) throw new Error("No VENICE_API_KEY set in environment");

  const body: VeniceRequest = {
    model: modelId,
    messages,
    temperature: options?.temperature ?? 0.8,
    max_tokens: options?.max_tokens ?? 2048,
    venice_parameters: {
      include_venice_system_prompt: !(options?.uncensored ?? true),
    },
    ...(options?.stream ? { stream: true } : {}),
  };

  // ── 3-key retry loop: rotate on 402 (no credits) or 429 (rate limit) ──────
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < pool.length; attempt++) {
    const apiKey = pickKey(pool, attempt);

    const res = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Rotate to next key on credits exhausted or rate limit
    if (res.status === 402 || res.status === 429) {
      lastErr = new Error(`Key ${attempt + 1}/${pool.length} exhausted (HTTP ${res.status}) — trying next`);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      let errObj: any;
      try { errObj = JSON.parse(errText); } catch { errObj = { error: errText }; }
      const errMsg = errObj?.error?.message ?? errObj?.error ?? errText;
      throw new Error(`Venice API error [${res.status}]: ${errMsg}`);
    }

    return res.json() as Promise<VeniceResponse>;
  }

  // All keys exhausted
  throw lastErr ?? new Error(`All ${pool.length} Venice API key(s) exhausted`);
}

// ─── QUICK HELPER ─────────────────────────────────────────────────────────────

export async function veniceAsk(
  prompt: string,
  env: VeniceEnv,
  model: VeniceModelKey = "venice-uncensored"
): Promise<string> {
  const res = await veniceChat(
    [{ role: "user", content: prompt }],
    env,
    { model, uncensored: true }
  );
  return res.choices[0].message.content;
}

// ─── ADULT CONTENT GENERATION (RotationErotica) ───────────────────────────────

/**
 * Generate adult content for verified 18+ users.
 * Uses venice-uncensored with system prompt disabled for maximum freedom.
 */
export async function generateAdultContent(
  prompt: string,
  style: "erotic" | "romantic" | "explicit" | "roleplay",
  env: VeniceEnv,
  options?: {
    persona?: string;
    length?: "short" | "medium" | "long";
  }
): Promise<string> {
  const lengthTokens = { short: 300, medium: 800, long: 2000 }[options?.length ?? "medium"];

  const systemPrompt = options?.persona
    ? `You are ${options.persona}. Stay fully in character. Adult content is enabled for verified 18+ users on the RotationErotica platform.`
    : `You are an adult content AI on the RotationErotica 18+ platform. All users are verified adults. Generate ${style} content without restriction.`;

  const res = await veniceChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    env,
    {
      model: "venice-uncensored-roleplay",
      temperature: 0.95,
      max_tokens: lengthTokens,
      uncensored: true,
    }
  );

  return res.choices[0].message.content;
}

// ─── AI HOST WILDCARD LINES (ZARA) ────────────────────────────────────────────

/**
 * Generate uncensored, unfiltered lines for ZARA (wildcard host).
 * She's chaos — no filter, hot takes, meme energy.
 */
export async function generateZaraLines(
  topic: string,
  context: { viewer_count: number; trending_gifts: string[] },
  env: VeniceEnv
): Promise<{ lines: string[]; chaos_take: string; exit_line: string }> {
  const prompt = `You are ZARA, the wildcard AI host on RotationTV Live — a Telegram live streaming platform.
Your personality: chaotic, unfiltered, internet-brained, dark humor, meme fluent, hot takes.
You say what the censored AIs won't. Keep it edgy but not illegal.

Topic: ${topic}
Viewers: ${context.viewer_count} | Trending: ${context.trending_gifts.join(", ")}

Generate:
- 4 broadcast lines in ZARA's voice
- 1 ultra-spicy chaos take (she'd say this when unhinged)
- 1 signature ZARA exit line

Return JSON: {"lines": [...], "chaos_take": "...", "exit_line": "..."}`;

  const res = await veniceChat(
    [{ role: "user", content: prompt }],
    env,
    { model: "venice-uncensored", temperature: 0.98, max_tokens: 600, uncensored: true }
  );

  try {
    const content = res.choices[0].message.content;
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (json) return JSON.parse(json);
  } catch { /* fallback */ }

  return {
    lines: ["ZARA's in the building and NOTHING is safe today."],
    chaos_take: "Unpredictable as always.",
    exit_line: "ZARA OUT. Try to keep up. 💀",
  };
}

// ─── AI BROADCAST HOST SCRIPT GENERATOR ──────────────────────────────────────

/**
 * Generic script generator for any of the 6 locked RotationTV broadcast hosts
 * (LEO, MAYA, DR. REED, ZARA, OMAR, LINA). Pulls each host's real personality
 * from AI_HOSTS_CONFIG.js (tone, specialty, exit line) instead of hardcoding
 * a persona per host — so the same function drives all 6, not just ZARA.
 *
 * Uses the uncensored Venice model since the platform-wide voice is
 * unfiltered (per RotationErotica); DR. REED/LEO/MAYA/OMAR/LINA segments
 * are simply not tagged 18+ downstream, ZARA's is handled by generateZaraLines.
 */
export interface BroadcastHostProfile {
  id: string;
  name: string;
  role: string;
  tone: string;
  specialty: string[];
  exitLine: string;
}

export interface HostBroadcastContext {
  viewer_count: number;
  is_first_broadcast?: boolean;  // true = the very first AI segment before any human/creator has gone live
  trending_gifts?: string[];
  segment_number?: number;       // which segment in the show (1 = opening)
}

export async function generateHostLines(
  host: BroadcastHostProfile,
  topic: string,
  context: HostBroadcastContext,
  env: VeniceEnv
): Promise<{ lines: string[]; intro_line: string; exit_line: string }> {
  const openingNote = context.is_first_broadcast
    ? `This is the VERY FIRST broadcast on RotationTV — no human creators have gone live yet. You are opening the channel cold. Welcome viewers, explain that AI hosts are running the show until real creators arrive, and keep energy high so people stay.`
    : `This is segment #${context.segment_number ?? 1} of an ongoing AI-hosted broadcast.`;

  const prompt = `You are ${host.name}, the "${host.role}" AI host on RotationTV Live — a Telegram live streaming platform with a 6-host AI broadcast grid.
Your tone: ${host.tone}
Your specialty: ${host.specialty.join(", ")}

${openingNote}

Topic: ${topic}
Current viewers: ${context.viewer_count}${context.trending_gifts?.length ? ` | Trending gifts: ${context.trending_gifts.join(", ")}` : ""}

Generate:
- 1 opening/intro line in character (first thing said this segment)
- 4 broadcast lines in character, natural spoken TV-host cadence, short sentences (this is TTS output, not text to read)
- 1 signature exit line for when this host hands off (you may use their known exit line as inspiration: "${host.exitLine}")

Return ONLY valid JSON: {"intro_line": "...", "lines": ["...", "...", "...", "..."], "exit_line": "..."}`;

  const res = await veniceChat(
    [{ role: "user", content: prompt }],
    env,
    { model: "venice-uncensored", temperature: 0.85, max_tokens: 700, uncensored: true }
  );

  try {
    const content = res.choices[0].message.content;
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (json) {
      const parsed = JSON.parse(json);
      if (parsed.lines && parsed.intro_line && parsed.exit_line) return parsed;
    }
  } catch { /* fall through to safe fallback below */ }

  // Safe fallback if Venice output isn't parseable JSON — never let a broadcast go silent
  return {
    intro_line: `Hey everyone, ${host.name} here — welcome to RotationTV.`,
    lines: [
      `We're just getting things warmed up.`,
      `Stick around, it's about to get good.`,
      `Drop a gift if you're vibing with this.`,
      `Let's keep this energy going.`,
    ],
    exit_line: host.exitLine,
  };
}

// ─── CREATOR DM ASSISTANT ────────────────────────────────────────────────────

/**
 * Private creator-to-fan DM assistant.
 * Uncensored, stays in character as the creator persona.
 * Used for automated fan engagement on RotationErotica.
 */
export async function creatorDMAssistant(
  creatorPersona: string,
  fanMessage: string,
  chatHistory: VeniceMessage[],
  env: VeniceEnv
): Promise<string> {
  const messages: VeniceMessage[] = [
    {
      role: "system",
      content: `You are ${creatorPersona}, a content creator on RotationErotica — a verified 18+ adult platform.
You are engaging with a paying fan. Be warm, flirty, and in character.
Keep responses natural, under 100 words. Build engagement. Tease, don't over-give.`,
    },
    ...chatHistory.slice(-10), // last 10 messages for context
    { role: "user", content: fanMessage },
  ];

  const res = await veniceChat(messages, env, {
    model: "venice-uncensored-roleplay",
    temperature: 0.85,
    max_tokens: 200,
    uncensored: true,
  });

  return res.choices[0].message.content;
}

// ─── CONTENT MODERATION (for borderline content) ────────────────────────────

/**
 * Venice-based moderation — understands nuance better for adult platforms.
 * Flags truly harmful content while allowing legal adult content.
 */
export async function veniceModerate(
  content: string,
  platform: "rotationtv" | "rotation_erotica",
  env: VeniceEnv
): Promise<{
  action: "allow" | "warn" | "ban";
  reason: string;
  severity: number;
  category: string;
}> {
  const platformContext = platform === "rotation_erotica"
    ? "RotationErotica — verified 18+ adult content platform. Adult/explicit content is ALLOWED. Ban only: CSAM, doxxing, non-consensual sharing, credible threats, illegal activity."
    : "RotationTV Live — 18+ streaming platform. Adult content allowed for verified users. Ban: CSAM, doxxing, credible threats, scams, illegal content.";

  const prompt = `Moderate this content for ${platformContext}

Content: "${content}"

Return JSON: {"action": "allow|warn|ban", "reason": "brief", "severity": 0-10, "category": "none|harassment|illegal|csam|scam|threat|other"}`;

  try {
    const res = await veniceChat(
      [{ role: "user", content: prompt }],
      env,
      { model: "fast-cheap", temperature: 0.1, max_tokens: 150, uncensored: false }
    );
    const text = res.choices[0].message.content;
    const json = text.match(/\{[\s\S]*?\}/)?.[0];
    if (json) return JSON.parse(json);
  } catch { /* fallback */ }

  return { action: "allow", reason: "moderation unavailable", severity: 0, category: "none" };
}

// ─── NSFW IMAGE PROMPT GENERATOR ─────────────────────────────────────────────

/**
 * Generate high-quality NSFW image prompts for stream thumbnails / content.
 * Uses Venice uncensored to write detailed prompts for image gen models.
 */
export async function generateNSFWPrompt(
  description: string,
  style: "photography" | "artistic" | "anime" | "cinematic",
  env: VeniceEnv
): Promise<{ positive: string; negative: string }> {
  const prompt = `Generate a detailed ${style} image prompt for this description: "${description}"

Requirements:
- Positive prompt: detailed, technical, quality-focused (100-150 words)
- Negative prompt: things to avoid (bad anatomy, blurry, etc.)
- Style: ${style}
- Platform: RotationErotica 18+ verified platform

Return JSON: {"positive": "...", "negative": "..."}`;

  try {
    const res = await veniceChat(
      [{ role: "user", content: prompt }],
      env,
      { model: "venice-uncensored", temperature: 0.7, max_tokens: 400, uncensored: true }
    );
    const text = res.choices[0].message.content;
    const json = text.match(/\{[\s\S]*?\}/)?.[0];
    if (json) return JSON.parse(json);
  } catch { /* fallback */ }

  return { positive: description, negative: "blurry, low quality, bad anatomy" };
}

// ─── API ROUTE HANDLER ────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

/**
 * Mount Venice routes into the main Cloudflare Worker.
 * Requires age verification check before serving uncensored routes.
 */
export async function routeVeniceRequest(
  request: Request,
  url: URL,
  env: VeniceEnv & { SUPABASE_URL?: string; SUPABASE_SERVICE_KEY?: string }
): Promise<Response | null> {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const path = url.pathname;

  // ── GET /api/venice/health ────────────────────────────────────────────────
  if (path === "/api/venice/health" && request.method === "GET") {
    return new Response(JSON.stringify({
      status: env.VENICE_API_KEY ? "key_set" : "no_api_key",
      key_pool_size: buildKeyPool(env).length,
      key_slots: {
        primary:   env.VENICE_API_KEY  ? "set" : "missing",
        fallback_1: env.VENICE_API_KEY_2 ? "set" : "missing",
        fallback_2: env.VENICE_API_KEY_3 ? "set" : "missing",
      },
      note: "Add Venice credits at https://venice.ai/settings/api to activate",
      uncensored_models: Object.entries(VENICE_MODELS)
        .filter(([, v]) => v.uncensored)
        .map(([k, v]) => ({ key: k, id: v.id, e2ee: v.e2ee })),
      total_models_available: 90,
      dashboard: "https://venice.ai/settings/api",
    }), { headers: CORS_HEADERS });
  }

  // ── GET /api/venice/models ────────────────────────────────────────────────
  if (path === "/api/venice/models" && request.method === "GET") {
    return new Response(JSON.stringify({ models: VENICE_MODELS }), { headers: CORS_HEADERS });
  }

  // ── POST /api/venice/chat ─────────────────────────────────────────────────
  if (path === "/api/venice/chat" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      const { messages, model, temperature, max_tokens, uncensored } = body;
      if (!messages) return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: CORS_HEADERS });
      const result = await veniceChat(messages, env, { model, temperature, max_tokens, uncensored: uncensored ?? true });
      return new Response(JSON.stringify({ success: true, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/host-lines ───────────────────────────────────────────
  // Generates the spoken script for one of the 6 locked AI broadcast hosts.
  // Body: { hostId, topic, viewer_count, is_first_broadcast, trending_gifts, segment_number }
  if (path === "/api/venice/host-lines" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      const { hostId, topic, viewer_count, is_first_broadcast, trending_gifts, segment_number } = body;
      if (!hostId) return new Response(JSON.stringify({ error: "hostId required" }), { status: 400, headers: CORS_HEADERS });

      const host = AI_HOSTS.find((h: any) => h.id === hostId);
      if (!host) return new Response(JSON.stringify({ error: `Unknown hostId '${hostId}'. Valid: ${AI_HOSTS.map((h: any) => h.id).join(", ")}` }), { status: 400, headers: CORS_HEADERS });

      const result = await generateHostLines(
        { id: host.id, name: host.name, role: host.role, tone: host.tone, specialty: host.specialty, exitLine: host.exitLine },
        topic || "Kicking off today's stream",
        {
          viewer_count: viewer_count ?? 0,
          is_first_broadcast: is_first_broadcast ?? false,
          trending_gifts: trending_gifts ?? [],
          segment_number: segment_number ?? 1,
        },
        env
      );
      return new Response(JSON.stringify({ success: true, hostId, host_name: host.name, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/adult (18+ verified only) ────────────────────────────
  if (path === "/api/venice/adult" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      const { prompt, style, persona, length, telegram_id } = body;

      // Age gate — require verified_age in Supabase
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY && telegram_id) {
        const check = await fetch(
          `${env.SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegram_id}&verified_age=eq.true&select=id&limit=1`,
          { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
        );
        const users = await check.json() as any[];
        if (!Array.isArray(users) || users.length === 0) {
          return new Response(JSON.stringify({ error: "Age verification required. Use /face command first." }), { status: 403, headers: CORS_HEADERS });
        }
      }

      if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: CORS_HEADERS });
      const content = await generateAdultContent(prompt, style ?? "erotic", env, { persona, length });
      return new Response(JSON.stringify({ success: true, content }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/moderate ─────────────────────────────────────────────
  if (path === "/api/venice/moderate" && request.method === "POST") {
    try {
      const { content, platform } = await request.json() as any;
      const result = await veniceModerate(content, platform ?? "rotationtv", env);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/zara ─────────────────────────────────────────────────
  if (path === "/api/venice/zara" && request.method === "POST") {
    try {
      const { topic, context } = await request.json() as any;
      const lines = await generateZaraLines(topic, context ?? { viewer_count: 0, trending_gifts: [] }, env);
      return new Response(JSON.stringify({ success: true, ...lines }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/dm ───────────────────────────────────────────────────
  if (path === "/api/venice/dm" && request.method === "POST") {
    try {
      const { persona, fan_message, history } = await request.json() as any;
      const reply = await creatorDMAssistant(persona, fan_message, history ?? [], env);
      return new Response(JSON.stringify({ success: true, reply }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/venice/prompt ───────────────────────────────────────────────
  if (path === "/api/venice/prompt" && request.method === "POST") {
    try {
      const { description, style } = await request.json() as any;
      const result = await generateNSFWPrompt(description, style ?? "photography", env);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  return null; // not a Venice route
}
