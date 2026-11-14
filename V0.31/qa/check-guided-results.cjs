'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8');
const utilities=html.slice(html.indexOf('function fa(n,d)'),html.indexOf('function hoodFromText('));
function runtime(flow){
  let seq=0;const shown=[],messages=[];
  const c=vm.createContext({S:{auth:{name:'QA'},tokens:500},E30:{uid:()=>String(++seq)},CBACT:{},CE:{f:null},CURRENT:'landing',
    save(){},usrC(){},botC:h=>messages.push(h),
    chatListCard:x=>{shown.push(x);return '<article class="pcard" data-l="'+x.id+'"><button data-cba="selL">انتخاب</button></article>'},
    chatBCard:x=>{shown.push(x);return '<article class="pcard" data-l="'+x.id+'"><button data-cba="selB">انتخاب</button></article>'}});
  vm.runInContext(utilities,c);
  for(const name of ['HOODS','RLIST','BLIST']){
    const declaration=html.match(new RegExp('var '+name+'=\\[[\\s\\S]*?\\];'));
    assert(declaration,'missing actual sample dataset '+name);vm.runInContext(declaration[0],c);
  }
  for(const name of ['v31-intel.js','v31-flows.js','v31-guidance.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
  c.E30.discAPI.start(flow,true);
  return {c,shown,messages,set:(k,v)=>c.E30.discAPI.setF(k,v,{src:'answer',hard:true}),run:()=>{
    const before=JSON.stringify(c.E30.discAPI.ctx().fields);
    assert.equal(c.E30.guide.route(c.E30.guide.actions.sample.prompt),true);
    assert.equal(JSON.stringify(c.E30.discAPI.ctx().fields),before,'showing results changed explicit user constraints');
    assert.equal(c.S.tokens,500,'showing search results deducted credit');
    assert(!/data-cba="sel[LB]"/.test(messages.at(-1)),'a preview offered an action tied to an unrelated legacy step');
  }};
}
const impossible=runtime('rent');
impossible.set('hood','h8');impossible.set('budget_dep',{v:[12e9,12e9]});impossible.set('budget_rent',{v:[1e8,1e8]});
impossible.set('m2',60);impossible.set('rooms',1);impossible.run();
assert.equal(impossible.shown.length,0,'Enghelab example returned violating listings');
assert(/آگهی منطبق پیدا نشد/.test(impossible.messages.at(-1)),'zero matches lacked an honest explanation');
const matched=runtime('rent'),candidate=matched.c.RLIST.find(x=>x.id==='r5');
assert(candidate,'success fixture must exist');
matched.set('hood',candidate.hood);matched.set('budget_dep',{v:[candidate.dep,candidate.dep]});
matched.set('budget_rent',{v:[candidate.rent,candidate.rent]});matched.set('m2',candidate.m2);matched.set('rooms',candidate.beds);
matched.set('prop_age',candidate.age);matched.set('prefRules',{parking:'required'});matched.run();
assert(matched.shown.some(x=>x.id===candidate.id),'successful search failed to show its matching actual sample');
assert(matched.shown.every(x=>x.hood===candidate.hood&&x.dep<=candidate.dep&&x.rent<=candidate.rent&&x.m2>=candidate.m2&&x.beds>=candidate.beds&&x.age<=candidate.age&&x.park));
const absent=runtime('rent');absent.run();assert.equal(absent.shown.length,3,'missing optional preferences invented restrictive defaults');
assert(/ترجیحات اعلام‌نشده/.test(absent.messages.at(-1)));
const buy=runtime('buy'),b=buy.c.BLIST[0];
buy.set('hood',b.hood);buy.set('buy_budget',{v:[b.m2*b.ppm,b.m2*b.ppm]});buy.set('m2',b.m2);buy.set('rooms',b.beds);buy.run();
assert(buy.shown.some(x=>x.id===b.id),'purchase search did not use the purchase dataset');
assert(buy.shown.every(x=>x.m2*x.ppm<=b.m2*b.ppm&&x.hood===b.hood&&x.m2>=b.m2&&x.beds>=b.beds));
const forbidden=runtime('rent');forbidden.set('prefRules',{parking:'forbidden'});forbidden.run();
assert(forbidden.shown.length>0&&forbidden.shown.every(x=>!x.park),'forbidden amenity was ignored');
const missing=runtime('rent');missing.set('hood','unavailable');missing.run();assert.equal(missing.shown.length,0);
console.log('PASS guided rental/purchase results: strict constraints, zero results, absent preferences and unchanged context');
