/* ═══════════════ V0.29 — E29 LIBRARY: paid-output store, tabs, cards, details ═══════════════ */
E29.lib=(function(){
  var TYPES={
    contract:{label:'قرارداد',tab:'contracts',icon:'doc'},
    hood_analysis:{label:'تحلیل محله',tab:'analysis',icon:'chart'},
    valuation:{label:'تخمین ارزش',tab:'valuation',icon:'chart'},
    invest:{label:'تحلیل سرمایه‌گذاری',tab:'valuation',icon:'chart'},
    ai_process:{label:'پردازش هوشمند',tab:'ai',icon:'spark'},
    other:{label:'سایر خروجی‌های پولی',tab:'other',icon:'coin'},
    wf_progress:{label:'گردش کار در جریان',tab:'wf',icon:'clock'}
  };
  var TABS=[
    {id:'all',label:'همه'},
    {id:'contracts',label:'قراردادها'},
    {id:'analysis',label:'تحلیل محله'},
    {id:'valuation',label:'ارزش‌گذاری و سرمایه‌گذاری'},
    {id:'ai',label:'پردازش هوشمند'},
    {id:'other',label:'سایر خروجی‌ها'},
    {id:'wf',label:'گردش‌های در جریان'}
  ];

  function store(){if(!S.library)S.library=[];return S.library}
  function byId(id){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id)return st[i]}return null}
  function byTxn(txn){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].txnId===txn)return st[i]}return null}

  /* main entry: register a successfully generated paid output */
  function saveArtifact(spec){
    /* spec={type,title,summary,artifact,txnId,tokenCost,entityId,workflowId,status} */
    var st=store();
    if(spec.txnId&&byTxn(spec.txnId))return byTxn(spec.txnId); /* no duplicates */
    var ref=E29.chatRef();
    var it={id:E29.uid('LIB'),title:spec.title,type:spec.type||'other',
      summary:spec.summary||'',artifact:spec.artifact||{},createdAt:Date.now(),updatedAt:Date.now(),
      status:spec.status||'complete',sourceChat:ref.chatId,sourceTitle:ref.chatTitle,
      projectId:spec.projectId||projOfChat(ref.chatId),workflowId:spec.workflowId||null,
      entityId:spec.entityId||null,txnId:spec.txnId||null,tokenCost:spec.tokenCost||0,
      versions:[{ts:Date.now(),note:'ایجاد',artifact:spec.artifact||{}}],sharing:{shared:false}};
    st.unshift(it);
    if(st.length>200)st.length=200;
    save();
    E29.bus.emit('library.saved',{id:it.id,title:it.title,cat:(spec.type==='wf_progress'?'workflow':'analysis')});
    return it;
  }

  /* in-progress workflow milestone */
  function saveWorkflowProgress(wf,progressPct){
    if(!wf||!wf.m)return null;
    var st=store(),i,existing=null;
    for(i=0;i<st.length;i++){if(st[i].type==='wf_progress'&&st[i].workflowId===wf.id){existing=st[i];break}}
    var ref=E29.chatRef();
    var summary=E29.intel?E29.intel.wfSummary(wf):'';
    if(existing){
      existing.artifact={m:wf.m,step:wf.step,data:JSON.parse(JSON.stringify(wf.data||{})),done:!!wf.done};
      existing.summary=summary;existing.updatedAt=Date.now();existing.status=wf.done?'complete':'progress';
      existing.versions.push({ts:Date.now(),note:'به‌روزرسانی پیشرفت',artifact:existing.artifact});
      save();return existing;
    }
    return saveArtifact({type:'wf_progress',title:wfTitle(wf),summary:summary,
      artifact:{m:wf.m,step:wf.step,data:JSON.parse(JSON.stringify(wf.data||{})),done:!!wf.done},
      workflowId:wf.id,status:'progress'});
  }
  function wfTitle(wf){
    var names={rent:'اجاره',buy:'خرید',invb:'سرمایه‌گذاری ملکی',invr:'سرمایه‌گذاری توکنی',mkt:'پروژه‌ها',build:'ساخت',stay:'اقامتگاه',grt:'اجاره تضمینی',svc:'خدمات ملک'};
    return 'گردش کار '+ (names[wf.m]||wf.m) +' — مرحلهٔ '+fa(wf.step,0);
  }
  function projOfChat(chatId){
    if(!chatId||!S.chats)return null;
    var i;for(i=0;i<S.chats.length;i++){if(S.chats[i].id===chatId)return S.chats[i].projectId||null}
    return null;
  }

  /* resume a saved workflow into the live engine */
  function resumeWf(id){
    var it=byId(id);if(!it||it.type!=='wf_progress')return;
    var a=it.artifact||{};
    if(typeof wd!=='function'||typeof CE==='undefined'){toast('امکان ادامه در این صفحه نیست');return}
    if(wd(a.m)){ /* live flow exists */
      wd(a.m).data=a.data||{};wd(a.m).step=a.step;wd(a.m).done=!!a.done;
      S.active[a.m]=a.m;save();
    }else{
      var w=wfOf(it.workflowId);
      if(w){w.data=a.data||{};w.step=a.step;w.done=!!a.done;w.cancelled=false;S.active[a.m]=w.id;save()}
    }
    toast('گردش کار ادامه یافت');
    E29.shell.closePanel();
    if(CURRENT!=='landing')go('landing');else{renderCurrent()}
    botC('ادامهٔ «'+esc(it.title)+'» از همان‌جا که مانده بودید:',null);
  }

  /* delete (does NOT delete source conversation or contract) */
  function del(id){
    var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st.splice(i,1);save();return true}}
    return false;
  }
  function rename(id,title){var it=byId(id);if(it){it.title=title;it.updatedAt=Date.now();save()}}

  /* ── panel rendering ── */
  var curTab='all',sq='';
  function tabOf(type){return (TYPES[type]&&TYPES[type].tab)||'other'}
  function filtered(){
    var st=store();
    if(curTab!=='all')st=st.filter(function(it){return tabOf(it.type)===curTab});
    if(sq){var q=sq.toLowerCase();st=st.filter(function(it){return (it.title+' '+(it.summary||'')).toLowerCase().indexOf(q)>=0})}
    return st;
  }
  function cardHTML(it){
    var t=TYPES[it.type]||TYPES.other;
    var h='<div class="e29-card" data-act="e29libOpen" data-lib="'+qesc(it.id)+'" tabindex="0" role="button">'+
      '<span class="etype t-'+(it.type==='contract'?'contract':(it.type==='wf_progress'?'wf':(it.type==='ai_process'?'ai':'analysis')))+'">'+t.label+'</span>'+
      '<b class="ttl">'+esc(it.title)+'</b>'+
      '<span class="summ">'+esc(it.summary||'')+'</span>'+
      '<span class="meta">'+
      '<span>'+fd(it.createdAt)+'</span>'+
      (it.tokenCost?'<span class="cost">'+fa(it.tokenCost,0)+' توکن</span>':'')+
      (it.versions&&it.versions.length>1?'<span>'+fa(it.versions.length,0)+' نسخه</span>':'')+
      (it.status==='progress'?'<span>در جریان</span>':'')+
      '</span>'+
      '<span class="cardacts">'+
      '<button class="e29-cact" data-act="e29libShare" data-lib="'+qesc(it.id)+'" title="اشتراک‌گذاری">'+e29ico('share',15)+'</button>'+
      '<button class="e29-cact" data-act="e29libMenu" data-lib="'+qesc(it.id)+'" title="گزینه‌ها">'+e29ico('dots',15)+'</button>'+
      '</span></div>';
    return h;
  }
  function renderBody(){
    var box=document.getElementById('e29-lbody');if(!box)return;
    var st=filtered();
    if(!st.length){
      box.innerHTML='<div class="e29-empty"><div class="big">'+e29ico('library',34)+'</div><b>موردی در این بخش نیست</b>'+
        'خروجی‌های سرویس‌های پولی به‌طور خودکار اینجا ذخیره می‌شوند.</div>';
      return;
    }
    box.innerHTML='<div class="e29-grid">'+st.map(cardHTML).join('')+'</div>';
  }
  function renderTabs(){
    var box=document.getElementById('e29-ltabs');if(!box)return;
    var counts={};var st=store();
    st.forEach(function(it){var t=tabOf(it.type);counts[t]=(counts[t]||0)+1});
    box.innerHTML=TABS.map(function(t){
      var n=t.id==='all'?st.length:(counts[t.id]||0);
      return '<button class="e29-ptab'+(curTab===t.id?' on':'')+'" data-act="e29libTab" data-tab="'+t.id+'">'+t.label+(n?' <small>'+fa(n,0)+'</small>':'')+'</button>';
    }).join('');
  }
  function render(){renderTabs();renderBody()}

  /* ── detail views ── */
  function contractDetail(it){
    var snap=(it.artifact&&it.artifact.doc)||null;
    var c=snap&&snap.kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه';
    var h='<div class="e29-detail">';
    if(snap){
      h+='<h4>اطلاعات قرارداد</h4><div class="sect">';
      var kv=function(k,v){return '<div class="kv"><span>'+k+'</span><b>'+v+'</b></div>'};
      h+=kv('نوع',c)+kv('شناسه','<span style="direction:ltr">'+esc(snap.code||snap.draftCode||'—')+'</span>')+
        kv('عنوان',esc(it.title));
      if(snap.party)h+=kv('موجر / فروشنده',esc(snap.party.name||'—'));
      if(snap.counter)h+=kv('مستأجر / خریدار',esc(snap.counter.name||'—'));
      if(snap.prop)h+=kv('ملک',esc(snap.prop.title||snap.prop.address||'—'));
      h+='</div>';
      if(snap.terms){
        var t=snap.terms;
        h+='<h4>شرط‌های مالی</h4><div class="sect">';
        if(t.rent!==undefined)h+=kv('اجارهٔ ماهانه',rial(t.rent));
        if(t.dep!==undefined)h+=kv('رهن',rial(t.dep));
        if(t.duration)h+=kv('مدت',t.duration);
        if(t.total!==undefined)h+=kv('مبلغ کل',rial(t.total));
        if(t.staged!==undefined)h+=kv('نحوهٔ پرداخت',t.staged?'مرحله‌ای':'یکجا');
        h+='</div>';
      }
      h+='<h4>وضعیت</h4><div class="sect">'+kv('وضعیت فعلی',esc(it.status==='progress'?'در جریان':'ثبت‌شده'))+
        kv('تاریخ ایجاد',fd(it.createdAt))+kv('آخرین تغییر',fd(it.updatedAt))+'</div>';
    }else{
      h+='<div class="note">سند کامل این قرارداد در دسترس نیست؛ فقط خلاصه ذخیره شده است.</div>';
    }
    /* related transaction */
    if(it.txnId){
      var lg=(S.log||[]).filter(function(x){return x.id===it.txnId});
      h+='<h4>تراکنش توکن مرتبط</h4><div class="sect">';
      lg.forEach(function(x){h+=kv(fd(x.t),fa(-x.c,0)+' توکن')});
      h+=kv('شناسه تراکنش','<span style="direction:ltr">'+esc(it.txnId)+'</span>')+'</div>';
    }
    /* versions */
    if(it.versions&&it.versions.length){
      h+='<h4>تاریخچهٔ نسخه‌ها</h4><div class="e29-vers">';
      it.versions.forEach(function(v,ix){h+='<div class="vi">نسخهٔ '+fa(ix+1,0)+' — '+fd(v.ts)+(v.note?' — '+esc(v.note):'')+'</div>'});
      h+='</div>';
    }
    h+='<div class="qr" style="margin-top:14px">'+
      (snap?'<button data-act="e29libDoc" data-lib="'+qesc(it.id)+'">مشاهدهٔ سند کامل</button>':'')+
      '<button data-act="e29libDoc" data-lib="'+qesc(it.id)+'" data-print="1">دریافت PDF</button>'+
      (it.sourceChat?'<button data-act="e29libChat" data-sess="'+qesc(it.sourceChat)+'">گفت‌وگوی اصلی</button>':'')+
      '</div></div>';
    return h;
  }
  function reportDetail(it){
    var a=it.artifact||{};
    var h='<div class="e29-detail"><h4>'+esc(TYPES[it.type]?TYPES[it.type].label:'گزارش')+'</h4>';
    h+='<div class="sect">'+esc(it.summary||'')+'</div>';
    if(a.html)h+=a.html;
    else if(a.data){
      h+='<div class="sect">';
      Object.keys(a.data).forEach(function(k){
        var v=a.data[k];
        h+='<div class="kv"><span>'+esc(k)+'</span><b>'+(typeof v==='number'?fa(v,0):esc(String(v)))+'</b></div>';
      });
      h+='</div>';
    }
    if(it.txnId)h+='<div class="sect"><div class="kv"><span>شناسه تراکنش</span><b style="direction:ltr">'+esc(it.txnId)+'</b></div><div class="kv"><span>هزینه</span><b>'+fa(it.tokenCost,0)+' توکن</b></div></div>';
    if(it.versions&&it.versions.length>1){
      h+='<h4>تاریخچهٔ نسخه‌ها</h4><div class="e29-vers">';
      it.versions.forEach(function(v,ix){h+='<div class="vi">نسخهٔ '+fa(ix+1,0)+' — '+fd(v.ts)+(v.note?' — '+esc(v.note):'')+'</div>'});
      h+='</div>';
    }
    h+='<div class="qr" style="margin-top:14px">'+
      '<button data-act="e29libDoc" data-lib="'+qesc(it.id)+'" data-print="1">دریافت PDF</button>'+
      (it.sourceChat?'<button data-act="e29libChat" data-sess="'+qesc(it.sourceChat)+'">گفت‌وگوی اصلی</button>':'')+
      '</div></div>';
    return h;
  }
  function wfDetail(it){
    var a=it.artifact||{};
    var names={rent:'اجاره',buy:'خرید',invb:'سرمایه‌گذاری ملکی',invr:'سرمایه‌گذاری توکنی',mkt:'پروژه‌ها',build:'ساخت',stay:'اقامتگاه',grt:'اجاره تضمینی',svc:'خدمات ملک'};
    var total=(a.m&&MODBY[a.m])?10:0;
    var pct=total?Math.min(100,Math.round((a.step||1)/total*100)):40;
    var h='<div class="e29-detail"><h4>گردش کار در جریان</h4><div class="sect">';
    h+='<div class="kv"><span>نوع</span><b>'+esc(names[a.m]||a.m||'—')+'</b></div>';
    h+='<div class="kv"><span>مرحله</span><b>'+fa(a.step||1,0)+'</b></div>';
    h+='<div class="kv"><span>وضعیت</span><b>'+(a.done?'تکمیل‌شده':'در جریان')+'</b></div></div>';
    h+='<div class="e29-wfbar"><i style="width:'+pct+'%"></i></div>';
    if(a.data&&Object.keys(a.data).length){
      h+='<h4>اطلاعات جمع‌آوری‌شده</h4><div class="sect">';
      Object.keys(a.data).slice(0,12).forEach(function(k){
        var v=a.data[k];
        if(v&&typeof v==='object')return;
        h+='<div class="kv"><span>'+esc(k)+'</span><b>'+esc(String(v))+'</b></div>';
      });
      h+='</div>';
    }
    h+='<div class="qr" style="margin-top:14px"><button data-act="e29libResume" data-lib="'+qesc(it.id)+'">ادامه از همین‌جا</button>'+
      (it.sourceChat?'<button data-act="e29libChat" data-sess="'+qesc(it.sourceChat)+'">گفت‌وگوی اصلی</button>':'')+'</div></div>';
    return h;
  }
  function openDetail(id){
    var it=byId(id);if(!it)return;
    var body=document.getElementById('e29-lbody');
    if(!body){E29.shell.openPanel('library',{item:id});return}
    var html;
    if(it.type==='contract')html=contractDetail(it);
    else if(it.type==='wf_progress')html=wfDetail(it);
    else html=reportDetail(it);
    body.innerHTML='<div class="e29-phead"><button class="e29-pclose" data-act="e29libBack" title="بازگشت">'+e29ico('x',16)+'</button><b>'+esc(it.title)+'</b></div>'+
      '<div class="e29-pbody">'+html+'</div>'+
      '<div class="e29-pfoot"><button class="btn btn-sm" data-act="e29libShare" data-lib="'+qesc(it.id)+'">اشتراک‌گذاری</button><button class="btn btn-sm" data-act="e29libMenu" data-lib="'+qesc(it.id)+'">گزینه‌ها</button></div>';
    a11yify(body);
  }

  /* document view + print */
  function openDoc(id,print){
    var it=byId(id);if(!it)return;
    var snap=it.artifact&&it.artifact.doc;
    DOC_SNAP=snap||null;
    var content=snap?contractDocHTML(snap,false):('<div class="e29-detail">'+reportDetail(it)+'</div>');
    openModal('<h3>'+(snap?'سند قرارداد':'گزارش')+'</h3><div class="doc-actions"><button class="btn btn-sm btn-primary" data-act="cprint">دریافت PDF (چاپ مرورگر)</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div><div class="doc-preview" style="max-height:62vh">'+content+'</div>');
    if(print)setTimeout(function(){try{ACT.cprint()}catch(e){}},300);
  }

  /* ── ACT handlers ── */
  ACT.e29libOpen=function(el){openDetail(el.getAttribute('data-lib'))};
  ACT.e29libTab=function(el){curTab=el.getAttribute('data-tab')||'all';render()};
  ACT.e29libSq=function(el){};
  ACT.e29libShare=function(el){E29.share.dialog('library',el.getAttribute('data-lib'))};
  ACT.e29libMenu=function(el){
    var it=byId(el.getAttribute('data-lib'));if(!it)return;
    openModal('<h3>گزینه‌های «'+esc(it.title)+'»</h3>'+
      '<div class="qr" style="margin-top:10px">'+
      '<button data-act="e29libRename" data-lib="'+qesc(it.id)+'">تغییر نام</button>'+
      '<button data-act="e29libDoc" data-lib="'+qesc(it.id)+'" data-print="1">دریافت PDF</button>'+
      (it.sourceChat?'<button data-act="e29libChat" data-sess="'+qesc(it.sourceChat)+'">گفت‌وگوی اصلی</button>':'')+
      '<button data-act="e29libTxn" data-lib="'+qesc(it.id)+'">تراکنش توکن</button>'+
      '<button data-act="e29libDel" data-lib="'+qesc(it.id)+'" style="color:var(--danger)">حذف</button>'+
      '</div>');
  };
  ACT.e29libRename=function(el){
    var it=byId(el.getAttribute('data-lib'));if(!it)return;
    openModal('<h3>تغییر نام</h3><input id="e29-rn" class="inp" style="width:100%;margin-top:10px" value="'+qesc(it.title)+'">'+
      '<div class="qr" style="margin-top:10px"><button data-act="e29libRenameGo" data-lib="'+qesc(it.id)+'">ذخیره</button><button data-act="closeModal">انصراف</button></div>');
  };
  ACT.e29libRenameGo=function(el){
    var v=(document.getElementById('e29-rn')||{}).value;
    if(v&&v.replace(/\s/g,''))rename(el.getAttribute('data-lib'),v);
    closeModal();render();toast('نام تغییر کرد');
  };
  ACT.e29libDel=function(el){
    var it=byId(el.getAttribute('data-lib'));if(!it)return;
    openModal('<h3>حذف از کتابخانه</h3><p class="note">«'+esc(it.title)+'» از کتابخانه حذف می‌شود. گفت‌وگوی اصلی و سابقهٔ تراکنش حذف نمی‌شوند.</p>'+
      '<div class="qr" style="margin-top:10px"><button data-act="e29libDelGo" data-lib="'+qesc(it.id)+'" style="color:var(--danger)">حذف قطعی</button><button data-act="closeModal">انصراف</button></div>');
  };
  ACT.e29libDelGo=function(el){
    del(el.getAttribute('data-lib'));closeModal();
    render();E29.shell.refreshBadges();toast('از کتابخانه حذف شد');
  };
  ACT.e29libDoc=function(el){openDoc(el.getAttribute('data-lib'),el.getAttribute('data-print')==='1')};
  ACT.e29libChat=function(el){
    var sid=el.getAttribute('data-sess');
    closeModal();E29.shell.closePanel();
    var s=(typeof E22!=='undefined'&&E22.findSess)?E22.findSess(sid):null;
    if(s&&typeof E22.restore==='function'){E22.restore(sid);return}
    toast('گفت‌وگوی اصلی بایگانی‌شده یافت نشد');
  };
  ACT.e29libTxn=function(el){
    var it=byId(el.getAttribute('data-lib'));if(!it||!it.txnId)return;
    var lg=(S.log||[]).filter(function(x){return x.id===it.txnId});
    var h='<h3>تراکنش توکن</h3>';
    if(!lg.length)h+='<p class="note">تراکنشی با این شناسه یافت نشد.</p>';
    lg.forEach(function(x){h+='<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0"><span>'+fd(x.t)+'</span><b>'+(x.c>0?'+':'−')+fa(Math.abs(x.c),0)+' توکن — '+esc(x.d)+'</b></div>'});
    openModal(h);
  };
  ACT.e29libResume=function(el){resumeWf(el.getAttribute('data-lib'))};
  ACT.e29libBack=function(){render()};

  /* search input wiring delegated to shell panel render */
  function bindSearch(){
    var inp=document.getElementById('e29-lsq');
    if(!inp)return;
    inp.value=sq;
    inp.addEventListener('input',function(){sq=inp.value;renderBody()});
  }

  function panelHTML(){
    var h='<div class="e29-phead"><b>کتابخانه</b>'+
      '<button class="e29-pclose" data-act="e29panelClose" title="بستن">'+e29ico('x',16)+'</button></div>'+
      '<div style="padding:10px 14px 0"><input id="e29-lsq" class="inp" type="text" placeholder="جست‌وجو در کتابخانه…" style="width:100%"></div>'+
      '<div class="e29-ptabs" id="e29-ltabs"></div>'+
      '<div class="e29-pbody" id="e29-lbody"></div>';
    return h;
  }
  function mountPanel(opts){
    curTab='all';sq='';
    var body=document.getElementById('e29-lbody');
    if(opts&&opts.item){openDetail(opts.item);return}
    render();
    bindSearch();
  }

  E29.libAPI={saveArtifact:saveArtifact,saveWorkflowProgress:saveWorkflowProgress,byId:byId,store:store,
    panelHTML:panelHTML,mountPanel:mountPanel,render:render,TYPES:TYPES,resumeWf:resumeWf,openDetail:openDetail};
  return E29.libAPI;
})();
