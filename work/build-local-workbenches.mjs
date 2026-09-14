import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = process.env.DSH_DESKTOP_APP;
if (!app) throw Error('Set DSH_DESKTOP_APP to the installed Desktop resources/app directory.');
const output = path.join(project, 'outputs/dsh-local-workbenches');
const patchDir = path.join(project, 'work/workbench-host-patches');
await mkdir(patchDir, { recursive: true });
const controller = (await readFile(path.join(output, 'controller.js'), 'utf8')).replace('export class ', 'class ');
const template = await readFile(path.join(project, 'work/workbench-host-client.template.js'), 'utf8');
await writeFile(path.join(output, 'client.js'), template.replace('__CONTROLLER__', () => controller));
const specs = {
  'dsh-client-ui-sidebar': [
    ['\t\t\t\t\t(0, react_jsx_runtime.jsx)("div", {\n\t\t\t\t\t\tclassName: SidebarRoot_module_css_default.regionArea,', '\t\t\t\t\trenderSlot("sidebar.workbenches", { wide }),\n\t\t\t\t\t(0, react_jsx_runtime.jsx)("div", {\n\t\t\t\t\t\tclassName: SidebarRoot_module_css_default.regionArea,'],
    ['"sidebar.workspaces": {', '"sidebar.workbenches": { kind: "single", scope: "root" },\n\t\t\t\t\t"sidebar.workspaces": {']
  ],
  'dsh-api-session-controller': [
    ['open(id) {\n\t\t\t\tthis.manager.select(id);', 'open(id) {\n\t\t\t\tthis.rootCtx.get("workbenches")?.onOpen(id);\n\t\t\t\tthis.manager.select(id);']
  ],
  'dsh-client-ui-workspace': [
    ['(!session.blank || session.id === current)', '(!session.blank || session.id === current || session.workbenchId)'],
    ['startSession(workspaceId) {\n', 'startSession(workspaceId) {\n\t\t\t\tconst workbenchHost = this.ctx.get("workbenches");\n\t\t\t\tif (workbenchHost?.getSnapshot().activeId) { workbenchHost.newSession(workspaceId); return; }\n'],
    ['function WorkspaceBrowser({ wide,', 'function WorkspaceBrowser({ workbenchHost, wide,'],
    ['const home = useHostInfo((info) => info.home);', 'const home = useHostInfo((info) => info.home);\n\t\t\tconst workbenchState = (0, react.useSyncExternalStore)(workbenchHost?.subscribe || (() => () => {}), workbenchHost?.getSnapshot || (() => null));\n\t\t\tconst completeList = useSessions(s => s);\n\t\t\tconst visibleList = (0, react.useMemo)(() => {\n\t\t\t\tif (!workbenchState?.ready) return completeList;\n\t\t\t\tconst active = workbenchState.activeId;\n\t\t\t\tconst ids = completeList.ids.filter(id => active ? workbenchState.bindings[id] === active : !workbenchState.bindings[id] || !workbenchState.installed[workbenchState.bindings[id]]);\n\t\t\t\treturn { ...completeList, ids, byId: Object.fromEntries(ids.map(id => [id, { ...completeList.byId[id], workbenchId: workbenchState.bindings[id] }])) };\n\t\t\t}, [completeList, workbenchState]);\n\t\t\tuseSessions = selector => selector(visibleList);'],
    ['const browserInjected = () => ({', 'const browserInjected = () => ({\n\t\t\t\tworkbenchHost: { subscribe: fn => ctx.on("workbenches/change", fn), getSnapshot: () => ctx.get("workbenches")?.getSnapshot() ?? null },']
  ],
  'dsh-client-ui-layout': [
    ['className: AppFrame_module_css_default.centerCol,', 'className: AppFrame_module_css_default.centerCol,\n\t\t\t\t"data-dsh-workbench-center": "",\n\t\t\t\tstyle: { position: "relative" },\n\t\t\t\tref: props.bindWorkbenchCenter,'],
    ['function AppFrame({ useStore,', 'function AppFrame({ bindWorkbenchCenter, useStore,'],
    ['(CenterColumn, { children: renderSlot("conversation", {}) })', '(CenterColumn, { bindWorkbenchCenter, children: renderSlot("conversation", {}) })'],
    ['layout.attachPanels(actions);\n\t\t\t\t\t\treturn {};', 'layout.attachPanels(actions);\n\t\t\t\t\t\treturn { bindWorkbenchCenter: node => ctx.get("workbenches")?.setCenter(node) };']
  ],
  'dsh-client-ui-conversation': [
    ['function ConversationRoot({ sessionId,', 'function ConversationRoot({ bindWorkbenchRoot, sessionId,'],
    ['rootEl.current = root;\n\t\t\t\tif (root === null)', 'rootEl.current = root;\n\t\t\t\tbindWorkbenchRoot?.(root);\n\t\t\t\tif (root === null)'],
    ['hooks: { composerBlock: sessionId === void 0 ? ABSENT_BLOCK : composerBlocks.storeFor(sessionId) },', 'bindWorkbenchRoot: node => ctx.get("workbenches")?.setConversationRoot(node),\n\t\t\t\t\thooks: { composerBlock: sessionId === void 0 ? ABSENT_BLOCK : composerBlocks.storeFor(sessionId) },']
  ],
  'dsh-client-ui-agent-preset': [
    ['presets.filter((preset) => preset.broken === void 0)', 'presets.filter((preset) => preset.broken === void 0 && preset.id !== "huashao2")']
  ]
};
let previous = { records: [] };
try { previous = JSON.parse(await readFile(path.join(patchDir, 'manifest.json'), 'utf8')); } catch {}
const records = [];
for (const [pkg, replacements] of Object.entries(specs)) {
  const installed = path.join(app, 'node_modules/@deepseek-ai', pkg, 'lib/client.js');
  let original;
  try { original = await readFile(path.join(patchDir, pkg + '.original.js'), 'utf8'); }
  catch { original = await readFile(installed, 'utf8'); await writeFile(path.join(patchDir, pkg + '.original.js'), original, { flag: 'wx' }); }
  let changed = original.replaceAll('\r\n', '\n');
  for (const [needle, replacement] of replacements) {
    if (changed.split(needle).length !== 2) throw Error('Host anchor must occur once: ' + pkg + ' ' + needle.slice(0, 80));
    changed = changed.replace(needle, replacement);
  }
  await writeFile(path.join(patchDir, pkg + '.patched.js'), changed);
  const prior = previous.records.find(r => r.pkg === pkg);
  records.push({ pkg, installed, acceptedSha256: [...new Set([...(prior?.acceptedSha256 || []), ...(prior ? [prior.patchedSha256] : [])])], originalSha256: createHash('sha256').update(original).digest('hex'), patchedSha256: createHash('sha256').update(changed).digest('hex') });
}
await writeFile(path.join(patchDir, 'manifest.json'), JSON.stringify({ desktop: JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8')).version, records }, null, 2));
console.log('Built local workbench service and ' + records.length + ' checked host patches. Installed files have not been changed.');
