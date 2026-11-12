/* Building age accepts zero (new), an upper bound, a range, or an explicit skip. */
function parseAgeRangeFA(input){
  var t=normFa(String(input||'')).trim();
  if(/^(?:مهم نیست|هرچه|هر چی|رد|رد کردن)$/.test(t))return {ok:true,value:'0|100',skip:true};
  if(/^(?:نوساز|فقط نوساز)$/.test(t))return {ok:true,value:'0|3'};
  var clean=t.replace(/سال|ساله|ساخت|عمر|بنا|حداکثر|حداقل/g,' ').trim();
  var range=parseRangeFA(clean);
  if(range.ok){var p=range.value.split('|').map(Number);if(p.length===2&&p.every(function(n){return Number.isFinite(n)&&n>=0&&n<=100})&&p[0]<=p[1])return range}
  var count=parseCountFA(clean.replace(/^تا\s+/,''));
  if(count.ok&&count.value>=0&&count.value<=100)return {ok:true,value:'0|'+count.value};
  return {ok:false,msg:'عمر بنا را مانند «نوساز»، «تا ۵ سال»، «۵ تا ۱۰ سال» یا «مهم نیست» بنویسید.'};
}
