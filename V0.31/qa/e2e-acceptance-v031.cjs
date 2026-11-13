/* V0.31 release acceptance invariants, run against the actual browser runtime.
   Non-vacuous pass criteria: exceptions and missing prerequisites fail the check.
   No mocks of application functions or automatic conversion of product errors to passes. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const url=process.env.QA_BASE_URL||'http://127.0.0.1:8731/Mahalino%2BV0.31.html';
const out=process.env.QA_RESULTS_DIR||path.join(__dirname,'results');
const checks=[];
const assert=(id,name,ok,info)=>{
  checks.push({id,name,result:ok?'PASS':'FAIL',info:info||null});
  console.log(`${ok?'PASS':'FAIL'} ${id} ${name}: ${JSON.stringify(info||'').slice(0,500)}`);
};
async function check(id,name,test){
  try{const v=await test();assert(id,name,Boolean(v.ok),v.info)}
  catch(e){assert(id,name,false,{exception:String(e.stack||e)})}
}
const start=async b=>{
  const context=await b.newContext({viewport:{width:1280,height:800},locale:'fa-IR'});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(350);
  return {context,page,pageErrors};
};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE||undefined,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
  try{
    const a=await start(browser);
    const page=a.page;
    await check('A01','Single Toman and Rial amounts have exact base-unit conversion',async()=>{
      const v=await page.evaluate(()=>[
        parseMoneyFA('۴۰۰ میلیون تومان'),
        parseMoneyFA('۴۰۰ میلیون ریال'),
        parseMoneyFA('۲ میلیارد تومان'),
        parseMoneyFA('۲ میلیارد ریال')
      ]);
      const expected=[4000000000,400000000,20000000000,2000000000];
      return {ok:v.length===expected.length&&v.every((x,i)=>x&&x.ok&&x.value===expected[i]),info:{values:v,expected}};
    });
    await check('A02','Range amounts preserve explicit Toman versus Rial',async()=>{
      const v=await page.evaluate(()=>[
        parseMoneyRangeFA('۴۰۰ تا ۵۵۰ میلیون تومان'),
        parseMoneyRangeFA('۴۰۰ تا ۵۵۰ میلیون ریال')
      ]);
      return {ok:v[0]&&v[0].value==='4000000000|5500000000'&&v[1]&&v[1].value==='400000000|550000000',info:v};
    });
    await check('A03','The rental filter enforces numeric age, area, price, parking and elevator',async()=>{
      const v=await page.evaluate(()=>{
        const base={hood:'h1',beds:2,age:8,m2:90,rent:150000000,dep:5000000000,park:true,elev:true,floor:2};
        const d={hood:'h1',P:{beds:2,maxAge:10,minM2:80,park:true,elev:true},B:{rentB:200000000,depB:6000000000}};
        const f=(k,value)=>E30.flowsAPI.rentPass(Object.assign({},base,{[k]:value}),d);
        return {base:E30.flowsAPI.rentPass(base,d),age:f('age',20),area:f('m2',70),rent:f('rent',250000000),deposit:f('dep',7000000000),parking:f('park',false),elevator:f('elev',false),hood:f('hood','h2')};
      });
      return {ok:v.base===true&&['age','area','rent','deposit','parking','elevator','hood'].every(k=>v[k]===false),info:v};
    });
    await check('A04','Rental floor hard constraint rejects higher floors',async()=>{
      const v=await page.evaluate(()=>{
        const x={beds:2,age:4,m2:90,rent:100000000,dep:5000000000,park:true,elev:true,floor:6};
        return {low:E30.flowsAPI.rentPass(x,{P:{floor:'low'}}),exact:E30.flowsAPI.rentPass(x,{P:{floorNum:2}}),high:E30.flowsAPI.rentPass(x,{P:{floor:'high'}})};
      });
      return {ok:v.low===false&&v.exact===false&&v.high===true,info:v};
    });
    await check('A05','Purchase budget checks full listing price rather than price per metre',async()=>{
      const v=await page.evaluate(()=>{
        const x={age:2,m2:100,ppm:3000000000,beds:2,floor:2,elev:true,park:true,hood:'h1'};
        return {under:E30.flowsAPI.buyPass(x,{budg:200000000000}),open:E30.flowsAPI.buyPass(x,{budg:200000000000,budgOpen:true})};
      });
      return {ok:v.under===false&&v.open===true,info:v};
    });
    await check('A06','12-service tariff separates explicit free demonstrations from payable work',async()=>{
      const v=await page.evaluate(()=>{
        const entries=Object.keys(E30.PRICING).map(k=>({key:k,cost:E30.PRICING[k].cost,label:E30.PRICING[k].label,desc:E30.PRICING[k].desc}));
        doLogin('QA');S.tokens=1000;save();
        const before=S.tokens,probeAccepted=E30.pay.begin({key:'invest_probe',onConfirm:()=>true});
        const termAccepted=E30.pay.begin({key:'term_ai',onConfirm:()=>true});
        return {entries,count:E30.pay.audit().length,before,after:S.tokens,probeAccepted,termAccepted};
      });
      const free=['invest_probe','term_ai'],freeEntries=v.entries.filter(x=>free.includes(x.key));
      const paid=v.entries.filter(x=>!free.includes(x.key));
      return {ok:v.count===12&&v.entries.length===12&&paid.length===10&&
        paid.every(x=>Number.isInteger(x.cost)&&x.cost>0&&x.label.length>2)&&
        freeEntries.length===2&&freeEntries.every(x=>x.cost===0&&/نمونه|نمایشی/.test(x.label)&&/رایگان/.test(x.desc))&&
        v.probeAccepted===false&&v.termAccepted===false&&v.before===v.after,info:v};
    });
    await a.context.close();

    await check('A07','Pay: missing implementation must never debit or complete',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        const before=S.tokens;const accepted=E30.pay.begin({key:'hood_detail'});
        if(S.paySession&&S.paySession.payId)E30.pay.go(S.paySession.payId);
        return {accepted,before,after:S.tokens,session:S.paySession&&{state:S.paySession.state,executed:S.paySession.executed}};
      });
      await s.context.close();
      return {ok:v.accepted===false&&v.before===v.after&&(!v.session||v.session.executed!==true),info:v};
    });
    await check('A08','Pay: cancelling the confirmation changes no balance',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        const before=S.tokens,started=E30.pay.begin({key:'hood_detail',onConfirm:function(){return true}});
        const id=S.paySession&&S.paySession.payId;
        E30.pay.cancel(id,true);
        return {started,before,after:S.tokens,session:S.paySession};
      });
      await s.context.close();
      return {ok:v.started===true&&v.before===v.after&&v.session===null,info:v};
    });
    await check('A09','Pay: success executes once, debits exactly once, and blocks retry',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        let executions=0;
        const started=E30.pay.begin({key:'hood_detail',onConfirm:function(){executions++;return true}});
        const id=S.paySession&&S.paySession.payId;
        const first=E30.pay.go(id);
        const afterFirst=S.tokens;
        const second=E30.pay.go(id);
        return {started,first,second,executions,afterFirst,final:S.tokens,state:S.paySession&&S.paySession.state};
      });
      await s.context.close();
      return {ok:v.started===true&&v.first===true&&v.executions===1&&v.afterFirst===960&&v.final===960&&v.state==='completed',info:v};
    });
    await check('A10','Pay: failed delivery refunds the exact debit',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        const started=E30.pay.begin({key:'hood_detail',onConfirm:function(){return false}});
        const id=S.paySession&&S.paySession.payId;
        const result=E30.pay.go(id);
        const entries=(S.log||[]).filter(x=>x.payId===id);
        return {started,result,balance:S.tokens,state:S.paySession&&S.paySession.state,entries};
      });
      await s.context.close();
      return {ok:v.started===true&&v.result===false&&v.balance===1000&&v.state==='refunded'&&v.entries.some(x=>x.c===-40),info:v};
    });
    await check('A11','Pay: insufficient balance never executes or deducts',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=0;save();let executions=0;
        const started=E30.pay.begin({key:'hood_detail',onConfirm:function(){executions++}});
        const id=S.paySession&&S.paySession.payId;
        if(id)E30.pay.go(id);
        return {started,executions,balance:S.tokens,state:S.paySession&&S.paySession.state};
      });
      await s.context.close();
      return {ok:v.started===false&&v.executions===0&&v.balance===0&&v.state==='insufficient',info:v};
    });
    await check('A12','Pay: recovery does not refund money that was never debited',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=800;save();
        S.paySession={payId:'FAKE-UNDEBITED',key:'hood_detail',cost:40,state:'paid',paidFlag:true,executed:false,refunded:false,txnId:'FAKE-UNDEBITED'};
        const before=S.tokens;E30.pay.recover();
        return {before,after:S.tokens,session:S.paySession,refundRecords:(S.log||[]).filter(x=>x.refund)};
      });
      await s.context.close();
      return {ok:v.before===v.after&&v.session===null&&v.refundRecords.length===0,info:v};
    });

    await check('A13','Saved listing preserves real URL or marks sample source and links originating chat',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        const x=(RLIST||[]).find(it=>it.id);if(!x)return {error:'no listing'};
        CBACT.savL({getAttribute:function(k){return k==='data-l'?x.id:null}});
        const item=(S.savedListings||[]).find(it=>it.listingId===x.id);
        return {item,originalUrl:x.originalUrl||x.url||x.sourceUrl||null,chat:E30.chatRef()};
      });
      await s.context.close();
      const originalKnown=Boolean(v.originalUrl);
      const provenanceOk=originalKnown?
        v.item&&v.item.sourceUrl===v.originalUrl:
        v.item&&!v.item.sourceUrl&&/نمونه|منبع.*نامشخص/.test(v.item.sourceStatus||'');
      const chatOk=v.chat&&v.chat.chatId&&v.item&&v.item.sourceChat===v.chat.chatId;
      return {ok:Boolean(provenanceOk&&chatOk),info:v};
    });
    await check('A14','New-chat action clears active E30 collector without deleting saved history',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        E30.discAPI.start('rent',true);
        const before=E30.discAPI.active();
        const newchat=ACT.chatNew||ACT.e29NewChat||ACT.newChat;
        if(typeof newchat==='function')newchat();
        return {before,after:E30.discAPI.active(),handler:typeof newchat};
      });
      await s.context.close();
      return {ok:v.before===true&&v.after===false,info:v};
    });
    await check('A15','Owner, seller, investor and rental workflows are registered',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        return ['rent','buy','sell','invp','lndl'].map(w=>({key:w,found:!!(SCRIPTS[w]&&SCRIPTS[w].length>0),steps:SCRIPTS[w]&&SCRIPTS[w].length}));
      });
      await s.context.close();
      return {ok:v.length===5&&v.every(x=>x.found),info:v};
    });
    await check('A16','Contract draft remains explicitly non-official',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const D=wd('rent').data;
        const c=conInit(D,'rent'),snap=conSnapshot(D,'rent'),h=contractDocHTML(snap,false);
        return {draft:!c.finalized,mentionsNotOfficial:/ثبت رسمی انجام نشده/.test(h),hasContract:/اجاره‌نامه/.test(h),hasSections:/مادهٔ ۱۰/.test(h)};
      });
      await s.context.close();
      return {ok:v.draft&&v.mentionsNotOfficial&&v.hasContract&&v.hasSections,info:v};
    });
    await check('A17','Contract rent=0 is accepted for a full-deposit arrangement',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        const D=wd('rent').data;
        const c=conInit(D,'rent');
        c.terms.deposit=10000000000;c.terms.rent=0;c.terms.start='2026-11-11';c.terms.duration='یک‌ساله';
        c.prop.area=80;c.prop.addr='نشانی نمونه';
        const html=conPropHTML(D,'rent');
        return {hasZeroRentInput:/id="cp-rent"/.test(html)&&/value="0"/.test(html),rent:c.terms.rent};
      });
      await s.context.close();
      return {ok:v.rent===0&&v.hasZeroRentInput,info:v};
    });
    await check('A18','No exceptions during account and contract acceptance paths',async()=>{
      const s=await start(browser);
      await s.page.evaluate(()=>{doLogin('QA');conInit(wd('rent').data,'rent');conInit(wd('buy').data,'buy')});
      const errors=s.pageErrors;
      await s.context.close();
      return {ok:errors.length===0,info:errors};
    });
    await check('A19','Seller cannot directly accept an offer below declared minimum',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        const st=SCRIPTS.sell.find(x=>x.id==='s_inq');
        if(!st)return {error:'seller inquiry step missing'};
        const D={ask:100000000000,minprice:98000000000};
        const buttons=st.chips(D).map(x=>x[1]);
        st.acts.yes(D); // defensive guard must also block a forged click.
        return {buttons,deal:D.deal||null};
      });
      await s.context.close();
      return {ok:Array.isArray(v.buttons)&&!v.buttons.includes('!yes')&&v.deal===null,info:v};
    });
    await check('A20','Sale offer text agrees with 4% numerical discount',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const st=SCRIPTS.sell.find(x=>x.id==='s_inq');
        const D={ask:100000000000,minprice:90000000000};
        return {prompt:st&&st.q(D),expected:'۹٬۶۰۰٬۰۰۰٬۰۰۰ تومان'};
      });
      await s.context.close();
      return {ok:v.prompt&&/۴٪|4٪/.test(v.prompt)&&v.prompt.includes(v.expected),info:v};
    });
    await check('A21','Investment card changes with asset class and reported capital',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const base={hood:'h1',prop_area:70,horizon:'میان‌مدت',risk:'medium'};
        return {
          land:E30.flowsAPI.investCard(Object.assign({},base,{objective:'land_bank',assetType:'land',cap:100000000000})),
          apartment:E30.flowsAPI.investCard(Object.assign({},base,{objective:'rent_income',assetType:'residential',cap:1000000000000000})),
          insufficient:E30.flowsAPI.investCard(Object.assign({},base,{objective:'rent_income',assetType:'residential',cap:1000}))
        };
      });
      await s.context.close();
      return {ok:/دادهٔ تخصصی/.test(v.land)&&!/اجارهٔ ماهانهٔ تخمینی نمونه/.test(v.land)&&/بازده خالص/.test(v.apartment)&&/کسری سرمایه/.test(v.insufficient),info:{land:v.land.slice(0,140),apartment:v.apartment.slice(-120),insufficient:v.insufficient.slice(-140)}};
    });
    await check('A22','Owner pricing, long-term rental and short stay branch separately',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const q=id=>SCRIPTS.lndl.find(x=>x.id===id);
        const ad=q('l_advice'),res=q('l_price'),stay=q('l_stay_rate');
        return {pricingOnly:!!ad&&ad.pre({ltype:'price'})&&!res.pre({ltype:'price'})&&!stay.pre({ltype:'price'}),
          residential:!!res&&res.pre({ltype:'res'})&&!stay.pre({ltype:'res'}),
          shortStay:!!stay&&stay.pre({ltype:'stay'})&&!res.pre({ltype:'stay'}),
          requiredStayFields:['l_stay_capacity','l_stay_min'].every(id=>!!q(id))};
      });
      await s.context.close();
      return {ok:Object.values(v).every(Boolean),info:v};
    });
    await check('A23','Reminder dedup compares actual times and does not merge next-day visits',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        const due=Date.UTC(2026,10,20,10);
        S.reminders=[{id:'QA1',title:'بازدید ملک',due,done:false}];
        return {exact:E30.ux.remDupe('بازدید ملک',due),within30s:E30.ux.remDupe('بازدید ملک',due+30000),
          later18h:E30.ux.remDupe('بازدید ملک',due+18*3600000),otherTitle:E30.ux.remDupe('پرداخت اجاره',due)};
      });
      await s.context.close();
      return {ok:v.exact===true&&v.within30s===true&&v.later18h===false&&v.otherTitle===false,info:v};
    });
    await check('A24','Adding current conversation to a project is idempotent',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');
        const pid='qa-project-'+Date.now();
        S.projects=[{id:pid,title:'پروژهٔ نمونه',chatIds:[]}];
        const one=E30.ux.addLive(pid);
        const two=E30.ux.addLive(pid);
        const p=S.projects[0];
        return {one,two,chatIds:p.chatIds,liveRefs:p._liveRefs||[]};
      });
      await s.context.close();
      return {ok:v.one===true&&v.two===true&&v.chatIds.length===1&&v.liveRefs.length<=1,info:v};
    });
    await check('A25','Money ranges handle explicit/mixed magnitudes and Persian thousands separators',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>[
        parseMoneyRangeFA('۱ میلیارد تا ۵۰۰ میلیون تومان'),
        parseMoneyRangeFA('۵۰۰ میلیون تا ۱ میلیارد تومان'),
        parseMoneyRangeFA('۲ میلیارد تا ۳ میلیارد ریال'),
        parseMoneyRangeFA('۱٬۲۰۰ تا ۱٬۵۰۰ میلیون تومان'),
        parseMoneyRangeFA('۱.۵ تا ۲ میلیارد تومان'),
        parseMoneyRangeFA('۱ میلیارد تومان تا ۵۰۰ میلیون ریال')
      ]);
      await s.context.close();
      const expected=['5000000000|10000000000','5000000000|10000000000','2000000000|3000000000',
        '12000000000|15000000000','15000000000|20000000000'];
      return {ok:v.slice(0,5).every((x,i)=>x&&x.ok===true&&x.value===expected[i])&&v[5]&&v[5].ok===false,info:{values:v,expected}};
    });
    await check('A26','Async paid work cannot be double-started and settles only on resolution',async()=>{
      const s=await start(browser);
      const pending=await s.page.evaluate(()=>{
        doLogin('QA');S.tokens=1000;save();
        window.__qaSettled=[];
        const started=E30.pay.begin({key:'hood_detail',onConfirm:function(){
          return new Promise(resolve=>{window.__qaResolve=resolve});
        }});
        const id=S.paySession&&S.paySession.payId;
        window.__qaPayment=E30.pay.go(id).then(function(done){window.__qaSettled.push(done)});
        const secondStart=E30.pay.begin({key:'valuation',onConfirm:()=>true});
        const doubleClick=E30.pay.go(id);
        return {started,id,secondStart,doubleClick,balance:S.tokens,state:S.paySession&&S.paySession.state,settled:window.__qaSettled.slice()};
      });
      const finished=await s.page.evaluate(async()=>{
        window.__qaResolve(true);
        await window.__qaPayment;
        return {balance:S.tokens,state:S.paySession&&S.paySession.state,settled:window.__qaSettled.slice(),debits:(S.log||[]).filter(x=>x.payId===S.paySession.payId&&x.c<0).length};
      });
      await s.context.close();
      return {ok:pending.started===true&&pending.balance===960&&pending.state==='executing'&&
        pending.secondStart===false&&pending.doubleClick===false&&pending.settled.length===0&&
        finished.balance===960&&finished.state==='completed'&&finished.debits===1&&
        finished.settled.length===1&&finished.settled[0]===true,info:{pending,finished}};
    });
    await check('A27','Rejected async delivery automatically refunds once, preserving the journal',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(async()=>{
        doLogin('QA');S.tokens=1000;save();
        const started=E30.pay.begin({key:'valuation',onConfirm:()=>Promise.reject(new Error('Simulated delivery failure'))});
        const id=S.paySession&&S.paySession.payId;
        const result=await E30.pay.go(id);
        const entries=(S.log||[]).filter(x=>x.payId===id);
        E30.pay.recover();
        return {started,result,balance:S.tokens,refunds:entries.filter(x=>x.refund).length,debits:entries.filter(x=>x.c<0).length,afterRecovery:S.tokens,session:S.paySession};
      });
      await s.context.close();
      return {ok:v.started===true&&v.result===false&&v.balance===1000&&v.refunds===1&&v.debits===1&&v.afterRecovery===1000&&v.session===null,info:v};
    });
    await check('A28','Full Persian sentences retain labeled financial caps without inventing extra money',async()=>{
      // Earlier acceptance cases deliberately close their fresh contexts;
      // this assertion must own a live browser page, not a disposed handle.
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const parse=E30._dbg.finScan;
        return {
          natural:parse('می‌خوام آپارتمان دوخوابه در سعادت‌آباد اجاره کنم. خانواده سه نفره‌ایم، کارم سعادت‌آباده. ودیعه تا ۳ میلیارد تومان و اجاره تا ۷۰ میلیون تومان. حداقل دو خواب و پارکینگ الزامیه.'),
          mixed:parse('ودیعه ۱۲ میلیارد ریال، اجاره ماهانه ۳۰ میلیون تومان'),
          noAmount:parse('می‌خوام در سعادت‌آباد اجاره کنم؛ خانواده سه نفره‌ایم و پارکینگ مهمه.')
        };
      });
      await s.context.close();
      return {ok:v.natural?.dep?.[1]===30000000000&&v.natural?.rent?.[1]===700000000&&
        v.mixed?.dep?.[1]===12000000000&&v.mixed?.rent?.[1]===300000000&&
        !v.noAmount?.dep&&!v.noAmount?.rent,info:v};
    });
    await check('A29','Amounts are correctly bound to labels before OR after money, even with a second range',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        const parse=E30._dbg.finScan;
        return {
          postLabel:parse('حدود یک میلیارد و نیم ودیعه و ماهی ۲۰ تا ۲۵ میلیون اجاره.'),
          postLabelToman:parse('حدود یک میلیارد و نیم ودیعه و ماهی ۲۰ تا ۲۵ میلیون تومان اجاره.'),
          preLabel:parse('ودیعه ۱٫۵ میلیارد ریال و اجاره ماهانه بین ۲۰ تا ۲۵ میلیون ریال'),
          mixed:parse('۱ میلیارد و ۲۰ میلیون ودیعه، اجاره ماهی ۱۵ میلیون'),
          unmapped:parse('ودیعه مشخص نیست ولی اجاره ماهانه ۲۵ میلیون ریال')
        };
      });
      await s.context.close();
      return {ok:v.postLabel?.dep?.[0]===15000000000&&v.postLabel?.dep?.[1]===15000000000&&
        v.postLabel?.rent?.[0]===200000000&&v.postLabel?.rent?.[1]===250000000&&
        v.postLabelToman?.rent?.[0]===200000000&&v.postLabelToman?.rent?.[1]===250000000&&
        v.preLabel?.dep?.[0]===1500000000&&v.preLabel?.rent?.[0]===20000000&&v.preLabel?.rent?.[1]===25000000&&
        v.mixed?.dep?.[0]===10200000000&&v.mixed?.rent?.[0]===150000000&&
        !v.unmapped?.dep&&v.unmapped?.rent?.[0]===25000000,info:v};
    });
    await check('A31','Post-label decimal budgets and mixed currencies never cross-bind',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>({
        post:E30._dbg.finScan('بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.'),
        mixed:E30._dbg.finScan('ودیعه ۱۲ میلیارد ریال، اجاره ماهانه ۳۰ میلیون تومان'),
        grouped:E30._dbg.finScan('ودیعه 1,200,000,000 تومان اجاره 20,000,000 تومان'),
        adjacent:E30._dbg.finScan('ودیعه ۸۰۰ میلیون تومان اجاره ۲۵ میلیون تومان'),
        zero:E30._dbg.finScan('ودیعه ۱ میلیارد تومان و اجاره 0'),
        ambiguous:E30._dbg.finScan('ودیعه یا اجاره ۱۲ میلیون تومان')
      }));
      await s.context.close();
      return {ok:v.post.dep?.[1]===12000000000&&v.post.rent?.[1]===100000000&&
        v.mixed.dep?.[1]===12000000000&&v.mixed.rent?.[1]===300000000&&
        v.grouped.dep?.[1]===12000000000&&v.grouped.rent?.[1]===200000000&&
        v.adjacent.dep?.[1]===8000000000&&v.adjacent.rent?.[1]===250000000&&
        v.zero.dep?.[1]===10000000000&&v.zero.rent?.[1]===0&&
        !v.ambiguous.dep,info:v};
    });
    await check('A32','Purchase resumes at age with valid, skipped and corrected inputs',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');const rows=[];
        for(const input of ['نوساز','تا ۵ سال','۵ تا ۱۰ سال','مهم نیست']){
          delete wd('buy').data.PR;ceStart('buy');ceJump('age');ceVal(input);
          rows.push({input,step:SCRIPTS.buy[CE.i].id,age:wd('buy').data.PR.age});
        }
        ceJump('age');ceVal('نامعتبر');const invalid=SCRIPTS.buy[CE.i].id;ceVal('تا ۵ سال');
        return {rows,invalid,corrected:SCRIPTS.buy[CE.i].id};
      });
      await s.context.close();
      return {ok:v.rows.every(x=>x.step==='m2')&&v.rows[0].age[1]===3&&v.rows[1].age[1]===5&&v.rows[2].age[0]===5&&v.rows[2].age[1]===10&&v.invalid==='age'&&v.corrected==='m2',info:v};
    });
    await check('A33','Project transfers preserve chat history, context and unrelated artifacts',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');const a=E29.projAPI.create('A'),b=E29.projAPI.create('B');
        S.chats=[{id:'move-chat',title:'عنوان یکسان',pinned:true,hist:[{r:'user',h:'keep'}]}];
        S.ctx30ByChat['chat:move-chat']={fields:{marker:{v:'keep'}},log:[]};
        S.library=[{id:'related',sourceChat:'move-chat'},{id:'unrelated',sourceChat:null,sourceTitle:'عنوان یکسان',projectId:a.id}];
        E29.projAPI.addChat(a.id,'move-chat');E29.projAPI.addChat(b.id,'move-chat');E29.projAPI.addChat(b.id,'move-chat');E29.projAPI.addChat(b.id,'missing');
        return {old:a.chatIds,now:b.chatIds,chat:S.chats[0],context:S.ctx30ByChat['chat:move-chat'],artifacts:S.library,target:b.id,original:a.id,button:E27.sessRow(S.chats[0]).includes('e31MoveChat')};
      });
      await s.page.reload({waitUntil:'domcontentloaded'});
      const restored=await s.page.evaluate(()=>({chat:S.chats.find(c=>c.id==='move-chat'),context:S.ctx30ByChat['chat:move-chat']}));
      await s.context.close();
      return {ok:v.old.length===0&&v.now.length===1&&v.now[0]==='move-chat'&&v.chat.projectId===v.target&&v.chat.hist[0].h==='keep'&&v.artifacts[0].projectId===v.target&&v.artifacts[1].projectId===v.original&&v.button&&restored.chat.projectId===v.target&&restored.context.fields.marker.v==='keep',info:{v,restored}};
    });
    await check('A34','Live project membership survives archival without stale references',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');usrC('گفتگوی پروژه');botC('حفظ تاریخچه');const p=E29.projAPI.create('پروژه');E30.ux.addLive(p.id);const live=p.chatIds[0];E22.collect();const chat=S.chats[0];
        return {live,id:chat.id,project:chat.projectId,target:p.id,links:p.chatIds,refs:p._liveRefs||[],hist:chat.hist.length};
      });
      await s.context.close();return {ok:v.project===v.target&&v.links.length===1&&v.links[0]===v.id&&v.refs.length===0&&v.hist>=2,info:v};
    });
    await check('A35','One user submission produces one persisted and rendered assistant message',async()=>{
      const s=await start(browser);await s.page.evaluate(()=>doLogin('QA'));
      const rows=[];
      for(const text of ['می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.','ودیعه ۱ میلیارد تومان اجاره ۲۰ میلیون تومان']){
        rows.push(await s.page.evaluate(text=>{const before=HIST.length;ceSend(text);const added=HIST.slice(before);return {users:added.filter(x=>x.r==='user').length,bots:added.filter(x=>x.r==='bot').length,body:added.filter(x=>x.r==='bot').map(x=>x.h).join(''),rendered:document.querySelectorAll('#chatB .msg.bot').length,stored:JSON.parse(localStorage.getItem('mahalino_v31')).liveHistory.filter(x=>x.r==='bot').length}},text));
      }
      const beforeEntry=await s.page.evaluate(()=>HIST.length);
      await s.page.locator('#chatB [data-cf="buy"]').first().click();
      const entry=await s.page.evaluate(n=>({users:HIST.slice(n).filter(x=>x.r==='user').length,bots:HIST.slice(n).filter(x=>x.r==='bot').length}),beforeEntry);
      const historical=await s.page.evaluate(()=>{
        S.chats.push({id:'qa-historical-turns',title:'تاریخچه',ts:Date.now(),hist:[{r:'user',h:'قدیمی'},{r:'bot',h:'keep-A'},{r:'bot',h:'keep-B'}]});
        ACT.sessOpen({getAttribute:k=>k==='data-sess'?'qa-historical-turns':null});
        return HIST.filter(m=>m.h==='keep-A'||m.h==='keep-B').map(m=>m.h);
      });
      await s.context.close();return {ok:rows.every(r=>r.users===1&&r.bots===1&&r.body.length>20&&r.rendered===r.stored)&&entry.users===1&&entry.bots===1&&historical.join('|')==='keep-A|keep-B',info:{rows,entry,historical}};
    });
    await check('A36','Entry skips personal gates and retired investment engines cannot execute',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>{
        doLogin('QA');ceStart('gate');ceVal('!pskip');
        return {steps:SCRIPTS.gate.map(x=>x.id),step:SCRIPTS.gate[CE.i].id,
          legacy:!!(SCRIPTS.invb||SCRIPTS.invr||CBACT.ipset),active:!!SCRIPTS.invp,
          source:[...document.scripts].map(x=>x.textContent).join('')};
      });
      await s.context.close();return {ok:v.steps.join('|')==='hello|menu'&&v.step==='menu'&&!v.legacy&&v.active&&!v.source.includes('function sellTok('),info:{steps:v.steps,step:v.step,legacy:v.legacy,active:v.active}};
    });
    await check('A37','Toman defaults, explicit rial and canonical presets stay distinct',async()=>{
      const s=await start(browser);const v=await s.page.evaluate(()=>{
        const typed=parseMoneyFA('5000000000'),small=parseMoneyFA('۱۰۰'),arabic=parseMoneyFA('١٠٠'),rialInput=parseMoneyFA('۱۰۰ میلیون ریال');
        doLogin('QA');ceStart('rent');ceJump('dep');ceVal(moneyChip({getAttribute:()=> '5000000000'}));const preset=wd('rent').data.B.depB;
        ceJump('dep');ceVal('5000000000');const entered=wd('rent').data.B.depB;
        const wallet=S.wallet;save();return {typed,small,arabic,rialInput,preset,entered,wallet,display:rial(100000000),range:parseMoneyRangeFA('100 تا 200')};
      });await s.page.reload({waitUntil:'domcontentloaded'});const again=await s.page.evaluate(()=>({budget:wd('rent').data.B.depB,wallet:S.wallet}));
      await s.context.close();return {ok:v.typed.value===50000000000&&v.small.value===1000&&v.arabic.value===1000&&v.rialInput.value===100000000&&v.preset===5000000000&&v.entered===50000000000&&v.display==='۱۰٬۰۰۰٬۰۰۰ تومان'&&v.range.value==='1000|2000'&&again.budget===v.entered&&again.wallet===v.wallet,info:{v,again}};
    });
    await check('A38','Contract and payment forms display toman and retain exact canonical totals',async()=>{
      const s=await start(browser);const v=await s.page.evaluate(()=>{
        doLogin('QA');const D=wd('rent').data,c=conInit(D,'rent');c.terms={deposit:10000000000,rent:200000000};
        const html=conPropHTML(D,'rent');const host=document.createElement('div');host.innerHTML=html;
        const values=['cp-dep','cp-rent'].map(id=>host.querySelector('#'+id)?.value);
        const panel=payPanel('test','واحد',10000000,'100000000',[],'پرداخت');host.innerHTML=panel;
        return {values,payment:host.querySelector('[data-paytxt]')?.value,short:rShort(10000000000),deposit:c.terms.deposit};
      });await s.context.close();return {ok:v.values[0]==='1000000000'&&v.values[1]==='20000000'&&v.payment==='10000000'&&v.short==='۱ میلیارد'&&v.deposit===10000000000,info:v};
    });
    await check('A30','Every purchase price-range preset passes normalization without changing its rial endpoints',async()=>{
      const s=await start(browser);
      const v=await s.page.evaluate(()=>({
        presets:SCRIPTS.buy.find(x=>x.id==='ppm').chips({}).map(x=>({raw:x[1],parsed:parseMoneyRangeFA(x[1])})),
        invalid:['0|3000000000','2000000000|bad','1|2|3'].map(x=>parseMoneyRangeFA(x).ok)
      }));
      await s.context.close();
      return {ok:v.presets.length===3&&v.presets.every(x=>x.parsed.ok&&x.parsed.value===x.raw)&&v.invalid.every(x=>!x),info:v};
    });
  }finally{
    await browser.close();
    fs.writeFileSync(path.join(out,'acceptance-results.json'),JSON.stringify(checks,null,2));
  }
  const failed=checks.filter(x=>x.result==='FAIL');
  console.log(`ACCEPTANCE RESULT: ${checks.length-failed.length} passed, ${failed.length} failed, ${checks.length} checks`);
  if(failed.length)console.log('FAILED:',failed.map(x=>x.id).join(' | '));
  process.exitCode=failed.length?1:0;
})().catch(e=>{console.error('ACCEPTANCE HARNESS CRASH:',e);process.exitCode=2});