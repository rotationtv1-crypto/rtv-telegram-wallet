// ============================================================
// rotationtv-venice-ai-worker
// Cloudflare Worker: Telegram webhook → Venice AI routing
// Handles /ai, /image, /voice, /moderate commands
// ============================================================

export interface Env {
  VENICE_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CF_STREAM_TOKEN: string;
}

// ── Venice API calls ──

async function veniceChat(apiKey: string, messages: Array<{role: string; content: string}>, systemPrompt?: string) {
  const res = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'zai-org-glm-5-2',
      messages,
      temperature: 0.8,
      max_tokens: 2048,
      stream: false,
      ...(systemPrompt && { venice_system_prompt: systemPrompt }),
    }),
  });
  if (!res.ok) throw new Error(`Venice chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function veniceImage(apiKey: string, prompt: string) {
  const res = await fetch('https://api.venice.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'z-image-turbo',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) throw new Error(`Venice image ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json;
}

async function veniceTTS(apiKey: string, text: string, voice: string = 'Alice') {
  const res = await fetch('https://api.venice.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-elevenlabs-turbo-v2-5',
      input: text,
      voice,
      response_format: 'mp3',
      speed: 1,
    }),
  });
  if (!res.ok) throw new Error(`Venice TTS ${res.status}: ${await res.text()}`);
  return await res.arrayBuffer();
}

// ── Telegram API helpers ──

async function sendMessage(botToken: string, chatId: number, text: string, parseMode: string = 'Markdown') {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

async function sendPhoto(botToken: string, chatId: number, b64: string, caption?: string) {
  const buffer = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const blob = new Blob([buffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('photo', blob, 'image.png');
  formData.append('chat_id', chatId.toString());
  if (caption) formData.append('caption', caption);
  await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
}

async function sendVoice(botToken: string, chatId: number, audioBuffer: ArrayBuffer) {
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const formData = new FormData();
  formData.append('voice', blob, 'voice.mp3');
  formData.append('chat_id', chatId.toString());
  await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
    method: 'POST',
    body: formData,
  });
}

// ── Supabase logging ──

async function logAIEvent(supabaseUrl: string, supabaseKey: string, event: {
  user_id: string; command: string; model: string; prompt: string;
  response_preview: string; tokens_used: number; latency_ms: number;
}) {
  await fetch(`${supabaseUrl}/rest/v1/omega_audit_logs`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      actor_id: event.user_id,
      action_type: 'ai_request',
      resource_type: event.command,
      metadata: {
        model: event.model,
        prompt_preview: event.prompt.slice(0, 200),
        response_preview: event.response_preview.slice(0, 200),
        tokens_used: event.tokens_used,
        latency_ms: event.latency_ms,
      },
    }),
  });
}

// ── Command Router ──

interface CommandContext {
  chatId: number;
  userId: string;
  username: string;
  text: string;
  command: string;
  args: string;
}

async function handleCommand(ctx: CommandContext, env: Env): Promise<Response> {
  const start = Date.now();

  try {
    switch (ctx.command) {
      // ── /ai — Chat with Venice GLM-5.2 ──
      case 'ai': {
        if (!ctx.args.trim()) {
          await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
            '🧠 Usage: `/ai <your question>`\n\nAsk anything — I use Venice AI (uncensored).');
          return new Response('ok');
        }

        const response = await veniceChat(env.VENICE_API_KEY, [
          { role: 'user', content: ctx.args }
        ], 'You are RotationTV AI assistant. Be direct, creative, and helpful. No corporate speak.');

        const latency = Date.now() - start;
        await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId, response);

        // Log to Supabase
        await logAIEvent(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
          user_id: ctx.userId, command: '/ai', model: 'zai-org-glm-5-2',
          prompt: ctx.args, response_preview: response.slice(0, 200),
          tokens_used: 0, latency_ms: latency,
        });
        return new Response('ok');
      }

      // ── /image — Generate image with Venice z-image-turbo ──
      case 'image': {
        if (!ctx.args.trim()) {
          await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
            '🎨 Usage: `/image <description>`\n\nGenerates an uncensored image via Venice AI.');
          return new Response('ok');
        }

        await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId, '🎨 Generating...');
        const b64 = await veniceImage(env.VENICE_API_KEY, ctx.args);

        if (b64) {
          await sendPhoto(env.TELEGRAM_BOT_TOKEN, ctx.chatId, b64,
            `🎨 ${ctx.args.slice(0, 100)}`);
        } else {
          await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId, '❌ Image generation failed.');
        }

        const latency = Date.now() - start;
        await logAIEvent(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
          user_id: ctx.userId, command: '/image', model: 'z-image-turbo',
          prompt: ctx.args, response_preview: 'image_b64',
          tokens_used: 0, latency_ms: latency,
        });
        return new Response('ok');
      }

      // ── /voice — TTS with Venice ──
      case 'voice': {
        if (!ctx.args.trim()) {
          await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
            '🎙 Usage: `/voice <text>`\n\nConverts text to speech via Venice AI.');
          return new Response('ok');
        }

        const audioBuffer = await veniceTTS(env.VENICE_API_KEY, ctx.args);
        await sendVoice(env.TELEGRAM_BOT_TOKEN, ctx.chatId, audioBuffer);

        const latency = Date.now() - start;
        await logAIEvent(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
          user_id: ctx.userId, command: '/voice', model: 'tts-elevenlabs-turbo-v2-5',
          prompt: ctx.args, response_preview: 'audio_mp3',
          tokens_used: 0, latency_ms: latency,
        });
        return new Response('ok');
      }

      // ── /moderate — AI content moderation ──
      case 'moderate': {
        if (!ctx.args.trim()) {
          await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
            '🛡 Usage: `/moderate <content>`\n\nAI-powered content assessment.');
          return new Response('ok');
        }

        const response = await veniceChat(env.VENICE_API_KEY, [
          { role: 'user', content: `Assess this content for safety: "${ctx.args}"` }
        ], 'You are a content moderation AI for RotationTV Network. Return JSON only: {safe: boolean, confidence: 0-100, reason: string, action: "none"|"warn"|"end_stream"}');

        await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId, `🛡 Moderation Result:\n\n${response}`);

        const latency = Date.now() - start;
        await logAIEvent(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
          user_id: ctx.userId, command: '/moderate', model: 'zai-org-glm-5-2',
          prompt: ctx.args, response_preview: response.slice(0, 200),
          tokens_used: 0, latency_ms: latency,
        });
        return new Response('ok');
      }

      default:
        await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
          '🧠 Commands: `/ai`, `/image`, `/voice`, `/moderate`');
        return new Response('ok');
    }
  } catch (error: any) {
    console.error('Command error:', error);
    await sendMessage(env.TELEGRAM_BOT_TOKEN, ctx.chatId,
      `❌ Error: ${error.message?.slice(0, 200) || 'Unknown error'}`);
    return new Response('error', { status: 500 });
  }
}

// ── Webhook Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('RotationTV Venice AI Worker — alive', { status: 200 });
    }

    try {
      const update = await request.json() as any;

      // Verify Telegram webhook secret (optional but recommended)
      const message = update?.message;
      if (!message?.text) return new Response('ok');

      const chatId = message.chat.id;
      const userId = message.from?.id?.toString() || 'unknown';
      const username = message.from?.username || 'unknown';
      const text = message.text;

      // Parse command
      const match = text.match(/^\/(ai|image|voice|moderate)(?:@\w+)?\s*(.*)/is);
      if (!match) return new Response('ok');

      const [, command, args] = match;

      return await handleCommand({
        chatId, userId, username, text, command, args: args.trim()
      }, env);

    } catch (error: any) {
      console.error('Webhook error:', error);
      return new Response('error', { status: 500 });
    }
  },
};
