/* ═══ ۱۷) نقشه ═══ */
var MAPS={};
var MT={h:true,r:false,b:false,p:true};
var MAP_TILE={
  providers:[
    {u:'https://tile.openstreetmap.de/{z}/{x}/{y}.png',a:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'},
    {u:'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',a:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'},
    {u:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',a:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}
  ],
  maxZoom:19
};
function pinIcon(cls,label){return L.divIcon({className:'mh-pin '+(cls||''),html:'<span title="'+qesc(label||'')+'"></span>',iconSize:[20,20],iconAnchor:[10,10],popupAnchor:[0,-8]})}
function mapFallback(el,msg,withRetry){
  if(!el)return;
  el.style.position='relative';
  el.innerHTML='<div class="mapfb"><div class="fs-meta"><b>نمای نقشه در دسترس نیست</b>'+(withRetry?'<button class="btn btn-xs" data-act="mapRetry">تلاش دوباره</button>':'')+'</div><p class="note">'+esc(msg)+' می‌توانید محله را از فهرست زیر انتخاب کنید؛ زمان‌ها و اطلاعات محله مستقل از نقشه محاسبه می‌شوند.</p><div class="mflist">'+
  HOODS.map(function(h){return '<button data-act="hinfo" data-h="'+h.id+'"><span>'+h.n+'</span><span class="bd">'+rial(h.avgRent)+'</span></button>'}).join('')+'</div></div>';
}
function mkMap(elId,center,zoom){
  var el=document.getElementById(elId);
  if(!el)return null;
  if(!window.L){mapFallback(el,'کتابخانهٔ نقشه بارگذاری نشد.',elId!=='lfm2');return null}
  if(MAPS[elId]){try{MAPS[elId].remove()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:23',e,'caught');}delete MAPS[elId]}
  el.innerHTML='';el.style.position='relative';
  var m=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true}).setView(center,zoom);
  try{m.attributionControl.setPrefix(false)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:26',e,'caught');}
  var loaded=0,failed=0,notified=false,pi=0,tl=null;
  function warn(){
    if(notified||!document.body.contains(el))return;
    notified=true;
    var n=document.createElement('div');
    n.className='mapnote';
    n.innerHTML='<span>برخی قطعات نقشه بارگیری نشد.</span>'+(elId!=='lfm2'?'<button class="btn btn-xs" data-act="mapRetry">تلاش دوباره</button>':'')+'<span class="note">نشانگرها و انتخاب موقعیت فعال‌اند.</span>';
    el.appendChild(n);
  }
  function addTiles(){
    if(tl){try{m.removeLayer(tl)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:37',e,'caught');}}
    var p=MAP_TILE.providers[pi];
    tl=L.tileLayer(p.u,{maxZoom:MAP_TILE.maxZoom,attribution:p.a,crossOrigin:true}).addTo(m);
    tl.on('tileload',function(){loaded++});
    tl.on('tileerror',function(){
      failed++;
      if(loaded===0&&failed>=4&&pi<MAP_TILE.providers.length-1){pi++;failed=0;addTiles();return}
      if(failed>=4&&loaded===0)warn();
    });
  }
  addTiles();
  setTimeout(function(){if(loaded===0&&failed>0)warn()},9000);
  MAPS[elId]=m;
  setTimeout(function(){try{m.invalidateSize()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:50',e,'caught');}},80);
  setTimeout(function(){try{m.invalidateSize()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:51',e,'caught');}},450);
  return m;
}
function jll(i){return [((i%3)-1)*0.004,(Math.floor(i/3)%3-1)*0.004]}
VIEWS.map=function(){
  var el=document.getElementById('v-map');
  var rh=(wfData('rent')||{}).hood,bh=(wfData('buy')||{}).hood;
  el.innerHTML='<div class="wtop"><div><h2>نقشهٔ محله‌ها و املاک</h2><p>محله‌ها، آگهی‌ها و همهٔ مکان‌های مهم شما روی یک نقشه</p></div><div class="head-actions"><button class="btn btn-sm btn-primary" data-act="placeAdd">افزودن مکان</button><button class="btn btn-sm" data-act="account" data-tab="settings">مدیریت مکان‌ها</button><button class="btn btn-sm" data-act="pickWork">'+ico('map',16)+' ثبت محل کار</button></div></div>'+
  '<div class="card"><div id="lfm" aria-label="نقشهٔ تعاملی محله‌ها"></div>'+
  '<div class="chips" style="margin-top:10px">'+
  '<button class="chip'+(MT.h?' on':'')+'" data-act="mtog" data-k="h" aria-pressed="'+(MT.h?'true':'false')+'">محله‌ها</button>'+
  '<button class="chip'+(MT.r?' on':'')+'" data-act="mtog" data-k="r" aria-pressed="'+(MT.r?'true':'false')+'">اجاره'+(rh?(' — '+findH(rh).n):'')+'</button>'+
  '<button class="chip'+(MT.b?' on':'')+'" data-act="mtog" data-k="b" aria-pressed="'+(MT.b?'true':'false')+'">فروش'+(bh?(' — '+findH(bh).n):'')+'</button>'+
  '<button class="chip'+(MT.p?' on':'')+'" data-act="mtog" data-k="p" aria-pressed="'+(MT.p?'true':'false')+'">مکان‌های مهم</button>'+
  '</div><div class="maplegend"><span><i style="background:var(--brand)"></i>محله</span><span><i style="background:var(--info)"></i>محل کار / مکان</span><span><i style="background:var(--accent)"></i>مدرسه</span><span><i style="background:#475569"></i>آگهی</span></div><p class="note" style="margin-top:6px">روی نشانگرها کلیک کنید. «انتخاب این محله» فلوها را به‌روز می‌کند.</p></div>'+
  '<div class="card tight" style="margin-top:14px"><div class="ct">فاصله از مکان‌های مهم</div>'+
  ((rh||bh)?('<div class="note" style="margin-bottom:6px">از محلهٔ '+findH(rh||bh).n+(rh?' (انتخاب اجاره)':' (انتخاب خرید)')+'</div>'+placesHTML(rh||bh,8)):'<p class="note">برای دیدن فاصله‌ها، یک محله یا ملک را در فلوها انتخاب کنید.</p>')+'</div>'+
  '<div class="card tight" style="margin-top:14px"><div class="ct">مکان‌های مهم شما <span class="badge b-info">'+fa(placesCount(),0)+' مورد</span></div>'+
  (getPlaces().length?getPlaces().map(function(p){return '<div class="place-item"><div class="pi">'+ico(placeKindIcon(p.kind),16)+'</div><div style="flex:1;min-width:0"><b>'+esc(p.label)+'</b><small>'+esc(placeKindLabel(p.kind))+(p.hood?' · '+findH(p.hood).n:'')+'</small></div><button class="btn btn-xs" data-act="placeFocus" data-id="'+p.id+'">نمایش</button><button class="btn btn-xs" data-act="placeEdit" data-id="'+p.id+'">ویرایش</button><button class="btn btn-xs" data-act="placeDel" data-id="'+p.id+'">حذف</button></div>'}).join(''):'<div class="empty" style="padding:14px">هنوز مکانی ثبت نشده است. «افزودن مکان» را بزنید.</div>')+
  '<p class="note">همهٔ این مکان‌ها با یک منبع داده روی نقشه نمایش داده می‌شوند؛ برچسب عنوان، نوع و اولویت را خودتان تعیین می‌کنید.</p></div>'+
  '<div class="sec"><h3>محله‌ها</h3><span>۶ محلهٔ نمونه</span></div><div class="grid g3">'+
  HOODS.map(function(h){
    return '<div class="card tight"><div class="kv"><span><b>'+h.n+'</b></span><b>'+esc(placeText(h.id,1))+'</b></div>'+
    '<div class="note">اجاره نمونه '+rial(h.avgRent)+' • میانگین آگهی فروش هر متر '+rial(h.buyBase)+' ('+MARKET.asOf+')</div>'+
    '<div class="fs-actions" style="margin-top:8px"><button class="btn btn-xs btn-primary" data-act="msetH" data-h="'+h.id+'">انتخاب</button><button class="btn btn-xs" data-act="hinfo" data-h="'+h.id+'">اطلاعات</button><button class="btn btn-xs" data-act="hmap" data-h="'+h.id+'">نقشه</button></div></div>';
  }).join('')+'</div>';
  var m=mkMap('lfm',[35.755,51.40],11);
  if(!m)return;
  if(MT.p){getPlaces().forEach(function(p){var pl=placeLL(p);if(!pl)return;L.marker(pl,{zIndexOffset:1000,icon:pinIcon(p.kind==='family'?'family':(p.kind==='work'?'work':(p.kind==='school'?'school':'place')),p.label)}).addTo(m).bindPopup('<b>'+esc(p.label)+'</b><br>'+esc(placeKindLabel(p.kind))+(p.hood?' · '+findH(p.hood).n:'')+'<br><button class="btn btn-xs" data-act="placeFocus" data-id="'+p.id+'">جزئیات</button> <button class="btn btn-xs" data-act="placeEdit" data-id="'+p.id+'">ویرایش</button>');})}
  if(MT.h){
    HOODS.forEach(function(h){
      L.marker(h.ll,{icon:pinIcon('hood',h.n)}).addTo(m).bindPopup('<b>'+h.n+'</b><br>اجاره: '+rial(h.avgRent)+'<br>هر متر: '+rial(h.buyBase)+'<br><button class="btn btn-xs btn-primary" data-act="msetH" data-h="'+h.id+'">انتخاب این محله</button>');
    });
  }
  if(MT.r&&rh){
    RLIST.filter(function(x){return x.hood===rh}).forEach(function(x,i){
      var o=jll(i);
      L.marker([findH(rh).ll[0]+o[0],findH(rh).ll[1]+o[1]],{icon:pinIcon('listing',x.t)}).addTo(m).bindPopup('<b>'+x.t+'</b><br>'+rial(x.rent)+'<br><button class="btn btn-xs" data-act="vtour" data-id="'+x.id+'">تور مجازی</button>');
    });
  }
  if(MT.b&&bh){
    BLIST.filter(function(x){return x.hood===bh}).forEach(function(x,i){
      var o=jll(i);
      L.marker([findH(bh).ll[0]+o[0],findH(bh).ll[1]+o[1]],{icon:pinIcon('listing',x.t)}).addTo(m).bindPopup('<b>'+x.t+'</b><br>'+rial(x.m2*x.ppm)+'<br><button class="btn btn-xs btn-primary" data-view="buy">فلوی خرید</button>');
    });
  }
};
function openMapModal(ll,title,sub,hoodId,placeId){
  var places=placeDistances(hoodId||ll);
  var distBlock=places.length?('<div class="card tight" style="margin-top:12px"><div class="ct">فاصله تا مکان‌های مهم</div>'+placesHTML(hoodId||ll,10)+'</div>'):'';
  var pbtns=placeId?('<div class="fs-actions" style="margin-top:8px"><button class="btn btn-sm" data-act="placeEdit" data-id="'+placeId+'">ویرایش مکان</button><button class="btn btn-sm" data-act="placeDel" data-id="'+placeId+'">حذف مکان</button></div>'):'';
  openModal('<h3>'+esc(title)+'</h3><p class="note">'+sub+'</p><div id="lfm2" role="application" aria-label="نقشهٔ تعاملی"></div>'+distBlock+pbtns+'<button class="btn" data-act="closeModal" style="margin-top:10px">بستن</button>',function(){
    var m=mkMap('lfm2',ll,14);
    if(m){
      L.marker(ll,{zIndexOffset:2000,icon:pinIcon('pick',title)}).addTo(m).bindPopup('<b>'+esc(title)+'</b>').openPopup();
      getPlaces().forEach(function(p){
        if(placeId&&p.id===placeId)return;
        var pl=placeLL(p);if(!pl)return;
        L.marker(pl,{zIndexOffset:1000,icon:pinIcon(p.kind==='family'?'family':(p.kind==='work'?'work':(p.kind==='school'?'school':'place')),p.label)}).addTo(m).bindPopup('<b>'+esc(p.label)+'</b><br>'+placeKindLabel(p.kind));
      });
      setTimeout(function(){try{m.invalidateSize()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:111',e,'caught');}},260);
    }
  });
}
var PM={ll:null};
function openPickMap(title,cb){
  var hasL=!!window.L;
  var body='<h3>انتخاب '+esc(title)+'</h3><p class="note">'+(hasL?'روی نقشه کلیک کنید، سپس «ثبت موقعیت» را بزنید.':'نقشه در دسترس نیست؛ نزدیک‌ترین محله را به‌عنوان موقعیت انتخاب کنید.')+'</p>';
  body+=hasL?'<div id="lfm2" role="application" aria-label="نقشهٔ تعاملی"></div>':'<div class="chips" id="pmHoods" style="margin:10px 0">'+HOODS.map(function(h){return '<button class="chip" data-pmhood="'+h.id+'">'+h.n+'</button>'}).join('')+'</div>';
  body+='<div class="fs-actions" style="margin-top:10px"><button class="btn btn-primary" id="pmOk" disabled>ثبت موقعیت</button><button class="btn" data-act="closeModal">انصراف</button></div>';
  openModal(body,function(){
    PM.ll=null;
    var b=document.getElementById('pmOk');
    if(!hasL){
      $$('#pmHoods [data-pmhood]').forEach(function(ch){
        ch.addEventListener('click',function(){
          $$('#pmHoods [data-pmhood]').forEach(function(c){c.classList.remove('on');c.setAttribute('aria-pressed','false')});
          ch.classList.add('on');ch.setAttribute('aria-pressed','true');
          PM.ll=findH(ch.getAttribute('data-pmhood')).ll;
          if(b){b.disabled=false}
        });
      });
    }else{
      var m=mkMap('lfm2',[35.72,51.42],11);
      if(!m)return;
      var mk=null;
      m.on('click',function(e){
        if(mk){try{mk.remove()}catch(e2){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/maps-account.js:138',e2,'caught');}}
        mk=L.marker(e.latlng,{icon:pinIcon('pick',title)}).addTo(m);
        PM.ll=[e.latlng.lat,e.latlng.lng];
        if(b){b.disabled=false}
      });
    }
    if(b){
      b.onclick=function(){
        if(!PM.ll){toast('یک نقطه یا محله را انتخاب کنید');return}
        var ll=PM.ll;
        closeModal();
        if(cb){cb(ll)}
      };
    }
  });
}

/* ═══ ۱۸) حساب کاربری ═══ */
var ACC_TABS=[['overview','نمای کلی'],['wallet','کیف پول'],['plan','اشتراک و کلید'],['contracts','قراردادها'],['settings','تنظیمات']];
function accTab(){var t=S.ui.atab||'overview',i;for(i=0;i<ACC_TABS.length;i++){if(ACC_TABS[i][0]===t)return t}S.ui.atab='overview';return 'overview'}
function accBar(){
  var cur=accTab();
  return '<div class="acc-tabs" role="tablist" aria-label="بخش‌های حساب">'+ACC_TABS.map(function(t){
    return '<button class="acc-tab'+(cur===t[0]?' on':'')+'" role="tab" aria-selected="'+(cur===t[0]?'true':'false')+'" data-act="account" data-tab="'+t[0]+'">'+t[1]+'</button>';
  }).join('')+'</div>';
}
function tokenSpent(){var n=0;S.log.forEach(function(l){if(l.c<0)n+=-l.c});return n}
function activityRows(n){
  var rows=[];
  S.log.forEach(function(l){rows.push({t:l.t,d:l.d,amt:(l.c<0?'−':'+')+fa(Math.abs(l.c),0)+' کلید',cls:l.c<0?'out':'in'})});
  S.wlog.forEach(function(w){rows.push({t:w.t,d:w.d,amt:rial(Math.abs(w.a)),cls:w.a<0?'out':'in'})});
  rows.sort(function(a,b){return b.t-a.t});
  return rows.slice(0,n);
}
function activityHTML(n){
  var rows=activityRows(n);
  if(!rows.length)return '<div class="empty">هنوز تراکنشی ثبت نشده است.</div>';
  return '<div class="acc-list">'+rows.map(function(r){
    return '<div class="acc-row"><div class="main"><b>'+esc(r.d)+'</b><small>'+dt(r.t)+'</small></div><span class="amt '+r.cls+'">'+r.amt+'</span></div>';
  }).join('')+'</div>';
}
function contractWf(c){
  var w=c.wfId?wfOf(c.wfId):null;
  if(w)return w;
  var list=wfAll(c.kind),i,D;
  for(i=0;i<list.length;i++){
    D=list[i].data;
    if(D&&(D.code===c.code||(D.ctr&&D.ctr.draftCode===c.draftCode)))return list[i];
  }
  return null;
}
function contractActions(c){
  var w=contractWf(c),f=w?w.data:null,T=f?f.term:null,a='';
  var wfAttr=w?(' data-wf="'+qesc(w.id)+'" data-code="'+qesc(c.code)+'"'):'';
  if(w&&MODBY[w.m]){a+='<button class="btn btn-xs" data-act="wfOpen" data-m="'+w.m+'"'+wfAttr+'>فلوی این قرارداد</button>'}
  if(c.kind==='rent'&&f&&f.signed&&f.code===c.code){
    if(T&&T.paid){a='<span class="badge b-ok">تسویه کامل</span>'}
    else if(c.status==='signed_internal')a='<button class="btn btn-xs btn-primary" data-act="startTerm"'+wfAttr+'>'+(T?'ادامهٔ فسخ — '+fa(T.ph,0):'شروع فسخ')+'</button>';
  }
  return a;
}
function accountContractsHTML(){
  if(!S.contracts.length){
    return '<div class="empty"><b>قراردادی ثبت نشده است</b><div class="note">پس از امضا در فلوهای اجاره یا خرید، قرارداد در این بخش نمایش داده می‌شود.</div><button class="btn btn-sm btn-primary" style="margin-top:10px" data-act="newRequest">شروع یک فلو</button></div>';
  }
  return S.contracts.map(function(c,i){
    var snap=c.doc||null,st=snap&&CON_STATUS[snap.status]?CON_STATUS[snap.status]:null;
    return '<div class="card tight" style="margin-bottom:10px"><div class="kv"><span>'+esc(c.title)+'</span><b style="direction:ltr">'+esc(c.code||c.draftCode||'—')+'</b></div>'+
    '<div class="note">'+(snap?((snap.kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+' · '+dt(snap.date)):'بدون سند')+(st?' · <span class="badge '+st.c+'">'+st.l+'</span>':'')+'</div>'+
    '<div class="fs-actions" style="margin-top:8px">'+(snap?'<button class="btn btn-xs btn-primary" data-act="cdoc" data-i="'+i+'">مشاهدهٔ سند و PDF</button>':'')+(c.detail?'<button class="btn btn-xs" data-act="reqDetail" data-id="'+c.req+'">درخواست</button>':'')+contractActions(c)+
    '<button class="btn btn-xs" data-act="svcs">خدمات ملک</button></div></div>';
  }).join('');
}
function accountOverviewHTML(){
  var open=S.reqs.filter(reqOpen).length;
  var plan=S.sub?S.sub.name:'بدون بسته';
  var places=placesCount();
  return '<div class="acc-stats">'+
  '<div class="stat"><b>'+rial(S.wallet||0)+'</b><span>کیف پول قابل برداشت</span></div>'+
  '<div class="stat"><b>'+fa(S.tokens,0)+'</b><span>موجودی کلید</span></div>'+
  '<div class="stat"><b>'+esc(plan)+'</b><span>بستهٔ کلید</span></div>'+
  '<div class="stat"><b>'+fa(open,0)+'</b><span>درخواست جاری</span></div></div>'+
  '<div class="acc-hero" style="margin-top:16px">'+
  '<div class="card"><div class="ct">فعالیت اخیر</div>'+activityHTML(6)+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-xs" data-act="account" data-tab="wallet">کیف پول</button><button class="btn btn-xs" data-act="account" data-tab="plan">کلیدها</button></div></div>'+
  '<div class="card"><div class="ct">وضعیت حساب</div>'+
  '<div class="acc-id"><div class="acc-avatar">'+esc((S.auth.name||'؟').trim().charAt(0))+'</div><div class="acc-name"><b>'+esc(S.auth.name)+'</b><span style="direction:ltr;display:block">'+esc(S.auth.phone)+'</span></div></div>'+
  '<div class="kv"><span>بستهٔ کلید</span><b>'+(S.sub?esc(S.sub.name)+' — '+fa(S.sub.tokens,0)+' کلید':'ثبت نشده')+'</b></div>'+
  '<div class="kv"><span>مکان‌های مهم</span><b>'+fa(places,0)+' مورد</b></div>'+
  '<div class="kv"><span>قراردادها</span><b>'+fa(S.contracts.length,0)+' مورد</b></div>'+
  '<div class="acc-actions"><button class="btn btn-sm" data-act="account" data-tab="wallet">کیف پول</button><button class="btn btn-sm" data-act="account" data-tab="settings">ویرایش حساب</button></div></div></div>';
}
function accountWalletHTML(){
  var wl=S.wlog||[];
  var hist=wl.length?'<div class="tblwrap"><table class="tbl"><thead><tr><th>شرح</th><th>مبلغ</th><th>تاریخ</th></tr></thead><tbody>'+wl.slice(0,12).map(function(w){
    return '<tr><td>'+esc(w.d)+'</td><td><b style="color:'+(w.a<0?'var(--danger)':'var(--ok)')+'">'+rial(Math.abs(w.a))+'</b></td><td>'+dt(w.t)+'</td></tr>';
  }).join('')+'</tbody></table></div>':'<div class="empty">واریزی ثبت نشده است.</div>';
  return '<div class="acc-hero"><div class="card"><div class="ct">کیف پول تومانی</div><div class="acc-balance">'+rial(S.wallet||0)+'<small>موجودی قابل برداشت</small></div>'+
  '<div class="acc-actions"><button class="btn btn-sm btn-primary" data-act="wchat">شارژ کیف پول</button><button class="btn btn-sm" data-act="wdraw">برداشت وجه</button><button class="btn btn-sm" data-act="account" data-tab="plan">خرید کلید</button></div>'+
  '<p class="note" style="margin-top:10px">شارژ با درگاه نمایشی.</p></div>'+
  '<div class="card"><div class="ct">خلاصه</div><div class="kv"><span>تعداد واریز</span><b>'+fa(wl.filter(function(w){return w.a>0}).length,0)+' مورد</b></div>'+
  '<div class="kv"><span>تعداد برداشت</span><b>'+fa(wl.filter(function(w){return w.a<0}).length,0)+' مورد</b></div>'+
  '<div class="kv"><span>آخرین تراکنش</span><b>'+(wl.length?dt(wl[0].t):'—')+'</b></div></div></div>'+
  '<div class="card" style="margin-top:14px"><div class="ct">تاریخچهٔ کیف پول</div>'+hist+'</div>';
}
function accountPlanHTML(){
  var neg=tokenSpent();
  var sub=S.sub?('<div class="kv"><span>بسته</span><b>'+esc(S.sub.name)+'</b></div>'+
    '<div class="kv"><span>کلید واریزشده</span><b>'+fa(S.sub.tokens,0)+' کلید</b></div>'+
    '<div class="kv"><span>تاریخ خرید</span><b>'+dt(S.sub.at)+'</b></div>'+
    '<div class="kv"><span>تمدید خودکار</span><b>ندارد</b></div>'+
    '<p class="note">بسته‌ها یک‌باره واریز می‌شوند؛ تمدید خودکار یا کسر ماهانه در این نسخه وجود ندارد.</p>')
    :('<div class="empty"><b>بستهٔ کلیدی خریداری نشده</b><div class="note">برای استفاده از خدمات پولی، یکی از بسته‌های زیر را انتخاب کنید.</div></div>');
  return '<div class="acc-stats g3"><div class="stat"><b>'+fa(S.tokens,0)+'</b><span>موجودی کلید</span></div>'+
  '<div class="stat"><b>'+fa(neg,0)+'</b><span>مجموع مصرف کلید</span></div>'+
  '<div class="stat"><b>'+(S.sub?esc(S.sub.name):'—')+'</b><span>آخرین بستهٔ خریداری‌شده</span></div></div>'+
  '<div class="card" style="margin-top:16px"><div class="ct">اشتراک و بستهٔ کلید</div>'+sub+'</div>'+
  '<h4 class="mini">بسته‌های کلید</h4><div class="packs-row">'+PACKS.map(function(p,i){
    return '<div class="pack'+(p.best?' best':'')+'">'+(p.best?'<span class="badge-best">پیشنهاد</span>':'')+
    '<div class="pk">'+p.n+'</div><div class="pt">'+fa(p.tok,0)+' کلید</div><div style="font-size:13px;color:var(--ink2);margin-bottom:8px">'+rial(p.pr)+'</div><ul>'+p.f.map(function(f){return '<li>✓ '+f+'</li>'}).join('')+'</ul>'+
    '<button class="btn btn-primary" style="margin-top:12px" data-act="buypack" data-i="'+i+'">خرید</button></div>';
  }).join('')+'</div>'+
  '<details class="costs-box"><summary>تعرفهٔ شفاف خدمات و هزینه‌های بیرونی</summary><div class="costs-body">'+
  '<div class="ct">هزینهٔ ثابت کلیدی</div><div class="tblwrap"><table class="tbl"><thead><tr><th>خدمت</th><th>هزینه</th></tr></thead><tbody>'+
  Object.keys(COSTS).filter(function(k){return COSTS[k]>0}).map(function(k){return '<tr><td>'+COSTL[k]+'</td><td>'+fa(COSTS[k],0)+' کلید</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="kv"><span>تنظیم پیش‌نویس و PDF در محلینو</span><b>بدون هزینهٔ کلید</b></div>'+
  '<div class="kv"><span>ثبت رسمی در سامانه‌های دولتی</span><b>هزینهٔ بیرونی؛ جدا از کلید</b></div>'+
  '<div class="kv"><span>دفتر اسناد رسمی / مشاور املاک</span><b>متغیر و جدا از کلید</b></div>'+
  '<div class="kv"><span>خدمات ملک</span><b>در محلینو؛ مبلغ نهایی پیش از پرداخت</b></div>'+
  '<div class="kv"><span>مصرف واقعی شما</span><b>'+fa(neg,0)+' کلید</b></div>'+
  '<p class="note">هزینه‌های ثابت پیش از هر اقدام در همان فلو نمایش داده می‌شوند و از موجودی کسر می‌شوند. هزینه‌های بیرونی توسط ارائه‌دهنده تعیین می‌شوند و محلینو آن‌ها را دریافت نمی‌کند.</p></div></details>'+
  '<h4 class="mini">مصرف کلید</h4>'+(S.log.length?'<div class="tblwrap"><table class="tbl"><thead><tr><th>شرح</th><th>تغییر</th><th>تاریخ</th></tr></thead><tbody>'+S.log.slice(0,12).map(function(l){
    return '<tr><td>'+esc(l.d)+'</td><td><b style="color:'+(l.c<0?'var(--danger)':'var(--ok)')+'">'+(l.c<0?'−':'+')+fa(Math.abs(l.c),0)+' کلید</b></td><td>'+dt(l.t)+'</td></tr>';
  }).join('')+'</tbody></table></div>':'<div class="empty">مصرفی ثبت نشده است.</div>');
}
function accountSettingsHTML(){
  return '<div class="grid g2"><div class="card"><div class="ct">مشخصات حساب</div>'+
  '<div class="srow"><div class="slab"><span>نام</span></div><input class="inp" id="pf-name" aria-label="نام" value="'+qesc(S.auth.name)+'"></div>'+
  '<div class="srow"><div class="slab"><span>موبایل</span></div><input class="inp" value="'+qesc(S.auth.phone)+'" dir="ltr" readonly aria-label="موبایل"></div>'+
  '<button class="btn btn-primary" data-act="pname">ذخیرهٔ نام</button></div>'+
  '<div class="card"><div class="ct">داده‌ها و دسترسی</div><p class="note">اطلاعات این نسخه در مرورگر (localStorage) ذخیره می‌شود.</p>'+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn" data-act="logout">خروج از حساب</button><button class="btn btn-danger" data-act="reset">بازنشانی داده‌ها</button></div></div></div>'+
  '<div class="card" style="margin-top:14px"><div class="ct">مکان‌های مهم</div><p class="note">فاصلهٔ هر ملک تا این مکان‌ها به‌صورت فاصلهٔ خط مستقیم از مرکز محله نمایش داده می‌شود.</p>'+accountPlacesHTML()+'</div>';
}
function accountPlacesHTML(){
  var ps=getPlaces();
  var list=ps.length?ps.map(function(p){
    var loc=p.hood?('محلهٔ '+findH(p.hood).n):'نقطهٔ انتخاب‌شده روی نقشه';
    var prio=p.prio===1?['p1','اولویت بالا']:(p.prio===2?['p2','اولویت متوسط']:['p3','اولویت پایین']);
    return '<div class="place-item"><span class="pi">'+ico(placeKindIcon(p.kind),16)+'</span><div class="pm"><b>'+esc(p.label)+'</b><small>'+(placeKindSuffix(p)?placeKindSuffix(p).replace(' · ','')+' · ':'')+loc+'</small></div><span class="prio '+prio[0]+'">'+prio[1]+'</span>'+
    '<button class="btn btn-xs" data-act="placeEdit" data-id="'+p.id+'">ویرایش</button><button class="btn btn-xs btn-danger" data-act="placeDel" data-id="'+p.id+'" aria-label="حذف مکان">حذف</button></div>';
  }).join(''):'<div class="empty">هنوز مکانی ثبت نشده است.</div>';
  return '<div class="places-list">'+list+'</div>'+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-act="placeAdd">افزودن مکان مهم</button><button class="btn btn-sm" data-act="pickWork">انتخاب محل کار روی نقشه</button><button class="btn btn-sm" data-act="pickSchool">انتخاب مدرسه روی نقشه</button></div>'+
  '<p class="distnote">فاصلهٔ املاک تا این مکان‌ها به‌صورت خط مستقیم از مرکز محله محاسبه می‌شود و معادل زمان رانندگی یا پیاده نیست.</p>';
}
var PLACE_TMP=null,PLACE_SEARCH=[];
function readPlaceForm(){
  var el=function(id){return document.getElementById(id)};
  var p=PLACE_TMP||{};
  p.label=el('pl-label')?el('pl-label').value.replace(/^\s+|\s+$/g,''):p.label;
  p.kind=el('pl-kind')?el('pl-kind').value:p.kind;
  p.prio=el('pl-prio')?+el('pl-prio').value:(p.prio||2);
  p.hood=el('pl-hood')?el('pl-hood').value:(p.hood||null);
  return p;
}
function openPlaceModal(place){
  PLACE_TMP=place?JSON.parse(JSON.stringify(place)):{id:null,kind:'other',label:'',ll:null,hood:null,prio:2};
  var p=PLACE_TMP;
  var hoodOpts='<option value="">— انتخاب محله —</option>'+HOODS.map(function(h){return '<option value="'+h.id+'"'+(p.hood===h.id?' selected':'')+'>'+h.n+'</option>'}).join('');
  var kindOpts=[['work','محل کار'],['school','مدرسه / دانشگاه'],['family','خانواده'],['other','سایر']].map(function(k){
    return '<option value="'+k[0]+'"'+(p.kind===k[0]?' selected':'')+'>'+k[1]+'</option>';
  }).join('');
  var prioOpts=[[1,'بالا'],[2,'متوسط'],[3,'پایین']].map(function(k){return '<option value="'+k[0]+'"'+(p.prio===k[0]?' selected':'')+'>'+k[1]+'</option>'}).join('');
  var loc=p.hood?('محلهٔ '+findH(p.hood).n):(p.ll?('نقطه روی نقشه ('+fa(p.ll[0],3)+'، '+fa(p.ll[1],3)+')'):'هنوز انتخاب نشده');
  openModal('<h3>'+(p.id?'ویرایش مکان مهم':'افزودن مکان مهم')+'</h3><p class="note">این مکان برای نمایش فاصلهٔ املاک استفاده می‌شود. اولویت بالاتر در ابتدای فهرست نمایش داده می‌شود.</p>'+
  '<div class="grid g2"><div class="srow"><div class="slab"><span>عنوان</span></div><input class="inp" id="pl-label" aria-label="عنوان مکان" value="'+qesc(p.label||'')+'" placeholder="مثلاً محل کار، خانهٔ والدین"></div>'+
  '<div class="srow"><div class="slab"><span>نوع</span></div><select class="inp" id="pl-kind" aria-label="نوع مکان">'+kindOpts+'</select></div>'+
  '<div class="srow"><div class="slab"><span>اولویت</span></div><select class="inp" id="pl-prio" aria-label="اولویت مکان">'+prioOpts+'</select></div>'+
  '<div class="srow"><div class="slab"><span>محله</span></div><select class="inp" id="pl-hood" aria-label="محلهٔ مکان">'+hoodOpts+'</select></div></div>'+
  '<div class="srow"><div class="slab"><span>جستجوی نشانی / نام مکان</span></div><div style="display:flex;gap:6px"><input class="inp" id="pl-q" aria-label="جستجوی نشانی" placeholder="مثلاً دانشگاه تهران، بیمارستان میلاد..." style="flex:1"><button class="btn btn-sm" data-act="placeSearch">جستجو</button></div><div id="pl-results"></div><p class="note">جستجو با نقشهٔ عمومی انجام می‌شود؛ نتایج ممکن است ناقص یا قدیمی باشند.</p></div>'+
  '<div class="kv"><span>موقعیت</span><b>'+loc+'</b></div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-sm" data-act="placePick">انتخاب نقطه روی نقشه</button><button class="btn btn-sm btn-primary" data-act="placeSave">ذخیره</button><button class="btn btn-sm" data-act="closeModal">انصراف</button></div>');
}
VIEWS.sub=function(){S.ui.atab='plan';go('profile')};
VIEWS.profile=function(){
  var el=document.getElementById('v-profile');
  var t=accTab(),body='';
  if(t==='overview')body=accountOverviewHTML();
  else if(t==='wallet')body=accountWalletHTML();
  else if(t==='plan')body=accountPlanHTML();
  else if(t==='contracts')body=accountContractsHTML();
  else body=accountSettingsHTML();
  el.innerHTML='<div class="wtop"><div><h2>حساب کاربری</h2><p>کیف پول، بستهٔ کلید، قراردادها و تنظیمات در یک‌جا</p></div><div class="head-actions"><button class="btn btn-sm btn-primary" data-act="newRequest">درخواست جدید</button><button class="btn btn-sm" data-act="fcb">دستیار</button></div></div>'+accBar()+body;
  var p=document.getElementById('pf-name');
  if(p){p.addEventListener('keydown',function(e){if(e.key==='Enter'){ACT.pname()}})}
};

