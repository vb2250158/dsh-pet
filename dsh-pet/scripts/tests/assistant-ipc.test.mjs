import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('desktop GUI navigation preserves same-origin login, fixed intent and no arbitrary query forwarding', async () => {
  const sender = {},
    owner = { isDestroyed: () => false };
  const callbacks = new Map(),
    opened = [],
    context = {
      module: { exports: {} },
      URL,
      console,
      process: { env: { DSH_PET_SITE_URL: 'http://127.0.0.1:1234/?login=fixture' } },
      require: (name) =>
        name === 'electron'
          ? {
              BrowserWindow: { fromWebContents: (value) => (value === sender ? owner : undefined) },
              desktopCapturer: {},
              screen: {},
            }
          : { decideWindowIgnore: () => false },
    };
  vm.runInNewContext(
    readFileSync(new URL('../../runtime/electron-helper/main/ipc.js', import.meta.url), 'utf8'),
    context,
  );
  context.module.exports.registerIpc({
    ipcMain: { on: (name, fn) => callbacks.set(name, fn), handle: () => {} },
    petWindows: { state: { windows: new Map([['fish', owner]]) } },
    shell: {
      openExternal: async (url) => {
        opened.push(url);
      },
    },
    openTarget: 'desktop',
    siteOrigin: 'http://127.0.0.1:1234',
  });
  callbacks.get('pet:open-site')({ sender }, { url: 'http://127.0.0.1:1234/?voice-assistant=1&untrusted=ignored' });
  assert.equal(opened.length, 1);
  const target = new URL(opened[0]);
  assert.equal(target.searchParams.get('login'), 'fixture');
  assert.equal(target.searchParams.get('voice-assistant'), '1');
  assert.equal(target.searchParams.has('untrusted'), false);
  for (const url of [
    'https://',
    'https://external.example/?voice-assistant=1',
    'javascript:alert(1)',
    'http://user:pass@127.0.0.1:1234/',
  ])
    assert.doesNotThrow(() => callbacks.get('pet:open-site')({ sender }, { url }));
  callbacks.get('pet:open-site')({ sender: {} }, { url: 'http://127.0.0.1:1234/?voice-assistant=1' });
  assert.equal(opened.length, 1);
});
