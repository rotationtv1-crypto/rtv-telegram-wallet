/**
 * RotationTV — Telegram Mini App initData validation
 * ==================================================
 * Official WebApp algorithm (core.telegram.org/bots/webapps):
 *
 *   secret_key = HMAC_SHA256(key = "WebAppData", message = bot_token)
 *   hash       = HMAC_SHA256(key = secret_key, message = data_check_string)
 *
 * data_check_string = sorted key=value pairs (excluding hash), joined by \n
 *
 * Do NOT use SHA256(bot_token) as the key — that is Login Widget, not WebApp.
 *
 * @module telegramAuth
 */

const DEFAULT_MAX_AGE_SECONDS = 86_400; // 24h; tighten for high-risk routes

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(
  key: ArrayBuffer | string,
  message: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyBytes =
    typeof key === 'string' ? encoder.encode(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export interface ValidateInitDataOptions {
  /** Max age of auth_date in seconds. Default 86400 (24h). */
  maxAgeSeconds?: number;
  /** If true, skip auth_date check (tests only). */
  skipAuthDateCheck?: boolean;
}

/**
 * Validate Telegram WebApp initData against bot token.
 * Returns true only when HMAC matches and auth_date is fresh.
 */
export async function validateTelegramData(
  initData: string,
  botToken: string,
  options: ValidateInitDataOptions = {}
): Promise<boolean> {
  if (!initData || !botToken) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;

  const maxAge = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  if (!options.skipAuthDateCheck) {
    const authDateRaw = urlParams.get('auth_date');
    if (!authDateRaw) return false;
    const authDate = Number(authDateRaw);
    if (!Number.isFinite(authDate) || authDate <= 0) return false;
    const age = Math.floor(Date.now() / 1000) - authDate;
    if (age < 0 || age > maxAge) return false;
  }

  const pairs: string[] = [];
  urlParams.forEach((value, key) => {
    if (key !== 'hash') pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // WebApp secret: HMAC-SHA256("WebAppData", bot_token)
  const secretKey = await hmacSha256('WebAppData', botToken);
  const computed = toHex(await hmacSha256(secretKey, dataCheckString));

  return timingSafeEqualHex(computed, hash);
}

/**
 * Extract Telegram user from initData after successful validation.
 */
export async function authenticateTelegramUser(
  initData: string,
  botToken: string,
  options: ValidateInitDataOptions = {}
): Promise<{ user: Record<string, unknown>; valid: boolean } | null> {
  const valid = await validateTelegramData(initData, botToken, options);
  if (!valid) return null;

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson) as Record<string, unknown>;
    return { user, valid: true };
  } catch {
    return null;
  }
}
