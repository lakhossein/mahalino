/* ═══ ۱۹) [حذف شد] سفر مشتری — در V0.9 حذف و در فلوها ادغام شد ═══ */

/* ═══ ۲۰) اقدامات ═══ */
var ACT={};
ACT.toastmsg=function(el){toast(el.getAttribute('data-msg'))};
ACT.closeModal=function(){closeModal()};
ACT.brand=function(){go('landing')};
ACT.chatNew=function(){
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];HIST=[];if(window.E22)E22.restoredId=null;S.liveHistory=[];save();ctxReset();window.E30_HIST_VISIBLE=120;if(window.E30&&E30.discAPI&&E30.discAPI.reset)E30.discAPI.reset();
  if(CURRENT!=='landing'){go('landing')}
  ceStartGate();
  toast('گفت‌وگوی جدید');
};
ACT.chatBack=function(){if(CE.f&&CE.hist.length){ceBack()}};
ACT.chatStop=function(){
  if(!CE.f){return}
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];
  if(window.E30&&E30.discAPI&&E30.discAPI.stop)E30.discAPI.stop();
  botC('گفت‌وگو بسته شد. مسیر فعلی شما حفظ شده است.',[['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]);
};
/* V0.27 — بازکردن/بستن سایدبار (جایگزین چت شناور) */
ACT.fcb=function(){if(CURRENT!=='landing'){go('landing')}};
var MODPICK=[['rent','اجاره'],['buy','خرید'],['grt','اجاره تضمینی'],['invr','درآمد اجاره'],['mkt','پروژه‌ها'],['build','ساخت و تأمین'],['stay','اقامتگاه']];
ACT.newRequest=function(){
  var h='<h3>درخواست جدید</h3><p class="note">یک مسیر را انتخاب کنید. در هر مسیر می‌توانید چند فلو را هم‌زمان باز نگه دارید؛ شروع یک فلو جدید، فلوهای در جریان یا قراردادهای فعال را متوقف نمی‌کند.</p><div class="panel-list" style="margin-top:10px">';
  h+=MODPICK.map(function(x){
    var n=runningWfs(x[0]).length,st=flowStateLabel(x[0]);
    var label=n?(fa(n,0)+' فلوی در جریان'):st.t;
    var cls=n?'b-warn':(st.cls||'b-info');
    return '<button class="panel-item" data-act="flowNew" data-m="'+x[0]+'"><span class="pi">'+ico(x[0],16)+'</span><span style="flex:1;text-align:start">'+x[1]+(n?('<small class="pil">فلوهای این مسیر: '+fa(wfShown(x[0]).length,0)+'</small>'):'')+'</span><span class="badge '+cls+'">'+label+'</span></button>';
  }).join('');
  h+='<button class="panel-item" data-act="svcs"><span class="pi">'+ico('svc',16)+'</span><span style="flex:1;text-align:start">خدمات ملک</span><span class="badge b-info">در محلینو</span></button>';
  h+='</div><div class="fs-actions" style="margin-top:12px"><button class="btn" data-act="dt" data-t="req">درخواست‌های من</button><button class="btn" data-act="closeModal">بستن</button></div>';
  openModal(h);
};
ACT.account=function(el){var t=(el&&el.getAttribute)?el.getAttribute('data-tab'):null;if(t){S.ui.atab=t;save()}if(CURRENT==='profile'){renderCurrent()}else{go('profile')}};
ACT.wallet=function(){S.ui.atab='wallet';save();if(CURRENT==='profile'){renderCurrent()}else{go('profile')}};
ACT.flowInChat=function(el){
  var m=el.getAttribute('data-m');
  if(m&&MODBY[m]){
    toggleF(true,true);
    setTimeout(function(){try{ceStart(m)}catch(e){}},60);
    toast('ادامهٔ «'+MODBY[m].t+'» در دستیار');
  }else{toggleF(true)}
};
ACT.openFlowSteps=function(el){
  var m=el.getAttribute('data-m');
  if(m&&MODBY[m]){toggleF(false);save();go(MODBY[m].v)}
};
ACT.sinv=function(el){S.ui.tab=el.getAttribute('data-t');save();if(CURRENT==='invest')renderCurrent();else go('invest')};
var SVC_Q=null;
ACT.svcs=function(){go('svc')};
ACT.svcOpen=function(el){openModal(svcOrderFormHTML(+el.getAttribute('data-c'),+el.getAttribute('data-i')))};
ACT.svcReqOpen=function(el){openSvcOrderDetail(el.getAttribute('data-id'))};
ACT.svcFilter=function(el){S.ui.svcf=el.getAttribute('data-f');save();renderCurrent()};
ACT.svcReload=function(){SVC_CATALOG.failed=false;SVC_CATALOG.loaded=false;SVC_CATALOG.error='';svcLoadCatalog().then(function(){if(CURRENT==='svc')renderCurrent()}).catch(function(){if(CURRENT==='svc')renderCurrent()})};
ACT.svcQuote=function(el){
  var ci=+el.getAttribute('data-c'),ii=+el.getAttribute('data-i'),it=svcItem(ci,ii),form=svcReadForm();
  if(!it||!form)return;
  if(it.unit!=='fixed'&&form.qty<it.min){toast('حداقل '+(it.unit==='m2'?'متراژ':'ساعت')+' '+fa(it.min,0)+' است');return}
  var box=document.getElementById('so-quote');if(box)box.innerHTML='<div class="note">در حال دریافت قیمت...</div>';
  svcQuote(ci,ii,form.qty,{date:form.date,slot:form.slot,address:form.address}).then(function(q){
    if(!q)throw new Error('quote');
    SVC_Q={ci:ci,ii:ii,form:form,q:q};
    if(box)box.innerHTML=svcQuoteHTML(q,true);
  }).catch(function(){if(box)box.innerHTML='<div class="alert al-bad">دریافت قیمت ممکن نشد؛ دوباره تلاش کنید.</div>'});
};
ACT.svcPay=function(el){
  var ci=+el.getAttribute('data-c'),ii=+el.getAttribute('data-i');
  if(!SVC_Q||SVC_Q.ci!==ci||SVC_Q.ii!==ii){toast('ابتدا قیمت را دریافت کنید');return}
  var formNow=svcReadForm();if(!formNow)return;
  if(JSON.stringify(formNow)!==JSON.stringify(SVC_Q.form)){toast('اطلاعات سفارش تغییر کرده است؛ لطفاً قیمت را دوباره دریافت کنید');return}
  var q=SVC_Q.q,form=SVC_Q.form;
  if((S.wallet||0)<q.total){
    openModal('<h3>موجودی کیف پول کافی نیست</h3><p class="note">مبلغ قابل پرداخت '+rial(q.total)+' است و موجودی کیف پول شما '+rial(S.wallet||0)+' است.</p><div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="svcGoWallet">کیف پول</button><button class="btn" data-act="closeModal">بستن</button></div>');
    return;
  }
  var btn=el;if(btn){btn.disabled=true;btn.textContent='در حال پرداخت...'}
  svcPayOrder(ci,ii,form,q).then(function(o){
    SVC_Q=null;save();if(CURRENT==='svc')renderCurrent();
    openSvcOrderDetail(o.id);
    if(o.status==='submit_failed')toast('پرداخت انجام شد اما ثبت سفارش ناموفق بود؛ امکان تلاش دوباره یا بازپرداخت وجود دارد.');
    else toast('سفارش ثبت شد — '+o.id);
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent='پرداخت و ثبت سفارش'}svcError('پرداخت انجام نشد؛ دوباره تلاش کنید')});
};
ACT.svcGoWallet=function(){closeModal();S.ui.atab='wallet';save();go('profile')};
ACT.svcSync=function(el){
  var o=svcOrderById(el.getAttribute('data-id'));if(!o)return;
  if(['done','cancelled','refunded','rejected','failed'].indexOf(o.status)>=0){toast('این سفارش بسته شده است');return}
  toast('در حال به‌روزرسانی...');
  svcPollProvider(o).then(function(r){
    if(r.status&&r.status!==o.status){svcTimelinePush(o,r.status,r.note||'');svcAudit(o,'status',{demo:!!r.demo});svcReqSync(o);save()}
    else{o.updatedAt=Date.now();save()}
    if(CURRENT==='svc')renderCurrent();openSvcOrderDetail(o.id);
  }).catch(function(){svcError('به‌روزرسانی وضعیت ممکن نشد؛ دوباره تلاش کنید')});
};
ACT.svcCancel=function(el){
  var o=svcOrderById(el.getAttribute('data-id'));if(!o)return;
  if(['submitted','accepted','scheduled'].indexOf(o.status)<0){addReq('svc','پشتیبانی','درخواست لغو سفارش '+o.id,'در انتظار','سفارش '+o.id+' در وضعیت '+svcStatusMeta(o.status).l);save();toast('درخواست لغو برای پشتیبانی محلینو ثبت شد');return}
  svcCancelProvider(o).then(function(){
    svcTimelinePush(o,'cancelled','لغو درخواست توسط کاربر');
    svcRefundOrder(o,'بازپرداخت کامل پس از لغو');
    svcReqSync(o);save();if(CURRENT==='svc')renderCurrent();openSvcOrderDetail(o.id);toast('سفارش لغو و مبلغ به کیف پول بازگشت');
  }).catch(function(){svcError('لغو سفارش ممکن نشد؛ دوباره تلاش کنید')});
};
ACT.svcRetry=function(el){
  var o=svcOrderById(el.getAttribute('data-id'));if(!o||o.status!=='submit_failed')return;
  svcSubmitToProvider(o).then(function(r){
    if(r.priceChanged&&r.amount&&r.amount!==o.amount){svcRefundOrder(o,'تغییر قیمت پیش از ثبت');svcTimelinePush(o,'price_changed','قیمت تغییر کرد؛ مبلغ بازپرداخت شد');}
    else{o.providerOrderId=r.providerOrderId||'';o.demo=!!r.demo;svcTimelinePush(o,r.status||'submitted',r.demo?'وضعیت نمایشی':'ثبت در ارائه‌دهنده');svcAudit(o,'retry',{demo:!!r.demo})}
    svcReqSync(o);save();if(CURRENT==='svc')renderCurrent();openSvcOrderDetail(o.id);toast('نتیجهٔ ثبت سفارش به‌روزرسانی شد');
  }).catch(function(){svcError('ثبت سفارش هنوز ناموفق است؛ بعداً دوباره تلاش کنید')});
};
ACT.svcRefund=function(el){
  var o=svcOrderById(el.getAttribute('data-id'));if(!o)return;
  if(o.refunded){toast('این سفارش قبلاً بازپرداخت شده است');return}
  svcRefundOrder(o,'بازپرداخت درخواستی کاربر');save();if(CURRENT==='svc')renderCurrent();openSvcOrderDetail(o.id);toast('مبلغ به کیف پول بازگشت');
};
ACT.svcReceipt=function(el){
  var o=svcOrderById(el.getAttribute('data-id'));if(!o)return;
  SVC_RECEIPT=o;
  openModal('<h3>رسید سفارش</h3><div class="doc-preview">'+svcReceiptHTML(o)+'</div><div class="fs-actions"><button class="btn btn-sm btn-primary" data-act="svcPrint">دریافت PDF (چاپ مرورگر)</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div>');
};
ACT.svcPrint=function(){if(SVC_RECEIPT)printServiceReceipt(SVC_RECEIPT)};
/* V0.27 — داشبورد حذف شد؛ درخواست‌ها مودال گفت‌وگومحور باز می‌شوند */
E27.reqModal=function(cat,f){
  cat=cat||S.ui.dcat||'rent';f=f||'all';
  S.ui.dcat=cat;save();
  var list=[],i;
  for(i=0;i<S.reqs.length;i++){
    var r=S.reqs[i];
    if(r.cat!==cat)continue;
    if(f==='open'&&(r.status==='کامل شد'||r.status==='لغو شد'))continue;
    if(f==='prog'&&r.status!=='در حال انجام')continue;
    if(f==='done'&&r.status!=='کامل شد')continue;
    list.push(r);
  }
  var h='<h3>درخواست‌های من</h3><div class="chips" style="margin:10px 0">'+SIDEFLOWS.map(function(x){
    return '<button class="chip'+(cat===x.cat?' on':'')+'" data-act="rmodCat" data-cat="'+x.cat+'" aria-pressed="'+(cat===x.cat)+'">'+x.n+' ('+fa(cntCat(x.cat,'all'),0)+')</button>';
  }).join('')+'</div>';
  h+='<div class="seg" style="margin-bottom:12px">'+[['all','همه'],['open','جاری'],['prog','در حال انجام'],['done','انجام‌شده']].map(function(x){
    return '<button class="'+(f===x[0]?'on':'')+'" data-act="rmodF" data-f="'+x[0]+'">'+x[1]+'</button>';
  }).join('')+'</div>';
  if(!list.length){
    h+='<div class="empty"><b>درخواستی در این دسته نیست</b><div class="note">از «گفت‌وگوی جدید» مسیر دلخواه را با دستیار شروع کنید.</div></div>';
  }else{
    h+='<div class="tblwrap"><table class="tbl"><thead><tr><th>عنوان</th><th>وضعیت</th><th>تاریخ</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>';
    list.slice(0,20).forEach(function(r2){
      var fv=MODBY[r2.cat]?MODBY[r2.cat].v:null;
      h+='<tr><td>'+esc(r2.title)+'</td><td>'+stB(r2.status)+'</td><td>'+dt(r2.t)+'</td><td><div class="fs-actions"><button class="btn btn-xs" data-act="reqDetail" data-id="'+r2.id+'">جزئیات</button>'+(fv?'<button class="btn btn-xs" data-cf="'+r2.cat+'">ادامه در گفت‌وگو</button>':'')+'</div></td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="newRequest">درخواست جدید</button><button class="btn" data-act="closeModal">بستن</button></div>';
  openModal(h);
};
ACT.reqModal=function(){E27.reqModal(S.ui.dcat||'rent',DASHF)};
ACT.rmodCat=function(el){E27.reqModal(el.getAttribute('data-cat'),DASHF)};
ACT.rmodF=function(el){DASHF=el.getAttribute('data-f');E27.reqModal(S.ui.dcat,DASHF)};
ACT.dt=function(el){var t=el.getAttribute('data-t'),c=el.getAttribute('data-cat');if(c){S.ui.dcat=c;save()}if(t==='wallet'||t==='tok'){S.ui.atab=(t==='tok'?'plan':'wallet');save();go('profile');return}if(t==='con'){S.ui.atab='contracts';save();go('profile');return}DASHF=(t==='req'?'open':'all');E27.reqModal(S.ui.dcat,DASHF)};
ACT.df=function(el){DASHF=el.getAttribute('data-f');E27.reqModal(S.ui.dcat,DASHF)};
ACT.dc=function(el){S.ui.dcat=el.getAttribute('data-cat');save();DASHF='req';E27.reqModal(S.ui.dcat,DASHF)};
ACT.dfc=function(el){S.ui.dcat=el.getAttribute('data-cat');DASHF=el.getAttribute('data-f');save();E27.reqModal(S.ui.dcat,DASHF)};
ACT.sfl=function(el){
  var c=el.getAttribute('data-cat');
  SIDEOPEN=(SIDEOPEN===c)?null:c;
  $$('.sflow').forEach(function(g){
    var on=(g.getAttribute('data-cat')===SIDEOPEN);
    g.classList.toggle('open',on);
    var b=g.querySelector('.sfh');
    if(b){b.setAttribute('aria-expanded',on?'true':'false')}
  });
};
ACT.menu=function(){setMenuOpen(!document.body.classList.contains('sideopen'))};
ACT.frTog=function(el){var m=el.getAttribute('data-m');S.ui['fr_'+m]=!S.ui['fr_'+m];save();renderCurrent()};
ACT.frF=function(el){var m=el.getAttribute('data-m');S.ui['frf_'+m]=el.getAttribute('data-f');save();renderCurrent()};
ACT.auSend=function(){
  var v=document.getElementById('au-phone').value.replace(/\s/g,'');
  if(v.length<10){toast('شماره را کامل وارد کنید');return}
  APH_PHONE=v;APH=1;VIEWS.auth();toast('کد ارسال شد — 1234');
};
ACT.auCheck=function(){
  var v=document.getElementById('au-otp').value.replace(/^\s+|\s+$/g,'');
  if(v==='1234'||v==='۱۲۳۴'){APH=2;VIEWS.auth()}else{toast('نامعتبر — 1234')}
};
ACT.auBack=function(){APH=0;VIEWS.auth()};
ACT.auDone=function(){
  var n=document.getElementById('au-name').value.replace(/^\s+|\s+$/g,'');
  if(!n){toast('نام را وارد کنید');return}
  doLogin(n);
};
ACT.auQuick=function(){APH_PHONE='09120000000';doLogin('کاربر آزمایشی')};
ACT.resume=function(el){
  var m=wfModOfCat(el.getAttribute('data-m')),id=el.getAttribute('data-wf');
  if(m==='invb'||m==='invr'){S.ui.tab=(m==='invb'?'b':'r')}
  if(id){wfSet(m,id);wfRebind(m)}
  save();go(MODBY[m].v);
};
ACT.wfSel=function(el){
  var m=wfModOfCat(el.getAttribute('data-m')),w=wfSet(m,el.getAttribute('data-wf'));
  if(!w){toast('این فلو پیدا نشد');return}
  wfRebind(m);
  renderCurrent();toast('«'+wfName(w)+'» فعال شد');
};
ACT.wfOpen=function(el){
  var m=wfModOfCat(el.getAttribute('data-m')),w=wfSet(m,el.getAttribute('data-wf'));
  if(!w||!MODBY[m]){toast('این فلو در دسترس نیست');return}
  if(m==='invr'){S.ui.tab='r'}
  wfRebind(m);
  go(MODBY[m].v);
};
ACT.wfManage=function(el){
  var m=wfModOfCat(el.getAttribute('data-m'));
  if(!m||!MODBY[m]){return}
  openModal(wfManageHTML(m));
};
ACT.wfCancel=function(el){
  var w=wfOf(el.getAttribute('data-wf'));
  if(!w){toast('این فلو پیدا نشد');return}
  var m=w.m,name=wfName(w),v=MODBY[m]?MODBY[m].v:null;
  wfCancel(w.id);
  closeModal();
  if(v){if(CURRENT===v){renderCurrent()}else{go(v)}}else{renderCurrent()}
  toast('«'+name+'» لغو شد؛ فلوهای دیگر این مسیر فعال می‌مانند');
};
ACT.wfDel=function(el){
  var w=wfOf(el.getAttribute('data-wf'));
  if(!w){toast('این فلو پیدا نشد');return}
  openModal('<h3>حذف «'+esc(wfName(w))+'»</h3><p class="note">فقط این فلو از فهرست حذف می‌شود و به فلوهای دیگر این مسیر کاری ندارد. درخواست‌ها و قراردادهای ثبت‌شده در بخش‌های خود باقی می‌مانند.</p>'+
  '<div class="fs-actions" style="margin-top:14px"><button class="btn btn-primary" data-act="wfDelOk" data-wf="'+w.id+'">حذف این فلو</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.wfDelOk=function(el){
  var w=wfOf(el.getAttribute('data-wf'));
  if(!w){closeModal();return}
  var m=w.m,name=wfName(w),v=MODBY[m]?MODBY[m].v:null;
  wfDelete(w.id);
  var live=wfLive(m);
  if(live.length){wfSet(m,live[0].id)}
  closeModal();openModal(wfManageHTML(m));
  if(v&&CURRENT===v){renderCurrent()}
  toast('«'+name+'» حذف شد');
};
ACT.frW=function(el){var m=el.getAttribute('data-m');S.ui['frw_'+m]=!S.ui['frw_'+m];save();renderCurrent()};
ACT.flowNew=function(el){
  var m=wfModOfCat(el.getAttribute('data-m'));
  if(!m||!MODBY[m]){return}
  var live=wfLive(m),inProg=live.filter(function(w){return !w.done&&w.step>1}).length;
  openModal('<h3>فلوی جدید — '+MODBY[m].t+'</h3>'+
  '<p class="note">یک گردش کار مستقل آغاز می‌شود؛ هر فلو بودجه، محله، ملک، قرارداد و درخواست‌های جداگانهٔ خود را دارد.'+
  (inProg?(' در این مسیر '+fa(inProg,0)+' فلوی در جریان دارید که دست‌نخورده می‌ماند.'):''+
  ' فلوهای کامل‌شده و درخواست‌های قبلی در بخش «درخواست‌ها» باقی می‌مانند.')+'</p>'+
  '<div class="fs-actions" style="margin-top:14px"><button class="btn btn-primary" data-act="flowNewOk" data-m="'+m+'">شروع فلو جدید</button>'+
  (wfAll(m).length>1?('<button class="btn" data-act="wfManage" data-m="'+m+'">فلوهای موجود</button>'):'')+
  '<button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.flowNewOk=function(el){
  var m=wfModOfCat(el.getAttribute('data-m'));
  if(!m||!MODBY[m])return;
  var w=wfNew(m);closeModal();
  go(MODBY[m].v);toast('«'+wfName(w)+'» آغاز شد — فلوهای دیگر این مسیر حفظ شدند');
};
ACT.reqDetail=function(el){
  var r=findReqById(el.getAttribute('data-id'));
  if(!r){toast('یافت نشد');return}
  var flowV=MODBY[r.cat]?MODBY[r.cat].v:null;
  var rw=r.wf?wfOf(r.wf):null;
  openModal('<h3>'+esc(r.title)+'</h3>'+
  '<div class="kv"><span>دسته</span><b>'+(CATL[r.cat]||r.cat)+'</b></div>'+
  '<div class="kv"><span>وضعیت</span><b>'+stB(r.status)+'</b></div>'+
  (rw?('<div class="kv"><span>فلو</span><b>'+esc(wfName(rw))+' — '+wfState(rw).t+'</b></div>'):'')+
  '<div class="kv"><span>تاریخ</span><b>'+dt(r.t)+'</b></div>'+
  (r.detail?('<div class="alert al-warn" style="margin-top:10px">'+esc(r.detail)+'</div>'):'')+
  '<div class="fs-actions" style="margin-top:12px">'+(rw?'<button class="btn btn-primary" data-act="wfOpen" data-m="'+rw.m+'" data-wf="'+rw.id+'">رفتن به این فلو</button>':(flowV?'<button class="btn btn-primary" data-view="'+flowV+'">رفتن به این فلو</button>':''))+'<button class="btn" data-act="closeModal">بستن</button></div>');
};
ACT.startTerm=function(el){
  var id=el&&el.getAttribute?el.getAttribute('data-wf'):null;
  if(id){wfSet('rent',id)}
  var d=wd('rent');
  if(!d.data.signed){toast('ابتدا قرارداد این فلو را امضا کنید');return}
  d.step=8;wfTouch(d);save();go('rent');
};
ACT.hinfo=function(el){hoodInfoModal(el.getAttribute('data-h'))};
ACT.hanalysis=function(el){
  var h=findH(el.getAttribute('data-h')),m=el.getAttribute('data-m')||'buy';
  if(window.E29){
    E29.pay.ask('hood_detail','تحلیل جامع محله',h.n,function(txn){
      var html=neighborhoodAnalysisHTML(h,m);
      var it=E29.libAPI.saveArtifact({type:'hood_analysis',title:'تحلیل جامع محلهٔ '+h.n,
        summary:'گزارش جامع بازار، دسترسی و تناسب محلهٔ '+h.n+(m==='rent'?' (نمای اجاره)':' (نمای خرید)'),
        artifact:{html:html,hood:h.id,mode:m},txnId:txn,tokenCost:COSTS.hood_detail||40});
      closeModal();
      openModal('<h3>تحلیل جامع محلهٔ '+h.n+'</h3>'+html);
      E29.bus.emit('analysis.completed',{title:'تحلیل محله آماده شد',msg:'گزارش جامع محلهٔ '+h.n+' در کتابخانه ذخیره شد.',libId:it.id,txn:txn});
    });
    return;
  }
  openModal('<h3>تحلیل محلهٔ '+h.n+'</h3>'+neighborhoodAnalysisHTML(h,m));
};
ACT.hmap=function(el){
  var h=findH(el.getAttribute('data-h'));
  openMapModal(h.ll,'محلهٔ '+h.n,'اجاره نمونه '+rial(h.avgRent)+' • میانگین آگهی هر متر '+rial(h.buyBase)+' ('+MARKET.asOf+') • '+esc(placeText(h.id,2)),h.id);
};
ACT.lmap=function(el){
  var x=findL(el.getAttribute('data-l'));
  openMapModal(findH(x.hood).ll,x.t,'اجاره '+rial(x.rent)+' • رهن '+rial(x.dep),x.hood);
};
ACT.bmap=function(el){
  var x=findB(el.getAttribute('data-l'));
  openMapModal(findH(x.hood).ll,x.t,'کل '+rial(x.m2*x.ppm),x.hood);
};
ACT.smap=function(el){
  var s=findS(el.getAttribute('data-id'));
  openMapModal(s.ll,s.t,s.acc,s.ll);
};
ACT.vtour=function(el){openTourModal(el.getAttribute('data-id'))};
ACT.troom=function(el){
  var i=+el.getAttribute('data-i');
  var pic=document.getElementById('tourpic');
  if(pic&&TOURX){pic.src='https://picsum.photos/seed/'+TOURX.seed+'-r'+i+'/1600/420'}
  TOURROT=0;drawTour();
  $$('[data-act="troom"]').forEach(function(c){
    c.className='chip'+(+c.getAttribute('data-i')===i?' on':'');
  });
};
ACT.mtog=function(el){MT[el.getAttribute('data-k')]=!MT[el.getAttribute('data-k')];renderCurrent()};
ACT.mapRetry=function(){renderCurrent();toast('در حال بارگذاری دوبارهٔ نقشه…')};
ACT.msetH=function(el){
  var id=el.getAttribute('data-h'),upd=[],w;
  w=wf('rent');if(w){w.data.hood=id;wfTouch(w);upd.push(wfName(w))}
  w=wf('buy');if(w){w.data.hood=id;wfTouch(w);upd.push(wfName(w))}
  save();
  toast(findH(id).n+(upd.length?(' در '+upd.join(' و ')+' انتخاب شد ✓'):' انتخاب شد ✓'));
  renderCurrent();
};
function placeRefresh(){if(CURRENT==='profile'||CURRENT==='map')renderCurrent();}
ACT.pickWork=function(){openPickMap('محل کار',function(ll){upsertPlace('work','محل کار',ll,null,1);MT.p=true;placeRefresh();toast('محل کار ثبت شد')})};
ACT.pickSchool=function(){openPickMap('مدرسه',function(ll){upsertPlace('school','مدرسه',ll,null,2);MT.p=true;placeRefresh();toast('مدرسه ثبت شد')})};
ACT.placeAdd=function(){openPlaceModal(null)};
ACT.placeEdit=function(el){var id=el.getAttribute('data-id'),ps=getPlaces(),i;for(i=0;i<ps.length;i++){if(ps[i].id===id){openPlaceModal(ps[i]);return}}};
ACT.placeDel=function(el){removePlace(el.getAttribute('data-id'));try{closeModal()}catch(e){}placeRefresh();toast('مکان حذف شد')};
ACT.placeFocus=function(el){var id=el.getAttribute('data-id'),ps=getPlaces(),p=null,i;for(i=0;i<ps.length;i++){if(ps[i].id===id){p=ps[i];break}}if(!p)return;var ll=placeLL(p);if(!ll){toast('موقعیت این مکان ثبت نشده است');return}openMapModal(ll,p.label,placeKindLabel(p.kind)+(p.hood?' · '+findH(p.hood).n:'')+' · این مکان با یک منبع داده روی نقشه نمایش داده می‌شود.',p.hood||null,p.id)};
ACT.placePick=function(){var p=readPlaceForm();closeModal();openPickMap('مکان مهم',function(ll){p.ll=ll;p.hood='';openPlaceModal(p)})};
ACT.placeSearch=function(){
  var p=readPlaceForm(),q=(document.getElementById('pl-q')||{}).value||'',box=document.getElementById('pl-results');
  q=q.replace(/^\s+|\s+$/g,'');
  if(q.length<3){toast('حداقل سه حرف برای جستجو وارد کنید');return}
  PLACE_TMP=p;
  if(box)box.innerHTML='<div class="note">در حال جستجو...</div>';
  fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ir&accept-language=fa&q='+encodeURIComponent(q+' تهران'))
    .then(function(r){return r.json()})
    .then(function(arr){
      PLACE_SEARCH=arr||[];
      if(!box)return;
      box.innerHTML=PLACE_SEARCH.length?PLACE_SEARCH.map(function(x,i){
        return '<button class="place-result" data-act="placeUse" data-i="'+i+'"><b>'+esc(x.name||x.display_name.split(',')[0])+'</b><small>'+esc(x.display_name)+'</small></button>';
      }).join(''):'<div class="note">نتیجه‌ای پیدا نشد. عبارت دیگری یا انتخاب روی نقشه را امتحان کنید.</div>';
    })
    .catch(function(){if(box)box.innerHTML='<div class="note">جستجوی بیرونی در دسترس نیست؛ از انتخاب محله یا نقطه روی نقشه استفاده کنید.</div>'});
};
ACT.placeUse=function(el){
  var i=+el.getAttribute('data-i'),x=PLACE_SEARCH[i],p=PLACE_TMP||readPlaceForm();
  if(!x)return;
  p.ll=[+x.lat,+x.lon];p.hood='';
  if(!p.label)p.label=(x.name||x.display_name||'').split(',')[0];
  openPlaceModal(p);
};
ACT.placeSave=function(){
  var p=readPlaceForm();
  if(!p.label){toast('عنوان مکان را وارد کنید');return}
  var hood=p.hood||null;
  if(hood){var h=findH(hood);if(h)p.ll=h.ll}
  if(!p.ll){toast('یک محله یا نقطه روی نقشه انتخاب کنید');return}
  var ps=initPlaces(),i,updated=false;
  if(p.id){
    for(i=0;i<ps.length;i++){if(ps[i].id===p.id){ps[i]={id:p.id,kind:p.kind,label:p.label,ll:p.ll,hood:hood,prio:p.prio};updated=true;break}}
  }
  if(!updated){
    for(i=0;i<ps.length;i++){var qll=placeLL(ps[i]);if(ps[i].label===p.label&&qll&&Math.abs(qll[0]-p.ll[0])<1e-6&&Math.abs(qll[1]-p.ll[1])<1e-6){ps[i]={id:ps[i].id,kind:p.kind,label:p.label,ll:p.ll,hood:hood,prio:p.prio};updated=true;break}}
    if(!updated)ps.push({id:'pl-'+Date.now()+'-'+Math.floor(Math.random()*999),kind:p.kind,label:p.label,ll:p.ll,hood:hood,prio:p.prio});
  }
  syncLegacyFromPlaces();MT.p=true;closeModal();placeRefresh();toast('مکان ذخیره شد');
};
ACT.pinfo=function(el){openProjectInfoModal(+el.getAttribute('data-i'))};
ACT.ptop=function(el){
  PTOPSEL[+el.getAttribute('data-i')]=el.getAttribute('data-k');
  openProjectInfoModal(+el.getAttribute('data-i'));
};
ACT.nprj=function(){
  openModal('<h3> ثبت پروژهٔ جدید</h3>'+
  '<p class="note">پیمانکار/کارفرما می‌تواند پروژهٔ جدید ثبت کند.</p>'+
  '<div class="srow"><div class="slab"><span>عنوان</span></div><input class="inp" id="np-t" placeholder="برج مسکونی ۸ طبقه"></div>'+
  '<div class="srow"><div class="slab"><span>موقعیت</span></div><input class="inp" id="np-loc" placeholder="تهران، ..."></div>'+
  '<div class="grid g2"><div class="srow"><div class="slab"><span>زیربنا (متر)</span></div><input class="inp" id="np-area" type="number" value="3000" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>مدت (ماه)</span></div><input class="inp" id="np-dur" type="number" value="18" style="direction:ltr;text-align:left"></div></div>'+
  '<div class="srow"><div class="slab"><span>بودجه (تومان)</span></div><input class="inp" id="np-amt" type="number" value="800000000" step="50000000" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>محدودهٔ کار</span></div><select class="inp" id="np-scope"><option>از صفر (گودبرداری)</option><option>ادامهٔ کار</option><option>بهسازی</option></select></div>'+
  '<button class="btn btn-primary" data-act="npOk">ثبت در مارکت‌پلیس</button> <button class="btn" data-act="closeModal">انصراف</button>');
};
ACT.npOk=function(){
  var t=document.getElementById('np-t').value.replace(/^\s+|\s+$/g,'').replace(/[<>]/g,'');
  var loc=document.getElementById('np-loc').value.replace(/^\s+|\s+$/g,'').replace(/[<>]/g,'');
  if(!t||!loc){toast('عنوان و موقعیت را وارد کنید');return}
  var area=+(document.getElementById('np-area').value||3000);
  var dur=+(document.getElementById('np-dur').value||18);
  var amt=10*Number(document.getElementById('np-amt').value||0);
  var scope=document.getElementById('np-scope').value;
  var p={t:t,loc:loc,emp:'کارفرما/ثبت: '+S.auth.name,fl:'طبقات طبق طرح',area:fa(area,0)+' متر',pre:'توافقی',score:'جدید',bids:0,dur:fa(dur,0)+' ماه',start:'پس از تأیید اسناد',scope:scope,lic:'بررسی اسناد',pay:'مرحله‌ای',hist:'ثبت شما',mine:true};
  PRJ.push(p);S.nprj.push(p);
  addReq('mkt','ثبت','ثبت «'+t+'»','در انتظار',fa(area,0)+' متر'+(amt?(' • '+rial(amt)):''));
  save();closeModal();renderCurrent();
  toast(' پروژه ثبت شد');
};
ACT.padd=function(el){
  var m=el.getAttribute('data-m'),D=wd(m).data;
  defP(D);
  var i=document.getElementById('pxnew'),w=document.getElementById('pxw');
  if(!i)return;
  var t=i.value.replace(/^\s+|\s+$/g,'');
  if(!t){toast('متن اولویت را بنویسید');return}
  D.P.extra.push({t:t,w:Math.min(5,Math.max(1,+((w&&w.value)||3)))});
  save();renderCurrent();toast('افزوده شد ✓');
};
ACT.pdel=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defP(D);
  D.P.extra.splice(+el.getAttribute('data-i'),1);
  D.P.PXH={};save();renderCurrent();
};
ACT.pxtgl=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defP(D);
  if(!D.P.PXH){D.P.PXH={}}
  var h=el.getAttribute('data-h'),i=+el.getAttribute('data-i');
  if(!D.P.PXH[h]){D.P.PXH[h]=[]}
  D.P.PXH[h][i]=!D.P.PXH[h][i];
  save();renderCurrent();
};
ACT.ppbeds=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defP(D);
  D.P.beds=+el.getAttribute('data-v');
  save();renderCurrent();
};
ACT.ppfloor=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defP(D);
  D.P.floor=el.getAttribute('data-v');
  save();renderCurrent();
};
ACT.prset=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defPR(D);
  D.PR[el.getAttribute('data-k')]=+el.getAttribute('data-v');
  save();renderCurrent();
};
ACT.prtog=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  defPR(D);
  var k=el.getAttribute('data-k');
  D.PR[k]=(D.PR[k]==='yes')?'no':'yes';
  save();renderCurrent();
};
ACT.hset=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  D.hood=el.getAttribute('data-id');
  save();renderCurrent();toast(findH(D.hood).n+' ✓');
};
ACT.hselC=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  D.hood=el.getAttribute('data-id');
  save();closeModal();renderCurrent();toast('از جدول ✓');
};
ACT.cmpHadd=function(el){
  var D=wd(el.getAttribute('data-m')).data;
  if(!D.cmpH){D.cmpH=[]}
  var id=el.getAttribute('data-id'),i=D.cmpH.indexOf(id);
  if(i>=0){D.cmpH.splice(i,1)}else{
    if(D.cmpH.length>=3){toast('حداکثر ۳');return}
    D.cmpH.push(id);
  }
  save();renderCurrent();
};
ACT.cmpHopen=function(el){
  var t=cmpHoodTable(el.getAttribute('data-m'));
  if(!t){toast('حداقل ۲ محله');return}
  openModal('<h3> مقایسهٔ محله‌ها</h3>'+t+'<button class="btn" data-act="closeModal" style="margin-top:12px">بستن</button>');
};
ACT.cmpLopen=function(){cmpListModal('rent')};
ACT.cmpBopen=function(){cmpListModal('buy')};
ACT.lsave=function(el){
  var D=wd('rent').data;
  if(!D.saved){D.saved=[]}
  var id=el.getAttribute('data-id'),i=D.saved.indexOf(id);
  if(i>=0){D.saved.splice(i,1)}else{D.saved.push(id)}
  save();renderCurrent();toast((i>=0?'حذف':'★'));
};
ACT.bsave=function(el){
  var D=wd('buy').data;
  if(!D.savedB){D.savedB=[]}
  var id=el.getAttribute('data-id'),i=D.savedB.indexOf(id);
  if(i>=0){D.savedB.splice(i,1)}else{D.savedB.push(id)}
  save();renderCurrent();toast((i>=0?'حذف':'★'));
};
ACT.stsave=function(el){
  var D=wd('stay').data;
  if(!D.savedS){D.savedS=[]}
  var id=el.getAttribute('data-id'),i=D.savedS.indexOf(id);
  if(i>=0){D.savedS.splice(i,1)}else{D.savedS.push(id)}
  save();renderCurrent();toast((i>=0?'حذف':'★'));
};
ACT.rdet=function(el){
  var x=findL(el.getAttribute('data-id'));
  if(!spend('detail','rent','جزئیات '+x.t))return;
  openModal('<div style="margin:-6px -6px 10px;border-radius:12px;overflow:hidden;height:170px">'+ph(x.seed,600,375,'')+'</div><h3>'+x.t+'</h3><p class="note"> '+findH(x.hood).n+' · '+SRC[(x&&x.src)||'mahalino'].l+' · مالکیت: استعلام رسمی لازم است</p>'+
  '<div class="kv"><span>اجاره / رهن</span><b>'+rial(x.rent)+' / '+rial(x.dep)+'</b></div>'+
  '<div class="kv"><span>متراژ / عمر / طبقه / خواب</span><b>'+fa(x.m2,0)+' / '+fa(x.age,0)+' / '+fa(x.floor,0)+' / '+fa(x.beds,0)+'</b></div>'+
  '<div class="mini" style="margin-top:10px">فاصله تا مکان‌های مهم</div>'+placesHTML(x.hood,10)+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+
  '<button class="btn btn-primary" data-act="rset" data-id="'+x.id+'">انتخاب</button>'+
  '<button class="btn" data-act="vtour" data-id="'+x.id+'"> تور ۳۶۰°</button>'+
  '<button class="btn" data-act="lsave" data-id="'+x.id+'">☆</button>'+
  '<button class="btn" data-act="lmap" data-l="'+x.id+'" aria-label="نمایش روی نقشه">نقشه</button></div>'+
  '<button class="btn" data-act="closeModal" style="margin-top:8px">بستن</button>');
};
ACT.bdet=function(el){
  var x=findB(el.getAttribute('data-id'));
  if(!spend('detail','buy','جزئیات '+x.t))return;
  openModal('<div style="margin:-6px -6px 10px;border-radius:12px;overflow:hidden;height:170px">'+ph(x.seed,600,375,'')+'</div><h3>'+x.t+'</h3><p class="note"> '+findH(x.hood).n+' · '+SRC[(x&&x.src)||'mahalino'].l+' · مالکیت: استعلام رسمی لازم است</p>'+
  '<div class="kv"><span>کل</span><b>'+rial(x.m2*x.ppm)+'</b></div>'+
  '<div class="kv"><span>هر متر / متراژ / عمر / طبقه</span><b>'+rial(x.ppm)+' / '+fa(x.m2,0)+' / '+fa(x.age,0)+' / '+fa(x.floor,0)+'</b></div>'+
  '<div class="mini">فاصله تا مکان‌های مهم</div>'+placesHTML(x.hood,10)+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+
  '<button class="btn btn-primary" data-act="bset" data-id="'+x.id+'">انتخاب</button>'+
  '<button class="btn" data-act="bsave" data-id="'+x.id+'">☆</button>'+
  '<button class="btn" data-act="bmap" data-l="'+x.id+'" aria-label="نمایش روی نقشه">نقشه</button></div>'+
  '<button class="btn" data-act="closeModal" style="margin-top:8px">بستن</button>');
};
ACT.sdet=function(el){stayDetailModal(el.getAttribute('data-id'))};
ACT.rset=function(el){
  var D=wd('rent').data;
  D.listing=el.getAttribute('data-id');
  save();closeModal();renderCurrent();toast('انتخاب ✓');
};
ACT.bset=function(el){
  var D=wd('buy').data;
  D.blist=el.getAttribute('data-id');
  save();closeModal();renderCurrent();toast('انتخاب ✓');
};
ACT.schoose=function(el){
  var D=wd('stay').data;
  D.stay=el.getAttribute('data-id');
  save();closeModal();renderCurrent();toast('انتخاب ✓');
};
ACT.ralert=function(){
  var D=wd('rent').data;
  if(D.alerted){toast('فعال است');return}
  D.alerted=true;save();toast(' فعال شد');
  setTimeout(function(){
    var has=false,i;
    for(i=0;i<RLIST.length;i++){if(RLIST[i].id==='r9')has=true}
    if(!has){
      RLIST.push({id:'r9',hood:D.hood,seed:'anew',t:'۷۲ متری — جدید',rent:Math.round(findH(D.hood).avgRent*0.92),dep:Math.round(findH(D.hood).avgDep*0.9),m2:72,age:3,floor:4,beds:2,elev:true,park:true,balc:true,rate:4.4,n:9,av:{'شنبه':['۱۰:۰۰','۱۶:۰۰'],'سه‌شنبه':['۱۱:۰۰']}});
    }
    toast(' آگهی جدید اضافه شد');
    if(CURRENT==='rent')renderCurrent();
  },3000);
};
ACT.vday=function(el){var D=wd('rent').data;D.vday=el.getAttribute('data-v');D.vtime=null;save();renderCurrent()};
ACT.vtime=function(el){var D=wd('rent').data;D.vtime=el.getAttribute('data-v');save();renderCurrent()};
ACT.rvisit=function(){doRentVisit()};
ACT.vchk=function(el){
  var D=wd('rent').data;
  defVlist(D);
  var i=+el.getAttribute('data-i');
  if(D.vlist[i]){D.vlist[i].ok=!D.vlist[i].ok;save();renderCurrent()}
};
ACT.vdel=function(el){
  var D=wd('rent').data;
  var i=+el.getAttribute('data-i');
  if(D.vlist[i]){D.vlist.splice(i,1);save();renderCurrent();toast('حذف شد')}
};
ACT.vadd=function(){
  var i=document.getElementById('vnew');
  if(!i)return;
  var v=i.value.replace(/^\s+|\s+$/g,'');
  if(!v){toast('متن را بنویسید');return}
  var D=wd('rent').data;
  defVlist(D);
  D.vlist.push({t:v,ok:false});
  save();if(CURRENT==='profile')renderCurrent();else renderTok();toast('ذخیره شد');
};
ACT.cdur=function(el){var D=wd('rent').data;D.dur=el.getAttribute('data-v');save();renderCurrent()};
ACT.rep=function(el){
  var D=wd('rent').data,k=el.getAttribute('data-k');
  if(CURRENT==='rent'&&D.ctr&&D.ctr.step===3)conCapture(D);
  if(!D.rep){D.rep={}}
  D.rep[k]=(D.rep[k]==='o')?'t':'o';
  save();renderCurrent();
};
function conCapture(D,kind){
  kind=kind||conKind();
  var c=conInit(D,kind);
  function v(id){var e=document.getElementById(id);return e?e.value.replace(/^\s+|\s+$/g,''):null}
  if(document.getElementById('cl-name')){
    var ln=v('cl-name'),li=(v('cl-id')||'').replace(/\D/g,''),lm=(v('cl-mobile')||'').replace(/\D/g,'');
    var on=v('co-name'),oi=(v('co-id')||'').replace(/\D/g,''),om=(v('co-mobile')||'').replace(/\D/g,'');
    if(ln)c.parties.lessee.name=ln;if(li)c.parties.lessee.id=li;if(lm)c.parties.lessee.mobile=lm;
    if(on)c.parties.lessor.name=on;if(oi)c.parties.lessor.id=oi;if(om)c.parties.lessor.mobile=om;
    c.parties.witnesses=[{name:v('cw1n')||'',mobile:(v('cw1m')||'').replace(/\D/g,'')},{name:v('cw2n')||'',mobile:(v('cw2m')||'').replace(/\D/g,'')}];
  }
  if(document.getElementById('cp-postal')){
    var po=(v('cp-postal')||'').replace(/\D/g,''),ar=+v('cp-area');
    if(po)c.prop.postal=po;if(ar)c.prop.area=ar;if(v('cp-addr')!==null)c.prop.addr=v('cp-addr');
    if(kind==='rent'){
      if(v('cp-start'))c.terms.start=v('cp-start');if(v('cp-dur'))c.terms.duration=v('cp-dur');
      var dp=10*Number(v('cp-dep')),rn=10*Number(v('cp-rent'));if(v('cp-dep'))c.terms.deposit=dp;if(v('cp-rent'))c.terms.rent=rn;
      if(v('cp-pay'))c.terms.paymentDay=v('cp-pay');
    }else{
      var pr=10*Number(v('cp-price'));if(pr)c.terms.price=pr;if(v('cp-delivery'))c.terms.delivery=v('cp-delivery');if(v('cp-payment'))c.terms.payment=v('cp-payment');
    }
    if(v('cp-notes')!==null)c.terms.notes=v('cp-notes');
  }
  return c;
}
ACT.cback=function(){
  var ctx=conCtx(),c=conCapture(ctx.D,ctx.kind);
  c.step=Math.max(1,(c.step||1)-1);save();renderCurrent();
};
ACT.lookupId=function(el){
  var ctx=conCtx();conCapture(ctx.D,ctx.kind);
  lookupIdentity(ctx.D,el.getAttribute('data-r'));
};
ACT.lookupPostal=function(){
  var ctx=conCtx();conCapture(ctx.D,ctx.kind);
  lookupPostal();
};
ACT.cpartySave=function(){
  var ctx=conCtx(),c=conCapture(ctx.D,ctx.kind);
  function v(id){var e=document.getElementById(id);return e?e.value.replace(/^\s+|\s+$/g,''):''}
  var ln=v('cl-name'),li=v('cl-id').replace(/\D/g,''),lm=v('cl-mobile').replace(/\D/g,'');
  var on=v('co-name'),oi=v('co-id').replace(/\D/g,''),om=v('co-mobile').replace(/\D/g,'');
  if(!ln||lm.length<11||!on||om.length<11){toast('نام و موبایل هر دو طرف را کامل کنید');return}
  if(!validNationalId(li)){toast('کد ملی شما معتبر نیست');return}
  if(!validNationalId(oi)){toast('کد ملی طرف مقابل معتبر نیست');return}
  c.parties.lessee={name:ln,id:li,mobile:lm};
  c.parties.lessor={name:on,id:oi,mobile:om};
  c.parties.witnesses=[{name:v('cw1n'),mobile:v('cw1m').replace(/\D/g,'')},{name:v('cw2n'),mobile:v('cw2m').replace(/\D/g,'')}];
  if(c.verify.me==='none')c.verify.me='format';
  ctx.D.owner=on;ctx.D.oph=om;
  c.step=2;save();renderCurrent();
};
ACT.cpropSave=function(){
  var ctx=conCtx(),c=conCapture(ctx.D,ctx.kind);
  function v(id){var e=document.getElementById(id);return e?e.value.replace(/^\s+|\s+$/g,''):''}
  var postal=v('cp-postal').replace(/\D/g,''),addr=v('cp-addr'),area=+v('cp-area');
  if(!validPostalCode(postal)){toast('کد پستی باید ۱۰ رقم و معتبر باشد');return}
  if(!addr){toast('نشانی را وارد کنید');return}
  if(!area||area<10){toast('متراژ را درست وارد کنید');return}
  c.prop.postal=postal;c.prop.addr=addr;c.prop.area=area;
  if(ctx.kind==='rent'){
    var depText=v('cp-dep'),rentText=v('cp-rent'),dep=10*Number(depText),rent=10*Number(rentText);
    if(!depText||!rentText||!Number.isFinite(dep)||!Number.isFinite(rent)||dep<0||rent<0||(dep===0&&rent===0)){toast('مبلغ‌های ودیعه و اجاره را درست وارد کنید؛ رهن کامل با اجارهٔ صفر پذیرفته است');return}
    c.terms.start=v('cp-start');if(!c.terms.start){toast('تاریخ شروع را انتخاب کنید');return}
    c.terms.duration=v('cp-dur')||'یک‌ساله';c.terms.deposit=dep;c.terms.rent=rent;c.terms.paymentDay=v('cp-pay')||'پنجم هر ماه';
    ctx.D.B=ctx.D.B||{};ctx.D.B.depB=dep;ctx.D.dur=c.terms.duration;
  }else{
    var price=10*Number(v('cp-price')),delivery=v('cp-delivery');
    if(!price){toast('قیمت را وارد کنید');return}
    if(!delivery){toast('تاریخ تحویل را انتخاب کنید');return}
    c.terms.price=price;c.terms.delivery=delivery;c.terms.payment=v('cp-payment')||'مرحله‌ای';
    ctx.D.price=price;
  }
  c.terms.notes=v('cp-notes');c.step=3;save();renderCurrent();toast('اطلاعات ذخیره شد');
};
ACT.capprove=function(){
  var ctx=conCtx(),c=conCapture(ctx.D,ctx.kind);
  var me=document.getElementById('ca-me'),ow=document.getElementById('ca-owner');
  var mn=(document.getElementById('ca-me-name')||{}).value||'',on=(document.getElementById('ca-owner-name')||{}).value||'';
  if(!me||!me.checked||!ow||!ow.checked){toast('تأیید هر دو طرف را علامت بزنید');return}
  if(!mn.replace(/\s/g,'')||!on.replace(/\s/g,'')){toast('نام تأییدکنندگان را وارد کنید');return}
  c.appr.me=true;c.appr.owner=true;c.appr.meName=mn;c.appr.ownerName=on;c.step=4;
  save();renderCurrent();
};
ACT.cfinalize=function(){
  var ctx=conCtx();
  if(window.E29&&(COSTS.contract_draft||0)>0){
    E29.pay.ask('contract_draft','پیش‌نویس قرارداد','',function(txn){
      window.__v29conTxn=txn;
      conFinalize(ctx.D,ctx.kind);
    });
    return;
  }
  conFinalize(ctx.D,ctx.kind);
};
ACT.cdoc=function(el){
  var i=el.getAttribute('data-i'),snap=null;
  if(i==='cur'){var k=conKind();snap=conSnapshot(wd(k).data,k)}
  else{var q=S.contracts[+i];snap=q&&q.doc?q.doc:null}
  if(!snap){toast('سندی برای این قرارداد ذخیره نشده است');return}
  DOC_SNAP=snap;
  openModal('<h3>سند قرارداد</h3><div class="note">'+(snap.kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+' • '+esc(snap.code||snap.draftCode)+'</div><div class="doc-actions"><button class="btn btn-sm btn-primary" data-act="cprint">دریافت PDF (چاپ مرورگر)</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div><div class="doc-preview" style="max-height:62vh">'+contractDocHTML(snap,false)+'</div>');
};
ACT.cprint=function(){
  if(!DOC_SNAP){var k=conKind();DOC_SNAP=conSnapshot(wd(k).data,k)}
  toast('در پنجرهٔ چاپ، «ذخیره به‌صورت PDF» را انتخاب کنید');
  printContract(DOC_SNAP);
};
ACT.bcon=function(){
  var D=wd('buy').data;
  D.ctrActive=true;D.ctr=conInit(D,'buy');D.ctr.step=1;save();renderCurrent();toast('فرم قرارداد خرید باز شد');
};
ACT.rdone=function(){
  var d=wd('rent');
  if(d.done)return;
  d.done=true;addReq('rent','وضعیت','فعال — پایان','کامل شد');save();renderCurrent();
};
ACT.rreset=function(){var d=wd('rent');d.step=1;d.data={};d.done=false;d.updatedAt=Date.now();save();renderCurrent();toast('این فلو از ابتدا آغاز شد؛ فلوهای دیگر دست‌نخورده‌اند')};
ACT.tstart=function(){wd('rent').data.term={ph:1,who:'مستأجر (شما)'};save();renderCurrent()};
ACT.tdel=function(){
  var D=wd('rent').data;
  if(D.term&&D.term.rid)setReq(D.term.rid,'لغو شد');
  D.term=null;save();renderCurrent();toast('حذف شد');
};
ACT.twho=function(el){wd('rent').data.term.who=el.getAttribute('data-v');save();renderCurrent()};
ACT.treason=function(el){var T=wd('rent').data.term;T.reason=el.getAttribute('data-v');T.rtxt='';save();renderCurrent()};
ACT.tdate=function(el){var T=wd('rent').data.term;T.date=el.getAttribute('data-v');T.dtxt='';save();renderCurrent()};
ACT.treq=function(){
  var D=wd('rent').data,T=D.term;
  var rt=document.getElementById('treasontxt'),dt2=document.getElementById('tdatetxt');
  if(rt){T.rtxt=rt.value.replace(/^\s+|\s+$/g,'')}
  if(dt2){T.dtxt=dt2.value.replace(/^\s+|\s+$/g,'')}
  var reason=T.rtxt||T.reason,date=T.dtxt||T.date;
  if(!reason||!date){toast('دلیل و زمان را کامل کنید');return}
  T.reason=reason;T.date=date;T.ph=2;
  T.rid=addReq('rent','فسخ','فسخ '+D.code+' — '+reason,'در انتظار','تخلیه: '+date);
  save();renderCurrent();
};
ACT.tsend=function(){
  var D=wd('rent').data,T=D.term;
  var t=document.getElementById('tmin');
  if(t){T.min=t.value}
  if(!T.min){toast('متن خالی است');return}
  T.ph=3;save();renderCurrent();toast('ارسال شد');
};
ACT.totp=function(){
  var D=wd('rent').data,T=D.term;if(!T)return;
  T.ok=true;T.ph=4;if(T.rid)setReq(T.rid,'تأیید شد');
  save();renderCurrent();toast('تأیید موجر به‌صورت اعلامی ثبت شد');
};
ACT.tai=function(){
  var T=wd('rent').data.term;
  T.wait=true;save();renderCurrent();
  setTimeout(function(){
    T.wait=false;T.ai=true;T.ph=5;save();renderCurrent();toast('کسر: صفر');
  },1400);
};
ACT.tpay=function(){
  var d=wd('rent'),D=d.data,T=D.term;
  if(!T||T.paid)return;
  T.paid=true;d.done=true;
  if(T.rid)setReq(T.rid,'کامل شد');
  addReq('rent','تسویه','۱۰۰٪ ودیعه '+D.code,'کامل شد','کسر: صفر (AI)');
  E28.applyTermination(D.code); /* V0.28: امضاشده (داخلی) → فسخ‌شده */
  save();renderCurrent();toast('ودیعه واریز ✓');
};
ACT.blsel=function(el){wd('buy').data.lsel=el.getAttribute('data-k');save();renderCurrent()};
ACT.blegal=function(){
  var D=wd('buy').data;
  if(!D.lsel)return;
  if(!spend('legal','buy','گزارش '+LGD[D.lsel].lbl))return;
  D.legal=D.lsel;
  addReq('buy','حقوقی','گزارش '+LGD[D.lsel].lbl,'کامل شد',LGD[D.lsel].est);
  save();renderCurrent();
};
ACT.payN=function(el){
  var D=wd('buy').data;
  defPay(D);
  D.pay.n=+el.getAttribute('data-v');
  var p=[],base=Math.floor(100/D.pay.n),i;
  for(i=0;i<D.pay.n;i++){p.push(base)}
  p[D.pay.n-1]+=100-base*D.pay.n;
  D.pay.pcts=p;D.pay.ok=false;D.escD=0;D.escrow=false;
  save();renderCurrent();
};
ACT.payOk=function(){
  var D=wd('buy').data;
  defPay(D);
  if(D.pay.staged){
    var s=0;
    D.pay.pcts.forEach(function(x){s+=x});
    if(Math.abs(s-100)>0.01){toast('جمع باید ۱۰۰ — الان '+fa(s,0));return}
    var bad=false,i;
    for(i=0;i<D.pay.pcts.length;i++){if(D.pay.pcts[i]<1)bad=true}
    if(bad){toast('هر مرحله حداقل ۱٪');return}
  }
  D.pay.ok=true;D.escD=0;D.escrow=false;
  save();renderCurrent();toast('✓ توافق طرفین ثبت شد');
};
ACT.besc=function(){
  var D=wd('buy').data;
  if(!D.pay||!D.pay.ok)return;
  if(D.price===undefined){D.price=D.budg||300000000000}
  if(D.escD===undefined){D.escD=0}
  var stg=escStages(D);
  if(D.escD>=stg.length)return;
  if(D.escD===0){
    if(!spend('escrow','buy','پرداخت امانی'))return;
    D.escReq=addReq('buy','مبایعه','امانی — '+rial(D.price),'در حال انجام','توافق طرفین');
  }
  D.escD++;
  var all=true,i;
  for(i=0;i<stg.length;i++){if(D.escD<=i)all=false}
  if(all){D.escrow=true;if(D.escReq)setReq(D.escReq,'کامل شد')}
  save();toast('مرحلهٔ '+fa(D.escD,0)+' آزاد شد');renderCurrent();
};
ACT.but=function(el){
  var D=wd('buy').data;
  if(!D.ut){D.ut=[0,0,0,0]}
  D.ut[+el.getAttribute('data-i')]=1;
  var all=true,i;
  for(i=0;i<4;i++){if(!D.ut[i])all=false}
  if(all){D.utils=true}
  save();renderCurrent();
};
ACT.bdone=function(){
  var d=wd('buy');
  if(d.done)return;
  d.done=true;addReq('buy','تحویل','اتمام','کامل شد');save();renderCurrent();
};
ACT.bskip=function(){wd('buy').data.liqSkip=true;save();renderCurrent();toast('رد شد (اختیاری)')};
ACT.bunset=function(){wd('buy').data.liqSkip=false;save();renderCurrent()};
ACT.asdel=function(el){wd('buy').data.assets.splice(+el.getAttribute('data-i'),1);save();renderCurrent()};
ACT.asadd=function(){
  var D=wd('buy').data;
  var n=document.getElementById('asn'),a=document.getElementById('asa'),dd=document.getElementById('asd');
  if(!n||!a||!dd)return;
  if(!n.value.replace(/^\s+|\s+$/g,'')){toast('نام دارایی');return}
  D.assets.push({n:n.value,a:10*Number(a.value)||0,d:+dd.value||0});
  save();if(CURRENT==='profile')renderCurrent();else renderTok();toast('ذخیره شد');
};
ACT.iscn=function(el){wd('invb').data.scn=el.getAttribute('data-v');save();renderCurrent()};
ACT.yhz=function(el){S.ui.yh=+el.getAttribute('data-v');save();renderCurrent()};
ACT.crng=function(el){S.ui.crng=+el.getAttribute('data-v');save();renderCurrent()};
ACT.nrng=function(el){S.ui.nrng=+el.getAttribute('data-v');save();renderCurrent()};
ACT.navscn=function(el){S.ui.navg=+el.getAttribute('data-v');save();renderCurrent()};
ACT.ipset=function(el){
  var D=wd('invb').data;
  D.ip=+el.getAttribute('data-i');save();renderCurrent();
  toast(INPRJ[D.ip].t+' ✓');
};
ACT.pk=function(el){
  var dg=el.getAttribute('data-d');
  if(PAYM.mode==='invb'){
    var D=wd('invb').data;
    D.payAmt=(D.payAmt||'')+dg;
    if(D.payAmt.length>14){D.payAmt=D.payAmt.slice(0,14)}
    save();renderCurrent();
  }else{
    PAYM.amt=String(10*Number((PAYM.amt?String(Number(PAYM.amt)/10):'')+dg));
    if(PAYM.amt.length>14){PAYM.amt=PAYM.amt.slice(0,14)}
    reopenPay();
  }
};
ACT.pkdel=function(){
  if(PAYM.mode==='invb'){
    var D=wd('invb').data;
    D.payAmt=(D.payAmt||'').slice(0,-1);
    save();renderCurrent();
  }else{
    PAYM.amt=String(10*Number((PAYM.amt?String(Number(PAYM.amt)/10):'').slice(0,-1)));
    reopenPay();
  }
};
ACT.pkset=function(el){
  var v=el.getAttribute('data-v');
  if(PAYM.mode==='invb'){
    wd('invb').data.payAmt=String(v);
    save();renderCurrent();
  }else{
    PAYM.amt=String(v);
    reopenPay();
  }
};
ACT.paySubmit=function(el){
  var mode=el.getAttribute('data-m');
  var amt,title,cb;
  if(mode==='invb'){
    var D=wd('invb').data;
    amt=+(D.payAmt||'0');
    title='خرید سهم متری — '+INPRJ[D.ip||0].t;
    cb=function(){
      var m=Math.floor(amt/PPM.v);
      if(m<1){toast('برای ۱ متر کافی نیست');return}
      D.bought=true;D.meters=m;
      addReq('invb','پرداخت','خرید '+fa(m,0)+' متر','کامل شد',rial(amt)+' + ۰٫۵٪');
      save();renderCurrent();toast(' خرید موفق: '+fa(m,0)+' متر');
    };
  }else{
    var ctx=PAYM.ctx;
    if(!ctx)return;
    amt=+PAYM.amt;
    title=ctx.title;
    if(mode==='invr'){
      cb=function(){
        var cnt=Math.floor(amt/13200000);
        if(cnt<1){toast('برای ۱ کلید کافی نیست');return}
        var D2=wd('invr').data;
        D2.cnt=cnt;D2.fund=true;
        addReq('invr','پرداخت','خرید '+fa(cnt,0)+' کلید','کامل شد',rial(amt)+' + ۰٫۵٪');
        save();renderCurrent();toast(' '+fa(cnt,0)+' کلید');
      };
    }else{
      cb=function(){
        var tok=Math.round(amt/ctx.rate);
        if(tok<1){toast('کافی نیست');return}
        earn(tok,'sub',ctx.title);
        if(ctx.kind==='pack'){S.sub={name:ctx.packName||ctx.title.replace('بستهٔ ',''),tokens:tok,at:Date.now(),price:amt}}
        addReq('sub','پرداخت',ctx.title+' — '+fa(tok,0),'کامل شد',rial(amt));
        save();renderCurrent();
      };
    }
  }
  openGateway(amt,title,cb);
};
ACT.gwPay=function(){
  var c=document.getElementById('gw-card'),ex=document.getElementById('gw-exp'),cv=document.getElementById('gw-cvv');
  var cd=pd(c?c.value:'').replace(/[^0-9]/g,'');
  if(cd.length<16){toast('کارت ۱۶ رقم');return}
  if(!ex||!ex.value||!cv||!cv.value){toast('انقضا و CVV2');return}
  openModal('<div style="text-align:center;padding:30px 10px"><span class="dots"><i></i><i></i><i></i></span><b style="display:block;margin-top:12px">در حال تراکنش...</b></div>');
  setTimeout(function(){
    var ref='TRN'+Math.floor(100000+Math.random()*899999);
    openModal('<div style="text-align:center;padding:26px 10px">'+
    '<div style="font-size:42px;color:var(--ok)">✓</div>'+
    '<b style="display:block;font-size:16px;margin-top:8px">پرداخت با موفقیت انجام شد</b>'+
    '<div class="kv" style="margin-top:12px"><span>مبلغ</span><b>'+rial(GW.amt)+'</b></div>'+
    '<div class="kv"><span>کد پیگیری</span><b style="direction:ltr;display:inline-block">'+ref+'</b></div>'+
    '<button class="btn btn-primary btn-lg" style="width:100%;margin-top:14px" data-act="gwBack">بازگشت به سامانه</button></div>');
  },1600);
};
ACT.gwBack=function(){
  closeModal();
  if(GW.cb){
    var cb=GW.cb;
    GW.cb=null;
    cb();
  }else{
    toast('بازگشت ✓');
  }
};
ACT.isell=function(){
  var D=wd('invb').data;
  var sm=document.getElementById('sellm');
  var m=sm?+sm.value:0;
  if(!m||m<1){toast('متراژ فروش را وارد کنید');return}
  if(m>(D.meters||0)){toast('بیشتر از دارایی');return}
  var net=Math.round(m*SPRIX*0.995);
  walletIn(net,'فروش '+fa(m,0)+' متر');
  D.meters-=m;
  addReq('invb','فروش','فروش '+fa(m,0)+' متر','کامل شد',rial(net));
  if(D.meters<1){wd('invb').done=true}
  save();renderCurrent();toast('به کیف پول واریز شد ');
};
ACT.ibdone=function(){var d=wd('invb');d.done=true;addReq('invb','پیگیری','پایان','کامل شد');save();renderCurrent()};
ACT.irbuy=function(){
  var D=wd('invr').data;
  openPayModal({mode:'invr',unit:'کلید',rate:13200000,def:D.cnt*13200000,sugg:[{l:'۵۰۰ کلید',v:6600000000},{l:'۱٬۰۰۰ کلید',v:13200000000},{l:'۲ میلیارد',v:2000000000},{l:'۵ میلیارد',v:5000000000}],title:'خرید کلید صندوق'});
};
ACT.irsell=function(){
  var D=wd('invr').data;
  var sn=document.getElementById('selln');
  var n=sn?+sn.value:0;
  if(!n||n<1){toast('تعداد را وارد کنید');return}
  if(n>(D.cnt||0)){toast('بیشتر از دارایی');return}
  var net=Math.round(n*13200000*0.995);
  walletIn(net,'فروش '+fa(n,0)+' کلید');
  D.cnt-=n;
  addReq('invr','فروش','فروش '+fa(n,0)+' کلید','کامل شد',rial(net));
  if(D.cnt<1){wd('invr').done=true}
  save();renderCurrent();toast('واریز شد ');
};
ACT.irdone=function(){var d=wd('invr');d.done=true;addReq('invr','درآمد','پایان','کامل شد');save();renderCurrent()};
ACT.wallet=function(){S.ui.atab='wallet';save();if(CURRENT==='profile'){renderCurrent()}else{go('profile')}};
ACT.wdraw=function(){
  openModal('<h3> برداشت</h3><div class="payamt">موجودی<b>'+rial(S.wallet||0)+'</b></div>'+
  '<div class="srow"><div class="slab"><span>مبلغ (تومان)</span></div><input class="inp" id="wd-amt" type="number" min="10000" step="10000" value="'+Math.max(10000,Math.floor((S.wallet||0)/10))+'"></div>'+
  '<div class="srow"><div class="slab"><span>شبا</span></div><input class="inp" id="wd-iba" placeholder="IR..." style="direction:ltr;text-align:left" value="IR"></div>'+
  '<button class="btn btn-primary" data-act="wdOk">ثبت درخواست</button> <button class="btn" data-act="closeModal">انصراف</button>');
};
ACT.wdOk=function(){
  var a=10*Number((document.getElementById('wd-amt')||{}).value||0);
  var ib=((document.getElementById('wd-iba')||{}).value||'').replace(/\s/g,'');
  if(!a||a<100000){toast('حداقل ۱۰٬۰۰۰ تومان');return}
  if(a>(S.wallet||0)){toast('بیشتر از موجودی');return}
  if(ib.length<22){toast('شبا کامل نیست');return}
  openModal('<div style="text-align:center;padding:26px 10px"><span class="dots"><i></i><i></i><i></i></span><b style="display:block;margin-top:12px">ثبت درخواست...</b></div>');
  setTimeout(function(){
    S.wallet-=a;
    S.wlog.unshift({t:Date.now(),d:'برداشت',a:-a});
    addReq('wallet','برداشت',rial(a),'کامل شد','تا ۲۴ ساعت');
    save();renderTok();closeModal();if(CURRENT==='profile')renderCurrent();toast('ثبت شد');
  },1200);
};
ACT.roleSet=function(el){
  var D=wd('mkt').data;
  D.role=el.getAttribute('data-v');
  save();renderCurrent();
  toast(D.role==='con'?'پیمانکار ':'کارفرما ');
};
ACT.roleReset=function(){
  var D=wd('mkt').data;
  D.role=null;D.bid=null;D.chosen=null;D.confirmed=false;
  wd('mkt').step=1;save();renderCurrent();
};
ACT.mBids=function(el){
  var i=+(el.getAttribute('data-i')||0);
  openModal('<h3>پیشنهادات — '+PRJ[i].t+'</h3>'+
  '<p class="note">یک مورد را تأیید کنید:</p>'+
  BIDS.map(function(b,bi){
    return '<div class="esc'+(wd('mkt').data.chosen&&wd('mkt').data.chosen.b===bi?' done':'')+'"><span class="nm">'+b.n+' — '+rial(b.amt)+' • '+fa(b.dur,0)+' ماه</span>'+
    '<button class="btn btn-xs btn-primary" data-act="mChoose" data-p="'+i+'" data-b="'+bi+'">تأیید</button></div>';
  }).join('')+
  '<button class="btn" data-act="closeModal" style="margin-top:10px">بستن</button>');
};
ACT.mChoose=function(el){
  var p=+el.getAttribute('data-p'),b=+el.getAttribute('data-b');
  var D=wd('mkt').data;
  D.chosen={prj:p,b:b};D.confirmed=true;D.prjI=p;
  addReq('mkt','انتخاب','انتخاب پیمانکار '+PRJ[p].t,'کامل شد',BIDS[b].n);
  save();closeModal();
  toast(' تأیید شد');
  if(CE.f==='mkt'){botC(' پیمانکار تأیید شد.');ceJump('st')}
  else{renderCurrent()}
};
ACT.mChk=function(){renderCurrent()};
ACT.pdet=function(el){
  var p=PRJ[+el.getAttribute('data-i')];
  openModal('<h3>'+p.t+' — '+p.loc+'</h3>'+
  '<div class="kv"><span>کارفرما / ناظر</span><b>'+p.emp+'</b></div>'+
  '<div class="kv"><span>طبقات / زیربنا</span><b>'+p.fl+' — '+p.area+'</b></div>'+
  '<div class="kv"><span>محدودهٔ کار</span><b>'+p.scope+'</b></div>'+
  '<div class="kv"><span>پروانه</span><b class="badge b-ok">'+p.lic+'</b></div>'+
  '<div class="kv"><span>مدت / شروع</span><b>'+p.dur+' — '+p.start+'</b></div>'+
  '<div class="kv"><span>پرداخت</span><b>'+p.pre+' — '+p.pay+'</b></div>'+
  '<div class="kv"><span>تاریخچه</span><b>★ '+p.score+' — '+p.hist+'</b></div>'+
  (p.warn?('<div class="alert al-warn"> '+p.warn+'</div>'):'')+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">'+
  '<button class="btn btn-primary" data-act="pbid" data-i="'+el.getAttribute('data-i')+'">پیشنهاد (۲۰ کلید)</button>'+
  '<button class="btn" data-act="pinfo" data-i="'+el.getAttribute('data-i')+'">موضوعات</button>'+
  '<button class="btn" data-act="closeModal">بستن</button></div>');
};
ACT.pbid=function(el){
  var i=+el.getAttribute('data-i'),D=wd('mkt').data;
  D.prjI=i;
  var adjSel=(D.adj||'full');
  openModal('<h3>ارسال پیشنهاد — '+PRJ[i].t+'</h3>'+
  '<div class="srow"><div class="slab"><span>قیمت (تومان — تایپ کنید)</span></div><input class="inp" id="bid-amt" type="number" value="800000000" step="50000000" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>مدت (ماه)</span></div><input class="inp" id="bid-dur" type="number" value="18" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>شرط تعدیل</span></div><select class="inp" id="bid-adj"><option value="none"'+(adjSel==='none'?' selected':'')+'>بدون تعدیل</option><option value="full"'+(adjSel==='full'?' selected':'')+'>نرخ رسمی مصالح (توصیه)</option><option value="cap10"'+(adjSel==='cap10'?' selected':'')+'>سقف ۱۰٪</option></select></div>'+
  '<div class="srow"><div class="slab"><span>توضیح</span></div><textarea class="inp" id="bid-note" rows="2"></textarea></div>'+
  '<button class="btn btn-primary" data-act="pbidok" data-i="'+i+'">ارسال (۲۰ کلید)</button> <button class="btn" data-act="closeModal">انصراف</button>');
};
ACT.pbidok=function(el){
  var i=+el.getAttribute('data-i'),D=wd('mkt').data;
  var amt=10*Number((document.getElementById('bid-amt')||{}).value||'800000000');
  var dur=(document.getElementById('bid-dur')||{}).value||'18';
  var adj=(document.getElementById('bid-adj')||{}).value||(D.adj||'full');
  var note=(document.getElementById('bid-note')||{}).value||'';
  var adjT=(adj==='none')?'بدون تعدیل':((adj==='full')?'نرخ رسمی':'سقف ۱۰٪');
  if(!spend('bid','mkt','پیشنهاد '+PRJ[i].t))return;
  D.bid={prj:i,amt:+amt,dur:+dur,adj:adj};
  var rid=addReq('mkt','پیشنهاد','پیشنهاد '+PRJ[i].t,'در انتظار',rial(+amt)+' • '+adjT+(note?(' • '+esc(note)):'')+' • در انتظار تأیید کارفرما');
  save();closeModal();
  setTimeout(function(){
    var d2=wd('mkt');
    if(d2.data.confirmed)return;
    d2.data.confirmed=true;
    if(rid)setReq(rid,'تأیید شد');
    save();toast(' کارفرما تأیید کرد');
    if(CE.f==='mkt'){botC(' کارفرما تأیید کرد.')}
    if(CURRENT==='mkt'||CURRENT==='dash')renderCurrent();
  },3000);
  renderCurrent();
};
ACT.psup=function(el){
  var i=+el.getAttribute('data-i'),D=wd('build').data;
  if(!D.supd){D.supd='فردا'}
  openModal('<h3>سفارش '+SUPS[i].t+'</h3>'+
  '<div class="kv"><span>قیمت</span><b>'+SUPS[i].p+'</b></div>'+
  '<div class="kv"><span>موجودی / حداقل</span><b>'+SUPS[i].stock+' • '+SUPS[i].min+'</b></div>'+
  '<div class="srow" style="margin-top:10px"><div class="slab"><span>مقدار (متنی)</span></div><input class="inp" id="supq" placeholder="۵ تن / ۸ ساعت / ۱۲ نفر"></div>'+
  '<h4 class="mini">تاریخ تحویل</h4><div class="chips">'+['فردا','۳ روز بعد','هفتهٔ بعد'].map(function(dd){return '<span class="chip'+(D.supd===dd?' on':'')+'" data-act="supd" data-v="'+dd+'">'+dd+'</span>'}).join('')+'</div>'+
  '<div class="alert al-ok">پیش‌پرداخت ۳۰٪ از حساب امانی پروژه.</div>'+
  '<button class="btn btn-primary" style="margin-top:10px" data-act="psupok" data-i="'+i+'">ثبت</button> <button class="btn" data-act="closeModal">انصراف</button>');
};
ACT.supd=function(el){
  var D=wd('build').data;
  D.supd=el.getAttribute('data-v');save();
  $$('[data-act="supd"]').forEach(function(c){
    c.className='chip'+(c.getAttribute('data-v')===D.supd?' on':'');
  });
};
ACT.psupok=function(el){
  var i=+el.getAttribute('data-i'),D=wd('build').data;
  var q=((document.getElementById('supq')||{}).value||'').replace(/^\s+|\s+$/g,'');
  if(!q){toast('مقدار را وارد کنید');return}
  if(!D.orders){D.orders=[]}
  D.orders.push({i:i,q:q,d:D.supd||'فردا'});
  addReq('build','تأمین','سفارش '+SUPS[i].t,'در حال انجام',q+' • '+D.supd);
  save();closeModal();renderCurrent();
};
ACT.pph=function(el){
  var D=wd('build').data;
  if(!D.ph){D.ph=[100,80,40,0,0]}
  var i=+el.getAttribute('data-i');
  D.ph[i]=Math.min(100,D.ph[i]+10);
  save();renderCurrent();
};
ACT.pdone=function(){
  var d=wd('build');
  if(d.done)return;
  d.done=true;
  closeReqs('build','تأمین',S.active.build);
  closeReqs('mkt','پیشنهاد',S.active.mkt);
  closeReqs('mkt','انتخاب',S.active.mkt);
  addReq('build','تحویل','تحویل — کارنامه +۵','کامل شد');
  save();
  if(CURRENT==='build')renderCurrent();
  toast('تحویل ثبت شد');
};
ACT.sbook=function(){
  var D=wd('stay').data;
  if(D.code)return;
  var s=findS(D.stay);
  if(!spend('stay','stay','رزرو '+s.t))return;
  D.code=String(1000+Math.floor(Math.random()*9000));
  var rid=addReq('stay','رزرو','رزرو '+s.t+' — '+esc(D.city||''),'در انتظار','کد: '+D.code);
  save();
  setTimeout

(function(){setReq(rid,'تأیید شد');toast('میزبان ✓');if(CURRENT==='stay'||CURRENT==='dash')renderCurrent()},2500);
  renderCurrent();
};
ACT.scheckin=function(){
  var D=wd('stay').data;
  if(D.checked)return;
  D.checked=true;wd('stay').done=true;
  closeReqs('stay','رزرو',S.active.stay);
  addReq('stay','ورود','ورود','کامل شد');
  save();renderCurrent();
};
ACT.rvs=function(el){RVS=+el.getAttribute('data-s');renderCurrent()};
ACT.sreview=function(){
  var x=document.getElementById('rv-txt');
  var txt=x?x.value.replace(/^\s+|\s+$/g,''):'';
  if(!RVS||!txt){toast('امتیاز و متن');return}
  S.reviews.unshift({n:S.auth.name,s:RVS,t:txt});
  addReq('stay','نظر','ثبت نظر','کامل شد','★'+fa(RVS,0));
  save();RVS=0;renderCurrent();toast('✓');
};
ACT.buypack=function(el){
  var p=PACKS[+el.getAttribute('data-i')];
  openPayModal({mode:'sub',unit:'کلید',kind:'pack',packName:p.n,packTok:p.tok,packPrice:p.pr,rate:p.pr/p.tok,def:p.pr,sugg:[{l:'کامل',v:p.pr},{l:'دو برابر',v:p.pr*2}],title:'بستهٔ '+p.n});
};

ACT.pname=function(){
  var x=document.getElementById('pf-name');
  var v=x?x.value.replace(/^\s+|\s+$/g,''):'';
  if(!v){toast('نام را وارد کنید');return}
  S.auth.name=v;
  var w=document.getElementById('pf-work'),s=document.getElementById('pf-school');
  if(w){S.prof.work=w.value||null}
  if(s){S.prof.school=s.value||null}
  save();if(CURRENT==='profile')renderCurrent();else renderTok();toast('ذخیره شد');
};
ACT.logout=function(){S.auth=null;save();APH=0;toggleF(false);go('landing');toast('خروج')};
/* V0.27 — بازنشانی واقعی با تأیید و گزارش صادقانه */
ACT.reset=function(){
  openModal('<h3>بازنشانی کامل داده‌ها</h3>'+
  '<p class="note">همهٔ داده‌های محلینو در این مرورگر حذف می‌شود:</p>'+
  '<ul style="font-size:12.5px;line-height:2;color:var(--ink2);margin:6px 0 10px;padding-inline-start:18px">'+
  '<li>گفت‌وگوها و تاریخچهٔ چت</li><li>درخواست‌ها، فلوها و قراردادها</li><li>آگهی‌های نشان‌شده و یادآورها</li>'+
  '<li>موجودی شبیه‌سازی‌شدهٔ کیف پول و کلیدها</li><li>تنظیمات، حساب کاربری و حالت نمایش</li></ul>'+
  '<p class="note">داده‌های سایت‌های دیگر دست‌نخورده می‌ماند. این کار بازگردانی ندارد.</p>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-danger" data-act="resetOk">حذف کامل و شروع از نو</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.resetOk=function(){
  var errs=[];
  function tryIt(fn,label){try{fn()}catch(e){errs.push(label+': '+(e&&e.message?e.message:e))}}
  tryIt(function(){
    var kill=[],i,k;
    for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&(k.indexOf('mahalino')===0||k.indexOf('khanyar')===0))kill.push(k)}
    kill.forEach(function(k2){localStorage.removeItem(k2)});
  },'localStorage');
  tryIt(function(){
    var kill=[],i,k;
    for(i=0;i<sessionStorage.length;i++){k=sessionStorage.key(i);if(k&&(k.indexOf('mahalino')===0||k.indexOf('khanyar')===0))kill.push(k)}
    kill.forEach(function(k2){sessionStorage.removeItem(k2)});
  },'sessionStorage');
  tryIt(function(){
    if(window.indexedDB&&indexedDB.deleteDatabase){indexedDB.deleteDatabase('mahalino');indexedDB.deleteDatabase('mahalino-plus');indexedDB.deleteDatabase('khanyar')}
  },'indexedDB');
  tryIt(function(){
    HIST=[];CE.f=null;CE.i=0;CE.li=0;CE.hist=[];E22.restoredId=null;E27.sq='';
    try{ctxReset()}catch(e2){}
  },'memory');
  closeModal();
  if(errs.length){toast('بازنشانی ناقص شد: '+errs[0]);return}
  toast('همهٔ داده‌ها پاک شد — شروع از نو…');
  setTimeout(function(){location.reload()},700);
};
/* CJM handlers removed in V0.9 */

