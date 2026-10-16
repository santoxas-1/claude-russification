#!/usr/bin/env node
'use strict';
// Read-only inventory of packaged resources. Never imports or executes archive content.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const readJSON = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const optionalJSON = (p, fallback) => fs.existsSync(path.join(root,p)) ? readJSON(p) : fallback;
const norm = s => s.replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/ /g,' ').trim();
function archive(file) {
  const fd=fs.openSync(file,'r'), prefix=Buffer.alloc(16); fs.readSync(fd,prefix,0,16,0);
  const length=prefix.readUInt32LE(12), offset=8+prefix.readUInt32LE(4);
  if(length>32*1024*1024) throw Error('Unexpected ASAR header size');
  const header=Buffer.alloc(length);fs.readSync(fd,header,0,length,16);
  const entries=[];
  function walk(node,dir=''){for(const [name,v] of Object.entries(node.files||{})){const p=dir+'/'+name;if(v.files)walk(v,p);else if(!v.unpacked&&!v.link)entries.push({path:p,...v});}}
  walk(JSON.parse(header.toString('utf8')));
  return {entries,read(e){const b=Buffer.alloc(e.size);fs.readSync(fd,b,0,b.length,offset+Number(e.offset));return b.toString('utf8');},close(){fs.closeSync(fd);}};
}
function decode(s){try{return JSON.parse(s);}catch{return null;}}
function literalPairs(text,start,end){const a=text.indexOf(start);if(a<0)return {};const b=text.indexOf(end,a+start.length);const section=text.slice(a+start.length,b<0?undefined:b),out={};for(const m of section.matchAll(/("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")/g)){const k=decode(m[1]),v=decode(m[2]);if(k!==null&&v!==null)out[k]=v;}return out;}
const runtime=fs.readFileSync(path.join(root,'dist/i18n-ru.js'),'utf8');
const baseline=literalPairs(runtime,'const DICT = {','\n  };');
const formatjs=literalPairs(runtime,'const FORMATJS_MAP = {','\n  };');
const complete=optionalJSON('src/complete_ui_ru.json',{}),context=optionalJSON('src/context_fragments_ru.json',{version:1,cards:[]});
const missing=readJSON('all_missing_in_assets.json'),candidates=readJSON('candidate_dev_keys.json');
const bundled=archive(path.join(root,'app.asar'));const messages=[],assets=[],catalogs=[];const literals=[];
for(const e of bundled.entries){
 if(/(?:^|\/)en-US\.json$/.test(e.path)){try{const data=JSON.parse(bundled.read(e));catalogs.push({path:e.path,count:Object.keys(data).length,data});}catch{}}
 if(!/\.(?:js|mjs)$/.test(e.path))continue;
 const text=bundled.read(e);assets.push({path:e.path,size:e.size});
 const re=/\bid\s*:\s*("(?:[^"\\]|\\.)*")\s*,\s*defaultMessage\s*:\s*("(?:[^"\\]|\\.)*")/g;
 for(const m of text.matchAll(re)){messages.push({id:decode(m[1]),text:decode(m[2]),file:e.path});}
 for(const m of text.matchAll(/(?:children|title|placeholder|label|description|"aria-label")\s*:\s*("(?:[^"\\]|\\.)*")/g)){const value=decode(m[1]);if(value&&/[A-Za-z]{3}/.test(value))literals.push({text:value,file:e.path});}
}
bundled.close();
const byText=new Set(messages.map(x=>x.text));const literalTexts=new Set(literals.map(x=>x.text));
const lookup=new Map(Object.entries({...baseline,...complete}).map(([k,v])=>[norm(k),v]));
const isTranslated=(text,id)=>{const v=lookup.get(norm(text));return !!(v&&v!==text&&/[А-Яа-яЁё]/.test(v))||!!(id&&formatjs[id]&&/[А-Яа-яЁё]/.test(formatjs[id]));};
const excluded=text=>/^(?:https?:\/\/|api:\/\/|[a-z][\w.-]*:\/\/)|^(?:claude-|us\.anthropic\.|[A-Z_]{3,}$)|^(?:true|false|stdio|sse|http|json|text|auto|default|inherit|none)$/.test(text)||(!/\s/.test(text)&&/[\/_{}=]/.test(text));
const rows=[];for(const [id,text] of Object.entries(candidates)){rows.push({source:'candidate_dev_keys',id,text,presentInArchive:byText.has(text)||literalTexts.has(text),status:excluded(text)?'technical-review':isTranslated(text,id)?'translated-exact':'untranslated-or-runtime-dependent'});}
for(const x of missing)rows.push({source:'all_missing_in_assets',id:x.id,text:x.defMsg,presentInArchive:byText.has(x.defMsg)||literalTexts.has(x.defMsg),status:excluded(x.defMsg)?'technical-review':isTranslated(x.defMsg,x.id)?'translated-exact':'untranslated-or-runtime-dependent'});
const additions=Object.entries(complete).map(([text,translation])=>({text,translation,presentInArchive:byText.has(text)||literalTexts.has(text),presentInHistoricalLists:missing.some(x=>x.defMsg===text)||Object.values(candidates).includes(text)}));
const counts={};for(const r of rows){counts[r.source]??={total:0,presentInArchive:0,statuses:{}};const c=counts[r.source];c.total++;if(r.presentInArchive)c.presentInArchive++;c.statuses[r.status]=(c.statuses[r.status]||0)+1;}
const report={schemaVersion:1,generatedAt:new Date().toISOString(),archive:{path:'app.asar',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'app.asar'))).digest('hex'),entries:bundled.entries.length,javascriptAssets:assets.length,defaultMessageOccurrences:messages.length,uniqueDefaultMessages:byText.size,catalogs:catalogs.map(({data,...x})=>x)},runtimeSnapshot:{dictionaryEntries:Object.keys(baseline).length,formatjsEntries:Object.keys(formatjs).length},newData:{completePhrases:Object.keys(complete).length,contextCards:context.cards.length,contextFragments:context.cards.reduce((n,c)=>n+Object.keys(c.fragments).length,0),archiveConfirmedPhrases:additions.filter(x=>x.presentInArchive).length},counts,limitations:['Статическая сверка не доказывает перевод всех экранов или состояний приложения.','Старые списки включают веб-интерфейс, технические строки и уже переведённые сообщения; это не список подтверждённых пропусков.','ICU, rich text и динамические подписи могут требовать сопоставления в рантайме; exact не означает визуальную проверку.','Неподтверждённые строки остаются в остатках: исходный архив может отличаться от установленной версии.','Контекстные фрагменты проверяются отдельно и не считаются глобальным покрытием.'],additions,rows};
const out=path.join(root,'reports');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(out,'coverage-remaining.json'),JSON.stringify(rows.filter(x=>x.status!=='translated-exact'),null,2)+'\n');
fs.writeFileSync(path.join(out,'coverage-summary.txt'),['Аудит русификации интерфейса',JSON.stringify({...report,additions:undefined,rows:undefined},null,2),'Полные остатки: coverage-remaining.json','ВНИМАНИЕ: полнота перевода не заявляется.'].join('\n')+'\n');
if(process.argv.includes('--inventory'))fs.writeFileSync(path.join(out,'coverage-inventory.json'),JSON.stringify({messages,literals,catalogs},null,2)+'\n');
console.log(JSON.stringify({...report,additions:undefined,rows:undefined},null,2));
