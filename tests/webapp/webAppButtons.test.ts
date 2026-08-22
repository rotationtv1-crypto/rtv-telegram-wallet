/**
 * Inline WebApp button helper tests
 * Entity: Darrel-spell-living-trust
 */

import { describe, it, expect } from 'vitest';
import {
  createWebAppMenuButton,
  createInlineWebAppKeyboard,
  miniAppInlineKeyboard,
  dualActionKeyboard,
  eroticaInlineKeyboard,
} from '../../src/lib/webAppButtons';

describe('createWebAppMenuButton', () => {
  it('builds setChatMenuButton payload with web_app type', () => {
    const btn = createWebAppMenuButton({
      text: 'Open RotationTV',
      url: 'https://rotationtv-mini-app.pages.dev',
    });
    expect(btn.type).toBe('web_app');
    expect(btn.text).toBe('Open RotationTV');
    expect(btn.web_app.url).toBe('https://rotationtv-mini-app.pages.dev');
  });
});

describe('createInlineWebAppKeyboard', () => {
  it('wraps a single web_app button in inline_keyboard', () => {
    const kb = createInlineWebAppKeyboard({
      text: '🚀 Open App',
      url: 'https://rotationtv-mini-app.pages.dev?bot=erotica',
    });
    expect(kb.inline_keyboard).toHaveLength(1);
    expect(kb.inline_keyboard[0]).toHaveLength(1);
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open App');
    expect(kb.inline_keyboard[0][0].web_app?.url).toContain('bot=erotica');
  });
});

describe('miniAppInlineKeyboard', () => {
  it('uses default label when omitted', () => {
    const kb = miniAppInlineKeyboard('https://rotationtv-mini-app.pages.dev');
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open RotationTV');
    expect(kb.inline_keyboard[0][0].web_app?.url).toBe(
      'https://rotationtv-mini-app.pages.dev'
    );
  });

  it('accepts custom label', () => {
    const kb = miniAppInlineKeyboard(
      'https://rotationtv-mini-app.pages.dev',
      'Launch'
    );
    expect(kb.inline_keyboard[0][0].text).toBe('Launch');
  });
});

describe('dualActionKeyboard', () => {
  it('includes only Open App when tonviewer omitted', () => {
    const kb = dualActionKeyboard('https://rotationtv-mini-app.pages.dev');
    expect(kb.inline_keyboard).toHaveLength(1);
    expect(kb.inline_keyboard[0][0].web_app?.url).toBeDefined();
  });

  it('adds Tonviewer url button as second row', () => {
    const kb = dualActionKeyboard(
      'https://rotationtv-mini-app.pages.dev',
      'https://tonviewer.com/tx/abc'
    );
    expect(kb.inline_keyboard).toHaveLength(2);
    expect(kb.inline_keyboard[1][0].url).toBe('https://tonviewer.com/tx/abc');
    expect(kb.inline_keyboard[1][0].web_app).toBeUndefined();
  });
});

describe('eroticaInlineKeyboard', () => {
  it('defaults to Pages erotica URL and erotica label', () => {
    const kb = eroticaInlineKeyboard();
    expect(kb.inline_keyboard[0][0].text).toBe('🚀 Open Erotica');
    expect(kb.inline_keyboard[0][0].web_app?.url).toBe(
      'https://rotationtv-mini-app.pages.dev?bot=erotica'
    );
  });

  it('allows override URL', () => {
    const kb = eroticaInlineKeyboard('https://example.com/e');
    expect(kb.inline_keyboard[0][0].web_app?.url).toBe('https://example.com/e');
  });
});
