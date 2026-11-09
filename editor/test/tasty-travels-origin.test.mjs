import { installOriginCta } from './lib/origin-cta-runtime.mjs';
import { testStory } from './lib/tasty-story-runtime.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { getEntry } from '../core/registry.mjs';
import { originHtml } from '../core/lib/origin-playable.mjs';
import { configWhitelistFor } from '../lib/store.mjs';
const sourceWindow = {};
vm.runInNewContext(fs.readFileSync(new URL('../templates/tasty-travels-origin/game/assets.js', import.meta.url), 'utf8'), { window: sourceWindow });
const nativeCore = sourceWindow.__res['assets/main/index.js'];
const nativeSequence = JSON.parse(nativeCore.match(/\.spToolAll=(\[[^\]]+\])/)[1]);
const nativeCreateTool = nativeCore.match(/\.prototype.createTool=function\(\)\{([\s\S]*?)\},v\.prototype.createTool2/)[1];
const nativePreview = nativeCore.match(/n.nextIconScale=(\[[^\]]+\]),n.nextIconOffsetX=(\[[^\]]+\])/);
const numbers = value => value.slice(1, -1).split(',').map(Number);
export function runtime(intro = false, allowReplay = false, spawnTierOffset, introFinished = false, story = false, storyFinished = false) {
  const entry = getEntry('tasty-travels-origin'), calls = [], listeners = new Map(), ready = [];
  const window = {
    __novvyIntroFinished: introFinished,
    __novvyStoryFinished: storyFinished,
    __novvyStageChain__: intro ? ['video', 'playable'] : ['playable'],
    __ORIGIN_CONFIG__: { intro, story, gameplay: { allowReplay, spawnTierOffset }, policy: { mode: 'steps', afterSteps: 2, intervals: [2] } },
    addEventListener(k, fn, options) { if (!listeners.has(k)) listeners.set(k, []); listeners.get(k).push({ fn, once: options?.once }); },
    dispatchEvent(e) { for (const h of [...listeners.get(e.type) || []]) { h.fn(e); if (h.once) listeners.get(e.type).splice(listeners.get(e.type).indexOf(h), 1); } },
    NovvyPlayable: Object.fromEntries(['setStageList','setStage','onStep','onComplete','onReplay','endStage','click'].map(k=>[k,(...args)=>calls.push([k,...args])])),
    NovvyAnalytics: { registerMedia() { calls.push(['media']); } },
  };
  const elements = Object.fromEntries(['tasty-result','tasty-result-title','tasty-result-copy','tasty-replay'].map(id=>[id, { hidden: true, addEventListener(type, fn) { this[type] = fn; } }]));
  const data = { ToolArray: [], orderIdx: 0, all_Coin_Num: 0, last_Coin_Num: 0, isCanDown: false,
    nextIconScale: numbers(nativePreview[1]), nextIconOffsetX: numbers(nativePreview[2]) };
  const subscriptions = new Set(), audio = new Map();
  const sound = { effectList: new Map(), playEffect(clip, loop) {
    const id = audio.size, name = typeof clip === 'string' ? clip : clip.name;
    audio.set(id, 1); this.effectList.set(name, id); calls.push(['audio', name, loop]);
  } };
  const ToolScript = class {};
  function item(tier) {
    const sprite = { spriteFrame: `tier-${tier}` };
    const children = { sp: { getComponent: () => sprite }, baixian: {} };
    const parts = new Map([[cc.RigidBody, {}], [cc.PhysicsPolygonCollider, {}], [ToolScript, {}], [cc.Sprite, sprite]]);
    return { tier, getChildByName: name => children[name], getComponent: type => parts.get(type) };
  }
  class Game {
    constructor() {
      this.tool = null; this.isEnd = false; this.toolNum = 0; this.spToolAll = nativeSequence.slice();
      this.spTool = Array.from({ length: 10 }, (_, tier) => item(tier));
      this.nextToolSp = item(); this.nextToolSp2 = item();
      this.bronPoint = { x: 0, y: 100 }; this.itemParent = {};
    }
    onLoad() { Game.instance = this; this.createTool(); subscriptions.add(this); sound.playEffect('bgm', true); sound.playEffect('bgm2', true); }
    updateOrder() {}
    unscheduleAllCallbacks() { calls.push(['clearCallbacks']); }
    downLoadApp() {}
    game1_Start() { calls.push(['native-start']); }
    game1_Move() { calls.push(['native-move']); }
    game1_End() { this.tool = null; }
    createTool2(tier) { if (tier >= 9) this.EndStep(); }
    EndStep() { this.isEnd = true; }
  }
  let game, loaded;
  const cc = {
    RigidBody: class {}, PhysicsPolygonCollider: class {}, Sprite: class {},
    instantiate: prefab => item(prefab.tier),
    tween(target) { const chain = { to(time, values) { Object.assign(target, values); return chain; }, start() {} }; return chain; },
    audioEngine: { getState: id=>audio.get(id) ?? -1 },
    Tween: { stopAll() { calls.push(['clearTweens']); } },
    Director: { EVENT_AFTER_DRAW: 'draw' },
    assetManager: { getBundle: ()=>({ loadScene(name, callback) { calls.push(['loadScene', name]); loaded = callback; } }) },
    director: {
      once(name, fn) { ready.push(fn); },
      runSceneImmediate() { game.onDestroy(); game = new Game(); game.onLoad(); calls.push(['sceneReady']); for (const fn of ready.splice(0)) fn(); },
    },
  };
  const ctx = vm.createContext({ window, cc, l: { default: data }, m: { default: ToolScript }, console: { log() {}, error() {} }, document: { getElementById: id=>elements[id] || (id === 'novvy-story' && story || id === 'novvy-intro-video' && intro ? {} : null) }, CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } } });
  Game.prototype.createTool = vm.runInContext('(function(){' + nativeCreateTool + '})', ctx);
  vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/events.js`, 'utf8'), ctx);
  const cta = installOriginCta(ctx);
  vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/engine.js`, 'utf8'), ctx);
  const telemetry = { report() { calls.push(['source-telemetry']); } };
  const modules = { GameScript: { default: Game }, DataScript: { default: data }, Tool: { default: { off(event, fn, target) { subscriptions.delete(target); } } }, EventString: { EventName: { updateOrder: 'order' } }, SoundManager: { SoundManager: sound }, MarkUtil: { MarkUtil: telemetry } };
  window.__ORIGIN_ADAPTER__.install(k=>modules[k]); window.__ORIGIN_ADAPTER__.install(k=>modules[k]);
  window.__ORIGIN_ADAPTER__.start(()=>calls.push(['launch']));
  game = new Game(); game.onLoad();
  return { cta, window, calls, elements, data, sound, audio, subscriptions, get game() { return game; }, telemetry,
    heldTier: () => game.tool.getComponent(ToolScript).fruitNumber,
    nextTiers: () => [game.nextToolSp, game.nextToolSp2].map(node => node.getComponent(cc.Sprite).spriteFrame),
    finishLoad(error) { const callback = loaded; loaded = null; callback(error, {}); },
    drop() { game.tool = {}; game.game1_End(); }, emit: (type, detail)=>window.dispatchEvent({ type, detail }) };
}
export default async function test(a){
 await testStory(a);
 const entry=getEntry('tasty-travels-origin');a.check(configWhitelistFor(entry.id).has('playableCta'),'settings persist');
 a.check(configWhitelistFor(entry.id).has('gameplay'),'replay settings persist');
 a.equal(entry.template.defaults.gameplay,{allowReplay:false,spawnTierOffset:0},'replay and tier boost default off');
 const base={root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config:entry.template.defaults};
 const titled=originHtml({...base,config:{...base.config,hud:{...base.config.hud,titleEnabled:true}}}).html;
 for (const preview of [false, true]) for (const intro of [false, true]) {
   const built=originHtml({...base,preview,config:{...base.config,intro:{enabled:intro}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}});
   const source=JSON.parse(built.files['game.js'].match(/const SOURCE=(.*);\nconst GAME_CONFIG=/)[1]);
   a.check(/class="loading-logo" src="data:image\/png;base64,/.test(source.markup) && source.css.includes('@keyframes tasty-loading-stripes'), 'original logo and animated loader survive preview/export with and without intro');
 }
 a.check(originHtml({...base,config:{...base.config,gameplay:undefined}}).html.includes('"gameplay":{"allowReplay":false,"spawnTierOffset":0}'),'old tasks default to replay and tier boost off');
 for (const preview of [false, true]) a.check(originHtml({...base,preview,config:{...base.config,gameplay:{spawnTierOffset:2}}}).html.includes('"gameplay":{"allowReplay":false,"spawnTierOffset":2}'),'saved boost reaches preview and export');
 for (const offset of [undefined, 0, 2, 4, 8]) {
   const boosted = runtime(false, true, offset), expected = nativeSequence.map(tier => Math.min(8, tier + (offset ?? 0)));
   a.equal(boosted.game.spToolAll, expected, `offset ${offset}: native sequence shifts once and caps below winning tier`);
   a.equal(boosted.heldTier(), expected[0], `offset ${offset}: first held item uses shifted tier`);
   const mismatches = [];
   for (let index = 0; index < nativeSequence.length + 1; index++) {
     if (index) boosted.game.createTool();
     if (boosted.heldTier() !== expected[index % expected.length] || boosted.nextTiers().some(frame => frame !== `tier-${expected[(index + 1) % expected.length]}`)) mismatches.push(index);
   }
   a.equal(mismatches, [], `offset ${offset}: native spawn and both NEXT previews match through a full cycle`);
   a.equal(boosted.calls.filter(c => c[0] === 'onStep' || c[0] === 'onComplete').length, 0, 'spawning boosted items does not count as a drop, merge or win');
   for (let round = 0; round < 2; round++) {
     boosted.game.EndStep(); boosted.window.__ORIGIN_ADAPTER__.replay(); boosted.finishLoad();
     a.equal([boosted.heldTier(), boosted.game.spToolAll, boosted.nextTiers()], [expected[0], expected, [`tier-${expected[1]}`, `tier-${expected[1]}`]], 'replay restarts the shifted sequence without compounding');
   }
 }
 a.check(!titled.includes('id="origin-sound"'),'game has no sound toggle');
 a.check(titled.includes('id="novvy-training-hud"')&&!titled.includes('data-novvy-origin-shell'),'HUD overlays the full canvas');
 const icon=fs.readFileSync(`${entry.templateDir}/${entry.template.game.ctaCard.icon}`);
 a.check(titled.includes('id="novvy-cta"')&&titled.includes(`data:image/webp;base64,${icon.toString('base64')}`),'shared CTA card embeds the original App Store icon bytes');
 a.check(titled.includes('<div class="novvy-cta-name">Tasty Travels</div>'),'CTA displays the shortened Tasty Travels name');
 a.equal(originHtml(base).stageChain,['playable'],'pure playable');a.equal(originHtml({...base,config:{...base.config,intro:{enabled:true}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}}).stageChain,['video','playable'],'combined playable');
 const cta=runtime();cta.game.downLoadApp({stopPropagation(){}});cta.game.game1_End();a.equal(cta.calls.filter(c=>c[0]==='onStep').length,0,'CTA release does not launch food');cta.game.game1_Start();cta.game.game1_End();a.equal(cta.calls.filter(c=>c[0]==='onStep').length,1,'next gameplay gesture works after CTA');
 const r=runtime();r.telemetry.report('CHALLENGE_SOLVED');r.game.game1_Start();a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'native touch telemetry is not success');
 r.drop();r.game.game1_End();a.equal(r.calls.filter(c=>c[0]==='onStep'),[['onStep',1,{progress:0}]],'one consumed item is one step, empty release ignored');
 r.game.createTool2(3);r.drop();a.check(Math.abs(r.calls.filter(c=>c[0]==='onStep').at(-1)[2].progress - 100/3) < 1e-9,'progress from actual merged tier');
 a.equal(r.calls.filter(c=>c[0]==='click').length,1,'step policy CTA');r.game.createTool2(1);r.drop();a.check(Math.abs(r.calls.filter(c=>c[0]==='onStep').at(-1)[2].progress - 100/3) < 1e-9,'lower merge keeps maximum tier');
 r.window.__ORIGIN_ADAPTER__.cta(true,'native-cta');a.equal(r.calls.at(-1)[1].click_source,'cta_click','download remains manual');a.equal(r.calls.filter(c=>c[0]==='onComplete').length,0,'download does not end game');
 r.game.createTool2(9);r.game.EndStep();a.equal(r.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'win',continue_playing:false}]],'tier nine native end is one win');r.game.game1_Start();a.equal(r.calls.filter(c=>c[0]==='native-start').length,1,'result background tap does not become CTA');
 const f=runtime();f.drop();f.game.EndStep();f.game.EndStep();f.drop();a.equal(f.calls.filter(c=>c[0]==='onComplete'),[['onComplete',{result:'fail',continue_playing:false}]],'native boundary end is one fail');a.equal(f.calls.filter(c=>c[0]==='onStep').length,1,'ended game cannot submit more drops');
 a.equal(f.window.__ORIGIN_ADAPTER__.replay(),false,'disabled replay cannot reset the game');
 a.check(f.elements['tasty-result'].hidden && r.elements['tasty-result'].hidden,'disabled setting hides replay after both results');
 const replay=runtime(true,true);replay.emit('novvy:intro-finished');
 for(const won of [true,false,true]) {
   replay.drop(); const previous=replay.game;
   replay.data.orderIdx=2;replay.data.all_Coin_Num=1100;replay.data.last_Coin_Num=500;replay.data.isCanDown=true;
   if(won)replay.game.createTool2(9);else replay.game.EndStep();
   replay.game.EndStep();
   a.equal(replay.calls.filter(c=>c[0]==='onComplete').at(-1),['onComplete',{result:won?'win':'fail',continue_playing:true}],'enabled result keeps stage replayable');
   a.equal(replay.elements['tasty-replay'].textContent,won?'Play again':'Try again','English replay result');
   a.equal(replay.elements['tasty-result'].hidden,false,'replay panel appears after result');
   const clicks=replay.calls.filter(c=>c[0]==='click').length;
   replay.cta.pointer('pointerdown','[data-novvy-replay]');replay.cta.pointer('pointerup','[data-novvy-replay]');replay.elements['tasty-replay'].click();replay.cta.flush();
   a.equal(replay.calls.filter(c=>c[0]==='click').length,clicks+1,'replay gesture converts exactly once');
   a.equal(replay.calls.filter(c=>c[0]==='click').at(-1)[1],{click_source:'forced_click_to_appstore',scene:'playable-replay'},'replay uses shared CTA-card conversion');
   a.equal(replay.window.__ORIGIN_ADAPTER__.replay(),false,'double replay blocked while scene loads');
   a.equal(replay.elements['tasty-replay'].disabled,true,'replay button waits for scene readiness');
   a.equal(replay.calls.at(-1),['loadScene','GameScene'],'conversion precedes loading the original scene');
   replay.finishLoad();
   a.check(replay.game!==previous && !replay.game.isEnd,'new native game instance is playable');
   a.equal([replay.data.ToolArray.length,replay.data.orderIdx,replay.data.all_Coin_Num,replay.data.last_Coin_Num,replay.data.isCanDown],[1,0,0,0,false],'board, orders and coins reset');
   a.equal(replay.subscriptions.size,1,'old order subscriptions are released');
   a.check(replay.elements['tasty-result'].hidden && !replay.elements['tasty-replay'].disabled,'ready scene dismisses replay panel');
 }
 a.equal(replay.calls.filter(c=>c[0]==='onReplay').length,3,'one replay event per ready scene');
 a.equal(replay.calls.filter(c=>c[0]==='onComplete').length,3,'one result per round');
 a.equal(replay.calls.filter(c=>c[0]==='audio').map(c=>c[1]),['bgm','bgm2'],'scene reloads reuse native music tracks');
 replay.sound.effectList.set('bgm',undefined);replay.sound.playEffect('bgm',true);
 a.equal(replay.calls.filter(c=>c[0]==='audio').length,2,'source channel adapter with no return ID also reuses loops');
 a.equal(replay.calls.filter(c=>c[0]==='setStage'),[['setStage',1,'video'],['setStage',2,'playable']],'replays do not repeat video or stage entry');
 replay.drop();replay.drop();
 a.equal(replay.calls.filter(c=>c[0]==='onStep').slice(-2),[['onStep',1,{progress:0}],['onStep',2,{progress:0}]],'new round resets drops and tier progress');
 a.equal(replay.calls.filter(c=>c[0]==='click').at(-1)[1].scene,'cta-moment','new round resets step CTA threshold');
 replay.game.EndStep();replay.elements['tasty-replay'].click();replay.finishLoad(new Error('load failed'));
 a.check(!replay.elements['tasty-replay'].disabled && !replay.elements['tasty-result'].hidden,'load failure permits another retry');
 a.equal(replay.calls.filter(c=>c[0]==='onReplay').length,3,'failed restart is not reported as replay');
 replay.elements['tasty-replay'].click();replay.finishLoad();
 a.equal(replay.calls.filter(c=>c[0]==='onReplay').length,4,'retry after load failure succeeds');
 const video=runtime(true);
 a.equal(video.calls.filter(c=>c[0]==='launch').length,1,'engine preloads during the video');
 const held=video.game.tool;
 video.game.game1_Start();video.game.game1_Move();video.drop();video.game.createTool2(9);video.game.EndStep();video.window.__ORIGIN_ADAPTER__.cta(true,'native-cta');
 a.equal(video.calls.filter(c=>['native-start','native-move','onStep','onComplete','click'].includes(c[0])).length,0,'intro and GO gate block input, results and CTA during preload');
 a.check(!video.game.isEnd && video.game.tool!==null,'preloading cannot consume an item or end the round');
 video.game.tool=held;
 video.emit('novvy:intro-finished');
 a.equal(video.calls.filter(c=>c[0]==='setStage'),[['setStage',1,'video'],['setStage',2,'playable']],'video transition');
 a.equal(video.calls.filter(c=>c[0]==='launch').length,1,'intro exit reuses the preloaded engine');
 video.game.game1_Start();video.game.game1_Move();video.drop();
 a.equal(video.calls.filter(c=>['native-start','native-move','onStep'].includes(c[0])).length,3,'input becomes playable after intro exit');
 const finished=runtime(true,false,0,true);finished.game.game1_Start();
 a.equal(finished.calls.filter(c=>c[0]==='native-start').length,1,'intro that finished before adapter loading does not leave input gated');
 for(const intro of [false,true]) {
   const story=runtime(intro,true,0,false,true);
   a.equal(story.calls.filter(c=>c[0]==='setStage'),intro?[['setStage',1,'video']]:[],'story does not enter the playable stage early');
   a.check(!story.window.__novvyCtaCardPhase,'CTA card stays hidden during story');
   if(intro)story.emit('novvy:intro-finished');
   story.game.game1_Start();story.drop();story.game.createTool2(9);
   story.cta.pointer('pointerdown','#novvy-story');story.cta.pointer('pointerup','#novvy-story');story.cta.flush();
   a.equal(story.calls.filter(c=>['onStep','onComplete','click','native-start'].includes(c[0])).length,0,'story gestures do not play or convert, including after video completion');
   story.window.__novvyStoryFinished=true;story.emit('novvy:story-finished');story.emit('novvy:story-finished');
   a.equal(story.calls.filter(c=>c[0]==='setStage').at(-1),['setStage',intro?2:1,'playable'],'story completion enters the correct playable stage');
   a.equal(story.window.__novvyCtaCardPhase,'bar','story completion reveals CTA card');
   story.game.game1_Start();story.drop();story.game.EndStep();story.window.__ORIGIN_ADAPTER__.replay();story.finishLoad();
   a.equal(story.calls.filter(c=>c[0]==='onStep').length,1,'game counts real drops after story');
   a.equal(story.calls.filter(c=>c[0]==='onReplay').length,1,'replay stays within playable without repeating story');
   a.equal(story.calls.filter(c=>c[0]==='setStage').length,intro?2:1,'story entry and replay do not duplicate stage events');
 }
 for(const preview of [false,true])for(const intro of [false,true]) {
   const html=originHtml({...base,preview,config:{...base.config,story:{enabled:true},intro:{enabled:intro,goEnabled:true}},media:{introVideo:'intro-video.mp4',introPoster:'poster.webp'}}).html;
   a.check(html.includes('id="novvy-story"')&&html.includes('Chapter 1: Monster in Flames I'),'story survives preview and export with or without video');
   a.check(html.includes('data:image/jpeg;base64,'),'story artwork is embedded offline');
   a.check(html.includes('data-novvy-story-audio') && html.indexOf('data-novvy-story-audio') < html.indexOf('<script data-novvy-story>'),'preview and export load offline story audio before dialogue');
   a.check(!intro||html.includes('"goEnabled":false'),'story replaces the redundant video GO gate');
 }
 a.check(!originHtml(base).html.includes('id="novvy-story"'),'story defaults off and excludes its markup and art');
 a.check(!originHtml(base).html.includes('data-novvy-story-audio'),'disabled story does not include or start story audio');
}
