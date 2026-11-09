// Adapter contract tests. These do not substitute for official platform logs.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../source/'+file,import.meta.url))).digest('hex'),hash);
const source=JSON.parse(read('source/original.js').trim().slice(14,-2)).html;
assert(source.includes('maxLevels\\\":[3,2]')||source.includes('maxLevels\":[3,2]'));
const delivered=fs.readFileSync(new URL('../../../editor/templates/travel-town-origin/game/game.js',import.meta.url),'utf8');
new vm.Script(delivered);
for(const pattern of [/postMessage/,/NovvyPlayable/,/NovvyAnalytics/,/mraid\./,/window\.open\(/,/tracking\.novvy\.ai/])assert(!pattern.test(delivered),String(pattern));
let factory;
const scopes=[];
async function fixture(){
 const model={current:0},ui={child(){return {node:{visible:true,removeAllListeners(){}}};}},main={child(){return null;}};
 class GameModel{}class UiContainer{}class MainContainer{}
 const req=id=>({8646:{dGet:C=>C===GameModel?model:C===UiContainer?ui:main},2528:{GameModel},4959:{UiContainer},2678:{MainContainer}}[id]);
 const root={style:{},clientWidth:390,clientHeight:844},state={runs:0,paused:0,resumed:0,disposed:0,destroyed:0};
 const app={screen:{width:1000,height:2000,reset(){},emit(){}},audio:{_audios:{}},ticker:{stop(){}},app:{destroy(){state.destroyed++;}},run(){state.runs++;scope.window.TT_CONTEXT.ready({});}};
 const scope={window:{requestAnimationFrame:fn=>queueMicrotask(fn),Globals:{settings:{}}},audioContexts:new Set(),pause(){state.paused++;},resume(){state.resumed++;},dispose(){state.disposed++;},run(code){if(code==='engine')scope.window.TT_CONTEXT.install(req,app,{layouts:{gameScene:{children:{ui:{children:{ctaButton:{},playNowButton:{},disclaimer:{}}}}}}});}};
 scopes.push(scope);
 vm.runInNewContext(read('src/game.js'),{NovvyGame:f=>factory=f,engineRoot:()=>({root,mount:{remove(){}}}),createEngineScope:()=>scope,SOURCE:{engine:'engine',resources:'resources'},console});
 const events=[],game=await factory({},Object.fromEntries(['step','win','fail'].map(name=>[name,(...args)=>events.push([name,...args])])),{env:{muted:true,insets:{top:100,bottom:120}}});
 return{game,events,scope,state,root,model,app};
}
const f=await fixture();
assert.equal(f.state.runs,1,'ready includes the loaded first scene');assert.ok(f.state.paused>0,'first scene waits paused for start');
f.scope.window.TT_CONTEXT.merge({type:0,level:1});assert.equal(f.events.length,0);
await f.game.start();await f.game.start();assert.equal(f.state.runs,1,'start is idempotent');
assert.equal(f.app.audio.available,false,'mute reaches native audio');
f.scope.window.TT_CONTEXT.move();f.scope.window.TT_CONTEXT.merge({type:0,level:1});f.scope.window.TT_CONTEXT.move();
assert.deepEqual(f.events.map(e=>[e[0],Math.round(e[1])]),[['step',0],['step',17],['step',17]],'confirmed movement counts separately from highest-tier progress');
f.game.pause();f.scope.window.TT_CONTEXT.move();assert.equal(f.events.length,3,'paused input cannot report');
f.game.setEnv({muted:false});assert.equal(f.app.audio.available,false);f.game.resume();assert.equal(f.app.audio.available,true);
const bounds=f.scope.window.TT_CONTEXT.bounds({getElement:()=>({key:'gameContainer'})},[0,0,1000,2000]);
assert.equal(bounds[1],100*2000/844);assert.equal(bounds[3],2000-220*2000/844);
assert.deepEqual(f.scope.window.TT_CONTEXT.bounds({getElement:()=>({key:'main'})},[0,0,1000,2000]),[0,0,1000,2000],'background keeps full bounds');
f.scope.window.TT_CONTEXT.merge({type:0,level:3});
assert.equal(f.scope.window.TT_CONTEXT.repairComplete(),false,'first repair returns to selection');
assert.equal(f.scope.window.TT_CONTEXT.repairComplete(),false,'duplicate repair does not finish the room');
assert.equal(f.model.item_0_completed,true);assert.equal(f.root.style.pointerEvents,'auto');
assert.equal(f.events.filter(e=>e[0]==='win').length,0,'first repair is not an ad result');
f.game.pause();f.game.resume();assert.equal(f.root.style.pointerEvents,'auto','return retains playable state');
f.model.current=1;f.scope.window.TT_CONTEXT.merge({type:1,level:1});assert.equal(f.events.at(-1)[1],75);
f.scope.window.TT_CONTEXT.merge({type:1,level:2});assert.equal(f.events.at(-1)[1],100);
assert.equal(f.scope.window.TT_CONTEXT.repairComplete(),true);f.scope.window.TT_CONTEXT.repairComplete();f.scope.window.TT_CONTEXT.fail();f.scope.window.TT_CONTEXT.move();
assert.equal(f.events.filter(e=>e[0]==='win').length,1);assert.equal(f.events.filter(e=>e[0]==='fail').length,0);
f.game.destroy();f.game.destroy();assert.equal(f.state.disposed,1);assert.equal(f.state.destroyed,1);
const second=await fixture();second.model.current=1;await second.game.start();second.scope.window.TT_CONTEXT.merge({type:1,level:1});assert.equal(second.events[0][1],25,'cleaning board uses its own native target tier');second.scope.window.TT_CONTEXT.fail();second.scope.window.TT_CONTEXT.repairComplete();assert.equal(second.events.at(-1)[0],'fail');second.game.destroy();
console.log('Travel Town source, script boundary, native target progress, lifecycle, mute, insets and result latch passed.');

const reverse=await fixture();await reverse.game.start();reverse.model.current=1;reverse.scope.window.TT_CONTEXT.merge({type:1,level:2});assert.equal(reverse.scope.window.TT_CONTEXT.repairComplete(),false);reverse.model.current=0;reverse.scope.window.TT_CONTEXT.merge({type:0,level:3});assert.equal(reverse.events.at(-1)[1],100);assert.equal(reverse.scope.window.TT_CONTEXT.repairComplete(),true);reverse.game.destroy();
