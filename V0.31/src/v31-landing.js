/* ═══════════════ V0.31 — E30 LANDING: public splash page (spec §3) ═══════════════
   Architectural separation of the informational chatbot: this module has NO references
   to the application engine (no botC/ceStart/ACT/SCRIPTS access). Its reply function is
   a pure KB lookup returning text + an optional on-page anchor; the ONLY app action it
   can trigger is navigating to the login view. Real service execution is impossible here.
   ═══════════════ */
E30.landing=(function(){
  /* local icon set (Tabler-style paths) — independent from the app ICONS registry */
  var SPLICO={
    home:'<path d="M5 12l7-8 7 8"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="M11 12L20 3M16 7l3 3"/>',
    tag:'<path d="M3 12l9-9 9 9-9 9z"/><circle cx="12" cy="12" r="1.6"/>',
    chart:'<path d="M4 19h16"/><path d="M7 15v-4M12 15V7M17 15v-7"/>',
    map:'<path d="M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
    trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    scale:'<path d="M12 3v18M5 7h14"/><path d="M5 7l-3 6h6zM19 7l3 6h-6z"/>',
    doc:'<path d="M14 3v5h5"/><path d="M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/>',
    contract:'<path d="M14 3v5h5"/><path d="M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/><path d="M9 13h6M9 17h4"/>',
    xoct:'<path d="M8 3h8l4 4v10l-4 4H8l-4-4V7z"/><path d="M9 9l6 6M15 9l-6 6"/>',
    shield:'<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    bell:'<path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/>',
    cal:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
    gavel:'<path d="M13 5l6 6M17 3l4 4M12 6l6 6-8 8H4v-6z"/>',
    wallet:'<path d="M17 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5"/><circle cx="15.5" cy="14" r="1"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  function splIco(n,sz){
    return '<svg width="'+(sz||20)+'" height="'+(sz||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(SPLICO[n]||'')+'</svg>';
  }
  function priceOf(k){try{return E30.PRICING[k]?E30.PRICING[k].cost:null}catch(e){return null}}

  var SERVICES=[
    {ic:'home',t:'کمک اجاره',b:'پیدا کردن خانهٔ متناسب با بودجه و شرایط زندگی شما',get:'فهرست محله‌های همخوان، آگهی‌های منطبق، مقایسه و هماهنگی بازدید',req:'ودیعه و اجارهٔ ماهانه، محله یا محل کار/تحصیل، تعداد خواب',price:null},
    {ic:'key',t:'کمک خرید ملک',b:'خرید آگاهانه با کنترل دقیق بودجه و الزام‌ها',get:'بازهٔ قیمت محله‌ها، آگهی‌های زیر سقف بودجه، گزارش حقوقی، برنامهٔ پرداخت امانی',req:'بودجهٔ کل، هدف (سکونت/سرمایه‌گذاری)، محدودهٔ جست‌وجو',price:null},
    {ic:'tag',t:'کمک فروش ملک',b:'فروش با قیمت‌گذاری مبتنی بر داده و آماده‌سازی آگهی',get:'ارزیابی محله، استراتژی قیمت (سریع/حداکثر)، آماده‌سازی آگهی، مدیریت پیشنهادها',req:'مشخصات ملک، وضعیت سند و مالکیت، انگیزهٔ فروش',price:null},
    {ic:'chart',t:'ارزش‌گذاری ملک',b:'برآورد ارزش روی دادهٔ نمونهٔ سامانه',get:'گزارش ارزش با بازهٔ منطقی و مبانی محاسبه',req:'محله، متراژ، عمر و طبقه',price:priceOf('valuation')},
    {ic:'map',t:'تحلیل محله',b:'تصویر کامل یک محله قبل از تصمیم',get:'بازار، دسترسی‌ها، امکانات و تناسب با اولویت‌های شما',req:'نام محله و نمای اجاره یا خرید',price:priceOf('hood_detail')},
    {ic:'trend',t:'تحلیل بازار',b:'روند قیمت و تورم از دادهٔ نمونهٔ سامانه',get:'نمودار روند، تغییر سالانه، میانگین‌ها',req:'انتخاب محله یا نمای کلی',price:null},
    {ic:'scale',t:'مقایسهٔ ملک/محله',b:'تصمیم بین چند گزینه با جدول کنارهم',get:'جدول مقایسه با همهٔ شاخص‌های کلیدی',req:'دو تا چند مورد برای مقایسه',price:priceOf('hood_compare')},
    {ic:'doc',t:'ثبت قرارداد',b:'قرارداد اجاره/مبایعه‌نامه داخل گفت‌وگو',get:'پیش‌نویس استاندارد با اعتبارسنجی کد ملی/کد پستی و ثبت داخلی',req:'مشخصات طرفین، ملک و شرایط مالی',price:priceOf('contract_draft')},
    {ic:'xoct',t:'فسخ قرارداد',b:'فرایند فسخ و تخلیه با صورت‌جلسه',get:'صورت‌جلسه، درخواست پیگیری‌دار و چک‌لیست رایگان پیگیری فسخ؛ در این نسخه پردازش سند وجود ندارد',req:'کد قرارداد ثبت‌شده در سامانه',price:0,freeLabel:'چک‌لیست رایگان'},
    {ic:'shield',t:'احراز هویت',b:'اعتبارسنجی اطلاعات طرفین درون قرارداد',get:'کنترل ساختاری کد ملی و کد پستی هنگام ثبت',req:'کد ملی و کد پستی طرفین',price:null},
    {ic:'bell',t:'مدیریت یادآورها',b:'هیچ قرار و سررسیدی از دستتان در نمی‌رود',get:'ساخت یادآور از گفت‌وگو یا پنل، اعلان و تکرار',req:'عنوان و زمان یادآور',price:null},
    {ic:'cal',t:'هماهنگی بازدید',b:'رزرو بازدید از روزها و ساعت‌های اعلامی مالک',get:'درخواست بازدید ثبت‌شده و قابل پیگیری',req:'انتخاب ملک و زمان',price:priceOf('visit')},
    {ic:'gavel',t:'گزارش حقوقی',b:'بررسی وضعیت سند پیش از معامله',get:'گزارش وضعیت سند و زمان تقریبی انتقال',req:'وضعیت سند ملک',price:priceOf('legal')},
    {ic:'wallet',t:'پرداخت و تسویهٔ امانی',b:'شبیه‌سازی توافق و مراحل تسویه، بدون انتقال وجه واقعی',get:'برنامهٔ پرداخت و ثبت نمایشی مراحل آزادسازی',req:'توافق طرفین بر مراحل و درصدها',price:priceOf('escrow')}
  ];

  var FAQ=[
    ['محلینو چه کمکی می‌کند؟','محلینو یک دستیار گفت‌وگویی املاک است: شرایط‌تان را به زبان خودتان تعریف می‌کنید و دستیار، محله‌های مناسب، آگهی‌های منطبق، تحلیل بازار، قرارداد و پرداخت امانی را در همان گفت‌وگو پیش می‌برد.'],
    ['شروع چطور است؟','حساب این نمونه نمایشی است: ورود و کد تأیید واقعی نیست و داده‌ها میان حساب‌های مختلف همین مرورگر جدا نمی‌شوند. پس از ورود نمایشی در اولین پیام، شرایط‌تان را آزاد بنویسید — مثلاً «تازه ازدواج کردم و دنبال خونهٔ نوساز نزدیک محل کارم هستم». اطلاعات حساس واقعی وارد نکنید.'],
    ['بنا چیست؟','بنا اعتبار داخلی سامانه برای سرویس‌های پیشرفته (تحلیل محله، ارزش‌گذاری، گزارش حقوقی، قرارداد و…) است. هر سرویس قبل از اجرا، هزینه را نشان می‌دهد و فقط با تأیید شما اجرا می‌شود.'],
    ['داده‌های من کجا ذخیره می‌شود؟','وضعیت و تاریخچهٔ نمایشی در حافظهٔ محلی همین مرورگر ذخیره می‌شود. هنگام استفاده از جست‌وجوی نشانی، کد پستی ممکن است به سرویس موقعیت‌یابی بیرونی ارسال شود؛ اگر endpoint احراز هویت پیکربندی شده باشد، دادهٔ هویتی به آن endpoint ارسال خواهد شد. پیش از واردکردن دادهٔ حساس این موضوع را در نظر بگیرید.'],
    ['قیمت‌ها و آمار از کجاست؟','از دادهٔ نمونهٔ داخلی سامانه و صرفاً برای تصمیم‌گیری بهتر؛ آمار رسمی یا مشاورهٔ حقوقی نیست.'],
    ['وام یا تسهیلات پردازش می‌کنید؟','خیر — پردازش وام انجام نمی‌شود؛ اما می‌توانید بودجه، هزینه‌های جانبی و برنامهٔ پرداخت امانی را در گفت‌وگو بچینید.'],
    ['اشتراک‌گذاری چطور کار می‌کند؟','لینک اسنپ‌شاتِ این نسخه فقط در همین مرورگر/دستگاه که داده را نگه داشته کار می‌کند؛ برای ارسال به دستگاه یا شخص دیگر باید فایل مستقل خروجی را دانلود و ارسال کنید.'],
    ['یادآور دارید؟','بله — یادآور را از داخل گفت‌وگو یا از پنل یادآورها بسازید؛ اعلان و تکرار دارد و جلوی ثبت تکراری هم گرفته می‌شود.']
  ];

  var KB=[
    {k:['سرویس','خدمات','چه کار','چه کاری'],a:function(){return 'خدمات اصلی: اجاره، خرید، فروش، ارزش‌گذاری، تحلیل محله و بازار، مقایسه، قرارداد و فسخ، یادآور، بازدید، گزارش حقوقی و تسویهٔ امانی. همین پایین کارت هر سرویس را ببینید.'}},
    {k:['اجاره'],a:function(){return 'سرویس اجاره: شرایط‌تان (بودجه، محله/محل کار، تعداد خواب…) را می‌گویید؛ دستیار محله‌های همخوان و آگهی‌های منطبق با الزام‌های الزامی‌تان نشان می‌دهد و بازدید و قرارداد را هم داخل گفت‌وگو می‌برد. شروع آن فقط داخل برنامه است.'}},
    {k:['خرید','مبایعه'],a:function(){return 'سرویس خرید: بودجه و هدف‌تان را می‌پرسد، فقط ملک‌هایی را نشان می‌دهد که قیمت کلشان (متراژ × قیمت هر متر) زیر سقف بودجه باشد، و گزارش حقوقی و پرداخت امانی را هم دارد. شروع در برنامه.'}},
    {k:['فروش','بفروش'],a:function(){return 'سرویس فروش: از وضعیت سند و انگیزهٔ فروش می‌پرسد، بر پایهٔ دادهٔ نمونه ارزیابی می‌کند، استراتژی قیمت (سریع یا حداکثر) می‌چیند و تا قرارداد همراهتان است. شروع در برنامه.'}},
    {k:['بنا','هزینه','قیمت','تعرفه','پول'],a:function(){return 'هزینه‌های بنا طبق جدول تعرفه است: تحلیل محله ۴۰، مقایسهٔ محله‌ها ۴۰، ارزش‌گذاری ۴۰، قرارداد ۶۰، گزارش حقوقی ۱۰۰، تسویهٔ امانی نمایشی ۱۵۰ و بازدید ۲۰. راهنمای عمومی فسخ رایگان است و هیچ سندی را تحلیل نمی‌کند. هر کسر بنا باید با کارت تأیید جداگانه همراه باشد.'}},
    {k:['ثبت نام','ثبت‌نام','ورود','حساب','عضویت'],a:function(){return 'ورود این نسخه فقط نمایشی است: کد یک‌بارمصرف واقعی و جداسازی امن اطلاعات حساب‌ها وجود ندارد. برای آزمایش از «ورود نمایشی به برنامه» استفاده کنید و دادهٔ حساس واقعی وارد نکنید.'}},
    {k:['حریم','امنیت','داده','ذخیره','privacy'],a:function(){return 'وضعیت نمایشی در حافظهٔ محلی مرورگر ذخیره می‌شود. هنگام فعال‌کردن جست‌وجوی نشانی، کد پستی ممکن است به سرویس‌های بیرونی Photon/Nominatim فرستاده شود؛ احراز هویت هم فقط در صورت تنظیم endpoint بیرونی درخواست شبکه دارد. لینک اسنپ‌شات در دستگاه دیگر قابل بازیابی نیست؛ برای ارسال واقعی، فایل مستقل دانلود کنید.'}},
    {k:['یادآور','یاد اور'],a:function(){return 'یادآورها هم از داخل گفت‌وگو ساخته می‌شوند («یادآور بساز برای…») هم از پنل یادآورها؛ اعلان و تکرار دارند و ثبت تکراری مسدود می‌شود.'}},
    {k:['وام','تسهیل','بانک'],a:function(){return 'پردازش وام/تسهیلات در محلینو انجام نمی‌شود و صادقانه می‌گوییم؛ ولی برنامه‌ریزی بودجه و هزینه‌های جانبی معامله را داخل گفت‌وگو می‌توانید بچینید.'}},
    {k:['قیمت خانه','قیمت ملک','بازار','روند','تورم'],a:function(){return 'تحلیل بازار و روند قیمت بر پایهٔ «دادهٔ نمونهٔ سامانه» ارائه می‌شود و صریحاً همین‌طور برچسب می‌خورد — آمار رسمی یا پیش‌بینی قطعی نیست.'}},
    {k:['امنیت پرداخت','امانی','تسویه'],a:function(){return 'فرایند امانی در این نسخه نمونه و آموزشی است؛ توافق و مراحل آزادسازی داخل گفت‌وگو ثبت می‌شود اما انتقال وجه واقعی، سپرده‌گذاری نزد شخص ثالث یا ضمانت بانکی انجام نمی‌شود.'}},
    {k:['سلام','درود','هی'],a:function(){return 'سلام! دربارهٔ خدمات، بنا، ثبت‌نام یا حریم خصوصی هر سؤالی دارید بپرسید — یا با «ورود به برنامه» همین حالا شروع کنید.'}}
  ];

  /* pure KB reply — intentionally no access to the app engine */
  function reply(text){
    var t=normFa(String(text||''));
    /* guard: real-service requests → guide to the app, never execute */
    if(/اجاره ?کنم|بخرم|بفروشم|قرارداد کن|رزرو کن|تحلیل.{0,12}(کن|بده)|ثبت کن|پرداخت کن|واریز/.test(t)){
      return {text:'این کار داخل برنامهٔ محلینو انجام می‌شود و اینجا (صفحهٔ معرفی) فقط توضیح می‌دهم. با «ورود به برنامه» وارد شوید؛ همان‌جا در همان اولین پیام، شرایط‌تان را آزاد بنویسید — دستیار اصلی از همان‌جا قدم‌به‌قدم همراهتان است.',cta:true};
    }
    var i,j,best=null,score=0;
    for(i=0;i<KB.length;i++){
      var s=0;
      for(j=0;j<KB[i].k.length;j++){if(t.indexOf(normFa(KB[i].k[j]))>=0)s+=KB[i].k[j].length}
      if(s>score){score=s;best=KB[i]}
    }
    if(best)return {text:best.a()};
    return {text:'دقیق متوجه سؤالتان نشدم. می‌توانید بپرسید: «خدمات محلینو چیست؟»، «بنا چیست؟»، «داده‌هایم کجا ذخیره می‌شود؟» یا «چطور شروع کنم؟».'};
  }

  function section(name){return document.getElementById('spl-'+name)}
  function scroll(name){var el=section(name);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}

  function cardHTML(s,i){
    return '<button type="button" class="spl-card" data-sv="'+i+'" aria-label="'+esc(s.t)+'">'+
      '<span class="spl-ic">'+splIco(s.ic,20)+'</span>'+
      '<b>'+esc(s.t)+'</b>'+
      '<span class="spl-desc">'+esc(s.b)+'</span>'+
      (s.price?'<span class="spl-price">'+fa(s.price,0)+' بنا</span>':'<span class="spl-price spl-free">'+esc(s.freeLabel||'در جریان گفت‌وگو')+'</span>')+
      '</button>';
  }
  function cardDetail(s){
    return '<h3>'+esc(s.t)+'</h3>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>فایدهٔ اصلی</span><b>'+esc(s.b)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>چه چیزی می‌گیرید</span><b style="max-width:60%;text-align:left">'+esc(s.get)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>چه چیزی لازم است</span><b style="max-width:60%;text-align:left">'+esc(s.req)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>هزینه</span><b>'+(s.price?fa(s.price,0)+' بنا (قبل از اجرا تأیید می‌شود)':esc(s.freeLabel||'بخشی از گفت‌وگوی اصلی — بدون هزینهٔ جدا'))+'</b></div>'+
      '<div class="note" style="margin-top:10px">این کارت فقط توضیح است؛ اجرای واقعی سرویس داخل برنامه و پس از ورود انجام می‌شود.</div>';
  }
  function bindCards(root){
    root.addEventListener('click',function(e){
      var c=e.target.closest?e.target.closest('.spl-card'):null;
      if(!c)return;
      var s=SERVICES[+c.getAttribute('data-sv')];
      openModal('<div class="spl-modal">'+cardDetail(s)+'<div class="qr" style="margin-top:12px"><button data-view="auth">ورود به برنامه</button><button data-act="closeModal">بستن</button></div></div>');
    });
  }

  function html(){
    var h='<header class="spl-head"><div class="spl-wrap">'+
      '<div class="spl-brand">'+splIco('home',20)+'<b>محلینو</b><span class="spl-brandsub">دستیار هوشمند املاک</span></div>'+
      '<button type="button" class="spl-nav-toggle" data-spl-toggle aria-expanded="false" aria-controls="spl-mainnav" aria-label="باز کردن فهرست بخش‌های صفحه">'+splIco('menu',18)+'<span>فهرست</span></button>'+
      '<nav class="spl-nav" id="spl-mainnav" aria-label="بخش‌های صفحهٔ معرفی">'+
      '<button data-spl="services">خدمات</button>'+
      '<button data-spl="how">نحوهٔ کار</button>'+
      '<button data-spl="pricing">تعرفه</button>'+
      '<button data-spl="faq">پرسش‌ها</button>'+
      '</nav>'+
      '<div class="spl-cta"><button class="spl-btn ghost" data-view="auth">ورود نمایشی</button><button class="spl-btn" data-view="auth">شروع</button></div>'+
      '</div></header>';

    h+='<section class="spl-hero"><div class="spl-wrap">'+
      '<h1>همه تصمیم‌های ملکی،<br>با یک دستیار هوشمند</h1>'+
      '<p class="spl-sub">محلینو کمک می‌کند شرایط‌تان را بفهمید، بازار را بشناسید، خانهٔ مناسب پیدا کنید و معامله را تا قرارداد و تسویهٔ امانی در یک گفت‌وگو پیش ببرید.</p>'+
      '<div class="spl-heroacts"><button class="spl-btn big" data-view="auth">ورود نمایشی به برنامه</button><button class="spl-btn ghost big" data-spl="how">چطور کار می‌کند؟</button></div>'+
      '<p class="spl-demo-note">نسخهٔ آزمایشی: ورود و OTP واقعی نیست؛ اطلاعات در حافظهٔ همین مرورگر مشترک است و از حساب‌های دیگر جدا نمی‌شود. اطلاعات هویتی و مالی واقعی وارد نکنید.</p>'+
      '</div></section>';

    /* informational chatbot — pure info, cannot execute anything */
    h+='<section class="spl-chatwrap spl-light"><div class="spl-wrap">'+
      '<h2>سؤالی دارید؟ از دستیار معرفی بپرسید</h2>'+
      '<p class="spl-sub2">این دستیار فقط دربارهٔ خودِ محلینو توضیح می‌دهد؛ اجرای خدمات داخل برنامه و پس از ورود انجام می‌شود.</p>'+
      '<div class="spl-chat" id="spl-chatbox">'+
      '<div class="spl-msgs" id="spl-msgs" aria-live="polite"></div>'+
      '<div class="spl-chips" id="spl-chips">'+
      ['خدمات چیست؟','بنا چیست؟','داده‌ها کجا ذخیره می‌شود؟','چطور شروع کنم؟'].map(function(q){return '<button data-splq="'+esc(q)+'">'+esc(q)+'</button>'}).join('')+
      '</div>'+
      '<div class="spl-inputrow"><input id="spl-q" type="text" placeholder="سؤال‌تان را بنویسید…" aria-label="پرسش از دستیار معرفی"><button id="spl-send" aria-label="ارسال">فرستادن</button></div>'+
      '</div></div></section>';

    h+='<section class="spl-sec" id="spl-services"><div class="spl-wrap">'+
      '<h2>خدمات محلینو</h2><div class="spl-grid">'+SERVICES.map(cardHTML).join('')+'</div></div></section>';

    h+='<section class="spl-sec alt" id="spl-how"><div class="spl-wrap">'+
      '<h2>محلینو چطور کار می‌کند؟</h2><div class="spl-steps">'+
      [['۱','شرایط‌تان را تعریف می‌کنید','به زبان خودتان — نه فرم خالی'],['۲','محلینو می‌فهمد','از دل حرف‌هایتان، نیاز و محدودیت‌ها درمی‌آید'],
       ['۳','سؤالِ درست را می‌پرسد','فقط چیزهایی که واقعاً لازم است — یکی‌یکی'],['۴','گزینه‌ها آماده می‌شود','محله‌ها، آگهی‌های منطبق و تحلیل‌ها'],
       ['۵','شما تصمیم می‌گیرید','با مقایسه، ارزش‌گذاری و گزارش حقوقی'],['۶','محلینو ادامه را می‌بَرد','بازدید، قرارداد، پرداخت امانی و یادآورها']]
      .map(function(s){return '<div class="spl-step"><span class="n">'+s[0]+'</span><b>'+esc(s[1])+'</b><p>'+esc(s[2])+'</p></div>'}).join('')+
      '</div></div></section>';

    h+='<section class="spl-sec" id="spl-why"><div class="spl-wrap"><h2>چرا محلینو؟</h2><div class="spl-grid three">'+
      [['گفت‌وگو، نه فرم','شرایط‌تان را تعریف می‌کنید؛ فرم پر نمی‌کنید.'],
       ['شفاف در هزینه','هر سرویس قبل از اجرا قیمتش را می‌گوید و با تأیید شما اجرا می‌شود.'],
       ['صادق دربارهٔ داده','اعداد از دادهٔ نمونهٔ سامانه است و همیشه همین‌طور برچسب می‌خورد.'],
       ['هیچ‌چیز بی‌اجازه','بدون تأیید صریح، هیچ پرداخت یا تعهدی ثبت نمی‌شود.']]
      .map(function(w){return '<div class="spl-why"><b>'+esc(w[0])+'</b><p>'+esc(w[1])+'</p></div>'}).join('')+
      '</div></div></section>';

    var rows=E30.pay.audit().map(function(p){
      return '<tr><td>'+esc(p.label)+'</td><td>'+(p.cost?fa(p.cost,0):'رایگان')+'</td><td>'+(p.cost?'پیش از اجرا، داخل گفت‌وگو':'بدون کسر اعتبار')+'</td><td>'+(p.cost?'فقط در صورت خطای اجرا':'بدون هزینه')+'</td><td>سامانهٔ محلینو</td></tr>';
    }).join('');
    h+='<section class="spl-sec alt" id="spl-pricing"><div class="spl-wrap">'+
      '<h2>تعرفهٔ شفاف</h2><p class="spl-sub2">واحد پرداخت خدمات پیشرفته، اعتبار «بنا» است. هیچ کسر بدون تأیید صریح انجام نمی‌شود و هزینهٔ خارجیِ نامعلومی دریافت نمی‌گردد.</p>'+
      '<div class="spl-table"><table><thead><tr><th>سرویس</th><th>بنا</th><th>زمان پرداخت</th><th>شرط بازگشت</th><th>گیرنده</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '</div></section>';

    h+='<section class="spl-sec" id="spl-faq"><div class="spl-wrap"><h2>پرسش‌های پرتکرار</h2>'+
      FAQ.map(function(f){return '<details class="spl-faq"><summary>'+esc(f[0])+'</summary><p>'+esc(f[1])+'</p></details>'}).join('')+
      '</div></section>';

    h+='<footer class="spl-foot"><div class="spl-wrap">'+
      '<div class="spl-footgrid">'+
      '<div><div class="spl-brand">'+splIco('home',18)+'<b>محلینو</b></div><p>دستیار گفت‌وگویی املاک — از «شرایط من» تا «قرارداد و تسویه».</p></div>'+
      '<div><b>مسیرها</b><button data-spl="services">خدمات</button><button data-spl="how">نحوهٔ کار</button><button data-spl="pricing">تعرفه</button><button data-spl="faq">پرسش‌ها</button></div>'+
      '<div><b>شروع نمایشی</b><button data-view="auth">ورود نمایشی</button><button data-view="auth">شروع</button></div>'+
      '</div>'+
      '<div class="spl-copy">محلینو — حافظهٔ محلی مرورگر؛ جست‌وجوی نشانی ممکن است درخواست بیرونی ارسال کند · نسخهٔ V0.31</div>'+
      '</div></footer>';
    return h;
  }

  /* ── render + wiring ── */
  function ensureView(){
    var v=document.getElementById('v-splash');
    if(v)return v;
    v=document.createElement('section');
    v.className='view';v.id='v-splash';
    v.innerHTML=html();
    var anchor=document.getElementById('v-auth')||document.querySelector('.view');
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(v,anchor);
    else document.body.appendChild(v);
    bind(v);
    return v;
  }
  function bind(v){
    v.addEventListener('click',function(e){
      var t=e.target;
      if(!t||!t.closest)return;
      var toggle=t.closest('[data-spl-toggle]');
      if(toggle){
        var nav=document.getElementById('spl-mainnav'),open=nav&&nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded',open?'true':'false');
        toggle.setAttribute('aria-label',open?'بستن فهرست بخش‌های صفحه':'باز کردن فهرست بخش‌های صفحه');
        return;
      }
      var el=t.closest('[data-spl]');
      if(el){
        var nav=document.getElementById('spl-mainnav'),menu=document.querySelector('#v-splash [data-spl-toggle]');
        if(nav)nav.classList.remove('is-open');
        if(menu)menu.setAttribute('aria-expanded','false');
        scroll(el.getAttribute('data-spl'));return;
      }
      el=t.closest('[data-splq]');
      if(el){ask(el.getAttribute('data-splq'));return}
      el=t.closest('[data-view]');
      if(el){try{go(el.getAttribute('data-view'))}catch(e2){}}
    });
    var inp=document.getElementById('spl-q'),send=document.getElementById('spl-send');
    if(send)send.addEventListener('click',function(){ask(inp?inp.value:'')});
    if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();ask(inp.value)}});
    v.addEventListener('keydown',function(e){if(e.key==='Escape'){
      var nav=document.getElementById('spl-mainnav'),btn=v.querySelector('[data-spl-toggle]');
      if(nav&&nav.classList.contains('is-open')){nav.classList.remove('is-open');if(btn){btn.setAttribute('aria-expanded','false');btn.focus()}}
    }});
    botSay('سلام! من دستیار معرفی محلینو هستم — فقط دربارهٔ خود محصول توضیح می‌دهم. چه می‌خواهید بدانید؟');
    bindCards(v);
  }
  function botSay(t,cta){
    var box=document.getElementById('spl-msgs');if(!box)return;
    var d=document.createElement('div');
    d.className='spl-msg bot';
    d.innerHTML='<span>'+esc(t)+'</span>'+(cta?'<button class="spl-btn sm" data-view="auth">ورود به برنامه</button>':'');
    box.appendChild(d);box.scrollTop=box.scrollHeight;
  }
  function userSay(t){
    var box=document.getElementById('spl-msgs');if(!box)return;
    var d=document.createElement('div');d.className='spl-msg user';d.textContent=t;
    box.appendChild(d);box.scrollTop=box.scrollHeight;
  }
  function ask(text){
    text=String(text||'').replace(/^\s+|\s+$/g,'');
    if(!text)return;
    var inp=document.getElementById('spl-q');if(inp)inp.value='';
    userSay(text);
    var r=reply(text);
    setTimeout(function(){botSay(r.text,r.cta)},220);
  }

  /* go('splash') without the auth gate */
  E30.goSplash=function(){
    ensureView();
    closeModal();
    CURRENT='splash';
    document.body.classList.add('splash-active');
    document.body.classList.remove('widemain');
    setMenuOpen(false);
    var vs=document.querySelectorAll('.view');
    Array.prototype.forEach.call(vs,function(x){x.classList.remove('on')});
    document.getElementById('v-splash').classList.add('on');
    window.scrollTo(0,0);
    renderSidebar();renderTok();
  };

  E30.landingInit=function(){
    var _go=go;
    go=function(v){
      if(v==='splash'){E30.goSplash();return}
      document.body.classList.remove('splash-active');
      _go(v);
    };
    ensureView();
  };
  return {ensureView:ensureView,reply:reply,html:html};
})();
