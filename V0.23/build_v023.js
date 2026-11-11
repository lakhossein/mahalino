/* Build Mahalino+V0.23 from V0.22 — Assistant scenario completion (research-fed scenarios, triggers, loop fix).
 * Assert-per-replacement. Delta JS read from Mahalino/V0.23/v023-scenarios.js (must exist before build). */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V23 = path.join(UI, 'Mahalino', 'V0.23');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.22', 'Mahalino+V0.22.html');
const OUT_FILE = path.join(V23, 'Mahalino+V0.23.html');
const JS_FILE = path.join(V23, 'v023-scenarios.js');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists'); process.exit(1); }
if (!fs.existsSync(JS_FILE)) { console.error('ABORT: v023-scenarios.js missing — implement the scenarios workstream first'); process.exit(1); }
const S23_JS = fs.readFileSync(JS_FILE, 'utf8');

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
rep('/* ═══ محلینو — V0.22 (UX excellence: تاریک/تاریخچه/بازخورد/فوکوس) — بر پایهٔ V0.21 ═══',
    '/* ═══ محلینو — V0.23 (تکمیل سناریوهای دستیار) — بر پایهٔ V0.22 ═══');

/* ═══ 2) scenarios engine (E23) — before boot marker ═══ */
rep('/* ═══ ۲۲) راه‌اندازی ═══ */',
    S23_JS + '\n/* ═══ ۲۲) راه‌اندازی ═══ */');

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
