/* ═══════════════ V0.29 — E29 INTEL: adaptive conversations, progressive profiling,
   persona adaptation, previous-info confirmation. Deterministic slot-filling engine
   built from LLM persona research (research/*.md). Hand-off to existing SCRIPTS. ═══════════════ */
E29.intel=(function(){
  function nz(t){return normFa(t).replace(/‌/g," ")}
  /* ── progressive profile ── */
  function prof(){
    if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};
    return S.profile;
  }
  var SLOT_LABEL={age_range:'سن',occupation:'شغل',household:'ترکیب خانوار',family_members:'تعداد افراد خانوار',
    rent_budget:'بودجهٔ اجاره',dep_budget:'ودیعه',buy_budget:'بودجهٔ خرید',m2:'متراژ',rooms:'تعداد خواب',
    prop_age:'عمر بنا',hood:'محلهٔ موردنظر',sale_urgency:'فوریت فروش',term:'مدت قرارداد',
    purpose:'هدف خرید',preferences:'اولویت‌ها',persona:'پروفایل رفتاری'};
  function setSlot(id,val,confirmed){
    var p=prof();
    if(val===undefined||val===null||val===''){delete p.confirmed[id];return}
    if(p.confirmed[id]!==val){
      if(p.confirmed[id]!==undefined)p.stale[id]=p.confirmed[id];
      p.confirmed[id]=val;
      p.log.push({t:Date.now(),slot:id,val:val,confirmed:!!confirmed});
      if(p.log.length>80)p.log.shift();
      delete p.stale[id];
    }
    delete p.inferred[id];
  }
  function inferSlot(id,val){var p=prof();if(p.confirmed[id]===undefined)p.inferred[id]=val}
  function getSlot(id){var p=prof();return p.confirmed[id]!==undefined?p.confirmed[id]:(p.inferred[id]!==undefined?p.inferred[id]:null)}

  /* persona classification (research-derived archetypes) */
  function personaOf(flow){
    var p=prof(),c=p.confirmed,i=p.inferred;
    var hh=c.household||i.household,occ=c.occupation||i.occupation,housing=c.housing_situation||i.housing_situation;
    var sig=(c.motivation||i.motivation||'')+' '+JSON.stringify(c.preferences||{});
    if(flow==='rent'){
      if(hh==='roommates')return 'roommates';
      if(hh==='family'||(c.children&&c.children!=='ندارم'))return 'family';
      if(hh==='couple')return 'couple';
      if(/(دانشجو|دانشگاه|کوی)/.test(occ||''))return 'student';
      if(/(بازنشسته|سالمند)/.test(occ||''))return 'retiree';
      if(/(انتقال|ماموریت|شغل جدید|تغییر شهر)/.test(housing||sig||''))return 'relocating';
      return 'professional';
    }
    if(flow==='buy'){
      if(/(سرمایه|سود|اجاره دادن|کسب درآمد)/.test(sig||'')||(c.purpose==='invest'))return 'investor';
      if(/(اولین بار|اولین خانه|برای اولین)/.test(housing||sig||''))return 'firsttime';
      if(/(بزرگتر|تعویض|فامیلی|پدر|مادر|بچه‌ها)/.test(sig||''))return 'upgrader';
      return 'buyer';
    }
    return 'general';
  }
  var PERSONA_TONE={
    student:{open:'نزدیک دانشگاه یا محل کار می‌خواهید؟',tone:'ساده و سریع'},
    family:{open:'برای خودتان و بچه‌ها، مدرسه و سکوت محیط مهم است.',tone:'گرم و باحوصله'},
    couple:{open:'برای دو نفر یک خواب معمولاً کافی است؛ نظرتان؟',tone:'دوستانه'},
    roommates:{open:'سهم هر نفر در ودیعه و اجاره چطور حساب می‌شود؟',tone:'دقیق در تقسیم هزینه'},
    retiree:{open:'حمل‌ونقل راحت و طبقهٔ مناسب برایتان مهم است؟',tone:'محترمانه و شمرده'},
    relocating:{open:'کار یا تحصیلتان کدام سمت شهر است؟',tone:'راهنما'},
    professional:{open:'دسترسی مترو مهم‌تر است یا سکوت؟',tone:'کارآمد'},
    firsttime:{open:'قدم‌به‌قدم همراهتان هستم.',tone:'آموزشی'},
    upgrader:{open:'ملک فعلی را هم می‌فروشید یا فقط خرید می‌کنید؟',tone:'مسلط به بازار'},
    investor:{open:'هدف سود اجاره است یا رشد قیمت؟',tone:'داده‌محور'},
    buyer:{open:'برای سکونت می‌خرید یا سرمایه‌گذاری؟',tone:'متعادل'},
    general:{open:'',tone:'متعادل'}
  };

  /* ── slot frames per workflow (condensed persona matrix) ── */
  var FRAMES={
    rent:{slots:[
      {id:'rent_budget',ask:'بودجهٔ اجارهٔ ماهانه‌تان حدوداً چقدر است؟ (مثلاً «۴۰۰ تا ۵۵۰ میلیون»)',required:true,parser:'moneyRange'},
      {id:'dep_budget',ask:'ودیعه حدوداً چقدر می‌دهید؟ (می‌توانید «بدون سقف» بگویید)',required:false,parser:'moneyRange'},
      {id:'household',ask:'خانه برای چه کسانی است؟ تنهایی، خانواده، یا دو نفره؟',required:true,parser:'household'},
      {id:'rooms',ask:'چند خواب لازم دارید؟',required:false,parser:'count',cond:function(d){return !!d.household}},
      {id:'m2',ask:'حداقل متراژ چند متر؟',required:false,parser:'count'},
      {id:'prop_age',ask:'حداکثر عمر بنا؟ (یا «مهم نیست»)',required:false,parser:'count'},
      {id:'preferences',ask:'الزاماتی مثل پارکینگ، آسانسور یا مترو دارید؟',required:false,parser:'prefs'}
    ],greet:function(pers){
      var pre=confirmPrev('rent_budget','بودجهٔ اجاره');
      if(pre)return pre;
      var t=PERSONA_TONE[pers]||PERSONA_TONE.general;
      return 'خب، برای پیدا کردن گزینهٔ درست چند چیز را می‌پرسم — '+t.open;
    }},
    buy:{slots:[
      {id:'buy_budget',ask:'بازهٔ بودجهٔ خریدتان حدوداً چقدر است؟ (مثلاً «۳۰ تا ۴۰ میلیارد»)',required:true,parser:'moneyRange'},
      {id:'purpose',ask:'برای سکونت می‌خرید یا سرمایه‌گذاری؟',required:true,parser:'purpose'},
      {id:'rooms',ask:'حداقل چند خواب؟',required:false,parser:'count'},
      {id:'m2',ask:'حداقل متراژ؟',required:false,parser:'count'},
      {id:'prop_age',ask:'حداکثر عمر بنا؟',required:false,parser:'count'},
      {id:'preferences',ask:'الزاماتی مثل آسانسور، پارکینگ یا بالکن؟',required:false,parser:'prefs'}
    ],greet:function(pers){
      var pre=confirmPrev('buy_budget','بودجهٔ خرید');
      if(pre)return pre;
      return pers==='investor'?'برای انتخاب داده‌محور، هدف و محدوده‌تان را بدانم بهتر پیش می‌رویم.':'برای پیدا کردن گزینهٔ مناسب، بودجه و هدف‌تان را بدانم کافی است.';
    }},
    sell:{slots:[
      {id:'prop_area',ask:'متراژ ملک حدوداً چند متر است؟',required:true,parser:'count'},
      {id:'sale_urgency',ask:'فروش فوری مدنظر است یا حداکثر قیمت؟',required:true,parser:'urgency'},
      {id:'prop_age',ask:'سن بنا چند ساله؟',required:false,parser:'count'},
      {id:'expected_price',ask:'قیمت مدنظرتان چقدر است؟',required:false,parser:'moneyRange'}
    ],greet:function(){return 'برای ارزیابی و فروش ملک، چند مشخصهٔ اصلی را می‌پرسم.'}},
    contract:{slots:[
      {id:'contract_type',ask:'چه سندی؟ اجاره‌نامه یا مبایعه‌نامه؟',required:true,parser:'ctype'},
      {id:'party_role',ask:'سمت شما کدام است؟ مالک یا مستأجر/خریدار؟',required:true,parser:'role'}
    ],greet:function(){return 'برای تنظیم قرارداد، نوع سند و نقش‌تان را بدانم فرم دقیق‌تر پیش می‌رود.'}}
  };

  /* ── confirm previously stored info (Workstream B) ── */
  function confirmPrev(slot,label){
    var v=prof().confirmed[slot];
    if(v===undefined)return null;
    return '@PREVCONF|'+slot+'|'+label+'|'+String(Array.isArray(v)?(fa(v[0],0)+' تا '+fa(v[1],0)+' تومان'):v);
  }

  /* ── parsers (V0.28 Persian parser conventions: rial units) ── */
  function parse(slot,parser,text){
    var t=String(text||'');
    switch(parser){
      case 'moneyRange':{
        if(/بدون سقف|سقف نداره|نامحدود/.test(nz(t)))return {val:null,skip:true};
        var clean=String(t).replace(/حدوداً|حدود|تقریباً|تقریبا|حداقل|حداکثر|حدودا/g,'');
        var r=parseMoneyRangeFA(clean);
        if(r&&r.ok){var p=r.value.split('|');return {val:[+p[0],+p[1]]}}
        var m=parseMoneyFA(clean);
        if(m&&m.ok){return {val:[m.value,m.value]}}
        if(/نمیدانم|نمی دونم|نمی دانم|مطمئن نیستم/.test(nz(t)))return {val:null,amb:true};
        return null;
      }
      case 'count':{
        if(/مهم نیست|فرقی نداره|فرق ندارد/.test(nz(t)))return {val:null,skip:true};
        if(/میلیون|میلیارد|تومان|ریال|هزار توم/.test(nz(t)))return null; /* money, not a count */
        var cl=String(t).replace(/حداقل|حداکثر|حدوداً|حدود|تقریباً|تقریبا/g,'');
        var c=parseCountFA(cl);
        if(c&&c.ok&&c.value>0&&c.value<10000)return {val:c.value};
        return null;
      }
      case 'household':{
        var nt=nz(t);
        if(/تنهایی|فقط خودم|یک نفر|مجرد/.test(nt))return {val:'single'};
        if(/همخونه|هم خونه|هم اتاق/.test(nt))return {val:'roommates'};
        if(/زوج|تازه ازدواج|دو نفره|دو نفر|من و همسر|من و خانم|من و اقام/.test(nt))return {val:'couple'};
        if(/خانواده|بچه|فرزند|کودک|سه نفر|چهار نفر|پنج نفر|چهارده نفر/.test(nt))return {val:'family'};
        return null;
      }
      case 'hood':{
        var l=(typeof HOODS!=='undefined')?HOODS:[],i;
        for(i=0;i<l.length;i++){if(t.indexOf(l[i].n)>=0)return {val:l[i].id}}
        if(/فرقی نداره|فرق ندارد|هر جا|هرجا|مطمئن نیستم/.test(nz(t)))return {val:null,skip:true};
        return null;
      }
      case 'purpose':{
        var nt2=nz(t);
        if(/سرمایه|سود|اجاره بدهم|درآمد/.test(nt2))return {val:'invest'};
        if(/سکونت|زندگی|خودم/.test(nt2))return {val:'residence'};
        return null;
      }
      case 'urgency':{
        var nt3=nz(t);
        if(/فوری|سریع|هر چه زودتر|هرچه زودتر|عجله/.test(nt3))return {val:'fast'};
        if(/حداکثر|قیمت بهتر|منتظر/.test(nt3))return {val:'maxvalue'};
        return null;
      }
      case 'ctype':{
        if(/مبایعه|خرید/.test(nz(t)))return {val:'buy'};
        if(/اجاره/.test(nz(t)))return {val:'rent'};
        return null;
      }
      case 'role':{
        if(/مالک|صاحب|موجر/.test(nz(t)))return {val:'owner'};
        if(/مستاجر|مستأجر|خریدار/.test(nz(t)))return {val:'tenant'};
        return null;
      }
      case 'prefs':{
        var nt4=nz(t),found=[];
        if(/پارکینگ/.test(nt4))found.push('parking');
        if(/اسانسور/.test(nt4))found.push('elevator');
        if(/بالکن/.test(nt4))found.push('balcony');
        if(/سکوت|آرام/.test(nt4))found.push('quiet');
        if(/مترو/.test(nt4))found.push('metro');
        var mm=parseCountFA(nt4);
        if(mm&&mm.ok&&/متر/.test(nt4))found.push('minm2:'+mm.value);
        if(/مهم نیست|نه|هیچی|ندارم/.test(nt4)&&!found.length)return {val:[],skip:true};
        return found.length?{val:found}:null;
      }
    }
    return null;
  }

  /* ── adaptive collector state ── */
  var COL={active:false,wf:null,slotIx:0,filled:{},fixSlot:null};
  function active(){return COL.active}

  function start(wf){
    var fr=FRAMES[wf];if(!fr)return false;
    COL={active:true,wf:wf,slotIx:0,filled:{},fixSlot:null};
    var pers=personaOf(wf);
    inferSlot('persona',pers);
    var greet=fr.greet(pers);
    if(greet&&greet.indexOf('@PREVCONF|')===0){
      var pp=greet.split('|');
      botC('دفعهٔ پیش '+pp[2]+'‌تان را <b>'+esc(pp[3])+'</b> گفته بودید — هنوز معتبر است؟',null);
      botC('<div class="e29-chip-row"><button data-cba="e29prevYes" data-slot="'+qesc(pp[1])+'">همان است</button><button data-cba="e29prevNo" data-slot="'+qesc(pp[1])+'">تغییر کرده</button></div>',null);
      COL.pendingPrev=pp[1];
      return true;
    }
    botC(greet,null);
    askNext();
    return true;
  }
  function askNext(){
    var fr=FRAMES[COL.wf];if(!fr){stop();return}
    while(COL.slotIx<fr.slots.length){
      var s=fr.slots[COL.slotIx];
      if(s.cond&&!s.cond(COL.filled)){COL.slotIx++;continue}
      if(COL.filled[s.id]!==undefined){COL.slotIx++;continue}
      botC(s.ask,null);
      a11yify($('#v-landing')||document.body);
      return;
    }
    complete();
  }
  function stop(){COL.active=false}

  /* handle user text while collector active; returns true if consumed */
  function feed(text){
    if(!COL.active)return false;
    var fr=FRAMES[COL.wf];if(!fr){stop();return false}
    var t=String(text);
    if(/^\s*(منو|راهنما|لغو|بستن)\s*$/.test(nz(t))){
      usrC(t);stop();botC('گفت‌وگوی آزاد ادامه دارد — هر وقت خواستید دوباره شروع کنید.',null);return true;
    }
    var slots=fr.slots,consumed=false,i;
    /* one meaningful value per turn: first matching pending slot wins */
    for(i=COL.slotIx;i<slots.length;i++){
      var s=slots[i];
      if(s.cond&&!s.cond(COL.filled))continue;
      if(COL.filled[s.id]!==undefined)continue;
      var r=parse(s,s.parser,t);
      if(!r)continue;
      if(r.amb){
        usrC(t);
        botC('اشکالی ندارد — هر وقت مشخص شد بگویید و ادامه می‌دهیم.',null);
        COL.filled[s.id]=null;
        if(COL.slotIx===i)COL.slotIx=i+1;
        askNext();
        return true;
      }
      setSlot(s.id,r.val,true);
      if(r.val==='family'||r.val==='couple'||r.val==='single'||r.val==='roommates')setSlot('household',r.val,true);
      if(r.val==='family'){var fm=parseCountFA(nz(t));if(fm&&fm.ok&&fm.value>=3)setSlot('family_members',fm.value,true)}
      COL.filled[s.id]=r.val;
      consumed=true;
      if(COL.slotIx===i)COL.slotIx=i+1;
      break;
    }
    if(!consumed)return false;
    usrC(t);
    askNext();
    return true;
  }

  /* hand-off to deterministic engine (no re-asking) */
  function complete(){
    var wf=COL.wf,d=COL.filled;
    stop();
    botC('عالی — اطلاعات اصلی را دارم. می‌رویم سراغ گزینه‌ها:',null);
    profileCard();
    try{
      if(wf==='rent'&&typeof ceStart==='function'){
        ceStart('rent');
        var D=wd('rent').data;
        defP(D);
        var budg=(d.rent_budget&&d.rent_budget[1])||500000000;
        var dep=(d.dep_budget&&d.dep_budget[1])||null;
        D.B={inc:1500000000,depB:dep||15000000000,rentB:budg,chg:50000000,incr:100000000};
        if(!dep)D.depOpen=true;
        D._depSet=1;D._rentbSet=1;
        var pers=getSlot('persona')||personaOf('rent');
        var P=D.P;
        if(pers==='family'){P.school=4;P.metro=2;P.work=3}
        else if(pers==='student'||pers==='professional'||pers==='roommates'){P.metro=4;P.school=1;P.work=4}
        else if(pers==='retiree'){P.school=1;P.metro=3;P.work=1}
        if(d.rooms!=null)P.beds=+d.rooms;
        if(d.household==='family')P.persona='خانواده';
        else if(d.household==='couple')P.persona='دو نفره';
        else if(d.household==='single'||d.household==='roommates')P.persona='دانشجو/کاری';
        if(d.m2!=null)P.minM2=+d.m2;
        if(d.prop_age!=null)P.maxAge=+d.prop_age;
        (d.preferences||[]).forEach(function(x){
          if(x==='elevator')P.elev=true;
          else if(x==='parking')P.park=true;
          else if(x==='metro')P.metro=5;
          else if(x==='quiet')P.quiet=5;
          else if(String(x).indexOf('minm2:')===0)P.minM2=+String(x).slice(6);
        });
        D._v29handoff=1;save();
        ceJump('hoods');
        return;
      }
      if(wf==='buy'&&typeof ceStart==='function'){
        ceStart('buy');
        var D2=wd('buy').data;
        defP(D2);defPR(D2);
        if(d.buy_budget)D2.budg=d.buy_budget[1];
        D2._budgSet=1;
        if(d.purpose==='invest'){D2.P.metro=2;D2.P.school=2;D2.P.work=2}
        if(d.rooms!=null)D2.PR.beds=+d.rooms;
        if(d.m2!=null)D2.PR.m2=[+d.m2,+d.m2+30];
        if(d.prop_age!=null)D2.PR.age=[0,+d.prop_age];
        (d.preferences||[]).forEach(function(x){
          if(x==='elevator')D2.PR.elev='yes';
          else if(x==='parking')D2.PR.park='yes';
          else if(x==='balcony')D2.PR.balc='yes';
          else if(String(x).indexOf('minm2:')===0)D2.PR.m2=[+String(x).slice(6),D2.PR.m2[1]];
        });
        D2._v29handoff=1;save();
        ceJump('hoods');
        return;
      }
    }catch(e){console.error('E29 handoff',e)}
    if(wf==='contract')botC('برای تنظیم قرارداد، «قرارداد» را از منوی سرویس‌ها انتخاب کنید؛ نقش و نوع سند را ثبت کردم.',null);
  }

  /* profile card + corrections (spec §4.2) */
  function profileCard(){
    var c=prof().confirmed,h=[],keys=Object.keys(c);
    if(!keys.length)return;
    h.push('<div class="e29-profcard"><b>پروفایل شما</b>');
    keys.slice(0,7).forEach(function(k){
      var v=c[k],shown;
      if(Array.isArray(v)&&typeof v[0]==='number')shown=rial(v[0])+(v[1]!==v[0]?' تا '+rial(v[1]):'');
      else if(Array.isArray(v)){
        var PL={parking:'پارکینگ',elevator:'آسانسور',balcony:'بالکن',quiet:'سکوت',metro:'مترو'};
        shown=v.map(function(x){return String(x).indexOf('minm2:')===0?('حداقل '+fa(+String(x).slice(6),0)+' متر'):(PL[x]||x)}).join('، ');
        if(!shown)shown='ندارد';
      }
      else shown=String(v);
      h.push('<div class="prow"><span>'+(SLOT_LABEL[k]||k)+':</span><b>'+esc(shown)+
        ' <span class="pact" data-cba="e29profFix" data-slot="'+qesc(k)+'">اصلاح</span></b></div>');
    });
    h.push('</div>');
    botC(h.join(''),null);
    a11yify($('#v-landing')||document.body);
  }
  CBACT.e29profFix=function(el){
    var slot=el.getAttribute('data-slot');
    botC('مقدار جدید برای «'+(SLOT_LABEL[slot]||slot)+'» را بنویسید (یا بنویسید «پاک کن»):',null);
    COL={active:false,wf:null,slotIx:0,filled:{},fixSlot:slot};
  };
  function applyFix(text){
    if(COL.fixSlot){
      var slot=COL.fixSlot;COL.fixSlot=null;
      usrC(text);
      if(/پاک کن|حذف/.test(nz(text))){setSlot(slot,undefined)}
      else{
        var r=parse({},'moneyRange',text);
        if(!r||r.amb)r=parse({},'count',text);
        setSlot(slot,r&&!r.amb?r.val:text,true);
      }
      profileCard();
      botC('ثبت شد ✓',null);
      return true;
    }
    return false;
  }

  /* prev-confirm handlers */
  CBACT.e29prevYes=function(){usrC('همان است');COL.pendingPrev=null;askNext()};
  CBACT.e29prevNo=function(el){
    var slot=el.getAttribute('data-slot');
    usrC('تغییر کرده');
    setSlot(slot,undefined);
    COL.pendingPrev=null;
    askNext();
  };

  /* workflow summary for library milestone cards */
  function wfSummary(wf){
    var p=[],d=wf.data||{};
    if(d.B&&d.B.rentB)p.push('سقف اجاره: '+rial(d.B.rentB));
    if(d.budg)p.push('بودجه: '+rial(d.budg));
    if(d.P&&d.P.persona)p.push(d.P.persona);
    if(d.P&&d.P.beds)p.push(fa(d.P.beds,0)+' خواب');
    return p.join(' · ')||('مرحلهٔ '+fa(wf.step,0));
  }

  /* milestone saving (spec §8.6) — called after ceVal advances a step */
  var MILESTONES={rent:6,buy:5};
  function maybeMilestone(m,step,D){
    var need=MILESTONES[m];
    if(!need||step<need||!D)return;
    if(!D._v29m)D._v29m={};
    if(D._v29m['s'+step])return;
    D._v29m['s'+step]=true;
    var wf=wd(m);
    var it=E29.libAPI.saveWorkflowProgress(wf);
    if(it)E29.bus.emit('workflow.milestone',{wfId:wf.id,milestone:'s'+step,msg:'گردش کار «'+it.title+'» در کتابخانه ثبت شد',libId:it.id});
  }

  /* ── free-text interception (called from wrapped ceSend, before E28.remAuto) ── */
  function route(text,raw){
    if(!S.auth)return false;
    var t=raw||text;
    if(applyFix(t))return true;
    if(COL.active){
      if(feed(t))return true;
      return false;
    }
    if(COL.pendingPrev)return false;
    var nt=nz(t);
    if((!CE.f||CE.f==='gate')&&/می ?خوام|می ?خواهم|دنبال/.test(nt)&&/خونه|خانه|ملک|آپارتمان|اجاره|کرایه|خرید|فروش/.test(nt)){
      if(/اجاره|کرایه|استیجار/.test(nt)){usrC(t);return start('rent')}
      if(/خرید|بخرم/.test(nt)){usrC(t);return start('buy')}
      if(/بفروشم|فروش/.test(nt)){usrC(t);return start('sell')}
    }
    return false;
  }

  E29.intelAPI={route:route,start:start,active:active,getSlot:getSlot,setSlot:setSlot,prof:prof,
    personaOf:personaOf,wfSummary:wfSummary,maybeMilestone:maybeMilestone,profileCard:profileCard,
    confirmPrev:confirmPrev};
  return E29.intelAPI;
})();
