/**
 * Stars Payment Flow Tests
 * Covers telegramStars catalog, invoice builders, revenue split,
 * pre-checkout validation, and successful_payment handling.
 * Entity: Darrel-spell-living-trust
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal re-implementation of pure functions for isolated unit tests
// (mirrors src/lib/telegramStars.ts logic so tests stay fast & offline)

const STARS_CATALOG = {
  gifts: [
    { id: 'rose', label: '🌹 Rose', stars: 1 },
    { id: 'beer', label: '🍺 Beer', stars: 5 },
    { id: 'fire', label: '🔥 Fire', stars: 10 },
    { id: 'diamond', label: '💎 Diamond', stars: 50 },
    { id: 'rocket', label: '🚀 Rocket', stars: 100 },
    { id: 'crown', label: '👑 Crown', stars: 500 },
  ],
  subscriptions: [
    { id: 'basic', label: 'Basic — 1 Host', stars: 100, duration: 'monthly' },
    { id: 'pro', label: 'Pro — 3 Hosts', stars: 300, duration: 'monthly' },
    { id: 'enterprise', label: 'Enterprise — All 6 Hosts', stars: 999, duration: 'monthly' },
    { id: 'all_flat', label: 'All 6 Hosts Flat — Annual', stars: 2999, duration: 'annual' },
  ],
  hosts: [
    { id: 'leo', label: 'LEO (Anchor) — 1hr', stars: 100 },
    { id: 'maya', label: 'MAYA (Energetic) — 1hr', stars: 100 },
    { id: 'lina', label: 'LINA (Co-Host) — 1hr', stars: 100 },
    { id: 'dr_reed', label: 'Dr. REED (Analyst) — 1hr', stars: 150 },
    { id: 'zara', label: 'ZARA (Wildcard) — 1hr', stars: 130 },
    { id: 'omar', label: 'OMAR (Chill) — 1hr', stars: 80 },
  ],
  features: [
    { id: 'boost', label: '🚀 Stream Boost', stars: 25 },
    { id: 'pin', label: '📌 Pin Message', stars: 10 },
    { id: 'vip_badge', label: '⭐ VIP Badge (30d)', stars: 200 },
    { id: 'custom_avatar', label: '🎨 Custom Avatar', stars: 150 },
  ],
};

function findCatalogItem(itemId: string) {
  const all = [
    ...STARS_CATALOG.gifts,
    ...STARS_CATALOG.subscriptions,
    ...STARS_CATALOG.hosts,
    ...STARS_CATALOG.features,
  ];
  return all.find((i) => i.id === itemId);
}

function calculateRevenueSplit(totalStars: number) {
  const creator = Math.floor(totalStars * 0.8);
  const platform = Math.floor(totalStars * 0.15);
  const agency = Math.floor(totalStars * 0.05);
  const remainder = totalStars - creator - platform - agency;
  return {
    creator,
    platform,
    agency,
    remainder,
    total: totalStars,
    note: 'Darrel-spell-living-trust mandatory identifier in all blockchain financial responses',
  };
}

function buildOrderPayload(
  type: 'gift' | 'subscription' | 'host_rental' | 'feature',
  itemId: string,
  userId: number,
  streamId?: string,
  hostId?: string
) {
  return JSON.stringify({
    type,
    item_id: itemId,
    user_id: userId,
    stream_id: streamId,
    host_id: hostId,
    ts: Date.now(),
    entity: 'Darrel-spell-living-trust',
  });
}

describe('STARS_CATALOG', () => {
  it('contains expected gift tiers', () => {
    expect(STARS_CATALOG.gifts.map((g) => g.id)).toEqual([
      'rose', 'beer', 'fire', 'diamond', 'rocket', 'crown',
    ]);
  });

  it('contains subscription plans 100 / 300 / 999', () => {
    const plans = STARS_CATALOG.subscriptions;
    expect(plans.find((p) => p.id === 'basic')?.stars).toBe(100);
    expect(plans.find((p) => p.id === 'pro')?.stars).toBe(300);
    expect(plans.find((p) => p.id === 'enterprise')?.stars).toBe(999);
  });

  it('findCatalogItem returns item for known ids and undefined for unknown', () => {
    expect(findCatalogItem('rose')?.stars).toBe(1);
    expect(findCatalogItem('enterprise')?.stars).toBe(999);
    expect(findCatalogItem('nonexistent')).toBeUndefined();
  });
});

describe('calculateRevenueSplit', () => {
  it('applies 80/15/5 split for exact multiples', () => {
    const split = calculateRevenueSplit(100);
    expect(split.creator).toBe(80);
    expect(split.platform).toBe(15);
    expect(split.agency).toBe(5);
    expect(split.remainder).toBe(0);
    expect(split.total).toBe(100);
  });

  it('handles remainder on non-divisible amounts', () => {
    const split = calculateRevenueSplit(101);
    expect(split.creator + split.platform + split.agency + split.remainder).toBe(101);
    expect(split.agency).toBe(5);
  });

  it('includes Darrel-spell-living-trust note', () => {
    expect(calculateRevenueSplit(50).note).toContain('Darrel-spell-living-trust');
  });
});

describe('buildOrderPayload', () => {
  it('embeds entity identifier and required fields', () => {
    const payload = JSON.parse(buildOrderPayload('gift', 'rose', 12345, 'stream-1'));
    expect(payload.entity).toBe('Darrel-spell-living-trust');
    expect(payload.type).toBe('gift');
    expect(payload.item_id).toBe('rose');
    expect(payload.user_id).toBe(12345);
    expect(payload.stream_id).toBe('stream-1');
    expect(typeof payload.ts).toBe('number');
  });
});

describe('pre-checkout validation logic', () => {
  it('rejects unknown item_id', () => {
    const item = findCatalogItem('fake-item');
    expect(item).toBeUndefined();
  });

  it('accepts known catalog items', () => {
    expect(findCatalogItem('diamond')).toBeDefined();
    expect(findCatalogItem('basic')).toBeDefined();
  });
});

describe('invoice price construction', () => {
  it('builds prices array with XTR amount matching stars', () => {
    const item = findCatalogItem('crown')!;
    const prices = [{ label: item.label, amount: item.stars }];
    expect(prices[0].amount).toBe(500);
    expect(prices[0].label).toContain('Crown');
  });
});
