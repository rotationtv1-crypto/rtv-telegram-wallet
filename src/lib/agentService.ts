/**
 * RotationTV — Kimi-Claw Agentic Workflow Service
 * ================================================
 * Autonomous web search + Gemini synthesis pipeline.
 * "Kimi-Claw" = Google Custom Search → context extraction → Gemini grounding.
 *
 * Flow:
 *   1. Decode compact state from Telegram deep link (Base44/urlsafe base64)
 *   2. Execute Google Custom Search for real-time web context
 *   3. Inject search results + user state into Gemini system instructions
 *   4. Return grounded, synthesized response
 *
 * @module agentService
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface AgentEnv {
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;
  GOOGLE_SEARCH_API_KEY?: string;
  GOOGLE_CX_ID?: string;
  TELEGRAM_BOT_TOKEN: string;
}

export interface AgentResponse {
  response: string;
  sources: Array<{ link: string; snippet: string }>;
  search_performed: boolean;
  model: string;
  latency_ms: number;
}

// ─── STATE DECODING ──────────────────────────────────────────────────────────

/**
 * Decode compact state from Telegram deep links.
 * Uses URL-safe base64 (replaces + → -, / → _, strips padding).
 */
export function decodeState(encoded: string | undefined): any {
  if (!encoded || encoded === 'undefined') {
    return { context: 'No historical state passed.' };
  }

  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    return JSON.parse(binary);
  } catch {
    return { context: 'No valid historical state passed.' };
  }
}

/**
 * Encode state to URL-safe base64 for Telegram deep links.
 * tg://resolve?domain=bot&startapp=<encoded_string>
 */
export function encodeState(state: any): string {
  const json = JSON.stringify(state);
  const base64 = btoa(json);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── KIMI-CLAW: GOOGLE CUSTOM SEARCH ──────────────────────────────────────────

interface SearchResult {
  link: string;
  snippet: string;
  title: string;
}

/**
 * Execute Google Custom Search to harvest real-time web context.
 * This is the "Kimi-Claw" crawl step.
 */
export async function executeKimiClawSearch(
  query: string,
  env: AgentEnv
): Promise<{ context: string; sources: SearchResult[] }> {
  if (!env.GOOGLE_SEARCH_API_KEY || !env.GOOGLE_CX_ID) {
    // Fallback: use Gemini's built-in knowledge without web search
    return { context: '', sources: [] };
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_SEARCH_API_KEY}&cx=${env.GOOGLE_CX_ID}&q=${encodeURIComponent(query)}&num=5`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error('Google Search error:', res.status);
      return { context: '', sources: [] };
    }

    const data: any = await res.json();

    if (!data.items || data.items.length === 0) {
      return { context: 'No real-time search context found.', sources: [] };
    }

    const sources: SearchResult[] = data.items.map((item: any) => ({
      link: item.link,
      snippet: item.snippet || '',
      title: item.title || '',
    }));

    const context = sources
      .map((s) => `Source: ${s.link}\nTitle: ${s.title}\nContent: ${s.snippet}`)
      .join('\n\n');

    return { context, sources };
  } catch (err) {
    console.error('Kimi-Claw search failed:', err);
    return { context: 'Failed to fetch real-time data.', sources: [] };
  }
}

// ─── GEMINI INFERENCE ────────────────────────────────────────────────────────

/**
 * Call Gemini API with system instructions + grounded context.
 */
export async function callGemini(
  prompt: string,
  systemInstruction: string,
  env: AgentEnv
): Promise<string> {
  // Rotate between available Gemini keys
  const keys = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2].filter(Boolean);
  if (keys.length === 0) {
    throw new Error('No Gemini API keys available');
  }
  const apiKey = keys[Math.floor(Math.random() * keys.length)];

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
  };

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data: any = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: generation breakdown.';
}

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────────────────────

/**
 * Full Kimi-Claw agentic workflow:
 * 1. Decode state from deep link
 * 2. Web search for real-time context
 * 3. Gemini synthesis with grounding
 *
 * Returns a structured response with sources and metadata.
 */
export async function orchestrateAgenticWorkflow(
  prompt: string,
  encodedState: string | undefined,
  env: AgentEnv
): Promise<AgentResponse> {
  const startTime = Date.now();

  // 1. Decode compact state from Telegram deep link
  const pastContext = decodeState(encodedState);

  // 2. Execute Kimi-Claw web search
  const { context: webContext, sources } = await executeKimiClawSearch(prompt, env);

  // 3. Build system instruction with grounded context
  const systemInstruction = `You are an advanced AI companion running inside a Telegram Mini App for RotationTV Network.
You have access to a real-time web crawler tool ("Kimi-Claw").

${webContext ? `[CRITICAL GROUNDING CONTEXT — LIVE WEB DATA]\n${webContext}\n` : ''}
[USER STATE CONTEXT]
${JSON.stringify(pastContext)}

Rules:
- Synthesize the real-time context to accurately answer the prompt
- Keep responses concise, scannable, and clean for a mobile screen
- If web context contradicts your training, prefer the web context (it's live)
- Format with short paragraphs, no markdown headers
- Maximum 3-4 sentences unless asked for detail`;

  // 4. Call Gemini for synthesis
  const response = await callGemini(prompt, systemInstruction, env);

  return {
    response,
    sources,
    search_performed: sources.length > 0,
    model: 'gemini-2.5-flash',
    latency_ms: Date.now() - startTime,
  };
}
