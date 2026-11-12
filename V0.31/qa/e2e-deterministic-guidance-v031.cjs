/* Browser-level checks that prompt suggestions execute existing real flows.
   Browser data are all local demonstration data, never a live real-estate API. */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results'),results=[];
const assert=(x,s)=>{if(!x)throw Error(s)};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,
    args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  async function test(name,fn){
    const context=await browser.newContext({viewport:{width:1300,height:900}}),page=await context.newPage(),errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    try{
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>doLogin('QA'));
      await page.waitForTimeout(150);
      await fn(page);
      assert(errs.length===0,'browser exceptions: '+errs.join('; '));
      results.push({name,status:'PASS'});console.log('PASS '+name);
    }catch(e){results.push({name,status:'FAIL',reason:String(e.stack||e)});console.error('FAIL '+name+': '+String(e.stack||e).slice(0,2000))}
    finally{await context.close()}
  }
  const send=async(page,s)=>{await page.locator('#chatIn').fill(s);await page.locator('#chatSend').click();await page.waitForTimeout(180)};
  try{
    await test('Prompt suggestions prefill the editor but never submit automatically',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      const card=page.locator('#chatB .e31-guide').last();
      assert(await card.count()===1,'no in-chat prompt suggestion card');
      const input=page.locator('#chatIn');
      const before=await page.locator('#chatB .msg.user').count();
      await card.locator('[data-e31-id="rent-budget"]').click();
      assert((await input.inputValue()).includes('۱.۲ میلیارد ودیعه'),'prompt did not prefill');
      assert(await page.locator('#chatB .msg.user').count()===before,'prefill submitted without user consent');
      await page.locator('#chatSend').click();await page.waitForTimeout(200);
      const budget=await page.evaluate(()=>E30.discAPI.getF('budget_dep'));
      assert(budget&&budget.v&&budget.v[0]>0,'budget prompt failed to reach the real parser');
    });
    await test('Comparison interrupts discovery without losing budget context',async page=>{
      await send(page,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');
      await send(page,'بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.');
      const before=await page.evaluate(()=>JSON.stringify(E30.discAPI.getF('budget_dep')));
      await send(page,'اول محله‌های اطراف انقلاب رو برای اجاره ارزیابی کن.');
      const body=await page.locator('#chatB').textContent();
      assert(body.includes('مقایسهٔ نمایشی محله‌ها'),'comparison action failed to render a real artifact');
      assert(body.includes('ساختگی'),'sample data were not labeled');
      const after=await page.evaluate(()=>JSON.stringify(E30.discAPI.getF('budget_dep')));
      assert(before===after,'switching tasks corrupted confirmed budget information');
      assert(await page.locator('#chatB [data-e31-id="map"]').count()>0,'no valid next map prompt');
    });
    await test('In-chat service request is executable, not an inert suggestion',async page=>{
      await send(page,'می‌خوام برای خدمات و تعمیرات ملک درخواست ثبت کنم.');
      assert(await page.locator('#chatB #e30-svc-detail').count()===1,'real in-chat service request form did not appear');
      assert((await page.locator('#chatB').textContent()).includes('پیش‌درخواست'),'a final service order was misleadingly claimed');
    });
    await test('Valuation shows its form without deducting credit',async page=>{
      const before=await page.evaluate(()=>S.tokens||0);
      await send(page,'می‌خوام ارزش ملک رو با داده‌های نمونه تخمین بزنم.');
      assert(await page.locator('#chatB #e30-val-area').count()===1,'valuation form missing');
      assert((await page.evaluate(()=>S.tokens||0))===before,'payment occurred merely by sending a suggested prompt');
    });
    await test('Stored item and contract summaries do not fabricate entries',async page=>{
      await send(page,'قراردادهای ذخیره‌شده رو داخل چت نشون بده.');
      assert((await page.locator('#chatB').textContent()).includes('هنوز قراردادی ثبت نشده'),'empty contract list not honest');
      await send(page,'گزارش‌ها و فایل‌های ذخیره‌شده‌ام رو در چت مرور کن.');
      assert((await page.locator('#chatB').textContent()).includes('هنوز گزارشی'),'empty Library list not honest');
    });
  }finally{
    fs.writeFileSync(path.join(out,'deterministic-guidance-results.json'),JSON.stringify(results,null,2));
    await browser.close();
  }
  const failed=results.filter(x=>x.status==='FAIL');
  console.log('DETERMINISTIC GUIDE: '+(results.length-failed.length)+' passed, '+failed.length+' failed');
  if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
