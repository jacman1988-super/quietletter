// SPDX-License-Identifier: Apache-2.0
import {createHash} from 'node:crypto';

export class ReviewError extends Error { constructor(code){super(code);this.code=code;} }
export function prepare(text,language='pl'){
 if(typeof text!=='string'||!text.trim())throw new ReviewError('EMPTY_TEXT');
 if(text.length>6000)throw new ReviewError('TEXT_TOO_LONG');
 if(!['pl','en'].includes(language))throw new ReviewError('BAD_LANGUAGE');
 const units=[];
 const segmenter=new Intl.Segmenter(language,{granularity:'sentence'});
 for(const line of text.matchAll(/[^\r\n]+/g)){
  for(const s of segmenter.segment(line[0])){
   const quote=s.segment.trim();if(!quote)continue;
   const start=line.index+s.index+s.segment.indexOf(quote);
   units.push({id:units.length+1,start,end:start+quote.length,quote});
  }
 }
 if(units.length>48)throw new ReviewError('TOO_MANY_PASSAGES');
 return {text,language,sourceHash:createHash('sha256').update(text).digest('hex'),units};
}
// Literal expressions only. No conversion of dates, timezone assumptions, or
// calculation of relative/legal due dates. Month/day formats remain ambiguous.
export function scanDates(doc){
 const pattern=/(?<![\p{L}\p{N}])(?:\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia|January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?|(?:w\s+ciągu|within)\s+\d+\s+(?:dni|days)|jutro|tomorrow|next\s+week|za\s+tydzień)(?![\p{L}\p{N}])/giu;
 const result=[];
 for(const unit of doc.units)for(const m of unit.quote.matchAll(pattern)){
  result.push({literal:m[0],sourceId:unit.id,start:unit.start+m.index,end:unit.start+m.index+m[0].length,quote:unit.quote,interpretation:'unresolved'});
 }
 return result;
}
export function selectionSchema(doc){
 const ids=doc.units.map(u=>u.id);
 const list={type:'array',maxItems:6,items:{type:'integer',enum:ids}};
 return {type:'object',additionalProperties:false,required:['actions','unclear'],properties:{actions:list,unclear:list}};
}
export function ground(doc,selected,metadata={}){
 if(!selected||typeof selected!=='object'||Array.isArray(selected)||Object.keys(selected).sort().join(',')!=='actions,unclear')throw new ReviewError('INVALID_MODEL_OUTPUT');
 const resolve=key=>{
  const ids=selected[key];
  if(!Array.isArray(ids)||ids.length>6||new Set(ids).size!==ids.length)throw new ReviewError('INVALID_SELECTION');
  return ids.map(id=>{
   if(!Number.isInteger(id))throw new ReviewError('INVALID_SELECTION');
   const u=doc.units.find(x=>x.id===id);if(!u||doc.text.slice(u.start,u.end)!==u.quote)throw new ReviewError('UNSUPPORTED_CITATION');
   return {sourceId:u.id,quote:u.quote,start:u.start,end:u.end};
  });
 };
 const proposed=resolve('actions');
 // Conservative independent disagreement: do not display an explicit no-action
 // phrase as an ordinary task merely because the model selected its passage.
 const negated=q=>/(?:nie musisz|nie trzeba|nie wymaga|do not need to|no (?:reply|response|action) is required|\bdo not\s+\p{L}+)/iu.test(q);
 const actions=proposed.filter(x=>!negated(x.quote));
 const disputed=proposed.filter(x=>negated(x.quote));
 const ruleOnly=baseline(doc).actions.filter(id=>!selected.actions.includes(id)).map(id=>{const u=doc.units.find(x=>x.id===id);return {sourceId:u.id,quote:u.quote,start:u.start,end:u.end};});
 return {version:1,sourceHash:doc.sourceHash,language:doc.language,source:doc.units,actions,clarify:resolve('unclear'),dates:scanDates(doc),crossCheck:{method:'literal keyword and no-action phrase rules; not verified classifiers',ruleOnly,disputed},rawSelection:selected,checks:{quotesVerified:true,classificationVerified:false,complete:false,datesInterpreted:false},model:metadata};
}

export function baseline(doc){
 return {actions:doc.units.filter(u=>/(?<![\p{L}])(?:please|submit|send|return|confirm|proszę|prześlij|odeślij|potwierdź)(?![\p{L}])/iu.test(u.quote)).slice(0,6).map(u=>u.id),unclear:doc.units.filter(u=>/\?|not specified|nie podano|unclear|brak informacji/iu.test(u.quote)).slice(0,6).map(u=>u.id)};
}
