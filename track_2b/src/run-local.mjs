// SPDX-License-Identifier: Apache-2.0
import {spawn} from 'node:child_process';
import {existsSync,createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from './server.mjs';
import {status,review} from './model.mjs';
import {prepare} from './core.mjs';

const runtime=process.env.QUIETLETTER_RUNTIME||fileURLToPath(new URL('../../../calm-evening-mcp/.local-ai/llama-b11552/llama-server.exe',import.meta.url));
const model=process.env.QUIETLETTER_MODEL||fileURLToPath(new URL('../../../../work/quietletter-model/apertus-v1.5-8b-text-q4_k_m.gguf',import.meta.url));
if(!existsSync(runtime)||!existsSync(model))throw new Error('Local runtime/model missing. See docs/RUN.md. No paid service is substituted.');
const modelHash=createHash('sha256');for await(const chunk of createReadStream(model))modelHash.update(chunk);
if(modelHash.digest('hex')!=='a037df8d87ff6caacee794ee85f55342f2152e0d359b7389033300c3bee5f299')throw new Error('Apertus file SHA256 differs. Refusing to start a substituted model.');
const key=randomBytes(32).toString('hex');const cfg={base:'http://127.0.0.1:8831/v1',name:'apertus-1.5-quietletter',key};
const child=spawn(runtime,['-m',model,'--host','127.0.0.1','--port','8831','--alias',cfg.name,'-c','4096','-t','4','-tb','4','-b','256','-ub','128','--parallel','1','--jinja','--no-webui','--offline','--log-disable'],{windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,LLAMA_API_KEY:key}});
let failure=false;child.on('error',()=>{failure=true;});child.on('exit',()=>{failure=true;});
// Do not print runtime logs: prompts and auth configuration do not belong in logs.
child.stderr.resume();
let app;let closing=false;
function close(){if(closing)return;closing=true;child.kill();if(app)app.close(()=>process.exit(0));else process.exit(0);setTimeout(()=>process.exit(0),3000).unref();}
for(const s of ['SIGINT','SIGTERM'])process.once(s,close);
process.on('exit',()=>child.kill());
const cli=process.argv.includes('--cli');
(cli?console.error:console.log)('QuietLetter: loading local Apertus 1.5. No letter is sent to a cloud service.');
let good=false;
for(let i=0;i<120;i++){if(failure)break;if((await status(cfg)).ready){good=true;break;}await delay(1000);}
if(!good){child.kill();throw new Error('Local Apertus did not become ready; no fallback model used.');}
if(cli){
 try{let raw='';for await(const b of process.stdin){raw+=b;if(raw.length>26000)throw new Error('INPUT_TOO_LARGE');}const input=JSON.parse(raw);console.log(JSON.stringify(await review(prepare(input.text,input.language),{cfg}),null,2));close();}
 catch(e){console.error(e.code||e.message);child.kill();process.exit(1);}
}else{
app=createServer({cfg,onStop:close});app.on('error',()=>{console.error('Port 8830 is unavailable. Close this copy before starting another.');close();});
app.listen(8830,process.env.QUIETLETTER_CONTAINER==='1'?'0.0.0.0':'127.0.0.1',()=>console.log('QuietLetter ready: http://127.0.0.1:8830/ — close this window or press Ctrl+C to stop.'));
}
