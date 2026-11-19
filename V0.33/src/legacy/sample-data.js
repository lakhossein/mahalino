/* ═══ ۵) داده ═══ */
var MODBY={rent:{v:'rent',t:'اجاره'},buy:{v:'buy',t:'خرید'},invr:{v:'invest',t:'درآمد اجاره'},mkt:{v:'mkt',t:'پروژه‌ها'},build:{v:'build',t:'ساخت و تأمین'},stay:{v:'stay',t:'اقامتگاه'},grt:{v:'grt',t:'اجاره تضمینی'}};
var WD=['شنبه','یک‌شنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه'];
var MARKET={asOf:'شهریور ۱۴۰۵',obs:'سپتامبر ۲۰۲۶',observed:'۳۱ اکتبر ۲۰۲۶',type:'میانگین قیمت پیشنهادی آگهی‌های فروش',coverage:'سطح محله',note:'دادهٔ معاملهٔ ثبت‌شده در سطح محله به‌صورت عمومی منتشر نمی‌شود؛ بانک مرکزی شاخص/میانگین شهر تهران را منتشر می‌کند. اعداد این بخش قیمت پیشنهادی آگهی‌ها هستند، نه قیمت معامله.'};
var HOODS=[
{id:'h1',n:'سعادت‌آباد',avgRent:500000000,avgDep:20000000000,buyBase:4822000000,newBase:5400000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.777,51.367],mkt:{low:3860000000,high:5790000000,mom:4.8,yoy:132.3,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-saadat_abad'}},
{id:'h2',n:'پونک',avgRent:550000000,avgDep:15000000000,buyBase:3204000000,newBase:3588000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.760,51.332],mkt:{low:2560000000,high:3850000000,mom:2.7,yoy:124.6,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-punak'}},
{id:'h3',n:'ستارخان',avgRent:450000000,avgDep:12000000000,buyBase:2655000000,newBase:2974000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.738,51.355],mkt:{low:2124000000,high:3186000000,mom:2.1,yoy:125.6,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-satarkhan'}},
{id:'h4',n:'شهران',avgRent:400000000,avgDep:10000000000,buyBase:2540000000,newBase:2845000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.762,51.302],mkt:{low:2032000000,high:3048000000,mom:-0.5,yoy:120.7,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-region5-shahran_jonubi'}},
{id:'h5',n:'جردن',avgRent:650000000,avgDep:30000000000,buyBase:3819000000,newBase:4277000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.796,51.412],mkt:{low:3055000000,high:4583000000,mom:-1.3,yoy:105.8,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-jordan'}},
{id:'h6',n:'نارمک',avgRent:350000000,avgDep:8000000000,buyBase:2365000000,newBase:2649000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.741,51.508],mkt:{low:1892000000,high:2838000000,mom:2.3,yoy:114.0,src:'کیلید',url:'https://kilid.com/buy/tehran-region8-narmak'}},
{id:'h7',n:'ونک',avgRent:700000000,avgDep:32000000000,buyBase:5200000000,newBase:5800000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.757,51.407],mkt:{low:4160000000,high:6240000000,mom:3.1,yoy:118.9,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-vanak'}},
{id:'h8',n:'انقلاب',avgRent:420000000,avgDep:11000000000,buyBase:2750000000,newBase:3100000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.701,51.390],mkt:{low:2200000000,high:3300000000,mom:1.8,yoy:122.4,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-engelab'}}];
var OSM={
h1:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.96,name:'میدان کتاب'},edu:{n:26,km:0.32,name:'مهدکودک شادلین'},health:{n:242,km:0.13,name:'مطب پزشک'},shop:{n:72,km:0.14,name:'سوپرمارکت'},park:{n:53,km:0.13,name:'بوستان محلی'},food:{n:116,km:0.15,name:'کافه گردو'},sport:{n:11,km:0.57,name:'باشگاه ورزشی'}}},
h2:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:2.63,name:'نزدیک‌ترین ورودی مترو'},edu:{n:26,km:0.55,name:'دبیرستان میرزا کوچک خان'},health:{n:48,km:0.09,name:'داروخانه دکتر اکبری'},shop:{n:40,km:0.24,name:'نان فانتزی پونک'},park:{n:41,km:0.30,name:'بوستان باران'},food:{n:53,km:0.11,name:'آشکده کندو'},sport:{n:2,km:0.67,name:'باشگاه اسپین پونک'}}},
h3:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.55,name:'سرسبز شمالی'},edu:{n:24,km:0.20,name:'دبیرستان نخبگان'},health:{n:29,km:0.10,name:'درمانگاه/داروخانه'},shop:{n:13,km:0.09,name:'Sepehr Bakery'},park:{n:35,km:0.22,name:'بوستان محلی'},food:{n:14,km:0.46,name:'کافه/رستوران'}}},
h4:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:1.53,name:'همت غرب'},edu:{n:41,km:0.42,name:'دبیرستان بادامچی'},health:{n:61,km:0.22,name:'داروخانه مرکزی جنت‌آباد'},shop:{n:70,km:0.18,name:'بازار میوه بهاره'},park:{n:59,km:0.09,name:'بوستان تندرستی'},food:{n:33,km:0.08,name:'کافه لون'},sport:{n:4,km:0.76,name:'باشگاه آرسام'}}},
h5:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:2.10,name:'نزدیک‌ترین ورودی مترو'},edu:{n:16,km:0.43,name:'کودکستان رویای ایرانی'},health:{n:105,km:0.08,name:'مطب/داروخانه'},shop:{n:30,km:0.41,name:'هایپر شند استار'},park:{n:19,km:0.15,name:'بوستان کاج'},food:{n:66,km:0.19,name:'بارولا'},sport:{n:11,km:0.20,name:'ماسا پیلاتس پالادیوم'}}},
h6:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',partial:true,cats:{edu:{n:37,km:0.16,name:'مهد کودک دانشگاه علم و صنعت'},health:{n:48,km:0.50,name:'درمانگاه خیریه آل رسول'},shop:{n:85,km:0.31,name:'نان بربری'},food:{n:33,km:null,name:'کافه/رستوران'}}},
h7:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.40,name:'ورودی مترو ونک'},edu:{n:31,km:0.28,name:'مدرسهٔ نمونه'},health:{n:120,km:0.11,name:'مطب/داروخانه'},shop:{n:65,km:0.12,name:'فروشگاه'},park:{n:20,km:0.20,name:'بوستان پارک وی'},food:{n:95,km:0.10,name:'کافه/رستوران'},sport:{n:8,km:0.44,name:'باشگاه ورزشی'}}},
h8:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.30,name:'مترو انقلاب'},edu:{n:44,km:0.35,name:'دانشگاه/مدرسه'},health:{n:70,km:0.15,name:'درمانگاه/داروخانه'},shop:{n:60,km:0.14,name:'فروشگاه'},park:{n:12,km:0.30,name:'بوستان محلی'},food:{n:80,km:0.12,name:'کافه/رستوران'}}}};
function findH(id){var i;for(i=0;i<HOODS.length;i++){if(HOODS[i].id===id)return HOODS[i]}return HOODS[0]}
function marketCard(h){return h&&h.mkt?h.mkt:HOODS[0].mkt}
function marketMin(){return Math.min.apply(null,HOODS.map(function(h){return h.buyBase}))}
function marketMax(){return Math.max.apply(null,HOODS.map(function(h){return h.buyBase}))}
function affordSpan(budget){return [Math.round(budget/marketMax()),Math.round(budget/marketMin())]}
function llDist(a,b){return Math.abs(a[0]-b[0])*111+Math.abs(a[1]-b[1])*85}
function wTime(h){
  if(S.prof.workLL){return Math.max(5,Math.min(90,Math.round(llDist(h.ll,S.prof.workLL)*2.5+8)))}
  if(S.prof.work){return Math.max(5,Math.min(90,Math.round(llDist(h.ll,findH(S.prof.work).ll)*2.5+8)))}
  return h.work;
}
function sTime(h){
  if(S.prof.schoolLL){return Math.max(3,Math.min(60,Math.round(llDist(h.ll,S.prof.schoolLL)*2+4)))}
  if(S.prof.school){return Math.max(3,Math.min(60,Math.round(llDist(h.ll,findH(S.prof.school).ll)*2+4)))}
  return Math.round(h.school/80);
}
function wLabel(){if(S.prof.workLL)return ' (از محل کارِ ثبت‌شده روی نقشه)';if(S.prof.work)return ' (از محل کار شما: '+findH(S.prof.work).n+')';return ''}
/* ─── مکان‌های مهم و فاصلهٔ هوایی ─── */
function placeKindLabel(k){return k==='work'?'محل کار':(k==='school'?'مدرسه':(k==='family'?'خانواده':'سایر'))}
function placeKindSuffix(p){var k=placeKindLabel(p.kind);return k===p.label?'':' · '+k}
function placeKindIcon(k){return k==='work'?'work':(k==='school'?'school':(k==='family'?'home':'map'))}
function initPlaces(){
  if(!S.prof)return [];
  var changed=false;
  if(!S.prof.places){
    var arr=[];
    if(S.prof.workLL||S.prof.work){var wh=S.prof.work?findH(S.prof.work):null;arr.push({id:'pl-work',kind:'work',label:'محل کار',ll:S.prof.workLL||(wh?wh.ll:null),hood:S.prof.work||null,prio:1})}
    if(S.prof.schoolLL||S.prof.school){var sh=S.prof.school?findH(S.prof.school):null;arr.push({id:'pl-school',kind:'school',label:'مدرسه',ll:S.prof.schoolLL||(sh?sh.ll:null),hood:S.prof.school||null,prio:2})}
    S.prof.places=arr;changed=true;
  }
  S.prof.places.forEach(function(p,i){
    if(!p.id){p.id='pl-'+Date.now()+'-'+i;changed=true}
    if(!p.prio){p.prio=Math.min(3,i+1);changed=true}
    if(p.hood&&!p.ll){var h=findH(p.hood);if(h){p.ll=h.ll;changed=true}}
  });
  if(changed)save();
  return S.prof.places;
}
function getPlaces(){return initPlaces().slice().sort(function(a,b){return (a.prio||3)-(b.prio||3)})}
function placesCount(){return getPlaces().length}
function placeLL(p){if(!p)return null;if(p.ll&&p.ll.length===2)return p.ll;if(p.hood){var h=findH(p.hood);return h?h.ll:null}return null}
function targetLL(t){if(!t)return null;if(Array.isArray(t))return t;var h=findH(t);return h?h.ll:null}
function distKm(a,b){
  if(!a||!b)return null;
  var R=6371,toRad=Math.PI/180;
  var dLat=(b[0]-a[0])*toRad,dLng=(b[1]-a[1])*toRad,la1=a[0]*toRad,la2=b[0]*toRad;
  var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}
function placeDistances(target){
  var ll=targetLL(target);if(!ll)return [];
  return getPlaces().map(function(p){var pl=placeLL(p);return pl?{place:p,km:distKm(ll,pl)}:null}).filter(function(x){return x&&x.km!==null});
}
function placeDistText(km){return fa(km,1)+' کیلومتر'}
function placeTags(target,max){
  var ds=placeDistances(target).slice(0,max||3);
  if(!ds.length)return '<span>مکان مهمی ثبت نشده</span>';
  return ds.map(function(d){return '<span title="فاصلهٔ هوایی، نه مسیر رانندگی">'+esc(d.place.label)+' '+placeDistText(d.km)+'</span>'}).join('');
}
function placeLineText(target,max){var ds=placeDistances(target);return ds.length?placeText(target,max):''}
/* ─── بازار و تحلیل شواهدمحور ─── */
function pct(v){var n=+v||0;return (n>0?'+':'')+fa(n,1)+'٪'}
function marketFit(h,mode,D){
  D=D||{};D.B=D.B||{rentB:500000000,depB:15000000000};D.budg=D.budg||300000000000;
  var rE=E27.rentBEff(D),dE=(D.depOpen||!D.B.depB)?Infinity:D.B.depB,bE=E27.budgEff(D);
  if(mode==='rent'){
    var rOK=rE>=h.avgRent,dOK=dE>=h.avgDep;
    if(rE===Infinity&&dE===Infinity)return {ok:true,txt:'بدون محدودیت بودجه — همهٔ محله‌ها گزینه‌اند'};
    return {ok:rOK&&dOK,txt:(rOK&&dOK)?'اجاره و ودیعهٔ نمونه در سقف شماست':(rOK?'ودیعهٔ نمونه بالاتر از سقف شماست':'اجارهٔ نمونه بالاتر از سقف شماست')};
  }
  if(bE===Infinity)return {ok:true,txt:'بدون محدودیت بودجه — همهٔ محله‌ها گزینه‌اند'};
  var lo=Math.round(bE/h.mkt.high),hi=Math.round(bE/h.buyBase);
  return {ok:bE>=h.buyBase*40,txt:bE>=h.buyBase*40?('با بودجهٔ شما حدود '+fa(lo,0)+' تا '+fa(hi,0)+' متر'):'بودجه برای ۴۰ متر هم کافی نیست'};
}
function marketCardHTML(h,mode){
  var m=h.mkt;
  return '<div class="card mkt-card"><div class="ct">بازار «'+h.n+'» <span class="badge b-info">قیمت پیشنهادی</span> '+srcBadge({src:'kilid'})+'</div>'+
  '<div class="grid g3"><div class="stat"><b>'+rial(h.buyBase)+'</b><span>میانگین آگهی هر متر</span></div>'+
  '<div class="stat"><b>'+rial(m.low)+' تا '+rial(m.high)+'</b><span>بازهٔ تقریبی آگهی‌ها</span></div>'+
  '<div class="stat"><b class="'+(m.yoy>=0?'up':'down')+'">'+pct(m.yoy)+'</b><span>تغییر یک‌ساله</span></div></div>'+
  '<div class="mkt-line"><span>تغییر ماهانه: <b>'+pct(m.mom)+'</b></span><span>'+MARKET.asOf+'</span></div>'+
  (mode==='rent'?'<div class="kv" style="margin-top:8px"><span>اجارهٔ نمونهٔ ماهانه / ودیعه</span><b>'+rial(h.avgRent)+' / '+rial(h.avgDep)+'</b></div><p class="note">نمونهٔ مقایسه‌ای سامانه — آمار رسمی بازار اجاره نیست.</p>':'')+
  '<p class="note">میانگین آگهی‌ها در این تاریخ — قیمت معاملهٔ قطعی نیست.</p></div>';
}
function marketCompareHTML(h){
  var mx=marketMax();
  return '<div class="card"><div class="ct">مقایسهٔ قیمت هر متر با محله‌های دیگر</div>'+HOODS.map(function(x){
    return '<div class="mkt-row'+(x.id===h.id?' cur':'')+'"><span class="mn">'+x.n+'</span><span class="mbar"><i style="width:'+Math.round(x.buyBase/mx*100)+'%"></i></span><span class="mv">'+fa(x.buyBase/10000000,0)+' م</span></div>';
  }).join('')+'<p class="note">واحد: میلیون تومان بر متر مربع؛ همان داده و تاریخ بخش بازار.</p></div>';
}
function catRow(h,label,cat,unit){
  var o=OSM[h.id]&&OSM[h.id].cats,c=o&&o[cat];
  if(!c)return '<div class="ana-row"><span>'+label+'</span><b class="muted">داده دریافت نشد</b><small>در این نسخه برای این محله ثبت نشده است</small></div>';
  return '<div class="ana-row"><span>'+label+'</span><b>'+fa(c.n!==undefined?c.n:c.km,0)+' '+(c.n!==undefined?unit:'کیلومتر')+'</b><small>'+(c.name?'نزدیک‌ترین: '+esc(c.name):'')+'</small></div>';
}
function neighborhoodAnalysisHTML(h,mode){
  var D=wd(mode).data,m=h.mkt,o=OSM[h.id]||{},fit=marketFit(h,mode,D);
  var metro=o.cats&&o.cats.metro;
  var trade=[];
  if(metro&&metro.km>2)trade.push('دسترسی به مترو محدود است ('+placeDistText(metro.km)+')؛ اگر محل کار شما با مترو در ارتباط است، این محله ممکن است مناسب نباشد.');
  if(!fit.ok)trade.push(fit.txt+'؛ برای رسیدن به بودجه باید متراژ یا محله را تغییر دهید.');
  if(o.cats&&o.cats.park&&o.cats.park.n>=30)trade.push('امکانات ثبت‌شدهٔ زیادی دارد — این عدد «کیفیت» نیست.');
  if(!trade.length)trade.push('در داده‌های موجود، محدودیت برجسته‌ای نسبت به اولویت‌های فعلی شما دیده نمی‌شود؛ همچنان پیش از تصمیم، بازدید و استعلام رسمی لازم است.');
  return '<div class="ana">'+
  '<div class="alert al-info"><b>خلاصه:</b> میانگین آگهی '+rial(h.buyBase)+' هر متر، نزدیک‌ترین ورودی مترو '+(metro?placeDistText(metro.km):'نامشخص')+'، و '+fit.txt+'.</div>'+
  '<div class="ana-grid"><div class="card"><div class="ct">حمل‌ونقل و دسترسی</div>'+
  '<div class="ana-row"><span>نزدیک‌ترین ورودی مترو</span><b>'+(metro?placeDistText(metro.km):'داده ندارد')+'</b><small>'+(metro?esc(metro.name):'')+'</small></div>'+
  '<div class="ana-row"><span>فاصلهٔ خط مستقیم تا مکان‌های شما</span><b>'+fa(placeDistances(h.id).length,0)+' مکان</b><small>مسیر و زمان سفر محاسبه نمی‌شود</small></div>'+placesHTML(h.id,5)+
  '<details class="srcbox"><summary>چرا مهم است؟</summary><p class="note">نزدیکی مترو و مکان‌های روزانه بر رفت‌وآمد اثر دارد. این اعداد فاصلهٔ هوایی‌اند و ترافیک یا زمان واقعی را نشان نمی‌دهند.</p></details></div>'+
  '<div class="card"><div class="ct">امکانات روزمره</div>'+
  catRow(h,'مدرسه و مهدکودک','edu','مکان')+catRow(h,'سلامت (مطب/داروخانه/درمانگاه)','health','مکان')+catRow(h,'خرید و نانوایی','shop','مکان')+catRow(h,'پارک','park','مکان')+catRow(h,'کافه و رستوران','food','مکان')+catRow(h,'باشگاه','sport','مکان')+
  '<p class="note"><b>چرا مهم است:</b> تعداد مکان‌های ثبت‌شده در شعاع ۱٫۵ کیلومتری، دسترسی روزمره را نشان می‌دهد؛ نه کیفیت یا ظرفیت آن‌ها. '+(o.partial?'برای این محله بخشی از اطلاعات مکانی در دسترس نبود.':'')+'</p></div>'+
  '<div class="card"><div class="ct">بازار و سرمایه‌گذاری</div><div class="kv"><span>میانگین هر متر (آگهی)</span><b>'+rial(h.buyBase)+'</b></div>'+
  '<div class="kv"><span>بازهٔ تقریبی</span><b>'+rial(m.low)+' تا '+rial(m.high)+'</b></div>'+
  '<div class="kv"><span>تغییر ماهانه / یک‌ساله</span><b>'+pct(m.mom)+' / '+pct(m.yoy)+'</b></div>'+
  '<div class="kv"><span>تاریخ داده</span><b>'+esc(MARKET.asOf)+'</b></div>'+
  '<p class="note">قیمت پیشنهادی آگهی‌اند، نه معاملهٔ قطعی. <span class="hint" data-tip="سطح قیمت و روند آن بر توان خرید و ریسک سرمایه‌گذاری اثر دارد؛ اعداد از آگهی‌ها می‌آیند، نه معاملات ثبت‌شده.">تفاوت</span></p>'+'</div>'+
  '<div class="card"><div class="ct">محیط، ایمنی و عدم قطعیت</div>'+
  '<div class="alert al-warn"><b>امتیاز ایمنی و آلودگی در این نسخه ساخته نشده</b> — دادهٔ قابل اتکا در سطح محله نداریم. <span class="hint" data-tip="این شاخص‌ها بدون منبع معتبر و اندازه‌گیری، گمراه‌کننده‌اند؛ به همین دلیل عمداً امتیازی ساخته نشده است.">چرا؟</span></div>'+
  '<div class="ana-row"><span>آرامش / آلودگی</span><b class="muted">اندازه‌گیری نشده</b><small>نیازمند دادهٔ ایستگاه‌های پایش یا پرسش‌نامهٔ میدانی</small></div>'+
  '<div class="ana-row"><span>ایمنی</span><b class="muted">امتیازدهی نشده</b><small>آمار قابل استناد در سطح محله در دسترس نیست</small></div>'+
  '<p class="note">این اعداد از اطلاعات موجود محله گرفته شده‌اند؛ نبود داده به‌معنای وضعیت خوب یا بد نیست.</p></div>'+
  '<div class="card"><div class="ct">تطابق با بودجه و اولویت‌های شما</div>'+
  '<div class="kv"><span>وضعیت بودجه</span><b class="'+(fit.ok?'ok':'bad')+'">'+esc(fit.txt)+'</b></div>'+
  '<div class="kv"><span>امتیاز تطبیق</span><b>٪'+fa(hoodScore(h,D.P),0)+'</b></div>'+
  '<p class="note">امتیاز تطبیق فقط از عوامل قابل اندازه‌گیری و اولویت‌های شما ساخته می‌شود. <span class="hint" data-tip="«کیفیت کلی محله» یا رتبهٔ رسمی نیست؛ فقط مترو، مدرسه، محل کار و اولویت‌های دستی شما.">توضیح</span></p>'+
  '<div class="alert al-info"><b>معاوضه:</b> '+esc(trade.join(' '))+'</div></div></div>'+
  '<div class="fs-actions" style="margin-top:6px"><button class="btn btn-sm" data-act="hmap" data-h="'+h.id+'">نقشه</button><button class="btn btn-sm" data-act="hset" data-m="'+mode+'" data-id="'+h.id+'">انتخاب محله</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div></div>';
}
function analysisSummaryHTML(h,mode){
  var o=OSM[h.id]||{},c=o.cats||{},fit=marketFit(h,mode,wd(mode).data);
  return '<div class="card"><div class="ct">تحلیل محله — شواهد، نه برچسب</div>'+
  '<div class="kv"><span>قیمت هر متر (آگهی)</span><b>'+rial(h.buyBase)+' — '+esc(MARKET.asOf)+'</b></div>'+
  '<div class="kv"><span>مترو</span><b>'+(c.metro?placeDistText(c.metro.km):'داده ندارد')+'</b></div>'+
  '<div class="kv"><span>بودجهٔ شما</span><b>'+esc(fit.txt)+'</b></div>'+
  '<div class="alert al-info">'+esc('حمل‌ونقل، امکانات، بازار، محدودیت داده و معاوضه‌ها را در تحلیل کامل ببینید.')+'</div>'+
  '<div class="fs-actions"><button class="btn btn-sm btn-primary" data-act="hanalysis" data-h="'+h.id+'" data-m="'+mode+'">تحلیل کامل</button><button class="btn btn-sm" data-act="hinfo" data-h="'+h.id+'">اطلاعات</button></div>'+
  '</div>';
}

function placeText(target,max){
  var ds=placeDistances(target).slice(0,max||3);
  return ds.length?ds.map(function(d){return d.place.label+' '+placeDistText(d.km)}).join(' • '):'مکان مهمی ثبت نشده';
}
function placesHTML(target,max,note){
  var ds=placeDistances(target).slice(0,max||10),mx=0;
  ds.forEach(function(d){if(d.km>mx)mx=d.km});
  var rows=ds.length?ds.map(function(d){
    return '<div class="distrow"><span class="dn">'+esc(d.place.label)+(placeKindSuffix(d.place)?' <small style="color:var(--muted)">'+placeKindSuffix(d.place)+'</small>':'')+'</span><span class="dbar"><i style="width:'+(mx?Math.round(d.km/mx*100):0)+'%"></i></span><span class="dd">'+placeDistText(d.km)+'</span></div>';
  }).join(''):'<div class="empty" style="padding:14px">مکان مهمی ثبت نشده است. از حساب کاربری، مکان‌های مهم را اضافه کنید.</div>';
  return '<div class="distlist">'+rows+'</div><div class="distnote">'+(note?esc(note):'فاصلهٔ هوایی از مرکز محله — نه زمان سفر. <span class="hint" data-tip="فاصلهٔ خط مستقیم (هوایی) است؛ نه زمان یا مسیر رانندگی/پیاده؛ محاسبه از مرکز محله انجام شده است.">چرا؟</span>')+'</div>';
}
function placesCompareRows(){
  return getPlaces().map(function(p){
    return [esc(p.label),function(x){var hood=x&&x.hood?x.hood:(typeof x==='string'?x:null);var km=hood?distKm(findH(hood).ll,placeLL(p)):null;return km===null?'—':placeDistText(km)}];
  });
}
function syncLegacyFromPlaces(){
  var ps=getPlaces(),w=null,s=null,i;
  for(i=0;i<ps.length;i++){if(!w&&ps[i].kind==='work')w=ps[i];if(!s&&ps[i].kind==='school')s=ps[i]}
  S.prof.work=w&&w.hood?w.hood:null;S.prof.workLL=w?placeLL(w):null;
  S.prof.school=s&&s.hood?s.hood:null;S.prof.schoolLL=s?placeLL(s):null;
  save();
}
function upsertPlace(kind,label,ll,hood,prio){
  var ps=initPlaces(),i,found=null;
  for(i=0;i<ps.length;i++){
    if(ps[i].kind===kind&&(kind==='work'||kind==='school')){found=ps[i];break}
  }
  if(found){found.label=label||found.label;found.ll=ll||found.ll;found.hood=hood||null;found.prio=prio||found.prio}
  else{ps.push({id:'pl-'+Date.now()+'-'+Math.floor(Math.random()*999),kind:kind,label:label||placeKindLabel(kind),ll:ll||null,hood:hood||null,prio:prio||3})}
  syncLegacyFromPlaces();
  return found||ps[ps.length-1];
}
function removePlace(id){
  var ps=initPlaces(),i;
  for(i=0;i<ps.length;i++){if(ps[i].id===id){ps.splice(i,1);break}}
  syncLegacyFromPlaces();
}
var RLIST=[
{id:'r1',hood:'h1',seed:'a1',t:'۷۵ متری دوخوابه — علامه شمالی',rent:450000000,dep:15000000000,m2:75,age:12,floor:3,beds:2,elev:false,park:true,balc:true,rate:4.3,n:28,av:{'شنبه':['۱۰:۳۰','۱۱:۳۰','۱۷:۰۰'],'دوشنبه':['۱۰:۳۰','۱۷:۰۰'],'چهارشنبه':['۱۱:۰۰','۱۸:۰۰']}},
{id:'r5',hood:'h1',seed:'a2',t:'۶۰ متری دوخوابه — کاج',rent:380000000,dep:12000000000,m2:60,age:4,floor:5,beds:2,elev:true,park:true,balc:true,rate:4.4,n:9,av:{'یک‌شنبه':['۱۲:۰۰','۱۶:۰۰'],'سه‌شنبه':['۱۰:۰۰','۱۹:۰۰']}},
{id:'r2',hood:'h2',seed:'a3',t:'۸۵ متری دوخوابه — سردار جنگل',rent:550000000,dep:15000000000,m2:85,age:8,floor:2,beds:2,elev:true,park:true,balc:false,rate:4.6,n:41,av:{'شنبه':['۹:۰۰','۱۰:۰۰'],'یک‌شنبه':['۱۵:۰۰','۱۶:۰۰'],'پنج‌شنبه':['۱۷:۰۰','۱۸:۰۰']}},
{id:'r3',hood:'h3',seed:'a4',t:'۶۸ متری دوخوابه — اباذر',rent:400000000,dep:10000000000,m2:68,age:20,floor:5,beds:2,elev:true,park:false,balc:true,rate:4.1,n:17,av:{'دوشنبه':['۱۱:۰۰','۱۲:۰۰'],'چهارشنبه':['۱۷:۰۰','۱۸:۰۰']}},
{id:'r4',hood:'h4',seed:'a5',t:'۹۰ متری سه‌خوابه — باغ فیروزه',rent:420000000,dep:12000000000,m2:90,age:6,floor:1,beds:3,elev:false,park:true,balc:true,rate:4.5,n:33,av:{'شنبه':['۱۶:۰۰','۱۷:۰۰'],'سه‌شنبه':['۱۰:۰۰','۱۱:۰۰']}},
{id:'r6',hood:'h5',seed:'a6',t:'۵۵ متری یک‌خوابه — بوستان چهارم',rent:600000000,dep:25000000000,m2:55,age:2,floor:7,beds:1,elev:true,park:true,balc:true,rate:4.6,n:22,av:{'یک‌شنبه':['۱۰:۰۰','۱۱:۰۰','۱۵:۰۰'],'چهارشنبه':['۱۰:۰۰']}},
{id:'r7',hood:'h6',seed:'a7',t:'۷۰ متری دوخوابه — میدان هلال',rent:320000000,dep:7000000000,m2:70,age:15,floor:2,beds:2,elev:false,park:true,balc:false,rate:4.4,n:15,av:{'شنبه':['۱۴:۰۰','۱۵:۰۰'],'دوشنبه':['۱۴:۰۰']}},
{id:'r8',hood:'h6',seed:'a8',t:'۶۵ متری دوخوابه — گلبرگ',rent:300000000,dep:6000000000,m2:65,age:10,floor:4,beds:2,elev:true,park:false,balc:true,rate:4.2,n:11,av:{'یک‌شنبه':['۱۷:۰۰'],'سه‌شنبه':['۱۷:۰۰','۱۸:۰۰'],'پنج‌شنبه':['۱۰:۰۰']}},
{id:'r9',hood:'h7',seed:'a9',t:'۶۵ متری دوخوابه — ونک تانز',rent:680000000,dep:28000000000,m2:65,age:3,floor:4,beds:2,elev:true,park:true,balc:true,rate:4.5,n:19,av:{'شنبه':['۱۱:۰۰','۱۸:۰۰'],'دوشنبه':['۱۰:۰۰']}},
{id:'r10',hood:'h8',seed:'a10',t:'۵۵ متری دوخوابه — انقلاب (کارگر جنوبی)',rent:420000000,dep:9500000000,m2:55,age:6,floor:2,beds:2,elev:true,park:false,balc:true,rate:4.0,n:24,av:{'یک‌شنبه':['۱۱:۰۰','۱۷:۰۰'],'سه‌شنبه':['۱۶:۰۰']}}];
function findL(id){var i;for(i=0;i<RLIST.length;i++){if(RLIST[i].id===id)return RLIST[i]}return RLIST[0]}
var BLIST=[
{id:'b1',hood:'h1',seed:'c1',t:'۵۵ م نوساز — علامه شمالی',m2:55,age:2,floor:4,beds:2,ppm:5150000000,elev:true,park:true,balc:true,rate:4.5},
{id:'b2',hood:'h1',seed:'c2',t:'۷۵ م ۱۲ساله — کاج',m2:75,age:12,floor:3,beds:2,ppm:4550000000,elev:true,park:true,balc:false,rate:4.3},
{id:'b3',hood:'h2',seed:'c3',t:'۸۵ م ۸ساله — سردار جنگل',m2:85,age:8,floor:2,beds:2,ppm:3300000000,elev:true,park:true,balc:true,rate:4.6},
{id:'b4',hood:'h2',seed:'c4',t:'۶۰ م ۳ساله — آریاشهر',m2:60,age:3,floor:5,beds:2,ppm:3550000000,elev:true,park:false,balc:true,rate:4.4},
{id:'b5',hood:'h3',seed:'c5',t:'۶۸ م ۲۰ساله — اباذر',m2:68,age:20,floor:5,beds:2,ppm:2250000000,elev:true,park:false,balc:false,rate:4.1},
{id:'b6',hood:'h3',seed:'c6',t:'۵۲ م ۵ساله — توحید',m2:52,age:5,floor:3,beds:1,ppm:2850000000,elev:true,park:false,balc:true,rate:4.2},
{id:'b7',hood:'h6',seed:'c7',t:'۷۰ م ۱۵ساله — هلال',m2:70,age:15,floor:2,beds:2,ppm:2000000000,elev:false,park:true,balc:true,rate:4.4},
{id:'b8',hood:'h6',seed:'c8',t:'۹۵ م ۶ساله — گلبرگ',m2:95,age:6,floor:1,beds:3,ppm:2550000000,elev:false,park:true,balc:true,rate:4.5},
{id:'b9',hood:'h4',seed:'c9',t:'۹۰ م ۶ساله — باغ فیروزه',m2:90,age:6,floor:1,beds:3,ppm:2750000000,elev:false,park:true,balc:true,rate:4.5},
{id:'b10',hood:'h5',seed:'c10',t:'۵۵ م نوساز — بوستان چهارم',m2:55,age:2,floor:7,beds:2,ppm:4300000000,elev:true,park:true,balc:true,rate:4.6},
{id:'b11',hood:'h7',seed:'c11',t:'۶۰ م نوساز — ونک',m2:60,age:2,floor:5,beds:2,ppm:5400000000,elev:true,park:true,balc:true,rate:4.6},
{id:'b12',hood:'h8',seed:'c12',t:'۷۰ م ۹ساله — انقلاب',m2:70,age:9,floor:3,beds:2,ppm:2700000000,elev:true,park:false,balc:false,rate:4.1}];
function findB(id){var i;for(i=0;i<BLIST.length;i++){if(BLIST[i].id===id)return BLIST[i]}return BLIST[0]}
function ser12(base){var m=[.86,.875,.89,.885,.905,.925,.935,.95,.945,.965,.985,1],r=[],i;for(i=0;i<12;i++){r.push(Math.round(base*m[i]/1000000)*1000000)}return r}
var REP=[['پکیج / آبگرمکن','o'],['نشت لولهٔ اصلی','o'],['ایزوگام و نم‌گیری','o'],['پمپ آب مشاعات','o'],['شارژ گاز کولر','t'],['شیرآلات و واشر','t'],['قفل و درب واحد','t'],['لامپ و کلید واحد','t']];
var LGD={
ok:{lbl:'سند تک‌برگ',est:'۷ روز کاری',rows:[['سند','تک‌برگ رسمی','ok'],['رهن / بازداشت','ندارد','ok'],['تفکیک رسمی','صورت شده','ok'],['مادهٔ ۱۰۰','ندارد','ok'],['وقف / ملی','ندارد','ok']],risk:''},
mort:{lbl:'رهن بانکی + مادهٔ ۱۰۰',est:'۲۵ تا ۴۰ روز',rows:[['سند','تک‌برگ رسمی','ok'],['رهن بانکی','۱٬۲۰۰٬۰۰۰٬۰۰۰ تومان — فک رهن ~۱۵ روز','warn'],['مادهٔ ۱۰۰','جریمه: ۸۰٬۰۰۰٬۰۰۰ تومان','bad'],['وقف','ندارد','ok']],risk:'تا رفع موانع، وجه فقط در حساب امانی آزاد می‌شود.'},
heir:{lbl:'ورثه‌ای و وقفی',est:'بیش از ۴۵ روز',rows:[['سند','منگوله‌دار','warn'],['وقف','استعلام اوقاف لازم','warn'],['وراثت','گواهی انحصار وراثت نیست','bad'],['وکالت','اعتبار نامشخص','bad'],['مالیات ارث','مفاصاحساب نیست','bad']],risk:'فروش ملک ورثه‌ای بدون رضایت همهٔ ورثه باطل است — مگر با پرداخت مرحله‌ای امانی.'}};
var SCN={bad:{p:.06,g:.08,u:.05,d:.225},mid:{p:.24,g:.26,u:.31,d:.225},good:{p:.42,g:.48,u:.6,d:.225}};
var SLIST=[
{id:'s1',city:'تهران',seed:'m1',t:'آپارتمان ۳خوابه — کارگر شمالی',p:9500000,defN:10,ll:[35.775,51.415],amens:['آسانسور','ماشین لباسشویی','آشپزخانهٔ کامل','اینترنت ۵۰ مگ','پارکینگ','بالکن'],rules:['ورود ۱۴:۰۰ — خروج ۱۲:۰۰','بدون حیوان خانگی','منع صدای بلند بعد از ۲۲'],acc:'۸ دقیقه پیاده تا بیمارستان قلب • مترو ۴۵۰ متر',revs:[{n:'مریم ر.',s:5,t:'برای عمل مادرم ۱۰ شب ماندیم؛ آشپزخانه لازم بود.'},{n:'حسین ک.',s:4,t:'نزدیک بیمارستان و آرام.'}],rate:'۴٫۷ (۸۶)'},
{id:'s2',city:'تهران',seed:'m2',t:'سوئیت ۲خوابه — ونک',p:8000000,defN:10,ll:[35.757,51.410],amens:['آسانسور','آشپزخانه','اینترنت ۱۰۰ مگ','میز کار'],rules:['ورود ۱۴:۰۰','فقط خانواده','حداکثر ۴ مهمان'],acc:'۱۲ دقیقه تا بیمارستان ابن‌سینا • مترو ۳۰۰ متر',revs:[{n:'سمیرا ک.',s:5,t:'مطابق عکس‌ها بود.'}],rate:'۴٫۵ (۴۱)'},
{id:'s3',city:'شیراز',seed:'m3',t:'آپارتمان ۱خوابه — قصردشت',p:7800000,defN:7,ll:[29.632,52.472],amens:['اینترنت ۱۰۰ مگ','میز کار','کولر گازی'],rules:['منع صدا بعد از ۲۳'],acc:'۵ دقیقه تا مرکز شهر',revs:[{n:'بهنام ط.',s:5,t:'اینترنت بی‌قطعی.'}],rate:'۴٫۵ (۵۴)'},
{id:'s4',city:'رامسر',seed:'m4',t:'ویلای دوبلکس — ساحلی',p:28000000,defN:3,ll:[36.920,50.650],amens:['استخر','پارکینگ ۲ خودرو','ویوی دریا','باربیکیو'],rules:['حداکثر ۸ مهمان','استخر ۸ تا ۲۲'],acc:'۲ کیلومتر آخر آسفالت • ۵ دقیقه ساحل',revs:[{n:'خانوادهٔ احمدی',s:5,t:'عکس‌ها مطابق واقعیت.'}],rate:'۴٫۸ (۱۲۳)'}];
function findS(id){var i;for(i=0;i<SLIST.length;i++){if(SLIST[i].id===id)return SLIST[i]}return SLIST[0]}
function stayList(city){var n=(city||'').replace(/[يى]/g,'ی');
  if(n.indexOf('شیراز')>=0)return [SLIST[2]];
  if(/رامسر|ساری|نوشهر|چالوس|شمال|مازندران/.test(n))return [SLIST[3]];
  if(/تهران|مشهد/.test(n))return [SLIST[0],SLIST[1]];
  return SLIST;
}
var INPRJ=[
{t:'برج نگین — یوسف‌آباد',loc:'یوسف‌آباد، بلوار دریا',prog:48,fin:55,units:'۱۲٬۰۰۰ متر زیربنا',del:'۱۴ ماه آینده',lic:'فرابورس ✓ پروانه ✓ امانی ✓'},
{t:'برج الماس — تهرانپارس',loc:'تهرانپارس، فلکهٔ دوم',prog:12,fin:20,units:'۹٬۵۰۰ متر زیربنا',del:'۲۲ ماه آینده',lic:'فرابورس ✓ پروانه ✓'},
{t:'مجتمع سبز — نارمک',loc:'نارمک، میدان هلال',prog:0,fin:8,units:'۷٬۰۰۰ متر زیربنا',del:'۲۶ ماه آینده',lic:'در حال ثبت'}];
var RPROPS=[
{seed:'f1',t:'آپارتمان ۸۵ متری دوخوابه',addr:'پونک، سردار جنگل، پلاک ۱۲',rent:55000000,dep:3500000000,st:'اجاره‌داده‌شده',rate:4.6},
{seed:'f2',t:'آپارتمان ۷۰ متری دوخوابه',addr:'نارمک، میدان هلال',rent:52000000,dep:2200000000,st:'اجاره‌داده‌شده',rate:4.4},
{seed:'f3',t:'آپارتمان ۶۸ متری دوخوابه',addr:'ستارخان، اباذر',rent:0,dep:0,st:'خالی — مستأجریابی',rate:4.1}];
var PRJ=[
{t:'برج مسکونی ۱۰ طبقه',loc:'تجریش، ملاصدرا',emp:'کارفرما: مالک حقیقی — ناظر: مهندس ر. کاظمی',fl:'۱۰ طبقه + ۲ زیرزمین',area:'۴٬۲۰۰ متر زیربنا',pre:'۳۰٪',score:'۴٫۸',bids:7,dur:'۱۸ ماه',start:'۲ ماه آینده',scope:'ادامهٔ کار (اسکلت تا طبقهٔ ۴ اجرا شده)',lic:'پروانهٔ ۱۴۰۲/۲/۱۱۷ — معتبر',pay:'پرداخت مرحله‌ای + ۵٪ حسن انجام کار',hist:'۶ پروژه — تسویه به‌موقع'},
{t:'مجتمع ۱۴ طبقه',loc:'سعادت‌آباد، بلوار دریا',emp:'کارفرما: شرکت ملک پارس',fl:'۱۴ طبقه + ۳ زیرزمین',area:'۷٬۸۰۰ متر زیربنا',pre:'۲۵٪',score:'۴٫۵',bids:12,dur:'۲۴ ماه',start:'فوری',scope:'از صفر (گودبرداری و پی)',lic:'پروانهٔ ۱۴۰۲/۴/۰۹۲ — معتبر',pay:'۲۵٪ + صورت‌وضعیت ماهانه',hist:'۱۱ پروژه',warn:''},
{t:'بهسازی + افزودن طبقه',loc:'گیشا، امیرکبیر',emp:'کارفرما: سه مالک مشاع',fl:'+۲ طبقه',area:'۹۵۰ متر',pre:'۲۰٪',score:'۳٫۹',bids:4,dur:'۸ ماه',start:'۱ ماه آینده',scope:'بهسازی اسکلت',lic:'اصلاحی در صدور',pay:'۲۰٪ + ۴ مرحله',hist:'۳ پروژه',warn:'سند مشاع — قرارداد سه‌جانبه'}];
(function(){var i;for(i=0;i<S.nprj.length;i++){PRJ.push(S.nprj[i])}})();
var BIDS=[{n:'بنیان‌گستر — ★۴٫۶',amt:8200000000,dur:18},{n:'آریا سازه — ★۴٫۳',amt:7800000000,dur:20},{n:'مهر ساخت — ★۴٫۱',amt:8600000000,dur:16}];
var SUPS=[
{t:'آرماتور A3 — بورس کالا',b:['استاندارد ملی','آنالیز کارخانه'],p:'۲۷٬۴۰۰ تومان/کیلو',d:'۳ روز',stock:'۵۰۰ تن',min:'۲ تن',s:'۴٫۷'},
{t:'خدمات جرثقیل — تهران',b:['صلاحیت فنی','بیمهٔ اپراتور'],p:'ساعتی ۸۵۰٬۰۰۰ تومان',d:'همان روز',stock:'۳ دستگاه',min:'۴ ساعت',s:'۴٫۴'},
{t:'تیم اجرایی — ۱۲ نفر',b:['پروفایل راستی‌آزمایی'],p:'۹۵۰ هزار تا ۱٫۲ میلیون تومان/روز',d:'این هفته',stock:'—',min:'۲ هفته',s:'۴٫۶'},
{t:'بتن آمادهٔ C30',b:['گواهی آزمایشگاه'],p:'متری ۴٬۸۰۰٬۰۰۰ تومان',d:'فردا',stock:'۲۰۰ متر/روز',min:'۱۰ متر',s:'۴٫۵'}];
var PACKS=[
{n:'پایه',tok:1500,pr:2990000,f:['۱۵۰۰ کلید','جزئیات آگهی و بازدید','۲ گزارش حقوقی']},
{n:'حرفه‌ای',tok:4000,pr:6990000,f:['۴۰۰۰ کلید','حقوقی نامحدود','قرارداد امانی','پشتیبانی اولویت‌دار'],best:true},
{n:'سازمانی',tok:12000,pr:18990000,f:['۱۲۰۰۰ کلید','کاربر نامحدود','دسترسی سازمانی']}];
var PPM={v:700000000};
var SPRIX=765000000;
/* ═══ ۵.۵) مبنای مالی Rental Income ═══ */
var FIN={
  asOf:'مهر ۱۴۰۵',
  bank:{
    nominal:0.205,
    effective:Math.pow(1+0.205/12,12)-1,
    monthly:0.205/12,
    source:'نرخ سود سپردهٔ بلندمدت یک‌ساله: ۲۰.۵٪ اسمی — بخشنامهٔ بانک مرکزی ۲۸۰۳۷۳/۰۱ (۱۰ بهمن ۱۴۰۱) و جدول جاری مهر ۱۴۰۵',
    url:'https://www.rade.ir/6845-%D8%A8%DB%8C%D8%B4%D8%AA%D8%B1%DB%8C%D9%86-%D8%B3%D9%88%D8%AF-%D8%B3%D9%BE%D8%B1%D8%AF%D9%87-%D8%A8%D8%A7%D9%86%DA%A9%D9%87%D8%A7/'
  },
  fund:{
    effective:0.30,
    source:'نمونهٔ گزارش‌شدهٔ صندوق درآمد ثابت: متوسط حدود ۳۰٪ سالانه — بازدهی گذشته، تضمین آینده نیست',
    url:'https://irfarabi.com/fixed-incom-fund'
  },
  rent:{
    cashAnnual:(54000*12)/13200000,
    source:'دادهٔ داخلی سامانه: ۵٬۴۰۰ تومان درآمد ماهانه به‌ازای هر کلید با ارزش پایهٔ ۱٬۳۲۰٬۰۰۰ تومان'
  },
  nav:{default:0.32,source:'فرض افزایش ارزش ملک پیش‌فرض سامانه؛ قابل تغییر و غیرتضمینی'}
};
function monthlyFromAnnual(r){return Math.pow(1+r,1/12)-1}
function finRows(cap,nav){
  cap=+cap||0;
  nav=(nav===undefined||nav===null)?FIN.nav.default:nav;
  var bankMonthly=FIN.bank.monthly,bankEff=FIN.bank.effective,bankAmt=cap*bankMonthly;
  var fundMonthly=monthlyFromAnnual(FIN.fund.effective),fundAmt=cap*fundMonthly;
  var rentAnnual=FIN.rent.cashAnnual,rentMonthly=rentAnnual/12,rentAmt=cap*rentMonthly;
  var navMonthly=monthlyFromAnnual(nav),navAmt=cap*navMonthly;
  var totalAnnual=(1+rentAnnual)*(1+nav)-1;
  var totalMonthly=monthlyFromAnnual(totalAnnual),totalAmt=cap*totalMonthly;
  return [
    {k:'bank',short:'بانک',label:'سپردهٔ بانکی یک‌ساله',annual:FIN.bank.nominal,annualLabel:'۲۰.۵٪ اعلامی / '+fa(bankEff*100,2)+'٪ با سود مرکب',monthly:bankMonthly,amount:bankAmt,note:'سود ماهانه؛ با سرمایه‌گذاری مجدد، بازده سالانه بیشتر می‌شود'},
    {k:'fund',short:'صندوق',label:'صندوق درآمد ثابت (نمونه)',annual:FIN.fund.effective,annualLabel:'۳۰٪ سالانه (نمونه)',monthly:fundMonthly,amount:fundAmt,note:'بازدهی نمونهٔ گزارش‌شده؛ تضمینی نیست'},
    {k:'rent',short:'اجاره نقدی',label:'درآمد نقدی اجاره',annual:rentAnnual,annualLabel:fa(rentAnnual*100,2)+'٪ نقدی',monthly:rentMonthly,amount:rentAmt,note:'نقدی؛ بر پایهٔ دادهٔ نمونهٔ سامانه'},
    {k:'nav',short:'افزایش ارزش ملک',label:'افزایش ارزش ملک (فرضی)',annual:nav,annualLabel:fa(nav*100,0)+'٪ فرضی',monthly:navMonthly,amount:navAmt,note:'غیرنقدی؛ فرضی و غیرتضمینی'},
    {k:'total',short:'مجموع مسکن',label:'مجموع مسکن (اجاره + افزایش ارزش)',annual:totalAnnual,annualLabel:fa(totalAnnual*100,2)+'٪ سالانه با سرمایه‌گذاری مجدد',monthly:totalMonthly,amount:totalAmt,note:'با فرض سرمایه‌گذاری مجدد اجاره؛ شامل افزایش غیرنقدی ارزش'}
  ];
}
function finTableHTML(cap,nav,compact){
  var rows=finRows(cap,nav);
  return '<table class="fin-table"><thead><tr><th>گزینه</th><th>نرخ سالانه</th><th>معادل ماهانه</th>'+(compact?'':'<th>مبلغ ماهانه</th>')+'</tr></thead><tbody>'+
  rows.map(function(r){return '<tr><td>'+r.label+'</td><td>'+r.annualLabel+'</td><td>'+fa(r.monthly*100,2)+'٪</td>'+(compact?'':'<td>'+rial(r.amount)+'</td>')+'</tr>'}).join('')+'</tbody></table>';
}
function finBarsHTML(cap,nav){
  var rows=finRows(cap,nav),max=0;
  rows.forEach(function(r){if(r.monthly>max)max=r.monthly});
  return '<div class="finbars">'+rows.map(function(r){
    return '<div class="fbar'+(r.k==='total'?' hi':'')+'"><span class="lbl">'+r.short+'</span><span class="tr"><i style="width:'+(max?Math.round(r.monthly/max*100):0)+'%"></i></span><span class="val">'+fa(r.monthly*100,2)+'٪</span></div>';
  }).join('')+'</div>';
}
function finNoteHTML(links){
  var eff=fa(FIN.bank.effective*100,2);
  var navp=fa((S.ui.navg||FIN.nav.default)*100,0)+'٪';var summary='بانک ۲۰.۵٪ اعلامی (با سود مرکب '+eff+'٪) · صندوق نمونه ۳۰٪ · اجاره ۴.۹۱٪ · افزایش ارزش فرضی '+navp+'٪.';
  var detail='سود سپردهٔ یک‌سالهٔ بانکی ۲۰.۵٪ اعلامی است؛ با سرمایه‌گذاری مجدد ماهانه، بازده سالانه حدود '+eff+'٪ می‌شود. صندوق و افزایش ارزش ملک نمونه و فرضی‌اند و تضمینی نیستند. درآمد اجاره ۴.۹۱٪ از دادهٔ نمونهٔ سامانه محاسبه شده است.';
  return '<div class="fin-note">'+summary+'</div>'+
    (links?'<details class="fin-src"><summary>منبع و مفروضات</summary><div class="fin-note">'+detail+'</div></details>':'');
}
function finChatHTML(cap,nav){
  var rows=finRows(cap,nav),annual=rows.map(function(r){return r.short+': '+r.annualLabel}).join(' · ');
  return '<b>مقایسهٔ بازدهی</b><div style="font-size:11px;color:var(--muted);margin-bottom:2px">معادل ماهانهٔ درصدی</div>'+finBarsHTML(cap,nav)+'<div class="fin-note" style="margin:6px 0 2px">نرخ سالانه — '+annual+'</div>'+'<div class="fin-note">صندوق و افزایش ارزش نمونه و فرضی‌اند و تضمینی نیستند.</div>';
}
function ppmTick(){
  PPM.v=Math.max(650000000,Math.min(750000000,PPM.v+Math.round((Math.random()-0.5)*32000000)));
  var e=document.getElementById('ppmlive');if(e)e.textContent=rial(PPM.v);
  var m=document.getElementById('mlive');if(m)m.textContent=fa(Math.floor((window.__cap||7000000000)/PPM.v),0)+' متر';
}
var TOURROOMS=['نشیمن','آشپزخانه','اتاق خواب ۱','اتاق خواب ۲','حمام','نما'];
var TOURX=null,TOURROT=0;
function drawTour(){
  var img=document.getElementById('tourimg'),deg=document.getElementById('tourdeg');
  if(img){img.style.transform='translateX('+(TOURROT*0.6).toFixed(1)+'%)'}
  if(deg){deg.textContent=fa(Math.round(TOURROT*3.6),0)+'°'}
}
/* ═══ ۱۶.۵) خدمات ملک — سفارش کامل داخل محلینو ═══ */
var SVCS=[
{ic:'svc',t:'تأسیسات',items:[
  {n:'تعمیر پکیج و آبگرمکن',r:'۴٫۸',base:450000,unit:'fixed',d:'امروز'},
  {n:'لوله‌کشی و رفع نشت',r:'۴٫۶',base:250000,rate:650000,unit:'hour',min:1,step:1,d:'فردا'},
  {n:'برق‌کار',r:'۴٫۵',base:400000,unit:'fixed',d:'امروز'}]},
{ic:'clean',t:'نظافت و بهداشت',items:[
  {n:'نظافت منزل',r:'۴٫۷',base:0,rate:12000,unit:'m2',min:40,step:5,d:'هماهنگی'},
  {n:'شست‌وشوی مبل و فرش',r:'۴٫۶',base:1500000,unit:'fixed',d:'۴۸ ساعته'}]},
{ic:'appliance',t:'لوازم خانگی',items:[
  {n:'تعمیر لباسشویی',r:'۴٫۵',base:800000,unit:'fixed',d:'۲ روز',note:'قطعات مصرفی جدا محاسبه می‌شود'},
  {n:'نصب و سرویس کولر',r:'۴٫۷',base:1200000,unit:'fixed',d:'هماهنگی'}]},
{ic:'build',t:'خدمات ساختمانی',items:[
  {n:'نقاشی و کنف',r:'۴٫۶',base:0,rate:35000,unit:'m2',min:20,step:5,d:'۳ روز بعد'},
  {n:'کاشی و سرامیک',r:'۴٫۳',base:0,rate:95000,unit:'m2',min:10,step:5,d:'۱ هفته'}]}
];
/* Optional: window.MAHALINO_SERVICES={quoteEndpoint,orderEndpoint,statusEndpoint,cancelEndpoint}; provider keys stay server-side. */
var SVC_API={catalogEndpoint:null,quoteEndpoint:null,orderEndpoint:null,statusEndpoint:null,cancelEndpoint:null};
function svcCfg(){return (window.MAHALINO_SERVICES&&typeof window.MAHALINO_SERVICES==='object')?window.MAHALINO_SERVICES:SVC_API}
function svcIsDemo(){return !svcCfg().orderEndpoint}
var SVC_CATALOG={loaded:false,loading:false,failed:false,error:''};
function svcNormalizeCatalog(j){
  var cats=(j&&(j.categories||j.services))||[];
  if(!Array.isArray(cats)||!cats.length)throw new Error('catalog');
  return cats.map(function(c){
    return {ic:c.icon||'svc',t:c.title||c.name||'خدمات',items:(c.items||[]).map(function(it){
      return {n:it.title||it.name||'خدمت',r:it.rating?fa(it.rating,1):'—',base:+it.base||0,rate:+it.rate||0,unit:it.unit||'fixed',min:+it.min||1,step:+it.step||1,d:it.duration||it.d||'هماهنگی',note:it.note||''};
    })};
  });
}
function svcLoadCatalog(){
  var cfg=svcCfg();
  if(!cfg.catalogEndpoint){SVC_CATALOG.loaded=true;return Promise.resolve(SVCS)}
  if(SVC_CATALOG.loading)return Promise.resolve(SVCS);
  SVC_CATALOG.loading=true;SVC_CATALOG.error='';
  return svcPost(cfg.catalogEndpoint,{})
    .then(function(j){if(!j||j.ok===false)throw new Error('catalog');SVCS=svcNormalizeCatalog(j);SVC_CATALOG.loaded=true;SVC_CATALOG.failed=false;return SVCS})
    .catch(function(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/sample-data.js:383',e,'caught');SVC_CATALOG.error='دریافت فهرست خدمات ممکن نشد؛ دوباره تلاش کنید.';SVC_CATALOG.failed=true;throw e})
    .finally(function(){SVC_CATALOG.loading=false});
}

var SVC_STATUS={
  paid:{l:'پرداخت شد',c:'info'},
  submitted:{l:'ثبت سفارش',c:'info'},
  accepted:{l:'تأیید ارائه‌دهنده',c:'info'},
  scheduled:{l:'زمان‌بندی شد',c:'info'},
  in_progress:{l:'در حال انجام',c:'warn'},
  done:{l:'انجام شد',c:'ok'},
  failed:{l:'ناموفق',c:'bad'},
  rejected:{l:'رد شد',c:'bad'},
  cancelled:{l:'لغو شد',c:'warn'},
  refunded:{l:'بازپرداخت شد',c:'ok'},
  submit_failed:{l:'ثبت سفارش ناموفق',c:'bad'},
  price_changed:{l:'قیمت تغییر کرد',c:'warn'}
};
function svcStatusMeta(s){return SVC_STATUS[s]||SVC_STATUS.submitted}
function svcNormalizeStatus(s){return SVC_STATUS[s]?s:'submitted'}
function svcStatusBadge(o){var m=svcStatusMeta(o&&o.status);return '<span class="badge '+m.c+'">'+m.l+'</span>'}
function svcItem(ci,ii){return (SVCS[ci]&&SVCS[ci].items[ii])||null}
function svcPriceLabel(it){
  if(!it)return '—';
  if(it.unit==='m2')return 'متری '+rial(it.rate);
  if(it.unit==='hour')return 'از '+rial(it.base)+' + ساعتی '+rial(it.rate);
  return 'از '+rial(it.base);
}
function svcCalc(it,qty){
  qty=+qty||it.min||1;
  if(it.unit==='fixed')qty=1;
  var labour=(it.unit==='m2'||it.unit==='hour')?(+it.rate||0)*qty:0;
  var subtotal=(+it.base||0)+labour;
  var fee=Math.round(subtotal*0.08);
  return {qty:qty,base:+it.base||0,labour:labour,subtotal:subtotal,fee:fee,total:subtotal+fee,providerShare:subtotal};
}
function svcOrderById(id){var i;for(i=0;i<S.svcOrders.length;i++){if(S.svcOrders[i].id===id)return S.svcOrders[i]}return null}
function svcActiveOf(ci,ii){
  var i,o;for(i=0;i<S.svcOrders.length;i++){o=S.svcOrders[i];if(o.ci===ci&&o.ii===ii&&['done','cancelled','refunded','rejected','failed'].indexOf(o.status)<0)return o}
  return null;
}
function svcReqStatus(s){
  if(s==='done')return 'کامل شد';
  if(s==='failed'||s==='rejected'||s==='cancelled'||s==='refunded')return 'لغو شد';
  if(s==='in_progress'||s==='accepted'||s==='scheduled')return 'در حال انجام';
  return 'در انتظار';
}
function svcTimelinePush(o,s,note){o.timeline=o.timeline||[];o.timeline.push({s:s,at:Date.now(),note:note||''});o.status=s;o.updatedAt=Date.now()}
function svcReqSync(o){
  if(o.req){setReq(o.req,svcReqStatus(o.status))}
  else{o.req=addReq('svc','خدمات',o.title,svcReqStatus(o.status),'سفارش '+o.id+' — '+fmtSvcMeta(o))}
}
function svcAudit(o,event,extra){
  var e={orderId:o.id,event:event,at:Date.now(),amount:o.amount||0,status:o.status||''};
  if(extra){var k;for(k in extra)e[k]=extra[k]}
  S.svcAudit.unshift(e);if(S.svcAudit.length>200)S.svcAudit.length=200;
}
function svcError(t){toast(t||'خطا در ارتباط با ارائه‌دهنده')}
function svcPost(url,body){
  var ctrl=window.AbortController?new AbortController():null;
  var timer=ctrl?setTimeout(function(){ctrl.abort()},15000):null;
  return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl?ctrl.signal:undefined})
    .then(function(r){return r.json()})
    .then(function(j){if(timer)clearTimeout(timer);return j})
    .catch(function(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/sample-data.js:447',e,'caught');if(timer)clearTimeout(timer);throw e});
}
function svcQuote(ci,ii,qty,details){
  var it=svcItem(ci,ii),cfg=svcCfg();
  if(!it)return Promise.resolve(null);
  if(!cfg.quoteEndpoint)return Promise.resolve(svcCalc(it,qty));
  return svcPost(cfg.quoteEndpoint,{serviceId:ci+'-'+ii,quantity:+qty,details:details||{}})
    .then(function(j){
      if(!j||j.ok===false)throw new Error('quote');
      var base=+j.base||0,labour=+j.labour||0,fee=+j.fee||0,total=+j.total||(base+labour+fee);
      return {qty:+qty||1,base:base,labour:labour,subtotal:base+labour,fee:fee,total:total,providerShare:base+labour};
    });
}
function svcSubmitToProvider(o){
  var cfg=svcCfg();
  if(!cfg.orderEndpoint){
    return new Promise(function(res){
      setTimeout(function(){res({ok:true,demo:true,providerOrderId:'DEMO-'+o.id,status:'accepted'})},650);
    });
  }
  return svcPost(cfg.orderEndpoint,{idempotencyKey:o.id,orderId:o.id,serviceId:o.ci+'-'+o.ii,title:o.title,address:o.address,date:o.date,slot:o.slot,qty:o.qty,notes:o.notes,amount:o.amount,fee:o.fee})
    .then(function(j){
      if(!j||j.ok===false)throw new Error('submit');
      return {ok:true,demo:false,providerOrderId:j.providerOrderId||j.orderId,status:svcNormalizeStatus(j.status||'submitted'),priceChanged:!!j.priceChanged,amount:+j.amount||0};
    });
}
function svcPollProvider(o){
  var cfg=svcCfg();
  if(!cfg.statusEndpoint){
    if(!o.demo)return Promise.resolve({status:o.status});
    var age=Date.now()-(o.createdAt||Date.now());
    var s=age>12000?'done':(age>4500?'in_progress':'accepted');
    return Promise.resolve({status:s,demo:true});
  }
  return svcPost(cfg.statusEndpoint,{orderId:o.id,providerOrderId:o.providerOrderId})
    .then(function(j){if(!j||j.ok===false)throw new Error('status');return {status:svcNormalizeStatus(j.status||o.status),note:j.note||'',demo:false}});
}
function svcCancelProvider(o){
  var cfg=svcCfg();
  if(!cfg.cancelEndpoint)return Promise.resolve({ok:true,demo:true});
  return svcPost(cfg.cancelEndpoint,{orderId:o.id,providerOrderId:o.providerOrderId})
    .then(function(j){if(!j||j.ok===false)throw new Error('cancel');return {ok:true,demo:false}});
}
function svcRefundOrder(o,reason){
  if(!o||o.refunded)return;
  S.wallet=(S.wallet||0)+o.amount;
  S.wlog.unshift({d:'بازپرداخت سفارش '+o.id,a:o.amount,t:Date.now()});
  o.refunded=true;svcTimelinePush(o,'refunded',reason||'بازپرداخت به کیف پول');
  svcAudit(o,'refund',{amount:o.amount,reason:reason||''});
  svcReqSync(o);save();
}
function svcNewOrder(ci,ii,form,q,opts){
  var it=svcItem(ci,ii),c=SVCS[ci];opts=opts||{};
  var id='SO-'+String(Date.now()).slice(-8);
  var o={id:id,ci:ci,ii:ii,title:c.t+' — '+it.n,category:c.t,address:form.address,date:form.date,slot:form.slot,qty:q.qty,notes:form.notes,
    base:q.base,labour:q.labour,fee:q.fee,amount:q.total,providerShare:q.providerShare,payment:'paid',paymentRef:'WALLET-'+id,grtId:opts.grtId||null,
    status:'paid',createdAt:Date.now(),updatedAt:Date.now(),timeline:[{s:'paid',at:Date.now(),note:opts.grtId?('پرداخت از کیف پول — پروندهٔ '+opts.grtId):'پرداخت از کیف پول'}],settlement:'pending',demo:svcIsDemo()};
  S.svcOrders.unshift(o);S.wallet-=q.total;
  S.wlog.unshift({d:'پرداخت سفارش '+it.n,a:-q.total,t:Date.now()});
  svcAudit(o,'payment',{amount:q.total});
  return o;
}
function svcPayOrder(ci,ii,form,q,opts){
  var o=svcNewOrder(ci,ii,form,q,opts);
  save();
  return svcSubmitToProvider(o).then(function(r){
    if(r.priceChanged&&r.amount&&r.amount!==q.total){
      svcRefundOrder(o,'تغییر قیمت پیش از تأیید نهایی');
      svcTimelinePush(o,'price_changed','قیمت نهایی تغییر کرد؛ مبلغ بازپرداخت شد. لطفاً قیمت جدید را تأیید کنید.');
      svcReqSync(o);save();return o;
    }
    o.providerOrderId=r.providerOrderId||'';o.demo=!!r.demo;
    svcTimelinePush(o,r.status||'submitted',r.demo?'وضعیت نمایشی':'ثبت در ارائه‌دهنده');
    svcAudit(o,'submit',{providerOrderId:o.providerOrderId,demo:!!r.demo});
    svcReqSync(o);save();return o;
  }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/sample-data.js:522',null,'caught');
    svcTimelinePush(o,'submit_failed','پرداخت انجام شد اما ثبت سفارش ناموفق بود؛ می‌توانید دوباره تلاش کنید.');
    svcAudit(o,'submit_failed',{});
    svcReqSync(o);save();return o;
  });
}
function fmtSvcMeta(o){
  return (o.date?faDate(o.date):'—')+' • '+esc(o.slot||'—')+' • '+esc(o.address||'—');
}
function faDate(iso){
  try{return new Date(iso).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'})}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/sample-data.js:532',e,'caught');return iso}
}

var PTOPICS=[{k:'intro',ic:'',t:'معرفی پروژه'},{k:'roads',ic:'',t:'راه‌های ارتباطی'},{k:'studies',ic:'',t:'مطالعات فنی'},{k:'timeline',ic:'',t:'مراحل و زمان‌بندی'},{k:'finance',ic:'',t:'مالی و پرداخت'},{k:'docs',ic:'',t:'مجوزها و اسناد'}];
var PTOPSEL={};

