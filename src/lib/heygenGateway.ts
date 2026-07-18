/**
 * HEYGEN AI AVATAR GATEWAY — ROTATIONTVNETWORK LLC
 * Real-time avatar streaming for AI hosts + creator sessions
 * Docs: https://docs.heygen.com
 */

const HEYGEN_BASE = "https://api.heygen.com";

export interface HeyGenEnv {
  HEYGEN_API_KEY: string;
}

// ─── AVATAR MANAGEMENT ────────────────────────────────────────────────────────

export async function listAvatars(env: HeyGenEnv) {
  const res = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
    headers: { "X-Api-Key": env.HEYGEN_API_KEY }
  });
  return res.json();
}

export async function listVoices(env: HeyGenEnv, language = "en") {
  const res = await fetch(`${HEYGEN_BASE}/v2/voices?language=${language}`, {
    headers: { "X-Api-Key": env.HEYGEN_API_KEY }
  });
  return res.json();
}

// ─── VIDEO GENERATION (async, ~1-3 min) ──────────────────────────────────────

export async function generateAvatarVideo(
  avatarId: string,
  text: string,
  voiceId: string,
  env: HeyGenEnv
): Promise<{ video_id: string; status: string }> {
  const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "text", input_text: text, voice_id: voiceId }
      }],
      dimension: { width: 1280, height: 720 }
    })
  });
  const data = await res.json() as any;
  return { video_id: data.data?.video_id, status: data.data?.status };
}

export async function getVideoStatus(videoId: string, env: HeyGenEnv) {
  const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": env.HEYGEN_API_KEY }
  });
  return res.json();
}

// ─── STREAMING SESSIONS (real-time WebRTC lip sync) ──────────────────────────

export async function createStreamingSession(
  avatarId: string,
  voiceId: string,
  env: HeyGenEnv
): Promise<{ session_id: string; sdp: string; ice_servers: any[] }> {
  const res = await fetch(`${HEYGEN_BASE}/v1/streaming.new`, {
    method: "POST",
    headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      quality: "high",
      avatar_id: avatarId,
      voice: { voice_id: voiceId },
      version: "v2",
      video_encoding: "H264"
    })
  });
  const data = await res.json() as any;
  return {
    session_id: data.data?.session_id,
    sdp: data.data?.sdp?.sdp,
    ice_servers: data.data?.ice_servers ?? []
  };
}

export async function startStreamingSession(sessionId: string, sdpAnswer: string, env: HeyGenEnv) {
  return fetch(`${HEYGEN_BASE}/v1/streaming.start`, {
    method: "POST",
    headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, sdp: { type: "answer", sdp: sdpAnswer } })
  }).then(r => r.json());
}

export async function speakInSession(sessionId: string, text: string, env: HeyGenEnv) {
  return fetch(`${HEYGEN_BASE}/v1/streaming.task`, {
    method: "POST",
    headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, text, task_type: "talk" })
  }).then(r => r.json());
}

export async function stopStreamingSession(sessionId: string, env: HeyGenEnv) {
  return fetch(`${HEYGEN_BASE}/v1/streaming.stop`, {
    method: "POST",
    headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId })
  }).then(r => r.json());
}

// ─── RTV AI HOST MAPPING ──────────────────────────────────────────────────────
// Fill avatar_id + voice_id from: https://app.heygen.com → My Avatars
// Voice IDs from: https://app.heygen.com → Voice Library

export const RTV_HEYGEN_AVATARS = {
  LEO:     { avatar_id: "", voice_id: "", role: "Anchor",   style: "authoritative, deep" },
  MAYA:    { avatar_id: "", voice_id: "", role: "Energetic", style: "fast, upbeat, high energy" },
  DR_REED: { avatar_id: "", voice_id: "", role: "Analyst",  style: "clear, measured, professional" },
  ZARA:    { avatar_id: "", voice_id: "", role: "Wildcard",  style: "playful, unpredictable, varied pitch" },
  OMAR:    { avatar_id: "", voice_id: "", role: "Chill",     style: "smooth, low, relaxed" },
  LINA:    { avatar_id: "", voice_id: "", role: "Co-Host",  style: "warm, relatable, clear" },
} as const;

export type RTVHostName = keyof typeof RTV_HEYGEN_AVATARS;

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function routeHeyGenRequest(
  request: Request,
  url: URL,
  env: HeyGenEnv & { HEYGEN_API_KEY: string }
): Promise<Response | null> {
  const path = url.pathname;
  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  if (path === "/api/heygen/health") {
    const hasKey = !!env.HEYGEN_API_KEY;
    return json({ status: hasKey ? "key_set" : "no_key", setup: "https://app.heygen.com" });
  }

  if (!env.HEYGEN_API_KEY) return json({ error: "HEYGEN_API_KEY not set" }, 503);

  if (path === "/api/heygen/avatars") return json(await listAvatars(env));
  if (path === "/api/heygen/voices") return json(await listVoices(env));
  if (path === "/api/heygen/hosts") return json({ hosts: RTV_HEYGEN_AVATARS });

  if (path === "/api/heygen/session/new" && request.method === "POST") {
    const body = await request.json() as any;
    const host = RTV_HEYGEN_AVATARS[body.host as RTVHostName];
    if (!host?.avatar_id) return json({ error: "Avatar ID not configured for this host" }, 400);
    const session = await createStreamingSession(host.avatar_id, host.voice_id, env);
    return json(session);
  }

  if (path === "/api/heygen/session/speak" && request.method === "POST") {
    const body = await request.json() as any;
    const result = await speakInSession(body.session_id, body.text, env);
    return json(result);
  }

  return null;
}
