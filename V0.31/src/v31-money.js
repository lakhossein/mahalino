/* Storage schema 1 retains historical rial minor units. All public input and
   formatting uses toman. No load-time scaling: repeated restore is idempotent. */
var MONEY_INPUT_CANONICAL=false;
function moneyCanonical(fn){var prior=MONEY_INPUT_CANONICAL;MONEY_INPUT_CANONICAL=true;try{return fn()}finally{MONEY_INPUT_CANONICAL=prior}}
function parseMoneyFA(input){
  var t=normFa(String(input==null?'':input));
  if(!t)return {ok:false,msg:'مبلغ را وارد کنید.'};
  var toman=/تومان|تومن/.test(t),hasRial=/ریال/.test(t);
  if(toman&&hasRial)return {ok:false,msg:'در یک مبلغ فقط یک واحد پول بنویسید.'};
  var clean=t.replace(/تومان|تومن|ریال/g,' ').replace(/حدود|تقریبا|تقریباً|حداقل|حداکثر|مبلغ/g,' ').trim();
  if(/بین\s|\sتا\s|\sالی\s|[0-9]\s*[-–—]\s*[0-9]/.test(clean))return {ok:false,msg:'یک مبلغ مشخص بنویسید؛ برای بازه از فیلد بازه استفاده کنید.'};
  var p=parseNumberWords(clean),unit=hasRial||(!toman&&MONEY_INPUT_CANONICAL)?'rial':'toman';
  var value=p.value*(unit==='rial'?1:10);
  if(!p.ok||!Number.isFinite(value)||value<=0||!Number.isSafeInteger(Math.round(value)))return {ok:false,msg:'مبلغ مثبت و معتبر وارد کنید؛ واحد پیش‌فرض تومان است.'};
  return {ok:true,value:Math.round(value),unit:unit,note:'✓ مبلغ: '+rial(Math.round(value))};
}
function moneyChip(el){
  var value=el.getAttribute('data-cv'),sc=SCRIPTS[CE.f],st=sc&&sc[CE.i];
  if(st&&st.money&&/^\d+$/.test(value))return value+' ریال';
  return value;
}