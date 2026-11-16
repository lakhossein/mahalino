/* ═══ ۱۰.۵) استعلام و قرارداد داخلی — مشترک اجاره و خرید ═══ */
/* Optional secure config: window.MAHALINO_LOOKUP={postalEndpoint:'/api/lookup/postal',identityEndpoint:'/api/lookup/identity'} — provider keys must stay server-side. */
var CON_STATUS={
  draft:{l:'پیش‌نویس',c:'b-info'},
  identity:{l:'در انتظار اطلاعات هویتی',c:'b-warn'},
  info:{l:'در انتظار اطلاعات ملک و مالی',c:'b-warn'},
  approval:{l:'در انتظار تأیید طرفین',c:'b-warn'},
  ready:{l:'آمادهٔ ثبت داخلی',c:'b-info'},
  signed:{l:'امضاشده (داخلی)',c:'b-ok'},
  terminated:{l:'فسخ‌شده',c:'b-warn'},
  cancelled:{l:'لغوشده',c:'b-warn'}
};
var LK_CFG={postalEndpoint:null,identityEndpoint:null};
function lkConfig(){return (window.MAHALINO_LOOKUP&&typeof window.MAHALINO_LOOKUP==='object')?window.MAHALINO_LOOKUP:LK_CFG}
function conKind(){return CURRENT==='buy'?'buy':'rent'}
function conRoles(kind){return kind==='buy'?{owner:'فروشنده',party:'خریدار'}:{owner:'موجر',party:'مستأجر'}}
function conInit(D,kind){
  kind=kind||'rent';
  if(!D.ctr){
    D.ctr={kind:kind,step:1,draftCode:'MH-'+String(Date.now()).slice(-6),parties:{},prop:{},terms:{},verify:{me:'none',owner:'none'},appr:{me:false,owner:false,meName:'',ownerName:''},finalized:false};
  }
  var c=D.ctr;
  c.kind=kind;
  c.parties=c.parties||{};c.prop=c.prop||{};c.terms=c.terms||{};c.verify=c.verify||{me:'none',owner:'none'};c.appr=c.appr||{me:false,owner:false,meName:'',ownerName:''};
  c.parties.lessee=c.parties.lessee||{name:S.auth?S.auth.name:'',id:'',mobile:S.auth?S.auth.phone:''};
  c.parties.lessor=c.parties.lessor||{name:'',id:'',mobile:''};
  if(!c.parties.witnesses)c.parties.witnesses=[{name:'',mobile:''},{name:'',mobile:''}];
  if(kind==='buy'){
    if(D.blist&&!c.prop.title){var b=findB(D.blist);c.prop.title=b.t;c.prop.area=b.m2;c.prop.hood=findH(b.hood).n}
    if(c.terms.price===undefined)c.terms.price=D.price||D.budg||0;
    if(!c.terms.payment)c.terms.payment=(D.pay&&D.pay.staged)?'مرحله‌ای':'یکجا';
    if(!c.terms.delivery)c.terms.delivery='';
  }else{
    if(D.listing&&!c.prop.title){var x=findL(D.listing);c.prop.title=x.t;c.prop.area=x.m2;c.prop.hood=findH(x.hood).n}
    if(c.terms.deposit===undefined)c.terms.deposit=D.B?D.B.depB:0;
    if(c.terms.rent===undefined)c.terms.rent=D.B?rentCalc(D).rent:0;
    if(!c.terms.duration)c.terms.duration=D.dur||'یک‌ساله';
    if(!c.terms.paymentDay)c.terms.paymentDay='پنجم هر ماه';
    if(!c.terms.start)c.terms.start='';
  }
  return c;
}
function conStatus(D,kind){
  var c=conInit(D,kind||'rent');
  if(c.finalized)return 'signed';
  if(!c.parties.lessee.id||c.verify.me==='none'||!c.parties.lessor.name)return c.parties.lessee.id?'identity':'draft';
  if(!c.prop.postal||!c.prop.addr||((c.kind==='rent')?(c.terms.rent==null||c.terms.deposit==null||!Number.isFinite(Number(c.terms.rent))||!Number.isFinite(Number(c.terms.deposit))||Number(c.terms.rent)<0||Number(c.terms.deposit)<0||(Number(c.terms.rent)===0&&Number(c.terms.deposit)===0)):(!c.terms.price)))return 'info';
  if(!(c.appr.me&&c.appr.owner))return 'approval';
  return 'ready';
}
function conBadge(D,kind){var s=conStatus(D,kind),m=CON_STATUS[s]||CON_STATUS.draft;return '<span class="badge '+m.c+'">'+m.l+'</span>'}
function conStepHTML(c){
  var steps=['طرفین قرارداد','ملک و مالی','بازبینی و تأیید','ثبت داخلی'];
  return '<div class="con-steps">'+steps.map(function(s,i){var n=i+1,cl=n<c.step?'done':(n===c.step?'cur':'');return '<div class="con-step '+cl+'"><span>'+fa(n,0)+'</span>'+s+'</div>'}).join('')+'</div>';
}
function conSnapshot(D,kind){
  var c=conInit(D,kind||'rent'),b=D.blist?findB(D.blist):null,x=D.listing?findL(D.listing):null;
  return {id:c.draftCode,kind:c.kind,draftCode:c.draftCode,date:Date.now(),status:conStatus(D,c.kind),finalized:!!c.finalized,code:c.code||'',
    lessor:JSON.parse(JSON.stringify(c.parties.lessor)),lessee:JSON.parse(JSON.stringify(c.parties.lessee)),witnesses:JSON.parse(JSON.stringify(c.parties.witnesses||[])),
    property:{title:c.prop.title||(b?b.t:(x?x.t:'ملک انتخاب‌شده')),hood:c.prop.hood||(b?findH(b.hood).n:(x?findH(x.hood).n:'')),addr:c.prop.addr||'',postal:c.prop.postal||'',area:c.prop.area||(b?b.m2:(x?x.m2:''))},
    terms:JSON.parse(JSON.stringify(c.terms)),maintenance:D.rep?JSON.parse(JSON.stringify(D.rep)):{},verify:JSON.parse(JSON.stringify(c.verify)),approvals:JSON.parse(JSON.stringify(c.appr))};
}
function lookupStatus(id,cls,txt){
  var e=document.getElementById(id);if(!e)return;
  e.className='lk-status '+(cls||'');
  e.innerHTML=txt;
}
function validNationalId(id){
  id=String(id||'').replace(/\D/g,'');
  if(id.length!==10||/^(\d)\1{9}$/.test(id))return false;
  var s=0,i,d;
  for(i=0;i<9;i++){d=+id.charAt(i);s+=d*(10-i)}
  var r=s%11,chk=+id.charAt(9);
  return chk===(r<2?r:11-r);
}
function validPostalCode(code){code=String(code||'').replace(/\D/g,'');return code.length===10&&code.charAt(0)!=='0'&&!/^(\d)\1{9}$/.test(code)}
function lkPostalAddress(code){
  code=String(code||'').replace(/\D/g,'');
  if(!validPostalCode(code))return Promise.resolve({ok:false,why:'invalid'});
  var cfg=lkConfig();
  if(cfg.postalEndpoint){
    return fetch(cfg.postalEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postalCode:code})})
      .then(function(r){return r.json()})
      .then(function(j){if(!j||j.ok===false||!j.address)return {ok:false,why:'notfound'};return {ok:true,addr:j.address,approx:!!j.approximate}})
      .catch(function(){return {ok:false,why:'unavailable'}});
  }
  return fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(code)+'&limit=3')
    .then(function(r){return r.json()})
    .then(function(j){
      var f=(j&&j.features||[]).filter(function(x){var nm=x.properties?String(x.properties.name||'').replace(/\D/g,''):'';return x.properties&&(x.properties.osm_value==='postcode'&&nm===code)})[0];
      if(f){
        var p=f.properties,parts=[p.district,p.city,p.county,p.state].filter(function(x){return x});
        return {ok:true,addr:parts.join('، '),approx:true};
      }
      return fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=ir&postalcode='+code+'&limit=1')
        .then(function(r){return r.json()})
        .then(function(a){if(a&&a[0])return {ok:true,addr:a[0].display_name,approx:false};return {ok:false,why:'notfound'}});
    })
    .catch(function(){return {ok:false,why:'unavailable'}});
}
function lkIdentityName(nid){
  var v=String(nid||'').replace(/\D/g,'');
  if(!validNationalId(v))return Promise.resolve({ok:false,why:'invalid'});
  var cfg=lkConfig();
  if(!cfg.identityEndpoint)return Promise.resolve({ok:false,why:'unconfigured',formatOk:true});
  var ctrl=window.AbortController?new AbortController():null;
  var timer=ctrl?setTimeout(function(){ctrl.abort()},12000):null;
  return fetch(cfg.identityEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nationalId:v}),signal:ctrl?ctrl.signal:undefined})
    .then(function(r){return r.json()})
    .then(function(j){
      if(timer)clearTimeout(timer);
      if(!j||j.ok===false||!j.firstName&&!j.lastName)return {ok:false,why:'notfound'};
      return {ok:true,name:[j.firstName||'',j.lastName||''].join(' ').trim()};
    })
    .catch(function(){if(timer)clearTimeout(timer);return {ok:false,why:'unavailable'}});
}
function lookupIdentity(id,role,approved){
  var D=wd(conKind()).data,c=conInit(D,conKind());
  var v=(document.getElementById(role==='me'?'cl-id':'co-id')||{}).value||'';
  v=String(v).replace(/\D/g,'');
  if(!validNationalId(v)){lookupStatus('lk-id-'+(role==='me'?'me':'owner'),'err','کد ملی معتبر نیست؛ ۱۰ رقم و رقم کنترلی را بررسی کنید.');return false}
  c.parties[role==='me'?'lessee':'lessor'].id=v;
  var box='lk-id-'+(role==='me'?'me':'owner');
  if(!lkConfig().identityEndpoint){
    c.verify[role]='format';
    save();
    lookupStatus(box,'warn','کد ملی از نظر قالب معتبر است. تأیید رسمی هویت در این نسخه انجام نمی‌شود؛ نام حساب شما حفظ شد.');
    return true;
  }
  if(approved!==true){openModal('<h3>رضایت برای استعلام هویت</h3><p class="note">با تأیید شما، کد ملی به سرویس هویت پیکربندی‌شده ارسال می‌شود. این مرحله در نسخهٔ نمایشی جایگزین احراز هویت رسمی نیست.</p><div class="qr"><button data-act="e30IdentityConsent" data-role="'+qesc(role)+'">موافقم، استعلام کن</button><button data-act="closeModal">انصراف</button></div>');return false}
  lookupStatus(box,'load','در حال استعلام هویت...');
  lkIdentityName(v).then(function(r){
    if(!r.ok){lookupStatus(box,r.why==='unavailable'?'err':'err',r.why==='unavailable'?'سرویس هویت در دسترس نیست؛ دوباره تلاش کنید یا اطلاعات را دستی وارد کنید.':'هویت پیدا نشد؛ کد ملی را بررسی کنید یا بعداً دوباره تلاش کنید.');return}
    if(r.name){
      if(role==='me'){c.parties.lessee.name=r.name;var e=document.getElementById('cl-name');if(e)e.value=r.name}
      else{c.parties.lessor.name=r.name;var e2=document.getElementById('co-name');if(e2)e2.value=r.name}
    }
    c.verify[role]='official';
    save();lookupStatus(box,'ok','هویت تأیید شد و اطلاعات موجود تکمیل شد.');
  });
  return true;
}
function lookupPostal(approved){
  var D=wd(conKind()).data,c=conInit(D,conKind());
  var code=((document.getElementById('cp-postal')||{}).value||'').replace(/\D/g,'');
  if(!validPostalCode(code)){lookupStatus('lk-postal','err','کد پستی باید ۱۰ رقم باشد و با صفر شروع نشود.');return}
  if(approved!==true){openModal('<h3>رضایت برای استعلام بیرونی</h3><p class="note">با تأیید، کد پستی به سرویس استعلام نشانی پیکربندی‌شده یا Photon/Nominatim ارسال می‌شود. برای حفظ حریم خصوصی می‌توانید نشانی را دستی وارد کنید.</p><div class="qr"><button data-act="e30PostalConsent">موافقم، استعلام کن</button><button data-act="closeModal">انصراف</button></div>');return}
  c.prop.postal=code;
  lookupStatus('lk-postal','load','در حال استعلام نشانی...');
  lkPostalAddress(code).then(function(r){
    if(!r.ok){lookupStatus('lk-postal','err',r.why==='unavailable'?'سرویس نشانی در دسترس نیست؛ دوباره تلاش کنید یا نشانی را دستی وارد کنید.':'نشانی‌ای برای این کد پیدا نشد؛ می‌توانید نشانی را دستی وارد کنید.');return}
    c.prop.addr=r.addr;
    var a=document.getElementById('cp-addr');if(a)a.value=r.addr;
    save();
    lookupStatus('lk-postal','ok',(r.approx?'نشانی تقریبی':'نشانی')+' پر شد؛ لطفاً پلاک و جزئیات را بررسی کنید.');
  });
}
function conPartyHTML(D,kind){
  var c=conInit(D,kind),r=conRoles(kind);
  var h='<div class="card"><div class="ct">طرفین قرارداد</div><p class="note">کد ملی برای تکمیل خودکار مشخصات.</p>';
  h+='<div class="grid g2"><div class="signer"><div class="sh">'+r.party+' (شما)</div>'+
  '<div class="srow"><div class="slab"><span>نام</span></div><input class="inp" id="cl-name" value="'+qesc(c.parties.lessee.name||'')+'"></div>'+
  '<div class="srow"><div class="slab"><span>کد ملی</span></div><input class="inp" id="cl-id" value="'+qesc(c.parties.lessee.id||'')+'" inputmode="numeric" maxlength="10" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>موبایل</span></div><input class="inp" id="cl-mobile" value="'+qesc(c.parties.lessee.mobile||'')+'" readonly style="direction:ltr;text-align:left"></div>'+
  '<button class="btn btn-sm" data-act="lookupId" data-r="me">'+(lkConfig().identityEndpoint?'استعلام و تکمیل خودکار':'بررسی کد ملی')+'</button><div class="lk-status" id="lk-id-me"></div></div>';
  h+='<div class="signer"><div class="sh">'+r.owner+'</div>'+
  '<div class="srow"><div class="slab"><span>نام</span></div><input class="inp" id="co-name" value="'+qesc(c.parties.lessor.name||'')+'"></div>'+
  '<div class="srow"><div class="slab"><span>کد ملی</span></div><input class="inp" id="co-id" value="'+qesc(c.parties.lessor.id||'')+'" inputmode="numeric" maxlength="10" style="direction:ltr;text-align:left"></div>'+
  '<div class="srow"><div class="slab"><span>موبایل</span></div><input class="inp" id="co-mobile" value="'+qesc(c.parties.lessor.mobile||'')+'" inputmode="tel" style="direction:ltr;text-align:left"></div>'+
  '<button class="btn btn-sm" data-act="lookupId" data-r="owner">'+(lkConfig().identityEndpoint?'استعلام و تکمیل خودکار':'بررسی کد ملی')+'</button><div class="lk-status" id="lk-id-owner"></div></div></div>';
  h+='<h4 class="mini">شاهدان</h4><div class="grid g2">'+(c.parties.witnesses||[]).map(function(w,i){
    return '<div class="srow"><div class="slab"><span>شاهد '+(i+1)+' — نام</span></div><input class="inp" id="cw'+(i+1)+'n" value="'+qesc(w.name||'')+'"></div><div class="srow"><div class="slab"><span>موبایل شاهد '+(i+1)+'</span></div><input class="inp" id="cw'+(i+1)+'m" value="'+qesc(w.mobile||'')+'" style="direction:ltr;text-align:left"></div>';
  }).join('')+'</div>';
  h+='<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="cpartySave">ذخیره و ادامه</button></div></div>';
  return h;
}
function conPropHTML(D,kind){
  var c=conInit(D,kind),isRent=kind!=='buy';
  var h='<div class="card"><div class="ct">ملک و شرایط مالی</div>';
  h+='<div class="grid g2"><div><div class="kv"><span>ملک</span><b>'+esc(c.prop.title||'—')+'</b></div>'+
  '<div class="srow"><div class="slab"><span>کد پستی</span></div><div style="display:flex;gap:6px"><input class="inp" id="cp-postal" value="'+qesc(c.prop.postal||'')+'" inputmode="numeric" maxlength="10" style="direction:ltr;text-align:left;flex:1"><button class="btn btn-sm" data-act="lookupPostal">استعلام</button></div><div class="lk-status" id="lk-postal"></div></div>'+
  '<div class="srow"><div class="slab"><span>نشانی</span></div><input class="inp" id="cp-addr" value="'+qesc(c.prop.addr||'')+'" placeholder="با استعلام کد پستی یا دستی"></div>'+
  '<div class="srow"><div class="slab"><span>متراژ (متر)</span></div><input class="inp" id="cp-area" type="number" value="'+qesc(String(c.prop.area||''))+'"></div></div>';
  h+='<div>';
  if(isRent){
    h+='<div class="srow"><div class="slab"><span>تاریخ شروع</span></div><input class="inp" id="cp-start" type="date" value="'+qesc(c.terms.start||'')+'" style="direction:ltr;text-align:left"></div>'+
    '<div class="srow"><div class="slab"><span>مدت</span></div><select class="inp" id="cp-dur"><option'+(c.terms.duration==='یک‌ساله'?' selected':'')+'>یک‌ساله</option><option'+(c.terms.duration==='دوساله'?' selected':'')+'>دوساله</option></select></div>'+
    '<div class="srow"><div class="slab"><span>ودیعه (تومان)</span></div><input class="inp" id="cp-dep" type="number" value="'+qesc(String(c.terms.deposit?c.terms.deposit/10:''))+'" style="direction:ltr;text-align:left"></div>'+
    '<div class="srow"><div class="slab"><span>اجارهٔ ماهانه (تومان)</span></div><input class="inp" id="cp-rent" type="number" value="'+qesc(String(c.terms.rent==null?'':c.terms.rent/10))+'" style="direction:ltr;text-align:left"></div>'+
    '<div class="srow"><div class="slab"><span>روز پرداخت</span></div><select class="inp" id="cp-pay"><option'+(c.terms.paymentDay==='پنجم هر ماه'?' selected':'')+'>پنجم هر ماه</option><option'+(c.terms.paymentDay==='اول هر ماه'?' selected':'')+'>اول هر ماه</option><option'+(c.terms.paymentDay==='توافقی'?' selected':'')+'>توافقی</option></select></div>';
  }else{
    h+='<div class="srow"><div class="slab"><span>قیمت توافق‌شده (تومان)</span></div><input class="inp" id="cp-price" type="number" value="'+qesc(String(c.terms.price?c.terms.price/10:''))+'" style="direction:ltr;text-align:left"></div>'+
    '<div class="srow"><div class="slab"><span>تاریخ تحویل</span></div><input class="inp" id="cp-delivery" type="date" value="'+qesc(c.terms.delivery||'')+'" style="direction:ltr;text-align:left"></div>'+
    '<div class="srow"><div class="slab"><span>نحوهٔ پرداخت</span></div><select class="inp" id="cp-payment"><option'+(c.terms.payment==='مرحله‌ای'?' selected':'')+'>مرحله‌ای</option><option'+(c.terms.payment==='یکجا'?' selected':'')+'>یکجا</option></select></div>';
  }
  h+='</div></div>';
  if(isRent){
    h+='<h4 class="mini">مرز تعمیرات</h4><div class="chips">'+REP.map(function(r){var v=(D.rep&&D.rep[r[0]])||r[1];return '<span class="chip'+(v==='o'?' on':'')+'" data-act="rep" data-k="'+r[0]+'">'+(v==='o'?'موجر':'مستأجر')+': '+r[0]+'</span>'}).join('')+'</div>';
  }
  h+='<div class="srow" style="margin-top:10px"><div class="slab"><span>شرایط خاص</span></div><textarea class="inp" id="cp-notes" rows="3" placeholder="توافقات ویژه...">'+esc(c.terms.notes||'')+'</textarea></div>';
  h+='<p class="note">مالکیت و سند در این نسخه استعلام نمی‌شود؛ پیش از پرداخت، مدارک را بررسی کنید.</p>';
  h+='<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="cpropSave">ذخیره و ادامه</button><button class="btn" data-act="cback">→ طرفین</button></div></div>';
  return h;
}
function conReviewHTML(D,kind){
  var c=conInit(D,kind),s=conSnapshot(D,kind);
  var h='<div class="card"><div class="ct">بازبینی و تأیید</div>'+conBadge(D,kind)+'<p class="note">پیش‌نویس را بررسی کنید. این تأیید داخلی است و امضای رسمی محسوب نمی‌شود.</p>';
  h+='<div class="doc-preview">'+contractDocHTML(s,false)+'</div>';
  h+='<div class="grid g2" style="margin-top:12px"><div class="signer"><div class="sh">تأیید شما</div><label class="switch"><input type="checkbox" id="ca-me"'+(c.appr.me?' checked':'')+'><span class="tr"></span></label><span class="note">پیش‌نویس را خواندم و تأیید می‌کنم.</span><input class="inp" id="ca-me-name" value="'+qesc(c.appr.meName||(S.auth?S.auth.name:''))+'" placeholder="نام و نام خانوادگی" style="margin-top:8px"></div>'+
  '<div class="signer"><div class="sh">تأیید طرف مقابل</div><label class="switch"><input type="checkbox" id="ca-owner"'+(c.appr.owner?' checked':'')+'><span class="tr"></span></label><span class="note">تأیید طرف مقابل را دریافت کرده‌ام.</span><input class="inp" id="ca-owner-name" value="'+qesc(c.appr.ownerName||c.parties.lessor.name||'')+'" placeholder="نام طرف مقابل" style="margin-top:8px"></div></div>';
  h+='<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="capprove">ثبت تأیید و ادامه</button><button class="btn" data-act="cback">→ ملک و مالی</button><button class="btn" data-act="cdoc" data-i="cur">مشاهدهٔ سند</button></div></div>';
  return h;
}
function conFinishHTML(D,kind){
  var c=conInit(D,kind),s=conSnapshot(D,kind);
  if(!c.finalized){
    return '<div class="card"><div class="ct">ثبت قرارداد داخلی</div>'+conBadge(D,kind)+
    '<p class="note">با ثبت، این قرارداد در محلینو ذخیره می‌شود و PDF آن قابل دریافت است. این ثبت، ثبت رسمی در سامانه‌های دولتی نیست.</p>'+
    '<div class="alert al-warn">ثبت رسمی نیازمند احراز هویت و امضای الکترونیک در سامانهٔ رسمی است و در این نسخه انجام نمی‌شود.</div>'+
    '<div class="fs-actions"><button class="btn btn-primary" data-act="cfinalize">ثبت قرارداد داخلی</button><button class="btn" data-act="cback">→ بازبینی</button></div></div>';
  }
  return '<div class="card done-card"><div class="bigicon">✓</div><div class="ct">قرارداد داخلی ثبت شد</div>'+
  '<div class="kv"><span>شناسه</span><b style="direction:ltr">'+esc(c.code||c.draftCode)+'</b></div>'+
  '<div class="kv"><span>وضعیت</span><b>'+conBadge(D,kind)+'</b></div>'+
  '<div class="alert al-warn">این سند در سامانهٔ رسمی ثبت نشده است. برای ثبت رسمی، احراز هویت و امضای الکترونیک در سامانهٔ رسمی لازم است.</div>'+
  '<div class="fs-actions"><button class="btn btn-primary" data-act="cdoc" data-i="cur">مشاهدهٔ سند</button><button class="btn" data-act="cprint">دریافت PDF</button></div></div>';
}
function conFlowHTML(D,kind){
  var c=conInit(D,kind);
  var h=conStepHTML(c);
  if(c.finalized)return h+conFinishHTML(D,kind);
  if(c.step<=1)return h+conPartyHTML(D,kind);
  if(c.step===2)return h+conPropHTML(D,kind);
  if(c.step===3)return h+conReviewHTML(D,kind);
  return h+conFinishHTML(D,kind);
}
function contractDocHTML(s,forPrint){
  s=s||{};var t=s.terms||{},p=s.property||{},lo=s.lessor||{},le=s.lessee||{},ap=s.approvals||{},vs=s.verify||{},sale=s.kind==='buy';
  var finalized=!!s.finalized;
  var title=sale?'مبایعه‌نامه':'اجاره‌نامهٔ مسکونی';
  var wm=finalized?'نسخهٔ داخلی — ثبت رسمی انجام نشده':'پیش‌نویس — ثبت رسمی انجام نشده';
  var rep=s.maintenance||{};
  var repRows=Object.keys(rep).length?Object.keys(rep).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+(rep[k]==='o'?'موجر':'مستأجر')+'</td></tr>'}).join(''):'<tr><td colspan="2">توافقی ثبت نشده است</td></tr>';
  var financial=sale?('<tr><th>قیمت توافق‌شده</th><td>'+rial(t.price||0)+'</td></tr><tr><th>نحوهٔ پرداخت</th><td>'+esc(t.payment||'—')+'</td></tr>'):('<tr><th>ودیعه</th><td>'+rial(t.deposit||0)+'</td></tr><tr><th>اجارهٔ ماهانه</th><td>'+rial(t.rent||0)+'</td></tr><tr><th>روز پرداخت</th><td>'+esc(t.paymentDay||'—')+'</td></tr>');
  return '<div class="doc '+(finalized?'registered':'draft')+'" dir="rtl">'+
  '<div class="doc-watermark">'+wm+'</div>'+
  '<div class="doc-head"><div class="doc-brand">محلینو <span>سامانهٔ جامع مسکن</span></div><h1>'+title+'</h1><div class="doc-sub">'+esc(sale?'قرارداد خرید و فروش':'قرارداد اجاره')+'</div></div>'+
  '<div class="doc-meta"><div><span>شناسهٔ سند</span><b dir="ltr">'+esc(s.draftCode||'—')+'</b></div><div><span>تاریخ تنظیم</span><b>'+fd(s.date||Date.now())+'</b></div><div><span>وضعیت</span><b>'+(CON_STATUS[s.status]?CON_STATUS[s.status].l:'پیش‌نویس')+'</b></div><div><span>محل تنظیم</span><b>'+esc(p.hood||'تهران')+'</b></div></div>'+
  '<div class="doc-reg warn"><b>ثبت رسمی انجام نشده است</b><br><span>این سند توسط محلینو تولید شده و جایگزین سند رسمی یا تأیید سامانهٔ ثبت نیست. برای ثبت رسمی، احراز هویت و امضای الکترونیک لازم است.</span></div>'+
  '<section class="doc-sec"><h2>مادهٔ ۱ — طرفین قرارداد</h2><table class="doc-table"><thead><tr><th>نقش</th><th>نام</th><th>کد ملی</th><th>موبایل</th></tr></thead><tbody>'+
  '<tr><td>'+(sale?'فروشنده':'موجر')+'</td><td>'+esc(lo.name||'—')+'</td><td dir="ltr">'+esc(lo.id||'—')+'</td><td dir="ltr">'+esc(lo.mobile||'—')+'</td></tr>'+
  '<tr><td>'+(sale?'خریدار':'مستأجر')+'</td><td>'+esc(le.name||'—')+'</td><td dir="ltr">'+esc(le.id||'—')+'</td><td dir="ltr">'+esc(le.mobile||'—')+'</td></tr>'+
  ((s.witnesses||[]).filter(function(w){return w.name||w.mobile}).map(function(w,i){return '<tr><td>شاهد '+(i+1)+'</td><td>'+esc(w.name||'—')+'</td><td>—</td><td dir="ltr">'+esc(w.mobile||'—')+'</td></tr>'}).join(''))+
  '</tbody></table><p class="doc-note">اهلیت قانونی و مالکیت طرفین در سامانهٔ رسمی بررسی می‌شود و در این سند تضمین نمی‌شود.</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۲ — مشخصات ملک</h2><table class="doc-table"><tbody><tr><th>عنوان</th><td>'+esc(p.title||'—')+'</td></tr><tr><th>محله</th><td>'+esc(p.hood||'—')+'</td></tr><tr><th>نشانی</th><td>'+esc(p.addr||'—')+'</td></tr><tr><th>کد پستی</th><td dir="ltr">'+esc(p.postal||'—')+'</td></tr><tr><th>متراژ</th><td>'+fa(p.area||0,0)+' متر مربع</td></tr></tbody></table></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۳ — '+(sale?'تحویل و انتقال':'مدت قرارداد')+'</h2><p>'+(sale?('تاریخ تحویل: <b>'+esc(dateFa(t.delivery))+'</b>. انتقال سند در دفتر اسناد رسمی انجام می‌شود.'):('مدت اجاره <b>'+esc(t.duration||'—')+'</b> از تاریخ <b>'+esc(dateFa(t.start))+'</b> آغاز می‌شود.'))+'</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۴ — شرایط مالی</h2><table class="doc-table"><tbody>'+financial+'<tr><th>روش پرداخت</th><td>انتقال بانکی / توافق طرفین</td></tr></tbody></table></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۵ — تعهدات '+(sale?'فروشنده':'موجر')+'</h2><ul><li>تحویل ملک در وضعیت توافق‌شده و مطابق صورت‌جلسه.</li><li>انجام تعهدات قانونی مربوط به '+(sale?'انتقال سند و تخلیه':'تعمیرات اساسی و سازه‌ای')+'.</li><li>عدم مزاحمت در استفادهٔ متعارف.</li></ul></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۶ — تعهدات '+(sale?'خریدار':'مستأجر')+'</h2><ul><li>پرداخت مبالغ در موعد توافق‌شده.</li><li>رعایت شرایط قرارداد و مقررات ساختمان.</li><li>'+(sale?'همکاری در انتقال سند':'استفادهٔ متعارف و پرداخت هزینه‌های مصرفی')+'.</li></ul></section>'+
  (sale?'<section class="doc-sec"><h2>مادهٔ ۷ — تحویل و انشعابات</h2><p>تحویل با صورت‌جلسه و ثبت وضعیت کنتورهای آب، برق و گاز انجام می‌شود.</p></section>':'<section class="doc-sec"><h2>مادهٔ ۷ — مرز تعمیرات</h2><table class="doc-table"><thead><tr><th>مورد</th><th>مسئول</th></tr></thead><tbody>'+repRows+'</tbody></table></section>')+
  '<section class="doc-sec"><h2>مادهٔ ۸ — فسخ، تضمین و اختلاف</h2><p>فسخ یا تغییر شرایط با توافق طرفین انجام می‌شود. در صورت تأخیر، طرفین مطابق توافق و مقررات جاری اقدام می‌کنند. اختلافات ابتدا از طریق مذاکره و سپس مراجع قانونی پیگیری می‌شود.</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۹ — شرایط خاص</h2><p>'+(t.notes?esc(t.notes):'شرط خاصی ثبت نشده است.')+'</p></section>'+
  '<section class="doc-sec doc-sign"><h2>مادهٔ ۱۰ — تأییدها و امضاها</h2><table class="doc-table"><thead><tr><th>طرف</th><th>نام</th><th>تأیید داخلی</th><th>امضای رسمی</th></tr></thead><tbody><tr><td>'+(sale?'فروشنده':'موجر')+'</td><td>'+esc(ap.ownerName||lo.name||'—')+'</td><td>'+(ap.owner?'ثبت شد':'ثبت نشده')+'</td><td>انجام نشده</td></tr><tr><td>'+(sale?'خریدار':'مستأجر')+'</td><td>'+esc(ap.meName||le.name||'—')+'</td><td>'+(ap.me?'ثبت شد':'ثبت نشده')+'</td><td>انجام نشده</td></tr></tbody></table><div class="doc-siglines"><div>امضای '+(sale?'فروشنده':'موجر')+': ............................</div><div>امضای '+(sale?'خریدار':'مستأجر')+': ............................</div><div>شاهد ۱: ............................</div><div>شاهد ۲: ............................</div></div><p class="doc-note">محل امضای دستی روی نسخهٔ چاپی است؛ این سند امضای الکترونیک رسمی ندارد.</p></section>'+
  '<footer class="doc-foot"><div>سند تولیدشده در محلینو — '+fd(Date.now())+'</div><div>نسخهٔ رسمی باید از سامانهٔ ثبت رسمی دریافت شود.</div></footer></div>';
}
var DOC_SNAP=null;
function printContract(snap){
  if(!snap)return;
  var root=document.getElementById('print-root');
  if(!root){root=document.createElement('div');root.id='print-root';document.body.appendChild(root)}
  root.innerHTML=contractDocHTML(snap,true);
  var oldTitle=document.title;
  document.title=(snap.kind==='buy'?'مبایعه‌نامه-':'اجاره‌نامه-')+(snap.code||snap.draftCode||'draft');
  document.body.classList.add('doc-printing');
  var done=function(){document.body.classList.remove('doc-printing');root.innerHTML='';document.title=oldTitle;window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  setTimeout(function(){try{window.print()}catch(e){}setTimeout(done,1200)},90);
}
function conFinalize(D,kind){
  if(D.signed)return true;
  var c=conInit(D,kind),snap=conSnapshot(D,kind),r=conRoles(kind);
  if(!(c.appr.me&&c.appr.owner)){toast('تأیید دو طرف لازم است');return false}
  c.finalized=true;c.code='MH-'+String(Date.now()).slice(-8);D.signed=true;D.code=c.code;if(kind==='rent')D.dur=c.terms.duration;
  snap.code=c.code;snap.finalized=true;snap.status='signed';
  var title=(kind==='buy'?'مبایعه‌نامه ':'اجاره‌نامهٔ ')+(c.prop.title||'ملک');
  var rid=addReq(kind,'قرارداد',title+' — '+c.code,'کامل شد','قرارداد داخلی امضاشده؛ ثبت رسمی انجام نشده');
  var wfId=S.active[kind]||null;
  if(kind==='rent')closeReqs('rent','بازدید',wfId);
  S.contracts.push({code:c.code,draftCode:c.draftCode,kind:kind,title:title,t:Date.now(),req:rid,detail:true,status:'signed_internal',wfId:wfId,doc:snap});
if(window.E29){try{
  var _lit=E29.libAPI.saveArtifact({type:'contract',title:title,
    summary:(kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+' '+c.code,
    artifact:{doc:snap,kind:kind},entityId:c.code,workflowId:wfId,
    tokenCost:COSTS.contract_draft||0,txnId:window.__v29conTxn||null});
  window.__v29conTxn=null;
  E29.bus.emit('contract.status',{title:'قرارداد ثبت شد',msg:title+' — '+c.code,code:c.code,status:'signed',libId:_lit?_lit.id:null});
}catch(e){console.error('E29 contract save',e)}}
  if(D.grtId){var _ge=grtOf(D.grtId);if(_ge){_ge.contractCode=c.code;_ge.contractWf=wfId;_ge.rentWf=wfId;grtLog(_ge,'اجاره‌نامهٔ مستأجر امضا شد — '+c.code);_ge.updatedAt=Date.now()}}
  save();toast('قرارداد داخلی ثبت شد — '+c.code);
  if(CURRENT==='rent'||CURRENT==='buy'||CURRENT==='dash')renderCurrent();
  return true;
}
function conCtx(){
  var kind=conKind(),D=wd(kind).data;
  return {kind:kind,D:D,c:conInit(D,kind)};
}


VIEWS.rent=function(){
  var el=document.getElementById('v-rent'),d=wd('rent'),D=d.data,st=d.step,x,i;
  var h=wtop('rent','فلوی اجارهٔ بلندمدت','از بودجه و انتخاب ملک تا قرارداد و تخلیه');
  h+=flowReqBlock('rent');
  if(st===1){
    if(!D.B){D.B={inc:1500000000,depB:CTX.dep||15000000000,rentB:CTX.rent||500000000,chg:50000000,incr:100000000}}
    h+='<div class="grid g2"><div class="card"><div class="ct"> ساختار بودجهٔ اجاره</div>';
    h+='<div class="fld"><span class="fl">درآمد ماهانهٔ خانوار</span>'+rng('inc','درآمد ماهانه',500000000,4000000000,50000000,D.B.inc)+'<span class="fh">مبنای سنجش توان پرداخت اجاره (حداکثر ۳۰٪ درآمد).</span></div>';
    h+='<div class="fld"><span class="fl">سقف ودیعه</span>'+rng('depB','سقف ودیعه',5000000000,60000000000,1000000000,D.B.depB)+'<span class="fh">حداکثر مبلغی که برای ودیعه کنار گذاشته‌اید.</span></div>';
    h+='<div class="fld"><span class="fl">سقف اجارهٔ ماهانه</span>'+rng('rentB','سقف اجارهٔ ماهانه',300000000,1500000000,20000000,D.B.rentB)+'<span class="fh">بدون احتساب شارژ و قبوض.</span></div>';
    h+='<div class="fld"><span class="fl">میانگین شارژ ماهانه</span>'+rng('chg','شارژ ماهانه',20000000,150000000,5000000,D.B.chg)+'<span class="fh">شارژ ساختمان + هزینه‌های مشترک.</span></div>';
    h+='<div class="kv"><span>اجارهٔ متناظر با ودیعهٔ شما</span><b id="rc-rent"></b></div>';
    h+='<div class="kv"><span>ودیعهٔ لازم برای سقف اجارهٔ شما</span><b id="rc-dep"></b></div>';
    h+='<div class="kv"><span>جمع ماهانهٔ قابل پرداخت (اجاره + شارژ)</span><b id="rc-mon"></b></div>';
    h+='<p class="note">تبدیل ودیعه به اجاره با نرخ فرضی «۳٪ در ماه» محاسبه می‌شود. <span class="hint" data-tip="این نرخ بازار نیست؛ فقط مبنای مقایسهٔ داخلی سامانه است و باید با توافق طرفین جایگزین شود.">فرض محاسبه</span></p>'+
    '<details class="srcbox"><summary>فرض کامل</summary><p class="note">تبدیل ودیعه به اجاره با فرض مقایسه‌ای «۳٪ ودیعه در ماه» انجام می‌شود؛ این نرخ بازار نیست و باید با توافق طرفین جایگزین شود.</p></details>';
    h+='<div class="gauge" style="margin:10px 0 4px"><i id="rc-g"></i></div>';
    h+='<p class="note" style="text-align:center" id="rc-r"></p><div class="alert al-warn" id="rc-msg"></div></div>';
    h+='<div class="card"><div class="ct">تمدید یا جابه‌جایی؟</div><p class="note">مقایسهٔ هزینهٔ یک‌ساله. <span class="hint" data-tip="۱۲ برابر افزایش ماهانهٔ مالک در برابر هزینهٔ ثابت جابه‌جایی (ودیعهٔ جدید، حمل، کمیسیون) سنجیده می‌شود؛ سربه‌سر زیر ۱۲ ماه یعنی جابه‌جایی به‌صرفه‌تر است.">روش محاسبه</span></p>';
    h+='<div class="fld"><span class="fl">افزایش ماهانهٔ درخواستی مالک</span>'+rng('incr','افزایش اجارهٔ مالک (ماهانه)',20000000,300000000,10000000,D.B.incr)+'<span class="fh">مبلغی که مالک برای سال جدید به اجاره اضافه می‌کند.</span></div>';
    h+='<div class="calc"><div class="kv"><span>هزینهٔ ثابت جابه‌جایی (ودیعهٔ جدید، حمل، کمیسیون)</span><b>'+rial(1000000000)+'</b></div>';
    h+='<div class="kv"><span>اضافه‌پرداخت سالانه در صورت تمدید (۱۲ × افزایش ماهانه)</span><b id="rn-ann"></b></div>';
    h+='<div class="kv"><span>نقطهٔ سربه‌سر (ماه)</span><b id="rn-be"></b></div><div class="note">اگر سربه‌سر کمتر از ۱۲ ماه باشد، جابه‌جایی به‌صرفه‌تر است.</div>';
    h+='<div class="alert al-ok" id="rn-v"></div></div></div></div>';
    h+=wnav('rent',true,'');
  }else if(st===2){
    defP(D);
    h+='<div class="grid g2">'+impBlock(D,'rent');
    h+='<div class="card"><div class="ct">اولویت‌های ملک</div><p class="note">فیلتر آگهی‌ها بر اساس این مقادیر انجام می‌شود.</p>';
    h+='<div class="kv"><span>سقف اجارهٔ ماهانه</span><b>'+rial(D.B.rentB)+'</b></div>';
    h+='<div class="srow"><div class="slab"><span>حداقل خواب</span></div><div class="chips">'+[[0,'۰'],[1,'۱'],[2,'۲'],[3,'۳+']].map(function(b){return '<span class="chip'+(D.P.beds===b[0]?' on':'')+'" data-act="ppbeds" data-m="rent" data-v="'+b[0]+'">'+b[1]+'</span>'}).join('')+'</div><div class="numrow" style="margin-top:8px"><input class="inp" data-pt-num="bedsNum" data-pm="rent" value="'+(D.P.bedsNum||'')+'" placeholder="تعداد خواب (مثل ۲)" style="max-width:190px"><span class="note">۱ تا ۵</span></div></div>';
    h+='<div class="srow"><div class="slab"><span>حداکثر سن بنا (سال)</span><span style="display:flex;gap:6px;align-items:center"><input class="tinp" data-tk="maxAge" data-min="0" data-max="30" value="'+D.P.maxAge+'"><b id="iv-rent-maxAge">'+fa(D.P.maxAge,0)+'</b></span></div><input type="range" data-pp="maxAge" data-pm="rent" min="0" max="30" step="1" value="'+D.P.maxAge+'"></div>';
    h+='<div class="srow"><div class="slab"><span>حداقل متراژ</span><span style="display:flex;gap:6px;align-items:center"><input class="tinp" data-tk="minM2" data-min="40" data-max="140" value="'+D.P.minM2+'"><b id="iv-rent-minM2">'+fa(D.P.minM2,0)+'</b></span></div><input type="range" data-pp="minM2" data-pm="rent" min="40" max="140" step="5" value="'+D.P.minM2+'"></div>';
    h+='<div class="srow"><div class="slab"><span>طبقه</span></div><div class="seg">'+[['any','هر طبقه'],['low','۱–۳'],['high','۴+']].map(function(f){return '<button class="'+(D.P.floor===f[0]?'on':'')+'" data-act="ppfloor" data-m="rent" data-v="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div><div class="numrow" style="margin-top:8px"><input class="inp" data-pt-num="floorNum" data-pm="rent" value="'+(D.P.floorNum||'')+'" placeholder="شماره طبقه (مثل ۲)" style="max-width:190px"><span class="note">خالی = هر طبقه</span></div></div>';
    h+='<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px"><label class="switch"><input type="checkbox" data-pt="elev" data-pm="rent"'+(D.P.elev?' checked':'')+'><span class="tr"></span></label><span style="font-size:12.5px">آسانسور الزامی</span>'+
    '<label class="switch"><input type="checkbox" data-pt="park" data-pm="rent"'+(D.P.park?' checked':'')+'><span class="tr"></span></label><span style="font-size:12.5px">پارکینگ الزامی</span></div></div></div>';
    h+=wnav('rent',true,'اولویت‌ها را تنظیم و ادامه دهید');
  }else if(st===3){
    defP(D);
    h+=hoodBlock(D,'rent','rent');
    h+=wnav('rent',!!D.hood,D.hood?'✓ '+findH(D.hood).n:'یک محله انتخاب کنید');
  }else if(st===4){
    var hd=findH(D.hood);
    h+=marketCardHTML(hd,'rent');
    h+=analysisSummaryHTML(hd,'rent');
    h+=marketCompareHTML(hd);
    h+=wnav('rent',true,'');
  }else if(st===5){
    defP(D);
    var hd2=findH(D.hood);
    var all=RLIST.filter(function(x2){return x2.hood===D.hood});
    var hard=all.filter(function(x2){if(x2.rent>D.B.rentB)return false;if(x2.m2<D.P.minM2)return false;if(x2.age>D.P.maxAge)return false;if(D.P.beds>0&&x2.beds<D.P.beds)return false;if(D.P.elev&&!x2.elev)return false;if(D.P.park&&!x2.park)return false;return true});
    var fb=false,shown=hard;
    if(!hard.length&&all.length){fb=true;shown=all.slice().sort(function(a,b){return lscore(b,D)-lscore(a,D)}).slice(0,2);h+='<div class="alert al-warn">ملک دقیقی مطابق تمام اولویت‌های شما پیدا نشد. این گزینه نزدیک‌ترین پیشنهاد موجود به شرایط انتخابی شماست.</div>'}
    h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>محلهٔ '+hd2.n+' <span class="badge b-info">آگهی نمونه</span></span><b>'+fa(all.length,0)+' آگهی — '+fa(hard.length,0)+' منطبق</b></div>'+
    '<div class="chips" style="margin-top:8px"><span class="chip on">سقف '+rial(D.B.rentB)+'</span><span class="chip on">'+fa(D.P.beds,0)+' خواب+</span><span class="chip on">تا '+fa(D.P.maxAge,0)+' ساله</span><span class="chip on">از '+fa(D.P.minM2,0)+' متر</span>'+
    '<button class="btn btn-xs" data-act="ralert"> هشدار همخوان</button><button class="btn btn-xs" data-view="map">نقشه</button></div></div>';
    if((D.saved||[]).length){h+='<div class="cmpbar"><b> مقایسه ('+fa(D.saved.length,0)+')</b><button class="btn btn-sm btn-primary" data-act="cmpLopen">جدول</button></div>'}
    h+='<div class="grid g3">'+shown.sort(function(a,b){return lscore(b,D)-lscore(a,D)}).map(function(x2){return lcard2(x2,D,D.listing===x2.id,lscore(x2,D),fb)}).join('')+'</div>';
    h+=wnav('rent',!!D.listing,D.listing?('✓ '+findL(D.listing).t):'یک ملک انتخاب کنید');
  }else if(st===6){
    x=findL(D.listing);
    defVlist(D);
    var av=x.av||{},okc=0;
    D.vlist.forEach(function(v){if(v.ok)okc++});
    h+='<div class="grid g2"><div class="card"><div class="ct"> هماهنگی بازدید: '+x.t+'</div>';
    h+='<h4 class="mini">روز (روزهای اعلامی مالک)</h4><div class="chips">'+
    WD.map(function(dd){
      return av[dd]?('<span class="chip'+(D.vday===dd?' on':'')+'" data-act="vday" data-v="'+dd+'">'+dd+'</span>'):('<span class="chip" style="opacity:.45;cursor:not-allowed">'+dd+'</span>');
    }).join('')+'</div>';
    if(D.vday&&av[D.vday]&&av[D.vday].length){
      h+='<h4 class="mini">ساعت (اعلامی مالک)</h4><div class="chips">'+
      av[D.vday].map(function(tt){return '<span class="chip'+(D.vtime===tt?' on':'')+'" data-act="vtime" data-v="'+tt+'">'+tt+'</span>'}).join('')+'</div>';
    }else if(D.vday){
      h+='<p class="note">برای این روز ساعتی ثبت نشده است.</p>';
    }
    if(D.visitDay){
      var vr=openReqOf('rent','بازدید',S.active.rent);
      h+='<div class="alert al-ok" style="margin-top:12px"><b>درخواست بازدید ثبت شد</b> — '+D.vday+' ساعت '+D.vtime+(vr?' • '+vr.status:'')+'<div style="margin-top:6px"><button class="btn btn-xs" data-act="dt" data-t="req" data-cat="rent">پیگیری در درخواست‌ها</button></div></div>';
    }else{
      h+='<button class="btn btn-primary" style="margin-top:14px" data-act="rvisit"'+(D.vday&&D.vtime?'':' disabled')+'>'+(D.vday&&D.vtime?('ثبت درخواست بازدید (۲۰ کلید)'):'روز و ساعت را انتخاب کنید')+'</button>';
    }
    h+='<div style="margin-top:10px"><button class="btn" data-act="vtour" data-id="'+D.listing+'">تور مجازی ۳۶۰°</button></div></div>';
    h+='<div class="card"><div class="ct"> فرم هوشمند بازدید</div>';
    h+=D.vlist.map(function(v,i2){
      return '<div class="vrow'+(v.ok?' ok':'')+'"><button class="cbx'+(v.ok?' on':'')+'" data-act="vchk" data-i="'+i2+'" aria-label="علامت‌زنی">✓</button><span class="vt">'+esc(v.t)+'</span><button class="vdel" data-act="vdel" data-i="'+i2+'" aria-label="حذف">×</button></div>';
    }).join('');
    h+='<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><input class="inp" id="vnew" aria-label="افزودن مورد جدید به فرم بازدید" placeholder="مورد جدید..." style="flex:1;min-width:160px"><button class="btn btn-sm" data-act="vadd">افزودن</button></div>';
    h+='<div class="pbar" style="margin-top:10px"><i style="width:'+(okc/Math.max(1,D.vlist.length)*100)+'%"></i></div>';
    h+='<p class="note" style="text-align:center">'+fa(okc,0)+' از '+fa(D.vlist.length,0)+' بررسی شد.</p></div></div>';
    h+=wnav('rent',!!D.visitDay,'');
  }else if(st===7){
    var c=rentCalc(D);
    if(!D.rep){D.rep={};REP.forEach(function(r){D.rep[r[0]]=r[1]})}
    if(!D.dur){D.dur='یک‌ساله'}
    if(D.owner===undefined){D.owner='مهندس کاظمی'}
    if(D.oph===undefined){D.oph='09123330011'}
    var C=conInit(D,'rent');
    if(D.signed){
      var crq=openReqOf('rent','قرارداد',S.active.rent)||null,snap=null;
      S.contracts.forEach(function(q){if(!snap&&(q.draftCode===C.draftCode||q.code===D.code))snap=q.doc||null});
      h+='<div class="card done-card"><div class="bigicon">✓</div><div class="ct" style="font-size:17px">قرارداد داخلی ثبت شد</div>'+
      '<div class="kv"><span>شناسهٔ قرارداد</span><b style="direction:ltr">'+(D.code||'—')+'</b></div>'+
      '<div class="kv"><span>وضعیت</span><b>'+conBadge(D,'rent')+'</b></div>'+
      '<div class="kv"><span>موجر / مستأجر</span><b>'+esc(C.parties.lessor.name||'—')+' / '+esc(S.auth.name)+'</b></div>'+
      '<div class="kv"><span>وضعیت درخواست</span><b>'+(crq?stB(crq.status):stB('کامل شد'))+'</b></div>'+
      '<div class="alert al-warn">این قرارداد در سامانهٔ رسمی ثبت نشده است. برای ثبت رسمی، احراز هویت و امضای الکترونیک لازم است.</div>'+
      '<div class="fs-actions" style="justify-content:center;margin-top:12px"><button class="btn btn-sm" data-act="cdoc" data-i="cur">مشاهدهٔ سند</button><button class="btn btn-sm" data-act="cprint">دریافت PDF</button>'+(D.grtId?'<button class="btn btn-sm" data-act="grtBackToEnr">بازگشت به پروندهٔ اجارهٔ تضمینی</button>':'')+'<button class="btn btn-sm btn-primary" data-act="startTerm">شروع فسخ و تخلیه</button></div></div>';
      h+='<div class="card" style="margin-top:14px"><div class="ct">خدمات پس از سکونت</div>'+
      '<p class="note">خدمات را داخل محلینو سفارش دهید؛ زمان و جزئیات همان‌جا ثبت می‌شود.</p>'+
      '<button class="btn btn-primary" data-act="svcs">مشاهده و ثبت درخواست</button></div>';
    }else{
      h+='<div class="con-head"><div><div class="ct" style="margin:0">قرارداد</div><p class="note">شناسهٔ پیش‌نویس: '+esc(C.draftCode)+(D.grtId?(' — پروندهٔ اجارهٔ تضمینی '+esc(D.grtId)):'')+'</p></div><div>'+conBadge(D,'rent')+'</div></div>';
      h+=conFlowHTML(D,'rent');
    }
    h+=wnav('rent',!!D.signed,D.signed?'':'ابتدا قرارداد را کامل کنید');
  }else{
    if(!D.term){
      h+='<div class="card"><div class="ct"> وضعیت قرارداد</div>';
      h+='<div class="kv"><span>کد</span><b>'+(D.code||'—')+'</b></div>';
      h+='<div class="kv"><span>ودیعه</span><b>'+rial(D.B.depB)+' — در امانی</b></div>';
      h+='<div class="alert al-warn">فسخ: درخواست ← صورت‌جلسه ← تأیید طرف مقابل ← تخلیهٔ هوشمند ← تسویهٔ ودیعه.</div>';
      h+='<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-primary" data-act="tstart">شروع فسخ</button><button class="btn" data-act="svcs"> خدمات</button><button class="btn" data-act="rdone">فعال — پایان</button></div></div>';
    }else{
      var T=D.term;
      h+=termSteps(T);
      if(T.ph===1){
        if(!T.who){T.who='مستأجر (شما)'}
        h+='<div class="card"><div class="ct">۱) درخواست فسخ</div>';
        h+='<div class="srow"><div class="slab"><span>درخواست‌کننده</span></div><div class="seg"><button class="'+(T.who==='مستأجر (شما)'?'on':'')+'" data-act="twho" data-v="مستأجر (شما)">مستأجر</button><button class="'+(T.who==='موجر'?'on':'')+'" data-act="twho" data-v="موجر">موجر</button></div></div>';
        h+='<h4 class="mini">دلیل</h4><div class="chips">'+['پایان مدت','توافق','تخلف از بندها','نیاز شخصی'].map(function(r){return '<span class="chip'+(T.reason===r?' on':'')+'" data-act="treason" data-v="'+r+'">'+r+'</span>'}).join('')+'</div>';
        h+='<input class="inp" id="treasontxt" placeholder="یا دستی بنویسید..." style="margin-top:8px" value="'+qesc(T.rtxt||'')+'">';
        h+='<h4 class="mini">زمان تخلیه</h4><div class="chips">'+['۳۰ روز دیگر','۲ هفته','توافقی'].map(function(r){return '<span class="chip'+(T.date===r?' on':'')+'" data-act="tdate" data-v="'+r+'">'+r+'</span>'}).join('')+'</div>';
        h+='<input class="inp" id="tdatetxt" placeholder="یا دستی بنویسید" style="margin-top:8px" value="'+qesc(T.dtxt||'')+'">';
        h+='<button class="btn btn-primary" style="margin-top:14px" data-act="treq">ثبت و صورت‌جلسه ←</button></div>';
      }else if(T.ph===2){
        h+='<div class="card"><div class="ct">۲) صورت‌جلسهٔ فسخ</div>';
        h+='<textarea class="inp" id="tmin" rows="9">'+esc(T.min||termTpl(T,D))+'</textarea>';
        h+='<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" data-act="tsend">ارسال ←</button><button class="btn" style="color:var(--danger);border-color:#f2c8c7" data-act="tdel"> حذف درخواست</button></div></div>';
      }else if(T.ph===3){
        h+='<div class="card"><div class="ct">۳) تأیید موجر</div>';
        h+='<div class="note" style="white-space:pre-wrap;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:12px">'+esc(T.min||'')+'</div>';
        if(T.ok){
          h+='<div class="alert al-ok">تأیید موجر ثبت شد (اعلام شما)</div>';
        }else{
          h+='<button class="btn btn-primary" style="margin-top:10px" data-act="totp">ثبت تأیید موجر (اعلام شما)</button><p class="note">این تأیید داخلی است و تأیید رسمی سامانه محسوب نمی‌شود.</p>';
        }
        h+='<button class="btn" style="margin-top:10px;color:var(--danger);border-color:#f2c8c7" data-act="tdel"> حذف</button></div>';
      }else if(T.ph===4){
        h+='<div class="card"><div class="ct">۴) تخلیهٔ هوشمند</div>'+baHTML();
        if(T.wait){
          h+='<div class="alert al-warn"> تحلیل تصاویر... <span class="dots"><i></i><i></i><i></i></span></div>';
        }else if(!T.ai){
          h+='<button class="btn btn-primary" data-act="tai">بررسی با هوش مصنوعی</button>';
        }
        h+='<button class="btn" style="margin-top:10px;color:var(--danger);border-color:#f2c8c7" data-act="tdel"> حذف</button></div>';
      }else{
        h+='<div class="card"><div class="ct">۵) تسویهٔ ودیعه</div>';
        h+='<div class="alert al-ok"> ۱ مورد خارج از استهلاک (بار موجر) + ۱ استهلاک عادی. <b>کسر: صفر.</b></div>';
        h+='<div class="kv"><span>ودیعه</span><b>'+rial(D.B.depB)+'</b></div>';
        if(!T.paid){
          h+='<button class="btn btn-primary" style="margin-top:10px" data-act="tpay">واریز ۱۰۰٪ از امانی</button>';
        }else{
          h+='<div class="done-card"><div class="bigicon">✓</div><div class="ct">فسخ کامل شد</div><p class="note">ودیعه تسویه و قرارداد بسته شد. سابقه در «درخواست‌ها» باقی می‌ماند.</p>'+
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" data-act="dt" data-t="con">قراردادها</button><button class="btn btn-primary" data-act="flowNew" data-m="rent">درخواست اجارهٔ جدید</button></div></div>';
        }
        h+='</div>';
      }
    }
    h+=wnav('rent',false,'');
  }
  el.innerHTML=h;
  if(st===1){
    var upd=function(){
      var c=rentCalc(D),B=D.B,m=[];
      var e1=document.getElementById('rc-rent');if(e1){e1.textContent=rial(c.rent)}
      var e2=document.getElementById('rc-dep');if(e2){e2.textContent=c.depNeed?rial(c.depNeed):'— اجاره با رهنِ شما کمتر از بودجه است'}
      var e3=document.getElementById('rc-mon');if(e3){e3.textContent=rial(c.mon)}
      var g=document.getElementById('rc-g');
      if(g){g.style.width=Math.min(100,c.mon/B.inc*100)+'%';g.style.background=(c.mon/B.inc>0.33)?'#d9534f':((c.mon/B.inc>0.25)?'#e8a13a':'#2e9e5b')}
      var e4=document.getElementById('rc-r');
      if(e4){e4.textContent='نسبت هزینهٔ مسکن به درآمد: ٪'+fa(c.mon/B.inc*100,0)}
      if(c.depNeed&&c.depNeed>B.depB+500000000){m.push('فاصله تا بودجهٔ رهن: '+rial(c.depNeed-B.depB))}
      if(c.mon>130000000){m.push('جمع ماهانه (اجاره+شارژ) از سقف ۳۰٪ درآمد بیشتر است')}
      var e5=document.getElementById('rc-msg');
      if(e5){e5.innerHTML=(m.length?' ':'')+(m.join('<br>')||'دو بودجه سازگارند.')}
      var e6=document.getElementById('rn-ann');if(e6){e6.textContent=rial(B.incr*12)}
      var be=B.incr>0?150000000/B.incr:99;
      var e7=document.getElementById('rn-be');if(e7){e7.textContent=fa(be,0)+' ماه'}
      var e8=document.getElementById('rn-v');
      if(e8){e8.innerHTML=be<=12?('با ماندن بیش از <b>'+fa(be,0)+' ماه</b>، جابه‌جایی به‌صرفه‌تر است.'):'با این افزایش، <b>تمدید</b> به‌صرفه‌تر است — هزینهٔ جابه‌جایی بیشتر از اضافه‌پرداخت یک‌ساله است.'}
    };
    $$('#v-rent [data-rk]').forEach(function(r){
      r.addEventListener('input',function(){
        D.B[r.getAttribute('data-rk')]=+r.value;
        save();upd();
      });
    });
    upd();
  }
  if(st===2){
    bindImp('rent');
    $$('[data-pm="rent"][data-pp]').forEach(function(r){
      r.addEventListener('input',function(){
        D.P[r.getAttribute('data-pp')]=+r.value;save();
        var e=document.getElementById('iv-rent-'+r.getAttribute('data-pp'));
        if(e){e.textContent=fa(+r.value,0)}
      });
    });
    $$('[data-pm="rent"][data-pt]').forEach(function(r){
      r.addEventListener('change',function(){D.P[r.getAttribute('data-pt')]=r.checked;save()});
    });
  }
  if(st===4){
    /* بازار از دادهٔ منبع‌دار در قالب کارت و تحلیل رندر می‌شود. */
  }
  var bar=document.getElementById('ba-r');
  if(bar){
    bar.addEventListener('input',function(){
      var v=+bar.value,a=document.getElementById('ba-after'),hd2=document.getElementById('ba-h');
      if(a){a.style.clipPath='inset(0 0 0 '+v+'%)'}
      if(hd2){hd2.style.left=v+'%'}
    });
  }
};

