import { create } from "zustand";

interface RTVUser {
  id: string;
  telegram_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  rtv_balance: number;
  is_creator: boolean;
  is_verified: boolean;
  role: string;
  followers_count: number;
  total_earnings_rtv: number;
  safety_score: number;
  reputation_tier: string;
}

export interface ActiveStream {
  id?: string;
  stream_id: string;
  title: string;
  creator_id?: string;
  creator_name?: string;
  viewer_count?: number;
  total_tips_rtv?: number;
  cloudflare_stream_id?: string;
  playback_url?: string;
}

interface Store {
  user: RTVUser | null;
  loading: boolean;
  activeStream: ActiveStream | null;
  initUser: () => Promise<void>;
  setUser: (u: RTVUser) => void;
  setActiveStream: (s: ActiveStream | null) => void;
  deductRtv: (amount: number) => void;
  addRtv: (amount: number) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export const useStore = create<Store>((set, get) => ({
  user: null,
  loading: true,
  activeStream: null,
  initUser: async () => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (!tg?.initDataUnsafe?.user) { set({ loading: false }); return; }
    const tgUser = tg.initDataUnsafe.user;
    try {
      const resp = await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          photo_url: tgUser.photo_url,
          language_code: tgUser.language_code,
        }),
      });
      const data = await resp.json();
      if (data.user) {
        set({ user: data.user, loading: false });
        if (data.welcome_bonus) tg.HapticFeedback?.notificationOccurred("success");
      }
    } catch (err) {
      console.error("Auth failed:", err);
    }
    set({ loading: false });
  },
  setUser: (u) => set({ user: u }),
  setActiveStream: (s) => set({ activeStream: s }),
  deductRtv: (amount) => { const u = get().user; if (u) set({ user: { ...u, rtv_balance: Math.max(0, u.rtv_balance - amount) } }); },
  addRtv: (amount) => { const u = get().user; if (u) set({ user: { ...u, rtv_balance: Math.max(0, u.rtv_balance + amount) } }); },
}));
