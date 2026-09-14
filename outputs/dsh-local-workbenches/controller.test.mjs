import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkbenchController } from './controller.js';
function fixture(saved = {}) {
  let state = { activeId: '', recent: {}, bindings: {}, installed: {}, pinned: [], workspace: {}, ...saved };
  const list = { ids: [], byId: {}, current: undefined, phase: 'ready' };
  const spaces = [{ workspaceId: 'shared', sessionIds: [] }, { workspaceId: 'other', sessionIds: [] }];
  let n = 0;
  const selections = [], initialized = [], stopped = [];
  const runtime = {
    sessions: { list: { getSnapshot: () => list },
      create: async ({ workspaceId }) => { const id = 's' + ++n; list.ids.push(id); list.byId[id] = { id }; spaces.find(w => w.workspaceId === workspaceId).sessionIds.push(id); return id; },
      open: id => { host.onOpen(id); list.current = id; }, clear: () => { list.current = undefined; }, cancel: id => stopped.push(id)
    },
    workspaces: { list: { getSnapshot: () => ({ items: spaces }) } },
    remote: { agentPresets: { select: async (sid, preset) => { selections.push([sid, preset]); return { ok: true }; } } }
  };
  const host = new WorkbenchController(runtime, { read: async () => structuredClone(state), mutate: async ops => { for (const {path, value} of ops) { let obj = state; for (const k of path.slice(0,-1)) obj = obj[k]; obj[path.at(-1)] = structuredClone(value); } return structuredClone(state); } });
  for (const id of ['a','b']) host.register({ id, defaultPreset: 'standard', initialize: async sid => initialized.push([id,sid]) });
  return { host, list, selections, initialized, stopped, runtime };
}
async function installed() { const f = fixture(); await f.host.load(); await f.host.install('a'); await f.host.install('b'); return f; }
test('picker entry always opens initialization while an explicit historical session still opens normally', async () => {
  const {host,list,runtime}=await installed(); host.entries.get('a').entryBehavior='picker';
  await host.enter('a'); const sid=await host.create({workspaceId:'shared'});
  await host.enter('a'); assert.equal(host.snapshot.initializingId,'a'); assert.equal(list.current,undefined);
  assert.equal(host.state.recent.a,sid);
  runtime.sessions.open(sid); await host.queue;
  assert.equal(host.snapshot.initializingId,undefined);assert.equal(list.current,sid);
});
test('late detached refs cannot remove a connected replacement conversation surface', async () => {
  const {host}=await installed();
  const old={isConnected:false,style:{}}, current={isConnected:true,style:{}};
  host.setCenter(old); host.setCenter(current); host.setCenter(null);
  host.setConversationRoot(current); host.setConversationRoot(null);
  await Promise.resolve(); assert.equal(host.center,current); assert.equal(host.root,current);
  current.isConnected=false; host.setCenter(null); host.setConversationRoot(null);
  await Promise.resolve(); assert.equal(host.center,null); assert.equal(host.root,null);
});
test('first entry supports empty initialization or a default workspace session; reentry restores recent', async () => {
  const {host,list}=await installed();
  await host.enter('a'); assert.equal(list.current,undefined);
  host.entries.get('b').firstOpen={mode:'new-session',workspaceId:'other'};
  await host.enter('b'); const sid=list.current;
  assert.equal(host.owner(sid),'b'); assert.equal(host.state.workspace.b,'other');
  await host.enter('a'); await host.enter('b');
  assert.equal(list.current,sid); assert.equal(list.ids.length,1);
});
test('new sessions remain in a workbench, share existing workspaces and initialize before opening', async () => {
  const { host, list, selections, initialized } = await installed();
  await host.enter('a');
  const a1 = await host.create({ workspaceId:'shared' });
  const a2 = await host.create();
  assert.equal(host.owner(a1),'a'); assert.equal(host.owner(a2),'a'); assert.equal(list.current,a2); assert.equal(host.state.activeId,'a');
  assert.deepEqual(selections, [[a1,'standard'],[a2,'standard']]); assert.deepEqual(initialized, [['a',a1],['a',a2]]);
  await host.enter('b'); const b = await host.create({workspaceId:'shared'});
  assert.equal(host.owner(b),'b'); assert.equal(host.owner(a1),'a');
});
test('specific session wins over recent, entry restores recent and switching never cancels tasks', async () => {
  const {host,list,runtime,stopped}=await installed(); await host.enter('a');
  const a1=await host.create({workspaceId:'shared'}), a2=await host.create();
  await host.enter('b'); await host.create({workspaceId:'shared'});
  runtime.sessions.open(a1); await host.queue;
  assert.equal(host.state.activeId,'a'); assert.equal(list.current,a1);
  await host.enter('b'); await host.enter('a'); assert.equal(list.current,a1);
  runtime.sessions.open(a2); await host.queue; await host.restore(); assert.equal(list.current,a2); assert.deepEqual(stopped,[]);
});
test('uninstall preserves mappings, files and sessions; clicking an orphan never reinstalls', async () => {
  const {host,list,runtime}=await installed(); await host.enter('a'); const sid=await host.create({workspaceId:'shared'});
  await host.uninstall('a'); runtime.sessions.open(sid); await host.queue;
  assert.equal(host.state.activeId,''); assert.equal(host.owner(sid),'a'); assert.ok(list.byId[sid]); assert.equal(host.state.installed.a,false);
});
test('legacy unbound sessions are never adopted, and a preset change is not a workbench change', async () => {
  const {host,list,runtime}=await installed(); list.byId.old={id:'old',preset:'huashao2'};
  await host.enter('a'); runtime.sessions.open('old'); await host.queue;
  assert.equal(host.owner('old'),undefined); assert.equal(host.state.activeId,'');
  await host.enter('a'); const sid=await host.create({workspaceId:'shared'}); list.byId[sid].preset='minimal';
  assert.equal(host.owner(sid),'a'); assert.equal(host.state.activeId,'a');
});
test('background session creation does not steal foreground or replace recent', async () => {
  const {host,list}=await installed(); await host.enter('a'); const chat=await host.create({workspaceId:'shared'});
  const game=await host.create({background:true}); assert.equal(host.owner(game),'a'); assert.equal(list.current,chat); assert.equal(host.state.recent.a,chat);
});
test('workbench change during pending create never steals the new foreground', async () => {
  const {host,list}=await installed(); await host.enter('a'); let finish;
  const promise=host.create({workspaceId:'shared',initialize:()=>new Promise(resolve=>{finish=resolve;})});
  while(!finish) await new Promise(resolve=>setImmediate(resolve));
  await host.enter('b'); finish(); const sid=await promise;
  assert.equal(host.owner(sid),'a'); assert.equal(host.state.activeId,'b'); assert.equal(list.current,undefined);
});
test('ordering is durable, business drafts are per workbench, and missing workspace is actionable', async () => {
  const {host}=await installed(); await host.enter('a'); await host.enter('b'); await host.reorder('b','a');
  assert.deepEqual(host.state.pinned,['b','a']);
  host.businessState('a',{}).draft='unsaved'; assert.equal(host.businessState('a',{}).draft,'unsaved'); assert.equal(host.businessState('b',{}).draft,undefined);
  await assert.rejects(host.create({workspaceId:'missing'}), /选择工作区/);
});
test('refresh restores persisted active and recent session, missing recent returns initialization', async () => {
  const {host,list}=fixture({activeId:'a',recent:{a:'saved'},bindings:{saved:'a'},installed:{a:true}});
  list.byId.saved={id:'saved'}; await host.load(); await host.restore(); assert.equal(list.current,'saved');
  delete list.byId.saved; await host.restore(); assert.equal(list.current,undefined); assert.equal(host.state.activeId,'a');
});
