/* ═══════════════ V0.30 — E30 SHELL: init glue — wraps engine entry points ═══════════════ */
E30._slidPending=null;

/* ── no-re-ask auto-advance (§4.2: never ask again for supplied information) ──
   When the deterministic script reaches a step whose value the discovery engine
   already holds, answer it silently from context (with an honest one-line note)
   instead of re-asking. Bounded recursion. */
E30.autoAnswer=function(f){
  if(!CE.f)return null;
  var sc=SCRIPTS[f];if(!sc)return null;
  var st=sc[CE.i];if(!st||st.loop||st.cards)return null;
  var G=function(k){return E30.discAPI.getF(k)};
  var P=function(k){var v=G('prefs')||[];return v.indexOf(k)>=0};
  var id=st.id,map={
    rent:{
      beds:function(){var v=G('rooms');return v!=null?String(v):null},
      who:function(){var h=G('household');return h==='family'?'خانواده':(h==='couple'?'دو نفره':(h==='single'||h==='roommates'?'دانشجو/کاری':null))},
      age:function(){var v=G('prop_age');return v!=null?String(v):null},
      m2:function(){var v=G('m2');return v!=null?String(v):null},
      elev:function(){return P('elevator')?'yes':null},
      park:function(){return P('parking')?'yes':null}
    },
    buy:{
      beds:function(){var v=G('rooms');return v!=null?String(v):null},
      age:function(){var v=G('prop_age');return v!=null?String(v)+'|'+String(v):null}, /* range step */
      m2:function(){var v=G('m2');return v!=null?String(v)+'|'+String(+v+30):null},
      feat:function(){return P('elevator')?'elev':(P('parking')?'park':(P('balcony')?'balc':(G('prefs')!=null?'none':null)))}
    },
    sell:{
      s_own:function(){var o=G('ownership');return o==='inherited'?'inherited':(o==='joint'?'joint':(o==='single'?'single':(o==='mort'?'mort':null)))},
      s_docs:function(){var d=G('docs');return d==='سند تک‌برگ'?'yes':(d==='ورثه‌ای'||d==='رهن/مادهٔ ۱۰۰'?'no':null)},
      s_area:function(){var v=G('prop_area');if(v==null)v=G('m2');return v!=null?String(v):null},
      s_rooms:function(){var v=G('prop_rooms')||G('rooms');return v!=null?String(v):null},
      s_age:function(){var v=G('prop_age');return v!=null?String(v):null},
      s_hood:function(){var h=G('hood');try{return h?findH(h).n:null}catch(e){return null}},
      s_motiv:function(){var v=G('sale_motivation');return typeof v==='string'&&v?v:null},
      s_urg:function(){var v=G('sale_urgency');return v==='fast'?'fast':(v==='maxvalue'?'maxvalue':null)},
      s_price:function(){var v=G('expected_price');return v&&v.v?String(v.v[0]):null},
      s_min:function(){var v=G('min_price');return v&&v.v?String(v.v[0]):null}
    },
    invp:{
      i_obj:function(){var v=G('invest_objective');return v||null},
      i_cap:function(){var v=G('invest_capital');return v&&v.v?String(v.v[1]):null},
      i_hor:function(){var v=G('invest_horizon');return v==='کوتاه‌مدت'?'۲–۳ سال':(v==='میان‌مدت'?'۵ سال':(v==='بلندمدت'?'۱۰ سال+':null))},
      i_hood:function(){var h=G('hood');try{return h?findH(h).n:null}catch(e){return null}}
    }
  }[f];
  if(map&&map[id]){try{return map[id]()}catch(e){return null}}
  return null;
};
E30.autoRun=function(){
  var guard=0;
  while(guard++<14&&CE.f&&!E30.discAPI.active()){
    var sc=SCRIPTS[CE.f];if(!sc)break;
    var st=sc[CE.i];if(!st)break;
    var val=null;
    if(st.loop){
      /* importance loops: derive weights from the dynamic persona once per item */
      var D=wd(CE.f).data;if(!D.P)D.P={};
      var p=E30.discAPI.personaOf(CE.f);
      var k=st.loop[CE.li].k;
      var IMP={family:{metro:2,school:5,work:3},couple:{metro:3,school:2,work:4},student:{metro:5,school:1,work:4},
        retiree:{metro:2,school:1,work:1},professional:{metro:4,school:2,work:4},roommates:{metro:4,school:1,work:3}}[p]||{metro:3,school:3,work:3};
      if(D.P[k]!==undefined)val=String(D.P[k]);else val=String(IMP[k]||3);
      D.P[k]=+val;
      CE.li++;
      if(CE.li<st.loop.length)continue;
      CE.i++;CE.li=0;save();
      continue;
    }
    val=E30.autoAnswer(CE.f);
    if(val===null)break;
    var done=null;
    try{done=st.set?st.set(wd(CE.f).data,val):null}catch(e){break}
    if(done==='ERR')break;
    botC('✓ همین را از حرف‌های قبلی‌تان داشتم — دوباره نمی‌پرسم.');
    CE.i++;CE.li=0;save();
  }
  try{E30.flowsAPI.syncStage()}catch(e){}
};

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

  /* 3b) auto-advance known steps whenever the script is about to render one */
  try{
    var _ceStep=ceStep;
    ceStep=function(){
      try{E30.autoRun()}catch(e){console.error('E30 autoRun',e)}
      _ceStep();
    };
  }catch(e){console.error('E30 wrap ceStep',e)}

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

  /* 7b) composer-lock leak fix: the E22 openModal wrapper counts EVERY open; a modal
         replacing an open modal leaks a count and locks the composer forever.
         For chained opens, neutralize the inner counter so one open = one count. */
  try{
    var _openModal30=openModal;
    openModal=function(html,cb){
      var r=$('#modal-root');
      if(r&&r.classList&&r.classList.contains('on')){
        var _b=E22.busy;
        E22.busy=function(){};
        try{return _openModal30(html,cb)}
        finally{E22.busy=_b}
      }
      return _openModal30(html,cb);
    };
  }catch(e){console.error('E30 openModal wrap',e)}

  /* 7c) chip-value typing: matchChipText matched labels only — typing a raw chip
         value («ok») on an action-only step dead-ended. Accept exact values too. */
  try{
    var _mct=matchChipText;
    matchChipText=function(input,chips){
      var r=_mct(input,chips);
      if(r)return r;
      var q=normFa(String(input||'')).replace(/\s+/g,' ').trim();
      if(!q)return null;
      for(var i=0;i<(chips||[]).length;i++){
        if(String(chips[i][1]).toLowerCase()===q.toLowerCase())return {value:String(chips[i][1]),label:chips[i][0],exact:true};
      }
      return null;
    };
  }catch(e){console.error('E30 mct wrap',e)}

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
