/* Owned chat archives: serialization can be reused until a tracked mutation.
   Adopt incoming records so a caller retaining a raw reference cannot bypass
   invalidation. Other state fields keep native serialization semantics. */
var MahalinoStateCodec=(function(){
  var states=new WeakMap();
  function install(state){
    var dirty=true,encoded=null,raw=state.chats;
    if(!Array.isArray(raw))throw new TypeError('Invalid chats container');
    var proxies=new WeakMap(),targets=new WeakMap();
    function adopt(value,seen){
      if(!value||typeof value!=='object')return value;
      if(targets.has(value))return targets.get(value);
      seen=seen||new WeakMap();if(seen.has(value))return seen.get(value);
      var clone=Array.isArray(value)?[]:{};seen.set(value,clone);
      Object.keys(value).forEach(function(k){Object.defineProperty(clone,k,{value:adopt(value[k],seen),enumerable:true,writable:true,configurable:true})});
      return clone;
    }
    function wrap(value){
      if(!value||typeof value!=='object')return value;
      if(proxies.has(value))return proxies.get(value);
      var proxy=new Proxy(value,{
        get:function(target,key){return wrap(Reflect.get(target,key))},
        set:function(target,key,value){dirty=true;return Reflect.set(target,key,adopt(value))},
        deleteProperty:function(target,key){dirty=true;return Reflect.deleteProperty(target,key)},
        defineProperty:function(target,key,descriptor){dirty=true;if('value' in descriptor)descriptor.value=adopt(descriptor.value);return Reflect.defineProperty(target,key,descriptor)}
      });proxies.set(value,proxy);targets.set(proxy,value);return proxy;
    }
    // Initial data came from the loader and has no external aliases yet.
    Object.defineProperty(state,'chats',{enumerable:true,configurable:true,get:function(){return wrap(raw)},set:function(value){if(!Array.isArray(value))throw new TypeError('Invalid chats container');raw=adopt(value);dirty=true}});
    return {encode:function(){
      if(dirty){encoded=JSON.stringify(raw);dirty=false}
      var body=JSON.stringify(state,function(key,value){return this===state&&key==='chats'?undefined:value});
      return (body==='{}'?'{':body.slice(0,-1)+',')+'"chats":'+encoded+'}';
    }};
  }
  function attach(state){if(!states.has(state))states.set(state,install(state));return state}
  return {attach:attach,encode:function(state){attach(state);return states.get(state).encode()}};
})();
