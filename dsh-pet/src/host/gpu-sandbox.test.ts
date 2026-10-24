import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { test } from 'node:test';

const entry = new URL('../../runtime/electron-helper/main.js', import.meta.url);
const source = readFileSync(entry, 'utf8');
const realRequire = createRequire(entry);

function switchesFor(platform: string, gpuSandbox?: string): string[] {
  const switches: string[] = [];
  const ready = new Error('Electron ready reached');
  const env = {
    DSH_PET_FORCE_DSF: '0',
    ...(gpuSandbox === undefined ? {} : { DSH_PET_GPU_SANDBOX: gpuSandbox }),
  };
  const app = {
    commandLine: {
      appendSwitch: (name: string) => switches.push(name),
    },
    setName: () => {},
    setAppUserModelId: () => {},
    disableHardwareAcceleration: () => {},
    whenReady: () => {
      throw ready;
    },
    on: () => {},
  };
  const processStub = {
    platform,
    env,
    argv: ['electron', fileURLToPath(entry)],
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    stdin: new EventEmitter(),
  };
  const requireStub = (name: string) => {
    if (name === 'electron') return { app };
    if (name === 'node:child_process') {
      return {
        execFileSync: () => {
          throw new Error('Unexpected subprocess');
        },
      };
    }
    return realRequire(name);
  };
  assert.throws(
    () =>
      new Script(source, { filename: fileURLToPath(entry) }).runInNewContext({
        require: requireStub,
        process: processStub,
        URL,
        __dirname: fileURLToPath(new URL('../../runtime/electron-helper/', import.meta.url)),
        console: { error: () => {} },
      }),
    (error) => error === ready,
  );
  return switches;
}

test('Windows preserves GPU sandbox unless explicitly disabled', () => {
  for (const value of [undefined, '1', '', 'unexpected']) {
    assert.equal(switchesFor('win32', value).includes('disable-gpu-sandbox'), false);
  }
});

test('Windows virtual-display workaround requires explicit zero', () => {
  assert.equal(switchesFor('win32', '0').includes('disable-gpu-sandbox'), true);
});

test('GPU workaround does not change other platforms', () => {
  for (const platform of ['darwin', 'linux']) {
    assert.equal(switchesFor(platform, '0').includes('disable-gpu-sandbox'), false);
  }
});
