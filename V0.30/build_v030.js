#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   build_v030.js — Mahalino+ V0.30 codemod
   Base: V0.29/Mahalino+V0.29.html (read-only) → V0.30/Mahalino+V0.30.html
   Pattern (same as V0.28/V0.29): asserted string replacements + block injection.
   Every rep() must match exactly once (or the given count) — build fails loudly.
   ═══════════════════════════════════════════════════════════════════════════ */
const fs=require('fs');
const path=require('path');

const DIR=__dirname;
const REPO_BASE=path.join(DIR,'..','V0.29','Mahalino+V0.29.html');
const BUNDLED_BASE=path.join(DIR,'base','Mahalino+V0.29.html');
/* A standalone V0.30 distribution includes its exact predecessor snapshot;
   a full checkout may reuse V0.29, but must reproduce identical output. */
const SRC=fs.existsSync(REPO_BASE)?REPO_BASE:BUNDLED_BASE;
if(!fs.existsSync(SRC)){
  console.error('BUILD FAILED: missing base template. Expected '+REPO_BASE+' or '+BUNDLED_BASE);
  process.exit(1);
}
const OUT=path.join(DIR,'Mahalino+V0.30.html');
const SRC_DIR=path.join(DIR,'src');

let H=fs.readFileSync(SRC,'utf8');
let count=0,fail=[];

function rep(oldStr,newStr,expect){
  expect=(expect===undefined)?1:expect;
  let pos=0,n=0;
  while((pos=H.indexOf(oldStr,pos))!==-1){n++;pos+=oldStr.length}
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
H=H.replace(/<title>.*?<\/title>/,'<title>محلینو+ — V0.30</title>');

/* ═══ 2) storage key + migration chain (v30 → v29 → v18 → v16 → khan) ═══ */
rep("var LSKEY='mahalino_v29';","var LSKEY='mahalino_v30';");
rep("var OLD_LS=['mahal','ino_','v18'].join('');",
    "var OLD_LS=['mahal','ino_','v29'].join('');\nvar OLD_LS4=['mahal','ino_','v18'].join('');");
rep("var S=null,LSCHAIN=[LSKEY,OLD_LS,OLD_LS2,OLD_LS3],LSi;",
    "var S=null,LSCHAIN=[LSKEY,OLD_LS,OLD_LS4,OLD_LS2,OLD_LS3],LSi;");

/* ═══ 3) state defaults for E30 collections ═══ */
injectAfter("if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};",
`/* V0.30 state defaults */
if(!S.paySession)S.paySession=null;
if(!S.savedListings)S.savedListings=[];
if(!S.ctx30)S.ctx30={fields:{},log:[]};`);

/* The v30 discovery collector belongs to a conversation, not a global page.
   Bind an archived conversation ID before E22 clears restoredId, reload the
   corresponding context on sidebar restore, and reset only on New Chat. */
rep("  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];HIST=[];ctxReset();",
    "  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];HIST=[];if(window.E22)E22.restoredId=null;S.liveHistory=[];save();ctxReset();window.E30_HIST_VISIBLE=120;if(window.E30&&E30.discAPI&&E30.discAPI.reset)E30.discAPI.reset();");
rep("  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];\n  botC('گفت‌وگو بسته شد.",
    "  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];\n  if(window.E30&&E30.discAPI&&E30.discAPI.stop)E30.discAPI.stop();\n  botC('گفت‌وگو بسته شد.");
rep("  if(users<2)return; /* گفت‌وگوی کمتر از دو پیام کاربر بایگانی نمی‌شود */",
    "  if(users<1)return; /* حتی یک پیام کاربر ارزش بایگانی دارد */");
rep("  E22.restoredId=null;\n  /* سقف ۱۲ برای غیرسنجاق‌شده‌ها؛ کهنه‌ترین حذف می‌شود — فقط اگر چیزی حذف شد */",
    "  if(window.E30&&E30.discAPI&&E30.discAPI.bindChat){E30.discAPI.bindChat(updated?updated.id:S.chats[0].id)}\n  E22.restoredId=null;\n  /* سقف ۱۲ برای غیرسنجاق‌شده‌ها؛ کهنه‌ترین حذف می‌شود — فقط اگر چیزی حذف شد */");
rep("  E22.restoredId=s.id;\n  setMenuOpen(false);",
    "  E22.restoredId=s.id;\n  S.liveHistory=HIST.slice();save();\n  if(window.E30&&E30.discAPI&&E30.discAPI.useChat)E30.discAPI.useChat(s.id);\n  setMenuOpen(false);");
rep("  if(E22.restoredId===id)E22.restoredId=null;\n  closeModal();",
    "  if(E22.restoredId===id)E22.restoredId=null;\n  if(window.E30&&E30.discAPI&&E30.discAPI.forgetChat)E30.discAPI.forgetChat(id);\n  closeModal();");
/* Never silently delete the early part of a conversation. Keep all history
   in memory and archive; render a bounded window with a visible Load Older
   button so long chats remain reasonably responsive. */
rep("function botC(html,chips){HIST.push({r:'bot',h:html,c:chips||null});if(HIST.length>60){HIST=HIST.slice(-60)}cr()}",
    "function botC(html,chips){HIST.push({r:'bot',h:html,c:chips||null});S.liveHistory=HIST.slice();save();cr()}");
rep("function usrC(t){HIST.push({r:'user',h:esc(t)});cr()}",
    "function usrC(t){HIST.push({r:'user',h:esc(t)});S.liveHistory=HIST.slice();save();cr()}");
rep("var HIST=[];","var HIST=Array.isArray(S.liveHistory)?S.liveHistory.slice():[];");
rep("    b.el.innerHTML=HIST.map(function(m,ix){",
    "    var visible=window.E30_HIST_VISIBLE||120,from=Math.max(0,HIST.length-visible);\n    b.el.innerHTML=(from?'<button class=\"qbtn\" data-act=\"e30HistMore\" style=\"margin:8px auto;display:block\">نمایش '+fa(Math.min(120,from),0)+' پیام قدیمی‌تر</button>':'')+HIST.slice(from).map(function(m,ix){ix+=from;");
rep("E22.CAP=12;    /* سقف گفت‌وگوهای غیرسنجاق‌شده */",
    "E22.CAP=Number.MAX_SAFE_INTEGER; /* هیچ گفت‌وگویی خودکار پاک نمی‌شود */");
rep("E22.MAXH=60;   /* سقف پیام در هر بایگانی (هم‌راستا با برش HIST در botC) */",
    "E22.MAXH=Number.MAX_SAFE_INTEGER; /* نگه‌داری کامل پیام‌ها در بایگانی */");
rep("    if(st.length>200)st.length=200;",
    "    /* V0.30: do not silently delete older artifacts. Storage-quota failures are reported by save(). */");
injectBefore("/* ═══ ۲۲) راه‌اندازی ═══ */",
    "window.E30_HIST_VISIBLE=120;ACT.e30HistMore=function(){window.E30_HIST_VISIBLE=Math.min(HIST.length,(window.E30_HIST_VISIBLE||120)+120);cr()};");

/* ═══ 4) boot: E30 init after E29 init ═══ */
rep("try{E29.init()}catch(e){console.error('E29 init',e)}",
    "try{E29.init()}catch(e){console.error('E29 init',e)}\n    try{E30.init()}catch(e){console.error('E30 init',e)}");

/* ═══ 5) boot: guests land on the public splash page (§3) ═══ */
rep("    }else{\n      go('landing');\n    }",
    "    }else{\n      go('splash');\n    }");

/* ═══ 6) rent list strict filtering (§2.2): deposit/rent/age/m2 become hard constraints ═══ */
rep("  var hard=all.filter(function(x){if(D.P.beds>0&&x.beds<D.P.beds)return false;if(D.P.elev&&!x.elev)return false;if(D.P.park&&!x.park)return false;return true});",
    "  var hard=all.filter(function(x){return E30.flowsAPI.rentPass(x,D)});");
rep("  var hard=RLIST.filter(function(x){return x.hood===D.hood}).filter(function(x){if(D.P.beds>0&&x.beds<D.P.beds)return false;if(D.P.elev&&!x.elev)return false;if(D.P.park&&!x.park)return false;return true});",
    "  var hard=RLIST.filter(function(x){return x.hood===D.hood}).filter(function(x){return E30.flowsAPI.rentPass(x,D)});");
/* Replace the legacy range parser with the independently testable, explicit
   unit/magnitude parser. Unlike the old global multiplier it also handles
   mixed magnitudes such as ۱ میلیارد تا ۵۰۰ میلیون تومان. */
var rangeStart=H.indexOf('function parseMoneyRangeFA(input){');
var rangeEnd=H.indexOf('function parseRangeFA(input){',rangeStart);
if(rangeStart<0||rangeEnd<0){fail.push('money-range parser block missing')}
else{rep(H.slice(rangeStart,rangeEnd),readSrc('v30-money-range.js')+'\n')}
/* Cards under the 'all listings' heading remain visible for comparison, but
   a failed hard constraint can never become the selected property. */
rep("CBACT.selL=function(el){var D=wd('rent').data;D.listing=el.getAttribute('data-l');save();if(CURRENT==='rent')renderCurrent();botC('✓ انتخاب شد.',[['بازدید','!skp'],['مقایسه','!cmp']])};",
    "CBACT.selL=function(el){var D=wd('rent').data,x=findL(el.getAttribute('data-l'));if(!x||!E30.flowsAPI.rentPass(x,D)){toast('این آگهی با الزام‌های قطعی شما منطبق نیست؛ ابتدا فیلترها را آگاهانه اصلاح کنید.');return}D.listing=x.id;save();if(CURRENT==='rent')renderCurrent();botC('✓ انتخاب شد.',[['بازدید','!skp'],['مقایسه','!cmp']])};");
rep("CBACT.selB=function(el){var D=wd('buy').data;D.blist=el.getAttribute('data-l');save();if(CURRENT==='buy')renderCurrent();botC('✓ انتخاب شد.',[['حقوقی','!skp']])};",
    "CBACT.selB=function(el){var D=wd('buy').data,x=findB(el.getAttribute('data-l'));if(!x||!E30.flowsAPI.buyPass(x,D)){toast('این آگهی با سقف بودجه یا الزام‌های قطعی شما منطبق نیست؛ ابتدا محدودیت‌ها را اصلاح کنید.');return}D.blist=x.id;save();if(CURRENT==='buy')renderCurrent();botC('✓ انتخاب شد.',[['حقوقی','!skp']])};");
/* Full-deposit leases legitimately have monthly rent of zero. Neither blank
   input, negative amounts, nor a zero-zero lease is valid. */
rep("    var dep=+v('cp-dep'),rent=+v('cp-rent');\n    if(!dep||!rent){toast('ودیعه و اجاره را وارد کنید');return}",
    "    var depText=v('cp-dep'),rentText=v('cp-rent'),dep=Number(depText),rent=Number(rentText);\n    if(!depText||!rentText||!Number.isFinite(dep)||!Number.isFinite(rent)||dep<0||rent<0||(dep===0&&rent===0)){toast('مبلغ‌های ودیعه و اجاره را درست وارد کنید؛ رهن کامل با اجارهٔ صفر پذیرفته است');return}");
rep("((c.kind==='rent')?(!c.terms.rent||!c.terms.deposit):(!c.terms.price))",
    "((c.kind==='rent')?(c.terms.rent==null||c.terms.deposit==null||!Number.isFinite(Number(c.terms.rent))||!Number.isFinite(Number(c.terms.deposit))||Number(c.terms.rent)<0||Number(c.terms.deposit)<0||(Number(c.terms.rent)===0&&Number(c.terms.deposit)===0)):(!c.terms.price))");
rep("qesc(String(c.terms.rent||''))",
    "qesc(String(c.terms.rent===0?0:(c.terms.rent||'')))");
/* Explicit, per-request consent before sending national ID or postal code
   to any configured external resolver. Local format validation stays offline. */
rep("function lookupPostal(){\n  var D=wd(conKind()).data,c=conInit(D,conKind());",
    "function lookupPostal(approved){\n  var D=wd(conKind()).data,c=conInit(D,conKind());");
rep("  c.prop.postal=code;\n  lookupStatus('lk-postal','load','در حال استعلام نشانی...');",
    "  if(approved!==true){openModal('<h3>رضایت برای استعلام بیرونی</h3><p class=\"note\">با تأیید، کد پستی به سرویس استعلام نشانی پیکربندی‌شده یا Photon/Nominatim ارسال می‌شود. برای حفظ حریم خصوصی می‌توانید نشانی را دستی وارد کنید.</p><div class=\"qr\"><button data-act=\"e30PostalConsent\">موافقم، استعلام کن</button><button data-act=\"closeModal\">انصراف</button></div>');return}\n  c.prop.postal=code;\n  lookupStatus('lk-postal','load','در حال استعلام نشانی...');");
rep("function lookupIdentity(id,role){",
    "function lookupIdentity(id,role,approved){");
rep("  lookupStatus(box,'load','در حال استعلام هویت...');\n  lkIdentityName(v).then(function(r){",
    "  if(approved!==true){openModal('<h3>رضایت برای استعلام هویت</h3><p class=\"note\">با تأیید شما، کد ملی به سرویس هویت پیکربندی‌شده ارسال می‌شود. این مرحله در نسخهٔ نمایشی جایگزین احراز هویت رسمی نیست.</p><div class=\"qr\"><button data-act=\"e30IdentityConsent\" data-role=\"'+qesc(role)+'\">موافقم، استعلام کن</button><button data-act=\"closeModal\">انصراف</button></div>');return false}\n  lookupStatus(box,'load','در حال استعلام هویت...');\n  lkIdentityName(v).then(function(r){");
injectBefore("/* ═══ ۲۲) راه‌اندازی ═══ */",
    "ACT.e30PostalConsent=function(){closeModal();lookupPostal(true)};ACT.e30IdentityConsent=function(el){var role=el&&el.getAttribute('data-role');closeModal();if(role==='me'||role==='owner')lookupIdentity(null,role,true)};");
/* "all listings" act: matched-first, honest labeling of out-of-constraint items (§7.1) */
rep("  all:function(D){botC('همه:<div class=\"chcards\">'+RLIST.filter(function(x){return x.hood===D.hood}).map(function(x){return chatListCard(x,D.listing===x.id)}).join('')+'</div>',[['برو به بازدید','!skp']])},",
    "  all:function(D){var ms=RLIST.filter(function(x){return x.hood===D.hood}),ok=ms.filter(function(x){return E30.flowsAPI.rentPass(x,D)}),no=ms.filter(function(x){return !E30.flowsAPI.rentPass(x,D)});botC('منطبق با الزام‌های شما: '+fa(ok.length,0)+' آگهی'+(no.length?' — '+fa(no.length,0)+' آگهی دیگرِ این محله خارج از الزام‌هاست و «انطباق» حساب نمی‌شود':'')+':<div class=\"chcards\">'+ok.concat(no).map(function(x){return chatListCard(x,D.listing===x.id)}).join('')+'</div>',[['برو به بازدید','!skp']])},");

/* ═══ 7) buyer total-price budget enforcement lives in E30 blPass override (injected) — no rep needed ═══ */

/* ═══ 8) retire E29.intel free-form interception (E30 discovery owns openings now) ═══ */
rep("    if((!CE.f||CE.f==='gate')&&/می ?خوام|می ?خواهم|دنبال/.test(nt)&&/خونه|خانه|ملک|آپارتمان|اجاره|کرایه|خرید|فروش/.test(nt)){",
    "    if(false&&(!CE.f||CE.f==='gate')&&/می ?خوام|می ?خواهم|دنبال/.test(nt)&&/خونه|خانه|ملک|آپارتمان|اجاره|کرایه|خرید|فروش/.test(nt)){");

/* ═══ 9) sidebar: remove duplicated wallet balance (§15.1 — header already shows it) ═══ */
rep("'<button class=\"e29-srow\" data-act=\"wallet\" data-tip=\"کیف پول\"><span class=\"si\">'+e29ico('wallet',17)+'</span><span class=\"lbl\">کیف پول</span><small style=\"margin-inline-start:auto\">'+rial(S.wallet)+'</small></button>'+"+
   "\n      '<button class=\"e29-srow\" data-act=\"e29shManage\"",
    "'<button class=\"e29-srow\" data-act=\"wallet\" data-tip=\"کیف پول\"><span class=\"si\">'+e29ico('wallet',17)+'</span><span class=\"lbl\">کیف پول</span></button>'+"+
   "\n      '<button class=\"e29-srow\" data-act=\"e29shManage\"");

/* ═══ 9b) sample-data extension: ونک + انقلاب (spec §4.8 reference scenario requires them) —
        coherent with the existing 6-hood sample dataset (labeled نمونه in UI) ═══ */
rep("yoy:114.0,src:'کیلید',url:'https://kilid.com/buy/tehran-region8-narmak'}}];",
    "yoy:114.0,src:'کیلید',url:'https://kilid.com/buy/tehran-region8-narmak'}},\n"+
    "{id:'h7',n:'ونک',avgRent:700000000,avgDep:32000000000,buyBase:5200000000,newBase:5800000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.757,51.407],mkt:{low:4160000000,high:6240000000,mom:3.1,yoy:118.9,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-vanak'}},\n"+
    "{id:'h8',n:'انقلاب',avgRent:420000000,avgDep:11000000000,buyBase:2750000000,newBase:3100000000,work:null,metro:null,school:null,saf:null,amn:null,quiet:null,ads:null,tx:null,days:null,ll:[35.701,51.390],mkt:{low:2200000000,high:3300000000,mom:1.8,yoy:122.4,src:'کیلید',url:'https://kilid.com/buy-apartment/tehran-engelab'}}];");
rep("food:{n:33,km:null,name:'کافه/رستوران'}}}};",
    "food:{n:33,km:null,name:'کافه/رستوران'}}},\n"+
    "h7:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.40,name:'ورودی مترو ونک'},edu:{n:31,km:0.28,name:'مدرسهٔ نمونه'},health:{n:120,km:0.11,name:'مطب/داروخانه'},shop:{n:65,km:0.12,name:'فروشگاه'},park:{n:20,km:0.20,name:'بوستان پارک وی'},food:{n:95,km:0.10,name:'کافه/رستوران'},sport:{n:8,km:0.44,name:'باشگاه ورزشی'}}},\n"+
    "h8:{asOf:'۲۰۲۶-۱۰-۳۱',src:'OpenStreetMap / Overpass',cats:{metro:{km:0.30,name:'مترو انقلاب'},edu:{n:44,km:0.35,name:'دانشگاه/مدرسه'},health:{n:70,km:0.15,name:'درمانگاه/داروخانه'},shop:{n:60,km:0.14,name:'فروشگاه'},park:{n:12,km:0.30,name:'بوستان محلی'},food:{n:80,km:0.12,name:'کافه/رستوران'}}}};");
rep("av:{'یک‌شنبه':['۱۷:۰۰'],'سه‌شنبه':['۱۷:۰۰','۱۸:۰۰'],'پنج‌شنبه':['۱۰:۰۰']}}];",
    "av:{'یک‌شنبه':['۱۷:۰۰'],'سه‌شنبه':['۱۷:۰۰','۱۸:۰۰'],'پنج‌شنبه':['۱۰:۰۰']}},\n"+
    "{id:'r9',hood:'h7',seed:'a9',t:'۶۵ متری دوخوابه — ونک تانز',rent:680000000,dep:28000000000,m2:65,age:3,floor:4,beds:2,elev:true,park:true,balc:true,rate:4.5,n:19,av:{'شنبه':['۱۱:۰۰','۱۸:۰۰'],'دوشنبه':['۱۰:۰۰']}},\n"+
    "{id:'r10',hood:'h8',seed:'a10',t:'۵۵ متری دوخوابه — انقلاب (کارگر جنوبی)',rent:420000000,dep:9500000000,m2:55,age:6,floor:2,beds:2,elev:true,park:false,balc:true,rate:4.0,n:24,av:{'یک‌شنبه':['۱۱:۰۰','۱۷:۰۰'],'سه‌شنبه':['۱۶:۰۰']}}];");
rep("ppm:4300000000,elev:true,park:true,balc:true,rate:4.6}];",
    "ppm:4300000000,elev:true,park:true,balc:true,rate:4.6},\n"+
    "{id:'b11',hood:'h7',seed:'c11',t:'۶۰ م نوساز — ونک',m2:60,age:2,floor:5,beds:2,ppm:5400000000,elev:true,park:true,balc:true,rate:4.6},\n"+
    "{id:'b12',hood:'h8',seed:'c12',t:'۷۰ م ۹ساله — انقلاب',m2:70,age:9,floor:3,beds:2,ppm:2700000000,elev:true,park:false,balc:false,rate:4.1}];");

/* ═══ 10) CSS injection ═══ */
injectBefore('</style>',readSrc('v30.css')+'\n'+readSrc('v30-guided-ui.css'));

/* ═══ 11) JS injection before boot ═══ */
var jsOrder=['v30-core.js','v30-intel.js','v30-flows.js','v30-ux.js','v30-landing.js','v30-guided-ui.js','v30-shell.js'];
var js=jsOrder.map(readSrc).join('\n\n');
injectBefore('/* ═══ ۲۲) راه‌اندازی ═══ */',js);

/* ═══ 12) Bana terminology (§17): replace the generic «توکن» everywhere (user-visible strings;
        Persian never appears inside code identifiers, so a literal replace is safe) ═══ */
H=H.split('توکن‌ها').join('بناها');
H=H.split('توکنی').join('بنایی');
H=H.split('توکن').join('بنا');
count++;

/* ═══ 13) user-selected credit name «کلید» (display text only).
   Preserve «عمر بنا» / «سن بنا» and full words such as «زیربنا»;
   numeric amounts, balance records, persistence keys and service IDs stay unchanged. */
H=H.replace(/هزینهٔ بنایی/g,'هزینهٔ کلید');
H=H.replace(/(^|[^\p{L}\p{N}\u200c])(بناها|بنایی|بنا)(?=$|[^\p{L}\p{N}\u200c])/gu,
  function(full,before,word,index,source){
    var preceding=source.slice(Math.max(0,index-24),index);
    if(/(?:عمر|سن|ساخت|ارتفاع|نمای|بافت)\s*$/.test(preceding))return full;
    return before+({بنا:'کلید',بناها:'کلیدها',بنایی:'کلیدی'}[word]||word);
  });
H=H.replace('۵۰۰ کلید هدیه کلید','۵۰۰ کلید هدیه');
count++;

/* ═══ write ═══ */
if(fail.length){
  console.error('BUILD FAILED — '+fail.length+' issue(s):');
  fail.forEach(function(f){console.error('  ✗ '+f)});
  process.exit(1);
}
fs.writeFileSync(OUT,H,'utf8');
console.log('✓ V0.30 built: '+count+' patches applied → '+OUT);
console.log('  size: '+(H.length/1024).toFixed(0)+' KB');
