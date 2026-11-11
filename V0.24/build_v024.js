/* Build Mahalino+V0.24 from V0.23 — Engineering Excellence (R1–R5): cr() visible-only rendering,
 * findH dedupe, save() honest failure, delegation error boundaries, boot state guards.
 * Assert-per-replacement. All replacement snippets INLINE (no separate engine file this cycle). */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V24 = path.join(UI, 'Mahalino', 'V0.24');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.23', 'Mahalino+V0.23.html');
const OUT_FILE = path.join(V24, 'Mahalino+V0.24.html');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists'); process.exit(1); }

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

const TOAST_ERR = 'یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.';

/* ═══ 1) version marker ═══ */
rep("/* ═══ محلینو — V0.23 (تکمیل سناریوهای دستیار) — بر پایهٔ V0.22 ═══",
    "/* ═══ محلینو — V0.24 (اعتمادپذیری و کارایی) — بر پایهٔ V0.23 ═══");

/* ═══ 2) R1 — cr(): skip bodies not currently visible (offsetParent null ⇐ .view/.fchw display:none) ═══ */
rep("  [{el:document.getElementById('chatB')},{el:document.getElementById('fchB')},{el:document.getElementById('dashB')}].forEach(function(b){\n    if(!b.el){return}",
    "  [{el:document.getElementById('chatB')},{el:document.getElementById('fchB')},{el:document.getElementById('dashB')}].forEach(function(b){\n    if(!b.el||!b.el.offsetParent){return} /* V0.24/R1: بدنهٔ پنهان رندر نمی‌شود؛ هنگام نمایان‌شدن، go()/toggleF دوباره cr() می‌خوانند */");

/* ═══ 3) R2 — findH dedupe: delete the SECOND identical definition (hoisted; identical body) ═══ */
rep("function affordSpan(budget){return [Math.round(budget/marketMax()),Math.round(budget/marketMin())]}\nfunction findH(id){var i;for(i=0;i<HOODS.length;i++){if(HOODS[i].id===id)return HOODS[i]}return HOODS[0]}\nfunction llDist(a,b){return Math.abs(a[0]-b[0])*111+Math.abs(a[1]-b[1])*85}",
    "function affordSpan(budget){return [Math.round(budget/marketMax()),Math.round(budget/marketMin())]}\nfunction llDist(a,b){return Math.abs(a[0]-b[0])*111+Math.abs(a[1]-b[1])*85}");

/* ═══ 4) R3 — save(): honest failure (console + rate-limited toast, never throws) ═══ */
rep("function save(){try{localStorage.setItem(LSKEY,JSON.stringify(S))}catch(e){}}",
    "function save(){try{localStorage.setItem(LSKEY,JSON.stringify(S))}catch(e){console.error('save failed',e);if(window.E24)E24.toastErr('ذخیره‌سازی محلی ناموفق بود؛ تغییرات تا بازنشانی صفحه در همین نشست اعمال است.')}}");

/* ═══ 5) R4 — delegation error boundaries: wrap each handler invocation; branch/return structure unchanged ═══ */
rep("  el=t.closest('[data-cv]');\n  if(el){\n    var lab=(el.textContent||'').replace(/^\\s+|\\s+$/g,'');\n    usrC(lab);\n    ceVal(el.getAttribute('data-cv'));\n    return;\n  }",
    "  el=t.closest('[data-cv]');\n  if(el){\n    var lab=(el.textContent||'').replace(/^\\s+|\\s+$/g,'');\n    usrC(lab);\n    try{ceVal(el.getAttribute('data-cv'))}catch(err){console.error('ceVal',err);E24.toastErr('" + TOAST_ERR + "')}\n    return;\n  }");
rep("  el=t.closest('[data-cq]');\n  if(el){\n    ceSend(el.getAttribute('data-cq'));\n    return;\n  }",
    "  el=t.closest('[data-cq]');\n  if(el){\n    try{ceSend(el.getAttribute('data-cq'))}catch(err){console.error('ceSend',err);E24.toastErr('" + TOAST_ERR + "')}\n    return;\n  }");
rep("  el=t.closest('[data-cf]');\n  if(el){\n    usrC((el.textContent||'').replace(/^\\s+|\\s+$/g,''));\n    ceStart(el.getAttribute('data-cf'));\n    return;\n  }",
    "  el=t.closest('[data-cf]');\n  if(el){\n    usrC((el.textContent||'').replace(/^\\s+|\\s+$/g,''));\n    try{ceStart(el.getAttribute('data-cf'))}catch(err){console.error('ceStart',err);E24.toastErr('" + TOAST_ERR + "')}\n    return;\n  }");
rep("  el=t.closest('[data-cba]');\n  if(el){\n    var f2=CBACT[el.getAttribute('data-cba')];\n    if(f2){f2(el)}\n    return;\n  }",
    "  el=t.closest('[data-cba]');\n  if(el){\n    var f2=CBACT[el.getAttribute('data-cba')];\n    if(f2){try{f2(el)}catch(err){console.error('CBACT['+el.getAttribute('data-cba')+']',err);E24.toastErr('" + TOAST_ERR + "')}}\n    return;\n  }");
rep("  el=t.closest('[data-w]');\n  if(el){\n    wizardNav(el.getAttribute('data-m'),el.getAttribute('data-w'));\n    return;\n  }",
    "  el=t.closest('[data-w]');\n  if(el){\n    try{wizardNav(el.getAttribute('data-m'),el.getAttribute('data-w'))}catch(err){console.error('wizardNav',err);E24.toastErr('" + TOAST_ERR + "')}\n    return;\n  }");
rep("  el=t.closest('[data-jump]');\n  if(el){\n    jumpTo(el.getAttribute('data-m'),+el.getAttribute('data-jump'));\n    return;\n  }",
    "  el=t.closest('[data-jump]');\n  if(el){\n    try{jumpTo(el.getAttribute('data-m'),+el.getAttribute('data-jump'))}catch(err){console.error('jumpTo',err);E24.toastErr('" + TOAST_ERR + "')}\n    return;\n  }");
rep("  el=t.closest('[data-act]');\n  if(el){\n    var f=ACT[el.getAttribute('data-act')];\n    if(f){f(el,e)}\n    return;\n  }",
    "  el=t.closest('[data-act]');\n  if(el){\n    var f=ACT[el.getAttribute('data-act')];\n    if(f){try{f(el,e)}catch(err){console.error('ACT['+el.getAttribute('data-act')+']',err);E24.toastErr('" + TOAST_ERR + "')}}\n    return;\n  }");
rep("  el=t.closest('[data-view]');\n  if(el){go(el.getAttribute('data-view'))}",
    "  el=t.closest('[data-view]');\n  if(el){try{go(el.getAttribute('data-view'))}catch(err){console.error('go',err);E24.toastErr('" + TOAST_ERR + "')}}");

/* ═══ 6) R5 + R4-global — E24 engine (toast rate-limit, window error handler, state guards) before boot ═══ */
rep("/* ═══ ۲۲) راه‌اندازی ═══ */",
    "/* ═══ E24 — اعتمادپذیری (V0.24): توست خطای نرخ‌محدود، گارد خطای سراسری، گاردهای وضعیت ═══ */\nvar E24={t:0};\nE24.toastErr=function(m){var n=Date.now();if(n-E24.t<15000)return;E24.t=n;try{toast(m)}catch(e){}};\ntry{window.addEventListener('error',function(e){try{console.error('runtime:',e&&e.message);E24.toastErr('" + TOAST_ERR + "')}catch(x){}})}catch(e){};\ntry{S.ui=S.ui||{};if(!S.chats)S.chats=[];}catch(e){};\n/* ═══ پایان E24 ═══ */\n\n/* ═══ ۲۲) راه‌اندازی ═══ */");

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
