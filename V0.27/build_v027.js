/* Build Mahalino+V0.27 from V0.26 — Conversational-first rebuild (P0 fixes 1–8).
 * Assert-per-replacement, in-place pattern (same as V0.24–V0.26 builds).
 * Input:  Mahalino/V0.26/Mahalino+V0.26.html  (read-only — never modified)
 * Output: Mahalino/V0.27/Mahalino+V0.27.html
 */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V27 = path.join(UI, 'Mahalino', 'V0.27');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.26', 'Mahalino+V0.26.html');
const OUT_FILE = path.join(V27, 'Mahalino+V0.27.html');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists — delete it first to rebuild'); process.exit(1); }

let src = fs.readFileSync(SRC_FILE, 'utf8');
let applied = 0;
function rep(oldS, newS, expect) {
  expect = expect || 1;
  const n = src.split(oldS).length - 1;
  if (n !== expect) { console.error('ABORT: anchor matched ' + n + ' (expected ' + expect + '):\n---\n' + oldS.slice(0, 220).replace(/\n/g, '\\n') + '\n---'); process.exit(1); }
  src = src.split(oldS).join(newS);
  applied++;
  console.log('ok  #' + applied + ' (' + n + ') ' + oldS.slice(0, 70).replace(/\n/g, '\\n'));
}

/* ══════════════════════════════════════════════════════════════════
 * STEP 1 — version marker
 * ══════════════════════════════════════════════════════════════════ */
rep('/* ═══ محلینو — V0.26 (بلوغ محصول) — بر پایهٔ V0.25 ═══',
    '/* ═══ محلینو — V0.27 (گفت‌وگومحور تمام‌عیار) — بر پایهٔ V0.26 ═══');

/* ══════════════════════════════════════════════════════════════════
 * STEP 2 — static shell: remove floating chat + FAB + footer nav
 * ══════════════════════════════════════════════════════════════════ */
rep(`<button id="fcbfab" data-act="fcb" aria-label="باز کردن دستیار" aria-expanded="false" aria-controls="fchw"></button>
<div class="fchw" id="fchw" role="dialog" aria-label="دستیار محلینو">
  <div class="fch-h"><span class="hico" id="fchico"></span><b>دستیار محلینو</b><button class="hbtn" data-act="chatNew" title="گفت‌وگوی جدید">گفت‌وگوی جدید</button><button class="hbtn" data-act="fcb" aria-label="بستن دستیار">×</button></div>
  <div class="cstep" id="fchStep" hidden><span id="fchStepTxt"></span><span class="bar"><i id="fchStepBar"></i></span></div>
  <div class="csum" id="fchSum" hidden><span id="fchSumTxt"></span><button class="hbtn" data-act="chatBack">ویرایش پاسخ</button></div>
  <div class="fch-b" id="fchB" aria-live="polite"></div>
  <div class="fch-sugg" id="fchSugg" aria-label="پیشنهادهای این صفحه"></div>
  <div class="cwr" id="fchCwr"><div class="cwr-prev" id="fchPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="fchAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="fchIn" class="cwr-in" rows="1" aria-label="پیام به دستیار" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید"></textarea><button id="fchSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="fchFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>
</div>
<footer><div class="foot-in">
  <div class="fb"><b>محلینو</b> — سامانهٔ جامع مسکن</div>
  <button class="fl" data-act="brand">صفحهٔ اصلی</button>
  <button class="fl" data-act="dt" data-t="flows">فلوها و درخواست‌ها</button>
  <button class="fl" data-view="map">نقشه</button>
  <button class="fl" data-act="account" data-tab="overview">حساب کاربری</button>
  <button class="fl" data-view="landing">دستیار</button>
</div></footer>
`, '');

/* STEP 2b — remove v-home and v-dash view shells */
rep(`    <section class="view" id="v-home"></section>
    <section class="view" id="v-landing"></section>
    <section class="view" id="v-auth"></section>
    <section class="view" id="v-dash"></section>
`, `    <section class="view" id="v-landing"></section>
    <section class="view" id="v-auth"></section>
`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 3 — E27 CSS block (shell + components), inserted at end of <style>
 * ══════════════════════════════════════════════════════════════════ */
rep(`</style>
</head>`, `/* ═══ E27 — پوستهٔ گفت‌وگومحور (V0.27) ═══ */
/* سایدبار به سبک ChatGPT */
.e27-new{display:flex;align-items:center;gap:8px;width:100%;margin:10px 10px 4px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
.e27-new:hover{border-color:var(--brand);color:var(--brand)}
.e27-new svg{flex:none}
.e27-search{margin:4px 10px 8px;position:relative}
.e27-search input{width:100%;box-sizing:border-box;padding:8px 30px 8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;font-size:12.5px}
.e27-search svg{position:absolute;top:50%;right:9px;transform:translateY(-50%);opacity:.55;pointer-events:none}
.e27-slist{flex:1;overflow-y:auto;padding:2px 6px 8px;min-height:0}
.e27-sday{font-size:11px;color:var(--ink2);padding:8px 6px 4px;font-weight:700}
.e27-sess{position:relative}
.e27-sess .e22-sess-acts{opacity:0;transition:opacity .12s}
.e27-sess:hover .e22-sess-acts,.e27-sess:focus-within .e22-sess-acts{opacity:1}
.e27-sbot{border-top:1px solid var(--line);padding:8px 10px 10px;display:flex;flex-direction:column;gap:2px}
.e27-srow{display:flex;align-items:center;gap:9px;width:100%;padding:8px 6px;border:0;background:none;color:var(--ink);font:inherit;font-size:13px;border-radius:9px;cursor:pointer;text-align:start}
.e27-srow:hover{background:var(--bg)}
.e27-srow .si{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex:none;opacity:.8}
.e27-srow small{color:var(--ink2);font-weight:400}
.e27-sidehead{display:flex;align-items:center;justify-content:space-between;padding:10px 10px 0 6px}
.e27-fold{border:0;background:none;color:var(--ink2);cursor:pointer;padding:6px;border-radius:8px;line-height:0}
.e27-fold:hover{background:var(--bg);color:var(--ink)}
body.sidefold .side{display:none}
body.sidefold #appwrap{grid-template-columns:1fr}
.e27-expand{display:none}
body.sidefold .e27-expand{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:9px;padding:6px 8px;cursor:pointer;margin-inline-start:6px}
/* فضای کاری گفت‌وگو — تک‌کامپوزر تمام‌عرض */
.ch-main{width:100%;max-width:860px;margin:0 auto;height:calc(100vh - 52px);display:flex;flex-direction:column;border:0;border-radius:0;box-shadow:none;background:var(--bg)}
.ch-main .ch-b{flex:1;overflow-y:auto}
.ch-main .chat-sugg{padding:6px 14px}
.ch-main .cwr{margin:0 0 10px}
@media (max-width:980px){
  .ch-main{height:calc(100vh - 52px)}
}
/* کارت عمودی آگهی (V0.27) */
.chcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;width:100%}
.pcard{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;position:relative;transition:box-shadow .15s,border-color .15s}
.pcard:hover{border-color:var(--brand);box-shadow:0 4px 18px rgba(15,118,110,.12)}
.pcard-art{position:relative;aspect-ratio:4/3;background:var(--bg);overflow:hidden}
.pcard-art img{width:100%;height:100%;object-fit:cover;display:block}
.pcard-type{position:absolute;top:10px;inset-inline-start:10px;background:var(--brand);color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}
.pcard-badges{position:absolute;top:10px;inset-inline-end:10px;display:flex;flex-direction:column;gap:5px;align-items:flex-end}
.pcard-body{padding:12px 14px 8px;display:flex;flex-direction:column;gap:6px;flex:1}
.pcard-price{font-size:15.5px;font-weight:800;color:var(--brand)}
.pcard-price small{color:var(--ink2);font-weight:400;font-size:11.5px;margin-inline-start:4px}
.pcard-title{font-size:13.5px;font-weight:700;line-height:1.6}
.pcard-adr{font-size:12px;color:var(--ink2);display:flex;align-items:center;gap:4px}
.pcard-specs{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
.pcard-specs span{font-size:11px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:3px 8px;color:var(--ink)}
.pcard-amen{display:flex;flex-wrap:wrap;gap:4px}
.pcard-amen span{font-size:10.5px;color:var(--brand);background:rgba(15,118,110,.08);border-radius:999px;padding:2px 8px}
.pcard-src{font-size:10.5px;color:var(--ink2);display:flex;align-items:center;gap:5px;margin-top:auto;padding-top:6px}
.pcard-foot{display:flex;gap:6px;padding:10px 12px 12px;border-top:1px solid var(--line)}
.pcard-foot .btn{flex:1;padding:7px 6px;font-size:12px}
/* جزئیات تاشو (Progressive Disclosure) */
.pcard-more{font-size:11.5px;color:var(--brand);background:none;border:0;cursor:pointer;padding:0 2px;font-weight:700}
.pcard-extra{display:none;font-size:11.5px;color:var(--ink2);border-top:1px dashed var(--line);margin-top:6px;padding-top:6px;line-height:1.9}
.pcard.open .pcard-extra{display:block}
/* کامپوننت هوش بازار (V0.27) */
.mkti{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-top:10px;width:100%;max-width:760px}
.mkti-h{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.mkti-h b{font-size:14px}
.mkti-chips{display:flex;flex-wrap:wrap;gap:5px}
.mkti-chip{font:inherit;font-size:11.5px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:4px 11px;cursor:pointer}
.mkti-chip.on{background:var(--brand);border-color:var(--brand);color:#fff}
.mkti-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:9px;margin:10px 0}
.mkti-kpi{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:9px 11px}
.mkti-kpi small{display:block;font-size:10.5px;color:var(--ink2);margin-bottom:3px}
.mkti-kpi b{font-size:14px;display:block}
.mkti-kpi .delta{font-size:11px;font-weight:700;margin-top:2px;display:inline-block}
.mkti-kpi .delta.up{color:#15803d}
.mkti-kpi .delta.down{color:#b91c1c}
[data-theme="dark"] .mkti-kpi .delta.up{color:#4ade80}
[data-theme="dark"] .mkti-kpi .delta.down{color:#f87171}
.mkti-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
@media (max-width:640px){.mkti-grid{grid-template-columns:1fr}}
.mkti-box{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.mkti-box h5{margin:0 0 8px;font-size:12px;color:var(--ink2);font-weight:700}
.mkti-range{margin:6px 0 2px}
.mkti-rangebar{position:relative;height:10px;border-radius:999px;background:linear-gradient(90deg,#93c5fd,#fca5a5);margin:14px 2px 4px}
.mkti-rangebar i{position:absolute;top:-4px;width:3px;height:18px;background:var(--ink);border-radius:2px}
.mkti-rangebar i.pin{width:11px;height:11px;border-radius:50%;top:0;background:var(--brand);border:2px solid #fff;box-shadow:0 0 0 1px var(--brand)}
.mkti-rl{display:flex;justify-content:space-between;font-size:10.5px;color:var(--ink2);margin-top:2px}
.mkti-cmp{display:flex;flex-direction:column;gap:8px}
.mkti-cmp-row{display:grid;grid-template-columns:74px 1fr 64px;align-items:center;gap:8px;font-size:11.5px}
.mkti-cmp-bar{height:12px;border-radius:999px;background:var(--brand);opacity:.85;min-width:3px}
.mkti-cmp-row.cur .mkti-cmp-bar{opacity:1;outline:2px solid var(--brand);outline-offset:1px}
.mkti-cmp-row.cur{font-weight:800}
.mkti-rd{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mkti-rd>div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;text-align:center}
.mkti-rd b{display:block;font-size:13px;margin-top:2px}
.mkti-note{font-size:10.5px;color:var(--ink2);margin-top:10px;line-height:1.9;border-top:1px dashed var(--line);padding-top:8px}
.mkti-more-btn{font:inherit;font-size:11px;color:var(--brand);background:none;border:0;cursor:pointer;padding:0;margin-top:6px;font-weight:700}
.mkti-more{display:none;font-size:11.5px;color:var(--ink2);line-height:2;margin-top:6px}
.mkti.openm .mkti-more{display:block}
/* مقایسهٔ Before/After تخلیهٔ هوشمند (V0.27) */
.ba27{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-top:10px;max-width:640px}
.ba27-steps{display:flex;gap:6px;margin-bottom:10px}
.ba27-step{flex:1;text-align:center;font-size:11px;color:var(--ink2);position:relative;padding-top:20px}
.ba27-step::before{content:'';position:absolute;top:0;right:50%;transform:translateX(50%);width:15px;height:15px;border-radius:50%;background:var(--bg);border:2px solid var(--line)}
.ba27-step.on{color:var(--brand);font-weight:700}
.ba27-step.on::before{background:var(--brand);border-color:var(--brand)}
.ba27-step.done::before{background:var(--brand);border-color:var(--brand);content:'✓';color:#fff;font-size:9px;line-height:15px}
.ba27-wrap{position:relative;border-radius:12px;overflow:hidden;aspect-ratio:3/2;background:var(--bg)}
.ba27-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ba27-after{clip-path:inset(0 0 0 50%)}
.ba27-handle{position:absolute;top:0;bottom:0;left:50%;width:3px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:ew-resize}
.ba27-handle::after{content:'⇔';position:absolute;top:50%;right:50%;transform:translate(50%,-50%);width:30px;height:30px;border-radius:50%;background:#fff;color:var(--ink);display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.ba27-range{width:100%;margin-top:10px;accent-color:var(--brand)}
.ba27-labs{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-top:6px}
.ba27-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.ba27-demo{font-size:10.5px;color:var(--ink2);margin-top:8px;line-height:1.8}
.ba27-zoom{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:120;display:flex;align-items:center;justify-content:center;cursor:zoom-out}
.ba27-zoom img{max-width:92vw;max-height:88vh;border-radius:10px}
/* کیف پول — شارژ و تراکنش (V0.27) */
.wtop27{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.wtx{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px dashed var(--line);font-size:12.5px}
.wtx:last-child{border-bottom:0}
.wtx .wic{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;font-size:14px}
.wtx.in .wic{background:rgba(21,128,61,.12);color:#15803d}
.wtx.out .wic{background:rgba(185,28,28,.1);color:#b91c1c}
.wtx-main{flex:1;min-width:0}
.wtx-main b{display:block;font-size:12.5px}
.wtx-main small{color:var(--ink2);font-size:10.5px}
.wtx-amt{font-weight:800;white-space:nowrap}
.wtx-amt.in{color:#15803d}
.wtx-amt.out{color:#b91c1c}
[data-theme="dark"] .wtx.in .wic{color:#4ade80}
[data-theme="dark"] .wtx.out .wic{color:#f87171}
[data-theme="dark"] .wtx-amt.in{color:#4ade80}
[data-theme="dark"] .wtx-amt.out{color:#f87171}
.pay27-sim{border:1.5px dashed var(--brand);border-radius:12px;padding:12px 14px;margin-top:10px;background:rgba(15,118,110,.04)}
.pay27-sim b{color:var(--brand);font-size:12.5px}
.pay27-row{display:flex;justify-content:space-between;padding:6px 0;font-size:12.5px;border-bottom:1px dashed var(--line)}
.pay27-row:last-of-type{border-bottom:0}
.pay27-row b{font-weight:700}
/* بودجهٔ آزاد (V0.27) */
.budg-free{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
/* ═══ E27-CSS-END — مرز درج CSS های بعدی ═══ */
</style>
</head>`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 4 — navigation core: go() guards + brand
 * ══════════════════════════════════════════════════════════════════ */
rep(`function go(v){
  if(v==='sub'){S.ui.atab='plan';v='profile'}
  if(v==='cjm'){v='home'}
  if(!S.auth&&v!=='auth'&&v!=='landing'){S.pending=v;save();toast('ابتدا وارد شوید');v='auth'}`,
`function go(v){
  if(v==='sub'){S.ui.atab='plan';v='profile'}
  if(v==='cjm'){v='landing'}
  if(v==='home'||v==='dash'){v='landing'} /* V0.27: صفحات مستقل حذف شدند — همه‌چیز در گفت‌وگو */
  if(!S.auth&&v!=='auth'&&v!=='landing'){S.pending=v;save();toast('ابتدا وارد شوید');v='auth'}`);

rep(`ACT.fcb=function(){toggleF(!FCHAT.open)};
ACT.brand=function(){go(S.auth?'home':'landing')};
ACT.chatNew=function(){
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];HIST=[];ctxReset();
  if(CURRENT==='landing'){ceStartGate()}else{toggleF(true)}
  toast('گفت‌وگوی جدید');
};
ACT.chatBack=function(){if(CE.f&&CE.hist.length){ceBack()}};
ACT.chatStop=function(){
  if(!CE.f){toggleF(false);return}
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];
  botC('گفت‌وگو بسته شد. مسیر فعلی شما حفظ شده است.',[['منوی اصلی','!menu'],['داشبورد','F:dashx']]);
};`,
`ACT.brand=function(){go('landing')};
ACT.chatNew=function(){
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];HIST=[];ctxReset();
  if(CURRENT!=='landing'){go('landing')}
  ceStartGate();
  toast('گفت‌وگوی جدید');
};
ACT.chatBack=function(){if(CE.f&&CE.hist.length){ceBack()}};
ACT.chatStop=function(){
  if(!CE.f){return}
  CE.f=null;CE.i=0;CE.li=0;CE.hist=[];
  botC('گفت‌وگو بسته شد. مسیر فعلی شما حفظ شده است.',[['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']]);
};
/* V0.27 — بازکردن/بستن سایدبار (جایگزین چت شناور) */
ACT.fcb=function(){if(CURRENT!=='landing'){go('landing')}};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 5 — ACT.dt/df/dc/dfc → مودال درخواست‌ها (جایگزین داشبورد)
 * ══════════════════════════════════════════════════════════════════ */
rep(`ACT.dt=function(el){var t=el.getAttribute('data-t'),c=el.getAttribute('data-cat');if(c){S.ui.dcat=c;save()}if(t==='wallet'||t==='tok'){S.ui.atab=(t==='tok'?'plan':'wallet');save();if(CURRENT==='profile'){renderCurrent()}else{go('profile')}return}if(t==='con'){S.ui.atab='contracts';save();if(CURRENT==='profile'){renderCurrent()}else{go('profile')}return}DASHT=(t==='req'?'req':'flows');if(DASHT!=='req'){DASHF='all'}if(CURRENT==='dash')renderCurrent();else go('dash')};
ACT.df=function(el){DASHF=el.getAttribute('data-f');DASHT='req';if(CURRENT==='dash')renderCurrent();else go('dash')};
ACT.dc=function(el){S.ui.dcat=el.getAttribute('data-cat');SIDEOPEN=S.ui.dcat;save();DASHT='req';if(CURRENT==='dash')renderCurrent();else go('dash')};
ACT.dfc=function(el){S.ui.dcat=el.getAttribute('data-cat');SIDEOPEN=S.ui.dcat;DASHF=el.getAttribute('data-f');DASHT='req';save();if(CURRENT==='dash')renderCurrent();else go('dash')};`,
`/* V0.27 — داشبورد حذف شد؛ درخواست‌ها مودال گفت‌وگومحور باز می‌شوند */
E27.reqModal=function(cat,f){
  cat=cat||S.ui.dcat||'rent';f=f||'all';
  S.ui.dcat=cat;save();
  var list=[],i;
  for(i=0;i<S.reqs.length;i++){
    var r=S.reqs[i];
    if(r.cat!==cat)continue;
    if(f==='open'&&(r.status==='کامل شد'||r.status==='لغو شد'))continue;
    if(f==='prog'&&r.status!=='در حال انجام')continue;
    if(f==='done'&&r.status!=='کامل شد')continue;
    list.push(r);
  }
  var h='<h3>درخواست‌های من</h3><div class="chips" style="margin:10px 0">'+SIDEFLOWS.map(function(x){
    return '<button class="chip'+(cat===x.cat?' on':'')+'" data-act="rmodCat" data-cat="'+x.cat+'" aria-pressed="'+(cat===x.cat)+'">'+x.n+' ('+fa(cntCat(x.cat,'all'),0)+')</button>';
  }).join('')+'</div>';
  h+='<div class="seg" style="margin-bottom:12px">'+[['all','همه'],['open','جاری'],['prog','در حال انجام'],['done','انجام‌شده']].map(function(x){
    return '<button class="'+(f===x[0]?'on':'')+'" data-act="rmodF" data-f="'+x[0]+'">'+x[1]+'</button>';
  }).join('')+'</div>';
  if(!list.length){
    h+='<div class="empty"><b>درخواستی در این دسته نیست</b><div class="note">از «گفت‌وگوی جدید» مسیر دلخواه را با دستیار شروع کنید.</div></div>';
  }else{
    h+='<div class="tblwrap"><table class="tbl"><thead><tr><th>عنوان</th><th>وضعیت</th><th>تاریخ</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>';
    list.slice(0,20).forEach(function(r2){
      var fv=MODBY[r2.cat]?MODBY[r2.cat].v:null;
      h+='<tr><td>'+esc(r2.title)+'</td><td>'+stB(r2.status)+'</td><td>'+dt(r2.t)+'</td><td><div class="fs-actions"><button class="btn btn-xs" data-act="reqDetail" data-id="'+r2.id+'">جزئیات</button>'+(fv?'<button class="btn btn-xs" data-cf="'+r2.cat+'">ادامه در گفت‌وگو</button>':'')+'</div></td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="newRequest">درخواست جدید</button><button class="btn" data-act="closeModal">بستن</button></div>';
  openModal(h);
};
ACT.reqModal=function(){E27.reqModal(S.ui.dcat||'rent',DASHF)};
ACT.rmodCat=function(el){E27.reqModal(el.getAttribute('data-cat'),DASHF)};
ACT.rmodF=function(el){DASHF=el.getAttribute('data-f');E27.reqModal(S.ui.dcat,DASHF)};
ACT.dt=function(el){var t=el.getAttribute('data-t'),c=el.getAttribute('data-cat');if(c){S.ui.dcat=c;save()}if(t==='wallet'||t==='tok'){S.ui.atab=(t==='tok'?'plan':'wallet');save();go('profile');return}if(t==='con'){S.ui.atab='contracts';save();go('profile');return}DASHF=(t==='req'?'open':'all');E27.reqModal(S.ui.dcat,DASHF)};
ACT.df=function(el){DASHF=el.getAttribute('data-f');E27.reqModal(S.ui.dcat,DASHF)};
ACT.dc=function(el){S.ui.dcat=el.getAttribute('data-cat');save();DASHF='req';E27.reqModal(S.ui.dcat,DASHF)};
ACT.dfc=function(el){S.ui.dcat=el.getAttribute('data-cat');DASHF=el.getAttribute('data-f');save();E27.reqModal(S.ui.dcat,DASHF)};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 6 — renderSidebar → سایدبار گفت‌وگومحور ChatGPT-سبک
 * ══════════════════════════════════════════════════════════════════ */
rep(`function renderSidebar(){
  var el=document.getElementById('side'),app=document.getElementById('appwrap');
  if(!el){return}
  if(!S.auth){
    el.innerHTML='';el.style.display='none';
    if(app){app.style.gridTemplateColumns='1fr'}
    return;
  }
  el.style.display='';if(app){app.style.gridTemplateColumns=''}
  function item(on,attr,ic,label,bd){
    return '<div class="sitem'+(on?' on':'')+'" '+attr+' role="button" tabindex="0"'+(on?' aria-current="page"':'')+'><span class="si">'+(ICONS[ic]?ico(ic):ic)+'</span><span>'+label+'</span>'+(bd?'<span class="bd">'+bd+'</span>':'')+'</div>';
  }
  var h=item(CURRENT==='landing','data-view="landing"','chat','دستیار گفت‌وگومحور');
  h+=item(CURRENT==='home','data-view="home"','home','صفحهٔ اصلی');
  h+=item(CURRENT==='map','data-view="map"','map','نقشه');
  h+='<div class="sg">فلوها</div>';
  h+=item(CURRENT==='dash'&&(DASHT==='flows'||DASHT==='req'),'data-act="dt" data-t="flows"','dash','همهٔ فلوها و درخواست‌ها');
  SIDEFLOWS.forEach(function(f){
    var cur=(CURRENT==='invest'&&((f.cat==='invb'&&S.ui.tab==='b')||(f.cat==='invr'&&S.ui.tab==='r')))||(CURRENT===f.view&&f.view!=='invest')||(CURRENT==='dash'&&DASHT==='req'&&S.ui.dcat===f.cat);
    var open=(SIDEOPEN===f.cat),nOpen=cntCat(f.cat,'open');
    var fl=f.cat==='svc'?null:wf(f.cat),nRun=f.cat==='svc'?0:runningWfs(f.cat).length,goL='شروع فلو';
    if(f.cat==='svc'){goL='مشاهدهٔ خدمات'}
    else if(nRun>1){goL='مدیریت '+fa(nRun,0)+' فلوی در جریان'}
    else if(fl&&fl.step>1&&!fl.done){goL='ادامهٔ فلو — مرحلهٔ '+fa(fl.step,0)}
    else if(fl&&fl.done&&!nRun){goL='مشاهدهٔ فلو'}
    var goA=f.view?('data-view="'+f.view+'"'):('data-act="'+f.act+'"'+(f.t?' data-t="'+f.t+'"':''));
    h+='<div class="sflow'+(open?' open':'')+(cur?' cur':'')+'" data-cat="'+f.cat+'">'+
    '<button class="sfh" data-act="sfl" data-cat="'+f.cat+'" aria-expanded="'+(open?'true':'false')+'" aria-controls="sfp-'+f.cat+'"'+(cur?' aria-current="page"':'')+'><span class="si">'+(ICONS[f.cat]?ico(f.cat):f.ic)+'</span><span class="sfn">'+f.n+'</span>'+(nRun?'<span class="bd" title="فلوی در جریان">'+fa(nRun,0)+'</span>':'')+(nOpen?'<span class="bd warn" title="درخواست جاری">'+fa(nOpen,0)+'</span>':'')+'<i class="chev"></i></button>'+
    '<div class="sfp" id="sfp-'+f.cat+'"><div class="sfp-in">'+
    '<div class="sitem sub go" '+goA+' role="button" tabindex="0">'+goL+' ←</div>';
    [['all','همهٔ درخواست‌ها'],['open','جاری'],['prog','در حال انجام'],['done','انجام‌شده‌ها']].forEach(function(sf){
      var c=cntCat(f.cat,sf[0]);
      var don=CURRENT==='dash'&&DASHT==='req'&&S.ui.dcat===f.cat&&DASHF===sf[0];
      h+='<div class="sitem sub'+(don?' on':'')+'" data-act="dfc" data-cat="'+f.cat+'" data-f="'+sf[0]+'" role="button" tabindex="0"><span>'+sf[1]+'</span>'+(c?'<span class="bd'+(sf[0]==='done'?' ok':(sf[0]==='open'?' warn':''))+'">'+fa(c,0)+'</span>':'')+'</div>';
    });
    h+='</div></div></div>';
  });
  h+='<div class="sg">حساب</div>';
  h+=item(CURRENT==='profile','data-act="account" data-tab="overview"','user','حساب کاربری');
  el.innerHTML=h;
}`,
`/* V0.27 — سایدبار گفت‌وگومحور: فقط گفت‌وگوی جدید، جست‌وجو، تاریخچه، تنظیمات */
var E27={sq:'',renId:null,txBusy:false};
var E27_IC={
  newchat:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  search:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chat:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg>',
  fold:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  unfold:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  wallet:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>',
  user:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>',
  gear:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
  trash:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  pen:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3l4 4L8 20l-5 1 1-5z"/></svg>'
};
E27.groupOf=function(ts){
  try{
    var d=new Date(ts),n=new Date();
    var day=864e5,d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
    var t0=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
    var diff=Math.round((d0-t0)/day);
    if(diff<=0)return 'امروز';
    if(diff===1)return 'دیروز';
    if(diff<7)return '۷ روز گذشته';
    if(diff<30)return '۳۰ روز گذشته';
    return 'قدیمی‌تر';
  }catch(e){return ''}
};
E27.sessRow=function(s){
  var pinLab=s.pinned?'برداشتن سنجاق':'سنجاق کردن';
  return '<div class="sitem e22-sess e27-sess" data-act="sessOpen" data-sess="'+qesc(s.id)+'" role="button" tabindex="0" title="بازیابی این گفت‌وگو">'+
    '<span class="si" aria-hidden="true">'+E27_IC.chat+'</span>'+
    '<span class="e22-sess-main"><span class="e22-sess-t">'+esc(s.title||'بدون عنوان')+'</span>'+
    '<small class="e22-sess-time">'+E22.rel(s.ts)+' · '+fa((s.hist||[]).length,0)+' پیام</small></span>'+
    '<span class="e22-sess-acts">'+
    '<button class="e22-sact" type="button" data-act="sessPin" data-sess="'+qesc(s.id)+'" aria-pressed="'+(s.pinned?'true':'false')+'" aria-label="'+pinLab+'" title="'+pinLab+'">'+(s.pinned?'📌':'📍')+'</button>'+
    '<button class="e22-sact" type="button" data-act="sessRename" data-sess="'+qesc(s.id)+'" aria-label="تغییر نام گفت‌وگو" title="تغییر نام">'+E27_IC.pen+'</button>'+
    '<button class="e22-sact e22-sact-del" type="button" data-act="sessDel" data-sess="'+qesc(s.id)+'" aria-label="حذف گفت‌وگو" title="حذف گفت‌وگو">'+E27_IC.trash+'</button>'+
    '</span></div>';
};
E27.sessListHTML=function(){
  if(!S.chats||!S.chats.length)return '<div class="note" style="padding:10px 8px;font-size:12px">هنوز گفت‌وگویی بایگانی نشده است. پس از گفت‌وگو با دستیار، تاریخچه اینجا می‌آید.</div>';
  var f=E27.sq?normFa(E27.sq):'';
  var valid=S.chats.filter(function(s){return s&&s.id&&s.hist});
  if(f){
    valid=valid.filter(function(s){
      if(normFa(s.title||'').indexOf(f)>=0)return true;
      return (s.hist||[]).some(function(m){return m&&m.h&&normFa(String(m.h).replace(/<[^>]*>/g,' ')).indexOf(f)>=0});
    });
  }
  if(!valid.length)return '<div class="note" style="padding:10px 8px;font-size:12px">نتیجه‌ای برای «'+esc(E27.sq)+'» پیدا نشد.</div>';
  var pin=valid.filter(function(s){return s.pinned}).sort(function(a,b){return b.ts-a.ts});
  var rest=valid.filter(function(s){return !s.pinned}).sort(function(a,b){return b.ts-a.ts});
  var h='';
  if(pin.length){h+='<div class="e27-sday">📌 سنجاق‌شده</div>';pin.forEach(function(s){h+=E27.sessRow(s)})}
  var lastG=null;
  rest.forEach(function(s){
    var g=E27.groupOf(s.ts);
    if(g!==lastG){h+='<div class="e27-sday">'+g+'</div>';lastG=g}
    h+=E27.sessRow(s);
  });
  return h;
};
function renderSidebar(){
  var el=document.getElementById('side'),app=document.getElementById('appwrap');
  if(!el){return}
  if(!S.auth){
    el.innerHTML='';el.style.display='none';
    if(app){app.style.gridTemplateColumns='1fr'}
    return;
  }
  el.style.display='';if(app){app.style.gridTemplateColumns=''}
  var fold=document.body.classList.contains('sidefold');
  var h='<div class="e27-sidehead"><button class="e27-fold" data-act="sideFold" aria-label="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'" title="'+(fold?'باز کردن سایدبار':'جمع کردن سایدبار')+'">'+(fold?E27_IC.unfold:E27_IC.fold)+'</button></div>';
  h+='<button class="e27-new" data-act="chatNew">'+E27_IC.newchat+' گفت‌وگوی جدید</button>';
  h+='<div class="e27-search">'+E27_IC.search+'<input id="e27-sq" type="text" placeholder="جست‌وجو در گفت‌وگوها…" aria-label="جست‌وجو در گفت‌وگوها" value="'+qesc(E27.sq||'')+'"></div>';
  h+='<div class="e27-slist" id="e27-slist" aria-label="گفت‌وگوهای پیشین">'+E27.sessListHTML()+'</div>';
  h+='<div class="e27-sbot">'+
    '<button class="e27-srow" data-act="themeToggle" aria-pressed="'+(E22.isDark()?'true':'false')+'" aria-label="تغییر حالت روشن/تاریک"><span class="si">'+(E22.isDark()?E22.ICO.sun:E22.ICO.moon)+'</span><span>'+(E22.isDark()?'حالت روشن':'حالت تاریک')+'</span></button>'+
    '<button class="e27-srow" data-act="wallet"><span class="si">'+E27_IC.wallet+'</span><span>کیف پول</span><small style="margin-inline-start:auto">'+rial(S.wallet)+'</small></button>'+
    '<button class="e27-srow" data-act="account" data-tab="overview"><span class="si">'+E27_IC.user+'</span><span>'+esc(S.auth.name||'حساب کاربری')+'</span><small style="margin-inline-start:auto">'+fa(S.tokens,0)+' توکن</small></button>'+
    '<button class="e27-srow" data-view="profile"><span class="si">'+E27_IC.gear+'</span><span>تنظیمات و حساب</span></button>'+
    '</div>';
  el.innerHTML=h;
  var sq=el.querySelector('#e27-sq');
  if(sq){sq.addEventListener('input',function(){E27.sq=sq.value;E27.applySq()})}
}
E27.applySq=function(){
  var box=document.getElementById('e27-slist');
  if(!box)return;
  box.innerHTML=E27.sessListHTML();
  a11yify(box);
};`);

/* E22.afterSidebar → دیگر چیزی تزریق نمی‌کند (سایدبار جدید همه‌چیز را دارد) */
rep(`E22.afterSidebar=function(){
  var el=document.getElementById('side');
  if(!el||!S.auth||!el.innerHTML)return;
  var dark=E22.isDark(),lab=dark?'حالت روشن':'حالت تاریک';
  el.insertAdjacentHTML('afterbegin',
    '<div class="e22-shead"><button class="e22-theme" type="button" data-act="themeToggle" aria-pressed="'+(dark?'true':'false')+'" aria-label="'+lab+'" title="'+lab+'">'+(dark?E22.ICO.sun:E22.ICO.moon)+'</button></div>');
  var sh=E22.sessHTML();
  if(sh){
    el.insertAdjacentHTML('beforeend',sh);
    var inp=el.querySelector('.e22-sfilter-in');
    if(inp)inp.addEventListener('input',function(){E22.filter=inp.value;E22.applySessFilter()});
    E22.applySessFilter();
  }
};`,
`/* V0.27: سایدبار جدید (renderSidebar) خودش تم/جست‌وجو/تاریخچه را رندر می‌کند */
E22.afterSidebar=function(){};
ACT.sideFold=function(){
  document.body.classList.toggle('sidefold');
  try{localStorage.setItem('mahalino_sidefold',document.body.classList.contains('sidefold')?'1':'0')}catch(e){}
  renderSidebar();
};`);

/* تغییر نام گفت‌وگو */
rep(`ACT.sessDel=function(el){`,
`ACT.sessRename=function(el){
  var id=(el&&el.getAttribute)?el.getAttribute('data-sess'):null;
  var s=E22.findSess(id);
  if(!s){toast('این گفت‌وگو در تاریخچه پیدا نشد.');return}
  openModal('<h3>تغییر نام گفت‌وگو</h3><div class="srow" style="margin-top:10px"><input class="inp" id="e27-ren" aria-label="عنوان گفت‌وگو" value="'+qesc(s.title||'')+'" maxlength="60"></div><div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="sessRenameOk" data-sess="'+qesc(id)+'">ذخیره</button><button class="btn" data-act="closeModal">انصراف</button></div>');
  setTimeout(function(){var i2=document.getElementById('e27-ren');if(i2){i2.focus();i2.select()}},50);
};
ACT.sessRenameOk=function(el){
  var id=(el&&el.getAttribute)?el.getAttribute('data-sess'):null;
  var s=E22.findSess(id);
  var i2=document.getElementById('e27-ren');
  if(s&&i2){
    var t=i2.value.replace(/^\\s+|\\s+$/g,'');
    if(t){s.title=t.slice(0,60);save();toast('نام گفت‌وگو به‌روز شد')}
  }
  closeModal();renderSidebar();
};
ACT.sessDel=function(el){`);

/* E22.sessOpen — وقتی روی گفت‌وگوی پیشین کلیک می‌شود، به فضای گفت‌وگو برو (بدون چت شناور) */
rep(`  botC(E22.NOTE); /* پیام زندهٔ فقط-نمایش؛ در بایگانی بعدی بخشی از تاریخچهٔ همین گفت‌وگو می‌ماند */
  if(CURRENT!=='landing'){try{toggleF(true)}catch(e){}}
};`,
`  botC(E22.NOTE); /* پیام زندهٔ فقط-نمایش؛ در بایگانی بعدی بخشی از تاریخچهٔ همین گفت‌وگو می‌ماند */
  if(CURRENT!=='landing'){go('landing')}
};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 7 — VIEWS.landing → فضای کاری گفت‌وگو (تک‌کامپوزر)
 * ══════════════════════════════════════════════════════════════════ */
rep(`VIEWS.landing=function(){
  var el=document.getElementById('v-landing');
  var nOpen=S.reqs.filter(reqOpen).length;
  var quick=[['rent','اجاره'],['buy','خرید'],['grt','اجارهٔ تضمینی'],['invr','درآمد اجاره'],['mkt','پروژه‌ها'],['stay','اقامتگاه']];
  el.innerHTML='<div class="landing-grid">'+
  '<div class="ch">'+
  '<div class="ch-h"><span class="av" aria-hidden="true">'+ico('chat',18)+'</span><div class="chttl"><b>دستیار محلینو</b><small>نیازسنجی تا پایان مسیر، با گفت‌وگو</small></div><button class="hbtn" data-act="chatNew">گفت‌وگوی جدید</button></div>'+
  '<div class="cstep" id="landingStep" hidden><span id="landingStepTxt"></span><span class="bar"><i id="landingStepBar"></i></span></div>'+
  '<div class="csum" id="landingSum" hidden><span id="landingSumTxt"></span><button class="hbtn" data-act="chatBack">ویرایش پاسخ</button></div>'+
  '<div class="ch-b" id="chatB" aria-live="polite"></div>'+
  '<div class="chat-sugg" id="chatSugg" aria-label="پیشنهادهای دستیار"></div>'+
  '<div class="cwr" id="chatCwr"><div class="cwr-prev" id="chatPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="chatAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="chatIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="chatSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="chatFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+
  '</div>'+
  '<aside class="sidepanel" aria-label="میان‌برهای دستیار">'+
  '<h3>شروع سریع</h3><p class="note">یک مسیر را انتخاب کنید؛ دستیار قدم‌به‌قدم همراه می‌شود.</p><div class="panel-list">'+
  quick.map(function(q){var st=flowStateLabel(q[0]);return '<button class="panel-item" data-cf="'+q[0]+'"><span class="pi">'+(ICONS[q[0]]?ico(q[0],15):'')+'</span><span>'+q[1]+'</span>'+(st.cls?'<span class="badge '+st.cls+'">'+st.t+'</span>':'<span class="ps">شروع</span>')+'</button>'}).join('')+
  '</div>'+
  '<h3 style="margin-top:16px">وضعیت شما</h3><div class="panel-list">'+
  '<button class="panel-item" data-act="newRequest"><span class="pi">'+ico('flows',15)+'</span><span>درخواست جدید</span></button>'+
  '<button class="panel-item" data-act="dt" data-t="req"><span class="pi">'+ico('con',15)+'</span><span>درخواست‌های من</span><span class="ps">'+fa(nOpen,0)+' جاری</span></button>'+
  '<button class="panel-item" data-view="map"><span class="pi">'+ico('map',15)+'</span><span>نقشه</span></button>'+
  '</div></aside></div>';
  cr();
  var s=document.getElementById('chatSend');
  if(s){s.onclick=function(){var i=document.getElementById('chatIn');if(!i)return;ceSendWithAtt(i.value,'chat');i.value=''}}
  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('chat');
  if(!HIST.length){ceStartGate()}else{cr()}
};`,
`/* V0.27 — فضای کاری گفت‌وگو: تنها نمای اصلی؛ یک کامپوزر واحد */
VIEWS.landing=function(){
  var el=document.getElementById('v-landing');
  el.innerHTML='<div class="ch ch-main">'+
  '<div class="ch-h"><span class="av" aria-hidden="true">'+ico('chat',18)+'</span><div class="chttl"><b>دستیار محلینو</b><small>همهٔ قابلیت‌ها در همین گفت‌وگو</small></div><button class="e27-expand" data-act="sideFold" aria-label="نمایش سایدبار">☰ سایدبار</button><button class="hbtn" data-act="chatNew">گفت‌وگوی جدید</button></div>'+
  '<div class="cstep" id="landingStep" hidden><span id="landingStepTxt"></span><span class="bar"><i id="landingStepBar"></i></span></div>'+
  '<div class="csum" id="landingSum" hidden><span id="landingSumTxt"></span><button class="hbtn" data-act="chatBack">ویرایش پاسخ</button></div>'+
  '<div class="ch-b" id="chatB" aria-live="polite"></div>'+
  '<div class="chat-sugg" id="chatSugg" aria-label="پیشنهادهای دستیار"></div>'+
  '<div class="cwr" id="chatCwr"><div class="cwr-prev" id="chatPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="chatAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="chatIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="chatSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="chatFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+
  '</div>';
  cr();
  var s=document.getElementById('chatSend');
  if(s){s.onclick=function(){var i=document.getElementById('chatIn');if(!i)return;ceSendWithAtt(i.value,'chat');i.value=''}}
  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('chat');
  if(!HIST.length){ceStartGate()}else{cr()}
};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 8 — حذف کامل VIEWS.home و VIEWS.dash و چت داکِ داشبورد
 * ══════════════════════════════════════════════════════════════════ */
rep(`VIEWS.home=function(){
  var el=document.getElementById('v-home');
  var openReqs=S.reqs.filter(reqOpen);
  var mods=[
  {m:'rent',v:'rent',t:'اجارهٔ بلندمدت',d:'بودجه، محله، بازدید و قرارداد'},
  {m:'buy',v:'buy',t:'خرید و فروش',d:'بازار، بررسی حقوقی و پرداخت امانی'},
  {m:'grt',v:'grt',t:'اجارهٔ تضمینی',d:'واگذاری مدیریت اجاره، دریافت اجاره‌بها و پیگیری مستأجر'},
  {m:'invr',act:'sinv',t:'r',t2:'درآمد اجاره',d:'دارایی‌های اجاره، مقایسه و فروش جزئی'},
  {m:'mkt',v:'mkt',t:'پروژه‌ها',d:'کارفرما یا پیمانکار؛ پیشنهاد و واگذاری'},
  {m:'build',v:'build',t:'ساخت و تأمین',d:'سفارش تأمین، پیشرفت و تحویل'},
  {m:'stay',v:'stay',t:'اقامتگاه',d:'جست‌وجو، رزرو امانی و ورود'}];
  var h='<div class="hero"><h1>از <em>اجارهٔ یک واحد</em> تا <em>واگذاری یک پروژه</em></h1>'+
  '<p>مسیر را انتخاب کنید یا با دستیار پیش بروید.</p>'+
  '<div class="qa"><button class="btn btn-lg btn-primary" data-act="newRequest">درخواست جدید</button><button class="btn btn-lg" data-view="landing">'+ico('chat')+' دستیار</button><button class="btn btn-lg" data-view="map">'+ico('map')+' نقشه</button></div></div>';
  var nResume=wfRunning().length;
  if(openReqs.length||nResume){
    h+='<div class="statusline"><span class="note" style="color:var(--ink2)">'+
    (openReqs.length?'<b>'+fa(openReqs.length,0)+'</b> درخواست جاری':'')+
    (openReqs.length&&nResume?' و ':'')+
    (nResume?'<b>'+fa(nResume,0)+'</b> فلوی نیمه‌تمام':'')+
    ' دارید</span>'+
    (openReqs.length?'<button class="btn btn-sm" data-act="dt" data-t="req">پیگیری درخواست‌ها ←</button>':'')+
    (nResume?'<button class="btn btn-sm" data-act="dt" data-t="flows">ادامهٔ کار ←</button>':'')+
    '</div>';
  }
  var groups=[
    ['خانه برای زندگی','اجاره یا خرید ملک',[0,1]],
    ['واگذاری مدیریت','ملک را به محلینو بسپارید',[2]],
    ['سرمایه‌گذاری','درآمد اجاره',[3]],
    ['پروژه و ساخت','کارفرما و پیمانکار',[4,5]],
    ['سفر','رزرو اقامتگاه',[6]]];
  groups.forEach(function(g){
    h+='<div class="sec"><h3>'+g[0]+'</h3><span>'+g[1]+'</span></div><div class="grid g3">'+g[2].map(function(ix){
      var m=mods[ix],st=flowStateLabel(m.m),attr=m.act?(' data-act="'+m.act+'" data-t="'+m.t+'"'):(' data-view="'+m.v+'"');
      var go=st.cls==='b-ok'?'مشاهده و درخواست جدید':(st.t.indexOf('در جریان')===0?'ادامه':'شروع');
      return '<div class="mcard"'+attr+' role="button" tabindex="0"><span class="mi">'+ico(m.m)+'</span><h3>'+(m.t2||m.t)+'</h3><p>'+m.d+'</p>'+
      (st.cls?'<span class="mstate"><span class="badge '+st.cls+'">'+st.t+'</span></span>':'')+'<span class="go">'+go+' ←</span></div>';
    }).join('')+'</div>';
  });
  h+='<div class="sec"><h3>خدمات پس از سکونت</h3></div><div class="card tight"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="svc-ic">'+ico('svc',22)+'</div><div style="flex:1;min-width:200px"><b>تأسیسات، نظافت و تعمیرات</b><p class="note">سفارش، پرداخت و پیگیری در محلینو.</p></div><button class="btn btn-primary" data-act="svcs">مشاهدهٔ خدمات</button></div></div>';
  el.innerHTML=h;
};`,
`/* V0.27: صفحهٔ اصلی مستقل حذف شد — همهٔ مسیرها از منوی گفت‌وگویی (gate) شروع می‌شوند */
VIEWS.home=function(){var el=document.getElementById('v-home');if(el)el.innerHTML='';};`);

rep(`function dockAssistHTML(){
  return '<div class="ch dock">'+
  '<div class="ch-h"><span class="av">'+ico('chat',18)+'</span><div class="chttl"><b>دستیار محلینو</b><small>نیازسنجی تا پایان مسیر، با گفت‌وگو</small></div><button class="hbtn" data-act="chatNew">گفت‌وگوی جدید</button></div>'+
  '<div class="cstep" id="dashStep" hidden><span id="dashStepTxt"></span><span class="bar"><i id="dashStepBar"></i></span></div>'+
  '<div class="csum" id="dashSum" hidden><span id="dashSumTxt"></span><button class="hbtn" data-act="chatBack">ویرایش پاسخ</button></div>'+
  '<div class="ch-b" id="dashB" aria-live="polite"></div>'+
  '<div class="chat-sugg" id="dashSugg" aria-label="پیشنهادهای دستیار"></div>'+
  '<div class="cwr" id="dashCwr"><div class="cwr-prev" id="dashPrev" hidden></div><div class="cwr-row"><button class="cwr-att" id="dashAtt" type="button" aria-label="پیوست فایل یا تصویر" title="پیوست فایل یا تصویر">+</button><textarea id="dashIn" class="cwr-in" rows="1" placeholder="پیام بنویسید یا از پیشنهادها انتخاب کنید" aria-label="پیام به دستیار"></textarea><button id="dashSend" class="cwr-send" type="button">ارسال</button></div><input type="file" id="dashFile" multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp"></div>'+
  '</div>';
}
function bindDockChat(){
  var s=document.getElementById('dashSend');
  if(s){s.onclick=function(){var i2=document.getElementById('dashIn');if(!i2)return;ceSendWithAtt(i2.value,'dash');i2.value=''}}
  var i3=document.getElementById('dashIn');
  if(i3){i3.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('dash');
}
VIEWS.dash=function(){
  var el=document.getElementById('v-dash'),i;
  if(DASHT!=='flows'&&DASHT!=='req'){DASHT='flows'}
  var open=0,done=0;
  for(i=0;i<S.reqs.length;i++){
    if(S.reqs[i].status==='کامل شد'){done++}
    else if(S.reqs[i].status!=='لغو شد'){open++}
  }
  var active=wfRunning().length,comp=wfDoneCount();
  var h='<div class="wtop" style="margin-bottom:14px"><div><h2>سلام '+esc(S.auth.name)+'</h2><p>خلاصهٔ درخواست‌ها، فلوها و قراردادها</p></div><div class="head-actions"><button class="btn btn-sm btn-primary" data-act="newRequest">درخواست جدید</button><button class="btn btn-sm" data-act="dt" data-t="req">درخواست‌های من</button><button class="btn btn-sm" data-act="account" data-tab="contracts">قراردادها</button></div></div>';
  h+='<div class="grid g4">'+
  '<div class="stat"><b>'+fa(open,0)+'</b><span>درخواست جاری</span></div>'+
  '<div class="stat"><b>'+fa(done,0)+'</b><span>درخواست انجام‌شده</span></div>'+
  '<div class="stat"><b>'+fa(active,0)+'</b><span>فلوی نیمه‌تمام</span></div>'+
  '<div class="stat"><b>'+fa(S.contracts.length,0)+'</b><span>قرارداد ثبت‌شده</span></div></div>';
  var resumes=resumeChips('btn');
  if(resumes.length){
    h+='<div class="resume"><b>ادامهٔ فلوهای نیمه‌تمام</b><div class="chips">'+resumes.join('')+'</div></div>';
  }
  h+='<div class="seg" style="margin:18px 0 14px">'+[['flows','فلوها'],['req','درخواست‌ها']].map(function(t){
    return '<button class="'+(DASHT===t[0]?'on':'')+'" data-act="dt" data-t="'+t[0]+'" aria-pressed="'+(DASHT===t[0]?'true':'false')+'">'+t[1]+'</button>';
  }).join('')+'</div>';
  if(DASHT==='flows'){
    h+='<p class="note" style="margin-bottom:10px">برای دیدن درخواست‌های هر فلو، روی کارت آن کلیک کنید.</p>';
    h+='<div class="grid g4">'+SIDEFLOWS.map(function(f){
      var st=flowStateLabel(f.cat),nRun=f.cat==='svc'?0:runningWfs(f.cat).length;
      return '<div class="flowcard" data-act="dc" data-cat="'+f.cat+'" role="button" tabindex="0">'+
      '<div class="fi">'+ico(f.cat)+'</div><h3>'+f.n+'</h3>'+
      '<div class="chips">'+(st.cls?'<span class="badge '+st.cls+'">'+st.t+'</span>':'')+(nRun?'<span class="badge b-warn">'+fa(nRun,0)+' فلوی در جریان</span>':'')+'<span class="badge b-info">همه '+fa(cntCat(f.cat,'all'),0)+'</span><span class="badge b-warn">جاری '+fa(cntCat(f.cat,'open'),0)+'</span></div>'+
      '<span style="color:var(--brand);font-size:12px;font-weight:700">مشاهدهٔ درخواست‌ها ←</span></div>';
    }).join('')+'</div>';
  }else if(DASHT==='req'){
    var dcat=S.ui.dcat||'rent';
    h+='<div class="chips" style="margin-bottom:10px">'+SIDEFLOWS.map(function(f){
      return '<button class="chip'+(dcat===f.cat?' on':'')+'" data-act="dc" data-cat="'+f.cat+'" aria-pressed="'+(dcat===f.cat?'true':'false')+'">'+f.n+' ('+fa(cntCat(f.cat,'all'),0)+')</button>';
    }).join('')+'</div>';
    h+='<div class="seg" style="margin-bottom:12px">'+[['all','همه'],['open','جاری'],['prog','در حال انجام'],['done','انجام‌شده']].map(function(f){
      return '<button class="'+(DASHF===f[0]?'on':'')+'" data-act="df" data-f="'+f[0]+'">'+f[1]+'</button>';
    }).join('')+'</div>';
    var list=[];
    for(i=0;i<S.reqs.length;i++){
      var r=S.reqs[i];
      if(r.cat!==dcat)continue;
      if(DASHF==='open'&&(r.status==='کامل شد'||r.status==='لغو شد'))continue;
      if(DASHF==='prog'&&r.status!=='در حال انجام')continue;
      if(DASHF==='done'&&r.status!=='کامل شد')continue;
      list.push(r);
    }
    if(!list.length){
      h+='<div class="empty"><b>درخواستی در این دسته نیست</b><div class="note">می‌توانید از «درخواست جدید» یک مسیر را شروع کنید.</div><button class="btn btn-sm btn-primary" style="margin-top:10px" data-act="newRequest">درخواست جدید</button></div>';
    }else{
      h+='<div class="tblwrap"><table class="tbl"><thead><tr><th>عنوان</th><th>وضعیت</th><th>تاریخ</th><th><span class="sr">اقدام</span></th></tr></thead><tbody>';
      list.slice(0,12).forEach(function(r2){
        var fv=MODBY[r2.cat]?MODBY[r2.cat].v:null;
        h+='<tr><td>'+esc(r2.title)+'</td><td>'+stB(r2.status)+'</td><td>'+dt(r2.t)+'</td><td><div class="fs-actions"><button class="btn btn-xs" data-act="reqDetail" data-id="'+r2.id+'">جزئیات</button>'+(fv?'<button class="btn btn-xs" data-view="'+fv+'">فلو</button>':'')+'</div></td></tr>';
      });
      h+='</tbody></table></div>';
    }
  }
  h='<div class="dgrid"><div>'+h+'</div><aside class="dock-assist" aria-label="دستیار محلینو">'+dockAssistHTML()+'</aside></div>';
  el.innerHTML=h;
  bindDockChat();
};`,
`/* V0.27: داشبورد و چت داکِ آن حذف شد — درخواست‌ها با E27.reqModal در گفت‌وگو باز می‌شوند */`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 9 — ceSend/ceVal/ceSmart/ceEnd/ctxSuggestions → مسیرهای گفت‌وگویی
 * ══════════════════════════════════════════════════════════════════ */
rep(`  var q=t.replace(/[يى]/g,'ی');
  if(/^(درخواست|نقشه|کیف پول|داشبورد|راهنما|کمک|منو)/.test(q)){
    usrC(t);
    if(/^درخواست/.test(q)){DASHT='req';DASHF='open';go('dash');return}
    if(/^نقشه/.test(q)){go('map');return}
    if(/^کیف پول/.test(q)){ACT.wallet();return}
    if(/^داشبورد/.test(q)){go('dash');return}
    if(/^(راهنما|کمک)/.test(q)){ceVal('!help');return}
    if(/^منو/.test(q)){ceVal('!menu');return}
  }`,
`  var q=t.replace(/[يى]/g,'ی');
  if(/^(درخواست|نقشه|کیف پول|شارژ|داشبورد|راهنما|کمک|منو)/.test(q)){
    usrC(t);
    if(/^درخواست/.test(q)){E27.reqModal(S.ui.dcat||'rent','open');return}
    if(/^نقشه/.test(q)){go('map');return}
    if(/^کیف پول/.test(q)){ACT.wallet();return}
    if(/^شارژ/.test(q)){E27.walletChat();return}
    if(/^داشبورد/.test(q)){ceVal('!menu');return}
    if(/^(راهنما|کمک)/.test(q)){ceVal('!help');return}
    if(/^منو/.test(q)){ceVal('!menu');return}
  }`);

rep(`  if(v.indexOf('F:')===0){
    var t=v.slice(2);
    if(t==='dashx'){go('dash')}
    else if(t==='sub'||t==='wallet'){S.ui.atab=(t==='sub'?'plan':'wallet');go('profile')}
    else if(t.indexOf('step:')===0){var sm=t.slice(5);if(MODBY[sm]){save();go(MODBY[sm].v)}else{ceStart(t)}}
    else{ceStart(t)}
    return;
  }`,
`  if(v.indexOf('F:')===0){
    var t=v.slice(2);
    if(t==='dashx'||t==='reqs'){E27.reqModal(S.ui.dcat||'rent','open')}
    else if(t==='sub'||t==='wallet'){S.ui.atab=(t==='sub'?'plan':'wallet');go('profile')}
    else if(t.indexOf('step:')===0){var sm=t.slice(5);if(MODBY[sm]){save();go(MODBY[sm].v)}else{ceStart(t)}}
    else{ceStart(t)}
    return;
  }`);

/* ceSmart — ارجاع‌های dash حذف */
rep(`if(has('قرارداد','کد رهگیری')){go('dash');DASHT='con';CE.f=null;save();renderCurrent();botC('بخش قراردادها را باز کردم.',null);return true}`,
`if(has('قرارداد','کد رهگیری')){S.ui.atab='contracts';save();go('profile');CE.f=null;botC('قراردادها در تنظیمات حساب باز شد.',null);return true}`);
rep(`if(has('منو','داشبورد')){go('dash');CE.f=null;return true}return false}`,
`if(has('منو','داشبورد')){ceVal('!menu');CE.f=null;return true}return false}`);

/* ceEnd — چیپ داشبورد → درخواست‌های من */
rep(`  var chips=[['منوی اصلی','!menu'],['داشبورد','F:dashx']];`,
`  var chips=[['منوی اصلی','!menu'],['درخواست‌های من','F:reqs']];`);

/* ctxSuggestions — بازنویسی کامل برای معماری گفت‌وگومحور */
rep(`  if(CURRENT==='home'){at('درخواست جدید','data-act="newRequest"',true);at('دستیار','data-view="landing"');at('درخواست‌ها','data-act="dt" data-t="req"');at('نقشه','data-view="map"')}
  else if(CURRENT==='landing'){at('اجاره','data-cf="rent"',true);at('خرید','data-cf="buy"');at('اقامتگاه','data-cf="stay"');at('راهنما','data-cq="راهنما"');at('درخواست‌ها','data-act="dt" data-t="req"')}
  else if(CURRENT==='dash'){at('درخواست جدید','data-act="newRequest"',true);at('درخواست‌ها','data-act="dt" data-t="req"');at('کیف پول','data-act="dt" data-t="wallet"');at('دستیار','data-act="fcb"')}
  else if(CURRENT==='map'){at('ثبت محل کار','data-act="pickWork"',true);at('دستیار','data-act="fcb"');at('درخواست‌ها','data-act="dt" data-t="req"')}
  else if(CURRENT==='svc'){at('پیگیری خدمات','data-act="svcFilter" data-f="open"',true);at('حساب کاربری','data-act="account" data-tab="overview"');at('نقشه','data-view="map"')}
  else if(CURRENT==='profile'){at('درخواست جدید','data-act="newRequest"',true);at('کیف پول','data-act="account" data-tab="wallet"');at('اشتراک و توکن','data-act="account" data-tab="plan"');at('فلوها','data-view="dash"');at('دستیار','data-act="fcb"')}
  else{
    var m=CURRENT==='invest'?'invr':CURRENT;
    if(MODBY[m]){
      at('ادامه در گفت‌وگو','data-act="flowInChat" data-m="'+m+'"',true);
      at('درخواست‌ها','data-act="dt" data-t="req" data-cat="'+(m==='invest'?'invr':m)+'"');
      at('نقشه','data-view="map"');
      at('دستیار','data-act="fcb"');
    }else{at('درخواست جدید','data-act="newRequest"',true)}
  }
  return out.slice(0,5);
}`,
`  if(CURRENT==='landing'){at('اجاره','data-cf="rent"',true);at('خرید','data-cf="buy"');at('اقامتگاه','data-cf="stay"');at('راهنما','data-cq="راهنما"');at('درخواست‌های من','data-act="reqModal"')}
  else if(CURRENT==='map'){at('ثبت محل کار','data-act="pickWork"',true);at('بازگشت به گفت‌وگو','data-view="landing"');at('درخواست‌های من','data-act="reqModal"')}
  else if(CURRENT==='svc'){at('پیگیری خدمات','data-act="svcFilter" data-f="open"',true);at('بازگشت به گفت‌وگو','data-view="landing"');at('حساب کاربری','data-act="account" data-tab="overview"')}
  else if(CURRENT==='profile'){at('بازگشت به گفت‌وگو','data-view="landing"',true);at('کیف پول','data-act="account" data-tab="wallet"');at('اشتراک و توکن','data-act="account" data-tab="plan"');at('درخواست‌های من','data-act="reqModal"')}
  else{
    var m=CURRENT==='invest'?'invr':CURRENT;
    if(MODBY[m]){
      at('ادامه در گفت‌وگو','data-act="flowInChat" data-m="'+m+'"',true);
      at('درخواست‌های من','data-act="dt" data-t="req" data-cat="'+(m==='invest'?'invr':m)+'"');
      at('بازگشت به گفت‌وگو','data-view="landing"');
    }else{at('درخواست جدید','data-act="newRequest"',true)}
  }
  return out.slice(0,5);
}`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 10 — toggleF/FCHAT → رفتار گفت‌وگویی
 * ══════════════════════════════════════════════════════════════════ */
rep(`var FCHAT={open:false};
function toggleF(v,skipGate){
  FCHAT.open=v;
  var w=document.getElementById('fchw');
  if(w){if(v){w.classList.add('on')}else{w.classList.remove('on')}}
  var f=document.getElementById('fcbfab');
  if(f){if(S.auth&&!v){f.classList.add('on')}else{f.classList.remove('on')}f.setAttribute('aria-expanded',v?'true':'false')}
  if(v){
    if(!HIST.length&&!skipGate){ceStartGate()}
    cr();
    renderChatMeta();
    var i=document.getElementById('fchIn');
    if(i){i.focus()}
  }
}`,
`var FCHAT={open:false}; /* V0.27: چت شناور حذف شد — سازگاری برای فراخوانی‌های باقی‌مانده */
function toggleF(v,skipGate){
  FCHAT.open=false;
  if(v&&CURRENT!=='landing'){go('landing')}
};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 13b — کارت‌های گفت‌وگویی هم عمودی
 * ══════════════════════════════════════════════════════════════════ */
rep(`function chatListCard(x,sel){
  return '<div class="ccard"><div class="cthumb">'+ph(x.seed,150,94,'')+'</div>'+
  '<div class="cb"><b>'+x.t+(sel?' ✓':'')+'</b><small>اجاره '+rial(x.rent)+' • رهن '+rial(x.dep)+' • '+fa(x.m2,0)+' متر • '+fa(x.age,0)+' ساله • طبقهٔ '+fa(x.floor,0)+' • '+fa(x.beds,0)+' خواب'+(placeLineText(x.hood,2)?'<br>'+esc(placeLineText(x.hood,2)):'')+'</small></div>'+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selL" data-l="'+x.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="detL" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savL" data-l="'+x.id+'" aria-label="نشان‌کردن">★</button></div></div>';
}
function chatBCard(x,sel){
  return '<div class="ccard"><div class="cthumb">'+ph(x.seed,150,94,'')+'</div>'+
  '<div class="cb"><b>'+x.t+(sel?' ✓':'')+'</b><small>'+fa(x.m2,0)+' متر • '+fa(x.age,0)+' ساله • طبقهٔ '+fa(x.floor,0)+' • '+fa(x.beds,0)+' خواب • هر متر '+rial(x.ppm)+' • کل '+rial(x.m2*x.ppm)+'</small></div>'+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selB" data-l="'+x.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="detB" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savB" data-l="'+x.id+'" aria-label="نشان‌کردن">★</button></div></div>';
}
function chatStayCard(s,sel,saved){
  return '<div class="ccard"><div class="cthumb">'+ph(s.seed,150,94,'')+'</div>'+
  '<div class="cb"><b>'+s.t+(sel?' ✓':'')+'</b><small>'+s.city+' • '+rial(s.p)+' / شب • ★ '+s.rate+(placeLineText(s.ll,2)?'<br>'+esc(placeLineText(s.ll,2)):'')+'</small></div>'+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selS" data-l="'+s.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="detS" data-l="'+s.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savS" data-l="'+s.id+'" aria-label="نشان‌کردن">'+(saved?'★':'☆')+'</button></div></div>';
}`,
`/* V0.27 — کارت‌های آگهی داخل گفت‌وگو: عمودی (pcard) */
function chatListCard(x,sel){
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">اجارهٔ ماهانه</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.rent)+'<small>ریال در ماه</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">ودیعه (رهن): <b style="color:var(--ink)">'+rial(x.dep)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(x.hood,2)?esc(placeLineText(x.hood,2))+'<br>':'')+'مالکیت: استعلام لازم — جزئیات کامل پس از «جزئیات» نمایش داده می‌شود.</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selL" data-l="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detL" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savL" data-l="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">★</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}
function chatBCard(x,sel){
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">فروش</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.m2*x.ppm)+'<small>قیمت کل</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">هر متر: <b style="color:var(--ink)">'+rial(x.ppm)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(x.hood,2)?esc(placeLineText(x.hood,2))+'<br>':'')+'مالکیت: استعلام لازم — جزئیات کامل پس از «جزئیات» نمایش داده می‌شود.</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selB" data-l="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detB" data-l="'+x.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savB" data-l="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">★</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}
function chatStayCard(s,sel,saved){
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(s.seed,480,360,'')+'<span class="pcard-type">اقامتگاه</span></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(s.p)+'<small>هر شب</small></div>'+
  '<div class="pcard-title">'+esc(s.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(s.city)+' · ★ '+s.rate+'</div>'+
  (s.amens&&s.amens.length?'<div class="pcard-amen">'+s.amens.slice(0,4).map(function(a){return '<span>'+esc(a)+'</span>'}).join('')+'</div>':'')+
  '<div class="pcard-extra">'+(placeLineText(s.ll,2)?esc(placeLineText(s.ll,2))+'<br>':'')+'قوانین: '+esc((s.rules||[]).slice(0,2).join(' · '))+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs btn-primary" data-cba="selS" data-l="'+s.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '<button class="btn btn-xs" data-cba="detS" data-l="'+s.id+'">جزئیات</button>'+
  '<button class="btn btn-xs" data-cba="savS" data-l="'+s.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore">بیشتر</button>'+
  '</div></div>';
}`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 12 — CSS تکمیلی: سرریز سایدبار
 * ══════════════════════════════════════════════════════════════════ */
rep(`/* ═══ E27-CSS-END — مرز درج CSS های بعدی ═══ */`,
`.e27-slist{overflow-x:hidden}
#side{overflow-x:hidden}
/* ═══ E27-CSS-END — مرز درج CSS های بعدی ═══ */`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 13 — کارت عمودی آگهی (P0: Property Listing Cards)
 * ══════════════════════════════════════════════════════════════════ */
rep(`function lcard2(x,D,sel,sc,fb){
  var saved=(D.saved||[]).indexOf(x.id)>=0;
  var out=x.rent>D.B.rentB;
  var _am=[x.elev,x.park,x.balc].filter(Boolean).length;
  return '<div class="lcard'+(sel?' sel':'')+'">'+
  '<div class="lart">'+ph(x.seed,400,250,'')+'<span class="match">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div>'+
  '<div class="lbody"><h4>'+x.t+'</h4><div class="adr"> '+findH(x.hood).n+'</div>'+
  '<div class="lprice" style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-size:14px;color:var(--brand-ink)">'+rial(x.rent)+'</b><span style="font-size:10.5px;color:var(--muted)">اجارهٔ ماهانه + رهن '+rial(x.dep)+'</span></div>'+
  '<div class="ltags"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span>'+(_am?'<span data-tip="امکانات: '+(x.elev?'آسانسور ':'')+(x.park?'پارکینگ ':'')+(x.balc?'بالکن':'')+'">+'+fa(_am,0)+' امکان</span>':'')+'</div>'+
  '<div class="ltags disttags">'+placeTags(x.hood,2)+'</div>'+
  (fb?diffBadges(rentDiffTags(x,D)):'<span class="badge '+(out?'b-bad':'b-ok')+'">'+(out?'بالاتر از سقف اجاره':'متناسب با سقف شما')+'</span>')+
  '<div class="lfoot"><span class="badge b-info" data-tip="وضعیت مالکیت هر آگهی فقط با استعلام رسمی قابل تأیید است؛ در «جزئیات» کامل‌تر بررسی می‌شود.">مالکیت: استعلام لازم</span>'+
  '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
  '<button class="btn btn-xs" data-act="rdet" data-id="'+x.id+'">جزئیات (۱۰ توکن)</button>'+
  '<button class="btn btn-xs" data-act="lsave" data-id="'+x.id+'" aria-label="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="rset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div></div></div>';
}`,
`/* V0.27 — کارت عمودی آگهی اجاره (Design System) */
function lcard2(x,D,sel,sc,fb){
  var saved=(D.saved||[]).indexOf(x.id)>=0;
  var rentB=E27.rentBEff(D);
  var out=x.rent>rentB;
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">اجارهٔ ماهانه</span>'+
  '<div class="pcard-badges"><span class="match" style="position:static">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(x.rent)+'<small>ریال در ماه</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">ودیعه (رهن): <b style="color:var(--ink)">'+rial(x.dep)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+' ('+fa(x.n,0)+' نظر)</span>':'')+'</div>':'')+
  '<div class="pcard-src"><span class="badge '+(out?'b-warn':'b-ok')+'">'+(out?'بالاتر از سقف اجارهٔ شما':'متناسب با سقف شما')+'</span>'+
  '<span class="badge b-info" data-tip="وضعیت مالکیت فقط با استعلام رسمی قابل تأیید است.">مالکیت: استعلام لازم</span></div>'+
  '<div class="pcard-extra">'+placeTags(x.hood,3)+(fb?diffBadges(rentDiffTags(x,D)):'')+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs" data-act="rdet" data-id="'+x.id+'">جزئیات (۱۰ توکن)</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore" aria-label="اطلاعات بیشتر">بیشتر</button>'+
  '<button class="btn btn-xs" data-act="lsave" data-id="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="rset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div>';
}`);
rep(`function blcard(x,D,sel,sc,fb){
  var saved=(D.savedB||[]).indexOf(x.id)>=0;
  var tot=x.m2*x.ppm;
  var _am=[x.elev,x.park,x.balc].filter(Boolean).length;
  return '<div class="lcard'+(sel?' sel':'')+'">'+
  '<div class="lart">'+ph(x.seed,400,250,'')+'<span class="match">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div>'+
  '<div class="lbody"><h4>'+x.t+'</h4><div class="adr"> '+findH(x.hood).n+'</div>'+
  '<div class="lprice" style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-size:14px;color:var(--brand-ink)">'+rial(tot)+'</b><span style="font-size:10.5px;color:var(--muted)">قیمت کل · هر متر '+rial(x.ppm)+'</span></div>'+
  '<div class="ltags"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span>'+(_am?'<span data-tip="امکانات: '+(x.elev?'آسانسور ':'')+(x.park?'پارکینگ ':'')+(x.balc?'بالکن':'')+'">+'+fa(_am,0)+' امکان</span>':'')+'</div>'+
  '<div class="ltags disttags">'+placeTags(x.hood,2)+'</div>'+
  (fb?diffBadges(buyDiffTags(x,D)):'<span class="badge '+(tot<=D.budg?'b-ok':'b-warn')+'">'+(tot<=D.budg?'در بودجهٔ شما':'بالاتر از سقف شما')+'</span>')+
  '<div class="lfoot"><span class="badge b-info" data-tip="وضعیت مالکیت هر آگهی فقط با استعلام رسمی قابل تأیید است؛ در «جزئیات» کامل‌تر بررسی می‌شود.">مالکیت: استعلام لازم</span>'+
  '<div style="display:flex;gap:5px;flex-wrap:wrap">'+
  '<button class="btn btn-xs" data-act="bdet" data-id="'+x.id+'">جزئیات (۱۰ توکن)</button>'+
  '<button class="btn btn-xs" data-act="bsave" data-id="'+x.id+'" aria-label="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="bset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div></div></div>';
}`,
`/* V0.27 — کارت عمودی آگهی خرید (Design System) */
function blcard(x,D,sel,sc,fb){
  var saved=(D.savedB||[]).indexOf(x.id)>=0;
  var tot=x.m2*x.ppm;
  var budgE=E27.budgEff(D);
  var amens=[x.elev?'آسانسور':null,x.park?'پارکینگ':null,x.balc?'بالکن':null].filter(Boolean);
  return '<div class="pcard'+(sel?' sel':'')+'">'+
  '<div class="pcard-art">'+ph(x.seed,480,360,'')+'<span class="pcard-type">فروش</span>'+
  '<div class="pcard-badges"><span class="match" style="position:static">'+(fb?'نزدیک‌ترین پیشنهاد':'تطبیق ٪'+fa(sc,0))+'</span>'+srcBadge(x)+'</div></div>'+
  '<div class="pcard-body">'+
  '<div class="pcard-price">'+rial(tot)+'<small>قیمت کل</small></div>'+
  '<div style="font-size:12px;color:var(--ink2)">هر متر: <b style="color:var(--ink)">'+rial(x.ppm)+'</b></div>'+
  '<div class="pcard-title">'+esc(x.t)+'</div>'+
  '<div class="pcard-adr">'+ico('map',12)+' '+esc(findH(x.hood).n)+'</div>'+
  '<div class="pcard-specs"><span>'+fa(x.m2,0)+' متر</span><span>'+fa(x.beds,0)+' خواب</span><span>طبقهٔ '+fa(x.floor,0)+'</span><span>'+fa(x.age,0)+' ساله</span></div>'+
  (amens.length||x.rate?'<div class="pcard-amen">'+amens.map(function(a){return '<span>'+a+'</span>'}).join('')+(x.rate?'<span>★ '+fa(x.rate,1)+'</span>':'')+'</div>':'')+
  '<div class="pcard-src"><span class="badge '+(tot<=budgE?'b-ok':'b-warn')+'">'+(tot<=budgE?'در بودجهٔ شما':'بالاتر از سقف شما')+'</span>'+
  '<span class="badge b-info" data-tip="وضعیت مالکیت فقط با استعلام رسمی قابل تأیید است.">مالکیت: استعلام لازم</span></div>'+
  '<div class="pcard-extra">'+placeTags(x.hood,3)+(fb?diffBadges(buyDiffTags(x,D)):'')+'</div>'+
  '</div>'+
  '<div class="pcard-foot">'+
  '<button class="btn btn-xs" data-act="bdet" data-id="'+x.id+'">جزئیات (۱۰ توکن)</button>'+
  '<button class="btn btn-xs" data-cba="pcardMore" aria-label="اطلاعات بیشتر">بیشتر</button>'+
  '<button class="btn btn-xs" data-act="bsave" data-id="'+x.id+'" aria-label="نشان‌کردن" title="نشان‌کردن">'+(saved?'★':'☆')+'</button>'+
  '<button class="btn btn-xs'+(sel?'':' btn-primary')+'" data-act="bset" data-id="'+x.id+'">'+(sel?'✓ انتخاب‌شده':'انتخاب')+'</button>'+
  '</div></div>';
}`);

/* buyDiffTags با بودجهٔ باز */
rep(`function buyDiffTags(x,D){
  var tot=x.m2*x.ppm,t=[];
  t.push([tot<=D.budg?'در بودجه':'بالاتر از بودجه',tot<=D.budg]);`,
`function buyDiffTags(x,D){
  var tot=x.m2*x.ppm,t=[];
  var _b27=E27.budgEff(D);
  t.push([tot<=_b27?'در بودجه':'بالاتر از بودجه',tot<=_b27]);`);

/* marketFit با بودجهٔ باز */
rep(`function marketFit(h,mode,D){
  D=D||{};D.B=D.B||{rentB:500000000,depB:15000000000};D.budg=D.budg||300000000000;
  if(mode==='rent'){
    var rOK=D.B.rentB>=h.avgRent,dOK=D.B.depB>=h.avgDep;
    return {ok:rOK&&dOK,txt:(rOK&&dOK)?'اجاره و ودیعهٔ نمونه در سقف شماست':(rOK?'ودیعهٔ نمونه بالاتر از سقف شماست':'اجارهٔ نمونه بالاتر از سقف شماست')};
  }
  var lo=Math.round(D.budg/h.mkt.high),hi=Math.round(D.budg/h.buyBase);
  return {ok:D.budg>=h.buyBase*40,txt:D.budg>=h.buyBase*40?('با بودجهٔ شما حدود '+fa(lo,0)+' تا '+fa(hi,0)+' متر'):'بودجه برای ۴۰ متر هم کافی نیست'};
}`,
`function marketFit(h,mode,D){
  D=D||{};D.B=D.B||{rentB:500000000,depB:15000000000};D.budg=D.budg||300000000000;
  var rE=E27.rentBEff(D),dE=(D.depOpen||!D.B.depB)?Infinity:D.B.depB,bE=E27.budgEff(D);
  if(mode==='rent'){
    var rOK=rE>=h.avgRent,dOK=dE>=h.avgDep;
    if(rE===Infinity&&dE===Infinity)return {ok:true,txt:'بدون محدودیت بودجه — همهٔ محله‌ها گزینه‌اند'};
    return {ok:rOK&&dOK,txt:(rOK&&dOK)?'اجاره و ودیعهٔ نمونه در سقف شماست':(rOK?'ودیعهٔ نمونه بالاتر از سقف شماست':'اجارهٔ نمونه بالاتر از سقف شماست')};
  }
  if(bE===Infinity)return {ok:true,txt:'بدون محدودیت بودجه — همهٔ محله‌ها گزینه‌اند'};
  var lo=Math.round(bE/h.mkt.high),hi=Math.round(bE/h.buyBase);
  return {ok:bE>=h.buyBase*40,txt:bE>=h.buyBase*40?('با بودجهٔ شما حدود '+fa(lo,0)+' تا '+fa(hi,0)+' متر'):'بودجه برای ۴۰ متر هم کافی نیست'};
}`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 14 — بازار هوشمند: مراحل mk اجاره/خرید + scMarket (P0: Market Visualization)
 * ══════════════════════════════════════════════════════════════════ */
rep(`{id:'mk',q:function(D){
  var h=findH(D.hood),m=h.mkt;
  return ' <b>بازار '+h.n+' — '+MARKET.asOf+':</b><br>• میانگین <b>آگهی فروش</b> هر متر: <b>'+rial(h.buyBase)+'</b> (نه قیمت معامله)<br>• تغییر یک‌ساله: '+pct(m.yoy)+' • یک‌ماهه: '+pct(m.mom)+'<br>• اجارهٔ نمونه: '+rial(h.avgRent)+' • ودیعه: '+rial(h.avgDep)+'<br>• بازهٔ نمایشی، برآورد است.'},
 chips:function(){return [['دیدن آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},`,
`{id:'mk',q:function(D){
  return E27.marketHTML({h:D.hood,mode:'rent',period:12});
 },
 chips:function(){return [['دیدن آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},`);
rep(`{id:'mk',q:function(D){
  var h=findH(D.hood),m=h.mkt,as=affordSpan(D.budg);
  return ' <b>بازار '+h.n+' — '+MARKET.asOf+':</b><br>• میانگین <b>آگهی فروش</b> هر متر: <b>'+rial(h.buyBase)+'</b> (نه قیمت معامله)<br>• بازهٔ تقریبی: '+rial(m.low)+' تا '+rial(m.high)+'<br>• تغییر یک‌ساله: '+pct(m.yoy)+' • یک‌ماهه: '+pct(m.mom)+'<br>• با بودجهٔ شما حدود '+fa(as[1],0)+' تا '+fa(as[0],0)+' متر'},
 chips:function(){return [['آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},`,
`{id:'mk',q:function(D){
  return E27.marketHTML({h:D.hood,mode:'buy',period:12,budg:D.budg,budgOpen:!!D.budgOpen});
 },
 chips:function(){return [['آگهی‌ها','ok'],['محلهٔ دیگر','!back']]},
 set:function(){return null},
 acts:{back:function(){ceJump('hoods')}}},`);

/* scMarket — دو شاخهٔ اجاره/خرید با کامپوننت تصویری */
rep(`    if(rentMode){
      var bars=HOODS.map(function(x){return {l:x.n,v:x.avgRent,fmt:rShort(x.avgRent)+' ریال',cur:x.id===h.id}}).sort(function(a,b){return b.v-a.v});
      botC('بازار اجارهٔ «'+esc(h.n)+'» — نمونهٔ مقایسه‌ای سامانه:'+
      rcards([
        rcard('اجارهٔ نمونهٔ ماهانه',rial(h.avgRent)),
        rcard('ودیعهٔ نمونه',rial(h.avgDep))
      ])+
      rcBars('اجارهٔ نمونه در محله‌ها (میلیون ریال)',bars,rcNote('نمونهٔ مقایسه‌ای سامانه — آمار رسمی بازار اجاره نیست.'))+
      rcActs([
        {l:'شروع فلوی اجاره',a:'data-cf="rent"',p:1},
        {l:'بازار خرید این محله',a:'data-cq="بازار خرید '+h.n+'"'},
        {l:'توزیع آگهی‌ها',a:'data-cq="توزیع آگهی‌های '+h.n+'"'}
      ]),null);
    }else{
      var series=trendSeries(h.buyBase,m.yoy,h.id);
      var bars=HOODS.map(function(x){return {l:x.n,v:x.buyBase,fmt:rShort(x.buyBase)+' ریال',cur:x.id===h.id}}).sort(function(a,b){return b.v-a.v});
      botC('بازار «'+esc(h.n)+'» — قیمت پیشنهادی آگهی‌ها، نه معاملهٔ قطعی:'+
      rcards([
        rcard('میانگین هر متر (آگهی)',rial(h.buyBase)),
        rcard('بازهٔ تقریبی آگهی‌ها',rShort(m.low)+' تا '+rShort(m.high)),
        rcard('تغییر یک‌ساله',pct(m.yoy),null,m.yoy>=0?'up':'down'),
        rcard('تغییر ماهانه',pct(m.mom),null,m.mom>=0?'up':'down')
      ])+
      rcLine('روند برآوردی هر متر — ۱۲ ماه','ریال · بر پایهٔ تغییر یک‌سالهٔ '+esc(MARKET.asOf),series,monthLabels(),
        'روند از تغییر یک‌سالهٔ اعلامی برآورد شده (دادهٔ نمونه)؛ ارقام، پیشنهادی آگهی‌اند نه معامله. منبع: کیلید.')+
      rcBars('مقایسهٔ هر متر در محله‌ها',bars,null)+
      rcActs([
        {l:'مقایسه با محلهٔ دیگر',a:'data-cq="مقایسه '+h.n+' و پونک"',p:1},
        {l:'شروع فلوی خرید',a:'data-cf="buy"'},
        {l:'امتیاز محله‌ها برای من',a:'data-cq="امتیاز محله‌ها"'}
      ]),null);
    }`,
`    if(rentMode){
      botC('بازار اجارهٔ «'+esc(h.n)+'» — نمایش تصویری:'+
      E27.marketHTML({h:h.id,mode:'rent',period:12})+
      rcActs([
        {l:'شروع فلوی اجاره',a:'data-cf="rent"',p:1},
        {l:'بازار خرید این محله',a:'data-cq="بازار خرید '+h.n+'"'},
        {l:'توزیع آگهی‌ها',a:'data-cq="توزیع آگهی‌های '+h.n+'"'}
      ]),null);
    }else{
      botC('بازار «'+esc(h.n)+'» — قیمت پیشنهادی آگهی‌ها، نه معاملهٔ قطعی:'+
      E27.marketHTML({h:h.id,mode:'buy',period:12})+
      rcActs([
        {l:'مقایسه با محلهٔ دیگر',a:'data-cq="مقایسه '+h.n+' و پونک"',p:1},
        {l:'شروع فلوی خرید',a:'data-cf="buy"'},
        {l:'امتیاز محله‌ها برای من',a:'data-cq="امتیاز محله‌ها"'}
      ]),null);
    }`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 15 — تخلیهٔ هوشمند (P0: Before/After واقعی + Stepper + بزرگ‌نمایی)
 * ══════════════════════════════════════════════════════════════════ */
rep(`function baHTML(){
  return '<div class="ba">'+
  '<div class="layer">'+ph('roomin',600,375,'')+'<div class="cap">روز ورود</div></div>'+
  '<div class="layer after" id="ba-after">'+ph('roomout',600,375,'')+
  '<div class="cap">روز تخلیه — ۱۸ ماه بعد</div>'+
  '<div class="mk" style="top:30%;left:28%" data-tip="نم دیوار: خارج از استهلاک (بار موجر)">!</div>'+
  '<div class="mk" style="top:64%;left:60%" data-tip="خط‌وخش: استهلاک عادی">?</div></div>'+
  '<div class="handle" id="ba-h"></div><input type="range" id="ba-r" min="10" max="90" value="45"></div>';
}`,
`/* V0.27 — مقایسهٔ قبل/بعد تخلیه با تصویر واقعی دمو، لغزنده، بزرگ‌نمایی و بارگذاری عکس کاربر */
function baHTML(){
  var st=(CE.f==='rent')?((wd('rent').data.term||{}).ba||{}):{};
  var stage=st.stage||1;
  return '<div class="ba27">'+
  '<div class="ba27-steps">'+
  '<div class="ba27-step '+(stage===1?'on':'done')+'">۱) روز ورود</div>'+
  '<div class="ba27-step '+(stage===2?'on':'')+'">۲) روز تخلیه</div>'+
  '<div class="ba27-step">۳) تحلیل و تسویه</div>'+
  '</div>'+
  '<div class="ba27-wrap">'+
  '<img id="ba27-img-before" src="'+E27.baImg('before')+'" alt="روز ورود — پیش از تخلیه، با اثاثیه">'+
  '<div class="ba27-after"><img src="'+E27.baImg('after')+'" alt="روز تخلیه — پس از خارج‌شدن اثاثیه"></div>'+
  '<div class="ba27-handle" style="left:50%"></div>'+
  '</div>'+
  '<input type="range" class="ba27-range" min="5" max="95" value="50" aria-label="لغزندهٔ مقایسهٔ قبل و بعد">'+
  '<div class="ba27-labs"><span>روز ورود — مبلمان موجود</span><span>روز تخلیه — خالی</span></div>'+
  '<div class="ba27-acts">'+
  '<button class="btn btn-xs" data-cba="baZoom" data-src="'+E27.baImg('before')+'">بزرگ‌نمایی روز ورود</button>'+
  '<button class="btn btn-xs" data-cba="baZoom" data-src="'+E27.baImg('after')+'">بزرگ‌نمایی روز تخلیه</button>'+
  '<label class="btn btn-xs" style="cursor:pointer;margin:0">تصویر '+(stage===1?'روز ورود':'روز تخلیه')+' خودم<input type="file" hidden accept="image/*" data-ba27="'+(stage===1?'before':'after')+'"></label>'+
  '</div>'+
  '<div class="ba27-demo">نمونهٔ نمایشی: این دو تصویر، نمونهٔ دموی «شبیه‌سازی‌شده»اند، نه عکس واقعی ملک شما. با گزینهٔ «تصویر خودم» عکس واقعی ملک را جایگزین کنید تا مقایسه روی ملک شما انجام شود.</div>'+
  '</div>';
}`);

/* مرحلهٔ tai — دو مرحله‌ای با Stepper */
rep(`{id:'tai',q:' تخلیهٔ هوشمند: مقایسهٔ عکس روز ورود/تخلیه با هوش مصنوعی؟',
 chips:function(){return [['بررسی کن','!ai']]},
 acts:{ai:function(D){
   var T=D.term;
   T.wait=true;save();
   botC(' در حال تحلیل تصاویر… <span class="dots"><i></i><i></i><i></i></span>');
   setTimeout(function(){
     T.wait=false;T.ai=true;T.ph=4;save();
     if(CURRENT==='rent')renderCurrent();
     botC(' نتیجه: ۱ مورد خارج از استهلاک (نم دیوار — بار موجر) + ۱ مورد استهلاک عادی. <b>کسر: صفر.</b>',[['تسویه ودیعه','!pay']]);
   },1400);
 }}},`,
`{id:'tai',q:function(D){
   var T=D.term;
   if(!T.ba)T.ba={stage:1};
   return ' <b>تخلیهٔ هوشمند</b> — گام '+fa(T.ba.stage,0)+' از ۲: '+(T.ba.stage===1?'وضعیت <b>روز ورود</b> (پیش از تخلیه) را بررسی و تأیید کنید، یا عکس واقعی ملک خودتان را جایگزین کنید.':'وضعیت <b>روز تخلیه</b> (پس از خروج اثاثیه) را بررسی و تأیید کنید.')+
   baHTML();
  },
 chips:function(D){var T=D.term;return T.ba.stage===1?[['تأیید وضعیت روز ورود','!ba1'],['رد کردن تحلیل تصویر','!skip']]:[['تأیید و تحلیل','!ai'],['بازگشت به گام ۱','!ba0']]},
 acts:{
  ba1:function(D){var T=D.term;T.ba.stage=2;save();ceStep()},
  ba0:function(D){var T=D.term;T.ba.stage=1;save();ceStep()},
  skip:function(D){
    var T=D.term;T.ai=true;T.ph=4;T.ba={stage:3,skipped:true};save();
    if(CURRENT==='rent')renderCurrent();
    botC('تحلیل تصویر رد شد؛ مستقیم به تسویهٔ ودیعه می‌رویم.',[['تسویه ودیعه','!pay']]);
  },
  ai:function(D){
   var T=D.term;
   T.wait=true;save();
   T.ba.stage=3;save();
   botC(' در حال تحلیل تصاویر… <span class="dots"><i></i><i></i><i></i></span>');
   setTimeout(function(){
     T.wait=false;T.ai=true;T.ph=4;save();
     if(CURRENT==='rent')renderCurrent();
     botC(' نتیجهٔ تحلیل (نمایشی): ۱ مورد خارج از استهلاک (نم دیوار — بار موجر) + ۱ مورد استهلاک عادی. <b>کسر: صفر.</b><br><small>این نتیجه در نسخهٔ نمایشی الگوریتمی ثابت دارد و تحلیل هوش مصنوعی واقعی نیست.</small>',[['تسویه ودیعه','!pay']]);
   },1400);
 }}},`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 16 — توافق پرداخت: رفع بن‌بست «یکجا هنگام سند» (P0)
 * ══════════════════════════════════════════════════════════════════ */
rep(`{id:'escC',q:function(D){
  if(!D.pay.ok)return 'ابتدا توافق پرداخت را نهایی کنید.';`,
`{id:'esc1',pre:function(D){return !D.pay.staged},
 q:function(D){
   var tot=D.price||D.budg||0;
   return ' <b>خلاصهٔ توافق پرداخت یکجا (ConfirmationPanel)</b>'+
   '<div class="pay27-sim"><div class="pay27-row"><span>نوع پرداخت</span><b>یکجا هنگام انتقال سند</b></div>'+
   '<div class="pay27-row"><span>درصد در زمان سند</span><b>٪۱۰۰</b></div>'+
   '<div class="pay27-row"><span>مبلغ این مرحله</span><b>'+(tot?rial(tot):'بر پایهٔ قیمت نهایی معامله')+'</b></div>'+
   '<div class="pay27-row"><span>مسیر آزادسازی</span><b>حساب امانی محلینو</b></div></div>'+
   'این توافق را تأیید می‌کنید؟ (پس از تأیید، آزادسازی امانی در مرحلهٔ بعد انجام می‌شود)'},
 chips:function(){return [['تأیید توافق یکجا','!ok1'],['بازگشت و تغییر روش','!back1']]},
 acts:{
  ok1:function(D){D.pay.ok=true;save();botC('✓ توافق پرداخت یکجا ثبت شد — ۱۰۰٪ هنگام انتقال سند از حساب امانی.',null);ceJump('escC')},
  back1:function(){ceJump('escA')}
 }},
{id:'escC',q:function(D){
  if(!D.pay.ok)return 'ابتدا توافق پرداخت را نهایی کنید.';`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 17 — حذف محدودیت بودجه (P0)
 * ══════════════════════════════════════════════════════════════════ */
rep(` set:function(D,v){
   if(!D.B){D.B={inc:1500000000,depB:15000000000,rentB:500000000,chg:50000000,incr:100000000}}
   D._depSet=1;
   var n=+pd(v);
   if(!n||n<1000000000||n>60000000000)return 'ERR';
   D.B.depB=n;return null},
 err:'ودیعه باید بین ۱ تا ۶۰ میلیارد ریال باشد. مثلاً «۱۵ میلیارد» یا «۱٫۵ میلیارد تومان».'},`,
` set:function(D,v){
   if(!D.B){D.B={inc:1500000000,depB:15000000000,rentB:500000000,chg:50000000,incr:100000000}}
   D._depSet=1;
   var p=E27.budgParse(v);
   if(!p.ok)return 'ERR';
   if(p.mode==='open'){D.depOpen=true;D.B.depB=D.B.depB||15000000000;return null}
   if(p.n<=0)return 'ERR';
   D.depOpen=false;D.B.depB=p.n;return null},
 err:'ودیعه را به ریال بنویسید (مثلاً «۱۵ میلیارد» یا «۱٫۵ میلیارد تومان») — بدون سقف؛ یا «بدون سقف» بفرستید.'},`);
rep(` chips:function(){return [['۵۰۰ میلیون تومان','5000000000'],['۱ میلیارد تومان','10000000000'],['۱٫۵ میلیارد تومان','15000000000'],['۳ میلیارد تومان','30000000000']]},`,
` chips:function(){return [['۵۰۰ میلیون تومان','5000000000'],['۱ میلیارد تومان','10000000000'],['۳ میلیارد تومان','30000000000'],['بدون سقف','بدون سقف']]},`);
rep(` set:function(D,v){
   var n=+pd(v);
   if(!n||n<10000000||n>1500000000)return 'ERR';
   D._rentbSet=1;D.B.rentB=n;return null},
 err:'اجارهٔ ماهانه باید بین ۱ تا ۱۵۰ میلیون تومان باشد؛ مثلاً «۸۰ میلیون تومان».'},`,
` set:function(D,v){
   var p=E27.budgParse(v);
   if(!p.ok)return 'ERR';
   if(p.mode==='open'){D.rentBOpen=true;D._rentbSet=1;return null}
   if(p.n<=0)return 'ERR';
   D.rentBOpen=false;D._rentbSet=1;D.B.rentB=p.n;return null},
 err:'اجارهٔ ماهانه را به ریال بنویسید (مثلاً «۸۰ میلیون تومان») — بدون سقف؛ یا «بدون سقف» بفرستید.'},`);
rep(` chips:function(){return [['۳۰ میلیون تومان','300000000'],['۵۰ میلیون تومان','500000000'],['۸۰ میلیون تومان','800000000'],['۱۲۰ میلیون تومان','1200000000']]},`,
` chips:function(){return [['۳۰ میلیون تومان','300000000'],['۵۰ میلیون تومان','500000000'],['۸۰ میلیون تومان','800000000'],['بدون سقف','بدون سقف']]},`);
rep(` set:function(D,v){
   var n=+pd(v);
   if(!n||n<50000000000)return 'ERR';
   D._budgSet=1;D.budg=n;return null}},`,
` set:function(D,v){
   var p=E27.budgParse(v);
   if(!p.ok)return 'ERR';
   D._budgSet=1;
   if(p.mode==='open'){D.budgOpen=true;D.budgMin=null;return null}
   if(p.mode==='min'){D.budgOpen=true;D.budgMin=p.n;botC('✓ بودجهٔ «حداقل '+rial(p.n)+'» ثبت شد — بدون سقف.');return null}
   if(p.mode==='max'){D.budgOpen=false;D.budg=p.n;botC('✓ سقف بودجه '+rial(p.n)+' ثبت شد — بدون کف.');return null}
   if(p.n<=0)return 'ERR';
   D.budgOpen=false;D.budg=p.n;return null},
 err:'بودجه را به ریال بنویسید (مثلاً «۳۰ میلیارد» یا «۵ میلیارد به بالا» یا «بدون بودجهٔ مشخص»).'},`);
rep(` chips:function(){return [['۱۵ میلیارد تومان','150000000000'],['۳۰ میلیارد تومان','300000000000'],['۵۰ میلیارد تومان','500000000000'],['۷۰ میلیارد تومان','700000000000']]},`,
` chips:function(){return [['۱۵ میلیارد تومان','150000000000'],['۳۰ میلیارد تومان','300000000000'],['۵۰ میلیارد تومان','500000000000'],['بدون بودجهٔ مشخص','بدون بودجهٔ مشخص'],['۵ میلیارد به بالا','۵ میلیارد به بالا']]},`);

/* خط لولهٔ money در ceVal: عبور عبارت‌های «بدون سقف» به set */
rep(`  if(st.money){
    var pm=parseMoneyFA(v0);
    if(!pm.ok){botC(pm.msg);return}
    v=String(pm.value);note=pm.note;
  }else if(st.count){`,
`  if(st.money){
    var pm=parseMoneyFA(v0);
    if(!pm.ok){
      var p27=null;
      try{p27=E27.budgParse(v0)}catch(e27x){}
      if(p27&&p27.ok){v=v0;note=null}
      else{botC(pm.msg);return}
    }else{v=String(pm.value);note=pm.note}
  }else if(st.count){`);

/* اسلایدرها فقط کمکی — بازهٔ بالا عملاً نامحدود */
rep(`E21.SLIDE={
  'rent.dep':{min:1000000000,max:60000000000},
  'rent.rentb':{min:10000000,max:1500000000},
  'buy.budg':{min:50000000000,max:1000000000000},`,
`E21.SLIDE={
  'rent.dep':{min:1000000000,max:1000000000000000},
  'rent.rentb':{min:10000000,max:1000000000000000},
  'buy.budg':{min:50000000000,max:1000000000000000},`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 18 — کیف پول: تب حساب، دکمهٔ شارژ
 * ══════════════════════════════════════════════════════════════════ */
rep(`  return '<div class="acc-hero"><div class="card"><div class="ct">کیف پول</div><div class="acc-balance">'+rial(S.wallet||0)+'<small>موجودی قابل برداشت</small></div>'+
  '<div class="acc-actions"><button class="btn btn-sm btn-primary" data-act="wdraw">برداشت وجه</button><button class="btn btn-sm" data-act="account" data-tab="plan">خرید توکن</button></div>'+
  '<p class="note" style="margin-top:10px">فروش سهم متری و درآمد اجاره به کیف پول واریز می‌شود. برداشت به شبا ثبت می‌شود.</p></div>'+`,
`  return '<div class="acc-hero"><div class="card"><div class="ct">کیف پول ریالی</div><div class="acc-balance">'+rial(S.wallet||0)+'<small>موجودی قابل برداشت</small></div>'+
  '<div class="acc-actions"><button class="btn btn-sm btn-primary" data-act="wchat">شارژ کیف پول</button><button class="btn btn-sm" data-act="wdraw">برداشت وجه</button><button class="btn btn-sm" data-act="account" data-tab="plan">خرید توکن</button></div>'+
  '<p class="note" style="margin-top:10px">شارژ از «درگاه نمایشی» انجام می‌شود (پرداخت واقعی متصل نیست). کیف پول ریالی و توکن‌ها کاملاً مستقل‌اند؛ درآمد اجاره و فروش هم به همین کیف واریز می‌شود.</p></div>'+`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 19 — ریست واقعی داده‌ها (P0)
 * ══════════════════════════════════════════════════════════════════ */
rep(`ACT.reset=function(){try{localStorage.removeItem(LSKEY)}catch(e){}location.reload()};`,
`/* V0.27 — بازنشانی واقعی با تأیید و گزارش صادقانه */
ACT.reset=function(){
  openModal('<h3>بازنشانی کامل داده‌ها</h3>'+
  '<p class="note">همهٔ داده‌های محلینو در این مرورگر حذف می‌شود:</p>'+
  '<ul style="font-size:12.5px;line-height:2;color:var(--ink2);margin:6px 0 10px;padding-inline-start:18px">'+
  '<li>گفت‌وگوها و تاریخچهٔ چت</li><li>درخواست‌ها، فلوها و قراردادها</li><li>آگهی‌های نشان‌شده و یادآورها</li>'+
  '<li>موجودی شبیه‌سازی‌شدهٔ کیف پول و توکن‌ها</li><li>تنظیمات، حساب کاربری و حالت نمایش</li></ul>'+
  '<p class="note">داده‌های سایت‌های دیگر دست‌نخورده می‌ماند. این کار بازگردانی ندارد.</p>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-danger" data-act="resetOk">حذف کامل و شروع از نو</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
ACT.resetOk=function(){
  var errs=[];
  function tryIt(fn,label){try{fn()}catch(e){errs.push(label+': '+(e&&e.message?e.message:e))}}
  tryIt(function(){
    var kill=[],i,k;
    for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&(k.indexOf('mahalino')===0||k.indexOf('khanyar')===0))kill.push(k)}
    kill.forEach(function(k2){localStorage.removeItem(k2)});
  },'localStorage');
  tryIt(function(){
    var kill=[],i,k;
    for(i=0;i<sessionStorage.length;i++){k=sessionStorage.key(i);if(k&&(k.indexOf('mahalino')===0||k.indexOf('khanyar')===0))kill.push(k)}
    kill.forEach(function(k2){sessionStorage.removeItem(k2)});
  },'sessionStorage');
  tryIt(function(){
    if(window.indexedDB&&indexedDB.deleteDatabase){indexedDB.deleteDatabase('mahalino');indexedDB.deleteDatabase('mahalino-plus');indexedDB.deleteDatabase('khanyar')}
  },'indexedDB');
  tryIt(function(){
    HIST=[];CE.f=null;CE.i=0;CE.li=0;CE.hist=[];E22.restoredId=null;E27.sq='';
    try{ctxReset()}catch(e2){}
  },'memory');
  closeModal();
  if(errs.length){toast('بازنشانی ناقص شد: '+errs[0]);return}
  toast('همهٔ داده‌ها پاک شد — شروع از نو…');
  setTimeout(function(){location.reload()},700);
};`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 20 — موتور E27: بازار هوشمند، بودجهٔ آزاد، کیف پول، دستگیرنده‌ها
 * ══════════════════════════════════════════════════════════════════ */
rep(`/* ═══ ۲۲) راه‌اندازی ═══ */`,
`/* ═══ ۲۱.۱۲) موتور V0.27 (E27) — بازار هوشمند، بودجهٔ آزاد، کیف پول، جزئیات کارت ═══ */

/* ── بودجهٔ آزاد: تحلیل زبان طبیعی + مقادیر مؤثر ── */
E27.budgParse=function(v){
  var t=normFa(String(v||'')).trim();
  if(!t)return {ok:false,msg:'مبلغ را وارد کنید.'};
  if(/بدون بودجه|بدون سقف|نامحدود|بدون محدودیت|فرقی نمی|مهم نیست|هرچی|هر چی/.test(t))return {ok:true,mode:'open'};
  var isMin=/به بالا|و بالاتر|یا بیشتر/.test(t)&&!/کمتر/.test(t);
  var isMax=/حداکثر|تا سقف|سقف|کمتر از/.test(t)&&!/به بالا/.test(t);
  var t2=t.replace(/به بالا|و بالاتر|یا بیشتر|حداکثر|تا سقف|کمتر از|سقف/g,' ');
  var pm=parseMoneyFA(t2);
  if(!pm.ok)return {ok:false,msg:'بودجه را مثل «۳۰ میلیارد»، «۵ میلیارد به بالا» یا «بدون بودجهٔ مشخص» بنویسید.'};
  if(isMin)return {ok:true,mode:'min',n:pm.value,note:pm.note};
  if(isMax)return {ok:true,mode:'max',n:pm.value,note:pm.note};
  return {ok:true,mode:'exact',n:pm.value,note:pm.note};
};
E27.budgEff=function(D){
  if(!D)return 0;
  if(D.budgOpen)return Infinity;
  return +D.budg||0;
};
E27.rentBEff=function(D){
  if(!D||!D.B)return 0;
  if(D.rentBOpen)return Infinity;
  return +D.B.rentB||0;
};

/* ── کامپوننت هوش بازار (Market Intelligence) ── */
E27.marketHTML=function(o){
  o=o||{};
  var h=findH(o.h||'h1'),mode=o.mode||'buy',period=+o.period||12;
  var m=h.mkt,isBuy=mode==='buy';
  var base=isBuy?h.buyBase:h.avgRent;
  var series=trendSeries(base,m.yoy,h.id+mode).slice(-period);
  var labels=monthLabels().slice(-period);
  var yoy=m.yoy,mom=m.mom;
  function chip(k,v,lab,cur){return '<button class="mkti-chip'+(cur?' on':'')+'" data-cba="mktCtl" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+(cur?'true':'false')+'">'+lab+'</button>'}
  function kpi(lab,val,delta){
    var d='';
    if(delta!==undefined&&delta!==null)d='<span class="delta '+(delta>=0?'up':'down')+'">'+pct(delta)+' تغییر</span>';
    return '<div class="mkti-kpi"><small>'+lab+'</small><b>'+val+'</b>'+d+'</div>';
  }
  var kpis;
  if(isBuy){
    kpis=kpi('میانگین آگهی هر متر',rial(h.buyBase),null)+kpi('تغییر یک‌ساله','',yoy)+kpi('تغییر ماهانه','',mom)+
      '<div class="mkti-kpi"><small>بازهٔ آگهی‌ها</small><b>'+rShort(m.low)+' – '+rShort(m.high)+'</b><span class="delta" style="color:var(--ink2)">ریال بر متر</span></div>';
  }else{
    kpis=kpi('اجارهٔ نمونهٔ ماهانه',rial(h.avgRent),null)+kpi('ودیعهٔ نمونه',rial(h.avgDep),null)+kpi('تغییر یک‌ساله بازار','',yoy)+kpi('تغییر ماهانه بازار','',mom);
  }
  var rangeBox='';
  if(isBuy){
    var lo=m.low,hi=m.high,span=(hi-lo)||1,pos=Math.max(0,Math.min(100,Math.round((h.buyBase-lo)/span*100)));
    rangeBox='<div class="mkti-box mkti-range"><h5>جایگاه میانگین آگهی در بازهٔ محله</h5>'+
    '<div class="mkti-rangebar"><i class="pin" style="right:'+pos+'%"></i></div>'+
    '<div class="mkti-rl"><span title="'+rial(lo)+'">'+rShort(lo)+'</span><span title="'+rial(hi)+'">'+rShort(hi)+' (ریال/متر)</span></div></div>';
  }else{
    var mx=Math.max(h.avgRent,h.avgDep)||1;
    rangeBox='<div class="mkti-box"><h5>اجاره در برابر ودیعه (نسبت نمایشی)</h5>'+
    '<div class="mkti-cmp">'+
    '<div class="mkti-cmp-row"><span>ودیعه</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(h.avgDep/mx*100))+'%"></span><b>'+rShort(h.avgDep)+'</b></div>'+
    '<div class="mkti-cmp-row"><span>اجارهٔ ماهانه</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(h.avgRent/mx*100))+'%"></span><b>'+rShort(h.avgRent)+'</b></div>'+
    '</div></div>';
  }
  var bars=HOODS.map(function(x){
    var v=isBuy?x.buyBase:x.avgRent;
    return {l:x.n,v:v,fmt:rShort(v),cur:x.id===h.id};
  }).sort(function(a,b){return b.v-a.v});
  var cmp='<div class="mkti-box"><h5>'+(isBuy?'هر متر (آگهی) در محله‌ها':'اجارهٔ نمونه در محله‌ها')+' — ریال</h5><div class="mkti-cmp">'+
  bars.map(function(b){
    return '<div class="mkti-cmp-row'+(b.cur?' cur':'')+'"><span>'+esc(b.l)+'</span><span class="mkti-cmp-bar" style="width:'+Math.max(3,Math.round(b.v/bars[0].v*100))+'%"></span><b title="'+rial(b.v)+'">'+b.fmt+'</b></div>';
  }).join('')+'</div></div>';
  var aff='';
  if(isBuy&&o.budgOpen)aff='<div class="mkti-kpi" style="grid-column:1/-1"><small>بودجهٔ شما</small><b>بدون محدودیت — همهٔ بازه‌ها گزینه‌اند</b></div>';
  else if(isBuy&&o.budg){
    var as=affordSpan(+o.budg||0);
    aff='<div class="mkti-kpi" style="grid-column:1/-1"><small>با بودجهٔ شما</small><b>حدود '+fa(as[1],0)+' تا '+fa(as[0],0)+' متر</b></div>';
  }
  var chart='';
  if(isBuy){
    chart='<div>'+rcLine('روند برآوردی هر متر — '+fa(period,0)+' ماه','ریال · برآورد از تغییر یک‌سالهٔ اعلامی (دادهٔ نمونه)',series,labels,null)+'</div>';
  }else{
    chart='<div>'+rcLine('روند برآوردی اجاره — '+fa(period,0)+' ماه','ریال · برآورد از تغییر یک‌سالهٔ اعلامی (دادهٔ نمونه)',series,labels,null)+'</div>';
  }
  return '<div class="mkti" data-h="'+h.id+'" data-mode="'+mode+'" data-period="'+period+'">'+
  '<div class="mkti-h"><b>'+ico('map',14)+' بازار '+esc(h.n)+' <small style="color:var(--ink2);font-weight:400">· '+esc(MARKET.asOf)+'</small></b>'+
  '<div class="mkti-chips">'+
  chip('mode','buy','خرید',isBuy)+chip('mode','rent','اجاره',!isBuy)+
  '<span style="width:1px;background:var(--line);margin:0 3px"></span>'+
  chip('period','3','۳ ماه',period===3)+chip('period','6','۶ ماه',period===6)+chip('period','12','۱۲ ماه',period===12)+
  '</div></div>'+
  '<div class="mkti-chips" style="margin-bottom:4px">'+HOODS.map(function(x){return chip('h',x.id,x.n,x.id===h.id)}).join('')+'</div>'+
  '<div class="mkti-kpis">'+kpis+aff+'</div>'+
  '<div class="mkti-grid">'+chart+'<div>'+rangeBox+'</div></div>'+
  '<div style="margin-top:12px">'+cmp+'</div>'+
  '<button class="mkti-more-btn" data-cba="mktMore">توضیح بیشتر و اعداد دقیق ▾</button>'+
  '<div class="mkti-more">'+
  '<b>اعداد دقیق (ریال):</b><br>'+
  'میانگین هر متر (آگهی): '+rial(h.buyBase)+' · بازه: '+rial(m.low)+' تا '+rial(m.high)+'<br>'+
  'اجارهٔ نمونه: '+rial(h.avgRent)+' · ودیعهٔ نمونه: '+rial(h.avgDep)+'<br>'+
  '<b>روش و منبع:</b> قیمت‌ها «آگهی»اند، نه معاملهٔ قطعی. منبع اعلامی: '+esc(m.src||'کیلید')+' · تاریخ داده: '+esc(MARKET.asOf)+' · محدوده: محلهٔ '+esc(h.n)+'.<br>'+
  '<b>صادقانه:</b> سری زمانی و ارقام این نسخه، دادهٔ نمونهٔ شبیه‌سازی‌شدهٔ سامانه است (هوش مصنوعی زنده به دادهٔ واقعی متصل نیست).'+
  '</div>'+
  '</div>';
};
CBACT.mktCtl=function(el){
  var box=el.closest('.mkti');if(!box)return;
  var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');
  if(k)box.setAttribute('data-'+k,v);
  box.outerHTML=E27.marketHTML({h:box.getAttribute('data-h'),mode:box.getAttribute('data-mode'),period:+box.getAttribute('data-period')||12});
};
CBACT.mktMore=function(el){
  var box=el.closest('.mkti');if(box)box.classList.toggle('openm');
};
CBACT.pcardMore=function(el){
  var c=el.closest('.pcard');if(c)c.classList.toggle('open');
};

/* ── تخلیهٔ هوشمند: لغزنده، بزرگ‌نمایی، تصویر کاربر ── */
E27.userImg={before:null,after:null};
E27.baImg=function(slot){
  return esc(E27.userImg[slot]||(slot==='before'?'assets/img/emptying-before.jpg':'assets/img/emptying-after.jpg'));
};
CBACT.baZoom=function(el){
  var src=el.getAttribute('data-src');if(!src)return;
  var ov=document.createElement('div');ov.className='ba27-zoom';
  var im=document.createElement('img');im.src=src;im.alt='نمای بزرگ‌شدهٔ تصویر ملک';
  ov.appendChild(im);document.body.appendChild(ov);
  ov.addEventListener('click',function(){ov.remove()});
};
try{
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.classList&&t.classList.contains('ba27-range')){
      var root=t.closest('.ba27');if(!root)return;
      var w=root.querySelector('.ba27-wrap');if(!w)return;
      var v=+t.value,after=w.querySelector('.ba27-after'),hd=w.querySelector('.ba27-handle');
      if(after)after.style.clipPath='inset(0 0 0 '+v+'%)';
      if(hd)hd.style.left=v+'%';
    }
  });
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.getAttribute&&t.getAttribute('data-ba27')){
      var f=t.files&&t.files[0];if(!f)return;
      if(String(f.type||'').indexOf('image/')!==0){toast('فقط فایل تصویری بگذارید.');return}
      var slot=t.getAttribute('data-ba27');
      var url=URL.createObjectURL(f);
      E27.userImg[slot]=url;
      if(slot==='before'){var img=document.getElementById('ba27-img-before');if(img)img.src=url}
      if(CE.f==='rent'){var T=wd('rent').data.term;if(T){T.ba=T.ba||{};T.ba[slot]='user';save()}}
      toast(slot==='before'?'تصویر «روز ورود» شما جایگزین شد':'تصویر «روز تخلیه» شما جایگزین شد');
      if(CE.f==='rent'&&SCRIPTS.rent[CE.i]&&SCRIPTS.rent[CE.i].id==='tai')ceStep();
    }
  });
}catch(e){}

/* ── کیف پول: شارژ در گفت‌وگو با درگاه نمایشی + استقلال از توکن ── */
E27.wf=null;
E27.doneTx={};
E27._lastAmt=0;
E27.wtxRow=function(w){
  var inn=w.a>0;
  return '<div class="wtx '+(inn?'in':'out')+'"><span class="wic">'+(inn?'↓':'↑')+'</span>'+
  '<span class="wtx-main"><b>'+esc(w.d||'—')+'</b><small>'+fd(w.t)+(w.tx?' · کد: '+esc(w.tx):'')+'</small></span>'+
  '<span class="wtx-amt '+(inn?'in':'out')+'">'+(inn?'+':'−')+rial(Math.abs(w.a))+'</span></div>';
};
CBACT.wMenu=function(){
  E27.wf=null;
  botC('<b>کیف پول و توکن‌ها</b> — دو موجودی مستقل:'+
  rcards([
    rcard('کیف پول ریالی','<span style="font-size:15px;font-weight:800">'+rial(S.wallet||0)+'</span>','برای خدمات سامانه'),
    rcard('توکن‌های مصرفی',fa(S.tokens,0)+' توکن','برای قابلیت‌های توکنی')
  ])+
  rcNote('کیف پول ریالی و توکن دو حساب جدا هستند؛ شارژ یکی روی دیگری اثر ندارد.')+
  '<div class="racts">'+
  '<button class="qbtn primary" data-cba="wTopup">شارژ کیف پول</button>'+
  '<button class="qbtn" data-cba="wTx">تاریخچهٔ تراکنش‌ها</button>'+
  '<button class="qbtn" data-cba="wTok">خرید توکن</button>'+
  '</div>',null);
};
CBACT.wTopup=function(){
  E27.wf={mode:'amount'};
  botC('<b>شارژ کیف پول ریالی</b> — مبلغ را بنویسید (مثلاً «۲ میلیون تومان» یا «۵۰۰ هزار تومان»):'+
  rcNote('پرداخت از «درگاه نمایشی» انجام می‌شود؛ در این نسخه درگاه بانکی واقعی متصل نیست و این موضوع صریحاً اعلام می‌شود.')+
  '<div class="racts"><button class="qbtn" data-cba="wCancel">انصراف</button></div>',null);
};
CBACT.wCancel=function(){E27.wf=null;botC('شارژ لغو شد. موجودی تغییری نکرد.',null)};
E27.wfHandle=function(t){
  if(!E27.wf)return false;
  if(E27.wf.mode==='amount'){
    var p=E27.budgParse(t);
    if(!p.ok){usrC(t);botC(p.msg+' (برای انصراف، دکمهٔ انصراف را بزنید)',null);return true}
    if(p.mode!=='exact'||!p.n||p.n<=0){usrC(t);botC('برای شارژ یک مبلغ مشخص بنویسید (مثلاً «۲ میلیون تومان»).',null);return true}
    usrC(t);
    var txid='TX-'+Date.now().toString(36).toUpperCase();
    E27.wf={mode:'confirm',amt:p.n,method:'sim-ok',txid:txid};
    E27._lastAmt=p.n;
    E27.wConfirm();
    return true;
  }
  return false;
};
E27.wConfirm=function(){
  var f=E27.wf;if(!f)return;
  botC('<b>خلاصهٔ تراکنش (ConfirmationPanel)</b>'+
  '<div class="pay27-sim">'+
  '<div class="pay27-row"><span>نوع</span><b>شارژ کیف پول ریالی</b></div>'+
  '<div class="pay27-row"><span>مبلغ</span><b>'+rial(f.amt)+'</b></div>'+
  '<div class="pay27-row"><span>درگاه</span><b>'+(f.method==='sim-ok'?'درگاه نمایشی — سناریوی موفق':'درگاه نمایشی — سناریوی ناموفق (تست)')+'</b></div>'+
  '<div class="pay27-row"><span>کد پیگیری</span><b dir="ltr">'+esc(f.txid)+'</b></div>'+
  '<div class="pay27-row"><span>موجودی فعلی</span><b>'+rial(S.wallet||0)+'</b></div>'+
  '<div class="pay27-row"><span>موجودی پس از پرداخت</span><b>'+(f.method==='sim-ok'?rial((S.wallet||0)+f.amt):rial(S.wallet||0))+'</b></div>'+
  '</div>'+
  rcNote('این یک «شبیه‌ساز پرداخت» است و پرداخت بانکی واقعی نیست.')+
  '<div class="racts">'+
  '<button class="qbtn primary" data-cba="wPay">تأیید و پرداخت</button>'+
  '<button class="qbtn" data-cba="wMethod">تغییر سناریوی درگاه (موفق/ناموفق)</button>'+
  '<button class="qbtn" data-cba="wCancel">انصراف</button>'+
  '</div>',null);
};
CBACT.wMethod=function(){
  var f=E27.wf;if(!f||f.mode!=='confirm'){toast('ابتدا مبلغ شارژ را مشخص کنید');return}
  f.method=(f.method==='sim-ok')?'sim-fail':'sim-ok';
  E27.wConfirm();
};
CBACT.wPay=function(){
  var f=E27.wf;
  if(!f||f.mode!=='confirm'){toast('ابتدا مبلغ شارژ را مشخص کنید');return}
  if(E27.doneTx[f.txid]){toast('این تراکنش قبلاً ثبت شده است — موجودی دوباره افزایش نمی‌یابد');return}
  E27.doneTx[f.txid]=true;
  E27.wf={mode:'busy',amt:f.amt,method:f.method,txid:f.txid};
  botC('در حال اتصال به درگاه نمایشی… <span class="dots"><i></i><i></i><i></i></span>',null);
  var myTx=f.txid,myAmt=f.amt,myMethod=f.method;
  setTimeout(function(){
    var cur=E27.wf;
    if(!cur||cur.txid!==myTx)return;
    if(myMethod==='sim-fail'){
      E27.wf=null;
      botC('✗ پرداخت ناموفق بود (سناریوی تست). موجودی تغییر نکرد.'+
      '<div class="racts"><button class="qbtn primary" data-cba="wRetry">تلاش دوباره</button><button class="qbtn" data-cba="wCancel">انصراف</button></div>',null);
      return;
    }
    S.wallet=(S.wallet||0)+myAmt;
    S.wlog.unshift({t:Date.now(),d:'شارژ کیف پول — درگاه نمایشی',a:myAmt,tx:myTx});
    save();renderTok();
    E27.wf=null;
    botC('✓ پرداخت موفق (درگاه نمایشی). کیف پول ریالی: <b>'+rial(S.wallet)+'</b><br><small>کد پیگیری: '+esc(myTx)+' — موجودی پس از نوسازی صفحه هم حفظ می‌شود.</small>'+
    '<div class="racts"><button class="qbtn" data-cba="wTx">تاریخچهٔ تراکنش‌ها</button><button class="qbtn" data-cba="wMenu">کیف پول و توکن‌ها</button></div>',null);
  },1200);
};
CBACT.wRetry=function(){
  if(!E27._lastAmt){E27.wf={mode:'amount'};botC('مبلغ شارژ را بنویسید:',null);return}
  E27.wf={mode:'confirm',amt:E27._lastAmt,method:'sim-ok',txid:'TX-'+Date.now().toString(36).toUpperCase()};
  E27.wConfirm();
};
CBACT.wTx=function(){
  var wl=S.wlog||[];
  botC('<b>تاریخچهٔ کیف پول ریالی</b>'+(wl.length?'':'<div class="empty" style="margin-top:8px">تراکنشی ثبت نشده است.</div>')+
  wl.slice(0,10).map(E27.wtxRow).join('')+
  '<div class="racts"><button class="qbtn" data-cba="wMenu">کیف پول و توکن‌ها</button></div>',null);
};
CBACT.wTok=function(){
  botC('<b>خرید توکن</b> — بسته‌ها کاملاً جدا از کیف پول ریالی‌اند:'+
  '<div class="racts">'+PACKS.map(function(p,i){
    return '<button class="qbtn'+(p.best?' primary':'')+'" data-cba="wBuyPack" data-i="'+i+'">'+p.n+' — '+fa(p.tok,0)+' توکن ('+rial(p.pr)+')</button>';
  }).join('')+'</div>'+
  '<div class="racts"><button class="qbtn" data-cba="wMenu">بازگشت</button></div>',null);
};
CBACT.wBuyPack=function(el){
  var p=PACKS[+el.getAttribute('data-i')];
  if(!p){toast('بسته پیدا نشد');return}
  E27.wf=null;
  openPayModal({mode:'sub',unit:'توکن',kind:'pack',packName:p.n,packTok:p.tok,packPrice:p.pr,rate:p.pr/p.tok,def:p.pr,sugg:[{l:'کامل',v:p.pr},{l:'دو برابر',v:p.pr*2}],title:'بستهٔ '+p.n});
};
ACT.wchat=function(){
  if(CURRENT!=='landing'){go('landing')}
  CBACT.wMenu();
};
/* رهگیری متن آزادِ جریان شارژ — بالاترین لایهٔ ceSend */
var _oCeSend27=ceSend;
ceSend=function(t){
  if(String(t)==='!back'){_oCeSend27(t);return}
  try{
    if(E27.wf&&E27.wfHandle(t))return;
  }catch(e){}
  _oCeSend27(t);
};

/* ═══ ۲۲) راه‌اندازی ═══ */`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 11 — boot: بدون چت شناور، بدون FAB
 * ══════════════════════════════════════════════════════════════════ */
rep(`(function(){
  try{
    renderSidebar();renderTok();
    var mbt=document.querySelector('.menubtn');if(mbt){mbt.innerHTML=ico('menu',20)}
    var fb2=document.getElementById('fcbfab');if(fb2){fb2.innerHTML=ico('chat',22)}
    var fh2=document.getElementById('fchico');if(fh2){fh2.innerHTML=ico('chat',18)}
    if(S.auth){
      var p=S.pending||'landing';
      S.pending=null;save();
      go(p);
    }else{
      go('landing');
    }
  }catch(e){
    var eb=document.getElementById('errbar');
    if(eb){eb.style.display='block';eb.textContent='خطای راه‌اندازی: '+(e&&e.message?e.message:e)}
    var lv=document.querySelector('.view.on');
    if(!lv){
      var l2=document.getElementById('v-landing');
      if(l2){l2.classList.add('on')}
    }
  }
  var s=document.getElementById('fchSend'),i=document.getElementById('fchIn');
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
  attInit('fch');
  setInterval(ppmTick,4000);
})();`,
`(function(){
  try{
    try{if(localStorage.getItem('mahalino_sidefold')==='1')document.body.classList.add('sidefold')}catch(e){}
    renderSidebar();renderTok();
    var mbt=document.querySelector('.menubtn');if(mbt){mbt.innerHTML=ico('menu',20)}
    if(S.auth){
      var p=S.pending||'landing';
      S.pending=null;save();
      go(p);
    }else{
      go('landing');
    }
  }catch(e){
    var eb=document.getElementById('errbar');
    if(eb){eb.style.display='block';eb.textContent='خطای راه‌اندازی: '+(e&&e.message?e.message:e)}
    var lv=document.querySelector('.view.on');
    if(!lv){
      var l2=document.getElementById('v-landing');
      if(l2){l2.classList.add('on')}
    }
  }
  setInterval(ppmTick,4000);
})();`);

/* ══════════════════════════════════════════════════════════════════
 * write
 * ══════════════════════════════════════════════════════════════════ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
