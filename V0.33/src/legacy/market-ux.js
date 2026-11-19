/* ═══ ۲۱.۸) بلوغ محصول (E26) — تلهٔ فوکوس، ترمیم داده، سقف یادآور ═══
   فوکوس‌تلهٔ مودال (M1): */
var E26={t:0};
E26.toastErr=function(m){var n=Date.now();if(n-E26.t<15000)return;E26.t=n;try{toast(m)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:4',e,'caught');}};
E26.trapKey=function(e){
  if(e.key!=='Tab')return;
  var m=document.querySelector('#modal-root.on');
  if(!m)return;
  var f=m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
  if(!f.length)return;
  var first=f[0],last=f[f.length-1],cur=document.activeElement;
  if(e.shiftKey&&(cur===first||(cur&&!m.contains(cur)))){e.preventDefault();try{last.focus()}catch(x){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:12',x,'caught');}}
  else if(!e.shiftKey&&(cur===last||!cur||!m.contains(cur))){e.preventDefault();try{first.focus()}catch(x){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:13',x,'caught');}}
};
try{document.addEventListener('keydown',E26.trapKey)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:15',e,'caught');}
/* ترمیم شکل داده (M2): */
try{
  ['chats','reminders','wfs','reqs','contracts','grt'].forEach(function(k){
    if(S[k]!==undefined&&!Array.isArray(S[k])){console.warn('state repair: '+k+' → []');S[k]=[]}
  });
  if(!S.chats)S.chats=[];
  if(!S.reminders)S.reminders=[];
  S.v=26;
}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:24',e,'caught');}
/* سقف یادآور ۵۰ (M2): */
E25&&(E25.remCap=function(){
  try{
    while(S.reminders.length>50){
      var iDone=-1;
      for(var i=0;i<S.reminders.length;i++){if(S.reminders[i].done){iDone=i;break}}
      S.reminders.splice(iDone>=0?iDone:0,1);
      E26.toastErr('سقف ۵۰ یادآور پر بود؛ قدیمی‌ترین حذف شد.');
    }
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:34',e,'caught');}
});
try{E25&&E25.remCap&&E25.remCap()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:36',e,'caught');}
/* ═══ ۲۱.۱۲) موتور V0.27 (E27) — بازار هوشمند، بودجهٔ آزاد، کیف پول، جزئیات کارت ═══ */

/* ── بودجهٔ آزاد: تحلیل زبان طبیعی + مقادیر مؤثر ── */
E27.budgParse=function(v){
  var t=normFa(String(v||'')).trim();
  if(!t)return {ok:false,msg:'مبلغ را وارد کنید.'};
  if(/بدون بودجه|بدون سقف|نامحدود|بدون محدودیت|فرقی نمی|مهم نیست|هرچی|هر چی/.test(t))return {ok:true,mode:'open'};
  var isMin=/به بالا|و بالاتر|یا بیشتر/.test(t)&&!/کمتر/.test(t);
  var isMax=/حداکثر|تا سقف|سقف|کمتر از/.test(t)&&!/به بالا/.test(t);
  var t2=t.replace(/به بالا|و بالاتر|یا بیشتر|حداکثر|تا سقف|کمتر از|سقف/g,' ');
  var pm=parseMoneyFA(t2);
  if(!pm.ok)return {ok:false,msg:'بودجه را مثل «۳۰ میلیارد»، «۵ میلیارد به بالا» یا «بدون بودجهٔ مشخص» بنویسید.'};
  if(isMin)return {ok:true,mode:'min',n:pm.value,note:pm.note};
  if(isMax)return {ok:true,mode:'max',n:pm.value,note:pm.note};
  return {ok:true,mode:'exact',n:pm.value,note:pm.note};
};
E27.budgEff=function(D){
  if(!D)return 0;
  if(D.budgOpen)return Infinity;
  return +D.budg||0;
};
E27.rentBEff=function(D){
  if(!D||!D.B)return 0;
  if(D.rentBOpen)return Infinity;
  return +D.B.rentB||0;
};

/* ── کامپوننت هوش بازار (Market Intelligence) ── */
E27.marketHTML=function(o){
  o=o||{};
  var h=findH(o.h||'h1'),mode=o.mode||'buy',period=+o.period||12;
  var m=h.mkt,isBuy=mode==='buy';
  var base=isBuy?h.buyBase:h.avgRent;
  var series=trendSeries(base,m.yoy,h.id+mode).slice(-period);
  var labels=monthLabels().slice(-period);
  var yoy=m.yoy,mom=m.mom;
  function chip(k,v,lab,cur){return '<button class="mkti-chip'+(cur?' on':'')+'" data-cba="mktCtl" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+(cur?'true':'false')+'">'+lab+'</button>'}
  function kpi(lab,val,delta){
    var d='';
    if(delta!==undefined&&delta!==null)d='<span class="delta '+(delta>=0?'up':'down')+'">'+pct(delta)+' تغییر</span>';
    return '<div class="mkti-kpi"><small>'+lab+'</small><b>'+val+'</b>'+d+'</div>';
  }
  var kpis;
  if(isBuy){
    kpis=kpi('میانگین آگهی هر متر',rial(h.buyBase),null)+kpi('تغییر یک‌ساله','',yoy)+kpi('تغییر ماهانه','',mom)+
      '<div class="mkti-kpi"><small>بازهٔ آگهی‌ها</small><b>'+rShort(m.low)+' – '+rShort(m.high)+'</b><span class="delta" style="color:var(--ink2)">تومان بر متر</span></div>';
  }else{
    kpis=kpi('اجارهٔ نمونهٔ ماهانه',rial(h.avgRent),null)+kpi('ودیعهٔ نمونه',rial(h.avgDep),null)+kpi('تغییر یک‌ساله بازار','',yoy)+kpi('تغییر ماهانه بازار','',mom);
  }
  var rangeBox='';
  if(isBuy){
    var lo=m.low,hi=m.high,span=(hi-lo)||1,pos=Math.max(0,Math.min(100,Math.round((h.buyBase-lo)/span*100)));
    rangeBox='<div class="mkti-box mkti-range"><h5>جایگاه میانگین آگهی در بازهٔ محله</h5>'+
    '<div class="mkti-rangebar"><i class="pin" style="right:'+pos+'%"></i></div>'+
    '<div class="mkti-rl"><span title="'+rial(lo)+'">'+rShort(lo)+'</span><span title="'+rial(hi)+'">'+rShort(hi)+' (تومان/متر)</span></div></div>';
  }else{
    var mx=Math.max(h.avgRent,h.avgDep)||1;
    rangeBox='<div class="mkti-box"><h5>اجاره در برابر ودیعه (نسبت نمایشی)</h5>'+
    '<div class="mkti-cmp">'+
    '<div class="mkti-cmp-row"><span>ودیعه</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(h.avgDep/mx*100))+'%"></span><b>'+rShort(h.avgDep)+'</b></div>'+
    '<div class="mkti-cmp-row"><span>اجارهٔ ماهانه</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(h.avgRent/mx*100))+'%"></span><b>'+rShort(h.avgRent)+'</b></div>'+
    '</div></div>';
  }
  var bars=HOODS.map(function(x){
    var v=isBuy?x.buyBase:x.avgRent;
    return {l:x.n,v:v,fmt:rShort(v),cur:x.id===h.id};
  }).sort(function(a,b){return b.v-a.v});
  var cmp='<div class="mkti-box"><h5>'+(isBuy?'هر متر (آگهی) در محله‌ها':'اجارهٔ نمونه در محله‌ها')+' — تومان</h5><div class="mkti-cmp">'+
  bars.map(function(b){
    return '<div class="mkti-cmp-row'+(b.cur?' cur':'')+'"><span>'+esc(b.l)+'</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(b.v/bars[0].v*100))+'%"></span><b title="'+rial(b.v)+'">'+b.fmt+'</b></div>';
  }).join('')+'</div></div>';
  var aff='';
  if(isBuy&&o.budgOpen)aff='<div class="mkti-kpi" style="grid-column:1/-1"><small>بودجهٔ شما</small><b>بدون محدودیت — همهٔ بازه‌ها گزینه‌اند</b></div>';
  else if(isBuy&&o.budg){
    var as=affordSpan(+o.budg||0);
    aff='<div class="mkti-kpi" style="grid-column:1/-1"><small>با بودجهٔ شما</small><b>حدود '+fa(as[1],0)+' تا '+fa(as[0],0)+' متر</b></div>';
  }
  var chart='';
  if(isBuy){
    chart='<div>'+rcLine('روند برآوردی هر متر — '+fa(period,0)+' ماه','تومان · برآورد از تغییر یک‌سالهٔ اعلامی (دادهٔ نمونه)',series,labels,null)+'</div>';
  }else{
    chart='<div>'+rcLine('روند برآوردی اجاره — '+fa(period,0)+' ماه','تومان · برآورد از تغییر یک‌سالهٔ اعلامی (دادهٔ نمونه)',series,labels,null)+'</div>';
  }
  return '<div class="mkti" data-h="'+h.id+'" data-mode="'+mode+'" data-period="'+period+'">'+
  '<div class="mkti-h"><b>'+ico('map',14)+' بازار '+esc(h.n)+' <small style="color:var(--ink2);font-weight:400">· '+esc(MARKET.asOf)+'</small></b>'+
  '<div class="mkti-chips">'+
  chip('mode','buy','خرید',isBuy)+chip('mode','rent','اجاره',!isBuy)+
  '<span style="width:1px;background:var(--line);margin:0 3px"></span>'+
  chip('period','3','۳ ماه',period===3)+chip('period','6','۶ ماه',period===6)+chip('period','12','۱۲ ماه',period===12)+
  '</div></div>'+
  '<div class="mkti-chips" style="margin-bottom:4px">'+HOODS.map(function(x){return chip('h',x.id,x.n,x.id===h.id)}).join('')+'</div>'+
  '<div class="mkti-kpis">'+kpis+aff+'</div>'+
  '<div class="mkti-grid">'+chart+'<div>'+rangeBox+'</div></div>'+
  '<div style="margin-top:12px">'+cmp+'</div>'+
  '<button class="mkti-more-btn" data-cba="mktMore">توضیح بیشتر و اعداد دقیق ▾</button>'+
  '<div class="mkti-more">'+
  '<b>اعداد دقیق (تومان):</b><br>'+
  'میانگین هر متر (آگهی): '+rial(h.buyBase)+' · بازه: '+rial(m.low)+' تا '+rial(m.high)+'<br>'+
  'اجارهٔ نمونه: '+rial(h.avgRent)+' · ودیعهٔ نمونه: '+rial(h.avgDep)+'<br>'+
  '<b>روش و منبع:</b> قیمت‌ها «آگهی»اند، نه معاملهٔ قطعی. منبع اعلامی: '+esc(m.src||'کیلید')+' · تاریخ داده: '+esc(MARKET.asOf)+' · محدوده: محلهٔ '+esc(h.n)+'.<br>'+
  'دادهٔ نمونهٔ سامانه — قیمت آگهی است، نه معاملهٔ قطعی.'+
  '</div>'+
  '</div>';
};
CBACT.mktCtl=function(el){
  var box=el.closest('.mkti');if(!box)return;
  var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');
  if(k)box.setAttribute('data-'+k,v);
  box.outerHTML=E27.marketHTML({h:box.getAttribute('data-h'),mode:box.getAttribute('data-mode'),period:+box.getAttribute('data-period')||12});
};
CBACT.mktMore=function(el){
  var box=el.closest('.mkti');if(box)box.classList.toggle('openm');
};
CBACT.pcardMore=function(el){
  var c=el.closest('.pcard');if(c)c.classList.toggle('open');
};

/* ── تخلیهٔ هوشمند: لغزنده، بزرگ‌نمایی، تصویر کاربر ── */
E27.userImg={before:null,after:null};
E27.baImg=function(slot){
  return esc(E27.userImg[slot]||(slot==='before'?'assets/img/emptying-before.jpg':'assets/img/emptying-after.jpg'));
};
CBACT.baZoom=function(el){
  var src=el.getAttribute('data-src');if(!src)return;
  var ov=document.createElement('div');ov.className='ba27-zoom';
  var im=document.createElement('img');im.src=src;im.alt='نمای بزرگ‌شدهٔ تصویر ملک';
  ov.appendChild(im);document.body.appendChild(ov);
  ov.addEventListener('click',function(){ov.remove()});
};
try{
  /* V0.28: rAF-batch + pointer drag — baPaint در بلوک E28 تعریف می‌شود */
  document.addEventListener('input',function(e){
    var t=e.target;
    if(!(t&&t.classList&&t.classList.contains('ba27-range')))return;
    var root=t.closest('.ba27');if(!root)return;
    var w=root.querySelector('.ba27-wrap');if(!w)return;
    if(!w._raf){
      w._raf=requestAnimationFrame(function(){w._raf=null;E28.baPaint(w,+t.value)});
    }
  });
  document.addEventListener('pointerdown',function(e){
    var w=e.target&&e.target.closest?e.target.closest('.ba27-wrap'):null;
    if(!w||e.button!==0||e.isPrimary===false)return;
    e.preventDefault();
    function toPct(ev){
      var r=w.getBoundingClientRect();
      /* Physical x-coordinate: rightward movement reveals more of the empty room. */
      return r.width?Math.max(0,Math.min(100,Math.round((ev.clientX-r.left)/r.width*100))):50;
    }
    w.setPointerCapture&&w.setPointerCapture(e.pointerId);
    E28.baPaint(w,toPct(e));
    function mv(ev){if(ev.pointerId!==e.pointerId)return;E28.baPaint(w,toPct(ev))}
    function up(ev){if(ev.pointerId!==e.pointerId)return;w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up);w.removeEventListener('lostpointercapture',up)}
    w.addEventListener('pointermove',mv);
    w.addEventListener('pointerup',up);
    w.addEventListener('pointercancel',up);
    w.addEventListener('lostpointercapture',up);
    w.focus({preventScroll:true});
  });
  document.addEventListener('keydown',function(e){
    var w=e.target&&e.target.closest?e.target.closest('.ba27-wrap'):null;
    if(w&&e.target===w){
      var v=+(w.getAttribute('aria-valuenow')||50);
      if(e.key==='ArrowLeft'||e.key==='ArrowDown')v=Math.max(0,v-4);
      else if(e.key==='ArrowRight'||e.key==='ArrowUp')v=Math.min(100,v+4);
      else if(e.key==='Home')v=0;
      else if(e.key==='End')v=100;
      else return;
      e.preventDefault();
      E28.baPaint(w,v);
      return;
    }
  });
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.getAttribute&&t.getAttribute('data-ba27')){
      var f=t.files&&t.files[0];if(!f)return;
      if(String(f.type||'').indexOf('image/')!==0){toast('فقط فایل تصویری بگذارید.');return}
      var slot=t.getAttribute('data-ba27');
      var url=URL.createObjectURL(f);
      E27.userImg[slot]=url;
      if(slot==='before'){var img=document.getElementById('ba27-img-before');if(img)img.src=url}
      if(CE.f==='rent'){var T=wd('rent').data.term;if(T){T.ba=T.ba||{};T.ba[slot]='user';save()}}
      toast(slot==='before'?'تصویر «روز ورود» شما جایگزین شد':'تصویر «روز تخلیه» شما جایگزین شد');
      if(CE.f==='rent'&&SCRIPTS.rent[CE.i]&&SCRIPTS.rent[CE.i].id==='tai')ceStep();
    }
  });
}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:223',e,'caught');}

/* ── کیف پول: شارژ در گفت‌وگو با درگاه نمایشی + استقلال از کلید ── */
E27.wf=null;
E27.doneTx={};
E27._lastAmt=0;
E27.wtxRow=function(w){
  var inn=w.a>0;
  return '<div class="wtx '+(inn?'in':'out')+'"><span class="wic">'+(inn?'↓':'↑')+'</span>'+
  '<span class="wtx-main"><b>'+esc(w.d||'—')+'</b><small>'+fd(w.t)+(w.tx?' · کد: '+esc(w.tx):'')+'</small></span>'+
  '<span class="wtx-amt '+(inn?'in':'out')+'">'+(inn?'+':'−')+rial(Math.abs(w.a))+'</span></div>';
};
CBACT.wMenu=function(){
  E27.wf=null;
  botC('<b>کیف پول و کلیدها</b> — دو موجودی مستقل:'+
  rcards([
    rcard('کیف پول تومانی','<span style="font-size:15px;font-weight:800">'+rial(S.wallet||0)+'</span>','برای خدمات سامانه'),
    rcard('بناهای مصرفی',fa(S.tokens,0)+' کلید','برای قابلیت‌های کلیدی')
  ])+
  '<div class="racts">'+
  '<button class="qbtn primary" data-cba="wTopup">شارژ کیف پول</button>'+
  '<button class="qbtn" data-cba="wTx">تاریخچهٔ تراکنش‌ها</button>'+
  '<button class="qbtn" data-cba="wTok">خرید کلید</button>'+
  '</div>',null);
};
CBACT.wTopup=function(){
  E27.wf={mode:'amount'};
  botC('<b>شارژ کیف پول تومانی</b> — مبلغ را بنویسید (مثلاً «۲ میلیون تومان» یا «۵۰۰ هزار تومان»):'+
  '<div class="racts"><button class="qbtn" data-cba="wCancel">انصراف</button></div>',null);
};
CBACT.wCancel=function(){E27.wf=null;botC('شارژ لغو شد. موجودی تغییری نکرد.',null)};
E27.wfHandle=function(t){
  if(!E27.wf)return false;
  if(E27.wf.mode==='amount'){
    var p=E27.budgParse(t);
    if(!p.ok){usrC(t);botC(p.msg+' (برای انصراف، دکمهٔ انصراف را بزنید)',null);return true}
    if(p.mode!=='exact'||!p.n||p.n<=0){usrC(t);botC('برای شارژ یک مبلغ مشخص بنویسید (مثلاً «۲ میلیون تومان»).',null);return true}
    usrC(t);
    var txid='TX-'+Date.now().toString(36).toUpperCase();
    E27.wf={mode:'confirm',amt:p.n,method:'sim-ok',txid:txid};
    E27._lastAmt=p.n;
    E27.wConfirm();
    return true;
  }
  return false;
};
E27.wConfirm=function(){
  var f=E27.wf;if(!f)return;
  botC('<b>خلاصهٔ تراکنش (ConfirmationPanel)</b>'+
  '<div class="pay27-sim">'+
  '<div class="pay27-row"><span>نوع</span><b>شارژ کیف پول تومانی</b></div>'+
  '<div class="pay27-row"><span>مبلغ</span><b>'+rial(f.amt)+'</b></div>'+
  '<div class="pay27-row"><span>درگاه</span><b>'+(f.method==='sim-ok'?'درگاه نمایشی — سناریوی موفق':'درگاه نمایشی — سناریوی ناموفق (تست)')+'</b></div>'+
  '<div class="pay27-row"><span>کد پیگیری</span><b dir="ltr">'+esc(f.txid)+'</b></div>'+
  '<div class="pay27-row"><span>موجودی فعلی</span><b>'+rial(S.wallet||0)+'</b></div>'+
  '<div class="pay27-row"><span>موجودی پس از پرداخت</span><b>'+(f.method==='sim-ok'?rial((S.wallet||0)+f.amt):rial(S.wallet||0))+'</b></div>'+
  '</div>'+
  '<div class="racts">'+
  '<button class="qbtn primary" data-cba="wPay">تأیید و پرداخت</button>'+
  '<button class="qbtn" data-cba="wMethod">تغییر سناریوی درگاه (موفق/ناموفق)</button>'+
  '<button class="qbtn" data-cba="wCancel">انصراف</button>'+
  '</div>',null);
};
CBACT.wMethod=function(){
  var f=E27.wf;if(!f||f.mode!=='confirm'){toast('ابتدا مبلغ شارژ را مشخص کنید');return}
  f.method=(f.method==='sim-ok')?'sim-fail':'sim-ok';
  E27.wConfirm();
};
CBACT.wPay=function(){
  var f=E27.wf;
  if(!f||f.mode!=='confirm'){toast('ابتدا مبلغ شارژ را مشخص کنید');return}
  if(E27.doneTx[f.txid]){toast('این تراکنش قبلاً ثبت شده است — موجودی دوباره افزایش نمی‌یابد');return}
  E27.doneTx[f.txid]=true;
  E27.wf={mode:'busy',amt:f.amt,method:f.method,txid:f.txid};
  botC('در حال اتصال به درگاه نمایشی… <span class="dots"><i></i><i></i><i></i></span>',null);
  var myTx=f.txid,myAmt=f.amt,myMethod=f.method;
  setTimeout(function(){
    var cur=E27.wf;
    if(!cur||cur.txid!==myTx)return;
    if(myMethod==='sim-fail'){
      E27.wf=null;
      botC('✗ پرداخت ناموفق بود (سناریوی تست). موجودی تغییر نکرد.'+
      '<div class="racts"><button class="qbtn primary" data-cba="wRetry">تلاش دوباره</button><button class="qbtn" data-cba="wCancel">انصراف</button></div>',null);
      return;
    }
    S.wallet=(S.wallet||0)+myAmt;
    S.wlog.unshift({t:Date.now(),d:'شارژ کیف پول — درگاه نمایشی',a:myAmt,tx:myTx});
    save();renderTok();
    E27.wf=null;
    botC('✓ پرداخت موفق (درگاه نمایشی). کیف پول تومانی: <b>'+rial(S.wallet)+'</b><br><small>کد پیگیری: '+esc(myTx)+' — موجودی پس از نوسازی صفحه هم حفظ می‌شود.</small>'+
    '<div class="racts"><button class="qbtn" data-cba="wTx">تاریخچهٔ تراکنش‌ها</button><button class="qbtn" data-cba="wMenu">کیف پول و کلیدها</button></div>',null);
  },1200);
};
CBACT.wRetry=function(){
  if(!E27._lastAmt){E27.wf={mode:'amount'};botC('مبلغ شارژ را بنویسید:',null);return}
  E27.wf={mode:'confirm',amt:E27._lastAmt,method:'sim-ok',txid:'TX-'+Date.now().toString(36).toUpperCase()};
  E27.wConfirm();
};
CBACT.wTx=function(){
  var wl=S.wlog||[];
  botC('<b>تاریخچهٔ کیف پول تومانی</b>'+(wl.length?'':'<div class="empty" style="margin-top:8px">تراکنشی ثبت نشده است.</div>')+
  wl.slice(0,10).map(E27.wtxRow).join('')+
  '<div class="racts"><button class="qbtn" data-cba="wMenu">کیف پول و کلیدها</button></div>',null);
};
CBACT.wTok=function(){
  botC('<b>خرید کلید</b> — بسته‌ها کاملاً جدا از کیف پول تومانی‌اند:'+
  '<div class="racts">'+PACKS.map(function(p,i){
    return '<button class="qbtn'+(p.best?' primary':'')+'" data-cba="wBuyPack" data-i="'+i+'">'+p.n+' — '+fa(p.tok,0)+' کلید ('+rial(p.pr)+')</button>';
  }).join('')+'</div>'+
  '<div class="racts"><button class="qbtn" data-cba="wMenu">بازگشت</button></div>',null);
};
CBACT.wBuyPack=function(el){
  var p=PACKS[+el.getAttribute('data-i')];
  if(!p){toast('بسته پیدا نشد');return}
  E27.wf=null;
  openPayModal({mode:'sub',unit:'کلید',kind:'pack',packName:p.n,packTok:p.tok,packPrice:p.pr,rate:p.pr/p.tok,def:p.pr,sugg:[{l:'کامل',v:p.pr},{l:'دو برابر',v:p.pr*2}],title:'بستهٔ '+p.n});
};
ACT.wchat=function(){
  if(CURRENT!=='landing'){go('landing')}
  CBACT.wMenu();
};
/* رهگیری متن آزادِ جریان شارژ — بالاترین لایهٔ ceSend */
var _oCeSend27=ceSend;
ceSend=function(t){
  if(String(t)==='!back'){_oCeSend27(t);return}
  try{
    if(E27.wf&&E27.wfHandle(t))return;
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/market-ux.js:350',e,'caught');}
  _oCeSend27(t);
};

