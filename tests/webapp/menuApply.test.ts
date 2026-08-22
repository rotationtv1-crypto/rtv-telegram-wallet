/**
 * applyWebAppMenuButtonToBot / applyAllBotMenuButtons
 * Mocked fetch — no live Telegram calls
 * Entity: Darrel-spell-living-trust
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  applyWebAppMenuButtonToBot,
  applyAllBotMenuButtons,
} from '../../src/lib/botGateway';

const FAKE_TOKEN = '1234567890:AAFakeTokenForUnitTestsOnlyXXXX';

describe('applyWebAppMenuButtonToBot', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns success and masks token on ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: true }),
    }) as any;

    const res = await applyWebAppMenuButtonToBot({
      token: FAKE_TOKEN,
      menuOptions: {
        text: 'Open RotationTV',
        url: 'https://rotationtv-mini-app.pages.dev',
      },
    });

    expect(res.success).toBe(true);
    expect(res.botToken).toBe(FAKE_TOKEN.slice(0, 10) + '...');
    expect(res.botToken).not.toContain('AAFake');
    expect(res.error).toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = (globalThis.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/setChatMenuButton');
    expect(calledUrl).toContain(FAKE_TOKEN);
    const body = JSON.parse(init.body);
    expect(body.menu_button.type).toBe('web_app');
    expect(body.menu_button.web_app.url).toBe(
      'https://rotationtv-mini-app.pages.dev'
    );
  });

  it('returns failure when Telegram responds ok:false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: false,
        description: 'Bad Request: button text is empty',
      }),
    }) as any;

    const res = await applyWebAppMenuButtonToBot({
      token: FAKE_TOKEN,
      menuOptions: { text: '', url: 'https://example.com' },
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Bad Request');
    expect(res.botToken.endsWith('...')).toBe(true);
  });

  it('returns failure on HTTP non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ ok: false, description: 'Bad Gateway' }),
    }) as any;

    const res = await applyWebAppMenuButtonToBot({
      token: FAKE_TOKEN,
      menuOptions: {
        text: 'Open',
        url: 'https://rotationtv-mini-app.pages.dev',
      },
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('returns failure on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as any;

    const res = await applyWebAppMenuButtonToBot({
      token: FAKE_TOKEN,
      menuOptions: {
        text: 'Open',
        url: 'https://rotationtv-mini-app.pages.dev',
      },
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('network down');
  });
});

describe('applyAllBotMenuButtons', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs all bots in parallel and preserves order of results', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: false, description: 'fail erotica' }),
      }) as any;

    const results = await applyAllBotMenuButtons([
      {
        token: '1111111111:AAA',
        menuOptions: {
          text: 'Open RotationTV',
          url: 'https://rotationtv-mini-app.pages.dev',
        },
      },
      {
        token: '2222222222:BBB',
        menuOptions: {
          text: 'Open Erotica',
          url: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
        },
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toContain('fail erotica');
  });
});
