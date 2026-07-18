/**
 * ROTATIONTVNETWORK LLC — KIMI AI GATEWAY
 * 
 * Moonshot AI (Kimi) — Full integration for the RTV Ecosystem
 * 
 * Base URL:  https://api.moonshot.ai/v1
 * SDK:       OpenAI-compatible (drop-in replacement)
 * Models:    kimi-k2.7-code (256K) | kimi-k2.5 (256K) | moonshot-v1-128k (128K)
 * Features:  Chat · Code review · Tool calling · Streaming · PR automation
 * 
 * Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026
 */

const KIMI_BASE_URL = "https://api.moonshot.ai/v1";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface KimiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface KimiTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface KimiRequest {
  model: string;
  messages: KimiMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: KimiTool[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  stream?: boolean;
  response_format?: { type: "json_object" | "text" };
}

export interface KimiChoice {
  index: number;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason: "stop" | "tool_calls" | "length" | "content_filter";
}

export interface KimiResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: KimiChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiCodeReview {
  issues: Array<{
    severity: "critical" | "high" | "medium" | "low" | "info";
    line: number | null;
    message: string;
    suggestion?: string;
  }>;
  suggestions: string[];
  score: number;           // 0–100
  grade: string;           // A / B / C / D / F
  summary: string;
  security_flags: string[];
  performance_notes: string[];
}

export interface KimiEnv {
  KIMI_API_KEY: string;
}

// ─── AVAILABLE MODELS ─────────────────────────────────────────────────────────

export const KIMI_MODELS = {
  "kimi-k2.7-code": {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    context_window: 256000,
    description: "Kimi's strongest coding model — code gen, review, debugging, architecture",
    best_for: ["code_generation", "code_review", "debugging", "architecture", "pr_review"],
    default_temp: 0.2,
  },
  "kimi-k2.5": {
    id: "kimi-k2.5",
    name: "Kimi K2.5",
    context_window: 256000,
    description: "Most powerful general model — reasoning, strategy, long-form writing",
    best_for: ["reasoning", "analysis", "writing", "summarization", "strategy"],
    default_temp: 0.7,
  },
  "moonshot-v1-128k": {
    id: "moonshot-v1-128k",
    name: "Moonshot v1 128K",
    context_window: 128000,
    description: "Long-context document processing and extraction",
    best_for: ["document_analysis", "long_context", "extraction", "translation"],
    default_temp: 0.5,
  },
} as const;

export type KimiModelId = keyof typeof KIMI_MODELS;

// ─── RTV SYSTEM PROMPT ────────────────────────────────────────────────────────

const RTV_KIMI_SYSTEM_PROMPT = `You are the RTV Kimi Agent — an elite AI engineer and strategic advisor embedded in the RotationTV Network ecosystem.

Presidential Authority: Darrel | Rotationtvnetwork LLC

ECOSYSTEM (9 companies):
- RotationTV Network    — Live AI Clone streaming platform (Bigo/Tango competitor on Telegram)
- RotationPay          — Multi-chain payment gateway (TON, Solana, Stripe)
- RotationCall         — Enterprise AI voice services (Twilio competitor)
- RTV University       — On-chain certified education with NFT diplomas
- Bigo Agency          — Creator management & talent representation
- White Logistics      — AI-powered supply chain management
- Pretrial Services    — Justice technology (electronic monitoring, reporting)
- EmergentLabs        — Build infrastructure platform (emergent.sh)
- OpenClaw            — AI agent deployment gateway

TECH STACK:
- Cloudflare Workers (Durable Objects, Queues, R2, Analytics Engine, Workers AI)
- Supabase (PostgreSQL, Realtime, Auth, Edge Functions)
- Telegram Mini App (React + TonConnect)
- TON/Solana blockchain ($RTVS token, 9 decimals, 1 RTV = $0.01 USD)
- Cloudflare Stream (RTMP live streaming)
- 6 AI Broadcast Hosts: LEO, MAYA, DR. REED, ZARA, OMAR, LINA (2×3 grid)

REVENUE MODEL: 80% creator / 15% platform / 5% agency
BRAND: "Learn it. Live it. Love it."

CODING STANDARDS:
- Always output TypeScript with strict types
- Use async/await, never callbacks
- Add JSDoc comments on exported functions
- Handle errors gracefully — never throw uncaught exceptions
- Cloudflare Workers: fetch-based, no Node.js APIs, use env bindings

When reviewing code: be precise, actionable, and production-focused.
When building: write complete, deployable code — no placeholders.`;

// ─── CORE CHAT FUNCTION ───────────────────────────────────────────────────────

/**
 * Send a chat completion request to Kimi AI.
 * Auto-injects the RTV system prompt if not provided.
 */
export async function kimiChat(
  messages: KimiMessage[],
  env: KimiEnv,
  options?: {
    model?: KimiModelId;
    temperature?: number;
    max_tokens?: number;
    tools?: KimiTool[];
    tool_choice?: KimiRequest["tool_choice"];
    json_mode?: boolean;
    stream?: boolean;
  }
): Promise<KimiResponse> {
  if (!env.KIMI_API_KEY) throw new Error("KIMI_API_KEY not set in environment");

  const model = options?.model ?? "kimi-k2.7-code";
  const modelConfig = KIMI_MODELS[model];

  // Auto-prepend system prompt if not already present
  const allMessages: KimiMessage[] = messages[0]?.role === "system"
    ? messages
    : [{ role: "system", content: RTV_KIMI_SYSTEM_PROMPT }, ...messages];

  const body: KimiRequest = {
    model,
    messages: allMessages,
    temperature: options?.temperature ?? modelConfig.default_temp,
    max_tokens: options?.max_tokens ?? 4096,
    ...(options?.tools ? { tools: options.tools, tool_choice: options.tool_choice ?? "auto" } : {}),
    ...(options?.json_mode ? { response_format: { type: "json_object" } } : {}),
    ...(options?.stream ? { stream: true } : {}),
  };

  const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.KIMI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Kimi API error [${res.status}]: ${errText}`);
  }

  return res.json() as Promise<KimiResponse>;
}

// ─── QUICK HELPER ─────────────────────────────────────────────────────────────

/**
 * Simple one-shot Kimi query. Returns text directly.
 */
export async function kimiAsk(
  question: string,
  env: KimiEnv,
  model: KimiModelId = "kimi-k2.5"
): Promise<string> {
  const res = await kimiChat([{ role: "user", content: question }], env, { model });
  return res.choices[0].message.content;
}

// ─── CODE REVIEW ──────────────────────────────────────────────────────────────

/**
 * Deep code review using Kimi K2.7 Code.
 * Returns structured JSON with issues, score, and suggestions.
 */
export async function kimiCodeReview(
  code: string,
  filename: string,
  language: string,
  env: KimiEnv,
  context?: string
): Promise<KimiCodeReview> {
  const prompt = `Perform a thorough production code review of this ${language} file: ${filename}
${context ? `\nContext: ${context}` : ""}

Analyze for:
1. Bugs and logic errors
2. Security vulnerabilities (injection, auth bypass, data leaks)
3. Performance issues (N+1 queries, blocking calls, memory leaks)
4. TypeScript type safety issues
5. Cloudflare Workers compatibility (no Node.js APIs)
6. RTV ecosystem patterns (proper env usage, error handling, CORS)

Return ONLY valid JSON with this structure:
{
  "issues": [{"severity": "critical|high|medium|low|info", "line": null, "message": "...", "suggestion": "..."}],
  "suggestions": ["..."],
  "score": 0-100,
  "grade": "A|B|C|D|F",
  "summary": "...",
  "security_flags": ["..."],
  "performance_notes": ["..."]
}

Code to review:
\`\`\`${language}
${code}
\`\`\``;

  const res = await kimiChat(
    [{ role: "user", content: prompt }],
    env,
    { model: "kimi-k2.7-code", temperature: 0.1, json_mode: true }
  );

  try {
    return JSON.parse(res.choices[0].message.content) as KimiCodeReview;
  } catch {
    return {
      issues: [],
      suggestions: [res.choices[0].message.content],
      score: 0,
      grade: "F",
      summary: "Review parsing failed — raw output in suggestions",
      security_flags: [],
      performance_notes: [],
    };
  }
}

// ─── ECOSYSTEM ANALYSIS ───────────────────────────────────────────────────────

/**
 * Strategic ecosystem analysis using Kimi K2.5.
 * Pass any structured data (metrics, events, errors) for insight.
 */
export async function kimiEcosystemAnalysis(
  data: Record<string, any>,
  env: KimiEnv,
  focus?: "revenue" | "growth" | "security" | "performance" | "general"
): Promise<string> {
  const focusPrompt = focus
    ? `Focus specifically on: ${focus.toUpperCase()} insights and recommendations.`
    : "Provide comprehensive strategic recommendations.";

  const res = await kimiChat(
    [{
      role: "user",
      content: `Analyze this RotationTV Network ecosystem data and provide strategic recommendations for Darrel (CEO).
${focusPrompt}
Be direct, actionable, and concise. Prioritize by impact.

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``,
    }],
    env,
    { model: "kimi-k2.5", temperature: 0.5 }
  );

  return res.choices[0].message.content;
}

// ─── STREAM MODERATION ASSIST ─────────────────────────────────────────────────

/**
 * Ask Kimi to help moderate a stream chat message.
 * Faster alternative to GPT-4o for high-volume chat.
 */
export async function kimiModerateMessage(
  message: string,
  username: string,
  env: KimiEnv
): Promise<{ action: "allow" | "warn" | "ban"; reason: string; severity: number }> {
  const res = await kimiChat(
    [{
      role: "user",
      content: `Moderate this live stream chat message for the RTV platform (18+ adult content allowed).
User: ${username}
Message: "${message}"

Return JSON: { "action": "allow|warn|ban", "reason": "brief reason", "severity": 0-10 }
Ban only for: illegal content, CSAM, doxxing, credible threats, scams.
Allow: adult content, strong language, normal arguments.`,
    }],
    env,
    { model: "kimi-k2.5", temperature: 0.1, max_tokens: 150, json_mode: true }
  );

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return { action: "allow", reason: "parse error", severity: 0 };
  }
}

// ─── AI HOST SCRIPT GENERATOR ─────────────────────────────────────────────────

/**
 * Generate live broadcast script lines for a specific AI host.
 * Used by the AI broadcast engine to keep hosts sounding fresh.
 */
export async function kimiGenerateHostLines(
  hostName: "LEO" | "MAYA" | "DR_REED" | "ZARA" | "OMAR" | "LINA",
  topic: string,
  context: { viewer_count: number; trending_gifts: string[]; current_pk?: string },
  env: KimiEnv
): Promise<{ lines: string[]; handoff_cue: string; exit_line: string }> {
  const hostPersonalities: Record<string, string> = {
    LEO: "Authoritative, smooth news anchor. Formal but engaging. Owns the room.",
    MAYA: "High-energy hype queen. Exclamation points. Gets the crowd hyped.",
    DR_REED: "Data-driven analyst. References numbers and trends. Calm authority.",
    ZARA: "Wildcard chaos agent. Unpredictable hot takes. Internet culture fluent.",
    OMAR: "Chill late-night storyteller. Smooth, relaxed, draws people in.",
    LINA: "Warm connector. Bridges topics and hosts. Keeps energy balanced.",
  };

  const res = await kimiChat(
    [{
      role: "user",
      content: `Generate 5 broadcast lines for AI host ${hostName} on RotationTV Live.
Personality: ${hostPersonalities[hostName]}
Topic: ${topic}
Context: ${context.viewer_count} viewers watching | Trending gifts: ${context.trending_gifts.join(", ")}
${context.current_pk ? `Active PK Battle: ${context.current_pk}` : ""}

Return JSON:
{
  "lines": ["line1", "line2", "line3", "line4", "line5"],
  "handoff_cue": "natural transition line to pass to next host",
  "exit_line": "${hostName}'s signature exit line"
}`,
    }],
    env,
    { model: "kimi-k2.5", temperature: 0.9, json_mode: true }
  );

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return {
      lines: [`${hostName} here — let's keep it going!`],
      handoff_cue: "Passing it over now...",
      exit_line: `${hostName} signing off.`,
    };
  }
}

// ─── API ROUTE HANDLER (for Cloudflare Worker) ───────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

/**
 * Mount Kimi routes into the main Cloudflare Worker.
 * Call this from src/index.ts: routeKimiRequest(request, url, env)
 */
export async function routeKimiRequest(
  request: Request,
  url: URL,
  env: KimiEnv
): Promise<Response | null> {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const path = url.pathname;

  // ── GET /api/kimi/health ─────────────────────────────────────────────────
  if (path === "/api/kimi/health" && request.method === "GET") {
    const hasKey = !!env.KIMI_API_KEY;
    let connected = false;
    if (hasKey) {
      try {
        const test = await kimiAsk("Reply with: {\"ok\":true}", env, "moonshot-v1-128k");
        connected = test.includes("ok");
      } catch { /* not connected */ }
    }
    return new Response(JSON.stringify({
      status: connected ? "connected" : hasKey ? "key_set_but_unreachable" : "no_api_key",
      models: Object.keys(KIMI_MODELS),
      base_url: KIMI_BASE_URL,
      account_url: "https://platform.moonshot.ai",
    }), { headers: CORS_HEADERS });
  }

  // ── GET /api/kimi/models ─────────────────────────────────────────────────
  if (path === "/api/kimi/models" && request.method === "GET") {
    return new Response(JSON.stringify({ models: KIMI_MODELS }), { headers: CORS_HEADERS });
  }

  // ── POST /api/kimi/chat ──────────────────────────────────────────────────
  if (path === "/api/kimi/chat" && request.method === "POST") {
    try {
      const body = await request.json() as any;
      const { messages, model, temperature, max_tokens, tools, json_mode } = body;
      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: CORS_HEADERS });
      }
      const result = await kimiChat(messages, env, { model, temperature, max_tokens, tools, json_mode });
      return new Response(JSON.stringify({ success: true, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/kimi/review ────────────────────────────────────────────────
  if (path === "/api/kimi/review" && request.method === "POST") {
    try {
      const { code, filename, language, context } = await request.json() as any;
      if (!code || !filename) {
        return new Response(JSON.stringify({ error: "code and filename required" }), { status: 400, headers: CORS_HEADERS });
      }
      const review = await kimiCodeReview(code, filename, language ?? "typescript", env, context);
      return new Response(JSON.stringify({ success: true, review }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/kimi/analyze ───────────────────────────────────────────────
  if (path === "/api/kimi/analyze" && request.method === "POST") {
    try {
      const { data, focus } = await request.json() as any;
      if (!data) return new Response(JSON.stringify({ error: "data required" }), { status: 400, headers: CORS_HEADERS });
      const analysis = await kimiEcosystemAnalysis(data, env, focus);
      return new Response(JSON.stringify({ success: true, analysis }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/kimi/host ──────────────────────────────────────────────────
  if (path === "/api/kimi/host" && request.method === "POST") {
    try {
      const { host, topic, context } = await request.json() as any;
      const lines = await kimiGenerateHostLines(host, topic, context ?? { viewer_count: 0, trending_gifts: [] }, env);
      return new Response(JSON.stringify({ success: true, ...lines }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ── POST /api/kimi/moderate ──────────────────────────────────────────────
  if (path === "/api/kimi/moderate" && request.method === "POST") {
    try {
      const { message, username } = await request.json() as any;
      const result = await kimiModerateMessage(message, username ?? "anonymous", env);
      return new Response(JSON.stringify({ success: true, ...result }), { headers: CORS_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  return null; // not a Kimi route
}
