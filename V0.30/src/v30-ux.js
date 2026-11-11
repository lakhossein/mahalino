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
