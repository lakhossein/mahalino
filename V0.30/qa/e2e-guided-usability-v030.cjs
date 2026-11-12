/* Real Chromium checks for the November V0.30 usability regression:
   compact account menu, full-screen Library, future-only reminders and
   combined budget choices from a natural-language rent request. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8730/Mahalino%2BV0.30.html';
const output=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const results=[];
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,
    args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  async function test(name,fn){
    const ctx=await browser.newContext({viewport:{width:1300,height:900}});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message)));
    try{
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>doLogin('QA'));
      await page.waitForTimeout(280);
      await fn(page);
      if(errors.length)throw Error('uncaught browser errors: '+errors.join('; '));
      console.log('PASS '+name);results.push({name,status:'PASS'});
    }catch(e){
      console.log('FAIL '+name+': '+String(e.stack||e).slice(0,2500));
      results.push({name,status:'FAIL',reason:String(e.stack||e)});
    }finally{await ctx.close()}
  }
  const assert=(condition,message)=>{if(!condition)throw Error(message)};
  const stamp=ts=>{const d=new Date(ts),p=n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())};
  try{
    await test('Compact sidebar has single account entry and distinct project/chat actions',async page=>{
      const state=await page.evaluate(()=>{
        const side=document.getElementById('side'),foot=side.querySelector('.e29-sbot');
        return {footerCount:foot.querySelectorAll('button').length,
          account:!!foot.querySelector('[data-act="e30AccountMenu"]'),
          wallet:!!foot.querySelector('[data-act="wallet"]'),
          share:!!foot.querySelector('[data-act="e29shManage"]'),
          project:side.querySelector('[data-act="e29prjNew"]')?.getAttribute('aria-label'),
          chat:side.querySelector('.e29-newbtn')?.getAttribute('aria-label'),
          right:side.getBoundingClientRect().right};
      });
      assert(state.footerCount===1&&state.account&&!state.wallet&&!state.share,'old account links are still exposed: '+JSON.stringify(state));
      assert(state.project==='ایجاد پروژهٔ جدید'&&state.chat==='ایجاد گفت‌وگوی جدید','project and chat are not distinguishable');
      assert(Math.abs(state.right-1300)<=2,'sidebar does not touch right viewport edge: '+state.right);
      await page.locator('[data-act="e30AccountMenu"]').click();
      assert(await page.locator('.e30-account-menu').count()===1,'account menu did not open');
      assert(await page.locator('.e30-account-menu [data-act="wallet"]').count()===1,'wallet was lost rather than moved');
      assert(await page.locator('.e30-account-menu [data-act="e29shManage"]').count()===1,'share manager was lost');
      await page.keyboard.press('Escape');
      assert(await page.locator('.e30-account-menu').count()===0,'Escape did not close account menu');
      await page.locator('#side [data-act="sideFold"]').click();
      assert(await page.evaluate(()=>document.body.classList.contains('sidefold')),'sidebar did not collapse');
      assert(!await page.locator('.e27-expand').isVisible().catch(()=>false),'duplicate open-sidebar button appears beside new chat');
    });
    await test('Library opens as full-page view with readable tab navigation',async page=>{
      await page.locator('#side [data-act="e29panelLib"]').click();
      await page.waitForTimeout(300);
      const state=await page.evaluate(()=>{
        const p=document.getElementById('e29-panel'),tabs=document.getElementById('e29-ltabs');
        return {fullscreen:p?.classList.contains('e30-library-fullscreen'),width:p?.getBoundingClientRect().width,
          tabWidth:tabs?.getBoundingClientRect().width,tabCount:tabs?.querySelectorAll('button').length};
      });
      assert(state.fullscreen&&state.width>=1298,'library is still a narrow slide-over: '+JSON.stringify(state));
      assert(state.tabWidth>650&&state.tabCount>=2,'tabs are clipped: '+JSON.stringify(state));
    });
    await test('Reminder date picker rejects past creation and past edits',async page=>{
      await page.locator('#side [data-act="e29panelRem"]').click();
      await page.locator('#e29-panel [data-act="e29remNew"]').click();
      const dt=page.locator('#e29-rd');
      assert(await dt.getAttribute('type')==='datetime-local','date/time picker not available');
      assert(Boolean(await dt.getAttribute('min')),'past days not disabled');
      await page.locator('#e29-rt').fill('کنترل زمان گذشته');
      await dt.fill(stamp(Date.now()-864e5));
      await page.locator('#modal-root [data-act="e29remNewGo"]').click();
      assert(await page.locator('#modal-root #e29-rd').count()===1,'past reminder should keep form open');
      assert(await page.evaluate(()=>(S.reminders||[]).every(x=>x.title!=='کنترل زمان گذشته')),'past reminder was saved');
      await dt.fill(stamp(Date.now()+7*864e5));
      await page.locator('#modal-root [data-act="e29remNewGo"]').click();
      const created=await page.evaluate(()=>(S.reminders||[]).find(x=>x.title==='کنترل زمان گذشته'));
      assert(created&&created.due>Date.now(),'future reminder not saved');
      await page.locator('#e29-panel [data-rem] [data-act="e30remEdit"]').first().click();
      const editor=page.locator('#re28-w');
      assert(await editor.getAttribute('type')==='datetime-local','edit date picker missing');
      await editor.fill(stamp(Date.now()-3*864e5));
      await page.locator('#modal-root [data-act="remEditOk28"]').click();
      assert(await page.locator('#re28-w').count()===1,'past edit should be rejected and remain editable');
      const after=await page.evaluate(id=>(S.reminders||[]).find(x=>x.id===id)?.due,created.id);
      assert(after===created.due,'past edit changed saved date');
    });
    await test('Free-form West Tehran rent request opens two-value budget card in chat',async page=>{
      const prompt='اجاره خانه در غرب تهران؛ کمک کن بر اساس بودجه بهترین گزینه را پیدا کنم.';
      await page.locator('#chatIn').fill(prompt);
      await page.locator('#chatSend').click();
      await page.waitForTimeout(450);
      const card=page.locator('#chatB .e30-budget-card').last();
      assert(await card.count()===1,'combined rent budget card not shown');
      const choices=await card.locator('input[type="radio"]:checked').count();
      assert(choices===0,'the budget UI silently selected user money');
      await card.locator('input[data-kind="dep"][value="۵۰۰ میلیون"]').check();
      await card.locator('input[data-kind="rent"][value="۲۰ میلیون"]').check();
      await card.locator('[data-cba="e30BudgetChoice"]').click();
      await page.waitForTimeout(450);
      const facts=await page.evaluate(()=>({dep:E30.discAPI.getF('budget_dep'),rent:E30.discAPI.getF('budget_rent'),
        active:E30.discAPI.active(),history:HIST.slice(-4).map(m=>m.h?.slice(0,130)||'')}));
      assert(facts.dep&&facts.rent,'the selected deposit and rent were not captured: '+JSON.stringify(facts));
      assert(facts.active,'the conversation collector unexpectedly closed');
    });
    await test('Generic rental opening offers scenario prompts instead of a mandatory form',async page=>{
      await page.locator('#chatIn').fill('دنبال خانه اجاره‌ای هستم');
      await page.locator('#chatSend').click();
      await page.waitForTimeout(300);
      const options=page.locator('#chatB [data-cba="e30ChooseScenario"]');
      assert(await options.count()===3,'guided opening lacks the expected 3 paths');
      await options.first().click();
      await page.waitForTimeout(250);
      assert(await page.locator('#chatB .e30-budget-card').count()===1,'budget-first scenario did not continue inside chat');
    });
    await test('Rent and purchase entry buttons start guided chat instead of the old step form',async page=>{
      await page.evaluate(()=>botC('<button type="button" data-cf="rent">اجاره</button>',null));
      await page.locator('#chatB [data-cf="rent"]').last().click();
      await page.waitForTimeout(200);
      assert(await page.locator('#chatB [data-cba="e30ChooseScenario"]').count()===3,
        'rent click did not offer three recommended scenarios');
      assert(await page.evaluate(()=>E30.discAPI.active()),'rent click did not start discovery');
      await page.evaluate(()=>{E30.discAPI.stop();botC('<button type="button" data-cf="buy">خرید</button>',null)});
      await page.locator('#chatB [data-cf="buy"]').last().click();
      await page.waitForTimeout(180);
      assert(await page.evaluate(()=>E30.discAPI.active()),'buy click did not start discovery');
      assert(await page.locator('#chatB [data-cba="e30ChooseScenario"]').count()===6,
        'purchase click did not add three tailored choices to chat');
    });
  }finally{await browser.close()}
  const pathOut=path.join(output,'guided-usability.json');
  fs.writeFileSync(pathOut,JSON.stringify(results,null,2));
  const failures=results.filter(x=>x.status!=='PASS');
  console.log('GUIDED USABILITY '+(results.length-failures.length)+'/'+results.length+' passed');
  if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
