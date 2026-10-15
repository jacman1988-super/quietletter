// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';import assert from 'node:assert/strict';
import {prepare,ground} from './core.mjs';
import {assess,aggregate,validateCases} from './evaluation.mjs';
test('raw selections and displayed filtered selections are scored independently',()=>{
 const c={id:'negative',language:'en',text:'Please do not send it again.',actions:[],unclear:[]};
 const r=assess(c,ground(prepare(c.text,'en'),{actions:[1],unclear:[]}));
 assert.equal(r.rawModel.actions.fp,1);assert.equal(r.displayed.actions.fp,0);assert.equal(r.rawBaseline.actions.fp,1);
});
test('gold annotations must match actual segmented source quotes',()=>{
 assert.throws(()=>validateCases([{id:'x',text:'Hello.',language:'en',actions:['Hello'],unclear:[]}]),/GOLD_QUOTE_NOT_EXACT/);
});
test('failed inference remains counted as failed and not scored as perfect',()=>{
 const c={id:'x',text:'Bring your card.',language:'en',actions:['Bring your card.'],unclear:[]};
 const t=aggregate([{scores:assess(c,null)}]);assert.equal(t.failed,1);assert.equal(t.successful,0);assert.equal(t.rawModel.actions.recall,null);assert.equal(t.rawBaseline.actions.fn,1);
});
