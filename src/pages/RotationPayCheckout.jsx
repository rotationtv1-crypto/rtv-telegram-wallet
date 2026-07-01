// RotationPay Universal Checkout
// All payment rails in one place — PayPal + Stripe + Solana + Venmo + Zelle + Coinbase
// Presidential Authority: Darrel — RotationTV Network

import { useState } from "react";
import OwnerGate from "./OwnerGate";

const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY";

const PAYMENT_RAILS = [
  {
    id: "paypal",
    name: "PayPal",
    icon: "🅿️",
    color: "#003087",
    accent: "#009cde",
    description: "Pay with PayPal balance, card, or bank",
    fee: "3.49% + $0.49",
    settlement: "Instant",
    global: true,
    recommended: true,
    action: "link",
    link: PAYPAL_LINK,
    badge: "RECOMMENDED",
    countries: "200+ countries",
  },
,
  {
    id: "telegram",
    name: "Telegram Wallet",
    icon: "💎",
    color: "#229ED9",
    accent: "#54a9eb",
    description: "USDT, TON, BTC, Gold — 150M users, instant inside Telegram",
    fee: "0%",
    settlement: "Instant",
    global: true,
    action: "link",
    link: "https://t.me/wallet",
    badge: "150M USERS",
    cashback: "2% in $RTV",
    countries: "Global",
  },
  {
    id: "stripe",
    name: "Credit / Debit Card",
    icon: "💳",
    color: "#635bff",
    accent: "#7c74ff",
    description: "Visa, Mastercard, Amex, Discover",
    fee: "2.9% + $0.30",
    settlement: "2-3 days",
    global: true,
    action: "stripe",
    countries: "Global",
  },
  {
    id: "solana",
    name: "Solana / $RTV",
    icon: "◎",
    color: "#9945ff",
    accent: "#14f195",
    description: "Instant blockchain payment — earn $RTV cashback",
    fee: "~$0.0001",
    settlement: "2 seconds",
    global: true,
    action: "solana",
    badge: "FASTEST",
    cashback: "2% in $RTV",
    countries: "Global",
  },
  {
    id: "venmo",
    name: "Venmo",
    icon: "V",
    color: "#00d4ff",
    accent: "#00b4d8",
    description: "Pay with your Venmo balance",
    fee: "0% (personal) / 1.9% (business)",
    settlement: "30 min",
    global: false,
    action: "venmo",
    countries: "US only",
  },
  {
    id: "zelle",
    name: "Zelle",
    icon: "Z",
    color: "#6c35de",
    accent: "#8c55ff",
    description: "Zero fee bank-to-bank transfer",
    fee: "0%",
    settlement: "5 minutes",
    global: false,
    action: "zelle",
    badge: "ZERO FEES",
    countries: "US only",
  },
  {
    id: "coinbase",
    name: "USDC / Coinbase",
    icon: "₿",
    color: "#0052ff",
    accent: "#0066ff",
    description: "USDC stablecoin via Coinbase",
    fee: "1%",
    settlement: "10 seconds",
    global: true,
    action: "coinbase",
    countries: "Global",
  },
];

const ECOSYSTEM_PRODUCTS = [
  {
    id: "university_starter",
    name: "RTV University — Starter",
    company: "Rotation University",
    price: 49,
    period: "/mo",
    description: "Core AI & blockchain curriculum + 10 $RTV/mo",
    color: "#9945ff",
    stripe_price: "price_1TQ9fy6uXd0gkLrQZOTgS2bO",
  },
  {
    id: "university_pro",
    name: "RTV University — Pro",
    company: "Rotation University",
    price: 297,
    period: "/mo",
    description: "NFT Diploma + 1-on-1 mentor + 50 $RTV/mo",
    color: "#9945ff",
    stripe_price: "price_1TPvzr6uXd0gkLrQxVPFcEEe",
    badge: "MOST POPULAR",
  },
  {
    id: "rotationpay_merchant",
    name: "RotationPay — Merchant",
    company: "RotationPay",
    price: 99,
    period: "/mo",
    description: "All rails + 2% RTV cashback + API access",
    color: "#00cc88",
    stripe_price: "price_1TPvzu6uXd0gkLrQmP1gGIRK",
  },
  {
    id: "rotationcall_starter",
    name: "RotationCall — Starter",
    company: "RotationCall",
    price: 197,
    period: "/mo",
    description: "1,000 AI minutes + RotationPay integration",
    color: "#00d4ff",
    stripe_price: "price_1TQ9g56uXd0gkLrQ90Xz4Hvy",
  },
  {
    id: "rtv_2500",
    name: "2,500 $RTV Tokens",
    company: "RotationTV Network",
    price: 99,
    period: "",
    description: "2,500 $RTV delivered to your Solana wallet",
    color: "#ffd700",
    stripe_price: "price_1TQ9g86uXd0gkLrQo2T8gLos",
    badge: "BEST DEAL",
  },
];

function RailCard({ rail, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(rail.id)}
      style={{
        border: `2px solid ${selected ? rail.accent : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "16px",
        background: selected ? `${rail.color}15` : "rgba(255,255,255,0.02)",
        cursor: "pointer", transition: "all 0.2s",
        position: "relative",
        boxShadow: selected ? `0 0 30px ${rail.color}22` : "none",
      }}
    >
      {rail.badge && (
        <div style={{
          position: "absolute", top: -10, right: 12,
          background: `linear-gradient(135deg, ${rail.color}, ${rail.accent})`,
          color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: 1.5,
          padding: "3px 10px", borderRadius: 20,
        }}>{rail.badge}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, fontSize: 20,
            background: `${rail.color}22`, border: `1px solid ${rail.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{rail.icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{rail.name}</div>
            <div style={{ fontSize: 11, color: "#666" }}>{rail.description}</div>
          </div>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? rail.accent : "#333"}`,
          background: selected ? rail.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
          flexShrink: 0,
        }}>
          {selected && "✓"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: "#555" }}>Fee: <span style={{ color: "#aaa" }}>{rail.fee}</span></span>
        <span style={{ fontSize: 10, color: "#555" }}>Settlement: <span style={{ color: rail.accent }}>{rail.settlement}</span></span>
        <span style={{ fontSize: 10, color: "#555" }}>{rail.countries}</span>
        {rail.cashback && <span style={{ fontSize: 10, color: "#ffd700" }}>+ {rail.cashback}</span>}
      </div>
    </div>
  );
}

function RotationPayCheckoutInner() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRail, setSelectedRail] = useState("paypal");
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState(1); // 1=product, 2=rail, 3=confirm

  const product = ECOSYSTEM_PRODUCTS.find(p => p.id === selectedProduct);
  const rail = PAYMENT_RAILS.find(r => r.id === selectedRail);
  const amount = product?.price || parseFloat(customAmount) || 0;

  const handlePay = () => {
    if (selectedRail === "telegram") {
      window.open("https://t.me/wallet", "_blank");
      return;
    }
    if (selectedRail === "paypal") {
      window.open(PAYPAL_LINK, "_blank");
      return;
    }
    if (selectedRail === "stripe" && product?.stripe_price) {
      window.open(`https://checkout.stripe.com/pay/${product.stripe_price}`, "_blank");
      return;
    }
    if (selectedRail === "solana") {
      alert("Connect your Phantom wallet to pay with Solana / $RTV — coming in next deploy.");
      return;
    }
    alert(`${rail.name} checkout launching soon. PayPal and Stripe are live now.`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #030309 0%, #08081a 50%, #030309 100%)",
      color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif",
      padding: "24px 20px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#00cc88", fontWeight: 800, marginBottom: 8 }}>
            ROTATIONPAY
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            Universal{" "}
            <span style={{ background: "linear-gradient(135deg, #00cc88, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Checkout
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#555" }}>
            PayPal · Stripe · Solana · Venmo · Zelle · Coinbase — one gateway
          </div>
        </div>

        {/* Step 1: Product Selection */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#ffd700", fontWeight: 800, marginBottom: 16 }}>
            STEP 1 — SELECT PRODUCT
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {ECOSYSTEM_PRODUCTS.map(p => (
              <div key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                style={{
                  padding: "14px 16px", borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                  border: `1px solid ${selectedProduct === p.id ? p.color + "66" : "rgba(255,255,255,0.06)"}`,
                  background: selectedProduct === p.id ? `${p.color}12` : "rgba(255,255,255,0.02)",
                  position: "relative",
                }}
              >
                {p.badge && (
                  <div style={{
                    position: "absolute", top: -8, right: 10,
                    background: p.color, color: "#000",
                    fontSize: 8, fontWeight: 900, padding: "2px 8px", borderRadius: 20,
                  }}>{p.badge}</div>
                )}
                <div style={{ fontSize: 11, color: p.color, fontWeight: 700, marginBottom: 4 }}>{p.company}</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{p.description}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: p.color }}>
                  ${p.price}<span style={{ fontSize: 11, color: "#555" }}>{p.period}</span>
                </div>
              </div>
            ))}
            {/* Custom Amount */}
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              border: "1px dashed rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.01)",
            }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Custom Amount</div>
              <input
                type="number"
                placeholder="Enter $USD amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedProduct(null); }}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 16, fontWeight: 900, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Step 2: Payment Rail */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#ffd700", fontWeight: 800, marginBottom: 16 }}>
            STEP 2 — CHOOSE PAYMENT METHOD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PAYMENT_RAILS.map(r => (
              <RailCard key={r.id} rail={r} selected={selectedRail === r.id} onSelect={setSelectedRail} />
            ))}
          </div>
        </div>

        {/* Order Summary + Pay */}
        <div style={{
          background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 20, padding: 24,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#ffd700", fontWeight: 800, marginBottom: 16 }}>
            ORDER SUMMARY
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#888", fontSize: 13 }}>Product</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{product?.name || (customAmount ? `Custom: $${customAmount}` : "Select a product")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#888", fontSize: 13 }}>Payment via</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: rail?.accent }}>{rail?.icon} {rail?.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#888", fontSize: 13 }}>Processing fee</span>
            <span style={{ fontSize: 13, color: "#666" }}>{rail?.fee}</span>
          </div>
          {rail?.cashback && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#888", fontSize: 13 }}>$RTV Cashback</span>
              <span style={{ fontSize: 13, color: "#ffd700" }}>+{rail.cashback}</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>Total</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#ffd700" }}>
              {amount > 0 ? `$${amount.toFixed(2)}` : "—"}
            </span>
          </div>

          <button
            onClick={handlePay}
            disabled={!amount || (!selectedProduct && !customAmount)}
            style={{
              width: "100%", marginTop: 20, padding: "16px",
              background: amount > 0
                ? `linear-gradient(135deg, ${rail?.color || "#00cc88"}, ${rail?.accent || "#00d4ff"})`
                : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 14,
              color: amount > 0 ? "#fff" : "#333",
              fontWeight: 900, fontSize: 16, cursor: amount > 0 ? "pointer" : "not-allowed",
              letterSpacing: 1, transition: "all 0.2s",
            }}
          >
            {rail?.id === "paypal" ? "🅿️ Pay with PayPal →" :
             rail?.id === "solana" ? "◎ Pay with Solana →" :
             rail?.id === "stripe" ? "💳 Pay with Card →" :
             `Pay with ${rail?.name} →`}
          </button>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "#333" }}>
            🔒 Secured by RotationPay · Presidential Authority: Darrel · "Learn it. Live it. Love it."
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RotationPayCheckout() {
  return <OwnerGate><RotationPayCheckoutInner /></OwnerGate>;
}
