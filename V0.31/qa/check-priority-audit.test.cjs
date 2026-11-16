/* Validator fixtures exercise the gate, not application/browser coverage. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sourceRows,validate}=require('./check-priority-audit.cjs');
const doc=fs.readFileSync(path.join(__dirname,'../Mahalino_V031_Questions_Priority_Audit.md'),'utf8');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'priority-audit-coverage-v031.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
const revision='fixture-revision';
function fixture(){
 const manifest=clone(original),report={schemaVersion:1,revision,tests:[]};
 for(const row of manifest.steps.concat(manifest.scenarios)){
  const scenario=!!row.scenario_id,id=scenario?'scenario:'+row.scenario_id:'step:'+row.flow+':'+row.legacy_step_id;
  const phases=scenario?['visible','hidden','composer-prefill','composer-send','success','empty-data','cancel','resume']:
   row.kind==='retired'?['route-absent']:row.kind==='optional-need'?['answer','skip','edit','service-terminal','reload']:['success','empty-data','cancel','resume'];
  row.status='automated';row.reason='Synthetic validator fixture only; never application evidence';
  row[scenario?'test_ids':'evidence_ids']=[id];
  report.tests.push({id,result:'PASS',surface:'browser-ui',covers:[id],phases,
   assertions:[{name:'synthetic assertion',pass:true}],
   trace:[{state:'fixture-start',action:'fixture-input',next_state:'fixture-terminal'}]});
 }
 return {manifest,report};
}
function result(f){return validate(f.manifest,doc,f.report,revision)}
test('source inventory retains 125 rows, 25 scenarios, combined budget, persona and retired rows',()=>{
 const rows=sourceRows(doc);
 assert.equal(rows.steps.length,125);assert.equal(rows.scenarios.length,25);
 assert.ok(rows.steps.some(x=>x.flow==='rent'&&x.legacy_step_id==='dep+rentb'));
 assert.ok(rows.steps.some(x=>x.flow==='rent'&&x.legacy_step_id==='persona'));
 assert.equal(original.steps.filter(x=>x.kind==='retired').length,13);
 assert.equal(result(fixture()).releaseApproved,true);
});
test('inventory cannot pass without current browser evidence',()=>{
 const r=validate(original,doc,null,revision);
 assert.equal(r.releaseApproved,false);
 assert.equal(r.verifiedRows,0);
 assert.ok(r.problems.some(x=>x.id==='evidence'&&x.message.includes('Missing browser evidence')));
});
test('an explicitly unmapped row cannot inherit coverage from other passing rows',()=>{
 const f=fixture();f.manifest.steps[0].evidence_ids=[];
 const r=result(f);assert.equal(r.releaseApproved,false);
 assert.ok(r.problems.some(x=>x.message.includes('No mapped browser evidence')));
});
test('automated label alone does not establish evidence',()=>{
 const f=fixture();f.report.tests=[];
 assert.equal(result(f).releaseApproved,false);
});
test('duplicate or omitted rows fail even when row count is unchanged',()=>{
 const f=fixture();f.manifest.steps[1]=clone(f.manifest.steps[0]);
 assert.equal(result(f).releaseApproved,false);
});
test('stale revision evidence fails',()=>{
 const f=fixture();f.report.revision='previous-revision';
 assert.equal(result(f).releaseApproved,false);
});
test('missing and failed statuses block release despite passing fixtures',()=>{
 for(const status of ['missing','failed','unverified']){
  const f=fixture();f.manifest.steps[0].status=status;
  assert.equal(result(f).releaseApproved,false);
 }
});
test('failed assertion, absent trace, wrong surface or wrong row mapping fail',()=>{
 for(const change of [
  e=>{e.assertions[0].pass=false},e=>{e.trace=[]},e=>{e.surface='vm'},
  e=>{e.covers=[]},e=>{e.result='FAIL'},e=>{e.assertions=[]}
 ]){
  const f=fixture();change(f.report.tests[0]);
  assert.equal(result(f).releaseApproved,false);
 }
});
test('duplicate evidence IDs cannot hide a failed execution',()=>{
 const f=fixture();f.report.tests.push({...f.report.tests[0],result:'FAIL'});
 assert.equal(result(f).releaseApproved,false);
});
test('every scenario requires composer send and every branch',()=>{
 const f=fixture(),e=f.report.tests.find(x=>x.id.startsWith('scenario:'));
 e.phases=e.phases.filter(x=>x!=='composer-send');
 assert.equal(result(f).releaseApproved,false);
});
test('retirement needs rationale and route absence, not deletion from inventory',()=>{
 const f=fixture(),row=f.manifest.steps.find(x=>x.kind==='retired');
 delete row.retirement_reason;
 assert.equal(result(f).releaseApproved,false);
 const g=fixture(),e=g.report.tests.find(x=>x.id.startsWith('step:invb:'));
 e.phases=[];
 assert.equal(result(g).releaseApproved,false);
});
test('empty contract fields are rejected',()=>{
 const f=fixture();f.manifest.scenarios[0].success_path=[];
 assert.equal(result(f).releaseApproved,false);
});

test('progress counts only rows with all required current evidence',()=>{
 const f=fixture();assert.equal(result(f).verifiedRows,150);
 f.report.tests[0].phases=[];
 const partial=result(f);assert.equal(partial.verifiedRows,149);assert.equal(partial.verifiedPercent,99.33);
 f.report.revision='stale';assert.equal(result(f).verifiedRows,0);
});
