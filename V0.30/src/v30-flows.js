/* ═══════════════ V0.30 — E30 FLOWS: sale workflow, investment workflow, strict filters,
   stage sync, slider locking. Extends the deterministic SCRIPTS registry (no parallel engine).
   ═══════════════ */
E30.flows=(function(){
  /* ── strict filter helpers (§7.1 / §2.2 / §2.3) ──
     Hard constraints NEVER return a violating listing as a match. */
  function rentPass(x,D){
    if(!x||!D)return false;
    var P=D.P||{},R=P.requirements||{},pref=P.prefRules||{};
    if(D.hood&&x.hood&&x.hood!==D.hood)return false;
    var beds=P.bedsNum!==undefined&&P.bedsNum!==''?Number(P.bedsNum):Number(P.beds||0);
    if(beds>0&&x.beds<beds)return false;
    if((P.elev===true||P.elev==='yes'||R.elevator==='required'||pref.elevator==='required')&&!x.elev)return false;
    if((P.park===true||P.park==='yes'||R.parking==='required'||pref.parking==='required')&&!x.park)return false;
    if((P.balc===true||P.balc==='yes'||R.balcony==='required'||pref.balcony==='required')&&!x.balc)return false;
    if((R.storage==='required'||pref.storage==='required')&&!x.storage)return false;
    if(pref.elevator==='forbidden'&&x.elev)return false;
    if(pref.parking==='forbidden'&&x.park)return false;
    if(pref.balcony==='forbidden'&&x.balc)return false;
    /* Every explicit maximum age is hard unless the collector deliberately marked it soft. */
    if(P._ageHard!==false&&Number.isFinite(Number(P.maxAge))&&P.maxAge!==''&&P.maxAge!=null&&x.age>Number(P.maxAge))return false;
    if(P.minM2!==''&&P.minM2!=null&&Number(P.minM2)>0&&x.m2<Number(P.minM2))return false;
    var exactFloor=P.floorNum!==undefined&&P.floorNum!==''&&P.floorNum!==null?Number(P.floorNum):null;
    if(exactFloor!==null&&Number.isFinite(exactFloor)&&x.floor!==exactFloor)return false;
    if(exactFloor===null&&P.floor==='low'&&!(x.floor>=1&&x.floor<=3))return false;
    if(exactFloor===null&&P.floor==='high'&&!(x.floor>=4))return false;
    if(P.requiredFloor&&(x.floor<P.requiredFloor.min||x.floor>P.requiredFloor.max))return false;
    if(R.floor&&R.floor.type==='range'&&(x.floor<R.floor.min||x.floor>R.floor.max))return false;
    if(D.B&&!D.rentBOpen&&D.B.rentB!==undefined&&D.B.rentB!==null&&Number(D.B.rentB)>=0&&x.rent>Number(D.B.rentB))return false;
    if(D.B&&!D.depOpen&&D.B.depB!==undefined&&D.B.depB!==null&&Number(D.B.depB)>=0&&x.dep>Number(D.B.depB))return false;
    return true;
  }
  /* total price = m2 × ppm — enforced against the confirmed budget (§8.1 / §2.3) */
  function buyPass(x,D){
    if(!x||!D)return false;
    if(!blPassBase(x,D))return false;
    if(D.hood&&x.hood&&D.hood!==x.hood)return false;
    if(D.budg>0&&!D.budgOpen){
      var tot=x.m2*x.ppm;
      if(tot>D.budg)return false;
    }
    return true;
  }
  function blPassBase(x,D){ /* original blPass logic — kept intact under the E30 override */
    var P=D.PR||{},pref=P.prefRules||{},age=P.age||[0,100],size=P.m2||[0,1e5],ppm=P.ppm||[0,Infinity],floors=P.floorR||[0,100];
    if(x.age<age[0]||x.age>age[1])return false;
    if(x.m2<size[0]||x.m2>size[1])return false;
    if(x.ppm<ppm[0]||x.ppm>ppm[1])return false;
    if(x.floor<floors[0]||x.floor>floors[1])return false;
    if(P.requiredFloor&&(x.floor<P.requiredFloor.min||x.floor>P.requiredFloor.max))return false;
    if(P.beds>0&&x.beds<P.beds)return false;
    if((P.elev==='yes'||pref.elevator==='required')&&!x.elev)return false;
    if((P.park==='yes'||pref.parking==='required')&&!x.park)return false;
    if((P.balc==='yes'||pref.balcony==='required')&&!x.balc)return false;
    if(pref.storage==='required'&&!x.storage)return false;
    if(pref.elevator==='forbidden'&&x.elev)return false;
    if(pref.parking==='forbidden'&&x.park)return false;
    if(pref.balcony==='forbidden'&&x.balc)return false;
    return true;
  }

  /* ── stage sync (§2.4): conversation step ⇄ workflow state ⇄ persistence ⇄ library ⇄ resume ── */
  function syncStage(){
    try{
      if(!CE.f||CE.f==='gate')return;
      var w=wd(CE.f);
      if(!w)return;
      var sc=SCRIPTS[CE.f];
      var target=(CE.i>=sc.length)?sc.length:(CE.i+1);
      if(w.step!==target){w.step=target;save()}
      if(w.m===undefined)w.m=CE.f;
    }catch(e){}
  }

  /* ── slider locking (§2.5): a committed slider freezes; edit only via بازگشت/اصلاح ── */
  function lockSliders(){
    try{
      var boxes=[document.getElementById('chatB'),document.getElementById('fchB'),document.getElementById('dashB')];
      boxes.forEach(function(b){
        if(!b||!b.offsetParent)return;
        var msgs=b.querySelectorAll('.msg.bot');
        if(!msgs.length)return;
        /* every bot bubble except the last one: sliders are read-only history */
        for(var i=0;i<msgs.length-1;i++){
          var sl=msgs[i].querySelectorAll('.rsld');
          Array.prototype.forEach.call(sl,function(s){lockOne(s,true)});
        }
        /* last bubble: only locked if this step was already committed (committed marker) */
        var D=(CE.f&&SCRIPTS[CE.f])?wd(CE.f).data:null;
        var lastSl=msgs[msgs.length-1].querySelectorAll('.rsld');
        Array.prototype.forEach.call(lastSl,function(s){
          var slot=s.getAttribute('data-slot');
          if(D&&D._slid&&D._slid[slot])lockOne(s,false);
        });
      });
    }catch(e){}
  }
  function lockOne(s,hard){
    if(s.getAttribute('data-locked')==='1')return;
    s.setAttribute('data-locked','1');
    var inp=s.querySelector('input[type=range]');
    if(inp)inp.disabled=true;
    var b=s.querySelector('[data-cba="slSet"]');
    if(b){b.disabled=true;b.textContent='✓ ثبت شد';}
    if(hard){
      var hint=s.querySelector('.cwr-hint');
      if(hint)hint.textContent='این مقدار ثبت شده است — برای تغییر از «بازگشت» یا «اصلاح» استفاده کنید.';
    }
  }
  /* slSet guard: refuse when the slider is locked or already committed for this slot */
  function slGuard(el){
    var rid=el.getAttribute('data-rsld-for'),r=rid?document.getElementById(rid):null;
    if(r&&r.closest('.rsld')&&r.closest('.rsld').getAttribute('data-locked')==='1'){toast('این مقدار ثبت شده است — با «بازگشت» به مرحله برگردید');return false}
    var st=(CE.f&&SCRIPTS[CE.f])?SCRIPTS[CE.f][CE.i]:null;
    var D=(CE.f)?wd(CE.f).data:null;
    if(st&&st.money&&D&&r){
      var slot=r.closest('.rsld').getAttribute('data-slot');
      if(slot&&D._slid&&D._slid[slot]){toast('این مقدار قبلاً ثبت شده است');return false}
    }
    return true;
  }

  /* ═══ SELL — complete seller workflow (spec §9, 19 stages) ═══ */
  function sellCards(D){
    /* neighborhood stats card for the seller */
    var h=findH(D.hood),avg=h.buyBase;
    var est=D.prop_area?Math.round(avg*D.prop_area):0;
    var lo=Math.round(est*0.93),hi=Math.round(est*1.07);
    return '<div class="e30-salestats"><div class="kv"><span>میانگین قیمت هر متر — '+esc(h.n)+' (دادهٔ نمونه)</span><b>'+rial(avg)+'</b></div>'+
      (est?'<div class="kv"><span>برآورد ارزش ملک شما</span><b>'+rial(est)+'</b></div>'+
      '<div class="kv"><span>بازهٔ منطقی اعلام</span><b>'+rial(lo)+' تا '+rial(hi)+'</b></div>':'')+
      '</div>';
  }
  function sellerPrice(D){
    var h=D.hood?findH(D.hood):null,base=h&&D.prop_area?Math.round(h.buyBase*D.prop_area):0;
    return Math.round(base*(D.sale_urgency==='fast'?0.95:1.02));
  }
  function offerAt(D,factor){return Math.round((Number(D.ask)||0)*factor)}
  function offerMeetsFloor(D,amount){return amount>0&&(!Number(D.minprice)||amount>=Number(D.minprice))}
  function sellerContractStatus(D){
    var c=D.ctr,code=D.code||(c&&c.code),list=(S&&S.contracts)||[];
    var internal=list.some(function(e){return e&&e.kind==='buy'&&e.status!=='terminated'&&
      ((D.sellerContractDraft&&e.draftCode===D.sellerContractDraft)||(c&&c.finalized&&code&&e.code===code))});
    if(internal)return 'registered_internal';
    try{var buyer=wd('buy').data,bc=buyer&&buyer.ctr;
      if(D.sellerContractDraft&&bc&&bc.draftCode===D.sellerContractDraft&&bc.step>1)return 'draft';
    }catch(e){}
    if(c&&c.step>1)return 'draft';
    return D.deal?'agreement':'listing';
  }
  var SELL=[
    {id:'s_role',q:'به چه عنوانی ملک را می‌فروشید؟',chips:function(){return [['مالک شخصی','owner'],['نمایندهٔ مالک','agent'],['سازنده','developer'],['وارث','heir']]},
     set:function(D,v){D.sellerRole=v;return null}},
    {id:'s_own',q:'وضعیت مالکیت ملک را دقیق بگویید:',
     chips:function(){return [['سند شخصی دارد','single'],['ارثی است','inherited'],['مشاعی (شرکا دارد)','joint'],['مدیرتبع/رهن','mort']]},
     set:function(D,v){D.ownership=v;if(v==='inherited')D.docs='ورثه‌ای';if(v==='mort')D.docs='رهن/مادهٔ ۱۰۰';if(v==='single')D.docs='سند تک‌برگ';return null}},
    {id:'s_docs',pre:function(D){return D.ownership==='inherited'||D.ownership==='joint'},
     q:function(D){return D.ownership==='inherited'?'انحصار وراثت صادر شده است؟':'توافق همهٔ شرکا را برای فروش دارید؟'},
     chips:function(){return [['بله','yes'],['خیر','no'],['نمی‌دانم','unknown']]},
     set:function(D,v){D.docsOk=v;return null}},
    {id:'s_note',pre:function(D){return D.docsOk==='no'||D.docsOk==='unknown'},
     q:function(D){return 'تا کامل شدن مدارک، فروش فقط به‌صورت «قیمت‌گذاری و آماده‌سازی» پیش می‌رود — معامله رسمی نیازمند سند کامل است. فعلاً ارزیابی و برنامهٔ فروش را می‌چینیم.'},
     chips:function(){return [['متوجهم، ادامه','ok']]},set:function(){return null}},
    {id:'s_area',count:true,q:'متراژ ملک چند متر است؟ (عدد تایپ کنید)',kind:'num',
     set:function(D,v){var n=pd(v);if(!n||n<10||n>5000)return 'ERR';D.prop_area=n;return null},
     err:'متراژ را با عدد بنویسید (مثلاً ۸۵).'},
    {id:'s_rooms',count:true,q:'چند خواب است؟',chips:function(){return [['۰','0'],['۱','1'],['۲','2'],['۳','3'],['۳+','4']]},
     set:function(D,v){D.prop_rooms=+v;return null}},
    {id:'s_age',count:true,q:'عمر بنا؟',chips:function(){return [['نوساز','0'],['تا ۵','5'],['تا ۱۰','10'],['تا ۲۰','20'],['بیشتر','30']]},
     set:function(D,v){D.prop_age=+v;return null}},
    {id:'s_floor',count:true,q:'طبقه چندم است؟',kind:'num',chips:function(){return [['همکف','0'],['۱','1'],['۲','2'],['۳+','3']]},
     set:function(D,v){D.floor=+pd(v)||0;return null}},
    {id:'s_hood',q:'ملک در کدام محله است؟',
     set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله را دقیق بنویسید (مثلاً نارمک) یا از کارت‌ها انتخاب کنید.',
     cards:function(D){defP(D);return HOODS.slice(0,3).map(function(h){return chatHoodCard(h,'buy',D)}).join('')}},
    {id:'s_motiv',q:'انگیزهٔ فروش چیست؟',
     chips:function(){return [['مهاجرت','مهاجرت'],['تعویض ملک','تعویض ملک'],['نقد شدن','نقد شدن'],['ارث','ارث'],['دیگر','دیگر']]},
     set:function(D,v){D.motivation=v;return null}},
    {id:'s_urg',q:'کدام اولویت است؟',
     chips:function(){return [['فروش سریع','fast'],['حداکثر قیمت','maxvalue']]},
     set:function(D,v){D.sale_urgency=v;return null}},
    {id:'s_val',q:function(D){
       var t=sellCards(D);
       return '<b>ارزیابی بازار (بر پایهٔ دادهٔ نمونهٔ سامانه)</b>'+t+'<div class="note">این برآورد از میانگین نمونهٔ آگهی‌های سامانه است — نه کارشناسی رسمی.</div>'},
     chips:function(){return [['ادامه','ok'],['تحلیل جامع محله','!ha']]},
     acts:{ha:function(D){if(window.E30&&D.hood){ACT.hanalysis({getAttribute:function(a){return a==='data-h'?D.hood:(a==='data-m'?'buy':null)}})}}}},
    {id:'s_price',q:function(D){
       return 'قیمت پیشنهادی اعلام: <b>'+rial(sellerPrice(D))+'</b> — '+(D.sale_urgency==='fast'?'(برای فروش سریع‌تر، کمی زیر میانگین)':'(کمی بالای میانگین با مجال مذاکره)')+'. قبول می‌کنید یا عدد خودتان را می‌گویید؟'},
     kind:'num',
     chips:function(){return [['قیمت پیشنهادی را می‌پذیرم','suggested']]},
     set:function(D,v){
       if(v==='suggested'){D.ask=sellerPrice(D);return D.ask>0?null:'ERR'}
       var m=parseMoneyFA(v);
       if(!m||!m.ok){var p2=E27.budgParse(v);if(p2&&p2.ok&&p2.n&&p2.n>0){D.ask=p2.n}else return 'ERR'}
       else D.ask=m.value;
       return null},
     err:'قیمت را به ریال بنویسید (مثلاً «۱۲ میلیارد»).'},
    {id:'s_min',q:'کف قیمت — پایین‌تر از چه مبلغی نمی‌فروشید؟ (برای فیلتر پیشنهادها)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok||m.value<=0||m.value>Number(D.ask||0))return 'ERR';D.minprice=m.value;return null},
     err:'کف قیمت را به ریال بنویسید؛ کف نمی‌تواند از قیمت اعلامی بیشتر باشد.'},
    {id:'s_prep',q:function(D){
       var h=findH(D.hood);
       return '<b>آماده‌سازی آگهی</b><div class="sect">'+
       '<div class="kv"><span>عنوان پیشنهادی</span><b>'+fa(D.prop_rooms||2,0)+' خواب '+fa(D.prop_area||0,0)+' متری، '+esc(h.n)+'</b></div>'+
       '<div class="kv"><span>نکات برجسته</span><b>'+(D.prop_age===0?'نوساز':fa(D.prop_age||0,0)+' سال ساخت')+(D.floor?'، طبقهٔ '+fa(D.floor,0):'')+'</b></div>'+
       '<div class="kv"><span>قیمت اعلامی</span><b>'+rial(D.ask||0)+'</b></div></div>این آگهی را تأیید می‌کنید؟'},
     chips:function(){return [['تأیید آگهی','!ok'],['تغییر قیمت','!rp']]},
     acts:{ok:function(D){D.approved=true;save();botC('✓ آگهی در وضعیت «آمادهٔ انتشار» ثبت شد. (انتشار واقعی نیازمند بک‌اند است — در سامانهٔ داخلی ثبت شد)',null);ceJump('s_inq')},rp:function(){ceJump('s_price')}}},
    {id:'s_inq',q:function(D){var amount=offerAt(D,0.96);return 'شبیه‌سازی ورود پیشنهاد خریدار: <b>'+rial(amount)+'</b> (۴٪ زیر قیمت اعلامی). '+(!offerMeetsFloor(D,amount)?'<b>این پیشنهاد زیر کف قیمت تعیین‌شدهٔ شماست و قابل پذیرش مستقیم نیست.</b> ':'')+'با این پیشنهاد چه می‌کنید؟'},
     chips:function(D){var c=[['رد پیشنهاد','!no'],['مذاکره','!neg']];if(offerMeetsFloor(D,offerAt(D,0.96)))c.push(['قبول پیشنهاد','!yes']);return c},
     acts:{
       no:function(D){botC('پیشنهاد زیر کف شما رد شد — آگهی سر جای خودش می‌ماند.',null);ceJump('s_done')},
       neg:function(D){var c=offerAt(D,0.97);if(!offerMeetsFloor(D,c)){c=Number(D.minprice);botC('پیشنهاد متقابل روی کف مجاز شما — '+rial(c)+' — ثبت شد. پذیرش طرف مقابل صرفاً در این شبیه‌سازی فرض می‌شود.',null)}else botC('پیشنهاد متقابل '+rial(c)+' (تقریباً ۳٪ زیر قیمت) ثبت شد. پذیرش طرف مقابل صرفاً در این شبیه‌سازی فرض می‌شود.',null);D.deal=c;ceJump('s_ctr')},
       yes:function(D){var c=offerAt(D,0.96);if(!offerMeetsFloor(D,c)){botC('این مبلغ زیر کف قیمت شماست؛ توافق ثبت نشد. لطفاً رد یا مذاکره را انتخاب کنید.',null);return}D.deal=c;botC('با پیشنهاد خریدار — '+rial(c)+' — در شبیه‌سازی توافق اولیه شد ✓',null);ceJump('s_ctr')}
     }},
    {id:'s_ctr',q:function(D){return 'قرارداد مبایعه‌نامه را در همین گفت‌وگو تنظیم می‌کنیم. '+(sellerContractStatus(D)==='registered_internal'?'قرارداد داخلی ثبت شده و می‌توانید به جمع‌بندی بروید.':'توافق اولیه هنوز به معنی ثبت قرارداد نیست.')},
     chips:function(){return [['باز کردن فرم قرارداد','!open'],['بررسی وضعیت قرارداد','!status'],['خروج با وضعیت توافق اولیه','!later']]},
     set:function(){return null},
     acts:{open:function(D){
       var old=wd('buy').data.ctr;
       if(D.sellerContractDraft&&old&&old.draftCode!==D.sellerContractDraft){botC('پیش‌نویس مبایعه‌نامهٔ مربوط به این فروش با قرارداد فعال متفاوت است؛ برای جلوگیری از اتصال اشتباه، قرارداد فعلی باز نشد.',null);return}
       if(!D.sellerContractDraft&&old&&old.finalized){botC('یک قرارداد خرید دیگر قبلاً در سامانه ثبت شده است. برای جلوگیری از اتصال اشتباه، ابتدا یک فلو خرید تازه ایجاد کنید.',null);return}
       E28.ctrStart('buy');
       var bc=wd('buy').data.ctr;
       if(bc&&bc.draftCode){D.sellerContractDraft=bc.draftCode;save()}
     },status:function(D){if(sellerContractStatus(D)==='registered_internal'){ceJump('s_done');return}botC('ثبت نهایی قرارداد داخلی هنوز تأیید نشده است. پس از تأیید طرفین و ثبت داخلی، همین‌جا دوباره «بررسی وضعیت قرارداد» را بزنید.',null)},later:function(){ceJump('s_done')}}},
    {id:'s_done',q:function(D){
       var d=wd('sell');
       var status=sellerContractStatus(D),statusText=status==='registered_internal'?'قرارداد داخلی امضاشده — انتقال رسمی باید خارج از سامانه پیگیری شود':status==='draft'?'قرارداد در مرحلهٔ پیش‌نویس':status==='agreement'?'توافق اولیهٔ شبیه‌سازی‌شده — قرارداد ثبت نشده':'آگهی آمادهٔ انتشار — فروش نهایی نشده';
       var completed=status==='registered_internal',changed=d.done!==completed||D._saleLastStatus!==statusText;
       d.done=completed;
       if(!D.saleReqId){D.saleReqId=addReq('sell','فروش','فروش ملک — '+(D.hood?findH(D.hood).n:'')+' '+fa(D.prop_area||0,0)+' متری',statusText,D.deal?rial(D.deal):'');changed=true}
       else if(changed&&typeof setReq==='function')setReq(D.saleReqId,statusText);
       if(changed){D._saleLastStatus=statusText;save()}
       return '<b>جمع‌بندی فروش</b><div class="sect">'+
       '<div class="kv"><span>وضعیت</span><b>'+statusText+'</b></div>'+
       (D.deal?'<div class="kv"><span>قیمت نهایی</span><b>'+rial(D.deal)+'</b></div>':'')+
       '<div class="kv"><span>مرحلهٔ انتقال</span><b>'+(status==='registered_internal'?'انتقال رسمی تأیید نشده':D.ownership==='single'?'هنوز انجام نشده':'نیازمند تکمیل مدارک')+'</b></div></div>'},
     chips:function(){return [['بررسی مجدد قرارداد','!status'],['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]},
     acts:{status:function(D){if(sellerContractStatus(D)==='registered_internal'){wd('sell').done=true;if(D.saleReqId&&typeof setReq==='function')setReq(D.saleReqId,'قرارداد داخلی امضاشده — انتقال رسمی تأیید نشده');save();botC('قرارداد داخلی ثبت شده است؛ انتقال رسمی هنوز نیازمند پیگیری است.',null)}else botC('قرارداد داخلی هنوز ثبت نشده است. برای تکمیل، از مراحل قبلی وارد فرم قرارداد شوید.',null)}},
     set:function(){return null}}
  ];

  /* ═══ INVEST — dedicated investment workflow (spec §10) ═══ */
  function yieldRow(label,val,cls){return '<div class="kv"><span>'+label+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+val+'</b></div>'}
  function investCard(D){
    D=D||{};
    var all=(HOODS||[]).filter(function(x){return x&&x.buyBase>0});
    var h=D.hood?findH(D.hood):all.slice().sort(function(a,b){return a.buyBase-b.buyBase})[0];
    if(!h)return '<div class="note">دادهٔ نمونه‌ای برای تحلیل وجود ندارد. ارزیابی قابل ارائه نیست.</div>';
    var objective=D.objective||'unknown',asset=D.assetType||((objective==='land_bank')?'land':objective==='commercial'?'commercial':'residential');
    var area=Math.max(1,Number(D.prop_area)||70),cap=Number(D.cap)||0;
    var benchmark=Math.round(h.buyBase*area);
    var maxArea=cap>0?Math.floor(cap/h.buyBase):null;
    var affordable=cap>0&&cap>=benchmark;
    var selectedLabel={residential:'آپارتمان مسکونی',land:'زمین',commercial:'ملک تجاری',development:'پروژهٔ ساخت'}[asset]||'نوع نامشخص';
    var mismatch=(objective==='land_bank'&&asset!=='land')||(objective==='commercial'&&asset!=='commercial')||(objective==='development'&&asset!=='development');
    var hLabel=D.hood?esc(h.n):esc(h.n)+' (صرفاً نمونهٔ مقایسه‌ای؛ انتخاب همهٔ شهر نیست)';
    var out='<div class="e30-investcard">'+
      yieldRow('هدف سرمایه‌گذاری',esc(({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش در برابر تورم',land_bank:'نگهداری زمین',resale:'فروش کوتاه‌مدت',commercial:'درآمد تجاری',development:'ساخت و توسعه',diversification:'تنوع سبد'})[objective]||'نامشخص'))+
      yieldRow('دارایی مطلوب',selectedLabel)+
      yieldRow('سرمایهٔ اعلامی',cap>0?rial(cap):'هنوز مشخص نشده')+
      yieldRow('افق سرمایه‌گذاری',esc(D.horizon||'نامشخص'))+
      yieldRow('نقدشوندگی موردنیاز',esc(({all:'نقدشوندگی زیاد',some:'دسترسی به بخشی از سرمایه',long:'قفل بلندمدت پذیرفتنی'})[D.liquidity]||'تعیین نشده'))+
      yieldRow('تحمل ریسک',esc(({low:'کم',medium:'متوسط',high:'زیاد'})[D.risk]||'تعیین نشده'))+
      yieldRow('محلهٔ مبنای نمونه',hLabel);
    if(mismatch)return out+yieldRow('تعارض هدف و دارایی','هدف سرمایه‌گذاری و نوع دارایی انتخابی همخوانی ندارند')+'</div><div class="note">پیش از تفسیر بازده، هدف یا نوع دارایی را اصلاح کنید؛ از این دادهٔ متناقض توصیهٔ مالی ساخته نمی‌شود.</div>';
    if(asset!=='residential'){
      out+=yieldRow('کفایت داده برای این دارایی','دادهٔ تخصصی قیمت/اجاره موجود نیست')+
        '</div><div class="note">برای '+selectedLabel+'، اعداد اجاره و رشد آپارتمان مسکونی قابل تعمیم نیستند؛ بنابراین بازده ساختگی نمایش داده نمی‌شود. ارزیابی نیازمند اطلاعات قیمت، مجوز، کاربری، سند، هزینه و نقدشوندگی همان دارایی است.</div>';
      return out;
    }
    out+=yieldRow('ارزش نمونهٔ آپارتمان '+fa(area,0)+' متری',rial(benchmark))+
      yieldRow('حداکثر متراژ نظری با سرمایهٔ موجود',maxArea===null?'نامشخص':fa(Math.max(0,maxArea),0)+' متر (قبل از هزینه‌های جانبی)');
    if(cap>0&&!affordable){
      out+=yieldRow('کسری سرمایه برای همین نمونه',rial(benchmark-cap),'down')+
        '</div><div class="note">سرمایهٔ فعلی برای نمونهٔ '+fa(area,0)+' متری کافی نیست. این نمایش پیشنهاد خرید یا توصیه به دریافت وام نیست؛ قبل از محاسبهٔ بازده، نوع دارایی یا مبلغ سرمایه باید اصلاح شود.</div>';
      return out;
    }
    var rentM=Math.round(h.avgRent*0.9),gross=benchmark?rentM*12/benchmark*100:0;
    var vacant=8,maintenance=6; /* scenario assumptions, not market facts */
    var net=rentM*12*(1-(vacant+maintenance)/100);
    var noi=benchmark?net/benchmark*100:0;
    var target=Number(D.expectedCash)||0;
    out+=yieldRow('اجارهٔ ماهانهٔ تخمینی نمونه',rial(rentM))+
      yieldRow('جریان نقدی خالص سالانهٔ فرضی',rial(Math.round(net)))+
      yieldRow('بازده ناخالص سالانهٔ نمونه',fa(Math.round(gross*10)/10,1)+'٪')+
      yieldRow('بازده خالص سناریویی (۸٪ خالی + ۶٪ نگهداری)',fa(Math.round(noi*10)/10,1)+'٪')+
      yieldRow('جریان خالص در سناریوی خالی‌بودن ۲۰٪',rial(Math.round(rentM*12*(1-(20+maintenance)/100))))+
      yieldRow('هدف درآمد ماهانهٔ کاربر',target>0?rial(target):'تعیین نشده')+
      yieldRow('هزینه‌های نقل‌وانتقال و تأمین مالی','محاسبه نشده؛ دادهٔ کافی موجود نیست')+
      yieldRow('رشد تاریخی یک‌سالهٔ دادهٔ نمونه',typeof h.mkt.yoy==='number'?pct(h.mkt.yoy):'ناموجود');
    if(target>0)out+=yieldRow('انطباق هدف درآمد',rentM*(1-(vacant+maintenance)/100)>=target?'در نمونهٔ فرضی قابل تحقق است':'نمونهٔ فعلی به هدف درآمد نمی‌رسد');
    if(D.liquidity==='all')out+=yieldRow('هشدار نقدشوندگی','نیاز شما به نقدشوندگی بالا با دارایی ملکی سازگار نیست','down');
    if(D.financing==='mixed')out+=yieldRow('تأمین مالی با وام','اقساط و بهره نامشخص است؛ بازده پس از بدهی محاسبه نشده','down');
    if(D.management==='none')out+=yieldRow('هزینهٔ مدیریت','زمان مدیریت ندارید؛ حق‌الزحمهٔ مدیر هنوز در محاسبه منظور نشده','down');
    if(D.objective==='resale'&&D.horizon==='کوتاه‌مدت')out+=yieldRow('ریسک فروش زودهنگام','هزینهٔ معامله، مالیات و دورهٔ فروش نامشخص است','down');
    return out+'</div><div class="note">تمام قیمت‌ها و رشدهای نمایش‌داده‌شده دادهٔ <b>نمونه</b> هستند. کسری سرمایه و سناریوی جریان نقد با فرض‌های آشکار محاسبه شده است؛ پیش‌بینی قیمت، توصیهٔ خرید یا تضمین بازده نیست.</div>';
  }
  var INVP=[
    {id:'i_obj',q:'هدف اصلی سرمایه‌گذاری چیست؟',
     chips:function(){return [['درآمد اجاره','rent_income'],['رشد قیمت','appreciation'],['حفظ ارزش (تورم)','inflation_hedge'],['زمین','land_bank'],['فروش کوتاه‌مدت','resale'],['تجاری','commercial']]},
     set:function(D,v){D.objective=v;return null}},
    {id:'i_cap',money:true,q:'سرمایه‌ای که می‌خواهید وارد کنید حدوداً چقدر است؟ (ریال)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.cap=m.value;return null},
     err:'سرمایه را به ریال بنویسید (مثلاً «۱۰ میلیارد»).'},
    {id:'i_liq',pre:function(D){return !!D.cap},
     q:'چقدر از این مبلغ باید در دسترس بماند؟ (ملک به‌سرعت نقد نمی‌شود)',
     chips:function(){return [['همه‌اش آزاد باشد','all'],['بخشی کافی است','some'],['قفل بلندمدت اوکی است','long']]},
     set:function(D,v){D.liquidity=v;if(v==='all')botC('با این شرط، ملک گزینهٔ پرریسکی است — در تحلیل لحاظش می‌کنم.',null);return null}},
    {id:'i_hor',q:'افق سرمایه‌گذاری؟',
     chips:function(){return [['۲–۳ سال','کوتاه‌مدت'],['۵ سال','میان‌مدت'],['۱۰ سال+','بلندمدت']]},
     set:function(D,v){D.horizon=v;return null}},
    {id:'i_risk',q:'در صورت افت موقت ارزش دارایی چه مقدار ریسک می‌پذیرید؟',
     chips:function(){return [['ریسک کم','low'],['ریسک متوسط','medium'],['ریسک زیاد','high']]},
     set:function(D,v){D.risk=v;return null}},
    {id:'i_asset',q:'چه نوع ملکی را برای سرمایه‌گذاری ترجیح می‌دهید؟',
     chips:function(){return [['آپارتمان مسکونی','residential'],['زمین','land'],['تجاری','commercial'],['پروژهٔ ساخت','development']]},
     set:function(D,v){D.assetType=v;return null}},
    {id:'i_fin',q:'منبع سرمایه چیست؟',chips:function(){return [['سرمایهٔ شخصی','cash'],['بخشی وام یا تسهیلات','mixed'],['هنوز مشخص نیست','unknown']]},
     set:function(D,v){D.financing=v;return null}},
    {id:'i_income',q:'برای درآمد اجاره، ماهانه چه مبلغی مدنظرتان است؟ (اگر فقط رشد قیمت مهم است «مهم نیست»)',kind:'num',
     chips:function(){return [['مهم نیست','none']]},
     set:function(D,v){if(v==='none'){D.expectedCash=null;return null}var p=parseMoneyFA(v);if(!p||!p.ok||p.value<0)return 'ERR';D.expectedCash=p.value;return null},err:'عدد درآمد ماهانه را به ریال وارد کنید یا «مهم نیست» را بزنید.'},
    {id:'i_mgmt',q:'برای نگهداری و مدیریت ملک چقدر وقت می‌گذارید؟',
     chips:function(){return [['خودم مدیریت می‌کنم','self'],['مدیر/مشاور می‌گیرم','delegate'],['زمان ندارم','none']]},
     set:function(D,v){D.management=v;return null}},
    {id:'i_exit',q:'اگر نیاز به خروج از سرمایه‌گذاری داشتید، برنامهٔ شما چیست؟',
     chips:function(){return [['فروش ملک','sell'],['نگهداری بلندمدت','hold'],['هنوز تصمیم ندارم','unknown']]},
     set:function(D,v){D.exitStrategy=v;return null}},
    {id:'i_hood',q:'دامنهٔ جست‌وجو؟ (محله خاص یا «کل شهر»)',
     set:function(D,v){if(/همه|کل/.test(v)){D.hood=null;return null}var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله یا «کل شهر» را بنویسید.'},
    {id:'i_an',q:function(D){return '<b>تحلیل مقدماتی سرمایه‌گذاری (رایگان، نمونه)</b>'+investCard(D)+(D.objective==='land_bank'?'<div class="note">برای زمین: وضعیت کاربری و سند باید به‌طور مستقل استعلام شود — محلینو مشاور حقوقی نیست.</div>':'')},
     chips:function(){return [['ثبت تحلیل در کتابخانه','!save'],['محلهٔ دیگر','!oh'],['پایان','!end']]},
     acts:{
       save:function(D){
         var html='<h4>تحلیل سرمایه‌گذاری</h4>'+investCard(D);
         var it=E29.libAPI.saveArtifact({type:'invest',title:'تحلیل سرمایه‌گذاری — '+(D.hood?findH(D.hood).n:'کل شهر'),
           summary:'هدف: '+({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش سریع',commercial:'تجاری'})[D.objective||'']+' — بازده بر پایهٔ دادهٔ نمونه',
           artifact:{html:html,data:{objective:D.objective,cap:D.cap,hood:D.hood,horizon:D.horizon,liquidity:D.liquidity,risk:D.risk,assetType:D.assetType,financing:D.financing,expectedCash:D.expectedCash,management:D.management,exitStrategy:D.exitStrategy}},tokenCost:0,txnId:null});
         botC('✓ در کتابخانه ذخیره شد (بدون هزینه — این تحلیل از دادهٔ نمونهٔ داخلی ساخته می‌شود).',null);
         ceJump('i_done');
       },
       oh:function(){ceJump('i_hood')},
       end:function(){ceJump('i_done')}
     }},
    {id:'i_done',q:function(D){
       var d=wd('invp');
       if(!d.done){d.done=true;addReq('invest','سرمایه‌گذاری','تحلیل سرمایه‌گذاری — '+(D.objective||''),'کامل شد','هدف: '+(D.objective||'—'));save()}
       return 'گردش کار سرمایه‌گذاری تکمیل شد. یادآوری صادقانه: اعداد این تحلیل از <b>دادهٔ نمونهٔ سامانه</b> است و هیچ بازدهی تضمین نمی‌شود.'},
     chips:function(){return [['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]},
     set:function(){return null}}
  ];

  /* ═══ LANDLORD — rental listing workflow (§5.3 «Landlord / rental listing») ═══ */
  var LNDL=[
    {id:'l_role',pre:function(D){return !D.ltype},q:'دقیقاً چه خدمتی برای ملک خود می‌خواهید؟',
     chips:function(){return [['بله، اجارهٔ مسکونی','res'],['اقامتگاه کوتاه‌مدت','stay'],['فقط مشاورهٔ قیمت','price']]},
     set:function(D,v){D.ltype=v;return null}},
    {id:'l_hood',pre:function(D){return !D.hood},q:'ملک در کدام محله است؟',
     set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله را دقیق بنویسید (مثلاً یوسف‌آباد).'},
    {id:'l_advice',pre:function(D){return D.ltype==='price'},q:function(D){
       var h=findH(D.hood);
       return '<b>مشاورهٔ مقدماتی قیمت اجاره — بدون ثبت آگهی</b><div class="sect">'+
       '<div class="kv"><span>محله</span><b>'+esc(h.n)+'</b></div>'+
       '<div class="kv"><span>ودیعهٔ میانگین نمونه</span><b>'+rial(h.avgDep)+'</b></div>'+
       '<div class="kv"><span>اجارهٔ ماهانهٔ میانگین نمونه</span><b>'+rial(h.avgRent)+'</b></div></div>'+
       '<div class="note">این دو رقم از داده‌های نمونهٔ سامانه‌اند؛ ارزیابی شخصی ملک بدون متراژ، سن بنا و امکانات ممکن نیست و هیچ آگهی منتشر نمی‌شود.</div>'},
     chips:function(){return [['ذخیرهٔ نتیجهٔ مشاوره','!save'],['پایان بدون ثبت آگهی','!end']]},
     acts:{save:function(D){addReq('landlord','مشاورهٔ قیمت','بررسی قیمت نمونهٔ '+findH(D.hood).n,'مشاوره انجام شد','هیچ آگهی‌ای ثبت یا منتشر نشده است');D.adviceSaved=true;save();botC('✓ فقط نتیجهٔ مشاورهٔ نمونه ذخیره شد؛ آگهی‌ای ثبت نشد.',null);ceEnd()},end:function(D){D.adviceSaved=false;CE.f=null;save();if(typeof renderChatMeta==='function')renderChatMeta();botC('مشاورهٔ قیمت بدون ثبت آگهی یا درخواست جدید به پایان رسید.',[['منوی اصلی','!menu']])}}},
    {id:'l_price',pre:function(D){return D.ltype==='res'},q:function(D){
       var h=D.hood?findH(D.hood):HOODS[0];
       return 'بازهٔ رایج '+esc(h.n)+' (نمونهٔ سامانه): ودیعه '+rial(h.avgDep)+' با اجارهٔ '+rial(h.avgRent)+'. چه ترکیبی مدنظرتان است؟'},
     kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_dep=m.value;return null},
     err:'ودیعهٔ درخواستی را به ریال بنویسید.'},
    {id:'l_rent',pre:function(D){return D.ltype==='res'},kind:'num',q:'اجارهٔ ماهانهٔ درخواستی؟ (ریال — یا «صفر» برای رهن کامل)',
     set:function(D,v){if(/^(?:صفر|0|۰)$|بدون اجاره/.test(String(v).trim())){D.ask_rent=0;D.zeroRent=true;return null}var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_rent=m.value;D.zeroRent=false;return null},
     err:'اجاره را به ریال بنویسید.'},
    {id:'l_rules',pre:function(D){return D.ltype==='res'},q:'شرط‌های اجاره؟ (چند مورد را با ویرگول بنویسید — یا «ندارد»)',kind:'text',
     set:function(D,v){if(/ندارد|نه/.test(v)){D.rules=[];return null}D.rules=v.split(/[،,]/).map(function(x){return x.replace(/^\s+|\s+$/g,'')}).filter(Boolean);return null}},
    {id:'l_stay_rate',pre:function(D){return D.ltype==='stay'},q:'نرخ پیشنهادی هر شب اقامت چقدر است؟ (ریال)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.nightlyRate=m.value;return null},err:'قیمت هر شب را با مبلغ مشخص و واحد وارد کنید.'},
    {id:'l_stay_capacity',pre:function(D){return D.ltype==='stay'},q:'حداکثر ظرفیت اقامتگاه چند نفر است؟',count:true,
     set:function(D,v){var n=Number(pd(String(v)));if(!Number.isInteger(n)||n<1||n>50)return 'ERR';D.stayCapacity=n;return null},err:'ظرفیت را بین ۱ تا ۵۰ نفر وارد کنید.'},
    {id:'l_stay_min',pre:function(D){return D.ltype==='stay'},q:'حداقل مدت رزرو چند شب است؟',count:true,
     set:function(D,v){var n=Number(pd(String(v)));if(!Number.isInteger(n)||n<1||n>90)return 'ERR';D.minNights=n;return null},err:'مدت اقامت را بین ۱ تا ۹۰ شب بنویسید.'},
    {id:'l_stay_rules',pre:function(D){return D.ltype==='stay'},q:'قوانین اقامت و شرایط پذیرش مهمان را مشخص کنید (یا «ندارد»).',kind:'text',
     set:function(D,v){D.stayRules=/^ندارد$/.test(String(v).trim())?[]:String(v).split(/[،,]/).map(function(x){return x.trim()}).filter(Boolean);return null}},
    {id:'l_sum',q:function(D){
       if(D.ltype==='stay')return '<b>پیش‌نمایش اقامتگاه کوتاه‌مدت</b><div class="sect">'+
         '<div class="kv"><span>محله</span><b>'+esc(D.hood?findH(D.hood).n:'—')+'</b></div>'+
         '<div class="kv"><span>نرخ هر شب</span><b>'+rial(D.nightlyRate||0)+'</b></div>'+
         '<div class="kv"><span>ظرفیت</span><b>'+fa(D.stayCapacity||0,0)+' نفر</b></div>'+
         '<div class="kv"><span>حداقل اقامت</span><b>'+fa(D.minNights||0,0)+' شب</b></div>'+
         '<div class="kv"><span>قوانین</span><b>'+esc((D.stayRules||[]).join('، ')||'ندارد')+'</b></div></div><div class="note">ثبت داخلی به معنی بررسی مجوز، رزرو فعال یا انتشار عمومی نیست.</div>ثبت پیش‌نویس شود؟';
       return '<b>خلاصهٔ آگهی موجر</b><div class="sect">'+
       '<div class="kv"><span>محله</span><b>'+esc(D.hood?findH(D.hood).n:'—')+'</b></div>'+
       '<div class="kv"><span>ودیعهٔ درخواستی</span><b>'+rial(D.ask_dep||0)+'</b></div>'+
       '<div class="kv"><span>اجارهٔ درخواستی</span><b>'+rial(D.ask_rent||0)+'</b></div>'+
       '<div class="kv"><span>شرط‌ها</span><b>'+esc((D.rules||[]).join('، ')||'ندارد')+'</b></div></div>ثبت شود؟'},
     chips:function(){return [['ثبت','!ok'],['ویرایش','!ed']]},
     acts:{ok:function(D){
         if(D.ltype==='stay'&&!(D.nightlyRate>0&&D.stayCapacity>0&&D.minNights>0)){botC('اطلاعات اقامتگاه کامل نیست و هنوز ثبت نشده است.',null);return}
         if(D.ltype==='res'&&!(D.ask_dep>0&&D.ask_rent>=0)){botC('مقادیر ودیعه و اجاره معتبر نیست؛ لطفاً آن‌ها را اصلاح کنید.',null);return}
         D.registered=true;D.listingStatus='draft_internal';save();
         if(D.ltype==='stay')addReq('stay','اقامتگاه کوتاه‌مدت','اقامتگاه — '+(D.hood?findH(D.hood).n:''),'پیش‌نویس داخلی',rial(D.nightlyRate)+' / شب؛ ظرفیت '+fa(D.stayCapacity,0)+' نفر');
         else addReq('rent','آگهی موجر','اجاره‌دهی — '+(D.hood?findH(D.hood).n:''),'پیش‌نویس داخلی',rial(D.ask_dep)+' / '+rial(D.ask_rent));
         botC('✓ پیش‌نویس داخلی ثبت شد. انتشار عمومی، تأیید مجوزها و دریافت رزرو به بک‌اند نیاز دارد؛ هیچ آگهی عمومی فعال نشده است.',null);
         ceEnd()},
       ed:function(D){ceJump(D.ltype==='stay'?'l_stay_rate':'l_price')}}
     }
  ];

  function install(){
    if(!SCRIPTS.buy.some(function(s){return s.id==='buy_ctr'})){
      var ix=SCRIPTS.buy.findIndex(function(s){return s.id==='escA'});
      SCRIPTS.buy.splice(ix,0,{id:'buy_ctr',q:'پیش از تسویه، مبایعه‌نامهٔ داخلی را تکمیل و ثبت کنید. انتقال رسمی سند خارج از سامانه انجام می‌شود.',
        chips:function(){return [['فرم مبایعه‌نامه','!open'],['ادامه پس از ثبت قرارداد','!continue']]},
        acts:{open:function(){E28.ctrStart('buy')},continue:function(D){
          if(!D.ctr||!D.ctr.finalized){botC('ابتدا قرارداد داخلی را با تأیید هر دو طرف ثبت کنید.',null);return}
          ceJump('escA');
        }}});
      SCRIPTS.buy.find(function(s){return s.id==='lg'}).acts.nx=function(){ceJump('buy_ctr')};
    }
    SCRIPTS.sell=SELL;
    SCRIPTS.invp=INVP;
    SCRIPTS.lndl=LNDL;
    if(!MODBY.sell)MODBY.sell={v:'landing',t:'فروش ملک'};
    if(!MODBY.invp)MODBY.invp={v:'landing',t:'سرمایه‌گذاری ملکی'};
    if(!MODBY.lndl)MODBY.lndl={v:'landing',t:'اجاره‌دهی'};
    FRC.sell=['sell'];FRC.invest=['invp','invb','invr'];FRC.rent=['rent','lndl'];
    WSTEPS.sell=SELL.map(function(s){return s.id});
    WSTEPS.invp=INVP.map(function(s){return s.id});
    WSTEPS.lndl=LNDL.map(function(s){return s.id});
    /* registry note for honest provenance labels (srcBadge rule) */
    try{window.__E30FLOWS={sell:SELL.length,invp:INVP.length,lndl:LNDL.length}}catch(e){}
  }

  E30.flowsAPI={rentPass:rentPass,buyPass:buyPass,blPassBase:blPassBase,syncStage:syncStage,
    lockSliders:lockSliders,slGuard:slGuard,install:install,investCard:investCard};
  return E30.flowsAPI;
})();

/* replace the two deterministic hard filters with the strict E30 versions (§2.2, §2.3) */
function blPass(x,D){return window.E30?E30.flowsAPI.buyPass(x,D):E30.flowsAPI.blPassBase(x,D)}
