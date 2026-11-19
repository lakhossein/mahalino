/* First §7/§8 browser evidence slice: combined rental budget through search.
   All inputs use the visible composer/buttons. evaluate() only observes state. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.32.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const covers=['step:rent:dep+rentb','scenario:rent-budget'];
const report={schemaVersion:1,revision:process.env.GITHUB_SHA||process.env.QA_AUDIT_REVISION||
  cp.execFileSync('git',['rev-parse','HEAD'],{cwd:__dirname,encoding:'utf8'}).trim(),tests:[]};
function write(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'priority-audit-evidence.json'),JSON.stringify(report,null,2)+'\n')}
async function snapshot(page){
 return page.evaluate(()=>({
  collector:{active:E30.discAPI.active(),wf:E30.discAPI.collector().wf,expecting:E30.discAPI.collector().expecting,
    confirming:E30.discAPI.collector().confirming?.type||null,finConfirmed:!!E30.discAPI.collector().finConfirmed},
  deposit:E30.discAPI.getF('budget_dep'),rent:E30.discAPI.getF('budget_rent'),
  credits:S.tokens,requests:(S.reqs||[]).length,userTurns:HIST.filter(x=>x.r==='user').length,
  suggestions:E30.guide.suggestions().map(x=>x.id),view:CURRENT,
  lastText:document.querySelector('#chatB .msg.bot:last-child')?.textContent?.slice(0,1800)||''
 }));
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,
   args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  const pending=[];
  async function test(id,fn,rowCovers=covers){pending.push(()=>execute(id,fn,rowCovers))}
  async function execute(id,fn,rowCovers){
   const entry={id,result:'FAIL',surface:'browser-ui',covers:rowCovers,phases:[],assertions:[],trace:[]};
   report.tests.push(entry);write();
   const context=await browser.newContext({viewport:{width:1300,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const check=(condition,name,phases=[])=>{
    entry.assertions.push({name,pass:!!condition});if(!condition)throw Error(name);
    for(const phase of phases)if(!entry.phases.includes(phase))entry.phases.push(phase);
   };
   async function act(action,fn){
    const before=await snapshot(page);await fn();
    const after=await snapshot(page);
    entry.trace.push({state:JSON.stringify(before),action,next_state:JSON.stringify(after)});
    return after;
   }
   async function send(text){
    return act('composer-send: '+text,async()=>{
     await page.locator('#chatIn').fill(text);await page.locator('#chatSend').click();
     await page.waitForTimeout(180);
    });
   }
   async function prompt(id){
    const before=await snapshot(page),button=page.locator('#chatB .e31-guide').last().locator('[data-e31-id="'+id+'"]');
    check(await button.isVisible(),'Visible actionable suggestion '+id,id==='rent-budget'?['visible']:[]);
    const expected=await page.evaluate(id=>E30.guide.actions[id].prompt,id);
    await act('suggestion-click: '+id,()=>button.click());
    const prefilled=await snapshot(page);
    check(await page.locator('#chatIn').inputValue()===expected&&prefilled.userTurns===before.userTurns&&
     JSON.stringify(prefilled.deposit)===JSON.stringify(before.deposit)&&JSON.stringify(prefilled.rent)===JSON.stringify(before.rent)&&
     prefilled.credits===before.credits,'Prompt only prefills composer without changing facts, history or balance',['composer-prefill']);
    const sent=await act('composer-send selected suggestion: '+id,async()=>{
     await page.locator('#chatSend').click();await page.waitForTimeout(180);
    });
    check(sent.userTurns===before.userTurns+1,'Explicit composer send creates exactly one user turn',['composer-send']);
    return sent;
   }
   async function result(){
    await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
    // Empty results deliberately have no .e31-results card container.
    // Scope to this response so previous successful cards cannot satisfy it.
    const panel=page.locator('#chatB .msg.bot').last();
    const text=await panel.textContent();
    const hasCards=await panel.locator('.e31-results').count()>0;
    const noMatches=text.includes('آگهی منطبق پیدا نشد');
    check(await panel.isVisible()&&(hasCards||noMatches),
     'Current response contains matched cards or the explicit zero-match result');
    const ids=await panel.locator('[data-cba="savL"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-l')));
    return {panel,ids,state:await snapshot(page)};
   }
   async function confirmBudget(deposit,rent){
    const before=await snapshot(page);
    check(before.deposit?.v?.[1]===deposit&&before.rent?.v?.[1]===rent,'Both labeled amounts reach the real financial parser');
    check(before.collector.confirming==='financial'&&!before.collector.finConfirmed,'Budget awaits explicit financial confirmation');
    await send('درسته');
    const after=await snapshot(page);
    check(after.collector.finConfirmed&&!after.collector.confirming,'Both financial values confirmed by explicit user input',['answer']);
    check(!after.suggestions.includes('rent-budget')&&await page.locator('#chatB .e31-guide').last().locator('[data-e31-id="rent-budget"]').count()===0,
     'Completed budget is absent from current API and rendered suggestions',['hidden']);
   }
   try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    if(rowCovers.some(x=>x.startsWith('scenario:')))check(await page.locator('#chatB .e31-guide').count()===0,'Guest has no authenticated actionable prompt suggestions',['hidden']);
    await page.evaluate(()=>doLogin('QA'));
    await page.waitForTimeout(150);
    await fn({page,check,act,send,prompt,result,confirmBudget});
    check(errors.length===0,'No uncaught browser errors');
    entry.result='PASS';console.log('PASS '+id+' phases='+entry.phases.join(','));
   }catch(error){entry.error=String(error.stack||error);console.error('FAIL '+id+': '+entry.error)}
   finally{write();await context.close()}
  }
  await test('PA-RB-ANSWER-EDIT',async({page,check,act,send,prompt,result,confirmBudget})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const baseline=await snapshot(page);
   await prompt('rent-budget');
   check(await page.locator('#chatB .e30-budget-card').last().isVisible(),'Budget handler opens the real combined card');
   check(await page.locator('#chatB .e30-budget-card').last().locator('input:checked').count()===0,'Combined card has no default selected amounts');
   await send('ودیعه تا ۳ میلیارد تومان و اجاره ماهانه تا ۷۰ میلیون تومان');
   await confirmBudget(30e9,7e8);
   // Explicit editing is allowed even after the completed suggestion is hidden.
   await send(await page.evaluate(()=>E30.guide.actions['rent-budget'].prompt));
   await send('ودیعه تا ۴ میلیارد تومان و اجاره ماهانه تا ۹۰ میلیون تومان');
   await confirmBudget(40e9,9e8);
   check((await snapshot(page)).deposit.v[1]===40e9&&(await snapshot(page)).rent.v[1]===9e8,'Combined edit updates both amounts without losing their association',['edit']);
   const found=await result();
   check(found.ids.length>0,'Suitable budget fixture reaches successful property results',['success','service-terminal']);
   check(await page.evaluate(ids=>ids.every(id=>{
    const x=RLIST.find(x=>x.id===id),dep=E30.discAPI.getF('budget_dep').v[1],rent=E30.discAPI.getF('budget_rent').v[1];
    return x&&x.dep<=dep&&x.rent<=rent;
   }),found.ids),'Every offered property obeys both edited budget caps');
   const before=await snapshot(page);
   const after=await act('browser reload',async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200)});
   check(JSON.stringify(after.deposit)===JSON.stringify(before.deposit)&&JSON.stringify(after.rent)===JSON.stringify(before.rent)&&
    await page.locator('#chatB .e31-results .pcard').count()>0,'Budget pair and usable property result survive reload',['reload']);
   check(after.credits===baseline.credits&&after.requests===baseline.requests,'Search/edit/reload creates no charges or implicit service requests');
  });
  await test('PA-RB-INVALID-SKIP',async({page,check,send,prompt,result})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const before=await snapshot(page);await prompt('rent-budget');
   await send('abc-invalid-budget');
   const invalid=await snapshot(page);
   check(invalid.collector.active&&!!invalid.collector.expecting&&!invalid.deposit&&!invalid.rent,'Invalid input preserves an answerable collector and invents no amount');
   await prompt('skip-preference');
   const skipped=await snapshot(page);
   check(!skipped.collector.expecting&&!skipped.deposit&&!skipped.rent,'Skipping combined budget clears the question without fabricated amounts',['skip','cancel','empty-data']);
   const found=await result();
   check(found.ids.length>0,'Missing budget does not block a usable sample search',['service-terminal']);
   check(found.state.credits===before.credits&&found.state.requests===before.requests,'Skipping an optional budget never charges or starts a dependent operation');
  });
  await test('PA-RB-ZERO-MATCH',async({page,check,send,prompt,result,confirmBudget})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const previous=await result();
   check(previous.ids.length>0,'Earlier unconstrained result has real cards, making stale-history detection meaningful');
   await prompt('rent-budget');
   await send('ودیعه تا ۱ تومان و اجاره ماهانه تا ۱ تومان');
   await confirmBudget(10,10);
   const found=await result();
   check(found.ids.length===0&&await found.panel.locator('.pcard').count()===0&&found.state.lastText.includes('آگهی منطبق پیدا نشد'),
    'Infeasible explicit caps produce honest zero results without substituted properties',['empty-data','service-terminal']);
   check(found.state.deposit.v[1]===10&&found.state.rent.v[1]===10,'Empty result preserves both explicit constraints');
   check(await page.locator('#chatB .e31-results .pcard').count()>0,
    'Earlier cards remain in history but are not treated as matches for the current zero-result query');
  });
  await test('PA-RB-SIDE-TASK-RESUME',async({page,check,act,send,prompt,result,confirmBudget})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));await prompt('rent-budget');
   await send('ودیعه تا ۳ میلیارد تومان و اجاره ماهانه تا ۷۰ میلیون تومان');await confirmBudget(30e9,7e8);
   const before=await snapshot(page);
   await send(await page.evaluate(()=>E30.guide.actions['contract-start'].prompt));
   check(!await page.evaluate(()=>E30.discAPI.active())&&await page.locator('#chatB [data-e28ctr]').count()>0,'Side task opens contract form and suspends discovery');
   await prompt('resume-service');
   const resumed=await snapshot(page);
   check(resumed.collector.active&&resumed.collector.wf==='rent'&&JSON.stringify(resumed.deposit)===JSON.stringify(before.deposit)&&
    JSON.stringify(resumed.rent)===JSON.stringify(before.rent),'Returning from side task restores the same budget pair and rental collector',['resume']);
   const found=await result();
   check(found.ids.length>0&&found.state.credits===before.credits,'Resumed budget reaches usable results without debit',['service-terminal']);
  });

  await test('PA-PERSONA-ANSWER-EDIT',async({page,check,act,send,prompt,result})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const baseline=await snapshot(page);
   await prompt('need-persona');await prompt('persona-family');
   let facts=await page.evaluate(()=>({persona:E30.discAPI.getF('persona'),household:E30.discAPI.getF('household'),children:E30.discAPI.getF('children')}));
   check(facts.persona==='family'&&!facts.household&&!facts.children,
    'Family persona is saved without inventing household size or schoolchildren',['answer']);
   check(!(await snapshot(page)).suggestions.includes('need-persona'),'Answered persona is not suggested again');
   await send(await page.evaluate(()=>E30.guide.actions['need-persona'].prompt));
   await prompt('persona-couple');
   facts=await page.evaluate(()=>({persona:E30.discAPI.getF('persona'),household:E30.discAPI.getF('household'),children:E30.discAPI.getF('children')}));
   check(facts.persona==='couple'&&!facts.household&&!facts.children,
    'Explicit persona edit preserves unknown household and children',['edit']);
   const found=await result();check(found.ids.length>0,'Persona refinement reaches usable sample listings',['service-terminal']);
   await act('browser reload after persona edit',async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200)});
   const restored=await page.evaluate(()=>({persona:E30.discAPI.getF('persona'),household:E30.discAPI.getF('household'),children:E30.discAPI.getF('children')}));
   check(restored.persona==='couple'&&!restored.household&&!restored.children&&await page.locator('#chatB .e31-results .pcard').count()>0,
    'Edited persona, unknown personal facts and usable results survive reload',['reload']);
   const end=await snapshot(page);check(end.credits===baseline.credits&&end.requests===baseline.requests,'Persona journey incurs no charge or implicit service');
  },['step:rent:persona']);
  await test('PA-PERSONA-SKIP',async({page,check,send,prompt,result})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const baseline=await snapshot(page);await prompt('need-persona');await prompt('skip-preference');
   check(await page.evaluate(()=>!E30.discAPI.collector().expecting&&!E30.discAPI.getF('persona')&&!E30.discAPI.getF('household')&&!E30.discAPI.getF('children')),
    'Skipping persona clears the question without assuming personal facts',['skip']);
   const found=await result();check(found.ids.length>0,'Skipped persona still reaches usable search results',['service-terminal']);
   check(found.state.credits===baseline.credits&&found.state.requests===baseline.requests,'Skipping persona creates no charge or operation');
  },['step:rent:persona']);

  await test('PA-HOUSEHOLD-ANSWER-EDIT',async({page,check,act,send,prompt,result})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const baseline=await snapshot(page);
   await prompt('need-household');await send('فقط خودم');
   check(await page.evaluate(()=>E30.discAPI.getF('household')==='single'&&!E30.discAPI.getF('children')),
    'Single-person household is recorded without inventing children',['answer']);
   check(!(await snapshot(page)).suggestions.includes('need-household'),'Answered household is absent from current suggestions');
   await send(await page.evaluate(()=>E30.guide.actions['need-household'].prompt));await send('من و همسرم');
   check(await page.evaluate(()=>E30.discAPI.getF('household')==='couple'&&!E30.discAPI.getF('children')),
    'Explicit edit changes household to couple without assuming children',['edit']);
   const found=await result();check(found.ids.length>0,'Household refinement reaches usable listings',['service-terminal']);
   await act('reload household result',async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200)});
   check(await page.evaluate(()=>E30.discAPI.getF('household')==='couple'&&!E30.discAPI.getF('children'))&&
    await page.locator('#chatB .e31-results .pcard').count()>0,
    'Edited household and usable result survive reload without invented children',['reload']);
   const end=await snapshot(page);check(end.credits===baseline.credits&&end.requests===baseline.requests,
    'Household changes and search do not charge or create implicit operations');
  },['step:rent:who']);
  await test('PA-HOUSEHOLD-SKIP',async({page,check,send,prompt,result})=>{
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const baseline=await snapshot(page);await prompt('need-household');await prompt('skip-preference');
   check(await page.evaluate(()=>!E30.discAPI.collector().expecting&&!E30.discAPI.getF('household')&&!E30.discAPI.getF('children')),
    'Skipped household remains unknown and leaves no active question',['skip']);
   const found=await result();check(found.ids.length>0,'Unknown household does not block sample search',['service-terminal']);
   check(found.state.credits===baseline.credits&&found.state.requests===baseline.requests,'Skip and search do not bill or create operations');
  },['step:rent:who']);

  const preferenceMatrix=[{"flow":"rent","id":"beds","slot":"rooms","answer":"۱","expected":1,"edit":"۲","edited":2},{"flow":"rent","id":"m2","slot":"m2","answer":"۶۰","expected":60,"edit":"۷۰","edited":70},{"flow":"rent","id":"age","slot":"prop_age","answer":"تا ۱۰ سال","expected":10,"edit":"تا ۲۰ سال","edited":20},{"flow":"rent","id":"floor","slot":"floor_preference","answer":"طبقه ۱ تا ۵ الزامی است","expected":{"min":1,"max":5,"level":"required"},"edit":"طبقه ۱ تا ۱۰ الزامی است","edited":{"min":1,"max":10,"level":"required"}},{"flow":"buy","id":"beds","slot":"rooms","answer":"۱","expected":1,"edit":"۲","edited":2},{"flow":"buy","id":"m2","slot":"m2","answer":"۶۰","expected":60,"edit":"۷۰","edited":70},{"flow":"buy","id":"age","slot":"prop_age","answer":"تا ۱۰ سال","expected":10,"edit":"تا ۲۰ سال","edited":20},{"flow":"buy","id":"floor","slot":"floor_preference","answer":"طبقه ۱ تا ۵ الزامی است","expected":{"min":1,"max":5,"level":"required"},"edit":"طبقه ۱ تا ۱۰ الزامی است","edited":{"min":1,"max":10,"level":"required"}},{"flow":"buy","id":"budg","slot":"buy_budget","answer":"۱۰۰ میلیارد تومان","expected":{"v":[1000000000000,1000000000000]},"edit":"۲۰۰ میلیارد تومان","edited":{"v":[2000000000000,2000000000000]}},{"flow":"buy","id":"ppm","slot":"price_per_m2","answer":"۱۰۰ میلیون تا ۹۰۰ میلیون تومان","expected":{"v":[1000000000,9000000000]},"edit":"۵۰ میلیون تا ۹۰۰ میلیون تومان","edited":{"v":[500000000,9000000000]}},{"flow":"sell","id":"s_area","slot":"prop_area","answer":"۸۵","expected":85,"edit":"۹۰","edited":90},{"flow":"sell","id":"s_rooms","slot":"prop_rooms","answer":"۲","expected":2,"edit":"۳","edited":3},{"flow":"sell","id":"s_age","slot":"prop_age","answer":"تا ۱۰ سال","expected":10,"edit":"تا ۲۰ سال","edited":20},{"flow":"sell","id":"s_floor","slot":"property_floor","answer":"۲","expected":2,"edit":"۳","edited":3},{"flow":"sell","id":"s_hood","slot":"hood","answer":"نارمک","expected":"h6","edit":"سعادت‌آباد","edited":"h1"},{"flow":"sell","id":"s_motiv","slot":"sale_motivation","answer":"مهاجرت","expected":"مهاجرت","edit":"تعویض ملک","edited":"تعویض ملک"},{"flow":"sell","id":"s_urg","slot":"sale_urgency","answer":"عجله ندارم","expected":"maxvalue","edit":"فروش سریع","edited":"fast"},{"flow":"invp","id":"i_obj","slot":"invest_objective","answer":"هدف درآمد اجاره","expected":"rent_income","edit":"حفظ ارزش","edited":"inflation_hedge"},{"flow":"invp","id":"i_cap","slot":"invest_capital","answer":"۳۰ میلیارد تومان","expected":{"v":[300000000000,300000000000]},"edit":"۴۰ میلیارد تومان","edited":{"v":[400000000000,400000000000]}},{"flow":"invp","id":"i_liq","slot":"invest_liquidity","answer":"نقدشوندگی بالا","expected":"بالا","edit":"قفل بلندمدت","edited":"مهم نیست"},{"flow":"invp","id":"i_hor","slot":"invest_horizon","answer":"۵ سال","expected":"میان‌مدت","edit":"۱۰ سال","edited":"بلندمدت"},{"flow":"invp","id":"i_risk","slot":"invest_risk","answer":"ریسک متوسط","expected":"متوسط","edit":"ریسک زیاد","edited":"بالا"},{"flow":"invp","id":"i_asset","slot":"invest_asset","answer":"آپارتمان مسکونی","expected":"residential","edit":"زمین","edited":"land"},{"flow":"invp","id":"i_fin","slot":"invest_financing","answer":"سرمایه شخصی","expected":"cash","edit":"بخشی وام","edited":"mixed"},{"flow":"invp","id":"i_income","slot":"invest_income","answer":"۱۰ میلیون تومان","expected":{"v":[100000000,100000000]},"edit":"۲۰ میلیون تومان","edited":{"v":[200000000,200000000]}},{"flow":"invp","id":"i_mgmt","slot":"invest_management","answer":"خودم","expected":"self","edit":"مدیر می‌گیرم","edited":"delegate"},{"flow":"invp","id":"i_exit","slot":"invest_exit","answer":"فروش ملک","expected":"sell","edit":"نگهداری بلندمدت","edited":"hold"},{"flow":"invp","id":"i_hood","slot":"hood","answer":"نارمک","expected":"h6","edit":"سعادت‌آباد","edited":"h1"},{"flow":"lndl","id":"l_hood","slot":"hood","answer":"نارمک","expected":"h6","edit":"سعادت‌آباد","edited":"h1"},{"flow":"lndl","id":"l_rules","slot":"rental_rules","answer":"حیوان خانگی پذیرفته نیست","expected":["حیوان خانگی پذیرفته نیست"],"edit":"ندارد","edited":[]},{"flow":"lndl","id":"l_stay_rules","slot":"stay_rules","answer":"سیگار ممنوع","expected":["سیگار ممنوع"],"edit":"ندارد","edited":[]},{"flow":"rent","id":"elev","slot":"prefs","field":"prefRules","answer":"آسانسور الزامی است","expected":{"elevator":"required"},"edit":"آسانسور ترجیح دارد","edited":{"elevator":"preferred"}},{"flow":"rent","id":"park","slot":"prefs","field":"prefRules","answer":"پارکینگ الزامی است","expected":{"parking":"required"},"edit":"پارکینگ ترجیح دارد","edited":{"parking":"preferred"}},{"flow":"rent","id":"extra","slot":"prefs","field":"prefRules","answer":"بالکن الزامی است","expected":{"balcony":"required"},"edit":"بالکن ترجیح دارد","edited":{"balcony":"preferred"}},{"flow":"buy","id":"feat","slot":"prefs","field":"prefRules","answer":"انباری الزامی است","expected":{"storage":"required"},"edit":"انباری ترجیح دارد","edited":{"storage":"preferred"}},{"flow":"rent","id":"imps","slot":"prefs","field":"prefRules","answer":"مترو الزامی است","expected":{"metro":"required"},"edit":"مترو ترجیح دارد","edited":{"metro":"preferred"}},{"flow":"buy","id":"imps","slot":"prefs","field":"prefRules","answer":"مترو الزامی است","expected":{"metro":"required"},"edit":"مترو ترجیح دارد","edited":{"metro":"preferred"}}];
  for(const spec of preferenceMatrix){
   for(const mode of ['answer-edit','skip'])await test('PA-MATRIX-'+spec.flow+'-'+spec.id+'-'+mode,
    async({page,check,act,send,prompt,result})=>{
     const flow=({invp:'invest',lndl:'landlord'})[spec.flow]||spec.flow;
     await send(await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
     const baseline=await snapshot(page);
     async function request(){
      const text=await page.evaluate(slot=>E30.guide.registry.find(r=>r.action==='preference:'+slot)?.prompt,spec.slot);
      check(!!text,'Actual runtime registry exposes preference '+spec.slot);
      await send(text);
      check(await page.evaluate(()=>!!E30.discAPI.collector().expecting),'Explicit preference request opens its actual question');
     }
     await request();
     if(mode==='skip'){
      await prompt('skip-preference');
      check(await page.evaluate(slot=>E30.discAPI.getF(slot)==null&&!E30.discAPI.collector().expecting,spec.slot),
       'Skipped '+spec.slot+' stays unknown',['skip']);
     }else{
      await send(spec.answer);
      check(await page.evaluate(({slot,value})=>JSON.stringify(E30.discAPI.getF(slot))===JSON.stringify(value),{slot:spec.field||spec.slot,value:spec.expected}),
       'Answer parsed to expected '+spec.slot,['answer']);
      await request();await send(spec.edit);
      check(await page.evaluate(({slot,value})=>JSON.stringify(E30.discAPI.getF(slot))===JSON.stringify(value),{slot:spec.field||spec.slot,value:spec.edited}),
       'Edited value stored for '+spec.slot,['edit']);
      const before=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
      await act('reload confirmed preference',async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200)});
      check(await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields))===before,'Confirmed preference survives reload',['reload']);
     }
     if(flow==='rent'||flow==='buy'){
      await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
      const last=page.locator('#chatB .msg.bot').last(),text=await last.textContent();
      const count=await last.locator('.pcard').count();
      check(count>0||text.includes('آگهی منطبق پیدا نشد'),'Search terminates honestly after '+spec.slot,['service-terminal']);
      if(mode==='skip')check(count>0,'Skipping optional preference still produces matching sample cards');
      const ids=await last.locator('[data-cba="savL"],[data-cba="savB"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-l')));
      const rows=await page.evaluate(({flow,ids})=>(flow==='buy'?BLIST:RLIST).filter(x=>ids.includes(x.id)),{flow,ids});
      check(rows.length===count,'Every rendered card identifies an actual sample record');
      if(mode==='answer-edit')for(const x of rows){
       if(spec.slot==='rooms')check(x.beds>=spec.edited,'Each card respects edited bedroom minimum');
       if(spec.slot==='m2')check(x.m2>=spec.edited,'Each card respects edited size minimum');
       if(spec.slot==='prop_age')check(x.age<=spec.edited,'Each card respects maximum age');
       if(spec.slot==='floor_preference')check(x.floor>=spec.edited.min&&x.floor<=spec.edited.max,'Each card respects required floor range');
       if(spec.slot==='buy_budget')check(x.m2*x.ppm<=spec.edited.v[1],'Actual card total is within purchase budget');
       if(spec.slot==='price_per_m2')check(x.ppm>=spec.edited.v[0]&&x.ppm<=spec.edited.v[1],'Actual card unit price is within edited range');
      }

     }else{
      // Explicitly choose the service with current facts; do not bypass handoff.
      await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته');
      if(flow==='invest'){
       await page.locator('#chatB [data-cv="!save"]').last().click();
       check(await page.evaluate(()=>wd('invp').done&&S.library.some(x=>x.type==='invest')),
        'Selected investment analysis completes and is saved',['service-terminal']);
       if(mode==='answer-edit'){
        const saved=await page.evaluate(()=>S.library.filter(x=>x.type==='invest').at(-1).artifact.data);
        const keys={invest_objective:'objective',invest_capital:'cap',invest_liquidity:'liquidity',invest_horizon:'horizon',invest_risk:'risk',invest_asset:'assetType',invest_financing:'financing',invest_income:'expectedCash',invest_management:'management',invest_exit:'exitStrategy',hood:'hood'};
        let expected=spec.edited;
        if(expected&&expected.v)expected=expected.v[1];
        if(spec.slot==='invest_liquidity')expected='long';
        if(spec.slot==='invest_risk')expected='high';
        check(saved[keys[spec.slot]]===expected,'Saved analysis consumes the edited '+spec.slot+' value');
       }
      }else if(flow==='sell'){
       await page.locator('#chatB [data-cv="single"]').last().click();
       // The chosen quote has real area/hood prerequisites even after opt-out.
       for(let i=0;i<8;i++){
        const step=await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id);
        if(step==='s_val')break;
        const inputs={s_area:'۸۵',s_rooms:'۲',s_age:'۱۰',s_floor:'۲',s_hood:'نارمک',s_motiv:'تعویض ملک',s_urg:'maxvalue'};
        check(!!inputs[step],'Quote reaches only known prerequisite steps: '+step);
        await send(inputs[step]);
       }
       check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='s_val')&&
        (await page.locator('#chatB .msg.bot').last().textContent()).includes('ارزیابی بازار'),
        'Selected seller quote reaches real sample valuation',['service-terminal']);
       if(mode==='answer-edit'&&spec.slot==='prop_area')check(await page.evaluate(()=>wd('sell').data.prop_area)===spec.edited,'Seller valuation preserves edited area');
       if(mode==='answer-edit'&&spec.slot==='hood')check(await page.evaluate(()=>wd('sell').data.hood)===spec.edited,'Seller valuation preserves edited neighborhood');
      }else{
       const branch=spec.slot==='rental_rules'?'res':spec.slot==='stay_rules'?'stay':'price';
       await page.locator('#chatB [data-cv="'+branch+'"]').last().click();
       if(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='l_hood'))await send('نارمک');
       if(branch==='price'){
        check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='l_advice'),'Landlord reaches selected price advice');
        await page.locator('#chatB [data-cv="!end"]').last().click();
        check(await page.evaluate(()=>CE.f===null&&!wd('lndl').data.registered),'Price advice completes independently',['service-terminal']);
       }else{
        const inputs={l_price:'۱ میلیارد تومان',l_rent:'صفر',l_stay_rate:'۲ میلیون تومان',l_stay_capacity:'۴',l_stay_min:'۲'};
        for(let i=0;i<6;i++){
         const step=await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id);if(step==='l_sum')break;
         check(!!inputs[step],'Draft requests only relevant missing service inputs: '+step);await send(inputs[step]);
        }
        check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='l_sum'),'Draft reaches actual confirmation');
        await page.locator('#chatB [data-cv="!ok"]').last().click();
        const d=await page.evaluate(()=>wd('lndl').data),rules=branch==='res'?d.rules:d.stayRules;
        check(d.registered&&d.listingStatus==='draft_internal'&&(mode==='skip'?rules==null:Array.isArray(rules)&&rules.length===0),
         'Confirmed internal draft preserves unknown skipped rules versus explicit empty rules',['service-terminal']);
       }
      }
     }
     check((await snapshot(page)).credits===baseline.credits,'Preference and free sample output never debit credit');
    },['step:'+spec.flow+':'+spec.id]);
  }

  // At every mapped service step: empty submission, reversible pause, reload,
  // exact resume, then the selected branch's independently usable result.
  async function serviceState(page,flow){return page.evaluate(f=>({flow:CE.f,step:SCRIPTS[CE.f]?.[CE.i]?.id||null,
   active:S.active[f],data:JSON.stringify(wd(f).data),done:wd(f).done,credits:S.tokens,requests:(S.reqs||[]).length}),flow)}
  async function exerciseStep(h,flow,id){
   const {page,check,act,send}=h,before=await serviceState(page,flow);
   check(before.flow===flow&&before.step===id,'Reached actual '+flow+':'+id+' through UI');
   await act('empty composer submission at '+id,async()=>{await page.locator('#chatIn').fill('   ');await page.locator('#chatSend').click();await page.waitForTimeout(100)});
   check(JSON.stringify(await serviceState(page,flow))===JSON.stringify(before),'Missing input cannot advance, debit or create a request at '+id);
   await h.prompt('pause-service');
   const paused=await serviceState(page,flow);
   check(paused.flow===null&&paused.data===before.data&&paused.credits===before.credits&&paused.requests===before.requests,
    'Pausing '+id+' leaves exact facts and operations unchanged');
   await act('reload paused '+id,()=>page.reload({waitUntil:'domcontentloaded'}));
   await send(await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
   const after=await serviceState(page,flow);
   check(after.active===before.active&&after.data===before.data&&after.credits===before.credits&&after.requests===before.requests&&
    (before.done&&!(flow==='stay'&&['rev','revt'].includes(id))?after.flow===null:after.flow===flow&&after.step===id),'Resume '+id+' restores exact workflow, facts and step once');
  }
  async function beginService(h,id){
   await h.send(await h.page.evaluate(id=>E30.guide.actions[id].prompt,id));
   await h.send(await h.page.evaluate(()=>E30.guide.actions['start-service'].prompt));await h.send('درسته');
  }
  async function chip(h,value){
   const b=h.page.locator('#chatB [data-cv="'+value+'"]').last();h.check(await b.isVisible(),'Actual action '+value+' is visible');
   await h.act('click service action '+value,async()=>{await b.click();await h.page.waitForTimeout(180)});
  }
  const sellerRows=['s_role','s_own','s_docs','s_note','s_val','s_price','s_min','s_prep','s_inq','s_ctr','s_done'];
  await test('PA-SERVICE-SELLER',async h=>{
   const {page,check,send}=h;await beginService(h,'sell');const seen=[];
   await chip(h,'!back');
   const inputs={s_role:'owner',s_own:'inherited',s_docs:'no',s_note:'ok',s_area:'۸۵',s_hood:'نارمک',s_val:'ok',s_price:'۱۲ میلیارد تومان',s_min:'۱۱ میلیارد تومان'};
   for(let n=0;n<24;n++){
    const id=await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id);
    if(sellerRows.includes(id)){await exerciseStep(h,'sell',id);seen.push(id)}
    if(id==='s_done')break;
    if(id==='s_price'||id==='s_min'){
     const before=await serviceState(page,'sell');await send(id==='s_min'?'۲۰ میلیارد تومان':'نامعتبر');
     const after=await serviceState(page,'sell');check(after.step===before.step&&after.credits===before.credits,'Invalid '+id+' cannot commit or advance');
    }
    if(inputs[id])await send(inputs[id]);
    else if(id==='s_prep')await chip(h,'!ok');
    else if(id==='s_inq')await chip(h,'!neg');
    else if(id==='s_ctr'){
     const before=await serviceState(page,'sell');await chip(h,'!open');
     check(await page.evaluate(()=>!(S.wfs||[]).some(w=>w.m==='buy'&&w.data&&w.data.ctr))&&
      (await page.locator('#chatB .msg.bot').last().textContent()).includes('مدارک'),
      'Incomplete ownership documents block the contract form and charge');
     check((await serviceState(page,'sell')).credits===before.credits,'Rejected contract opening never debits');
     await chip(h,'!later');
    }
    else throw Error('Unexpected seller step '+id);
   }
   check(sellerRows.every(x=>seen.includes(x)),'All ten seller service rows exercised, including incomplete ownership documents');
   const end=await page.evaluate(()=>({d:wd('sell').data,done:wd('sell').done,req:S.reqs.find(r=>r.id===wd('sell').data.saleReqId),contracts:S.contracts||[]}));
   check(end.d.prop_area===85&&end.d.hood==='h6'&&end.d.deal>=end.d.minprice&&end.req&&/توافق اولیه/.test(end.req.status)&&!end.done&&end.contracts.length===0,
    'Seller reaches tracked simulated agreement without claiming a signed contract',['success','empty-data','cancel','resume']);
  },sellerRows.map(x=>'step:sell:'+x));

  const landlordBranches={price:['l_role','l_advice'],res:['l_role','l_price','l_rent','l_sum'],stay:['l_role','l_stay_rate','l_stay_capacity','l_stay_min','l_sum']};
  for(const [branch,rows] of Object.entries(landlordBranches))await test('PA-SERVICE-LANDLORD-'+branch,async h=>{
   const {page,check,send,act}=h;await beginService(h,'landlord');const seen=[];
   const answers={l_hood:'نارمک',l_price:'۱ میلیارد تومان',l_rent:'صفر',l_stay_rate:'۲ میلیون تومان',l_stay_capacity:'۴',l_stay_min:'۲'};
   for(let n=0;n<16;n++){
    const id=await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id);
    if(rows.includes(id)){await exerciseStep(h,'lndl',id);seen.push(id)}
    if(id==='l_role'){await chip(h,branch);continue}
    if(id==='l_advice'){await chip(h,'!end');break}
    if(id==='l_sum'){await chip(h,'!ok');break}
    if(answers[id]){
     if(id!=='l_hood'){
      const before=await serviceState(page,'lndl');await send(id==='l_stay_capacity'?'۵۱':id==='l_stay_min'?'۹۱':'نامعتبر');
      const after=await serviceState(page,'lndl');check(after.step===before.step&&after.credits===before.credits,'Invalid '+id+' leaves step and balance unchanged');
     }
     await send(answers[id]);
    }else throw Error('Unexpected landlord step '+id);
   }
   check(rows.every(x=>seen.includes(x)),'Every selected landlord branch step has full pause/resume and empty-input evidence');
   const end=await serviceState(page,'lndl');
   if(branch==='price')check(end.flow===null&&await page.evaluate(()=>!wd('lndl').data.registered),'Price advice ends without a listing');
   else check(await page.evaluate(b=>{const d=wd('lndl').data;return d.registered&&d.listingStatus==='draft_internal'&&d.ltype===b&&
    (b==='res'?d.ask_rent===0&&d.zeroRent:d.nightlyRate===2e7&&d.stayCapacity===4&&d.minNights===2)},branch),'Selected landlord draft records exact inputs and internal-only status');
   await act('reload completed landlord branch',()=>page.reload({waitUntil:'domcontentloaded'}));
   check((await serviceState(page,'lndl')).data===end.data,'Landlord result survives reload unchanged',['success','empty-data','cancel','resume']);
  },rows.map(x=>'step:lndl:'+x));

  await test('PA-SERVICE-INVESTMENT',async h=>{
   const {page,check,send,act}=h;await beginService(h,'invest');
   await exerciseStep(h,'invp','i_an');
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('نوع دارایی مشخص نشده'),'Missing optional asset produces honest incomplete analysis');
   await chip(h,'!save');await exerciseStep(h,'invp','i_done');
   const end=await page.evaluate(()=>({done:wd('invp').done,items:S.library.filter(x=>x.type==='invest'),reqs:S.reqs.filter(x=>x.cat==='invest')}));
   check(end.done&&end.items.length===1&&end.reqs.length===1,'Analysis save and completed request are created once');
   await act('reload completed investment',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(()=>S.library.filter(x=>x.type==='invest').length===1&&wd('invp').done),'Completed result persists once',['success','empty-data','cancel','resume']);
  },['step:invp:i_an','step:invp:i_done']);

  await test('PA-SERVICE-STAY-INPUTS',async h=>{
   const {page,check,send}=h;await send(await page.evaluate(()=>E30.guide.actions.stay.prompt));
   for(const [id,value] of [['city','تهران'],['date','هفتهٔ بعد'],['ppl','۲']]){
    await exerciseStep(h,'stay',id);
    if(id==='ppl'){await send('صفر');check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='ppl'),'Zero travelers is rejected')}
    await send(value);
   }
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='list'&&wd('stay').data.city==='تهران'&&wd('stay').data.date==='هفتهٔ بعد'&&wd('stay').data.ppl===2)&&
    await page.locator('#chatB .msg.bot').last().locator('.pcard').count()>0,'Valid destination, date and travelers reach usable accommodation cards');
   const ids=await page.locator('#chatB .msg.bot').last().locator('[data-cba="selS"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-l')));
   const expected=await page.evaluate(()=>SLIST.filter(x=>x.city==='تهران').map(x=>x.id));
   check(ids.length===expected.length&&ids.every(x=>expected.includes(x)),
    'Every accommodation card belongs to an actual sample in the requested city',['success','empty-data','cancel','resume']);
  },['step:stay:city','step:stay:date','step:stay:ppl']);

  await test('PA-STAY-EMPTY-INVALID',async h=>{
   const {page,check,send,act}=h;
   await send(await page.evaluate(()=>E30.guide.actions.stay.prompt));
   await send('مشهد');await send('هفتهٔ بعد');await send('۲');
   const panel=page.locator('#chatB .msg.bot').last();
   check((await panel.textContent()).includes('موجود نیست')&&await panel.locator('.pcard').count()===0,
    'Unavailable city returns explicit empty inventory without substitute cards',['empty-data']);
   await exerciseStep(h,'stay','list');
   await chip(h,'!all');
   const first=page.locator('#chatB .msg.bot').last().locator('[data-cba="selS"]').first();
   check(await first.isVisible(),'Explicit all-cities action reveals actual available sample');
   await act('explicitly choose accommodation after all-cities request',async()=>{await first.click();await page.waitForTimeout(180)});
   await chip(h,'!nx');
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='ngt'),'Explicit sample choice reaches nights');
   for(const value of ['صفر','-۱','۹۱','۲.۵','نامعتبر']){
    const before=await serviceState(page,'stay');await send(value);
    const after=await serviceState(page,'stay');
    check(after.step==='ngt'&&await page.evaluate(()=>wd('stay').data.nights==null)&&after.credits===before.credits,
     'Invalid night input cannot invent five nights, advance or charge: '+value);
   }
   await exerciseStep(h,'stay','ngt');await send('۳');
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='book'&&wd('stay').data.nights===3&&!wd('stay').data.code),
    'Valid nights reaches reservation preview without automatic booking',['success','cancel','resume']);
  },['step:stay:list','step:stay:ngt']);

  await test('PA-BUILD-PROJECT-SCOPED',async h=>{
   const {page,check,send,act}=h;
   const initial=await snapshot(page);
   check(await page.evaluate(()=>!E30.guide.canSuggest('build')),'Missing project hides the build suggestion',['hidden']);
   await explicitRequest(h,'build');
   check(await page.evaluate(()=>!S.wfs.some(w=>w.m==='build'))&&
    (await page.locator('#chatB .msg.bot').last().textContent()).includes('پروژه'),
    'Missing approved project produces prerequisite message without invented workflow',['empty-data']);
   // Fixture represents a previously approved project; all operations below use UI.
   const project=await page.evaluate(()=>{const w=wfNew('mkt');w.data={role:'con',bid:{prj:0,amt:8e9,dur:18,adj:'none'},confirmed:true};save();return w.id});
   await send(await page.evaluate(()=>E30.guide.actions.build.prompt));
   await exerciseStep(h,'build','sup');
   await send('999999');
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='sup'&&!wd('build').data.orders?.length),'Invalid supplier creates no order');
   await send('0');
   check(await page.evaluate(()=>wd('build').data.orders.length===1&&wd('build').data.orders[0].status==='draft_internal'&&!wd('build').data.ph),
    'Explicit supplier creates one internal draft without assumed progress');
   await exerciseStep(h,'build','ph');
   check(await page.evaluate(()=>wd('build').data.ph==null),'Viewing or resuming phases does not invent progress');
   await chip(h,'!p');
   check(await page.evaluate(()=>JSON.stringify(wd('build').data.ph)==='[10,0,0,0,0]'&&!wd('build').done),'Explicit progress starts at zero and does not deliver');
   await chip(h,'!all');await chip(h,'!done');
   const completed=await page.evaluate(()=>({id:wd('build').id,data:JSON.stringify(wd('build').data),done:wd('build').done}));
   check(completed.done&&await page.evaluate(id=>wd('build').data.projectWfId===id,project),'Completion stays attached to the approved project');
   await act('reload completed project build',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(({id,data})=>wfOf(id).done&&JSON.stringify(wfOf(id).data)===data,completed)&&
    (await snapshot(page)).credits===initial.credits,'Completed build persists with exact facts and no debit',['success','cancel','resume']);
  },['step:build:sup','step:build:ph','scenario:build']);

  await test('PA-PROJECT-CONTRACTOR',async h=>{
   const {page,check,send,act}=h;
   await send(await page.evaluate(()=>E30.guide.actions.development.prompt));
   check(await page.evaluate(()=>!S.wfs.some(w=>w.m==='mkt')),'Browsing sample projects creates no operational workflow');
   await act('choose actual project as contractor',async()=>{await page.locator('#chatB [data-cba="e31ProjectBid"][data-i="0"]').last().click()});
   const id=await page.evaluate(()=>wd('mkt').id);
   for(const [step,value] of [['bid','۸ میلیارد تومان'],['adj','none']]){
    await exerciseStep(h,'mkt',step);
    await send('ورودی نامعتبر');
    check(await page.evaluate(s=>SCRIPTS[CE.f]?.[CE.i]?.id===s,step),'Invalid '+step+' cannot advance');
    await send(value);
   }
   await exerciseStep(h,'mkt','send');
   const credits=(await snapshot(page)).credits;
   await chip(h,'!b');
   check(await page.locator('#chatB [data-paygo]').last().isVisible()&&
    await page.evaluate(()=>!wd('mkt').data.bid&&S.tokens===500),'Bid requires explicit priced payment confirmation');
   await act('confirm contractor payment',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(3500)});
   check(await page.evaluate(id=>wfOf(id).data.confirmed&&wfOf(id).data.bid.amt===8e10,id),'Confirmed paid bid retains selected project and amount');
   await exerciseStep(h,'mkt','st');await chip(h,'!nx');
   await exerciseStep(h,'mkt','trk');
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('ثبت نشده')&&await page.evaluate(()=>!S.wfs.some(w=>w.m==='build')),
    'Tracking does not invent construction or progress');
   await chip(h,'!end');
   const end=await page.evaluate(id=>({done:wfOf(id).done,bid:JSON.stringify(wfOf(id).data.bid),credits:S.tokens}),id);
   await act('reload completed contractor project',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(({id,bid})=>wfOf(id).done&&JSON.stringify(wfOf(id).data.bid)===bid,{id,bid:end.bid})&&end.credits===credits-20,
    'Project completes and persists with exactly one bid charge',['success','empty-data','cancel','resume']);
  },['bid','adj','send','st','trk'].map(x=>'step:mkt:'+x));

  await test('PA-PROJECT-EMPLOYER',async h=>{
   const {page,check,send,act}=h;
   await send(await page.evaluate(()=>E30.guide.actions.development.prompt));
   await act('choose actual project as employer',()=>page.locator('#chatB [data-cba="e31ProjectEmployer"][data-i="0"]').last().click());
   await exerciseStep(h,'mkt','prj');
   await send('پروژهٔ ناموجود');
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='prj'&&!wd('mkt').data.chosen),'Unknown project never approves a contractor');
   // Reopen the catalog and explicitly select the operation; no internal handler calls.
   await send(await page.evaluate(()=>E30.guide.actions.development.prompt));
   await act('select target employer project again',()=>page.locator('#chatB [data-cba="e31ProjectEmployer"][data-i="0"]').last().click());
   const id=await page.evaluate(()=>wd('mkt').id);
   await act('explicitly approve displayed contractor',()=>page.locator('#chatB [data-cba="e31ProjectChoose"]').last().click());
   check(await page.evaluate(()=>wd('mkt').data.chosen!=null),'Actual displayed contractor approved internally');
   await chip(h,'!nx');await chip(h,'!end');
   check(await page.evaluate(id=>wfOf(id).done&&wfOf(id).data.chosen!=null,id),'Employer reaches independent completed project',['success','empty-data','cancel','resume']);
  },['step:mkt:prj']);

  await test('PA-STAY-BOOK-CHECKIN',async h=>{
   const {page,check,send,act}=h;await send(await page.evaluate(()=>E30.guide.actions.stay.prompt));
   await send('تهران');await send('هفتهٔ بعد');await send('۲');
   await act('select accommodation for booking',()=>page.locator('#chatB .msg.bot').last().locator('[data-cba="selS"]').first().click());
   await chip(h,'!nx');await send('۳');
   await exerciseStep(h,'stay','book');
   const before=await snapshot(page);await chip(h,'!b');
   check(await page.locator('#chatB [data-paygo]').last().isVisible()&&await page.evaluate(()=>!wd('stay').data.code),
    'Booking presents explicit payment without inventing confirmation code',['empty-data']);
   await act('confirm accommodation payment',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(2300)});
   check(await page.evaluate(()=>!!wd('stay').data.code&&SCRIPTS[CE.f]?.[CE.i]?.id==='chk'),'Paid booking creates actual demo check-in code');
   await exerciseStep(h,'stay','chk');await chip(h,'!c');
   const end=await page.evaluate(()=>({id:wd('stay').id,code:wd('stay').data.code,checked:wd('stay').data.checked,tokens:S.tokens}));
   check(end.checked&&end.tokens===before.credits-30,'Explicit check-in completes once with exactly one booking charge');
   await h.prompt('pause-service');
   await act('reload booked accommodation',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(({id,code})=>wfOf(id).data.checked&&wfOf(id).data.code===code,end),
    'Booking identity and check-in survive reload');
   // Check-in independently completes the reservation; its optional review
   // remains resumable until explicitly submitted.
   await send(await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
   await exerciseStep(h,'stay','rev');
   await send('۶');check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='rev'),'Out-of-range rating does not advance');
   await send('۴');await exerciseStep(h,'stay','revt');
   await send('اقامت آزمایشی رضایت‌بخش بود');
   check(await page.evaluate(()=>wd('stay').data.reviewSubmitted&&S.reviews.length===1&&S.reviews[0].s===4&&
    S.reviews[0].t==='اقامت آزمایشی رضایت‌بخش بود'&&S.reqs.filter(r=>r.type==='نظر').length===1),
    'Explicit review has exact text and rating and is recorded once');
   await act('reload completed review',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(()=>wd('stay').data.reviewSubmitted&&S.reviews.length===1&&S.reviews[0].s===4&&S.tokens===470),
    'Completed booking and optional review persist with one charge',['success','empty-data','cancel','resume']);
  },['step:stay:book','step:stay:chk','step:stay:rev','step:stay:revt','scenario:stay']);

  async function registerContract(h,kind){
   const {page,act,check}=h;
   await act('fill and submit contract parties',async()=>{
    await page.locator('#cl-name').fill('طرف اول آزمون');await page.locator('#cl-id').fill('1234567891');
    await page.locator('#co-name').fill('طرف دوم آزمون');await page.locator('#co-id').fill('9876543210');
    await page.locator('#co-mobile').fill('09123334455');
    await page.locator('#chatB [data-act="cpartySave"]').last().click();
   });
   check(await page.evaluate(k=>wd(k).data.ctr.step===2,kind),'Actual parties pass validation');
   await act('fill and submit property and financial terms',async()=>{
    await page.locator('#cp-postal').fill('1234567890');await page.locator('#cp-addr').fill('نشانی آزمایشی، پلاک ۱');
    await page.locator('#cp-area').fill('70');
    const tomorrow=new Date(Date.now()+864e5).toISOString().slice(0,10);
    if(kind==='buy'){
     await page.locator('#cp-price').fill('14000000000');await page.locator('#cp-delivery').fill(tomorrow);
    }else{
     await page.locator('#cp-start').fill(tomorrow);await page.locator('#cp-dep').fill('1000000000');await page.locator('#cp-rent').fill('0');
    }
    await page.locator('#chatB [data-act="cpropSave"]').last().click();
   });
   check(await page.evaluate(k=>wd(k).data.ctr.step===3,kind),'Exact property terms reach review');
   await act('explicitly approve both contract parties',async()=>{
    await page.locator('label.switch:has(#ca-me)').click();await page.locator('label.switch:has(#ca-owner)').click();
    await page.locator('#ca-me-name').fill('طرف اول آزمون');await page.locator('#ca-owner-name').fill('طرف دوم آزمون');
    await page.locator('#chatB [data-act="capprove"]').last().click();
    await page.locator('#chatB [data-act="cfinalize"]').last().click();
   });
   const before=await snapshot(page);
   check(await page.evaluate(k=>!wd(k).data.ctr.finalized&&S.paySession?.state==='presented'&&S.paySession?.cost===60,kind),
    'Both approvals still require a separate explicit 60-token payment');
   await act('confirm contract payment',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(250)});
   check(await page.evaluate(k=>wd(k).data.ctr.finalized&&S.contracts.some(c=>c.code===wd(k).data.code&&c.status==='signed_internal'),kind)&&
    (await snapshot(page)).credits===before.credits-60,'Internal contract is registered once after explicit payment');
  }


  // A direct request may be typed even when context correctly hides its
  // suggestion. Observe the inert composer separately from explicit sending.
  async function explicitRequest(h,id){
   const {page,check,act}=h,before=await snapshot(page);
   const text=await page.evaluate(id=>E30.guide.actions[id].prompt,id);
   await act('type explicit request '+id,()=>page.locator('#chatIn').fill(text));
   const filled=await snapshot(page);
   check(filled.userTurns===before.userTurns&&filled.credits===before.credits&&filled.requests===before.requests&&
    JSON.stringify(filled.deposit)===JSON.stringify(before.deposit)&&JSON.stringify(filled.rent)===JSON.stringify(before.rent),
    'Composing '+id+' never submits, changes preferences or performs an operation',['composer-prefill']);
   await act('send explicit request '+id,async()=>{await page.locator('#chatSend').click();await page.waitForTimeout(180)});
   check((await snapshot(page)).userTurns===before.userTurns+1,'Explicit '+id+' send records one user turn',['composer-send']);
   check(await page.locator('#chatB .msg.bot').last().isVisible(),'Requested '+id+' result is visible inside chat',['visible']);
  }
  async function resumeDiscovery(h,fields){
   const {page,act,send,check}=h;
   await act('reload interrupted discovery',()=>page.reload({waitUntil:'domcontentloaded'}));
   if(await page.evaluate(()=>E30.guide.canSuggest('resume-service')))
    await send(await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
   check(await page.evaluate(fields=>E30.discAPI.active()&&E30.discAPI.collector().wf==='rent'&&
    JSON.stringify(E30.discAPI.ctx().fields)===fields,fields),
    'Original rental discovery resumes with exactly its previous facts',['cancel','resume']);
   await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
   check(await page.locator('#chatB .e31-results .pcard').count()>0,'Resumed primary task still reaches usable actual listings');
  }
  for(const flow of ['rent','buy','sell','invest','landlord'])await test('PA-SCENARIO-'+flow,async h=>{
   const {page,check,send,act}=h;
   await explicitRequest(h,flow);
   check(await page.evaluate(f=>E30.discAPI.active()&&E30.discAPI.collector().wf===f&&
    !E30.discAPI.getF('work_loc')&&!E30.discAPI.getF('children'),flow),
    'Discovery selects '+flow+' without school, work or invented household');
   check(await page.evaluate(()=>E30.discAPI.collector().expecting==null),'Entry does not impose an unsolicited questionnaire',['empty-data']);
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await send(await page.evaluate(()=>E30.guide.actions.valuation.prompt));
   check(await page.locator('#chatB #e30-val-area').isVisible()&&await page.evaluate(()=>!E30.discAPI.active()),
    'Explicit side task opens a form without changing the main discovery');
   await act('reload pending '+flow,()=>page.reload({waitUntil:'domcontentloaded'}));
   await send(await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
   check(await page.evaluate(({flow,fields})=>E30.discAPI.active()&&E30.discAPI.collector().wf===flow&&
    JSON.stringify(E30.discAPI.ctx().fields)===fields,{flow,fields}),
    'Abandoning the side form resumes exactly the selected discovery',['cancel','resume']);
   if(flow==='rent'||flow==='buy'){
    await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
    check(await page.locator('#chatB .e31-results .pcard').count()>0,'Optional facts can remain unknown through successful search',['success']);
   }else{
    await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته');
    if(flow==='invest'){
     await chip(h,'!save');
     check(await page.evaluate(()=>wd('invp').done&&S.library.some(x=>x.type==='invest')),
      'Explicit analysis completes and saves its actual sample artifact',['success']);
    }else if(flow==='sell'){
     await chip(h,'single');await send('۸۵');await send('نارمک');
     check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='s_val'&&wd('sell').data.prop_area===85&&wd('sell').data.hood==='h6'),
      'Selected pricing service reaches actual valuation with real prerequisites',['success']);
    }else{
     await chip(h,'price');await send('نارمک');await chip(h,'!end');
     check(await page.evaluate(()=>CE.f===null&&!wd('lndl').data.registered),
      'Price advice completes without forcing a listing',['success']);
    }
   }
   check((await snapshot(page)).credits===500,'Discovery and free selected output do not charge');
  },['scenario:'+flow]);

  await test('PA-SCENARIO-SPECS',async h=>{
   const {page,check,send,result}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   await explicitRequest(h,'rent-specs');await send('۶۰');
   check(await page.evaluate(()=>E30.discAPI.getF('m2')===60),'Explicit neutral specs prompt stores only supplied size');
   await send(await page.evaluate(()=>E30.guide.actions['need-rooms'].prompt));await send('۱');
   check(await page.evaluate(()=>E30.discAPI.getF('rooms')===1),'Bedroom count is supplied separately');
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await send(await page.evaluate(()=>E30.guide.actions.valuation.prompt));await resumeDiscovery(h,fields);
   const found=await result();
   check(found.ids.length>0&&await page.evaluate(ids=>ids.every(id=>{const x=RLIST.find(x=>x.id===id);return x.m2>=60&&x.beds>=1}),found.ids),
    'Requested size and rooms reach matching property cards',['success','empty-data']);
  },['scenario:rent-specs']);

  for(const id of ['neighborhood','compare','rent-area'])await test('PA-SCENARIO-'+id,async h=>{
   const {page,check,send,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,id);
   const last=page.locator('#chatB .msg.bot').last();
   if(id==='rent-area'){
    check(await last.locator('.e31-geo-unavailable').isVisible()&&await last.locator('.e31-price-row').count()===0&&
     await page.evaluate(()=>!E30.guide.canSuggest('rent-area')),
     'No verified adjacency means no invented nearby neighborhoods or unsolicited area suggestion',['empty-data']);
    await send(await page.evaluate(()=>E30.guide.actions.compare.prompt));
   }
   const rows=page.locator('#chatB .e31-price-chart').last().locator('.e31-price-row');
   check(await rows.count()>=2,'General comparison has actual comparable sample rows',['success']);
   check(await rows.evaluateAll(xs=>xs.every(row=>{const h=HOODS.find(x=>x.n===row.dataset.hood);return h&&row.querySelector('b').textContent===rial(h.buyBase)})),
    'Every plotted price matches the labeled actual dataset');
   await send('محله نارمک را مقایسه کن');
   check(await page.locator('#chatB .msg.bot').last().locator('.e31-price-row').count()===0&&
    (await page.locator('#chatB .msg.bot').last().textContent()).includes('حداقل دو محله'),
    'One named neighborhood receives honest missing-comparison fallback',['empty-data']);
   await resumeDiscovery(h,fields);
   check((await snapshot(page)).credits===500,'Comparison preserves free account balance');
  },['scenario:'+id]);

  await test('PA-SCENARIO-SAMPLE',async h=>{
   const {page,check,send,prompt,confirmBudget,result}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   await explicitRequest(h,'sample');
   check(await page.locator('#chatB .e31-results .pcard').count()>0,'Unconstrained sample has usable cards',['success']);
   await prompt('rent-budget');await send('ودیعه تا ۱ تومان و اجاره ماهانه تا ۱ تومان');await confirmBudget(10,10);
   const zero=await result();check(zero.ids.length===0&&zero.state.lastText.includes('آگهی منطبق پیدا نشد'),
    'Impossible explicit caps produce honest empty response',['empty-data']);
   await explicitRequest(h,'rent-budget');await send('ودیعه تا ۴ میلیارد تومان و اجاره ماهانه تا ۹۰ میلیون تومان');await confirmBudget(40e9,9e8);
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await send(await page.evaluate(()=>E30.guide.actions.valuation.prompt));await resumeDiscovery(h,fields);
  },['scenario:sample']);

  await test('PA-SCENARIO-MAP',async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,'map');
   const card=page.locator('#chatB .e30-chat-map-card').last();
   check(await card.isVisible()&&(await card.textContent()).includes('نمونه'),'Real map is labeled as sample inside chat',['success']);
   const load=card.locator('[data-cba="e30MapLoad"]');if(await load.count())await act('load real interactive map',async()=>{await load.click();await page.waitForTimeout(500)});
   check(await card.locator('.e30-chat-map-canvas').count()>0,'Map owns an actual canvas in chat');
   // Simulate unavailable tile transport, leaving application code untouched.
   let blockedTiles=0;
   await page.route(/^https:\/\/[^/]*tile\.openstreetmap\.(?:de|fr|org)\//,route=>{blockedTiles++;return route.abort()});
   await send(await page.evaluate(()=>E30.guide.actions.map.prompt));
   const offline=page.locator('#chatB .e30-chat-map-card').last();
   await act('load map with unavailable tile transport',()=>offline.locator('[data-cba="e30MapLoad"]').click());
   await offline.locator('.mapnote').waitFor({state:'visible',timeout:15000});
   check(blockedTiles>0,'Tile transport was actually interrupted by the browser route');
   check((await offline.locator('.mapnote').textContent()).includes('برخی قطعات نقشه بارگیری نشد')&&await offline.locator('.leaflet-marker-icon').count()>0,
    'Failed tile transport shows an honest warning and retains usable location markers',['empty-data']);
   await resumeDiscovery(h,fields);
  },['scenario:map']);

  for(const id of ['services','guaranteed'])await test('PA-SCENARIO-'+id,async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields)),before=await snapshot(page);
   await explicitRequest(h,id);
   const selector=id==='services'?'e30SaveService':'e30SaveGRT';
   await act('reject incomplete '+id,()=>page.locator('#chatB [data-cba="'+selector+'"]').last().click());
   check((await snapshot(page)).requests===before.requests&&(await snapshot(page)).credits===before.credits,
    'Incomplete '+id+' creates no request or charge',['empty-data']);
   await act('supply real '+id+' prerequisites and explicitly save',async()=>{
    if(id==='services'){
     await page.locator('#e30-svc-type').selectOption({label:'بررسی تأسیسات'});
     await page.locator('#e30-svc-detail').fill('بررسی فشار آب در ملک نارمک');
    }else{
     await page.locator('#e30-grt-address').fill('نارمک');await page.locator('#e30-grt-area').fill('۸۵'.replace('۸','8').replace('۵','5'));
    }
    await page.locator('#chatB [data-cba="'+selector+'"]').last().click();
   });
   check(await page.evaluate(cat=>S.reqs.filter(x=>x.cat===cat&&x.status==='در انتظار تکمیل').length===1,id==='services'?'svc':'grt')&&
    (await snapshot(page)).credits===before.credits,'Exactly one explicit internal draft is stored without claiming final service',['success']);
   await resumeDiscovery(h,fields);
  },['scenario:'+id]);

  await test('PA-SCENARIO-VALUATION',async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,'valuation');await page.locator('#e30-val-area').last().fill('0');
   await act('reject invalid valuation size',()=>page.locator('#chatB [data-cba="e30ValQuote"]').last().click());
   check(await page.evaluate(()=>S.tokens===500&&!S.paySession&&!S.library.some(x=>x.type==='valuation')),
    'Invalid valuation cannot quote, charge or save a report',['empty-data']);
   await page.locator('#e30-val-area').last().fill('85');await page.locator('#e30-val-age').last().fill('10');
   await act('request actual valuation price',()=>page.locator('#chatB [data-cba="e30ValQuote"]').last().click());
   check(await page.evaluate(()=>S.tokens===500&&S.paySession.state==='presented'&&S.paySession.cost===40),
    'Exact tariff is shown before any debit');
   await act('cancel valuation quote',()=>page.locator('#chatB [data-paycancel]').last().click());
   check(await page.evaluate(()=>S.tokens===500&&!S.paySession),'Cancelling a quote costs nothing',['cancel']);
   await send(await page.evaluate(()=>E30.guide.actions.valuation.prompt));
   await page.locator('#e30-val-area').last().fill('85');await page.locator('#e30-val-age').last().fill('10');
   await act('requote valuation',()=>page.locator('#chatB [data-cba="e30ValQuote"]').last().click());
   await act('explicitly pay for valuation',()=>page.locator('#chatB [data-paygo]').last().click());
   check(await page.evaluate(()=>S.tokens===460&&S.library.filter(x=>x.type==='valuation'&&x.artifact.area===85&&x.artifact.age===10&&x.artifact.estimate>0).length===1),
    'Confirmed valuation delivers the actual artifact with exact inputs',['success']);
   await resumeDiscovery(h,fields);
  },['scenario:valuation']);

  for(const id of ['saved','library','projects','contracts'])await test('PA-SCENARIO-'+id,async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   check(await page.evaluate(id=>id==='contracts'||!E30.guide.canSuggest(id),id),'Empty stored-item service is not recommended without data');
   await explicitRequest(h,id);
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('هنوز'),'Explicit empty inventory request is honest',['empty-data']);
   await act('load existing independent inventory fixture',()=>page.evaluate(id=>{
    if(id==='saved')S.savedListings=[{listingId:'r1',title:'ملک ذخیره آزمون',kind:'rent'}];
    if(id==='library')S.library=[{id:'QA-LIB',title:'گزارش موجود آزمون',type:'valuation',artifact:{area:85}}];
    if(id==='projects')S.projects=[{id:'QA-PROJECT',name:'پروژه موجود آزمون',chatIds:[]}];
    if(id==='contracts')S.contracts=[{code:'QA-CONTRACT',title:'قرارداد موجود آزمون',kind:'rent',status:'signed_internal'}];
    save();
   },id));
   const inventory=await page.evaluate(()=>JSON.stringify({saved:S.savedListings,library:S.library,projects:S.projects,contracts:S.contracts}));
   await explicitRequest(h,id);
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('آزمون'),'Summary displays actual stored fixture identity',['success']);
   check(await page.evaluate(()=>JSON.stringify({saved:S.savedListings,library:S.library,projects:S.projects,contracts:S.contracts}))===inventory,
    'Viewing inventory never creates or changes an item');
   await resumeDiscovery(h,fields);
  },['scenario:'+id]);

  await test('PA-SCENARIO-CONTRACT',async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,'contract-start');
   check(await page.locator('#chatB [data-e28ctr]').isVisible()&&await page.evaluate(()=>S.contracts.length===0&&S.tokens===500),
    'Direct entry opens exactly the real contract form without registration or debit',['empty-data']);
   await registerContract(h,'rent');
   check(await page.evaluate(()=>S.contracts.length===1&&S.tokens===440),'Explicit contract operation independently registers once',['success']);
   await resumeDiscovery(h,fields);
  },['scenario:contract-start']);

  await test('PA-SCENARIO-TERMINATION-EMPTY',async h=>{
   const {page,send,check}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   check(await page.evaluate(()=>!E30.guide.canSuggest('termination')),'No eligible agreement means no unsolicited termination');
   await explicitRequest(h,'termination');
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('قرارداد قابل ارجاعی ثبت نشده')&&
    await page.locator('#chatB [data-cba="e31TermStart"]').count()===0,
    'Empty termination neither selects a target nor invents a contract',['empty-data']);
   await resumeDiscovery(h,fields);
  },['scenario:termination']);

  await test('PA-SCENARIO-REMINDER',async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields)),before=await page.evaluate(()=>S.reminders.length);
   await explicitRequest(h,'reminder');
   check(await page.evaluate(n=>S.reminders.length===n+1&&S.reminders.at(-1)?.due>Date.now()||
    S.reminders.length===n+1&&S.reminders[0]?.due>Date.now(),before),
    'Explicitly sent future reminder is actually stored once',['success']);
   const reminders=await page.evaluate(()=>JSON.stringify(S.reminders));
   await act('compose and discard unsent reminder',async()=>{await page.locator('#chatIn').fill('یادم بنداز');await page.locator('#chatIn').fill('')});
   check(await page.evaluate(()=>JSON.stringify(S.reminders))===reminders,'Unsent incomplete reminder creates no event',['empty-data','cancel']);
   await resumeDiscovery(h,fields);
   check(await page.evaluate(()=>JSON.stringify(S.reminders))===reminders,'Reminder identity persists through reload');
  },['scenario:reminder']);

  await test('PA-SCENARIO-STAY',async h=>{
   const {page,send,check}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,'stay');
   check(await page.evaluate(()=>CE.f==='stay'&&SCRIPTS[CE.f][CE.i].id==='city'&&!wd('stay').data.city),
    'Requested accommodation has no invented destination',['empty-data']);
   await send('تهران');await send('هفتهٔ بعد');await send('۲');
   check(await page.locator('#chatB .msg.bot').last().locator('.pcard').count()>0,'Actual accommodation search returns matching sample cards',['success']);
   await send(await page.evaluate(()=>E30.guide.actions['resume-service'].prompt));
   await resumeDiscovery(h,fields);
  },['scenario:stay']);

  await test('PA-SCENARIO-DEVELOPMENT',async h=>{
   const {page,send,check,act}=h;await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   await explicitRequest(h,'development');
   check(await page.locator('#chatB .e31-project-catalog .ccard').count()>0&&
    await page.evaluate(()=>!S.wfs.some(w=>w.m==='mkt')),'Browsing actual projects imposes no role or project workflow',['success','skip']);
   await act('select employer operation on an actual project',()=>page.locator('#chatB [data-cba="e31ProjectEmployer"][data-i="1"]').last().click());
   await act('explicitly approve selected contractor',()=>page.locator('#chatB [data-cba="e31ProjectChoose"]').last().click());
   await chip(h,'!nx');await chip(h,'!end');
   check(await page.evaluate(()=>wd('mkt').done&&wd('mkt').data.chosen.prj===1),'Selected employer workflow completes on the actual selected project');
   await resumeDiscovery(h,fields);
   const projects=await page.evaluate(()=>{const p=PRJ;PRJ=[];return p});
   await explicitRequest(h,'development');
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('در دسترس نیست')&&
    await page.locator('#chatB .msg.bot').last().locator('.ccard').count()===0,
    'Unavailable project dataset gives an honest empty result',['empty-data']);
   await page.evaluate(p=>{PRJ=p},projects);
  },['scenario:development']);


  await test('PA-GATE-OPTIONAL-ENTRY',async h=>{
   const {page,check,send,act}=h;
   check(await page.evaluate(()=>SCRIPTS.gate.map(x=>x.id).join(',')==='hello,menu'),
    'Entry registry contains request detection and menu, with no work or school questions');
   await act('empty entry submission',async()=>{await page.locator('#chatIn').fill(' ');await page.locator('#chatSend').click()});
   check(await page.evaluate(()=>!E30.discAPI.active()&&!E30.discAPI.getF('work_loc')&&!E30.discAPI.getF('children')),
    'Empty entry creates no personal facts or collector',['empty-data']);
   await send('یه خونه برام پیدا کن.');
   check((await page.locator('#chatB .msg.bot').last().textContent()).includes('خرید خانه است یا رهن و اجاره'),
    'Ambiguous entry asks only transaction type');
   await h.prompt('rent');
   await send('من مجردم و فرزند ندارم و محل کار ثابت ندارم');
   const fields=await page.evaluate(()=>JSON.stringify(E30.discAPI.ctx().fields));
   check(!(await page.locator('#chatB .msg.bot').last().textContent()).includes('مدرسهٔ فرزندانتان')&&
    await page.evaluate(()=>!E30.discAPI.getF('work_loc')),
    'Single, childless user without fixed work is never asked gate school or work');
   await send(await page.evaluate(()=>E30.guide.actions.valuation.prompt));await resumeDiscovery(h,fields);
   // Explicit menu button belongs to a completed independent service.
   await send(await page.evaluate(()=>E30.guide.actions.invest.prompt));
   await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته');await chip(h,'!save');
   await chip(h,'!menu');
   check(await page.evaluate(()=>CE.f==='gate'&&SCRIPTS.gate[CE.i].id==='menu'),
    'Main-menu navigation returns to request choices without the retired gate questionnaire');
   await chip(h,'F:buy');
   await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
   check(await page.locator('#chatB .e31-results .pcard').count()>0,'Both entry and menu reach independently usable service results',['success','cancel','resume']);
  },['step:gate:hello','step:gate:work','step:gate:school','step:gate:menu']);

  await test('PA-MARKET-ROLE-CHOICE',async h=>{
   const {page,send,check,act}=h;
   await explicitRequest(h,'development');
   check(await page.evaluate(()=>!S.wfs.some(w=>w.m==='mkt')),'Browsing skips role with no invented project',['skip']);
   await act('choose actual contractor operation',()=>page.locator('#chatB [data-cba="e31ProjectBid"][data-i="0"]').last().click());
   const contractor=await page.evaluate(()=>({id:wd('mkt').id,data:JSON.stringify(wd('mkt').data)}));
   check(await page.evaluate(()=>wd('mkt').data.role==='con'),'Explicit contractor operation records role',['answer']);
   await send(await page.evaluate(()=>E30.guide.actions.development.prompt));
   await act('explicitly choose employer role on another project',()=>page.locator('#chatB [data-cba="e31ProjectEmployer"][data-i="1"]').last().click());
   check(await page.evaluate(c=>wd('mkt').data.role==='emp'&&wd('mkt').id!==c.id&&JSON.stringify(wfOf(c.id).data)===c.data,contractor),
    'Changing selected role creates the correct independent operation and preserves prior bid',['edit']);
   await act('approve only selected employer contractor',()=>page.locator('#chatB [data-cba="e31ProjectChoose"]').last().click());
   await chip(h,'!nx');await chip(h,'!end');
   const id=await page.evaluate(()=>wd('mkt').id);
   check(await page.evaluate(id=>wfOf(id).done&&wfOf(id).data.chosen.prj===1,id),
    'Role selection proceeds through the completed selected service',['service-terminal']);
   await act('reload explicit role choices',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(({id,contractor})=>wfOf(id).done&&JSON.stringify(wfOf(contractor.id).data)===contractor.data,{id,contractor}),
    'Both role-specific operations survive reload independently',['reload']);
  },['step:mkt:role']);

  const rentalRows=['hoods','mk','list','day','time','visit','vform','vadd','ctr0'];
  await test('PA-RENT-VISIT-CONTRACT',async h=>{
   const {page,send,check,act}=h;await beginService(h,'rent');
   await exerciseStep(h,'rent','hoods');await send('سعادت‌آباد');
   await exerciseStep(h,'rent','mk');await chip(h,'ok');
   await exerciseStep(h,'rent','list');
   const noSelection=await serviceState(page,'rent');
   check(await page.locator('#chatB .msg.bot').last().locator('[data-cv="!skp"]').count()===0,'Continue is unavailable without a selected property');
   await send('!skp');
   check((await serviceState(page,'rent')).step==='list'&&(await snapshot(page)).credits===noSelection.credits,
    'Missing property cannot start a visit or charge');
   await act('select actual matched rental card',()=>page.locator('#chatB [data-cba="selL"]').last().click());
   await chip(h,'!skp');await exerciseStep(h,'rent','day');
   const day=await page.evaluate(()=>SCRIPTS.rent.find(s=>s.id==='day').chips(wd('rent').data)[0][1]);await chip(h,day);
   await exerciseStep(h,'rent','time');
   const time=await page.evaluate(()=>SCRIPTS.rent.find(s=>s.id==='time').chips(wd('rent').data)[0][1]);await chip(h,time);
   await exerciseStep(h,'rent','visit');
   const before=await snapshot(page);await chip(h,'!go');
   check((await snapshot(page)).credits===before.credits&&await page.locator('#chatB [data-paygo]').last().isVisible(),
    'Visit quote requires explicit payment');
   await act('confirm visit payment',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(250)});
   check((await snapshot(page)).credits===before.credits-20,'Visit debits exactly 20 tokens');
   await exerciseStep(h,'rent','vform');await chip(h,'!add');
   await exerciseStep(h,'rent','vadd');await send('بررسی فشار آب');await send('تمام');
   // The visit checklist is a loop with an explicit completion choice.
   if(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='vform'))await chip(h,'!nx');
   await exerciseStep(h,'rent','ctr0');await chip(h,'!open');await registerContract(h,'rent');
   check(await page.evaluate(()=>wd('rent').data.vlist.some(x=>x.t==='بررسی فشار آب')&&wd('rent').data.signed&&S.tokens===420),
    'Selected visit and internal contract independently complete with the actual custom checklist');
   await act('reload registered rental contract',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(()=>wd('rent').data.signed&&S.tokens===420&&S.contracts.length===1),
    'Contract identity and exact balance persist',['success','empty-data','cancel','resume']);
  },rentalRows.map(x=>'step:rent:'+x));

  const terminationRows=['termq','treason','tdate','tmin','totp','tai','tpay'];
  await test('PA-TERMINATION-SETTLEMENT',async h=>{
   const {page,send,check,act}=h;
   // Existing signed agreements are fixture data; every operation is through UI.
   const fixture=await page.evaluate(()=>{
    const w=wfNew('rent');w.data={signed:true,code:'AUDIT-TARGET',B:{depB:1e10,rentB:0},ctr:{finalized:true}};
    const other=wfNew('rent');other.data={signed:true,code:'AUDIT-OTHER',B:{depB:2e10,rentB:1e8}};
    S.contracts=[{code:'AUDIT-TARGET',kind:'rent',status:'signed_internal',wfId:w.id,title:'قرارداد هدف'},
     {code:'AUDIT-OTHER',kind:'rent',status:'signed_internal',wfId:other.id,title:'قرارداد نامرتبط'}];save();
    return {id:w.id,other:JSON.stringify(other),contract:JSON.stringify(S.contracts[1])};
   });
   await send(await page.evaluate(()=>E30.guide.actions.termination.prompt));
   check(await page.locator('#chatB [data-cba="e31TermStart"]').count()===2&&await page.evaluate(()=>!CE.f),
    'Multiple agreements require explicit target selection');
   await act('select only target agreement',()=>page.locator('#chatB [data-cba="e31TermStart"][data-code="AUDIT-TARGET"]').click());
   await exerciseStep(h,'rent','termq');await chip(h,'!go');
   await exerciseStep(h,'rent','treason');await send('توافق');
   await exerciseStep(h,'rent','tdate');await send('۳۰ روز دیگر');
   await exerciseStep(h,'rent','tmin');await chip(h,'!send');
   await exerciseStep(h,'rent','totp');await send('هنوز دریافت نکردم');
   check(await page.evaluate(()=>!wd('rent').data.term.ok&&SCRIPTS[CE.f]?.[CE.i]?.id==='totp'),
    'Unconfirmed counterparty cannot authorize settlement');
   await chip(h,'confirmed');await exerciseStep(h,'rent','tai');await chip(h,'!skip');await chip(h,'!pay');
   await exerciseStep(h,'rent','tpay');
   check(await page.evaluate(()=>!wd('rent').data.term.paid),'Viewing settlement does not pay');
   await chip(h,'!pay');
   check(await page.evaluate(({id,other,contract})=>wfOf(id).done&&wfOf(id).data.term.paid&&
    S.contracts[0].status==='terminated'&&JSON.stringify(wfOf(JSON.parse(other).id))===other&&JSON.stringify(S.contracts[1])===contract,fixture),
    'Explicit settlement terminates only selected agreement and preserves unrelated workflow');
   await act('reload settled agreement',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(()=>S.contracts[0].status==='terminated'&&S.tokens===500),
    'Settlement state persists without invented monetary transfer',['success','empty-data','cancel','resume']);
  },terminationRows.map(x=>'step:rent:'+x).concat(['scenario:termination']));

  const purchaseRows=['hoods','mk','liq','list','lgsc','lg','buy_ctr','escA','escN','escP','escC','ut'];
  for(const staged of [false,true])await test('PA-PURCHASE-'+(staged?'STAGED':'SINGLE'),async h=>{
   const {page,send,check,act}=h;
   await page.evaluate(()=>{S.tokens=1000;save();renderTok()});await beginService(h,'buy');
   await exerciseStep(h,'buy','hoods');await send('نارمک');
   await exerciseStep(h,'buy','mk');await chip(h,'ok');
   await exerciseStep(h,'buy','liq');await chip(h,'skip');
   await exerciseStep(h,'buy','list');
   await act('select matched purchase card',()=>page.locator('#chatB [data-cba="selB"]').last().click());await chip(h,'!skp');
   await exerciseStep(h,'buy','lgsc');await chip(h,'ok');
   await exerciseStep(h,'buy','lg');await chip(h,'!lg');
   await act('confirm legal report payment',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(250)});
   check(await page.evaluate(()=>!!wd('buy').data.legal&&S.tokens===900),'Actual legal report costs exactly 100 tokens');
   await chip(h,'!nx');await exerciseStep(h,'buy','buy_ctr');await chip(h,'!continue');
   check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='buy_ctr'&&!wd('buy').data.signed),'Missing signed contract blocks escrow');
   await chip(h,'!open');await registerContract(h,'buy');await chip(h,'!continue');
   await exerciseStep(h,'buy','escA');await chip(h,staged?'yes':'no');
   if(staged){
    await exerciseStep(h,'buy','escN');await send('۳');await exerciseStep(h,'buy','escP');
    await send('۲۰-۲۰-۲۰');check(await page.evaluate(()=>SCRIPTS[CE.f]?.[CE.i]?.id==='escP'&&!wd('buy').data.pay.ok),
     'Non-100 percentages cannot authorize escrow');await chip(h,'eq');
   }else{await exerciseStep(h,'buy','esc1');await chip(h,'!ok1')}
   await exerciseStep(h,'buy','escC');
   const n=staged?3:1;
   for(let i=0;i<n;i++){
    const before=await snapshot(page);await chip(h,'!ok');
    if(i===0){
     check((await snapshot(page)).credits===before.credits,'First escrow stage requires explicit tariff confirmation');
     await act('confirm escrow service tariff',async()=>{await page.locator('#chatB [data-paygo]').last().click();await page.waitForTimeout(250)});
     check((await snapshot(page)).credits===before.credits-150,'Escrow tariff is charged exactly once');
    }else check((await snapshot(page)).credits===before.credits,'Later explicit stage releases do not duplicate the service tariff');
    check(await page.evaluate(i=>wd('buy').data.escD===i+1,i),'Exactly one escrow stage advances');
   }
   await chip(h,'!done');await exerciseStep(h,'buy','ut');await chip(h,'!all');
   const end=await page.evaluate(()=>({id:wd('buy').id,data:JSON.stringify(wd('buy').data),credits:S.tokens,done:wd('buy').done}));
   check(end.done&&await page.evaluate(()=>wd('buy').data.ut.every(Boolean)&&wd('buy').data.ctr.finalized),
    'Delivery independently completes after all selected escrow stages');
   await act('reload delivered purchase',()=>page.reload({waitUntil:'domcontentloaded'}));
   check(await page.evaluate(end=>wfOf(end.id).done&&JSON.stringify(wfOf(end.id).data)===end.data&&S.tokens===end.credits,end),
    'Purchase terms, stages and delivery persist',['success','empty-data','cancel','resume']);
  },(staged?purchaseRows:purchaseRows.filter(x=>!['escN','escP'].includes(x)).concat(['esc1'])).map(x=>'step:buy:'+x));

  for(const legacy of [{"flow":"invb","id":"prjs"},{"flow":"invb","id":"scn"},{"flow":"invb","id":"cap"},{"flow":"invb","id":"yld"},{"flow":"invb","id":"price"},{"flow":"invb","id":"pay"},{"flow":"invb","id":"trk"},{"flow":"invr","id":"props"},{"flow":"invr","id":"cap"},{"flow":"invr","id":"cmp"},{"flow":"invr","id":"fund"},{"flow":"invr","id":"pay"},{"flow":"invr","id":"end"}]){
   await test('PA-RETIRED-'+legacy.flow+'-'+legacy.id,async({page,check,act,send})=>{
    const before=await snapshot(page);
    function absent(row){return page.evaluate(({flow,id})=>({
     script:!!SCRIPTS[flow],step:!!SCRIPTS[flow]?.some(x=>x.id===id),
     suggestion:E30.guide.registry.some(r=>r.action==='flow:'+flow),
     button:!!document.querySelector('[data-cv="F:'+flow+'"]'),
     active:CE.f===flow
    }),row)}
    let state=await absent(legacy);
    check(!state.script&&!state.step&&!state.suggestion&&!state.button&&!state.active,'Retired step is absent from runtime scripts, visible entry and guide registry');
    await send('F:'+legacy.flow);
    state=await absent(legacy);
    check(!state.active&&!state.script,'Legacy command cannot enter retired workflow');
    await act('reload after legacy route request',async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(200)});
    state=await absent(legacy);
    check(!state.active&&!state.script&&!state.step&&!state.suggestion&&!state.button,
      'Retired route remains unavailable after reload',['route-absent']);
    const after=await snapshot(page);check(after.credits===before.credits&&after.requests===before.requests,
      'Legacy request does not charge or create an operation');
   },['step:'+legacy.flow+':'+legacy.id]);
  }
  // Contexts have independent localStorage and workflows. Bound parallelism
  // keeps every assertion while avoiding a serial wait per isolated journey.
  const workers=Math.max(1,Math.min(4,Number(process.env.QA_AUDIT_WORKERS)||4));
  await Promise.all(Array.from({length:workers},async()=>{while(pending.length)await pending.shift()()}));
 }catch(error){
  report.tests.push({id:'PA-RB-HARNESS',result:'FAIL',surface:'browser-ui',covers,phases:[],assertions:[],trace:[],error:String(error.stack||error)});
  console.error(error);
 }finally{write();if(browser)await browser.close()}
 const failed=report.tests.filter(x=>x.result!=='PASS');
 for(const entry of failed)console.error('AUDIT FAILURE '+JSON.stringify({id:entry.id,error:entry.error,lastTrace:entry.trace.at(-1),failedAssertions:entry.assertions.filter(a=>!a.pass)}));
 console.log('PRIORITY AUDIT: '+(report.tests.length-failed.length)+' passed, '+failed.length+' failed');
 if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=2});
