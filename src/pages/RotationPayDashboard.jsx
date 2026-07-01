import OwnerGate from "./OwnerGate";
import { useState, useEffect, useRef } from "react";
import { RotationPayMerchant, RTVAPIKey, OmegaAuditLog } from "@/api/entities";

const fmt = (n, d = 2) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const BACKEND = "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationPayConnect";

function PulseDot({ color = "#00ff88" }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "pd 2s ease-in-out infinite" }} />
      <style>{`@keyframes pd{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.8)}}`}</style>
    </span>
  );
}

const PLANS = [
  { id: "starter", name: "Starter", price: "$99/mo", color: "#00d4ff", rails: 3, limit: "10K calls/mo", cashback: "1% RTV", share: "0.8%", badge: "BEST FOR SMALL BIZ" },
  { id: "growth", name: "Growth", price: "$299/mo", color: "#00ff88", rails: 5, limit: "100K calls/mo", cashback: "2% RTV", share: "1.2%", badge: "MOST POPULAR" },
  { id: "enterprise", name: "Enterprise", price: "$999/mo", color: "#ffd700", rails: 6, limit: "1M calls/mo", cashback: "3% RTV", share: "2.0%", badge: "ROTHSCHILD TIER" },
  { id: "reseller", name: "Reseller", price: "$497/mo", color: "#9945ff", rails: 6, limit: "500K calls/mo", cashback: "2.5% RTV", share: "1.5%", badge: "API RESELLER" },
];

const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY";

const RAILS = [
  { name: "Stripe Card", icon: "💳", color: "#635bff", status: "live", fee: "2.9%+30¢" },
  { name: "Venmo", icon: "V", color: "#00d4ff", status: "live", fee: "0%" },
  { name: "Cash App", icon: "$", color: "#00d632", status: "live", fee: "0.5%" },
  { name: "Zelle", icon: "Z", color: "#6c35de", status: "live", fee: "0%" },
  { name: "USDC", icon: "U", color: "#2775ca", status: "beta", fee: "~$0.001" },
  { name: "Solana/RTV", icon: "◎", color: "#9945ff", status: "live", fee: "~$0.0001" },
  { name: "PayPal", icon: "P", color: "#003087", status: "live", fee: "3.49%+49¢", link: PAYPAL_LINK },
  { name: "Telegram Wallet", icon: "💎", color: "#229ED9", status: "live", fee: "0%", link: "https://t.me/wallet" },
];

function RotationPayDashboardInner() {
  const [tab, setTab] = useState("overview");
  const [merchants, setMerchants] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Merchant onboarding form
  const [form, setForm] = useState({ business_name: "", email: "", owner_name: "", plan: "growth", business_type: "company" });
  const [onboarding, setOnboarding] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Omega audit
  const [omegaReport, setOmegaReport] = useState(null);
  const [omegaLoading, setOmegaLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      RotationPayMerchant.list(),
      OmegaAuditLog.list(),
      RTVAPIKey.list(),
    ]).then(([m, a, k]) => {
      setMerchants(m || []);
      setAuditLogs((a || []).slice(0, 50));
      setApiKeys(k || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const totalVolume = merchants.reduce((s, m) => s + (m.total_volume || 0), 0);
  const totalRevenue = merchants.reduce((s, m) => s + ((m.total_volume || 0) * ((m.revenue_share_pct || 1) / 100)), 0);
  const activeMerchants = merchants.filter(m => m.status === "active").length;
  const activeKeys = apiKeys.filter(k => k.status === "active").length;

  const handleOnboard = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_merchant", ...form })
      });
      const data = await res.json();
      if (data.success) {
        setOnboarding(data);
        notify("✅ Merchant created! API keys generated.");
        const updated = await RotationPayMerchant.list();
        setMerchants(updated || []);
      } else {
        notify(data.error || "Failed to create merchant", "error");
      }
    } catch (err) {
      notify("Connection error. Check backend.", "error");
    }
    setSubmitting(false);
  };

  const handleCheckout = async (planId) => {
    try {
      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_plan_checkout", plan: planId })
      });
      const data = await res.json();
      if (data.checkout_url) window.open(data.checkout_url, "_blank");
      else notify(data.error || "Failed to create checkout", "error");
    } catch { notify("Connection error", "error"); }
  };

  const handleOmegaAudit = async () => {
    setOmegaLoading(true);
    try {
      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "omega_audit", auth_token: "DARREL_OMEGA_2026" })
      });
      const data = await res.json();
      setOmegaReport(data.omega_report);
    } catch { notify("Audit failed", "error"); }
    setOmegaLoading(false);
  };

  const riskColor = (score) => score > 70 ? "#ff4466" : score > 40 ? "#ffd700" : "#00ff88";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#030310 0%,#07071a 50%,#030508 100%)", color: "#fff", fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,212,255,0.1)", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#00d4ff,#0044ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, boxShadow: "0 0 30px rgba(0,212,255,0.5)" }}>RP</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#00d4ff", letterSpacing: 1.5 }}>ROTATIONPAY</div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>STRIPE CONNECT PLATFORM • API RESELLER • OMEGA ARCHITECTURE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 10, color: "#00ff88", display: "flex", alignItems: "center", gap: 4, background: "rgba(0,255,136,0.07)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 20, padding: "5px 12px" }}>
            <PulseDot /> OMEGA LIVE
          </div>
          <button onClick={() => setTab("omega")} style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.08)", color: "#ffd700", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
            🔐 OMEGA AUDIT
          </button>
        </div>
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: notification.type === "error" ? "rgba(255,68,102,0.15)" : "rgba(0,255,136,0.15)", border: `1px solid ${notification.type === "error" ? "#ff4466" : "#00ff88"}`, borderRadius: 20, padding: "10px 24px", fontSize: 12, fontWeight: 700, color: notification.type === "error" ? "#ff4466" : "#00ff88", zIndex: 1000, backdropFilter: "blur(10px)" }}>
          {notification.msg}
        </div>
      )}

      {/* LIVE TICKER */}
      <div style={{ overflow: "hidden", background: "rgba(0,212,255,0.04)", borderBottom: "1px solid rgba(0,212,255,0.08)", padding: "5px 0", fontSize: 10, color: "#00d4ff", fontWeight: 600, whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "tick 20s linear infinite" }}>
          {[...Array(2)].flatMap(() => ["⚡ STRIPE CONNECT LIVE", "⚡ TELEGRAM WALLET LIVE — 150M USERS", "⚡ 7 PAYMENT RAILS ACTIVE", "⚡ RTV CASHBACK ENGINE RUNNING", "⚡ OMEGA AUDIT PROTECTION ENGAGED", "⚡ ROTHSCHILD MODE ACTIVE", "⚡ API KEYS LIVE — WE KEEP BUSINESS ROTATING GLOBALLY"]).map((t, i) => (
            <span key={i} style={{ marginRight: 50 }}>{t}</span>
          ))}
        </div>
        <style>{`@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      {/* KPI STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, padding: "16px 24px" }}>
        {[
          { label: "Platform Revenue", value: `$${fmt(totalRevenue)}`, color: "#ffd700", icon: "💰" },
          { label: "Total Volume", value: `$${fmt(totalVolume)}`, color: "#00d4ff", icon: "📊" },
          { label: "Merchants", value: merchants.length, color: "#00ff88", icon: "🏪" },
          { label: "Active API Keys", value: activeKeys, color: "#9945ff", icon: "🔑" },
          { label: "Audit Events", value: auditLogs.length, color: "#ff6b00", icon: "📋" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px" }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 9, color: "#666", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "0 24px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        {["overview", "onboard", "merchants", "api-keys", "audit", "pricing", "omega"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", background: tab === t ? "linear-gradient(135deg,#00d4ff,#0044ff)" : "rgba(255,255,255,0.05)", color: tab === t ? "#fff" : "#666", boxShadow: tab === t ? "0 4px 15px rgba(0,212,255,0.3)" : "none" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "0 24px 60px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>PAYMENT RAILS STATUS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
              {RAILS.map(r => (
                <div key={r.name} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${r.color}22`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${r.color}18`, border: `1px solid ${r.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: r.color, fontWeight: 900 }}>{r.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                    </div>
                    <div style={{ fontSize: 9, color: r.status === "live" ? "#00ff88" : "#ffd700", display: "flex", alignItems: "center", gap: 3 }}>
                      <PulseDot color={r.status === "live" ? "#00ff88" : "#ffd700"} /> {r.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#888" }}>Fee: <span style={{ color: "#00ff88" }}>{r.fee}</span></div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#ffd700", marginBottom: 8 }}>⚠️ CRITICAL ACTION REQUIRED</div>
              <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.7 }}>
                Your Stripe account <code style={{ color: "#ffd700" }}>acct_1TLILF6uXd0gkLrQ</code> has <b style={{ color: "#ff4466" }}>charges disabled</b>.<br />
                To start accepting live payments and getting wealthy:
              </div>
              <ol style={{ color: "#aaa", fontSize: 11, lineHeight: 2, marginTop: 8 }}>
                <li>Go to <a href="https://dashboard.stripe.com" target="_blank" style={{ color: "#00d4ff" }}>dashboard.stripe.com</a></li>
                <li>Complete business verification (EIN, address, bank account)</li>
                <li>Enable charges → all 6 rails go LIVE immediately</li>
                <li>Return here and start onboarding merchants</li>
              </ol>
              <a href="https://dashboard.stripe.com" target="_blank" style={{ display: "inline-block", marginTop: 12, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#0044ff)", color: "#fff", fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                Complete Stripe Verification →
              </a>
            </div>
          </div>
        )}

        {/* ONBOARD MERCHANT */}
        {tab === "onboard" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 16 }}>ONBOARD NEW MERCHANT — STRIPE CONNECT</div>
            {onboarding ? (
              <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#00ff88", marginBottom: 16 }}>Merchant Created</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Merchant ID", value: onboarding.merchant_id?.slice(0, 16) + "..." },
                    { label: "Stripe Account", value: onboarding.stripe_account_id },
                    { label: "Plan", value: onboarding.plan_details?.plan?.toUpperCase() },
                    { label: "Monthly Price", value: onboarding.plan_details?.monthly_price },
                    { label: "Revenue Share", value: onboarding.plan_details?.revenue_share },
                    { label: "RTV Cashback", value: onboarding.plan_details?.rtv_cashback },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: "#888" }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#00ff88" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#888", marginBottom: 6 }}>LIVE API KEY</div>
                  <code style={{ fontSize: 11, color: "#ffd700", wordBreak: "break-all" }}>{onboarding.api_keys?.live}</code>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#888", marginBottom: 6 }}>TEST API KEY</div>
                  <code style={{ fontSize: 11, color: "#9945ff", wordBreak: "break-all" }}>{onboarding.api_keys?.test}</code>
                </div>
                <a href={onboarding.onboarding_url} target="_blank" style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#00d4ff,#0044ff)", color: "#fff", fontWeight: 900, fontSize: 13, textDecoration: "none", marginBottom: 10 }}>
                  Complete Stripe Onboarding →
                </a>
                <button onClick={() => { setOnboarding(null); setForm({ business_name: "", email: "", owner_name: "", plan: "growth", business_type: "company" }); }} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#888", fontSize: 12, cursor: "pointer" }}>
                  Onboard Another Merchant
                </button>
              </div>
            ) : (
              <form onSubmit={handleOnboard}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {[
                    { key: "business_name", label: "Business Name", placeholder: "Acme Corp" },
                    { key: "email", label: "Business Email", placeholder: "owner@business.com", type: "email" },
                    { key: "owner_name", label: "Owner Name", placeholder: "John Doe" },
                  ].map(f => (
                    <div key={f.key} style={{ gridColumn: f.key === "owner_name" ? "1 / -1" : undefined }}>
                      <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} type={f.type || "text"} required
                        style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 8 }}>PLAN</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {PLANS.map(p => (
                      <button key={p.id} type="button" onClick={() => setForm(prev => ({ ...prev, plan: p.id }))} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${form.plan === p.id ? p.color : "rgba(255,255,255,0.06)"}`, background: form.plan === p.id ? `${p.color}12` : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: form.plan === p.id ? p.color : "#888" }}>{p.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{p.price}</div>
                        <div style={{ fontSize: 9, color: "#666" }}>{p.cashback} • {p.share} rev share</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 6 }}>BUSINESS TYPE</div>
                  <select value={form.business_type} onChange={e => setForm(p => ({ ...p, business_type: e.target.value }))} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 13, outline: "none" }}>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="nonprofit">Nonprofit</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: submitting ? "rgba(0,212,255,0.3)" : "linear-gradient(135deg,#00d4ff,#0044ff)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 30px rgba(0,212,255,0.25)" }}>
                  {submitting ? "Creating Merchant Account..." : "⚡ Create Merchant + Generate API Keys"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MERCHANTS LIST */}
        {tab === "merchants" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5 }}>MERCHANT ACCOUNTS ({merchants.length})</div>
              <button onClick={() => setTab("onboard")} style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#00d4ff,#0044ff)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>+ Add Merchant</button>
            </div>
            {merchants.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#888" }}>No merchants yet</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>Onboard your first merchant to start generating revenue</div>
                <button onClick={() => setTab("onboard")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#00d4ff,#0044ff)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Onboard First Merchant →</button>
              </div>
            ) : merchants.map(m => (
              <div key={m.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{m.business_name}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{m.email} • {m.plan?.toUpperCase()} plan</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#00d4ff" }}>${fmt(m.total_volume)}</div>
                    <div style={{ fontSize: 9, color: m.status === "active" ? "#00ff88" : "#ffd700", fontWeight: 700 }}>{m.status?.toUpperCase()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <div style={{ fontSize: 9, color: "#888", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 6 }}>Rev share: {m.revenue_share_pct}%</div>
                  <div style={{ fontSize: 9, color: "#ffd700", background: "rgba(255,215,0,0.08)", padding: "3px 8px", borderRadius: 6 }}>RTV: {m.rtv_cashback_pct}% cashback</div>
                  <div style={{ fontSize: 9, color: "#9945ff", background: "rgba(153,69,255,0.08)", padding: "3px 8px", borderRadius: 6 }}>Audit: {m.audit_tier?.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: m.kyc_verified ? "#00ff88" : "#ff6b00", background: m.kyc_verified ? "rgba(0,255,136,0.08)" : "rgba(255,107,0,0.08)", padding: "3px 8px", borderRadius: 6 }}>KYC: {m.kyc_verified ? "VERIFIED" : "PENDING"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* API KEYS */}
        {tab === "api-keys" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>API KEY REGISTRY ({apiKeys.length} total)</div>
            {apiKeys.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555" }}>No API keys yet — onboard a merchant to generate keys</div>
            ) : apiKeys.map(k => (
              <div key={k.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{k.key_name}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: k.status === "active" ? "#00ff88" : "#ff4466", background: k.status === "active" ? "rgba(0,255,136,0.1)" : "rgba(255,68,102,0.1)", padding: "2px 8px", borderRadius: 6 }}>{k.status?.toUpperCase()}</span>
                </div>
                <code style={{ fontSize: 10, color: "#ffd700", display: "block", wordBreak: "break-all", marginBottom: 8 }}>{k.api_key}</code>
                <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#666" }}>
                  <span>Type: <b style={{ color: "#fff" }}>{k.key_type}</b></span>
                  <span>Rate: <b style={{ color: "#fff" }}>{k.rate_limit_per_min}/min</b></span>
                  <span>Calls: <b style={{ color: "#00d4ff" }}>{k.calls_this_month || 0} / {k.monthly_call_limit?.toLocaleString()}</b></span>
                  <span>Revenue: <b style={{ color: "#ffd700" }}>${fmt(k.revenue_generated || 0)}</b></span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#00d4ff", marginBottom: 10 }}>API INTEGRATION GUIDE</div>
              <div style={{ fontSize: 10, color: "#888", lineHeight: 1.8 }}>
                <b style={{ color: "#fff" }}>Endpoint:</b> <code style={{ color: "#ffd700" }}>POST {BACKEND}</code><br />
                <b style={{ color: "#fff" }}>Header:</b> <code style={{ color: "#9945ff" }}>x-rtv-api-key: rtv_live_...</code><br />
                <b style={{ color: "#fff" }}>Actions:</b> <code style={{ color: "#00ff88" }}>process_payment</code> | <code style={{ color: "#00ff88" }}>create_plan_checkout</code>
              </div>
              <div style={{ marginTop: 10, background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, color: "#555", marginBottom: 4 }}>EXAMPLE REQUEST</div>
                <pre style={{ fontSize: 10, color: "#ccc", margin: 0, overflowX: "auto" }}>{`{
  "action": "process_payment",
  "api_key": "rtv_live_...",
  "amount_usd": 49.99,
  "rail": "stripe_card",
  "description": "Product purchase"
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG */}
        {tab === "audit" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 12 }}>OMEGA AUDIT LOG — ROTHSCHILD MODE</div>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555" }}>No audit events yet</div>
            ) : auditLogs.map(log => (
              <div key={log.id} style={{ background: log.is_suspicious ? "rgba(255,68,102,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${log.is_suspicious ? "rgba(255,68,102,0.2)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskColor(log.risk_score || 0) }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{log.event_type?.replace(/_/g, " ").toUpperCase()}</span>
                    {log.is_suspicious && <span style={{ fontSize: 9, color: "#ff4466", background: "rgba(255,68,102,0.1)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>⚠️ FLAGGED</span>}
                  </div>
                  <span style={{ fontSize: 9, color: "#555" }}>{new Date(log.created_date).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>{log.notes}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 9, color: "#666" }}>
                  {log.amount_usd > 0 && <span>Amount: <b style={{ color: "#ffd700" }}>${fmt(log.amount_usd)}</b></span>}
                  {log.rail && <span>Rail: <b style={{ color: "#00d4ff" }}>{log.rail}</b></span>}
                  <span>Risk: <b style={{ color: riskColor(log.risk_score || 0) }}>{log.risk_score || 0}/100</b></span>
                  {log.jurisdiction && <span>Jurisdiction: <b style={{ color: "#fff" }}>{log.jurisdiction}</b></span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRICING */}
        {tab === "pricing" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>RotationPay Plans</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>API reseller access • Stripe Connect • RTV cashback on every transaction</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {PLANS.map(plan => (
                <div key={plan.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${plan.color}33`, borderRadius: 18, padding: 20, position: "relative" }}>
                  <div style={{ position: "absolute", top: -10, right: 16, background: plan.color, color: "#000", fontSize: 8, fontWeight: 900, padding: "3px 10px", borderRadius: 10, letterSpacing: 1 }}>{plan.badge}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 16 }}>{plan.price}</div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 2 }}>
                    ✓ {plan.rails} payment rails<br />
                    ✓ {plan.limit}<br />
                    ✓ {plan.cashback} on every TX<br />
                    ✓ {plan.share} revenue share<br />
                    ✓ Stripe Connect included<br />
                    ✓ Live API keys
                  </div>
                  <button onClick={() => handleCheckout(plan.id)} style={{ width: "100%", marginTop: 16, padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${plan.color},${plan.color}99)`, color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", boxShadow: `0 6px 20px ${plan.color}33` }}>
                    Get Started →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OMEGA AUDIT */}
        {tab === "omega" && (
          <div>
            <div style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 20, padding: 24, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#ffd700" }}>OMEGA AUDIT SYSTEM</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Rothschild Mode — Presidential Authority Only</div>
              <button onClick={handleOmegaAudit} disabled={omegaLoading} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 12, border: "none", background: omegaLoading ? "rgba(255,215,0,0.2)" : "linear-gradient(135deg,#ffd700,#ff6b00)", color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                {omegaLoading ? "Running Audit..." : "⚡ Run Omega Audit"}
              </button>
            </div>
            {omegaReport && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Authority", value: omegaReport.authority, color: "#ffd700" },
                    { label: "Classification", value: omegaReport.classification, color: "#9945ff" },
                    { label: "Platform Revenue", value: `$${fmt(omegaReport.merchants?.platform_revenue_usd)}`, color: "#00ff88" },
                    { label: "Total Volume", value: `$${fmt(omegaReport.merchants?.total_volume_usd)}`, color: "#00d4ff" },
                    { label: "Merchants", value: omegaReport.merchants?.total, color: "#fff" },
                    { label: "Active API Keys", value: omegaReport.api_keys?.active, color: "#fff" },
                    { label: "Security Events", value: omegaReport.security?.total_events, color: "#ffd700" },
                    { label: "Suspicious", value: omegaReport.security?.suspicious_events, color: omegaReport.security?.suspicious_events > 0 ? "#ff4466" : "#00ff88" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {omegaReport.stripe?.action_required && (
                  <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 700, marginBottom: 6 }}>ACTION REQUIRED</div>
                    <div style={{ fontSize: 11, color: "#ccc" }}>{omegaReport.stripe.action_required}</div>
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 10, color: "#555", textAlign: "center" }}>
                  Audit timestamp: {new Date(omegaReport.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default function RotationPayDashboard() {
  return <OwnerGate><RotationPayDashboardInner /></OwnerGate>;
}
