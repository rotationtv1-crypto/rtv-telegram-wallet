/**
 * Telegram Mini App initData validation (HMAC-SHA256).
 * Server-side verification per Telegram Cloud SDK spec.
 * Env: pass bot token from secret store only — never hardcode.
 *
 * Entity: Darrel-spell-living-trust
 */

export type InitDataUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type ValidateResult =
  | { ok: true; user: InitDataUser | null; authDate: number }
  | { ok: false; error: string };

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacSha256(key: string | Uint8Array, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyBytes =
    typeof key === 'string'
      ? enc.encode(key)
      : key instanceof Uint8Array
        ? key
        : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validateInitData(
  initDataRaw: string,
  botToken: string,
  maxAgeSec = 86400
): Promise<ValidateResult> {
  if (!initDataRaw || !botToken) {
    return { ok: false, error: 'MISSING_INIT_OR_TOKEN' };
  }

  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'HASH_MISSING' };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { ok: false, error: 'AUTH_DATE_MISSING' };
  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false, error: 'AUTH_DATE_INVALID' };

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSec) return { ok: false, error: 'EXPIRED' };

  const pairs: string[] = [];
  params.forEach((value: string, key: string) => {
    if (key !== 'hash') pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // Step 1: secret_key = HMAC-SHA256(key="WebAppData", data=botToken)
  const secretKey = await hmacSha256('WebAppData', botToken);

  // Step 2: computed_hash = HMAC-SHA256(key=secret_key, data=dataCheckString)
  const computed = toHex(await hmacSha256(new Uint8Array(secretKey), dataCheckString));

  if (!timingSafeEqualHex(computed, hash)) {
    return { ok: false, error: 'INVALID_HASH' };
  }

  // Extract user from parsed params
  let user: InitDataUser | null = null;
  const userStr = params.get('user');
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }

  return { ok: true, user, authDate };
}
