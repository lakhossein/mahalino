
/* ═══ ۱) ابزار ═══ */
function $(s){return document.querySelector(s)}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function fa(n,d){if(d===undefined)d=0;n=Number(n);if(isNaN(n))n=0;return n.toLocaleString('fa-IR',{maximumFractionDigits:d})}
function rial(v){return fa(Number(v)/10,Number(v)%10?1:0)+' تومان'}
function dt(t){try{return new Date(t).toLocaleDateString('fa-IR',{month:'long',day:'numeric'})}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:7',e,'caught');return ''}}
function fd(t){try{return new Date(t).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'})}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:8',e,'caught');return ''}}
function dateFa(v){if(!v)return '—';var n=(typeof v==='number')?v:Date.parse(v);return isNaN(n)?String(v):fd(n)}
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function qesc(t){return esc(t).replace(/"/g,'&quot;')}
var PD={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
function pd(s){return String(s).replace(/[۰-۹]/g,function(c){return PD[c]})}
/* ═══ ۱.۵) فهم زبان طبیعی ═══ */
var NUM_WORDS={'یک':1,'یه':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'شیش':6,'هفت':7,'هشت':8,'نه':9,'ده':10,'یازده':11,'دوازده':12,'سیزده':13,'چهارده':14,'پانزده':15,'شانزده':16,'هفده':17,'هجده':18,'نوزده':19,'بیست':20,'سی':30,'چهل':40,'پنجاه':50,'شصت':60,'هفتاد':70,'هشتاد':80,'نود':90,'صد':100,'دویست':200,'سیصد':300,'چهارصد':400,'پانصد':500,'ششصد':600,'هفتصد':700,'هشتصد':800,'نهصد':900};
var NUM_MULT={'هزار':1e3,'میلیون':1e6,'میلیارد':1e9};
function normFa(s){
  return String(s==null?'':s)
    .replace(/[۰-۹]/g,function(c){return PD[c]})
    .replace(/[٠-٩]/g,function(c){return String(c.charCodeAt(0)-1632)})
    .replace(/[،٬,]/g,'')
    .replace(/٫/g,'.')
    .replace(/ي/g,'ی').replace(/ك/g,'ک')
    .replace(/\u200c/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function parseNumberWords(input){
  var t=normFa(input).replace(/ و /g,' ');
  if(!t)return {ok:false};
  if(/^-?\d+(\.\d+)?$/.test(t))return {ok:true,value:parseFloat(t),used:false,multi:false};
  var parts=t.split(' ').filter(Boolean),total=0,current=0,used=false,multi=false,i,w;
  for(i=0;i<parts.length;i++){
    w=parts[i];
    if(/^\d+(\.\d+)?$/.test(w)){current+=parseFloat(w);used=true;continue}
    if(w==='نیم'){current+=0.5;used=true;continue}
    if(NUM_MULT[w]){multi=true;current=(current||1)*NUM_MULT[w];total+=current;current=0;used=true;continue}
    if(NUM_WORDS[w]){current+=NUM_WORDS[w];used=true;continue}
    return {ok:false};
  }
  total+=current;
  return {ok:used&&total>0,value:total,used:used,multi:multi};
}
function parseImportance(input){
  var t=normFa(input);
  if(/خیلی مهم|بسیار مهم|خیلی زیاد|5|۵/.test(t))return 5;
  if(/بی.?اهمیت|هیچ|1|۱/.test(t))return 1;
  if(/کم|2|۲/.test(t))return 2;
  if(/متوسط|معمولی|3|۳/.test(t))return 3;
  if(/زیاد|مهم|4|۴/.test(t))return 4;
  var c=parseCountFA(t);return c.ok?Math.max(1,Math.min(5,c.value)):3;
}
/* @mahalino:v32-money-js */
function parseCountFA(input){
  var t=normFa(input).replace(/تومان|تومن|ریال/g,' ');
  var cleaned=t.replace(/(^|\s)(خواب|خوابه|اتاق|متر|متری|متراژ|سال|ساله|طبقه|مسافر|نفر|شب|عدد|تا|الی|حدود|تقریبا|تقریباً)(?=\s|$)/g,' ');
  var pr=parseNumberWords(cleaned);
  if(!pr.ok)return {ok:false,msg:'یک عدد یا عبارت مثل «دو» یا «هفتاد» بنویسید.'};
  if(!Number.isSafeInteger(pr.value))return {ok:false,msg:'عدد صحیح وارد کنید؛ مقدار اعشاری گرد نمی‌شود.'};return {ok:true,value:pr.value};
}
/* @mahalino:v32-money-range-js */
/* @mahalino:v32-age-range-js */
function parseRangeFA(input){
  var t=normFa(input).replace(/بین/g,' ');
  var parts=null;
  if(/\s+تا\s+|\s+الی\s+/.test(t))parts=t.split(/\s+(?:تا|الی)\s+/);
  else if(/[–|-]/.test(t))parts=t.split(/[–|-]/);
  else if(/\s+و\s+/.test(t)&&/بین/.test(normFa(input)))parts=t.split(/\s+و\s+/);
  if(!parts||parts.length!==2)return {ok:false,msg:'بازه را با «تا» یا خط تیره بنویسید؛ مثلاً «۵۰ تا ۷۰».'};
  var a=parseNumberWords(parts[0]),b=parseNumberWords(parts[1]);
  if(!a.ok||!b.ok)return {ok:false,msg:'دو عدد بازه را واضح بنویسید.'};
  var lo=a.value,hi=b.value;
  return {ok:true,value:Math.min(lo,hi)+'|'+Math.max(lo,hi)};
}
function parsePercentListFA(input,count){
  var t=normFa(input).replace(/\s+و\s+/g,'-').replace(/[،,؛/]/g,'-').replace(/\s+/g,'-');
  var parts=t.split('-').filter(function(x){return x!==''});
  var out=[],i,pr;
  for(i=0;i<parts.length;i++){pr=parseNumberWords(parts[i]);if(!pr.ok)return {ok:false,msg:'درصدها را با عدد بنویسید؛ مثلاً 20-30-40-10.'};out.push(pr.value)}
  if(out.length!==count)return {ok:false,msg:'تعداد درصدها باید '+count+' باشد؛ الان '+out.length+' مورد است.'};
  return {ok:true,value:out};
}
function hoodFromText(input){
  var q=normFa(input).replace(/محله|منطقه|تهران|شمال|جنوب|شرق|غرب/g,' ').replace(/\s+/g,' ').trim();
  if(!q)return null;
  var i;
  for(i=0;i<HOODS.length;i++){var n=normFa(HOODS[i].n).replace(/\s+/g,'');if(n===q.replace(/\s+/g,'')||n.indexOf(q.replace(/\s+/g,''))>=0||q.replace(/\s+/g,'').indexOf(n)>=0)return HOODS[i].id}
  return null;
}
function stayFromText(input){
  var q=normFa(input).replace(/اقامتگاه|سوئیت|آپارتمان|ویلا|اجاره|در/g,' ').replace(/\s+/g,' ').trim();
  var hits=SLIST.filter(function(s){return normFa(s.t).indexOf(q)>=0||normFa(s.city).indexOf(q)>=0});
  return hits.length===1?hits[0].id:null;
}
function projectIndexFromText(input){
  var q=normFa(input).replace(/پروژه|برج|مجتمع/g,' ').replace(/\s+/g,' ').trim();
  var i,hits=[];
  for(i=0;i<PRJ.length;i++){if(normFa(PRJ[i].t+' '+PRJ[i].loc).indexOf(q)>=0)hits.push(i)}
  return hits.length===1?hits[0]:-1;
}
function supIndexFromText(input){
  var q=normFa(input),i;
  for(i=0;i<SUPS.length;i++){if(normFa(SUPS[i].t).indexOf(q)>=0||q.indexOf(normFa(SUPS[i].t.split('—')[0]))>=0)return i}
  return -1;
}
function matchChipText(input,chips){
  if(!chips||!chips.length)return null;
  var q=normFa(input).replace(/[^\w\u0600-\u06FF0-9. ]/g,' ').replace(/\s+/g,' ').trim();
  if(!q)return null;
  var exact=null,partial=null,i,c,l;
  for(i=0;i<chips.length;i++){
    c=chips[i];l=normFa(c[0]).replace(/[^\w\u0600-\u06FF0-9. ]/g,' ').replace(/\s+/g,' ').trim();
    if(l===q){exact={value:String(c[1]),label:c[0],exact:true};break}
    if(!partial&&q.length>=3&&(l.indexOf(q)>=0||q.indexOf(l)>=0))partial={value:String(c[1]),label:c[0],exact:false};
  }
  return exact||partial;
}
var HOODIMG={h1:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',h2:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop',h3:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',h4:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',h5:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop',h6:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop'};
function hseed(s){if(!s)return null;var m=/^(h[1-6])$/.exec(s);if(m&&HOODIMG[m[1]])return HOODIMG[m[1]];return null}
var SEEDIMG={a1:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',a2:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop',a3:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',a4:'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop',a5:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop',a6:'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=800&auto=format&fit=crop',a7:'https://images.unsplash.com/photo-1560185009-5bf9f2849488?q=80&w=800&auto=format&fit=crop',a8:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800&auto=format&fit=crop',c1:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop',c2:'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=800&auto=format&fit=crop',m1:'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=800&auto=format&fit=crop',m2:'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop',m3:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800&auto=format&fit=crop',m4:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800&auto=format&fit=crop'};
function seedimg(s){if(!s)return null;if(SEEDIMG[s])return SEEDIMG[s];var m=/^([acm])(\d+)$/.exec(s||'');if(m){var arr=s[0]==='a'?['a1','a2','a3','a4']:s[0]==='c'?['c1','c2']:['m1','m2','m3','m4'];var ix=(parseInt(m[2],10)||1)%arr.length;return SEEDIMG[arr[ix]]}return null}
function starsN(n){var s='',i;for(i=0;i<5;i++){s+=(i<n?'\u2605':'\u2606')}return '<span class="stars2">'+s+'</span>'}
/* V0.19 — منبع آگهی/آمار. فقط منبع واقعی نمایش داده می‌شود؛ منبعی حدس زده نمی‌شود. */
var SRC={mahalino:{l:'آگهی محلینو',tip:'منبع: دادهٔ داخلی سامانه — بدون بازنشر از سکوهای بیرونی. اگر آگهی با منبع دیوار یا شیپور وارد شود، نشان همان سکو روی کارت می‌نشیند.'},kilid:{l:'منبع: کیلید',tip:'آمار قیمت از کیلید — قیمت پیشنهادی آگهی‌ها در این تاریخ، نه معاملهٔ قطعی.'},osm:{l:'منبع: OSM',tip:'OpenStreetMap / Overpass — فاصلهٔ هوایی از مرکز محله.'}};
function srcBadge(x){var k=(x&&x.src)||'mahalino',s=SRC[k];if(!s)return '';return '<span class="srcbadge" data-tip="'+s.tip+'" title="'+s.tip+'"><i></i>'+s.l+'</span>'}
/* V0.28 — Tabler Icons (MIT © Paweł Kuna) — outline، شبکهٔ ۲۴×۲۴، assets/icons */
var TABLER={"home":"<path d=\"M5 12l-2 0l9 -9l9 9l-2 0\" /> <path d=\"M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7\" /> <path d=\"M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6\" />","building-skyscraper":"<path d=\"M3 21l18 0\" /> <path d=\"M5 21v-14l8 -4v18\" /> <path d=\"M19 21v-10l-6 -4\" /> <path d=\"M9 9l0 .01\" /> <path d=\"M9 12l0 .01\" /> <path d=\"M9 15l0 .01\" /> <path d=\"M9 18l0 .01\" />","key":"<path d=\"M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0\" /> <path d=\"M15 9h.01\" />","coin":"<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0\" /> <path d=\"M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1\" /> <path d=\"M12 7v10\" />","briefcase":"<path d=\"M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9\" /> <path d=\"M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2\" /> <path d=\"M12 12l0 .01\" /> <path d=\"M3 13a20 20 0 0 0 18 0\" />","crane":"<path d=\"M6 21h6\" /> <path d=\"M9 21v-18l-6 6h18\" /> <path d=\"M9 3l10 6\" /> <path d=\"M17 9v4a2 2 0 1 1 -2 2\" />","bed":"<path d=\"M5 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" /> <path d=\"M22 17v-3h-20\" /> <path d=\"M2 8v9\" /> <path d=\"M12 14h10v-2a3 3 0 0 0 -3 -3h-7v5\" />","tools":"<path d=\"M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4\" /> <path d=\"M14.5 5.5l4 4\" /> <path d=\"M12 8l-5 -5l-4 4l5 5\" /> <path d=\"M7 8l-1.5 1.5\" /> <path d=\"M16 12l5 5l-4 4l-5 -5\" /> <path d=\"M16 17l-1.5 1.5\" />","layout-dashboard":"<path d=\"M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1\" /> <path d=\"M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1\" /> <path d=\"M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1\" /> <path d=\"M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1\" />","message-circle":"<path d=\"M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1\" />","map":"<path d=\"M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13\" /> <path d=\"M9 4v13\" /> <path d=\"M15 7v13\" />","layout-grid":"<path d=\"M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4\" /> <path d=\"M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4\" /> <path d=\"M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4\" /> <path d=\"M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4\" />","wallet":"<path d=\"M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12\" /> <path d=\"M20 12v4h-4a2 2 0 0 1 0 -4h4\" />","file-text":"<path d=\"M14 3v4a1 1 0 0 0 1 1h4\" /> <path d=\"M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2\" /> <path d=\"M9 9l1 0\" /> <path d=\"M9 13l6 0\" /> <path d=\"M9 17l6 0\" />","user":"<path d=\"M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0\" /> <path d=\"M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2\" />","menu":"<path d=\"M4 8l16 0\" /> <path d=\"M4 16l16 0\" />","shield-check":"<path d=\"M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06\" /> <path d=\"M15 19l2 2l4 -4\" />","plus":"<path d=\"M12 5l0 14\" /> <path d=\"M5 12l14 0\" />","search":"<path d=\"M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0\" /> <path d=\"M21 21l-6 -6\" />","trash":"<path d=\"M4 7l16 0\" /> <path d=\"M10 11l0 6\" /> <path d=\"M14 11l0 6\" /> <path d=\"M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12\" /> <path d=\"M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3\" />","pencil":"<path d=\"M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4\" /> <path d=\"M13.5 6.5l4 4\" />","dots-vertical":"<path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\" /> <path d=\"M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\" /> <path d=\"M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\" />","copy":"<path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /> <path d=\"M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" />","share":"<path d=\"M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M8.7 10.7l6.6 -3.4\" /> <path d=\"M8.7 13.3l6.6 3.4\" />","send":"<path d=\"M10 14l11 -11\" /> <path d=\"M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5\" />","paperclip":"<path d=\"M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5\" />","calendar":"<path d=\"M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12\" /> <path d=\"M16 3v4\" /> <path d=\"M8 3v4\" /> <path d=\"M4 11h16\" /> <path d=\"M11 15h1\" /> <path d=\"M12 15v3\" />","bell":"<path d=\"M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6\" /> <path d=\"M9 17v1a3 3 0 0 0 6 0v-1\" />","bell-ring":"<path d=\"M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6\" /> <path d=\"M9 17v1a3 3 0 0 0 6 0v-1\" /> <path d=\"M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727\" /> <path d=\"M3 6.727a11.05 11.05 0 0 1 2.792 -3.727\" />","map-pin":"<path d=\"M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0\" /> <path d=\"M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0\" />","credit-card":"<path d=\"M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8\" /> <path d=\"M3 10l18 0\" /> <path d=\"M7 15l.01 0\" /> <path d=\"M11 15l2 0\" />","chart-line":"<path d=\"M4 19l16 0\" /> <path d=\"M4 15l4 -6l4 2l4 -5l4 4\" />","arrows-left-right":"<path d=\"M21 17l-18 0\" /> <path d=\"M6 10l-3 -3l3 -3\" /> <path d=\"M3 7l18 0\" /> <path d=\"M18 20l3 -3l-3 -3\" />","filter":"<path d=\"M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227\" />","settings":"<path d=\"M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065\" /> <path d=\"M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0\" />","sun":"<path d=\"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0\" /> <path d=\"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7\" />","moon-high":"<path d=\"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008\" />","panel-right-close":"<path d=\"M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12\" /> <path d=\"M15 4v16\" /> <path d=\"M9 10l2 2l-2 2\" />","panel-right-open":"<path d=\"M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12\" /> <path d=\"M15 4v16\" /> <path d=\"M10 10l-2 2l2 2\" />","check":"<path d=\"M5 12l5 5l10 -10\" />","x":"<path d=\"M18 6l-12 12\" /> <path d=\"M6 6l12 12\" />","alert-triangle":"<path d=\"M12 9v4\" /> <path d=\"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0\" /> <path d=\"M12 16h.01\" />","clock":"<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /> <path d=\"M12 7v5l3 3\" />","chevron-left":"<path d=\"M15 6l-6 6l6 6\" />","chevron-right":"<path d=\"M9 6l6 6l-6 6\" />","chevron-down":"<path d=\"M6 9l6 6l6 -6\" />","refresh":"<path d=\"M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4\" /> <path d=\"M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4\" />","pin":"<path d=\"M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4\" /> <path d=\"M9 15l-4.5 4.5\" /> <path d=\"M14.5 4l5.5 5.5\" />","pin-off":"<path d=\"M9 4v1\" /> <path d=\"M9 9v1l-2 4v2h9\" /> <path d=\"M16 12l-1 -2v-6\" /> <path d=\"M12 16v5\" /> <path d=\"M8 4h8\" /> <path d=\"M3 3l18 18\" />","edit":"<path d=\"M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1\" /> <path d=\"M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415\" /> <path d=\"M16 5l3 3\" />","history":"<path d=\"M12 8l0 4l2 2\" /> <path d=\"M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5\" />","alarm-snooze":"<path d=\"M5 13a7 7 0 1 0 14 0a7 7 0 1 0 -14 0\" /> <path d=\"M10 11h4l-4 4h4\" /> <path d=\"M7 4l-2.75 2\" /> <path d=\"M17 4l2.75 2\" />"};
var ICONS={home:TABLER.home,buy:TABLER['building-skyscraper'],rent:TABLER.key,invr:TABLER.coin,mkt:TABLER.briefcase,build:TABLER.crane,stay:TABLER.bed,svc:TABLER.tools,dash:TABLER['layout-dashboard'],chat:TABLER['message-circle'],map:TABLER.map,flows:TABLER['layout-grid'],wallet:TABLER.wallet,con:TABLER['file-text'],user:TABLER.user,coin:TABLER.coin,menu:TABLER.menu,grt:TABLER['shield-check']};
ICONS.clean='<path d="M9 4h6l1 8H8l1-8z"/><path d="M7 12h10v3H7z"/><path d="M9 15v6M15 15v6"/>';
ICONS.appliance='<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M9 5h.01M12 5h.01"/>';
ICONS.link='<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>';
ICONS.clock='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
ICONS.work='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>';
ICONS.school='<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 3 2 6 2s6-1 6-2v-5"/>';

function ico(n,sz){return '<svg width="'+(sz||18)+'" height="'+(sz||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">'+(ICONS[n]||'')+'</svg>'}
function toast(msg){var t=document.createElement('div');t.className='toast';t.textContent=msg;$('#toast-root').appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},3400)}
function a11yify(root){
  if(!root||!root.querySelectorAll){return}
  var sel='[data-act],[data-view],[data-cf],[data-cv],[data-cq],[data-cba],[data-w],[data-jump],[data-imp]';
  Array.prototype.forEach.call(root.querySelectorAll(sel),function(el){
    if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)){return}
    if(!el.hasAttribute('role')){el.setAttribute('role','button')}
    if(!el.hasAttribute('tabindex')){el.setAttribute('tabindex','0')}
  });
  Array.prototype.forEach.call(root.querySelectorAll('.chip'),function(c){
    c.setAttribute('aria-pressed',c.classList.contains('on')?'true':'false');
  });
}
var MODAL_PREV=null;
function openModal(html,cb){
  var r=$('#modal-root');
  if(!r.classList.contains('on')||!r.contains(document.activeElement))MODAL_PREV=document.activeElement;
  r.innerHTML='<div class="modal">'+html+'</div>';
  r.classList.add('on');
  r.onclick=function(e){if(e.target===r)closeModal()};
  a11yify(r);
  r.removeAttribute('role');r.removeAttribute('aria-modal');
  var m=r.querySelector('.modal');
  if(m){m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');var title=m.querySelector('h1,h2,h3');if(title){title.id='mahalino-modal-title';m.setAttribute('aria-labelledby',title.id)}else{m.setAttribute('aria-label','پنجرهٔ محلینو')}m.setAttribute('tabindex','-1');setTimeout(function(){try{m.focus()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:160',e,'caught');}},20)}
  r.onkeydown=function(e){
    if(e.key==='Escape'){e.preventDefault();closeModal();return}
    if(e.key!=='Tab'||!m)return;
    var nodes=Array.prototype.filter.call(m.querySelectorAll('button,a[href],input,select,textarea,[tabindex]'),function(n){return !n.disabled&&n.tabIndex>=0&&n.getClientRects().length});
    if(!nodes.length){e.preventDefault();m.focus();return}
    var first=nodes[0],last=nodes[nodes.length-1],active=document.activeElement;
    if(e.shiftKey&&(active===first||active===m)){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(active===last||active===m)){e.preventDefault();first.focus()}
  };
  if(cb)cb();
}
function closeModal(){
  var r=$('#modal-root');
  r.classList.remove('on');r.onkeydown=null;r.innerHTML='';
  if(MODAL_PREV&&MODAL_PREV.focus){try{MODAL_PREV.focus()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:175',e,'caught');}}
  MODAL_PREV=null;
}
/* 2) state */
var LSKEY='mahalino_v33';
var PREVIOUS_LS='mahalino_v32';
var OLD_LS=['mahal','ino_','v30'].join('');
var OLD_LS4=['mahal','ino_','v29'].join('');
var OLD_LS5=['mahal','ino_','v18'].join('');
var OLD_LS2=['mahal','ino_','v16'].join('');
var OLD_LS3=['khan','yar','_v15'].join('');
// Container validation is intentionally separate from domain/business validation.
function stateObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
var S=null,LSCHAIN=[LSKEY,PREVIOUS_LS,'mahalino_v31',OLD_LS,OLD_LS4,OLD_LS5,OLD_LS2,OLD_LS3],LSi;
var stateRecovery=[],stateSource=null,stateRaw=null;
for(LSi=0;LSi<LSCHAIN.length;LSi++){
  var candidateRaw=null;
  try{
    candidateRaw=localStorage.getItem(LSCHAIN[LSi]);
    if(candidateRaw===null)continue;
    S=JSON.parse(candidateRaw);
    if(stateObject(S)){stateSource=LSCHAIN[LSi];stateRaw=candidateRaw;break}
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:197',e,'caught');S=null}
  if(candidateRaw!==null)stateRecovery.push({key:LSCHAIN[LSi],raw:candidateRaw});
  S=null;
}
if(!stateObject(S)){S={}}
var stateRepaired=false;
function stateField(obj,key,valid,fallback){
  if(!valid(obj[key])){
    if(obj[key]!==undefined)stateRepaired=true;
    obj[key]=fallback;
  }
}
function stateArrays(obj,keys){keys.split(' ').forEach(function(k){stateField(obj,k,Array.isArray,[])})}
function stateRecord(obj,key,fallback){stateField(obj,key,stateObject,fallback||{})}
['reminders','liveHistory'].forEach(function(k){if(S[k]!==undefined)stateArrays(S,k)});
stateArrays(S,'wlog log reqs wfs contracts reviews nprj svcOrders svcAudit grt grtAudit notifs library projects shares savedListings chats');
['tokens','wallet'].forEach(function(k){stateField(S,k,function(v){return typeof v==='number'&&isFinite(v)&&v>=0},0)});
stateField(S,'welcomed',function(v){return typeof v==='boolean'},false);
stateField(S,'pending',function(v){return v===null||typeof v==='string'},null);
['auth','sub','paySession','grtReserve'].forEach(function(k){stateField(S,k,function(v){return v===null||stateObject(v)},null)});
stateRecord(S,'prof',{work:null,school:null,workLL:null,schoolLL:null});
stateRecord(S,'active');stateRecord(S,'prefs');
stateRecord(S,'ui',{tab:'b',dcat:'rent',yh:24,crng:12,nrng:12,atab:'overview'});
stateRecord(S,'profile');
['confirmed','inferred','stale'].forEach(function(k){stateRecord(S.profile,k)});
stateArrays(S.profile,'log');
function stateContext(ctx){stateRecord(ctx,'fields');stateArrays(ctx,'log')}
stateRecord(S,'ctx30');stateContext(S.ctx30);
['ctx30ByChat','ctx30Collectors','scratch'].forEach(function(k){if(S[k]!==undefined)stateRecord(S,k)});
if(S.ctx30ByChat)Object.keys(S.ctx30ByChat).forEach(function(k){stateRecord(S.ctx30ByChat,k);stateContext(S.ctx30ByChat[k])});
if(S.ctx30ActiveKey!==undefined)stateField(S,'ctx30ActiveKey',function(v){return typeof v==='string'},'');
if(S.flow!==undefined)stateRecord(S,'flow');
['log','wfs','chats','contracts'].forEach(function(k){
  var rows=S[k].filter(stateObject);
  if(rows.length!==S[k].length){S[k]=rows;stateRepaired=true}
});
S.wfs.forEach(function(w){stateRecord(w,'data')});
S.chats.forEach(function(c){if(c.hist!==undefined)stateArrays(c,'hist')});
if(stateRepaired&&stateSource)stateRecovery.push({key:stateSource,raw:stateRaw});
if(stateRecovery.length)console.warn('Stored state required recovery; raw data will be preserved before saving.');
function ph(seed,w,h,fb){var hu=hseed(seed)||seedimg(seed);if(hu)return '<div class="ph"><div class="fb">'+fb+'</div><img src="'+hu+'" alt="" loading="lazy" onerror="this.remove()"></div>';return '<div class="ph"><div class="fb">'+fb+'</div><img src="https://picsum.photos/seed/'+seed+'/'+w+'/'+h+'" alt="" loading="lazy" onerror="this.remove()"></div>'}
if(S.auth===undefined){S.auth=null}
if(S.tokens===undefined){S.tokens=0}
if(S.wallet===undefined){S.wallet=0}
if(S.welcomed===undefined){S.welcomed=false}
if(S.pending===undefined){S.pending=null}
if(!S.prof){S.prof={work:null,school:null,workLL:null,schoolLL:null}}
if(!S.wlog){S.wlog=[]}
if(!S.log){S.log=[]}
if(!S.reqs){S.reqs=[]}
if(!S.wfs){S.wfs=[]}
if(!S.active){S.active={}}
if(S.flow){
  (function(){
    var mods=['rent','buy','invr','mkt','build','stay'],i,m,f,w;
    if(!S.wfs.length){
      for(i=0;i<mods.length;i++){
        m=mods[i];f=S.flow[m];
        if(!stateObject(f)){continue}
        w={id:'WF-'+m+'-legacy',m:m,num:(function(){var k=0,j;for(j=0;j<S.wfs.length;j++){if(S.wfs[j].m===m)k++}return k+1})(),step:f.step||1,data:f.data||{},done:!!f.done,cancelled:false,createdAt:Date.now(),updatedAt:Date.now()};
        S.wfs.push(w);S.active[m]=w.id;
      }
    }
    delete S.flow;
  })();
}
if(!S.contracts){S.contracts=[]}
if(!S.reviews){S.reviews=[]}
if(!S.nprj){S.nprj=[]}
if(!S.ui){S.ui={tab:'b',dcat:'rent',yh:24,crng:12,nrng:12,atab:'overview'}}
if(!S.ui.atab){S.ui.atab='overview'}
if(S.ui.navg===undefined){S.ui.navg=0.32}

if(!S.ui.svcf){S.ui.svcf='open'}
if(!S.svcOrders){S.svcOrders=[]}
if(!S.svcAudit){S.svcAudit=[]}
if(!S.grt){S.grt=[]}
if(!S.grtAudit){S.grtAudit=[]}
if(!S.grtReserve){S.grtReserve=null}
if(S.sub===undefined){S.sub=null}
/* V0.29 state defaults */
if(!S.notifs)S.notifs=[];
if(!S.library)S.library=[];
if(!S.projects)S.projects=[];
if(!S.shares)S.shares=[];
if(!S.prefs)S.prefs={};
if(!S.profile)S.profile={confirmed:{},inferred:{},stale:{},log:[]};
/* V0.32 state defaults */
if(!S.paySession)S.paySession=null;
if(!S.savedListings)S.savedListings=[];
if(!S.ctx30)S.ctx30={fields:{},log:[]};
/* @mahalino:v32-state-codec-js */
MahalinoStateCodec.attach(S);
var stateLastRaw=null,stateConflict=false;
try{stateLastRaw=localStorage.getItem(LSKEY)}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:289',e,'caught');stateConflict=true}
if(window.addEventListener)window.addEventListener('storage',function(e){
  if(e.key===LSKEY&&e.newValue!==stateLastRaw){stateConflict=true;if(window.E24)E24.toastErr('داده‌ها در پنجرهٔ دیگری تغییر کرد؛ پیش از ادامه صفحه را بازنشانی کنید.')}
});
var stateWriterReady=true;
if(typeof navigator!=='undefined'&&navigator.locks&&navigator.locks.request){
  stateWriterReady=false;
  navigator.locks.request(LSKEY+'-writer',{ifAvailable:true},function(lock){
    if(!lock)return;
    try{if(localStorage.getItem(LSKEY)!==stateLastRaw){stateConflict=true;return}}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:298',e,'caught');stateConflict=true;return}
    stateWriterReady=true;
    // Boot may have deferred a durable refund until writer ownership was known.
    if(window.E30&&E30.pay&&S.paySession&&S.paySession.paidFlag)E30.pay.recover();
    return new Promise(function(){}); // browser releases ownership when the tab closes
  }).catch(function(){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:303',null,'caught');stateWriterReady=true;if(window.E30&&E30.pay&&S.paySession&&S.paySession.paidFlag)E30.pay.recover()});
}
function save(){
  if(window.__mahalinoResetPending)return false;
  if(!stateWriterReady){if(window.E24)E24.toastErr('این پنجره امکان ذخیره ندارد؛ پنجرهٔ دیگر محلینو را ببندید و این صفحه را بازنشانی کنید.');return false}
  try{
    if(stateConflict||localStorage.getItem(LSKEY)!==stateLastRaw){
      stateConflict=true;
      if(window.E24)E24.toastErr('ذخیره انجام نشد؛ داده‌ها در پنجرهٔ دیگری تغییر کرده است. صفحه را بازنشانی کنید.');
      return false;
    }
    var encoded=MahalinoStateCodec.encode(S);
    if(stateRecovery.length){localStorage.setItem(LSKEY+'_recovery',JSON.stringify(stateRecovery));stateRecovery=[]}
    if(encoded!==stateLastRaw){localStorage.setItem(LSKEY,encoded);stateLastRaw=encoded}
    return true;
  }catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/utilities.js:318',e,'caught');
    console.error('local persistence failed');
    if(window.E24)E24.toastErr('ذخیره‌سازی محلی ناموفق بود؛ تغییرات تا بازنشانی صفحه در همین نشست اعمال است.');
    return false;
  }
}
