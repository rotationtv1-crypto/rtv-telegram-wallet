// ============================================================
// rotationtv-ai-gateway/src/index.ts
// Unified AI Gateway — routes to Gemini, Claude, Venice
// RotationTV Network
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '10mb' }));

// ── AI Providers ──

interface AIRequest {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  userId?: string;
  streamId?: string;
}

interface AIResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
}

async function callGemini(req: AIRequest): Promise<AIResponse> {
  const start = Date.now();
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: req.model || 'gemini-2.0-flash' });
  const result = await model.generateContent(req.systemPrompt
    ? `${req.systemPrompt}\n\n${req.prompt}`
    : req.prompt
  );
  return {
    text: result.response.text(),
    model: req.model || 'gemini-2.0-flash',
    provider: 'gemini',
    tokensUsed: result.response.text().length,
    latencyMs: Date.now() - start,
  };
}

async function callClaude(req: AIRequest): Promise<AIResponse> {
  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: req.model || 'claude-sonnet-4-20250514',
      max_tokens: req.maxTokens || 4096,
      system: req.systemPrompt || 'You are a helpful assistant for RotationTV Network.',
      messages: [{ role: 'user', content: req.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.content?.[0]?.text || '',
    model: req.model || 'claude-sonnet-4-20250514',
    provider: 'claude',
    tokensUsed: data.usage?.output_tokens || 0,
    latencyMs: Date.now() - start,
  };
}

async function callVenice(req: AIRequest): Promise<AIResponse> {
  const start = Date.now();
  const res = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: req.model || 'zai-org-glm-5-2',
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens || 4096,
      temperature: req.temperature || 0.8,
    }),
  });
  if (!res.ok) throw new Error(`Venice ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    model: req.model || 'zai-org-glm-5-2',
    provider: 'venice',
    tokensUsed: data.usage?.total_tokens || 0,
    latencyMs: Date.now() - start,
  };
}

// ── Provider Router ──

const PROVIDERS: Record<string, (req: AIRequest) => Promise<AIResponse>> = {
  gemini: callGemini,
  claude: callClaude,
  venice: callVenice,
  'glm-5-2': callVenice,
  'z-image-turbo': callVenice,
};

function routeProvider(model?: string): string {
  if (!model) return 'venice';
  if (model.includes('gemini')) return 'gemini';
  if (model.includes('claude')) return 'claude';
  return 'venice';
}

// ── Ensemble Mode (multi-provider) ──

async function ensemble(req: AIRequest): Promise<{ responses: AIResponse[]; consensus: string }> {
  const providers = ['gemini', 'claude', 'venice'];
  const responses = await Promise.allSettled(
    providers.map(p => PROVIDERS[p](req))
  );
  const successful = responses
    .filter((r): r is PromiseFulfilledResult<AIResponse> => r.status === 'fulfilled')
    .map(r => r.value);

  // Simple consensus: use longest response
  const best = successful.sort((a, b) => b.text.length - a.text.length)[0];
  return {
    responses: successful,
    consensus: best?.text || 'All providers failed',
  };
}

// ── Auth Middleware ──

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

// ── Routes ──

app.get('/health', (_req, res) => {
  res.json({ status: 'alive', uptime: process.uptime(), providers: Object.keys(PROVIDERS) });
});

app.post('/v1/chat', authMiddleware, async (req, res) => {
  try {
    const aiReq: AIRequest = req.body;
    if (!aiReq.prompt) return res.status(400).json({ error: 'prompt required' });

    const provider = routeProvider(aiReq.model);
    const response = await PROVIDERS[provider](aiReq);

    // Log to Supabase
    if (process.env.SUPABASE_URL) {
      fetch(`${process.env.SUPABASE_URL}/rest/v1/OmegaAuditLog`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY!,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          actor_id: aiReq.userId || 'anonymous',
          action_type: 'ai_request',
          resource_type: provider,
          metadata: { model: response.model, tokens: response.tokensUsed, latency: response.latencyMs },
        }),
      }).catch(() => {}); // fire and forget
    }

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message, provider: routeProvider(req.body.model) });
  }
});

app.post('/v1/ensemble', authMiddleware, async (req, res) => {
  try {
    const aiReq: AIRequest = req.body;
    if (!aiReq.prompt) return res.status(400).json({ error: 'prompt required' });
    const result = await ensemble(aiReq);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/v1/image', authMiddleware, async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const start = Date.now();
    const imgRes = await fetch('https://api.venice.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'z-image-turbo',
        prompt,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
    });
    if (!imgRes.ok) throw new Error(`Venice image ${imgRes.status}`);
    const data = await imgRes.json();
    res.json({
      image_b64: data.data?.[0]?.b64_json,
      model: model || 'z-image-turbo',
      provider: 'venice',
      latencyMs: Date.now() - start,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/v1/tts', authMiddleware, async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const start = Date.now();
    const ttsRes = await fetch('https://api.venice.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-elevenlabs-turbo-v2-5',
        input: text,
        voice: voice || 'Alice',
        response_format: 'mp3',
      }),
    });
    if (!ttsRes.ok) throw new Error(`Venice TTS ${ttsRes.status}`);
    const buffer = await ttsRes.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.set('X-Latency-Ms', String(Date.now() - start));
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧠 RotationTV AI Gateway running on :${PORT}`);
  console.log(`   Providers: ${Object.keys(PROVIDERS).join(', ')}`);
});
