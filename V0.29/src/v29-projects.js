/* ═══════════════ V0.29 — E29 PROJECTS: conversation organization ═══════════════ */
E29.proj=(function(){
  var COLORS=['#0f766e','#b45309','#1d4ed8','#15803d','#b91c1c','#6d28d9'];

  function store(){if(!S.projects)S.projects=[];return S.projects}
  function byId(id){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id)return st[i]}return null}
  function chatsOf(pid){
    if(!S.chats)return [];
    return S.chats.filter(function(c){return c&&c.projectId===pid});
  }
  function artifactsOf(pid){return store2().filter(function(it){return it.projectId===pid})}
  function store2(){if(!S.library)S.library=[];return S.library}

  function create(name,desc){
    if(!S.auth)return null;
    var p={id:E29.uid('PRJ'),name:name||'پروژهٔ تازه',desc:desc||'',instructions:'',
      color:COLORS[store().length%COLORS.length],pinned:false,archived:false,createdAt:Date.now(),
      chatIds:[],artifacts:[]};
    store().unshift(p);save();
    E29.shell.refreshBadges();
    return p;
  }
  function rename(id,name,desc){var p=byId(id);if(!p)return;p.name=name;p.desc=desc===undefined?p.desc:desc;save()}
  function setInstructions(id,txt){var p=byId(id);if(!p)return;p.instructions=txt||'';save()}
  function pin(id){var p=byId(id);if(!p)return;p.pinned=!p.pinned;save()}
  function archive(id){var p=byId(id);if(!p)return;p.archived=!p.archived;save()}
  function del(id){
    var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st.splice(i,1);break}}
    /* conversations keep existing, just lose the project link; library keeps projectId=null */
    if(S.chats)S.chats.forEach(function(c){if(c&&c.projectId===id)c.projectId=null});
    store2().forEach(function(it){if(it.projectId===id)it.projectId=null});
    save();
  }
  function addChat(pid,chatId){
    var p=byId(pid),i;
    if(!p||!S.chats)return;
    var title=null;
    for(i=0;i<S.chats.length;i++){if(S.chats[i].id===chatId){S.chats[i].projectId=pid;title=S.chats[i].title}}
    if(p.chatIds.indexOf(chatId)<0)p.chatIds.push(chatId);
    store2().forEach(function(it){
      if(it.sourceChat===chatId||(it.sourceChat==null&&title&&it.sourceTitle===title))it.projectId=pid;
    });
    save();
  }
  function removeChat(pid,chatId){
    var p=byId(pid);if(!p)return;
    var ix=p.chatIds.indexOf(chatId);if(ix>=0)p.chatIds.splice(ix,1);
    if(S.chats)S.chats.forEach(function(c){if(c&&c.id===chatId&&c.projectId===pid)c.projectId=null});
    save();
  }

  /* ── sidebar section ── */
  function sectionHTML(){
    var st=store().filter(function(p){return !p.archived});
    if(!st.length){
      return '<div class="e29-sec"><b>پروژه‌ها</b><button class="e29-seca" data-act="e29prjNew">'+e29ico('plus',13)+'جدید</button></div>'+
        '<div class="e29-pempty">پروژه‌ای ندارید — گفت‌وگوهای مرتبط را گروه کنید.</div>';
    }
    var pin=st.filter(function(p){return p.pinned}),rest=st.filter(function(p){return !p.pinned});
    var h='<div class="e29-sec"><b>پروژه‌ها</b><button class="e29-seca" data-act="e29prjNew">'+e29ico('plus',13)+'جدید</button></div>';
    function prjHTML(p){
      var chats=chatsOf(p.id);
      var open=(S.ui.prjOpen&&S.ui.prjOpen[p.id])?' open':'';
      var h='<div class="e29-proj'+open+'" data-prj="'+qesc(p.id)+'">'+
        '<button class="e29-projhead" data-act="e29prjToggle" data-prj="'+qesc(p.id)+'">'+
        '<span class="pdot" style="background:'+p.color+'"></span>'+
        '<span class="lbl">'+esc(p.name)+'</span><span class="chev"></span></button>';
      if(open)h+=chats.slice(0,6).map(function(c){
        return '<button class="e29-projchat" data-act="sessOpen" data-sess="'+qesc(c.id)+'" title="'+qesc(c.title||'')+'"><span class="si">'+e29ico('chat',13)+'</span><span class="lbl">'+esc((c.title||'بدون عنوان').slice(0,26))+'</span></button>';
      }).join('');
      if(open&&!chats.length)h+='<div class="e29-pempty">هنوز گفت‌وگویی در این پروژه نیست</div>';
      h+='</div>';
      return h;
    }
    pin.forEach(function(p){h+=prjHTML(p)});
    rest.forEach(function(p){h+=prjHTML(p)});
    return h;
  }

  /* ── project detail panel ── */
  function panelHTML(pid){
    var p=byId(pid);
    if(!p){
      return '<div class="e29-phead"><b>پروژه‌ها</b><button class="e29-pclose" data-act="e29panelClose">'+e29ico('x',16)+'</button></div>'+
        '<div class="e29-pbody">'+
        '<div style="margin-bottom:14px"><input id="e29-pn" class="inp" type="text" placeholder="نام پروژه" style="width:100%;margin-bottom:8px">'+
        '<textarea id="e29-pd" class="inp" placeholder="توضیح (اختیاری)" style="width:100%;min-height:70px"></textarea></div>'+
        '<button class="btn btn-primary" data-act="e29prjCreate">ایجاد پروژه</button>'+
        '<h4 style="margin:18px 0 8px;font-size:13px">پروژه‌های موجود</h4><div id="e29-prjlist"></div></div>';
    }
    var chats=chatsOf(p.id),arts=artifactsOf(p.id);
    var h='<div class="e29-phead"><b>'+esc(p.name)+'</b>'+
      '<button class="e29-pclose" data-act="e29panelClose">'+e29ico('x',16)+'</button></div>'+
      '<div class="e29-pbody e29-detail">';
    if(p.desc)h+='<p style="color:var(--ink2);font-size:12.5px">'+esc(p.desc)+'</p>';
    h+='<h4>دستورالعمل پروژه</h4>'+
      '<textarea id="e29-pinst" class="inp" placeholder="مثلاً: همهٔ بحث‌ها دربارهٔ خرید آپارتمان در سعادت‌آباد؛ بودجه حداکثر …" style="width:100%;min-height:70px">'+esc(p.instructions||'')+'</textarea>'+
      '<button class="btn btn-sm" style="margin-top:6px" data-act="e29prjInst" data-prj="'+qesc(p.id)+'">ذخیرهٔ دستورالعمل</button>';
    h+='<h4>گفت‌وگوها ('+fa(chats.length,0)+')</h4><div class="sect">';
    if(!chats.length)h+='<div class="note">گفت‌وگویی اضافه نشده است. از فهرست پایین گفت‌وگوها را بیفزایید.</div>';
    chats.forEach(function(c){
      h+='<div class="kv"><span>'+e29ico('chat',14)+' '+esc((c.title||'بدون عنوان').slice(0,30))+'</span>'+
        '<b><button class="e29-cact" data-act="sessOpen" data-sess="'+qesc(c.id)+'" title="باز کردن">'+e29ico('link',14)+'</button>'+
        '<button class="e29-cact" data-act="e29prjRmChat" data-prj="'+qesc(p.id)+'" data-sess="'+qesc(c.id)+'" title="خارج‌کردن از پروژه">'+e29ico('x',14)+'</button></b></div>';
    });
    h+='</div>';
    h+='<h4>خروجی‌های مرتبط ('+fa(arts.length,0)+')</h4><div class="sect">';
    if(!arts.length)h+='<div class="note">خروجی پولیِ مرتبطی ذخیره نشده است.</div>';
    arts.forEach(function(it){
      h+='<div class="kv"><span>'+esc(it.title)+'</span><b><button class="e29-cact" data-act="e29libOpen" data-lib="'+qesc(it.id)+'">'+e29ico('doc',14)+'</button></b></div>';
    });
    h+='</div>';
    h+='<h4>افزودن گفت‌وگوی موجود</h4><div class="sect">';
    var free=(S.chats||[]).filter(function(c){return c&&!c.projectId&&!c.pinned});
    if(!free.length)h+='<div class="note">گفت‌وگوی بدون پروژه‌ای نیست.</div>';
    free.slice(0,12).forEach(function(c){
      h+='<div class="kv"><span>'+esc((c.title||'بدون عنوان').slice(0,30))+'</span><b><button class="e29-cact" data-act="e29prjAddChat" data-prj="'+qesc(p.id)+'" data-sess="'+qesc(c.id)+'" title="افزودن">'+e29ico('plus',14)+'</button></b></div>';
    });
    h+='</div>';
    h+='<div class="qr" style="margin-top:12px">'+
      '<button data-act="e29prjPin" data-prj="'+qesc(p.id)+'">'+(p.pinned?'برداشتن سنجاق':'سنجاق کردن')+'</button>'+
      '<button data-act="e29prjRename" data-prj="'+qesc(p.id)+'">تغییر نام</button>'+
      '<button data-act="e29prjArch" data-prj="'+qesc(p.id)+'">آرشیو</button>'+
      '<button data-act="e29prjDel" data-prj="'+qesc(p.id)+'" style="color:var(--danger)">حذف پروژه</button>'+
      '</div></div>';
    return h;
  }
  function mountPanel(pid){
    var body=document.getElementById('e29-lbody');
    if(!body)return;
    body.innerHTML=panelHTML(pid);
    if(!pid){
      var list=document.getElementById('e29-prjlist');
      if(list){
        var st=store();
        list.innerHTML=st.length?st.map(function(p){
          return '<div class="kv" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line-soft)"><span><span class="pdot" style="display:inline-block;width:9px;height:9px;border-radius:99px;background:'+p.color+';margin-inline-end:6px"></span>'+esc(p.name)+(p.archived?' <small>(آرشیو)</small>':'')+'</span><b><button class="e29-cact" data-act="e29prjOpen" data-prj="'+qesc(p.id)+'">'+e29ico('folder',14)+'</button></b></div>';
        }).join(''):'<div class="note">هنوز پروژه‌ای نساخته‌اید.</div>';
      }
    }
    a11yify(body);
  }

  ACT.e29prjToggle=function(el){
    var id=el.getAttribute('data-prj');
    if(!S.ui.prjOpen)S.ui.prjOpen={};
    S.ui.prjOpen[id]=!S.ui.prjOpen[id];save();
    E29.shell.renderSidebarOnly();
  };
  ACT.e29prjNew=function(){E29.shell.openPanel('projects')};
  ACT.e29prjCreate=function(){
    var n=(document.getElementById('e29-pn')||{}).value||'';
    var d=(document.getElementById('e29-pd')||{}).value||'';
    if(!n.replace(/\s/g,'')){toast('نام پروژه را بنویسید');return}
    var p=create(n,d);
    toast('پروژه ساخته شد');
    if(p)mountPanel(p.id);
    E29.shell.renderSidebarOnly();
  };
  ACT.e29prjOpen=function(el){mountPanel(el.getAttribute('data-prj'))};
  ACT.e29prjInst=function(el){
    var v=(document.getElementById('e29-pinst')||{}).value;
    setInstructions(el.getAttribute('data-prj'),v);
    toast('دستورالعمل ذخیره شد');
    /* conversations inside a project get project context surfaced in chat */
  };
  ACT.e29prjPin=function(el){pin(el.getAttribute('data-prj'));mountPanel(el.getAttribute('data-prj'));E29.shell.renderSidebarOnly()};
  ACT.e29prjArch=function(el){archive(el.getAttribute('data-prj'));toast('وضعیت آرشیو تغییر کرد');E29.shell.closePanel();E29.shell.renderSidebarOnly()};
  ACT.e29prjRename=function(el){
    var p=byId(el.getAttribute('data-prj'));if(!p)return;
    openModal('<h3>تغییر نام پروژه</h3><input id="e29-pn2" class="inp" style="width:100%;margin-top:10px" value="'+qesc(p.name)+'">'+
      '<div class="qr" style="margin-top:10px"><button data-act="e29prjRenameGo" data-prj="'+qesc(p.id)+'">ذخیره</button><button data-act="closeModal">انصراف</button></div>');
  };
  ACT.e29prjRenameGo=function(el){
    var v=(document.getElementById('e29-pn2')||{}).value||'';
    if(v.replace(/\s/g,''))rename(el.getAttribute('data-prj'),v);
    closeModal();mountPanel(el.getAttribute('data-prj'));E29.shell.renderSidebarOnly();
  };
  ACT.e29prjAddChat=function(el){addChat(el.getAttribute('data-prj'),el.getAttribute('data-sess'));mountPanel(el.getAttribute('data-prj'));toast('گفت‌وگو به پروژه اضافه شد')};
  ACT.e29prjRmChat=function(el){removeChat(el.getAttribute('data-prj'),el.getAttribute('data-sess'));mountPanel(el.getAttribute('data-prj'))};
  ACT.e29prjDel=function(el){
    var p=byId(el.getAttribute('data-prj'));if(!p)return;
    openModal('<h3>حذف پروژه</h3><p class="note">پروژهٔ «'+esc(p.name)+'» حذف می‌شود؛ گفت‌وگوها و خروجی‌های کتابخانه باقی می‌مانند و فقط از این پروژه خارج می‌شوند.</p>'+
      '<div class="qr" style="margin-top:10px"><button data-act="e29prjDelGo" data-prj="'+qesc(p.id)+'" style="color:var(--danger)">حذف قطعی</button><button data-act="closeModal">انصراف</button></div>');
  };
  ACT.e29prjDelGo=function(el){
    del(el.getAttribute('data-prj'));closeModal();
    E29.shell.closePanel();E29.shell.renderSidebarOnly();toast('پروژه حذف شد');
  };

  E29.projAPI={create:create,store:store,byId:byId,chatsOf:chatsOf,sectionHTML:sectionHTML,mountPanel:mountPanel,addChat:addChat,del:del};
  return E29.projAPI;
})();
