/* First §7/§8 browser evidence slice: combined rental budget through search.
   All inputs use the visible composer/buttons. evaluate() only observes state. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
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
  async function test(id,fn){
   const entry={id,result:'FAIL',surface:'browser-ui',covers,phases:[],assertions:[],trace:[]};
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
    const panel=page.locator('#chatB .e31-results').last();
    check(await panel.isVisible(),'Search renders an in-chat terminal result');
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
   await send(await page.evaluate(()=>E30.guide.actions.rent.prompt));await prompt('rent-budget');
   await send('ودیعه تا ۱ تومان و اجاره ماهانه تا ۱ تومان');
   await confirmBudget(10,10);
   const found=await result();
   check(found.ids.length===0&&await found.panel.locator('.pcard').count()===0&&found.state.lastText.includes('آگهی منطبق پیدا نشد'),
    'Infeasible explicit caps produce honest zero results without substituted properties',['empty-data','service-terminal']);
   check(found.state.deposit.v[1]===10&&found.state.rent.v[1]===10,'Empty result preserves both explicit constraints');
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
 }catch(error){
  report.tests.push({id:'PA-RB-HARNESS',result:'FAIL',surface:'browser-ui',covers,phases:[],assertions:[],trace:[],error:String(error.stack||error)});
  console.error(error);
 }finally{write();if(browser)await browser.close()}
 const failed=report.tests.filter(x=>x.result!=='PASS');
 console.log('PRIORITY AUDIT BUDGET: '+(report.tests.length-failed.length)+' passed, '+failed.length+' failed');
 if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=2});
