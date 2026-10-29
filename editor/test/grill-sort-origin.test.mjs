import { installOriginCta } from './lib/origin-cta-runtime.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { getEntry } from '../core/registry.mjs';
import { originHtml } from '../core/lib/origin-playable.mjs';
import { configWhitelistFor } from '../lib/store.mjs';

export function runtime(intro = false, nativeRelease = null, gameplay = { allowReplay: false, countdownSeconds: 180 }) {
  const entry = getEntry('grill-sort-origin'), listeners = new Map(), calls = [];
  const window = { __novvyStageChain__: intro ? ['video', 'playable'] : ['playable'], __ORIGIN_CONFIG__: { intro, gameplay, policy: { mode: 'steps', afterSteps: 2, intervals: [1] } },
    addEventListener(k, f) { if (!listeners.has(k)) listeners.set(k, []); listeners.get(k).push(f); },
    dispatchEvent(e) { for (const f of listeners.get(e.type) || []) f(e); },
    NovvyPlayable: Object.fromEntries(['setStageList', 'setStage', 'onStep', 'onComplete', 'onReplay', 'endStage', 'click'].map(k => [k, (...args) => calls.push([k, ...args])])),
    NovvyAnalytics: { registerMedia() { calls.push(['media']); } } };
  const elements = Object.fromEntries(['grill-result', 'grill-result-title', 'grill-result-copy', 'grill-replay'].map(id => [id, { hidden: true, addEventListener() {} }]));
  const document = { getElementById: id => elements[id] || (intro && id === 'novvy-intro-video' ? {} : null) };
  const ctx = vm.createContext({ window, document, console: { log() {}, error() {} }, CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } } });
  vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/events.js`, 'utf8'), ctx);
  const cta = installOriginCta(ctx);
  vm.runInContext(fs.readFileSync(`${entry.dir}/overlays/engine/engine.js`, 'utf8'), ctx);
  let afterDraw, loadCount = 0;
  const native = { Director: { EVENT_AFTER_DRAW: 'draw' }, Tween: { stopAllByTarget() {} }, director: {
    once(_, fn) { afterDraw = fn; }, targetOff() {}, getScene: () => ({ children: [] }),
    loadScene() { loadCount++; calls.push(['loadScene']); return true; },
  } };
  const exports = {};
  const system = { register(id, deps, declare) { const declaration = declare((k, v) => (exports[k] = v), {}); declaration?.setters?.forEach(fn => fn(native)); } };
  window.__ORIGIN_ADAPTER__.install(system);
  class Game {
    constructor() { this._doneNum = 0; }
    initGame() {} initGuide() {} onTouchStart() { calls.push(['touch']); } onTouchMove() {} onTouchEnd() {} unscheduleAllCallbacks() {}
    releaseDone(...args) { if (nativeRelease) return nativeRelease.apply(this, args); this._doneNum += 3; if (this._doneNum >= 120) this.checkSuccess(); }
    checkSuccess() {} checkFail() { this.isFail = true; }
  }
  class Box { constructor() { this._index = 0; } addItem() {} }
  class AudioManager { getAudio() {} _playAudioByRes(...args) { return args; } }
  class Clock { onLoad() {} stop() {} schedule(fn, interval, repeats, delay) { this.tick = fn; this.timing = [interval, repeats, delay]; } setTimeStr(value) { this.value = value; } }
  class ResMgr { loadAll() { calls.push(['resources']); return Promise.resolve(); } }
  for (const [name, value] of Object.entries({ Game, Box, AudioManager, Clock, ResMgr })) {
    system.register(`chunks:///_virtual/${name === 'ResMgr' ? 'ResMgr2' : name}.ts`, ['cc'], publish => { publish(name, value); return { setters: [() => {}] }; });
  }
  system.register('chunks:///_virtual/Clock.ts', [], publish => { publish('TIME', 180); });
  const clock = new Clock(); clock.onLoad();
  let game;
  function freshRound() { game = new Game(); game.initGame(); game.initGuide(); afterDraw(); }
  freshRound();
  const box = new Box();
  return { cta, get game() { return game; }, clock, box, calls, window, AudioManager, ResMgr, elements, exports,
    adaptAudio(Type) { system.register('chunks:///_virtual/AudioManager.ts', ['cc'], publish => { publish('AudioManager', Type); return { setters: [() => {}] }; }); },
    get loadCount() { return loadCount; }, finishReplay: freshRound,
    emit: (type, detail) => window.dispatchEvent({ type, detail }),
    move: () => box.addItem({ _type: 1, _boxIndex: 1, _index: 0 }, 0, false) };
}

function nativeAudioManager(entry) {
  // Exercise the original duplicate-loop guard and source pool, not a copy.
  const assets = JSON.parse(fs.readFileSync(`${entry.templateDir}/game/assets.js`, 'utf8').replace(/^window\.playableres=/, '').trim().replace(/;$/, ''));
  const core = assets['assets/main/index.js'];
  const start = core.indexOf('System.register("chunks:///_virtual/AudioManager.ts"');
  const source = core.slice(start, core.indexOf('System.register(', start + 1));
  const sources = [], logs = [];
  class AudioSource {
    playing = false; plays = 0; shots = 0;
    play() { this.playing = true; this.plays++; }
    stop() { this.playing = false; }
    playOneShot() { this.shots++; }
  }
  function Component() { this.node = { addComponent() { const source = new AudioSource(); sources.push(source); return source; } }; }
  Component.prototype.scheduleOnce = function () {};
  const helpers = {
    inheritsLoose(Type, Base) { Type.prototype = Object.create(Base.prototype); Type.prototype.constructor = Type; Object.setPrototypeOf(Type, Base); },
    createClass(Type, properties) { for (const descriptor of properties) Object.defineProperty(Type.prototype, descriptor.key, descriptor); },
  };
  const cc = { Component, AudioSource, cclegacy: { _RF: { push() {}, pop() {} } }, _decorator: { ccclass: () => Type => Type } };
  let Type;
  vm.runInNewContext(source, { console: { log: (...args) => logs.push(args) }, System: {
    register(id, deps, declare) {
      const declaration = declare((name, value) => { if (name === 'AudioManager') Type = value; return value; });
      declaration.setters[0](helpers); declaration.setters[1](cc); declaration.execute();
    },
  } });
  return { Type, sources, logs };
}
export default async function test(a) {
  const entry = getEntry('grill-sort-origin');
  a.check(configWhitelistFor(entry.id).has('gameplay'), 'gameplay settings persist');
  const base = { root: entry.templateDir, pluginDir: entry.dir, template: entry.template, config: entry.template.defaults };
  a.equal(originHtml(base).stageChain, ['playable'], 'pure chain');
  a.equal(originHtml({ ...base, config: { ...base.config, intro: { enabled: true } }, media: { introVideo: 'intro-video.mp4', introPoster: 'poster.webp' } }).stageChain, ['video', 'playable'], 'combined chain');
  const custom = originHtml({ ...base, config: { ...base.config, gameplay: { countdownSeconds: 45, allowReplay: false } } }).html;
  a.check(custom.includes('"countdownSeconds":45,"allowReplay":false'), 'preview and package embed saved gameplay settings');
  const r = runtime();
  r.box.addItem({ _type: 1, _boxIndex: 0, _index: 0 }, 0, false); r.box.addItem({ _type: 1, _boxIndex: 1, _index: 0 }, 0, true);
  a.equal(r.calls.filter(c => c[0] === 'onStep').length, 0, 'same slot and automatic refill ignored');
  r.move(); r.game._doneNum = 3; r.move();
  a.equal(r.calls.filter(c => c[0] === 'onStep'), [['onStep', 1, { progress: 0 }], ['onStep', 2, { progress: 2.5 }]], 'valid placements and actual packed progress');
  a.equal(r.calls.filter(c => c[0] === 'click').length, 1, 'step CTA'); r.move(); a.equal(r.calls.filter(c => c[0] === 'click').length, 2, 'CTA repeats');
  r.window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); a.equal(r.calls.at(-1)[1].click_source, 'cta_click', 'native CTA manual');
  a.equal(r.calls.filter(c => c[0] === 'onComplete').length, 0, 'CTA does not settle');
  r.game.checkSuccess(); a.equal(r.calls.filter(c => c[0] === 'onComplete').length, 0, 'premature success rejected');
  r.game._doneNum = 120; r.game.checkSuccess(); r.game.checkSuccess();
  a.equal(r.calls.filter(c => c[0] === 'onComplete'), [['onComplete', { result: 'win', continue_playing: false }]], 'non-replay win settles once');
  a.check(r.elements['grill-replay'].hidden, 'disabled replay hides the button');
  a.equal(r.window.__ORIGIN_ADAPTER__.replay(), false, 'disabled replay cannot reset');
  const failed = runtime(); failed.game.checkFail(); failed.game.checkFail(); failed.move();
  a.equal(failed.calls.filter(c => c[0] === 'onComplete'), [['onComplete', { result: 'fail', continue_playing: false }]], 'non-replay timeout settles once');
  a.equal(failed.calls.filter(c => c[0] === 'click').length, 1, 'non-replay timeout converts once');
  a.equal(failed.calls.filter(c => c[0] === 'onStep').length, 0, 'settled game ignores steps');
  const video = runtime(true); video.game.onTouchStart(); video.move(); video.clock.countDown();
  a.check(!video.clock.tick && !video.calls.some(c => c[0] === 'touch' || c[0] === 'onStep'), 'preloaded game rejects input, timer and telemetry during intro');
  video.emit('novvy:intro-finished'); video.game.onTouchStart();
  a.equal(video.calls.filter(c => c[0] === 'setStage'), [['setStage', 1, 'video'], ['setStage', 2, 'playable']], 'video changes SDK stage once');
  a.equal(video.calls.filter(c => c[0] === 'touch').length, 1, 'game opens input after intro');
  r.window.__ORIGIN_MUTED__ = true; a.equal(new r.AudioManager()._playAudioByRes('clip', 'name', true, 1)[3], 0, 'new audio respects mute');
  const audio = nativeAudioManager(entry); r.adaptAudio(audio.Type);
  const manager = new audio.Type(), clip = { getDuration: () => 1 };
  manager._playAudioByRes(clip, 'audio/bgm', true, 1);
  const bgm = manager.getAudio('audio/bgm');
  a.equal(bgm.volume, 0, 'native BGM preloads silently');
  r.window.__ORIGIN_MUTED__ = false;
  for (let replay = 0; replay < 3; replay++) manager._playAudioByRes(clip, 'audio/bgm', true, 1);
  a.check(audio.sources.length === 1 && bgm.plays === 1 && bgm.volume === 1, 'repeated scene starts reuse the playing BGM without restarting it');
  a.equal(audio.logs, [], 'replay no longer reaches the native duplicate-loop warning');
  bgm.playing = false; r.window.__ORIGIN_MUTED__ = true;
  manager._playAudioByRes(clip, 'audio/bgm', true, 1);
  a.check(bgm.plays === 1 && bgm.volume === 0, 'hidden or preloading replay keeps paused BGM muted');
  r.window.__ORIGIN_MUTED__ = false;
  manager._playAudioByRes(clip, 'audio/bgm', true, 1);
  a.check(bgm.plays === 2 && bgm.volume === 1, 'visible replay resumes a paused BGM on the same source');
  manager._playAudioByRes(clip, 'audio/put', false, 1); manager._playAudioByRes(clip, 'audio/put', false, 1);
  a.equal(audio.sources.reduce((sum, source) => sum + source.shots, 0), 2, 'repeated one-shot effects remain audible');
  manager.stopAudio('audio/bgm'); manager._playAudioByRes(clip, 'audio/bgm', true, 1);
  a.check(manager.getAudio('audio/bgm').playing && manager._audioResMap.size === 1, 'explicitly stopped BGM can start again');
  for (const won of [false, true]) {
    const repeat = runtime(false, null, { allowReplay: true, countdownSeconds: 45 });
    a.equal(repeat.exports.TIME, 45, 'native Clock export and Game timeout share configured duration');
    repeat.clock.countDown(); a.equal(repeat.clock.timing, [1, 44, 1], 'countdown decrements after one full second');
    repeat.clock.tick(); a.equal(repeat.clock.value, 44, 'clock displays remaining seconds');
    if (won) { repeat.game._doneNum = 120; repeat.game.checkSuccess(); } else repeat.game.checkFail();
    a.equal(repeat.calls.filter(c => c[0] === 'onComplete'), [['onComplete', { result: won ? 'win' : 'fail', continue_playing: true }]], 'replayable result keeps the current SDK stage');
    a.equal(repeat.elements['grill-replay'].textContent, won ? 'Play again' : 'Try again', 'result offers the appropriate replay action');
    a.equal(repeat.calls.filter(c => c[0] === 'click').length, won ? 1 : 0, 'retryable timeout waits for explicit replay CTA');
    repeat.cta.pointer('pointerdown', '[data-novvy-replay]'); repeat.cta.pointer('pointerup', '[data-novvy-replay]');
    a.equal(repeat.window.__ORIGIN_ADAPTER__.replay(), true, 'replay accepted once');
    a.equal(repeat.window.__ORIGIN_ADAPTER__.replay(), false, 'repeated click while loading ignored');
    repeat.cta.flush();
    a.equal(repeat.calls.filter(c => c[0] === 'click').at(-1)[1], { click_source: 'forced_click_to_appstore', scene: 'playable-replay' }, 'replay uses Escape Arrow CTA route');
    a.check(repeat.calls.findIndex(c => c[0] === 'click' && c[1].scene === 'playable-replay') < repeat.calls.findIndex(c => c[0] === 'loadScene'), 'CTA precedes reset');
    repeat.finishReplay();
    a.equal(repeat.calls.filter(c => c[0] === 'onReplay').length, 1, 'ready replacement scene reports one replay');
    a.equal(repeat.game._doneNum, 0, 'new round starts with no completed items');
    repeat.cta.pointer('pointerdown'); repeat.cta.pointer('pointerup'); repeat.cta.flush();
    a.equal(repeat.calls.filter(c => c[0] === 'click').length, won ? 2 : 1, 'post-replay gameplay does not double-convert');
    repeat.move(); repeat.move();
    a.equal(repeat.calls.filter(c => c[0] === 'onStep').map(c => c[1]), [1, 2], 'replay resets per-round step count');
    a.equal(repeat.calls.filter(c => c[0] === 'click').at(-1)[1].scene, 'cta-moment', 'new round restores the first-step CTA threshold');
    a.equal(repeat.calls.filter(c => c[0] === 'setStage').length, 1, 'replay does not repeat the video or SDK stage');
  }
  const bootListeners = {}, bootCalls = [], source = { volume: 1 }, loading = { hidden: false };
  const bootDocument = { hidden: false, getElementById: () => loading, addEventListener: (name, fn) => { bootListeners[name] = fn; } };
  const cc = { game: { pause: () => bootCalls.push('pause'), resume: () => bootCalls.push('resume') }, director: { getScene: () => ({ getComponentsInChildren: () => [source] }) } };
  const bootWindow = { cc, __ORIGIN_CONFIG__: { intro: true }, addEventListener: (name, fn) => { bootListeners[name] = fn; },
    __GRILL_LAYOUT__: { install: () => bootCalls.push('layout') }, __ORIGIN_ADAPTER__: { install: () => bootCalls.push('adapter') } };
  bootWindow.__ORIGIN_LOAD__ = () => { bootCalls.push('load'); bootWindow.playable.ccInitBegan = () => bootCalls.push('engine'); };
  vm.runInNewContext(fs.readFileSync(`${entry.templateDir}/game/boot.js`, 'utf8'), { window: bootWindow, get playable() { return bootWindow.playable; }, cc, document: bootDocument, navigator: { userAgent: '' }, System: {} });
  a.equal(bootCalls, ['load', 'layout', 'adapter', 'engine'], 'engine and resources load immediately during intro');
  a.equal(source.volume, 0, 'preloading never plays game audio over the intro');
  a.equal(bootWindow.playable.prData, { iosMark: '', googleMark: '' }, 'native watermark interval is disabled before scene creation');
  bootListeners['novvy:grill-ready']();
  a.check(loading.hidden && bootCalls.at(-1) === 'pause', 'only pause after the warm scene has drawn a frame');
  bootListeners['novvy:intro-finished']();
  a.check(source.volume === 1 && bootCalls.at(-1) === 'resume', 'intro handoff resumes the existing canvas without another load');
  bootDocument.hidden = true; bootListeners.visibilitychange();
  a.check(source.volume === 0 && bootCalls.at(-1) === 'pause', 'background ad pauses game, countdown and sound');
  bootDocument.hidden = false; bootListeners.visibilitychange();
  a.check(source.volume === 1 && bootCalls.at(-1) === 'resume', 'return resumes the same round');
  const resources = new r.ResMgr();
  const first = resources.loadAll(), second = resources.loadAll(); await first;
  a.check(first === second && r.calls.filter(c => c[0] === 'resources').length === 1, 'replay reuses loaded native resources without resetting live maps');
}
