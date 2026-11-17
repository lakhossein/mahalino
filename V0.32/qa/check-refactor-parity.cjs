'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const previous=fs.readFileSync(path.join(root,'..','V0.31','Mahalino+V0.31.html'),'utf8');
const current=fs.readFileSync(path.join(root,'Mahalino+V0.32.html'),'utf8');
// Exhaustive allow-list: release labels, source comments, isolated storage and
// a read-only migration candidate. No numeric sample data or runtime APIs change.
let expected=previous.replaceAll('V0.31','V0.32')
 .replaceAll('v031','v032').replaceAll('V031','V032').replaceAll('v31','v32')
 .replaceAll("VER:'0.31'","VER:'0.32'")
 .replace("var OLD_LS=['mahal','ino_','v30'].join('');","var PREVIOUS_LS='mahalino_v31';\nvar OLD_LS=['mahal','ino_','v30'].join('');")
 .replace("LSCHAIN=[LSKEY,OLD_LS,","LSCHAIN=[LSKEY,PREVIOUS_LS,OLD_LS,");
// M-02/M-03 approve changes only inside the persistent-state initialization
// block. Keep the frozen original block and full equality for every other byte;
// behavioral recovery tests are mandatory in run-quality-gate.sh.
const baseline=fs.readFileSync(path.join(__dirname,'fixtures/state-loader-v032-baseline.txt'),'utf8');
assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'),'f3d95de6830ee6ff3cb37584872d48e7f79ade8b240d6b37d27b6b3b37d6b246','state baseline was modified');
assert.equal(expected.split(baseline).length,2,'baseline state block must occur exactly once');
const utilities=fs.readFileSync(path.join(root,'src/legacy/utilities.js'),'utf8');
const stateBlock=utilities.slice(utilities.indexOf('/* 2) state */'));
expected=expected.replace(baseline,()=>stateBlock);
// M-04/M-07/M-08: only the three reviewed interaction blocks may differ.
const interactionRaw=fs.readFileSync(path.join(__dirname,'fixtures/approved-interaction-baselines.json'),'utf8');
assert.equal(require('node:crypto').createHash('sha256').update(interactionRaw).digest('hex'),'01cb4a5538e4ba8cbd1c6d1f294040d6d13c349760f8688cfe6fa820e29c15db');
for(const item of JSON.parse(interactionRaw)){
 const src=fs.readFileSync(path.join(root,'src',item.file),'utf8');
 const start=src.indexOf(item.file==='legacy/actions.js'?'/* V0.32 — بازنشانی مستقل':item.file==='legacy/sharing.js'?item.start.replace('=function','=async function'):item.start);
 const end=src.indexOf(item.end,start);
 assert(start>=0&&end>start,'interaction boundaries missing');
 assert.equal(expected.split(item.original).length,2,'interaction baseline must occur once');
 expected=expected.replace(item.original,()=>src.slice(start,end));
}
assert.equal(current,expected,'V0.32 changed content outside approved identity/state/interaction blocks');
// Execute the actual loader against a fresh, prior-only and existing V0.32 store.
const vm=require('node:vm');
const loader=stateBlock;
for(const existing of ['fresh','previous','current']){
 const previousState={auth:{name:'QA'},tokens:321,log:[],chats:[],wfs:{},profile:{confirmed:{},inferred:{},stale:{},log:[]}};
 const ownState={...previousState,tokens:123};
 const data=existing==='fresh'?{}:{mahalino_v31:JSON.stringify(previousState)};
 if(existing==='current')data.mahalino_v32=JSON.stringify(ownState);
 const before=data.mahalino_v31;
 const writes=[];
 const context={localStorage:{getItem:key=>data[key]||null,setItem:(key,value)=>{writes.push(key);data[key]=value}},
   console,Date,Math};
 vm.runInNewContext(loader,context);
 assert.equal(context.S&&context.S.tokens,existing==='current'?123:existing==='previous'?321:0);
 assert.equal(data.mahalino_v31,before,'migration overwrote the predecessor');
 assert(!writes.includes('mahalino_v31'));
}
console.log('PASS artifact parity outside approved state recovery block and previous/current state selection');
