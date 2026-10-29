import { installOriginCta } from './lib/origin-cta-runtime.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { getEntry } from '../core/registry.mjs';
import { originHtml } from '../core/lib/origin-playable.mjs';
import { configWhitelistFor } from '../lib/store.mjs';
export function runtime(intro=false){
 const entry=getEntry('tasty-travels-origin'),calls=[],listeners=new Map();
 const window={__novvyStageChain__:intro?['video','playable']:['playable'],__ORIGIN_CONFIG__:{intro,policy:{mode:'steps',afterSteps:2,intervals:[2]}},addEventListener(k,f){if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(f);},dispatchEvent(e){for(const f of listeners.get(e.type)||[])f(e);},NovvyPlayable:Object.fromEntries(['setStageList','setStage','onStep','onComplete','onReplay','endStage','click'].map(k=>[k,(...args)=>calls.push([k,...args])])),NovvyAnalytics:{registerMedia(){calls.push(['media'])}}};
 const ctx=vm.createContext({window,console:{log(){}},document:{getElementById:()=>intro?{}:null},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o?.detail;}}});
 vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/events.js`,'utf8'),ctx);
 const cta=installOriginCta(ctx);
 vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/engine.js`,'utf8'),ctx);
 class Game{constructor(){this.tool={};this.isEnd=false;}downLoadApp(){}game1_Start(){calls.push(['native-start']);}game1_End(){this.tool=null;}createTool2(tier){if(tier>=9)this.EndStep();}EndStep(){this.isEnd=true;}}
 const telemetry={report(){calls.push(['source-telemetry']);}};const req=k=>k==='GameScript'?{default:Game}:{MarkUtil:telemetry};
 window.__ORIGIN_ADAPTER__.install(req);window.__ORIGIN_ADAPTER__.install(req);window.__ORIGIN_ADAPTER__.start(()=>calls.push(['launch']));
 const game=new Game();return {cta,window,calls,game,telemetry,drop(){game.tool={};game.game1_End();},emit:(type,detail)=>window.dispatchEvent({type,detail})};
}
export default async function test(a){
 const entry=getEntry('tasty-travels-origin');a.check(configWhitelistFor(entry.id).has('playableCta'),'settings persist');
 const base={root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config:entry.template.defaults};
 const titled=originHtml({...base,config:{...base.config,hud:{...base.config.hud,titleEnabled:true}}}).html;
 a.check(!titled.includes('id="origin-sound"'),'game has no sound toggle');
 a.check(titled.includes('id="novvy-training-hud"')&&!titled.includes('data-novvy-origin-shell'),'HUD overlays the full canvas');
 const icon=fs.readFileSync(`${entry.templateDir}/${entry.template.game.ctaCard.icon}`);
 a.check(titled.includes('id="novvy-cta"')&&titled.includes(`data:image/webp;base64,${icon.toString('base64')}`),'shared CTA card embeds the original App Store icon bytes');
 a.check(titled.includes('<div class="novvy-cta-name">Tasty Travels: Merge Game</div>'),'CTA displays the official App Store name');
 a.equal(originHtml(base).stageChain,['playable'],'pure playable');a.equal(originHtml({...base,config:{...base.config,intro:{enabled:true}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}}).stageChain,['video','playable'],'combined playable');
 const cta=runtime();cta.game.downLoadApp({stopPropagation(){}});cta.game.game1_End();a.equal(cta.calls.filter(c=>c[0]==='onStep').length,0,'CTA release does not launch food');cta.game.game1_Start();cta.game.game1_End();a.equal(cta.calls.filter(c=>c[0]==='onStep').length,1,'next gameplay gesture works after CTA');
 const r=runtime();r.telemetry.report('CHALLENGE_SOLVED');r.game.game1_Start();a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'native touch telemetry is not success');
 r.drop();r.game.game1_End();a.equal(r.calls.filter(c=>c[0]==='onStep'),[['onStep',1,{progress:0}]],'one consumed item is one step, empty release ignored');
 r.game.createTool2(3);r.drop();a.check(Math.abs(r.calls.filter(c=>c[0]==='onStep').at(-1)[2].progress - 100/3) < 1e-9,'progress from actual merged tier');
 a.equal(r.calls.filter(c=>c[0]==='click').length,1,'step policy CTA');r.game.createTool2(1);r.drop();a.check(Math.abs(r.calls.filter(c=>c[0]==='onStep').at(-1)[2].progress - 100/3) < 1e-9,'lower merge keeps maximum tier');
 r.window.__ORIGIN_ADAPTER__.cta(true,'native-cta');a.equal(r.calls.at(-1)[1].click_source,'cta_click','download remains manual');a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'download does not end game');
 r.game.createTool2(9);r.game.EndStep();a.equal(r.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'win',continue_playing:false}]],'tier nine native end is one win');r.game.game1_Start();a.equal(r.calls.filter(c=>c[0]==='native-start').length,1,'result background tap does not become CTA');
 const f=runtime();f.drop();f.game.EndStep();f.game.EndStep();f.drop();a.equal(f.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'fail',continue_playing:false}]],'native boundary end is one fail');a.equal(f.calls.filter(c=>c[0]==='onStep').length,1,'ended game cannot submit more drops');
 const video=runtime(true);a.equal(video.calls.filter(c=>c[0]==='launch').length,0,'video gates engine');video.emit('novvy:intro-finished');a.equal(video.calls.filter(c=>c[0]==='setStage'),[['setStage',1,'video'],['setStage',2,'playable']],'video transition');a.equal(video.calls.filter(c=>c[0]==='launch').length,1,'engine launches after video');
}
