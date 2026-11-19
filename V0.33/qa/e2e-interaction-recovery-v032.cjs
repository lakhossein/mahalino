'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext();const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.32.html');
  await page.waitForFunction(()=>window.__BOOTED===true);
  await page.evaluate(()=>{localStorage.setItem('mahalino_v31','{"tokens":999}');localStorage.setItem('other','keep');S.tokens=77;save();ACT.reset()});
  await Promise.all([page.waitForEvent('load'),page.locator('[data-act="resetOk"]').click()]);
  await page.waitForFunction(()=>window.__BOOTED===true);
  const after=await page.evaluate(()=>({tokens:S.tokens,previous:localStorage.getItem('mahalino_v31'),other:localStorage.getItem('other')}));
  assert.equal(after.tokens,0);assert.equal(after.previous,'{"tokens":999}');assert.equal(after.other,'keep');console.log('PASS version-only reset and reload without remigration');
  const copy=await page.evaluate(async()=>{
   openModal('<input id="e29-shurl" value="test-link">');
   const messages=[],originalToast=toast;toast=t=>messages.push(t);
   const originalExec=document.execCommand;document.execCommand=()=>false;
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}});
   try{await ACT.e29shCopy();return messages}finally{toast=originalToast;document.execCommand=originalExec;delete navigator.clipboard}
  });
  assert.equal(copy.length,1);assert.ok(copy[0].includes('انجام نشد'));console.log('PASS denied clipboard reports failure');
  const pdf=await page.evaluate(async()=>{
   ACT.e30pdfShare();const input=document.getElementById('e30-pdf-file');
   Object.defineProperty(input,'files',{value:[{name:'test.pdf',size:5,slice:()=>({arrayBuffer:()=>Promise.reject(Error('read'))})}]});
   await ACT.e30pdfSend();return document.getElementById('e30-pdf-status').textContent;
  });
  assert.ok(pdf.includes('انجام نشد'));assert.deepEqual(errors,[]);console.log('PASS PDF read rejection has visible status and no pageerror');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
