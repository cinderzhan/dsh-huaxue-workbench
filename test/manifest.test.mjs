import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('market manifest exposes the reviewed author and packaged preview', async () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('workbench.json', root), 'utf8'));
  assert.equal(manifest.version, '0.3.6-desktop.1');
  assert.equal(manifest.author.name, 'gjz18342624299-arch');
  assert.equal(manifest.screenshots.length, 1);
  assert.equal(manifest.screenshots[0].path, 'assets/market-preview.jpg');
  assert.ok((await stat(new URL(manifest.screenshots[0].path, root))).isFile());
});
