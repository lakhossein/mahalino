'use strict';
const assert=require('node:assert/strict'),runtime=require('./guide-runtime.cjs');
const r=runtime('invest'),c=r.c;
c.SCRIPTS={buy:[{id:'buy_ctr'}]};c.MODBY={};c.FRC={};c.WSTEPS={};c.window=c;
c.E30.flowsAPI.install();
for(const id of ['s_rooms','s_age','s_floor','s_motiv','s_urg']){
  const step=c.SCRIPTS.sell.find(s=>s.id===id);
  assert.equal(step.pre({optionalNeedsSkipped:true}),false,'skipped seller preference asked again: '+id);
  assert.equal(step.pre({}),true,'explicit seller refinement was removed: '+id);
}
const area=c.SCRIPTS.sell.find(s=>s.id==='s_area'),property={};
assert.equal(area.set(property,'۸۵'),null);assert.equal(property.prop_area,85);
assert.equal(area.set(property,'نامعتبر'),'ERR');
assert.equal(area.pre({_e30:1,prop_area:90}),false,'confirmed discovery area must not be asked again');
assert.equal(area.pre({_e30:1}),true,'missing area remains a valuation prerequisite');
assert.equal(c.SCRIPTS.sell.find(s=>s.id==='s_hood').pre({_e30:1,hood:'h1'}),false);
const report=c.E30.flowsAPI.investCard({optionalNeedsSkipped:true});
assert(report.includes('نوع دارایی مشخص نشده'));
assert(!report.includes('بازده ناخالص سالانهٔ نمونه'),'missing asset produced invented personal yield');
for(const id of ['l_rules','l_stay_rules']){
  const step=c.SCRIPTS.lndl.find(s=>s.id===id),type=id==='l_rules'?'res':'stay';
  assert.equal(step.pre({optionalNeedsSkipped:true,ltype:type}),false);
  assert.equal(step.pre({ltype:type}),true);
}
const summary=c.SCRIPTS.lndl.find(s=>s.id==='l_sum');
assert(summary.q({ltype:'res'}).includes('مشخص نشده'));
assert(summary.q({ltype:'res',rules:[]}).includes('ندارد'));
assert(summary.q({ltype:'stay'}).includes('مشخص نشده'));
assert(summary.q({ltype:'stay',stayRules:[]}).includes('ندارد'));
console.log('PASS optional service reports: no repeated skipped details, no invented asset yield, unknown vs explicit empty rules');

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../Mahalino+V0.31.html'),'utf8');
vm.runInContext(html.match(/var SLIST=\[[\s\S]*?\];/)[0],c);
for(const city of ['تهران','شیراز','رامسر']){
 const expected=c.SLIST.filter(x=>x.city===city).map(x=>x.id);
 assert.deepEqual(Array.from(c.stayList(city),x=>x.id),Array.from(expected));
}
for(const city of ['مشهد','ساری','ناموجود',''])assert.equal(c.stayList(city).length,0,'unavailable city substituted unrelated accommodation: '+city);
assert.equal(c.stayList(' شيراز ').length,1);
console.log('PASS accommodation city inventory: exact sample identities, normalized input, honest empty results');

const stayStart=html.indexOf('SCRIPTS.stay=['),stayEnd=html.indexOf('var CBACT={}',stayStart);
vm.runInContext(html.slice(stayStart,stayEnd),c);c.pd=v=>String(v);c.esc=v=>String(v);c.RVS=0;
c.E30.flowsAPI.install();
const nights=c.SCRIPTS.stay.find(s=>s.id==='ngt'),rating=c.SCRIPTS.stay.find(s=>s.id==='rev');
for(const value of ['0','-1','91','2.5','abc']){const d={nights:3};assert.equal(nights.set(d,value),'ERR');assert.equal(d.nights,3)}
assert.equal(nights.set({},'90'),null);
for(const value of ['0','-1','6','1.5','abc']){c.RVS=4;assert.equal(rating.set({},value),'ERR');assert.equal(c.RVS,4)}
assert.equal(rating.set({},'5'),null);assert.equal(c.RVS,5);
const missing=c.SCRIPTS.stay.find(s=>s.id==='list').q({city:'مشهد'});assert(missing.includes('موجود نیست'));assert(!missing.includes('تهران'));
console.log('PASS stay inputs: invalid nights/ratings preserve prior values; absent destination has explicit empty message');
