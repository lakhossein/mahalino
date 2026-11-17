'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test'),assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../src/legacy/core.js'),'utf8');
const code=src.slice(src.indexOf('E29.llm={'),src.indexOf('/* ── chat reference'));
function adapter(fetch){const c={E29:{},fetch,setTimeout,clearTimeout,AbortController};vm.runInNewContext(code,c);return c.E29.llm}
test('adapter remains disabled without fetch',()=>{const a=adapter(()=>{throw Error('must not call')});let value;a.complete([],v=>value=v);assert.equal(value,null);assert.equal(a.enabled,false)});
for(const response of [{ok:false,json:async()=>({text:'wrong'})},{ok:true,json:async()=>({text:3})},{ok:true,json:async()=>{throw Error()}}])test('HTTP/schema/JSON failure returns null once',async()=>{const a=adapter(async()=>response);a.configure('/optional');let calls=0;const value=await new Promise(resolve=>a.complete([],v=>{calls++;resolve(v)}));assert.equal(value,null);assert.equal(calls,1)});
test('timeout aborts a hanging request and callback runs once',async()=>{let signal;const a=adapter((url,opt)=>{signal=opt.signal;return new Promise(()=>{})});a.configure('/optional');a.timeoutMs=5;const value=await new Promise(resolve=>a.complete([],resolve));assert.equal(value,null);assert.equal(signal.aborted,true)});
test('valid response retains optional text contract',async()=>{const a=adapter(async()=>({ok:true,json:async()=>({text:'ok'})}));a.configure('/optional');assert.equal(await new Promise(resolve=>a.complete([],resolve)),'ok')});
