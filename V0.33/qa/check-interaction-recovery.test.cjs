'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
function extract(file,start,end){if(process.env.QA_INTERACTION_BASELINE==='1')return JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/approved-interaction-baselines.json'),'utf8')).find(x=>x.file===file).original;const s=fs.readFileSync(path.join(root,'src',file),'utf8');return s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)))}
const reset=extract('legacy/actions.js','/* V0.33 — بازنشانی مستقل','/* CJM handlers removed');
const copy=extract('legacy/sharing.js','  ACT.e29shCopy=async function','  ACT.e29shExport=function');
const pdf=extract('v32-ux.js','    ACT.e30pdfSend=async function','    ACT.e30shWhole=function');
function resetHarness(code=reset,fail=''){
 const data={mahalino_v32:'{"tokens":999}',mahalino_v33:'{"tokens":10}',mahalino_v33_recovery:'backup',mahalino_theme:'light',unrelated:'safe'};
 const ctx={ACT:{},LSKEY:'mahalino_v33',window:{},console,Date,Math,localStorage:{getItem:k=>data[k]??null,setItem(k,v){if(fail==='write')throw Error();data[k]=v},removeItem(k){if(fail==='remove')throw Error();delete data[k]}},sessionStorage:{removeItem(){}},location:{reload:()=>ctx.reloaded=true},toast:t=>ctx.message=t,closeModal(){},openModal:h=>ctx.modal=h};
 vm.runInNewContext(code,ctx);return {ctx,data};
}
test('reset deletes only current version; loader never imports predecessor after reload',()=>{
 const {ctx,data}=resetHarness();ctx.ACT.reset();assert.ok(ctx.modal.includes('۰.۳۳'));ctx.ACT.resetOk();
 assert.equal(data.mahalino_v32,'{"tokens":999}');assert.equal(data.unrelated,'safe');assert.equal(data.mahalino_theme,'light');
 assert.equal(data.mahalino_v33_recovery,undefined);assert.equal(data.mahalino_v33,'{}');assert.equal(ctx.reloaded,true);
 const u=fs.readFileSync(path.join(root,'src/legacy/utilities.js'),'utf8').replace('/* @mahalino:v32-state-codec-js */',()=>fs.readFileSync(path.join(root,'src/v32-state-codec.js'),'utf8'));ctx.window={};vm.runInNewContext(u.slice(u.indexOf('/* 2) state */')),ctx);assert.equal(ctx.S.tokens,0);
});
test('reset storage denial preserves original and does not reload',()=>{
 const {ctx,data}=resetHarness(reset,'write');ctx.ACT.resetOk();assert.equal(data.mahalino_v33,'{"tokens":10}');assert.equal(ctx.reloaded,undefined);assert.ok(ctx.message.includes('انجام نشد'));
});
test('reset cleanup failure reports partial completion and blocks stale saves',()=>{
 const {ctx,data}=resetHarness(reset,'remove');ctx.ACT.resetOk();assert.ok(ctx.message.includes('ناقص'));assert.equal(ctx.reloaded,undefined);assert.equal(ctx.window.__mahalinoResetPending,true);
 const u=fs.readFileSync(path.join(root,'src/legacy/utilities.js'),'utf8').replace('/* @mahalino:v32-state-codec-js */',()=>fs.readFileSync(path.join(root,'src/v32-state-codec.js'),'utf8'));vm.runInNewContext(u.slice(u.indexOf('/* 2) state */')),ctx);ctx.S.tokens=300;ctx.save();assert.equal(data.mahalino_v33,'{}');
});
for(const kind of ['success','reject-fallback','denied','missing','throw'])test('clipboard '+kind,async()=>{
 const messages=[];let selected=0;let resolveWrite;
 const navigator={};if(kind==='success')navigator.clipboard={writeText:()=>new Promise(resolve=>resolveWrite=resolve)};
 if(kind==='reject-fallback'||kind==='denied')navigator.clipboard={writeText:()=>Promise.reject(Error('denied'))};
 const c={ACT:{},navigator,document:{getElementById:()=>({value:'link',select:()=>selected++}),execCommand:()=>{if(kind==='throw')throw Error();return kind==='reject-fallback'}},toast:t=>messages.push(t)};
 vm.runInNewContext(copy,c);const promise=c.ACT.e29shCopy();if(kind==='success'){assert.equal(messages.length,0);resolveWrite()};await promise;
 assert.equal(messages.length,1);assert.equal(messages[0]==='لینک کپی شد',kind==='success'||kind==='reject-fallback');if(kind!=='success')assert.equal(selected,1);
});
for(const kind of ['read-reject','read-null','bad-magic','success','unsupported','abort','share-reject','slice-throw'])test('PDF '+kind,async()=>{
 const status={textContent:''};let shared=0;
 const file={size:9,name:'contract.pdf',slice(){if(kind==='slice-throw')throw Error();return {arrayBuffer:()=>kind==='read-reject'?Promise.reject(Error('read')):kind==='read-null'?Promise.reject(null):Promise.resolve(Uint8Array.from(Buffer.from(kind==='bad-magic'?'text!':'%PDF-')).buffer)}}};
 const c={ACT:{},Uint8Array,document:{getElementById:id=>id==='e30-pdf-status'?status:{files:[file]}},navigator:{canShare:()=>kind!=='unsupported',share:async()=>{shared++;if(kind==='abort')throw {name:'AbortError'};if(kind==='share-reject')throw Error('share')}}};
 vm.runInNewContext(pdf,c);await assert.doesNotReject(c.ACT.e30pdfSend());assert.ok(status.textContent);
 assert.equal(status.textContent.includes('ارسال شد'),kind==='success');assert.equal(shared,kind==='success'||kind==='abort'||kind==='share-reject'?1:0);
});
