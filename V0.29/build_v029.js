#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   build_v029.js — Mahalino+ V0.29 codemod
   Base: V0.28/Mahalino+V0.28.html (read-only) → V0.29/Mahalino+V0.29.html
   Pattern (same as V0.28): asserted string replacements + block injection.
   ═══════════════════════════════════════════════════════════════════════════ */
const fs=require('fs');
const path=require('path');

const DIR=__dirname;
const SRC=path.join(DIR,'..','V0.28','Mahalino+V0.28.html');
const OUT=path.join(DIR,'Mahalino+V0.29.html');
const SRC_DIR=path.join(DIR,'src');

let H=fs.readFileSync(SRC,'utf8');
let count=0,fail=[];

function rep(oldStr,newStr,expect){
  expect=(expect===undefined)?1:expect;
  let ix=0,pos=0,n=0;
  while((pos=H.indexOf(oldStr,pos))!==-1){n++;pos+=oldStr.length;ix=pos}
  if(n!==expect){fail.push('rep matched '+n+'x (expected '+expect+'): '+oldStr.slice(0,80).replace(/\n/g,'⏎'));return}
  H=H.split(oldStr).join(newStr);
  count++;
}
function injectBefore(marker,str){
  if(H.indexOf(marker)===-1){fail.push('marker missing: '+marker.slice(0,60));return}
  H=H.replace(marker,str+'\n'+marker);
  count++;
}
function injectAfter(marker,str){
  if(H.indexOf(marker)===-1){fail.push('marker missing: '+marker.slice(0,60));return}
  H=H.replace(marker,marker+'\n'+str);
  count++;
}

function readSrc(f){return fs.readFileSync(path.join(SRC_DIR,f),'utf8')}

/* ═══ 1) version markers ═══ */
H=H.replace(/<title>.*?<\/title>/,'<title>محلینو+ — V0.29</title>');

/* ═══ 2) storage key + migration ═══ */
rep("var LSKEY='mahalino_v18';",
    "var LSKEY='mahalino_v29';");
rep("var OLD_LS=['mahal','ino_','v17'].join('');",
    "var OLD_LS=['mahal','ino_','v18'].join('');");

/* ═══ 3) state defaults (after sub default) ═══ */
injectAfter("if(S.sub===undefined){S.sub=null}",
`/* V0.29 state defaults */
if(!S.notifs)S.notifs=[];
if(!S.library)S.library=[];
if(!S.projects)S.projects=[];
if(!S.shares)S.shares=[];
if(!S.prefs)S.prefs={};
if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};`);

/* ═══ 4) spend() — transaction IDs + events ═══ */
rep("S.tokens-=c;S.log.unshift({t:Date.now(),d:desc,c:-c,cat:cat});save();renderTok();",
`S.tokens-=c;var _txn='TXN-'+Date.now().toString(36)+Math.floor(Math.random()*999);
S.log.unshift({t:Date.now(),d:desc,c:-c,cat:cat,id:_txn,svc:key});save();renderTok();
if(window.E29){try{E29.bus.emit('token.deduct',{txn:_txn,cost:c,svc:key,desc:desc});if((S.tokens||0)<30)E29.bus.emit('wallet.low',{balance:S.tokens})}catch(e){}}`);

/* ═══ 5) sidebar renderer delegation to E29.shell ═══ */
rep("function renderSidebar(){\n  var el=document.getElementById('side'),app=document.getElementById('appwrap');\n  if(!el){return}",
`function renderSidebar(){
  if(window.E29&&E29.shell){try{E29.shell.renderSidebar();return}catch(e){console.error('E29 sidebar',e)}}
  var el=document.getElementById('side'),app=document.getElementById('appwrap');
  if(!el){return}`);

/* ═══ 6) ACT.hanalysis → paid deep analysis with Library save ═══ */
rep(`ACT.hanalysis=function(el){
  var h=findH(el.getAttribute('data-h')),m=el.getAttribute('data-m')||'buy';
  openModal('<h3>تحلیل محلهٔ '+h.n+'</h3>'+neighborhoodAnalysisHTML(h,m));
};`,
`ACT.hanalysis=function(el){
  var h=findH(el.getAttribute('data-h')),m=el.getAttribute('data-m')||'buy';
  if(window.E29){
    E29.pay.ask('hood_detail','تحلیل جامع محله',h.n,function(txn){
      var html=neighborhoodAnalysisHTML(h,m);
      var it=E29.libAPI.saveArtifact({type:'hood_analysis',title:'تحلیل جامع محلهٔ '+h.n,
        summary:'گزارش جامع بازار، دسترسی و تناسب محلهٔ '+h.n+(m==='rent'?' (نمای اجاره)':' (نمای خرید)'),
        artifact:{html:html,hood:h.id,mode:m},txnId:txn,tokenCost:COSTS.hood_detail||40});
      closeModal();
      openModal('<h3>تحلیل جامع محلهٔ '+h.n+'</h3>'+html);
      E29.bus.emit('analysis.completed',{title:'تحلیل محله آماده شد',msg:'گزارش جامع محلهٔ '+h.n+' در کتابخانه ذخیره شد.',libId:it.id,txn:txn});
    });
    return;
  }
  openModal('<h3>تحلیل محلهٔ '+h.n+'</h3>'+neighborhoodAnalysisHTML(h,m));
};`);

/* ═══ 7) ACT.cfinalize → contract_draft token confirmation, then finalize ═══ */
rep(`ACT.cfinalize=function(){
  var ctx=conCtx();
  conFinalize(ctx.D,ctx.kind);
};`,
`ACT.cfinalize=function(){
  var ctx=conCtx();
  if(window.E29&&(COSTS.contract_draft||0)>0){
    E29.pay.ask('contract_draft','پیش‌نویس قرارداد','',function(txn){
      window.__v29conTxn=txn;
      conFinalize(ctx.D,ctx.kind);
    });
    return;
  }
  conFinalize(ctx.D,ctx.kind);
};`);

/* ═══ 8) conFinalize → Library auto-save + contract notification ═══ */
rep("S.contracts.push({code:c.code,draftCode:c.draftCode,kind:kind,title:title,t:Date.now(),req:rid,detail:true,status:'signed_internal',wfId:wfId,doc:snap});",
`S.contracts.push({code:c.code,draftCode:c.draftCode,kind:kind,title:title,t:Date.now(),req:rid,detail:true,status:'signed_internal',wfId:wfId,doc:snap});
if(window.E29){try{
  var _lit=E29.libAPI.saveArtifact({type:'contract',title:title,
    summary:(kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+' '+c.code,
    artifact:{doc:snap,kind:kind},entityId:c.code,workflowId:wfId,
    tokenCost:COSTS.contract_draft||0,txnId:window.__v29conTxn||null});
  window.__v29conTxn=null;
  E29.bus.emit('contract.status',{title:'قرارداد ثبت شد',msg:title+' — '+c.code,code:c.code,status:'signed',libId:_lit?_lit.id:null});
}catch(e){console.error('E29 contract save',e)}}`);

/* ═══ 9) termination AI analysis chip for already-terminated contracts ═══ */
rep("if(c.status==='terminated'){botC('این قرارداد قبلاً فسخ شده است.',null);return true}",
`if(c.status==='terminated'){botC('این قرارداد قبلاً فسخ شده است.<div class="qr"><button data-cba="e29termAI" data-code="'+qesc(c.code)+'">تحلیل هوشمند اسناد</button><button data-cba="e29termLater">بستن</button></div>',null);return true}`);

/* ═══ 10) CSS injection ═══ */
injectBefore('</style>',readSrc('v29.css'));

/* ═══ 11) JS injection before boot ═══ */
var jsOrder=['v29-core.js','v29-notifs.js','v29-library.js','v29-projects.js','v29-intel.js','v29-share.js','v29-shell.js'];
var js=jsOrder.map(readSrc).join('\n\n');
injectBefore('/* ═══ ۲۲) راه‌اندازی ═══ */',js);

/* ═══ 12) init call ═══ */
rep("try{E28.init()}catch(e){}",
    "try{E28.init()}catch(e){}\n    try{E29.init()}catch(e){console.error('E29 init',e)}");

/* ═══ 13) production text cleanup (spec §13) — enumerated, asserted ═══ */
rep('فایل به‌طور کامل کپی نشده است. لطفاً کل کد را انتخاب و جای‌گذاری کنید.',
    'فایل ناقص بارگذاری شده است. لطفاً دوباره تلاش کنید.');
rep('احتمالاً کپی ناقص است. کل کد را از ابتدا تا انتها کپی کنید.',
    'فایل ناقص بارگذاری شده است.');

/* ═══ write ═══ */
if(fail.length){
  console.error('BUILD FAILED — '+fail.length+' issue(s):');
  fail.forEach(function(f){console.error('  ✗ '+f)});
  process.exit(1);
}
fs.writeFileSync(OUT,H,'utf8');
console.log('✓ V0.29 built: '+count+' patches applied → '+OUT);
console.log('  size: '+(H.length/1024).toFixed(0)+' KB');
