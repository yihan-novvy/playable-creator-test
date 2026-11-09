import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url), read=f=>fs.readFileSync(new URL(f,root),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../../../editor/templates/zen-word-100m-origin/game-manifest.json',import.meta.url)));
const builtRoot=new URL('../../../editor/templates/zen-word-100m-origin/',import.meta.url);
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
  const bytes=fs.readFileSync(new URL(file,builtRoot));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,file);
  if(file.endsWith('.js'))new vm.Script(bytes.toString('utf8'),{filename:file});
}
assert.equal(manifest.levels.length,1,'one fixed playable per template');
assert.equal(manifest.levels[0].id,1);
assert.equal(manifest.levels[0].game,'game/game.js');
assert.deepEqual(fs.readdirSync(new URL('game/',builtRoot)).sort(),['cta-icon.png','game.js','host.js','index.html']);
// In-memory adapter regression fixtures; these are not platform event evidence.
const built=fs.readFileSync(new URL('game/game.js',builtRoot),'utf8');
const source=JSON.parse(built.match(/^const SOURCE=(.*);$/m)[1]);
const nativeCorrect=source.engine.match(/OnCorrectInput:function\(\)\{(this.correctInputTimes=[^}]+)\},OnWrongInput/)[1];
async function fixture(total=33){
  const calls=[],lifecycle=[];let entry;
  const fills=[];
  class GameMgr{correctInputTimes=0;victoryTargetTimes=3;wordBoxList={Count:total};fillAmounts=[0,.33,.67,1];mainPanel={SetProgress:value=>fills.push(value)};CreatWordBox(){this.victoryTargetTimes=3;}OnVictory(){this.nativeWins=(this.nativeWins||0)+1;}OnLose(){}Update(){}}
  GameMgr.prototype.OnCorrectInput=vm.runInNewContext('(function(){'+nativeCorrect+'})',{BaseManager$1:()=>({Instance:{EventTrigger:()=>current.OnVictory()}}),EventCenter:{},EventName:{Victory:'win'}});
  let current;
  class TZ{ButtonOnClick(){}}
  const view={root:{style:{},querySelector(){return null;},querySelectorAll(){return[];}},mount:{style:{},remove(){lifecycle.push('remove');}}};
  const w={requestAnimationFrame:fn=>fn(),dispatchEvent(){},Luna:{Unity:{Playable:{},LifeCycle:{},Analytics:{}}},GameMgr,TZ_Script:TZ,UnityEngine:{AudioListener:{volume:0},Input:{GetMouseButtonDown:()=>true}},pc:{TextGenerator:{}},$environment:{packageConfig:{}}};
  class Application{app={pause:()=>lifecycle.push('pause'),resume:()=>lifecycle.push('resume'),destroy:()=>lifecycle.push('destroy'),muteAudio(){},unmuteAudio(){}};InitializeAsync(){return{continueWith:fn=>fn({})};}StartWithJSCallback(fn){lifecycle.push('start');fn();}}
  Application.StartupScene=class{};w.LunaUnity={Application};
  const scope={window:w,run(){},audioContexts:new Set(),audioElements:new Set(),pause:()=>lifecycle.push('scopePause'),resume:()=>lifecycle.push('scopeResume'),dispose:()=>lifecycle.push('dispose')};
  const shell=Object.fromEntries(['step','win','fail','end','cta'].map(name=>[name,(...args)=>calls.push([name,...args])]));
  vm.runInNewContext(read('src/game.js'),{NovvyGame:fn=>entry=fn,SOURCE:{variant:'100m',markup:'',css:'',config:'',engine:'',jsons:{},sounds:{},blobs:{}},engineRoot:()=>view,createEngineScope:()=>scope,structuredClone,Event,atob,console,installZenLayout(){}});
  const instance=await entry({},shell,{env:{muted:true}});
  assert.equal(calls.length,0,'no events before start');assert.ok(lifecycle.includes('start')&&lifecycle.includes('scopePause'),'ready includes the prepared, paused first scene');
  current=new GameMgr();current.CreatWordBox();return {instance,calls,lifecycle,w,game:current,TZ,fills};
}
const a=await fixture();await a.instance.start();
for(let i=0;i<3;i++)a.game.OnCorrectInput();a.game.OnVictory();
assert.equal(a.game.nativeWins,undefined,'three words and an early victory signal do not open the native result');
assert.equal(a.game.victoryTargetTimes,33);
assert.equal(a.calls.length,3);assert.equal(a.calls.at(-1)[1],3/33*100);
a.instance.pause();a.game.OnCorrectInput();assert.equal(a.game.correctInputTimes,3,'pause gates native progress');a.instance.resume();
for(let i=3;i<32;i++)a.game.OnCorrectInput();
assert.equal(a.game.nativeWins,undefined,'32 of 33 is not completion');
a.game.OnCorrectInput();a.game.OnVictory();a.game.OnCorrectInput();
assert.equal(a.game.nativeWins,1,'full board opens native victory once');
assert.equal(a.calls.filter(c=>c[0]==='step').length,33);
assert.deepEqual(a.calls.slice(-2),[['step',100],['win']]);
assert.equal(a.fills.length,33);assert.ok(a.fills.every(Number.isFinite),'all native progress array indices are valid');assert.equal(a.fills.at(-1),1);
const beforeRemovedButton=a.calls.length;new a.TZ().ButtonOnClick();assert.equal(a.calls.length,beforeRemovedButton,'removed native button cannot send CTA');
a.instance.destroy();a.instance.destroy();assert.equal(a.lifecycle.filter(v=>v==='destroy').length,1);
const b=await fixture();await b.instance.start();b.game.OnLose();b.game.OnLose();assert.deepEqual(b.calls,[['fail']]);
const c=await fixture(7);await c.instance.start();for(let i=0;i<7;i++)c.game.OnCorrectInput();assert.equal(c.game.victoryTargetTimes,7,'goal follows actual board size');assert.deepEqual(c.calls.at(-1),['win']);
await import('./test-host.mjs');
const layout=vm.runInNewContext(read('src/layout.js')+';zenLayoutRects;');
for(const [width,height,insets,safeArea] of [
  [390,844,{top:125,bottom:132},{}],[320,568,{top:120,bottom:132},{}],
  [844,390,{top:65,bottom:106},{left:47,right:47}],
  [390,844,{top:0,bottom:166},{top:59,bottom:34}],
  [390,844,{top:0,bottom:0},{}]
]){
  const r=layout(width,height,{insets,safeArea}),bottom=height-Math.max(insets.bottom,safeArea.bottom||0);
  assert.ok(r.board.y>=insets.top&&r.board.height>0,'board clears shell HUD');
  assert.ok(r.board.y+r.board.height<=bottom,'board clears shell CTA');
  assert.ok(r.wheel.y+r.wheel.diameter/2<=bottom,'wheel clears shell CTA');
  assert.ok(r.wheel.x-r.wheel.diameter/2>=0&&r.wheel.x+r.wheel.diameter/2<=width,'wheel stays on screen');
  if(width<height)assert.ok(r.board.y+r.board.height<r.wheel.y-r.wheel.diameter/2,'board and wheel do not overlap');
}
console.log('Zen Word: integrity, syntax, lifecycle, successful steps, results, removed native CTA and responsive bounds passed');
