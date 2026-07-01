// RTV Network — Pricing Command Center
// Nothing is free. Everything earns. Presidential Authority: Darrel
import { useState } from "react";
import OwnerGate from "./OwnerGate";

const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY";

const PRICING = {
  university: {
    name: "RTV AI University",
    icon: "🎓",
    color: "#9945ff",
    tagline: "Learn it. Live it. Love it.",
    tiers: [
      {
        name: "Starter",
        price: "$49",
        period: "/mo",
        priceId: "price_1TQ9fy6uXd0gkLrQZOTgS2bO",
        features: [
          "Core AI & blockchain curriculum",
          "Community Discord access",
          "Certificate of completion",
          "10 $RTV tokens/month reward",
        ],
        cta: "Enroll Now",
        highlight: false,
      },
      {
        name: "Pro",
        price: "$297",
        period: "/mo",
        priceId: "price_1TPvzr6uXd0gkLrQxVPFcEEe",
        features: [
          "Full curriculum + live sessions",
          "NFT Diploma minted on Solana",
          "1-on-1 mentor sessions",
          "50 $RTV tokens/month reward",
          "Job placement in RTV ecosystem",
        ],
        cta: "Go Pro",
        highlight: true,
        badge: "MOST POPULAR",
      },
      {
        name: "Annual",
        price: "$1,997",
        period: "/yr",
        priceId: "price_1TQ9fy6uXd0gkLrQAHMQXldM",
        features: [
          "Everything in Pro",
          "Save $1,567 vs monthly",
          "Exclusive cohort access",
          "200 $RTV tokens bonus",
          "Priority ecosystem placement",
        ],
        cta: "Best Value",
        highlight: false,
        badge: "SAVE 44%",
      },
    ],
  },
  rotationpay: {
    name: "RotationPay",
    icon: "💳",
    color: "#00cc88",
    tagline: "One gateway. Every rail. Zero friction.",
    tiers: [
      {
        name: "Starter",
        price: "$29",
        period: "/mo",
        priceId: "price_1TQ9g16uXd0gkLrQs8Q8aBpq",
        features: [
          "Accept crypto + card",
          "Solana + USDC rails",
          "Up to $10K/mo volume",
          "2.9% + $0.30 per transaction",
          "Basic dashboard",
        ],
        cta: "Start Accepting",
        highlight: false,
      },
      {
        name: "Merchant",
        price: "$99",
        period: "/mo",
        priceId: "price_1TPvzu6uXd0gkLrQmP1gGIRK",
        features: [
          "Solana + Fiat + RTV token",
          "Venmo, Zelle, Coinbase",
          "Up to $100K/mo volume",
          "1.9% + $0.20 per transaction",
          "2% cashback in $RTV",
          "API access",
        ],
        cta: "Go Merchant",
        highlight: true,
        badge: "BEST VALUE",
      },
      {
        name: "Enterprise",
        price: "$499",
        period: "/mo",
        priceId: "price_1TQ9g16uXd0gkLrQ8y0HlFdL",
        features: [
          "Unlimited volume",
          "All rails + custom routing",
          "0.9% flat rate",
          "Revenue splits on-chain",
          "White-label gateway",
          "Dedicated support",
          "Custom $RTV rewards",
        ],
        cta: "Go Enterprise",
        highlight: false,
        badge: "UNLIMITED",
      },
    ],
  },
  rotationcall: {
    name: "RotationCall",
    icon: "📞",
    color: "#00d4ff",
    tagline: "The AI voice platform for Web3.",
    tiers: [
      {
        name: "Starter",
        price: "$197",
        period: "/mo",
        priceId: "price_1TQ9g56uXd0gkLrQ90Xz4Hvy",
        features: [
          "1,000 AI minutes/month",
          "Inbound + outbound calls",
          "Basic IVR flows",
          "RotationPay integration",
          "Call recordings",
        ],
        cta: "Start Calling",
        highlight: false,
      },
      {
        name: "Enterprise",
        price: "$497",
        period: "/mo",
        priceId: "price_1TPvzw6uXd0gkLrQtwYJF8qn",
        features: [
          "10,000 AI minutes/month",
          "Custom AI voice agents",
          "On-chain call verification",
          "NFT call receipts",
          "Take payments over voice",
          "White-label option",
        ],
        cta: "Go Enterprise",
        highlight: true,
        badge: "TWILIO KILLER",
      },
      {
        name: "Web3 Unlimited",
        price: "$1,997",
        period: "/mo",
        priceId: "price_1TQ9g56uXd0gkLrQoxEaAjuO",
        features: [
          "Unlimited AI minutes",
          "Dedicated Solana node",
          "Custom LLM voice model",
          "Full RotationPay integration",
          "Immutable call logs on-chain",
          "Priority build support",
          "SLA guarantee",
        ],
        cta: "Maximum Power",
        highlight: false,
        badge: "FULL POWER",
      },
    ],
  },
  rtv_token: {
    name: "$RTV Token Packs",
    icon: "🔴",
    color: "#ffd700",
    tagline: "Fuel the ecosystem. Stake. Earn. Govern.",
    tiers: [
      {
        name: "1,000 RTV",
        price: "$49",
        period: "",
        priceId: "price_1TPvzz6uXd0gkLrQwC6zA7ma",
        features: [
          "1,000 $RTV to your wallet",
          "RotationPay fee discounts",
          "DAO governance vote",
          "Staking eligible",
        ],
        cta: "Buy 1K RTV",
        highlight: false,
      },
      {
        name: "2,500 RTV",
        price: "$99",
        period: "",
        priceId: "price_1TQ9g86uXd0gkLrQo2T8gLos",
        features: [
          "2,500 $RTV to your wallet",
          "Save $23 vs standard price",
          "Enhanced staking rewards",
          "University credit eligible",
        ],
        cta: "Buy 2.5K RTV",
        highlight: false,
      },
      {
        name: "5,500 RTV",
        price: "$199",
        period: "",
        priceId: "price_1TQ9g86uXd0gkLrQsmXwYjsR",
        features: [
          "5,500 $RTV to your wallet",
          "Save $71 vs standard",
          "Premium staking tier",
          "Merchant fee waiver",
          "University Pro credit",
        ],
        cta: "Buy 5.5K RTV",
        highlight: true,
        badge: "BEST DEAL",
      },
      {
        name: "12,500 RTV",
        price: "$499",
        period: "",
        priceId: "price_1TQ9g86uXd0gkLrQyk7YvEMd",
        features: [
          "12,500 $RTV to your wallet",
          "Save $126 vs standard",
          "Elite staking — max APY",
          "RotationCall minutes bonus",
          "VIP ecosystem status",
          "Direct Darrel access",
        ],
        cta: "Go Elite",
        highlight: false,
        badge: "WHALE TIER",
      },
    ],
  },
};

function PricingCard({ tier, color }) {
  const checkout = async () => {
    try {
      window.open(`https://buy.stripe.com/${tier.priceId}`, '_blank');
    } catch (e) {
      alert('Checkout coming soon');
    }
  };

  return (
    <div style={{
      background: tier.highlight
        ? `linear-gradient(160deg, ${color}15, ${color}08)`
        : "rgba(255,255,255,0.02)",
      border: `1px solid ${tier.highlight ? color + "44" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 20, padding: 24,
      position: "relative", transition: "transform 0.2s",
      boxShadow: tier.highlight ? `0 0 40px ${color}22` : "none",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {tier.badge && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${color}, ${color}aa)`,
          color: "#000", fontSize: 10, fontWeight: 900, letterSpacing: 2,
          padding: "4px 14px", borderRadius: 20,
        }}>{tier.badge}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{tier.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color }}>{tier.price}</span>
          <span style={{ fontSize: 13, color: "#666" }}>{tier.period}</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        {tier.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color, fontSize: 12 }}>✓</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>{f}</span>
          </div>
        ))}
      </div>

      <button onClick={checkout} style={{
        width: "100%", padding: "12px",
        background: tier.highlight
          ? `linear-gradient(135deg, ${color}, ${color}aa)`
          : "rgba(255,255,255,0.06)",
        border: `1px solid ${tier.highlight ? "transparent" : color + "44"}`,
        borderRadius: 12, color: tier.highlight ? "#000" : color,
        fontWeight: 900, fontSize: 13, cursor: "pointer",
        letterSpacing: 1, transition: "all 0.2s",
      }}>
        {tier.cta} →
      </button>
      <button onClick={() => window.open(PAYPAL_LINK, '_blank')} style={{
        width: "100%", padding: "10px", marginTop: 8,
        background: "rgba(0,48,135,0.3)", border: "1px solid rgba(0,156,222,0.4)",
        borderRadius: 12, color: "#009cde", fontWeight: 800, fontSize: 12, cursor: "pointer",
      }}>
        🅿️ Pay with PayPal
      </button>
    </div>
  );
}

function ProductSection({ product }) {
  const p = PRICING[product];
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${p.color}22`, border: `1px solid ${p.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>{p.icon}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{p.name}</div>
          <div style={{ fontSize: 12, color: p.color }}>{p.tagline}</div>
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${p.tiers.length}, 1fr)`,
        gap: 16,
      }}>
        {p.tiers.map((tier, i) => (
          <PricingCard key={i} tier={tier} color={p.color} />
        ))}
      </div>
    </div>
  );
}

function PricingCommandInner() {
  const [activeProduct, setActiveProduct] = useState("all");

  const TABS = [
    { id: "all", label: "🌐 All Products" },
    { id: "university", label: "🎓 University" },
    { id: "rotationpay", label: "💳 RotationPay" },
    { id: "rotationcall", label: "📞 RotationCall" },
    { id: "rtv_token", label: "🔴 $RTV Token" },
  ];

  // Revenue projections
  const projections = [
    { label: "University × 100 students", monthly: "$29,700", annual: "$356,400", color: "#9945ff" },
    { label: "RotationPay × 50 merchants", monthly: "$4,950", annual: "$59,400", color: "#00cc88" },
    { label: "RotationCall × 20 clients", monthly: "$9,940", annual: "$119,280", color: "#00d4ff" },
    { label: "$RTV Token sales", monthly: "$9,800", annual: "$117,600", color: "#ffd700" },
  ];

  const totalMonthly = projections.reduce((sum, p) => sum + parseInt(p.monthly.replace(/[$,]/g, "")), 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #030309 0%, #080818 50%, #030309 100%)",
      color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,215,0,0.04)",
        borderBottom: "1px solid rgba(255,215,0,0.1)",
        padding: "24px 20px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#ffd700", fontWeight: 800, marginBottom: 8 }}>
              ROTATIONTV NETWORK
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
              Nothing Is Free.{" "}
              <span style={{ background: "linear-gradient(135deg, #ffd700, #ff6b00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Everything Earns.
              </span>
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              Presidential pricing architecture — built to dominate every market
            </div>
          </div>

          {/* Revenue Projections */}
          <div style={{
            background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)",
            borderRadius: 16, padding: 20, marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 800, letterSpacing: 2, marginBottom: 16 }}>
              💰 REVENUE PROJECTIONS (CONSERVATIVE)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {projections.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>{p.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: p.color }}>{p.monthly}/mo</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,215,0,0.1)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "#ffd700", fontWeight: 700 }}>TOTAL MONTHLY POTENTIAL</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#ffd700" }}>
                ${totalMonthly.toLocaleString()}/mo
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveProduct(t.id)} style={{
                padding: "8px 18px", borderRadius: 20, border: "none",
                background: activeProduct === t.id ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
                color: activeProduct === t.id ? "#ffd700" : "#666",
                fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                border: `1px solid ${activeProduct === t.id ? "rgba(255,215,0,0.4)" : "transparent"}`,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {activeProduct === "all"
          ? Object.keys(PRICING).map(key => <ProductSection key={key} product={key} />)
          : <ProductSection product={activeProduct} />
        }

        {/* Bottom CTA */}
        <div style={{
          textAlign: "center", marginTop: 48, padding: 40,
          background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)",
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
            Custom Enterprise Deal?
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
            Building something big? Let's talk volume discounts, white-label, and custom $RTV arrangements.
          </div>
          <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 800, letterSpacing: 2 }}>
            📧 ROTATIONTV1@GMAIL.COM — PRESIDENTIAL DEALS ONLY
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingCommand() {
  return <OwnerGate><PricingCommandInner /></OwnerGate>;
}
