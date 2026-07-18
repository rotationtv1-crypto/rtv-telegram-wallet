/**
 * API client for Kimi-Claw agent backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

export async function sendChat(
  prompt: string,
  encodedState: string | undefined,
  initData: string
) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: initData,
    },
    body: JSON.stringify({ prompt, encodedState }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function authenticateUser(initData: string) {
  const response = await fetch(`${API_BASE}/api/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  return response.json();
}

export async function encodeStateForDeepLink(state: any) {
  const response = await fetch(`${API_BASE}/api/encode-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  return response.json();
}
