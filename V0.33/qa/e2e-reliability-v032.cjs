'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
 try{
 const ctx=await browser.newContext(),page=await ctx.newPage();
 await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.32.html');await page.waitForFunction(()=>window.__BOOTED===true&&stateWriterReady);
 const second=await ctx.newPage();await second.goto(process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.32.html');await second.waitForFunction(()=>window.__BOOTED===true);await second.waitForTimeout(100);
 const blocked=await second.evaluate(()=>{S.tokens=999;return save()});assert.equal(blocked,false);await second.close();console.log('PASS second tab cannot obtain writer ownership');
 const refs=await page.evaluate(()=>{const before=[cr,openModal,ACT.cdoc,CBACT.savL];E30.init();E30.uxInit();return before.every((fn,i)=>fn===[cr,openModal,ACT.cdoc,CBACT.savL][i])});assert.equal(refs,true);console.log('PASS repeated init preserves handler identity');
 const registry=await page.evaluate(()=>({declared:E30.paidActionRegistry.slice().sort(),guarded:E30.legacyPayGuarded.slice().sort()}));assert.deepEqual(registry.declared,registry.guarded);assert.equal(registry.declared.length,13);console.log('PASS 13 explicit paid actions remain guarded');
 await page.evaluate(()=>{const b=document.createElement('button');b.id='return-focus';document.body.appendChild(b);b.focus();openModal('<h3>آزمون</h3><button id="first">اول</button><button id="last">آخر</button>')});
 await page.waitForTimeout(50);await page.locator('#last').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'first');
 await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'last');
 assert.equal(await page.locator('.modal').getAttribute('role'),'dialog');assert.equal(await page.locator('.modal').getAttribute('aria-labelledby'),'mahalino-modal-title');
 await page.evaluate(()=>openModal('<h3>جایگزین</h3><button>بستن</button>'));await page.waitForTimeout(50);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'return-focus');console.log('PASS modal focus trap, name, Escape and focus return');
 const safe=await page.evaluate(()=>{
 const payload='<b>keep</b><table><tr><td>cell</td></tr></table><img src="javascript:alert(1)" onerror="window.bad=1"><iframe srcdoc="bad"></iframe><svg><animate attributeName="href" values="javascript:alert(1)"></animate><path d="M0 0"></path></svg><a href="java&#10;script:alert(1)" data-act="resetOk">link</a><script>window.bad=1</script>';
 const html=E29.safeSharedHTML(payload),template=document.createElement('template');template.innerHTML=html;
 return {html,bold:template.content.querySelector('b')?.textContent,cell:template.content.querySelector('td')?.textContent,bad:!!template.content.querySelector('script,iframe,animate,[onerror],[data-act],[href^="javascript"],[src^="javascript"]')};
 });assert.equal(safe.bold,'keep');assert.equal(safe.cell,'cell');assert.equal(safe.bad,false);console.log('PASS stored sharing HTML drops executable content and retains formatting');
 const privacy=await page.evaluate(()=>{window.dispatchEvent(new Event('unhandledrejection'));return MahalinoDiagnostics.events.slice(-1)[0]});assert.equal(privacy.code,'promise.unhandled');assert.deepEqual(Object.keys(privacy).sort(),['at','cause','code','kind']);console.log('PASS Promise diagnostics contain only code and time');
 const debit=await page.evaluate(()=>{S.tokens=100;S.log=[];save();let called=0;S.paySession={payId:'test',key:'visit',cost:E30.price('visit'),title:'QA',state:'presented',_cb:()=>{called++}};const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota')};try{return {ok:E30.pay.go('test'),called,tokens:S.tokens}}finally{Storage.prototype.setItem=original}});assert.equal(debit.ok,false);assert.equal(debit.called,0);assert.equal(debit.tokens,100);console.log('PASS real storage failure blocks callback');
 await ctx.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
