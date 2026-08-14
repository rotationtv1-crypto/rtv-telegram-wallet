import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownLeft, Users, Zap, Star } from "lucide-react";
import { useStore } from "../store/useStore";
import { useTelegram } from "../hooks/useTelegram";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function WalletScreen() {
  const { user } = useStore();
  const tg = useTelegram();
  const [showSub, setShowSub] = useState(false);

  if (!user) return null;

  const plans = [
    { id: 'basic', label: 'Basic', hosts: '1 Host', stars: 100, color: '#6C5CE7' },
    { id: 'pro', label: 'Pro', hosts: '3 Hosts', stars: 300, color: '#A29BFE' },
    { id: 'enterprise', label: 'Enterprise', hosts: 'All 6 Hosts', stars: 999, color: '#00CEC9' },
  ];

  const subscribe = async (plan: typeof plans[0]) => {
    try {
      const res = await fetch(`${API_BASE}/api/stars/invoice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', item_id: plan.id, stars_amount: plan.stars, title: `${plan.label} Plan` }),
      });
      const data = await res.json();
      if (data.ok && data.invoice_url && tg?.openInvoice) {
        tg.openInvoice(data.invoice_url, (result: string) => {
          if (result === 'paid') tg.HapticFeedback?.notificationOccurred('success');
        });
      }
    } catch {}
    setShowSub(false);
  };

  const paymentMethods = [
    { icon: '⭐', name: 'Telegram Stars', status: 'Active', color: '#00B894' },
    { icon: '💎', name: 'USDT (TON Connect)', status: 'Active', color: '#00B894' },
    { icon: '🪙', name: 'RTV Token', status: 'Purged', color: '#FF6B6B', strike: true },
    { icon: '💳', name: 'Stripe', status: 'Purged', color: '#FF6B6B', strike: true },
    { icon: '💰', name: 'PayPal', status: 'Purged', color: '#FF6B6B', strike: true },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Stars Balance */}
      <div className="rounded-2xl p-5" style={{ background: "#16213E", border: "1px solid rgba(108,92,231,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Star size={20} color="#A29BFE" />
          <span className="text-white font-bold text-lg">Stars Balance</span>
        </div>
        <div className="text-4xl font-black" style={{ color: "#A29BFE" }}>⭐ {user.stars_balance?.toLocaleString() || 0}</div>
        <div className="text-gray-400 text-sm mt-1">Telegram Stars · 1 ⭐ ≈ $0.013</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#16213E" }}>
          <ArrowDownLeft size={16} color="#A29BFE" />
          <div className="text-white font-bold mt-1">{user.total_earnings_rtv?.toLocaleString() || 0}</div>
          <div className="text-gray-400 text-xs">Total Earned</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#16213E" }}>
          <Users size={16} color="#A29BFE" />
          <div className="text-white font-bold mt-1">{user.followers_count || 0}</div>
          <div className="text-gray-400 text-xs">Followers</div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-2xl p-5" style={{ background: "#16213E", border: "1px solid rgba(108,92,231,0.15)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} color="#A29BFE" />
          <span className="text-white font-bold">Payment Methods</span>
        </div>
        {paymentMethods.map((m, i) => (
          <div key={m.name} className="flex justify-between items-center py-2" style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : {}}>
            <span className="text-sm" style={{ textDecoration: m.strike ? 'line-through' : 'none', color: m.strike ? '#FF6B6B' : '#fff' }}>{m.icon} {m.name}</span>
            <span className="text-xs font-bold" style={{ color: m.color }}>{m.status}</span>
          </div>
        ))}
      </div>

      {/* Upgrade */}
      <button onClick={() => setShowSub(true)} className="w-full py-3 rounded-xl font-bold text-white"
        style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)" }}>
        ⭐ Upgrade Subscription
      </button>

      <div className="text-center text-xs text-gray-500">Entity: Darrel-spell-living-trust</div>

      {/* Subscription Modal */}
      {showSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowSub(false)}>
          <div className="rounded-2xl p-5 w-[90%] max-w-sm max-h-[80vh] overflow-y-auto" style={{ background: '#1A1A2E' }} onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-white mb-3">Choose Your Plan</div>
            {plans.map(p => (
              <div key={p.id} className="rounded-xl p-4 mb-2" style={{ background: '#16213E', border: `1px solid ${p.color}40` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold" style={{ color: p.color }}>{p.label}</div>
                    <div className="text-xs text-gray-400">{p.hosts}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: '#A29BFE' }}>{p.stars} ⭐</div>
                    <button onClick={() => subscribe(p)} className="mt-1 px-3 py-1 rounded-lg text-white text-xs font-bold" style={{ background: p.color }}>Subscribe</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowSub(false)} className="w-full mt-3 py-2 rounded-xl text-gray-400 text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
