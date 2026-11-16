import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import vm from 'node:vm';

function trackerFixture(platform = 'win32') {
  const children = [],
    calls = [],
    warnings = [];
  const context = {
    module: { exports: {} },
    Buffer,
    process: { platform },
    require(name) {
      assert.equal(name, 'node:child_process');
      return {
        spawn(...args) {
          calls.push(args);
          const child = new EventEmitter();
          child.stdout = new EventEmitter();
          child.stdout.setEncoding = () => {};
          child.kills = 0;
          child.kill = () => {
            child.kills++;
          };
          children.push(child);
          return child;
        },
      };
    },
  };
  vm.runInNewContext(
    readFileSync(new URL('../../runtime/electron-helper/main/foreground-browser.js', import.meta.url), 'utf8'),
    context,
  );
  const tracker = context.module.exports.createForegroundBrowser({
    platform,
    logger: { warn: (value) => warnings.push(value) },
  });
  return { tracker, children, calls, warnings };
}

test('foreground tracking owns one hidden sampler and only resolves paths after window changes', () => {
  const fixture = trackerFixture();
  fixture.tracker.start();
  fixture.tracker.start();
  assert.equal(fixture.calls.length, 1);
  const [executable, args, options] = fixture.calls[0];
  assert.equal(executable, 'powershell.exe');
  assert.equal(options.windowsHide, true);
  assert.deepEqual(Array.from(options.stdio), ['ignore', 'pipe', 'ignore']);
  const script = Buffer.from(args[args.indexOf('-EncodedCommand') + 1], 'base64').toString('utf16le');
  assert.match(script, /if \(\$processId -gt 0 -and \$handle -ne \$lastWindow\) \{\s*\$process = Get-Process/);
  assert.match(script, /Start-Sleep -Milliseconds 800/);
  assert.match(script, /OutputEncoding = \[System.Text.UTF8Encoding\]::new\(\$false\)/);
  fixture.tracker.stop();
  fixture.tracker.stop();
  assert.equal(fixture.children[0].kills, 1);
  assert.equal(fixture.tracker.isRunning(), false);
});

test('fragmented sampler output remembers browsers and ignores unrelated foreground applications', () => {
  const fixture = trackerFixture();
  fixture.tracker.start();
  fixture.children[0].stdout.emit('data', '1\tchrome\tC:\\浏览器\\chr');
  assert.equal(fixture.tracker.lastBrowserExe(), undefined);
  fixture.children[0].stdout.emit('data', 'ome.exe\r\n2\texplorer\tC:\\Windows\\explorer.exe\n');
  assert.equal(fixture.tracker.lastBrowserExe(), 'C:\\浏览器\\chrome.exe');
  fixture.children[0].stdout.emit('data', '3\tmsedge\tC:\\Browser\\msedge.exe\n');
  assert.equal(fixture.tracker.lastBrowserExe(), 'C:\\Browser\\msedge.exe');
  fixture.tracker.stop();
  assert.equal(fixture.tracker.lastBrowserExe(), undefined);
});

test('late events from a stopped sampler cannot clear or populate its replacement', () => {
  const fixture = trackerFixture();
  fixture.tracker.start();
  const old = fixture.children[0];
  fixture.tracker.stop();
  fixture.tracker.start();
  const current = fixture.children[1];
  current.stdout.emit('data', '3\tfirefox\tC:\\Browser\\firefox.exe\n');
  old.stdout.emit('data', '4\tchrome\tC:\\old.exe\n');
  old.emit('exit', 0);
  old.emit('error', new Error('late old error'));
  assert.equal(fixture.tracker.isRunning(), true);
  assert.equal(fixture.tracker.lastBrowserExe(), 'C:\\Browser\\firefox.exe');
  current.emit('exit', 1);
  assert.equal(fixture.tracker.isRunning(), false);
  assert.equal(fixture.tracker.lastBrowserExe(), undefined);
  assert.equal(fixture.calls.length, 2, 'exit does not spawn a replacement');
});

test('other platforms do not start a Windows sampler', () => {
  const fixture = trackerFixture('linux');
  fixture.tracker.start();
  assert.equal(fixture.calls.length, 0);
});
