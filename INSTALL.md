# 安装花学工作台

本页对应 **0.3.0-rc.1 独立插件候选版**。这不是 `huashao2` 模式：**无需复制、创建或选择 `huashao2` 预设**，普通聊天和游戏均使用 `standard` 会话，通过工作台绑定加载角色规则。

## 适用版本

- DSH Desktop **0.9.0**，随包 Harness **0.1.5-rc.2**。
- 完整 UI 实机验收平台和剩余边界以 [VALIDATION.md](VALIDATION.md) 为准。
- 0.8.2 的宿主补丁不能用于此版本；未来版本未验证前不应宣称兼容。

## 安装前检查

从 GitHub 仓库的 **Code → Download ZIP** 下载，解压到长期保留的目录。在包含本页、package.json 和 scripts 的仓库根目录打开 PowerShell。使用 Node.js 24；也可以使用 Desktop 自带的 Node。把下面的安装路径换成本机实际位置，不要照抄他人的用户名或盘符。

```powershell
$app = 'D:/你的安装目录/DSH Desktop/resources/app'
$harness = Join-Path $env:APPDATA 'dsh-desktop/harness'
$node = Join-Path $app 'node_modules/node/bin/node.exe'
& $node scripts/doctor.mjs --app "$app"
& $node scripts/install.mjs --app "$app" --home "$harness"
```

第二条安装脚本默认仅预检。版本不匹配时停止，不修改 profile。它需要 Desktop 内已有的 pnpm 和 YAML 库。

## 执行安装或迁移

完全退出 DSH 和 Harness，再执行：

```powershell
& $node scripts/install.mjs --app "$app" --home "$harness" --apply
```

脚本先在 `<Harness>/huaxue-install-backups/<时间戳>` 保存 profile 配置和原依赖目录，再安装单个 `dsh-huaxue-workbench` 包。它保留其他插件声明、模型设置、会话与文件；迁移时移除 profile 中旧的双插件声明和重复 Cordis 插入项。重新安装其他依赖可能需要联网；若其中的本地插件路径失效，安装会失败并回退。不要在安装后立即删除或移动下载目录，当前 `file:` 包来源仍用于包管理器后续操作。不要同时运行两个安装器。

仓库旧 `outputs/`、`work/` 目录仅为历史归档，不是本版本的安装入口；不要运行旧补丁安装脚本。

**曾安装 0.8.2/0.9.0 本机补丁的用户**：需要先恢复与当前 Desktop 版本严格匹配的原生文件，或使用同版本官方安装包恢复程序文件。安装脚本不会猜测或覆盖宿主文件；不得把 0.8.2 的备份覆盖到 0.9.0。没有旧补丁的新用户不需要此步骤。

## 启动验收

重启 DSH 后：

1. 点击侧栏“花少2 · 花学工作台”，确认七人选择页。
2. 选择工作区和旅伴，确认原生聊天输入框可用。
3. 配置自己的 DSH 模型，发送测试消息；切换旅伴后再发一条。
4. 打开“第八位嘉宾”，选择情境并发送一句接话。
5. 重启后从“花学历史会话”打开记录，确认角色、游戏记录和聊天仍在。

安装脚本退出成功只表示安装和组合配置通过，不代替模型与界面的实测。

## 常见问题

| 现象 | 检查内容 |
|---|---|
| 没有入口 | 当前 web profile 是否启用本插件，Harness 是否完整重启 |
| 七人页面打开但无法对话 | 是否已选工作区、配置可用模型，原生标准聊天是否能回复 |
| 游戏不能启动 | 查看页面具体错误；检查工作台会话绑定、游戏状态保存与模型可用性；无需安装额外预设 |
| 升级后界面异常 | 先运行 doctor 核对 Desktop 与 Harness 版本，不套用旧补丁 |
| 旧预设仍出现在 DSH | 是旧安装留下的数据，本版本不再创建或选择它；不自动删除，以免影响旧会话 |

## 卸载与回退

从 DSH 插件管理移除本插件，或使用 `dsh plugin --profile web remove dsh-huaxue-workbench`。卸载不删除会话、工作区文件与设置命名空间。

安装失败时脚本恢复安装前配置和整个原依赖目录，安装过程中产生的文件保留在备份的 replaced 子目录。成功安装后如需回退，完全退出 DSH，再执行：

```powershell
& $node scripts/restore.mjs '<安装时输出的完整备份目录>'
```

按时间倒序回退，不要跳过较新的安装；备份只能用于其记录的本机 profile。不要移动、编辑或删除备份后再尝试恢复。磁盘损坏、断电或权限错误导致自动恢复失败时，保留备份并排查，不要删除整个 Harness 数据目录。

## 给 Agent 的安装要求

读取本页和 VALIDATION.md，核对当前 Desktop/Harness 版本；先预检、备份，再退出应用安装。只使用本包，不创建 huashao2 预设、不修改宿主源码、不索取密钥。安装后验证入口、工作区、角色聊天、切人、游戏与重启；逐项报告已验证和未验证部分。
