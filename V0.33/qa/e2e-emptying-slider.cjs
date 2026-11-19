'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined});
  try {
    const page=await browser.newPage({viewport:{width:800,height:700},hasTouch:true});
    await page.goto(process.env.QA_BASE_URL||pathToFileURL(path.join(__dirname,'../Mahalino+V0.32.html')).href);
    await page.evaluate(()=>{
      const mount=document.createElement('div');
      mount.id='emptying-test';
      Object.assign(mount.style,{position:'fixed',left:'20px',top:'20px',width:'min(600px, calc(100vw - 40px))',zIndex:'99999',direction:'rtl',background:'white'});
      mount.innerHTML=baHTML();
      document.body.appendChild(mount);
    });
    const wrap=page.locator('#emptying-test .ba27-wrap');
    const range=page.locator('#emptying-test .ba27-range');
    const labels=await page.locator('#emptying-test .ba27-labs span').evaluateAll(spans=>spans.map(s=>({
      left:s.getBoundingClientRect().left,right:s.getBoundingClientRect().right,direction:getComputedStyle(s).direction,text:s.textContent
    })));
    assert.match(labels[0].text,/روز ورود/);
    assert.match(labels[1].text,/روز تخلیه/);
    assert.ok(labels[0].right<labels[1].left,'The furnished endpoint label must be physically left of the empty endpoint label');
    assert.equal(labels[0].direction,'rtl');
    assert.equal(labels[1].direction,'rtl');
    await wrap.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    const bounds=await wrap.boundingBox();
    const x=v=>bounds.x+bounds.width*v/100;
    const y=bounds.y+bounds.height/2;
    const state=()=>wrap.evaluate(w=>{
      const after=w.querySelector('.ba27-after'),handle=w.querySelector('.ba27-handle'),rng=w.parentNode.querySelector('.ba27-range');
      const rect=w.getBoundingClientRect(),overlay=after.getBoundingClientRect(),line=handle.getBoundingClientRect();
      return {value:+w.getAttribute('aria-valuenow'),range:+rng.value,
        clip:getComputedStyle(after).clipPath,direction:getComputedStyle(rng).direction,
        overlay:[overlay.width,overlay.height],dimensions:[rect.width,rect.height],
        position:(line.left+line.width/2-rect.left)/rect.width*100};
    });
    async function check(v){
      const s=await state();
      assert.equal(s.value,v);
      assert.equal(s.range,v);
      assert.equal(s.direction,'ltr');
      assert.deepEqual(s.overlay,s.dimensions);
      assert.ok(Math.abs(s.position-v)<0.6,JSON.stringify(s));
      assert.equal(s.clip,'inset(0px '+(100-v)+'% 0px 0px)');
    }
    await check(50);
    await page.mouse.move(x(50),y);await page.mouse.down();
    await page.mouse.move(x(15),y,{steps:5});await check(15);
    await page.mouse.move(x(85),y,{steps:5});await check(85);
    await page.mouse.up();
    await page.keyboard.press('ArrowLeft');await check(81);
    await page.keyboard.press('ArrowRight');await check(85);
    await page.keyboard.press('Home');await check(0);
    const before=await wrap.screenshot(process.env.QA_RESULTS_DIR?{path:path.join(process.env.QA_RESULTS_DIR,'emptying-before.png')}:{});
    await page.keyboard.press('End');await check(100);
    const after=await wrap.screenshot(process.env.QA_RESULTS_DIR?{path:path.join(process.env.QA_RESULTS_DIR,'emptying-after.png')}:{});
    assert.notDeepEqual(before,after);
    await range.focus();await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('#emptying-test .ba27-wrap').getAttribute('aria-valuenow')==='0');
    await check(0);
    await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#emptying-test .ba27-wrap').getAttribute('aria-valuenow')==='1');
    await check(1);
    await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('#emptying-test .ba27-wrap').getAttribute('aria-valuenow')==='100');
    await check(100);
    const cdp=await page.context().newCDPSession(page);
    const touch=(type,v)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:x(v),y}]});
    await touch('touchStart',30);
    await touch('touchMove',70);await touch('touchEnd',70);
    await check(70);
    console.log('PASS RTL comparing slider: full overlay, mouse, touch, keyboard and native range, matching endpoints.');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
