/* ═══════════════ V0.30 — E30 FLOWS: sale workflow, investment workflow, strict filters,
   stage sync, slider locking. Extends the deterministic SCRIPTS registry (no parallel engine).
   ═══════════════ */
E30.flows=(function(){
  /* ── strict filter helpers (§7.1 / §2.2 / §2.3) ──
     Hard constraints NEVER return a violating listing as a match. */
  function rentPass(x,D){
    var P=D.P||{};
    if(P.beds>0&&x.beds<P.beds)return false;
    if(P.elev&&!x.elev)return false;
    if(P.park&&!x.park)return false;
    if(P._ageHard&&x.age>P.maxAge)return false;
    if(P.minM2&&x.m2<P.minM2)return false;
    if(D.B&&!D.rentBOpen&&D.B.rentB>0&&x.rent>D.B.rentB)return false;
    if(D.B&&!D.depOpen&&D.B.depB>0&&x.dep>D.B.depB)return false;
    return true;
  }
  /* total price = m2 × ppm — enforced against the confirmed budget (§8.1 / §2.3) */
  function buyPass(x,D){
    if(!blPassBase(x,D))return false;
    if(D.budg>0&&!D.budgOpen){
      var tot=x.m2*x.ppm;
      if(tot>D.budg)return false;
    }
    return true;
  }
  function blPassBase(x,D){ /* original blPass logic — kept intact under the E30 override */
    var P=D.PR;
    if(x.age<P.age[0]||x.age>P.age[1])return false;
    if(x.m2<P.m2[0]||x.m2>P.m2[1])return false;
    if(x.ppm<P.ppm[0]||x.ppm>P.ppm[1])return false;
    if(x.floor<P.floorR[0]||x.floor>P.floorR[1])return false;
    if(P.beds>0&&x.beds<P.beds)return false;
    if(P.elev==='yes'&&!x.elev)return false;
    if(P.park==='yes'&&!x.park)return false;
    if(P.balc==='yes'&&!x.balc)return false;
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
  var SELL=[
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
       var h=findH(D.hood),est=D.prop_area?Math.round(h.buyBase*D.prop_area):0;
       return 'قیمت پیشنهادی اعلام: <b>'+rial(Math.round(est*(D.sale_urgency==='fast'?0.95:1.02)))+'</b> — '+(D.sale_urgency==='fast'?'(برای فروش سریع‌تر، کمی زیر میانگین)':'(کمی بالای میانگین با مجال مذاکره)')+'. قبول می‌کنید یا عدد خودتان را می‌گویید؟'},
     kind:'num',
     set:function(D,v){
       var m=parseMoneyFA(v);
       if(!m||!m.ok){var p2=E27.budgParse(v);if(p2&&p2.ok&&p2.n&&p2.n>0){D.ask=p2.n}else return 'ERR'}
       else D.ask=m.value;
       return null},
     err:'قیمت را به ریال بنویسید (مثلاً «۱۲ میلیارد»).'},
    {id:'s_min',q:'کف قیمت — پایین‌تر از چه مبلغی نمی‌فروشید؟ (برای فیلتر پیشنهادها)',kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.minprice=m.value;return null},
     err:'کف قیمت را به ریال بنویسید.'},
    {id:'s_prep',q:function(D){
       var h=findH(D.hood);
       return '<b>آماده‌سازی آگهی</b><div class="sect">'+
       '<div class="kv"><span>عنوان پیشنهادی</span><b>'+fa(D.prop_rooms||2,0)+' خواب '+fa(D.prop_area||0,0)+' متری، '+esc(h.n)+'</b></div>'+
       '<div class="kv"><span>نکات برجسته</span><b>'+(D.prop_age===0?'نوساز':fa(D.prop_age||0,0)+' سال ساخت')+(D.floor?'، طبقهٔ '+fa(D.floor,0):'')+'</b></div>'+
       '<div class="kv"><span>قیمت اعلامی</span><b>'+rial(D.ask||0)+'</b></div></div>این آگهی را تأیید می‌کنید؟'},
     chips:function(){return [['تأیید آگهی','!ok'],['تغییر قیمت','!rp']]},
     acts:{ok:function(D){D.approved=true;save();botC('✓ آگهی در وضعیت «آمادهٔ انتشار» ثبت شد. (انتشار واقعی نیازمند بک‌اند است — در سامانهٔ داخلی ثبت شد)',null);ceJump('s_inq')},rp:function(){ceJump('s_price')}}},
    {id:'s_inq',q:function(D){return 'شبیه‌سازی ورود پیشنهاد خریدار: <b>'+rial(Math.round((D.ask||0)*0.94))+'</b> (۴٪ زیر قیمت اعلامی). با این پیشنهاد چه می‌کنید؟'},
     chips:function(){return [['رد می‌کنم (زیر کف)','!no'],['مذاکره','!neg'],['قبول','!yes']]},
     acts:{
       no:function(D){botC('پیشنهاد زیر کف شما رد شد — آگهی سر جای خودش می‌ماند.',null);ceJump('s_done')},
       neg:function(D){var c=Math.round((D.ask||0)*0.97);botC('پیشنهاد متقاعد '+rial(c)+' اعلام شد (تقریباً ۳٪ زیر قیمت). طرف مقابل می‌پذیرد ✓',null);D.deal=Math.round((D.ask||0)*0.97);ceJump('s_ctr')},
       yes:function(D){var c=Math.round((D.ask||0)*0.94);D.deal=c;botC('با پیشنهاد خریدار — '+rial(c)+' — توافق شد ✓',null);ceJump('s_ctr')}
     }},
    {id:'s_ctr',q:'قرارداد مبایعه‌نامه را در همین گفت‌وگو تنظیم می‌کنیم.',
     chips:function(){return [['باز کردن فرم قرارداد','!open']]},
     set:function(){return null},
     acts:{open:function(D){E28.ctrStart('buy')}}},
    {id:'s_done',q:function(D){
       var d=wd('sell');
       if(!d.done){d.done=true;addReq('sell','فروش','فروش ملک — '+(D.hood?findH(D.hood).n:'')+' '+fa(D.prop_area||0,0)+' متری',D.deal?'توافق شد':'در حال فروش',D.deal?rial(D.deal):'');save()}
       return '<b>جمع‌بندی فروش</b><div class="sect">'+
       '<div class="kv"><span>وضعیت</span><b>'+(D.deal?'توافق شد — قرارداد ثبت گردید':'آگهی فعال — در انتظار خریدار')+'</b></div>'+
       (D.deal?'<div class="kv"><span>قیمت نهایی</span><b>'+rial(D.deal)+'</b></div>':'')+
       '<div class="kv"><span>مرحلهٔ انتقال</span><b>'+(D.ownership==='single'?'سند آمادهٔ انتقال':'نیازمند تکمیل مدارک')+'</b></div></div>'},
     chips:function(){return [['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]},
     set:function(){return null}}
  ];

  /* ═══ INVEST — dedicated investment workflow (spec §10) ═══ */
  function yieldRow(label,val,cls){return '<div class="kv"><span>'+label+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+val+'</b></div>'}
  function investCard(D){
    var h=D.hood?findH(D.hood):HOODS[0];
    var price=D.prop_area?Math.round(h.buyBase*D.prop_area):Math.round(h.buyBase*70);
    var rentM=Math.round(h.avgRent*0.9);
    var gross=price?(rentM*12/price*100):0;
    var maint=6,vac=8; /* labeled assumptions, §10 honesty */
    var net=gross*((100-maint-vac)/100);
    var yoy=h.mkt.yoy;
    var risk=(gross>8?'نسبتاً بالا در این نمونه':'متوسط');
    return '<div class="e30-investcard">'+
      yieldRow('محله (نمونهٔ سامانه)',esc(h.n))+
      yieldRow('سرمایهٔ فرضی — ۷۰ متر',rial(price))+
      yieldRow('اجارهٔ ماهانهٔ تخمینی',rial(rentM))+
      yieldRow('بازده ناخالص سالانه',fa(Math.round(gross*10)/10,1)+'٪',gross>=10?'up':'')+
      yieldRow('بازده خالص (فرض خالی‌بودن ۸٪ + نگهداری ۶٪)',fa(Math.round(net*10)/10,1)+'٪')+
      yieldRow('رشد قیمت یک‌سالهٔ نمونه',pct(yoy),yoy>=0?'up':'down')+
      yieldRow('نقدشوندگی','آپارتمان مسکونی: متوسط؛ زمین: کم')+
      '</div><div class="note">همهٔ اعداد از دادهٔ نمونهٔ سامانه است و «پیش‌بینی» نیست — هیچ بازدهی تضمین نمی‌شود.</div>';
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
    {id:'i_hood',q:'دامنهٔ جست‌وجو؟ (محله خاص یا «کل شهر»)',
     set:function(D,v){if(/همه|کل/.test(v)){D.hood=null;return null}var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله یا «کل شهر» را بنویسید.'},
    {id:'i_an',q:function(D){return '<b>تحلیل سرمایه‌گذاری</b>'+investCard(D)+(D.objective==='land_bank'?'<div class="note">برای زمین: وضعیت کاربری/سند باید خارج از سامانه استعلام شود — محلینو مشاور حقوقی نیست.</div>':'')},
     chips:function(){return [['ثبت تحلیل در کتابخانه','!save'],['محلهٔ دیگر','!oh'],['پایان','!end']]},
     acts:{
       save:function(D){
         var html='<h4>تحلیل سرمایه‌گذاری</h4>'+investCard(D);
         var it=E29.libAPI.saveArtifact({type:'invest',title:'تحلیل سرمایه‌گذاری — '+(D.hood?findH(D.hood).n:'کل شهر'),
           summary:'هدف: '+({rent_income:'درآمد اجاره',appreciation:'رشد قیمت',inflation_hedge:'حفظ ارزش',land_bank:'زمین',resale:'فروش سریع',commercial:'تجاری'})[D.objective||'']+' — بازده بر پایهٔ دادهٔ نمونه',
           artifact:{html:html,data:{objective:D.objective,cap:D.cap,hood:D.hood}},tokenCost:0,txnId:null});
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
    {id:'l_role',q:'می‌خواهید ملکتان را اجاره دهید؟',
     chips:function(){return [['بله، اجارهٔ مسکونی','res'],['اقامتگاه کوتاه‌مدت','stay'],['فقط مشاورهٔ قیمت','price']]},
     set:function(D,v){D.ltype=v;return null}},
    {id:'l_hood',q:'ملک در کدام محله است؟',
     set:function(D,v){var id=hoodFromText(v);if(!id)return 'ERR';D.hood=id;return null},
     err:'نام محله را دقیق بنویسید (مثلاً یوسف‌آباد).'},
    {id:'l_price',q:function(D){
       var h=D.hood?findH(D.hood):HOODS[0];
       return 'بازهٔ رایج '+esc(h.n)+' (نمونهٔ سامانه): ودیعه '+rial(h.avgDep)+' با اجارهٔ '+rial(h.avgRent)+'. چه ترکیبی مدنظرتان است؟'},
     kind:'num',
     set:function(D,v){var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_dep=m.value;return null},
     err:'ودیعهٔ درخواستی را به ریال بنویسید.'},
    {id:'l_rent',kind:'num',q:'اجارهٔ ماهانهٔ درخواستی؟ (ریال — یا «صفر» برای رهن کامل)',
     set:function(D,v){if(/صفر|بدون اجاره/.test(String(v))){D.ask_rent=0;D.zeroRent=true;return null}var m=parseMoneyFA(v);if(!m||!m.ok)return 'ERR';D.ask_rent=m.value;return null},
     err:'اجاره را به ریال بنویسید.'},
    {id:'l_rules',q:'شرط‌های اجاره؟ (چند مورد را با ویرگول بنویسید — یا «ندارد»)',kind:'text',
     set:function(D,v){if(/ندارد|نه/.test(v)){D.rules=[];return null}D.rules=v.split(/[،,]/).map(function(x){return x.replace(/^\s+|\s+$/g,'')}).filter(Boolean);return null}},
    {id:'l_sum',q:function(D){
       return '<b>خلاصهٔ آگهی موجر</b><div class="sect">'+
       '<div class="kv"><span>محله</span><b>'+esc(D.hood?findH(D.hood).n:'—')+'</b></div>'+
       '<div class="kv"><span>ودیعهٔ درخواستی</span><b>'+rial(D.ask_dep||0)+'</b></div>'+
       '<div class="kv"><span>اجارهٔ درخواستی</span><b>'+rial(D.ask_rent||0)+'</b></div>'+
       '<div class="kv"><span>شرط‌ها</span><b>'+esc((D.rules||[]).join('، ')||'ندارد')+'</b></div></div>ثبت شود؟'},
     chips:function(){return [['ثبت','!ok'],['ویرایش','!ed']]},
     acts:{ok:function(D){
         D.registered=true;save();
         addReq('rent','آگهی موجر','اجاره‌دهی — '+(D.hood?findH(D.hood).n:''),'ثبت شد',rial(D.ask_dep||0)+' / '+rial(D.ask_rent||0));
         botC('✓ ثبت شد. (انتشار عمومی نیازمند بک‌اند است — در سامانهٔ داخلی درخواست شما ثبت و قابل پیگیری است)',null);
         ceEnd()},
       ed:function(){ceJump('l_price')}}
     }
  ];

  function install(){
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
