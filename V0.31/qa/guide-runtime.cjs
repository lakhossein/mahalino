'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8');
const utilities=html.slice(html.indexOf('function fa(n,d)'),html.indexOf('function hoodFromText('));
function runtime(flow){
  let seq=0;const shown=[],messages=[];
  const c=vm.createContext({S:{auth:{name:'QA'},tokens:500},E30:{uid:()=>String(++seq)},CBACT:{},CE:{f:null},CURRENT:'landing',
    save(){},usrC(){},botC:h=>messages.push(h),
    chatListCard:x=>{shown.push(x);return '<article class="pcard" data-l="'+x.id+'"><button data-cba="selL">انتخاب</button></article>'},
    chatBCard:x=>{shown.push(x);return '<article class="pcard" data-l="'+x.id+'"><button data-cba="selB">انتخاب</button></article>'}});
  vm.runInContext(utilities,c);
  for(const name of ['HOODS','RLIST','BLIST']){
    const declaration=html.match(new RegExp('var '+name+'=\\[[\\s\\S]*?\\];'));
    assert(declaration,'missing actual sample dataset '+name);vm.runInContext(declaration[0],c);
  }
  for(const name of ['v31-intel.js','v31-flows.js','v31-guidance.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
  c.E30.discAPI.start(flow,true);
  return {c,shown,messages,set:(k,v)=>c.E30.discAPI.setF(k,v,{src:'answer',hard:true}),run:()=>{
    const before=JSON.stringify(c.E30.discAPI.ctx().fields);
    assert.equal(c.E30.guide.route(c.E30.guide.actions.sample.prompt),true);
    assert.equal(JSON.stringify(c.E30.discAPI.ctx().fields),before,'showing results changed explicit user constraints');
    assert.equal(c.S.tokens,500,'showing search results deducted credit');
    assert(!/data-cba="sel[LB]"/.test(messages.at(-1)),'a preview offered an action tied to an unrelated legacy step');
  }};
}
module.exports=runtime;
