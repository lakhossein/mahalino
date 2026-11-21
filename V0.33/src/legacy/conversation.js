/* ═══ ۸) چت ═══ */
var HIST=Array.isArray(S.liveHistory)?S.liveHistory.slice():[];
var CE={f:null,i:0,li:0,hist:[]};
function cePush(){try{CE.hist.push({i:CE.i,li:CE.li})}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:4',e,'caught');}if(CE.hist.length>40){CE.hist=CE.hist.slice(-40)}}
function ceBack(){if(!(CE.f&&CE.hist.length))return;var h=CE.hist.pop();CE.i=h.i;CE.li=h.li;HIST.push({r:'user',h:'&#8617; \u0628\u0627\u0632\u06af\u0634\u062a'});cr();ceStep()}
function cr(){
  var last=-1,i;
  for(i=HIST.length-1;i>=0;i--){if(HIST[i].r==='bot'&&HIST[i].c){last=i;break}}
  [{el:document.getElementById('chatB')},{el:document.getElementById('fchB')},{el:document.getElementById('dashB')}].forEach(function(b){
    if(!b.el||!b.el.offsetParent){return} /* V0.24/R1: بدنهٔ پنهان رندر نمی‌شود؛ هنگام نمایان‌شدن، go()/toggleF دوباره cr() می‌خوانند */
    var visible=window.E30_HIST_VISIBLE||120,from=Math.max(0,HIST.length-visible);
    b.el.innerHTML=(from?'<button class="qbtn" data-act="e30HistMore" style="margin:8px auto;display:block">نمایش '+fa(Math.min(120,from),0)+' پیام قدیمی‌تر</button>':'')+HIST.slice(from).map(function(m,ix){ix+=from;
      var h='<div class="msg '+m.r+'"><span class="who">'+(m.r==='bot'?'دستیار':'شما')+'</span><div class="bub">'+m.h;
      if(m.r==='bot'&&m.c&&ix===last){
        var chips=m.c.slice();
        if(CE.f&&CE.hist&&CE.hist.length){chips=chips.concat([['\u21a9 بازگشت','!back']])}
        if(chips.length){h+='<div class="qr">'+chips.map(function(c){return '<button data-cv="'+qesc(c[1])+'">'+c[0]+'</button>'}).join('')+'</div>'}
      }
      return h+'</div>'+E28.msgActs(m,ix)+'</div>';
    }).join('');
    var lastMsg=null,bots=b.el.querySelectorAll('.msg.bot');if(bots.length)lastMsg=bots[bots.length-1];
    if(lastMsg&&(lastMsg.querySelector('.finbars')||lastMsg.querySelector('.distlist'))){
      var top=lastMsg.getBoundingClientRect().top-b.el.getBoundingClientRect().top+b.el.scrollTop-6;
      b.el.scrollTop=Math.max(0,top);
    }else{b.el.scrollTop=b.el.scrollHeight;}
    a11yify(b.el);
  });
  renderChatMeta();
}
function flowStateLabel(m){
  m=wfModOfCat(m);
  var f=wf(m),st=wfState(f),n=wfShown(m).length;
  return {t:st.t+(n>1?' • '+fa(n,0)+' فلو':''),cls:st.c};
}
/* V0.28 — پیشنهادهای زمینه‌ای: بر پایهٔ وضعیت گفت‌وگو؛ بدون دکمهٔ ثابت */
function ctxSuggestions(){
  var out=[];
  function at(l,a,p){out.push({l:l,a:a,p:!!p})}
  if(!S.auth){at('ورود / ثبت‌نام','data-view="auth"',true);return out}
  if(CE.f){return out} /* در جریان فلو، چیپ‌های همان گام اقدام بعدی‌اند — ردیف پیشنهادی خالی می‌ماند */
  if(CURRENT!=='landing'){at('بازگشت به گفت‌وگو','data-view="landing"',true);return out}
  return E28.welcomeSuggestions();
}
function flowSummaryText(m){
  if(!m)return '';
  var bits=[];
  function add(k,v){if(v!==undefined&&v!==null&&v!=='')bits.push(k+': '+v)}
  if(m==='gate'){
    if(S.prof&&(S.prof.work||S.prof.workLL))add('محل کار','ثبت‌شده');
    if(S.prof&&(S.prof.school||S.prof.schoolLL))add('مدرسه','ثبت‌شده');
    return bits.join(' • ');
  }
  var wF=wf(m);
  if(!wF)return '';
  var D=wF.data||{};
  if(m==='rent'){
    if(D.B&&D.B.depB)add('ودیعه',rial(D.B.depB));
    if(D.B&&D.B.rentB)add('اجاره',rial(D.B.rentB));
    if(D.hood)add('محله',findH(D.hood).n);
    if(D.listing)add('ملک',findL(D.listing).t);
    if(D.visitDay)add('بازدید',D.vday+' '+D.vtime);
    if(D.code&&D.signed)add('کد',D.code);
  }else if(m==='buy'){
    if(D.budg)add('بودجه',rial(D.budg));
    if(D.hood)add('محله',findH(D.hood).n);
    if(D.blist)add('ملک',findB(D.blist).t);
    if(D.legal)add('حقوقی','دریافت‌شده');
    if(D.escrow)add('امانی','تکمیل‌شده');
  }else if(m==='stay'){
    if(D.city)add('شهر',D.city);
    if(D.ppl)add('مسافر',fa(D.ppl,0));
    if(D.stay)add('اقامتگاه',findS(D.stay).t);
    if(D.nights)add('شب',fa(D.nights,0));
    if(D.code)add('کد',D.code);
  }else if(m==='mkt'){
    if(D.role)add('نقش',D.role==='con'?'پیمانکار':'کارفرما');
    if(D.bid)add('پیشنهاد',rial(D.bid.amt));
    if(D.confirmed)add('وضعیت','تأیید کارفرما');
  }else if(m==='build'){
    if(D.orders)add('سفارش',fa(D.orders.length,0));
    if(D.ph){var w=[12,34,22,18,14],tot=0,i;for(i=0;i<5;i++)tot+=w[i]*D.ph[i];add('پیشرفت',fa(tot/100,0)+'٪')}
  }else if(m==='invr'){
    if(D.cap)add('سرمایه',rial(D.cap));
    if(D.cnt)add('کلید',fa(D.cnt,0));
    if(D.fund)add('خرید','انجام‌شده');
  }
  return bits.slice(0,5).join(' • ');
}
function renderChatMeta(){
  var sc=CE.f?SCRIPTS[CE.f]:null;
  [['fchStep','fchStepTxt','fchStepBar'],['landingStep','landingStepTxt','landingStepBar'],['dashStep','dashStepTxt','dashStepBar']].forEach(function(ids){
    var step=document.getElementById(ids[0]),txt=document.getElementById(ids[1]),bar=document.getElementById(ids[2]);
    if(!step)return;
    if(CE.f&&sc&&CE.f!=='gate'){
      step.hidden=false;
      var n=sc.length,cur=Math.min(CE.i+1,n);
      if(txt){var cw=MODBY[CE.f]?wf(CE.f):null;txt.innerHTML='فلو: <b>'+(cw?esc(wfName(cw)):(MODBY[CE.f]?MODBY[CE.f].t:'دستیار'))+'</b> — گام '+fa(cur,0)}
      if(bar){bar.style.width=Math.round(cur/n*100)+'%'}
    }else{step.hidden=true}
  });
  var sum=flowSummaryText(CE.f);
  [['fchSum','fchSumTxt'],['landingSum','landingSumTxt'],['dashSum','dashSumTxt']].forEach(function(ids){
    var box=document.getElementById(ids[0]),txt=document.getElementById(ids[1]);
    if(!box)return;
    if(sum){box.hidden=false;if(txt)txt.textContent=sum;var b=box.querySelector('[data-act="chatBack"]');if(b)b.disabled=!(CE.hist&&CE.hist.length)}
    else{box.hidden=true}
  });
  var items=ctxSuggestions();
  [document.getElementById('fchSugg'),document.getElementById('chatSugg'),document.getElementById('dashSugg')].forEach(function(host){
    if(!host)return;
    host.hidden=!items.length;
    host.innerHTML=items.map(function(it){return '<button class="qbtn'+(it.p?' primary':'')+'" '+it.a+'>'+it.l+'</button>'}).join('');
    a11yify(host);
  });
  var fab=document.getElementById('fcbfab');
  if(fab){fab.setAttribute('aria-expanded',FCHAT&&FCHAT.open?'true':'false')}
}
function botC(html,chips){HIST.push({r:'bot',h:html,c:chips||null});S.liveHistory=HIST.slice();save();cr()}
function usrC(t){HIST.push({r:'user',h:esc(t)});S.liveHistory=HIST.slice();save();cr()}
function ceStart(f,silent){
  CE.f=f;CE.i=0;CE.li=0;CE.hist=[];
  if(MODBY[f]&&!SCRIPTS[f]){
    CE.f=null;save();go(MODBY[f].v);
    toast('«'+MODBY[f].t+'» در صفحهٔ اختصاصی خودش قدم‌به‌قدم پیش می‌رود — همان‌جا باز شد.');
    return;
  }
  if(MODBY[f]){var w=wf(f);if(!w||w.done){wfNew(f)}}
  if(!silent)ceStep();
}
function ceStartGate(){
  CE.f='gate';CE.li=0;CE.hist=[];
  CE.i=(S.prof&&(S.prof.work||S.prof.workLL))?3:0;
  ceStep();
}
function ceJump(id){
  if(!CE.f){return}
  var sc=SCRIPTS[CE.f],j;
  if(!sc){return}
  for(j=0;j<sc.length;j++){if(sc[j].id===id){cePush();CE.i=j;CE.li=0;ceStep();return}}
}
function ceStep(){
  if(!CE.f){return}
  var sc=SCRIPTS[CE.f];
  if(!sc){CE.f=null;renderChatMeta();return}
  if(CE.i>=sc.length){ceEnd();return}
  var st=sc[CE.i],D=wd(CE.f).data;
  if(CE.f==='buy'){defP(D);defPR(D)}
  if(st.pre&&st.pre(D)===false){cePush();CE.i++;ceStep();return}
  if(st.loop){botC(st.loop[CE.li].t,CHIP5());return}
  var q=st.q;
  if(typeof st.q==='function'){q=st.q(D)}
  if(st.cards){q+='<div class="chcards">'+st.cards(D)+'</div>'}
  botC(q,st.chips?st.chips(D):null);
}
function CHIP5(){return [['۱','1'],['۲','2'],['۳','3'],['۴','4'],['۵','5']]}
function ceEnd(){
  var f=CE.f;CE.f=null;
  var backBtn=null;
  try{if(f&&MODBY[f]){backBtn=['ادامه در فلو (قدم‌به‌قدم)','F:step:'+f]}}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:159',e,'caught');}
  var chips=[['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']];
  if(backBtn){chips.unshift(backBtn)}
  botC('<b>فلوی '+((f&&MODBY[f])?MODBY[f].t:'گفت‌وگو')+' تکمیل شد و در داشبورد ثبت گردید.</b>',chips);
}
function ceNumSet(k,v){try{var m=CE.f;var pm=document.querySelector('[data-pm]');var mod=(pm&&pm.getAttribute('data-pm'))||m||'rent';var D=wd(mod==='rent'?'rent':'buy').data;if(mod==='rent'){defP(D)}else{if(!D.PR)D.PR={age:[0,30],m2:[45,120],ppm:[1800000000,5500000000],beds:2,floorR:[1,10]}}var n=+pd(String(v||'').replace(/[^0-9]/g,''));if(k==='bedsNum'){if(v===''||v==null){D.P.bedsNum='';save();renderCurrent();return}if(n>=1&&n<=5){D.P.bedsNum=n;D.P.beds=0;save();renderCurrent()}else{toast('تعداد خواب باید ۱ تا ۵ باشد')}return}if(k==='floorNum'){if(v===''||v==null){D.P.floorNum='';save();renderCurrent();return}if(n>=0&&n<=30){D.P.floorNum=n;D.P.floor='any';save();renderCurrent()}else{toast('شماره طبقه باید ۰ تا ۳۰ باشد')}return}}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:164',e,'caught');}}
function ceImpSet(k,v){try{var m=CE.f;if(!m)return;var D=wd(m).data;if(!D.P)D.P={metro:3,school:3,work:3,saf:3,amn:3,quiet:3,extra:[],PXH:{}};D.P[k]=v;save();renderCurrent()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:165',e,'caught');}}
function ceSmart(t){t=String(t||'');var has=function(){var a=arguments,i;for(i=0;i<a.length;i++){if(t.indexOf(a[i])>=0)return true}return false};if(has('تضمینی')){go('grt');CE.f=null;botC('اجارهٔ تضمینی در صفحهٔ اختصاصی خودش قدم‌به‌قدم پیش می‌رود؛ بازش کردم.',null);return true}if(has('اجاره','رهن')||((!CE.f||CE.f==='rent')&&has('بازدید'))){botC('فلوی اجاره را شروع می‌کنم.',null);ceStart('rent');return true}if(has('خرید','مبایعه')){botC('فلوی خرید را شروع می‌کنم.',null);ceStart('buy');return true}if(has('قرارداد','کد رهگیری')){S.ui.atab='contracts';save();go('profile');CE.f=null;botC('قراردادها در تنظیمات حساب باز شد.',null);return true}if(has('رزرو','اقامت','سفر')){botC('فلوی اقامت را شروع می‌کنم.',null);ceStart('stay');return true}if(has('پروژه')){go('mkt');CE.f=null;botC('بخش پروژه‌ها را باز کردم.',null);return true}if(has('ساخت','مصالح')){go('build');CE.f=null;botC('بخش ساخت را باز کردم.',null);return true}if(has('خدمات','تعمیر','نظافت')){go('svc');CE.f=null;botC('بخش خدمات ملک را باز کردم.',null);return true}if(has('خواب')){var m2=t.match(/[0-9]+/);if(m2&&CE.f){var nb=+pd(m2[0]);if(nb>=1&&nb<=5){var DD=wd(CE.f).data;DD.beds=nb;botC('تعداد خواب ثبت شد.',null);cePush();CE.i++;ceStep();return true}}botC('تعداد خواب را با عدد مشخص کنید (1 تا 5).',null);return true}if(has('منو','داشبورد')){ceVal('!menu');CE.f=null;return true}return false}

function ceVal(v){
  if(v==='!menu'){ceStart('gate');CE.i=1;ceStep();return}
  if(v==='!help'){
    botC('فرمان‌ها: «ادامه»، «محله‌ها»، «مقایسه»، «امضا»، «فسخ»، «چند کلید دارم»، «کیف پول»، «نقشه»، «منو».',[['منوی اصلی','!menu']]);
    return;
  }
  if(v.indexOf('F:')===0){
    var t=v.slice(2);
    if(t==='dashx'||t==='reqs'){E27.reqModal(S.ui.dcat||'rent','open')}
    else if(t==='sub'||t==='wallet'){S.ui.atab=(t==='sub'?'plan':'wallet');go('profile')}
    else if(t.indexOf('step:')===0){var sm=t.slice(5);if(MODBY[sm]){save();go(MODBY[sm].v)}else{ceStart(t)}}
    else{ceStart(t)}
    return;
  }
  if(v==='!wl'){ACT.wallet();return}
  if(v==='!svc'){go('svc');return}
  if(!CE.f){botC('از منوی اصلی شروع کنید:',[['منوی اصلی','!menu']]);return}
  var sc=SCRIPTS[CE.f];
  if(!sc){CE.f=null;renderChatMeta();botC('این فلو در گفت‌وگو پشتیبانی نمی‌شود؛ در صفحهٔ اختصاصی ادامه دهید.',[['منوی اصلی','!menu']]);return}
  var st=sc[CE.i],D=wd(CE.f).data;
  if(v.charAt(0)==='!'&&st.acts&&st.acts[v.slice(1)]){st.acts[v.slice(1)](D);return}
  if(st.loop){
    if(!D.P){D.P={}}
    D.P[st.loop[CE.li].k]=parseImportance(v);
    CE.li++;
    if(CE.li<st.loop.length){botC(st.loop[CE.li].t,CHIP5())}
    else{CE.i++;CE.li=0;save();renderCurrent();ceStep()}
    return;
  }
  var v0=String(v),note=null;
  if(st.money||st.count||st.range||st.moneyRange){
    D._inputs=D._inputs||{};D._inputs[st.id||('step'+CE.i)]=v0;
  }
  if(st.money){
    var searchCeiling=(CE.f==='rent'&&['dep','rentb'].indexOf(st.id)>=0)||(CE.f==='buy'&&st.id==='budg');
    var pm=(searchCeiling?parseSearchMoneyFA:parseMoneyFA)(v0);
    if(!pm.ok){
      var p27=null;
      try{p27=E27.budgParse(v0,searchCeiling)}catch(e27x){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:205',e27x,'caught');}
      if(p27&&p27.ok){v=v0;note=null}
      else{botC(pm.msg);return}
    }else{v=String(pm.value);note=pm.note}
  }else if(st.count){
    var pc=parseCountFA(v0);
    if(!pc.ok){botC(pc.msg);return}
    v=String(pc.value);
  }else if(st.range){
    var prg=st.id==='age'?parseAgeRangeFA(v0):parseRangeFA(v0);
    if(!prg.ok){botC(prg.msg);return}
    v=prg.value;
  }else if(st.moneyRange){
    var pmr=parseMoneyRangeFA(v0);
    if(!pmr.ok){botC(pmr.msg);return}
    v=pmr.value;note=pmr.note;
  }
  var done=null;
  if(st.set){done=(st.money||st.moneyRange)?moneyCanonical(function(){return st.set(D,v)}):st.set(D,v)}
  else if(st.key){D[st.key]=v}
  if(done==='ERR'){botC(st.err||('این مقدار در بازهٔ مجاز نیست. '+(st.hint||'یک مقدار معتبر وارد کنید.')));return}
  try{ctxFromStep(CE.f,st,D)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/conversation.js:226',e,'caught');}
  if(note){botC(note)}
  if(st.until){
    if(done==='DONE'){cePush();CE.i++;save();renderCurrent();ceStep()}
    else{save();botC('✓ اضافه شد. مورد دیگر؟ (یا «تمام»)',[['تمام','تمام']])}
    return;
  }
  cePush();CE.i++;CE.li=0;save();renderCurrent();ceStep();
}
function ceSend(t){
  if(t==null)return;
  if(String(t)==='!back'){ceBack();return}
  t=(t||'').replace(/^\s+|\s+$/g,'');
  if(!t){return}
  var q=t.replace(/[يى]/g,'ی');
  if(/^(درخواست|نقشه|کیف پول|شارژ|داشبورد|راهنما|کمک|منو)/.test(q)){
    usrC(t);
    if(/^درخواست/.test(q)){E27.reqModal(S.ui.dcat||'rent','open');return}
    if(/^نقشه/.test(q)){go('map');return}
    if(/^کیف پول/.test(q)){ACT.wallet();return}
    if(/^شارژ/.test(q)){E27.walletChat();return}
    if(/^داشبورد/.test(q)){ceVal('!menu');return}
    if(/^(راهنما|کمک)/.test(q)){ceVal('!help');return}
    if(/^منو/.test(q)){ceVal('!menu');return}
  }
  if(CE.f){
    var stc=(SCRIPTS[CE.f]||{})[CE.i];
    if(stc&&stc.chips){
      var mc=matchChipText(t,stc.chips(wd(CE.f).data));
      var numericStep=!!(stc.money||stc.count||stc.range||stc.moneyRange||stc.kind==='num');
      if(mc&&(mc.exact||(!numericStep&&stc.kind!=='text'))){usrC(t);ceVal(mc.value);return}
    }
  }
  var st=(CE.f&&SCRIPTS[CE.f])?SCRIPTS[CE.f][CE.i]:null;
  if(st&&(st.kind==='text'||st.kind==='num'||st.set||st.loop||st.until)){usrC(t);ceVal(t,t);return}
  usrC(t);
  var n=pd(t).replace(/[يى]/g,'ی');
  var nn=t.replace(/[يى]/g,'ی');
  if(/کلید/.test(nn)){CBT.tok();return}
  if(/کیف پول/.test(nn)){ACT.wallet();return}
  if(/فسخ/.test(nn)&&CE.f==='rent'&&wd('rent').data.signed){ceJump('termq');return}
  if(/امضا/.test(nn)&&CE.f==='rent'){ceJump('ctr0');return}
  if((n.indexOf('محله')===0)&&((CE.f==='rent')||(CE.f==='buy'))){ceJump('hoods');return}
  if(/مقایسه/.test(nn)&&((CE.f==='rent')||(CE.f==='buy'))){ceJump('hoods');return}
  if(/نقشه/.test(nn)){go('map');return}
  if(/درخواست/.test(nn)){DASHT='req';DASHF='open';go('dash');return}
  if(/راهنما|کمک/.test(nn)){ceVal('!help');return}
  if(/منو/.test(nn)){ceVal('!menu');return}
  if(/داشبورد/.test(nn)){go('dash');return}
  if(RINT.has(q,'بازار','روند','تورم','میانگین','قیمت','امتیاز محله')&&RINT.route(t)){return}
  if(/[۰-۹0-9]/.test(q)&&RINT.has(q,'میلیارد','میلیون','هزار')&&RINT.has(q,'رهن','ودیعه')&&/اجاره/.test(q)&&RINT.route(t)){return}
  if(/[۰-۹0-9]/.test(q)&&RINT.has(q,'میلیارد','میلیون','هزار')&&/بخرم|بتونم|می توانم|چند متر|توان خرید/.test(q)&&RINT.route(t)){return}
  if(ceSmart(t)){return}
  if(RINT.route(t)){return}
  botC('این را دقیق متوجه نشدم؛ یکی از مسیرهای پرکاربرد را انتخاب کنید یا واضح‌تر بنویسید:'+RINT.topicsHTML(),[['راهنما','!help'],['منوی اصلی','!menu']]);
}
/* V0.28 — کارت محلهٔ بزرگ: هر داده در بلوک جدا */
function chatHoodCard(h,m,D){
  var s=hoodScore(h,D.P),inC=(D.cmpH||[]).indexOf(h.id)>=0;
  function cell(lab,val,cls){return '<div class="hcard-cell"><small>'+lab+'</small><b'+(cls?' class="'+cls+'"':'')+'>'+val+'</b></div>'}
  return '<div class="hcard">'+
  '<div class="hcard-h">'+ph(h.id,176,120,'')+'<div><b>محلهٔ '+esc(h.n)+'</b><small>امتیاز تطبیق با اولویت‌های شما</small></div><span class="hcard-score">٪'+fa(s,0)+'</span></div>'+
  '<div class="hcard-grid">'+
  cell('اجارهٔ نمونهٔ ماهانه',rial(h.avgRent))+
  cell('ودیعهٔ نمونه',rial(h.avgDep))+
  cell('میانگین آگهی هر متر',rial(h.buyBase))+
  cell('بازهٔ آگهی',rShort(h.mkt.low)+' – '+rShort(h.mkt.high))+
  cell('تغییر یک‌ساله',pct(h.mkt.yoy),h.mkt.yoy>=0?'up':'down')+
  cell('تغییر ماهانه',pct(h.mkt.mom),h.mkt.mom>=0?'up':'down')+
  '</div>'+
  (placeText(h.id,2)?'<div class="hcard-loc"><small style="display:block;color:var(--ink2);font-size:10.5px;margin-bottom:2px">مکان‌های مهم</small>'+esc(placeText(h.id,2))+'</div>':'<div class="hcard-loc"><small style="display:block;color:var(--ink2);font-size:10.5px;margin-bottom:2px">مکان‌های مهم</small>ثبت نشده</div>')+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selH" data-m="'+m+'" data-h="'+h.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="hInfo" data-h="'+h.id+'">اطلاعات</button>'+
  '<button class="btn btn-xs" data-cba="hMap" data-h="'+h.id+'">نقشه</button>'+
  '<button class="btn btn-xs" data-cba="caddH" data-m="'+m+'" data-h="'+h.id+'">'+(inC?'✓ در مقایسه':'مقایسه')+'</button></div></div>';
}
/* V0.27 — کارت‌های آگهی داخل گفت‌وگو: عمودی (pcard) */
function chatListCard(x,sel){
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">اجارهٔ ماهانه</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.rent)+'<small>تومان در ماه</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">ودیعه (رهن): <b style="color:var(--ink)">'+rial(x.dep)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(x.hood,2)?esc(placeLineText(x.hood,2))+'<br>':'')+'مالکیت: استعلام لازم — جزئیات کامل پس از «جزئیات» نمایش داده می‌شود.</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selL" data-l="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detL" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-act="vtour" data-id="'+x.id+'">تور مجازی</button>'+
  '<button class="btn btn-xs" data-cba="savL" data-l="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">★</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}
function chatBCard(x,sel){
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">فروش</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.m2*x.ppm)+'<small>قیمت کل</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">هر متر: <b style="color:var(--ink)">'+rial(x.ppm)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(x.hood,2)?esc(placeLineText(x.hood,2))+'<br>':'')+'مالکیت: استعلام لازم — جزئیات کامل پس از «جزئیات» نمایش داده می‌شود.</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selB" data-l="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detB" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-act="vtour" data-id="'+x.id+'">تور مجازی</button>'+
  '<button class="btn btn-xs" data-cba="savB" data-l="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">★</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}
function chatStayCard(s,sel,saved){
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(s.seed,480,360,'')+'<span class="pcard-type">اقامتگاه</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(s.p)+'<small>هر شب</small></div>'+
  '<div class="pcard-title">'+esc(s.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(s.city)+' · ★ '+s.rate+'</div>'+
  (s.amens&&s.amens.length?'<div class="pcard-amen">'+s.amens.slice(0,4).map(function(a){return '<span>'+esc(a)+'</span>'}).join('')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(s.ll,2)?esc(placeLineText(s.ll,2))+'<br>':'')+'قوانین: '+esc((s.rules||[]).slice(0,2).join(' · '))+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selS" data-l="'+s.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detS" data-l="'+s.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savS" data-l="'+s.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}
var SCRIPTS={};
var PERSONA_NOTE={'خانواده':'برای خانواده‌ها وزن پارک و مدرسه را در امتیاز تطبیق بالاتر بردم.','دو نفره':'برای دو نفر، دسترسی شهری را مهم‌تر گرفتم.','دانشجو/کاری':'دسترسی مترو و محل کار را وزن بیشتری دادم.','موقت':'برای اقامت کوتاه‌مدت، انعطاف قرارداد جلوتر دیده می‌شود.'};
SCRIPTS.gate=[
{id:'hello',q:function(){return 'سلام! چه کاری برایتان انجام دهم؟'+E28.discoverChips()},
 chips:function(){return [[' الان مشخص می‌کنم','!pnow'],[' بعداً','!pskip']]},
 acts:{pnow:function(){CE.i=1;ceStep()},pskip:function(){CE.i=1;ceStep()}}},
{id:'menu',q:'عالی! چه کاری می‌خواهید انجام دهید؟<br><small>کل فلو را می‌توانید همین‌جا گفت‌وگو‌محور انجام دهید.</small>',
 chips:function(){return [[' اجاره','F:rent'],[' خرید','F:buy'],[' سرمایه‌گذاری','F:invp'],[' پروژه‌ها','F:mkt'],[' اقامتگاه','F:stay'],['نقشه','F:dashx'],[' راهنما','!help']]}}
];
SCRIPTS.rent=[
{id:'dep',money:true,q:' <b>مبلغ ودیعهٔ شما</b> چقدر است؟ (تومان — عدد دقیق وارد کنید)',kind:'num',
 pre:function(D){if(CTX.dep&&!D._depSet){if(!D.B){D.B={inc:1500000000,depB:CTX.dep,rentB:0,chg:50000000,incr:100000000}}D.B.depB=CTX.dep;D._depSet=1;botC('✓ ودیعه از گفت‌وگوی قبلی به‌کار رفت: <b>'+rial(CTX.dep)+'</b> — برای تغییر، «بازگشت» را بزنید.');return false}return true},
 chips:function(){return [['۵۰۰ میلیون تومان','5000000000'],['۱ میلیارد تومان','10000000000'],['۳ میلیارد تومان','30000000000'],['بدون سقف','بدون سقف']]},
 set:function(D,v){
   if(!D.B){D.B={inc:1500000000,depB:15000000000,rentB:500000000,chg:50000000,incr:100000000}}
   D._depSet=1;
   var p=E27.budgParse(v,true);
   if(!p.ok)return 'ERR';
   if(p.mode==='open'){D.depOpen=true;D.B.depB=D.B.depB||15000000000;return null}
   if(p.n<0)return 'ERR';
   D.depOpen=false;D.B.depB=p.n;return null},
 err:'ودیعه را به تومان بنویسید (مثلاً «۱۵ میلیارد» یا «۱٫۵ میلیارد تومان») — بدون سقف؛ یا «بدون سقف» بفرستید.'},
{id:'rentb',money:true,q:' <b>اجارهٔ ماهانهٔ شما</b> چقدر است؟ (تومان)',kind:'num',
 pre:function(D){if(CTX.rent&&!D._rentbSet){D.B=D.B||{inc:1500000000,depB:CTX.dep||15000000000,rentB:CTX.rent,chg:50000000,incr:100000000};D.B.rentB=CTX.rent;D._rentbSet=1;botC('✓ سقف اجاره از گفت‌وگوی قبلی: <b>'+rial(CTX.rent)+'</b>');return false}return true},
 chips:function(){return [['۳۰ میلیون تومان','300000000'],['۵۰ میلیون تومان','500000000'],['۸۰ میلیون تومان','800000000'],['بدون سقف','بدون سقف']]},
 set:function(D,v){
   var p=E27.budgParse(v,true);
   if(!p.ok)return 'ERR';
   if(p.mode==='open'){D.rentBOpen=true;D._rentbSet=1;return null}
   if(p.n<0)return 'ERR';
   D.rentBOpen=false;D._rentbSet=1;D.B.rentB=p.n;return null},
 err:'اجارهٔ ماهانه را به تومان بنویسید (مثلاً «۸۰ میلیون تومان») — بدون سقف؛ یا «بدون سقف» بفرستید.'},
{id:'imps',loop:[{k:'metro',t:' اهمیت دسترسی به مترو (۱–۵)؟'},{k:'school',t:' اهمیت نزدیکی به مدرسه؟'},{k:'work',t:' اهمیت کوتاه‌بودن رفت‌وآمد به کار'+wLabel()+'؟'}],pre:function(D){defP(D);return true}},
{id:'beds',count:true,q:' حداقل چند خواب؟',chips:function(){return [['۰','0'],['۱','1'],['۲','2'],['۳ یا بیشتر','3']]},pre:function(D){if(CTX.beds&&D._bedsSet===undefined){defP(D);D.P.beds=CTX.beds;D._bedsSet=1;botC('✓ حداقل خواب از گفت‌وگوی قبلی: <b>'+fa(CTX.beds,0)+'</b>');return false}return true},set:function(D,v){defP(D);D.P.beds=+v;D._bedsSet=1;return null}},
{id:'who',kind:'text',q:'و برای تنظیم بهتر پیشنهادها — این خانه بیشتر برای چه موقعیتی مناسب است؟ (اختیاری؛ می‌توانید رد کنید)',
 pre:function(D){defP(D);if(CTX.persona&&D.P.persona===undefined){D.P.persona=CTX.persona;botC('✓ شرایط سکونت از گفت‌وگوی قبلی: <b>'+esc(CTX.persona)+'</b>');return false}return true},
 chips:function(){return [['خانواده‌ای','خانواده'],['دو نفره','دو نفره'],['دانشجو/کاری','دانشجو'],['اقامت موقت','موقت'],['رد کردن','رد کردن']]},
 set:function(D,v){v=String(v||'');
  if(/رد|مهم نیست|skip/.test(v)){D.P.persona='';return null}
  if(/خانواده|بچ|فرزند/.test(v))D.P.persona='خانواده';
  else if(/دانشجو|کار|اداری/.test(v))D.P.persona='دانشجو/کاری';
  else if(/دو نفر|زوج|همسر/.test(v))D.P.persona='دو نفره';
  else if(/موقت|کوتاه/.test(v))D.P.persona='موقت';
  else D.P.persona='';
  return null}},
{id:'age',count:true,q:function(D){return (D.P.persona&&PERSONA_NOTE[D.P.persona]?'<div class="note" style="margin:0 0 4px">✓ '+PERSONA_NOTE[D.P.persona]+'</div>':'')+' حداکثر عمر بنا؟'},chips:function(){return [['نوساز','3'],['تا ۱۰','10'],['تا ۲۰','20'],['مهم نیست','30']]},set:function(D,v){D.P.maxAge=+v;return null}},
{id:'m2',count:true,q:' حداقل متراژ (متر)؟ (عدد تایپ کنید)',kind:'num',chips:function(){return [['۴۵–۵۵','50'],['۶۰–۷۵','65'],['۸۰+','85']]},set:function(D,v){D.P.minM2=+pd(v)||60;return null}},
{id:'floor',q:' طبقهٔ دلخواه؟',chips:function(){return [['هر طبقه','any'],['۱ تا ۳','low'],['۴+','high']]},set:function(D,v){D.P.floor=v;return null}},
{id:'elev',q:' آسانسور الزامی است؟',chips:function(){return [['بله','yes'],['مهم نیست','no']]},set:function(D,v){D.P.elev=(v==='yes');return null}},
{id:'park',q:' پارکینگ الزامی است؟',chips:function(){return [['بله','yes'],['مهم نیست','no']]},set:function(D,v){D.P.park=(v==='yes');return null}},
{id:'extra',q:' اولویت شخصی دارید؟ بنویسید — یا «تمام»',kind:'text',until:'تمام',
 chips:function(){return [['تمام','تمام']]},
 set:function(D,v){defP(D);if(pd(v).indexOf('تمام')>=0)return 'DONE';if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';D.P.extra.push({t:v, w:3});return null}},
{id:'hoods',q:' با اولویت‌های شما، همخوان‌ترین محله‌ها:',
 set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
 err:'نام محله را دقیق بنویسید (مثلاً سعادت‌آباد) یا از کارت‌ها انتخاب کنید.',
 cards:function(D){return HOODS.slice().sort(function(a,b){return hoodScore(b,D.P)-hoodScore(a,D.P)}).slice(0,3).map(function(h){return chatHoodCard(h,'rent',D)}).join('')},
 chips:function(D){
   var c=[[' مقایسهٔ این سه','!cmp']];
   if((D.cmpH||[]).length>=2){c.push(['نمایش جدول','!cmp'])}
   c.push(['همهٔ محله‌ها','!all'],['تغییر اولویت‌ها','!back'],['نقشه','!map']);
   return c},
 acts:{
  cmp:function(D){var t=cmpHoodTable('rent');if(!t){botC('دو محله را با  اضافه کنید.');return}botC(' مقایسهٔ محله‌ها:'+t,[['ادامهٔ انتخاب','!again'],['کارت‌ها','!all']])},
  all:function(D){botC('همهٔ محله‌ها:<div class="chcards">'+HOODS.slice().sort(function(a,b){return hoodScore(b,D.P)-hoodScore(a,D.P)}).map(function(h){return chatHoodCard(h,'rent',D)}).join('')+'</div>',[['برو به بازار','!next']])},
  back:function(){ceJump('imps')},
  map:function(){go('map')},
  again:function(){ceStep()},
  next:function(){ceJump('mk')}
 }},
{id:'mk',q:function(D){
  return E27.marketHTML({h:D.hood,mode:'rent',period:12});
 },
 chips:function(){return [['دیدن آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},
{id:'list',q:function(D){
  defP(D);
  var all=RLIST.filter(function(x){return !D.hood||x.hood===D.hood});
  var hard=all.filter(function(x){return E30.flowsAPI.rentPass(x,D)});
  return ' آگهی‌های منطبق ('+fa(hard.length,0)+' از '+fa(all.length,0)+'):'+(hard.length?'':E30.guide.criteriaAction('rent','legacy'))},
 cards:function(D){
  defP(D);
  var hard=RLIST.filter(function(x){return E30.flowsAPI.rentPass(x,D)});
  return hard.sort(function(a,b){return lscore(b,D)-lscore(a,D)}).slice(0,3).map(function(x){return chatListCard(x,D.listing===x.id)}).join('')},
 chips:function(D){
  var c=[];
  if((D.saved||[]).length>=2){c.push([' مقایسهٔ ذخیره‌شده‌ها','!cmp'])}
  c.push(['همهٔ آگهی‌ها','!all'],['بازگشت به محله‌ها','!back']);
  if(getPlaces().length)c.push(['فاصله‌ها','!dist']);
  return c},
 acts:{
  cmp:function(){cmpListModal('rent');botC('جدول مقایسه باز شد ✓',[['برو به بازدید','!skp']])},
  all:function(D){var ms=RLIST.filter(function(x){return !D.hood||x.hood===D.hood}),ok=ms.filter(function(x){return E30.flowsAPI.rentPass(x,D)}),no=ms.filter(function(x){return !E30.flowsAPI.rentPass(x,D)});botC('منطبق با الزام‌های شما: '+fa(ok.length,0)+' آگهی'+(no.length?' — '+fa(no.length,0)+' آگهی دیگر خارج از الزام‌هاست و «انطباق» حساب نمی‌شود':'')+':<div class="chcards">'+ok.concat(no).map(function(x){return chatListCard(x,D.listing===x.id)}).join('')+'</div>',[['برو به بازدید','!skp']])},
  back:function(){ceJump('hoods')},
  dist:function(D){if(!D.listing){botC('اول یک ملک را «انتخاب» کنید.');return}var x=findL(D.listing);botC('<b>'+x.t+'</b>'+placesHTML(x.hood,8),[['نقشه','!map']])},
  map:function(){go('map')},
  skp:function(){if(!wd('rent').data.listing){botC('اول یک ملک را «انتخاب» کنید.');return}ceJump('day')}
 }},
{id:'day',q:' روز بازدید — مالک این روزها را اعلام کرده:',
 chips:function(D){var x=findL(D.listing),av=x.av||{},r=[],k;for(k in av){r.push([k,k])}return r},
 set:function(D,v){D.vday=v;D.vtime=null;return null}},
{id:'time',q:function(D){return ' ساعت (ساعات اعلامی مالک در '+D.vday+'):'},
 chips:function(D){var x=findL(D.listing);return (x.av[D.vday]||[]).map(function(tt){return [tt,tt]})},
 set:function(D,v){if(!v)return 'ERR';D.vtime=v;return null}},
{id:'visit',q:function(D){return 'ثبت درخواست بازدید برای <b>'+D.vday+' ساعت '+D.vtime+'</b>؟ (۲۰ کلید)'},
 chips:function(){return [['ثبت کن','!go'],['تغییر زمان','!back'],[' تور مجازی','!tour']]},
 acts:{
  go:function(D){if(doRentVisit()){ceJump('vform')}},
  back:function(){ceJump('day')},
  tour:function(D){openTourModal(D.listing)}
 }},
{id:'vform',q:function(D){defVlist(D);return ' <b>فرم هوشمند بازدید</b> — موارد را علامت بزنید:'},
 cards:function(D){
  defVlist(D);
  return D.vlist.map(function(v,i){
    return '<div class="ccard"><div class="cb"><b>'+(v.ok?'✓ ':'')+esc(v.t)+'</b></div><button class="btn btn-xs'+(v.ok?' btn-primary':'')+'" data-cba="vcT" data-i="'+i+'">'+(v.ok?'بررسی شد':'علامت‌گذاری')+'</button></div>';
  }).join('')},
 chips:function(){return [[' همه بررسی‌شده','!all'],[' مورد جدید','!add'],['ادامه','!nx']]},
 acts:{
  all:function(D){defVlist(D);D.vlist.forEach(function(v){v.ok=true});save();ceStep()},
  add:function(){ceJump('vadd')},
  nx:function(){ceJump('ctr0')}
 }},
{id:'vadd',q:' مورد جدید را بنویسید (یا «تمام»):',kind:'text',until:'تمام',
 chips:function(){return [['تمام','تمام']]},
 set:function(D,v){
   defVlist(D);
   if(pd(v).indexOf('تمام')>=0)return 'DONE';
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   D.vlist.push({t:v,ok:false});return null}},
{id:'ctr0',q:function(D){
   if(D.signed&&D.code)return ' قرارداد <b dir="ltr">'+D.code+'</b> فعال است. برای ادامه، فسخ را از همین گفت‌وگو شروع کنید.';
   return ' <b>ثبت قرارداد داخلی</b> — فرم را همین‌جا در گفت‌وگو کامل می‌کنیم (طرفین → ملک و مالی → بازبینی → ثبت).';
  },
 chips:function(){return [['باز کردن فرم در گفت‌وگو','!open']]},set:function(){return null},
 acts:{open:function(D){E28.ctrStart('rent')}}},
{id:'termq',q:function(D){return ' قرارداد '+D.code+' فعال است. فرایند <b>فسخ و تخلیه</b> را شروع می‌کنم؟'},
 chips:function(){return [['شروع فسخ','!go'],['فعلاً نه','!end'],[' خدمات پس از سکونت','!svc']]},
 acts:{
  go:function(D){
    if(E28.contractOf(D.code)&&E28.contractOf(D.code).status==='terminated'){botC(' قرارداد <b dir="ltr">'+esc(D.code)+'</b> قبلاً فسخ شده است.',null);return}
    D.term={ph:1,who:'مستأجر (شما)'};save();if(CURRENT==='rent')renderCurrent();ceJump('treason')},
  end:function(D){
    var d=wd('rent');
    if(!d.done){d.done=true;addReq('rent','وضعیت','قرارداد فعال — پایان فلو','کامل شد');save()}
    ceEnd()
  },
  svc:function(){openServicesModal()}
 }},
{id:'treason',q:'دلیل فسخ؟ (یا خودتان بنویسید)',kind:'text',
 chips:function(){return [['پایان مدت','پایان مدت'],['توافق','توافق'],['تخلف از بندها','تخلف'],['نیاز شخصی','شخصی']]},
 set:function(D,v){
   var T=D.term;
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   T.reason=v;T.rtxt=v;return null}},
{id:'tdate',q:'زمان تخلیه؟ (یا بنویسید)',kind:'text',
 chips:function(){return [['۳۰ روز دیگر','۳۰ روز دیگر'],['۲ هفته','۲ هفته'],['توافقی','توافقی']]},
 set:function(D,v){
   var T=D.term;
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   T.date=v;T.dtxt=v;return null}},
{id:'tmin',q:function(D){
  var T=D.term;
  return ' صورت‌جلسه:<br><small style="white-space:pre-line">'+esc(termTpl(T,D))+'</small><br>ارسال برای تأیید طرف مقابل؟'},
 chips:function(){return [['ارسال','!send']]},
 acts:{send:function(D){
   var T=D.term;
   T.min=termTpl(T,D);T.ph=2;
   T.rid=addReq('rent','فسخ','درخواست فسخ '+D.code+' — '+T.reason,'در انتظار','تخلیه: '+T.date);
   save();if(CURRENT==='rent')renderCurrent();ceJump('totp');
 }}},
{id:'totp',q:'آیا تأیید موجر برای صورت‌جلسه را دریافت کرده‌اید؟ (اعلام شما؛ تأیید رسمی خارج از محلینو است)',kind:'text',
 chips:function(){return [['تأیید موجر دریافت شد','confirmed']]},
 set:function(D,v){
   if(!/تأیید|تایید|confirmed|بله/.test(v))return 'ERR';
   var T=D.term;
   T.ok=true;T.ph=4;
   if(T.rid)setReq(T.rid,'تأیید شد');
   save();if(CURRENT==='rent')renderCurrent();return null}},
{id:'tai',q:function(D){
   var T=D.term;
   if(!T.ba)T.ba={stage:1};
   return ' <b>تخلیهٔ هوشمند</b> — گام '+fa(T.ba.stage,0)+' از ۲: '+(T.ba.stage===1?'وضعیت <b>روز ورود</b> (پیش از تخلیه) را بررسی و تأیید کنید، یا عکس واقعی ملک خودتان را جایگزین کنید.':'وضعیت <b>روز تخلیه</b> (پس از خروج اثاثیه) را بررسی و تأیید کنید.')+
   baHTML(T.ba);
  },
 chips:function(D){var T=D.term;return T.ba.stage===1?[['تأیید وضعیت روز ورود','!ba1'],['رد کردن تحلیل تصویر','!skip']]:[['تأیید و تحلیل','!ai'],['بازگشت به گام ۱','!ba0']]},
 acts:{
  ba1:function(D){var T=D.term;T.ba.stage=2;save();ceStep()},
  ba0:function(D){var T=D.term;T.ba.stage=1;save();ceStep()},
  skip:function(D){
    var T=D.term;T.ai=true;T.ph=4;T.ba={stage:3,skipped:true};save();
    if(CURRENT==='rent')renderCurrent();
    botC('تحلیل تصویر رد شد؛ مستقیم به تسویهٔ ودیعه می‌رویم.',[['تسویه ودیعه','!pay']]);
  },
  ai:function(D){
   var T=D.term;
   T.wait=true;save();
   T.ba.stage=3;save();
   botC(' در حال تحلیل تصاویر… <span class="dots"><i></i><i></i><i></i></span>');
   setTimeout(function(){
     T.wait=false;T.ai=true;T.ph=4;save();
     if(CURRENT==='rent')renderCurrent();
     botC(' نتیجهٔ تحلیل: ۱ مورد خارج از استهلاک (نم دیوار — بار موجر) + ۱ مورد استهلاک عادی. <b>کسر: صفر.</b>',[['تسویه ودیعه','!pay']]);
   },1400);
 }}},
{id:'tpay',q:function(D){return ' تسویه: ودیعه '+rial(D.B.depB)+' — کسورات صفر. واریز ۱۰۰٪ از حساب امانی؟'},
 chips:function(){return [['واریز کن','!pay']]},
 acts:{pay:function(){ACT.tpay();ceEnd()}}}
];
SCRIPTS.buy=[
{id:'budg',money:true,q:' بودجهٔ کل خرید شما چقدر است؟ (تومان — تایپ کنید)',kind:'num',
 pre:function(D){if(CTX.budg&&!D._budgSet&&CTX.budg>=50000000000){D.budg=CTX.budg;D._budgSet=1;botC('✓ بودجه از گفت‌وگوی قبلی: <b>'+rial(CTX.budg)+'</b> — برای تغییر، «بازگشت» را بزنید.');return false}return true},
 chips:function(){return [['۱۵ میلیارد تومان','150000000000'],['۳۰ میلیارد تومان','300000000000'],['۵۰ میلیارد تومان','500000000000'],['بدون بودجهٔ مشخص','بدون بودجهٔ مشخص'],['۵ میلیارد به بالا','۵ میلیارد به بالا']]},
 set:function(D,v){
   var p=E27.budgParse(v,true);
   if(!p.ok)return 'ERR';
   D._budgSet=1;
   if(p.mode==='open'){D.budgOpen=true;D.budgMin=null;return null}
   if(p.mode==='min'){D.budgOpen=true;D.budgMin=p.n;botC('✓ بودجهٔ «حداقل '+rial(p.n)+'» ثبت شد — بدون سقف.');return null}
   if(p.mode==='max'){D.budgOpen=false;D.budg=p.n;botC('✓ سقف بودجه '+rial(p.n)+' ثبت شد — بدون کف.');return null}
   if(p.n<0)return 'ERR';
   D.budgOpen=false;D.budg=p.n;return null},
 err:'بودجه را به تومان بنویسید (مثلاً «۳۰ میلیارد» یا «۵ میلیارد به بالا» یا «بدون بودجهٔ مشخص»).'},
{id:'imps',loop:[{k:'metro',t:' اهمیت مترو؟'},{k:'school',t:' اهمیت مدرسه؟'},{k:'work',t:' اهمیت رفت‌وآمد'+wLabel()+'؟'}],pre:function(D){defP(D);defPR(D);return true}},
{id:'age',range:true,q:' بازهٔ عمر بنا؟',chips:function(){return [['نوساز','0|3'],['۰–۵','0|5'],['۳–۱۰','3|10'],['تا ۲۰','0|20'],['هرچه','0|30']]},set:function(D,v){defPR(D);var p=String(v).split('|');if(p.length!==2||!p.every(function(n){return Number.isFinite(+n)&&+n>=0})||+p[0]>+p[1])return 'ERR';D.PR.age=[+p[0],+p[1]];return null}},
{id:'m2',range:true,q:' بازهٔ متراژ؟ (بنویسید 45-60)',kind:'text',chips:function(){return [['۴۵–۶۰','45|60'],['۵۰–۷۰','50|70'],['۶۰–۹۰','60|90'],['۷۰+','70|130']]},set:function(D,v){var p=pd(v).split(/[-|]/);if(p.length<2||!+p[1])return 'ERR';D.PR.m2=[+p[0],+p[1]];return null}},
{id:'ppm',moneyRange:true,q:' بازهٔ قیمت هر متر (تومان)؟ (بنویسید 2000000000-3000000000)',kind:'text',chips:function(){return [['۲۰۰–۲۵۰ میلیون تومان','2000000000|2500000000'],['۲۵۰–۳۵۰ میلیون تومان','2500000000|3500000000'],['مهم نیست','1800000000|5500000000']]},set:function(D,v){var p=pd(v).split(/[-|]/);if(p.length<2||!+p[1])return 'ERR';D.PR.ppm=[+p[0],+p[1]];return null}},
{id:'floor',range:true,q:' بازهٔ طبقه؟ (بنویسید 1-3 یا «همه»)',kind:'text',chips:function(){return [['۱–۳','1|3'],['۴–۱۰','4|10'],['همه','1|10']]},set:function(D,v){if(/همه/.test(v)){D.PR.floorR=[1,10];return null}var p=pd(v).split(/[-|]/);if(p.length<2||!+p[1])return 'ERR';D.PR.floorR=[Math.max(1,+p[0]),Math.min(10,+p[1])];return null}},
{id:'beds',count:true,q:' حداقل خواب؟',chips:function(){return [['۰','0'],['۱','1'],['۲','2'],['۳+','3']]},set:function(D,v){D.PR.beds=+v;return null}},
{id:'feat',q:' ویژگی الزامی؟ (آسانسور/پارکینگ/بالکن/هیچ)',kind:'text',
 chips:function(){return [['آسانسور','elev'],['پارکینگ','park'],['بالکن','balc'],['هیچ','none']]},
 set:function(D,v){if(v==='none'){D.PR.elev=D.PR.park=D.PR.balc='no'}else{D.PR[v]='yes'}return null}},
{id:'hoods',q:' محله‌های همخوان:',
 set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
 err:'نام محله را دقیق بنویسید (مثلاً پونک) یا از کارت‌ها انتخاب کنید.',
 cards:function(D){return HOODS.slice().sort(function(a,b){return hoodScore(b,D.P)-hoodScore(a,D.P)}).slice(0,3).map(function(h){return chatHoodCard(h,'buy',D)}).join('')},
 chips:function(D){
  var c=[[' مقایسه','!cmp']];
  if((D.cmpH||[]).length>=2)c.push(['نمایش جدول','!cmp']);
  c.push(['همهٔ محله‌ها','!all'],['تغییر اولویت‌ها','!back'],['نقشه','!map']);
  return c},
 acts:{
  cmp:function(D){var t=cmpHoodTable('buy');if(!t){botC('دو محله اضافه کنید.');return}botC(' مقایسه:'+t,[['ادامه','!again'],['همه','!all']])},
  all:function(D){botC('همه:<div class="chcards">'+HOODS.slice().sort(function(a,b){return hoodScore(b,D.P)-hoodScore(a,D.P)}).map(function(h){return chatHoodCard(h,'buy',D)}).join('')+'</div>',[['برو به بازار','!next']])},
  back:function(){ceJump('imps')},
  map:function(){go('map')},
  again:function(){ceStep()},
  next:function(){ceJump('mk')}
 }},
{id:'mk',q:function(D){
  return E27.marketHTML({h:D.hood,mode:'buy',period:12,budg:D.budg,budgOpen:!!D.budgOpen});
 },
 chips:function(){return [['آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},
{id:'liq',q:' <b>(اختیاری)</b> دارایی‌های تأمین بودجه را وارد می‌کنید؟ (می‌توانید رد کنید)',
 chips:function(){return [['در صفحهٔ فلو','page'],['رد کردن','skip']]},
 set:function(D,v){if(v==='skip'){D.liqSkip=true}if(v==='page'){D.liqPage=true}return null}},
{id:'list',q:function(D){
  var hard=BLIST.filter(function(x){return blPass(x,D)});
  return ' آگهی‌های منطبق ('+fa(hard.length,0)+'):'+(hard.length?'':E30.guide.criteriaAction('buy','legacy'))},
 cards:function(D){
  return BLIST.filter(function(x){return blPass(x,D)}).sort(function(a,b){return bScore(b,D)-bScore(a,D)}).slice(0,3).map(function(x){return chatBCard(x,D.blist===x.id)}).join('')},
 chips:function(D){
  var c=[];
  if((D.savedB||[]).length>=2)c.push([' مقایسه','!cmp']);
  c.push(['همهٔ آگهی‌ها','!all'],['محله‌ها','!back']);
  if(getPlaces().length)c.push(['فاصله‌ها','!dist']);
  return c},
 acts:{
  cmp:function(){cmpListModal('buy');botC('جدول باز شد ✓',[['برو به حقوقی','!skp']])},
  all:function(D){botC('همه:<div class="chcards">'+BLIST.filter(function(x){return !D.hood||x.hood===D.hood}).map(function(x){return chatBCard(x,D.blist===x.id)}).join('')+'</div>',[['برو به حقوقی','!skp']])},
  back:function(){ceJump('hoods')},
  dist:function(D){if(!D.blist){botC('اول یک ملک «انتخاب» کنید.');return}var x=findB(D.blist);botC('<b>'+x.t+'</b>'+placesHTML(x.hood,8),[['نقشه','!map']])},
  map:function(){go('map')},
  skp:function(){if(!wd('buy').data.blist){botC('اول یک ملک «انتخاب» کنید.');return}ceJump('lgsc')}
 }},
{id:'lgsc',q:' وضعیت سند ملک برای گزارش حقوقی؟',chips:function(){return [['سند تک‌برگ','ok'],['رهن + مادهٔ ۱۰۰','mort'],['ورثه‌ای','heir']]},set:function(D,v){D.lsel=v;return null}},
{id:'lg',q:'دریافت گزارش حقوقی (۱۰۰ کلید)؟',chips:function(){return [['دریافت','!lg']]},
 acts:{
  lg:function(D){
    if(!spend('legal','buy','گزارش حقوقی — '+LGD[D.lsel].lbl))return;
    D.legal=D.lsel;
    addReq('buy','حقوقی','گزارش '+LGD[D.lsel].lbl,'کامل شد','زمان: '+LGD[D.lsel].est);
    save();if(CURRENT==='buy')renderCurrent();
    botC('✓ ذخیره شد. زمان تا انتقال: '+LGD[D.lsel].est,[['پرداخت امانی','!nx']]);
  },
  nx:function(){ceJump('escA')}
 }},
{id:'escA',pre:function(D){defPay(D);return true},
 q:' <b>توافق طرفین:</b> پرداخت مرحله‌ای است یا یکجا؟',
 chips:function(){return [['مرحله‌ای','yes'],['یکجا هنگام سند','no']]},
 set:function(D,v){D.pay.staged=(v==='yes');D.pay.ok=false;return null}},
{id:'escN',count:true,pre:function(D){return D.pay.staged},
 q:'چند مرحله؟',chips:function(){return [['۲','2'],['۳','3'],['۴','4'],['۵','5'],['۶','6']]},
 set:function(D,v){
   D.pay.n=+v;
   var p=[],base=Math.floor(100/D.pay.n),i;
   for(i=0;i<D.pay.n;i++){p.push(base)}
   p[D.pay.n-1]+=100-base*D.pay.n;
   D.pay.pcts=p;return null}},
{id:'escP',err:'درصدها را با عدد و جداکننده بنویسید؛ جمع ۱۰۰ و تعدادشان برابر مرحله‌های انتخابی — مثلاً برای ۳ مرحله: 33-33-34.',pre:function(D){return D.pay.staged},
 q:function(D){return 'درصد هر مرحله را بنویسید (جمع ۱۰۰ — '+fa(D.pay.n||3,0)+' مرحله؛ مثلاً 33-33-34):'},kind:'text',
 chips:function(){return [['تقسیم مساوی','eq']]},
 set:function(D,v){
   if(!D.pay.n)D.pay.n=3;
   if(v==='eq'){
     var p=[],base=Math.floor(100/D.pay.n),i;
     for(i=0;i<D.pay.n;i++){p.push(base)}
     p[D.pay.n-1]+=100-base*D.pay.n;
     D.pay.pcts=p;D.pay.ok=true;return null;
   }
   var pl=parsePercentListFA(v,(D.pay.n||3));
   if(!pl.ok)return 'ERR';
   var arr=pl.value;
   var s=0;arr.forEach(function(x){s+=x});
   if(Math.abs(s-100)>0.01)return 'ERR';
   D.pay.pcts=arr;D.pay.ok=true;return null}},
{id:'esc1',pre:function(D){return !D.pay.staged},
 q:function(D){
   var tot=D.price||D.budg||0;
   return ' <b>خلاصهٔ توافق پرداخت یکجا (ConfirmationPanel)</b>'+
   '<div class="pay27-sim"><div class="pay27-row"><span>نوع پرداخت</span><b>یکجا هنگام انتقال سند</b></div>'+
   '<div class="pay27-row"><span>درصد در زمان سند</span><b>٪۱۰۰</b></div>'+
   '<div class="pay27-row"><span>مبلغ این مرحله</span><b>'+(tot?rial(tot):'بر پایهٔ قیمت نهایی معامله')+'</b></div>'+
   '<div class="pay27-row"><span>مسیر آزادسازی</span><b>حساب امانی محلینو</b></div></div>'+
   'این توافق را تأیید می‌کنید؟ (پس از تأیید، آزادسازی امانی در مرحلهٔ بعد انجام می‌شود)'},
 chips:function(){return [['تأیید توافق یکجا','!ok1'],['بازگشت و تغییر روش','!back1']]},
 acts:{
  ok1:function(D){D.pay.ok=true;save();botC('✓ توافق پرداخت یکجا ثبت شد — ۱۰۰٪ هنگام انتقال سند از حساب امانی.',null);ceJump('escC')},
  back1:function(){ceJump('escA')}
 }},
{id:'escC',q:function(D){
  if(!D.pay.ok)return 'ابتدا توافق پرداخت را نهایی کنید.';
  var st=escStages(D);
  if(D.escD===undefined)D.escD=0;
  if(D.escD>=st.length)return ' همهٔ مراحل امانی آزاد شد ✓';
  var s=st[D.escD];
  return ' مرحلهٔ '+fa(D.escD+1,0)+' از '+fa(st.length,0)+': <b>٪'+fa(s.p,0)+'</b> — '+rial((D.price||D.budg)*s.p/100);
 },
 chips:function(D){
  if(!D.pay.ok)return [['بازگشت','!back']];
  var st=escStages(D);
  if(D.escD===undefined)D.escD=0;
  if(D.escD<st.length)return [['تأیید و آزادسازی','!ok']];
  return [['برو به تحویل','!done']];
 },
 acts:{
  back:function(){ceJump('escA')},
  ok:function(){ACT.besc();ceStep()},
  done:function(){ceJump('ut')}
 }},
{id:'ut',q:' ثبت انتقال هر ۴ انشعاب؟',chips:function(){return [['ثبت همه','!all']]},
 acts:{all:function(D){
   D.ut=[1,1,1,1];D.utils=true;save();
   if(CURRENT==='buy')renderCurrent();
   var d=wd('buy');
   if(!d.done){d.done=true;addReq('buy','تحویل','اتمام فلوی خرید','کامل شد');save()}
   ceEnd();
 }}}
];
SCRIPTS.mkt=[
{id:'role',q:' نقش شما در مارکت‌پلیس؟',
 chips:function(){return [[' پیمانکار — پیشنهاد + ثبت پروژهٔ جدید','con'],[' کارفرما — تأیید پیمانکار','emp']]},
 set:function(D,v){D.role=v;return null}},
{id:'prj',q:function(D){return D.role==='con'?' کدام پروژه؟ (یا پروژهٔ جدید ثبت کنید)':' پروژه‌های فعال — پیشنهادات را ببینید و تأیید کنید:'},
 set:function(D,v){var ix=projectIndexFromText(v);if(ix<0)return 'ERR';D.prjI=ix;return null},
 err:'نام پروژه را دقیق بگویید یا از کارت‌های پروژه انتخاب کنید.',
 cards:function(D){
  return PRJ.map(function(p,i){
    var con=D.role==='con';
    return '<div class="ccard"><div class="cthumb">'+ph('prj'+i,150,94,'')+'</div>'+
    '<div class="cb"><b>'+p.t+' — '+p.loc+'</b><small>'+p.area+' • '+p.dur+' • '+p.emp+' • '+fa(p.bids,0)+' پیشنهاد</small></div>'+
    '<div class="btns">'+
    (con?'<button class="btn btn-xs btn-primary" data-cba="bidPr" data-i="'+i+'">پیشنهاد</button>':'<button class="btn btn-xs btn-primary" data-cba="viewBids" data-i="'+i+'">پیشنهادات</button>')+
    '<button class="btn btn-xs" data-cba="pinfoPr" data-i="'+i+'">موضوعات</button>'+
    '<button class="btn btn-xs" data-cba="detPr" data-i="'+i+'">جزئیات</button></div></div>';
  }).join('')},
 chips:function(){return [[' ثبت پروژهٔ جدید','!np'],['جزئیات همه','!det']]},
 acts:{
  np:function(){ACT.nprj()},
  det:function(){
    PRJ.forEach(function(p){
      botC(' <b>'+p.t+'</b> — '+p.loc+'<br>• '+p.emp+'<br>• '+p.fl+' • '+p.area+'<br>• '+p.scope+'<br>• '+p.lic+'<br>• '+p.dur+' / '+p.start+'<br>• '+p.pre+' — '+p.pay+'<br>• ★'+p.score+' — '+p.hist+(p.warn?'<br> '+p.warn:''));
    });
    ceStep();
  }
 }},
{id:'bid',money:true,pre:function(D){return D.role==='con'},
 q:' قیمت پایهٔ پیشنهاد (تومان — تایپ کنید)؟',kind:'num',
 chips:function(){return [['۸ میلیارد','8000000000'],['۱۰ میلیارد','10000000000'],['۱۲ میلیارد','12000000000']]},
 set:function(D,v){D.bidAmt=+pd(v)||8000000000;return null}},
{id:'adj',pre:function(D){return D.role==='con'},
 q:' شرط تعدیل؟',chips:function(){return [['بدون تعدیل','none'],['نرخ رسمی مصالح (توصیه)','full'],['سقف ۱۰٪','cap10']]},set:function(D,v){D.adj=v;return null}},
{id:'send',pre:function(D){return D.role==='con'},
 q:function(D){
   var a=D.adj==='full'?'نرخ رسمی':(D.adj==='none'?'بدون تعدیل':'سقف ۱۰٪');
   return 'ارسال پیشنهاد به کارفرما: <b>'+rial(D.bidAmt)+'</b> • تعدیل: '+a+' (۲۰ کلید)؟'},
 chips:function(){return [['ارسال','!b']]},
 acts:{b:function(D){
   var i=D.prjI||0;
   if(!spend('bid','mkt','ارسال پیشنهاد '+PRJ[i].t))return;
   D.bid={prj:i,amt:D.bidAmt,dur:18,adj:D.adj};
   var rid=addReq('mkt','پیشنهاد','پیشنهاد برای '+PRJ[i].t,'در انتظار','قیمت: '+rial(D.bidAmt)+' • در انتظار تأیید کارفرما');
   save();if(CURRENT==='mkt')renderCurrent();
   var bidWfId=wd('mkt').id;
   setTimeout(function(){
     var d2=wfOf(bidWfId);if(!d2||d2.cancelled)return;
     if(d2.data.confirmed)return;
     d2.data.confirmed=true;
     if(rid)setReq(rid,'تأیید شد');
     save();botC('در شبیه‌سازی، کارفرما پیشنهاد پروژهٔ '+PRJ[d2.data.bid.prj].t+' را تأیید کرد؛ این واگذاری واقعی نیست.');
     if(CURRENT==='mkt'||CURRENT==='dash')renderCurrent();
   },3000);
   ceJump('st');
 }}},
{id:'st',q:function(D){
  if(D.role==='con'){
    if(!D.bid)return 'ابتدا پیشنهاد ثبت کنید.';
    return ' پیشنهاد شما برای <b>'+PRJ[D.bid.prj].t+'</b>: '+rial(D.bid.amt)+'<br>'+(D.confirmed?' کارفرما تأیید کرد — واگذار شد':' در انتظار تأیید کارفرما');
  }
  if(!D.chosen)return ' از کارت پروژه‌ها «پیشنهادات» را باز کنید و یک پیمانکار را تأیید کنید.';
  var b=BIDS[D.chosen.b];
  return ' پیمانکار انتخابی: '+b.n+' — '+rial(b.amt)+' • '+fa(b.dur,0)+' ماه<br> تأیید شد.';
 },
 chips:function(D){
  var c=[];
  if(D.role==='con'){c.push(D.confirmed?['گردش کار','!nx']:['بررسی وضعیت','!chk'])}
  else{c.push(D.chosen?['گردش کار','!nx']:['پیشنهادات','!bids'])}
  return c},
 acts:{
  chk:function(){ceStep()},
  nx:function(){ceJump('trk')},
  bids:function(D){ACT.mBids({getAttribute:function(k){return (k==='data-i')?(D.chosen?D.chosen.prj:(D.prjI||0)):null}})}
 }},
{id:'trk',q:function(D){
  var M=wd('mkt').data,B=wd('build').data;
  var prj=D.bid?D.bid.prj:(D.chosen?D.chosen.prj:0);
  if(!B.ph){B.ph=[100,80,40,0,0]}
  var tot=0,w=[12,34,22,18,14],q;
  for(q=0;q<5;q++){tot+=w[q]*B.ph[q]}
  tot=tot/100;
  var orders=(B.orders||[]).length;
  return ' <b>گردش کار '+PRJ[prj].t+':</b><br>• ثبت پروژه ✓<br>• تأیید پیمانکار '+((M.confirmed||M.chosen)?'✓':'—')+'<br>• تأمین '+(orders?('✓ '+fa(orders,0)+' سفارش'):'—')+'<br>• اجرا — '+fa(Math.round(tot),0)+'٪<br>• تحویل '+(wd('build').done?'✓':'—')+'<br>هر دو نقش این گردش را می‌بینند.';
 },
 chips:function(){return [['برو به ساخت و تأمین','F:build'],['پایان','!end']]},
 acts:{end:function(){
   var d=wd('mkt');
   if(!d.done){d.done=true;addReq('mkt','وضعیت','پایان فلو پروژه‌ها','کامل شد');save()}
   ceEnd();
 }}}
];
SCRIPTS.build=[
{id:'sup',pre:function(D){
  var M=wd('mkt').data;
  if(!(M.confirmed||M.chosen)){
    botC('ابتدا از فلو «پروژه‌ها» پروژه بگیرید:',[['برو به پروژه‌ها','F:mkt']]);
    return false;
  }
  return true},
 q:' ثبت سفارش تأمین (یک مورد کافی است)؟',
 chips:function(){
  var c=SUPS.map(function(s,i){return [s.t.split('—')[0],String(i)]});
  c.push(['بعداً — ادامه','!sk']);
  return c},
 set:function(D,v){
  var ix=/^\d+$/.test(String(v))?+v:supIndexFromText(v);
  if(ix<0)return 'ERR';
  if(!D.orders){D.orders=[]}
  D.orders.push({i:ix,q:'مقدار توافقی',d:'فردا'});
  addReq('build','تأمین','سفارش '+SUPS[ix].t,'در حال انجام','تحویل: فردا');
  save();if(CURRENT==='build')renderCurrent();return null},
 err:'نام کالا/خدمت تأمین را دقیق بگویید یا از دکمه‌ها انتخاب کنید.',
 acts:{sk:function(){ceJump('ph')}}},
{id:'ph',q:function(D){
  if(!D.ph){D.ph=[100,80,40,0,0]}
  return ' پیشرفت پروژه:'},
 chips:function(D){
  if(!D.ph){D.ph=[100,80,40,0,0]}
  var tot=0,w=[12,34,22,18,14],q;
  for(q=0;q<5;q++){tot+=w[q]*D.ph[q]}
  tot=tot/100;
  if(tot>=100)return [['تحویل پروژه ','!done']];
  return [['+۱۰٪','!p'],['همه را کامل کن','!all']];
 },
 acts:{
  p:function(D){
    if(!D.ph){D.ph=[100,80,40,0,0]}
    var i;
    for(i=0;i<5;i++){if(D.ph[i]<100){D.ph[i]=Math.min(100,D.ph[i]+10);break}}
    save();ceStep();
  },
  all:function(D){D.ph=[100,100,100,100,100];save();ceStep()},
  done:function(){ACT.pdone();ceEnd()}
 }}
];
SCRIPTS.stay=[
{id:'city',q:' نام شهر مقصد؟ (بنویسید)',kind:'text',
 chips:function(){return [['تهران','تهران'],['شیراز','شیراز'],['رامسر','رامسر'],['مشهد','مشهد']]},
 set:function(D,v){
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   D.city=v;return null}},
{id:'date',q:' تاریخ سفر؟ (متنی بنویسید)',kind:'text',
 chips:function(){return [['آخر هفته','آخر هفته'],['هفتهٔ بعد','هفتهٔ بعد'],['ماه آینده','ماه آینده']]},
 set:function(D,v){
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   D.date=v;return null}},
{id:'ppl',count:true,q:' تعداد مسافران؟ (عدد تایپ کنید)',kind:'num',
 chips:function(){return [['۱','1'],['۲','2'],['۳','3'],['۴','4'],['۵+','5']]},
 set:function(D,v){
   var n=+pd(v);
   if(!n||n<1)return 'ERR';
   D.ppl=n;return null}},
{id:'list',q:function(D){
  var items=stayList(D.city);
  return ' اقامتگاه‌های «'+esc(D.city)+'» برای '+fa(D.ppl,0)+' مسافر — '+esc(D.date||'')+' — انتخاب یا ☆ نشان کنید:'},
 set:function(D,v){var id=stayFromText(v);if(!id)return 'ERR';D.stay=id;return null},
 err:'نام اقامتگاه یا شهر را دقیق بنویسید یا از کارت‌ها انتخاب کنید.',
 cards:function(D){
  return stayList(D.city).map(function(s){return chatStayCard(s,D.stay===s.id,(D.savedS||[]).indexOf(s.id)>=0)}).join('')}, chips:function(D){
  var c=[];
  if((D.savedS||[]).length){c.push(['نشان‌شده‌ها','!saved'])}
  c.push(['همهٔ شهرها','!all'],['ادامه','!nx']);
  if(getPlaces().length)c.push(['فاصله‌ها','!dist']);
  return c},
 acts:{
  saved:function(D){botC('★ نشان‌شده‌ها:<div class="chcards">'+(D.savedS||[]).map(function(id){return chatStayCard(findS(id),D.stay===id,true)}).join('')+'</div>',[['رزرو','!nx']])},
  all:function(D){botC('همه:<div class="chcards">'+SLIST.map(function(s){return chatStayCard(s,D.stay===s.id,(D.savedS||[]).indexOf(s.id)>=0)}).join('')+'</div>',[['رزرو','!nx']])},
  dist:function(D){if(!D.stay){botC('اول یک اقامتگاه را انتخاب کنید.');return}var s=findS(D.stay);botC('<b>'+s.t+'</b>'+placesHTML(s.ll,8),[['نقشه','!map']])},
  map:function(){go('map')},
  nx:function(){if(!wd('stay').data.stay){botC('اول یک اقامتگاه «انتخاب» یا «☆ نشان» کنید.');return}ceJump('ngt')}
 }},
{id:'ngt',count:true,q:' چند شب؟ (عدد تایپ کنید)',kind:'num',
 chips:function(){return [['۳','3'],['۷','7'],['۱۰','10']]},
 set:function(D,v){D.nights=+pd(v)||5;return null}},
{id:'book',q:function(D){
  var s=findS(D.stay);
  return ' رزرو امانی '+fa(D.nights,0)+' شب × '+rial(s.p)+' = <b>'+rial(D.nights*s.p)+'</b> (۳۰ کلید)؟'},
 chips:function(){return [['پرداخت و رزرو','!b']]},
 acts:{b:function(D){
   var s=findS(D.stay);
   if(!spend('stay','stay','رزرو '+s.t))return;
   D.code=String(1000+Math.floor(Math.random()*9000));
   var rid=addReq('stay','رزرو','رزرو '+s.t+' — '+esc(D.city||''),'در انتظار','کد: '+D.code);
   save();
   setTimeout(function(){setReq(rid,'تأیید شد');botC(' میزبان تأیید کرد.')},2000);
   ceJump('chk');
 }}},
{id:'chk',q:function(D){return ' کد عبور شما (فعال از ۱۴:۰۰): <b>'+(D.code||'4821')+'#</b> — ورود انجام شد؟'},
 chips:function(){return [['ورود انجام شد','!c']]},
 acts:{c:function(D){
   D.checked=true;wd('stay').done=true;
   addReq('stay','ورود','ورود با کد','کامل شد');
   save();if(CURRENT==='stay')renderCurrent();ceJump('rev');
 }}},
{id:'rev',count:true,q:'★ امتیاز اقامت؟ (۱–۵)',chips:function(){return [['۱','1'],['۲','2'],['۳','3'],['۴','4'],['۵','5']]},set:function(D,v){RVS=+v;return null}},
{id:'revt',q:' نظر متنی‌تان را بنویسید:',kind:'text',
 set:function(D,v){
   if(!v.replace(/^\s+|\s+$/g,''))return 'ERR';
   S.reviews.unshift({n:S.auth.name,s:RVS,t:v});
   addReq('stay','نظر','ثبت نظر','کامل شد','★ '+fa(RVS,0));
   save();RVS=0;return null}}
];
var CBACT={};
CBACT.selH=function(el){var m=el.getAttribute('data-m'),D=wd(m).data;D.hood=el.getAttribute('data-h');save();if(CURRENT===MODBY[m].v)renderCurrent();botC('✓ محلهٔ '+findH(D.hood).n+' انتخاب شد:',[['برو به بازار','!next']])};
CBACT.hInfo=function(el){hoodInfoModal(el.getAttribute('data-h'))};
CBACT.hMap=function(el){ACT.hmap(el)};
CBACT.caddH=function(el){
  var m=el.getAttribute('data-m'),D=wd(m).data;
  if(!D.cmpH){D.cmpH=[]}
  var id=el.getAttribute('data-h'),i=D.cmpH.indexOf(id);
  if(i>=0){D.cmpH.splice(i,1)}else{
    if(D.cmpH.length>=3){toast('حداکثر ۳ محله');return}
    D.cmpH.push(id);
  }
  save();toast((i>=0?'حذف شد':'اضافه شد ('+fa(D.cmpH.length,0)+'/۳)'));
};
CBACT.selL=function(el){var D=wd('rent').data,x=findL(el.getAttribute('data-l'));if(!x||!E30.flowsAPI.rentPass(x,D)){toast('این آگهی با الزام‌های قطعی شما منطبق نیست؛ ابتدا فیلترها را آگاهانه اصلاح کنید.');return}D.listing=x.id;save();if(CURRENT==='rent')renderCurrent();botC('✓ انتخاب شد.',[['بازدید','!skp'],['مقایسه','!cmp']])};
CBACT.detL=function(el){
  var x=findL(el.getAttribute('data-l'));
  if(!spend('detail','rent','جزئیات '+x.t))return;
  botC(' <b>'+x.t+'</b> — '+findH(x.hood).n+'<br>• اجاره '+rial(x.rent)+' • رهن '+rial(x.dep)+'<br>• '+fa(x.m2,0)+' متر • '+fa(x.age,0)+' ساله • طبقهٔ '+fa(x.floor,0)+' • '+fa(x.beds,0)+' خواب<br>• '+esc(placeText(x.hood,2))+' • ★ '+fa(x.rate,1)+'<div class="qr"><button data-act="vtour" data-id="'+x.id+'">تور مجازی</button></div>',null);
};
CBACT.savL=function(el){var D=wd('rent').data;if(!D.saved){D.saved=[]}var id=el.getAttribute('data-l'),i=D.saved.indexOf(id);if(i>=0){D.saved.splice(i,1)}else{D.saved.push(id)}save();toast((i>=0?'حذف':'★ '+fa(D.saved.length,0)))};
CBACT.selB=function(el){var D=wd('buy').data,x=findB(el.getAttribute('data-l'));if(!x||!E30.flowsAPI.buyPass(x,D)){toast('این آگهی با سقف بودجه یا الزام‌های قطعی شما منطبق نیست؛ ابتدا محدودیت‌ها را اصلاح کنید.');return}D.blist=x.id;save();if(CURRENT==='buy')renderCurrent();botC('✓ انتخاب شد.',[['حقوقی','!skp']])};
CBACT.detB=function(el){
  var x=findB(el.getAttribute('data-l'));
  if(!spend('detail','buy','جزئیات '+x.t))return;
  botC(' <b>'+x.t+'</b> — '+findH(x.hood).n+'<br>• کل <b>'+rial(x.m2*x.ppm)+'</b> • هر متر '+rial(x.ppm)+' • '+fa(x.m2,0)+' متر • '+fa(x.age,0)+' ساله');
};
CBACT.savB=function(el){var D=wd('buy').data;if(!D.savedB){D.savedB=[]}var id=el.getAttribute('data-l'),i=D.savedB.indexOf(id);if(i>=0){D.savedB.splice(i,1)}else{D.savedB.push(id)}save();toast((i>=0?'حذف':'★ '+fa(D.savedB.length,0)))};
CBACT.bidPr=function(el){
  var D=wd('mkt').data;
  D.prjI=+el.getAttribute('data-i');save();
  var p=PRJ[D.prjI];
  botC(' <b>'+p.t+'</b><br>• '+p.loc+' • '+p.fl+' • '+p.area+'<br>• '+p.lic+'<br>• '+p.pre+' — '+p.pay+'<br>• ★'+p.score+' — '+p.hist,[['ثبت پیشنهاد','!nx']]);
};
CBACT.detPr=function(el){
  var p=PRJ[+el.getAttribute('data-i')];
  botC(' <b>'+p.t+'</b> — '+p.loc+'<br>• '+p.emp+'<br>• '+p.fl+' • '+p.area+'<br>• '+p.scope+'<br>• '+p.lic+'<br>• '+p.dur+' / '+p.start+'<br>• '+p.pay+'<br>• ★'+p.score+' — '+p.hist);
};
CBACT.pinfoPr=function(el){openProjectInfoModal(+el.getAttribute('data-i'))};
CBACT.viewBids=function(el){ACT.mBids(el)};
CBACT.selS=function(el){var D=wd('stay').data;D.stay=el.getAttribute('data-l');save();if(CURRENT==='stay')renderCurrent();botC('✓ انتخاب شد.',[['رزرو','!nx']])};
CBACT.savS=function(el){var D=wd('stay').data;if(!D.savedS){D.savedS=[]}var id=el.getAttribute('data-l'),i=D.savedS.indexOf(id);if(i>=0){D.savedS.splice(i,1)}else{D.savedS.push(id)}save();toast((i>=0?'حذف':'★ '+fa(D.savedS.length,0)))};
CBACT.detS=function(el){
  var s=findS(el.getAttribute('data-l'));
  botC(' <b>'+s.t+'</b> — '+s.city+'<br>• هر شب: <b>'+rial(s.p)+'</b><br>• امکانات: '+s.amens.join('، ')+'<br>• قوانین: '+s.rules.join('؛ ')+'<br>• دسترسی: '+s.acc+'<br>• نظرات: '+s.revs.map(function(r){return '«'+r.t+'» ★'+fa(r.s,0)}).join(' | '));
};
CBACT.vcT=function(el){
  var D=wd('rent').data;
  defVlist(D);
  var i=+el.getAttribute('data-i');
  if(D.vlist[i]){D.vlist[i].ok=!D.vlist[i].ok;save()}
  if(CE.f==='rent'){ceStep()}
  if(CURRENT==='rent'){renderCurrent()}
};
var CBT={};
CBT.tok=function(){
  var neg=0;
  S.log.forEach(function(l){if(l.c<0)neg++});
  botC('موجودی: <b>'+fa(S.tokens,0)+'</b> — '+fa(neg,0)+' مصرف<br> کیف پول: <b>'+rial(S.wallet||0)+'</b>',[['بستهٔ کلید','F:sub'],['کیف پول','F:wallet'],['منو','!menu']]);
};

