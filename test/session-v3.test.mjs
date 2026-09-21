import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageAttributions } from '../src/core.js';
test('v3 system/message preserves historical speakers across metadata-only request headers', () => {
  const events = [
    { type:'system/message', data:{message:{content:'[huaxue:dialogue-v2.5:ning] rules'}} },
    { type:'request/header', data:{header:{config:{},tools:[]}} },
    { type:'assistant/message', data:{id:'first'} },
    { type:'system/message', data:{message:{content:'[huaxue:dialogue-v2.5:qing] rules'}} },
    { type:'request/header', data:{header:{config:{},tools:[]}} },
    { type:'assistant/message', data:{id:'second'} },
    { type:'system/message', data:{message:{content:'standard session'}} },
    { type:'assistant/message', data:{id:'unbound'} },
  ];
  assert.deepEqual(messageAttributions(events), {
    first:{memberId:'ning',version:'dialogue-v2.5'},
    second:{memberId:'qing',version:'dialogue-v2.5'},
  });
});
