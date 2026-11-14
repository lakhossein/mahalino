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
      assert(await page.locator('#chatB .e31-geo-unavailable').count()===1,'unsupported adjacency was not disclosed');
      assert(await page.locator('#chatB .e31-price-row').count()===0,'unrelated neighborhoods substituted for Enghelab');
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
    await test('Direct contract form suspends and resumes the original needs without restarting search',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,'ودیعه ۱.۲ میلیارد تومان و اجاره ۱۰ میلیون تومان.');
      const before=await page.evaluate(()=>({fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens,confirming:E30.discAPI.collector().confirming?.type}));
      const users=await page.locator('#chatB .msg.user').count();
      await send(page,await page.evaluate(()=>E30.guide.actions['contract-start'].prompt));
      const phase=await page.evaluate(()=>({active:E30.discAPI.active(),form:!!document.querySelector('#chatB [data-e28ctr]'),after:HIST.slice(HIST.map(x=>x.r).lastIndexOf('user')+1).length}));
      assert(phase.form&&!phase.active&&phase.after===1,'contract entry restarted discovery or added multiple introductory answers');
      assert(await page.locator('#chatB .msg.user').count()===users+1,'contract entry fabricated a user turn');
      await page.locator('#chatB [data-e31-id="resume-service"]').last().click();await page.locator('#chatSend').click();
      const after=await page.evaluate(()=>({active:E30.discAPI.active(),fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens,confirming:E30.discAPI.collector().confirming?.type}));
      assert(after.active&&before.fields===after.fields&&before.tokens===after.tokens&&before.confirming===after.confirming,'contract side task lost the original collector, financial consent or credit');
    });
    await test('Valuation side task resumes the same pending preference after reload',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,await page.evaluate(()=>E30.guide.actions['need-size'].prompt));
      const before=await page.evaluate(()=>({expecting:E30.discAPI.collector().expecting,fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens}));
      await send(page,await page.evaluate(()=>E30.guide.actions.valuation.prompt));
      assert(await page.locator('#chatB #e30-val-area').count()===1,'valuation side form missing');
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
      await send(page,await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
      const resumed=await page.evaluate(()=>({expecting:E30.discAPI.collector().expecting,fields:JSON.stringify(E30.discAPI.ctx().fields),tokens:S.tokens,active:E30.discAPI.active()}));
      assert(resumed.active&&resumed.expecting===before.expecting&&resumed.fields===before.fields&&resumed.tokens===before.tokens,'reload lost suspended preference context');
      await send(page,'۷۰ متر');await send(page,await page.evaluate(()=>E30.guide.actions.sample.prompt));
      assert(await page.locator('#chatB .e31-results .pcard').count()>0,'resumed preference could not complete its search');
      assert(await page.evaluate(()=>E30.discAPI.getF('m2'))===70,'resumed answer did not reach the original preference');
    });
    await test('Build requires an approved active project and then completes its own demonstrated service',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      const before=await page.evaluate(()=>({flows:S.wfs.length,credits:S.tokens}));
      await send(page,await page.evaluate(()=>E30.guide.actions.build.prompt));
      const rejected=await page.evaluate(()=>({flows:S.wfs.length,credits:S.tokens,orders:(S.wfs||[]).filter(w=>w.m==='build').flatMap(w=>w.data.orders||[]).length}));
      assert(rejected.flows===before.flows&&rejected.credits===before.credits&&rejected.orders===0,'missing project fabricated a construction workflow or order');
      const unrelated=await page.evaluate(()=>{
        const old=wfNew('build');old.data={projectWfId:'unrelated-project',orders:[{i:1,q:'قبلی',d:'قبلی'}],ph:[10,0,0,0,0]};
        const w=wfNew('mkt');w.data={role:'con',bid:{prj:0,amt:8e9,dur:18,adj:'none'},confirmed:true};save();
        return {id:old.id,data:JSON.stringify(old.data),project:w.id};
      });
      await send(page,await page.evaluate(()=>E30.guide.actions.build.prompt));
      await send(page,'0');
      await page.locator('#chatB [data-cv="!all"]').last().click();
      await page.locator('#chatB [data-cv="!done"]').last().click();
      const end=await page.evaluate(id=>({done:wd('build').done,orders:wd('build').data.orders,project:wd('build').data.projectWfId,unrelated:JSON.stringify(wfOf(id).data),credits:S.tokens,requests:S.reqs.filter(r=>r.cat==='build')}),unrelated.id);
      assert(end.done&&end.orders.length===1&&end.requests.length>=1&&end.credits===before.credits&&end.project===unrelated.project&&end.unrelated===unrelated.data,'approved construction service failed completion or changed an unrelated project');
    });
    await test('Legacy transaction entry commands use the optional collector and preserve a return path',async page=>{
      await page.evaluate(()=>ceVal('F:rent'));
      assert(await page.evaluate(()=>E30.discAPI.active()&&E30.discAPI.collector().wf==='rent'&&!E30.discAPI.collector().expecting),'legacy rent command forced the old questionnaire');
      await page.evaluate(()=>ceVal('F:buy'));
      assert(await page.evaluate(()=>E30.discAPI.active()&&E30.discAPI.collector().wf==='buy'&&!E30.discAPI.collector().expecting),'legacy buy command bypassed optional needs');
      await send(page,await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
      assert(await page.evaluate(()=>E30.discAPI.active()&&E30.discAPI.collector().wf==='rent'),'switching transactions lost the original collector');
      await send(page,await page.evaluate(()=>E30.guide.actions.sample.prompt));
      assert(await page.locator('#chatB .e31-results .pcard').count()>0,'resumed legacy entry failed to complete a search');
    });
    await test('Skipping investment preferences produces an honest limited report that can be saved and resumed',async page=>{
      await send(page,await page.evaluate(()=>E30.guide.actions.invest.prompt));
      const before=await page.evaluate(()=>S.tokens);
      await send(page,await page.evaluate(()=>E30.guide.actions['start-service'].prompt));
      await send(page,'درسته');
      const limited=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,data:JSON.stringify(wd('invp').data),html:document.querySelector('#chatB .msg.bot:last-child')?.textContent}));
      assert(limited.step==='i_an'&&/نوع دارایی مشخص نشده/.test(limited.html),'opt-out restarted investment questions or fabricated a personalized yield');
      await page.locator('#chatB [data-cv="!save"]').last().click();
      const saved=await page.evaluate(()=>({report:S.library.find(x=>x.type==='invest'),done:wd('invp').done,tokens:S.tokens}));
      assert(saved.done&&saved.report&&!saved.report.artifact.data.cap&&!saved.report.artifact.data.assetType&&saved.tokens===before,'limited investment report failed completion or invented a capital/asset');
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
      assert(await page.evaluate(id=>S.library.some(x=>x.id===id)&&wd('invp').done,saved.report.id),'limited report or completion was lost on reload');
    });
    await test('Seller opt-out skips optional property details but retains the prerequisites for pricing',async page=>{
      await send(page,await page.evaluate(()=>E30.guide.actions.sell.prompt));
      await send(page,await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send(page,'درسته');
      // Authority and quote inputs belong to the selected pricing operation.
      await page.evaluate(()=>ceVal('single'));
      await send(page,'۸۵');await send(page,'نارمک');
      const quote=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,data:wd('sell').data,text:document.querySelector('#chatB .msg.bot:last-child')?.textContent}));
      assert(quote.step==='s_val'&&quote.data.prop_area===85&&quote.data.hood==='h6'&&/ارزیابی بازار/.test(quote.text),'seller opt-out reintroduced optional questions or failed its real quote: '+JSON.stringify(quote));
      assert(quote.data.prop_rooms==null&&quote.data.prop_age==null&&quote.data.floor==null&&quote.data.sale_urgency==null,'seller quote invented skipped property facts');
    });
    await test('Landlord opt-out keeps unknown rules distinct from explicitly having no restrictions',async page=>{
      await send(page,await page.evaluate(()=>E30.guide.actions.landlord.prompt));
      await send(page,await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send(page,'درسته');
      await page.evaluate(()=>ceVal('res'));await send(page,'نارمک');
      await send(page,'۵۰۰ میلیون تومان');await send(page,'صفر');
      const preview=await page.evaluate(()=>({step:SCRIPTS[CE.f]?.[CE.i]?.id,rules:wd('lndl').data.rules,text:document.querySelector('#chatB .msg.bot:last-child')?.textContent}));
      assert(preview.step==='l_sum'&&preview.rules==null&&/مشخص نشده/.test(preview.text),'landlord opt-out asserted nonexistent acceptance rules or restarted preferences');
      await page.locator('#chatB [data-cv="!ok"]').last().click();
      assert(await page.evaluate(()=>wd('lndl').data.registered&&wd('lndl').data.listingStatus==='draft_internal'),'optional-rule skip blocked the selected draft service');
    });
    await test('Sample price charts use actual values and remain inside a wide responsive chat',async page=>{
      for(const width of [1600,1440,980,600,360]){
        await page.setViewportSize({width,height:900});
        await send(page,await page.evaluate(()=>E30.guide.actions.compare.prompt));
        const chart=page.locator('#chatB .e31-price-chart').last();
        assert(await chart.locator('.e31-price-row').count()===3,'comparison did not render actual sample rows');
        const state=await page.evaluate(()=>{
          const chat=document.querySelector('.ch-main'),box=document.getElementById('chatB'),charts=box.querySelectorAll('.e31-price-chart'),chart=charts[charts.length-1];
          return {width:chat.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1,
            clipped:chart.scrollWidth>chart.clientWidth+1,inside:box.contains(chart),
            rows:Array.from(chart.querySelectorAll('.e31-price-row')).map(row=>{const h=HOODS.find(h=>h.n===row.dataset.hood);return {text:row.querySelector('b').textContent,expected:rial(h.buyBase)}})};
        });
        assert(state.inside&&!state.overflow&&!state.clipped&&state.rows.every(r=>r.text===r.expected),'chart escaped chat, overflowed, or altered its values: '+JSON.stringify(state));
        if(width>=1440)assert(state.width>=1120&&state.width<=1281,'desktop chat canvas did not use the requested width: '+state.width);
      }
    });
    await test('Investment risk and liquidity preferences retain their meaning in the saved report',async page=>{
      await send(page,await page.evaluate(()=>E30.guide.actions.invest.prompt));
      await send(page,await page.evaluate(()=>E30.guide.actions['need-invest-risk'].prompt));await send(page,'ریسک متوسط');
      await send(page,await page.evaluate(()=>E30.guide.actions['need-invest-liquidity'].prompt));await send(page,'نقدشوندگی بالا');
      await send(page,await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send(page,'درسته');
      const selected=await page.evaluate(()=>({risk:wd('invp').data.risk,liquidity:wd('invp').data.liquidity,text:document.querySelector('#chatB .msg.bot:last-child')?.textContent}));
      assert(selected.risk==='medium'&&selected.liquidity==='all'&&/متوسط/.test(selected.text)&&/نقدشوندگی زیاد/.test(selected.text),'handoff discarded the stated risk or liquidity preference: '+JSON.stringify(selected));
      await page.locator('#chatB [data-cv="!save"]').last().click();
      assert(await page.evaluate(()=>S.library.some(x=>x.type==='invest'&&x.artifact.data.risk==='medium'&&x.artifact.data.liquidity==='all')),'saved analysis lost normalized preference meanings');
    });
    const catalogContext=await browser.newContext(),catalogPage=await catalogContext.newPage();
    await catalogPage.goto(base,{waitUntil:'domcontentloaded'});await catalogPage.evaluate(()=>doLogin('QA'));
    const preferenceCases=await catalogPage.evaluate(()=>E30.guide.registry.filter(r=>r.action.startsWith('preference:')).map(r=>({id:r.id,prompt:r.prompt,slot:r.action.split(':')[1]})));
    await catalogContext.close();
    assert(preferenceCases.length>=30,'actual runtime preference registry was not loaded');
    for(const entry of preferenceCases){
      await test('Registered preference '+entry.id+' can be skipped and reach its selected service output',async page=>{
        const slot=entry.slot,flow=slot.startsWith('invest_')?'invest':['buy_budget','budget_scope','purpose'].includes(slot)?'buy':['prop_area','prop_rooms','ownership','docs','sale_motivation','sale_urgency','expected_price','min_price'].includes(slot)?'sell':slot==='listing_intent'?'landlord':'rent';
        await send(page,await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
        const credits=await page.evaluate(()=>S.tokens);
        await send(page,entry.prompt);
        assert(await page.evaluate(()=>!!E30.discAPI.collector().expecting),'registered preference had no executable question: '+entry.id);
        await page.locator('#chatB [data-e31-id="skip-preference"]').last().click();await page.locator('#chatSend').click();
        assert(await page.evaluate(()=>!E30.discAPI.collector().expecting),'skip left the preference active: '+entry.id);
        if(flow==='rent'||flow==='buy'){
          await send(page,await page.evaluate(()=>E30.guide.actions.sample.prompt));
          assert(await page.locator('#chatB .e31-results .pcard').count()>0,'skipped preference blocked a successful search: '+entry.id);
        }else{
          await send(page,await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send(page,'درسته');
          if(flow==='invest'){
            await page.locator('#chatB [data-cv="!save"]').last().click();
            assert(await page.evaluate(()=>wd('invp').done&&S.library.some(x=>x.type==='invest')),'skipped investor preference blocked report completion');
          }else if(flow==='sell'){
            await page.evaluate(()=>ceVal('single'));await send(page,'۸۵');await send(page,'نارمک');
            assert(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='s_val'&&wd('sell').data.prop_area===85&&wd('sell').data.hood==='h6'),'skipped seller preference blocked the selected real quote');
          }else{
            await page.evaluate(()=>ceVal('price'));await send(page,'نارمک');
            assert(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='l_advice'),'skipped landlord preference blocked actual price advice');
            await page.locator('#chatB [data-cv="!end"]').last().click();
            assert(await page.evaluate(()=>CE.f===null&&!wd('lndl').data.registered),'price advice forced the user to publish a draft');
          }
        }
        assert(await page.evaluate(()=>S.tokens)===credits,'optional preference or its sample output charged credit');
      });
    }
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
