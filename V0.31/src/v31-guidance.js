/* Mahalino V0.31 — deterministic, AI-free, chat-first prompt guidance.
   Each suggested phrase maps to an executable action or an existing routed flow.
   The registry is the single source of truth for the preview prompts. */
E30.guide=(function(){
  'use strict';
  var REGISTRY=[
    {id:'rent',group:'search',title:'جست‌وجوی رهن و اجاره',prompt:'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.',aliases:['میخوام خونه اجاره کنم','دنبال خانه اجاره‌ای هستم'],action:'discover:rent',slots:['city','budget_dep','budget_rent','m2','rooms','hood'],result:'شروع کشف نیاز اجاره',next:['rent-budget','rent-area','rent-specs'],test:'guide-rent'},
    {id:'rent-budget',group:'search',title:'ثبت بودجهٔ اجاره',prompt:'می‌خواهم سقف ودیعه و اجاره ماهانه را مشخص کنم.',aliases:['۱.۲ میلیارد رهن و ماهی ۱۰ میلیون'],action:'native',slots:['budget_dep','budget_rent'],result:'ثبت با پارسر مالی و درخواست تأیید',next:['rent-specs','rent-area','sample'],test:'guide-budget'},
    {id:'rent-specs',group:'search',title:'شرایط ملک',prompt:'حداقل ۶۰ متر و یک خواب می‌خوام.',aliases:['حداقل ۶۰ متر و ۱ خواب'],action:'native',slots:['m2','rooms'],result:'به‌روزرسانی قیود جست‌وجو',next:['sample','rent-area','map'],test:'guide-specs'},
    {id:'rent-area',group:'neighborhood',title:'تمرکز بر محدودهٔ انقلاب',prompt:'اول محله‌های اطراف انقلاب رو برای اجاره ارزیابی کن.',aliases:['گفتم دیگه سمت انقلاب','اطراف انقلاب رو بررسی کن'],action:'compare',slots:['area_reference'],result:'مقایسهٔ شفاف دادهٔ نمونه، بدون تثبیت محله به‌عنوان شرط قطعی',next:['compare','sample','map'],test:'guide-area'},
    {id:'sample',group:'search',title:'نمایش آگهی نمونه',prompt:'با همین شرایط آگهی‌های نمونه رو نشون بده.',aliases:['نمونه ملک‌ها را نشان بده'],action:'sample',slots:['budget_dep','budget_rent','m2','rooms','hood'],result:'کارت‌های صریحاً ساختگی از دادهٔ موجود',next:['rent-area','map','rent'],test:'guide-sample'},
    {id:'buy',group:'search',title:'جست‌وجوی خرید',prompt:'می‌خوام برای خرید آپارتمان در تهران راهنمایی بشم.',aliases:['میخوام آپارتمان بخرم'],action:'discover:buy',slots:['buy_budget','m2','rooms','hood'],result:'شروع کشف نیاز خرید',next:['map','valuation','neighborhood'],test:'guide-buy'},
    {id:'sell',group:'seller',title:'فروش ملک',prompt:'می‌خوام ملکم رو بفروشم و قیمت مناسبش رو بررسی کنم.',aliases:['میخوام خونه‌ام رو بفروشم'],action:'discover:sell',slots:['prop_area','prop_rooms','ownership','expected_price'],result:'شروع فرایند فروشنده',next:['valuation','contracts','map'],test:'guide-sell'},
    {id:'invest',group:'investment',title:'بررسی سرمایه‌گذاری',prompt:'می‌خوام برای سرمایه‌گذاری در ملک گزینه‌ها رو بررسی کنم.',aliases:['میخوام توی ملک سرمایه گذاری کنم'],action:'discover:invest',slots:['invest_capital','invest_horizon','invest_risk'],result:'شروع فرایند سرمایه‌گذاری',next:['neighborhood','map','valuation'],test:'guide-invest'},
    {id:'landlord',group:'seller',title:'ثبت درخواست موجر',prompt:'ملک خودم رو می‌خوام اجاره بدم.',aliases:['من موجرم و میخوام ملکم را اجاره بدهم'],action:'discover:landlord',slots:['listing_intent','prop_area','ownership'],result:'شروع فرایند موجر',next:['contracts','services','map'],test:'guide-landlord'},
    {id:'neighborhood',group:'neighborhood',title:'تحلیل محله',prompt:'می‌خوام محله‌های تهران رو از نظر قیمت و دسترسی مقایسه کنم.',aliases:['محله های تهران رو مقایسه کن'],action:'compare',slots:['hood','area_reference'],result:'مقایسه با برچسب دادهٔ داخلی',next:['rent-area','map','sample'],test:'guide-neighborhood'},
    {id:'compare',group:'neighborhood',title:'مقایسهٔ قیمت محله‌ها',prompt:'محله‌های اطراف انقلاب رو از نظر قیمت و دسترسی مقایسه کن.',aliases:['قیمت محله‌های نزدیک انقلاب رو مقایسه کن'],action:'compare',slots:['area_reference'],result:'مقایسهٔ قابل ردیابی با دادهٔ نمونه',next:['sample','map','rent'],test:'guide-compare'},
    {id:'map',group:'neighborhood',title:'نقشه داخل گفت‌وگو',prompt:'نقشه محله‌ها رو همین‌جا نشون بده.',aliases:['نقشه رو نشون بده'],action:'map',slots:['hood'],result:'نقشهٔ موجود داخل چت',next:['compare','sample','rent'],test:'guide-map'},
    {id:'valuation',group:'services',title:'تخمین نمونهٔ ارزش ملک',prompt:'می‌خوام ارزش ملک رو با داده‌های نمونه تخمین بزنم.',aliases:['تخمین ارزش ملک','ارزش‌گذاری ملک'],action:'valuation',slots:['hood','prop_area','prop_age'],result:'فرم داخلی و تأیید هزینه پیش از اجرا',next:['sell','neighborhood','contracts'],test:'guide-valuation'},
    {id:'contracts',group:'contract',title:'مدیریت قرارداد',prompt:'قراردادهای ذخیره‌شده رو داخل چت نشون بده.',aliases:['قراردادهای من رو نشون بده'],action:'contracts',slots:['contract_id'],result:'فهرست قراردادهای واقعاً ذخیره‌شده',next:['contract-start','termination','library'],test:'guide-contracts'},
    {id:'contract-start',group:'contract',title:'شروع قرارداد اجاره',prompt:'می‌خوام مسیر تنظیم قرارداد اجاره رو داخل چت شروع کنم.',aliases:['میخوام قرارداد اجاره تنظیم کنم'],action:'contract-start',slots:['budget_dep','budget_rent','contract_details'],result:'ورود به کشف نیاز و سپس مسیر قرارداد؛ بدون ثبت خودکار',next:['contracts','rent-budget','rent'],test:'guide-contract-start'},
    {id:'termination',group:'contract',title:'پیگیری فسخ',prompt:'می‌خوام وضعیت فسخ قرارداد و چک‌لیست تسویه رو ببینم.',aliases:['چک‌لیست فسخ قرارداد را بده'],action:'termination',slots:['contract_id'],result:'چک‌لیست رایگان، بدون امضا یا فسخ خودکار',next:['contracts','library'],test:'guide-termination'},
    {id:'services',group:'services',title:'پیش‌درخواست خدمات ملک',prompt:'می‌خوام برای خدمات و تعمیرات ملک درخواست ثبت کنم.',aliases:['درخواست تعمیرات ملک دارم'],action:'services',slots:['service_type','details'],result:'پیش‌درخواست درون‌چتی، نه سفارش نهایی',next:['contracts','library'],test:'guide-services'},
    {id:'guaranteed',group:'services',title:'پیش‌درخواست اجارهٔ تضمینی',prompt:'می‌خوام پیش‌درخواست اجارهٔ تضمینی رو ثبت کنم.',aliases:['اجاره تضمینی چطور است'],action:'guaranteed',slots:['address','prop_area'],result:'فرم پیش‌درخواست بدون ادعای تضمین',next:['contracts','library'],test:'guide-guaranteed'},
    {id:'saved',group:'library',title:'ملک‌های ذخیره‌شده',prompt:'ملک‌های ذخیره‌شده‌ام رو همین‌جا نشون بده.',aliases:['آگهی‌های ذخیره‌شده را ببینم'],action:'saved',slots:[],result:'خلاصهٔ واقعی ذخیره‌های مرورگر در چت',next:['library','rent','buy'],test:'guide-saved'},
    {id:'library',group:'library',title:'گزارش‌های کتابخانه',prompt:'گزارش‌ها و فایل‌های ذخیره‌شده‌ام رو در چت مرور کن.',aliases:['گزارش‌های کتابخانه را نشان بده'],action:'library',slots:[],result:'خلاصهٔ واقعی آثار ذخیره‌شده در چت',next:['contracts','saved','valuation'],test:'guide-library'},
    {id:'projects',group:'productivity',title:'پروژه‌های فعلی',prompt:'پروژه‌های فعلی من رو داخل چت خلاصه کن.',aliases:['پروژه‌های من رو نشون بده'],action:'projects',slots:[],result:'فهرست پروژه‌های موجود بدون ساخت یا حذف',next:['library','saved','rent'],test:'guide-projects'},
    {id:'reminder',group:'productivity',title:'ایجاد یادآور در چت',prompt:'فردا ساعت ۱۰ یادآوری کن که پیگیر بازدید ملک بشم.',aliases:['فردا ساعت ۱۰ پیگیری بازدید رو یادآوری کن'],action:'native',slots:['title','due'],result:'تحویل به موتور یادآور فعلی، بدون ساخت خودکار توسط راهنما',next:['projects','rent','saved'],test:'guide-reminder'},
    {id:'stay',group:'special',title:'اقامت کوتاه‌مدت',prompt:'می‌خوام اقامت کوتاه‌مدت رو بررسی کنم.',aliases:['دنبال اقامت کوتاه مدت هستم'],action:'flow:stay',slots:['stay_dates','budget'],result:'فلو داخلی موجود، در صورت نصب',next:['services','map'],test:'guide-stay'},
    {id:'build',group:'special',title:'ساخت و مصالح',prompt:'می‌خوام مسیر ساخت و مصالح رو بررسی کنم.',aliases:['خدمات ساخت و مصالح میخوام'],action:'flow:build',slots:['project_type','budget'],result:'فلو داخلی موجود، در صورت نصب',next:['services','projects'],test:'guide-build'},
    {id:'development',group:'special',title:'پروژه‌های ساختمانی',prompt:'می‌خوام پروژه‌های ساختمانی رو بررسی کنم.',aliases:['پروژه‌های ساختمانی جدید'],action:'flow:mkt',slots:['project_type','hood'],result:'فلو داخلی موجود، در صورت نصب',next:['invest','projects'],test:'guide-development'}
  ];
  var PREFS={
    budget_pair:['سقف ودیعه و اجاره','می‌خواهم سقف ودیعه و اجاره ماهانه را مشخص کنم.'],
    persona:['پرسونا','می‌خواهم پرسونای جست‌وجویم را مشخص کنم.'],
    household:['ترکیب خانوار','می‌خواهم ترکیب خانوار را مشخص کنم.'],
    hood:['محدوده','می‌خواهم محدوده جست‌وجو را مشخص کنم.'],
    m2:['متراژ','می‌خواهم حداقل متراژ را مشخص کنم.'],rooms:['تعداد خواب','می‌خواهم تعداد خواب را مشخص کنم.'],
    prop_age:['عمر بنا','می‌خواهم عمر بنای دلخواه را مشخص کنم.'],
    floor_preference:['طبقه','می‌خواهم طبقه دلخواه را مشخص کنم.'],
    prefs:['امکانات','می‌خواهم امکانات دلخواه را مشخص کنم.']
  };
  function add(r){REGISTRY.push(Object.assign({group:'search',aliases:[],slots:[],next:[],test:'journey-'+r.id,result:'خروجی داخلی با پایان مشخص'},r))}
  Object.keys(PREFS).filter(function(slot){return slot!=='budget_pair'}).forEach(function(slot){var x=PREFS[slot];add({id:'need-'+slot.replace(/_/g,'-').replace('m2','size'),title:x[0],prompt:x[1],action:'preference:'+slot,slots:[slot]})});
  add({id:'skip-preference',title:'رد ترجیح',prompt:'این ترجیح را فعلاً رد کن.',action:'skip'});
  add({id:'results',title:'آگهی‌های منطبق',prompt:'با اطلاعات فعلی آگهی‌ها را نشان بده.',action:'results'});
  add({id:'hood-results',title:'محله‌های مناسب',prompt:'با اطلاعات فعلی محله‌های مناسب را نشان بده.',action:'hood-results'});
  add({id:'resume',title:'بازگشت به خدمت',prompt:'به خدمت قبلی برگرد.',action:'resume'});
  ['student','couple','young','family'].forEach(function(v,i){add({id:'persona-'+v,title:['دانشجو','زوج','جوان','خانواده'][i],prompt:['دانشجو هستم.','برای یک زوج جست‌وجو می‌کنم.','برای یک جوان جست‌وجو می‌کنم.','برای خانواده جست‌وجو می‌کنم.'][i],action:'persona:'+v})});
  REGISTRY.forEach(function(r){
    if(r.id==='rent-budget'){r.prompt=PREFS.budget_pair[1];r.action='preference:budget_pair';r.aliases=[]}
    if(r.id==='rent-specs'){r.aliases=[];r.prompt='می‌خواهم متراژ و تعداد خواب را مشخص کنم.';r.action='preference:m2'}
    if(r.id==='rent-area'){r.prompt='محله‌های دارای داده را برای اجاره ارزیابی کن.'}
    if(r.id==='compare'){r.prompt='محله‌های دارای داده را از نظر قیمت مقایسه کن.'}
  });
  Object.keys(E30.discAPI?E30.discAPI.SLOT_LABEL:{}).forEach(function(slot){
    if(PREFS[slot]||slot==='budget_dep'||slot==='budget_rent')return;
    var id='need-'+slot.replace(/_/g,'-').replace('m2','size');
    add({id:id,title:E30.discAPI.SLOT_LABEL[slot],prompt:'می‌خواهم «'+E30.discAPI.SLOT_LABEL[slot]+'» را مشخص کنم.',action:'preference:'+slot,slots:[slot]});
  });
  add({id:'start-service',title:'شروع خدمت',prompt:'خدمت این مسیر را با اطلاعات فعلی شروع کن.',action:'start-service'});
  var BY_ID={},BY_PROMPT={};
  function norm(s){return String(s||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f]/g,' ').replace(/\s+/g,' ').replace(/[.!؟?]+$/g,'').trim().toLowerCase()}
  REGISTRY.forEach(function(r){
    BY_ID[r.id]=r;
    [r.prompt].concat(r.aliases||[]).forEach(function(p){var k=norm(p);if(!BY_PROMPT[k])BY_PROMPT[k]=r});
  });
  var GROUPS={
    home:['rent','buy','neighborhood','invest'],
    rent:['rent-budget','rent-area','rent-specs'],
    'rent-budget':['rent-specs','rent-area','sample'],
    'rent-specs':['sample','rent-area','map'],
    'rent-area':['compare','sample','map'],
    sample:['rent-area','map','rent'],
    buy:['valuation','neighborhood','map'],
    sell:['valuation','contracts','map'],
    invest:['neighborhood','map','valuation'],
    landlord:['contracts','services','map'],
    neighborhood:['compare','map','rent'],
    compare:['sample','map','rent'],
    map:['compare','sample','rent'],
    valuation:['sell','neighborhood','contracts'],
    contracts:['contract-start','termination','library'],
    'contract-start':['rent-budget','contracts','rent'],
    termination:['contracts','library'],
    services:['guaranteed','contracts','library'],
    guaranteed:['services','contracts','library'],
    saved:['library','rent','buy'],
    library:['saved','contracts','valuation'],
    projects:['library','saved','rent'],
    reminder:['projects','rent','saved'],
    stay:['map','services'],
    build:['services','projects'],
    development:['invest','projects']
  };
  function state(){
    var c=E30.discAPI&&E30.discAPI.ctx?E30.discAPI.ctx():S;
    if(!c.guide31)c.guide31={node:'home',seq:0};
    return c.guide31;
  }
  function can(r){
    if(!r)return false;
    if(r.id==='saved')return !!(S.savedListings||[]).length;
    if(r.id==='library')return !!(S.library||[]).length;
    if(r.id==='projects')return !!(S.projects||[]).length;
    if(r.id==='resume')return !!state().suspended;
    if(r.id==='skip-preference')return !!E30.discAPI.collector().expecting;
    if(r.id==='build')return !!(wd('mkt').data.bid||wd('mkt').data.chosen);
    if(r.id==='termination')return (S.contracts||[]).some(function(c){return c&&c.code});
    if(r.action.indexOf('flow:')===0)return !!(typeof SCRIPTS!=='undefined'&&SCRIPTS[r.action.split(':')[1]]);
    if(r.action==='valuation')return typeof CBACT.e30ValOpen==='function';
    if(r.action==='contracts')return typeof CBACT.e30ContractList==='function';
    if(r.action==='services')return typeof CBACT.e30RequestService==='function';
    if(r.action==='guaranteed')return typeof CBACT.e30RequestGRT==='function';
    if(r.action==='contract-start')return !!E30.discAPI;
    if(r.action==='map')return typeof E30.chatMap==='function';
    if(r.action==='native'&&r.id==='reminder')return typeof E28!=='undefined';
    return true;
  }
  function effectiveNode(){
    var node=state().node;
    var key=S.ctx30ActiveKey,col=S.ctx30Collectors&&S.ctx30Collectors[key];
    /* Free text and legacy entry buttons must receive the same guidance as
       an exact suggested phrase. Never override a deliberate side-task. */
    if(col&&col.active){
      if(col.wf==='rent'&&['home','rent','rent-budget','rent-specs'].indexOf(node)>=0){
        var dep=E30.discAPI.getF('budget_dep'),month=E30.discAPI.getF('budget_rent');
        if(dep&&month){
          return E30.discAPI.getF('m2')&&E30.discAPI.getF('rooms')?'rent-specs':'rent-budget';
        }
        return 'rent';
      }
      if(node==='home'&&BY_ID[col.wf])return col.wf;
    }
    if(node==='home'&&CE.f){
      var flowNode={rent:'rent',buy:'buy',sell:'sell',invp:'invest',lndl:'landlord'};
      return flowNode[CE.f]||'home';
    }
    return node;
  }
  function suggestions(){
    var col=E30.discAPI.collector(),st=state(),ids=[];
    if(col.active){
      if(col.expecting==='persona')ids=['persona-student','persona-couple','persona-young','persona-family','skip-preference','results'];
      else if(col.expecting||col.fix)ids=['skip-preference'].concat(col.wf==='rent'||col.wf==='buy'?['results']:['start-service']);
      else{
        var fields=E30.discAPI.missing(col.wf),seen={};
        fields.forEach(function(f){var id=f.id==='budget_dep'||f.id==='budget_rent'?'rent-budget':'need-'+f.id.replace(/_/g,'-').replace('m2','size');if(!seen[id]&&BY_ID[id]){ids.push(id);seen[id]=1}});
        ids=ids.slice(0,4).concat(col.wf==='rent'||col.wf==='buy'?['hood-results','results']:['start-service']);
      }
    }else if(CE.f&&CE.f!=='gate'){return []}
    else ids=GROUPS[effectiveNode()]||GROUPS.home;
    if(st.suspended)ids=ids.concat(['resume']);
    return ids.map(function(k){return BY_ID[k]}).filter(can);
  }
  function card(){
    if(!S.auth||CURRENT!=='landing')return '';
    var options=suggestions();
    if(!options.length)return '';
    var st=state();st.seq=(st.seq||0)+1;
    return '<section class="e31-guide" aria-label="پرامپت‌های پیشنهادی"><div class="e31-guide-title">✦ پرامپت‌های پیشنهادی برای ادامه</div>'+
      options.map(function(r){return '<button type="button" class="e31-prompt" data-cba="e31Prefill" data-e31-id="'+r.id+'" data-e31-seq="'+st.seq+'">'+
        esc(r.prompt)+' <span aria-hidden="true">↵</span></button>'}).join('')+
      '<p class="e31-guide-note">متن را انتخاب کنید، سپس در کادر گفت‌وگو ارسال یا ویرایش کنید. این پیش‌نمایش بدون AI است.</p></section>';
  }
  function setNode(n){
    var s=state();s.node=n;s.seq=(s.seq||0)+1;
    try{save()}catch(e){}
  }
  function showList(arr,heading,empty,fmt){
    if(!arr||!arr.length){botC(empty,null);return}
    botC('<b>'+esc(heading)+'</b><div class="sect">'+arr.slice(0,5).map(fmt).join('')+
      '</div><p class="note">اطلاعات از همین مرورگر خوانده شده است؛ هیچ داده‌ای ساخته نشده.</p>',null);
  }
  function queryData(){
    var flow=E30.discAPI.collector().wf||(CE.f==='buy'?'buy':'rent'),f=E30.discAPI.getF,D=wd(flow==='buy'?'buy':'rent').data;
    defP(D);if(flow==='buy')defPR(D);
    var dep=f('budget_dep'),rent=f('budget_rent'),bud=f('buy_budget'),rules=f('prefRules')||{};
    if(flow==='buy'){
      D.budg=bud&&bud.v?bud.v[1]:0;D.budgOpen=!bud||!!bud.open;
      D.PR={age:f('prop_age_range')||[0,f('prop_age')==null?100:+f('prop_age')],m2:[f('m2')||0,1e6],ppm:[0,Infinity],beds:f('rooms')||0,floorR:[0,100],prefRules:rules};
    }else{
      D.B={depB:dep&&dep.v?dep.v[1]:Infinity,rentB:rent&&rent.v?rent.v[1]:Infinity};
      D.depOpen=!dep||!!dep.open;D.rentBOpen=!rent||!!rent.open;
      D.P.beds=f('rooms')||0;D.P.minM2=f('m2')||0;D.P.maxAge=f('prop_age')==null?100:+f('prop_age');D.P._ageHard=f('prop_age')!=null;D.P.minAge=(f('prop_age_range')||[0])[0];D.P.prefRules=rules;
    }
    D.hood=f('hood')||null;
    var floor=f('floor_preference');if(floor&&floor.level==='required'){if(flow==='buy')D.PR.requiredFloor=floor;else D.P.requiredFloor=floor}
    return {flow:flow,D:D};
  }
  function compare(text){
    var list=HOODS.filter(function(h){return Number.isFinite(h.buyBase)}),q=queryData();
    if(/اطراف|نزدیک/.test(text)&&/انقلاب/.test(text)){
      botC('رابطهٔ جغرافیایی معتبر برای «اطراف انقلاب» در دادهٔ نمونه موجود نیست؛ مقایسهٔ محله‌های اطراف قابل اجرا نیست. می‌توانید محله‌های دارای داده را مقایسه کنید.',null);return;
    }
    botC('<b>مقایسهٔ نمایشی محله‌ها</b><p class="note">دادهٔ داخلی ساختگی؛ قیمت زنده یا زمان سفر تأییدشده نیست.</p><div class="chcards">'+list.map(function(h){return chatHoodCard(h,q.flow==='buy'?'buy':'rent',q.D)}).join('')+'</div>',null);
  }
  function sample(){
    var q=queryData(),a=q.flow==='buy'?BLIST:RLIST;
    var opts=a.filter(function(x){return (!q.D.hood||x.hood===q.D.hood)&&(q.flow==='buy'?E30.flowsAPI.buyPass(x,q.D):E30.flowsAPI.rentPass(x,q.D))});
    botC('<b>آگهی‌های منطبق با اطلاعات فعلی: '+fa(opts.length,0)+'</b><p class="note">آگهی‌های ساختگی نمونه؛ ترجیحات اعلام‌نشده اعمال نمی‌شوند.</p>'+
      (opts.length?'<div class="chcards">'+opts.map(function(x){return q.flow==='buy'?chatBCard(x,q.D.blist===x.id):chatListCard(x,q.D.listing===x.id)}).join('')+'</div>':'<p>آگهی منطبق پیدا نشد. برای تغییر محدودیت‌ها، ترجیح موردنظر را آگاهانه اصلاح کنید.</p>'),null);
  }
  function suspend(){
    var st=state();if(st.suspended)return;
    if(E30.discAPI.active()||(CE.f&&CE.f!=='gate'))st.suspended={collector:Object.assign({},E30.discAPI.collector()),ce:JSON.parse(JSON.stringify(CE))};
    E30.discAPI.stop();CE.f=null;save();
  }
  function exec(r,t){
    var a=r.action;
    if(a.indexOf('preference:')===0){usrC(t);if(!E30.discAPI.active())E30.discAPI.start(CE.f==='buy'?'buy':'rent',true);E30.discAPI.preference(a.split(':')[1]);return true}
    if(a.indexOf('persona:')===0){usrC(t);E30.discAPI.setF('persona',a.split(':')[1],{src:'answer'});E30.discAPI.collector().expecting=null;save();botC('پرسونای انتخابی ثبت شد؛ ترکیب خانوار جداگانه و اختیاری است.',null);return true}
    if(a==='start-service'){var flow=E30.discAPI.collector().wf,m={sell:'sell',invest:'invp',landlord:'lndl'}[flow];usrC(t);if(!m){sample();return true}suspend();ceStart(m);return true}
    if(a==='skip')return E30.discAPI.route('رد');
    if(a==='results'||a==='sample'){usrC(t);sample();return true}
    if(a==='hood-results'){usrC(t);compare(t);return true}
    if(a==='resume'){
      usrC(t);var prev=state().suspended;if(!prev){botC('خدمت معلقی وجود ندارد.',null);return true}
      Object.assign(CE,prev.ce);S.ctx30Collectors[S.ctx30ActiveKey]=prev.collector;E30.discAPI.resume();delete state().suspended;save();
      if(E30.discAPI.active()){var slot=E30.discAPI.collector().expecting;if(slot)E30.discAPI.preference(slot);else botC('به شناخت نیاز قبلی برگشتید؛ اطلاعات حفظ شده است.',null)}else ceStep();return true;
    }
    if(a.indexOf('discover:')===0){
      var flow=a.split(':')[1];
      /* Guided prompts may start directly from the legacy onboarding gate.
         Do not leave a competing active gate flow behind the discovery collector. */
      if(CE.f==='gate'){CE.f=null;CE.i=0;CE.li=0;CE.hist=[];}
      if(E30.discAPI.active())E30.discAPI.stop();
      usrC(t);
      E30.discAPI.extract(t,'guided-prompt');
      E30.discAPI.start(flow,false);
      return true;
    }
    if(a==='native')return false; /* Existing engine owns the answer and validation. */
    usrC(t);
    if(['valuation','contracts','contract-start','termination','services','guaranteed'].indexOf(a)>=0||a.indexOf('flow:')===0)suspend();
    if(a==='compare'){compare(t);return true}
    if(a==='sample'){sample();return true}
    if(a==='map'){E30.chatMap({hood:E30.discAPI.getF('hood')||undefined});return true}
    if(a==='valuation'){CBACT.e30ValOpen();return true}
    if(a==='contracts'){CBACT.e30ContractList();return true}
    if(a==='contract-start'){E28.ctrStart('rent');return true}
    if(a==='termination'){
      CBACT.e30ContractList();return true;
    }
    if(a==='services'){CBACT.e30RequestService();return true}
    if(a==='guaranteed'){CBACT.e30RequestGRT();return true}
    if(a==='saved'){showList(S.savedListings,'ملک‌های ذخیره‌شده','هنوز ملکی ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||x.listingId||'ملک')+'</span><b>'+esc(x.kind||'ذخیره')+'</b></div>'});return true}
    if(a==='library'){showList(S.library,'آثار ذخیره‌شده','هنوز گزارشی در کتابخانه ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||'گزارش')+'</span><b>'+esc(x.type||'سند')+'</b></div>'});return true}
    if(a==='projects'){showList(S.projects,'پروژه‌های فعلی','هنوز پروژه‌ای در این مرورگر ثبت نشده است.',function(x){return '<div class="kv"><span>'+esc(x.name||x.title||'پروژه')+'</span><b>ذخیره‌شده</b></div>'});return true}
    if(a.indexOf('flow:')===0){
      var f=a.split(':')[1];
      if(f==='build'&&!can(r)){botC('برای سفارش تأمین، ابتدا پروژهٔ فعال را در مسیر پروژه‌ها انتخاب کنید.',null);return true}
      if(SCRIPTS[f]){botC('این فلو در همین محیط گفت‌وگو اجرا می‌شود. وضعیت و اطلاعات نهایی فقط در مراحل صریح ثبت خواهد شد.',null);ceStart(f);return true}
    }
    return false;
  }
  function route(t){
    if(!S.auth||CURRENT!=='landing')return false;
    var nt=norm(t),r=BY_PROMPT[nt];
    if(!r&&/^(یه|یک) (خونه|خانه) (برام|برای من )? ?پیدا کن$/.test(nt)){
      setNode('home');usrC(String(t));
      botC('برای شروع، منظورتان خرید خانه است یا رهن و اجاره؟ یک پرامپت از پیشنهادهای همین گفت‌وگو انتخاب کنید.',null);
      return true;
    }
    if(!r)return false;
    setNode(r.id);
    return exec(r,String(t));
  }
  var installed=false;
  function install(){
    if(installed)return;installed=true;
    CBACT.e31Prefill=function(el){
      var r=BY_ID[el.getAttribute('data-e31-id')];
      var s=state();
      if(!r||!can(r)||String(s.seq)!==el.getAttribute('data-e31-seq')){toast('این پیشنهاد دیگر معتبر نیست؛ از پیشنهادهای جدید استفاده کنید.');return}
      var input=document.getElementById('chatIn');
      if(!input){toast('کادر گفت‌وگو در دسترس نیست.');return}
      input.value=r.prompt;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus();
    };
    ['selL','selB'].forEach(function(key){
      var original=CBACT[key];
      CBACT[key]=function(el){
        var q=queryData(),id=el.getAttribute('data-l'),x=key==='selL'?findL(id):findB(id);
        if(x&&(key==='selL'?E30.flowsAPI.rentPass(x,q.D):E30.flowsAPI.buyPass(x,q.D))){
          suspend();CE.f=key==='selL'?'rent':'buy';CE.i=SCRIPTS[CE.f].findIndex(function(st){return st.id==='list'});CE.li=0;
        }
        return original(el);
      };
    });
    var previousBot=botC,depth=0,pending=[];
    function deliver(h,chips){
      var html=String(h||'');
      if(S.auth&&CURRENT==='landing'&&!/e31-guide/.test(html))html+=card();
      return previousBot(html,chips);
    }
    botC=function(h,chips){if(depth){pending.push({h:String(h||''),c:chips});return}return deliver(h,chips)};
    function turn(fn){return function(){depth++;try{return fn.apply(this,arguments)}finally{depth--;if(!depth&&pending.length){var items=pending;pending=[];deliver(items.map(function(x){return x.h}).join('<div class="e31-turn-part"></div>'),items[items.length-1].c)}}}}
    E30.chatTurn=turn;
    ceVal=turn(ceVal);ceStart=turn(ceStart);
    Object.keys(CBACT).forEach(function(k){if(k!=='e31Prefill')CBACT[k]=turn(CBACT[k])});
    /* Empty-chat starter: visible in the chat canvas without creating a fake
       persisted assistant message or navigating away from the conversation. */
    var previousCr=cr;
    cr=function(){
      var value=previousCr.apply(this,arguments);
      if(S.auth&&CURRENT==='landing'&&HIST.length===0){
        var box=document.getElementById('chatB');
        if(box&&!box.querySelector('.e31-guide')){
          box.innerHTML='<div class="msg bot"><span class="who">دستیار</span><div class="bub">برای مشاهدهٔ مسیرهای نمایشی محلینو یکی از این درخواست‌ها را وارد کنید.'+
            card()+'</div></div>';
        }
      }
      return value;
    };
    var previousLogin=doLogin;
    doLogin=function(name){var value=previousLogin(name);if(S.auth&&CURRENT==='landing')cr();return value};
    var previousSend=ceSend;
    ceSend=turn(function(t){
      /* Free text keeps the original deterministic parser and its validations. */
      if(route(t))return;
      return previousSend(t);
    });
  }
  return {registry:REGISTRY,install:install,route:route,suggestions:suggestions,normalize:norm,getCurrent:function(){return state().node},queryData:queryData,actions:BY_ID};
})();