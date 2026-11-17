
var MahalinoDiagnostics=(function(){
  var events=[];
  function report(code){events.push({code:code,at:Date.now()});if(events.length>50)events.shift();var e=document.getElementById('errbar');if(e){e.style.display='block';e.textContent='خطای برنامه ('+code+')؛ صفحه را بازنشانی کنید.'}}
  if(window.addEventListener)window.addEventListener('unhandledrejection',function(){report('promise.unhandled')});
  return {report:report,events:events};
})();
window.onerror=function(){MahalinoDiagnostics.report('script.error');return false;};
