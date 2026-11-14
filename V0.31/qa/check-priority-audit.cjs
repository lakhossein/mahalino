/* Independent §7/§8 gate; historical §19.1 coverage remains unchanged. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=__dirname;
function sourceRows(markdown){
 const section=markdown.split('## ۷.')[1]?.split('## ۸.')[0];
 const scenarios=markdown.split('## ۸.')[1]?.split('## ۹.')[0];
 if(!section||!scenarios)throw Error('Audit §7/§8 source sections missing');
 let flow;const steps=[];
 for(const line of section.split('\n')){
  const heading=line.match(/^### (\w+) —/);if(heading)flow=heading[1];
  if(flow&&line.startsWith('| `')){
   const cells=line.split('|').slice(1,-1).map(x=>x.trim());
   steps.push({flow,legacy_step_id:[...cells[0].matchAll(/`([^`]+)`/g)].map(x=>x[1]).join('+')});
  }
 }
 return {steps,scenarios:[...scenarios.matchAll(/^\| `([^`]+)`/gm)].map(x=>x[1])};
}
function validate(manifest,markdown,report,revision){
 const nonempty=v=>typeof v==='string'?v.trim().length>0:Array.isArray(v)?v.length>0:v!==null&&typeof v==='object'&&Object.keys(v).length>0;
 const problems=[],source=sourceRows(markdown),steps=manifest.steps||[],scenarios=manifest.scenarios||[];
 const issue=(id,message)=>problems.push({id,message});
 if(manifest.schemaVersion!==1)issue('manifest','Unsupported schemaVersion');
 function inventory(actual,expected,label){
  if(actual.length!==expected.length||new Set(actual).size!==actual.length||expected.some(x=>!actual.includes(x)))issue(label,'Must enumerate every source row exactly once, including combined budgets, persona and retired rows');
 }
 inventory(steps.map(x=>x.flow+':'+x.legacy_step_id),source.steps.map(x=>x.flow+':'+x.legacy_step_id),'steps');
 inventory(scenarios.map(x=>x.scenario_id),source.scenarios,'scenarios');
 if(source.steps.length!==125||source.scenarios.length!==25)issue('source','Expected 125 §7 rows and 25 §8 scenarios; review source changes explicitly');
 if(!revision)issue('evidence','Cannot establish tested revision');
 if(!report||report.schemaVersion!==1||report.revision!==revision)issue('evidence','Missing browser evidence or revision differs from tested checkout');
 const evidence=new Map();
 for(const item of report?.tests||[]){
  if(!item.id||evidence.has(item.id)){issue('evidence','Missing or duplicate test ID');continue}
  evidence.set(item.id,item);
 }
 const ids=new Set();
 function checkRow(row,id,fields,refs,phases){
  if(ids.has(id))issue(id,'Duplicate row ID');ids.add(id);
  for(const field of fields)if(!nonempty(row[field]))issue(id,'Missing contract field: '+field);
  if(!['unverified','missing','failed','automated'].includes(row.status))issue(id,'Invalid status');
  if(row.status!=='automated')issue(id,'Coverage '+row.status+': '+(row.reason||'no reason recorded'));
  if(!nonempty(row.reason))issue(id,'Record status reason and automation provenance');
  const references=row[refs];
  if(!Array.isArray(references)||!references.length){issue(id,'No mapped browser evidence');return}
  if(new Set(references).size!==references.length)issue(id,'Duplicate evidence references');
  const covered=new Set();
  for(const ref of references){
   const e=evidence.get(ref);
   if(!e||e.result!=='PASS'||e.surface!=='browser-ui'||!Array.isArray(e.covers)||!e.covers.includes(id)){
    issue(id,'Missing/failed/non-UI evidence: '+ref);continue;
   }
   if(!Array.isArray(e.assertions)||!e.assertions.length||e.assertions.some(a=>!nonempty(a.name)||a.pass!==true)){
    issue(id,'Missing or failing assertions: '+ref);continue;
   }
   if(!Array.isArray(e.trace)||!e.trace.length||e.trace.some(t=>!nonempty(t.state)||!nonempty(t.action)||!nonempty(t.next_state))){
    issue(id,'Incomplete state/action/transition trace: '+ref);continue;
   }
   for(const phase of e.phases||[])if(phases.includes(phase))covered.add(phase);
  }
  for(const phase of phases)if(!covered.has(phase))issue(id,'Unverified path: '+phase);
 }
 const stepFields=['entry_state','preconditions','input_cases','handler','expected_transition','terminal_state'];
 const scenarioFields=['visible_when','not_visible_when','selected_action','outcome','success_path','empty_data_path','cancel_path','resume_path'];
 for(const row of steps){
  const id='step:'+row.flow+':'+row.legacy_step_id;
  if(!['optional-need','service','gate','retired'].includes(row.kind))issue(id,'Invalid kind');
  if(row.kind==='retired'&&!nonempty(row.retirement_reason))issue(id,'Retirement requires source rationale and no-route assertions');
  const phases=row.kind==='retired'?['route-absent']:row.kind==='optional-need'?['answer','skip','edit','service-terminal','reload']:['success','empty-data','cancel','resume'];
  checkRow(row,id,stepFields,'evidence_ids',phases);
 }
 for(const row of scenarios)checkRow(row,'scenario:'+row.scenario_id,scenarioFields,'test_ids',['visible','hidden','composer-prefill','composer-send','success','empty-data','cancel','resume']);
 return {schemaVersion:1,revision,steps:steps.length,scenarios:scenarios.length,releaseApproved:problems.length===0,problems};
}

if(require.main===module){
 const dir=process.env.QA_RESULTS_DIR||path.join(root,'results');
 fs.mkdirSync(dir,{recursive:true});
 try{
  let revision=process.env.GITHUB_SHA||process.env.QA_AUDIT_REVISION;
  if(!revision){try{revision=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}catch{}}
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'priority-audit-coverage-v031.json'),'utf8'));
  const markdown=fs.readFileSync(path.join(root,'../Mahalino_V031_Questions_Priority_Audit.md'),'utf8');
  const evidencePath=path.join(dir,'priority-audit-evidence.json');
  const report=fs.existsSync(evidencePath)?JSON.parse(fs.readFileSync(evidencePath,'utf8')):null;
  const result=validate(manifest,markdown,report,revision);
  fs.writeFileSync(path.join(dir,'priority-audit-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({steps:result.steps,scenarios:result.scenarios,releaseApproved:result.releaseApproved,problems:result.problems.length}));
  if(!result.releaseApproved){console.error('PRIORITY AUDIT GATE FAILED: see priority-audit-results.json; unverified coverage cannot authorize release.');process.exitCode=1}
 }catch(error){
  fs.writeFileSync(path.join(dir,'priority-audit-results.json'),JSON.stringify({releaseApproved:false,error:String(error)})+'\n');
  console.error(error);process.exitCode=1;
 }
}
module.exports={sourceRows,validate};
