/* ═══════════════ V0.31 — E30 UX: saved listings (§12), sharing independence (§14),
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
  function externalListingURL(x){
    /* Internal demonstration listings have NO public canonical source URL.
       Never fabricate one from a source name or image seed. */
    var src=x&&(x.originalUrl||x.url||x.sourceUrl);
    if(typeof src!=='string')return null;
    try{var url=new URL(src,location.href);return /^https?:$/.test(url.protocol)?url.href:null}catch(e){return null}
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
      originalUrl:externalListingURL(x),sourceUrl:externalListingURL(x),
      sourceStatus:externalListingURL(x)?'منبع خارجیِ دارای پیوند':'نمونه/منبع نامشخص',
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
      '<span class="meta"><span>'+fd(it.savedAt)+'</span><span>'+(it.originalUrl?'پیوند منبع موجود':'آگهی نمونهٔ داخلی؛ بدون پیوند خارجی')+'</span></span>'+
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
      '<div class="kv"><span>ذخیره</span><b>'+fd(it.savedAt)+'</b></div>'+
      (it.originalUrl?'<p><a href="'+qesc(it.originalUrl)+'" target="_blank" rel="noopener noreferrer">مشاهدهٔ آگهی اصلی در منبع <span aria-hidden="true">↗</span></a></p>':'<p class="note">این مورد یک آگهی نمایشی داخلی است؛ پیوندی به آگهی واقعی در سایت دیگری ندارد.</p>')+
      '</div></div>';
    openModal('<h3>آگهی ذخیره‌شده</h3>'+h);
  };
  /* library tab integration: wrap render + tab act + search */
  function mountLibraryPatch(){
    if(!E29.libAPI)return;
    var _openSourceChat=ACT.e29libChat;
    ACT.e29libChat=function(el){
      var sid=el.getAttribute('data-sess'),ref=E30.chatRef();
      if(ref&&sid===ref.chatId&&!(S.chats||[]).some(function(c){return c.id===sid})){
        closeModal();E29.shell.closePanel();
        if(CURRENT!=='landing')go('landing');
        toast('گفت‌وگوی فعال باز است');return;
      }
      return _openSourceChat&&_openSourceChat(el);
    };
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
    var docBefore30=ACT.cdoc;
    ACT.cdoc=function(el){
      docBefore30(el);
      var actions=document.querySelector('#modal-root .doc-actions');
      if(actions&&!actions.querySelector('[data-act="e30pdfShare"]'))actions.insertAdjacentHTML('beforeend','<button class="btn btn-sm" data-act="e30pdfShare">اشتراک فایل PDF</button>');
    };
    ACT.e30pdfShare=function(){
      openModal('<h3>اشتراک فایل PDF</h3><p>ابتدا از پنجرهٔ چاپ، سند را به‌صورت PDF ذخیره کنید. سپس فایل ذخیره‌شده را انتخاب و ارسال کنید.</p><input id="e30-pdf-file" type="file" accept="application/pdf,.pdf" aria-label="انتخاب فایل PDF"><p id="e30-pdf-status" role="status"></p><button class="btn btn-primary" data-act="e30pdfSend">ارسال فایل انتخاب‌شده</button>');
    };
    ACT.e30pdfSend=async function(){
      var file=document.getElementById('e30-pdf-file')?.files[0],status=document.getElementById('e30-pdf-status');
      if(!status)return;
      if(!file||!file.size||!/\.pdf$/i.test(file.name)){status.textContent='یک فایل PDF معتبر انتخاب کنید.';return}
      var magic=new Uint8Array(await file.slice(0,5).arrayBuffer());
      if(String.fromCharCode.apply(null,magic)!=='%PDF-'){status.textContent='محتوای فایل PDF معتبر نیست.';return}
      try{
        if(navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:'سند قرارداد محلینو'});
          status.textContent='فایل برای اشتراک ارسال شد.';
        }else{status.textContent='اشتراک مستقیم در این مرورگر پشتیبانی نمی‌شود؛ همین فایل PDF را در پیام‌رسان یا ایمیل پیوست کنید.';}
      }catch(err){status.textContent=err.name==='AbortError'?'اشتراک لغو شد؛ می‌توانید دوباره تلاش کنید.':'ارسال انجام نشد؛ دوباره تلاش کنید یا فایل را به پیام پیوست کنید.';}
    };
    ACT.e30shWhole=function(){usrC('اشتراک‌گذاری کل گفت‌وگو');E29.share.dialog('conversation',null)};
    /* Device-local hashes never transfer the snapshot to a different browser.
       Do not offer them as public links via navigator.share. */
    var _shareDialog=E29.share.dialog;
    E29.share.dialog=function(type,refId,scope){
      _shareDialog(type,refId,scope);
      var modal=document.querySelector('#modal-root .modal')||document.getElementById('modal-root');
      if(!modal)return;
      var walker=document.createTreeWalker(modal,NodeFilter.SHOW_TEXT),node;
      while((node=walker.nextNode())){
        if(node.nodeValue.indexOf('دسترسی: هر کسی که این لینک را داشته باشد')>=0){
          node.nodeValue='دسترسی لینک فقط داخل همین مرورگر است؛ دادهٔ اسنپ‌شات در حافظهٔ دستگاه فرستنده می‌ماند. ارسال لینک به شخص دیگر، محتوای اسنپ‌شات را منتقل نمی‌کند. برای اشتراک بیرونی، فایل HTML مستقل را دانلود و پس از بازبینی ارسال کنید.';
        }
      }
      var line=document.createElement('div');line.className='e30-share-honest';
      line.textContent='توجه: لینک داخلی فقط در همین مرورگر کار می‌کند. برای فرستادن محتوا به شخص یا دستگاه دیگر باید «دریافت فایل اشتراک‌گذاری» را انتخاب و آن فایل را ارسال کنید.';
      var btn=modal.querySelector('[data-act="e29shGo"]');
      if(btn){btn.textContent='ایجاد لینک داخلی همین دستگاه';btn.parentNode.insertBefore(line,btn.parentNode.firstChild)}
    };
    var _shareGo=ACT.e29shGo;
    ACT.e29shGo=function(el){
      _shareGo(el);
      var modal=document.querySelector('#modal-root .modal')||document.getElementById('modal-root');
      if(!modal)return;
      var cp=modal.querySelector('[data-act="e29shCopy"]');
      if(cp){cp.textContent='کپی لینک محلی';cp.title='این لینک در دستگاه یا مرورگر دیگر قابل مشاهده نیست'}
      var nativeBtn=modal.querySelector('[data-act="e29shNative"]');
      if(nativeBtn){nativeBtn.textContent='راهنمای ارسال فایل';nativeBtn.title='برای اشتراک بیرونی، فایل HTML را ارسال کنید'}
      var message=document.createElement('div');message.className='e30-share-honest';
      message.textContent='برای اشتراک با دیگران: دکمهٔ دریافت فایل را بزنید، سپس فایل HTML را در پیام‌رسان یا ایمیل ارسال کنید. نشانی بالا فقط در همین مرورگر معتبر است.';
      modal.appendChild(message);
    };
    ACT.e29shNative=function(el){
      toast('فایل HTML را دریافت و به گیرنده ارسال کنید؛ لینک داخلی قابل‌اشتراک بین دستگاه‌ها نیست.');
      ACT.e29shExport(el);
    };
    var _manageCopy=ACT.e29shCopy2;
    ACT.e29shCopy2=function(el){
      _manageCopy(el);toast('نشانی کپی‌شده فقط روی همین مرورگر معتبر است.');
    };
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
    var ref=E30.chatRef(),id=ref&&ref.chatId,title=ref&&ref.chatTitle;
    try{if(!id&&typeof E22!=='undefined'&&E22.restoredId)id=E22.restoredId}catch(e){}
    try{if(typeof E22!=='undefined'&&E22.titleFromHist)title=E22.titleFromHist()}catch(e){}
    if(!title){try{title=(HIST&&HIST.length)?('گفت‌وگو — '+String(HIST[0].h).replace(/<[^>]*>/g,' ').slice(0,30)):('گفت‌وگوی جاری')}catch(e){title='گفت‌وگوی جاری'}}
    return {id:id||'__live__',title:title,live:!(S.chats||[]).some(function(c){return c.id===id})};
  }
  function addLive(pid){
    var p=E29.projAPI.byId(pid);if(!p)return false;
    var li=liveChatInfo();
    /* One live chat belongs to one project, consistent with S.chats.projectId. */
    (S.projects||[]).forEach(function(other){
      if(other.id===pid)return;
      if(other.chatIds)other.chatIds=other.chatIds.filter(function(id){return id!==li.id});
      if(other._liveRefs)other._liveRefs=other._liveRefs.filter(function(r){return r.id!==li.id});
    });
    if(!p.chatIds)p.chatIds=[];
    if(p.chatIds.indexOf(li.id)<0)p.chatIds.push(li.id);
    if(!S.chats)S.chats=[];
    if(S.chats){
      var found=false;
      S.chats.forEach(function(c){if(c.id===li.id){c.projectId=pid;found=true}});
      /* live conversation not yet in the session archive: keep the reference WITHOUT
         forcing an archive (§13 — no forced archive). The marker renders in the sidebar
         section and opens the live chat. */
      if(!found&&!p._liveRefs)p._liveRefs=[];
      if(!found&&!p._liveRefs.some(function(x){return x.id===li.id}))p._liveRefs.push({id:li.id,title:li.title});
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
          ?'<div class="note">گفت‌وگوی جاری همین‌جا در این پروژه است.</div>'
          :'<div class="kv"><span>'+esc(li.title.slice(0,30))+'</span><b><button class="btn btn-xs" data-act="e30prjAddLive" data-prj="'+qesc(pid)+'">افزودن بدون آرشیو</button></b></div>')+
        '</div>';
      var h4=body.querySelector('h4');
      if(h4&&h4.nextSibling)body.insertBefore(sec,h4.nextSibling);
      else body.appendChild(sec);
    };
    ACT.e30prjAddLive=function(el){
      if(addLive(el.getAttribute('data-prj'))){toast('گفت‌وگوی جاری به پروژه اضافه شد — بدون نیاز به آرشیو');E29.projAPI.mountPanel(el.getAttribute('data-prj'));E29.shell.renderSidebarOnly()}
    };
    /* sidebar section: render live refs too, not just archived S.chats */
    var _sec=E29.projAPI.sectionHTML;
    E29.projAPI.sectionHTML=function(){
      var h=_sec();
      var host=document.createElement('div');host.innerHTML=h;
      Array.prototype.forEach.call(host.querySelectorAll('.e29-proj.open'),function(box){
        var p=E29.projAPI.byId(box.getAttribute('data-prj'));
        if(!p||!p._liveRefs)return;
        var archivedIds=(S.chats||[]).map(function(c){return c.id});
        p._liveRefs.forEach(function(ref){
          if(archivedIds.indexOf(ref.id)>=0)return;
          var b=document.createElement('button');
          b.className='e29-projchat';b.setAttribute('data-act','sessOpen');
          b.setAttribute('data-sess',ref.id);
          b.innerHTML='<span class="si">'+e29ico('chat',13)+'</span><span class="lbl">'+esc((ref.title||'گفت‌وگوی جاری').slice(0,26))+' · زنده</span>';
          box.appendChild(b);
        });
        if(box.querySelector('.e29-projchat')){
          Array.prototype.forEach.call(box.querySelectorAll('.e29-pempty'),function(x){x.remove()});
        }
      });
      return host.innerHTML;
    };
    /* A live reference is not an archived conversation. Open it only when it
       still refers to THIS active chat; never silently show the wrong thread. */
    var _sessOpen=ACT.sessOpen;
    ACT.sessOpen=function(el){
      var sid=el.getAttribute('data-sess');
      var active=liveChatInfo();
      if(sid===active.id){E29.shell.closePanel();if(CURRENT!=='landing')go('landing');toast('گفت‌وگوی جاری باز است');return}
      var hasLiveRef=(S.projects||[]).some(function(p){return (p._liveRefs||[]).some(function(r){return r.id===sid})});
      if(hasLiveRef&&!(S.chats||[]).some(function(c){return c.id===sid})){
        toast('این گفت‌وگو هنوز آرشیو نشده و دیگر گفت‌وگوی جاری نیست؛ برای بازیابی کامل باید پیش‌تر ذخیره شده باشد.');
        return;
      }
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
      if(normFa(r.title||'').replace(/\s+/g,' ').trim()===nt&&Math.abs(Number(r.due||0)-Number(due||0))<60000)return true;
    }
    return false;
  }
  function mountReminderPatch(){
    function repeatSelector(id,value){
      return '<label class="slab" style="display:block;margin-top:10px" for="'+id+'">تکرار یادآور</label>'+
        '<select class="inp" id="'+id+'" style="width:100%;margin-top:5px">'+
        [['once','فقط یک‌بار'],['weekly','هر هفته'],['monthly','هر ماه']].map(function(o){
          return '<option value="'+o[0]+'"'+(o[0]===value?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>';
    }
    function enrichReminderPanel(){
      Array.prototype.forEach.call(document.querySelectorAll('#e29-rbody .e29-notif[data-rem]'),function(row){
        var id=row.getAttribute('data-rem'),r=(S.reminders||[]).find(function(x){return x.id===id});
        if(!r)return;
        var actions=row.querySelector('.nacts');
        if(actions&&!actions.querySelector('[data-act="e30remEdit"]')){
          var btn=document.createElement('button');btn.type='button';btn.className='e29-cact';
          btn.setAttribute('data-act','e30remEdit');btn.setAttribute('data-id',id);
          btn.title='ویرایش یادآور';btn.setAttribute('aria-label','ویرایش یادآور');
          btn.textContent='✎';actions.insertBefore(btn,actions.firstChild);
        }
        var time=row.querySelector('.nts');
        if(time&&r.rec!=='once'&&!time.querySelector('.e30-rem-repeat')){
          var repeat=document.createElement('span');repeat.className='e30-rem-repeat';
          repeat.textContent=' · '+(r.rec==='monthly'?'هر ماه':'هر هفته');time.appendChild(repeat);
        }
      });
    }
    /* The V0.29 panel renderer is private. Decorate its rendered rows after
       every user operation, preserving the original shell and archived chats. */
    var _panel=ACT.e29panelRem;
    ACT.e29panelRem=function(){_panel();enrichReminderPanel()};
    var _shellPanel=E29.shell.openPanel;
    E29.shell.openPanel=function(kind,opts){_shellPanel(kind,opts);if(kind==='reminders')enrichReminderPanel()};
    var _newForm=ACT.e29remNew;
    ACT.e29remNew=function(){
      _newForm();var row=document.querySelector('#modal-root .qr');
      if(row)row.insertAdjacentHTML('beforebegin',repeatSelector('e30-rem-repeat-new','once'));
    };
    ACT.e30remEdit=function(el){
      var id=el.getAttribute('data-id'),r=(S.reminders||[]).find(function(x){return x.id===id});
      if(!r||!CBACT.remEdit28)return;
      CBACT.remEdit28(el);
      var actions=document.querySelector('#modal-root .fs-actions');
      if(actions)actions.insertAdjacentHTML('beforebegin',repeatSelector('e30-rem-repeat-edit',r.rec||'once'));
    };
    var _editSave=ACT.remEditOk28;
    ACT.remEditOk28=function(el){
      var id=el.getAttribute('data-id'),rec=document.getElementById('e30-rem-repeat-edit');
      var next=rec?rec.value:null;
      _editSave(el);
      /* The original editor keeps its modal open on validation errors. */
      if(!document.getElementById('re28-w')&&next){
        var r=(S.reminders||[]).find(function(x){return x.id===id});
        if(r){r.rec=next;r.notified=false;save()}
        if(document.getElementById('e29-rbody'))E29.shell.openPanel('reminders');
      }
    };
    if(typeof E28!=='undefined'){
      E28.remDup=function(title,ts){return remDupe(title,ts)};
      var _fromConversation=E28.remCreate;
      E28.remCreate=function(title,when,src,desc,chat){
        if(when&&remDupe(title,when.ts)){
          toast('یادآور با همین عنوان و زمان دقیق از قبل وجود دارد');
          return (S.reminders||[]).filter(function(r){return !r.done&&normFa(r.title||'')===normFa(title||'')&&Math.abs((r.due||0)-when.ts)<60000})[0]||null;
        }
        return _fromConversation(title,when,src,desc,chat);
      };
    }
    if(typeof E25!=='undefined'&&typeof E25.remDoSave==='function'){
      var _legacyChatSave=E25.remDoSave;
      E25.remDoSave=function(){
        var r=E25.rem;
        if(r&&remDupe(r.title,r.due)){
          botC('یادآور با همین عنوان و همین زمان قبلاً ثبت شده است؛ مورد تکراری ساخته نشد.',null);
          E25.rem={stage:null,title:null,due:null,amt:null};
          return false;
        }
        return _legacyChatSave();
      };
    }
    var _new=ACT.e29remNewGo;
    ACT.e29remNewGo=function(){
      var t=(document.getElementById('e29-rt')||{}).value||'';
      var dv=(document.getElementById('e29-rd')||{}).value||'';
      var selected=document.getElementById('e30-rem-repeat-new');
      var rec=selected?selected.value:'once';
      var due=dv?Date.parse(dv):Date.now()+864e5;
      if(remDupe(t,due)){toast('یادآور همانندِ همین با همین زمان از قبل وجود دارد');return}
      var ids=(S.reminders||[]).map(function(x){return x.id});
      _new();
      var created=(S.reminders||[]).find(function(x){return ids.indexOf(x.id)<0});
      if(created){created.rec=rec;save()}
      enrichReminderPanel();
    };
    var _done=ACT.e29remDone;
    ACT.e29remDone=function(el){
      var id=el.getAttribute('data-rem'),r=(S.reminders||[]).find(function(x){return x.id===id});
      var due=r&&!r.done&&E28.remNext?E28.remNext(r):null;
      _done(el);
      if(due){
        if(!(S.reminders||[]).some(function(x){return !x.done&&x.rec===r.rec&&x.title===r.title&&x.due===due})){
          S.reminders.unshift({id:E29.uid('REM'),title:r.title,desc:r.desc||'',due:due,
            rec:r.rec,done:false,status:'open',src:r.src,createdAt:Date.now(),updatedAt:Date.now(),notified:false});
          save();
        }
        E29.shell.openPanel('reminders');
      }else enrichReminderPanel();
    };
  }

  /* Honest deterministic valuation on INTERNAL SAMPLE figures, not live market data. */
  function mountValuation(){
    CBACT.e30ValOpen=function(){
      if(CURRENT!=='landing')go('landing');
      var opts=HOODS.map(function(h){return '<option value="'+qesc(h.id)+'">'+esc(h.n)+'</option>'}).join('');
      botC('<b>تخمین ارزش ملک (دادهٔ نمونه)</b><p class="note">این محاسبه قیمت لحظه‌ای بازار یا کارشناسی رسمی نیست. هزینهٔ محاسبه و ذخیرهٔ گزارش ۴۰ بناست و فقط پس از تأیید کسر می‌شود.</p>'+
        '<div class="sect"><label>محله<select class="inp" id="e30-val-hood">'+opts+'</select></label>'+
        '<label>متراژ<input class="inp" id="e30-val-area" type="number" min="10" max="2000" step="1" value="80"></label>'+
        '<label>عمر بنا<input class="inp" id="e30-val-age" type="number" min="0" max="80" step="1" value="5"></label>'+
        '<button class="btn btn-sm btn-primary" data-cba="e30ValQuote">محاسبه و تأیید هزینه</button></div>',null);
    };
    CBACT.e30ValQuote=function(){
      var hid=(document.getElementById('e30-val-hood')||{}).value,
        area=Number((document.getElementById('e30-val-area')||{}).value),
        age=Number((document.getElementById('e30-val-age')||{}).value),
        h=HOODS.filter(function(x){return x.id===hid})[0];
      if(!h||!Number.isInteger(area)||area<10||area>2000||!Number.isInteger(age)||age<0||age>80){
        toast('محله، متراژ ۱۰ تا ۲۰۰۰ و عمر بنا ۰ تا ۸۰ را به‌درستی وارد کنید');return false;
      }
      /* Transparent illustrative heuristic; +/-7% is NOT a confidence interval. */
      var factor=Math.max(0.65,1-Math.min(40,age)*0.0075),
        estimate=Math.round(h.buyBase*area*factor),low=Math.round(estimate*.93),high=Math.round(estimate*1.07),
        title=h.n+' • '+area+' متر • '+age+' سال';
      return E30.pay.begin({key:'valuation',title:'تخمین ارزش ملک (نمونه)',ctx:title,
        desc:'محاسبه با دادهٔ نمونهٔ داخلی و ذخیرهٔ گزارش',source:'chat-valuation',
        note:'این خروجی کارشناسی رسمی یا تخمین مبتنی بر قیمت لحظه‌ای نیست.',
        onConfirm:function(txn){
          var html='<div class="sect"><div class="kv"><span>مبنای هر متر (نمونه)</span><b>'+rial(h.buyBase)+'</b></div>'+
            '<div class="kv"><span>محله، متراژ، عمر بنا</span><b>'+esc(title)+'</b></div>'+
            '<div class="kv"><span>ضریب عمر (فرض محاسباتی)</span><b>'+fa(Math.round(factor*100),0)+'٪</b></div>'+
            '<div class="kv"><span>ارزش محاسبه‌شده</span><b>'+rial(estimate)+'</b></div>'+
            '<div class="kv"><span>بازهٔ فرضی ±۷٪</span><b>'+rial(low)+' تا '+rial(high)+'</b></div></div>'+
            '<p class="note">اعداد از نمونهٔ داخلی سامانه‌اند. این بازه فاصلهٔ اطمینان یا برآورد کارشناسی نیست.</p>';
          var it=E29.libAPI.saveArtifact({type:'valuation',title:'تخمین نمونهٔ ارزش — '+title,
            summary:'محاسبهٔ غیررسمی بر پایهٔ دادهٔ نمونه',
            artifact:{html:html,hood:hid,area:area,age:age,estimate:estimate,low:low,high:high,source:'internal-sample'},
            txnId:txn,tokenCost:E30.price('valuation')});
          if(!it)return false;
          botC('<b>گزارش تخمین نمونه در کتابخانه ذخیره شد.</b>'+html+
            '<div class="note">رسید: '+esc(txn)+' · هزینه: ۴۰ بنا</div>',null);
          return true;
        }});
    };
    var previousSend=ceSend;
    ceSend=function(t){
      var q=normFa(String(t||'').trim());
      if(/^(تخمین ارزش ملک|ارزش[ ‌-]?گذاری ملک)$/.test(q)){usrC(String(t));CBACT.e30ValOpen();return}
      return previousSend(t);
    };
  }

  /* ── init ── */
  E30.uxInit=function(){
    try{mountLibraryPatch()}catch(e){console.error('E30 lib patch',e)}
    try{mountSharePatch()}catch(e){console.error('E30 share patch',e)}
    try{mountProjectPatch()}catch(e){console.error('E30 prj patch',e)}
    try{mountReminderPatch()}catch(e){console.error('E30 rem patch',e)}
    try{mountValuation()}catch(e){console.error('E30 valuation',e)}
  };
  E30.savedStore=store;
  return {upsert:upsert,remove:remove,store:store,addLive:addLive,liveChatInfo:liveChatInfo,remDupe:remDupe};
})();
