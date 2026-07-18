import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Compass, Gift, Trophy, Wallet, User, X } from "lucide-react";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { GiftsScreen } from "./screens/GiftsScreen";
import { PKScreen } from "./screens/PKScreen";
import { RanksScreen } from "./screens/RanksScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { GoLiveModal } from "./components/GoLiveModal";
import { AgentChat } from "./components/AgentChat";
import { StreamViewer } from "./components/StreamPlayer";
import { FlyingGift } from "./components/FlyingGift";
import { GiftSendBar } from "./components/GiftSendBar";
import { useStreamRoom } from "./hooks/useStreamRoom";
import { useStore } from "./store/useStore";

type Tab = "discover" | "gifts" | "pk" | "ranks" | "wallet" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [showGoLive, setShowGoLive] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const { user, initUser, activeStream, setActiveStream } = useStore();
  const { tips, dismissTip } = useStreamRoom(activeStream?.stream_id || null);

  useEffect(() => {
    initUser();
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "discover", label: "Discover", icon: Compass },
    { id: "gifts",    label: "Gifts",    icon: Gift    },
    { id: "pk",       label: "PK",       icon: Trophy  },
    { id: "ranks",    label: "Ranks",    icon: Trophy  },
    { id: "wallet",   label: "Wallet",   icon: Wallet  },
    { id: "profile",  label: "Profile",  icon: User    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0A", color: "white", fontFamily: "Inter, sans-serif", maxWidth: 480, margin: "0 auto" }}>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0A0A0A", borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm" style={{ background: "#CCFF00" }}>R</div>
          <span className="font-black text-white text-lg">RotationTV Live</span>
        </div>
        {user && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(204,255,0,0.1)", border: "1px solid rgba(204,255,0,0.2)" }}>
            <Zap size={12} color="#CCFF00" />
            <span className="text-xs font-bold" style={{ color: "#CCFF00" }}>{user.rtv_balance || 0} RTV</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "discover" && <DiscoverScreen />}
        {activeTab === "gifts"    && <GiftsScreen />}
        {activeTab === "pk"       && <PKScreen />}
        {activeTab === "ranks"    && <RanksScreen />}
        {activeTab === "wallet"   && <WalletScreen />}
        {activeTab === "profile"  && <ProfileScreen />}
      </div>

      {/* Go Live FAB */}
      <button
        onClick={() => setShowGoLive(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ background: "#CCFF00" }}
      >
        <Zap size={24} color="#0A0A0A" />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex" style={{ background: "#0A0A0A", borderTop: "1px solid #1a1a1a", maxWidth: 480, margin: "0 auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1 flex-1"
              style={{ color: active ? "#CCFF00" : "#666" }}
            >
              <Icon size={18} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Go Live Modal */}
      <AnimatePresence>
        {showGoLive && (
          <GoLiveModal
            onClose={() => setShowGoLive(false)}
            onGoLive={(data: any) => {
              setShowGoLive(false);
              setActiveStream(data);
            }}
          />
        )}
      </AnimatePresence>

      {/* Full-screen Stream + AI Chat */}
      <AnimatePresence>
        {activeStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "#0A0A0A" }}
          >
            <button
              onClick={() => setActiveStream(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={20} color="white" />
            </button>

            <div className="relative flex-1">
              <StreamViewer streamId={activeStream.stream_id} onClose={() => setActiveStream(null)} />
              <FlyingGift tips={tips} onDone={dismissTip} />
            </div>

            <GiftSendBar
              disabled={!user || sendingGift}
              onSend={async (gift) => {
                if (!user || !activeStream) return;
                setSendingGift(true);
                try {
                  const resp = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/stream/tip`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sender_id: user.id,
                      receiver_id: activeStream.creator_id,
                      stream_id: activeStream.stream_id,
                      amount_rtv: gift.price_rtv,
                      gift_id: gift.id,
                      gift_emoji: gift.emoji,
                    }),
                  });
                  if (resp.ok) {
                    useStore.getState().deductRtv(gift.price_rtv);
                    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
                  } else {
                    window.Telegram?.WebApp?.showAlert?.("Gift failed to send — try again.");
                  }
                } catch {
                  window.Telegram?.WebApp?.showAlert?.("Gift failed to send — try again.");
                } finally {
                  setSendingGift(false);
                }
              }}
            />

            {user && (
              <AgentChat
                streamId={activeStream.stream_id}
                currentUserId={user.id}
                currentUsername={user.username}
                isCreator={user.is_creator}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
