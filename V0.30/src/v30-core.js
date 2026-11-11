/* ═══════════════ V0.30 — E30 CORE: state defaults, Bana pricing, unified payment FSM ═══════════════
   Payment lifecycle (spec V0.30 §11.2) — a service payment is ALWAYS in exactly one state:
   idle → selected → priced → presented → awaiting_confirm → confirmed → validating
        → processing → paid → executing → completed
   with exits: declined / insufficient / failed / refunded. The state never becomes ambiguous:
   the live session lives in S.paySession (persisted); a superseding begin() or an explicit
   cancel/backdrop-close/ESC always resolves it; on boot an orphaned paid-but-not-executed
   session is auto-refunded (§11.6). Duplicate clicks are impossible: only state 'presented'
   accepts go(); the button disables itself on first click.
   ═══════════════ */
window.E30={VER:'0.30'};
E30.uid=function(p){return (p||'E30')+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e5).toString(36)};
E30.chatRef=function(){return (window.E29&&E29.chatRef)?E29.chatRef():{chatId:null,chatTitle:'گفت‌وگوی جاری'}};

/* ── centralized Bana pricing (single source — spec §17.1) ──
   Every service reads cost/label/desc from here for: display, confirmation card,
   balance deduction, transaction record and library metadata. */
E30.PRICING={
  hood_detail :{cost:40, label:'تحلیل جامع محله',        desc:'گزارش جامع بازار، دسترسی‌ها و تناسب یک محله', cx:'high',  refund:'failed_only'},
  hood_compare:{cost:40, label:'مقایسهٔ جامع دو محله',    desc:'مقایسهٔ کنارهم دو محله در همهٔ شاخص‌ها',        cx:'high',  refund:'failed_only'},
  valuation   :{cost:40, label:'تخمین ارزش ملک',         desc:'برآورد ارزش با دادهٔ نمونهٔ سامانه',            cx:'high',  refund:'failed_only'},
  invest_probe:{cost:40, label:'تحلیل سرمایه‌گذاری ملک',   desc:'بازده، سناریوها و ریسک بر پایهٔ دادهٔ نمونه',     cx:'high',  refund:'failed_only'},
  legal       :{cost:100,label:'گزارش حقوقی ملک',         desc:'بررسی وضعیت سند و مسیر انتقال',               cx:'high',  refund:'failed_only'},
  contract_draft:{cost:60,label:'تنظیم و ثبت قرارداد',     desc:'پیش‌نویس و ثبت قرارداد داخلی',                 cx:'high',  refund:'failed_only'},
  term_ai     :{cost:80, label:'تحلیل هوشمند اسناد فسخ',  desc:'استخراج الزامات تسویه از اسناد فسخ',           cx:'high',  refund:'failed_only'},
  detail      :{cost:10, label:'اطلاعات کامل آگهی',        desc:'نمایش جزئیات کامل یک آگهی',                   cx:'low',   refund:'failed_only'},
  visit       :{cost:20, label:'ثبت درخواست بازدید',       desc:'ارسال درخواست بازدید به مالک',                cx:'low',   refund:'failed_only'},
  bid         :{cost:20, label:'ثبت پیشنهاد پروژه',        desc:'ارسال پیشنهاد در پروژه‌ها',                    cx:'low',   refund:'failed_only'},
  stay        :{cost:30, label:'رزرو اقامتگاه',            desc:'ثبت رزرو امانی اقامتگاه',                     cx:'low',   refund:'failed_only'},
  escrow      :{cost:150,label:'تسویهٔ امانی',              desc:'آزادسازی مرحله‌ای از حساب امانی',              cx:'high',  refund:'failed_only'}
};
/* keep legacy COSTS/COSTL mirrors in sync so unpatched legacy code agrees */
try{Object.keys(E30.PRICING).forEach(function(k){COSTS[k]=E30.PRICING[k].cost;if(E30.PRICING[k].label)COSTL[k]=E30.PRICING[k].label})}catch(e){}
E30.price=function(key){var p=E30.PRICING[key];return p?p.cost:(COSTS[key]!==undefined?COSTS[key]:0)};
E30.label=function(key){var p=E30.PRICING[key];return p?p.label:(COSTL[key]||key)};

/* ── in-flight guard (module-level; session itself is persisted) ── */
E30._lock=0;

E30.pay=(function(){
  var STATES=['idle','selected','priced','presented','awaiting_confirm','confirmed','validating','processing','paid','executing','completed','declined','insufficient','failed','refunded'];
  function sess(){if(!S.paySession)S.paySession=null;return S.paySession}
  function set(st){var s=sess();if(s){s.state=st;s.ts=Date.now();save()}}
  function clear(){S.paySession=null;save()}

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
      '<div class="pr"><span>هزینه</span><b>'+fa(cost,0)+' بنا</b></div>'+
      '<div class="pr"><span>موجودی فعلی</span><b>'+fa(bal,0)+' بنا</b></div>'+
      '<div class="pr"><span>موجودی پس از پرداخت</span><b>'+fa(Math.max(0,bal-cost),0)+' بنا</b></div>'+
      '<div class="pr"><span>گیرندهٔ پرداخت</span><b>سامانهٔ محلینو (اعتبار بنا)</b></div>'+
      (extra&&extra.note?'<div class="e30-note">'+extra.note+'</div>':'')+
      '<div class="qr">'+
      '<button data-paygo="'+qesc(s.payId)+'">'+fa(cost,0)+' بنا پرداخت و اجرا</button>'+
      '<button data-paycancel="'+qesc(s.payId)+'">انصراف</button>'+
      '</div></div>';
  }

  /* ── entry: service selected → priced → presented (§11.2 states 1–4) ── */
  function begin(spec){
    /* spec={key,title,desc,ctx,onConfirm,note,source} */
    var key=spec.key,cost=E30.price(key);
    var prev=sess();
    /* supersede any live session honestly (old card gets invalidated) */
    if(prev&&prev.payId){if(prev.state==='processing'||prev.state==='paid'){toast('یک پرداخت دیگر در حال انجام است — لطفاً صبر کنید');return false}invalidateIfNeeded(prev)}
    var s={payId:E30.uid('PAY'),key:key,cost:cost,title:spec.title||E30.label(key),desc:spec.desc||'',ctx:spec.ctx||'',state:'selected',ts:Date.now(),source:spec.source||'',executed:false,paidFlag:false};
    s._cb=spec.onConfirm; /* kept in memory only — not serializable; reload path handled by recover() */
    S.paySession=s;
    set('priced');
    if((S.tokens||0)<cost){
      /* validating → insufficient — nothing deducted */
      set('insufficient');
      var bal=S.tokens||0;
      var h='<div class="e30-paycard e30-paybad" data-pay="'+qesc(s.payId)+'">'+
        '<div class="pt">موجودی بنا کافی نیست</div>'+
        '<div class="pr"><span>سرویس</span><b>'+esc(s.title)+'</b></div>'+
        '<div class="pr"><span>هزینهٔ لازم</span><b>'+fa(cost,0)+' بنا</b></div>'+
        '<div class="pr"><span>موجودی شما</span><b>'+fa(bal,0)+' بنا</b></div>'+
        '<div class="qr"><button data-view="sub">شارژ بنا</button><button data-paycancel="'+qesc(s.payId)+'">بستن</button></div></div>';
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
    if(!s||s.payId!==payId){toast('این کارت تأیید دیگر معتبر نیست — سرویس را دوباره انتخاب کنید');return}
    if(s.state!=='presented'){
      if(s.state==='processing'||s.state==='paid'||s.state==='executing'){toast('این پرداخت در حال انجام است');return}
      if(s.state==='completed'){toast('این پرداخت قبلاً انجام شده است');return}
      toast('این کارت تأیید معتبر نیست');return;
    }
    set('validating');
    if((S.tokens||0)<s.cost){set('insufficient');toast('موجودی در فاصلهٔ تأیید تغییر کرد — لطفاً دوباره تلاش کنید');begin({key:s.key,title:s.title,desc:s.desc,ctx:s.ctx,onConfirm:s._cb});return}
    set('processing');
    var btns=document.querySelectorAll('[data-paygo="'+payId+'"]');
    Array.prototype.forEach.call(btns,function(b){b.disabled=true;b.textContent='در حال پردازش…'});
    /* deduct exactly once — idempotency marker guards any re-entry */
    if(s.paidFlag){toast('پرداخت تکراری مسدود شد');return}
    s.paidFlag=true;save();
    var txn=E30.uid('TXN');
    S.tokens-=s.cost;
    S.log.unshift({t:Date.now(),d:(s.title)+(s.ctx?' — '+s.ctx:''),c:-s.cost,cat:'bana',id:txn,svc:s.key,payId:s.payId});
    save();renderTok();
    try{E29.bus.emit('token.deduct',{txn:txn,cost:s.cost,svc:s.key,desc:s.title,payId:s.payId})}catch(e){}
    if((S.tokens||0)<30){try{E29.bus.emit('wallet.low',{balance:S.tokens})}catch(e){}}
    set('paid');
    usrC('پرداخت '+fa(s.cost,0)+' بنا برای «'+s.title+'»');
    set('executing');
    var ok=true,err=null;
    try{
      if(typeof s._cb!=='function'){/* callback lost on reload — treat as permanent failure */}
      else s._cb(txn);
    }catch(e){ok=false;err=e;console.error('E30 pay exec',e)}
    if(ok){set('completed');s.executed=true;S.paySession=s;save()}
    else{
      /* payment succeeded but service permanently failed → refund (§11.6) */
      refund(txn,s.key,s.cost,'خطا در اجرای سرویس');
      set('refunded');
      botC('پرداخت انجام شد اما اجرای سرویس با خطا مواجه شد — <b>'+fa(s.cost,0)+' بنا بازگشت داده شد</b>. می‌توانید دوباره تلاش کنید.',null);
    }
    return ok;
  }

  /* ── decline (explicit cancel or backdrop/ESC close while presented) ── */
  function cancel(payId,silent){
    var s=sess();
    if(!s||s.payId!==payId)return;
    if(s.state==='processing'||s.state==='paid'||s.state==='executing'){toast('پرداخت در حال انجام است — قابل لغو نیست');return}
    set('declined');
    clear();
    invalidateOthers(payId);
    if(!silent){usrC('انصراف از پرداخت');botC('انجام نشد — هیچ بنایی کسر نشد. هر وقت خواستید دوباره درخواست کنید.',null)}
  }

  /* refund path (failure after payment) */
  function refund(txn,key,cost,reason){
    S.tokens+=cost;
    S.log.unshift({t:Date.now(),d:'بازگشت بنا — '+(reason||''),c:cost,cat:'bana',id:txn,svc:key,refund:true});
    save();renderTok();
    try{E29.bus.emit('token.refund',{txn:txn,cost:cost,reason:reason})}catch(e){}
    toast('+'+fa(cost,0)+' بنا بازگشت داده شد');
  }

  /* boot recovery: an interrupted 'paid/executing/processing' session means the user
     reloaded mid-run → service may not have completed → honest auto-refund (§11.7) */
  function recover(){
    var s=sess();
    if(!s)return;
    if(s.state==='processing'||s.state==='paid'||s.state==='executing'){
      if(s.paidFlag&&!s.executed){
        var txn=E30.uid('TXN-R');
        refund(txn,s.key,s.cost,'بازیابی پس از وقفه');
        try{E29.notifsAPI.push({cat:'financial',etype:'pay.recovered',title:'پرداخت ناتمام بازگشت داده شد',msg:fa(s.cost,0)+' بنا بابت «'+s.title+'» بازگشت داده شد — سرویس اجرا نشده بود.',action:{kind:'wallet'},dedupKey:'rec-'+s.payId})}catch(e){}
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
