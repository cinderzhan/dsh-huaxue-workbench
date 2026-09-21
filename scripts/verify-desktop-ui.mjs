import { createRequire } from 'node:module';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const app = process.argv[2];
if (!app) throw Error('Usage: node scripts/verify-desktop-ui.mjs <Desktop repository>');
const require = createRequire(resolve(app, 'package.json'));
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLDialogElement.prototype.show = function () { this.setAttribute('open', ''); };
const browser = { window: dom.window, document: dom.window.document, MutationObserver: dom.window.MutationObserver,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), setTimeout, clearTimeout, AbortController };
function load(code) {
  let definition;
  dom.window.__ModuleLoader__ = { load: d => { definition = d; } };
  vm.runInNewContext(code, browser);
  return definition.factory(name => name === 'react' ? React : name === 'react-dom' ? require(name)
    : name === '@deepseek-ai/dsh-client-ui-primitives' ? new Proxy({}, { get: () => () => React.createElement('span') }) : {});
}
const { Workbenches } = load(await readFile(resolve(app, 'packages/dsh-desktop-workbenches/client.js'), 'utf8'));
const { createStateStore } = await import(pathToFileURL(resolve(app, 'packages/dsh-desktop-workbenches/state.mjs')));
const temp = await mkdtemp(join(tmpdir(), 'huaxue-ui-'));
const store = createStateStore(temp);
const observable = initial => {
  let snapshot = initial; const listeners = new Set();
  return { getSnapshot: () => snapshot, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    set(value) { snapshot = value; for (const fn of listeners) fn(); } };
};
const list = observable({ current: undefined, byId: {} });
const spaces = observable({ items: [] });
let sequence = 0, navigation, panel, path = null;
const rows = { ns: 'huaxue-workbench', revision: 0, value: { lastMemberId: 'ning', sessions: {}, skin: {} } };
const settingsListeners = new Set();
const ctx = {
  sessions: { list, refresh: async () => {}, create: async ({ workspaceId }) => {
    const id = `session-${++sequence}`;
    list.set({ ...list.getSnapshot(), byId: { ...list.getSnapshot().byId, [id]: { id, blank: true } } });
    spaces.set({ items: spaces.getSnapshot().items.map(w => w.workspaceId === workspaceId ? { ...w, sessionIds: [...w.sessionIds, id] } : w) });
    return id;
  }, open: id => list.set({ ...list.getSnapshot(), current: id }), clear: () => list.set({ ...list.getSnapshot(), current: undefined }), binding: () => null },
  workspaces: { list: spaces, create: async ({ path }) => {
    const item = { workspaceId: 'work', path, title: '测试工作区', sessionIds: [] };
    spaces.set({ items: [item] }); return item;
  } },
  uiWorkspace: { pickDirectory: async () => path },
  layout: { beginNavigation: () => { navigation?.abort(); navigation = new AbortController(); return navigation.signal; }, selectPanel: value => { panel = value; } },
  remote: { settings: {
    describe: async () => ({ ok: true, value: { namespaces: [structuredClone(rows)] } }),
    mutate: async (ns, ops, revision) => {
      if (revision !== rows.revision) return { ok: false, error: { message: 'revision conflict' } };
      for (const op of ops) { let target = rows.value; for (const key of op.path.slice(0, -1)) target = target[key] ??= {}; target[op.path.at(-1)] = op.value; }
      rows.revision++; for (const listener of settingsListeners) listener(rows.ns);
      return { ok: true, value: structuredClone(rows) };
    },
  }, $on: (event, listener) => { settingsListeners.add(listener); return () => settingsListeners.delete(listener); } },
};
const service = new Workbenches(ctx, async (url, options) => {
  if (url.endsWith('submissions')) return { ok: true, json: async () => ({ submissions: [] }) };
  try { const data = options?.method === 'POST' ? await store.write(JSON.parse(options.body)) : await store.read(); return { ok: true, json: async () => data }; }
  catch (e) { return { ok: false, status: e.status, json: async () => ({ error: e.message }) }; }
});
ctx.desktopWorkbenches = service;
list.subscribe(() => service.selectionChanged());
const disposers = [];
ctx.effect = fn => { const dispose = fn(); if (dispose) disposers.push(dispose); };
const root = createRoot(document.getElementById('root'));
const flush = async fn => act(async () => { await fn?.(); await new Promise(r => setTimeout(r, 15)); });
const button = text => [...document.querySelectorAll('button')].find(node => node.textContent.includes(text));
const click = text => flush(() => { const node = button(text); assert.ok(node, text); node.click(); });
let mounted = false;
try {
  load(await readFile(new URL('../desktop-client.js', import.meta.url), 'utf8')).apply(ctx);
  await service.load(); await service.add('huaxue'); await service.open('huaxue');
  const Component = service.catalog.get('huaxue').Component;
  const render = active => root.render(React.createElement(Component, { service, entry: service.catalog.get('huaxue'), active,
    conversation: active ? React.createElement('textarea', { 'data-native-input': true, defaultValue: '用户原生草稿' }) : null }));
  await flush(() => render(true)); mounted = true;
  assert.equal(document.querySelectorAll('[data-native-input]').length, 1);
  await click('毛毛姐');
  assert.equal(sequence, 0, 'canceling the folder picker creates no workspace/session');
  assert.equal(rows.value.lastMemberId, 'mao');
  path = '/isolated-test-workspace';
  await click('毛毛姐');
  assert.equal(sequence, 1);
  assert.equal(rows.value.sessions['session-1'].activeMemberId, 'mao');
  assert.equal((await store.read()).state.sessionBindings['session-1'], 'huaxue');
  assert.equal(list.getSnapshot().current, 'session-1');
  await click('晴公主');
  assert.equal(sequence, 1, 'switching a companion preserves its session');
  assert.equal(rows.value.sessions['session-1'].activeMemberId, 'qing');
  assert.equal(document.querySelector('[data-native-input]').value, '用户原生草稿');
  await click('自定义背景');
  assert.ok(document.querySelector('.hx-desktop .hx-skin-dialog[open]'));
  await flush(() => document.querySelector('.hx-skin-dialog button[title="关闭"]').click());
  await click('进入游戏');
  assert.ok(document.querySelector('.hx-desktop .hx-play[open]'));
  await click('返回工作台');
  const ordinary = await flush(async () => {
    const id = await ctx.sessions.create({ workspaceId: 'work' }); ctx.sessions.open(id); return id;
  });
  assert.equal(service.state.active, 'huaxue', 'ordinary native navigation retains business');
  assert.equal((await store.read()).state.sessionBindings['session-2'], undefined);
  await click('毛毛姐');
  assert.equal(sequence, 3, 'choosing a role with selected workspace initializes a new owned session');
  assert.equal(rows.value.sessions['session-3'].activeMemberId, 'mao');
  assert.equal((await store.read()).state.sessionBindings['session-2'], undefined);
  const before = list.getSnapshot().current;
  await flush(() => render(false));
  assert.ok(document.querySelector('.hx-desktop').hidden);
  assert.equal(list.getSnapshot().current, before);
  assert.equal(document.querySelectorAll('body > dialog').length, 0);
  console.log('PASS real React DOM + Desktop controller + disk state: empty first entry, role selection, folder cancellation/creation, initialization, switching, native draft, scoped skin/game, ordinary session and hidden panel');
} finally {
  if (mounted) await flush(() => root.unmount());
  for (const dispose of disposers.reverse()) dispose();
  service.dispose(); dom.window.close();
  await rm(temp, { recursive: true, force: true });
}
