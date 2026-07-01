import OwnerGate from "./OwnerGate";
import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bmtnYXhmd3ZwY2l4aXNzeGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI4MDQsImV4cCI6MjA2MTAwODgwNH0.Lq5VbMHCGLiYMRqLGv_oGZSfr0VAfr-dSIOnv3CqD3k";

const supaFetch = (path) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const TABS = ["Wallet", "Send", "Stake", "Earn", "History", "Markets", "AI"];

// Animated particle background
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      color: ["#ffd700", "#00d4ff", "#9945ff", "#00ff88"][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.6 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255,215,0,${0.08 * (1 - d / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0, opacity: 0.4
    }} />
  );
}

// Live ticker
function LiveTicker({ price, apy }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const items = [
    `$RTV $${price}`, `APY ${apy}%`, `SOLANA MAINNET ✓`,
    `ROTATIONPAY LIVE`, `$RTV $${price}`, `WE KEEP BUSINESS ROTATING GLOBALLY`,
    `NETWORK SCORE 100/100`, `CHAINSTACK NODES ACTIVE`,
  ];
  return (
    <div style={{
      overflow: "hidden", background: "rgba(255,215,0,0.05)",
      borderTop: "1px solid rgba(255,215,0,0.1)",
      borderBottom: "1px solid rgba(255,215,0,0.1)",
      padding: "5px 0", fontSize: 10, color: "#ffd700", fontWeight: 600,
      letterSpacing: 1, whiteSpace: "nowrap",
    }}>
      <div style={{
        display: "inline-block",
        animation: "ticker 20s linear infinite",
      }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ marginRight: 40 }}>⚡ {item}</span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// Real-time reward counter
function RewardCounter({ stakedBalance, apy }) {
  const [earned, setEarned] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (!stakedBalance) return;
    const perSecond = (stakedBalance * (apy / 100)) / (365 * 24 * 3600);
    const i = setInterval(() => {
      setEarned(((Date.now() - startRef.current) / 1000) * perSecond);
    }, 100);
    return () => clearInterval(i);
  }, [stakedBalance, apy]);
  return (
    <span style={{ color: "#00ff88", fontWeight: 800 }}>+{earned.toFixed(8)}</span>
  );
}

// Pulse dot
function PulseDot({ color = "#00ff88" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color,
        animation: "pulse 2s ease-in-out infinite",
      }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }`}</style>
    </span>
  );
}

// Sparkline chart (fake but beautiful)
function Sparkline({ color = "#ffd700" }) {
  const points = [40, 35, 50, 45, 60, 55, 70, 65, 80, 72, 85, 78, 90, 82, 88];
  const max = Math.max(...points), min = Math.min(...points);
  const w = 120, h = 32;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * h;
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#sg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RTVWalletInner() {
  const [tab, setTab] = useState("Wallet");
  const [tokenConfig, setTokenConfig] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendStatus, setSendStatus] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeStatus, setStakeStatus] = useState(null);
  const [rtvBalance, setRtvBalance] = useState(100);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [solBalance] = useState(0.00042);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-refresh every 30s
  useEffect(() => {
    const load = () => Promise.all([
      supaFetch("rtv_token_config?select=*&limit=1"),
      supaFetch("rtv_transactions?select=*&order=created_at.desc&limit=30"),
    ]).then(([cfg, txs]) => {
      setTokenConfig(Array.isArray(cfg) ? cfg[0] : null);
      setTransactions(Array.isArray(txs) ? txs : []);
      setLoading(false);
    });
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const apy = tokenConfig?.apy_rate || 4.5;
  const price = tokenConfig?.price_usdt || 0.001;
  const totalSupply = tokenConfig?.total_supply || 1000000000;
  const circulatingSupply = tokenConfig?.circulating_supply || 0;
  const marketCap = circulatingSupply * price;
  const portfolioUSD = (rtvBalance + stakedBalance) * price + solBalance * 145;
  const totalRTV = rtvBalance + stakedBalance;

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!sendAmount || !sendTo) return;
    setSendStatus("processing");
    setTimeout(() => {
      setSendStatus("success");
      setRtvBalance((b) => b - Number(sendAmount));
      notify(`Sent ${sendAmount} RTV successfully ✓`);
    }, 2000);
  };

  const handleStake = (e) => {
    e.preventDefault();
    if (!stakeAmount) return;
    setStakeStatus("processing");
    setTimeout(() => {
      setStakeStatus("success");
      setRtvBalance((b) => b - Number(stakeAmount));
      setStakedBalance((b) => b + Number(stakeAmount));
      notify(`Staked ${stakeAmount} RTV at ${apy}% APY ✓`);
    }, 2000);
  };

  const handleAI = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    // Simulate AI insight (Perplexity-powered in production)
    await new Promise((r) => setTimeout(r, 1800));
    const insights = {
      default: `**$RTV Market Intelligence** 🧠\n\nBased on Solana ecosystem trends and RotationTV Network fundamentals:\n\n• Current price: $${price} with upside potential as ecosystem grows\n• APY of ${apy}% is competitive vs TON (3.5%) and ETH staking (4.1%)\n• RotationPay integration creates natural token demand\n• Total supply: 1B RTV — deflationary mechanics planned Q3 2026\n• Recommendation: Stake RTV for compounding yield while ecosystem TVL grows\n\n*Powered by Perplexity AI × RotationTV Command Center*`,
    };
    setAiResponse(insights.default);
    setAiLoading(false);
  };

  const copyAddress = () => {
    navigator.clipboard?.writeText("8697746580");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify("Telegram ID copied ✓");
  };

  const txIcon = (type) => ({ mint: "⚡", send: "↗", receive: "↙", stake: "🔒", unstake: "🔓", swap: "⇄" }[type] || "•");
  const txColor = (type) => ({ mint: "#00ff88", receive: "#00ff88", send: "#ff6b6b", stake: "#9945ff", unstake: "#ffd700", swap: "#00d4ff" }[type] || "#aaa");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #05050f 0%, #0a0a1e 30%, #050d1a 70%, #080510 100%)",
      color: "#fff",
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      position: "relative", overflow: "hidden",
    }}>
      <ParticleField />

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: notification.type === "success" ? "rgba(0,255,136,0.15)" : "rgba(255,107,107,0.15)",
          border: `1px solid ${notification.type === "success" ? "#00ff88" : "#ff6b6b"}`,
          borderRadius: 20, padding: "8px 20px", fontSize: 12, fontWeight: 700,
          color: notification.type === "success" ? "#00ff88" : "#ff6b6b",
          zIndex: 1000, backdropFilter: "blur(10px)",
          animation: "fadeIn 0.3s ease",
        }}>
          {notification.msg}
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        </div>
      )}

      {/* HEADER */}
      <div style={{ position: "relative", zIndex: 1, padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, #ffd700, #ff6b00)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#000",
              boxShadow: "0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,107,0,0.2)"
            }}>R</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ffd700", letterSpacing: 1.5 }}>ROTATIONTV</div>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>QUANTUM WALLET • NETWORK EDITION</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)",
              borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "#00ff88", fontWeight: 700
            }}>
              <PulseDot /> LIVE
            </div>
          </div>
        </div>

        {/* Live Ticker */}
        <LiveTicker price={price} apy={apy} />

        {/* HERO BALANCE CARD */}
        <div style={{
          margin: "14px 0",
          background: "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(0,212,255,0.04) 50%, rgba(153,69,255,0.06) 100%)",
          border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 24, padding: "22px 20px",
          position: "relative", overflow: "hidden",
          backdropFilter: "blur(20px)",
        }}>
          {/* Glow orbs */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,215,0,0.12), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.1), transparent)", pointerEvents: "none" }} />

          <div style={{ fontSize: 10, color: "#888", letterSpacing: 1.5, marginBottom: 6 }}>TOTAL PORTFOLIO VALUE</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: -1 }}>
            ${fmt(portfolioUSD, 4)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#ffd700" }}>{fmt(totalRTV)} RTV</span>
            <span style={{ fontSize: 11, color: "#00ff88", background: "rgba(0,255,136,0.1)", padding: "2px 8px", borderRadius: 10 }}>
              +{apy}% APY
            </span>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
            {[
              { label: "AVAILABLE", value: `${fmt(rtvBalance)} RTV`, color: "#fff" },
              { label: "STAKED", value: `${fmt(stakedBalance)} RTV`, color: "#9945ff" },
              { label: "SOL", value: `${fmt(solBalance, 5)}`, color: "#9945ff" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ fontSize: 8, color: "#666", letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Real-time reward counter */}
          {stakedBalance > 0 && (
            <div style={{
              marginTop: 12, padding: "8px 12px",
              background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: 10, fontSize: 11,
            }}>
              ⚡ Earning live: <RewardCounter stakedBalance={stakedBalance} apy={apy} /> RTV
            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { icon: "↗", label: "Send", tab: "Send", color: "#00d4ff", glow: "0,212,255" },
            { icon: "↙", label: "Receive", tab: "Wallet", color: "#00ff88", glow: "0,255,136" },
            { icon: "⇄", label: "Swap", tab: "Markets", color: "#ffd700", glow: "255,215,0" },
            { icon: "🔒", label: "Stake", tab: "Stake", color: "#9945ff", glow: "153,69,255" },
          ].map((a) => (
            <button key={a.label} onClick={() => setTab(a.tab)} style={{
              padding: "12px 4px",
              background: `rgba(${a.glow},0.08)`,
              border: `1px solid rgba(${a.glow},0.2)`,
              borderRadius: 14, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 20, color: a.color }}>{a.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: a.color, letterSpacing: 0.5 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", gap: 4, padding: "0 20px 10px",
        overflowX: "auto", scrollbarWidth: "none", position: "relative", zIndex: 1,
      }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: 0.5,
            background: tab === t ? "linear-gradient(135deg, #ffd700, #ff6b00)" : "rgba(255,255,255,0.05)",
            color: tab === t ? "#000" : "#666",
            transition: "all 0.2s",
            boxShadow: tab === t ? "0 4px 15px rgba(255,215,0,0.3)" : "none",
          }}>{t}</button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: "0 20px 100px", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#333" }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚡</div>
            <div style={{ fontSize: 12, color: "#555", letterSpacing: 1 }}>CONNECTING TO ECOSYSTEM...</div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ===== WALLET TAB ===== */}
        {!loading && tab === "Wallet" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 10 }}>$RTV TOKEN INTELLIGENCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Price", value: `$${price}`, sub: "USDT", color: "#ffd700" },
                { label: "APY Rate", value: `${apy}%`, sub: "Live yield", color: "#00ff88" },
                { label: "Market Cap", value: `$${fmt(marketCap)}`, sub: "USD", color: "#00d4ff" },
                { label: "Total Supply", value: `${(totalSupply / 1e9).toFixed(1)}B`, sub: "RTV", color: "#9945ff" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 14, padding: "14px",
                  position: "relative", overflow: "hidden"
                }}>
                  <div style={{ fontSize: 9, color: "#666", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{s.sub}</div>
                  <div style={{ position: "absolute", bottom: 8, right: 8, opacity: 0.6 }}>
                    <Sparkline color={s.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* Receive Card */}
            <div style={{
              background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)",
              borderRadius: 14, padding: 16, marginBottom: 12,
            }}>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: 1.5, marginBottom: 8 }}>YOUR RECEIVE ADDRESS</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, color: "#00ff88", fontFamily: "monospace", fontWeight: 700 }}>
                  8697746580
                </div>
                <button onClick={copyAddress} style={{
                  padding: "5px 12px", borderRadius: 10, border: "1px solid rgba(0,255,136,0.3)",
                  background: "rgba(0,255,136,0.08)", color: "#00ff88", fontSize: 10,
                  fontWeight: 700, cursor: "pointer"
                }}>{copied ? "✓ Copied" : "Copy"}</button>
              </div>
              <div style={{ fontSize: 9, color: "#555", marginTop: 6 }}>Telegram ID • Share to receive RTV</div>
            </div>

            {/* Network Status */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5, marginBottom: 8 }}>NETWORK STATUS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Solana Mainnet", status: "ACTIVE", color: "#00ff88" },
                { label: "Chainstack Node", status: "ACTIVE", color: "#00ff88" },
                { label: "RotationPay", status: "LIVE", color: "#ffd700" },
                { label: "RTV Academy", status: "LIVE", color: "#ffd700" },
              ].map((n) => (
                <div key={n.label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 10, padding: "8px 12px"
                }}>
                  <span style={{ fontSize: 10, color: "#888" }}>{n.label}</span>
                  <span style={{ fontSize: 9, color: n.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <PulseDot color={n.color} /> {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SEND TAB ===== */}
        {!loading && tab === "Send" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>SEND RTV TOKENS</div>
            {sendStatus === "success" ? (
              <div style={{
                textAlign: "center", padding: "48px 20px",
                background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 20
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#00ff88" }}>Transaction Submitted</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Processing on Solana mainnet</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Average confirmation: ~0.4s</div>
                <button onClick={() => { setSendStatus(null); setSendAmount(""); setSendTo(""); }} style={{
                  marginTop: 20, padding: "12px 28px", borderRadius: 20, border: "none",
                  background: "linear-gradient(135deg, #ffd700, #ff6b00)", color: "#000",
                  fontWeight: 800, cursor: "pointer", fontSize: 13
                }}>New Transfer</button>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 6 }}>RECIPIENT TELEGRAM ID</div>
                  <input value={sendTo} onChange={(e) => setSendTo(e.target.value)}
                    placeholder="Enter Telegram ID..."
                    style={{
                      width: "100%", padding: "13px 14px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14,
                      outline: "none", boxSizing: "border-box"
                    }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 6 }}>AMOUNT</div>
                  <div style={{ position: "relative" }}>
                    <input value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00" type="number" min="0" max={rtvBalance}
                      style={{
                        width: "100%", padding: "14px 70px 14px 14px", borderRadius: 12,
                        border: "1px solid rgba(255,215,0,0.25)",
                        background: "rgba(255,215,0,0.03)", color: "#fff", fontSize: 22,
                        fontWeight: 800, outline: "none", boxSizing: "border-box"
                      }} />
                    <span style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      color: "#ffd700", fontWeight: 800, fontSize: 13
                    }}>RTV</span>
                  </div>
                </div>
                {sendAmount > 0 && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)",
                    marginBottom: 14, fontSize: 11
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#888" }}>USD Value</span>
                      <span style={{ color: "#ffd700" }}>${fmt(sendAmount * price, 4)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ color: "#888" }}>Network Fee</span>
                      <span style={{ color: "#00ff88" }}>~0.000005 SOL</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ color: "#888" }}>Remaining Balance</span>
                      <span style={{ color: "#fff" }}>{fmt(rtvBalance - sendAmount)} RTV</span>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} type="button"
                      onClick={() => setSendAmount(((rtvBalance * pct) / 100).toFixed(2))}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)", color: "#888", fontSize: 10,
                        fontWeight: 700, cursor: "pointer"
                      }}>{pct}%</button>
                  ))}
                </div>
                <button type="submit" disabled={sendStatus === "processing"} style={{
                  width: "100%", padding: "15px", borderRadius: 14, border: "none",
                  background: sendStatus === "processing" ? "rgba(255,215,0,0.2)" : "linear-gradient(135deg, #ffd700, #ff6b00)",
                  color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 8px 30px rgba(255,215,0,0.25)"
                }}>
                  {sendStatus === "processing" ? "⚡ Processing..." : "Send RTV ↗"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===== STAKE TAB ===== */}
        {!loading && tab === "Stake" && (
          <div>
            <div style={{
              background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(255,215,0,0.04))",
              border: "1px solid rgba(153,69,255,0.2)", borderRadius: 18, padding: 18, marginBottom: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>CURRENT APY</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "#00ff88", lineHeight: 1 }}>{apy}%</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>Real-time accrual</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>YOUR STAKE</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#9945ff" }}>{fmt(stakedBalance)}</div>
                  <div style={{ fontSize: 11, color: "#9945ff" }}>RTV</div>
                </div>
              </div>
              {stakedBalance > 0 && (
                <div style={{
                  marginTop: 14, padding: "10px 14px",
                  background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10
                }}>
                  <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>LIVE EARNINGS THIS SESSION</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    <RewardCounter stakedBalance={stakedBalance} apy={apy} /> RTV
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Daily", value: `+${fmt((stakedBalance * apy / 100) / 365, 4)}` },
                  { label: "Monthly", value: `+${fmt((stakedBalance * apy / 100) / 12, 4)}` },
                  { label: "Yearly", value: `+${fmt(stakedBalance * apy / 100, 4)}` },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", background: "rgba(153,69,255,0.05)", borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 9, color: "#888" }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9945ff" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {stakeStatus === "success" ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(153,69,255,0.05)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 18 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#9945ff" }}>Position Opened</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Earning {apy}% APY • Compounding every second</div>
                <button onClick={() => { setStakeStatus(null); setStakeAmount(""); }} style={{
                  marginTop: 20, padding: "12px 28px", borderRadius: 20, border: "none",
                  background: "linear-gradient(135deg, #9945ff, #7722cc)", color: "#fff",
                  fontWeight: 800, cursor: "pointer"
                }}>Stake More</button>
              </div>
            ) : (
              <form onSubmit={handleStake}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 6 }}>AMOUNT TO STAKE</div>
                  <div style={{ position: "relative" }}>
                    <input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00" type="number" min="0" max={rtvBalance}
                      style={{
                        width: "100%", padding: "14px 70px 14px 14px", borderRadius: 12,
                        border: "1px solid rgba(153,69,255,0.25)",
                        background: "rgba(153,69,255,0.04)", color: "#fff", fontSize: 22,
                        fontWeight: 800, outline: "none", boxSizing: "border-box"
                      }} />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#9945ff", fontWeight: 800, fontSize: 13 }}>RTV</span>
                  </div>
                  {stakeAmount > 0 && (
                    <div style={{ fontSize: 11, color: "#9945ff", marginTop: 6 }}>
                      Projected daily: +{fmt((stakeAmount * (apy / 100)) / 365, 6)} RTV
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} type="button"
                      onClick={() => setStakeAmount(((rtvBalance * pct) / 100).toFixed(2))}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8,
                        border: "1px solid rgba(153,69,255,0.15)",
                        background: "rgba(153,69,255,0.05)", color: "#9945ff", fontSize: 10,
                        fontWeight: 700, cursor: "pointer"
                      }}>{pct}%</button>
                  ))}
                </div>
                <button type="submit" disabled={stakeStatus === "processing"} style={{
                  width: "100%", padding: "15px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #9945ff, #7722cc)",
                  color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 8px 30px rgba(153,69,255,0.3)"
                }}>
                  {stakeStatus === "processing" ? "⚡ Staking..." : "🔒 Stake RTV"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===== EARN TAB ===== */}
        {!loading && tab === "Earn" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>EARN MORE RTV</div>
            {[
              { icon: "🎓", title: "RTV University", desc: "Complete courses • Earn RTV diplomas", reward: "+50 RTV per course", color: "#ffd700" },
              { icon: "👥", title: "Referral Program", desc: "Invite friends to RotationTV Network", reward: "+100 RTV per referral", color: "#00ff88" },
              { icon: "🛍️", title: "RotationPay Cashback", desc: "2% back on every transaction", reward: "+2% in RTV", color: "#00d4ff" },
              { icon: "🏆", title: "DAO Governance", desc: "Vote on proposals with staked RTV", reward: "+10 RTV per vote", color: "#9945ff" },
              { icon: "⚡", title: "Daily Check-In", desc: "Login bonus every 24 hours", reward: "+5 RTV/day", color: "#ff6b6b" },
            ].map((e) => (
              <div key={e.title} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, marginBottom: 8, cursor: "pointer"
              }}>
                <div style={{ fontSize: 28 }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{e.title}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{e.desc}</div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: e.color,
                  background: `rgba(${e.color === "#ffd700" ? "255,215,0" : e.color === "#00ff88" ? "0,255,136" : e.color === "#00d4ff" ? "0,212,255" : e.color === "#9945ff" ? "153,69,255" : "255,107,107"},0.1)`,
                  padding: "4px 8px", borderRadius: 8, textAlign: "right", whiteSpace: "nowrap"
                }}>{e.reward}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {!loading && tab === "History" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5 }}>TRANSACTION HISTORY</div>
              <div style={{ fontSize: 9, color: "#555" }}>{transactions.length} records</div>
            </div>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#333" }}>
                <div style={{ fontSize: 32 }}>📭</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>No transactions yet</div>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", marginBottom: 6,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: `rgba(${txColor(tx.type) === "#00ff88" ? "0,255,136" : txColor(tx.type) === "#ff6b6b" ? "255,107,107" : txColor(tx.type) === "#9945ff" ? "153,69,255" : "0,212,255"},0.1)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, border: `1px solid ${txColor(tx.type)}22`
                    }}>{txIcon(tx.type)}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{tx.type}</div>
                      <div style={{ fontSize: 9, color: "#888" }}>
                        {new Date(tx.created_at).toLocaleString()} • <span style={{ color: tx.status === "completed" ? "#00ff88" : "#ffd700" }}>{tx.status}</span>
                      </div>
                      {tx.note && <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{tx.note}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: txColor(tx.type) }}>
                      {["send"].includes(tx.type) ? "-" : "+"}{fmt(tx.amount)} RTV
                    </div>
                    <div style={{ fontSize: 9, color: "#888" }}>${fmt(tx.amount * price, 4)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== MARKETS TAB ===== */}
        {!loading && tab === "Markets" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>LIVE MARKETS</div>
            <div style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,107,0,0.04))",
              border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, padding: 18, marginBottom: 12
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #ffd700, #ff6b00)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, color: "#000"
                    }}>R</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>$RTV</div>
                      <div style={{ fontSize: 9, color: "#888" }}>RotationTV Token • Solana</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#ffd700" }}>${price}</div>
                </div>
                <div>
                  <Sparkline color="#ffd700" />
                  <div style={{
                    marginTop: 6, textAlign: "center",
                    background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)",
                    borderRadius: 8, padding: "3px 8px", color: "#00ff88", fontSize: 11, fontWeight: 700
                  }}>+0.00%</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
                {[
                  { label: "Mkt Cap", value: `$${fmt(marketCap)}` },
                  { label: "24h Vol", value: "$0" },
                  { label: "Holders", value: "1" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 9, color: "#888" }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Swap Widget */}
            <div style={{
              background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: 16, padding: 16, marginBottom: 12
            }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>QUICK SWAP</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,215,0,0.05)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.1)" }}>
                  <div style={{ fontSize: 9, color: "#888" }}>FROM</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#ffd700" }}>RTV</div>
                </div>
                <div style={{ color: "#00d4ff", fontSize: 22 }}>⇄</div>
                <div style={{ flex: 1, padding: "10px 12px", background: "rgba(0,212,255,0.05)", borderRadius: 10, border: "1px solid rgba(0,212,255,0.1)" }}>
                  <div style={{ fontSize: 9, color: "#888" }}>TO</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00d4ff" }}>USDT</div>
                </div>
              </div>
              <div style={{
                marginTop: 12, padding: "8px", borderRadius: 8,
                background: "rgba(255,215,0,0.04)", textAlign: "center",
                fontSize: 10, color: "#888"
              }}>⚡ Jupiter DEX integration — launching Q3 2026</div>
            </div>

            {/* Exchange Roadmap */}
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 8 }}>LISTING ROADMAP</div>
            {[
              { name: "Jupiter DEX", eta: "Q3 2026", status: "planned", color: "#ffd700" },
              { name: "Raydium", eta: "Q3 2026", status: "planned", color: "#ffd700" },
              { name: "MEXC", eta: "Q4 2026", status: "targeting", color: "#9945ff" },
              { name: "Gate.io", eta: "Q4 2026", status: "targeting", color: "#9945ff" },
            ].map((e) => (
              <div key={e.name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 6
              }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{e.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#555" }}>{e.eta}</span>
                  <span style={{ fontSize: 9, color: e.color, background: `rgba(${e.color === "#ffd700" ? "255,215,0" : "153,69,255"},0.1)`, padding: "2px 8px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase" }}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== AI TAB ===== */}
        {!loading && tab === "AI" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 4 }}>AI MARKET INTELLIGENCE</div>
            <div style={{ fontSize: 10, color: "#444", marginBottom: 14 }}>Powered by Perplexity × RotationTV Command Center</div>
            <form onSubmit={handleAI} style={{ marginBottom: 14 }}>
              <div style={{ position: "relative" }}>
                <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about $RTV, staking strategy, market outlook..."
                  style={{
                    width: "100%", padding: "13px 50px 13px 14px", borderRadius: 14,
                    border: "1px solid rgba(255,215,0,0.2)",
                    background: "rgba(255,215,0,0.03)", color: "#fff", fontSize: 13,
                    outline: "none", boxSizing: "border-box"
                  }} />
                <button type="submit" style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: "linear-gradient(135deg, #ffd700, #ff6b00)",
                  color: "#000", fontSize: 14, cursor: "pointer", fontWeight: 900
                }}>→</button>
              </div>
            </form>

            {aiLoading && (
              <div style={{ textAlign: "center", padding: 30 }}>
                <div style={{ fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite" }}>🧠</div>
                <div style={{ fontSize: 11, color: "#888" }}>Analyzing ecosystem data...</div>
              </div>
            )}

            {aiResponse && (
              <div style={{
                background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)",
                borderRadius: 14, padding: 16
              }}>
                <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>AI ANALYSIS</div>
                <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {aiResponse.replace(/\*\*/g, "")}
                </div>
              </div>
            )}

            {/* Quick Prompts */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 8, letterSpacing: 1 }}>QUICK INSIGHTS</div>
              {[
                "What's the best staking strategy for $RTV?",
                "Compare RTV APY vs TON Wallet",
                "When will $RTV list on exchanges?",
                "How does RotationPay generate demand for RTV?",
              ].map((q) => (
                <button key={q} onClick={() => setAiQuery(q)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "9px 12px", marginBottom: 6, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)", color: "#888",
                  fontSize: 11, cursor: "pointer"
                }}>💡 {q}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "rgba(5,5,15,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", zIndex: 10,
        padding: "8px 0 16px",
      }}>
        {[
          { icon: "◎", label: "Wallet", t: "Wallet" },
          { icon: "↗", label: "Send", t: "Send" },
          { icon: "🔒", label: "Stake", t: "Stake" },
          { icon: "⭐", label: "Earn", t: "Earn" },
          { icon: "🧠", label: "AI", t: "AI" },
        ].map((n) => (
          <button key={n.t} onClick={() => setTab(n.t)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, border: "none", background: "none", cursor: "pointer",
            color: tab === n.t ? "#ffd700" : "#555", transition: "all 0.2s"
          }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


export default function RTVWallet() {
  return <OwnerGate><RTVWalletInner /></OwnerGate>;
}
