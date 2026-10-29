import { installOriginCta } from './lib/origin-cta-runtime.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { getEntry } from '../core/registry.mjs';
import { originHtml, originCtaPolicy, packOrigin, originPrerequisites } from '../core/lib/origin-playable.mjs';
import { configWhitelistFor } from '../lib/store.mjs';

export function runtime(entry, intro = false) {
  const listeners = new Map(), calls = [];
  const window = {
    __novvyStageChain__: intro ? ['video','playable'] : ['playable'],
    __ORIGIN_CONFIG__: { intro, policy: { mode: 'steps', afterSteps: 2, intervals: [2,1] } },
    addEventListener(name, fn, options) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push({ fn, once: options?.once }); },
    dispatchEvent(e) { for (const handler of [...listeners.get(e.type) || []]) { handler.fn(e); if (handler.once) listeners.get(e.type).splice(listeners.get(e.type).indexOf(handler),1); } },
    NovvyPlayable: Object.fromEntries(['setStageList','setStage','onStep','onComplete','onReplay','endStage','click'].map(name => [name, (...args) => calls.push([name,...args])])),
    NovvyAnalytics: { registerMedia: () => calls.push(['media']) },
  };
  const Game = new EventEmitter();
  Game.init = () => calls.push(['boot']);
  Game.showWindow = next => { Game.currentWindow = next; };
  const CONFIG = { application: { tapsToRedirect: 15, secToRedirect: 30 } };
  const context = vm.createContext({ window, Game, CONFIG, console: { log() {} }, document: { getElementById: () => intro ? {} : null },
    CustomEvent: class { constructor(type, options) { this.type=type; this.detail=options?.detail; } } });
  vm.runInContext(fs.readFileSync(path.join(entry.dir, 'overlays/engine/events.js'), 'utf8'), context);
  const cta = installOriginCta(context);
  vm.runInContext(fs.readFileSync(path.join(entry.dir, 'overlays/engine/engine.js'), 'utf8'), context);
  function field() {
    const result = new EventEmitter();
    result.engine = { foundations: { columns: Array.from({ length:4 },()=>({cards:[]})) }, foundationsFilled: () => result.engine.foundations.columns.every(c=>c.cards.length===13) };
    Game.showWindow({ field: result });
    return result;
  }
  window.__ORIGIN_ADAPTER__.start(()=>Game.init());
  const emit = (type,detail) => window.dispatchEvent(type === 'pagehide' ? {type,...detail} : {type,detail});
  return { cta, window, Game, CONFIG, calls, field, emit };
}
export default async function test(a) {
  const entry = getEntry('freecell-origin');
  const base = { root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config:entry.template.defaults };
  a.check(configWhitelistFor(entry.id).has('playableCta'),'CTA configuration persists');
  a.equal(originHtml(base).stageChain,['playable'],'pure playable chain');
  const video = originHtml({...base,config:{...base.config,intro:{enabled:true}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}});
  a.equal(video.stageChain,['video','playable'],'video then playable chain');
  a.check(video.html.indexOf('data-novvy-playable-bridge')<video.html.indexOf('<script data-novvy-intro>'),'media registration precedes video script');
  a.check(!originHtml({...base,preview:true}).html.includes('src="core.js"'),'preview inlines source files');
  a.equal(originPrerequisites(base.config),{uploads:[],generated:[]},'pure mode requires no media');
  a.equal(originPrerequisites({intro:{enabled:true}}).generated,['intro-video.mp4','poster.webp'],'video pack requires generated media');
  a.equal(originCtaPolicy({mode:'steps',afterSteps:20,intervals:[10,-1,1.5,8]}).intervals,[10,8],'invalid CTA intervals filtered');
  const r = runtime(entry), f = r.field();
  r.Game.emit('on-Card-Pointer-Up');
  a.equal(r.calls.filter(c=>c[0]==='onStep').length,0,'raw taps do not count');
  f.emit('appliedTableauTableau');
  a.equal(r.calls.filter(c=>c[0]==='onStep'),[['onStep',1,{progress:0}]],'valid move counts without inventing progress');
  f.engine.foundations.columns[0].cards.push({}); f.emit('appliedTableauFoundations');
  a.equal(r.calls.filter(c=>c[0]==='onStep').at(-1),['onStep',2,{progress:100/52}],'foundation progress uses actual cards');
  a.equal(r.calls.filter(c=>c[0]==='click').length,1,'first policy CTA on valid step');
  for(let i=0;i<4;i++) f.emit('appliedEmptySlotsTableau');
  a.equal(r.calls.filter(c=>c[0]==='click').length,4,'CTA intervals advance then repeat last gap');
  r.window.__ORIGIN_ADAPTER__.cta(true,'native-cta');
  a.equal(r.calls.at(-1)[1].click_source,'cta_click','native CTA stays manual');
  a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'CTA does not end gameplay');
  a.equal(r.CONFIG.application,{tapsToRedirect:0,secToRedirect:null},'native redirect lock disabled');
  f.emit('userWin');
  a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'success signal checked against real target');
  r.Game.emit('no-tutorial-options'); r.Game.emit('no-tutorial-options');
  a.equal(r.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'fail',continue_playing:true}]],'failure reported once with replay allowed');
  r.Game.emit('retry'); const next = r.field(); r.Game.showWindow({field:next}); next.emit('appliedTableauEmptySlots');
  a.equal(r.calls.filter(c=>c[0]==='onReplay').length,1,'same-stage replay reported');
  a.equal(r.calls.filter(c=>c[0]==='onStep').length,7,'new field attached once; stage steps continue');
  next.engine.foundations.columns.forEach(c=>c.cards=Array(13).fill({})); next.emit('userWin'); next.emit('userWin');
  a.equal(r.calls.filter(c=>c[0]==='onComplete').at(-1),['onComplete',{result:'win',continue_playing:false}],'final win ends stage');
  a.equal(r.calls.filter(c=>c[0]==='onComplete').length,2,'duplicate final callback ignored');
  r.emit('pagehide',{}); a.equal(r.calls.filter(c=>c[0]==='endStage').length,0,'finished stage is not resettled');
  const pending=runtime(entry,true);
  a.equal(pending.calls.filter(c=>c[0]==='boot').length,0,'video delays game initialization');
  pending.emit('novvy:intro-finished'); pending.emit('novvy:intro-finished');
  a.equal(pending.calls.filter(c=>c[0]==='boot').length,1,'game starts once after intro');
  a.equal(pending.calls.filter(c=>c[0]==='setStage').map(c=>c.slice(1)),[[1,'video'],[2,'playable']],'stage changes once');
  a.equal(pending.calls.filter(c=>c[0]==='media').length,1,'media registered once');
  pending.emit('novvy:viewablechange',{viewable:false}); pending.emit('pagehide',{persisted:true});
  a.equal(pending.calls.filter(c=>c[0]==='endStage').length,0,'background and bfcache are resumable');
  pending.emit('pagehide',{persisted:false});
  a.equal(pending.calls.filter(c=>c[0]==='endStage').length,1,'unfinished departure ends stage');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'freecell-pack-'));
  try {
    const ctx={templateRoot:base.root,pluginDir:base.pluginDir,template:base.template,config:base.config,resultDir:path.join(dir,'result'),generatedDir:path.join(dir,'generated'),uploads:{'intro-video':path.join(dir,'original.mp4')}};
    await packOrigin(ctx); const first=fs.readFileSync(path.join(ctx.resultDir,'index.html'),'utf8');
    await packOrigin(ctx); a.equal(fs.readFileSync(path.join(ctx.resultDir,'index.html'),'utf8'),first,'pack deterministic');
    fs.mkdirSync(ctx.generatedDir); fs.writeFileSync(ctx.uploads['intro-video'],'original');
    fs.writeFileSync(path.join(ctx.generatedDir,'intro-video.mp4'),'transcoded'); fs.writeFileSync(path.join(ctx.generatedDir,'poster.webp'),'poster');
    ctx.config={...ctx.config,intro:{enabled:true}}; await packOrigin(ctx);
    a.equal(fs.readFileSync(path.join(ctx.resultDir,'intro-video.mp4'),'utf8'),'transcoded','pack selects transcoded video');
    ctx.config=base.config; await packOrigin(ctx);
    a.check(!fs.existsSync(path.join(ctx.resultDir,'intro-video.mp4')),'turning video off removes stale media');
    a.equal(fs.readdirSync(ctx.resultDir).sort(),['assets.js','boot.js','config.js','core.js','index.html','layout.js','preloader.js','runtime.js','vendor.js'],'package contains only local game runtime');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
