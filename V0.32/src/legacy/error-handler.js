
var MahalinoDiagnostics=(function(){
  var events=[];
  function record(code,error,kind){var cause;try{cause=error&&error.name}catch(ignore){cause='Unknown'};var known=['Error','TypeError','RangeError','SyntaxError','ReferenceError','AbortError','QuotaExceededError','SecurityError','NetworkError'];events.push({code:code,at:Date.now(),cause:known.indexOf(cause)>=0?cause:'Unknown',kind:kind||'fault'});if(events.length>50)events.shift()}
  function report(code,error){record(code,error,'fault');var e=document.getElementById('errbar');if(e){e.style.display='block';e.textContent='خطای برنامه ('+code+')؛ صفحه را بازنشانی کنید.'}}
  if(window.addEventListener)window.addEventListener('unhandledrejection',function(e){report('promise.unhandled',e.reason)});
  return {report:report,record:record,events:events};
})();
window.onerror=function(m,s,l,c,error){MahalinoDiagnostics.report('script.error',error);return false;};
