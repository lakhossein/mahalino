/* ═══ ۱۲) خرید ═══ */
VIEWS.buy=function(){
  var el=document.getElementById('v-buy'),d=wd('buy'),D=d.data,st=d.step;
  var h=wtop('buy','فلوی خرید و فروش','اولویت‌ها، محله، بررسی حقوقی و پرداخت امانی');
  h+=flowReqBlock('buy');
  if(st===1){
    defP(D);defPR(D);
    if(D.budg===undefined){D.budg=300000000000}
    h+='<div class="grid g2"><div class="card"><div class="ct"> بودجهٔ خرید</div>';
    h+=rng('budg','بودجهٔ کل',50000000000,800000000000,10000000000,D.budg);
    h+='<div class="kv"><span>با این بودجه</span><b id="bq-out"></b></div>';
    h+='</div>'+impBlock(D,'buy')+'</div>';
    h+='<div class="grid g2" style="margin-top:16px">'+prRangeBlock(D,'buy')+'</div>';
    h+=wnav('buy',true,'');
  }else if(st===2){
    defP(D);
    h+=hoodBlock(D,'buy','buy');
    h+=wnav('buy',!!D.hood,D.hood?('✓ '+findH(D.hood).n):'یک محله انتخاب کنید');
  }else if(st===3){
    var hd=findH(D.hood);
    h+=marketCardHTML(hd,'buy');
    h+=analysisSummaryHTML(hd,'buy');
    h+=marketCompareHTML(hd);
    h+=wnav('buy',true,'');
  }else if(st===4){
    if(!D.assets){D.assets=[{n:'سپردهٔ بانکی',a:0,d:0}]}
    if(D.lday===undefined){D.lday=10}
    if(D.liqSkip){
      h+='<div class="card"><div class="ct"> دارایی‌های نقدی — <span class="badge b-warn">رد شده</span><div class="alert al-warn">هر وقت خواستید وارد کنید.</div><button class="btn btn-primary" data-act="bunset">ورود دارایی‌ها</button></div>';
    }else{
      h+='<div class="card"><div class="ct"> دارایی‌های تأمین بودجه <span class="badge b-info">اختیاری</span></div>';
      h+='<p class="note">اگر ترجیح می‌دهید وارد نکنید، رد کنید — پرداخت مرحله‌ای امانی کار می‌کند.</p>';
      h+=D.assets.map(function(a,i){
        return '<div class="vrow" style="gap:6px">'+
        '<input class="inp" data-asi="'+i+'" data-ask="n" value="'+qesc(a.n)+'" style="flex:2;min-width:110px">'+
        '<input class="inp" type="number" step="500000000" min="0" data-asi="'+i+'" data-ask="a" value="'+a.a+'" style="flex:1;min-width:110px;direction:ltr;text-align:left">'+
        '<input class="inp" type="number" step="1" min="0" data-asi="'+i+'" data-ask="d" value="'+a.d+'" style="flex:1;min-width:60px;direction:ltr;text-align:left">'+
        '<button class="vdel" data-act="asdel" data-i="'+i+'">×</button></div>';
      }).join('');
      h+='<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'+
      '<input class="inp" id="asn" placeholder="نام دارایی" style="flex:2;min-width:110px">'+
      '<input class="inp" id="asa" type="number" step="500000000" placeholder="مبلغ" style="flex:1;min-width:110px;direction:ltr;text-align:left">'+
      '<input class="inp" id="asd" type="number" placeholder="روز" style="flex:1;min-width:60px;direction:ltr;text-align:left">'+
      '<button class="btn btn-sm" data-act="asadd">افزودن</button></div>';
      h+=rng('lday','روز از امروز',0,60,1,D.lday,function(v){return 'روز '+fa(v,0)});
      h+='<div class="gauge" style="height:14px;margin-top:10px"><i id="lqbar"></i></div><p class="note" style="text-align:center" id="lqnote"></p><div class="alert" id="lqmsg"></div>';
      h+='<button class="btn" style="margin-top:12px;color:var(--danger);border-color:#f2c8c7" data-act="bskip">رد می‌کنم</button></div>';
    }
    h+=wnav('buy',true,'');
  }else if(st===5){
    defPR(D);
    var allHood=BLIST.filter(function(x){return x.hood===D.hood});
    var hard=allHood.filter(function(x){return blPass(x,D)&&x.m2*x.ppm<=D.budg});
    var fb=false,shown=hard;
    if(!hard.length&&allHood.length){fb=true;shown=allHood.slice().sort(function(a,b){return bScore(b,D)-bScore(a,D)}).slice(0,2);h+='<div class="alert al-warn">ملک دقیقی مطابق تمام اولویت‌های شما پیدا نشد. این گزینه نزدیک‌ترین پیشنهاد موجود به شرایط انتخابی شماست.</div>'}
    h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>'+findH(D.hood).n+' <span class="badge b-info">آگهی نمونه</span> — '+rial(D.budg)+'</span><b>'+fa(hard.length,0)+' منطبق</b></div>'+
    '<div class="grid g2" style="margin-top:12px">'+
    '<div>'+drrow('age','عمر بنا (سال)',0,30,1,D.PR.age)+'</div>'+
    '<div>'+drrow('m2','متراژ',40,140,5,D.PR.m2)+'</div>'+
    '<div>'+drrow('ppm','هر متر (تومان)',1800000000,5500000000,50000000,D.PR.ppm)+'</div>'+
    '<div>'+drrow('floorR','طبقه',1,10,1,D.PR.floorR)+'</div></div>'+
    '<div class="chips" style="margin-top:8px">'+
    [[0,'۰ خواب+'],[1,'۱+'],[2,'۲+'],[3,'۳+']].map(function(b){return '<span class="chip'+(D.PR.beds===b[0]?' on':'')+'" data-act="prset" data-m="buy" data-k="beds" data-v="'+b[0]+'">'+b[1]+'</span>'}).join('')+
    [['elev','آسانسور'],['park','پارکینگ'],['balc','بالکن']].map(function(f){return '<span class="chip'+(D.PR[f[0]]==='yes'?' on':'')+'" data-act="prtog" data-m="buy" data-k="'+f[0]+'">'+f[1]+'</span>'}).join('')+
    '<button class="btn btn-xs" data-view="map">نقشه</button></div></div>';
    if((D.savedB||[]).length){h+='<div class="cmpbar"><b> مقایسه ('+fa(D.savedB.length,0)+')</b><button class="btn btn-sm btn-primary" data-act="cmpBopen">جدول</button></div>'}
    h+='<div class="grid g3">'+shown.sort(function(a,b){return bScore(b,D)-bScore(a,D)}).map(function(x){return blcard(x,D,D.blist===x.id,bScore(x,D),fb)}).join('')+'</div>';
    h+=wnav('buy',!!D.blist,D.blist?('✓ '+findB(D.blist).t):'یک ملک انتخاب کنید');
  }else if(st===6){
    if(D.lsel===undefined){D.lsel='ok'}
    h+='<div class="card"><div class="ct"> گزارش حقوقی</div><div class="seg" style="margin-bottom:12px">'+
    '<button class="'+(D.lsel==='ok'?'on':'')+'" data-act="blsel" data-k="ok">تک‌برگ</button>'+
    '<button class="'+(D.lsel==='mort'?'on':'')+'" data-act="blsel" data-k="mort">رهن + مادهٔ ۱۰۰</button>'+
    '<button class="'+(D.lsel==='heir'?'on':'')+'" data-act="blsel" data-k="heir">ورثه‌ای</button></div>';
    if(D.legal){
      var L=LGD[D.legal],lr=openReqOf('buy','حقوقی',S.active.buy);
      h+=L.rows.map(function(r){
        var cl=r[2]==='ok'?'b-ok':(r[2]==='warn'?'b-warn':'b-bad');
        var ic=r[2]==='ok'?'✓ ':(r[2]==='warn'?' ':'✕ ');
        return '<div class="kv"><span>'+r[0]+'</span><b class="badge '+cl+'">'+ic+r[1]+'</b></div>';
      }).join('');
      h+='<div class="kv"><span>زمان تا انتقال</span><b>'+L.est+'</b></div>';
      if(L.risk){h+='<div class="alert al-bad">'+L.risk+'</div>'}
      h+='<div class="alert al-ok"><b>گزارش حقوقی آماده است.</b>'+(lr?' وضعیت درخواست: '+lr.status:'')+'<div style="margin-top:6px"><button class="btn btn-xs" data-act="dt" data-t="req" data-cat="buy">پیگیری در درخواست‌ها</button></div></div>';
    }else{
      h+='<p class="note">سند، رهن، مادهٔ ۱۰۰، وقف و وراثت — پیش از هر پرداخت بررسی می‌شود.</p>'+
      '<button class="btn btn-primary" style="margin-top:10px" data-act="blegal">دریافت گزارش (۱۰۰ کلید)</button>';
    }
    h+='</div>'+wnav('buy',!!D.legal,D.legal?'✓ دریافت شد':'ابتدا گزارش را دریافت کنید');
  }else if(st===7){
    defPay(D);
    if(D.price===undefined){D.price=D.budg||300000000000}
    if(D.escD===undefined){D.escD=0}
    var BC=conInit(D,'buy');
    if(D.signed){
      h+='<div class="card done-card"><div class="bigicon">✓</div><div class="ct">قرارداد خرید داخلی ثبت شد</div><div class="kv"><span>شناسه</span><b style="direction:ltr">'+(D.code||'—')+'</b></div><div class="kv"><span>وضعیت</span><b>'+conBadge(D,'buy')+'</b></div><div class="alert al-warn">این قرارداد در سامانهٔ رسمی ثبت نشده است؛ انتقال سند در دفتر اسناد رسمی انجام می‌شود.</div><div class="fs-actions"><button class="btn btn-sm" data-act="cdoc" data-i="cur">مشاهدهٔ سند</button><button class="btn btn-sm" data-act="cprint">دریافت PDF</button></div></div>';
    }else if(D.ctrActive){
      h+='<div class="con-head"><div><div class="ct" style="margin:0">قرارداد خرید</div><p class="note">شناسهٔ پیش‌نویس: '+esc(BC.draftCode)+'</p></div><div>'+conBadge(D,'buy')+'</div></div>'+conFlowHTML(D,'buy');
    }else{
      h+='<div class="card"><div class="ct">قرارداد خرید</div><p class="note">اطلاعات خریدار، فروشنده، ملک و قیمت را یک‌جا تکمیل و سند داخلی و PDF بسازید.</p><button class="btn btn-primary" data-act="bcon">ایجاد قرارداد خرید</button></div>';
    }
    h+='<div class="card"><div class="ct"> پرداخت امانی — توافق طرفین</div>';
    h+='<div class="srow" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><label class="switch"><input type="checkbox" id="payStg"'+(D.pay.staged?' checked':'')+'><span class="tr"></span></label><span style="font-size:13px">پرداخت <b>مرحله‌ای</b> توافق شده است؟</span></div>';
    if(D.pay.staged){
      h+='<div class="srow"><div class="slab"><span>تعداد مراحل</span></div><div class="seg">'+[2,3,4,5,6].map(function(n){return '<button class="'+(D.pay.n===n?'on':'')+'" data-act="payN" data-v="'+n+'">'+fa(n,0)+'</button>'}).join('')+'</div></div>';
      h+='<h4 class="mini">درصد هر مرحله (جمع = ۱۰۰)</h4>';
      h+='<div style="display:flex;gap:8px;flex-wrap:wrap">'+D.pay.pcts.map(function(p,i){
        return '<span style="display:flex;gap:4px;align-items:center"><input class="tinp" data-ep="'+i+'" data-min="1" data-max="100" value="'+p+'"><span class="note">٪</span></span>';
      }).join('');
      var ps=0;D.pay.pcts.forEach(function(x){ps+=x});
      h+='<b id="paysum" style="color:'+(ps===100?'var(--ok)':'var(--danger)')+'">جمع: '+fa(ps,0)+'</b></div>';
    }else{
      h+='<div class="alert al-warn">پرداخت یکجا: ۱۰۰٪ هنگام انتقال سند.</div>';
    }
    h+='<button class="btn btn-primary" style="margin-top:10px" data-act="payOk">'+(D.pay.ok?'✓ توافق ثبت شد (ویرایش)':'تأیید توافق طرفین')+'</button></div>';
    if(D.pay.ok){
      h+='<div class="card" style="margin-top:14px"><div class="ct"> آزادسازی از امانی</div>';
      h+=rng('price','قیمت توافق‌شده',50000000000,800000000000,10000000000,D.price);
      h+='<div id="escwrap"></div><div id="esctot"></div>';
      h+='<div class="alert al-ok">آزادسازی با پیشرفت اداری؛ استعلام صیادی به فسخ خودکار متصل است.</div></div>';
    }
    h+=wnav('buy',!!D.escrow,D.pay.ok?'':'ابتدا توافق را نهایی کنید');
  }else{
    if(!D.ut){D.ut=[0,0,0,0]}
    var UT=['برق','گاز','آب','قبوض'];
    h+='<div class="card"><div class="ct"> تحویل و انشعابات</div>';
    h+=UT.map(function(u,i){
      return '<div class="esc'+(D.ut[i]?' done':'')+'"><span class="nm">'+u+'</span>'+(D.ut[i]?'<span class="badge b-ok">منتقل ✓</span>':'<button class="btn btn-xs" data-act="but" data-i="'+i+'">ثبت</button>')+'</div>';
    }).join('');
    if(D.utils){
      if(d.done){
        h+='<div class="done-card"><div class="bigicon">✓</div><div class="ct">فلوی خرید تکمیل شد</div><p class="note">سند و انشعابات منتقل شد؛ درخواست‌ها در سابقه باقی می‌مانند.</p>'+
        '<div class="fs-actions" style="justify-content:center"><button class="btn btn-sm" data-act="dt" data-t="req" data-cat="buy">درخواست‌ها</button><button class="btn btn-sm btn-primary" data-act="flowNew" data-m="buy">درخواست خرید جدید</button></div></div>';
      }else{
        h+='<div class="alert al-ok">همهٔ انشعابات منتقل شد.</div><button class="btn btn-primary" data-act="bdone">اتمام فلوی خرید</button>';
      }
      h+='<div style="margin-top:14px"><div class="ct" style="font-size:13px">خدمات پس از تحویل</div><p class="note">خدمات را داخل محلینو سفارش دهید و وضعیت را همان‌جا پیگیری کنید.</p><button class="btn" data-act="svcs">مشاهدهٔ خدمات</button></div>';
    }
    h+='</div>'+wnav('buy',false,'');
  }
  el.innerHTML=h;
  if(st===1){
    $$('#v-buy [data-rk]').forEach(function(r){
      r.addEventListener('input',function(){
        D.budg=+r.value;save();
        var e=document.getElementById('bq-out');
        if(e){var as=affordSpan(D.budg);e.textContent='حدود '+fa(as[1],0)+' تا '+fa(as[0],0)+' متر'}
      });
    });
    var e0=document.getElementById('bq-out');
    if(e0){var as0=affordSpan(D.budg);e0.textContent='حدود '+fa(as0[1],0)+' تا '+fa(as0[0],0)+' متر'}
    bindImp('buy');
    bindDr('buy');
  }
  if(st===3){
    /* نمودار ساختگی حذف شد؛ مقایسه و منبع در HTML همان گام است. */
  }
  if(st===4&&!D.liqSkip){
    var updLq=function(){
      var cum=0;
      D.assets.forEach(function(a){if(a.d<=D.lday)cum+=(+a.a||0)});
      var r=cum/D.budg,g=document.getElementById('lqbar');
      if(g){g.style.width=Math.min(100,r*100)+'%';g.style.background=(r>=1?'#2e9e5b':'#e8a13a')}
      var e1=document.getElementById('lqnote');
      if(e1){e1.textContent='نقد آماده روز '+fa(D.lday,0)+': '+rial(cum)+' از '+rial(D.budg)}
      var m=document.getElementById('lqmsg');
      if(m){
        if(r>=1){m.className='alert al-ok';m.innerHTML=' کل مبلغ قابل‌پرداخت است.'}
        else if(cum>=D.budg*0.2){m.className='alert al-warn';m.innerHTML=' '+rial(cum)+' — با پرداخت مرحله‌ای (۲۰٪ = '+rial(D.budg*0.2)+') قابل‌شروع است.'}
        else{m.className='alert al-bad';m.innerHTML=' کافی نیست — می‌توانید رد کنید.'}
      }
    };
    $$('#v-buy [data-asi]').forEach(function(r){
      r.addEventListener('input',function(){
        var i=+r.getAttribute('data-asi'),k=r.getAttribute('data-ask');
        if(!D.assets[i])return;
        if(k==='n'){D.assets[i].n=r.value}else{D.assets[i][k]=+r.value}
        save();updLq();
      });
    });
    $$('#v-buy [data-rk]').forEach(function(r){r.addEventListener('input',function(){D.lday=+r.value;save();updLq()})});
    updLq();
  }
  if(st===5){bindDr('buy')}
  if(st===7){
    var ps=document.getElementById('payStg');
    if(ps){
      ps.addEventListener('change',function(){
        D.pay.staged=ps.checked;D.pay.ok=false;D.escD=0;D.escrow=false;save();renderCurrent();
      });
    }
    var updE=function(){
      if(!D.pay.ok)return;
      var stg=escStages(D);
      document.getElementById('escwrap').innerHTML=stg.map(function(s2,i){
        var cls=(i<D.escD)?'done':(i===D.escD?'cur':'');
        return '<div class="esc '+cls+'"><span class="nm">'+fa(i+1,0)+'. '+s2.t+' — '+rial(D.price*s2.p/100)+'</span>'+
        (i<D.escD?'<span class="badge b-ok">آزاد ✓</span>':(i===D.escD?'<button class="btn btn-xs btn-primary" data-act="besc">تأیید و آزادسازی</button>':'<span class="badge b-info">قفل</span>'))+'</div>';
      }).join('');
      var com=D.price*0.005,tax=D.price*0.035+150000000;
      document.getElementById('esctot').innerHTML='<div class="grid g3" style="margin-top:12px"><div class="kv"><span>کمیسیون ۰٫۵٪</span><b>'+rial(com)+'</b></div><div class="kv"><span>مالیات</span><b>'+rial(tax)+'</b></div><div class="kv"><span>بهای تمام‌شده</span><b>'+rial(D.price+com+tax)+'</b></div></div>';
    };
    $$('#v-buy [data-rk]').forEach(function(r){r.addEventListener('input',function(){D.price=+r.value;save();updE()})});
    updE();
  }
};

/* ═══ ۱۳) سرمایه‌گذاری ═══ */
VIEWS.invest=function(){go('landing');if(window.E30&&E30.discAPI)E30.discAPI.start('invest','مشاوره سرمایه‌گذاری')};

