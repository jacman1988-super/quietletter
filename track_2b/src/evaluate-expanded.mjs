// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateCases,assess,aggregate} from './evaluation.mjs';
const data=await readFile(new URL('../data/evaluation-expanded.json',import.meta.url));
const cases=validateCases(JSON.parse(data));
const hash=b=>createHash('sha256').update(b).digest('hex');
const protocol={kind:'Additional AI-assisted fictional development set; not independent or held out',
 startedAtUtc:new Date().toISOString(),datasetSha256:hash(data),modelAdapterSha256:hash(await readFile(new URL('./model.mjs',import.meta.url))),
 rules:'All 12 PL/EN annotations fixed before the first run. Prompt and app remain unchanged. Score raw model, displayed selections and raw keyword baseline separately. Keep every failure. No tuning on these results.',
 groundTruth:'Expected quotes specified by the coding assistant; not independently human annotated.',results:[]};
const out=new URL('../data/live-evaluation-expanded.json',import.meta.url);
await writeFile(out,JSON.stringify(protocol,null,2)+'\n');
for(const c of cases){
 const start=Date.now();let output=null,error=null;
 try{
  const r=await fetch('http://127.0.0.1:8830/api/review',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:8830'},body:JSON.stringify({text:c.text,language:c.language}),signal:AbortSignal.timeout(190000)});
  const body=await r.json();if(!r.ok)throw new Error(body.error);output=body;
 }catch(e){error=e.message;}
 const entry={id:c.id,language:c.language,elapsedMs:Date.now()-start,input:c.text,expected:{actions:c.actions,unclear:c.unclear},output,error,scores:assess(c,output)};
 protocol.results.push(entry);protocol.summary=aggregate(protocol.results);
 await writeFile(out,JSON.stringify(protocol,null,2)+'\n');
 console.log(JSON.stringify({id:c.id,error,elapsedMs:entry.elapsedMs,raw:entry.scores.rawModel}));
 if(error&&['fetch failed','MODEL_REQUEST_FAILED'].includes(error))break;
}
protocol.finishedAtUtc=new Date().toISOString();protocol.complete=protocol.results.length===cases.length;
await writeFile(out,JSON.stringify(protocol,null,2)+'\n');console.log(JSON.stringify(protocol.summary));
