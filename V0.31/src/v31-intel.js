/* ═══════════════ V0.31 — E30 INTEL: conversational discovery engine (spec §4) ═══════════════
   Philosophy: user explains their situation → assistant understands → summarizes →
   identifies what's missing → asks ONE relevant question → user answers → understanding
   updates → next question adapts. Never a fixed questionnaire; never re-asks given info;
   never converts an inference into a confirmed requirement; never silently defaults money.
   ═══════════════ */
E30.disc=(function(){
  function nz(t){return normFa(String(t||'')).replace(/‌/g,' ')}
  var BUY_VERB=/خرید|بخرم|بخریم|بخرید|بخرن|بخرند|می ?خریم|بخرم/;
  function excludesInvestment(nt){return /نه[^.،؛]{0,18}سرمایه|سرمایه ?گذاری (نیست|نمی ?خوام|نمی ?خواهیم)|برای سرمایه ?گذاری نیست/.test(nt)}

  /* ── context model (§4.4): every fact = value + source + confidence + status ── */
  function freshCtx(){return {fields:{},log:[],createdAt:Date.now()}}
  function contextKey(){
    if(!S.ctx30ActiveKey)S.ctx30ActiveKey='live:'+E30.uid('CTX');
    return S.ctx30ActiveKey;
  }
  function ctx(){
    var key=contextKey();
    if(!S.ctx30ByChat){
      S.ctx30ByChat={};
      /* Safe migration of the V0.31 single-chat state; it belongs only to the
         currently active conversation and must never leak to the next one. */
      S.ctx30ByChat[key]=S.ctx30&&S.ctx30.fields?S.ctx30:freshCtx();
    }
    if(!S.ctx30ByChat[key])S.ctx30ByChat[key]=freshCtx();
    S.ctx30=S.ctx30ByChat[key];
    if(!S.ctx30.fields)S.ctx30.fields={};
    if(!S.ctx30.log)S.ctx30.log=[];
    return S.ctx30;
  }
  function persist(){
    try{if(S.ctx30ByChat)S.ctx30ByChat[contextKey()]=S.ctx30;save()}catch(e){}
  }
  function useChat(id){
    saveCollector();
    COL={active:false,wf:null,fix:null,confirming:null,turns:0};
    S.ctx30ActiveKey=id?'chat:'+id:'live:'+E30.uid('CTX');
    if(!S.ctx30ByChat)S.ctx30ByChat={};
    S.ctx30=S.ctx30ByChat[S.ctx30ActiveKey]||(S.ctx30ByChat[S.ctx30ActiveKey]=freshCtx());
    resume();
    persist();
  }
  function bindChat(id){
    if(!id)return;
    var key=contextKey(),newKey='chat:'+id,current=ctx();
    if(key===newKey)return;
    if(!S.ctx30ByChat)S.ctx30ByChat={};
    S.ctx30ByChat[newKey]=current;
    if(S.ctx30Collectors&&S.ctx30Collectors[key]){
      S.ctx30Collectors[newKey]=S.ctx30Collectors[key];
      delete S.ctx30Collectors[key];
    }
    delete S.ctx30ByChat[key];
    /* Replace the temporary live conversation pointer in saved artifacts;
       otherwise "open source chat" references a nonexistent archive item. */
    function remapItem(it){if(it&&it.sourceChat===key)it.sourceChat=id}
    (S.library||[]).forEach(remapItem);
    (S.savedListings||[]).forEach(remapItem);
    (S.projects||[]).forEach(function(p){
      if(!p)return;
      if(p.chatIds)p.chatIds=p.chatIds.map(function(ref){return ref===key?id:ref});
      if(p._liveRefs)p._liveRefs.forEach(function(r){if(r&&r.id===key)r.id=id});
    });
    S.ctx30ActiveKey=newKey;persist();
  }
  function forgetChat(id){
    if(!id)return;
    var key='chat:'+id;
    if(S.ctx30ActiveKey===key)useChat(null);
    if(S.ctx30ByChat)delete S.ctx30ByChat[key];
    if(S.ctx30Collectors)delete S.ctx30Collectors[key];
    persist();
  }
  var evidenceText='',evidenceId='';
  function evidence(t){evidenceText=String(t||'');evidenceId=E30.uid('MSG')}
  /* field kinds: money | moneyRange | count | text | enum | loc | prefs | bool */
  /* status: confirmed | inferred | unknown | contradictory | stale               */
  function setF(id,v,opts){
    opts=opts||{};
    var c=ctx(),f=c.fields[id],now=Date.now();
    if(v===undefined||v===null||v===''){delete c.fields[id];persist();return}
    var msgSource=/^(open|turn|answer|clarify|resolution)$/.test(opts.src||'');
    var conf={v:v,src:opts.src||'',messageId:opts.messageId||(msgSource?evidenceId:null),
      rawSpan:opts.rawSpan||(msgSource?evidenceText:''),
      conf:opts.conf!==undefined?opts.conf:1,confidence:opts.conf!==undefined?opts.conf:1,
      requiresConfirmation:!!opts.requiresConfirmation,
      status:opts.inferred?'inferred':'confirmed',kind:opts.hard?'hard':(opts.soft?'soft':'plain'),
      ts:now,updatedAt:now};
    if(f&&f.status==='confirmed'&&JSON.stringify(f.v)!==JSON.stringify(conf.v)&&!opts.inferred){
      conf.previous={value:f.v,source:f.src,updatedAt:f.updatedAt||f.ts};
      if(f.src&&opts.src&&f.src!==opts.src){conf.stale=f.v} /* preserve prior version for audit */
    }
    if((id==='budget_dep'||id==='budget_rent')&&COL&&f&&JSON.stringify(f.v)!==JSON.stringify(v)){
      COL.finConfirmed=false;
      COL.finPrompted=false;
    }
    c.fields[id]=conf;
    c.log.push({t:now,slot:id,v:v,inferred:!!opts.inferred,src:opts.src||''});
    if(c.log.length>120)c.log.shift();
    /* mirror into V0.29 profile so existing profile card / wfSummary keep working */
    try{
      if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};
      if(id!=='prefRules'&&id!=='floor_preference'){
        if(opts.inferred){if(S.profile.confirmed[id]===undefined)S.profile.inferred[id]=v}
        else S.profile.confirmed[id]=v;
      }
    }catch(e){}
    persist();
  }
  function getF(id){var f=ctx().fields[id];return f?f.v:null}
  function fMeta(id){return ctx().fields[id]||null}
  function isHard(id){var f=ctx().fields[id];return f&&f.kind==='hard'}
  function markUnknown(id){setF(id,null);ctx().fields[id]={v:null,status:'unknown',conf:0,confidence:0,ts:Date.now(),kind:'plain',src:''};persist()}

  /* ── persona classification — DYNAMIC (re-run after every update; §6.1) ── */
  function personaOf(wf){
    if(getF('persona'))return getF('persona');
    var hh=getF('household'),kids=getF('children'),occ=getF('occupation')||'',stage=getF('life_stage')||'';
    var n=ctx();
    if(wf==='rent'||wf==='buy'){
      if(getF('purpose')==='invest')return 'investor';
      if(hh==='roommates')return 'roommates';
      if(hh==='family'||kids)return 'family';
      if(hh==='couple'||stage==='newly_married')return 'couple';
      if(/دانشجو|دانشگاه|کوی|نمونه/.test(String(occ)))return 'student';
      if(/بازنشسته|سالمند|رئيس‌تبار|بازنشسته/.test(String(occ)+String(stage)))return 'retiree';
      if(getF('relocating'))return 'relocating';
      if(wf==='buy'){if(stage==='first_home')return 'firsttime';return 'buyer'}
      if(stage==='first_rent')return 'firstrent';
      return 'professional';
    }
    if(wf==='sell'){
      var u=getF('sale_urgency');
      if(getF('ownership')==='inherited')return 'heir';
      if(getF('ownership')==='joint')return 'joint_owner';
      if(u==='fast')return 'urgent_seller';
      if(getF('landlord'))return 'landlord';
      return 'seller_max';
    }
    if(wf==='invest'){
      var o=getF('invest_objective');
      return ({rent_income:'yield_seeker',appreciation:'growth_seeker',inflation_hedge:'hedger',land_bank:'land_banker',
        resale:'flipper',commercial:'commercial',development:'developer',diversify:'diversifier'})[o]||'invest_new';
    }
    return 'general';
  }
  var P_TONE={
    student:{q:'سریع و ساده پیش برویم — ',why:'برای دانشجو معمولاً دسترسی و هزینه مهم‌تر از جزئیات است.'},
    family:{q:'برای خانواده‌تان ',why:'با بچه‌ها، مدرسه و امنیت محله معمولاً اولویت پیدا می‌کند.'},
    couple:{q:'برای زندگی دو نفره‌تان ',why:''},
    roommates:{q:'برای هم‌خانه‌ای ',why:'تقسیم ودیعه و اجاره بین هم‌خانه‌ای‌ها معمولاً مهم است.'},
    retiree:{q:'برای شرایط شما ',why:'طبقه، آسانسور و سکوت معمولاً اهمیت بیشتری پیدا می‌کند.'},
    relocating:{q:'با توجه به جابه‌جایی‌تان ',why:''},
    firstrent:{q:'برای اولین اجاره ',why:'چون اولین تجاره‌تان است، هر جا ابهام داشت حتماً بپرسید.'},
    professional:{q:''},
    firsttime:{q:'برای اولین خرید ',why:'قدم‌به‌قدم همراهتان هستم.'},
    buyer:{q:''},investor:{q:'',why:'هدف سرمایه‌گذاری معمولاً سؤال‌های متفاوتی می‌خواهد.'},
    urgent_seller:{q:'',why:'با فوریت فروش، استراتژی قیمت متفاوت می‌شود.'},
    seller_max:{q:''},heir:{q:'',why:'در املاک ارثی، وضعیت سند معمولاً قبل از قیمت‌گذاری بررسی می‌شود.'},
    joint_owner:{q:'',why:'در مالکیت مشاعی، هماهنگی شرکا روی قیمت و زمان فروش مهم است.'},
    landlord:{q:''},yield_seeker:{q:''},growth_seeker:{q:''},hedger:{q:''},land_banker:{q:''},
    flipper:{q:''},commercial:{q:''},developer:{q:''},diversifier:{q:''},invest_new:{q:'برای اولین سرمایه‌گذاری ',why:'هدف اصلی شما تعیین می‌کند کدام اعداد مهم‌اند.'},
    general:{q:''}
  };

  /* ── field registry: label, ask variants, why, parser kind ── */
  var FL={
    life_stage:{l:'مرحلهٔ زندگی',kind:'enum'},
    occupation:{l:'شغل/تحصیل',kind:'text'},
    household:{l:'ترکیب خانوار',kind:'enum'},
    family_members:{l:'تعداد افراد',kind:'count'},
    children:{l:'فرزند',kind:'bool'},
    persona:{l:'پرسونا',kind:'enum'},
    work_loc:{l:'محل کار',kind:'loc'},
    uni_loc:{l:'دانشگاه',kind:'loc'},
    work_weight:{l:'اهمیت محل کار',kind:'enum'},
    budget_dep:{l:'ودیعه',kind:'moneyRange',fin:true},
    budget_rent:{l:'اجارهٔ ماهانه',kind:'moneyRange',fin:true},
    buy_budget:{l:'بودجهٔ خرید',kind:'moneyRange',fin:true},
    budget_scope:{l:'ماهیت بودجه',kind:'enum'},
    rooms:{l:'خواب',kind:'count'},
    m2:{l:'متراژ',kind:'count'},
    prop_age:{l:'عمر بنا',kind:'count'},
    prop_new:{l:'نوساز',kind:'enum'},
    prefs:{l:'الزامات',kind:'prefs'},
    timeline:{l:'زمان نقل مکان',kind:'text'},
    hood:{l:'محله',kind:'loc'},
    purpose:{l:'هدف خرید',kind:'enum'},
    invest_objective:{l:'هدف سرمایه‌گذاری',kind:'enum'},
    invest_capital:{l:'سرمایه',kind:'moneyRange',fin:true},
    invest_horizon:{l:'افق سرمایه‌گذاری',kind:'enum'},
    invest_liquidity:{l:'نقدشوندگی',kind:'enum'},
    invest_risk:{l:'ریسک‌پذیری',kind:'enum'},
    prop_area:{l:'متراژ ملک',kind:'count'},
    prop_rooms:{l:'خواب ملک',kind:'count'},
    ownership:{l:'نوع مالکیت',kind:'enum'},
    docs:{l:'وضعیت مدارک',kind:'enum'},
    sale_motivation:{l:'انگیزهٔ فروش',kind:'enum'},
    sale_urgency:{l:'فوریت فروش',kind:'enum'},
    expected_price:{l:'قیمت انتظاری',kind:'moneyRange',fin:true},
    min_price:{l:'کف قیمت',kind:'moneyRange',fin:true},
    listing_intent:{l:'نوع آگهی',kind:'enum'},
    floor_preference:{l:'طبقات قابل قبول',kind:'enum'},
    prefRules:{l:'سطح الزام ویژگی‌ها',kind:'prefs'}
  };
  var SLOT_LABEL={};Object.keys(FL).forEach(function(k){SLOT_LABEL[k]=FL[k].l});

  /* ── extraction: pull EVERY recognizable fact from a free-form message (§4.2) ── */
  function stripFin(t){return String(t).replace(/حدوداً|حدود|تقریباً|تقریبا|حداکثر|حداقل|در نظر گرفتی|می‌خوام|میخوام|بگیرم|بدم|هست|است|داره|دارم/g,' ')}
  function normHalf(s){
    var M={'یک':'1','دو':'2','سه':'3','چهار':'4','پنج':'5','شش':'6','هفت':'7','هشت':'8','نه':'9','ده':'10'};
    s=s.replace(/(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s*میلیارد\s*و\s*نیم/g,function(_,w){return M[w]+'.5 میلیارد'});
    s=s.replace(/(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s*میلیون\s*و\s*نیم/g,function(_,w){return M[w]+'.5 میلیون'});
    s=s.replace(/نیم\s*میلیارد/g,'0.5 میلیارد').replace(/نیم\s*میلیون/g,'0.5 میلیون');
    return s;
  }
  function segMoney(sg){
    var clean=normHalf(stripFin(sg))
      .replace(/(\d)[.](\d)/g,'$1٫$2') /* protect decimals before punctuation strip */
      .replace(/[،,؛!?\.]/g,' ')
      .replace(/ودیعه|رهن|پول جلو|اجاره|کرایه|ماهانه|ماهی|بودجه|سرمایه|پول|قیمت|هستم|است|باشه/g,' ')
      .replace(/\s+/g,' ').trim()
      .replace(/^(?:تا|از|سقف|زیر|بالای|بیشتر از|کمتر از)\s+/,'');
    var r=parseMoneyRangeFA(clean);
    if(r&&r.ok){var p=r.value.split('|');return [+p[0],+p[1]]}
    /* An invalid or incomplete range must never be silently reinterpreted as
       additive money by shortening its prefix. In particular, a 20–25m rent
       clause cannot contribute '20' to a preceding 1.5b deposit. */
    if(/\s(?:تا|الی)\s/.test(clean))return null;
    /* A full sentence can contain the next unrelated count after the money:
       «۱٫۵ میلیارد تومان، حداقل ۲ خواب». parseNumberWords would otherwise
       SUM that ۲ onto the money amount. Stop at the first explicit currency
       unit (after giving valid multi-endpoint ranges precedence). */
    var unit=clean.match(/تومان|تومن|ریال/);
    if(unit){
      var exact=parseMoneyFA(clean.slice(0,unit.index+unit[0].length));
      if(exact&&exact.ok)return [exact.value,exact.value];
    }
    var magnitudes=[...clean.matchAll(/میلیارد|میلیون|هزار/g)];
    if(!unit&&magnitudes.length){
      var last=magnitudes[magnitudes.length-1];
      var magMoney=parseMoneyFA(clean.slice(0,last.index+last[0].length));
      if(magMoney&&magMoney.ok)return [magMoney.value,magMoney.value];
    }
    var firstNum=clean.match(/^\d+(?:[٫.]\d+)?(?=\s|$)/);
    if(!unit&&!magnitudes.length&&firstNum){
      var bare=parseMoneyFA(firstNum[0]);if(bare&&bare.ok)return [bare.value,bare.value];
    }
    var m=parseMoneyFA(clean);
    if(m&&m.ok)return [m.value,m.value];
    /* progressive prefix: money sentences often carry trailing non-amount words */
    var toks=clean.split(/\s+/),k;
    for(k=toks.length-1;k>=2;k--){
      var cand=toks.slice(0,k).join(' ');
      var m2=parseMoneyFA(cand);
      if(m2&&m2.ok)return [m2.value,m2.value];
    }
    return null;
  }
  function finScan(raw){
    var out={},t=normFa(String(raw||'')).replace(/‌/g,' ');
    var amount='[0-9]+(?:[.٫][0-9]+)?(?:\\s*(?:میلیارد|میلیون|هزار))?(?:\\s*(?:تومان|تومن|ریال))?';
    function read(label){
      var before=new RegExp('('+amount+')\\s*(?:'+label+')').exec(t);
      var after=new RegExp('(?:'+label+')\\s*(?:ماهانه|ماهی|تا|حداکثر|حدود|من|ام|است|:)*\\s*('+amount+')').exec(t);
      var m=before||after;
      if(!m)return null;
      if(/^(?:0|۰)$/.test(m[1]))return [0,0];
      var p=parseMoneyFA(m[1]);return p.ok?[p.value,p.value]:null;
    }
    var dep=read('ودیعه|رهن|پول جلو'),rent=read('اجاره|کرایه|ماهی|ماهانه');
    if(dep)out.dep=dep;if(rent)out.rent=rent;
    return out;
  }
  /* Explicit polarity for each property preference. Word presence is never a
     hard requirement: «پارکینگ خوب است ولی ضروری نیست» must not drop listings. */
  var PREF_NAMES={parking:/پارکینگ/,elevator:/آسانسور|اسانسور/,balcony:/بالکن|تراس/,
    quiet:/سکوت|آرام/,metro:/مترو/,storage:/انباری/};
  function preferenceLevel(fragment){
    if(/نباید|مطلقاً نه|اصلا نباش|اصلاً نباش/.test(fragment))return 'forbidden';
    if(/نمی ?خوام|نمی ?خواهم|لازم نیست|نیاز ندارم|مهم نیست|فرقی ندارد|فرقی نداره|بدون/.test(fragment))return 'irrelevant';
    if(/ضروری نیست|الزامی نیست|اجباری نیست|ترجیح|خوبه|خوب است|بهتره|بهتر است/.test(fragment))return 'preferred';
    if(/الزامی|اجباری|حتما|حتماً|باید|ضروریه|ضروری است|حتمن|لازمه|لازم است|حتما داشته/.test(fragment))return 'required';
    return 'preferred';
  }
  function extractPrefs(nt,src){
    var old=getF('prefRules')||{},rules=Object.assign({},old),keys=Object.keys(PREF_NAMES),changed=0;
    var clauses=nt.split(/[،,؛]|\sو\s(?=پارکینگ|آسانسور|اسانسور|بالکن|تراس|مترو|انباری|سکوت|آرام)/);
    clauses.forEach(function(cl){
      keys.forEach(function(k){
        if(!PREF_NAMES[k].test(cl))return;
        var lev=preferenceLevel(cl);
        if(rules[k]!==lev){rules[k]=lev;changed++}
      });
    });
    if(changed){
      setF('prefRules',rules,{src:src});
      var required=keys.filter(function(k){return rules[k]==='required'});
      if(required.length)setF('prefs',required,{src:src,hard:true});
      else if(getF('prefs'))markUnknown('prefs');
    }
    var fl=nt.match(/طبقات?\s*(\d+)\s*(?:تا|الی|-)\s*(\d+)/)||nt.match(/طبقه(?:‌?های)?\s*(\d+)\s*(?:تا|الی|-)\s*(\d+)/);
    var one=!fl&&nt.match(/(?:فقط |حداکثر )?طبقه\s*(\d+)/);
    if(fl||one){
      var a=+(fl?fl[1]:one[1]),b=+(fl?fl[2]:one[1]);
      if(a>=0&&a<=b&&b<=100){
        var level=preferenceLevel(nt);
        if(/الزامی|باید|فقط|حداکثر|حتما|حتماً/.test(nt))level='required';
        setF('floor_preference',{min:a,max:b,level:level},{src:src,hard:level==='required',soft:level!=='required'});
        changed++;
      }
    }
    return changed;
  }
  function extract(text,src){
    var t=String(text||''),nt=nz(t),found=0,i;
    evidence(t);
    /* household */
    if(/تنهایی|فقط خودم|یه نفر|یک نفر|مجردم/.test(nt)){if(getF('household')!=='single'){setF('household','single',{src:src});found++}}
    else if(/هم ?خانه|هم ?خونه|همخانه|هم ?اتاق/.test(nt)){if(getF('household')!=='roommates'){setF('household','roommates',{src:src});found++}}
    else if(/زوج|ازدواج|عقد|دو نفره|من و همسر|من و خانمم|من و اقام/.test(nt)){if(getF('household')!=='couple'){setF('household','couple',{src:src});found++}}
    else if(/خانواده|بچه|فرزند|کودک|سه نفر|چهار نفر|پنج نفر/.test(nt)){if(getF('household')!=='family'){setF('household','family',{src:src});found++}}
    /* age — optional, only stored when volunteered */
    var agm=nt.match(/([۰-۹0-9]+)\s*سالمه/)||nt.match(/([۰-۹0-9]+)\s*سال(ه‌ام|ه ام| دارم)/)||nt.match(/سن[مم]? ([۰-۹0-9]+)/);
    if(agm){var ageN=pd(agm[1]);if(ageN>=10&&ageN<100&&getF('age')!=ageN){setF('age',ageN,{src:src});found++}}
    if(/بچه|فرزند|کودک/.test(nt)&&!/ندارم|نمی ?خوام|بدون بچه/.test(nt)){if(getF('children')!=='yes'){setF('children','yes',{src:src});found++}}
    if(/تازه ازدواج|عقد کرده|تازه عقد|می ?خوام ازدواج/.test(nt)&&getF('life_stage')!=='newly_married'){setF('life_stage','newly_married',{src:src});found++}
    if(/اولین بار|اولین تجربه|برای اولین/.test(nt)&&/اجاره/.test(nt)&&getF('life_stage')!=='first_rent'){setF('life_stage','first_rent',{src:src});found++}
    if(/اولین خانه|اولین بار.*خرید|اجاره ?نشین.*بخرم/.test(nt)&&getF('life_stage')!=='first_home'){setF('life_stage','first_home',{src:src});found++}
    /* occupation ONLY from explicit self-description — «دانشگاه» alone is a location, not a job (§4.2 no-wrong-inference) */
    if(/دانشجو(ام|م| هستم| هستم)|من دانشجو|دانشجوی\s/.test(nt)&&getF('occupation')!=='دانشجو'){setF('occupation','دانشجو',{src:src});found++}
    if(/بازنشسته|سالمند/.test(nt)&&getF('occupation')!=='بازنشسته'){setF('occupation','بازنشسته',{src:src});found++}
    if(/انتقال[یی]? (شغل|اداره)|ماموریت|جابه ?جا شدم.*کار|شغل جدید/.test(nt)){if(!getF('relocating')){setF('relocating','yes',{src:src});found++}}
    if(/مهاجرت/.test(nt)&&!getF('migrating')){setF('migrating','yes',{src:src});found++}
    /* rooms / m2 / age — word-numbers included («دو خواب») */
    var WN={'یک':1,'یک ':1,'دو':2,'سه':3,'چهار':4,'پنج':5};
    var mm=nt.match(/(\d+|[۰-۹]+|یک|دو|سه|چهار|پنج)\s*خواب/);
    if(mm){var nb=pd(mm[1]);if(!nb&&WN[mm[1]])nb=WN[mm[1]];if(nb>0&&nb<9&&getF('rooms')!=+nb){setF('rooms',+nb,{src:src});found++}}
    var m2=nt.match(/(\d+|[۰-۹]+)\s*متر/);if(m2){var nm2=pd(m2[1]);if(nm2>=15&&nm2<2000&&getF('m2')!=+nm2){setF('m2',+nm2,{src:src});found++}}
    if(/نوساز|تازه ?ساز|نو ساز/.test(nt)&&!/نوساز (نمی ?خوام|نمی ?خواهم|مهم نیست|لازم نیست)/.test(nt)){
      var newRequired=/نوساز.{0,22}(?:کاملا|کاملاً|الزامی|حتما|حتماً|باید|ضروری)|(?:کاملا|کاملاً|الزامی|حتما|حتماً|باید).{0,22}نوساز/.test(nt)&&
        !/الزامی نیست|ضروری نیست|اجباری نیست/.test(nt);
      if(getF('prop_new')!=='new'||newRequired&&!isHard('prop_new')){
        setF('prop_new','new',{src:src,hard:newRequired,soft:!newRequired,requiresConfirmation:!newRequired});found++;
        if(newRequired){setF('prop_age',3,{src:src,hard:true});fMeta('prop_new')._clar=true}
      }
    }
    if(/بازسازی/.test(nt)&&!getF('renov_ok')){setF('renov_ok','yes',{src:src,soft:true});found++}
    var ag=nt.match(/حداکثر عمر[^\d۰-۹]*(\d+|[۰-۹]+)/)||
      nt.match(/(?:عمر بنا|سال ساخت|ساختمان)[^\d۰-۹]{0,16}(\d+|[۰-۹]+)/)||
      nt.match(/(?:تا|حداکثر)\s*(\d+|[۰-۹]+)\s*سال\s*(?:ساخت|عمر)/)||
      nt.match(/(\d+|[۰-۹]+)\s*سال\s*(?:ساخت|عمر بنا)/);
    if(ag){var na=pd(ag[1]);if(na>0&&na<=40&&getF('prop_age')!=+na){setF('prop_age',+na,{src:src,hard:true});found++}}
    /* work / university locations — matched CLAUSE-WISE so «محل کارم نزدیک ونک و دانشگاه حوالی انقلاب» binds each hood to its own context */
    var hl=(typeof HOODS!=='undefined')?HOODS:[];
    function locIn(txt){for(var j=0;j<hl.length;j++){if(txt.indexOf(hl[j].n)>=0)return hl[j].id}return null}
    var clauses=nt.split(/\sو\s|،|؛|\.| ولی /).filter(function(c){return c&&c.replace(/\s/g,'')});
    var i2,wl2,ul2,gl2;
    for(i2=0;i2<clauses.length;i2++){
      var cl=clauses[i2];
      var clHood=locIn(cl);
      if(/محل کار|کارم|کارمون|اداره|شرکت|محل کارم/.test(cl)&&clHood){wl2=clHood}
      else if(/دانشگاه|دانشسر|تحصیل|فنی/.test(cl)&&clHood){ul2=clHood}
      else if(clHood&&!wl2&&!ul2){gl2=gl2||clHood}
    }
    if(/کارم عوض شد|محل کارم عوض شد|محل کار جدید|الان.*کار می ?کنم/.test(nt)){
      var changedAt=nt.search(/الان|حالا|جدید/),changedArea=locIn(changedAt>=0?nt.slice(changedAt):nt);
      if(changedArea)wl2=changedArea;
    }
    /* whole-message fallback when clauses lost the binding */
    if(!wl2&&/محل کار|کارم|کارمون|اداره|شرکت/.test(nt))wl2=locIn(nt)&&/محل کار|کارم/.test(nt.slice(0,nt.indexOf('دانشگاه')>=0?nt.indexOf('دانشگاه'):nt.length))?locIn(nt):null;
    if(!ul2&&/دانشگاه|تحصیل/.test(nt)){var afterUni=nt.slice(nt.indexOf('دانشگاه')>=0?nt.indexOf('دانشگاه'):0);ul2=locIn(afterUni)}
    if(wl2&&getF('work_loc')!==wl2){setF('work_loc',wl2,{src:src});found++}
    if(ul2&&getF('uni_loc')!==ul2){setF('uni_loc',ul2,{src:src});found++}
    /* hood target */
    if(!/محل کار|دانشگاه/.test(nt)){var hl2=locIn(nt);if(hl2&&getF('hood')!==hl2){setF('hood',hl2,{src:src});found++}}
    else if(gl2&&getF('hood')!==gl2&&!getF('work_loc')&&!getF('uni_loc')){setF('hood',gl2,{src:src});found++}
    /* both-locations weighting volunteered in one breath */
    if(/هر دو/.test(nt)&&getF('work_loc')&&getF('uni_loc')&&!getF('work_weight')){setF('work_weight','both',{src:src});found++}
    /* money — module-level finScan/segMoney; single-amount budgets via word-window */
    var fs=finScan(t);
    if(fs.dep){var nextDep=/بدون سقف|نامحدود/.test(nt)?{open:true}:{v:fs.dep};if(JSON.stringify(getF('budget_dep'))!==JSON.stringify(nextDep)){setF('budget_dep',nextDep,{src:src,fin:true,requiresConfirmation:true});found++}}
    if(fs.rent){var nextRent={v:fs.rent};if(JSON.stringify(getF('budget_rent'))!==JSON.stringify(nextRent)){setF('budget_rent',nextRent,{src:src,fin:true,requiresConfirmation:true});found++}}
    function moneyAfter(wordSrc){
      var re=new RegExp('(?:'+wordSrc+')');
      var m=nt.match(re);if(!m)return null;
      var pos=m.index,after=nt.slice(pos,pos+105);
      /* A direct money token is much safer than passing the entire adjacent
         sentence to parseMoneyFA (e.g. «بودجه‌مون حداکثر ۳۰ میلیارد تومان»). */
      var direct=after.match(/\d+(?:[٫.]\d+)?\s*(?:(?:تا|الی|-)\s*\d+(?:[٫.]\d+)?\s*)?(?:هزار|میلیون|میلیارد)\s*(?:تومان|ریال)?/);
      if(direct){var parsed=segMoney(direct[0]);if(parsed)return parsed}
      var i0=Math.max(0,pos-38),i1=Math.min(nt.length,pos+38);
      return segMoney(nt.slice(i0,i1));
    }
    if(!fs.dep&&!fs.rent){
      if(/بودجه|سرمایه|پولم|میلیارد/.test(nt)&&(BUY_VERB.test(nt)||/سرمایه ?گذاری/.test(nt))){var bv=moneyAfter('بودجه|سرمایه|پولم');if(bv){var bdId=(getF('purpose')==='invest'||(/سرمایه ?گذاری/.test(nt)&&!excludesInvestment(nt)))?'invest_capital':'buy_budget';if(JSON.stringify(getF(bdId))!==JSON.stringify({v:bv})){setF(bdId,{v:bv},{src:src,fin:true,requiresConfirmation:true});found++}}}
      else if(/ودیعه|رهن/.test(nt)){var dv=moneyAfter('ودیعه|رهن|پول جلو');if(dv){setF('budget_dep',/بدون سقف|نامحدود/.test(nt)?{open:true}:{v:dv},{src:src,fin:true});found++}}
      else if(/اجاره|کرایه|ماهانه/.test(nt)){var rv2=moneyAfter('اجاره|کرایه|ماهانه');if(rv2){setF('budget_rent',{v:rv2},{src:src,fin:true});found++}}
    }
    if(/بودجه|سقف|کل هزینه|خرج/.test(nt)&&BUY_VERB.test(nt)){
      if(/خودِ? ملک|فقط ملک|سقف ملک|قیمت ملک/.test(nt)&&getF('budget_scope')!=='property'){
        setF('budget_scope','property',{src:src});found++;
      }else if(/کل هزینه|هزینه جانبی|کل معامله|همه هزینه/.test(nt)&&getF('budget_scope')!=='total'){
        setF('budget_scope','total',{src:src});found++;
      }
    }
    /* purpose / objectives */
    if(!excludesInvestment(nt)&&/سرمایه ?گذاری|سود|اجاره بدهم|درآمد اجاره/.test(nt)&&getF('purpose')!=='invest'){setF('purpose','invest',{src:src});found++}
    if((/سکونت|برای خودم|برای خودمون|برای خودمان|زندگی/.test(nt)||excludesInvestment(nt))&&BUY_VERB.test(nt)&&getF('purpose')!=='residence'){setF('purpose','residence',{src:src});found++}
    if(/درآمد اجاره|اجاره بدهم|سود اجاره/.test(nt)&&!getF('invest_objective')){setF('invest_objective','rent_income',{src:src});found++}
    else if(/حفظ ارزش|تورم|ارزش پولم/.test(nt)&&!getF('invest_objective')){setF('invest_objective','inflation_hedge',{src:src});found++}
    else if(/رشد قیمت|بزرگ بشه|قیمتش بره بالا/.test(nt)&&!getF('invest_objective')){setF('invest_objective','appreciation',{src:src});found++}
    else if(/زمین/.test(nt)&&/سرمایه ?گذاری|بخرم/.test(nt)&&!getF('invest_objective')){setF('invest_objective','land_bank',{src:src});found++}
    /* sale side */
    if(/ارث/.test(nt)&&getF('ownership')!=='inherited'){setF('ownership','inherited',{src:src});found++}
    if(/مشاع|شریک|برادر|خواهر.*مالک|مالکیت مشترک/.test(nt)&&getF('ownership')!=='joint'){setF('ownership','joint',{src:src});found++}
    var urgNeg=/عجله ندارم|عجله نداریم|فوری نیست|هجله ندارم/.test(nt);
    if(!urgNeg&&/عجله|فوری|زود(تر)? بفروشم|زود(تر)? فروش|سریع فروش/.test(nt)&&getF('sale_urgency')!=='fast'){setF('sale_urgency','fast',{src:src,hard:true});found++}
    if(/مهاجرت/.test(nt)&&/فروش|بفروشم/.test(nt)&&getF('sale_motivation')!=='مهاجرت'){setF('sale_motivation','مهاجرت',{src:src});found++}
    if(/اجاره می ?دم|موجر|مستأجر دارم|مستاجر دارم|اجاره ? دادن/.test(nt)&&!getF('landlord')){setF('landlord','yes',{src:src});found++}
    if(/اجاره\s*(?:بدم|می ?دم|دادن)|اجاره ?گذاری|موجر|مستأجر دارم|مستاجر دارم/.test(nt)&&
       /ملکم|ملکمو|ملک خودم|مالک|موجر|اجاره بدم|اجاره می ?دم/.test(nt)&&getF('landlord')!=='yes'){
      setF('landlord','yes',{src:src});found++;
    }
    if(/اقامتگاه|کوتاه ?مدت|اجاره شبانه|رزرو شبانه/.test(nt)&&getF('listing_intent')!=='stay'){
      setF('listing_intent','stay',{src:src});found++;
    }else if(/فقط قیمت|مشاوره قیمت|قیمت ?گذاری|ارزش ?گذاری/.test(nt)&&getF('listing_intent')!=='price'){
      setF('listing_intent','price',{src:src});found++;
    }else if(/ملکمو اجاره بدم|ملکم را اجاره بدم|اجاره مسکونی|آگهی اجاره/.test(nt)&&getF('listing_intent')!=='res'){
      setF('listing_intent','res',{src:src});found++;
    }
    /* timeline */
    var tm=nt.match(/تا (یک|دو|سه|یک ماه|۲|۳)[^\s،.؛]* (دیگه|دیگر|ماه)/);if(tm&&!getF('timeline')){setF('timeline',tm[0],{src:src});found++}
    if(/فوری|هرچه زودتر|هر چه زودتر/.test(nt)&&!getF('timeline')){setF('timeline','فوری',{src:src});found++}
    /* commute ceiling: «بیشتر از نیم ساعت در مسیر نباشم» */
    var cm=nt.match(/(نیم ساعت|۳۰ دقیقه|30 دقیقه|یک ساعت|ساعت)[^\s،.؛]{0,12}/);
    if(cm&&/مسیر|رفت ?و ?آمد|در راه/.test(nt)&&getF('commute_max')!==cm[1]){setF('commute_max',cm[1],{src:src});found++}
    found+=extractPrefs(nt,src);
    return found;
  }

  /* ── adaptive question selection (§4.5) — impact-scored, not list-ordered ── */
  function missing(wf){
    var REQ={
      rent:[{id:'budget_dep',w:20},{id:'budget_rent',w:20},{id:'hood',w:19},
            {id:'persona',w:18},{id:'household',w:17},{id:'m2',w:16},{id:'rooms',w:15},
            {id:'floor_preference',w:14},{id:'prop_age',w:13},{id:'prefs',w:12},{id:'timeline',w:11},
            {id:'work_loc',w:2,cond:function(){return getF('work_commute')===true}},
            {id:'uni_loc',w:2,cond:function(){return getF('persona')==='student'}}],
      buy:[{id:'buy_budget',w:20},{id:'purpose',w:19},{id:'persona',w:18},
           {id:'household',w:17},{id:'hood',w:16},{id:'m2',w:15},{id:'rooms',w:14},
           {id:'prop_age',w:13},{id:'floor_preference',w:12},{id:'prefs',w:11},{id:'timeline',w:10}],
      sell:[{id:'prop_area',w:9},{id:'hood',w:9},{id:'prop_rooms',w:6},{id:'ownership',w:7},{id:'docs',w:5,cond:function(){return getF('ownership')==='inherited'}},
            {id:'sale_motivation',w:6},{id:'sale_urgency',w:7},{id:'expected_price',w:5},{id:'min_price',w:4,cond:function(){return getF('sale_urgency')==='fast'}}],
      invest:[{id:'invest_objective',w:10},{id:'invest_capital',w:9},{id:'invest_horizon',w:6},{id:'invest_liquidity',w:5},
              {id:'invest_risk',w:5},{id:'hood',w:4},{id:'prop_new',w:2}]
    };
    REQ.landlord=[{id:'listing_intent',w:12},{id:'hood',w:8},{id:'prop_area',w:7},
      {id:'prop_rooms',w:3,cond:function(){return getF('listing_intent')==='res'}},
      {id:'expected_price',w:2,cond:function(){return getF('listing_intent')==='res'}}];
    var list=REQ[wf]||[],out=[],i,p=personaOf(wf);
    for(i=0;i<list.length;i++){
      var it=list[i];
      if(it.cond&&!it.cond())continue;
      var f=fMeta(it.id);
      if(f&&(f.status==='confirmed'||f.status==='unknown'))continue;
      var score=it.w+((f&&f.status==='inferred')?2:0);
      if(wf==='sell'){
        if(p==='urgent_seller'&&it.id==='min_price')score+=10;
        if(p==='heir'&&it.id==='docs')score+=8;
      }
      out.push({id:it.id,w:score});
    }
    out.sort(function(a,b){return b.w-a.w});
    return out;
  }
  function needClarify(){
    /* pending inference worth clarifying before it hardens (§4.4) */
    var f=fMeta('prop_new');
    if(f&&f.status==='confirmed'&&f.v==='new'&&f._clar===undefined)return 'prop_new';
    return null;
  }

  /* ── question bank: per field — several natural templates + why ── */
  var ASK={
    budget_dep:{q:['ودیعه‌ای که در نظر دارید حدوداً چقدر است؟ (می‌توانید بازه بگویید یا «بدون سقف»)',
                   'برای ودیعه چه بازه‌ای در نظر گرفته‌اید؟'],
      why:'ودیعه و اجاره با هم تعیین می‌کنند چه گزینه‌هایی واقعاً در دسترس شماست.'},
    budget_rent:{q:['و اجارهٔ ماهانه حدوداً چقدر؟ (بازه هم کافی است)',
                    'اجارهٔ ماهانه‌ای که برایش آماده باشید چقدر است؟'],
      why:'هر دو عدد را جدا ثبت می‌کنم تا پیشنهادها دقیق باشد — هیچ عددی را حدس نمی‌زنم.'},
    buy_budget:{q:['بازهٔ بودجهٔ خریدتان حدوداً چقدر است؟','تا چه مبلغی برای خرید می‌روید؟ (بازه کافی است)'],
      why:''},
    budget_scope:{q:['این بودجه «سقف خودِ ملک» است یا «کل هزینهٔ معامله» (با ماهی قانونی، انتقال و انشعابات)؟',
                     'عددی که گفتید فقط خرید ملک را پوشش می‌دهد یا هزینه‌های جانبی معامله را هم؟'],
      why:'طبق تجربه، هزینه‌های جانبی معامله جدی است — اگر سقف را اشتباه بگیریم، گزینه‌های واقعاً در دسترستان جا می‌مانند.'},
    household:{q:['خانه برای چه کسانی است؟ (تنهایی، دو نفره، خانواده، هم‌خانه…)'],
      why:'ترکیب افراد روی تعداد خواب، متراژ و اولویت محله اثر مستقیم دارد.'},
    work_loc:{q:['محل کارتان کجاست؟ (نام محله یا تقریب)',
                 'بیشتر وقت‌ها کجا هستید — محل کار کدام سمت است؟'],
      why:'رفت‌وآمد روزانه معمولاً مهم‌ترین فاکتور انتخاب محله است.'},
    uni_loc:{q:['دانشگاه یا محل تحصیلتان کجاست؟'],
      why:'برای نزدیکی به دانشگاه باید بدانم کدام سمت شهر را بگردم.'},
    hood:{q:['محله یا سمت خاصی از شهر مدنظرتان هست؟'],
      why:'محدوده جست‌وجو را دقیق‌تر می‌کند.'},
    prop_new:{q:['نوساز برایتان چقدر مهم است؟ (کاملاً الزامی / تا ۵ سال هم کافی است / بازسازی‌شده هم اوکی)',
                 '«نوساز» را چقدر سخت می‌گیرم؟ فقط نوساز یا مثلاً تا ۵ سال ساخت هم باشد کافی است؟'],
      why:'تعریف دقیق نوساز روی تعداد گزینه‌ها خیلی اثر دارد.'},
    prop_age:{q:['حداکثر عمر بنا؟ (یا «مهم نیست»)'],
      why:''},
    rooms:{q:['چند خواب لازم دارید؟'],
      why:''},
    m2:{q:['حداقل متراژ چند متر باشد؟'],
      why:''},
    prefs:{q:['الزام دیگری دارید؟ (پارکینگ، آسانسور، بالکن، سکوت…)','چیز دیگری که حتماً باید باشد؟ (پارکینگ/آسانسور/…)'],
      why:''},
    timeline:{q:['تا چه زمانی باید جابه‌جا شده باشید؟'],
      why:'برای برنامه‌ریزی بازدید و قرارداد لازم است.'},
    purpose:{q:['برای سکونت می‌خرید یا سرمایه‌گذاری؟'],
      why:'این یک سؤال مسیر است — معیار انتخاب کاملاً عوض می‌شود.'},
    invest_objective:{q:['هدف اصلی‌تان چیست؟ (درآمد اجاره، رشد قیمت، حفظ ارزش در برابر تورم، زمین…)',
                         'بیشتر دنبال سود اجاره‌ای هستید یا رشد ارزش در بلندمدت؟'],
      why:'هدف سرمایه‌گذاری تعیین می‌کند کدام اعداد (بازده اجاره یا روند قیمت) برایتان مهم است.'},
    invest_capital:{q:['حدوداً چقدر سرمایه می‌خواهید وارد کنید؟ (بازه هم کافی است)'],
      why:'و اینکه چقدر از آن باید در دسترس بماند — ملک نقدشوندگی پایینی دارد.'},
    invest_horizon:{q:['افق سرمایه‌گذاری‌تان چقدر است؟ (۲–۳ سال، ۵ سال، بلندمدت…)'],
      why:''},
    invest_liquidity:{q:['اگر لازم شود، چقدر سریع باید بتوانید پول را خارج کنید؟'],
      why:''},
    invest_risk:{q:['نوسان قیمت برایتان چقدر قابل تحمل است؟'],
      why:''},
    prop_area:{q:['متراژ ملک حدوداً چند متر است؟'],
      why:''},
    prop_rooms:{q:['چند خواب است؟'],
      why:''},
    ownership:{q:['وضعیت مالکیت چطور است؟ (شخصی، ارثی، مشاعی…)'],
      why:'روی مسیر فروش و قیمت‌گذاری اثر دارد.'},
    docs:{q:['سند تک‌برگ است یا مدیرتُبُع/ورثه‌ای؟'],
      why:'زمان انتقال و مذاکره را تعیین می‌کند.'},
    sale_motivation:{q:['انگیزهٔ فروش چیست؟ (مهاجرت، تعویض، نقد شدن…)'],
      why:'استراتژی قیمت از انگیزه در می‌آید.'},
    sale_urgency:{q:['فروش فوری می‌خواهید یا حداکثر قیمت؟'],
      why:'این دو معمولاً با هم جمع نمی‌شوند — باید بدانم کدام اولویت است.'},
    expected_price:{q:['قیمت مدنظرتان حدوداً چقدر است؟'],
      why:'با دادهٔ نمونهٔ محله مقایسه‌اش می‌کنم.'},
    min_price:{q:['پایین‌تر از چه قیمتی نمی‌فروشید؟'],
      why:'برای فیلتر پیشنهادها لازم است.'},
    work_weight:{q:['نزدیکی به محل کار مهم‌تر است یا دانشگاه؟ یا هر دو تقریباً برابر؟'],
      why:'وزن هر کدام را در امتیاز محله می‌گذارم.'},
    listing_intent:{q:['برای ملک خودتان کدام را می‌خواهید: آگهی اجارهٔ مسکونی، اقامت کوتاه‌مدت یا فقط مشاورهٔ قیمت؟'],
      why:'هرکدام مسیر و اطلاعات متفاوتی دارند و بدون درخواست شما آگهی ثبت نمی‌کنم.'}
  };

  /* ── collector state ── */
  var COL={active:false,wf:null,fix:null,confirming:null,turns:0};
  function saveCollector(){
    try{
      if(!S.ctx30Collectors)S.ctx30Collectors={};
      S.ctx30Collectors[contextKey()]=Object.assign({},COL);
      persist();
    }catch(e){}
  }
  function resume(){
    try{
      var saved=S.ctx30Collectors&&S.ctx30Collectors[contextKey()];
      if(saved&&saved.active&&saved.wf)COL=Object.assign({},saved);
      else COL={active:false,wf:null,fix:null,confirming:null,turns:0};
    }catch(e){COL={active:false,wf:null,fix:null,confirming:null,turns:0}}
    return COL.active;
  }
  function active(){return COL.active}

  function start(wf,silent,budgetFirst){
    COL={active:true,optional:true,wf:wf,fix:null,confirming:null,turns:0,finConfirmed:false};
    _lastPersona=personaOf(wf);
    saveCollector();
    if(!silent)optionalHub();
    return true;
  }

  function optionalHub(){
    COL.expecting=null;COL.confirming=null;saveCollector();
    botC((SUM.start(COL.wf)||'چه خدمتی می‌خواهید دریافت کنید؟')+
      '<p class="note">شناخت نیاز اختیاری است. می‌توانید از پیشنهادها شرایط را تکمیل کنید یا همین حالا خدمت موردنظر را انتخاب کنید.</p>',null);
  }
  function preference(id){
    COL.optional=true;COL.active=true;COL.expecting=id;COL.confirming=null;saveCollector();
    var question=id==='budget_pair'?'سقف ودیعه و اجارهٔ ماهانه را با هم بنویسید؛ واحد پیش‌فرض تومان است.':
      id==='persona'?'کدام توصیف برای جست‌وجوی شما مناسب است؟ دانشجو، زوج، جوان، خانواده یا توصیف خودتان.':
      id==='floor_preference'?'طبقهٔ دلخواه یا بازهٔ طبقات را بنویسید.':
      (ASK[id]?ASK[id].q[0]:'ترجیح خود را بنویسید.');
    botC(question+'<p class="note">اختیاری؛ می‌توانید «رد» بفرستید یا نتیجه را با اطلاعات فعلی ببینید.</p>',null);
  }
  function feedOptional(text){
    var t=String(text),nt=nz(t),id=COL.fix||COL.expecting;usrC(t);evidence(t);
    if(/^(منو|لغو|بستن|انصراف)$/.test(nt)){stop();botC('اطلاعات گفتگو حفظ شد؛ خدمت دیگری انتخاب کنید.',null);return true}
    if(id&&/^(رد|رد کردن|مهم نیست|بعدا|بعداً|فرقی ندارد)$/.test(nt)){
      (id==='budget_pair'?['budget_dep','budget_rent']:[id]).forEach(markUnknown);
      COL.expecting=null;COL.fix=null;saveCollector();botC('این ترجیح نامشخص باقی ماند؛ می‌توانید خدمت دلخواه را دریافت کنید.',null);return true;
    }
    var found=extract(t,'turn'),ok=!!found;
    if(id==='budget_pair'){
      var fs=finScan(t);ok=!!(fs.dep&&fs.rent);
      if(fs.dep)setF('budget_dep',{v:fs.dep},{src:'answer'});
      if(fs.rent)setF('budget_rent',{v:fs.rent},{src:'answer'});
    }else if(id==='persona'){
      var v=/دانشجو/.test(nt)?'student':/زوج/.test(nt)?'couple':/جوان/.test(nt)?'young':/خانواده/.test(nt)?'family':null;
      if(v){setF('persona',v,{src:'answer'});ok=true}
    }else if(id==='floor_preference'){
      var nums=nt.match(/\d+/g);if(nums){setF(id,{min:+nums[0],max:+(nums[1]||nums[0]),level:/الزام|حتما|فقط/.test(nt)?'required':'preferred'},{src:'answer'});ok=true}
    }else if(id){ok=answer(id,t).ok||ok}
    if(id&&!ok){botC('این مقدار برای «'+esc(SLOT_LABEL[id]||id)+'» قابل تشخیص نبود؛ دوباره بنویسید یا «رد» بفرستید.',null);return true}
    COL.expecting=null;COL.fix=null;COL.finConfirmed=true;saveCollector();
    botC(ok?(SUM.turn()||'ترجیح شما ثبت شد.'):'برای ادامه یک خدمت یا پیشنهاد مرتبط انتخاب کنید.',null);return true;
  }

  /* summarize understanding (§4.6 part 2) — only what's actually known */
  var SUM={
    start:function(wf){
      var parts=[],v;
      if(wf==='rent'){
        v=getF('household');if(v)parts.push({single:'برای خودتان',couple:'برای زندگی دو نفره',family:'برای خانواده',roommates:'برای هم‌خانه'}[v]);
        if(getF('life_stage')==='newly_married')parts.push('شروع زندگی مشترک');
        if(getF('life_stage')==='first_rent')parts.push('اولین تجربهٔ اجاره');
        v=getF('work_loc');if(v)parts.push('محل کار حوالی '+findH(v).n);
        v=getF('uni_loc');if(v)parts.push('دانشگاه حوالی '+findH(v).n);
        v=getF('hood');if(v)parts.push('محلهٔ '+findH(v).n);
        if(getF('prop_new')==='new')parts.push('نوساز بودن');
      }else if(wf==='buy'){
        v=getF('purpose');if(v)parts.push(v==='invest'?'سرمایه‌گذاری':'سکونت');
        v=getF('household');if(v)parts.push({single:'استفادهٔ شخصی',couple:'دو نفره',family:'خانوادگی',roommates:'هم‌خانه‌ای'}[v]);
        if(getF('buy_budget'))parts.push('بودجه تا '+rial(getF('buy_budget').v[1]));
      }else if(wf==='sell'){
        v=getF('hood');if(v)parts.push('ملک در '+findH(v).n);
        v=getF('prop_area');if(v)parts.push(fa(v,0)+' متر');
        v=getF('sale_urgency');if(v)parts.push(v==='fast'?'فروش فوری':'بدون عجله، حداکثر قیمت');
      }else if(wf==='invest'){
        v=getF('invest_objective');if(v)parts.push({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش کوتاه‌مدت',commercial:'اجارهٔ تجاری',development:'پتانسیل توسعه',diversify:'تنوع پرتفوی'}[v]);
        v=getF('invest_capital');if(v)parts.push('سرمایه تا '+rial(v.v[1]));
      }
      if(!parts.length)return '';
      return 'پس فعلاً این‌ها را از حرف‌هایتان برداشت کردم: <b>'+parts.map(esc).join('، ')+'</b>.';
    },
    turn:function(){
      /* short per-turn ack of newly captured facts */
      var c=ctx(),recent=[],i;
      for(i=c.log.length-1;i>=0&&recent.length<3;i--){
        var e=c.log[i];var f=c.fields[e.slot];
        if(!f||f.status!=='confirmed')continue;
        if(Date.now()-e.t>2500)break;
        var sh=show(e.slot,f.v);
        if(sh&&recent.indexOf(sh)<0)recent.unshift(sh);
      }
      return recent.length?('✓ '+recent.join('، ')+' ثبت شد.'):'';
    }
  };
  function show(id,v){
    if(v===null||v===undefined)return '';
    if(id==='budget_dep'||id==='budget_rent'||id==='buy_budget'||id==='invest_capital'||id==='expected_price'||id==='min_price'){
      if(v&&v.open)return 'بدون سقف';
      if(v&&v.v)return rial(v.v[0])+(v.v[1]!==v.v[0]?' تا '+rial(v.v[1]):'');
      return '';
    }
    if(id==='household')return {single:'تنهایی',couple:'دو نفره',family:'خانواده',roommates:'هم‌خانه'}[v]||String(v);
    if(id==='work_loc'||id==='uni_loc'||id==='hood'){try{return findH(v).n}catch(e){return String(v)}}
    if(id==='prefs')return (v||[]).map(function(x){return ({parking:'پارکینگ',elevator:'آسانسور',balcony:'بالکن',quiet:'سکوت',metro:'مترو',storage:'انباری'})[x]||x}).join('، ');
    if(id==='prefRules'){
      var marks={required:'الزامی',preferred:'ترجیحی',irrelevant:'بی‌اهمیت',forbidden:'نامطلوب'};
      return Object.keys(v||{}).map(function(k){return ({parking:'پارکینگ',elevator:'آسانسور',balcony:'بالکن',quiet:'سکوت',metro:'مترو',storage:'انباری'})[k]+': '+marks[v[k]]}).join('؛ ');
    }
    if(id==='floor_preference')return 'طبقات '+fa(v.min,0)+' تا '+fa(v.max,0)+(v.level==='required'?' (الزامی)':' (ترجیحی)');
    if(id==='purpose')return v==='invest'?'سرمایه‌گذاری':'سکونت';
    if(id==='invest_objective')return ({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش سریع',commercial:'تجاری',development:'توسعه',diversify:'تنوع'})[v]||String(v);
    if(id==='prop_new')return v==='preferred'?'نوساز ترجیحی (غیرالزامی)':v==='recent'?'ساخت چند سال اخیر':'نوساز';
    if(typeof v==='number')return fa(v,0);
    return String(v);
  }


  /* Guided, optional chat cards. Values enter the SAME evidence-aware collector;
     they are not a second flow engine and never fabricate a budget. */
  var budgetCardSequence=0;
  function budgetCard(){
    var cardId=++budgetCardSequence;
    var depMissing=!getF('budget_dep'),rentMissing=!getF('budget_rent');
    if(!depMissing&&!rentMissing)return false;
    var options=function(name,values){
      return values.map(function(v,i){
        var key=name+'-'+cardId+'-'+i;
        var kind=name==='e30-dep'?'dep':'rent';
        return '<label for="'+key+'"><input type="radio" id="'+key+'" name="'+name+'-'+cardId+'" data-kind="'+kind+'" value="'+qesc(v)+'">تا '+esc(v)+' تومان</label>';
      }).join('');
    };
    var persona=personaOf('rent');
    var question=persona==='family'?'برای گزینه‌های مناسب خانواده، سقف ودیعه و اجاره‌ات حدوداً چقدر است؟':
      (persona==='roommates'?'برای مقایسهٔ گزینه‌های مناسب هم‌خانگی، سقف ودیعه و اجاره حدوداً چقدر است؟':
      (persona==='student'?'برای زندگی نزدیک دانشگاه، ودیعه و اجاره‌ات حدوداً چقدر است؟':
      'برای پیدا کردن گزینه‌های متناسب، ودیعه و اجاره‌ات حدوداً چقدر است؟'));
    var h='<div class="e30-budget-card" role="group" aria-label="بودجهٔ ودیعه و اجاره">'+
      '<b>'+esc(question)+'</b>'+
      '<p class="note">می‌توانی یکی از مبلغ‌های پیشنهادی را انتخاب کنی یا بودجهٔ خودت را در گفتگو بنویسی. هیچ مبلغی به‌صورت خودکار انتخاب نشده است.</p>';
    if(depMissing)h+='<fieldset><legend>حداکثر ودیعه (تومان)</legend>'+
      options('e30-dep',['۳۰۰ میلیون','۵۰۰ میلیون','۱ میلیارد','۱.۵ میلیارد'])+'</fieldset>';
    if(rentMissing)h+='<fieldset><legend>حداکثر اجارهٔ ماهانه (تومان)</legend>'+
      options('e30-rent',['۱۰ میلیون','۲۰ میلیون','۳۰ میلیون','۵۰ میلیون'])+'</fieldset>';
    h+='<button type="button" class="primary" data-cba="e30BudgetChoice">پیشنهاد گزینه‌های متناسب</button>'+
      '<span class="e30-footnote">برای مبلغ دقیق یا سقف دیگر، به زبان خودت بنویس؛ مثلاً «۸۰۰ میلیون رهن و ماهی ۲۵ میلیون».</span></div>';
    botC(h,null);
    COL.expecting=depMissing?'budget_dep':'budget_rent';
    saveCollector();
    return true;
  }
  function personaCard(){
    botC('برای اینکه پیشنهادها با سبک زندگی‌ات جور باشند، کدام حالت به شرایطت نزدیک‌تر است؟ <b>این بخش اختیاری است.</b>'+
      '<div class="e30-persona-card" role="group" aria-label="هدف سکونت">'+
      '<button type="button" data-cba="e30PersonaChoice" data-persona="single">زندگی فردی</button>'+
      '<button type="button" data-cba="e30PersonaChoice" data-persona="couple">زندگی دونفره</button>'+
      '<button type="button" data-cba="e30PersonaChoice" data-persona="family">زندگی خانوادگی</button>'+
      '<button type="button" data-cba="e30PersonaChoice" data-persona="roommates">هم‌خانه</button>'+
      '<button type="button" data-cba="e30PersonaSkip">رد کردن</button>'+
      '<button type="button" data-cba="e30UseKnown">با اطلاعات فعلی پیشنهاد بده</button></div>',null);
    COL.expecting='household';saveCollector();
  }
  CBACT.e30ChooseScenario=function(el){
    if(!COL.active)return;
    var kind=el.getAttribute('data-scenario');
    var allowed=['budget','family','compare','settle','fast','value','income','growth','safety'];
    if(allowed.indexOf(kind)<0)return;
    usrC(el.textContent.trim());
    COL.goal=kind;
    if(kind==='family')setF('household','family',{src:'chosen-scenario'});
    if(kind==='settle')setF('purpose','live',{src:'chosen-scenario'});
    if(kind==='income')setF('invest_objective','rent_income',{src:'chosen-scenario'});
    if(kind==='growth')setF('invest_objective','appreciation',{src:'chosen-scenario'});
    if(kind==='fast')setF('sale_urgency','fast',{src:'chosen-scenario'});
    if(kind==='value')setF('sale_urgency','maxvalue',{src:'chosen-scenario'});
    COL.expecting=null;saveCollector();
    botC('متوجه شدم. اول اطلاعات تعیین‌کننده را می‌گیریم؛ می‌توانی هر زمان مسیر را تغییر دهی.',null);
    askNext();
  };
  CBACT.e30BudgetChoice=function(el){
    if(!COL.active||COL.wf!=='rent')return;
    var root=el.closest('.e30-budget-card');
    if(!root)return;
    var dep=root.querySelector('input[data-kind="dep"]:checked');
    var rent=root.querySelector('input[data-kind="rent"]:checked');
    if(root.querySelector('input[data-kind="dep"]')&&!dep){toast('حداکثر ودیعه را انتخاب کن یا مبلغ را در گفتگو بنویس.');return}
    if(root.querySelector('input[data-kind="rent"]')&&!rent){toast('حداکثر اجارهٔ ماهانه را انتخاب کن یا مبلغ را در گفتگو بنویس.');return}
    var parts=[];
    if(dep)parts.push('حداکثر ودیعه '+dep.value+' تومان');
    if(rent)parts.push('حداکثر اجاره ماهانه '+rent.value+' تومان');
    el.disabled=true;ceSend(parts.join(' و '));
  };
  CBACT.e30PersonaChoice=function(el){
    if(!COL.active)return;
    var value=el.getAttribute('data-persona');
    var names={single:'تنهایی',couple:'دو نفره',family:'خانواده',roommates:'هم خانه'};
    if(!names[value])return;
    ceSend(names[value]);
  };
  CBACT.e30PersonaSkip=function(){if(COL.active)ceSend('رد')};
  CBACT.e30UseKnown=function(){
    if(!COL.active)return;
    if(COL.wf==='rent'&&(!getF('budget_dep')||!getF('budget_rent'))){
      toast('برای جست‌وجوی دقیق، ابتدا ودیعه و اجاره را مشخص کن.');return;
    }
    usrC('با اطلاعات فعلی ادامه بده');
    /* Explicit opt-out: do not recreate the same optional questionnaire in the
       deterministic hand-off after the user has asked for recommendations. */
    COL.skipOptionalToHoods=true;
    missing(COL.wf).forEach(function(item){
      if(!FL[item.id].fin)markUnknown(item.id);
    });
    COL.expecting=null;saveCollector();
    complete();
  };

  function scenarioCard(wf){
    var presets={
      rent:[['budget','پیدا کردن بهترین گزینه با بودجه‌ام'],['family','محلهٔ مناسب خانواده'],['compare','مقایسهٔ قیمت محله‌ها']],
      buy:[['budget','بهترین گزینه با بودجه‌ام'],['settle','خرید برای سکونت'],['compare','مقایسهٔ محله‌ها']],
      sell:[['fast','فروش سریع‌تر'],['value','فروش با بهترین قیمت'],['compare','بررسی قیمت منطقه']],
      invest:[['income','درآمد از اجاره'],['growth','رشد ارزش ملک'],['safety','حفظ ارزش سرمایه']]
    };
    var items=presets[wf];if(!items)return false;
    botC('می‌تونم چند مسیر متناسب با هدفت پیشنهاد بدم. کدام برایت مهم‌تر است؟'+
      '<div class="e30-persona-card" role="group" aria-label="انتخاب مسیر گفتگو">'+
      items.map(function(o){return '<button type="button" data-cba="e30ChooseScenario" data-scenario="'+o[0]+'">'+esc(o[1])+'</button>'}).join('')+
      '<p class="e30-footnote">می‌توانی به‌جای دکمه‌ها خواسته‌ات را آزادانه بنویسی.</p></div>',null);
    return true;
  }

  function askNext(){
    if(!COL.active)return;
    if(COL.optional){optionalHub();return}
    if(COL.confirming&&(/financial|contradiction|final/.test(COL.confirming.type)))return;
    if(financialPending()){promptFinancial();return}
    if(hardContradiction()){promptContradiction();return}
    var wf=COL.wf;
    var m=missing(wf);
    var cl=needClarify();
    /* high-impact missing questions come first; the «نوساز» clarification waits its turn (§4.8 order) */
    if(cl&&(!m.length||m[0].w<9)){
      var f=fMeta(cl);f._clar=true;
      botC(ASK[cl].q[0],null);
      COL.confirming={type:'clarify',id:cl};
      saveCollector();
      return;
    }
    if(!m.length){complete();return}
    var top=m[0],a=ASK[top.id];
    if(wf==='rent'&&(top.id==='budget_dep'||top.id==='budget_rent')){budgetCard();return}
    if(wf==='rent'&&top.id==='household'){personaCard();return}
    var p=personaOf(wf),tone=P_TONE[p]||P_TONE.general;
    var q=a.q[Math.floor(Math.random()*a.q.length)];
    botC(tone.q+q+(a.why?'<div class="note" style="margin-top:4px">'+esc(a.why)+'</div>':''),null);
    COL.expecting=top.id;
    saveCollector();
    try{a11yify($('#v-landing')||document.body)}catch(e){}
  }
  function financialPending(){
    return COL.wf==='rent'&&!COL.finConfirmed&&!!getF('budget_dep')&&!!getF('budget_rent');
  }
  function promptFinancial(){
    var dep=getF('budget_dep'),r=getF('budget_rent');
    if(!dep||!r)return;
    var dr=dep.open?'بدون سقف':(dep.v?rial(dep.v[0])+(dep.v[1]!==dep.v[0]?' تا '+rial(dep.v[1]):''):'نامعلوم');
    var rr=r.open?'بدون سقف':(r.v?rial(r.v[0])+(r.v[1]!==r.v[0]?' تا '+rial(r.v[1]):''):'نامعلوم');
    COL.confirming={type:'financial'};COL.expecting=null;
    botC('تأیید مالی ضروری است: ودیعه <b>'+esc(dr)+'</b> و اجارهٔ ماهانه <b>'+esc(rr)+
      '</b>. لطفاً «درسته» را بفرستید؛ برای تغییر هر مقدار بنویسید «اصلاح ودیعه» یا «اصلاح اجاره». تا تأیید شما ادامه نمی‌دهم.',null);
    saveCollector();
  }
  function hardContradiction(){
    return getF('prop_new')==='new'&&isHard('prop_new')&&getF('prop_age')!==null&&getF('prop_age')>5;
  }
  function promptContradiction(){
    if(!hardContradiction())return;
    COL.confirming={type:'contradiction'};COL.expecting=null;
    botC('تناقضی در شرایط ملک دیدم: «نوساز» و «حداکثر عمر '+fa(getF('prop_age'),0)+
      ' سال» هم‌زمان ثبت شده‌اند. «فقط نوساز» یا «تا '+fa(getF('prop_age'),0)+' سال» را انتخاب کنید؛ تا روشن شدن این شرط جست‌وجو را ادامه نمی‌دهم.',null);
    saveCollector();
  }

  /* value clarification for «نوساز» (§4.4 example) */
  function clarify(text){
    var nt=nz(text);
    if(/الزامی نیست|ضروری نیست|اجباری نیست|ترجیحی|بهتره|خوبه|خوب است/.test(nt)){
      setF('prop_new','preferred',{src:'clarify',soft:true});return true;
    }
    if(/الزامی|فقط نوساز|حتماً نوساز|حتما نوساز|کاملاً/.test(nt)){
      setF('prop_new','new',{src:'clarify',hard:true});fMeta('prop_new')._clar=true;
      setF('prop_age',3,{src:'clarify',hard:true});return true;
    }
    if(/تا ۵|تا 5|پنج سال|زیر پنج|۵ سال|5 سال/.test(nt)){setF('prop_age',5,{src:'clarify',hard:true});return true}
    if(/بازسازی|باز ساز/.test(nt)){setF('prop_age',10,{src:'clarify',hard:true});setF('renov_ok','yes',{src:'clarify',soft:true});return true}
    if(/مهم نیست|فرقی ندارد|فرقی نداره/.test(nt)){markUnknown('prop_age');markUnknown('prop_new');return true}
    return false;
  }

  /* parse an answer for a specific expected field */
  function answer(id,text){
    var nt=nz(text),t=String(text||'');
    evidence(t);
    /* explicit skip is ALWAYS allowed — financials included; the deterministic step
       will still offer «بدون سقف» later, so nothing is silently defaulted (§2.1).
       «رد» must be standalone — it is a substring of «میلیارد». */
    if(/مهم نیست|فرقی نداره|فرقی ندارد|بی ?خیال|نمی ?دانم|نمی ?دونم|فعلاً نه|فعلا نه|(^|\s)رد(\s|$|[.,!؟])/.test(nt)&&!/بدون سقف|نامحدود/.test(nt)){
      markUnknown(id);return {ok:true,skip:true};
    }
    switch(id){
      case 'budget_dep': case 'budget_rent': case 'buy_budget': case 'invest_capital': case 'expected_price': case 'min_price':{
        if(/بدون سقف|نامحدود|سقف ندار/.test(nt)&&id!=='min_price'){setF(id,{open:true},{src:'answer',fin:true});return {ok:true}}
        /* two-amount sentence while a financial slot is expected → capture its own share */
        var fs2=finScan(t);
        if(id==='budget_dep'&&fs2.dep){setF(id,{v:fs2.dep},{src:'answer',fin:true});return {ok:true}}
        if(id==='budget_rent'&&fs2.rent){setF(id,{v:fs2.rent},{src:'answer',fin:true});return {ok:true}}
        /* If the user explicitly distinguished two named financial slots,
           a missing slot is a clarification request, never an invitation
           to sum both values as a single deposit or rent. */
        if(/ودیعه|رهن|پول جلو/.test(nt)&&/اجاره|کرایه|ماهی|ماهانه/.test(nt))return {ok:false};
        var clean=stripFin(t);
        var r=parseMoneyRangeFA(clean);
        if(r&&r.ok){var p=r.value.split('|');setF(id,{v:[+p[0],+p[1]]},{src:'answer',fin:true});return {ok:true}}
        var m=parseMoneyFA(normHalf(clean));
        if(m&&m.ok){setF(id,{v:[m.value,m.value]},{src:'answer',fin:true});return {ok:true}}
        var s1=segMoney(t);
        if(s1){setF(id,{v:s1},{src:'answer',fin:true});return {ok:true}}
        return {ok:false};
      }
      case 'household':{
        if(/تنهایی|فقط خودم/.test(nt)){setF('household','single',{src:'answer'});return {ok:true}}
        if(/هم ?خانه|هم ?خونه|همخانه|هم ?اتاق/.test(nt)){setF('household','roommates',{src:'answer'});return {ok:true}}
        if(/زوج|دو نفره|دو نفر|من و همسر|من و خانم|من و اقام|تازه ازدواج/.test(nt)){setF('household','couple',{src:'answer'});return {ok:true}}
        if(/خانواده|بچه|فرزند|سه نفر|چهار نفر|پنج نفر/.test(nt)){setF('household','family',{src:'answer'});var fm=parseCountFA(nt);if(fm&&fm.ok&&fm.value>=3)setF('family_members',fm.value,{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'work_loc': case 'uni_loc': case 'hood':{
        var hl=(typeof HOODS!=='undefined')?HOODS:[],i;
        if(/فرقی نداره|فرق ندارد|هر جا|هرجا/.test(nt)){markUnknown(id);return {ok:true,skip:true}}
        for(i=0;i<hl.length;i++){if(t.indexOf(hl[i].n)>=0){setF(id,hl[i].id,{src:'answer',hard:id!=='hood'});return {ok:true}}}
        return {ok:false};
      }
      case 'work_weight':{
        if(/کار|هر دو.*کار|کار مهم/.test(nt)&&!/دانشگاه/.test(nt)){setF('work_weight','work',{src:'answer'});return {ok:true}}
        if(/دانشگاه/.test(nt)&&!/کار/.test(nt)){setF('work_weight','uni',{src:'answer'});return {ok:true}}
        if(/هر دو|برابر|یکسان/.test(nt)){setF('work_weight','both',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'prop_new':{
        if(/الزامی نیست|ضروری نیست|اجباری نیست|ترجیح|خوبه|بهتره/.test(nt)){
          setF('prop_new','preferred',{src:'answer',soft:true});return {ok:true};
        }
        if(/الزامی|فقط نوساز|حتما/.test(nt)){
          setF('prop_new','new',{src:'answer',hard:true});fMeta('prop_new')._clar=true;
          setF('prop_age',3,{src:'answer',hard:true});return {ok:true};
        }
        if(/تا ۵|تا 5|پنج سال|۵ سال|5 سال/.test(nt)){setF('prop_new','recent',{src:'answer'});setF('prop_age',5,{src:'answer',hard:true});return {ok:true}}
        if(/مهم نیست|فرقی/.test(nt)){markUnknown('prop_new');return {ok:true,skip:true}}
        return {ok:false};
      }
      case 'prop_age': case 'rooms': case 'm2': case 'prop_area': case 'prop_rooms': case 'family_members':{
        var c=parseCountFA(stripFin(t));
        if(c&&c.ok&&c.value>0&&c.value<2000){setF(id,c.value,{src:'answer',hard:id==='prop_age'});return {ok:true}}
        return {ok:false};
      }
      case 'budget_scope':{
        if(/خود ملک|سقف ملک|فقط ملک|خودِ ملک|خانه|خرید ملک/.test(nt)&&!/کل|جانبی|جمع/.test(nt)){setF('budget_scope','property',{src:'answer'});return {ok:true}}
        if(/کل|جانبی|جمع|همه هزینه|با هزینه/.test(nt)){setF('budget_scope','total',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'purpose':{
        if(/سرمایه|سود|اجاره بدهم|درآمد/.test(nt)){setF('purpose','invest',{src:'answer'});return {ok:true}}
        if(/سکونت|زندگی|خودم/.test(nt)){setF('purpose','residence',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_objective':{
        if(/اجاره|اجاره‌ای|rental/.test(nt)&&/سود|درآمد|هدف/.test(nt)){setF('invest_objective','rent_income',{src:'answer'});return {ok:true}}
        if(/حفظ ارزش|تورم/.test(nt)){setF('invest_objective','inflation_hedge',{src:'answer'});return {ok:true}}
        if(/رشد|بزرگ|بالا بره/.test(nt)){setF('invest_objective','appreciation',{src:'answer'});return {ok:true}}
        if(/زمین/.test(nt)){setF('invest_objective','land_bank',{src:'answer'});return {ok:true}}
        if(/فروش|کوتاه/.test(nt)){setF('invest_objective','resale',{src:'answer'});return {ok:true}}
        if(/تجاری|مغازه|دفتر/.test(nt)){setF('invest_objective','commercial',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_horizon':{
        var yrs=nt.match(/(\d+)\s*سال/),num=yrs?+yrs[1]:
          (/ده\s*سال/.test(nt)?10:/پنج\s*سال/.test(nt)?5:/سه\s*سال/.test(nt)?3:/دو\s*سال/.test(nt)?2:/یک\s*سال/.test(nt)?1:null);
        if((num!==null&&num<=2)||/کوتاه/.test(nt)){setF('invest_horizon','کوتاه‌مدت',{src:'answer'});return {ok:true}}
        if((num!==null&&num>=10)||/بلند/.test(nt)){setF('invest_horizon','بلندمدت',{src:'answer'});return {ok:true}}
        if((num!==null&&num>=3&&num<10)||/میان/.test(nt)){setF('invest_horizon','میان‌مدت',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_liquidity':{
        if(/سریع|بالا|مهم/.test(nt)){setF('invest_liquidity','بالا',{src:'answer',hard:true});return {ok:true}}
        if(/مهم نیست|فرقی|بلند/.test(nt)){setF('invest_liquidity','مهم نیست',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'invest_risk':{
        if(/بی ?ریسک|کم |محافظه/.test(nt)){setF('invest_risk','کم',{src:'answer'});return {ok:true}}
        if(/بالاست|زیاد|قبول/.test(nt)){setF('invest_risk','بالا',{src:'answer'});return {ok:true}}
        if(/متوسط|وسط/.test(nt)){setF('invest_risk','متوسط',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'ownership':{
        if(/ارث/.test(nt)){setF('ownership','inherited',{src:'answer'});return {ok:true}}
        if(/مشاع|شریک|مشترک/.test(nt)){setF('ownership','joint',{src:'answer'});return {ok:true}}
        if(/شخصی|تک ?برگ|سند دارم/.test(nt)){setF('ownership','single',{src:'answer'});setF('docs','سند تک‌برگ',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'docs':{
        if(/تک ?برگ/.test(nt)){setF('docs','سند تک‌برگ',{src:'answer'});return {ok:true}}
        if(/رهن|ماده ?۱۰۰|ماده 100|مدیرتبع|منگنه/.test(nt)){setF('docs','رهن/مادهٔ ۱۰۰',{src:'answer'});return {ok:true}}
        if(/ورث|ارث/.test(nt)){setF('docs','ورثه‌ای',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'sale_motivation':{
        if(/مهاجرت/.test(nt)){setF('sale_motivation','مهاجرت',{src:'answer'});return {ok:true}}
        if(/تعویض|بزرگ ?تر|ارتفاع/.test(nt)){setF('sale_motivation','تعویض ملک',{src:'answer'});return {ok:true}}
        if(/نقد|پول نیاز|نیاز مالی/.test(nt)){setF('sale_motivation','نقد شدن',{src:'answer'});return {ok:true}}
        var free=t.replace(/^\s+|\s+$/g,'');setF('sale_motivation',free,{src:'answer'});return {ok:true};
      }
      case 'sale_urgency':{
        if(/عجله ندارم|عجله نداریم|فوری نیست/.test(nt)){setF('sale_urgency','maxvalue',{src:'answer'});return {ok:true}}
        if(/فوری|سریع|عجله|زود(تر)?( بفروشم| فروش)?/.test(nt)){setF('sale_urgency','fast',{src:'answer',hard:true});return {ok:true}}
        if(/حداکثر|قیمت بهتر|منتظر/.test(nt)){setF('sale_urgency','maxvalue',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'prefs':{
        if(extractPrefs(nt,'answer'))return {ok:true};
        if(/مهم نیست|هیچی|ندارم|نه/.test(nt)){markUnknown('prefs');return {ok:true,skip:true}}
        return {ok:false};
      }
      case 'listing_intent':{
        if(/اقامت|کوتاه|شبانه/.test(nt)){setF('listing_intent','stay',{src:'answer'});return {ok:true}}
        if(/مشاوره|قیمت|ارزش/.test(nt)&&!/آگهی/.test(nt)){setF('listing_intent','price',{src:'answer'});return {ok:true}}
        if(/مسکونی|آگهی|اجاره|معمولی/.test(nt)){setF('listing_intent','res',{src:'answer'});return {ok:true}}
        return {ok:false};
      }
      case 'timeline':{
        if(/مهم نیست|فرقی ندارد|فرقی نداره/.test(nt)){markUnknown(id);return {ok:true,skip:true}}
        var free2=t.replace(/^\s+|\s+$/g,'');setF('timeline',free2,{src:'answer'});return {ok:true};
      }
    }
    return {ok:false};
  }

  /* contradiction detection: a new answer clashing with a confirmed field */
  function contradictions(id){
    var out=[];
    if(id==='prop_age'&&isHard('prop_age')&&getF('prop_new')==='new'&&isHard('prop_new')&&getF('prop_age')>5){
      out.push('قبلاً «نوساز» را مهم گفته بودید؛ حالا حداکثر عمر '+fa(getF('prop_age'),0)+' سال ثبت شد — همین را ثبت کنم یا نوساز همچنان الزامی است؟');
    }
    return out;
  }

  /* per-turn feed: returns true if consumed */
  function feed(text){
    if(!COL.active)return false;
    if(COL.optional)return feedOptional(text);
    var t=String(text),nt=nz(t);
    if(/^\s*(منو|راهنما|لغو|بستن|انصراف)\s*$/.test(nt)){usrC(t);stop();botC('جمع‌بندی همین‌جا نگه داشته شد — هر وقت خواستید دوباره شروع کنید. چیزی از دست نرفته است.',null);return true}
    usrC(t);
    COL.turns++;
    /* mid-flow meta-questions get a brief honest answer, then the flow resumes (§4.6) */
    if(/کلید چیست|کلید چیه|کلید چطور|چند کلید|بنا چیست|بنا چیه|بنا چطور|چند بنا|موجودی|شارژ/.test(nt)){
      var bal=S.tokens||0;
      botC('کلید اعتبار سامانه برای سرویس‌های پیشرفته است. هزینهٔ هر خدمت پیش از اجرا نمایش داده می‌شود و فقط با تأیید شما کسر خواهد شد. موجودی: '+fa(bal,0)+' کلید. مدیریت اعتبار از منوی حساب در پایین سایدبار در دسترس است.',null);
      var expq=COL.expecting,aq=ASK[expq];
      if(COL.wf==='rent'&&(expq==='budget_dep'||expq==='budget_rent'))budgetCard();
      else if(aq)botC(aq.q[0],null);
      else if(COL.confirming&&COL.confirming.type==='financial')promptFinancial();
      else if(COL.active&&!COL.expecting)scenarioCard(COL.wf);
      return true;
    }
    /* explicit fix mode */
    if(COL.fix){
      var id=COL.fix;COL.fix=null;
      if(/پاک کن|حذف/.test(nt)){markUnknown(id);profileCard();saveCollector();askNext();return true}
      var r=answer(id,t);
      if(r.ok){
        botC('اصلاح شد ✓',null);
        if(id==='budget_dep'||id==='budget_rent'){COL.finConfirmed=false;COL.confirming=null;promptFinancial()}
        else{profileCard();saveCollector();askNext()}
      }
      else botC('متوجه مقدار نشدم — دوباره بنویسید یا «رد» بفرستید.',null);
      return true;
    }
    if(COL.confirming&&COL.confirming.type==='financial'){
      if(/^(درسته|درست است|اوکی|بله|تایید|تأیید|همینه|همین است|صحیح)$/i.test(nt.trim())){
        COL.finConfirmed=true;COL.finPrompted=true;COL.confirming=null;
        ['budget_dep','budget_rent'].forEach(function(id){var f=fMeta(id);if(f)f.requiresConfirmation=false});
        persist();saveCollector();botC('✓ هر دو مبلغ با تأیید شما ثبت شد.',null);askNext();return true;
      }
      if(/اصلاح|تغییر|اشتباه|غلط|نه/.test(nt)){
        var isDep=/ودیعه|رهن|پول جلو/.test(nt),isRent=/اجاره|کرایه|ماهانه|ماهی/.test(nt);
        if(isDep||isRent){
          var editId=isDep?'budget_dep':'budget_rent';
          var edited=answer(editId,t);
          if(edited.ok){COL.confirming=null;promptFinancial();return true}
          COL.fix=editId;
          botC('مبلغ صحیح «'+esc(SLOT_LABEL[editId])+'» را بنویسید؛ تا اصلاح، ادامه نمی‌دهیم.',null);
        }else botC('کدام مبلغ نیاز به اصلاح دارد؟ «اصلاح ودیعه» یا «اصلاح اجاره» را بنویسید.',null);
        saveCollector();return true;
      }
      var otherFacts=extract(t,'turn');
      if(otherFacts){
        COL.confirming=null;
        personaTurn();
        botC('نکتهٔ جدید ثبت شد؛ تأیید مالی هنوز باقی است.',null);
        promptFinancial();
      }else botC('برای ادامه تأیید صریح لازم است: «درسته» یا «اصلاح ودیعه» / «اصلاح اجاره».',null);
      return true;
    }
    if(COL.confirming&&COL.confirming.type==='contradiction'){
      if(/فقط نوساز|نوساز الزامی|همان نوساز|حتما نوساز/.test(nt)){
        setF('prop_age',3,{src:'resolution',hard:true});
      }else if(/سال|عمر|حداکثر|جدید|نوساز مهم نیست/.test(nt)){
        setF('prop_new','recent',{src:'resolution'});
      }else{
        botC('لطفاً یکی را مشخص کنید: «فقط نوساز» یا «تا '+fa(getF('prop_age'),0)+' سال».',null);return true;
      }
      COL.confirming=null;botC('تعارض برطرف شد ✓',null);saveCollector();askNext();return true;
    }
    /* clarification answer pending */
    if(COL.confirming&&COL.confirming.type==='clarify'){
      COL.confirming=null;
      if(clarify(t)){botC('ثبت شد ✓',null);saveCollector();askNext();return true}
      /* not a clarity answer → treat as free extraction and keep going */
      extract(t,'turn');
      askNext();return true;
    }
    /* 1) multi-slot extraction — catch everything given */
    var found=extract(t,'turn');
    /* 2) answer for the currently expected slot */
    var exp=COL.expecting,res=null;
    if(exp){
      res=answer(exp,t);
      if(res.ok){
        if(res.skip)COL.skipCount=(COL.skipCount||0)+1;
        if(!res.skip&&FL[exp].fin){
          /* financial values are read back explicitly — never silent (§2.1) */
          botC('ثبت شد: <b>'+esc(show(exp,getF(exp)))+'</b>',null);
        }
        COL.expecting=null;
        if(res.skip&&COL.skipCount>=8){
          /* Avoid trapping an unsure user in an endless questionnaire. Keep
             every unprovided field explicitly unknown; never invent money. */
          missing(COL.wf).forEach(function(item){markUnknown(item.id)});
          botC('چند مورد را نامشخص گذاشتید. اطلاعاتی را حدس نمی‌زنم؛ می‌توانید آن‌ها را در مرحلهٔ بعد تکمیل کنید.',null);
          saveCollector();complete();return true;
        }
      }else if((exp==='work_loc'||exp==='uni_loc'||exp==='hood')&&/نزدیک|حوالی|سمت|محله|محدوده|منطقه/.test(nt)){
        /* honest handling of areas outside the sample dataset (§ honesty rules) */
        var names=(typeof HOODS!=='undefined')?HOODS.map(function(h){return h.n}).join('، '):'';
        botC('«'+esc(t.replace(/نزدیک|حوالی|به|در|سمت|من|کارم|دانشگاهم|محلم|می‌خوام|میخوام/g,'').replace(/^\s+|\s+$/g,''))+'» در دادهٔ نمونهٔ سامانه نیست — محله‌های نمونه: '+esc(names)+'. از این‌ها کدام به منطقهٔ موردنظرتان نزدیک‌تر است؟ (یا بنویسید «مهم نیست»)',null);
        return true;
      }
    }
    /* 3) contradiction surfacing */
    var cons=exp?contradictions(exp):[];
    if(cons.length||hardContradiction()){promptContradiction();return true}
    /* 4) dynamic persona check (§6.1) — announce reprioritization once per change */
    personaTurn();
    /* 5) ack + summary + next single question (§4.6) */
    var ack=SUM.turn();
    var p=personaOf(COL.wf);
    if(ack)botC(ack,null);
    /* 6) if both rent financials now known → confirm both explicitly */
    if(financialPending()){promptFinancial();return true}
    saveCollector();
    askNext();
    return true;
  }
  COL._lastExpect=null;
  var _lastPersona=null;
  function personaTurn(){
    var p=personaOf(COL.wf);
    if(_lastPersona&&_lastPersona!==p&&COL.wf){
      _lastPersona=p;
      botC('با این حرف‌هایتان، تصویرم از شرایط شما عوض شد — اولویت سؤال‌ها را هم بر همان اساس مرتب می‌کنم.',null);
    }else if(!_lastPersona)_lastPersona=p;
  }
  function stop(){COL={active:false,wf:null,fix:null,confirming:null,turns:0};saveCollector()}
  function reset(){stop();useChat(null);saveCollector()}

  /* ── completion: profile card → explicit confirm → hand-off (§4.7) ── */
  function complete(){
    var wf=COL.wf;
    /* a pending inference-clarification resolves BEFORE the final card (§4.4) */
    var cl=needClarify();
    if(cl){
      var f=fMeta(cl);f._clar=true;
      botC(ASK[cl].q[0],null);
      COL.confirming={type:'clarify'};
      saveCollector();
      return;
    }
    if(financialPending()){promptFinancial();return}
    if(hardContradiction()){promptContradiction();return}
    profileCard();
    botC('اگر همه‌چیز درست است بنویسید <b>«درسته»</b> — یا هر موردی را اصلاح کنید.',null);
    COL.confirming={type:'final'};
    saveCollector();
  }
  function profileCard(){
    var c=ctx().fields,keys=[],k;
    for(k in c){if(c[k]&&c[k].status!=='unknown'&&c[k].v!==null)keys.push(k)}
    if(!keys.length)return;
    var h='<div class="e30-profcard"><b>آن‌چه تا الان از شرایطتان فهمیدم</b>';
    keys.forEach(function(id){
      h+='<div class="prow"><span>'+esc(SLOT_LABEL[id]||id)+':</span><b>'+esc(show(id,c[id].v))+
        (c[id].status==='inferred'?' <small>برداشت غیرقطعی؛ نیازمند تأیید</small>':'')+
        (c[id].requiresConfirmation?' <small>در انتظار تأیید</small>':'')+
        ' <span class="pact" data-cba="e30fix" data-slot="'+qesc(id)+'">اصلاح</span></b></div>';
    });
    h+='</div>';
    botC(h,null);
    try{a11yify($('#v-landing')||document.body)}catch(e){}
  }
  CBACT.e30fix=function(el){
    var slot=el.getAttribute('data-slot');
    if(!COL.active)COL={active:true,wf:COL.wf||guessWf(),fix:null,confirming:null,turns:0};
    COL.fix=slot;COL.confirming=null;saveCollector();
    botC('مقدار جدید برای «'+esc(SLOT_LABEL[slot]||slot)+'» را بنویسید (یا «پاک کن»):',null);
  };
  function guessWf(){return COL.wf||'rent'}

  /* ── hand-off to deterministic engine — only confirmed values, never defaults ── */
  function handoff(){
    var wf=COL.wf,d=COL;stop();
    botC('عالی — جمع‌بندی کامل شد. می‌رویم سراغ گزینه‌ها:',null);
    try{
      if(wf==='rent'){
        ceStart('rent');
        var D=wd('rent').data;defP(D);
        var dep=getF('budget_dep'),rent=getF('budget_rent');
        if(dep&&dep.v){D.B=D.B||{inc:1500000000,depB:15000000000,rentB:0,chg:50000000,incr:100000000};D.B.depB=dep.v[1];D.depOpen=!!dep.open;D._depSet=1}
        if(rent&&rent.v){D.B=D.B||{inc:1500000000,depB:15000000000,rentB:0,chg:50000000,incr:100000000};D.B.rentB=rent.v[1];D.rentBOpen=!!rent.open;D._rentbSet=1}
        /* persona-driven priorities — from the DYNAMIC persona (§2.7 fix) */
        var p=personaOf('rent'),P=D.P;
        if(p==='family'){P.school=5;P.quiet=4;P.metro=2;P.work=3;if(D.P.park!==true&&isFav('parking'))P.park=true}
        else if(p==='couple'){P.quiet=3;P.work=4;P.metro=3}
        else if(p==='student'){P.metro=5;P.school=1;P.work=4}
        else if(p==='retiree'){P.quiet=5;P.school=1;P.work=1}
        else {P.metro=4;P.work=4;P.school=2}
        P.persona=({family:'خانواده',couple:'دو نفره',student:'دانشجو/کاری',retiree:'موقت',roommates:'دانشجو/کاری'})[p]||''; /* unknown must not become an assumed student */
        var v;
        if((v=getF('rooms'))!=null)P.beds=+v;
        if((v=getF('m2'))!=null)P.minM2=+v;
        if((v=getF('prop_age'))!=null){P.maxAge=+v;P._ageHard=true}
        else if(getF('prop_new')==='new'&&isHard('prop_new')){P.maxAge=3;P._ageHard=true}
        else if(getF('prop_new')==='new'||getF('prop_new')==='preferred'){P.maxAge=30;P._ageHard=false;P._preferNew=true} /* soft preference, never silently harden */
        else{P.maxAge=30;P._ageHard=false} /* «مهم نیست» → wide, soft */
        (getF('prefs')||[]).forEach(function(x){
          if(x==='elevator')P.elev=true;else if(x==='parking')P.park=true;
          else if(x==='metro')P.metro=5;else if(x==='quiet')P.quiet=5;
          else if(x==='balcony')P.balc=true;else if(x==='storage')P.storage=true;
        });
        P.prefRules=Object.assign({},getF('prefRules')||{});
        /* Persona may suggest accessible amenities for ranking, but cannot
           silently convert an inferred need into a mandatory listing filter.
           Respect even an explicit 'irrelevant' or 'forbidden' user answer. */
        if(p==='retiree'&&!Object.prototype.hasOwnProperty.call(P.prefRules,'elevator')){
          P.prefRules.elevator='preferred';
          P._personaElevatorSuggested=true;
        }
        var floorRule=getF('floor_preference');
        if(floorRule){P._floorRange=floorRule;if(floorRule.level==='required')P.requiredFloor={min:floorRule.min,max:floorRule.max}}
        var w=getF('work_weight');
        if(w==='work'&&getF('work_loc'))P.work=5;
        if(w==='uni'&&getF('uni_loc'))P.work=5;
        if(w==='both'){P.work=4;P.metro=4} /* equal weight → balanced access (§4.8) */
        if(getF('commute_max'))P._commuteMax=getF('commute_max');
        D._e30=1;save();
        /* jump to the first missing REQUIRED step — financial never skipped (§2.1) */
        if(!dep||!dep.v)ceJump('dep');
        else if(!rent||!rent.v)ceJump('rentb');
        else if(d.skipOptionalToHoods){
          var chosenHood=getF('hood');
          if(chosenHood){D.hood=chosenHood;ceJump('mk')}
          else ceJump('hoods');
        }
        else ceJump('imps');
        try{E30.flowsAPI.syncStage()}catch(e){}
        return true;
      }
      if(wf==='buy'){
        ceStart('buy');
        var D2=wd('buy').data;defP(D2);defPR(D2);
        var bud=getF('buy_budget');
        if(bud&&bud.v){
          D2.budg=bud.v[1];D2.budgOpen=!!bud.open;D2._budgSet=1;
          /* §8.1: if the stated number covers the WHOLE transaction, keep a labeled
             ~5% side-cost allowance so total(m2×ppm) stays inside real capacity */
          if(getF('budget_scope')==='total'){
            D2.budgIncSide=true;
            /* The user's actual taxes/fees/financing were never supplied. We
               cannot invent a uniform 5% deduction from the declared budget. */
            D2.costBudgetUnknown=true;
            botC('بودجهٔ کل معامله را ثبت کردم؛ مبلغ هزینه‌های جانبی هنوز مشخص نیست. فعلاً درصدی را خودسرانه کسر نمی‌کنم و نتایج نیازمند بازبینی هزینهٔ واقعی انتقال‌اند.',null);
          }
        }
        if(getF('purpose')==='invest'){D2.P.metro=2;D2.P.school=2;D2.P.work=2}
        var v2;
        if((v2=getF('rooms'))!=null)D2.PR.beds=+v2;
        if((v2=getF('m2'))!=null)D2.PR.m2=[+v2,Math.max(+v2+30,120)];
        if((v2=getF('prop_age'))!=null)D2.PR.age=[0,+v2];
        if(getF('prop_new')==='new'||getF('prop_new')==='preferred'){
          if(isHard('prop_new'))D2.PR.age=[0,3];
          else D2.PR._preferNew=true;
        }
        (getF('prefs')||[]).forEach(function(x){
          if(x==='elevator')D2.PR.elev='yes';else if(x==='parking')D2.PR.park='yes';
          else if(x==='balcony')D2.PR.balc='yes';
        });
        D2.PR.prefRules=getF('prefRules')||{};
        var floorBuy=getF('floor_preference');
        if(floorBuy){D2.PR._floorRange=floorBuy;if(floorBuy.level==='required')D2.PR.requiredFloor={min:floorBuy.min,max:floorBuy.max}}
        D2._e30=1;save();
        if(!bud||!bud.v)ceJump('budg');else ceJump('imps');
        return true;
      }
      if(wf==='sell'){
        ceStart('sell');
        var D3=wd('sell').data;
        ['prop_area','prop_rooms','sale_urgency'].forEach(function(id){var v3=getF(id);if(v3!=null)D3[id]=v3});
        var hp=getF('hood');if(hp)D3.hood=hp;
        var ep=getF('expected_price');if(ep&&ep.v)D3.expected=ep.v[0];
        var mp=getF('min_price');if(mp&&mp.v)D3.minprice=mp.v[0];
        var own=getF('ownership');if(own)D3.ownership=own;
        var dc=getF('docs');if(dc)D3.docs=dc;
        var mo=getF('sale_motivation');if(mo)D3.motivation=mo;
        D3._e30=1;save();
        ceJump('s_own');
        return true;
      }
      if(wf==='invest'){
        ceStart('invp');
        var D4=wd('invp').data;
        var ob=getF('invest_objective');if(ob)D4.objective=ob;
        var cap=getF('invest_capital');if(cap&&cap.v)D4.cap=cap.v[1];
        var hz=getF('invest_horizon');if(hz)D4.horizon=hz;
        var lq=getF('invest_liquidity');if(lq)D4.liquidity=lq;
        var rk=getF('invest_risk');if(rk)D4.risk=rk;
        var hp2=getF('hood');if(hp2)D4.hood=hp2;
        D4._e30=1;save();
        ceJump('i_obj');
        return true;
      }
      if(wf==='landlord'){
        ceStart('lndl');
        var D5=wd('lndl').data;
        var kind=getF('listing_intent');if(kind==='stay'||kind==='price'||kind==='res')D5.ltype=kind;
        var lhood=getF('hood');if(lhood)D5.hood=lhood;
        var la=getF('prop_area');if(la!=null){D5.area=+la;D5.m2=+la}
        var lp=getF('expected_price');if(lp&&lp.v)D5.ask_price=lp.v[0];
        D5._e30=1;save();
        ceJump('l_role');
        return true;
      }
    }catch(e){console.error('E30 handoff',e)}
    return true;
  }
  function isFav(x){return (getF('prefs')||[]).indexOf(x)>=0}

  /* final-confirm watcher: «درسته» after profile card → handoff */
  function maybeFinal(text){
    if(!(COL.active&&COL.confirming&&COL.confirming.type==='final'))return false;
    var nt=nz(text);
    if(/درسته|درست است|درست فع|اوکی|باشه|تأیید|تایید|همینه|همین/.test(nt)){
      usrC(text);
      if(financialPending()){promptFinancial();return true}
      if(hardContradiction()){promptContradiction();return true}
      handoff();return true;
    }
    COL.confirming=null;saveCollector();
    return false;
  }

  /* ── intent routing for free-form openings (§4.2) — before any fixed flow ── */
  function route(text,raw){
    if(!S.auth)return false;
    var t=raw||text;
    if(COL.active){
      if(maybeFinal(t))return true;
      if(feed(t))return true;
      return false;
    }
    var nt=nz(t);
    var wantsRealEstate=/خونه|خانه|ملک|آپارتمان|اجاره|کرایه|رهن|خرید|بخرم|بخریم|می ?خریم|فروش|بفروشم|سرمایه ?گذاری|زمین|مغازه|سویییت|سوئیت|موجر|مستأجر دارم|مستاجر دارم/.test(nt);
    if(!wantsRealEstate)return false;
    if(!/می ?خوام|می ?خواهم|می ?خوایم|می ?خواهیم|دنبال|اجاره ? نشین|هستم|هستیم|دارم|داریم|سالمه|سالانه|باید|لازم|زوج|خانواده|دانشجو|هم ?خونه|کمک|پیدا|پیشنهاد|مقایسه|بهترین گزینه/.test(nt)&&!getF('household'))return false;
    /* paid-service intents take precedence */
    if(/تحلیل (جامع )?محله/.test(nt)&&CE.f!=='rent'&&CE.f!=='buy'){return false} /* leave to flow/service */
    var intent=null;
    if(/اجاره\s*(?:بدم|بدیم|می ?دم|می ?دیم|دادن)|اجاره ?گذاری|موجر|مستأجر دارم|مستاجر دارم/.test(nt)&&
       /ملکم|ملکمو|ملک خودم|مالک|موجر|اجاره بدم|اجاره می ?دم|مستأجر دارم|مستاجر دارم/.test(nt))intent='landlord';
    else if(/فروش|بفروشم|می ?فروشم|فروشنده/.test(nt)&&!/خرید|بخرم|اجاره/.test(nt))intent='sell';
    else if(!excludesInvestment(nt)&&(/سرمایه ?گذاری|سود|بخرم.*اجاره بدهم|حفظ ارزش/.test(nt)||(BUY_VERB.test(nt)&&/سرمایه/.test(nt)&&!/نه.*سرمایه/.test(nt))))intent='invest';
    else if(/اجاره ? می ?دم|موجر|مستأجر دارم|مستاجر دارم/.test(nt))intent='landlord';
    else if(/اجاره|کرایه|استیجار|رهن/.test(nt))intent='rent';
    else if(BUY_VERB.test(nt)||/مبایعه/.test(nt))intent='buy';
    else if(/دنبال|نیاز|می ?خوام|می ?خواهم/.test(nt)&&
       /سوییت|سویییت|سوئیت|خانه|خونه|آپارتمان/.test(nt)&&
       /دانشجو|هم ?خانه|هم ?خونه|خوابگاه|پول پیش|ودیعه|اجاره ماهانه/.test(nt)){
      /* Reasonable but non-binding interpretation: a student seeking a room or
         house with roommates is likely renting. Clarify it in natural language
         before any financial commitment; never treat it as a confirmed fact. */
      intent='rent';
      botC('از توضیحتان برداشت کردم دنبال اجاره هستید؛ اگر منظورتان خرید است، همان‌جا بگویید تا مسیر را عوض کنیم.',null);
    }
    if(!intent)return false;
    usrC(t);
    extract(t,'open'); /* harvest the opening message (§4.2) */
    _lastPersona=null;
    return start(intent,false,/بودجه|هزینه|قیمت|پول پیش|ودیعه|رهن|ماهی|ماهانه|بهترین گزینه/.test(nt));
  }

  E30.discAPI={route:route,active:active,start:start,stop:stop,reset:reset,bindChat:bindChat,useChat:useChat,forgetChat:forgetChat,resume:resume,
    getF:getF,setF:setF,ctx:ctx,personaOf:personaOf,preference:preference,collector:function(){return COL},
    profileCard:profileCard,missing:missing,show:show,markUnknown:markUnknown,SLOT_LABEL:SLOT_LABEL,
    extract:extract,answer:answer};
  E30._dbg={normHalf:normHalf,segMoney:segMoney,finScan:finScan}; /* unit-debug surface */
  return E30.discAPI;
})();

/* A stated preference influences ordering, but never silently excludes listings.
   Hard requirements are enforced by rentPass/buyPass, not by the score. */
E30.softPreferenceBonus=function(x,P){
  if(!x||!P)return 0;
  var pref=P.prefRules||{},n=0;
  if(pref.parking==='preferred'&&x.park)n+=4;
  if(pref.elevator==='preferred'&&x.elev)n+=4;
  if(pref.balcony==='preferred'&&x.balc)n+=3;
  if(pref.storage==='preferred'&&x.storage)n+=2;
  if(P._preferNew&&typeof x.age==='number'&&x.age<=5)n+=5;
  var fl=P._floorRange;
  if(fl&&fl.level==='preferred'&&typeof x.floor==='number'&&
     (fl.min==null||x.floor>=fl.min)&&(fl.max==null||x.floor<=fl.max))n+=4;
  return n;
};
(function(){
  if(typeof lscore==='function'&&!lscore._e30Soft){
    var baseLscore=lscore;
    lscore=function(x,D){return Math.min(98,baseLscore(x,D)+E30.softPreferenceBonus(x,D&&D.P))};
    lscore._e30Soft=true;
  }
  if(typeof bScore==='function'&&!bScore._e30Soft){
    var baseBscore=bScore;
    bScore=function(x,D){return Math.min(98,baseBscore(x,D)+E30.softPreferenceBonus(x,D&&D.PR))};
    bScore._e30Soft=true;
  }
})();
