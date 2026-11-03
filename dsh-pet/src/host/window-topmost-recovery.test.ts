/** Lifecycle recovery must repair native demotion without a periodic z-order race or activation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createWindows } = require('../../runtime/electron-helper/main/windows.js');
const topmost = require('../../runtime/electron-helper/topmost-watchdog.js');

test('Windows visible show/restore/resume repair native demotion; hidden, destroyed and timer paths leave z-order alone', () => {
  const intervals: Array<() => void> = [];
  const timeouts: Array<() => void> = [];
  const originalInterval = globalThis.setInterval;
  const originalTimeout = globalThis.setTimeout;
  const originalClear = globalThis.clearInterval;
  const originalPets = process.env.DSH_PET_PETS;
  class Window extends EventEmitter {
    id = 1;
    visible = false;
    destroyed = false;
    nativeTop = false;
    pins: boolean[] = [];
    webContents = Object.assign(new EventEmitter(), {
      setBackgroundThrottling() {},
      setZoomFactor() {},
      send() {},
    });
    isDestroyed() {
      return this.destroyed;
    }
    isVisible() {
      return this.visible;
    }
    setAlwaysOnTop(value: boolean) {
      this.pins.push(value);
      this.nativeTop = value;
    }
    setVisibleOnAllWorkspaces() {}
    setIgnoreMouseEvents() {}
    setSkipTaskbar() {}
    getBounds() {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    showInactive() {
      this.visible = true;
      this.emit('show');
    }
    focus() {
      assert.fail('recovery must not activate the pet');
    }
    loadFile() {
      return Promise.resolve();
    }
    destroy() {
      this.destroyed = true;
      this.emit('closed');
    }
  }
  globalThis.setInterval = ((fn: () => void) => {
    intervals.push(fn);
    return { unref() {} };
  }) as unknown as typeof setInterval;
  globalThis.setTimeout = ((fn: () => void) => {
    timeouts.push(fn);
    return 0;
  }) as unknown as typeof setTimeout;
  globalThis.clearInterval = (() => {}) as typeof clearInterval;
  process.env.DSH_PET_PETS = '[{"id":"test","size":90}]';
  try {
    const owner = createWindows({
      BrowserWindow: Window,
      screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({ id: 1 }) },
      buildDeskGeometry: () => ({ hull: { x: 0, y: 0 }, areas: [], workAreas: [], panels: [] }),
      dpi: { petScale: () => 1, currentPointer: () => ({ x: -999, y: -999 }) },
      helperDir: '/synthetic',
      platform: {},
      ...topmost,
      taskbarWatchdogEnabled: true,
    });
    owner.create();
    const win: Window = owner.state.windows.get('test');
    if (process.platform !== 'win32') {
      owner.closeAll();
      owner.stopTaskbarWatchdog();
      return;
    }
    for (const event of ['show', 'restore']) {
      win.visible = true;
      win.nativeTop = false;
      const pinsBefore = win.pins.length;
      win.emit(event);
      assert.equal(win.nativeTop, true, event);
      assert.equal(win.pins.length, pinsBefore + 1, 'one repin per lifecycle event');
      assert.equal(win.pins[win.pins.length - 1], true);
    }
    win.nativeTop = false;
    owner.keepOffTaskbar(win); // Same entry used by resume/unlock/display sync.
    assert.equal(win.nativeTop, true);
    const count = win.pins.length;
    for (const tick of intervals) tick();
    assert.equal(win.pins.length, count, 'periodic taskbar/pointer/watchdog ticks must not repin');
    win.visible = false;
    owner.keepOffTaskbar(win);
    for (const tick of timeouts) tick();
    assert.equal(win.pins.length, count, 'hidden windows remain hidden and unpinned');
    owner.closeAll();
    owner.keepOffTaskbar(win);
    assert.equal(win.pins.length, count, 'destroyed windows must not receive native z-order calls');
    owner.stopTaskbarWatchdog();
  } finally {
    globalThis.setInterval = originalInterval;
    globalThis.setTimeout = originalTimeout;
    globalThis.clearInterval = originalClear;
    if (originalPets === undefined) delete process.env.DSH_PET_PETS;
    else process.env.DSH_PET_PETS = originalPets;
  }
});
