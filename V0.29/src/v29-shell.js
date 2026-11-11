/* ═══════════════ V0.29 — E29 SHELL: sidebar IA, panels, layout, init wiring ═══════════════ */
E29.shell=(function(){
  /* ── slide-over panel manager ── */
  var cur=null;
  function openPanel(kind,opts){
    closePanel(true);
    var back=document.createElement('div');
    back.className='e29-pback';back.id='e29-pback';
    back.onclick=function(){closePanel()};
    var panel=document.createElement('div');
    panel.className='e29-panel';panel.id='e29-panel';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.innerHTML=kindHTML(kind,opts);
    document.body.appendChild(back);document.body.appendChild(panel);
    cur={kind:kind,opts:opts||{},back:back,panel:panel};
    requestAnimationFrame(function(){back.classList.add('on');panel.classList.add('on')});
    var close=panel.querySelector('.e29-pclose');
    if(close)close.focus();
    if(kind==='library')E29.libAPI.mountPanel(opts);
    else if(kind==='notifications')E29.notifsAPI.render();
    else if(kind==='reminders')mountReminders();
    else if(kind==='projects')E29.projAPI.mountPanel(opts&&opts.pid);
    if(kind==='library'){
      var inp=document.getElementById('e29-lsq');
      if(inp)inp.focus();
    }
  }
  function kindHTML(kind,opts){
    if(kind==='library')return E29.libAPI.panelHTML();
    if(kind==='notifications')return E29.notifsAPI.panelHTML();
    if(kind==='projects')return '<div class="e29-phead"><b>پروژه‌ها</b>'+
      '<button class="e29-pclose" data-act="e29panelClose">'+e29ico('x',16)+'</button></div>'+
      '<div class="e29-pbody" id="e29-lbody"></div>';
    if(kind==='reminders')return remindersHTML();
    return '<div class="e29-phead"><b>—</b></div>';
  }
  function closePanel(instant){
    var b=document.getElementById('e29-pback'),p=document.getElementById('e29-panel');
    if(!p)return;
    cur=null;
    if(instant){b&&b.remove();p.remove();return}
    b.classList.remove('on');p.classList.remove('on');
    setTimeout(function(){b&&b.remove();p.remove()},240);
  }
  ACT.e29panelClose=function(){closePanel()};

  /* ── reminders panel (management UI moved into Sidebar utility per spec §10.3) ── */
  function remindersHTML(){
    var h='<div class="e29-phead"><b>یادآورها</b>'+
      '<button class="e29-pclose" data-act="e29panelClose" title="بستن">'+e29ico('x',16)+'</button></div>'+
      '<div class="e29-pbody" id="e29-rbody"></div>'+
      '<div class="e29-pfoot"><button class="btn btn-sm btn-primary" data-act="e29remNew">یادآور تازه</button></div>';
    return h;
  }
  var rFilter='all';
  function mountReminders(){
    renderReminders();
  }
  function renderReminders(){
    var box=document.getElementById('e29-rbody');if(!box)return;
    var rems=(S.reminders||[]).slice();
    if(!rems.length){
      box.innerHTML='<div class="e29-empty"><div class="big">'+e29ico('alarm',34)+'</div><b>یادآوری ندارید</b>از گفت‌وگو یا دکمهٔ پایین بسازید.</div>';
      return;
    }
    var now=Date.now();
    var overdue=[],upcoming=[],done=[];
    rems.forEach(function(r){
      if(r.done||r.status==='done')done.push(r);
      else if((r.due||0)<now)overdue.push(r);
      else upcoming.push(r);
    });
    function row(r){
      var st=(r.due||0)<now&&!r.done?'<span class="badge b-bad">سررسید گذشته</span>':(r.done?'<span class="badge b-ok">انجام شد</span>':'');
      return '<div class="e29-notif" data-rem="'+qesc(r.id||'')+'"><span class="nic">'+e29ico('alarm',16)+'</span>'+
        '<span class="nb"><span class="nt">'+esc(r.title||'بدون عنوان')+'</span>'+
        '<span class="nm">'+(r.desc?esc(r.desc):'')+'</span>'+
        '<span class="nts">'+(r.due?fd(r.due):'—')+' '+st+'</span></span>'+
        '<span class="nacts">'+
        (r.done?'':'<button class="e29-cact" data-act="e29remDone" data-rem="'+qesc(r.id||'')+'" title="انجام شد">'+e29ico('check',15)+'</button>')+
        '<button class="e29-cact" data-act="e29remDel" data-rem="'+qesc(r.id||'')+'" title="حذف">'+e29ico('trash',15)+'</button>'+
        '</span></div>';
    }
    var h='';
    if(rFilter==='all'||rFilter==='overdue'){
      h+='<div class="e29-sec"><b>سررسید گذشته</b></div>';
      h+=overdue.length?overdue.map(row).join(''):'<div class="e29-pempty">ندارد</div>';
    }
    if(rFilter==='all'||rFilter==='upcoming'){
      h+='<div class="e29-sec"><b>پیش‌رو</b></div>';
      h+=upcoming.length?upcoming.slice(0,10).map(row).join(''):'<div class="e29-pempty">ندارد</div>';
    }
    if(rFilter==='all'||rFilter==='done'){
      h+='<div class="e29-sec"><b>انجام‌شده</b></div>';
      h+=done.length?done.slice(0,6).map(row).join(''):'<div class="e29-pempty">ندارد</div>';
    }
    box.innerHTML=h;
    a11yify(box);
  }
  ACT.e29remNew=function(){
    openModal('<h3>یادآور تازه</h3><input id="e29-rt" class="inp" type="text" placeholder="عنوان" style="width:100%;margin-top:10px">'+
      '<input id="e29-rd" class="inp" type="datetime-local" style="width:100%;margin-top:8px">'+
      '<div class="qr" style="margin-top:12px"><button data-act="e29remNewGo">ساخت</button><button data-act="closeModal">انصراف</button></div>');
  };
  ACT.e29remNewGo=function(){
    var t=(document.getElementById('e29-rt')||{}).value||'';
    var dv=(document.getElementById('e29-rd')||{}).value||'';
    if(!t.replace(/\s/g,'')){toast('عنوان را بنویسید');return}
    if(!S.reminders)S.reminders=[];
    var due=dv?Date.parse(dv):Date.now()+864e5;
    S.reminders.unshift({id:E29.uid('REM'),title:t,desc:'',due:due,rec:'once',done:false,status:'open',src:'manual',createdAt:Date.now(),updatedAt:Date.now()});
    save();closeModal();renderReminders();
    toast('یادآور ساخته شد');
  };
  ACT.e29remDone=function(el){
    var id=el.getAttribute('data-rem');
    (S.reminders||[]).forEach(function(r){if(r.id===id){r.done=true;r.status='done';r.updatedAt=Date.now()}});
    save();renderReminders();
  };
  ACT.e29remDel=function(el){
    var id=el.getAttribute('data-rem');
    var ix=-1,i;(S.reminders||[]).forEach(function(r,i2){if(r.id===id)ix=i2});
    if(ix>=0){S.reminders.splice(ix,1);save();renderReminders()}
  };

  /* ── sidebar render (V0.29 IA — spec §10.2) ── */
  function renderSidebar(){
    var el=document.getElementById('side'),app=document.getElementById('appwrap');
    if(!el)return;
    if(!S.auth){
      el.innerHTML='';el.style.display='none';
      if(app)app.style.gridTemplateColumns='1fr';
      return;
    }
    el.style.display='';if(app)app.style.gridTemplateColumns='';
    var fold=document.body.classList.contains('sidefold');
    var h='<div class="e27-sidehead"><button class="e27-fold" data-act="sideFold" data-tip="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'" aria-label="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'">'+(fold?e29ico('unfold',17):e29ico('fold',17))+'</button></div>';
    /* A. primary actions — identical geometry */
    h+='<div class="e29-prim">'+
      '<button class="e29-newbtn" data-act="chatNew" data-tip="گفت‌وگوی جدید"><span class="si">'+e29ico('plus',18)+'</span><span class="lbl">گفت‌وگوی جدید</span></button>'+
      '<button class="e29-searchbtn" data-act="e29focusSearch" data-tip="جست‌وجو در گفت‌وگوها"><span class="si">'+e29ico('search',18)+'</span><span class="lbl">جست‌وجو در گفت‌وگوها</span></button>'+
      '</div>';
    /* B. main utilities */
    var nUnread=(typeof E29!=='undefined'&&E29.notifsAPI)?E29.notifsAPI.unread():0;
    var remDue=(S.reminders||[]).filter(function(r){return !r.done&&(r.due||0)<Date.now()}).length;
    h+='<div class="e29-sec"><b>ابزارها</b></div>'+
      '<button class="e29-util" data-act="e29panelLib" data-tip="کتابخانه"><span class="si">'+e29ico('library',17)+'</span><span class="lbl">کتابخانه</span></button>'+
      '<button class="e29-util" data-act="e29panelRem" data-tip="یادآورها"><span class="si">'+e29ico('alarm',17)+'</span><span class="lbl">یادآورها</span>'+(remDue?'<span class="e29-bdg">'+fa(remDue,0)+'</span>':'')+'</button>'+
      '<button class="e29-util" data-act="e29panelNotif" data-tip="اعلان‌ها"><span class="si">'+e29ico('bell',17)+'</span><span class="lbl">اعلان‌ها</span>'+(nUnread?'<span class="e29-bdg">'+fa(nUnread,0)+'</span>':'')+'</button>';
    /* C. projects */
    h+='<div class="e29-sbody" id="e29-sbody">'+E29.projAPI.sectionHTML();
    /* D. conversation history */
    h+='<div class="e29-sec"><b>گفت‌وگوهای پیشین</b></div>';
    h+='<div class="e27-slist" id="e27-slist" aria-label="گفت‌وگوهای پیشین">'+E27.sessListHTML()+'</div>';
    h+='</div>';
    /* E. account area */
    h+='<div class="e29-sbot">'+
      '<button class="e29-srow" data-act="themeToggle" aria-pressed="'+(E22.isDark()?'true':'false')+'" data-tip="'+(E22.isDark()?'حالت روشن':'حالت تاریک')+'"><span class="si">'+(E22.isDark()?E22.ICO.sun:E22.ICO.moon)+'</span><span class="lbl">'+(E22.isDark()?'حالت روشن':'حالت تاریک')+'</span></button>'+
      '<button class="e29-srow" data-act="wallet" data-tip="کیف پول"><span class="si">'+e29ico('wallet',17)+'</span><span class="lbl">کیف پول</span><small style="margin-inline-start:auto">'+rial(S.wallet)+'</small></button>'+
      '<button class="e29-srow" data-act="e29shManage" data-tip="لینک‌های اشتراک‌گذاری"><span class="si">'+e29ico('share',17)+'</span><span class="lbl">لینک‌های اشتراک‌گذاری</span></button>'+
      '<button class="e29-srow" data-act="account" data-tab="overview" data-tip="حساب کاربری"><span class="si">'+e29ico('user',17)+'</span><span class="lbl">'+esc(S.auth.name||'حساب کاربری')+'</span><small style="margin-inline-start:auto">'+fa(S.tokens,0)+' توکن</small></button>'+
      '<button class="e29-srow" data-view="profile" data-tip="تنظیمات"><span class="si">'+e29ico('gear',17)+'</span><span class="lbl">تنظیمات و حساب</span></button>'+
      '</div>';
    el.innerHTML=h;
    var sq=el.querySelector('#e27-sq');
    if(sq){sq.addEventListener('input',function(){E27.sq=sq.value;E27.applySq()})}
    /* note: sessListHTML no longer renders a search input (search moved to primary action) */
    a11yify(el);
  }
  function renderSidebarOnly(){
    try{renderSidebar()}catch(e){}
  }
  ACT.e29focusSearch=function(){
    var body=document.body;
    if(body.classList.contains('sidefold')){ACT.sideFold&&ACT.sideFold({getAttribute:function(){return ''}});setTimeout(focusSq,260)}
    else focusSq();
    function focusSq(){
      var el=document.getElementById('e27-slist');
      /* restore legacy inline search input for typed filtering */
      var side=document.getElementById('side');
      if(side&&!side.querySelector('#e27-sq')){
        var div=document.createElement('div');
        div.className='e27-search';
        div.innerHTML=e29ico('search',15)+'<input id="e27-sq" type="text" placeholder="جست‌وجو در گفت‌وگوها…" aria-label="جست‌وجو در گفت‌وگوها">';
        side.insertBefore(div,el);
        a11yify(div);
      }
      var sq=document.getElementById('e27-sq');
      if(sq){sq.focus()}
    }
  };
  ACT.e29panelLib=function(){openPanel('library')};
  ACT.e29panelNotif=function(){openPanel('notifications')};
  ACT.e29panelRem=function(){openPanel('reminders')};

  function addShareButton(){
    if(typeof E28==='undefined'||!E28.msgActs)return;
    var _orig=E28.msgActs;
    E28.msgActs=function(m,ix){
      var h=_orig(m,ix);
      if(m&&m.r==='bot'&&h){
        var inner=h.slice(h.indexOf('>')+1,h.lastIndexOf('</span>'));
        h='<span class="macts">'+inner+'<button type="button" data-act="e29shMsg" data-ix="'+ix+'" aria-label="اشتراک‌گذاری پاسخ" title="اشتراک‌گذاری">'+e29ico('share',14)+'</button></span>';
      }
      return h;
    };
  }

  /* badge refresh */
  function refreshBadges(){
    if(document.getElementById('e29-panel')){
      if(cur&&cur.kind==='notifications')E29.notifsAPI.render();
    }
    renderSidebarOnly();
  }

  /* ── hash routes: #s/<token> snapshot view ── */
  function checkHash(){
    var m=(location.hash||'').match(/^#s\/([a-z0-9]+)/i);
    if(m)E29.share.openSnapshotView(m[1]);
  }

  /* ── init ── */
  E29.init=function(){
    try{E22.applyTheme&&E22.applyTheme()}catch(e){}
    try{addShareButton()}catch(e){}
    /* wrap ceSend: intel route first (above E28 layers) */
    try{
      var curSend=ceSend;
      ceSend=function(t){
        if(String(t)==='!back'){curSend(t);return}
        try{if(E29.intelAPI.route(String(t).replace(/^\s+|\s+$/g,''),t))return}catch(e){console.error('E29 intel',e)}
        curSend(t);
      };
    }catch(e){console.error('E29 wrap ceSend',e)}
    /* ceVal hook: milestone saving after step advance */
    try{
      var curVal=ceVal;
      ceVal=function(v,raw){
        var r=curVal(v,raw);
        try{
          if(CE.f&&(CE.f==='rent'||CE.f==='buy')){
            var d=wd(CE.f);
            if(d&&!d.done)E29.intelAPI.maybeMilestone(CE.f,CE.i+1,d.data);
          }
        }catch(e){}
        return r;
      };
    }catch(e){}
    /* reminder due → notification hook (wraps E28.remTick) */
    try{
      var curTick=ppmTick;
      ppmTick=function(){
        curTick();
        try{
          (S.reminders||[]).forEach(function(r){
            if(r.done||r._v29notified)return;
            if((r.due||0)<Date.now()&&Date.now()-(r.due||0)<3600000){
              r._v29notified=true;
              E29.notifsAPI.push({cat:'reminder',etype:'reminder.due',title:'یادآور: '+r.title,msg:'زمان انجام رسیده است.',action:{kind:'reminders'},dedupKey:'rem-'+r.id+'-'+new Date().toDateString()});
            }
          });
        }catch(e){}
      };
    }catch(e){}
    /* conversation share button */
    try{
      ACT.e29shMsg=function(el){E29.share.dialog('conversation',null,{msgIx:+el.getAttribute('data-ix')})};
    }catch(e){}
    /* wrap E28.applyTermination: offer AI analysis after a successful termination */
    try{
      if(E28&&E28.applyTermination){
        var _oTerm=E28.applyTermination;
        E28.applyTermination=function(arg){
          var r=_oTerm(arg);
          try{
            var code=(typeof arg==='string')?arg:(arg&&arg.code);
            var obj=(typeof arg==='string')?(E28.contractOf?E28.contractOf(code):null):arg;
            if(code&&obj&&obj.status==='terminated'&&!obj._v29aiOffer){
              obj._v29aiOffer=true;
              botC('قرارداد فسخ شد — در صورت تمایل، تحلیل هوشمند اسناد فسخ (استخراج الزامات تسویه) موجود است.'+
                '<div class="qr"><button data-cba="e29termAI" data-code="'+qesc(code)+'">تحلیل هوشمند اسناد</button><button data-cba="e29termLater">فعلاً نه</button></div>',null);
            }
          }catch(e){}
          return r;
        };
      }
    }catch(e){}
    try{checkHash()}catch(e){}
    try{E29.notifsAPI.unread()}catch(e){}
  };
  window.addEventListener('hashchange',checkHash);

  return {openPanel:openPanel,closePanel:closePanel,refreshBadges:refreshBadges,renderSidebar:renderSidebar,renderSidebarOnly:renderSidebarOnly};
})();
