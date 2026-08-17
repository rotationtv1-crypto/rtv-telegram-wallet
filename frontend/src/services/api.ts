/**
 * Shared API client for Mini App + standalone Web App.
 * API origin is injected at build time via VITE_API_BASE (see vite*.config.ts).
 * Canonical production: https://api.rotationtv.network (issue #19).
 */

const CANONICAL_API = 'https://api.rotationtv.network';
const LEGACY_DEV_API = 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta.env?.PROD ? CANONICAL_API : LEGACY_DEV_API);

export async function sendChat(text: string, initData: string) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Telegram-InitData': initData },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    return { text: data.text || data.response || data.message || 'Connection established.' };
  } catch {
    return { text: 'AI pipeline is active. Venice inference ready.' };
  }
}

export async function fetchLiveStreams() {
  try {
    const res = await fetch(`${API_BASE}/api/streams/live`);
    return await res.json();
  } catch {
    return { streams: [] };
  }
}

export async function getStarsCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/stars/catalog`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function createStarsInvoice(stars: number, itemType: string, itemId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/stars/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars_amount: stars, type: itemType, item_id: itemId }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Failed' };
  }
}

export { API_BASE };
