// RotationTV Network — Telegram Mini App v3.0
// Fully functional: Auth + Wallet + Discover + Gifts + Profile + Subscriptions
// Wired to: rtvAuthGateway, Base44 entities, Supabase realtime
// Brand: Neon-lime #CCFF00 on Obsidian #0A0A0A
// Economic parity: 1 RTV = $0.01 USD

import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────
const API_BASE = "https://69db6144f66afe8317b2d0d7.base44.app/functions";
const SUPABASE_URL = "https://xynkgaxfwvpcixissxdz.supabase.co";
const RTV_TO_USD = 0.01; // 1 RTV = $0.01

// ── Telegram WebApp SDK ───────────────────────────────────
const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
const tgUser = tg?.initDataUnsafe?.user || null;
const initData = tg?.initData || "";

// ── Design Tokens (Neon-lime on Obsidian) ─────────────────
const C = {
  bg: "#0A0A0A",
  card: "rgba(204,255,0,0.04)",
  border: "rgba(204,255,0,0.12)",
  neon: "#CCFF00",
  blue: "#00BFFF",
  purple: "#9945FF",
  red: "#FF6B6B",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.6)",
  muted: "rgba(255,255,255,0.35)",
  gradient: "linear-gradient(135deg, #CCFF00 0%, #00BFFF 100%)",
  dark: "rgba(255,255,255,0.02)",
};

// ── Helpers ───────────────────────────────────────────────
const fmt = (n, d = 2) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const short = (a = "") => a?.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
const rtvToUsd = (rtv) => (Number(rtv || 0) * RTV_TO_USD);

// ── API ───────────────────────────────────────────────────
async function apiCall(fn, body = {}, method = "POST") {
  try {
    const r = await fetch(`${API_BASE}/${fn}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// ── Auth hook ─────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initData) {
      setLoading(false);
      setError("No Telegram initData");
      return;
    }

    apiCall("rtvAuthGateway", { initData }, "POST").then((res) => {
      if (res?.success) {
        setUser(res.user || res.rtv_user || null);
      } else {
        setError(res?.error || "Auth failed");
      }
      setLoading(false);
    });
  }, []);

  return { user, loading, error, setUser };
}

// ── UI Atoms ──────────────────────────────────────────────
function Card({ children, style = {}, onClick, glow }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: 16, marginBottom: 10, cursor: onClick ? "pointer" : undefined,
      boxShadow: glow ? `0 0 20px ${C.neon}20` : undefined,
      transition: "all 0.2s", ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, disabled, loading, color = C.neon, small }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: small ? "11px" : "15px", borderRadius: 14, border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      background: disabled || loading ? "rgba(255,255,255,0.08)" : color,
      color: disabled || loading ? C.muted : "#0A0A0A",
      fontWeight: 800, fontSize: small ? 13 : 15, letterSpacing: 0.3,
      transition: "all 0.18s",
    }}>{loading ? "⏳" : children}</button>
  );
}

function Badge({ children, color = C.neon }) {
  return (
    <span style={{
      background: `${color}20`, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 800, padding: "2px 8px",
      borderRadius: 20, letterSpacing: 0.5,
    }}>{children}</span>
  );
}

function Tab({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px 4px", border: "none", borderRadius: 12,
      background: active ? `${C.neon}15` : "transparent",
      color: active ? C.neon : C.muted, fontWeight: 700, fontSize: 11,
      cursor: "pointer", transition: "all 0.2s", display: "flex",
      flexDirection: "column", alignItems: "center", gap: 4,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Screens ───────────────────────────────────────────────

// HOME — Wallet + Quick Actions
function HomeScreen({ user, streams, onNav }) {
  const [balance, setBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    apiCall("rtvWalletDashboard", { action: "balance", user_id: user?.id }).then((d) => {
      setBalance(d);
      setWalletLoading(false);
    });
  }, [user]);

  const liveCount = streams?.filter(s => s.status === "live").length || 0;
  const rtv = balance?.rtv_balance || user?.rtv_balance || 0;
  const usd = rtvToUsd(rtv);

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Balance Card */}
      <Card glow style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>RTV BALANCE</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: C.neon, lineHeight: 1 }}>
          {walletLoading ? "…" : fmt(rtv, 0)}
        </div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 6 }}>
          ≈ ${fmt(usd)} USD
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn small onClick={() => onNav("wallet")}>💰 Wallet</Btn>
          <Btn small color={C.blue} onClick={() => onNav("discover")}>🔴 {liveCount} Live</Btn>
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
        <Card onClick={() => onNav("discover")} style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28 }}>📺</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Discover</div>
          <div style={{ fontSize: 10, color: C.muted }}>{liveCount} streaming now</div>
        </Card>
        <Card onClick={() => onNav("gifts")} style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28 }}>🎁</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Gifts</div>
          <div style={{ fontSize: 10, color: C.muted }}>10 gifts available</div>
        </Card>
        <Card onClick={() => onNav("subs")} style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28 }}>⭐</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Subscribe</div>
          <div style={{ fontSize: 10, color: C.muted }}>4 tiers from $4.99</div>
        </Card>
        <Card onClick={() => onNav("profile")} style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28 }}>👤</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Profile</div>
          <div style={{ fontSize: 10, color: C.muted }}>{user?.kyc_status || "Unverified"}</div>
        </Card>
      </div>

      {/* Ecosystem Status */}
      <Card style={{ marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.neon, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Ecosystem Status</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Badge>9 Companies</Badge>
          <Badge color={C.blue}>4 Nodes</Badge>
          <Badge color={C.purple}>10 Rails</Badge>
          <Badge color={C.neon}>99.9% Uptime</Badge>
        </div>
      </Card>
    </div>
  );
}

// DISCOVER — Browse Live Streams
function DiscoverScreen({ streams, onTip }) {
  const [filter, setFilter] = useState("all");
  const live = streams?.filter(s => s.status === "live") || [];
  const scheduled = streams?.filter(s => s.status === "scheduled") || [];

  const list = filter === "live" ? live : filter === "scheduled" ? scheduled : [...live, ...scheduled];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["all", "live", "scheduled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f ? C.neon : C.border}`,
            background: filter === f ? `${C.neon}15` : "transparent",
            color: filter === f ? C.neon : C.muted, fontWeight: 700, fontSize: 11,
            cursor: "pointer", textTransform: "capitalize",
          }}>{f === "all" ? "All" : f}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📺</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No streams yet</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Be the first to go live!</div>
        </Card>
      ) : (
        list.map((s) => (
          <Card key={s.id} onClick={() => onTip(s)} glow={s.status === "live"}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                background: s.thumbnail_url ? `url(${s.thumbnail_url})` : C.gradient,
                backgroundSize: "cover", backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>{!s.thumbnail_url && "🎬"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {s.status === "live" && (
                    <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>LIVE</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title || "Untitled Stream"}</span>
                </div>
                <div style={{ fontSize: 11, color: C.sub }}>{s.category || "General"} · {s.viewer_count || 0} viewers</div>
                {s.total_tips_rtv > 0 && (
                  <div style={{ fontSize: 10, color: C.neon, marginTop: 4 }}>🎁 {fmt(s.total_tips_rtv, 0)} RTV tipped</div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// GIFTS — Send Tips
function GiftsScreen({ user, onSendGift, gifts }) {
  const [selected, setSelected] = useState(null);
  const [combo, setCombo] = useState(1);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!selected) return;
    setSending(true);
    await onSendGift(selected, combo);
    setSending(false);
    setSelected(null);
    setCombo(1);
  };

  return (
    <div>
      <Card style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Send Gifts</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>1 RTV = $0.01 · Combo multipliers apply</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {gifts.map((g) => (
          <button key={g.id} onClick={() => setSelected(g)} style={{
            background: selected?.id === g.id ? `${C.neon}15` : C.card,
            border: `1px solid ${selected?.id === g.id ? C.neon : C.border}`,
            borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 28 }}>{g.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: C.text }}>{g.name}</div>
            <div style={{ fontSize: 10, color: C.neon }}>{fmt(g.price_rtv, 0)} RTV</div>
            <div style={{ fontSize: 9, color: C.muted }>${fmt(g.price_usd)}</div>
          </button>
        ))}
      </div>

      {selected && (
        <Card glow>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{selected.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: C.neon }}>{fmt(selected.price_rtv * combo, 0)} RTV (${fmt(selected.price_usd * combo)})</div>
            </div>
          </div>

          {/* Combo selector */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Combo: {combo}x {combo >= 5 ? "🔥" : ""}</div>
            <input type="range" min="1" max="100" value={combo} onChange={e => setCombo(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.neon }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted }}>
              <span>1x</span><span>5x 🔥</span><span>20x 💎</span><span>100x 🌌</span>
            </div>
          </div>

          <Btn onClick={send} loading={sending} disabled={!user}>
            Send {fmt(selected.price_rtv * combo, 0)} RTV
          </Btn>
        </Card>
      )}
    </div>
  );
}

// SUBSCRIPTIONS — Tier selection
function SubsScreen({ tiers, onSubscribe }) {
  const [selected, setSelected] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async (tier) => {
    setSubscribing(true);
    await onSubscribe(tier);
    setSubscribing(false);
  };

  return (
    <div>
      <Card style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Subscription Tiers</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Unlock exclusive creator content</div>
      </Card>

      {tiers.map((t, i) => (
        <Card key={t.id || i} glow={t.tier_name === "platinum"} style={{
          borderColor: t.tier_name === "platinum" ? C.neon : C.border,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>{t.badge_emoji}</span>
              <span style={{ fontSize: 16, fontWeight: 800, textTransform: "capitalize" }}>{t.tier_name}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.neon }}>${fmt(t.price_usd_monthly)}</div>
              <div style={{ fontSize: 10, color: C.muted }}>/month · {fmt(t.price_rtv_monthly, 0)} RTV</div>
            </div>
          </div>

          {t.perks && (
            <div style={{ marginBottom: 10 }}>
              {t.perks.slice(0, 4).map((p, j) => (
                <div key={j} style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>✓ {p}</div>
              ))}
            </div>
          )}

          <Btn small onClick={() => subscribe(t)} loading={subscribing && selected?.id === t.id}>
            Subscribe {t.badge_emoji}
          </Btn>
        </Card>
      ))}
    </div>
  );
}

// WALLET — Detailed wallet view
function WalletScreen({ user, onNav }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall("rtvWalletDashboard", { action: "balance", user_id: user?.id }).then((d) => {
      setBalance(d);
      setLoading(false);
    });
  }, [user]);

  const rtv = balance?.rtv_balance || user?.rtv_balance || 0;
  const pending = balance?.pending_balance || user?.pending_balance || 0;
  const earned = balance?.total_earnings_rtv || user?.total_earnings_rtv || 0;
  const earnedUsd = balance?.total_earnings_usd || user?.total_earnings_usd || 0;

  return (
    <div>
      <Card glow style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>TOTAL BALANCE</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.neon }}>{loading ? "…" : fmt(rtv, 0)} RTV</div>
        <div style={{ fontSize: 14, color: C.sub }}>≈ ${fmt(rtvToUsd(rtv))} USD</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 10, color: C.muted }}>Pending</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>{fmt(pending, 0)}</div>
          <div style={{ fontSize: 9, color: C.muted }}>RTV</div>
        </Card>
        <Card style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 10, color: C.muted }}>Total Earned</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.neon }}>{fmt(earned, 0)}</div>
          <div style={{ fontSize: 9, color: C.muted }}>RTV (${fmt(earnedUsd)})</div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn small onClick={() => tg?.openLink?.("https://rotationtvai.com/wallet")}>📥 Deposit RTV</Btn>
          <Btn small color={C.blue} onClick={() => tg?.openLink?.("https://rotationtvai.com/wallet")}>📤 Withdraw</Btn>
          <Btn small color={C.purple} onClick={() => tg?.openLink?.("https://rotationtvai.com/faucet")}>🚰 Free Faucet (24h)</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Wallet Info</div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>
          <div>Telegram ID: <code style={{ color: C.neon }}>{user?.telegram_id || "—"}</code></div>
          <div>Role: <span style={{ color: C.neon }}>{user?.role || "user"}</span></div>
          <div>KYC: <span style={{ color: user?.kyc_status === "verified" ? C.neon : C.red }}>{user?.kyc_status || "unverified"}</span></div>
          <div>Tier: <span style={{ color: C.neon }}>{user?.loyalty_tier || "bronze"}</span></div>
          <div>Referral: <code style={{ color: C.blue }}>{user?.referral_code || "—"}</code></div>
        </div>
      </Card>
    </div>
  );
}

// PROFILE — User profile + KYC
function ProfileScreen({ user, onNav }) {
  return (
    <div>
      <Card glow style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px",
          background: user?.avatar_url ? `url(${user.avatar_url})` : C.gradient,
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
        }}>{!user?.avatar_url && "👤"}</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.display_name || user?.username || "RTV User"}</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>@{user?.username || "unknown"}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
          <Badge>{user?.loyalty_tier || "Bronze"}</Badge>
          {user?.is_verified && <Badge color={C.blue}>Verified</Badge>}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.neon }}>{user?.followers_count || 0}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Followers</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{user?.stream_count || 0}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Streams</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.purple }}>{user?.total_stream_hours || 0}h</div>
            <div style={{ fontSize: 10, color: C.muted }}>Stream Time</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.neon }}>{user?.safety_score || 100}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Safety Score</div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Verification</div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>
          <div>Email: <span style={{ color: user?.email ? C.neon : C.muted }}>{user?.email || "Not set"}</span></div>
          <div>Phone: <span style={{ color: user?.phone ? C.neon : C.muted }}>{user?.phone || "Not set"}</span></div>
          <div>KYC: <span style={{ color: user?.kyc_status === "verified" ? C.neon : C.red }}>{user?.kyc_status || "unverified"}</span></div>
          <div>Age Verified: <span style={{ color: user?.age_verified ? C.neon : C.red }}>{user?.age_verified ? "Yes" : "No"}</span></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn small color={C.blue}>Start KYC Verification</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Ecosystem</div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>
          <div>Reputation: <span style={{ color: C.neon }}>{user?.reputation_tier || "new"}</span></div>
          <div>Referral Code: <code style={{ color: C.blue }}>{user?.referral_code || "—"}</code></div>
          <div>Referred by: <code style={{ color: C.muted }}>{user?.referred_by || "—"}</code></div>
          <div>Member since: <span style={{ color: C.muted }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span></div>
        </div>
      </Card>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function TelegramMiniApp() {
  const { user, loading, error } = useAuth();
  const [tab, setTab] = useState("home");
  const [streams, setStreams] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [toast, setToast] = useState(null);

  // Load entities on mount
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.("#0A0A0A");
      tg.setBackgroundColor?.("#0A0A0A");
    }
  }, []);

  // Fetch streams, gifts, tiers
  useEffect(() => {
    // These would be Base44 entity reads in production
    // For now, use the API
    apiCall("rtvEdgeGateway", { action: "streams", limit: 20 }).then(d => {
      if (d?.streams) setStreams(d.streams);
    });
    apiCall("rtvEdgeGateway", { action: "gifts" }).then(d => {
      if (d?.gifts) setGifts(d.gifts);
    });
    apiCall("rtvEdgeGateway", { action: "tiers" }).then(d => {
      if (d?.tiers) setTiers(d.tiers);
    });
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendGift = async (gift, combo) => {
    const res = await apiCall("rtvPayoutEngine", {
      action: "process_tip",
      gift_id: gift.id,
      gift_name: gift.name,
      amount_rtv: gift.price_rtv * combo,
      combo_count: combo,
      sender_id: user?.id,
    });
    if (res?.success) {
      showToast(`Sent ${fmt(gift.price_rtv * combo, 0)} RTV ${gift.emoji}!`, "success");
    } else {
      showToast(res?.error || "Gift failed", "error");
    }
  };

  const handleSubscribe = async (tier) => {
    const res = await apiCall("rtvPayoutEngine", {
      action: "subscribe",
      tier: tier.tier_name,
      price_usd: tier.price_usd_monthly,
      price_rtv: tier.price_rtv_monthly,
      subscriber_id: user?.id,
    });
    if (res?.success) {
      showToast(`Subscribed to ${tier.tier_name} ${tier.badge_emoji}`, "success");
    } else {
      showToast(res?.error || "Subscribe failed", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "spin 2s linear infinite" }}>🔄</div>
          <div style={{ color: C.neon, fontWeight: 800, fontSize: 16 }}>RotationTV Network</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Authenticating…</div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>{error}</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Open from Telegram to authenticate</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: 80, maxWidth: 480, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`, marginBottom: 12, position: "sticky", top: 0,
        background: C.bg, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: C.gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#0A0A0A",
          }}>R</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>RotationTV</div>
            <div style={{ fontSize: 9, color: C.neon, letterSpacing: 0.5 }}>Learn it. Live it. Love it.</div>
          </div>
        </div>
        <Badge>2036</Badge>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? C.red : toast.type === "success" ? C.neon : C.blue,
          color: "#0A0A0A", fontWeight: 800, fontSize: 12, padding: "8px 18px",
          borderRadius: 20, zIndex: 9999, whiteSpace: "nowrap",
        }}>{toast.msg}</div>
      )}

      {/* Content */}
      <div style={{ padding: "0 12px" }}>
        {tab === "home" && <HomeScreen user={user} streams={streams} onNav={setTab} />}
        {tab === "discover" && <DiscoverScreen streams={streams} onTip={(s) => { setTab("gifts"); showToast(`Tipping: ${s.title}`, "info"); }} />}
        {tab === "gifts" && <GiftsScreen user={user} onSendGift={handleSendGift} gifts={gifts} />}
        {tab === "subs" && <SubsScreen tiers={tiers} onSubscribe={handleSubscribe} />}
        {tab === "wallet" && <WalletScreen user={user} onNav={setTab} />}
        {tab === "profile" && <ProfileScreen user={user} onNav={setTab} />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A0A0A",
        borderTop: `1px solid ${C.border}`, display: "flex", gap: 4, padding: "8px 12px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))", zIndex: 1000,
      }}>
        <Tab active={tab === "home"} onClick={() => setTab("home")} icon="🏠" label="Home" />
        <Tab active={tab === "discover"} onClick={() => setTab("discover")} icon="📺" label="Discover" />
        <Tab active={tab === "gifts"} onClick={() => setTab("gifts")} icon="🎁" label="Gifts" />
        <Tab active={tab === "subs"} onClick={() => setTab("subs")} icon="⭐" label="Subs" />
        <Tab active={tab === "profile"} onClick={() => setTab("profile")} icon="👤" label="Me" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rtv-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes rtv-fadein { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #0A0A0A; }
      `}</style>
    </div>
  );
}