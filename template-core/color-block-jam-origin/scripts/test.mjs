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
f.game.btn_play();new f.Over().btn_next();assert.deepEqual(f.calls.at(-1),['cta','cta_click']);assert.equal(f.calls.filter(c=>c[0]==='cta').length,1,'CTA cooldown shared across native placements');
f.state.now=1001;new f.Over().btn_next();assert.equal(f.calls.filter(c=>c[0]==='cta').length,2);f.state.running=false;f.state.now=3000;f.game.btn_play();assert.equal(f.calls.filter(c=>c[0]==='cta').length,2,'paused CTA blocked');
console.log('Color Block Jam: source integrity, deterministic build, real release callback, move/elimination deduplication, 3-level results and native CTA guards passed.');
// Exercise the production assembly host in memory. This validates stage,
// replay and conversion policy logic, not actual platform SDK reporting.
async function hostFixture(config){
 class Bus{constructor(){this.listeners={};this.style={setProperty(){}};this.clientWidth=390;this.clientHeight=844;this.hidden=false;this.offsetHeight=90;}addEventListener(t,f){(this.listeners[t]||=[]).push(f);}dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e);}getBoundingClientRect(){return {bottom:100};}}
 const elements=Object.fromEntries(['color-block-jam-game','color-block-jam-status','color-block-jam-replay','color-block-jam-continue','novvy-cta'].map(id=>[id,new Bus()]));
 const window=new Bus(),document=new Bus(),calls=[],instances=[],state={now:0};document.body={append(){}};document.documentElement=new Bus();document.createElement=()=>new Bus();document.getElementById=id=>elements[id]||null;
 window.COLOR_BLOCK_JAM_CONFIG={intro:false,title:false,ctaEnabled:true,allowReplay:false,policy:{enabled:true,mode:'steps',afterSteps:2,intervals:[3,1]},...config};
 window.NovvyPlayable=new Proxy({},{get:(o,key)=>(...args)=>calls.push([key,...args])});
 vm.runInNewContext(read('src/host.js'),{window,document,navigator:{userAgent:'test',language:'en'},innerWidth:390,innerHeight:844,devicePixelRatio:1,performance:{now:()=>state.now},getComputedStyle:()=>({}),ResizeObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},queueMicrotask,console});
 window.NovvyGame(async(root,shell)=>{const instance={shell,startCount:0,destroyCount:0,pauseCount:0,resumeCount:0,start(){this.startCount++;},pause(){this.pauseCount++;},resume(){this.resumeCount++;},destroy(){this.destroyCount++;},setEnv(){}};instances.push(instance);return instance;});
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};await flush();
 return {window,document,elements,calls,instances,state,flush};
}
const host=await hostFixture({intro:true,allowReplay:true});assert.equal(host.instances[0].startCount,0,'video prevents early gameplay');host.instances[0].shell.step(50);assert.equal(host.calls.filter(c=>c[0]==='onStep').length,0);
host.window.dispatchEvent({type:'novvy:intro-finished'});host.window.dispatchEvent({type:'novvy:intro-finished'});await host.flush();assert.equal(host.instances[0].startCount,1,'video transition starts once');assert.equal(host.calls.filter(c=>c[0]==='setStage').length,2);
const h=host.instances[0].shell;h.win({continuePlaying:true});assert.equal(host.calls.filter(c=>c[0]==='onComplete').length,0,'intermediate win does not finish assembly');h.level(2);h.step(0);h.step(0);assert.equal(host.calls.filter(c=>c[0]==='click').length,1,'real steps trigger initial policy');h.step(25);h.step(25);h.step(25);assert.equal(host.calls.filter(c=>c[0]==='click').length,1,'cooldown blocks without consuming threshold');host.state.now=1001;h.step(25);assert.equal(host.calls.filter(c=>c[0]==='click').length,2,'pending threshold retries');host.state.now=2002;h.step(50);assert.equal(host.calls.filter(c=>c[0]==='click').length,3,'last interval repeats');h.win();h.win();assert.equal(host.calls.filter(c=>c[0]==='onComplete').length,1,'final result once');assert.equal(host.calls.filter(c=>c[0]==='click').length,3,'no extra win jump after step jump');
host.elements['color-block-jam-replay'].dispatchEvent({type:'click'});await host.flush();assert.equal(host.instances.length,2);assert.equal(host.instances[0].destroyCount,1,'old instance disposed on replay');assert.equal(host.instances[1].startCount,1);assert.equal(host.calls.filter(c=>c[0]==='setStage').length,2,'replay stays in stage');assert.equal(host.calls.filter(c=>c[0]==='onReplay').length,1);host.document.hidden=true;host.document.dispatchEvent({type:'visibilitychange'});assert.equal(host.instances[1].pauseCount,1);host.document.hidden=false;host.document.dispatchEvent({type:'visibilitychange'});assert.equal(host.instances[1].resumeCount,1);
const off=await hostFixture({policy:{enabled:false,mode:'steps',afterSteps:1,intervals:[]}});off.instances[0].shell.step(100);off.instances[0].shell.win();assert.equal(off.calls.filter(c=>c[0]==='click').length,0,'disabled auto policy stays disabled');off.window.dispatchEvent({type:'novvy:cta-interact'});assert.equal(off.calls.filter(c=>c[0]==='click').length,1,'manual CTA independent of auto switch');
console.log('Production assembly host: intro gating, progress without elimination, cooldown retry, intervals, result deduplication, replay and visibility controls passed.');
