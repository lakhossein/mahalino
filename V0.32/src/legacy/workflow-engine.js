/* ═══ ۶) فلو ═══ */
var WSTEPS={
rent:['بودجه','اولویت‌ها','انتخاب محله','بازار محله','انتخاب ملک','بازدید','قرارداد','فسخ و تخلیه'],
buy:['بودجه و اولویت‌ها','انتخاب محله','بازار محله','دارایی‌های نقدی (اختیاری)','انتخاب ملک','بررسی حقوقی','پرداخت امانی','تحویل'],

invr:['دارایی‌ها و مقایسه','اعتبار صندوق','خرید کلید','درآمد و فروش'],
mkt:['نقش','پروژه‌ها','پیشنهاد / انتخاب','گردش کار'],
build:['تأمین','پیشرفت','تحویل'],
stay:['سفر','اقامتگاه','رزرو','ورود'],
grt:['ملک','وضعیت ملک','انتظارات اجاره','بررسی صلاحیت','شرایط و قرارداد مدیریت','یافتن مستأجر','اجاره‌نامه و تحویل','مدیریت دوره و پرداخت‌ها','بازگشت و تسویه']};
function stepper(m){
  var st=WSTEPS[m],d=wd(m),cur=d.step,i,n,cls,attr;
  var h='<div class="steps">';
  for(i=0;i<st.length;i++){
    n=i+1;cls=(d.done||n<cur)?'done':(n===cur?'cur':'');
    attr=(n<cur&&!d.done)?' data-jump="'+n+'" data-m="'+m+'" style="cursor:pointer"':'';
    h+='<div class="st '+cls+'"'+attr+'><span class="stn">'+(cls==='done'?'✓':fa(n,0))+'</span><b>'+st[i]+'</b></div>';
  }
  return h+'</div>';
}
function wfBar(m){
  var list=wfShown(m),cur=S.active[m];
  var h='<div class="wfbar"><span class="wflab">فلوهای این مسیر</span><div class="chips wfchips">';
  h+=list.slice(0,10).map(function(w){
    var st=wfState(w),on=w.id===cur;
    return '<button class="chip'+(on?' on':'')+'" data-act="wfSel" data-m="'+m+'" data-wf="'+w.id+'" aria-pressed="'+(on?'true':'false')+'">'+
      esc(wfName(w))+'<span class="wfs">'+st.t+'</span></button>';
  }).join('');
  h+='<button class="chip wfadd" data-act="flowNew" data-m="'+m+'">＋ فلو جدید</button>';
  if(wfAll(m).length>1){h+='<button class="chip" data-act="wfManage" data-m="'+m+'">مدیریت فلوها</button>'}
  h+='</div></div>';
  return h;
}
function wfManageHTML(m){
  var list=wfAll(m).filter(function(w){return wfTouched(w)||w.id===S.active[m]}),cur=S.active[m];
  var h='<h3>فلوهای '+MODBY[m].t+'</h3>'+
  '<p class="note">هر فلو بودجه، محله، ملک، قرارداد و درخواست‌های مستقل خود را دارد. لغو یا حذف یک فلو، فلوهای دیگر را متوقف نمی‌کند.</p>';
  if(!list.length){h+='<div class="empty" style="margin-top:10px">هنوز فلویی در این مسیر ندارید.</div>'}
  else{
    h+='<div class="wfman">';
    h+=list.map(function(w){
      var on=w.id===cur,reqs=reqsOfWf(w.id).filter(reqOpen).length;
      return '<div class="wfrow'+(on?' on':'')+'">'+
      '<div class="wfmain"><b>'+esc(wfName(w))+'</b>'+(on?'<span class="badge b-info">نمایش‌داده‌شده</span>':'')+wfSummary(w)+
      '<div class="fs-meta"><span>مرحلهٔ '+fa(w.step,0)+' از '+fa(WSTEPS[m].length,0)+'</span><span>'+fa(reqs,0)+' درخواست باز</span><span>آخرین فعالیت: '+dt(w.updatedAt||w.createdAt)+'</span>'+(w.cancelled?'<span>لغوشده</span>':'')+'</div></div>'+
      '<div class="fs-actions">'+
      (on?'':'<button class="btn btn-xs btn-primary" data-act="wfOpen" data-m="'+m+'" data-wf="'+w.id+'">باز کردن</button>')+
      (!w.cancelled&&!w.done?'<button class="btn btn-xs" data-act="wfCancel" data-wf="'+w.id+'">لغو این فلو</button>':'')+
      '<button class="btn btn-xs" data-act="wfDel" data-wf="'+w.id+'">حذف</button>'+
      '</div></div>';
    }).join('');
    h+='</div>';
  }
  h+='<div class="fs-actions" style="margin-top:14px"><button class="btn btn-primary" data-act="flowNew" data-m="'+m+'">فلوی جدید</button><button class="btn" data-act="closeModal">بستن</button></div>';
  return h;
}
function wtop(m,title,sub){
  var d=wd(m);
  return '<div class="wtop"><div><h2>'+title+'</h2><p>'+sub+'</p></div><div class="head-actions">'+
    '<span class="wprog">مرحلهٔ '+fa(d.step,0)+' از '+fa(WSTEPS[m].length,0)+'</span>'+
    '<button class="btn btn-sm" data-act="fcb" aria-label="باز کردن دستیار">'+ico('chat',16)+' دستیار</button>'+
    '<button class="btn btn-sm" data-act="flowInChat" data-m="'+m+'">ادامه در گفت‌وگو</button>'+
    '<button class="btn btn-sm" data-act="flowNew" data-m="'+m+'" title="یک فلو مستقل جدید آغاز می‌شود؛ فلوهای دیگر دست‌نخورده می‌مانند.">'+(m==='stay'?'رزرو جدید':'فلوی جدید')+'</button>'+
  '</div></div>'+wfBar(m)+stepper(m);
}
function wnav(m,canNext,noteTxt){
  var d=wd(m),h='<div class="wnav">';
  if(d.step>1){h+='<button class="btn" data-w="prev" data-m="'+m+'">→ بازگشت</button>'}
  if(noteTxt){h+='<span class="note">'+noteTxt+'</span>'}
  if(canNext&&d.step<WSTEPS[m].length){h+='<button class="btn btn-primary" data-w="next" data-m="'+m+'">ادامه ←</button>'}
  return h+'</div>';
}
var RNGF={};
function rng(k,l,min,max,step,v,fmt){
  RNGF[k]=fmt||rial;
  return '<div class="srow"><div class="slab"><span>'+l+'</span><span style="display:flex;gap:6px;align-items:center"><input class="tinp" data-tk="'+k+'" data-min="'+min+'" data-max="'+max+'" value="'+v+'"><b id="rv-'+k+'">'+RNGF[k](v)+'</b></span></div><input type="range" data-rk="'+k+'" data-min="'+min+'" data-max="'+max+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v+'"></div>';
}
function guardOK(m){
  var d=wd(m),D=d.data;
  if(m==='grt'){var _e=grtCur();if(!_e)return 'ابتدا یک ملک ثبت کنید.';return grtGuard(_e,d.step)}
  if(m==='rent'){
    if(d.step===3&&!D.hood)return 'ابتدا یک محله انتخاب کنید.';
    if(d.step===5&&!D.listing)return 'ابتدا یک ملک انتخاب کنید.';
    if(d.step===6&&!D.visitDay)return 'ابتدا درخواست بازدید را ثبت کنید.';
    if(d.step===7&&!D.signed)return 'ابتدا قرارداد را امضا کنید.';
  }
  if(m==='buy'){
    if(d.step===2&&!D.hood)return 'ابتدا یک محله انتخاب کنید.';
    if(d.step===5&&!D.blist)return 'ابتدا یک ملک انتخاب کنید.';
    if(d.step===6&&!D.legal)return 'ابتدا گزارش حقوقی را دریافت کنید.';
    if(d.step===7){
      if(!D.pay||!D.pay.ok)return 'ابتدا توافق پرداخت طرفین را نهایی کنید.';
      if(!D.escrow)return 'همهٔ مراحل آزادسازی امانی را تأیید کنید.';
    }
    if(d.step===8&&!D.utils)return 'انتقال انشعابات را کامل کنید.';
  }
  if(false&&m==='invb'&&d.step===3&&!D.bought)return 'ابتدا پرداخت را نهایی کنید.';
  if(m==='invr'&&d.step===3&&!D.fund)return 'ابتدا خرید کلید را نهایی کنید.';
  if(m==='mkt'){
    if(d.step===2&&!D.role)return 'ابتدا نقش خود را انتخاب کنید.';
    if(d.step===3){
      if(D.role==='con'&&!D.bid)return 'ابتدا پیشنهاد خود را ثبت کنید.';
      if(D.role==='emp'&&!D.chosen)return 'ابتدا یک پیمانکار را تأیید کنید.';
    }
  }
  if(m==='build'){
    if(d.step===1&&(!D.orders||!D.orders.length))return 'حداقل یک سفارش تأمین ثبت کنید.';
    if(d.step===2){
      if(!D.ph){D.ph=[100,80,40,0,0]}
      var tot=0,w=[12,34,22,18,14],q;
      for(q=0;q<5;q++){tot+=w[q]*D.ph[q]}
      tot=tot/100;
      if(tot<100)return 'پیشرفت پروژه را تا ۱۰۰٪ کامل کنید.';
    }
  }
  if(m==='stay'){
    if(d.step===2&&(!D.city||!D.ppl))return 'نام شهر و تعداد مسافران را وارد کنید.';
    if(d.step===3&&!D.stay)return 'ابتدا یک اقامتگاه انتخاب کنید.';
    if(d.step===4&&!D.code)return 'ابتدا رزرو امانی را ثبت کنید.';
  }
  return null;
}
function wizardNav(m,dir){
  var d=wd(m);
  if(m==='grt'){var _ge=grtCur();if(_ge){
    if(grtCollect(_ge,d.step)===false)return;
    if(dir==='next'){var _gg=grtGuard(_ge,d.step);if(_gg){toast(_gg);return}}
  }}
  if(dir==='prev'){
    if(d.step>1){d.step--;save()}
  }else{
    var g=guardOK(m);
    if(g){toast(g);return}
    if(d.step<WSTEPS[m].length){d.step++;save()}
  }
  renderCurrent();
}
function jumpTo(m,n){var d=wd(m);if(n<d.step){d.step=n;save();renderCurrent()}}
function defP(D){if(!D.P){D.P={metro:3,school:2,work:4,saf:4,amn:3,quiet:3,extra:[],maxAge:20,minM2:60,floor:'any',beds:2,elev:false,park:false}}}
function defPR(D){if(!D.PR){D.PR={age:[0,30],m2:[45,120],ppm:[1800000000,5500000000],beds:2,floorR:[1,10],elev:'no',park:'no',balc:'no'}}}
function defPay(D){if(!D.pay){D.pay={staged:true,n:4,pcts:[20,30,40,10],ok:false}}}
function defVlist(D){
  if(!D.vlist){D.vlist=[
  {t:'فشار آب آشپزخانه و حمام',ok:false},{t:'تست کلیدها و پریزها',ok:false},
  {t:'بررسی نم و رطوبت دیوارها',ok:false},{t:'صدای پمپ آب و موتورخانه',ok:false},
  {t:'صدای محیط (بازدید شبانی)',ok:false},{t:'جای پارک بعد از ۲۲',ok:false},
  {t:'وضعیت کابینت و سرگازها',ok:false},{t:'عکس از ایرادها',ok:false}]}
}
function escStages(D){
  if(!D.pay){return []}
  if(!D.pay.staged){return [{p:100,t:'۱۰۰٪ — هنگام انتقال سند'}]}
  return D.pay.pcts.map(function(p,i){return {p:p,t:'مرحلهٔ '+fa(i+1,0)+' (٪'+fa(p,0)+')'}});
}
function workPlace(){var ps=getPlaces(),i,p;for(i=0;i<ps.length;i++){p=ps[i];if(p.kind==='work'&&placeLL(p))return p}return null}
function hv(h,k){
  var o=OSM[h.id]&&OSM[h.id].cats;
  if(k==='metro'){return o&&o.metro?Math.max(0,1-o.metro.km/7):null}
  if(k==='school'){return o&&o.edu?Math.max(0,1-o.edu.km/1.5):null}
  if(k==='work'){var p=workPlace();if(!p)return null;var d=distKm(h.ll,placeLL(p));return Math.max(0,1-d/15)}
  return null;
}
function hoodScore(h,P){
  P=P||{metro:3,school:2,work:4,extra:[],PXH:{}};
  var ks=['metro','school','work'],tw=0,s=0,i,v;
  for(i=0;i<ks.length;i++){v=hv(h,ks[i]);if(v===null)continue;tw+=P[ks[i]];s+=P[ks[i]]*v}
  var ex=P.extra||[],PX,i2;
  if(ex.length){
    PX=(P.PXH||{})[h.id]||[];
    for(i2=0;i2<ex.length;i2++){tw+=ex[i2].w;s+=(PX[i2]?1:0)*ex[i2].w}
  }
  return Math.max(5,Math.min(100,tw?Math.round(s/tw*100):50));
}
var IMPL={metro:'دسترسی به مترو',school:'نزدیکی به مدرسه',work:'رفتوآمد به محل کار (نیازمند ثبت محل کار)'};
function factorData(h,k){
  var o=OSM[h.id]&&OSM[h.id].cats;
  if(k==='metro')return o&&o.metro?placeDistText(o.metro.km)+' — '+o.metro.name:'داده‌ای ثبت نشده';
  if(k==='school')return o&&o.edu?placeDistText(o.edu.km)+' — '+o.edu.name:'داده‌ای ثبت نشده';
  if(k==='work'){var p=workPlace();return p?placeDistText(distKm(h.ll,placeLL(p)))+' — '+p.label:'محل کار ثبت نشده'}
  return '—';
}
function impBlock(D,m){
  var P=D.P,k,h='<div class="card"><div class="ct"> اهمیت عوامل محله (۱ = بی‌اهمیت، ۵ = خیلی مهم)</div>';
  for(k in IMPL){
    var _opts=[1,2,3,4,5].map(function(v){return '<button class="chip'+(P[k]===v?' on':'')+'" data-imp="'+k+'" data-v="'+v+'">'+fa(v,0)+'</button>'}).join('');
    h+='<div class="srow"><div class="slab"><span>'+IMPL[k]+'</span><b id="iv-'+m+'-'+k+'">'+fa(P[k],0)+'</b></div><div class="chips">'+_opts+'</div><div class="note" id="fd-'+m+'-'+k+'"></div></div>';
  }
  h+='<p class="note">امتیاز تطبیق فقط از عوامل قابل اندازه‌گیری و اولویت‌های شما ساخته می‌شود. <span class="hint" data-tip="عوامل: دسترسی مترو، فاصلهٔ مدرسه، فاصلهٔ محل کار (اگر ثبت شده) و اولویت‌های دستی شما. «کیفیت کلی محله» یا رتبهٔ رسمی نیست.">توضیح</span></p>';
  h+='<div class="mini"> اولویت‌های شخصی (اختیاری)</div><div class="chips">';
  h+=P.extra.length?P.extra.map(function(e,i){return '<span class="chip on">'+esc(e.t)+' <small>وزن '+fa(e.w,0)+'</small> <b data-act="pdel" data-m="'+m+'" data-i="'+i+'" style="cursor:pointer;color:var(--danger)">×</b></span>'}).join(''):'<span class="note">—</span>';
  h+='</div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><input class="inp" id="pxnew" placeholder="مثلاً: نزدیکی پارک" style="flex:1;min-width:140px"><input class="inp" id="pxw" type="number" min="1" max="5" value="3" style="width:64px"><button class="btn btn-sm" data-act="padd" data-m="'+m+'">افزودن</button></div>';
  h+='<div class="kv" style="margin-top:12px"><span>محله‌های همخوان</span><b id="pvn-'+m+'">—</b></div></div>';
  return h;
}
function updImp(m){
  var D=wd(m).data,P=D.P,k,e,top=null,ts=0,n=0;
  for(k in IMPL){e=document.getElementById('iv-'+m+'-'+k);if(e)e.textContent=fa(P[k],0)}
  HOODS.forEach(function(h){var s=hoodScore(h,P);if(s>=60)n++;if(s>ts){top=h;ts=s}});
  var c=document.getElementById('pvn-'+m);
  if(c){c.textContent=fa(n,0)+' از '+fa(HOODS.length,0)+' — بیشترین تطبیق: '+top.n+' ٪'+fa(ts,0)}
}
function bindImp(m){
  var P=wd(m).data.P;
  $$('[data-pm="'+m+'"][data-pk]').forEach(function(r){
    r.addEventListener('input',function(){P[r.getAttribute('data-pk')]=+r.value;save();updImp(m)})
  });
  updImp(m);
}
function drLabel(k,tgt){var e=document.getElementById('dvr-'+k);if(e){e.textContent=fa(tgt[0]/(k==='ppm'?10:1),0)+' تا '+fa(tgt[1]/(k==='ppm'?10:1),0)}}
function bindDr(m){
  var D=wd(m).data;
  $$('[data-dr]').forEach(function(r){
    r.addEventListener('input',function(){
      var k=r.getAttribute('data-dr'),side=+r.getAttribute('data-side'),v=+r.value;
      var tgt=(k==='floorR')?D.PR.floorR:D.PR[k];
      if(side===0&&v>tgt[1]){tgt[0]=tgt[1]}
      else if(side===1&&v<tgt[0]){tgt[1]=tgt[0]}
      else{tgt[side]=v}
      save();drLabel(k,tgt);
    });
  });
}
function drrow(k,l,min,max,step,v){
  return '<div class="srow"><div class="slab"><span>'+l+'</span><b id="dvr-'+k+'">'+fa(v[0]/(k==='ppm'?10:1),0)+' تا '+fa(v[1]/(k==='ppm'?10:1),0)+'</b></div>'+
  '<input type="range" data-dr="'+k+'" data-side="0" data-min="'+min+'" data-max="'+max+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v[0]+'">'+
  '<input type="range" data-dr="'+k+'" data-side="1" data-min="'+min+'" data-max="'+max+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v[1]+'">'+
  '<div style="display:flex;gap:8px;margin-top:4px;align-items:center"><input class="tinp" data-dt="'+k+'" data-side="0" data-min="'+min+'" data-max="'+max+'" value="'+v[0]/(k==='ppm'?10:1)+'"><span class="note">تا</span><input class="tinp" data-dt="'+k+'" data-side="1" data-min="'+min+'" data-max="'+max+'" value="'+v[1]/(k==='ppm'?10:1)+'"></div></div>';
}
function prRangeBlock(D,m){
  var P=D.PR,h='<div class="card"><div class="ct"> بازهٔ اولویت‌های ملک</div>';
  h+=drrow('age','عمر بنا (سال)',0,30,1,P.age);
  h+=drrow('m2','متراژ (متر)',40,140,5,P.m2);
  h+=drrow('ppm','قیمت هر متر (تومان)',1800000000,5500000000,50000000,P.ppm);
  h+=drrow('floorR','طبقه',1,10,1,P.floorR);
  h+='<div class="srow"><div class="slab"><span>حداقل خواب</span></div><div class="chips">'+[[0,'۰'],[1,'۱'],[2,'۲'],[3,'۳+']].map(function(b){return '<span class="chip'+(P.beds===b[0]?' on':'')+'" data-act="prset" data-m="'+m+'" data-k="beds" data-v="'+b[0]+'">'+b[1]+'</span>'}).join('')+'</div></div>';
  h+='<div class="srow"><div class="slab"><span>ویژگی‌های الزامی</span></div><div class="chips">'+[['elev','آسانسور'],['park','پارکینگ'],['balc','بالکن']].map(function(f){return '<span class="chip'+(P[f[0]]==='yes'?' on':'')+'" data-act="prtog" data-m="'+m+'" data-k="'+f[0]+'">'+f[1]+'</span>'}).join('')+'</div></div>';
  h+='<p class="note">مقادیر را مستقیم وارد کنید یا از گزینه‌ها انتخاب کنید.</p></div>';
  return h;
}
function blPass(x,D){
  var P=D.PR;
  if(x.age<P.age[0]||x.age>P.age[1])return false;
  if(x.m2<P.m2[0]||x.m2>P.m2[1])return false;
  if(x.ppm<P.ppm[0]||x.ppm>P.ppm[1])return false;
  if(x.floor<P.floorR[0]||x.floor>P.floorR[1])return false;
  if(P.beds>0&&x.beds<P.beds)return false;
  if(P.elev==='yes'&&!x.elev)return false;
  if(P.park==='yes'&&!x.park)return false;
  if(P.balc==='yes'&&!x.balc)return false;
  return true;
}
function bScore(x,D){
  var s=50;
  if(x.age<=3)s+=10;else if(x.age<=10)s+=5;
  if(D.PR.beds>0&&x.beds>D.PR.beds)s+=3;
  if(x.elev)s+=3;if(x.park)s+=3;if(x.balc)s+=2;
  s+=Math.round(hoodScore(findH(x.hood),D.P)/12);
  return Math.min(98,Math.round(s));
}
function lscore(x,D){
  var s=50;
  if(x.rent<=D.B.rentB)s+=18;else s-=Math.min(15,(x.rent-D.B.rentB)/50000000);
  if(x.age<=D.P.maxAge)s+=8;else s-=6;
  if(x.m2>=D.P.minM2)s+=8;else s-=5;
  var _bd=(D.P.bedsNum!==undefined&&D.P.bedsNum!==''&&D.P.bedsNum!==null)?+D.P.bedsNum:D.P.beds;if(_bd>0&&x.beds>=_bd)s+=4;
  var _fl=(D.P.floorNum!==undefined&&D.P.floorNum!==''&&D.P.floorNum!==null)?+D.P.floorNum:null;if(_fl!==null&&!isNaN(_fl)){if(x.floor===_fl)s+=5}else if(D.P.floor==='low'&&x.floor<=3)s+=5;
  if(_fl===null||isNaN(_fl)){if(D.P.floor==='high'&&x.floor>=4)s+=5}
  if(D.P.elev&&x.elev)s+=3;
  if(D.P.park&&x.park)s+=3;
  s+=Math.round(hoodScore(findH(x.hood),D.P)/15);
  if(D.P&&D.P.persona==='خانواده'){var _pp=OSM[x.hood]&&OSM[x.hood].cats;if(_pp&&_pp.park&&_pp.park.n>=30)s+=3}
  if(D.P&&D.P.persona==='دانشجو/کاری'){var _pm=OSM[x.hood]&&OSM[x.hood].cats;if(_pm&&_pm.metro&&_pm.metro.km<=1.2)s+=3}
  return Math.max(25,Math.min(98,Math.round(s)));
}
var FRC={rent:['rent'],buy:['buy'],invest:['invr'],mkt:['mkt'],build:['build'],stay:['stay'],grt:['grt']};
function flowReqBlock(m){
  var cats=FRC[m]||[m];
  var mod=m==='invest'?'invr':m;
  var d=wf(mod);
  var rsAll=flowReqList(m);
  var rsWf=d?rsAll.filter(function(r){return r.wf===d.id}):[];
  var showAll=!!S.ui['frw_'+m];
  var rs=(showAll||!rsWf.length)?rsAll:rsWf;
  var openList=rs.filter(reqOpen);
  var latestOpen=openList[0],latest=latestOpen||rs[0];
  var others=d?wfShown(mod).filter(function(w){return w.id!==d.id&&!w.done&&w.step>1}):[];
  var openHist=!!S.ui['fr_'+m],f=S.ui['frf_'+m]||'all';
  var cat=mod;
  var h='<section class="flowstatus'+(latestOpen?' has-open':'')+'" aria-label="وضعیت درخواست این فلو">';
  h+='<div class="fs-row"><span class="fs-ic" aria-hidden="true">'+ico('flows',18)+'</span>';
  if(latestOpen){
    h+='<div class="fs-main"><b>درخواست جاری: '+esc(latestOpen.title)+'</b><div class="fs-meta">'+stB(latestOpen.status)+'<span>ثبت '+dt(latestOpen.t)+'</span>'+(latestOpen.detail?'<span>'+esc(latestOpen.detail)+'</span>':'')+'</div></div>';
    h+='<div class="fs-actions"><button class="btn btn-sm" data-act="reqDetail" data-id="'+latestOpen.id+'">جزئیات</button><button class="btn btn-sm btn-primary" data-act="dt" data-t="req" data-cat="'+cat+'">پیگیری</button>'+(m==='stay'?'<button class="btn btn-sm" data-act="flowNew" data-m="'+m+'">رزرو جدید</button>':'')+'</div>';
  }else if(latest){
    h+='<div class="fs-main"><b>آخرین درخواست: '+esc(latest.title)+'</b><div class="fs-meta">'+stB(latest.status)+'<span>'+dt(latest.t)+'</span></div></div>';
    h+='<div class="fs-actions"><button class="btn btn-sm btn-primary" data-act="flowNew" data-m="'+mod+'">فلوی جدید</button><button class="btn btn-sm" data-act="dt" data-t="req" data-cat="'+cat+'">همهٔ درخواست‌ها</button></div>';
  }else{
    h+='<div class="fs-main"><b>هنوز درخواستی ثبت نشده</b><div class="fs-meta"><span>وضعیت پس از ثبت، همین‌جا نمایش داده می‌شود.</span></div></div>';
  }
  h+='</div>';
  if(d&&!d.done&&d.step>1){
    h+='<div class="fs-note">پیشرفت «'+esc(wfName(d))+'»: مرحلهٔ '+fa(d.step,0)+' از '+fa(WSTEPS[mod].length,0)+' — <button class="btn btn-xs" data-act="resume" data-m="'+mod+'" data-wf="'+d.id+'">ادامهٔ فلو</button></div>';
  }
  if(others.length){
    h+='<div class="fs-note">'+fa(others.length,0)+' فلوی دیگر از همین مسیر در جریان است — <button class="btn btn-xs" data-act="wfManage" data-m="'+mod+'">مدیریت فلوها</button></div>';
  }
  if(rs.length){
    var cO=openList.length,cD=rs.filter(function(r){return r.status==='کامل شد'}).length;
    h+='<div class="reqbar'+(openHist?' open':'')+'" style="border:none;border-top:1px solid var(--line-soft);border-radius:0;margin-top:9px">'+
    '<button class="reqbar-h" data-act="frTog" data-m="'+m+'" aria-expanded="'+(openHist?'true':'false')+'"><i class="chev"></i><span>'+(rs===rsWf?'سابقهٔ درخواست‌های این فلو':'سابقهٔ درخواست‌ها')+'</span><span class="sp"></span>'+
    (cO?'<span class="badge b-warn">'+fa(cO,0)+' جاری</span>':'')+(cD?'<span class="badge b-ok">'+fa(cD,0)+' انجام‌شده</span>':'')+'</button>';
    if(openHist){
      h+='<div class="reqbar-b"><div class="seg" style="margin:10px 0 8px">'+[['all','همه'],['open','جاری'],['prog','در حال انجام'],['done','انجام‌شده']].map(function(x){return '<button class="'+(f===x[0]?'on':'')+'" data-act="frF" data-m="'+m+'" data-f="'+x[0]+'" aria-pressed="'+(f===x[0]?'true':'false')+'">'+x[1]+'</button>'}).join('')+(rsWf.length?'<button class="btn btn-xs" data-act="frW" data-m="'+m+'">'+(showAll?'فقط این فلو':'نمایش همهٔ فلوها')+'</button>':'')+'</div>';
      var list=rs.filter(function(r){
        if(f==='open'&&!reqOpen(r))return false;
        if(f==='prog'&&r.status!=='در حال انجام')return false;
        if(f==='done'&&r.status!=='کامل شد')return false;
        return true;
      });
      if(!list.length){h+='<p class="note">در این دسته موردی نیست.</p>'}
      else{
        h+='<div class="tblwrap"><table class="tbl" style="min-width:420px"><thead><tr><th>عنوان</th><th>وضعیت</th><th>تاریخ</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>';
        list.slice(0,8).forEach(function(r2){
          h+='<tr><td>'+esc(r2.title)+'</td><td>'+stB(r2.status)+'</td><td>'+dt(r2.t)+'</td><td><button class="btn btn-xs" data-act="reqDetail" data-id="'+r2.id+'">جزئیات</button></td></tr>';
        });
        h+='</tbody></table></div>';
      }
      h+='</div>';
    }
    h+='</div>';
  }
  return h+'</section>';
}
function hoodBlock(D,m,kind){
  var P=D.P;
  if(!D.cmpH){D.cmpH=[]}
  var list=HOODS.slice().sort(function(a,b){return hoodScore(b,P)-hoodScore(a,P)});
  var h='<div class="grid g3">'+list.map(function(x){
    var s=hoodScore(x,P),px=(P.PXH||{})[x.id]||[],exHtml='';
    if(P.extra.length){
      exHtml='<div class="chips" style="margin-top:4px">'+P.extra.map(function(e,i){
        var on=!!px[i];
        return '<span class="chip" style="padding:2px 9px;font-size:10.5px'+(on?';background:var(--osoft);border-color:#bfe5cd;color:var(--ok)':'')+'" data-act="pxtgl" data-m="'+m+'" data-h="'+x.id+'" data-i="'+i+'">'+(on?'✓ ':'✗ ')+esc(e.t)+'</span>';
      }).join('')+'</div>';
    }
    var priceLab=kind==='rent'?('اجاره نمونه '+rial(x.avgRent)+' • ودیعه '+rial(x.avgDep)):('میانگین آگهی هر متر '+rial(x.buyBase)+' • '+MARKET.asOf);
    var inCmp=D.cmpH.indexOf(x.id)>=0;
    var mt=OSM[x.id]&&OSM[x.id].cats.metro;
    return '<div class="lcard'+(D.hood===x.id?' sel':'')+'">'+
    '<div class="lart">'+ph(x.id,400,250,'')+'<span class="match">تطبیق ٪'+fa(s,0)+'</span></div>'+
    '<div class="lbody"><h4>محلهٔ '+x.n+'</h4>'+
    '<div class="ltags"><span>'+priceLab+'</span></div><div class="ltags disttags">'+placeTags(x.id,3)+'</div>'+
    '<div class="ltags"><span>'+(mt?'مترو '+placeDistText(mt.km):'مترو: داده ندارد')+'</span><span>مدرسه '+(OSM[x.id]&&OSM[x.id].cats.edu?placeDistText(OSM[x.id].cats.edu.km):'—')+'</span></div>'+
    exHtml+
    '<div class="lfoot"><div class="pr"><b>٪'+fa(s,0)+'</b><span>تطبیق با اولویت‌ها</span></div>'+
    '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
    '<button class="btn btn-xs'+(D.hood===x.id?'':' btn-primary')+'" data-act="hset" data-m="'+m+'" data-id="'+x.id+'">'+(D.hood===x.id?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
    '<button class="btn btn-xs" data-act="hinfo" data-h="'+x.id+'" aria-label="اطلاعات محله">اطلاعات</button>'+
    '<button class="btn btn-xs" data-act="hmap" data-h="'+x.id+'" aria-label="نمایش روی نقشه">نقشه</button>'+
    '<button class="btn btn-xs" data-act="cmpHadd" data-m="'+m+'" data-id="'+x.id+'" aria-label="افزودن به مقایسه">'+(inCmp?'✓':'مقایسه')+'</button>'+
    '</div></div></div></div>';
  }).join('')+'</div>';
  if(D.cmpH.length){
    h+='<div class="cmpbar" style="margin-top:14px"><b> مقایسهٔ محله‌ها</b><span class="note">'+esc(D.cmpH.map(function(id){return findH(id).n}).join('، '))+'</span><button class="btn btn-sm btn-primary" data-act="cmpHopen" data-m="'+m+'">نمایش جدول</button></div>';
  }
  return h;
}
function cmpHoodTable(m){
  var D=wd(m).data,P=D.P,ids=D.cmpH||[];
  if(ids.length<2)return null;
  var cols=ids.map(findH);
  var rows=[
  ['میانگین اجاره',function(h){return rial(h.avgRent)}],
  ['میانگین رهن',function(h){return rial(h.avgDep)}],
  ['میانگین آگهی هر متر',function(h){return rial(h.buyBase)}],
  ['بازهٔ تقریبی آگهی',function(h){return rial(h.mkt.low)+' تا '+rial(h.mkt.high)}],
  ['تغییر یک‌ساله',function(h){return pct(h.mkt.yoy)}],
  ['امتیاز تطبیق شما',function(h){return '٪'+fa(hoodScore(h,P),0)}]];
  placesCompareRows().forEach(function(r){rows.splice(rows.length-1,0,[r[0],function(h){return r[1](h.id)}])});
  var h='<table class="ctbl"><tr><th>معیار</th>'+cols.map(function(c){return '<th>'+c.n+'</th>'}).join('')+'</tr>';
  rows.forEach(function(r){h+='<tr><td>'+r[0]+'</td>'+cols.map(function(c){return '<td><b>'+r[1](c)+'</b></td>'}).join('')+'</tr>'});
  h+='<tr><td></td>'+cols.map(function(c){return '<td><button class="btn btn-xs btn-primary" data-act="hselC" data-m="'+m+'" data-id="'+c.id+'">انتخاب</button></td>'}).join('')+'</tr>';
  return h+'</table><p class="note">قیمت‌ها میانگین آگهی این تاریخ‌اند، نه معاملهٔ قطعی. <span class="hint" data-tip="امتیاز تطبیق بر اساس اولویت‌های شماست و رتبهٔ کیفیت محله نیست.">توضیح</span></p>';
}
function rentDiffTags(x,D){
  var t=[];
  t.push([x.rent<=D.B.rentB?'اجاره در سقف':'اجاره بالاتر',x.rent<=D.B.rentB]);
  t.push([x.m2>=D.P.minM2?'متراژ مناسب':'متراژ کمتر',x.m2>=D.P.minM2]);
  t.push([x.beds>=D.P.beds?'خواب کافی':'خواب کمتر',x.beds>=D.P.beds]);
  t.push([x.age<=D.P.maxAge?'سن مناسب':'سن بالاتر',x.age<=D.P.maxAge]);
  return t;
}
function buyDiffTags(x,D){
  var tot=x.m2*x.ppm,t=[];
  var _b27=E27.budgEff(D);
  t.push([tot<=_b27?'در بودجه':'بالاتر از بودجه',tot<=_b27]);
  t.push([x.m2>=D.PR.m2[0]?'متراژ مناسب':'متراژ کمتر',x.m2>=D.PR.m2[0]]);
  t.push([x.age>=D.PR.age[0]&&x.age<=D.PR.age[1]?'سن مناسب':'سن متفاوت',x.age>=D.PR.age[0]&&x.age<=D.PR.age[1]]);
  t.push([x.beds>=D.PR.beds?'خواب کافی':'خواب کمتر',x.beds>=D.PR.beds]);
  return t;
}
function diffBadges(t){return '<div class="chips">'+t.map(function(x){return '<span class="badge '+(x[1]?'b-ok':'b-warn')+'">'+(x[1]?'✓ ':'✗ ')+x[0]+'</span>'}).join('')+'</div>'}
/* V0.27 — کارت عمودی آگهی اجاره (Design System) */
function lcard2(x,D,sel,sc,fb){
  var saved=(D.saved||[]).indexOf(x.id)>=0;
  var rentB=E27.rentBEff(D);
  var out=x.rent>rentB;
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">اجارهٔ ماهانه</span>'+
  '<div class="pcard-badges"><span class="match" style="position:static">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.rent)+'<small>تومان در ماه</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">ودیعه (رهن): <b style="color:var(--ink)">'+rial(x.dep)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+' ('+fa(x.n,0)+' نظر)</span>':'')+'</div>':'')+
  '<div class="pcard-src"><span class="badge '+(out?'b-warn':'b-ok')+'">'+(out?'بالاتر از سقف اجارهٔ شما':'متناسب با سقف شما')+'</span>'+
  '<span class="badge b-info" data-tip="وضعیت مالکیت فقط با استعلام رسمی قابل تأیید است.">مالکیت: استعلام لازم</span></div>'+
  '<div class="pcard-extra">'+placeTags(x.hood,3)+(fb?diffBadges(rentDiffTags(x,D)):'')+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs" data-act="rdet" data-id="'+x.id+'">جزئیات (۱۰ کلید)</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore" aria-label="اطلاعات بیشتر">بیشتر</button>'+
  '<button class="btn btn-xs" data-act="lsave" data-id="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="rset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div>';
}
/* V0.27 — کارت عمودی آگهی خرید (Design System) */
function blcard(x,D,sel,sc,fb){
  var saved=(D.savedB||[]).indexOf(x.id)>=0;
  var tot=x.m2*x.ppm;
  var budgE=E27.budgEff(D);
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">فروش</span>'+
  '<div class="pcard-badges"><span class="match" style="position:static">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(tot)+'<small>قیمت کل</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">هر متر: <b style="color:var(--ink)">'+rial(x.ppm)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-src"><span class="badge '+(tot<=budgE?'b-ok':'b-warn')+'">'+(tot<=budgE?'در بودجهٔ شما':'بالاتر از سقف شما')+'</span>'+
  '<span class="badge b-info" data-tip="وضعیت مالکیت فقط با استعلام رسمی قابل تأیید است.">مالکیت: استعلام لازم</span></div>'+
  '<div class="pcard-extra">'+placeTags(x.hood,3)+(fb?diffBadges(buyDiffTags(x,D)):'')+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs" data-act="bdet" data-id="'+x.id+'">جزئیات (۱۰ کلید)</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore" aria-label="اطلاعات بیشتر">بیشتر</button>'+
  '<button class="btn btn-xs" data-act="bsave" data-id="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="bset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div>';
}
function cmpListModal(kind){
  var D=wd(kind).data,ids=kind==='rent'?(D.saved||[]):(D.savedB||[]);
  if(ids.length<2){toast('حداقل دو ملک را ذخیره کنید');return}
  var cols=ids.map(kind==='rent'?findL:findB);
  var rows;
  if(kind==='rent'){
    rows=[['اجاره',function(x){return rial(x.rent)}],['رهن',function(x){return rial(x.dep)}],
    ['متراژ',function(x){return fa(x.m2,0)}],['عمر',function(x){return fa(x.age,0)+' سال'}],
    ['طبقه',function(x){return fa(x.floor,0)}],['خواب',function(x){return fa(x.beds,0)}],
    ['تطبیق',function(x){return '٪'+fa(lscore(x,D),0)}]];
  }else{
    rows=[['قیمت کل',function(x){return rial(x.m2*x.ppm)}],['هر متر',function(x){return rial(x.ppm)}],
    ['متراژ',function(x){return fa(x.m2,0)}],['عمر',function(x){return fa(x.age,0)+' سال'}],
    ['طبقه',function(x){return fa(x.floor,0)}],['خواب',function(x){return fa(x.beds,0)}],
    ['تطبیق',function(x){return '٪'+fa(bScore(x,D),0)}]];
  }
  placesCompareRows().forEach(function(r){rows.splice(rows.length-1,0,[r[0],function(x){return r[1](x.hood)}])});
  var act=kind==='rent'?'rset':'bset';
  var h='<h3> مقایسهٔ املاک ذخیره‌شده</h3><div class="tblwrap"><table class="tbl"><tr><th>معیار</th>'+cols.map(function(c){return '<th>'+c.t+'</th>'}).join('')+'</tr>';
  rows.forEach(function(r){h+='<tr><td>'+r[0]+'</td>'+cols.map(function(c){return '<td><b>'+r[1](c)+'</b></td>'}).join('')+'</tr>'});
  h+='<tr><td></td>'+cols.map(function(c){return '<td><button class="btn btn-xs btn-primary" data-act="'+act+'" data-id="'+c.id+'">انتخاب</button></td>'}).join('')+'</tr>';
  openModal(h+'</table></div><button class="btn" data-act="closeModal" style="margin-top:12px">بستن</button>');
}
function rentCalc(D){
  var rent=Math.round(D.B.depB*0.03);
  var depNeed=D.B.rentB<rent?Math.round(D.B.rentB/0.03):null;
  return {rent:rent,depNeed:depNeed,mon:rent+D.B.chg};
}
function termTpl(T,D){
  return 'صورت‌جلسهٔ فسخ قرارداد '+D.code+'\nطرفین: موجر '+D.owner+' و مستأجر '+S.auth.name+'\nدرخواست‌کنندهٔ فسخ: '+T.who+'\nدلیل: '+T.reason+'\nزمان تخلیه: '+T.date+'\nشرایط تحویل:\n۱- تحویل مطابق صورت‌جلسهٔ آغاز\n۲- تسویهٔ روزشمار شارژ و قبوض\n۳- بررسی وضعیت با هوش مصنوعی\n۴- بازگشت ودیعه از حساب امانی';
}
function termSteps(T){
  var TS=['درخواست فسخ','صورت‌جلسه','تأیید طرف مقابل','تخلیهٔ هوشمند','تسویه ودیعه'];
  return '<div class="steps">'+TS.map(function(s,i){
    var cls=(T.ph>i+1)?'done':(T.ph===i+1?'cur':'');
    return '<div class="st '+cls+'"><span class="stn">'+(cls==='done'?'✓':fa(i+1,0))+'</span><b>'+s+'</b></div>';
  }).join('')+'</div>';
}
/* V0.27 — مقایسهٔ قبل/بعد تخلیه با تصویر واقعی دمو، لغزنده، بزرگ‌نمایی و بارگذاری عکس کاربر */
function baHTML(){
  var st=(CE.f==='rent')?((wd('rent').data.term||{}).ba||{}):{};
  var stage=st.stage||1;
  try{ /* preload هر دو تصویر برای کشش بی‌وقفه */
    ['assets/img/emptying-before.jpg','assets/img/emptying-after.jpg'].forEach(function(u){var i2=new Image();i2.src=u});
  }catch(e){}
  return '<div class="ba27">'+
  '<div class="ba27-steps">'+
  '<div class="ba27-step '+(stage===1?'on':'done')+'">۱) روز ورود</div>'+
  '<div class="ba27-step '+(stage===2?'on':'')+'">۲) روز تخلیه</div>'+
  '<div class="ba27-step">۳) تحلیل و تسویه</div>'+
  '</div>'+
  '<div class="ba27-wrap" tabindex="0" role="slider" aria-label="مقایسهٔ روز ورود و روز تخلیه" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">'+
  '<img id="ba27-img-before" src="'+E27.baImg('before')+'" width="1200" height="800" decoding="async" fetchpriority="high" alt="روز ورود — پیش از تخلیه، با اثاثیه">'+
  '<div class="ba27-after"><img src="'+E27.baImg('after')+'" width="1200" height="800" decoding="async" alt="روز تخلیه — پس از خارج‌شدن اثاثیه"></div>'+
  '<div class="ba27-handle" style="left:50%"></div>'+
  '</div>'+
  '<input type="range" class="ba27-range" min="5" max="95" value="50" aria-label="لغزندهٔ مقایسهٔ قبل و بعد">'+
  '<div class="ba27-labs"><span>روز ورود — مبلمان موجود</span><span>روز تخلیه — خالی</span></div>'+
  '<div class="ba27-acts">'+
  '<button class="btn btn-xs" data-cba="baZoom" data-src="'+E27.baImg('before')+'">بزرگ‌نمایی روز ورود</button>'+
  '<button class="btn btn-xs" data-cba="baZoom" data-src="'+E27.baImg('after')+'">بزرگ‌نمایی روز تخلیه</button>'+
  '<label class="btn btn-xs" style="cursor:pointer;margin:0">تصویر '+(stage===1?'روز ورود':'روز تخلیه')+' خودم<input type="file" hidden accept="image/*" data-ba27="'+(stage===1?'before':'after')+'"></label>'+
  '</div>'+
  '<div class="ba27-demo">نمونهٔ نمایشی — با «تصویر خودم» عکس ملک خودتان را جایگزین کنید.</div>'+
  '</div>';
}
function payPanel(mode,unit,rate,amtStr,sugg,title){
  var amt=+(amtStr||'0'),units=Math.floor(amt/rate),fee=Math.round(amt*0.005);
  var h='<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b style="font-size:14px">'+title+'</b><span class="note">فاکتور ۰٫۵٪</span></div>';
  h+='<div class="payamt">مبلغ<b id="pay-amt">'+rial(amt)+'</b></div>';
  h+='<div class="srow"><input class="inp" data-paytxt value="'+(amtStr?Number(amtStr)/10:'')+'" placeholder="مبلغ را تایپ کنید (تومان) — ارقام فارسی هم پذیرفته" style="direction:ltr;text-align:left"></div>';
  h+='<div class="kv"><span>دریافت شما</span><b id="pay-units">'+fa(units,0)+' '+unit+'</b></div>';
  h+='<div class="kv"><span>کارمزد (۰٫۵٪)</span><b id="pay-fee">'+rial(fee)+'</b></div>';
  h+='<div class="kv"><span>مبلغ نهایی</span><b id="pay-total">'+rial(amt+fee)+'</b></div>';
  h+='<div class="chips" style="margin:12px 0 4px"><span class="note" style="align-self:center">پیشنهاد:</span>'+sugg.map(function(s){return '<span class="chip" data-act="pkset" data-v="'+s.v+'">'+s.l+'</span>'}).join('')+'</div>';
  h+='<div class="kpad">'+['1','2','3','4','5','6','7','8','9'].map(function(d){return '<button data-act="pk" data-d="'+d+'">'+fa(d,0)+'</button>'}).join('')+'<button data-act="pkdel" aria-label="حذف رقم">⌫</button><button data-act="pk" data-d="0">'+fa(0,0)+'</button><button style="visibility:hidden"></button></div>';
  h+='<button class="btn btn-primary btn-lg" style="width:100%;margin-top:12px" data-act="paySubmit" data-m="'+mode+'">پرداخت (درگاه)</button>';
  return h;
}
var PAYM={mode:null,ctx:null,amt:''};
function openPayModal(ctx,amt){
  PAYM={mode:ctx.mode,ctx:ctx,amt:String(amt!==undefined?amt:ctx.def)};
  openModal(payPanel(ctx.mode,ctx.unit,ctx.rate,PAYM.amt,ctx.sugg,ctx.title));
}
function reopenPay(){if(PAYM.ctx){openModal(payPanel(PAYM.mode,PAYM.ctx.unit,PAYM.ctx.rate,PAYM.amt,PAYM.ctx.sugg,PAYM.ctx.title))}}
var GW={cb:null,amt:0,title:''};
function openGateway(amt,title,cb){
  GW={cb:cb,amt:amt,title:title};
  openModal(
  '<div style="margin:-24px -24px 0;border-radius:18px 18px 0 0;background:#0f2447;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'+
  '<div><b style="font-size:14.5px">درگاه پرداخت اینترنتی</b><div style="font-size:11px;opacity:.8">بانک نمونه — تضمین‌شده توسط شاپرک</div></div>'+
  '<div style="text-align:left"><div style="font-size:10.5px;opacity:.8">مبلغ قابل پرداخت</div><b style="font-size:13px">'+rial(amt)+'</b></div></div>'+
  '<div style="padding:18px 4px 0">'+
  '<div class="kv"><span>پرداخت برای</span><b>'+esc(title)+'</b></div>'+
  '<div class="srow" style="margin-top:10px"><div class="slab"><span>شماره کارت</span></div><input class="inp" id="gw-card" placeholder="6104 3378 1234 5678" style="direction:ltr;text-align:left;letter-spacing:2px"></div>'+
  '<div class="grid g2"><div class="srow"><div class="slab"><span>انقضا</span></div><input class="inp" id="gw-exp" placeholder="MM/YY" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>CVV2</span></div><input class="inp" id="gw-cvv" placeholder="123" style="direction:ltr;text-align:left"></div></div>'+
  '<div class="srow"><div class="slab"><span>رمز دوم (پویا)</span></div><input class="inp" id="gw-pin" placeholder="کد پیامکی" style="direction:ltr;text-align:left"></div>'+
  '<p class="note">آزمایشی — هر کارت ۱۶ رقمی پذیرفته می‌شود.</p>'+
  '<button class="btn btn-primary btn-lg" style="width:100%" data-act="gwPay">پرداخت</button>'+
  '<button class="btn" style="width:100%;margin-top:8px" data-act="closeModal">انصراف و بازگشت</button></div>');
}
function openTourModal(lid){
  TOURX=findL(lid);TOURROT=0;
  openModal('<h3> تور مجازی ۳۶۰° — '+TOURX.t+'</h3>'+
  '<p class="note">تصویر را بکشید تا بچرخد؛ با انتخاب اتاق بین فضاها جابه‌جا شوید.</p>'+
  '<div class="tourwrap" id="tourwrap"><div class="tourimg" id="tourimg"><img id="tourpic" src="https://picsum.photos/seed/'+TOURX.seed+'-r0/1600/420" alt=""></div>'+
  '<span class="tourtag">۳۶۰°</span><span class="tourhud" id="tourdeg">۰°</span></div>'+
  '<div class="chips" style="margin-top:10px">'+TOURROOMS.map(function(nm,i){return '<span class="chip'+(i===0?' on':'')+'" data-act="troom" data-i="'+i+'">'+nm+'</span>'}).join('')+'</div>'+
  '<div class="alert al-warn">تور مجازی جایگزین چند بازدید اولیه است — بازدید نهایی را برگزار کنید.</div>'+
  '<button class="btn" data-act="closeModal" style="margin-top:10px">بستن</button>',function(){
    var wrap=document.getElementById('tourwrap');
    if(!wrap){return}
    wrap.addEventListener('pointerdown',function(e){
      e.preventDefault();
      var sx=e.clientX,sr=TOURROT;
      function mv(ev){
        var w2=wrap.clientWidth||1;
        TOURROT=Math.max(0,Math.min(100,sr+(ev.clientX-sx)/w2*100));
        drawTour();
      }
      function up(){
        document.removeEventListener('pointermove',mv);
        document.removeEventListener('pointerup',up);
      }
      document.addEventListener('pointermove',mv);
      document.addEventListener('pointerup',up);
    });
    drawTour();
  });
}
function openServicesModal(){go('svc')}

function pinfoBody(p,i,k){
  var v=i%3;
  if(k==='intro'){
    return '<p class="note">این پروژه با هدف سکونت استاندارد در '+p.loc.split('،')[0]+' اجرا می‌شود و بر عهدهٔ پیمانکار منتخب مارکت‌پلیس است.</p>'+
    '<div class="kv"><span>کاربری</span><b>مسکونی</b></div>'+
    '<div class="kv"><span>کارفرما</span><b>'+p.emp.replace('کارفرما: ','').split('—')[0]+'</b></div>'+
    '<div class="kv"><span>طبقات / زیربنا</span><b>'+p.fl+' • '+p.area+'</b></div>'+
    '<div class="kv"><span>محدودهٔ کار</span><b>'+p.scope+'</b></div>'+
    '<div class="kv"><span>مدت / شروع</span><b>'+p.dur+' — '+p.start+'</b></div>';
  }
  if(k==='roads'){
    return '<div class="ct" style="font-size:13px">مطالعات راهبری و دسترسی</div>'+
    '<p class="note">دسترسی اصلی پروژه از معبر شمالی محدوده است؛ عرض معابر داخلی حداقل ۱۰ متر و دسترسی اضطراری از ضلع جنوبی تأمین شده است. ایستگاه حمل‌ونقل عمومی در شعاع ۸۰۰ متری و طرح یک‌طرفه‌سازی کوچهٔ مجاور در دست بررسی است.</p>'+
    '<div class="kv"><span>دسترسی بزرگراهی</span><b>'+['۴ دقیقه','۷ دقیقه','۵ دقیقه'][v]+'</b></div>'+
    '<div class="kv"><span>ایستگاه مترو / BRT</span><b>'+['۹۰۰ متر','۶۵۰ متر','۱٬۲۰۰ متر'][v]+'</b></div>'+
    '<div class="kv"><span>عرض معابر داخلی</span><b>۱۰ تا ۱۲ متر</b></div>'+
    '<div class="kv"><span>پارکینگ مهمان</span><b>'+(v===1?'۶ واحد':'۴ واحد')+'</b></div>';
  }
  if(k==='studies'){
    return '<div class="ct" style="font-size:13px">مطالعات فنی و اجرایی</div>'+
    '<div class="kv"><span>سیستم سازه</span><b>'+['اسکلت بتنی با دیوار برشی','قاب بتنی','اسکلت فولادی با دال مرکب'][v]+'</b></div>'+
    '<div class="kv"><span>نما</span><b>'+['آجر نما + شیشه','تراورتن و آلومینیوم','سیمانی با عایق'][v]+'</b></div>'+
    '<div class="kv"><span>تأسیسات مکانیکی</span><b>پکیج مرکزی + موتورخانه</b></div>'+
    '<div class="kv"><span>آسانسور</span><b>'+(v===2?'۱ دستگاه ۶ نفره':'۲ دستگاه ۸ نفره')+'</b></div>'+
    '<p class="note">مصالح با گواهی استاندارد و آنالیز کارخانه راستی‌آزمایی می‌شود.</p>';
  }
  if(k==='timeline'){
    var ph=['پروانه و اسناد','گودبرداری و پی','اسکلت','نازک‌کاری','تأسیسات','پایان‌کار'];
    return '<div class="ct" style="font-size:13px">مراحل و زمان‌بندی (مجموع '+p.dur+')</div>'+
    ph.map(function(x,pi){return '<div class="esc'+(pi===0?' done':'')+'"><span class="nm">'+fa(pi+1,0)+'. '+x+'</span>'+(pi===0?'<span class="badge b-ok">انجام شد ✓</span>':'<span class="badge b-info">در برنامه</span>')+'</div>'}).join('')+
    '<p class="note">شروع اجرا: '+p.start+' — پیشرفت در داشبورد برای هر دو نقش رصد می‌شود.</p>';
  }
  if(k==='finance'){
    return '<div class="ct" style="font-size:13px">مالی و پرداخت</div>'+
    '<div class="kv"><span>پیش‌پرداخت</span><b>'+p.pre+'</b></div>'+
    '<div class="kv"><span>نحوهٔ پرداخت</span><b>'+p.pay+'</b></div>'+
    '<div class="kv"><span>حساب پروژه</span><b class="badge b-ok">امانی مستقل</b></div>'+
    '<div class="kv"><span>سپردهٔ حسن انجام کار</span><b>'+(p.pre==='۳۰٪'?'۵٪':'۳٪')+'</b></div>'+
    '<p class="note">صورت‌وضعیت ماهانه؛ پرداخت همگام با پیشرفت فیزیکیِ تأییدشدهٔ ناظر.</p>';
  }
  return '<div class="ct" style="font-size:13px">مجوزها و اسناد</div>'+
  '<div class="kv"><span>پروانهٔ ساخت</span><b class="badge '+(p.lic.indexOf('صدور')>=0?'b-warn':'b-ok')+'">'+p.lic+'</b></div>'+
  '<div class="kv"><span>سند زمین</span><b class="badge b-ok">تک‌برگ — بدون وقف و مشاع</b></div>'+
  '<div class="kv"><span>تفکیک / پایان‌کار</span><b>پس از اتمام پروژه</b></div>'+
  '<div class="kv"><span>بیمهٔ مسئولیت</span><b class="badge b-ok">معتبر در دورهٔ اجرا</b></div>'+
  (p.warn?'<div class="alert al-warn"> '+p.warn+'</div>':'');
}
function openProjectInfoModal(i){
  var p=PRJ[i];
  if(!PTOPSEL[i]){PTOPSEL[i]='intro'}
  var k=PTOPSEL[i];
  var h='<h3>'+p.t+' — توضیحات موضوعی</h3>'+
  '<div class="chips" style="margin-bottom:10px">'+PTOPICS.map(function(t){return '<span class="chip'+(t.k===k?' on':'')+'" data-act="ptop" data-i="'+i+'" data-k="'+t.k+'">'+t.t+'</span>'}).join('')+'</div>'+
  '<div>'+pinfoBody(p,i,k)+'</div>'+
  '<button class="btn" data-act="closeModal" style="margin-top:10px">بستن</button>';
  openModal(h);
}
function yieldPct(D,t){
  var s=SCN[D.scn]||SCN.mid;
  return {p:(Math.pow(1+s.p,t/12)-1)*100,g:(Math.pow(1+s.g,t/12)-1)*100,u:(Math.pow(1+s.u,t/12)-1)*100,d:(Math.pow(1+s.d,t/12)-1)*100};
}
function yieldTable(D){
  var hz=[6,12,24,36];
  var h='<table class="ctbl"><tr><th>بازه</th><th>سهم متری</th><th>طلا</th><th>سپرده</th></tr>';
  hz.forEach(function(t){
    var y=yieldPct(D,t);
    h+='<tr><td>'+fa(t,0)+' ماه</td><td><b>٪'+fa(y.p,0)+'</b></td><td>٪'+fa(y.g,0)+'</td><td>٪'+fa(y.d,0)+'</td></tr>';
  });
  return h+'</table>';
}

