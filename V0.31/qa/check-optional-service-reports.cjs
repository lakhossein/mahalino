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
