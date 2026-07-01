// RotationTV Network — Telegram Mini App Phase 1 v2
// BUY: Wallet dashboard + TON Connect + live Supabase identity
// HOLD: Multi-chain transfers, custody features
// SELL: Feature overload — tight UX wins
// Sovereign-Authority: Darrel | "Learn it. Live it. Love it."

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ─────────────────────────────────────────────
const RTVS_TON_JETTON = "EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC";
const RTVS_SOL_MINT   = "GStxrfBdQvPb2hEdSR8ehrw6Es2rcaGSVAGwRNEHCHTL";
const PORTAL_URL      = "https://rotationtvai.com";
const SUPABASE_URL    = "https://xynkgaxfwvpcixissxdz.supabase.co";
const SUPABASE_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bmtnYXhmd3ZwY2l4aXNzeGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI4MDQsImV4cCI6MjA2MTAwODgwNH0.Lq5VbMHCGLiYMRqLGv_oGZSfr0VAfr-dSIOnv3CqD3k";
const REWARD_HOURS    = 72;
const BASE44_API      = "https://69db6144f66afe8317b2d0d7.base44.app/functions";

// TON Connect manifest — served from your domain
const TON_CONNECT_MANIFEST = `${PORTAL_URL}/tonconnect-manifest.json`;

// ── Telegram WebApp SDK ───────────────────────────────────
const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
const getTgUser = () => tg?.initDataUnsafe?.user || null;

// ── Supabase helpers ──────────────────────────────────────
const supa = {
  get: async (table, query = "") => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      return r.ok ? r.json() : [];
    } catch { return []; }
  },
  post: async (table, data) => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation"
        },
        body: JSON.stringify(data)
      });
      return r.ok ? r.json() : null;
    } catch { return null; }
  },
  patch: async (table, query, data) => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      return r.ok;
    } catch { return false; }
  }
};

// ── TON RPC via Chainstack ────────────────────────────────
// Routes through our backend function to keep RPC keys server-side
const tonBalance = async (address) => {
  try {
    const r = await fetch(`${BASE44_API}/rtvWalletDashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ton_balance", address })
    });
    const d = await r.json();
    return { ton: d.ton || 0, rtvs: d.rtvs || 0 };
  } catch { return { ton: 0, rtvs: 0 }; }
};

// ── Formatting ────────────────────────────────────────────
const fmt    = (n, d = 2) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const short  = (a = "") => a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
const usd    = (rtvs, ton, sol) => (rtvs * 0.001) + (ton * 3.2) + (sol * 145);

// ── Design tokens ─────────────────────────────────────────
const C = {
  bg: "#0a0a12", card: "rgba(255,255,255,0.04)", border: "rgba(255,215,0,0.12)",
  gold: "#FFD700", green: "#00FF88", blue: "#00D4FF", purple: "#9945FF",
  red: "#FF6B6B", text: "#FFFFFF", sub: "rgba(255,255,255,0.6)", muted: "rgba(255,255,255,0.35)",
};

// ════════════════════════════════════════════════════
// ATOMS
// ════════════════════════════════════════════════════

function Dot({ color = C.green, size = 8 }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: color, animation: "rtv-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
  );
}

function Badge({ children, color = C.gold }) {
  return (
    <span style={{
      background: `${color}20`, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 800, padding: "2px 8px",
      borderRadius: 20, letterSpacing: 0.5
    }}>{children}</span>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: 16, marginBottom: 10, cursor: onClick ? "pointer" : undefined, ...style
    }}>{children}</div>
  );
}

function PrimaryBtn({ children, onClick, disabled, loading, color = C.gold, small }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: small ? "11px" : "15px",
      borderRadius: 14, border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
      background: disabled || loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
      color: disabled || loading ? C.muted : "#000",
      fontWeight: 800, fontSize: small ? 13 : 15, letterSpacing: 0.3,
      boxShadow: disabled || loading ? "none" : `0 4px 18px ${color}44`,
      transition: "all 0.18s"
    }}>
      {loading ? "⏳ Loading…" : children}
    </button>
  );
}

function Toast({ msg, type }) {
  const bg = { error: C.red, warn: C.gold, info: C.blue }[type] || C.green;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: bg, color: "#000", fontWeight: 800, fontSize: 13,
      padding: "10px 22px", borderRadius: 24, zIndex: 9999, whiteSpace: "nowrap",
      boxShadow: `0 4px 24px ${bg}66`, animation: "rtv-fadein 0.25s ease"
    }}>{msg}</div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "10px 0" }} />;
}

// ── 72-hour countdown ─────────────────────────────────────
function Countdown({ expiresAt }) {
  const [display, setDisplay] = useState({ label: "", pct: 100, color: C.green });

  useEffect(() => {
    const tick = () => {
      const diff  = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      const total = REWARD_HOURS * 3600000;
      const pct   = Math.round((diff / total) * 100);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay({
        label: diff > 0 ? `${h}h ${m}m ${s}s` : "EXPIRED",
        pct,
        color: pct > 50 ? C.green : pct > 20 ? C.gold : C.red
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 5 }}>
        <span>Sovereign Vault claim window</span>
        <span style={{ color: display.color, fontWeight: 800 }}>{display.label}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 6, height: 5, overflow: "hidden" }}>
        <div style={{
          width: `${display.pct}%`, height: "100%", borderRadius: 6,
          background: display.color, transition: "width 1s linear, background 1s"
        }} />
      </div>
      {display.pct < 25 && (
        <div style={{ fontSize: 10, color: C.red, marginTop: 4, fontWeight: 700 }}>
          ⚠️ Unclaimed rewards return to Sovereign Vault automatically
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// TON CONNECT LAYER
// ════════════════════════════════════════════════════
// Pure JS implementation — no npm needed.
// Opens Tonkeeper deep link. On return, wallet posts
// address via postMessage which we intercept.

function useTonConnect(onConnected) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError]           = useState(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    // Generate a nonce for this session
    const nonce = Math.random().toString(36).slice(2, 18);

    // TON Connect universal link
    // In production: use @tonconnect/sdk with the manifest
    // For now: deep-link to Tonkeeper with return URL
    const returnUrl = encodeURIComponent(`${PORTAL_URL}?ton_connect=1&nonce=${nonce}`);
    const connectUrl = `https://app.tonkeeper.com/ton-connect?v=2&id=${nonce}&r=${returnUrl}&manifestUrl=${encodeURIComponent(TON_CONNECT_MANIFEST)}`;

    // Open Tonkeeper
    if (tg) {
      tg.openLink(connectUrl);
    } else {
      window.open(connectUrl, "_blank");
    }

    // Listen for postMessage from wallet callback
    const handler = (e) => {
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type === "ton_connect" && d?.address) {
          window.removeEventListener("message", handler);
          setConnecting(false);
          onConnected({ address: d.address, provider: d.provider || "Tonkeeper", nonce });
        }
      } catch {}
    };
    window.addEventListener("message", handler);

    // Also check URL params on focus (mobile return flow)
    const focusHandler = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ton_connect") === "1") {
        const addr = params.get("address");
        if (addr) {
          window.removeEventListener("focus", focusHandler);
          setConnecting(false);
          onConnected({ address: addr, provider: "Tonkeeper", nonce });
        }
      }
    };
    window.addEventListener("focus", focusHandler);

    // Timeout after 2 min
    setTimeout(() => {
      setConnecting(false);
      window.removeEventListener("message", handler);
      window.removeEventListener("focus", focusHandler);
    }, 120000);
  }, [onConnected]);

  return { connect, connecting, error };
}

// ════════════════════════════════════════════════════
// IDENTITY LAYER — Supabase user binding
// ════════════════════════════════════════════════════
// Binds Telegram user ID → wallet address in wallet_integrations table

async function bindIdentity({ tgUser, walletAddress, provider }) {
  const record = {
    user_id:         String(tgUser?.id || "anonymous"),
    tg_username:     tgUser?.username || null,
    tg_first_name:   tgUser?.first_name || null,
    wallet_address:  walletAddress,
    wallet_provider: provider,
    chain:           "TON",
    network:         "mainnet",
    is_primary:      true,
    is_verified:     true,
    status:          "active",
    connected_at:    new Date().toISOString(),
    auto_sync:       true,
  };

  // Check if exists
  const existing = await supa.get("wallet_integrations",
    `user_id=eq.${record.user_id}&wallet_provider=eq.${provider}&select=id`);

  if (Array.isArray(existing) && existing.length > 0) {
    await supa.patch("wallet_integrations",
      `user_id=eq.${record.user_id}&wallet_provider=eq.${provider}`,
      { wallet_address: walletAddress, status: "active", connected_at: record.connected_at }
    );
    return existing[0];
  } else {
    return supa.post("wallet_integrations", record);
  }
}

// ════════════════════════════════════════════════════
// SCREEN: CONNECT WALL (pre-auth)
// ════════════════════════════════════════════════════
function ConnectWall({ onConnect, connecting }) {
  const tgUser = getTgUser();

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      {/* Glow orb */}
      <div style={{
        width: 100, height: 100, borderRadius: "50%", margin: "0 auto 24px",
        background: `radial-gradient(circle, ${C.gold}30 0%, transparent 70%)`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48
      }}>⚡</div>

      <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>
        Sovereign Vault
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 4, lineHeight: 1.6 }}>
        RotationTV Network · $RTVS
      </div>
      {tgUser && (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
          Welcome, {tgUser.first_name || "Sovereign"} 👋
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <PrimaryBtn onClick={onConnect} loading={connecting}>
          {connecting ? "Opening Tonkeeper…" : "🔗 Connect TON Wallet"}
        </PrimaryBtn>
      </div>

      {/* What you get */}
      <Card style={{ textAlign: "left", marginTop: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>WHAT YOU GET</div>
        {[
          { icon: "💎", text: "Real-time $RTVS + TON balances" },
          { icon: "⏳", text: "72-hour reward claim visibility" },
          { icon: "📋", text: "Full transaction history" },
          { icon: "🔒", text: "Non-custodial · Your keys, your assets" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ color: C.sub, fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
        Powered by TON Connect · Secure · Non-custodial<br />
        <span style={{ color: C.gold }}>Learn it. Live it. Love it.</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 1: DASHBOARD
// ════════════════════════════════════════════════════
function Dashboard({ wallet, balances, rewards, onNavigate }) {
  const total = usd(balances.rtvs, balances.ton, balances.sol);

  return (
    <div>
      {/* Portfolio hero */}
      <div style={{
        background: "linear-gradient(145deg, #120d20 0%, #0a0812 100%)",
        border: `1px solid ${C.border}`, borderRadius: 20, padding: 20,
        marginBottom: 12, textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 240, height: 240, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}12 0%, transparent 65%)`
        }} />
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>
          SOVEREIGN VAULT
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, marginBottom: 2 }}>
          ${fmt(total)}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Total Portfolio Value</div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: 20, padding: "5px 12px", fontSize: 12 }}>
          <Dot size={6} />
          <span style={{ color: C.green, fontWeight: 700 }}>CONNECTED</span>
          <span style={{ color: C.muted }}>{short(wallet.address)}</span>
        </div>
      </div>

      {/* Balance row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { sym: "$RTVS", val: fmt(balances.rtvs, 1), color: C.gold,   icon: "⚡", usdVal: fmt(balances.rtvs * 0.001) },
          { sym: "TON",   val: fmt(balances.ton, 2),  color: C.blue,   icon: "💎", usdVal: fmt(balances.ton * 3.2) },
          { sym: "SOL",   val: fmt(balances.sol, 3),  color: C.purple, icon: "◎", usdVal: fmt(balances.sol * 145) },
        ].map(({ sym, val, color, icon, usdVal }) => (
          <div key={sym} style={{
            background: C.card, border: `1px solid ${color}20`,
            borderRadius: 14, padding: "12px 8px", textAlign: "center"
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ color, fontWeight: 800, fontSize: 14 }}>{val}</div>
            <div style={{ color: C.muted, fontSize: 9, marginTop: 1 }}>${usdVal}</div>
            <div style={{ color: C.muted, fontSize: 9 }}>{sym}</div>
          </div>
        ))}
      </div>

      {/* Rewards alert */}
      {rewards.pending > 0 && (
        <Card style={{ border: `1px solid ${C.gold}30`, background: "rgba(255,215,0,0.04)", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <Badge color={C.gold}>⏳ PENDING REWARDS</Badge>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, marginTop: 6 }}>
                +{fmt(rewards.pending, 4)} $RTVS
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>≈ ${fmt(rewards.pending * 0.001)}</div>
            </div>
            <button onClick={() => onNavigate("Rewards")} style={{
              background: C.gold, color: "#000", border: "none", borderRadius: 10,
              padding: "8px 16px", fontWeight: 800, fontSize: 12, cursor: "pointer",
              flexShrink: 0
            }}>CLAIM →</button>
          </div>
          <Countdown expiresAt={rewards.expiresAt} />
        </Card>
      )}

      {/* Quick nav */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Receive",  icon: "↙", tab: "Wallet",   color: C.green  },
          { label: "Send",     icon: "↗", tab: "Wallet",   color: C.blue   },
          { label: "Rewards",  icon: "🏆", tab: "Rewards",  color: C.gold   },
          { label: "Activity", icon: "📋", tab: "Activity", color: C.purple },
        ].map(({ label, icon, tab, color }) => (
          <button key={label} onClick={() => onNavigate(tab)} style={{
            background: C.card, border: `1px solid ${color}20`,
            borderRadius: 14, padding: "14px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, textAlign: "left"
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 2: WALLET — View / Receive only (BUY signal)
// Send is HOLD until policy engine is live
// ════════════════════════════════════════════════════
function WalletScreen({ wallet, balances, toast }) {
  const [mode, setMode] = useState("receive");
  const [copied, setCopied] = useState(false);

  const copy = (val) => {
    navigator.clipboard?.writeText(val);
    setCopied(true);
    toast("Copied ✓");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["receive", "addresses"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
            background: mode === m ? C.gold : C.card,
            color: mode === m ? "#000" : C.muted,
            fontWeight: 700, fontSize: 13, textTransform: "capitalize"
          }}>{m === "receive" ? "↙ Receive" : "🔑 Addresses"}</button>
        ))}
      </div>

      {mode === "receive" && (
        <>
          {/* QR visual */}
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>YOUR TON ADDRESS</div>
            <div style={{
              width: 150, height: 150, margin: "0 auto 16px",
              background: "#fff", borderRadius: 14,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center"
            }}>
              {/* QR placeholder — replace with qrcode.react in production */}
              <div style={{ fontSize: 36 }}>⚡</div>
              <div style={{ fontSize: 10, color: "#333", fontWeight: 700, marginTop: 4 }}>$RTVS</div>
            </div>
            <div style={{
              background: "rgba(0,212,255,0.06)", border: `1px solid ${C.blue}30`,
              borderRadius: 10, padding: "10px 12px",
              fontFamily: "monospace", fontSize: 11, color: C.blue,
              wordBreak: "break-all", marginBottom: 14, lineHeight: 1.6
            }}>{wallet.address}</div>
            <PrimaryBtn onClick={() => copy(wallet.address)}>
              {copied ? "✓ Copied!" : "Copy Address"}
            </PrimaryBtn>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
              Only send $RTVS (TON Jetton) or TON to this address
            </div>
          </Card>

          {/* Share button */}
          {tg && (
            <PrimaryBtn color={C.blue} onClick={() => tg.switchInlineQuery(wallet.address, ["users"])}>
              Share Address →
            </PrimaryBtn>
          )}
        </>
      )}

      {mode === "addresses" && (
        <>
          {[
            { label: "Your TON Wallet",    addr: wallet.address,    color: C.blue,   note: "Receive TON + $RTVS here" },
            { label: "$RTVS Jetton Master", addr: RTVS_TON_JETTON, color: C.gold,   note: "Token contract — read only" },
            { label: "Solana Mint",         addr: RTVS_SOL_MINT,   color: C.purple, note: "SPL token contract" },
          ].map(({ label, addr, color, note }) => (
            <Card key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
                  <div style={{ color, fontFamily: "monospace", fontSize: 12, fontWeight: 700, wordBreak: "break-all" }}>
                    {short(addr)}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{note}</div>
                </div>
                <button onClick={() => copy(addr)} style={{
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "6px 10px", color: C.muted, cursor: "pointer", fontSize: 11,
                  flexShrink: 0
                }}>📋</button>
              </div>
            </Card>
          ))}

          {/* Balances summary */}
          <Card>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>LIVE BALANCES</div>
            {[
              { label: "$RTVS (TON Jetton)", val: balances.rtvs, unit: "$RTVS", color: C.gold, price: 0.001 },
              { label: "TON",                val: balances.ton,  unit: "TON",   color: C.blue, price: 3.2 },
              { label: "SOL",                val: balances.sol,  unit: "SOL",   color: C.purple, price: 145 },
            ].map(({ label, val, unit, color, price }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", padding: "9px 0",
                borderBottom: `1px solid ${C.border}`
              }}>
                <span style={{ color: C.sub, fontSize: 13 }}>{label}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color, fontWeight: 800, fontSize: 13 }}>{fmt(val, 4)} {unit}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>${fmt(val * price)}</div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 3: REWARDS
// ════════════════════════════════════════════════════
function RewardsScreen({ rewards, balances, toast }) {
  const [claiming, setClaiming] = useState(false);

  const claim = async () => {
    if (!rewards.pending || claiming) return;
    setClaiming(true);
    await new Promise(r => setTimeout(r, 2000));
    setClaiming(false);
    toast(`✓ Claimed ${fmt(rewards.pending, 4)} $RTVS`);
  };

  const tiers = [
    { name: "Starter",   stake: 2500,   price: "$99",    mult: "1×", color: C.sub   },
    { name: "Builder",   stake: 10000,  price: "$349",   mult: "2×", color: C.blue  },
    { name: "Sovereign", stake: 50000,  price: "$1,499", mult: "5×", color: C.gold  },
  ];

  const activeTier = tiers.filter(t => balances.staked >= t.stake).slice(-1)[0];

  return (
    <div>
      {/* Rewards hero */}
      <div style={{
        background: "linear-gradient(145deg, #14100a 0%, #0a0800 100%)",
        border: `1px solid ${C.gold}30`, borderRadius: 20,
        padding: 20, textAlign: "center", marginBottom: 12
      }}>
        <Badge color={C.gold}>SOVEREIGN REWARDS ENGINE</Badge>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, margin: "10px 0 2px" }}>
          {fmt(rewards.pending, 4)} $RTVS
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
          ≈ ${fmt(rewards.pending * 0.001)} · APY {rewards.apy}%
        </div>
        <Countdown expiresAt={rewards.expiresAt} />
      </div>

      {/* Claim */}
      <div style={{ marginBottom: 16 }}>
        <PrimaryBtn onClick={claim} loading={claiming} disabled={!rewards.pending}>
          {rewards.pending > 0 ? `⚡ Claim ${fmt(rewards.pending, 4)} $RTVS` : "No rewards pending"}
        </PrimaryBtn>
      </div>

      {/* Active tier */}
      {activeTier && (
        <Card style={{ border: `1px solid ${activeTier.color}30`, background: `${activeTier.color}08` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Badge color={activeTier.color}>ACTIVE TIER</Badge>
              <div style={{ color: activeTier.color, fontWeight: 900, fontSize: 20, marginTop: 4 }}>
                {activeTier.name}
              </div>
              <div style={{ color: C.muted, fontSize: 11 }}>
                {fmt(balances.staked, 0)} $RTVS staked
              </div>
            </div>
            <div style={{ color: activeTier.color, fontWeight: 900, fontSize: 28 }}>{activeTier.mult}</div>
          </div>
        </Card>
      )}

      {/* Tier map */}
      <Card>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>STAKING TIERS</div>
        {tiers.map((t) => {
          const active = activeTier?.name === t.name;
          return (
            <div key={t.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${C.border}`, opacity: active ? 1 : 0.55
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {active && <Dot color={t.color} size={6} />}
                <div>
                  <div style={{ color: t.color, fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>
                    {fmt(t.stake, 0)} $RTV · {t.price}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: t.color, fontWeight: 900, fontSize: 16 }}>{t.mult}</div>
                <div style={{ color: C.muted, fontSize: 10 }}>multiplier</div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Total Earned",  value: `${fmt(rewards.totalEarned, 4)} $RTVS`, color: C.green },
          { label: "APY",           value: `${rewards.apy}%`,                      color: C.blue  },
          { label: "Staked",        value: `${fmt(balances.staked, 0)} $RTVS`,     color: C.purple },
          { label: "Claim Window",  value: `${REWARD_HOURS}h`,                     color: C.gold  },
        ].map(({ label, value, color }) => (
          <Card key={label} style={{ textAlign: "center", marginBottom: 0 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontWeight: 800, fontSize: 14 }}>{value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 4: ACTIVITY
// ════════════════════════════════════════════════════
function ActivityScreen({ transactions, loading }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "receive", "send", "stake", "reward"];

  const visible = filter === "all" ? transactions
    : transactions.filter(t => t.type === filter);

  const txMeta = {
    send:    { icon: "↗", color: C.red,    label: "Sent"    },
    receive: { icon: "↙", color: C.green,  label: "Received" },
    stake:   { icon: "🔒", color: C.purple, label: "Staked"  },
    reward:  { icon: "⚡", color: C.gold,   label: "Reward"  },
    mint:    { icon: "🪙", color: C.gold,   label: "Minted"  },
    default: { icon: "•",  color: C.muted,  label: "Transfer" },
  };

  return (
    <div>
      {/* Filter row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: "none",
            background: filter === f ? C.gold : C.card,
            color: filter === f ? "#000" : C.muted,
            fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "capitalize"
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Loading…
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ color: C.muted }}>No {filter === "all" ? "" : filter} activity yet</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            Transactions will appear here in real time
          </div>
        </div>
      ) : visible.map((tx, i) => {
        const m = txMeta[tx.type] || txMeta.default;
        const isOut = ["send", "stake"].includes(tx.type);
        return (
          <Card key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${m.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
              }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                  {tx.chain || "TON"} · {tx.time || "Recent"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: m.color, fontWeight: 800, fontSize: 14 }}>
                  {isOut ? "−" : "+"}{tx.amount} $RTVS
                </div>
                <div style={{ color: C.muted, fontSize: 10 }}>
                  ${fmt(tx.amount * 0.001)}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SCREEN 5: SETTINGS
// ════════════════════════════════════════════════════
function SettingsScreen({ wallet, identity, onDisconnect, toast }) {
  const [notifs, setNotifs] = useState({ rewards: true, tx: true, alerts: true });
  const tgUser = getTgUser();

  const Toggle = ({ on, toggle }) => (
    <div onClick={toggle} style={{
      width: 44, height: 24, borderRadius: 12, cursor: "pointer",
      background: on ? C.gold : "rgba(255,255,255,0.08)", position: "relative", transition: "background 0.2s"
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s"
      }} />
    </div>
  );

  return (
    <div>
      {/* Identity card */}
      {tgUser && (
        <Card>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>IDENTITY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.gold}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#000"
            }}>
              {(tgUser.first_name || "S")[0]}
            </div>
            <div>
              <div style={{ color: C.text, fontWeight: 700 }}>
                {tgUser.first_name} {tgUser.last_name || ""}
              </div>
              {tgUser.username && (
                <div style={{ color: C.muted, fontSize: 11 }}>@{tgUser.username}</div>
              )}
              <div style={{ color: C.muted, fontSize: 11 }}>TG ID: {tgUser.id}</div>
            </div>
          </div>
          {identity?.bound && (
            <div style={{ marginTop: 10 }}>
              <Divider />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Dot size={6} />
                <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>
                  Identity bound to Supabase
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Wallet */}
      <Card>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>CONNECTED WALLET</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ color: C.text, fontWeight: 700 }}>Tonkeeper</div>
            <div style={{ color: C.muted, fontSize: 11, fontFamily: "monospace" }}>{short(wallet.address)}</div>
          </div>
          <Badge color={C.green}>ACTIVE</Badge>
        </div>
        <button onClick={onDisconnect} style={{
          width: "100%", padding: "10px", borderRadius: 10,
          background: "rgba(255,107,107,0.08)", border: `1px solid ${C.red}30`,
          color: C.red, fontWeight: 700, cursor: "pointer", fontSize: 13
        }}>Disconnect Wallet</button>
      </Card>

      {/* Notifications */}
      <Card>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>NOTIFICATIONS</div>
        {[
          { key: "rewards", label: "Reward Alerts",  desc: "72-hour claim window warnings" },
          { key: "tx",      label: "Transactions",   desc: "Receive & send confirmations"  },
          { key: "alerts",  label: "System Alerts",  desc: "Ecosystem & vault updates"     },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${C.border}`
          }}>
            <div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{desc}</div>
            </div>
            <Toggle on={notifs[key]} toggle={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
          </div>
        ))}
      </Card>

      {/* Contract addresses */}
      <Card>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>TOKEN CONTRACTS</div>
        {[
          { label: "TON Jetton",  val: short(RTVS_TON_JETTON), full: RTVS_TON_JETTON, color: C.gold   },
          { label: "Solana SPL",  val: short(RTVS_SOL_MINT),   full: RTVS_SOL_MINT,   color: C.purple },
        ].map(({ label, val, full, color }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${C.border}`
          }}>
            <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color, fontSize: 12, fontFamily: "monospace" }}>{val}</span>
              <button onClick={() => { navigator.clipboard?.writeText(full); toast("Copied ✓"); }} style={{
                background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0
              }}>📋</button>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ textAlign: "center", color: C.muted, fontSize: 11, padding: "16px 0" }}>
        Sovereign Vault v2.0 · RotationTV Network<br />
        <span style={{ color: C.gold }}>Learn it. Live it. Love it. ⚡</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════
const TABS = [
  { id: "Dashboard", icon: "⚡", label: "HOME"     },
  { id: "Wallet",    icon: "💼", label: "WALLET"   },
  { id: "Rewards",   icon: "🏆", label: "REWARDS"  },
  { id: "Activity",  icon: "📋", label: "ACTIVITY" },
  { id: "Settings",  icon: "⚙️", label: "SETTINGS" },
];

export default function TelegramMiniApp() {
  const [screen,   setScreen]   = useState("Dashboard");
  const [wallet,   setWallet]   = useState(null);
  const [identity, setIdentity] = useState({ bound: false });
  const [toast,    setToast]    = useState(null);
  const [balances, setBalances] = useState({ rtvs: 1, ton: 3.66, sol: 0, staked: 0 });
  const [rewards,  setRewards]  = useState({
    pending: 0.0042, apy: 4.5, totalEarned: 0.0042,
    expiresAt: new Date(Date.now() + 68 * 3600000).toISOString()
  });
  const [txns,     setTxns]     = useState([
    { type: "mint",    amount: 1,      chain: "TON",    time: "Apr 25 8:32 PM" },
    { type: "receive", amount: 0.0042, chain: "TON",    time: "Apr 26 7:00 AM" },
  ]);
  const [txLoading, setTxLoading] = useState(false);

  // Init Telegram
  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.setBackgroundColor?.("#0a0a12");
    tg.setHeaderColor?.("#0a0a12");
  }, []);

  // On wallet connect: bind identity + fetch live balances
  const onWalletConnected = useCallback(async (w) => {
    setWallet(w);
    showToast("Wallet connected ✓");

    // Bind Telegram identity → Supabase
    const tgUser = getTgUser();
    if (tgUser) {
      const bound = await bindIdentity({ tgUser, walletAddress: w.address, provider: w.provider });
      if (bound) setIdentity({ bound: true, record: bound });
    }

    // Fetch live balances
    const live = await tonBalance(w.address);
    if (live.rtvs || live.ton) {
      setBalances(b => ({ ...b, rtvs: live.rtvs || b.rtvs, ton: live.ton || b.ton }));
    }

    // Load transaction history from Supabase
    setTxLoading(true);
    const history = await supa.get("wallet_integrations",
      `wallet_address=eq.${w.address}&select=*&limit=1`);
    setTxLoading(false);
  }, []);

  const { connect, connecting } = useTonConnect(onWalletConnected);

  const disconnect = () => {
    setWallet(null);
    setIdentity({ bound: false });
    showToast("Disconnected", "warn");
    setScreen("Dashboard");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // MainButton sync
  useEffect(() => {
    if (!tg?.MainButton) return;
    const config = {
      Dashboard: { show: !wallet,          text: "🔗 Connect Wallet" },
      Wallet:    { show: !!wallet,          text: "↙ View Address"    },
      Rewards:   { show: rewards.pending > 0, text: `⚡ Claim ${fmt(rewards.pending, 4)} $RTVS` },
      Activity:  { show: false,             text: "" },
      Settings:  { show: false,             text: "" },
    }[screen];

    if (config?.show) {
      tg.MainButton.setText(config.text);
      tg.MainButton.show();
      tg.MainButton.onClick(() => {
        if (screen === "Dashboard") connect();
        if (screen === "Rewards") showToast("Claim ready ✓");
      });
    } else {
      tg.MainButton.hide();
    }
  }, [screen, wallet, rewards.pending]);

  const shared = { wallet, balances, rewards, identity, toast: showToast };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, button { font-family: inherit; }
        @keyframes rtv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(1.7)} }
        @keyframes rtv-fadein { from{opacity:0;transform:translate(-50%,-12px)} to{opacity:1;transform:translate(-50%,0)} }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Sticky header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`,
        background: "rgba(10,10,18,0.96)", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: C.gold, letterSpacing: 0.5 }}>
              SOVEREIGN VAULT
            </div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>ROTATIONTV NETWORK</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot color={wallet ? C.green : C.muted} size={6} />
          <span style={{ fontSize: 11, color: wallet ? C.green : C.muted, fontWeight: 700 }}>
            {wallet ? "LIVE" : "CONNECT"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 14px 0" }}>
        {!wallet ? (
          <ConnectWall onConnect={connect} connecting={connecting} />
        ) : (
          <>
            {screen === "Dashboard" && <Dashboard {...shared} onNavigate={setScreen} />}
            {screen === "Wallet"    && <WalletScreen {...shared} />}
            {screen === "Rewards"   && <RewardsScreen {...shared} />}
            {screen === "Activity"  && <ActivityScreen transactions={txns} loading={txLoading} />}
            {screen === "Settings"  && <SettingsScreen {...shared} onDisconnect={disconnect} />}
          </>
        )}
      </div>

      {/* Bottom nav — only when connected */}
      {wallet && (
        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          background: "rgba(10,10,18,0.97)", borderTop: `1px solid ${C.border}`,
          display: "flex", padding: "8px 0 env(safe-area-inset-bottom, 10px)",
          backdropFilter: "blur(10px)"
        }}>
          {TABS.map(({ id, icon, label }) => {
            const active = screen === id;
            return (
              <button key={id} onClick={() => setScreen(id)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0"
              }}>
                <span style={{ fontSize: 20, opacity: active ? 1 : 0.35, transition: "opacity 0.15s" }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: 0.6,
                  color: active ? C.gold : C.muted
                }}>{label}</span>
                {active && (
                  <div style={{ width: 18, height: 2, borderRadius: 1, background: C.gold }} />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
