/* ═══ ۹) صفحهٔ اصلی / فرود / ورود ═══ */
/* V0.27: صفحهٔ اصلی مستقل حذف شد — همهٔ مسیرها از منوی گفت‌وگویی (gate) شروع می‌شوند */
VIEWS.home=function(){var el=document.getElementById('v-home');if(el)el.innerHTML='';};
/* V0.27 — فضای کاری گفت‌وگو: تنها نمای اصلی؛ یک کامپوزر واحد */
VIEWS.landing=function(){
  var el=document.getElementById('v-landing');
  el.innerHTML='<div class="ch ch-main">'+
  '<div class="ch-h"><span class="av" aria-hidden="true">'+ico('chat',18)+'</span><div class="chttl"><b>دستیار محلینو</b><small>همهٔ قابلیت‌ها در همین گفت‌وگو</small></div><button class="e27-expand" data-act="sideFold" aria-label="نمایش سایدبار">☰ سایدبار</button><button class="hbtn" data-act="chatNew">گفت‌وگوی جدید</button></div>'+
  '<div class="cstep" id="landingStep" hidden><span id="landingStepTxt"></span><span class="bar"><i id="landingStepBar"></i></span></div>'+
  '<div class="csum" id="landingSum" hidden><span id="landingSumTxt"></span><button class="hbtn" data-act="chatBack">ویرایش پاسخ</button></div>'+
  '<div class="ch-b" id="chatB" aria-live="polite"></div>'+
  '<div class="chat-sugg" id="chatSugg" aria-label="پیشنهادهای دستیار"></div>'+
  '<div class="cwr" id="chatCwr"><div class="cwr-prev" id="chatPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="chatAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="chatIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="chatSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="chatFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+
  '</div>';
  cr();
  var s=document.getElementById('chatSend');
  if(s){s.onclick=function(){var i=document.getElementById('chatIn');if(!i)return;ceSendWithAtt(i.value,'chat');i.value=''}}
  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){if(e.isComposing||e.keyCode===22)return;e.preventDefault();s.onclick()}})}
  attInit('chat');
  if(!HIST.length){ceStartGate()}else{cr()}
};
var FCHAT={open:false}; /* V0.27: چت شناور حذف شد — سازگاری برای فراخوانی‌های باقی‌مانده */
function toggleF(v,skipGate){
  FCHAT.open=false;
  if(v&&CURRENT!=='landing'){go('landing')}
};
VIEWS.auth=function(){
  var el=document.getElementById('v-auth'),h='<div class="card"><div class="ct">ورود / ثبت‌نام</div>';
  if(APH===0){
    h+='<p class="note">با شمارهٔ موبایل وارد شوید</p>'+
    '<div class="srow"><div class="slab"><span>موبایل</span></div><input class="inp" id="au-phone" aria-label="شمارهٔ موبایل" placeholder="0912..." style="direction:ltr;text-align:left" value="'+APH_PHONE+'"></div>'+
    '<button class="btn btn-primary" data-act="auSend">دریافت کد</button> <button class="btn" data-act="auQuick">ورود سریع</button>';
  }else if(APH===1){
    h+='<p class="note">کد ورود نمایشی را وارد کنید: <b>1234</b></p>'+
    '<input class="inp" id="au-otp" aria-label="کد تأیید" placeholder="1234" style="direction:ltr;text-align:center;letter-spacing:6px">'+
    '<div style="margin-top:12px"><button class="btn btn-primary" data-act="auCheck">تأیید</button> <button class="btn" data-act="auBack">اصلاح</button></div>';
  }else{
    h+='<p class="note">نام خود را وارد کنید:</p>'+
    '<input class="inp" id="au-name" aria-label="نام و نام خانوادگی" placeholder="نام و نام‌خانوادگی">'+
    '<div style="margin-top:12px"><button class="btn btn-primary" data-act="auDone">ورود</button></div>';
  }
  el.innerHTML=h+'</div>';
  var p=document.getElementById('au-phone');
  if(p){p.addEventListener('keydown',function(e){if(e.key==='Enter'){ACT.auSend()}})}
  var o=document.getElementById('au-otp');
  if(o){o.addEventListener('keydown',function(e){if(e.key==='Enter'){ACT.auCheck()}})}
  var n=document.getElementById('au-name');
  if(n){n.addEventListener('keydown',function(e){if(e.key==='Enter'){ACT.auDone()}})}
};
var APH=0,APH_PHONE='';
function doLogin(name){
  S.auth={name:name,phone:APH_PHONE||'09120000000',t:Date.now()};
  if(!S.welcomed){S.tokens=500;S.welcomed=true;S.log.unshift({t:Date.now(),d:'هدیهٔ خوش‌آمدگویی',c:500,cat:'sub'})}
  var p=S.pending||'landing';
  S.pending=null;save();
  toast('خوش آمدید '+name+'! ۵۰۰ کلید هدیه');
  go(p);
}

/* ═══ ۱۰) داشبورد ═══ */
var CATL={rent:'اجاره',buy:'خرید',invr:'درآمد',mkt:'پروژه‌ها',build:'ساخت',stay:'اقامتگاه',grt:'اجاره تضمینی',svc:'خدمات',sub:'اشتراک'};
/* V0.27: داشبورد و چت داکِ آن حذف شد — درخواست‌ها با E27.reqModal در گفت‌وگو باز می‌شوند */

/* ═══ ۱۱) اجاره ═══ */
function doRentVisit(){
  var d=wd('rent'),D=d.data;
  if(D.visitDay){return true}
  if(!D.vday||!D.vtime){toast('روز و ساعت را انتخاب کنید');return false}
  var x=findL(D.listing);
  if(!spend('visit','rent','بازدید: '+x.t))return false;
  D.visitDay=true;
  var rid=addReq('rent','بازدید','بازدید '+x.t+' — '+D.vday+' '+D.vtime,'در انتظار','فرم هوشمند فعال');
  save();
  setTimeout(function(){
    setReq(rid,'تأیید شد');
    toast('مالک تأیید کرد ✓');
    if(CURRENT==='rent'||CURRENT==='dash')renderCurrent();
  },2500);
  renderCurrent();
  return true;
}
