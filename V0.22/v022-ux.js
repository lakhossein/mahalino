/* ═══ ۲۱.۱۰) موتور UX نسخهٔ ۰.۲۲ — حالت تاریک، تاریخچهٔ گفت‌وگو، بازخورد کامپوزر، مدیریت فوکوس (E22) ═══
   این بخش عیناً پیش از «راه‌اندازی» (بخش ۲۲) و بعد از بلاک Agent E (E21) درج می‌شود؛ پس همهٔ
   تعریف‌های قبلی از قبل موجودند و اینجا فقط «پیچیده» می‌شوند (save-original) — چیزی بازتعریف
   یا حذف نمی‌شود. پایداری فقط از مسیر S/save() موجود (کلیدهای S.ui.theme و S.chats داخل S).
   هیچ ادعای تازه‌ای وجود ندارد: حالت تاریک فقط ظاهر است؛ بازیابی گفت‌وگو فقط پیام‌ها را برمی‌گرداند
   نه مکان‌نما‌های فلو را؛ پیوست‌ها جلسه‌ای می‌مانند (در نسخهٔ ذخیره پیش‌نمایش‌های جلسه‌ای حذف می‌شوند).
   رشته‌ها فارسی؛ اعداد با fa()؛ فقط ویژگی‌های سپرده‌شده (delegation)، بدون onclick خطی. */

/* ─── W5: aria-live روی toast-root (گارد؛ در HTML استاتیک موجود است) ─── */
(function(){
  var tr=document.getElementById('toast-root');
  if(tr&&!tr.getAttribute('aria-live'))tr.setAttribute('aria-live','polite');
})();

/* ─── وضعیت ماژول (فقط نشست جاری؛ پایدارها داخل S) ─── */
var E22={
  busyCount:0,      /* شمارندهٔ پنجره‌های باز برای W3 */
  filter:'',        /* عبارت جست‌وجوی تاریخچه ( sticky تا بسته‌شدن سایدبار) */
  lastFocus:null,   /* فوکوس پیش از پنجره (W4 — تور ایمنی) */
  restoredId:null   /* شناسهٔ گفت‌وگوی بازیابی‌شده برای جلوگیری از بایگانی دوباره */
};

/* آیکن‌های خطی خودمان (ICONS اصلی دست نمی‌خورد) */
E22.svg=function(p){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+p+'</svg>'};
E22.ICO={
  moon:E22.svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sun:E22.svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  chat:E22.svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>')
};

/* ═══ W1 — حالت تاریک ═══ */
E22.isDark=function(){return !!(S.ui&&S.ui.theme==='dark')};
E22.applyTheme=function(){
  try{
    if(E22.isDark())document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.removeAttribute('data-theme');
  }catch(e){}
  E22.syncThemeControls();
};
E22.syncThemeControls=function(){
  var dark=E22.isDark(),lab=dark?'حالت روشن':'حالت تاریک';
  var b=document.querySelector('#side [data-act="themeToggle"]');
  if(b){
    b.setAttribute('aria-pressed',dark?'true':'false');
    b.setAttribute('aria-label',lab);
    b.setAttribute('title',lab);
    b.innerHTML=dark?E22.ICO.sun:E22.ICO.moon;
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-act="themeSet"]'),function(x){
    if(!x.getAttribute)return;
    var on=(x.getAttribute('data-v')==='dark')===dark;
    x.setAttribute('aria-pressed',on?'true':'false');
  });
};
E22.setTheme=function(v,msg){
  if(!S.ui)S.ui={};
  S.ui.theme=(v==='dark')?'dark':'light';
  save();
  E22.applyTheme();
  if(msg)toast(msg);
};
ACT.themeToggle=function(){
  var dark=E22.isDark();
  E22.setTheme(dark?'light':'dark',dark?'حالت روشن فعال شد':'حالت تاریک فعال شد');
};
ACT.themeSet=function(el){
  var v=(el&&el.getAttribute)?el.getAttribute('data-v'):'light';
  var changed=(v==='dark')!==E22.isDark();
  E22.setTheme(v,changed?((v==='dark')?'حالت تاریک فعال شد':'حالت روشن فعال شد'):null);
};

/* ═══ W1/W2 — تزریق به سایدبار پس از رندر اصلی (پیچ renderSidebar) ═══ */
E22.afterSidebar=function(){
  var el=document.getElementById('side');
  if(!el||!S.auth||!el.innerHTML)return;
  var dark=E22.isDark(),lab=dark?'حالت روشن':'حالت تاریک';
  el.insertAdjacentHTML('afterbegin',
    '<div class="e22-shead"><button class="e22-theme" type="button" data-act="themeToggle" aria-pressed="'+(dark?'true':'false')+'" aria-label="'+lab+'" title="'+lab+'">'+(dark?E22.ICO.sun:E22.ICO.moon)+'</button></div>');
  var sh=E22.sessHTML();
  if(sh){
    el.insertAdjacentHTML('beforeend',sh);
    var inp=el.querySelector('.e22-sfilter-in');
    if(inp)inp.addEventListener('input',function(){E22.filter=inp.value;E22.applySessFilter()});
    E22.applySessFilter();
  }
};

/* ═══ W2 — تاریخچهٔ گفت‌وگوها ═══ */
E22.CAP=12;    /* سقف گفت‌وگوهای غیرسنجاق‌شده */
E22.MAXH=60;   /* سقف پیام در هر بایگانی (هم‌راستا با برش HIST در botC) */
E22.NOTE='گفت‌وگوی پیشین بازیابی شد؛ فلوهای در جریان از «درخواست‌های من» ادامه می‌یابند.';
E22.findSess=function(id){
  if(!id||!S.chats)return null;
  for(var i=0;i<S.chats.length;i++){if(S.chats[i]&&S.chats[i].id===id)return S.chats[i]}
  return null;
};
/* عنوان = نخستین پیام کاربر؛ پیش‌نمایش پیوستِ جلسه‌ای (attgrid) از آن جدا می‌شود */
E22.titleFromHist=function(){
  for(var i=0;i<HIST.length;i++){
    if(HIST[i]&&HIST[i].r==='user'){
      var t=String(HIST[i].h||'').replace(/<div class="attgrid">[\s\S]*$/,'');
      t=t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/\s+/g,' ').trim();
      return t;
    }
  }
  return '';
};
/* بایگانی پیش از «گفت‌وگوی جدید» — فقط از ACT.chatNew پیچ‌شده صدا زده می‌شود */
E22.collect=function(){
  if(!S.chats)S.chats=[];
  var users=0,i;
  for(i=0;i<HIST.length;i++){if(HIST[i]&&HIST[i].r==='user')users++}
  if(users<2)return; /* گفت‌وگوی کمتر از دو پیام کاربر بایگانی نمی‌شود */
  var title=E22.titleFromHist();
  if(!title)title='گفت‌وگوی بدون عنوان';
  if(title.length>40)title=title.slice(0,40);
  /* کپی عمیقِ کافی؛ پیش‌نمایش پیوست‌های جلسه‌ای (blob) ذخیره نمی‌شود — صادقانه */
  var copy=HIST.slice(0,E22.MAXH).map(function(m){
    return {r:m.r,h:String(m.h||'').replace(/<div class="attgrid">[\s\S]*?<\/div>/g,''),
            c:m.c?m.c.map(function(y){return y.slice()}):null};
  });
  var updated=null;
  if(E22.restoredId){
    updated=E22.findSess(E22.restoredId);
    if(updated){updated.hist=copy;updated.ts=Date.now()} /* ادامهٔ همان گفت‌وگو — رکورد تازه نساز */
  }
  if(!updated){
    S.chats.unshift({id:'CH-'+Date.now().toString(36),title:title,ts:Date.now(),pinned:false,hist:copy});
  }
  E22.restoredId=null;
  /* سقف ۱۲ برای غیرسنجاق‌شده‌ها؛ کهنه‌ترین حذف می‌شود — فقط اگر چیزی حذف شد */
  var rest=S.chats.filter(function(s){return s&&!s.pinned}),dropped=0;
  if(rest.length>E22.CAP){
    rest.sort(function(a,b){return a.ts-b.ts});
    rest.slice(0,rest.length-E22.CAP).forEach(function(v){
      var ix=S.chats.indexOf(v);if(ix>=0){S.chats.splice(ix,1);dropped++}
    });
  }
  save();
  if(dropped)toast('قدیمی‌ترین گفت‌وگوی پیشین حذف شد تا سقف '+fa(E22.CAP,0)+' رعایت شود');
};
/* زمان نسبی کوچک برای فهرست */
E22.rel=function(ts){
  try{
    var d=new Date(ts),n=new Date();
    var d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
    var t0=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    var diff=Math.round((d0-t0)/864e5);
    if(diff<=0)return 'امروز';
    if(diff===1)return 'دیروز';
    if(diff<7)return fa(diff,0)+' روز پیش';
    return fd(ts);
  }catch(e){return ''}
};
E22.sessHTML=function(){
  if(!S.chats||!S.chats.length)return '';
  var valid=S.chats.filter(function(s){return s&&s.id&&s.hist});
  var pin=valid.filter(function(s){return s.pinned}).sort(function(a,b){return b.ts-a.ts});
  var rest=valid.filter(function(s){return !s.pinned}).sort(function(a,b){return b.ts-a.ts});
  if(!pin.length&&!rest.length)return '';
  function row(s){
    var pinLab=s.pinned?'برداشتن سنجاق گفت‌وگو':'سنجاق کردن گفت‌وگو';
    return '<div class="sitem e22-sess" data-act="sessOpen" data-sess="'+qesc(s.id)+'" role="button" tabindex="0" title="بازیابی این گفت‌وگو">'+
      '<span class="si" aria-hidden="true">'+E22.ICO.chat+'</span>'+
      '<span class="e22-sess-main"><span class="e22-sess-t">'+esc(s.title||'بدون عنوان')+'</span>'+
      '<small class="e22-sess-time">'+E22.rel(s.ts)+' · '+fa((s.hist||[]).length,0)+' پیام</small></span>'+
      '<span class="e22-sess-acts">'+
      '<button class="e22-sact" type="button" data-act="sessPin" data-sess="'+qesc(s.id)+'" aria-pressed="'+(s.pinned?'true':'false')+'" aria-label="'+pinLab+'" title="'+pinLab+'">'+(s.pinned?'📌':'📍')+'</button>'+
      '<button class="e22-sact e22-sact-del" type="button" data-act="sessDel" data-sess="'+qesc(s.id)+'" aria-label="حذف گفت‌وگو" title="حذف گفت‌وگو">×</button>'+
      '</span></div>';
  }
  var h='<div class="sg">گفت‌وگوهای پیشین</div>'+
    '<div class="e22-sfilter"><input class="e22-sfilter-in" type="text" placeholder="جست‌وجو در تاریخچه…" aria-label="جست‌وجو در گفت‌وگوهای پیشین" value="'+qesc(E22.filter||'')+'"></div>';
  if(pin.length){
    h+='<div class="e22-sess-gsub">📌 سنجاق‌شده</div>';
    pin.forEach(function(s){h+=row(s)});
  }
  rest.forEach(function(s){h+=row(s)});
  return h;
};
E22.applySessFilter=function(){
  var el=document.getElementById('side');
  if(!el)return;
  var f=E22.filter?normFa(E22.filter):'';
  Array.prototype.forEach.call(el.querySelectorAll('.e22-sess'),function(row){
    var tEl=row.querySelector('.e22-sess-t');
    var t=normFa(tEl?tEl.textContent:'');
    row.hidden=!!f&&t.indexOf(f)<0;
  });
};
ACT.sessOpen=function(el){
  var s=E22.findSess((el&&el.getAttribute)?el.getAttribute('data-sess'):null);
  if(!s){toast('این گفت‌وگو در تاریخچه پیدا نشد.');return}
  HIST=(s.hist||[]).map(function(x){
    return {r:x.r,h:x.h,c:x.c?x.c.map(function(y){return y.slice()}):null};
  });
  cr();
  E22.restoredId=s.id;
  setMenuOpen(false);
  botC(E22.NOTE); /* پیام زندهٔ فقط-نمایش؛ در بایگانی بعدی بخشی از تاریخچهٔ همین گفت‌وگو می‌ماند */
  if(CURRENT!=='landing'){try{toggleF(true)}catch(e){}}
};
ACT.sessPin=function(el){
  var s=E22.findSess((el&&el.getAttribute)?el.getAttribute('data-sess'):null);
  if(!s)return;
  s.pinned=!s.pinned;
  save();
  renderSidebar();
  toast(s.pinned?'گفت‌وگو سنجاق شد':'سنجاق گفت‌وگو برداشته شد');
  /* کلیک داخل سایدبار در نمای کشویی آن را می‌بندد (رفتار موجود) — برای دیدن نتیجه دوباره باز می‌کنیم */
  if(window.matchMedia&&window.matchMedia('(max-width:980px)').matches)setMenuOpen(true);
};
ACT.sessDel=function(el){
  var id=(el&&el.getAttribute)?el.getAttribute('data-sess'):null;
  var s=E22.findSess(id);
  if(!s){toast('این گفت‌وگو در تاریخچه پیدا نشد.');return}
  openModal('<h3>حذف گفت‌وگو</h3>'+
    '<p class="note">گفت‌وگوی «'+esc(s.title||'بدون عنوان')+'» و '+fa((s.hist||[]).length,0)+' پیام آن از تاریخچه حذف می‌شود. این کار بازگردانی ندارد.</p>'+
    '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-danger" data-act="sessDelOk" data-sess="'+qesc(id)+'">حذف گفت‌وگو</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.sessDelOk=function(el){
  var id=(el&&el.getAttribute)?el.getAttribute('data-sess'):null;
  var s=E22.findSess(id);
  if(s&&S.chats){
    var ix=S.chats.indexOf(s);
    if(ix>=0)S.chats.splice(ix,1);
    save();
  }
  if(E22.restoredId===id)E22.restoredId=null;
  closeModal();
  renderSidebar();
  if(window.matchMedia&&window.matchMedia('(max-width:980px)').matches)setMenuOpen(true);
  toast('گفت‌وگو از تاریخچه حذف شد');
};

/* ═══ پیچ‌های save-original (زنجیره روی E21) ═══ */

/* W2: بایگانی پیش از گفت‌وگوی جدید — ACT.chatNew الان پیچِ E21 است؛ این پیچ روی آن سوار می‌شود */
var _oChatNew22=ACT.chatNew;
ACT.chatNew=function(){
  try{E22.collect()}catch(e){}
  _oChatNew22();
  try{renderSidebar()}catch(e){} /* بایگانی تازه باید بی‌درنگ در سایدبار دیده شود */
};

/* W1/W2: تزریق پس از رندر سایدبار */
var _oRenderSidebar22=renderSidebar;
renderSidebar=function(){
  _oRenderSidebar22();
  try{E22.afterSidebar()}catch(e){}
};

/* W1: ردیف «حالت نمایش» در تب تنظیمات حساب */
var _oAccSet22=accountSettingsHTML;
accountSettingsHTML=function(){
  var dark=E22.isDark();
  return _oAccSet22()+
  '<div class="card" style="margin-top:14px"><div class="ct">حالت نمایش</div>'+
  '<p class="note">حالت تاریک فقط ظاهر برنامه را عوض می‌کند؛ داده‌ها و فلوها دست‌نخورده می‌مانند. انتخاب شما در همین مرورگر ذخیره می‌شود.</p>'+
  '<div class="e22-seg" role="group" aria-label="حالت نمایش">'+
  '<button class="e22-segbtn" type="button" data-act="themeSet" data-v="light" aria-pressed="'+(dark?'false':'true')+'">روشن</button>'+
  '<button class="e22-segbtn" type="button" data-act="themeSet" data-v="dark" aria-pressed="'+(dark?'true':'false')+'">تاریک</button>'+
  '</div></div>';
};

/* W3: بازخورد کامپوزرها هنگام پنجرهٔ باز (پردازش مسدودکننده) */
E22.busy=function(n){
  E22.busyCount=Math.max(0,(E22.busyCount||0)+(n||0));
  var on=E22.busyCount>0;
  ['chat','fch','dash'].forEach(function(sf){
    var cwr=document.getElementById(sf+'Cwr');
    if(!cwr)return;
    cwr.classList.toggle('sendbusy',on);
    var btn=cwr.querySelector('.cwr-send');if(btn){try{btn.disabled=on}catch(e){}}
    var ta=cwr.querySelector('.cwr-in');if(ta){try{ta.readOnly=on}catch(e){}}
  });
};
var _oOpenModal22=openModal;
openModal=function(html,cb){
  E22.lastFocus=document.activeElement; /* W4 */
  E22.busy(1);
  return _oOpenModal22(html,cb);
};
var _oCloseModal22=closeModal;
closeModal=function(){
  _oCloseModal22();
  E22.busy(-1); /* با گارد ≥۰ — بسته‌شدن بدون پنجره هم بی‌خطر است */
  try{
    /* W4: اگر برنامه (MODAL_PREV) فوکوس را برنگردانده باشد، تور ایمنی ما برمی‌گرداند */
    if(E22.lastFocus&&document.contains(E22.lastFocus)&&document.activeElement===document.body)E22.lastFocus.focus();
  }catch(e){}
  E22.lastFocus=null;
};

/* W3/W4: گارد ارسال هنگام پردازش + بازگردانی فوکوس همان سطح پس از ارسال */
var _oCeSendWithAtt22=ceSendWithAtt;
ceSendWithAtt=function(text,surface){
  if(E22.busyCount>0){toast('ابتدا پردازش جاری را تمام کنید');return}
  var sf=(surface==='fch'||surface==='dash')?surface:'chat';
  _oCeSendWithAtt22(text,surface);
  try{
    var ta=document.getElementById(sf+'In');
    if(ta&&document.contains(ta)&&!E22.busyCount)ta.focus();
  }catch(e){}
};

/* ─── راه‌اندازی اولیه: مقدارهای اولیهٔ پایدار + اعمال تم ذخیره‌شده (قبل از boot) ─── */
if(!S.ui)S.ui={};
if(!S.ui.theme)S.ui.theme=null;
if(!S.chats)S.chats=[];
E22.applyTheme();
/* ═══ پایان بخش E22 ═══ */
