// RotationTV Network — Customer Mentor Chat
// Most Advanced AI Mentor · Claude-Powered · Full Ecosystem Knowledge
// Lead scoring · Smart replies · Conversion CTAs · Voice ready
// PUBLIC PAGE — No owner gate · For ALL customers
// "Learn it. Live it. Love it."

import { useState, useEffect, useRef, useCallback } from "react";
import { MentorSession } from "@/api/entities";

const API = "https://69db6144f66afe8317b2d0d7.base44.app/functions/customerMentorBot";
const PORTAL = "https://rotationtvai.com";
const PAYPAL = "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY";

// ── Design ────────────────────────────────────────────────
const C = {
  bg:      "#07070f",
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(255,215,0,0.1)",
  gold:    "#FFD700",
  green:   "#00FF88",
  blue:    "#00D4FF",
  purple:  "#9945FF",
  red:     "#FF6B6B",
  text:    "#FFFFFF",
  sub:     "rgba(255,255,255,0.65)",
  muted:   "rgba(255,255,255,0.35)",
};

// ── Mentors ───────────────────────────────────────────────
const MENTORS = [
  { id: "council", name: "Presidential Council", short: "Council",  emoji: "🏛️", color: C.gold,   subtitle: "Elon · Bezos · Buffett · Tesla unified" },
  { id: "elon",    name: "Elon Musk",            short: "Elon",     emoji: "🚀", color: C.blue,   subtitle: "First principles & 10x thinking"       },
  { id: "bezos",   name: "Jeff Bezos",           short: "Bezos",    emoji: "📦", color: "#FF9900", subtitle: "Customer obsession & flywheels"         },
  { id: "buffett", name: "Warren Buffett",        short: "Buffett",  emoji: "💰", color: C.green,  subtitle: "Moats & generational wealth"            },
  { id: "tesla",   name: "Nikola Tesla",          short: "Tesla",    emoji: "⚡", color: C.purple, subtitle: "Resonance, energy & $RTV infinite"      },
];

// ── Companies ─────────────────────────────────────────────
const COMPANIES = [
  { name: "RotationPay",           icon: "💳", color: C.gold   },
  { name: "RTV AI University",     icon: "🎓", color: C.blue   },
  { name: "RotationCall",          icon: "📞", color: C.green  },
  { name: "$RTVS Token",           icon: "⚡", color: C.purple },
  { name: "Bigo Agency",           icon: "🎨", color: "#FF6B6B"},
  { name: "White Logistics",       icon: "🚚", color: "#FF9900"},
  { name: "Pretrial Services",     icon: "⚖️", color: C.green  },
  { name: "EmergentLabs",          icon: "🔬", color: C.blue   },
  { name: "OpenClaw",              icon: "🤖", color: C.purple },
];

// ── Lead score bar ────────────────────────────────────────
function LeadBar({ score }) {
  const color = score >= 70 ? C.green : score >= 40 ? C.gold : C.blue;
  const label = score >= 70 ? "Hot Lead 🔥" : score >= 40 ? "Engaged 💡" : "Exploring 👋";
  return (
    <div style={{ padding: "6px 14px", background: "rgba(0,0,0,0.3)", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, marginBottom: 4 }}>
        <span style={{ color: C.muted }}>Engagement</span>
        <span style={{ color, fontWeight: 800 }}>{label} · {score}/100</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────
function Typing({ color }) {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 18px", alignItems: "center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: color, animation: `mb 1.2s ease ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────
function Bubble({ msg, mentor }) {
  const m = MENTORS.find(x => x.id === mentor) || MENTORS[0];
  const isUser = msg.role === "user";

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, gap: 10, alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `${m.color}18`, border: `1px solid ${m.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {m.emoji}
        </div>
      )}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 4 }}>
        {!isUser && (
          <div style={{ fontSize: 10, color: m.color, fontWeight: 800, letterSpacing: 0.8, paddingLeft: 4 }}>
            {m.name}{msg.model ? ` · ${msg.model}` : ""}
          </div>
        )}
        <div style={{
          background: isUser ? `${C.gold}12` : C.card,
          border: `1px solid ${isUser ? `${C.gold}25` : "rgba(255,255,255,0.07)"}`,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "13px 17px",
        }}>
          <div style={{ fontSize: 14, color: isUser ? "#fff" : C.sub, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {msg.content}
          </div>
        </div>
        {/* CTA if present */}
        {msg.cta && (
          <a href={msg.cta.url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6,
            background: `linear-gradient(135deg, ${C.gold}, ${C.gold}cc)`,
            color: "#000", textDecoration: "none", fontWeight: 800, fontSize: 13,
            padding: "10px 18px", borderRadius: 12, alignSelf: "flex-start",
            boxShadow: `0 4px 20px ${C.gold}44`
          }}>
            {msg.cta.text}
          </a>
        )}
      </div>
      {isUser && (
        <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: C.gold }}>
          {msg.initials || "Y"}
        </div>
      )}
    </div>
  );
}

// ── Smart reply chips ─────────────────────────────────────
function SmartReplies({ replies, onSelect, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 16px 0" }}>
      {replies.map((r, i) => (
        <button key={i} onClick={() => !disabled && onSelect(r)} disabled={disabled} style={{
          padding: "7px 14px", borderRadius: 20, border: `1px solid ${C.border}`,
          background: C.card, color: disabled ? C.muted : C.sub,
          fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.border}`; e.currentTarget.style.color = disabled ? C.muted : C.sub; }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function CustomerMentor() {
  const [mentor,      setMentor]      = useState("council");
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [leadScore,   setLeadScore]   = useState(0);
  const [interest,    setInterest]    = useState("General");
  const [smartReplies, setSmartReplies] = useState([]);
  const [userName,    setUserName]    = useState("");
  const [nameAsked,   setNameAsked]   = useState(false);
  const [sessionId,   setSessionId]   = useState(`sess_${Date.now()}`);
  const [view,        setView]        = useState("chat"); // chat | companies
  const [sessionSaved, setSessionSaved] = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const m = MENTORS.find(x => x.id === mentor) || MENTORS[0];

  // Init greeting
  useEffect(() => {
    const greetings = {
      council: `🏛️ **Presidential Council online.**\n\nWelcome to RotationTV Network — the only ecosystem combining AI, Web3, blockchain payments, education, and enterprise voice in one.\n\nI'm your personal mentor — powered by Elon, Bezos, Buffett, and Tesla unified.\n\nWhat brings you here today? Ask me anything about our 9 companies, $RTVS token, or how we can help your business grow.`,
      elon:    `🚀 **Elon here.**\n\nForget incremental thinking. You found RotationTV Network — a 9-company ecosystem built for the next decade.\n\nFirst principles: what problem are you trying to solve? Tell me, and we'll find the 10x path.`,
      bezos:   `📦 **Jeff Bezos. Day 1, always.**\n\nAt RotationTV Network, we're customer-obsessed. Every product — RotationPay, RotationCall, RTV University — was built around one question: what does the customer actually need?\n\nWhat are you working on? Let's find the flywheel.`,
      buffett: `💰 **Warren Buffett here.**\n\nI've spent 60 years looking for durable competitive advantages. RotationTV Network has built something rare — a moat across payments, education, voice AI, and Web3 in one ecosystem.\n\nWhat are you investing your time in? Let's talk long-term value.`,
      tesla:   `⚡ **Tesla speaking.**\n\nEvery great system runs on resonance. The $RTV token is a resonant frequency — 9 companies feeding energy into one token. When the ecosystem grows, every holder benefits.\n\nWhat frequency are you tuned to? Let's find your signal.`,
    };
    setMessages([{ role: "assistant", content: greetings[mentor] || greetings.council }]);
    const defaultReplies = {
      council: ["Tell me about $RTVS token", "What is RTV AI University?", "How does RotationPay work?", "Show me all 9 companies"],
      elon:    ["What's the 10x opportunity here?", "Tell me about $RTVS token", "How does RotationPay disrupt payments?", "What's the first principles case for Web3?"],
      bezos:   ["What problem does RotationPay solve?", "Tell me about the University", "How does the ecosystem flywheel work?", "What's the customer obsession here?"],
      buffett: ["What's the moat around $RTVS?", "Tell me about the University ROI", "Is RotationPay a good investment?", "How does the ecosystem compound value?"],
      tesla:   ["How does the $RTV resonance engine work?", "Tell me about the 9-company flywheel", "What's the Sovereign staking tier?", "How do TON and Solana connect?"],
    };
    setSmartReplies(defaultReplies[mentor] || defaultReplies.council);
  }, [mentor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-save session to entity
  useEffect(() => {
    if (messages.length > 3 && !sessionSaved) {
      MentorSession.create({
        session_id: sessionId,
        user_name: userName || "Anonymous",
        mentor_id: mentor,
        messages: messages,
        topic: interest,
        company_interest: interest,
        lead_score: leadScore,
        total_messages: messages.length,
        last_active: new Date().toISOString(),
        status: "active",
      }).catch(() => {});
      setSessionSaved(true);
    }
  }, [messages.length]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Name capture on first user message
    if (!nameAsked && messages.length <= 2) {
      setNameAsked(true);
      // Try to extract name from message like "I'm John" or "My name is John"
      const nameMatch = msg.match(/(?:i'm|i am|my name is|call me)\s+([a-zA-Z]+)/i);
      if (nameMatch) setUserName(nameMatch[1]);
    }

    const initials = userName ? userName[0].toUpperCase() : "Y";
    const userMsg  = { role: "user", content: msg, initials };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setSmartReplies([]);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:     "chat",
          message:    msg,
          history:    messages.slice(-14),
          mentor,
          user_name:  userName,
          session_id: sessionId,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setLeadScore(data.lead_score || 0);
        setInterest(data.interest || "General");
        setSmartReplies(data.smart_replies || []);
        setMessages(prev => [...prev, {
          role:    "assistant",
          content: data.response,
          model:   data.model,
          cta:     data.cta,
        }]);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: `⚠️ Connection issue. Please try again.\n\nIn the meantime — visit [rotationtvai.com](${PORTAL}) to explore all 9 companies.`,
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, messages, mentor, userName, sessionId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes mb { 0%,80%,100%{transform:scale(0.5);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 4px; }
      `}</style>

      {/* ── Header ─────────────────────────────── */}
      <div style={{
        background: "rgba(7,7,15,0.97)", borderBottom: `1px solid ${C.border}`,
        padding: "14px 20px", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>{m.emoji}</div>
              <div>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: 2 }}>ROTATIONTV NETWORK</div>
                <div style={{ fontSize: 17, fontWeight: 900 }}>AI Mentor · {m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{m.subtitle}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {/* View toggle */}
              <button onClick={() => setView(v => v === "chat" ? "companies" : "chat")} style={{
                padding: "7px 14px", borderRadius: 20, border: `1px solid ${C.border}`,
                background: C.card, color: C.sub, fontSize: 12, cursor: "pointer", fontWeight: 600
              }}>
                {view === "chat" ? "🏢 Companies" : "💬 Chat"}
              </button>
              <a href={PORTAL} target="_blank" rel="noopener noreferrer" style={{
                padding: "7px 14px", borderRadius: 20, background: C.gold, color: "#000",
                fontSize: 12, fontWeight: 800, textDecoration: "none"
              }}>
                Visit Portal →
              </a>
            </div>
          </div>

          {/* Mentor selector */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {MENTORS.map(mm => (
              <button key={mm.id} onClick={() => setMentor(mm.id)} style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: mentor === mm.id ? `${mm.color}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${mentor === mm.id ? mm.color + "55" : "transparent"}`,
                color: mentor === mm.id ? mm.color : C.muted,
                fontSize: 12, fontWeight: mentor === mm.id ? 800 : 500, transition: "all 0.15s"
              }}>
                {mm.emoji} {mm.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lead bar ───────────────────────────── */}
      {leadScore > 0 && <div style={{ maxWidth: 900, width: "100%", margin: "0 auto" }}><LeadBar score={leadScore} /></div>}

      {/* ── Companies panel ────────────────────── */}
      {view === "companies" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px", width: "100%" }}>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>Ask me about any of our 9 companies:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {COMPANIES.map(co => (
              <button key={co.name} onClick={() => { setView("chat"); send(`Tell me about ${co.name}`); }} style={{
                background: C.card, border: `1px solid ${co.color}20`, borderRadius: 14,
                padding: "16px 12px", cursor: "pointer", textAlign: "center",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = co.color + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = co.color + "20"}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{co.icon}</div>
                <div style={{ color: co.color, fontSize: 12, fontWeight: 700 }}>{co.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat area ──────────────────────────── */}
      {view === "chat" && (
        <div style={{ flex: 1, overflowY: "auto", maxWidth: 900, width: "100%", margin: "0 auto", padding: "20px 20px 0" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: "fadein 0.25s ease" }}>
              <Bubble msg={msg} mentor={mentor} />
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, border: `1px solid ${m.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {m.emoji}
              </div>
              <div style={{ background: C.card, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: "18px 18px 18px 4px", minWidth: 60 }}>
                <Typing color={m.color} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Smart replies ───────────────────────── */}
      {view === "chat" && smartReplies.length > 0 && (
        <div style={{ maxWidth: 900, width: "100%", margin: "0 auto" }}>
          <SmartReplies replies={smartReplies} onSelect={send} disabled={loading} />
        </div>
      )}

      {/* ── Input bar ──────────────────────────── */}
      {view === "chat" && (
        <div style={{
          maxWidth: 900, width: "100%", margin: "0 auto",
          padding: "12px 16px 20px", borderTop: `1px solid ${C.border}`,
          background: "rgba(7,7,15,0.97)", backdropFilter: "blur(20px)",
          position: "sticky", bottom: 0,
        }}>
          {/* Interest pill */}
          {interest !== "General" && (
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color
              }}>
                📌 {interest}
              </span>
            </div>
          )}

          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${loading ? C.border : m.color + "40"}`,
            borderRadius: 16, padding: "10px 14px", transition: "border-color 0.2s"
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask ${m.short} anything about RotationTV Network...`}
              disabled={loading}
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", color: "#fff",
                fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 120,
                overflowY: "auto", fontFamily: "inherit"
              }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{
              width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer",
              background: !input.trim() || loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
              color: !input.trim() || loading ? C.muted : "#000",
              fontSize: 16, fontWeight: 900, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
              boxShadow: !input.trim() || loading ? "none" : `0 4px 16px ${m.color}44`
            }}>
              ↑
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: C.muted }}>
              Powered by Claude · RotationTV Network AI
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={PAYPAL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.gold, textDecoration: "none" }}>Buy $RTVS →</a>
              <a href={PORTAL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.muted, textDecoration: "none" }}>rotationtvai.com →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
