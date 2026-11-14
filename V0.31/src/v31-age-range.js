/* Age preferences accept a new building, upper bound, range, or explicit skip. */
function parseAgeRangeFA(input){
  var t=normFa(String(input||'')).trim();
  if(/^(?:مهم نیست|هرچه|هر چی|رد|رد کردن)$/.test(t))return {ok:true,value:'0|100',skip:true};
  if(/^(?:نوساز|فقط نوساز)$/.test(t))return {ok:true,value:'0|3'};
  var clean=t.replace(/ساله|سال|ساخت|عمر|بنا|حداکثر|حداقل/g,' ').trim(),r=parseRangeFA(clean);
  if(r.ok){var a=r.value.split('|').map(Number);if(a.length===2&&a.every(function(n){return Number.isFinite(n)&&n>=0&&n<=100})&&a[0]<=a[1])return r}
  var c=parseCountFA(clean.replace(/^تا\s+/,''));
  if(c.ok&&c.value>=0&&c.value<=100)return {ok:true,value:'0|'+c.value};
  return {ok:false,msg:'عمر بنا را مانند «نوساز»، «تا ۵ سال»، «۵ تا ۱۰ سال» یا «مهم نیست» بنویسید.'};
}
