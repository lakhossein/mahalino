/* V0.31 — money range normalization. A suffix on either side can describe
   both endpoints, but two explicitly different magnitude words must remain
   distinct. Never determine currency from the size of a computed amount. */
function parseMoneyRangeFA(input){
  var t=normFa(String(input||'')).replace(/\u200c/g,' ').trim();
  var toman=/تومان|تومن/.test(t),rialUnit=/ریال/.test(t);
  if(toman&&rialUnit)return {ok:false,msg:'در یک بازه از یک واحد پول استفاده کنید: تومان یا ریال.'};
  var between=/^\s*بین\b/.test(t)||/^\s*بین\s/.test(t);
  var body=t.replace(/^\s*(?:بین|از)\s+/,'').replace(/\b(?:حدود|تقریبا|تقریباً)\b/g,' ').trim();
  var parts,canonical=/^\d+\s*\|\s*\d+$/.test(body);
  // Preset UI chips already carry two explicit rial endpoints separated by |.
  // Normalize them through the same validation as typed ranges.
  if(/^\d+\s*\|\s*\d+$/.test(body))parts=body.split(/\s*\|\s*/);
  else if(/\s+(?:تا|الی)\s+/.test(body))parts=body.split(/\s+(?:تا|الی)\s+/);
  else if(/\s*[-–—]\s*/.test(body))parts=body.split(/\s*[-–—]\s*/);
  else if(between&&/\s+و\s+/.test(body))parts=body.split(/\s+و\s+/);
  if(!parts||parts.length!==2)return {ok:false,msg:'بازه را به شکل «۴۰۰ تا ۵۵۰ میلیون تومان» یا «۱ میلیارد تا ۵۰۰ میلیون تومان» وارد کنید.'};
  function magnitude(s){
    if(/میلیارد/.test(s))return 1e9;
    if(/میلیون/.test(s))return 1e6;
    if(/هزار/.test(s))return 1e3;
    return 0;
  }
  var m0=magnitude(parts[0]),m1=magnitude(parts[1]),inherited=m1||m0;
  function endpoint(s,explicit){
    var cleaned=s.replace(/تومان|تومن|ریال/g,' ').replace(/^(?:حداقل|حداکثر|حدود)\s*/,' ').trim();
    var p=parseNumberWords(cleaned);
    if(!p.ok)return NaN;
    var v=Number(p.value);
    if(!explicit&&inherited&&v<1e6)v*=inherited;
    /* parseNumberWords already evaluates explicit million/billion words. */
    if(!rialUnit&&!canonical&&!MONEY_INPUT_CANONICAL)v*=10;
    return v;
  }
  var lo=endpoint(parts[0],m0),hi=endpoint(parts[1],m1);
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo<=0||hi<=0||
      !Number.isSafeInteger(Math.round(lo))||!Number.isSafeInteger(Math.round(hi))){
    return {ok:false,msg:'بازه یا واحد پول معتبر نیست؛ دو مبلغ مثبت با مرتبهٔ روشن وارد کنید.'};
  }
  lo=Math.round(lo);hi=Math.round(hi);
  return {ok:true,value:Math.min(lo,hi)+'|'+Math.max(lo,hi),
    note:'✓ بازهٔ مبلغ: '+rial(Math.min(lo,hi))+' تا '+rial(Math.max(lo,hi)),unit:rialUnit||canonical?'rial':'toman'};
}