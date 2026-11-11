/* ═══════════════ V0.29 — E29 CORE: state, bus, pricing, pay-confirm, LLM adapter ═══════════════ */
window.E29={VER:'0.29'};

/* ── icons (Tabler paths, same stroke style as ICONS) ── */
E29.ICO={
  bell:'<path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/>',
  library:'<path d="M4 4h6v16h-6z"/><path d="M14 4h6v16h-6z"/><path d="M4 8h6M14 8h6"/>',
  alarm:'<circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 2"/><path d="M7 4l-2.5 2.5M17 4l2.5 2.5"/>',
  folder:'<path d="M5 4h4l3 3h7a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2z"/>',
  share:'<path d="M6 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M18 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M8 11l8-4M8 13l8 4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5"/>',
  chat:'<path d="M3 20l1.3-3.9A7.5 7.5 0 1 1 7 19.3z"/>',
  pin:'<path d="M9 4h6l-1 7 3 2v2H7v-2l3-2z"/><path d="M12 15v5"/>',
  doc:'<path d="M14 3v5h5"/><path d="M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/>',
  chart:'<path d="M4 19h16"/><path d="M7 15v-4M12 15V7M17 15v-7"/>',
  spark:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>',
  wallet:'<path d="M17 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5"/><circle cx="15.5" cy="14" r="1"/>',
  check:'<path d="M5 12l5 5L20 7"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  dots:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  download:'<path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 21h16"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
  edit:'<path d="M4 20l4-1L19.5 7.5a2.1 2.1 0 0 0-3-3L5 16z"/>',
  unfold:'<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
  fold:'<path d="M8 5l4 4 4-4M8 19l4-4 4 4"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5v6h-6"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M14.8 9.5c-.4-.8-1.5-1.5-2.8-1.5-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.7-2.8-1.5"/><path d="M12 6v2M12 16v2"/>'
};
function e29ico(n,sz){return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(E29.ICO[n]||'')+'</svg>'}

/* ── event bus ── */
E29.bus=(function(){
  var map={};
  return {
    on:function(e,fn){(map[e]=map[e]||[]).push(fn)},
    emit:function(e,p){
      var l=map[e]||[],i;
      for(i=0;i<l.length;i++){try{l[i](p)}catch(err){console.error('E29 bus',e,err)}}
    }
  };
})();

/* ── uid ── */
E29.uid=function(p){return (p||'E29')+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e4).toString(36)};

/* ── centralized pricing (Token Agent proposal, spec §6.4) ── */
E29.PRICING={
  hood_detail:{cost:40,label:'تحلیل جامع محله'},
  hood_compare:{cost:40,label:'مقایسهٔ دو محله'},
  contract_draft:{cost:60,label:'تنظیم پیش‌نویس قرارداد'},
  term_ai:{cost:80,label:'تحلیل هوشمند اسناد فسخ'},
  valuation:{cost:40,label:'تخمین ارزش ملک'}
};
/* hook existing COSTS so new services share one config */
try{COSTS.hood_detail=40;COSTS.hood_compare=40;COSTS.contract_draft=60;COSTS.term_ai=80;COSTS.valuation=40;
    COSTL.hood_detail='تحلیل جامع محله';COSTL.hood_compare='مقایسهٔ محله‌ها';COSTL.contract_draft='پیش‌نویس قرارداد';COSTL.term_ai='تحلیل هوشمند اسناد فسخ';COSTL.valuation='تخمین ارزش ملک'}catch(e){}

/* ── in-flight transaction guard ── */
E29._inflight={};
E29.pay={
  /* ask → show in-chat cost card with explicit confirm; onConfirm runs after spend succeeds */
  ask:function(key,desc,ctx,onConfirm){
    var p=E29.PRICING[key],cost=(COSTS[key]!==undefined?COSTS[key]:p.cost),bal=S.tokens||0;
    if(E29._inflight[key]){toast('این خدمت در حال انجام است');return}
    if(bal<cost){
      botC('<div class="e29-paycard"><div class="pt">موجودی توکن کافی نیست</div>'+
      '<div class="pr"><span>سرویس</span><b>'+esc(p?p.label:desc)+'</b></div>'+
      '<div class="pr"><span>هزینهٔ لازم</span><b>'+fa(cost,0)+' توکن</b></div>'+
      '<div class="pr"><span>موجودی شما</span><b>'+fa(bal,0)+' توکن</b></div>'+
      '<div class="qr"><button data-view="sub">شارژ توکن</button></div></div>',null);
      a11yify($('#v-landing')||document.body);
      return;
    }
    E29._inflight[key]=true;
    var html='<div class="e29-paycard">'+
      '<div class="pt">'+e29ico('coin',16)+' تأیید هزینهٔ سرویس</div>'+
      '<div class="pr"><span>سرویس</span><b>'+esc(p?p.label:desc)+'</b></div>'+
      '<div class="pr"><span>هزینه</span><b>'+fa(cost,0)+' توکن</b></div>'+
      '<div class="pr"><span>موجودی شما</span><b>'+fa(bal,0)+' توکن</b></div>'+
      (ctx?'<div class="pr"><span>موضوع</span><b>'+esc(ctx)+'</b></div>':'')+
      '<div class="qr">'+
      '<button data-cba="e29payGo" data-key="'+qesc(key)+'" data-desc="'+qesc(desc||'')+'">'+fa(cost,0)+' توکن پرداخت و اجرا</button>'+
      '<button data-cba="e29payCancel" data-key="'+qesc(key)+'">انصراف</button>'+
      '</div></div>';
    var chatEl=document.getElementById('chatB');
    if(chatEl&&chatEl.offsetParent){botC(html,null);a11yify($('#v-landing')||document.body)}
    else{openModal(html)}
    E29._pending={key:key,desc:desc||'',cb:onConfirm};
  },
  go:function(key){
    if(!E29._pending||E29._pending.key!==key)return;
    var pend=E29._pending;E29._pending=null;delete E29._inflight[key];
    closeModal();
    var cost=COSTS[key]||0;
    S.tokens-=cost;
    var txn=E29.uid('TXN');
    S.log.unshift({t:Date.now(),d:pend.desc||E29.PRICING[key].label,c:-cost,cat:'v29',id:txn,svc:key});
    save();renderTok();
    E29.bus.emit('token.deduct',{txn:txn,cost:cost,svc:key,desc:pend.desc});
    if(balLow())E29.bus.emit('wallet.low',{balance:S.tokens});
    usrC('تأیید پرداخت '+fa(cost,0)+' توکن');
    try{pend.cb(txn)}catch(e){E29.pay.refund(txn,key,cost,'خطا در اجرا');console.error(e)}
  },
  cancel:function(key){
    if(E29._pending&&E29._pending.key===key)E29._pending=null;
    delete E29._inflight[key];
    closeModal();
    usrC('انصراف');
    botC('انجام نشد — هزینه‌ای کسر نشد.',null);
  },
  refund:function(txn,key,cost,reason){
    if(!cost)return;
    S.tokens+=cost;
    S.log.unshift({t:Date.now(),d:'بازگشت توکن — '+(reason||''),c:cost,cat:'v29',id:txn,svc:key,refund:true});
    save();renderTok();
    E29.bus.emit('token.refund',{txn:txn,cost:cost,reason:reason});
    toast('+'+fa(cost,0)+' توکن بازگشت داده شد');
  }
};
function balLow(){return (S.tokens||0)<30}

/* ── LLM adapter (off by default; no fabrication — spec §4.5) ── */
E29.llm={
  endpoint:null,
  enabled:false,
  configure:function(url){this.endpoint=url;this.enabled=!!url},
  complete:function(history,done){
    if(!this.enabled||!this.endpoint||typeof fetch!=='function'){done(null);return}
    try{
      fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})})
        .then(function(r){return r.json()})
        .then(function(j){done(j&&j.text||null)})
        .catch(function(){done(null)});
    }catch(e){done(null)}
  }
};

/* ── chat reference (live conversation pointer for library items) ── */
E29.chatRef=function(){
  var id=(typeof E22!=='undefined'&&E22.restoredId)?E22.restoredId:null;
  var title=(typeof E22!=='undefined'&&E22.titleFromHist)?(E22.titleFromHist()||'گفت‌وگوی جاری'):null;
  if(!title)title='گفت‌وگوی جاری';
  return {chatId:id,chatTitle:title.slice(0,40)};
};

/* ── CBACT handlers registered by core (pay flow + termination AI) ── */
try{
  CBACT.e29payGo=function(el){E29.pay.go(el.getAttribute('data-key'))};
  CBACT.e29payCancel=function(el){E29.pay.cancel(el.getAttribute('data-key'))};
}catch(e){}

/* ── AI document analysis for terminated contracts (term_ai, spec §6.3) ── */
E29.termAI=function(code){
  var i,q=null;for(i=0;i<(S.contracts||[]).length;i++){if(S.contracts[i].code===code){q=S.contracts[i];break}}
  if(!q){toast('قرارداد یافت نشد');return}
  E29.pay.ask('term_ai','تحلیل هوشمند اسناد فسخ',q.title,function(txn){
    var html='<div class="e29-detail"><h4>نتیجهٔ تحلیل اسناد فسخ</h4><div class="sect">'+
      '<div class="kv"><span>قرارداد</span><b>'+esc(q.title)+'</b></div>'+
      '<div class="kv"><span>شناسه</span><b style="direction:ltr">'+esc(code)+'</b></div>'+
      '<div class="kv"><span>وضعیت</span><b>فسخ‌شده</b></div>'+
      '<div class="kv"><span>الزامات تسویه</span><b>عودهٔ ودیعه پس از کسر خسارت‌های مستند</b></div>'+
      '<div class="kv"><span>مرجع تعیین خسارت</span><b>کمیسیون حل اختلاف اجاره</b></div></div>'+
      '<p class="note">این تحلیل محتوای اسناد شما را خلاصه می‌کند و توصیهٔ حقوقی نیست.</p></div>';
    var it=E29.libAPI.saveArtifact({type:'ai_process',title:'تحلیل هوشمند فسخ — '+q.title,
      summary:'استخراج اطلاعات و الزامات تسویه از اسناد فسخ',
      artifact:{html:html},entityId:code,txnId:txn,tokenCost:COSTS.term_ai||80});
    openModal('<h3>تحلیل هوشمند فسخ</h3>'+html);
    E29.bus.emit('analysis.completed',{title:'تحلیل اسناد فسخ آماده شد',msg:'نتیجه در کتابخانه ذخیره شد.',libId:it.id,txn:txn});
  });
};
CBACT.e29termAI=function(el){
  var code=el.getAttribute('data-code');
  if(!code){var i;for(i=0;i<(S.contracts||[]).length;i++){if(S.contracts[i].status==='terminated'){code=S.contracts[i].code}}}
  E29.termAI(code);
};
CBACT.e29termLater=function(){usrC('فعلاً نه');botC('هر وقت خواستید از همان پیام می‌توانید تحلیل را اجرا کنید.',null)};
