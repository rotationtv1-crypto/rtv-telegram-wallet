// ============================================================
// src/lib/venice.ts — Venice.ai Client for RTV Ecosystem
// Models: GLM-5-2 (chat), z-image-turbo (images), 
//         tts-elevenlabs-turbo-v2-5 (speech)
// ============================================================

const VENICE_BASE = 'https://api.venice.ai/api/v1';

interface VeniceChatOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

interface VeniceImageOptions {
  model?: string;
  size?: '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  responseFormat?: 'url' | 'b64_json';
}

interface VeniceTTSOptions {
  model?: string;
  voice?: string;
  speed?: number;
  responseFormat?: 'mp3' | 'wav' | 'opus';
}

export class VeniceClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ── Chat Completions (GLM-5-2) ──
  async chat(prompt: string, options: VeniceChatOptions = {}) {
    const res = await fetch(`${VENICE_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'zai-org-glm-5-2',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) throw new Error(`Venice chat ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ── Image Generation (z-image-turbo) ──
  async generateImage(prompt: string, options: VeniceImageOptions = {}) {
    const res = await fetch(`${VENICE_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'z-image-turbo',
        prompt,
        size: options.size || '1024x1024',
        response_format: options.responseFormat || 'b64_json',
      }),
    });

    if (!res.ok) throw new Error(`Venice image ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.data?.[0] || null;
  }

  // ── Text-to-Speech (ElevenLabs Turbo v2.5) ──
  async speech(text: string, options: VeniceTTSOptions = {}) {
    const res = await fetch(`${VENICE_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'tts-elevenlabs-turbo-v2-5',
        input: text,
        voice: options.voice || 'Alice',
        response_format: options.responseFormat || 'mp3',
        speed: options.speed ?? 1.0,
      }),
    });

    if (!res.ok) throw new Error(`Venice TTS ${res.status}: ${await res.text()}`);
    return await res.arrayBuffer();
  }

  // ── Convenience: Generate VOD Summary ──
  async summarizeVOD(title: string, category: string, transcript?: string) {
    return this.chat(
      `Summarize this video in 2-3 engaging sentences:\n\nTitle: ${title}\nCategory: ${category}\nContent: ${(transcript || '').slice(0, 4000) || 'No transcript'}`,
      { systemPrompt: 'You are a content summarizer for a streaming platform. Write concise, engaging summaries.', maxTokens: 300 }
    );
  }

  // ── Convenience: Generate Thumbnail Prompt ──
  async thumbnailPrompt(title: string, category: string, mood?: string) {
    return this.chat(
      `Create a thumbnail image prompt for a ${category} stream: "${title}". Mood: ${mood || 'energetic'}. Style: vibrant, eye-catching.`,
      { systemPrompt: 'Write image generation prompts for video thumbnails. Output ONLY the prompt.', maxTokens: 150 }
    );
  }

  // ── Convenience: Detect Mood ──
  async detectMood(title: string, summary: string) {
    const result = await this.chat(
      `Classify mood. Title: ${title}. Summary: ${summary}`,
      { systemPrompt: 'Respond with exactly ONE word: energetic, chill, funny, educational, dramatic, romantic, or hype', maxTokens: 10 }
    );
    return result.toLowerCase().trim().replace(/[^a-z]/g, '');
  }

  // ── Convenience: Moderate Content ──
  async moderateContent(title: string, description: string) {
    const result = await this.chat(
      `Moderate: Title: ${title}. Description: ${description}`,
      { systemPrompt: 'Respond with JSON: {"safe": true/false, "flags": [...], "severity": "none/low/medium/high"}. Flags: violence, sexual, hate, harassment, spam, none.', maxTokens: 150 }
    );
    try {
      const match = result.match(/{.*}/s);
      return match ? JSON.parse(match[0]) : { safe: true, flags: [], severity: 'none' };
    } catch {
      return { safe: true, flags: [], severity: 'none' };
    }
  }
}

// Singleton
let _client: VeniceClient | null = null;

export function getVeniceClient(): VeniceClient {
  if (!_client) {
    const key = import.meta.env.VITE_VENICE_API_KEY;
    if (!key) throw new Error('VITE_VENICE_API_KEY not set');
    _client = new VeniceClient(key);
  }
  return _client;
}
