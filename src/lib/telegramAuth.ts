/**
 * RotationTV — Telegram initData Validation
 * ==========================================
 * Validates the Telegram Web App initData hash using HMAC-SHA256.
 * This ensures the Mini App request is genuinely from Telegram, not spoofed.
 *
 * @module telegramAuth
 */

/**
 * Validate Telegram initData string against the bot token.
 * Telegram signs the data with HMAC-SHA256 using the SHA256 of the bot token as the key.
 *
 * @param initData - The full query string from tgWebAppData
 * @param botToken - The Telegram bot token
 * @returns true if the hash is valid
 */
export async function validateTelegramData(
  initData: string,
  botToken: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');

  if (!hash) return false;

  // Sort keys alphabetically, excluding the hash itself
  const keys = Array.from(urlParams.keys())
    .filter((key) => key !== 'hash')
    .sort();

  const dataCheckString = keys
    .map((key) => `${key}=${urlParams.get(key)}`)
    .join('\n');

  // Key = SHA256 of bot token
  const secretKeyBuffer = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(botToken)
  );

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(dataCheckString)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex === hash;
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
