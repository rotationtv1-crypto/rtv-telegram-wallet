import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function PKScreen() {
  const [battles, setBattles] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/pk/active`).then(r => r.json()).then(d => setBattles(d.battles || [])).catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Swords size={22} color="#CCFF00" />
        <span className="text-white font-black text-xl">PK Battles</span>
      </div>

      {battles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <div className="text-4xl">⚔️</div>
          <div className="text-gray-400">No active battles</div>
        </div>
      ) : battles.map(b => (
        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 mb-3" style={{ background: "#141414", border: "1px solid #222" }}>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-white font-bold">Challenger</div>
              <div className="text-2xl font-black" style={{ color: "#CCFF00" }}>{b.challenger_tips_rtv || 0}</div>
            </div>
            <div className="text-center">
              <Swords size={24} color="#FF6B6B" />
              <div className="text-yellow-400 text-sm font-bold mt-1">{b.stake_amount_rtv} RTV</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">Opponent</div>
              <div className="text-2xl font-black" style={{ color: "#FF6B6B" }}>{b.opponent_tips_rtv || 0}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
