'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});let failed=0;
 async function test(name,fn){const page=await browser.newPage();try{await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html');await page.evaluate(()=>doLogin('QA'));await fn(page);console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+' '+e.message)}finally{await page.close()}}
 const send=(p,t)=>p.evaluate(t=>ceSend(t),t);
 await test('implicit toman and explicit rial agree',async p=>{const a=await p.evaluate(()=>[parseMoneyFA('۱۰ میلیون').value,parseMoneyFA('۱۰ میلیون تومان').value,parseMoneyFA('۱۰۰ میلیون ریال').value]);assert.equal(a[0],a[1]);assert.equal(a[1],a[2])});
 await test('both rental amounts bind independently',async p=>{const a=await p.evaluate(()=>E30._dbg.finScan('بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.'));assert.deepEqual(a,{dep:[12e9,12e9],rent:[1e8,1e8]})});
 await test('one response per turn',async p=>{await send(p,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');const a=await p.evaluate(()=>HIST.slice(HIST.map(x=>x.r).lastIndexOf('user')+1));assert.equal(a.length,1)});
 await test('rent priorities and optional service exit',async p=>{await send(p,'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.');const ids=await p.evaluate(()=>E30.guide.suggestions().map(x=>x.id));assert(ids.includes('need-persona'));await send(p,'با اطلاعات فعلی آگهی‌ها را نشان بده.');assert(await p.locator('#chatB .chcards').count()>0)});
 await test('buy age continues safely',async p=>{const a=await p.evaluate(()=>{ceStart('buy');ceJump('age');ceVal('0|5');return {i:CE.i,msg:HIST.at(-1).h}});assert(!/خطای غیرمنتظره/.test(a.msg));assert(a.i>=0)});
 await test('moving a chat cleans previous membership',async p=>{const a=await p.evaluate(()=>{S.chats=[{id:'c',title:'QA',hist:[]}];let a=E29.projAPI.create('A'),b=E29.projAPI.create('B');E29.projAPI.addChat(a.id,'c');E29.projAPI.addChat(b.id,'c');return {old:a.chatIds,new:b.chatIds,link:S.chats[0].projectId,target:b.id}});assert.deepEqual(a.old,[]);assert.deepEqual(a.new,['c']);assert.equal(a.link,a.target)});
 await browser.close();if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
