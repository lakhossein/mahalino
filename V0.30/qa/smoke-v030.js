/* smoke-v030.js — boot + critical-path smoke test (real Chromium via Playwright) */
const { chromium } = require('playwright');
const fs=require('node:fs');
const path=require('node:path');

const URL=process.env.QA_BASE_URL||'http://127.0.0.1:8730/Mahalino%2BV0.30.html';
let pass=0,fail=0;const fails=[];
function ok(name,cond,extra){if(cond){pass++;console.log('  ✓ '+name)}else{fail++;fails.push(name);console.log('  ✗ '+name+(extra?' — '+JSON.stringify(extra).slice(0,220):''))}}

async function send(page,text){
  await page.fill('#chatIn',text);
  await page.click('#chatSend');
  await page.waitForTimeout(750);
}

(async()=>{
  const b=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  const ctx=await b.newContext({viewport:{width:1280,height:800}});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGEERR: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE: '+m.text())});

  console.log('— Boot —');
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1600);
  let st=await page.evaluate(()=>({
    booted:window.__BOOTED===true,e30:window.E30&&window.E30.VER,
    current:(typeof CURRENT!=='undefined')?CURRENT:null,
    splash:!!document.getElementById('v-splash')&&document.getElementById('v-splash').classList.contains('on'),
    cards:document.querySelectorAll('#v-splash .spl-card').length,
    faq:document.querySelectorAll('#v-splash .spl-faq').length,
    nav:document.querySelectorAll('#v-splash .spl-nav button').length,
    how:document.querySelectorAll('#v-splash .spl-step').length,
    why:document.querySelectorAll('#v-splash .spl-why').length,
    table:document.querySelectorAll('#v-splash .spl-table tbody tr').length,
    chat:!!document.getElementById('spl-chatbox'),
    hoods:(typeof HOODS!=='undefined')?HOODS.length:0,
    errbar:(document.getElementById('errbar')||{}).textContent||''
  }));
  ok('booted without error',st.booted&&st.e30==='0.30'&&!st.errbar,st);
  ok('guest lands on public splash',st.current==='splash'&&st.splash,st);
  ok('landing sections present (14 cards/6 steps/4 why/12 pricing/8 faq/nav)',st.cards===14&&st.how===6&&st.why===4&&st.table===12&&st.faq===8&&st.nav===4,st);
  ok('sample dataset extended to 8 hoods (ونک/انقلاب for §4.8)',st.hoods===8,st.hoods);

  console.log('— Info chatbot separation —');
  await page.fill('#spl-q','بنا چیست؟');
  await page.click('#spl-send');
  await page.waitForTimeout(500);
  st=await page.evaluate(()=>{
    const ms=[...document.querySelectorAll('#spl-msgs .spl-msg.bot')];
    return {n:ms.length,last:ms.length?ms[ms.length-1].textContent:'',hist:(typeof HIST!=='undefined')?HIST.length:-1,ce:(typeof CE!=='undefined')?CE.f:'x'};
  });
  ok('info-bot answers from KB',st.n>=2&&/بنا/.test(st.last),st.last);
  ok('info-bot does NOT touch app engine',st.hist===0&&st.ce===null,st);
  await page.fill('#spl-q','می‌خوام خونه اجاره کنم برام پیدا کن');
  await page.click('#spl-send');
  await page.waitForTimeout(500);
  st=await page.evaluate(()=>{
    const ms=[...document.querySelectorAll('#spl-msgs .spl-msg.bot')];
    return {last:ms.length?ms[ms.length-1].textContent:'',ce:(typeof CE!=='undefined')?CE.f:'x'};
  });
  ok('info-bot refuses execution, guides to login',/ورود/.test(st.last)&&st.ce===null,st.last);

  console.log('— Login —');
  await page.click('#v-splash .spl-cta button[data-view="auth"]');
  await page.waitForTimeout(500);
  st=await page.evaluate(()=>({current:(typeof CURRENT!=='undefined')?CURRENT:null}));
  ok('auth view opens',st.current==='auth',st);
  await page.evaluate(()=>{try{doLogin('تستر')}catch(e){}});
  await page.waitForTimeout(700);
  st=await page.evaluate(()=>({auth:!!(window.S&&S.auth),tok:(window.S)?S.tokens:null,cur:(typeof CURRENT!=='undefined')?CURRENT:null}));
  ok('quick login → 500 welcome بنا',st.auth===true&&st.tok===500&&st.cur==='landing',st);

  console.log('— Discovery engine (§4.8 reference conversation) —');
  const OPEN='من حدود ۲۶ سالمه. تازه می‌خوام ازدواج کنم و اولین بارمه که می‌خوام خونه اجاره کنم. محل کارم نزدیک ونکه و دانشگاه هم حوالی انقلابه. دوست دارم خونه تا جای ممکن به هر دو نزدیک باشه. نوساز بودنش هم برام مهمه.';
  await send(page,OPEN);
  st=await page.evaluate(()=>{
    const bubbles=[...document.querySelectorAll('#chatB .msg.bot .bub')].map(b=>b.textContent);
    const f=(window.S&&S.ctx30.fields)||{};
    return {
      disc:!!(window.E30&&E30.discAPI&&E30.discAPI.active()),
      fields:Object.keys(f),
      persona:E30.discAPI.personaOf('rent'),
      newness:f.prop_new&&{value:f.prop_new.v,kind:f.prop_new.kind,needsConfirmation:f.prop_new.requiresConfirmation},
      bubbles:bubbles.map(b=>b.slice(0,150))
    };
  });
  ok('opening message starts discovery collector',st.disc===true,st);
  ok('multi-fact extraction (couple/first-rent/work/uni/نوساز)',st.fields.filter(x=>['household','life_stage','work_loc','uni_loc','prop_new','age'].indexOf(x)>=0).length>=5,st.fields);
  ok('«نوساز مهمه» is an explicitly soft preference pending clarification, not a hard age limit',st.newness&&st.newness.value==='new'&&st.newness.kind==='soft',st.newness);
  ok('persona = couple (not student — دانشگاه is a location)',st.persona==='couple',st.persona);
  var weightKnown=st.fields.indexOf('work_weight')>=0;
  ok('first question adaptive: weighting OR budget when weighting pre-extracted (§4.8/4.5)',weightKnown?st.bubbles.some(b=>/ودیعه|بازه/.test(b)):st.bubbles.some(b=>/کدوم یکی|اولویت بیشتری|یک اندازه|مهم‌تره/.test(b)),{weightKnown,seen:st.bubbles.slice(-2)});

  await send(page,'تقریباً هر دو مهمن. ترجیح می‌دم بیشتر از نیم ساعت در مسیر نباشم.');
  st=await page.evaluate(()=>{
    const bubbles=[...document.querySelectorAll('#chatB .msg.bot .bub')].map(b=>b.textContent);
    return {weight:(S.ctx30.fields.work_weight||{}).v,commute:(S.ctx30.fields.commute_max||{}).v,
      askingBudget:bubbles.some(b=>/ودیعه/.test(b)&&/چقدر|بازه/.test(b)),last:bubbles[bubbles.length-1].slice(-160)};
  });
  ok('weight=both + commute ceiling captured',st.weight==='both'&&!!st.commute,st);
  ok('then financial question (budget next per §4.8)',st.askingBudget===true,st.last);

  await send(page,'حدود یک میلیارد و نیم ودیعه و ماهی ۲۰ تا ۲۵ میلیون اجاره.');
  st=await page.evaluate(()=>{
    const bubbles=[...document.querySelectorAll('#chatB .msg.bot .bub')].map(b=>b.textContent);
    const f=S.ctx30.fields;
    return {
      dep:f.budget_dep?f.budget_dep.v:null,rent:f.budget_rent?f.budget_rent.v:null,
      finConf:bubbles.some(b=>/تأیید مالی ضروری است.*ودیعه.*اجارهٔ ماهانه/.test(b)),
      pending:S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey]&&S.ctx30Collectors[S.ctx30ActiveKey].confirming&&S.ctx30Collectors[S.ctx30ActiveKey].confirming.type,
      last:bubbles[bubbles.length-1].slice(-160)
    };
  });
  ok('BOTH deposit and rent captured from the two-amount sentence',!!st.dep&&!!st.rent,st);
  ok('two-amount sentence keeps the trailing «ودیعه» label on 1.5b, separate from 20–25m rent',
    st.dep?.v?.[0]===1500000000&&st.dep?.v?.[1]===1500000000&&
    st.rent?.v?.[0]===20000000&&st.rent?.v?.[1]===25000000,st);
  ok('both financial values read back and explicit confirmation awaited (no silent defaults)',st.finConf===true&&st.pending==='financial',st);
  // The financial confirmation is a mandatory *separate user turn*. Text about
  // parking/rooms must not be silently treated as confirmation or discarded.
  await send(page,'درسته');
  st=await page.evaluate(()=>({confirming:S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey]&&S.ctx30Collectors[S.ctx30ActiveKey].confirming&&S.ctx30Collectors[S.ctx30ActiveKey].confirming.type,
    finConfirmed:S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey]&&S.ctx30Collectors[S.ctx30ActiveKey].finConfirmed}));
  ok('explicit financial consent accepted before next discovery questions',st.finConfirmed===true&&st.confirming!=='financial',st);

  await send(page,'۲ خواب');
  await send(page,'حداقل ۶۰ متر');
  await send(page,'پارکینگ و آسانسور');
  await send(page,'تا یک ماه دیگه');
  for(let i=0;i<22;i++){
    const phase=await page.evaluate(()=>({active:E30.discAPI.active(),type:S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey]&&S.ctx30Collectors[S.ctx30ActiveKey].confirming&&S.ctx30Collectors[S.ctx30ActiveKey].confirming.type}));
    if(!phase.active||phase.type==='final')break;
    await send(page,phase.type==='financial'?'درسته':'مهم نیست');
  }
  st=await page.evaluate(()=>{
    const bubbles=[...document.querySelectorAll('#chatB .msg.bot .bub')].map(b=>b.textContent);
    return {profile:bubbles.some(b=>/آن‌چه تا الان از شرایطتان فهمیدم/.test(b)),
      askFinal:bubbles.some(b=>/درسته/.test(b)),
      prefs:(S.ctx30.fields.prefs||{}).v||null,
      prefRules:(S.ctx30.fields.prefRules||{}).v||null};
  });
  ok('reached completion profile card',st.profile===true,st);
  ok('parking/elevator are captured as soft preferences, not silently hardened',st.prefRules&&
    st.prefRules.parking==='preferred'&&st.prefRules.elevator==='preferred'&&
    !(Array.isArray(st.prefs)&&st.prefs.includes('parking')),st);

  await send(page,'درسته');
  st=await page.evaluate(()=>{
    const D=wd('rent').data;
    const expRent=parseMoneyRangeFA('۲۰ تا ۲۵ میلیون');
    const expDep=parseMoneyFA(E30._dbg.normHalf('یک میلیارد و نیم')); /* engine normalizes «و نیم» */
    return {
      ce:CE.f,stepIx:CE.i,stepId:(CE.f&&SCRIPTS[CE.f][CE.i])?SCRIPTS[CE.f][CE.i].id:null,
      rentB:D.B?D.B.rentB:null,depB:D.B?D.B.depB:null,
      expRentUp:expRent&&expRent.ok?+expRent.value.split('|')[1]:null,
      expDep:expDep&&expDep.ok?expDep.value:null,
      e30:!!D._e30,persona:D.P?D.P.persona:null,
      age:D.P?D.P.maxAge:null,ageHard:D.P?!!D.P._ageHard:null,
      newFact:S.ctx30.fields.prop_new||null,
      wfStep:(function(){try{return wd('rent').step}catch(e){return null}})()
    };
  });
  ok('hand-off into deterministic rent engine',st.ce==='rent',st);
  ok('confirmed rent EXACTLY as parsed — never the 500M default (defect 2.1)',st.rentB===st.expRentUp&&st.rentB!==500000000,{rentB:st.rentB,expected:st.expRentUp});
  ok('confirmed deposit preserved exactly',st.depB===st.expDep,{depB:st.depB,expected:st.expDep});
  ok('auto-advanced past known steps (imps/beds/who) to first unknown — no re-asking (§4.2)',st.stepId==='age'||st.stepId==='m2',st);
  ok('ambiguous «نوساز مهمه» never creates a hard age cutoff after optional skip',st.ageHard===false&&st.age>=20,st);
  ok('workflow record step synced with conversation stage (defect 2.4)',st.wfStep===st.stepIx+1,{wfStep:st.wfStep,ix:st.stepIx});

  console.log('— Strict filters (defects 2.2/2.3) —');
  st=await page.evaluate(()=>{
    var D=wd('rent').data;
    var passes=RLIST.filter(function(x){return E30.flowsAPI.rentPass(x,D)}).map(x=>x.id);
    var r9blocked=!passes.includes('r9'); /* ونک ۶۸۰م over the ۲۵م budget */
    var D2={P:{beds:2,maxAge:10,minM2:50,_ageHard:true,elev:false,park:false},B:{rentB:700000000,depB:30000000000}};
    var ids=RLIST.filter(x=>E30.flowsAPI.rentPass(x,D2)).map(x=>x.id);
    return {r9blocked:r9blocked,ids:ids,noOld:!ids.includes('r3')};
  });
  ok('rent filter blocks over-budget listing',st.r9blocked===true,st);
  ok('rent filter blocks 20yo listing when maxAge=10 hard (defect 2.2)',st.noOld===true,st.ids);
  st=await page.evaluate(()=>{
    var D={PR:{age:[0,30],m2:[40,130],ppm:[1000000000,9000000000],floorR:[1,10],beds:2,elev:'no',park:'no',balc:'no'},budg:150000000000,budgOpen:false};
    var totals=BLIST.map(function(x){return {id:x.id,tot:x.m2*x.ppm,pass:E30.flowsAPI.buyPass(x,D)}});
    var bad=totals.filter(x=>x.tot>150000000000&&x.pass);
    return {badCount:bad.length};
  });
  ok('buyer filter: total(متراژ×قیمت هر متر) > budget → excluded (defect 2.3)',st.badCount===0,st);

  console.log('— Payment FSM variants (§11.7) —');
  st=await page.evaluate(()=>{
    var before=S.tokens;
    E30.pay.begin({key:'hood_detail',title:'تحلیل جامع محله',ctx:'ونک',onConfirm:function(txn){window.__smokeTxn=txn}});
    return {before,state:S.paySession.state,cost:S.paySession.cost};
  });
  ok('confirm card presented (cost 40)',st.state==='presented'&&st.cost===40,st);
  st=await page.evaluate(()=>{
    var before=S.tokens;
    document.querySelector('[data-paygo]').click();
    return {before,after:S.tokens,log0:S.log[0],state:S.paySession.state,executed:S.paySession.executed,txn:window.__smokeTxn};
  });
  ok('single exact deduction + TXN ledger + execution',st.before-st.after===40&&/^TXN-/.test(st.log0.id)&&st.state==='completed'&&st.executed===true&&!!st.txn,st);
  st=await page.evaluate(()=>{var t0=S.tokens;var btn=document.querySelector('[data-paygo]');if(btn)btn.click();return t0===S.tokens});
  ok('duplicate click blocked (idempotency)',st===true,st);
  st=await page.evaluate(()=>{
    E30.pay.begin({key:'valuation',title:'تخمین ارزش',onConfirm:function(){window.__never=true}});
    var btns=[...document.querySelectorAll('[data-paycancel]')];
    btns[btns.length-1].click();
    return {before:S.tokens,state:(S.paySession||{}).state||null,noExec:!window.__never};
  });
  ok('decline → zero deduction + session cleared',st.before===460&&st.state===null&&st.noExec,st);
  st=await page.evaluate(()=>{
    var real=S.tokens;S.tokens=10;save();
    E30.pay.begin({key:'legal',title:'گزارش حقوقی',onConfirm:function(){}});
    var card=document.querySelector('#modal-root .e30-paycard');
    var r={bad:!!(card&&card.classList.contains('e30-paybad')),
      needed:card?/۱۰۰/.test(card.textContent):false,
      hasTopup:!!(card&&card.querySelector('[data-view="sub"]')),
      state:(S.paySession||{}).state,tokens:S.tokens};
    S.tokens=real;save();E30.pay.cancel(E30.pay.session().payId,true);closeModal();
    return r;
  });
  ok('insufficient balance → honest card (needed vs balance) + top-up, zero deduction',st.bad===true&&st.needed===true&&st.hasTopup===true&&st.tokens===10&&st.state==='insufficient',st);
  st=await page.evaluate(()=>{
    E30.pay.begin({key:'valuation',title:'تخمین ۱',onConfirm:function(){}});
    E30.pay.begin({key:'valuation',title:'تخمین ۲',onConfirm:function(){}});
    var cards=[...document.querySelectorAll('#chatB .e30-paycard')];
    var r={stale:cards.filter(c=>c.classList.contains('e30pay-stale')).length,live:cards.filter(c=>!c.classList.contains('e30pay-stale')).length};
    if(E30.pay.session())E30.pay.cancel(E30.pay.session().payId,true);
    return r;
  });
  ok('superseded confirm card invalidated honestly',st.stale>=1&&st.live>=1,st);
  st=await page.evaluate(()=>{
    // Recovery must refund only a real debit with matching payId, never mint
    // credit from a fabricated paidFlag/session.
    const payId='PAY-SMOKE-'+Date.now(),txnId='TXN-SMOKE-'+Date.now();
    S.log.unshift({t:Date.now(),d:'QA interrupted valuation',c:-40,cat:'bana',id:txnId,svc:'valuation',payId});
    S.paySession={payId,txnId,key:'valuation',cost:40,title:'تخمین',state:'paid',paidFlag:true,executed:false,refunded:false,ts:Date.now()};
    save();var t0=S.tokens;
    E30.pay.recover();
    return {refunded:S.tokens-t0,cleared:!S.paySession,credits:S.log.filter(x=>x.payId===payId&&x.refund).length};
  });
  ok('journal-backed interrupted payment auto-refunded once (§11.6)',st.refunded===40&&st.cleared===true&&st.credits===1,st);

  console.log('— New flows —');
  st=await page.evaluate(()=>{
    var s1=SCRIPTS.sell&&SCRIPTS.sell.length>=15;
    var s2=SCRIPTS.invp&&SCRIPTS.invp.length>=6;
    var s3=SCRIPTS.lndl&&SCRIPTS.lndl.length>=6;
    return {sell:s1,inv:s2,lndl:s3};
  });
  ok('sell (17-step) / invest (7) / landlord (6) flows installed',st.sell&&st.inv&&st.lndl,st);

  console.log('— Bana rename —');
  st=await page.evaluate(()=>({noToken:/توکن/.test(document.body.textContent),hasBana:document.body.textContent.indexOf('بنا')>=0}));
  ok('«توکن» fully replaced with «بنا» (§17)',st.noToken===false&&st.hasBana===true,st);

  console.log('— Errors —');
  const realErrors=errors.filter(e=>!/picsum|favicon|net::|Failed to load resource/.test(e));
  ok('no unexpected page errors',realErrors.length===0,realErrors.slice(0,3));

  const screenshotDir=process.env.QA_RESULTS_DIR||path.resolve('screenshots');
  fs.mkdirSync(screenshotDir,{recursive:true});
  await page.screenshot({path:path.join(screenshotDir,'smoke-final.png'),fullPage:false});
  await b.close();
  console.log('\nSMOKE RESULT: '+pass+' passed, '+fail+' failed');
  if(fails.length)console.log('FAILED: '+fails.join(' | '));
  process.exit(fail?1:0);
})().catch(e=>{console.error('SMOKE CRASH:',e);process.exit(2)});
