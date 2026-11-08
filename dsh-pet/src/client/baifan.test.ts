/** 卸载后的配置回执不得重新注册菜单。 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountBaifan } from './baifan.ts';

test('卸载后迟到配置不再注册菜单', async (t) => {
  const prior = ['window', 'document', 'fetch'].map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  t.after(() => {
    for (const [name, descriptor] of prior) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  const node = () => ({ dataset: {}, appendChild: () => {}, remove: () => {} });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: () => null,
      createElement: node,
      head: node(),
      body: node(),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      setInterval: () => 1,
      clearInterval: () => {},
    },
  });
  let resolveConfig!: (value: unknown) => void;
  const config = new Promise((resolve) => {
    resolveConfig = resolve;
  });
  const calls: string[] = [];
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (_url: string, init: RequestInit) => {
      calls.push(init.method ?? 'GET');
      return { json: () => config };
    },
  });
  const dispose = mountBaifan({ get: () => undefined }, document.body);
  await new Promise<void>((resolve) => setImmediate(resolve));
  dispose();
  resolveConfig({ main: { animations: { baifan: ['a', 'b', 'c', 'd', 'e'] } } });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls.includes('POST'), false);
});
