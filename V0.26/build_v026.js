/* Build Mahalino+V0.26 from V0.25 — Product maturity (focus trap, data reliability, security sweep, mobile).
 * Assert-per-replacement, in-place pattern. Replacement snippets defined in build_steps (see bottom).
 * NOTE: the steps are appended by the implementation via edit; this file currently contains the skeleton. */
const fs = require('fs');
const path = require('path');

const UI = path.join('H:', 'My Drive', 'Work', 'پروپوزال‌ها', 'محلینو پلاس', 'UI');
const V26 = path.join(UI, 'Mahalino', 'V0.26');
const SRC_FILE = path.join(UI, 'Mahalino', 'V0.25', 'Mahalino+V0.25.html');
const OUT_FILE = path.join(V26, 'Mahalino+V0.26.html');

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

/* ═══ STEP-1: version marker (anchored; extended by implementation) ═══ */
rep('/* ═══ محلینو — V0.25 (گسترش محصول املاک) — بر پایهٔ V0.24 ═══',
    '/* ═══ محلینو — V0.26 (بلوغ محصول) — بر پایهٔ V0.25 ═══');

/* ═══ STEP-2: maturity init block (E26) before boot marker ═══ */
rep('/* ═══ ۲۲) راه‌اندازی ═══ */',
`/* ═══ ۲۱.۸) بلوغ محصول (E26) — تلهٔ فوکوس، ترمیم داده، سقف یادآور ═══
   فوکوس‌تلهٔ مودال (M1): */
var E26={t:0};
E26.toastErr=function(m){var n=Date.now();if(n-E26.t<15000)return;E26.t=n;try{toast(m)}catch(e){}};
E26.trapKey=function(e){
  if(e.key!=='Tab')return;
  var m=document.querySelector('#modal-root.on');
  if(!m)return;
  var f=m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
  if(!f.length)return;
  var first=f[0],last=f[f.length-1],cur=document.activeElement;
  if(e.shiftKey&&(cur===first||(cur&&!m.contains(cur)))){e.preventDefault();try{last.focus()}catch(x){}}
  else if(!e.shiftKey&&(cur===last||!cur||!m.contains(cur))){e.preventDefault();try{first.focus()}catch(x){}}
};
try{document.addEventListener('keydown',E26.trapKey)}catch(e){}
/* ترمیم شکل داده (M2): */
try{
  ['chats','reminders','wfs','reqs','contracts','grt'].forEach(function(k){
    if(S[k]!==undefined&&!Array.isArray(S[k])){console.warn('state repair: '+k+' → []');S[k]=[]}
  });
  if(!S.chats)S.chats=[];
  if(!S.reminders)S.reminders=[];
  S.v=26;
}catch(e){}
/* سقف یادآور ۵۰ (M2): */
E25&&(E25.remCap=function(){
  try{
    while(S.reminders.length>50){
      var iDone=-1;
      for(var i=0;i<S.reminders.length;i++){if(S.reminders[i].done){iDone=i;break}}
      S.reminders.splice(iDone>=0?iDone:0,1);
      E26.toastErr('سقف ۵۰ یادآور پر بود؛ قدیمی‌ترین حذف شد.');
    }
  }catch(e){}
});
try{E25&&E25.remCap&&E25.remCap()}catch(e){}
/* ═══ ۲۲) راه‌اندازی ═══ */`);

/* ═══ M3/M5 — Security & consistency sweep (appended by implementation) ═══
   M3 audit verdict (summary): E21–E25 engine echo sites verified escaped — attchip/attcard/trayErr
   esc(it.name)/esc(it.msg)+qesc(it.id), CORR echo esc(fieldLabel/hood), slot-extract esc(hood/persona),
   grt/svc mini-flow echoes esc, enNorm→usrC esc, restoreUserText esc(raw), E22 sess titles esc + filter
   value qesc, E23 rcConfirm numeric + esc'd statics, duel esc(a.n/b.n), E25 reminder rows/profile card/
   confirm panel esc(title/due/amount) + brief esc(kind/hood/names), csvPreview cells h:esc + data-v:qesc,
   req.detail/termTpl/contractDocHTML/svc order address esc at all render sites.
   Real gaps fixed below: esc() (بدون گریزِ کوتیشن) داخل value="..." دو-نقل‌قولی برای متنِ
   قابل‌ویرایشِ کاربر — esc→qesc در ۸ سایت. لینک‌های بیرونی: ۳ لینک انتساب OSM فقط rel="noopener"
   داشتند — noreferrer اضافه شد. M5: هیچ #fff/rgba(255,255,255 هاردکد در استایل درون‌خطی JS
   موتورها نیست؛ خروجی‌های پولی E23/E25 با rial()/fa() است (نمونه‌گیری: تبدیل، کمیسیون، یادآور). */

/* M3-fix 1: عنوان مکان (ورودی کاربر) — openPlaceModal */
rep('id="pl-label" aria-label="عنوان مکان" value="\'+esc(p.label||\'\')+\'"',
    'id="pl-label" aria-label="عنوان مکان" value="\'+qesc(p.label||\'\')+\'"');

/* M3-fix 2/3: دلیل و تاریخ دستی فسخ (ورودی کاربر) */
rep('id="treasontxt" placeholder="یا دستی بنویسید..." style="margin-top:8px" value="\'+esc(T.rtxt||\'\')+\'"',
    'id="treasontxt" placeholder="یا دستی بنویسید..." style="margin-top:8px" value="\'+qesc(T.rtxt||\'\')+\'"');
rep('id="tdatetxt" placeholder="یا دستی بنویسید" style="margin-top:8px" value="\'+esc(T.dtxt||\'\')+\'"',
    'id="tdatetxt" placeholder="یا دستی بنویسید" style="margin-top:8px" value="\'+qesc(T.dtxt||\'\')+\'"');

/* M3-fix 4: نام دارایی تأمین بودجه (ورودی کاربر) */
rep('data-ask="n" value="\'+esc(a.n)+\'"',
    'data-ask="n" value="\'+qesc(a.n)+\'"');

/* M3-fix 5/6: شهر و تاریخ سفر اقامتگاه (ورودی کاربر) */
rep('id="st-city" placeholder="تهران / شیراز / رامسر" value="\'+esc(D.city)+\'"',
    'id="st-city" placeholder="تهران / شیراز / رامسر" value="\'+qesc(D.city)+\'"');
rep('id="st-date" placeholder="۱۴۰۴/۰۳/۱۵ یا «آخر هفته»" value="\'+esc(D.date)+\'"',
    'id="st-date" placeholder="۱۴۰۴/۰۳/۱۵ یا «آخر هفته»" value="\'+qesc(D.date)+\'"');

/* M3-fix 7/8: نام و موبایل حساب کاربری (قابل‌ویرایش) */
rep('id="pf-name" aria-label="نام" value="\'+esc(S.auth.name)+\'"',
    'id="pf-name" aria-label="نام" value="\'+qesc(S.auth.name)+\'"');
rep('value="\'+esc(S.auth.phone)+\'" dir="ltr" readonly',
    'value="\'+qesc(S.auth.phone)+\'" dir="ltr" readonly');

/* M3b-fix: لینک‌های بیرونی (انتساب OSM) — noreferrer */
rep('target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    'target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors', 2);
rep('target="_blank" rel="noopener">OpenStreetMap</a>\'}',
    'target="_blank" rel="noopener noreferrer">OpenStreetMap</a>\'}');

/* ═══ additional M-steps are appended above by the implementation ═══ */

/* ═══ write ═══ */
fs.writeFileSync(OUT_FILE, src, 'utf8');
console.log('\nWrote ' + OUT_FILE);
console.log('replacements: ' + applied);
