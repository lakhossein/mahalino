/* Cross-viewport, resource, arithmetic, and payment regressions on the real V0.30 HTML. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const url=process.env.QA_BASE_URL||'http://127.0.0.1:8730/Mahalino%2BV0.30.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const tests=[],errors=[],consoleErrors=[],badRequests=[];
const assert=(name,pass,data)=>{tests.push({name,pass:Boolean(pass),data});console.log(`${pass?'PASS':'FAIL'} ${name}: ${JSON.stringify(data||'').slice(0,400)}`)};
async function run(name,cb){
  try{const v=await cb();assert(name,v.ok,v.data)}
  catch(e){assert(name,false,{error:String(e.stack||e)})}
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  try{
    const ctx=await b.newContext({viewport:{width:1280,height:800}});
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
    page.on('response',r=>{if(r.status()>=400)badRequests.push({status:r.status(),url:r.url()})});
    page.on('requestfailed',r=>badRequests.push({failure:r.failure(),url:r.url()}));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(800);

    await run('R01 | Full app booted as E30 V0.30',async()=>{
      const v=await page.evaluate(()=>({boot:window.__BOOTED,version:window.E30&&E30.VER}));
      return {ok:v.boot===true&&v.version==='0.30',data:v};
    });
    await run('R02 | Toman range normalized to rials',async()=>{
      const v=await page.evaluate(()=>parseMoneyRangeFA('۴۰۰ تا ۵۵۰ میلیون تومان'));
      return {ok:v&&v.ok&&v.value==='4000000000|5500000000',data:v};
    });
    await run('R03 | Explicit low-floor rental rejects floor 6',async()=>{
      const v=await page.evaluate(()=>E30.flowsAPI.rentPass(
        {beds:2,elev:true,park:true,floor:6,m2:90,rent:100000000,dep:500000000},
        {P:{beds:2,floor:'low',elev:true,park:true},B:{rentB:150000000,depB:600000000}}));
      return {ok:v===false,data:{accepted:v}};
    });
    await run('R04 | A high-cost service cannot execute without callback',async()=>{
      const v=await page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        const before=S.tokens,started=E30.pay.begin({key:'hood_detail',title:'آزمون نبود اجرا'});
        const s=S.paySession;
        if(s&&s.payId)E30.pay.go(s.payId);
        return {before,after:S.tokens,started,state:S.paySession&&S.paySession.state,executed:S.paySession&&S.paySession.executed};
      });
      return {ok:v.before===v.after&&v.started!==true&&v.executed!==true,data:v};
    });

    for(const [name,w,h] of [['desktop',1280,800],['tablet',820,1180],['mobile-390',390,844],['mobile-360',360,800],['mobile-320',320,720]]){
      await page.setViewportSize({width:w,height:h});
      for(const [surface,view] of [['splash','splash'],['chat','landing']]){
        await page.evaluate(v=>go(v),view);
        await page.waitForTimeout(160);
        await run(`R05 | No horizontal overflow on ${surface}/${name} ${w}×${h}`,async()=>{
          const v=await page.evaluate(()=>({
            view:CURRENT,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth,
            offenders:[...document.querySelectorAll('*')].filter(e=>{
              const r=e.getBoundingClientRect(),s=getComputedStyle(e);
              return r.width>0&&r.right>innerWidth+1&&s.display!=='none'&&s.visibility!=='hidden';
            }).slice(0,12).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'',id:e.id,
              right:+e.getBoundingClientRect().right.toFixed(1),width:+e.getBoundingClientRect().width.toFixed(1)}))
          }));
          return {ok:v.view===view&&v.doc<=v.viewport+2&&v.body<=v.viewport+2,data:v};
        });
        await page.screenshot({path:path.join(out,`${name}-${surface}.png`),animations:'disabled'});
      }
    }

    await page.setViewportSize({width:1280,height:800});
    await page.evaluate(()=>go('splash'));
    await run('R06 | Landing service card Enter really opens modal',async()=>{
      const el=page.locator('#v-splash .spl-card').first();
      if(!await el.count())return {ok:false,data:'no service card'};
      const visible=await el.isVisible();
      if(!visible)return {ok:false,data:'landing card hidden even after explicit go(splash)'};
      await el.focus();await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      const opened=await page.locator('#modal-root.on .spl-modal').count()>0;
      if(opened)await page.evaluate(()=>closeModal());
      return {ok:opened,data:{visible,opened}};
    });
    await run('R07 | Landing is not obscured by duplicate independent topbars',async()=>{
      const v=await page.evaluate(()=>{
        const app=document.querySelector('#v-splash');
        const mainbar=document.querySelector('header.topbar,.topbar,#topbar');
        const landingbar=app&&app.querySelector('.spl-nav,.spl-header,header');
        const r=x=>x&&x.getBoundingClientRect();
        const a=r(mainbar),c=r(landingbar);
        return {mainbar:a&&{top:a.top,height:a.height},landingbar:c&&{top:c.top,height:c.height}};
      });
      // A separate global topbar must not occupy a second header row over public splash.
      return {ok:!(v.mainbar&&v.landingbar&&v.mainbar.height>10&&v.landingbar.height>10&&v.landingbar.top>=v.mainbar.height-3),data:v};
    });

    await run('R08 | No missing local font/map resources on startup',async()=>{
      const list=badRequests.filter(x=>x.url.startsWith('http://127.0.0.1:8730/')&&/\/assets\/leaflet\/|\/assets\/fonts\/|\/IRANSansX/.test(x.url));
      return {ok:list.length===0,data:list};
    });
    await run('R09 | No uncaught pageerror during regression cases',async()=>({ok:errors.length===0,data:errors}));
  }finally{
    await b.close();
    fs.writeFileSync(path.join(out,'regression-results.json'),JSON.stringify({tests,errors,consoleErrors,badRequests},null,2));
  }
  const failures=tests.filter(t=>!t.pass);
  console.log(`BROWSER REGRESSION RESULT: ${tests.length-failures.length} passed, ${failures.length} failed, ${tests.length} assertions`);
  if(failures.length)console.log('FAILED CHECKS:',failures.map(x=>x.name).join(' | '));
  process.exitCode=failures.length?1:0;
})().catch(e=>{console.error('BROWSER REGRESSION CRASH',e);process.exitCode=2});
