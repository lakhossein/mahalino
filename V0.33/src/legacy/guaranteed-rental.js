/* ═══ ۲۱) رویدادها ═══ */
/* ═══ ۱۲.۵) نماهای اجارهٔ تضمینی ═══ */
function grtIntroHTML(){
  var pre=grtPrefill();
  return '<div class="hero"><h1><em>ملکت رو به محلینو بسپار؛</em> ما فرآیند اجاره، دریافت اجاره‌بها و پیگیری تعهدات مستأجر رو مدیریت می‌کنیم تا بدون درگیری‌های معمول، از درآمد ملک خودت استفاده کنی.</h1>'+
  '<p>اجارهٔ تضمینی یک سرویس مدیریتی مستقل است، نه یک آگهی معمولی. محدودهٔ تعهدات، هزینه‌ها و شرایط تضمین در قرارداد مدیریت به‌صورت شفاف نوشته می‌شود.</p>'+
  '<div class="qa"><button class="btn btn-lg btn-primary" data-act="grtStart">ثبت ملک برای اجارهٔ تضمینی</button>'+
  '<button class="btn btn-lg" data-view="rent">اجارهٔ معمولی (بدون مدیریت)</button></div></div>'+
  '<div class="grid g3">'+
  '<div class="card"><div class="ct">محلینو چه کارهایی می‌کند</div><ul class="ticklist">'+GRT_INCLUDED.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'+
  '<div class="card"><div class="ct">خارج از تعهد ما</div><ul class="crosslist">'+GRT_EXCLUDED.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'+
  '<div class="card"><div class="ct">چه چیزی برای شما می‌ماند</div><ul class="ticklist">'+GRT_OWNER_KEEP.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
  '<p class="note" style="margin-top:8px">شرایط مالی: کمیسیون مدیریت '+fa(GRT_MGMT_PCT,0)+'٪ از اجارهٔ وصولی. جزئیات کامل در قرارداد مدیریت.</p></div></div>'+
  '<div class="card tight" style="margin-top:14px"><div class="ct">تفاوت با اجارهٔ معمولی</div>'+
  '<div class="tblwrap"><table class="tbl"><thead><tr><th>موضوع</th><th>اجارهٔ معمولی</th><th>اجارهٔ تضمینی</th></tr></thead><tbody>'+
  '<tr><td>پیدا کردن مستأجر و هماهنگی بازدید</td><td>با صاحب‌ملک</td><td>محلینو</td></tr>'+
  '<tr><td>دریافت اجاره‌بها و پیگیری تأخیر</td><td>با صاحب‌ملک</td><td>محلینو</td></tr>'+
  '<tr><td>قرارداد و اسناد</td><td>با صاحب‌ملک</td><td>محلینو (تنظیم و بایگانی)</td></tr>'+
  '<tr><td>بازرسی اولیه و پایانی</td><td>با صاحب‌ملک</td><td>محلینو (گزارش مکتوب)</td></tr>'+
  '<tr><td>مدیریت تعمیرات</td><td>با صاحب‌ملک</td><td>محلینو (با تأیید هزینه)</td></tr>'+
  '<tr><td>کمیسیون</td><td>معمولاً یک اجارهٔ ماهانه</td><td>'+fa(GRT_MGMT_PCT,0)+'٪ ماهانه از اجارهٔ وصولی</td></tr>'+
  '</tbody></table></div></div>'+
  (pre?('<div class="alert al-ok" style="margin-top:14px">اطلاعات ملک از '+esc(pre.from)+' قابل بازیابی است؛ نیازی به وارد کردن دوباره نیست.</div>'):'')+
  '<div class="card tight" style="margin-top:14px"><div class="ct">پیش‌نیازهای واقعی این سرویس</div><ul class="crosslist">'+
  grtPrereq().map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>';
}
function grtRoleBar(e){
  if(['listed','tenant','active','returning'].indexOf(e.status)<0)return '';
  return '<div class="seg" style="margin:0 0 14px">'+
  '<button class="'+(e.role==='owner'?'on':'')+'" data-act="grtRole" data-v="owner" aria-pressed="'+(e.role==='owner'?'true':'false')+'">نمای صاحب‌ملک</button>'+
  '<button class="'+(e.role==='tenant'?'on':'')+'" data-act="grtRole" data-v="tenant" aria-pressed="'+(e.role==='tenant'?'true':'false')+'">نمای مستأجر</button></div>';
}
function grtMoneyCard(e){
  var o=e.offer||{},tot=grtTotals(e),nx=grtNextCycle(e),al=grtAlerts(e);
  var h='<div class="grid g4" style="margin-bottom:14px">'+
  '<div class="stat"><b>'+rial(o.ownerMonthly||0)+'</b><span>پرداخت ماهانهٔ شما</span></div>'+
  '<div class="stat"><b>'+rial(tot.paidOwner)+'</b><span>پرداخت‌شده تاکنون</span></div>'+
  '<div class="stat"><b>'+rial(tot.owedOwner)+'</b><span>در انتظار پرداخت</span></div>'+
  '<div class="stat"><b>'+rial(tot.arrears)+'</b><span>وصول‌نشده از مستأجر</span></div></div>';
  h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>سررسید بعدی</span><b>'+(nx?(dateFa(nx.due)+' — دورهٔ '+fa(nx.n,0)):'سررسیدی باقی نمانده است')+'</b></div>'+
  '<div class="kv"><span>حالت پرداخت</span><b>'+(o.mode==='guaranteed'?'<span class="badge b-ok">تضمینی تا '+fa(o.capMonths,0)+' ماه</span>':'<span class="badge b-info">مبتنی بر وصول</span>')+'</b></div>'+
  '<div class="kv"><span>اجارهٔ مستأجر / کمیسیون / خالص شما</span><b>'+rial(o.rent||0)+' − '+rial(o.fee||0)+' = '+rial(o.ownerMonthly||0)+'</b></div></div>';
  if(al.length){
    h+='<div class="card tight"><div class="ct">نکات مهم</div>'+al.slice(0,5).map(function(a){
      return '<div class="fs-note"><span class="badge '+(a.s==='bad'?'b-bad':a.s==='warn'?'b-warn':'b-info')+'">'+(a.s==='bad'?'مهم':'راهنما')+'</span> '+a.t+'</div>';
    }).join('')+'</div>';
  }
  return h;
}
function grtField(k,label,val,ph,type){if((k==='dep'||k==='rent'||k==='la-income')&&typeof val==='number')val=val/10;
  return '<div class="fld"><span class="fl">'+label+'</span><input class="inp" id="gp-'+k+'" type="'+(type||'text')+'" placeholder="'+qesc(ph||'')+'" value="'+qesc(val===undefined||val===null?'':String(val))+'"></div>';
}
function grtStepProp(e){
  var p=e.prop,h=p.hood?findH(p.hood):null;
  var htm='<div class="grid g2"><div class="card"><div class="ct"> مشخصات ملک</div>';
  if(p.from)htm+='<div class="alert al-ok">اطلاعات از '+esc(p.from)+' پیش‌پر شد؛ فقط تکمیل کنید.</div>';
  htm+=grtField('title','عنوان ملک',p.title,'مثلاً ۷۵ متری دوخوابه')+
  '<div class="fld"><span class="fl">محله</span><select class="inp" id="gp-hood">'+HOODS.map(function(x){return '<option value="'+x.id+'"'+(p.hood===x.id?' selected':'')+'>'+x.n+'</option>'}).join('')+'</select></div>'+
  '<div class="srow"><div class="slab"><span>نوع ملک</span></div><input class="inp" id="gp-type" list="gp-types" value="'+qesc(p.type)+'"><datalist id="gp-types">'+GRT_TYPES.map(function(x){return '<option value="'+x+'">'}) .join('')+'</datalist></div>'+
  grtField('area','متراژ (متر)',p.area,'مثلاً ۷۵','number')+
  grtField('rooms','تعداد اتاق',p.rooms,'مثلاً ۲','number')+
  grtField('age','سن بنا (سال)',p.age,'مثلاً ۸','number')+
  '<div class="fld"><span class="fl">امکانات</span><div class="chips">'+['آسانسور','پارکینگ','انباری','بالکن','مبلمان','پکیج','کولر'].map(function(f){
    var on=(p.facilities||[]).indexOf(f)>=0;
    return '<button class="chip'+(on?' on':'')+'" data-act="grtFac" data-f="'+f+'" aria-pressed="'+(on?'true':'false')+'">'+f+'</button>';
  }).join('')+'</div></div></div>'+
  '<div class="card"><div class="ct"> مالکیت، نشانی و اسناد</div>'+
  '<div class="srow"><div class="slab"><span>کد پستی</span><button class="btn btn-sm" data-act="grtPostal">دریافت نشانی</button></div>'+
  '<input class="inp" id="gp-postal" placeholder="۱۰ رقم" style="direction:ltr;text-align:left" value="'+qesc(p.postal)+'" inputmode="numeric">'+
  '<div class="lk-status" id="gk-postal"></div></div>'+
  grtField('addr','نشانی',p.addr,'خیابان، کوچه، پلاک')+
  '<div class="fld"><span class="fl">نوع مالکیت</span><select class="inp" id="gp-own">'+['شخصی','مشترک','نمایندهٔ مالک'].map(function(x){return '<option'+(p.ownership===x?' selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
  '<div class="srow"><div class="slab"><span>کد ملی صاحب‌ملک</span><button class="btn btn-sm" data-act="grtVerifyOwner">'+(lkConfig().identityEndpoint?'استعلام و تکمیل خودکار':'بررسی کد ملی')+'</button></div>'+
  '<input class="inp" id="gp-nid" placeholder="۱۰ رقم" style="direction:ltr;text-align:left" value="'+qesc(e.ownerNid||'')+'" inputmode="numeric">'+
  '<div class="lk-status" id="gk-nid"></div></div>'+
  grtField('deed','شماره/وضعیت سند مالکیت',(p.docs&&p.docs.deed)||'','مثلاً سند تک‌برگ ۱۲۳۴۵۶')+
  grtField('meta','توضیح اسناد و مدارک',(p.docs&&p.docs.meta)||'','پایان کار، صورت‌جلسه و…')+
  '<div class="fld"><span class="fl">وضعیت اشغال</span><select class="inp" id="gp-occ">'+['خالی','مسکونی توسط مالک','اشغال با مستأجر فعلی'].map(function(x){return '<option'+(p.occupancy===x?' selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
  (p.occupancy==='اشغال با مستأجر فعلی'?('<div class="fld"><span class="fl">مشخصات مستأجر فعلی</span>'+
   '<input class="inp" id="gp-ctn" placeholder="نام و شمارهٔ تماس" value="'+qesc(p.curTenant.name?(p.curTenant.name+' / '+p.curTenant.mobile):'')+'">'+
   '<input class="inp" id="gp-ctdate" placeholder="تاریخ پایان قرارداد فعلی" style="margin-top:6px" value="'+qesc(p.curTenant.until||'')+'"></div>'):'')+
  '</div></div>'+
  (h?('<div class="card tight" style="margin-top:14px"><div class="kv"><span>میانگین اجارهٔ نمونهٔ '+h.n+'</span><b>'+rial(h.avgRent)+' • ودیعه '+rial(h.avgDep)+' — '+MARKET.asOf+'</b></div><p class="note">'+MARKET.note+'</p></div>'):'')+
  wnav('grt',true,'برای ادامه، عنوان، محله و متراژ را ثبت کنید');
  return htm;
}
function grtCondEditor(e){
  var items=grtCondSeed(e);
  return '<div class="grid g2">'+items.map(function(it){
    return '<div class="card tight'+(it.rate?'':' dim')+'"><div class="kv"><span><b>'+esc(it.t)+'</b></span><span class="badge b-info">'+esc(it.g)+'</span></div>'+
    '<div class="chips" style="margin:8px 0">'+GRT_SCALE.map(function(s){
      return '<button class="chip'+(it.rate===s.k?' on':'')+'" data-act="grtRate" data-k="'+it.k+'" data-v="'+s.k+'" aria-pressed="'+(it.rate===s.k?'true':'false')+'">'+s.l+'</button>';
    }).join('')+'</div>'+
    '<input class="inp" id="gn-'+it.k+'" placeholder="یادداشت ایراد یا توضیح" value="'+qesc(it.note||'')+'">'+
    '<div class="chips" style="margin-top:8px;align-items:center">'+
    '<label class="btn btn-xs grtfile">افزودن تصویر<input type="file" accept="image/*" data-grt-photo="'+it.k+'" aria-label="تصویر '+esc(it.t)+'"></label>'+
    (it.photos||[]).map(function(ph){return '<img class="grtthumb" src="'+ph.d+'" alt="تصویر '+esc(it.t)+'" title="'+fd(ph.at)+'">'}).join('')+
    ((it.photos||[]).length?'<button class="btn btn-xs" data-act="grtPhotoDel" data-k="'+it.k+'">حذف تصویر</button>':'')+
    '</div></div>';
  }).join('')+'</div>';
}
function grtStepCond(e){
  var items=grtCondSeed(e),m=e.cond.meters||{};
  var done=items.filter(function(i){return i.rate}).length;
  var h='<div class="card"><div class="ct"> وضعیت اولیهٔ ملک (مبنای بازرسی پایانی)</div>'+
  '<p class="note">هر مورد را امتیاز بدهید و در صورت وجود ایراد، یادداشت یا تصویر اضافه کنید. این اطلاعات در گزارش بازرسی اولیه و مقایسهٔ پایانی استفاده می‌شود.</p>'+
  '<div class="pbar" style="margin:10px 0"><i style="width:'+(done/GRT_ITEMS.length*100)+'%"></i></div>'+
  '<p class="note">'+fa(done,0)+' از '+fa(GRT_ITEMS.length,0)+' مورد ثبت شد.</p></div>';
  h+=grtCondEditor(e);
  h+='<div class="grid g2" style="margin-top:14px"><div class="card"><div class="ct"> کنتورها</div>'+
  grtField('mw','کنتور آب',m.water,'عدد','number')+grtField('me','کنتور برق',m.elec,'عدد','number')+grtField('mg','کنتور گاز',m.gas,'عدد','number')+'</div>'+
  '<div class="card"><div class="ct"> لوازم و امکانات همراه</div>'+
  '<div class="chips">'+((e.cond.furniture||[]).map(function(f,i){return '<span class="chip on">'+esc(f)+' <button class="xbtn" data-act="grtFurnDel" data-i="'+i+'" aria-label="حذف '+esc(f)+'">×</button></span>'}).join('')||'<span class="note">موردی ثبت نشده</span>')+'</div>'+
  '<div style="display:flex;gap:6px;margin-top:10px"><input class="inp" id="gf-new" placeholder="مثلاً یخچال سایدینگ"><button class="btn btn-sm" data-act="grtFurnAdd">افزودن</button></div>'+
  '<div class="fld" style="margin-top:10px"><span class="fl">ملاحظات کلی</span><textarea class="inp" id="gp-notes" rows="3" placeholder="توضیح عمومی دربارهٔ وضعیت ملک">'+esc(e.cond.notes||'')+'</textarea></div></div></div>';
  h+=wnav('grt',true,'برای ادامه همهٔ موارد را امتیاز دهید');
  return h;
}
function grtStepExp(e){
  var o=grtOfferOf(e),mkt=o.mkt,exp=+e.exp.rent||0;
  var h='<div class="grid g2"><div class="card"><div class="ct"> انتظارات اجاره</div>';
  h+=grtField('rent','اجارهٔ ماهانهٔ مدنظر شما',e.exp.rent,'مثلاً ۴۵ میلیون تومان')+
  grtField('dep','ودیعهٔ مدنظر',e.exp.dep,'مثلاً ۱۵ میلیارد ریال')+
  grtField('start','تاریخ شروع مورد نظر',e.exp.start,'مثلاً ۱۴۰۴/۰۸/۰۱')+
  '<div class="fld"><span class="fl">مدت قرارداد (ماه)</span><input class="inp" id="gp-dur" type="number" value="'+qesc(e.exp.dur)+'"></div>'+
  '<div class="fld"><span class="fl">روز پرداخت به شما</span><input class="inp" id="gp-payday" type="number" min="1" max="28" value="'+qesc(e.exp.payDay)+'"></div>'+
  '<div class="fld"><span class="fl">شرایط مورد نظر شما</span><input class="inp" id="gp-prefs" placeholder="مثلاً بدون حیوان خانگی" value="'+qesc(e.exp.prefs)+'"><span class="fh">فقط شرایط مرتبط با استفاده از ملک؛ معیارهای تبعیض‌آمیز اعمال نمی‌شود.</span></div>'+
  '<div class="fld"><span class="fl">محدودیت‌های مصرف</span><input class="inp" id="gp-restr" placeholder="مثلاً عدم استفاده تجاری" value="'+qesc(e.exp.restrict)+'"></div>'+
  '</div><div class="card"><div class="ct"> مقایسه با بازار '+qesc(e.prop.hood?findH(e.prop.hood).n:'')+'</div>'+
  '<div class="kv"><span>میانگین اجارهٔ نمونهٔ محله</span><b>'+rial(mkt)+'</b></div>'+
  '<div class="kv"><span>پیشنهاد محلینو برای اجارهٔ اعلامی</span><b>'+rial(o.rec)+'</b></div>'+
  '<div class="kv"><span>مورد نظر شما</span><b>'+rial(exp)+'</b></div>'+
  (exp&&mkt?('<div class="alert '+(exp>mkt*1.15?'al-warn':'al-ok')+'">'+
    (exp>mkt*1.15?('مبلغ مورد نظر شما حدود '+fa(Math.round((exp/mkt-1)*100),0)+'٪ بالاتر از میانگین محله است؛ انتظار می‌رود مدت تخلیه بیشتر شود. پیشنهاد: '+rial(o.rec)):
     'شرایط شما با بازار محله هم‌خوان است.')+'</div>'):'<p class="note">برای مقایسه، مبلغ مورد نظر را وارد و ذخیره کنید.</p>')+
  '<p class="note">مبنای محاسبه: میانگین اجارهٔ نمونهٔ محله ('+MARKET.asOf+') تعدیل‌شده با متراژ؛ دادهٔ معاملهٔ ثبت‌شدهٔ محله عمومی نیست.</p>'+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm" data-act="grtUseRec">استفاده از پیشنهاد محلینو</button></div>'+
  '</div></div>';
  h+=wnav('grt',true,'مبلغ اجاره و ودیعه را مشخص کنید');
  return h;
}
function grtStepElig(e){
  var c=e.elig.checks&&e.elig.checks.length?e.elig.checks:grtEligChecks(e);
  var v=e.elig.verdict;
  var h='<div class="card"><div class="ct"> بررسی صلاحیت ملک برای سرویس</div>'+
  '<div class="tblwrap"><table class="tbl"><thead><tr><th>مورد</th><th>وضعیت</th><th>توضیح</th></tr></thead><tbody>'+
  c.map(function(x){
    var m={pass:['b-ok','تأیید'],warn:['b-warn','نیازمند بررسی'],fail:['b-bad','مانع'],pending:['b-info','در انتظار'],review:['b-warn','در دست بررسی']}[x.s]||['',''];
    return '<tr><td>'+esc(x.t)+'</td><td><span class="badge '+m[0]+'">'+m[1]+'</span></td><td>'+esc(x.n)+'</td></tr>';
  }).join('')+'</tbody></table></div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="grtEligRun">بررسی و به‌روزرسانی</button>'+
  '<button class="btn" data-act="grtReserve">استعلام ظرفیت تضمین</button></div></div>'+
  '<div class="grid g2" style="margin-top:14px"><div class="card"><div class="ct"> نتیجه</div>'+
  '<div class="kv"><span>وضعیت صلاحیت</span><b>'+grtVerdictBadge(v)+'</b></div>'+
  '<div class="kv"><span>توضیح</span><b>'+esc(grtVerdictText(v))+'</b></div>'+
  (v!=='eligible'?'<div class="alert al-warn">تا کامل نشدن این بررسی‌ها، پیشنهاد مالی قطعی صادر نمی‌شود و ملک آگهی نمی‌شود.</div>':'<div class="alert al-ok">ملک برای دریافت پیشنهاد سرویس آماده است.</div>')+
  '</div><div class="card"><div class="ct"> ظرفیت تضمین</div>'+
  '<div class="kv"><span>وضعیت صندوق</span><b><span class="badge '+grtReserveLabel().c+'">'+grtReserveLabel().t+'</span></b></div>'+
  '<div class="kv"><span>آخرین استعلام</span><b>'+(grtReserve().checkedAt?fd(grtReserve().checkedAt):'انجام نشده')+'</b></div>'+
  '<p class="note">تضمین پرداخت فقط با ظرفیت تأییدشدهٔ صندوق/بیمه ارائه می‌شود؛ در غیر این صورت حالت «مبتنی بر وصول» اعمال می‌گردد.</p>'+
  '</div></div>';
  h+=wnav('grt',true,'برای ادامه، بررسی صلاحیت باید کامل شود');
  return h;
}
function grtStepOffer(e){
  var o=grtOfferOf(e);
  var h='<div class="card"><div class="ct"> پیشنهاد سرویس و شرایط مالی</div>'+
  '<div class="tblwrap"><table class="tbl"><thead><tr><th>عنوان</th><th>مبلغ</th><th>توضیح</th></tr></thead><tbody>'+
  '<tr><td>اجاره‌بهای دریافتی از مستأجر</td><td>'+rial(o.rent)+'</td><td>+ ودیعهٔ '+rial(o.dep)+'</td></tr>'+
  '<tr><td>کمیسیون مدیریت محلینو ('+fa(o.pct,0)+'٪)</td><td>'+rial(o.fee)+'</td><td>فقط از اجارهٔ وصول‌شده کسر می‌شود</td></tr>'+
  '<tr><td>پرداخت ماهانه به شما</td><td><b>'+rial(o.ownerMonthly)+'</b></td><td>روز '+fa(o.payDay,0)+' هر ماه</td></tr>'+
  '<tr><td>مدت سرویس</td><td>'+fa(o.dur,0)+' ماه</td><td>آغاز: '+(e.exp.start?esc(e.exp.start):'پس از تحویل')+'</td></tr>'+
  '<tr><td>حالت پرداخت</td><td>'+(o.mode==='guaranteed'?'تضمینی':'مبتنی بر وصول')+'</td><td>'+esc(o.mode==='guaranteed'?(fa(o.capMonths,0)+' ماه — سقف '+rial(o.capTotal)):'بدون تعهد مستقل')+'</td></tr>'+
  '</tbody></table></div>'+
  '<div class="alert '+(o.mode==='guaranteed'?'al-ok':'al-warn')+'">'+esc(grtModeNote(o))+'</div>'+
  '<div class="fld"><span class="fl">اجارهٔ اعلامی به مستأجر</span><input class="inp" id="gp-offerrent" type="number" value="'+qesc(e.offerRent||o.rec||o.rent)+'"><span class="fh">بازار: '+rial(o.mkt)+' — پیشنهاد: '+rial(o.rec)+'</span></div>'+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm" data-act="grtOfferCalc">به‌روزرسانی محاسبه</button></div></div>'+
  '<div class="grid g2" style="margin-top:14px"><div class="card"><div class="ct"> اگر مستأجر پیدا نشود</div><p class="note">تا '+fa(45,0)+' روز جست‌وجو؛ در صورت عدم اجاره، قرارداد مدیریت بدون هزینهٔ مدیریتی خاتمه می‌یابد و هزینه‌ای به شما تعلق نمی‌گیرد.</p></div>'+
  '<div class="card"><div class="ct"> اگر مستأجر پرداخت نکند</div><p class="note">'+(o.mode==='guaranteed'
    ?'محلینو در سررسید به شما پرداخت می‌کند و وصول از مستأجر را پیگیری می‌کند؛ سقف تعهد '+rial(o.capTotal)+' است.'
    :'پرداخت شما پس از وصول انجام می‌شود؛ یادآوری، ثبت بدهی و پیگیری با محلینو است.')+'</p></div>'+
  '<div class="card"><div class="ct"> خسارت</div><p class="note">بر اساس گزارش بازرسی و تفکیک ساییدگی عادی از آسیب تعیین می‌شود؛ کسر از ودیعه فقط با تأیید شما.</p></div>'+
  '<div class="card"><div class="ct"> استثنائات</div><ul class="crosslist">'+GRT_EXCLUDED.slice(0,4).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div></div>';
  if(!e.offer){
    h+='<div class="card tight" style="margin-top:14px"><div class="fs-actions"><button class="btn btn-primary" data-act="grtAccept">پذیرش شرایط و صدور قرارداد مدیریت</button><button class="btn" data-act="grtBack">بازگشت به بررسی صلاحیت</button></div></div>';
  }else{
    h+='<div class="card tight" style="margin-top:14px"><div class="kv"><span>قرارداد مدیریت</span><b>'+((e.mgmt&&e.mgmt.signed)?('<span class="badge b-ok">امضاشده '+esc(e.mgmt.code)+'</span>'):'<span class="badge b-warn">در انتظار امضا</span>')+'</b></div>'+
    '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm" data-act="grtMgmtView">مشاهدهٔ سند</button>'+
    (e.mgmt&&e.mgmt.signed?'':'<button class="btn btn-sm btn-primary" data-act="grtMgmtSign">امضای قرارداد مدیریت</button>')+
    '<button class="btn btn-sm" data-act="grtMgmtPrint">دریافت PDF</button></div></div>';
  }
  h+=wnav('grt',true,e.mgmt&&e.mgmt.signed?'':'برای ادامه، قرارداد مدیریت را امضا کنید');
  return h;
}
function grtStepTenant(e){
  var o=e.offer||{},apps=e.tenant.apps||[];
  var h='<div class="card"><div class="ct"> بازاریابی و یافتن مستأجر</div>'+
  '<div class="kv"><span>وضعیت آگهی</span><b>'+(e.tenant.listedAt?('<span class="badge b-ok">منتشرشده — '+fd(e.tenant.listedAt)+'</span>'):'<span class="badge b-info">منتشر نشده</span>')+'</b></div>'+
  '<div class="kv"><span>منبع درخواست‌ها</span><b>'+(e.tenant.src==='api'?'سامانهٔ درخواست مستأجر':'ثبت داخل محلینو (نمای مستأجر)')+'</b></div>'+
  '<div class="fs-actions" style="margin-top:10px">'+(e.tenant.listedAt?'':'<button class="btn btn-primary" data-act="grtPublish">انتشار آگهی</button>')+
  (grtCfg().leadsEndpoint?'<button class="btn btn-sm" data-act="grtLeads">دریافت درخواست‌ها</button>':'')+
  '<button class="btn btn-sm" data-act="grtRole" data-v="tenant">ورود به نمای مستأجر برای ثبت درخواست</button></div></div>';
  h+='<div class="card" style="margin-top:14px"><div class="ct"> معیارهای ارزیابی (مستند و غیرتبعیض‌آمیز)</div>'+
  '<div class="chips">'+GRT_CRIT.map(function(c){return '<span class="chip">'+esc(c.t)+'</span>'}).join('')+'</div>'+
  '<p class="note">هیچ معیاری بر پایهٔ جنسیت، وضعیت تأهل، قومیت یا دین اعمال نمی‌شود. معیارها فقط ظرفیت سکونت، توان مالی مستند و سابقهٔ پرداخت‌اند.</p></div>';
  h+='<div class="card" style="margin-top:14px"><div class="ct"> درخواست‌ها ('+fa(apps.length,0)+')</div>';
  if(!apps.length){h+='<div class="empty">هنوز درخواستی ثبت نشده است. از نمای مستأجر ثبت کنید یا سامانهٔ درخواست را متصل کنید.</div>'}
  else{
    h+='<div class="tblwrap"><table class="tbl"><thead><tr><th>مستأجر</th><th>امتیاز</th><th>وضعیت</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>'+
    apps.map(function(a){
      var sc=a.score||grtAppScore(e,a);
      var sel=e.tenant.selected===a.id;
      return '<tr><td><b>'+esc(a.name||'—')+'</b><div class="note">'+esc(a.mobile||'')+(a.income?(' • درآمد '+rial(a.income)):'')+(a.people?(' • '+fa(a.people,0)+' نفر'):'')+'</div></td>'+
      '<td><span class="badge '+(sc.fail?'b-bad':(sc.pass>=3?'b-ok':'b-warn'))+'">'+fa(sc.pass,0)+' از '+fa(sc.total,0)+'</span>'+
      '<div class="chips" style="margin-top:6px">'+sc.rows.map(function(r){return '<span class="chip" title="'+esc(r.n||'')+'">'+esc(r.t)+': '+(r.s==='pass'?'✓':r.s==='fail'?'✗':'…')+'</span>'}).join('')+'</div></td>'+
      '<td>'+(sel?'<span class="badge b-ok">انتخاب‌شده</span>':(a.status==='rejected'?'<span class="badge b-bad">رد شده</span>':'<span class="badge b-info">جدید</span>'))+'</td>'+
      '<td><div class="fs-actions"><button class="btn btn-xs" data-act="grtScore" data-id="'+a.id+'">ارزیابی</button>'+
      (sel?'':'<button class="btn btn-xs btn-primary" data-act="grtPick" data-id="'+a.id+'">تأیید و انتخاب</button><button class="btn btn-xs" data-act="grtReject" data-id="'+a.id+'">رد</button>')+
      '</div></td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  h+='</div>';
  h+=wnav('grt',true,'برای ادامه، مستأجر را تأیید کنید');
  return h;
}
function grtStepContract(e){
  var rw=e.rentWf?wfOf(e.rentWf):null;
  var a=(e.tenant.apps||[]).filter(function(x){return x.id===e.tenant.selected})[0]||{};
  var h='<div class="grid g2"><div class="card"><div class="ct"> دو سند جدا</div>'+
  '<div class="kv"><span>قرارداد مدیریت (شما و محلینو)</span><b>'+((e.mgmt&&e.mgmt.signed)?'<span class="badge b-ok">امضاشده</span>':'<span class="badge b-warn">در انتظار</span>')+'</b></div>'+
  '<div class="kv"><span>اجاره‌نامهٔ شما و مستأجر</span><b>'+(e.contractCode?('<span class="badge b-ok">'+esc(e.contractCode)+'</span>'):'<span class="badge b-info">تنظیم‌نشده</span>')+'</b></div>'+
  '<p class="note">این دو رابطهٔ حقوقی متفاوت‌اند و هرکدام سند مستقل می‌خواهد. قرارداد مدیریت جایگزین اجاره‌نامه نیست.</p>'+
  '<div class="fs-actions" style="margin-top:10px">'+(rw?'<button class="btn btn-sm btn-primary" data-act="grtOpenCon">باز کردن فرم اجاره‌نامه</button>':'<button class="btn btn-sm btn-primary" data-act="grtMakeCon">ایجاد اجاره‌نامه</button>')+
  '<button class="btn btn-sm" data-act="grtMgmtView">قرارداد مدیریت</button></div></div>'+
  '<div class="card"><div class="ct"> خلاصهٔ طرفین</div>'+
  '<div class="kv"><span>مستأجر</span><b>'+esc(a.name||'—')+'</b></div>'+
  '<div class="kv"><span>تماس</span><b dir="ltr">'+esc(a.mobile||'—')+'</b></div>'+
  '<div class="kv"><span>کد ملی</span><b dir="ltr">'+esc(a.nid||'—')+'</b></div>'+
  '<div class="kv"><span>اعتبارسنجی</span><b>'+(a.verify==='official'?'تأیید سرویس هویت':(a.verify==='format'?'فقط قالب کد ملی':'استعلام نشده'))+'</b></div>'+
  (rw&&rw.data.signed?'':'<div class="alert al-warn" style="margin-top:10px">وضعیت مستأجر بر پایهٔ اطلاعات اعلامی است؛ تأیید رسمی هویت نیاز به سرویس مجاز دارد.</div>')+
  '</div></div>';
  if(e.contractCode){
    h+='<div class="card tight" style="margin-top:14px"><div class="ct"> تحویل اولیه</div>'+
    '<p class="note">پیش از تحویل، بازرسی اولیه باید ثبت شده باشد (مرحلهٔ ۲).</p>'+
    '<div class="grid g2">'+grtField('hodate','تاریخ تحویل',e.exp.start||'','مثلاً امروز')+
    grtField('hokeys','کلیدها و دسترسی‌ها','','مثلاً ۲ کلید اصلی، ۱ ریمود')+
    grtField('howater','کنتور آب',(e.cond.meters||{}).water||'','عدد','number')+
    grtField('hoelec','کنتور برق',(e.cond.meters||{}).elec||'','عدد','number')+
    grtField('hogas','کنتور گاز',(e.cond.meters||{}).gas||'','عدد','number')+
    grtField('hoacko','تأیید صاحب‌ملک',S.auth?S.auth.name:'','نام')+
    grtField('hoackt','تأیید مستأجر',a.name||'','نام')+'</div>'+
    '<div class="fs-actions"><button class="btn btn-primary" data-act="grtHoSave">ثبت تحویل اولیه و آغاز سرویس</button>'+
    '<button class="btn" data-act="grtReport">گزارش بازرسی</button></div></div>';
  }else{
    h+='<div class="alert al-warn" style="margin-top:14px">برای ثبت تحویل، ابتدا اجاره‌نامه را نهایی کنید.</div>';
  }
  h+=wnav('grt',true,'تحویل اولیه را ثبت کنید');
  return h;
}
function grtCyclesTable(e,canPay){
  if(!e.cycles.length)return '<div class="empty">هنوز دوره‌ای آغاز نشده است.</div>';
  return '<div class="tblwrap"><table class="tbl"><thead><tr><th>دوره</th><th>سررسید</th><th>اجاره</th><th>وضعیت وصول</th>'+(canPay?'<th><span class="sr">اقدام</span></th>':'')+'<th>پرداخت به شما</th></tr></thead><tbody>'+
  e.cycles.map(function(c){
    var tm={pending:['b-info','در انتظار'],recorded:['b-warn','ثبت‌شده — در انتظار تأیید'],settled:['b-ok','وصول شد'+(c.tenant.ssrc==='demo'?' (نمایشی)':'')],overdue:['b-bad','معوق']}[c.tenant.status]||['','—'];
    var om={scheduled:['b-info','زمان‌بندی'],paid:['b-ok','پرداخت شد'],held:['b-warn','معوق'],waived:['','—']}[c.owner.status]||['','—'];
    return '<tr><td>'+fa(c.n,0)+'</td><td>'+dateFa(c.due)+'</td><td>'+rial(c.rent)+'</td>'+
    '<td><span class="badge '+tm[0]+'">'+tm[1]+'</span>'+(c.tenant.ref?'<div class="note" dir="ltr">'+esc(c.tenant.ref)+'</div>':'')+'</td>'+
    (canPay?('<td>'+(c.tenant.status==='pending'||c.tenant.status==='overdue'?
      '<button class="btn btn-xs btn-primary" data-act="grtPay" data-n="'+c.n+'">پرداخت دورهٔ '+fa(c.n,0)+'</button>':
      (c.tenant.status==='recorded'?'<button class="btn btn-xs" data-act="grtSettle" data-n="'+c.n+'">تأیید وصول</button>':'<span class="note">تسویه شد</span>'))+'</td>'):'')+
    '<td><span class="badge '+om[0]+'">'+om[1]+'</span><div class="note">'+rial(c.owner.amount)+(c.deduct?(' − کسر '+rial(c.deduct)):'')+(c.owner.why?(' • '+esc(c.owner.why)):'')+'</div></td></tr>';
  }).join('')+'</tbody></table></div>';
}
function grtReqsPanel(e){
  var h='<div class="card"><div class="ct"> درخواست‌های تعمیراتی و خدمات</div>';
  h+='<div class="srow"><div class="slab"><span>عنوان درخواست</span></div><input class="inp" id="gq-title" placeholder="مثلاً نشتی شیر روشویی"></div>'+
  '<div class="chips" style="margin:8px 0">'+GRT_ITEMS.map(function(i){return '<button class="chip" data-act="grtReqPick" data-k="'+i.k+'">'+esc(i.t)+'</button>'}).join('')+'</div>'+
  '<div class="fs-actions"><button class="btn btn-sm btn-primary" data-act="grtReqAdd">ثبت درخواست</button><button class="btn btn-sm" data-act="grtReqSync">همگام‌سازی وضعیت</button></div>';
  if(!(e.reqs||[]).length)h+='<div class="empty" style="margin-top:12px">درخواستی ثبت نشده است.</div>';
  else{
    h+='<div class="tblwrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>درخواست</th><th>مسئول</th><th>وضعیت</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>'+
    e.reqs.map(function(r){
      var resp={owner:'صاحب‌ملک',tenant:'مستأجر',included:'شامل سرویس',review:'در انتظار تعیین'}[r.resp]||'—';
      var act='<div class="fs-actions">';
      if(r.approval==='pending')act+='<button class="btn btn-xs btn-primary" data-act="grtReqOk" data-id="'+r.id+'">تأیید هزینه</button><button class="btn btn-xs" data-act="grtReqNo" data-id="'+r.id+'">رد</button>';
      if(r.approval==='approved'&&!r.order&&!r.quote)act+='<button class="btn btn-xs btn-primary" data-act="grtReqGo" data-id="'+r.id+'">دریافت برآورد</button>';
      if(r.approval==='approved'&&!r.order&&r.quote)act+='<button class="btn btn-xs btn-primary" data-act="grtExec" data-id="'+r.id+'">پرداخت و ثبت سفارش</button>';
      if(r.order)act+='<button class="btn btn-xs" data-act="svcReqOpen" data-id="'+r.order+'">سفارش</button>';
      act+='</div>';
      return '<tr><td><b>'+esc(r.title)+'</b><div class="note">'+esc(r.by==='tenant'?'از سوی مستأجر':'از سوی صاحب‌ملک')+(r.quote?(' • برآورد '+rial(r.quote.total)):'')+'</div><div id="rq-'+r.id+'"></div></td>'+
      '<td><span class="badge '+(r.resp==='included'?'b-ok':r.resp==='owner'?'b-info':'b-warn')+'">'+resp+'</span>'+(r.approval==='pending'?'<div class="note">نیازمند تأیید شما</div>':'')+'</td>'+
      '<td>'+esc(r.status)+(r.note?('<div class="note">'+esc(r.note)+'</div>'):'')+'</td><td>'+act+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  h+='<p class="note" style="margin-top:8px">هیچ هزینه‌ای بدون تعیین مسئولیت و تأیید شما از حساب شما کسر نمی‌شود.</p></div>';
  return h;
}
function grtStepManage(e){
  var h=grtMoneyCard(e);
  h+='<div class="card"><div class="ct"> تقویم مالی</div>'+grtCyclesTable(e)+
  '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm" data-act="grtRun">بررسی سررسیدها</button>'+
  '<button class="btn btn-sm" data-act="grtReport">گزارش بازرسی</button>'+
  '<button class="btn btn-sm" data-act="grtDocs">اسناد پرونده</button></div></div>';
  h+='<div style="margin-top:14px">'+grtReqsPanel(e)+'</div>';
  h+='<div class="card tight" style="margin-top:14px"><div class="ct"> پایان دوره</div><p class="note">برای بازگشت ملک، بازرسی پایانی و تسویه لازم است.</p>'+
  '<div class="fs-actions" style="margin-top:8px"><button class="btn btn-primary" data-act="grtStartRet">آغاز فرآیند بازگشت</button></div></div>';
  h+=wnav('grt',true,'برای مرحلهٔ پایانی، فرآیند بازگشت را آغاز کنید');
  return h;
}
function grtStepReturn(e){
  var fin=e.inspections.final,d=e.damage;
  var h='<div class="grid g2"><div class="card"><div class="ct"> بازرسی پایانی</div>'+
  (fin?'<div class="alert al-ok">بازرسی پایانی ثبت شد — '+fd(fin.at)+'</div>':'<p class="note">همین ساختار بازرسی اولیه را دوباره امتیاز دهید تا مقایسه انجام شود.</p>')+
  '<div class="fs-actions" style="margin:8px 0">'+(fin?'':'<button class="btn btn-primary" data-act="grtFinalStart">شروع بازرسی پایانی</button>')+'</div></div>'+
  '<div class="card"><div class="ct"> کنتورهای پایانی و اقلام مفقود</div>'+
  grtField('fw','کنتور آب',(e.finalMeters||{}).water||'','عدد','number')+
  grtField('fe','کنتور برق',(e.finalMeters||{}).elec||'','عدد','number')+
  grtField('fg','کنتور گاز',(e.finalMeters||{}).gas||'','عدد','number')+
  '<div class="fld"><span class="fl">اقلام مفقود یا معیوب</span><input class="inp" id="gf-miss" placeholder="با ویرگول جدا کنید" value="'+qesc((e.cond.missing||[]).join('، '))+'"></div></div></div>';
  if(!fin){
    h+='<div class="card" style="margin-top:14px"><div class="ct"> امتیازدهی پایانی (همان ساختار بازرسی اولیه)</div>'+
    '<p class="note">وضعیت فعلی هر مورد را ثبت کنید؛ تفاوت‌ها به‌صورت خودکار با گزارش اولیه مقایسه می‌شود.</p></div>'+
    grtCondEditor(e)+
    '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="grtFinalSave">ثبت بازرسی پایانی</button></div>';
    h+=wnav('grt',false,'');
    return h;
  }
  if(fin){
    if(!d)grtRunDamage(e);
    h+='<div class="card" style="margin-top:14px"><div class="ct"> تفکیک آسیب و مسئولیت</div>';
    if(!d.diffs.length)h+='<div class="alert al-ok">تفاوتی ثبت نشد؛ ملک در وضعیت مشابهی بازگشته است.</div>';
    else{
      h+='<div class="tblwrap"><table class="tbl"><thead><tr><th>مورد</th><th>اولیه → پایانی</th><th>نوع</th><th>برآورد</th><th>مسئول</th><th><span class="sr">تصمیم</span></th></tr></thead><tbody>'+
      d.diffs.map(function(x){
        var kind={wear:'ساییدگی عادی',pre:'آسیب پیشین',missing:'مفقودی',damage:'آسیب'}[x.kind]||x.kind;
        return '<tr><td>'+esc(x.t)+'</td><td>'+esc(grtScaleLabel(x.from))+' → '+esc(grtScaleLabel(x.to))+'</td>'+
        '<td><span class="badge '+(x.kind==='wear'?'b-info':'b-warn')+'">'+kind+'</span></td>'+
        '<td><input class="inp gcost" data-k="'+esc(x.k)+'" type="number" value="'+(x.cost||0)+'"></td>'+
        '<td>'+esc(x.resp==='tenant'?'مستأجر':x.resp==='owner'?'صاحب‌ملک':x.resp==='none'?'بدون کسر':'در انتظار تصمیم')+'</td>'+
        '<td><div class="fs-actions">'+(x.kind==='wear'||x.kind==='pre'?'<span class="note">بدون کسر از ودیعه</span>':
          '<button class="btn btn-xs" data-act="grtResp" data-k="'+esc(x.k)+'" data-v="tenant">مستأجر</button>'+
          '<button class="btn btn-xs" data-act="grtResp" data-k="'+esc(x.k)+'" data-v="owner">صاحب‌ملک</button>'+
          '<button class="btn btn-xs" data-act="grtResp" data-k="'+esc(x.k)+'" data-v="none">بدون کسر</button>')+'</div></td></tr>';
      }).join('')+'</tbody></table></div>';
      h+='<div class="kv"><span>قابل کسر از ودیعه</span><b>'+rial(d.tenantLiable)+'</b></div>'+
      '<div class="kv"><span>بر عهدهٔ صاحب‌ملک</span><b>'+rial(d.ownerLiable)+'</b></div>'+
      '<div class="kv"><span>بدون تصمیم</span><b>'+fa(d.unresolved,0)+' مورد</b></div>';
    }
    h+='<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm" data-act="grtReport">گزارش مقایسه‌ای و PDF</button></div></div>';
    h+='<div class="card" style="margin-top:14px"><div class="ct"> بازگشت فیزیکی ملک</div>'+
    (e.handover&&e.handover.final?('<div class="alert al-ok">بازگشت ثبت شد — '+fd(e.handover.final.at)+'</div>'):(
    '<div class="grid g2">'+grtField('frdate','تاریخ بازگشت','','مثلاً امروز')+
    grtField('frkeys','کلیدهای عودتی','','مثلاً ۲ کلید')+
    grtField('fracko','تأیید صاحب‌ملک',S.auth?S.auth.name:'','نام')+
    grtField('frackt','تأیید مستأجر','','نام')+'</div>'+
    '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-primary" data-act="grtFinalHo">ثبت بازگشت ملک</button></div>'))+
    '</div>';
    var tot=grtTotals(e),dep=(e.offer&&e.offer.dep)||0;
    h+='<div class="card tight" style="margin-top:14px"><div class="ct"> تسویهٔ نهایی</div>'+
    '<div class="kv"><span>ودیعهٔ نزد محلینو</span><b>'+rial(dep)+'</b></div>'+
    '<div class="kv"><span>خسارت بر عهدهٔ مستأجر</span><b>'+rial(d?d.tenantLiable:0)+'</b></div>'+
    '<div class="kv"><span>بدهی وصول‌نشده</span><b>'+rial(tot.arrears)+'</b></div>'+
    '<div class="kv"><span>مبلغ آزادشده برای شما</span><b>'+rial(Math.max(0,dep-(d?d.tenantLiable:0)))+'</b></div>'+
    '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-primary" data-act="grtClose"'+(e.handover&&e.handover.final?'':' disabled')+'>بستن پرونده و آزادسازی ودیعه</button></div>'+
    '</div>';
  }
  return h;
}
function grtTenantPanel(e){
  var o=e.offer||{},a=(e.tenant.apps||[]).filter(function(x){return x.id===e.tenant.selected})[0]||{};
  var nx=grtNextCycle(e);
  var h='<div class="alert al-ok" style="margin-bottom:14px">این نما همان چیزی است که مستأجر در محلینو می‌بیند؛ ارتباط او با محلینو است، نه با صاحب‌ملک.</div>';
  h+='<div class="grid g4"><div class="stat"><b>'+rial(o.rent||0)+'</b><span>اجارهٔ ماهانه</span></div>'+
  '<div class="stat"><b>'+rial(o.dep||0)+'</b><span>ودیعه</span></div>'+
  '<div class="stat"><b>'+(e.contractCode||'—')+'</b><span>شمارهٔ اجاره‌نامه</span></div>'+
  '<div class="stat"><b>'+(nx?dateFa(nx.due):'—')+'</b><span>سررسید بعدی</span></div></div>';
  if(e.status==='listed'||!e.tenant.selected){
    h+='<div class="card"><div class="ct"> ثبت درخواست اجاره</div>'+
    '<div class="grid g2">'+grtField('la-name','نام و نام خانوادگی','','')+grtField('la-mobile','موبایل','','0912...')+
    grtField('la-nid','کد ملی','','۱۰ رقم')+grtField('la-income','درآمد ماهانه خانوار','','مثلاً ۶۰ میلیون تومان')+
    grtField('la-people','تعداد ساکنین','','۲')+grtField('la-note','توضیح','','اختیاری')+'</div>'+
    '<p class="note">معیارهای ارزیابی فقط توان مالی مستند، ظرفیت سکونت و سابقهٔ پرداخت است.</p>'+
    '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-primary" data-act="grtLeadAdd">ارسال درخواست</button></div></div>';
  }
  h+='<div class="card" style="margin-top:14px"><div class="ct"> پرداخت اجاره‌بها</div>'+
  '<div class="srow"><div class="slab"><span>شمارهٔ پیگیری واریز (اختیاری)</span></div><input class="inp" id="gp-ref" placeholder="مثلاً ۱۲۳۴۵۶" style="direction:ltr;text-align:left"></div>'+
  grtCyclesTable(e,true)+'</div>';
  h+='<div class="card" style="margin-top:14px"><div class="ct"> درخواست خدمات</div>'+grtReqsPanel(e)+'</div>';
  h+='<div class="card tight" style="margin-top:14px"><div class="ct"> اسناد و بازرسی</div>'+
  '<div class="fs-actions"><button class="btn btn-sm" data-act="grtReport">گزارش بازرسی</button>'+
  (e.contractCode?'<button class="btn btn-sm" data-act="grtConDoc">اجاره‌نامه</button>':'')+
  '<button class="btn btn-sm" data-act="grtAckIns">تأیید صورت‌جلسهٔ تحویل</button></div>'+
  (e.handover&&e.handover.initial?'<p class="note">تحویل اولیه: '+fd(e.handover.initial.at)+' • تأیید مستأجر: '+esc(e.handover.initial.ack.tenant||'—')+'</p>':'')+'</div>';
  return h;
}
VIEWS.grt=function(){
  var el=document.getElementById('v-grt');
  var e=grtCur();
  if(!e){el.innerHTML=grtIntroHTML();return}
  if(e.status==='active'||e.status==='returning')grtRunSchedule(e);
  var d=wd('grt'),st=d.step;
  var h=wtop('grt','اجارهٔ تضمینی','واگذاری مدیریت اجاره به محلینو — از آگهی تا بازگشت و تسویه');
  h+=flowReqBlock('grt');
  h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>پرونده</span><b dir="ltr">'+esc(e.id)+' — '+esc(e.prop.title||'بدون عنوان')+'</b></div>'+
  '<div class="kv"><span>وضعیت سرویس</span><b>'+grtStatusMeta(e)+'</b></div>'+
  '<div class="fs-actions" style="margin-top:8px"><button class="btn btn-xs" data-act="grtDocs">اسناد</button>'+
  '<button class="btn btn-xs" data-act="grtCancelEnr">لغو این پرونده</button></div></div>';
  h+=grtRoleBar(e);
  if(e.role==='tenant'){h+=grtTenantPanel(e);el.innerHTML=h;return}
  if(st===1)h+=grtStepProp(e);
  else if(st===2)h+=grtStepCond(e);
  else if(st===3)h+=grtStepExp(e);
  else if(st===4)h+=grtStepElig(e);
  else if(st===5)h+=grtStepOffer(e);
  else if(st===6)h+=grtStepTenant(e);
  else if(st===7)h+=grtStepContract(e);
  else if(st===8)h+=grtStepManage(e);
  else h+=grtStepReturn(e);
  el.innerHTML=h;
};

/* ═══ ۲.۶) کنش‌های اجارهٔ تضمینی ═══ */
function grtVal(id){var e=document.getElementById(id);return e?String(e.value||'').trim():''}
function grtNum(id){var v=pd(grtVal(id)).replace(/[^0-9.]/g,'');return v?+v:0}
function grtMoney(id){
  var raw=grtVal(id);if(!raw)return null;
  var r=parseMoneyFA(raw);
  if(!r.ok){toast(r.msg);return undefined}
  if(r.note)toast(r.note);
  return r.value;
}
function grtCollect(e,step){
  if(!e)return false;
  var p=e.prop,v;
  if(step===1){
    v=grtVal('gp-title');if(v)p.title=v;
    v=grtVal('gp-hood');if(v)p.hood=v;
    v=grtVal('gp-type');if(v)p.type=v;
    v=grtNum('gp-area');if(v)p.area=v;
    v=grtNum('gp-rooms');if(v)p.rooms=v;
    v=grtNum('gp-age');if(v)p.age=v;
    v=grtVal('gp-postal').replace(/\D/g,'');if(v)p.postal=v;
    v=grtVal('gp-addr');if(v)p.addr=v;
    v=grtVal('gp-own');if(v)p.ownership=v;
    v=grtVal('gp-deed');if(v){p.docs=p.docs||{};p.docs.deed=v}
    v=grtVal('gp-meta');if(v){p.docs=p.docs||{};p.docs.meta=v}
    v=grtVal('gp-occ');if(v)p.occupancy=v;
    v=grtVal('gp-nid').replace(/\D/g,'');if(v)e.ownerNid=v;
    v=grtVal('gp-ctn');if(v){p.curTenant.name=v.split('/')[0].trim();p.curTenant.mobile=(v.split('/')[1]||'').trim()}
    v=grtVal('gp-ctdate');if(v)p.curTenant.until=v;
    var w=wfOf(e.wf);if(w)w.data.hood=p.hood||'';
  }
  if(step===2){
    grtCondSeed(e).forEach(function(it){var nv=grtVal('gn-'+it.k);if(nv!=='')it.note=nv});
    var fn=grtVal('gf-new');if(fn){e.cond.furniture=e.cond.furniture||[];if(e.cond.furniture.indexOf(fn)<0)e.cond.furniture.push(fn)}
    e.cond.meters={water:grtVal('gp-mw'),elec:grtVal('gp-me'),gas:grtVal('gp-mg')};
    v=grtVal('gp-notes');if(v!=='')e.cond.notes=v;
  }
  if(step===3){
    v=grtMoney('gp-rent');if(v===undefined)return false;if(v)e.exp.rent=v;
    v=grtMoney('gp-dep');if(v===undefined)return false;if(v)e.exp.dep=v;
    v=grtVal('gp-start');if(v)e.exp.start=v;
    v=grtNum('gp-dur');if(v)e.exp.dur=v;
    v=grtNum('gp-payday');if(v)e.exp.payDay=Math.min(28,Math.max(1,v));
    v=grtVal('gp-prefs');if(v!=='')e.exp.prefs=v;
    v=grtVal('gp-restr');if(v!=='')e.exp.restrict=v;
  }
  if(step===5){
    v=grtNum('gp-offerrent');if(v)e.offerRent=v;
  }
  if(step===9){
    e.finalMeters={water:grtVal('gp-fw'),elec:grtVal('gp-fe'),gas:grtVal('gp-fg')};
    v=grtVal('gf-miss');
    if(v!=='')e.cond.missing=v.split(/[,،]+/).map(function(x){return x.trim()}).filter(function(x){return x});
  }
  grgSave(e);
  return true;
}
function grtGuard(e,step){
  if(!e)return 'ابتدا یک ملک ثبت کنید.';
  var p=e.prop;
  if(step===1&&!(p.title&&p.hood&&p.area))return 'عنوان، محله و متراژ ملک را کامل کنید.';
  if(step===2&&!grtCondDone(e))return 'وضعیت همهٔ موارد ملک را ثبت کنید.';
  if(step===3&&!(e.exp.rent&&e.exp.dep))return 'مبلغ اجاره و ودیعهٔ مدنظر را مشخص کنید.';
  if(step===4&&e.elig.verdict!=='eligible')return 'بررسی صلاحیت هنوز کامل نشده است.';
  if(step===5&&!(e.mgmt&&e.mgmt.signed))return 'قرارداد مدیریت را امضا کنید.';
  if(step===6&&!e.tenant.selected)return 'مستأجر را انتخاب کنید.';
  if(step===7&&!(e.handover&&e.handover.initial&&e.handover.initial.done))return 'تحویل اولیه را ثبت کنید.';
  if(step===8&&e.status!=='returning')return 'فرآیند بازگشت را آغاز کنید.';
  return '';
}
ACT.grtBack=function(){var d=wd('grt');if(d.step>1)d.step--;save();renderCurrent()};
ACT.grtStart=function(){
  if(!S.auth){go('auth');return}
  var e=grtNew();
  go('grt');toast('پروندهٔ '+e.id+' ایجاد شد — مرحلهٔ ۱: اطلاعات ملک');
};
ACT.grtVerifyOwner=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,1);
  var nid=(grtVal('gp-nid')||'').replace(/\D/g,'');
  if(!validNationalId(nid)){lookupStatus('gk-nid','err','کد ملی معتبر نیست؛ ۱۰ رقم و رقم کنترلی را بررسی کنید.');return}
  e.ownerNid=nid;
  if(!lkConfig().identityEndpoint){
    e.verify.owner='format';grgSave(e);renderCurrent();
    lookupStatus('gk-nid','warn','کد ملی از نظر قالب معتبر است. تأیید رسمی هویت به سرویس مجاز نیاز دارد و در این نسخه انجام نمی‌شود.');
    return;
  }
  lookupStatus('gk-nid','load','در حال استعلام هویت...');
  lkIdentityName(nid).then(function(r){
    if(!r.ok){e.verify.owner='none';lookupStatus('gk-nid','err','هویت تأیید نشد؛ اطلاعات را دستی وارد کنید یا بعداً تلاش کنید.')}
    else{e.verify.owner='official';if(r.name)e.ownerName=r.name;lookupStatus('gk-nid','ok','هویت صاحب‌ملک تأیید شد'+(r.name?(' — '+esc(r.name)):''))}
    grgSave(e);renderCurrent();
  });
};
ACT.grtFac=function(el){
  var e=grtCur();if(!e)return;
  var f=el.getAttribute('data-f'),arr=e.prop.facilities=e.prop.facilities||[],i=arr.indexOf(f);
  if(i>=0)arr.splice(i,1);else arr.push(f);
  grgSave(e);renderCurrent();
};
ACT.grtPostal=function(){
  var e=grtCur();if(!e)return;
  var code=grtVal('gp-postal').replace(/\D/g,'');
  if(!validPostalCode(code)){lookupStatus('gk-postal','err','کد پستی باید ۱۰ رقم باشد و با صفر شروع نشود.');return}
  lookupStatus('gk-postal','load','در حال استعلام نشانی...');
  lkPostalAddress(code).then(function(r){
    if(!r.ok){lookupStatus('gk-postal','err',r.why==='unavailable'?'سرویس نشانی در دسترس نیست؛ نشانی را دستی وارد کنید.':'نشانی‌ای برای این کد پیدا نشد؛ دستی وارد کنید.');return}
    e.prop.postal=code;e.prop.addr=r.addr;
    var a=document.getElementById('gp-addr');if(a)a.value=r.addr;
    grgSave(e);lookupStatus('gk-postal','ok',(r.approx?'نشانی تقریبی':'نشانی')+' دریافت شد؛ پلاک را بررسی کنید.');
  });
};
ACT.grtRate=function(el){
  var e=grtCur();if(!e)return;
  grtCollect(e,wd('grt').step);
  var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');
  var it=grtCondSeed(e).filter(function(x){return x.k===k})[0];
  if(!it)return;
  it.rate=v;grgSave(e);renderCurrent();
};
ACT.grtFurnAdd=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,wd('grt').step);
  var v=grtVal('gf-new');if(!v){toast('نام کالا را وارد کنید');return}
  e.cond.furniture=e.cond.furniture||[];
  if(e.cond.furniture.indexOf(v)<0)e.cond.furniture.push(v);
  grgSave(e);renderCurrent();
};
ACT.grtFurnDel=function(el){
  var e=grtCur();if(!e)return;
  grtCollect(e,wd('grt').step);
  e.cond.furniture.splice(+el.getAttribute('data-i'),1);grgSave(e);renderCurrent();
};
function grtHandlePhoto(inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  var e=grtCur();if(!e)return;
  var k=inp.getAttribute('data-grt-photo');
  var it=grtCondSeed(e).filter(function(x){return x.k===k})[0];
  if(!it)return;
  var url=URL.createObjectURL(f),img=new Image();
  img.onload=function(){
    var max=520,w=img.width||1,h=img.height||1,r=Math.min(1,max/Math.max(w,h));
    w=Math.max(1,Math.round(w*r));h=Math.max(1,Math.round(h*r));
    var cv=document.createElement('canvas');cv.width=w;cv.height=h;
    var data='';
    try{cv.getContext('2d').drawImage(img,0,0,w,h);data=cv.toDataURL('image/jpeg',0.6)}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:567',err,'caught');data=''}
    URL.revokeObjectURL(url);
    if(!data||data.length>200000){toast('تصویر بسیار بزرگ است؛ کوچک‌تر کنید');return}
    it.photos=it.photos||[];it.photos.push({at:Date.now(),d:data});
    if(it.photos.length>2)it.photos.shift();
    grgSave(e);renderCurrent();toast('تصویر ثبت شد');
  };
  img.onerror=function(){URL.revokeObjectURL(url);toast('این فایل تصویر خوانده نشد')};
  img.src=url;
}
ACT.grtPhotoDel=function(el){
  var e=grtCur();if(!e)return;
  grtCollect(e,wd('grt').step);
  var it=grtCondSeed(e).filter(function(x){return x.k===el.getAttribute('data-k')})[0];
  if(it){it.photos=[];grgSave(e);renderCurrent()}
};
ACT.grtUseRec=function(){
  var e=grtCur();if(!e)return;
  var o=grtOfferOf(e);if(!o.rec){toast('برای محاسبه، محله و متراژ را کامل کنید');return}
  e.exp.rent=o.rec;e.exp.dep=e.exp.dep||findH(e.prop.hood).avgDep;
  grgSave(e);renderCurrent();toast('پیشنهاد محلینو اعمال شد');
};
ACT.grtEligRun=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,1);grtCollect(e,2);grtCollect(e,3);
  var v=grtEligVerdict(e);
  grtLog(e,'بررسی صلاحیت: '+grtVerdictText(v));grgSave(e);renderCurrent();
  toast('صلاحیت: '+grtVerdictText(v));
};
ACT.grtReserve=function(){
  toast('در حال استعلام ظرفیت تضمین...');
  grtCheckReserve().then(function(r){
    if(CURRENT==='grt')renderCurrent();
    toast(r.status==='ok'?('ظرفیت صندوق: '+rial(r.amount)):(r.status==='error'?'استعلام ظرفیت ممکن نشد':'اتصال صندوق تضمین برقرار نیست — حالت مبتنی بر وصول'));
  });
};
ACT.grtOfferCalc=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,5);grgSave(e);renderCurrent();
};
ACT.grtAccept=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,5);
  if(!grtAcceptOffer(e))return;
  e.mgmt={code:'MG-'+String(Date.now()).slice(-8),ownerAck:false,grtAck:false,signed:false,at:Date.now()};
  e.offerStart=e.exp.start||'';
  grgSave(e);renderCurrent();toast('پیشنهاد ثبت شد — قرارداد مدیریت آمادهٔ امضا است');
};
ACT.grtMgmtSign=function(){
  var e=grtCur();if(!e||!e.offer)return;
  e.mgmt=e.mgmt||{code:'MG-'+String(Date.now()).slice(-8)};
  e.mgmt.ownerAck=true;e.mgmt.grtAck=true;e.mgmt.signed=true;e.mgmt.signedAt=Date.now();
  S.contracts.push({code:e.mgmt.code,draftCode:e.mgmt.code,kind:'grt-mgmt',title:'قرارداد مدیریت اجاره — '+esc(e.prop.title||e.id),
    t:Date.now(),req:addReq('grt','قرارداد','قرارداد مدیریت '+e.mgmt.code,'کامل شد','سرویس اجارهٔ تضمینی'),detail:true,status:'signed_internal',grtId:e.id,
    doc:{kind:'grt-mgmt',code:e.mgmt.code,date:Date.now(),status:'signed',finalized:true,offer:e.offer,prop:e.prop}});
  grtLog(e,'قرارداد مدیریت امضا شد');grgSave(e);renderCurrent();toast('قرارداد مدیریت ثبت شد — '+e.mgmt.code);
};
ACT.grtMgmtView=function(){
  var e=grtCur();if(!e)return;
  openModal('<h3>قرارداد مدیریت اجاره</h3><div class="doc-preview" style="max-height:62vh;margin-top:10px">'+grtMgmtDocHTML(e,false)+'</div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="grtMgmtPrint">دریافت PDF</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div>');
};
ACT.grtMgmtPrint=function(){
  var e=grtCur();if(!e)return;
  toast('در پنجرهٔ چاپ، «ذخیره به‌صورت PDF» را انتخاب کنید');
  printDoc(grtMgmtDocHTML(e,true),'قرارداد-مدیریت-'+(e.mgmt?e.mgmt.code:e.id));
};
ACT.grtPublish=function(){
  var e=grtCur();if(!e)return;
  if(grtPublish(e)){grtFetchLeads(e).then(function(){if(CURRENT==='grt')renderCurrent()});renderCurrent()}
};
ACT.grtLeads=function(){
  var e=grtCur();if(!e)return;
  grtFetchLeads(e).then(function(r){
    if(CURRENT==='grt')renderCurrent();
    toast(r.ok?('درخواست‌ها دریافت شد'+(r.added?(' — '+fa(r.added,0)+' مورد جدید'):'')):'دریافت درخواست‌ها ممکن نشد');
  });
};
ACT.grtScore=function(el){
  var e=grtCur();if(!e)return;
  var a=e.tenant.apps.filter(function(x){return x.id===el.getAttribute('data-id')})[0];
  if(!a)return;
  var nid=a.nid||'';
  if(nid&&validNationalId(nid)){a.verify=lkConfig().identityEndpoint?a.verify:'format'}
  grtAppScore(e,a);grgSave(e);renderCurrent();
};
ACT.grtPick=function(el){
  var e=grtCur();if(!e)return;
  if(grtSelectTenant(e,el.getAttribute('data-id'))){
    grtOpenRentContract(e);renderCurrent();toast('مستأجر تأیید شد — حالا اجاره‌نامه را تنظیم کنید');
  }
};
ACT.grtReject=function(el){
  var e=grtCur();if(!e)return;
  var a=e.tenant.apps.filter(function(x){return x.id===el.getAttribute('data-id')})[0];
  if(a){a.status='rejected';grgSave(e);renderCurrent()}
};
ACT.grtMakeCon=function(){
  var e=grtCur();if(!e)return;
  var w=grtOpenRentContract(e);
  if(!w){toast('ابتدا مستأجر را تأیید کنید');return}
  wfSet('rent',w.id);go('rent');toast('فرم اجاره‌نامه باز شد — پس از امضا به این پرونده بازمی‌گردید');
};
ACT.grtOpenCon=function(){
  var e=grtCur();if(!e||!e.rentWf)return;
  wfSet('rent',e.rentWf);go('rent');
};
ACT.grtBackToEnr=function(){
  var e=grtOf((wf('rent')||{}).data?wf('rent').data.grtId:'');
  if(!e){go('grt');return}
  wfSet('grt',e.wf);go('grt');
};
ACT.grtHoSave=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,7);
  if(!e.cond.meters||!Object.keys(e.cond.meters).length)e.cond.meters={};
  if(!e.inspections.initial){
    if(!grtCondDone(e)){toast('وضعیت اولیهٔ ملک کامل ثبت نشده است');return}
    e.inspections.initial=grtSnapshot(e,'initial');
  }
  var ok=grtInitialHandover(e,{date:grtVal('gp-hodate'),keys:grtVal('gp-hokeys'),
    water:grtVal('gp-howater'),elec:grtVal('gp-hoelec'),gas:grtVal('gp-hogas'),
    ackOwner:grtVal('gp-hoacko'),ackTenant:grtVal('gp-hoackt')});
  if(ok){grgSave(e);renderCurrent();toast('سرویس آغاز شد — تقویم مالی ایجاد گردید')}
};
ACT.grtReport=function(){
  var e=grtCur();if(!e)return;
  openModal('<h3>گزارش بازرسی و تحویل</h3><div class="doc-preview" style="max-height:62vh;margin-top:10px">'+grtReportHTML(e,false)+'</div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="grtReportPrint">دریافت PDF</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div>');
};
ACT.grtReportPrint=function(){
  var e=grtCur();if(!e)return;
  toast('در پنجرهٔ چاپ، «ذخیره به‌صورت PDF» را انتخاب کنید');
  printDoc(grtReportHTML(e,true),'گزارش-بازرسی-'+e.id);
};
ACT.grtDocs=function(){
  var e=grtCur();if(!e)return;
  var rows=[];
  if(e.mgmt&&e.mgmt.signed)rows.push(['قرارداد مدیریت اجاره',e.mgmt.code,'grtMgmtPrint']);
  if(e.contractCode)rows.push(['اجاره‌نامهٔ مسکونی',e.contractCode,'grtConPrint']);
  if(e.inspections.initial)rows.push(['گزارش بازرسی',(e.inspections.final?'اولیه و پایانی':'اولیه'),'grtReportPrint']);
  if(!rows.length){toast('سندی ثبت نشده است');return}
  openModal('<h3>اسناد پروندهٔ '+esc(e.id)+'</h3><div class="panel-list" style="margin-top:10px">'+
  rows.map(function(r){return '<button class="panel-item" data-act="'+r[2]+'"><span class="pi">'+ico('con',16)+'</span><span style="flex:1;text-align:start">'+r[0]+'</span><span class="badge b-info" dir="ltr">'+esc(r[1])+'</span></button>'}).join('')+
  '</div><div class="fs-actions" style="margin-top:12px"><button class="btn" data-act="closeModal">بستن</button></div>');
};
ACT.grtConPrint=function(){
  var e=grtCur();
  var rw=e&&e.rentWf?wfOf(e.rentWf):null;
  if(!rw){toast('اجاره‌نامه‌ای یافت نشد');return}
  DOC_SNAP=conSnapshot(rw.data,'rent');
  toast('در پنجرهٔ چاپ، «ذخیره به‌صورت PDF» را انتخاب کنید');
  printContract(DOC_SNAP);
};
ACT.grtConDoc=function(){
  var e=grtCur();
  var rw=e&&e.rentWf?wfOf(e.rentWf):null;
  if(!rw){toast('اجاره‌نامه‌ای یافت نشد');return}
  var snap=conSnapshot(rw.data,'rent');
  openModal('<h3>اجاره‌نامه</h3><div class="doc-preview" style="max-height:62vh;margin-top:10px">'+contractDocHTML(snap,false)+'</div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="grtConPrint">دریافت PDF</button><button class="btn btn-sm" data-act="closeModal">بستن</button></div>');
};
ACT.grtRole=function(el){
  var e=grtCur();if(!e)return;
  e.role=el.getAttribute('data-v')==='tenant'?'tenant':'owner';
  grgSave(e);renderCurrent();
};
ACT.grtLeadAdd=function(){
  var e=grtCur();if(!e)return;
  var nm=grtVal('gp-la-name'),mb=grtVal('gp-la-mobile').replace(/\D/g,''),nid=grtVal('gp-la-nid').replace(/\D/g,'');
  var inc=grtMoney('gp-la-income'),ppl=grtNum('gp-la-people');
  if(!nm||!mb){toast('نام و شمارهٔ تماس لازم است');return}
  var a={id:'LA-'+String(Date.now()).slice(-6),name:nm,mobile:mb,nid:nid,income:inc||0,people:ppl||1,
    move:Date.now(),note:grtVal('gp-la-note'),status:'new',verify:'none',score:null,at:Date.now(),src:'tenant'};
  if(nid){if(!validNationalId(nid)){toast('کد ملی معتبر نیست');return}a.verify=lkConfig().identityEndpoint?'none':'format'}
  e.tenant.apps.unshift(a);
  grtLog(e,'درخواست مستأجر «'+nm+'» ثبت شد');grgSave(e);renderCurrent();toast('درخواست ثبت و برای بررسی ارسال شد');
};
ACT.grtRun=function(){
  var e=grtCur();if(!e)return;
  var n=grtRunSchedule(e);
  if(CURRENT==='grt')renderCurrent();
  toast(n?'وضعیت سررسیدها به‌روز شد':'سررسید جدیدی نیست');
};
ACT.grtPay=function(el){
  var e=grtCur();if(!e)return;
  var n=+el.getAttribute('data-n');
  if(grtTenantPay(e,n,grtVal('gp-ref'))){
    if(CURRENT==='grt')renderCurrent();
    toast('پرداخت ثبت شد — پس از تأیید وصول، پرداخت به صاحب‌ملک انجام می‌شود');
  }
};
ACT.grtSettle=function(el){
  var e=grtCur();if(!e)return;
  var n=+el.getAttribute('data-n');
  if(grtIsDemo()){grtSettleCycle(e,n,{demo:true});toast('تأیید نمایشی انجام شد (بدون اتصال به سامانهٔ تسویه)')}
  else grtPollSettle(e,n);
};
ACT.grtReqPick=function(el){
  var e=grtCur();if(!e)return;
  var it=grtItemSvc(el.getAttribute('data-k'));
  var i=document.getElementById('gq-title');
  if(i&&!i.value&&it)i.value=it.t;
  e._reqItem=el.getAttribute('data-k');
  if(el.parentNode&&el.parentNode.querySelectorAll){
    Array.prototype.forEach.call(el.parentNode.querySelectorAll('.chip'),function(c){c.classList.remove('on')});
  }
  el.classList.add('on');
  save();
};
ACT.grtReqAdd=function(){
  var e=grtCur();if(!e)return;
  var title=grtVal('gq-title');
  if(!title){toast('عنوان درخواست را بنویسید');return}
  var k=e._reqItem||'';e._reqItem='';
  var r=grtAddReq(e,title,k,e.role==='tenant'?'tenant':'owner');
  grgSave(e);renderCurrent();toast('درخواست ثبت شد — مسئولیت: '+(r.resp==='owner'?'صاحب‌ملک':r.resp==='tenant'?'مستأجر':r.resp==='included'?'شامل سرویس':'نامشخص'));
};
ACT.grtReqOk=function(el){
  var e=grtCur();if(!e)return;
  grtReqApprove(e,el.getAttribute('data-id'),true);renderCurrent();toast('هزینه تأیید شد');
};
ACT.grtReqNo=function(el){
  var e=grtCur();if(!e)return;
  grtReqApprove(e,el.getAttribute('data-id'),false);renderCurrent();toast('هزینه رد شد — از حساب شما چیزی کسر نمی‌شود');
};
ACT.grtReqGo=function(el){
  var e=grtCur();if(!e)return;
  var rid=el.getAttribute('data-id');
  var r=e.reqs.filter(function(x){return x.id===rid})[0];
  if(!r)return;
  if(!r.item){toast('مورد مرتبط با درخواست مشخص نشده است');return}
  var it=grtItemSvc(r.item);
  if(!it||!it.svc){toast('برای این مورد، خدمت متناظری در فهرست خدمات نیست');return}
  var box=document.getElementById('rq-'+rid);
  if(box)box.innerHTML='<span class="note">در حال دریافت برآورد...</span>';
  svcQuote(it.svc[0],it.svc[1],1,{address:e.prop.addr}).then(function(q){
    r.quote=q;r.ci=it.svc[0];r.ii=it.svc[1];grgSave(e);renderCurrent();
  }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:805',null,'caught');if(box)box.innerHTML='<span class="note">برآورد ممکن نشد</span>';toast('دریافت برآورد ممکن نشد')});
};
ACT.grtExec=function(el){
  var e=grtCur();if(!e)return;
  grtReqExecute(e,el.getAttribute('data-id')).then(function(o){
    if(CURRENT==='grt')renderCurrent();
    if(o)toast('سفارش خدمات ثبت شد — '+o.id);
  });
};
ACT.grtReqSync=function(){
  var e=grtCur();if(!e)return;
  grtSyncReqs(e).then(function(n){if(CURRENT==='grt')renderCurrent();toast(n?('وضعیت '+fa(n,0)+' درخواست به‌روز شد'):'درخواست فعالی برای همگام‌سازی نیست')});
};
ACT.grtStartRet=function(){
  var e=grtCur();if(!e)return;
  if(grtStartReturn(e)){var d=wd('grt');d.step=9;grgSave(e);go('grt');toast('فرآیند بازگشت آغاز شد — بازرسی پایانی را انجام دهید')}
};
ACT.grtFinalStart=function(){
  var e=grtCur();if(!e)return;
  e.cond.items.forEach(function(i){i.rate0=i.rate});
  e.status='returning';grgSave(e);
  var d=wd('grt');d.step=9;renderCurrent();toast('بازرسی پایانی را با همان ساختار تکمیل کنید');
};
ACT.grtFinalSave=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,2);grtCollect(e,9);
  e.inspections.final=grtSnapshot(e,'final');
  grtRunDamage(e);
  grtLog(e,'بازرسی پایانی ثبت شد');grgSave(e);renderCurrent();toast('بازرسی پایانی ثبت و مقایسه انجام شد');
};
ACT.grtResp=function(el){
  var e=grtCur();if(!e)return;
  var costEl=document.querySelector('.gcost[data-k="'+el.getAttribute('data-k')+'"]');
  grtDamageDecide(e,el.getAttribute('data-k'),el.getAttribute('data-v'),costEl?costEl.value:'');
  renderCurrent();
};
ACT.grtFinalHo=function(){
  var e=grtCur();if(!e)return;
  grtCollect(e,9);
  if(!e.inspections.final){toast('ابتدا بازرسی پایانی را ثبت کنید');return}
  var ok=grtFinalHandover(e,{date:grtVal('gp-frdate'),keys:grtVal('gp-frkeys'),ackOwner:grtVal('gp-fracko'),ackTenant:grtVal('gp-frackt')});
  if(ok)renderCurrent(),toast('بازگشت ملک ثبت شد — حالا تسویهٔ نهایی');
};
ACT.grtClose=function(){
  var e=grtCur();if(!e)return;
  if(grtSettleClose(e)){renderCurrent();toast('پرونده بسته شد — ودیعه آزاد گردید')}
};
ACT.grtAckIns=function(){
  var e=grtCur();if(!e)return;
  var a=(e.tenant.apps||[]).filter(function(x){return x.id===e.tenant.selected})[0]||{};
  if(e.handover&&e.handover.initial){e.handover.initial.ack.tenant=a.name||'مستأجر';e.handover.initial.tenantAckAt=Date.now();grgSave(e);renderCurrent();toast('صورت‌جلسهٔ تحویل تأیید شد')}
  else toast('صورت‌جلسه‌ای برای تأیید نیست');
};
ACT.grtCancelEnr=function(){
  var e=grtCur();if(!e)return;
  openModal('<h3>لغو پروندهٔ '+esc(e.id)+'</h3><p class="note">پرونده‌های دیگر و فلوهای دیگر این مسیر دست‌نخورده می‌مانند. پرداخت‌های انجام‌شده و اسناد بایگانی باقی می‌مانند.</p>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="grtCancelOk" data-id="'+e.id+'">لغو این پرونده</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.grtCancelOk=function(el){
  var e=grtOf(el.getAttribute('data-id'));
  if(!e){closeModal();return}
  e.status='cancelled';
  var w=wfOf(e.wf);
  if(w){w.cancelled=true;if(S.active.grt===w.id){var live=wfLive('grt');if(live.length)S.active.grt=live[0].id;else delete S.active.grt}}
  S.reqs.forEach(function(r){if(r.wf===e.wf&&reqOpen(r))r.status='لغو شد'});
  grtLog(e,'پرونده لغو شد');grtAudit(e,'cancel',{});grgSave(e);
  closeModal();renderCurrent();toast('پرونده لغو شد');
};
document.addEventListener('change',function(ev){
  var t=ev.target;
  if(t&&t.getAttribute&&t.getAttribute('data-grt-photo'))grtHandlePhoto(t);
});
function setMenuOpen(open){
  document.body.classList.toggle('sideopen',!!open);
  var b=document.querySelector('.menubtn');
  if(b){b.setAttribute('aria-expanded',open?'true':'false')}
}
document.addEventListener('keydown',function(e){
  var t=e.target;
  var modal=$('#modal-root');
  if(e.key==='Escape'){
    if(modal&&modal.classList.contains('on')){closeModal();return}
    if(document.body.classList.contains('sideopen')){setMenuOpen(false);return}
    return;
  }
  if(e.key==='Tab'&&modal&&modal.classList.contains('on')){
    var items=$$('#modal-root .modal button:not([disabled]),#modal-root .modal a[href],#modal-root .modal input:not([disabled]),#modal-root .modal select:not([disabled]),#modal-root .modal textarea:not([disabled]),#modal-root .modal [tabindex="0"]');
    if(!items.length)return;
    var first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    return;
  }
  if((e.key==='Enter'||e.key===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'){e.preventDefault();t.click()}
});
document.addEventListener('click',function(e){
  var t=e.target;
  if(!t||!t.closest)return;
  var el;
  if(document.body.classList.contains('sideopen')&&t.closest('#side')&&!t.closest('.sfh')){setMenuOpen(false)}
  el=t.closest('[data-cv]');
  if(el){
    var lab=(el.textContent||'').replace(/^\s+|\s+$/g,'');
    usrC(lab);
    try{ceVal(moneyChip(el))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:909',err,'caught');console.error('ceVal',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}
    return;
  }
  el=t.closest('[data-cq]');
  if(el){
    try{ceSend(el.getAttribute('data-cq'))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:914',err,'caught');console.error('ceSend',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}
    return;
  }
  el=t.closest('[data-cf]');
  if(el){
    usrC((el.textContent||'').replace(/^\s+|\s+$/g,''));
    try{ceStart(el.getAttribute('data-cf'))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:920',err,'caught');console.error('ceStart',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}
    return;
  }
  el=t.closest('[data-cba]');
  if(el){
    var f2=CBACT[el.getAttribute('data-cba')];
    if(f2){try{f2(el)}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:926',err,'caught');console.error('CBACT['+el.getAttribute('data-cba')+']',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}}
    return;
  }
  el=t.closest('[data-w]');
  if(el){
    try{wizardNav(el.getAttribute('data-m'),el.getAttribute('data-w'))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:931',err,'caught');console.error('wizardNav',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}
    return;
  }
  el=t.closest('[data-jump]');
  if(el){
    try{jumpTo(el.getAttribute('data-m'),+el.getAttribute('data-jump'))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:936',err,'caught');console.error('jumpTo',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}
    return;
  }
  el=t.closest('[data-act]');
  if(el){
    var f=ACT[el.getAttribute('data-act')];
    if(f){try{f(el,e)}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:942',err,'caught');console.error('ACT['+el.getAttribute('data-act')+']',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}}
    return;
  }
  el=t.closest('[data-view]');
  if(el){try{go(el.getAttribute('data-view'))}catch(err){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:946',err,'caught');console.error('go',err);E24.toastErr('یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.')}}
});
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-imp]'):null;if(b){ceImpSet(b.getAttribute('data-imp'),+b.getAttribute('data-v'));return}});
document.addEventListener('change',function(e){var n=e.target&&e.target.closest?e.target.closest('[data-pt-num]'):null;if(n){ceNumSet(n.getAttribute('data-pt-num'),n.value);return}});
document.addEventListener('input',function(e){
  var t=e.target;
  if(!t||!t.hasAttribute)return;
  if(t.hasAttribute('data-paytxt')){
    var dg=pd(t.value).replace(/[^0-9]/g,'').slice(0,14);
    t.value=dg;
    var amt=10*Number(dg)||0;
    var rate=PAYM.ctx?PAYM.ctx.rate:1;
    var unit=PAYM.ctx?PAYM.ctx.unit:'';
    var fee=Math.round(amt*0.005);
    var eA=document.getElementById('pay-amt');if(eA){eA.textContent=rial(amt)}
    var eU=document.getElementById('pay-units');if(eU){eU.textContent=fa(Math.floor(amt/rate),0)+' '+unit}
    var eF=document.getElementById('pay-fee');if(eF){eF.textContent=rial(fee)}
    var eT=document.getElementById('pay-total');if(eT){eT.textContent=rial(amt+fee)}
    if(PAYM.mode==='invb'){wd('invb').data.payAmt=String(amt);save()}
    else if(PAYM.ctx){PAYM.amt=String(amt)}
    return;
  }
  if(t.hasAttribute('data-ep')){
    var pi=+t.getAttribute('data-ep');
    var DP=wd('buy').data;
    defPay(DP);
    var v=pd(t.value).replace(/[^0-9]/g,'').slice(0,3);
    t.value=v;
    DP.pay.pcts[pi]=+v||0;
    var s=0;
    DP.pay.pcts.forEach(function(x){s+=x});
    var eS=document.getElementById('paysum');
    if(eS){eS.textContent='جمع: '+fa(s,0);eS.style.color=(Math.abs(s-100)<0.01?'#2e9e5b':'#d9534f')}
    save();
    return;
  }
  if(t.hasAttribute('data-dt')){
    var k=t.getAttribute('data-dt'),side=+t.getAttribute('data-side');
    var DB=wd('buy').data;
    defPR(DB);
    var tgt=(k==='floorR')?DB.PR.floorR:DB.PR[k];
    var mn=+t.getAttribute('data-min'),mx=+t.getAttribute('data-max');
    var v2=pd(t.value).replace(/[^0-9]/g,'');
    t.value=v2;
    if(v2!==''){
      var n=Math.max(mn,Math.min(mx,Number(v2)*(k==='ppm'?10:1)));
      tgt[side]=n;save();drLabel(k,tgt);
      var row=t.parentNode;
      if(row){
        var rg=row.querySelector('[data-dr="'+k+'"][data-side="'+side+'"]');
        if(rg){rg.value=n}
      }
    }
    return;
  }
  if(t.hasAttribute('data-tk')){
    var k2=t.getAttribute('data-tk');
    var row2=t.parentNode;
    var rg2=row2?row2.querySelector('[data-rk="'+k2+'"]'):null;
    var v3=pd(t.value).replace(/[^0-9]/g,'');
    if(rg2&&v3!==''){
      var n2=+v3;
      if(!isNaN(n2)){
        var mn2=+rg2.getAttribute('data-min');
        var mx2=+rg2.getAttribute('data-max');
        n2=Math.max(mn2,Math.min(mx2,n2));
        rg2.value=n2;
        var ev;
        try{ev=new Event('input');rg2.dispatchEvent(ev)}catch(e2){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1014',e2,'caught');}
      }
    }
    return;
  }
  if(t.hasAttribute('data-rk')){
    var k3=t.getAttribute('data-rk');
    var row3=t.parentNode;
    var tx=row3?row3.querySelector('[data-tk="'+k3+'"]'):null;
    if(tx){tx.value=t.value}
    var lb=row3?row3.querySelector('[data-lbl="'+k3+'"]'):null;
    if(!lb){
      lb=row3?row3.querySelector('b[id="rv-'+k3+'"]'):null;
    }
    if(!lb){
      var all=row3?row3.querySelectorAll('b'):[];
      var j;
      for(j=0;j<all.length;j++){
        if(all[j].id===('rv-'+k3)){lb=all[j];break}
      }
    }
    if(lb&&RNGF[k3]){lb.textContent=RNGF[k3](+t.value)}
  }
});

/* ═══ ۱۱.۶) اجارهٔ تضمینی — مدیریت کامل اجاره توسط محلینو ═══ */
/* Optional secure config: window.MAHALINO_GRT={reserveEndpoint,leadsEndpoint,settlementEndpoint}.
   Provider credentials stay server-side; guarantee capacity is never assumed locally. */
var GRT_API={reserveEndpoint:null,leadsEndpoint:null,settlementEndpoint:null};
function grtCfg(){return (window.MAHALINO_GRT&&typeof window.MAHALINO_GRT==='object')?window.MAHALINO_GRT:GRT_API}
function grtIsDemo(){return !grtCfg().settlementEndpoint}
var GRT_MGMT_PCT=7;
var GRT_GUARANTEE_MONTHS=3;
var GRT_MIN_RATIO=2;
var GRT_SCALE=[{k:'ok',l:'سالم'},{k:'wear',l:'ساییدگی عادی'},{k:'fix',l:'نیازمند تعمیر'},{k:'dmg',l:'آسیب'}];
var GRT_ITEMS=[
{k:'walls',t:'دیوارها و سقف',g:'سازه',svc:[3,0]},
{k:'floor',t:'کفپوش',g:'سازه',svc:[3,1]},
{k:'doors',t:'درب و پنجره',g:'سازه'},
{k:'elec',t:'تأسیسات برقی',g:'تأسیسات',svc:[0,2]},
{k:'water',t:'لوله‌کشی و فاضلاب',g:'تأسیسات',svc:[0,1]},
{k:'heat',t:'گرمایش و پکیج',g:'تأسیسات',svc:[0,0]},
{k:'cool',t:'سرمایش و کولر',g:'تأسیسات',svc:[2,1]},
{k:'kitchen',t:'کابینت و کابینت‌ها',g:'لوازم'},
{k:'appl',t:'لوازم خانگی همراه',g:'لوازم',svc:[2,0]},
{k:'bath',t:'سرویس بهداشتی و حمام',g:'تأسیسات',svc:[0,1]},
{k:'paint',t:'نقاشی و رنگ',g:'زیبایی',svc:[3,0]},
{k:'clean',t:'نظافت عمومی',g:'زیبایی',svc:[1,0]}];
var GRT_TYPES=['آپارتمان','سوئیت','خانه ویلایی','پنت‌هاوس'];
var GRT_INCLUDED=[
'نشر آگهی و بازاریابی ملک',
'دریافت و غربال درخواست‌های مستأجر',
'هماهنگی و نظارت بر بازدیدها',
'تنظیم اجاره‌نامه و قرارداد مدیریت',
'بازرسی اولیه و پایانی با گزارش مکتوب',
'پیگیری سررسید و ثبت اجاره‌بها',
'مدیریت درخواست‌های تعمیراتی و هماهنگی با ارائه‌دهنده',
'هماهنگی تحویل و بازگرداندن ملک'];
var GRT_EXCLUDED=[
'هزینهٔ مصرفی آب، برق، گاز و شارژ',
'خسارت ناشی از بلایای طبیعی و حوادث تحت پوشش بیمهٔ ساختمان',
'تغییرات کلیدی به درخواست صاحب‌ملک',
'خسارت فراتر از سقف پوشش توافق‌شده در قرارداد',
'هزینه‌های دادرسی و مطالبات قانونی شخصی'];
var GRT_OWNER_KEEP=[
'تصمیم نهایی دربارهٔ انتخاب مستأجر',
'تأیید هزینه‌های غیرمشمول',
'همکاری در ارائهٔ اسناد مالکیت',
'تصمیم دربارهٔ فسخ یا تمدید'];
var GRT_CRIT=[
{k:'ratio',t:'نسبت درآمد به اجاره',d:'درآمد ماهانه مستأجر حداقل '+fa(GRT_MIN_RATIO,0)+' برابر اجاره'},
{k:'id',t:'اعتبارسنجی هویت',d:'تطبیق کد ملی با سرویس مجاز'},
{k:'pay',t:'سابقهٔ پرداخت',d:'از سامانهٔ اعتبارسنجی; در دسترس نباشد «در انتظار» می‌ماند'},
{k:'occ',t:'ظرفیت سکونت',d:'تعداد ساکنین متناسب با متراژ'}];
var GRT_COVER=['h1','h2','h3','h4','h5','h6'];

function grtList(){return S.grt||[]}
function grtOf(id){var i;if(!id)return null;for(i=0;i<S.grt.length;i++){if(S.grt[i].id===id)return S.grt[i]}return null}
function grtCur(){var w=wf('grt');return (w&&w.data.grtId)?grtOf(w.data.grtId):null}
function grtPrefill(){
  var rd=wfData('rent'),bd=wfData('buy'),x,b;
  if(rd&&rd.listing){x=findL(rd.listing);return {from:'فلوی اجارهٔ شما',title:x.t,hood:x.hood,area:x.m2,rooms:x.beds,age:x.age,elev:!!x.elev,park:!!x.park}}
  if(bd&&bd.blist){b=findB(bd.blist);return {from:'فلوی خرید شما',title:b.t,hood:b.hood,area:b.m2,rooms:b.beds,age:b.age,elev:!!b.elev,park:!!b.park}}
  return null;
}
function grtNew(){
  var w=wf('grt');
  if(!w||w.data.grtId){w=wfNew('grt')}
  var pf=grtPrefill();
  var e={id:'GR-'+String(Date.now()).slice(-8),wf:w.id,createdAt:Date.now(),updatedAt:Date.now(),
    prop:{title:pf?pf.title:'',from:pf?pf.from:'',hood:pf?pf.hood:'',addr:'',postal:'',type:pf?'آپارتمان':'',area:pf?pf.area:'',rooms:pf?pf.rooms:'',age:pf?pf.age:'',
      facilities:[],ownership:'شخصی',docs:{deed:'',meta:''},occupancy:'خالی',curTenant:{name:'',mobile:'',nid:'',until:''}},
    verify:{owner:'none'},
    cond:{items:[],meters:{water:'',elec:'',gas:''},furniture:[],notes:''},
    exp:{rent:'',dep:'',start:'',dur:12,payDay:5,prefs:'',restrict:''},
    offer:null,elig:{verdict:'pending',checks:[]},
    tenant:{apps:[],selected:null,listedAt:0,src:'local'},
    mgmt:null,rentWf:null,contractCode:'',contractDoc:null,
    handover:{initial:null,final:null},inspections:{initial:null,final:null},
    damage:null,cycles:[],reqs:[],ledger:[],settlement:null,log:[],status:'draft',role:'owner'};
  S.grt.unshift(e);w.data.grtId=e.id;w.data.hood=e.prop.hood||'';
  grtLog(e,'درخواست اجارهٔ تضمینی ایجاد شد');save();return e;
}
function grtLog(e,msg){if(!e.log)e.log=[];e.log.unshift({t:Date.now(),m:msg});if(e.log.length>80)e.log.pop()}
function grgSave(e){e.updatedAt=Date.now();var w=wfOf(e.wf);if(w){w.updatedAt=e.updatedAt;w.data.grtId=e.id}save()}
function grtAudit(e,k,d){S.grtAudit.unshift({t:Date.now(),id:e.id,k:k,d:d||{}});if(S.grtAudit.length>400)S.grtAudit.pop()}
function grtStatusMeta(e){
  var m={draft:['بازبینی مالک','b-warn'],review:['در انتظار بررسی صلاحیت','b-warn'],listed:['در جست‌وجوی مستأجر','b-info'],
    tenant:['مستأجر انتخاب شده','b-info'],active:['در حال اجرا','b-ok'],returning:['در فرآیند بازگشت','b-warn'],
    closed:['خاتمه‌یافته','b-ok'],cancelled:['لغوشده','b-bad']};
  var x=m[e.status]||m.draft;return '<span class="badge '+x[1]+'">'+x[0]+'</span>';
}
function grtStatusText(e){var m={draft:'بازبینی مالک',review:'در انتظار بررسی صلاحیت',listed:'در جست‌وجوی مستأجر',tenant:'مستأجر انتخاب شده',active:'در حال اجرا',returning:'در فرآیند بازگشت',closed:'خاتمه‌یافته',cancelled:'لغوشده'};return m[e.status]||m.draft}

/* ─── صلاحیت ملک ─── */
function grtEligChecks(e){
  var p=e.prop,out=[],h=p.hood?findH(p.hood):null;
  out.push({k:'own',t:'اسناد مالکیت',s:p.docs&&p.docs.deed?'pass':'pending',n:p.docs&&p.docs.deed?('ثبت‌شده: '+p.docs.deed):'سند مالکیت ثبت نشده است'});
  out.push({k:'id',t:'احراز هویت مالک',s:e.verify.owner==='official'?'pass':(e.verify.owner==='format'?'warn':'pending'),
    n:e.verify.owner==='official'?'تأیید سرویس هویت':(e.verify.owner==='format'?'فقط قالب کد ملی بررسی شد — تأیید رسمی انجام نشده':'کد ملی مالک ثبت نشده')});
  out.push({k:'addr',t:'نشانی و کد پستی',s:validPostalCode(p.postal||'')?(p.addr?'pass':'warn'):'pending',n:p.addr?('تکمیل‌شده'+(validPostalCode(p.postal||'')?'':' — کد پستی تأیید نشده')):'نشانی ثبت نشده'});
  out.push({k:'cond',t:'وضعیت اولیهٔ ملک',s:(e.cond.items.filter(function(i){return i.rate}).length>=GRT_ITEMS.length)?'pass':'pending',
    n:'ثبت‌شده: '+fa(e.cond.items.filter(function(i){return i.rate}).length,0)+' از '+fa(GRT_ITEMS.length,0)});
  out.push({k:'mkt',t:'کشش بازار محله',s:h?'pass':'pending',n:h?('میانگین اجارهٔ نمونهٔ '+h.n+' — '+MARKET.asOf):'محله انتخاب نشده'});
  out.push({k:'cov',t:'پوشش عملیاتی محلینو',s:GRT_COVER.indexOf(p.hood)>=0?'pass':'review',
    n:GRT_COVER.indexOf(p.hood)>=0?'این منطقه در فهرست پوشش است':'امکان‌سنجی سرویس در این منطقه توسط تیم عملیات انجام می‌شود'});
  if(grtCfg().eligibilityEndpoint){
    out.push({k:'legal',t:'بررسی حقوقی کارشناس',s:e.elig.legalState||'review',n:e.elig.legalState==='pass'?'تأیید کارشناس دریافت شد':'در انتظار نتیجهٔ سامانهٔ بررسی حقوقی'});
  }else{
    var docOk=!!(p.docs&&p.docs.deed)&&validPostalCode(p.postal||'')&&!!p.addr;
    out.push({k:'legal',t:'بررسی مدارک (قوانین سرویس)',s:docOk?'pass':'pending',
      n:docOk?'بررسی خودکار قواعد محلینو انجام شد — این بررسی جای تأیید human حقوقی یا ثبت رسمی را نمی‌گیرد':'برای بررسی، سند، کد پستی معتبر و نشانی کامل لازم است'});
  }
  return out;
}
function grtEligVerdict(e){
  var c=grtEligChecks(e),fail=c.filter(function(x){return x.s==='fail'}).length,
    pend=c.filter(function(x){return x.s==='pending'||(x.s==='review'&&!!grtCfg().eligibilityEndpoint)}).length;
  e.elig.checks=c;
  e.elig.verdict=fail?'ineligible':(pend?'review':'eligible');
  e.elig.checkedAt=Date.now();
  if(e.status==='draft'&&fail)e.status='review';
  if(e.status==='draft'&&!fail&&pend)e.status='review';
  return e.elig.verdict;
}
function grtVerdictText(v){return v==='eligible'?'مجاز برای ارائهٔ پیشنهاد':(v==='review'?'در انتظار تکمیل بررسی‌ها':'فعلاً غیرمجاز')}
function grtVerdictBadge(v){var m={eligible:['b-ok','مجاز'],review:['b-warn','در انتظار بررسی'],ineligible:['b-bad','غیرمجاز'],pending:['','بررسی‌نشده']};var x=m[v]||m.pending;return '<span class="badge '+x[0]+'">'+x[1]+'</span>'}

/* ─── مدل مالی و پیشنهاد ─── */
function grtMarketRent(e){
  var p=e.prop,h=p.hood?findH(p.hood):null;
  if(!h)return 0;
  var area=+p.area||75,ratio=Math.max(0.6,Math.min(1.6,area/75));
  return Math.round(h.avgRent*ratio/1000000)*1000000;
}
function grtReserve(){return S.grtReserve||{status:'unknown',amount:0,checkedAt:0,src:''}}
function grtReserveLabel(){
  var r=grtReserve();
  if(r.status==='ok')return {t:'صندوق پوشش: '+rial(r.amount),c:'b-ok'};
  if(r.status==='low')return {t:'صندوق پوشش کافی نیست',c:'b-warn'};
  if(r.status==='error')return {t:'استعلام صندوق پوشش ناموفق',c:'b-bad'};
  return {t:'ظرفیت تضمین از بک‌اند دریافت نشده',c:'b-info'};
}
function grtCheckReserve(){
  var cfg=grtCfg();
  if(!cfg.reserveEndpoint){S.grtReserve={status:'unknown',amount:0,checkedAt:Date.now(),src:'none'};save();return Promise.resolve(S.grtReserve)}
  return fetch(cfg.reserveEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({need:'guarantee-capacity'})})
    .then(function(r){return r.json()})
    .then(function(j){
      if(!j||j.ok===false)throw new Error('reserve');
      S.grtReserve={status:'ok',amount:+j.availableRials||0,checkedAt:Date.now(),src:'api'};save();return S.grtReserve;
    })
    .catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1186',null,'caught');S.grtReserve={status:'error',amount:0,checkedAt:Date.now(),src:'api'};save();return S.grtReserve});
}
function grtOfferOf(e){
  var mkt=grtMarketRent(e),exp=+e.exp.rent||0;
  var rec=mkt?Math.round(mkt*0.97/1000000)*1000000:0;
  var rent=+e.offerRent||rec||exp;
  var fee=Math.round(rent*GRT_MGMT_PCT/100/1e5)*1e5;
  var owner=rent-fee;
  var r=grtReserve(),capMonths=owner>0?Math.min(GRT_GUARANTEE_MONTHS,Math.floor(r.amount/owner)):0;
  var mode=(r.status==='ok'&&capMonths>=1)?'guaranteed':'collection';
  return {mkt:mkt,exp:exp,rec:rec,rent:rent,fee:fee,ownerMonthly:owner,pct:GRT_MGMT_PCT,
    mode:mode,capMonths:capMonths,capTotal:owner*capMonths,dur:+e.exp.dur||12,payDay:+e.exp.payDay||5,
    dep:+e.exp.dep||0,reserve:r.amount,reserveStatus:r.status};
}
function grtModeNote(o){
  return o.mode==='guaranteed'
    ? 'پرداخت به شما مستقل از وصول اجاره از مستأجر، تا سقف '+fa(o.capMonths,0)+' ماه ('+rial(o.capTotal)+') تضمین می‌شود؛ سرریز از این سقف مشمول تضمین نیست.'
    : 'پرداخت به شما پس از وصول موفق اجاره از مستأجر انجام می‌شود. در این حالت «تضمین پرداخت مستقل» وجود ندارد.';
}
function grtPrereq(){
  var out=[];
  if(grtReserve().status!=='ok')out.push('برای فعال‌سازی «پرداخت تضمینی»، استعلام ظرفیت صندوق/بیمه از بک‌اند لازم است (window.MAHALINO_GRT.reserveEndpoint).');
  if(!grtCfg().settlementEndpoint)out.push('برای تأیید قطعی وصول اجاره، اتصال به سامانهٔ تسویه لازم است (settlementEndpoint). تا آن زمان وضعیت پرداخت‌ها «نمایشی/محلی» برچسب می‌خورد.');
  if(!grtCfg().leadsEndpoint)out.push('درخواست‌های مستأجر از سامانهٔ اعلام درخواست (leadsEndpoint) دریافت می‌شود؛ بدون آن، ثبت درخواست از نمای مستأجر داخل محلینو ممکن است.');
  out.push('ثبت رسمی قرارداد در سامانهٔ ثبت انجام نمی‌شود؛ اسناد این نسخه داخلی‌اند.');
  return out;
}
function grtAcceptOffer(e){
  var o=grtOfferOf(e);
  if(!o.rent){toast('برای محاسبهٔ پیشنهاد، محله و متراژ را ثبت کنید');return false}
  e.offer=o;e.offer.acceptedAt=Date.now();e.offer.signedAt=0;e.status='review';
  grtLog(e,'شرایط سرویس تأیید شد — حالت '+(o.mode==='guaranteed'?'تضمینی':'مبتنی بر وصول'));
  grgSave(e);return true;
}
function grtAddMonths(ts,n){var d=new Date(ts);var day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);
  var dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,dim));return d.getTime()}
function grtGenCycles(e){
  if(!e.offer||e.cycles.length)return e.cycles;
  var start=e.offerStart?Date.parse(e.offerStart):Date.now();
  if(isNaN(start))start=Date.now();
  var d=new Date(start),day=Math.min(28,Math.max(1,+e.offer.payDay||5));
  var out=[];
  for(var n=1;n<=e.offer.dur;n++){
    var dd=new Date(d.getFullYear(),d.getMonth()+(n-1),day);
    out.push({n:n,due:dd.getTime(),rent:e.offer.rent,fee:e.offer.fee,
      tenant:{status:'pending',amount:0,at:0,ref:''},
      owner:{status:'scheduled',amount:e.offer.ownerMonthly,at:0,ref:'',paidFrom:'-'},
      deduct:0,notes:''});
  }
  e.cycles=out;return out;
}
function grtCycle(e,n){var i;for(i=0;i<e.cycles.length;i++){if(e.cycles[i].n===+n)return e.cycles[i]}return null}
function grtTotals(e){
  var collected=0,paidOwner=0,owedOwner=0,arrears=0,fees=0,deducted=0,due=0;
  (e.cycles||[]).forEach(function(c){
    if(c.tenant.status==='settled'||c.tenant.status==='recorded')collected+=c.tenant.amount||0;
    if(c.owner.status==='paid')paidOwner+=c.owner.amount;else if(c.owner.status!=='waived')owedOwner+=c.owner.amount;
    if(c.tenant.status==='overdue')arrears+=c.rent-(c.tenant.amount||0);
    if(c.tenant.status==='pending'&&c.due<Date.now()){due+=c.rent}
    fees+=c.fee;deducted+=c.deduct||0;
  });
  return {collected:collected,paidOwner:paidOwner,owedOwner:owedOwner,arrears:arrears+due,fees:fees,deducted:deducted,
    cycles:(e.cycles||[]).length,settled:(e.cycles||[]).filter(function(c){return c.tenant.status==='settled'}).length};
}
function grtTenantPay(e,n,ref){
  var c=grtCycle(e,n);
  if(!c)return false;
  if(c.tenant.status==='settled'||c.tenant.status==='recorded'){toast('این سررسید پرداخت شده است');return false}
  c.tenant={status:'recorded',amount:c.rent,at:Date.now(),ref:ref?('RP-'+String(ref).slice(-6)):'RP-'+String(Date.now()).slice(-6),demo:grtIsDemo()};
  grtLog(e,'پرداخت اجارهٔ دورهٔ '+fa(c.n,0)+' ثبت شد ('+c.tenant.ref+')');
  grgSave(e);
  if(grtIsDemo()){
    setTimeout(function(){grtSettleCycle(e,c.n,{demo:true})},1800);
  }else{
    grtPollSettle(e,c.n);
  }
  return true;
}
function grtPollSettle(e,n){
  var cfg=grtCfg();
  if(!cfg.settlementEndpoint)return;
  fetch(cfg.settlementEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enrollment:e.id,cycle:n})})
    .then(function(r){return r.json()})
    .then(function(j){if(j&&j.ok!==false&&j.status==='settled')grtSettleCycle(e,n,{src:'api'})})
    .catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1270',null,'caught');});
}
function grtSettleCycle(e,n,info){
  var c=grtCycle(e,n);
  if(!c||c.tenant.status==='settled')return false;
  if(c.tenant.status==='pending'){c.tenant={status:'recorded',amount:c.rent,at:Date.now(),ref:'RP-'+String(Date.now()).slice(-6),demo:true}}
  c.tenant.status='settled';c.tenant.settledAt=Date.now();c.tenant.ssrc=(info&&info.src)||'demo';
  grtLog(e,'وصول اجارهٔ دورهٔ '+fa(c.n,0)+' تأیید شد'+((info&&info.demo)||c.tenant.ssrc==='demo'?' (نمایشی)':''));
  if(e.offer&&e.offer.mode==='collection')grtPayOwner(e,c,'وصول‌شده');
  grgSave(e);
  if(CURRENT==='grt')renderCurrent();
  return true;
}
function grtPayOwner(e,c,why){
  if(!c||c.owner.status==='paid'||c.owner.status==='waived')return false;
  var amt=c.owner.amount-c.deduct;
  if(amt<0)amt=0;
  S.wallet=(S.wallet||0)+amt;
  S.wlog.unshift({d:'اجارهٔ تضمینی — دورهٔ '+fa(c.n,0)+' ('+e.id+')',a:amt,t:Date.now()});
  c.owner.status='paid';c.owner.at=Date.now();c.owner.amountPaid=amt;c.owner.ref='PAY-'+String(Date.now()).slice(-6);c.owner.why=why||'';
  e.ledger.unshift({t:Date.now(),k:'owner_payment',cycle:c.n,amount:amt,fee:c.fee,rent:c.rent,why:why||''});
  grtAudit(e,'owner_payment',{cycle:c.n,amount:amt,mode:e.offer?e.offer.mode:'-',why:why||''});
  grtLog(e,'واریز '+rial(amt)+' به کیف پول شما — دورهٔ '+fa(c.n,0));
  renderTok();grgSave(e);return true;
}
function grtHoldOwner(e,c,why){
  if(!c||c.owner.status==='paid')return false;
  c.owner.status='held';c.owner.why=why||'';
  grtLog(e,'پرداخت دورهٔ '+fa(c.n,0)+' به تعویق افتاد: '+why);
  grgSave(e);return true;
}
function grtRunSchedule(e){
  var changed=false,now=Date.now();
  (e.cycles||[]).forEach(function(c){
    if(c.tenant.status==='pending'&&c.due<now){c.tenant.status='overdue';c.tenant.overdueAt=now;changed=true;
      grtLog(e,'سررسید دورهٔ '+fa(c.n,0)+'گذشت؛ یادآوری به مستأجر ثبت شد')}
    if(e.offer&&e.offer.mode==='guaranteed'&&c.owner.status==='scheduled'&&c.due<=now){
      var capLeft=grtGuaranteeUsed(e)<e.offer.capTotal;
      if(capLeft)grtPayOwner(e,c,'تضمین (بدون نیاز به وصول)');
      else grtHoldOwner(e,c,'سقف صندوق تضمین ('+rial(e.offer.capTotal)+') تکمیل شده است');
      changed=true;
    }
    if(e.offer&&e.offer.mode==='collection'&&c.tenant.status==='settled'&&c.owner.status==='scheduled'){grtPayOwner(e,c,'وصول‌شده');changed=true}
  });
  if(changed)grgSave(e);
  return changed;
}
function grtGuaranteeUsed(e){var s=0;(e.cycles||[]).forEach(function(c){if(c.owner.status==='paid'&&c.tenant.status!=='settled')s+=c.owner.amount});return s}
function grtNextCycle(e){
  var now=Date.now(),i;
  for(i=0;i<e.cycles.length;i++){if(e.cycles[i].owner.status==='scheduled'||e.cycles[i].tenant.status==='pending'||e.cycles[i].tenant.status==='overdue')return e.cycles[i]}
  return null;
}
function grtAlerts(e){
  var out=[],now=Date.now();
  (e.cycles||[]).forEach(function(c){
    if(c.tenant.status==='overdue')out.push({s:'bad',t:'اجارهٔ دورهٔ '+fa(c.n,0)+' از '+dateFa(c.due)+' وصول نشده است'});
    if(c.owner.status==='held')out.push({s:'warn',t:'پرداخت دورهٔ '+fa(c.n,0)+' به تعویق افتاد: '+esc(c.owner.why||'')});
  });
  (e.reqs||[]).forEach(function(r){if(r.approval==='pending')out.push({s:'warn',t:'هزینهٔ «'+esc(r.title)+'» در انتظار تأیید شماست'})});
  if(e.status==='active'&&e.handover&&!e.handover.initial)out.push({s:'warn',t:'صورت‌جلسهٔ تحویل اولیه تکمیل نشده است'});
  if(e.status==='returning'&&!e.inspections.final)out.push({s:'warn',t:'بازرسی پایانی انجام نشده است'});
  if(e.elig&&e.elig.verdict==='review')out.push({s:'info',t:'بررسی صلاحیت هنوز کامل نشده است'});
  return out;
}

/* ─── مستأجر: آگهی، درخواست، ارزیابی ─── */
function grtPublish(e){
  if(e.elig.verdict!=='eligible'){toast('پیش از آگهی، بررسی صلاحیت باید کامل شود');return false}
  e.status='listed';e.tenant.listedAt=Date.now();e.tenant.src=grtCfg().leadsEndpoint?'api':'local';
  grtLog(e,'آگهی ملک منتشر شد');grgSave(e);return true;
}
function grtLeadNormalize(j){
  return {id:'LA-'+String(Date.now()).slice(-6)+'-'+Math.floor(Math.random()*99),
    name:String(j.name||j.fullName||'').slice(0,60),mobile:String(j.mobile||'').replace(/\D/g,'').slice(0,11),
    nid:String(j.nationalId||j.nid||'').replace(/\D/g,'').slice(0,10),
    income:+j.income||0,people:+j.people||1,move:+j.moveAt||Date.now(),note:String(j.note||'').slice(0,160),
    status:'new',verify:'none',score:null,at:Date.now(),src:'api'};
}
function grtFetchLeads(e){
  var cfg=grtCfg();
  if(!cfg.leadsEndpoint)return Promise.resolve({ok:false,why:'unconfigured'});
  return fetch(cfg.leadsEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enrollment:e.id,rent:e.offer?e.offer.rent:0})})
    .then(function(r){return r.json()})
    .then(function(j){
      var arr=(j&&(j.leads||j.applications))||[];
      if(!Array.isArray(arr))return {ok:false,why:'bad'};
      var added=0;
      arr.forEach(function(x){var l=grtLeadNormalize(x);if(l.name||l.mobile){e.tenant.apps.unshift(l);added++}});
      grgSave(e);return {ok:true,added:added};
    }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1360',null,'caught');return {ok:false,why:'error'}});
}
function grtAppScore(e,a){
  var rent=e.offer?e.offer.rent:(+e.exp.rent||0),rows=[];
  rows.push({k:'ratio',t:'نسبت درآمد به اجاره',s:a.income&&rent?(a.income/rent>=GRT_MIN_RATIO?'pass':'fail'):'pending',
    n:a.income?(fa(Math.round(a.income/rent*100)/100,2)+' برابر'):''});
  rows.push({k:'id',t:'اعتبارسنجی هویت',s:a.verify==='official'?'pass':(a.verify==='format'?'warn':'pending'),
    n:a.verify==='official'?'تأیید سرویس هویت':(a.verify==='format'?'فقط قالب کد ملی معتبر — تأیید رسمی انجام نشده':'استعلام نشده')});
  rows.push({k:'pay',t:'سابقهٔ پرداخت',s:a.credit==='ok'?'pass':(a.credit==='bad'?'fail':'pending'),n:a.credit==='ok'?'بدون سوءپیشینه':(a.credit==='bad'?'سوءپیشینهٔ ثبت‌شده':'سرویس اعتبارسنجی متصل نیست')});
  var maxP=+e.prop.rooms?Math.max(2,+e.prop.rooms*2):6;
  rows.push({k:'occ',t:'ظرفیت سکونت',s:a.people?(a.people<=maxP?'pass':'warn'):'pending',n:a.people?(fa(a.people,0)+' نفر / ظرفیت '+fa(maxP,0)):''});
  var pass=rows.filter(function(r){return r.s==='pass'}).length,fail=rows.filter(function(r){return r.s==='fail'}).length;
  a.score={rows:rows,pass:pass,fail:fail,total:rows.length};
  return a.score;
}
function grtSelectTenant(e,id){
  var a=e.tenant.apps.filter(function(x){return x.id===id})[0];
  if(!a)return false;
  if(!a.score)grtAppScore(e,a);
  if(a.score&&a.score.fail){toast('این درخواست با معیارهای مستند قرارداد نمی‌خواند');return false}
  e.tenant.selected=id;a.status='accepted';
  e.tenant.apps.forEach(function(x){if(x.id!==id&&x.status!=='rejected')x.status='rejected'});
  e.status='tenant';
  grtLog(e,'مستأجر «'+a.name+'» با تأیید مالک انتخاب شد');grgSave(e);return true;
}
function grtOpenRentContract(e){
  var a=e.tenant.apps.filter(function(x){return x.id===e.tenant.selected})[0];
  if(!a)return null;
  if(e.rentWf&&wfOf(e.rentWf))return wfOf(e.rentWf);
  var w=wfNew('rent');
  w.step=7;
  var h=e.prop.hood?findH(e.prop.hood):null;
  w.data={hood:e.prop.hood,listing:'',grtId:e.id,
    B:{inc:0,depB:e.exp.dep||0,rentB:e.offer?e.offer.rent:0,chg:0,incr:0},
    dur:(e.offer?e.offer.dur:12)+'ماهه',owner:S.auth?S.auth.name:'',oph:S.auth?S.auth.phone:'',
    rep:{},ctr:null};
  var c=conInit(w.data,'rent');
  c.parties.lessor={name:S.auth?S.auth.name:'',id:'',mobile:S.auth?S.auth.phone:''};
  c.parties.lessee={name:a.name||'',id:a.nid||'',mobile:a.mobile||''};
  c.prop.title=e.prop.title||(h?h.n:'ملک');
  c.prop.hood=h?h.n:'';
  c.prop.addr=e.prop.addr;c.prop.postal=e.prop.postal;c.prop.area=e.prop.area;
  c.terms.rent=e.offer?e.offer.rent:0;
  c.terms.deposit=e.exp.dep||0;
  c.terms.duration=(e.offer?e.offer.dur:12)+' ماهه';
  c.terms.paymentDay='روز '+fa(e.offer?e.offer.payDay:5,0)+' هر ماه';
  c.terms.start=e.offerStart||'';
  c.terms.notes='این ملک تحت سرویس اجارهٔ تضمینی محلینو مدیریت می‌شود. قرارداد مدیریت به شمارهٔ '+(e.mgmt?e.mgmt.code:e.id)+' ضمیمهٔ این اجاره‌نامه است.';
  e.rentWf=w.id;grgSave(e);
  return w;
}

/* ─── بازرسی ─── */
function grtCondSeed(e){
  if(!e.cond.items.length){
    e.cond.items=GRT_ITEMS.map(function(x){return {k:x.k,t:x.t,g:x.g,rate:'',note:'',photos:[]}});
  }else{
    GRT_ITEMS.forEach(function(x){if(!e.cond.items.filter(function(i){return i.k===x.k}).length)e.cond.items.push({k:x.k,t:x.t,g:x.g,rate:'',note:'',photos:[]})});
  }
  return e.cond.items;
}
function grtCondDone(e){return grtCondSeed(e).filter(function(i){return i.rate}).length>=GRT_ITEMS.length}
function grtItemSvc(k){var i;for(i=0;i<GRT_ITEMS.length;i++){if(GRT_ITEMS[i].k===k)return GRT_ITEMS[i]}return null}
function grtCostEstimate(k){
  var it=grtItemSvc(k);
  if(!it||!it.svc)return 0;
  var s=svcItem(it.svc[0],it.svc[1]);
  if(!s)return 0;
  var base=+s.base||0,rate=+s.rate||0,min=+s.min||1;
  return base+(rate?rate*min:0);
}
function grtScaleLabel(k){var i;for(i=0;i<GRT_SCALE.length;i++){if(GRT_SCALE[i].k===k)return GRT_SCALE[i].l}return '—'}
function grtRunDamage(e){
  var init=e.inspections.initial,fin=e.inspections.final;
  if(!init||!fin)return null;
  var diffs=[];
  init.items.forEach(function(a){
    var b=fin.items.filter(function(x){return x.k===a.k})[0];
    if(!b)return;
    var ORD={ok:0,wear:1,fix:2,dmg:3};
    var ai=ORD[a.rate]||0,bi=ORD[b.rate]||0;
    if(bi<=ai)return;
    var kind=bi===1?'wear':(b.missing?'missing':'damage');
    if(ai>=2&&bi>=2)kind='pre';
    diffs.push({k:a.k,t:a.t,from:a.rate,to:b.rate,kind:kind,cost:kind==='wear'||kind==='pre'?0:grtCostEstimate(a.k),
      resp:kind==='wear'?'none':(kind==='pre'?'owner':'review'),note:b.note||'',photo:!!(b.photos&&b.photos.length)});
  });
  (init.furniture||[]).forEach(function(f){
    if((fin.missing||[]).indexOf(f)>=0)diffs.push({k:'f:'+f,t:'کالای مفقود: '+f,from:'ok',to:'missing',kind:'missing',cost:0,resp:'review',note:'',photo:false});
  });
  e.damage={at:Date.now(),diffs:diffs,
    tenantLiable:diffs.filter(function(d){return d.resp==='tenant'}).reduce(function(s,d){return s+d.cost},0),
    ownerLiable:diffs.filter(function(d){return d.resp==='owner'}).reduce(function(s,d){return s+d.cost},0),
    unresolved:diffs.filter(function(d){return d.resp==='review'}).length};
  return e.damage;
}
function grtDamageDecide(e,k,resp,cost){
  if(!e.damage)return false;
  var d=e.damage.diffs.filter(function(x){return x.k===k})[0];
  if(!d)return false;
  d.resp=resp;if(cost!==undefined&&cost!=='')d.cost=+cost||0;
  e.damage.tenantLiable=e.damage.diffs.filter(function(x){return x.resp==='tenant'}).reduce(function(s,x){return s+x.cost},0);
  e.damage.ownerLiable=e.damage.diffs.filter(function(x){return x.resp==='owner'}).reduce(function(s,x){return s+x.cost},0);
  e.damage.unresolved=e.damage.diffs.filter(function(x){return x.resp==='review'}).length;
  grtLog(e,'تصمیم دربارهٔ «'+d.t+'»: '+(resp==='tenant'?'بر عهدهٔ مستأجر':resp==='owner'?'بر عهدهٔ صاحب‌ملک':'بدون کسر'));
  grgSave(e);return true;
}
function grtSnapshot(e,which){
  return {at:Date.now(),which:which,
    items:grtCondSeed(e).map(function(i){return {k:i.k,t:i.t,rate:i.rate,note:i.note||'',photos:(i.photos||[]).length}}),
    meters:{water:e.cond.meters.water||'',elec:e.cond.meters.elec||'',gas:e.cond.meters.gas||''},
    furniture:(e.cond.furniture||[]).slice(0),missing:(e.cond.missing||[]).slice(0),
    ack:{owner:e.cond.ackOwner||'',tenant:e.cond.ackTenant||''},
    notes:e.cond.notes||''};
}

/* ─── اسناد ─── */
function grtMgmtDocHTML(e,forPrint){
  var o=e.offer||{},p=e.prop,h=p.hood?findH(p.hood):null,a=e.tenant.apps.filter(function(x){return x.id===e.tenant.selected})[0];
  var fin=!!(e.mgmt&&e.mgmt.signed);
  var rows=[
    ['اجارهٔ پیشنهادی به مستأجر',rial(o.rent||0)],
    ['کمیسیون مدیریت محلینو',fa(o.pct||0,0)+'٪ — '+rial(o.fee||0)+' در ماه'],
    ['پرداخت ماهانه به صاحب‌ملک',rial(o.ownerMonthly||0)],
    ['ودیعهٔ مستأجر',rial(o.dep||0)],
    ['مدت سرویس',fa(o.dur||0,0)+' ماه'],
    ['روز پرداخت به مالک','روز '+fa(o.payDay||5,0)+' هر ماه'],
    ['حالت پرداخت',o.mode==='guaranteed'?'تضمینی (مستقل از وصول)':'مبتنی بر وصول'],
    ['سقف پوشش تضمین',(o.mode==='guaranteed'?(fa(o.capMonths||0,0)+' ماه — '+rial(o.capTotal||0)):'—')]];
  return '<div class="doc '+(fin?'registered':'draft')+'" dir="rtl">'+
  '<div class="doc-watermark">'+(fin?'نسخهٔ داخلی — ثبت رسمی انجام نشده':'پیش‌نویس — ثبت رسمی انجام نشده')+'</div>'+
  '<div class="doc-head"><div class="doc-brand">محلینو <span>سامانهٔ جامع مسکن</span></div><h1>قرارداد مدیریت اجاره (اجارهٔ تضمینی)</h1><div class="doc-sub">میان صاحب‌ملک و محلینو</div></div>'+
  '<div class="doc-meta"><div><span>شناسهٔ پرونده</span><b dir="ltr">'+esc(e.id)+'</b></div><div><span>شمارهٔ قرارداد</span><b dir="ltr">'+esc((e.mgmt&&e.mgmt.code)||'—')+'</b></div>'+
  '<div><span>تاریخ</span><b>'+fd((e.mgmt&&e.mgmt.signedAt)||Date.now())+'</b></div><div><span>منطقه</span><b>'+esc(h?h.n:'تهران')+'</b></div></div>'+
  '<div class="doc-reg warn"><b>ثبت رسمی انجام نشده است</b><br><span>این سند در محلینو تولید شده و جایگزین سند رسمی یا کد رهگیری سامانهٔ ثبت نیست.</span></div>'+
  '<section class="doc-sec"><h2>مادهٔ ۱ — طرفین</h2><table class="doc-table"><thead><tr><th>نقش</th><th>نام</th><th>کد ملی</th><th>تماس</th></tr></thead><tbody>'+
  '<tr><td>صاحب‌ملک</td><td>'+esc(e.ownerName||(S.auth?S.auth.name:'—'))+'</td><td dir="ltr">'+esc(e.ownerNid||'—')+'</td><td dir="ltr">'+esc(S.auth?S.auth.phone:'—')+'</td></tr>'+
  '<tr><td>مدیر (محلینو)</td><td>محلینو</td><td>—</td><td>پشتیبانی داخل سامانه</td></tr></tbody></table></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۲ — موضوع و محدودهٔ مدیریت</h2><p>صاحب‌ملک مدیریت فرآیند اجاره ملک زیر را به محلینو واگذار می‌کند: '+esc(p.title||(h?h.n:'—'))+
  (p.addr?(' — '+esc(p.addr)):'')+(p.area?(' — '+fa(p.area,0)+' متر'):'')+'. '+esc(p.rooms?(fa(p.rooms,0)+' اتاق'):'')+'</p>'+
  '<h3>کارهایی که محلینو انجام می‌دهد</h3><ul>'+GRT_INCLUDED.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
  '<h3>خارج از تعهد محلینو</h3><ul>'+GRT_EXCLUDED.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
  '<h3>تعهدات باقی‌ماندهٔ صاحب‌ملک</h3><ul>'+GRT_OWNER_KEEP.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۳ — شرایط مالی</h2><table class="doc-table"><tbody>'+
  rows.map(function(r){return '<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>'+
  '<p class="doc-note">'+esc(grtModeNote(o))+'</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۴ — شرایط آغاز و خاتمه</h2><p>سرویس پس از امضای این قرارداد، تکمیل بررسی صلاحیت و انجام بازرسی اولیه آغاز می‌شود. '+
  'خاتمه با '+fa(30,0)+' روز اعلام کتبی و پس از تسویهٔ حساب‌های باز انجام می‌گیرد. در صورت عدم یافتن مستأجر ظرف '+fa(45,0)+' روز، قرارداد مدیریت بدون هزینهٔ مدیریتی خاتمه می‌یابد.</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۵ — عدم پرداخت مستأجر</h2><p>'+(o.mode==='guaranteed'
    ?'در حالت تضمینی، محلینو مبلغ مادهٔ ۳ را در سررسید به صاحب‌ملک می‌پردازد و پیگیری و وصول از مستأجر بر عهدهٔ محلینو است؛ سقف این تعهد '+rial(o.capTotal||0)+' در هر دورهٔ قرارداد است.'
    :'در حالت مبتنی بر وصول، پرداخت به صاحب‌ملک پس از وصول موفق از مستأجر انجام می‌شود و محلینو فرآیند یادآوری و ثبت بدهی را اجرا می‌کند؛ تعهد پرداخت مستقلی وجود ندارد.')+'</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۶ — خسارت و بازرسی</h2><p>وضعیت ملک در بازرسی اولیه مستند می‌شود و مبنای بازرسی پایانی است. تفاوت‌ها به «ساییدگی عادی» و «آسیب فراتر از استفادهٔ متعارف» تفکیک می‌شود. '+
  'هیچ مبلغی بدون تعیین مسئولیت و تأیید صاحب‌ملک کسر نمی‌شود. هزینهٔ تعمیرات از محل ودیعه، تنها در حدود قرارداد و با گزارش مکتوب کسر می‌گردد.</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۷ — حل اختلاف</h2><p>اختلاف ابتدا در محلینو (مذاکره با ثبت مستندات) و سپس از طریق مراجع قانونی رسیدگی می‌شود.</p></section>'+
  '<section class="doc-sec"><h2>مادهٔ ۸ — اسناد ضمیمه</h2><ul><li>صورت‌جلسهٔ بازرسی اولیه و پایانی</li><li>کارپرداخت‌های ماهانه</li><li>گزارش درخواست‌های تعمیراتی</li><li>اجاره‌نامهٔ میانهٔ صاحب‌ملک و مستأجر</li></ul></section>'+
  '<section class="doc-sec doc-sign"><h2>مادهٔ ۹ — امضاها</h2><table class="doc-table"><thead><tr><th>طرف</th><th>تأیید داخلی</th><th>امضای رسمی</th></tr></thead><tbody>'+
  '<tr><td>صاحب‌ملک</td><td>'+(e.mgmt&&e.mgmt.ownerAck?'ثبت شد':'ثبت نشده')+'</td><td>انجام نشده</td></tr>'+
  '<tr><td>محلینو</td><td>'+(e.mgmt&&e.mgmt.grtAck?'ثبت شد':'ثبت نشده')+'</td><td>انجام نشده</td></tr></tbody></table>'+
  '<div class="doc-siglines"><div>امضای صاحب‌ملک: ............................</div><div>امضای محلینو: ............................</div></div>'+
  '<p class="doc-note">این سند امضای الکترونیک رسمی ندارد و ثبت رسمی محسوب نمی‌شود.</p></section>'+
  '<footer class="doc-foot"><div>سند تولیدشده در محلینو — '+fd(Date.now())+'</div><div>نسخهٔ رسمی باید از سامانهٔ ثبت رسمی دریافت شود.</div></footer></div>';
}
function grtReportHTML(e,forPrint){
  var init=e.inspections.initial,fin=e.inspections.final,d=e.damage;
  if(!init)return '<div class="empty">گزارشی ثبت نشده است.</div>';
  var rows=(init.items||[]).map(function(a){
    var b=fin?(fin.items.filter(function(x){return x.k===a.k})[0]||{}):{};
    var df=d?(d.diffs.filter(function(x){return x.k===a.k})[0]||{}):{};
    return '<tr><td>'+esc(a.t)+'</td><td>'+esc(grtScaleLabel(a.rate))+'</td><td>'+(fin?esc(grtScaleLabel(b.rate)):'—')+'</td>'+
    '<td>'+(df.kind?esc(df.kind==='wear'?'ساییدگی عادی':df.kind==='pre'?'آسیب پیشین':df.kind==='missing'?'مفقود':'آسیب'):(fin?'—':''))+'</td>'+
    '<td>'+(df.cost?rial(df.cost):'—')+'</td><td>'+(df.resp?esc(df.resp==='tenant'?'مستأجر':df.resp==='owner'?'صاحب‌ملک':df.resp==='none'?'بدون کسر':'در انتظار تصمیم'):'—')+'</td></tr>';
  }).join('');
  return '<div class="doc '+(fin?'registered':'draft')+'" dir="rtl">'+
  '<div class="doc-head"><div class="doc-brand">محلینو <span>سامانهٔ جامع مسکن</span></div><h1>گزارش بازرسی و تحویل ملک</h1><div class="doc-sub">پروندهٔ '+esc(e.id)+'</div></div>'+
  '<div class="doc-meta"><div><span>بازرسی اولیه</span><b>'+fd(init.at)+'</b></div><div><span>بازرسی پایانی</span><b>'+(fin?fd(fin.at):'انجام نشده')+'</b></div>'+
  '<div><span>کنتور اولیه</span><b dir="ltr">آب '+esc(init.meters.water||'—')+' / برق '+esc(init.meters.elec||'—')+' / گاز '+esc(init.meters.gas||'—')+'</b></div>'+
  '<div><span>شواهد تصویری</span><b>'+fa((init.items||[]).reduce(function(s,x){return s+(x.photos||[]).length},0),0)+' تصویر</b></div></div>'+
  '<section class="doc-sec"><h2>۱ — وضعیت به تفکیک مورد</h2><table class="doc-table"><thead><tr><th>مورد</th><th>اولیه</th><th>پایانی</th><th>تفکیک</th><th>برآورد</th><th>مسئول</th></tr></thead><tbody>'+rows+'</tbody></table></section>'+
  (d?('<section class="doc-sec"><h2>۲ — جمع‌بندی خسارت</h2><table class="doc-table"><tbody>'+
  '<tr><th>مجموع موارد اختلافی</th><td>'+fa(d.diffs.length,0)+'</td></tr>'+
  '<tr><th>برآورد قابل کسر از ودیعه (مستأجر)</th><td>'+rial(d.tenantLiable)+'</td></tr>'+
  '<tr><th>بر عهدهٔ صاحب‌ملک</th><td>'+rial(d.ownerLiable)+'</td></tr>'+
  '<tr><th>بدون تصمیم نهایی</th><td>'+fa(d.unresolved,0)+' مورد</td></tr></tbody></table>'+
  '<p class="doc-note">برآوردها از نرخ خدمات محلینو محاسبه شده و «تخمین» است، نه قیمت قطعی.</p></section>'):'')+
  '<section class="doc-sec"><h2>۳ — ملاحظات</h2><p>'+esc(init.notes||'ملاحظه‌ای ثبت نشده است.')+'</p></section>'+
  '<footer class="doc-foot"><div>گزارش تولیدشده در محلینو — '+fd(Date.now())+'</div><div>این گزارش جایگزین نظر کارشناس رسمی دادگستری نیست.</div></footer></div>';
}
function printDoc(html,title){
  var root=document.getElementById('print-root');
  if(!root){root=document.createElement('div');root.id='print-root';document.body.appendChild(root)}
  root.innerHTML=html;
  var oldTitle=document.title;
  document.title=title||'محلینو';
  document.body.classList.add('doc-printing');
  var done=function(){document.body.classList.remove('doc-printing');root.innerHTML='';document.title=oldTitle;window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  setTimeout(function(){try{window.print()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1556',e,'caught');}setTimeout(done,1200)},90);
}

/* ─── درخواست‌های تعمیراتی (اتصال به معماری سفارش خدمات) ─── */
function grtRespOf(e,itemK){
  var it=grtItemSvc(itemK);
  if(!it)return 'review';
  if(it.g==='سازه'||it.k==='heat'||it.k==='water')return 'owner';
  if(it.k==='clean')return 'included';
  return 'tenant';
}
function grtAddReq(e,title,itemK,by){
  var rp=grtRespOf(e,itemK);
  var r={id:'GRQ-'+String(Date.now()).slice(-6),title:title,item:itemK||'',by:by||'tenant',
    resp:rp,approval:rp==='included'?'approved':'pending',status:'بازبینی',at:Date.now(),order:null,note:''};
  e.reqs.unshift(r);
  addReq('grt','تعمیرات',title,'در انتظار',r.id);
  grtLog(e,'درخواست «'+title+'» ثبت شد');grgSave(e);return r;
}
function grtReqQuote(e,rid,ci,ii,qty){
  var r=e.reqs.filter(function(x){return x.id===rid})[0];
  if(!r)return null;
  return svcQuote(ci,ii,qty,{address:e.prop.addr}).then(function(q){r.quote=q;r.ci=ci;r.ii=ii;grgSave(e);return q});
}
function grtReqApprove(e,rid,ok){
  var r=e.reqs.filter(function(x){return x.id===rid})[0];
  if(!r||r.approval!=='pending')return false;
  r.approval=ok?'approved':'declined';
  grtLog(e,'هزینهٔ «'+r.title+'» '+(ok?'تأیید شد':'رد شد'));grgSave(e);return true;
}
function grtReqExecute(e,rid){
  var r=e.reqs.filter(function(x){return x.id===rid})[0];
  if(!r||!r.quote)return Promise.resolve(null);
  if(r.order){toast('این درخواست قبلاً سفارش خدمات داشته است');return Promise.resolve(null)}
  if(r.approval!=='approved'){toast('تأیید هزینه لازم است');return Promise.resolve(null)}
  var payer=r.resp==='owner'?'wallet':(r.resp==='included'?'fund':'tenant');
  var form={address:e.prop.addr||'—',date:'',slot:'',notes:'پروندهٔ '+e.id};
  if(payer==='wallet'){
    if((S.wallet||0)<r.quote.total){toast('موجودی کیف پول برای این هزینه کافی نیست');return Promise.resolve(null)}
    return svcPayOrder(r.ci,r.ii,form,r.quote,{payer:'wallet',grtId:e.id}).then(function(o){grtBindOrder(e,r,o);return o});
  }
  return grtFundOrder(e,r,payer).then(function(o){grtBindOrder(e,r,o);return o});
}
function grtBindOrder(e,r,o){
  if(!o)return;
  r.order=o.id;r.status=svcStatusMeta(o.status).l;r.svcStatus=o.status;
  grgSave(e);
}
function grtFundOrder(e,r,payer){
  var q=r.quote,it=svcItem(r.ci,r.ii),c=SVCS[r.ci];
  var id='SO-'+String(Date.now()).slice(-8);
  var o={id:id,ci:r.ci,ii:r.ii,title:(c?c.t+' — ':'')+it.n,category:c?c.t:'خدمات',address:e.prop.addr||'',date:'',slot:'',qty:q.qty,notes:'پروندهٔ '+e.id,
    base:q.base,labour:q.labour,fee:q.fee,amount:q.total,providerShare:q.providerShare,
    payment:payer==='fund'?'grt-fund':'tenant-billed',paymentRef:'GRT-'+e.id,
    status:'paid',createdAt:Date.now(),updatedAt:Date.now(),timeline:[{s:'paid',at:Date.now(),note:payer==='fund'?'از محل خدمات شامل سرویس':'برای مستأجر صورتحساب شد'}],
    settlement:'pending',demo:svcIsDemo(),grtId:e.id,grtPayer:payer};
  S.svcOrders.unshift(o);
  svcAudit(o,'payment',{amount:o.amount,grtId:e.id,payer:payer});
  e.ledger.unshift({t:Date.now(),k:payer==='tenant'?'tenant_charge':'fund_charge',amount:o.amount,ref:o.id,note:r.title});
  grtLog(e,'سفارش خدمات «'+o.title+'» ثبت شد');
  save();
  return svcSubmitToProvider(o).then(function(res){
    svcTimelinePush(o,res.status||'submitted',res.demo?'وضعیت نمایشی':'ثبت در ارائه‌دهنده');
    svcReqSync(o);save();return o;
  }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1620',null,'caught');svcTimelinePush(o,'submit_failed','پرداخت انجام شد اما ثبت سفارش ناموفق بود');svcReqSync(o);save();return o});
}
function grtSyncReqs(e){
  var ids={};
  (e.reqs||[]).forEach(function(r){if(r.order)ids[r.order]=r});
  var list=S.svcOrders.filter(function(o){return ids[o.id]});
  if(!list.length)return Promise.resolve(0);
  return Promise.all(list.map(function(o){
    return svcPollProvider(o).then(function(res){
      o.status=res.status;svcTimelinePush(o,res.status,res.note||'همگام‌سازی وضعیت');
      ids[o.id].status=svcStatusMeta(res.status).l;ids[o.id].svcStatus=res.status;
      if(res.status==='done'&&o.payment==='grt-fund'){ids[o.id].note='انجام شد — از محل خدمات شامل'}
      return 1;
    }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/guaranteed-rental.js:1633',null,'caught');return 0});
  })).then(function(a){var n=a.reduce(function(x,y){return x+y},0);grgSave(e);return n});
}

/* ─── تحویل و بازگشت ─── */
function grtInitialHandover(e,data){
  if(!e.inspections.initial){toast('ابتدا بازرسی اولیه را تکمیل کنید');return false}
  if(!(e.mgmt&&e.mgmt.signed)){toast('قرارداد مدیریت باید امضا شود');return false}
  if(!e.contractCode){toast('اجاره‌نامه باید نهایی شود');return false}
  e.handover.initial={at:Date.now(),date:data.date||'',keys:(data.keys||'').split(/[,،]+/).filter(function(x){return x.trim()}).length||+data.keys||0,
    keyNote:data.keys||'',meters:{water:data.water,elec:data.elec,gas:data.gas},
    ack:{owner:data.ackOwner||'',tenant:data.ackTenant||''},done:true};
  e.status='active';grtGenCycles(e);
  grtLog(e,'تحویل اولیه انجام شد — سرویس آغاز گردید');grgSave(e);
  addReq('grt','تحویل','تحویل اولیهٔ '+e.id,'کامل شد','کلیدها: '+esc(data.keys||'—'));
  return true;
}
function grtStartReturn(e){
  if(e.status!=='active'){toast('این پرونده در حال اجرا نیست');return false}
  e.status='returning';grtLog(e,'فرآیند بازگشت ملک آغاز شد');grgSave(e);return true;
}
function grtFinalHandover(e,data){
  if(!e.inspections.final){toast('بازرسی پایانی انجام نشده است');return false}
  e.handover.final={at:Date.now(),date:data.date||'',keys:data.keys||'',meters:{water:data.water,elec:data.elec,gas:data.gas},
    ack:{owner:data.ackOwner||'',tenant:data.ackTenant||''},done:true};
  grgSave(e);return true;
}
function grtSettleClose(e){
  if(!e.handover||!e.handover.final){toast('بازگشت فیزیکی ثبت نشده است');return false}
  if(e.damage&&e.damage.unresolved){toast('تصمیم دربارهٔ '+fa(e.damage.unresolved,0)+' مورد اختلافی باقی مانده است');return false}
  var tot=grtTotals(e),dep=(e.offer&&e.offer.dep)||0;
  var tenantLiable=e.damage?e.damage.tenantLiable:0;
  var unpaid=tot.arrears;
  var returnAmt=dep-tenantLiable;
  if(returnAmt<0)returnAmt=0;
  var extra=tenantLiable>dep?(tenantLiable-dep):0;
  e.settlement={at:Date.now(),dep:dep,damage:tenantLiable,depositReturn:returnAmt,arrears:unpaid,owedByTenant:extra,
    paidOwner:tot.paidOwner,fees:tot.fees,done:true};
  if(returnAmt>0){
    S.wallet=(S.wallet||0)+returnAmt;
    S.wlog.unshift({d:'آزادسازی ودیعهٔ مستأجر ('+e.id+')',a:returnAmt,t:Date.now()});
    renderTok();
  }
  e.ledger.unshift({t:Date.now(),k:'settlement',dep:dep,damage:tenantLiable,returned:returnAmt,arrears:unpaid});
  grtAudit(e,'settlement',{dep:dep,damage:tenantLiable,returned:returnAmt});
  e.status='closed';
  var w=wfOf(e.wf);if(w){w.done=true}
  var rw=e.rentWf?wfOf(e.rentWf):null;if(rw){rw.done=true}
  addReq('grt','تسویه','تسویهٔ نهایی '+e.id,'کامل شد','ودیعه بازگشتی: '+rial(returnAmt));
  closeReqs('grt','تعمیرات',e.wf);
  grtLog(e,'پرونده بسته شد — ودیعهٔ '+rial(returnAmt)+' آزاد شد');grgSave(e);
  return true;
}

