import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url), read=f=>fs.readFileSync(new URL(f,root),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../../../editor/templates/zen-word-92m-origin/game-manifest.json',import.meta.url)));
const builtRoot=new URL('../../../editor/templates/zen-word-92m-origin/',import.meta.url);
const layoutContext={};vm.runInNewContext(read('src/layout.js'),layoutContext);
const compiled=fs.readFileSync(new URL('game/game.js',builtRoot),'utf8');
const source=JSON.parse(compiled.match(/^const SOURCE=(.*);$/m)[1]);
assert.equal(Object.keys(source.layout).length,7,'all original locales have measured geometry');
for(const [width,height] of [[390,844],[320,568],[844,390]])for(const hud of [false,true])for(const card of [false,true]){
  const env={safeArea:{top:height>width?59:0,bottom:34},insets:{top:hud?(height>width?125:64):0,bottom:card?(height>width?132:108):0}};
  const rects=layoutContext.zenLayoutRects(width,height,env);
  for(const key of ['board','wheel']){
    const r=rects[key];assert.ok(r.x>=0&&r.y>=env.insets.top,`${key} clears HUD`);
    assert.ok(r.width>0&&r.height>0&&r.x+r.width<=width&&r.y+r.height<=height-Math.max(env.safeArea.bottom,env.insets.bottom),`${key} stays in safe content region`);
  }
  assert.ok(width>height?rects.board.x+rects.board.width<rects.wheel.x:rects.board.y+rects.board.height<rects.wheel.y,'board and wheel do not overlap');
}
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
  const bytes=fs.readFileSync(new URL(file,builtRoot));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,file);
  if(file.endsWith('.js'))new vm.Script(bytes.toString('utf8'),{filename:file});
}
assert.equal(manifest.levels.length,1,'one fixed playable per template');
assert.equal(manifest.levels[0].id,1);
assert.equal(manifest.levels[0].game,'game/game.js');
assert.deepEqual(fs.readdirSync(new URL('game/',builtRoot)).sort(),['cta-icon.png','game.js','host.js','index.html']);
// Exercise the actual frozen native Start, NextStep and SetColor coroutine.
// Graphics/scheduling are in-memory fixtures, not platform runtime evidence.
const classStart=source.engine.indexOf('Bridge.define("LetterManager",');
const classEnd=source.engine.indexOf('Bridge.define(',classStart+20);
assert.ok(classStart>0&&classEnd>classStart,'native LetterManager anchor exists');
const nativeDefinition=source.engine.slice(classStart,classEnd).replace(/,$/,';');
const list=(items=[])=>({items,get Count(){return this.items.length;},getItem(i){return this.items[i];},clear(){this.items=[];}});
async function fixture(total=21,holdNativeStart=false){
  const calls=[],lifecycle=[];let entry,now=1000,definition,pendingStart;
  class LunaManager{isGameOver=false;GameOver(){this.isGameOver=true;this.nativeWins=(this.nativeWins||0)+1;}Update(){}}
  const manager=new LunaManager();LunaManager.instance=manager;
  const UnityEngine={MonoBehaviour:class{},AudioListener:{volume:0},Input:{GetMouseButtonDown:()=>true},UI:{Image:class{}},WaitForSeconds:class{constructor(seconds){this.seconds=seconds;}},Debug:{Log$1(){}}};
  const Bridge={define(_name,value){definition=value;},fn:{bind:(receiver,fn)=>fn.bind(receiver)},GeneratorEnumerator:class{constructor(next){this.moveNext=next;}},is:()=>false,getEnumerator(collection){let index=-1;return{moveNext:()=>++index<collection.Count,get Current(){return collection.getItem(index);}};}};
  vm.runInNewContext(nativeDefinition,{Bridge,UnityEngine,LunaManager,System:{Exception:{create:e=>e}},pc:{Vec2:class{},Color:class{}}});
  class LetterManager{constructor(){
    this.StepCount=5;this.StepIndex=0;
    this.mBlocks=list(Array.from({length:total},()=>({mNumber:list([0,1]),mImages:list()})));
    this.mAlphablockPoints=list([0,1].map(()=>({transform:{position:{$clone:()=>({})}}})));
    this.mTip={SetActive(){},transform:{}};this.mWaitTime=0;
    this.mBlockNumber=list();this.mAlphablocks=list();this.mLineRenderers=list();this.mImages=list();this.mTipSprite=list();
    this.mImageTip={gameObject:{SetActive(){}},GetComponent:()=>({})};
  }StartCoroutine$1(coroutine){while(coroutine.moveNext()){};}}
  Object.assign(LetterManager.prototype,definition.methods);
  const view={root:{style:{},querySelector(){return null;},querySelectorAll(){return[];}},mount:{style:{},remove(){lifecycle.push('remove');}}};
  const w={requestAnimationFrame:fn=>fn(),dispatchEvent(){},Luna:{Unity:{Playable:{},LifeCycle:{},Analytics:{}}},LetterManager,LunaManager,UnityEngine,pc:{TextGenerator:{}},$environment:{packageConfig:{}}};
  class Application{app={pause:()=>lifecycle.push('pause'),resume:()=>lifecycle.push('resume'),destroy:()=>lifecycle.push('destroy'),muteAudio(){},unmuteAudio(){}};InitializeAsync(){return{continueWith:fn=>fn({})};}StartWithJSCallback(fn){lifecycle.push('start');if(holdNativeStart)pendingStart=fn;else fn();}}
  Application.StartupScene=class{};w.LunaUnity={Application};
  const scope={window:w,run(){},audioContexts:new Set(),audioElements:new Set(),pause:()=>lifecycle.push('scopePause'),resume:()=>lifecycle.push('scopeResume'),dispose:()=>lifecycle.push('dispose')};
  const shell=Object.fromEntries(['step','win','fail','end','cta'].map(name=>[name,(...args)=>calls.push([name,...args])]));
  vm.runInNewContext(read('src/game.js'),{NovvyGame:fn=>entry=fn,SOURCE:{variant:'92m',markup:'',css:'',config:'',engine:'',jsons:{},sounds:{},blobs:{}},engineRoot:()=>view,createEngineScope:()=>scope,installZenLayout(){},structuredClone,Event,atob,console,performance:{now:()=>now}});
  const instancePromise=entry({},shell,{env:{muted:true}});
  if(holdNativeStart){await Promise.resolve();await Promise.resolve();return {instancePromise,releaseNativeStart(){pendingStart();}};}
  const instance=await instancePromise;
  assert.equal(calls.length,0,'no events before start');assert.ok(lifecycle.includes('start')&&lifecycle.includes('scopePause'),'ready includes the prepared, paused first scene');
  const letters=new LetterManager();letters.Start();
  return {instance,calls,lifecycle,letters,manager,releaseNativeStart(){pendingStart();},advance(){now+=1000;},submit(valid){
    // Native Update removes the matching block before calling SetColor.
    const block=valid?letters.mBlocks.items.shift():null;
    return letters.SetColor(valid,block);
  }};
}
const drain=generator=>{while(generator.moveNext()){};};
const c=await fixture();await c.instance.start();
assert.equal(c.letters.StepCount,0,'native submission cutoff disabled');
for(let i=0;i<8;i++)drain(c.submit(false));
assert.equal(c.manager.isGameOver,false,'more than five wrong submissions remain playable');
assert.equal(c.calls.length,0,'wrong submissions do not emit steps');
c.manager.GameOver();assert.equal(c.manager.isGameOver,false,'early native GameOver cannot finish the puzzle');
for(let i=0;i<5;i++)drain(c.submit(true));
assert.equal(c.calls.length,5);assert.equal(c.calls.at(-1)[1],5/21*100);
assert.equal(c.manager.isGameOver,false,'five correct words do not finish');
for(let i=5;i<20;i++)drain(c.submit(true));
assert.equal(c.manager.isGameOver,false,'20 of 21 is not completion');
const final=c.submit(true);
assert.deepEqual(c.calls.at(-1),['step',100]);
assert.equal(final.moveNext(),true);assert.equal(final.current.seconds,.5);
assert.equal(final.moveNext(),true);assert.equal(final.current.seconds,1.5);
assert.equal(c.calls.filter(v=>v[0]==='win').length,0,'win waits for the original final-word animation');
assert.equal(final.moveNext(),false);c.manager.GameOver();
assert.equal(c.manager.nativeWins,1,'native result runs once');
assert.deepEqual(c.calls.slice(-2),[['step',100],['win']]);
assert.equal(c.calls.filter(v=>v[0]==='step').length,21);
c.manager.Update();c.manager.Update();assert.equal(c.calls.filter(v=>v[0]==='cta').length,0,'native ending never converts');
c.instance.pause();const count=c.calls.length;c.manager.Update();assert.equal(c.calls.length,count);c.instance.resume();c.manager.Update();assert.equal(c.calls.length,count);
c.instance.destroy();c.instance.destroy();assert.equal(c.lifecycle.filter(v=>v==='destroy').length,1);
const d=await fixture(7);await d.instance.start();
const first=d.letters.mBlocks.items.shift();drain(d.letters.SetColor(true,first));
d.letters.SetColor(true,first);assert.equal(d.calls.length,1,'duplicate callback does not emit another step');
for(let i=1;i<7;i++)drain(d.submit(true));
assert.deepEqual(d.calls.slice(-2),[['step',100],['win']],'goal follows actual locale/board size');
const delayed=await fixture(21,true);let ready=false;const pending=delayed.instancePromise.then(()=>ready=true);
await Promise.resolve();assert.equal(ready,false,'ready waits for native first scene');delayed.releaseNativeStart();await pending;assert.equal(ready,true);
console.log('Zen Word 92m: integrity, responsive bounds, native submission cutoff, all-word coroutine completion, progress, lifecycle and host-owned CTA passed');
