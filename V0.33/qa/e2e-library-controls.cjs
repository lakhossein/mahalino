'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=process.env.QA_BASE_URL||pathToFileURL(path.join(__dirname,'..','Mahalino+V0.32.html')).href;
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined});
  try{
    const page=await browser.newPage({viewport:{width:1300,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.evaluate(()=>doLogin('QA'));
    await page.locator('#side [data-act="e30AccountMenu"]').click();
    assert.equal(await page.locator('.e30-account-menu [data-act="e29shManage"],.e30-account-menu [data-act="themeToggle"]').count(),0);
    await page.locator('.e30-account-menu [data-tab="settings"]').click();
    await page.locator('[data-act="themeSet"][data-v="dark"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('data-theme')),'dark');
    await page.locator('[data-act="themeSet"][data-v="light"]').click();
    await page.evaluate(()=>{
      S.library=[];S.shares=[];S.savedListings=[];S.notifs=[];
      for(const type of ['contract','hood_analysis','valuation','invest','ai_process','other','wf_progress']){
        E29.libAPI.saveArtifact({type,title:'QA '+type,summary:'QA artifact',artifact:type==='wf_progress'?{m:'rent',step:2,data:{}}:{data:{test:'Report value'}},txnId:'qa-'+type});
      }
      S.savedListings.push({id:'qa-sv',title:'QA property',kind:'rent',kindFa:'rent',hood:'test',seed:'test',savedAt:Date.now()});save();
      window.print=()=>{window.qaPrinted=document.getElementById('print-root').textContent};
    });
    await page.locator('#side [data-act="e29panelLib"]').click();
    const panel=page.locator('#e29-panel'),search=panel.locator('#e29-lsq'),modal=page.locator('#modal-root .modal');
    const centered=async()=>{await page.waitForFunction(()=>{const b=document.getElementById('e29-lsq').getBoundingClientRect();return Math.abs(b.x+b.width/2-innerWidth/2)<2})};
    await centered();
    await search.fill('hood_analysis');assert.equal(await panel.locator('.e29-card').count(),1);
    await search.fill('');assert.equal(await panel.locator('.e29-card').count(),7);
    const card=title=>panel.locator('.e29-card').filter({hasText:'QA '+title});
    for(const type of ['contract','hood_analysis','valuation','invest','ai_process','other','wf_progress']){
      await card(type).locator('.ttl').click();
      assert.match(await panel.locator('#e29-lbody > .e29-phead').innerText(),new RegExp('QA '+type));
      await panel.locator('[data-act="e29libBack"]').click();
      await card(type).locator('[data-act="e29libMenu"]').click();
      await modal.locator('[data-act="e29libRename"]').click();
      await modal.locator('#e29-rn').fill('QA '+type);
      await modal.locator('[data-act="e29libRenameGo"]').click();
      await card(type).locator('[data-act="e29libShare"]').click();
      await modal.locator('[data-act="e29shGo"]').click();
      await modal.locator('[data-act="closeModal"]').click();
    }
    await card('hood_analysis').locator('[data-act="e29libMenu"]').click();
    await modal.locator('[data-act="e29libDoc"]').click();
    await page.waitForFunction(()=>window.qaPrinted?.includes('Report value'));
    await modal.locator('[data-act="closeModal"]').click();
    await panel.locator('[data-act="e29shManage"]').click();
    assert.equal(await modal.locator('[data-act="e29shRevoke"]').count(),7);
    assert.equal(await modal.locator('a[href*="#s/"]').count(),7);
    await modal.locator('[data-act="e29shRevoke"]').first().click();
    assert.equal(await modal.locator('a[href*="#s/"]').count(),6);
    await page.keyboard.press('Escape');
    await panel.locator('[data-act="e30svTab"]').click();
    await panel.locator('[data-act="e30svOpen"]').click();
    assert.match(await modal.innerText(),/QA property/);
    await page.keyboard.press('Escape');
    await panel.locator('[data-act="e30svDel"]').click();assert.equal(await panel.locator('.e30-svcard').count(),0);
    await page.setViewportSize({width:390,height:844});await centered();
    await panel.locator('[data-act="e29libTab"][data-tab="all"]').click();
    await card('valuation').locator('[data-act="e29libMenu"]').click();
    await modal.locator('[data-act="e29libRename"]').click();
    await modal.locator('#e29-rn').fill('QA mobile valuation');
    await modal.locator('[data-act="e29libRenameGo"]').click();
    await card('mobile valuation').locator('[data-act="e29libShare"]').click();
    await modal.locator('[data-act="e29shGo"]').click();
    await modal.locator('[data-act="closeModal"]').click();
    await card('mobile valuation').locator('.ttl').click();
    assert.match(await panel.locator('#e29-lbody > .e29-phead').innerText(),/QA mobile valuation/);
    await panel.locator('[data-act="e29libBack"]').click();
    await panel.locator('[data-act="e29panelClose"]').click();
    await page.setViewportSize({width:1300,height:900});
    await page.locator('#side [data-act="e29panelNotif"]').click();
    assert.equal(await page.locator('#e29-panel .e29-filters').count(),0);
    await page.locator('#e29-panel [data-cat="financial"]').click();
    assert.equal(await page.locator('#e29-panel [data-cat="financial"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#e29-panel [data-cat="all"]').getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('#e29-nlist .e29-notif').count(),0);
    await page.locator('#e29-panel [data-act="e29panelClose"]').click();
    await page.evaluate(()=>{
      const untouched=wfNew('rent');untouched.data={qaUnrelated:'keep this'};untouched.step=4;
      window.qaUntouchedId=untouched.id;
      const snapshot=E29.libAPI.store().find(x=>x.type==='wf_progress');
      snapshot.workflowId='stale-id';snapshot.artifact={m:'rent',step:2,data:{qaSnapshot:'restore this'},done:false};
      save();
    });
    await page.locator('#side [data-act="e29panelLib"]').click();
    await card('wf_progress').locator('.ttl').click();
    await panel.locator('[data-act="e29libResume"]').click();
    const restored=await page.evaluate(()=>{
      const prior=wfOf(window.qaUntouchedId),item=E29.libAPI.store().find(x=>x.type==='wf_progress'),w=wfOf(item.workflowId);
      return {unrelated:prior.data.qaUnrelated,priorStep:prior.step,distinct:w.id!==prior.id,snapshot:w.data.qaSnapshot,step:w.step,active:S.active.rent===w.id,current:CURRENT,service:CE.f,ceStep:CE.i};
    });
    assert.deepEqual(restored,{unrelated:'keep this',priorStep:4,distinct:true,snapshot:'restore this',step:2,active:true,current:'landing',service:'rent',ceStep:1});
    assert.deepEqual(errors,[]);
    console.log('PASS Library controls desktop/mobile, Settings theme and notification tabs');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
