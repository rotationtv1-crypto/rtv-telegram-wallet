import { useState, useEffect } from "react";
import { Crown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function RanksScreen() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboards`).then(r => r.json()).then(d => setEntries(d.entries || [])).catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Crown size={22} color="#CCFF00" />
        <span className="text-white font-black text-xl">Top Earners</span>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <div className="text-4xl">🏆</div>
          <div className="text-gray-400">No rankings yet</div>
        </div>
      ) : entries.map((e, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl p-3 mb-2" style={{ background: "#141414" }}>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-bold w-6 text-center">{i + 1}</span>
            <span className="text-white font-bold">{e.display_name || "User"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold">{e.value?.toLocaleString() || 0} RTV</span>
            {i < 3 && <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
