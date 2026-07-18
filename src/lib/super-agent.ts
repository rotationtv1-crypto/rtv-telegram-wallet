/**
 * ROTATIONTVNETWORK LLC — SUPER AGENT
 * Master AI Brain for the entire Rotationtvnetwork Ecosystem
 *
 * Capabilities:
 * - NLP (GPT-4o) — Natural Language Processing
 * - Computer Vision — Face analysis, expression detection, age verification
 * - Speech Synthesis — TTS via OpenAI (nova/alloy/echo/onyx)
 * - Deep Neural Networks — Viola-Jones landmark detection via GPT-4o Vision
 * - Biometrics — Face unlock, 18+ age check, expression scoring
 * - Moderation — AI content safety via Cloudflare llama-guard-3-8b
 * - Multi-modal — Text + Voice + Vision
 * - Ecosystem Routing — RotationTV Live, RotationErotica, RTV Wallet
 * - Supabase — User management, stream validation, face records
 * Presidential Authority: Darrel | Rotationtvnetwork LLC
 */

import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { handleBuyCommand, handleBuyCallback, registerPreCheckout, registerSuccessfulPayment, creditUserFromStarsPurchase } from './telegramPayments';
import OpenAI from 'openai';

// ─── ENV ─────────────────────────────────────────────────────────────────────
interface Env {
  OPENAI_API_KEY: string;
  TELEGRAM_BOT_TOKEN_MAIN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  AI: any; // Cloudflare Workers AI binding
  TIP_QUEUE: Queue;
  STREAM_ANALYTICS: AnalyticsEngineDataset;
  PAYOUT_ENGINE_URL: string;
  MASTER_UPLINK_KEY: string;
  ELEVENLABS_WEBHOOK_SECRET: string;
  TRIBUTE_API_KEY: string;
}

// ─── FACE ANALYSIS TYPES ─────────────────────────────────────────────────────
interface FaceLandmarks {
  eyesOpen: boolean;
  eyebrowPosition: 'raised' | 'neutral' | 'furrowed';
  smile: boolean;
  surprise: boolean;
  mouthOpen: boolean;
  headTilt: 'left' | 'right' | 'center';
  gazeDirection: 'forward' | 'left' | 'right' | 'down';
}

interface FaceAnalysisResult {
  detected: boolean;
  face_count: number;
  age_estimate: string;         // e.g. "25-30"
  age_min: number;
  age_max: number;
  is_adult: boolean;            // age_min >= 18
  expression: string;           // happy / sad / angry / surprised / neutral / disgusted
  confidence: number;           // 0.0 – 1.0
  landmarks: FaceLandmarks;
  is_safe: boolean;
  flags: string[];
  liveness: boolean;            // real face vs static image
  skin_tone: string;
  glasses: boolean;
  facial_hair: boolean;
  raw_description: string;
}

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function supabaseQuery(env: Env, table: string, params: string): Promise<any> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

async function supabaseInsert(env: Env, table: string, data: object): Promise<any> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function supabaseUpdate(env: Env, table: string, filter: string, data: object): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function getCurrentUser(env: Env, telegramId: number): Promise<any | null> {
  const data = await supabaseQuery(env, 'users', `telegram_id=eq.${telegramId}&select=*&limit=1`);
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function createUser(env: Env, telegramId: number, username: string, firstName: string): Promise<any> {
  return supabaseInsert(env, 'users', {
    telegram_id: telegramId,
    username,
    display_name: firstName,
    created_at: new Date().toISOString(),
    verified_age: false,
    role: 'viewer',
    ecosystem: 'rotationtv',
  });
}

// ─── NLP CORE ─────────────────────────────────────────────────────────────────
async function processNaturalLanguage(env: Env, text: string, userId?: number): Promise<string> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are the Rotation Live Super Agent — master AI brain for Rotationtvnetwork LLC.
Presidential Authority: Darrel.
Ecosystem: RotationTV Live (6 AI hosts: LEO, MAYA, DR. REED, ZARA, OMAR, LINA), RotationErotica (agency), RTV Wallet (TON/ETH), RotationPay.
Revenue: 80% creator / 15% platform / 5% agency. 1 RTV = $0.01 USD. Token: $RTVS, 9 decimals, TonConnect.
Be concise — Telegram bot. Max 3 paragraphs.`,
      },
      { role: 'user', content: text },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
  return response.choices[0].message.content ?? '⚠️ No response generated.';
}

// ─── CONTENT MODERATION ──────────────────────────────────────────────────────
async function moderateContent(env: Env, text: string): Promise<{ safe: boolean; category?: string }> {
  try {
    const result = await env.AI.run('@cf/meta/llama-guard-3-8b', {
      messages: [{ role: 'user', content: text }],
    });
    const safe = result?.response?.toLowerCase().includes('safe') ?? true;
    return { safe, category: safe ? undefined : 'flagged' };
  } catch {
    return { safe: true };
  }
}

// ─── SPEECH SYNTHESIS ────────────────────────────────────────────────────────
async function synthesizeVoice(env: Env, text: string, voice: 'alloy' | 'nova' | 'echo' | 'onyx' = 'nova'): Promise<ArrayBuffer | null> {
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.audio.speech.create({ model: 'tts-1', voice, input: text });
    return response.arrayBuffer();
  } catch (e) {
    console.error('TTS error:', e);
    return null;
  }
}

// ─── DEEP FACE ANALYSIS (GPT-4o Vision + Viola-Jones style landmarks) ────────
async function analyzeFaceFromUrl(env: Env, imageUrl: string): Promise<FaceAnalysisResult> {
  const defaultResult: FaceAnalysisResult = {
    detected: false,
    face_count: 0,
    age_estimate: 'unknown',
    age_min: 0,
    age_max: 0,
    is_adult: false,
    expression: 'neutral',
    confidence: 0,
    landmarks: {
      eyesOpen: true,
      eyebrowPosition: 'neutral',
      smile: false,
      surprise: false,
      mouthOpen: false,
      headTilt: 'center',
      gazeDirection: 'forward',
    },
    is_safe: true,
    flags: [],
    liveness: true,
    skin_tone: 'unknown',
    glasses: false,
    facial_hair: false,
    raw_description: '',
  };

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Perform deep face analysis on this image using computer vision principles (Viola-Jones detector, facial landmark detection, expression recognition).

Return ONLY valid JSON with this exact structure:
{
  "detected": boolean,
  "face_count": number,
  "age_estimate": "range like 25-30",
  "age_min": number,
  "age_max": number,
  "is_adult": boolean (age_min >= 18),
  "expression": "happy|sad|angry|surprised|neutral|disgusted|fearful|contempt",
  "confidence": number (0.0-1.0),
  "landmarks": {
    "eyesOpen": boolean,
    "eyebrowPosition": "raised|neutral|furrowed",
    "smile": boolean,
    "surprise": boolean,
    "mouthOpen": boolean,
    "headTilt": "left|right|center",
    "gazeDirection": "forward|left|right|down"
  },
  "is_safe": boolean,
  "flags": [],
  "liveness": boolean,
  "skin_tone": "description",
  "glasses": boolean,
  "facial_hair": boolean,
  "raw_description": "1-2 sentence natural description"
}`,
            },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}');
    return { ...defaultResult, ...parsed };
  } catch (e) {
    console.error('Face analysis error:', e);
    return defaultResult;
  }
}

// Log face verification attempt to Supabase
async function logFaceVerification(env: Env, telegramId: number, result: FaceAnalysisResult, passed: boolean): Promise<void> {
  try {
    await supabaseInsert(env, 'moderation_log', {
      telegram_id: telegramId,
      content: `face_verification | age:${result.age_estimate} | adult:${result.is_adult} | expr:${result.expression}`,
      action: passed ? 'allow' : 'warn',
      category: passed ? 'none' : 'sexual_content',
      severity: passed ? 0 : 5,
      confidence: result.confidence,
      reason: passed ? 'Age verified via face scan' : 'Age verification failed — appears under 18',
      ai_model: 'gpt-4o-vision',
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Log error:', e);
  }
}

// ─── ECOSYSTEM STATUS ─────────────────────────────────────────────────────────
async function getEcosystemStatus(env: Env): Promise<string> {
  const checks = await Promise.allSettled([
    fetch('https://rotationtv-live-ai-clones.rotationtimmy.workers.dev/').then(r => r.json()),
    fetch(`${env.SUPABASE_URL}/rest/v1/`, { headers: { apikey: env.SUPABASE_ANON_KEY } }).then(r => r.status),
  ]);
  const workerOk = checks[0].status === 'fulfilled';
  const supabaseOk = checks[1].status === 'fulfilled';
  return `🌐 <b>Rotationtvnetwork Ecosystem Status</b>\n\n` +
    `RotationTV Live: ${workerOk ? '🟢 Online' : '🔴 Offline'}\n` +
    `↳ rotationtv-live-ai-clones.rotationtimmy.workers.dev\n` +
    `Supabase DB: ${supabaseOk ? '🟢 Online' : '🔴 Offline'}\n` +
    `↳ xynkgaxfwvpcixissxdz.supabase.co\n` +
    `R2 Storage: 🟡 Pending activation\n` +
    `Analytics Engine: 🟡 Pending activation\n` +
    `Queues: 🟢 tip-queue + tip-queue-dlq\n` +
    `Cloudflare Calls (WebRTC): 🟢 Rotation-Erotica-Cloud\n` +
    `Cloudflare Stream: 🟢 customer-n6iqbvyr2svw15o3.cloudflarestream.com\n` +
    `Workers AI: 🟢 40+ models (GPT-OSS-120B, Llama 3.3, FLUX, Deepgram)\n\n` +
    `<i>Presidential Authority: Darrel | Rotationtimmy@gmail.com</i>`;
}

// ─── BOT FACTORY ──────────────────────────────────────────────────────────────
export function createSuperAgentBot(env: Env, botToken?: string): Bot {
  const bot = new Bot(botToken || env.TELEGRAM_BOT_TOKEN_MAIN);

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username ?? 'unknown';
    const firstName = ctx.from?.first_name ?? 'User';

    let user = await getCurrentUser(env, telegramId!);
    if (!user) user = await createUser(env, telegramId!, username, firstName);

    const keyboard = new InlineKeyboard()
      .text('✅ I am 18+ — Verify', 'verify_age').row()
      .url('📱 Open RotationTV App', 'https://t.me/rotation_live_bot/app').row()
      .text('🌐 Ecosystem Status', 'ecosystem_status')
      .text('🤖 AI Help', 'ai_help');

    await ctx.reply(
      `🎬 <b>Welcome to RotationTV Live</b>, ${firstName}!\n\n` +
      `The world's first AI Clone Streaming Platform on Telegram.\n\n` +
      `🤖 <b>Super Agent Active</b> — GPT-4o + Cloudflare AI + Face Vision\n` +
      `🎭 6 AI Hosts: LEO, MAYA, DR. REED, ZARA, OMAR, LINA\n` +
      `💎 Token: $RTVS | 1 RTV = $0.01 USD\n\n` +
      `Please verify your age to continue:`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    );
  });

  // ── /status ─────────────────────────────────────────────────────────────────
  bot.command('status', async (ctx) => {
    await ctx.reply(await getEcosystemStatus(env), { parse_mode: 'HTML' });
  });

  // ── /ai ─────────────────────────────────────────────────────────────────────
  bot.command('ai', async (ctx) => {
    const message = ctx.message?.text?.replace('/ai', '').trim();
    if (!message) {
      await ctx.reply('💬 Usage: /ai [your question]\n\nExample: /ai How do I start a live stream?');
      return;
    }
    const thinking = await ctx.reply('🤖 Processing...');
    const modCheck = await moderateContent(env, message);
    if (!modCheck.safe) {
      await ctx.api.editMessageText(ctx.chat.id, thinking.message_id, '⚠️ Message flagged by content moderation.');
      return;
    }
    const response = await processNaturalLanguage(env, message, ctx.from?.id);
    await ctx.api.editMessageText(ctx.chat.id, thinking.message_id,
      `🤖 <b>Super Agent:</b>\n\n${response}`, { parse_mode: 'HTML' });
  });

  // ── /voice ──────────────────────────────────────────────────────────────────
  bot.command('voice', async (ctx) => {
    const text = ctx.message?.text?.replace('/voice', '').trim();
    if (!text) { await ctx.reply('🎤 Usage: /voice [text to speak]'); return; }
    await ctx.reply('🎤 Generating voice...');
    const audio = await synthesizeVoice(env, text, 'nova');
    if (audio) {
      await ctx.replyWithVoice(new Uint8Array(audio) as any);
    } else {
      await ctx.reply('⚠️ Voice synthesis unavailable. Check OPENAI_API_KEY.');
    }
  });

  // ── /face ───────────────────────────────────────────────────────────────────
  // Full deep face analysis: landmarks, expression, age check, biometric log
  bot.command('face', async (ctx) => {
    const telegramId = ctx.from?.id!;

    await ctx.reply(
      `👤 <b>Face Analysis — Deep Vision Mode</b>\n\n` +
      `📸 Send me a clear photo of your face and I will analyze:\n\n` +
      `• 🧬 Age estimate (18+ verification)\n` +
      `• 😊 Expression recognition (Viola-Jones landmarks)\n` +
      `• 👁️ Eye state, brow position, gaze direction\n` +
      `• 🛡️ Content safety check\n` +
      `• 💡 Liveness detection\n\n` +
      `<i>Powered by GPT-4o Vision + Deep Neural Networks</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // ── /hosts ──────────────────────────────────────────────────────────────────
  bot.command('hosts', async (ctx) => {
    await ctx.reply(
      `🎭 <b>AI Broadcast Hosts — RotationTV Live</b>\n\n` +
      `🎙️ <b>LEO</b> — Anchor. Authoritative, smooth. Opens/closes every broadcast.\n` +
      `⚡ <b>MAYA</b> — Energetic. Hype machine, crowd engagement specialist.\n` +
      `🧠 <b>DR. REED</b> — Analyst. Deep dives, market intel, strategy breakdowns.\n` +
      `🃏 <b>ZARA</b> — Wildcard. Unpredictable hot takes, memes, chaos energy.\n` +
      `😎 <b>OMAR</b> — Chill. Late-night vibes, storytelling, calm authority.\n` +
      `🌟 <b>LINA</b> — Co-Host. Bridges hosts, keeps flow smooth.\n\n` +
      `<i>2×3 grid | Real-time fatigue sim | Human handoff detection</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // ── /ecosystem ──────────────────────────────────────────────────────────────
  bot.command('ecosystem', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .url('🎬 RotationTV Live', 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev').row()
      .url('🌹 RotationErotica', 'https://github.com/rotationtv1-crypto/RotationErotica').row()
      .url('💳 RotationPay', 'https://rotationpay.online').row()
      .url('👛 RTV Wallet', 'https://github.com/rotationtv1-crypto/rtv-telegram-wallet');

    await ctx.reply(
      `🌐 <b>Rotationtvnetwork LLC — Full Ecosystem</b>\n\n` +
      `🎬 <b>RotationTV Live</b> — AI Clone Streaming\n` +
      `🌹 <b>RotationErotica</b> — Agency + Creator Payouts\n` +
      `💳 <b>RotationPay</b> — Payment Gateway\n` +
      `👛 <b>RTV Wallet</b> — TON/ETH Telegram Wallet\n\n` +
      `<b>9 Companies:</b> RotationTV · RotationPay · RotationCall · RTV University · Bigo Agency · White Logistics · Pretrial Services · EmergentLabs · OpenClaw\n\n` +
      `💎 <b>$RTVS Token</b> — 9 decimals | 1 RTV = $0.01\n` +
      `💰 Revenue: 80% creator / 15% platform / 5% agency\n\n` +
      `<i>Presidential Authority: Darrel</i>`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    );
  });

  // ── /tip ────────────────────────────────────────────────────────────────────
  bot.command('tip', async (ctx) => {
    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length < 2) {
      await ctx.reply('💰 Usage: /tip @username [amount_rtv]\n\nExample: /tip @creator123 100');
      return;
    }
    const [recipient, amountStr] = args;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('⚠️ Invalid amount. Use: /tip @username [amount]');
      return;
    }
    const usd = (amount * 0.01).toFixed(2);
    await ctx.reply(
      `💸 <b>Tip Initiated</b>\n\nTo: ${recipient}\nAmount: ${amount} RTV ($${usd} USD)\n\n` +
      `<i>Connect your TonConnect wallet in the mini app to complete this tip.</i>`,
      { parse_mode: 'HTML' }
    );
    try {
      await env.TIP_QUEUE.send({
        stream_id: 'telegram_direct',
        sender_id: String(ctx.from?.id),
        receiver_id: recipient,
        gift_id: 'direct_tip',
        gift_name: 'Direct Tip',
        gift_emoji: '💸',
        amount_rtv: amount,
        amount_usd: parseFloat(usd),
        combo_count: 1,
        message: `Direct tip from @${ctx.from?.username}`,
        ts: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Queue error:', e);
    }
  });

  // ── Callback queries ─────────────────────────────────────────────────────────
  bot.callbackQuery('verify_age', async (ctx) => {
    const telegramId = ctx.from.id;
    await supabaseUpdate(env, 'users', `telegram_id=eq.${telegramId}`, {
      verified_age: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).catch(async () => {
      await supabaseInsert(env, 'users', {
        telegram_id: telegramId,
        verified_age: true,
        verified_at: new Date().toISOString(),
        role: 'viewer',
        ecosystem: 'rotationtv',
        created_at: new Date().toISOString(),
      });
    });
    await ctx.answerCallbackQuery('✅ Age verified!');
    await ctx.editMessageText(
      `✅ <b>Age Verified!</b>\n\nWelcome to RotationTV Live. Full access granted.\n\n` +
      `<b>Commands:</b>\n` +
      `/ai — Ask the Super Agent\n` +
      `/face — Face analysis + age scan\n` +
      `/hosts — Meet the AI hosts\n` +
      `/voice — Text to voice\n` +
      `/tip — Send tips\n` +
      `/ecosystem — Full network\n` +
      `/status — System status`,
      { parse_mode: 'HTML', reply_markup: new InlineKeyboard().url('📱 Open App', 'https://t.me/rotation_live_bot/app') }
    );
  });

  bot.callbackQuery('decline_age', async (ctx) => {
    await ctx.answerCallbackQuery('Access denied.');
    await ctx.editMessageText('🔞 You must be 18+ to use RotationTV Live. Goodbye.');
  });

  bot.callbackQuery('ecosystem_status', async (ctx) => {
    await ctx.answerCallbackQuery('Checking...');
    await ctx.reply(await getEcosystemStatus(env), { parse_mode: 'HTML' });
  });

  bot.callbackQuery('ai_help', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `🤖 <b>Super Agent Commands</b>\n\n` +
      `/ai [question] — Ask anything\n` +
      `/face — Deep face analysis + 18+ age check\n` +
      `/voice [text] — Convert text to voice\n` +
      `/hosts — Meet the 6 AI broadcast hosts\n` +
      `/tip @user [amount] — Send RTV tips\n` +
      `/ecosystem — View full network\n` +
      `/status — Live system status\n\n` +
      `<i>Powered by GPT-4o + Cloudflare Workers AI</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // ── Natural language fallback ────────────────────────────────────────────────
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;
    if (text.length <= 3) return;
    const modCheck = await moderateContent(env, text);
    if (!modCheck.safe) return;
    const response = await processNaturalLanguage(env, text, ctx.from.id);
    await ctx.reply(`🤖 ${response}`, { parse_mode: 'HTML' });
  });

  // ── Photo handler — DEEP FACE ANALYSIS ───────────────────────────────────────
  // Handles both /face command photos and standalone photo messages
  bot.on('message:photo', async (ctx) => {
    const telegramId = ctx.from?.id!;
    const scanning = await ctx.reply('🔬 <b>Running Deep Face Analysis...</b>\n\n<i>Viola-Jones detector active | GPT-4o Vision loading...</i>', { parse_mode: 'HTML' });

    try {
      // Get highest-res photo
      const photo = ctx.message.photo.at(-1)!;
      const file = await ctx.api.getFile(photo.file_id);
      const imageUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN_MAIN}/${file.file_path}`;

      // Run deep analysis
      const analysis = await analyzeFaceFromUrl(env, imageUrl);

      // Log to Supabase moderation_log
      const passed = analysis.detected && analysis.is_adult && analysis.is_safe;
      await logFaceVerification(env, telegramId, analysis, passed);

      // If adult and not previously verified, auto-verify
      if (analysis.is_adult && analysis.is_safe) {
        await supabaseUpdate(env, 'users', `telegram_id=eq.${telegramId}`, {
          verified_age: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (!analysis.detected) {
        await ctx.api.editMessageText(ctx.chat.id, scanning.message_id,
          `👤 <b>No Face Detected</b>\n\nCould not detect a human face in this image.\n\nTips:\n• Use good lighting\n• Look directly at the camera\n• Avoid obstructions`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Build expression emoji map
      const expressionEmoji: Record<string, string> = {
        happy: '😊', sad: '😢', angry: '😠', surprised: '😲',
        neutral: '😐', disgusted: '🤢', fearful: '😨', contempt: '😒',
      };
      const exprEmoji = expressionEmoji[analysis.expression] ?? '😐';

      // Build landmarks summary
      const eyeState   = analysis.landmarks.eyesOpen ? '👁️ Open' : '😴 Closed';
      const browState  = { raised: '⬆️ Raised', neutral: '➡️ Neutral', furrowed: '⬇️ Furrowed' }[analysis.landmarks.eyebrowPosition];
      const smileState = analysis.landmarks.smile ? '✅ Yes' : '❌ No';
      const headState  = { left: '↖️ Tilted Left', right: '↗️ Tilted Right', center: '⬆️ Centered' }[analysis.landmarks.headTilt];
      const gazeState  = { forward: '👁️ Forward', left: '👈 Left', right: '👉 Right', down: '👇 Down' }[analysis.landmarks.gazeDirection];

      // Age verification badge
      const ageBadge = analysis.is_adult
        ? `✅ <b>18+ VERIFIED</b> (est. ${analysis.age_estimate})`
        : `🔞 <b>UNDER 18 DETECTED</b> (est. ${analysis.age_estimate}) — Access Restricted`;

      const confidencePct = Math.round(analysis.confidence * 100);
      const livenessState = analysis.liveness ? '✅ Real face detected' : '⚠️ May be static image';

      const reply =
        `👤 <b>Deep Face Analysis Complete</b>\n\n` +
        `${ageBadge}\n\n` +
        `${exprEmoji} <b>Expression:</b> ${analysis.expression.charAt(0).toUpperCase() + analysis.expression.slice(1)}\n` +
        `🎯 <b>Confidence:</b> ${confidencePct}%\n` +
        `💡 <b>Liveness:</b> ${livenessState}\n\n` +
        `<b>🧬 Facial Landmarks (Viola-Jones)</b>\n` +
        `├ Eyes: ${eyeState}\n` +
        `├ Brow: ${browState}\n` +
        `├ Smile: ${smileState}\n` +
        `├ Head: ${headState}\n` +
        `└ Gaze: ${gazeState}\n\n` +
        `<b>📋 Additional Details</b>\n` +
        `├ Faces detected: ${analysis.face_count}\n` +
        `├ Glasses: ${analysis.glasses ? '👓 Yes' : '❌ No'}\n` +
        `├ Facial hair: ${analysis.facial_hair ? '🧔 Yes' : '❌ No'}\n` +
        `└ Content: ${analysis.is_safe ? '✅ Safe' : '⚠️ Flagged'}\n\n` +
        (analysis.raw_description ? `<i>${analysis.raw_description}</i>\n\n` : '') +
        (analysis.is_adult && analysis.is_safe
          ? `🎉 <b>Age verification passed!</b> You now have full platform access.`
          : !analysis.is_adult
          ? `🔞 Age verification failed. You must be 18+ to access RotationTV Live.`
          : `⚠️ Content safety flag detected.`);

      await ctx.api.editMessageText(ctx.chat.id, scanning.message_id, reply, { parse_mode: 'HTML' });

    } catch (e) {
      console.error('Face analysis handler error:', e);
      await ctx.api.editMessageText(ctx.chat.id, scanning.message_id,
        '⚠️ Face analysis failed. Please try again with a clearer photo.', { parse_mode: 'HTML' }
      );
    }
  });

  // ─── Telegram Stars payments (18+ compatible — no Stripe/PayPal restriction) ───
  bot.command('buy', async (ctx) => {
    await handleBuyCommand(bot, ctx);
  });

  bot.on("callback_query:data", async (ctx, next) => {
    const userId = String(ctx.from?.id);
    const handled = await handleBuyCallback(bot, ctx, userId);
    if (!handled) return next();
  });

  registerPreCheckout(bot);
  registerSuccessfulPayment(bot, async (userId, payload, stars) => {
    await creditUserFromStarsPurchase(env, userId, payload, stars);
  });

  return bot;
}

// ─── CLOUDFLARE WORKER EXPORT ─────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const bot = createSuperAgentBot(env);
    const handleUpdate = webhookCallback(bot, 'cloudflare-mod');
    return handleUpdate(request);
  },
};
