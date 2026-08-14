/**
 * Web auth service — JWT verification for standalone Web App.
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

export async function verifyWebAuth(jwt: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const res = await fetch(`${API_BASE}/api/web/verify`, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    return await res.json();
  } catch {
    return { valid: false };
  }
}

export async function authenticateWebUser(initData: string): Promise<{ jwt?: string; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/web/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
    return await res.json();
  } catch {
    return { error: 'Authentication failed' };
  }
}
