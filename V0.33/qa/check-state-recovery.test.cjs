'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/legacy/utilities.js'),'utf8').replace('/* @mahalino:v32-state-codec-js */',()=>fs.readFileSync(path.join(__dirname,'../src/v32-state-codec.js'),'utf8'));
const loader=source.slice(source.indexOf('/* 2) state */')).replace('/* @mahalino:v32-state-codec-js */',()=>fs.readFileSync(path.join(__dirname,'../src/v32-state-codec.js'),'utf8'));
function boot(data={},failRecovery=false){
 const writes=[];const notices=[];
 const c={localStorage:{getItem:k=>data[k]??null,setItem(k,v){if(failRecovery&&k.endsWith('_recovery'))throw Error('quota');data[k]=v;writes.push(k)}},console:{warn:()=>notices.push('warn'),error:()=>notices.push('error')},window:{},Date,Math};
 vm.runInNewContext(loader,c);return {c,data,writes,notices};
}
const plain=v=>JSON.parse(JSON.stringify(v));
for(const raw of ['[]','null','123','"text"','true','{bad'])test('invalid root falls back without overwriting predecessor: '+raw,()=>{
 const prev=JSON.stringify({tokens:321,chats:[{id:'kept'}]});
 const {c,data,writes}=boot({mahalino_v32:raw,mahalino_v31:prev});
 assert.equal(Array.isArray(c.S),false);assert.equal(c.S.tokens,321);assert.equal(writes.length,0);
 c.S.tokens=123;c.save();assert.equal(JSON.parse(data.mahalino_v32).tokens,123);
 assert.equal(data.mahalino_v31,prev);assert.ok(JSON.parse(data.mahalino_v32_recovery).some(x=>x.raw===raw));
});
const arrays='wlog log reqs wfs contracts reviews nprj svcOrders svcAudit grt grtAudit notifs library projects shares savedListings chats'.split(' ');
for(const field of arrays)test('repairs array container '+field,()=>{
 const raw=JSON.stringify({[field]:{},tokens:47,extra:{keep:true}});
 const {c,data}=boot({mahalino_v32:raw});assert.ok(Array.isArray(c.S[field]));
 assert.equal(c.S.tokens,47);assert.deepEqual(plain(c.S.extra),{keep:true});c.save();
 assert.ok(JSON.parse(data.mahalino_v32_recovery).some(x=>x.raw===raw));
});
for(const field of ['tokens','wallet'])for(const value of ['bad',{},[],null,-1,'120'])test(field+' rejects '+JSON.stringify(value),()=>{
 const {c}=boot({mahalino_v32:JSON.stringify({[field]:value})});assert.equal(c.S[field],0);
});
test('nested objects and string pending are normalized independently',()=>{
 const {c}=boot({mahalino_v32:JSON.stringify({ui:[],prof:5,prefs:[],profile:{confirmed:[],inferred:{keep:1},stale:2,log:{}},ctx30:{fields:[],log:4},pending:'home'})});
 assert.equal(c.S.ui.tab,'b');assert.equal(c.S.pending,'home');assert.deepEqual(plain(c.S.profile.inferred),{keep:1});
 assert.deepEqual(plain(c.S.profile.confirmed),{});assert.ok(Array.isArray(c.S.profile.log));assert.ok(Array.isArray(c.S.ctx30.log));
});
test('valid state survives repeat migration and save/reload with no recovery backup',()=>{
 const good={tokens:50,wallet:12,pending:'home',auth:{name:'QA'},wfs:[{id:'w',m:'rent',data:{budget:10}}],chats:[{id:'c',messages:[]}],contracts:[{id:'contract'}],ui:{tab:'x'},custom:{keep:2}};
 const b=boot({mahalino_v32:JSON.stringify(good)});b.c.save();const first=b.data.mahalino_v32;
 const b2=boot(b.data);b2.c.save();assert.equal(b2.data.mahalino_v32,first);assert.equal(b.data.mahalino_v32_recovery,undefined);
 for(const [k,v] of Object.entries(good))if(k!=='ui')assert.deepEqual(plain(b2.c.S[k]),v);
 assert.equal(b2.c.S.ui.tab,'x');
});
test('failed recovery backup never overwrites the original',()=>{
 const raw='[]';const {c,data,notices}=boot({mahalino_v32:raw},true);c.save();assert.equal(data.mahalino_v32,raw);assert.ok(notices.includes('error'));
});
test('legacy flow migrates once after normalizing containers',()=>{
 const {c,data}=boot({mahalino_v31:JSON.stringify({flow:{rent:{step:3,data:{city:'Tehran'}}},wfs:{}})});
 assert.equal(c.S.wfs.length,1);assert.equal(c.S.wfs[0].step,3);assert.equal(c.S.wfs[0].data.city,'Tehran');c.save();
 assert.equal(boot(data).c.S.wfs.length,1);
});
test('current state wins over valid predecessor without writing it',()=>{
 const previous=JSON.stringify({tokens:200});const b=boot({mahalino_v32:'{"tokens":30}',mahalino_v31:previous});
 assert.equal(b.c.S.tokens,30);b.c.save();assert.equal(b.data.mahalino_v31,previous);
});
test('fresh state is an object, saves and reloads without backup',()=>{
 const b=boot();b.c.S.tokens=7;b.c.save();assert.equal(boot(b.data).c.S.tokens,7);assert.equal(b.data.mahalino_v32_recovery,undefined);
});
test('invalid rows and nested workflow/chat containers retain raw recovery data',()=>{
 const raw=JSON.stringify({wfs:[null,{id:'w',m:'rent',data:[]}],chats:[false,{id:'c',hist:{}}],contracts:[null,{code:'valid'}],log:[null,{d:'kept'}],ctx30ByChat:{c:{fields:[],log:{}}}});
 const b=boot({mahalino_v32:raw});assert.equal(b.c.S.wfs.length,1);assert.deepEqual(plain(b.c.S.wfs[0].data),{});
 assert.equal(b.c.S.chats.length,1);assert.ok(Array.isArray(b.c.S.chats[0].hist));assert.equal(b.c.S.contracts[0].code,'valid');
 assert.ok(Array.isArray(b.c.S.ctx30ByChat.c.log));b.c.save();assert.equal(JSON.parse(b.data.mahalino_v32_recovery)[0].raw,raw);
 const backup=b.data.mahalino_v32_recovery;const next=boot(b.data);next.c.save();assert.equal(next.data.mahalino_v32_recovery,backup);
});
