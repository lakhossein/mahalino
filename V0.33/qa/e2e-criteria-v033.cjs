'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=process.env.QA_BASE_URL||pathToFileURL(path.join(__dirname,'..','Mahalino+V0.32.html')).href;
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const flow of ['rent','buy']){
      for(const mode of ['continue','sample']){
        const page=await browser.newPage();
        await page.goto(base);await page.evaluate(()=>doLogin('QA'));
        const send=async text=>{await page.locator('#chatIn').fill(text);await page.locator('#chatSend').click();};
        await send(await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
        const candidate=await page.evaluate(f=>(f==='rent'?RLIST:BLIST)[0],flow);
        await page.evaluate(({candidate,flow})=>{const set=(k,v)=>E30.discAPI.setF(k,v,{src:'answer',hard:true});set('hood',candidate.hood);set('rooms',candidate.beds);set('m2',999);}, {candidate,flow});
        const before=await page.evaluate(()=>HIST.length);
        if(mode==='continue'){
          await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته');
          assert.equal(await page.evaluate(()=>SCRIPTS[CE.f][CE.i].id),'list');
          assert.equal(await page.evaluate(n=>HIST.slice(n).filter(m=>m.r==='bot'&&/data-sl=|type="range"/.test(m.h)).length,before),0);
        }else await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
        await page.locator('#chatB [data-cba="e33EditCriteria"]').last().click();
        const row=page.locator('#chatB .e33-criteria-editor').last().locator('[data-criterion="m2"]');
        await row.locator('input').fill(String(candidate.m2));
        await row.locator('button').click();
        assert.equal(await page.evaluate(()=>E30.discAPI.getF('hood')),candidate.hood);
        assert.equal(await page.evaluate(()=>E30.discAPI.getF('rooms')),candidate.beds);
        assert.equal(await page.evaluate(()=>E30.discAPI.getF('m2')),candidate.m2);
        assert(await page.locator('#chatB .msg.bot').last().locator('.ccard,.pcard').count()>0,'edit did not rerun matches');
        console.log('PASS',flow,mode);await page.close();
      }
    }
    for(const flow of ['rent','buy']){
      const page=await browser.newPage();await page.goto(base);await page.evaluate(()=>doLogin('QA'));
      const send=async text=>{await page.locator('#chatIn').fill(text);await page.locator('#chatSend').click();};
      await send(await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
      await page.evaluate(f=>{
        const set=(k,v)=>E30.discAPI.setF(k,{v:[v,v]},{src:'answer',hard:true});
        const x=(f==='rent'?RLIST:BLIST)[0];
        if(f==='rent'){set('budget_dep',x.dep);set('budget_rent',x.rent)}else set('buy_budget',x.m2*x.ppm);
      },flow);
      const before=await page.evaluate(()=>HIST.length);
      await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته');
      assert.equal(await page.evaluate(()=>SCRIPTS[CE.f][CE.i].id),'list');
      assert.equal(await page.evaluate(n=>HIST.slice(n).filter(m=>m.r==='bot'&&/data-sl=|type="range"/.test(m.h)).length,before),0);
      assert(await page.locator('#chatB .msg.bot').last().locator('.ccard,.pcard').count()>0,'known budget and unspecified area did not show matching results');
      console.log('PASS',flow,'known budget');await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
