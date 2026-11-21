'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/v32-state-codec.js'),'utf8'),context);const codec=context.MahalinoStateCodec;
const encode=s=>JSON.parse(codec.encode(s));
test('cached archive reflects every nested mutation, reorder and deletion',()=>{
 const s={tokens:10,chats:[{id:'a',hist:[{h:'original'}]},{id:'b',hist:[]}]};encode(s);
 s.chats[0].hist[0].h='edited';assert.equal(encode(s).chats[0].hist[0].h,'edited');
 s.chats.reverse();assert.equal(encode(s).chats[0].id,'b');s.chats.splice(1,1);assert.equal(encode(s).chats.length,1);
 s.chats[0].projectId='p';delete s.chats[0].projectId;assert.equal(encode(s).chats[0].projectId,undefined);
});
test('new archive records are adopted and external aliases cannot alter cached data',()=>{
 const s={chats:[]};encode(s);const external={id:'a',hist:[{h:'kept'}]};s.chats.push(external);encode(s);external.hist[0].h='external';assert.equal(encode(s).chats[0].hist[0].h,'kept');
 const array=[{id:'b'}];s.chats=array;encode(s);array.push({id:'outside'});assert.equal(encode(s).chats.length,1);
});
test('other state fields remain live and fresh root states get their own codec',()=>{
 const first={chats:[{id:'old'}],tokens:10,custom:{v:1}};encode(first);first.custom.v=2;first.tokens=8;assert.equal(encode(first).custom.v,2);assert.equal(encode(first).tokens,8);
 const second=JSON.parse(JSON.stringify(first));second.chats.push({id:'new'});assert.equal(encode(second).chats.length,2);assert.equal(encode(first).chats.length,1);
});
test('filtering proxy records preserves identities and property descriptors invalidate cache',()=>{
 const s={chats:[{id:'a'},{id:'b'}]};encode(s);const first=s.chats[0];s.chats=s.chats.filter(c=>c.id==='a');assert.equal(s.chats[0],first);
 Object.defineProperty(s.chats[0],'title',{value:'updated',enumerable:true,configurable:true});assert.equal(encode(s).chats[0].title,'updated');
});
test('invalid cyclic data cannot reuse an earlier valid cache',()=>{
 const s={chats:[{id:'kept'}]};encode(s);const cycle={id:'bad'};cycle.self=cycle;s.chats.push(cycle);assert.throws(()=>codec.encode(s));s.chats.pop();assert.equal(encode(s).chats[0].id,'kept');
});
