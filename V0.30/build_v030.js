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
const SRC=path.join(DIR,'..','V0.29','Mahalino+V0.29.html');
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
injectBefore('</style>',readSrc('v30.css'));

/* ═══ 11) JS injection before boot ═══ */
var jsOrder=['v30-core.js','v30-intel.js','v30-flows.js','v30-ux.js','v30-landing.js','v30-shell.js'];
var js=jsOrder.map(readSrc).join('\n\n');
injectBefore('/* ═══ ۲۲) راه‌اندازی ═══ */',js);

/* ═══ 12) Bana terminology (§17): replace the generic «توکن» everywhere (user-visible strings;
        Persian never appears inside code identifiers, so a literal replace is safe) ═══ */
H=H.split('توکن‌ها').join('بناها');
H=H.split('توکنی').join('بنایی');
H=H.split('توکن').join('بنا');
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
