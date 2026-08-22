/**
 * RotationTV — Telegram initData Validation (COMPLIANT)
 * ==========================================
 * Validates Telegram Web App initData using HMAC-SHA256 per Telegram Cloud SDK spec.
 *
 * Correct pattern for Mini Apps:
 *   1. secret_key = HMAC-SHA256(key="WebAppData", data=bot_token)
 *   2. computed_hash = HMAC-SHA256(key=secret_key, data=data_check_string)
 *
 * NOT the Login Widget pattern (SHA256(bot_token) as key) — that is for Bot API login only.
 *
 * @module telegramAuth
 */

/** Max age for initData freshness (replay protection) — 24h default */
const MAX_AUTH_AGE_SEC = 86400;

/** Timing-safe hex comparison to prevent side-channel attacks */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/** HMAC-SHA256 helper */
async function hmacSha256(key: string | Uint8Array, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyBytes = typeof key === 'string' ? enc.encode(key) : key instanceof Uint8Array ? key : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate Telegram Web App initData string against the bot token.
 * Uses the correct WebAppData HMAC pattern per Telegram Cloud SDK spec.
 *
 * @param initData - The full query string from tgWebAppData
 * @param botToken - The Telegram bot token (from Worker secrets only)
 * @returns true if the hash is valid AND auth_date is fresh
 */
export async function validateTelegramData(
  initData: string,
  botToken: string
): Promise<boolean> {
  if (!initData || !botToken) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;

  // ── Freshness check (replay protection) ──
  const authDateStr = urlParams.get('auth_date');
  if (!authDateStr) return false;
  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > MAX_AUTH_AGE_SEC) return false;

  // ── Build data-check string ──
  urlParams.delete('hash');
  const pairs: string[] = [];
  urlParams.forEach((value: string, key: string) => pairs.push(`${key}=${value}`));
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // ── Step 1: secret_key = HMAC-SHA256(key="WebAppData", data=botToken) ──
  const encoder = new TextEncoder();
  const secretKey = await hmacSha256('WebAppData', botToken);

  // ── Step 2: hash = HMAC-SHA256(key=secret_key, data=dataCheckString) ──
  const computedHash = toHex(await hmacSha256(new Uint8Array(secretKey), dataCheckString));

  // ── Timing-safe comparison ──
  return timingSafeEqualHex(computedHash, hash);
}

/**
 * Extract the Telegram user from validated initData.
 * Returns user info if valid, null if not.
 */
export async function authenticateTelegramUser(
  initData: string,
  botToken: string
): Promise<{ user: any; valid: boolean } | null> {
  const valid = await validateTelegramData(initData, botToken);
  if (!valid) return null;

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    return { user, valid: true };
  } catch {
    return null;
  }
}
