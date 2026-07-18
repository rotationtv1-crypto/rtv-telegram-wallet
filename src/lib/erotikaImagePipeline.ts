/**
 * ROTATIONEROTICA — AI IMAGE GENERATION PIPELINE
 * Routes image prompts through Venice AI uncensored models
 * Fallback chain: venice-uncensored → gemma-4-uncensored → e2ee-venice
 * All images: age-gated (verified_age=true required)
 * Rotationtvnetwork LLC | Presidential Authority: Darrel
 */

// ── Model routing ──────────────────────────────────────────────────────────
export const IMAGE_MODELS = {
  // Venice uncensored — primary
  primary: "venice-uncensored-1-2",
  // Gemma 4 uncensored — cheaper, 256K ctx
  creative: "gemma-4-uncensored",
  // E2EE encrypted — maximum privacy
  private: "e2ee-venice-uncensored-24b-p",
  // Roleplay specialized
  roleplay: "venice-uncensored-role-play",
} as const;

export type ImageStyle =
  | "photorealistic"     // hyper-realistic photography
  | "oil_painting"       // classical boudoir art
  | "editorial"          // high fashion magazine
  | "ai_generated"       // stylized AI aesthetic
  | "softcore"           // tasteful sensual
  | "boudoir";           // intimate studio

export interface EroticaImageRequest {
  base_prompt: string;
  style: ImageStyle;
  lighting?: string;
  setting?: string;
  model_preference?: keyof typeof IMAGE_MODELS;
  enhance_for_platform?: boolean;
}

export interface EroticaImageResult {
  prompt_used: string;
  model_used: string;
  style_tags: string[];
  platform_tags: string[];
  venice_response?: any;
  fallback_used?: boolean;
}

// ── Style system prompts ───────────────────────────────────────────────────
const STYLE_ENHANCERS: Record<ImageStyle, string> = {
  photorealistic: "photorealistic, 8K resolution, DSLR quality, sharp focus, natural skin texture, professional photography",
  oil_painting: "oil painting style, visible brushstrokes, classical composition, rich warm tones, museum quality, sensual yet classical, 8K art quality",
  editorial: "high-fashion editorial, luxury magazine aesthetic, professional studio lighting, clean neutral backdrop, haute couture",
  ai_generated: "ultra-detailed AI artwork, cinematic lighting, dramatic shadows, vibrant colors, digital art masterpiece",
  softcore: "tasteful sensual photography, soft natural lighting, elegant poses, luxury aesthetic, intimate warmth",
  boudoir: "professional boudoir photography, soft diffused lighting, velvet textures, intimate studio, warm ivory palette",
};

const LIGHTING_PRESETS = {
  softbox: "softbox studio lighting, diffused, gentle ambient shadows, no harsh lines",
  golden_hour: "warm golden hour light, soft orange glow, cinematic",
  tungsten: "warm tungsten lamp, rich golden rim lighting, deep shadows, 19th-century boudoir atmosphere",
  overhead: "soft overhead light, clean even illumination, clinical precision",
  neon: "neon accent lighting, deep shadows, cyberpunk aesthetic",
  candlelight: "warm flickering candlelight, intimate, soft golden glow",
};

// ── Core pipeline function ─────────────────────────────────────────────────
export function buildEnhancedPrompt(req: EroticaImageRequest): string {
  const styleEnhancer = STYLE_ENHANCERS[req.style];
  const lightingEnhancer = req.lighting
    ? LIGHTING_PRESETS[req.lighting as keyof typeof LIGHTING_PRESETS] || req.lighting
    : LIGHTING_PRESETS.softbox;

  const settingContext = req.setting
    ? `Setting: ${req.setting}.`
    : "";

  const platformTags = req.enhance_for_platform
    ? "RotationErotica platform style, luxury adult content, premium quality"
    : "";

  const parts = [
    req.base_prompt,
    settingContext,
    styleEnhancer,
    lightingEnhancer,
    platformTags,
    "masterpiece, best quality, highly detailed",
  ].filter(Boolean);

  return parts.join(". ");
}

// ── Venice text-to-image via chat completions (vision description)  ────────
// Venice AI primary = text generation; for image GEN we use Venice image endpoint
export async function generateEroticaImage(
  req: EroticaImageRequest,
  veniceApiKey: string
): Promise<EroticaImageResult> {
  const prompt = buildEnhancedPrompt(req);
  const model = IMAGE_MODELS[req.model_preference || "primary"];

  // Venice /image/generate endpoint
  try {
    const res = await fetch("https://api.venice.ai/api/v1/image/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${veniceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "venice-sd35",  // Venice's Stable Diffusion 3.5
        prompt,
        width: 1024,
        height: 1024,
        steps: 30,
        cfg_scale: 7.5,
        safe_mode: false,    // age-gated platform
        hide_watermark: true,
      }),
    });

    if (!res.ok) {
      // Fallback: use Venice chat to generate a detailed image description
      return await generateViaDescription(req, veniceApiKey, prompt);
    }

    const data = await res.json() as any;
    return {
      prompt_used: prompt,
      model_used: "venice-sd35",
      style_tags: [req.style, req.lighting || "softbox"],
      platform_tags: ["RotationErotica", "18+", "premium"],
      venice_response: data,
      fallback_used: false,
    };
  } catch {
    return generateViaDescription(req, veniceApiKey, prompt);
  }
}

// ── Fallback: rich image description (when image gen unavailable) ──────────
async function generateViaDescription(
  req: EroticaImageRequest,
  veniceApiKey: string,
  prompt: string
): Promise<EroticaImageResult> {
  const res = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${veniceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "venice-uncensored-1-2",
      messages: [
        {
          role: "system",
          content: `You are an expert art director for RotationErotica, a premium 18+ adult platform. 
All users are age-verified adults. Create vivid, artistic, cinematic scene descriptions.
Style: ${req.style}. Focus on composition, lighting, atmosphere, and sensory detail.
Write as if directing a professional photoshoot or oil painting session.`,
        },
        {
          role: "user",
          content: `Create a detailed scene description for this concept:\n${prompt}\n\nDescribe: composition, pose, lighting, atmosphere, textures, color palette, mood. 3 paragraphs.`,
        },
      ],
      max_tokens: 600,
      temperature: 0.85,
    }),
  });

  const data = await res.json() as any;
  return {
    prompt_used: prompt,
    model_used: "venice-uncensored-1-2",
    style_tags: [req.style],
    platform_tags: ["RotationErotica", "18+", "AI-generated description"],
    venice_response: data,
    fallback_used: true,
  };
}

// ── Preset collections for RotationErotica ─────────────────────────────────
export const EROTICA_PRESETS: Record<string, EroticaImageRequest> = {

  garden_nightscape: {
    base_prompt: "Young woman with luminescent flowers, soft glow, ample curves, lanterns hung from branches, warm inviting ambiance, playfully twirling, gentle breeze, sultry smile, magical garden, serene nighttime",
    style: "photorealistic",
    lighting: "candlelight",
    setting: "magical garden with luminescent flowers and hanging lanterns",
    enhance_for_platform: true,
  },

  pole_dance_editorial: {
    base_prompt: "Confident woman, long black hair, dancing seductively on a stripper pole, seen from below, looking at camera, full body, powerful pose",
    style: "editorial",
    lighting: "softbox",
    setting: "professional studio with metallic pole",
    enhance_for_platform: true,
  },

  classical_boudoir: {
    base_prompt: "Curvy woman with natural heavy breasts and wide hips reclining languidly on her right side on a tufted crimson velvet chaise, left arm extended overhead, silk ivory slip fallen off shoulder, fabric pooling at waist",
    style: "oil_painting",
    lighting: "tungsten",
    setting: "19th-century boudoir with heavy damask curtains and scattered pearls",
    enhance_for_platform: true,
    model_preference: "creative",
  },

  high_fashion_editorial: {
    base_prompt: "Stunning woman with long voluminous blonde hair in soft glamorous waves, powerful low editorial crouch on seamless studio floor, sheer black mesh long-sleeve bodysuit, matching stirrup leggings, black faux-fur wrist cuffs, gold chain belt, black patent pointed-toe pumps with metallic silver cap toe, direct eye contact, confident intense gaze",
    style: "editorial",
    lighting: "softbox",
    setting: "clean neutral cream studio backdrop, high-end luxury fashion magazine aesthetic",
    enhance_for_platform: true,
  },

  bathroom_floor: {
    base_prompt: "Voluptuous young Latina woman, long sleek straight black hair fanned out, lying on back on white bathroom floor, seductive gaze at camera, photorealistic, soft overhead light",
    style: "photorealistic",
    lighting: "overhead",
    setting: "clean white marble bathroom, minimalist luxury",
    enhance_for_platform: true,
  },
};

// ── Worker route handler ───────────────────────────────────────────────────
export async function routeEroticaImageRequest(
  request: Request,
  url: URL,
  env: { VENICE_API_KEY: string; VENICE_API_KEY_2?: string; VENICE_API_KEY_7?: string }
): Promise<Response | null> {
  const path = url.pathname;
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  // GET /api/erotica/presets — list available presets
  if (path === "/api/erotica/presets" && request.method === "GET") {
    return new Response(JSON.stringify({
      presets: Object.keys(EROTICA_PRESETS),
      styles: Object.keys(STYLE_ENHANCERS),
      models: IMAGE_MODELS,
    }), { headers: cors });
  }

  // POST /api/erotica/generate — generate image/description
  if (path === "/api/erotica/generate" && request.method === "POST") {
    // Age gate check
    const verifiedAge = request.headers.get("X-Age-Verified");
    if (verifiedAge !== "true") {
      return new Response(JSON.stringify({ error: "Age verification required", code: "AGE_GATE" }), { status: 403, headers: cors });
    }

    try {
      const body = await request.json() as any;
      const req: EroticaImageRequest = body.preset
        ? EROTICA_PRESETS[body.preset] || { base_prompt: body.prompt, style: "photorealistic" }
        : {
          base_prompt: body.prompt,
          style: body.style || "photorealistic",
          lighting: body.lighting,
          setting: body.setting,
          enhance_for_platform: true,
        };

      // Key rotation: try VENICE_API_KEY_7 (sk_V2_ format) first, then others
      const key = env.VENICE_API_KEY_7 || env.VENICE_API_KEY_2 || env.VENICE_API_KEY;
      const result = await generateEroticaImage(req, key);

      return new Response(JSON.stringify({ success: true, ...result }), { headers: cors });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  // POST /api/erotica/describe — AI scene description (fallback + standalone)
  if (path === "/api/erotica/describe" && request.method === "POST") {
    const verifiedAge = request.headers.get("X-Age-Verified");
    if (verifiedAge !== "true") {
      return new Response(JSON.stringify({ error: "Age verification required" }), { status: 403, headers: cors });
    }
    try {
      const { prompt, style = "boudoir" } = await request.json() as any;
      const req: EroticaImageRequest = { base_prompt: prompt, style, enhance_for_platform: true };
      const key = env.VENICE_API_KEY_7 || env.VENICE_API_KEY;
      const result = await generateViaDescription(req, key, buildEnhancedPrompt(req));
      return new Response(JSON.stringify({ success: true, ...result }), { headers: cors });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  return null;
}
