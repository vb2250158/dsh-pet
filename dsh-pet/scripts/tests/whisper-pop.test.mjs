/** Run the shipped Helper's speech timer lifecycle in an isolated classic-script realm. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function helper() {
  let next = 0;
  const timers = new Map();
  const clock = {
    setTimeout(fn, delay) {
      timers.set(++next, { fn, delay });
      return next;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  const realm = vm.createContext({
    window: clock, navigator: { platform: 'Windows' }, BASE: 'http://localhost',
    WHISPER_POP_MS: 420, BUBBLE_DURATION_MS: 10000, console: { log() {} },
    S: {
      whisperBubbleView: value => value,
      reduceBubbleHold: (_state, event) => ({ on: event.kind === 'show', delayMs: null }),
    },
  });
  const runtime = new URL('../../runtime/electron-helper/', import.meta.url);
  vm.runInContext(readFileSync(new URL('sprite.js', runtime), 'utf8') + ';globalThis.Sprite = PetSprite', realm);
  vm.runInContext(readFileSync(new URL('events.js', runtime), 'utf8'), realm);
  const sprite = Object.create(realm.Sprite.prototype);
  Object.assign(sprite, {
    pet: { id: 'synthetic' }, animations: {}, bubble: { classList: { add() {}, remove() {} } },
    whisperTimer: null, whisperPopTimer: null, workTimer: null, bubbleTimer: null,
    whisperClickable() { return !!this.whisperView; }, renderBubble() {},
    ac: { abort() {} }, inputRegionMutation: { disconnect() {} }, inputRegionResize: { disconnect() {} },
    inputRegionElements: new Set(), el: { remove() {} }, closeMenu() {}, stopThrow() {},
    stopDragFollow() {}, stopSquash() {}, stopMove() {},
  });
  return {
    sprite, timers,
    finishPop() {
      for (const [id, timer] of [...timers]) if (timer.delay === 420) {
        timers.delete(id);
        timer.fn();
      }
    },
  };
}

for (const nextText of ['same speech', 'new speech']) {
  test(`Helper old pop preserves the next utterance: ${nextText}`, () => {
    const h = helper();
    h.sprite.showWhisper('same speech', null, null, 10000, false);
    h.sprite.popWhisper();
    h.sprite.showWhisper(nextText, null, null, 10000, false);
    h.finishPop();
    assert.equal(h.sprite.whisperText, nextText);
    assert.ok(h.sprite.whisperView);
  });
}

test('Helper disposal cancels its pending pop callback', () => {
  const h = helper();
  h.sprite.showWhisper('same speech', null, null, 10000, false);
  h.sprite.popWhisper();
  h.sprite.dispose();
  assert.equal(h.timers.size, 0);
});
