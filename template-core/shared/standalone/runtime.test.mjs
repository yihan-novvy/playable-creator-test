import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createStandaloneEntry} from './runtime.js';
import {IDS,ROOT} from './build.mjs';
import {createHash} from 'node:crypto';

class Element extends EventTarget {
  style={}; children=[]; clientWidth=390; clientHeight=844;
  appendChild(node){this.children.push(node);node.parent=this;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
}
globalThis.document={createElement:()=>new Element()};
async function fixture(options={},metadata={id:'fixture',levelCount:1}) {
  const instances=[],events=[],local=[],root=new Element();
  const shell=Object.fromEntries(['step','win','fail','retry','level','end','sound','haptic'].map(name=>[name,(...args)=>events.push([name,...args])]));
  const entry=createStandaloneEntry(async(container,bridge,settings)=>{
    const instance={bridge,settings,starts:0,pauses:0,resumes:0,disposals:0,
      start(){this.starts++;},pause(){this.pauses++;},resume(){this.resumes++;},setEnv(env){this.env=env;},destroy(){this.disposals++;}};
    instances.push(instance);return instance;
  },metadata);
  const runtime=await entry(root,shell,{onEvent:event=>local.push(event),...options});
  return {runtime,events,local,instances,root};
}
test('one ready instance, lifecycle gates input, defaults to terminal result',async()=>{
  const f=await fixture({env:{muted:true}}),n=f.instances[0],r=f.runtime;
  assert.equal(await r.init(),r);assert.equal(f.instances.length,1);
  assert.equal(r.getState().started,false);assert.equal(n.env.muted,true);
  n.bridge.step(25);n.bridge.win();assert.deepEqual(f.events,[]);
  const input=new Event('click',{cancelable:true});f.root.children[0].dispatchEvent(input);assert.equal(input.defaultPrevented,true);
  await Promise.all([r.start(),r.start()]);assert.equal(n.starts,1);
  n.bridge.step(25);r.pause();n.bridge.step(50);assert.equal(f.events.length,1);
  r.setMuted(false);assert.equal(n.env.muted,false);assert.equal(f.events.length,1,'host mute is not a user sound event');
  r.resume();n.bridge.step(100);n.bridge.win();n.bridge.fail();n.bridge.step(100);
  assert.deepEqual(f.events,[['step',25],['step',100],['win',undefined]]);
  assert.equal(r.getState().ended,true);assert.equal(await r.replay(),false);
  r.destroy();r.destroy();assert.equal(n.disposals,1);assert.equal(f.root.children.length,0);
  assert.deepEqual(f.local.filter(e=>e.type==='result').map(e=>e.result),['win']);
});
test('host-controlled retry replaces only its own instance and rejects stale callbacks',async()=>{
  const f=await fixture({allowReplay:true}),r=f.runtime,first=f.instances[0];
  await r.start();first.bridge.step(40);first.bridge.fail();assert.equal(r.getState().canReplay,true);
  assert.deepEqual(f.events.at(-1),['fail',{continuePlaying:true}]);
  assert.equal(await r.replay(),true);const second=f.instances[1];
  assert.equal(first.disposals,1);assert.equal(second.starts,1);
  first.bridge.step(100);first.bridge.win();assert.deepEqual(f.events.at(-1),['retry']);
  second.bridge.step(25);assert.equal(r.getState().progress,40,'retry progress stays cumulative');
  second.bridge.win();assert.equal(r.end(),true);assert.equal(r.end(),false);
  assert.deepEqual(f.events.at(-1),['end']);assert.equal(await r.replay(),false);
  r.destroy();
});
test('host can preserve native result rendering without accepting more gameplay',async()=>{
  const f=await fixture({keepResultScene:true}),r=f.runtime,n=f.instances[0];
  await r.start();const pauses=n.pauses;
  n.bridge.fail();
  assert.deepEqual(f.events,[['fail',undefined]],'failure is reported immediately');
  assert.equal(n.pauses,pauses,'native delayed result animation is not paused by settlement');
  assert.equal(r.getState().ended,true);assert.equal(r.getState().paused,false);
  const input=new Event('click',{cancelable:true});f.root.children[0].dispatchEvent(input);
  assert.equal(input.defaultPrevented,true,'keeping the scene does not unlock gameplay');
  n.bridge.step(100);n.bridge.win();n.bridge.fail();assert.equal(f.events.length,1);
  r.pause();assert.equal(n.pauses,pauses+1,'backgrounding still pauses the native scene');
  r.resume();assert.equal(n.resumes,1,'returning resumes the result presentation');
  assert.equal(r.end(),false,'an already reported terminal result is not reported twice');
  r.resume();assert.equal(n.resumes,1,'explicit end stops presentation permanently');
  r.destroy();assert.equal(n.disposals,1);
});
test('continued result rendering ends cleanly on replay or explicit end',async()=>{
  const f=await fixture({keepResultScene:true,allowReplay:true}),r=f.runtime,n=f.instances[0];
  await r.start();n.bridge.fail();assert.equal(r.getState().canReplay,true);
  assert.equal(await r.replay(),true);assert.equal(n.disposals,1);
  const next=f.instances[1];next.bridge.fail();assert.equal(r.end(),true);
  const resumes=next.resumes;r.resume();assert.equal(next.resumes,resumes);
  assert.deepEqual(f.events.map(event=>event[0]),['fail','retry','fail','end']);r.destroy();
});
test('multi-level progression is sequential and resets per-level progress',async()=>{
  const f=await fixture({}, {id:'campaign',levelCount:2}),r=f.runtime,n=f.instances[0];await r.start();
  n.bridge.level(2);assert.equal(f.events.length,0);
  n.bridge.step(100);n.bridge.win({continuePlaying:true});n.bridge.level(3);assert.equal(r.getState().level,1);
  n.bridge.level(2);assert.equal(r.getState().progress,0);assert.equal(r.getState().steps,0);
  n.bridge.step(50);n.bridge.win();assert.equal(r.getState().ended,true);
  assert.deepEqual(f.events.map(e=>e[0]),['step','win','level','step','win']);r.destroy();
});
test('environment merges, subscriptions unsubscribe, and explicit skip ends a paused game',async()=>{
  const f=await fixture({env:{viewport:{width:390,height:844},insets:{top:20,bottom:30}}}),r=f.runtime;
  const seen=[];const off=r.on('*',e=>seen.push(e.type));
  r.resize({width:844});r.setInsets({bottom:50});assert.equal(r.getState().env.viewport.height,844);assert.equal(r.getState().env.insets.top,20);
  r.getState().env.insets.top=999;assert.equal(r.getState().env.insets.top,20);
  off();await r.start();r.pause();assert.equal(r.end(),true);assert.deepEqual(seen,['env','env']);
  assert.equal('cta' in f.instances[0].bridge,false,'conversion is exclusively host-owned');r.destroy();
});
test('destroy during asynchronous replay cleans up the late native instance',async()=>{
  let resolve,bridge,created=0,disposed=0;
  const entry=createStandaloneEntry(async(_root,b)=>{bridge=b;const value={start(){},pause(){},resume(){},setEnv(){},destroy(){disposed++;}};if(++created===2)await new Promise(r=>resolve=r);return value;},{id:'slow',levelCount:1});
  const shell={win(){},retry(){throw new Error('Destroyed replay cannot emit retry');}};
  const r=await entry(new Element(),shell,{allowReplay:true});await r.start();bridge.win();const pending=r.replay();r.destroy();resolve();assert.equal(await pending,false);assert.equal(disposed,2);
});
test('visibility pause cannot be lost during start or asynchronous replay',async()=>{
  const f=await fixture(),r=f.runtime;
  const start=r.start();r.pause();await start;assert.equal(r.getState().paused,true);r.destroy();
  let bridge,release,count=0;
  const entry=createStandaloneEntry(async(_root,b)=>{bridge=b;if(++count===2)await new Promise(resolve=>release=resolve);return {start(){},pause(){},resume(){},setEnv(){},destroy(){}};},{id:'visibility',levelCount:1});
  const game=await entry(new Element(),{win(){},retry(){}},{allowReplay:true});await game.start();bridge.win();const retry=game.replay();game.pause();release();await retry;
  assert.equal(game.getState().paused,true);game.resume();assert.equal(game.getState().paused,false);game.destroy();
});
test('14 complete single-file packages register synchronously and meet the raw upload budget',()=>{
  const catalog=JSON.parse(fs.readFileSync(ROOT+'editor/templates/standalone-catalog.json'));
  assert.deepEqual(catalog.games.map(x=>x.id),IDS);
  for(const game of catalog.games){
    const bytes=fs.readFileSync(ROOT+game.file);assert.equal(bytes.length,game.bytes);assert(bytes.length<=5000000);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),game.sha256);
    let count=0;vm.runInNewContext(bytes.toString(),{atob,TextDecoder,NovvyGame(entry){assert.equal(typeof entry,'function');count++;}},{timeout:5000});assert.equal(count,1,game.id);
    assert(!/^(colorever|escape-arrow|dragon-cube)/.test(game.id));
  }
});
