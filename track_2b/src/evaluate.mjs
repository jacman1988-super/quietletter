// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {prepare,ground,baseline} from './core.mjs';
const cases=JSON.parse(await readFile(new URL('../data/evaluation.json',import.meta.url),'utf8'));
const limit=Number(process.env.QUIETLETTER_EVAL_LIMIT||cases.length);
const results=[];
function score(actual,expected){const a=new Set(actual),e=new Set(expected);return {tp:[...a].filter(x=>e.has(x)).length,fp:[...a].filter(x=>!e.has(x)).length,fn:[...e].filter(x=>!a.has(x)).length};}
for(const c of cases.slice(0,limit)){
 const start=Date.now();let output,error;
 try{const r=await fetch('http://127.0.0.1:8830/api/review',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:8830'},body:JSON.stringify({text:c.text,language:c.language}),signal:AbortSignal.timeout(190000)});output=await r.json();if(!r.ok)throw new Error(output.error);}
 catch(e){error=e.message;}
 const b=ground(prepare(c.text,c.language),baseline(prepare(c.text,c.language)),{name:'literal-keyword-baseline'});
 const entry={id:c.id,elapsedMs:Date.now()-start,input:{text:c.text,language:c.language},expected:{actions:c.actions,unclear:c.unclear},output,error,modelScore:output&&!error?{actions:score(output.actions.map(x=>x.quote),c.actions),unclear:score(output.clarify.map(x=>x.quote),c.unclear)}:null,baselineScore:{actions:score(b.actions.map(x=>x.quote),c.actions),unclear:score(b.clarify.map(x=>x.quote),c.unclear)}};
 results.push(entry);console.log(JSON.stringify({id:c.id,elapsedMs:entry.elapsedMs,error,score:entry.modelScore}));
 await writeFile(new URL('../data/live-evaluation.json',import.meta.url),JSON.stringify({kind:'Actual local Apertus HTTP inference; hand-authored fictional mini-set, not a benchmark',dateUtc:new Date().toISOString(),results},null,2)+'\n');
 if(error)break;
}
