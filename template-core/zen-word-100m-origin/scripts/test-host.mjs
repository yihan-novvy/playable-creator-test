// In-memory assembly fixture; no browser, SDK or platform evidence is fabricated.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/host.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
async function fixture({allowReplay=true,policy={enabled:true,mode:'steps',afterSteps:20,intervals:[10,8,6,4]},intro=false,failInitial=false}={}){
  class Element extends EventTarget{hidden=true;disabled=false;style={setProperty(){}};clientWidth=390;clientHeight=844;getBoundingClientRect(){return{top:720,bottom:115};}}
  const root=new Element(),status=new Element(),replay=new Element(),card=new Element();
  const nodes={'zen-game':root,'zen-status':status,'zen-replay':replay,'novvy-cta':card};
  const document=Object.assign(new EventTarget(),{hidden:false,getElementById:id=>nodes[id]||null,createElement:()=>new Element(),body:{append(){}},documentElement:{style:{setProperty(){}}}});
  const calls=[],instances=[];let now=1000,failLoad=failInitial,finishStart=null,holdStart=false;
  const window=Object.assign(new EventTarget(),{ZEN_CONFIG:{intro,title:false,allowReplay,policy},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStart','onStep','onComplete','onReplay','endStage','click'].map(name=>[name,(...args)=>calls.push([name,...args])]))});
  vm.runInNewContext(code,{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>now},CustomEvent,console:{error(){},warn(){}}});
  const factory=async(_root,shell)=>{if(failLoad)throw new Error('fixture load failure');const game={shell,start(){return holdStart?new Promise(resolve=>finishStart=resolve):Promise.resolve();},destroy(){game.destroyed=true;},pause(){game.paused=true;},resume(){game.paused=false;},setEnv(){}};instances.push(game);return game;};
  window.NovvyGame(factory);await flush();
  return{calls,instances,document,window,replay,advance(){now+=1100;},hold(){holdStart=true;},release(){holdStart=false;finishStart();},fail(value){failLoad=value;},emit(name){window.dispatchEvent(new Event(name));}};
}
const f=await fixture(),shell=f.instances[0].shell;
for(let i=1;i<=60;i++){f.advance();shell.step(i);}
assert.deepEqual(f.calls.map((call,index)=>call[0]==='click'?f.calls[index-1][1]:null).filter(x=>x!==null),[20,30,38,44,48,52,56,60],'first 20, then 10/8/6/4, repeating final interval');
assert.ok(f.calls.filter(c=>c[0]==='click').every(c=>c[1].click_source==='forced_click_to_appstore'));
f.emit('novvy:cta-interact');assert.equal(f.calls.filter(c=>c[0]==='click').length,8,'same-second manual/step CTA shares cooldown');
f.advance();f.emit('novvy:cta-interact');assert.equal(f.calls.at(-1)[1].click_source,'cta_click');
shell.win();shell.win();assert.equal(f.calls.filter(c=>c[0]==='onComplete').length,1);assert.equal(f.calls.at(-1)[1].continue_playing,true);
assert.equal(f.replay.hidden,false);f.hold();f.replay.dispatchEvent(new Event('click'));f.replay.dispatchEvent(new Event('click'));await flush();
assert.equal(f.instances.length,2,'double replay creates one instance');assert.equal(f.calls.filter(c=>c[0]==='onReplay').length,0,'replay report waits for scene start');
f.release();await flush();assert.equal(f.calls.filter(c=>c[0]==='onReplay').length,1);
const before=f.calls.filter(c=>c[0]==='click').length;
for(let i=0;i<19;i++){f.advance();f.instances[1].shell.step(i);}
assert.equal(f.calls.filter(c=>c[0]==='click').length,before,'replay resets first threshold');
f.advance();f.instances[1].shell.step(20);assert.equal(f.calls.filter(c=>c[0]==='click').length,before+1);
f.instances[1].shell.fail();f.fail(true);f.replay.dispatchEvent(new Event('click'));await flush();
assert.equal(f.replay.hidden,false);assert.equal(f.replay.disabled,false);assert.equal(f.calls.filter(c=>c[0]==='onReplay').length,1,'failed reload keeps retry and sends no replay');
f.fail(false);f.replay.dispatchEvent(new Event('click'));await flush();assert.equal(f.calls.filter(c=>c[0]==='onReplay').length,2);
assert.equal(f.calls.filter(c=>c[0]==='setStage').length,1,'replay stays in current stage');
const off=await fixture({allowReplay:false,policy:{enabled:false,mode:'steps',afterSteps:20,intervals:[10,8,6,4]}});
for(let i=0;i<33;i++)off.instances[0].shell.step(i);off.instances[0].shell.win();off.replay.dispatchEvent(new Event('click'));await flush();
assert.equal(off.calls.filter(c=>c[0]==='click').length,0);assert.equal(off.replay.hidden,true);assert.equal(off.instances.length,1);
const intro=await fixture({intro:true});intro.instances[0].shell.step(10);assert.equal(intro.calls.filter(c=>c[0]==='onStep').length,0);
intro.emit('novvy:intro-finished');await flush();intro.advance();intro.instances[0].shell.step(10);assert.equal(intro.calls.filter(c=>c[0]==='onStep').length,1);
console.log('Zen Word host: CTA cadence/classification/cooldown, replay readiness/reset/failure, intro gates passed');
const initial=await fixture({failInitial:true});initial.fail(false);initial.replay.dispatchEvent(new Event('click'));await flush();
assert.equal(initial.instances.length,1);assert.equal(initial.calls.filter(c=>c[0]==='onReplay').length,0,'initial load recovery is not a gameplay replay');
