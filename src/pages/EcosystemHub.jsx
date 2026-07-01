import OwnerGate from "./OwnerGate";
import { useState, useEffect, useRef } from "react";

const fmt = (n, d = 2) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function PulseDot({ color = "#00ff88" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "pdot 2s ease-in-out infinite" }} />
      <style>{`@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.6)}}`}</style>
    </span>
  );
}

function useLiveNum(base, variance = 0.001) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const i = setInterval(() => setVal(v => v + (Math.random() - 0.49) * base * variance), 2000);
    return () => clearInterval(i);
  }, []);
  return val;
}

const COMPANIES = [
  {
    id: "rotationpay", name: "RotationPay", icon: "💳", color: "#00d4ff",
    desc: "Universal payment gateway — PayPal + Stripe + Solana + Telegram Wallet + Venmo + Zelle + $RTV",
    stats: { volume: 132100, txCount: 869, uptime: "99.98%", status: "live" },
    url: "/RotationPayDashboard", badge: "FLAGSHIP"
  },
  {
    id: "rtv-wallet", name: "RTV Wallet", icon: "◎", color: "#ffd700",
    desc: "Telegram-native Web3 wallet with staking & yield",
    stats: { volume: 100, txCount: 1, uptime: "100%", status: "live" },
    url: "/RTVWallet", badge: "WEB3"
  },
  {
    id: "rtv-trade", name: "RTV Trade", icon: "📈", color: "#00ff88",
    desc: "Simple + advanced trading. Crypto & Forex pairs",
    stats: { volume: 0, txCount: 0, uptime: "99.9%", status: "live" },
    url: "/RTVTrading", badge: "NEW"
  },
  {
    id: "rotationcall", name: "RotationCall", icon: "📞", color: "#9945ff",
    desc: "Enterprise AI voice — the Twilio killer",
    stats: { volume: 0, txCount: 0, uptime: "99.5%", status: "beta" },
    url: null, badge: "BETA"
  },
  {
    id: "rtv-university", name: "RTV University", icon: "🎓", color: "#ff6b00",
    desc: "On-chain certified AI & Web3 education platform",
    stats: { volume: 0, txCount: 0, uptime: "100%", status: "beta" },
    url: null, badge: "BETA"
  },
  {
    id: "pretrial", name: "Pretrial Services", icon: "⚖️", color: "#00d4ff",
    desc: "Justice tech — AI-powered pretrial case management",
    stats: { volume: 0, txCount: 0, uptime: "100%", status: "beta" },
    url: null, badge: "BETA"
  },
  {
    id: "white-logistics", name: "White Logistics", icon: "🚚", color: "#ffd700",
    desc: "AI-powered logistics & supply chain optimization",
    stats: { volume: 0, txCount: 0, uptime: "100%", status: "beta" },
    url: null, badge: "BETA"
  },
  {
    id: "bigo-agency", name: "Bigo Agency", icon: "🎨", color: "#ff6b6b",
    desc: "Creative AI agency — branding, content, campaigns",
    stats: { volume: 0, txCount: 0, uptime: "100%", status: "beta" },
    url: null, badge: "BETA"
  },
  {
    id: "emergentlabs", name: "EmergentLabs", icon: "🔬", color: "#00ff88",
    desc: "Build infrastructure — AI-powered app development",
    stats: { volume: 0, txCount: 0, uptime: "99.9%", status: "live" },
    url: null, badge: "CORE"
  },
];

function CompanyCard({ company, onOpen }) {
  const vol = useLiveNum(company.stats.volume, 0.002);
  return (
    <div onClick={() => company.url && onOpen(company.url)}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${company.url ? company.color + "33" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 18, padding: "18px",
        cursor: company.url ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative", overflow: "hidden"
      }}>
      {/* Glow */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${company.color}20, transparent)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${company.color}18`, border: `1px solid ${company.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>{company.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{company.name}</div>
            <div style={{ fontSize: 9, color: company.status === "live" ? "#00ff88" : "#ffd700", display: "flex", alignItems: "center", gap: 4 }}>
              <PulseDot color={company.status === "live" ? "#00ff88" : "#ffd700"} />
              {company.status.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: 1,
            color: company.color, background: `${company.color}18`,
            padding: "3px 8px", borderRadius: 6, border: `1px solid ${company.color}33`
          }}>{company.badge}</span>
          {company.url && <span style={{ fontSize: 9, color: company.color }}>→ Open</span>}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>{company.desc}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {[
          { label: "Volume", value: `$${fmt(vol)}` },
          { label: "Uptime", value: company.stats.uptime },
          { label: "TXs", value: company.stats.txCount.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#666" }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: company.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcosystemHubInner() {
  const [filter, setFilter] = useState("all");
  const [globalVolume] = useState(132200);
  const liveVol = useLiveNum(globalVolume, 0.001);
  const [tab, setTab] = useState("companies");

  const handleOpen = (url) => {
    window.location.href = url;
  };

  const liveCompanies = COMPANIES.filter(c => c.stats.status === "live");
  const filtered = filter === "all" ? COMPANIES : COMPANIES.filter(c => c.stats.status === filter);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #030309 0%, #080818 50%, #030608 100%)",
      color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* HERO HEADER */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,215,0,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,215,0,0.1)",
        padding: "30px 20px 24px",
        textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 200, background: "radial-gradient(circle, rgba(255,215,0,0.06), transparent)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg,#ffd700,#ff6b00)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "#000",
            boxShadow: "0 0 40px rgba(255,215,0,0.6)"
          }}>R</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#ffd700", letterSpacing: 2 }}>ROTATIONTV</div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1 }}>NETWORK ECOSYSTEM</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
          "We Keep Business Rotating Globally" — {liveCompanies.length} companies live
        </div>

        {/* Global KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 600, margin: "0 auto" }}>
          {[
            { label: "Ecosystem Volume", value: `$${fmt(liveVol)}`, color: "#ffd700" },
            { label: "Live Companies", value: liveCompanies.length, color: "#00ff88" },
            { label: "$RTV Price", value: "$0.001", color: "#9945ff" },
            { label: "Network Score", value: "100/100", color: "#00d4ff" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px" }}>
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE TICKER */}
      <div style={{ overflow: "hidden", background: "rgba(255,215,0,0.04)", borderBottom: "1px solid rgba(255,215,0,0.08)", padding: "5px 0", fontSize: 10, color: "#ffd700", fontWeight: 600, whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "htick 25s linear infinite" }}>
          {[...Array(2)].map((_, ri) => (
            COMPANIES.map(c => (
              <span key={`${ri}-${c.id}`} style={{ marginRight: 40 }}>
                ⚡ {c.name} — {c.stats.status.toUpperCase()}
              </span>
            ))
          ))}
        </div>
        <style>{`@keyframes htick{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "16px 20px 0", overflowX: "auto", scrollbarWidth: "none" }}>
        {["companies", "analytics", "roadmap"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            background: tab === t ? "linear-gradient(135deg,#ffd700,#ff6b00)" : "rgba(255,255,255,0.05)",
            color: tab === t ? "#000" : "#666",
            boxShadow: tab === t ? "0 4px 15px rgba(255,215,0,0.3)" : "none"
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 60px" }}>
        {/* COMPANIES */}
        {tab === "companies" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {["all", "live", "beta"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                  background: filter === f ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                  color: filter === f ? "#fff" : "#555"
                }}>{f} {f === "all" ? `(${COMPANIES.length})` : f === "live" ? `(${COMPANIES.filter(c => c.stats.status === "live").length})` : `(${COMPANIES.filter(c => c.stats.status === "beta").length})`}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.map(company => (
                <CompanyCard key={company.id} company={company} onOpen={handleOpen} />
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Total Ecosystem TVL", value: "$132,200", change: "+12.4%", color: "#ffd700" },
                { label: "Daily Active Users", value: "1", change: "+0%", color: "#00ff88" },
                { label: "$RTV Staked", value: "0 RTV", change: "—", color: "#9945ff" },
                { label: "NFTs Minted", value: "0", change: "—", color: "#00d4ff" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px" }}>
                  <div style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginTop: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: s.change.startsWith("+") ? "#00ff88" : "#888", marginTop: 4 }}>{s.change}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 10 }}>COMPANY STATUS MATRIX</div>
            {COMPANIES.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", marginBottom: 4, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{c.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 10 }}>
                  <span style={{ color: "#888" }}>Uptime: <b style={{ color: "#00ff88" }}>{c.stats.uptime}</b></span>
                  <span style={{ color: "#888" }}>Vol: <b style={{ color: c.color }}>${fmt(c.stats.volume)}</b></span>
                  <span style={{ color: c.stats.status === "live" ? "#00ff88" : "#ffd700", fontWeight: 700, background: c.stats.status === "live" ? "rgba(0,255,136,0.1)" : "rgba(255,215,0,0.1)", padding: "2px 8px", borderRadius: 6, fontSize: 8 }}>{c.stats.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROADMAP */}
        {tab === "roadmap" && (
          <div>
            {[
              {
                phase: "Phase 1 — IGNITION", time: "Now → Q2 2026", color: "#00ff88", done: true,
                items: [
                  { label: "RotationPay live (6 rails)", done: true },
                  { label: "RTV Wallet launched on Telegram", done: true },
                  { label: "RTV Trading platform (Simple + Advanced)", done: true },
                  { label: "$RTV token deployed on Solana", done: true },
                  { label: "Chainstack nodes active", done: true },
                  { label: "AI Command Center operational", done: true },
                ]
              },
              {
                phase: "Phase 2 — AMPLIFICATION", time: "Q3 2026", color: "#ffd700", done: false,
                items: [
                  { label: "Jupiter DEX RTV/USDT live", done: false },
                  { label: "Raydium liquidity pool", done: false },
                  { label: "RTV University first cohort", done: false },
                  { label: "RotationCall beta → public", done: false },
                  { label: "RotationPay 100 merchants", done: false },
                  { label: "10,000 email subscribers", done: false },
                ]
              },
              {
                phase: "Phase 3 — DOMINATION", time: "Q4 2026", color: "#9945ff", done: false,
                items: [
                  { label: "MEXC / Gate.io listing", done: false },
                  { label: "Forbes / TechCrunch feature", done: false },
                  { label: "$5M+ ecosystem TVL", done: false },
                  { label: "RTV NFT diplomas minted", done: false },
                  { label: "LATAM + Africa expansion", done: false },
                  { label: "White Logistics AI launch", done: false },
                ]
              },
            ].map(phase => (
              <div key={phase.phase} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: phase.color }}>{phase.phase}</div>
                  <div style={{ fontSize: 10, color: "#888", background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 10 }}>{phase.time}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {phase.items.map(item => (
                    <div key={item.label} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)", borderRadius: 8,
                      border: `1px solid ${item.done ? phase.color + "33" : "rgba(255,255,255,0.04)"}`
                    }}>
                      <span style={{ fontSize: 12, color: item.done ? phase.color : "#555" }}>{item.done ? "✓" : "○"}</span>
                      <span style={{ fontSize: 10, color: item.done ? "#ccc" : "#666" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function EcosystemHub() {
  return <OwnerGate><EcosystemHubInner /></OwnerGate>;
}
