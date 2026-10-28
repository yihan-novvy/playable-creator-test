import { installOriginCta } from './lib/origin-cta-runtime.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { getEntry } from '../core/registry.mjs';
import { originHtml } from '../core/lib/origin-playable.mjs';
import { configWhitelistFor } from '../lib/store.mjs';
export function runtime(intro=false, nativeRelease=null) {
  const entry=getEntry('grill-sort-origin'), listeners=new Map(), calls=[];
  const window={__novvyStageChain__:intro?['video','playable']:['playable'],__ORIGIN_CONFIG__:{intro,policy:{mode:'steps',afterSteps:2,intervals:[1]}},
    addEventListener(k,f){if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(f);},dispatchEvent(e){for(const f of listeners.get(e.type)||[])f(e);},
    NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStep','onComplete','onReplay','endStage','click'].map(k=>[k,(...args)=>calls.push([k,...args])])),NovvyAnalytics:{registerMedia(){calls.push(['media']);}}};
  const ctx=vm.createContext({window,console:{log(){}},document:{getElementById:()=>intro?{}:null},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o?.detail;}}});
  vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/events.js`,'utf8'),ctx);
 const cta=installOriginCta(ctx);
 vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/engine.js`,'utf8'),ctx);
  let exports={};const system={register(id,deps,declare){declare((k,v)=>exports[k]=v,{});}};
  window.__ORIGIN_ADAPTER__.install(system);
  class Game{initGame(){}releaseDone(...args){if(nativeRelease)return nativeRelease.apply(this,args);this._doneNum+=3;if(this._doneNum>=120)this.checkSuccess();}checkSuccess(){}checkFail(){this.isFail=true;} constructor(){this._doneNum=0;}}
  class Box{addItem(){} constructor(){this._index=0;}}
  class AudioManager{_playAudioByRes(...args){return args;}}
  for(const [name,value] of Object.entries({Game,Box,AudioManager}))system.register(`chunks:///_virtual/${name}.ts`,[],publish=>publish(name,value));
  const game=new Game(),box=new Box(); game.initGame();
  window.__ORIGIN_ADAPTER__.start(()=>calls.push(['launch']));
  return {cta,game,box,calls,window,AudioManager,emit:(type,detail)=>window.dispatchEvent({type,detail}),move:()=>box.addItem({_type:1,_boxIndex:1,_index:0},0,false)};
}
export default async function test(a){
  const entry=getEntry('grill-sort-origin');a.check(configWhitelistFor(entry.id).has('playableCta'),'CTA settings persist');
  const base={root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config:entry.template.defaults};
  a.equal(originHtml(base).stageChain,['playable'],'pure chain');a.equal(originHtml({...base,config:{...base.config,intro:{enabled:true}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}}).stageChain,['video','playable'],'combined chain');
  const r=runtime();r.box.addItem({_type:1,_boxIndex:0,_index:0},0,false);r.box.addItem({_type:1,_boxIndex:1,_index:0},0,true);
  a.equal(r.calls.filter(c=>c[0]==='onStep').length,0,'same slot and automatic refill ignored');
  r.move();r.game._doneNum=3;r.move();
  a.equal(r.calls.filter(c=>c[0]==='onStep'),[['onStep',1,{progress:0}],['onStep',2,{progress:2.5}]],'valid placements count and progress uses packed items');
  a.equal(r.calls.filter(c=>c[0]==='click').length,1,'step CTA');r.move();a.equal(r.calls.filter(c=>c[0]==='click').length,2,'CTA repeats');
  r.window.__ORIGIN_ADAPTER__.cta(true,'native-cta');a.equal(r.calls.at(-1)[1].click_source,'cta_click','native CTA manual');a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'CTA does not settle');
  r.game.checkSuccess();a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'premature success rejected');r.game._doneNum=120;r.game.checkSuccess();r.game.checkSuccess();
  a.equal(r.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'win',continue_playing:false}]],'native final target settles once');
  const failed=runtime();failed.game.checkFail();failed.game.checkFail();failed.move();a.equal(failed.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'fail',continue_playing:false}]],'timeout settles fail once, original has no replay');a.equal(failed.calls.filter(c=>c[0]==='onStep').length,0,'settled game ignores steps');
  const video=runtime(true);a.equal(video.calls.filter(c=>c[0]==='launch').length,0,'video gates engine startup');video.emit('novvy:intro-finished');a.equal(video.calls.filter(c=>c[0]==='setStage'),[['setStage',1,'video'],['setStage',2,'playable']],'video stage transition');a.equal(video.calls.filter(c=>c[0]==='launch').length,1,'engine starts after intro');
  r.window.__ORIGIN_MUTED__=true;a.equal(new r.AudioManager()._playAudioByRes('clip','name',true,1)[3],0,'new audio respects mute');
}
