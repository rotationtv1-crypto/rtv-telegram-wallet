import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownLeft, Users, Zap } from "lucide-react";
import { useStore } from "../store/useStore";
import { useTelegram } from "../hooks/useTelegram";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function WalletScreen() {
  const { user } = useStore();
  const tg = useTelegram();
  const [amount, setAmount] = useState(10);

  if (!user) return null;

  const buyRtv = () => {
    const rtv = Math.ceil(amount / 0.01);
    tg?.showConfirm(`Buy ${rtv} RTV for $${amount}?`, (ok: boolean) => {
      if (ok) tg?.openLink(`${API_BASE}/api/payment/create?amount=${amount}&user_id=${user.id}`);
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#141414", border: "1px solid #222" }}>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={20} color="#CCFF00" />
          <span className="text-white font-bold text-lg">RTV Balance</span>
        </div>
        <div className="text-4xl font-black text-white">{user.rtv_balance?.toLocaleString() || 0}</div>
        <div className="text-gray-400 text-sm mt-1">= ${((user.rtv_balance || 0) * 0.01).toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#141414" }}>
          <ArrowDownLeft size={16} color="#CCFF00" />
          <div className="text-white font-bold mt-1">{user.total_earnings_rtv?.toLocaleString() || 0}</div>
          <div className="text-gray-400 text-xs">Earned</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#141414" }}>
          <Users size={16} color="#CCFF00" />
          <div className="text-white font-bold mt-1">{user.followers_count || 0}</div>
          <div className="text-gray-400 text-xs">Followers</div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#141414", border: "1px solid #222" }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} color="#CCFF00" />
          <span className="text-white font-bold">Buy RTV</span>
        </div>
        <div className="flex gap-2 mb-4">
          {[5, 10, 25, 50].map(v => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="flex-1 py-2 rounded-lg font-bold text-sm"
              style={{ background: amount === v ? "#CCFF00" : "rgba(255,255,255,0.05)", color: amount === v ? "#0A0A0A" : "white" }}
            >
              ${v}
            </button>
          ))}
        </div>
        <button
          onClick={buyRtv}
          className="w-full py-3 rounded-xl font-black text-black"
          style={{ background: "#CCFF00" }}
        >
          Buy {Math.ceil(amount / 0.01)} RTV
        </button>
      </div>
    </div>
  );
}
