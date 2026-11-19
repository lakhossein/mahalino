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
module.exports={inventory};
if(require.main===module)console.log(JSON.stringify(inventory(path.resolve(__dirname,'..')),null,2));
