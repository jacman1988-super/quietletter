// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {assess,validateCases,aggregate} from './evaluation.mjs';
const cases=validateCases(JSON.parse(await readFile(new URL('../data/evaluation.json',import.meta.url),'utf8')));
const limit=Number(process.env.QUIETLETTER_EVAL_LIMIT||cases.length);
const results=[];
for(const c of cases.slice(0,limit)){
 const start=Date.now();let output,error;
 try{const r=await fetch('http://127.0.0.1:8830/api/review',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:8830'},body:JSON.stringify({text:c.text,language:c.language}),signal:AbortSignal.timeout(190000)});output=await r.json();if(!r.ok)throw new Error(output.error);}
 catch(e){error=e.message;}
 const entry={id:c.id,elapsedMs:Date.now()-start,input:{text:c.text,language:c.language},expected:{actions:c.actions,unclear:c.unclear},output,error,scores:assess(c,error?null:output)};
 results.push(entry);console.log(JSON.stringify({id:c.id,elapsedMs:entry.elapsedMs,error,scores:entry.scores}));
 // Preserve the submitted historical run. Current evaluation never overwrites it.
 await writeFile(new URL('../data/live-evaluation-latest.json',import.meta.url),JSON.stringify({kind:'Actual local Apertus HTTP inference on existing development examples; raw model, displayed and raw baseline scores separated',dateUtc:new Date().toISOString(),results,summary:aggregate(results)},null,2)+'\n');
 if(error)break;
}
