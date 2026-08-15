/**
 * Frontend store Stars mutations
 * Mirrors frontend/src/store/useStore.ts behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';

interface StoreState {
  starsBalance: number;
  subscription: 'free' | 'basic' | 'pro' | 'enterprise';
  totalSpent: number;
  updateStars: (amount: number) => void;
  setSubscription: (sub: StoreState['subscription']) => void;
  addSpent: (amount: number) => void;
}

function createTestStore() {
  return create<StoreState>((set) => ({
    starsBalance: 0,
    subscription: 'free',
    totalSpent: 0,
    updateStars: (amount) => set((s) => ({ starsBalance: s.starsBalance + amount })),
    setSubscription: (subscription) => set({ subscription }),
    addSpent: (amount) => set((s) => ({ totalSpent: s.totalSpent + amount })),
  }));
}

describe('Stars store mutations', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it('starts at zero balance and free subscription', () => {
    const s = useStore.getState();
    expect(s.starsBalance).toBe(0);
    expect(s.subscription).toBe('free');
    expect(s.totalSpent).toBe(0);
  });

  it('updateStars adds to balance', () => {
    useStore.getState().updateStars(100);
    expect(useStore.getState().starsBalance).toBe(100);
    useStore.getState().updateStars(-30);
    expect(useStore.getState().starsBalance).toBe(70);
  });

  it('setSubscription updates tier', () => {
    useStore.getState().setSubscription('pro');
    expect(useStore.getState().subscription).toBe('pro');
    useStore.getState().setSubscription('enterprise');
    expect(useStore.getState().subscription).toBe('enterprise');
  });

  it('addSpent tracks total', () => {
    useStore.getState().addSpent(50);
    useStore.getState().addSpent(25);
    expect(useStore.getState().totalSpent).toBe(75);
  });
});
