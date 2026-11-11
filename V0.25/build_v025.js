/* Build Mahalino+V0.25 from V0.24 — Product expansion (commission calc, reminder ledger, education scenarios).
 * Assert-per-replacement. Delta JS read from Mahalino/V0.25/v025-product.js (must exist before build). */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V25 = path.join(UI, 'Mahalino', 'V0.25');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.24', 'Mahalino+V0.24.html');
const OUT_FILE = path.join(V25, 'Mahalino+V0.25.html');
const JS_FILE = path.join(V25, 'v025-product.js');

if (fs.existsSync(OUT_FILE)) { console.error('ABORT: output exists'); process.exit(1); }
if (!fs.existsSync(JS_FILE)) { console.error('ABORT: v025-product.js missing — implement the product workstream first'); process.exit(1); }
const S25_JS = fs.readFileSync(JS_FILE, 'utf8');

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
rep('/* ═══ محلینو — V0.24 (اعتمادپذیری و کارایی) — بر پایهٔ V0.23 ═══',
    '/* ═══ محلینو — V0.25 (گسترش محصول املاک) — بر پایهٔ V0.24 ═══');

/* ═══ 2) product engine (E25) — before boot marker ═══ */
rep('/* ═══ ۲۲) راه‌اندازی ═══ */',
    S25_JS + '\n/* ═══ ۲۲) راه‌اندازی ═══ */');

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
