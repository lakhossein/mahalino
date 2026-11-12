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
    var node=effectiveNode(),ids=GROUPS[node]||GROUPS.home;
    return ids.map(function(k){return BY_ID[k]}).filter(can).slice(0,node==='home'?4:3);
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
  function compare(text){
    var list=(typeof HOODS!=='undefined'&&Array.isArray(HOODS))?HOODS:[];
    var near=/انقلاب/.test(norm(text));
    var focus=list.filter(function(h){return near&&/انقلاب/.test(norm(h.n||''))});
    var picks=(focus.length?focus:list.slice(0,3));
    var rows=picks.map(function(h){
      var price=(typeof h.buyBase==='number'&&typeof rial==='function')?rial(h.buyBase):'دادهٔ قابل نمایش موجود نیست';
      return '<div class="kv"><span>'+esc(h.n||'محلهٔ نمونه')+'</span><b>'+esc(price)+'</b></div>';
    }).join('');
    botC('<b>مقایسهٔ نمایشی محله‌ها</b><p class="note">فقط دادهٔ داخلی و ساختگی Mahalino، نه تحلیل زندهٔ بازار. ارقام در صورت وجود، مبنای نمونهٔ قیمت خرید به‌ازای هر متر هستند؛ دادهٔ دسترسی و زمان سفر تأیید نشده است.</p>'+
      (rows?'<div class="sect">'+rows+'</div>':'<p>دادهٔ نمونهٔ محله در دسترس نیست.</p>'),null);
  }
  function sample(){
    var a=(typeof RLIST!=='undefined'&&Array.isArray(RLIST))?RLIST:[];
    var opts=a.slice(0,3);
    botC('<b>آگهی‌های ساختگی برای پیش‌نمایش کارت ملک</b><p class="note">این موارد آگهی زنده نیستند و به معنی انطباق تأییدشده با بودجه یا شرایط شما نیستند.</p>'+
      (opts.length?'<div class="sect">'+opts.map(function(x){return '<div class="kv"><span>'+esc(x.t||'ملک آزمایشی')+'</span><b>'+esc(String(x.m2||'—'))+' متر · '+esc(String(x.beds||'—'))+' خواب</b></div>'}).join('')+'</div>':'<p>دادهٔ آزمایشی برای نمایش در دسترس نیست.</p>'),null);
  }
  function exec(r,t){
    var a=r.action;
    if(a.indexOf('discover:')===0){
      var flow=a.split(':')[1];
      if(E30.discAPI.active())E30.discAPI.stop();
      usrC(t);
      E30.discAPI.extract(t,'guided-prompt');
      E30.discAPI.start(flow,false);
      return true;
    }
    if(a==='native')return false; /* Existing engine owns the answer and validation. */
    usrC(t);
    if(a==='compare'){compare(t);return true}
    if(a==='sample'){sample();return true}
    if(a==='map'){E30.chatMap({hood:E30.discAPI.getF('hood')||undefined});return true}
    if(a==='valuation'){CBACT.e30ValOpen();return true}
    if(a==='contracts'){CBACT.e30ContractList();return true}
    if(a==='contract-start'){
      botC('برای تنظیم قرارداد اجاره، ابتدا اطلاعات ملک و شرایط مالی را در مسیر اجاره مشخص می‌کنیم. ثبت یا امضای قرارداد بدون تأیید شما انجام نمی‌شود.',null);
      if(E30.discAPI.active())E30.discAPI.stop();
      E30.discAPI.start('rent',false);return true;
    }
    if(a==='termination'){
      var all=S.contracts||[],c=all.filter(function(x){return x&&x.code})[0];
      if(c&&E29&&typeof E29.termAI==='function'){E29.termAI(c.code);return true}
      botC('قرارداد قابل ارجاعی در این مرورگر پیدا نشد. فسخ خودکار انجام نمی‌شود؛ ابتدا قرارداد را در همین گفت‌وگو پیدا یا ثبت کنید.',null);return true;
    }
    if(a==='services'){CBACT.e30RequestService();return true}
    if(a==='guaranteed'){CBACT.e30RequestGRT();return true}
    if(a==='saved'){showList(S.savedListings,'ملک‌های ذخیره‌شده','هنوز ملکی ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||x.listingId||'ملک')+'</span><b>'+esc(x.kind||'ذخیره')+'</b></div>'});return true}
    if(a==='library'){showList(S.library,'آثار ذخیره‌شده','هنوز گزارشی در کتابخانه ذخیره نشده است.',function(x){return '<div class="kv"><span>'+esc(x.title||'گزارش')+'</span><b>'+esc(x.type||'سند')+'</b></div>'});return true}
    if(a==='projects'){showList(S.projects,'پروژه‌های فعلی','هنوز پروژه‌ای در این مرورگر ثبت نشده است.',function(x){return '<div class="kv"><span>'+esc(x.name||x.title||'پروژه')+'</span><b>ذخیره‌شده</b></div>'});return true}
    if(a.indexOf('flow:')===0){
      var f=a.split(':')[1];
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
    if(!r||!can(r))return false;
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
    var previousBot=botC;
    botC=function(h,chips){
      var html=String(h||''),skip=/(تأیید مالی ضروری|تعارضی در شرایط|e30-paycard|e30-budget-card|e30-persona-card|e31-guide|data-e28ctr|e30-val-hood)/.test(html);
      if(!skip&&S.auth&&CURRENT==='landing'&&!(CE.f&&!E30.discAPI.active())){
        html+=card();
      }
      return previousBot(html,chips);
    };
    /* Empty-chat starter: visible in the chat canvas without creating a fake
       persisted assistant message or navigating away from the conversation. */
    var previousCr=cr;
    cr=function(){
      var value=previousCr.apply(this,arguments);
      if(S.auth&&CURRENT==='landing'&&HIST.length===0){
        var box=document.getElementById('chatB');
        if(box&&box.offsetParent&&!box.querySelector('.e31-guide')){
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
  return {registry:REGISTRY,install:install,route:route,suggestions:suggestions,normalize:norm,getCurrent:function(){return state().node},actions:BY_ID};
})();