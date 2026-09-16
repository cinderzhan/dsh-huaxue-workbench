import { copyFile, lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
export const configFiles = ['package.json', 'cordis.patch.yml', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc'];
async function exists(path) {
  try { await lstat(path); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; }
}
export async function beginTransaction(profile, backup) {
  profile = resolve(profile); backup = resolve(backup);
  await mkdir(profile, { recursive: true });
  await mkdir(backup, { recursive: true });
  const existing = [];
  for (const file of configFiles) {
    if (await exists(join(profile, file))) {
      await copyFile(join(profile, file), join(backup, file)); existing.push(file);
    }
  }
  const state = { profile, existing, hadModules: await exists(join(profile, 'node_modules')), modulesMoved: false, status: 'prepared' };
  await writeFile(join(backup, 'backup.json'), JSON.stringify(state, null, 2));
  // Rename keeps the exact prior dependency tree (including pnpm links) for recovery.
  if (state.hadModules) {
    await rename(join(profile, 'node_modules'), join(backup, 'node_modules'));
    state.modulesMoved = true;
  }
  state.status = 'installing';
  await writeFile(join(backup, 'backup.json'), JSON.stringify(state, null, 2));
  return state;
}
export async function restoreTransaction(backup) {
  backup = resolve(backup);
  const state = JSON.parse(await readFile(join(backup, 'backup.json'), 'utf8'));
  if (state.status === 'restored') return state;
  if (state.hadModules && !(await exists(join(backup, 'node_modules')))) throw Error('原依赖备份缺失；停止回退，不改动当前安装。');
  const displaced = join(backup, `replaced-${Date.now()}`);
  await mkdir(displaced);
  for (const file of configFiles) {
    if (await exists(join(state.profile, file))) await rename(join(state.profile, file), join(displaced, file));
    if (state.existing.includes(file)) await copyFile(join(backup, file), join(state.profile, file));
  }
  if (await exists(join(state.profile, 'node_modules'))) await rename(join(state.profile, 'node_modules'), join(displaced, 'node_modules'));
  if (state.hadModules) await rename(join(backup, 'node_modules'), join(state.profile, 'node_modules'));
  state.status = 'restored';
  await writeFile(join(backup, 'backup.json'), JSON.stringify(state, null, 2));
  return state;
}
