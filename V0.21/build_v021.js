/* Build Mahalino+V0.21 from V0.20 — Conversational-first transformation.
 * Assert-per-replacement. Agent E's engine JS is read from Mahalino/V0.21/agentE-engine.js
 * (must exist before build). Agent C CSS read from Mahalino/V0.21/agentC-design-system.css.
 * Paths updated 2026-11-05 to the post-cleanup layout (Mahalino/V0.N/ folders). */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V21 = path.join(UI, 'Mahalino', 'V0.21');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.20', 'Mahalino+V0.20.html');
const OUT_FILE = path.join(V21, 'Mahalino+V0.21.html');
const CSS_FILE = path.join(V21, 'agentC-design-system.css');
const JS_FILE = path.join(V21, 'agentE-engine.js');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists'); process.exit(1); }
if (!fs.existsSync(JS_FILE)) { console.error('ABORT: agentE-engine.js missing — implement Agent E workstream first'); process.exit(1); }
const AGENT_C_CSS = fs.readFileSync(CSS_FILE, 'utf8');
const AGENT_E_JS = fs.readFileSync(JS_FILE, 'utf8');

let src = fs.readFileSync(SRC_FILE, 'utf8');
let applied = 0;
function rep(oldS, newS, expect) {
  expect = expect || 1;
  const n = src.split(oldS).length - 1;
  if (n !== expect) { console.error('ABORT: anchor matched ' + n + ' (expected ' + expect + '):\n---\n' + oldS.slice(0, 180) + '\n---'); process.exit(1); }
  src = src.split(oldS).join(newS);
  applied++;
  console.log('ok  #' + applied + ' (' + n + ') ' + oldS.slice(0, 58).replace(/\n/g, '\\n'));
}

/* ═══ 0a) app font → Yekan Bakh (local assets, Agent C design system) ═══ */
rep("*,button,input,select,textarea{font-family:'IRANSansX','Vazirmatn',Tahoma,sans-serif !important}",
    "*,button,input,select,textarea{font-family:'Yekan Bakh','IRANSansX','Vazirmatn',Tahoma,sans-serif !important}");

/* ═══ 0b) --font token ═══ */
rep("  --font:'IRANSansX','Vazirmatn',Tahoma,sans-serif;",
    "  --font:'Yekan Bakh','IRANSansX','Vazirmatn',Tahoma,sans-serif;");

/* ═══ 1) version marker ═══ */
rep('/* ═══ محلینو — V0.19 ═══', '/* ═══ محلینو — V0.21 (conversational-first) — بر پایهٔ V0.19/V0.20 ═══');

/* ═══ 2) Agent C design-system CSS (before responsive block) ═══ */
rep('/* ─── V0.19: contextual help, source badges, dashboard dock ─── */',
    AGENT_C_CSS + '\n/* ─── V0.19: contextual help, source badges, dashboard dock ─── */');

/* ═══ 3) conversational-first boot: landing default after login ═══ */
rep(`    if(S.auth){
      var p=S.pending||'home';
      S.pending=null;save();
      go(p);`,
`    if(S.auth){
      var p=S.pending||'landing';
      S.pending=null;save();
      go(p);`);

rep(`function doLogin(name){
  S.auth={name:name,phone:APH_PHONE||'09120000000',t:Date.now()};
  if(!S.welcomed){S.tokens=500;S.welcomed=true;S.log.unshift({t:Date.now(),d:'هدیهٔ خوش‌آمدگویی',c:500,cat:'sub'})}
  var p=S.pending||'home';`,
`function doLogin(name){
  S.auth={name:name,phone:APH_PHONE||'09120000000',t:Date.now()};
  if(!S.welcomed){S.tokens=500;S.welcomed=true;S.log.unshift({t:Date.now(),d:'هدیهٔ خوش‌آمدگویی',c:500,cat:'sub'})}
  var p=S.pending||'landing';`);

/* ═══ 4) sidebar: assistant first ═══ */
rep(`  var h=item(CURRENT==='home','data-view="home"','home','صفحهٔ اصلی');
  h+=item(CURRENT==='landing','data-view="landing"','chat','دستیار گفت‌وگومحور');
  h+=item(CURRENT==='map','data-view="map"','map','نقشه');`,
`  var h=item(CURRENT==='landing','data-view="landing"','chat','دستیار گفت‌وگومحور');
  h+=item(CURRENT==='home','data-view="home"','home','صفحهٔ اصلی');
  h+=item(CURRENT==='map','data-view="map"','map','نقشه');`);

/* ═══ 5) composer — floating widget (fchw) ═══ */
rep(`  <div class="fch-in"><input id="fchIn" aria-label="پیام به دستیار" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید"><button id="fchSend">ارسال</button></div>`,
`  <div class="cwr" id="fchCwr"><div class="cwr-prev" id="fchPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="fchAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="fchIn" class="cwr-in" rows="1" aria-label="پیام به دستیار" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید"></textarea><button id="fchSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="fchFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>`);

/* ═══ 6) composer — landing chat ═══ */
rep(`  '<div class="ch-in"><input id="chatIn" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"><button id="chatSend">ارسال</button></div>'+`,
`  '<div class="cwr" id="chatCwr"><div class="cwr-prev" id="chatPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="chatAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="chatIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="chatSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="chatFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+`);

/* ═══ 7) composer — dashboard dock ═══ */
rep(`  '<div class="ch-in"><input id="dashIn" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"><button id="dashSend">ارسال</button></div>'+`,
`  '<div class="cwr" id="dashCwr"><div class="cwr-prev" id="dashPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="dashAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="dashIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="dashSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="dashFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+`);

/* ═══ 8) composer bindings — landing ═══ */
rep(`  var s=document.getElementById('chatSend');
  if(s){s.onclick=function(){var i=document.getElementById('chatIn');if(!i)return;ceSend(i.value);i.value=''}}
  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'){s.onclick()}})}`,
`  var s=document.getElementById('chatSend');
  if(s){s.onclick=function(){var i=document.getElementById('chatIn');if(!i)return;ceSendWithAtt(i.value,'chat');i.value=''}}
  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('chat');`);

/* ═══ 9) composer bindings — dashboard dock ═══ */
rep(`  var s=document.getElementById('dashSend');
  if(s){s.onclick=function(){var i2=document.getElementById('dashIn');if(!i2)return;ceSend(i2.value);i2.value=''}}
  var i3=document.getElementById('dashIn');
  if(i3){i3.addEventListener('keydown',function(e){if(e.key==='Enter'){var s2=document.getElementById('dashSend');if(s2)s2.onclick()}})}`,
`  var s=document.getElementById('dashSend');
  if(s){s.onclick=function(){var i2=document.getElementById('dashIn');if(!i2)return;ceSendWithAtt(i2.value,'dash');i2.value=''}}
  var i3=document.getElementById('dashIn');
  if(i3){i3.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('dash');`);

/* ═══ 10) composer bindings — floating widget (boot) ═══ */
rep(`  var s=document.getElementById('fchSend'),i=document.getElementById('fchIn');
  if(s){
    s.onclick=function(){
      if(!i)return;
      ceSend(i.value);
      i.value='';
    };
  }
  if(i){
    i.addEventListener('keydown',function(e){
      if(e.key==='Enter'){s.onclick()}
    });
  }`,
`  var s=document.getElementById('fchSend'),i=document.getElementById('fchIn');
  if(s){
    s.onclick=function(){
      if(!i)return;
      ceSendWithAtt(i.value,'fch');
      i.value='';
    };
  }
  if(i){
    i.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}
    });
  }
  attInit('fch');`);

/* ═══ 11) Agent E engine (attachment system + embedded components + scenario glue) ═══ */
rep(`/* ═══ ۲۲) راه‌اندازی ═══ */`,
    AGENT_E_JS + '\n/* ═══ ۲۲) راه‌اندازی ═══ */');

/* ═══ 15) QA-R fix: selH reply chip posted '!nx' but hoods steps define 'next' (dead-end, V0.20-inherited) ═══ */
rep("botC('✓ محلهٔ '+findH(D.hood).n+' انتخاب شد:',[['برو به بازار','!nx']])",
    "botC('✓ محلهٔ '+findH(D.hood).n+' انتخاب شد:',[['برو به بازار','!next']])");

/* ═══ 16) QA-R fix: selL reply chip '!nx' → rent list defines 'skp' (guarded → day) ═══ */
rep("botC('✓ انتخاب شد.',[['بازدید','!nx'],['مقایسه','!cmp']])",
    "botC('✓ انتخاب شد.',[['بازدید','!skp'],['مقایسه','!cmp']])");

/* ═══ 17) QA-R fix: selB reply chip '!nx' → buy list defines 'skp' (guarded → lgsc) ═══ */
rep("botC('✓ انتخاب شد.',[['حقوقی','!nx']])",
    "botC('✓ انتخاب شد.',[['حقوقی','!skp']])");

/* ═══ 18) QA-R fix: mkt trk step called non-existent faI() (crash, V0.20-inherited) ═══ */
rep("faI(tot)", "fa(Math.round(tot),0)");

/* ═══ 19) QA-R fix: yieldPct crash on legacy garbage scn (defensive fallback) ═══ */
rep("var s=SCN[D.scn||'mid'];", "var s=SCN[D.scn]||SCN.mid;");

/* ═══ 20) QA-R fix: invb scn step accepted free text verbatim → yieldTable crash; validate against SCN keys ═══ */
rep("{id:'scn',q:' کدام حالت بازار؟',chips:function(){return [['بدبینانه','bad'],['معقول','mid'],['خوش‌بینانه','good']]},set:function(D,v){D.scn=v;return null}},",
    "{id:'scn',q:' کدام حالت بازار؟',chips:function(){return [['بدبینانه','bad'],['معقول','mid'],['خوش‌بینانه','good']]},set:function(D,v){if(!SCN[v])return 'ERR';D.scn=v;return null},err:'حالت بازار را از گزینه‌ها انتخاب کنید: بدبینانه، معقول یا خوش‌بینانه.'},");

/* ═══ 21) QA-U fix: placeholder contrast 2.39:1 → var(--muted) (4.76:1 on surface) ═══ */
rep('.inp::placeholder,.ch-in input::placeholder,.fch-in input::placeholder{color:var(--faint)}',
    '.inp::placeholder,.ch-in input::placeholder,.fch-in input::placeholder,.cwr-in::placeholder{color:var(--muted)}');

/* ═══ 22) QA-U fix: mobile overflow at ≤700px — grid min-width guards + sidepanel single column ═══ */
rep('/* ─── responsive ─── */',
`/* ─── V0.21: mobile min-width + contrast fixes (QA-U) ─── */
@media(max-width:1160px){.landing-grid{grid-template-columns:minmax(0,1fr)}.landing-grid>*{min-width:0}}
@media(max-width:700px){.landing-grid .sidepanel .panel-list{grid-template-columns:1fr}.dock-assist{max-width:100%}}
.cwr-in::placeholder{color:var(--muted)}

/* ─── responsive ─── */`);

/* ═══ 23) QA-C fix (HIGH): «وام» substring matched inside «می‌خوام» (normFa strips half-space) → mortgage-OOS hijacked natural entries. Persian-letter guard: وام must not be preceded by خ ═══ */
rep("  if(/وام|مقرضه|بیمه|مالیات بر|ثبت سند|دفترخانه/.test(q)){RINT.scOOS(q);return true}",
    "  if(/(^|[^خ])وام|مقرضه|بیمه|مالیات بر|ثبت سند|دفترخانه/.test(q)){RINT.scOOS(q);return true}");

/* ═══ 24) QA-C fix (HIGH): same وام guard in scOOS itself ═══ */
rep("if(/وام|مقرضه/.test(q)){",
    "if(/(^|[^خ])وام|مقرضه/.test(q)){");

/* ═══ 25) QA-C fix (MED): typed «بازدید» mid-buy-flow restarted the rent flow — only hijack when no other flow is active ═══ */
rep("if(has('اجاره','رهن','بازدید'))",
    "if(has('اجاره','رهن')||((!CE.f||CE.f==='rent')&&has('بازدید')))");

/* ═══ 26) QA-C fix (MED): escP — dynamic step count in q, honest err text (old example contradicted chosen stage count) ═══ */
rep("err:'درصدها را با عدد و جداکننده بنویسید؛ مثلاً 20-30-40-10 و جمع باید ۱۰۰ باشد.'",
    "err:'درصدها را با عدد و جداکننده بنویسید؛ جمع ۱۰۰ و تعدادشان برابر مرحله‌های انتخابی — مثلاً برای ۳ مرحله: 33-33-34.'");
rep("q:function(D){return 'درصد هر مرحله را بنویسید (جمع ۱۰۰ — مثلاً 20-30-40-10):'},kind:'text',",
    "q:function(D){return 'درصد هر مرحله را بنویسید (جمع ۱۰۰ — '+fa(D.pay.n||3,0)+' مرحله؛ مثلاً 33-33-34):'},kind:'text',");
rep(" set:function(D,v){\n   if(v==='eq'){",
    " set:function(D,v){\n   if(!D.pay.n)D.pay.n=3;\n   if(v==='eq'){");
rep("var pl=parsePercentListFA(v,D.pay.n);",
    "var pl=parsePercentListFA(v,(D.pay.n||3));");

/* ═══ 27) QA-C fix (S-GRT-01): scGrtInfo chip bypassed the guided hand-off — route through chat collection first ═══ */
rep("{l:'شروع در صفحهٔ اختصاصی',a:'data-view=\"grt\"',p:1},",
    "{l:'شروع اجارهٔ تضمینی (همراه در گفت‌وگو)',a:'data-cba=\"grtGuided\"',p:1},");

/* ═══ 28) QA-C fix (LOW): slot-extracted budg below the buy floor was consumed silently by the pre-hook — skip prefill when below range ═══ */
rep("pre:function(D){if(CTX.budg&&!D._budgSet){D.budg=CTX.budg;D._budgSet=1;",
    "pre:function(D){if(CTX.budg&&!D._budgSet&&CTX.budg>=50000000000){D.budg=CTX.budg;D._budgSet=1;");

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
