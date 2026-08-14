/**
 * RotationTV Standalone Web App
 * Works outside Telegram — uses JWT auth instead of initData
 * Same UI, same features, same backend
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Compass, Gift, Trophy, Wallet, User, X } from "lucide-react";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { GiftsScreen } from "./screens/GiftsScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { GoLiveModal } from "./components/GoLiveModal";
import { useStore } from "./store/useStore";
import "./index.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

type Tab = "discover" | "gifts" | "wallet" | "profile";

export default function WebApp() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [showGoLive, setShowGoLive] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState("");
  const { user, initUser, setUser, activeStream, setActiveStream } = useStore();

  // Web auth: exchange initData for JWT
  const webLogin = async (initData: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem("rtv_jwt", data.token);
        if (data.user) {
          setUser(data.user);
          setAuthed(true);
        }
      }
    } catch (e) { console.error("Web auth failed:", e); }
  };

  // Check for stored JWT on load
  useEffect(() => {
    const jwt = localStorage.getItem("rtv_jwt");
    if (jwt) {
      // Verify JWT and load user
      fetch(`${API_BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then(r => r.json()).then(data => {
        if (data.ok && data.user) { setUser(data.user); setAuthed(true); }
        else { localStorage.removeItem("rtv_jwt"); }
      }).catch(() => {});
    }
  }, []);

  // If running inside Telegram, use standard init
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData) {
      webLogin(tg.initData);
      tg.expand();
      tg.ready();
    }
  }, []);

  if (!authed && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D", color: "#fff" }}>
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl"
            style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)" }}>R</div>
          <h1 className="text-2xl font-black mb-2">RotationTV Network</h1>
          <p className="text-gray-400 mb-6">Live streaming with AI hosts & Stars payments</p>
          <button onClick={() => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.initData) webLogin(tg.initData);
            else setLoginPrompt("Open this link inside Telegram to log in, or use the Telegram bot @base44_229784_bot");
          }} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)" }}>
            Sign in with Telegram
          </button>
          {loginPrompt && <p className="mt-4 text-sm text-gray-500">{loginPrompt}</p>}
          <div className="mt-8 text-xs text-gray-600">Entity: Darrel-spell-living-trust</div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "discover", label: "Discover", icon: Compass },
    { id: "gifts", label: "Gifts", icon: Gift },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0D0D", color: "white", fontFamily: "Inter, sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)", color: "#fff" }}>R</div>
          <span className="font-black text-white text-lg">RotationTV</span>
        </div>
        {user && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(108,92,231,0.1)", border: "1px solid rgba(108,92,231,0.2)" }}>
            <Zap size={12} color="#6C5CE7" />
            <span className="text-xs font-bold" style={{ color: "#A29BFE" }}>⭐ {user.stars_balance || 0}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "discover" && <DiscoverScreen />}
        {activeTab === "gifts" && <GiftsScreen />}
        {activeTab === "wallet" && <WalletScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </div>

      <button onClick={() => setShowGoLive(true)} className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)" }}>
        <Zap size={24} color="#FFFFFF" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 flex" style={{ background: "#0D0D0D", borderTop: "1px solid #1a1a1a", maxWidth: 480, margin: "0 auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-1 px-3 py-1 flex-1" style={{ color: active ? "#6C5CE7" : "#666" }}>
              <Icon size={18} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {showGoLive && (
          <GoLiveModal onClose={() => setShowGoLive(false)} onGoLive={(data: any) => { setShowGoLive(false); setActiveStream(data); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
