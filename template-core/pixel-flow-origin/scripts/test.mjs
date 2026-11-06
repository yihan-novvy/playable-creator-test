// Source/adapter tests; these are not official platform event evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {transformSync} from 'esbuild';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/pixel-flow-origin/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=()=>fs.readFileSync(new URL('game/game.js',built),'utf8');
const before=output();execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});assert.equal(output(),before,'deterministic build');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
 const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
const source=JSON.parse(before.match(/^const SOURCE=(.*);$/m)[1]);
assert.equal(source.pixelCount,1080);assert.equal(source.level.SlotCount,5);assert.equal(source.level.ConveyorLimit,5);
assert.deepEqual(source.level.QueueGroup.shooterQueues.map(q=>q.shooters.length),[10,10,10]);
assert.equal(Object.keys(source.jsons).length,4);assert.equal(Object.keys(source.sounds).length,2);assert.equal(Object.keys(source.blobs).length,1);
assert.ok(!/postMessage|NovvyPlayable|NovvyAnalytics|NovvyShell|window\.open\(/.test(before));
assert.equal((before.match(/NovvyGame\(function/g)||[]).length,1);
const native=transformSync(source.engine,{minify:false}).code;
function method(type,name,next){
 const at=native.indexOf('Bridge.define("'+type+'"'),start=native.indexOf(name+': function',at),end=native.indexOf('}, '+next+':',start);
 assert(start>at&&end>start,'native callback exists: '+name);
 return native.slice(native.indexOf('function',start),end+1);
}
function fixture(){
 const calls=[];let active=false,accept=true,reserve=true,count=1,ended=false;
 class List{items=[];get Count(){return this.items.length;}add(v){this.items.push(v);}ForEach(fn){this.items.forEach(fn);}}
 class MapEvents{TriggerShootersWillBePlacedToConveyor(){}TriggerSlotReleasedAfterFull(){}}
 class MapController{}
 class Damage{PixelGrid={Loom$Game$PixelImages$Core$IPixelGrid$SetPixel(){}};}
 class Integration{Start(){}OnGameWin(){}OnGameOver(){}OpenStore(){}UpdateClicksAndSecondsToEnd(){}}
 class Button{Awake(){}OnClick(){}}
 const w={Loom:{Game:{Map:{MapController,MapEventsData:MapEvents},PixelImages:{PixelGridDamageController:Damage},Slots:{ConveyorItemSlot:class{}}},Playables:{PlayableIntegration:Integration,DownloadGameButton:Button,InstallHelper:{}}},Luna:{Unity:{Playable:{},LifeCycle:{},Analytics:{LogEvent(){}}}},pc:{Application:{getApplication:()=>({root:{findByName:()=>null}})}}};
 const globals={System:{Collections:{Generic:{List$1:()=>({ctor:List})}}},Loom:w.Loom,UnityEngine:{Vector3:class{}},DG:{Tweening:{DOTween:{Sequence:()=>({})},TweenSettingsExtensions:{AppendInterval(){},AppendCallback(){}}}},Bridge:{fn:{bind:(self,fn)=>fn.bind(self)}}};
 for(const [name,next] of [['OnTapShooter','OnCannotTapShooter'],['TryPlaceShootersToConveyor','GetStartPointOffset']])MapController.prototype[name]=vm.runInNewContext('('+method('Loom.Game.Map.MapController',name,next)+')',globals);
 Damage.prototype.OnPixelDamaged=vm.runInNewContext('('+method('Loom.Game.PixelImages.PixelGridDamageController','OnPixelDamaged','OnEnable')+')',globals);
 const adapter=vm.runInNewContext(read('src/adapter.js')+';installPixelFlow');
 adapter(w,{}, {step:p=>calls.push(['step',p])},()=>({}),()=>active&&!ended,kind=>{if(active&&!ended){ended=true;calls.push([kind]);}},4);
 const map=Object.assign(new MapController(),{shooterProvider:{GetShootersToPlaceToConveyor:()=>({Count:count})},Conveyor:{CanReceiveItemCount:()=>accept,ActivationQueueCount:0},SlotGroup:{SlotsFull:false},mapEvents:new MapEvents(),GetStartPointOffset(){return 0;},ReserveSlots:()=>reserve,RemoveFromQueuesAndSlots:()=>false,TryActivateAutoFinisher(){},BuildPlaceTweens(){}});
 return{calls,map,damage:new Damage(),integration:new Integration(),events:map.mapEvents,setActive:v=>active=v,setAccept:v=>accept=v,setReserve:v=>reserve=v,setCount:v=>count=v};
}
const f=fixture();f.map.OnTapShooter({});assert.equal(f.calls.length,0,'before start input blocked');
f.setActive(true);f.setAccept(false);f.map.OnTapShooter({});assert.equal(f.calls.length,0,'full conveyor is invalid');
f.setAccept(true);f.setReserve(false);f.map.OnTapShooter({});assert.equal(f.calls.length,0,'failed reservation is invalid');
f.setReserve(true);f.setCount(0);f.map.OnTapShooter({});assert.equal(f.calls.length,0,'empty selection is invalid');
f.setCount(1);f.map.OnTapShooter({});assert.deepEqual(f.calls,[['step',0]],'placement counts before delayed shooting');
const pixel={IsDead:false,X:0,Y:0,Area:{$clone:()=>({})}};f.damage.OnPixelDamaged(pixel);f.map.OnTapShooter({});assert.deepEqual(f.calls.at(-1),['step',0],'damage without death is not progress');
pixel.IsDead=true;f.damage.OnPixelDamaged(pixel);f.damage.OnPixelDamaged(pixel);assert.equal(f.calls.length,2,'automatic fire is not another step');
f.setCount(3);f.map.OnTapShooter({});assert.deepEqual(f.calls.at(-1),['step',25],'multiple shooters from one gesture count once; death deduplicated');
f.events.TriggerShootersWillBePlacedToConveyor({Count:1});assert.equal(f.calls.length,3,'automatic conveyor placement is not a step');
f.setActive(false);f.map.OnTapShooter({});assert.equal(f.calls.length,3,'paused input blocked');
f.setActive(true);f.integration.OnGameWin();f.integration.OnGameWin();f.integration.OnGameOver();assert.deepEqual(f.calls.slice(3),[['win']],'one terminal outcome');
const fail=fixture();fail.setActive(true);fail.integration.OnGameOver();fail.integration.OnGameOver();assert.deepEqual(fail.calls,[['fail']]);
console.log('Pixel Flow integrity, deterministic build, native placement/damage callbacks and terminal deduplication passed.');
