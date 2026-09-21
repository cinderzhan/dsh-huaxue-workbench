import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createDesktopBridge } from '../src/desktop-bridge.js';

function setup() {
  let active = true, current = 'parent', count = 0;
  const calls = [];
  const state = { active: 'huaxue', added: ['huaxue'], sessionBindings: { parent: 'huaxue' }, recentSessions: { huaxue: 'parent' } };
  const session = { prompt: async () => { calls.push('prompt'); return { ok: true }; }, cancel: async () => { calls.push('cancel'); }, open: async () => {} };
  const ctx = {
    sessions: { list: { getSnapshot: () => ({ current }) }, binding: () => ({ session }) },
    workspaces: { list: { getSnapshot: () => ({ items: [{ workspaceId: 'work' }] }) } },
  };
  const service = { getSnapshot: () => ({ state }),
    newSession: async workspaceId => { const id = `new-${++count}`; state.sessionBindings[id] = 'huaxue'; state.recentSessions.huaxue = id; current = id; calls.push(`newSession:${workspaceId}`); return id; },
    open: async (owner, id) => { current = id; calls.push(`open:${owner}:${id}`); },
  };
  const bridge = createDesktopBridge(ctx, service, () => active);
  return { ctx, service, bridge, calls, state, hide: () => { active = false; }, navigate: () => { current = 'ordinary'; } };
}
test('foreground creation delegates ownership and navigation to the public provider API', async () => {
  const t = setup();
  const id = await t.bridge.workbenches.create({ workbenchId: 'huaxue', workspaceId: 'work', initialize: async id => {
    assert.equal(t.state.sessionBindings[id], 'huaxue'); t.calls.push('initialize');
  } });
  assert.equal(id, 'new-1');
  assert.deepEqual(t.calls, ['newSession:work', 'initialize']);
  await assert.rejects(t.bridge.workbenches.create({ workbenchId: 'huaxue', workspaceId: '' }), /工作区/);
});
test('background game uses public creation then restores the parent session', async () => {
  const t = setup();
  const id = await t.bridge.workbenches.create({ workbenchId: 'huaxue', workspaceId: 'work', background: true });
  assert.equal(t.state.sessionBindings[id], 'huaxue');
  assert.deepEqual(t.calls, ['newSession:work', 'open:huaxue:parent']);
  await t.bridge.sessions.binding(id).session.prompt([]);
  assert.equal(t.calls.at(-1), 'prompt');
});
test('cached bindings cannot send when hidden, uninstalled or foreign', async () => {
  for (const change of [t => t.hide(), t => { t.state.added = []; }, t => { t.state.sessionBindings.parent = 'other'; }]) {
    const t = setup(), session = t.bridge.sessions.binding('parent').session;
    change(t);
    assert.throws(() => session.prompt([]));
    assert.throws(() => session.cancel());
    assert.deepEqual(t.calls, []);
  }
});
test('public creation failure cannot initialize or send', async () => {
  const t = setup(); t.service.newSession = async () => { throw Error('conflict'); };
  await assert.rejects(t.bridge.workbenches.create({ workbenchId: 'huaxue', workspaceId: 'work', initialize: () => t.calls.push('initialize') }), /conflict/);
  assert.deepEqual(t.calls, []);
});
test('Desktop generated entry registers standard customFrame only and omits legacy host/body portals', async () => {
  const code = await readFile(new URL('../desktop-client.js', import.meta.url), 'utf8');
  assert.ok(!code.includes('document.body'));
  assert.ok(!code.includes('captureHost'));
  assert.ok(!code.includes('function NativeWorkbench'));
  let definition;
  vm.runInNewContext(code, { window: { __ModuleLoader__: { load: value => { definition = value; } } } });
  const effects = [], registrations = [];
  const React = { createElement() {} };
  const plugin = definition.factory(name => name === 'react' ? React : {});
  assert.ok(plugin.inject.includes('desktopWorkbenches'));
  assert.ok(!plugin.inject.includes('workbenches'));
  plugin.apply({ desktopWorkbenches: { register: (...args) => { registrations.push(args); return () => {}; } }, remote: {}, effect: effect => effects.push(effect) });
  effects.at(-1)();
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0][0].id, 'huaxue');
  assert.equal(registrations[0][0].customFrame, true);
});

test('Desktop shell preserves the original people-first experience and styles native session controls', async () => {
  const source = await readFile(new URL('../src/desktop-client.js', import.meta.url), 'utf8');
  const bridge = await readFile(new URL('../src/desktop-bridge.js', import.meta.url), 'utf8');
  assert.match(source, /今天，你想和哪位花学老师“创飞”所有人？/);
  assert.match(source, /business\.members\.map/);
  assert.match(source, /business\.GameExperience/);
  assert.match(source, /gameContext\.current = \{ parentSessionId: sid, selected \}/);
  assert.match(source, /current === 'game' \? current : null/);
  assert.match(source, /parentSessionId: gameContext\.current\.parentSessionId/);
  assert.doesNotMatch(source, /setDialog\(null\); \}, \[active, sessions\.current\]\)/);
  assert.match(source, /business\.WorkbenchDialog/);
  assert.match(source, /className: 'hx-desktop-sessionbar'/);
  assert.match(source, /hx-picker-people/);
  assert.match(source, /新建工作区并开始对话/);
  assert.match(source, /工作台首页/);
  assert.match(source, /service\.home\('huaxue'\)/);
  assert.doesNotMatch(source, /document\.body/);
  assert.match(bridge, /service\.newSession/);
  assert.match(bridge, /service\.open/);
  assert.doesNotMatch(bridge, /service\.(?:commit|navigation|catalog|blocked|disposed)/);
});
