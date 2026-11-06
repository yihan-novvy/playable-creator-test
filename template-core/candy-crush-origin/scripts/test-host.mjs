// In-memory product-host checks; these are not official platform event evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/host.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function fixture({intro=false,ctaEnabled=true,policy={enabled:false,mode:'steps',afterSteps:4,intervals:[4,3,2]}}={}){
  class Element extends EventTarget{hidden=true;style={setProperty(){}};clientWidth=390;clientHeight=844;offsetHeight=124;getBoundingClientRect(){return{top:734,bottom:844};}}
  const nodes=Object.fromEntries(['ccs-game','ccs-status','ccs-replay','ccs-continue','novvy-cta'].map(id=>[id,new Element()]));
  const document=Object.assign(new EventTarget(),{hidden:false,getElementById:id=>nodes[id]||null,createElement:()=>new Element(),body:{append(){}},documentElement:{style:{setProperty(){}}}});
  const calls=[],instances=[];let now=1000;
  const window=Object.assign(new EventTarget(),{CCS_CONFIG:{intro,title:false,allowReplay:true,ctaEnabled,policy},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStart','onStep','onComplete','onReplay','endStage','click'].map(name=>[name,(...args)=>calls.push([name,...args])]))});
  window.addEventListener('novvy:cta-card',()=>{if(ctaEnabled)nodes['novvy-cta'].hidden=false;});
  vm.runInNewContext(code,{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>now},CustomEvent,console,queueMicrotask});
  window.NovvyGame(async(_root,shell)=>{const game={shell,start(){},destroy(){},pause(){},resume(){},setEnv(env){game.env=env;}};instances.push(game);return game;});
  await flush();
  return{window,document,nodes,calls,instances,advance(){now+=1100;},emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}};
}
const clicks=f=>f.calls.filter(c=>c[0]==='click');
const f=await fixture({intro:true});
assert.equal(f.nodes['novvy-cta'].hidden,true,'card stays hidden throughout intro');
f.emit('novvy:cta-interact');assert.equal(clicks(f).length,0);
f.emit('novvy:intro-finished');await flush();
assert.equal(f.nodes['novvy-cta'].hidden,false);
assert.equal(f.instances[0].env.insets.bottom,132,'full card height reserved even during slide-in');
f.emit('novvy:cta-interact');f.emit('novvy:cta-interact');
assert.equal(clicks(f).length,1,'one-second card debounce');
assert.equal(clicks(f)[0][1].click_source,'cta_click');
f.advance();f.document.hidden=true;f.emit('novvy:cta-interact');assert.equal(clicks(f).length,1);
f.document.hidden=false;f.emit('novvy:viewablechange',{viewable:false});f.emit('novvy:cta-interact');assert.equal(clicks(f).length,1);
f.emit('novvy:viewablechange',{viewable:true});f.emit('novvy:cta-interact');assert.equal(clicks(f).length,2,'card works after return');
for(let i=1;i<=17;i++)f.instances[0].shell.step(i/17*100);
f.instances[0].shell.win();assert.equal(clicks(f).length,2,'disabled step policy never opens a store');
f.advance();f.nodes['ccs-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(f.instances.length,2);assert.equal(clicks(f).length,2,'replay is not a store control');
assert.equal(f.calls.filter(c=>c[0]==='setStage').length,2,'replay retains the playable stage');
f.emit('novvy:cta-interact');assert.equal(clicks(f).length,3,'card remains usable after replay');
const off=await fixture({ctaEnabled:false});off.emit('novvy:cta-interact');assert.equal(clicks(off).length,0);assert.equal(off.instances[0].env.insets.bottom,0,'disabled card gives space back');
const policy={enabled:true,mode:'steps',afterSteps:4,intervals:[4,3,2]};
const s=await fixture({intro:true,ctaEnabled:false,policy});
s.instances[0].shell.step(10);assert.equal(s.calls.filter(c=>c[0]==='onStep').length,0,'intro cannot consume steps');
s.emit('novvy:intro-finished');await flush();
for(let i=1;i<=17;i++){s.advance();s.instances[0].shell.step(i/17*100);}
assert.deepEqual(clicks(s).map(c=>c[1].step),[4,8,11,13,15,17],'first threshold, each gap, then repeat last gap');
assert.ok(clicks(s).every(c=>c[1].click_source==='forced_click_to_appstore'&&c[1].auto_jump==='true'&&c[1].auto_jump_mode==='steps'),'step policy attribution is fixed');
s.advance();s.instances[0].shell.win();assert.equal(clicks(s).length,6,'win does not duplicate an earlier automatic jump');
s.nodes['ccs-replay'].dispatchEvent(new Event('click'));await flush();
assert.equal(clicks(s).length,6,'replay itself does not jump');
for(let i=1;i<=4;i++){s.advance();s.instances[1].shell.step(i/17*100);}
assert.equal(clicks(s).at(-1)[1].step,4,'replay resets the first threshold and round step count');
const once=await fixture({policy:{...policy,afterSteps:2,intervals:[]}});
for(let i=1;i<=17;i++){once.advance();once.instances[0].shell.step(i/17*100);}
once.advance();once.instances[0].shell.win();assert.equal(clicks(once).length,1,'empty intervals trigger once only');
const fallback=await fixture({policy:{...policy,afterSteps:20}});
for(let i=1;i<=17;i++){fallback.advance();fallback.instances[0].shell.step(i/17*100);}
fallback.instances[0].shell.win();fallback.instances[0].shell.win();
assert.equal(clicks(fallback).length,1);assert.equal(clicks(fallback)[0][1].auto_jump_mode,'win','win fallback applies before first threshold');
const failed=await fixture({policy});failed.instances[0].shell.fail();assert.equal(clicks(failed).length,0,'failure has no automatic win jump');
const cooldown=await fixture({policy:{...policy,afterSteps:1,intervals:[2]}});
cooldown.emit('novvy:cta-interact');cooldown.instances[0].shell.step(6);assert.equal(clicks(cooldown).length,1,'manual and automatic CTA share cooldown');
cooldown.document.hidden=true;cooldown.advance();cooldown.instances[0].shell.step(12);
cooldown.document.hidden=false;cooldown.emit('novvy:viewablechange',{viewable:false});cooldown.instances[0].shell.step(12);
assert.equal(cooldown.calls.filter(c=>c[0]==='onStep').length,1,'hidden or nonviewable inputs do not consume steps');
cooldown.emit('novvy:viewablechange',{viewable:true});cooldown.instances[0].shell.step(12);
assert.equal(clicks(cooldown).at(-1)[1].step,2,'cooldown retains pending threshold until another valid step');
cooldown.advance();cooldown.instances[0].shell.step(18);assert.equal(clicks(cooldown).length,2);
cooldown.advance();cooldown.instances[0].shell.step(24);assert.equal(clicks(cooldown).at(-1)[1].step,4,'next gap starts at actual jump step');
console.log('Candy Crush Saga host: card, step schedule, single jump, win fallback, cooldown, visibility, intro and replay checks passed.');

const complete=await fixture({policy:{enabled:true,mode:"complete",afterSteps:1,intervals:[1]}});for(let i=1;i<=5;i++){complete.advance();complete.instances[0].shell.step(i*20);}assert.equal(clicks(complete).length,0);complete.instances[0].shell.win();assert.equal(clicks(complete).length,1);assert.equal(clicks(complete)[0][1].auto_jump_mode,"win");
const nativeRound=await fixture({policy:{enabled:true,mode:'steps',afterSteps:3,intervals:[2]}});
for(let i=1;i<=5;i++){nativeRound.advance();nativeRound.instances[0].shell.step(i*20);}
nativeRound.advance();nativeRound.instances[0].shell.win();assert.deepEqual(clicks(nativeRound).map(c=>c[1].step),[3,5]);
assert.ok(complete.calls.findIndex(c=>c[0]==='onComplete')<complete.calls.findIndex(c=>c[0]==='click'),'settle the real result before the store request');
