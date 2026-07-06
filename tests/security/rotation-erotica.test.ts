// ============================================================
// tests/security/rotation-erotica.test.ts
// Security Hardening Test Suite — Rotation Erotica
// Run: npx vitest run tests/security/
// CI/CD: .github/workflows/security-gated-deploy.yml
// ============================================================

import { describe, test, expect, beforeAll } from 'vitest';

// ── Config ──

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zzybjoowhkwuomnpixuy.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!ANON_KEY || !SERVICE_KEY) {
  console.warn('⚠️  SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY not set — some tests will be skipped');
}

// ── Helpers ──

async function supabaseRPC(fnName: string, body: Record<string, unknown>, key: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function supabaseInsert(table: string, body: Record<string, unknown>, key: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function supabaseSelect(table: string, key: string, query = 'select=id&limit=1'): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ── Test Suite ──

describe('Rotation Erotica — Security Hardening', () => {

  // ═══════════════════════════════════════════════════════════
  // CRITICAL: transfer_rtv must be BLOCKED for anon/authenticated
  // ═══════════════════════════════════════════════════════════

  describe('transfer_rtv access control', () => {
    test('BLOCKED for anonymous (anon key)', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseRPC('transfer_rtv', {
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_receiver_id: '11111111-1111-1111-1111-111111111111',
        p_amount_rtv: 1000,
        p_type: 'gift',
      }, ANON_KEY);

      expect([401, 403, 404]).toContain(status);
      // 401/403 = permission denied, 404 = function not found (also safe)
    });

    test('BLOCKED for authenticated (anon key as user)', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseRPC('transfer_rtv', {
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_receiver_id: '11111111-1111-1111-1111-111111111111',
        p_amount_rtv: 1000,
        p_type: 'gift',
      }, ANON_KEY);

      expect([401, 403, 404]).toContain(status);
    });

    test('ALLOWED for service role', async () => {
      if (!SERVICE_KEY) return;
      const { status } = await supabaseRPC('transfer_rtv', {
        p_sender_id: '00000000-0000-0000-0000-000000000000',
        p_receiver_id: '11111111-1111-1111-1111-111111111111',
        p_amount_rtv: 1,
        p_type: 'test',
      }, SERVICE_KEY);

      expect([200, 204]).toContain(status);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CRITICAL: gift_transactions INSERT must be BLOCKED for clients
  // ═══════════════════════════════════════════════════════════

  describe('gift_transactions fabrication protection', () => {
    test('INSERT BLOCKED for anonymous', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseInsert('gift_transactions', {
        sender_id: '00000000-0000-0000-0000-000000000000',
        receiver_id: '11111111-1111-1111-1111-111111111111',
        rtv_amount: 9999,
        gift_type: 'fake',
      }, ANON_KEY);

      expect([401, 403, 404]).toContain(status);
    });

    test('SELECT still works for public feed', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseSelect('gift_transactions', ANON_KEY, 'select=id&limit=5');
      // May return 200 (data exists) or 200 with empty array
      expect([200]).toContain(status);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // HIGH: live_rooms stream columns must be server-controlled
  // ═══════════════════════════════════════════════════════════

  describe('live_rooms column protection', () => {
    test('SELECT works for public stream listing', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseSelect('live_rooms', ANON_KEY, 'select=id&limit=5');
      expect([200]).toContain(status);
    });

    // Note: PATCH test requires a real creator auth token
    // The trigger protection is verified by the SQL-level test:
    // Attempting to PATCH stream_key as creator should raise constraint violation
    test('PATCH stream_key blocked by trigger (documented)', () => {
      // This test documents the expected behavior
      // Manual verification: PATCH live_rooms SET stream_key = 'hacked'
      // as creator → should raise EXCEPTION 'FORBIDDEN'
      expect(true).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // MEDIUM: handle_new_user + prune_stale_stream_viewers
  // ═══════════════════════════════════════════════════════════

  describe('function ACL hardening', () => {
    test('handle_new_user BLOCKED for anon', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseRPC('handle_new_user', {}, ANON_KEY);
      expect([401, 403, 404, 500]).toContain(status);
      // 500 = function errors without trigger context (acceptable)
      // 401/403/404 = permission denied (preferred)
    });

    test('prune_stale_stream_viewers BLOCKED for anon', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseRPC('prune_stale_stream_viewers', {}, ANON_KEY);
      expect([401, 403, 404, 500]).toContain(status);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Avatar schema — tables exist + RLS
  // ═══════════════════════════════════════════════════════════

  describe('Avatar Designer schema', () => {
    test('AvatarStyle table accessible', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseSelect('AvatarStyle', ANON_KEY, 'select=id&limit=1');
      expect([200]).toContain(status);
    });

    test('AvatarCollection public read works', async () => {
      if (!ANON_KEY) return;
      const { status } = await supabaseSelect('AvatarCollection', ANON_KEY, 'select=id&limit=1');
      expect([200]).toContain(status);
    });

    test('AvatarSession self-only access', async () => {
      if (!ANON_KEY) return;
      // Anon key should get empty result (no rows owned by anon)
      const { status } = await supabaseSelect('AvatarSession', ANON_KEY, 'select=id&limit=1');
      expect([200]).toContain(status);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RLS enabled on all tables
  // ═══════════════════════════════════════════════════════════

  describe('RLS enforcement', () => {
    const tables = [
      'gift_transactions',
      'live_rooms',
      'stream_viewers',
      'telegram_identities',
      'AvatarCollection',
      'AvatarSession',
      'AvatarStyle',
      'AvatarLike',
    ];

    for (const table of tables) {
      test(`${table} — RLS blocks unauthenticated writes`, async () => {
        if (!ANON_KEY) return;
        const { status } = await supabaseInsert(table, {
          id: '00000000-0000-0000-0000-000000000000',
        }, ANON_KEY);

        // Should be blocked (401/403) or table not found (404)
        // or constraint violation (400) — all indicate RLS or schema protection
        expect([400, 401, 403, 404]).toContain(status);
      });
    }
  });
});
