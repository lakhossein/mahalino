/* Stateful acceptance routes that were missing from the original release QA:
   conversation/report sharing, browser PDF, persistence/resume, real-debit
   recovery, slider locking, active+archived project, termination status. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const url=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const cases=[];
function ok(id,name,passed,info){
  cases.push({id,name,result:passed?'PASS':'FAIL',info:info||null});
  console.log(`${passed?'PASS':'FAIL'} ${id} ${name}: ${JSON.stringify(info||'').slice(0,420)}`);
}
async function test(id,name,fn){
  try{const r=await fn();ok(id,name,Boolean(r.ok),r.info)}
  catch(e){ok(id,name,false,{exception:String(e.stack||e)})}
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  async function fresh(){
    const ctx=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(400);
    await page.evaluate(()=>doLogin('QA'));
    return {ctx,page,errors};
  }
  try{
    await test('S01','Whole-conversation share retains all 75 messages, not a truncated tail',async()=>{
      const s=await fresh();
      await s.page.evaluate(()=>{
        HIST.length=0;
        for(let i=0;i<75;i++)HIST.push({r:i%2?'bot':'user',h:'پیام نمونهٔ کامل شماره '+(i+1)});
        ACT.e30shWhole();
      });
      const button=s.page.locator('#modal-root [data-act="e29shGo"]');
      const hadButton=await button.count()===1;
      if(hadButton)await button.click();
      const v=await s.page.evaluate(()=>{
        const s=(S.shares||[]).at(-1);
        const msgs=s&&s.snapshot&&s.snapshot.msgs||[];
        return {count:msgs.length,first:msgs[0]&&msgs[0].h,originalLast:msgs[74]&&msgs[74].h,
          userShareAction:msgs.length===76&&/اشتراک‌گذاری کل گفت‌وگو/.test(msgs[75].h),
          linkOnlyLocal:document.querySelector('#modal-root')?.innerText.includes('مرورگر')};
      });
      await s.ctx.close();
      return {ok:hadButton&&v.count>=75&&/شماره 1$/.test(v.first)&&/شماره 75$/.test(v.originalLast)&&
        v.userShareAction&&v.linkOnlyLocal,info:v};
    });
    await test('S02','Whole-share exports a standalone HTML file with last message',async()=>{
      const s=await fresh();
      await s.page.evaluate(()=>{
        HIST.length=0;for(let i=0;i<70;i++)HIST.push({r:i%2?'bot':'user',h:'قابل‌اشتراک پیام '+(i+1)});
        ACT.e30shWhole();
      });
      await s.page.locator('#modal-root [data-act="e29shGo"]').click();
      const downloadPromise=s.page.waitForEvent('download',{timeout:12000});
      await s.page.locator('#modal-root [data-act="e29shExport"]').click();
      const dl=await downloadPromise;
      const f=await dl.path(),data=fs.readFileSync(f,'utf8');
      const v={file:dl.suggestedFilename(),bytes:Buffer.byteLength(data),last:data.includes('قابل‌اشتراک پیام 70'),html:/<!DOCTYPE html>/i.test(data)};
      await s.ctx.close();
      return {ok:v.file.endsWith('.html')&&v.bytes>1000&&v.last&&v.html,info:v};
    });
    await test('S03','Saved library report is shareable separately from conversation',async()=>{
      const s=await fresh();
      const v=await s.page.evaluate(()=>{
        const it=E29.libAPI.saveArtifact({type:'report',title:'گزارش نمونهٔ QA',summary:'خلاصهٔ خروجی QA',
          artifact:{html:'<p>تحلیل آزمایشی مستقل از گفتگو</p>'},tokenCost:0});
        E29.share.dialog('library',it.id);
        const btn=document.querySelector('#modal-root [data-act="e29shGo"]');
        if(btn)btn.click();
        const sh=(S.shares||[]).at(-1);
        return {saved:it.id,kind:sh&&sh.snapshot&&sh.snapshot.kind,title:sh&&sh.title,preview:document.querySelector('#modal-root')?.innerText.slice(0,140)};
      });
      await s.ctx.close();
      return {ok:v.saved&&v.kind==='library'&&v.title.includes('QA'),info:v};
    });
    await test('S04','Contract has actual print-ready PDF route and legal status notice',async()=>{
      const s=await fresh();
      const v=await s.page.evaluate(()=>{
        const D=wd('rent').data,c=conInit(D,'rent');
        c.prop={title:'آپارتمان نمونهٔ QA',hood:'نارمک',area:85,addr:'نشانی آزمایشی',postal:'1234567890'};
        c.terms={deposit:10000000000,rent:0,duration:'یک‌ساله',start:'2026-11-11'};
        ACT.cdoc({getAttribute:function(){return 'cur'}});
        const modal=document.querySelector('#modal-root');
        return {printButton:!!modal.querySelector('[data-act="cprint"]'),officialWarning:modal.innerText.includes('ثبت رسمی انجام نشده'),containsTerms:modal.innerText.includes('ودیعه')};
      });
      // The app exposes a print view; Chromium must produce a real nonempty PDF.
      const pdf=await s.page.pdf({printBackground:true,format:'A4'});
      const v2={...v,pdfBytes:pdf.byteLength,pdfMagic:pdf.subarray(0,4).toString('ascii')};
      await s.ctx.close();
      return {ok:v2.printButton&&v2.officialWarning&&v2.containsTerms&&v2.pdfMagic==='%PDF'&&v2.pdfBytes>1500,info:v2};
    });
    await test('S05','Confirmed collector facts survive reload and can be resumed',async()=>{
      const s=await fresh();
      const before=await s.page.evaluate(()=>{
        E30.discAPI.start('rent',true);
        E30.discAPI.setF('budget_dep',{v:[5000000000,5000000000]},{src:'answer',fin:true});
        save();
        return {active:E30.discAPI.active(),fact:E30.discAPI.getF('budget_dep')};
      });
      await s.page.reload({waitUntil:'domcontentloaded'});
      await s.page.waitForTimeout(500);
      const after=await s.page.evaluate(()=>({active:E30.discAPI.active(),fact:E30.discAPI.getF('budget_dep')}));
      await s.ctx.close();
      return {ok:before.active&&after.active&&after.fact&&after.fact.v&&after.fact.v[0]===5000000000,info:{before,after}};
    });
    await test('S06','Recovery after a real debit refunds once and stays idempotent on reload',async()=>{
      const s=await fresh();
      const before=await s.page.evaluate(()=>{
        const payId='QA-REAL-'+Date.now(),txnId='QA-DEBIT-'+Date.now();
        S.tokens=960;
        S.log.unshift({t:Date.now(),d:'آزمون پرداخت قطع‌شده',c:-40,cat:'bana',id:txnId,svc:'hood_detail',payId});
        S.paySession={payId,txnId,key:'hood_detail',cost:40,state:'paid',paidFlag:true,executed:false,refunded:false,title:'نمونهٔ قطع‌شده'};
        save();
        return {payId,balance:S.tokens};
      });
      await s.page.reload({waitUntil:'domcontentloaded'});
      await s.page.waitForTimeout(550);
      const once=await s.page.evaluate(()=>({balance:S.tokens,refunded:(S.log||[]).filter(x=>x.refund&&x.svc==='hood_detail').length,session:S.paySession}));
      await s.page.reload({waitUntil:'domcontentloaded'});
      await s.page.waitForTimeout(550);
      const twice=await s.page.evaluate(()=>({balance:S.tokens,refunded:(S.log||[]).filter(x=>x.refund&&x.svc==='hood_detail').length,session:S.paySession}));
      await s.ctx.close();
      return {ok:before.balance===960&&once.balance===1000&&twice.balance===1000&&once.refunded===1&&twice.refunded===1&&twice.session===null,info:{before,once,twice}};
    });
    await test('S07','Previously committed slider is disabled; it cannot be resubmitted',async()=>{
      const s=await fresh();
      const v=await s.page.evaluate(()=>{
        go('landing');
        const box=document.getElementById('chatB');
        if(!box||!box.offsetParent)return {error:'chat surface unavailable'};
        const el=document.createElement('div');
        el.className='msg bot';
        el.innerHTML='<div class="rsld" data-slot="depB"><input id="qa-old-slider" type="range" value="50"><button data-cba="slSet">تأیید</button></div>';
        const last=document.createElement('div');
        last.className='msg bot';last.innerHTML='<div class="bub">آخرین مرحله</div>';
        box.append(el,last);
        E30.flowsAPI.lockSliders();
        const slider=el.querySelector('input');
        const btn=el.querySelector('button');
        const allowed=E30.flowsAPI.slGuard({getAttribute:function(k){return k==='data-rsld-for'?'qa-old-slider':null}});
        el.remove();last.remove();
        return {disabled:slider.disabled,buttonDisabled:btn.disabled,allowed};
      });
      await s.ctx.close();
      return {ok:v.disabled===true&&v.buttonDisabled===true&&v.allowed===false,info:v};
    });
    await test('S08','Active and archived conversations coexist in project without duplicate refs',async()=>{
      const s=await fresh();
      const v=await s.page.evaluate(()=>{
        S.chats=[{id:'QA-ARCHIVED',title:'چت بایگانی‌شده',t:Date.now(),hist:[]}];
        S.projects=[{id:'QA-PROJECT',name:'پروژهٔ QA',title:'پروژهٔ QA',chatIds:['QA-ARCHIVED']}];
        E30.ux.addLive('QA-PROJECT');E30.ux.addLive('QA-PROJECT');
        const p=S.projects[0];
        const active=E30.chatRef().chatId;
        return {ids:p.chatIds,active,duplicates:p.chatIds.length!==new Set(p.chatIds).size};
      });
      await s.ctx.close();
      return {ok:v.ids.length===2&&v.ids.includes('QA-ARCHIVED')&&v.ids.includes(v.active)&&v.duplicates===false,info:v};
    });
    await test('S09','Termination settlement updates the stored contract status',async()=>{
      const s=await fresh();
      const v=await s.page.evaluate(()=>{
        const D=wd('rent').data;
        D.code='MH-QA-TERMINATION';D.signed=true;
        S.contracts.push({code:D.code,kind:'rent',status:'signed_internal',detail:true,title:'اجاره‌نامهٔ نمونه'});
        D.term={ph:4,reason:'توافق طرفین',date:'۱۴۰۵/۰۸/۲۰',min:'تسویه شد',paid:false,ok:true};
        const was=S.contracts.at(-1).status;
        ACT.tpay();
        const after=S.contracts.find(x=>x.code===D.code);
        return {was,now:after&&after.status,paid:D.term.paid,done:wd('rent').done};
      });
      await s.ctx.close();
      return {ok:v.was==='signed_internal'&&v.paid===true&&v.done===true&&/term|فسخ/i.test(v.now||''),info:v};
    });
    await test('S10','Identity and postal lookup emit zero network requests before explicit consent',async()=>{
      const s=await fresh();
      const initial=await s.page.evaluate(()=>{
        window.MAHALINO_LOOKUP={identityEndpoint:'https://qa.invalid/id',postalEndpoint:'https://qa.invalid/post'};
        window.__qaOutbound=[];
        window.fetch=function(request){window.__qaOutbound.push(String(request));return Promise.reject(new Error('QA external lookup intercepted'))};
        for(const [id,value] of [['cl-id','1234567891'],['cp-postal','1234567890']]){
          const el=document.createElement('input');el.id=id;el.value=value;document.body.appendChild(el);
        }
        lookupPostal();
        const postalConsent=!!document.querySelector('#modal-root [data-act="e30PostalConsent"]');
        closeModal();
        lookupIdentity(null,'me');
        const identityConsent=!!document.querySelector('#modal-root [data-act="e30IdentityConsent"]');
        return {postalConsent,identityConsent,requests:window.__qaOutbound.slice()};
      });
      const final=await s.page.evaluate(()=>{
        ACT.e30IdentityConsent({getAttribute:function(k){return k==='data-role'?'me':null}});
        ACT.e30PostalConsent();
        return {requests:window.__qaOutbound.slice()};
      });
      await s.ctx.close();
      return {ok:initial.postalConsent&&initial.identityConsent&&initial.requests.length===0&&
        final.requests.length===2&&final.requests.some(x=>x.includes('/id'))&&final.requests.some(x=>x.includes('/post')),
        info:{initial,final}};
    });
    await test('S11','Archived 80-message conversation survives reload without truncation',async()=>{
      const s=await fresh();
      const before=await s.page.evaluate(()=>{
        HIST.length=0;
        for(let i=0;i<80;i++)HIST.push({r:i%2?'bot':'user',h:'کاملِ بایگانی شماره '+(i+1)});
        ACT.chatNew();
        const c=(S.chats||[]).find(x=>x.hist&&x.hist.some(m=>m.h.includes('بایگانی شماره')));
        return {id:c&&c.id,count:c&&c.hist.length,last:c&&c.hist.at(-1).h};
      });
      await s.page.reload({waitUntil:'domcontentloaded'});
      await s.page.waitForTimeout(450);
      const after=await s.page.evaluate(id=>{
        const c=(S.chats||[]).find(x=>x.id===id);
        return {count:c&&c.hist&&c.hist.length,last:c&&c.hist&&c.hist.at(-1).h};
      },before.id);
      await s.ctx.close();
      return {ok:before.id&&before.count===80&&after.count===80&&/شماره 80$/.test(after.last),info:{before,after}};
    });
  }finally{
    await browser.close();
    fs.writeFileSync(path.join(out,'scenarios-results.json'),JSON.stringify(cases,null,2));
  }
  const fails=cases.filter(x=>x.result==='FAIL');
  console.log(`SCENARIO RESULT: ${cases.length-fails.length} passed, ${fails.length} failed, ${cases.length} checks`);
  if(fails.length)console.log('FAILED:',fails.map(x=>x.id).join(' | '));
  process.exitCode=fails.length?1:0;
})().catch(e=>{console.error('SCENARIO HARNESS CRASH:',e);process.exitCode=2});
