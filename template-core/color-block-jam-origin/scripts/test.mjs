import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {transformSync} from 'esbuild';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/color-block-jam-origin/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=()=>fs.readFileSync(new URL('game/game.js',built),'utf8');
const before=output();execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});assert.equal(output(),before,'deterministic build');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
 const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
const source=JSON.parse(before.match(/^const SOURCE=(.*);$/m)[1]);
const assetContext={};vm.runInNewContext(source.resources['assets.js'],assetContext,{timeout:1000});
const native=transformSync(assetContext.assetsMap['assets/main/index.js'],{minify:false}).code;
function method(name,next){
 const begin=native.indexOf('r2.'+name+' = function'),end=native.indexOf('}, r2.'+next+' = function',begin);
 assert.ok(begin>=0&&end>begin,'native handler anchor '+name);
 return native.slice(native.indexOf('function',begin),end+1);
}
assert.ok(!/postMessage|messageHandlers|NovvyPlayable|NovvyAnalytics|window\.open\(/.test(before));
assert.equal((before.match(/NovvyGame\(async function/g)||[]).length,1);
assert.equal(manifest.constants.game.levelCount,3);
// Callback fixtures validate the adapter and original release handler only.
// They are deliberately not browser/platform traces or an alternative shell.
async function fixture(){
 const calls=[],state={running:false,now:0};
 class GameModel{constructor(){this.blocks=[];this.currentLevel=1;}removeBlock(b){const at=this.blocks.indexOf(b);if(at>=0)this.blocks.splice(at,1);}}
 GameModel.instance=new GameModel();
 class Game{
  onLoad(){} onTouchStart(block){this.target=block;} onTouchMove(){}
  gameOver(){this.isOver=true;} setEnd(){} findNearestValidGridPosition(){return this.nextGrid;}
  checkDestroy(){return {dir:-1};} clearMove(){this.target=null;}
 }
 Game.prototype.onTouchEnd=vm.runInNewContext('('+method('onTouchEnd','getPlane')+')',{q:{playEffect(){}},console:{log(){}}});
 class MapManager{createMap(callback){callback();}}
 class Over{}
 const game=new Game(),model=GameModel.instance;
 const framework={playable:{gameStart(){},install(){}},audioManager:{}};
 const modules={'Game.ts':{Game},'GameModel.ts':{GameModel},'MapManager.ts':{MapManager},'Over.ts':{Over},'index.js':framework};
 const adapter=vm.runInNewContext(read('src/adapter.js')+';colorBlockJamAdapter',{performance:{now:()=>state.now}});
 await adapter({cc:{},system:{import:async name=>modules[name.split('/').pop()]},scope:{window:{}},shell:Object.fromEntries(['step','win','level','cta'].map(name=>[name,(...args)=>calls.push([name,...JSON.parse(JSON.stringify(args))])])),isRunning:()=>state.running});
 const block=(color=1)=>({color,grid:[[0,0]],firstChildBasePos:{},setDir(x,z){this.grid=[[x,z]];},move(fn){fn();}});
 const enter=(n,blocks)=>{model.currentLevel=n;model.blocks=blocks;game.isOver=false;game.isPause=false;new MapManager().createMap(()=>{});};
 return {state,calls,game,model,block,enter,Over};
}
const f=await fixture(),a=f.block(),b=f.block();f.enter(1,[a,b]);
f.game.nextGrid={x:0,z:0};f.game.onTouchStart(a);f.game.onTouchEnd();assert.equal(f.calls.length,0,'input blocked before start');
f.state.running=true;f.game.onTouchStart(null);f.game.onTouchEnd();assert.equal(f.calls.length,0,'empty click');
f.game.onTouchStart(a);f.game.onTouchEnd();assert.equal(f.calls.length,0,'unchanged grid is not a step');
f.game.nextGrid={x:1,z:0};f.game.onTouchStart(a);f.game.onTouchEnd();assert.deepEqual(f.calls,[['step',0]],'valid reposition counts without elimination progress');
f.game.onTouchEnd();assert.equal(f.calls.length,1,'release callback duplicate');
f.game.onTouchStart(a);f.model.removeBlock(a);f.game.onTouchEnd();assert.deepEqual(f.calls.at(-1),['step',50],'elimination commits once');
f.model.removeBlock(a);assert.equal(f.calls.length,2,'duplicate removal ignored');
f.state.running=false;f.game.onTouchStart(b);assert.equal(f.calls.length,2,'pause blocks input');f.state.running=true;
f.game.onTouchStart(b);f.model.removeBlock(b);f.game.gameOver();f.game.gameOver();assert.deepEqual(f.calls.slice(-2),[['step',100],['win',{continuePlaying:true}]],'first result is intermediate and deduplicated');
f.enter(2,[f.block(),f.block(-1)]);assert.deepEqual(f.calls.at(-1),['level',2]);
const c=f.model.blocks[0];f.game.onTouchStart(c);f.model.removeBlock(c);assert.deepEqual(f.calls.at(-1),['step',100],'obstacle excluded from progress');f.game.gameOver();assert.deepEqual(f.calls.at(-1),['win',{continuePlaying:true}]);
f.enter(3,[f.block()]);assert.deepEqual(f.calls.at(-1),['level',3]);f.game.onTouchStart(f.model.blocks[0]);f.model.removeBlock(f.model.blocks[0]);f.game.gameOver();f.game.gameOver();assert.deepEqual(f.calls.at(-1),['win',null],'third level is terminal');
f.game.btn_play();new f.Over().btn_next();assert.equal(f.calls.filter(c=>c[0]==='cta').length,0,'native conversion controls are disabled');
console.log('Color Block Jam: source integrity, deterministic build, real release callback, move/elimination deduplication, 3-level results and host-owned CTA passed.');
// Exercise the production assembly host in memory. This validates stage,
// replay and conversion policy logic, not actual platform SDK reporting.
async function hostFixture(config,withSdk=true){
 class Bus{
  constructor(){this.listeners={};this.style={setProperty(){}};this.clientWidth=390;this.clientHeight=844;this.hidden=false;this.offsetHeight=90;}
  addEventListener(t,f){(this.listeners[t]||=[]).push(f);}
  dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e);}
  getBoundingClientRect(){return {bottom:100};} focus(){}
 }
 const ids=['game','status','replay','result','result-title','result-copy'];
 const elements=Object.fromEntries(ids.map(id=>['color-block-jam-'+id,new Bus()]));elements['novvy-cta']=new Bus();elements['color-block-jam-result'].hidden=true;
 const window=new Bus(),document=new Bus(),calls=[],instances=[],state={now:0,failNext:false,rejectClick:false};
 document.body={append(){}};document.documentElement=new Bus();document.createElement=()=>new Bus();document.getElementById=id=>elements[id]||null;
 window.COLOR_BLOCK_JAM_CONFIG={intro:false,title:false,ctaEnabled:true,allowReplay:false,policy:{enabled:true,mode:'steps',afterSteps:2,intervals:[3,1]},...config};
 if(withSdk)window.NovvyPlayable=new Proxy({},{get:(o,key)=>(...args)=>{calls.push([key,...args]);if(key==='click'&&state.rejectClick)return false;}});
 vm.runInNewContext(read('src/host.js'),{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,performance:{now:()=>state.now},getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},queueMicrotask,console:{info(){},warn(){},error(){}}});
 window.NovvyGame(async(root,shell)=>{
  if(state.failNext){state.failNext=false;throw Error('Fixture load failure');}
  const instance={shell,startCount:0,destroyCount:0,pauseCount:0,resumeCount:0,start(){this.startCount++;},pause(){this.pauseCount++;},resume(){this.resumeCount++;},destroy(){this.destroyCount++;},setEnv(){}};instances.push(instance);return instance;
 });
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};await flush();
 const button=elements['color-block-jam-replay'],modal=elements['color-block-jam-result'];
 const visibility=hidden=>{document.hidden=hidden;document.dispatchEvent({type:'visibilitychange'});};
 const viewability=viewable=>window.dispatchEvent({type:'novvy:viewablechange',detail:{viewable}});
 const count=name=>calls.filter(c=>c[0]===name).length;
 return {window,document,elements,calls,instances,state,flush,button,modal,visibility,viewability,count};
}
const host=await hostFixture({intro:true,allowReplay:true});
assert.equal(host.instances[0].startCount,0,'video prevents early gameplay');
host.instances[0].shell.step(50);assert.equal(host.count('onStep'),0);
host.window.dispatchEvent({type:'novvy:intro-finished'});host.window.dispatchEvent({type:'novvy:intro-finished'});await host.flush();
assert.equal(host.instances[0].startCount,1,'video transition starts once');assert.equal(host.count('setStage'),2);
const h=host.instances[0].shell;h.win({continuePlaying:true});assert.equal(host.count('onComplete'),0,'intermediate win does not finish assembly');
h.level(2);h.step(0);h.step(0);assert.equal(host.count('click'),1,'real steps trigger initial policy');
h.step(25);h.step(25);h.step(25);assert.equal(host.count('click'),1,'cooldown blocks without consuming threshold');
host.state.now=1001;h.step(25);assert.equal(host.count('click'),2,'pending threshold retries');
host.state.now=2002;h.step(50);assert.equal(host.count('click'),3,'last interval repeats');
h.win();h.win();assert.equal(host.count('onComplete'),1,'final result once');assert.equal(host.count('click'),3,'no extra win jump after step jump');
assert.equal(host.modal.hidden,false);assert.equal(host.button.textContent,'Replay');assert.equal(host.instances[0].pauseCount,1,'modal pauses original ending and audio');
host.button.dispatchEvent({type:'click'});await host.flush();assert.equal(host.instances.length,1,'cooldown never causes a restart');assert.equal(host.button.disabled,false,'cooldown leaves button available');
host.state.now=3003;host.button.dispatchEvent({type:'click'});host.button.dispatchEvent({type:'click'});await host.flush();
assert.equal(host.count('click'),4,'one replay CTA despite double click');
assert.equal(host.calls.filter(c=>c[0]==='click').at(-1)[1].click_source,'forced_click_to_appstore');
assert.equal(host.instances.length,1,'CTA cannot eagerly rebuild in background');assert.equal(host.button.disabled,true);
host.window.dispatchEvent({type:'focus'});host.visibility(false);host.viewability(true);await host.flush();assert.equal(host.instances.length,1,'focus or visible without an exit is not a store return');
host.visibility(true);host.viewability(false);host.visibility(false);await host.flush();assert.equal(host.instances.length,1,'both visibility signals must allow return');
host.viewability(true);host.viewability(true);await host.flush();
assert.equal(host.instances.length,2,'only real hidden-to-visible cycle rebuilds');assert.equal(host.instances[0].destroyCount,1);
assert.equal(host.instances[1].startCount,1);assert.equal(host.modal.hidden,true);assert.equal(host.count('onReplay'),1);
assert.equal(host.count('setStage'),2,'replay stays in the same stage and skips intro');
h.step(20);h.win();assert.equal(host.count('onComplete'),1,'old instance cannot emit after rebuild');
host.state.now=5000;host.instances[1].shell.step(0);assert.equal(host.count('click'),4,'replay resets policy steps');
host.instances[1].shell.step(0);assert.equal(host.count('click'),5,'new round uses initial policy threshold');
host.visibility(true);host.visibility(false);assert.equal(host.instances[1].resumeCount,1,'ordinary background/return resumes gameplay');

for(const kind of ['win','fail']){
 const f=await hostFixture({allowReplay:true,policy:{enabled:false}});
 f.instances[0].shell[kind]();assert.equal(f.modal.hidden,false);assert.equal(f.button.textContent,kind==='win'?'Replay':'Try Again');
 f.state.rejectClick=true;f.button.dispatchEvent({type:'click'});assert.equal(f.button.disabled,false,'SDK rejection does not strand replay');
 f.state.rejectClick=false;f.button.dispatchEvent({type:'click'});assert.equal(f.instances.length,1);
 assert.equal(f.calls.filter(c=>c[0]==='click').at(-1)[1].click_source,'forced_click_to_appstore',kind+' uses confirmed replay source');
 f.state.failNext=true;f.viewability(false);f.viewability(true);await f.flush();
 assert.equal(f.modal.hidden,false,'rebuild error retains modal');assert.equal(f.button.disabled,false);assert.equal(f.button.textContent,'Reload');assert.equal(f.count('onReplay'),0,'failed rebuild is not a replay');
 f.button.dispatchEvent({type:'click'});await f.flush();assert.equal(f.instances.length,2);assert.equal(f.count('click'),2,'loading retry does not open store again');assert.equal(f.count('onReplay'),1);
}
const cached=await hostFixture({allowReplay:true,policy:{enabled:false}});cached.instances[0].shell.win();cached.button.dispatchEvent({type:'click'});
cached.window.dispatchEvent({type:'pagehide',persisted:true});assert.equal(cached.count('endStage'),0,'bfcache/store suspension does not end stage');assert.equal(cached.instances[0].destroyCount,0);
cached.window.dispatchEvent({type:'pageshow',persisted:true});await cached.flush();assert.equal(cached.instances.length,2,'bfcache return also restarts once');
cached.instances[1].shell.fail();cached.window.dispatchEvent({type:'pagehide',persisted:false});cached.window.dispatchEvent({type:'pagehide',persisted:false});
assert.equal(cached.count('endStage'),1,'leaving the page ends current stage once');assert.equal(cached.modal.hidden,true);
cached.state.now=9000;cached.button.dispatchEvent({type:'click'});await cached.flush();assert.equal(cached.instances.length,2,'ended stage cannot replay');
// Regression: editor and raw ZIP previews have no SDK and therefore cannot
// produce a store-return visibility event. They must become playable again.
for(const kind of ['win','fail']){
 const preview=await hostFixture({allowReplay:true,policy:{enabled:false}},false);
 for(let round=0;round<2;round++){
  preview.instances[round].shell[kind]();preview.state.now=round*2000;
  preview.button.dispatchEvent({type:'click'});preview.button.dispatchEvent({type:'click'});await preview.flush();
  assert.equal(preview.instances.length,round+2,'SDK-free preview rebuilds exactly once');
  assert.equal(preview.instances[round].destroyCount,1);assert.equal(preview.instances[round+1].startCount,1);
  assert.equal(preview.modal.hidden,true,'preview dismisses result without waiting for an impossible return');
  assert.equal(preview.elements['color-block-jam-game'].inert,false,'new round accepts input');
 }
}
const popup=await hostFixture({allowReplay:true,policy:{enabled:false}});
popup.instances[0].shell.win();popup.button.dispatchEvent({type:'click'});
popup.window.dispatchEvent({type:'blur'});await popup.flush();assert.equal(popup.instances.length,1,'blur alone waits for store return');
popup.viewability(false);popup.window.dispatchEvent({type:'focus'});await popup.flush();assert.equal(popup.instances.length,1,'focus cannot bypass hidden SDK viewability');
popup.viewability(true);await popup.flush();assert.equal(popup.instances.length,2);assert.equal(popup.modal.hidden,true);
popup.instances[1].shell.win();popup.state.now=2000;popup.button.dispatchEvent({type:'click'});
popup.window.dispatchEvent({type:'blur'});popup.window.dispatchEvent({type:'focus'});popup.window.dispatchEvent({type:'focus'});await popup.flush();
assert.equal(popup.instances.length,3,'blur/focus-only store return restarts once');assert.equal(popup.count('onReplay'),2);
const off=await hostFixture({policy:{enabled:false,mode:'steps',afterSteps:1,intervals:[]}});off.instances[0].shell.step(100);off.instances[0].shell.win();
assert.equal(off.modal.hidden,true,'replay off preserves native ending');assert.equal(off.count('click'),0,'disabled auto policy stays disabled');
off.window.dispatchEvent({type:'novvy:cta-interact'});assert.equal(off.count('click'),1,'manual CTA independent of auto switch');
console.log('Production host memory tests: SDK-free preview replay, visibility and blur/focus store returns, success/failure modals, confirmed replay CTA, double-click/cooldown guards, SDK rejection, failed rebuild recovery, stale callbacks, stage continuity and policy reset passed.');
