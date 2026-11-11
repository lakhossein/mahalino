/* Build Mahalino+V0.28 from V0.27 — UX refinement + conversational workflows (12 improvements).
 * Assert-per-replacement, in-place pattern. Input: V0.27 (read-only). Output: V0.28.
 * Tabler Icons (MIT) bundled from assets/icons — official outline SVGs, 24×24 grid.
 */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V28 = path.join(UI, 'Mahalino', 'V0.28');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.27', 'Mahalino+V0.27.html');
const OUT_FILE = path.join(V28, 'Mahalino+V0.28.html');
const ICON_DIR = path.join(V28, 'assets', 'icons');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists — delete it first to rebuild'); process.exit(1); }

/* ── Tabler loader: official outline SVGs → inner markup fragments ── */
function tablerInner(name){
  const f = path.join(ICON_DIR, name + '.svg');
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?svg[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return s;
}
const T = {};
['home','building-skyscraper','key','coin','briefcase','crane','bed','tools','layout-dashboard','message-circle','map','layout-grid','wallet','file-text','user','menu','shield-check','plus','search','trash','pencil','dots-vertical','copy','share','send','paperclip','calendar','bell','bell-ring','map-pin','credit-card','chart-line','arrows-left-right','filter','settings','sun','moon-high','panel-right-close','panel-right-open','check','x','alert-triangle','clock','chevron-left','chevron-right','chevron-down','refresh','pin','pin-off','edit','history','alarm-snooze'].forEach(n => { T[n] = tablerInner(n); });
function tsvg(name, sz){ return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+T[name]+'</svg>'; }

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
rep('/* ═══ محلینو — V0.27 (گفت‌وگومحور تمام‌عیار) — بر پایهٔ V0.26 ═══',
    '/* ═══ محلینو — V0.28 (پالایش تجربه) — بر پایهٔ V0.27 ═══');

/* ══════════════════════════════════════════════════════════════════
 * STEP 2 — Tabler Icons: ICONS + ico() + E27_IC + E22.ICO
 * ══════════════════════════════════════════════════════════════════ */
rep(`var ICONS={home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',buy:'<path d="M3 9.5 12 3l9 6.5"/><path d="M5 8.5V21h14V8.5"/><path d="M10 21v-5h4v5"/>',rent:'<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',invr:'<rect x="3" y="3" width="10" height="18" rx="1.5"/><path d="M13 9h8v12h-8"/><path d="M6.5 7h.01M9.5 7h.01M6.5 11h.01M9.5 11h.01M6.5 15h.01M9.5 15h.01M17 13h.01M17 17h.01"/>',mkt:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',build:'<path d="M3 21h18"/><path d="M5 21V8l7-5v18"/><path d="M12 10h7v11"/><path d="M15.5 14h.01M18 14h.01M15.5 17h.01M18 17h.01"/>',stay:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',svc:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',dash:'<path d="M4 20h16"/><path d="M7 20v-6"/><path d="M12 20V9"/><path d="M17 20V4"/>',chat:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',flows:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',wallet:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',con:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',coin:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',menu:'<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',grt:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M12 11.6l3.1 1.2v2.7c0 1.7-1.3 3-3.1 3.8-1.8-.8-3.1-2.1-3.1-3.8v-2.7z"/>'};`,
`/* V0.28 — Tabler Icons (MIT © Paweł Kuna) — outline، شبکهٔ ۲۴×۲۴، assets/icons */
var TABLER=${JSON.stringify(T)};
var ICONS={home:TABLER.home,buy:TABLER['building-skyscraper'],rent:TABLER.key,invr:TABLER.coin,mkt:TABLER.briefcase,build:TABLER.crane,stay:TABLER.bed,svc:TABLER.tools,dash:TABLER['layout-dashboard'],chat:TABLER['message-circle'],map:TABLER.map,flows:TABLER['layout-grid'],wallet:TABLER.wallet,con:TABLER['file-text'],user:TABLER.user,coin:TABLER.coin,menu:TABLER.menu,grt:TABLER['shield-check']};`);
rep(`function ico(n,sz){return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(ICONS[n]||'')+'</svg>'}`,
`function ico(n,sz){return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(ICONS[n]||'')+'</svg>'}`);

rep(`var E27_IC={
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
};`,
`var E27_IC={
  newchat:${JSON.stringify(tsvg('plus',15))},
  search:${JSON.stringify(tsvg('search',13))},
  chat:${JSON.stringify(tsvg('message-circle',15))},
  fold:${JSON.stringify(tsvg('panel-right-close',16))},
  unfold:${JSON.stringify(tsvg('panel-right-open',16))},
  wallet:${JSON.stringify(tsvg('wallet',15))},
  user:${JSON.stringify(tsvg('user',15))},
  gear:${JSON.stringify(tsvg('settings',15))},
  trash:${JSON.stringify(tsvg('trash',12))},
  pen:${JSON.stringify(tsvg('pencil',12))},
  pin:${JSON.stringify(tsvg('pin',13))},
  pinoff:${JSON.stringify(tsvg('pin-off',13))}
};`);
rep(`E22.ICO={
  moon:E22.svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sun:E22.svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  chat:E22.svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>')
};`,
`E22.ICO={
  moon:E22.svg(${JSON.stringify(T['moon-high'])}),
  sun:E22.svg(${JSON.stringify(T.sun)}),
  chat:E22.svg(${JSON.stringify(T['message-circle'])})
};`);

/* سنجاق با آیکون رسمی Tabler (جای 📌/📍) */
rep(`'<button class="e22-sact" type="button" data-act="sessPin" data-sess="'+qesc(s.id)+'" aria-pressed="'+(s.pinned?'true':'false')+'" aria-label="'+pinLab+'" title="'+pinLab+'">'+(s.pinned?'📌':'📍')+'</button>'+`,
`'<button class="e22-sact" type="button" data-act="sessPin" data-sess="'+qesc(s.id)+'" aria-pressed="'+(s.pinned?'true':'false')+'" aria-label="'+pinLab+'" title="'+pinLab+'">'+(s.pinned?E27_IC.pin:E27_IC.pinoff)+'</button>'+`,2);
rep(`  if(pin.length){h+='<div class="e27-sday">📌 سنجاق‌شده</div>';pin.forEach(function(s){h+=E27.sessRow(s)})}`,
`  if(pin.length){h+='<div class="e27-sday">سنجاق‌شده</div>';pin.forEach(function(s){h+=E27.sessRow(s)})}`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 3 — CSS افزودهٔ V0.28
 * ══════════════════════════════════════════════════════════════════ */
rep(`/* ═══ E27-CSS-END — مرز درج CSS های بعدی ═══ */`,
`/* ═══ E28 — پالایش تجربه (V0.28) ═══ */
/* توکن‌های معنایی وضعیت‌ها — خوانایی هاور در حالت تاریک */
:root{--hov:rgba(15,23,42,.05);--hov2:rgba(15,23,42,.1);--sel:rgba(15,118,110,.12)}
[data-theme="dark"]{--hov:rgba(148,163,184,.15);--hov2:rgba(148,163,184,.28);--sel:rgba(94,234,212,.18)}
.sitem:hover,.sfh:hover,.e27-srow:hover,.e27-new:hover,.tok:hover,.menubtn:hover,.e22-sact:hover,.qbtn:hover,.chip:hover,.mkti-chip:hover{background:var(--hov)}
.e27-srow:hover,.e27-new:hover{border-color:var(--bline)}
.sitem.on,.chip.on,.mkti-chip.on{background:var(--sel)}
[data-theme="dark"] .qbtn:hover,[data-theme="dark"] .btn:hover{border-color:var(--bline);color:var(--ink)}
/* کارت محلهٔ بزرگ (V0.28) */
.chcards .hcard{grid-column:1/-1;max-width:600px}
.hcard{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.hcard-h{display:flex;align-items:center;gap:10px;padding:14px 16px 10px}
.hcard-h img{width:88px;height:60px;object-fit:cover;border-radius:10px;flex:none}
.hcard-h b{font-size:15px}
.hcard-h small{display:block;color:var(--ink2);font-weight:400;margin-top:2px}
.hcard-score{margin-inline-start:auto;background:var(--brand);color:#fff;border-radius:999px;font-size:11.5px;font-weight:800;padding:5px 11px;white-space:nowrap}
.hcard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;padding:0 16px 12px}
.hcard-cell{background:var(--bg);border:1px solid var(--line);border-radius:11px;padding:8px 11px}
.hcard-cell small{display:block;font-size:10.5px;color:var(--ink2);margin-bottom:2px}
.hcard-cell b{font-size:13px}
.hcard-cell .up{color:#15803d;font-weight:800}
.hcard-cell .down{color:#b91c1c;font-weight:800}
[data-theme="dark"] .hcard-cell .up{color:#4ade80}
[data-theme="dark"] .hcard-cell .down{color:#f87171}
.hcard-loc{padding:0 16px 10px;font-size:11.5px;color:var(--ink2);line-height:1.9}
.hcard .btns{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px 14px;border-top:1px solid var(--line)}
/* کامپوزر — ارگونومی ChatGPT */
.ch-main .cwr{border:1px solid var(--line);border-radius:22px;margin:0 14px 14px;padding:8px 10px;background:var(--surface);box-shadow:0 2px 12px rgba(15,23,42,.06)}
[data-theme="dark"] .ch-main .cwr{box-shadow:none}
.ch-main .cwr-in{min-height:24px;max-height:200px;padding:11px 10px;font-size:14px;border:0;border-radius:12px;box-shadow:none;background:transparent}
.ch-main .cwr-in:focus{box-shadow:none}
.ch-main .cwr-row{align-items:flex-end}
.ch-main .cwr-att,.ch-main .cwr-send{width:40px;height:40px;border-radius:12px}
.ch-main .cwr-send{padding:0 14px;width:auto;height:40px;font-weight:800}
@media (max-width:700px){.ch-main .cwr{margin:0 8px 10px;border-radius:18px}}
.chat-sugg[hidden]{display:none!important}
/* اکشن‌های پیام */
.macts{position:absolute;top:6px;inset-inline-end:8px;display:flex;gap:2px;opacity:0;transition:opacity .12s}
.msg:hover .macts,.msg:focus-within .macts{opacity:1}
.macts button{width:26px;height:26px;display:grid;place-items:center;border:0;background:var(--hov);color:var(--ink2);border-radius:7px;cursor:pointer;padding:0}
.macts button:hover{background:var(--hov2);color:var(--ink)}
.macts button svg{width:14px;height:14px}
@media (hover:none){.macts{opacity:.75}}
/* یادآورها (V0.28) */
.rem28{border:1px solid var(--line);border-radius:12px;padding:9px 12px;margin:6px 0;display:flex;gap:10px;align-items:flex-start;background:var(--card)}
.rem28.overdue{border-color:#f59e0b}
.rem28.done{opacity:.55}
.rem28-main{flex:1;min-width:0}
.rem28-main b{font-size:13px}
.rem28-main small{display:block;color:var(--ink2);font-size:11px;margin-top:2px}
.rem28-acts{display:flex;gap:4px;flex-wrap:wrap}
.rem28-acts button{width:28px;height:28px;display:grid;place-items:center;border:1px solid var(--line);background:var(--surface);color:var(--ink2);border-radius:8px;cursor:pointer;padding:0}
.rem28-acts button:hover{background:var(--hov);color:var(--ink)}
.rem28-acts button svg{width:14px;height:14px}
.rem28-tag{font-size:10px;border-radius:999px;padding:1px 8px;background:var(--hov);color:var(--ink2);margin-inline-start:6px}
/* پیشنهادهای زمینه‌ای */
.e28-disc{margin-top:10px}
.e28-disc-g{font-size:10.5px;color:var(--ink2);font-weight:700;margin:8px 2px 4px}
.e28-disc .racts{margin:0}
/* اسلایدر قبل/بعد — کارایی */
.ba27-wrap{contain:content;touch-action:pan-y}
.ba27-wrap img{decoding:async}
.ba27-after{will-change:clip-path}
.ba27-handle{transform:translateX(-50%)}
/* ═══ E27-CSS-END — مرز درج CSS های بعدی ═══ */`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 4 — کارت محلهٔ بزرگ با بلوک‌های دادهٔ جدا (P1)
 * ══════════════════════════════════════════════════════════════════ */
rep(`function chatHoodCard(h,m,D){
  var s=hoodScore(h,D.P),inC=(D.cmpH||[]).indexOf(h.id)>=0;
  return '<div class="ccard"><div class="cthumb">'+ph(h.id,150,94,'')+'</div>'+
  '<div class="cb"><b>محلهٔ '+h.n+' — تطبیق ٪'+fa(s,0)+'</b><small>اجاره نمونه '+rial(h.avgRent)+' • میانگین آگهی هر متر '+rial(h.buyBase)+' • '+esc(placeText(h.id,2))+'</small></div>'+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selH" data-m="'+m+'" data-h="'+h.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="hInfo" data-h="'+h.id+'">اطلاعات</button>'+
  '<button class="btn btn-xs" data-cba="hMap" data-h="'+h.id+'">نقشه</button>'+
  '<button class="btn btn-xs" data-cba="caddH" data-m="'+m+'" data-h="'+h.id+'">'+(inC?'✓':'مقایسه')+'</button></div></div>';
}`,
`/* V0.28 — کارت محلهٔ بزرگ: هر داده در بلوک جدا */
function chatHoodCard(h,m,D){
  var s=hoodScore(h,D.P),inC=(D.cmpH||[]).indexOf(h.id)>=0;
  function cell(lab,val,cls){return '<div class="hcard-cell"><small>'+lab+'</small><b'+(cls?' class="'+cls+'"':'')+'>'+val+'</b></div>'}
  return '<div class="hcard">'+
  '<div class="hcard-h">'+ph(h.id,176,120,'')+'<div><b>محلهٔ '+esc(h.n)+'</b><small>امتیاز تطبیق با اولویت‌های شما</small></div><span class="hcard-score">٪'+fa(s,0)+'</span></div>'+
  '<div class="hcard-grid">'+
  cell('اجارهٔ نمونهٔ ماهانه',rial(h.avgRent))+
  cell('ودیعهٔ نمونه',rial(h.avgDep))+
  cell('میانگین آگهی هر متر',rial(h.buyBase))+
  cell('بازهٔ آگهی',rShort(h.mkt.low)+' – '+rShort(h.mkt.high))+
  cell('تغییر یک‌ساله',pct(h.mkt.yoy),h.mkt.yoy>=0?'up':'down')+
  cell('تغییر ماهانه',pct(h.mkt.mom),h.mkt.mom>=0?'up':'down')+
  '</div>'+
  (placeText(h.id,2)?'<div class="hcard-loc"><small style="display:block;color:var(--ink2);font-size:10.5px;margin-bottom:2px">مکان‌های مهم</small>'+esc(placeText(h.id,2))+'</div>':'<div class="hcard-loc"><small style="display:block;color:var(--ink2);font-size:10.5px;margin-bottom:2px">مکان‌های مهم</small>ثبت نشده</div>')+
  '<div class="btns"><button class="btn btn-xs btn-primary" data-cba="selH" data-m="'+m+'" data-h="'+h.id+'">انتخاب</button>'+
  '<button class="btn btn-xs" data-cba="hInfo" data-h="'+h.id+'">اطلاعات</button>'+
  '<button class="btn btn-xs" data-cba="hMap" data-h="'+h.id+'">نقشه</button>'+
  '<button class="btn btn-xs" data-cba="caddH" data-m="'+m+'" data-h="'+h.id+'">'+(inC?'✓ در مقایسه':'مقایسه')+'</button></div></div>';
}`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 5 — پیشنهادهای زمینه‌ای جایگزین دکمه‌های ثابت (P0)
 * ══════════════════════════════════════════════════════════════════ */
rep(`function ctxSuggestions(){
  var out=[];
  function at(l,a,p){out.push({l:l,a:a,p:!!p})}
  if(!S.auth){at('ورود / ثبت‌نام','data-view="auth"',true);at('نقشه','data-view="map"');at('راهنما','data-cq="راهنما"');return out}
  if(CE.f){
    if(CE.hist&&CE.hist.length){at('بازگشت','data-cv="!back"')}
    at('پایان گفت‌وگو','data-act="chatStop"');
    if(CE.f==='rent'||CE.f==='buy'){at('محله‌ها','data-cq="محله‌ها"')}
    at('درخواست‌ها','data-act="dt" data-t="req" data-cat="'+(CE.f==='invest'?'invr':CE.f)+'"');
    at('نقشه','data-view="map"');
    return out.slice(0,5);
  }
  if(CURRENT==='landing'){at('اجاره','data-cf="rent"',true);at('خرید','data-cf="buy"');at('اقامتگاه','data-cf="stay"');at('راهنما','data-cq="راهنما"');at('درخواست‌های من','data-act="reqModal"')}
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
}`,
`/* V0.28 — پیشنهادهای زمینه‌ای: بر پایهٔ وضعیت گفت‌وگو؛ بدون دکمهٔ ثابت */
function ctxSuggestions(){
  var out=[];
  function at(l,a,p){out.push({l:l,a:a,p:!!p})}
  if(!S.auth){at('ورود / ثبت‌نام','data-view="auth"',true);return out}
  if(CE.f){return out} /* در جریان فلو، چیپ‌های همان گام اقدام بعدی‌اند — ردیف پیشنهادی خالی می‌ماند */
  if(CURRENT!=='landing'){at('بازگشت به گفت‌وگو','data-view="landing"',true);return out}
  return E28.welcomeSuggestions();
}`);
rep(`  var items=ctxSuggestions();
  [document.getElementById('fchSugg'),document.getElementById('chatSugg'),document.getElementById('dashSugg')].forEach(function(host){
    if(!host)return;
    host.innerHTML=items.map(function(it){return '<button class="qbtn'+(it.p?' primary':'')+'" '+it.a+'>'+it.l+'</button>'}).join('');
    a11yify(host);
  });`,
`  var items=ctxSuggestions();
  [document.getElementById('fchSugg'),document.getElementById('chatSugg'),document.getElementById('dashSugg')].forEach(function(host){
    if(!host)return;
    host.hidden=!items.length;
    host.innerHTML=items.map(function(it){return '<button class="qbtn'+(it.p?' primary':'')+'" '+it.a+'>'+it.l+'</button>'}).join('');
    a11yify(host);
  });`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 5b — پیام خوش‌آمد gate با چیپ‌های کشف همهٔ فلوها (P1)
 * ══════════════════════════════════════════════════════════════════ */
rep(`{id:'hello',q:'سلام. برای پیشنهادهای دقیق‌تر، <b>محل کار</b> و <b>مدرسهٔ فرزندان</b> را مشخص کنید — یا همین حالا شروع کنید.<div class="racts" style="margin-top:8px"><button class="qbtn primary" data-cf="rent">شروع اجاره</button><button class="qbtn" data-cf="buy">شروع خرید</button><button class="qbtn" data-cq="بازار محله‌ها">بازار محله‌ها</button><button class="qbtn" data-cq="کارهای نیمه‌تمام من">ادامهٔ کارها</button></div>',`,
`{id:'hello',q:function(){return 'سلام! چه کاری برایتان انجام دهم؟'+E28.discoverChips()},`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 6 — اکشن‌های پیام (کپی/ویرایش/حذف) — P1
 * ══════════════════════════════════════════════════════════════════ */
rep(`    b.el.innerHTML=HIST.map(function(m,ix){
      var h='<div class="msg '+m.r+'"><span class="who">'+(m.r==='bot'?'دستیار':'شما')+'</span><div class="bub">'+m.h;
      if(m.r==='bot'&&m.c&&ix===last){
        var chips=m.c.slice();
        if(CE.f&&CE.hist&&CE.hist.length){chips=chips.concat([['\\u21a9 بازگشت','!back']])}
        if(chips.length){h+='<div class="qr">'+chips.map(function(c){return '<button data-cv="'+qesc(c[1])+'">'+c[0]+'</button>'}).join('')+'</div>'}
      }
      return h+'</div></div>';
    }).join('');`,
`    b.el.innerHTML=HIST.map(function(m,ix){
      var h='<div class="msg '+m.r+'"><span class="who">'+(m.r==='bot'?'دستیار':'شما')+'</span><div class="bub">'+m.h;
      if(m.r==='bot'&&m.c&&ix===last){
        var chips=m.c.slice();
        if(CE.f&&CE.hist&&CE.hist.length){chips=chips.concat([['\\u21a9 بازگشت','!back']])}
        if(chips.length){h+='<div class="qr">'+chips.map(function(c){return '<button data-cv="'+qesc(c[1])+'">'+c[0]+'</button>'}).join('')+'</div>'}
      }
      return h+'</div>'+E28.msgActs(m,ix)+'</div>';
    }).join('');`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 7 — کامپوزر: Enter/IME
 * ══════════════════════════════════════════════════════════════════ */
rep(`  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();s.onclick()}})}
  attInit('chat');`,
`  var i2=document.getElementById('chatIn');
  if(i2){i2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){if(e.isComposing||e.keyCode===22)return;e.preventDefault();s.onclick()}})}
  attInit('chat');`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 8 — قرارداد درون‌گفت‌وگو (P0) + وضعیت فسخ + گارد تکرار
 * ══════════════════════════════════════════════════════════════════ */
rep(`{id:'ctr0',q:'فرم قرارداد را باز می‌کنم؛ اطلاعات طرفین و ملک را همان‌جا تکمیل و تأیید کنید. ثبت رسمی در این نسخه انجام نمی‌شود.',chips:function(){return [['باز کردن فرم','!open']]},set:function(){return null},acts:{open:function(){var d=wd('rent');d.step=7;save();go('rent');ceEnd()}}},`,
`{id:'ctr0',q:function(D){
   if(D.signed&&D.code)return ' قرارداد <b dir="ltr">'+D.code+'</b> فعال است. برای ادامه، فسخ را از همین گفت‌وگو شروع کنید.';
   return ' <b>ثبت قرارداد داخلی</b> — فرم را همین‌جا در گفت‌وگو کامل می‌کنیم (طرفین → ملک و مالی → بازبینی → ثبت).';
  },
 chips:function(){return [['باز کردن فرم در گفت‌وگو','!open']]},set:function(){return null},
 acts:{open:function(D){E28.ctrStart('rent')}}},`);

/* وضعیت فسخ‌شده در مدل نمایش */
rep(`  signed:{l:'امضاشده (داخلی)',c:'b-ok'},
  cancelled:{l:'لغوشده',c:'b-warn'}
};`,
`  signed:{l:'امضاشده (داخلی)',c:'b-ok'},
  terminated:{l:'فسخ‌شده',c:'b-warn'},
  cancelled:{l:'لغوشده',c:'b-warn'}
};`);

/* ACT.tpay — به‌روزرسانی واقعی وضعیت قرارداد + جلوگیری از تکرار */
rep(`ACT.tpay=function(){
  var d=wd('rent'),D=d.data,T=D.term;
  if(!T||T.paid)return;
  T.paid=true;d.done=true;
  if(T.rid)setReq(T.rid,'کامل شد');
  addReq('rent','تسویه','۱۰۰٪ ودیعه '+D.code,'کامل شد','کسر: صفر (AI)');
  save();renderCurrent();toast('ودیعه واریز ✓');
};`,
`ACT.tpay=function(){
  var d=wd('rent'),D=d.data,T=D.term;
  if(!T||T.paid)return;
  T.paid=true;d.done=true;
  if(T.rid)setReq(T.rid,'کامل شد');
  addReq('rent','تسویه','۱۰۰٪ ودیعه '+D.code,'کامل شد','کسر: صفر (AI)');
  E28.applyTermination(D.code); /* V0.28: امضاشده (داخلی) → فسخ‌شده */
  save();renderCurrent();toast('ودیعه واریز ✓');
};`);

/* گارد فسخ تکراری در termq */
rep(` acts:{
  go:function(D){D.term={ph:1,who:'مستأجر (شما)'};save();if(CURRENT==='rent')renderCurrent();ceJump('treason')},`,
` acts:{
  go:function(D){
    if(E28.contractOf(D.code)&&E28.contractOf(D.code).status==='terminated'){botC(' قرارداد <b dir="ltr">'+esc(D.code)+'</b> قبلاً فسخ شده است.',null);return}
    D.term={ph:1,who:'مستأجر (شما)'};save();if(CURRENT==='rent')renderCurrent();ceJump('treason')},`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 9 — اسلایدر تخلیه: کارایی (rAF + pointer + preload) (P1)
 * ══════════════════════════════════════════════════════════════════ */
rep(`  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.classList&&t.classList.contains('ba27-range')){
      var root=t.closest('.ba27');if(!root)return;
      var w=root.querySelector('.ba27-wrap');if(!w)return;
      var v=+t.value,after=w.querySelector('.ba27-after'),hd=w.querySelector('.ba27-handle');
      if(after)after.style.clipPath='inset(0 0 0 '+v+'%)';
      if(hd)hd.style.left=v+'%';
    }
  });`,
`  /* V0.28: rAF-batch + pointer drag — baPaint در بلوک E28 تعریف می‌شود */
  document.addEventListener('input',function(e){
    var t=e.target;
    if(!(t&&t.classList&&t.classList.contains('ba27-range')))return;
    var root=t.closest('.ba27');if(!root)return;
    var w=root.querySelector('.ba27-wrap');if(!w)return;
    var v=+t.value;
    if(!w._raf){
      w._raf=requestAnimationFrame(function(){w._raf=null;E28.baPaint(w,+t.value)});
    }
  });
  document.addEventListener('pointerdown',function(e){
    var w=e.target&&e.target.closest?e.target.closest('.ba27-wrap'):null;
    if(!w)return;
    var ba=w.closest('.ba27'),rng=ba?ba.querySelector('.ba27-range'):null;
    function toPct(ev){
      var r=w.getBoundingClientRect();
      /* RTL: سمت راست = روز ورود (۱۰۰٪) */
      return Math.max(0,Math.min(100,Math.round((r.right-ev.clientX)/r.width*100)));
    }
    w.setPointerCapture&&w.setPointerCapture(e.pointerId);
    E28.baPaint(w,toPct(e));
    function mv(ev){ev.preventDefault();E28.baPaint(w,toPct(ev))}
    function up(){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up)}
    w.addEventListener('pointermove',mv);
    w.addEventListener('pointerup',up);
    w.addEventListener('pointercancel',up);
    if(rng)rng.focus({preventScroll:true});
  });`);

/* تصاویر بهینهٔ اسلایدر: ابعاد صریح + preload */
rep(`  '<div class="ba27-wrap">'+
  '<img id="ba27-img-before" src="'+E27.baImg('before')+'" alt="روز ورود — پیش از تخلیه، با اثاثیه">'+
  '<div class="ba27-after"><img src="'+E27.baImg('after')+'" alt="روز تخلیه — پس از خارج‌شدن اثاثیه"></div>'+
  '<div class="ba27-handle" style="left:50%"></div>'+
  '</div>'+`,
`  '<div class="ba27-wrap" tabindex="0" role="slider" aria-label="مقایسهٔ روز ورود و روز تخلیه" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">'+
  '<img id="ba27-img-before" src="'+E27.baImg('before')+'" width="1200" height="800" decoding="async" fetchpriority="high" alt="روز ورود — پیش از تخلیه، با اثاثیه">'+
  '<div class="ba27-after"><img src="'+E27.baImg('after')+'" width="1200" height="800" decoding="async" alt="روز تخلیه — پس از خارج‌شدن اثاثیه"></div>'+
  '<div class="ba27-handle" style="left:50%"></div>'+
  '</div>'+`);
rep(`function baHTML(){
  var st=(CE.f==='rent')?((wd('rent').data.term||{}).ba||{}):{};
  var stage=st.stage||1;`,
`function baHTML(){
  var st=(CE.f==='rent')?((wd('rent').data.term||{}).ba||{}):{};
  var stage=st.stage||1;
  try{ /* preload هر دو تصویر برای کشش بی‌وقفه */
    ['assets/img/emptying-before.jpg','assets/img/emptying-after.jpg'].forEach(function(u){var i2=new Image();i2.src=u});
  }catch(e){}`);
/* کیبورد روی wrap — درج قبل از listener تغییر فایل (data-ba27) */
rep(`  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.getAttribute&&t.getAttribute('data-ba27')){`,
`  document.addEventListener('keydown',function(e){
    var w=e.target&&e.target.closest?e.target.closest('.ba27-wrap'):null;
    if(w&&e.target===w){
      var v=+(w.getAttribute('aria-valuenow')||50);
      if(e.key==='ArrowLeft')v=Math.min(100,v+4);
      else if(e.key==='ArrowRight')v=Math.max(0,v-4);
      else return;
      e.preventDefault();
      w.setAttribute('aria-valuenow',v);
      E28.baPaint(w,v);
      return;
    }
  });
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.getAttribute&&t.getAttribute('data-ba27')){`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 10 — متن‌های زائد — حذف/فشرده‌سازی (P1)
 * ══════════════════════════════════════════════════════════════════ */
rep(`  '<p class="note" style="margin-top:10px">شارژ از «درگاه نمایشی» انجام می‌شود (پرداخت واقعی متصل نیست). کیف پول ریالی و توکن‌ها کاملاً مستقل‌اند؛ درآمد اجاره و فروش هم به همین کیف واریز می‌شود.</p></div>'+`,
`  '<p class="note" style="margin-top:10px">شارژ با درگاه نمایشی.</p></div>'+`);
rep(`  rcNote('کیف پول ریالی و توکن دو حساب جدا هستند؛ شارژ یکی روی دیگری اثر ندارد.')+
`, '');
rep(`  rcNote('پرداخت از «درگاه نمایشی» انجام می‌شود؛ در این نسخه درگاه بانکی واقعی متصل نیست و این موضوع صریحاً اعلام می‌شود.')+
`, '');
rep(`  rcNote('این یک «شبیه‌ساز پرداخت» است و پرداخت بانکی واقعی نیست.')+
`, '');
rep(`  '<div class="ba27-demo">نمونهٔ نمایشی: این دو تصویر، نمونهٔ دموی «شبیه‌سازی‌شده»اند، نه عکس واقعی ملک شما. با گزینهٔ «تصویر خودم» عکس واقعی ملک را جایگزین کنید تا مقایسه روی ملک شما انجام شود.</div>'+`,
`  '<div class="ba27-demo">نمونهٔ نمایشی — با «تصویر خودم» عکس ملک خودتان را جایگزین کنید.</div>'+`);
rep(`E22.NOTE='گفت‌وگوی پیشین بازیابی شد؛ فلوهای در جریان از «درخواست‌های من» ادامه می‌یابند.';`,
`E22.NOTE='گفت‌وگوی پیشین بازیابی شد.';`);
rep(`  '<b>صادقانه:</b> سری زمانی و ارقام این نسخه، دادهٔ نمونهٔ شبیه‌سازی‌شدهٔ سامانه است (هوش مصنوعی زنده به دادهٔ واقعی متصل نیست).'+`,
`  'دادهٔ نمونهٔ سامانه — قیمت آگهی است، نه معاملهٔ قطعی.'+`);
rep(`     botC(' نتیجهٔ تحلیل (نمایشی): ۱ مورد خارج از استهلاک (نم دیوار — بار موجر) + ۱ مورد استهلاک عادی. <b>کسر: صفر.</b><br><small>این نتیجه در نسخهٔ نمایشی الگوریتمی ثابت دارد و تحلیل هوش مصنوعی واقعی نیست.</small>',[['تسویه ودیعه','!pay']]);`,
`     botC(' نتیجهٔ تحلیل: ۱ مورد خارج از استهلاک (نم دیوار — بار موجر) + ۱ مورد استهلاک عادی. <b>کسر: صفر.</b>',[['تسویه ودیعه','!pay']]);`);
rep(`  var h='<div class="card"><div class="ct">طرفین قرارداد</div><p class="note">نام شما از حساب کاربری پر شده است. کد ملی را برای بررسی و تکمیل مشخصات وارد کنید.</p>';`,
`  var h='<div class="card"><div class="ct">طرفین قرارداد</div><p class="note">کد ملی برای تکمیل خودکار مشخصات.</p>';`);

/* ══════════════════════════════════════════════════════════════════
 * STEP 11 — موتور E28 (پیش از راه‌اندازی)
 * ══════════════════════════════════════════════════════════════════ */
rep(`/* ═══ ۲۲) راه‌اندازی ═══ */`,
`/* ═══ ۲۱.۱۳) موتور V0.28 (E28) — قرارداد درون‌گفت‌وگو، یادآور جامع، اکشن پیام، کشف فلوها ═══ */
var E28={ctrKind:null,ctrDone:null,remPend:null,remF:'all'};
E28.tsv=function(n,sz){return '<svg width="'+(sz||16)+'" height="'+(sz||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+TABLER[n]+'</svg>'};
E28.baPaint=function(w,v){
  if(w._pv===v)return;w._pv=v;
  var after=w.querySelector('.ba27-after'),hd=w.querySelector('.ba27-handle');
  if(after)after.style.clipPath='inset(0 0 0 '+v+'%)';
  if(hd)hd.style.left=v+'%';
  var r=w.parentNode&&w.parentNode.querySelector('.ba27-range');
  if(r&&+r.value!==v)r.value=v;
};

/* ── اکشن‌های پیام ── */
E28.plain=function(html){
  var d=document.createElement('div');d.innerHTML=String(html||'');
  return (d.textContent||'').replace(/\\s+$/,'');
};
E28.msgActs=function(m,ix){
  if(!m||m.sys)return '';
  var b='';
  if(m.r==='user')b+='<button type="button" data-cba="mEdit" data-ix="'+ix+'" aria-label="ویرایش پیام" title="ویرایش">'+E28.tsv('pencil',14)+'</button>';
  b+='<button type="button" data-cba="mCopy" data-ix="'+ix+'" aria-label="کپی پیام" title="کپی">'+E28.tsv('copy',14)+'</button>';
  if(m.r==='user')b+='<button type="button" data-cba="mDel" data-ix="'+ix+'" aria-label="حذف پیام" title="حذف">'+E28.tsv('trash',14)+'</button>';
  return '<span class="macts">'+b+'</span>';
};
CBACT.mCopy=function(el){
  var ix=+el.getAttribute('data-ix'),m=HIST[ix];
  if(!m)return;
  var txt=E28.plain(m.h);
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt);
    else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    toast('پیام کپی شد');
  }catch(e){toast('کپی ممکن نشد')}
};
CBACT.mEdit=function(el){
  var ix=+el.getAttribute('data-ix'),m=HIST[ix];
  if(!m||m.r!=='user')return;
  var txt=E28.plain(m.h);
  var i2=document.getElementById('chatIn');
  if(i2){i2.value=txt;i2.focus();i2.dispatchEvent(new Event('input',{bubbles:true}))}
  HIST.splice(ix,1);cr();
};
CBACT.mDel=function(el){
  var ix=+el.getAttribute('data-ix');
  if(HIST[ix]&&HIST[ix].r==='user'){HIST.splice(ix,1);cr()}
};

/* ── کشف فلوها: پیشنهادهای خوش‌آمد (گروه‌بندی‌شده، همه قابل اجرا) ── */
E28.welcomeSuggestions=function(){
  return [
    {l:'شروع اجاره',a:'data-cf="rent"',p:1},
    {l:'شروع خرید',a:'data-cf="buy"'},
    {l:'بازار محله‌ها',a:'data-cq="بازار محله‌ها"'},
    {l:'مقایسهٔ محله‌ها',a:'data-cq="مقایسه سعادت‌آباد و پونک"'},
    {l:'نقشه',a:'data-view="map"'},
    {l:'درخواست‌های من',a:'data-act="reqModal"'},
    {l:'ثبت قرارداد',a:'data-cq="ثبت قرارداد"'},
    {l:'فسخ قرارداد',a:'data-cq="فسخ قرارداد"'},
    {l:'کیف پول',a:'data-cba="wMenu"'},
    {l:'یادآورها',a:'data-cba="remMenu28"'},
    {l:'اقامتگاه',a:'data-cf="stay"'},
    {l:'خدمات ملک',a:'data-act="svcs"'}
  ];
};
E28.discoverChips=function(){
  function g(t,items){return '<div class="e28-disc-g">'+t+'</div><div class="racts">'+items.map(function(x){return '<button class="qbtn'+(x[2]?' primary':'')+'" '+x[1]+'>'+x[0]+'</button>'}).join('')+'</div>'}
  return '<div class="e28-disc">'+
  g('معامله',[
    ['شروع اجاره','data-cf="rent"',1],['شروع خرید','data-cf="buy"'],['اقامتگاه','data-cf="stay"']
  ])+
  g('بازار و تحلیل',[
    ['بازار محله‌ها','data-cq="بازار محله‌ها"'],['مقایسهٔ محله‌ها','data-cq="مقایسه سعادت‌آباد و پونک"'],['نقشه','data-view="map"']
  ])+
  g('قرارداد و امور',[
    ['ثبت قرارداد','data-cq="ثبت قرارداد"'],['فسخ قرارداد','data-cq="فسخ قرارداد"'],['درخواست‌های من','data-act="reqModal"']
  ])+
  g('حساب و ابزار',[
    ['کیف پول','data-cba="wMenu"'],['یادآورها','data-cba="remMenu28"'],['خدمات ملک','data-act="svcs"']
  ])+
  '</div>';
};

/* ── قرارداد درون‌گفت‌وگو: بازاستفاده از فرم صفحه در حباب ── */
E28.contractOf=function(code){
  if(!code||!S.contracts)return null;
  for(var i=0;i<S.contracts.length;i++){if(S.contracts[i]&&S.contracts[i].code===code)return S.contracts[i]}
  return null;
};
E28.applyTermination=function(code){
  var c=E28.contractOf(code);
  if(!c||c.status==='terminated')return false;
  c.statusTrail=(c.statusTrail||[]).concat([{st:c.status||'signed_internal',t:c.t||Date.now()}]);
  c.status='terminated';
  if(c.doc)c.doc.status='terminated';
  c.terminatedAt=Date.now();
  try{addReq('rent','فسخ','فسخ قرارداد '+code,'کامل شد','وضعیت: فسخ‌شده')}catch(e){}
  return true;
};
E28.ctrBubble=function(){
  var kind=E28.ctrKind||'rent',D=wd(kind).data,c=conInit(D,kind);
  return '<div data-e28ctr="1">'+conFlowHTML(D,kind)+'</div>';
};
E28.ctrRefresh=function(){
  if(CURRENT!=='landing')return;
  var b=document.getElementById('chatB');
  if(!b||!b.querySelector('[data-e28ctr]'))return;
  var lastMsg=null,bots=b.querySelectorAll('.msg.bot');
  if(bots.length)lastMsg=bots[bots.length-1];
  if(!lastMsg||!lastMsg.querySelector('[data-e28ctr]'))return;
  HIST[HIST.length-1]={r:'bot',h:E28.ctrBubble(),c:null};
  cr();
  var kind=E28.ctrKind||'rent',D=wd(kind).data,c=conInit(D,kind);
  if(c.finalized&&E28.ctrDone!==c.code){
    E28.ctrDone=c.code;
    botC(' قرارداد داخلی <b dir="ltr">'+esc(c.code)+'</b> ثبت شد. فسخ بعدی هم در همین گفت‌وگو انجام می‌شود.'+
    '<div class="racts"><button class="qbtn primary" data-cba="ctrCont" data-v="trm">شروع فسخ و تخلیه</button><button class="qbtn" data-cv="F:reqs">درخواست‌های من</button></div>',null);
  }
};
E28.ctrStart=function(kind){
  kind=kind||'rent';
  E28.ctrKind=kind;
  var D=wd(kind).data;
  D.ctr=conInit(D,kind);
  if(D.ctr.finalized&&D.code)E28.ctrDone=D.code;
  botC('<b>'+(kind==='buy'?'مبایعه‌نامه':'اجاره‌نامه')+'</b> — فرم درون‌گفت‌وگو:'+E28.ctrBubble(),null);
  if(D.ctr.finalized){
    botC(' قرارداد <b dir="ltr">'+esc(D.code||D.ctr.code||'')+'</b> ثبت شده است. فسخ هم در همین گفت‌وگو انجام می‌شود.'+
    '<div class="racts"><button class="qbtn primary" data-cba="ctrCont" data-v="trm">شروع فسخ و تخلیه</button></div>',null);
  }
};
var _oConKind=conKind;
conKind=function(){return (CURRENT==='landing'&&E28.ctrKind)?E28.ctrKind:_oConKind()};
['cback','lookupId','lookupPostal','cpartySave','cpropSave','capprove','cfinalize'].forEach(function(k){
  var o=ACT[k];
  if(typeof o!=='function')return;
  ACT[k]=function(el){o(el);setTimeout(function(){try{E28.ctrRefresh()}catch(e){}},30)};
});
CBACT.ctrCont=function(el){
  var v=el.getAttribute('data-v');
  if(v==='trm'){
    var kind=E28.ctrKind||'rent',D=wd(kind).data;
    if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
    if(!D.term)D.term={ph:1,who:'مستأجر (شما)'};
    save();ceJump('termq');
  }
};

/* ── یادآور جامع (V0.28) — مدل کامل، تشخیص خودکار، مدیریت ── */
E28.remNorm=function(){
  if(!S.reminders)S.reminders=[];
  var now=Date.now();
  S.reminders.forEach(function(r){
    if(!r)return;
    if(r.desc===undefined)r.desc='';
    if(!r.rec)r.rec='once';
    if(r.status===undefined)r.status=r.done?'done':'open';
    if(!r.src)r.src='manual';
    if(!r.createdAt)r.createdAt=now;
    if(!r.updatedAt)r.updatedAt=now;
    if(r.notified===undefined)r.notified=false;
  });
};
E28.findRem=function(id){
  var a=S.reminders||[];
  for(var i=0;i<a.length;i++){if(a[i]&&a[i].id===id)return a[i]}
  return null;
};
E28.remTitleFromText=function(t){
  return String(t||'')
    .replace(/(یادم بنداز|یادم بینداز|یادآور کن|یادآوری کن|به من یادآوری کن|یادآور بگذار|یادم باشه|یادم باشد|remind me)/g,' ')
    .replace(/\\s+/g,' ').replace(/^ | $/g,'')
    .replace(/^(فردا|پس‌فردا|امروز)\\s+/,'')
    .replace(/^ساعت\\s*[۰-۹0-9]{1,2}([:٫.:][۰-۹0-9]{1,2})?\\s*/,'')
    .replace(/(که|رو|را)\s+(فردا|پس‌فردا|امروز|هفتهٔ بعد|هفته بعد)/g,' ')
    .replace(/^\\s+|\\s+$/g,'').replace(/\\s+/g,' ').slice(0,70);
};
E28.remParseWhen=function(nn){
  var t=normFa(nn),d=null,rec='once';
  if(/اول هر ماه|اولین روز هر ماه|هر ماه اول/.test(t))rec='monthly';
  else if(/هر ماه/.test(t))rec='monthly';
  else if(/هر هفته/.test(t))rec='weekly';
  d=E21.dateFromText(t);
  if(!d&&rec==='monthly'){d=new Date();d=new Date(d.getFullYear(),d.getMonth()+1,1,9,0,0).getTime()}
  if(!d){
    var m=t.match(/([۰-۹0-9]+)\\s*(روز|هفته|ماه)\\s*(دیگر|بعد|دیگه)/);
    if(m){
      var n=+pd(m[1]),unit=m[2],mult=unit==='روز'?864e5:(unit==='هفته'?7*864e5:30*864e5);
      var base=new Date();base=new Date(base.getFullYear(),base.getMonth(),base.getDate(),9,0,0);
      d=base.getTime()+n*mult;
    }
  }
  if(!d){
    var wd_={'شنبه':6,'یک‌شنبه':0,'یکشنبه':0,'دوشنبه':1,'سه‌شنبه':2,'سهشنبه':2,'چهارشنبه':3,'پنج‌شنبه':4,'پنجشنبه':4,'جمعه':5};
    for(var k in wd_){
      if(t.indexOf(k)>=0){
        var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
        var cur=today.getDay(),target=wd_[k],diff=(target-cur+7)%7||7;
        d=today.getTime()+diff*864e5+9*36e5;
        break;
      }
    }
  }
  if(!d)return null;
  var hm=t.match(/ساعت\\s*([۰-۹0-9]{1,2})(?:[:٫.:]([۰-۹0-9]{1,2}))?\\s*(صبح|بامداد|ظهر|بعدازظهر|عصر|شب)?/);
  if(!hm)hm=t.match(/([۰-۹0-9]{1,2})\\s*(صبح|بامداد|ظهر|بعدازظهر|عصر|شب)/);
  if(hm){
    var hh=+pd(hm[1]),mm=hm[2]?+pd(hm[2]):0,part=hm[3]||'';
    if(part==='عصر'||part==='شب'||part==='بعدازظهر'){if(hh<12)hh+=12}
    else if(part==='ظهر'&&hh<12)hh+=12;
    if(hh>=0&&hh<24&&mm>=0&&mm<60){
      var dd=new Date(d);
      d=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate(),hh,mm,0).getTime();
    }
  }else{
    var dd9=new Date(d); /* بدون ساعت صریح → ۰۹:۰۰ */
    d=new Date(dd9.getFullYear(),dd9.getMonth(),dd9.getDate(),9,0,0).getTime();
  }
  return {ts:d,rec:rec};
};
E28.remDup=function(title,ts){
  var a=S.reminders||[];
  return a.some(function(r){return r&&r.title===title&&Math.abs((r.due||0)-ts)<36e5&&!r.done});
};
E28.remCreate=function(title,when,src,desc,chat){
  var r={id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),
    title:title.slice(0,70),desc:desc||'',due:when.ts,rec:when.rec||'once',
    done:false,status:'open',src:src||'manual',chat:chat||null,
    createdAt:Date.now(),updatedAt:Date.now(),notified:false};
  S.reminders.unshift(r);
  E28.remCap();
  save();E25.profileDirty();
  E28.askNotify();
  return r;
};
E28.remCap=function(){
  try{
    while(S.reminders.length>50){
      var iDone=-1;
      for(var i=0;i<S.reminders.length;i++){if(S.reminders[i].done){iDone=i;break}}
      S.reminders.splice(iDone>=0?iDone:0,1);
      toast('سقف ۵۰ یادآور پر بود؛ قدیمی‌ترین حذف شد.');
    }
  }catch(e){}
};
E28.remAuto=function(nn,raw){
  if(!E21.noFlow())return false;
  var t=normFa(raw||nn);
  if(E28.remPend){
    var w2=E28.remParseWhen(t);
    if(w2){
      usrC(raw);
      var title2=E28.remPend.title;
      if(!title2){
        var t3=E28.remTitleFromText(raw);
        if(t3&&t3.length>2){title2=t3}
        else{E28.remPend.title='';botC('عنوان یادآور چی باشد؟ (یک عبارت کوتاه بنویسید)',null);return true}
      }
      if(!title2){E28.remPend.title='';botC('عنوان یادآور چی باشد؟',null);return true}
      if(E28.remDup(title2,w2.ts)){E28.remPend=null;botC('این یادآور قبلاً ثبت شده است.',null);return true}
      var r2=E28.remCreate(title2,w2,'manual','',E22.restoredId);
      E28.remPend=null;
      E28.remSaved(r2);
      return true;
    }
    if(/انصراف|لغو|بی خیال/.test(t)){usrC(raw);E28.remPend=null;botC('ثبت یادآور لغو شد.',null);return true}
    if(E28.remPend.when&&!w2){
      /* عنوان منتظر است — همین پیام را عنوان بگیر */
      var t4=E28.remTitleFromText(raw);
      if(t4&&t4.length>2){
        usrC(raw);
        if(E28.remDup(t4,E28.remPend.when.ts)){E28.remPend=null;botC('این یادآور قبلاً ثبت شده است.',null);return true}
        var r4=E28.remCreate(t4,E28.remPend.when,'manual','',E22.restoredId);
        E28.remPend=null;E28.remSaved(r4);
        return true;
      }
    }
    return false;
  }
  var intent=/(یادم بنداز|یادم بینداز|یادآور کن|یادآوری کن|به من یادآوری کن|یادآور بگذار|یادم باشه|یادم باشد|یادآور)/.test(t);
  if(!intent)return false;
  usrC(raw);
  var title=E28.remTitleFromText(raw);
  var w=E28.remParseWhen(t);
  if(!w){
    if(title&&title.length>2){
      E28.remPend={title:title};
      botC('برای «'+esc(title)+'» چه زمانی یادآوری کنم؟ (مثلاً «فردا ساعت ۱۰» یا «شنبه» یا «۵ روز دیگر»)',null);
    }else{
      E28.remPend={title:null};
      botC('یادآور چی باشد و چه زمانی؟ (مثلاً «یادم بنداز فردا ساعت ۱۰ تماس با موجر»)',null);
    }
    return true;
  }
  if(!title||title.length<3){E28.remPend={when:w,title:null};botC('عنوان یادآور چی باشد؟',null);return true}
  if(E28.remDup(title,w.ts)){botC('این یادآور قبلاً ثبت شده است.',null);return true}
  if(E28.remPend&&E28.remPend.when){w=E28.remPend.when;E28.remPend=null}
  var r=E28.remCreate(title,w,'manual','',E22.restoredId);
  E28.remSaved(r);
  return true;
};
E28.remSaved=function(r){
  botC(' یادآور ثبت شد — «'+esc(r.title)+'»'+(r.rec!=='once'?(r.rec==='monthly'?' (هر ماه)':' (هر هفته)'):'')+
  rcNote(fd(r.due)+(new Date(r.due).getHours()||new Date(r.due).getMinutes()?' · ساعت '+fa(new Date(r.due).getHours(),0)+':'+fa(new Date(r.due).getMinutes(),0):''))+
  rcActs([{l:'یادآورها',a:'data-cba="remMenu28"'}]),null);
};
E28.remNext=function(r){
  var d=new Date(r.due);
  if(r.rec==='weekly')return new Date(d.getTime()+7*864e5).getTime();
  if(r.rec==='monthly')return new Date(d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),0).getTime();
  return null;
};
E28.remTick=function(){
  var a=S.reminders||[],now=Date.now(),changed=false;
  a.forEach(function(r){
    if(!r||r.done||r.notified)return;
    if((r.due||0)<=now){
      r.notified=true;r.updatedAt=now;changed=true;
      toast('یادآور: '+r.title);
      try{
        if(window.Notification&&Notification.permission==='granted'){
          new Notification('یادآور محلینو',{body:r.title});
        }
      }catch(e){}
      var nx=E28.remNext(r);
      if(nx){
        a.unshift({id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),title:r.title,desc:r.desc||'',due:nx,
          rec:r.rec,done:false,status:'open',src:r.src,chat:r.chat,createdAt:now,updatedAt:now,notified:false});
      }
    }
  });
  if(changed)save();
};
E28.askNotify=function(){
  try{
    if(window.Notification&&Notification.permission==='default'){
      Notification.requestPermission();
    }
  }catch(e){}
};
E28.remListHTML=function(){
  E28.remNorm();
  var a=(S.reminders||[]).slice(),f=E28.remF,now=Date.now(),today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  function chip(k,lab){return '<button class="qbtn'+(f===k?' primary':'')+'" data-cba="remF28" data-v="'+k+'">'+lab+'</button>'}
  var h='<b>دفتر یادآور</b><div class="racts" style="margin:6px 0">'+
  chip('all','همه')+chip('over','گذشته')+chip('today','امروز')+chip('soon','هفتهٔ پیش‌رو')+chip('done','انجام‌شده')+'</div>';
  a=a.filter(function(r){
    if(!r)return false;
    if(f==='done')return r.done;
    if(r.done)return false;
    if(f==='over')return r.due<now;
    if(f==='today')return r.due>=today&&r.due<today+864e5;
    if(f==='soon')return r.due>=today&&r.due<today+8*864e5;
    return true;
  });
  if(!a.length)return h+'<div class="empty" style="margin-top:8px">یادآوری در این فهرست نیست.</div>';
  h+=a.slice(0,12).map(function(r){
    var ov=!r.done&&r.due<now;
    return '<div class="rem28'+(ov?' overdue':'')+(r.done?' done':'')+'">'+
    '<div class="rem28-main"><b>'+esc(r.title)+(r.rec!=='once'?'<span class="rem28-tag">'+(r.rec==='monthly'?'هر ماه':'هر هفته')+'</span>':'')+(r.src==='auto'?'<span class="rem28-tag">خودکار</span>':'')+'</b>'+
    '<small>'+(r.done?'انجام‌شده · ':'')+fd(r.due)+(ov?' · گذشته':'')+(r.desc?' · '+esc(r.desc):'')+'</small></div>'+
    '<div class="rem28-acts">'+
    (r.done?'':'<button type="button" data-cba="remDone28" data-id="'+qesc(r.id)+'" title="انجام شد" aria-label="انجام شد">'+E28.tsv('check',14)+'</button>')+
    (r.done?'':'<button type="button" data-cba="remSnooze28" data-id="'+qesc(r.id)+'" title="یک روز بعد" aria-label="تعویق یک روز">'+E28.tsv('alarm-snooze',14)+'</button>')+
    '<button type="button" data-cba="remEdit28" data-id="'+qesc(r.id)+'" title="ویرایش" aria-label="ویرایش">'+E28.tsv('pencil',14)+'</button>'+
    '<button type="button" data-act="remDel" data-id="'+qesc(r.id)+'" title="حذف" aria-label="حذف">'+E28.tsv('trash',14)+'</button>'+
    '</div></div>';
  }).join('');
  return h;
};
CBACT.remMenu28=function(){
  usrC('دفتر یادآور');
  botC(E28.remListHTML()+
  '<div class="racts"><button class="qbtn primary" data-cba="remAdd28b">یادآور جدید</button></div>',null);
};
CBACT.remF28=function(el){
  E28.remF=el.getAttribute('data-v')||'all';
  var b=document.getElementById('chatB');
  if(b&&b.querySelector('.rem28')){HIST[HIST.length-1]={r:'bot',h:E28.remListHTML()+'<div class="racts"><button class="qbtn primary" data-cba="remAdd28b">یادآور جدید</button></div>',c:null};cr()}
};
CBACT.remAdd28b=function(){
  usrC('یادآور جدید');
  E25.rem={stage:'title',title:null,due:null,amt:null};
  botC('عنوان یادآور را بنویسید. («انصراف» هم می‌توانید بفرستید.)',null);
};
CBACT.remDone28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  r.done=true;r.status='done';r.updatedAt=Date.now();
  var nx=E28.remNext(r);
  if(nx){
    S.reminders.unshift({id:'RM-'+Date.now().toString(36)+Math.floor(Math.random()*99),title:r.title,desc:r.desc||'',due:nx,
      rec:r.rec,done:false,status:'open',src:r.src,chat:r.chat,createdAt:Date.now(),updatedAt:Date.now(),notified:false});
    save();E25.profileDirty();
    botC('انجام شد — دورهٔ بعدی برای '+esc(fd(nx))+' ثبت شد.',null);return;
  }
  save();E25.profileDirty();
  botC('«'+esc(r.title)+'» انجام شد.',null);
};
CBACT.remSnooze28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  r.due+=864e5;r.notified=false;r.updatedAt=Date.now();
  save();E25.profileDirty();
  botC('به '+esc(fd(r.due))+' موکول شد.',null);
};
CBACT.remEdit28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  if(!r)return;
  openModal('<h3>ویرایش یادآور</h3>'+
  '<div class="srow"><div class="slab"><span>عنوان</span></div><input class="inp" id="re28-t" value="'+qesc(r.title)+'" maxlength="70"></div>'+
  '<div class="srow"><div class="slab"><span>توضیح</span></div><input class="inp" id="re28-d" value="'+qesc(r.desc||'')+'" maxlength="140"></div>'+
  '<div class="srow"><div class="slab"><span>سررسید (2026-11-10 یا 2026-11-10 10:30)</span></div><input class="inp" id="re28-w" dir="ltr" style="text-align:left" value="'+qesc(E28.whenStr(r.due))+'"></div>'+
  '<div class="fs-actions" style="margin-top:12px"><button class="btn btn-primary" data-act="remEditOk28" data-id="'+qesc(r.id)+'">ذخیره</button><button class="btn" data-act="closeModal">انصراف</button></div>');
};
E28.whenStr=function(ts){
  var d=new Date(ts),p=function(n){return (n<10?'0':'')+n};
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+(d.getHours()||d.getMinutes()?' '+p(d.getHours())+':'+p(d.getMinutes()):'');
};
ACT.remEditOk28=function(el){
  var r=E28.findRem(el.getAttribute('data-id'));
  var t=document.getElementById('re28-t'),d=document.getElementById('re28-d'),w=document.getElementById('re28-w');
  if(!r||!w){closeModal();return}
  var ts=E21.dateFromText(w.value);
  if(!ts){toast('تاریخ را متوجه نشدم — شکل 2026-11-10');return}
  var hm=String(w.value).match(/([0-9]{1,2}):([0-9]{2})/);
  if(hm){var dd=new Date(ts);ts=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate(),+hm[1],+hm[2],0).getTime()}
  if(t&&t.value.replace(/\\s/g,''))r.title=t.value.slice(0,70);
  if(d)r.desc=d.value.slice(0,140);
  r.due=ts;r.notified=false;r.updatedAt=Date.now();
  E28.remCap();save();E25.profileDirty();
  closeModal();toast('یادآور به‌روز شد');
};

/* ── مسیرهای آزاد جدید: ثبت/فسخ قرارداد ── */
E28.route=function(nn,raw){
  if(!E21.noFlow())return false;
  var t=normFa(raw||nn);
  if(/ثبت قرارداد|قرارداد جدید|اجاره‌نامه|قرارداد اجاره/.test(t)&&!/فسخ/.test(t)){
    usrC(raw);
    var Dr=wd('rent').data;
    if(Dr.listing&&!Dr.signed){E28.ctrStart('rent');return true}
    if(Dr.signed&&Dr.code){botC(' قرارداد <b dir="ltr">'+esc(Dr.code)+'</b> قبلاً ثبت شده است.',null);return true}
    botC('برای ثبت قرارداد، اول در فلوی اجاره یا خرید یک ملک انتخاب کنید.',[['شروع اجاره','data-cf="rent"']]);
    return true;
  }
  if(/فسخ قرارداد|لغو قرارداد|تخلیه هوشمند|تخلیهٔ هوشمند/.test(t)){
    usrC(raw);
    var D2=wd('rent').data;
    if(D2.code&&D2.signed){
      if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
      ceJump('termq');
      return true;
    }
    var c=null,i;
    for(i=0;i<(S.contracts||[]).length;i++){if(S.contracts[i].kind==='rent'){c=S.contracts[i];break}}
    if(!c){botC('قرارداد فعالی ثبت نشده است؛ بعد از امضای قرارداد در فلوی اجاره، فسخ همین‌جا قابل انجام است.',[['شروع اجاره','data-cf="rent"']]);return true}
    if(c.status==='terminated'){botC('این قرارداد قبلاً فسخ شده است.',null);return true}
    D2.code=c.code;D2.signed=true;save();
    if(CE.f!=='rent'){CE.f='rent';CE.i=0;CE.li=0;CE.hist=[]}
    ceJump('termq');
    return true;
  }
  return false;
};

/* ── به‌روزرسانی ppmTick برای یادآورها ── */
var _oPpm28=ppmTick;
ppmTick=function(){
  _oPpm28();
  try{E28.remTick()}catch(e){}
};

E28.init=function(){
  try{E28.remNorm()}catch(e){}
  var cin=document.getElementById('chatIn');
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.classList&&t.classList.contains('cwr-in')){
      t.style.height='auto';
      var h=Math.min(200,t.scrollHeight);
      t.style.height=h+'px';
    }
  });
};

/* رهگیری متن آزاد: یادآور خودکار + مسیرهای قرارداد — بالاتر از موتورهای قبلی */
var _oCeSend28=ceSend;
ceSend=function(t){
  if(String(t)==='!back'){_oCeSend28(t);return}
  try{if(E28.route(String(t).replace(/^\\s+|\\s+$/g,''),t))return}catch(e){}
  try{if(E28.remAuto(String(t).replace(/^\\s+|\\s+$/g,''),t))return}catch(e){}
  _oCeSend28(t);
};

/* ═══ ۲۲) راه‌اندازی ═══ */`);

/* boot: E28.init قبل از رندر */
rep(`    try{if(localStorage.getItem('mahalino_sidefold')==='1')document.body.classList.add('sidefold')}catch(e){}
    renderSidebar();renderTok();`,
`    try{if(localStorage.getItem('mahalino_sidefold')==='1')document.body.classList.add('sidefold')}catch(e){}
    try{E28.init()}catch(e){}
    renderSidebar();renderTok();`);

/* ══════════════════════════════════════════════════════════════════
 * write
 * ══════════════════════════════════════════════════════════════════ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
