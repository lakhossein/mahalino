'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const {test}=require('node:test');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..');
test('dependency inventory covers every assembler slot and keeps payment after pricing',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'))),inventory=JSON.parse(fs.readFileSync(path.join(repo,'docs/validation/runtime-dependencies.json')));
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
 const actual=require('./runtime-contracts.cjs').inventory(root);const reviewed=JSON.parse(fs.readFileSync(path.join(repo,'docs/validation/runtime-dependencies.json'),'utf8'));assert.deepEqual(actual,reviewed);
});

test('diagnostics tolerate hostile name getters without exposing payloads',()=>{
 const c={window:{addEventListener(){}},document:{getElementById:()=>null},Date};vm.runInNewContext(fs.readFileSync(path.join(root,'src/legacy/error-handler.js'),'utf8'),c);
 const error={get name(){throw Error('PRIVATE')}};assert.doesNotThrow(()=>c.MahalinoDiagnostics.record('qa',error,'caught'));assert.equal(c.MahalinoDiagnostics.events[0].cause,'Unknown');
});
