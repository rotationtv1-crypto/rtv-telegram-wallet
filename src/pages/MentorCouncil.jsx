// RTV Presidential Mentor Council
// Elon Musk + Jeff Bezos + Warren Buffett — Web3 Unified Business Intelligence
// Voice Recognition + Conversation — Powered by Gemini 2.5 Pro
// Presidential Authority: Darrel — RotationTV Network

import { useState, useRef, useEffect } from "react";
import OwnerGate from "./OwnerGate";
import { createClient } from "https://esm.sh/@base44/sdk@latest";

const API_BASE = "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions";

const MENTORS = [
  { id: "council", name: "Presidential Council", emoji: "🏛️", color: "#ffd700", subtitle: "Elon + Bezos + Buffett + Tesla unified" },
  { id: "elon", name: "Elon Musk", emoji: "🚀", color: "#00d4ff", subtitle: "First principles & 10x thinking" },
  { id: "bezos", name: "Jeff Bezos", emoji: "📦", color: "#ff9900", subtitle: "Customer obsession & flywheels" },
  { id: "buffett", name: "Warren Buffett", emoji: "💰", color: "#00cc88", subtitle: "Moats & generational wealth" },
  { id: "tesla", name: "Nikola Tesla", emoji: "⚡", color: "#b44fff", subtitle: "Resonance, energy & infinite $RTV" },
];

const QUICK_PROMPTS = [
  "How do I protect my LLC and Living Trust for generational wealth?",
  "What's the fastest path to $10M ARR across my 9 companies?",
  "How do I position $RTV token for maximum ecosystem value?",
  "Should I prioritize RotationPay or RotationCall first?",
  "How do I build an unbreachable moat around my ecosystem?",
  "What's my 90-day move to dominate the Solana payment market?",
];

function TypingIndicator({ color }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: color,
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

function MessageBubble({ msg, mentor }) {
  const isUser = msg.role === "user";
  const m = MENTORS.find(x => x.id === mentor) || MENTORS[0];

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, gap: 10 }}>
      {!isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${m.color}22`, border: `1px solid ${m.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>{m.emoji}</div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isUser ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "14px 18px",
      }}>
        {!isUser && (
          <div style={{ fontSize: 11, fontWeight: 800, color: m.color, letterSpacing: 1, marginBottom: 8 }}>
            {msg.model ? `${m.name} · via ${msg.model}` : m.name}
          </div>
        )}
        <div style={{
          fontSize: 14, color: isUser ? "#fff" : "#ddd", lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </div>
        {msg.speaking && (
          <div style={{ marginTop: 8 }}>
            <audio autoPlay src={msg.audioUrl} style={{ width: "100%", height: 32 }} controls />
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#ffd700",
        }}>D</div>
      )}
    </div>
  );
}

function MentorCouncilInner() {
  const [activeMentor, setActiveMentor] = useState("council");
  const [messages, setMessages] = useState([
    {
      role: "assistant", content:
        `🏛️ Presidential Council online, Darrel.\n\nYour $RTV ecosystem is live. Your 9 companies are active. Your LLC and Living Trust are your foundation.\n\nWe're Elon, Bezos, Buffett — and Tesla — unified to guide you to the top of the universe. Ask us anything about your business, your token, your wealth strategy, or your next move.\n\nVoice or text — your call. 🎯`,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const mentor = MENTORS.find(m => m.id === activeMentor);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/rtvMentorEngine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor: activeMentor, message: text, web3_context: true }),
      });
      const data = await res.json();
      const assistantMsg = {
        role: "assistant",
        content: data.response || data.error || "Council is processing...",
        model: data.model,
      };

      if (voiceEnabled && data.response) {
        try {
          const ttsRes = await fetch(`${API_BASE}/rtvVoiceEngine`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "tts", text: data.response.substring(0, 800), mentor: activeMentor }),
          });
          const ttsData = await ttsRes.json();
          if (ttsData.audio_base64) {
            const audioUrl = `data:${ttsData.mime_type};base64,${ttsData.audio_base64}`;
            assistantMsg.audioUrl = audioUrl;
            assistantMsg.speaking = true;
          }
        } catch (e) { /* voice optional */ }
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Retrying..." }]);
    }
    setLoading(false);
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(",")[1];
          try {
            const res = await fetch(`${API_BASE}/rtvVoiceEngine`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "stt", audio_base64: base64 }),
            });
            const data = await res.json();
            if (data.transcript) sendMessage(data.transcript);
          } catch (e) {}
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setListening(true);
    } catch (e) {
      alert("Microphone access required for voice mode");
    }
  };

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
    setListening(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #030309 0%, #08081a 50%, #030309 100%)",
      color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(255,215,0,0.1)",
        padding: "16px 20px", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#ffd700", fontWeight: 800 }}>
                ROTATIONTV NETWORK
              </div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>Presidential Mentor Council</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                style={{
                  padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: voiceEnabled ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)",
                  color: voiceEnabled ? "#00d4ff" : "#666", fontSize: 12, fontWeight: 700,
                  border: `1px solid ${voiceEnabled ? "rgba(0,212,255,0.4)" : "transparent"}`,
                }}
              >
                {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
              </button>
              <div style={{ fontSize: 11, color: "#333", background: "rgba(255,255,255,0.04)", padding: "6px 12px", borderRadius: 20 }}>
                Gemini 2.5 Pro
              </div>
            </div>
          </div>

          {/* Mentor Selector */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {MENTORS.map(m => (
              <button key={m.id} onClick={() => setActiveMentor(m.id)} style={{
                padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: activeMentor === m.id ? `${m.color}22` : "rgba(255,255,255,0.04)",
                color: activeMentor === m.id ? m.color : "#666",
                fontWeight: 700, fontSize: 12, transition: "all 0.2s",
                border: `1px solid ${activeMentor === m.id ? m.color + "44" : "transparent"}`,
              }}>
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", maxWidth: 900, width: "100%", margin: "0 auto" }}>
        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>
              QUICK QUESTIONS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#aaa", cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                }}
                onMouseEnter={e => { e.target.style.borderColor = mentor.color + "44"; e.target.style.color = "#fff"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "#aaa"; }}
                >{p}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} mentor={activeMentor} />
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: `${mentor.color}22`, border: `1px solid ${mentor.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{mentor.emoji}</div>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px 18px 18px 4px",
            }}>
              <TypingIndicator color={mentor.color} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Web3 Status Bar */}
      <div style={{
        background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.04)",
        padding: "8px 20px", display: "flex", gap: 16, overflowX: "auto",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 16, width: "100%" }}>
          {[
            { label: "Solana", status: "LIVE", color: "#9945ff" },
            { label: "$RTV Token", status: "ACTIVE", color: "#00cc88" },
            { label: "RotationPay", status: "ONLINE", color: "#00cc88" },
            { label: "9 Companies", status: "ACTIVE", color: "#ffd700" },
            { label: "Living Trust", status: "SECURED", color: "#00d4ff" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
              <span style={{ fontSize: 10, color: "#444" }}>{item.label}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: item.color }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px", backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          {/* Voice Button */}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            style={{
              width: 48, height: 48, borderRadius: 14, border: "none", cursor: "pointer", flexShrink: 0,
              background: listening ? "rgba(255,0,0,0.3)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${listening ? "rgba(255,0,0,0.5)" : "rgba(255,255,255,0.1)"}`,
              fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: listening ? "0 0 20px rgba(255,0,0,0.3)" : "none",
            }}
            title="Hold to speak"
          >
            {listening ? "🔴" : "🎙️"}
          </button>

          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={`Ask ${mentor.name}... (Enter to send, Shift+Enter for new line)`}
              style={{
                width: "100%", minHeight: 48, maxHeight: 120,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "14px 16px", color: "#fff", fontSize: 14,
                resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                boxSizing: "border-box",
              }}
              rows={1}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 48, height: 48, borderRadius: 14, border: "none", cursor: "pointer", flexShrink: 0,
              background: input.trim() && !loading
                ? `linear-gradient(135deg, ${mentor.color}, ${mentor.color}aa)`
                : "rgba(255,255,255,0.06)",
              fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳" : "⚡"}
          </button>
        </div>
        <div style={{ maxWidth: 900, margin: "8px auto 0", fontSize: 11, color: "#333", textAlign: "center" }}>
          Hold 🎙️ to speak • {mentor.emoji} {mentor.name} • Web3 Unified • LLC + Trust Protected
        </div>
      </div>
    </div>
  );
}

export default function MentorCouncil() {
  return <OwnerGate><MentorCouncilInner /></OwnerGate>;
}
