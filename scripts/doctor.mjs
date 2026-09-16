import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function inspectApp(appPath) {
  const app = resolve(appPath);
  const policy = JSON.parse(await readFile(new URL('../compatibility.json', import.meta.url)));
  const desktop = JSON.parse(await readFile(join(app, 'package.json')));
  const harness = JSON.parse(await readFile(join(app, 'node_modules/@deepseek-ai/dsh/package.json')));
  const supported = policy.desktop.includes(desktop.version) && policy.harness.includes(harness.version);
  return { app, desktop: desktop.version, harness: harness.version, supported };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--app');
  if (index < 0 || !process.argv[index + 1]) throw Error('用法：node scripts/doctor.mjs --app <DSH 的 resources/app 目录>');
  const report = await inspectApp(process.argv[index + 1]);
  console.log(JSON.stringify(report, null, 2));
  if (!report.supported) { console.error('该版本尚未验证，停止安装；不修改现有配置。'); process.exitCode = 2; }
}
