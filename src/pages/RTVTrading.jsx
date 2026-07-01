// RTVTrading.jsx — Sovereign Vault Trading Floor
// Jupiter Terminal + Solana Actions/Blinks
// Presidential Authority: Darrel | RotationTV Network
// "Learn it. Live it. Love it."

import { useState, useEffect, useRef } from "react";

const TOKENS = [
  { symbol: "SOL",  name: "Solana",          mint: "So11111111111111111111111111111111111111112",  color: "#9945FF", icon: "◎" },
  { symbol: "RTVS", name: "RTV Token",        mint: "GStxrfBdQvPb2hEdSR8ehrw6Es2rcaGSVAGwRNEHCHTL", color: "#FFD700", icon: "⚡" },
  { symbol: "mSOL", name: "Marinade SOL",     mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", color: "#00FF88", icon: "🌊", apy: "7.2%" },
  { symbol: "JitoSOL", name: "Jito Staked SOL", mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", color: "#00D4FF", icon: "⚡", apy: "6.8%" },
  { symbol: "USDC", name: "USD Coin",         mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", color: "#2775CA", icon: "💵" },
];

const BLINKS = [
  { id: "buy-rtvs",   label: "Buy $RTVS",      icon: "⚡", desc: "Swap SOL → $RTVS at best price", color: "#FFD700" },
  { id: "stake-msol", label: "Stake → mSOL",    icon: "🌊", desc: "Earn ~7.2% APY via Marinade",   color: "#00FF88" },
  { id: "stake-jito", label: "Stake → JitoSOL", icon: "🎯", desc: "Earn ~6.8% + MEV via Jito",     color: "#00D4FF" },
  { id: "usdc-sol",   label: "USDC → SOL",      icon: "🔄", desc: "Convert stablecoin to SOL",     color: "#9945FF" },
];

export default function RTVTrading() {
  const [activeToken, setActiveToken] = useState(TOKENS[0]);
  const [outputToken, setOutputToken] = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blinkStep, setBlinkStep] = useState(null); // null | 'quote' | 'confirm' | 'success'
  const [txHistory, setTxHistory] = useState([]);
  const [tab, setTab] = useState("swap"); // swap | blinks | yield
  const jupRef = useRef(null);

  // Load Jupiter Terminal
  useEffect(() => {
    if (tab !== "swap") return;
    const existing = document.getElementById("jup-script");
    if (existing) {
      initJupiter();
      return;
    }
    const script = document.createElement("script");
    script.id = "jup-script";
    script.src = "https://terminal.jup.ag/main-v3.js";
    script.setAttribute("data-preload", "");
    script.onload = initJupiter;
    document.head.appendChild(script);
  }, [tab, activeToken, outputToken]);

  function initJupiter() {
    if (!window.Jupiter) return;
    window.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: "jupiter-terminal",
      endpoint: "https://solana-mainnet.core.chainstack.com",
      defaultExplorer: "Solscan",
      formProps: {
        initialInputMint: activeToken.mint,
        initialOutputMint: outputToken.mint,
        fixedOutputMint: false,
      },
      onSuccess: ({ txid, swapResult }) => {
        setTxHistory(prev => [{
          txid,
          from: activeToken.symbol,
          to: outputToken.symbol,
          ts: new Date().toLocaleTimeString(),
        }, ...prev.slice(0, 9)]);
        setBlinkStep("success");
        setTimeout(() => setBlinkStep(null), 3000);
      },
    });
  }

  // Simulated quote fetch (replace with real Jupiter quote API)
  async function fetchQuote() {
    if (!amount || isNaN(amount)) return;
    setLoading(true);
    setBlinkStep("quote");
    await new Promise(r => setTimeout(r, 800));
    const rate = activeToken.symbol === "SOL" ? 142.5 : 0.007;
    setQuote({
      inAmount: parseFloat(amount),
      outAmount: (parseFloat(amount) * rate).toFixed(4),
      priceImpact: "0.03%",
      fee: "0.0025 SOL",
      route: `${activeToken.symbol} → Jupiter → ${outputToken.symbol}`,
    });
    setLoading(false);
    setBlinkStep("confirm");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07070f",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "80px",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 12px",
        borderBottom: "1px solid rgba(255,215,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFD700" }}>⚡ Trading Floor</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Powered by Jupiter · Chainstack RPC
          </div>
        </div>
        <div style={{
          padding: "4px 10px",
          borderRadius: 20,
          background: "rgba(0,255,136,0.1)",
          border: "1px solid rgba(0,255,136,0.3)",
          fontSize: 11,
          color: "#00FF88",
          fontWeight: 600,
        }}>● LIVE</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
        {[
          { id: "swap",   label: "🔄 Swap" },
          { id: "blinks", label: "⚡ Blinks" },
          { id: "yield",  label: "💰 Yield" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #FFD700" : "2px solid transparent",
              color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.4)",
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SWAP TAB ── */}
      {tab === "swap" && (
        <div style={{ padding: "0 16px" }}>
          {/* Token selector row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
            {TOKENS.map(t => (
              <button
                key={t.symbol}
                onClick={() => { setActiveToken(t); setQuote(null); setBlinkStep(null); }}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${activeToken.symbol === t.symbol ? t.color : "rgba(255,255,255,0.1)"}`,
                  background: activeToken.symbol === t.symbol ? `${t.color}20` : "rgba(255,255,255,0.03)",
                  color: activeToken.symbol === t.symbol ? t.color : "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t.icon} {t.symbol}
              </button>
            ))}
          </div>

          {/* Jupiter Terminal */}
          <div
            id="jupiter-terminal"
            ref={jupRef}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,215,0,0.1)",
              minHeight: 460,
              background: "rgba(255,255,255,0.02)",
            }}
          />

          {/* Recent swaps */}
          {txHistory.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Recent Swaps</div>
              {txHistory.slice(0, 3).map((tx, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  marginBottom: 6,
                }}>
                  <span style={{ fontSize: 13, color: "#fff" }}>
                    {tx.from} → {tx.to}
                  </span>
                  <a
                    href={`https://solscan.io/tx/${tx.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#00D4FF" }}
                  >
                    {tx.ts} ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BLINKS TAB ── */}
      {tab === "blinks" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
            One-tap Solana Actions — sign and confirm in seconds
          </div>

          {blinkStep === "success" && (
            <div style={{
              padding: 16, borderRadius: 16, marginBottom: 16,
              background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)",
              textAlign: "center", fontSize: 15, color: "#00FF88", fontWeight: 700,
            }}>
              ✅ Transaction Confirmed!
            </div>
          )}

          {BLINKS.map(blink => (
            <div
              key={blink.id}
              style={{
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${blink.color}22`,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{blink.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: blink.color }}>{blink.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{blink.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => setBlinkStep("success")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: `linear-gradient(135deg, ${blink.color}cc, ${blink.color}88)`,
                    color: "#000",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Execute
                </button>
              </div>

              {/* Amount input for this blink */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  type="number"
                  placeholder="Amount in SOL"
                  value={blink.id === "buy-rtvs" ? amount : ""}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Fund via PayPal */}
          <a
            href="https://www.paypal.com/ncp/payment/F45K2VWDBVQHY"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "14px",
              borderRadius: 14,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
              background: "linear-gradient(135deg, #003087, #009cde)",
              textDecoration: "none",
              marginTop: 8,
            }}
          >
            💳 Add Funds via PayPal
          </a>
        </div>
      )}

      {/* ── YIELD TAB ── */}
      {tab === "yield" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
            Stake your SOL and earn while you hold
          </div>

          {/* $RTVS Staking Tiers */}
          <div style={{
            padding: 16, borderRadius: 16, marginBottom: 12,
            background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFD700", marginBottom: 12 }}>
              ⚡ $RTVS Staking Tiers
            </div>
            {[
              { tier: "Starter",   amount: "2,500 RTVS",  price: "$99",    mult: "1×", color: "#FFD700" },
              { tier: "Builder",   amount: "10,000 RTVS", price: "$349",   mult: "2×", color: "#00D4FF" },
              { tier: "Sovereign", amount: "50,000 RTVS", price: "$1,499", mult: "5×", color: "#FF6B35" },
            ].map(t => (
              <div key={t.tier} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: t.color }}>{t.tier}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.amount} · {t.price}</div>
                </div>
                <div style={{
                  padding: "4px 12px", borderRadius: 20,
                  background: `${t.color}20`, border: `1px solid ${t.color}40`,
                  fontSize: 12, fontWeight: 700, color: t.color,
                }}>
                  {t.mult} APY
                </div>
              </div>
            ))}
          </div>

          {/* Liquid Staking */}
          <div style={{
            padding: 16, borderRadius: 16, marginBottom: 12,
            background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00FF88", marginBottom: 12 }}>
              🌊 Liquid Staking (via Jupiter)
            </div>
            {[
              { name: "mSOL",    protocol: "Marinade Finance", apy: "~7.2%", color: "#00FF88", note: "Liquid, unstake anytime" },
              { name: "JitoSOL", protocol: "Jito Network",     apy: "~6.8%", color: "#00D4FF", note: "MEV-enhanced yield" },
            ].map(s => (
              <div key={s.name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.protocol} · {s.note}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.apy}</div>
                  <button
                    onClick={() => { setActiveToken(TOKENS[0]); setOutputToken(TOKENS.find(t => t.symbol === s.name) || TOKENS[2]); setTab("swap"); }}
                    style={{
                      marginTop: 4, padding: "3px 10px", borderRadius: 8,
                      border: `1px solid ${s.color}50`, background: `${s.color}15`,
                      color: s.color, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Stake →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6,
          }}>
            ⚠️ APY rates are variable and not guaranteed. Crypto staking involves risk.
            Not financial advice. U.S. users: USDY and certain yield products may not be available.
            Consult legal counsel before offering managed execution services.
          </div>
        </div>
      )}
    </div>
  );
}
