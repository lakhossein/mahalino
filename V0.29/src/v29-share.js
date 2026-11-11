/* ═══════════════ V0.29 — E29 SHARE: snapshots, dialog, revoke, export fallback ═══════════════
   Honest limitation: this app is fully client-side (no backend). "Share links" are
   in-app snapshot tokens (#s/<token>) rendered read-only on this device, plus a
   standalone HTML export for sending the artifact to others. This is documented
   in the dialog itself and in SHARING-AND-PRIVACY-SPEC-V0.29.md (spec §12.7). */
E29.share=(function(){
  function store(){if(!S.shares)S.shares=[];return S.shares}
  function byToken(tok){var st=store(),i;for(i=0;i<st.length;i++){if(st[i].token===tok)return st[i]}return null}
  function valid(sh){return sh&&!sh.revoked&&(!sh.expiresAt||sh.expiresAt>Date.now())}

  /* snapshot builders — exact content only, nothing else */
  function snapshotConv(scope){
    /* scope=null → whole conversation; scope={msgIx} → single assistant response */
    var msgs=(typeof HIST!=='undefined')?HIST:[];
    var copy;
    if(scope&&scope.msgIx!==undefined){
      var m=msgs[scope.msgIx];
      if(!m||m.r!=='bot')return null;
      copy=[m];
    }else{
      copy=msgs.filter(function(m){return m&&m.r});
    }
    var ref=E29.chatRef();
    return {kind:'conversation',title:(ref.chatTitle||'گفت‌وگوی محلینو')+(scope&&scope.msgIx!==undefined?' — یک پاسخ':''),
      ts:Date.now(),msgs:copy.map(function(m){return {r:m.r,h:String(m.h||'')}})};
  }
  function snapshotLib(id){
    var it=E29.libAPI.byId(id);if(!it)return null;
    return {kind:'library',title:it.title,ts:Date.now(),item:JSON.parse(JSON.stringify(it)),onlyArtifact:true};
  }

  function create(type,snapshot,opts){
    opts=opts||{};
    var tok=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);
    var sh={id:E29.uid('SH'),token:tok,etype:type,title:snapshot.title,snapshot:snapshot,
      createdAt:Date.now(),revoked:false,expiresAt:opts.days?Date.now()+opts.days*864e5:null,views:[]};
    store().unshift(sh);save();
    return sh;
  }
  function revoke(id){
    var st=store(),i;for(i=0;i<st.length;i++){if(st[i].id===id){st[i].revoked=true;save();return true}}
    return false;
  }
  function updateSnapshot(id){
    /* explicit re-share of current state */
    var st=store(),i;for(i=0;i<st.length;i++){
      if(st[i].id===id&&!st[i].revoked){
        var s=st[i].snapshot;
        if(s.kind==='conversation'){var ns=snapshotConv(null);if(ns)st[i].snapshot=ns}
        else if(s.item&&s.item.id){var cur=E29.libAPI.byId(s.item.id);if(cur)st[i].snapshot.item=JSON.parse(JSON.stringify(cur))}
        st[i].snapshot.ts=Date.now();save();return true;
      }
    }
    return false;
  }
  function shareURL(sh){
    return location.href.split('#')[0]+'#s/'+sh.token;
  }
  function openSnapshotView(tok){
    var sh=byToken(tok);
    if(!valid(sh)){
      document.title='لینک نامعتبر است — محلینو';
      var v=document.createElement('div');
      v.style.cssText='max-width:560px;margin:60px auto;padding:24px;text-align:center;font-family:inherit';
      v.innerHTML='<h2>این لینک در دسترس نیست</h2><p style="color:#64748b">لینک باطل شده، منقضی شده یا وجود ندارد.</p>';
      document.body.innerHTML='';document.body.appendChild(v);
      return;
    }
    sh.views.push({ts:Date.now()});save();
    renderSnapshot(sh);
  }
  function renderSnapshot(sh){
    document.title=sh.title+' — اشتراک‌گذاری محلینو';
    var inner='';
    if(sh.snapshot.kind==='conversation'){
      inner=sh.snapshot.msgs.map(function(m){
        return '<div class="msg '+m.r+'"><span class="who">'+(m.r==='bot'?'دستیار محلینو':'کاربر')+'</span><div class="bub">'+m.h+'</div></div>';
      }).join('');
    }else{
      var it=sh.snapshot.item||{};
      var a=it.artifact||{};
      inner='<div class="card" style="max-width:640px"><h3>'+esc(sh.title)+'</h3>';
      if(sh.snapshot.onlyArtifact&&it.type==='contract'&&a.doc){inner+=contractDocHTML(a.doc,false)}
      else{inner+='<p style="color:var(--ink2)">'+esc(it.summary||'')+'</p>';if(a.html)inner+=a.html;
        if(a.doc)inner+=contractDocHTML(a.doc,false)}
      inner+='<p style="font-size:11px;color:#94a3b8">اسنپ‌شات ثابت از '+fd(sh.createdAt)+' — تغییرات بعدی این محتوا اینجا اعمال نمی‌شود.</p></div>';
    }
    var css=['body{background:#f6f7f9;color:#0f172a;direction:rtl;font-family:Tahoma,sans-serif;line-height:1.8;padding:24px 16px}',
      '.msg{max-width:680px;margin:10px auto}.msg .who{font-size:11px;color:#64748b;display:block;margin-bottom:2px}',
      '.msg .bub{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-size:14px}',
      '.msg.user .bub{background:#f0fdfa;border-color:#cceee9}',
      '.msg.bot .bub .qr{display:none}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:0 auto}'].join('');
    document.body.innerHTML='<style>'+css+'</style><div style="max-width:680px;margin:0 auto 18px;padding:10px 14px;background:#0f766e;color:#fff;border-radius:12px;font-weight:700">محلینو — محتوای اشتراک‌گذاری‌شده (فقط‌خواندنی)</div>'+inner;
  }

  /* ── dialog ── */
  function dialog(type,refId,scope){
    var snap=type==='conversation'?snapshotConv(scope||null):snapshotLib(refId);
    if(!snap){toast('محتوایی برای اشتراک‌گذاری یافت نشد');return}
    var sensitive=(type==='library'&&snap.item&&snap.item.type==='contract')||(snap.title&&/قرارداد|مبایعه/.test(snap.title));
    var prevHTML=snap.kind==='conversation'
      ?snap.msgs.map(function(m){return '<div class="'+(m.r==='user'?'svp-u':'svp-b')+'">'+(m.r==='user'?'پرسش شما: ':'دستیار: ')+String(m.h).replace(/<[^>]*>/g,' ').slice(0,140)+'</div>'}).join('')
      :'<div class="svp-b">'+esc(snap.title)+' — '+esc(snap.item.summary||'خروجی ذخیره‌شده')+'</div>';
    openModal('<h3>اشتراک‌گذاری</h3>'+
      '<div class="kv" style="display:flex;justify-content:space-between;margin-top:6px"><span>عنوان</span><b>'+esc(snap.title)+'</b></div>'+
      '<div class="kv" style="display:flex;justify-content:space-between"><span>نوع</span><b>'+(snap.kind==='conversation'?'گفت‌وگو':'خروجی کتابخانه')+'</b></div>'+
      '<div style="font-size:12px;color:var(--ink2);margin-top:10px">پیش‌نمایش دقیق محتوایی که به اشتراک گذاشته می‌شود:</div>'+
      '<div class="e29-shareprev">'+prevHTML+'</div>'+
      (sensitive?'<div class="e29-sens">'+e29ico('doc',16)+'<span>این محتوا شامل اطلاعات قراردادی/مالی است. پیش از تأیید، پیش‌نمایش را بازبینی کنید — فقط همین محتوای انتخابی به اشتراک گذاشته می‌شود.</span></div>':'')+
      '<div style="font-size:11.5px;color:var(--muted);margin-top:6px">دسترسی: هر کسی که این لینک را داشته باشد می‌تواند این اسنپ‌شات فقط‌خواندنی را ببیند؛ به حساب شما، گفت‌وگوهای دیگر یا کیف پول دسترسی ندارد. این لینک روی همین دستگاه معتبر است و برای ارسال به دیگران می‌توانید «دریافت فایل اشتراک‌گذاری» را بگیرید.</div>'+
      '<div class="qr" style="margin-top:12px">'+
      '<button data-act="e29shGo" data-stype="'+qesc(type)+'" data-ref="'+qesc(refId||'')+'" data-scope="'+(scope&&scope.msgIx!==undefined?scope.msgIx:'')+'">ساخت لینک اشتراک‌گذاری</button>'+
      '<button data-act="closeModal">انصراف</button></div>');
  }
  ACT.e29shGo=function(el){
    var type=el.getAttribute('data-stype'),ref=el.getAttribute('data-ref'),sc=el.getAttribute('data-scope');
    var scope=(sc!==''&&sc!==null)?{msgIx:+sc}:null;
    var snap=type==='conversation'?snapshotConv(scope):snapshotLib(ref);
    if(!snap){toast('محتوا یافت نشد');return}
    var sh=create(type,snap,{days:30});
    var url=shareURL(sh);
    openModal('<h3>لینک اشتراک‌گذاری آماده است</h3>'+
      '<div class="e29-linkbox"><input id="e29-shurl" readonly value="'+qesc(url)+'"><button class="btn btn-sm btn-primary" data-act="e29shCopy">کپی</button></div>'+
      '<div class="qr" style="margin-top:12px">'+
      '<button data-act="e29shExport" data-sh="'+qesc(sh.id)+'">دریافت فایل اشتراک‌گذاری</button>'+
      '<button data-act="e29shNative" data-sh="'+qesc(sh.id)+'">اشتراک سیستم</button>'+
      '<button data-act="closeModal">بستن</button></div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:8px">مدیریت و باطل‌کردن لینک‌ها: کتابخانه → بخش اشتراک‌ها. انقضا: ۳۰ روز.</div>');
  };
  ACT.e29shCopy=function(){
    var inp=document.getElementById('e29-shurl');
    if(!inp)return;
    try{inp.select();document.execCommand('copy')}catch(e){}
    if(navigator.clipboard)navigator.clipboard.writeText(inp.value).catch(function(){});
    toast('لینک کپی شد');
  };
  ACT.e29shExport=function(el){
    var sh=store().filter(function(x){return x.id===el.getAttribute('data-sh')})[0];
    if(!sh)return;
    var html='<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>'+esc(sh.title)+' — محلینو</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+snapshotInner(sh)+'</body></html>';
    var blob=new Blob([html],{type:'text/html;charset=utf-8'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='mahalino-share-'+sh.token.slice(0,6)+'.html';
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
    toast('فایل اشتراک‌گذاری دانلود شد');
  };
  function snapshotInner(sh){
    var t=document.createElement('div');
    var tmp=renderSnapshotToString(sh);
    return tmp;
  }
  function renderSnapshotToString(sh){
    var out='';
    if(sh.snapshot.kind==='conversation'){
      out=sh.snapshot.msgs.map(function(m){
        return '<div class="msg '+m.r+'"><span class="who">'+(m.r==='bot'?'دستیار محلینو':'کاربر')+'</span><div class="bub">'+m.h+'</div></div>';
      }).join('');
    }else{
      var it=sh.snapshot.item||{},a=it.artifact||{};
      out='<div class="card"><h3>'+esc(sh.title)+'</h3>';
      if(a.doc)out+=contractDocHTML(a.doc,false);
      else out+='<p>'+esc(it.summary||'')+'</p>'+(a.html||'');
      out+='<p style="font-size:11px;color:#94a3b8">اسنپ‌شات ثابت از '+fd(sh.createdAt)+'</p></div>';
    }
    var css='<style>body{background:#f6f7f9;color:#0f172a;direction:rtl;font-family:Tahoma,sans-serif;line-height:1.8;padding:24px 16px}.msg{max-width:680px;margin:10px auto}.msg .who{font-size:11px;color:#64748b;display:block;margin-bottom:2px}.msg .bub{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px}.msg.user .bub{background:#f0fdfa}.msg.bot .bub .qr{display:none}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;max-width:680px;margin:0 auto}</style><div style="max-width:680px;margin:0 auto 18px;padding:10px 14px;background:#0f766e;color:#fff;border-radius:12px;font-weight:700">محلینو — محتوای اشتراک‌گذاری‌شده (فقط‌خواندنی)</div>';
    return css+out;
  }
  ACT.e29shNative=function(el){
    var sh=store().filter(function(x){return x.id===el.getAttribute('data-sh')})[0];
    if(!sh)return;
    if(navigator.share){
      navigator.share({title:sh.title,url:shareURL(sh)}).catch(function(){});
    }else{toast('اشتراک سیستمی در این مرورگر پشتیبانی نمی‌شود — لینک را کپی کنید')}
  };

  /* manage dialog */
  function manage(){
    var st=store();
    var h='<h3>لینک‌های اشتراک‌گذاری</h3>';
    if(!st.length){h+='<p class="note">هنوز لینکی نساخته‌اید.</p>'}
    st.forEach(function(sh){
      h+='<div class="kv" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px dashed var(--line-soft)">'+
        '<span><b>'+esc(sh.title)+'</b><br><small style="color:var(--muted)">'+fd(sh.createdAt)+' · '+(sh.revoked?'باطل‌شده':(sh.expiresAt&&sh.expiresAt<Date.now()?'منقضی':'فعال'))+' · '+fa(sh.views.length,0)+' بازدید</small></span>'+
        '<span>'+(sh.revoked?'':'<button class="e29-cact" data-act="e29shCopy2" data-sh="'+qesc(sh.id)+'" title="کپی لینک">'+e29ico('link',15)+'</button>'+
        '<button class="e29-cact" data-act="e29shUpd" data-sh="'+qesc(sh.id)+'" title="به‌روزرسانی اسنپ‌شات">'+e29ico('refresh',15)+'</button>'+
        '<button class="e29-cact" data-act="e29shRevoke" data-sh="'+qesc(sh.id)+'" title="باطل‌کردن" style="color:var(--danger)">'+e29ico('x',15)+'</button>')+'</span></div>';
    });
    openModal(h);
  }
  ACT.e29shCopy2=function(el){
    var sh=store().filter(function(x){return x.id===el.getAttribute('data-sh')})[0];if(!sh)return;
    var url=shareURL(sh);
    if(navigator.clipboard)navigator.clipboard.writeText(url).catch(function(){});
    try{var i=document.createElement('input');i.value=url;document.body.appendChild(i);i.select();document.execCommand('copy');i.remove()}catch(e){}
    toast('لینک کپی شد');
  };
  ACT.e29shUpd=function(el){if(updateSnapshot(el.getAttribute('data-sh')))toast('اسنپ‌شات به‌روزرسانی شد');manage()};
  ACT.e29shRevoke=function(el){
    if(revoke(el.getAttribute('data-sh'))){toast('لینک باطل شد — محتوای اصلی دست‌نخورده ماند');E29.shell.refreshBadges()}
    manage();
  };
  ACT.e29shManage=function(){manage()};

  return {dialog:dialog,create:create,revoke:revoke,openSnapshotView:openSnapshotView,manage:manage,store:store};
})();
