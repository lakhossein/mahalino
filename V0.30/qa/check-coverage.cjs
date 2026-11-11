/* Enforces 25-item §19.1 traceability without confusing check count with coverage. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,dir=process.env.QA_RESULTS_DIR||path.join(root,'results');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'coverage-v030.json'),'utf8'));
const evidence=new Map();
function add(id,result,source){
  const previous=evidence.get(id);
  if(previous&&previous.result==='FAIL')return;
  evidence.set(id,{result,source});
}
function parseJson(file){
  const full=path.join(dir,file);
  if(!fs.existsSync(full))return null;
  return JSON.parse(fs.readFileSync(full,'utf8'));
}
for(const [filename,kind] of [['acceptance-results.json','acceptance'],['scenarios-results.json','scenarios'],
  ['full-journeys-results.json','browser-journeys']]){
  const data=parseJson(filename);
  for(const t of Array.isArray(data)?data:[])if(t.id)add(t.id,t.result,kind);
}
const reg=parseJson('regression-results.json');
for(const t of reg&&reg.tests||[]){
  const id=t.name&&t.name.match(/^R\d+/);
  if(id)add(id[0],t.pass?'PASS':'FAIL','regressions');
}
for(const [file,source] of [['e2e-functional.js.log','functional'],['e2e-conversational.js.log','conversational']]){
  const full=path.join(dir,file);
  if(!fs.existsSync(full))continue;
  for(const m of fs.readFileSync(full,'utf8').matchAll(/\s([✓✗])\s+((?:T|U|P|C)\d+(?:\.\d+)?[a-z]?)[^\n]*/g)){
    add(m[2],m[1]==='✓'?'PASS':'FAIL',source);
  }
}
const problems=[];
const rows=manifest.requirements||[];
const ids=rows.map(x=>x.id);
if(rows.length!==25||ids.some((x,i)=>x!==i+1))problems.push('Manifest must enumerate all 25 §19.1 requirements exactly once in order');
for(const requirement of rows){
  const mapped=(requirement.evidence||[]).map(id=>({id,...(evidence.get(id)||{result:'NOT_RUN'})}));
  const passing=mapped.filter(x=>x.result==='PASS');
  const fullyCovered=requirement.status==='automated'&&mapped.length>0&&passing.length===mapped.length;
  if(!fullyCovered){
    problems.push(`#${requirement.id} ${requirement.name}: ${requirement.status}; ${requirement.gap||'some assertions failed/missing'}; evidence=${mapped.map(x=>x.id+':'+x.result).join(',')}`);
  }
}
const result={policy:manifest.policy,requirements:rows.length,fullyAutomatedAndPassing:rows.length-problems.length,releaseApproved:problems.length===0,problems};
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'coverage-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(problems.length){
  console.error('COVERAGE GATE FAILED: a green test suite alone does not authorize release when mandatory scenarios are partial/unverified.');
  process.exitCode=1;
}
