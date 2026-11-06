import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {transformSync} from 'esbuild';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/screwdom-origin/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=()=>fs.readFileSync(new URL('game/game.js',built),'utf8');
const before=output();execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});assert.equal(output(),before,'deterministic build');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
 const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
const source=JSON.parse(before.match(/^const SOURCE=(.*);$/m)[1]);
assert.equal(Object.keys(source.resources).length,346);
assert.ok(!/postMessage|NovvyPlayable|NovvyAnalytics|mraid\.|window\.open\(/.test(before));
assert.equal((before.match(/NovvyGame\(async function/g)||[]).length,1);
for(const file of ['src/effect.bin','assets/resources/config.json','assets/main/index.js'])assert.ok(source.resources[file]);
// Decode only the frozen string table, then exercise original Screw methods.
// These fixtures test adapter semantics; they are not platform event evidence.
const main=source.resources['assets/main/index.js'],at=main.indexOf('System['),table={};
vm.runInNewContext(main.slice(0,at-1)+');',table,{timeout:1000});
const aliases=new Set(['b']);
for(let n=0;n<20;n++)for(const match of main.matchAll(/\b([A-Za-z_$]\w*)=([A-Za-z_$]\w*)[;,]/g))if(aliases.has(match[2]))aliases.add(match[1]);
const decoded=main.slice(at).replace(/\b([A-Za-z_$]\w*)\((0x[\da-f]+)\)/g,(all,fn,arg)=>aliases.has(fn)?JSON.stringify(table.b(Number(arg))):all);
const pretty=transformSync('function b(){};'+decoded.slice(0,-2)+';',{minify:false}).code;
function method(name,next){
 const begin=pretty.indexOf('aB["'+name+'"] = function'),end=pretty.indexOf('}, aB["'+next+'"]',begin);
 assert.ok(begin>=0&&end>begin,'native handler anchor '+name);
 return pretty.slice(pretty.indexOf('function',begin),end+1);
}
async function fixture(){
 const calls=[],state={running:false};
 class GameSystem{win(){}lose(){}}
 const game=new GameSystem();game.Level={totalScrewCount:4,screws:[],CurrentScrewRemain:4,PickedScrewCount:0};
 let match=false,temp=true;
 game.BoxContainer={getFreeHole:()=>match?{}:null};game.PaticleSystem={playPlugout(){}};
 const globals={b(){},sp:null,ay:{IN_Obstacle:0,IN_Box:1,IN_Temp:2},U:()=>game,console:{log(){}}};
 class Screw{constructor(){this.state=0;this.tempHoles={getFreeHole:()=>temp?{}:null};this.blocked=false;}isBlocked(){return this.blocked;}vibration(){}updateAffectedScrewsBeforeRemove(){}checkUnjoint(){}attractToHole(){}}
 for(const [name,next] of [['onPickHandle','handleInObstacleState'],['handleInObstacleState','moveToHole'],['moveToHole','checkMoveToBox'],['checkMoveToBox','fastMoveToBox']])Screw.prototype[name]=vm.runInNewContext('('+method(name,next)+')',globals);
 class PickScrewHandle{}class PlayableAdsManager{}class LoseNode{}class BGSystem{}class MultiScreenSystem{}
 const modules={GameSystem:{GameSystem,getGameSystem:()=>game},Screw:{Screw,eScrewState:globals.ay},PickScrewHandle:{PickScrewHandle},PlayableAdsManager:{PlayableAdsManager},LoseNode:{LoseNode},BGSystem:{BGSystem},MultiScreenSystem:{MultiScreenSystem}};
 const adapter=vm.runInNewContext(read('src/adapter.js')+';screwdomAdapter');
 await adapter({cc:{director:{getScene:()=>null},view:{resizeWithBrowserSize(){}}},system:{import:async name=>modules[name.match(/([^/]+)\.ts$/)[1]]},shell:Object.fromEntries(['step','win','fail'].map(name=>[name,(...args)=>calls.push([name,...args])])),root:{style:{setProperty(){}}},isRunning:()=>state.running});
 return {Screw,game,calls,state,setMatch:v=>{match=v;},setTemp:v=>{temp=v;}};
}
const f=await fixture(),s=new f.Screw();s.onPickHandle();assert.equal(f.calls.length,0,'before start no action');
f.state.running=true;s.blocked=true;s.onPickHandle();assert.equal(f.calls.length,0,'blocked screw does not count');
s.blocked=false;f.setTemp(false);s.onPickHandle();assert.equal(f.calls.length,0,'full buffers do not count');
f.setTemp(true);s.onPickHandle();assert.deepEqual(f.calls,[['step',25]],'successful screw removal');
s.onPickHandle();assert.equal(f.calls.length,1,'no matching box is invalid');
f.setMatch(true);s.onPickHandle();assert.deepEqual(f.calls.at(-1),['step',25],'manual transfer counts without increasing removal progress');
s.onPickHandle();assert.equal(f.calls.length,2,'already collected screw does not count');
const s2=new f.Screw();s2.state=2;s2.linkedHole={};s2.checkMoveToBox();assert.equal(f.calls.length,2,'automatic transfer is not another player step');
f.state.running=false;new f.Screw().onPickHandle();assert.equal(f.calls.length,2,'paused input blocked');
f.state.running=true;f.game.win();f.game.win();f.game.lose();assert.equal(f.calls.filter(x=>x[0]==='win').length,1);assert.equal(f.calls.filter(x=>x[0]==='fail').length,0,'result deduplicated');
const fail=await fixture();fail.state.running=true;fail.game.lose();fail.game.lose();assert.deepEqual(fail.calls,[['fail']]);
console.log('Screwdom source integrity, deterministic build, original Screw handlers and result deduplication passed.');
