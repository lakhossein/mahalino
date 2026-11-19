'use strict';
const { chromium }=require('playwright');
const { pathToFileURL }=require('node:url');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const artifact=['Mahalino+V0.33.html','Mahalino+V0.32.html'].map(n=>path.join(__dirname,'..',n)).find(p=>fs.existsSync(p));
const base=process.env.QA_BASE_URL||pathToFileURL(artifact).href;
(async()=>{
  const browser=await chromium.launch({headless:true});
  async function open(){
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    page.on('pageerror',e=>{throw e});
    await page.route('https://**',r=>r.abort());
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{APH_PHONE='09120000000';doLogin('QA')});return page;
  }
  const service=(page,id)=>page.locator('#chatB [data-cba="e33Service"][data-service="'+id+'"]').last();
  const latest=page=>page.locator('#chatB .msg.bot').last();
  const send=async(page,id)=>{
    const prompt=await page.evaluate(id=>E30.guide.actions[id].prompt,id);
    await page.locator('#chatIn').fill(prompt);await page.locator('#chatIn').press('Enter');
  };
  try{
    // All directory buttons are exercised in an independent fresh user session.
    const classifications={
      rent:'discovery',buy:'discovery',sell:'discovery',landlord:'discovery',invest:'discovery',
      neighborhood:'report',valuation:'form','contract-start':'contract','contract-buy':'contract',
      contracts:'prerequisite',termination:'prerequisite',visit:'draft',legal:'draft',escrow:'draft',
      services:'form',guaranteed:'form',stay:'flow',development:'catalog',build:'project prerequisite',
      map:'map',reminder:'reminder'
    };
    for(const [id,kind] of Object.entries(classifications)){
      const page=await open();await service(page,id).click();assert.equal(await page.evaluate(()=>CURRENT),'landing',id);
      const info=await page.evaluate(()=>({active:E30.discAPI.active(),flow:CE.f,req:(S.reqs||[]).length,html:HIST[HIST.length-1].h}));
      if(kind==='discovery')assert.ok(info.active,id);
      if(kind==='contract')assert.ok(await page.locator('#chatB [data-e28ctr] #cl-name').last().isVisible(),id);
      if(kind==='draft')assert.ok(await latest(page).locator('[data-cba="e33SaveDraft"]').isVisible(),id);
      if(kind==='catalog'||kind==='project prerequisite')assert.ok(await latest(page).locator('[data-cba="e31ProjectEmployer"]').first().isVisible(),id);
      if(kind==='flow')assert.equal(info.flow,'stay',id);
      if(kind==='prerequisite')assert.match(info.html,/قرارداد/,id);
      if(kind==='form')assert.ok(await latest(page).locator('input,textarea,select').count()>0,id);
      if(kind==='report')assert.match(info.html,/مقایسه/,id);
      if(kind==='map')assert.match(info.html,/نقشه/,id);
      if(kind==='reminder')assert.match(info.html,/یادآور/,id);
      console.log('PASS '+id+': '+kind);await page.close();
    }
    const page=await open();
    await page.evaluate(()=>go('profile'));
    await page.locator('#v-profile [data-act="newRequest"]').first().click();
    assert.equal(await page.evaluate(()=>CURRENT),'landing');
    await service(page,'contract-start').click();
    const w=await page.evaluate(()=>({id:wd('rent').id,standalone:wd('rent').data.standaloneContract,listing:wd('rent').data.listing,ce:CE.f}));
    assert.ok(w.standalone);assert.equal(w.listing,undefined);assert.equal(w.ce,null);
    await page.locator('#cl-name').fill('Test Tenant');await page.locator('#cl-id').fill('1234567891');
    await page.locator('#co-name').fill('Test Owner');await page.locator('#co-id').fill('9876543210');await page.locator('#co-mobile').fill('09123334455');
    await page.locator('#chatB [data-act="cpartySave"]').last().click();
    await page.locator('#cp-title').fill('Standalone apartment');await page.locator('#cp-postal').fill('1234567890');await page.locator('#cp-addr').fill('Test address');await page.locator('#cp-area').fill('70');
    await page.locator('#cp-start').fill(new Date(Date.now()+864e5).toISOString().slice(0,10));await page.locator('#cp-dep').fill('1000000000');await page.locator('#cp-rent').fill('0');
    await page.locator('#chatB [data-act="cpropSave"]').last().click();
    await page.locator('label.switch:has(#ca-me)').click();await page.locator('label.switch:has(#ca-owner)').click();
    await page.locator('#chatB [data-act="capprove"]').last().click();
    await page.locator('#chatB [data-act="cfinalize"]').last().click();
    await page.locator('[data-paygo]').last().click();
    await page.waitForFunction(()=>S.contracts.some(c=>c.doc?.property?.title==='Standalone apartment'));
    assert.equal(await page.evaluate(()=>CURRENT),'landing');
    assert.equal(await page.evaluate(()=>wd('rent').data.listing),undefined);
    assert.equal(await page.evaluate(()=>S.contracts.find(c=>c.wfId===wd('rent').id).status),'signed_internal');
    await send(page,'contract-buy');
    const buyId=await page.evaluate(()=>wd('buy').id);
    await page.locator('#cl-name').fill('Preserved buyer');
    // Explicit typed service switches use the same route as directory selection.
    await send(page,'rent');
    const searchId=await page.evaluate(()=>wd('rent').id);assert.notEqual(searchId,w.id);
    await send(page,'rent');assert.notEqual(await page.evaluate(()=>wd('rent').id),searchId);
    await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>go('landing'));
    await page.locator('#chatB [data-act="resume"][data-wf="'+buyId+'"]').last().click();
    assert.equal(await page.locator('#cl-name').inputValue(),'Preserved buyer');
    await page.evaluate(()=>ACT.newRequest());
    // Fresh build entry offers actual project selection; no automatic approval.
    await service(page,'build').click();
    await page.locator('#chatB [data-cba="e31ProjectEmployer"]').last().click();
    assert.ok(await latest(page).locator('[data-cba="e31ProjectChoose"]').count());
    assert.equal(await page.evaluate(()=>!!wd('mkt').data.chosen),false);
    // Listing card clicks render independent, scoped inline tours and offline fallback.
    await page.evaluate(()=>botC(chatListCard(RLIST.find(x=>x.beds===1),false)+chatBCard(BLIST.find(x=>x.beds===3),false),null));
    const triggers=page.locator('#chatB .pcard [data-act="vtour"]');
    await triggers.nth(0).click();const tours=page.locator('#chatB .e33-tour-card');
    const first=tours.nth(0);assert.equal(await first.locator('[data-act="e33TourRoom"][data-room^="bed"]').count(),1);
    await first.locator('[data-act="e33TourRoom"][data-room="bed1"]').click();
    await first.locator('[data-tour-angle]').evaluate(el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}))});
    const src1=await first.locator('[data-tour-picture]').getAttribute('src');
    await triggers.nth(1).click();const second=tours.nth(1);assert.equal(await second.locator('[data-act="e33TourRoom"][data-room^="bed"]').count(),3);
    await second.locator('[data-act="e33TourRoom"][data-room="bed3"]').click();
    await second.locator('[data-tour-angle]').evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.equal(await first.getAttribute('data-rotation'),'50');assert.equal(await second.getAttribute('data-rotation'),'20');
    assert.notEqual(await second.locator('[data-tour-picture]').getAttribute('src'),src1);
    await triggers.nth(0).click();assert.equal(await tours.nth(2).getAttribute('data-rotation'),'0');
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('#chatB [data-tour-picture]')).every(i=>i.complete&&i.naturalWidth>0));
    assert.equal(await page.locator('#modal-root.on').count(),0);
    assert.equal(await page.evaluate(()=>CURRENT),'landing');assert.equal(await tours.count(),3);
    console.log('PASS standalone contract, typed switching/reload, build prerequisite, scoped offline tours');await page.close();
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
