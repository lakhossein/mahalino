'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const {test}=require('node:test');
const root=path.resolve(__dirname,'..'),runtime=require('./runtime-contracts.cjs');
test('dependency inventory covers every assembler slot and keeps payment after pricing',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'))),inventory=runtime.reviewedInventory(root);
 assert.deepEqual(inventory.modules.map(x=>x.slot).sort(),Object.keys(manifest.slots).sort());for(const item of inventory.modules)assert.equal(item.file,manifest.slots[item.slot]);
 const core=fs.readFileSync(path.join(root,'src/v32-core.js'),'utf8');assert(core.indexOf('E30.price=')<core.indexOf('/* @mahalino:v32-payment-js */'));
});
test('payment classification is explicit and never reads function source',()=>{
 const shell=fs.readFileSync(path.join(root,'src/v32-shell.js'),'utf8');assert(!shell.includes('Function.prototype.toString'));assert(shell.includes('E30.paidActionRegistry=Object.keys(paidRegistry)'));
});
test('Promise/script diagnostic records are bounded and omit user/error text',()=>{
 const callbacks={},bar={style:{}};const c={window:{addEventListener:(name,cb)=>callbacks[name]=cb},document:{getElementById:()=>bar},Date};vm.runInNewContext(fs.readFileSync(path.join(root,'src/legacy/error-handler.js'),'utf8'),c);
 for(let i=0;i<60;i++)callbacks.unhandledrejection({reason:'PRIVATE'});assert.equal(c.MahalinoDiagnostics.events.length,50);assert(!JSON.stringify(c.MahalinoDiagnostics.events).includes('PRIVATE'));assert(!bar.textContent.includes('PRIVATE'));assert.equal(c.window.onerror('PRIVATE'),false);
});

test('every diagnosed catch insertion is present at its declared module',()=>{
 const sites=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/diagnostic-sites.json'),'utf8'));assert(sites.length>150);
 for(const site of sites){const source=fs.readFileSync(path.join(root,'src',site.file),'utf8');assert(source.includes(site.statement),site.code)}
});

test('scoped imports/exports, writes and load order exactly match the reviewed runtime contract',()=>{
 const actual=runtime.inventory(root);assert.deepEqual(actual,runtime.reviewedInventory(root));
});

test('review output reports unreviewed changes without accepting them',t=>{
 const scratch=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'mahalino-contract-'));t.after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
 fs.copyFileSync(path.join(root,'build-manifest.json'),path.join(scratch,'build-manifest.json'));
 for(const dir of ['src','templates'])fs.cpSync(path.join(root,dir),path.join(scratch,dir),{recursive:true});
 fs.appendFileSync(path.join(scratch,'src/v32-money.js'),'\nvar unexpectedExport;\n');
 const expected=runtime.reviewedInventory(root),actual=runtime.inventory(scratch);
 const m=actual.modules.find(x=>x.slot==='v32-money-js');assert(m.exports.includes('unexpectedExport'));
 assert.throws(()=>assert.deepEqual(actual,expected),{code:'ERR_ASSERTION'});
 const delta=runtime.reviewedDelta(actual,expected);
 assert.deepEqual(delta,{modules:[{slot:m.slot,exports:{add:['unexpectedExport']}}]});
 assert.deepEqual(runtime.applyReviewedDelta(expected,delta),actual);
 assert.deepEqual(runtime.reviewedInventory(root),expected,'review mutated the reviewed baseline');
 actual.loadOrder.reverse();assert.throws(()=>assert.deepEqual(actual,expected),{code:'ERR_ASSERTION'});
 assert.deepEqual(runtime.reviewedDelta(actual,expected).loadOrder,actual.loadOrder);
});

test('diagnostics tolerate hostile name getters without exposing payloads',()=>{
 const c={window:{addEventListener(){}},document:{getElementById:()=>null},Date};vm.runInNewContext(fs.readFileSync(path.join(root,'src/legacy/error-handler.js'),'utf8'),c);
 const error={get name(){throw Error('PRIVATE')}};assert.doesNotThrow(()=>c.MahalinoDiagnostics.record('qa',error,'caught'));assert.equal(c.MahalinoDiagnostics.events[0].cause,'Unknown');
});
