
setTimeout(function(){
  if(!window.__BOOTED){
    var e=document.getElementById('errbar');
    if(e){
      e.style.display='block';
      e.textContent=' اسکریپت اصلی اجرا نشد — فایل ناقص بارگذاری شده است.';
    }
    var l=document.getElementById('v-landing');
    if(l&&!document.querySelector('.view.on')){
      l.classList.add('on');
      l.innerHTML='<div class="card" style="max-width:520px;margin:40px auto;text-align:center"><h3> سامانه بارگذاری نشد</h3><p class="note">فایل ناقص بارگذاری شده است. لطفاً دوباره تلاش کنید.</p></div>';
    }
  }
},1500);
