import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, lstat, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { beginTransaction, restoreTransaction } from '../scripts/transaction.mjs';

for (const existing of [true, false]) test(`failed install restores configuration and dependencies; previous install=${existing}`, async () => {
  const base = resolve('.test-artifacts'); await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, 'rollback-'));
  const profile = join(root, 'profile'), backup = join(root, 'backup');
  await mkdir(profile);
  await writeFile(join(root, 'sessions.json'), 'user history');
  if (existing) {
    await writeFile(join(profile, 'package.json'), 'original manifest');
    await mkdir(join(profile, 'node_modules/.pnpm/original'), { recursive: true });
    await writeFile(join(profile, 'node_modules/.pnpm/original/value'), 'old dependency');
    await symlink(resolve(profile, 'node_modules/.pnpm/original'), join(profile, 'node_modules/original'), process.platform === 'win32' ? 'junction' : 'dir');
  }
  await beginTransaction(profile, backup);
  // Simulate pnpm changing the manifest, lock and dependency tree before failing.
  await writeFile(join(profile, 'package.json'), 'broken new manifest');
  await writeFile(join(profile, 'pnpm-lock.yaml'), 'new lock');
  await mkdir(join(profile, 'node_modules'), { recursive: true });
  await writeFile(join(profile, 'node_modules/broken'), 'partial install');
  await restoreTransaction(backup);
  await restoreTransaction(backup); // Repeating recovery must not overwrite a restored profile.
  assert.equal(await readFile(join(root, 'sessions.json'), 'utf8'), 'user history');
  await assert.rejects(lstat(join(profile, 'pnpm-lock.yaml')), { code: 'ENOENT' });
  if (existing) {
    assert.equal(await readFile(join(profile, 'package.json'), 'utf8'), 'original manifest');
    assert.equal(await readFile(join(profile, 'node_modules/original/value'), 'utf8'), 'old dependency');
    await assert.rejects(lstat(join(profile, 'node_modules/broken')), { code: 'ENOENT' });
  } else {
    await assert.rejects(lstat(join(profile, 'package.json')), { code: 'ENOENT' });
    await assert.rejects(lstat(join(profile, 'node_modules')), { code: 'ENOENT' });
  }
});
