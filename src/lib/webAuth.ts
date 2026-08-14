/**
 * RotationTV — Standalone Web Auth
 * =================================
 * JWT-based authentication for the standalone Web App version.
 * Users can log in via Telegram (OAuth) or a Telegram login widget
 * and receive a JWT for subsequent API calls.
 *
 * @module webAuth
 */

import { validateTelegramData } from './telegramAuth';

interface JWTPayload {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  authDate: number;
  botId: string;
  exp: number;
}

/**
 * Create a JWT using Web Crypto API (no external deps).
 */
async function createJWT(payload: Omit<JWTPayload, 'exp'>, secret: string, ttlSeconds: number = 86400 * 7): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const fullPayload = { ...payload, exp };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${sigB64}`;
}

/**
 * Verify a JWT signature and check expiration.
 */
async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const data = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Authenticate a Telegram login for the Web version.
 * Accepts Telegram initData and returns a JWT.
 */
export async function authenticateWebUser(
  initData: string,
  botToken: string,
  jwtSecret: string,
  botId: string = 'main'
): Promise<{ jwt: string; user: any } | { error: string }> {
  const valid = await validateTelegramData(initData, botToken);
  if (!valid) return { error: 'Invalid Telegram initData' };

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) return { error: 'No user data in initData' };

  try {
    const user = JSON.parse(userJson);
    const authDate = parseInt(params.get('auth_date') || '0', 10);

    const jwt = await createJWT({
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      authDate,
      botId,
    }, jwtSecret);

    return { jwt, user };
  } catch {
    return { error: 'Failed to parse user data' };
  }
}

/**
 * Verify a JWT from the Authorization header.
 * Returns the payload if valid, null if not.
 */
export async function verifyWebAuth(authHeader: string | null, jwtSecret: string): Promise<JWTPayload | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyJWT(token, jwtSecret);
}

export default { authenticateWebUser, verifyWebAuth };
