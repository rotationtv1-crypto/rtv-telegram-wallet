import { create } from 'zustand';

interface Message { role: 'user' | 'agent'; text: string; timestamp: number; }

interface StoreState {
  user: any;
  initData: string;
  startParam: string;
  tab: 'discover' | 'stream' | 'wallet' | 'profile';
  selectedHost: string | null;
  messages: Message[];
  streams: any[];
  starsBalance: number;
  subscription: 'free' | 'basic' | 'pro' | 'enterprise';
  giftsSent: number;
  streamsWatched: number;
  totalSpent: number;
  aiChats: number;
  showGiftBar: boolean;
  showSubscribe: boolean;
  toast: string | null;
  setTelegramData: (user: any, initData: string, startParam: string) => void;
  setTab: (tab: StoreState['tab']) => void;
  setSelectedHost: (id: string | null) => void;
  addMessage: (msg: Message) => void;
  setStreams: (streams: any[]) => void;
  updateStars: (amount: number) => void;
  setSubscription: (sub: StoreState['subscription']) => void;
  showToast: (msg: string) => void;
  toggleGiftBar: (show?: boolean) => void;
  toggleSubscribe: (show?: boolean) => void;
  incrementGiftsSent: () => void;
  incrementStreamsWatched: () => void;
  incrementAiChats: () => void;
  addSpent: (amount: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null, initData: '', startParam: '', tab: 'discover', selectedHost: null,
  messages: [], streams: [], starsBalance: 0, subscription: 'free',
  giftsSent: 0, streamsWatched: 0, totalSpent: 0, aiChats: 0,
  showGiftBar: false, showSubscribe: false, toast: null,
  setTelegramData: (user, initData, startParam) => set({ user, initData, startParam }),
  setTab: (tab) => set({ tab }),
  setSelectedHost: (id) => set({ selectedHost: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStreams: (streams) => set({ streams }),
  updateStars: (amount) => set((s) => ({ starsBalance: s.starsBalance + amount })),
  setSubscription: (subscription) => set({ subscription }),
  showToast: (msg) => { set({ toast: msg }); setTimeout(() => set({ toast: null }), 2500); },
  toggleGiftBar: (show) => set((s) => ({ showGiftBar: show ?? !s.showGiftBar })),
  toggleSubscribe: (show) => set((s) => ({ showSubscribe: show ?? !s.showSubscribe })),
  incrementGiftsSent: () => set((s) => ({ giftsSent: s.giftsSent + 1 })),
  incrementStreamsWatched: () => set((s) => ({ streamsWatched: s.streamsWatched + 1 })),
  incrementAiChats: () => set((s) => ({ aiChats: s.aiChats + 1 })),
  addSpent: (amount) => set((s) => ({ totalSpent: s.totalSpent + amount })),
}));
