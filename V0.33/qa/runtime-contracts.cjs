'use strict';
const fs=require('node:fs'),path=require('node:path');
// Parser/traversal are from the pinned Playwright QA toolchain; product has no parser dependency.
const {babelParse,traverse}=require(path.join(path.dirname(require.resolve('playwright/package.json')),'lib/transform/babelBundle.js'));
function inventory(root){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
 const parsed=new Map(),owners={};
 for(const [slot,file] of Object.entries(manifest.slots)){
  const source=fs.readFileSync(path.join(root,file),'utf8'),entry={slot,file,exports:[],imports:[],writes:[],includes:[...source.matchAll(/\/\* @mahalino:([a-z0-9-]+) \*\//g)].map(m=>m[1])};
  let ast=null;if(file.endsWith('.js')){
   ast=babelParse(source,file);
   traverse(ast,{Program(p){entry.exports=Object.keys(p.scope.bindings).sort()},AssignmentExpression(p){const n=p.node.left;if(n.type==='MemberExpression'&&!n.computed&&n.object.type==='Identifier'&&n.object.name==='window'&&n.property.type==='Identifier')entry.exports.push(n.property.name)}});
   entry.exports=[...new Set(entry.exports)].sort();
   for(const name of entry.exports)(owners[name]??=[]).push(slot);
  }
  parsed.set(slot,{entry,ast});
 }
 function memberName(n){if(n.type==='Identifier')return n.name;if(n.type==='MemberExpression'){const base=memberName(n.object);return base?base+'.'+(n.computed?'*':n.property.name):null}return null}
 for(const {entry,ast} of parsed.values())if(ast){
  const dependencies=new Set(),writes=new Set();
  traverse(ast,{ReferencedIdentifier(p){const name=p.node.name;if(!p.scope.hasBinding(name)&&owners[name])dependencies.add(name)},AssignmentExpression(p){const left=memberName(p.node.left),base=left?.split('.')[0];if(base&&owners[base])writes.add(left)}});
  entry.imports=[...dependencies].sort().map(name=>({name,owners:owners[name]}));entry.writes=[...writes].sort();
 }
 const loadOrder=[];
 function expand(file){const source=fs.readFileSync(path.join(root,file),'utf8');for(const m of source.matchAll(/\/\* @mahalino:([a-z0-9-]+) \*\//g)){loadOrder.push(m[1]);expand(manifest.slots[m[1]])}}
 expand(manifest.entry);
 return {contract:'Explicit compatibility globals; imports resolve to declared owner slots. No claim of ES-module isolation.',loadOrder,modules:[...parsed.values()].map(x=>x.entry)};
}
// V0.33 reviews only its own changes against the unchanged V0.32 snapshot.
// Reconstruct the complete reviewed contract, then compare all fields exactly.
function applyReviewedDelta(baseline,delta){
 const assert=require('node:assert/strict'),expected=structuredClone(baseline);
 const seen=new Set();
 for(const patch of delta.modules){
  const module=expected.modules.find(x=>x.slot===patch.slot);
  assert(module&&!seen.has(patch.slot),'unknown or duplicate delta slot: '+patch.slot);seen.add(patch.slot);
  for(const [key,change] of Object.entries(patch)){
   if(key==='slot')continue;
   if(key==='includes'){module[key]=change;continue}
   assert(['exports','imports','writes'].includes(key),'unknown delta field: '+key);
   const names=x=>key==='imports'?x.name:x,items=new Map(module[key].map(x=>[names(x),x]));
   for(const x of change.remove||[]){assert.deepEqual(items.get(names(x)),x,'unmatched removal: '+names(x));items.delete(names(x))}
   for(const x of change.add||[]){assert(!items.has(names(x)),'duplicate addition: '+names(x));items.set(names(x),x)}
   module[key]=[...items.keys()].sort().map(x=>items.get(x));
  }
 }
 if(Object.hasOwn(delta,'loadOrder'))expected.loadOrder=delta.loadOrder;
 return expected;
}
// Deterministic evidence for review; this never accepts or writes a baseline.
function reviewedDelta(actual,baseline){
 const assert=require('node:assert/strict');
 assert.equal(actual.contract,baseline.contract);
 assert.deepEqual(actual.modules.map(x=>[x.slot,x.file]),baseline.modules.map(x=>[x.slot,x.file]));
 const modules=[];
 for(let i=0;i<actual.modules.length;i++){
  const a=actual.modules[i],b=baseline.modules[i],patch={slot:a.slot};
  for(const key of ['exports','imports','writes']){
   const add=a[key].filter(x=>!b[key].some(y=>JSON.stringify(x)===JSON.stringify(y)));
   const remove=b[key].filter(x=>!a[key].some(y=>JSON.stringify(x)===JSON.stringify(y)));
   if(add.length||remove.length)patch[key]={...(add.length?{add}:{}),...(remove.length?{remove}:{})};
  }
  if(JSON.stringify(a.includes)!==JSON.stringify(b.includes))patch.includes=a.includes;
  if(Object.keys(patch).length>1)modules.push(patch);
 }
 const delta={modules};
 if(JSON.stringify(actual.loadOrder)!==JSON.stringify(baseline.loadOrder))delta.loadOrder=actual.loadOrder;
 assert.deepEqual(applyReviewedDelta(baseline,delta),actual,'unrepresentable runtime contract difference');
 return delta;
}
function reviewedInventory(root){
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'../docs/validation/runtime-dependencies.json')));
 const delta=JSON.parse(fs.readFileSync(path.join(root,'qa/fixtures/runtime-dependencies-delta.json')));
 return applyReviewedDelta(baseline,delta);
}
module.exports={inventory,reviewedDelta,reviewedInventory,applyReviewedDelta};
if(require.main===module){
 const root=path.resolve(__dirname,'..'),actual=inventory(root);
 if(process.argv.includes('--review-delta')){
  console.log('V033_CONTRACT_DELTA '+JSON.stringify(reviewedDelta(actual,reviewedInventory(root))));
  const sites=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/diagnostic-sites.json')));
  console.log('V033_MISSING_DIAGNOSTICS '+JSON.stringify(sites.filter(site=>!fs.readFileSync(path.join(root,'src',site.file),'utf8').includes(site.statement)).map(site=>site.code)));
 }else console.log(JSON.stringify(actual,null,2));
}
