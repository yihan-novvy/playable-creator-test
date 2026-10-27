import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { getEntry } from '../core/registry.mjs';
import { blockOutHtml, ctaPolicy } from '../plugins/block-out-origin/lib.mjs';
import { run, prerequisites } from '../plugins/block-out-origin/steps/pack.mjs';
import { configWhitelistFor } from '../lib/store.mjs';

function runtime(entry, intro = false) {
  const listeners = new Map(), calls = [];
  const element = () => ({ hidden: false, muted: true, addEventListener() {}, setAttribute() {} });
  const elements = { 'novvy-cta': element(), 'block-out-sound': element(), ...(intro ? { 'novvy-intro-video': element() } : {}) };
  const window = {
    __novvyStageChain__: intro ? ['video', 'playable'] : ['playable'],
    __BLOCK_OUT_CONFIG__: { intro, totalBlocks: 39, policy: { mode: 'steps', afterSteps: 2, intervals: [2, 1] } },
    editorParameters: {},
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
    dispatchEvent(e) { for (const fn of listeners.get(e.type) || []) fn(e); },
    NovvyPlayable: Object.fromEntries(['setStageList','setStage','onStep','onComplete','endStage','click'].map(name => [name, (...args) => calls.push([name, ...args])])),
    NovvyAnalytics: { registerMedia: (_, meta) => calls.push(['media', meta]) },
  };
  const document = { hidden: false, getElementById: id => elements[id] || null, addEventListener: window.addEventListener };
  const context = vm.createContext({ window, document, console: { log() {} }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } } });
  for (const file of ['events.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(entry.dir, 'overlays/engine', file), 'utf8'), context);
  class Manager {
    constructor() { this.blocks = []; }
    setSelectedBlock(block) { this.selectedBlock = block; }
    onBlockPassedExit(block) { this.blocks = this.blocks.filter(b => b !== block); }
    showEndcard() {}
    startEndcardScene() {}
  }
  class Drag { async pointerUpHandler() { this.action?.(); } }
  class App { pauseGame() {} resumeGame() {} }
  App.instance = new App();
  class Boot { async start() { calls.push(['boot']); } }
  const engine = { Manager, Drag, App, Boot, Sound: { muteAll() {}, unmuteAll() {} } };
  window.__BLOCK_OUT_ADAPTER__.install(engine);
  const manager = new Manager(), drag = new Drag();
  function block() { const b = { cellsData: [{ x: 0, y: 0 }], state: 'idle' }; manager.blocks.push(b); return b; }
  function select(b, id) { manager.setSelectedBlock(b, id); drag.selectedBlock = b; }
  function emit(type, detail) { window.dispatchEvent(type === 'pagehide' ? { type, ...detail } : { type, detail }); }
  return { window, calls, manager, drag, block, select, emit, Boot };
}

export default async function test(assert) {
  const entry = getEntry('block-out-origin');
  assert.check(configWhitelistFor(entry.id).has('playableCta'), 'CTA settings persist through task PATCH');
  const base = { root: entry.templateDir, overlaysRoot: entry.dir, template: entry.template, config: entry.template.defaults };
  const plain = blockOutHtml(base);
  const withIntro = blockOutHtml({ ...base, config: { ...base.config, intro: { enabled: true } }, media: { introVideo: 'intro-video.mp4', introPoster: 'poster.webp' } });
  assert.equal(plain.stageChain, ['playable'], 'two native levels share one playable stage');
  assert.equal(withIntro.stageChain, ['video', 'playable'], 'optional video precedes playable');
  assert.check(withIntro.html.indexOf('data-novvy-playable-bridge') < withIntro.html.indexOf('<script data-novvy-intro>'), 'media registration precedes intro playback');
  assert.check(plain.html.includes('src="core.js"') && !plain.html.includes('mraid.js'), 'pack uses local runtime');
  assert.check(!blockOutHtml({ ...base, preview: true }).html.includes('src="core.js"'), 'preview inlines same runtime');
  assert.equal(ctaPolicy({ mode: 'steps', afterSteps: 20, intervals: [10, -1, 1.2, 8] }).intervals, [10, 8], 'invalid CTA intervals rejected');
  assert.equal(prerequisites(base.config), { uploads: [], generated: [] }, 'pure playable needs no video');
  assert.equal(prerequisites({ intro: { enabled: true } }).generated, ['intro-video.mp4', 'poster.webp'], 'video pack requires generated media');

  const r = runtime(entry), b = r.block();
  r.select(b, 1); await r.drag.pointerUpHandler();
  assert.equal(r.calls.filter(c => c[0] === 'onStep').length, 0, 'tap without movement does not count');
  r.select(b, 2); r.drag.action = () => { b.cellsData[0].x = 1; }; await r.drag.pointerUpHandler();
  assert.equal(r.calls.filter(c => c[0] === 'onStep'), [['onStep', 1, { progress: 0 }]], 'valid reposition counts with unchanged true progress');
  r.select(b, 3); r.drag.action = () => { r.manager.onBlockPassedExit(b); b.state = 'passed'; }; await r.drag.pointerUpHandler();
  const stepCalls = r.calls.filter(c => c[0] === 'onStep');
  assert.equal(stepCalls.length, 2, 'exit during pointer-up counted once');
  assert.check(Math.abs(stepCalls[1][2].progress - 100 / 39) < 1e-10, 'exit progress uses all 39 blocks');
  r.manager.onBlockPassedExit(b);
  assert.equal(r.calls.filter(c => c[0] === 'onStep').length, 2, 'duplicate exit ignored');
  assert.equal(r.calls.filter(c => c[0] === 'click').length, 1, 'first CTA on configured meaningful step');
  for (let id = 4; id <= 7; id++) {
    const next = r.block(); r.select(next, id); r.drag.action = () => { next.cellsData[0].x++; }; await r.drag.pointerUpHandler();
  }
  assert.equal(r.calls.filter(c => c[0] === 'click').length, 4, 'CTA intervals advance then repeat last gap');
  r.window.__BLOCK_OUT_ADAPTER__.openStore({ automatic: true });
  assert.equal(r.calls.filter(c => c[0] === 'click').length, 4, 'native automatic CTA suppressed');
  r.window.__BLOCK_OUT_ADAPTER__.openStore({});
  assert.equal(r.calls.at(-1)[1].click_source, 'cta_click', 'native manual CTA uses unified click source');
  assert.equal(r.calls.filter(c => c[0] === 'onComplete').length, 0, 'moves and store visit do not complete stage');
  r.manager.showEndcard(); r.manager.startEndcardScene(true); r.emit('pagehide', {});
  assert.equal(r.calls.filter(c => c[0] === 'onComplete'), [['onComplete', { result: 'win' }]], 'final success settles once before native endcard');
  assert.equal(r.calls.filter(c => c[0] === 'endStage').length, 0, 'page departure cannot resettle final result');
  const fail = runtime(entry); fail.manager.startEndcardScene(false);
  assert.equal(fail.calls.filter(c => c[0] === 'onComplete'), [['onComplete', { result: 'fail' }]], 'native failure uses explicit fail result');
  const pending = runtime(entry, true);
  const started = new pending.Boot().start();
  await Promise.resolve();
  assert.equal(pending.calls.filter(c => c[0] === 'boot').length, 0, 'game start waits for video');
  pending.emit('novvy:intro-finished'); await started; pending.emit('novvy:intro-finished');
  assert.equal(pending.calls.filter(c => c[0] === 'setStage').map(c => c.slice(1)), [[1, 'video'], [2, 'playable']], 'video to playable transition occurs once');
  assert.equal(pending.calls.filter(c => c[0] === 'media').length, 1, 'video registered exactly once');
  pending.emit('novvy:viewablechange', { viewable: false });
  assert.equal(pending.calls.filter(c => c[0] === 'endStage').length, 0, 'backgrounding is not an end');
  pending.emit('pagehide', { persisted: true });
  assert.equal(pending.calls.filter(c => c[0] === 'endStage').length, 0, 'bfcache navigation is resumable');
  pending.emit('pagehide', { persisted: false });
  assert.equal(pending.calls.filter(c => c[0] === 'endStage').length, 1, 'unfinished departure closes stage');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'block-out-pack-'));
  try {
    const ctx = { templateRoot: base.root, pluginDir: entry.dir, template: base.template, config: base.config, resultDir: path.join(dir, 'result') };
    await run(ctx);
    const first = fs.readFileSync(path.join(ctx.resultDir, 'index.html'), 'utf8');
    await run(ctx);
    assert.equal(fs.readFileSync(path.join(ctx.resultDir, 'index.html'), 'utf8'), first, 'repack is idempotent');
    assert.equal(fs.readdirSync(ctx.resultDir).sort(), ['assets.js','core.js','index.html'], 'pure playable package is self-contained');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
