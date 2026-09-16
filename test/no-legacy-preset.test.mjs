import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createTurnResolver} from '../src/core.js';
test('standard sessions gain dialogue and game rules from workbench binding alone', () => {
  const state={lastMemberId:'ning',sessions:{dialogue:{activeMemberId:'qing'},game:{activeMemberId:'ning',gameId:'S08'}}};
  const resolve=createTurnResolver(()=>state,id=>['dialogue','game'].includes(id)?'huaxue':undefined,()=>true);
  const agent=id=>({session:{id,header:{agentPreset:'standard'},snapshotEvents:()=>[]}});
  assert.match(resolve(agent('dialogue')).text,/\[huaxue:[^\]]+:qing\]/);
  assert.match(resolve(agent('game')).text,/\[huaxue-game:S08\]/);
  assert.equal(resolve(agent('ordinary')),null);
});
test('new client never creates or selects a huashao2 preset',async()=>{
  const source=await readFile(new URL('../src/business-client.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/agentPresets\.select\([^\n]+['"]huashao2['"]/);
  assert.doesNotMatch(source,/['"]huashao2['"]/);
});
