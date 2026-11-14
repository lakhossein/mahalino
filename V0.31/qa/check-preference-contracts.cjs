'use strict';
const assert=require('node:assert/strict'),runtime=require('./guide-runtime.cjs');
const seed=runtime('rent'),registry=seed.c.E30.guide.registry;
const answers={budget_pair:'ودیعه ۱ میلیارد تومان و اجاره ۱۰ میلیون تومان',persona:'خانواده',household:'دو نفره',hood:'نارمک',m2:'۸۵',rooms:'۲',prop_age:'۵ تا ۱۰ سال',floor_preference:'طبقه ۲ تا ۴ الزامی',prefs:'پارکینگ الزامی',work_loc:'نارمک',uni_loc:'نارمک',work_weight:'هر دو',buy_budget:'۲۰ میلیارد تومان',budget_scope:'کل هزینه معامله',prop_new:'تا ۵ سال',timeline:'دو ماه دیگر',purpose:'سکونت',invest_objective:'هدف درآمد اجاره',invest_capital:'۳۰ میلیارد تومان',invest_horizon:'۵ سال',invest_liquidity:'نقدشوندگی بالا',invest_risk:'ریسک متوسط',prop_area:'۸۵',prop_rooms:'۲',ownership:'شخصی',docs:'تک برگ',sale_motivation:'مهاجرت',sale_urgency:'عجله ندارم',expected_price:'۲۰ میلیارد تومان',min_price:'۱۸ میلیارد تومان',listing_intent:'فقط مشاوره قیمت'};
function flow(slot){return slot.startsWith('invest_')?'invest':['buy_budget','budget_scope','purpose'].includes(slot)?'buy':['prop_area','prop_rooms','ownership','docs','sale_motivation','sale_urgency','expected_price','min_price'].includes(slot)?'sell':slot==='listing_intent'?'landlord':'rent'}
let checked=0;
for(const entry of registry){
  assert(/^[a-z-]+$/.test(entry.id),'invalid runtime registry id: '+entry.id);
  if(!entry.action.startsWith('preference:'))continue;
  const slot=entry.action.split(':')[1];assert(answers[slot],'missing executable answer for '+slot);
  for(const skip of [false,true]){
    const r=runtime(flow(slot)),api=r.c.E30.discAPI,g=r.c.E30.guide;
    assert(api.canPreference(slot));assert.equal(g.route(entry.prompt),true);
    assert(api.collector().expecting,'registered preference failed to ask: '+entry.id);
    if(skip){assert.equal(g.route(g.actions['skip-preference'].prompt),true);assert.equal(api.collector().expecting,null)}
    else{
      api.route(answers[slot]);
      assert(api.getF(slot==='budget_pair'?'budget_dep':slot)!=null,'valid preference answer was lost: '+slot);
    }
    // A recorded/skipped preference must still permit a useful in-chat result.
    if(flow(slot)==='rent'||flow(slot)==='buy'){r.run();assert(r.messages.at(-1).includes('آگهی‌های منطبق با اطلاعات فعلی:')&&(r.shown.length>0||r.messages.at(-1).includes('آگهی منطبق پیدا نشد')),'preference prevented an honest search output: '+slot)}
    assert.equal(r.c.S.tokens,500,'preference charged credit: '+slot);
  }
  checked++;
}
for(const slot of ['children','occupation','life_stage','prop_age_range','prefRules'])assert.equal(seed.c.E30.discAPI.canPreference(slot),false,'unimplemented question registered: '+slot);
assert.equal(seed.c.E30.guide.canSuggest('need-work-loc'),false,'work prompt advertised without explicit commute context');
console.log('PASS actual preference registry: '+checked+' prompts accept valid answers and skips without blocking output or charging');
