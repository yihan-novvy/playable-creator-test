import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {getEntry} from '../../../editor/core/registry.mjs';
import {effectiveConfig} from '../../../editor/core/runner.mjs';
import {candyCrushHtml,prerequisites} from '../../../editor/plugins/candy-crush-origin/lib.mjs';
import {candyModel} from './candy-model.mjs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {PerspectiveCamera,Raycaster,Vector3} from 'three';
const root=new URL('../',import.meta.url),built=new URL('../../../editor/templates/candy-crush-origin/',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const game=fs.readFileSync(new URL('game/game.js',built),'utf8');
execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
assert.equal(fs.readFileSync(new URL('game/game.js',built),'utf8'),game,'deterministic original-engine build');
const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',built)));
for(const [file,hash] of Object.entries(manifest.constants.fileHashes)){
  const bytes=fs.readFileSync(new URL(file,built));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  if(file.endsWith('.js'))new vm.Script(bytes.toString());
}
assert.equal((game.match(/NovvyGame\(function/g)||[]).length,1);
assert.ok(!/postMessage|messageHandlers|NovvyPlayable|NovvyAnalytics|NovvyShell|window\.open\(|mraid\./.test(game));
const source=JSON.parse(game.match(/^const SOURCE=(.*);$/m)[1]);
assert.equal(source.params.tapsToBreak.value,71);
assert.ok(game.includes('const CANDY_TARGET_HITS=71;'));
assert.ok(!game.includes('2024 king.com Ltd.'));
assert.equal(source.texts.en.textLegal,'');
const inventory=candyModel(read('source/original.html'));
assert.equal(inventory.maxHits,71);assert.equal(manifest.constants.game.maxHits,inventory.maxHits);
assert.equal(source.params.hideCTA.value,true);
assert.equal(source.params.fullscreenCta.value,false);
assert.ok(source.engine.includes('e.length>0&&e[0].object.visible'));
assert.ok(source.engine.includes('this.#At++,globalThis.CCS_CONTEXT.step(this.#At,this.#Y.params.tapsToBreak.value,this.components.World["сolorbomb"],this.#Et)'));
assert.ok(source.engine.includes('onComplete:this.winGame'));
// Adapter-only fixtures: no HTML mock, synthetic game input or official-platform claims.
async function fixture(target=71){
  let entry,context,frame;const calls=[],events=new Map(),animations=[];let removed=false;
  const node={style:{},clientWidth:390,clientHeight:844,addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type)};
  const scope={window:{},audioContexts:new Set(),run(){context=scope.window.CCS_CONTEXT;},pause(){calls.push(['pause']);},resume(){calls.push(['resume']);},dispose(){calls.push(['dispose']);}};
  scope.window.setTimeout=()=>0;scope.window.clearTimeout=()=>{};scope.window.requestAnimationFrame=fn=>{frame=fn;};
  vm.runInNewContext(read('src/game.js'),{NovvyGame:fn=>{entry=fn;},engineRoot:()=>({root:node,mount:{remove(){removed=true;}}}),createEngineScope:()=>scope,SOURCE:source,CANDY_TARGET_HITS:target,window:{devicePixelRatio:3},console});
  const promise=entry({},Object.fromEntries(['step','win','fail'].map(name=>[name,(...args)=>calls.push([name,...args])])),{env:{muted:true,safeArea:{top:54},insets:{bottom:110}}});
  const app={resizeManager:{call(){}},components:{Legal:{visible:true,renderable:true}},soundManager:{on(){},off(){}}};
  context.ready(app,{mute(value){calls.push(['mute',value]);},unload(){calls.push(['unload']);}},{globalTimeline:{clear(){},getChildren(){return animations;}},ticker:{sleep(){}}});frame();const instance=await promise;
  assert.equal(app.components.Legal.visible,false,'footer node hidden');
  assert.equal(scope.window.params.tapsToBreak.value,target,'native win target matches baked configuration');
  return {instance,context,calls,node,animations,unlock:()=>events.get('pointerdown')?.(),removed:()=>removed};
}
const f=await fixture();f.context.step(1,71);assert.equal(f.calls.filter(c=>c[0]==='step').length,0);
f.instance.start();f.context.step(1,71);f.context.step(1,71);assert.deepEqual(f.calls.filter(c=>c[0]==='step'),[['step',1/71*100]]);
f.unlock();assert.equal(f.context.audible(),false,'muted env wins over native first touch');f.instance.setEnv({muted:false});assert.equal(f.context.audible(),true);
f.instance.pause();f.context.step(2,71);assert.equal(f.calls.filter(c=>c[0]==='step').length,1);assert.equal(f.context.audible(),false);
f.instance.resume();for(let i=2;i<=71;i++)f.context.step(i,71);
assert.deepEqual(f.calls.filter(c=>c[0]==='step').map(c=>c[1]),Array.from({length:71},(_,i)=>(i+1)/71*100));
f.context.win();f.context.win();f.context.winAnimationReady();f.context.winFrame(0);f.context.fail();assert.equal(f.calls.filter(c=>c[0]==='win').length,1);assert.equal(f.calls.filter(c=>c[0]==='fail').length,0);
assert.equal(f.context.area().height,680,'layout respects top and bottom without shrinking canvas');
f.instance.destroy();f.instance.destroy();assert.equal(f.removed(),true);assert.equal(f.context.alive(),false);assert.equal(f.calls.filter(c=>c[0]==='dispose').length,1);
const retry=await fixture();retry.instance.start();retry.context.step(1,71);assert.equal(retry.calls.filter(c=>c[0]==='step').length,1);retry.instance.destroy();
for(const target of [71]){
  const f=await fixture(target);f.instance.start();
  f.context.step(1,target+1);f.context.step(2,target);f.context.step(0,target);
  assert.equal(f.calls.filter(c=>c[0]==='step').length,0,'mismatched totals, skipped and zero counts rejected');
  for(let i=1;i<=target;i++)f.context.step(i,target);
  f.context.step(target+1,target);
  const values=f.calls.filter(c=>c[0]==='step').map(c=>c[1]);
  assert.equal(values.length,target);assert.ok(Math.abs(values[0]-100/target)<1e-10);assert.equal(values.at(-1),100);
  f.context.win();f.context.win();f.context.winAnimationReady();f.context.winFrame(0);assert.equal(f.calls.filter(c=>c[0]==='win').length,1);f.instance.destroy();
}
// Success is settled by the real animation/particle boundary, not a wall-clock delay.
const animated=await fixture();animated.instance.start();
animated.context.win();animated.context.winAnimationReady();animated.context.winFrame(0);
assert.equal(animated.calls.filter(c=>c[0]==='win').length,0,'cannot win before 71 real steps');
for(let i=1;i<=71;i++)animated.context.step(i,71);
const oldLoop={parent:{},totalProgress:()=>0,repeat:()=>-1};animated.animations.push(oldLoop);
animated.context.win();
let progress=0;
const landing={parent:{},totalProgress:()=>progress};animated.animations.push(landing);
const loop={parent:{repeat:()=>-1},totalProgress:()=>0};animated.animations.push(loop);
animated.context.winAnimationReady();animated.context.winFrame(0);
assert.equal(animated.calls.filter(c=>c[0]==='win').length,0,'landing animation still running');
assert.equal(animated.node.style.pointerEvents,'none','no gameplay during celebration');
animated.instance.pause();progress=1;animated.context.winFrame(0);
assert.equal(animated.calls.filter(c=>c[0]==='win').length,0,'hidden page cannot settle');
animated.instance.resume();assert.equal(animated.node.style.pointerEvents,'none');
animated.context.winFrame(1);assert.equal(animated.calls.filter(c=>c[0]==='win').length,0,'wait for last explosion particle');
animated.context.winFrame(0);animated.context.winFrame(0);
assert.equal(animated.calls.filter(c=>c[0]==='win').length,1,'one result after all finite animation and particles finish');
animated.instance.destroy();
const interrupted=await fixture();interrupted.instance.start();
for(let i=1;i<=71;i++)interrupted.context.step(i,71);
interrupted.context.win();interrupted.context.winAnimationReady();interrupted.instance.destroy();interrupted.context.winFrame(0);
assert.equal(interrupted.calls.filter(c=>c[0]==='win').length,0,'destroy cancels pending result');
assert.ok(source.engine.includes('globalThis.CCS_CONTEXT.winAnimationReady()'));
assert.ok(source.engine.includes('globalThis.CCS_CONTEXT.winFrame(this.#Lt.length+this.#Dt.length)'));
const entry=getEntry('candy-crush-origin'),config=effectiveConfig(entry.template,{});
assert.equal(config.gameplay.tapsToBreak,undefined);
assert.equal(config.cta.enabled,true);assert.equal(config.playableCta.enabled,true);assert.equal(config.gameplay.allowReplay,false);assert.equal(config.intro.enabled,false);
const build=config=>candyCrushHtml({root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config,preview:true});
const html=build(config).html;assert.ok(html.includes('novvy-cta-btn'));assert.ok(html.includes('Candy Crush Saga'));
for(const legacyCount of [1,5,10,71,72,'10',null]){
  const configured=build({...config,gameplay:{tapsToBreak:legacyCount}});
  assert.equal(configured.game,game,'legacy settings cannot override fixed 71');
  assert.ok(configured.html.includes('const CANDY_TARGET_HITS=71;'));
  assert.equal(configured.targetHits,71);
}
assert.ok(!build({...config,cta:{enabled:false}}).html.includes('id="novvy-cta"'));
assert.ok(build({...config,playableCta:{enabled:true,mode:'complete',afterSteps:3,intervals:[2]}}).html.includes('"mode":"complete"'));
assert.deepEqual(prerequisites(config),{uploads:[],generated:[]});
assert.deepEqual(prerequisites({...config,intro:{enabled:true}}),{uploads:['intro-video'],generated:['intro-video.mp4','poster.webp']});
const intro=candyCrushHtml({root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config:{...config,intro:{enabled:true,goEnabled:true,goText:'Legacy GO'}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'},preview:false});
assert.deepEqual(intro.stageChain,['video','playable']);assert.ok(!intro.html.includes('Legacy GO'));assert.ok(intro.html.includes('intro-video.mp4'));assert.ok(intro.html.includes('<script src="game.js"></script>'));
// Geometry regression with the actual frozen model: all 71 distinct candies
// remain reachable, including a single candy left on the far side. This is not
// browser input or official event-log evidence.
const turnContext={};vm.runInNewContext(read('src/remaining-candy.js'),turnContext);
const gltf=await new GLTFLoader().parseAsync(inventory.world.buffer.slice(inventory.world.byteOffset,inventory.world.byteOffset+inventory.world.byteLength),'');
const ball=gltf.scene.getObjectByName('сolorbomb'),camera=new PerspectiveCamera(35,390/680,0.1,100),raycaster=new Raycaster();
ball.getObjectByName('сolorbombBg').visible=false;camera.position.set(-5,0.3,0);camera.lookAt(5,0.3,0);camera.updateMatrixWorld();
const candies=ball.children.filter(node=>node.visible);
const reachable=()=>{
  ball.updateWorldMatrix(true,true);
  return candies.find(candy=>{
    if(!candy.visible)return false;
    const point=candy.getWorldPosition(new Vector3()).project(camera);
    if(Math.abs(point.x)>=1||Math.abs(point.y)>=1||Math.abs(point.z)>=1)return false;
    raycaster.setFromCamera(point,camera);
    return raycaster.intersectObjects(ball.children,false)[0]?.object===candy;
  });
};
let rescued=0;
for(let count=0;count<71;count++){
  // Deterministic rotations exercise successively sparse candy distributions.
  ball.rotation.set(count*1.17,count*0.79,count*0.43);
  const turn=turnContext.remainingCandyTurn(ball,camera,raycaster);
  if(turn){ball.quaternion.copy(turn.to);rescued++;}
  const candy=reachable();assert.ok(candy,`a visible candy is reachable after ${count} hits`);candy.visible=false;
}
assert.ok(rescued>0,'sparse-round recovery actually exercised');
assert.equal(turnContext.remainingCandyTurn(ball,camera,raycaster),null);
console.log(`Candy Crush: fixed 71/legacy config ignored/footer removed, progress/lifecycle, source/hash/determinism and all 71 model targets passed (${rescued} recovery turns).`);
