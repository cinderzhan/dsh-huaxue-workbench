import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root)));
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
assert.equal(pkg.name, 'dsh-huaxue-workbench');
for (const file of ['index.js', 'client.js', 'desktop.js', 'desktop-client.js', ...(await readdir(new URL('src/', root))).filter(f=>f.endsWith('.js')).map(f=>'src/'+f)]) {
  const code = await readFile(new URL(file, root), 'utf8');
  assert.ok(!/[CD]:[\\/](?:Users|DSH)[\\/]/i.test(code), `Local path leaked into ${file}`);
  if (!file.endsWith('host-client.js')) {
    const result = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(file, root))], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
}
const client = await readFile(new URL('client.js', root), 'utf8');
assert.ok(!client.includes('__CONTROLLER__'));
assert.ok(!client.includes('data-dsh-workbench-center'), 'Legacy host marker remains');
console.log('Package metadata, portability and JavaScript syntax PASS');
