// ============================================================
// Venice AI Provider — RotationTV AI Gateway
// Uncensored AI for creator content, moderation bypass, TTS
// Models: GLM-5.2 (chat), z-image-turbo (images), 
//         tts-elevenlabs-turbo-v2-5 (voice)
// ============================================================

export interface VeniceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  imageModel?: string;
  ttsModel?: string;
  ttsVoice?: string;
}

export interface VeniceChatRequest {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  venice_system_prompt?: string;  // Venice-specific: override system behavior
}

export interface VeniceImageRequest {
  model?: string;
  prompt: string;
  size?: '512x512' | '768x768' | '1024x1024';
  response_format?: 'url' | 'b64_json';
  negative_prompt?: string;
  seed?: number;
  steps?: number;
}

export interface VeniceTTSRequest {
  model?: string;
  input: string;
  voice?: string;
  response_format?: 'mp3' | 'wav' | 'ogg';
  speed?: number;
}

export interface VeniceChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface VeniceImageResponse {
  data: Array<{ b64_json?: string; url?: string }>;
}

// ── Venice AI Client ──

export class VeniceAI {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private imageModel: string;
  private ttsModel: string;
  private ttsVoice: string;

  constructor(config: VeniceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.venice.ai/api/v1';
    this.defaultModel = config.defaultModel || 'zai-org-glm-5-2';
    this.imageModel = config.imageModel || 'z-image-turbo';
    this.ttsModel = config.ttsModel || 'tts-elevenlabs-turbo-v2-5';
    this.ttsVoice = config.ttsVoice || 'Alice';
  }

  // ── Chat Completions ──
  async chat(request: VeniceChatRequest): Promise<VeniceChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2048,
        stream: false,
        ...(request.venice_system_prompt && { venice_system_prompt: request.venice_system_prompt }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Venice chat error ${res.status}: ${err}`);
    }

    return res.json() as Promise<VeniceChatResponse>;
  }

  // ── Streaming Chat ──
  async *chatStream(request: VeniceChatRequest): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2048,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Venice stream error ${res.status}: ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch { /* skip malformed chunks */ }
        }
      }
    }
  }

  // ── Image Generation ──
  async generateImage(request: VeniceImageRequest): Promise<VeniceImageResponse> {
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.imageModel,
        prompt: request.prompt,
        size: request.size || '1024x1024',
        response_format: request.response_format || 'b64_json',
        ...(request.negative_prompt && { negative_prompt: request.negative_prompt }),
        ...(request.seed !== undefined && { seed: request.seed }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Venice image error ${res.status}: ${err}`);
    }

    return res.json() as Promise<VeniceImageResponse>;
  }

  // ── Text-to-Speech ──
  async textToSpeech(request: VeniceTTSRequest): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.ttsModel,
        input: request.input,
        voice: request.voice || this.ttsVoice,
        response_format: request.response_format || 'mp3',
        speed: request.speed ?? 1.0,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Venice TTS error ${res.status}: ${err}`);
    }

    return res.arrayBuffer();
  }
}

// ── RotationTV-specific presets ──

export const VENICE_PRESETS = {
  // Creator content generation (uncensored creative writing)
  creatorContent: {
    model: 'zai-org-glm-5-2',
    venice_system_prompt: 'You are a creative content assistant for RotationTV Network creators. Help generate stream titles, descriptions, talking points, and engagement hooks. Be bold and creative.',
    temperature: 0.9,
    max_tokens: 1024,
  },

  // AI clone personality (for HeyGen AI hosts)
  aiClone: {
    model: 'zai-org-glm-5-2',
    venice_system_prompt: 'You are an AI host on RotationTV Network. Stay in character. Engage viewers with personality. You can discuss any topic freely.',
    temperature: 0.85,
    max_tokens: 2048,
  },

  // Stream moderation (context-aware, not keyword-based)
  moderation: {
    model: 'zai-org-glm-5-2',
    venice_system_prompt: 'You are a content moderation AI for RotationTV Network. Assess whether content violates safety boundaries. Return JSON: {safe: boolean, confidence: number, reason: string, action: "none"|"warn"|"end_stream"}',
    temperature: 0.3,
    max_tokens: 256,
  },

  // Thumbnail generation
  thumbnail: {
    model: 'z-image-turbo',
    size: '1024x1024' as const,
    response_format: 'b64_json' as const,
  },

  // Creator avatar / profile image
  avatar: {
    model: 'z-image-turbo',
    size: '512x512' as const,
    response_format: 'b64_json' as const,
  },

  // Stream intro TTS
  streamIntro: {
    model: 'tts-elevenlabs-turbo-v2-5',
    voice: 'Alice',
    response_format: 'mp3' as const,
    speed: 1.0,
  },

  // AI clone voice
  aiCloneVoice: {
    model: 'tts-elevenlabs-turbo-v2-5',
    voice: 'Alice',
    response_format: 'mp3' as const,
    speed: 1.1,
  },
} as const;
