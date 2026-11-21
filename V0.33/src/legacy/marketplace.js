/* ═══ ۱۴) مارکت‌پلیس ═══ */
function mktPrj(){
  var M=wd('mkt').data;
  return M.bid?M.bid.prj:(M.chosen?M.chosen.prj:0);
}
VIEWS.mkt=function(){
  var el=document.getElementById('v-mkt'),d=wd('mkt'),D=d.data,st=d.step;
  var h=wtop('mkt','مارکت‌پلیس پروژه‌ها','ثبت پیشنهاد یا تأیید پیمانکار و پیگیری گردش کار');
  h+=flowReqBlock('mkt');
  if(st===1){
    h+='<div class="grid g2">'+
    '<div class="mcard" data-act="roleSet" data-v="con"><div class="mi">'+ico('svc',20)+'</div><h3>پیمانکار</h3><p>گرفتن پروژه، ارسال پیشنهاد، ثبت پروژهٔ جدید و پیگیری</p><span style="color:var(--brand);font-size:12px;font-weight:700">'+(D.role==='con'?'✓ انتخاب‌شده':'انتخاب')+'</span></div>'+
    '<div class="mcard" data-act="roleSet" data-v="emp"><div class="mi">'+ico('user',20)+'</div><h3>کارفرما</h3><p>دیدن پیشنهادات، تأیید پیمانکار و رصد گردش کار</p><span style="color:var(--brand);font-size:12px;font-weight:700">'+(D.role==='emp'?'✓ انتخاب‌شده':'انتخاب')+'</span></div></div>';
    h+=wnav('mkt',!!D.role,'نقش را انتخاب کنید');
  }else if(st===2){
    h+='<div class="card tight" style="margin-bottom:14px"><div class="kv"><span>نقش</span><b>'+(D.role==='con'?'پیمانکار':'کارفرما')+'</b></div>'+
    '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn btn-xs" data-act="roleReset">تغییر نقش</button><button class="btn btn-xs btn-primary" data-act="nprj">ثبت پروژهٔ جدید</button></div></div>';
    if(D.bid){
      h+='<div class="alert '+(D.confirmed?'al-ok':'al-warn')+'"><b>پیشنهاد شما ثبت شده است</b> — '+rial(D.bid.amt)+' • '+(D.confirmed?'کارفرما تأیید کرد':'در انتظار تأیید کارفرما')+
      '<div style="margin-top:6px"><button class="btn btn-xs" data-act="dt" data-t="req" data-cat="mkt">پیگیری در درخواست‌ها</button> <button class="btn btn-xs" data-act="mChk">به‌روزرسانی وضعیت</button></div></div>';
    }
    h+='<div class="grid g3">'+PRJ.map(function(p,i){
      var con=D.role==='con';
      var myBid=D.bid&&D.bid.prj===i;
      return '<div class="card"><div class="ct">'+p.t+(p.mine?' <span class="badge b-brand">ثبت شما</span>':'')+'</div>'+
      '<div class="kv"><span>موقعیت</span><b>'+p.loc+'</b></div>'+
      '<div class="kv"><span>کارفرما</span><b>'+p.emp+'</b></div>'+
      '<div class="kv"><span>زیربنا / مدت</span><b>'+p.area+' — '+p.dur+'</b></div>'+
      '<div class="kv"><span>پیشنهادها</span><b>'+fa(p.bids,0)+'</b></div>'+
      (p.warn?'<div class="alert al-warn"> '+p.warn+'</div>':'')+
      '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">'+
      (con?('<button class="btn btn-xs btn-primary" data-act="pbid" data-i="'+i+'"'+(myBid?' disabled':'')+'>'+(myBid?'✓ ثبت شد':'پیشنهاد (۲۰ کلید)')+'</button>')
        :('<button class="btn btn-xs btn-primary" data-act="mBids" data-i="'+i+'">پیشنهادات ('+fa(BIDS.length,0)+')</button>'))+
      '<button class="btn btn-xs" data-act="pinfo" data-i="'+i+'">موضوعات</button>'+
      '<button class="btn btn-xs" data-act="pdet" data-i="'+i+'">جزئیات</button></div></div>';
    }).join('')+'</div>';
    h+=wnav('mkt',(D.role==='con'?!!D.bid:!!D.chosen),(D.role==='con'?'پیشنهاد ثبت کنید':'پیمانکار تأیید کنید'));
  }else if(st===3){
    h+='<div class="card"><div class="ct">۳) '+(D.role==='con'?'وضعیت پیشنهاد':'پیمانکار انتخابی')+'</div>';
    if(D.role==='con'){
      h+='<div class="kv"><span>پروژه</span><b>'+PRJ[D.bid.prj].t+'</b></div>'+
      '<div class="kv"><span>مبلغ</span><b>'+rial(D.bid.amt)+' • '+fa(D.bid.dur,0)+' ماه</b></div>'+
      '<div class="kv"><span>کارفرما</span>'+(D.confirmed?'<b class="badge b-ok"> تأیید — واگذار شد</b>':'<b class="badge b-warn"> در انتظار</b> <button class="btn btn-xs" data-act="mChk">بررسی</button>')+'</div>';
    }else{
      var b=BIDS[D.chosen.b];
      h+='<div class="kv"><span>پروژه</span><b>'+PRJ[D.chosen.prj].t+'</b></div>'+
      '<div class="kv"><span>پیمانکار</span><b>'+b.n+'</b></div>'+
      '<div class="kv"><span>مبلغ</span><b>'+rial(b.amt)+' • '+fa(b.dur,0)+' ماه</b></div>'+
      '<div class="kv"><span>وضعیت</span><b class="badge b-ok"> تأیید</b></div>';
    }
    h+='</div>'+wnav('mkt',!!(D.confirmed||D.chosen),'ادامه برای گردش کار');
  }else{
    var M=D,B=wd('build').data;
    if(!B.ph){B.ph=[100,80,40,0,0]}
    var tot=0,w=[12,34,22,18,14],q;
    for(q=0;q<5;q++){tot+=w[q]*B.ph[q]}
    tot=tot/100;
    var orders=(B.orders||[]).length;
    var prj=mktPrj();
    h+='<div class="grid g2"><div class="card"><div class="ct"> گردش کار — '+PRJ[prj].t+'</div><div class="tl">'+
    '<div class="tli done"><span class="dot">✓</span>ثبت پروژه<small>اسناد تأیید سامانه</small></div>'+
    '<div class="tli '+((M.confirmed||M.chosen)?'done':'act')+'"><span class="dot">'+((M.confirmed||M.chosen)?'✓':'•')+'</span>تأیید پیمانکار<small>'+((M.confirmed||M.chosen)?'واگذار شد':'در انتظار')+'</small></div>'+
    '<div class="tli '+(orders?'done':'')+'"><span class="dot">'+(orders?'✓':'')+'</span>تأمین منابع<small>'+(orders?fa(orders,0)+' سفارش':'—')+'</small></div>'+
    '<div class="tli '+(tot>=100?'done':(tot>0?'act':''))+'"><span class="dot">'+(tot>=100?'✓':(tot>0?'•':''))+'</span>اجرا<small>'+fa(tot,0)+'٪</small></div>'+
    '<div class="tli '+(wd('build').done?'done':'')+'"><span class="dot">'+(wd('build').done?'✓':'')+'</span>تحویل<small>'+(wd('build').done?'کارنامه +۵':'—')+'</small></div>'+
    '</div></div>'+
    '<div class="card"><div class="ct">طرفین</div>'+
    '<div class="kv"><span>کارفرما</span><b>'+(D.role==='emp'?S.auth.name:PRJ[prj].emp.split('—')[0].replace('کارفرما: ',''))+'</b></div>'+
    '<div class="kv"><span>پیمانکار</span><b>'+(D.role==='con'?S.auth.name:(D.chosen?BIDS[D.chosen.b].n:'—'))+'</b></div>'+
    '<div class="kv"><span>مبلغ</span><b>'+(D.bid?rial(D.bid.amt):rial(BIDS[D.chosen?D.chosen.b:0].amt))+'</b></div>'+
    '<div class="fs-actions" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-view="build">برو به «ساخت و تأمین»</button>'+(d.done?'<button class="btn btn-sm" data-act="flowNew" data-m="mkt">درخواست جدید</button>':'')+'</div></div></div>';
    h+=wnav('mkt',false,'');
  }
  el.innerHTML=h;
};

