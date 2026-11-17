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
