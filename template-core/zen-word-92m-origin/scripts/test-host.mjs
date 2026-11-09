// In-memory assembly fixture. These assertions are not production SDK evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../src/host.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
async function fixture({allowReplay=true,policy, intro=false,initialFailure=false}={}){
  class Element extends EventTarget{hidden=true;disabled=false;style={setProperty(){}};clientWidth=390;clientHeight=844;getBoundingClientRect(){return{top:720,bottom:115};}focus(){this.focused=true;}}
  const root=new Element(),status=new Element(),replay=new Element(),card=new Element(),dialog=new Element(),heading=new Element(),copy=new Element();
  const nodes={'zen-game':root,'zen-status':status,'zen-replay':replay,'novvy-cta':card,'zen-result':dialog,'zen-result-title':heading,'zen-result-copy':copy};
  const document=Object.assign(new EventTarget(),{hidden:false,getElementById:id=>nodes[id]||null,createElement:()=>new Element(),body:{append(){}},documentElement:{style:{setProperty(){}}}});
  const calls=[],instances=[],timers=new Map();let now=1000,failLoad=initialFailure,finishStart=null,holdStart=false,timerId=0;
  const window=Object.assign(new EventTarget(),{ZEN_CONFIG:{intro,title:false,allowReplay,policy},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStart','onStep','onComplete','onReplay','endStage','click'].map(name=>[name,(...args)=>calls.push([name,...args])]))});
  vm.runInNewContext(code,{URLSearchParams,location:{search:""},window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>now},CustomEvent,console:{error(){},warn(){}},setTimeout(fn,delay){timers.set(++timerId,{fn,at:now+delay});return timerId;},clearTimeout:id=>timers.delete(id)});
  const factory=async(_root,shell)=>{if(failLoad)throw new Error('fixture load failure');const id=instances.length;const game={shell,start(){calls.push(['start',id]);return holdStart?new Promise(resolve=>finishStart=resolve):Promise.resolve();},destroy(){calls.push(['destroy',id]);game.destroyed=true;},pause(){game.paused=true;},resume(){game.paused=false;},setEnv(){}};instances.push(game);return game;};
  window.NovvyGame(factory);await flush();
  return{calls,instances,document,window,replay,root,dialog,heading,copy,advance(ms=1100){now+=ms;for(const [id,timer]of timers)if(timer.at<=now){timers.delete(id);timer.fn();}},hold(){holdStart=true;},release(){holdStart=false;finishStart();},fail(value){failLoad=value;},emit(name){window.dispatchEvent(new Event(name));}};
}
const events=(f,name)=>f.calls.filter(c=>c[0]===name);
const tap=f=>f.replay.dispatchEvent(new Event('click'));
const f=await fixture(),shell=f.instances[0].shell;
for(let i=1;i<=21;i++){f.advance();shell.step(i);}
assert.deepEqual(events(f,'click').map(c=>c[1].step),[4,8,11,13,14,15,16,17,18,19,20,21],'4 then 4,3,2,1 and repeat 1');
assert.ok(events(f,'click').every(c=>c[1].click_source==='forced_click_to_appstore'&&c[1].auto_jump==='true'));
assert.equal(events(f,'onStep').length,21);assert.equal(f.dialog.hidden,true,'step CTA never settles gameplay');
f.advance();
shell.win();shell.win();shell.fail();
assert.equal(events(f,'onComplete').length,1);assert.equal(events(f,'onComplete')[0][1].continue_playing,true);
assert.equal(f.dialog.hidden,false);assert.equal(f.dialog.focused,true);assert.equal(f.heading.textContent,'All words found!');assert.match(f.copy.textContent,/Play again/);assert.equal(f.replay.textContent,'Play again');
assert.equal(events(f,'endStage').length,0,'replay keeps the playable stage open');
const mark=f.calls.length;f.hold();tap(f);tap(f);await flush();
assert.equal(f.instances.length,2);assert.equal(events(f,'onReplay').length,0,'replay waits for start readiness');
assert.deepEqual(f.calls.slice(mark).map(c=>c[0]),['click','destroy','start'],'CTA precedes destruction and new round start');
assert.equal(f.calls[mark][1].click_source,'forced_click_to_appstore');assert.equal(f.calls[mark][1].scene,'playable-replay');
f.release();await flush();assert.equal(events(f,'onReplay').length,1);assert.equal(f.dialog.hidden,true);
for(let i=1;i<=3;i++){f.advance();f.instances[1].shell.step(i);}
assert.equal(events(f,'click').length,13,'new round resets first-jump threshold');
f.advance();f.instances[1].shell.step(95);assert.equal(events(f,'click').at(-1)[1].step,4);
f.instances[1].shell.fail();assert.equal(f.replay.textContent,'Try again');assert.equal(f.replay.disabled,true,'replay respects shared one-second cooldown');
const beforeCooldown=events(f,'click').length;tap(f);await flush();assert.equal(f.instances.length,2);
f.advance();assert.equal(f.replay.disabled,false);assert.equal(events(f,'click').length,beforeCooldown,'cooldown timer never opens store');
f.fail(true);const failedMark=f.calls.length;tap(f);await flush();
assert.equal(f.calls[failedMark][0],'click');assert.equal(f.calls[failedMark+1][0],'destroy');
assert.equal(f.heading.textContent,'Unable to load');assert.equal(f.replay.textContent,'Retry loading');assert.equal(f.replay.disabled,false);
const beforeRetry=events(f,'click').length;f.fail(false);tap(f);await flush();
assert.equal(events(f,'click').length,beforeRetry,'load recovery does not monetize failed loading');assert.equal(events(f,'onReplay').length,2);
assert.equal(events(f,'setStage').length,1,'replay never repeats stage or intro');
f.root.dispatchEvent(new Event('pointerdown'));f.root.dispatchEvent(new Event('pointerdown'));assert.equal(events(f,'onStart').length,1);
f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.instances.at(-1).paused,true);
const beforeHidden=events(f,'onStep').length;f.instances.at(-1).shell.step(50);f.emit('novvy:cta-interact');assert.equal(events(f,'onStep').length,beforeHidden);assert.equal(events(f,'click').length,beforeRetry);
f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.instances.at(-1).paused,false);
const off=await fixture({allowReplay:false,policy:{enabled:false}});for(let i=0;i<25;i++)off.instances[0].shell.step(i);
assert.equal(events(off,'click').length,0);off.instances[0].shell.win();tap(off);await flush();assert.equal(off.dialog.hidden,false);assert.equal(off.replay.hidden,true);assert.equal(off.instances.length,1);assert.equal(events(off,'onComplete')[0][1].continue_playing,false);
const intro=await fixture({intro:true});intro.instances[0].shell.step(20);assert.equal(events(intro,'onStep').length,0);
intro.emit('novvy:cta-interact');assert.equal(events(intro,'click').length,0,'banner waits for playable start');
intro.emit('novvy:intro-finished');intro.emit('novvy:intro-finished');await flush();intro.instances[0].shell.step(20);assert.equal(events(intro,'onStep').length,1);assert.equal(events(intro,'setStage').length,2);
intro.emit('novvy:cta-interact');assert.equal(events(intro,'click').at(-1)[1].click_source,'cta_click');
intro.instances[0].shell.cta('forced_click_to_appstore');assert.equal(events(intro,'click').length,1,'all entrances share debounce');
intro.advance();intro.instances[0].shell.cta('forced_click_to_appstore');assert.equal(events(intro,'click').at(-1)[1].click_source,'forced_click_to_appstore');
const load=await fixture({initialFailure:true});assert.equal(load.replay.textContent,'Retry loading');load.fail(false);tap(load);await flush();assert.equal(load.instances.length,1);assert.equal(events(load,'click').length,0);assert.equal(events(load,'onReplay').length,0,'first successful load is not a replay');
console.log('Zen Word 92m host: CTA cadence, completion dialog, CTA-before-replay, cooldown, failed-load recovery, replay reset, disabled replay, intro/visibility gates passed');
