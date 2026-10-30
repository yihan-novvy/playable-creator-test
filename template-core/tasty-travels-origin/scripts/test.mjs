import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { compileSource, build, readArchive } from './build.mjs';
const root=new URL('../',import.meta.url),raw=fs.readFileSync(new URL('source/original.html',root),'utf8');
const a=compileSource(raw),b=compileSource(raw);assert.deepEqual(a.files,b.files);
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
// Run the actual mobile/desktop boot and its deferred asset callbacks. Disabling
// fullscreen before boot is insufficient if the native onStart enables it again.
for (const mobile of [false, true]) for (const intro of [false, true]) {
 const queue=[], sceneCallbacks=[], fullscreen=[], orientations=[];
 let launch, scenes=0, engineStarts=0, resizeEnabled=false;
 const elements={
  'origin-game':{}, GameCanvas:{style:{}}, GameDiv:{style:{}},
  splash:{style:{},querySelector:()=>({style:{}})},
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
   bundles:[{getSceneInfo:()=>true,loadScene(name,options,progress,done){queue.push(()=>done(null,{}));}}],
  },
  Director:{EVENT_AFTER_SCENE_LAUNCH:'scene'},
  director:{once(name,callback){sceneCallbacks.push(callback);},runSceneImmediate(){scenes++;for(const fn of sceneCallbacks.splice(0))fn();}},
  game:{run(options,onStart){queue.push(onStart);},resume(){},pause(){}},
 };
 const bootWindow={cc,addEventListener(){},
  __ORIGIN_ADAPTER__:{start(callback){launch=callback;if(!intro)callback();}},
  super_boot_engine(){engineStarts++;queue.push(()=>bootWindow.boot());},
 };
 const bootContext=vm.createContext({window:bootWindow,cc,console:{log(){}},
  document:{hidden:false,addEventListener(){},getElementById:id=>elements[id]},
 });
 vm.runInContext(a.files['game/settings.js'],bootContext);
 bootWindow._CCSettings.orientation='portrait';
 vm.runInContext(a.files['game/main.js'],bootContext);
 vm.runInContext(a.files['game/boot.js'],bootContext);
 assert.equal(engineStarts,intro?0:1,'intro still gates engine startup');
 if(intro)launch();
 while(queue.length)queue.shift()();
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
build();console.log('tasty-travels-origin: frozen archive, native merge rules, collision deduplication, syntax and deterministic build passed');
