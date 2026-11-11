/* e2e-functional.js — V0.30 functional suite (spec §19.1) — real Chromium, fresh profile */
const { chromium } = require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const URL=process.env.QA_BASE_URL||'http://127.0.0.1:8730/Mahalino%2BV0.30.html';
let pass=0,fail=0;const fails=[];
function ok(name,cond,extra){if(cond){pass++;console.log('  ✓ '+name)}else{fail++;fails.push(name);console.log('  ✗ '+name+(extra?' — '+JSON.stringify(extra).slice(0,200):''))}}
async function send(page,t){await page.fill('#chatIn',t);await page.click('#chatSend');await page.waitForTimeout(700)}
async function clickChip(page,cv){return page.evaluate((cv)=>{const btns=[...document.querySelectorAll('#chatB [data-cv]')];for(let i=btns.length-1;i>=0;i--){if(btns[i].getAttribute('data-cv')===cv){btns[i].click();return true}}return false},cv)}
async function curStep(page){return page.evaluate(()=>CE.f?((SCRIPTS[CE.f]||[])[CE.i]||{}).id:null)}
async function walkTo(page,targetId,max){
  for(let i=0;i<(max||20);i++){
    const cur=await curStep(page);
    if(!cur||cur===targetId)return cur;
    const v=await page.evaluate(()=>{
      const s=SCRIPTS[CE.f][CE.i];
      if(s.loop)return '3';
      // When the app asks again for an already stated amount, replay the
      // *same* real budget; the first preset chip (30M rent) is not the user's
      // explicitly stated 70M and would produce a false empty-results test.
      if(s.id==='dep')return '۳ میلیارد تومان';
      if(s.id==='rentb')return '۷۰ میلیون تومان';
      if(s.id==='beds')return '2';
      if(s.id==='m2')return '60';
      // The user explicitly asked for Saadat Abad. Preserve that choice as
      // the interaction proceeds; an unrelated hood here silently invalidates
      // every expected rental match and all downstream visit assertions.
      if(s.id==='hoods')return 'سعادت‌آباد';
      if(s.id==='mk')return 'ok';
      if(s.id==='age')return '10';
      if(s.id==='s_price')return '12000000000';
      if(s.id==='s_min')return '11000000000';
      if(s.id==='s_area')return '85';
      if(s.id==='s_rooms')return '2';
      if(s.id==='s_hood')return 'نارمک';
      if(s.id==='s_own')return 'single';
      if(s.id==='s_motiv')return 'تعویض ملک';
      if(s.id==='s_urg')return 'maxvalue';
      if(s.id==='s_floor')return '2';
      if(s.id==='i_cap')return '10000000000';
      if(s.id==='vform')return '!nx';
      if(s.id==='list'){const DD=wd('rent').data;return DD.listing?'!skp':'PICK'}
      if(s.chips){const c=typeof s.chips==='function'?s.chips(wd(CE.f).data):s.chips;return c&&c.length?c[0][1]:'ok'}
      return 'ok';
    });
    if(v==='PICK'){await page.evaluate(()=>{const b=document.querySelector('#chatB [data-cba="selL"]');if(b)b.click()})}
    else if(String(v).charAt(0)==='!'){const done=await clickChip(page,String(v));if(!done)await send(page,String(v))}
    else await send(page,String(v));
    await page.waitForTimeout(420);
  }
  return curStep(page);
}
async function drainDisc(page,final){
  for(let i=0;i<35;i++){
    const phase=await page.evaluate(()=>({active:E30.discAPI.active(),confirmation:S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey]&&S.ctx30Collectors[S.ctx30ActiveKey].confirming&&S.ctx30Collectors[S.ctx30ActiveKey].confirming.type}));
    if(!phase.active)break;
    // A known budget needs explicit consent before other free-form facts can
    // be collected. Final profile requires a second, separate confirmation.
    await send(page,phase.confirmation==='financial'||phase.confirmation==='final'?'درسته':'مهم نیست');
  }
  await page.waitForTimeout(800);
}

(async()=>{
  const b=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  const ctx=await b.newContext({viewport:{width:1366,height:860}});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{try{doLogin('QA')}catch(e){}});
  await page.waitForTimeout(600);

  console.log('— T1 Rental: discovery → results (strict filter on screen) —');
  await send(page,'می‌خوام آپارتمان دوخوابه در محلهٔ سعادت‌آباد اجاره کنم. خانواده سه نفره‌ایم، بچه مدرسه‌ای داریم، کارم سعادت‌آباده. ودیعه تا ۳ میلیارد تومان و اجاره تا ۷۰ میلیون تومان. حداقل دو خواب و پارکینگ الزامیه.');
  await drainDisc(page);
  let st=await page.evaluate(()=>({ce:CE.f,done:!E30.discAPI.active()}));
  ok('T1.1 rent flow handed off to engine',st.ce==='rent'&&st.done===true,st);
  st=await page.evaluate(()=>({ctx:{dep:CTX.dep,rent:CTX.rent},
    budget:JSON.parse(JSON.stringify(wd('rent').data.B||{})),beds:wd('rent').data.P?.beds}));
  ok('T1.1a initial handoff retains the user’s 3B/70M Toman budget',
    st.budget.depB===30000000000&&st.budget.rentB===700000000&&st.beds===2,st);
  await walkTo(page,'list');
  st=await page.evaluate(()=>({id:(SCRIPTS[CE.f][CE.i]||{}).id}));
  ok('T1.2 reached listing step',st.id==='list',st);
  st=await page.evaluate(()=>{
    const D=wd('rent').data;
    return {D:{park:D.P?D.P.park:null,beds:D.P?D.P.beds:null,rentB:D.B?D.B.rentB:null,depB:D.B?D.B.depB:null}};
  });
  ok('T1.3 hard constraints active (park/beds/exact stated budget)',st.D.park===true&&st.D.beds===2&&
    st.D.rentB===700000000&&st.D.depB===30000000000,st.D);
  st=await page.evaluate(()=>{
    const D=wd('rent').data;
    const bub=[...document.querySelectorAll('#chatB .msg.bot .bub')].pop();
    const ids=[];bub.querySelectorAll('[data-l]').forEach(x=>{const l=x.getAttribute('data-l');if(l&&!ids.includes(l))ids.push(l)});
    const viol=ids.filter(id=>{const x=RLIST.find(r=>r.id===id);return x?!E30.flowsAPI.rentPass(x,D):false});
    const expected=RLIST.filter(x=>x.hood===D.hood&&E30.flowsAPI.rentPass(x,D)).length;
    const candidate=RLIST.find(x=>x.id==='r5');
    return {checked:ids.length,expected,viol:viol,head:bub.textContent.slice(0,80),
      diagnostic:{hood:D.hood,preferences:{beds:D.P?.beds,bedsNum:D.P?.bedsNum,
        maxAge:D.P?.maxAge,ageHard:D.P?._ageHard,minM2:D.P?.minM2,
        floor:D.P?.floor,floorNum:D.P?.floorNum,requiredFloor:D.P?.requiredFloor,
        elev:D.P?.elev,park:D.P?.park,prefRules:D.P?.prefRules},
        budget:D.B,depOpen:D.depOpen,rentOpen:D.rentBOpen,
        r5: candidate&&{eligible:E30.flowsAPI.rentPass(candidate,D),
          hood:candidate.hood,beds:candidate.beds,age:candidate.age,area:candidate.m2,
          floor:candidate.floor,elev:candidate.elev,park:candidate.park,
          dep:candidate.dep,rent:candidate.rent}}};
  });
  ok('T1.4 at least one real matched card (max 3), never a violating candidate',st.expected>=1&&st.checked>0&&st.checked===Math.min(3,st.expected)&&st.viol.length===0,st);
  if(st.expected===0)console.log('  T1.4 FILTER DIAGNOSTIC: '+JSON.stringify(st.diagnostic));
  ok('T1.5 match count honestly shown',/منطبق/.test(st.head),st.head);
  st=await page.evaluate(()=>{
    const d=JSON.parse(JSON.stringify(wd('rent').data));
    d.B={...(d.B||{}),depB:100000000,rentB:300000000};
    return {qualifying:RLIST.filter(x=>E30.flowsAPI.rentPass(x,d)).map(x=>x.id),budget:d.B};
  });
  ok('T1.6 impossible 10M-Toman deposit has zero matches — no fabricated visit',st.qualifying.length===0,st);

  console.log('— T2 Visit booking via UI (20 بنا, explicit confirm) —');
  st=await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#chatB [data-cba="selL"],#chatB [data-cba="selB"]')][0]||null;
    if(b){b.click();return {picked:true}}
    return {picked:false};
  });
  if(!st.picked){
    const chips=await page.evaluate(()=>[...document.querySelectorAll('#chatB [data-cv]')].map(b=>b.getAttribute('data-cv')));
    if(chips.length)await clickChip(page,chips[0]);
  }
  await page.waitForTimeout(600);
  let step=await walkTo(page,'visit');
  ok('T2.1 reached visit step',step==='visit',step);
  await clickChip(page,'!go');
  await page.waitForTimeout(800);
  st=await page.evaluate(()=>({pay:!!S.paySession,cost:S.paySession?S.paySession.cost:0,state:S.paySession?S.paySession.state:null}));
  ok('T2.2 visit requires centralized 20-Bana presented confirmation before debit',st.pay===true&&st.state==='presented'&&st.cost===20,st);
  await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-paygo]')].pop();if(b)b.click()});
  await page.waitForTimeout(900);
  st=await page.evaluate(()=>({tok:S.tokens,req:S.reqs[0]||null,sess:(S.paySession||{}).state||null}));
  ok('T2.3 visit booked: single exact deduction (20) + request recorded, no orphan session',st.req&&st.req.cat==='rent'&&st.tok===480&&st.sess!=='presented',{tok:st.tok,sess:st.sess});

  console.log('— T3 Contract step reachable —');
  step=await walkTo(page,'ctr0');
  ok('T3.1 contract step reached in flow',step==='ctr0',step);

  console.log('— T4 Hood analysis from chat (40 بنا + Library) —');
  st=await page.evaluate(()=>{
    try{
      ACT.hanalysis({getAttribute:function(a){return a==='data-h'?'h6':(a==='data-m'?'rent':null)}});
      return {state:S.paySession?S.paySession.state:null,cost:S.paySession?S.paySession.cost:null};
    }catch(e){return {err:e.message}}
  });
  ok('T4.1 «تحلیل جامع محله» → confirm card (defect 2.10)',st.state==='presented'&&st.cost===40,st);
  await page.evaluate(()=>{const b=[...document.querySelectorAll('[data-paygo]')].pop();if(b)b.click()});
  await page.waitForTimeout(900);
  st=await page.evaluate(()=>({tok:S.tokens,lib0:S.library[0]||null,modalOn:document.getElementById('modal-root').classList.contains('on')}));
  ok('T4.2 paid → analysis modal + Library auto-save with txn',st.tok===440&&st.lib0&&st.lib0.type==='hood_analysis'&&st.lib0.txnId&&st.modalOn===true,st.tok);

  console.log('— T5 Saved listings (§12) —');
  await page.evaluate(()=>closeModal());
  await page.evaluate(()=>{CBACT.savL({getAttribute:function(a){return a==='data-l'?'r7':null}})});
  await page.waitForTimeout(300);
  st=await page.evaluate(()=>({saved:S.savedListings.length,first:S.savedListings[0]||null}));
  ok('T5.1 ☆ saves listing to store with key info',st.saved===1&&st.first&&st.first.listingId==='r7'&&st.first.kind==='rent'&&st.first.rent>0,st.first);
  await page.evaluate(()=>E29.shell.openPanel('library'));
  await page.waitForTimeout(500);
  st=await page.evaluate(()=>({tab:!!document.getElementById('e30-svtab'),label:document.getElementById('e30-svtab')?document.getElementById('e30-svtab').textContent:''}));
  ok('T5.2 Library shows «ملک‌های ذخیره‌شده» tab',st.tab===true,/ذخیره/.test(st.label),st);
  await page.evaluate(()=>{const b=document.getElementById('e30-svtab');if(b)b.click()});
  await page.waitForTimeout(400);
  st=await page.evaluate(()=>({cards:document.querySelectorAll('#e29-lbody .e30-svcard').length}));
  ok('T5.3 saved-listing card rendered',st.cards===1,st);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1400);
  st=await page.evaluate(()=>({saved:S.savedListings.length,lib:S.library.length,authed:!!S.auth,tok:S.tokens}));
  ok('T5.4 persistence after reload (saved+library+auth+balance)',st.saved===1&&st.lib>=1&&st.authed===true&&st.tok===440,st);

  console.log('— T6 Whole-conversation sharing independent of response share (§14) —');
  st=await page.evaluate(()=>{
    const btn=document.querySelector('[data-act="e30shWhole"]');
    if(!btn)return {btn:false};
    btn.click();
    return {btn:true,modal:document.getElementById('modal-root').classList.contains('on'),prev:!!document.querySelector('.e29-shareprev')};
  });
  ok('T6.1 «کل گفت‌وگو» share dialog with preview',st.btn===true&&st.modal===true&&st.prev===true,st);
  await page.evaluate(()=>{const b=[...document.querySelectorAll('#modal-root button')].find(x=>x.getAttribute('data-act')==='e29shGo');if(b)b.click()});
  await page.waitForTimeout(400);
  st=await page.evaluate(()=>({shares:S.shares.length,url:!!document.getElementById('e29-shurl')}));
  ok('T6.2 share link created (snapshot token)',st.shares>=1&&st.url===true,st);
  await page.evaluate(()=>closeModal());

  console.log('— T7 Projects: add ACTIVE conversation without archiving (§13) —');
  let pid=await page.evaluate(()=>{const p=E29.projAPI.create('پروژهٔ تمرین');return p?p.id:null});
  await page.evaluate(p=>{E30.ux.addLive(p)},pid);
  st=await page.evaluate(p=>{const p2=E29.projAPI.byId(p);return {chatIds:p2.chatIds.length}},pid);
  ok('T7.1 live conversation added to project (no forced archive)',st.chatIds===1,st);

  console.log('— T8 Reminders: duplicate prevention (§16) —');
  st=await page.evaluate(()=>{
    S.reminders=S.reminders||[];
    S.reminders.unshift({id:'REM1',title:'بازدید ملک',due:Date.now()+864e5,done:false});
    save();
    return {dupe:E30.ux.remDupe('بازدید  ملک',Date.now()+864e5),diffTime:E30.ux.remDupe('بازدید ملک',Date.now()+40*864e5),unique:E30.ux.remDupe('قرارداد',Date.now()+864e5)};
  });
  ok('T8.1 same-title/same-day reminder = duplicate',st.dupe===true&&st.unique===false,st);
  ok('T8.2 different-day same title NOT duplicate',st.diffTime===false,st);

  console.log('— T9 Sidebar fixes (2.9/§15) —');
  st=await page.evaluate(()=>({
    walletDup:!!document.querySelector('#side .e29-srow[data-act="wallet"] small'),
    banaLabel:document.body.textContent.indexOf('توکن')===-1
  }));
  ok('T9.1 no duplicated wallet balance in sidebar',st.walletDup===false,st);
  ok('T9.2 Bana terminology everywhere',st.banaLabel===true,st);
  await page.evaluate(()=>{ACT.sideFold({getAttribute:function(){return ''}})});
  await page.waitForTimeout(400);
  st=await page.evaluate(()=>({fold:document.body.classList.contains('sidefold'),w:document.getElementById('side').getBoundingClientRect().width}));
  ok('T9.3 collapsed rail ≈64px',st.fold===true&&st.w<80,st);
  await page.evaluate(()=>{ACT.sideFold({getAttribute:function(){return ''}})});

  console.log('— T10 Seller workflow end-to-end (defect 2.6) —');
  await send(page,'می‌خوام ملکم رو بفروشم. نارمک ۸۵ متر دو خوابه، سند تک‌برگ، عجله ندارم ولی زیر ۱۱ میلیارد نمی‌فروشم.');
  await drainDisc(page);
  st=await page.evaluate(()=>({ce:CE.f,done:!E30.discAPI.active()}));
  ok('T10.1 seller hand-off into new SCRIPTS.sell',st.ce==='sell'&&st.done===true,st);
  await walkTo(page,'s_done',24);
  st=await page.evaluate(()=>({id:CE.f?(SCRIPTS[CE.f][CE.i]||{}).id:null,req:S.reqs.some(r=>r.cat==='sell')}));
  ok('T10.2 sale flow completes with request record',st.id==='s_done'&&st.req===true,st);

  console.log('— T11 Investment workflow (§10) —');
  await send(page,'حدود ۱۰ میلیارد سرمایه دارم. می‌خوام یه ملک بخرم که اجاره ماهانه بده.');
  await drainDisc(page);
  st=await page.evaluate(()=>({ce:CE.f}));
  ok('T11.1 investor hand-off into SCRIPTS.invp',st.ce==='invp',st);
  await walkTo(page,'i_done',18);
  st=await page.evaluate(()=>({id:CE.f?(SCRIPTS[CE.f][CE.i]||{}).id:null}));
  ok('T11.2 investment analysis completes',st.id==='i_done',st);

  console.log('— T12 Errors —');
  const real=errors.filter(e=>!/picsum|favicon|net::|Failed to load resource/.test(e));
  ok('no unexpected page errors across suite',real.length===0,real.slice(0,3));

  const screenshotDir=process.env.QA_RESULTS_DIR||path.resolve('screenshots');
  fs.mkdirSync(screenshotDir,{recursive:true});
  await page.screenshot({path:path.join(screenshotDir,'e2e-final.png')});
  await b.close();
  console.log('\nE2E-FUNCTIONAL RESULT: '+pass+' passed, '+fail+' failed');
  if(fails.length)console.log('FAILED: '+fails.join(' | '));
  process.exit(fail?1:0);
})().catch(e=>{console.error('E2E CRASH:',e);process.exit(2)});
