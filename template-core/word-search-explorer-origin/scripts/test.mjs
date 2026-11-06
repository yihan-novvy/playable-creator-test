import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/word-search-explorer-origin/',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=()=>fs.readFileSync(new URL('game/game.js',built),'utf8');
const before=output();execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});assert.equal(output(),before,'build is deterministic');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
 const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
const source=JSON.parse(before.match(/^const SOURCE=(.*);$/m)[1]);new vm.Script(source.engine);
assert.ok(!/postMessage|NovvyPlayable|NovvyAnalytics|mraid\.|window\.open\(/.test(before));
assert.equal((before.match(/NovvyGame\(function/g)||[]).length,1);
assert.ok(source.engine.includes('KIND|5,1|S-KIND|5,1|S'),'original duplicate target remains');
assert.ok(source.engine.includes('He++,ai++,window.WSE_CONTEXT.step(He,js)'),'progress hooks the native success handler');
// In-memory adapter fixture. These assertions are lifecycle coverage, never
// a substitute for the official platform message/report acceptance trace.
let factory,context,removed=0,destroyed=0,disposals=0,scopePaused=false;
const timers=[],calls=[],scene={input:{enabled:true}},game={scene:{scenes:[scene]},sound:{mute:false},destroy(){destroyed++;},runDestroy(){}};
const app={areComponentsReady:true,components:new Map(),playable:{phaserGame:game,props:{options:{}},onResizeHandler(){}}};
const view={root:{clientWidth:390,clientHeight:844,style:{}},mount:{remove(){removed++;}}};
const scope={window:{devicePixelRatio:2,requestAnimationFrame(fn){queueMicrotask(fn);},setTimeout(fn){timers.push(fn);}},audioContexts:new Set(),run(){context=scope.window.WSE_CONTEXT;context.attach(app);context.ready(app);},pause(){scopePaused=true;},resume(){scopePaused=false;},dispose(){disposals++;}};
vm.runInNewContext(read('src/game.js'),{NovvyGame(fn){factory=fn;},engineRoot:()=>view,createEngineScope:()=>scope,SOURCE:{engine:''},Promise,Number,Math,Error});
const runtime=await factory({},Object.fromEntries(['step','win','fail','cta'].map(name=>[name,(...args)=>calls.push([name,...args])])),{env:{muted:true}});
context.step(1,17);assert.equal(calls.length,0,'no steps before start');assert.equal(scopePaused,true);assert.equal(scene.input.enabled,false);assert.equal(game.sound.mute,true);
runtime.start();context.step(1,17);context.step(1,17);assert.equal(calls.length,1,'duplicate native callback suppressed');assert.ok(Math.abs(calls[0][1]-100/17)<1e-10);
runtime.pause();context.step(2,17);assert.equal(calls.length,1);assert.equal(scene.input.enabled,false);assert.equal(scopePaused,true);
runtime.resume();context.step(2,17);assert.equal(calls.length,2);assert.equal(scene.input.enabled,true);
runtime.setEnv({safeArea:{top:40,bottom:20},insets:{top:120,bottom:100}});
const area=context.bounds({componentId:'letterBoard1'});assert.equal(area.top,240);assert.equal(area.height,(844-120-100)*2,'insets use max, not sum');
assert.equal(context.bounds({componentId:'background1'}).height,1688,'background stays full viewport');
for(let count=3;count<=17;count++)context.step(count,17);context.step(17,17);assert.equal(calls.filter(c=>c[0]==='step').length,17);assert.equal(timers.length,1);timers.shift()();assert.equal(calls.filter(c=>c[0]==='win').length,1);assert.equal(scene.input.enabled,false);
runtime.destroy();runtime.destroy();context.step(18,17);assert.equal(destroyed,1);assert.equal(disposals,1);assert.equal(removed,1);
console.log('Word Search Explorer: source hashes, rebuild, native callback hook, lifecycle, progress, result and bounds passed.');
