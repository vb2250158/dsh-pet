/** 演出结束必须释放续期计时器，避免插件卸载后仍保留回调。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLock } from './lock.ts';

test('放锁停止续期计时器，重复放锁也不保留计时器', async (t) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const timers = new Set<number>();
  let sequence = 0;
  const calls: string[] = [];
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      setInterval: () => {
        const id = ++sequence;
        timers.add(id);
        return id;
      },
      clearInterval: (id: number) => {
        timers.delete(id);
      },
    },
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  });
  const lock = createLock(
    {
      call: async (_method, route) => {
        calls.push(route);
        return { ok: true, lockId: 'owned-lease' };
      },
      attach: () => {},
      pose: () => null,
      progress: () => null,
      waitPlayback: async () => ({ status: 'ended' }),
    },
    'pet-1',
    () => true,
    () => {},
  );
  await lock.acquire();
  lock.startRenew();
  assert.equal(timers.size, 1);
  await lock.release();
  assert.equal(timers.size, 0);
  assert.equal(lock.id(), null);
  await lock.release();
  assert.equal(timers.size, 0);
  assert.equal(calls.filter((route) => route.startsWith('/lock/release')).length, 1);
});
