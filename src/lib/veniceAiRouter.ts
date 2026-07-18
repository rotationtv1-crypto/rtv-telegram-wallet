/**
 * RotationTV — Venice AI Multi-Key Router
 * ========================================
 * Lightweight load balancer for Venice AI inference across multiple API keys.
 * Rotates keys to distribute rate limit load and maximize availability.
 *
 * NOTE: The main veniceGateway.ts (713 lines) handles full pipeline orchestration
 * (script generation, host context, image gen). This module is the lean
 * inference-only path for direct prompts from Telegram/Mini App.
 *
 * @module veniceAiRouter
 */

export interface VeniceRouterEnv {
  VENICE_API_KEY: string;
  VENICE_API_KEY_2?: string;
  VENICE_API_KEY_3?: string;
}

// Ecosystem context injected into every Venice inference call
const RTV_SYSTEM_CONTEXT = `You are the central intelligence agent for the RotationTV Network ecosystem.
You manage influencer talent operations, handle blockchain (TON/USDC) transactions,
assist with live stream routing, and provide sovereign-precision responses.
You are embedded inside a Telegram Mini App and a Cloudflare Worker edge gateway.
Keep responses concise, mobile-friendly, and actionable.`;

/**
 * Get available Venice keys, filtering out empty/invalid ones
 */
function getActiveKeys(env: VeniceRouterEnv): string[] {
  return [
    env.VENICE_API_KEY,
    env.VENICE_API_KEY_2,
    env.VENICE_API_KEY_3,
  ].filter((k): k is string => Boolean(k) && k.length > 10);
}

/**
 * Execute Venice AI inference with automatic key rotation.
 * Falls back to next key on failure.
 */
export async function handleVeniceInference(
  prompt: string,
  env: VeniceRouterEnv,
  model: string = 'venice-uncensored-1-2'
): Promise<{ text: string; key_used: number; model: string }> {
  const keys = getActiveKeys(env);

  if (keys.length === 0) {
    throw new Error('Venice API keys are not bound to the edge perimeter.');
  }

  const VENICE_API_URL = 'https://api.venice.ai/api/v1/chat/completions';

  const payload = {
    model,
    messages: [
      { role: 'system', content: RTV_SYSTEM_CONTEXT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    max_completion_tokens: 2048,
  };

  // Try each key in rotation until one succeeds
  for (let i = 0; i < keys.length; i++) {
    const keyIndex = Math.floor(Math.random() * keys.length);
    const activeKey = keys[keyIndex];

    try {
      const response = await fetch(VENICE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return {
          text: data.choices?.[0]?.message?.content || 'No response generated.',
          key_used: keyIndex + 1,
          model,
        };
      }

      // If rate limited (429) or auth error (401), try next key
      if (response.status === 429 || response.status === 401) {
        console.warn(`Venice key ${keyIndex + 1} failed (${response.status}), rotating...`);
        continue;
      }

      // Other errors — return the error text
      const errorText = await response.text();
      return {
        text: `Inference error (${response.status}): ${errorText}`,
        key_used: keyIndex + 1,
        model,
      };
    } catch (err) {
      console.warn(`Venice key ${keyIndex + 1} threw:`, err);
      continue;
    }
  }

  throw new Error('All Venice API keys exhausted or failed.');
}

/**
 * List available Venice models (for admin/debugging)
 */
export async function listVeniceModels(env: VeniceRouterEnv): Promise<string[]> {
  const keys = getActiveKeys(env);
  if (keys.length === 0) return [];

  try {
    const response = await fetch('https://api.venice.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${keys[0]}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as any;
    return (data.data || data.models || []).map((m: any) => m.id || m.name);
  } catch {
    return [];
  }
}
