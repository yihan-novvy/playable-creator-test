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
const requireModule=k=>k==='GameScript'?{default:LayoutGame}:k==='SoundManager'?{SoundManager:{effectList:effects}}:{GameManager:manager};
layoutWindow.__TASTY_LAYOUT__.install(requireModule);layoutWindow.__TASTY_LAYOUT__.install(requireModule);
const layoutGame=new LayoutGame(),getLocation=()=>({x:30,y:40}),event={touch:{getLocation}};
assert.deepEqual(layoutGame.game1_Start(event),{x:60,y:50});
assert.deepEqual(layoutGame.game1_Move(event),{x:60,y:50});
assert.equal(event.touch.getLocation,getLocation);
assert.throws(()=>layoutGame.game1_End(event),/native release error/);
assert.equal(event.touch.getLocation,getLocation);
assert.equal(manager.canPlayAudio,true);
layoutGame.playBgm();assert.equal(bgmStarts,0);assert.equal(removedListeners,1);
effects.clear();layoutGame.playBgm();assert.equal(bgmStarts,1);
assert.throws(()=>readArchive(Buffer.alloc(100)),/central directory/);
build();console.log('tasty-travels-origin: frozen archive, native merge rules, collision deduplication, syntax and deterministic build passed');
