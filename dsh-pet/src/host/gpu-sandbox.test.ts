import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { test } from 'node:test';

const entry = new URL('../../runtime/electron-helper/main.js', import.meta.url);
const source = readFileSync(entry, 'utf8');
const realRequire = createRequire(entry);

function mainBeforeReady(
  platform: string,
  gpuSandbox?: string,
  extraEnv: Record<string, string> = {},
  directoryError?: Error,
) {
  const switches: string[] = [];
  const paths: Array<{ name: string; path: string }> = [];
  const directories: string[] = [];
  const ready = new Error('Electron ready reached');
  const env = {
    DSH_PET_FORCE_DSF: '0',
    ...(gpuSandbox === undefined ? {} : { DSH_PET_GPU_SANDBOX: gpuSandbox }),
    ...extraEnv,
  };
  const app = {
    commandLine: {
      appendSwitch: (name: string) => switches.push(name),
    },
    setName: () => {},
    setPath: (name: string, path: string) => paths.push({ name, path }),
    getPath: () => 'C:/default-app-data',
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
  const loaded = new Map<string, { exports: Record<string, object> }>();
  const requireFrom =
    (filename: string) =>
    (name: string): object => {
      if (name === 'electron') return { app };
      if (name === 'node:fs')
        return {
          mkdirSync: (path: string) => {
            if (directoryError) throw directoryError;
            directories.push(path);
          },
        };
      if (name === 'node:child_process') {
        return {
          execFileSync: () => {
            throw new Error('Unexpected subprocess');
          },
        };
      }
      if (name.startsWith('.')) {
        const resolved = createRequire(filename).resolve(name);
        const cached = loaded.get(resolved);
        if (cached) return cached.exports;
        const module = { exports: {} };
        loaded.set(resolved, module);
        new Script(readFileSync(resolved, 'utf8'), { filename: resolved }).runInNewContext({
          require: requireFrom(resolved),
          process: processStub,
          module,
          exports: module.exports,
          __dirname: dirname(resolved),
          __filename: resolved,
          URL,
          Buffer,
          console: { error: () => {} },
        });
        return module.exports;
      }
      return realRequire(name);
    };
  const requireStub = requireFrom(fileURLToPath(entry));
  let reachedReady = false;
  try {
    new Script(source, { filename: fileURLToPath(entry) }).runInNewContext({
      require: requireStub,
      process: processStub,
      URL,
      __dirname: fileURLToPath(new URL('../../runtime/electron-helper/', import.meta.url)),
      __filename: fileURLToPath(entry),
      console: { error: () => {} },
    });
  } catch (error) {
    if (error !== ready) throw error;
    reachedReady = true;
  }
  assert.equal(reachedReady, true);
  return { switches, paths, directories };
}

const switchesFor = (platform: string, value?: string): string[] => mainBeforeReady(platform, value).switches;

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

test('explicit helper user data is isolated before ordinary, app and DPI-probe startup', () => {
  const directory = resolve(tmpdir(), 'dsh-pet-isolated-user-data');
  const variants: Array<Record<string, string>> = [{}, { DSH_PET_APP_MODE: '1' }, { DSH_PET_DPI_PROBE: '1' }];
  for (const extra of variants) {
    const result = mainBeforeReady('win32', undefined, { ...extra, DSH_PET_USER_DATA_DIR: directory });
    assert.deepEqual(result.paths, [{ name: 'userData', path: directory }]);
    assert.deepEqual(result.directories, [directory]);
    assert.equal(result.switches.includes('disable-gpu-sandbox'), false);
  }
});

test('relative or empty user-data overrides fail instead of using the default profile', () => {
  for (const directory of ['', 'relative-profile', '../profile']) {
    assert.throws(
      () => mainBeforeReady('win32', undefined, { DSH_PET_USER_DATA_DIR: directory }),
      /DSH_PET_USER_DATA_DIR must be an absolute directory/,
    );
  }
});

test('ordinary helper startup keeps its existing default profile when no override is set', () => {
  const result = mainBeforeReady('win32');
  assert.deepEqual(result.paths, []);
  assert.deepEqual(result.directories, []);
});

test('an unavailable explicit profile directory fails without reaching the default profile', () => {
  const failure = new Error('directory unavailable');
  assert.throws(
    () =>
      mainBeforeReady(
        'win32',
        undefined,
        { DSH_PET_USER_DATA_DIR: resolve(tmpdir(), 'unavailable-pet-profile') },
        failure,
      ),
    (error) => error === failure,
  );
});
