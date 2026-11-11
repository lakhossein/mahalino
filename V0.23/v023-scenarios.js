/* ═══ ۲۱.۱۱) موتور سناریوهای گفت‌وگو (E23) — نسخهٔ ۰.۲۳ ═══
   این بخش عیناً پیش از «راه‌اندازی» (بخش ۲۲) و بعد از بلاک‌های E21 و E22 درج می‌شود؛
   پس همهٔ تعریف‌های قبلی موجودند و اینجا فقط «پیچیده» می‌شوند (save-original + chain) —
   هیچ موتور موازی کسب‌وکار، بازتعریف یا حذفی وجود ندارد. E23 روی زنجیرهٔ موجود سوار است:
     ceSendWithAtt(E22) → ceSend(E23) → ceSend(E21) → E21.preSend → ceSend(اصلی)
     ceVal(E23) → ceVal(E21) → ceVal(اصلی)
     E21.enNorm(E23) → E21.enNorm(اصلی)
   پایداری فقط از مسیر CTX/save() موجود؛ E23.temp فقط نشست جاری است (کلید localStorage تازه نیست).
   رشته‌ها فارسی؛ اعداد با fa()/rial()؛ فقط ویژگی‌های سپرده‌شده (delegation)؛ بدون توالی بستن اسکریپت در متن.
   پژوهش پشتیبان سناریوها: .mahalino-development/real-estate-research.md §7–§9. */

var E23={temp:null}; /* temp: مبلغِ در انتظار تصمیم کاربر در سناریوی ابهام S1 — فقط نشست جاری */
/* نرخ فرضی ماهانهٔ تبدیل رهن↔اجاره: عین literal موجود در RINT.scRentAfford
   (var rent=Math.round(CTX.dep*0.03) — «۳٪ در ماه») — نرخ دوم ساخته نشده؛ همین عدد بازآوری می‌شود. */
E23.RATE=0.03;

/* ─── S7) گسترش نرمال‌سازی — پیچاندن E21.enNorm (جدول‌های افزایشی؛ جدول اصلی ENMAP دست‌نخورده) ───
   بررسی‌شده: normFa نیم‌فاصله (U+200C) را به فاصله تبدیل می‌کند، پس «می‌خرم/می‌توانم» از قبل
   به «می خرم/می توانم» یکدست می‌شوند — ورودی اضافه لازم ندارند. «جوون→جوان» از قلمرو سامانه
   املاک بیرون است و عمداً نیامده است. */
E23.FAWORDS=[['کرایه','اجاره'],['محله‌سردار','محله'],['منطقه','محله'],['منطقهٔ','محلهٔ'],['خونه','خانه'],['خریدن','خرید']];
E23.EN2=[['agency','آژانس'],['landlord','موجر'],['tenant','مستأجر'],['agent','مشاور']];
E23.faRep=function(s,w,f){
  var re=new RegExp('(^|[^آ-ی])'+w+'([^آ-ی]|$)','g'),i;
  for(i=0;i<2;i++){s=s.replace(re,function(m0,m1,m2){return m1+f+m2})}
  return s;
};
var _enNorm23=E21.enNorm;
E21.enNorm=function(t){
  var s=_enNorm23(t),i;
  for(i=0;i<E23.FAWORDS.length;i++){s=E23.faRep(s,E23.FAWORDS[i][0],E23.FAWORDS[i][1])}
  for(i=0;i<E23.EN2.length;i++){
    var w=E23.EN2[i][0],f2=E23.EN2[i][1];
    var re=new RegExp('(^|[^A-Za-z])'+w+'([^A-Za-z]|$)','gi');
    s=s.replace(re,function(m0,m1,m2){return m1+f2+m2});
  }
  return s;
};

/* ─── ابزارهای مشترک سناریوها ─── */
E23.usr=function(raw){if(!E21.chipUsr)usrC(raw)}; /* نمایش پیام کاربر — الگوی E21.preSend */
E23.moneyScan=function(nn){
  var re=/([0-9][0-9.,]*)\s*(میلیارد|میلیون|هزار)(\s*(تومان|تومن))?/g,mm,out=[];
  while((mm=re.exec(nn))){
    var frag=mm[0],
        before=nn.slice(Math.max(0,mm.index-26),mm.index),
        after=nn.slice(mm.index+mm[0].length,mm.index+mm[0].length+26),
        pm=parseMoneyFA(frag);
    out.push({frag:frag,ok:!!pm.ok,value:pm.ok?pm.value:0,before:before,after:after});
  }
  return out;
};
E23.tagOf=function(m){ /* قراردادِ برچسب‌گذاری مثل E21.slotExtract — بدون نوشتن در CTX */
  if(/ودیعه|رهن/.test(m.before))return 'dep';
  if(/اجاره/.test(m.before))return 'rent';
  if(/بودجه|بخرم|خرید|سرمایه/.test(m.before))return 'budg';
  if(/ودیعه|رهن/.test(m.after))return 'dep';
  if(/اجاره/.test(m.after))return 'rent';
  if(/بودجه|بخرم|خرید|سرمایه/.test(m.after))return 'budg';
  return null;
};
/* همسایگیِ بی‌واسطهٔ مبلغ با «اجاره/رهن» — مبنای تشخیص جهت؛ واژهٔ پرسش («چند رهن») نباید
   برچسب مبلغ را عوض کند، پس فقط چسبیده‌به-مبلغ بودن ملاک است */
E23.adjSide=function(m){
  if(/اجاره\s*$/.test(m.before)||/^(\s*(تومان|تومن))?\s*اجاره/.test(m.after))return 'rent';
  if(/(رهن|ودیعه)\s*$/.test(m.before)||/^\s*(رهن|ودیعه)/.test(m.after))return 'dep';
  return null;
};

/* ─── S1) مبدل دوطرفهٔ رهن↔اجاره (پژوهش P0؛ محض ریاضی) ─── */
E23.CUE_DEP=/(چند|چقدر|چنده)\s*اجاره|اجاره\s*(چند|چقدر|چنده)|کم\s*می\s*شه/;
E23.CUE_RENT=/(چند|چقدر|چنده)\s*(رهن|ودیعه)|(رهن|ودیعه)\s*(چند|چقدر|چنده)/;
E23.CUE_GEN=/تبدیل|نرخ تبدیل/;
E23.RATE_CUE=function(nn){return /(هر\s*(میلیون|میلیارد|تومان|تومن))/.test(nn)};
E23.showConv=function(dir,v){
  var pc=fa(E23.RATE*100,0);
  if(dir==='rent2dep'){
    var dep=Math.round(v/E23.RATE);
    CTX.rent=v;CTX.lastIntent='rentafford';
    botC('تبدیل اجاره به ودیعه با نرخ فرضی «'+pc+'٪ در ماه»:'+
    rcConfirm([
      {l:'اجارهٔ ورودی (ماهانه)',v:rial(v)},
      {l:'ودیعهٔ معادل',v:'≈ '+rial(dep)}
    ])+
    '<p class="note" style="margin-top:6px">فرمول: ودیعه ≈ اجارهٔ ماهانه ÷ '+pc+'٪.</p>'+
    rcNote('نرخ فرضی ماهانه '+pc+'٪ — توافق مالک و مستأجر ملاک قانونی است؛ این فقط محاسبهٔ راهنماست. سقف اجاره در این گفت‌وگو ذخیره شد.')+
    rcActs([
      {l:'شروع اجاره با همین سقف اجاره',a:'data-cf="rent"',p:1},
      {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'}
    ]),null);
    return;
  }
  var rent=Math.round(v*E23.RATE);
  CTX.dep=v;CTX.lastIntent='rentafford';
  botC('تبدیل ودیعه به اجاره با نرخ فرضی «'+pc+'٪ در ماه»:'+
  rcConfirm([
    {l:'ودیعهٔ ورودی',v:rial(v)},
    {l:'اجارهٔ معادل (ماهانه)',v:'≈ '+rial(rent)}
  ])+
  '<p class="note" style="margin-top:6px">فرمول: اجاره ≈ ودیعه × '+pc+'٪ در ماه.</p>'+
  rcNote('نرخ فرضی ماهانه '+pc+'٪ — توافق مالک و مستأجر ملاک قانونی است؛ این فقط محاسبهٔ راهنماست. ودیعه در این گفت‌وگو ذخیره شد.')+
  rcActs([
    {l:'شروع اجاره با همین ودیعه',a:'data-cf="rent"',p:1},
    {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'}
  ]),null);
};
E23.clarify=function(v){
  E23.temp={value:v};
  botC('مبلغ '+rial(v)+' را برای «رهن» می‌گویید یا «اجاره»؟ یکی را انتخاب کنید تا معادلش را با نرخ فرضی «'+fa(E23.RATE*100,0)+'٪ در ماه» حساب کنم.'+
  rcActs([
    {l:'این ودیعه است — اجارهٔ معادل را بده',a:'data-cba="e23convDep"',p:1},
    {l:'این اجارهٔ ماهانه است — ودیعهٔ معادل را بده',a:'data-cba="e23convRent"'}
  ])+
  rcNote('نرخ فرضی ماهانه '+fa(E23.RATE*100,0)+'٪ — توافق مالک و مستأجر ملاک قانونی است؛ این فقط محاسبهٔ راهنماست.'),null);
};
E23.convAsk=function(){
  var ex=Math.round(1000000000*E23.RATE);
  botC('تبدیل رهن↔اجاره را با نرخ فرضی «'+fa(E23.RATE*100,0)+'٪ در ماه» حساب می‌کنم؛ مثلاً هر '+rial(1000000000)+' ودیعه ≈ '+rial(ex)+' اجارهٔ ماهانه. مبلغ را بنویسید تا دوطرفه حساب کنم — مثلاً «۱۵۰ میلیون رهن بدم اجاره چقدر می‌شه؟» یا «۲ میلیون تومان اجاره چند رهن می‌خوره؟».'+
  rcNote('نرخ فرضی ماهانه '+fa(E23.RATE*100,0)+'٪ — توافق مالک و مستأجر ملاک قانونی است؛ این فقط محاسبهٔ راهنماست.'),null);
};
E23.conv=function(nn,raw){
  if(!E21.noFlow())return false;
  var ms=E23.moneyScan(nn);
  var hasDep=/رهن|ودیعه/.test(nn),hasRent=/اجاره/.test(nn);
  var amb=/(رهن|ودیعه)\s*یا\s*اجاره|اجاره\s*یا\s*(رهن|ودیعه)/.test(nn)&&!/تبدیل/.test(nn);
  var dir=null,i,m,tagged=null;
  if(/تبدیل\s*(رهن|ودیعه)\s*(به|تا)\s*اجاره/.test(nn))dir='dep2rent';
  else if(/تبدیل\s*اجاره\s*(به|تا)\s*(رهن|ودیعه)/.test(nn))dir='rent2dep';
  for(i=0;i<ms.length;i++){var tg=E23.tagOf(ms[i]);if(tg==='dep'||tg==='rent'){tagged={tag:tg,m:ms[i]};break}}
  if(ms.length){
    if(amb&&!dir){E23.usr(raw);E23.clarify(ms[0].ok?ms[0].value:0);return true}
    if(!dir){
      var adj=E23.adjSide(ms[0]);
      if(E23.CUE_RENT.test(nn)&&(adj==='rent'||(adj===null&&(tagged?tagged.tag==='rent':hasRent))))dir='rent2dep';
      else if(E23.CUE_DEP.test(nn)&&(adj==='dep'||(adj===null&&(tagged?tagged.tag==='dep':hasDep))))dir='dep2rent';
      else if(E23.CUE_GEN.test(nn)||(hasDep&&E23.RATE_CUE(nn)))dir=tagged?(tagged.tag==='rent'?'rent2dep':'dep2rent'):(hasRent&&!hasDep?'rent2dep':'dep2rent');
      else return false; /* نیت تبدیل نبود — مسیر موجود (مثل scRentAfford) دست‌نخورده */
    }
    var side=(dir==='rent2dep')?'rent':'dep',val=null;
    for(i=0;i<ms.length;i++){if(E23.tagOf(ms[i])===side&&ms[i].ok){val=ms[i].value;break}}
    if(val==null){for(i=0;i<ms.length;i++){if(ms[i].ok){val=ms[i].value;break}}}
    if(!val)return false; /* پارس مبلغ ناموفق — پیام خطای پارسرِ مسیر اصلی */
    E23.usr(raw);
    E23.showConv(dir,val);
    return true;
  }
  /* بدون مبلغ — فقط نیت تبدیل صریح؛ پرسش قیمتِ بازار عمداً اینجا نمی‌آید */
  var edu=(E23.CUE_GEN.test(nn)&&(hasDep||hasRent))||
          (hasDep&&hasRent&&(E23.CUE_DEP.test(nn)||E23.CUE_RENT.test(nn)))||
          (hasDep&&/(هر\s*(میلیون|میلیارد|تومان|تومن))/.test(nn)&&/چنده|چقدر/.test(nn));
  if(!edu)return false;
  E23.usr(raw);
  E23.convAsk();
  return true;
};
CBACT.e23convDep=function(){var t=E23.temp;E23.temp=null;if(!t||!t.value){botC('مبلغی برای تبدیل در گفت‌وگو نیست؛ مبلغ را بنویسید (مثلاً «۱۵۰ میلیون رهن»).',null);return}E23.showConv('dep2rent',t.value)};
CBACT.e23convRent=function(){var t=E23.temp;E23.temp=null;if(!t||!t.value){botC('مبلغی برای تبدیل در گفت‌وگو نیست؛ مبلغ را بنویسید (مثلاً «۲ میلیون تومان اجاره»).',null);return}E23.showConv('rent2dep',t.value)};

/* ─── S2) راهنمای قرارداد و «کد رهگیری» (پژوهش §8-S2؛ فقط آموزش و مسیریابی) ─── */
E23.edu=function(nn,raw){
  var postal=/مرسوله|مرسولات|پستی|پیک|پاپکت|بسته پستی/.test(nn); /* کد رهگیری پستی — از قلمرو بیرون */
  var strong=!postal&&/کد رهگیری|ثبت قرارداد|قرارداد رسمی|خودنویس|سند رهن و اجاره|ثبت اجاره نامه|ثبت اجارهنامه/.test(nn);
  var weak=!strong&&!postal&&/رهگیری/.test(nn)&&/رهن|اجاره|قرارداد|ملک|خانه|محلینو/.test(nn);
  if(!strong&&!weak)return false;
  E23.usr(raw);
  botC('راهنمای قرارداد و «کد رهگیری» — دقیقاً همان‌طور که هست:'+
  rcTable(['موضوع','توضیح'],[
    [{h:esc('کد رهگیری رسمی')},{h:esc('کد ۱۳ رقمی که فقط سامانه‌های رسمی ثبت الکترونیک اجاره‌نامه صادر می‌کنند: خودنویس (khodnevis.mrud.ir) و سامانهٔ ثبت الکترونیک اجاره‌نامه (srem.mrud.ir) — وابسته به وزارت راه و شهرسازی. مبنای پیگیری رسمی، حل اختلاف و انتقال قبوض آب/برق/گاز است.')}],
    [{h:esc('کد داخلی محلینو')},{h:esc('قراردادِ این سامانه یک شناسهٔ داخلی و نسخهٔ چاپی (PDF) می‌سازد. این شناسه «کد داخلی محلینو» است — کد رهگیری رسمی نیست و جای ثبت رسمی را نمی‌گیرد.')}],
    [{h:esc('مدارک رایج ثبت رسمی')},{h:esc('شناسنامه و کارت ملی طرفین، سند یا مدارک مالکیت ملک، کد پستی ملک؛ فرم اجاره‌نامه در خودنویس تکمیل و کد رهگیری همان‌جا صادر می‌شود. فهرست نهایی مدارک را همان سامانهٔ رسمی مشخص می‌کند.')}],
    [{h:esc('مستأجر / موجر')},{h:esc('ثبت رسمی به نفع هر دو طرف است: مستأجر سند معتبر برای انتقال انشعاب‌ها دارد و موجر مرجع رسمی در اختلاف. در پیش‌نویس محلینو هم نقش‌ها (موجر/مستأجر) ثبت می‌شوند.')}]
  ])+
  rcNote('محلینو ثبت رسمی انجام نمی‌دهد؛ برای ثبت رسمی به سامانهٔ رسمی (خودنویس / srem.mrud.ir) مراجعه کنید.')+
  rcActs([
    {l:'شروع پیش‌نویس قرارداد (پس از انتخاب ملک در فلوی اجاره)',a:'data-cf="rent"',p:1},
    {l:'مشاهدهٔ قراردادها',a:'data-act="dt" data-t="con"'}
  ]),null);
  return true;
};

/* ─── S3) چک‌لیست بازدید (پژوهش §8-S3؛ فقط اطلاع‌رسانی، بدون تغییر وضعیت) ─── */
E23.checklist=function(nn,raw){
  var c1=/چک لیست/.test(nn)&&/بازدید|ملک|خانه|اجاره/.test(nn);
  var c2=/هنگام بازدید/.test(nn)||(/بازدید/.test(nn)&&/چک کنم|ببینم|چه چیزی|چی چک|سر بزنم/.test(nn));
  if(!c1&&!c2)return false;
  E23.usr(raw);
  botC('چک‌لیست بازدید ملک — هنگام دیدن، این ۹ مورد را بررسی کنید:'+
  rcTable(['بخش','چه چیز را ببینید'],[
    [{h:esc('نور طبیعی')},{h:esc('در دو زمان از روز ببینید؛ جهت پنجره‌ها و نور مستقیم — برای فصل سرما مهم است.')}],
    [{h:esc('رطوبت و نم')},{h:esc('گوشهٔ دیوارها، سقف حمام و پشت کابینت؛ بوی نم و رنگ‌پریدگی زنگ خطر است.')}],
    [{h:esc('فشار آب')},{h:esc('شیرها را باز کنید؛ فشار آب گرم و سرد و تخلیهٔ سریع سیفون را بسنجید.')}],
    [{h:esc('برق و پریزها')},{h:esc('تعداد و کارکرد پریزها و کلیدها؛ برای کولر، ظرفیت برق را از مالک بپرسید.')}],
    [{h:esc('کف و صافی')},{h:esc('شیب کف سرویس و حمام (صافی آب به سمت کف‌شور) و ترک خوردگی کف و کاشی.')}],
    [{h:esc('درب و پنجره')},{h:esc('بسته‌شدن محکم درب‌ها، دیلیم پنجره‌ها و سلامت قفل‌ها؛ عایق صدا و گردوخاک.')}],
    [{h:esc('انباری و پارکینگ')},{h:esc('موقعیت واقعی انباری/پارکینگ: طبقه، دسترسی، سند جداگانه یا تضمینی بودن.')}],
    [{h:esc('همسایگی و رفت‌وآمد')},{h:esc('یک دور در ساعات اوج: صدای پله و همسایه‌ها، دسترسی مترو/اتوبوس و فروشگاه‌ها.')}],
    [{h:esc('حمل اثاثه')},{h:esc('آسانسور (اندازهٔ کابین) یا پله‌ها؛ مسیر بارگیری و هماهنگی اسباب‌کشی با ساختمان.')}]
  ])+
  rcNote('چک‌لیست راهنمای عمومی است؛ در فلوی اجاره، چک‌لیست بازدید همان‌جا قابل علامت‌زدن است.')+
  rcActs([
    {l:'شروع فلوی اجاره',a:'data-cf="rent"',p:1},
    {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'}
  ]),null);
  return true;
};

/* ─── S4) ورود اول-بودجه (پژوهش §8-S4) — فقط عبارت‌های «کجا…کنم/بگیرم» که مسیر موجود نمی‌گیرد ───
   عبارت‌های جاافتادهٔ مسیر موجود (بتونم/می تونم/توان خرید/چند متر/بخرم) عمداً رد می‌شوند تا مسیر قبلی عیناً بماند. */
E23.afford=function(nn,nt,raw){
  if(/بتونم|می تونم|می توانم|توان خرید|چند متر/.test(nn))return false;
  if(!/کجا|کدوم محله|کدام محله/.test(nn))return false;
  var ms=E23.moneyScan(nn);
  if(!ms.length||!ms[0].ok)return false;
  E23.usr(raw);
  if(/بخرم|خرید|مبایعه/.test(nn)){RINT.scAfford(raw,nt);return true}
  if(/اجاره|رهن|ودیعه|خانه|بگیرم/.test(nn)){RINT.scRentAfford(raw,nt);return true}
  return false;
};

/* ─── S5) دوئل دو محله با «یا» (پژوهش §8-S8) — فقط وقتی مسیر موجود نمی‌گیرد ───
   «مقایسه/کدوم بهتر/بازار/قیمت…» رد می‌شود تا scCompare/scMarket عیناً بمانند؛ الگوی «پونک یا نارمک؟»
   امروز تا OOS پیش می‌رود (بررسی‌شده در RINT.route و ceSend). */
E23.duel=function(nn,nt,raw){
  if(/مقایسه|کدوم بهتر|کدام بهتر|بازار|روند|تورم|میانگین|قیمت|آمار|امتیاز محله|چنده|چقدره|نرخش|قیمتش|چطور|چگونه|مراحل|فرایند|فرآیند/.test(nn))return false;
  if(/[۰-۹0-9]/.test(nn)&&/میلیارد|میلیون|هزار/.test(nn))return false;
  if(!/(^|[^آ-ی])یا([^آ-ی]|$)/.test(nn))return false;
  var hs=hoodsIn(nn);
  if(hs.length!==2)return false;
  E23.usr(raw);
  var a=hs[0],b=hs[1],m=null,Dw=null,tbl=null;
  if(wfLive('rent').length){m='rent';Dw=wfData('rent')}
  else if(wfLive('buy').length){m='buy';Dw=wfData('buy')}
  if(Dw){ /* جدول مقایسهٔ موجود با جابه‌جایی موقت cmpH — بلافاصله برمی‌گردد؛ ذخیره‌ای نمی‌ماند */
    var oldC=Dw.cmpH?Dw.cmpH.slice():null,hadC=!!Dw.cmpH;
    Dw.cmpH=[a.id,b.id];
    tbl=cmpHoodTable(m);
    if(hadC){Dw.cmpH=oldC}else{Dw.cmpH=[]}
  }
  if(tbl){
    botC('«'+esc(a.n)+'» یا «'+esc(b.n)+'»؟ «بهتر» به معیار شما بستگی دارد — جدول را روی ستون دلخواه مرتب کنید:'+tbl+
    rcNote('منبع آمار: کیلید (میانگین آگهی‌ها) و OpenStreetMap — آگهی نه معاملهٔ قطعی.')+
    rcActs([
      {l:'امتیاز محله‌ها',a:'data-cq="امتیاز محله‌ها"'},
      {l:'شروع اجاره',a:'data-cf="rent"',p:1}
    ]),null);
    return true;
  }
  RINT.scCompare(nt); /* بدون فلو: مقایسه‌گر چتِ موجود — بدون ساختن فلو تازه */
  return true;
};

/* ─── S7) دیسپچر سناریوها — پیچاندن ceSend (که الان پیچ E21 است) ───
   ترتیب: E22 (busy) → E23 → E21.preSend → ceSend اصلی. ماچرهای S1–S5 فقط بیرون فلو
   (!CE.f||CE.f==='gate' — همان E21.noFlow) و با تریگرهای دقیق بدون تداخل با ادعاهای E21 کار می‌کنند؛
   S7 (نرمال‌ساز) بالاتر روی E21.enNorm سوار است و روی همهٔ متن‌ها اعمال می‌شود. */
var _ceSend23=ceSend;
ceSend=function(t0){
  var t=String(t0==null?'':t0);
  var tt=t.replace(/^\s+|\s+$/g,'');
  if(tt&&tt.charAt(0)!=='!'&&tt.indexOf('F:')!==0&&tt.charAt(0)!=='↩'&&E21.noFlow()){
    try{
      var nt=E21.enNorm(tt),nn=normFa(nt);
      if(E23.conv(nn,tt))return;
      if(E23.edu(nn,tt))return;
      if(E23.checklist(nn,tt))return;
      if(E23.afford(nn,nt,tt))return;
      if(E23.duel(nn,nt,tt))return;
    }catch(e){/* خطا: متن به زنجیرهٔ اصلی سپرده می‌شود */}
  }
  return _ceSend23(t);
};

/* ─── S6) اصلاح محدودیت شناخته‌شدهٔ حلقهٔ اهمیت‌ها (imps-loop) — پیچاندن ceVal (که الان پیچ E21 است) ───
   در گام st.loop، پاسخ «تمام/تمام!» به‌جای نمرهٔ تک‌مورد، بقیهٔ موارد نمره‌نداده را «متوسط (۳)»
   می‌گذارد و فلو را جلو می‌برد — آینهٔ عین انشعاب loop در ceVal اصلی:
   D.P[k]=نمره؛ CE.li++؛ در پایان: CE.i++;CE.li=0;save();renderCurrent();ceStep().
   رفتار غیر-loop (تا گام «تمام» در vform و…) دست‌نخورده به _ceVal23 سپرده می‌شود. */
E23.NEUTRAL_IMP=3; /* میانهٔ مقیاس ۱–۵؛ همان مقدار پیش‌فرض parseImportance */
var _ceVal23=ceVal;
ceVal=function(v){
  v=String(v==null?'':v);
  try{
    if((v==='تمام'||v==='تمام!')&&CE.f&&SCRIPTS[CE.f]){
      var st=SCRIPTS[CE.f][CE.i],D=wd(CE.f).data;
      if(st&&st.loop&&CE.li<st.loop.length){
        if(!D.P){D.P={}}
        var i;
        for(i=CE.li;i<st.loop.length;i++){D.P[st.loop[i].k]=E23.NEUTRAL_IMP}
        CE.i++;CE.li=0;save();renderCurrent();
        botC('موارد باقی‌مانده با اهمیت متوسط لحاظ شد؛ بعداً با «بازگشت» قابل تغییر است.',null);
        ceStep();
        return;
      }
    }
  }catch(e){/* خطا: به زنجیرهٔ اصلی سپرده می‌شود */}
  return _ceVal23(v);
};
/* ═══ پایان بخش E23 ═══ */
