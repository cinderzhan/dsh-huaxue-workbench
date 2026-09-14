import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
test('native settings adapter unwraps RemoteResult and preserves Host refusal', async () => {
  let factory, api;
  vm.runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), { window: { __ModuleLoader__: { load: entry => { factory = entry.factory; } } } });
  const plugin = factory(() => ({ createElement: (_component, props) => props }));
  plugin.apply({
    inject(dependencies, fn) { fn(this); },
    effect(fn) { if (fn.name !== 'installStyles') fn(); },
    workbenches: { protocolVersion: 1, register(entry) { api = entry.Component({}).api; return () => {}; } },
    remote: { settings: { describe: async () => ({ ok: true, value: { namespaces: [] } }), mutate: async () => ({ ok: false, error: { message: 'Revision conflict' } }) } }
  });
  assert.equal((await api.describe()).namespaces.length, 0);
  await assert.rejects(api.mutate('huaxue-workbench', [], 0), /Revision conflict/);
});
