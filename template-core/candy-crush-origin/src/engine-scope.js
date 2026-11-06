// Namespace/lifecycle isolation for trusted, frozen engine builds. This is not
// a security sandbox: the host and games share a document, without an iframe.
export function createEngineScope(root) {
  const native=window, values=Object.create(null), bus=new EventTarget(), listeners=[], timers=new Map(), frames=new Map(), urls=new Set(), observers=new Set(), audioContexts=new Set(), audioElements=new Set(),fonts=new Set();
  const performance=native.performance||{now:()=>Date.now()},realNow=()=>performance.now();
  let disposed=false, scope, paused=false, pausedAt=0, pausedFor=0, sequence=0;
  const gameNow=()=>(paused?pausedAt:realNow())-pausedFor;
  function armTimer(id,record){
    if(disposed||paused)return;
    record.at=realNow()+record.remaining;
    record.nativeId=native.setTimeout(()=>{
      if(disposed||paused||!timers.has(id))return;
      if(!record.interval)timers.delete(id);
      typeof record.fn==='string'?run(record.fn):record.fn(...record.args);
      if(record.interval&&timers.has(id)){record.remaining=record.ms;armTimer(id,record);}
    },record.remaining);
  }
  function timer(fn,ms,args,interval){if(disposed)return 0;const id=++sequence,delay=Math.max(0,Number(ms)||0),record={fn,ms:delay,args,interval,remaining:delay,nativeId:0,at:0};timers.set(id,record);armTimer(id,record);return id;}
  function clearTimer(id){const record=timers.get(id);if(record)native.clearTimeout(record.nativeId);timers.delete(id);}
  function armFrame(id,record){if(disposed||paused)return;record.nativeId=native.requestAnimationFrame(()=>{frames.delete(id);if(!disposed&&!paused)record.fn(gameNow());});}
  function pause(){if(disposed||paused)return;pausedAt=realNow();paused=true;timers.forEach(record=>{native.clearTimeout(record.nativeId);record.remaining=Math.max(0,record.at-pausedAt);});frames.forEach(record=>native.cancelAnimationFrame(record.nativeId));}
  function resume(){if(disposed||!paused)return;pausedFor+=realNow()-pausedAt;paused=false;timers.forEach((record,id)=>armTimer(id,record));frames.forEach((record,id)=>armFrame(id,record));}
  const eventTarget=type=>type.includes(':')||['resize','orientationchange','load','DOMContentLoaded'].includes(type)?bus:root;
  const listen=(target,type,fn,options)=>{if(disposed)return;target.addEventListener(type,fn,options);listeners.push([target,type,fn,options]);};
  const head=document.createElement('div');root.append(head);
  const doc=new Proxy(document,{get(target,key){
    if(Object.hasOwn(values,'document.'+String(key)))return values['document.'+String(key)];
    if(key==='body'||key==='documentElement')return root;
    if(key==='head')return head;
    if(key==='fonts')return new Proxy(target.fonts,{get(set,key){if(key==='add')return font=>{if(!disposed){fonts.add(font);set.add(font);}return set;};const value=set[key];return typeof value==='function'?value.bind(set):value;}});
    if(key==='defaultView')return scope;
    if(key==='readyState')return 'complete';
    if(key==='getElementById')return id=>root.querySelector(`[id="${CSS.escape(id)}"]`);
    if(key==='getElementsByTagName')return tag=>tag.toLowerCase()==='head'?[head]:tag.toLowerCase()==='body'?[root]:root.getElementsByTagName(tag);
    if(['querySelector','querySelectorAll','getElementsByClassName'].includes(key))return root[key].bind(root);
    if(key==='addEventListener')return (type,fn,options)=>listen(type==='visibilitychange'?target:root,type,fn,options);
    if(key==='removeEventListener')return (type,fn,options)=>(type==='visibilitychange'?target:root).removeEventListener(type,fn,options);
    if(key==='dispatchEvent')return root.dispatchEvent.bind(root);
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  },set(target,key,value){if(typeof key==='string'&&key.startsWith('on')&&typeof value==='function')listen(root,key.slice(2),value);values['document.'+String(key)]=value;return true;}});
  const run=source=>{if(!disposed)return new native.Function('scope',`with(scope){return(function(){\n${source}\n}).call(window);}`)(scope);};
  function ScopedFunction(...parts){
    const body=parts.pop()||'',compiled=new native.Function('scope',`with(scope){return function(${parts.join(',')}){${body}\n};}`)(scope);
    // Vendor global detection commonly uses Function('return this')(). Keep
    // that global inside this instance, while preserving explicit receivers.
    if(parts.length===0&&/^\s*return\s+this\s*;?\s*$/.test(body))return ()=>scope;
    return compiled;
  }
  ScopedFunction.prototype=native.Function.prototype;
  function memoryResponse(url){
    const source=String(url?.url||url);
    if(!source.startsWith('data:'))throw new Error('Game resource must be embedded: '+source.slice(0,100));
    const comma=source.indexOf(','),meta=source.slice(5,comma),raw=source.slice(comma+1);
    const bytes=meta.includes(';base64')?Uint8Array.from(atob(raw),c=>c.charCodeAt(0)):new TextEncoder().encode(decodeURIComponent(raw));
    return new Response(bytes,{status:200,headers:{'Content-Type':meta.split(';')[0]||'text/plain'}});
  }
  // Engine decoders may use their fetch-shaped API for data URIs. No HTTP or
  // file reads occur here; bytes are decoded from the embedded asset registry.
  const memoryFetch=async url=>memoryResponse(url);
  class MemoryXHR extends EventTarget {
    readyState=0; status=0; responseType=''; response=null; responseText='';
    open(method,url){this.url=url;this.readyState=1;}
    setRequestHeader(){} getResponseHeader(){return this.mime||'';} overrideMimeType(mime){this.mime=mime;}
    abort(){this.aborted=true;}
    async send(){try{const response=memoryResponse(this.url);this.status=200;this.response=this.responseType==='arraybuffer'?await response.arrayBuffer():this.responseType==='blob'?await response.blob():await response.text();if(typeof this.response==='string')this.responseText=this.response;if(this.aborted||disposed)return;this.readyState=4;this.onreadystatechange?.();this.onload?.({target:this});this.dispatchEvent(new Event('load'));}catch(error){if(!this.aborted){this.onerror?.(error);this.dispatchEvent(new Event('error'));}}}
  }
  Object.assign(values,{
    Math:Object.create(native.Math),Date:class extends native.Date {constructor(...args){super(...(args.length?args:[native.Date.now()-(paused?realNow()-pausedAt:0)-pausedFor]));}static now(){return native.Date.now()-(paused?realNow()-pausedAt:0)-pausedFor;}},
    document:doc,Function:ScopedFunction,eval:run,fetch:memoryFetch,XMLHttpRequest:MemoryXHR,
    hasOwnProperty:key=>Object.hasOwn(values,key),
    performance:new Proxy(performance,{get(target,key){if(key==='now')return gameNow;const value=target[key];return typeof value==='function'?value.bind(target):value;}}),
    addEventListener:(type,fn,options)=>listen(eventTarget(type),type,fn,options),
    removeEventListener:(type,fn,options)=>eventTarget(type).removeEventListener(type,fn,options),
    dispatchEvent:event=>eventTarget(event.type).dispatchEvent(event),
    requestAnimationFrame(fn){if(disposed)return 0;const id=++sequence,record={fn,nativeId:0};frames.set(id,record);armFrame(id,record);return id;},
    cancelAnimationFrame(id){const record=frames.get(id);if(record)native.cancelAnimationFrame(record.nativeId);frames.delete(id);},
    setTimeout:(fn,ms,...args)=>timer(fn,ms,args,false),clearTimeout:clearTimer,
    setInterval:(fn,ms,...args)=>timer(fn,ms,args,true),clearInterval:clearTimer,
    URL:class extends native.URL {static createObjectURL(blob){const url=native.URL.createObjectURL(blob);urls.add(url);return url;}static revokeObjectURL(url){urls.delete(url);native.URL.revokeObjectURL(url);}},
    ResizeObserver:class extends native.ResizeObserver {constructor(fn){super(fn);observers.add(this);}},
    Audio:function(...args){const element=new native.Audio(...args);audioElements.add(element);return element;},
    open(){},
  });
  for(const name of ['AudioContext','webkitAudioContext'])if(native[name])values[name]=class extends native[name]{constructor(...args){super(...args);audioContexts.add(this);}};
  scope=new Proxy(values,{
    has:(target,key)=>Object.hasOwn(target,key)||key in native,
    get(target,key){
      if(key===Symbol.unscopables)return undefined;
      if(['window','self','globalThis','global','parent','top'].includes(key))return scope;
      if(Object.hasOwn(target,key))return target[key];
      if(['innerWidth','outerWidth'].includes(key))return root.clientWidth;
      if(['innerHeight','outerHeight'].includes(key))return root.clientHeight;
    if(['createjs','AdobeAn','Howl','Howler','cc','__require','jsb','require','module','exports','define','mraid','novvy','System','Luna','LunaUnity','Bridge','pc','UnityEngine'].includes(key))return undefined;
      const value=native[key];return typeof value==='function'&&!value.prototype?value.bind(native):value;
    },
    set(target,key,value){if(typeof key==='string'&&key.startsWith('on')&&typeof value==='function')listen(eventTarget(key.slice(2)),key.slice(2),value);target[key]=value;return true;},
  });
  return {window:scope,run,pause,resume,audioContexts,audioElements,dispose(){if(disposed)return;disposed=true;listeners.forEach(([target,type,fn,options])=>target.removeEventListener(type,fn,options));timers.forEach(record=>native.clearTimeout(record.nativeId));frames.forEach(record=>native.cancelAnimationFrame(record.nativeId));timers.clear();frames.clear();urls.forEach(url=>native.URL.revokeObjectURL(url));fonts.forEach(font=>document.fonts.delete(font));observers.forEach(o=>o.disconnect());audioElements.forEach(a=>{a.pause();a.removeAttribute('src');a.load();});audioContexts.forEach(c=>{if(c.state!=='closed')c.close().catch(()=>{});});head.remove();}};
}

export function engineRoot(container,markup,css){
  const mount=document.createElement('div');mount.style.cssText='position:absolute;inset:0;overflow:hidden;';
  const shadow=mount.attachShadow({mode:'open'}),root=document.createElement('div');root.className='engine-root';
  root.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:hidden;--origin-hud-space:0px;--origin-cta-space:0px;';
  root.innerHTML=`<style>${css}</style>${markup}`;shadow.append(root);container.append(mount);
  return {root,mount};
}
