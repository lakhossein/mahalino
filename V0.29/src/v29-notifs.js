/* ═══════════════ V0.29 — E29 NOTIFS: event-based notification center ═══════════════ */
E29.notifs=(function(){
  var CATS={property:'ملک',contract:'قرارداد',financial:'مالی',analysis:'تحلیل',reminder:'یادآور',workflow:'گردش کار'};
  var CAT_ICON={property:'folder',contract:'doc',financial:'coin',analysis:'chart',reminder:'alarm',workflow:'spark'};
  var PREF_CATS=['property','contract','financial','analysis','reminder','workflow'];

  function store(){if(!S.notifs)S.notifs=[];return S.notifs}
  function prefs(){
    if(!S.prefs)S.prefs={};
    if(!S.prefs.notif)S.prefs.notif={inApp:true,browser:true,quiet:{on:false,from:22,to:8},cats:{}};
    PREF_CATS.forEach(function(c){if(S.prefs.notif.cats[c]===undefined)S.prefs.notif.cats[c]=true});
    return S.prefs.notif;
  }
  function inQuiet(){
    var p=prefs();if(!p.quiet.on)return false;
    var h=new Date().getHours();
    return h>=p.quiet.from||h<p.quiet.to;
  }
  function dedup(list,key){
    var i;for(i=0;i<list.length;i++){if(list[i].dedupKey===key)return true}
    return false;
  }
  function unread(){return store().filter(function(n){return !n.read}).length}

  /* push(spec) spec={cat,etype,title,msg,action:{kind,target},dedupKey,priority} */
  function push(sp){
    var st=store(),p=prefs();
    if(p.cats[sp.cat]===false)return null;
    var key=sp.dedupKey||([sp.etype,(sp.action&&sp.action.target)||'',new Date().toDateString()].join('|'));
    if(dedup(st,key))return null;
    var n={id:E29.uid('NT'),etype:sp.etype,cat:sp.cat,title:sp.title,msg:sp.msg||'',ts:Date.now(),
      read:false,priority:sp.priority||'normal',chatId:sp.chatId||null,wfId:sp.wfId||null,
      entityId:sp.entityId||null,action:sp.action||null,dedupKey:key};
    st.unshift(n);
    if(st.length>120)st.length=120;
    save();
    E29.bus.emit('library.badge',null); /* refresh sidebar counters */
    E29.shell.refreshBadges();
    if(prefs().inApp&&!inQuiet()){toast('🔔 '+n.title)}
    if(prefs().browser&&!inQuiet()&&typeof Notification!=='undefined'&&Notification.permission==='granted'){
      try{new Notification('محلینو — '+n.title,{body:n.msg})}catch(e){}
    }
    return n;
  }

  /* event subscriptions */
  E29.bus.on('token.deduct',function(d){push({cat:'financial',etype:'token.deduct',title:'کسر توکن',msg:fa(d.cost,0)+' توکن — '+(d.desc||E29.PRICING[d.svc]&&E29.PRICING[d.svc].label||''),action:{kind:'wallet'},dedupKey:d.txn})});
  E29.bus.on('token.refund',function(d){push({cat:'financial',etype:'token.refund',title:'بازگشت توکن',msg:'+'+fa(d.cost,0)+' توکن'+(d.reason?' — '+d.reason:''),action:{kind:'wallet'},dedupKey:d.txn+'-r'})});
  E29.bus.on('wallet.low',function(d){push({cat:'financial',etype:'wallet.low',title:'موجودی توکن کم است',msg:'تنها '+fa(d.balance,0)+' توکن باقی مانده — برای سرویس‌های تحلیلی شارژ کنید.',action:{kind:'wallet'},dedupKey:'low-'+new Date().toDateString()})});
  E29.bus.on('library.saved',function(d){push({cat:d.cat||'workflow',etype:'library.saved',title:'خروجی ذخیره شد',msg:'«'+d.title+'» در کتابخانه ذخیره شد.',action:{kind:'library',target:d.id},dedupKey:'lib-'+d.id})});
  E29.bus.on('reminder.due',function(d){push({cat:'reminder',etype:'reminder.due',title:'یادآور: '+d.title,msg:d.msg||'زمان انجام رسیده است.',action:{kind:'reminders'},dedupKey:'rem-'+d.id+'-'+new Date().toDateString()})});
  E29.bus.on('contract.status',function(d){push({cat:'contract',etype:'contract.status',title:d.title,msg:d.msg,action:{kind:'library',target:d.libId},entityId:d.code,dedupKey:'con-'+d.code+'-'+d.status})});
  E29.bus.on('analysis.completed',function(d){push({cat:'analysis',etype:'analysis.completed',title:d.title,msg:d.msg,action:{kind:'library',target:d.libId},dedupKey:'an-'+d.txn})});
  E29.bus.on('workflow.milestone',function(d){push({cat:'workflow',etype:'workflow.milestone',title:'پیشرفت گردش کار',msg:d.msg,action:{kind:'library',target:d.libId},dedupKey:d.dedupKey||('wf-'+d.wfId+'-'+d.milestone)})});

  /* actions */
  function markRead(id){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st[i].read=true;save();return}}}
  function markAll(){var st=store();st.forEach(function(n){n.read=true});save()}
  function del(id){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st.splice(i,1);save();return}}}
  function openAction(n){
    markRead(n.id);
    var a=n.action;if(!a)return;
    if(a.kind==='library')E29.shell.openPanel('library',{item:a.target});
    else if(a.kind==='wallet')E29.shell.closePanel(),go('landing'),ACT.account&&ACT.account({getAttribute:function(){return 'wallet'}});
    else if(a.kind==='reminders')E29.shell.openPanel('reminders');
    E29.shell.refreshBadges();
  }

  /* ── panel UI ── */
  var curCat='all';
  function itemHTML(n){
    return '<div class="e29-notif'+(n.read?'':' unread')+'" data-act="e29ntOpen" data-nt="'+qesc(n.id)+'" tabindex="0" role="button">'+
      '<span class="nic">'+e29ico(CAT_ICON[n.cat]||'bell',17)+'</span>'+
      '<span class="nb"><span class="nt">'+esc(n.title)+'</span><span class="nm">'+esc(n.msg)+'</span>'+
      '<span class="nts">'+fd(n.ts)+' · '+CATS[n.cat]+'</span></span>'+
      '<span class="nacts">'+
      (n.read?'':'<button class="e29-cact" data-act="e29ntRead" data-nt="'+qesc(n.id)+'" title="علامت‌گذاری خوانده‌شده">'+e29ico('check',15)+'</button>')+
      '<button class="e29-cact" data-act="e29ntDel" data-nt="'+qesc(n.id)+'" title="حذف">'+e29ico('trash',15)+'</button></span>'+
      (n.read?'':'<span class="ndot"></span>')+'</div>';
  }
  function renderBody(){
    var box=document.getElementById('e29-nlist');if(!box)return;
    var st=store().filter(function(n){return curCat==='all'||n.cat===curCat});
    if(!st.length){
      box.innerHTML='<div class="e29-empty"><div class="big">'+e29ico('bell',34)+'</div><b>اعلانی نیست</b>رویدادهای مهم اینجا می‌آیند.</div>';
      return;
    }
    box.innerHTML=st.map(itemHTML).join('');
  }
  function renderPrefs(){
    var box=document.getElementById('e29-nprefs');if(!box)return;
    var p=prefs();
    var h='<div class="e29-filters">';
    PREF_CATS.forEach(function(c){
      h+='<button class="e29-fchip'+(p.cats[c]===false?'':' on')+'" data-act="e29ntCatPref" data-cat="'+c+'">'+CATS[c]+'</button>';
    });
    h+='</div><div class="e29-filters">'+
      '<button class="e29-fchip'+(p.browser?' on':'')+'" data-act="e29ntBrowser">'+(p.browser?'اعلان مرورگر: فعال':'اعلان مرورگر: خاموش')+'</button>'+
      '<button class="e29-fchip'+(p.quiet.on?' on':'')+'" data-act="e29ntQuiet">'+(p.quiet.on?('سکوت: '+p.quiet.from+' تا '+p.quiet.to):'ساعات سکوت: خاموش')+'</button>'+
      '</div>';
    box.innerHTML=h;
  }
  function render(){renderBody();renderPrefs()}

  ACT.e29ntOpen=function(el){var st=store(),i,id=el.getAttribute('data-nt');for(i=0;i<st.length;i++){if(st[i].id===id){openAction(st[i]);return}}};
  ACT.e29ntRead=function(el){markRead(el.getAttribute('data-nt'));E29.shell.refreshBadges();render()};
  ACT.e29ntDel=function(el){del(el.getAttribute('data-nt'));E29.shell.refreshBadges();render()};
  ACT.e29ntReadAll=function(){markAll();E29.shell.refreshBadges();render()};
  ACT.e29ntClear=function(){if(S.notifs)S.notifs=[];save();E29.shell.refreshBadges();render()};
  ACT.e29ntFilter=function(el){curCat=el.getAttribute('data-cat')||'all';render()};
  ACT.e29ntCatPref=function(el){var c=el.getAttribute('data-cat'),p=prefs();p.cats[c]=(p.cats[c]===false);save();renderPrefs()};
  ACT.e29ntBrowser=function(){
    var p=prefs();
    if(!p.browser){p.browser=true;renderPrefs();save();return}
    if(typeof Notification!=='undefined'&&Notification.permission==='default'){
      Notification.requestPermission().then(function(r){if(r!=='granted'){p.browser=false;toast('اجازهٔ اعلان مرورگر داده نشد')}save();renderPrefs()});
    }else{p.browser=false;save();renderPrefs()}
  };
  ACT.e29ntQuiet=function(){var p=prefs();p.quiet.on=!p.quiet.on;save();renderPrefs()};
  function el0(ev){return ev.currentTarget||ev.target}

  /* panel content */
  function panelHTML(){
    var h='<div class="e29-phead"><b>مرکز اعلان‌ها</b>'+
      '<button class="e29-pclose" data-act="e29panelClose" title="بستن">'+e29ico('x',16)+'</button></div>'+
      '<div class="e29-ptabs">'+
      '<button class="e29-ptab on" data-act="e29ntFilter" data-cat="all">همه</button>';
    Object.keys(CATS).forEach(function(c){h+='<button class="e29-ptab" data-act="e29ntFilter" data-cat="'+c+'">'+CATS[c]+'</button>'});
    h+='</div><div class="e29-pbody"><div id="e29-nprefs"></div><div id="e29-nlist"></div></div>'+
      '<div class="e29-pfoot"><button class="btn btn-sm" data-act="e29ntReadAll">خواندن همه</button><button class="btn btn-sm" data-act="e29ntClear">پاک‌کردن همه</button></div>';
    return h;
  }

  /* reminder tick hook: emit reminder.due events (wraps E28.remTick at init) */
  E29.notifsAPI={push:push,unread:unread,render:render,panelHTML:panelHTML,markAll:markAll,CATS:CATS};
  return E29.notifsAPI;
})();
