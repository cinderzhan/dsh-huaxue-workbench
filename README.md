# 花少2 · 花学工作台

独立 DSH 工作台，提供七位旅伴的角色聊天、同一会话切人和“第八位嘉宾”情境续演。

**0.3.0-rc.1 为独立插件候选版，目标版本为 DSH Desktop 0.9.0 / Harness 0.1.5-rc.2。** 不修改 DSH 安装文件，不创建自定义 Agent 预设。普通聊天和游戏都使用宿主 `standard`，通过工作台的会话绑定装配角色规则。旧会话中的 `huashao2` 仅用于兼容读取，不是安装前置条件。

安装见 [INSTALL.md](INSTALL.md)，验证范围见 [VALIDATION.md](VALIDATION.md)。尚未验证的新宿主版本请先运行 doctor，不要自动跳过兼容检查。

## 使用

1. 从侧栏点击 **花少2 · 花学工作台**。
2. 选择工作区和旅伴，进入原生 DSH 聊天。模型由用户在 DSH 中配置，插件不包含密钥。
3. 在右侧选择其他旅伴；游戏入口为“第八位嘉宾”。
4. 再点侧栏入口进入选人页；页面顶部的“花学历史会话”用于打开已有花学会话。原生侧栏保持宿主的默认会话列表，不改写宿主的过滤逻辑。

## 开发

Node.js 24；构建和纯逻辑测试不需要下载 npm 依赖：

```sh
npm run build
npm run check
npm test
npm pack
```

`src/host-client.js` 使用 `main`、`sidebar.footer.action`、`conversation.input.dock`、`shell.overlay` 插槽。选人页由插件拥有，聊天继续使用原生会话页面。角色装饰通过插槽内节点查找语义祖先 `[data-phase]`，仍属于已验证版本的展示适配，不等于未来所有版本无条件兼容。

`src/business-client.js` 保留现有游戏与界面的独立源文件；`client.js` 由构建脚本生成，随仓库与安装包提供。`src/host.js` 和 `src/business.js` 保留原设置命名空间，升级不清空历史记录。原生服务集成验证：`node scripts/verify-runtime.mjs <resources/app>`。

GitHub Actions 已配置 Linux、Windows、macOS 的包级检查；工作流配置本身不代表三种系统的桌面实机已验收。

资源和许可状态见 [RIGHTS.md](RIGHTS.md)。角色为虚构演绎，非本人发言。
