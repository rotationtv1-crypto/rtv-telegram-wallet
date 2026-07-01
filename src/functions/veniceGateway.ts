/**
 * Venice AI Gateway — Uncensored LLM integration for RotationTV Network
 * 
 * Venice AI provides 90 models including uncensored variants:
 *   - venice-uncensored (flagship uncensored model)
 *   - venice-uncensored-role-play (roleplay optimized)
 *   - deepseek-v4-pro, qwen-3-7-max, llama-3.3-70b
 *   - E2EE encrypted variants for privacy-first use cases
 * 
 * OpenAI-compatible API at https://api.venice.ai/api/v1
 * 
 * Use cases in RTV ecosystem:
 *   - Content moderation (uncensored analysis without filters)
 *   - Creator coaching (raw, honest feedback)
 *   - Roleplay features for live streaming
 *   - Code review (alternative to Kimi)
 *   - Private/encrypted AI for sensitive operations
 */

const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// ── Venice models mapped to RTV use cases ──────────────

export const VENICE_MODELS = {
  // Flagship uncensored models
  "venice-uncensored": {
    id: "venice-uncensored",
    name: "Venice Uncensored",
    description: "Flagship uncensored model — no content filters",
    best_for: ["moderation_analysis", "raw_feedback", "unrestricted_qa"],
  },
  "venice-uncensored-1-2": {
    id: "venice-uncensored-1-2",
    name: "Venice Uncensored v1.2",
    description: "Latest uncensored model version",
    best_for: ["moderation_analysis", "raw_feedback"],
  },
  "venice-uncensored-role-play": {
    id: "venice-uncensored-role-play",
    name: "Venice Role Play",
    description: "Uncensored roleplay model for live streaming features",
    best_for: ["roleplay", "character_chat", "stream_interactions"],
  },
  
  // Code & reasoning models
  "deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    description: "Advanced reasoning and code generation",
    best_for: ["code_generation", "architecture", "debugging"],
  },
  "qwen3-coder-480b-a35b-instruct-turbo": {
    id: "qwen3-coder-480b-a35b-instruct-turbo",
    name: "Qwen3 Coder 480B",
    description: "Massive coding model — 480B parameters",
    best_for: ["code_generation", "code_review", "complex_algorithms"],
  },
  "qwen-3-7-max": {
    id: "qwen-3-7-max",
    name: "Qwen 3.7 Max",
    description: "Top-tier general reasoning",
    best_for: ["analysis", "strategy", "ecosystem_insights"],
  },
  
  // General purpose
  "llama-3.3-70b": {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    description: "Meta's Llama 3.3 — reliable general purpose",
    best_for: ["general_qa", "content_generation", "summaries"],
  },
  "mistral-small-3-2-24b-instruct": {
    id: "mistral-small-3-2-24b-instruct",
    name: "Mistral Small 3.2",
    description: "Fast, efficient model for high-volume tasks",
    best_for: ["fast_responses", "bulk_processing", "classification"],
  },
  
  // Encrypted E2EE models (privacy-first)
  "e2ee-venice-uncensored-24b-p": {
    id: "e2ee-venice-uncensored-24b-p",
    name: "E2EE Venice Uncensored",
    description: "End-to-end encrypted uncensored model",
    best_for: ["private_analysis", "secure_operations"],
  },
} as const;

// ── RTV system prompt for Venice ───────────────────────

const RTV_VENICE_SYSTEM_PROMPT = `You are the RTV Venice Agent, part of the RotationTV Network ecosystem — a 9-company Web3 live streaming platform.

You provide uncensored, raw, honest AI analysis for:
- Content moderation (identifying risky content without bias)
- Creator coaching (direct, unfiltered feedback)
- Strategic analysis (no corporate filter on recommendations)
- Code review (brutally honest technical assessment)

Brand: "Learn it. Live it. Love it."
Economic parity: 1 RTV = $0.01 USD
Revenue split: 80% creator, 15% platform, 5% agency

Be direct. Be honest. Be useful. No filler.`;

// ── Chat completion ────────────────────────────────────

export async function veniceChat(
  messages: Array<{ role: string; content: string }>,
  env: any,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
  }
): Promise<any> {
  const model = options?.model || "venice-uncensored";
  const systemPrompt = options?.system_prompt || RTV_VENICE_SYSTEM_PROMPT;
  
  const allMessages = messages[0]?.role === "system"
    ? messages
    : [{ role: "system", content: systemPrompt }, ...messages];

  const body: any = {
    model,
    messages: allMessages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 4096,
  };

  const apiKey = env.VENICE_API_KEY || env.VENICE_API_KEY_2 || env.VENICE_API_KEY_3;
  if (!apiKey) {
    throw new Error("No Venice API key configured. Set VENICE_API_KEY in secrets.");
  }

  const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    const status = response.status;
    
    // Handle credit exhaustion — try fallback keys
    if (error.includes("Insufficient") && env.VENICE_API_KEY_2 && apiKey !== env.VENICE_API_KEY_2) {
      const fallbackResponse = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.VENICE_API_KEY_2}`,
        },
        body: JSON.stringify(body),
      });
      if (fallbackResponse.ok) {
        return await fallbackResponse.json();
      }
    }
    if (error.includes("Insufficient") && env.VENICE_API_KEY_3) {
      const fallbackResponse = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.VENICE_API_KEY_3}`,
        },
        body: JSON.stringify(body),
      });
      if (fallbackResponse.ok) {
        return await fallbackResponse.json();
      }
    }
    
    throw new Error(`Venice API error ${status}: ${error}`);
  }

  return await response.json();
}

// ── Content moderation (uncensored analysis) ───────────

export async function veniceModeration(
  content: string,
  streamTitle: string,
  env: any
): Promise<{
  risk_level: "safe" | "warning" | "dangerous";
  categories: string[];
  recommendation: string;
  confidence: number;
}> {
  const response = await veniceChat([
    {
      role: "user",
      content: `Analyze this live stream content for risk. Be completely uncensored in your assessment.
Return JSON: {risk_level: "safe"|"warning"|"dangerous", categories: [], recommendation: "", confidence: 0-100}

Stream title: "${streamTitle}"
Content/transcript: "${content}"`,
    },
  ], env, {
    model: "venice-uncensored",
    temperature: 0.2,
    system_prompt: "You are an uncensored content safety analyzer. Assess risk without bias or over-caution. Return only JSON.",
  });

  try {
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}
  
  return {
    risk_level: "safe",
    categories: [],
    recommendation: "Unable to analyze — default to safe",
    confidence: 0,
  };
}

// ── Creator coaching (raw feedback) ────────────────────

export async function veniceCreatorCoach(
  creatorData: any,
  env: any
): Promise<string> {
  const response = await veniceChat([
    {
      role: "user",
      content: `Give brutally honest, uncensored coaching to this live stream creator.
Tell them what they're doing wrong and what to fix. No sugar-coating.

Creator data:
${JSON.stringify(creatorData, null, 2)}`,
    },
  ], env, {
    model: "venice-uncensored",
    temperature: 0.6,
  });

  return response.choices[0].message.content;
}

// ── Code review (brutally honest) ──────────────────────

export async function veniceCodeReview(
  code: string,
  filename: string,
  language: string,
  env: any
): Promise<{
  issues: Array<{ severity: string; line: number; message: string }>;
  score: number;
  summary: string;
}> {
  const response = await veniceChat([
    {
      role: "user",
      content: `Review this ${language} code from ${filename}. Be brutally honest. Find every bug, security issue, and code smell.
Return JSON: {issues: [{severity, line, message}], score: 0-100, summary: ""}

\`\`\`${language}
${code}
\`\`\``,
    },
  ], env, {
    model: "deepseek-v4-pro",
    temperature: 0.3,
    system_prompt: "You are a brutally honest code reviewer. No compliments. Only problems and fixes. Return only JSON.",
  });

  try {
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}
  
  return {
    issues: [],
    score: 0,
    summary: response.choices[0].message.content,
  };
}

// ── Main handler (Base44 backend function) ─────────────

export async function handler(request: Request, env: any): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path.endsWith("/health") || path.endsWith("/venice/health")) {
    const apiKey = env.VENICE_API_KEY || env.VENICE_API_KEY_2 || env.VENICE_API_KEY_3;
    return Response.json({
      success: true,
      provider: "venice-ai",
      api_connected: !!apiKey,
      models_available: Object.keys(VENICE_MODELS).length,
      models: Object.keys(VENICE_MODELS),
      status: apiKey ? "ready" : "no_api_key",
    }, { headers: corsHeaders });
  }

  // List models
  if (path.endsWith("/models") || path.endsWith("/venice/models")) {
    return Response.json({
      success: true,
      models: VENICE_MODELS,
    }, { headers: corsHeaders });
  }

  // Chat completion
  if (path.endsWith("/chat") || path.endsWith("/venice/chat")) {
    try {
      const { messages, model, temperature, max_tokens, system_prompt } = await request.json();
      const result = await veniceChat(messages, env, { model, temperature, max_tokens, system_prompt });
      return Response.json({ success: true, ...result }, { headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  // Moderation
  if (path.endsWith("/moderate") || path.endsWith("/venice/moderate")) {
    try {
      const { content, streamTitle } = await request.json();
      const result = await veniceModeration(content, streamTitle || "", env);
      return Response.json({ success: true, ...result }, { headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  // Creator coaching
  if (path.endsWith("/coach") || path.endsWith("/venice/coach")) {
    try {
      const { creatorData } = await request.json();
      const coaching = await veniceCreatorCoach(creatorData, env);
      return Response.json({ success: true, coaching }, { headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  // Code review
  if (path.endsWith("/review") || path.endsWith("/venice/review")) {
    try {
      const { code, filename, language } = await request.json();
      const review = await veniceCodeReview(code, filename, language, env);
      return Response.json({ success: true, review }, { headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }

  return Response.json({
    error: "Unknown endpoint",
    endpoints: ["/health", "/models", "/chat", "/moderate", "/coach", "/review"],
  }, { status: 404, headers: corsHeaders });
}