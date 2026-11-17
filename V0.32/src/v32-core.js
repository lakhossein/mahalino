/* ═══════════════ V0.32 — E30 CORE: state defaults, Bana pricing, unified payment FSM ═══════════════
   Payment lifecycle (spec V0.32 §11.2) — a service payment is ALWAYS in exactly one state:
   idle → selected → priced → presented → awaiting_confirm → confirmed → validating
        → processing → paid → executing → completed
   with exits: declined / insufficient / failed / refunded. The state never becomes ambiguous:
   the live session lives in S.paySession (persisted); a superseding begin() or an explicit
   cancel/backdrop-close/ESC always resolves it; on boot an orphaned paid-but-not-executed
   session is auto-refunded (§11.6). Duplicate clicks are impossible: only state 'presented'
   accepts go(); the button disables itself on first click.
   ═══════════════ */
window.E30={VER:'0.32'};
E30.uid=function(p){return (p||'E30')+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e5).toString(36)};
E30.chatRef=function(){
  var legacy=(window.E29&&E29.chatRef)?E29.chatRef():{chatId:null,chatTitle:'گفت‌وگوی جاری'};
  if(legacy.chatId)return legacy;
  if(!S.ctx30ActiveKey)S.ctx30ActiveKey='live:'+E30.uid('CTX');
  return {chatId:S.ctx30ActiveKey.replace(/^chat:/,''),chatTitle:legacy.chatTitle||'گفت‌وگوی جاری'};
};

/* ── centralized Bana pricing (single source — spec §17.1) ──
   Every service reads cost/label/desc from here for: display, confirmation card,
   balance deduction, transaction record and library metadata. */
E30.PRICING={
  hood_detail :{cost:40, label:'تحلیل جامع محله',        desc:'گزارش جامع بازار، دسترسی‌ها و تناسب یک محله', cx:'high',  refund:'failed_only'},
  hood_compare:{cost:40, label:'مقایسهٔ جامع دو محله',    desc:'مقایسهٔ کنارهم دو محله در همهٔ شاخص‌ها',        cx:'high',  refund:'failed_only'},
  valuation   :{cost:40, label:'تخمین ارزش ملک',         desc:'برآورد ارزش با دادهٔ نمونهٔ سامانه',            cx:'high',  refund:'failed_only'},
  /* No real personalized investment engine or document reader is connected to
     this static demo. Never charge Bana for a prewritten/sample-only result. */
  invest_probe:{cost:0, label:'خلاصهٔ نمایشی سرمایه‌گذاری', desc:'تحلیل نمونهٔ رایگان؛ بدون دادهٔ شخصی‌سازی‌شدهٔ قابل اتکا', cx:'high', refund:'failed_only'},
  legal       :{cost:100,label:'گزارش حقوقی ملک',         desc:'بررسی وضعیت سند و مسیر انتقال',               cx:'high',  refund:'failed_only'},
  contract_draft:{cost:60,label:'تنظیم و ثبت قرارداد',     desc:'پیش‌نویس و ثبت قرارداد داخلی',                 cx:'high',  refund:'failed_only'},
  term_ai     :{cost:0, label:'چک‌لیست نمونهٔ فسخ', desc:'راهنمای عمومی رایگان؛ بدون خواندن یا تحلیل فایل سند', cx:'high', refund:'failed_only'},
  detail      :{cost:10, label:'اطلاعات کامل آگهی',        desc:'نمایش جزئیات کامل یک آگهی',                   cx:'low',   refund:'failed_only'},
  visit       :{cost:20, label:'ثبت درخواست بازدید',       desc:'ارسال درخواست بازدید به مالک',                cx:'low',   refund:'failed_only'},
  bid         :{cost:20, label:'ثبت پیشنهاد پروژه',        desc:'ارسال پیشنهاد در پروژه‌ها',                    cx:'low',   refund:'failed_only'},
  stay        :{cost:30, label:'رزرو اقامتگاه',            desc:'ثبت رزرو امانی اقامتگاه',                     cx:'low',   refund:'failed_only'},
  escrow      :{cost:150,label:'تسویهٔ امانی',              desc:'آزادسازی مرحله‌ای از حساب امانی',              cx:'high',  refund:'failed_only'}
};
/* keep legacy COSTS/COSTL mirrors in sync so unpatched legacy code agrees */
try{Object.keys(E30.PRICING).forEach(function(k){COSTS[k]=E30.PRICING[k].cost;if(E30.PRICING[k].label)COSTL[k]=E30.PRICING[k].label})}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('v32-core.js:40',e,'caught');}
E30.price=function(key){var p=E30.PRICING[key];return p?p.cost:(COSTS[key]!==undefined?COSTS[key]:0)};
E30.label=function(key){var p=E30.PRICING[key];return p?p.label:(COSTL[key]||key)};

/* ── in-flight guard (module-level; session itself is persisted) ── */
E30._lock=0;

/* @mahalino:v32-payment-js */
