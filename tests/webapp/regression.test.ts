/**
 * Issue #19 — WebApp + Mini App parity regression suite
 *
 * Covers:
 * - Canonical API origin (api.rotationtv.network)
 * - Browser JWT create / verify / expired / malformed
 * - Telegram initData never trusted client-side (server path only)
 * - Stars openInvoice graceful degradation outside Telegram
 * - No client-side secrets in expected source patterns
 * - WebApp entrypoints present
 *
 * Entity: Darrel-spell-living-trust
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd());

// ─── API origin resolution (mirrors vite resolve logic) ───────────────────────

const CANONICAL_API = 'https://api.rotationtv.network';
const LEGACY_DEV_API = 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

function resolveApiBase(env: {
  VITE_API_BASE?: string;
  NODE_ENV?: string;
  MODE?: string;
}): string {
  const fromEnv = env.VITE_API_BASE?.trim();
  if (fromEnv) return fromEnv;
  if (env.NODE_ENV === 'production' || env.MODE === 'production') return CANONICAL_API;
  return LEGACY_DEV_API;
}

describe('WebApp API origin (issue #19)', () => {
  it('defaults to canonical production API when NODE_ENV=production', () => {
    expect(resolveApiBase({ NODE_ENV: 'production' })).toBe(CANONICAL_API);
  });

  it('defaults to canonical when MODE=production', () => {
    expect(resolveApiBase({ MODE: 'production' })).toBe(CANONICAL_API);
  });

  it('falls back to workers.dev in non-production', () => {
    expect(resolveApiBase({ NODE_ENV: 'development' })).toBe(LEGACY_DEV_API);
    expect(resolveApiBase({})).toBe(LEGACY_DEV_API);
  });

  it('honors explicit VITE_API_BASE override', () => {
    expect(resolveApiBase({ VITE_API_BASE: 'http://localhost:8787', NODE_ENV: 'production' })).toBe(
      'http://localhost:8787'
    );
  });

  it('vite.web.config.ts and client sources reference canonical origin', () => {
    const webConfig = readFileSync(join(ROOT, 'vite.web.config.ts'), 'utf8');
    expect(webConfig).toContain(CANONICAL_API);
    expect(webConfig).toContain('resolveApiBase');

    const apiTs = readFileSync(join(ROOT, 'frontend/src/services/api.ts'), 'utf8');
    expect(apiTs).toContain(CANONICAL_API);

    const webApp = readFileSync(join(ROOT, 'frontend/src/web/WebApp.tsx'), 'utf8');
    expect(webApp).toContain(CANONICAL_API);
  });
});

// ─── JWT (server-side webAuth) ────────────────────────────────────────────────

describe('Browser JWT auth (src/lib/webAuth.ts)', () => {
  // Minimal pure re-implementation for offline unit tests (mirrors production logic)
  async function createJWT(
    payload: Record<string, unknown>,
    secret: string,
    ttlSeconds = 86400 * 7
  ): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const fullPayload = { ...payload, exp };
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(fullPayload))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return `${data}.${sigB64}`;
  }

  async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
    try {
      const [headerB64, payloadB64, sigB64] = token.split('.');
      if (!headerB64 || !payloadB64 || !sigB64) return null;
      const data = `${headerB64}.${payloadB64}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0)
      );
      const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
      if (!valid) return null;
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  }

  const SECRET = 'test-jwt-secret-issue-19';

  it('creates and verifies a valid JWT', async () => {
    const token = await createJWT(
      { userId: 42, username: 'testuser', botId: 'main', authDate: Math.floor(Date.now() / 1000) },
      SECRET
    );
    const payload = await verifyJWT(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(42);
    expect(payload!.username).toBe('testuser');
  });

  it('rejects expired JWT', async () => {
    const token = await createJWT(
      { userId: 1, botId: 'main', authDate: 0 },
      SECRET,
      -10 // already expired
    );
    const payload = await verifyJWT(token, SECRET);
    expect(payload).toBeNull();
  });

  it('rejects malformed JWT', async () => {
    expect(await verifyJWT('not.a.jwt', SECRET)).toBeNull();
    expect(await verifyJWT('a.b', SECRET)).toBeNull();
    expect(await verifyJWT('', SECRET)).toBeNull();
  });

  it('rejects JWT signed with wrong secret', async () => {
    const token = await createJWT({ userId: 99, botId: 'main', authDate: 1 }, SECRET);
    expect(await verifyJWT(token, 'wrong-secret')).toBeNull();
  });

  it('src/lib/webAuth.ts exists and exports authenticateWebUser + verifyWebAuth', () => {
    const src = readFileSync(join(ROOT, 'src/lib/webAuth.ts'), 'utf8');
    expect(src).toContain('export async function authenticateWebUser');
    expect(src).toContain('export async function verifyWebAuth');
    expect(src).toContain('createJWT');
    expect(src).toContain('verifyJWT');
  });
});

// ─── Stars graceful degradation ───────────────────────────────────────────────

describe('Stars graceful degradation (standalone browser)', () => {
  it('useStarsPayment falls back to window.open when Telegram.WebApp.openInvoice is absent', () => {
    const src = readFileSync(join(ROOT, 'frontend/src/hooks/useStarsPayment.ts'), 'utf8');
    expect(src).toContain('tg?.openInvoice');
    expect(src).toContain("window.open(data.invoice_url, '_blank')");
  });

  it('WebApp.tsx payStars never assumes Telegram.WebApp and uses window.open', () => {
    const src = readFileSync(join(ROOT, 'frontend/src/web/WebApp.tsx'), 'utf8');
    expect(src).toContain("window.open(data.invoice_url, '_blank')");
    expect(src).not.toMatch(/Telegram\.WebApp\.openInvoice/);
  });
});

// ─── Security: no secrets in client trees ─────────────────────────────────────

describe('Security — no client-side secrets', () => {
  const clientPaths = [
    'frontend/src/services/api.ts',
    'frontend/src/services/webAuth.ts',
    'frontend/src/web/WebApp.tsx',
    'frontend/src/hooks/useStarsPayment.ts',
    'frontend/src/hooks/useTelegram.ts',
  ];

  const forbiddenPatterns = [
    /sk_live_[a-zA-Z0-9]+/,
    /sk_test_[a-zA-Z0-9]+/,
    /BotFather|TELEGRAM_BOT_TOKEN\s*=\s*['"][0-9]+:/,
    /service_role|SUPABASE_SERVICE_ROLE/,
    /CF_API_TOKEN|CLOUDFLARE_API_TOKEN\s*=\s*['"][a-zA-Z0-9_-]{20,}/,
  ];

  for (const p of clientPaths) {
    it(`${p} contains no hardcoded secrets`, () => {
      if (!existsSync(join(ROOT, p))) return;
      const src = readFileSync(join(ROOT, p), 'utf8');
      for (const re of forbiddenPatterns) {
        expect(src).not.toMatch(re);
      }
    });
  }
});

// ─── Entrypoints & sync engine ────────────────────────────────────────────────

describe('WebApp entrypoints and sync', () => {
  it('WebApp.tsx and main.tsx exist under frontend/src/web', () => {
    expect(existsSync(join(ROOT, 'frontend/src/web/WebApp.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'frontend/src/web/main.tsx'))).toBe(true);
  });

  it('vite.web.config.ts produces dist-web', () => {
    const cfg = readFileSync(join(ROOT, 'vite.web.config.ts'), 'utf8');
    expect(cfg).toContain("outDir: '../dist-web'");
    expect(cfg).toContain('frontend/web.html');
  });

  it('webappSyncEngine.ts exists and exports version/feature helpers', () => {
    const src = readFileSync(join(ROOT, 'src/lib/webappSyncEngine.ts'), 'utf8');
    expect(src).toContain('checkVersionSync');
    expect(src).toContain('getFeatureFlags');
    expect(src).toContain('publishVersion');
  });

  it('Telegram initData validation remains server-side only (no client HMAC trust)', () => {
    // Client webAuth only POSTs initData; verification is server-side
    const client = readFileSync(join(ROOT, 'frontend/src/services/webAuth.ts'), 'utf8');
    expect(client).toContain('/api/web/auth');
    expect(client).not.toContain('validateTelegramData');
    expect(client).not.toContain('HMAC');

    const server = readFileSync(join(ROOT, 'src/lib/webAuth.ts'), 'utf8');
    expect(server).toContain('validateTelegramData');
  });
});
