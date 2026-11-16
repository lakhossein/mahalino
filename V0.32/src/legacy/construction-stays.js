/* ═══ ۱۵) ساخت ═══ */
VIEWS.build=function(){
  var el=document.getElementById('v-build'),d=wd('build'),D=d.data,st=d.step;
  var M=wd('mkt').data,hasPrj=!!(M.confirmed||M.chosen);
  var h=wtop('build','ساخت و تأمین','سفارش تأمین، پیشرفت و تحویل پروژه');
  h+=flowReqBlock('build');
  if(!hasPrj){
    h+='<div class="card"><div class="alert al-warn"> ابتدا از فلو «پروژه‌ها» پروژه بگیرید یا پیمانکار تأیید کنید.</div><button class="btn btn-primary" data-view="mkt">مارکت‌پلیس ←</button></div>';
  }else{
    h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>پروژهٔ جاری</span><b>'+PRJ[mktPrj()].t+'</b></div></div>';
  }
  if(st===1){
    if(!D.orders){D.orders=[]}
    if(D.supd===undefined){D.supd='فردا'}
    h+='<div class="card"><div class="ct"> تأمین مصالح و نیرو</div><div class="grid g3">'+SUPS.map(function(s,i){
      return '<div class="card tight"><b>'+s.t+'</b>'+
      '<div class="kv"><span>قیمت</span><b>'+s.p+'</b></div>'+
      '<div class="kv"><span>تحویل / موجودی</span><b>'+s.d+' • '+s.stock+'</b></div>'+
      '<div class="kv"><span>حداقل</span><b>'+s.min+'</b></div>'+
      '<div class="chips" style="margin-top:6px">'+s.b.map(function(b){return '<span class="badge b-ok">✓ '+b+'</span>'}).join('')+'<span class="badge b-info">★ '+s.s+'</span></div>'+
      '<button class="btn btn-sm btn-primary" style="margin-top:8px" data-act="psup" data-i="'+i+'"'+(hasPrj?'':' disabled')+'>سفارش</button></div>';
    }).join('')+'</div>';
    if(D.orders.length){
      h+='<h4 class="mini">سفارش‌ها</h4>'+D.orders.map(function(o){
        return '<div class="esc done"><span class="nm">'+SUPS[o.i].t+' — '+esc(o.q)+' • '+o.d+'</span><span class="badge b-ok">ثبت ✓ (۳۰٪ امانی)</span></div>';
      }).join('');
    }
    h+='<div class="alert al-bad">مصالح غیراستاندارد، مسئولیت حقوقی پیمانکار است.</div></div>';
    h+=wnav('build',D.orders.length>0,fa(D.orders.length,0)+' سفارش');
  }else if(st===2){
    if(!D.ph){D.ph=[100,80,40,0,0]}
    var PHN=['گودبرداری','اسکلت','نازک‌کاری','تأسیسات','پایان‌کار'],w=[12,34,22,18,14],tot=0,q;
    for(q=0;q<5;q++){tot+=w[q]*D.ph[q]}
    tot=tot/100;
    h+='<div class="card"><div class="ct"> پیشرفت</div>';
    h+=PHN.map(function(p,i){
      return '<div class="kv" style="align-items:center"><span style="flex:1;min-width:120px">'+p+'</span><div class="pbar" style="width:100px;display:inline-block"><i style="width:'+D.ph[i]+'%"></i></div><b style="font-size:11.5px;color:var(--brand)">'+fa(D.ph[i],0)+'٪</b><button class="btn btn-xs" data-act="pph" data-i="'+i+'">+۱۰٪</button></div>';
    }).join('');
    h+='<div class="pbar" style="margin-top:10px"><i style="width:'+tot+'%"></i></div>';
    h+='<div class="kv" style="margin-top:8px"><span>پیشرفت وزنی</span><b>'+fa(tot,0)+'٪</b></div>';
    h+='<p class="note">هر دو نقش (کارفرما/پیمانکار) این داشبورد را می‌بینند.</p></div>';
    h+=wnav('build',tot>=100,tot>=100?'✓ آمادهٔ تحویل':'تا ۱۰۰٪ ادامه دهید');
  }else{
    if(d.done){
      h+='<div class="card done-card"><div class="bigicon">✓</div><div class="ct" style="font-size:17px">پروژه تحویل شد</div>'+
      '<div class="kv"><span>پروژه</span><b>'+PRJ[mktPrj()].t+'</b></div>'+
      '<p class="note">سابقهٔ سفارش‌ها و تحویل در «درخواست‌ها» باقی می‌ماند.</p>'+
      '<div class="fs-actions" style="justify-content:center"><button class="btn btn-sm" data-act="dt" data-t="req" data-cat="build">درخواست‌ها</button><button class="btn btn-sm btn-primary" data-act="flowNew" data-m="build">درخواست جدید</button></div></div>'+wnav('build',false,'');
    }else{
      h+='<div class="card done-card"><div class="bigicon">✓</div><div class="ct" style="font-size:17px">تحویل پروژه</div>'+
      '<div class="kv"><span>پروژه</span><b>'+PRJ[mktPrj()].t+'</b></div>'+
      '<button class="btn btn-primary btn-lg" data-act="pdone">تحویل و ثبت کارنامه</button></div>'+wnav('build',false,'');
    }
  }
  el.innerHTML=h;
};

/* ═══ ۱۶) اقامتگاه ═══ */
var RVS=0;
VIEWS.stay=function(){
  var el=document.getElementById('v-stay'),d=wd('stay'),D=d.data,st=d.step;
  var h=wtop('stay','فلوی اقامتگاه','جست‌وجوی اقامتگاه، رزرو امانی و ورود');
  h+=flowReqBlock('stay');
  if(st===1){
    if(D.city===undefined){D.city='';D.date='';D.ppl=2}
    h+='<div class="card"><div class="ct"> مشخصات سفر</div>';
    h+='<div class="srow"><div class="slab"><span>نام شهر</span></div><input class="inp" id="st-city" placeholder="تهران / شیراز / رامسر" value="'+qesc(D.city)+'"></div>';
    h+='<div class="srow"><div class="slab"><span>تاریخ سفر</span></div><input class="inp" id="st-date" placeholder="۱۴۰۴/۰۳/۱۵ یا «آخر هفته»" value="'+qesc(D.date)+'"></div>';
    h+='<div class="srow"><div class="slab"><span>تعداد مسافران</span></div><input class="inp" id="st-ppl" placeholder="عدد تایپ کنید" style="direction:ltr;text-align:left" value="'+(D.ppl||'')+'"></div>';
    h+='<p class="note">همهٔ فیلدها متنی‌اند.</p></div>';
    h+=wnav('stay',!!(D.city&&D.ppl),'شهر و مسافران را وارد کنید');
  }else if(st===2){
    var items=stayList(D.city);
    h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>سفر به</span><b>'+esc(D.city)+' • '+esc(D.date||'')+' • '+fa(D.ppl,0)+' مسافر</b></div></div>';
    h+='<div class="grid g2">'+items.map(function(s){
      var saved=(D.savedS||[]).indexOf(s.id)>=0;
      return '<div class="lcard'+(D.stay===s.id?' sel':'')+'"><div class="lart">'+ph(s.seed,400,250,'')+'<span class="match">٪۹۴</span>'+srcBadge(s)+'</div>'+
      '<div class="lbody"><h4>'+s.t+'</h4><div class="adr"> '+s.city+' — '+s.acc.split('•')[0]+'</div>'+
      '<div class="chips"><span class="badge b-ok">راستی‌آزمایی</span><span class="badge b-info">★ '+s.rate+'</span></div>'+
      '<div class="lfoot"><div class="pr"><b>'+rial(s.p)+'</b><span>هر شب</span></div>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
      '<button class="btn btn-xs" data-act="sdet" data-id="'+s.id+'">جزئیات</button>'+
      '<button class="btn btn-xs" data-act="stsave" data-id="'+s.id+'" aria-label="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
      '<button class="btn btn-xs'+(D.stay===s.id?'':' btn-primary')+'" data-act="schoose" data-id="'+s.id+'">'+(D.stay===s.id?'✓':'انتخاب')+'</button>'+
      '</div></div></div></div>';
    }).join('')+'</div>';
    h+='<div class="alert al-bad">پرداخت مستقیم به کارت شخصی غیرفعال است.</div>';
    h+=wnav('stay',!!D.stay,D.stay?('✓ '+findS(D.stay).t):'انتخاب یا ☆ نشان کنید');
  }else if(st===3){
    var s2=findS(D.stay);
    if(D.nights===undefined){D.nights=s2.defN}
    var br=openReqOf('stay','رزرو',S.active.stay);
    h+='<div class="grid g2"><div class="card"><div class="ct">رزرو امانی: '+s2.t+'</div>';
    h+=(D.code?'<div class="kv"><span>تعداد شب</span><b>'+fa(D.nights,0)+' شب</b></div>':rng('nights','تعداد شب',1,14,1,D.nights,function(v){return fa(v,0)+' شب'}));
    h+='<div id="stout"></div>';
    h+='<p class="note">کنسلی: ۷۲ ساعت قبل کامل • ۷۲–۲۴: ۵۰٪ • کمتر: شب اول.</p>';
    if(D.code){
      h+='<div class="alert al-ok"><b>رزرو ثبت شد — کد '+D.code+'#</b>'+(br?' • وضعیت: '+br.status:'')+'<div style="margin-top:6px"><button class="btn btn-xs" data-act="dt" data-t="req" data-cat="stay">پیگیری در درخواست‌ها</button> <button class="btn btn-xs" data-act="flowNew" data-m="stay">رزرو جدید</button></div></div>';
    }else{
      h+='<button class="btn btn-primary" style="margin-top:12px" data-act="sbook">پرداخت امانی (۳۰ کلید)</button>';
    }
    h+='</div><div class="card"><div class="ct">قفل اعتماد</div><div class="tl">'+
    '<div class="tli done"><span class="dot">✓</span>امانی</div><div class="tli done"><span class="dot">✓</span>احراز دوطرفه</div><div class="tli act"><span class="dot">•</span>۷۲ ساعت مغایرت</div></div></div></div>'+wnav('stay',!!D.code,'');
  }else{
    h+='<div class="grid g2"><div class="card"><div class="ct">ورود</div><div class="codebox">'+(D.code||'4821')+'#</div>'+
    '<div class="kv"><span>مکان</span><b>'+findS(D.stay).city+'</b></div>'+
    (D.checked?'<div class="alert al-ok"><b>ورود ثبت شد</b> — اقامت در جریان است.<div style="margin-top:6px"><button class="btn btn-xs" data-act="dt" data-t="req" data-cat="stay">درخواست‌ها</button> <button class="btn btn-xs" data-act="flowNew" data-m="stay">رزرو جدید</button></div></div>':'<button class="btn btn-primary" data-act="scheckin">ورود انجام شد</button>')+'</div>'+
    '<div class="card"><div class="ct">★ نظر</div><div id="rvstars" style="margin:6px 0;font-size:18px"></div>'+
    '<textarea class="inp" id="rv-txt" rows="3" placeholder="تجربهٔ شما..."></textarea>'+
    '<button class="btn btn-primary btn-sm" style="margin-top:8px" data-act="sreview">ثبت</button>';
    if(S.reviews.length){
      h+='<h4 class="mini">نظرات اخیر</h4>'+S.reviews.slice(0,3).map(function(r){
        var s='';for(var i=0;i<r.s;i++){s+='★'}
        return '<div class="kv"><span><b>'+esc(r.n)+'</b> — '+s+'</span><span style="color:var(--ink2)">'+esc(r.t)+'</span></div>';
      }).join('');
    }
    h+='</div></div>'+wnav('stay',false,'');
  }
  el.innerHTML=h;
  if(st===1){
    var ci=document.getElementById('st-city'),di=document.getElementById('st-date'),pi=document.getElementById('st-ppl');
    if(ci){ci.addEventListener('input',function(){D.city=ci.value;save()})}
    if(di){di.addEventListener('input',function(){D.date=di.value;save()})}
    if(pi){pi.addEventListener('input',function(){var n=parseInt(pd(pi.value).replace(/[^0-9]/g,''),10);D.ppl=isNaN(n)?0:n;save()})}
  }
  if(st===3){
    var s4=findS(D.stay);
    var updT=function(){
      var eN=document.getElementById('rv-nights');
      if(eN){eN.textContent=fa(D.nights,0)+' شب'}
      document.getElementById('stout').innerHTML='<div class="kv"><span>مبلغ کل</span><b>'+rial(s4.p*D.nights)+'</b></div>';
    };
    $$('#v-stay [data-rk]').forEach(function(r){r.addEventListener('input',function(){D.nights=+r.value;save();updT()})});
    updT();
  }
  if(st===4){
    var w=document.getElementById('rvstars'),h2='';
    if(w){
      var x;
      for(x=1;x<=5;x++){
        h2+='<button data-act="rvs" data-s="'+x+'" style="color:'+(x<=RVS?'#f2b01e':'#d5dde8')+';background:none;border:none;cursor:pointer;font-size:18px">★</button>';
      }
      w.innerHTML=h2;
    }
  }
};
function stayDetailModal(id){
  var s=findS(id);
  openModal('<div style="margin:-6px -6px 10px;border-radius:12px;overflow:hidden;height:170px">'+ph(s.seed,600,375,'')+'</div>'+
  '<h3>'+s.t+'</h3><p class="note"> '+s.city+' • هر شب: <b>'+rial(s.p)+'</b></p>'+
  '<div class="hcat"><h5> امکانات</h5>'+s.amens.map(function(a){return '<div class="kv"><span>'+a+'</span><b class="badge b-ok">✓</b></div>'}).join('')+'</div>'+
  '<div class="hcat"><h5> قوانین استفاده</h5>'+s.rules.map(function(a){return '<div class="kv"><span>'+a+'</span><b class="badge b-warn">!</b></div>'}).join('')+'</div>'+
  '<div class="hcat"><h5> میزان دسترسی</h5><div class="kv"><span>'+s.acc+'</span><b class="badge b-info">دقیق</b></div></div>'+
  '<div class="hcat"><h5>فاصله تا مکان‌های مهم</h5>'+placesHTML(s.ll,6)+'</div>'+
  '<div class="hcat"><h5> نظرات کاربران</h5>'+s.revs.map(function(r){return '<div class="kv"><span><b>'+esc(r.n)+'</b> — '+starsN(r.s)+'</span><span style="color:var(--ink2)">'+esc(r.t)+'</span></div>'}).join('')+'</div>'+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+
  '<button class="btn btn-primary" data-act="schoose" data-id="'+s.id+'">انتخاب</button>'+
  '<button class="btn" data-act="stsave" data-id="'+s.id+'">☆ نشان</button>'+
  '<button class="btn" data-act="smap" data-id="'+s.id+'">نقشه</button>'+
  '<button class="btn" data-act="closeModal">بستن</button></div>');
}
function hoodInfoModal(hid){
  var h=findH(hid),o=OSM[hid]||{},c=o.cats||{},mt=c.metro;
  var rd=wfData('rent'),bd=wfData('buy');
  var mode=(rd&&rd.hood===hid)?'rent':((bd&&bd.hood===hid)?'buy':'rent');
  var htm='<h3>'+h.n+' — اطلاعات محله</h3>'+
  '<div class="grid g2" style="margin-top:10px"><div class="card tight"><div class="ct">بازار</div>'+
  '<div class="kv"><span>میانگین آگهی هر متر</span><b>'+rial(h.buyBase)+'</b></div>'+
  '<div class="kv"><span>بازه / تاریخ</span><b>'+rial(h.mkt.low)+' تا '+rial(h.mkt.high)+' — '+MARKET.asOf+'</b></div>'+
  '<div class="kv"><span>تغییر یک‌ساله</span><b>'+pct(h.mkt.yoy)+'</b></div><p class="note">قیمت پیشنهادی آگهی، نه معامله.</p></div>'+
  '<div class="card tight"><div class="ct">دسترسی</div>'+
  '<div class="kv"><span>مترو</span><b>'+(mt?placeDistText(mt.km):'داده ندارد')+'</b></div>'+
  '<div class="kv"><span>مدرسه</span><b>'+(c.edu?placeDistText(c.edu.km):'داده ندارد')+'</b></div>'+
  '<div class="kv"><span>خرید روزانه</span><b>'+(c.shop?fa(c.shop.n,0)+' مکان':'داده ندارد')+'</b></div>'+
  '<p class="note">فاصلهٔ خط مستقیم؛ زمان سفر محاسبه نمی‌شود.</p></div></div>'+
  '<div class="mini" style="margin-top:10px">فاصله تا مکان‌های مهم شما</div>'+placesHTML(h.id,6)+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-act="hanalysis" data-h="'+h.id+'" data-m="'+mode+'">تحلیل کامل</button><button class="btn btn-sm" data-act="hmap" data-h="'+h.id+'">نقشه</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div>';
  openModal(htm);
}

