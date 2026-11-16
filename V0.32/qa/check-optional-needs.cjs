'use strict';
const assert=require('node:assert/strict'),runtime=require('./guide-runtime.cjs');
for(const flow of ['rent','buy']){
  const r=runtime(flow),api=r.c.E30.discAPI,g=r.c.E30.guide;
  assert.equal(api.collector().expecting,null,'entry forced a preference question');
  assert.equal(api.collector().optional,true);
  const first=Array.from(g.suggestions(),x=>x.id);
  assert.deepEqual(first.slice(0,4),flow==='rent'?['rent-budget','need-hood','need-persona','need-household']:['need-buy-budget','need-purpose','need-persona','need-household']);
  assert(first.includes('sample'),'search output was gated behind preference collection');
  let previous=Infinity;
  for(let turn=0;turn<40;turn++){
    const prefs=g.suggestions().filter(x=>x.action.startsWith('preference:'));
    if(!prefs.length)break;
    const remaining=api.missing(flow).length;assert(remaining<previous,'skipping optional preferences entered a no-progress loop');previous=remaining;
    assert.equal(g.route(prefs[0].prompt),true);
    assert(api.collector().expecting,'choosing a preference failed to open its question');
    assert.equal(g.route(g.actions['skip-preference'].prompt),true);
  }
  assert.equal(api.missing(flow).length,0,'not every offered preference could be skipped');
  r.run();assert(r.shown.length>0,'skipping every preference blocked a successful search');
  assert.equal(api.getF('work_loc'),null);assert.equal(api.getF('children'),null);
}
const person=runtime('rent'),p=person.c.E30.discAPI,g=person.c.E30.guide;
assert.equal(g.route(g.actions['need-persona'].prompt),true);
p.route('خانواده');
assert.equal(p.getF('persona'),'family');assert.equal(p.getF('household'),null);assert.equal(p.getF('children'),null);
assert(p.missing('rent').some(x=>x.id==='household'),'persona silently filled household composition');
const ages=runtime('rent'),a=ages.c.E30.discAPI;
a.preference('prop_age');a.route('ورودی نامعتبر');assert.equal(a.collector().expecting,'prop_age');assert.equal(a.getF('prop_age'),null);
a.route('۵ تا ۱۰ سال');assert.equal(a.getF('prop_age'),10);assert.deepEqual(Array.from(a.getF('prop_age_range')),[5,10]);
ages.run();assert(ages.shown.length>0&&ages.shown.every(x=>x.age>=5&&x.age<=10));
a.preference('prop_age');a.route('مهم نیست');assert.equal(a.getF('prop_age'),null);assert.equal(a.getF('prop_age_range'),null);
const words=runtime('rent');words.c.E30.discAPI.route('حداقل دو خواب');assert.equal(words.c.E30.discAPI.getF('rooms'),2);
const commute=runtime('rent');commute.c.E30.discAPI.route('نزدیکی به محل کار برایم مهم است.');
assert(commute.c.E30.discAPI.missing('rent').some(x=>x.id==='work_loc'),'explicit work commute context did not enable its optional preference');
const keep=runtime('rent');keep.set('budget_dep',{v:[5e9,5e9]});keep.set('budget_rent',{v:[2e8,2e8]});
keep.c.E30.discAPI.preference('budget_pair');keep.c.E30.discAPI.route('رد');
assert.equal(keep.c.E30.discAPI.getF('budget_dep').v[1],5e9);assert.equal(keep.c.E30.discAPI.getF('budget_rent').v[1],2e8);
for(const flow of ['sell','invest','landlord']){
  const r=runtime(flow);r.c.E30.discAPI.start(flow,false);
  assert.equal(r.c.E30.discAPI.collector().expecting,null,flow+' forced its discovery questionnaire');
  assert(r.c.E30.guide.suggestions().some(x=>x.id==='start-service'));
  let previous=Infinity;
  for(let turn=0;turn<30;turn++){
    const next=r.c.E30.guide.suggestions().find(x=>x.action.startsWith('preference:'));
    if(!next)break;
    const count=r.c.E30.discAPI.missing(flow).length;assert(count<previous,flow+' optional prompts looped');previous=count;
    assert.equal(r.c.E30.guide.route(next.prompt),true,flow+' preference handler missing');
    assert.equal(r.c.E30.guide.route(r.c.E30.guide.actions['skip-preference'].prompt),true);
  }
  assert.equal(r.c.E30.discAPI.missing(flow).length,0,flow+' preferences could not all be skipped');
}
console.log('PASS optional needs: priorities, all-preference skips, successful search, persona independence, age correction and retained money');
