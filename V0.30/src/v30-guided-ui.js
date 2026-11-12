/* V0.30 usability repair: compact sidebar, account menu, full-width library and valid reminders.
   No storage keys or monetary balances are changed here. */
E30.uiTidyInit=function(){
  if(E30._uiTidyReady)return;
  E30._uiTidyReady=true;
  var menu=null;

  function closeAccountMenu(){
    if(menu){menu.remove();menu=null}
    var owner=document.querySelector('[data-act="e30AccountMenu"]');
    if(owner)owner.setAttribute('aria-expanded','false');
  }
  function decorateSidebar(){
    var side=document.getElementById('side');
    if(!side||!S.auth){closeAccountMenu();return}
    closeAccountMenu();
    var footer=side.querySelector('.e29-sbot');
    if(footer){
      footer.innerHTML='<button class="e29-srow e30-account-trigger" type="button" data-act="e30AccountMenu" data-tip="حساب و تنظیمات" aria-label="باز کردن منوی حساب و تنظیمات" aria-expanded="false" aria-haspopup="dialog">'+
        '<span class="e30-account-mark" aria-hidden="true">م</span><span class="lbl">حساب و تنظیمات</span><span class="e30-account-chevron lbl" aria-hidden="true">⌄</span></button>';
    }
    var chat=side.querySelector('.e29-newbtn');
    if(chat){
      chat.innerHTML='<span class="e30-chat-icon" aria-hidden="true">'+e29ico('chat',17)+'<b>+</b></span><span class="lbl">گفت‌وگوی جدید</span>';
      chat.setAttribute('aria-label','ایجاد گفت‌وگوی جدید');
      chat.title='گفت‌وگوی جدید';
    }
    var project=side.querySelector('.e29-seca[data-act="e29prjNew"]');
    if(project){
      project.innerHTML='<span class="e30-project-icon" aria-hidden="true">▣<b>+</b></span><span class="lbl">پروژهٔ جدید</span>';
      project.setAttribute('aria-label','ایجاد پروژهٔ جدید');
      project.setAttribute('data-tip','ایجاد پروژهٔ جدید');
      project.title='ایجاد پروژهٔ جدید';
    }
    Array.prototype.forEach.call(side.querySelectorAll('.e29-projhead'),function(btn){
      btn.setAttribute('data-tip','باز کردن پروژه');
      if(!btn.querySelector('.e30-project-icon')){
        btn.insertAdjacentHTML('afterbegin','<span class="e30-project-icon" aria-hidden="true">▣</span>');
      }
    });
    var fold=side.querySelector('[data-act="sideFold"]');
    if(fold)fold.title=fold.getAttribute('aria-label');
  }

  var originalRender=E29.shell.renderSidebar;
  E29.shell.renderSidebar=function(){
    var value=originalRender.apply(this,arguments);
    decorateSidebar();
    return value;
  };
  var originalOnly=E29.shell.renderSidebarOnly;
  E29.shell.renderSidebarOnly=function(){
    var value=originalOnly.apply(this,arguments);
    decorateSidebar();
    return value;
  };

  ACT.e30AccountMenu=function(){
    if(menu){closeAccountMenu();return}
    var trigger=document.querySelector('[data-act="e30AccountMenu"]');
    if(!trigger)return;
    menu=document.createElement('div');
    menu.className='e30-account-menu';
    menu.setAttribute('role','dialog');
    menu.setAttribute('aria-label','حساب و تنظیمات');
    var who=esc(S.auth&&S.auth.name||'حساب کاربری'),balance=fa(Number(S.tokens)||0,0);
    menu.innerHTML='<div class="e30-account-summary"><b>'+who+'</b><span>اعتبار باقی‌مانده: '+balance+' کلید</span></div>'+
      '<button type="button" data-act="account" data-tab="overview">پروفایل و حساب کاربری</button>'+
      '<button type="button" data-act="wallet">کیف پول و تراکنش‌ها</button>'+
      '<button type="button" data-act="e29shManage">لینک‌های اشتراک‌گذاری</button>'+
      '<button type="button" data-act="themeToggle">تغییر حالت روشن و تاریک</button>'+
      '<button type="button" data-view="profile">تنظیمات</button>';
    document.body.appendChild(menu);
    var r=trigger.getBoundingClientRect();
    var w=Math.min(316,window.innerWidth-24);
    menu.style.width=w+'px';
    menu.style.right=Math.max(12,window.innerWidth-r.right)+'px';
    menu.style.bottom=Math.max(12,window.innerHeight-r.top+8)+'px';
    trigger.setAttribute('aria-expanded','true');
    menu.querySelector('button').focus();
  };
  document.addEventListener('click',function(event){
    if(!menu)return;
    var target=event.target;
    if(target.closest&&target.closest('.e30-account-menu')){
      if(target.closest('button'))window.setTimeout(closeAccountMenu,0);
      return;
    }
    if(target.closest&&target.closest('[data-act="e30AccountMenu"]'))return;
    closeAccountMenu();
  });
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&menu)closeAccountMenu();
  });

  function markFullLibrary(){
    var panel=document.getElementById('e29-panel');
    if(panel){panel.classList.add('e30-library-fullscreen');panel.setAttribute('aria-label','کتابخانهٔ تمام‌صفحه')}
  }
  /* The sidebar library action captures its private openPanel closure in V0.29,
     so decorating ONLY the public shell API would miss the actual user click. */
  var openLibraryAction=ACT.e29panelLib;
  ACT.e29panelLib=function(){var value=openLibraryAction.apply(this,arguments);markFullLibrary();return value};
  /* Clicking an entry-level rent/buy action should not bypass the conversational
     discovery and fall into the legacy fixed questionnaire. Internal ceStart()
     hand-offs remain untouched for contracts, saved progress and tests. */
  document.addEventListener('click',function(ev){
    var trigger=ev.target&&ev.target.closest&&ev.target.closest('[data-cf]');
    if(!trigger||!S.auth)return;
    var f=trigger.getAttribute('data-cf');
    if(f!=='rent'&&f!=='buy')return;
    if(!E30.discAPI||typeof E30.discAPI.start!=='function')return;
    ev.preventDefault();ev.stopImmediatePropagation();
    usrC((trigger.textContent||'').replace(/\s+/g,' ').trim()||'شروع '+(f==='rent'?'اجاره':'خرید'));
    E30.discAPI.start(f,false);
  },true);
  if(CBACT.e30StartRent){
    CBACT.e30StartRent=function(){
      usrC('آغاز اجاره و قرارداد');
      E30.discAPI.start('rent',false);
      return true;
    };
  }

  var originalPanel=E29.shell.openPanel;
  E29.shell.openPanel=function(kind,opts){
    var value=originalPanel.apply(this,arguments);
    if(kind==='library')markFullLibrary();
    return value;
  };

  function localStamp(ts){
    var d=new Date(ts),p=function(n){return String(n).padStart(2,'0')};
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
  }
  function decorateDate(id,edit){
    var input=document.getElementById(id);
    if(!input)return;
    var previousValue=input.value;
    input.type='datetime-local';
    input.setAttribute('aria-label','تاریخ و ساعت یادآور، از اکنون به بعد');
    input.setAttribute('step','60');
    input.min=localStamp(Date.now()+60000);
    if(edit){
      var current=previousValue.replace(' ','T');
      var parsed=Date.parse(current);
      input.value=Number.isFinite(parsed)?localStamp(parsed):localStamp(Date.now()+3600000);
    }else if(!input.value){
      input.value=localStamp(Date.now()+3600000);
    }
    var label=document.createElement('label');
    label.setAttribute('for',id);
    label.className='e30-date-note';
    label.textContent='تاریخ و ساعت یادآور (از اکنون به بعد)';
    input.parentNode.insertBefore(label,input);
  }
  function validDate(id){
    var input=document.getElementById(id),ts=input&&Date.parse(input.value.replace(' ','T'));
    if(!input||!Number.isFinite(ts)||ts<=Date.now()){
      toast('تاریخ و ساعت یادآور باید در آینده باشد.');
      if(input){input.setAttribute('aria-invalid','true');input.focus()}
      return false;
    }
    input.removeAttribute('aria-invalid');
    return true;
  }

  var newForm=ACT.e29remNew;
  ACT.e29remNew=function(){
    var value=newForm.apply(this,arguments);
    decorateDate('e29-rd',false);
    return value;
  };
  var newSave=ACT.e29remNewGo;
  ACT.e29remNewGo=function(){
    if(!validDate('e29-rd'))return;
    return newSave.apply(this,arguments);
  };
  var editForm=ACT.e30remEdit;
  ACT.e30remEdit=function(){
    var value=editForm.apply(this,arguments);
    decorateDate('re28-w',true);
    return value;
  };
  var editSave=ACT.remEditOk28;
  ACT.remEditOk28=function(){
    if(!validDate('re28-w'))return;
    var input=document.getElementById('re28-w');
    if(input)input.value=input.value.replace('T',' ');
    return editSave.apply(this,arguments);
  };
  if(E25&&typeof E25.remDoSave==='function'){
    var legacySave=E25.remDoSave;
    E25.remDoSave=function(){
      if(E25.rem&&!(Number(E25.rem.due)>Date.now())){
        botC('برای یادآور باید زمان آینده انتخاب شود؛ لطفاً تاریخ جدید بگویید.',null);
        return false;
      }
      return legacySave.apply(this,arguments);
    };
  }
  if(E28&&typeof E28.remAuto==='function'){
    var auto=E28.remAuto;
    E28.remAuto=function(nn,raw){
      var nt=normFa(raw||nn||'');
      var reminder=/یادم بنداز|یادم بینداز|یادآور|یادآوری/.test(nt)||!!E28.remPend;
      if(reminder&&typeof E28.remParseWhen==='function'){
        var when=E28.remParseWhen(nt);
        if(when&&Number(when.ts)<=Date.now()){
          usrC(raw||nn);E28.remPend=null;
          botC('این زمان گذشته است. تاریخ و ساعت آینده را بنویسید یا از تقویم یادآورها انتخاب کنید.',null);
          return true;
        }
      }
      return auto.apply(this,arguments);
    };
  }
  E29.shell.renderSidebar();
};
