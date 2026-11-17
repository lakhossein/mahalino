'use strict';
// Synthetic host serialization/storage-wrapper timings; not a mobile UI benchmark.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{performance}=require('node:perf_hooks');
const source=fs.readFileSync(path.join(__dirname,'../src/legacy/utilities.js'),'utf8');const rows=[];
for(const messages of [100,1000,10000]){
 let writes=0,stored=JSON.stringify({tokens:100,log:[],chats:[{id:'qa',hist:Array.from({length:messages},(_,i)=>({r:'user',h:'synthetic '+i+' '+'.'.repeat(160)}))}]});
 const c={Date,Math,window:{},console:{warn(){},error(){}},localStorage:{getItem:()=>stored,setItem(k,v){stored=v;writes++}}};vm.runInNewContext(source.slice(source.indexOf('/* 2) state */')),c);
 const times=[];for(let i=0;i<30;i++){c.S.tokens++;const start=performance.now();c.save();times.push(performance.now()-start)}times.sort((a,b)=>a-b);
 const prior=writes;for(let i=0;i<10;i++)c.save();rows.push({messages,bytes:Buffer.byteLength(stored),p50Ms:times[15],p95Ms:times[28],writesForTenUnchangedSaves:writes-prior});
}
console.log(JSON.stringify({environment:'Node '+process.version,scope:'synthetic host serialize+Map-like storage; no mobile/network/UI claims',rows},null,2));
