/* ═══ ۲.۵) نمونه‌های فلو — چند گردش کار هم‌زمان ═══ */
function wfOf(id){var i;if(!id){return null}for(i=0;i<S.wfs.length;i++){if(S.wfs[i].id===id)return S.wfs[i]}return null}
function wfAll(m){var out=[],i,w;for(i=0;i<S.wfs.length;i++){w=S.wfs[i];if(w.m===m)out.push(w)}return out}
function wfLive(m){return wfAll(m).filter(function(w){return !w.cancelled})}
function wfTouched(w){return !!(w&&(w.step>1||w.done||(w.data&&Object.keys(w.data).length)))}
function wfShown(m){var a=S.active[m];return wfLive(m).filter(function(w){return wfTouched(w)||w.id===a})}
function wfRunning(){return S.wfs.filter(function(w){return MODBY[w.m]&&!w.cancelled&&!w.done&&w.step>1})}
function wfDoneCount(){return S.wfs.filter(function(w){return MODBY[w.m]&&!w.cancelled&&w.done}).length}
function wfNew(m){
  var w={id:'WF-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1679616).toString(36),m:m,num:wfAll(m).length+1,
    step:1,data:{},done:false,cancelled:false,createdAt:Date.now(),updatedAt:Date.now()};
  S.wfs.unshift(w);S.active[m]=w.id;save();return w;
}
function wfSet(m,id){var w=wfOf(id);if(!w||w.m!==m){return null}S.active[m]=id;save();return w}
function wf(m){
  var w=wfOf(S.active[m]);
  if(w&&!w.cancelled){return w}
  var live=wfLive(m),i;
  if(live.length){
    for(i=0;i<live.length;i++){if(!live[i].done){S.active[m]=live[i].id;return live[i]}}
    S.active[m]=live[0].id;return live[0];
  }
  return null;
}
function wd(m){
  if(!MODBY[m]){
    if(!S.scratch){S.scratch={}}
    if(!S.scratch[m]){S.scratch[m]={step:1,data:{},done:false,cancelled:false}}
    return S.scratch[m];
  }
  var w=wf(m);return w?w:wfNew(m);
}
function wfState(w){
  if(!w){return {t:'شروع‌نشده',c:''}}
  if(w.cancelled){return {t:'لغوشده',c:'b-bad'}}
  if(w.done){return {t:'انجام‌شده',c:'b-ok'}}
  if(w.step>1){return {t:'در جریان — مرحلهٔ '+fa(w.step,0),c:'b-warn'}}
  return {t:'در انتظار شروع',c:'b-info'};
}
function wfName(w){
  if(!w){return ''}
  var base=MODBY[w.m]?MODBY[w.m].t:w.m;
  return base+' '+fa(w.num,0);
}
function wfSummary(w){
  var st=wfState(w);
  return st.c?'<span class="badge '+st.c+'">'+st.t+'</span>':'<span class="badge">'+st.t+'</span>';
}
function wfData(m){var w=wf(m);return w?w.data:null}
function wfRebind(m){
  if(CE.f&&CE.f===m){
    CE.i=0;CE.li=0;CE.hist=[];
    if(FCHAT.open){try{ceStep()}catch(e){if(typeof MahalinoDiagnostics!=='undefined')MahalinoDiagnostics.record('legacy/workflows.js:53',e,'caught');}}
  }
}
function resumeChips(cls){
  return wfRunning().map(function(w){
    return '<button class="'+cls+'" data-act="resume" data-m="'+w.m+'" data-wf="'+w.id+'">'+esc(wfName(w))+' — مرحلهٔ '+fa(w.step,0)+' ←</button>';
  });
}
function wfTouch(w){if(w){w.updatedAt=Date.now()}return w}
function wfModOfCat(cat){return cat==='invest'?'invr':cat}
function wfCancel(id){
  var w=wfOf(id);
  if(!w||w.cancelled){return null}
  w.cancelled=true;w.done=false;w.updatedAt=Date.now();
  S.reqs.forEach(function(r){if(r.wf===w.id&&reqOpen(r)){r.status='لغو شد'}});
  if(S.active[w.m]===w.id){
    var live=wfLive(w.m);
    if(live.length){S.active[w.m]=live[0].id}else{delete S.active[w.m]}
  }
  save();return w;
}
function wfDelete(id){
  var w=wfOf(id),i;
  if(!w){return false}
  for(i=0;i<S.wfs.length;i++){if(S.wfs[i].id===id){S.wfs.splice(i,1);break}}
  if(S.active[w.m]===id){delete S.active[w.m]}
  save();return true;
}

