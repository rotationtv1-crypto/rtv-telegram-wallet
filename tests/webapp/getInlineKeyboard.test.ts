/**
 * getInlineKeyboardForBot — registry fallback when bot has no token loaded
 * Entity: Darrel-spell-living-trust
 */

import { describe, it, expect } from 'vitest';
import { getInlineKeyboardForBot } from '../../src/lib/botGateway';

describe('getInlineKeyboardForBot', () => {
  it('falls back to Pages Mini App URL for unknown botId', () => {
    const kb = getInlineKeyboardForBot('not-registered');
    expect(kb.inline_keyboard).toHaveLength(1);
    expect(kb.inline_keyboard[0][0].web_app?.url).toBe(
      'https://rotationtv-mini-app.pages.dev'
    );
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open RotationTV');
  });

  it('uses erotica label when botId is erotica even without token', () => {
    // BOT_CONFIGS includes erotica with empty token; getBotById still finds it
    const kb = getInlineKeyboardForBot('erotica');
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open Erotica');
    expect(kb.inline_keyboard[0][0].web_app?.url).toContain('bot=erotica');
  });

  it('uses main config URL when botId is main', () => {
    const kb = getInlineKeyboardForBot('main');
    expect(kb.inline_keyboard[0][0].web_app?.url).toBe(
      'https://rotationtv-mini-app.pages.dev'
    );
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open RotationTV');
  });
});
