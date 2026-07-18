import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Gift { id: string; name: string; emoji: string; price_rtv: number; }

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function GiftsScreen() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/gifts`).then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <div className="text-white font-black text-xl mb-4">🎁 Gift Shop</div>
      <div className="grid grid-cols-3 gap-3">
        {gifts.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(g.id)}
            className="rounded-xl p-3 flex flex-col items-center cursor-pointer"
            style={{ background: selected === g.id ? "rgba(204,255,0,0.15)" : "#141414", border: selected === g.id ? "1px solid #CCFF00" : "1px solid transparent" }}
          >
            <div className="text-3xl mb-1">{g.emoji}</div>
            <div className="text-white text-xs font-bold text-center">{g.name}</div>
            <div className="text-yellow-400 text-xs mt-1">{g.price_rtv} RTV</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
