/** 验证实际 Helper 事件脚本把语音生命周期交给共享气泡状态机。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import * as bubbleHold from '../shared/bubble-hold.ts';
import type { BubbleHoldState } from '../shared/bubble-hold.ts';
import type { VoiceUtteranceEvent } from '../shared/voice.ts';

class Sprite {
  whisperText = 'current speech';
  whisperHold: BubbleHoldState = bubbleHold.reduceBubbleHold(bubbleHold.BUBBLE_HOLD_IDLE, {
    kind: 'show',
    durationMs: 10000,
  });
  whisperOn = true;
  whisperTimer: number | null = null;
  renderBubble(): void {}
}

test('Helper voice events hold matching bubbles and ignore stale endings and foreign speech', async () => {
  const current = new Sprite(),
    foreign = new Sprite();
  foreign.whisperText = 'another speech';
  const foreignBefore = foreign.whisperHold;
  const hooks: { utterance?: (event: VoiceUtteranceEvent) => void; subscriptions: number } = { subscriptions: 0 };
  const context = {
    PetSprite: Sprite,
    loopsStarted: false,
    sprites: [current, foreign],
    STATE_URL: '/state',
    stateLongPoll: false,
    setTimeout: () => 1,
    window: { setTimeout: () => 1, clearTimeout() {} },
    S: {
      ...bubbleHold,
      subscribeVoiceState() {},
      subscribeVoiceUtterance(listener: (event: VoiceUtteranceEvent) => void) {
        hooks.utterance = listener;
        hooks.subscriptions++;
      },
      fetchState: async () => null,
    },
  };
  const script = readFileSync(new URL('../../runtime/electron-helper/events.js', import.meta.url), 'utf8');
  runInNewContext(script + '\nstartLoops(); startLoops();', context);
  await Promise.resolve();
  assert.equal(hooks.subscriptions, 1);
  assert.ok(hooks.utterance);
  hooks.utterance({ kind: 'start', seq: 1, text: current.whisperText });
  assert.equal(current.whisperHold.holdSeq, 1);
  assert.equal(current.whisperHold.delayMs, bubbleHold.BUBBLE_HOLD_MAX_MS);
  hooks.utterance({ kind: 'start', seq: 2, text: current.whisperText });
  hooks.utterance({ kind: 'end', seq: 1, text: current.whisperText });
  assert.equal(current.whisperHold.holdSeq, 2);
  hooks.utterance({ kind: 'end', seq: 2, text: current.whisperText });
  assert.equal(current.whisperHold.holdSeq, null);
  assert.equal(current.whisperHold.delayMs, bubbleHold.BUBBLE_HOLD_TAIL_MS);
  assert.equal(foreign.whisperHold, foreignBefore);
});
