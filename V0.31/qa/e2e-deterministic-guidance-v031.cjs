/* Browser-level checks that prompt suggestions execute existing real flows.
   Browser data are all local demonstration data, never a live real-estate API. */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results'),results=[];
const assert=(x,s)=>{if(!x)throw Error(s)};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,
    args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  async function test(name,fn){
    const context=await browser.newContext({viewport:{width:1300,height:900}}),page=await context.newPage(),errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    try{
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>doLogin('QA'));
      await page.waitForTimeout(150);
      await fn(page);
      assert(errs.length===0,'browser exceptions: '+errs.join('; '));
      results.push({name,status:'PASS'});console.log('PASS '+name);
    }catch(e){results.push({name,status:'FAIL',reason:String(e.stack||e)});console.error('FAIL '+name+': '+String(e.stack||e).slice(0,2000))}
    finally{await context.close()}
  }
  const send=async(page,s)=>{await page.locator('#chatIn').fill(s);await page.locator('#chatSend').click();await page.waitForTimeout(180)};
  try{
    await test('Initial onboarding provides prompts without inventing a separate user turn',async page=>{
      const state=await page.evaluate(()=>({history:HIST.length,guide:!!document.querySelector('#chatB .e31-guide'),
        current:CURRENT,auth:!!S.auth,chatExists:!!document.getElementById('chatB'),
        chatHTML:document.getElementById('chatB')?.innerHTML?.slice(0,300),
        lastMessages:HIST.slice(-3).map(x=>({role:x.r,text:String(x.h||'').slice(0,100)})),
        hasGuide:!!(E30.guide&&E30.guide.registry),guideNode:E30.guide?.getCurrent?.(),
        userTurns:HIST.filter(x=>x.r==='user').length,botTurns:HIST.filter(x=>x.r==='bot').length}));
      assert(state.guide&&state.userTurns===0&&state.botTurns===1&&state.history===1,
        'onboarding starter should share the first real assistant bubble without creating a fake turn: '+JSON.stringify(state));
      assert(await page.locator('#chatB [data-e31-id="rent"]').count()===1,'rent starter prompt missing');
      assert(await page.locator('#chatB [data-e31-id="buy"]').count()===1,'buy starter prompt missing');
    });
    await test('Starting rent from the onboarding suggestions exits the legacy gate',async page=>{
      const choice=page.locator('#chatB [data-e31-id="rent"]').last();
      assert(await choice.count()===1,'starter rent prompt missing');
      await choice.click();
      assert((await page.locator('#chatIn').inputValue()).includes('رهن و اجاره'),'starter prompt did not prefill the editor');
      await page.locator('#chatSend').click();
      const flow=await page.evaluate(()=>({collector:E30.discAPI.active(),step:CE.f,current:CURRENT}));
      assert(flow.collector&&flow.step!=='gate'&&flow.current==='landing','old onboarding gate was not safely handed over: '+JSON.stringify(flow));
    });
    await test('Ambiguous house request asks one essential clarifying question',async page=>{
      await send(page,'یه خونه برام پیدا کن.');
      const chat=await page.locator('#chatB').textContent();
      assert(chat.includes('خرید خانه است یا رهن و اجاره'),'ambiguous intent was treated as a confirmed transaction type');
      assert(await page.locator('#chatB [data-e31-id="rent"]').count()>0,'rent clarification option missing');
      assert(await page.locator('#chatB [data-e31-id="buy"]').count()>0,'buy clarification option missing');
    });
    await test('Free-form rental intent activates the same relevant prompts',async page=>{
      await send(page,'دنبال خانه اجاره‌ای هستم');
      assert(await page.locator('#chatB .e31-guide [data-e31-id="rent-budget"]').count()>0,
        'generic free text was incorrectly treated as a home-stage prompt');
    });
    await test('Prompt suggestions prefill the editor but never submit automatically',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      const card=page.locator('#chatB .e31-guide').last();
      assert(await card.count()===1,'no in-chat prompt suggestion card');
      const input=page.locator('#chatIn');
      const before=await page.locator('#chatB .msg.user').count();
      await card.locator('[data-e31-id="rent-budget"]').click();
      assert((await input.inputValue()).includes('سقف ودیعه و اجاره'),'neutral budget prompt did not prefill');
      assert(await page.evaluate(()=>!E30.discAPI.getF('budget_dep')&&!E30.discAPI.getF('budget_rent')),'prefill fabricated financial preferences');
      assert(await page.locator('#chatB .msg.user').count()===before,'prefill submitted without user consent');
      await page.locator('#chatSend').click();await page.waitForTimeout(200);
      assert(await page.locator('#chatB .e30-budget-card').count()===1,'explicit budget request did not open the combined input');
      await send(page,'بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.');
      const budget=await page.evaluate(()=>E30.discAPI.getF('budget_dep'));
      assert(budget&&budget.v&&budget.v[0]===12e9,'budget answer failed to reach the real parser');
    });
    await test('Comparison interrupts discovery without losing budget context',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,'بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.');
      const before=await page.evaluate(()=>JSON.stringify(E30.discAPI.getF('budget_dep')));
      await send(page,'اول محله‌های اطراف انقلاب رو برای اجاره ارزیابی کن.');
      const body=await page.locator('#chatB').textContent();
      assert(body.includes('مقایسهٔ نمایشی محله‌ها'),'comparison action failed to render a real artifact');
      assert(body.includes('ساختگی'),'sample data were not labeled');
      const after=await page.evaluate(()=>JSON.stringify(E30.discAPI.getF('budget_dep')));
      assert(before===after,'switching tasks corrupted confirmed budget information');
      assert(await page.locator('#chatB [data-e31-id="map"]').count()>0,'no valid next map prompt');
    });
    await test('In-chat service request is executable, not an inert suggestion',async page=>{
      await send(page,'می‌خوام برای خدمات و تعمیرات ملک درخواست ثبت کنم.');
      assert(await page.locator('#chatB #e30-svc-detail').count()===1,'real in-chat service request form did not appear');
      assert((await page.locator('#chatB').textContent()).includes('پیش‌درخواست'),'a final service order was misleadingly claimed');
    });
    await test('Valuation shows its form without deducting credit',async page=>{
      const before=await page.evaluate(()=>S.tokens||0);
      await send(page,'می‌خوام ارزش ملک رو با داده‌های نمونه تخمین بزنم.');
      assert(await page.locator('#chatB #e30-val-area').count()===1,'valuation form missing');
      assert((await page.evaluate(()=>S.tokens||0))===before,'payment occurred merely by sending a suggested prompt');
    });
    await test('Guided rental results apply constraints, save a matching card and survive reload',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,'ودیعه تا ۳ میلیارد تومان و اجاره ماهانه تا ۷۰ میلیون تومان، سعادت‌آباد، حداقل ۶۰ متر و ۲ خواب و پارکینگ الزامی است.');
      const before=await page.evaluate(()=>({fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens}));
      await send(page,'با همین شرایط آگهی‌های نمونه رو نشون بده.');
      const panel=page.locator('#chatB .e31-results').last();
      const ids=await panel.locator('[data-cba="savL"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-l')));
      assert(ids.length>0,'successful guided rental fixture returned no real property card');
      const valid=await page.evaluate(ids=>ids.every(id=>{const x=RLIST.find(x=>x.id===id);return x&&x.hood==='h1'&&x.dep<=30e9&&x.rent<=7e8&&x.m2>=60&&x.beds>=2&&x.park}),ids);
      assert(valid,'guided cards violate an explicit rental constraint');
      assert(await panel.locator('[data-cba="selL"]').count()===0,'preview used a selection action requiring a different workflow');
      await panel.locator('[data-cba="savL"]').first().click();
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
      const after=await page.evaluate(()=>({fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens,saved:S.savedListings}));
      assert(before.fields===after.fields&&before.tokens===after.tokens,'showing/saving results altered preferences or deducted credit');
      assert(after.saved.some(x=>x.listingId===ids[0]),'saved guided result did not survive reload');
      assert(await page.locator('#chatB .e31-results .pcard').count()>0,'graphical search result did not survive reload');
    });
    await test('Enghelab zero-match result never replaces constraints with unrelated listings',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,'ودیعه ۱.۲ میلیارد تومان و اجاره ۱۰ میلیون تومان، انقلاب، حداقل ۶۰ متر و یک خواب می‌خواهم.');
      await send(page,'با همین شرایط آگهی‌های نمونه رو نشون بده.');
      const last=page.locator('#chatB .msg.bot').last();
      assert((await last.textContent()).includes('آگهی منطبق پیدا نشد'),'zero matches were not reported honestly');
      assert(await last.locator('.pcard').count()===0,'non-matching cards were substituted for the empty result');
      const fields=await page.evaluate(()=>({hood:E30.discAPI.getF('hood'),dep:E30.discAPI.getF('budget_dep'),rent:E30.discAPI.getF('budget_rent'),size:E30.discAPI.getF('m2')}));
      assert(fields.hood==='h8'&&fields.dep.v[1]===12e9&&fields.rent.v[1]===1e8&&fields.size===60,'explicit zero-result constraints changed');
    });
    await test('Guided purchase results use purchase prices and the declared total budget',async page=>{
      await send(page,'می‌خوام برای خرید آپارتمان در تهران راهنمایی بشم.');
      const target=await page.evaluate(()=>{const b=BLIST[0],f=E30.discAPI.setF;f('hood',b.hood,{src:'answer'});f('buy_budget',{v:[b.m2*b.ppm,b.m2*b.ppm]},{src:'answer'});f('m2',b.m2,{src:'answer'});f('rooms',b.beds,{src:'answer'});return {id:b.id,total:b.m2*b.ppm,hood:b.hood}});
      await send(page,'با همین شرایط آگهی‌های نمونه رو نشون بده.');
      const panel=page.locator('#chatB .e31-results').last();
      assert(await panel.getAttribute('data-result-flow')==='buy','purchase query rendered rental results');
      const ids=await panel.locator('[data-cba="savB"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-l')));
      assert(ids.includes(target.id),'successful purchase fixture did not render its matching card');
      assert(await page.evaluate(({ids,target})=>ids.every(id=>{const b=BLIST.find(x=>x.id===id);return b&&b.hood===target.hood&&b.m2*b.ppm<=target.total}),{ids,target}),'purchase total-price constraint failed');
    });
    for(const flow of ['rent','buy'])await test('Every optional '+flow+' preference can be skipped before a successful result',async page=>{
      const prompt=await page.evaluate(flow=>E30.guide.actions[flow].prompt,flow);await send(page,prompt);
      const initial=await page.evaluate(()=>({expecting:E30.discAPI.collector().expecting,credits:S.tokens,requests:(S.reqs||[]).length}));
      assert(initial.expecting===null,'entry asked an unsolicited preference question');
      let previous=Infinity;
      for(let i=0;i<35;i++){
        const step=await page.evaluate(()=>({next:E30.guide.suggestions().find(x=>x.action.startsWith('preference:'))?.id,remaining:E30.discAPI.missing(E30.discAPI.collector().wf).length}));
        if(!step.next)break;
        assert(step.remaining<previous,'optional skips entered a no-progress loop');previous=step.remaining;
        const before=await page.locator('#chatB .msg.user').count();
        await page.locator('#chatB .e31-guide').last().locator('[data-e31-id="'+step.next+'"]').click();
        assert(await page.locator('#chatB .msg.user').count()===before,'preference selection auto-submitted');
        await page.locator('#chatSend').click();
        await page.locator('#chatB .e31-guide').last().locator('[data-e31-id="skip-preference"]').click();
        await page.locator('#chatSend').click();
      }
      const missing=await page.evaluate(()=>E30.discAPI.missing(E30.discAPI.collector().wf).length);
      assert(missing===0,'some displayed preferences could not be skipped');
      await page.locator('#chatB .e31-guide').last().locator('[data-e31-id="sample"]').click();await page.locator('#chatSend').click();
      assert(await page.locator('#chatB .e31-results .pcard').count()>0,'skipping optional needs blocked a successful search');
      const end=await page.evaluate(()=>({credits:S.tokens,requests:(S.reqs||[]).length,children:E30.discAPI.getF('children'),work:E30.discAPI.getF('work_loc')}));
      assert(end.credits===initial.credits&&end.requests===initial.requests&&!end.children&&!end.work,'search invented personal data, charges or a follow-up service');
    });
    await test('Choosing a family persona does not assert household composition or schoolchildren',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await page.locator('#chatB [data-e31-id="need-persona"]').last().click();await page.locator('#chatSend').click();
      await page.locator('#chatB [data-e31-id="persona-family"]').last().click();await page.locator('#chatSend').click();
      const facts=await page.evaluate(()=>({persona:E30.discAPI.getF('persona'),household:E30.discAPI.getF('household'),children:E30.discAPI.getF('children'),missing:E30.discAPI.missing('rent').map(x=>x.id)}));
      assert(facts.persona==='family'&&!facts.household&&!facts.children&&facts.missing.includes('household'),'persona fabricated household facts');
      await send(page,'با همین شرایط آگهی‌های نمونه رو نشون بده.');
      assert(await page.locator('#chatB .e31-results .pcard').count()>0,'persona refinement prevented completion of the search');
    });
    await test('Stored item and contract summaries do not fabricate entries',async page=>{
      await send(page,'قراردادهای ذخیره‌شده رو داخل چت نشون بده.');
      assert((await page.locator('#chatB').textContent()).includes('هنوز قراردادی ثبت نشده'),'empty contract list not honest');
      await send(page,'گزارش‌ها و فایل‌های ذخیره‌شده‌ام رو در چت مرور کن.');
      assert((await page.locator('#chatB').textContent()).includes('هنوز گزارشی'),'empty Library list not honest');
    });
  }finally{
    fs.writeFileSync(path.join(out,'deterministic-guidance-results.json'),JSON.stringify(results,null,2));
    await browser.close();
  }
  const failed=results.filter(x=>x.status==='FAIL');
  console.log('DETERMINISTIC GUIDE: '+(results.length-failed.length)+' passed, '+failed.length+' failed');
  if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
