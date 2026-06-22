/**
 * rtv-ai-gateway.ts
 * APEX AI Gateway — unified AI client for all RTV ecosystem services
 * 
 * Priority:   1. Anthropic Claude (claude-3-5-haiku-20241022)
 *             2. Gemini 2.0 Flash (gemini-2.0-flash — per APEX config)
 *             3. Vercel AI Gateway (openai/gpt-4o — fallback)
 * 
 * Usage:
 *   import { apexAI } from './rtv-ai-gateway'
 *   const reply = await apexAI.complete({ prompt: "...", model: "auto" })
 */

import type { Request, Response } from "express";

// ── Types ──────────────────────────────────────────────────────────────────────
export type AIModel = "auto" | "claude" | "gemini" | "gpt";

export interface AIRequest {
  prompt: string;
  system?: string;
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: "anthropic" | "gemini" | "vercel-gateway";
  tokens?: { input: number; output: number };
}

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  anthropic: {
    key: process.env.ANTHROPIC_API_KEY ?? "",
    model: "claude-3-5-haiku-20241022",
    url: "https://api.anthropic.com/v1/messages",
  },
  gemini: {
    key: process.env.GEMINI_API_KEY ?? "",
    model: "gemini-2.0-flash",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  },
  vercel: {
    key: process.env.AI_GATEWAY_TOKEN ?? process.env.VERCEL_OIDC_TOKEN ?? "",
    model: "openai/gpt-4o",
    url: "https://ai-gateway.vercel.sh/v1/chat/completions",
  },
};

// ── Anthropic client ──────────────────────────────────────────────────────────
async function callAnthropic(req: AIRequest): Promise<AIResponse> {
  const body = {
    model: CONFIG.anthropic.model,
    max_tokens: req.maxTokens ?? 1024,
    system: req.system ?? "You are APEX, the AI assistant for RotationTV Network. Be concise and helpful.",
    messages: [{ role: "user", content: req.prompt }],
  };

  const res = await fetch(CONFIG.anthropic.url, {
    method: "POST",
    headers: {
      "x-api-key": CONFIG.anthropic.key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json() as any;
  return {
    text: data.content?.[0]?.text ?? "",
    model: data.model,
    provider: "anthropic",
    tokens: { input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 },
  };
}

// ── Gemini client ─────────────────────────────────────────────────────────────
async function callGemini(req: AIRequest): Promise<AIResponse> {
  const body = {
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig: {
      maxOutputTokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    },
    ...(req.system ? {
      systemInstruction: { parts: [{ text: req.system }] }
    } : {}),
  };

  const url = `${CONFIG.gemini.url}?key=${CONFIG.gemini.key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return {
    text,
    model: CONFIG.gemini.model,
    provider: "gemini",
    tokens: {
      input: data.usageMetadata?.promptTokenCount ?? 0,
      output: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

// ── Vercel AI Gateway client ──────────────────────────────────────────────────
async function callVercelGateway(req: AIRequest): Promise<AIResponse> {
  const body = {
    model: CONFIG.vercel.model,
    max_tokens: req.maxTokens ?? 1024,
    messages: [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      { role: "user", content: req.prompt },
    ],
  };

  const res = await fetch(CONFIG.vercel.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CONFIG.vercel.key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel Gateway ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json() as any;
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    model: data.model,
    provider: "vercel-gateway",
    tokens: { input: data.usage?.prompt_tokens ?? 0, output: data.usage?.completion_tokens ?? 0 },
  };
}

// ── Auto-routing logic ────────────────────────────────────────────────────────
export const apexAI = {
  async complete(req: AIRequest): Promise<AIResponse> {
    const model = req.model ?? "auto";
    const errors: string[] = [];

    // Explicit model selection
    if (model === "claude" && CONFIG.anthropic.key) return callAnthropic(req);
    if (model === "gemini" && CONFIG.gemini.key)    return callGemini(req);
    if (model === "gpt"    && CONFIG.vercel.key)    return callVercelGateway(req);

    // Auto: try in priority order
    if (CONFIG.anthropic.key) {
      try { return await callAnthropic(req); } catch (e: any) { errors.push(`claude: ${e.message}`); }
    }
    if (CONFIG.gemini.key) {
      try { return await callGemini(req); } catch (e: any) { errors.push(`gemini: ${e.message}`); }
    }
    if (CONFIG.vercel.key) {
      try { return await callVercelGateway(req); } catch (e: any) { errors.push(`vercel: ${e.message}`); }
    }

    throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
  },

  /** Available providers based on env vars */
  providers(): string[] {
    const p: string[] = [];
    if (CONFIG.anthropic.key) p.push(`anthropic/${CONFIG.anthropic.model}`);
    if (CONFIG.gemini.key)    p.push(`google/${CONFIG.gemini.model}`);
    if (CONFIG.vercel.key)    p.push(`vercel-gateway/${CONFIG.vercel.model}`);
    return p;
  },
};

// ── Express route handler ─────────────────────────────────────────────────────
export function apexAIRoute(req: Request, res: Response) {
  const { prompt, system, model, maxTokens, temperature } = req.body as AIRequest;

  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  apexAI.complete({ prompt, system, model, maxTokens, temperature })
    .then((result) => res.json(result))
    .catch((err: Error) => {
      console.error("[APEX AI]", err.message);
      res.status(503).json({ error: err.message, providers: apexAI.providers() });
    });
}

// ── Health check export ───────────────────────────────────────────────────────
export function apexAIHealth() {
  return {
    providers: apexAI.providers(),
    primary: CONFIG.anthropic.key ? "anthropic" : CONFIG.gemini.key ? "gemini" : "none",
    models: {
      anthropic: CONFIG.anthropic.model,
      gemini: CONFIG.gemini.model,
      vercel: CONFIG.vercel.model,
    },
  };
}
