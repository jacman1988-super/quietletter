// SPDX-License-Identifier: Apache-2.0
import {prepare} from './core.mjs';
import {review} from './model.mjs';
try{
 let source='';for await(const chunk of process.stdin){source+=chunk;if(source.length>26000)throw new Error('INPUT_TOO_LARGE');}
 const input=JSON.parse(source);console.log(JSON.stringify(await review(prepare(input.text,input.language)),null,2));
}catch(e){console.error(e.code||e.message);process.exitCode=1;}
