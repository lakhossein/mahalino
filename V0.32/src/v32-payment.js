E30.pay=(function(){
  var STATES=['idle','selected','priced','presented','awaiting_confirm','confirmed','validating','processing','paid','executing','completed','declined','insufficient','failed','refunded'];
  function sess(){if(!S.paySession)S.paySession=null;return S.paySession}
  function set(st){var s=sess();if(s){s.state=st;s.ts=Date.now();return save()}return false}
  function clear(){S.paySession=null;save()}
  function validService(key){return Object.prototype.hasOwnProperty.call(E30.PRICING,key)&&
    Number.isFinite(E30.PRICING[key].cost)&&E30.PRICING[key].cost>0}

  /* invalidate every rendered confirm card that is not the live session */
  function invalidateOthers(payId){
    try{
      var i,dead=0;
      for(i=0;i<HIST.length;i++){
        var m=HIST[i];
        if(m&&m.r==='bot'&&m.h&&m.h.indexOf('data-pay="')>=0&&m.h.indexOf('data-pay="'+payId+'"')<0&&m.h.indexOf('e30pay-stale')<0){
          m.h=m.h.replace(/<div class="e30-paycard">([\s\S]*?)<div class="qr">[\s\S]*?<\/div><\/div>/,'<div class="e30-paycard e30pay-stale"><div class="pt">کارت تأیید منقضی شد</div><div class="pr"><span>وضعیت</span><b>این کارت جای خود را به کارت تازه داد — دوباره همان سرویس را انتخاب کنید.</b></div></div>');
          dead++;
        }
      }
      if(dead)cr();
    }catch(e){console.error('E30 invalidate',e)}
  }

  /* where does the card go? chat bubble when chat is the visible surface, else modal */
  function target(){
    var c=document.getElementById('chatB');
    return (c&&c.offsetParent&&CURRENT==='landing')?'chat':'modal';
  }

  function cardHTML(s,extra){
    var p=E30.PRICING[s.key]||{},bal=S.tokens||0,cost=s.cost;
    return '<div class="e30-paycard" data-pay="'+qesc(s.payId)+'">'+
      '<div class="pt">'+(extra&&extra.icon?extra.icon:'')+' تأیید پرداخت سرویس</div>'+
      '<div class="pr"><span>سرویس</span><b>'+esc(s.title||p.label||s.key)+'</b></div>'+
      (s.desc?'<div class="pr"><span>شرح</span><b>'+esc(s.desc)+'</b></div>':'')+
      (s.ctx?'<div class="pr"><span>موضوع</span><b>'+esc(s.ctx)+'</b></div>':'')+
      '<div class="pr"><span>هزینه</span><b>'+fa(cost,0)+' کلید</b></div>'+
      '<div class="pr"><span>موجودی فعلی</span><b>'+fa(bal,0)+' کلید</b></div>'+
      '<div class="pr"><span>موجودی پس از پرداخت</span><b>'+fa(Math.max(0,bal-cost),0)+' کلید</b></div>'+
      '<div class="pr"><span>گیرندهٔ پرداخت</span><b>سامانهٔ محلینو (اعتبار کلید)</b></div>'+
      (extra&&extra.note?'<div class="e30-note">'+extra.note+'</div>':'')+
      '<div class="qr">'+
      '<button data-paygo="'+qesc(s.payId)+'">'+fa(cost,0)+' کلید پرداخت و اجرا</button>'+
      '<button data-paycancel="'+qesc(s.payId)+'">انصراف</button>'+
      '</div></div>';
  }

  /* ── entry: service selected → priced → presented (§11.2 states 1–4) ── */
  function begin(spec){
    /* spec={key,title,desc,ctx,onConfirm,note,source} */
    spec=spec||{};
    var key=spec.key,cost=E30.price(key);
    if(!validService(key)){
      toast('تعرفهٔ معتبر برای این خدمت تعریف نشده است — پرداخت آغاز نشد');
      return false;
    }
    /* A paid service must have a real execution path. Displaying a confirmation
       with no executable service is misleading, even if the balance is ample. */
    if(typeof spec.onConfirm!=='function'){
      toast('اجرای این خدمت فعلاً آماده نیست؛ هیچ کلیدی کسر نمی‌شود');
      return false;
    }
    var prev=sess();
    /* supersede any live session honestly (old card gets invalidated) */
    if(prev&&prev.payId){if(prev.state==='processing'||prev.state==='paid'||prev.state==='executing'){toast('یک پرداخت دیگر در حال انجام است — لطفاً صبر کنید');return false}invalidateIfNeeded(prev)}
    var s={payId:E30.uid('PAY'),key:key,cost:cost,title:spec.title||E30.label(key),desc:spec.desc||'',ctx:spec.ctx||'',state:'selected',ts:Date.now(),source:spec.source||'',executed:false,paidFlag:false};
    s._cb=spec.onConfirm; /* kept in memory only — not serializable; reload path handled by recover() */
    S.paySession=s;
    set('priced');
    if((S.tokens||0)<cost){
      /* validating → insufficient — nothing deducted */
      set('insufficient');
      var bal=S.tokens||0;
      var h='<div class="e30-paycard e30-paybad" data-pay="'+qesc(s.payId)+'">'+
        '<div class="pt">موجودی کلید کافی نیست</div>'+
        '<div class="pr"><span>سرویس</span><b>'+esc(s.title)+'</b></div>'+
        '<div class="pr"><span>هزینهٔ لازم</span><b>'+fa(cost,0)+' کلید</b></div>'+
        '<div class="pr"><span>موجودی شما</span><b>'+fa(bal,0)+' کلید</b></div>'+
        '<div class="qr"><button data-view="sub">شارژ کلید</button><button data-paycancel="'+qesc(s.payId)+'">بستن</button></div></div>';
      show(s,h,'insufficient');
      return false;
    }
    set('presented');
    show(s,cardHTML(s,{note:spec.note}),null);
    return true;
  }
  function invalidateIfNeeded(prev){
    try{invalidateOthers(prev.payId)}catch(e){}
  }

  function show(s,h,kind){
    invalidateOthers(s.payId);
    if(target()==='chat'&&!kind){botC(h,null)}
    else{openModal(h)}
    try{E29.bus.emit('pay.presented',{payId:s.payId,key:s.key,cost:s.cost,state:s.state})}catch(e){}
  }

  /* ── explicit confirm → validating → processing → paid → executing → completed ── */
  function go(payId){
    var s=sess();
    if(!s||s.payId!==payId){toast('این کارت تأیید دیگر معتبر نیست — سرویس را دوباره انتخاب کنید');return false}
    if(s.state!=='presented'){
      if(s.state==='processing'||s.state==='paid'||s.state==='executing'){toast('این پرداخت در حال انجام است');return false}
      if(s.state==='completed'){toast('این پرداخت قبلاً انجام شده است');return false}
      toast('این کارت تأیید معتبر نیست');return false;
    }
    if(!set('validating')){toast('پرداخت انجام نشد؛ ذخیره‌سازی در دسترس نیست.');return false}
    /* A reload serializes the session but cannot serialize its callback. Check
       BEFORE any mutation; the previously presented card is now obsolete. */
    if(typeof s._cb!=='function'||!validService(s.key)||s.cost!==E30.price(s.key)){
      set('failed');
      toast('خدمت اجرایی معتبر نیست — پرداخت انجام نشد');
      return false;
    }
    if((S.tokens||0)<s.cost){set('insufficient');toast('موجودی در فاصلهٔ تأیید تغییر کرد — لطفاً دوباره تلاش کنید');begin({key:s.key,title:s.title,desc:s.desc,ctx:s.ctx,onConfirm:s._cb});return false}
    if(!set('processing')){toast('پرداخت انجام نشد؛ ذخیره‌سازی در دسترس نیست.');return false}
    var btns=document.querySelectorAll('[data-paygo="'+payId+'"]');
    Array.prototype.forEach.call(btns,function(b){b.disabled=true;b.textContent='در حال پردازش…'});
    /* Mutate idempotency flag, transaction record and balance as ONE persisted
       state. A page reload must never see a paid flag without its debit. */
    if(s.paidFlag){set('failed');toast('پرداخت تکراری مسدود شد');return false}
    var txn=E30.uid('TXN');
    s.txnId=txn;s.paidFlag=true;
    S.tokens-=s.cost;
    S.log.unshift({t:Date.now(),d:(s.title)+(s.ctx?' — '+s.ctx:''),c:-s.cost,cat:'bana',id:txn,svc:s.key,payId:s.payId});
    if(!save()){S.tokens+=s.cost;S.log.shift();s.paidFlag=false;delete s.txnId;s.state='failed';renderTok();toast('پرداخت ثبت نشد؛ خدمت اجرا نشد.');return false}
    renderTok();
    try{E29.bus.emit('token.deduct',{txn:txn,cost:s.cost,svc:s.key,desc:s.title,payId:s.payId})}catch(e){}
    if((S.tokens||0)<30){try{E29.bus.emit('wallet.low',{balance:S.tokens})}catch(e){}}
    set('paid');
    usrC('پرداخت '+fa(s.cost,0)+' کلید برای «'+s.title+'»');
    set('executing');
    function finish(ok,err){
      /* The only definitive post-payment states are completed with an actual
         successful callback, or refunded with a matching credit-journal entry. */
      if(ok){s.executed=true;s.state='completed';S.paySession=s;if(!save()){toast('خدمت اجرا شد اما ثبت نتیجه ناموفق بود؛ پیش از تلاش دوباره وضعیت را بررسی کنید.');return false}}
      else{
        if(err)console.error('E30 pay exec',err);
        if(refund(txn,s.key,s.cost,'خطا در اجرای سرویس',s.payId)===false){s.state='failed';toast('بازپرداخت ثبت نشد؛ پیش از ادامه ذخیره‌سازی را بررسی کنید.');return false}
        s.refunded=true;
        set('refunded');
        botC('پرداخت انجام شد اما اجرای سرویس با خطا مواجه شد — <b>'+fa(s.cost,0)+' کلید بازگشت داده شد</b>. می‌توانید دوباره تلاش کنید.',null);
      }
      return !!ok;
    }
    try{
      var result=s._cb(txn);
      if(result&&typeof result.then==='function'){
        return Promise.resolve(result).then(function(v){return finish(v!==false,null)},
          function(err){return finish(false,err)});
      }
      return finish(result!==false,null);
    }catch(e){return finish(false,e)}
  }

  /* ── decline (explicit cancel or backdrop/ESC close while presented) ── */
  function cancel(payId,silent){
    var s=sess();
    if(!s||s.payId!==payId)return;
    if(s.state==='processing'||s.state==='paid'||s.state==='executing'){toast('پرداخت در حال انجام است — قابل لغو نیست');return}
    set('declined');
    clear();
    invalidateOthers(payId);
    if(!silent){usrC('انصراف از پرداخت');botC('انجام نشد — هیچ کلیدی کسر نشد. هر وقت خواستید دوباره درخواست کنید.',null)}
  }

  /* refund path (failure after payment) */
  function refund(txn,key,cost,reason,payId){
    if(payId&&(S.log||[]).some(function(x){return x.payId===payId&&x.refund}))return false;
    S.tokens+=cost;
    S.log.unshift({t:Date.now(),d:'بازگشت کلید — '+(reason||''),c:cost,cat:'bana',id:txn,svc:key,payId:payId||null,refund:true});
    var current=sess(),wasRefunded=current&&current.refunded;if(current&&payId===current.payId)current.refunded=true;
    if(!save()){S.tokens-=cost;S.log.shift();if(current&&payId===current.payId)current.refunded=wasRefunded;toast('بازپرداخت ذخیره نشد؛ دوباره تلاش کنید.');return false}
    renderTok();
    try{E29.bus.emit('token.refund',{txn:txn,cost:cost,reason:reason})}catch(e){}
    toast('+'+fa(cost,0)+' کلید بازگشت داده شد');
  }

  /* boot recovery: an interrupted 'paid/executing/processing' session means the user
     reloaded mid-run → service may not have completed → honest auto-refund (§11.7) */
  function recover(){
    var s=sess();
    if(!s)return;
    if(s.state==='processing'||s.state==='paid'||s.state==='executing'){
      if(s.paidFlag&&!s.executed&&!s.refunded&&
         (S.log||[]).some(function(x){return x.payId===s.payId&&x.c===-s.cost&&
           (!s.txnId||x.id===s.txnId)})&&
         !(S.log||[]).some(function(x){return x.refund&&x.payId===s.payId})){
        var txn=E30.uid('TXN-R');
        if(refund(txn,s.key,s.cost,'بازیابی پس از وقفه',s.payId)===false)return false;
        s.refunded=true;save();
        try{E29.notifsAPI.push({cat:'financial',etype:'pay.recovered',title:'پرداخت ناتمام بازگشت داده شد',msg:fa(s.cost,0)+' کلید بابت «'+s.title+'» بازگشت داده شد — سرویس اجرا نشده بود.',action:{kind:'wallet'},dedupKey:'rec-'+s.payId})}catch(e){}
      }
    }
    clear();
  }

  /* delegation wiring (global; works for chat bubbles AND modals AND panels) */
  document.addEventListener('click',function(e){
    var t=e.target;if(!t||!t.closest)return;
    var el=t.closest('[data-paygo]');
    if(el){e.preventDefault();go(el.getAttribute('data-paygo'));return}
    el=t.closest('[data-paycancel]');
    if(el){e.preventDefault();cancel(el.getAttribute('data-paycancel'));return}
  },true);

  /* backdrop/ESC close of a presented pay MODAL = decline (never orphaned).
     Only cancels when the live session's card really sits in the open modal —
     an in-chat card must survive unrelated closeModal() calls. */
  var _closeModal=closeModal;
  closeModal=function(){
    var r=$('#modal-root');
    if(r&&r.classList&&r.classList.contains('on')){
      var s=sess();
      if(s&&(s.state==='presented'||s.state==='insufficient')&&r.querySelector('[data-paygo="'+s.payId+'"],[data-paycancel="'+s.payId+'"]')){cancel(s.payId,true)}
    }
    _closeModal();
  };

  /* legacy-compatible alias so any unpatched E29 caller still lands in the FSM */
  E29.pay.ask=function(key,desc,ctx,onConfirm){begin({key:key,desc:desc,ctx:ctx,onConfirm:onConfirm})};
  CBACT.e29payGo=function(el){go(el.getAttribute('data-key'))};
  CBACT.e29payCancel=function(el){cancel(el.getAttribute('data-key'))};

  return {begin:begin,go:go,cancel:cancel,refund:refund,recover:recover,
    session:function(){return sess()},states:STATES,
    audit:function(){ /* payment audit matrix rows — used by QA and payment-audit doc */
      return Object.keys(E30.PRICING).map(function(k){return {key:k,cost:E30.PRICING[k].cost,label:E30.PRICING[k].label}})
    }};
})();