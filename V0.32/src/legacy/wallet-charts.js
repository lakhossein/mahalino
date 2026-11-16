/* ═══ ۳) کلید و کیف پول ═══ */
var COSTS={detail:10,visit:20,valuation:40,legal:100,contract:0,escrow:150,bid:20,stay:30};
var COSTL={detail:'جزئیات راستی‌آزمایی‌شدهٔ آگهی',visit:'هماهنگی بازدید',valuation:'تخمین ارزش',legal:'گزارش حقوقی',contract:'تنظیم پیش‌نویس قرارداد (بدون هزینهٔ کلید)',escrow:'پرداخت امانی',bid:'ارسال پیشنهاد',stay:'رزرو امانی اقامتگاه'};
function renderTok(){
  var el=$('#tokchip');if(!el)return;
  if(S.auth){
    el.innerHTML='<button class="tok" data-act="account" data-tab="wallet" title="کیف پول"><span class="ti">'+ico('wallet')+'</span><b>'+rial(S.wallet||0)+'</b></button><button class="tok" data-act="account" data-tab="plan" title="اشتراک و کلید"><span class="ti">'+ico('coin')+'</span><b>'+fa(S.tokens,0)+'</b><span class="tl2">کلید</span><span class="plus">＋</span></button>';
  }else{
    el.innerHTML='<button class="btn btn-primary btn-sm" data-view="auth">ورود / ثبت‌نام</button>';
  }
  document.body.classList.toggle('authed',!!S.auth);
  var fb=$('#fcbfab');if(fb&&fb.classList){fb.className=S.auth?'on':''}
}
function spend(key,cat,desc){
  var c=COSTS[key]||0;
  if(S.tokens<c){
    openModal('<h3>کلید کافی نیست</h3><p class="note">این خدمت '+fa(c,0)+' کلید لازم دارد؛ موجودی شما '+fa(S.tokens,0)+' کلید است.</p><div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-primary" data-view="sub">شارژ کلید</button><button class="btn" data-act="closeModal">بستن</button></div>');
    return false;
  }
  S.tokens-=c;var _txn='TXN-'+Date.now().toString(36)+Math.floor(Math.random()*999);
S.log.unshift({t:Date.now(),d:desc,c:-c,cat:cat,id:_txn,svc:key});save();renderTok();
if(window.E29){try{E29.bus.emit('token.deduct',{txn:_txn,cost:c,svc:key,desc:desc});if((S.tokens||0)<30)E29.bus.emit('wallet.low',{balance:S.tokens})}catch(e){}}
  toast('−'+fa(c,0)+' کلید — '+desc);return true;
}
function earn(n,cat,desc){S.tokens+=n;S.log.unshift({t:Date.now(),d:desc,c:n,cat:cat});save();renderTok();toast('+'+fa(n,0)+' کلید — '+desc)}
function walletIn(a,d){S.wallet=(S.wallet||0)+a;S.wlog.unshift({t:Date.now(),d:d,a:a});save();renderTok();toast(' '+rial(a)+' به کیف پول واریز شد')}
function addReq(cat,type,title,status,detail){
  var id='R'+Date.now()+Math.floor(Math.random()*999);
  S.reqs.unshift({id:id,cat:cat,type:type,title:title,status:status||'در انتظار',t:Date.now(),detail:detail||'',wf:S.active[wfModOfCat(cat)]||null});
  save();return id;
}
function setReq(id,st){var i;for(i=0;i<S.reqs.length;i++){if(S.reqs[i].id===id){S.reqs[i].status=st;save();return}}}
function stB(s){var m={'در انتظار':'b-warn','تأیید شد':'b-ok','در حال انجام':'b-info','کامل شد':'b-ok','لغو شد':'b-bad'};return '<span class="badge '+(m[s]||'b-info')+'">'+s+'</span>'}
function reqOpen(r){return !!r&&r.status!=='کامل شد'&&r.status!=='لغو شد'}
function findReqById(id){var i;for(i=0;i<S.reqs.length;i++){if(S.reqs[i].id===id)return S.reqs[i]}return null}
function openReqOf(cat,type,wfId){
  var i,r,fb=null;
  if(wfId){
    for(i=0;i<S.reqs.length;i++){
      r=S.reqs[i];
      if(r.cat===cat&&(!type||r.type===type)&&r.wf===wfId&&reqOpen(r)){return r}
    }
  }
  for(i=0;i<S.reqs.length;i++){
    r=S.reqs[i];
    if(r.cat===cat&&(!type||r.type===type)&&reqOpen(r)){fb=r;break}
  }
  return fb;
}
function reqsOfWf(wfId){return S.reqs.filter(function(r){return r.wf===wfId})}
function flowReqList(m){var cats=FRC[m]||[m];return S.reqs.filter(function(r){return cats.indexOf(r.cat)>=0})}
function closeReqs(cat,type,wfId){
  var n=0;
  S.reqs.forEach(function(r){
    if(r.cat===cat&&(!type||r.type===type)&&reqOpen(r)&&(!wfId||r.wf===wfId)){r.status='کامل شد';n++}
  });
  if(n){save()}
  return n;
}
function runningWfs(m){return wfLive(m).filter(function(w){return !w.done&&w.step>1})}

/* ═══ ۴) نمودار ═══ */
function spark(host,data,labels,fmt){
  if(!host){return}
  fmt=fmt||function(v){return fa(v,0)};
  var w=620,h=190,pL=70,pR=8,pT=16,pB=22,n=data.length,i,t,v,y;
  var lo=Math.min.apply(null,data)*0.96,hi=Math.max.apply(null,data)*1.05;
  function X(i){return pL+(w-pL-pR)*i/(n-1)}
  function Y(v){return pT+(h-pT-pB)*(1-(v-lo)/(hi-lo))}
  var g='',path='',pts='',area,step;
  for(t=0;t<=3;t++){v=lo+(hi-lo)*t/3;y=Y(v);g+='<line x1="'+pL+'" y1="'+y+'" x2="'+(w-pR)+'" y2="'+y+'" class="cg"/><text x="'+(w-pR)+'" y="'+(y-4)+'" class="cl" text-anchor="end">'+fmt(v)+'</text>'}
  step=Math.max(1,Math.floor(n/4));
  for(i=0;i<n;i+=step){g+='<text x="'+X(i)+'" y="'+(h-4)+'" class="xl" text-anchor="middle">'+(labels?labels[i]:'')+'</text>'}
  for(i=0;i<n;i++){path+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(data[i]).toFixed(1)+' '}
  for(i=0;i<n;i++){pts+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(data[i]).toFixed(1)+'" r="3.2" class="cp"/>'}
  area=path+'L'+X(n-1).toFixed(1)+' '+(h-pB)+' L'+X(0).toFixed(1)+' '+(h-pB)+' Z';
  host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" class="chart">'+g+'<path d="'+area+'" class="carea"/><path d="'+path+'" class="cline"/>'+pts+'</svg>';
}
var CC=['#0e7c6b','#e8a13a','#8a97ab','#33549e'];
var CC2=['#6b7a90','#33549e','#e8a13a','#0e7c6b'];
function bars(host,data,labels,fmt,colors){
  if(!host){return}
  fmt=fmt||function(v){return fa(v,0)};
  var w=620,h=190,pL=70,pR=8,pT=16,pB=26,n=data.length,i,t,v,y,col,b='';
  var hi=Math.max.apply(null,data)*1.15,bw=(w-pL-pR)/n*0.55;
  function X(i){return pL+(w-pL-pR)*(i+0.5)/n}
  function Y(v){return pT+(h-pT-pB)*(1-v/hi)}
  var g='';
  for(t=0;t<=3;t++){v=hi*t/3;y=Y(v);g+='<line x1="'+pL+'" y1="'+y+'" x2="'+(w-pR)+'" y2="'+y+'" class="cg"/><text x="'+(w-pR)+'" y="'+(y-4)+'" class="cl" text-anchor="end">'+fmt(v)+'</text>'}
  for(i=0;i<n;i++){
    col=(colors&&colors[i])?colors[i]:'#0e7c6b';
    b+='<rect x="'+(X(i)-bw/2).toFixed(1)+'" y="'+Y(data[i]).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+(h-pB-Y(data[i])).toFixed(1)+'" rx="4" style="fill:'+col+'"/>';
    b+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(data[i])-5).toFixed(1)+'" class="cbv" text-anchor="middle" style="fill:'+col+'">'+fmt(data[i])+'</text>';
    if(labels){b+='<text x="'+X(i).toFixed(1)+'" y="'+(h-4)+'" class="xl" text-anchor="middle">'+labels[i]+'</text>'}
  }
  host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" class="chart">'+g+b+'</svg>';
}
var MFULL=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

