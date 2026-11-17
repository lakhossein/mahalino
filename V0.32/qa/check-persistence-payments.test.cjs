'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {test}=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let util=fs.readFileSync(path.join(root,'src/legacy/utilities.js'),'utf8').replace('/* @mahalino:v32-state-codec-js */',()=>fs.readFileSync(path.join(root,'src/v32-state-codec.js'),'utf8'));
const core=fs.readFileSync(path.join(root,'src/v32-payment.js'),'utf8');
const a=core.indexOf('E30.pay=(function(){');let pay=core.slice(a,core.indexOf('\n})();',a)+7);
if(process.env.QA_PAYMENT_BASELINE==='1'){pay=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/reliability-baselines.json'))).find(x=>x.file==='v32-payment.js').original+'\n})();';util=require('node:child_process').execFileSync('git',['show','f04b1f5:V0.32/src/legacy/utilities.js'],{cwd:root,encoding:'utf8'})}
function harness(balance=100,data=new Map(),fail=()=>false,lockRequest=null){
 if(!data.has('mahalino_v32'))data.set('mahalino_v32',JSON.stringify({tokens:balance,log:[]}));
 let calls=0,writes=0;const msgs=[];
 const c={window:{addEventListener(){}},console:{warn(){},error(){}},Date,Math,
 localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){if(fail(k,v))throw Error('quota');data.set(k,v);writes++}},
 document:{addEventListener(){},querySelectorAll(){return []}},closeModal(){},CBACT:{},E29:{pay:{},bus:{emit(){}}},E30:{PRICING:{qa:{cost:10}},price:()=>10,uid:()=> 'txn'},renderTok(){},toast:t=>msgs.push(t),usrC(){},botC(){},fa:String,$:()=>null};
 if(lockRequest)c.navigator={locks:{request:lockRequest}};
 vm.runInNewContext(util.slice(util.indexOf('/* 2) state */')),c);vm.runInNewContext(pay,c);
 c.S.paySession={payId:'q',key:'qa',cost:10,title:'QA',state:'presented',_cb:()=>{calls++;return true}};
 return {c,data,msgs,calls:()=>calls,writes:()=>writes};
}
test('quota at debit cannot execute callback or persist debit',()=>{
 const b=harness(100,new Map(),(k,v)=>k==='mahalino_v32'&&JSON.parse(v).tokens<100);
 assert.equal(b.c.E30.pay.go('q'),false);assert.equal(b.calls(),0);assert.equal(b.c.S.tokens,100);assert.equal(b.c.S.log.length,0);assert.equal(JSON.parse(b.data.get('mahalino_v32')).tokens,100);
});
test('quota before validation cannot execute callback',()=>{
 const b=harness(100,new Map(),()=>true);assert.equal(b.c.E30.pay.go('q'),false);assert.equal(b.calls(),0);
});
test('refund persistence failure rolls back credit and does not claim success',()=>{
 const b=harness(90,new Map(),(k,v)=>JSON.parse(v).tokens>90);
 assert.equal(b.c.E30.pay.refund('t','qa',10,'test','q'),false);assert.equal(b.c.S.tokens,90);assert.equal(b.c.S.log.length,0);assert.equal(JSON.parse(b.data.get('mahalino_v32')).tokens,90);
});
test('successful debit completes once and survives reload',()=>{
 const b=harness();assert.equal(b.c.E30.pay.go('q'),true);assert.equal(b.calls(),1);assert.equal(JSON.parse(b.data.get('mahalino_v32')).tokens,90);
 assert.equal(b.c.E30.pay.go('q'),false);assert.equal(b.calls(),1);
});
test('sequential stale tab cannot overwrite first tab data',()=>{
 const data=new Map();const first=harness(100,data),second=harness(100,data);
 first.c.S.tokens=75;assert.equal(first.c.save(),true);second.c.S.tokens=50;assert.equal(second.c.save(),false);assert.equal(JSON.parse(data.get('mahalino_v32')).tokens,75);
});
test('unchanged save skips setItem',()=>{
 const b=harness();b.c.save();const n=b.writes();assert.equal(b.c.save(),true);assert.equal(b.writes(),n);
});

test('unusable lock API falls back to guarded synchronous storage rather than disabling standalone saves',async()=>{
 const b=harness(100,new Map(),()=>false,()=>Promise.reject(Object.assign(Error('unavailable'),{name:'SecurityError'})));
 await new Promise(setImmediate);b.c.S.tokens=80;assert.equal(b.c.save(),true);assert.equal(JSON.parse(b.data.get('mahalino_v32')).tokens,80);
});
