import { restoreTransaction } from './transaction.mjs';
const backup = process.argv[2];
if (!backup) throw Error('完全退出 DSH 后运行：node scripts/restore.mjs <安装时输出的备份目录>');
await restoreTransaction(backup);
console.log('安装前的配置与依赖目录已恢复；会话和模型设置未改动。现在可以重启 DSH。');
