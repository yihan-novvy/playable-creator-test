// Product-host unit checks, not official platform reporting evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/host.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function fixture({intro=false,ctaEnabled=true,allowReplay=true,hasSdk=true,throwClick=false,failStarts=[],policy={enabled:true,mode:'steps',afterSteps:3,intervals:[2,1]}}={}){
  class Element extends EventTarget{hidden=true;style={setProperty(){}};clientWidth=390;clientHeight=844;offsetHeight=124;focus(){this.focused=true;}getBoundingClientRect(){return{top:734,bottom:844};}}
  const nodes=Object.fromEntries(['travel-town-game','travel-town-status','travel-town-replay','travel-town-result','travel-town-result-title','travel-town-result-copy',...(ctaEnabled?['novvy-cta']:[])].map(id=>[id,new Element()]));
  const document=Object.assign(new EventTarget(),{hidden:false,getElementById:id=>nodes[id]||null,createElement:()=>new Element(),body:{append(){}},documentElement:{style:{setProperty(){}}}});
  const calls=[],instances=[];let now=1000;
  const window=Object.assign(new EventTarget(),{TRAVEL_TOWN_CONFIG:{intro,title:false,allowReplay,ctaEnabled,policy},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStart','onStep','onComplete','onReplay','endStage','click'].map(name=>[name,(...args)=>{if(name==='click'&&throwClick)throw Error('SDK click unavailable');calls.push([name,...args]);}]))});
  if(!hasSdk)delete window.NovvyPlayable;
  window.addEventListener('novvy:cta-card',()=>{if(ctaEnabled)nodes['novvy-cta'].hidden=false;});
  vm.runInNewContext(code,{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>now},CustomEvent,console,queueMicrotask});
  window.NovvyGame(async(_root,shell)=>{const game={shell,pauses:0,resumes:0,destroyed:0,start(){if(failStarts.includes(instances.length))return Promise.reject(Error('test load failure'));},destroy(){game.destroyed++;},pause(){game.pauses++;},resume(){game.resumes++;},setEnv(env){game.env=env;}};instances.push(game);return game;});
  await flush();
  return{window,document,nodes,calls,instances,advance(){now+=1100;},emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}};
}
const clicks=f=>f.calls.filter(c=>c[0]==='click');
const actions=(f,n)=>{for(let i=0;i<n;i++){f.advance();f.instances.at(-1).shell.step(i);}};
const f=await fixture({intro:true});
assert.equal(f.nodes['novvy-cta'].hidden,true,'card hidden throughout intro');
f.emit('novvy:cta-interact');actions(f,10);assert.equal(clicks(f).length,0,'no click or auto-jump before playable');
f.emit('novvy:intro-finished');await flush();
assert.equal(f.nodes['novvy-cta'].hidden,false);
assert.equal(f.instances[0].env.insets.bottom,132,'full height reserved during card animation');
f.emit('novvy:cta-interact');f.emit('novvy:cta-interact');
assert.equal(clicks(f).length,1,'manual clicks have one-second cooldown');
assert.equal(clicks(f)[0][1].click_source,'cta_click');
actions(f,7);
assert.deepEqual(clicks(f).slice(1).map(c=>c[1].step),[3,5,6,7],'first threshold then intervals; last interval repeats');
assert(clicks(f).slice(1).every(c=>c[1].click_source==='forced_click_to_appstore'&&c[1].auto_jump_mode==='steps'));
f.advance();f.instances[0].shell.win();assert.equal(clicks(f).length,5,'no duplicate win jump after step auto-jump');
f.nodes['travel-town-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(f.instances.length,1,'SDK replay does not rebuild before departure');assert.equal(clicks(f).length,6,'retry requests one CTA');
assert.equal(clicks(f).at(-1)[1].click_source,'forced_click_to_appstore');
assert.equal(f.nodes['travel-town-result'].hidden,false);assert.equal(f.nodes['travel-town-replay'].disabled,true);
f.nodes['travel-town-replay'].dispatchEvent(new Event('click'));f.emit('focus');await flush();
assert.equal(clicks(f).length,6);assert.equal(f.instances.length,1,'spurious focus is not a store return');
f.emit('novvy:viewablechange',{viewable:false});await flush();assert.equal(f.instances.length,1,'no rebuild while away');
f.emit('novvy:viewablechange',{viewable:true});await flush();assert.equal(f.instances.length,2);
assert.equal(f.calls.filter(c=>c[0]==='onReplay').length,1);assert.equal(f.nodes['travel-town-result'].hidden,true);
actions(f,3);assert.equal(clicks(f).at(-1)[1].step,3,'replay resets threshold and step count');
assert.equal(f.calls.filter(c=>c[0]==='setStage').length,2,'replay retains playable stage');
const before=clicks(f).length;f.advance();f.document.hidden=true;f.emit('novvy:cta-interact');actions(f,3);assert.equal(clicks(f).length,before);
f.document.hidden=false;f.emit('novvy:viewablechange',{viewable:false});f.emit('novvy:cta-interact');actions(f,3);assert.equal(clicks(f).length,before,'invisible ads do not count or jump');
f.emit('novvy:viewablechange',{viewable:true});f.emit('novvy:cta-interact');assert.equal(clicks(f).length,before+1,'card works after return');
const cool=await fixture({policy:{enabled:true,mode:'steps',afterSteps:1,intervals:[1]}});
cool.emit('novvy:cta-interact');cool.instances[0].shell.step(1);assert.equal(clicks(cool).length,1);
cool.advance();cool.instances[0].shell.step(2);assert.equal(clicks(cool).length,2,'cooldown does not consume pending threshold');
const off=await fixture({ctaEnabled:false,policy:{enabled:false,mode:'steps',afterSteps:1,intervals:[]}});
off.emit('novvy:cta-interact');actions(off,9);off.instances[0].shell.win();assert.equal(clicks(off).length,0);assert.equal(off.instances[0].env.insets.bottom,0,'card off gives space back');
const once=await fixture({policy:{enabled:true,mode:'steps',afterSteps:2,intervals:[]}});actions(once,8);assert.equal(clicks(once).length,1,'empty intervals means once');
const complete=await fixture({policy:{enabled:true,mode:'complete',afterSteps:1,intervals:[1]}});actions(complete,8);assert.equal(clicks(complete).length,0);complete.instances[0].shell.win();complete.instances[0].shell.win();assert.equal(clicks(complete).length,1);assert.equal(clicks(complete)[0][1].auto_jump_mode,'win');
const fail=await fixture();actions(fail,1);fail.instances[0].shell.fail();assert.equal(clicks(fail).length,0,'failure is not a completion CTA');
const fallback=await fixture();actions(fallback,1);fallback.instances[0].shell.win();assert.equal(clicks(fallback).length,0,'win before step threshold never forces a store visit');


const cached=await fixture();actions(cached,1);
const hide=new Event('pagehide');Object.defineProperty(hide,'persisted',{value:true});cached.window.dispatchEvent(hide);
assert.equal(cached.instances[0].destroyed,0,'cached store navigation retains native scene');assert.equal(cached.instances[0].pauses,1);
assert.equal(cached.calls.filter(c=>c[0]==='endStage').length,0,'cached navigation is not an ad end');
const show=new Event('pageshow');Object.defineProperty(show,'persisted',{value:true});cached.window.dispatchEvent(show);assert.equal(cached.instances[0].resumes,1);
actions(cached,1);assert.equal(cached.calls.filter(c=>c[0]==='onStep').length,2,'steps resume on the same instance');
cached.window.dispatchEvent(new Event('pagehide'));assert.equal(cached.instances[0].destroyed,1,'real unload releases native resources');
assert.equal(cached.calls.filter(c=>c[0]==='endStage').length,1,'real unload ends the stage');

// Both result buttons use the requested modal and one CTA; only a real return
// can restart. These are unit fixtures, not official SDK event evidence.
for(const result of ['win','fail']){
 const r=await fixture({policy:{enabled:false,mode:'steps',afterSteps:20,intervals:[]}});
 actions(r,1);r.instances[0].shell[result]();
 assert.equal(r.nodes['travel-town-result'].hidden,false);
 assert.equal(r.nodes['travel-town-replay'].textContent,result==='win'?'Retry':'Try again');
 assert.equal(clicks(r).length,0,'showing the result does not itself convert');
 r.nodes['travel-town-replay'].dispatchEvent(new Event('click'));
 assert.equal(clicks(r).length,1);assert.equal(clicks(r)[0][1].scene,'playable-replay');
 assert.equal(clicks(r)[0][1].result,result);
 assert.equal(r.calls.filter(c=>c[0]==='endStage').length,0,'replay CTA keeps the stage open');
 r.document.hidden=true;r.document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(r.instances.length,1);
 r.document.hidden=false;r.document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(r.instances.length,2);
 r.emit('focus');r.emit('novvy:viewablechange',{viewable:true});await flush();
 assert.equal(r.instances.length,2,'duplicate return signals do not replay twice');
 assert.equal(r.calls.filter(c=>c[0]==='onReplay').length,1);
}
const focusReturn=await fixture();actions(focusReturn,1);focusReturn.instances[0].shell.fail();focusReturn.nodes['travel-town-replay'].dispatchEvent(new Event('click'));
focusReturn.emit('blur');await flush();assert.equal(focusReturn.instances.length,1);focusReturn.emit('focus');await flush();assert.equal(focusReturn.instances.length,2);
const cacheReturn=await fixture();actions(cacheReturn,1);cacheReturn.instances[0].shell.win();cacheReturn.nodes['travel-town-replay'].dispatchEvent(new Event('click'));
cacheReturn.window.dispatchEvent(hide);await flush();assert.equal(cacheReturn.instances.length,1);cacheReturn.window.dispatchEvent(show);await flush();assert.equal(cacheReturn.instances.length,2);
const preview=await fixture({hasSdk:false});preview.instances[0].shell.win();preview.nodes['travel-town-replay'].dispatchEvent(new Event('click'));await flush();assert.equal(preview.instances.length,2,'SDK-free editor preview remains usable');
const disabled=await fixture({allowReplay:false});disabled.instances[0].shell.fail();disabled.nodes['travel-town-replay'].dispatchEvent(new Event('click'));assert.equal(disabled.nodes['travel-town-result'].hidden,true);assert.equal(clicks(disabled).length,0);
const blocked=await fixture();actions(blocked,1);blocked.instances[0].shell.win();blocked.emit('novvy:cta-interact');blocked.nodes['travel-town-replay'].dispatchEvent(new Event('click'));assert.equal(clicks(blocked).length,1);assert.equal(blocked.nodes['travel-town-replay'].disabled,false,'throttled CTA restores retry button');blocked.emit('blur');blocked.emit('focus');await flush();assert.equal(blocked.instances.length,1);
const rejected=await fixture({throwClick:true});actions(rejected,1);rejected.instances[0].shell.fail();rejected.nodes['travel-town-replay'].dispatchEvent(new Event('click'));assert.equal(rejected.nodes['travel-town-replay'].disabled,false);rejected.emit('blur');rejected.emit('focus');await flush();assert.equal(rejected.instances.length,1,'SDK exception does not arm a replay');
const loadRetry=await fixture({failStarts:[2]});actions(loadRetry,1);loadRetry.instances[0].shell.win();loadRetry.nodes['travel-town-replay'].dispatchEvent(new Event('click'));loadRetry.emit('blur');loadRetry.emit('focus');await flush();assert.equal(loadRetry.nodes['travel-town-replay'].disabled,false);assert.equal(loadRetry.nodes['travel-town-result'].hidden,false);assert.equal(loadRetry.calls.filter(c=>c[0]==='onReplay').length,0,'failed rebuild does not report replay');loadRetry.nodes['travel-town-replay'].dispatchEvent(new Event('click'));await flush();assert.equal(loadRetry.instances.length,3);assert.equal(clicks(loadRetry).length,1,'loading recovery does not charge another store visit');assert.equal(loadRetry.calls.filter(c=>c[0]==='onReplay').length,1);
console.log('Travel Town host: result dialogs, replay CTA, return gate, deduplication, failed restart recovery, policies and lifecycle passed.');
