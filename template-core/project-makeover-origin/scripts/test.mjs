import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/project-makeover-origin/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=()=>fs.readFileSync(new URL('game/game.js',built),'utf8');
const before=output();execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});assert.equal(output(),before,'deterministic build');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
 const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
const source=JSON.parse(before.match(/^const SOURCE=(.*);$/m)[1]);
assert.ok(!/postMessage|NovvyPlayable|NovvyAnalytics|mraid\.|window\.open\(/.test(before));
assert.equal((before.match(/NovvyGame\(function/g)||[]).length,1);
assert.equal((source.engine.match(/src:"data:image/g)||[]).length,2,'both native atlases embedded');
const between=(start,end)=>source.engine.slice(source.engine.indexOf(start),source.engine.indexOf(end,source.engine.indexOf(start)));
// Execute actual frozen input/gameplay handlers with in-memory drawing/tween
// fixtures. This is adapter coverage, not a platform event-debug acceptance run.
async function fixture(){
 const calls=[],life=[];const mc=()=>({visible:true,scaleX:1,scaleY:1,stop(){},play(){},gotoAndStop(){},gotoAndPlay(){},localToLocal(){return{x:1,y:2};},setTransform(){},addChild(){},hasEventListener(){return false;},addEventListener(){}});
 const face=Object.assign(mc(),{color_mc:Object.assign(mc(),{brush_mc:{h0:mc(),h1:mc(),h2:mc()},h0:mc(),h1:mc(),h2:mc(),hh0:mc(),hh1:mc(),hh2:mc()}),close_mc:Object.assign(mc(),{h0:mc(),h1:mc(),h2:mc(),empty_mc:mc()}),open_mc:mc(),eyes_mc:mc()});
 const elements=new Map(['loading','font-preload','canvas'].map(id=>[id,{style:{}}]));
 const context={console:{log(){}},window:{devicePixelRatio:1,addEventListener(){}},document:{getElementById:id=>elements.get(id)},Image:class{set src(value){queueMicrotask(()=>this.onload());}},Promise,
  main_mc:Object.assign(mc(),{instance:mc()}),girl_mc:mc(),face_mc:face,hud_mc:mc(),brush_mc:Object.assign(mc(),{h0:mc(),h1:mc(),h2:mc()}),text0_mc:mc(),text1_mc:mc(),logo_l:mc(),logo_r:mc(),hint_mc:null,last_color:null,anim_id:false,tap_down:false,firstTapID:false,level_id:0,h_arr:[mc(),mc(),mc()],comp_id:'native',canvas:null,stage:null,GlobalData:{},
  setColor(){},addColor(){},setHud(){},setOrientation(){},setDown(){},removeDown(){},remvoeTap(){},removeMC(){},addBrushParts(){},
  playSound(){},playLoopSound(){},onMuteSounds(){},onUnmuteSounds(){},pauseAllSounds(){life.push('audioPause');},resumeAllSounds(){},stopAllSounds(){life.push('audioStop');},
  createjs:{Touch:{enable(){},disable(){life.push('touchOff');}},Ticker:{addEventListener(){},removeAllEventListeners(){},reset(){life.push('tickerReset');}},Tween:{get(){return new Proxy({},{get:()=>()=>context.createjs.Tween.get()});},removeAllTweens(){}},Ease:{sineInOut:0,sineOut:0,sineIn:0},SpriteSheet:class{}},
 };
 const lib={properties:{width:960,height:960,fps:24,manifest:[]},ssMetadata:[],bg_pm:class{},main:class{shape_1=mc();},Stage:class{mouseEnabled=true;addChild(){}addChildAt(){}update(){}enableDOMEvents(){}removeAllEventListeners(){}removeAllChildren(){}}};
 context.AdobeAn={getComposition:()=>({getLibrary:()=>lib,getImages:()=>({}),getSpriteSheet:()=>({})})};context.lib=lib;
 context.window.PM_CONTEXT={shell:Object.fromEntries(['step','end','win','fail','cta'].map(name=>[name,(...args)=>calls.push([name,...args])])),env:{muted:true},root:{clientWidth:390,clientHeight:844},scope:{pause(){life.push('pause');},resume(){life.push('resume');}}};
 vm.createContext(context);
 const native=between('function setColor(', 'var hint_tween')+between('function handleDown(', 'var xRatio')+between('function setSQ()', 'function removeMC(');
 const adapter=read('src/adapter.js').replace('return new Promise(function(resolve,reject){','window.TEST_ACTIONS={setColor,setBrushColor,addColor,handleDown,handleTap,nextLevel};return new Promise(function(resolve,reject){');
 const runtime=await vm.runInContext('(function(){'+native+adapter+'})()',context);
 Object.assign(context,context.window.TEST_ACTIONS);
 return{c:context,runtime,calls,life};
}
const f=await fixture();f.c.setColor(1);f.c.addColor();assert.equal(f.calls.length,0,'no gameplay before start');
f.runtime.start();f.c.handleDown({primary:true});assert.equal(f.calls.length,0,'face before selection is invalid');
f.c.tap_down=false;f.c.handleTap({primary:false,currentTarget:{ID:1}});assert.equal(f.calls.length,0,'non-primary input ignored');
f.c.handleTap({primary:true,currentTarget:{ID:1}});assert.deepEqual(f.calls,[['step',0]],'native shade selection counts with no foundation applied');
f.c.setBrushColor(1);f.c.tap_down=false;f.c.handleTap({primary:true,currentTarget:{ID:1}});assert.equal(f.calls.length,1,'same shade is not another move');
f.runtime.pause();f.c.addColor();assert.equal(f.calls.length,1);assert.equal(f.c.stage.mouseEnabled,false);
f.runtime.resume();f.c.handleDown({primary:true});assert.deepEqual(f.calls.at(-1),['step',100]);
f.c.handleDown({primary:true});assert.equal(f.calls.length,2,'duplicate face input suppressed');
assert.ok(!f.calls.some(c=>c[0]==='end'),'wait for native animation');
f.c.nextLevel();f.c.nextLevel();assert.deepEqual(f.calls,[['step',0],['step',100],['end']],'native terminal callback ends once without fabricating win/fail');
f.runtime.setEnv({insets:{top:120,bottom:100}});assert.ok(f.c.main_mc.scaleX<1);
f.runtime.setEnv({insets:{top:0,bottom:0}});assert.equal(f.c.main_mc.scaleX,1,'layout resets after overlays removed');
f.runtime.destroy();f.runtime.destroy();f.c.setColor(2);assert.equal(f.calls.length,3);assert.equal(f.life.filter(x=>x==='tickerReset').length,1,'dispose is idempotent');
// Exercise assembly host visibility and explicit mute handoff. Fake DOM/SDK
// objects cover wiring only; they are not shipped or treated as event evidence.
{
 const events=[],envs=[],life=[];
 const node=()=>Object.assign(new EventTarget(),{style:{},clientWidth:390,clientHeight:844,hidden:true,append(){},getBoundingClientRect(){return{top:0,bottom:0};}});
 const nodes=Object.fromEntries(['pm-game','pm-status','pm-replay','pm-continue','novvy-intro-video','novvy-intro-sound'].map(id=>[id,node()]));
 const w=Object.assign(new EventTarget(),{PM_CONFIG:{intro:false,title:false,allowReplay:true},NovvyPlayable:new Proxy({},{get:(_,key)=>(...args)=>events.push([key,...args])})});
 const doc=Object.assign(new EventTarget(),{hidden:false,body:node(),createElement:node,getElementById:id=>nodes[id]||null,documentElement:{style:{setProperty(){}}}});
 const c={window:w,document:doc,Event,CustomEvent:class extends Event{constructor(name,options){super(name);this.detail=options.detail;}},navigator:{userAgent:'test',language:'en'},getComputedStyle:()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'}),devicePixelRatio:1,innerWidth:390,innerHeight:844,ResizeObserver:class{observe(){}disconnect(){}},console,queueMicrotask};
 vm.runInNewContext(read('src/host.js'),c);
 let shell;w.NovvyGame((_root,s)=>{shell=s;return{start(){life.push('start');},pause(){life.push('pause');},resume(){life.push('resume');},setEnv(env){envs.push(env);},destroy(){}};});
 await new Promise(resolve=>setImmediate(resolve));
 const visibility=value=>w.dispatchEvent(Object.assign(new Event('novvy:viewablechange'),{detail:{viewable:value}}));
 visibility(false);shell.step(0);assert.ok(!events.some(e=>e[0]==='onStep'),'SDK non-viewable blocks gameplay reporting');
 visibility(true);shell.step(0);assert.equal(events.filter(e=>e[0]==='onStep').length,1);
 nodes['novvy-intro-sound'].dispatchEvent(new Event('click'));nodes['novvy-intro-video'].muted=true;await Promise.resolve();
 w.dispatchEvent(new Event('resize'));assert.equal(envs.at(-1).muted,true,'explicit video mute survives resize');
 shell.end();shell.end();assert.equal(nodes['pm-replay'].hidden,false);assert.ok(!events.some(e=>e[0]==='onComplete'),'native demo end does not become a win');
 assert.ok(life.includes('pause')&&life.includes('resume'));
}
console.log('Project Makeover: source integrity, deterministic build, native input, lifecycle and assembly host passed.');
