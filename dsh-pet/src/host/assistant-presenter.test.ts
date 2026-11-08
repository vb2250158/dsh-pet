import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantPresenter } from './assistant-presenter.ts';
import { PollStateStore } from './state.ts';
import { createHttpRoute } from './plugin/http-route.ts';
import type { HttpRouteHandler } from './plugin/http-route.ts';
import type { PetRouteDeps } from './routes/types.ts';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestContext } from 'node:test';

function fixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'pet-assistant-fixture-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const userFile = join(dir, 'user.jsonc');
  writeFileSync(userFile, JSON.stringify({ pets: [{ id: 'fish', name: 'Fish', display: 'both' }] }));
  const state = new PollStateStore(),
    calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  let locked = false;
  const routeDeps = {
    state,
    configPaths: {
      defaultFile: fileURLToPath(new URL('../../assets/config.jsonc', import.meta.url)),
      userFile,
      petDir: join(dir, 'pets'),
    },
    memeDirsFor: () => [],
    surfaceBlocked: () => null,
    sleepBlocked: () => null,
    lockBlocked: () => (locked ? { kind: 'json', status: 200, obj: { ok: false, reason: 'locked' } } : null),
  } as unknown as PetRouteDeps;
  const actual = createHttpRoute(routeDeps).handlePetRoute;
  const route: HttpRouteHandler = async (path, method, body, signal) => {
    calls.push({ path, body: body ? (JSON.parse(body) as Record<string, unknown>) : {} });
    return actual(path, method, body, signal);
  };
  const service = createAssistantPresenter({ state, route, listPets: () => [{ id: 'fish', name: 'Fish' }] });
  return {
    service,
    entryRoute: () =>
      createHttpRoute({ ...routeDeps, assistantEntry: () => service.entry() }).handlePetRoute(
        '/dsh-pet-7340/assistant-entry',
        'GET',
      ),
    state,
    calls,
    lock: () => {
      locked = true;
    },
    unlock: () => {
      locked = false;
    },
  };
}
test('assistant lease uses only display routes, independent bubble/animation flags and no second voice', async (t) => {
  const f = fixture(t);
  assert.equal(f.service.entry().available, false);
  const lease = f.service.attach();
  assert.equal(f.service.entry().available, true);
  assert.throws(() => f.service.attach(), /OWNER_UNAVAILABLE/);
  await lease.present({ petId: 'fish', text: 'answer', bubbles: false, animation: true });
  assert.deepEqual(f.calls[0].body, { text: 'answer', duration: 0, anim: true });
  assert.equal(new URL(f.calls[0].path, 'http://localhost').searchParams.has('surface'), false);
  await lease.present({ petId: 'fish', text: 'text', bubbles: true, animation: false });
  assert.deepEqual(f.calls[1].body, { text: 'text', duration: 10000, anim: false });
  await lease.dispose();
  assert.equal(f.service.entry().available, false);
  assert.deepEqual(f.state.read().pets.fish.say.data, { clear: true });
  await assert.rejects(lease.present({ petId: 'fish', text: 'late', bubbles: true, animation: true }), /DETACHED/);
});
test('detach never clears a newer foreign bubble and the original occupancy rejection is preserved', async (t) => {
  const f = fixture(t),
    lease = f.service.attach();
  await lease.present({ petId: 'fish', text: 'ours', bubbles: true, animation: true });
  f.state.writePet('fish', 'say', { text: 'another writer' });
  await lease.dispose();
  assert.deepEqual(f.state.read().pets.fish.say.data, { text: 'another writer' });
  const next = f.service.attach();
  f.lock();
  await assert.rejects(next.present({ petId: 'fish', text: 'blocked', bubbles: true, animation: true }), /REJECTED/);
  await f.service.dispose();
  assert.equal(f.service.entry().available, false);
});

test('real router compares bubble counter after asynchronous dispatch and retries rejected clear', async (t) => {
  const f = fixture(t),
    lease = f.service.attach();
  await lease.present({ petId: 'fish', text: 'ours', bubbles: true, animation: false });
  const pending = lease.clear();
  f.state.writePet('fish', 'say', { text: 'new foreign output' });
  await pending;
  assert.deepEqual(f.state.read().pets.fish.say.data, { text: 'new foreign output' });
  await lease.present({ petId: 'fish', text: 'ours again', bubbles: true, animation: false });
  f.lock();
  await assert.rejects(lease.clear(), /CLEAR_REJECTED/);
  f.unlock();
  await lease.clear();
  assert.deepEqual(f.state.read().pets.fish.say.data, { clear: true });
  await lease.dispose();
});
test('detached in-flight presentation cannot reach the real route write', async (t) => {
  const f = fixture(t),
    lease = f.service.attach();
  const pending = lease.present({ petId: 'fish', text: 'late', bubbles: true, animation: false });
  await lease.dispose();
  await assert.rejects(pending, /REJECTED/);
  assert.equal(f.state.read().pets.fish, undefined);
});

test('assistant entry reports the loaded module version without an attached assistant', async (t) => {
  const f = fixture(t);
  const result = await f.entryRoute();
  assert.equal(result.kind, 'json');
  if (result.kind !== 'json') throw new Error('Expected JSON entry response');
  assert.deepEqual(result.obj, {
    available: false,
    protocol: 1,
    path: '/?voice-assistant=1',
    packageVersion: '0.4.5-fork.7',
  });
  assert.equal(f.service.packageVersion, '0.4.5-fork.7');
  assert.deepEqual(f.calls, []);
  await f.service.dispose();
});
