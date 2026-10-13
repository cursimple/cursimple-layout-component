import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../plugin-packages/app-layout/manifest.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('manifest declares api 12, layouts and no permissions', () => {
  assert.equal(manifest.id, 'app-layout');
  assert.equal(manifest.kind, 'extension');
  assert.equal(manifest.apiVersion, 12);
  assert.equal(manifest.minHostVersion, '0.7.11');
  assert.deepEqual(manifest.permissions, []);
  assert.deepEqual(manifest.allowedHosts, ['cursimple-extension.invalid']);
  assert.deepEqual(manifest.extension.layouts, [{id: 'bottom-bar', title: '底边栏', shell: 'bottomBar'}]);
  assert.equal(manifest.extension.ui.entry, 'ui/index.html');
  assert.equal(manifest.extension.ui.settingsEntry, 'ui/index.html');
});

test('package and manifest versions agree', () => {
  assert.equal(pkg.version, manifest.version);
});
