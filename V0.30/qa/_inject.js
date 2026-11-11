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


/* ═══════════════ V0.30 — E30 INTEL: conversational discovery engine (spec §4) ═══════════════
   Philosophy: user explains their situation → assistant understands → summarizes →
   identifies what's missing → asks ONE relevant question → user answers → understanding
   updates → next question adapts. Never a fixed questionnaire; never re-asks given info;
   never converts an inference into a confirmed requirement; never silently defaults money.
   ═══════════════ */
E30.disc=(function(){
  function nz(t){return normFa(String(t||'')).replace(/‌/g,' ')}

  /* ── context model (§4.4): every fact = value + source + confidence + status ── */
  function ctx(){
    if(!S.ctx30)S.ctx30={fields:{},log:[]};
    if(!S.ctx30.fields)S.ctx30.fields={};
    return S.ctx30;
  }
  /* field kinds: money | moneyRange | count | text | enum | loc | prefs | bool */
  /* status: confirmed | inferred | unknown | contradictory | stale               */
  function setF(id,v,opts){
    opts=opts||{};
    var c=ctx(),f=c.fields[id],now=Date.now();
    if(v===undefined||v===null||v===''){delete c.fields[id];return}
    var conf={v:v,src:opts.src||'',conf:opts.conf!==undefined?opts.conf:1,
      status:opts.inferred?'inferred':'confirmed',kind:opts.hard?'hard':(opts.soft?'soft':'plain'),
      ts:now};
    if(f&&f.status==='confirmed'&&JSON.stringify(f.v)!==JSON.stringify(conf.v)&&!opts.inferred){
      if(f.src&&opts.src&&f.src!==opts.src){f.stale=f.v} /* keep previous as stale */
    }
    c.fields[id]=conf;
    c.log.push({t:now,slot:id,v:v,inferred:!!opts.inferred,src:opts.src||''});
    if(c.log.length>120)c.log.shift();
    /* mirror into V0.29 profile so existing profile card / wfSummary keep working */
    try{
      if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};
      if(opts.inferred){if(S.profile.confirmed[id]===undefined)S.profile.inferred[id]=v}
      else S.profile.confirmed[id]=v;
    }catch(e){}
  }
  function getF(id){var f=ctx().fields[id];return f?f.v:null}
  function fMeta(id){return ctx().fields[id]||null}
  function isHard(id){var f=ctx().fields[id];return f&&f.kind==='hard'}
  function markUnknown(id){setF(id,null);ctx().fields[id]={v:null,status:'unknown',conf:0,ts:Date.now(),kind:'plain',src:''}}

  /* ── persona classification — DYNAMIC (re-run after every update; §6.1) ── */
  function personaOf(wf){
    var hh=getF('household'),kids=getF('children'),occ=getF('occupation')||'',stage=getF('life_stage')||'';
    var n=ctx();
    if(wf==='rent'||wf==='buy'){
      if(getF('purpose')==='invest')return 'investor';
      if(hh==='roommates')return 'roommates';
      if(hh==='family'||kids)return 'family';
      if(hh==='couple'||stage==='newly_married')return 'couple';
      if(/دانشجو|دانشگاه|کوی|نمونه/.test(String(occ)))return 'student';
      if(/بازنشسته|سالمند|رئيس‌تبار|بازنشسته/.test(String(occ)+String(stage)))return 'retiree';
      if(getF('relocating'))return 'relocating';
      if(wf==='buy'){if(stage==='first_home')return 'firsttime';return 'buyer'}
      if(stage==='first_rent')return 'firstrent';
      return 'professional';
    }
    if(wf==='sell'){
      var u=getF('sale_urgency');
      if(getF('ownership')==='inherited')return 'heir';
      if(getF('ownership')==='joint')return 'joint_owner';
      if(u==='fast')return 'urgent_seller';
      if(getF('landlord'))return 'landlord';
      return 'seller_max';
    }
    if(wf==='invest'){
      var o=getF('invest_objective');
      return ({rent_income:'yield_seeker',appreciation:'growth_seeker',inflation_hedge:'hedger',land_bank:'land_banker',
        resale:'flipper',commercial:'commercial',development:'developer',diversify:'diversifier'})[o]||'invest_new';
    }
    return 'general';
  }
  var P_TONE={
    student:{q:'سریع و ساده پیش برویم — ',why:'برای دانشجو معمولاً دسترسی و هزینه مهم‌تر از جزئیات است.'},
    family:{q:'برای خانواده‌تان ',why:'با بچه‌ها، مدرسه و امنیت محله معمولاً اولویت پیدا می‌کند.'},
    couple:{q:'برای زندگی دو نفره‌تان ',why:''},
    roommates:{q:'برای هم‌خانه‌ای ',why:'تقسیم ودیعه و اجاره بین هم‌خانه‌ای‌ها معمولاً مهم است.'},
    retiree:{q:'برای شرایط شما ',why:'طبقه، آسانسور و سکوت معمولاً اهمیت بیشتری پیدا می‌کند.'},
    relocating:{q:'با توجه به جابه‌جایی‌تان ',why:''},
    firstrent:{q:'برای اولین اجاره ',why:'چون اولین تجاره‌تان است، هر جا ابهام داشت حتماً بپرسید.'},
    professional:{q:''},
    firsttime:{q:'برای اولین خرید ',why:'قدم‌به‌قدم همراهتان هستم.'},
    buyer:{q:''},investor:{q:'',why:'هدف سرمایه‌گذاری معمولاً سؤال‌های متفاوتی می‌خواهد.'},
    urgent_seller:{q:'',why:'با فوریت فروش، استراتژی قیمت متفاوت می‌شود.'},
    seller_max:{q:''},heir:{q:'',why:'در املاک ارثی، وضعیت سند معمولاً قبل از قیمت‌گذاری بررسی می‌شود.'},
    joint_owner:{q:'',why:'در مالکیت مشاعی، هماهنگی شرکا روی قیمت و زمان فروش مهم است.'},
    landlord:{q:''},yield_seeker:{q:''},growth_seeker:{q:''},hedger:{q:''},land_banker:{q:''},
    flipper:{q:''},commercial:{q:''},developer:{q:''},diversifier:{q:''},invest_new:{q:'برای اولین سرمایه‌گذاری ',why:'هدف اصلی شما تعیین می‌کند کدام اعداد مهم‌اند.'},
    general:{q:''}
  };

  /* ── field registry: label, ask variants, why, parser kind ── */
  var FL={
    life_stage:{l:'مرحلهٔ زندگی',kind:'enum'},
    occupation:{l:'شغل/تحصیل',kind:'text'},
    household:{l:'ترکیب خانوار',kind:'enum'},
    family_members:{l:'تعداد افراد',kind:'count'},
    children:{l:'فرزند',kind:'bool'},
    work_loc:{l:'محل کار',kind:'loc'},
    uni_loc:{l:'دانشگاه',kind:'loc'},
    work_weight:{l:'اهمیت محل کار',kind:'enum'},
    budget_dep:{l:'ودیعه',kind:'moneyRange',fin:true},
    budget_rent:{l:'اجارهٔ ماهانه',kind:'moneyRange',fin:true},
    buy_budget:{l:'بودجهٔ خرید',kind:'moneyRange',fin:true},
    rooms:{l:'خواب',kind:'count'},
    m2:{l:'متراژ',kind:'count'},
    prop_age:{l:'عمر بنا',kind:'count'},
    prop_new:{l:'نوساز',kind:'enum'},
    prefs:{l:'الزامات',kind:'prefs'},
    timeline:{l:'زمان نقل مکان',kind:'text'},
    hood:{l:'محله',kind:'loc'},
    purpose:{l:'هدف خرید',kind:'enum'},
    invest_objective:{l:'هدف سرمایه‌گذاری',kind:'enum'},
    invest_capital:{l:'سرمایه',kind:'moneyRange',fin:true},
    invest_horizon:{l:'افق سرمایه‌گذاری',kind:'enum'},
    invest_liquidity:{l:'نقدشوندگی',kind:'enum'},
    invest_risk:{l:'ریسک‌پذیری',kind:'enum'},
    prop_area:{l:'متراژ ملک',kind:'count'},
    prop_rooms:{l:'خواب ملک',kind:'count'},
    ownership:{l:'نوع مالکیت',kind:'enum'},
    docs:{l:'وضعیت مدارک',kind:'enum'},
    sale_motivation:{l:'انگیزهٔ فروش',kind:'enum'},
    sale_urgency:{l:'فوریت فروش',kind:'enum'},
    expected_price:{l:'قیمت انتظاری',kind:'moneyRange',fin:true},
    min_price:{l:'کف قیمت',kind:'moneyRange',fin:true},
    listing_intent:{l:'نوع آگهی',kind:'enum'}
  };
  var SLOT_LABEL={};Object.keys(FL).forEach(function(k){SLOT_LABEL[k]=FL[k].l});

  /* ── extraction: pull EVERY recognizable fact from a free-form message (§4.2) ── */
  function stripFin(t){return String(t).replace(/حدوداً|حدود|تقریباً|تقریبا|حداکثر|حداقل|در نظر گرفتی|می‌خوام|میخوام|بگیرم|بدم|هست|است|داره|دارم/g,' ')}
  function extract(text,src){
    var t=String(text||''),nt=nz(t),found=0,i;
    /* household */
    if(/تنهایی|فقط خودم|یه نفر|یک نفر|مجردم/.test(nt)){if(getF('household')!=='single'){setF('household','single',{src:src});found++}}
    else if(/هم ?خونه|هم ?اتاق/.test(nt)){if(getF('household')!=='roommates'){setF('household','roommates',{src:src});found++}}
    else if(/زوج|ازدواج|عقد|دو نفره|من و همسر|من و خانمم|من و اقام/.test(nt)){if(getF('household')!=='couple'){setF('household','couple',{src:src});found++}}
    else if(/خانواده|بچه|فرزند|کودک|سه نفر|چهار نفر|پنج نفر/.test(nt)){if(getF('household')!=='family'){setF('household','family',{src:src});found++}}
    /* age — optional, only stored when volunteered */
    var agm=nt.match(/([۰-۹0-9]+)\s*سالمه/)||nt.match(/([۰-۹0-9]+)\s*سال(ه‌ام|ه ام| دارم)/)||nt.match(/سن[مم]? ([۰-۹0-9]+)/);
    if(agm){var ageN=pd(agm[1]);if(ageN>=10&&ageN<100&&getF('age')!=ageN){setF('age',ageN,{src:src});found++}}
    if(/بچه|فرزند|کودک/.test(nt)&&!/ندارم|نمی ?خوام|بدون بچه/.test(nt)){if(getF('children')!=='yes'){setF('children','yes',{src:src});found++}}
    if(/تازه ازدواج|عقد کرده|تازه عقد|می ?خوام ازدواج/.test(nt)&&getF('life_stage')!=='newly_married'){setF('life_stage','newly_married',{src:src});found++}
    if(/اولین بار|اولین تجربه|برای اولین/.test(nt)&&/اجاره/.test(nt)&&getF('life_stage')!=='first_rent'){setF('life_stage','first_rent',{src:src});found++}
    if(/اولین خانه|اولین بار.*خرید|اجاره ?نشین.*بخرم/.test(nt)&&getF('life_stage')!=='first_home'){setF('life_stage','first_home',{src:src});found++}
    /* occupation ONLY from explicit self-description — «دانشگاه» alone is a location, not a job (§4.2 no-wrong-inference) */
    if(/دانشجو(ام| هستم|‌ام)|من دانشجو/.test(nt)&&getF('occupation')!=='دانشجو'){setF('occupation','دانشجو',{src:src});found++}
    if(/بازنشسته|سالمند/.test(nt)&&getF('occupation')!=='بازنشسته'){setF('occupation','بازنشسته',{src:src});found++}
    if(/انتقال[یی]? (شغل|اداره)|ماموریت|جابه ?جا شدم.*کار|شغل جدید/.test(nt)){if(!getF('relocating')){setF('relocating','yes',{src:src});found++}}
    if(/مهاجرت/.test(nt)&&!getF('migrating')){setF('migrating','yes',{src:src});found++}
    /* rooms / m2 / age */
    var mm=nt.match(/(\d|[۰-۹]+)\s*خواب/);if(mm){var nb=pd(mm[1]);if(nb>0&&nb<9&&getF('rooms')!=+nb){setF('rooms',+nb,{src:src});found++}}
    var m2=nt.match(/(\d+|[۰-۹]+)\s*متر/);if(m2){var nm2=pd(m2[1]);if(nm2>=15&&nm2<2000&&getF('m2')!=+nm2){setF('m2',+nm2,{src:src});found++}}
    if(/نوساز|تازه ?ساز|نو ساز/.test(nt)){if(getF('prop_new')!=='new'){setF('prop_new','new',{src:src,soft:true});found++}}
    if(/بازسازی/.test(nt)&&!getF('renov_ok')){setF('renov_ok','yes',{src:src,soft:true});found++}
    var ag=nt.match(/حداکثر عمر[^\d۰-۹]*(\d+|[۰-۹]+)/);if(ag){var na=pd(ag[1]);if(na>0&&na<=40&&getF('prop_age')!=+na){setF('prop_age',+na,{src:src,hard:true});found++}}
    /* work / university locations (hood names) */
    var hl=(typeof HOODS!=='undefined')?HOODS:[];
    function locIn(txt){for(var j=0;j<hl.length;j++){if(txt.indexOf(hl[j].n)>=0)return hl[j].id}return null}
    if(/محل کار|کارم|کارمون|اداره|شرکت/.test(nt)){var wl=locIn(nt);if(wl&&getF('work_loc')!==wl){setF('work_loc',wl,{src:src});found++}}
    if(/دانشگاه|دانشسر|فنی/.test(nt)){var ul=locIn(nt);if(ul&&getF('uni_loc')!==ul){setF('uni_loc',ul,{src:src});found++}}
    /* hood target */
    if(!/محل کار|دانشگاه/.test(nt)){var hl2=locIn(nt);if(hl2&&getF('hood')!==hl2){setF('hood',hl2,{src:src});found++}}
    /* money — handles both single amounts and two-amount sentences («X ودیعه و ماهی Y اجاره») */
    function segMoney(sg){
      var clean=stripFin(sg).replace(/ودیعه|رهن|پول جلو|اجاره|کرایه|ماهانه|ماهی|بودجه|سرمایه|پول|قیمت|هستم|است|باشه|باشه/g,' ');
      var r=parseMoneyRangeFA(clean);
      if(r&&r.ok){var p=r.value.split('|');return [+p[0],+p[1]]}
      var m=parseMoneyFA(clean);
      if(m&&m.ok)return [m.value,m.value];
      return null;
    }
    function finScan(nt2){
      var out={},segs=nt2.split(/،|؛|\sو\s(?=ماهی|ماهانه|اجاره|کرایه)/),i;
      for(i=0;i<segs.length;i++){
        var sg=segs[i],isD=/ودیعه|رهن|پول جلو/.test(sg),isR=/اجاره|کرایه|ماهی|ماهانه/.test(sg);
        if(!isD&&!isR)continue;
        var v=segMoney(sg);
        if(v){if(isD&&!out.dep)out.dep=v;else if(isR&&!out.rent)out.rent=v}
      }
      return out;
    }
    var fs=finScan(nt);
    if(fs.dep&&getF('budget_dep')!==fs.dep&&getF('budget_dep')===null){setF('budget_dep',/بدون سقف|نامحدود/.test(nt)?{open:true}:{v:fs.dep},{src:src,fin:true});found++}
    if(fs.rent&&getF('budget_rent')===null){setF('budget_rent',{v:fs.rent},{src:src,fin:true});found++}
    /* single-amount buy/invest budget — window around the field word (amount may precede it) */
    function moneyAfter(wordSrc){
      var re=new RegExp('(?:'+wordSrc+')');
      var m=nt.match(re);if(!m)return null;
      var pos=m.index,i0=Math.max(0,pos-38),i1=Math.min(nt.length,pos+38);
      return segMoney(nt.slice(i0,i1));
    }
    if(!fs.dep&&!fs.rent){
      if(/بودجه|سرمایه|پولم|میلیارد/.test(nt)&&/خرید|بخرم|سرمایه ?گذاری/.test(nt)){var bv=moneyAfter('بودجه|سرمایه|پولم');if(bv){setF(getF('purpose')==='invest'||/سرمایه ?گذاری/.test(nt)?'invest_capital':'buy_budget',{v:bv},{src:src,fin:true});found++}}
      else if(/ودیعه|رهن/.test(nt)){var dv=moneyAfter('ودیعه|رهن|پول جلو');if(dv){setF('budget_dep',/بدون سقف|نامحدود/.test(nt)?{open:true}:{v:dv},{src:src,fin:true});found++}}
      else if(/اجاره|کرایه|ماهانه/.test(nt)){var rv2=moneyAfter('اجاره|کرایه|ماهانه');if(rv2){setF('budget_rent',{v:rv2},{src:src,fin:true});found++}}
    }
    if(/بودجه|سرمایه|می ?لیارد|میلیارد|پول/.test(nt)&&/خرید|بخرم|سرمایه ?گذاری|پولم/.test(nt)){var bv=moneyAfter(/بودجه|سرمایه|پول/);if(bv){setF(getF('purpose')==='invest'||/سرمایه ?گذاری/.test(nt)?'invest_capital':'buy_budget',{v:bv},{src:src,fin:true});found++}}
    /* purpose / objectives */
    if(/سرمایه ?گذاری|سود|اجاره بدهم|درآمد اجاره/.test(nt)&&getF('purpose')!=='invest'){setF('purpose','invest',{src:src});found++}
    if(/سکونت|برای خودم|زندگی/.test(nt)&&/خرید/.test(nt)&&getF('purpose')!=='residence'){setF('purpose','residence',{src:src});found++}
    if(/درآمد اجاره|اجاره بدهم|سود اجاره/.test(nt)&&!getF('invest_objective')){setF('invest_objective','rent_income',{src:src});found++}
    else if(/حفظ ارزش|تورم|ارزش پولم/.test(nt)&&!getF('invest_objective')){setF('invest_objective','inflation_hedge',{src:src});found++}
    else if(/رشد قیمت|بزرگ بشه|قیمتش بره بالا/.test(nt)&&!getF('invest_objective')){setF('invest_objective','appreciation',{src:src});found++}
    else if(/زمین/.test(nt)&&/سرمایه ?گذاری|بخرم/.test(nt)&&!getF('invest_objective')){setF('invest_objective','land_bank',{src:src});found++}
    /* sale side */
    if(/ارث/.test(nt)&&getF('ownership')!=='inherited'){setF('ownership','inherited',{src:src});found++}
    if(/مشاع|شریک|برادر|خواهر.*مالک|مالکیت مشترک/.test(nt)&&getF('ownership')!=='joint'){setF('ownership','joint',{src:src});found++}
    if(/عجله|فوری|زودتر بفروشم|سریع فروش/.test(nt)&&getF('sale_urgency')!=='fast'){setF('sale_urgency','fast',{src:src,hard:true});found++}
    if(/مهاجرت/.test(nt)&&/فروش|بفروشم/.test(nt)&&getF('sale_motivation')!=='مهاجرت'){setF('sale_motivation','مهاجرت',{src:src});found++}
    if(/اجاره می ?دم|موجر|مستأجر دارم|مستاجر دارم|اجاره ? دادن/.test(nt)&&!getF('landlord')){setF('landlord','yes',{src:src});found++}
    /* timeline */
    var tm=nt.match(/تا (یک|دو|سه|یک ماه|۲|۳)[^\s،.؛]* (دیگه|دیگر|ماه)/);if(tm&&!getF('timeline')){setF('timeline',tm[0],{src:src});found++}
    if(/فوری|هرچه زودتر|هر چه زودتر/.test(nt)&&!getF('timeline')){setF('timeline','فوری',{src:src});found++}
    /* commute ceiling: «بیشتر از نیم ساعت در مسیر نباشم» */
    var cm=nt.match(/(نیم ساعت|۳۰ دقیقه|30 دقیقه|یک ساعت|ساعت)[^\s،.؛]{0,12}/);
    if(cm&&/مسیر|رفت ?و ?آمد|در راه/.test(nt)&&getF('commute_max')!==cm[1]){setF('commute_max',cm[1],{src:src});found++}
    /* prefs */
    var pf=[],base=ctx().fields.prefs?ctx().fields.prefs.v||[]:[];
    if(/پارکینگ/.test(nt)&&base.indexOf('parking')<0)pf.push('parking');
    if(/آسانسور|اسانسور/.test(nt)&&base.indexOf('elevator')<0)pf.push('elevator');
    if(/بالکن|تراس/.test(nt)&&base.indexOf('balcony')<0)pf.push('balcony');
    if(/سکوت|آرام/.test(nt)&&base.indexOf('quiet')<0)pf.push('quiet');
    if(/مترو/.test(nt)&&base.indexOf('metro')<0)pf.push('metro');
    if(/انباری/.test(nt)&&base.indexOf('storage')<0)pf.push('storage');
    if(pf.length){setF('prefs',base.concat(pf),{src:src,soft:true});found++}
    return found;
  }

  /* ── adaptive question selection (§4.5) — impact-scored, not list-ordered ── */
  function missing(wf){
    var REQ={
      rent:[{id:'budget_dep',w:10},{id:'budget_rent',w:10},{id:'household',w:8},{id:'work_loc',w:6,cond:function(){return !getF('uni_loc')}},
            {id:'uni_loc',w:6,cond:function(){return !getF('work_loc')}},
            {id:'work_weight',w:12,cond:function(){return !!getF('work_loc')&&!!getF('uni_loc')&&!getF('work_weight')}},
            {id:'hood',w:5,cond:function(){return !getF('work_loc')&&!getF('uni_loc')}},
            {id:'prop_new',w:5},{id:'rooms',w:4,cond:function(){return !!getF('household')}},{id:'m2',w:3},{id:'prop_age',w:3,cond:function(){return getF('prop_new')!=='new'}},
            {id:'prefs',w:3},{id:'timeline',w:2}],
      buy:[{id:'buy_budget',w:10},{id:'purpose',w:9},{id:'household',w:6},{id:'hood',w:5},{id:'rooms',w:4,cond:function(){return !!getF('household')}},
           {id:'prop_new',w:3},{id:'m2',w:3},{id:'prop_age',w:3},{id:'prefs',w:2},{id:'timeline',w:2}],
      sell:[{id:'prop_area',w:9},{id:'hood',w:9},{id:'prop_rooms',w:6},{id:'ownership',w:7},{id:'docs',w:5,cond:function(){return getF('ownership')==='inherited'}},
            {id:'sale_motivation',w:6},{id:'sale_urgency',w:7},{id:'expected_price',w:5},{id:'min_price',w:4,cond:function(){return getF('sale_urgency')==='fast'}}],
      invest:[{id:'invest_objective',w:10},{id:'invest_capital',w:9},{id:'invest_horizon',w:6},{id:'invest_liquidity',w:5},
              {id:'invest_risk',w:5},{id:'hood',w:4},{id:'prop_new',w:2}]
    };
    var list=REQ[wf]||[],out=[],i;
    for(i=0;i<list.length;i++){
      var it=list[i];
      if(it.cond&&!it.cond())continue;
      var f=fMeta(it.id);
      if(f&&(f.status==='confirmed'||f.status==='unknown'))continue;
      out.push({id:it.id,w:it.w+((f&&f.status==='inferred')?2:0)});
    }
    out.sort(function(a,b){return b.w-a.w});
    return out;
  }
  function needClarify(){
    /* pending inference worth clarifying before it hardens (§4.4) */
    var f=fMeta('prop_new');
    if(f&&f.status==='confirmed'&&f.v==='new'&&f._clar===undefined)return 'prop_new';
    return null;
  }

  /* ── question bank: per field — several natural templates + why ── */
  var ASK={
    budget_dep:{q:['ودیعه‌ای که در نظر دارید حدوداً چقدر است؟ (می‌توانید بازه بگویید یا «بدون سقف»)',
                   'برای ودیعه چه بازه‌ای در نظر گرفته‌اید؟'],
      why:'ودیعه و اجاره با هم تعیین می‌کنند چه گزینه‌هایی واقعاً در دسترس شماست.'},
    budget_rent:{q:['و اجارهٔ ماهانه حدوداً چقدر؟ (بازه هم کافی است)',
                    'اجارهٔ ماهانه‌ای که برایش آماده باشید چقدر است؟'],
      why:'هر دو عدد را جدا ثبت می‌کنم تا پیشنهادها دقیق باشد — هیچ عددی را حدس نمی‌زنم.'},
    buy_budget:{q:['بازهٔ بودجهٔ خریدتان حدوداً چقدر است؟','تا چه مبلغی برای خرید می‌روید؟ (بازه کافی است)'],
      why:'آیا این عدد فقط قیمت ملک است یا هزینه‌های جانبی (ماهی قانونی، انتقال) هم داخلش هست؟'},
    household:{q:['خانه برای چه کسانی است؟ (تنهایی، دو نفره، خانواده، هم‌خانه…)'],
      why:'ترکیب افراد روی تعداد خواب، متراژ و اولویت محله اثر مستقیم دارد.'},
    work_loc:{q:['محل کارتان کجاست؟ (نام محله یا تقریب)',
                 'بیشتر وقت‌ها کجا هستید — محل کار کدام سمت است؟'],
      why:'رفت‌وآمد روزانه معمولاً مهم‌ترین فاکتور انتخاب محله است.'},
    uni_loc:{q:['دانشگاه یا محل تحصیلتان کجاست؟'],
      why:'برای نزدیکی به دانشگاه باید بدانم کدام سمت شهر را بگردم.'},
    hood:{q:['محله یا سمت خاصی از شهر مدنظرتان هست؟'],
      why:'محدوده جست‌وجو را دقیق‌تر می‌کند.'},
    prop_new:{q:['نوساز برایتان چقدر مهم است؟ (کاملاً الزامی / تا ۵ سال هم کافی است / بازسازی‌شده هم اوکی)',
                 '«نوساز» را چقدر سخت می‌گیرم؟ فقط نوساز یا مثلاً تا ۵ سال ساخت هم باشد کافی است؟'],
      why:'تعریف دقیق نوساز روی تعداد گزینه‌ها خیلی اثر دارد.'},
    prop_age:{q:['حداکثر عمر بنا؟ (یا «مهم نیست»)'],
      why:''},
    rooms:{q:['چند خواب لازم دارید؟'],
      why:''},
    m2:{q:['حداقل متراژ چند متر باشد؟'],
      why:''},
    prefs:{q:['الزام دیگری دارید؟ (پارکینگ، آسانسور، بالکن، سکوت…)','چیز دیگری که حتماً باید باشد؟ (پارکینگ/آسانسور/…)'],
      why:''},
    timeline:{q:['تا چه زمانی باید جابه‌جا شده باشید؟'],
      why:'برای برنامه‌ریزی بازدید و قرارداد لازم است.'},
    purpose:{q:['برای سکونت می‌خرید یا سرمایه‌گذاری؟'],
      why:'این یک سؤال مسیر است — معیار انتخاب کاملاً عوض می‌شود.'},
    invest_objective:{q:['هدف اصلی‌تان چیست؟ (درآمد اجاره، رشد قیمت، حفظ ارزش در برابر تورم، زمین…)',
                         'بیشتر دنبال سود اجاره‌ای هستید یا رشد ارزش در بلندمدت؟'],
      why:'هدف سرمایه‌گذاری تعیین می‌کند کدام اعداد (بازده اجاره یا روند قیمت) برایتان مهم است.'},
    invest_capital:{q:['حدوداً چقدر سرمایه می‌خواهید وارد کنید؟ (بازه هم کافی است)'],
      why:'و اینکه چقدر از آن باید در دسترس بماند — ملک نقدشوندگی پایینی دارد.'},
    invest_horizon:{q:['افق سرمایه‌گذاری‌تان چقدر است؟ (۲–۳ سال، ۵ سال، بلندمدت…)'],
      why:''},
    invest_liquidity:{q:['اگر لازم شود، چقدر سریع باید بتوانید پول را خارج کنید؟'],
      why:''},
    invest_risk:{q:['نوسان قیمت برایتان چقدر قابل تحمل است؟'],
      why:''},
    prop_area:{q:['متراژ ملک حدوداً چند متر است؟'],
      why:''},
    prop_rooms:{q:['چند خواب است؟'],
      why:''},
    ownership:{q:['وضعیت مالکیت چطور است؟ (شخصی، ارثی، مشاعی…)'],
      why:'روی مسیر فروش و قیمت‌گذاری اثر دارد.'},
    docs:{q:['سند تک‌برگ است یا مدیرتُبُع/ورثه‌ای؟'],
      why:'زمان انتقال و مذاکره را تعیین می‌کند.'},
    sale_motivation:{q:['انگیزهٔ فروش چیست؟ (مهاجرت، تعویض، نقد شدن…)'],
      why:'استراتژی قیمت از انگیزه در می‌آید.'},
    sale_urgency:{q:['فروش فوری می‌خواهید یا حداکثر قیمت؟'],
      why:'این دو معمولاً با هم جمع نمی‌شوند — باید بدانم کدام اولویت است.'},
    expected_price:{q:['قیمت مدنظرتان حدوداً چقدر است؟'],
      why:'با دادهٔ نمونهٔ محله مقایسه‌اش می‌کنم.'},
    min_price:{q:['پایین‌تر از چه قیمتی نمی‌فروشید؟'],
      why:'برای فیلتر پیشنهادها لازم است.'},
    work_weight:{q:['نزدیکی به محل کار مهم‌تر است یا دانشگاه؟ یا هر دو تقریباً برابر؟'],
      why:'وزن هر کدام را در امتیاز محله می‌گذارم.'}
  };

  /* ── collector state ── */
  var COL={active:false,wf:null,fix:null,confirming:null,turns:0};
  function active(){return COL.active}

  function start(wf,silent){
    COL={active:true,wf:wf,fix:null,confirming:null,turns:0};
    if(!silent){
      var p=personaOf(wf),tone=P_TONE[p]||P_TONE.general;
      var greet='شنیدم. ';
      if(tone.why&&/family|student|retiree|roommates|firstrent|firsttime/.test(p))greet+='('+tone.why+') ';
      var sum=SUM.start(wf);
      greet+=sum||'تا شناخته‌شدن شرایط‌تان، چند چیز کلیدی را یکی‌یکی می‌پرسم.';
      botC(greet,null);
      askNext();
    }
    return true;
  }

  /* summarize understanding (§4.6 part 2) — only what's actually known */
  var SUM={
    start:function(wf){
      var parts=[],v;
      if(wf==='rent'){
        v=getF('household');if(v)parts.push({single:'برای خودتان',couple:'برای زندگی دو نفره',family:'برای خانواده',roommates:'برای هم‌خانه'}[v]);
        if(getF('life_stage')==='newly_married')parts.push('شروع زندگی مشترک');
        if(getF('life_stage')==='first_rent')parts.push('اولین تجربهٔ اجاره');
        v=getF('work_loc');if(v)parts.push('محل کار حوالی '+findH(v).n);
        v=getF('uni_loc');if(v)parts.push('دانشگاه حوالی '+findH(v).n);
        v=getF('hood');if(v)parts.push('محلهٔ '+findH(v).n);
        if(getF('prop_new')==='new')parts.push('نوساز بودن');
      }else if(wf==='buy'){
        v=getF('purpose');if(v)parts.push(v==='invest'?'سرمایه‌گذاری':'سکونت');
        v=getF('household');if(v)parts.push({single:'استفادهٔ شخصی',couple:'دو نفره',family:'خانوادگی',roommates:'هم‌خانه‌ای'}[v]);
        if(getF('buy_budget'))parts.push('بودجه تا '+rial(getF('buy_budget').v[1]));
      }else if(wf==='sell'){
        v=getF('hood');if(v)parts.push('ملک در '+findH(v).n);
        v=getF('prop_area');if(v)parts.push(fa(v,0)+' متر');
        v=getF('sale_urgency');if(v)parts.push(v==='fast'?'فروش فوری':'بدون عجله، حداکثر قیمت');
      }else if(wf==='invest'){
        v=getF('invest_objective');if(v)parts.push({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش کوتاه‌مدت',commercial:'اجارهٔ تجاری',development:'پتانسیل توسعه',diversify:'تنوع پرتفوی'}[v]);
        v=getF('invest_capital');if(v)parts.push('سرمایه تا '+rial(v.v[1]));
      }
      if(!parts.length)return '';
      return 'پس فعلاً این‌ها را از حرف‌هایتان برداشت کردم: <b>'+parts.map(esc).join('، ')+'</b>.';
    },
    turn:function(){
      /* short per-turn ack of newly captured facts */
      var c=ctx(),recent=[],i;
      for(i=c.log.length-1;i>=0&&recent.length<3;i--){
        var e=c.log[i];var f=c.fields[e.slot];
        if(!f||f.status!=='confirmed')continue;
        if(Date.now()-e.t>2500)break;
        var sh=show(e.slot,f.v);
        if(sh&&recent.indexOf(sh)<0)recent.unshift(sh);
      }
      return recent.length?('✓ '+recent.join('، ')+' ثبت شد.'):'';
    }
  };
  function show(id,v){
    if(v===null||v===undefined)return '';
    if(id==='budget_dep'||id==='budget_rent'||id==='buy_budget'||id==='invest_capital'||id==='expected_price'||id==='min_price'){
      if(v&&v.open)return 'بدون سقف';
      if(v&&v.v)return rial(v.v[0])+(v.v[1]!==v.v[0]?' تا '+rial(v.v[1]):'');
      return '';
    }
    if(id==='household')return {single:'تنهایی',couple:'دو نفره',family:'خانواده',roommates:'هم‌خانه'}[v]||String(v);
    if(id==='work_loc'||id==='uni_loc'||id==='hood'){try{return findH(v).n}catch(e){return String(v)}}
    if(id==='prefs')return (v||[]).map(function(x){return ({parking:'پارکینگ',elevator:'آسانسور',balcony:'بالکن',quiet:'سکوت',metro:'مترو',storage:'انباری'})[x]||x}).join('، ');
    if(id==='purpose')return v==='invest'?'سرمایه‌گذاری':'سکونت';
    if(id==='invest_objective')return ({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش سریع',commercial:'تجاری',development:'توسعه',diversify:'تنوع'})[v]||String(v);
    if(id==='prop_new')return 'نوساز';
    if(typeof v==='number')return fa(v,0);
    return String(v);
  }

  function askNext(){
    if(!COL.active)return;
    var wf=COL.wf;
    var cl=needClarify();
    if(cl){
      var f=fMeta(cl);f._clar=true;
      botC(ASK[cl].q[0],null);
      COL.confirming={type:'clarify',id:cl};
      return;
    }
    var m=missing(wf);
    if(!m.length){complete();return}
    var top=m[0],a=ASK[top.id];
    var p=personaOf(wf),tone=P_TONE[p]||P_TONE.general;
    var q=a.q[Math.floor(Math.random()*a.q.length)];
    botC(tone.q+q+(a.why?'<div class="note" style="margin-top:4px">'+esc(a.why)+'</div>':''),null);
    COL.expecting=top.id;
    try{a11yify($('#v-landing')||document.body)}catch(e){}
  }

  /* value clarification for «نوساز» (§4.4 example) */
  function clarify(text){
    var nt=nz(text);
    if(/الزامی|فقط نوساز|حتماً نوساز|حتما نوساز|کاملاً/.test(nt)){setF('prop_age',3,{src:'clarify',hard:true});return true}
    if(/تا ۵|تا 5|پنج سال|زیر پنج|۵ سال|5 سال/.test(nt)){setF('prop_age',5,{src:'clarify',hard:true});return true}
    if(/بازسازی|باز ساز/.test(nt)){setF('prop_age',10,{src:'clarify',hard:true});setF('renov_ok','yes',{src:'clarify',soft:true});return true}
    if(/مهم نیست|فرقی ندارد|فرقی نداره/.test(nt)){markUnknown('prop_age');markUnknown('prop_new');return true}
    return false;
  }

  /* parse an answer for a specific expected field */
  function answer(id,text){
    var nt=nz(text),t=String(text||'');
    if(/مهم نیست|فرقی ندارد|فرقی نداره|رد|نمی ?دانم|نمی ?دونم|بدون سقف.*نمی/.test(nt)&&!FL[id].fin){
      markUnknown(id);return {ok:true,skip:true};
    }
    switch(id){
      case 'budget_dep': case 'budget_rent': case 'buy_budget': case 'invest_capital': case 'expected_price': case 'min_price':{
        if(/بدون سقف|نامحدود|سقف ندار/.test(nt)&&id!=='min_price'){setF(id,{open:true},{src:'answer',fin:true});return {ok:true}}
        var clean=stripFin(t);
        var r=parseMoneyRangeFA(clean);
        if(r&&r.ok){var p=r.value.split('|');setF(id,{v:[+p[0],+p[1]]},{src:'answer',fin:true});return {ok:true}}
        var m=parseMoneyFA(clean);
        if(m&&m.ok){setF(id,{v:[m.value,m.value]},{src:'answer',fin:true});return {ok:true}}
        return {ok:false};
      }
      case 'household':{
        if(/تنهایی|فقط خودم/.test(nt)){setF('household','single',{src:'answer'});return {ok:true}}
        if(/هم ?خونه|هم ?اتاق/.test(nt)){setF('household','roommates',{src:'answer'});return {ok:true}}
        if(/زوج|دو نفره|دو نفر|من و همسر|من و خانم|من و اقام|تازه ازدواج/.test(nt)){setF('household','couple',{src:'answer'});return {ok:true}}
        if(/خانواده|بچه|فرزند|سه نفر|چهار نفر|پنج نفر/.test(nt)){setF('household','family',{src:'answer'});var fm=parseCountFA(nt);if(fm&&fm.ok&&fm.value>=3)setF('family_members',fm.value,{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'work_loc': case 'uni_loc': case 'hood':{
        var hl=(typeof HOODS!=='undefined')?HOODS:[],i;
        if(/فرقی نداره|فرق ندارد|هر جا|هرجا/.test(nt)){markUnknown(id);return {ok:true,skip:true}}
        for(i=0;i<hl.length;i++){if(t.indexOf(hl[i].n)>=0){setF(id,hl[i].id,{src:'answer',hard:id!=='hood'});return {ok:true}}}
        return {ok:false};
      }
      case 'work_weight':{
        if(/کار|هر دو.*کار|کار مهم/.test(nt)&&!/دانشگاه/.test(nt)){setF('work_weight','work',{src:'answer'});return {ok:true}}
        if(/دانشگاه/.test(nt)&&!/کار/.test(nt)){setF('work_weight','uni',{src:'answer'});return {ok:true}}
        if(/هر دو|برابر|یکسان/.test(nt)){setF('work_weight','both',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'prop_new':{
        if(/الزامی|فقط نوساز|حتما/.test(nt)){setF('prop_new','new',{src:'answer',hard:true});setF('prop_age',3,{src:'answer',hard:true});return {ok:true}}
        if(/تا ۵|تا 5|پنج سال|۵ سال|5 سال/.test(nt)){setF('prop_new','recent',{src:'answer'});setF('prop_age',5,{src:'answer',hard:true});return {ok:true}}
        if(/مهم نیست|فرقی/.test(nt)){markUnknown('prop_new');return {ok:true,skip:true}}
        return {ok:false};
      }
      case 'prop_age': case 'rooms': case 'm2': case 'prop_area': case 'prop_rooms': case 'family_members':{
        var c=parseCountFA(stripFin(t));
        if(c&&c.ok&&c.value>0&&c.value<2000){setF(id,c.value,{src:'answer',hard:id==='prop_age'});return {ok:true}}
        return {ok:false};
      }
      case 'purpose':{
        if(/سرمایه|سود|اجاره بدهم|درآمد/.test(nt)){setF('purpose','invest',{src:'answer'});return {ok:true}}
        if(/سکونت|زندگی|خودم/.test(nt)){setF('purpose','residence',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_objective':{
        if(/اجاره|اجاره‌ای|rental/.test(nt)&&/سود|درآمد|هدف/.test(nt)){setF('invest_objective','rent_income',{src:'answer'});return {ok:true}}
        if(/حفظ ارزش|تورم/.test(nt)){setF('invest_objective','inflation_hedge',{src:'answer'});return {ok:true}}
        if(/رشد|بزرگ|بالا بره/.test(nt)){setF('invest_objective','appreciation',{src:'answer'});return {ok:true}}
        if(/زمین/.test(nt)){setF('invest_objective','land_bank',{src:'answer'});return {ok:true}}
        if(/فروش|کوتاه/.test(nt)){setF('invest_objective','resale',{src:'answer'});return {ok:true}}
        if(/تجاری|مغازه|دفتر/.test(nt)){setF('invest_objective','commercial',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_horizon':{
        if(/کوتاه|۱ سال|یک سال|۲ سال|دو سال/.test(nt)){setF('invest_horizon','کوتاه‌مدت',{src:'answer'});return {ok:true}}
        if(/۵|پنج|بلند|۱۰|ده/.test(nt)){setF('invest_horizon','بلندمدت',{src:'answer'});return {ok:true}}
        if(/۳|سه/.test(nt)){setF('invest_horizon','میان‌مدت',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_liquidity':{
        if(/سریع|بالا|مهم/.test(nt)){setF('invest_liquidity','بالا',{src:'answer',hard:true});return {ok:true}}
        if(/مهم نیست|فرقی|بلند/.test(nt)){setF('invest_liquidity','مهم نیست',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_risk':{
        if(/بی ?ریسک|کم |محافظه/.test(nt)){setF('invest_risk','کم',{src:'answer'});return {ok:true}}
        if(/بالاست|زیاد|قبول/.test(nt)){setF('invest_risk','بالا',{src:'answer'});return {ok:true}}
        if(/متوسط|وسط/.test(nt)){setF('invest_risk','متوسط',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'ownership':{
        if(/ارث/.test(nt)){setF('ownership','inherited',{src:'answer'});return {ok:true}}
        if(/مشاع|شریک|مشترک/.test(nt)){setF('ownership','joint',{src:'answer'});return {ok:true}}
        if(/شخصی|تک ?برگ|سند دارم/.test(nt)){setF('ownership','single',{src:'answer'});setF('docs','سند تک‌برگ',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'docs':{
        if(/تک ?برگ/.test(nt)){setF('docs','سند تک‌برگ',{src:'answer'});return {ok:true}}
        if(/رهن|ماده ?۱۰۰|ماده 100|مدیرتبع|منگنه/.test(nt)){setF('docs','رهن/مادهٔ ۱۰۰',{src:'answer'});return {ok:true}}
        if(/ورث|ارث/.test(nt)){setF('docs','ورثه‌ای',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'sale_motivation':{
        if(/مهاجرت/.test(nt)){setF('sale_motivation','مهاجرت',{src:'answer'});return {ok:true}}
        if(/تعویض|بزرگ ?تر|ارتفاع/.test(nt)){setF('sale_motivation','تعویض ملک',{src:'answer'});return {ok:true}}
        if(/نقد|پول نیاز|نیاز مالی/.test(nt)){setF('sale_motivation','نقد شدن',{src:'answer'});return {ok:true}}
        var free=t.replace(/^\s+|\s+$/g,'');setF('sale_motivation',free,{src:'answer'});return {ok:true};
      }
      case 'sale_urgency':{
        if(/فوری|سریع|عجله|زودتر/.test(nt)){setF('sale_urgency','fast',{src:'answer',hard:true});return {ok:true}}
        if(/حداکثر|قیمت بهتر|عجله ندار|منتظر/.test(nt)){setF('sale_urgency','maxvalue',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'prefs':{
        var pf=[],base=(getF('prefs')||[]);
        if(/پارکینگ/.test(nt)&&base.indexOf('parking')<0)pf.push('parking');
        if(/آسانسور|اسانسور/.test(nt)&&base.indexOf('elevator')<0)pf.push('elevator');
        if(/بالکن|تراس/.test(nt)&&base.indexOf('balcony')<0)pf.push('balcony');
        if(/سکوت|آرام/.test(nt)&&base.indexOf('quiet')<0)pf.push('quiet');
        if(/مترو/.test(nt)&&base.indexOf('metro')<0)pf.push('metro');
        if(/انباری/.test(nt)&&base.indexOf('storage')<0)pf.push('storage');
        if(/مهم نیست|هیچی|ندارم|نه/.test(nt)&&!pf.length){markUnknown('prefs');return {ok:true,skip:true}}
        if(pf.length){setF('prefs',base.concat(pf),{src:'answer',soft:true});return {ok:true}}
        return {ok:false};
      }
      case 'timeline':{
        var free2=t.replace(/^\s+|\s+$/g,'');setF('timeline',free2,{src:'answer'});return {ok:true};
      }
    }
    return {ok:false};
  }

  /* contradiction detection: a new answer clashing with a confirmed field */
  function contradictions(id){
    var out=[];
    if(id==='prop_age'&&isHard('prop_age')&&getF('prop_new')==='new'&&getF('prop_age')>5){
      out.push('قبلاً «نوساز» را مهم گفته بودید؛ حالا حداکثر عمر '+fa(getF('prop_age'),0)+' سال ثبت شد — همین را ثبت کنم یا نوساز همچنان الزامی است؟');
    }
    return out;
  }

  /* per-turn feed: returns true if consumed */
  function feed(text){
    if(!COL.active)return false;
    var t=String(text),nt=nz(t);
    if(/^\s*(منو|راهنما|لغو|بستن|انصراف)\s*$/.test(nt)){usrC(t);stop();botC('جمع‌بندی همین‌جا نگه داشته شد — هر وقت خواستید دوباره شروع کنید. چیزی از دست نرفته است.',null);return true}
    usrC(t);
    /* explicit fix mode */
    if(COL.fix){
      var id=COL.fix;COL.fix=null;
      if(/پاک کن|حذف/.test(nt)){markUnknown(id);profileCard();return true}
      var r=answer(id,t);
      if(r.ok){profileCard();botC('اصلاح شد ✓',null)}
      else botC('متوجه مقدار نشدم — دوباره بنویسید یا «رد» بفرستید.',null);
      return true;
    }
    /* clarification answer pending */
    if(COL.confirming&&COL.confirming.type==='clarify'){
      COL.confirming=null;
      if(clarify(t)){botC('ثبت شد ✓',null);askNext();return true}
      /* not a clarity answer → treat as free extraction and keep going */
      extract(t,'turn');
      askNext();return true;
    }
    /* 1) multi-slot extraction — catch everything given */
    var found=extract(t,'turn');
    /* 2) answer for the currently expected slot */
    var exp=COL.expecting,res=null;
    if(exp){
      res=answer(exp,t);
      if(res.ok){
        if(!res.skip&&FL[exp].fin){
          /* financial values are read back explicitly — never silent (§2.1) */
          botC('ثبت شد: <b>'+esc(show(exp,getF(exp)))+'</b>',null);
        }
        COL.expecting=null;
      }else if((exp==='work_loc'||exp==='uni_loc'||exp==='hood')&&/نزدیک|حوالی|سمت|محله|محدوده|منطقه/.test(nt)){
        /* honest handling of areas outside the sample dataset (§ honesty rules) */
        var names=(typeof HOODS!=='undefined')?HOODS.map(function(h){return h.n}).join('، '):'';
        botC('«'+esc(t.replace(/نزدیک|حوالی|به|در|سمت|من|کارم|دانشگاهم|محلم|می‌خوام|میخوام/g,'').replace(/^\s+|\s+$/g,''))+'» در دادهٔ نمونهٔ سامانه نیست — محله‌های نمونه: '+esc(names)+'. از این‌ها کدام به منطقهٔ موردنظرتان نزدیک‌تر است؟ (یا بنویسید «مهم نیست»)',null);
        return true;
      }
    }
    /* 3) contradiction surfacing */
    var cons=exp?contradictions(exp):[];
    if(cons.length){botC('یک نکته: '+esc(cons[0]),null);COL.expecting=exp;/* re-ask same slot */}
    /* 4) dynamic persona check (§6.1) — announce reprioritization once per change */
    personaTurn();
    /* 5) ack + summary + next single question (§4.6) */
    var ack=SUM.turn();
    var p=personaOf(COL.wf);
    if(ack)botC(ack,null);
    /* 6) if both rent financials now known → confirm both explicitly */
    if(COL.wf==='rent'&&getF('budget_dep')&&getF('budget_rent')&&!COL.finConf){
      COL.finConf=true;
      var d=getF('budget_dep'),rr=getF('budget_rent');
      botC('پس مالی: ودیعه <b>'+(d.open?'بدون سقف':rial(d.v[0])+(d.v[1]!==d.v[0]?' تا '+rial(d.v[1]):''))+'</b> و اجارهٔ ماهانه <b>'+rial(rr.v[0])+(rr.v[1]!==rr.v[0]?' تا '+rial(rr.v[1]):'')+'</b> — درست است؟ اگر عددی اشتباه ثبت شده بگویید تا اصلاح کنم.',null);
      askNext();
      return true;
    }
    askNext();
    return true;
  }
  COL._lastExpect=null;
  var _lastPersona=null;
  function personaTurn(){
    var p=personaOf(COL.wf);
    if(_lastPersona&&_lastPersona!==p&&COL.wf){
      _lastPersona=p;
      botC('با این حرف‌هایتان، تصویرم از شرایط شما عوض شد — اولویت سؤال‌ها را هم بر همان اساس مرتب می‌کنم.',null);
    }else if(!_lastPersona)_lastPersona=p;
  }
  function stop(){COL={active:false,wf:null,fix:null,confirming:null,turns:0}}

  /* ── completion: profile card → explicit confirm → hand-off (§4.7) ── */
  function complete(){
    var wf=COL.wf;
    profileCard();
    botC('اگر همه‌چیز درست است بنویسید <b>«درسته»</b> — یا هر موردی را اصلاح کنید.',null);
    COL.confirming={type:'final'};
  }
  function profileCard(){
    var c=ctx().fields,keys=[],k;
    for(k in c){if(c[k]&&c[k].status==='confirmed'&&c[k].v!==null)keys.push(k)}
    if(!keys.length)return;
    var h='<div class="e30-profcard"><b>آن‌چه تا الان از شرایطتان فهمیدم</b>';
    keys.slice(0,9).forEach(function(id){
      h+='<div class="prow"><span>'+esc(SLOT_LABEL[id]||id)+':</span><b>'+esc(show(id,c[id].v))+
        ' <span class="pact" data-cba="e30fix" data-slot="'+qesc(id)+'">اصلاح</span></b></div>';
    });
    h+='</div>';
    botC(h,null);
    try{a11yify($('#v-landing')||document.body)}catch(e){}
  }
  CBACT.e30fix=function(el){
    var slot=el.getAttribute('data-slot');
    if(!COL.active)COL={active:true,wf:COL.wf||guessWf(),fix:null,confirming:null,turns:0};
    COL.fix=slot;COL.confirming=null;
    botC('مقدار جدید برای «'+esc(SLOT_LABEL[slot]||slot)+'» را بنویسید (یا «پاک کن»):',null);
  };
  function guessWf(){return COL.wf||'rent'}

  /* ── hand-off to deterministic engine — only confirmed values, never defaults ── */
  function handoff(){
    var wf=COL.wf,d=COL;stop();
    botC('عالی — جمع‌بندی کامل شد. می‌رویم سراغ گزینه‌ها:',null);
    try{
      if(wf==='rent'){
        ceStart('rent');
        var D=wd('rent').data;defP(D);
        var dep=getF('budget_dep'),rent=getF('budget_rent');
        if(dep&&dep.v){D.B=D.B||{inc:1500000000,depB:15000000000,rentB:0,chg:50000000,incr:100000000};D.B.depB=dep.v[1];D.depOpen=!!dep.open;D._depSet=1}
        if(rent&&rent.v){D.B=D.B||{inc:1500000000,depB:15000000000,rentB:0,chg:50000000,incr:100000000};D.B.rentB=rent.v[1];D.rentBOpen=!!rent.open;D._rentbSet=1}
        /* persona-driven priorities — from the DYNAMIC persona (§2.7 fix) */
        var p=personaOf('rent'),P=D.P;
        if(p==='family'){P.school=5;P.quiet=4;P.metro=2;P.work=3;if(D.P.park!==true&&isFav('parking'))P.park=true}
        else if(p==='couple'){P.quiet=3;P.work=4;P.metro=3}
        else if(p==='student'){P.metro=5;P.school=1;P.work=4}
        else if(p==='retiree'){P.quiet=5;P.school=1;P.work=1;P.elev=true}
        else {P.metro=4;P.work=4;P.school=2}
        P.persona=({family:'خانواده',couple:'دو نفره',student:'دانشجو/کاری',retiree:'موقت',roommates:'دانشجو/کاری'})[p]||'دانشجو/کاری';
        var v;
        if((v=getF('rooms'))!=null)P.beds=+v;
        if((v=getF('m2'))!=null)P.minM2=+v;
        if((v=getF('prop_age'))!=null){P.maxAge=+v;P._ageHard=true}
        else{P.maxAge=30;P._ageHard=false} /* «مهم نیست» → wide, soft */
        (getF('prefs')||[]).forEach(function(x){
          if(x==='elevator')P.elev=true;else if(x==='parking')P.park=true;
          else if(x==='metro')P.metro=5;else if(x==='quiet')P.quiet=5;
        });
        var w=getF('work_weight');
        if(w==='work'&&getF('work_loc'))P.work=5;
        if(w==='uni'&&getF('uni_loc'))P.work=5;
        if(w==='both'){P.work=4;P.metro=4} /* equal weight → balanced access (§4.8) */
        if(getF('commute_max'))P._commuteMax=getF('commute_max');
        D._e30=1;save();
        /* jump to the first missing REQUIRED step — financial never skipped (§2.1) */
        if(!dep||!dep.v)ceJump('dep');
        else if(!rent||!rent.v)ceJump('rentb');
        else ceJump('imps');
        return true;
      }
      if(wf==='buy'){
        ceStart('buy');
        var D2=wd('buy').data;defP(D2);defPR(D2);
        var bud=getF('buy_budget');
        if(bud&&bud.v){D2.budg=bud.v[1];D2.budgOpen=!!bud.open;D2._budgSet=1}
        if(getF('purpose')==='invest'){D2.P.metro=2;D2.P.school=2;D2.P.work=2}
        var v2;
        if((v2=getF('rooms'))!=null)D2.PR.beds=+v2;
        if((v2=getF('m2'))!=null)D2.PR.m2=[+v2,Math.max(+v2+30,120)];
        if((v2=getF('prop_age'))!=null)D2.PR.age=[0,+v2];
        (getF('prefs')||[]).forEach(function(x){
          if(x==='elevator')D2.PR.elev='yes';else if(x==='parking')D2.PR.park='yes';
          else if(x==='balcony')D2.PR.balc='yes';
        });
        D2._e30=1;save();
        if(!bud||!bud.v)ceJump('budg');else ceJump('imps');
        return true;
      }
      if(wf==='sell'){
        ceStart('sell');
        var D3=wd('sell').data;
        ['prop_area','prop_rooms','sale_urgency'].forEach(function(id){var v3=getF(id);if(v3!=null)D3[id]=v3});
        var hp=getF('hood');if(hp)D3.hood=hp;
        var ep=getF('expected_price');if(ep&&ep.v)D3.expected=ep.v[0];
        var mp=getF('min_price');if(mp&&mp.v)D3.minprice=mp.v[0];
        var own=getF('ownership');if(own)D3.ownership=own;
        var dc=getF('docs');if(dc)D3.docs=dc;
        var mo=getF('sale_motivation');if(mo)D3.motivation=mo;
        D3._e30=1;save();
        ceJump('s_own');
        return true;
      }
      if(wf==='invest'){
        ceStart('invp');
        var D4=wd('invp').data;
        var ob=getF('invest_objective');if(ob)D4.objective=ob;
        var cap=getF('invest_capital');if(cap&&cap.v)D4.cap=cap.v[1];
        var hz=getF('invest_horizon');if(hz)D4.horizon=hz;
        var lq=getF('invest_liquidity');if(lq)D4.liquidity=lq;
        var rk=getF('invest_risk');if(rk)D4.risk=rk;
        var hp2=getF('hood');if(hp2)D4.hood=hp2;
        D4._e30=1;save();
        ceJump('i_obj');
        return true;
      }
    }catch(e){console.error('E30 handoff',e)}
    return true;
  }
  function isFav(x){return (getF('prefs')||[]).indexOf(x)>=0}

  /* final-confirm watcher: «درسته» after profile card → handoff */
  function maybeFinal(text){
    if(!(COL.active&&COL.confirming&&COL.confirming.type==='final'))return false;
    var nt=nz(text);
    if(/درسته|درست است|درست فع|اوکی|باشه|تأیید|تایید|همینه|همین/.test(nt)){usrC(text);handoff();return true}
    return false;
  }

  /* ── intent routing for free-form openings (§4.2) — before any fixed flow ── */
  function route(text,raw){
    if(!S.auth)return false;
    var t=raw||text;
    if(COL.active){
      if(maybeFinal(t))return true;
      if(feed(t))return true;
      return false;
    }
    var nt=nz(t);
    var wantsRealEstate=/خونه|خانه|ملک|آپارتمان|اجاره|کرایه|رهن|خرید|بخرم|فروش|بفروشم|سرمایه ?گذاری|زمین|مغازه|سویییت|سوئیت/.test(nt);
    if(!wantsRealEstate)return false;
    if(!/می ?خوام|می ?خواهم|دنبال|اجاره ? نشین|هستم|دارم|سالمه|سالانه|باید|لازم|زوج|خانواده|دانشجو|هم ?خونه/.test(nt)&&!getF('household'))return false;
    /* paid-service intents take precedence */
    if(/تحلیل (جامع )?محله/.test(nt)&&CE.f!=='rent'&&CE.f!=='buy'){return false} /* leave to flow/service */
    var intent=null;
    if(/فروش|بفروشم|می ?فروشم|فروشنده/.test(nt)&&!/خرید|بخرم|اجاره/.test(nt))intent='sell';
    else if(/سرمایه ?گذاری|سود|بخرم.*اجاره بدهم|حفظ ارزش/.test(nt)||(/بخرم|خرید/.test(nt)&&/سرمایه/.test(nt)))intent='invest';
    else if(/اجاره ? می ?دم|موجر|مستأجر دارم|مستاجر دارم/.test(nt))intent='landlord';
    else if(/اجاره|کرایه|استیجار|رهن/.test(nt))intent='rent';
    else if(/خرید|بخرم|مبایعه/.test(nt))intent='buy';
    if(!intent)return false;
    usrC(t);
    extract(t,'open'); /* harvest the opening message (§4.2) */
    _lastPersona=null;
    return start(intent);
  }

  E30.discAPI={route:route,active:active,start:start,getF:getF,setF:setF,ctx:ctx,personaOf:personaOf,
    profileCard:profileCard,missing:missing,show:show,markUnknown:markUnknown,SLOT_LABEL:SLOT_LABEL};
  return E30.discAPI;
})();


/* ═══════════════ V0.30 — E30 FLOWS: sale workflow, investment workflow, strict filters,
   stage sync, slider locking. Extends the deterministic SCRIPTS registry (no parallel engine).
   ═══════════════ */
E30.flows=(function(){
  /* ── strict filter helpers (§7.1 / §2.2 / §2.3) ──
     Hard constraints NEVER return a violating listing as a match. */
  function rentPass(x,D){
    var P=D.P||{};
    if(P.beds>0&&x.beds<P.beds)return false;
    if(P.elev&&!x.elev)return false;
    if(P.park&&!x.park)return false;
    if(P._ageHard&&x.age>P.maxAge)return false;
    if(P.minM2&&x.m2<P.minM2)return false;
    if(D.B&&!D.rentBOpen&&D.B.rentB>0&&x.rent>D.B.rentB)return false;
    if(D.B&&!D.depOpen&&D.B.depB>0&&x.dep>D.B.depB)return false;
    return true;
  }
  /* total price = m2 × ppm — enforced against the confirmed budget (§8.1 / §2.3) */
  function buyPass(x,D){
    if(!blPassBase(x,D))return false;
    if(D.budg>0&&!D.budgOpen){
      var tot=x.m2*x.ppm;
      if(tot>D.budg)return false;
    }
    return true;
  }
  function blPassBase(x,D){ /* original blPass logic — kept intact under the E30 override */
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

  /* ── stage sync (§2.4): conversation step ⇄ workflow state ⇄ persistence ⇄ library ⇄ resume ── */
  function syncStage(){
    try{
      if(!CE.f||CE.f==='gate')return;
      var w=wd(CE.f);
      if(!w)return;
      var sc=SCRIPTS[CE.f];
      var target=(CE.i>=sc.length)?sc.length:(CE.i+1);
      if(w.step!==target){w.step=target;save()}
      if(w.m===undefined)w.m=CE.f;
    }catch(e){}
  }

  /* ── slider locking (§2.5): a committed slider freezes; edit only via بازگشت/اصلاح ── */
  function lockSliders(){
    try{
      var boxes=[document.getElementById('chatB'),document.getElementById('fchB'),document.getElementById('dashB')];
      boxes.forEach(function(b){
        if(!b||!b.offsetParent)return;
        var msgs=b.querySelectorAll('.msg.bot');
        if(!msgs.length)return;
        /* every bot bubble except the last one: sliders are read-only history */
        for(var i=0;i<msgs.length-1;i++){
          var sl=msgs[i].querySelectorAll('.rsld');
          Array.prototype.forEach.call(sl,function(s){lockOne(s,true)});
        }
        /* last bubble: only locked if this step was already committed (committed marker) */
        var D=(CE.f&&SCRIPTS[CE.f])?wd(CE.f).data:null;
        var lastSl=msgs[msgs.length-1].querySelectorAll('.rsld');
        Array.prototype.forEach.call(lastSl,function(s){
          var slot=s.getAttribute('data-slot');
          if(D&&D._slid&&D._slid[slot])lockOne(s,false);
        });
      });
    }catch(e){}
  }
  function lockOne(s,hard){
    if(s.getAttribute('data-locked')==='1')return;
    s.setAttribute('data-locked','1');
    var inp=s.querySelector('input[type=range]');
    if(inp)inp.disabled=true;
    var b=s.querySelector('[data-cba="slSet"]');
    if(b){b.disabled=true;b.textContent='✓ ثبت شد';}
    if(hard){
      var hint=s.querySelector('.cwr-hint');
      if(hint)hint.textContent='این مقدار ثبت شده است — برای تغییر از «بازگشت» یا «اصلاح» استفاده کنید.';
    }
  }
  /* slSet guard: refuse when the slider is locked or already committed for this slot */
  function slGuard(el){
    var rid=el.getAttribute('data-rsld-for'),r=rid?document.getElementById(rid):null;
    if(r&&r.closest('.rsld')&&r.closest('.rsld').getAttribute('data-locked')==='1'){toast('این مقدار ثبت شده است — با «بازگشت» به مرحله برگردید');return false}
    var st=(CE.f&&SCRIPTS[CE.f])?SCRIPTS[CE.f][CE.i]:null;
    var D=(CE.f)?wd(CE.f).data:null;
    if(st&&st.money&&D&&r){
      var slot=r.closest('.rsld').getAttribute('data-slot');
      if(slot&&D._slid&&D._slid[slot]){toast('این مقدار قبلاً ثبت شده است');return false}
    }
    return true;
  }

  /* ═══ SELL — complete seller workflow (spec §9, 19 stages) ═══ */
  function sellCards(D){
    /* neighborhood stats card for the seller */
    var h=findH(D.hood),avg=h.buyBase;
    var est=D.prop_area?Math.round(avg*D.prop_area):0;
    var lo=Math.round(est*0.93),hi=Math.round(est*1.07);
    return '<div class="e30-salestats"><div class="kv"><span>میانگین قیمت هر متر — '+esc(h.n)+' (دادهٔ نمونه)</span><b>'+rial(avg)+'</b></div>'+
      (est?'<div class="kv"><span>برآورد ارزش ملک شما</span><b>'+rial(est)+'</b></div>'+
      '<div class="kv"><span>بازهٔ منطقی اعلام</span><b>'+rial(lo)+' تا '+rial(hi)+'</b></div>':'')+
      '</div>';
  }
  var SELL=[
    {id:'s_own',q:'وضعیت مالکیت ملک را دقیق بگویید:',
     chips:function(){return [['سند شخصی دارد','single'],['ارثی است','inherited'],['مشاعی (شرکا دارد)','joint'],['مدیرتبع/رهن','mort']]},
     set:function(D,v){D.ownership=v;if(v==='inherited')D.docs='ورثه‌ای';if(v==='mort')D.docs='رهن/مادهٔ ۱۰۰';if(v==='single')D.docs='سند تک‌برگ';return null}},
    {id:'s_docs',pre:function(D){return D.ownership==='inherited'||D.ownership==='joint'},
     q:function(D){return D.ownership==='inherited'?'انحصار وراثت صادر شده است؟':'توافق همهٔ شرکا را برای فروش دارید؟'},
     chips:function(){return [['بله','yes'],['خیر','no'],['نمی‌دانم','unknown']]},
     set:function(D,v){D.docsOk=v;return null}},
    {id:'s_note',pre:function(D){return D.docsOk==='no'||D.docsOk==='unknown'},
     q:function(D){return 'تا کامل شدن مدارک، فروش فقط به‌صورت «قیمت‌گذاری و آماده‌سازی» پیش می‌رود — معامله رسمی نیازمند سند کامل است. فعلاً ارزیابی و برنامهٔ فروش را می‌چینیم.'},
     chips:function(){return [['متوجهم، ادامه','ok']]},set:function(){return null}},
    {id:'s_area',count:true,q:'متراژ ملک چند متر است؟ (عدد تایپ کنید)',kind:'num',
     set:function(D,v){var n=pd(v);if(!n||n<10||n>5000)return 'ERR';D.prop_area=n;return null},
     err:'متراژ را با عدد بنویسید (مثلاً ۸۵).'},
    {id:'s_rooms',count:true,q:'چند خواب است؟',chips:function(){return [['۰','0'],['۱','1'],['۲','2'],['۳','3'],['۳+','4']]},
     set:function(D,v){D.prop_rooms=+v;return null}},
    {id:'s_age',count:true,q:'عمر بنا؟',chips:function(){return [['نوساز','0'],['تا ۵','5'],['تا ۱۰','10'],['تا ۲۰','20'],['بیشتر','30']]},
     set:function(D,v){D.prop_age=+v;return null}},
    {id:'s_floor',count:true,q:'طبقه چندم است؟',kind:'num',chips:function(){return [['همکف','0'],['۱','1'],['۲','2'],['۳+','3']]},
     set:function(D,v){D.floor=+pd(v)||0;return null}},
    {id:'s_hood',q:'ملک در کدام محله است؟',
     set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله را دقیق بنویسید (مثلاً نارمک) یا از کارت‌ها انتخاب کنید.',
     cards:function(D){defP(D);return HOODS.slice(0,3).map(function(h){return chatHoodCard(h,'buy',D)}).join('')}},
    {id:'s_motiv',q:'انگیزهٔ فروش چیست؟',
     chips:function(){return [['مهاجرت','مهاجرت'],['تعویض ملک','تعویض ملک'],['نقد شدن','نقد شدن'],['ارث','ارث'],['دیگر','دیگر']]},
     set:function(D,v){D.motivation=v;return null}},
    {id:'s_urg',q:'کدام اولویت است؟',
     chips:function(){return [['فروش سریع','fast'],['حداکثر قیمت','maxvalue']]},
     set:function(D,v){D.sale_urgency=v;return null}},
    {id:'s_val',q:function(D){
       var t=sellCards(D);
       return '<b>ارزیابی بازار (بر پایهٔ دادهٔ نمونهٔ سامانه)</b>'+t+'<div class="note">این برآورد از میانگین نمونهٔ آگهی‌های سامانه است — نه کارشناسی رسمی.</div>'},
     chips:function(){return [['ادامه','ok'],['تحلیل جامع محله','!ha']]},
     acts:{ha:function(D){if(window.E30&&D.hood){ACT.hanalysis({getAttribute:function(a){return a==='data-h'?D.hood:(a==='data-m'?'buy':null)}})}}}},
    {id:'s_price',q:function(D){
       var h=findH(D.hood),est=D.prop_area?Math.round(h.buyBase*D.prop_area):0;
       return 'قیمت پیشنهادی اعلام: <b>'+rial(Math.round(est*(D.sale_urgency==='fast'?0.95:1.02)))+'</b> — '+(D.sale_urgency==='fast'?'(برای فروش سریع‌تر، کمی زیر میانگین)':'(کمی بالای میانگین با مجال مذاکره)')+'. قبول می‌کنید یا عدد خودتان را می‌گویید؟'},
     kind:'num',
     set:function(D,v){
       var m=parseMoneyFA(v);
       if(!m||!m.ok){var p2=E27.budgParse(v);if(p2&&p2.ok&&p2.n&&p2.n>0){D.ask=p2.n}else return 'ERR'}
       else D.ask=m.value;
       return null},
     err:'قیمت را به ریال بنویسید (مثلاً «۱۲ میلیارد»).'},
    {id:'s_min',q:'کف قیمت — پایین‌تر از چه مبلغی نمی‌فروشید؟ (برای فیلتر پیشنهادها)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.minprice=m.value;return null},
     err:'کف قیمت را به ریال بنویسید.'},
    {id:'s_prep',q:function(D){
       var h=findH(D.hood);
       return '<b>آماده‌سازی آگهی</b><div class="sect">'+
       '<div class="kv"><span>عنوان پیشنهادی</span><b>'+fa(D.prop_rooms||2,0)+' خواب '+fa(D.prop_area||0,0)+' متری، '+esc(h.n)+'</b></div>'+
       '<div class="kv"><span>نکات برجسته</span><b>'+(D.prop_age===0?'نوساز':fa(D.prop_age||0,0)+' سال ساخت')+(D.floor?'، طبقهٔ '+fa(D.floor,0):'')+'</b></div>'+
       '<div class="kv"><span>قیمت اعلامی</span><b>'+rial(D.ask||0)+'</b></div></div>این آگهی را تأیید می‌کنید؟'},
     chips:function(){return [['تأیید آگهی','!ok'],['تغییر قیمت','!rp']]},
     acts:{ok:function(D){D.approved=true;save();botC('✓ آگهی در وضعیت «آمادهٔ انتشار» ثبت شد. (انتشار واقعی نیازمند بک‌اند است — در سامانهٔ داخلی ثبت شد)',null);ceStep()},rp:function(){ceJump('s_price')}}},
    {id:'s_inq',q:function(D){return 'شبیه‌سازی ورود پیشنهاد خریدار: <b>'+rial(Math.round((D.ask||0)*0.94))+'</b> (۴٪ زیر قیمت اعلامی). با این پیشنهاد چه می‌کنید؟'},
     chips:function(){return [['رد می‌کنم (زیر کف)','!no'],['مذاکره','!neg'],['قبول','!yes']]},
     acts:{
       no:function(D){botC('پیشنهاد زیر کف شما رد شد — آگهی سر جای خودش می‌ماند.',null);ceJump('s_done')},
       neg:function(D){var c=Math.round((D.ask||0)*0.97);botC('پیشنهاد متقاعد '+rial(c)+' اعلام شد (تقریباً ۳٪ زیر قیمت). طرف مقابل می‌پذیرد ✓',null);D.deal=Math.round((D.ask||0)*0.97);ceJump('s_ctr')},
       yes:function(D){D.deal=D.ask;botC('با قیمت اعلامی توافق شد ✓',null);ceJump('s_ctr')}
     }},
    {id:'s_ctr',q:'قرارداد مبایعه‌نامه را در همین گفت‌وگو تنظیم می‌کنیم.',
     chips:function(){return [['باز کردن فرم قرارداد','!open']]},
     set:function(){return null},
     acts:{open:function(D){E28.ctrStart('buy')}}},
    {id:'s_done',q:function(D){
       var d=wd('sell');
       if(!d.done){d.done=true;addReq('sell','فروش','فروش ملک — '+(D.hood?findH(D.hood).n:'')+' '+fa(D.prop_area||0,0)+' متری',D.deal?'توافق شد':'در حال فروش',D.deal?rial(D.deal):'');save()}
       return '<b>جمع‌بندی فروش</b><div class="sect">'+
       '<div class="kv"><span>وضعیت</span><b>'+(D.deal?'توافق شد — قرارداد ثبت گردید':'آگهی فعال — در انتظار خریدار')+'</b></div>'+
       (D.deal?'<div class="kv"><span>قیمت نهایی</span><b>'+rial(D.deal)+'</b></div>':'')+
       '<div class="kv"><span>مرحلهٔ انتقال</span><b>'+(D.ownership==='single'?'سند آمادهٔ انتقال':'نیازمند تکمیل مدارک')+'</b></div></div>'},
     chips:function(){return [['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]},
     set:function(){return null}}
  ];

  /* ═══ INVEST — dedicated investment workflow (spec §10) ═══ */
  function yieldRow(label,val,cls){return '<div class="kv"><span>'+label+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+val+'</b></div>'}
  function investCard(D){
    var h=D.hood?findH(D.hood):HOODS[0];
    var price=D.prop_area?Math.round(h.buyBase*D.prop_area):Math.round(h.buyBase*70);
    var rentM=Math.round(h.avgRent*0.9);
    var gross=price?(rentM*12/price*100):0;
    var maint=6,vac=8; /* labeled assumptions, §10 honesty */
    var net=gross*((100-maint-vac)/100);
    var yoy=h.mkt.yoy;
    var risk=(gross>8?'نسبتاً بالا در این نمونه':'متوسط');
    return '<div class="e30-investcard">'+
      yieldRow('محله (نمونهٔ سامانه)',esc(h.n))+
      yieldRow('سرمایهٔ فرضی — ۷۰ متر',rial(price))+
      yieldRow('اجارهٔ ماهانهٔ تخمینی',rial(rentM))+
      yieldRow('بازده ناخالص سالانه',fa(Math.round(gross*10)/10,1)+'٪',gross>=10?'up':'')+
      yieldRow('بازده خالص (فرض خالی‌بودن ۸٪ + نگهداری ۶٪)',fa(Math.round(net*10)/10,1)+'٪')+
      yieldRow('رشد قیمت یک‌سالهٔ نمونه',pct(yoy),yoy>=0?'up':'down')+
      yieldRow('نقدشوندگی','آپارتمان مسکونی: متوسط؛ زمین: کم')+
      '</div><div class="note">همهٔ اعداد از دادهٔ نمونهٔ سامانه است و «پیش‌بینی» نیست — هیچ بازدهی تضمین نمی‌شود.</div>';
  }
  var INVP=[
    {id:'i_obj',q:'هدف اصلی سرمایه‌گذاری چیست؟',
     chips:function(){return [['درآمد اجاره','rent_income'],['رشد قیمت','appreciation'],['حفظ ارزش (تورم)','inflation_hedge'],['زمین','land_bank'],['فروش کوتاه‌مدت','resale'],['تجاری','commercial']]},
     set:function(D,v){D.objective=v;return null}},
    {id:'i_cap',money:true,q:'سرمایه‌ای که می‌خواهید وارد کنید حدوداً چقدر است؟ (ریال)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.cap=m.value;return null},
     err:'سرمایه را به ریال بنویسید (مثلاً «۱۰ میلیارد»).'},
    {id:'i_liq',pre:function(D){return !!D.cap},
     q:'چقدر از این مبلغ باید در دسترس بماند؟ (ملک به‌سرعت نقد نمی‌شود)',
     chips:function(){return [['همه‌اش آزاد باشد','all'],['بخشی کافی است','some'],['قفل بلندمدت اوکی است','long']]},
     set:function(D,v){D.liquidity=v;if(v==='all')botC('با این شرط، ملک گزینهٔ پرریسکی است — در تحلیل لحاظش می‌کنم.',null);return null}},
    {id:'i_hor',q:'افق سرمایه‌گذاری؟',
     chips:function(){return [['۲–۳ سال','کوتاه‌مدت'],['۵ سال','میان‌مدت'],['۱۰ سال+','بلندمدت']]},
     set:function(D,v){D.horizon=v;return null}},
    {id:'i_hood',q:'دامنهٔ جست‌وجو؟ (محله خاص یا «کل شهر»)',
     set:function(D,v){if(/همه|کل/.test(v)){D.hood=null;return null}var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله یا «کل شهر» را بنویسید.'},
    {id:'i_an',q:function(D){return '<b>تحلیل سرمایه‌گذاری</b>'+investCard(D)+(D.objective==='land_bank'?'<div class="note">برای زمین: وضعیت کاربری/سند باید خارج از سامانه استعلام شود — محلینو مشاور حقوقی نیست.</div>':'')},
     chips:function(){return [['ثبت تحلیل در کتابخانه','!save'],['محلهٔ دیگر','!oh'],['پایان','!end']]},
     acts:{
       save:function(D){
         var html='<h4>تحلیل سرمایه‌گذاری</h4>'+investCard(D);
         var it=E29.libAPI.saveArtifact({type:'invest',title:'تحلیل سرمایه‌گذاری — '+(D.hood?findH(D.hood).n:'کل شهر'),
           summary:'هدف: '+({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش سریع',commercial:'تجاری'})[D.objective||'']+' — بازده بر پایهٔ دادهٔ نمونه',
           artifact:{html:html,data:{objective:D.objective,cap:D.cap,hood:D.hood}},tokenCost:0,txnId:null});
         botC('✓ در کتابخانه ذخیره شد (بدون هزینه — این تحلیل از دادهٔ نمونهٔ داخلی ساخته می‌شود).',null);
         ceJump('i_done');
       },
       oh:function(){ceJump('i_hood')},
       end:function(){ceJump('i_done')}
     }},
    {id:'i_done',q:function(D){
       var d=wd('invp');
       if(!d.done){d.done=true;addReq('invest','سرمایه‌گذاری','تحلیل سرمایه‌گذاری — '+(D.objective||''),'کامل شد','هدف: '+(D.objective||'—'));save()}
       return 'گردش کار سرمایه‌گذاری تکمیل شد. یادآوری صادقانه: اعداد این تحلیل از <b>دادهٔ نمونهٔ سامانه</b> است و هیچ بازدهی تضمین نمی‌شود.'},
     chips:function(){return [['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]},
     set:function(){return null}}
  ];

  /* ═══ LANDLORD — rental listing workflow (§5.3 «Landlord / rental listing») ═══ */
  var LNDL=[
    {id:'l_role',q:'می‌خواهید ملکتان را اجاره دهید؟',
     chips:function(){return [['بله، اجارهٔ مسکونی','res'],['اقامتگاه کوتاه‌مدت','stay'],['فقط مشاورهٔ قیمت','price']]},
     set:function(D,v){D.ltype=v;return null}},
    {id:'l_hood',q:'ملک در کدام محله است؟',
     set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله را دقیق بنویسید (مثلاً یوسف‌آباد).'},
    {id:'l_price',q:function(D){
       var h=D.hood?findH(D.hood):HOODS[0];
       return 'بازهٔ رایج '+esc(h.n)+' (نمونهٔ سامانه): ودیعه '+rial(h.avgDep)+' با اجارهٔ '+rial(h.avgRent)+'. چه ترکیبی مدنظرتان است؟'},
     kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_dep=m.value;return null},
     err:'ودیعهٔ درخواستی را به ریال بنویسید.'},
    {id:'l_rent',kind:'num',q:'اجارهٔ ماهانهٔ درخواستی؟ (ریال)',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_rent=m.value;return null},
     err:'اجاره را به ریال بنویسید.'},
    {id:'l_rules',q:'شرط‌های اجاره؟ (چند مورد را با ویرگول بنویسید — یا «ندارد»)',kind:'text',
     set:function(D,v){if(/ندارد|نه/.test(v)){D.rules=[];return null}D.rules=v.split(/[،,]/).map(function(x){return x.replace(/^\s+|\s+$/g,'')}).filter(Boolean);return null}},
    {id:'l_sum',q:function(D){
       return '<b>خلاصهٔ آگهی موجر</b><div class="sect">'+
       '<div class="kv"><span>محله</span><b>'+esc(D.hood?findH(D.hood).n:'—')+'</b></div>'+
       '<div class="kv"><span>ودیعهٔ درخواستی</span><b>'+rial(D.ask_dep||0)+'</b></div>'+
       '<div class="kv"><span>اجارهٔ درخواستی</span><b>'+rial(D.ask_rent||0)+'</b></div>'+
       '<div class="kv"><span>شرط‌ها</span><b>'+esc((D.rules||[]).join('، ')||'ندارد')+'</b></div></div>ثبت شود؟'},
     chips:function(){return [['ثبت','!ok'],['ویرایش','!ed']]},
     acts:{ok:function(D){
         D.registered=true;save();
         addReq('rent','آگهی موجر','اجاره‌دهی — '+(D.hood?findH(D.hood).n:''),'ثبت شد',rial(D.ask_dep||0)+' / '+rial(D.ask_rent||0));
         botC('✓ ثبت شد. (انتشار عمومی نیازمند بک‌اند است — در سامانهٔ داخلی درخواست شما ثبت و قابل پیگیری است)',null);
         ceEnd()},
       ed:function(){ceJump('l_price')}}
     }
  ];

  function install(){
    SCRIPTS.sell=SELL;
    SCRIPTS.invp=INVP;
    SCRIPTS.lndl=LNDL;
    if(!MODBY.sell)MODBY.sell={v:'landing',t:'فروش ملک'};
    if(!MODBY.invp)MODBY.invp={v:'landing',t:'سرمایه‌گذاری ملکی'};
    if(!MODBY.lndl)MODBY.lndl={v:'landing',t:'اجاره‌دهی'};
    FRC.sell=['sell'];FRC.invest=['invp','invb','invr'];FRC.rent=['rent','lndl'];
    WSTEPS.sell=SELL.map(function(s){return s.id});
    WSTEPS.invp=INVP.map(function(s){return s.id});
    WSTEPS.lndl=LNDL.map(function(s){return s.id});
    /* registry note for honest provenance labels (srcBadge rule) */
    try{window.__E30FLOWS={sell:SELL.length,invp:INVP.length,lndl:LNDL.length}}catch(e){}
  }

  E30.flowsAPI={rentPass:rentPass,buyPass:buyPass,blPassBase:blPassBase,syncStage:syncStage,
    lockSliders:lockSliders,slGuard:slGuard,install:install,investCard:investCard};
  return E30.flowsAPI;
})();

/* replace the two deterministic hard filters with the strict E30 versions (§2.2, §2.3) */
function blPass(x,D){return window.E30?E30.flowsAPI.buyPass(x,D):E30.flowsAPI.blPassBase(x,D)}


/* ═══════════════ V0.30 — E30 UX: saved listings (§12), sharing independence (§14),
   project↔live-chat (§13), reminder dedupe (§16) ═══════════════ */
E30.ux=(function(){
  /* ── 1) Saved Listings ── */
  function store(){if(!S.savedListings)S.savedListings=[];return S.savedListings}
  function findListing(kind,id){
    try{
      if(kind==='rent'){var x=findL(id);if(x)return x}
      else{var b=findB(id);if(b)return b}
    }catch(e){}
    return null;
  }
  function upsert(kind,id){
    var st=store(),i;
    for(i=0;i<st.length;i++){if(st[i].kind===kind&&st[i].listingId===id){st.splice(i,1);save();return false}} /* toggle off */
    var x=findListing(kind,id);
    if(!x)return false;
    var ref=E30.chatRef();
    var h=findH(x.hood);
    st.unshift({id:E30.uid('SV'),kind:kind,listingId:id,
      title:x.t||('آگهی '+id),
      hood:h?h.n:'—',kindFa:kind==='rent'?'اجاره':'خرید',
      rent:x.rent||null,dep:x.dep||null,price:(x.m2&&x.ppm)?x.m2*x.ppm:null,
      m2:x.m2||null,beds:x.beds||null,age:x.age||null,floor:x.floor||null,
      elev:!!x.elev,park:!!x.park,
      seed:x.id||('L'+id),
      sourceChat:ref.chatId,sourceTitle:ref.chatTitle,savedAt:Date.now()});
    save();
    return true;
  }
  function remove(id){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st.splice(i,1);save();return true}}return false}

  var SV={tab:false};
  function savedFiltered(sq){
    var st=store().slice();
    if(sq){var q=String(sq).toLowerCase();st=st.filter(function(it){return (it.title+' '+it.hood).toLowerCase().indexOf(q)>=0})}
    return st;
  }
  function savedCard(it){
    var fin=it.kind==='rent'
      ?('ودیعه '+rial(it.dep||0)+' · اجاره '+rial(it.rent||0))
      :('قیمت کل '+rial(it.price||0)+' ('+rial(Math.round((it.price||0)/(it.m2||1)))+' هر متر)');
    return '<div class="e29-card e30-svcard">'+
      '<div class="e30-svimg">'+ph(it.seed,120,84,'')+'</div>'+
      '<div class="e30-svbody"><span class="etype t-analysis">'+esc(it.kindFa)+'</span>'+
      '<b class="ttl">'+esc(it.title)+'</b>'+
      '<span class="summ">'+esc(it.hood)+' · '+fa(it.m2||0,0)+' متر · '+fa(it.beds||0,0)+' خواب · '+fa(it.age||0,0)+' ساله</span>'+
      '<span class="summ">'+esc(fin)+'</span>'+
      '<span class="meta"><span>'+fd(it.savedAt)+'</span></span>'+
      '<span class="cardacts">'+
      '<button class="e29-cact" data-act="e30svOpen" data-sv="'+qesc(it.id)+'" title="مشاهدهٔ آگهی">'+e29ico('doc',15)+'</button>'+
      (it.sourceChat?'<button class="e29-cact" data-act="e29libChat" data-sess="'+qesc(it.sourceChat)+'" title="گفت‌وگوی اصلی">'+e29ico('chat',15)+'</button>':'')+
      '<button class="e29-cact" data-act="e30svDel" data-sv="'+qesc(it.id)+'" title="حذف از ذخیره‌ها" style="color:var(--danger)">'+e29ico('trash',15)+'</button>'+
      '</span></div></div>';
  }
  function renderSavedBody(){
    var box=document.getElementById('e29-lbody');if(!box)return;
    var inp=document.getElementById('e29-lsq');
    var st=savedFiltered(inp?inp.value:'');
    if(!st.length){
      box.innerHTML='<div class="e29-empty"><div class="big">'+e29ico('library',34)+'</div><b>ملک ذخیره‌شده‌ای ندارید</b>با ☆ روی کارت آگهی‌ها ذخیره کنید — اینجا با تصویر و مشخصات می‌ماند.</div>';
      return;
    }
    box.innerHTML='<div class="e29-grid">'+st.map(savedCard).join('')+'</div>';
  }
  function refreshSavedTab(){
    var tabs=document.getElementById('e29-ltabs');if(!tabs)return;
    var b=tabs.querySelector('[data-act="e30svTab"]');
    if(!b){
      b=document.createElement('button');
      b.className='e29-ptab';b.setAttribute('data-act','e30svTab');b.setAttribute('id','e30-svtab');
      tabs.appendChild(b);
    }
    var n=store().length;
    b.innerHTML='ملک‌های ذخیره‌شده'+(n?' <small>'+fa(n,0)+'</small>':'');
    b.className='e29-ptab'+(SV.tab?' on':'');
  }
  ACT.e30svTab=function(){SV.tab=true;
    var tabs=document.getElementById('e29-ltabs');
    if(tabs)Array.prototype.forEach.call(tabs.querySelectorAll('.e29-ptab:not(#e30-svtab)'),function(x){x.classList.remove('on')});
    refreshSavedTab();renderSavedBody();
  };
  ACT.e30svDel=function(el){remove(el.getAttribute('data-sv'));refreshSavedTab();renderSavedBody();E30.shellPatch&&E30.shellPatch.refreshBadges();toast('از ذخیره‌ها حذف شد')};
  ACT.e30svOpen=function(el){
    var it=store().filter(function(x){return x.id===el.getAttribute('data-sv')})[0];if(!it)return;
    var h='<div class="e30-svdetail"><h4>'+esc(it.title)+'</h4>'+
      ph(it.seed,320,180,'')+
      '<div class="sect">'+
      '<div class="kv"><span>نوع</span><b>'+esc(it.kindFa)+'</b></div>'+
      '<div class="kv"><span>محله</span><b>'+esc(it.hood)+'</b></div>'+
      '<div class="kv"><span>مشخصات</span><b>'+fa(it.m2||0,0)+' متر · '+fa(it.beds||0,0)+' خواب · عمر '+fa(it.age||0,0)+' · طبقهٔ '+fa(it.floor||0,0)+'</b></div>'+
      '<div class="kv"><span>امکانات</span><b>'+(it.elev?'آسانسور ':'')+(it.park?'پارکینگ':'')+'</b></div>'+
      '<div class="kv"><span>'+(it.kind==='rent'?'ودیعه':'قیمت کل')+'</span><b>'+rial(it.kind==='rent'?(it.dep||0):(it.price||0))+'</b></div>'+
      (it.kind==='rent'?'<div class="kv"><span>اجارهٔ ماهانه</span><b>'+rial(it.rent||0)+'</b></div>':'')+
      '<div class="kv"><span>ذخیره</span><b>'+fd(it.savedAt)+'</b></div></div></div>';
    openModal('<h3>آگهی ذخیره‌شده</h3>'+h);
  };
  /* library tab integration: wrap render + tab act + search */
  function mountLibraryPatch(){
    if(!E29.libAPI)return;
    var _render=E29.libAPI.render;
    E29.libAPI.render=function(){
      if(!SV.tab){_render();refreshSavedTab();return}
      refreshSavedTab();renderSavedBody();
    };
    var _tab=E29.libAPI.TABS; /* kept for compat */
    var _tabAct=ACT.e29libTab;
    ACT.e29libTab=function(el){SV.tab=false;if(_tabAct)_tabAct(el);refreshSavedTab()};
    var _mount=E29.libAPI.mountPanel;
    E29.libAPI.mountPanel=function(opts){
      SV.tab=false;
      _mount(opts);
      refreshSavedTab();
      var inp=document.getElementById('e29-lsq');
      if(inp){
        /* rebind search so it also filters saved listings */
        var fresh=inp.cloneNode(true);
        inp.parentNode.replaceChild(fresh,inp);
        fresh.addEventListener('input',function(){if(SV.tab)renderSavedBody();else E29.libAPI.render()});
      }
    };
    /* listing save buttons route through the store, keeping old behavior */
    var _savL=CBACT.savL;
    CBACT.savL=function(el){var id=el.getAttribute('data-l');var added=upsert('rent',id);if(_savL)_savL(el);toast(added?'★ در «ملک‌های ذخیره‌شده» ذخیره شد':'از ذخیره‌ها حذف شد')};
    var _savB=CBACT.savB;
    CBACT.savB=function(el){var id=el.getAttribute('data-l');var added=upsert('buy',id);if(_savB)_savB(el);toast(added?'★ در «ملک‌های ذخیره‌شده» ذخیره شد':'از ذخیره‌ها حذف شد')};
  }

  /* ── 2) Sharing: whole-conversation entry, independent from per-response share ── */
  function mountSharePatch(){
    ACT.e30shWhole=function(){usrC('اشتراک‌گذاری کل گفت‌وگو');E29.share.dialog('conversation',null)};
    /* add a whole-conversation button inside the share manager */
    var _manage=E29.share.manage;
    E29.share.manage=function(){
      _manage();
      var m=document.querySelector('#modal-root .modal');
      if(m&&!m.querySelector('[data-act="e30shWhole"]')){
        var row=document.createElement('div');
        row.style.cssText='margin-top:10px';
        row.innerHTML='<button class="btn btn-sm" data-act="e30shWhole">اشتراک‌گذاری کل گفت‌وگوی جاری</button>';
        m.appendChild(row);
      }
    };
    /* independent entry in the chat summary strip */
    var _rcm=renderChatMeta;
    renderChatMeta=function(){
      _rcm();
      ['fchSum','landingSum','dashSum'].forEach(function(id){
        var box=document.getElementById(id);
        if(!box||box.querySelector('[data-act="e30shWhole"]'))return;
        var b=document.createElement('button');
        b.className='btn btn-xs';b.setAttribute('data-act','e30shWhole');
        b.setAttribute('title','اشتراک‌گذاری کل گفت‌وگو — جدا از اشتراک هر پاسخ');
        b.innerHTML=e29ico('share',13)+' کل گفت‌وگو';
        box.appendChild(b);
      });
    };
  }

  /* ── 3) Projects: add the ACTIVE conversation without archiving (§13) ── */
  function liveChatInfo(){
    var id=null,title=null;
    try{if(typeof E22!=='undefined'&&E22.restoredId)id=E22.restoredId}catch(e){}
    try{if(typeof E22!=='undefined'&&E22.titleFromHist)title=E22.titleFromHist()}catch(e){}
    if(!title){try{title=(HIST&&HIST.length)?('گفت‌وگو — '+String(HIST[0].h).replace(/<[^>]*>/g,' ').slice(0,30)):('گفت‌وگوی جاری')}catch(e){title='گفت‌وگوی جاری'}}
    return {id:id||'__live__',title:title,live:!id};
  }
  function addLive(pid){
    var p=E29.projAPI.byId(pid);if(!p)return false;
    var li=liveChatInfo();
    if(!p.chatIds)p.chatIds=[];
    if(p.chatIds.indexOf(li.id)<0)p.chatIds.push(li.id);
    if(S.chats){
      var found=false;
      S.chats.forEach(function(c){if(c.id===li.id){c.projectId=pid;found=true}});
      /* live conversation not yet in the session archive: keep the reference WITHOUT
         forcing an archive (§13 — no forced archive). The marker renders in the sidebar
         section and opens the live chat. */
      if(!found&&!p._liveRefs)p._liveRefs=[];
      if(!found&&p._liveRefs.indexOf(li.id)<0)p._liveRefs.push({id:li.id,title:li.title});
    }
    save();
    return true;
  }
  function mountProjectPatch(){
    var _panel=E29.projAPI.mountPanel;
    E29.projAPI.mountPanel=function(pid){
      _panel(pid);
      if(!pid)return;
      var body=document.getElementById('e29-lbody');if(!body)return;
      var p=E29.projAPI.byId(pid);if(!p)return;
      var li=liveChatInfo();
      var already=p.chatIds&&p.chatIds.indexOf(li.id)>=0;
      var sec=document.createElement('div');
      sec.innerHTML='<h4 style="margin:14px 0 6px;font-size:13px">گفت‌وگوی جاری</h4><div class="sect">'+
        (already
          ?'<div class="note">گفت‌وگوی جاری همین‌حا در این پروژه است.</div>'
          :'<div class="kv"><span>'+esc(li.title.slice(0,30))+'</span><b><button class="btn btn-xs" data-act="e30prjAddLive" data-prj="'+qesc(pid)+'">افزودن بدون آرشیو</button></b></div>')+
        '</div>';
      var h4=body.querySelector('h4');
      if(h4&&h4.nextSibling)body.insertBefore(sec,h4.nextSibling);
      else body.appendChild(sec);
    };
    ACT.e30prjAddLive=function(el){
      if(addLive(el.getAttribute('data-prj'))){toast('گفت‌وگوی جاری به پروژه اضافه شد — بدون نیاز به آرشیو');E29.projAPI.mountPanel(el.getAttribute('data-prj'));E29.shell.renderSidebarOnly()}
    };
    /* sidebar section: render live refs too */
    var _sec=E29.projAPI.sectionHTML;
    E29.projAPI.sectionHTML=function(){
      var h=_sec();
      return h;
    };
    /* sessOpen fallback for the live marker */
    var _sessOpen=ACT.sessOpen;
    ACT.sessOpen=function(el){
      var sid=el.getAttribute('data-sess');
      if(sid==='__live__'){E29.shell.closePanel();if(CURRENT!=='landing')go('landing');toast('گفت‌وگوی جاری باز است');return}
      if(_sessOpen)_sessOpen(el);
    };
  }

  /* ── 4) Reminders: prevent duplicates (§16) ── */
  function remDupe(title,due){
    var nt=normFa(String(title||'')).replace(/\s+/g,' ').trim();
    var i,r;
    for(i=0;i<(S.reminders||[]).length;i++){
      r=S.reminders[i];
      if(r.done)continue;
      if(normFa(r.title||'').replace(/\s+/g,' ').trim()===nt&&Math.abs((r.due||0)-(due||0))<20*3600000)return true;
    }
    return false;
  }
  function mountReminderPatch(){
    var _new=ACT.e29remNewGo;
    ACT.e29remNewGo=function(){
      var t=(document.getElementById('e29-rt')||{}).value||'';
      var dv=(document.getElementById('e29-rd')||{}).value||'';
      var due=dv?Date.parse(dv):Date.now()+864e5;
      if(remDupe(t,due)){toast('یادآور همانندِ همین با همین زمان از قبل وجود دارد');return}
      _new();
    };
  }

  /* ── init ── */
  E30.uxInit=function(){
    try{mountLibraryPatch()}catch(e){console.error('E30 lib patch',e)}
    try{mountSharePatch()}catch(e){console.error('E30 share patch',e)}
    try{mountProjectPatch()}catch(e){console.error('E30 prj patch',e)}
    try{mountReminderPatch()}catch(e){console.error('E30 rem patch',e)}
  };
  E30.savedStore=store;
  return {upsert:upsert,remove:remove,store:store,addLive:addLive,liveChatInfo:liveChatInfo,remDupe:remDupe};
})();


/* ═══════════════ V0.30 — E30 LANDING: public splash page (spec §3) ═══════════════
   Architectural separation of the informational chatbot: this module has NO references
   to the application engine (no botC/ceStart/ACT/SCRIPTS access). Its reply function is
   a pure KB lookup returning text + an optional on-page anchor; the ONLY app action it
   can trigger is navigating to the login view. Real service execution is impossible here.
   ═══════════════ */
E30.landing=(function(){
  /* local icon set (Tabler-style paths) — independent from the app ICONS registry */
  var SPLICO={
    home:'<path d="M5 12l7-8 7 8"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="M11 12L20 3M16 7l3 3"/>',
    tag:'<path d="M3 12l9-9 9 9-9 9z"/><circle cx="12" cy="12" r="1.6"/>',
    chart:'<path d="M4 19h16"/><path d="M7 15v-4M12 15V7M17 15v-7"/>',
    map:'<path d="M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
    trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    scale:'<path d="M12 3v18M5 7h14"/><path d="M5 7l-3 6h6zM19 7l3 6h-6z"/>',
    doc:'<path d="M14 3v5h5"/><path d="M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/>',
    contract:'<path d="M14 3v5h5"/><path d="M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/><path d="M9 13h6M9 17h4"/>',
    xoct:'<path d="M8 3h8l4 4v10l-4 4H8l-4-4V7z"/><path d="M9 9l6 6M15 9l-6 6"/>',
    shield:'<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    bell:'<path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/>',
    cal:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
    gavel:'<path d="M13 5l6 6M17 3l4 4M12 6l6 6-8 8H4v-6z"/>',
    wallet:'<path d="M17 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5"/><circle cx="15.5" cy="14" r="1"/>'
  };
  function splIco(n,sz){
    return '<svg width="'+(sz||20)+'" height="'+(sz||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(SPLICO[n]||'')+'</svg>';
  }
  function priceOf(k){try{return E30.PRICING[k]?E30.PRICING[k].cost:null}catch(e){return null}}

  var SERVICES=[
    {ic:'home',t:'کمک اجاره',b:'پیدا کردن خانهٔ متناسب با بودجه و شرایط زندگی شما',get:'فهرست محله‌های همخوان، آگهی‌های منطبق، مقایسه و هماهنگی بازدید',req:'ودیعه و اجارهٔ ماهانه، محله یا محل کار/تحصیل، تعداد خواب',price:null},
    {ic:'key',t:'کمک خرید ملک',b:'خرید آگاهانه با کنترل دقیق بودجه و الزام‌ها',get:'بازهٔ قیمت محله‌ها، آگهی‌های زیر سقف بودجه، گزارش حقوقی، برنامهٔ پرداخت امانی',req:'بودجهٔ کل، هدف (سکونت/سرمایه‌گذاری)، محدودهٔ جست‌وجو',price:null},
    {ic:'tag',t:'کمک فروش ملک',b:'فروش با قیمت‌گذاری مبتنی بر داده و آماده‌سازی آگهی',get:'ارزیابی محله، استراتژی قیمت (سریع/حداکثر)، آماده‌سازی آگهی، مدیریت پیشنهادها',req:'مشخصات ملک، وضعیت سند و مالکیت، انگیزهٔ فروش',price:null},
    {ic:'chart',t:'ارزش‌گذاری ملک',b:'برآورد ارزش روی دادهٔ نمونهٔ سامانه',get:'گزارش ارزش با بازهٔ منطقی و مبانی محاسبه',req:'محله، متراژ، عمر و طبقه',price:priceOf('valuation')},
    {ic:'map',t:'تحلیل محله',b:'تصویر کامل یک محله قبل از تصمیم',get:'بازار، دسترسی‌ها، امکانات و تناسب با اولویت‌های شما',req:'نام محله و نمای اجاره یا خرید',price:priceOf('hood_detail')},
    {ic:'trend',t:'تحلیل بازار',b:'روند قیمت و تورم از دادهٔ نمونهٔ سامانه',get:'نمودار روند، تغییر سالانه، میانگین‌ها',req:'انتخاب محله یا نمای کلی',price:null},
    {ic:'scale',t:'مقایسهٔ ملک/محله',b:'تصمیم بین چند گزینه با جدول کنارهم',get:'جدول مقایسه با همهٔ شاخص‌های کلیدی',req:'دو تا چند مورد برای مقایسه',price:priceOf('hood_compare')},
    {ic:'doc',t:'ثبت قرارداد',b:'قرارداد اجاره/مبایعه‌نامه داخل گفت‌وگو',get:'پیش‌نویس استاندارد با اعتبارسنجی کد ملی/کد پستی و ثبت داخلی',req:'مشخصات طرفین، ملک و شرایط مالی',price:priceOf('contract_draft')},
    {ic:'x-oct',t:'فسخ قرارداد',b:'فرایند فسخ و تخلیه با صورت‌جلسه',get:'صورت‌جلسه، درخواست پیگیری‌دار، تحلیل هوشمند اسناد فسخ',req:'کد قرارداد ثبت‌شده در سامانه',price:priceOf('term_ai')},
    {ic:'shield',t:'احراز هویت',b:'اعتبارسنجی اطلاعات طرفین درون قرارداد',get:'کنترل ساختاری کد ملی و کد پستی هنگام ثبت',req:'کد ملی و کد پستی طرفین',price:null},
    {ic:'bell',t:'مدیریت یادآورها',b:'هیچ قرار و سررسیدی از دستتان در نمی‌رود',get:'ساخت یادآور از گفت‌وگو یا پنل، اعلان و تکرار',req:'عنوان و زمان یادآور',price:null},
    {ic:'cal',t:'هماهنگی بازدید',b:'رزرو بازدید از روزها و ساعت‌های اعلامی مالک',get:'درخواست بازدید ثبت‌شده و قابل پیگیری',req:'انتخاب ملک و زمان',price:priceOf('visit')},
    {ic:'gavel',t:'گزارش حقوقی',b:'بررسی وضعیت سند پیش از معامله',get:'گزارش وضعیت سند و زمان تقریبی انتقال',req:'وضعیت سند ملک',price:priceOf('legal')},
    {ic:'wallet',t:'پرداخت و تسویهٔ امانی',b:'پرداخت مرحله‌ای امن با حساب امانی',get:'توافق پرداخت، مراحل و آزادسازی امانی',req:'توافق طرفین بر مراحل و درصدها',price:priceOf('escrow')}
  ];

  var FAQ=[
    ['محلینو چه کمکی می‌کند؟','محلینو یک دستیار گفت‌وگویی املاک است: شرایط‌تان را به زبان خودتان تعریف می‌کنید و دستیار، محله‌های مناسب، آگهی‌های منطبق، تحلیل بازار، قرارداد و پرداخت امانی را در همان گفت‌وگو پیش می‌برد.'],
    ['شروع چطور است؟','کافی است وارد شوید و در اولین پیام، شرایط‌تان را آزاد بنویسید — مثلاً «تازه ازدواج کردم و دنبال خونهٔ نوساز نزدیک محل کارم هستم». دستیار از همان پیام شروع می‌کند و فقط چیزهای واقعاً لازم را می‌پرسد.'],
    ['بنا چیست؟','بنا اعتبار داخلی سامانه برای سرویس‌های پیشرفته (تحلیل محله، ارزش‌گذاری، گزارش حقوقی، قرارداد و…) است. هر سرویس قبل از اجرا، هزینه را نشان می‌دهد و فقط با تأیید شما اجرا می‌شود.'],
    ['داده‌های من کجا ذخیره می‌شود؟','در این نسخه، همهٔ داده‌ها به‌صورت محلی روی مرورگر همین دستگاه ذخیره می‌شود. لینک‌های اشتراک‌گذاری هم «اسنپ‌شات» داخلی همین دستگاه است + امکان دانلود فایل.'],
    ['قیمت‌ها و آمار از کجاست؟','از دادهٔ نمونهٔ داخلی سامانه و صرفاً برای تصمیم‌گیری بهتر؛ آمار رسمی یا مشاورهٔ حقوقی نیست.'],
    ['وام یا تسهیلات پردازش می‌کنید؟','خیر — پردازش وام انجام نمی‌شود؛ اما می‌توانید بودجه، هزینه‌های جانبی و برنامهٔ پرداخت امانی را در گفت‌وگو بچینید.'],
    ['اشتراک‌گذاری چطور کار می‌کند؟','می‌توانید از کل گفت‌وگو یا از هر خروجی (قرارداد، گزارش‌ها) لینک اسنپ‌شات فقط‌خواندنی بگیرید، لینک را باطل یا به‌روز کنید، یا فایل مستقل دانلود کنید.'],
    ['یادآور دارید؟','بله — یادآور را از داخل گفت‌وگو یا از پنل یادآورها بسازید؛ اعلان و تکرار دارد و جلوی ثبت تکراری هم گرفته می‌شود.']
  ];

  var KB=[
    {k:['سرویس','خدمات','چه کار','چه کاری'],a:function(){return 'خدمات اصلی: اجاره، خرید، فروش، ارزش‌گذاری، تحلیل محله و بازار، مقایسه، قرارداد و فسخ، یادآور، بازدید، گزارش حقوقی و تسویهٔ امانی. همین پایین کارت هر سرویس را ببینید.'}},
    {k:['اجاره'],a:function(){return 'سرویس اجاره: شرایط‌تان (بودجه، محله/محل کار، تعداد خواب…) را می‌گویید؛ دستیار محله‌های همخوان و آگهی‌های منطبق با الزام‌های الزامی‌تان نشان می‌دهد و بازدید و قرارداد را هم داخل گفت‌وگو می‌برد. شروع آن فقط داخل برنامه است.'}},
    {k:['خرید','مبایعه'],a:function(){return 'سرویس خرید: بودجه و هدف‌تان را می‌پرسد، فقط ملک‌هایی را نشان می‌دهد که قیمت کلشان (متراژ × قیمت هر متر) زیر سقف بودجه باشد، و گزارش حقوقی و پرداخت امانی را هم دارد. شروع در برنامه.'}},
    {k:['فروش','بفروش'],a:function(){return 'سرویس فروش: از وضعیت سند و انگیزهٔ فروش می‌پرسد، بر پایهٔ دادهٔ نمونه ارزیابی می‌کند، استراتژی قیمت (سریع یا حداکثر) می‌چیند و تا قرارداد همراهتان است. شروع در برنامه.'}},
    {k:['بنا','هزینه','قیمت','تعرفه','پول'],a:function(){return 'هر سرویس پیشرفته با اعتبار «بنا» پرداخت می‌شود: تحلیل محله ۴۰، مقایسهٔ محله‌ها ۴۰، ارزش‌گذاری ۴۰، قرارداد ۶۰، تحلیل فسخ ۸۰، گزارش حقوقی ۱۰۰، تسویهٔ امانی ۱۵۰، بازدید ۲۰. هیچ کسر بدون تأیید صریح انجام نمی‌شود. جدول کامل در بخش «تعرفه» همین صفحه است.'}},
    {k:['ثبت نام','ثبت‌نام','ورود','حساب','عضویت'],a:function(){return 'ورود و ثبت‌نام از دکمهٔ «ورود به برنامه» همین صفحه انجام می‌شود. پس از ورود، همهٔ خدمات داخل محیط گفت‌وگو در دسترس است.'}},
    {k:['حریم','امنیت','داده','ذخیره','privacy'],a:function(){return 'داده‌های شما در این نسخه فقط روی مرورگر همین دستگاه ذخیره می‌شود (حافظهٔ محلی) و به جایی ارسال نمی‌گردد. لینک‌های اشتراک هم اسنپ‌شات داخلی همین دستگاه است، به‌علاوهٔ امکان دانلود فایل مستقل.'}},
    {k:['یادآور','یاد اور'],a:function(){return 'یادآورها هم از داخل گفت‌وگو ساخته می‌شوند («یادآور بساز برای…») هم از پنل یادآورها؛ اعلان و تکرار دارند و ثبت تکراری مسدود می‌شود.'}},
    {k:['وام','تسهیل','بانک'],a:function(){return 'پردازش وام/تسهیلات در محلینو انجام نمی‌شود و صادقانه می‌گوییم؛ ولی برنامه‌ریزی بودجه و هزینه‌های جانبی معامله را داخل گفت‌وگو می‌توانید بچینید.'}},
    {k:['قیمت خانه','قیمت ملک','بازار','روند','تورم'],a:function(){return 'تحلیل بازار و روند قیمت بر پایهٔ «دادهٔ نمونهٔ سامانه» ارائه می‌شود و صریحاً همین‌طور برچسب می‌خورد — آمار رسمی یا پیش‌بینی قطعی نیست.'}},
    {k:['امنیت پرداخت','امانی','تسویه'],a:function(){return 'پرداخت‌های معامله از مسیر «حساب امانی» و مرحله‌ای است؛ توافق پرداخت داخل گفت‌وگو ثبت و مرحله‌به‌مرحله آزادسازی می‌شود.'}},
    {k:['سلام','درود','هی'],a:function(){return 'سلام! دربارهٔ خدمات، بنا، ثبت‌نام یا حریم خصوصی هر سؤالی دارید بپرسید — یا با «ورود به برنامه» همین حالا شروع کنید.'}}
  ];

  /* pure KB reply — intentionally no access to the app engine */
  function reply(text){
    var t=normFa(String(text||''));
    /* guard: real-service requests → guide to the app, never execute */
    if(/اجاره ?کنم|بخرم|بفروشم|قرارداد کن|رزرو کن|تحلیل.{0,12}(کن|بده)|ثبت کن|پرداخت کن|واریز/.test(t)){
      return {text:'این کار داخل برنامهٔ محلینو انجام می‌شود و اینجا (صفحهٔ معرفی) فقط توضیح می‌دهم. با «ورود به برنامه» وارد شوید؛ همان‌جا در همان اولین پیام، شرایط‌تان را آزاد بنویسید — دستیار اصلی از همان‌جا قدم‌به‌قدم همراهتان است.',cta:true};
    }
    var i,j,best=null,score=0;
    for(i=0;i<KB.length;i++){
      var s=0;
      for(j=0;j<KB[i].k.length;j++){if(t.indexOf(normFa(KB[i].k[j]))>=0)s+=KB[i].k[j].length}
      if(s>score){score=s;best=KB[i]}
    }
    if(best)return {text:best.a()};
    return {text:'دقیق متوجه سؤالتان نشدم. می‌توانید بپرسید: «خدمات محلینو چیست؟»، «بنا چیست؟»، «داده‌هایم کجا ذخیره می‌شود؟» یا «چطور شروع کنم؟».'};
  }

  function section(name){return document.getElementById('spl-'+name)}
  function scroll(name){var el=section(name);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}

  function cardHTML(s,i){
    return '<div class="spl-card" data-sv="'+i+'" tabindex="0" role="button" aria-label="'+esc(s.t)+'">'+
      '<span class="spl-ic">'+splIco(s.ic,20)+'</span>'+
      '<b>'+esc(s.t)+'</b>'+
      '<p>'+esc(s.b)+'</p>'+
      (s.price?'<span class="spl-price">'+fa(s.price,0)+' بنا</span>':'<span class="spl-price spl-free">در جریان گفت‌وگو</span>')+
      '</div>';
  }
  function cardDetail(s){
    return '<h3>'+esc(s.t)+'</h3>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>فایدهٔ اصلی</span><b>'+esc(s.b)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>چه چیزی می‌گیرید</span><b style="max-width:60%;text-align:left">'+esc(s.get)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>چه چیزی لازم است</span><b style="max-width:60%;text-align:left">'+esc(s.req)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>هزینه</span><b>'+(s.price?fa(s.price,0)+' بنا (قبل از اجرا تأیید می‌شود)':'بخشی از گفت‌وگوی اصلی — بدون هزینهٔ جدا')+'</b></div>'+
      '<div class="note" style="margin-top:10px">این کارت فقط توضیح است؛ اجرای واقعی سرویس داخل برنامه و پس از ورود انجام می‌شود.</div>';
  }
  function bindCards(root){
    root.addEventListener('click',function(e){
      var c=e.target.closest?e.target.closest('.spl-card'):null;
      if(!c)return;
      var s=SERVICES[+c.getAttribute('data-sv')];
      openModal('<div class="spl-modal">'+cardDetail(s)+'<div class="qr" style="margin-top:12px"><button data-view="auth">ورود به برنامه</button><button data-act="closeModal">بستن</button></div></div>');
    });
  }

  function html(){
    var h='<header class="spl-head"><div class="spl-wrap">'+
      '<div class="spl-brand">'+splIco('home',20)+'<b>محلینو</b><span class="spl-brandsub">دستیار هوشمند املاک</span></div>'+
      '<nav class="spl-nav">'+
      '<button data-spl="services">خدمات</button>'+
      '<button data-spl="how">نحوهٔ کار</button>'+
      '<button data-spl="pricing">تعرفه</button>'+
      '<button data-spl="faq">پرسش‌ها</button>'+
      '</nav>'+
      '<div class="spl-cta"><button class="spl-btn ghost" data-view="auth">ورود</button><button class="spl-btn" data-view="auth">ثبت‌نام</button></div>'+
      '</div></header>';

    h+='<section class="spl-hero"><div class="spl-wrap">'+
      '<h1>همه تصمیم‌های ملکی،<br>با یک دستیار هوشمند</h1>'+
      '<p class="spl-sub">محلینو کمک می‌کند شرایط‌تان را بفهمید، بازار را بشناسید، خانهٔ مناسب پیدا کنید و معامله را تا قرارداد و تسویهٔ امانی در یک گفت‌وگو پیش ببرید.</p>'+
      '<div class="spl-heroacts"><button class="spl-btn big" data-view="auth">ورود به برنامه</button><button class="spl-btn ghost big" data-spl="how">چطور کار می‌کند؟</button></div>'+
      '</div></section>';

    /* informational chatbot — pure info, cannot execute anything */
    h+='<section class="spl-chatwrap spl-light"><div class="spl-wrap">'+
      '<h2>سؤالی دارید؟ از دستیار معرفی بپرسید</h2>'+
      '<p class="spl-sub2">این دستیار فقط دربارهٔ خودِ محلینو توضیح می‌دهد؛ اجرای خدمات داخل برنامه و پس از ورود انجام می‌شود.</p>'+
      '<div class="spl-chat" id="spl-chatbox">'+
      '<div class="spl-msgs" id="spl-msgs" aria-live="polite"></div>'+
      '<div class="spl-chips" id="spl-chips">'+
      ['خدمات چیست؟','بنا چیست؟','داده‌ها کجا ذخیره می‌شود؟','چطور شروع کنم؟'].map(function(q){return '<button data-splq="'+esc(q)+'">'+esc(q)+'</button>'}).join('')+
      '</div>'+
      '<div class="spl-inputrow"><input id="spl-q" type="text" placeholder="سؤال‌تان را بنویسید…" aria-label="پرسش از دستیار معرفی"><button id="spl-send" aria-label="ارسال">فرستادن</button></div>'+
      '</div></div></section>';

    h+='<section class="spl-sec" id="spl-services"><div class="spl-wrap">'+
      '<h2>خدمات محلینو</h2><div class="spl-grid">'+SERVICES.map(cardHTML).join('')+'</div></div></section>';

    h+='<section class="spl-sec alt" id="spl-how"><div class="spl-wrap">'+
      '<h2>محلینو چطور کار می‌کند؟</h2><div class="spl-steps">'+
      [['۱','شرایط‌تان را تعریف می‌کنید','به زبان خودتان — نه فرم خالی'],['۲','محلینو می‌فهمد','از دل حرف‌هایتان، نیاز و محدودیت‌ها درمی‌آید'],
       ['۳','سؤالِ درست را می‌پرسد','فقط چیزهایی که واقعاً لازم است — یکی‌یکی'],['۴','گزینه‌ها آماده می‌شود','محله‌ها، آگهی‌های منطبق و تحلیل‌ها'],
       ['۵','شما تصمیم می‌گیرید','با مقایسه، ارزش‌گذاری و گزارش حقوقی'],['۶','محلینو ادامه را می‌بَرد','بازدید، قرارداد، پرداخت امانی و یادآورها']]
      .map(function(s){return '<div class="spl-step"><span class="n">'+s[0]+'</span><b>'+esc(s[1])+'</b><p>'+esc(s[2])+'</p></div>'}).join('')+
      '</div></div></section>';

    h+='<section class="spl-sec" id="spl-why"><div class="spl-wrap"><h2>چرا محلینو؟</h2><div class="spl-grid three">'+
      [['گفت‌وگو، نه فرم','شرایط‌تان را تعریف می‌کنید؛ فرم پر نمی‌کنید.'],
       ['شفاف در هزینه','هر سرویس قبل از اجرا قیمتش را می‌گوید و با تأیید شما اجرا می‌شود.'],
       ['صادق دربارهٔ داده','اعداد از دادهٔ نمونهٔ سامانه است و همیشه همین‌طور برچسب می‌خورد.'],
       ['هیچ‌چیز بی‌اجازه','بدون تأیید صریح، هیچ پرداخت یا تعهدی ثبت نمی‌شود.']]
      .map(function(w){return '<div class="spl-why"><b>'+esc(w[0])+'</b><p>'+esc(w[1])+'</p></div>'}).join('')+
      '</div></div></section>';

    var rows=E30.pay.audit().map(function(p){
      return '<tr><td>'+esc(p.label)+'</td><td>'+fa(p.cost,0)+'</td><td>پیش از اجرا، داخل گفت‌وگو</td><td>فقط در صورت خطای اجرا</td><td>سامانهٔ محلینو</td></tr>';
    }).join('');
    h+='<section class="spl-sec alt" id="spl-pricing"><div class="spl-wrap">'+
      '<h2>تعرفهٔ شفاف</h2><p class="spl-sub2">واحد پرداخت خدمات پیشرفته، اعتبار «بنا» است. هیچ کسر بدون تأیید صریح انجام نمی‌شود و هزینهٔ خارجیِ نامعلومی دریافت نمی‌گردد.</p>'+
      '<div class="spl-table"><table><thead><tr><th>سرویس</th><th>بنا</th><th>زمان پرداخت</th><th>شرط بازگشت</th><th>گیرنده</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '</div></section>';

    h+='<section class="spl-sec" id="spl-faq"><div class="spl-wrap"><h2>پرسش‌های پرتکرار</h2>'+
      FAQ.map(function(f){return '<details class="spl-faq"><summary>'+esc(f[0])+'</summary><p>'+esc(f[1])+'</p></details>'}).join('')+
      '</div></section>';

    h+='<footer class="spl-foot"><div class="spl-wrap">'+
      '<div class="spl-footgrid">'+
      '<div><div class="spl-brand">'+splIco('home',18)+'<b>محلینو</b></div><p>دستیار گفت‌وگویی املاک — از «شرایط من» تا «قرارداد و تسویه».</p></div>'+
      '<div><b>مسیرها</b><button data-spl="services">خدمات</button><button data-spl="how">نحوهٔ کار</button><button data-spl="pricing">تعرفه</button><button data-spl="faq">پرسش‌ها</button></div>'+
      '<div><b>شروع</b><button data-view="auth">ورود</button><button data-view="auth">ثبت‌نام</button></div>'+
      '</div>'+
      '<div class="spl-copy">محلینو — داده‌های نمایشی روی همین دستگاه ذخیره می‌شود · نسخهٔ V0.30</div>'+
      '</div></footer>';
    return h;
  }

  /* ── render + wiring ── */
  function ensureView(){
    var v=document.getElementById('v-splash');
    if(v)return v;
    v=document.createElement('section');
    v.className='view';v.id='v-splash';
    v.innerHTML=html();
    var anchor=document.getElementById('v-auth')||document.querySelector('.view');
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(v,anchor);
    else document.body.appendChild(v);
    bind(v);
    return v;
  }
  function bind(v){
    v.addEventListener('click',function(e){
      var t=e.target;
      if(!t||!t.closest)return;
      var el=t.closest('[data-spl]');
      if(el){scroll(el.getAttribute('data-spl'));return}
      el=t.closest('[data-splq]');
      if(el){ask(el.getAttribute('data-splq'));return}
      el=t.closest('[data-view]');
      if(el){try{go(el.getAttribute('data-view'))}catch(e2){}}
    });
    var inp=document.getElementById('spl-q'),send=document.getElementById('spl-send');
    if(send)send.addEventListener('click',function(){ask(inp?inp.value:'')});
    if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();ask(inp.value)}});
    botSay('سلام! من دستیار معرفی محلینو هستم — فقط دربارهٔ خود محصول توضیح می‌دهم. چه می‌خواهید بدانید؟');
    bindCards(v);
  }
  function botSay(t,cta){
    var box=document.getElementById('spl-msgs');if(!box)return;
    var d=document.createElement('div');
    d.className='spl-msg bot';
    d.innerHTML='<span>'+esc(t)+'</span>'+(cta?'<button class="spl-btn sm" data-view="auth">ورود به برنامه</button>':'');
    box.appendChild(d);box.scrollTop=box.scrollHeight;
  }
  function userSay(t){
    var box=document.getElementById('spl-msgs');if(!box)return;
    var d=document.createElement('div');d.className='spl-msg user';d.textContent=t;
    box.appendChild(d);box.scrollTop=box.scrollHeight;
  }
  function ask(text){
    text=String(text||'').replace(/^\s+|\s+$/g,'');
    if(!text)return;
    var inp=document.getElementById('spl-q');if(inp)inp.value='';
    userSay(text);
    var r=reply(text);
    setTimeout(function(){botSay(r.text,r.cta)},220);
  }

  /* go('splash') without the auth gate */
  E30.goSplash=function(){
    ensureView();
    closeModal();
    CURRENT='splash';
    document.body.classList.remove('widemain');
    setMenuOpen(false);
    var vs=document.querySelectorAll('.view');
    Array.prototype.forEach.call(vs,function(x){x.classList.remove('on')});
    document.getElementById('v-splash').classList.add('on');
    window.scrollTo(0,0);
    renderSidebar();renderTok();
  };

  E30.landingInit=function(){
    var _go=go;
    go=function(v){
      if(v==='splash'){E30.goSplash();return}
      _go(v);
    };
    ensureView();
  };
  return {ensureView:ensureView,reply:reply,html:html};
})();


/* ═══════════════ V0.30 — E30 SHELL: init glue — wraps engine entry points ═══════════════ */
E30._slidPending=null;

/* render-time payment-card honesty: never show a dead confirm button as live */
E30.payVisual=function(){
  var s=E30.pay.session();
  var roots=[document.getElementById('chatB'),document.getElementById('fchB'),document.getElementById('dashB'),document.getElementById('modal-root')];
  roots.forEach(function(b){
    if(!b)return;
    Array.prototype.forEach.call(b.querySelectorAll('.e30-paycard'),function(c){
      var pid=c.getAttribute('data-pay');if(!pid)return;
      var live=s&&s.payId===pid;
      var btns=c.querySelectorAll('button');
      if(!live){
        if(!c.classList.contains('e30pay-stale')&&!c.classList.contains('e30-paybad')){
          c.classList.add('e30pay-stale');
          Array.prototype.forEach.call(btns,function(x){x.disabled=true});
          var note=c.querySelector('.e30-note');
          if(!note){note=document.createElement('div');note.className='e30-note';note.textContent='این کارت تأیید دیگر معتبر نیست — سرویس را دوباره انتخاب کنید.';c.appendChild(note)}
        }
        return;
      }
      if(s.state==='processing'||s.state==='executing'||s.state==='paid'){
        Array.prototype.forEach.call(btns,function(x){x.disabled=true});
        var pg=c.querySelector('[data-paygo]');
        if(pg)pg.textContent='در حال پردازش…';
      }else if(s.state==='completed'||s.executed){
        Array.prototype.forEach.call(btns,function(x){x.disabled=true});
        if(!c.querySelector('.e30-done')){
          var d=document.createElement('div');d.className='e30-note e30-done';
          d.textContent='✓ پرداخت انجام و سرویس اجرا شد.';
          c.appendChild(d);
        }
      }
    });
  });
};

E30.init=function(){
  /* 1) workflow registry: sell / invest / landlord + FRC + WSTEPS */
  try{E30.flowsAPI.install()}catch(e){console.error('E30 install',e)}

  /* 2) boot recovery for interrupted payments (§11.7 reload-variant) */
  try{E30.pay.recover()}catch(e){console.error('E30 recover',e)}

  /* 3) discovery engine routes free-form openings FIRST (outermost ceSend wrap) */
  try{
    var curSend=ceSend;
    ceSend=function(t){
      if(String(t)==='!back'){curSend(t);return}
      try{if(E30.discAPI.route(String(t).replace(/^\s+|\s+$/g,''),t))return}catch(e){console.error('E30 disc',e)}
      curSend(t);
    };
  }catch(e){console.error('E30 wrap ceSend',e)}

  /* 4) stage sync after every value commit (§2.4) + slider commit marker (§2.5) */
  try{
    var curVal=ceVal;
    ceVal=function(v,raw){
      var pre=CE.f?CE.i:-1;
      var r=curVal(v,raw);
      try{E30.flowsAPI.syncStage()}catch(e){}
      try{
        if(CE.f&&E30._slidPending&&pre!==CE.i){
          var D=wd(CE.f).data;
          if(!D._slid)D._slid={};
          D._slid[E30._slidPending]=true;
        }
      }catch(e){}
      E30._slidPending=null;
      return r;
    };
  }catch(e){console.error('E30 wrap ceVal',e)}

  /* 5) slider commit with lock guard (§2.5): lock after commit, edit via explicit بازگشت */
  try{
    CBACT.slSet=function(el){
      if(!E30.flowsAPI.slGuard(el))return;
      var rid=el.getAttribute('data-rsld-for'),r=rid?document.getElementById(rid):null;
      if(!r){toast('لغزنده پیدا نشد');return}
      var wrapEl=r.closest('.rsld');
      var slot=wrapEl?wrapEl.getAttribute('data-slot'):null;
      var lad=(r.getAttribute('data-ladder')||'').split(',').filter(Boolean).map(Number);
      var v=lad[+r.value];
      if(!v){toast('مقدار لغزنده نامعتبر است');return}
      E30._slidPending=slot;
      usrC('تأیید مقدار لغزنده: '+rial(v));
      ceVal(String(v));
    };
  }catch(e){console.error('E30 slSet',e)}

  /* 6) cr() post-render pass: lock committed sliders + pay-card states */
  try{
    var _cr=cr;
    cr=function(){
      _cr();
      try{E30.flowsAPI.lockSliders()}catch(e){}
      try{E30.payVisual()}catch(e){}
    };
  }catch(e){console.error('E30 wrap cr',e)}

  /* 7) legacy spend(): keep direct path for chip-confirmed costs, but record a
        completed synthetic session so the payment audit trail stays unified (§11.1) */
  try{
    var _spend=spend;
    spend=function(key,cat,desc){
      var ok=_spend(key,cat,desc);
      if(ok){
        S.paySession={payId:E30.uid('PAY'),key:key,cost:COSTS[key]||0,title:desc||E30.label(key),state:'completed',executed:true,paidFlag:true,ts:Date.now(),source:'chip-confirmed'};
        save();S.paySession=null;save();
      }
      return ok;
    };
  }catch(e){console.error('E30 wrap spend',e)}

  /* 8) landing/splash route + view (public, pre-auth allowed) */
  try{E30.landingInit()}catch(e){console.error('E30 landing',e)}

  /* 9) UX patches: saved listings, share independence, projects, reminders */
  try{E30.uxInit()}catch(e){console.error('E30 ux',e)}

  /* 10) persona fix regression hook (§2.7): disc engine reclassifies on every turn —
         make the deterministic engine's saved persona follow the dynamic one */
  try{
    E29.intelAPI.personaOf=function(){return E30.discAPI.personaOf('rent')};
  }catch(e){}
};
