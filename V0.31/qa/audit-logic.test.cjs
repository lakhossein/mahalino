'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
function app(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',(...e)=>errors.push(e.join(' ')));
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../Mahalino+V0.31.html'),'utf8'),{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.ResizeObserver=class{observe(){}disconnect(){}};w.CSS={escape:x=>x,supports:()=>false};w.fetch=()=>Promise.reject(Error('offline'))}});
 const w=dom.window;w.doLogin('QA');return {w,errors,close:()=>dom.window.close()};
}
function check(name,fn){test(name,()=>{const a=app();try{fn(a.w);assert.deepEqual(a.errors,[])}finally{a.close()}})}
const json=x=>JSON.parse(JSON.stringify(x));
const one=(w,t)=>{const n=w.HIST.length;w.ceSend(t);const items=w.HIST.slice(n);assert.equal(items.filter(x=>x.r==='user').length,1,t);assert.equal(items.filter(x=>x.r==='bot').length,1,t);return w.HIST.at(-1).h};
check('currency boundary defaults to toman, explicit rial is equivalent',w=>{
 for(const s of ['۱۰ میلیون','10 میلیون','١٠ میلیون'])assert.equal(w.parseMoneyFA(s).value,1e8);
 assert.equal(w.parseMoneyFA('۱۰۰ میلیون ریال').value,1e8);assert.equal(w.parseMoneyFA('100').value,1000);
 assert(w.rial(1e8).includes('۱۰٬۰۰۰٬۰۰۰ تومان'));
 const before=w.S.wallet;w.save();w.E30.discAPI.resume();assert.equal(w.S.wallet,before);
});
check('two amounts associate on both sides of labels, zero rent allowed',w=>{
 for(const s of ['بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.','ودیعه ۱.۲ میلیارد و اجاره ۱۰ میلیون'])assert.deepEqual(json(w.E30._dbg.finScan(s)),{dep:[12e9,12e9],rent:[1e8,1e8]});
 assert.equal(w.E30._dbg.finScan('ودیعه ۱ میلیارد و اجاره 0').rent[1],0);
});
check('entry gate has no work or school questions',w=>{
 assert.deepEqual(json(w.SCRIPTS.gate.map(x=>x.id)),['hello','menu']);w.ceStart('gate');w.ceVal('!pnow');assert.equal(w.SCRIPTS.gate[w.CE.i].id,'menu');
});
check('rental priorities match reviewed optional order',w=>{
 one(w,w.E30.guide.actions.rent.prompt);const ids=w.E30.discAPI.missing('rent').map(x=>x.id);
 assert.deepEqual(json(ids.slice(0,5)),['budget_dep','budget_rent','hood','persona','household']);assert(ids.indexOf('floor_preference')<ids.indexOf('prop_age'));
 assert.deepEqual(json(w.E30.guide.suggestions().slice(0,4).map(x=>x.id)),['rent-budget','need-hood','need-persona','need-household']);
 assert(!/محل کارتان|مدرسهٔ فرزندانتان/.test(w.HIST.at(-1).h));
});
check('buy puts persona before household and age immediately after rooms',w=>{
 one(w,w.E30.guide.actions.buy.prompt);const ids=w.E30.discAPI.missing('buy').map(x=>x.id);assert(ids.indexOf('persona')<ids.indexOf('household'));assert.equal(ids.indexOf('prop_age'),ids.indexOf('rooms')+1);
});
check('persona remains distinct from household and school access',w=>{
 one(w,w.E30.guide.actions.rent.prompt);one(w,w.E30.guide.actions['need-persona'].prompt);
 assert(w.E30.guide.suggestions().some(x=>x.id==='persona-student'));assert(!w.E30.guide.suggestions().some(x=>x.id==='rent-budget'));
 one(w,w.E30.guide.actions['persona-family'].prompt);assert.equal(w.E30.discAPI.getF('persona'),'family');assert.equal(w.E30.discAPI.getF('household'),null);
 assert(!w.E30.discAPI.missing('rent').some(x=>x.id==='school'));
});
check('preference buttons prefill only and stale buttons do not write facts',w=>{
 one(w,w.E30.guide.actions.rent.prompt);const holder=w.document.createElement('div');holder.innerHTML=w.HIST.at(-1).h;const button=holder.querySelector('[data-e31-id="need-persona"]');const n=w.HIST.length;
 w.CBACT.e31Prefill(button);assert.equal(w.HIST.length,n);assert.equal(w.document.getElementById('chatIn').value,w.E30.guide.actions['need-persona'].prompt);assert.equal(w.E30.discAPI.getF('persona'),null);
 one(w,'حداقل ۶۰ متر می‌خواهم');w.document.getElementById('chatIn').value='';w.CBACT.e31Prefill(button);assert.equal(w.document.getElementById('chatIn').value,'');
});
check('all rental preferences may be skipped, then listings are reachable',w=>{
 one(w,w.E30.guide.actions.rent.prompt);let count=0;
 while(count++<40){let r=w.E30.guide.suggestions().find(x=>x.action.startsWith('preference:'));if(!r)break;one(w,r.prompt);assert(w.E30.guide.suggestions().some(x=>x.id==='skip-preference'));one(w,w.E30.guide.actions['skip-preference'].prompt)}
 assert(count<40,'preference cycle');const result=one(w,w.E30.guide.actions.results.prompt);assert(result.includes('class="chcards"'));assert(result.includes('آگهی‌های منطبق'));
});
check('explicit rental constraints produce honest empty output',w=>{
 one(w,w.E30.guide.actions.rent.prompt);one(w,'بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.');one(w,'حداقل ۶۰ متر و یک خواب می‌خواهم');w.E30.discAPI.setF('hood','h8',{src:'answer'});
 const h=one(w,w.E30.guide.actions.results.prompt);assert(h.includes('آگهی منطبق پیدا نشد'));assert(!h.includes('data-cba="selL"'));
});
check('graphic comparison keeps unknown surrounding geography honest',w=>{
 one(w,w.E30.guide.actions.neighborhood.prompt);assert(w.HIST.at(-1).h.includes('chcards'));
 const h=one(w,'اطراف انقلاب رو بررسی کن');assert(h.includes('قابل اجرا نیست'));assert(!h.includes('chcards'));
});
check('buy age accepts new, upper bound, range, skip; invalid input stays recoverable',w=>{
 for(const input of ['نوساز','تا ۵ سال','۵ تا ۱۰ سال','مهم نیست']){w.ceStart('buy');w.ceJump('age');w.ceVal(input);assert.notEqual(w.SCRIPTS.buy[w.CE.i].id,'age',input)}
 w.ceJump('age');w.ceVal('خراب');assert.equal(w.SCRIPTS.buy[w.CE.i].id,'age');w.ceVal('تا ۵ سال');assert.notEqual(w.SCRIPTS.buy[w.CE.i].id,'age');
});
check('project transfers are unique, preserve context, persist across reload',w=>{
 w.S.chats=[{id:'c',title:'QA',hist:[{r:'user',h:'hello'}]}];const a=w.E29.projAPI.create('A'),b=w.E29.projAPI.create('B');w.S.ctx30ByChat={'chat:c':{fields:{persona:{v:'student'}},log:[]}};
 w.E29.projAPI.addChat(a.id,'c');w.E29.projAPI.addChat(b.id,'c');w.E29.projAPI.addChat(b.id,'c');assert.deepEqual(json(a.chatIds),[]);assert.deepEqual(json(b.chatIds),['c']);assert.equal(w.S.chats[0].hist[0].h,'hello');
 const stored=JSON.parse(w.localStorage.getItem('mahalino_v31'));assert.equal(stored.chats[0].projectId,b.id);assert.equal(stored.ctx30ByChat['chat:c'].fields.persona.v,'student');
});
check('side service resumes exact pending preference and preserves budget',w=>{
 one(w,w.E30.guide.actions.rent.prompt);one(w,'ودیعه ۱ میلیارد و اجاره ۳۰ میلیون');one(w,w.E30.guide.actions['need-size'].prompt);const before=json(w.E30.discAPI.getF('budget_dep'));
 one(w,w.E30.guide.actions.services.prompt);assert(!w.E30.discAPI.active());assert(w.E30.guide.suggestions().some(x=>x.id==='resume'));
 one(w,w.E30.guide.actions.resume.prompt);assert.equal(w.E30.discAPI.collector().expecting,'m2');assert.deepEqual(json(w.E30.discAPI.getF('budget_dep')),before);
});
check('retired investment flows absent; active service flows retained',w=>{
 assert(!w.SCRIPTS.invb);assert(!w.SCRIPTS.invr);for(const id of ['rent','buy','sell','invp','lndl','mkt','build','stay'])assert(w.SCRIPTS[id]?.length,id);
});
check('unavailable stored data are not offered as suggestions',w=>{
 w.E30.guide.route(w.E30.guide.actions.contracts.prompt);const ids=w.E30.guide.suggestions().map(x=>x.id);for(const id of ['saved','library','projects','termination'])assert(!ids.includes(id));
});

for(const flow of ['buy','sell','invest','landlord'])check(flow+' optional prompts reach an executable service',w=>{
 one(w,w.E30.guide.actions[flow].prompt);let count=0;
 while(count++<60){const r=w.E30.guide.suggestions().find(x=>x.action.startsWith('preference:'));if(!r)break;one(w,r.prompt);one(w,w.E30.guide.actions['skip-preference'].prompt)}
 assert(count<60,'cycle');const action=w.E30.guide.suggestions().find(x=>['results','start-service'].includes(x.id));assert(action,'service exit missing');
 const h=one(w,action.prompt);assert(!/خطای غیرمنتظره/.test(h));assert(w.HIST.at(-1).c?.length||h.includes('آگهی‌های منطبق'));if(flow==='buy')assert(h.includes('آگهی‌های منطبق'));else assert.equal(w.CE.f,{sell:'sell',invest:'invp',landlord:'lndl'}[flow]);
});

check('canonical money is parsed once across legacy setters',w=>{
 w.ceStart('buy');w.ceVal('۱۰ میلیارد تومان');assert.equal(w.wd('buy').data.budg,1e11);
 w.ceStart('invp');w.ceJump('i_cap');w.ceVal('۱۰ میلیارد تومان');assert.equal(w.wd('invp').data.cap,1e11);assert(!w.__E31CanonicalMoney);
});
