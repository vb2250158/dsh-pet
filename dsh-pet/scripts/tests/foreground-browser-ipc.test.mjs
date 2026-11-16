import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import vm from 'node:vm';

function fixture({ launchError, fallbackError } = {}) {
  const sender = {},
    owner = { isDestroyed: () => false };
  const callbacks = new Map(),
    opened = [],
    launches = [],
    logs = [];
  const child = new EventEmitter();
  child.unref = () => {};
  const context = {
    module: { exports: {} },
    URL,
    process: { env: { DSH_PET_SITE_URL: 'http://127.0.0.1:1234/?login=synthetic-secret' } },
    console: { error: (...values) => logs.push(values), warn: (...values) => logs.push(values) },
    require(name) {
      if (name === 'electron')
        return {
          BrowserWindow: { fromWebContents: (value) => (value === sender ? owner : undefined) },
          desktopCapturer: {},
          screen: {},
        };
      if (name === 'node:child_process')
        return {
          spawn: (...args) => {
            launches.push(args);
            if (launchError) throw launchError;
            return child;
          },
        };
      return { decideWindowIgnore: () => false };
    },
  };
  vm.runInNewContext(
    readFileSync(new URL('../../runtime/electron-helper/main/ipc.js', import.meta.url), 'utf8'),
    context,
  );
  context.module.exports.registerIpc({
    ipcMain: { on: (name, callback) => callbacks.set(name, callback), handle: () => {} },
    petWindows: { state: { windows: new Map([['pet', owner]]) } },
    shell: {
      openExternal: async (target) => {
        opened.push(target);
        if (fallbackError) throw fallbackError;
      },
    },
    openTarget: 'site',
    siteOrigin: 'http://127.0.0.1:1234',
    lastActiveBrowserExe: () => 'C:\\Browser\\chrome.exe',
  });
  return { sender, child, callbacks, opened, launches, logs };
}

test('site navigation launches the remembered browser with the existing same-origin authenticated target', () => {
  const f = fixture();
  f.callbacks.get('pet:open-site')({ sender: f.sender }, { url: 'http://127.0.0.1:1234/?voice-assistant=1&ignored=1' });
  assert.equal(f.launches.length, 1);
  assert.equal(f.opened.length, 0);
  const [executable, args, options] = f.launches[0];
  assert.equal(executable, 'C:\\Browser\\chrome.exe');
  assert.equal(args.length, 1);
  const url = new URL(args[0]);
  assert.equal(url.searchParams.get('login'), 'synthetic-secret');
  assert.equal(url.searchParams.get('voice-assistant'), '1');
  assert.equal(url.searchParams.has('ignored'), false);
  assert.equal(options.windowsHide, true);
});

test('spawn and default-browser errors fall back without logging authenticated URLs', async () => {
  for (const synchronous of [false, true]) {
    const secretError = new Error('http://127.0.0.1:1234/?login=synthetic-secret');
    const f = fixture({ launchError: synchronous ? secretError : undefined, fallbackError: secretError });
    f.callbacks.get('pet:open-site')({ sender: f.sender }, { url: 'http://127.0.0.1:1234/' });
    if (!synchronous) f.child.emit('error', secretError);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(f.opened.length, 1);
    assert.equal(new URL(f.opened[0]).searchParams.get('login'), 'synthetic-secret');
    assert.equal(JSON.stringify(f.logs).includes('synthetic-secret'), false);
    assert.equal(JSON.stringify(f.logs).includes('http://'), false);
  }
});
