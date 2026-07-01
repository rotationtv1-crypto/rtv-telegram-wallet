// RTV Web3 Command — Claude-Powered Unified Intelligence
// Owner Only | Presidential Authority: Darrel
import { useState, useEffect } from "react";
import OwnerGate from "./OwnerGate";
import { ChainstackNode, WalletIntegration, RTVToken, RotationPayTransaction, NFTAsset } from "@/api/entities";

const BASE44_API = "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions";

const CHAINS = [
  { id: "solana", name: "Solana", icon: "◎", color: "#9945ff" },
  { id: "ethereum", name: "Ethereum", icon: "⟠", color: "#627eea" },
  { id: "usdc", name: "USDC", icon: "💵", color: "#2775ca" },
  { id: "rtv", name: "RTV Token", icon: "🔴", color: "#ffd700" },
];

function PulseDot({ color = "#00ff88" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "pdot 2s ease-in-out infinite" }} />
      <style>{`@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.8)}}`}</style>
    </span>
  );
}

function ClaudeChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "⚡ Claude Grandmaster Mode ACTIVE — RotationTV Network AI online. Ask me anything about the ecosystem, Web3 strategy, RotationPay transactions, or network health.", ts: new Date().toISOString() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("claude");

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg, ts: new Date().toISOString() }]);
    setLoading(true);
    try {
      const res = await fetch(`${BASE44_API}/emergentClaudeUnified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, prompt: userMsg }),
      });
      const data = await res.json();
      const reply = data.response || data.synthesis || data.error || "No response";
      setMessages(m => [...m, { role: "assistant", text: reply, ts: new Date().toISOString() }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: `Error: ${e.message}`, ts: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const MODES = [
    { id: "claude", label: "⚡ Direct", desc: "Fast answers" },
    { id: "strategy", label: "♟️ Strategy", desc: "10 moves ahead" },
    { id: "content", label: "✍️ Content", desc: "Marketing copy" },
    { id: "audit", label: "🔍 Audit", desc: "RotationPay compliance" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: `1px solid ${mode === m.id ? "#9945ff" : "rgba(255,255,255,0.1)"}`,
            background: mode === m.id ? "rgba(153,69,255,0.2)" : "transparent",
            color: mode === m.id ? "#9945ff" : "#888", cursor: "pointer", transition: "all 0.2s",
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
        padding: "4px 0", maxHeight: 420,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #9945ff33, #9945ff22)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "#9945ff44" : "rgba(255,255,255,0.08)"}`,
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px", fontSize: 13, lineHeight: 1.6,
              color: "#e0e0e0", whiteSpace: "pre-wrap",
            }}>
              {msg.role === "assistant" && (
                <div style={{ fontSize: 10, color: "#9945ff", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
                  CLAUDE ⚡ GRANDMASTER
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#9945ff",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
            <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask Claude anything about the ecosystem..."
          style={{
            flex: 1, padding: "12px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(153,69,255,0.3)",
            borderRadius: 12, color: "#fff", fontSize: 13, outline: "none",
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: "12px 20px", borderRadius: 12, border: "none",
          background: loading || !input.trim() ? "rgba(153,69,255,0.2)" : "linear-gradient(135deg, #9945ff, #6b2fa0)",
          color: "#fff", fontWeight: 700, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          fontSize: 16,
        }}>⚡</button>
      </div>
    </div>
  );
}

function Web3Stats({ nodes, wallets, tokens, txns, nfts }) {
  const stats = [
    { label: "Solana Nodes", value: nodes.filter(n => n.status === "active").length + "/" + nodes.length, color: "#9945ff", icon: "⛓️" },
    { label: "Wallets Connected", value: wallets.length, color: "#00d4ff", icon: "◎" },
    { label: "RTV Balance", value: tokens[0] ? Number(tokens[0].balance || 0).toFixed(2) : "0.00", color: "#ffd700", icon: "🔴" },
    { label: "Transactions", value: txns.length, color: "#00ff88", icon: "💳" },
    { label: "NFTs Minted", value: nfts.length, color: "#ff6b00", icon: "🎨" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}22`,
          borderRadius: 14, padding: "14px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function NodeStatus({ nodes }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {nodes.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>No nodes configured</div>}
      {nodes.map(n => (
        <div key={n.id} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px",
          border: `1px solid ${n.status === "active" ? "#00ff8822" : "#ff444422"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PulseDot color={n.status === "active" ? "#00ff88" : "#ff4444"} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{n.node_name}</div>
              <div style={{ fontSize: 10, color: "#666" }}>{n.network} · {n.protocol}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: n.status === "active" ? "#00ff88" : "#ff4444", fontWeight: 700 }}>
              {n.status?.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>{n.plan}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Web3CommandInner() {
  const [tab, setTab] = useState("claude");
  const [nodes, setNodes] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [txns, setTxns] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [n, w, t, tx, nf] = await Promise.allSettled([
        ChainstackNode.list(),
        WalletIntegration.list(),
        RTVToken.list(),
        RotationPayTransaction.list(),
        NFTAsset.list(),
      ]);
      setNodes(n.status === "fulfilled" ? n.value : []);
      setWallets(w.status === "fulfilled" ? w.value : []);
      setTokens(t.status === "fulfilled" ? t.value : []);
      setTxns(tx.status === "fulfilled" ? tx.value : []);
      setNfts(nf.status === "fulfilled" ? nf.value : []);

      // Health check
      try {
        const res = await fetch(`${BASE44_API}/ecosystemHealthCheck`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "health_check" }),
        });
        const data = await res.json();
        setHealthScore(data.health_score || data.score || 100);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const TABS = [
    { id: "claude", label: "🤖 Claude AI", },
    { id: "web3", label: "⛓️ Web3 Status" },
    { id: "nodes", label: "🔗 Nodes" },
    { id: "wallets", label: "◎ Wallets" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #030309 0%, #080818 50%, #030309 100%)",
      color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(153,69,255,0.06)",
        borderBottom: "1px solid rgba(153,69,255,0.15)",
        padding: "20px 20px 0",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #9945ff, #6b2fa0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>🔗</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Web3 Command</div>
                <div style={{ fontSize: 11, color: "#9945ff" }}>Claude · Solana · Unified Intelligence</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PulseDot color="#00ff88" />
              <span style={{ fontSize: 11, color: "#00ff88", fontWeight: 700 }}>
                {healthScore !== null ? `HEALTH ${healthScore}/100` : "ONLINE"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 18px", border: "none",
                background: tab === t.id ? "rgba(153,69,255,0.2)" : "transparent",
                borderBottom: tab === t.id ? "2px solid #9945ff" : "2px solid transparent",
                color: tab === t.id ? "#9945ff" : "#666",
                fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                borderRadius: "8px 8px 0 0",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        {tab === "claude" && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(153,69,255,0.2)",
            borderRadius: 18, padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>Claude Grandmaster Mode</div>
                <div style={{ fontSize: 11, color: "#666" }}>Your personal AI — Web3 strategy, content, audits, ecosystem intelligence</div>
              </div>
            </div>
            <ClaudeChat />
          </div>
        )}

        {tab === "web3" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Web3Stats nodes={nodes} wallets={wallets} tokens={tokens} txns={txns} nfts={nfts} />

            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 18, padding: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: "#9945ff" }}>⛓️ CHAIN STATUS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {CHAINS.map(c => (
                  <div key={c.id} style={{
                    background: `${c.color}0f`, border: `1px solid ${c.color}22`,
                    borderRadius: 12, padding: "14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
                      <PulseDot color="#00ff88" />
                      <span style={{ fontSize: 10, color: "#00ff88", fontWeight: 700 }}>ACTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 18, padding: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: "#00ff88" }}>💳 RECENT TRANSACTIONS</div>
              {txns.length === 0
                ? <div style={{ color: "#666", fontSize: 13 }}>No transactions yet</div>
                : txns.slice(0, 5).map(tx => (
                  <div key={tx.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{tx.tx_type || "Transfer"}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>{tx.payment_rail} · {tx.status}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#00ff88" }}>${Number(tx.amount || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>{tx.currency}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {tab === "nodes" && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: "#9945ff" }}>🔗 CHAINSTACK NODES</div>
            {loading ? <div style={{ color: "#666" }}>Loading...</div> : <NodeStatus nodes={nodes} />}
          </div>
        )}

        {tab === "wallets" && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: "#00d4ff" }}>◎ CONNECTED WALLETS</div>
            {wallets.length === 0
              ? <div style={{ color: "#666", fontSize: 13 }}>No wallets connected yet</div>
              : wallets.map(w => (
                <div key={w.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px",
                  marginBottom: 8, border: "1px solid rgba(0,212,255,0.1)",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{w.wallet_provider}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{w.wallet_address?.slice(0, 8)}...{w.wallet_address?.slice(-6)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#ffd700" }}>{w.rtv_balance || 0} RTV</div>
                    <div style={{ fontSize: 11, color: "#9945ff" }}>{w.sol_balance || 0} SOL</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default function Web3Command() {
  return <OwnerGate><Web3CommandInner /></OwnerGate>;
}
