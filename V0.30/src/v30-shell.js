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
  /* A deliberate Back click means the user wants to REVISIT a confirmed
     answer. Do not immediately auto-skip that very step from the old profile. */
  if(E30._manualEdit&&E30._manualEdit.f===CE.f&&E30._manualEdit.i===CE.i){
    E30._manualEdit=null;
    try{E30.flowsAPI.syncStage()}catch(e){}
    return;
  }
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
    Array.prototype.forEach.call(b.querySelectorAll('[data-cba="e29termAI"]'),function(btn){
      btn.textContent='چک‌لیست رایگان فسخ (بدون تحلیل سند)';
      btn.setAttribute('aria-label','نمایش چک‌لیست رایگان فسخ قرارداد؛ هیچ سندی تحلیل نمی‌شود');
    });
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

  /* Restore an interrupted slot-collector before the next user turn. */
  try{E30.discAPI.resume()}catch(e){console.error('E30 discovery resume',e)}

  /* Contract payment is asynchronous: the V0.28 click wrapper refreshes the
     form while the 60-Bana confirmation is merely presented, before it has
     succeeded. Refresh the actual chat form and offer termination only after
     conFinalize has persisted a newly signed internal contract. */
  try{
    var finalizeBefore30=conFinalize;
    conFinalize=function(D,kind){
      var signedBefore=!!(D&&D.signed),done=finalizeBefore30.apply(this,arguments);
      if(!done||!D||!D.signed||signedBefore||CURRENT!=='landing'||!window.E28||E28.ctrKind!==kind)return done;
      var i;
      for(i=HIST.length-1;i>=0;i--){
        if(HIST[i]&&HIST[i].r==='bot'&&String(HIST[i].h||'').indexOf('data-e28ctr')!==-1)break;
      }
      if(i>=0){
        HIST[i].h='<b>'+(kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+'</b> — فرم درون‌گفت‌وگو:'+E28.ctrBubble();
        cr();
      }
      if(E28.ctrDone!==D.code){
        E28.ctrDone=D.code;
        botC('قرارداد داخلی <b dir="ltr">'+esc(D.code)+'</b> ثبت شد. این ثبت رسمی نیست و در صورت نیاز می‌توانید فسخ را در همین گفت‌وگو آغاز کنید.'+
          '<div class="racts"><button class="qbtn primary" data-cba="ctrCont" data-v="trm">شروع فسخ و تخلیه</button></div>',null);
      }
      return done;
    };
  }catch(e){console.error('E30 signed-contract refresh',e)}

  /* 3) discovery engine routes free-form openings FIRST (outermost ceSend wrap) */
  try{
    var curSend=ceSend;
    ceSend=function(t){
      if(String(t)==='!back'){curSend(t);return}
      /* A request to SEE a map belongs to the chat, even mid-flow.  Do not
         navigate to the legacy standalone map view or mutate the active step. */
      var mapQuery=normFa(String(t||'')).replace(/^\s+|\s+$/g,'');
      if(/^نقشه(?:\s|$)/.test(mapQuery)){
        usrC(String(t));
        E30.chatMap({hood:hoodFromText(mapQuery)});
        return;
      }
      try{if(E30.discAPI.route(String(t).replace(/^\s+|\s+$/g,''),t))return}catch(e){console.error('E30 disc',e)}
      curSend(t);
    };
  }catch(e){console.error('E30 wrap ceSend',e)}

  /* 3a) Interactive map belongs to the conversation.  Leaflet's tiles are
         fetched only after an explicit click, and the card remains useful
         without network access.  A new chat message re-renders HIST, so its
         load button can recreate the map without changing the flow cursor. */
  try{
    var mapSeq30=0;
    E30.chatMap=function(opts){
      opts=opts||{};
      var mode=opts.mode||CE.f||'browse';
      var D=(mode==='rent'||mode==='buy'||mode==='stay')?wd(mode).data:{};
      var hid=opts.hood||(D&&D.hood)||'';
      var selected=mode==='rent'?(D&&D.listing):mode==='buy'?(D&&D.blist):mode==='stay'?(D&&D.stay):'';
      var title=hid&&HOODS.some(function(h){return h.id===hid})?'محلهٔ '+esc(findH(hid).n):'محله‌ها و مکان‌های مهم';
      if(mode==='stay'&&selected)title=esc(findS(selected).t);
      var id='e30-mcard-'+(++mapSeq30)+'-'+Date.now();
      var areas=mode==='stay'?(D&&D.city?stayList(D.city):SLIST):HOODS;
      var list=areas.map(function(h){
        var name=mode==='stay'?h.t:h.n;
        var attrs=mode==='stay'?'data-stay="'+qesc(h.id)+'"':'data-h="'+qesc(h.id)+'"';
        return '<button type="button" class="btn btn-xs" data-cba="e30MapInfo" '+attrs+'>'+esc(name)+'</button>';
      }).join('');
      botC('<section class="e30-chat-map-card" data-e30-map-card="'+qesc(id)+'" data-e30-mode="'+qesc(mode)+'" data-e30-hood="'+qesc(hid)+'" data-e30-listing="'+qesc(selected||'')+'">'+
        '<div class="e30-chat-map-heading"><b>نقشهٔ تعاملی — '+title+'</b><span class="badge b-info">دادهٔ نمونه</span></div>'+
        '<p class="note">نشانگرهای ملک‌های نمونه تقریباً در محدودهٔ محله قرار دارند و نشانی دقیق ملک نیستند. بارگذاری کاشی‌های نقشه از OpenStreetMap به اتصال بیرونی نیاز دارد.</p>'+
        '<div class="e30-chat-map-canvas" data-e30-map-canvas role="region" aria-label="نقشهٔ تعاملی داخل گفت‌وگو"><p class="note">برای مشاهدهٔ نقشهٔ تعاملی، روی «بارگذاری نقشه» بزنید.</p></div>'+
        '<div class="e30-chat-map-actions"><button type="button" class="btn btn-sm btn-primary" data-cba="e30MapLoad">بارگذاری نقشه</button>'+
        (CE.f?'<button type="button" class="btn btn-sm" data-cba="e30MapContinue">بازگشت به گام جاری</button>':'')+'</div>'+
        '<div class="e30-chat-map-areas"><small>انتخاب مکان برای نمایش اطلاعات (بدون تغییر ملک فعلی):</small><div class="chips">'+list+'</div></div></section>',null);
      return true;
    };
    CBACT.e30MapLoad=function(el){
      var card=el.closest('[data-e30-map-card]'),canvas=card&&card.querySelector('[data-e30-map-canvas]');
      if(!canvas||!card)return;
      if(!window.L){canvas.innerHTML='<p class="note">کتابخانهٔ نقشه در دسترس نیست؛ می‌توانید محله‌ها یا اقامتگاه‌ها را از دکمه‌های زیر نقشه انتخاب کنید.</p>';return}
      var mode=card.getAttribute('data-e30-mode'),hid=card.getAttribute('data-e30-hood');
      var listing=card.getAttribute('data-e30-listing'),ll=[35.755,51.40],zoom=11,selected=null;
      if(mode==='stay'&&listing){selected=SLIST.filter(function(x){return x.id===listing})[0];if(selected){ll=selected.ll;zoom=13}}
      else if(hid&&HOODS.some(function(h){return h.id===hid})){ll=findH(hid).ll;zoom=13}
      if(canvas.id&&MAPS[canvas.id]){
        try{MAPS[canvas.id].remove()}catch(e){}
        delete MAPS[canvas.id];
      }
      canvas.id='e30-chat-map-'+(++mapSeq30);
      canvas.innerHTML='';
      var m=mkMap(canvas.id,ll,zoom);
      if(!m)return;
      /* Leaflet intentionally stops DOM click bubbling within its popup;
         connect native popup controls to the existing chat action handlers. */
      m.on('popupopen',function(e){
        var pop=e.popup&&e.popup.getElement&&e.popup.getElement();if(!pop)return;
        Array.prototype.forEach.call(pop.querySelectorAll('[data-cba]'),function(btn){
          btn.addEventListener('click',function(ev){
            ev.preventDefault();ev.stopPropagation();
            var f=CBACT[btn.getAttribute('data-cba')];if(f)f(btn);
          });
        });
      });
      if(mode==='stay'){
        (selected?[selected]:SLIST).forEach(function(s){
          if(!s||!Array.isArray(s.ll))return;
          L.marker(s.ll,{icon:pinIcon('listing',s.t)}).addTo(m).bindPopup('<b>'+esc(s.t)+'</b><br>اقامتگاه نمونه — '+esc(s.city)+'<br><button class="btn btn-xs" data-cba="e30MapInfo" data-stay="'+qesc(s.id)+'">جزئیات</button>');
        });
      }else{
        HOODS.forEach(function(h){
          L.marker(h.ll,{icon:pinIcon('hood',h.n)}).addTo(m).bindPopup('<b>'+esc(h.n)+'</b><br>نشانگر مرکز محله (نمونه)<br><button class="btn btn-xs" data-cba="e30MapInfo" data-h="'+qesc(h.id)+'">جزئیات محله</button>');
        });
        if(listing&&(mode==='rent'||mode==='buy')){
          selected=(mode==='rent'?RLIST:BLIST).filter(function(x){return x.id===listing})[0];
          if(selected){
            var h=findH(selected.hood),idx=(mode==='rent'?RLIST:BLIST).indexOf(selected),j=jll(idx);
            L.marker([h.ll[0]+j[0],h.ll[1]+j[1]],{icon:pinIcon('listing',selected.t)}).addTo(m)
              .bindPopup('<b>'+esc(selected.t)+'</b><br>نقطهٔ تقریبیِ نمونه، نه نشانی ملک');
          }
        }
        getPlaces().forEach(function(p){
          var pos=placeLL(p);if(pos)L.marker(pos,{icon:pinIcon('work',p.label)}).addTo(m).bindPopup('<b>'+esc(p.label)+'</b><br>مکان ثبت‌شده در مرورگر شما');
        });
      }
      canvas.setAttribute('data-e30-map-loaded','true');
      el.textContent='بارگذاری دوبارهٔ نقشه';
      setTimeout(function(){try{m.invalidateSize()}catch(e){}},80);
    };
    CBACT.e30MapInfo=function(el){
      var stayId=el.getAttribute('data-stay'),hid=el.getAttribute('data-h');
      if(stayId){var s=SLIST.filter(function(x){return x.id===stayId})[0];if(s)botC('<b>'+esc(s.t)+'</b><p class="note">اقامتگاه نمونه در '+esc(s.city)+'؛ مبلغ شبانهٔ نمونه: '+rial(s.p)+'. این انتخاب، رزرو یا ملک منتخب فعلی را تغییر نمی‌دهد.</p>',null);return}
      var h=HOODS.filter(function(x){return x.id===hid})[0];
      if(h)botC('<b>'+esc(h.n)+'</b><div class="kv"><span>اجارهٔ نمونه</span><b>'+rial(h.avgRent)+'</b></div><div class="kv"><span>قیمت آگهی هر متر (نمونه)</span><b>'+rial(h.buyBase)+'</b></div><p class="note">برای حفظ انتخاب‌های پیشین، مشاهدهٔ این محله هیچ اطلاعاتی را تغییر نمی‌دهد.</p>',null);
    };
    CBACT.e30MapContinue=function(){if(CE.f&&SCRIPTS[CE.f])ceStep();else botC('گفت‌وگو آمادهٔ ادامه است. پرسش بعدی خود را بنویسید.',null)};
    ['rent','buy','stay'].forEach(function(mode){
      var script=SCRIPTS[mode];if(!script)return;
      script.forEach(function(step){
        if(step.acts&&typeof step.acts.map==='function')step.acts.map=function(){return E30.chatMap({mode:mode})};
      });
    });
  }catch(e){console.error('E30 chat map',e)}

  /* 3a) Revisiting a previously committed money step creates an editable revision.
     Historical slider controls remain locked by lockSliders() after ceStep renders
     the fresh bubble. Do not clear or mutate committed monetary facts until the
     user explicitly confirms a new value. */
  try{
    var _ceBack30=ceBack;
    ceBack=function(){
      try{
        if(CE.f&&CE.hist&&CE.hist.length){
          var backTo=CE.hist[CE.hist.length-1];
          var step=SCRIPTS[CE.f]&&SCRIPTS[CE.f][backTo.i];
          if(step&&step.money){
            var d=wd(CE.f).data;
            var slot=CE.f+'.'+step.id;
            if(d&&d._slid&&d._slid[slot]){
              delete d._slid[slot];
              save();
            }
          }
        }
      }catch(e){console.error('E30 back revision',e)}
      return _ceBack30();
    };
  }catch(e){console.error('E30 wrap ceBack',e)}

  /* 3b) auto-advance known steps whenever the script is about to render one */
  try{
    var _ceStep=ceStep;
    ceStep=function(){
      try{E30.autoRun()}catch(e){console.error('E30 autoRun',e)}
      _ceStep();
    };
  }catch(e){console.error('E30 wrap ceStep',e)}

  /* 4) Back is a real, editable navigation action. The historical bot slider
     remains locked, but a freshly rendered slider at the revisited step is
     writable. The original shortcut accidentally sent '!back' as user data. */
  try{
    var _ceBack=ceBack;
    ceBack=function(){
      if(CE.f&&CE.hist&&CE.hist.length){
        var prev=CE.hist[CE.hist.length-1],sc=SCRIPTS[CE.f],step=sc&&sc[prev.i];
        var D=wd(CE.f).data;
        if(step){
          /* slSlider stores its commit marker under the fully qualified
             slider key (e.g. 'rent.dep'), not only the script step ('dep'). */
          if(D&&D._slid){
            delete D._slid[step.id];
            delete D._slid[CE.f+'.'+step.id];
          }
          E30._manualEdit={f:CE.f,i:prev.i};
        }
      }
      _ceBack();
      try{E30.flowsAPI.syncStage()}catch(e){}
    };
  }catch(e){console.error('E30 back navigation',e)}

  /* 5) stage sync after every value commit (§2.4) + slider commit marker (§2.5) */
  try{
    var curVal=ceVal;
    ceVal=function(v,raw){
      if(v==='!back'){
        E30._slidPending=null;
        ceBack();
        return;
      }
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
      /* Chat HTML is rebuilt by cr(); dispose only chat-owned Leaflet maps
         before their containers are detached. Standalone legacy maps survive. */
      try{Object.keys(MAPS||{}).forEach(function(id){
        if(id.indexOf('e30-chat-map-')!==0)return;
        try{MAPS[id].remove()}catch(e){}
        delete MAPS[id];
      })}catch(e){}
      _cr();
      try{E30.flowsAPI.lockSliders()}catch(e){}
      try{E30.payVisual()}catch(e){}
    };
  }catch(e){console.error('E30 wrap cr',e)}

  /* 7) Route EVERY legacy paid action through the same explicit confirmation
        and transaction FSM as new services. A legacy spend() is never permitted
        to debit directly, even if an integration accidentally omits its wrapper.
        Each action is probed up to its original spend() call (which throws a
        private sentinel *before* the legacy debit). The customer sees the
        standard confirm card; only after explicit confirmation do we replay the
        action with a scoped no-debit spend shim. The FSM handles the one real
        debit/refund. This preserves existing workflow continuations, including
        synchronous conditional actions such as doRentVisit(). */
  try{
    spend=function(key){
      console.error('E30 refused unguarded legacy debit',key);
      toast('این سرویس به تأیید پرداخت استاندارد نیاز دارد؛ دوباره از کارت سرویس اقدام کنید.');
      return false;
    };
    function paymentInputSnapshot(){
      var ids=['bid-amt','bid-dur','bid-adj','bid-note'],out=[];
      ids.forEach(function(id){
        var el=document.getElementById(id);
        if(el)out.push({id:id,val:el.value,tag:el.tagName});
      });
      return out;
    }
    function withPaymentInputSnapshot(snapshot,fn){
      if(!snapshot.length)return fn();
      var host=document.createElement('div');
      host.style.display='none';
      snapshot.forEach(function(x){
        /* The payment modal replaced the proposal inputs. Recreate their exact
           submitted values only for the synchronous confirmed continuation. */
        if(document.getElementById(x.id))return;
        var el=document.createElement(x.tag==='TEXTAREA'?'textarea':(x.tag==='SELECT'?'select':'input'));
        el.id=x.id;el.value=x.val;
        if(x.tag==='SELECT'){
          var op=document.createElement('option');op.value=x.val;op.textContent=x.val;el.appendChild(op);el.value=x.val;
        }
        host.appendChild(el);
      });
      document.body.appendChild(host);
      try{return fn()}finally{host.parentNode.removeChild(host)}
    }
    function guardPaidAction(fn){
      if(typeof fn!=='function'||fn._e30PayGuard)return fn;
      var wrapped=function(){
        var self=this,args=Array.prototype.slice.call(arguments),trap={},quote=null,result;
        var inputs=paymentInputSnapshot(),prev=spend;
        try{
          spend=function(key,cat,desc){throw {e30SpendTrap:trap,key:key,cat:cat,desc:desc}};
          result=fn.apply(self,args);
        }catch(e){
          if(e&&e.e30SpendTrap===trap)quote=e;
          else throw e;
        }finally{spend=prev}
        if(!quote)return result;
        var originalKey=quote.key;
        return E30.pay.begin({key:originalKey,title:E30.label(originalKey),desc:quote.desc,
          source:'legacy-confirmed',ctx:quote.cat,
          onConfirm:function(){
            var former=spend;
            spend=function(key){
              if(key!==originalKey)throw new Error('Unexpected nested legacy paid service: '+key);
              return true; /* paid ONCE by E30.pay, never by the legacy path */
            };
            try{
              var completed=withPaymentInputSnapshot(inputs,function(){return fn.apply(self,args)});
              // The old escrow action re-renders before asynchronous payment
              // confirmation. Refresh the chat step after release, so delivery
              // becomes reachable without clicking a stale release button.
              if(originalKey==='escrow'&&completed!==false&&CURRENT==='landing'&&CE.f==='buy'&&SCRIPTS.buy[CE.i]?.id==='escC')ceStep();
              return completed===false?false:true;
            }finally{spend=former}
          }
        });
      };
      wrapped._e30PayGuard=true;
      return wrapped;
    }
    function paidSource(fn){
      try{return /\b(?:spend|doRentVisit)\s*\(/.test(Function.prototype.toString.call(fn))}catch(e){return false}
    }
    var legacyGuarded=[];
    [[ACT,'ACT'],[CBACT,'CBACT']].forEach(function(pair){
      var group=pair[0];
      Object.keys(group||{}).forEach(function(k){
        if(paidSource(group[k])){group[k]=guardPaidAction(group[k]);legacyGuarded.push(pair[1]+'.'+k)}
      });
    });
    Object.keys(SCRIPTS||{}).forEach(function(k){
      (SCRIPTS[k]||[]).forEach(function(step){
        if(!step||!step.acts)return;
        Object.keys(step.acts).forEach(function(a){
          if(paidSource(step.acts[a])){step.acts[a]=guardPaidAction(step.acts[a]);legacyGuarded.push('SCRIPTS.'+k+'.'+(step.id||'?')+'.'+a)}
        });
      });
    });
    E30.legacyPayGuarded=legacyGuarded;
  }catch(e){console.error('E30 legacy payment guards',e)}

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

  /* 7e) Keep service entry routes in the chat canvas. A few legacy ceSmart
         shortcuts still redirected to independent pages and cleared the chat
         collector. Existing SCRIPTS are safe to start directly in chat; the
         legacy-only paths now offer an honest guided request draft instead of
         opening an unrelated screen or pretending full service completion. */
  try{
    var _smart30=ceSmart;
    function inChatFlow(f,label){
      if(!SCRIPTS[f]){botC('مسیر «'+esc(label)+'» هنوز گفت‌وگوی عملیاتیِ کامل ندارد و ثبت نهایی انجام نمی‌شود.',null);return true}
      botC('مسیر «'+esc(label)+'» را در همین گفت‌وگو شروع می‌کنیم.',null);
      ceStart(f);return true;
    }
    CBACT.e30ContractList=function(){
      var cs=S.contracts||[];
      if(!cs.length){botC('هنوز قراردادی ثبت نشده است. برای ساخت قرارداد اجاره از همین گفت‌وگو شروع کنید.<div class="qr"><button data-cba="e30StartRent">آغاز اجاره و قرارداد</button></div>',null);return}
      var h='<b>قراردادهای ذخیره‌شدهٔ این مرورگر</b><div class="sect">'+cs.slice(0,15).map(function(c){
        return '<div class="kv"><span>'+esc(c.title||c.code||'قرارداد')+'</span><b>'+esc(c.status||'نامشخص')+'</b></div>';
      }).join('')+'</div><p class="note">صرف نمایش این فهرست به معنی تأیید هویت یا اعتبار حقوقی قرارداد نیست.</p>';
      botC(h,null);
    };
    CBACT.e30RequestGRT=function(){
      botC('<b>درخواست اولیهٔ اجارهٔ تضمینی (نمایشی)</b><p class="note">این مرحله فقط پیش‌درخواست را ذخیره می‌کند؛ ارزیابی ملک، تضمین پرداخت و قرارداد مدیریت بدون اجرای مراحل بعدی قطعی نیست.</p>'+
        '<div class="sect"><label>محدوده یا نشانی کلی ملک<input class="inp" id="e30-grt-address" placeholder="مثلاً سعادت‌آباد" autocomplete="off"></label>'+
        '<label>متراژ تقریبی<input class="inp" id="e30-grt-area" type="number" min="1" max="100000" placeholder="متر مربع"></label>'+
        '<button class="btn btn-sm btn-primary" data-cba="e30SaveGRT">ذخیرهٔ پیش‌درخواست</button></div>',null);
    };
    CBACT.e30SaveGRT=function(){
      var a=(document.getElementById('e30-grt-address')||{}).value||'';
      var m=+(document.getElementById('e30-grt-area')||{}).value;
      if(!a.trim()||!Number.isFinite(m)||m<=0){toast('محدودهٔ ملک و متراژ معتبر را وارد کنید');return}
      var rid=addReq('grt','پیش‌درخواست','درخواست اولیهٔ اجارهٔ تضمینی — '+a.trim().slice(0,60),'در انتظار تکمیل',
        'محدوده: '+a.trim().slice(0,120)+' · متراژ: '+m+' متر · صرفاً پیش‌نویس داخلی');
      botC('پیش‌درخواست با شناسهٔ '+esc(rid)+' در همین مرورگر ثبت شد. این وضعیت تأیید صلاحیت ملک، تضمین اجاره یا انعقاد قرارداد نیست.',null);
    };
    CBACT.e30RequestService=function(){
      botC('<b>درخواست اولیهٔ خدمات ملک</b><p class="note">این فرم صرفاً پیش‌درخواست داخلی ثبت می‌کند؛ تأمین‌کننده و قیمت نهایی هنوز تعیین نشده است.</p>'+
        '<div class="sect"><label>نوع خدمت<select id="e30-svc-type" class="inp"><option>تعمیر و نگهداری</option><option>نظافت</option><option>بررسی تأسیسات</option></select></label>'+
        '<label>شرح کوتاه<textarea id="e30-svc-detail" class="inp" rows="2" placeholder="موضوع و محدودهٔ کار"></textarea></label>'+
        '<button class="btn btn-sm btn-primary" data-cba="e30SaveService">ثبت پیش‌درخواست</button></div>',null);
    };
    CBACT.e30SaveService=function(){
      var kind=(document.getElementById('e30-svc-type')||{}).value||'',description=(document.getElementById('e30-svc-detail')||{}).value||'';
      if(!description.trim()){toast('شرح خدمت را بنویسید');return}
      var rid=addReq('svc','پیش‌درخواست',kind,'در انتظار تکمیل',description.trim().slice(0,300));
      botC('پیش‌درخواست خدمات با شناسهٔ '+esc(rid)+' ذخیره شد؛ هنوز تأمین‌کننده، زمان، قیمت یا پرداختی تأیید نشده است.',null);
    };
    ceSmart=function(t){
      var nt=normFa(String(t||''));
      if(/اجاره.{0,5}تضمینی|تضمینی/.test(nt)){
        botC('«اجارهٔ تضمینی» در این نمونه هنوز مسیر کامل درون‌چتی ندارد؛ می‌توانید پیش‌درخواست داخلی ثبت کنید. هیچ تضمین مالی، احراز هویت یا عقد قراردادی در این مرحله انجام نمی‌شود.'+
          '<div class="qr"><button data-cba="e30RequestGRT">شروع پیش‌درخواست در همین گفتگو</button></div>',null);
        return true;
      }
      if(/قرارداد|کد رهگیری/.test(nt)&&!/بازدید|خرید|فروش/.test(nt)){
        botC('مدیریت قرارداد را در همین گفتگو انجام می‌دهیم؛ قراردادهای موجود را ببینید یا مسیر اجاره را برای ایجاد قرارداد تازه آغاز کنید.'+
          '<div class="qr"><button data-cba="e30ContractList">فهرست قراردادها</button><button data-cba="e30StartRent">آغاز قرارداد اجاره</button></div>',null);
        return true;
      }
      if(/رزرو|اقامت|سفر/.test(nt))return inChatFlow('stay','اقامت کوتاه‌مدت');
      if(/پروژه/.test(nt))return inChatFlow('mkt','پروژه‌ها');
      if(/ساخت|مصالح/.test(nt))return inChatFlow('build','ساخت و مصالح');
      if(/خدمات|تعمیر|نظافت/.test(nt)){
        botC('برای خدمات ملک می‌توانیم پیش‌درخواست را همین‌جا ثبت کنیم. این ثبت به معنی اعزام قطعی یا قرارداد با پیمانکار نیست.'+
          '<div class="qr"><button data-cba="e30RequestService">ثبت پیش‌درخواست خدمات</button></div>',null);
        return true;
      }
      return _smart30(t);
    };
    CBACT.e30StartRent=function(){return inChatFlow('rent','اجاره و قرارداد')};
  }catch(e){console.error('E30 chat-first service routes',e)}

  /* 7d) Honest termination guidance. Without a document parser/backend it is
         misleading to sell "AI document analysis". Show a FREE checklist in
         the current chat and save it as a contract-related guidance artifact. */
  try{
    E29.termAI=function(code){
      var c=null;
      (S.contracts||[]).some(function(x){if(x.code===code){c=x;return true}return false});
      if(!c){toast('قرارداد یافت نشد');return false}
      var h='<div class="e29-detail e30-term-guide"><h4>چک‌لیست پیگیری فسخ قرارداد (رایگان)</h4><div class="sect">'+
        '<div class="kv"><span>قرارداد</span><b>'+esc(c.title||'بدون عنوان')+'</b></div>'+
        '<div class="kv"><span>شناسه</span><b dir="ltr">'+esc(String(code))+'</b></div>'+
        '<div class="kv"><span>وضعیت ثبت‌شده</span><b>'+esc(c.status==='terminated'?'فسخ‌شده':(c.status||'نیازمند بررسی'))+'</b></div>'+
        '</div><p>موارد زیر را طرفین باید با اسناد و توافق واقعی بررسی کنند:</p><ol>'+
        '<li>اصل قرارداد و توافق کتبی فسخ، تاریخ مؤثر و امضای طرفین.</li>'+
        '<li>صورت‌جلسهٔ تحویل ملک و وضعیت کلیدها، کنتورها و تجهیزات.</li>'+
        '<li>مبلغ ودیعهٔ قابل استرداد، تاریخ تسویه و رسیدهای واریز.</li>'+
        '<li>بدهی اجاره/شارژ/قبوض و خسارت‌ها فقط با مستندات و توافق معتبر.</li>'+
        '<li>اختلاف‌های حل‌نشده و مرجع قراردادی یا قانونی پیگیری.</li>'+
        '</ol><p class="note">این فهرست راهنمای عمومی است؛ هیچ فایل یا سندی خوانده یا با هوش مصنوعی تحلیل نشده است. تشخیص حقوقی و مبلغ نهایی تسویه نیازمند بررسی واقعی اسناد است.</p></div>';
      if(CURRENT!=='landing')go('landing');
      var existing=(S.library||[]).filter(function(x){return x.e30TerminationGuidance&&x.entityId===code})[0];
      var item=existing||E29.libAPI.saveArtifact({type:'contract',title:'چک‌لیست فسخ — '+(c.title||code),
        summary:'راهنمای عمومی رایگان؛ بدون تحلیل اسناد',entityId:code,tokenCost:0,artifact:{html:h}});
      if(item){
        if(existing){
          item.artifact={html:h};item.updatedAt=Date.now();
          item.versions=(item.versions||[]).concat([{ts:item.updatedAt,note:'به‌روزرسانی چک‌لیست بدون تحلیل اسناد',artifact:{html:h}}]);
        }else item.e30TerminationGuidance=true;
        if(!item.sourceChat)item.sourceChat=E30.chatRef().chatId;
        save();
      }
      botC(h+'<div class="note">'+(item?'این راهنما در کتابخانهٔ قراردادها نیز ذخیره شد.':'')+'</div>',null);
      return !!item;
    };
    CBACT.e29termAI=function(el){
      var code=el.getAttribute('data-code');
      if(!code){(S.contracts||[]).some(function(c){if(c.status==='terminated'){code=c.code;return true}return false})}
      return E29.termAI(code);
    };
    CBACT.e29termLater=function(){usrC('فعلاً نه');botC('هر وقت خواستید چک‌لیست رایگان پیگیری فسخ را از همین گفتگو باز کنید.',null)};
  }catch(e){console.error('E30 termination guidance',e)}

  /* 8) landing/splash route + view (public, pre-auth allowed) */
  try{E30.landingInit()}catch(e){console.error('E30 landing',e)}

  /* 9) UX patches: saved listings, share independence, projects, reminders */
  try{E30.uxInit()}catch(e){console.error('E30 ux',e)}

  /* 9b) A burst of toasts used to cover the fixed chat composer. Deduplicate
         near-identical events and bound the simultaneous visible stack. */
  try{
    var _toast30=toast,lastToast={},lastPrune=0;
    toast=function(msg){
      var now=Date.now(),key=String(msg||'');
      if(lastToast[key]&&now-lastToast[key]<1000)return;
      lastToast[key]=now;
      if(now-lastPrune>10000){Object.keys(lastToast).forEach(function(k){if(now-lastToast[k]>10000)delete lastToast[k]});lastPrune=now}
      var root=document.getElementById('toast-root');
      if(root){while(root.children.length>=3)root.removeChild(root.firstElementChild)}
      return _toast30(msg);
    };
  }catch(e){console.error('E30 toast guard',e)}

  /* 10) persona fix regression hook (§2.7): disc engine reclassifies on every turn —
         make the deterministic engine's saved persona follow the dynamic one */
  try{
    E29.intelAPI.personaOf=function(){return E30.discAPI.personaOf('rent')};
  }catch(e){}
};
