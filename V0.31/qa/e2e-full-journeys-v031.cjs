/* Browser-operated multi-screen journeys supplement, but do not substitute for,
   the 25 mandatory §19.1 journeys. A missing UI path must FAIL honestly. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const url=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const results=[];
const browserOpts={headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,
  args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]};
async function sleep(page,ms=300){await page.waitForTimeout(ms)}
async function send(page,s){await page.locator('#chatIn').fill(s);await page.locator('#chatSend').click();await sleep(page,450)}
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
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(browserOpts);
  async function run(id,name,fn){
    const context=await browser.newContext({viewport:{width:1280,height:820},acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.goto(url,{waitUntil:'domcontentloaded'});await sleep(page,350);
      await page.evaluate(()=>doLogin('QA'));await sleep(page,260);
      const value=await fn(page);
      const passed=Boolean(value&&value.ok)&&errors.length===0;
      const info={...(value&&value.info||{}),uncaughtErrors:errors};
      results.push({id,name,result:passed?'PASS':'FAIL',info});
      console.log(`${passed?'PASS':'FAIL'} ${id} ${name}: ${JSON.stringify(info).slice(0,760)}`);
    }catch(e){
      const state=await page.evaluate(()=>({flow:CE.f,step:SCRIPTS[CE.f]?.[CE.i]?.id,last:HIST.slice(-3).map(x=>(x.h||'').slice(0,600)),pay:S.paySession?.state})).catch(()=>null);
      const info={state,exception:String(e.stack||e).slice(0,2200),uncaughtErrors:errors};
      results.push({id,name,result:'FAIL',info});
      console.log(`FAIL ${id} ${name}: ${JSON.stringify(info).slice(0,850)}`);
    }finally{await context.close()}
  }
  try{
    await run('H01','A free-form chat reminder is created once, archived, and visible after reload',async page=>{
      await send(page,'یادم بنداز فردا ساعت ۱۰ تماس با موجر');
      const before=await page.evaluate(()=>({
        reminders:(S.reminders||[]).filter(x=>/تماس با موجر/.test(x.title||'')).map(x=>({id:x.id,title:x.title,due:x.due,src:x.src})),
        last:(HIST.at(-1)||{}).h||''
      }));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,450);
      await page.locator('[data-act="e29panelRem"]').first().click();await sleep(page,180);
      const after=await page.evaluate(()=>({
        reminders:(S.reminders||[]).filter(x=>/تماس با موجر/.test(x.title||'')).map(x=>x.id),
        visible:(document.getElementById('e29-rbody')||{}).innerText||''
      }));
      return {ok:before.reminders.length===1&&before.reminders[0].due>Date.now()&&
        /ثبت شد/.test(before.last)&&after.reminders.length===1&&after.reminders[0]===before.reminders[0].id&&
        /تماس با موجر/.test(after.visible),info:{before,after}};
    });

    await run('H02','The reminder panel creates, displays, completes, and persists an item',async page=>{
      await page.locator('[data-act="e29panelRem"]').first().click();
      await page.locator('[data-act="e29remNew"]').click();
      await page.locator('#e29-rt').fill('بازدید میدانی QA');
      // Always schedule a future reminder: a fixed test date turns a valid
      // scenario into a false negative once that date has passed.
      const future=new Date(Date.now()+30*864e5);
      const localDatetime=new Date(future.getTime()-future.getTimezoneOffset()*60000).toISOString().slice(0,16);
      await page.locator('#e29-rd').fill(localDatetime);
      await page.locator('#modal-root [data-act="e29remNewGo"]').click();await sleep(page,180);
      const row=page.locator('#e29-rbody [data-rem]').filter({hasText:'بازدید میدانی QA'});
      const created=await page.evaluate(()=>{
        const r=(S.reminders||[]).find(x=>x.title==='بازدید میدانی QA');
        return r&&{id:r.id,due:r.due,done:r.done,src:r.src};
      });
      const visible=await row.count()===1;
      if(visible)await row.locator('[data-act="e29remDone"]').click();
      const done=await page.evaluate(id=>(S.reminders||[]).find(x=>x.id===id)?.done,created&&created.id);
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,430);
      await page.locator('[data-act="e29panelRem"]').first().click();
      const persisted=await page.evaluate(id=>(S.reminders||[]).find(x=>x.id===id),created&&created.id);
      return {ok:Boolean(created&&visible&&done&&persisted&&persisted.done&&persisted.src==='manual'&&
        new Date(created.due).getTime()>Date.now()+20*864e5),info:{created,visible,done,persisted}};
    });

    await run('H03','Create a project in UI, attach an actual archived chat, persist association',async page=>{
      await send(page,'سلام؛ این گفت‌وگوی نمونه برای پروندهٔ بازدید است.');
      const archived=await page.evaluate(()=>{
        ACT.chatNew();
        return (S.chats||[]).find(x=>x.hist&&x.hist.some(m=>/پروندهٔ بازدید/.test(m.h||'')))?.id||null;
      });
      await page.evaluate(()=>E29.shell.openPanel('projects'));
      await page.locator('#e29-pn').fill('پروژهٔ حقیقی QA');
      await page.locator('#e29-pd').fill('پیوند چت آرشیوشده به پرونده');
      await page.locator('[data-act="e29prjCreate"]').click();await sleep(page,130);
      const newly=await page.evaluate(()=>(S.projects||[]).find(x=>x.name==='پروژهٔ حقیقی QA')?.id||null);
      const archiveButton=page.locator(`#e29-lbody [data-act="e29prjAddChat"][data-sess="${archived}"]`);
      const selectable=Boolean(archived&&newly)&&await archiveButton.count()===1;
      if(selectable)await archiveButton.click();
      const linked=await page.evaluate(({pid,cid})=>({
        project:E29.projAPI.byId(pid),chat:(S.chats||[]).find(x=>x.id===cid)
      }),{pid:newly,cid:archived});
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,430);
      const persisted=await page.evaluate(({pid,cid})=>({
        linked:(E29.projAPI.byId(pid)?.chatIds||[]).includes(cid),
        backref:(S.chats||[]).find(x=>x.id===cid)?.projectId===pid
      }),{pid:newly,cid:archived});
      return {ok:selectable&&linked.project.chatIds.includes(archived)&&linked.chat.projectId===newly&&
        persisted.linked&&persisted.backref,info:{archived,newly,selectable,persisted}};
    });

    await run('H04','Library resume button restores saved workflow step and facts',async page=>{
      const setup=await page.evaluate(()=>{
        const w=wd('rent');w.step=4;w.data={qaMarker:'resume-persisted',hood:'h6'};
        const item=E29.libAPI.saveWorkflowProgress(w,45);
        w.step=1;w.data={};save();
        E29.shell.openPanel('library',{item:item.id});
        return {libId:item.id,workflowId:w.id,before:w.step,button:!!document.querySelector('[data-act="e29libResume"]')};
      });
      const button=page.locator('#e29-lbody [data-act="e29libResume"]');
      if(await button.count())await button.click();
      await sleep(page,380);
      const after=await page.evaluate(()=>({step:wd('rent').step,marker:wd('rent').data.qaMarker,
        view:CURRENT,said:(HIST.at(-1)||{}).h?.includes('ادامهٔ')}));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,350);
      const reload=await page.evaluate(()=>({step:wd('rent').step,marker:wd('rent').data.qaMarker}));
      return {ok:setup.button&&setup.before===1&&after.step===4&&after.marker==='resume-persisted'&&
        after.view==='landing'&&after.said&&reload.step===4&&reload.marker==='resume-persisted',info:{setup,after,reload}};
    });

    await run('H05','A visible money slider commits the actual selected value and locks old input',async page=>{
      await page.evaluate(()=>{
        go('landing');ceStart('rent');
        if(SCRIPTS[CE.f]?.[CE.i]?.id!=='dep')ceJump('dep');
      });
      const range=page.locator('#chatB [data-rsld]').last();
      const present=await range.count()===1&&await range.isVisible();
      if(!present)return {ok:false,info:{error:'no visible money slider in first rent step'}};
      const chosen=await range.evaluate(el=>{
        const steps=(el.dataset.ladder||'').split(',').map(Number).filter(Boolean);
        const ix=Math.max(0,Math.min(steps.length-1,Math.floor(steps.length*.4)));
        el.value=String(ix);el.dispatchEvent(new Event('input',{bubbles:true}));
        return {id:el.id,value:steps[ix],label:document.getElementById(el.id+'V')?.textContent};
      });
      await page.locator(`#chatB [data-rsld-for="${chosen.id}"]`).last().click();await sleep(page,300);
      const after=await page.evaluate(id=>({
        deposit:wd('rent').data.B?.depB,
        step:SCRIPTS[CE.f]?.[CE.i]?.id,
        advanced:CE.f==='rent'&&CE.i>SCRIPTS.rent.findIndex(x=>x.id==='dep'),
        oldDisabled:document.getElementById(id)?.disabled,
        oldBtnDisabled:document.querySelector(`[data-rsld-for="${id}"]`)?.disabled
      }),chosen.id);
      /* Back moves ONE recorded step at a time: for some profiles rentb/beds
         sit between the current state and deposit. Traverse the actual user
         navigation history, without jumping directly to dep by test API. */
      const backTrail=[];
      for(let hop=0;hop<10;hop++){
        const state=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,flow:CE.f,depth:CE.hist?.length||0}));
        if(state.step==='dep')break;
        const back=page.locator('#chatB [data-cv="!back"]').last();
        if(!await back.count())return {ok:false,info:{error:'Back action disappeared before reaching deposit',chosen,after,backTrail,state}};
        await back.click();await sleep(page,160);
        backTrail.push(await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,depth:CE.hist?.length||0})));
      }
      const newRange=page.locator('#chatB [data-rsld]:not([disabled])').last();
      const revisited=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,flow:CE.f}));
      if(revisited.step!=='dep'||!await newRange.count()) { const diagnose=await page.evaluate(()=>({marker:wd('rent').data._slid||null,manualEdit:E30._manualEdit||null,lastMessages:HIST.slice(-5).map(m=>({role:m.r,html:(m.h||'').slice(0,420)})),sliders:[...document.querySelectorAll('#chatB .rsld')].slice(-4).map(e=>({slot:e.dataset.slot,locked:e.dataset.locked,disabled:e.querySelector('input')?.disabled,outer:e.outerHTML.slice(0,220)})),lastBot:document.querySelector('#chatB .msg.bot:last-of-type')?.innerText?.slice(0,180)}));return {ok:false,info:{error:'Back did not unlock an editable deposit slider',chosen,after,revisited,backTrail,diagnose}}; }
      const edited=await newRange.evaluate((el,original)=>{
        const steps=(el.dataset.ladder||'').split(',').map(Number).filter(Boolean);
        const value=steps.find(x=>x!==original);
        const ix=steps.indexOf(value);
        el.value=String(ix);el.dispatchEvent(new Event('input',{bubbles:true}));
        return {id:el.id,value,index:ix,old:original};
      },chosen.value);
      await page.locator(`#chatB [data-rsld-for="${edited.id}"]`).last().click();await sleep(page,240);
      const changed=await page.evaluate(({oldId,newId})=>({
        deposit:wd('rent').data.B?.depB,
        step:SCRIPTS[CE.f]?.[CE.i]?.id,
        oldDisabled:document.getElementById(oldId)?.disabled,
        editedDisabled:document.getElementById(newId)?.disabled
      }),{oldId:chosen.id,newId:edited.id});
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,310);
      const persisted=await page.evaluate(()=>wd('rent').data.B?.depB);
      // A previously confirmed monthly-rent budget can legitimately skip rentb.
      // The contract is an exact committed deposit, no repeatable old slider,
      // and Back deliberately enables a new revision, without mutating history.
      return {ok:chosen.value>0&&after.deposit===chosen.value&&after.advanced&&
        after.oldDisabled===true&&after.oldBtnDisabled===true&&revisited.flow==='rent'&&
        edited.value>0&&edited.value!==chosen.value&&edited.id!==chosen.id&&
        changed.deposit===edited.value&&changed.oldDisabled===true&&
        changed.editedDisabled===true&&persisted===edited.value,
        info:{chosen,after,revisited,backTrail,edited,changed,persisted}};
    });

    await run('H06','Contract parties, zero-rent terms, approvals, payment, and termination CTA stay inside chat',async page=>{
      await page.evaluate(()=>{
        go('landing');
      });
      await send(page,'می‌خوام آپارتمان دوخوابه در محلهٔ سعادت‌آباد اجاره کنم. ودیعه تا ۳ میلیارد تومان و اجاره تا ۷۰ میلیون تومان. حداقل دو خواب و پارکینگ الزامیه.');
      await drainDisc(page);await walkTo(page,'list');
      await page.locator('#chatB [data-cba="selL"]').last().click();
      await walkTo(page,'visit');await page.locator('#chatB [data-cv="!go"]').last().click();
      await page.locator('[data-paygo]').last().click();await sleep(page,200);
      await walkTo(page,'ctr0');
      await page.locator('#chatB [data-cv="!open"]').last().click();await sleep(page,220);
      const chatForm=await page.locator('#chatB [data-e28ctr] #cl-name').count()===1;
      if(!chatForm)return {ok:false,info:{error:'Contract did not open in chat'}};
      await page.locator('#cl-name').fill('مستأجر آزمون');
      await page.locator('#cl-id').fill('1234567891');
      // Current logged-in mobile is read-only: check the actual account value,
      // never attempt to fake user editing of this protected input.
      const lesseeMobile=await page.locator('#cl-mobile').inputValue();
      if(!/^09\d{9}$/.test(lesseeMobile))return {ok:false,info:{error:'Read-only logged-in mobile missing',lesseeMobile}};
      await page.locator('#co-name').fill('موجر آزمون');
      await page.locator('#co-id').fill('9876543210');
      await page.locator('#co-mobile').fill('09123334455');
      await page.locator('#chatB [data-act="cpartySave"]').last().click();await sleep(page,240);
      const parties=await page.evaluate(()=>wd('rent').data.ctr?.step);
      if(parties!==2)return {ok:false,info:{error:'Party step blocked',step:parties}};
      await page.locator('#cp-postal').fill('1234567890');
      await page.locator('#cp-addr').fill('نشانی کاملاً آزمایشی، پلاک ۱');
      await page.locator('#cp-area').fill('70');
      const tomorrow=new Date(Date.now()+864e5).toISOString().slice(0,10);
      await page.locator('#cp-start').fill(tomorrow);
      await page.locator('#cp-dep').fill('1000000000');
      await page.locator('#cp-rent').fill('0');
      await page.locator('#chatB [data-act="cpropSave"]').last().click();await sleep(page,210);
      const property=await page.evaluate(()=>wd('rent').data.ctr?.step);
      if(property!==3)return {ok:false,info:{error:'Zero-rent financial terms blocked',parties,property}};
      // Switch inputs are visually hidden (0 × 0, opacity 0), so the actual
      // user interaction is clicking their visible wrapping labels.
      await page.locator('label.switch:has(#ca-me)').click();
      await page.locator('label.switch:has(#ca-owner)').click();
      const acknowledged=await page.evaluate(()=>({me:document.getElementById('ca-me')?.checked,
        owner:document.getElementById('ca-owner')?.checked}));
      if(!acknowledged.me||!acknowledged.owner)return {ok:false,info:{error:'Visible contract approval switch failed',acknowledged}};
      await page.locator('#ca-me-name').fill('مستأجر آزمون');
      await page.locator('#ca-owner-name').fill('موجر آزمون');
      await page.locator('#chatB [data-act="capprove"]').last().click();await sleep(page,200);
      const approved=await page.evaluate(()=>wd('rent').data.ctr?.step);
      if(approved!==4)return {ok:false,info:{error:'Approval step blocked',approved}};
      await page.locator('#chatB [data-act="cfinalize"]').last().click();await sleep(page,180);
      const pending=await page.evaluate(()=>({before:S.tokens,price:S.paySession?.cost,state:S.paySession?.state}));
      const payBtn=page.locator('[data-paygo]').last();
      if(await payBtn.count())await payBtn.click();await sleep(page,490);
      const registered=await page.evaluate(()=>({
        balance:S.tokens,code:wd('rent').data.code,finalized:wd('rent').data.ctr?.finalized,
        listing:wd('rent').data.ctr?.terms?.rent,
        contract:(S.contracts||[]).find(x=>x.code===wd('rent').data.code)?.status,
        chat:CURRENT==='landing'&&!!document.querySelector('#chatB [data-e28ctr]'),
        termButton:!!document.querySelector('#chatB [data-cba="ctrCont"][data-v="trm"]')
      }));
      const termCTA=page.locator('#chatB [data-cba="ctrCont"][data-v="trm"]').last();
      if(await termCTA.count())await termCTA.click();await sleep(page,160);
      const unrelated=await page.evaluate(code=>{
        const original=(S.wfs||[]).find(w=>w.m==='rent'&&w.data?.code===code),contract=S.contracts.find(c=>c.code===code);
        const other=wfNew('rent');other.data=JSON.parse(JSON.stringify(original.data));
        other.data.code='UNRELATED-TARGET';other.data.ctr.code='UNRELATED-TARGET';
        const copy=JSON.parse(JSON.stringify(contract));copy.code='UNRELATED-TARGET';copy.wfId=other.id;
        if(copy.doc)copy.doc.code='UNRELATED-TARGET';
        S.contracts.unshift(copy);wfSet('rent',original.id);save();
        return {code:copy.code,contract:JSON.stringify(copy),workflow:JSON.stringify(other.data)};
      },registered.code);
      await send(page,await page.evaluate(()=>E30.guide.actions.termination.prompt));
      const choices=await page.locator('#chatB [data-cba="e31TermStart"]').count();
      if(choices<2)throw Error('Termination did not present both explicit contract targets');
      const beforeChoice=await page.evaluate(()=>S.contracts.map(c=>c.status));
      if(!beforeChoice.every(s=>s==='signed_internal'))throw Error('Opening termination mutated a contract before target selection');
      await page.locator('#chatB [data-cba="e31TermStart"][data-code="'+registered.code+'"]').last().click();await sleep(page,120);
      const termination=await page.evaluate(()=>({view:CURRENT,flow:CE.f,step:SCRIPTS[CE.f]?.[CE.i]?.id}));
      /* Finish the actual chat journey — a CTA alone does not prove a valid
         termination. Each confirmation belongs to a distinct browser click. */
      const termSteps=[];
      async function choose(value){
        const btn=page.locator('#chatB [data-cv]').filter({hasText:''}).last();
        const chosen=page.locator(`#chatB [data-cv="${value}"]`).last();
        if(!await chosen.count())throw Error('Missing termination choice: '+value+'; last visible '+await btn.getAttribute('data-cv'));
        await chosen.click();await sleep(page,150);
        const step=await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id||null);
        termSteps.push({value,step});
      }
      if(termination.step==='termq'){
        await choose('!go');
        await choose('توافق');
        await choose('۳۰ روز دیگر');
        await choose('!send');
        await choose('confirmed');
        await choose('!skip');
        await choose('!pay');
        await choose('!pay');
      }
      const settled=await page.evaluate(()=>({
        paid:wd('rent').data.term?.paid||false,
        done:wd('rent').done,
        code:wd('rent').data.code,
        contract:(S.contracts||[]).find(x=>x.code===wd('rent').data.code)?.status,
        requests:(S.reqs||[]).filter(x=>(x.title||'').includes(wd('rent').data.code)).map(x=>({kind:x.kind,status:x.status})),
        view:CURRENT,flow:CE.f,balance:S.tokens
      }));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,330);
      const persisted=await page.evaluate(()=>({
        paid:wd('rent').data.term?.paid||false,
        contract:(S.contracts||[]).find(x=>x.code===wd('rent').data.code)?.status,
        balance:S.tokens
      }));
      const unrelatedAfter=await page.evaluate(code=>({contract:JSON.stringify(S.contracts.find(c=>c.code===code)),workflow:JSON.stringify(S.wfs.find(w=>w.data?.code===code).data)}),unrelated.code);
      return {ok:chatForm&&pending.before===480&&pending.price===60&&pending.state==='presented'&&
        registered.balance===420&&registered.finalized===true&&registered.listing===0&&
        registered.contract==='signed_internal'&&registered.chat&&registered.termButton&&
        termination.view==='landing'&&termination.flow==='rent'&&termination.step==='termq'&&
        termSteps.map(x=>x.step).join(',')==='treason,tdate,tmin,totp,tai,tai,tpay,'&&
        settled.paid&&settled.done&&settled.contract==='terminated'&&settled.view==='landing'&&
        settled.balance===420&&persisted.paid&&persisted.contract==='terminated'&&persisted.balance===420&&
        unrelated.contract===unrelatedAfter.contract&&unrelated.workflow===unrelatedAfter.workflow,
        info:{parties,property,approved,pending,registered,termination,termSteps,settled,persisted,unrelatedUnchanged:unrelated.contract===unrelatedAfter.contract&&unrelated.workflow===unrelatedAfter.workflow}};
    });

    await run('H07','Actual in-app PDF print action produces print DOM and a valid Chromium PDF',async page=>{
      const before=await page.evaluate(()=>{
        const D=wd('rent').data,c=conInit(D,'rent');
        c.prop={title:'آپارتمان آزمایشی',addr:'نشانی نمونه',postal:'1234567890',area:70};
        c.terms={deposit:10000000000,rent:0,duration:'یک‌ساله',start:'2026-12-01'};
        ACT.cdoc({getAttribute:()=> 'cur'});
        window.__qaPrintCalled=false;window.print=function(){window.__qaPrintCalled=true};
        return {modal:!!document.querySelector('#modal-root [data-act="cprint"]'),unofficial:/ثبت رسمی انجام نشده/.test(document.getElementById('modal-root')?.innerText||'')};
      });
      const btn=page.locator('#modal-root [data-act="cprint"]');
      if(await btn.count())await btn.click();await sleep(page,165);
      const ready=await page.evaluate(()=>({called:window.__qaPrintCalled,printing:document.body.classList.contains('doc-printing'),
        doc:document.getElementById('print-root')?.innerText||''}));
      const pdf=await page.pdf({format:'A4',printBackground:true});
      return {ok:before.modal&&before.unofficial&&ready.called&&ready.printing&&/ودیعه/.test(ready.doc)&&
        pdf.subarray(0,4).toString('ascii')==='%PDF'&&pdf.byteLength>2000,
        info:{before,ready:{called:ready.called,printing:ready.printing,docLength:ready.doc.length},pdfBytes:pdf.byteLength}};
    });

    await run('H08','Soft parking/elevator boost rank but never reject; required ones still exclude',async page=>{
      const v=await page.evaluate(()=>{
        const good={...RLIST.find(x=>x.id==='r5')},other={...good,park:false,elev:false};
        const base={P:{beds:2,maxAge:30,_ageHard:false,minM2:0,park:false,elev:false,
          metro:3,school:3,work:3,prefRules:{}},B:{rentB:700000000,depB:30000000000}};
        const soft={...base,P:{...base.P,prefRules:{parking:'preferred',elevator:'preferred'}}};
        const hard={...base,P:{...base.P,prefRules:{parking:'required',elevator:'required'}}};
        return {
          softAllows:[E30.flowsAPI.rentPass(good,soft),E30.flowsAPI.rentPass(other,soft)],
          hardAllows:[E30.flowsAPI.rentPass(good,hard),E30.flowsAPI.rentPass(other,hard)],
          baseScores:[lscore(good,base),lscore(other,base)],
          preferredScores:[lscore(good,soft),lscore(other,soft)]
        };
      });
      const baseGap=v.baseScores[0]-v.baseScores[1],preferredGap=v.preferredScores[0]-v.preferredScores[1];
      return {ok:v.softAllows[0]&&v.softAllows[1]&&v.hardAllows[0]&&!v.hardAllows[1]&&
        Number.isFinite(baseGap)&&preferredGap>baseGap,info:{...v,baseGap,preferredGap}};
    });

    await run('H09','Real interactive neighborhood map loads inside chat without leaving the active flow',async page=>{
      const before=await page.evaluate(()=>{
        go('landing');ceStart('rent');
        return {view:CURRENT,flow:CE.f,step:CE.i,listing:wd('rent').data.listing||null};
      });
      await send(page,'نقشه');
      const map=page.locator('#chatB .e30-chat-map-card').last();
      const chatCard=await map.isVisible();
      const explanation=await map.innerText();
      const loader=map.locator('[data-cba="e30MapLoad"]');
      if(await loader.count())await loader.click();await sleep(page,500);
      const loaded=await page.evaluate(()=>({
        canvas:document.querySelectorAll('#chatB .e30-chat-map-canvas[data-e30-map-loaded="true"]').length,
        leaflets:document.querySelectorAll('#chatB .e30-chat-map-canvas.leaflet-container').length,
        markers:document.querySelectorAll('#chatB .e30-chat-map-canvas .leaflet-marker-icon').length,
        view:CURRENT,flow:CE.f,step:CE.i,listing:wd('rent').data.listing||null
      }));
      const marker=page.locator('#chatB .e30-chat-map-canvas .leaflet-marker-icon').first();
      if(await marker.count())await marker.click();await sleep(page,130);
      const detail=page.locator('#chatB .leaflet-popup [data-cba="e30MapInfo"]').first();
      const popup=await detail.count()===1;
      if(popup)await detail.click();await sleep(page,200);
      const end=await page.evaluate(()=>({view:CURRENT,flow:CE.f,step:CE.i,listing:wd('rent').data.listing||null,
        last:(HIST.at(-1)||{}).h||''}));
      return {ok:chatCard&&/نمونه/.test(explanation)&&loaded.canvas>=1&&loaded.leaflets>=1&&
        loaded.markers>=6&&popup&&/اجارهٔ نمونه/.test(end.last)&&
        end.view===before.view&&end.flow===before.flow&&end.step===before.step&&
        end.listing===before.listing,info:{before,chatCard,loaded,popup,end:{...end,last:end.last.slice(0,180)}}};
    });

    await run('H10','Reminder panel supports weekly recurrence, edits, next occurrence, and persistence',async page=>{
      await page.locator('[data-act="e29panelRem"]').first().click();
      await page.locator('[data-act="e29remNew"]').click();
      const future=new Date(Date.now()+30*864e5);
      const local=new Date(future.getTime()-future.getTimezoneOffset()*60000).toISOString().slice(0,16);
      await page.locator('#e29-rt').fill('بازدید هفتگی اولیه');
      await page.locator('#e29-rd').fill(local);
      await page.locator('#e30-rem-repeat-new').selectOption('weekly');
      await page.locator('#modal-root [data-act="e29remNewGo"]').click();await sleep(page,160);
      const initial=await page.evaluate(()=>{
        const r=(S.reminders||[]).find(x=>x.title==='بازدید هفتگی اولیه');
        return r&&{id:r.id,due:r.due,rec:r.rec,editVisible:!!document.querySelector(`#e29-rbody [data-rem="${r.id}"] [data-act="e30remEdit"]`)};
      });
      if(!initial?.editVisible)return {ok:false,info:{error:'Panel did not expose edit button',initial}};
      await page.locator(`#e29-rbody [data-rem="${initial.id}"] [data-act="e30remEdit"]`).click();
      const populated=await page.locator('#e30-rem-repeat-edit').inputValue();
      await page.locator('#re28-t').fill('بازدید هفتگی اصلاح‌شده');
      await page.locator('#modal-root [data-act="remEditOk28"]').click();await sleep(page,190);
      const edited=await page.evaluate(id=>{
        const r=(S.reminders||[]).find(x=>x.id===id);
        return r&&{title:r.title,due:r.due,rec:r.rec,visible:(document.getElementById('e29-rbody')||{}).innerText.includes('بازدید هفتگی اصلاح‌شده')};
      },initial.id);
      await page.locator(`#e29-rbody [data-rem="${initial.id}"] [data-act="e29remDone"]`).click();await sleep(page,200);
      const cycle=await page.evaluate(id=>{
        const old=(S.reminders||[]).find(x=>x.id===id);
        const next=(S.reminders||[]).filter(x=>x.id!==id&&x.title===old?.title&&!x.done);
        return {oldDone:old?.done,next:next.map(x=>({id:x.id,due:x.due,rec:x.rec})),
          nextVisible:next.length===1&&!!document.querySelector(`#e29-rbody [data-rem="${next[0].id}"]`)};
      },initial.id);
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,300);
      const persisted=await page.evaluate(id=>{
        const old=(S.reminders||[]).find(x=>x.id===id);
        const next=(S.reminders||[]).filter(x=>x.id!==id&&x.title===old?.title&&!x.done);
        return {oldDone:old?.done,count:next.length,rec:next[0]?.rec,due:next[0]?.due};
      },initial.id);
      return {ok:initial.rec==='weekly'&&populated==='weekly'&&
        edited?.title==='بازدید هفتگی اصلاح‌شده'&&edited.rec==='weekly'&&edited.visible&&
        cycle.oldDone===true&&cycle.next.length===1&&cycle.nextVisible&&
        cycle.next[0].rec==='weekly'&&cycle.next[0].due===initial.due+7*864e5&&
        persisted.oldDone===true&&persisted.count===1&&persisted.rec==='weekly'&&
        persisted.due===initial.due+7*864e5,info:{initial,populated,edited,cycle,persisted}};
    });

    await run('H11','Every supported workflow type resumes its own exact progress from the library',async page=>{
      const flows=['buy','invr','mkt','build','stay','grt'];
      const checks=[];
      for(const kind of flows){
        const setup=await page.evaluate(kind=>{
          const w=wd(kind);w.step=4;w.data={qaMarker:'resume-'+kind,qaSteps:[1,2,3]};
          const item=E29.libAPI.saveWorkflowProgress(w,45);
          w.step=1;w.data={};save();
          E29.shell.openPanel('library',{item:item.id});
          return {libId:item.id,id:w.id,rendered:!!document.querySelector('#e29-lbody [data-act="e29libResume"]')};
        },kind);
        const btn=page.locator('#e29-lbody [data-act="e29libResume"]');
        if(setup.rendered&&await btn.count())await btn.click();
        await sleep(page,120);
        const after=await page.evaluate(kind=>({step:wd(kind).step,marker:wd(kind).data.qaMarker,view:CURRENT}),kind);
        checks.push({kind,setup,after,pass:setup.rendered&&after.step===4&&after.marker==='resume-'+kind&&after.view==='landing'});
      }
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,330);
      const persisted=await page.evaluate(flows=>flows.map(kind=>({kind,step:wd(kind).step,marker:wd(kind).data.qaMarker})),flows);
      return {ok:checks.length===flows.length&&checks.every(x=>x.pass)&&
        persisted.every(x=>x.step===4&&x.marker==='resume-'+x.kind),info:{checks,persisted}};
    });

    await run('H12','Sample valuation is priced, explicitly confirmed, billed once, saved and retained after reload',async page=>{
      await page.evaluate(()=>{S.tokens=200;save();renderTok()});
      await send(page,'تخمین ارزش ملک');
      const form=page.locator('#chatB #e30-val-area');
      const visible=await form.count()===1&&await form.isVisible();
      if(!visible)return {ok:false,info:{error:'In-chat valuation form absent'}};
      await form.fill('85');
      await page.locator('#chatB #e30-val-age').fill('10');
      const hood=await page.locator('#chatB #e30-val-hood').inputValue();
      await page.locator('#chatB [data-cba="e30ValQuote"]').click();await sleep(page,200);
      const before=await page.evaluate(()=>({
        balance:S.tokens,state:S.paySession?.state,key:S.paySession?.key,cost:S.paySession?.cost,
        estimateReports:(S.library||[]).filter(x=>x.type==='valuation').length
      }));
      const pay=page.locator('#chatB [data-paygo]').last();
      if(await pay.count())await pay.click();await sleep(page,300);
      const after=await page.evaluate(()=>({
        balance:S.tokens,state:S.paySession?.state,
        report:(S.library||[]).find(x=>x.type==='valuation'),
        debits:(S.log||[]).filter(x=>x.svc==='valuation'&&x.c<0).length,
        last:(HIST.at(-1)||{}).h||''
      }));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,350);
      const persisted=await page.evaluate(()=>({
        balance:S.tokens,
        report:(S.library||[]).find(x=>x.type==='valuation'),
        debits:(S.log||[]).filter(x=>x.svc==='valuation'&&x.c<0).length
      }));
      return {ok:visible&&hood&&before.balance===200&&before.state==='presented'&&
        before.key==='valuation'&&before.cost===40&&before.estimateReports===0&&
        after.balance===160&&after.state==='completed'&&after.report?.artifact?.estimate>0&&
        after.report?.artifact?.area===85&&after.report?.artifact?.age===10&&
        after.report?.artifact?.source==='internal-sample'&&after.report?.txnId&&
        after.report?.tokenCost===40&&after.debits===1&&
        /نمونه/.test(after.last)&&persisted.balance===160&&persisted.debits===1&&
        persisted.report?.txnId===after.report?.txnId,info:{visible,hood,before,
          after:{balance:after.balance,state:after.state,report:after.report&&{
            id:after.report.id,txnId:after.report.txnId,estimate:after.report.artifact.estimate,
            age:after.report.artifact.age,area:after.report.artifact.area},debits:after.debits},
          persisted:{balance:persisted.balance,id:persisted.report?.id,debits:persisted.debits}}};
    });

    await run('H13','Valuation rejects invalid numeric inputs and cancellation does not debit or create a report',async page=>{
      await page.evaluate(()=>{S.tokens=200;save();renderTok()});
      await send(page,'تخمین ارزش ملک');
      await page.locator('#chatB #e30-val-area').fill('0');
      await page.locator('#chatB [data-cba="e30ValQuote"]').click();await sleep(page,120);
      const invalid=await page.evaluate(()=>({
        balance:S.tokens,session:S.paySession,report:(S.library||[]).filter(x=>x.type==='valuation').length
      }));
      await page.locator('#chatB #e30-val-area').fill('80');
      await page.locator('#chatB [data-cba="e30ValQuote"]').click();await sleep(page,140);
      const presented=await page.evaluate(()=>S.paySession?.state);
      const cancel=page.locator('#chatB [data-paycancel]').last();
      if(await cancel.count())await cancel.click();await sleep(page,140);
      const end=await page.evaluate(()=>({
        balance:S.tokens,session:S.paySession,report:(S.library||[]).filter(x=>x.type==='valuation').length,
        debits:(S.log||[]).filter(x=>x.svc==='valuation'&&x.c<0).length
      }));
      return {ok:invalid.balance===200&&!invalid.session&&invalid.report===0&&
        presented==='presented'&&end.balance===200&&!end.session&&
        end.report===0&&end.debits===0,info:{invalid,presented,end}};
    });

    async function choice(page,value){
      await page.locator(`#chatB [data-cv="${value}"]`).last().click();await sleep(page,130);
    }
    async function purchaseForm(page,price){
      await page.locator('#cl-name').fill('خریدار آزمون');await page.locator('#cl-id').fill('1234567891');
      await page.locator('#co-name').fill('فروشنده آزمون');await page.locator('#co-id').fill('9876543210');
      await page.locator('#co-mobile').fill('09123334455');
      await page.locator('#chatB [data-act="cpartySave"]').last().click();await sleep(page,100);
      await page.locator('#cp-postal').fill('1234567890');await page.locator('#cp-addr').fill('نشانی آزمون خرید');
      await page.locator('#cp-area').fill('70');await page.locator('#cp-price').fill(String(price/10));
      await page.locator('#cp-delivery').fill(new Date(Date.now()+864e5).toISOString().slice(0,10));
      await page.locator('#chatB [data-act="cpropSave"]').last().click();await sleep(page,100);
      await page.locator('label.switch:has(#ca-me)').click();await page.locator('label.switch:has(#ca-owner)').click();
      await page.locator('#ca-me-name').fill('خریدار آزمون');await page.locator('#ca-owner-name').fill('فروشنده آزمون');
      await page.locator('#chatB [data-act="capprove"]').last().click();await sleep(page,100);
      await page.locator('#chatB [data-act="cfinalize"]').last().click();await sleep(page,100);
      const before=await page.evaluate(()=>({cost:S.paySession?.cost,state:S.paySession?.state,balance:S.tokens}));
      await page.locator('[data-paygo]').last().click();await sleep(page,200);
      const after=await page.evaluate(()=>({signed:wd('buy').data.ctr?.finalized,price:wd('buy').data.ctr?.terms.price,
        code:wd('buy').data.code,balance:S.tokens,contracts:S.contracts.length}));
      if(before.cost!==60||before.state!=='presented'||!after.signed||after.price!==price||after.balance!==before.balance-60)throw Error('Purchase registration failed '+JSON.stringify({before,after}));
      return after;
    }
    await run('H14','Purchase discovery, matched selection, legal report, contract, escrow and delivery persist',async page=>{
      await send(page,'می‌خواهم آپارتمان دوخوابه در نارمک بخرم با بودجه ۳۰ میلیارد تومان');
      await drainDisc(page);
      const answers={budg:'300000000000',age:'0|30',m2:'60|90',ppm:'1800000000|5500000000',floor:'1|10',beds:'2',feat:'none',hoods:'نارمک',liq:'skip'};
      for(let i=0;i<25;i++){
        const st=await page.evaluate(()=>{const x=SCRIPTS[CE.f]?.[CE.i];return {flow:CE.f,id:x?.id,loop:!!x?.loop,chips:x?.chips?(typeof x.chips==='function'?x.chips(wd(CE.f).data):x.chips):[]}});
        if(st.flow!=='buy')throw Error('No purchase handoff '+JSON.stringify(st));
        if(st.id==='list')break;
        const value=answers[st.id]||(st.loop?'3':st.chips[0]?.[1]||'ok');
        const chip=page.locator(`#chatB [data-cv="${value}"]`).last();
        if(await chip.count())await choice(page,value);else await send(page,value);
      }
      const cards=page.locator('#chatB [data-cba="selB"]');
      if(!await cards.count())throw Error('No matched purchase listing '+JSON.stringify(await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,data:wd('buy').data,last:HIST.slice(-2)}))));
      await cards.last().click();await choice(page,'!skp');await send(page,'ok');await choice(page,'!lg');
      await page.locator('[data-paygo]').last().click();await sleep(page,180);await choice(page,'!nx');
      await choice(page,'!continue');
      const blocked=await page.evaluate(()=>SCRIPTS[CE.f][CE.i].id==='buy_ctr'&&!wd('buy').data.signed);
      await choice(page,'!open');const signed=await purchaseForm(page,140000000000);
      await choice(page,'!continue');await send(page,'no');await choice(page,'!ok1');await choice(page,'!ok');
      await page.locator('[data-paygo]').last().click();await sleep(page,160);
      // Re-render current escrow state through the visible completion choice.
      const escrow=await page.evaluate(()=>({released:wd('buy').data.escD,stage:SCRIPTS[CE.f]?.[CE.i]?.id,balance:S.tokens}));
      await choice(page,'!done');await choice(page,'!all');
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,300);
      const end=await page.evaluate(()=>({done:wd('buy').done,signed:wd('buy').data.ctr?.finalized,code:wd('buy').data.code,
        balance:S.tokens,ut:wd('buy').data.ut,contract:(S.contracts||[]).find(x=>x.code===wd('buy').data.code)?.status}));
      return {ok:blocked&&signed.balance===340&&escrow.released===1&&end.done&&end.signed&&end.code===signed.code&&end.balance===190&&end.ut.every(Boolean)&&end.contract==='signed_internal',info:{blocked,signed,escrow,end}};
    });
    await run('H15','Seller pricing, accepted offer, internal purchase contract and sale request survive reload',async page=>{
      await send(page,'می‌خوام ملکم رو بفروشم. نارمک ۸۵ متر دو خوابه، سند تک‌برگ، عجله ندارم ولی زیر ۱۱ میلیارد نمی‌فروشم.');
      await drainDisc(page);await walkTo(page,'s_inq',30);
      await choice(page,'!yes');await choice(page,'!open');
      const deal=await page.evaluate(()=>wd('sell').data.deal);
      const signed=await purchaseForm(page,deal);
      await choice(page,'!status');
      const before=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,done:wd('sell').done,req:wd('sell').data.saleReqId,
        draft:wd('sell').data.sellerContractDraft,buyDraft:wd('buy').data.ctr?.draftCode}));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,300);
      const end=await page.evaluate(()=>({done:wd('sell').done,request:(S.reqs||[]).find(x=>x.id===wd('sell').data.saleReqId),signed:wd('buy').data.ctr?.finalized}));
      return {ok:deal>0&&signed.price===deal&&before.step==='s_done'&&before.done&&before.req&&before.draft===before.buyDraft&&end.done&&end.signed&&/قرارداد داخلی/.test(end.request?.status||''),info:{deal,signed,before,end}};
    });
    await run('H16','Personalized investment goal and risk reach a saved report and tracked completed request',async page=>{
      await send(page,'حدود ۳۰ میلیارد تومان سرمایه دارم. می‌خوام یه ملک بخرم که اجاره ماهانه بده.');await drainDisc(page);
      const initialCapital=await page.evaluate(()=>wd('invp').data.cap);
      if(initialCapital!==300000000000)throw Error('The stated 30B toman capital changed during handoff: '+initialCapital);
      // User-facing inputs are toman; saved historical financial values remain
      // rial. Replay the same 30B toman capital and request 10M toman income.
      const answers={i_obj:'rent_income',i_cap:'۳۰ میلیارد تومان',i_liq:'some',i_hor:'میان‌مدت',i_risk:'medium',i_asset:'residential',i_fin:'cash',i_income:'۱۰ میلیون تومان',i_mgmt:'self',i_exit:'hold',i_hood:'نارمک'};
      for(let i=0;i<20;i++){
        const st=await page.evaluate(()=>({flow:CE.f,id:SCRIPTS[CE.f]?.[CE.i]?.id}));
        if(st.flow!=='invp')throw Error('Wrong investor flow '+JSON.stringify(st));
        if(st.id==='i_an')break;
        if(!answers[st.id])throw Error('Unanswered investor step '+st.id);
        const value=answers[st.id];
        if(await page.locator(`#chatB [data-cv="${value}"]`).count())await choice(page,value);else await send(page,value);
      }
      const text=await page.locator('#chatB .msg.bot').last().innerText();await choice(page,'!save');
      const before=await page.evaluate(()=>({report:(S.library||[]).find(x=>x.type==='invest'),done:wd('invp').done,balance:S.tokens}));
      await page.reload({waitUntil:'domcontentloaded'});await sleep(page,300);
      const end=await page.evaluate(()=>({report:(S.library||[]).find(x=>x.type==='invest'),done:wd('invp').done,req:(S.reqs||[]).find(x=>x.cat==='invest'),balance:S.tokens}));
      return {ok:/نمونه/.test(text)&&before.done&&end.done&&end.req?.status==='کامل شد'&&before.report?.id===end.report?.id&&end.balance===500&&end.report?.artifact?.data?.objective==='rent_income'&&end.report?.artifact?.data?.cap===300000000000&&end.report?.artifact?.data?.assetType==='residential'&&end.report?.artifact?.data?.financing==='cash'&&end.report?.artifact?.data?.risk==='medium'&&end.report?.artifact?.data?.expectedCash===100000000&&end.report?.artifact?.data?.hood==='h6',info:{before,end}};
    });
    await run('H17','Every paid tariff confirms, cancels, rejects insufficient funds, refunds failure and retries exactly once',async page=>{
      const keys=await page.evaluate(()=>Object.keys(E30.PRICING).filter(k=>E30.PRICING[k].cost>0));
      const checks=[];
      for(const key of keys){
        const result=await page.evaluate(key=>{
          S.tokens=1000;S.paySession=null;save();let calls=0;
          const cost=E30.price(key),begin=cb=>E30.pay.begin({key,onConfirm:cb});
          begin(()=>{calls++;return true});const before={state:S.paySession?.state,balance:S.tokens};
          E30.pay.cancel(S.paySession.payId,true);const cancelled=!S.paySession&&S.tokens===1000&&calls===0;
          S.tokens=0;begin(()=>{calls++;return true});const insufficient=S.paySession?.state==='insufficient'&&S.tokens===0&&calls===0;
          E30.pay.cancel(S.paySession.payId,true);S.tokens=1000;
          begin(()=>false);const failedId=S.paySession.payId;E30.pay.go(failedId);
          const refunded=S.tokens===1000&&S.paySession?.state==='refunded';
          begin(()=>{calls++;return true});const id=S.paySession.payId;
          E30.pay.go(id);E30.pay.go(id);
          const success=calls===1&&S.tokens===1000-cost&&S.paySession?.state==='completed';
          const journal=(S.log||[]).filter(x=>x.payId===id&&x.c<0);
          return {key,cost,before,cancelled,insufficient,refunded,success,debits:journal.length};
        },key);
        checks.push(result);
      }
      return {ok:checks.length===10&&checks.every(x=>x.before.state==='presented'&&x.before.balance===1000&&x.cancelled&&x.insufficient&&x.refunded&&x.success&&x.debits===1),info:{checks}};
    });
    await run('H18','A real Chromium PDF is selected, validated and shared as file bytes with cancellation and fallback',async page=>{
      await page.evaluate(()=>{conInit(wd('rent').data,'rent');ACT.cdoc({getAttribute:()=> 'cur'})});
      const pdf=await page.pdf({format:'A4'});
      await page.locator('#modal-root [data-act="e30pdfShare"]').click();
      await page.locator('#modal-root [data-act="e30pdfSend"]').click();
      const missing=await page.locator('#e30-pdf-status').innerText();
      await page.locator('#e30-pdf-file').setInputFiles({name:'fake.pdf',mimeType:'application/pdf',buffer:Buffer.from('fake')});
      await page.locator('#modal-root [data-act="e30pdfSend"]').click();await sleep(page,100);
      const invalid=await page.locator('#e30-pdf-status').innerText();
      // Native OS sheets are outside Playwright; stub only this platform
      // boundary, and verify the exact file bytes passed by the actual UI.
      await page.evaluate(()=>{
        window.__shared=[];
        Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
        Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{
          const f=data.files[0];window.__shared.push({name:f.name,size:f.size,magic:await f.slice(0,5).text()});
        }});
      });
      await page.locator('#e30-pdf-file').setInputFiles({name:'contract.pdf',mimeType:'application/pdf',buffer:pdf});
      await page.locator('#modal-root [data-act="e30pdfSend"]').click();await sleep(page,100);
      const shared=await page.evaluate(()=>window.__shared);
      await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancelled','AbortError')}}));
      await page.locator('#modal-root [data-act="e30pdfSend"]').click();await sleep(page,100);
      const cancelled=await page.locator('#e30-pdf-status').innerText();
      await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
      await page.locator('#modal-root [data-act="e30pdfSend"]').click();await sleep(page,100);
      const fallback=await page.locator('#e30-pdf-status').innerText();
      return {ok:/انتخاب/.test(missing)&&/معتبر نیست/.test(invalid)&&shared.length===1&&shared[0].magic==='%PDF-'&&shared[0].size===pdf.length&&/لغو/.test(cancelled)&&/پیوست/.test(fallback),info:{missing,invalid,shared,cancelled,fallback}};
    });
  }finally{
    await browser.close();
    fs.writeFileSync(path.join(out,'full-journeys-results.json'),JSON.stringify(results,null,2));
  }
  const failed=results.filter(x=>x.result==='FAIL');
  console.log(`FULL JOURNEYS: ${results.length-failed.length} passed, ${failed.length} failed, ${results.length} checks`);
  if(failed.length)console.log('FAILED:',failed.map(x=>x.id).join(' | '));
  process.exitCode=failed.length?1:0;
})().catch(e=>{console.error('FULL JOURNEY HARNESS CRASH',e);process.exitCode=2});
