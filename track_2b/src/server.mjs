// SPDX-License-Identifier: Apache-2.0
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {prepare,ReviewError} from './core.mjs';
import {config,status,review} from './model.mjs';

const files=new Map([['/',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/style.css',['style.css','text/css; charset=utf-8']]]);
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
export function createServer({cfg=config(),reviewImpl=review,statusImpl=status,onStop}={}){
 let busy=false;
 return http.createServer(async(req,res)=>{
  const json=(code,data)=>{res.writeHead(code,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const host=req.headers.host||'';
  // A foreign web page cannot silently trigger a local-model POST via DNS rebinding.
  if(!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))return json(403,{error:'LOCAL_HOST_REQUIRED'});
  try{
   if(req.method==='GET'&&req.url==='/api/status')return json(200,await statusImpl(cfg));
   if(req.method==='POST'&&req.url==='/api/stop'&&onStop){
    if(req.headers.origin!==`http://${host}`||req.headers['content-type']!=='application/json')return json(403,{error:'SAME_ORIGIN_REQUIRED'});
    json(200,{stopping:true});setTimeout(onStop,150);return;
   }
   if(req.method==='POST'&&req.url==='/api/review'){
    if(req.headers.origin!==`http://${host}`||req.headers['content-type']!=='application/json')return json(403,{error:'SAME_ORIGIN_REQUIRED'});
    if(busy)return json(429,{error:'BUSY'});
    busy=true; const controller=new AbortController();res.once('close',()=>controller.abort());
    try{
     const chunks=[];let length=0;
     for await(const chunk of req){length+=chunk.length;if(length>26000)throw new ReviewError('BODY_TOO_LARGE');chunks.push(chunk);}
     let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ReviewError('INVALID_JSON');}
     if(!input||Object.keys(input).some(k=>!['text','language'].includes(k)))throw new ReviewError('BAD_REQUEST');
     const doc=prepare(input.text,input.language);
     const result=await reviewImpl(doc,{cfg,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(180000)])});
     return json(200,result);
    }finally{busy=false;}
   }
   if(req.method==='GET'&&files.has(req.url)){
    const [name,type]=files.get(req.url);const bytes=await readFile(new URL(name,import.meta.url));res.writeHead(200,{...headers,'Content-Type':type});return res.end(bytes);
   }
   return json(404,{error:'NOT_FOUND'});
  }catch(error){if(!res.destroyed)json(error instanceof ReviewError?400:503,{error:error instanceof ReviewError?error.code:'MODEL_REQUEST_FAILED'});}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8830);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid port');
 const host=process.env.QUIETLETTER_CONTAINER==='1'?'0.0.0.0':'127.0.0.1';
 const server=createServer(); server.requestTimeout=200000;server.headersTimeout=10000;
 server.listen(port,host,()=>console.log(`QuietLetter: http://127.0.0.1:${port}/`));
 for(const s of ['SIGINT','SIGTERM'])process.once(s,()=>server.close(()=>process.exit(0)));
}
