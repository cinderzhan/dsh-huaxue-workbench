import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { inspectApp } from './doctor.mjs';
import { beginTransaction, restoreTransaction } from './transaction.mjs';
const arg = key => { const i = process.argv.indexOf(key); return i < 0 ? undefined : process.argv[i + 1]; };
const packageMetadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
if (packageMetadata.exports?.['.'] === './desktop.js') throw Error('此版本默认使用 Desktop 标准入口。请由 Desktop 集成工作台包；旧 standalone 安装器不适用，未修改任何配置。参见 DESKTOP-ADAPTER.md。');
if (!arg('--app') || !arg('--home')) throw Error('用法：node scripts/install.mjs --app <resources/app> --home <Harness 数据目录> [--apply]');
const report = await inspectApp(arg('--app'));
if (!report.supported) throw Error(`停止：未验证的版本 Desktop ${report.desktop} / Harness ${report.harness}。没有修改配置。`);
const root = fileURLToPath(new URL('../', import.meta.url));
const home = resolve(arg('--home'));
const profile = join(home, 'profiles/web');
const manifestPath = join(profile, 'package.json');
let manifest;
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; manifest = { name: 'dsh-profile-web', private: true, dependencies: {}, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'], patchReload: 'live' } } }; }
const require = createRequire(join(report.app, 'package.json'));
const yaml = require('yaml');
const patchPath = join(profile, 'cordis.patch.yml');
let patchText = '[]\n';
try { patchText = await readFile(patchPath, 'utf8'); } catch(e) { if(e.code !== 'ENOENT') throw e; }
const patch = yaml.parse(patchText) || [];
if (!Array.isArray(patch)) throw Error('未知的 profile patch 结构；停止且不改写。');
const legacy = new Set(['dsh-huaxue-workbench', 'dsh-local-workbenches']);
const migrated = patch.map(operation => {
  if (!Array.isArray(operation.insert)) return operation;
  const insert = operation.insert.filter(entry => !legacy.has(entry.name));
  return { ...operation, insert };
}).filter(operation => !Array.isArray(operation.insert) || operation.insert.length || Object.keys(operation).length > 1);
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'install' : 'dry-run', ...report, profile, source: root, preserves: ['sessions', 'settings', 'credentials', 'other plugins'] }, null, 2));
if (!process.argv.includes('--apply')) { console.log('检查通过。退出 DSH 后加 --apply 执行；先自动备份配置。'); process.exit(0); }
await access(join(root, 'client.js'));
await mkdir(profile, { recursive: true });
const backup = join(home, 'huaxue-install-backups', new Date().toISOString().replace(/[:.]/g, '-'));
const transaction = await beginTransaction(profile, backup);
try {
  manifest.dependencies ??= {};
  delete manifest.dependencies['dsh-local-workbenches'];
  manifest.dsh ??= {}; manifest.dsh.profile ??= {};
  manifest.dsh.profile.bundles = [...new Set([...(manifest.dsh.profile.bundles || ['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app']).filter(name=>!legacy.has(name)), 'dsh-huaxue-workbench'])];
  await writeFile(manifestPath, JSON.stringify(manifest,null,2)+'\n');
  await writeFile(patchPath, yaml.stringify(migrated));
  const pnpm = join(report.app,'node_modules/pnpm/bin/pnpm.cjs');
  const result = spawnSync(process.execPath, [pnpm, '--dir', profile, 'add', `file:${root}`, '--ignore-scripts', '--config.auto-install-peers=false'], { stdio: 'inherit', env: {...process.env, DSH_HOME: home} });
  if (result.status !== 0) throw Error(`包安装失败 (${result.status ?? result.error?.message})`);
  const dump = spawnSync(process.execPath, [join(report.app,'node_modules/@deepseek-ai/dsh/lib/bin.js'),'--profile','web','--dump-config'], {encoding:'utf8',env:{...process.env,DSH_HOME:home}});
  if(dump.status !== 0 || !dump.stdout.includes('dsh-huaxue-workbench')) throw Error('插件组合配置未通过验证');
  transaction.status = 'installed';
  await writeFile(join(backup, 'backup.json'), JSON.stringify(transaction, null, 2));
  console.log(`安装和配置检查通过。备份：${backup}。重新启动 DSH 后进入「花少2 · 花学工作台」。`);
} catch(e) {
  await restoreTransaction(backup);
  console.error(`失败，安装前配置与依赖目录已恢复。备份：${backup}`);
  throw e;
}
