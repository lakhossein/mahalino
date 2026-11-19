/* ═══ ۲۱.۱۳) موتور V0.28 (E28) — قرارداد درون‌گفت‌وگو، یادآور جامع، اکشن پیام، کشف فلوها ═══ */
var E28={ctrKind:null,ctrDone:null,remPend:null,remF:'all'};
E28.tsv=function(n,sz){return '<svg width="'+(sz||16)+'" height="'+(sz||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+TABLER[n]+'</svg>'};
E28.baPaint=function(w,v){
  if(w._pv===v)return;w._pv=v;
  var after=w.querySelector('.ba27-after'),hd=w.querySelector('.ba27-handle');
  if(after)after.style.clipPath='inset(0 0 0 '+v+'%)';
  if(hd)hd.style.left=v+'%';
  var r=w.parentNode&&w.parentNode.querySelector('.ba27-range');
  if(r&&+r.value!==v)r.value=v;
};

/* ── اکشن‌های پیام ── */
E28.plain=function(html){
  var d=document.createElement('div');d.innerHTML=String(html||'');
  return (d.textContent||'').replace(/\s+$/,'');
};
E28.msgActs=function(m,ix){
  if(!m||m.sys)return '';
  var b='';
  if(m.r==='user')b+='<button type="button" data-cba="mEdit" data-ix="'+ix+'" aria-label="ویرایش پیام" title="ویرایش">'+E28.tsv('pencil',14)+'</button>';
  b+='<button type="button" data-cba="mCopy" data-ix="'+ix+'" aria-label="کپی پیام" title="کپی">'+E28.tsv('copy',14)+'</button>';
  if(m.r==='user')b+='<button type="button" data-cba="mDel" data-ix="'+ix+'" aria-label="حذف پیام" title="حذف">'+E28.tsv('trash',14)+'</button>';
  return '<span class="macts">'+b+'</span>';
};
CBACT.mCopy=function(el){
  var ix=+el.getAttribute('data-ix'),m=HIST[ix];
  if(!m)return;
  var txt=E28.plain(m.h);
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);
    else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    toast('پیام کپی شد');
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:34',e,'caught');toast('کپی ممکن نشد')}
};
CBACT.mEdit=function(el){
  var ix=+el.getAttribute('data-ix'),m=HIST[ix];
  if(!m||m.r!=='user')return;
  var txt=E28.plain(m.h);
  var i2=document.getElementById('chatIn');
  if(i2){i2.value=txt;i2.focus();i2.dispatchEvent(new Event('input',{bubbles:true}))}
  HIST.splice(ix,1);cr();
};
CBACT.mDel=function(el){
  var ix=+el.getAttribute('data-ix');
  if(HIST[ix]&&HIST[ix].r==='user'){HIST.splice(ix,1);cr()}
};

/* ── کشف فلوها: پیشنهادهای خوش‌آمد (گروه‌بندی‌شده، همه قابل اجرا) ── */
E28.welcomeSuggestions=function(){
  return [
    {l:'شروع اجاره',a:'data-cf="rent"',p:1},
    {l:'شروع خرید',a:'data-cf="buy"'},
    {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'},
    {l:'مقایسهٔ محله‌ها',a:'data-cq="مقایسه سعادت‌آباد و پونک"'},
    {l:'نقشه',a:'data-view="map"'},
    {l:'درخواست‌های من',a:'data-act="reqModal"'},
    {l:'ثبت قرارداد',a:'data-cq="ثبت قرارداد"'},
    {l:'فسخ قرارداد',a:'data-cq="فسخ قرارداد"'},
    {l:'کیف پول',a:'data-cba="wMenu"'},
    {l:'یادآورها',a:'data-cba="remMenu28"'},
    {l:'اقامتگاه',a:'data-cf="stay"'},
    {l:'خدمات ملک',a:'data-act="svcs"'}
  ];
};
E28.discoverChips=function(){
  function g(t,items){return '<div class="e28-disc-g">'+t+'</div><div class="racts">'+items.map(function(x){return '<button class="qbtn'+(x[2]?' primary':'')+'" '+x[1]+'>'+x[0]+'</button>'}).join('')+'</div>'}
  return '<div class="e28-disc">'+
  g('معامله',[
    ['شروع اجاره','data-cf="rent"',1],['شروع خرید','data-cf="buy"'],['اقامتگاه','data-cf="stay"']
  ])+
  g('بازار و تحلیل',[
    ['بازار محله‌ها','data-cq="بازار محله‌ها"'],['مقایسهٔ محله‌ها','data-cq="مقایسه سعادت‌آباد و پونک"'],['نقشه','data-view="map"']
  ])+
  g('قرارداد و امور',[
    ['ثبت قرارداد','data-cq="ثبت قرارداد"'],['فسخ قرارداد','data-cq="فسخ قرارداد"'],['درخواست‌های من','data-act="reqModal"']
  ])+
  g('حساب و ابزار',[
    ['کیف پول','data-cba="wMenu"'],['یادآورها','data-cba="remMenu28"'],['خدمات ملک','data-act="svcs"']
  ])+
  '</div>';
};

/* ── قرارداد درون‌گفت‌وگو: بازاستفاده از فرم صفحه در حباب ── */
E28.contractOf=function(code){
  if(!code||!S.contracts)return null;
  for(var i=0;i<S.contracts.length;i++){if(S.contracts[i]&&S.contracts[i].code===code)return S.contracts[i]}
  return null;
};
E28.applyTermination=function(code){
  var c=E28.contractOf(code);
  if(!c||c.status==='terminated')return false;
  c.statusTrail=(c.statusTrail||[]).concat([{st:c.status||'signed_internal',t:c.t||Date.now()}]);
  c.status='terminated';
  if(c.doc)c.doc.status='terminated';
  c.terminatedAt=Date.now();
  try{addReq('rent','فسخ','فسخ قرارداد '+code,'کامل شد','وضعیت: فسخ‌شده')}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:97',e,'caught');}
  return true;
};
E28.ctrBubble=function(){
  var kind=E28.ctrKind||'rent',D=wd(kind).data,c=conInit(D,kind);
  return '<div data-e28ctr="1">'+conFlowHTML(D,kind)+'</div>';
};
E28.ctrRefresh=function(){
  if(CURRENT!=='landing')return;
  var b=document.getElementById('chatB');
  if(!b||!b.querySelector('[data-e28ctr]'))return;
  var lastMsg=null,bots=b.querySelectorAll('.msg.bot');
  if(bots.length)lastMsg=bots[bots.length-1];
  if(!lastMsg||!lastMsg.querySelector('[data-e28ctr]'))return;
  HIST[HIST.length-1]={r:'bot',h:E28.ctrBubble(),c:null};
  cr();
  var kind=E28.ctrKind||'rent',D=wd(kind).data,c=conInit(D,kind);
  if(c.finalized&&E28.ctrDone!==c.code){
    E28.ctrDone=c.code;
    botC(' قرارداد داخلی <b dir="ltr">'+esc(c.code)+'</b> ثبت شد. فسخ بعدی هم در همین گفت‌وگو انجام می‌شود.'+
    '<div class="racts"><button class="qbtn primary" data-cba="ctrCont" data-v="trm">شروع فسخ و تخلیه</button><button class="qbtn" data-cv="F:reqs">درخواست‌های من</button></div>',null);
  }
};
E28.ctrStart=function(kind){
  kind=kind||'rent';
  E28.ctrKind=kind;
  var D=wd(kind).data;
  D.ctr=conInit(D,kind);
  if(D.ctr.finalized&&D.code)E28.ctrDone=D.code;
  botC('<b>'+(kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+'</b> — فرم درون‌گفت‌وگو:'+E28.ctrBubble(),null);
  if(D.ctr.finalized){
    botC(' قرارداد <b dir="ltr">'+esc(D.code||D.ctr.code||'')+'</b> ثبت شده است. فسخ هم در همین گفت‌وگو انجام می‌شود.'+
    '<div class="racts"><button class="qbtn primary" data-cba="ctrCont" data-v="trm">شروع فسخ و تخلیه</button></div>',null);
  }
};
var _oConKind=conKind;
conKind=function(){return (CURRENT==='landing'&&E28.ctrKind)?E28.ctrKind:_oConKind()};
['cback','lookupId','lookupPostal','cpartySave','cpropSave','capprove','cfinalize'].forEach(function(k){
  var o=ACT[k];
  if(typeof o!=='function')return;
  ACT[k]=function(el){o(el);setTimeout(function(){try{E28.ctrRefresh()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:137',e,'caught');}},30)};
});
CBACT.ctrCont=function(el){
  var v=el.getAttribute('data-v');
  if(v==='trm'){
    var kind=E28.ctrKind||'rent',D=wd(kind).data;
    if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
    if(!D.term)D.term={ph:1,who:'مستأجر (شما)'};
    save();ceJump('termq');
  }
};

/* ── یادآور جامع (V0.28) — مدل کامل، تشخیص خودکار، مدیریت ── */
E28.remNorm=function(){
  if(!S.reminders)S.reminders=[];
  var now=Date.now();
  S.reminders.forEach(function(r){
    if(!r)return;
    if(r.desc===undefined)r.desc='';
    if(!r.rec)r.rec='once';
    if(r.status===undefined)r.status=r.done?'done':'open';
    if(!r.src)r.src='manual';
    if(!r.createdAt)r.createdAt=now;
    if(!r.updatedAt)r.updatedAt=now;
    if(r.notified===undefined)r.notified=false;
  });
};
E28.findRem=function(id){
  var a=S.reminders||[];
  for(var i=0;i<a.length;i++){if(a[i]&&a[i].id===id)return a[i]}
  return null;
};
E28.remTitleFromText=function(t){
  return String(t||'')
    .replace(/(یادم بنداز|یادم بینداز|یادآور کن|یادآوری کن|به من یادآوری کن|یادآور بگذار|یادم باشه|یادم باشد|remind me)/g,' ')
    .replace(/\s+/g,' ').replace(/^ | $/g,'')
    .replace(/^(فردا|پس‌فردا|امروز)\s+/,'')
    .replace(/^ساعت\s*[۰-۹0-9]{1,2}([:٫.:][۰-۹0-9]{1,2})?\s*/,'')
    .replace(/(که|رو|را)s+(فردا|پس‌فردا|امروز|هفتهٔ بعد|هفته بعد)/g,' ')
    .replace(/^\s+|\s+$/g,'').replace(/\s+/g,' ').slice(0,70);
};
E28.remParseWhen=function(nn){
  var t=normFa(nn),d=null,rec='once';
  if(/اول هر ماه|اولین روز هر ماه|هر ماه اول/.test(t))rec='monthly';
  else if(/هر ماه/.test(t))rec='monthly';
  else if(/هر هفته/.test(t))rec='weekly';
  d=E21.dateFromText(t);
  if(!d&&rec==='monthly'){d=new Date();d=new Date(d.getFullYear(),d.getMonth()+1,1,9,0,0).getTime()}
  if(!d){
    var m=t.match(/([۰-۹0-9]+)\s*(روز|هفته|ماه)\s*(دیگر|بعد|دیگه)/);
    if(m){
      var n=+pd(m[1]),unit=m[2],mult=unit==='روز'?864e5:(unit==='هفته'?7*864e5:30*864e5);
      var base=new Date();base=new Date(base.getFullYear(),base.getMonth(),base.getDate(),9,0,0);
      d=base.getTime()+n*mult;
    }
  }
  if(!d){
    var wd_={'شنبه':6,'یک‌شنبه':0,'یکشنبه':0,'دوشنبه':1,'سه‌شنبه':2,'سهشنبه':2,'چهارشنبه':3,'پنج‌شنبه':4,'پنجشنبه':4,'جمعه':5};
    for(var k in wd_){
      if(t.indexOf(k)>=0){
        var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
        var cur=today.getDay(),target=wd_[k],diff=(target-cur+7)%7||7;
        d=today.getTime()+diff*864e5+9*36e5;
        break;
      }
    }
  }
  if(!d)return null;
  var hm=t.match(/ساعت\s*([۰-۹0-9]{1,2})(?:[:٫.:]([۰-۹0-9]{1,2}))?\s*(صبح|بامداد|ظهر|بعدازظهر|عصر|شب)?/);
  if(!hm)hm=t.match(/([۰-۹0-9]{1,2})\s*(صبح|بامداد|ظهر|بعدازظهر|عصر|شب)/);
  if(hm){
    var hh=+pd(hm[1]),mm=hm[2]?+pd(hm[2]):0,part=hm[3]||'';
    if(part==='عصر'||part==='شب'||part==='بعدازظهر'){if(hh<12)hh+=12}
    else if(part==='ظهر'&&hh<12)hh+=12;
    if(hh>=0&&hh<24&&mm>=0&&mm<60){
      var dd=new Date(d);
      d=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate(),hh,mm,0).getTime();
    }
  }else{
    var dd9=new Date(d); /* بدون ساعت صریح → ۰۹:۰۰ */
    d=new Date(dd9.getFullYear(),dd9.getMonth(),dd9.getDate(),9,0,0).getTime();
  }
  return {ts:d,rec:rec};
};
E28.remDup=function(title,ts){
  var a=S.reminders||[];
  return a.some(function(r){return r&&r.title===title&&Math.abs((r.due||0)-ts)<36e5&&!r.done});
};
E28.remCreate=function(title,when,src,desc,chat){
  var r={id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),
    title:title.slice(0,70),desc:desc||'',due:when.ts,rec:when.rec||'once',
    done:false,status:'open',src:src||'manual',chat:chat||null,
    createdAt:Date.now(),updatedAt:Date.now(),notified:false};
  S.reminders.unshift(r);
  E28.remCap();
  save();E25.profileDirty();
  E28.askNotify();
  return r;
};
E28.remCap=function(){
  try{
    while(S.reminders.length>50){
      var iDone=-1;
      for(var i=0;i<S.reminders.length;i++){if(S.reminders[i].done){iDone=i;break}}
      S.reminders.splice(iDone>=0?iDone:0,1);
      toast('سقف ۵۰ یادآور پر بود؛ قدیمی‌ترین حذف شد.');
    }
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:244',e,'caught');}
};
E28.remAuto=function(nn,raw){
  if(!E21.noFlow())return false;
  var t=normFa(raw||nn);
  if(E28.remPend){
    var w2=E28.remParseWhen(t);
    if(w2){
      usrC(raw);
      var title2=E28.remPend.title;
      if(!title2){
        var t3=E28.remTitleFromText(raw);
        if(t3&&t3.length>2){title2=t3}
        else{E28.remPend.title='';botC('عنوان یادآور چی باشد؟ (یک عبارت کوتاه بنویسید)',null);return true}
      }
      if(!title2){E28.remPend.title='';botC('عنوان یادآور چی باشد؟',null);return true}
      if(E28.remDup(title2,w2.ts)){E28.remPend=null;botC('این یادآور قبلاً ثبت شده است.',null);return true}
      var r2=E28.remCreate(title2,w2,'manual','',E22.restoredId);
      E28.remPend=null;
      E28.remSaved(r2);
      return true;
    }
    if(/انصراف|لغو|بی خیال/.test(t)){usrC(raw);E28.remPend=null;botC('ثبت یادآور لغو شد.',null);return true}
    if(E28.remPend.when&&!w2){
      /* عنوان منتظر است — همین پیام را عنوان بگیر */
      var t4=E28.remTitleFromText(raw);
      if(t4&&t4.length>2){
        usrC(raw);
        if(E28.remDup(t4,E28.remPend.when.ts)){E28.remPend=null;botC('این یادآور قبلاً ثبت شده است.',null);return true}
        var r4=E28.remCreate(t4,E28.remPend.when,'manual','',E22.restoredId);
        E28.remPend=null;E28.remSaved(r4);
        return true;
      }
    }
    return false;
  }
  var intent=/(یادم بنداز|یادم بینداز|یادآور کن|یادآوری کن|به من یادآوری کن|یادآور بگذار|یادم باشه|یادم باشد|یادآور)/.test(t);
  if(!intent)return false;
  usrC(raw);
  var title=E28.remTitleFromText(raw);
  var w=E28.remParseWhen(t);
  if(!w){
    if(title&&title.length>2){
      E28.remPend={title:title};
      botC('برای «'+esc(title)+'» چه زمانی یادآوری کنم؟ (مثلاً «فردا ساعت ۱۰» یا «شنبه» یا «۵ روز دیگر»)',null);
    }else{
      E28.remPend={title:null};
      botC('یادآور چی باشد و چه زمانی؟ (مثلاً «یادم بنداز فردا ساعت ۱۰ تماس با موجر»)',null);
    }
    return true;
  }
  if(!title||title.length<3){E28.remPend={when:w,title:null};botC('عنوان یادآور چی باشد؟',null);return true}
  if(E28.remDup(title,w.ts)){botC('این یادآور قبلاً ثبت شده است.',null);return true}
  if(E28.remPend&&E28.remPend.when){w=E28.remPend.when;E28.remPend=null}
  var r=E28.remCreate(title,w,'manual','',E22.restoredId);
  E28.remSaved(r);
  return true;
};
E28.remSaved=function(r){
  botC(' یادآور ثبت شد — «'+esc(r.title)+'»'+(r.rec!=='once'?(r.rec==='monthly'?' (هر ماه)':' (هر هفته)'):'')+
  rcNote(fd(r.due)+(new Date(r.due).getHours()||new Date(r.due).getMinutes()?' · ساعت '+fa(new Date(r.due).getHours(),0)+':'+fa(new Date(r.due).getMinutes(),0):''))+
  rcActs([{l:'یادآورها',a:'data-cba="remMenu28"'}]),null);
};
E28.remNext=function(r){
  var d=new Date(r.due);
  if(r.rec==='weekly')return new Date(d.getTime()+7*864e5).getTime();
  if(r.rec==='monthly')return new Date(d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),0).getTime();
  return null;
};
E28.remTick=function(){
  var a=S.reminders||[],now=Date.now(),changed=false;
  a.forEach(function(r){
    if(!r||r.done||r.notified)return;
    if((r.due||0)<=now){
      r.notified=true;r.updatedAt=now;changed=true;
      toast('یادآور: '+r.title);
      try{
        if(window.Notification&&Notification.permission==='granted'){
          new Notification('یادآور محلینو',{body:r.title});
        }
      }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:324',e,'caught');}
      var nx=E28.remNext(r);
      if(nx){
        a.unshift({id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),title:r.title,desc:r.desc||'',due:nx,
          rec:r.rec,done:false,status:'open',src:r.src,chat:r.chat,createdAt:now,updatedAt:now,notified:false});
      }
    }
  });
  if(changed)save();
};
E28.askNotify=function(){
  try{
    if(window.Notification&&Notification.permission==='default'){
      Notification.requestPermission();
    }
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:339',e,'caught');}
};
E28.remListHTML=function(){
  E28.remNorm();
  var a=(S.reminders||[]).slice(),f=E28.remF,now=Date.now(),today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  function chip(k,lab){return '<button class="qbtn'+(f===k?' primary':'')+'" data-cba="remF28" data-v="'+k+'">'+lab+'</button>'}
  var h='<b>دفتر یادآور</b><div class="racts" style="margin:6px 0">'+
  chip('all','همه')+chip('over','گذشته')+chip('today','امروز')+chip('soon','هفتهٔ پیش‌رو')+chip('done','انجام‌شده')+'</div>';
  a=a.filter(function(r){
    if(!r)return false;
    if(f==='done')return r.done;
    if(r.done)return false;
    if(f==='over')return r.due<now;
    if(f==='today')return r.due>=today&&r.due<today+864e5;
    if(f==='soon')return r.due>=today&&r.due<today+8*864e5;
    return true;
  });
  if(!a.length)return h+'<div class="empty" style="margin-top:8px">یادآوری در این فهرست نیست.</div>';
  h+=a.slice(0,12).map(function(r){
    var ov=!r.done&&r.due<now;
    return '<div class="rem28'+(ov?' overdue':'')+(r.done?' done':'')+'">'+
    '<div class="rem28-main"><b>'+esc(r.title)+(r.rec!=='once'?'<span class="rem28-tag">'+(r.rec==='monthly'?'هر ماه':'هر هفته')+'</span>':'')+(r.src==='auto'?'<span class="rem28-tag">خودکار</span>':'')+'</b>'+
    '<small>'+(r.done?'انجام‌شده · ':'')+fd(r.due)+(ov?' · گذشته':'')+(r.desc?' · '+esc(r.desc):'')+'</small></div>'+
    '<div class="rem28-acts">'+
    (r.done?'':'<button type="button" data-cba="remDone28" data-id="'+qesc(r.id)+'" title="انجام شد" aria-label="انجام شد">'+E28.tsv('check',14)+'</button>')+
    (r.done?'':'<button type="button" data-cba="remSnooze28" data-id="'+qesc(r.id)+'" title="یک روز بعد" aria-label="تعویق یک روز">'+E28.tsv('alarm-snooze',14)+'</button>')+
    '<button type="button" data-cba="remEdit28" data-id="'+qesc(r.id)+'" title="ویرایش" aria-label="ویرایش">'+E28.tsv('pencil',14)+'</button>'+
    '<button type="button" data-act="remDel" data-id="'+qesc(r.id)+'" title="حذف" aria-label="حذف">'+E28.tsv('trash',14)+'</button>'+
    '</div></div>';
  }).join('');
  return h;
};
CBACT.remMenu28=function(){
  usrC('دفتر یادآور');
  botC(E28.remListHTML()+
  '<div class="racts"><button class="qbtn primary" data-cba="remAdd28b">یادآور جدید</button></div>',null);
};
CBACT.remF28=function(el){
  E28.remF=el.getAttribute('data-v')||'all';
  var b=document.getElementById('chatB');
  if(b&&b.querySelector('.rem28')){HIST[HIST.length-1]={r:'bot',h:E28.remListHTML()+'<div class="racts"><button class="qbtn primary" data-cba="remAdd28b">یادآور جدید</button></div>',c:null};cr()}
};
CBACT.remAdd28b=function(){
  usrC('یادآور جدید');
  E25.rem={stage:'title',title:null,due:null,amt:null};
  botC('عنوان یادآور را بنویسید. («انصراف» هم می‌توانید بفرستید.)',null);
};
CBACT.remDone28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  r.done=true;r.status='done';r.updatedAt=Date.now();
  var nx=E28.remNext(r);
  if(nx){
    S.reminders.unshift({id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),title:r.title,desc:r.desc||'',due:nx,
      rec:r.rec,done:false,status:'open',src:r.src,chat:r.chat,createdAt:Date.now(),updatedAt:Date.now(),notified:false});
    save();E25.profileDirty();
    botC('انجام شد — دورهٔ بعدی برای '+esc(fd(nx))+' ثبت شد.',null);return;
  }
  save();E25.profileDirty();
  botC('«'+esc(r.title)+'» انجام شد.',null);
};
CBACT.remSnooze28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  r.due+=864e5;r.notified=false;r.updatedAt=Date.now();
  save();E25.profileDirty();
  botC('به '+esc(fd(r.due))+' موکول شد.',null);
};
CBACT.remEdit28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  openModal('<h3>ویرایش یادآور</h3>'+
  '<div class="srow"><div class="slab"><span>عنوان</span></div><input class="inp" id="re28-t" value="'+qesc(r.title)+'" maxlength="70"></div>'+
  '<div class="srow"><div class="slab"><span>توضیح</span></div><input class="inp" id="re28-d" value="'+qesc(r.desc||'')+'" maxlength="140"></div>'+
  '<div class="srow"><div class="slab"><span>سررسید (2026-11-10 یا 2026-11-10 10:30)</span></div><input class="inp" id="re28-w" dir="ltr" style="text-align:left" value="'+qesc(E28.whenStr(r.due))+'"></div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="remEditOk28" data-id="'+qesc(r.id)+'">ذخیره</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
E28.whenStr=function(ts){
  var d=new Date(ts),p=function(n){return (n<10?'0':'')+n};
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+(d.getHours()||d.getMinutes()?' '+p(d.getHours())+':'+p(d.getMinutes()):'');
};
ACT.remEditOk28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  var t=document.getElementById('re28-t'),d=document.getElementById('re28-d'),w=document.getElementById('re28-w');
  if(!r||!w){closeModal();return}
  var ts=E21.dateFromText(w.value);
  if(!ts){toast('تاریخ را متوجه نشدم — شکل 2026-11-10');return}
  var hm=String(w.value).match(/([0-9]{1,2}):([0-9]{2})/);
  if(hm){var dd=new Date(ts);ts=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate(),+hm[1],+hm[2],0).getTime()}
  if(t&&t.value.replace(/\s/g,''))r.title=t.value.slice(0,70);
  if(d)r.desc=d.value.slice(0,140);
  r.due=ts;r.notified=false;r.updatedAt=Date.now();
  E28.remCap();save();E25.profileDirty();
  closeModal();toast('یادآور به‌روز شد');
};

/* ── مسیرهای آزاد جدید: ثبت/فسخ قرارداد ── */
E28.route=function(nn,raw){
  if(!E21.noFlow())return false;
  var t=normFa(raw||nn);
  if(/ثبت قرارداد|قرارداد جدید|اجاره‌نامه|قرارداد اجاره/.test(t)&&!/فسخ/.test(t)){
    usrC(raw);
    var Dr=wd('rent').data;
    if(Dr.listing&&!Dr.signed){E28.ctrStart('rent');return true}
    if(Dr.signed&&Dr.code){botC(' قرارداد <b dir="ltr">'+esc(Dr.code)+'</b> قبلاً ثبت شده است.',null);return true}
    botC('برای ثبت قرارداد، اول در فلوی اجاره یا خرید یک ملک انتخاب کنید.',[['شروع اجاره','data-cf="rent"']]);
    return true;
  }
  if(/فسخ قرارداد|لغو قرارداد|تخلیه هوشمند|تخلیهٔ هوشمند/.test(t)){
    usrC(raw);
    var D2=wd('rent').data;
    if(D2.code&&D2.signed){
      if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
      ceJump('termq');
      return true;
    }
    var c=null,i;
    for(i=0;i<(S.contracts||[]).length;i++){if(S.contracts[i].kind==='rent'){c=S.contracts[i];break}}
    if(!c){botC('قرارداد فعالی ثبت نشده است؛ بعد از امضای قرارداد در فلوی اجاره، فسخ همین‌جا قابل انجام است.',[['شروع اجاره','data-cf="rent"']]);return true}
    if(c.status==='terminated'){botC('این قرارداد قبلاً فسخ شده است.<div class="qr"><button data-cba="e29termAI" data-code="'+qesc(c.code)+'">تحلیل هوشمند اسناد</button><button data-cba="e29termLater">بستن</button></div>',null);return true}
    D2.code=c.code;D2.signed=true;save();
    if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
    ceJump('termq');
    return true;
  }
  return false;
};

/* ── به‌روزرسانی ppmTick برای یادآورها ── */
var _oPpm28=ppmTick;
ppmTick=function(){
  _oPpm28();
  try{E28.remTick()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:471',e,'caught');}
};

E28.init=function(){
  try{E28.remNorm()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:475',e,'caught');}
  var cin=document.getElementById('chatIn');
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.classList&&t.classList.contains('cwr-in')){
      t.style.height='auto';
      var h=Math.min(200,t.scrollHeight);
      t.style.height=h+'px';
    }
  });
};

/* رهگیری متن آزاد: یادآور خودکار + مسیرهای قرارداد — بالاتر از موتورهای قبلی */
var _oCeSend28=ceSend;
ceSend=function(t){
  if(String(t)==='!back'){_oCeSend28(t);return}
  try{if(E28.route(String(t).replace(/^\s+|\s+$/g,''),t))return}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:491',e,'caught');}
  try{if(E28.remAuto(String(t).replace(/^\s+|\s+$/g,''),t))return}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/chat-ux.js:492',e,'caught');}
  _oCeSend28(t);
};

