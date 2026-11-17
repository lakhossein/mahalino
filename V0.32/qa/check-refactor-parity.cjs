'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const previous=fs.readFileSync(path.join(root,'..','V0.31','Mahalino+V0.31.html'),'utf8');
const current=fs.readFileSync(path.join(root,'Mahalino+V0.32.html'),'utf8');
// Exhaustive allow-list: release labels, source comments, isolated storage and
// a read-only migration candidate. No numeric sample data or runtime APIs change.
const expected=previous.replaceAll('V0.31','V0.32')
 .replaceAll('v031','v032').replaceAll('V031','V032').replaceAll('v31','v32')
 .replaceAll("VER:'0.31'","VER:'0.32'")
 .replace("var OLD_LS=['mahal','ino_','v30'].join('');","var PREVIOUS_LS='mahalino_v31';\nvar OLD_LS=['mahal','ino_','v30'].join('');")
 .replace("LSCHAIN=[LSKEY,OLD_LS,","LSCHAIN=[LSKEY,PREVIOUS_LS,OLD_LS,");
assert.equal(current,expected,'V0.32 changed runtime content beyond release identity and migration');
// Execute the actual loader against a fresh, prior-only and existing V0.32 store.
const vm=require('node:vm');
const start=current.indexOf("var LSKEY='");
const end=current.indexOf('if(!S.profile)',start);
assert(start>=0&&end>start,'missing persistent state initialization');
const loader=current.slice(start,end);
for(const existing of ['fresh','previous','current']){
 const previousState={auth:{name:'QA'},tokens:321,log:[],chats:[],wfs:{},profile:{confirmed:{},inferred:{},stale:{},log:[]}};
 const ownState={...previousState,tokens:123};
 const data=existing==='fresh'?{}:{mahalino_v31:JSON.stringify(previousState)};
 if(existing==='current')data.mahalino_v32=JSON.stringify(ownState);
 const before=data.mahalino_v31;
 const writes=[];
 const context={localStorage:{getItem:key=>data[key]||null,setItem:(key,value)=>{writes.push(key);data[key]=value}},
   console,Date,Math};
 // Initialization can depend on surrounding helpers; run the focused key/chain
 // loader through the end of its first successful read, before default seeding.
 const stop=loader.indexOf("if(!S||typeof S!=='object')");
 assert(stop>0,'missing state fallback boundary');
 vm.runInNewContext(loader.slice(0,stop),context);
 assert.equal(context.S&&context.S.tokens,existing==='current'?123:existing==='previous'?321:null);
 assert.equal(data.mahalino_v31,before,'migration overwrote the predecessor');
 assert(!writes.includes('mahalino_v31'));
}
console.log('PASS complete artifact parity and previous/current state selection');
