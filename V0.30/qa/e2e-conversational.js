/* e2e-conversational.js — V0.30 conversational suite (§19.2 + §19.3)
   Scripted users with realistic imperfection, driven through the real engine in Chromium. */
const { chromium } = require('C:/Users/Sedreh/zqa/node_modules/playwright');
const URL='http://127.0.0.1:8730/Mahalino%2BV0.30.html';
let pass=0,fail=0;const fails=[];
function ok(name,cond,extra){if(cond){pass++;console.log('  ✓ '+name)}else{fail++;fails.push(name);console.log('  ✗ '+name+(extra?' — '+JSON.stringify(extra).slice(0,240):''))}}

(async()=>{
  const b=await chromium.launch({executablePath:'C:/Users/Sedreh/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe',headless:true});

  async function fresh(){
    const ctx=await b.newContext({viewport:{width:1366,height:860}});
    const page=await ctx.newPage();
    const errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    await page.goto(URL,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1300);
    await page.evaluate(()=>{try{doLogin('U')}catch(e){}});
    await page.waitForTimeout(400);
    async function send(t){await page.fill('#chatIn',t);await page.click('#chatSend');await page.waitForTimeout(650)}
    return {ctx,page,send,errs,
      state:()=>page.evaluate(()=>({act:E30.discAPI.active(),fields:JSON.parse(JSON.stringify(S.ctx30.fields||{})),ce:CE.f,
        bubbles:[...document.querySelectorAll('#chatB .msg.bot .bub')].map(b=>b.textContent)}))};
  }

  console.log('— U1: everything-at-once buyer —');
  {
    const u=await fresh();
    await u.send('سلام. من و همسرم می‌خوایم آپارتمان بخریم، برای خودمون می‌خوایم نه سرمایه‌گذاری. بودجه‌مون حداکثر ۳۰ میلیارد تومان، خودِ ملک. دو خواب حداقل، نارمک یا تهرانپارس، نوساز هم باشه بهتره ولی الزامی نیست.');
    await u.page.waitForTimeout(500);
    let st=await u.state();
    ok('U1.1 all facts extracted in one pass (budget+scope+rooms+hoods+purpose)',Object.keys(st.fields).length>=6,st.fields);
    const qCount=(st.bubbles.filter(b=>/؟/.test(b)).length);
    ok('U1.2 ≤2 questions asked (nothing re-asked)',qCount<=2,{qCount});
    await u.send('درسته');
    st=await u.state();
    ok('U1.3 confirms into buy flow',st.ce==='buy'||st.act===false,st.ce);
    await u.ctx.close();
  }

  console.log('— U2: minimal renter, gradual info —');
  {
    const u=await fresh();
    await u.send('دنبال یه خونه برای اجاره');
    let st=await u.state();
    ok('U2.1 collector starts and asks (not a static form)',st.act===true&&st.bubbles.some(b=>/؟/.test(b)),st.ce);
    const firstQ=st.bubbles[st.bubbles.length-1];
    ok('U2.2 first question is financial (top impact)',/ودیعه|بودجه/.test(firstQ),firstQ.slice(-60));
    await u.send('ودیعه ۵۰۰ میلیون تومان، اجاره ماهی ۱۵ میلیون تومان');
    await u.send('برای خودم تنهایی');
    for(let i=0;i<8;i++){const a=await u.page.evaluate(()=>E30.discAPI.active());if(!a)break;await u.send('مهم نیست')}
    await u.send('درسته');
    await u.page.waitForTimeout(500);
    st=await u.state();
    ok('U2.3 completes with skips honored',st.act===false,st.fields);
    ok('U2.4 financial values preserved exactly (rial-normalized)',st.fields.budget_rent&&st.fields.budget_rent.v.v[0]===150000000&&st.fields.budget_dep.v.v[0]===5000000000,st.fields.budget_rent);
    await u.ctx.close();
  }

  console.log('— U3: contradictory constraints surfaced —');
  {
    const u=await fresh();
    await u.send('می‌خوام خونه اجاره کنم، نوساز برایم کاملاً الزامی است');
    await u.send('راجع به عمر بنا: تا ۲۰ سال هم اوکیه'); // contradiction with الزامی نوساز
    let st=await u.state();
    const contradiction=st.bubbles.some(b=>/نکته|قبلاً.*گفته بودید|الزامی است\?|الزامی است؟/.test(b));
    ok('U3.1 contradiction between نوساز and age surfaced',contradiction,st.bubbles.slice(-3).map(b=>b.slice(0,80)));
    await u.ctx.close();
  }

  console.log('— U4: unknown budget, no invented defaults —');
  {
    const u=await fresh();
    await u.send('خونه می‌خوام اجاره کنم ولی بودجه‌ام را هنوز نمی‌دانم');
    let st=await u.state();
    const D0=await u.page.evaluate(()=>wd('rent').data);
    const defaulted=D0&&D0.B&&(D0.B.rentB===500000000||D0.B.rentB>0);
    ok('U4.1 no silent financial default while budget unknown',defaulted!==true,{B:D0&&D0.B});
    await u.send('نمی‌دونم، بعداً می‌گم');
    for(let i=0;i<8;i++){const a=await u.page.evaluate(()=>E30.discAPI.active());if(!a)break;await u.send('مهم نیست')}
    await u.send('درسته');
    await u.page.waitForTimeout(500);
    st=await u.state();
    ok('U4.2 collector completes despite unknown budget (graceful)',st.act===false,st.fields);
    await u.ctx.close();
  }

  console.log('— U5: mid-flow preference change without re-asking —');
  {
    const u=await fresh();
    await u.send('اجاره می‌خوام، کارم پونکه، ودیعه ۱ میلیارد تومان اجاره ۲۰ میلیون تومان');
    await u.send('راستی کارم عوض شد، الان ستارخانم');
    let st=await u.state();
    ok('U5.1 location change captured without re-asking rest',st.fields.work_loc&&st.fields.work_loc.v==='h3',st.fields.work_loc);
    const asked=st.bubbles.filter(b=>/ودیعه/.test(b)&&/چقدر|بازه/.test(b)).length;
    ok('U5.2 deposit not re-asked after change',asked<=1,{asked});
    for(let i=0;i<8;i++){const a=await u.page.evaluate(()=>E30.discAPI.active());if(!a)break;await u.send('مهم نیست')}
    await u.send('درسته');
    await u.ctx.close();
  }

  console.log('— U6: late family reveal → persona reclassification announced —');
  {
    const u=await fresh();
    await u.send('سلام، خونه اجاره می‌خوام. کارم ونکه.');
    await u.send('ودیعه ۲ میلیارد تومان، اجاره ۳۰ میلیون تومان');
    await u.send('راستی تازه صاحب بچه شدیم، پس مدرسه هم مهم می‌شه');
    let st=await u.state();
    const announced=st.bubbles.some(b=>/تصویرم از شرایط شما عوض شد|اولویت سؤال/.test(b));
    ok('U6.1 dynamic reclassification announced (§6.1)',announced,st.bubbles.slice(-2).map(b=>b.slice(0,70)));
    st=await u.state();
    ok('U6.2 household=family registered',st.fields.household&&st.fields.household.v==='family',st.fields.household);
    await u.send('درسته');
    await u.ctx.close();
  }

  console.log('— U7: unrelated question mid-flow answered then flow resumes —');
  {
    const u=await fresh();
    await u.send('خونه اجاره می‌خوام');
    let st=await u.state();
    await u.send('راستی بنا چیست و چطور شارژ کنم؟');
    st=await u.state();
    const answered=st.bubbles.some(b=>/اعتبار|بنا/.test(b));
    ok('U7.1 unrelated question answered helpfully',answered,st.bubbles.slice(-2).map(b=>b.slice(0,60)));
    await u.send('ودیعه ۸۰۰ میلیون تومان اجاره ۲۵ میلیون تومان');
    st=await u.state();
    ok('U7.2 flow resumed and captured the financial answer',st.act===true&&!!st.fields.budget_dep,st.fields.budget_dep);
    await u.ctx.close();
  }

  console.log('— §19.3 Persona comparison tests —');
  {
    const u1=await fresh();
    await u1.send('دانشجوم، دنبال سویییت یا خونه نزدیک دانشگاه، بودجه محدوده، احتمالاً با یکی از دوستام هم‌خانه می‌شم');
    const s1=await u1.state();
    const q1=s1.bubbles[s1.bubbles.length-1];
    const p1=await u1.page.evaluate(()=>E30.discAPI.personaOf('rent'));
    const u2=await fresh();
    await u2.send('ما یه خانواده چهار نفره هستیم. بچه‌هام مدرسه می‌رن و می‌خوام خونه مناسبا با دسترسی خوب به مدرسه پیدا کنم برای اجاره');
    const s2=await u2.state();
    const q2=s2.bubbles[s2.bubbles.length-1];
    const p2=await u2.page.evaluate(()=>E30.discAPI.personaOf('rent'));
    ok('P.1 student vs family personas distinct',p1==='roommates'&&p2==='family',{p1,p2});
    ok('P.2 question sets genuinely differ between personas',q1!==q2,{q1:q1.slice(0,50),q2:q2.slice(0,50)});
    await u1.ctx.close();await u2.ctx.close();

    const u3=await fresh();
    await u3.send('مالک یه آپارتمان هستم، به خاطر مهاجرت باید زود بفروشمش');
    const s3=await u3.state();
    const p3=await u3.page.evaluate(()=>E30.discAPI.personaOf('sell'));
    const q3=s3.bubbles[s3.bubbles.length-1];
    const u4=await fresh();
    await u4.send('یه آپارتمان دارم که می‌خوام بفروشم. خیلی عجله ندارم ولی نمی‌خوام پایین‌تر از قیمت واقعی منطقه بفروشم.');
    const s4=await u4.state();
    const p4=await u4.page.evaluate(()=>E30.discAPI.personaOf('sell'));
    const q4=s4.bubbles[s4.bubbles.length-1];
    ok('P.3 urgent vs max-price seller personas distinct',p3==='urgent_seller'&&p4==='seller_max',{p3,p4});
    ok('P.4 their question priorities differ',q3!==q4,{q3:q3.slice(0,50),q4:q4.slice(0,50)});
    await u3.ctx.close();await u4.ctx.close();

    const u5=await fresh();
    await u5.send('حدود ۱۰ میلیارد دارم، نمی‌دونم آپارتمان کوچیک اجاره‌ای بخرم یا زمین. بیشتر حفظ ارزش پولم مهمه.');
    const s5=await u5.state();
    const p5=await u5.page.evaluate(()=>E30.discAPI.personaOf('invest'));
    ok('P.5 investor objective detected (hedge/land)',p5==='hedger'||p5==='land_banker',p5);
    await u5.ctx.close();
  }

  console.log('— §19.2 completion quality: every flow reaches a valid end state —');
  {
    const u=await fresh();
    await u.send('تازه ازدواج کردم و دنبال یه خونه نوساز می‌گردم که به محل کارم نزدیک باشه. نمی‌دونم بهتره ودیعه بیشتری بدم یا اجاره بیشتری قبول کنم.');
    await u.send('کارم جردنه');
    await u.send('ودیعه ۲ میلیارد تومان، اجاره ۱۸ میلیون تومان');
    await u.send('همان ۲ خواب');
    for(let i=0;i<8;i++){const a=await u.page.evaluate(()=>E30.discAPI.active());if(!a)break;await u.send('مهم نیست')}
    await u.send('درسته');
    await u.page.waitForTimeout(600);
    const st=await u.state();
    ok('C.1 free-form opening reaches hand-off with confirmed set',st.ce==='rent',st.ce);
    const D=await u.page.evaluate(()=>{const D=wd('rent').data;return {rentB:D.B&&D.B.rentB,depB:D.B&&D.B.depB,age:D.P&&D.P.maxAge,hard:D.P&&D.P._ageHard}});
    ok('C.2 financials + نوساز carried into engine',D.rentB===180000000&&D.depB===2000000000&&D.hard===true,D);
    const errs=await u.page.evaluate(()=>window.__errs||[]);
    await u.ctx.close();
  }

  await b.close();
  console.log('\nE2E-CONVERSATIONAL RESULT: '+pass+' passed, '+fail+' failed');
  if(fails.length)console.log('FAILED: '+fails.join(' | '));
  process.exit(fail?1:0);
})().catch(e=>{console.error('E2E-CONV CRASH:',e);process.exit(2)});
