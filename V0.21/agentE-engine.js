/* ═══ ۲۱.۹) موتور گفت‌وگوی V0.21 — پیوست‌ها، اجزای تعاملی، زمینه (Agent E) ═══
   این بخش عیناً پیش از «راه‌اندازی» (بخش ۲۲) در فایل تک‌فایلی درج می‌شود؛ همهٔ توابع/شیءهای
   V0.20 در همین اسکوپ از قبل تعریف شده‌اند و اینجا فقط «پیچیده» (wrap) می‌شوند — چیزی بازتعریف
   یا حذف نمی‌شود. قواعد سفت: هیچ موتور موازی کسب‌وکاری؛ هر اقدام از مسیر توابع موجود
   (ceVal/ceJump/ceStep/doRentVisit/ACT.besc/ACT.tpay/svcOrderFormHTML/upsertPlace/openPickMap/...)
   می‌گذرد. سازنده‌های جدید فقط رندر می‌کنند. پیوست‌ها فقط برای همین نشست‌اند (blob URL) و
   هرگز در localStorage ذخیره نمی‌شوند. هیچ ادعای OCR/تحلیل تصویر/AI وجود ندارد.
   رشته‌ها فارسی؛ اعداد با fa()/rial()؛ فقط ویژگی‌های سپرده‌شده (delegation)، بدون onclick خطی. */

/* ─── وضعیت ماژول (فقط نشست جاری) ─── */
var E21={
  trays:{chat:[],fch:[],dash:[]},         /* سینی پیوست هر سطح کامپوزر (جلسه‌ای) */
  pending:{chat:null,fch:null,dash:null}, /* پیوست‌های در انتظار پیام بعدی هر سطح */
  active:null,                            /* آخرین سطح فعال کامپوزر */
  urls:[],                                /* همهٔ blob URLها برای آزادسازی در گفت‌وگوی جدید */
  seq:0,                                  /* شمارندهٔ داخلی */
  grt:null, grtPayload:null,              /* واگذاری هدایت‌شدهٔ اجارهٔ تضمینی */
  svc:null, svcPF:null, svcHandoffAt:0,   /* واگذاری هدایت‌شدهٔ خدمات */
  clr:null,                               /* متن در انتظار تصمیم نوار شفاف‌سازی (گام متنی) */
  forceRoute:false,                       /* عبور یک‌باره از نوار شفاف‌سازی */
  chipUsr:false,                          /* پیام کاربر برای چیپِ داده‌شده از قبل نمایش داده شده */
  lastAttNames:null,                      /* نام پیوست‌های آخرین پیامِ پیوست‌دار */
  resumeAsk:false                         /* پرسش «برگردیم به فلو؟» پس از ناوبری */
};

/* ─── ابزارهای کوچک ─── */
E21.MAXF=6;                    /* حداکثر تعداد پیوست در هر ارسال */
E21.MAXB=8*1024*1024;          /* حداکثر حجم هر فایل: ۸ مگابایت */
E21.CSVMAX=200*1024;           /* سقف پیش‌نمایش جدولی محلی */
E21.OKEXT={png:1,jpg:1,jpeg:1,webp:1,pdf:1,doc:1,docx:1,xls:1,xlsx:1,csv:1,txt:1};
E21.IMGT={png:1,jpg:1,jpeg:1,webp:1};
E21.SESSION_NOTE='پیوست فقط در همین نشست معتبر است؛ با بازنشانی صفحه از بین می‌رود.';
E21.extOf=function(n){var m=/\.([a-z0-9]+)$/i.exec(String(n||''));return m?m[1].toLowerCase():''};
E21.fmtSize=function(b){if(b>=1048576)return fa(b/1048576,1)+' مگابایت';return fa(Math.max(1,Math.round(b/1024)),0)+' کیلوبایت'};
E21.docIcon=function(ext){
  if(E21.IMGT[ext])return 'IMG';
  if(ext==='pdf')return 'PDF';
  if(ext==='doc'||ext==='docx')return 'DOC';
  if(ext==='xls'||ext==='xlsx')return 'XLS';
  if(ext==='csv')return 'CSV';
  return 'TXT';
};
E21.iso=function(d){try{return d.toISOString().slice(0,10)}catch(e){return null}};
/* ترتیب مهم: «پس‌فردا» پیش از «فردا» آزموده می‌شود */
E21.dateFromText=function(nt){
  if(/امروز/.test(nt))return E21.iso(new Date());
  if(/پس.?فردا/.test(nt))return E21.iso(new Date(Date.now()+2*864e5));
  if(/فردا/.test(nt))return E21.iso(new Date(Date.now()+864e5));
  if(/جمعه/.test(nt)){var add=(5-new Date().getDay()+7)%7||7;return E21.iso(new Date(Date.now()+add*864e5))}
  var m=nt.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m?m[0]:null;
};
/* نردبان لگاریتمی ۱/۲/۵ برای لغزندهٔ مبالغ (S-CMP-01 — قطعیت §۵/۱ به نردبان) */
E21.ladder=function(min,max){
  var out=[],d=Math.floor(Math.log(Math.max(1,min))/Math.LN10),m10=[1,2,5],i,v,guard=0;
  while(guard++<60){
    var hit=false;
    for(i=0;i<3;i++){
      v=m10[i]*Math.pow(10,d);
      if(v>=min*0.999&&v<=max*1.001){out.push(Math.round(v));hit=true}
      if(v>max*1.001){d=-1;break}
    }
    if(d<0)break;
    d++;
  }
  if(!out.length)return out;
  if(out[0]>min)out.unshift(Math.round(min));
  if(out[out.length-1]<max)out.push(Math.round(max));
  return out;
};
E21.ladderIndex=function(lad,v){
  if(!v)return Math.floor(lad.length/2);
  var i,best=0,bd=Infinity;
  for(i=0;i<lad.length;i++){var dd=Math.abs(lad[i]-v);if(dd<bd){bd=dd;best=i}}
  return best;
};
/* «بدون فلو» یعنی واقعاً بی‌فلو یا منوی خوش‌آمد (gate) — واگذاری‌ها و استخراج اسلات باید
   در همان حالتِ اول هم کار کنند (اصلاح Recovery-1: chatNew → ceStartGate → CE.f='gate'). */
E21.noFlow=function(){return !CE.f||CE.f==='gate'};

/* ─── نمایشگر تصویر (#attViewer) — با شنیدهٔ سپرده‌شدهٔ خودمان؛ بلاک سپرده‌شدهٔ موجود دست نمی‌خورد ─── */
E21.ensureViewer=function(){
  if(document.getElementById('attViewer'))return;
  var v=document.createElement('div');
  v.id='attViewer';
  v.setAttribute('role','dialog');
  v.setAttribute('aria-modal','true');
  v.setAttribute('aria-label','نمایش بزرگ تصویر پیوست — برای بستن کلیک کنید');
  v.innerHTML='<img alt="" dir="ltr">';
  document.body.appendChild(v);
};
E21.openViewer=function(src,alt){
  if(!src)return;
  E21.ensureViewer();
  var v=document.getElementById('attViewer'),im=v.querySelector('img');
  im.src=src;im.alt=alt||'تصویر پیوست';
  v.classList.add('on');
};
E21.closeViewer=function(){
  var v=document.getElementById('attViewer');
  if(v){v.classList.remove('on');var im=v.querySelector('img');if(im)im.src=''}
};

/* ─── سینی پیوست ─── */
E21.renderTray=function(surface){
  var prev=document.getElementById(surface+'Prev');
  if(!prev)return;
  var tray=E21.trays[surface]||[];
  var h=tray.map(function(it){
    if(it.err){
      return '<span class="attchip" style="border-color:var(--danger);color:var(--danger)">'+
        '<span class="ai" aria-hidden="true">!</span><span class="am"><b style="max-width:200px;white-space:normal;direction:rtl;text-align:right">'+esc(it.msg)+'</b></span>'+
        '<button class="ax" type="button" data-cba="attRm" data-surface="'+surface+'" data-id="'+qesc(it.id)+'" aria-label="بستن پیام خطا">×</button></span>';
    }
    var media=it.img
      ?'<img src="'+it.url+'" alt="پیش‌نمایش '+qesc(it.name)+'" data-att-view="'+qesc(it.id)+'" role="button" tabindex="0" title="نمایش بزرگ‌تر">'
      :'<span class="ai" aria-hidden="true" style="font-size:9px;font-weight:700">'+E21.docIcon(it.ext)+'</span>';
    var meta=E21.fmtSize(it.size)+((it.img&&it.w)?' • '+fa(it.w,0)+'×'+fa(it.h,0):'');
    return '<span class="attchip">'+media+
      '<span class="am"><b>'+esc(it.name)+'</b><small>'+meta+'</small></span>'+
      '<button class="ax" type="button" data-cba="attRm" data-surface="'+surface+'" data-id="'+qesc(it.id)+'" aria-label="حذف پیوست '+qesc(it.name)+'">×</button></span>';
  }).join('');
  prev.innerHTML=h;
  prev.hidden=!tray.length;
  try{a11yify(prev)}catch(e){}
};
E21.trayErr=function(surface,msg){
  var tray=E21.trays[surface];
  if(!tray)return;
  /* جلوگیری از چیپ‌های خطای تکراری (QA-C: یک فایل ردشده تا ۶ چیپ یکسان می‌ساخت) */
  var last=tray[tray.length-1];
  if(last&&last.err&&last.msg===msg)return;
  var id='err-'+(++E21.seq);
  tray.push({err:true,id:id,msg:msg});
  E21.renderTray(surface);
  setTimeout(function(){
    var tr=E21.trays[surface]||[],i;
    for(i=0;i<tr.length;i++){if(tr[i].id===id&&tr[i].err){tr.splice(i,1);break}}
    E21.renderTray(surface);
  },7000);
};
E21.addFiles=function(surface,list,prefix){
  var arr=[],i;
  try{arr=Array.prototype.slice.call(list)}catch(e){return}
  if(!arr.length)return;
  for(i=0;i<arr.length;i++){
    (function(f){
      if(!f)return;
      var tray=E21.trays[surface]||[];
      var real=tray.filter(function(x){return !x.err});
      var name=f.name||'';
      if(prefix&&(!name||/^blob/i.test(name)))name=prefix+'-'+fa(++E21.seq,0)+'.png';
      var ext=E21.extOf(name);
      if(real.length>=E21.MAXF){
        toast('حداکثر '+fa(E21.MAXF,0)+' پیوست در هر پیام؛ «'+name+'» اضافه نشد.');
        E21.trayErr(surface,'حداکثر '+fa(E21.MAXF,0)+' پیوست — یکی را حذف کنید.');
        return;
      }
      if(!E21.OKEXT[ext]){
        toast('نوع فایل پشتیبانی نمی‌شود: '+ext+' — تصویر، سند، صفحه‌گسترده و متن پذیرفته می‌شود.');
        E21.trayErr(surface,'نوع «'+ext+'» پذیرفته نمی‌شود؛ png/jpg/webp، pdf/doc/docx، xls/xlsx/csv، txt.');
        return;
      }
      if(f.size>E21.MAXB){
        toast('فایل «'+name+'» بیشتر از ۸ مگابایت است ('+E21.fmtSize(f.size)+').');
        E21.trayErr(surface,'«'+name+'» '+E21.fmtSize(f.size)+' است — سقف ۸ مگابایت.');
        return;
      }
      var it={id:'att'+Date.now()+'-'+(++E21.seq),name:name,size:f.size,ext:ext,img:E21.IMGT[ext]?1:0,url:null,w:null,h:null,file:f};
      if(it.img){
        it.url=URL.createObjectURL(f);
        E21.urls.push(it.url);
        (function(item,sf){
          var im=new Image();
          im.onload=function(){item.w=im.naturalWidth;item.h=im.naturalHeight;E21.renderTray(sf)};
          im.src=item.url;
        })(it,surface);
      }
      tray.push(it);
    })(arr[i]);
  }
  E21.renderTray(surface);
};
CBACT.attRm=function(el){
  var s=el.getAttribute('data-surface'),id=el.getAttribute('data-id');
  var tray=E21.trays[s];
  if(!tray)return;
  var i;
  for(i=0;i<tray.length;i++){
    if(tray[i].id===id){
      if(tray[i].url){try{URL.revokeObjectURL(tray[i].url)}catch(e){}}
      tray.splice(i,1);break;
    }
  }
  E21.renderTray(s);
};
E21.revokeAll=function(){
  E21.urls.forEach(function(u){try{URL.revokeObjectURL(u)}catch(e){}});
  E21.urls=[];
  E21.trays={chat:[],fch:[],dash:[]};
  E21.pending={chat:null,fch:null,dash:null};
  ['chat','fch','dash'].forEach(function(s){E21.renderTray(s)});
};

/* راه‌اندازی کامپوزر هر سطح — باز-ورودپذیر (گارد روی خودِ عنصر، چون فرود هر بار رندر می‌شود) */
function attInit(surface){
  surface=(surface==='fch'||surface==='dash')?surface:'chat';
  var cwr=document.getElementById(surface+'Cwr'),
      btn=document.getElementById(surface+'Att'),
      file=document.getElementById(surface+'File'),
      prev=document.getElementById(surface+'Prev'),
      ta=document.getElementById(surface+'In');
  if(!cwr||!btn||!file||!prev||!ta)return;
  E21.renderTray(surface); /* سینیِ پابرجا در عنصر تازه‌ساخت بازیابی می‌شود */
  if(cwr.getAttribute('data-att-ready')==='1')return;
  cwr.setAttribute('data-att-ready','1');
  btn.addEventListener('click',function(){try{file.click()}catch(e){}});
  file.addEventListener('change',function(){E21.addFiles(surface,file.files);file.value=''});
  ['dragenter','dragover'].forEach(function(ev){
    cwr.addEventListener(ev,function(e){e.preventDefault();cwr.classList.add('dropzone')});
  });
  ['dragleave','dragend'].forEach(function(ev){
    cwr.addEventListener(ev,function(){cwr.classList.remove('dropzone')});
  });
  cwr.addEventListener('drop',function(e){
    e.preventDefault();
    cwr.classList.remove('dropzone');
    if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)E21.addFiles(surface,e.dataTransfer.files);
  });
  ta.addEventListener('paste',function(e){
    var items=e.clipboardData&&e.clipboardData.items;
    if(!items)return;
    var files=[],i,it;
    for(i=0;i<items.length;i++){
      it=items[i];
      if(it.kind==='file'&&/^image\//.test(it.type)){var f=it.getAsFile();if(f)files.push(f)}
    }
    if(files.length){e.preventDefault();E21.addFiles(surface,files,'چسبانده-تصویر')}
  });
  ta.addEventListener('focus',function(){E21.active=surface});
  ta.addEventListener('input',function(){
    E21.active=surface;
    ta.style.height='auto';
    ta.style.height=Math.min(ta.scrollHeight,120)+'px';
  });
}

/* ─── ارسال با پیوست: متن + پیوست‌ها با هم (S-ATT-05) ─── */
function ceSendWithAtt(text,surface){
  surface=(surface==='fch'||surface==='dash')?surface:'chat';
  E21.active=surface;
  var t=String(text==null?'':text).replace(/^\s+|\s+$/g,'');
  var tray=E21.trays[surface]||[];
  if(t==='!back'){ceSend(t);return} /* بازگشت، پیوست حمل نمی‌کند — سینی دست‌نخورده می‌ماند */
  var send=[],keep=[],i;
  for(i=0;i<tray.length;i++){(tray[i].err?keep:send).push(tray[i])}
  if(!send.length){ceSend(t);return}
  E21.pending[surface]=send;
  E21.trays[surface]=keep;
  E21.renderTray(surface);
  if(!t){
    usrC(fa(send.length,0)+' پیوست ارسال شد — بدون متن.');
    return; /* پیوست‌ها داخل usrC به حباب پیام می‌چسبند و واکنش دستیار می‌آید */
  }
  ceSend(t); /* در مسیرهای نمایش پیام کاربر داخل ceSend، usrC فراخوانی می‌شود و پیوست‌ها می‌چسبند */
}

/* ─── پیچاندن usrC: چسباندن پیوست‌های در انتظار همان سطح به پیام کاربر ───
   مسیرهای کلیکِ چیپ (data-cv/data-cf) هم usrC را صدا می‌زنند؛ وقتی سینی خالی است این پیچ عملاً بی‌اثر است. */
var _usrC=usrC;
usrC=function(t){
  var s=null;
  if(E21.active&&E21.pending[E21.active]&&E21.pending[E21.active].length){s=E21.active}
  else{
    ['chat','fch','dash'].forEach(function(k){if(!s&&E21.pending[k]&&E21.pending[k].length)s=k});
  }
  var atts=null;
  if(s){atts=E21.pending[s];E21.pending[s]=null;E21.active=s}
  _usrC(String(t));
  if(atts&&atts.length){
    E21.lastAttNames=atts.map(function(a){return a.name});
    E21.appendAttGrid(atts);
    E21.scheduleAttReact(atts);
  }
};

/* ─── کارت پیوست داخل حباب پیام و واکنش صادقانهٔ دستیار (S-ATT-01/02/03) ─── */
E21.attCardHTML=function(it){
  var meta=E21.fmtSize(it.size)+((it.img&&it.w)?' • '+fa(it.w,0)+'×'+fa(it.h,0):'')+' • '+esc(String(it.ext).toUpperCase());
  var media=it.img
    ?'<img src="'+it.url+'" alt="پیوست '+qesc(it.name)+'" data-att-view="'+qesc(it.id)+'" role="button" tabindex="0" title="نمایش بزرگ‌تر">'
    :'<span class="ai" aria-hidden="true" style="font-size:10px;font-weight:700">'+E21.docIcon(it.ext)+'</span>';
  return '<span class="attcard">'+media+'<span class="am"><b>'+esc(it.name)+'</b><small>'+meta+'</small></span></span>';
};
E21.appendAttGrid=function(atts){
  var last=HIST[HIST.length-1];
  if(!last||last.r!=='user'||!atts||!atts.length)return;
  last.h+='<div class="attgrid">'+atts.map(E21.attCardHTML).join('')+'</div>';
  cr();
};
E21.scheduleAttReact=function(atts){
  setTimeout(function(){
    try{E21.attReact(atts)}catch(e){}
  },780);
};
E21.vphotoIx=function(D){
  try{
    defVlist(D);
    var i;
    for(i=0;i<D.vlist.length;i++){if(String(D.vlist[i].t).indexOf('عکس از ایرادها')>=0)return i}
  }catch(e){}
  return -1;
};
/* یک بلاک واکنش برای «هر پیام» (نه هر فایل) — فقط رفتار صادقانه */
E21.attReact=function(atts){
  if(!atts||!atts.length)return;
  var imgs=atts.filter(function(a){return a.img&&!a.err});
  var docs=atts.filter(function(a){return !a.img&&!a.err});
  var tables=docs.filter(function(a){return (a.ext==='csv'||a.ext==='txt')&&a.size<=E21.CSVMAX});
  var others=docs.filter(function(a){return tables.indexOf(a)<0});
  var h='<div class="attreact"><div class="rh"><span class="ai" aria-hidden="true">＋</span>'+
        '<span>'+fa(atts.length,0)+' پیوست دریافت و نگه‌داری شد</span></div>';
  var acts=[];
  if(imgs.length){
    h+='<div style="margin-top:6px;font-size:12.3px;line-height:2">تصویر پیوست شد، تحلیل نشد: در این نسخه، تحلیل محتوای عکس (تشخیص نم، ارزیابی قیمت از عکس) انجام نمی‌شود و حدس هم نمی‌زنم. بررسی چشمی با خودِ شماست.</div>';
    if(CE.f==='rent'){
      var stR=SCRIPTS.rent?SCRIPTS.rent[CE.i]:null;
      if(stR&&stR.id==='tai'){
        h+=rcNote('تحلیل تصویر در گام فسخ «شبیه‌سازی» است — نتیجهٔ واقعی از عکس شما استخراج نمی‌شود.');
      }
      var D=wd('rent').data,ix=E21.vphotoIx(D);
      if(stR&&stR.id==='vform'&&ix>=0&&!D.vlist[ix].ok){
        acts.push({l:'علامت‌گذاری «عکس از ایرادها» در چک‌لیست بازدید',a:'data-cba="vcT" data-i="'+ix+'"',p:1});
      }
    }
  }
  if(others.length){
    var names=others.map(function(a){return a.name});
    h+='<div style="margin-top:6px;font-size:12.3px;line-height:2">سند پیوست شد: '+esc(names.join('، '))+' — در این نسخه محتوای PDF/Word/Excel بازخوانی نمی‌شود؛ فقط مشخصات فایل (نام/نوع/حجم) ثبت است.</div>';
    if(CE.f==='buy'){
      var stB=SCRIPTS.buy?SCRIPTS.buy[CE.i]:null;
      if(stB&&(stB.id==='lg'||stB.id==='lgsc')){
        acts.push({l:'یادداشت نام فایل‌ها برای گام گزارش حقوقی',a:'data-cba="attLegal"',p:1});
      }
    }
  }
  if(acts.length)h+=rcActs(acts);
  h+=rcNote(E21.SESSION_NOTE)+'</div>';
  botC(h,null);
  tables.forEach(function(a){E21.csvPreview(a)});
};
CBACT.attLegal=function(){
  var names=E21.lastAttNames||[];
  if(!names.length){toast('نام فایلی برای یادداشت پیدا نشد');return}
  var D=wd('buy').data;
  D.legalDocs=names.slice(0,6);
  var r=openReqOf('buy','حقوقی');
  if(r){r.detail=(r.detail?r.detail+'؛ ':'')+'مدارک ارسالی کاربر: '+names.join('، ')+' (فقط نام — بدون محتوا)'}
  save();
  botC('نام فایل‌ها برای گام گزارش حقوقی یادداشت شد: '+esc(names.join('، '))+' — محتوای فایل بازخوانی یا ارسال نمی‌شود.'+rcNote(E21.SESSION_NOTE),null);
};
/* پارسر جدولی محلی: UTF-8، جداکنندهٔ کاما/ویرگول‌خط/tab — بدون پشتیبانی از نقل‌قول چندسطری (صادقانه) */
E21.parseCSV=function(text){
  var t=String(text||'').replace(/^\uFEFF/,'');
  if(t.indexOf('\uFFFD')>=0)return {ok:false,msg:'انکودینگ فایل شناسایی نشد (UTF-8 به‌نظر نمی‌رسد)؛ پیش‌نمایش ممکن نیست.'};
  var lines=t.split(/\r?\n/).filter(function(l){return l.replace(/^\s+|\s+$/g,'')!==''});
  if(!lines.length)return {ok:false,msg:'فایل متنی خالی است.'};
  var first=lines[0];
  var c1=(first.match(/,/g)||[]).length,c2=(first.match(/;/g)||[]).length,c3=(first.match(/\t/g)||[]).length;
  var d=',';
  if(c2>c1&&c2>=c3)d=';';
  else if(c3>c1&&c3>=c2)d='\t';
  var rows=lines.map(function(l){return l.split(d).map(function(c){return c.replace(/^\s+|\s+$/g,'')})});
  var maxc=1,i;
  for(i=0;i<rows.length;i++){if(rows[i].length>maxc)maxc=rows[i].length}
  return {ok:true,rows:rows,cols:Math.min(8,maxc),total:rows.length,sep:d};
};
E21.csvPreview=function(it){
  if(!it||!it.file)return;
  try{
    var fr=new FileReader();
    fr.onload=function(){
      var p=E21.parseCSV(fr.result);
      if(!p.ok){botC('فایل «'+esc(it.name)+'»: '+esc(p.msg)+rcNote(E21.SESSION_NOTE),null);return}
      var heads=[],body=[],i;
      for(i=0;i<p.rows.length&&i<13;i++){
        var row=p.rows[i].slice(0,p.cols);
        if(i===0){heads=row;continue}
        body.push(row);
      }
      while(heads.length<p.cols)heads.push('ستون '+fa(heads.length+1,0));
      var msg='';
      if(p.cols===1){
        msg='فایل «'+esc(it.name)+'» — فهرست متنی ('+fa(p.total,0)+' سطر):'+
            '<div class="rnote" style="white-space:pre-line;max-height:180px;overflow:auto">'+esc(p.rows.slice(0,12).map(function(r2){return r2[0]}).join('\n'))+'</div>'+
            (p.total>12?'<div class="rnote">نمایش '+fa(12,0)+' سطر از '+fa(p.total,0)+' سطر.</div>':'');
      }else{
        msg='پیش‌نمایش محلی «'+esc(it.name)+'» (جداکننده: '+(p.sep==='\t'?'Tab':esc(p.sep))+'):'+
            rcTable(heads,body.map(function(r2){
              var out=[],k;
              for(k=0;k<p.cols;k++)out.push({h:esc(r2[k]!==undefined?r2[k]:''),v:String(r2[k]!==undefined?r2[k]:'')});
              return out;
            }))+
            (p.total>body.length+1?'<div class="rnote">نمایش '+fa(body.length,0)+' سطر از '+fa(p.total,0)+' سطر فایل.</div>':'');
      }
      botC(msg+rcNote('این پیش‌نمایش، خوانش محلی فایل خودتان است؛ اطلاعاتی به جای دیگری ارسال نمی‌شود و تفسیر هوشمند انجام نمی‌شود.'+E21.SESSION_NOTE),null);
    };
    fr.onerror=function(){botC('خواندن فایل «'+esc(it.name)+'» ممکن نشد.'+rcNote(E21.SESSION_NOTE),null)};
    fr.readAsText(it.file,'utf-8');
  }catch(e){}
};

/* ─── لغزندهٔ مبلغ (S-CMP-01) — کمکی است؛ تایپ و چیپ‌ها مسیر اصلی می‌مانند ───
   بازه‌ها عیناً از اعتبارسنجی st.set گام‌های موجود برداشته شده‌اند ( money-steps فهرست §۴). */
E21.SLIDE={
  'rent.dep':{min:1000000000,max:60000000000},
  'rent.rentb':{min:10000000,max:1500000000},
  'buy.budg':{min:50000000000,max:1000000000000},
  'invr.cap':{min:1000000000,max:100000000000},
  'invr.fund':{min:13200000,max:100000000000},
  'invb.cap':{min:500000000,max:50000000000},
  'invb.price':{min:100000000,max:50000000000},
  'mkt.bid':{min:1000000000,max:50000000000}
};
function slSlider(slotKey,cfg){
  cfg=cfg||{};
  var min=+cfg.min||0,max=+cfg.max||0;
  if(!(max>min))return '';
  var lad=E21.ladder(min,max);
  if(lad.length<2)return '';
  var id='slr'+(++E21.seq);
  var cur=(cfg.value&&cfg.value>=min&&cfg.value<=max)?cfg.value:null;
  return '<div class="rsld" data-slot="'+qesc(slotKey||'')+'">'+
    '<div class="rl"><span>مقدار پیشنهادی را می‌توانید تایپ کنید — یا اینجا تنظیم کنید:</span>'+
    '<b id="'+id+'V">'+rial(cur||lad[Math.floor(lad.length/2)])+'</b></div>'+
    '<input type="range" id="'+id+'" min="0" max="'+(lad.length-1)+'" step="1" value="'+E21.ladderIndex(lad,cur)+'" data-rsld="'+id+'" data-ladder="'+lad.join(',')+'" aria-label="انتخاب مبلغ با لغزنده" style="direction:ltr">'+
    '<div class="cwr-hint" style="margin-top:4px">مقیاس لگاریتمی (گام‌های ۱/۲/۵) — از '+rial(min)+' تا '+rial(max)+'؛ پس از تأیید، همان مسیر مقدارِ گام طی می‌شود.</div>'+
    '<div class="racts" style="margin-top:6px"><button class="qbtn primary" data-cba="slSet" data-rsld-for="'+id+'">تأیید همین مقدار</button></div>'+
    '</div>';
}
CBACT.slSet=function(el){
  var rid=el.getAttribute('data-rsld-for'),r=rid?document.getElementById(rid):null;
  if(!r){toast('لغزنده پیدا نشد');return}
  var lad=(r.getAttribute('data-ladder')||'').split(',').filter(Boolean).map(Number);
  var v=lad[+r.value];
  if(!v){toast('مقدار لغزنده نامعتبر است');return}
  var st=(CE.f&&SCRIPTS[CE.f])?SCRIPTS[CE.f][CE.i]:null;
  if(!st||!st.money){toast('این لغزنده به مرحلهٔ فعلی گفت‌وگو تعلق ندارد.');return}
  usrC('تأیید مقدار لغزنده: '+rial(v));
  ceVal(String(v));
};
document.addEventListener('input',function(e){
  var r=e.target;
  if(!r||!r.getAttribute||!r.getAttribute('data-rsld'))return;
  var lad=(r.getAttribute('data-ladder')||'').split(',').filter(Boolean).map(Number);
  var v=lad[+r.value];
  var out=document.getElementById(r.getAttribute('data-rsld')+'V');
  if(out&&v)out.textContent=rial(v);
});

/* ─── پنل تأیید/جمع‌بندی (S-CMP-02/03) — سازندهٔ فقط-رندر؛ اقدام‌ها از مسیر موجود ─── */
function rcConfirm(rows,actions){
  var h='<div class="rconfirm"><div class="rct">جمع‌بندی — پیش از تأیید</div>';
  (rows||[]).forEach(function(r){
    var v=(r.v===undefined||r.v===null||r.v==='')?'—':r.v;
    var b='<b'+(r.j?(' data-cj="'+qesc(r.j)+'" role="button" tabindex="0" title="ویرایش — بازگشت به مرحلهٔ مربوط"'):'')+'>'+v+'</b>';
    h+='<div class="rtag"><span>'+esc(r.l)+'</span>'+b+'</div>';
  });
  if(actions&&actions.length)h+=rcActs(actions);
  return h+'</div>';
}
E21.visitConfirmHTML=function(){
  var D=wd('rent').data;
  var lx=D.listing?findL(D.listing):null;
  var ok=!!(lx&&D.vday&&D.vtime);
  var rows=[
    {l:'ملک',v:lx?esc(lx.t):'',j:'list'},
    {l:'محله',v:lx?esc(findH(lx.hood).n):''},
    {l:'زمان بازدید',v:(D.vday&&D.vtime)?(esc(D.vday)+' — '+esc(D.vtime)):'',j:'day'},
    {l:'هزینهٔ توکنی',v:fa(COSTS.visit,0)+' توکن — '+esc(COSTL.visit)}
  ];
  var acts=ok?[{l:'تأیید و ثبت درخواست بازدید ('+fa(COSTS.visit,0)+' توکن)',a:'data-cba="attVisitGo"',p:1}]:null;
  var tail=ok?'':rcNote('برای فعال‌شدن تأیید، ملک و زمان بازدید را کامل کنید؛ مقدارهای «—» با کلیک به مرحلهٔ مربوط می‌روند.');
  return rcConfirm(rows,acts)+tail;
};
E21.escConfirmHTML=function(){
  var D=wd('buy').data;
  if(!D.pay||!D.pay.ok)return rcNote('ابتدا توافق پرداخت (مراحل و درصدها) را نهایی کنید.');
  var stg=escStages(D),i0=(D.escD===undefined?0:D.escD);
  if(i0>=stg.length)return '';
  var s=stg[i0];
  var rows=[
    {l:'مرحله',v:fa(i0+1,0)+' از '+fa(stg.length,0)+' — '+esc(s.t)},
    {l:'درصد آزادسازی',v:'٪'+fa(s.p,0)},
    {l:'مبلغ این مرحله',v:rial(Math.round(((D.price||D.budg)||0)*s.p/100))},
    {l:'هزینهٔ توکنی',v:fa(COSTS.escrow,0)+' توکن — یک‌بار، در مرحلهٔ اول ('+esc(COSTL.escrow)+')'}
  ];
  return rcConfirm(rows,[{l:'تأیید و آزادسازی همین مرحله',a:'data-cba="attEscGo"',p:1}]);
};
E21.tpayConfirmHTML=function(){
  var D=wd('rent').data;
  var rows=[
    {l:'قرارداد',v:esc(D.code||'—')},
    {l:'ودیعهٔ قابل واریز',v:rial(D.B?D.B.depB:0)},
    {l:'کسورات',v:'صفر — شبیه‌سازی؛ نتیجهٔ واقعی از عکس شما استخراج نمی‌شود'},
    {l:'نحوهٔ واریز',v:'۱۰۰٪ از حساب امانی'},
    {l:'هزینهٔ توکنی',v:'۰ توکن'}
  ];
  return rcConfirm(rows,[{l:'تأیید واریز ودیعه',a:'data-cba="attTpayGo"',p:1}]);
};
/* دکمه‌های تأیید پنل‌ها با گاردِ گام — هرگز موتور صفحه را دور نمی‌زنند */
CBACT.attVisitGo=function(){
  var st=(CE.f==='rent'&&SCRIPTS.rent)?SCRIPTS.rent[CE.i]:null;
  if(!st||st.id!=='visit'){toast('این دکمه به گام «ثبت بازدید» تعلق دارد.');return}
  ceVal('!go');
};
CBACT.attEscGo=function(){
  var st=(CE.f==='buy'&&SCRIPTS.buy)?SCRIPTS.buy[CE.i]:null;
  if(!st||st.id!=='escC'){toast('این دکمه به گام «پرداخت امانی» تعلق دارد.');return}
  ceVal('!ok');
};
CBACT.attTpayGo=function(){
  var st=(CE.f==='rent'&&SCRIPTS.rent)?SCRIPTS.rent[CE.i]:null;
  if(!st||st.id!=='tpay'){toast('این دکمه به گام «تسویه» تعلق دارد.');return}
  ceVal('!pay');
};
/* جمع‌بندیِ گفت‌وگومحور فلو (S-CMP-03) — نگاشت فیلد→گام برای data-cj */
E21.SUMFIELD={
  rent:[['ودیعه','dep',function(D){return (D.B&&D.B.depB)?rial(D.B.depB):''}],
        ['اجاره','rentb',function(D){return (D.B&&D.B.rentB)?rial(D.B.rentB):''}],
        ['محله','hoods',function(D){return D.hood?esc(findH(D.hood).n):''}],
        ['ملک','list',function(D){return D.listing?esc(findL(D.listing).t):''}],
        ['بازدید','day',function(D){return (D.vday&&D.vtime)?(esc(D.vday)+' — '+esc(D.vtime)):''}],
        ['کد قرارداد','ctr0',function(D){return D.code?esc(D.code):''}]],
  buy:[['بودجه','budg',function(D){return D.budg?rial(D.budg):''}],
       ['محله','hoods',function(D){return D.hood?esc(findH(D.hood).n):''}],
       ['ملک','list',function(D){return D.blist?esc(findB(D.blist).t):''}],
       ['حقوقی','lg',function(D){return D.legal?(LGD[D.legal]?esc(LGD[D.legal].lbl):'دریافت‌شده'):''}],
       ['امانی','escC',function(D){return D.escrow?'تکمیل‌شده':((D.pay&&D.pay.ok)?'توافق ثبت‌شده':'')}]],
  stay:[['شهر','city',function(D){return D.city?esc(D.city):''}],
        ['مسافر','ppl',function(D){return D.ppl?fa(D.ppl,0)+' نفر':''}],
        ['اقامتگاه','list',function(D){return D.stay?esc(findS(D.stay).t):''}],
        ['شب','ngt',function(D){return D.nights?fa(D.nights,0):''}],
        ['کد ورود','chk',function(D){return D.code?esc(D.code):''}]],
  mkt:[['نقش','role',function(D){return D.role?(D.role==='con'?'پیمانکار':'کارفرما'):''}],
       ['پیشنهاد','bid',function(D){return D.bid?rial(D.bid.amt):''}]],
  build:[['سفارش تأمین','sup',function(D){return (D.orders&&D.orders.length)?fa(D.orders.length,0)+' مورد':''}],
         ['پیشرفت','ph',function(D){return D.ph?'ثبت‌شده':''}]],
  invr:[['سرمایه','cap',function(D){return D.cap?rial(D.cap):''}],
        ['خرید توکن','fund',function(D){return D.amt?rial(D.amt):((D.cnt!==undefined)?fa(D.cnt,0)+' توکن':'')}]]
};
E21.scSummary=function(){
  var mod=CE.f;
  if(!mod){var runs=wfRunning();mod=runs.length?runs[0].m:null}
  if(!mod||!MODBY[mod]){
    botC('فعلاً فلوی فعالی برای جمع‌بندی نیست. یک مسیر را شروع کنیم؟'+RINT.topicsHTML(),null);
    return;
  }
  var w=wf(mod),D=w?w.data:{};
  var steps=WSTEPS[mod]||[];
  var cur=(CE.f===mod)?CE.i:(w?Math.min(w.step-1,steps.length-1):0);
  var rows=[],fields=E21.SUMFIELD[mod]||[];
  fields.forEach(function(f){
    var v='';
    try{v=f[2](D)||''}catch(e){}
    rows.push({l:f[0],v:v,j:v?f[1]:null});
  });
  if(!rows.length)rows=[{l:'وضعیت',v:'هنوز داده‌ای ثبت نشده'}];
  botC('جمع‌بندی «'+esc(MODBY[mod].t)+'» — برای ویرایش هر مقدار، روی آن بزنید تا به همان مرحله برگردید:'+
    rcConfirm(rows,null)+
    (steps.length?rcProg(steps,cur):'')+
    rcNote('ویرایش هر ردیف شما را به مرحلهٔ مربوط در همان فلو می‌برد؛ موتور فلو همان موتور قبلی است.'),null);
};

/* ─── تزریق لغزنده/پنل پس از رندر هر گام (با پیچاندن ceStep) ─── */
E21.maybeAssist=function(){
  if(!CE.f)return;
  var sc=SCRIPTS[CE.f];
  if(!sc)return;
  var st=sc[CE.i];
  if(!st)return;
  var last=HIST[HIST.length-1];
  if(!last||last.r!=='bot')return;
  var key=CE.f+'.'+(st.id||'');
  var add='';
  if(st.money&&E21.SLIDE[key]){
    var cfg=E21.SLIDE[key],D=wd(CE.f).data,cur=null;
    try{
      if(CE.f==='rent'&&D.B)cur=(key==='rent.dep')?D.B.depB:D.B.rentB;
      else if(CE.f==='buy'&&key==='buy.budg')cur=D.budg;
      else if(CE.f==='invr')cur=(key==='invr.cap')?D.cap:(key==='invr.fund'?D.amt:null);
      else if(CE.f==='invb')cur=(key==='invb.cap')?D.cap:(key==='invb.price'?((+D.payAmt)||null):null);
      else if(CE.f==='mkt')cur=D.bidAmt;
    }catch(e){}
    add+=slSlider(key,{min:cfg.min,max:cfg.max,value:cur});
  }
  if(key==='rent.visit')add+=E21.visitConfirmHTML();
  else if(key==='buy.escC')add+=E21.escConfirmHTML();
  else if(key==='rent.tpay')add+=E21.tpayConfirmHTML();
  if(add){last.h+=add;cr()}
};
var _ceStep=ceStep;
ceStep=function(){
  _ceStep();
  try{E21.maybeAssist()}catch(e){}
};

/* ─── نرمال‌سازی واژه‌های انگلیسی رایج (S-CTX-04) ───
   جدول نگاشت (واژهٔ کامل با مرز کلمه، بی‌توجه به بزرگی/کوچکی حروف):
     apartment/apt/flat → آپارتمان   villa → ویلایی          house/home → خانه
     rent → اجاره                    buy → خرید              sell → فروش
     deposit → ودیعه                 mortgage/loan → وام (طبق سناریو S-CTX-04: صادقانه به OOS می‌رود)
     budget → بودجه                  room/bedroom/beds → خواب
     meter/meters → متر              neighborhood/hood → محله
     north/south/east/west → شمال/جنوب/شرق/غرب
     family → خانواده                map → نقشه              token/tokens → توکن
     price → قیمت                    compare → مقایسه        stay/booking → اقامت/رزرو
     project(s) → پروژه              service(s) → خدمات      cleaning → نظافت
     repair → تعمیر                  help/guide → راهنما     summary → جمع‌بندی
     wallet → کیف پول                menu → منو              dashboard → داشبورد
     request → درخواست               contract → قرارداد      invest → سرمایه
     visit → بازدید
     saadatabad → سعادت‌آباد  ponak → پونک  narmak → نارمک
     satarkhan → ستارخان     shahran → شهران  jordan → جردن
   ترتیب مهم: واژه‌های بلندتر اول؛ مرز کلمه جلوی تطبیق درون‌واژه‌ای (مثل rent در current) را می‌گیرد. */
E21.ENMAP=[['apartment','آپارتمان'],['neighborhood','محله'],['dashboard','داشبورد'],['bedroom','خواب'],
  ['deposit','ودیعه'],['mortgage','وام'],['summary','جمع‌بندی'],['services','خدمات'],['service','خدمات'],
  ['booking','رزرو'],['project','پروژه'],['cleaning','نظافت'],['contract','قرارداد'],['request','درخواست'],
  ['compare','مقایسه'],['budget','بودجه'],['family','خانواده'],['satarkhan','ستارخان'],
  ['saadatabad','سعادت‌آباد'],['shahran','شهران'],['jordan','جردن'],['narmak','نارمک'],['ponak','پونک'],
  ['villa','ویلایی'],['flat','آپارتمان'],['meters','متر'],['meter','متر'],['hood','محله'],
  ['north','شمال'],['south','جنوب'],['east','شرق'],['west','غرب'],['house','خانه'],['home','خانه'],
  ['token','توکن'],['tokens','توکن'],['price','قیمت'],['wallet','کیف پول'],['invest','سرمایه'],['visit','بازدید'],
  ['repair','تعمیر'],['guide','راهنما'],['help','راهنما'],['rent','اجاره'],['buy','خرید'],['sell','فروش'],
  ['loan','وام'],['beds','خواب'],['room','خواب'],['map','نقشه'],['menu','منو'],['stay','اقامت']];
E21.enNorm=function(t){
  var s=String(t==null?'':t),i;
  for(i=0;i<E21.ENMAP.length;i++){
    var w=E21.ENMAP[i][0],f2=E21.ENMAP[i][1];
    var re=new RegExp('(^|[^A-Za-z])'+w+'([^A-Za-z]|$)','gi');
    s=s.replace(re,function(m0,m1,m2){return m1+f2+m2});
  }
  return s;
};

/* ─── پیش‌پردازش پیام کاربر — همه‌چیز پیش از ceSend اصلی ─── */
E21.STRONG=/بازار|مقایسه|توکن|نقشه|کیف پول|تضمینی|کدوم|کدام بهتر|جمع بندی|توزیع آگهی/;
/* آینهٔ بی‌اثر رگکس‌های RINT.route — فقط برای «ترتیب درست نمایش» (پاسخ پس از پیام کاربر) */
E21.routeLooksLikely=function(q){
  if(/^سلام/.test(q)||/^(درود|هی|hello|hi)/.test(q))return true;
  if(/ممنون|مرسی|سپاس|متشکر/.test(q))return true;
  if(/نیمه.?تمام|کجا بودم|از سر بگیر|ادامهٔ کار|ادامه کار/.test(q))return true;
  if(/مقایسه|کدوم بهتر|کدام بهتر/.test(q))return true;
  if(/چطور|چگونه|مراحل|فرایند|فرآیند/.test(q)&&RINT.modOf(q))return true;
  if(/تضمینی/.test(q)&&/چیه|چیست|یعنی|توضیح|تفاوت|مزایا|چطور/.test(q))return true;
  if(/یعنی چی|یعنی چه|بر اساس چی|چرا|توضیح بده|چطور حساب/.test(q))return true;
  if(/بازار|روند|تورم|میانگین|قیمت|آمار|امتیاز محله/.test(q))return true;
  var hasMoney=/[۰-۹0-9]/.test(q)&&/میلیارد|میلیون|هزار/.test(q);
  if(hasMoney&&/بخرم|بتونم|می توانم|چند متر|توان خرید/.test(q))return true;
  if(hasMoney&&/(رهن|ودیعه)/.test(q)&&/اجاره/.test(q))return true;
  if(/وام|مقرضه|بیمه|مالیات بر|ثبت سند|دفترخانه/.test(q))return true;
  return false;
};
E21.chipExact=function(st,nt){
  try{
    var mc=matchChipText(nt,st.chips?st.chips(wd(CE.f).data):null);
    return !!(mc&&mc.exact);
  }catch(e){return false}
};
E21.stepParseOk=function(st,nt){
  if(st.money)return parseMoneyFA(nt).ok;
  if(st.count)return parseCountFA(nt).ok;
  if(st.range)return parseRangeFA(nt).ok;
  if(st.moneyRange)return parseMoneyRangeFA(nt).ok;
  return true; /* گام عددی بدون پارسر مشخص — دخالت نمی‌کنیم */
};
E21.appendReturnChips=function(){
  var chips=[['↩ ادامهٔ فلو','!re']];
  if(CE.f&&CE.hist&&CE.hist.length)chips.push(['بازگشت یک مرحله','!back']);
  setTimeout(function(){
    var last=HIST[HIST.length-1];
    if(last&&last.r==='bot'){last.c=(last.c||[]).concat(chips);cr()}
  },800);
};
E21.appendLastChips=function(chips){
  var last=HIST[HIST.length-1];
  if(last&&last.r==='bot'){last.c=(last.c||[]).concat(chips);cr()}
};

/* ─── اصلاح میانهٔ فلو (S-CTX-02) — فقط توصیف؛ اجرا پس از نمایش پیام کاربر ─── */
E21.FIELDMAP={
  rent:{dep:'dep',rent:'rentb',beds:'beds',hood:'hoods',m2:'m2',floor:'floor'},
  buy:{budg:'budg',beds:'beds',hood:'hoods',m2:'m2',floor:'floor'},
  invr:{budg:'cap'},
  invb:{budg:'cap',price:'price'},
  mkt:{budg:'bid'}
};
E21.fieldLabel={dep:'ودیعه',rent:'اجارهٔ ماهانه',budg:'بودجه',beds:'تعداد خواب',hood:'محله',m2:'متراژ',floor:'طبقه'};
E21.corrRange=function(field,v){
  if(field==='dep')return v>=1000000000&&v<=60000000000;
  if(field==='rent')return v>=10000000&&v<=1500000000;
  if(field==='budg')return v>=50000000000;
  if(field==='beds')return v>=0&&v<=5;
  return true;
};
/* خروجی: null | {msg:String, sid:String?} */
E21.corr=function(nn){
  if(!CE.f||CE.f==='gate')return null;
  var sc=SCRIPTS[CE.f],st=sc?sc[CE.i]:null;
  if(!st)return null;
  var field=null;
  if(/ودیعه|رهن/.test(nn))field='dep';
  else if(/اجاره/.test(nn))field='rent';
  else if(/بودجه/.test(nn))field='budg';
  else if(/خواب/.test(nn))field='beds';
  else if(/محله|جای دیگ/.test(nn))field='hood';
  else if(/متراژ|متر /.test(nn))field='m2';
  else if(/طبقه/.test(nn))field='floor';
  if(!field)return null;
  var verb=/(بذار|بزار|عوض|تغییر|کنم|کن |شه |بشه|دیگه|دیگر|جای دیگ)/.test(nn)||/ کن$| کنم$| شه$/.test(nn);
  if(!verb)return null;
  var map=E21.FIELDMAP[CE.f]||{};
  var sid=map[field];
  if(!sid){
    return {msg:'فیلد «'+esc(E21.fieldLabel[field]||field)+'» در این فلو نیست؛ مقدار آن در صفحهٔ خود فلو ویرایش می‌شود.'};
  }
  if(sid===st.id)return null; /* پاسخ خودِ گام جاری است، نه اصلاح */
  var ix=-1,i;
  for(i=0;i<sc.length;i++){if(sc[i].id===sid){ix=i;break}}
  if(ix<0)return null;
  var D=wd(CE.f).data;
  if(field==='hood'){
    var hid=hoodFromText(nn);
    if(!hid)return {msg:'محلهٔ جدید را نام ببرید تا به مرحلهٔ «محله» برگردیم و آنجا ثبتش کنیم (مثلاً «محله رو عوض کنم، پونک»).'};
    var warn=(D.listing||D.blist)?rcNote('توجه: ملک انتخابی قبلی با محلهٔ جدید همخوان نیست؛ پس از اصلاح محله، ملک را دوباره انتخاب کنید (پاک نشده است).'):'';
    return {msg:'می‌رویم به مرحلهٔ «محله» برای اصلاح — محلهٔ جدید: <b>'+esc(findH(hid).n)+'</b>'+warn,sid:sid};
  }
  var val=null;
  if(field==='beds'){var pc=parseCountFA(nn);if(pc.ok)val=pc.value}
  else if(field==='m2'||field==='floor'){val=null} /* بدون پیش‌پر؛ فقط پرش به گام */
  else{var mx=RINT.moneyOf(nn),pm=parseMoneyFA(mx||'');if(pm.ok)val=pm.value}
  var lab=esc(E21.fieldLabel[field]||sid);
  if(field==='m2'||field==='floor'){
    return {msg:'به مرحلهٔ «'+lab+'» برمی‌گردم؛ مقدار جدید را همان‌جا وارد کنید.',sid:sid};
  }
  if(val===null||!E21.corrRange(field,val)){
    return {msg:'مقدار جدید برای «'+lab+'» را در همان پیام بگویید؛ مثلاً «'+(field==='dep'?'ودیعه رو بذار ۲۰ میلیارد':(field==='budg'?'بودجه رو ۵۰ میلیارد کنم':'سه خواب می‌خوام نه دو'))+'».'+
      (val?' مقدار گفته‌شده خارج از بازهٔ مجاز گام است و در گام بررسی می‌شود.':'')};
  }
  if(CE.f==='rent'||CE.f==='buy'){
    /* مقدار از مسیر پیش‌پُرِ خود گام اعمال می‌شود (pre-hook موجود) — بدون موتور موازی */
    if(field==='dep'){CTX.dep=val;if(D._depSet!==undefined)delete D._depSet}
    else if(field==='rent'){CTX.rent=val;if(D._rentbSet!==undefined)delete D._rentbSet}
    else if(field==='budg'){CTX.budg=val;if(D._budgSet!==undefined)delete D._budgSet}
    else if(field==='beds'){CTX.beds=val;if(D._bedsSet!==undefined)delete D._bedsSet}
    var fmt=(field==='beds')?fa(val,0):rial(val);
    return {msg:'می‌رویم به مرحلهٔ «'+lab+'» برای اصلاح — مقدار جدید: <b>'+fmt+'</b> (از مسیر پیش‌پُرِ خود گام اعمال می‌شود)',sid:sid};
  }
  return {msg:'به مرحلهٔ «'+lab+'» می‌روم؛ مقدار جدید را همان‌جا وارد کنید.',sid:sid};
};

/* ─── استخراج چنداسلاتی از پیام بی‌فلو (S-CTX-03) — فقط اسلات‌های موجود در CTX ─── */
E21.slotExtract=function(nn){
  var got=0,parts=[];
  var mb=nn.match(/([0-9]{1,2})\s*خواب/);
  if(mb){var b=+mb[1];if(b>=1&&b<=5&&!CTX.beds){CTX.beds=b;got++;parts.push('خواب: '+fa(b,0))}}
  var hs=hoodsIn(nn);
  if(hs.length===1&&!CTX.hood){CTX.hood=hs[0].id;got++;parts.push('محله: '+esc(hs[0].n))}
  var per=null;
  if(/خانواده/.test(nn))per='خانواده';
  else if(/دانشجو/.test(nn))per='دانشجو/کاری';
  else if(/دو نفر|زوج/.test(nn))per='دو نفره';
  else if(/موقت|کوتاه مدت/.test(nn))per='موقت';
  if(per&&!CTX.persona){CTX.persona=per;got++;parts.push('موقعیت: '+esc(per))}
  var re=/([0-9][0-9.,]*)\s*(میلیارد|میلیون|هزار)/g,mm;
  while((mm=re.exec(nn))){
    var frag=mm[0],before=nn.slice(Math.max(0,mm.index-26),mm.index),
        after=nn.slice(mm.index+mm[0].length,mm.index+mm[0].length+26),
        pm=parseMoneyFA(frag);
    if(!pm.ok)continue;
    var tag=null;
    if(/ودیعه|رهن/.test(before))tag='dep';
    else if(/اجاره/.test(before))tag='rent';
    else if(/بودجه|بخرم|خرید|سرمایه/.test(before))tag='budg';
    else if(/ودیعه|رهن/.test(after))tag='dep';
    else if(/اجاره/.test(after))tag='rent';
    else if(/بودجه|بخرم|خرید|سرمایه/.test(after))tag='budg';
    if(tag==='dep'&&!CTX.dep){CTX.dep=pm.value;got++;parts.push('ودیعه: '+rial(pm.value))}
    else if(tag==='rent'&&!CTX.rent){CTX.rent=pm.value;got++;parts.push('اجاره: '+rial(pm.value))}
    else if(tag==='budg'&&!CTX.budg){CTX.budg=pm.value;got++;parts.push('بودجه: '+rial(pm.value))}
  }
  if(/رزرو|اقامت|سفر|اجاره روزانه|ویلا/.test(nn)){
    var cities=['تهران','شیراز','رامسر','مشهد'],i;
    for(i=0;i<cities.length;i++){
      if(nn.indexOf(cities[i])>=0&&!CTX.city){CTX.city=cities[i];got++;parts.push('شهر: '+cities[i]);break}
    }
  }
  if(got>=2){
    botC('از پیام شما این‌ها را برداشتم: <b>'+parts.join(' • ')+'</b> — در شروع فلو به‌کار می‌رود و هرکدام را همان‌جا می‌توانید اصلاح کنید.'+
      rcActs([{l:'شروع اجاره با همین‌ها',a:'data-cf="rent"',p:1},{l:'شروع خرید',a:'data-cf="buy"'}])+
      rcNote('تا وقتی فلو شروع نشود چیزی ثبت نمی‌شود؛ این مقادیر فقط در همین گفت‌وگو خوانده می‌شوند.'),null);
  }
  return got;
};

/* ─── واگذاری هدایت‌شدهٔ اجارهٔ تضمینی (S-GRT-01) ───
   الگوی ۴ مرحله‌ای: توضیح (rcProg) → جمع دادهٔ حداقلی در گفت‌وگو → ناوبری با پیش‌پر (grtPrefill پیچیده‌شده) → خواندن وضعیت زنده در بازگشت (E21.maybeResume). */
E21.grtIntent=function(nn){return /تضمینی/.test(nn)&&/شروع|بسپار|بسهپار|ملک دارم|ثبت|واگذار/.test(nn)};
E21.grtNext=function(){
  var g=E21.grt;
  if(!g)return;
  if(!g.hood){
    g.await='hood';
    botC('برای شروع اجارهٔ تضمینی، ملک در کدام محله است؟'+rcActs(hoodChipsAct('اجاره تضمینی شروع'))+
      rcNote('کارمزد مدیریت '+fa(GRT_MGMT_PCT,0)+'٪ اجارهٔ ماهانه است؛ کل مسیر '+fa(WSTEPS.grt.length,0)+' مرحله‌ای در صفحهٔ اختصاصی پیش می‌رود و گفت‌وگو جای آن را نمی‌گیرد.'),null);
    return;
  }
  if(!g.area){
    g.await='area';
    botC('متراژ ملک حدوداً چند متر است؟ (عدد بگویید)',null);
    return;
  }
  if(g.exp===null){
    g.await='exp';
    botC('انتظار شما برای اجارهٔ ماهانه چقدر است؟ (اختیاری — «نمی‌دانم» هم می‌توانید بگویید)',null);
    return;
  }
  E21.grtPayload={hood:g.hood,area:g.area,exp:g.exp,from:'گفت‌وگوی دستیار'};
  CTX.hood=g.hood;
  E21.grt=null;
  botC('عالی. با این اطلاعات می‌رویم به صفحهٔ اجارهٔ تضمینی؛ ویزارد '+fa(WSTEPS.grt.length,0)+' مرحله‌ای همان‌جا پیش می‌رود و ملک شما با همین محله/متراژ پیش‌پر می‌شود.'+
    rcProg(WSTEPS.grt,0)+
    rcNote('پس از بازگشت به دستیار، وضعیت پروندهٔ شما را همین‌جا نشان می‌دهم.'),null);
  setTimeout(function(){
    try{go('grt');toast('پیش‌پر از گفت‌وگو در فرم ملک اعمال می‌شود')}catch(e){}
  },500);
};
E21.grtHandoff=function(){
  E21.grt={await:null,hood:null,area:null,exp:null};
  botC('اجارهٔ تضمینی یعنی واگذاری مدیریت اجارهٔ ملک به محلینو — مستأجر یافته می‌شود، قرارداد بسته می‌شود و اجاره‌بها با کارمزد '+fa(GRT_MGMT_PCT,0)+'٪ تضمین‌شده واریز می‌شود. چند دادهٔ کوتاه از شما می‌گیرم و بعد به صفحهٔ اختصاصی می‌رویم.',null);
  E21.grtNext();
};
/* چیپ «شروع اجارهٔ تضمینی» از پاسخ اطلاعاتی (scGrtInfo) حالا از مسیر هدایت‌شده می‌رود (QA-C/S-GRT-01) */
CBACT.grtGuided=function(){E21.grtHandoff()};
/* پیش‌پر از مسیر الگوی موجود grtPrefill — غیرمصرفی است چون V0.20 در رندرِ معرفیِ GRT هم
   grtPrefill() را صدا می‌زند (grtIntroHTML)؛ مصرفِ نهایی در grtNew انجام می‌شود (پیش‌پر واقعی فرم ملک). */
var _grtPrefill=grtPrefill;
grtPrefill=function(){
  var p=E21.grtPayload;
  if(p){
    return {from:p.from||'گفت‌وگوی دستیار',title:'',hood:p.hood||'',area:p.area||'',rooms:'',age:'',elev:false,park:false};
  }
  return _grtPrefill();
};
var _grtNew=grtNew;
grtNew=function(){
  var pf=E21.grtPayload;
  var e=_grtNew();
  if(pf)E21.grtPayload=null; /* پیش‌پر همین‌جا مصرف شد — فرم ملک با محله/متراژ گفت‌وگو ساخته شد */
  return e;
};

/* ─── واگذاری هدایت‌شدهٔ خدمات (S-SVC-01) ─── */
E21.svcIntent=function(nn){return /خدمات|نظافت|تعمیر|لوله کش|برق کار|پکیج|کولر|لباسشویی|نقاشی|کاشی|شست وشو|سفارش خدمت/.test(nn)};
E21.svcOrdersIntent=function(nn){return /سفارش های خدمت|سفارش هام|پیگیری سفارش/.test(nn)};
E21.svcItemPick=function(nn){
  var best=null,bs=0,ci,ii;
  for(ci=0;ci<SVCS.length;ci++){
    for(ii=0;ii<SVCS[ci].items.length;ii++){
      var itn=normFa(SVCS[ci].items[ii].n).split(' ').filter(function(w){return w.length>2}),sc=0,i;
      for(i=0;i<itn.length;i++){if(nn.indexOf(itn[i])>=0)sc++}
      if(sc>bs){bs=sc;best={ci:ci,ii:ii}}
    }
  }
  return bs>=1?best:null;
};
E21.svcNext=function(){
  var v=E21.svc;
  if(!v)return;
  var it=svcItem(v.ci,v.ii);
  if(!it){E21.svc=null;return}
  if(!v.date){
    v.await='date';
    botC('خدمت «'+esc(it.n)+'» — چه روزی؟'+rcActs([
      {l:'امروز',a:'data-cba="attSvcDate" data-v="امروز"'},
      {l:'فردا',a:'data-cba="attSvcDate" data-v="فردا"',p:1},
      {l:'پس‌فردا',a:'data-cba="attSvcDate" data-v="پس‌فردا"'}
    ])+'<div class="cwr-hint" style="margin-top:4px">یا تاریخ را تایپ کنید (امروز/فردا/پس‌فردا/جمعه).</div>',null);
    return;
  }
  if(!v.slot){
    v.await='slot';
    botC('بازهٔ ساعتی؟'+rcActs(['۸ تا ۱۰','۱۰ تا ۱۲','۱۲ تا ۱۴','۱۶ تا ۱۸','۱۸ تا ۲۰'].map(function(x){return {l:x,a:'data-cba="attSvcSlot" data-v="'+x+'"'}})),null);
    return;
  }
  if(!v.address){
    v.await='addr';
    botC('نشانی محل خدمت را بنویسید (کامل‌تر بنویسید تا در فرم درست پیش‌پر شود):',null);
    return;
  }
  E21.svcPF={date:v.date,slot:v.slot,address:v.address,notes:''};
  E21.svcHandoffAt=Date.now();
  botC('مودال سفارش را با همین اطلاعات پیش‌پر باز می‌کنم — قیمت‌گیری و پرداخت همان‌جا و از کیف پول انجام می‌شود.'+
    (svcIsDemo()?rcNote('در این نسخه سفارش‌ها نمایشی ثبت می‌شوند و به ارائه‌دهندهٔ واقعی ارسال نمی‌شوند.'):'')+
    rcNote('این فقط پیش‌پر فرم است؛ سفارش با «دریافت قیمت» و «پرداخت» داخل مودال ثبت می‌شود.'),null);
  var v2=E21.svc;
  E21.svc=null;
  setTimeout(function(){
    try{
      ACT.svcOpen({getAttribute:function(k){return k==='data-c'?String(v2.ci):(k==='data-i'?String(v2.ii):null)}});
    }catch(e){}
  },350);
};
CBACT.attSvcDate=function(el){if(E21.svc){E21.svc.date=el.getAttribute('data-v')||E21.iso(new Date(Date.now()+864e5));E21.svcNext()}};
CBACT.attSvcSlot=function(el){if(E21.svc){E21.svc.slot=el.getAttribute('data-v');E21.svcNext()}};
CBACT.attSvcCat=function(el){
  var ci=+el.getAttribute('data-ci'),c=SVCS[ci];
  if(!c)return;
  botC('خدمات «'+esc(c.t)+'» — کدام مورد؟'+rcActs(c.items.map(function(it,ii){return {l:it.n+' ('+svcPriceLabel(it)+')',a:'data-cba="attSvcItem" data-ci="'+ci+'" data-ii="'+ii+'"'}}))+
    rcActs([{l:'صفحهٔ خدمات (همهٔ دسته‌ها)',a:'data-view="svc"'}]),null);
};
CBACT.attSvcItem=function(el){
  var ci=+el.getAttribute('data-ci'),ii=+el.getAttribute('data-ii');
  if(!svcItem(ci,ii))return;
  E21.svc={ci:ci,ii:ii,date:null,slot:null,address:null,await:null};
  E21.svcNext();
};
CBACT.attSvcIntro=function(){E21.svcHandoffStart(null)};
E21.svcHandoffStart=function(pick){
  if(!pick){
    botC('خدمات ملک — دسته‌ها را انتخاب کنید؛ اطلاعات سفارش را همین‌جا جمع می‌کنم و مودال سفارش را پیش‌پر باز می‌کنم (قیمت و پرداخت در مودال، از کیف پول):'+
      rcActs(SVCS.map(function(c,ci){return {l:c.t,a:'data-cba="attSvcCat" data-ci="'+ci+'"'}}))+
      rcActs([{l:'صفحهٔ خدمات',a:'data-view="svc"',p:1}]),null);
    return;
  }
  E21.svc={ci:pick.ci,ii:pick.ii,date:null,slot:null,address:null,await:null};
  E21.svcNext();
};
E21.svcHandoff=function(nn){
  if(E21.svcOrdersIntent(nn)){E21.svcOrdersSummary();return}
  var pick=E21.svcItemPick(nn);
  E21.svcHandoffStart(pick);
};
E21.svcOrdersSummary=function(){
  var orders=S.svcOrders||[];
  if(!orders.length){
    botC('تا الان سفارش خدمتی ثبت نکرده‌اید. از دسته‌ها شروع کنید:'+rcActs([{l:'شروع سفارش خدمت',a:'data-cba="attSvcIntro"',p:1}]),null);
    return;
  }
  var o=orders[0];
  botC('آخرین سفارش خدمت شما:'+rcards([
    rcard('خدمت',esc(o.title)),
    rcard('وضعیت',esc(svcStatusMeta(o.status).l)+(o.demo?' (نمایشی)':'')),
    rcard('زمان',esc(faDate(o.date))+' • '+esc(o.slot)),
    rcard('مبلغ',rial(o.amount))
  ])+
  (orders.length>1?rcNote('مجموع '+fa(orders.length,0)+' سفارش — فهرست کامل در صفحهٔ خدمات.'):'')+
  rcActs([
    {l:'پیگیری همین سفارش',a:'data-act="svcReqOpen" data-id="'+qesc(o.id)+'"',p:1},
    {l:'سفارش جدید',a:'data-cba="attSvcIntro"'}
  ]),null);
};
/* پیش‌پر مودال سفارش — امضای ACT.svcOpen با پیچاندن گسترده می‌شود؛ موتور مودال همان است */
var _svcOpen=ACT.svcOpen;
ACT.svcOpen=function(el){
  var pf=E21.svcPF;
  var ci=el&&el.getAttribute?+el.getAttribute('data-c'):NaN,
      ii=el&&el.getAttribute?+el.getAttribute('data-i'):NaN;
  if(pf&&!isNaN(ci)&&!isNaN(ii)){
    E21.svcPF=null;
    var html=svcOrderFormHTML(ci,ii);
    if(html){
      openModal(html);
      setTimeout(function(){
        var d=document.getElementById('so-date'),a=document.getElementById('so-addr'),
            s=document.getElementById('so-slot'),n=document.getElementById('so-notes');
        if(d&&pf.date)d.value=pf.date;
        if(s&&pf.slot)s.value=pf.slot;
        if(a&&pf.address)a.value=pf.address;
        if(n&&pf.notes)n.value=pf.notes;
        toast('پیش‌پر از گفت‌وگو اعمال شد — بازبینی کنید');
      },30);
      return;
    }
  }
  _svcOpen(el);
};

/* ─── واگذاری هدایت‌شدهٔ نقشه/ثبت مکان (S-MAP-01) — «نقشه» تنها مثل قبل سریع به صفحه می‌رود ─── */
E21.mapIntent=function(nn){
  if(/فاصله/.test(nn)&&/نشان|نشون|بده|ببین/.test(nn))return true;
  return (/محل کار|مدرسه|خانواده|والدین/.test(nn))&&/ثبت|علامت|اضافه|تعیین/.test(nn);
};
E21.mapHandoff=function(nn){
  if(/فاصله/.test(nn)){
    var Dw=wfData('rent')||wfData('buy'),lid=Dw?(Dw.listing||Dw.blist):null;
    if(lid){var x=findL(lid);botC('فاصلهٔ «'+esc(x.t)+'» تا مکان‌های ثبت‌شدهٔ شما — هوایی، نه مسیر واقعی:'+placesHTML(x.hood,8)+rcNote('فاصله‌ها هوایی — OSM.'),null)}
    else{botC('برای نمایش فاصله‌ها، اول در فلو اجاره/خرید یک ملک «انتخاب» کنید، یا مکان مهم خود را ثبت کنید:'+rcActs([{l:'ثبت مکان مهم',a:'data-cba="attMapAny"',p:1}]),null)}
    return;
  }
  var kind=null,label='';
  if(/محل کار/.test(nn)){kind='work';label='محل کار'}
  else if(/مدرسه/.test(nn)){kind='school';label='مدرسه'}
  else if(/خانواده|والدین/.test(nn)){kind='family';label='خانهٔ خانواده'}
  if(!kind)return;
  var hid=hoodFromText(nn);
  if(hid){
    var h=findH(hid);
    upsertPlace(kind,label,h.ll,hid,kind==='work'?1:2);
    botC('«'+esc(label)+'» در محلهٔ '+esc(h.n)+' ثبت شد؛ فاصله‌های املاک به‌روز شد (فاصله‌ها هوایی — OSM).',null);
    return;
  }
  openPlaceModal({id:null,kind:kind,label:label,ll:null,hood:null,prio:kind==='work'?1:2});
  botC('فرم ثبت «'+esc(label)+'» را باز کردم — عنوان پر شده؛ موقعیت را روی نقشه یا با انتخاب محله کامل کنید.',null);
};
CBACT.attMapAny=function(){
  openPlaceModal({id:null,kind:'other',label:'',ll:null,hood:null,prio:2});
};

/* ─── توزیع آگهی‌ها (S-ANALY-06) — از دادهٔ نمونهٔ موجود RLIST ─── */
RINT.scDist=function(q){
  var hs=hoodsIn(q||''),list=RLIST;
  if(hs.length===1)list=RLIST.filter(function(x){return x.hood===hs[0].id});
  if(!list.length)list=RLIST;
  var b={'۱ خواب':0,'۲ خواب':0,'۳ خواب و بیشتر':0},a={'نوساز (۰–۵ سال)':0,'۶ تا ۱۵ سال':0,'۱۶ سال و بیشتر':0};
  list.forEach(function(x){
    if(x.beds<=1)b['۱ خواب']++;else if(x.beds===2)b['۲ خواب']++;else b['۳ خواب و بیشتر']++;
    if(x.age<=5)a['نوساز (۰–۵ سال)']++;else if(x.age<=15)a['۶ تا ۱۵ سال']++;else a['۱۶ سال و بیشتر']++;
  });
  var toParts=function(o){return Object.keys(o).map(function(k){return {l:k,v:o[k]}}).filter(function(p){return p.v>0})};
  var pb=toParts(b),pa=toParts(a);
  if(!pb.length&&!pa.length){botC('داده‌ای برای توزیع نیست.',null);return}
  botC('توزیع آگهی‌ها'+(hs.length===1?' محلهٔ «'+esc(hs[0].n)+'»':'')+' — بر پایهٔ آگهی‌های نمونهٔ سامانه:'+
    (pb.length?rcDonut('توزیع بر اساس تعداد خواب',pb):'')+
    (pa.length?rcDonut('توزیع بر اساس عمر بنا',pa):'')+
    rcNote('توزیع در آگهی‌های نمونهٔ سامانه ('+fa(list.length,0)+' آگهی) — آمار رسمی بازار نیست. مبنای قیمت‌ها: آگهی نه معامله — منبع: کیلید.')+
    rcActs([{l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"',p:1},{l:'شروع اجاره',a:'data-cf="rent"'}]),null);
};

/* ─── پرسش «برگردیم به کار قبلی؟» پس از ناوبری (S-CTX-01 شاخهٔ go، ادامهٔ واگذاری‌ها) ─── */
E21.maybeResume=function(){
  if(!E21.resumeAsk)return;
  E21.resumeAsk=false;
  var bits='',chips=[],g=null;
  if(CE.f&&CE.f!=='gate'&&SCRIPTS[CE.f]){
    var n=SCRIPTS[CE.f].length;
    bits+='فلو «'+esc(MODBY[CE.f]?MODBY[CE.f].t:CE.f)+'» در گام '+fa(Math.min(CE.i+1,n),0)+' از '+fa(n,0)+' زنده است. ';
    chips.push(['↩ ادامهٔ فلو','!re']);
  }
  try{g=grtCur()}catch(e){}
  if(g){
    bits+='پروندهٔ اجارهٔ تضمینی شما: «'+esc(grtStatusText(g))+'». ';
    chips.push(['پروندهٔ اجارهٔ تضمینی','F:grt']);
  }
  if(E21.svcHandoffAt&&(S.svcOrders||[]).length&&S.svcOrders[0].t&&S.svcOrders[0].t>E21.svcHandoffAt){
    bits+='سفارش خدمت شما ثبت شد («'+esc(S.svcOrders[0].title)+'» — '+esc(svcStatusMeta(S.svcOrders[0].status).l)+'). ';
    chips.push(['پیگیری سفارش خدمت','!svc']);
  }
  if(bits&&chips.length){
    botC('برگردیم به کار قبلی؟ '+bits+rcNote('مسیر صفحه‌ای مرجع است؛ گفت‌وگو فقط وضعیت زنده را می‌خواند.'),chips);
  }
};
var _go=go;
go=function(v){
  _go(v);
  try{
    if(CE.f&&CE.f!=='gate'&&v!=='landing'&&v!=='auth')E21.resumeAsk=true;
  }catch(e){}
};
var _toggleF=toggleF;
toggleF=function(v,skipGate){
  _toggleF(v,skipGate);
  try{if(v)E21.maybeResume()}catch(e){}
};
var _vLanding=VIEWS.landing;
VIEWS.landing=function(){
  _vLanding();
  try{E21.maybeResume()}catch(e){}
};

/* ─── پیچاندن ceVal: پیشوندهای جدید !re و !back (S-CTX-01) + مسیر چیپ‌های متنی بی‌فلو ─── */
var _ceVal=ceVal;
ceVal=function(v){
  v=String(v==null?'':v);
  if(v==='!re'){
    if(CE.f&&SCRIPTS[CE.f]){ceStep()}
    else{botC('فعلاً فلو فعالی در گفت‌وگو باز نیست؛ از منو یک مسیر را شروع کنید.',[['منوی اصلی','!menu']])}
    return;
  }
  if(v==='!back'){
    if(CE.f&&CE.hist&&CE.hist.length)ceBack();
    return;
  }
  if(!CE.f&&v&&v.charAt(0)!=='!'&&v.indexOf('F:')!==0){
    /* چیپ‌های متنی جدید (توزیع آگهی‌ها، جمع‌بندی و…) وقتی فلو فعال نیست — همان مسیر ceSend */
    E21.chipUsr=true;
    try{ceSend(v)}finally{E21.chipUsr=false}
    return;
  }
  _ceVal(v);
};

/* ─── پیچاندن RINT.route: افزودن «چنده/چقدره» به واژگان بازار (S-CTX-05) ─── */
var _rintRoute=RINT.route;
RINT.route=function(t){
  var q=normFa(t);
  if(/(چنده|چقدره|نرخش|قیمتش)/.test(q)&&hoodsIn(q).length===1){RINT.scMarket(q);return true}
  return _rintRoute(t);
};
/* ─── گسترش صادقانهٔ چیپ‌های پاسخ OOS (سطر ۲۰ §۱ + کشف‌پذیری !re/بازگشت) ─── */
var _scOOS=RINT.scOOS;
RINT.scOOS=function(q){
  _scOOS(q);
  try{
    var chips=[];
    if(CE.f&&SCRIPTS[CE.f])chips.push(['↩ ادامهٔ فلو','!re']);
    else chips.push(['توزیع آگهی‌ها','توزیع آگهی‌ها'],['جمع‌بندی من','جمع‌بندی من']);
    if(chips.length)E21.appendLastChips(chips);
  }catch(e){}
};

/* ─── پیچاندن ceSend: پیش‌پردازش زمینه + بازگرداندن متن اصلی کاربر به تاریخچه ─── */
E21.preSend=function(raw){
  var q=String(raw==null?'':raw).replace(/^\s+|\s+$/g,'');
  if(!q)return false;
  if(q==='!re'||q==='↩ ادامهٔ فلو'){
    if(!E21.chipUsr)usrC(q);
    if(CE.f&&SCRIPTS[CE.f])ceStep();
    else botC('فعلاً فلو فعالی در گفت‌وگو باز نیست؛ از منو یک مسیر را شروع کنید.',[['منوی اصلی','!menu']]);
    return true;
  }
  var nt=E21.enNorm(q),nn=normFa(nt);
  /* جمع‌بندی (S-CMP-03) */
  if(/جمع بندی|خلاصه فلو|خلاصه وضعیت/.test(nn)||(/خلاصه/.test(nn)&&/فلو|کار|وضعیت/.test(nn))){
    if(!E21.chipUsr)usrC(q);
    E21.scSummary();
    if(CE.f&&SCRIPTS[CE.f])E21.appendReturnChips();
    return true;
  }
  /* توزیع آگهی‌ها (S-ANALY-06) — چیپ موجود scMarket از این مسیر زنده می‌شود */
  if(/توزیع آگهی/.test(nn)){
    if(!E21.chipUsr)usrC(q);
    RINT.scDist(nt);
    if(CE.f&&SCRIPTS[CE.f])E21.appendReturnChips();
    return true;
  }
  /* واگذاری‌های هدایت‌شده و مینی‌جریان‌هایشان — فقط وقتی فلو گفت‌وگویی واقعی فعال نیست (gate هم بی‌فلو شمرده می‌شود) */
  if(E21.noFlow()){
    if(E21.grt&&E21.grt.await){
      if(!E21.chipUsr)usrC(q);
      var g=E21.grt;
      if(g.await==='hood'){var hs=hoodsIn(nn);if(hs.length)g.hood=hs[0].id}
      else if(g.await==='area'){var pcA=parseCountFA(nn);if(pcA.ok&&pcA.value>0)g.area=pcA.value}
      else if(g.await==='exp'){
        if(/نمی دانم|نمیدانم|فرقی ندارد|مهم نیست/.test(nn))g.exp='—';
        else{var pmE=parseMoneyFA(RINT.moneyOf(nn)||nn);g.exp=pmE.ok?pmE.value:'—'}
      }
      E21.grtNext();
      return true;
    }
    if(E21.svc&&E21.svc.await){
      if(!E21.chipUsr)usrC(q);
      var s=E21.svc;
      if(s.await==='date'){
        var dd=E21.dateFromText(nn);
        if(dd){s.date=dd}
        else{s.date=svcDefaultDate();botC('تاریخ از پیام شما خوانده نشد؛ پیش‌فرض «فردا» گذاشته شد — داخل مودال قابل اصلاح است.',null)}
      }
      else if(s.await==='slot'){s.slot=nn.replace(/\s+/g,' ').slice(0,40)}
      else if(s.await==='addr'){
        if(nn.replace(/\s+/g,' ').length>=8){s.address=nn}
        else{botC('نشانی کوتاه است؛ کامل‌تر بنویسید (مثلاً «تهران، ولنجک، خیابان …، پلاک ۱۲»).',null);return true}
      }
      E21.svcNext();
      return true;
    }
    if(E21.grtIntent(nn)){
      if(!E21.chipUsr)usrC(q);
      E21.grtHandoff();
      return true;
    }
    if(E21.svcIntent(nn)){
      if(!E21.chipUsr)usrC(q);
      E21.svcHandoff(nn);
      return true;
    }
    if(E21.mapIntent(nn)){
      if(!E21.chipUsr)usrC(q);
      E21.mapHandoff(nn);
      return true;
    }
  }
  /* وقفهٔ میانهٔ فلو (S-CTX-01) */
  if(CE.f&&CE.f!=='gate'){
    var sc=SCRIPTS[CE.f],st=sc?sc[CE.i]:null;
    if(st&&(st.money||st.count||st.range||st.moneyRange||st.kind==='num')){
      var ok=E21.stepParseOk(st,nt);
      if(!ok&&E21.routeLooksLikely(nn)){
        if(!E21.chipUsr)usrC(q);
        if(RINT.route(nt)){E21.appendReturnChips();return true}
        if(!E21.chipUsr){HIST.pop();cr()} /* نیت بود اما مسیری پیدا نشد — نمایش به ceSend اصلی واگذار می‌شود */
      }
    }else if(st&&st.kind==='text'&&!st.until&&!st.loop&&!E21.forceRoute){
      if(E21.STRONG.test(nn)&&!E21.chipExact(st,nt)){
        if(!E21.chipUsr)usrC(q);
        E21.clr=q;
        botC('این پیام شبیه پرسش تازه است، نه پاسخ همین مرحله. کدام باشد؟'+
          rcActs([{l:'پاسخ همین مرحله باشد',a:'data-cba="attAns"',p:1},{l:'پرسش تازه',a:'data-cba="attAsk"'}])+
          rcNote('گام‌های تکرارشونده (مثل «اولویت شخصی») هرگز به‌طور خودکار قطع نمی‌شوند.'),null);
        return true;
      }
    }
    /* اصلاح میانهٔ فلو (S-CTX-02) — اجرا پس از نمایش پیام کاربر */
    var c=E21.corr(nn);
    if(c){
      if(!E21.chipUsr)usrC(q);
      botC(c.msg,null);
      if(c.sid)ceJump(c.sid);
      return true;
    }
  }
  /* استخراج چنداسلاتی (S-CTX-03) — بیرون فلو یا در منوی خوش‌آمد (gate) */
  if(E21.noFlow())E21.slotExtract(nn);
  return false;
};
E21.postSend=function(){
  var last=HIST[HIST.length-1];
  if(last&&last.r==='bot'&&String(last.h).indexOf('این را دقیق متوجه نشدم')===0){
    var chips=[];
    if(CE.f&&SCRIPTS[CE.f])chips.push(['↩ ادامهٔ فلو','!re']);
    else chips.push(['توزیع آگهی‌ها','توزیع آگهی‌ها'],['جمع‌بندی','جمع‌بندی']);
    if(chips.length){last.c=(last.c||[]).concat(chips);cr()}
  }
};
E21.restoreUserText=function(nt,raw){
  var i,want=esc(nt);
  for(i=HIST.length-1;i>=0;i--){
    if(HIST[i].r==='user'){
      if(HIST[i].h===want)HIST[i].h=esc(raw);
      break;
    }
  }
};
var _ceSend=ceSend;
ceSend=function(t0){
  var t=String(t0==null?'':t0);
  if(E21.preSend(t))return;
  var tt=t.replace(/^\s+|\s+$/g,'');
  var nt=E21.enNorm(tt);
  if(nt!==tt){
    _ceSend(nt);
    try{E21.restoreUserText(nt,tt)}catch(e){}
    try{E21.postSend()}catch(e){}
    return;
  }
  _ceSend(t);
  try{E21.postSend()}catch(e){}
};
CBACT.attAns=function(){
  var t=E21.clr;
  E21.clr=null;
  if(!t||!CE.f)return;
  ceVal(t,t);
};
CBACT.attAsk=function(){
  var t=E21.clr;
  E21.clr=null;
  if(!t)return;
  E21.forceRoute=true;
  try{ceSend(t)}finally{E21.forceRoute=false}
};

/* ─── پیچاندن ACT.chatNew: آزادسازی همهٔ blobها و سینی‌ها (S-ATT، حالت reset §۳) ─── */
var _chatNew=ACT.chatNew;
ACT.chatNew=function(){
  E21.revokeAll();
  E21.grt=null;E21.grtPayload=null;E21.svc=null;E21.svcPF=null;E21.clr=null;
  E21.lastAttNames=null;E21.resumeAsk=false;
  _chatNew();
};

/* ─── شنیدهٔ سپرده‌شدهٔ خودمان: نمایشگر تصویر، پرش‌های جمع‌بندی (data-cj) و Escape ───
   بلاک سپرده‌شدهٔ موجود (~۷۹۵۷) دست‌نخورده می‌ماند. */
document.addEventListener('click',function(e){
  var t=e.target;
  if(!t||!t.closest)return;
  if(t.closest('#attViewer')){E21.closeViewer();return}
  if(t.closest('[data-cba],[data-cv],[data-cq],[data-cf],[data-act],[data-view],[data-w],[data-jump]'))return;
  var cj=t.closest('[data-cj]');
  if(cj){ceJump(cj.getAttribute('data-cj'));return}
  var im=t.closest('img[data-att-view]');
  if(im&&im.getAttribute('src')){E21.openViewer(im.getAttribute('src'),im.getAttribute('alt')||'');return}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var v=document.getElementById('attViewer');
    if(v&&v.classList.contains('on'))E21.closeViewer();
    return;
  }
  /* دسترس‌پذیری: فعال‌سازی عناصر role=button با Enter/Space (QA-U) — ورودی‌های متنی دست‌نخورده می‌مانند */
  if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){
    var t=e.target;
    if(!t||!t.closest||t.tagName==='TEXTAREA'||t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='BUTTON'||t.tagName==='A')return;
    var rb=t.closest('[role="button"]');
    if(rb&&rb.getAttribute('tabindex')!==null){
      e.preventDefault();
      rb.click();
    }
  }
});

/* ─── شروع: نمایشگر تصویر آماده باشد ─── */
try{E21.ensureViewer()}catch(e){}
/* ═══ پایان بخش Agent E ═══ */
