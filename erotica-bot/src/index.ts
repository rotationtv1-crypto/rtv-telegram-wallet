// ============================================================
// rotationtv-erotica-bot/src/index.ts
// @RotationtvErotica_Bot — AI Avatar Designer + Cinematic Feed
// Stack: Cloudflare Worker → Venice AI → Supabase
// ============================================================

interface Env {
  VENICE_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_STREAM_TOKEN: string;
  RATE_LIMIT_KV: KVNamespace;
}

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;
const VENICE_API = 'https://api.venice.ai/api/v1';

// ── Telegram Helpers ──

async function sendMessage(env: Env, chatId: number, text: string, replyTo?: number, keyboard?: any) {
  return fetch(`${TELEGRAM_API(env.TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  });
}

async function sendPhoto(env: Env, chatId: number, b64: string, caption?: string) {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('photo', new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'image/png' }), 'avatar.png');
  if (caption) formData.append('caption', caption);
  return fetch(`${TELEGRAM_API(env.TELEGRAM_BOT_TOKEN)}/sendPhoto`, { method: 'POST', body: formData });
}

// ── Supabase Service Role ──

function sbHeaders(env: Env) {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function sbQuery(env: Env, table: string, query: string, method = 'GET', body?: any) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method,
    headers: sbHeaders(env),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`SB ${res.status} on ${table}: ${await res.text()}`);
  return await res.json();
}

// ── Venice AI ──

const AVATAR_STYLES: Record<string, string> = {
  'cinematic': 'Cinematic portrait photography, dramatic lighting, film grain, shallow depth of field, editorial fashion, HBO quality, moody atmosphere',
  'editorial': 'High fashion editorial, studio lighting, Vogue-style composition, clean background, professional retouching',
  'noir': 'Film noir style, high contrast black and white, dramatic shadows, mysterious atmosphere, 1940s aesthetic',
  'cyberpunk': 'Cyberpunk aesthetic, neon lighting, futuristic cityscape, holographic elements, rain-slicked streets',
  'fantasy': 'Dark fantasy, ethereal lighting, mystical elements, ornate details, painterly quality',
  'glamour': 'Glamour photography, soft lighting, luxurious setting, elegant styling, magazine cover quality',
  'street': 'Street photography, urban environment, natural lighting, candid feel, editorial edge',
  'retro': 'Retro 70s/80s aesthetic, warm tones, vintage film look, nostalgic atmosphere',
};

const AVATAR_PROMPTS: Record<string, string> = {
  'female': 'Portrait of a stunning woman, {style}, {features}, {outfit}, {setting}, 8K resolution, photorealistic',
  'male': 'Portrait of a striking man, {style}, {features}, {outfit}, {setting}, 8K resolution, photorealistic',
  'nonbinary': 'Portrait of a striking person, {style}, {features}, {outfit}, {setting}, 8K resolution, photorealistic',
  'anime': 'Anime-style portrait, {style}, {features}, {outfit}, {setting}, detailed illustration, vibrant colors',
  'realistic': 'Hyperrealistic portrait, {style}, {features}, {outfit}, {setting}, 8K resolution, DSLR quality',
};

async function generateAvatar(env: Env, params: AvatarGenParams): Promise<string> {
  const stylePrompt = AVATAR_STYLES[params.style] || AVATAR_STYLES['cinematic'];
  const genderTemplate = AVATAR_PROMPTS[params.gender] || AVATAR_PROMPTS['female'];

  const prompt = genderTemplate
    .replace('{style}', stylePrompt)
    .replace('{features}', params.features || 'elegant features, expressive eyes')
    .replace('{outfit}', params.outfit || 'designer outfit')
    .replace('{setting}', params.setting || 'moody studio backdrop');

  const res = await fetch(`${VENICE_API}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'z-image-turbo',
      prompt,
      negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, watermark, text',
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) throw new Error(`Venice image ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json;
}

// ── Avatar Types ──

interface AvatarGenParams {
  gender: string;
  style: string;
  features?: string;
  outfit?: string;
  setting?: string;
}

interface AvatarSession {
  user_id: string;
  step: 'gender' | 'style' | 'features' | 'outfit' | 'setting' | 'generate';
  params: Partial<AvatarGenParams>;
}

// ── Command Router ──

function parseCommand(text: string): { cmd: string; args: string } | null {
  const match = text.match(/^\/([a-z_]+)\s*(.*)/i);
  if (!match) return null;
  return { cmd: match[1].toLowerCase(), args: match[2].trim() };
}

const GENDER_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '👩 Female', callback_data: 'avatar:gender:female' },
      { text: '👨 Male', callback_data: 'avatar:gender:male' },
    ],
    [
      { text: '🧑 Non-Binary', callback_data: 'avatar:gender:nonbinary' },
      { text: '🎭 Anime', callback_data: 'avatar:gender:anime' },
    ],
    [
      { text: '📷 Realistic', callback_data: 'avatar:gender:realistic' },
    ],
  ],
};

const STYLE_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🎬 Cinematic', callback_data: 'avatar:style:cinematic' },
      { text: '📸 Editorial', callback_data: 'avatar:style:editorial' },
    ],
    [
      { text: '🖤 Noir', callback_data: 'avatar:style:noir' },
      { text: '🔮 Cyberpunk', callback_data: 'avatar:style:cyberpunk' },
    ],
    [
      { text: '🧙 Fantasy', callback_data: 'avatar:style:fantasy' },
      { text: '💎 Glamour', callback_data: 'avatar:style:glamour' },
    ],
    [
      { text: '🏙 Street', callback_data: 'avatar:style:street' },
      { text: '📼 Retro', callback_data: 'avatar:style:retro' },
    ],
  ],
};

// ── Handlers ──

async function handleAvatarCreate(env: Env, chatId: number, userId: number) {
  // Create or reset avatar session
  await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'DELETE');

  await sendMessage(env, chatId,
    '🎨 *Avatar Designer*\n\nChoose your avatar gender/type:',
    undefined, GENDER_KEYBOARD
  );
}

async function handleCallbackQuery(env: Env, body: any) {
  const callback = body.callback_query;
  if (!callback) return;

  const chatId = callback.message?.chat?.id;
  const userId = callback.from?.id;
  const data = callback.data;

  if (!data?.startsWith('avatar:')) {
    await fetch(`${TELEGRAM_API(env.TELEGRAM_BOT_TOKEN)}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callback.id }),
    });
    return;
  }

  const [, action, value] = data.split(':');

  // Get or create session
  let sessions = await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}&select=*`);
  let session: AvatarSession = sessions?.[0] || { user_id: `tg_${userId}`, step: 'gender', params: {} };

  switch (action) {
    case 'gender':
      session.params.gender = value;
      session.step = 'style';
      await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'POST', {
        user_id: `tg_${userId}`,
        step: 'style',
        params: session.params,
      });
      await sendMessage(env, chatId!, `✅ Gender: *${value}*\n\nNow choose your style:`, undefined, STYLE_KEYBOARD);
      break;

    case 'style':
      session.params.style = value;
      session.step = 'features';
      await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'PATCH', {
        step: 'features',
        params: session.params,
      });
      await sendMessage(env, chatId!,
        `✅ Style: *${value}*\n\nNow describe your avatar's features:\n\n_Example: long silver hair, piercing blue eyes, sharp jawline, full lips_`
      );
      break;
  }

  // Acknowledge callback
  await fetch(`${TELEGRAM_API(env.TELEGRAM_BOT_TOKEN)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callback.id }),
  });
}

async function handleAvatarGenerate(env: Env, chatId: number, userId: number, text: string) {
  // Get session
  let sessions = await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}&select=*`);
  let session = sessions?.[0];

  if (!session) {
    await sendMessage(env, chatId, 'Start with /avatar create first');
    return;
  }

  const params = session.params as Partial<AvatarGenParams>;

  // If in features step, save features and ask for outfit
  if (session.step === 'features') {
    params.features = text;
    await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'PATCH', {
      step: 'outfit',
      params,
    });
    await sendMessage(env, chatId,
      `✅ Features saved\n\nDescribe the outfit:\n\n_Example: black leather jacket, silk blouse, gold jewelry_`
    );
    return;
  }

  // If in outfit step, save outfit and ask for setting
  if (session.step === 'outfit') {
    params.outfit = text;
    await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'PATCH', {
      step: 'setting',
      params,
    });
    await sendMessage(env, chatId,
      `✅ Outfit saved\n\nDescribe the setting:\n\n_Example: dimly lit penthouse, rain through window, neon city skyline_`
    );
    return;
  }

  // If in setting step, generate the avatar
  if (session.step === 'setting') {
    params.setting = text;
    await sendMessage(env, chatId, '🎨 Generating your cinematic avatar...');

    try {
      const b64 = await generateAvatar(env, params as AvatarGenParams);

      if (b64) {
        // Save to avatar collection
        await sbQuery(env, 'AvatarCollection', {}, 'POST', {
          user_id: `tg_${userId}`,
          gender: params.gender,
          style: params.style,
          features: params.features,
          outfit: params.outfit,
          setting: params.setting,
          is_public: true,
        });

        await sendPhoto(env, chatId, b64,
          `🎬 *Your ${params.style} Avatar*\nGender: ${params.gender}\nStyle: ${params.style}\n\nUse /avatar create to make another`
        );

        // Clear session
        await sbQuery(env, 'AvatarSession', `user_id=eq.tg_${userId}`, 'DELETE');
      } else {
        await sendMessage(env, chatId, '❌ Generation failed. Try /avatar create again.');
      }
    } catch (err: any) {
      await sendMessage(env, chatId, `❌ Error: ${err.message}`);
    }
    return;
  }

  // Quick generate with defaults
  if (!params.gender || !params.style) {
    await sendMessage(env, chatId, 'Start with /avatar create to set up your avatar first');
    return;
  }

  await sendMessage(env, chatId, '🎨 Generating...');
  const b64 = await generateAvatar(env, params as AvatarGenParams);
  if (b64) {
    await sendPhoto(env, chatId, b64, `🎬 *Your ${params.style} Avatar*`);
  }
}

async function handleFeed(env: Env, chatId: number, offset = 0) {
  const avatars = await sbQuery(env, 'AvatarCollection',
    `is_public=eq.true&select=id,user_id,gender,style,created_at&order=created_at.desc&limit=6&offset=${offset}`);

  if (!avatars?.length) {
    await sendMessage(env, chatId, '📭 No avatars in the feed yet. Be the first with /avatar create!');
    return;
  }

  let feedText = '🎬 *Avatar Feed*\n\n';
  for (const a of avatars) {
    feedText += `• ${a.gender} / ${a.style} — by ${a.user_id}\n`;
  }

  const navKeyboard = {
    inline_keyboard: [
      [
        ...(offset > 0 ? [{ text: '⬅️ Previous', callback_data: `feed:prev:${offset - 6}` }] : []),
        ...(avatars.length === 6 ? [{ text: '➡️ Next', callback_data: `feed:next:${offset + 6}` }] : []),
      ],
    ],
  };

  await sendMessage(env, chatId, feedText, undefined, navKeyboard);
}

async function handleProfile(env: Env, chatId: number, userId: number) {
  const avatars = await sbQuery(env, 'AvatarCollection',
    `user_id=eq.tg_${userId}&select=id,gender,style,created_at&order=created_at.desc&limit=10`);

  if (!avatars?.length) {
    await sendMessage(env, chatId, 'You have no avatars yet. Create one with /avatar create!');
    return;
  }

  let profileText = `👤 *Your Avatar Collection* (${avatars.length})\n\n`;
  for (const a of avatars) {
    profileText += `• ${a.gender} / ${a.style}\n`;
  }

  await sendMessage(env, chatId, profileText);
}

async function handleWallet(env: Env, chatId: number, userId: number) {
  const users = await sbQuery(env, 'profiles', `id=eq.tg_${userId}&select=rtv_balance`);
  if (users?.[0]) {
    await sendMessage(env, chatId, `💰 *$RTV Balance:* ${users[0].rtv_balance || 0}`);
  } else {
    await sendMessage(env, chatId, '💰 No wallet found. Send /start to set up.');
  }
}

async function handleHelp(env: Env, chatId: number) {
  await sendMessage(env, chatId, `🎬 *RotationTV Erotica Bot*

/avatar create — Design your AI avatar
/avatar generate — Quick generate with saved settings
/feed — Browse avatar feed
/profile — Your avatar collection
/wallet — Check $RTV balance
/subscribe — Premium access
/help — Show commands

*Avatar Designer Flow:*
1. /avatar create → Pick gender
2. Pick style (cinematic, noir, etc.)
3. Describe features
4. Describe outfit
5. Describe setting
6. 🎬 AI generates your cinematic portrait`);
}

// ── Main Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.json({ status: 'alive', service: 'rotationtv-erotica-bot', version: '1.0.0' });
    }

    // Telegram webhook
    if (url.pathname === '/telegram/webhook' && request.method === 'POST') {
      try {
        const body = await request.json() as any;

        // Handle callback queries (inline buttons)
        if (body.callback_query) {
          await handleCallbackQuery(env, body);
          return new Response('ok');
        }

        const msg = body?.message;
        if (!msg?.text) return new Response('ok');

        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const text = msg.text;
        const parsed = parseCommand(text);

        if (!parsed) {
          // Free text — might be avatar designer input
          if (text.length > 5) {
            await handleAvatarGenerate(env, chatId, userId, text);
          }
          return new Response('ok');
        }

        const { cmd, args } = parsed;

        switch (cmd) {
          case 'start':
            await sendMessage(env, chatId, '🎬 Welcome to RotationTV Avatar Designer!\n\nUse /avatar create to design your cinematic AI avatar.');
            break;
          case 'avatar':
            if (args === 'create' || args === 'new') {
              await handleAvatarCreate(env, chatId, userId);
            } else if (args === 'generate' || args === 'gen') {
              await handleAvatarGenerate(env, chatId, userId, '');
            } else {
              await sendMessage(env, chatId, 'Usage: /avatar create | /avatar generate');
            }
            break;
          case 'feed':
            await handleFeed(env, chatId, 0);
            break;
          case 'profile':
            await handleProfile(env, chatId, userId);
            break;
          case 'wallet':
            await handleWallet(env, chatId, userId);
            break;
          case 'subscribe':
            await sendMessage(env, chatId, '💎 *Subscription Tiers*\n\n🥈 Silver — 5 avatars/month — 100 $RTV\n🥇 Gold — 20 avatars/month — 500 $RTV\n💎 Diamond — Unlimited — 2000 $RTV\n\nComing soon!');
            break;
          case 'help':
            await handleHelp(env, chatId);
            break;
          default:
            await sendMessage(env, chatId, `Unknown command: /${cmd}\nTry /help`);
        }

        return new Response('ok');
      } catch (err: any) {
        console.error('Webhook error:', err);
        return new Response('error', { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
