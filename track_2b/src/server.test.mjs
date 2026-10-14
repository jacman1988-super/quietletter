// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {createServer} from './server.mjs';import {ground} from './core.mjs';
test('actual loopback HTTP rejects foreign origin/host, serves no-store UI, and invokes analysis',async()=>{
 let calls=0;const s=createServer({reviewImpl:async doc=>{calls++;return ground(doc,{actions:[1],unclear:[]},{name:'injected test double'});},statusImpl:async()=>({ready:true,name:'injected test double'})});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 try{
  const index=await fetch(base+'/');assert.equal(index.status,200);assert.equal(index.headers.get('cache-control'),'no-store');assert.ok((await index.text()).includes('QuietLetter'));
  const post=(origin,body)=>fetch(base+'/api/review',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
  assert.equal((await post('http://evil.example',{text:'Please reply.'})).status,403);assert.equal(calls,0);
  const good=await post(base,{text:'Please reply.',language:'en'});assert.equal(good.status,200);assert.equal((await good.json()).actions[0].quote,'Please reply.');assert.equal(calls,1);
  const stale=await post(base,{text:'Please reply.',endpoint:'http://evil.example'});assert.equal(stale.status,400);assert.equal(calls,1);
  const foreignHost=await new Promise((resolve,reject)=>{const req=http.get(base+'/api/status',{headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode);});req.on('error',reject);});
  assert.equal(foreignHost,403);
 }finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});
test('stopping is explicit, same-origin only, and calls only this application callback',async()=>{
 let stopped=0;const s=createServer({onStop:()=>stopped++});await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 try{for(const origin of ['http://evil.example',base]){const r=await fetch(base+'/api/stop',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,origin===base?200:403);}await new Promise(r=>setTimeout(r,200));assert.equal(stopped,1);}finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});
