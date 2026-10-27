import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_FONT, fontStackOf } from './fonts.ts';
import { CHAT_CSS } from './chat/styles.ts';
import { SCORE_POPUP_CSS } from './score-popup.ts';
import { PET_TEXT_CSS } from './typography.ts';

test('default pet typography follows the host system font', () => {
  assert.equal(DEFAULT_FONT.family, 'system');
  assert.equal(fontStackOf(DEFAULT_FONT.family), 'var(--dsw-font-family,system-ui,sans-serif)');
  assert.match(fontStackOf('candy'), /ShangshouSoftCandy/);
});

test('modular chat and score overlays retain the shared typography', () => {
  assert.ok(CHAT_CSS.includes(PET_TEXT_CSS));
  assert.ok(SCORE_POPUP_CSS.includes(PET_TEXT_CSS));
});
