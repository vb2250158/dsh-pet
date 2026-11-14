/** Utterance identity at the BubbleSlots owner, without rendering a browser. */
import assert from 'node:assert/strict';
import test from 'node:test';
import type { BubbleSlotsRuntime } from './bubble-slots.ts';
import { createBubbleSlots } from './bubble-slots.ts';

interface Node {
  props: { key?: number; onPop?: () => void };
}

function harness() {
  const values: unknown[] = [];
  let cursor = 0;
  const runtime: BubbleSlotsRuntime = {
    // The fake element records owner wiring only; real React/DOM has a separate smoke.
    h: ((_tag: unknown, props: unknown) => ({ props })) as unknown as BubbleSlotsRuntime['h'],
    useState<T>(initial: T) {
      const index = cursor++;
      if (!(index in values)) values[index] = initial;
      return [values[index] as T, (next) => {
        values[index] = typeof next === 'function'
          ? (next as (previous: T) => T)(values[index] as T)
          : next;
      }];
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      if (!(index in values)) values[index] = { current: initial };
      return values[index] as { current: T };
    },
    useEffect() {
      // This owner-wiring unit does not subscribe or schedule effects.
    },
  };
  const useSlots = createBubbleSlots(runtime, {
    whisperBubble: () => null,
    balanceBubble: () => null,
    envBubble: () => null,
    todoBubble: () => null,
  });
  return () => {
    cursor = 0;
    return useSlots({
      balance: null, balanceEnabled: false, balanceManual: false,
      workStatusEnabled: false, workTerminal: false, env: null,
    });
  };
}

for (const nextText of ['same speech', 'new speech']) {
  test(`a new utterance owns its own dismiss callback: ${nextText}`, (t) => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { setTimeout: () => 1, clearTimeout() {} },
    });
    t.after(() => {
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
      else Reflect.deleteProperty(globalThis, 'window');
    });
    const render = harness();
    render().showWhisper('same speech', {}, 10000);
    const oldNode = render().node() as unknown as Node;
    render().showWhisper(nextText, {}, 10000);
    const newNode = render().node() as unknown as Node;
    assert.notEqual(newNode.props.key, oldNode.props.key);
    oldNode.props.onPop!();
    assert.notEqual(render().node(), null, 'the old callback must preserve the new utterance');
    newNode.props.onPop!();
    assert.equal(render().node(), null, 'the current callback dismisses its own utterance');
  });
}
