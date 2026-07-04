// ============================================================
// rotationtv-cloudflare-workers/src/index.ts
// Telegram Webhook Router + AI Proxy
// Routes: /ai → Venice, /image → z-image-turbo, /voice → TTS
// ============================================================

interface Env {
  VENICE_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  AI_GATEWAY_URL?: string;
  AI_GATEWAY_KEY?: string;
}

const VENICE_BASE = 'https://api.venice.ai/api/v1';
const TELEGRAM_BASE = 'https://api.telegram.org';

// ── Telegram API helpers ──

async function sendMessage(token: string, chatId: number, text: string, replyTo?: number) {
  return fetch(`${TELEGRAM_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
    }),
  });
}

async function sendPhoto(token: string, chatId: number, b64: string, caption?: string) {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('photo', new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'image/png' }), 'image.png');
  if (caption) formData.append('caption', caption);
  return fetch(`${TELEGRAM_BASE}/bot${token}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
}

async function sendVoice(token: string, chatId: number, audioBuffer: ArrayBuffer) {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('voice', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'voice.mp3');
  return fetch(`${TELEGRAM_BASE}/bot${token}/sendVoice`, {
    method: 'POST',
    body: formData,
  });
}

// ── Venice AI ──

async function veniceChat(apiKey: string, prompt: string, systemPrompt?: string) {
  const res = await fetch(`${VENICE_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'zai-org-glm-5-2',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`Venice ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function veniceImage(apiKey: string, prompt: string) {
  const res = await fetch(`${VENICE_BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'z-image-turbo',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) throw new Error(`Venice image ${res.status}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json;
}

async function veniceTTS(apiKey: string, text: string, voice = 'Alice') {
  const res = await fetch(`${VENICE_BASE}/audio/speech`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'tts-elevenlabs-turbo-v2-5',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`Venice TTS ${res.status}`);
  return await res.arrayBuffer();
}

// ── Supabase Audit ──

async function auditLog(env: Env, userId: string, action: string, provider: string, metadata: Record<string, unknown>) {
  if (!env.SUPABASE_URL) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/OmegaAuditLog`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      actor_id: String(userId),
      action_type: action,
      resource_type: provider,
      metadata,
    }),
  }).catch(() => {});
}

// ── Command Router ──

function parseCommand(text: string): { cmd: string; args: string } | null {
  const match = text.match(/^\/([a-z_]+)\s*(.*)/i);
  if (!match) return null;
  return { cmd: match[1].toLowerCase(), args: match[2].trim() };
}

const COMMAND_SYSTEMS: Record<string, string> = {
  ai: 'You are RotationTV AI assistant. Be helpful, creative, and concise. You help with streaming, content creation, and the $RTV ecosystem.',
  image: '',
  voice: '',
  moderate: 'You are a content moderator for RotationTV Network. Rate content 1-10 for safety. Flag anything violent, illegal, or non-consensual. Output JSON: {safe: boolean, score: number, flags: string[], reason: string}',
  wallet: 'You are a $RTV token assistant. Help with balance checks, transfers, and token info.',
  stream: 'You are a live streaming assistant for RotationTV. Help creators set up streams, manage overlays, and engage viewers.',
  help: '',
};

// ── Main Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Health check
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'alive',
        service: 'rotationtv-venice-ai',
        version: '1.0.0',
        endpoints: ['/telegram/webhook', '/health', '/v1/chat', '/v1/image', '/v1/tts'],
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ── Telegram Webhook ──
    if (url.pathname === '/telegram/webhook' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const msg = body?.message;
        if (!msg?.text) return new Response('ok');

        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const text = msg.text;
        const replyTo = msg.message_id;

        const parsed = parseCommand(text);

        if (!parsed) {
          // Not a command — ignore or echo
          return new Response('ok');
        }

        const { cmd, args } = parsed;

        switch (cmd) {
          case 'ai': {
            if (!args) {
              await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /ai <your question>', replyTo);
              break;
            }
            const response = await veniceChat(env.VENICE_API_KEY, args, COMMAND_SYSTEMS.ai);
            // Telegram messages have 4096 char limit
            const chunks = response.match(/.{1,4000}/g) || [response];
            for (const chunk of chunks) {
              await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, chunk, replyTo);
            }
            await auditLog(env, userId, 'ai_request', 'venice', { model: 'glm-5-2', prompt_length: args.length });
            break;
          }

          case 'image': {
            if (!args) {
              await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /image <description>', replyTo);
              break;
            }
            await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, '🎨 Generating...', replyTo);
            const b64 = await veniceImage(env.VENICE_API_KEY, args);
            if (b64) {
              await sendPhoto(env.TELEGRAM_BOT_TOKEN, chatId, b64, `🎨 ${args}`);
            } else {
              await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, '❌ Image generation failed', replyTo);
            }
            await auditLog(env, userId, 'image_gen', 'venice', { model: 'z-image-turbo', prompt: args.slice(0, 200) });
            break;
          }

          case 'voice': {
            if (!args) {
              await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /voice <text to speak>', replyTo);
              break;
            }
            const audioBuffer = await veniceTTS(env.VENICE_API_KEY, args);
            await sendVoice(env.TELEGRAM_BOT_TOKEN, chatId, audioBuffer);
            await auditLog(env, userId, 'tts_request', 'venice', { model: 'tts-elevenlabs', text_length: args.length });
            break;
          }

          case 'moderate': {
            const response = await veniceChat(env.VENICE_API_KEY, args, COMMAND_SYSTEMS.moderate);
            await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, response, replyTo);
            await auditLog(env, userId, 'moderation', 'venice', { content_length: args.length });
            break;
          }

          case 'wallet': {
            // Query Supabase for balance
            if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
              const userRes = await fetch(`${env.SUPABASE_URL}/rest/v1/RtvUser?telegram_id=eq.${userId}&select=rtv_balance,ton_wallet_address`, {
                headers: { 'apikey': env.SUPABASE_SERVICE_KEY },
              });
              const userData = await userRes.json() as any[];
              if (userData?.[0]) {
                await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId,
                  `💰 *$RTV Balance:* ${userData[0].rtv_balance}\n🔗 *TON Wallet:* ${userData[0].ton_wallet_address || 'Not linked'}`,
                  replyTo
                );
              } else {
                await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, '💰 No wallet found. Send /wallet create to set up.', replyTo);
              }
            }
            break;
          }

          case 'help': {
            const helpText = `🧠 *RotationTV Bot Commands*

/ai <question> — Chat with Venice AI (uncensored)
/image <description> — Generate image
/voice <text> — Text to speech
/moderate <content> — AI content moderation
/wallet — Check $RTV balance
/stream — Live stream controls
/help — Show this message

💎 *Subscription:* /subscribe for premium access`;
            await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, helpText, replyTo);
            break;
          }

          default:
            await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, `Unknown command: /${cmd}. Try /help`, replyTo);
        }

        return new Response('ok');
      } catch (err: any) {
        console.error('Webhook error:', err);
        return new Response('error', { status: 500 });
      }
    }

    // ── Direct API Endpoints ──
    if (url.pathname === '/v1/chat' && request.method === 'POST') {
      const { prompt, system } = await request.json() as any;
      const response = await veniceChat(env.VENICE_API_KEY, prompt, system);
      return new Response(JSON.stringify({ text: response, provider: 'venice' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/v1/image' && request.method === 'POST') {
      const { prompt } = await request.json() as any;
      const b64 = await veniceImage(env.VENICE_API_KEY, prompt);
      return new Response(JSON.stringify({ b64_json: b64 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/v1/tts' && request.method === 'POST') {
      const { text, voice } = await request.json() as any;
      const audio = await veniceTTS(env.VENICE_API_KEY, text, voice);
      return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg' } });
    }

    return new Response('Not found', { status: 404 });
  },
};
