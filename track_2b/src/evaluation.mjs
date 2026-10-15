// SPDX-License-Identifier: Apache-2.0
import {prepare,baseline} from './core.mjs';

export function score(actual,expected){
 const a=new Set(actual),e=new Set(expected);
 return {tp:[...a].filter(x=>e.has(x)).length,fp:[...a].filter(x=>!e.has(x)).length,fn:[...e].filter(x=>!a.has(x)).length};
}
export function validateCases(cases){
 if(!Array.isArray(cases)||!cases.length||cases.length>100)throw new Error('INVALID_EVALUATION_CASES');
 const seen=new Set();
 for(const c of cases){
  if(typeof c.id!=='string'||seen.has(c.id))throw new Error('INVALID_CASE_ID');seen.add(c.id);
  const d=prepare(c.text,c.language),quotes=new Set(d.units.map(u=>u.quote));
  for(const field of ['actions','unclear'])if(!Array.isArray(c[field])||c[field].length>6||new Set(c[field]).size!==c[field].length||c[field].some(q=>!quotes.has(q)))throw new Error('GOLD_QUOTE_NOT_EXACT');
 }
 return cases;
}
export function assess(c,output){
 const d=prepare(c.text,c.language),b=baseline(d);
 const quoteIds=ids=>ids.map(id=>{const u=d.units.find(u=>u.id===id);if(!u)throw new Error('INVALID_EVALUATION_SELECTION');return u.quote;});
 const pair=(actions,unclear)=>({actions:score(actions,c.actions),unclear:score(unclear,c.unclear)});
 // Raw model, final UI and raw baseline are different measurements. In
 // particular, do not apply ground()'s disagreement filter to the baseline.
 return {rawModel:output?pair(quoteIds(output.rawSelection.actions),quoteIds(output.rawSelection.unclear)):null,
  displayed:output?pair(output.actions.map(x=>x.quote),output.clarify.map(x=>x.quote)):null,
  rawBaseline:pair(quoteIds(b.actions),quoteIds(b.unclear))};
}
export function aggregate(results){
 const totals={cases:results.length,successful:results.filter(r=>r.scores.rawModel).length,failed:results.filter(r=>!r.scores.rawModel).length};
 for(const method of ['rawModel','displayed','rawBaseline']){
  totals[method]={};
  for(const category of ['actions','unclear']){
   const sums={tp:0,fp:0,fn:0};
   for(const r of results)if(r.scores[method])for(const k of Object.keys(sums))sums[k]+=r.scores[method][category][k];
   const {tp,fp,fn}=sums;
   totals[method][category]={...sums,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null};
  }
 }
 return totals;
}
