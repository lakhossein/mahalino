/* Run the existing render/decorate pipeline immediately, then consolidate its
   consecutive assistant records before the synchronous action returns. This
   preserves sliders, forms and state-dependent suggestions built by ceStep. */
E30.turns=(function(){
  var installed=false,depth=0,emitted=null,output;
  function consolidate(){
    var changed=false,fresh=false;
    for(var i=0;i<HIST.length;){
      if(HIST[i].r!=='bot'||!emitted.has(HIST[i])){i++;continue}
      fresh=true;var end=i+1;
      while(end<HIST.length&&HIST[end].r==='bot'&&emitted.has(HIST[end]))end++;
      if(end-i>1){
        var messages=HIST.slice(i,end),lastGuide='';
        var html=messages.map(function(m){return String(m.h||'').replace(/<section class="e31-guide"[\s\S]*?<\/section>/g,function(card){lastGuide=card;return ''})}).join('<div class="e31-turn-part"></div>');
        HIST.splice(i,end-i,{r:'bot',h:html+lastGuide,c:messages[messages.length-1].c||null});changed=true;
      }
      i++;
    }
    emitted=null;
    if(fresh){S.liveHistory=HIST.slice();save()}
    if(changed)cr();
  }
  function wrap(fn){return function(){if(!depth)emitted=new Set();depth++;try{return fn.apply(this,arguments)}finally{depth--;if(!depth)consolidate()}}}
  function install(){
    if(installed)return;installed=true;output=botC;
    botC=function(){var result=output.apply(this,arguments);if(depth&&HIST.length&&HIST[HIST.length-1].r==='bot')emitted.add(HIST[HIST.length-1]);return result};
    ceSend=wrap(ceSend);ceVal=wrap(ceVal);ceStart=wrap(ceStart);
    E30.discAPI.start=wrap(E30.discAPI.start);E30.discAPI.route=wrap(E30.discAPI.route);
    Object.keys(CBACT).forEach(function(k){if(typeof CBACT[k]==='function')CBACT[k]=wrap(CBACT[k])});
    Object.keys(ACT).forEach(function(k){if(typeof ACT[k]==='function')ACT[k]=wrap(ACT[k])});
  }
  return {install:install,wrap:wrap};
})();
