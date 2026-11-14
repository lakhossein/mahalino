'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8');
const utilities=html.slice(html.indexOf('function fa(n,d)'),html.indexOf('function hoodFromText('));
function runtime(){
  let seq=0;
  const c=vm.createContext({S:{auth:{name:'QA'}},E30:{uid:()=>String(++seq)},CBACT:{},CE:{f:null},HOODS:[],
    save(){},botC(){},usrC(){}});
  vm.runInContext(utilities,c);
  vm.runInContext(fs.readFileSync(path.join(root,'src/v31-intel.js'),'utf8'),c);
  return c;
}
const opening='حدود ۳۰ میلیارد تومان سرمایه دارم. می‌خوام یه ملک بخرم که اجاره ماهانه بده.';
const investor=runtime();
assert.equal(investor.E30.discAPI.route(opening),true);
assert.equal(investor.S.ctx30Collectors[investor.S.ctx30ActiveKey].wf,'invest');
assert.equal(investor.E30.discAPI.getF('invest_capital')?.v[1],300000000000,'investment routing lost the opening capital');
assert.equal(investor.E30.discAPI.getF('buy_budget'),null,'investment capital leaked into a purchase budget');
const buyer=runtime();
assert.equal(buyer.E30.discAPI.route('می‌خوام برای خودم آپارتمان بخرم؛ بودجه ۳۰ میلیارد تومان، نه سرمایه‌گذاری.'),true);
assert.equal(buyer.E30.discAPI.getF('buy_budget')?.v[1],300000000000);
assert.equal(buyer.E30.discAPI.getF('invest_capital'),null);
const guided=runtime();
guided.E30.discAPI.extract(opening,'guided-prompt','invest');
assert.equal(guided.E30.discAPI.getF('invest_capital')?.v[1],300000000000);
assert.equal(guided.E30.discAPI.getF('buy_budget'),null);
console.log('PASS investment and residence openings retain amounts in their routed financial context');
