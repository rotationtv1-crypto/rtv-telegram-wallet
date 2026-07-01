// RotationTV Network — OWNER GATE
// Presidential Authority: Darrel — Owner & CEO
// All pages lock behind this. No exceptions.

import { useState, useEffect, createContext, useContext } from "react";

const OWNER_KEY = "DARREL_OMEGA_2026";
const SESSION_KEY = "rtv_owner_session";

export const OwnerContext = createContext(null);

export function useOwner() {
  return useContext(OwnerContext);
}

function PulseDot({ color = "#ffd700" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color,
        animation: "pd 2s ease-in-out infinite"
      }} />
      <style>{`@keyframes pd{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.8)}}`}</style>
    </span>
  );
}

export default function OwnerGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === OWNER_KEY) setAuthed(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (input.trim() === OWNER_KEY) {
        sessionStorage.setItem(SESSION_KEY, OWNER_KEY);
        setAuthed(true);
        setError("");
      } else {
        setError("ACCESS DENIED — Presidential credentials required");
        setShake(true);
        setInput("");
        setTimeout(() => setShake(false), 600);
      }
      setLoading(false);
    }, 800);
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#030309", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #ffd700", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (authed) {
    return (
      <OwnerContext.Provider value={{ owner: "Darrel", role: "PRESIDENTIAL", authed: true }}>
        {children}
      </OwnerContext.Provider>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #030309 0%, #080818 50%, #030309 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        animation: shake ? "shk 0.4s ease" : "fadein 0.6s ease",
      }}>
        <style>{`
          @keyframes shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-12px)}40%,80%{transform:translateX(12px)}}
          @keyframes fadein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #ffd700, #ff6b00)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 900, color: "#000",
            margin: "0 auto 20px",
            boxShadow: "0 0 60px rgba(255,215,0,0.4)",
          }}>R</div>

          <div style={{ fontSize: 11, letterSpacing: 4, color: "#ffd700", fontWeight: 800, marginBottom: 6 }}>
            ROTATIONTV NETWORK
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            OWNER ACCESS
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 11, color: "#666" }}>
            <PulseDot color="#00ff88" />
            PRESIDENTIAL AUTHORITY REQUIRED
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,215,0,0.2)",
            borderRadius: 20, padding: 32,
            boxShadow: "0 0 60px rgba(255,215,0,0.05)",
          }}>
            <div style={{ marginBottom: 8, fontSize: 11, color: "#666", letterSpacing: 1 }}>
              OWNER PASSPHRASE
            </div>
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter presidential credentials..."
              autoFocus
              style={{
                width: "100%", padding: "14px 16px",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${error ? "#ff4444" : "rgba(255,215,0,0.2)"}`,
                borderRadius: 12, color: "#fff", fontSize: 14,
                outline: "none", boxSizing: "border-box",
                transition: "border 0.2s",
                letterSpacing: 4,
              }}
              onFocus={e => e.target.style.borderColor = "#ffd700"}
              onBlur={e => e.target.style.borderColor = error ? "#ff4444" : "rgba(255,215,0,0.2)"}
            />

            {error && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#ff4444", textAlign: "center", letterSpacing: 1 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !input}
              style={{
                width: "100%", marginTop: 20,
                padding: "14px",
                background: loading || !input
                  ? "rgba(255,215,0,0.2)"
                  : "linear-gradient(135deg, #ffd700, #ff6b00)",
                border: "none", borderRadius: 12,
                color: loading || !input ? "#666" : "#000",
                fontWeight: 900, fontSize: 14, letterSpacing: 2,
                cursor: loading || !input ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "VERIFYING..." : "ENTER ECOSYSTEM"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 30, fontSize: 10, color: "#333", letterSpacing: 1 }}>
          ROTATIONTV NETWORK — OMEGA SECURITY LAYER<br />
          "Learn it. Live it. Love it."
        </div>
      </div>
    </div>
  );
}
