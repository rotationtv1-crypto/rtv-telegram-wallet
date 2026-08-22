/**
 * Telegram WebApp initData HMAC validation tests
 * Verifies WebAppData keying (not Login-Widget SHA256 key).
 */

import { describe, it, expect } from 'vitest';
import { validateTelegramData, authenticateTelegramUser } from '../../src/lib/telegramAuth';

/**
 * Build a valid initData string for a throwaway token using Web Crypto
 * (same algorithm as production).
 */
async function signInitData(
  botToken: string,
  fields: Record<string, string>
): Promise<string> {
  const params = new URLSearchParams(fields);
  const pairs: string[] = [];
  params.forEach((value, key) => {
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const encoder = new TextEncoder();
  const key1 = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secretKey = await crypto.subtle.sign(
    'HMAC',
    key1,
    encoder.encode(botToken)
  );
  const key2 = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key2,
    encoder.encode(dataCheckString)
  );
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  params.set('hash', hash);
  return params.toString();
}

const FAKE_TOKEN = '123456:ABC-DEF_test_token_only';

describe('validateTelegramData (WebApp HMAC)', () => {
  it('accepts correctly signed fresh initData', async () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = await signInitData(FAKE_TOKEN, {
      auth_date: authDate,
      query_id: 'AAE',
      user: JSON.stringify({ id: 42, first_name: 'Test' }),
    });
    expect(await validateTelegramData(initData, FAKE_TOKEN)).toBe(true);
  });

  it('rejects tampered user payload', async () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = await signInitData(FAKE_TOKEN, {
      auth_date: authDate,
      user: JSON.stringify({ id: 1, first_name: 'A' }),
    });
    const bad = initData.replace(
      encodeURIComponent(JSON.stringify({ id: 1, first_name: 'A' })),
      encodeURIComponent(JSON.stringify({ id: 999, first_name: 'Hacker' }))
    );
    // If replace failed (encoding), force invalid hash
    const forced = bad.includes('999')
      ? bad
      : bad.replace(/hash=[0-9a-f]+/, 'hash=' + '00'.repeat(32));
    expect(await validateTelegramData(forced, FAKE_TOKEN)).toBe(false);
  });

  it('rejects wrong bot token', async () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = await signInitData(FAKE_TOKEN, {
      auth_date: authDate,
      user: JSON.stringify({ id: 7 }),
    });
    expect(await validateTelegramData(initData, 'other:token')).toBe(false);
  });

  it('rejects stale auth_date', async () => {
    const stale = String(Math.floor(Date.now() / 1000) - 200_000);
    const initData = await signInitData(FAKE_TOKEN, {
      auth_date: stale,
      user: JSON.stringify({ id: 1 }),
    });
    expect(
      await validateTelegramData(initData, FAKE_TOKEN, { maxAgeSeconds: 3600 })
    ).toBe(false);
  });

  it('rejects missing hash', async () => {
    expect(
      await validateTelegramData('auth_date=1&user=%7B%7D', FAKE_TOKEN)
    ).toBe(false);
  });
});

describe('authenticateTelegramUser', () => {
  it('returns parsed user when valid', async () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = await signInitData(FAKE_TOKEN, {
      auth_date: authDate,
      user: JSON.stringify({ id: 99, first_name: 'Ada' }),
    });
    const result = await authenticateTelegramUser(initData, FAKE_TOKEN);
    expect(result?.valid).toBe(true);
    expect(result?.user.id).toBe(99);
    expect(result?.user.first_name).toBe('Ada');
  });
});
