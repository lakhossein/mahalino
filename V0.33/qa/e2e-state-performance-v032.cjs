'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
 try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.32.html');await page.waitForFunction(()=>window.__BOOTED===true&&stateWriterReady);
 const rows=await page.evaluate(async()=>{
 const before=JSON.stringify(S),rows=[];
 for(const count of [100,1000,10000]){
  S=Object.assign(JSON.parse(before),{chats:[{id:'synthetic',hist:Array.from({length:count},(_,i)=>({r:'user',h:'synthetic '+i+' '+'.'.repeat(160)}))}]});
  const durations=[],longTasks=[];const observer=new PerformanceObserver(list=>{for(const item of list.getEntries())longTasks.push(item.duration)});observer.observe({type:'longtask'});
  for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,0));S.tokens=i;const start=performance.now();if(!save())throw Error('synthetic save failed');durations.push(performance.now()-start)}
  await new Promise(r=>setTimeout(r,20));observer.disconnect();const coldMs=durations[0];durations.sort((a,b)=>a-b);
  rows.push({messages:count,bytes:new Blob([localStorage.getItem(LSKEY)]).size,coldMs:coldMs,p50Ms:durations[15],p95Ms:durations[28],longTasks:longTasks.length,maxLongTaskMs:Math.max(0,...longTasks)});
 }
 S=JSON.parse(before);if(!save())throw Error('restore failed');return rows;
 });
 assert.equal(rows.length,3);assert(rows.every(x=>Number.isFinite(x.p95Ms)));
 const report={scope:'Chromium mobile viewport with 4x CPU throttling; synthetic isolated data, not a physical-device measurement',rows};
 const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'state-performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 await ctx.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
