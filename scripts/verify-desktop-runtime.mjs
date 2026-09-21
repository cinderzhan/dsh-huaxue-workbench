import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const app = process.argv[2];
if (!app) throw Error('Usage: node scripts/verify-desktop-runtime.mjs <Desktop repository>');
const installed = pathToFileURL(resolve(app, 'package.json')).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@deepseek-ai/') || specifier === 'yaml') return nextResolve(specifier, { ...context, parentURL: installed });
  return nextResolve(specifier, context);
} });
const { Context } = await import('@deepseek-ai/cordis');
const { default: Settings } = await import('@deepseek-ai/dsh-settings');
const { default: SystemPrompt, renderPrompt } = await import('@deepseek-ai/dsh-system-prompt');
const { assembleContextFor } = await import('@deepseek-ai/dsh-agent');
const host = await import(pathToFileURL(resolve(app, 'packages/dsh-desktop-workbenches/index.js')));
const { createStateStore, emptyState } = await import(pathToFileURL(resolve(app, 'packages/dsh-desktop-workbenches/state.mjs')));
const plugin = await import('../desktop.js');
const { NAMESPACE, selectionOps } = await import('../src/core.js');
class MemorySettings extends Settings {
  writable = true;
  async load() { return {}; }
  async persist(value) { return value; }
}
const root = await mkdtemp(join(tmpdir(), 'huaxue-desktop-runtime-'));
const ctx = new Context();
try {
  await ctx.plugin(MemorySettings);
  await ctx.plugin(SystemPrompt, { personaPrefix: 'BASE PERSONA' });
  // Only the unused HTTP router is a test double. Host apply, ownership store,
  // Cordis dependencies, Settings schemas and SystemPrompt are real.
  ctx.reflect.provide('connection', { fetch: { register() {} } });
  await ctx.plugin(host, { root });
  assert.equal(typeof ctx.desktopWorkbenchOwnership?.read, 'function');
  await ctx.plugin(plugin);
  assert.ok(ctx.settings.describe().some(row => row.ns === NAMESPACE), 'Desktop inject activated business settings');
  assert.ok(!ctx.settings.describe().some(row => row.ns === 'dsh-workbenches'), 'standalone ownership namespace must not exist');
  const store = createStateStore(root);
  const state = { ...emptyState(), added: ['huaxue', 'other'], sessionBindings: { owned: 'huaxue', foreign: 'other', game: 'huaxue' } };
  await store.write({ revision: 0, state });
  const events = [{ type: 'turn/start', data: { turn: 1 } }];
  const agent = id => ({ session: { id, header: { agentPreset: 'huashao2' }, snapshotEvents: () => [...events] } });
  const owned = agent('owned');
  const assemble = a => ctx.systemPrompt.assemble(assembleContextFor(a));
  const text = async a => renderPrompt(await assemble(a));
  assert.ok((await text(owned)).includes('[huaxue:dialogue-v2.5:ning]'));
  assert.ok(!(await text(agent('ordinary'))).includes('[huaxue:'));
  assert.ok(!(await text(agent('foreign'))).includes('[huaxue:'));
  await ctx.settings.mutate(NAMESPACE, selectionOps('owned', 'qing'));
  assert.ok((await text(owned)).includes('[huaxue:dialogue-v2.5:ning]'));
  events.push({ type: 'turn/start', data: { turn: 2 } });
  assert.ok((await text(owned)).includes('[huaxue:dialogue-v2.5:qing]'));
  const prompt = await assemble(owned);
  assert.equal(prompt.sections.filter(s => s.name === 'deployment:persona-prefix').length, 1);
  assert.deepEqual(ctx.settings.get(NAMESPACE).sessions.owned.turnMembers, { 1: 'ning', 2: 'qing' });
  await ctx.settings.mutate(NAMESPACE, [{ op: 'set', path: ['sessions', 'game'], value: { activeMemberId: 'ning', gameId: 'S08', gameParentId: 'owned', gameCreatedAt: 1, gameFirstLine: '先找人', gameEnded: false } }]);
  assert.ok((await text(agent('game'))).includes('[huaxue-game:S08]'));
  await ctx.settings.mutate(NAMESPACE, [
    { op: 'set', path: ['sessions', 'game', 'gameOutcome'], value: '住宿方案重新讨论' },
    { op: 'set', path: ['sessions', 'game', 'gameOutcomeDirection'], value: '大家开始明确表达住宿偏好。' },
    { op: 'set', path: ['sessions', 'game', 'gameTurnCount'], value: 5 },
  ]);
  assert.equal(ctx.settings.get(NAMESPACE).sessions.game.gameTurnCount, 5);
  assert.equal(ctx.settings.get(NAMESPACE).sessions.game.gameOutcome, '住宿方案重新讨论');
  await store.write({ revision: 1, state: { ...state, added: ['other'] } });
  assert.ok(!(await text(owned)).includes('[huaxue:'));
  assert.ok(!(await text(agent('game'))).includes('[huaxue-game:'));
  await store.write({ revision: 2, state });
  assert.ok((await text(owned)).includes('[huaxue:'));
  await writeFile(join(root, 'state.json'), 'invalid');
  await assert.rejects(assemble(owned), /invalid|state/i);
  console.log('PASS real Cordis + Settings + SystemPrompt + Desktop apply/store: injection, strict ownership, legacy-preset isolation, persona switching, game, removal/re-add and corrupt-state rejection');
} finally {
  await ctx.fiber.dispose();
  await rm(root, { recursive: true, force: true });
}
