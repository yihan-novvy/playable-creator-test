// Product-host unit checks, not official platform reporting evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/host.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});return{promise,resolve,reject};};
async function fixture({intro=false,ctaEnabled=true,allowReplay=true,replayLoad,replayStart,clickImpl,preview=false,failRestart=false,policy={enabled:true,mode:'steps',afterSteps:3,intervals:[2,1]}}={}){
  class Element extends EventTarget{hidden=true;style={setProperty(){}};clientWidth=390;clientHeight=844;offsetHeight=124;getBoundingClientRect(){return{top:734,bottom:844};}focus(){document.activeElement=this;}}
  const nodes=Object.fromEntries(['screwdom-game','screwdom-status','screwdom-replay','screwdom-result','screwdom-result-title','screwdom-result-copy',...(ctaEnabled?['novvy-cta']:[])].map(id=>[id,new Element()]));
  const document=Object.assign(new EventTarget(),{hidden:false,getElementById:id=>nodes[id]||null,createElement:()=>new Element(),body:{append(){}},documentElement:{style:{setProperty(){}}}});
  const calls=[],instances=[],errors=[],previews=[];let now=1000;
  const window=Object.assign(new EventTarget(),{SCREWDOM_CONFIG:{intro,title:false,allowReplay,ctaEnabled,policy},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStart','onStep','onComplete','onReplay','endStage','click'].map(name=>[name,(...args)=>{calls.push([name,...args]);if(name==='click')return clickImpl?.(window,document,...args);}]))});
  if(preview)delete window.NovvyPlayable.click;
  window.addEventListener('novvy:cta-card',()=>{if(ctaEnabled)nodes['novvy-cta'].hidden=false;});
  vm.runInNewContext(code,{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>now},CustomEvent,console:{info:(...args)=>previews.push(args),warn(){},error:error=>errors.push(error)},queueMicrotask});
  window.NovvyGame(async(_root,shell)=>{const restarting=instances.length>0;if(restarting&&failRestart){failRestart=false;throw new Error('Scene failed to load');}const game={shell,starts:0,pauses:0,resumes:0,start(){game.starts++;return restarting?(typeof replayStart==='function'?replayStart():replayStart):undefined;},destroy(){game.destroyed=true;game.resultHiddenOnDestroy=nodes['screwdom-result'].hidden;},pause(){game.pauses++;},resume(){game.resumes++;},setEnv(env){game.env=env;}};calls.push(['scene-create',instances.length]);instances.push(game);if(restarting)await replayLoad;return game;});
  await flush();
  return{window,document,nodes,calls,instances,errors,previews,advance(){now+=1100;},hidden(value){document.hidden=value;document.dispatchEvent(new Event('visibilitychange'));},emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}};
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
assert.equal(f.nodes['screwdom-result'].hidden,false);assert.equal(f.nodes['screwdom-result-title'].textContent,'You win!');assert.equal(f.nodes['screwdom-replay'].textContent,'Play again');assert.equal(f.nodes['screwdom-game'].inert,true,'win dialog blocks underlying board');
f.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(f.instances.length,2);assert.equal(clicks(f).length,6,'replay requests one store visit');
assert.deepEqual({...clicks(f).at(-1)[1]},{scene:'playable-replay',result:'win',click_source:'forced_click_to_appstore'});
assert(f.calls.indexOf(clicks(f).at(-1))<f.calls.findIndex(c=>c[0]==='scene-create'&&c[1]===1),'CTA precedes scene replacement');
assert.equal(f.nodes['screwdom-result'].hidden,true);assert.equal(f.nodes['screwdom-game'].inert,false,'ready replay restores board input');
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
assert.equal(fail.nodes['screwdom-result'].hidden,false);assert.equal(fail.nodes['screwdom-result-title'].textContent,'Out of space');assert.equal(fail.nodes['screwdom-replay'].textContent,'Try again');
fail.emit('novvy:cta-interact');assert.equal(clicks(fail).length,0,'result blocks the background CTA card');
fail.nodes['screwdom-replay'].dispatchEvent(new Event('click'));fail.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(fail.instances.length,2,'rapid retry clicks create one new instance');assert.equal(fail.nodes['screwdom-result'].hidden,true);assert.equal(fail.calls.filter(c=>c[0]==='onReplay').length,1);
assert.equal(clicks(fail).length,1,'rapid retry clicks request one CTA');assert.equal(clicks(fail)[0][1].result,'fail');
assert.equal(fail.nodes['novvy-cta'].inert,false,'ready replay restores the card');
const noReplay=await fixture({allowReplay:false});actions(noReplay,1);noReplay.instances[0].shell.fail();assert.equal(noReplay.nodes['screwdom-replay'].hidden,true);assert.equal(noReplay.document.activeElement,noReplay.nodes['screwdom-result']);
noReplay.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();assert.equal(noReplay.instances.length,1);assert.equal(clicks(noReplay).length,0);
noReplay.emit('novvy:cta-interact');assert.equal(clicks(noReplay).length,1,'without replay the result still permits the download card');assert.equal(noReplay.nodes['novvy-cta'].inert,false);
// Keep both asynchronous phases pending: an instantly resolved fixture misses
// the old result card shrinking into a second-looking popup during reload.
for(const outcome of ['fail','win']){
  const load=deferred(),start=deferred();
  const pending=await fixture({replayLoad:load.promise,replayStart:start.promise,policy:{enabled:false}});
  actions(pending,1);pending.instances[0].shell[outcome]();
  pending.nodes['screwdom-replay'].dispatchEvent(new Event('click'));
  assert.equal(pending.nodes['screwdom-result'].hidden,true,`${outcome}: result closes synchronously on retry`);
  assert.equal(pending.instances[0].resultHiddenOnDestroy,true,'close result before destroying the old scene');
  const assertLoading=()=>{
    assert.equal(pending.nodes['screwdom-result'].hidden,true,'no result popup while rebuilding');
    assert.equal(pending.nodes['screwdom-status'].hidden,false);
    assert.equal(pending.nodes['screwdom-game'].inert,true,'loading board cannot accept input');
    assert.equal(pending.calls.filter(c=>c[0]==='onReplay').length,0,'retry event waits for a ready scene');
  };
  await flush();assertLoading();
  pending.nodes['screwdom-replay'].dispatchEvent(new Event('click'));
  assert.equal(pending.instances.length,2,'pending retry ignores repeated clicks');
  load.resolve();await flush();assertLoading();
  start.resolve();await flush();
  assert.equal(pending.nodes['screwdom-result'].hidden,true);
  assert.equal(pending.nodes['screwdom-status'].hidden,true);
  assert.equal(pending.nodes['screwdom-game'].inert,false);
  assert.equal(pending.calls.filter(c=>c[0]==='onReplay').length,1);
  assert.equal(clicks(pending).length,1,'retry requests CTA once even when automatic jumps are off');
}
const brokenStart=deferred(),broken=await fixture({replayStart:brokenStart.promise});
actions(broken,1);broken.instances[0].shell.fail();broken.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
brokenStart.reject(new Error('Scene failed to start'));await flush();
assert.equal(broken.nodes['screwdom-result'].hidden,false,'a genuine loading error still shows a retry dialog');
assert.equal(broken.nodes['screwdom-result-title'].textContent,'Unable to load');
assert.equal(broken.nodes['screwdom-replay'].disabled,false);assert.equal(broken.nodes['screwdom-status'].hidden,true);
assert.equal(broken.calls.filter(c=>c[0]==='onReplay').length,0);assert.equal(broken.errors.length,1);
const fallback=await fixture();actions(fallback,1);fallback.instances[0].shell.win();assert.equal(clicks(fallback).length,1,'win before first step threshold jumps once');
for(const clickImpl of [()=>false,()=>{throw new Error('SDK unavailable');}]){
  const rejected=await fixture({clickImpl});rejected.instances[0].shell.fail();
  rejected.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
  assert.equal(rejected.nodes['screwdom-replay'].disabled,false,'rejected CTA restores retry button');
  assert.equal(rejected.nodes['screwdom-result'].hidden,false,'rejected CTA retains the result');
  rejected.nodes['screwdom-replay'].dispatchEvent(new Event('click'));assert.equal(clicks(rejected).length,2,'rejected CTA does not consume the cooldown');
  rejected.hidden(true);rejected.hidden(false);await flush();assert.equal(rejected.instances.length,1,'unrelated return after rejected CTA must not restart');
}
const throttled=await fixture();throttled.emit('novvy:cta-interact');throttled.instances[0].shell.fail();throttled.nodes['screwdom-replay'].dispatchEvent(new Event('click'));
assert.equal(throttled.nodes['screwdom-replay'].disabled,false);assert.equal(throttled.instances.length,1);assert.equal(clicks(throttled).length,1);
throttled.advance();throttled.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();assert.equal(clicks(throttled).length,2,'cooldown does not permanently lock retry');assert.equal(throttled.instances.length,2);
for(const signal of ['visibility','viewable','pagehide']){
  const visit=await fixture({policy:{enabled:false},clickImpl:(window,document)=>{
    if(signal==='visibility'){document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));}
    else window.dispatchEvent(new CustomEvent(signal==='viewable'?'novvy:viewablechange':'pagehide',{detail:{viewable:false}}));
  }});
  visit.instances[0].shell.fail();visit.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
  assert.equal(visit.instances.length,2,signal+': accepted CTA resets scene immediately');assert.equal(visit.nodes['screwdom-result'].hidden,true);
  assert.equal(visit.instances[1].starts,0,signal+': hidden scene does not start');assert.equal(visit.calls.filter(c=>c[0]==='onReplay').length,0);
  assert(!visit.instances[1].destroyed,signal+': store visit retains the new scene');assert.equal(visit.calls.filter(c=>c[0]==='endStage').length,0);
  visit.hidden(false);visit.emit('novvy:viewablechange',{viewable:true});visit.emit('pageshow');await flush();
  visit.emit('novvy:viewablechange',{viewable:true});await flush();
  assert.equal(visit.instances.length,2);assert.equal(visit.instances[1].starts,1);assert.equal(visit.calls.filter(c=>c[0]==='onReplay').length,1);
  assert.equal(clicks(visit).length,1,'return does not repeat CTA');
  visit.emit('pagehide');assert.equal(visit.instances[1].destroyed,true,'later unrelated page exit still destroys the game');
}
const recovery=await fixture({failRestart:true});recovery.instances[0].shell.fail();recovery.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(recovery.nodes['screwdom-result-title'].textContent,'Unable to load');assert.equal(recovery.calls.filter(c=>c[0]==='onReplay').length,0);
recovery.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(clicks(recovery).length,1,'loading recovery does not request another CTA');assert.equal(recovery.calls.filter(c=>c[0]==='onReplay').length,1);
for(const kind of ['fail','win']){
  const local=await fixture({preview:true,ctaEnabled:false,policy:{enabled:false}});local.instances[0].shell[kind]();local.nodes['screwdom-replay'].dispatchEvent(new Event('click'));await flush();
  assert.equal(local.instances.length,2,'SDK-free preview restarts: '+kind);assert.equal(local.instances[1].starts,1);assert.equal(local.nodes['screwdom-result'].hidden,true);
  assert.equal(local.previews.length,1);assert.equal(local.previews[0][1].scene,'playable-replay');assert.equal(local.calls.filter(c=>c[0]==='onReplay').length,1);
}
console.log('Screwdom host: retry CTA, asynchronous replay, visibility/return, rejection/cooldown, loading recovery and existing CTA policies passed.');
