/* ═══ ۷) ناوبری ═══ */
var CURRENT='home',DASHT='flows',DASHF='open';
var SIDEOPEN=null; /* فلوی بازشده در منوی کناری — پیش‌فرض: همه بسته */
var SIDEFLOWS=[
{cat:'rent',ic:'',n:'اجاره',view:'rent'},
{cat:'buy',ic:'',n:'خرید و فروش',view:'buy'},

{cat:'invr',ic:'',n:'درآمد اجاره',act:'sinv',t:'r'},
{cat:'mkt',ic:'',n:'پروژه‌ها',view:'mkt'},
{cat:'build',ic:'',n:'ساخت و تأمین',view:'build'},
{cat:'stay',ic:'',n:'اقامتگاه',view:'stay'},
{cat:'grt',ic:'con',n:'اجاره تضمینی',view:'grt'},
{cat:'svc',ic:'svc',n:'خدمات ملک',view:'svc'}];
function cntCat(cat,f){
  var c=0;
  S.reqs.forEach(function(r){
    if(r.cat!==cat){return}
    if(f==='all')c++;
    else if(f==='open'&&r.status!=='کامل شد'&&r.status!=='لغو شد')c++;
    else if(f==='prog'&&r.status==='در حال انجام')c++;
    else if(f==='done'&&r.status==='کامل شد')c++;
  });
  return c;
}
/* V0.27 — سایدبار گفت‌وگومحور: فقط گفت‌وگوی جدید، جست‌وجو، تاریخچه، تنظیمات */
var E27={sq:'',renId:null,txBusy:false};
var E27_IC={
  newchat:"<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M12 5l0 14\" /> <path d=\"M5 12l14 0\" /></svg>",
  search:"<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0\" /> <path d=\"M21 21l-6 -6\" /></svg>",
  chat:"<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1\" /></svg>",
  fold:"<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12\" /> <path d=\"M15 4v16\" /> <path d=\"M9 10l2 2l-2 2\" /></svg>",
  unfold:"<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12\" /> <path d=\"M15 4v16\" /> <path d=\"M10 10l-2 2l2 2\" /></svg>",
  wallet:"<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12\" /> <path d=\"M20 12v4h-4a2 2 0 0 1 0 -4h4\" /></svg>",
  user:"<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0\" /> <path d=\"M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2\" /></svg>",
  gear:"<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065\" /> <path d=\"M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0\" /></svg>",
  trash:"<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M4 7l16 0\" /> <path d=\"M10 11l0 6\" /> <path d=\"M14 11l0 6\" /> <path d=\"M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12\" /> <path d=\"M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3\" /></svg>",
  pen:"<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4\" /> <path d=\"M13.5 6.5l4 4\" /></svg>",
  pin:"<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4\" /> <path d=\"M9 15l-4.5 4.5\" /> <path d=\"M14.5 4l5.5 5.5\" /></svg>",
  pinoff:"<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" style=\"flex:none\"><path d=\"M9 4v1\" /> <path d=\"M9 9v1l-2 4v2h9\" /> <path d=\"M16 12l-1 -2v-6\" /> <path d=\"M12 16v5\" /> <path d=\"M8 4h8\" /> <path d=\"M3 3l18 18\" /></svg>"
};
E27.groupOf=function(ts){
  try{
    var d=new Date(ts),n=new Date();
    var day=864e5,d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
    var t0=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    var diff=Math.round((d0-t0)/day);
    if(diff<=0)return 'امروز';
    if(diff===1)return 'دیروز';
    if(diff<7)return '۷ روز گذشته';
    if(diff<30)return '۳۰ روز گذشته';
    return 'قدیمی‌تر';
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/navigation.js:52',e,'caught');return ''}
};
E27.sessRow=function(s){
  var pinLab=s.pinned?'برداشتن سنجاق':'سنجاق کردن';
  return '<div class="sitem e22-sess e27-sess" data-act="sessOpen" data-sess="'+qesc(s.id)+'" role="button" tabindex="0" title="بازیابی این گفت‌وگو">'+
    '<span class="si" aria-hidden="true">'+E27_IC.chat+'</span>'+
    '<span class="e22-sess-main"><span class="e22-sess-t">'+esc(s.title||'بدون عنوان')+'</span>'+
    '<small class="e22-sess-time">'+E22.rel(s.ts)+' · '+fa((s.hist||[]).length,0)+' پیام</small></span>'+
    '<span class="e22-sess-acts">'+
    '<button class="e22-sact" type="button" data-act="sessPin" data-sess="'+qesc(s.id)+'" aria-pressed="'+(s.pinned?'true':'false')+'" aria-label="'+pinLab+'" title="'+pinLab+'">'+(s.pinned?E27_IC.pin:E27_IC.pinoff)+'</button>'+
    '<button class="e22-sact" type="button" data-act="sessRename" data-sess="'+qesc(s.id)+'" aria-label="تغییر نام گفت‌وگو" title="تغییر نام">'+E27_IC.pen+'</button>'+
    '<button class="e22-sact" type="button" data-act="e31MoveChat" data-sess="'+qesc(s.id)+'" title="انتقال به پروژه" aria-label="انتقال به پروژه">'+E27_IC.pin+'</button>'+
    '<button class="e22-sact e22-sact-del" type="button" data-act="sessDel" data-sess="'+qesc(s.id)+'" aria-label="حذف گفت‌وگو" title="حذف گفت‌وگو">'+E27_IC.trash+'</button>'+
    '</span></div>';
};
E27.sessListHTML=function(){
  if(!S.chats||!S.chats.length)return '<div class="note" style="padding:10px 8px;font-size:12px">هنوز گفت‌وگویی بایگانی نشده است. پس از گفت‌وگو با دستیار، تاریخچه اینجا می‌آید.</div>';
  var f=E27.sq?normFa(E27.sq):'';
  var valid=S.chats.filter(function(s){return s&&s.id&&s.hist});
  if(f){
    valid=valid.filter(function(s){
      if(normFa(s.title||'').indexOf(f)>=0)return true;
      return (s.hist||[]).some(function(m){return m&&m.h&&normFa(String(m.h).replace(/<[^>]*>/g,' ')).indexOf(f)>=0});
    });
  }
  if(!valid.length)return '<div class="note" style="padding:10px 8px;font-size:12px">نتیجه‌ای برای «'+esc(E27.sq)+'» پیدا نشد.</div>';
  var pin=valid.filter(function(s){return s.pinned}).sort(function(a,b){return b.ts-a.ts});
  var rest=valid.filter(function(s){return !s.pinned}).sort(function(a,b){return b.ts-a.ts});
  var h='';
  if(pin.length){h+='<div class="e27-sday">سنجاق‌شده</div>';pin.forEach(function(s){h+=E27.sessRow(s)})}
  var lastG=null;
  rest.forEach(function(s){
    var g=E27.groupOf(s.ts);
    if(g!==lastG){h+='<div class="e27-sday">'+g+'</div>';lastG=g}
    h+=E27.sessRow(s);
  });
  return h;
};
function renderSidebar(){
  if(window.E29&&E29.shell){try{E29.shell.renderSidebar();return}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/navigation.js:91',e,'caught');console.error('E29 sidebar',e)}}
  var el=document.getElementById('side'),app=document.getElementById('appwrap');
  if(!el){return}
  if(!S.auth){
    el.innerHTML='';el.style.display='none';
    if(app){app.style.gridTemplateColumns='1fr'}
    return;
  }
  el.style.display='';if(app){app.style.gridTemplateColumns=''}
  var fold=document.body.classList.contains('sidefold');
  var h='<div class="e27-sidehead"><button class="e27-fold" data-act="sideFold" aria-label="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'" title="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'">'+(fold?E27_IC.unfold:E27_IC.fold)+'</button></div>';
  h+='<button class="e27-new" data-act="chatNew">'+E27_IC.newchat+' گفت‌وگوی جدید</button>';
  h+='<div class="e27-search">'+E27_IC.search+'<input id="e27-sq" type="text" placeholder="جست‌وجو در گفت‌وگوها…" aria-label="جست‌وجو در گفت‌وگوها" value="'+qesc(E27.sq||'')+'"></div>';
  h+='<div class="e27-slist" id="e27-slist" aria-label="گفت‌وگوهای پیشین">'+E27.sessListHTML()+'</div>';
  h+='<div class="e27-sbot">'+
    '<button class="e27-srow" data-act="themeToggle" aria-pressed="'+(E22.isDark()?'true':'false')+'" aria-label="تغییر حالت روشن/تاریک"><span class="si">'+(E22.isDark()?E22.ICO.sun:E22.ICO.moon)+'</span><span>'+(E22.isDark()?'حالت روشن':'حالت تاریک')+'</span></button>'+
    '<button class="e27-srow" data-act="wallet"><span class="si">'+E27_IC.wallet+'</span><span>کیف پول</span><small style="margin-inline-start:auto">'+rial(S.wallet)+'</small></button>'+
    '<button class="e27-srow" data-act="account" data-tab="overview"><span class="si">'+E27_IC.user+'</span><span>'+esc(S.auth.name||'حساب کاربری')+'</span><small style="margin-inline-start:auto">'+fa(S.tokens,0)+' کلید</small></button>'+
    '<button class="e27-srow" data-view="profile"><span class="si">'+E27_IC.gear+'</span><span>تنظیمات و حساب</span></button>'+
    '</div>';
  el.innerHTML=h;
  var sq=el.querySelector('#e27-sq');
  if(sq){sq.addEventListener('input',function(){E27.sq=sq.value;E27.applySq()})}
}
E27.applySq=function(){
  var box=document.getElementById('e27-slist');
  if(!box)return;
  box.innerHTML=E27.sessListHTML();
  a11yify(box);
};
var VIEWS={};
function go(v){
  if(v==='sub'){S.ui.atab='plan';v='profile'}
  if(v==='cjm'){v='landing'}
  if(v==='home'||v==='dash'){v='landing'} /* V0.27: صفحات مستقل حذف شدند — همه‌چیز در گفت‌وگو */
  if(!S.auth&&v!=='auth'&&v!=='landing'){S.pending=v;save();toast('ابتدا وارد شوید');v='auth'}
  closeModal();CURRENT=v;
  document.body.classList.toggle('widemain',v==='dash'||v==='landing');
  setMenuOpen(false);
  $$('.view').forEach(function(x){x.classList.remove('on')});
  var t=document.getElementById('v-'+v);
  if(t){t.classList.add('on')}
  renderCurrent();
  window.scrollTo(0,0);
}
function renderCurrent(){
  renderSidebar();renderTok();
  var f=VIEWS[CURRENT];
  if(f){f()}
  var v=document.getElementById('v-'+CURRENT);
  if(v){a11yify(v)}
  renderChatMeta();
  cr();
}

