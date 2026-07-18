/**
 * ROTATIONEROTICA — FULL PLATFORM APP
 * Rotationtvnetwork LLC | Presidential Authority: Darrel
 * 18+ Age-Verified | Telegram Mini App
 * Design: Locked — #6C5CE7 purple system, dark surface, glassmorphism
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
interface Creator {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_live: boolean;
  viewer_count: number;
  tier: "basic" | "pro" | "enterprise";
  price_basic: number;
  price_pro: number;
  preview_locked: boolean;
  tags: string[];
  total_earned_rtv: number;
  rank: number;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  is_gift?: boolean;
  gift_emoji?: string;
  gift_amount?: number;
  color?: string;
  ts: number;
}

interface Gift {
  id: string;
  emoji: string;
  name: string;
  price_rtv: number;
  animation: string;
}

// ── Design tokens (LOCKED) ─────────────────────────────────────────────────
const T = {
  primary: "#6C5CE7",
  secondary: "#A29BFE",
  accent: "#00CEC9",
  bg: "#0D0D0D",
  surface: "#1A1A2E",
  card: "#16213E",
  text: "#FFFFFF",
  textSec: "#B2B2B2",
  success: "#00B894",
  error: "#FF6B6B",
  warning: "#FDCB6E",
  tribute: "#FF6B35",
  stripe: "#635BFF",
  paypal: "#003087",
};

// ── Mock data ──────────────────────────────────────────────────────────────
const GIFTS: Gift[] = [
  { id: "rose", emoji: "🌹", name: "Rose", price_rtv: 10, animation: "float" },
  { id: "fire", emoji: "🔥", name: "Fire", price_rtv: 50, animation: "burst" },
  { id: "diamond", emoji: "💎", name: "Diamond", price_rtv: 200, animation: "sparkle" },
  { id: "crown", emoji: "👑", name: "Crown", price_rtv: 500, animation: "crown" },
  { id: "rocket", emoji: "🚀", name: "Rocket", price_rtv: 1000, animation: "launch" },
  { id: "heart", emoji: "❤️‍🔥", name: "Burning Heart", price_rtv: 100, animation: "pulse" },
];

const MOCK_CREATORS: Creator[] = [
  {
    id: "1", handle: "luna_rose", display_name: "Luna Rose 🌹",
    avatar_url: "", bio: "Dreamy vibes, weekly lives, exclusive vault 💜",
    is_live: true, viewer_count: 1247, tier: "pro",
    price_basic: 999, price_pro: 2999, preview_locked: false,
    tags: ["🌙 Dreamy", "💜 Goth", "🎵 ASMR"], total_earned_rtv: 485000, rank: 1,
  },
  {
    id: "2", handle: "scarlett_x", display_name: "Scarlett X ⚡",
    avatar_url: "", bio: "PK queen. Come challenge me. 🔥",
    is_live: true, viewer_count: 892, tier: "enterprise",
    price_basic: 999, price_pro: 2999, preview_locked: true,
    tags: ["⚡ PK Queen", "🔥 Dominant", "💰 High Stakes"], total_earned_rtv: 921000, rank: 2,
  },
  {
    id: "3", handle: "jade_bloom", display_name: "Jade Bloom 🌸",
    avatar_url: "", bio: "Slow burn. Worth every RTVS 💎",
    is_live: false, viewer_count: 0, tier: "basic",
    price_basic: 999, price_pro: 1999, preview_locked: false,
    tags: ["🌸 Sensual", "💎 Premium", "📸 Photo Sets"], total_earned_rtv: 126000, rank: 3,
  },
];

// ── Live Preview + Chat ────────────────────────────────────────────────────
function LivePreviewCard({ creator, onEnter }: { creator: Creator; onEnter: () => void }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", username: "crypto_king", text: "🔥 fire stream", ts: Date.now() - 4000 },
    { id: "2", username: "anon_99", text: "sending rose 🌹", is_gift: true, gift_emoji: "🌹", gift_amount: 10, color: T.tribute, ts: Date.now() - 2000 },
    { id: "3", username: "whale_xx", text: "let's PK tonight?", ts: Date.now() - 800 },
  ]);
  const [giftAnim, setGiftAnim] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Simulate incoming chat
  useEffect(() => {
    if (!creator.is_live) return;
    const msgs = ["amazing vibe 💜", "sending 💎", "been here 2hrs lol", "🔥🔥🔥", "let's go!"];
    const names = ["rtv_fan", "luna_lover", "big_tipper", "new_user", "daily_viewer"];
    const interval = setInterval(() => {
      const isGift = Math.random() < 0.3;
      const gift = GIFTS[Math.floor(Math.random() * 3)];
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        username: names[Math.floor(Math.random() * names.length)],
        text: isGift ? `sent ${gift.name}!` : msgs[Math.floor(Math.random() * msgs.length)],
        is_gift: isGift,
        gift_emoji: isGift ? gift.emoji : undefined,
        gift_amount: isGift ? gift.price_rtv : undefined,
        color: isGift ? T.warning : undefined,
        ts: Date.now(),
      };
      setChatMessages(prev => [...prev.slice(-30), msg]);
      if (isGift) {
        setGiftAnim(gift.emoji);
        setTimeout(() => setGiftAnim(null), 2000);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [creator.is_live]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: T.card,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid rgba(108,92,231,0.3)`,
        boxShadow: `0 0 20px rgba(108,92,231,0.15)`,
        marginBottom: 16,
      }}
    >
      {/* Stream preview area */}
      <div style={{ position: "relative", height: 200, background: `linear-gradient(135deg, #1a0a2e, #0d0d1a)` }}>
        {/* Gradient avatar placeholder */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, rgba(108,92,231,0.4) 0%, rgba(162,155,254,0.2) 50%, rgba(0,0,0,0.8) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#fff",
            boxShadow: `0 0 24px rgba(108,92,231,0.6)`,
          }}>
            {creator.display_name.charAt(0)}
          </div>
        </div>

        {/* Preview blur overlay for locked streams */}
        {creator.preview_locked && (
          <div style={{
            position: "absolute", inset: 0,
            backdropFilter: "blur(20px)",
            background: "rgba(13,13,13,0.6)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>Subscribe to Unlock Preview</span>
            <span style={{ color: T.secondary, fontSize: 11 }}>{(creator.price_basic / 100).toFixed(2)} USD/mo</span>
          </div>
        )}

        {/* LIVE badge */}
        {creator.is_live && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF4444", boxShadow: "0 0 8px #FF4444" }}
            />
            <span style={{ background: "#FF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, letterSpacing: "0.12em" }}>LIVE</span>
          </div>
        )}

        {/* Viewer count */}
        {creator.is_live && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 11,
            padding: "3px 8px", borderRadius: 6, backdropFilter: "blur(8px)",
          }}>
            👁 {creator.viewer_count.toLocaleString()}
          </div>
        )}

        {/* Floating gift animation */}
        <AnimatePresence>
          {giftAnim && (
            <motion.div
              key={giftAnim + Date.now()}
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 2, y: -80 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              style={{
                position: "absolute", bottom: 20, right: 20,
                fontSize: 36, pointerEvents: "none",
              }}
            >
              {giftAnim}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live chat preview */}
      {creator.is_live && (
        <div
          ref={chatRef}
          style={{
            height: 90, overflowY: "auto", padding: "8px 12px",
            background: "rgba(0,0,0,0.3)",
            scrollbarWidth: "none",
          }}
        >
          {chatMessages.map(msg => (
            <div key={msg.id} style={{ fontSize: 11, marginBottom: 3, display: "flex", gap: 4 }}>
              <span style={{ color: msg.is_gift ? T.warning : T.secondary, fontWeight: 600, flexShrink: 0 }}>
                {msg.is_gift ? `${msg.gift_emoji}` : ""}{msg.username}:
              </span>
              <span style={{ color: msg.is_gift ? T.warning : T.textSec }}>{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Creator info + actions */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{creator.display_name}</div>
            <div style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>@{creator.handle}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: T.warning, fontSize: 11, fontWeight: 600 }}>#{creator.rank} RANK</div>
            <div style={{ color: T.textSec, fontSize: 10 }}>{(creator.total_earned_rtv / 1000).toFixed(0)}K RTVS earned</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {creator.tags.map(tag => (
            <span key={tag} style={{
              background: "rgba(108,92,231,0.15)", color: T.secondary,
              fontSize: 10, padding: "2px 8px", borderRadius: 20,
              border: `1px solid rgba(108,92,231,0.3)`,
            }}>{tag}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            style={{
              flex: 1, background: `linear-gradient(135deg, ${T.primary}, #8B78FF)`,
              color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 16px rgba(108,92,231,0.4)`,
            }}
          >
            {creator.is_live ? "🔴 Join Live" : "👁 View Profile"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            style={{
              background: "rgba(255,107,53,0.15)", color: T.tribute,
              border: `1px solid rgba(255,107,53,0.4)`, borderRadius: 10,
              padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            💝 Tribute
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Gift Panel ─────────────────────────────────────────────────────────────
function GiftPanel({ onSend, balance }: { onSend: (gift: Gift) => void; balance: number }) {
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ color: T.textSec, fontSize: 11, marginBottom: 10, paddingLeft: 4 }}>
        💰 Balance: <span style={{ color: T.warning, fontWeight: 700 }}>{balance.toLocaleString()} RTVS</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {GIFTS.map(gift => (
          <motion.button
            key={gift.id}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSend(gift)}
            style={{
              background: T.card, border: `1px solid rgba(108,92,231,0.2)`,
              borderRadius: 12, padding: "10px 6px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 22 }}>{gift.emoji}</span>
            <span style={{ color: T.text, fontSize: 10, fontWeight: 600 }}>{gift.name}</span>
            <span style={{ color: T.warning, fontSize: 10 }}>{gift.price_rtv} RTVS</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Payment Modal ──────────────────────────────────────────────────────────
function PaymentModal({ creator, onClose, onSuccess }: {
  creator: Creator;
  onClose: () => void;
  onSuccess: (method: string, tier: string) => void;
}) {
  const [selectedTier, setSelectedTier] = useState<"basic" | "pro">("basic");
  const [selectedMethod, setSelectedMethod] = useState<string>("stripe");
  const [loading, setLoading] = useState(false);

  const tiers = [
    { id: "basic", label: "Basic", price: creator.price_basic / 100, features: ["All photos", "Monthly live", "DM access"] },
    { id: "pro", label: "Pro", price: creator.price_pro / 100, features: ["All content", "Weekly live", "Priority DMs", "Video vault", "Custom requests"] },
  ];

  const methods = [
    { id: "stripe", label: "Card / Apple Pay", icon: "💳", color: T.stripe },
    { id: "paypal", label: "PayPal", icon: "🅿️", color: "#009cde" },
    { id: "tribute", label: "Tribute", icon: "💝", color: T.tribute },
    { id: "ton", label: "TON Wallet", icon: "💎", color: "#0088CC" },
    { id: "stars", label: "Telegram Stars", icon: "⭐", color: T.warning },
  ];

  const handlePay = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    onSuccess(selectedMethod, selectedTier);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        style={{
          background: T.surface, borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480, padding: "20px 20px 32px",
          border: `1px solid rgba(108,92,231,0.3)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ color: T.text, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          Subscribe to {creator.display_name}
        </div>
        <div style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>
          Instant access. Cancel anytime.
        </div>

        {/* Tier selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {tiers.map(tier => (
            <motion.button
              key={tier.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedTier(tier.id as any)}
              style={{
                flex: 1, background: selectedTier === tier.id
                  ? `linear-gradient(135deg, ${T.primary}, #8B78FF)`
                  : T.card,
                border: `2px solid ${selectedTier === tier.id ? T.primary : "rgba(255,255,255,0.06)"}`,
                borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "left",
                boxShadow: selectedTier === tier.id ? `0 4px 16px rgba(108,92,231,0.35)` : "none",
              }}
            >
              <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{tier.label}</div>
              <div style={{ color: selectedTier === tier.id ? "#E0DCFF" : T.warning, fontSize: 16, fontWeight: 800, margin: "4px 0" }}>
                ${tier.price}/mo
              </div>
              {tier.features.map(f => (
                <div key={f} style={{ color: selectedTier === tier.id ? "#C8C0FF" : T.textSec, fontSize: 10, marginTop: 2 }}>
                  ✓ {f}
                </div>
              ))}
            </motion.button>
          ))}
        </div>

        {/* Payment methods */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.textSec, fontSize: 11, marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em" }}>
            PAYMENT METHOD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {methods.map(m => (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: selectedMethod === m.id ? "rgba(108,92,231,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedMethod === m.id ? T.primary : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ color: T.text, fontSize: 13, fontWeight: 500, flex: 1, textAlign: "left" }}>{m.label}</span>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `2px solid ${selectedMethod === m.id ? T.primary : "rgba(255,255,255,0.2)"}`,
                  background: selectedMethod === m.id ? T.primary : "transparent",
                }} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Pay button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePay}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "rgba(108,92,231,0.5)" : `linear-gradient(135deg, ${T.primary}, #8B78FF)`,
            color: "#fff", border: "none", borderRadius: 14,
            padding: "16px 0", fontSize: 15, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 6px 24px rgba(108,92,231,0.45)`,
            letterSpacing: "0.02em",
          }}
        >
          {loading ? "⏳ Processing…" : `🔓 Unlock for $${(selectedTier === "basic" ? creator.price_basic : creator.price_pro) / 100}/mo`}
        </motion.button>

        <div style={{ color: T.textSec, fontSize: 10, textAlign: "center", marginTop: 10 }}>
          🔒 Secure. 80% goes directly to creator. Cancel anytime.
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function RotationEroticaApp() {
  const [view, setView] = useState<"home" | "live" | "vault" | "wallet" | "ranking">("home");
  const [ageVerified, setAgeVerified] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [activeCreator, setActiveCreator] = useState<Creator | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [subscribedCreators, setSubscribedCreators] = useState<string[]>([]);
  const [balance, setBalance] = useState(2500);
  const [showGifts, setShowGifts] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<Array<{ id: string; emoji: string; x: number }>>([]);

  const sendGift = (gift: Gift) => {
    if (balance < gift.price_rtv) return;
    setBalance(b => b - gift.price_rtv);
    const anim = { id: crypto.randomUUID(), emoji: gift.emoji, x: Math.random() * 80 + 10 };
    setFloatingGifts(f => [...f, anim]);
    setTimeout(() => setFloatingGifts(f => f.filter(g => g.id !== anim.id)), 2000);
  };

  // Age gate
  if (showAgeGate) {
    return (
      <div style={{
        minHeight: "100vh", background: T.bg, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif", padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: 360, width: "100%", textAlign: "center",
            background: T.card, borderRadius: 24, padding: 32,
            border: `1px solid rgba(108,92,231,0.3)`,
            boxShadow: `0 0 60px rgba(108,92,231,0.2)`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌹</div>
          <div style={{ color: T.text, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Welcome to Rotation Erotica
          </div>
          <div style={{ color: "#A29BFE", fontSize: 13, fontStyle: "italic", marginBottom: 4 }}>
            "Where AI Meets Desire"
          </div>
          <div style={{ color: T.textSec, fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
            Premium AI-powered adult entertainment platform by RotationTV Network LLC.
            18+ only. Adult content inside.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {[
              ["💰", "Earn RTV tokens for live streaming"],
              ["⚔️", "Win PK Battles for prize pools"],
              ["💳", "Weekly USD payouts via Stripe"],
              ["🎁", "Referral bonuses & hosting milestones"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ color: T.textSec, fontSize: 12 }}>{text}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setAgeVerified(true); setShowAgeGate(false); }}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${T.primary}, #8B78FF)`,
              color: "#fff", border: "none", borderRadius: 14,
              padding: "16px 0", fontSize: 15, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 6px 24px rgba(108,92,231,0.45)`, marginBottom: 10,
            }}
          >
            🔞 I am 18+ — Enter Platform
          </motion.button>
          <div style={{ color: T.textSec, fontSize: 10 }}>
            By entering you confirm you are 18+ and consent to adult content
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "live", icon: "🔴", label: "Live" },
    { id: "vault", icon: "🔐", label: "Vault" },
    { id: "wallet", icon: "💰", label: "Wallet" },
    { id: "ranking", icon: "👑", label: "Ranks" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, sans-serif", paddingBottom: 80, color: T.text }}>

      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        background: `linear-gradient(180deg, rgba(26,26,46,0.98) 0%, rgba(13,13,13,0.0) 100%)`,
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌹</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Rotation Erotica</div>
            <div style={{ fontSize: 9, color: T.secondary, letterSpacing: "0.12em" }}>PREMIUM AI ADULT</div>
          </div>
        </div>
        <div style={{
          background: "rgba(108,92,231,0.15)", border: `1px solid rgba(108,92,231,0.3)`,
          borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 14 }}>💰</span>
          <span style={{ color: T.warning, fontWeight: 700, fontSize: 13 }}>{balance.toLocaleString()}</span>
          <span style={{ color: T.textSec, fontSize: 10 }}>RTVS</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 14px" }}>

        {/* HOME */}
        {view === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ padding: "12px 0 8px", fontSize: 11, color: T.textSec, fontWeight: 600, letterSpacing: "0.1em" }}>
              🔥 TRENDING CREATORS
            </div>
            {MOCK_CREATORS.map(creator => (
              <LivePreviewCard
                key={creator.id}
                creator={creator}
                onEnter={() => {
                  setActiveCreator(creator);
                  if (!subscribedCreators.includes(creator.id) && creator.preview_locked) {
                    setShowPayment(true);
                  } else {
                    setView("live");
                  }
                }}
              />
            ))}
          </motion.div>
        )}

        {/* LIVE VIEW */}
        {view === "live" && activeCreator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: T.secondary, fontSize: 13, cursor: "pointer", padding: "8px 0 12px" }}>
              ← Back
            </button>

            {/* Full stream area */}
            <div style={{ position: "relative", height: 260, background: `linear-gradient(135deg, #1a0a2e, #0d0d1a)`, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, rgba(108,92,231,0.35), rgba(0,206,201,0.15))`,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>🌹</div>
                  <div style={{ color: T.text, fontWeight: 800, fontSize: 18 }}>{activeCreator.display_name}</div>
                  <div style={{ color: T.secondary, fontSize: 12 }}>@{activeCreator.handle}</div>
                </div>
              </div>

              {/* Floating gifts */}
              <AnimatePresence>
                {floatingGifts.map(g => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 1, scale: 1, y: 200 }}
                    animate={{ opacity: 0, scale: 1.8, y: 50 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    style={{ position: "absolute", bottom: 20, left: `${g.x}%`, fontSize: 32, pointerEvents: "none" }}
                  >
                    {g.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>

              {activeCreator.is_live && (
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF4444", boxShadow: "0 0 8px #FF4444" }} />
                  <span style={{ background: "#FF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5 }}>LIVE</span>
                </div>
              )}
            </div>

            {/* Gift button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGifts(s => !s)}
              style={{
                width: "100%", background: `linear-gradient(135deg, ${T.tribute}, #FF8C5A)`,
                color: "#fff", border: "none", borderRadius: 12,
                padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 16px rgba(255,107,53,0.35)`, marginBottom: 10,
              }}
            >
              🎁 Send Gift
            </motion.button>

            <AnimatePresence>
              {showGifts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <GiftPanel onSend={sendGift} balance={balance} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subscribe CTA */}
            {!subscribedCreators.includes(activeCreator.id) && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowPayment(true)}
                style={{
                  width: "100%", background: `linear-gradient(135deg, ${T.primary}, #8B78FF)`,
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 16px rgba(108,92,231,0.4)`,
                }}
              >
                💎 Subscribe for Full Access — ${(activeCreator.price_basic / 100).toFixed(2)}/mo
              </motion.button>
            )}
          </motion.div>
        )}

        {/* VAULT */}
        {view === "vault" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ padding: "12px 0 16px", fontSize: 11, color: T.textSec, fontWeight: 600, letterSpacing: "0.1em" }}>
              🔐 CONTENT VAULT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { emoji: "🌹", title: "Boudoir Session", creator: "Luna Rose", locked: false, tier: "basic" },
                { emoji: "🔥", title: "Late Night 🌙", creator: "Scarlett X", locked: true, tier: "pro" },
                { emoji: "💜", title: "Private Show", creator: "Luna Rose", locked: true, tier: "pro" },
                { emoji: "✨", title: "Photo Album Vol.3", creator: "Jade Bloom", locked: false, tier: "basic" },
                { emoji: "🎬", title: "Collab Feature", creator: "Scarlett + Luna", locked: true, tier: "enterprise" },
                { emoji: "💎", title: "Custom Request", creator: "Luna Rose", locked: true, tier: "enterprise" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: T.card, borderRadius: 12,
                    border: `1px solid rgba(108,92,231,${item.locked ? 0.15 : 0.35})`,
                    overflow: "hidden", cursor: "pointer",
                  }}
                >
                  <div style={{
                    height: 100, background: `linear-gradient(135deg, rgba(108,92,231,0.3), rgba(0,0,0,0.8))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, position: "relative",
                    filter: item.locked ? "blur(4px)" : "none",
                  }}>
                    {item.emoji}
                    {item.locked && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", filter: "none" }}>
                        <span style={{ fontSize: 22 }}>🔒</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: T.textSec, fontSize: 10, marginTop: 2 }}>{item.creator}</div>
                    <div style={{
                      marginTop: 4, fontSize: 9, fontWeight: 700,
                      color: item.tier === "enterprise" ? T.warning : item.tier === "pro" ? T.primary : T.success,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>{item.tier}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* WALLET */}
        {view === "wallet" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ padding: "12px 0 16px", fontSize: 11, color: T.textSec, fontWeight: 600, letterSpacing: "0.1em" }}>
              💰 WALLET
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${T.primary}, #8B78FF)`,
              borderRadius: 16, padding: 20, marginBottom: 16,
              boxShadow: `0 8px 32px rgba(108,92,231,0.4)`,
            }}>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>RTVS Balance</div>
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "4px 0" }}>{balance.toLocaleString()}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>${(balance * 0.01).toFixed(2)} USD</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["🏦", "Withdraw", T.success], ["💳", "Add Funds", T.primary], ["📤", "Transfer", T.accent]].map(([icon, label, color]) => (
                <motion.button key={label} whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1, background: T.card, border: `1px solid rgba(255,255,255,0.06)`,
                    borderRadius: 12, padding: "12px 8px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ color: color as string, fontSize: 11, fontWeight: 600 }}>{label}</span>
                </motion.button>
              ))}
            </div>

            <div style={{ color: T.textSec, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 }}>PAYOUT METHODS</div>
            {[
              { icon: "💳", label: "Stripe Connect", detail: "Weekly USD payout", color: T.stripe, ready: true },
              { icon: "🅿️", label: "PayPal", detail: "Multiparty instant", color: "#009cde", ready: true },
              { icon: "💝", label: "Tribute", detail: "Direct fan payments", color: T.tribute, ready: true },
              { icon: "💎", label: "TON Wallet", detail: "Crypto withdrawal", color: "#0088CC", ready: false },
            ].map(m => (
              <div key={m.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: T.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                border: `1px solid rgba(255,255,255,0.05)`,
              }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: T.textSec, fontSize: 11 }}>{m.detail}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                  background: m.ready ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.05)",
                  color: m.ready ? T.success : T.textSec,
                }}>
                  {m.ready ? "ACTIVE" : "SETUP"}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* RANKING */}
        {view === "ranking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ padding: "12px 0 16px", fontSize: 11, color: T.textSec, fontWeight: 600, letterSpacing: "0.1em" }}>
              👑 TOP CREATORS THIS WEEK
            </div>
            {MOCK_CREATORS.map((c, i) => (
              <motion.div
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveCreator(c); setView("live"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: i === 0 ? `linear-gradient(135deg, rgba(253,203,110,0.12), rgba(108,92,231,0.08))` : T.card,
                  borderRadius: 14, padding: "14px", marginBottom: 10,
                  border: `1px solid ${i === 0 ? "rgba(253,203,110,0.35)" : "rgba(255,255,255,0.05)"}`,
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: i === 0 ? "linear-gradient(135deg, #FDCB6E, #E17055)" : i === 1 ? "linear-gradient(135deg, #B2BEC3, #636E72)" : "linear-gradient(135deg, #CD853F, #A0522D)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 18, color: "#fff", flexShrink: 0,
                }}>
                  {c.display_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{c.display_name}</div>
                  <div style={{ color: T.textSec, fontSize: 11, marginTop: 1 }}>@{c.handle}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.warning, fontWeight: 800, fontSize: 14 }}>{(c.total_earned_rtv / 1000).toFixed(0)}K</div>
                  <div style={{ color: T.textSec, fontSize: 10 }}>RTVS</div>
                  {c.is_live && (
                    <div style={{ color: "#FF4444", fontSize: 9, fontWeight: 700, marginTop: 2 }}>🔴 LIVE</div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(26,26,46,0.97)", backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(108,92,231,0.2)",
        display: "flex", padding: "8px 0 12px", zIndex: 60,
      }}>
        {navItems.map(item => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setView(item.id as any)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: view === item.id ? T.primary : T.textSec,
              letterSpacing: "0.05em",
            }}>
              {item.label.toUpperCase()}
            </span>
            {view === item.id && (
              <motion.div
                layoutId="navDot"
                style={{ width: 4, height: 4, borderRadius: "50%", background: T.primary }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && activeCreator && (
          <PaymentModal
            creator={activeCreator}
            onClose={() => setShowPayment(false)}
            onSuccess={(method, tier) => {
              setSubscribedCreators(s => [...s, activeCreator.id]);
              setShowPayment(false);
              setView("live");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
