// RTV Voice Engine — Gemini TTS + Speech Recognition
// Converts text to voice and handles voice-to-text for mentor sessions
// Presidential Authority: Darrel

export default async function handler(req: Request) {
  const { action, text, mentor = "council", audio_base64 } = await req.json();
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  // Voice configs per mentor
  const VOICE_MAP = {
    elon: { voice: "Puck", style: "confident, direct, slightly urgent" },
    bezos: { voice: "Charon", style: "measured, analytical, warm" },
    buffett: { voice: "Fenrir", style: "folksy, warm, slow and deliberate" },
    council: { voice: "Aoede", style: "authoritative, presidential, clear" },
  };

  const voiceConfig = VOICE_MAP[mentor] || VOICE_MAP.council;

  if (action === "tts") {
    // Text to Speech using Gemini TTS
    const ttsRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: { voice_name: voiceConfig.voice },
              },
            },
          },
        }),
      }
    );

    const ttsData = await ttsRes.json();
    const audioData = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
    const mimeType = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.mime_type || "audio/wav";

    if (audioData) {
      return new Response(JSON.stringify({
        audio_base64: audioData,
        mime_type: mimeType,
        voice: voiceConfig.voice,
        mentor,
      }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "TTS failed", raw: ttsData }), { status: 500 });
  }

  if (action === "stt") {
    // Speech to Text using Gemini multimodal
    const sttRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcribe this audio exactly. Return only the transcription, nothing else." },
              { inline_data: { mime_type: "audio/webm", data: audio_base64 } },
            ],
          }],
        }),
      }
    );
    const sttData = await sttRes.json();
    const transcript = sttData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({ transcript }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Invalid action. Use tts or stt" }), { status: 400 });
}
