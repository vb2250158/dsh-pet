/** Git installation prepares plugin assets without compiling unused standalone applications. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import configurations from '../../tsdown.plugin.config.mjs';

test('Git preparation selects the original Host and Web targets and required helper JavaScript', async () => {
  assert.deepEqual(configurations.flatMap(({ entry }) => Object.keys(entry)).sort(), ['client', 'index']);
  const root = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  const plugin = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(root.scripts.prepare, 'npm run build:plugin');
  assert.equal(root.scripts.prepack, 'npm run build:plugin');
  assert.equal(root.scripts['prepack:release'], 'npm --prefix dsh-pet run prepack');
  assert.equal(root.scripts['build:plugin'], 'npm --prefix dsh-pet run build:plugin');
  assert.equal(
    plugin.scripts['build:plugin'],
    'tsdown --config tsdown.plugin.config.mjs && node scripts/build-desktop-core.mjs && node scripts/gen-types.mjs',
  );
  assert.match(plugin.scripts.prepack, /npm run build && npm run typecheck/);
  assert.equal(root.files.includes('dsh-pet/runtime/electron-helper'), true);
  assert.equal(root.files.includes('dsh-pet/lib'), true);
});
