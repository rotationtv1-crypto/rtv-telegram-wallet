import { useStore } from "../store/useStore";
import { useTelegram } from "../hooks/useTelegram";
import { Verified, Shield } from "lucide-react";

export function ProfileScreen() {
  const { user } = useStore();
  const tg = useTelegram();

  if (!user) return null;

  const becomeCreator = () => {
    tg?.showConfirm("Become a Creator?", async (ok: boolean) => {
      if (!ok) return;
      const r = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/become-creator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const d = await r.json();
      if (d.user) {
        tg?.HapticFeedback?.notificationOccurred("success");
        tg?.showAlert("You are now a Creator!");
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="rounded-2xl p-5 text-center" style={{ background: "#141414" }}>
        {user.avatar_url && <img src={user.avatar_url} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />}
        <div className="flex items-center justify-center gap-2">
          <span className="text-white font-black text-xl">{user.display_name}</span>
          {user.is_verified && <Verified size={18} color="#CCFF00" />}
        </div>
        <div className="text-gray-400 text-sm">@{user.username}</div>

        {/* Safety Score */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Shield size={14} color={user.safety_score >= 80 ? "#CCFF00" : "#FF6B00"} />
          <span className="text-gray-400 text-sm">Safety: {user.safety_score}/100</span>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl p-4" style={{ background: "#141414" }}>
        <div className="text-gray-400 text-xs mb-3">Role</div>
        <div className="text-white font-bold">{user.is_creator ? "Creator" : "Viewer"}</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Followers", v: user.followers_count || 0 },
          { l: "Earned", v: (user.total_earnings_rtv || 0).toLocaleString() },
          { l: "Tier", v: user.reputation_tier || "new" },
        ].map(s => (
          <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: "#141414" }}>
            <div className="text-white font-black text-lg">{s.v}</div>
            <div className="text-gray-400 text-xs">{s.l}</div>
          </div>
        ))}
      </div>

      {!user.is_creator && (
        <button onClick={becomeCreator} className="w-full py-3 rounded-xl font-black text-black" style={{ background: "#CCFF00" }}>
          Become a Creator
        </button>
      )}
    </div>
  );
}
