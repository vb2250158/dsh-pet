import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openResidentAssistant } from './assistant-navigation.ts';
test('desktop entry opens only the fixed shared GUI and missing service retains legacy chat', async () => {
  const opened: string[] = [];
  const open = (path: string): void => {
    opened.push(path);
  };
  assert.equal(
    await openResidentAssistant({
      baseUrl: '/pet',
      open,
      fetcher: async () => Response.json({ available: true, protocol: 1, path: '/?voice-assistant=1' }),
    }),
    true,
  );
  assert.deepEqual(opened, ['/?voice-assistant=1']);
  assert.equal(
    await openResidentAssistant({ baseUrl: '/pet', open, fetcher: async () => Response.json({ available: false }) }),
    false,
  );
  await assert.rejects(
    openResidentAssistant({
      baseUrl: '/pet',
      open,
      fetcher: async () => Response.json({ available: true, protocol: 1, path: 'https://outside.example/' }),
    }),
    /INCOMPATIBLE/,
  );
  await assert.rejects(
    openResidentAssistant({ baseUrl: '/pet', open, fetcher: async () => new Response('', { status: 401 }) }),
    /UNAVAILABLE/,
  );
  assert.equal(opened.length, 1);
});
