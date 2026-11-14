/* Mahalino V0.31 — deterministic, AI-free, chat-first prompt guidance.
   Each suggested phrase maps to an executable action or an existing routed flow.
   The registry is the single source of truth for the preview prompts. */
E30.guide=(function(){
  'use strict';
  var REGISTRY=[
    {id:'rent',group:'search',title:'جست‌وجوی رهن و اجاره',prompt:'می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم.',aliases:['میخوام خونه اجاره کنم','دنبال خانه اجاره‌ای هستم'],action:'discover:rent',slots:['city','budget_dep','budget_rent','m2','rooms','hood'],result:'شروع کشف نیاز اجاره',next:['rent-budget','rent-area','rent-specs'],test:'guide-rent'},
    {id:'rent-budget',group:'search',title:'ثبت بودجهٔ اجاره',prompt:'بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است.',aliases:['۱.۲ میلیارد رهن و ماهی ۱۰ میلیون'],action:'native',slots:['budget_dep','budget_rent'],result:'ثبت با پارسر مالی و درخواست تأیید',next:['rent-specs','rent-area','sample'],test:'guide-budget'},
    {id:'rent-specs',group:'search',title:'شرایط ملک',prompt:'حداقل ۶۰ متر و یک خواب می‌خوام.',aliases:['حداقل ۶۰ متر و ۱ خواب'],action:'native',slots:['m2','rooms'],result:'به‌روزرسانی قیود جست‌وجو',next:['sample','rent-area','map'],test:'guide-specs'},
    {id:'rent-area',group:'neighborhood',title:'تمرکز بر محدودهٔ انقلاب',prompt:'اول محله‌های اطراف انقلاب رو برای اجاره ارزیابی کن.',aliases:['گفتم دیگه سمت انقلاب','اطراف انقلاب رو بررسی کن'],action:'compare',slots:['area_reference'],result:'مقایسهٔ شفاف دادهٔ نمونه، بدون تثبیت محله به‌عنوان شرط قطعی',next:['compare','sample','map'],test:'guide-area'},
    {id:'sample',group:'search',title:'نمایش آگهی نمونه',prompt:'با همین شرایط آگهی‌های نمونه رو نشون بده.',aliases:['نمونه ملک‌ها را نشان بده'],action:'sample',slots:['budget_dep','budget_rent','m2','rooms','hood'],result:'کارت‌های صریحاً ساختگی از دادهٔ موجود',next:['rent-area','map','rent'],test:'guide-sample'},
    {id:'buy',group:'search',title:'جست‌وجوی خرید',prompt:'می‌خوام برای خرید آپارتمان در تهران راهنمایی بشم.',aliases:['میخوام آپارتمان بخرم'],action:'discover:buy',slots:['buy_budget','m2','rooms','hood'],result:'شروع کشف نیاز خرید',next:['map','valuation','neighborhood'],test:'guide-buy'},
    {id:'sell',group:'seller',title:'فروش ملک',prompt:'می‌خوام ملکم رو بفروشم و قیمت مناسبش رو بررسی کنم.',aliases:['میخوام خونه‌ام رو بفروشم'],action:'discover:sell',slots:['prop_area','prop_rooms','ownership','expected_price'],result:'شروع فرایند فروشنده',next:['valuation','contracts','map'],test:'guide-sell'},
    {id:'invest',group:'investment',title:'بررسی سرمایه‌گذاری',prompt:'می‌خوام برای سرمایه‌گذاری در ملک گزینه‌ها رو بررسی کنم.',aliases:['میخوام توی ملک سرمایه گذاری کنم'],action:'discover:invest',slots:['invest_capital','invest_horizon','invest_risk'],result:'شروع فرایند سرمایه‌گذاری',next:['neighborhood','map','valuation'],test:'guide-invest'},
    {id:'landlord',group:'seller',title:'ثبت درخواست موجر',prompt:'ملک خودم رو می‌خوام اجاره بدم.',aliases:['من موجرم و میخوام ملکم را اجاره بدهم'],action:'discover:landlord',slots:['listing_intent','prop_area','ownership'],result:'شروع فرایند موجر',next:['contracts','services','map'],test:'guide-landlord'},
    {id:'neighborhood',group:'neighborhood',title:'تحلیل محله',prompt:'می‌خوام محله‌های تهران رو از نظر قیمت و دسترسی مقایسه کنم.',aliases:['محله های تهران رو مقایسه کن'],action:'compare',slots:['hood','area_reference'],result:'مقایسه با برچسب دادهٔ داخلی',next:['rent-area','map','sample'],test:'guide-neighborhood'},
    {id:'compare',group:'neighborhood',title:'مقایسهٔ قیمت محله‌ها',prompt:'قیمت نمونهٔ محله‌های موجود رو مقایسه کن.',aliases:['قیمت محله‌های نزدیک انقلاب رو مقایسه کن','محله‌های اطراف انقلاب رو از نظر قیمت و دسترسی مقایسه کن.'],action:'compare',slots:['area_reference'],result:'مقایسهٔ قابل ردیابی با دادهٔ نمونه',next:['sample','map','rent'],test:'guide-compare'},
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
    persona:['پرسونا','می‌خواهم پرسونای جست‌وجویم را مشخص کنم.'],
    household:['ترکیب خانوار','می‌خواهم ترکیب خانوار را مشخص کنم.'],
    hood:['محدوده','می‌خواهم محدوده جست‌وجو را مشخص کنم.'],
    m2:['متراژ','می‌خواهم حداقل متراژ را مشخص کنم.'],rooms:['تعداد خواب','می‌خواهم تعداد خواب را مشخص کنم.'],
    prop_age:['عمر بنا','می‌خواهم عمر بنای دلخواه را مشخص کنم.'],
    floor_preference:['طبقه','می‌خواهم طبقه دلخواه را مشخص کنم.'],
    prefs:['امکانات','می‌خواهم امکانات دلخواه را مشخص کنم.']
  };
  function add(r){REGISTRY.push(Object.assign({group:'search',aliases:[],slots:[],next:[],test:'preference-'+r.id,result:'ترجیح اختیاری؛ بدون عملیات یا پرداخت خودکار'},r))}
  function preferenceId(slot){return 'need-'+slot.replace(/_/g,'-').replace('m2','size')}
  Object.keys(PREFS).forEach(function(slot){var x=PREFS[slot];add({id:preferenceId(slot),title:x[0],prompt:x[1],action:'preference:'+slot,slots:[slot]})});
  Object.keys(E30.discAPI?E30.discAPI.SLOT_LABEL:{}).forEach(function(slot){
    if(PREFS[slot]||slot==='budget_dep'||slot==='budget_rent')return;
    var label=E30.discAPI.SLOT_LABEL[slot];
    add({id:preferenceId(slot),title:label,prompt:'می‌خواهم «'+label+'» را مشخص کنم.',action:'preference:'+slot,slots:[slot]});
  });
  add({id:'skip-preference',title:'رد پرسش',prompt:'این پرسش را فعلاً رد کن.',action:'skip'});
  add({id:'start-service',title:'شروع خدمت با اطلاعات فعلی',prompt:'با اطلاعات فعلی ادامه بده.',action:'start-service'});
  add({id:'resume-service',title:'بازگشت به کار قبلی',prompt:'به کار قبلی برگرد.',action:'resume',result:'بازگردانی وضعیت و مرحلهٔ کار قبلی'});
  ['student','couple','young','family'].forEach(function(value,i){add({id:'persona-'+value,
    title:['دانشجو','زوج','جوان','خانواده'][i],
    prompt:['پرسونای جست‌وجوی من دانشجو است.','پرسونای جست‌وجوی من زوج است.','پرسونای جست‌وجوی من جوان است.','پرسونای جست‌وجوی من خانواده است.'][i],
    action:'persona:'+value,slots:['persona']})});
  REGISTRY.forEach(function(r){
    if(r.id==='rent-budget'){r.prompt='می‌خواهم سقف ودیعه و اجاره ماهانه را مشخص کنم.';r.aliases=[];r.action='preference:budget_pair'}
    if(r.id==='rent-specs'){r.prompt='می‌خواهم متراژ و تعداد خواب را مشخص کنم.';r.aliases=[];r.action='preference:m2'}
  });
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
  function activeBuildProject(){
    var id=S.active&&S.active.mkt,w=(S.wfs||[]).filter(function(w){return w.id===id&&!w.cancelled&&w.m==='mkt'})[0],d=w&&w.data;
    if(!d||!(d.confirmed||d.chosen))return null;
    var index=d.chosen?d.chosen.prj:d.bid&&d.bid.prj;
    return typeof PRJ!=='undefined'&&Number.isInteger(index)&&PRJ[index]?w:null;
  }
  function rentalTarget(code){
    var contracts=(S.contracts||[]).filter(function(c){return c&&c.code===code});
    if(contracts.length!==1||contracts[0].kind!=='rent'||contracts[0].status!=='signed_internal')return null;
    var c=contracts[0],work=(S.wfs||[]).filter(function(w){return w.m==='rent'&&!w.cancelled&&w.data&&w.data.signed&&w.data.code===code&&(!c.wfId||w.id===c.wfId)});
    return work.length===1?work[0]:null;
  }
  function buildReady(){
    var project=activeBuildProject(),id=S.active&&S.active.build;
    var work=(S.wfs||[]).filter(function(w){return w.id===id&&w.m==='build'&&!w.cancelled})[0];
    return !!(project&&work&&work.data&&work.data.projectWfId===project.id);
  }
  function can(r,explicit){
    if(!r)return false;
    if(r.id==='rent-area'&&!explicit)return false; /* No verified adjacency dataset. */
    if(r.id==='saved'&&!explicit)return !!(S.savedListings||[]).length;
    if(r.id==='library'&&!explicit)return !!(S.library||[]).length;
    if(r.id==='projects'&&!explicit)return !!(S.projects||[]).length;
    if(r.id==='termination'&&!explicit)return (S.contracts||[]).some(function(c){return c&&rentalTarget(c.code)});
    if(r.id==='build'&&!explicit)return !!activeBuildProject();
    if(r.action==='resume'){
      var payment=E30.pay&&E30.pay.session();
      return !!explicit||!!state().suspended&&!(payment&&/^(processing|paid|executing)$/.test(payment.state));
    }
    if(r.action==='skip')return !!(E30.discAPI&&E30.discAPI.collector().expecting);
    if(r.action==='start-service')return !!(E30.discAPI&&E30.discAPI.active());
    if(r.action.indexOf('flow:')===0)return !!(typeof SCRIPTS!=='undefined'&&SCRIPTS[r.action.split(':')[1]]);
    if(r.action==='valuation')return typeof CBACT.e30ValOpen==='function';
    if(r.action==='contracts')return typeof CBACT.e30ContractList==='function';
    if(r.action==='services')return typeof CBACT.e30RequestService==='function';
    if(r.action==='guaranteed')return typeof CBACT.e30RequestGRT==='function';
    if(r.action==='contract-start')return typeof E28!=='undefined'&&typeof E28.ctrStart==='function';
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
    var col=E30.discAPI.collector(),ids=[],seen={};
    if(col.active){
      if(col.expecting==='persona')ids=['persona-student','persona-couple','persona-young','persona-family','skip-preference','sample'];
      else if(col.expecting)ids=['skip-preference',col.wf==='rent'||col.wf==='buy'?'sample':'start-service'];
      else{
        E30.discAPI.missing(col.wf).forEach(function(f){
          var id=f.id==='budget_dep'||f.id==='budget_rent'?'rent-budget':preferenceId(f.id);
          if(BY_ID[id]&&!seen[id]){ids.push(id);seen[id]=true}
        });
        ids=ids.slice(0,4).concat(col.wf==='rent'||col.wf==='buy'?['sample','start-service']:['start-service']);
      }
      if(['compare','neighborhood','rent-area'].indexOf(state().node)>=0&&typeof HOODS!=='undefined'&&HOODS.some(function(h){return h.ll}))ids=ids.concat(['map']);
    }else{
      var node=effectiveNode();ids=GROUPS[node]||GROUPS.home;
      if(CE.f&&CE.f!=='gate')return state().suspended?[BY_ID['resume-service']]:[];
      ids=ids.slice(0,node==='home'?4:3);
    }
    if(state().suspended)ids=ids.concat(['resume-service']);
    return ids.map(function(k){return BY_ID[k]}).filter(function(r){return can(r,false)});
  }
  function card(onlyResume){
    if(!S.auth||CURRENT!=='landing')return '';
    var options=onlyResume?[BY_ID['resume-service']].filter(function(r){return can(r,false)}):suggestions();
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
  function compare(text){
    var list=(typeof HOODS!=='undefined'&&Array.isArray(HOODS))?HOODS:[],t=norm(text);
    var header='<b>مقایسهٔ نمایشی محله‌ها</b><p class="note">فقط دادهٔ داخلی و ساختگی Mahalino، نه تحلیل زندهٔ بازار. قیمت خرید نمونه به‌ازای هر متر مربع، با واحد تومان؛ دادهٔ دسترسی و زمان سفر تأیید نشده است.</p>';
    /* Coordinates alone do not establish adjacency, commuting or transit access.
       Never substitute arbitrary neighborhoods for an unsupported area query. */
    if(/اطراف|نزدیک|سمت|انقلاب/.test(t)){
      botC(header+'<p class="e31-geo-unavailable">دادهٔ تأییدشده‌ای برای تعیین محله‌های نزدیک محدودهٔ درخواستی ندارم. محله‌ای را به‌عنوان همجوار پیشنهاد نمی‌کنم. برای مقایسهٔ عمومی قیمت، نام محله‌های موجود را مشخص کنید یا «قیمت نمونهٔ محله‌های موجود رو مقایسه کن» را بفرستید.</p>',null);return;
    }
    var named=list.filter(function(h){return t.indexOf(norm(h.n||''))>=0}),picks=named.length?named:list.slice(0,3);
    var prices=picks.map(function(h){return Number(h.buyBase)||0}),max=Math.max.apply(null,[0].concat(prices));
    var rows=picks.map(function(h){
      var value=Number(h.buyBase),valid=isFinite(value)&&value>0;
      var price=valid&&typeof rial==='function'?rial(value):'دادهٔ قابل نمایش موجود نیست';
      return '<div class="e31-price-row" data-hood="'+qesc(h.n||'')+'"><span class="e31-price-label">'+esc(h.n||'محلهٔ نمونه')+'</span>'+
        '<span class="e31-price-track" aria-hidden="true"><span style="width:'+(valid&&max?Math.round(value/max*100):0)+'%"></span></span>'+
        '<b class="e31-price-value">'+esc(price)+'</b></div>';
    }).join('');
    botC(header+(rows?'<div class="e31-price-chart" role="group" aria-label="مقایسهٔ قیمت نمونهٔ خرید هر متر مربع">'+rows+'</div>':'<p>دادهٔ نمونهٔ محله در دسترس نیست.</p>'),null);
  }
  function sample(){
    var col=S.ctx30Collectors&&S.ctx30Collectors[S.ctx30ActiveKey];
    var flow=(col&&col.wf==='buy')||CE.f==='buy'?'buy':'rent',f=E30.discAPI.getF;
    var dep=f('budget_dep'),rent=f('budget_rent'),budget=f('buy_budget'),age=f('prop_age');
    var rules=f('prefRules')||{},floor=f('floor_preference');
    var fields=E30.discAPI.ctx().fields;
    if(age==null&&f('prop_new')==='new'&&fields.prop_new&&fields.prop_new.kind==='hard')age=3;
    /* Build an independent query from explicit facts. Never import the legacy
       workflow's illustrative defaults or mutate its operational state. */
    var D={hood:f('hood'),budg:budget&&budget.v?budget.v[1]:0,budgOpen:!budget||!!budget.open,
      depOpen:!dep||!!dep.open,rentBOpen:!rent||!!rent.open,
      B:{depB:dep&&dep.v?dep.v[1]:null,rentB:rent&&rent.v?rent.v[1]:null},
      P:{beds:f('rooms')||0,minM2:f('m2')||0,maxAge:age,minAge:(f('prop_age_range')||[0])[0],_ageHard:age!=null,prefRules:rules},
      PR:{beds:f('rooms')||0,m2:[f('m2')||0,Infinity],age:f('prop_age_range')||[0,age==null?Infinity:age],
        floorR:[-Infinity,Infinity],prefRules:rules}};
    if(floor&&floor.level==='required'){D.P.requiredFloor=floor;D.PR.requiredFloor=floor}
    var all=flow==='buy'?BLIST:RLIST;
    var matches=all.filter(function(x){return flow==='buy'?E30.flowsAPI.buyPass(x,D):E30.flowsAPI.rentPass(x,D)});
    var cards=matches.slice(0,3).map(function(x){
      var h=flow==='buy'?chatBCard(x,false):chatListCard(x,false);
      /* Preview keeps details and save controls. Choosing a service is separate
         from these result cards; legacy selection expects an active flow. */
      return h.replace(/<button\b[^>]*data-cba="sel[LB]"[^>]*>[\s\S]*?<\/button>/g,'');
    }).join('');
    botC('<b>آگهی‌های منطبق با اطلاعات فعلی: '+fa(matches.length,0)+'</b><p class="note">دادهٔ ساختگی نمونه، نه آگهی زنده. ترجیحات اعلام‌نشده فیلتر نمی‌شوند.'+
      (matches.length>3?' سه نمونهٔ نخست نمایش داده می‌شود.':'')+'</p>'+
      (cards?'<div class="chcards e31-results" data-result-flow="'+flow+'">'+cards+'</div>':
        '<p>آگهی منطبق پیدا نشد. برای تغییر نتیجه، محدودیت دلخواه را صریحاً اصلاح کنید؛ هیچ قیدی خودکار حذف نشده است.</p>'),null);
  }
  function suspend(){
    var st=state(),col=E30.discAPI.collector();
    if(!st.suspended&&(col.active||(CE.f&&CE.f!=='gate'))){
      var flow=col.active?({invest:'invp',landlord:'lndl'}[col.wf]||col.wf):CE.f;
      st.suspended={collector:JSON.parse(JSON.stringify(col)),ce:JSON.parse(JSON.stringify(CE)),
        flow:flow,activeId:S.active&&S.active[flow]||null,node:col.wf||({invp:'invest',lndl:'landlord'}[CE.f]||CE.f),
        contract:typeof E28!=='undefined'?{kind:E28.ctrKind||null,done:E28.ctrDone||null}:null};
    }
    E30.discAPI.stop();CE.f=null;save();
  }
  function resumeService(){
    var st=state(),saved=st.suspended;if(!saved){botC('کار معلقی برای بازگشت ثبت نشده است.',null);return true}
    var pay=E30.pay&&E30.pay.session();
    if(pay&&/processing|paid|executing/.test(pay.state)){botC('عملیات خدمت در حال انجام است؛ پس از پایان می‌توانید بازگردید.',null);return true}
    if(pay&&/^(presented|awaiting_confirm|selected|priced|insufficient)$/.test(pay.state))E30.pay.cancel(pay.payId,true);
    if(saved.flow){if(!S.active)S.active={};S.active[saved.flow]=saved.activeId}
    Object.assign(CE,saved.ce);
    if(!S.ctx30Collectors)S.ctx30Collectors={};
    S.ctx30Collectors[S.ctx30ActiveKey]=saved.collector;
    E30.discAPI.resume();st.suspended=null;setNode(saved.node||'home');save();
    if(saved.contract&&typeof E28!=='undefined'){E28.ctrKind=saved.contract.kind;E28.ctrDone=saved.contract.done}
    if(E30.discAPI.active())return E30.discAPI.resumePrompt();
    var work=saved.activeId&&(S.wfs||[]).filter(function(w){return w.id===saved.activeId})[0];
    if(work&&work.done){CE.f=null;botC('کار قبلی به پایان رسیده است؛ وضعیت و اطلاعات ذخیره‌شدهٔ آن حفظ شده‌اند.',null);return true}
    if(CE.f)ceStep();else botC('به کار قبلی برگشتید؛ اطلاعات گفت‌وگو حفظ شده است.',null);
    return true;
  }
  function contractStart(){
    suspend();
    var parent=state().suspended;
    if(parent&&parent.flow==='rent'){
      if(!parent.activeId)parent.activeId=wfNew('rent').id;
      wfNew('rent');save();
    }
    var work=wd('rent');
    if(work.data.ctr&&work.data.ctr.finalized)wfNew('rent');
    E28.ctrStart('rent');
  }
  function terminationChoices(){
    var cs=(S.contracts||[]).filter(function(c){return c&&c.code});
    if(!cs.length){botC('قرارداد قابل ارجاعی ثبت نشده است. ابتدا قرارداد هدف را ثبت یا بازیابی کنید؛ هیچ قراردادی خودکار انتخاب نمی‌شود.',null);return}
    botC('<b>قرارداد هدف را انتخاب کنید</b><div class="sect">'+cs.map(function(c){
      return '<div class="fld"><b>'+esc(c.title||c.code)+'</b> · <span dir="ltr">'+esc(c.code)+'</span> · '+esc(c.status||'نامشخص')+
        '<div class="qr">'+(rentalTarget(c.code)?'<button data-cba="e31TermStart" data-code="'+qesc(c.code)+'">شروع بررسی فسخ این قرارداد</button>':'')+
        '<button data-cba="e31TermGuide" data-code="'+qesc(c.code)+'">چک‌لیست پیگیری همین قرارداد</button></div></div>';
    }).join('')+'</div><p class="note">شروع عملیات درون‌چتی فقط برای اجاره‌نامهٔ فعال و دارای فلو معتبر ممکن است. انتخاب قرارداد یا دیدن راهنما به‌تنهایی فسخ نیست.</p>',null);
  }
  function exec(r,t){
    var a=r.action;
    if(a==='resume'){usrC(t);return resumeService()}
    if(a.indexOf('preference:')===0){
      usrC(t);
      if(!E30.discAPI.active())E30.discAPI.start(CE.f==='buy'?'buy':'rent',true);
      return E30.discAPI.preference(a.split(':')[1]);
    }
    if(a.indexOf('persona:')===0){
      usrC(t);E30.discAPI.answer('persona',t);
      E30.discAPI.collector().expecting=null;
      S.ctx30Collectors[S.ctx30ActiveKey]=Object.assign({},E30.discAPI.collector());save();
      botC('پرسونای جست‌وجو ثبت شد؛ ترکیب خانوار و داشتن فرزند از آن فرض نمی‌شود.',null);return true;
    }
    if(a==='skip')return E30.discAPI.route('رد');
    if(a==='start-service'){CBACT.e30UseKnown();return true}
    if(a.indexOf('discover:')===0){
      var flow=a.split(':')[1];
      /* Guided prompts may start directly from the legacy onboarding gate.
         Do not leave a competing active gate flow behind the discovery collector. */
      if(CE.f==='gate'){CE.f=null;CE.i=0;CE.li=0;CE.hist=[];}
      if(E30.discAPI.active())E30.discAPI.stop();
      usrC(t);
      E30.discAPI.extract(t,'guided-prompt',flow);
      E30.discAPI.start(flow,false);
      return true;
    }
    if(a==='native')return false; /* Existing engine owns the answer and validation. */
    usrC(t);
    if(['valuation','termination','services','guaranteed'].indexOf(a)>=0||a.indexOf('flow:')===0)suspend();
    if(a==='compare'){compare(t);return true}
    if(a==='sample'){sample();return true}
    if(a==='map'){E30.chatMap({hood:E30.discAPI.getF('hood')||undefined});return true}
    if(a==='valuation'){CBACT.e30ValOpen();return true}
    if(a==='contracts'){CBACT.e30ContractList();return true}
    if(a==='contract-start'){
      contractStart();return true;
    }
    if(a==='termination'){
      terminationChoices();return true;
    }
    if(a==='services'){CBACT.e30RequestService();return true}
    if(a==='guaranteed'){CBACT.e30RequestGRT();return true}
    if(a==='saved'){showList(S.savedListings,'ملک‌های ذخیره‌شده','هنوز ملکی ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||x.listingId||'ملک')+'</span><b>'+esc(x.kind||'ذخیره')+'</b></div>'});return true}
    if(a==='library'){showList(S.library,'آثار ذخیره‌شده','هنوز گزارشی در کتابخانه ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||'گزارش')+'</span><b>'+esc(x.type||'سند')+'</b></div>'});return true}
    if(a==='projects'){showList(S.projects,'پروژه‌های فعلی','هنوز پروژه‌ای در این مرورگر ثبت نشده است.',function(x){return '<div class="kv"><span>'+esc(x.name||x.title||'پروژه')+'</span><b>ذخیره‌شده</b></div>'});return true}
    if(a.indexOf('flow:')===0){
      var f=a.split(':')[1];
      if(f==='build'&&!activeBuildProject()){botC('برای ساخت و تأمین، ابتدا پروژه و پیمانکار تأییدشده را در مسیر پروژه‌ها مشخص کنید. پروژهٔ پیش‌فرضی ساخته یا انتخاب نشده است.',null);return true}
      if(SCRIPTS[f]){botC('این مسیر نمایشی با دادهٔ نمونه در همین گفت‌وگو اجرا می‌شود. وضعیت و اطلاعات نهایی فقط در مراحل صریح ثبت خواهد شد.',null);ceStart(f);return true}
    }
    return false;
  }
  function route(t){
    if(!S.auth||CURRENT!=='landing')return false;
    var nt=norm(t),r=BY_PROMPT[nt];
    if(!r&&/^(یه|یک) (خونه|خانه) (برام|برای من )? ?پیدا کن$/.test(nt)){
      setNode('home');usrC(String(t));
      botC('برای شروع، منظورتان خرید خانه است یا رهن و اجاره؟ یک پرامپت از پیشنهادهای همین گفت‌وگو انتخاب کنید.'+card(),null);
      return true;
    }
    if(!r||!can(r,true))return false;
    setNode(r.id);
    return exec(r,String(t));
  }
  var installed=false;
  function install(){
    if(installed)return;installed=true;
    CBACT.e31TermGuide=function(el){var code=el.getAttribute('data-code');if(code)return E29.termAI(code)};
    CBACT.e31TermStart=function(el){
      var code=el.getAttribute('data-code'),work=rentalTarget(code);
      if(!work){botC('قرارداد انتخابی دیگر شرایط شروع فسخ را ندارد؛ فهرست را دوباره بررسی کنید.',null);return false}
      suspend();wfSet('rent',work.id);
      CE.f='rent';CE.i=SCRIPTS.rent.findIndex(function(s){return s.id==='termq'});CE.li=0;CE.hist=[];
      usrC('شروع بررسی فسخ قرارداد '+code);ceStep();return true;
    };
    CBACT.e30StartRent=function(){usrC('شروع قرارداد اجاره');contractStart();return true};
    ['e30ValOpen','e30RequestService','e30RequestGRT'].forEach(function(key){
      var original=CBACT[key];if(typeof original!=='function')return;
      CBACT[key]=function(){suspend();return original.apply(this,arguments)};
    });
    var entryVal=ceVal,entryStart=ceStart,entryStep=ceStep;
    function buildUnavailable(){botC('برای ادامهٔ ساخت و تأمین، ابتدا یک پروژه با پیمانکار تأییدشده انتخاب کنید. هیچ سفارش یا پیشرفت فرضی ثبت نشد.',null)}
    ceVal=function(v){
      var m=/^F:(rent|buy|sell|invp|lndl)$/.exec(String(v));
      if(m){suspend();usrC('شروع '+({rent:'اجاره',buy:'خرید',sell:'فروش',invp:'سرمایه‌گذاری',lndl:'اجاره‌دادن ملک'})[m[1]]);E30.discAPI.start(({invp:'invest',lndl:'landlord'})[m[1]]||m[1],false);return}
      if(String(v)==='F:build'&&!activeBuildProject()||String(v)!=='F:build'&&CE.f==='build'&&!buildReady()){buildUnavailable();return}
      return entryVal.apply(this,arguments);
    };
    ceStart=function(flow){
      if(flow==='build'&&!activeBuildProject()){buildUnavailable();return}
      if(['mkt','build','stay','grt'].indexOf(flow)>=0&&E30.discAPI.active())suspend();
      if(flow==='build'){
        var project=activeBuildProject(),id=S.active&&S.active.build;
        var existing=(S.wfs||[]).filter(function(w){return w.id===id&&w.m==='build'&&!w.cancelled})[0];
        if(!existing||existing.done||!existing.data||existing.data.projectWfId!==project.id){
          existing=wfNew('build');existing.data.projectWfId=project.id;save();
        }
      }
      return entryStart.apply(this,arguments);
    };
    ceStep=function(){if(CE.f==='build'&&!buildReady()){buildUnavailable();return}return entryStep.apply(this,arguments)};
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
    var previousBot=botC;
    botC=function(h,chips){
      var html=String(h||''),skip=/(تعارضی در شرایط|e30-paycard|e31-guide|data-e28ctr|e30-val-hood)/.test(html);
      var startup=CE.f==='gate'&&state().node==='home'&&CE.i===0;
      if(!skip&&S.auth&&CURRENT==='landing'&&(startup||!(CE.f&&!E30.discAPI.active())||state().suspended)){
        html+=card();
      }
      if(skip&&S.auth&&CURRENT==='landing'&&state().suspended&&!/e31-guide/.test(html))html+=card(true);
      return previousBot(html,chips);
    };
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
    ceSend=function(t){
      /* Free text keeps the original deterministic parser and its validations. */
      if(route(t))return;
      return previousSend(t);
    };
  }
  return {registry:REGISTRY,install:install,route:route,suggestions:suggestions,normalize:norm,getCurrent:function(){return state().node},actions:BY_ID,
    canSuggest:function(id){return can(BY_ID[id],false)}};
})();
