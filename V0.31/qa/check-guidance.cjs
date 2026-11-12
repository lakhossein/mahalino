/* V0.31 deterministic prompt registry: structural and security acceptance. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','src','v31-guidance.js'),'utf8');
const ctx={E30:{}};
vm.runInNewContext(src,ctx,{filename:'v31-guidance.js',timeout:3000});
const reg=ctx.E30.guide.registry;
assert(Array.isArray(reg)&&reg.length>=20,'global catalog must cover all material scenarios');
const ids=new Set(),phrases=new Set(),actions=new Set();
for(const r of reg){
  assert(r&&typeof r.id==='string'&&/^[a-z-]+$/.test(r.id),'invalid id');
  assert(!ids.has(r.id),'duplicate scenario id '+r.id);ids.add(r.id);
  assert(r.title&&r.prompt&&r.group&&r.result&&r.action&&r.test,'incomplete scenario '+r.id);
  assert(Array.isArray(r.slots)&&Array.isArray(r.next),'scenario lacks inputs/continuations '+r.id);
  assert(Array.isArray(r.aliases),'scenario lacks aliases '+r.id);
  assert(!/پرداخت موفق|ثبت قطعی قرارداد|داده زنده/.test(r.result),'unsupported outcome '+r.id);
  for(const p of [r.prompt,...r.aliases]){
    const n=ctx.E30.guide.normalize(p);
    assert(n.length>=5,'unusable phrase '+r.id);
    assert(!phrases.has(n),'ambiguous prompt '+p);phrases.add(n);
  }
  actions.add(r.action);
}
for(const r of reg)for(const id of r.next)assert(ids.has(id),'broken next node '+r.id+' -> '+id);
for(const group of ['search','neighborhood','seller','investment','contract','services','library','productivity','special'])
  assert(reg.some(x=>x.group===group),'uncovered scenario family '+group);
for(const action of ['discover:rent','discover:buy','discover:sell','discover:invest','compare','map','valuation','contracts','services','native'])
  assert(actions.has(action),'required dispatcher missing '+action);
assert(!/fetch\s*\(|XMLHttpRequest|openai\.|chatgpt|apiKey/i.test(src),'guide must not depend on AI or remote APIs');
assert(src.includes('data-cba="e31Prefill"')&&src.includes('input.value=r.prompt'),'suggested prompts must populate the chat composer');
console.log('PASS deterministic guidance registry: '+reg.length+' scenarios, '+phrases.size+' recognized phrases, '+actions.size+' dispatch types');
