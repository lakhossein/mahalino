/* ═══ ۸.۷) لایهٔ هوش گفت‌وگو (V0.20) — نیت، زمینه، سناریو، نمایش ═══
   همه‌چیز محلی است: دادهٔ نمونهٔ سامانه + قواعد؛ هیچ ادعای اتصال به مدل زبانی یا سرور وجود ندارد. */
var CTX={hood:null,budg:null,dep:null,rent:null,beds:null,persona:null,city:null,lastIntent:null,pending:null};
function ctxReset(){CTX.hood=null;CTX.budg=null;CTX.dep=null;CTX.rent=null;CTX.beds=null;CTX.persona=null;CTX.city=null;CTX.lastIntent=null;CTX.pending=null}
function ctxFromStep(f,st,D){
  try{
    if(f==='rent'&&D){
      if(D.B){if(D.B.depB)CTX.dep=D.B.depB;if(D.B.rentB)CTX.rent=D.B.rentB}
      if(D.P){if(D.P.beds)CTX.beds=D.P.beds;CTX.persona=D.P.persona||null}
      if(D.hood)CTX.hood=D.hood;
    }else if(f==='buy'&&D){
      if(D.budg)CTX.budg=D.budg;
      if(D.hood)CTX.hood=D.hood;
      if(D.PR&&D.PR.beds)CTX.beds=D.PR.beds;
    }else if(f==='stay'&&D&&D.city){CTX.city=D.city}
  }catch(e){}
}
/* ── نمایش‌سازها ── */
function rShort(v){v=(+v||0)/10;if(v>=1e9)return fa(v/1e9,1)+' میلیارد';if(v>=1e6)return fa(v/1e6,0)+' میلیون';return fa(v,0)}
function rcard(t,v,sub,cls,full){return '<div class="rcard'+(full?' full':'')+'"><small>'+esc(t)+'</small><span class="rv '+(cls||'')+'">'+v+'</span>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</div>'}
function rcards(a){return '<div class="rcards">'+a.join('')+'</div>'}
function rcNote(t){return '<div class="rnote">'+t+'</div>'}
function rcActs(a){if(!a||!a.length)return '';return '<div class="racts">'+a.map(function(x){return '<button class="qbtn'+(x.p?' primary':'')+'" '+x.a+'>'+x.l+'</button>'}).join('')+'</div>'}
function rcProg(steps,cur){return '<div class="rprog">'+steps.map(function(s,i){var c=i<cur?'done':(i===cur?'cur':'');return '<span class="'+c+'">'+(i<cur?'✓ ':'')+esc(s)+'</span>'}).join('')+'</div>'}
function rcTable(heads,rows,curIx){
  var h='<table class="rtbl" data-dir="asc"><thead><tr>';
  heads.forEach(function(x,i){h+='<th data-cba="sortTbl" data-i="'+i+'" title="برای مرتب‌سازی کلیک کنید">'+esc(x)+'<span class="sarr"></span></th>'});
  h+='</tr></thead><tbody>';
  rows.forEach(function(r,ix){
    h+='<tr'+(ix===curIx?' class="cur"':'')+'>';
    r.forEach(function(c,i){h+='<td data-v="'+qesc(c.v!==undefined?c.v:String(c.h).replace(/<[^>]*>/g,''))+'"'+(i===0?' style="text-align:right"':'')+'>'+c.h+'</td>'});
    h+='</tr>';
  });
  return h+'</tbody></table><div class="rnote">برای مرتب‌سازی، روی عنوان ستون بزنید.</div>';
}
function rcLine(title,sub,vals,labels,note){
  var w=320,hgt=118,padT=10,padB=16,padX=8,i,pts=[];
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);if(mx===mn)mx=mn+1;
  for(i=0;i<vals.length;i++){
    pts.push([Math.round((padX+(w-2*padX)*(i/(vals.length-1)))*10)/10,
              Math.round((padT+(hgt-padT-padB)*(1-(vals[i]-mn)/(mx-mn)))*10)/10]);
  }
  var pl=pts.map(function(p){return p[0]+','+p[1]}).join(' ');
  var d='M'+pts.map(function(p){return p[0]+' '+p[1]}).join(' L');
  var grid='',g;
  for(g=0;g<3;g++){var gy=padT+(hgt-padT-padB)*g/2;grid+='<line class="cg" x1="'+padX+'" y1="'+gy+'" x2="'+(w-padX)+'" y2="'+gy+'"/>'}
  var lab=[0,Math.floor(vals.length/2),vals.length-1].map(function(ix){return '<text class="cl" x="'+pts[ix][0]+'" y="'+(hgt-4)+'" text-anchor="middle">'+esc(labels[ix])+'</text>'}).join('');
  var last=pts[pts.length-1];
  return '<div class="rchartbox"><div class="rct"><span>'+esc(title)+'</span><small>'+esc(sub)+'</small></div>'+
  '<svg class="chart" viewBox="0 0 '+w+' '+hgt+'" role="img" aria-label="'+esc(title)+'">'+grid+
  '<path class="carea" d="'+d+' L'+last[0]+' '+(hgt-padB)+' L'+pts[0][0]+' '+(hgt-padB)+' Z"/>'+
  '<polyline class="cline" fill="none" points="'+pl+'"/>'+
  '<circle class="cp" cx="'+last[0]+'" cy="'+last[1]+'" r="3.2"/>'+lab+
  '<text class="cl" x="'+(w-padX)+'" y="'+(padT+7)+'" text-anchor="end">'+rShort(mx)+'</text>'+
  '<text class="cl" x="'+(w-padX)+'" y="'+(hgt-padB)+'" text-anchor="end">'+rShort(mn)+'</text></svg>'+
  (note?rcNote(note):'')+'</div>';
}
function rcBars(title,items,note){
  var mx=0;items.forEach(function(x){if(x.v>mx)mx=x.v});
  var h='<div class="rchartbox"><div class="rct"><span>'+esc(title)+'</span></div>';
  items.forEach(function(x){
    h+='<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;font-size:11px;gap:8px"><span style="font-weight:700'+(x.cur?';color:var(--brand-ink)':'')+'">'+esc(x.l)+(x.cur?' ←':'')+'</span><span style="direction:ltr;color:var(--ink2);font-weight:700">'+x.fmt+'</span></div><div class="rbar'+(x.hi?' hi':'')+'"><i style="width:'+Math.max(3,Math.round(x.v/mx*100))+'%"></i></div></div>';
  });
  return h+(note?rcNote(note):'')+'</div>';
}
function rcDonut(title,parts,note){
  var tot=0;parts.forEach(function(p){tot+=p.v});
  var R=34,C=2*Math.PI*R,off=0;
  var cols=['#0f766e','#0d9488','#5eead4','#b45309','#94a3b8','#334155'];
  var segs='',leg='';
  parts.forEach(function(p,i){
    var frac=tot?p.v/tot:0,len=frac*C;
    segs+='<circle r="'+R+'" cx="45" cy="45" fill="none" stroke="'+cols[i%cols.length]+'" stroke-width="13" stroke-dasharray="'+len.toFixed(2)+' '+(C-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 45 45)"/>';
    off+=len;
    leg+='<span><i style="background:'+cols[i%cols.length]+'"></i>'+esc(p.l)+' — '+fa(p.v,0)+' مورد ('+fa(frac*100,0)+'٪)</span>';
  });
  return '<div class="rchartbox"><div class="rct"><span>'+esc(title)+'</span></div>'+
  '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label="'+esc(title)+'">'+segs+'</svg><div class="rlegend" style="flex-direction:column;align-items:flex-start;gap:3px">'+leg+'</div></div>'+
  (note?rcNote(note):'')+'</div>';
}
/* ── کمکی‌های زمینه ── */
function hoodsIn(t){
  var q=normFa(t).replace(/s+/g,''),out=[],i;
  if(!q)return out;
  for(i=0;i<HOODS.length;i++){
    var n=normFa(HOODS[i].n).replace(/s+/g,'');
    if(q.indexOf(n)>=0||(n.indexOf(q)>=0&&q.length>=3))out.push(HOODS[i]);
  }
  return out;
}
function trendSeries(base,yoy,seed){
  var start=base/(1+(+yoy||0)/100),out=[],i,sv=0,s=String(seed||'x');
  for(var k=0;k<s.length;k++){sv=(sv*31+s.charCodeAt(k))%997}
  for(i=0;i<12;i++){
    var t=i/11,j=Math.sin(sv+i*29)*0.008;
    var v=(start+(base-start)*t)*(1+j);
    out.push(Math.round(v/1e6)*1e6);
  }
  out[11]=base;return out;
}
function ctxP(){var o={};defP(o);var D=wfData('rent');return (D&&D.P)?D.P:o.P}
function monthLabels(){var out=[],i;for(i=11;i>=0;i--){var d=new Date(Date.now()-i*30*864e5);out.push(dt(d.getTime()))}return out}
function hoodChipsAct(prefix){return HOODS.slice(0,6).map(function(h){return {l:h.n,a:'data-cq="'+prefix+' '+h.n+'"'}})}
/* ── حالت «در حال بررسی» — فقط برای ترکیب واقعی نتیجه؛ بدون انیمیشن تزئینی ── */
function rThink(label,fn){
  HIST.push({r:'bot',h:'<span class="typing"><span class="dots"><i></i><i></i><i></i></span>'+esc(label)+'</span>',proc:true});
  cr();
  setTimeout(function(){HIST=HIST.filter(function(m){return !m.proc});try{fn()}catch(e){botC('در ساختن پاسخ مشکلی پیش آمد؛ دوباره تلاش کنید.')}},700);
}
/* ── موتور نیت ── */
var RINT={};
RINT.has=function(t){for(var i=0;i<arguments.length;i++){if(String(t).indexOf(arguments[i])>=0)return true}return false};
RINT.moneyOf=function(q){var m=normFa(q).match(/[0-9][0-9.,]* (میلیارد|میلیون|هزار)/);return m?m[0]:null};
RINT.modOf=function(q){
  if(/تضمینی/.test(q))return 'grt';
  if(/اجاره/.test(q))return 'rent';
  if(/خرید|مبایعه|فروش/.test(q))return 'buy';
  if(/اقامت|رزرو|سفر/.test(q))return 'stay';
  if(/پروژه/.test(q))return 'mkt';
  if(/ساخت|تأمین|تامین/.test(q))return 'build';
  if(/سرمایه|درآمد/.test(q))return 'invr';
  if(/خدمات|نظافت|تعمیر/.test(q))return 'svc';
  return null;
};
RINT.topicsHTML=function(){
  return rcActs([
    {l:'اجاره',a:'data-cf="rent"',p:1},
    {l:'خرید',a:'data-cf="buy"'},
    {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'},
    {l:'مقایسهٔ محله‌ها',a:'data-cq="مقایسه سعادت‌آباد و پونک"'},
    {l:'اجارهٔ تضمینی',a:'data-view="grt"'},
    {l:'ادامهٔ کارها',a:'data-cq="کارهای نیمه‌تمام من"'}
  ]);
};
RINT.route=function(t){
  var q=normFa(t),raw=String(t||'');
  /* احوال‌پرسی */
  if(/^سلام/.test(q)||/^(درود|هی|hello|hi)/.test(q)){RINT.scGreet();return true}
  if(/ممنون|مرسی|سپاس|متشکر/.test(q)){botC('خواهش می‌کنم! کار دیگری هم دارید؟'+RINT.topicsHTML(),null);return true}
  /* ادامهٔ کارهای نیمه‌تمام */
  if(/نیمه.?تمام|کجا بودم|از سر بگیر|ادامهٔ کار|ادامه کار/.test(q)){RINT.scContinue();return true}
  /* مقایسه (قبل از بازار تا «مقایسهٔ بازار» گم نشود) */
  if(/مقایسه|کدوم بهتر|کدام بهتر/.test(q)){RINT.scCompare(q);return true}
  /* راهنمای فرایندها */
  if(/چطور|چگونه|مراحل|فرایند|فرآیند/.test(q)){var gm=RINT.modOf(q);if(gm){RINT.scGuide(gm);return true}}
  /* اجارهٔ تضمینی — پرسش توضیحی (قبل از مسیرهای قدیمی) */
  if(/تضمینی/.test(q)&&/چیه|چیست|یعنی|توضیح|تفاوت|مزایا|چطور/.test(q)){RINT.scGrtInfo(q);return true}
  /* توضیح مفاهیم و نتایج */
  if(/یعنی چی|یعنی چه|بر اساس چی|چرا|توضیح بده|چطور حساب/.test(q)){if(RINT.scExplain(q))return true}
  /* بازار و قیمت‌ها */
  if(/بازار|روند|تورم|میانگین|قیمت|آمار|امتیاز محله/.test(q)){RINT.scMarket(q);return true}
  /* توان خرید / اجاره با رهن — فقط با مبلغ */
  var hasMoney=/[۰-۹0-9]/.test(q)&&/میلیارد|میلیون|هزار/.test(q);
  if(hasMoney&&/بخرم|بتونم|می توانم|چند متر|توان خرید/.test(q)){RINT.scAfford(raw,q);return true}
  if(hasMoney&&/(رهن|ودیعه)/.test(q)&&/اجاره/.test(q)){RINT.scRentAfford(raw,q);return true}
  /* خارج از قابلیت‌های این نسخه */
  if(/(^|[^خ])وام|مقرضه|بیمه|مالیات بر|ثبت سند|دفترخانه/.test(q)){RINT.scOOS(q);return true}
  return false;
};
RINT.scGreet=function(){
  var open=S.reqs.filter(reqOpen).length,run=wfRunning().length;
  botC('سلام! من دستیار محلینو هستم — از نیازسنجی تا نتیجه همراهتان هستم.'+
  rcards([
    rcard('درخواست‌های جاری',fa(open,0)+' مورد',open?'از داشبورد قابل پیگیری است':''),
    rcard('فلوی نیمه‌تمام',fa(run,0)+' مورد',run?'می‌توانیم همین‌جا ادامه دهیم':'')
  ])+
  '<div class="note" style="margin-top:8px">چه کاری؟ مثلاً بنویسید «بازار سعادت‌آباد»، «با ۳ میلیارد کجا می‌توانم بخرم؟» یا «مقایسه پونک و نارمک».</div>'+
  RINT.topicsHTML(),null);
};
RINT.scContinue=function(){
  var runs=wfRunning();
  if(!runs.length){
    botC('فعلاً فلو یا درخواست نیمه‌تمامی ندارید. یک مسیر تازه شروع کنیم؟'+RINT.topicsHTML(),null);
    return;
  }
  var cards=runs.slice(0,4).map(function(w){
    var steps=WSTEPS[w.m]||[];
    return '<div class="rcard full"><small>'+esc(wfName(w))+'</small><span class="rv">'+esc(wfState(w).t)+'</span>'+
    rcProg(steps,Math.min(w.step-1,steps.length-1))+
    '<div class="racts"><button class="qbtn primary" data-act="resume" data-m="'+w.m+'" data-wf="'+w.id+'">ادامه</button><button class="qbtn" data-act="dt" data-t="req" data-cat="'+w.m+'">درخواست‌ها</button></div></div>';
  });
  botC('این کارها نیمه‌تمام مانده — از همین‌جا ادامه دهید:'+rcards(cards),null);
};
RINT.scGuide=function(m){
  var steps=WSTEPS[m]||[],d=wd(m),cur=d?Math.min(d.step-1,steps.length-1):0;
  var guard=d?guardOK(m):null;
  var v=MODBY[m]?MODBY[m].v:null;
  var scripted=!!SCRIPTS[m];
  var acts=[];
  if(v&&scripted)acts.push({l:'ادامه در همین گفت‌وگو',a:'data-cf="'+m+'"',p:1});
  if(v&&!scripted)acts.push({l:'رفتن به صفحهٔ اختصاصی',a:'data-view="'+v+'"',p:1});
  acts.push({l:'درخواست‌های این مسیر',a:'data-act="dt" data-t="req" data-cat="'+(m==='invest'?'invr':m)+'"'});
  if(m==='grt')acts.push({l:'توضیح اجارهٔ تضمینی',a:'data-cq="اجاره تضمینی چیست؟"'});
  botC('مسیر «'+esc(MODBY[m]?MODBY[m].t:m)+'» '+fa(steps.length,0)+' مرحله دارد. وضعیت فعلی شما:'+
  rcProg(steps,cur)+
  (guard?rcNote('برای ادامه: '+esc(guard)):rcNote('همهٔ مراحل کامل شده — می‌توانید فلوی جدیدی شروع کنید.'))+
  rcActs(acts),null);
};
RINT.scGrtInfo=function(q){
  var inc=GRT_INCLUDED.slice(0,4);
  var body;
  if(/تفاوت/.test(q)){
    body='تفاوت در یک نگاه:'+
    rcTable(['','اجارهٔ معمولی','اجارهٔ تضمینی'],[
      [{h:'یافتن مستأجر',v:'یافتن مستأجر'},{h:'با خودتان',v:'با خودتان'},{h:'محلینو غربال می‌کند',v:'محلینو غربال می‌کند'}],
      [{h:'دریافت اجاره‌بها',v:'دریافت اجاره‌بها'},{h:'مستقیم از مستأجر',v:'مستقیم از مستأجر'},{h:'تضمین با کارمزد ۷٪',v:'تضمین با کارمزد ۷٪'}],
      [{h:'مدیریت تعمیرات',v:'مدیریت تعمیرات'},{h:'با خودتان',v:'با خودتان'},{h:'از داخل سامانه',v:'از داخل سامانه'}]
    ])+
    rcNote('کارمزد مدیریت '+fa(GRT_MGMT_PCT,0)+'٪ اجارهٔ ماهانه است؛ اتصال به ارائه‌دهندهٔ واقعی در این نسخه نمایشی است.');
  }else{
    body='«اجارهٔ تضمینی» یعنی واگذاری مدیریت اجارهٔ ملک به محلینو؛ ما مستأجر را می‌یابیم، قرارداد را می‌بندیم و اجاره‌بها را — با کارمزد '+fa(GRT_MGMT_PCT,0)+'٪ — تضمین‌شده به حساب شما واریز می‌کنیم. از جمله:'+
    '<ul style="margin:8px 0 2px;padding-inline-start:18px;font-size:12.3px;line-height:2">'+inc.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
    rcProg(WSTEPS.grt,0);
  }
  botC(body+rcActs([
    {l:'شروع اجارهٔ تضمینی (همراه در گفت‌وگو)',a:'data-cba="grtGuided"',p:1},
    {l:'اجارهٔ معمولی',a:'data-cf="rent"'},
    {l:'تفاوت با اجارهٔ معمولی',a:'data-cq="تفاوت اجاره تضمینی با اجاره معمولی چیست؟"'}
  ]),null);
};
RINT.scExplain=function(q){
  if(/امتیاز تطبیق/.test(q)){
    var h=CTX.hood?findH(CTX.hood):null;
    botC('امتیاز تطبیق فقط از عوامل قابل اندازه‌گیری و اولویت‌های شخصی شما ساخته می‌شود — «کیفیت کلی محله» یا رتبهٔ رسمی نیست.'+
    (h?rcards([
      rcard('مترو',esc(factorData(h,'metro'))),
      rcard('مدرسه',esc(factorData(h,'school'))),
      rcard('محل کار',esc(factorData(h,'work')),null,null,true)
    ]):'')+
    rcNote('عوامل: دسترسی مترو، فاصلهٔ مدرسه، فاصلهٔ محل کار (اگر ثبت شده) و اولویت‌های دستی شما.'));
    return true;
  }
  if(/هوایی|فاصله/.test(q)){
    botC('فاصله‌ها «خط مستقیم (هوایی)» از مرکز محله‌اند — نه زمان یا مسیر رانندگی/پیاده.'+rcNote('منبع: OpenStreetMap / Overpass؛ ترافیک و زمان واقعی در این نسخه محاسبه نمی‌شود.'),null);
    return true;
  }
  if(/آگهی|معامله/.test(q)){
    botC('قیمت‌های سامانه «میانگین پیشنهادی آگهی‌ها» در تاریخ داده‌اند — قیمت معاملهٔ قطعی نیستند.'+rcNote('منبع آمار: کیلید؛ برای تصمیم، استعلام و بازدید رسمی لازم است.'),null);
    return true;
  }
  if(/کلید/.test(q)){
    botC('کلید واحد استفاده از خدمات سامانه است؛ تعرفهٔ فعلی:'+
    rcTable(['خدمت','کلید'],Object.keys(COSTS).map(function(k){return [{h:esc(COSTL[k]||k),v:COSTL[k]||k},{h:fa(COSTS[k],0),v:COSTS[k]}]}))+
    rcNote('خرید کلید از بخش «اشتراک و کلید» حساب کاربری.'+rcActs([{l:'اشتراک و کلید',a:'data-act="account" data-tab="plan"'}])),null);
    return true;
  }
  return false;
};
RINT.scMarket=function(q){
  var hs=hoodsIn(q),h=null;
  if(hs.length===1)h=hs[0];
  else if(hs.length>1){RINT.scCompare(q);return}
  else if(CTX.hood)h=findH(CTX.hood);
  else{var D=wfData('rent');if(D&&D.hood)h=findH(D.hood)}
  if(/امتیاز محله/.test(q)&&!hs.length){RINT.scScores();return}
  if(/همهٔ محله|محله‌ها/.test(q)&&!hs.length){RINT.scCompareAll();return}
  if(!h){
    CTX.pending='market';
    botC('برای کدام محله؟ نامش را بنویسید یا انتخاب کنید:'+rcActs(hoodChipsAct('بازار'))+rcNote('پاسخ‌ها بر پایهٔ دادهٔ نمونهٔ سامانه است؛ منبع قیمت: کیلید.'),null);
    return;
  }
  CTX.hood=h.id;CTX.pending=null;CTX.lastIntent='market';
  var rentMode=/اجاره|رهن/.test(q);
  rThink('در حال مرور دادهٔ بازار «'+h.n+'»…',function(){
    var m=h.mkt;
    if(rentMode){
      botC('بازار اجارهٔ «'+esc(h.n)+'» — نمایش تصویری:'+
      E27.marketHTML({h:h.id,mode:'rent',period:12})+
      rcActs([
        {l:'شروع فلوی اجاره',a:'data-cf="rent"',p:1},
        {l:'بازار خرید این محله',a:'data-cq="بازار خرید '+h.n+'"'},
        {l:'توزیع آگهی‌ها',a:'data-cq="توزیع آگهی‌های '+h.n+'"'}
      ]),null);
    }else{
      botC('بازار «'+esc(h.n)+'» — قیمت پیشنهادی آگهی‌ها، نه معاملهٔ قطعی:'+
      E27.marketHTML({h:h.id,mode:'buy',period:12})+
      rcActs([
        {l:'مقایسه با محلهٔ دیگر',a:'data-cq="مقایسه '+h.n+' و پونک"',p:1},
        {l:'شروع فلوی خرید',a:'data-cf="buy"'},
        {l:'امتیاز محله‌ها برای من',a:'data-cq="امتیاز محله‌ها"'}
      ]),null);
    }
  });
};
RINT.scScores=function(){
  rThink('در حال امتیازدهی محله‌ها بر اساس اولویت‌های شما…',function(){
    var P=ctxP();
    var items=HOODS.map(function(h){return {l:h.n,v:hoodScore(h,P),fmt:'٪'+fa(hoodScore(h,P),0),cur:CTX.hood===h.id}}).sort(function(a,b){return b.v-a.v});
    botC('امتیاز تطبیق محله‌ها با اولویت‌های فعلی شما (مترو، مدرسه، محل کار و اولویت‌های دستی):'+
    rcBars('امتیاز تطبیق',items)+
    rcNote('این امتیاز «کیفیت کلی محله» یا رتبهٔ رسمی نیست؛ فقط عوامل قابل اندازه‌گیری و اولویت‌های شماست.')+
    rcActs([{l:'بازار محلهٔ برتر',a:'data-cq="بازار '+items[0].l+'"',p:1},{l:'شروع اجاره',a:'data-cf="rent"'}]),null);
  });
};
RINT.scCompareAll=function(){
  rThink('در حال جمع‌بندی بازار محله‌ها…',function(){
    var bars=HOODS.map(function(x){return {l:x.n,v:x.buyBase,fmt:rShort(x.buyBase)+' ریال'}}).sort(function(a,b){return b.v-a.v});
    botC('نمای کلی بازار محله‌ها — میانگین پیشنهادی هر متر (آگهی، نه معامله):'+
    rcBars('میانگین هر متر',bars)+
    rcTable(['محله','هر متر','بازهٔ آگهی','تغییر سال'],HOODS.map(function(h){return [
      {h:esc(h.n),v:h.n},
      {h:rial(h.buyBase),v:h.buyBase},
      {h:rShort(h.mkt.low)+' – '+rShort(h.mkt.high),v:h.mkt.low},
      {h:pct(h.mkt.yoy),v:h.mkt.yoy}
    ]}))+
    rcNote('منبع: کیلید — '+esc(MARKET.asOf)+'؛ دادهٔ نمونهٔ سامانه.')+
    rcActs([{l:'بازار محلهٔ اول',a:'data-cq="بازار '+bars[0].l+'"',p:1},{l:'مقایسهٔ دو محله',a:'data-cq="مقایسه سعادت‌آباد و پونک"'}]),null);
  });
};
RINT.scCompare=function(q){
  var hs=hoodsIn(q);
  if(hs.length<2&&CTX.hood){
    var c0=findH(CTX.hood);
    if(!hs.length||hs[0].id!==c0.id)hs.unshift(c0);
  }
  hs=hs.filter(function(h,i,a){return a.findIndex(function(x){return x.id===h.id})===i});
  if(hs.length<2){
    botC('دو محله را نام ببرید؛ مثلاً «مقایسه سعادت‌آباد و پونک». یا دو محله را انتخاب کنید:'+rcActs(hoodChipsAct('مقایسه')),null);
    return;
  }
  var a=hs[0],b=hs[1];
  CTX.hood=a.id;CTX.lastIntent='compare';
  rThink('در حال مقایسهٔ «'+a.n+'» و «'+b.n+'»…',function(){
    var rows=[a,b].map(function(h){var o=OSM[h.id]&&OSM[h.id].cats||{};return [
      {h:'<b>'+esc(h.n)+'</b>',v:h.n},
      {h:rial(h.buyBase),v:h.buyBase},
      {h:rShort(h.mkt.low)+' – '+rShort(h.mkt.high),v:h.mkt.low},
      {h:o.metro?placeDistText(o.metro.km):'—',v:o.metro?o.metro.km:9e9},
      {h:o.edu?placeDistText(o.edu.km):'—',v:o.edu?o.edu.km:9e9},
      {h:o.park?fa(o.park.n,0)+' مکان':'—',v:o.park?o.park.n:0},
      {h:rial(h.avgRent),v:h.avgRent}
    ]});
    var fit='';
    if(CTX.budg){var ma=Math.round(CTX.budg/a.buyBase),mb=Math.round(CTX.budg/b.buyBase);fit=rcNote('با بودجهٔ ثبت‌شدهٔ شما ('+rial(CTX.budg)+'): حدود '+fa(ma,0)+' متر در '+esc(a.n)+' یا '+fa(mb,0)+' متر در '+esc(b.n)+' — بر پایهٔ قیمت آگهی.')}
    else if(CTX.rent){fit=rcNote('با سقف اجارهٔ شما ('+rial(CTX.rent)+'): '+esc(a.n)+' '+rial(a.avgRent)+' / '+esc(b.n)+' '+rial(b.avgRent)+' — نمونهٔ مقایسه‌ای.')}
    botC('مقایسهٔ «'+esc(a.n)+'» و «'+esc(b.n)+'» — روی عنوان ستون‌ها بزنید تا مرتب شود:'+
    rcTable(['محله','هر متر (آگهی)','بازه','مترو','مدرسه','پارک','اجارهٔ نمونه'],rows)+
    rcBars('هر متر (آگهی)',[{l:a.n,v:a.buyBase,fmt:rShort(a.buyBase)},{l:b.n,v:b.buyBase,fmt:rShort(b.buyBase)}])+
    fit+
    rcNote('قیمت‌ها میانگین آگهی این تاریخ‌اند، نه معاملهٔ قطعی؛ منبع: کیلید و OpenStreetMap.')+
    rcActs([
      {l:'بازار '+a.n,a:'data-cq="بازار '+a.n+'"',p:1},
      {l:'بازار '+b.n,a:'data-cq="بازار '+b.n+'"'},
      {l:'شروع خرید',a:'data-cf="buy"'}
    ]),null);
  });
};
RINT.scAfford=function(raw,q){
  var mx=RINT.moneyOf(q||raw);
  var pm=parseMoneyFA(mx||raw);
  if(!pm.ok){botC(pm.msg+'<br>مثلاً بنویسید: «با ۳ میلیارد کجا می‌توانم بخرم؟»',null);return}
  CTX.budg=pm.value;CTX.lastIntent='afford';
  rThink('در حال محاسبهٔ توان خرید…',function(){
    var items=HOODS.map(function(h){return {l:h.n,v:Math.round(CTX.budg/h.buyBase),fmt:fa(Math.round(CTX.budg/h.buyBase),0)+' متر',cur:h.id===(CTX.hood||'')}}).sort(function(a,b){return b.v-a.v});
    botC('با بودجهٔ '+rial(CTX.budg)+' — بر پایهٔ میانگین آگهی هر محله:'+
    rcBars('حدود متراژ قابل خرید',items)+
    rcards([rcard('بیشترین متراژ',items[0].fmt+' — '+esc(items[0].l),'بر اساس میانگین آگهی')])+
    rcNote('قیمت پیشنهادی آگهی‌اند، نه معاملهٔ قطعی؛ برای ۴۰ متر حداقل، بودجه باید کفایتی هر محله را داشته باشد. بودجه در این گفت‌وگو ذخیره شد.')+
    rcActs([
      {l:'شروع فلوی خرید با همین بودجه',a:'data-cf="buy"',p:1},
      {l:'بازار '+items[0].l,a:'data-cq="بازار '+items[0].l+'"'},
      {l:'مقایسهٔ دو محله',a:'data-cq="مقایسه '+items[0].l+' و '+items[1].l+'"'},
    ]),null);
  });
};
RINT.scRentAfford=function(raw,q){
  var mx=RINT.moneyOf(q||raw);
  var pm=parseMoneyFA(mx||raw);
  if(!pm.ok){botC(pm.msg+'<br>مثلاً بنویسید: «رهن ۱۰ میلیارد، اجاره چقدر می‌شود؟»',null);return}
  CTX.dep=pm.value;CTX.lastIntent='rentafford';
  rThink('در حال برآورد اجارهٔ متناظر…',function(){
    var rent=Math.round(CTX.dep*0.03);
    var bars=HOODS.map(function(h){return {l:h.n,v:h.avgRent,fmt:rShort(h.avgRent)+' ریال',hi:h.avgRent>rent,cur:h.avgRent<=rent&&h.avgRent>=HOODS.reduce(function(m,x){return x.avgRent<=rent&&x.avgRent>m?x.avgRent:m},0)}}).sort(function(a,b){return b.v-a.v});
    botC('با ودیعهٔ '+rial(CTX.dep)+' و نرخ فرضی «۳٪ در ماه»، اجارهٔ متناظر حدود <b>'+rial(rent)+'</b> است.'+
    rcBars('اجارهٔ نمونهٔ محله‌ها در برابر سقف شما',bars)+
    rcNote('این نرخ بازار نیست؛ مبنای مقایسهٔ داخلی است و باید با توافق طرفین جایگزین شود. ودیعه در این گفت‌وگو ذخیره شد.')+
    rcActs([
      {l:'شروع فلوی اجاره با همین ودیعه',a:'data-cf="rent"',p:1},
      {l:'بازار اجارهٔ محله‌ها',a:'data-cq="بازار اجاره سعادت‌آباد"'}
    ]),null);
  });
};
RINT.scOOS=function(q){
  if(/(^|[^خ])وام|مقرضه/.test(q)){
    botC('محاسبهٔ وام و مقرضه در این نسخهٔ محلینو وجود ندارد و نمی‌خواهم عددی از خودم بسازم. نزدیک‌ترین ابزارهای موجود:'+
    rcActs([
      {l:'توان خرید بر اساس بودجه',a:'data-cq="با ۳ میلیارد کجا می‌توانم بخرم؟"',p:1},
      {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'},
      {l:'شروع فلوی خرید',a:'data-cf="buy"'}
    ])+rcNote('اگر این قابلیت را لازم می‌دانید، در بازخورد محصول بنویسید تا به نقشهٔ راه اضافه شود.'),null);
    return;
  }
  botC('ثبت سند رسمی و دفترخانه از قابلیت‌های این نسخه نیست؛ قراردادهای سامانه «داخلی»اند و برای ثبت رسمی، احراز هویت و امضای الکترونیک لازم است.'+
  rcActs([
    {l:'تنظیم قرارداد داخلی اجاره',a:'data-cf="rent"',p:1},
    {l:'گزارش حقوقی خرید',a:'data-cf="buy"'}
  ]),null);
};
/* مرتب‌سازی جدول‌های گفت‌وگو */
CBACT.sortTbl=function(el){
  var th=el.tagName==='TH'?el:el.closest('th');if(!th)return;
  var tbl=th.closest('table');if(!tbl)return;
  var i=+th.getAttribute('data-i')||0;
  var dir=tbl.getAttribute('data-dir')==='asc'?'desc':'asc';
  tbl.setAttribute('data-dir',dir);
  var tb=tbl.querySelector('tbody');if(!tb)return;
  var rows=[].slice.call(tb.querySelectorAll('tr'));
  rows.sort(function(x,y){
    var av=x.children[i]?x.children[i].getAttribute('data-v'):'',bv=y.children[i]?y.children[i].getAttribute('data-v'):'';
    var an=parseFloat(av),bn=parseFloat(bv),c;
    if(!isNaN(an)&&!isNaN(bn))c=an-bn;else c=String(av).localeCompare(String(bv),'fa');
    return dir==='asc'?c:-c;
  });
  rows.forEach(function(r){tb.appendChild(r)});
  [].forEach.call(th.parentNode.children,function(x){var s=x.querySelector('.sarr');if(s)s.textContent=''});
  var sa=th.querySelector('.sarr');if(sa)sa.textContent=dir==='asc'?'▲':'▼';
};

