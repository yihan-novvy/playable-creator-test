import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { compileSource, build, readArchive } from './build.mjs';
const root=new URL('../',import.meta.url),raw=fs.readFileSync(new URL('source/original.html',root),'utf8');
const a=compileSource(raw),b=compileSource(raw);assert.deepEqual(a.files,b.files);
const originalSplash=raw.match(/#splash\{[^}]*url\((data:image\/png;base64,[A-Za-z0-9+/=]+)\)/)[1];
assert.ok(a.files['game/index.html'].includes(`src="${originalSplash}"`),'loading screen embeds the branded image from the original HTML');
assert.ok(!a.files['game/index.html'].includes('__TASTY_SPLASH_IMAGE__'),'splash build anchor is resolved');
assert.ok(a.files['game/index.html'].includes('<span></span>'),'native progress fill is separate from Loading text');
for (const key of ['cocos2d-js-min.js','assets/main/index.js','@src/cc.adapter.js','@main.js']) assert.ok(a.archive[key], key);
assert.ok(Object.keys(a.assets).length>100);
const core=a.assets['assets/main/index.js'];
const getNumber=core.match(/\.prototype.getNumber=function\(\)\{([\s\S]*?)\},h\.prototype.updateZindex/);
const contact=core.match(/\.prototype.onBeginContact=function\(e,t,o\)\{([\s\S]*?)\},h\.prototype.onEndContact/);
assert.ok(getNumber&&contact);
let merges=0;const ctx=vm.createContext({u:{SoundManager:{playEffect(){}}},s:{},cc:{tween(){merges++;const chain={to(){return chain},call(){return chain},start(){}};return chain;}}});
const number=vm.runInContext('(function(){'+getNumber[1]+'})',ctx);
const collide=vm.runInContext('(function(e,t,o){'+contact[1]+'})',ctx);
function trial({other='beike0',tier=0,y=5,ended=false,repeated=false}={}){
 const script={getNumberTime:0,getNumber:number};
 const self={fruitNumber:tier,isEnd:ended,isOnce:true};
 const t={node:{name:'beike0',y,getComponent:()=>script}},o={node:{name:other,y:0,x:0}};
 collide.call(self,null,t,o);if(repeated)collide.call(self,null,t,o);
}
trial({other:'beike1'});trial({tier:9});trial({y:-1});trial({ended:true});assert.equal(merges,0,'native merge rejects different types, max tier, lower partner and ended game');
trial({repeated:true});assert.equal(merges,1,'native collision latch merges same pair only once');
for(const [file,s]of Object.entries(a.files))if(file.endsWith('.js'))new vm.Script(s);
// Exercise native async boot across both intro/load completion orders, including
// a cached intro finishing before boot.js arrives in an exported package.
for (const mobile of [false, true]) for (const mode of ['pure', 'intro-ready', 'intro-loading', 'intro-finished', 'story-ready', 'story-loading', 'story-finished', 'video-story']) {
 const intro=mode.startsWith('intro')||mode==='video-story', story=mode.startsWith('story')||mode==='video-story';
 const entryEvent=story?'novvy:story-finished':'novvy:intro-finished', queue=[], frames=[], fullscreen=[], orientations=[];
 const listeners=new Map(), sceneListeners=new Map(), nativeListeners=new Map();
 const on=(map,name,fn)=>{if(!map.has(name))map.set(name,[]);map.get(name).push(fn);};
 const emit=name=>{for(const fn of listeners.get(name)||[])fn();};
 const sceneEvent=name=>{const callbacks=sceneListeners.get(name)||[];sceneListeners.delete(name);for(const fn of callbacks)fn();};
 let launch, scenes=0, engineStarts=0, resizeEnabled=false, paused=false, musicStarts=0, effectsVolume=1, musicVolume=1;
 let musicPlaying=false, breakCache=false, pauseCache=false;
 // Native layout deduplicates the two existing loops; starting again is a no-op.
 const manager={isMute:false}, game={playBgm(){assert.equal(manager.isMute,false);if(!musicStarts){musicStarts++;musicPlaying=true;}}};
 const progressFill={style:{}};
 const elements={
  'origin-game':{}, GameCanvas:{style:{}}, GameDiv:{style:{}},
  splash:{style:{},querySelector:selector=>{assert.equal(selector,'.progress-bar span');return progressFill;}},
 };
 const cc={
  debug:{DebugMode:{INFO:1,ERROR:0}},
  sys:{isMobile:mobile,isBrowser:true,browserType:'chrome',os:'Android',OS_ANDROID:'Android'},
  macro:{ORIENTATION_PORTRAIT:'portrait',ORIENTATION_LANDSCAPE:'landscape'},
  view:{
   enableAutoFullScreen(value){fullscreen.push(value);}, enableRetina(){},
   resizeWithBrowserSize(value){resizeEnabled=value;}, setOrientation(value){orientations.push(value);},
  },
  AssetManager:{BuiltinBundleName:{RESOURCES:'resources',INTERNAL:'internal',MAIN:'main'}},
  assetManager:{
   init(){}, downloader:{},
   loadScript(list,done){queue.push(()=>done());},
   loadBundle(name,done){queue.push(()=>done());},
   bundles:[{getSceneInfo:()=>true,loadScene(name,options,progress,done){queue.push(()=>{
    assert.equal(elements.splash.style.display,'block','native loader displays the splash');
    assert.equal(progressFill.style.width,'0%','native loader starts progress at zero');
    progress(1,4);assert.equal(progressFill.style.width,'25.00%','native resource progress drives the restored bar');
    progress(3,4);assert.equal(progressFill.style.width,'75.00%','resource progress advances before scene readiness');
    assert.equal(elements.splash.style.display,'block','splash stays visible while loading');
    done(null,{});
   });}}],
  },
  audioEngine:{setEffectsVolume(value){effectsVolume=value;},setMusicVolume(value){musicVolume=value;},
   pauseAll(){pauseCache=pauseCache||musicPlaying;musicPlaying=false;},resumeAll(){musicPlaying=musicPlaying||pauseCache;pauseCache=false;},
   _break(){breakCache=musicPlaying;musicPlaying=false;},_restore(){musicPlaying=musicPlaying||breakCache;breakCache=false;},
  },
  Director:{EVENT_AFTER_SCENE_LAUNCH:'scene',EVENT_AFTER_DRAW:'draw'},
  director:{once(name,callback){on(sceneListeners,name,callback);},runSceneImmediate(){
   scenes++;
   bootWindow.__require=name=>name==='GameManager'?{GameManager:manager}:{default:{instance:game}};
   manager.isMute=!!bootWindow.isMute;
   if(!manager.isMute)game.playBgm();
   sceneEvent('scene');
  }},
  game:{EVENT_SHOW:'show',on(name,callback){on(nativeListeners,name,callback);},run(options,onStart){queue.push(onStart);},resume(){if(paused){paused=false;cc.audioEngine._restore();}},pause(){if(!paused){paused=true;cc.audioEngine._break();}}},
 };
 const bootWindow={cc,__ORIGIN_CONFIG__:{intro,story},__novvyIntroFinished:mode==='intro-finished',__novvyStoryFinished:mode==='story-finished',__novvyBridgeVersion:1,__novvyViewable:true,
  __novvyStorySound:{active:mode.startsWith('story')&&!mode.endsWith('-finished'),muted:false},
  addEventListener(name,fn){on(listeners,name,fn);},requestAnimationFrame(callback){frames.push(callback);},
  __ORIGIN_ADAPTER__:{start(callback){launch=callback;callback();}},
  super_boot_engine(){engineStarts++;queue.push(()=>bootWindow.boot());},
 };
 const document={hidden:false,addEventListener(name,fn){on(listeners,name,fn);},getElementById:id=>elements[id]};
 const bootContext=vm.createContext({window:bootWindow,cc,console:{log(){}},
  document,
 });
 vm.runInContext(a.files['game/settings.js'],bootContext);
 bootWindow._CCSettings.orientation='portrait';
 vm.runInContext(a.files['game/main.js'],bootContext);
 vm.runInContext(a.files['game/boot.js'],bootContext);
 assert.equal(engineStarts,0,'engine does not block the initial splash paint');
 assert.equal(frames.length,1,'engine preloads even while the intro is active');
 launch();assert.equal(frames.length,1,'repeated launch does not queue another engine startup');
 frames.shift()();assert.equal(engineStarts,0,'first animation frame leaves a paint opportunity');
 frames.shift()();assert.equal(engineStarts,1,'engine starts on the following animation frame');
 if(mode.endsWith('-loading')){bootWindow.__novvyStorySound.active=false;emit(entryEvent);}
 assert.equal(bootWindow.isMute,1,'audio stays muted until the scene is ready, even if intro ended early');
 while(queue.length)queue.shift()();
 assert.equal(elements.splash.style.display,'block','scene launch alone must not reveal an unpainted canvas');
 assert.equal(paused,false,'first draw is not blocked by the intro pause gate');
 assert.equal(musicStarts,0,'native onLoad cannot start music before the first frame');
 sceneEvent('draw');
 assert.equal(elements.splash.style.display,'none','first rendered scene dismisses the splash');
 if(mode.endsWith('-ready')||mode==='video-story') {
  assert.equal(paused,true,'prepared scene is paused behind the intro and GO gate');
  const audible=mode==='story-ready';
  assert.deepEqual([bootWindow.isMute,manager.isMute,effectsVolume,musicVolume,musicStarts],[audible?0:1,!audible,audible?1:0,audible?1:0,audible?1:0]);
  assert.equal(musicPlaying,audible,'native music can play while gameplay stays paused for the story');
  emit('pointerdown');
  document.hidden=true;emit('visibilitychange');assert.equal(musicPlaying,false,'backgrounding pauses native music');document.hidden=false;emit('visibilitychange');
  cc.game.resume();for(const fn of nativeListeners.get('show')||[])fn();
  assert.equal(paused,true,'native foreground resume cannot bypass the intro gate');
  assert.equal(musicStarts,audible?1:0,'video gestures cannot start music; story foreground restores existing music');
  assert.equal(musicPlaying,audible,'game pause must not silence story music after a native resume');
  if(story) {
   emit('novvy:intro-finished');
   assert.equal(paused,true,'video completion cannot bypass a pending story');
   bootWindow.__novvyStorySound.active=true;emit('novvy:story-sound');
   assert.equal(musicPlaying,true,'native music starts when the story becomes active');
   bootWindow.__novvyStorySound.muted=true;emit('novvy:story-sound');
   assert.equal(musicPlaying,false,'story mute stops native music');
   bootWindow.__novvyViewable=false;emit('novvy:viewablechange');bootWindow.__novvyViewable=true;emit('novvy:viewablechange');
   assert.equal(musicPlaying,false,'manual mute survives viewability changes');
   bootWindow.__novvyStorySound.muted=false;emit('novvy:story-sound');
   assert.equal(musicPlaying,true,'story unmute resumes native music while cc.game remains paused');
   assert.equal(paused,true);
   bootWindow.__novvyStorySound.active=false;
  }
  emit(entryEvent);
  assert.equal(elements.splash.style.display,'none','ready intro transition never restores Loading');
 }
 assert.equal(paused,false,'ready playable runs after entry');
 assert.equal(musicPlaying,true,'entry preserves the same native music loops');
 assert.deepEqual([bootWindow.isMute,manager.isMute,effectsVolume,musicVolume,musicStarts],[0,false,1,1,1],'entry restores audio skipped by native muted onLoad');
 emit(entryEvent);assert.equal(musicStarts,1,'duplicate entry does not restart music');
 document.hidden=true;emit('visibilitychange');
 assert.equal(paused,true);assert.equal(bootWindow.isMute,1);
 document.hidden=false;bootWindow.__novvyViewable=false;emit('visibilitychange');
 assert.equal(paused,true,'SDK visibility still gates a foreground document');
 bootWindow.__novvyViewable=true;emit('novvy:viewablechange');
 assert.equal(paused,false);assert.equal(bootWindow.isMute,0);
 assert.equal(fullscreen.includes(true),false,'native async boot must not re-enable browser fullscreen');
 assert.equal(scenes,1,'native scene still launches');
 assert.equal(resizeEnabled,true,'canvas still follows its embedded viewport');
 assert.deepEqual(orientations,mobile?['portrait']:[],'native orientation setup is preserved');
 assert.equal(cc.view._frame,elements['origin-game']);
 launch();
 assert.equal(engineStarts,1,'repeated launch does not reboot the engine');
}
// Camera framing must translate touch coordinates once without leaving the
// shared Cocos Touch mutated (including a native handler that throws).
const layoutWindow={}, manager={}, effects=new Map([['bgm',1],['bgm2',2]]);
let bgmStarts=0, removedListeners=0;
class LayoutGame {
 constructor(){this.camera={getComponent:()=>({getScreenToWorldPoint:p=>({x:p.x*2,y:p.y+10})})};this.node={off(){removedListeners++;}};}
 changeLV(){}
 playBgm(){bgmStarts++;}
 game1_Start(e){return e.touch.getLocation();}
 game1_Move(e){return e.touch.getLocation();}
 game1_End(){throw new Error('native release error');}
}
const layoutContext=vm.createContext({window:layoutWindow,cc:{Camera:class{},Node:{EventType:{TOUCH_START:'touchstart'}}}});
vm.runInContext(a.files['game/layout.js'],layoutContext);
const english=vm.runInNewContext('('+core.match(/en:(\{language:"英语",.*?\}),ja:/)[1]+')');
const requireModule=k=>k==='GameScript'?{default:LayoutGame}:k==='SoundManager'?{SoundManager:{effectList:effects}}:k==='LanguageCfg'?{LanguageCfg:{language:{en:english}}}:{GameManager:manager};
layoutWindow.__TASTY_LAYOUT__.install(requireModule);layoutWindow.__TASTY_LAYOUT__.install(requireModule);
const layoutGame=new LayoutGame(),getLocation=()=>({x:30,y:40}),event={touch:{getLocation}};
assert.deepEqual(layoutGame.game1_Start(event),{x:60,y:50});
assert.deepEqual(layoutGame.game1_Move(event),{x:60,y:50});
assert.equal(event.touch.getLocation,getLocation);
assert.throws(()=>layoutGame.game1_End(event),/native release error/);
assert.equal(event.touch.getLocation,getLocation);
assert.equal(manager.canPlayAudio,true);
assert.equal(manager.isMultilingual,false);
assert.equal(manager.curLanguage,'en');
for(let i=1;i<=4;i++)for(let side=1;side<=2;side++)layoutGame[`tipLab${i}_${side}`]={string:'旧文案'};
layoutGame.NextLab={string:'下一個'};layoutGame.NextLab2={string:'下一個'};layoutGame.setLanguage();
assert.equal(layoutGame.NextLab.string,'NEXT');assert.equal(layoutGame.NextLab2.string,'NEXT');
assert.equal(layoutGame.tipLab1_1.string,'DROP THE ITEMS');
const resources=Object.values(JSON.parse(a.assets['assets/resources/config.json']).paths);
for(const name of ['images/order1-en','images/order2-en'])assert.ok(resources.some(entry=>entry[0]===name));
layoutGame.playBgm();assert.equal(bgmStarts,0);assert.equal(removedListeners,1);
effects.clear();layoutGame.playBgm();assert.equal(bgmStarts,1);
assert.throws(()=>readArchive(Buffer.alloc(100)),/central directory/);
build();console.log('tasty-travels-origin: frozen archive, native merge rules, splash paint/progress/lifecycle, syntax and deterministic build passed');
