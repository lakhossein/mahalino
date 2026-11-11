/* ═══ E25 — توسعهٔ محصول (V0.25): F1 کمیسیون، F2 دفتر یادآور، F3 افزایش اجاره، F4 سرمایه‌گذاری، F5 خلاصهٔ مشاور ═══
   جای درج: پیش از «۲۲) راه‌اندازی» و پس از E21/E22/E23/E24 — فقط پیچاندن (save-original + chain)، بدون موتور موازی.
   زنجیرهٔ مشاهده‌شده در V0.24 (به ترتیب تخصیص در فایل ساخته‌شده):
     ceSend(E21) ← ceSend(E23) ← ceSend(E25 = همین بخش، بیرونی‌ترین) و ورودی از ceSendWithAtt(E22 — گارد busy).
     یعنی: متن کاربر → E22 (busy) → E25 (مینی‌فلو یادآور، سپس ماچرهای F1–F5 فقط با E21.noFlow) → E23 (S1–S5) → E21.preSend → ceSend اصلی.
   پایداری فقط با S.reminders + save() — هیچ کلید localStorage تازه‌ای ساخته نمی‌شود؛ E25.temp/E25.commAwait/E25.rem فقط نشست جاری.
   رشته‌ها فارسی؛ اعداد با fa()/rial()؛ برچسب‌های صداقت عیناً از مشخصهٔ محصول (product-spec.md)؛
   فقط ویژگی‌های سپرده‌شده (delegation)؛ بدون CSS تازه (کلاس‌های موجود + style درون‌خطی فقط با متغیرها)؛ بدون توالی بستن اسکریپت.
   پژوهش پشتیبان: .mahalino-development/real-estate-research.md §1 (دفترچهٔ یادآور CRM)، §5/§6 (S6 تحویل به مشاور)، §7 ردیف ۴ (کمیسیون) و ردیف ۷ (یادآور سررسید)، §8 (S5/S6/S10). */

var E25={temp:null,commAwait:null};
E25.rem={stage:null,title:null,due:null,amt:null}; /* مینی‌فلو افزودن یادآور — فقط نشست جاری */

/* گارد پایداری — عین الگوی E24؛ کلید تازه نیست، فیلد تازه روی S موجود است */
try{if(!S.reminders)S.reminders=[]}catch(e){}

/* ─── ابزارهای مشترک ─── */
E25.usr=function(raw){if(!E21.chipUsr)usrC(raw)}; /* نمایش پیام کاربر — الگوی E23.usr */
E25.DAY=864e5;
/* تفاضل روزِ تقویمی — هم‌ساز با E21.iso (تاریخ‌ها به شکل UTC ذخیره می‌شوند)؛ بدون خطای منطقهٔ زمانی */
E25.mid=function(iso){var m=String(iso==null?'':iso).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null};
E25.todayIso=function(){try{return new Date().toISOString().slice(0,10)}catch(e){return null}};
E25.daysLeft=function(iso){
  var a=E25.mid(iso),b=E25.mid(E25.todayIso());
  if(a===null||b===null)return null;
  return Math.ceil((a-b)/E25.DAY);
};
E25.daysLabel=function(iso){
  var n=E25.daysLeft(iso);
  if(n===null)return '';
  if(n===0)return 'امروز';
  if(n===1)return fa(1,0)+' روز مانده';
  if(n>1)return fa(n,0)+' روز مانده';
  return fa(-n,0)+' روز گذشته';
};
E25.sorted=function(){
  var a=(S.reminders||[]).slice();
  a.sort(function(x,y){
    if(!!x.done!==!!y.done)return x.done?1:-1; /* ناتمام‌ها اول */
    return String(x.due).localeCompare(String(y.due)); /* سررسید صعودی */
  });
  return a;
};
E25.busyElsewhere=function(){return !!((E21.svc&&E21.svc.await)||(E21.grt&&E21.grt.await))}; /* مینی‌جریان‌های E21 اولویت دارند */
E25.profileDirty=function(){try{if(CURRENT==='profile')renderCurrent()}catch(e){}};
E25.findRem=function(id){var i,a=S.reminders||[];for(i=0;i<a.length;i++){if(a[i].id===id)return a[i]}return null};

/* ═══ F1) محاسبهٔ کمیسیون — برچسب مدل: «تعرفهٔ رایج بازار» (رسمی نیست) ═══
   اجاره: کل ≈ ۵۰٪ یک ماه اجاره، هر طرف ≈ ۲۵٪ — خرید/فروش (مبایعه): هر طرف ≈ ۰٫۵٪ مبلغ معامله. */
E25.HONEST_COMM='تعرفهٔ رایج بازار است — مرجع رسمی نیست؛ توافق طرفین و تعرفهٔ اتحادیهٔ مشاوران املاک محل ملاک است. محلی‌نو عدد رسمی اعلام نمی‌کند.';
E25.commRowsRent=function(rent){
  return rcConfirm([
    {l:'کمیسیون کل (≈۵۰٪ یک ماه اجاره)',v:rial(Math.round(rent*0.5))},
    {l:'سهم مالک (≈۲۵٪)',v:rial(Math.round(rent*0.25))},
    {l:'سهم مستأجر (≈۲۵٪)',v:rial(Math.round(rent*0.25))}
  ])+rcNote('فرمول: کمیسیون کل ≈ نصف یک ماه اجاره؛ هر طرف ≈ یک‌چهارم — یعنی '+fa(rent,0)+' × ۰٫۵ و '+fa(rent,0)+' × ۰٫۲۵.')+rcNote(E25.HONEST_COMM);
};
E25.commRowsSale=function(price){
  var raw=price*0.005,sh=Math.round(raw),frac=Math.abs(raw-sh)>0.001;
  return rcConfirm([
    {l:'سهم هر طرف (≈۰٫۵٪ مبلغ معامله)',v:rial(sh)},
    {l:'کمیسیون کل دو طرف (≈۱٪)',v:rial(Math.round(price*0.01))}
  ])+rcNote('فرمول: مبلغ معامله × ۰٫۰۰۵ برای هر طرف — یعنی '+fa(price,0)+' × ۰٫۰۰۵ = '+fa(raw,1)+' تومان.'+(frac?' (درشت‌بندی اعشار برای باقی‌ماندهٔ تومان)':''))+rcNote(E25.HONEST_COMM);
};
E25.showComm=function(kind,v){
  var h=(kind==='rent'?'کمیسیون اجاره — تعرفهٔ رایج بازار (رسمی نیست):':'کمیسیون خرید و فروش (مبایعه) — تعرفهٔ رایج بازار (رسمی نیست):')+
    (kind==='rent'?E25.commRowsRent(v):E25.commRowsSale(v));
  if(kind==='rent')h+=rcActs([{l:'شروع فلوی اجاره',a:'data-cf="rent"',p:1}]);
  botC(h,null);
};
E25.commIntro=function(money){
  E25.temp=money?{type:null,money:money}:null; /* مبلغ خوانده‌شده برای چیپ‌های شفاف‌سازی نگه داشته می‌شود */
  botC('کمیسیون معاملات ملکی — تعرفهٔ رایج بازار (رسمی نیست):'+
    rcTable(['نوع معامله','نرخ رایج','توضیح'],[
      [{h:esc('اجاره / رهن')},{h:esc('≈۵۰٪ یک ماه اجاره')},{h:esc('معمولاً نصف‌نیم — هر طرف ≈۲۵٪ یک ماه اجاره.')}],
      [{h:esc('خرید / فروش (مبایعه)')},{h:esc('≈۰٫۵٪ مبلغ معامله')},{h:esc('هر طرف ≈۰٫۵٪؛ روی مبالغ بزرگ عدد چشمگیری می‌شود.')}]
    ])+
    rcNote(E25.HONEST_COMM)+
    rcNote('کدام را حساب کنم؟ مبلغ را هم می‌توانید همین حالا بنویسید (مثلاً «کمیسیون اجاره ۲ میلیون تومان»).')+
    rcActs([
      {l:'اجاره دارم',a:'data-cba="commRent25"',p:1},
      {l:'فروش دارم',a:'data-cba="commSale25"'}
    ]),null);
};
E25.commIntent=function(nn,raw){
  if(!E21.noFlow()||E25.busyElsewhere())return false;
  if(!/کمیسیون/.test(nn))return false;
  /* واگذاری عبارت‌های جاافتادهٔ بازار محله (الگوی استثنای E23) */
  if(hoodsIn(nn).length&&/(چنده|چقدره|نرخش|قیمتش)/.test(nn))return false;
  var ms=E23.moneyScan(nn),i,v=null;
  for(i=0;i<ms.length;i++){if(ms[i].ok){v=ms[i].value;break}}
  var isSale=/خرید|فروش|مبایعه|خریدار|فروشنده/.test(nn),isRent=/اجاره|رهن|ودیعه/.test(nn);
  if(v!=null&&isRent!==isSale){E25.usr(raw);E25.showComm(isRent?'rent':'sale',v);return true}
  if(v!=null){E25.usr(raw);E25.commIntro(v);return true} /* مبلغ هست، نوع معلوم نیست */
  if(isRent||isSale){
    E25.usr(raw);E25.commAwait=isRent?'rent':'sale';
    botC('مبلغ را بنویسید تا کمیسیون را حساب کنم — مثلاً «کمیسیون '+(isRent?'اجاره':'فروش')+' ۲ میلیون تومان». «انصراف» هم می‌توانید بفرستید.',null);
    return true;
  }
  E25.usr(raw);E25.commIntro(null);return true;
};
/* مبلغ در انتظارِ کمیسیون — قبل از ماچرهای سناریو می‌گیرد (فقط بیرون فلو) */
E25.commMoney=function(nn,tt){
  if(!E25.commAwait||!E21.noFlow()||E25.busyElsewhere())return false;
  var isCancel=/انصراف|لغو|بی خیال/.test(nn);
  var ms=E23.moneyScan(nn),v=null,i;
  if(!isCancel){
    for(i=0;i<ms.length;i++){if(ms[i].ok){v=ms[i].value;break}}
    if(v==null){var pm=parseMoneyFA(nn);if(pm.ok)v=pm.value}
  }
  if(isCancel||v!=null){
    E25.usr(tt);
    if(isCancel){E25.commAwait=null;botC('باشه؛ هر وقت خواستید «کمیسیون» را بنویسید.',null);return true}
    var k=E25.commAwait;E25.commAwait=null;
    E25.showComm(k,v);
    return true;
  }
  if(/یادآور|یاد اور|کمیسیون|افزایش اجاره|با مشاور|بنگاه/.test(nn)){E25.commAwait=null;return false} /* نیت تازه‌تر اولویت دارد — پیام کاربر در همان مسیر نمایش داده می‌شود */
  E25.usr(tt);
  botC('مبلغ را متوجه نشدم؛ با عدد و واحد بنویسید (مثلاً «۲ میلیون تومان») یا «انصراف» بفرستید.',null);
  return true;
};
CBACT.commRent25=function(el){
  usrC((el.textContent||'').replace(/^\s+|\s+$/g,''));
  var t=E25.temp;E25.temp=null;
  if(t&&t.money){E25.showComm('rent',t.money);return}
  E25.commAwait='rent';
  botC('مبلغ اجارهٔ ماهانه را بنویسید (مثلاً «۲ میلیون تومان») تا کمیسیون را حساب کنم؛ «انصراف» هم می‌توانید بفرستید.',null);
};
CBACT.commSale25=function(el){
  usrC((el.textContent||'').replace(/^\s+|\s+$/g,''));
  var t=E25.temp;E25.temp=null;
  if(t&&t.money){E25.showComm('sale',t.money);return}
  E25.commAwait='sale';
  botC('مبلغ معامله را بنویسید (مثلاً «۵ میلیارد تومان») تا کمیسیون را حساب کنم؛ «انصراف» هم می‌توانید بفرستید.',null);
};

/* ═══ F2) دفتر یادآور چک و تعهدات — شکاف دوم تأییدشدهٔ پژوهش (CRM §1، §7 ردیف ۷) ═══ */
E25.HONEST_REM='یادآور فقط در همین مرورگر ذخیره می‌شود؛ هشدار پیامکی/زنگ نیازمند سرویس خارجی است و در این نسخه وجود ندارد.';
E25.remRowHTML=function(r){
  var days=E25.daysLabel(r.due),over=days.indexOf('گذشته')>-1;
  var chip=r.done?'<span class="badge b-ok">انجام شد</span>'
    :'<span class="badge"'+(over?' style="color:var(--danger)"':'')+'>'+esc(days)+'</span>';
  return '<div class="acc-row"><div class="main"><b>'+esc(r.title)+'</b><small>'+esc(faDate(r.due))+(r.amt?' • '+esc(rial(r.amt)):'')+'</small></div>'+
    chip+(r.done?'':'<button class="qbtn" data-cba="remDone25" data-id="'+qesc(r.id)+'">انجام شد</button>')+
    '<button class="qbtn" data-act="remDel" data-id="'+qesc(r.id)+'">حذف</button></div>';
};
E25.remShow=function(){
  E25.rem={stage:null,title:null,due:null,amt:null}; /* فهرست، مینی‌فلو را رها می‌کند */
  var a=E25.sorted(),i,h;
  if(!a.length){
    botC('دفتر یادآور چک و تعهدات — تا حالا یادداشتی ننوشتید.'+
      rcActs([{l:'افزودن یادآور',a:'data-cba="remAdd25"',p:1}])+
      rcNote(E25.HONEST_REM),null);
    return;
  }
  h='<div class="acc-list">';
  for(i=0;i<a.length;i++){h+=E25.remRowHTML(a[i])}
  h+='</div>';
  botC('دفتر یادآور چک و تعهدات — مرتب بر اساس سررسید (ناتمام‌ها اول):'+h+
    rcActs([{l:'افزودن یادآور',a:'data-cba="remAdd25"',p:1}])+
    rcNote(E25.HONEST_REM),null);
};
E25.remIntent=function(nn,raw){
  if(!E21.noFlow()||E25.busyElsewhere())return false;
  if(/چک لیست|چک لیست بازدید/.test(nn))return false; /* چک‌لیست بازدیدِ E23 دست نمی‌خورد */
  var hit=/یادآور|یاد اور|یاداور|یادداشت|دفتر یادآور/.test(nn);
  var chk=/(^|[^آ-ی])چک([^آ-ی]|$)/.test(nn)&&/یادآور|یاد اور|یادم|موعد|سررسید|سرسید|تاریخ|پایان/.test(nn);
  if(!hit&&!chk)return false;
  E25.usr(raw);E25.remShow();return true;
};
E25.remAskAmt=function(){botC('مبلغ چک یا تعهد چقدر است؟ (اختیاری — «نه» یا «-» بفرستید تا بی‌مبلغ بماند)',null)};
E25.remFlow=function(nn,tt){
  if(!E25.rem.stage||!E21.noFlow()||E25.busyElsewhere())return false;
  if(/انصراف|لغو کن|بی خیال/.test(nn)){
    E25.usr(tt);E25.rem={stage:null,title:null,due:null,amt:null};
    botC('انصراف؛ یادآوری ثبت نشد — دفتر یادآور سر جایش است.',null);
    return true;
  }
  if(E25.rem.stage==='title'){
    E25.usr(tt);
    E25.rem.title=tt.replace(/\s+/g,' ').slice(0,60);
    E25.rem.stage='due';
    botC('سررسید چه روزی است؟'+rcActs([
      {l:'امروز',a:'data-cba="remDue25" data-v="امروز"'},
      {l:'فردا',a:'data-cba="remDue25" data-v="فردا"',p:1},
      {l:'پس‌فردا',a:'data-cba="remDue25" data-v="پس‌فردا"'},
      {l:'جمعه',a:'data-cba="remDue25" data-v="جمعه"'}
    ])+rcNote('یا تاریخ را تایپ کنید: امروز/فردا/پس‌فردا/جمعه، یا شکل 2026-11-10.'),null);
    return true;
  }
  if(E25.rem.stage==='due'){
    E25.usr(tt);
    var d=E21.dateFromText(nn)||E21.dateFromText(tt); /* امروز/فردا/پس‌فردا/جمعه + ISO — بازاستفاده از E21 */
    if(!d){botC('تاریخ را متوجه نشدم؛ امروز/فردا/پس‌فردا/جمعه یا تاریخ به شکل 2026-11-10 بنویسید — یا «انصراف».',null);return true}
    E25.rem.due=d;E25.rem.stage='amt';
    E25.remAskAmt();
    return true;
  }
  if(E25.rem.stage==='amt'){
    E25.usr(tt);
    if(/^(-|–|—)$/.test(nn)||/(^|[^آ-ی])نه([^آ-ی]|$)|ندارم|بی خیال|مهم نیست/.test(nn)){E25.rem.amt=null}
    else{
      var ms=E23.moneyScan(nn),v=null,i;
      for(i=0;i<ms.length;i++){if(ms[i].ok){v=ms[i].value;break}}
      if(v==null){var pm=parseMoneyFA(nn);if(pm.ok)v=pm.value}
      if(v==null){botC('مبلغ را متوجه نشدم؛ مبلغ را با عدد و واحد بنویسید، یا «نه» بفرستید تا بی‌مبلغ ثبت شود.',null);return true}
      E25.rem.amt=v;
    }
    E25.rem.stage='confirm';
    botC('این یادآور ثبت شود؟'+rcConfirm([
      {l:'عنوان',v:esc(E25.rem.title)},
      {l:'سررسید',v:esc(faDate(E25.rem.due))+' — '+esc(E25.daysLabel(E25.rem.due))},
      {l:'مبلغ',v:E25.rem.amt?rial(E25.rem.amt):'—'}
    ],[{l:'ثبت یادآور',a:'data-cba="remSave25"',p:1}]),null);
    return true;
  }
  if(E25.rem.stage==='confirm'){
    E25.usr(tt);
    if(/ثبت|تایید|تأیید|باشه|بله/.test(nn)){E25.remDoSave();return true}
    botC('برای ثبت، «ثبت یادآور» را بزنید یا «انصراف» بفرستید.',null);
    return true;
  }
  return false;
};
E25.remDoSave=function(){
  S.reminders.push({id:'RM-'+Date.now().toString(36),title:E25.rem.title,due:E25.rem.due,amt:E25.rem.amt,done:false});
  save();
  var t=E25.rem.title,d=E25.rem.due;
  E25.rem={stage:null,title:null,due:null,amt:null};
  E25.profileDirty();
  botC('ثبت شد — «'+esc(t)+'» برای '+esc(faDate(d))+' ('+esc(E25.daysLabel(d))+').'+rcNote(E25.HONEST_REM)+
    rcActs([{l:'دفتر یادآور',a:'data-cba="remList25"'}]),null);
};
CBACT.remAdd25=function(el){
  usrC((el.textContent||'').replace(/^\s+|\s+$/g,''));
  E25.rem={stage:'title',title:null,due:null,amt:null};
  botC('عنوان یادآور را بنویسید (مثلاً «چک رهن — قسط اول»). «انصراف» را هم می‌توانید بفرستید.',null);
};
CBACT.remDue25=function(el){
  if(E25.rem.stage!=='due')return;
  usrC((el.textContent||'').replace(/^\s+|\s+$/g,''));
  var d=E21.dateFromText(el.getAttribute('data-v')||'');
  if(!d){botC('تاریخ خوانده نشد؛ دوباره بگویید.',null);return}
  E25.rem.due=d;E25.rem.stage='amt';
  E25.remAskAmt();
};
CBACT.remSave25=function(){if(E25.rem.stage==='confirm')E25.remDoSave()};
CBACT.remList25=function(){usrC('دفتر یادآور');E25.remShow()};
CBACT.remDone25=function(el){
  var r=E25.findRem(el.getAttribute('data-id'));
  if(!r){toast('یادآور پیدا نشد');return}
  usrC('انجام شد: «'+r.title+'»');
  r.done=true;save();E25.profileDirty();
  botC('«'+esc(r.title)+'» انجام شد و از فهرست ناتمام‌ها خارج شد.'+rcNote('یادآور انجام‌شده در دفتر می‌ماند؛ اگر لازم شد با «حذف» پاکش کنید.'),null);
};
ACT.remDel=function(el){
  var r=E25.findRem(el.getAttribute('data-id'));
  if(!r){toast('یادآور پیدا نشد');return}
  openModal('<h3>حذف یادآور</h3><p class="note">«'+esc(r.title)+'» (سررسید '+esc(faDate(r.due))+') حذف شود؟ این اقدام برگشت‌پذیر نیست.</p>'+
  '<div class="fs-actions" style="margin-top:14px"><button class="btn btn-primary" data-act="remDelOk" data-id="'+qesc(r.id)+'">حذف</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.remDelOk=function(el){
  var id=el.getAttribute('data-id'),i,a=S.reminders||[];
  for(i=0;i<a.length;i++){if(a[i].id===id){a.splice(i,1);break}}
  save();closeModal();toast('یادآور حذف شد');E25.profileDirty();
};

/* ═══ F3) آموزش افزایش اجاره (پژوهش §8-S5) — بدون عدد ساخته‌شده برای سال جاری ═══ */
E25.rentInc=function(nn,raw){
  if(!E21.noFlow()||E25.busyElsewhere())return false;
  if(!/افزایش اجاره|سقف افزایش|اجاره سال بعد|اجاره سال دیگه|اجاره سال دیگر/.test(nn))return false;
  E25.usr(raw);
  botC('افزایش اجاره — سازوکار، بدون عدد جاری:'+
    rcNote('سقف افزایش اجارهٔ مسکن در شهر تهران هر سال با مصوبهٔ شورای شهر اعلام می‌شود؛ منابع عمومی به سقف‌هایی تا ۲۵٪ اشاره کرده‌اند اما عدد دقیق سالِ جاری را باید از منابع رسمی بررسی کنید — این توضیح، مشاورهٔ حقوقی نیست.')+
    rcActs([
      {l:'محاسبهٔ کمیسیون',a:'data-cba="commIntro25"',p:1},
      {l:'شروع اجاره',a:'data-cf="rent"'}
    ]),null);
  return true;
};

/* ═══ F4) بررسی عقلانی سرمایه‌گذاری (پژوهش §8-S10) — روند گذشته، بدون پیش‌بینی و توصیه ═══ */
E25.invest=function(nn,raw){
  if(!E21.noFlow()||E25.busyElsewhere())return false;
  if(!/ملک بذارم|ملک بگذارم|ملک یا طلا|طلا یا ملک|ملک یا سکه|سکه یا ملک|بخرم یا سرمایه گذاری|سرمایه گذاری یا خرید|سود ملک|سودماندگی ملک/.test(nn))return false;
  E25.usr(raw);
  botC('بررسی عقلانی سرمایه‌گذاری در ملک:'+
    rcNote('هیچ‌کس — و هیچ ابزاری — نمی‌تواند آینده را تضمین کند؛ من دادهٔ گذشته را نش می‌دهم و توصیه نمی‌کنم.')+
    rcTable(['معیار','چه بپرسید'],[
      [{h:esc('افق زمانی')},{h:esc('ملک نقدشوندگی کندی دارد؛ پولی که تا یک سال لازم دارید برای ملک مناسب نیست.')}],
      [{h:esc('نقدشوندگی')},{h:esc('فروش ملک معمولاً هفته‌ها تا ماه‌ها طول می‌کشد؛ طلا و سپرده روزها.')}],
      [{h:esc('ریسک')},{h:esc('قیمتی، قانونی (سند، اجرای طرح)، وضعیت مستأجر و اجاره‌بها — هرکدام جدا سنجیده شوند.')}],
      [{h:esc('هزینه‌های نگهداری')},{h:esc('مالیات، عوارض، تعمیرات و کمیسیون معامله — از بازده ناخالص کم می‌شود.')}],
      [{h:esc('تنوع')},{h:esc('قرار دادن همهٔ پس‌انداز در یک ملک یعنی تمرکز ریسک؛ ترکیب دارایی‌ها تصمیم خودتان است.')}]
    ])+
    rcNote('نمودارهای محلی‌نو فقط روند تجمیعی گذشتهٔ آگهی‌ها را نشان می‌دهند، نه پیش‌بینی.')+
    rcActs([
      {l:'روند قیمت محله‌ها',a:'data-cq="بازار محله‌ها"',p:1},
      {l:'امتیاز محله‌ها',a:'data-cq="امتیاز محله‌ها"'}
    ]),null);
  return true;
};

/* ═══ F5) خلاصهٔ تحویل به مشاور (پژوهش §8-S6) — چیزی بی‌اجازه جمع نمی‌کند؛ فقط زمینهٔ فعلی ═══ */
E25.brief=function(nn,raw){
  if(!E21.noFlow()||E25.busyElsewhere())return false;
  if(!/با مشاور حرف|مشاور حرف بزنم|معرفی مشاور|مشاور معرفی|معرفی بنگاه|بنگاه معرفی|بنگاه معتبر/.test(nn))return false;
  E25.usr(raw);
  var runs=wfRunning(),i,names=[],kinds=[];
  for(i=0;i<runs.length;i++){
    names.push(wfName(runs[i])+' — مرحلهٔ '+fa(runs[i].step,0));
    kinds.push(MODBY[runs[i].m]?MODBY[runs[i].m].t:runs[i].m);
  }
  var kind=kinds.length?kinds.join('، '):(CTX.lastIntent?String(CTX.lastIntent):'—');
  botC('خلاصهٔ درخواست شما — همین‌ها را از زمینهٔ فعلی شما برداشتم و چیزی اضافه نکردم:'+
    rcConfirm([
      {l:'نوع درخواست',v:esc(kind)},
      {l:'محله',v:CTX.hood?esc(findH(CTX.hood).n):'—'},
      {l:'بودجهٔ خرید',v:CTX.budg?rial(CTX.budg):'—'},
      {l:'ودیعه (رهن)',v:CTX.dep?rial(CTX.dep):'—'},
      {l:'اجارهٔ ماهانه',v:CTX.rent?rial(CTX.rent):'—'},
      {l:'خواب',v:CTX.beds?fa(CTX.beds,0)+' خواب':'—'},
      {l:'فلوهای جاری',v:names.length?esc(names.join('، ')):'—'}
    ])+
    rcNote('این خلاصه را می‌توانید کپی کنید و به هر مشاوری بدهید؛ محلینو در این نسخه به مشاور واقعی وصل نمی‌شود — ادعای تأییدشدهٔ مشاوری وجود ندارد.')+
    rcActs([
      {l:'ثبت بازدید — فلوی اجاره',a:'data-cf="rent"',p:1},
      {l:'سفارش خدمت',a:'data-cba="attSvcIntro"'}
    ]),null);
  return true;
};

/* ─── F2) کارت «دفتر یادآور» در نمای کلی پروفایل — پیچاندن رندرِ موجود (wrap-only) ─── */
E25.remCardHTML=function(){
  var a=E25.sorted().slice(0,5),i,h,r,over;
  h='<div class="card" style="margin-top:16px"><div class="ct">دفتر یادآور</div>';
  if(!a.length){h+='<div class="empty">هنوز یادآوری ثبت نشده است — از گفت‌وگو اضافه کنید.</div>'}
  else{
    h+='<div class="acc-list">';
    for(i=0;i<a.length;i++){
      r=a[i];
      over=!r.done&&E25.daysLabel(r.due).indexOf('گذشته')>-1;
      h+='<div class="acc-row"><div class="main"><b>'+esc(r.title)+'</b><small>'+esc(faDate(r.due))+(r.amt?' • '+esc(rial(r.amt)):'')+'</small></div>'+
      (r.done?'<span class="badge b-ok">انجام شد</span>'
        :'<span class="badge'+(!over&&E25.daysLabel(r.due)==='امروز'?' b-warn':'')+'"'+(over?' style="color:var(--danger)"':'')+'>'+esc(E25.daysLabel(r.due))+'</span>')+
      '</div>';
    }
    h+='</div>';
  }
  h+='<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-view="landing">افزودن یادآور</button></div>'+
  '<p class="note" style="margin-top:8px">'+E25.HONEST_REM+'</p></div>';
  return h;
};
var _accOv25=accountOverviewHTML;
accountOverviewHTML=function(){return _accOv25()+E25.remCardHTML()}; /* افزودن کارت به انتهای نمای کلی */

/* ─── دیسپچر E25 — بیرونی‌ترین پیچ ceSend (بعد از گارد busy در ceSendWithAtt) ───
   ترتیب: E22 (busy) → E25 (مینی‌فلو یادآور → مبلغ در انتظار کمیسیون → F1–F5 با noFlow) → E23 → E21.preSend → ceSend اصلی. */
var _ceSend25=ceSend;
ceSend=function(t0){
  var t=String(t0==null?'':t0);
  var tt=t.replace(/^\s+|\s+$/g,'');
  try{
    if(tt&&tt.charAt(0)!=='!'&&tt.indexOf('F:')!==0&&tt.charAt(0)!=='↩'){
      var nt=E21.enNorm(tt),nn=normFa(nt);
      if(E25.remFlow(nn,tt))return;      /* مینی‌فلو یادآور — قبل از همهٔ ماچرها */
      if(E25.commMoney(nn,tt))return;    /* مبلغ در انتظار کمیسیون */
      if(E21.noFlow()){
        if(E25.commIntent(nn,tt))return; /* F1 */
        if(E25.remIntent(nn,tt))return;  /* F2 */
        if(E25.rentInc(nn,tt))return;    /* F3 */
        if(E25.invest(nn,tt))return;     /* F4 */
        if(E25.brief(nn,tt))return;      /* F5 */
      }
    }
  }catch(e){/* خطا: متن به زنجیرهٔ اصلی سپرده می‌شود — الگوی E23 */}
  return _ceSend25(t);
};
/* ═══ پایان بخش E25 ═══ */
