/* Build Mahalino+V0.22 from V0.21 — UX excellence (dark mode, conversation history, composer feedback, focus).
 * Assert-per-replacement. Delta JS read from Mahalino/V0.22/v022-ux.js (must exist before build);
 * delta CSS read from Mahalino/V0.22/v022-ux.css. */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V22 = path.join(UI, 'Mahalino', 'V0.22');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.21', 'Mahalino+V0.21.html');
const OUT_FILE = path.join(V22, 'Mahalino+V0.22.html');
const CSS_FILE = path.join(V22, 'v022-ux.css');
const JS_FILE = path.join(V22, 'v022-ux.js');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists'); process.exit(1); }
if (!fs.existsSync(JS_FILE)) { console.error('ABORT: v022-ux.js missing — implement the UX workstream first'); process.exit(1); }
if (!fs.existsSync(CSS_FILE)) { console.error('ABORT: v022-ux.css missing'); process.exit(1); }
const UX_CSS = fs.readFileSync(CSS_FILE, 'utf8');
const UX_JS = fs.readFileSync(JS_FILE, 'utf8');

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

/* ═══ 1) version marker ═══ */
rep('/* ═══ محلینو — V0.21 (conversational-first) — بر پایهٔ V0.19/V0.20 ═══',
    '/* ═══ محلینو — V0.22 (UX excellence: تاریک/تاریخچه/بازخورد/فوکوس) — بر پایهٔ V0.21 ═══');

/* ═══ 2) UX CSS delta (after Agent C block, before the V0.19 marker) ═══ */
rep('/* ─── V0.19: contextual help, source badges, dashboard dock ─── */',
    UX_CSS + '\n/* ─── V0.19: contextual help, source badges, dashboard dock ─── */');

/* ═══ 3) UX engine (E22: theme, sessions, busy states, focus) — before boot marker ═══ */
rep('/* ═══ ۲۲) راه‌اندازی ═══ */',
    UX_JS + '\n/* ═══ ۲۲) راه‌اندازی ═══ */');

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
