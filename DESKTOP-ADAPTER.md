# 花学 Desktop adapter · 0.3.6-desktop.1

包名 `dsh-huaxue-workbench`，工作台 ID `huaxue`。本次仅修改花学仓库；Desktop 依赖、lockfile、vendor catalog 和运行中实例由主 Agent 集成。本仓库提供可供本机市场加载的 provider，不等于已在运行中 Desktop 安装或获得公开市场收录。

## 入口与集成

- 默认服务端：包根导出 `desktop.js`，inject 为 `settings`、`systemPrompt`、`desktopWorkbenchOwnership`。
- 默认客户端：`dsh-huaxue-workbench/client` → `desktop-client.js`，依赖 `dsh-desktop-workbenches`；仅标准 `desktopWorkbenches.register`、`customFrame`，接收原生 `conversation`。
- 包描述：`workbench.json`，schemaVersion 1，desktopWorkbenches `^0.1.0`；额外要求 `requiredServices: ["desktopWorkbenchOwnership.read"]`。
- 原独立入口保留：`dsh-huaxue-workbench/standalone` → `index.js`，`dsh-huaxue-workbench/standalone/client` → `client.js`。独立部署需要自行选择这两个入口和对应旧宿主依赖；本 Desktop 版本的默认 metadata 不适用于旧独立部署。旧安装脚本会在写入前拒绝，避免把 Desktop 默认包误装入旧宿主。
- Desktop server seam：`await ctx.desktopWorkbenchOwnership.read()` 返回 `{ revision, sessionBindings, added }`。宿主从同一真实 state store 读取；插件不创建第二份 owner/installed 状态，不加载 `src/host.js`。

构建：`npm run build` 同时生成 Desktop 和 standalone 客户端。默认 `npm pack` 执行 build/check/test。不要把 `client.js`（旧独立宿主）当成 Desktop 加载入口。

## 审计整改

| 原问题 | 整改 |
| --- | --- |
| 自带宿主、公共导航与旧工作台注册 | Desktop 构建不拼接 host-client；仅注册 huaxue provider，不注入公共导航 |
| 旧 settings owner/installed 与 Desktop 不一致 | 每次真实 SystemPrompt 组装读取宿主原子快照；只允许 owner=huaxue 且 added 含 huaxue；未绑定旧 preset 也不能绕过 |
| 切换人物影响当前回复 | 保留按 session/turn 缓存，下一轮使用新角色；当前轮及历史归属不改写 |
| 创建后首条消息抢在角色保存之前 | 原生创建 → Desktop controller.commit 持久化归属 → 保存角色 → Desktop controller.open；初始化失败不自动打开 |
| 创建途中切换或卸载 | 捕获 controller.navigation 与当前会话；过期完成保留数据、不夺回焦点；不删除失败/取消途中已创建的会话 |
| 隐藏面板或跨归属游戏发送 | bridge 在异步边界和 prompt/cancel 调用前重新检查前台状态、导航与归属；普通会话不被自动认领 |
| 游戏后台会话劫持最近会话、自动归档 | 独立持久化游戏归属，保留 parent recent，不自动打开、不自动归档；关闭游戏不执行原生会话跳转 |
| body portal / 全屏弹层覆盖侧栏 | Desktop 构建剔除旧 NativeWorkbench/body portal；游戏与背景编辑器在 provider 容器内用普通 dialog.show；根容器 position/contain/overflow 限制范围 |
| 游戏阶段结果字段未在 Settings schema 声明 | 补全 outcome、direction、turnCount，并加校验，真实 Settings 测试验证可保存 |

客户端兼容桥只使用 `desktopWorkbenches` 的公开 `newSession`、`newWorkspaceSession`、`open` 和快照接口，不再读取或调用 `commit`、`navigation`、`catalog` 等宿主内部字段。游戏子会话通过公开会话创建接口登记归属，再恢复父会话；不会自行写入 Desktop state 文件。

## 界面和业务流程

本版本以用户提供的 `huaxue-source-review.zip` 原始 `0.2.0` 产物为业务真相：角色与场景 JSON 校验和保持一致，继续复用原始人物、场景、游戏、阶段结果和背景编辑实现。Desktop 仅替换宿主、会话归属和外层布局，不把花学重写成通用表单。

相较上一版，Desktop 外壳补齐了与宿主一致的会话工具栏、工作区选择与创建按钮样式，恢复原工作台以人物和场景为中心的视觉层级；角色选择从描边表单改为原始头像式网格，窄窗口按内容重排。所有弹层仍限制在宿主分配区域内。

保留七位角色、开场文本、角色切换、花学分析/思考归属装饰、原完整第八位嘉宾场景/续演/回看/结束流程、背景上传/浓度/位置/铺满或适应/移除/实时预览。

必要布局调整：未绑定时使用原角色选择卡片和文案，旁边保留 Desktop 原生会话与工作区创建入口；绑定后角色区放在右侧，原生会话在左侧。窄窗口上下排列。背景及游戏原编辑器/场景组件直接复用，弹层范围改为宿主主内容区。并非删除原业务能力，但不是原 standalone 全屏首页的逐像素复刻。

选择角色：已有花学会话时仅切换该会话角色；无所属会话且已选工作区时，选择角色直接初始化新的花学会话；零工作区时允许先选角色，选择/新建目录后以该角色创建会话。取消目录选择不创建。通过原生侧栏新建普通会话后仍显示其原生输入，角色面板保留；点击角色且已选工作区才显式创建新的花学会话，不把普通会话绑定到花学。

开场文本仅展示，不覆盖草稿也不自动提交；游戏只有用户明确发送才调用模型。业务选择存入原花学 Settings；工作区选择、游戏未发送输入及背景编辑草稿存入 provider 级内存，可跨市场卸载/重挂载保留（整页刷新后未保存的草稿不保证恢复）。已有会话优先使用自己的角色映射。游戏草稿按 parent session 分隔。

## 验证

在花学仓库执行：

```sh
npm run build
npm run check
npm test
node scripts/verify-desktop-runtime.mjs /path/to/dsh-desktop-integrated
node scripts/verify-desktop-ui.mjs /path/to/dsh-desktop-integrated
node /path/to/dsh-desktop-integrated/scripts/check-workbench-package.mjs .
npm pack
```

`verify-desktop-runtime.mjs` 使用真实 Cordis、Settings、SystemPrompt、assembleContextFor、Desktop server apply 与磁盘 state store。仅 HTTP 路由注册是无请求的替身。验证依赖注入、无独立归属 namespace、旧 preset 越权拒绝、角色轮次缓存、游戏提示词和结果持久化、移除/重加及损坏状态失败。临时目录由测试独立创建和清理。

`verify-desktop-ui.mjs` 使用真实 React/ReactDOM、Desktop Workbenches controller 和磁盘 state store；原生会话/目录选择/设置 RPC 用测试替身，图标为占位组件。覆盖零工作区先选角色、取消目录、新建、归属保存、选择角色直接初始化、角色切换、原生草稿未替换、普通会话不认领、背景/游戏组件挂载、隐藏面板及无 body 弹层。它不是 Electron/Chromium 布局验收；主 Agent 的隔离真实 Harness + Chromium 市场 smoke 仍需完成。

## 剩余边界

- 不重启现有 Electron，不触碰现有 DSH_HOME、凭据或会话，不执行模型请求；真实 OS 目录选择、实际模型续演与视觉截图验收尚需主 Agent/用户完成。
- standalone 历史会话不自动迁移归属；未登记 Desktop 归属的历史记录不能获得花学提示词或游戏发送能力。
- 创建或初始化失败可能留下已创建会话以便恢复，不自动删除用户数据。
- 本包包含既有角色/节目相关资源，沿用 `UNLICENSED` 与 `RIGHTS.md`，没有授予公开分发或开源授权。
