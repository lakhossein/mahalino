/* ═══ ۲۲) راه‌اندازی ═══ */
(function(){
  try{
    try{if(localStorage.getItem('mahalino_sidefold')==='1')document.body.classList.add('sidefold')}catch(e){}
    try{E28.init()}catch(e){}
    try{E29.init()}catch(e){console.error('E29 init',e)}
    try{E30.init()}catch(e){console.error('E30 init',e)}
    renderSidebar();renderTok();
    var mbt=document.querySelector('.menubtn');if(mbt){mbt.innerHTML=ico('menu',20)}
    if(S.auth){
      var p=S.pending||'landing';
      S.pending=null;save();
      go(p);
    }else{
      go('splash');
    }
  }catch(e){
    var eb=document.getElementById('errbar');
    if(eb){eb.style.display='block';eb.textContent='خطای راه‌اندازی: '+(e&&e.message?e.message:e)}
    var lv=document.querySelector('.view.on');
    if(!lv){
      var l2=document.getElementById('v-landing');
      if(l2){l2.classList.add('on')}
    }
  }
  setInterval(ppmTick,4000);
})();
window.__BOOTED=true;
