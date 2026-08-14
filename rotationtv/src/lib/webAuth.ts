/**
 * Standalone Web Auth — JWT via Web Crypto API
 * Exchange Telegram initData for JWT, verify Bearer tokens
 */
const JWT_SECRET = 'rtv-web-auth-secret-2026';
const TTL_SECONDS = 7 * 24 * 60 * 60;

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(str: string): Uint8Array {
  const b = str.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(atob(b + '='.repeat((4 - b.length % 4) % 4)).split('').map(c => c.charCodeAt(0)));
}

export async function createJWT(payload: any): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const data = { ...payload, iat: now, exp: now + TTL_SECONDS };
  const key = await hmacKey(JWT_SECRET);
  const h = b64encode(new TextEncoder().encode(JSON.stringify(header)).buffer as ArrayBuffer);
  const p = b64encode(new TextEncoder().encode(JSON.stringify(data)).buffer as ArrayBuffer);
  const sig = b64encode(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${sig}`;
}

export async function verifyJWT(token: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const key = await hmacKey(JWT_SECRET);
  const valid = await crypto.subtle.verify('HMAC', key, b64decode(s), new TextEncoder().encode(`${h}.${p}`));
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(b64decode(p)));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

export async function authenticateWebUser(initData: string): Promise<{ token: string; user: any } | null> {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    const token = await createJWT({ id: user.id, username: user.username, first_name: user.first_name });
    return { token, user };
  } catch { return null; }
}
