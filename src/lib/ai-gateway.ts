/**
 * rtv-ai-gateway.ts  v2.0
 * APEX AI Gateway — Anthropic/Gemini/Vercel with automatic key rotation
 *
 * Priority: 1. Anthropic claude-3-5-haiku  2. Gemini 2.0 Flash  3. Vercel AI Gateway
 * Gemini supports up to 5 keys in pool (GEMINI_API_KEY_1..5) for quota rotation.
 */

import type { Request, Response } from "express";

export type AIModel = "auto" | "claude" | "gemini" | "gpt";

export interface AIRequest {
  prompt: string;
  system?: string;
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: "anthropic" | "gemini" | "vercel-gateway";
  tokens?: { input: number; output: number };
}

// ── Key pool helpers ───────────────────────────────────────────────────────────
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  // Pool of up to 5 numbered keys
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  // Also accept plain GEMINI_API_KEY (may contain one key)
  const plain = process.env.GEMINI_API_KEY ?? "";
  if (plain && plain.startsWith("AIza") && plain.length === 39) keys.push(plain);
  return [...new Set(keys)]; // deduplicate
}

function getAnthropicKey(): string {
  return (
    process.env.ANTHROPIC_API_KEY_LIVE ??    // prefer the dedicated live key
    process.env.ANTHROPIC_API_KEY ??
    ""
  );
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function callAnthropic(req: AIRequest): Promise<AIResponse> {
  const key = getAnthropicKey();
  if (!key) throw new Error("No Anthropic key configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: req.maxTokens ?? 1024,
      system: req.system ?? "You are APEX, the AI assistant for RotationTV Network.",
      messages: [{ role: "user", content: req.prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 100)}`);
  const d = await res.json() as any;
  return {
    text: d.content?.[0]?.text ?? "",
    model: d.model,
    provider: "anthropic",
    tokens: { input: d.usage?.input_tokens ?? 0, output: d.usage?.output_tokens ?? 0 },
  };
}

// ── Gemini — with key rotation on 429 ─────────────────────────────────────────
async function callGemini(req: AIRequest): Promise<AIResponse> {
  const keys = getGeminiKeys();
  if (!keys.length) throw new Error("No Gemini keys configured");

  let lastErr = "";
  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: req.prompt }] }],
          generationConfig: { maxOutputTokens: req.maxTokens ?? 1024, temperature: req.temperature ?? 0.7 },
          ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
        }),
      }
    );

    if (res.status === 429) { lastErr = "quota exceeded"; continue; } // try next key
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 100)}`);

    const d = await res.json() as any;
    return {
      text: d.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      model: "gemini-2.0-flash",
      provider: "gemini",
      tokens: {
        input: d.usageMetadata?.promptTokenCount ?? 0,
        output: d.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
  throw new Error(`All ${keys.length} Gemini keys exhausted: ${lastErr}`);
}

// ── Vercel AI Gateway ─────────────────────────────────────────────────────────
async function callVercelGateway(req: AIRequest): Promise<AIResponse> {
  const key = process.env.AI_GATEWAY_TOKEN ?? process.env.VERCEL_OIDC_TOKEN ?? "";
  if (!key) throw new Error("No Vercel AI Gateway token configured");

  const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      max_tokens: req.maxTokens ?? 1024,
      messages: [
        ...(req.system ? [{ role: "system", content: req.system }] : []),
        { role: "user", content: req.prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Vercel Gateway ${res.status}: ${(await res.text()).slice(0, 100)}`);
  const d = await res.json() as any;
  return {
    text: d.choices?.[0]?.message?.content ?? "",
    model: d.model,
    provider: "vercel-gateway",
    tokens: { input: d.usage?.prompt_tokens ?? 0, output: d.usage?.completion_tokens ?? 0 },
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export const apexAI = {
  async complete(req: AIRequest): Promise<AIResponse> {
    const model = req.model ?? "auto";
    const errors: string[] = [];

    if (model === "claude") return callAnthropic(req);
    if (model === "gemini") return callGemini(req);
    if (model === "gpt")    return callVercelGateway(req);

    // auto: priority chain
    if (getAnthropicKey()) {
      try { return await callAnthropic(req); } catch (e: any) { errors.push(`claude: ${e.message}`); }
    }
    if (getGeminiKeys().length) {
      try { return await callGemini(req); } catch (e: any) { errors.push(`gemini: ${e.message}`); }
    }
    try { return await callVercelGateway(req); } catch (e: any) { errors.push(`vercel: ${e.message}`); }

    throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
  },

  health() {
    const geminiKeys = getGeminiKeys();
    return {
      providers: {
        anthropic: !!getAnthropicKey(),
        gemini: geminiKeys.length > 0,
        vercel: !!(process.env.AI_GATEWAY_TOKEN ?? process.env.VERCEL_OIDC_TOKEN),
      },
      gemini_key_pool: geminiKeys.length,
      primary_model: getAnthropicKey() ? "claude-3-5-haiku-20241022" : "gemini-2.0-flash",
    };
  },
};

// ── Express handlers ──────────────────────────────────────────────────────────
export function apexAIRoute(req: Request, res: Response) {
  const { prompt, system, model, maxTokens, temperature } = req.body as AIRequest;
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  apexAI.complete({ prompt, system, model, maxTokens, temperature })
    .then(r => res.json(r))
    .catch((e: Error) => res.status(503).json({ error: e.message, health: apexAI.health() }));
}

export function apexAIHealth(_req: Request, res: Response) {
  res.json({ status: "ok", ...apexAI.health() });
}
