/* ═══ ۱۶.۵) خدمات ملک — سفارش کامل داخل محلینو ═══ */
function svcDefaultAddress(){
  try{
    var r=wd('rent').data;if(r&&r.listing){var x=findL(r.listing);return x.t+'، '+findH(x.hood).n}
    var b=wd('buy').data;if(b&&b.blist){var y=findB(b.blist);return y.t+'، '+findH(y.hood).n}
    var p=getPlaces()[0];if(p)return p.label;
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/property-services.js:7',e,'caught');}
  return '';
}
function svcDefaultDate(){try{return new Date(Date.now()+86400000).toISOString().slice(0,10)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/property-services.js:10',e,'caught');return ''}}
function svcOrderFormHTML(ci,ii){
  var c=SVCS[ci],it=c?c.items[ii]:null;if(!c||!it)return '';
  var active=svcActiveOf(ci,ii);
  var h='<h3>'+esc(it.n)+'</h3><p class="note">'+esc(c.t)+' • '+svcPriceLabel(it)+' • '+esc(it.d)+'</p>';
  if(active){h+='<div class="alert al-warn">برای این خدمت سفارش فعال دارید. می‌توانید وضعیت آن را ببینید یا سفارش جدید ثبت کنید.</div><div class="fs-actions" style="margin:8px 0"><button class="btn btn-sm" data-act="svcReqOpen" data-id="'+active.id+'">مشاهدهٔ سفارش فعال</button></div>'}
  h+='<div class="card tight" style="margin-top:10px"><div class="ct">اطلاعات سفارش</div>';
  h+='<div class="srow"><div class="slab"><span>نشانی</span></div><input class="inp" id="so-addr" value="'+qesc(svcDefaultAddress())+'" placeholder="نشانی کامل محل خدمت"></div>';
  h+='<div class="grid g2"><div class="srow"><div class="slab"><span>تاریخ</span></div><input class="inp" id="so-date" type="date" value="'+svcDefaultDate()+'" min="'+svcDefaultDate()+'" style="direction:ltr;text-align:left"></div>';
  h+='<div class="srow"><div class="slab"><span>بازهٔ زمانی</span></div><select class="inp" id="so-slot">'+['۸ تا ۱۰','۱۰ تا ۱۲','۱۲ تا ۱۴','۱۶ تا ۱۸','۱۸ تا ۲۰'].map(function(x){return '<option>'+x+'</option>'}).join('')+'</select></div></div>';
  if(it.unit!=='fixed'){
    h+='<div class="srow"><div class="slab"><span>'+(it.unit==='m2'?'متراژ':'تعداد ساعت')+'</span></div><input class="inp" id="so-qty" type="number" min="'+it.min+'" step="'+it.step+'" value="'+it.min+'" style="direction:ltr;text-align:left"><span class="note" style="margin-inline-start:8px">'+(it.unit==='m2'?'متر مربع':'ساعت')+'</span></div>';
  }else{
    h+='<input type="hidden" id="so-qty" value="1">';
  }
  h+='<div class="srow"><div class="slab"><span>توضیح</span></div><textarea class="inp" id="so-notes" rows="2" placeholder="مشکل یا درخواست خاص..."></textarea></div>';
  if(it.note)h+='<p class="note">'+esc(it.note)+'</p>';
  h+='<div class="fs-actions" style="margin-top:10px"><button class="btn btn-primary" data-act="svcQuote" data-c="'+ci+'" data-i="'+ii+'">دریافت قیمت</button><button class="btn" data-act="closeModal">بستن</button></div>';
  h+='<div id="so-quote"></div><div id="so-pay"></div></div>';
  return h;
}
function svcReadForm(){
  function v(id){var e=document.getElementById(id);return e?e.value.replace(/^\s+|\s+$/g,''):''}
  var address=v('so-addr'),date=v('so-date'),slot=v('so-slot'),notes=v('so-notes'),qty=+v('so-qty')||1;
  if(address.length<8){toast('نشانی محل خدمت را کامل وارد کنید');return null}
  if(!date){toast('تاریخ را انتخاب کنید');return null}
  if(date<svcDefaultDate()){toast('تاریخ نمی‌تواند گذشته باشد');return null}
  return {address:address,date:date,slot:slot,notes:notes,qty:qty};
}
function svcQuoteHTML(q,canPay){
  return '<div class="card tight" style="margin-top:12px"><div class="ct">قیمت نهایی</div>'+
  '<div class="kv"><span>هزینهٔ پایه</span><b>'+rial(q.base)+'</b></div>'+
  (q.labour?'<div class="kv"><span>هزینهٔ کار</span><b>'+rial(q.labour)+'</b></div>':'')+
  '<div class="kv"><span>هزینهٔ خدمات محلینو</span><b>'+rial(q.fee)+'</b></div>'+
  '<div class="kv"><span>مبلغ قابل پرداخت</span><b style="color:var(--brand)">'+rial(q.total)+'</b></div>'+
  '<p class="note">پرداخت از کیف پول داخل محلینو انجام می‌شود.</p>'+
  (canPay?'<button class="btn btn-primary" style="margin-top:8px" data-act="svcPay" data-c="'+SVC_Q.ci+'" data-i="'+SVC_Q.ii+'">پرداخت و ثبت سفارش</button>':'')+'</div>';
}
function svcOrderTimeline(o){
  return '<div class="svc-tl">'+(o.timeline||[]).map(function(t){return '<div class="svc-tlrow"><span class="dot"></span><div><b>'+esc(svcStatusMeta(t.s).l)+'</b><small>'+dt(t.at)+(t.note?' — '+esc(t.note):'')+'</small></div></div>'}).join('')+'</div>';
}
function svcOrderDetailHTML(o){
  var it=svcItem(o.ci,o.ii);
  var h='<h3>'+esc(o.title)+'</h3><div class="chips" style="margin-bottom:9px">'+svcStatusBadge(o)+(o.demo?'<span class="badge b-info">نمایشی</span>':'')+'</div>';
  if(o.demo)h+='<div class="alert al-warn">این سفارش در حالت نمایشی ثبت شده است و به ارائه‌دهندهٔ واقعی ارسال نشده است.</div>';
  h+='<div class="grid g2"><div class="card tight"><div class="ct">جزئیات سفارش</div>'+
  '<div class="kv"><span>شناسهٔ سفارش</span><b style="direction:ltr">'+esc(o.id)+'</b></div>'+
  '<div class="kv"><span>نشانی</span><b>'+esc(o.address)+'</b></div>'+
  '<div class="kv"><span>زمان</span><b>'+esc(faDate(o.date))+' • '+esc(o.slot)+'</b></div>'+
  '<div class="kv"><span>مبلغ پرداخت‌شده</span><b>'+rial(o.amount)+'</b></div>'+
  (o.providerOrderId?'<div class="kv"><span>شمارهٔ پیگیری</span><b style="direction:ltr">'+esc(o.providerOrderId)+'</b></div>':'')+
  (it?'<div class="kv"><span>خدمت</span><b>'+esc(it.n)+'</b></div>':'')+
  '</div><div class="card tight"><div class="ct">روند سفارش</div>'+svcOrderTimeline(o)+'</div></div>';
  var canCancel=['submitted','accepted','scheduled'].indexOf(o.status)>=0;
  var canRetry=o.status==='submit_failed';
  var canRefund=['failed','rejected','cancelled','submit_failed'].indexOf(o.status)>=0&&!o.refunded;
  h+='<div class="fs-actions" style="margin-top:12px">'+
  (canCancel?'<button class="btn btn-sm" data-act="svcCancel" data-id="'+o.id+'">لغو و بازپرداخت</button>':'')+
  (canRetry?'<button class="btn btn-sm btn-primary" data-act="svcRetry" data-id="'+o.id+'">تلاش دوباره برای ثبت</button>':'')+
  (canRefund?'<button class="btn btn-sm" data-act="svcRefund" data-id="'+o.id+'">بازپرداخت به کیف پول</button>':'')+
  '<button class="btn btn-sm" data-act="svcSync" data-id="'+o.id+'">به‌روزرسانی وضعیت</button>'+
  '<button class="btn btn-sm" data-act="svcReceipt" data-id="'+o.id+'">رسید</button>'+
  '<button class="btn btn-sm" data-act="closeModal">بستن</button></div>';
  return h;
}
function openSvcOrderDetail(id){
  var o=svcOrderById(id);if(!o){toast('سفارش پیدا نشد');return}
  openModal(svcOrderDetailHTML(o));
}
function svcReceiptHTML(o){
  return '<div class="receipt" dir="rtl"><div class="rhead"><b>رسید سفارش خدمات</b><span>'+esc(o.id)+'</span></div><div class="rrow"><span>خدمت</span><b>'+esc(o.title)+'</b></div><div class="rrow"><span>نشانی</span><b>'+esc(o.address)+'</b></div><div class="rrow"><span>زمان</span><b>'+esc(faDate(o.date))+' • '+esc(o.slot)+'</b></div><div class="rrow"><span>مبلغ</span><b>'+rial(o.amount)+'</b></div><div class="rrow"><span>وضعیت</span><b>'+esc(svcStatusMeta(o.status).l)+'</b></div><div class="rfoot">محلینو — سامانهٔ جامع مسکن</div></div>';
}
var SVC_RECEIPT=null;
function printServiceReceipt(o){
  if(!o)return;
  var root=document.getElementById('print-root');
  if(!root){root=document.createElement('div');root.id='print-root';document.body.appendChild(root)}
  root.innerHTML=svcReceiptHTML(o);
  var old=document.title;document.title='رسید-'+o.id;document.body.classList.add('doc-printing');
  var done=function(){document.body.classList.remove('doc-printing');root.innerHTML='';document.title=old;window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  setTimeout(function(){try{window.print()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/property-services.js:91',e,'caught');}setTimeout(done,1200)},90);
}
VIEWS.svc=function(){
  var el=document.getElementById('v-svc');
  var f=S.ui.svcf||'active';if(['active','done','all'].indexOf(f)<0)f='active';
  var orders=S.svcOrders||[];
  var list=orders.filter(function(o){if(f==='active')return ['done','cancelled','refunded','rejected','failed'].indexOf(o.status)<0;if(f==='done')return o.status==='done';return true});
  var h='<div class="wtop"><div><h2>خدمات ملک</h2><p>سفارش، پرداخت و پیگیری خدمات خانه در محلینو</p></div><div class="head-actions"><button class="btn btn-sm" data-act="fcb">دستیار</button></div></div>';
  var cfg=svcCfg();
  if(cfg.catalogEndpoint&&!SVC_CATALOG.loaded&&!SVC_CATALOG.loading&&!SVC_CATALOG.failed){svcLoadCatalog().then(function(){if(CURRENT==='svc')renderCurrent()}).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/property-services.js:100',null,'caught');if(CURRENT==='svc')renderCurrent()})}
  if(svcIsDemo())h+='<div class="integration-note">در این نسخه سفارش‌ها به‌صورت نمایشی ثبت می‌شوند و به ارائه‌دهندهٔ واقعی ارسال نمی‌شوند.</div>';
  if(cfg.catalogEndpoint&&!SVC_CATALOG.loaded){h+='<div class="card tight"><div class="ct">دریافت خدمات</div><p class="note">'+(SVC_CATALOG.error||'در حال دریافت فهرست خدمات...')+'</p>'+(SVC_CATALOG.failed?'<button class="btn btn-sm" data-act="svcReload">تلاش دوباره</button>':'')+'</div>';}
  else h+='<div class="grid g2" style="margin-top:14px">'+SVCS.map(function(c,ci){
    return '<div class="card svc-cat"><h4 style="display:flex;align-items:center;gap:8px">'+ico(c.ic,18)+'<span>'+c.t+'</span></h4>'+
    '<p class="note" style="margin-bottom:4px">خدمات تأییدشده؛ سفارش و پرداخت در محلینو.</p>'+
    c.items.map(function(it,ii){
      return '<div class="svc-item"><div class="sdet"><b>'+esc(it.n)+'</b><small>★ '+it.r+' • '+svcPriceLabel(it)+' • '+esc(it.d)+'</small></div><button class="btn btn-xs" data-act="svcOpen" data-c="'+ci+'" data-i="'+ii+'">سفارش</button></div>';
    }).join('')+'</div>';
  }).join('')+'</div>';
  h+='<div class="sec"><h3>سفارش‌های من</h3><span>'+fa(list.length,0)+' مورد</span></div>';
  h+='<div class="seg" style="margin-bottom:12px">'+[['active','در جریان'],['done','انجام‌شده'],['all','همه']].map(function(x){return '<button class="'+(f===x[0]?'on':'')+'" data-act="svcFilter" data-f="'+x[0]+'" aria-pressed="'+(f===x[0]?'true':'false')+'">'+x[1]+'</button>'}).join('')+'</div>';
  if(!list.length){h+='<div class="empty"><b>سفارشی در این دسته نیست</b><div class="note">از خدمات بالا یک گزینه را انتخاب کنید.</div></div>'}
  else{
    h+='<div class="grid g2">'+list.map(function(o){
      var it=svcItem(o.ci,o.ii);
      return '<div class="card tight"><div class="kv"><span><b>'+esc(o.title)+'</b></span>'+svcStatusBadge(o)+'</div>'+
      '<div class="note">'+esc(faDate(o.date))+' • '+esc(o.slot)+(it?' • '+esc(svcPriceLabel(it)):'')+(o.demo?' • نمایشی':'')+'</div>'+
      '<div class="fs-actions" style="margin-top:8px"><button class="btn btn-xs btn-primary" data-act="svcReqOpen" data-id="'+o.id+'">پیگیری سفارش</button><span class="note">'+rial(o.amount)+'</span></div></div>';
    }).join('')+'</div>';
  }
  el.innerHTML=h;
};


