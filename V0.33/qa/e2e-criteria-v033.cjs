'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=process.env.QA_BASE_URL||pathToFileURL(path.join(__dirname,'..','Mahalino+V0.33.html')).href;
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
    for(const flow of ['rent','buy'])for(const mode of ['continue','sample']){
      const page=await browser.newPage();await page.goto(base);await page.evaluate(()=>doLogin('QA'));
      const send=async text=>{await page.locator('#chatIn').fill(text);await page.locator('#chatSend').click();};
      await send(await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
      const item=await page.evaluate(f=>{
        const list=f==='rent'?RLIST:BLIST,x=list.find(x=>f==='buy'||(x.rent>0&&!list.some(y=>y.hood===x.hood&&y.rent===0)));
        const set=(k,v)=>E30.discAPI.setF(k,v,{src:'answer',hard:true});set('hood',x.hood);set('rooms',x.beds);
        const slot=f==='rent'?'budget_rent':'buy_budget';
        const parsed=E30.discAPI.answer(slot,'صفر تومان');return {x,slot,parsed};
      },flow);
      assert(item.parsed.ok,'explicit zero budget was rejected');
      assert.deepEqual(await page.evaluate(s=>E30.discAPI.getF(s).v,item.slot),[0,0]);
      if(mode==='continue'){await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته')}
      else await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
      await page.locator('#chatB [data-cba="e33EditCriteria"]').last().click();
      const row=page.locator('#chatB .e33-criteria-editor').last().locator('[data-criterion="'+item.slot+'"]');
      assert(/۰\s*تومان/.test(await row.textContent()),'zero shown as unspecified/open');
      await row.locator('input').fill(String((flow==='rent'?item.x.rent:item.x.m2*item.x.ppm)/10)+' تومان');await row.locator('button').click();
      assert.equal(await page.evaluate(()=>E30.discAPI.getF('hood')),item.x.hood);
      assert.equal(await page.evaluate(()=>E30.discAPI.getF('rooms')),item.x.beds);
      assert(await page.locator('#chatB .msg.bot').last().locator('.ccard,.pcard').count()>0,'zero budget edit did not rerun matches');
      console.log('PASS',flow,mode,'zero budget');await page.close();
    }
    for(const flow of ['rent','buy'])for(const mode of ['continue','sample'])for(const blocking of ['floor','amenity']){
      const page=await browser.newPage();await page.goto(base);await page.evaluate(()=>doLogin('QA'));
      const send=async text=>{await page.locator('#chatIn').fill(text);await page.locator('#chatSend').click();};
      await send(await page.evaluate(f=>E30.guide.actions[f].prompt,flow));
      const x=await page.evaluate(({flow,blocking})=>{
        const list=flow==='rent'?RLIST:BLIST;
        const x=blocking==='floor'?list[0]:list.find(x=>!x.park&&!list.some(y=>y.hood===x.hood&&y.park&&y.m2>=x.m2&&y.beds>=x.beds));
        if(!x)throw Error('no fixture with impossible parking');
        const set=(k,v)=>E30.discAPI.setF(k,v,{src:'answer',hard:true});set('hood',x.hood);set('m2',x.m2);set('rooms',x.beds);
        if(blocking==='floor')set('floor_preference',{min:99,max:99,level:'required'});else{set('prefs',['parking']);set('prefRules',{parking:'required'})}
        return x;
      },{flow,blocking});
      if(mode==='continue'){await send(await page.evaluate(()=>E30.guide.actions['start-service'].prompt));await send('درسته')}
      else await send(await page.evaluate(()=>E30.guide.actions.sample.prompt));
      await page.locator('#chatB [data-cba="e33EditCriteria"]').last().click();
      const row=page.locator('#chatB .e33-criteria-editor').last().locator('[data-criterion="'+(blocking==='floor'?'floor_preference':'amenity_parking')+'"]');
      if(blocking==='floor')await row.locator('input').fill('مهم نیست');else await row.locator('select').selectOption('irrelevant');
      await row.locator('button').click();
      assert.equal(await page.evaluate(()=>E30.discAPI.getF('hood')),x.hood);
      assert.equal(await page.evaluate(()=>E30.discAPI.getF('m2')),x.m2);
      assert.equal(await page.evaluate(()=>E30.discAPI.getF('rooms')),x.beds);
      assert(await page.locator('#chatB .msg.bot').last().locator('.ccard,.pcard').count()>0,'blocking criterion was not cleared');
      console.log('PASS',flow,mode,blocking);await page.close();
    }
    {
      const page=await browser.newPage();await page.goto(base);await page.evaluate(()=>doLogin('QA'));
      await page.evaluate(()=>{
        E30.discAPI.stop();ceStart('buy',true);const D=wd('buy').data;defP(D);defPR(D);
        D.hood=BLIST[0].hood;D.PR.m2=[1,2];D.PR.age=[0,100];D.PR.beds=0;D.PR.ppm=[0,Number.MAX_SAFE_INTEGER];D.PR.floorR=[-100,200];
        ceJump('list');
      });
      await page.locator('#chatB [data-cba="e33EditCriteria"]').last().click();
      const row=page.locator('#chatB .e33-criteria-editor').last().locator('[data-criterion="m2"]');
      await row.locator('input').fill('مهم نیست');await row.locator('button').click();
      assert.deepEqual(await page.evaluate(()=>wd('buy').data.PR.m2),[0,100000]);
      assert(await page.locator('#chatB .msg.bot').last().locator('.ccard,.pcard').count()>0);
      console.log('PASS legacy buy full size range removal');await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
