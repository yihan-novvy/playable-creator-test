import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const introSource = fs.readFileSync(new URL('../../../editor/core/overlays/intro/intro.js', import.meta.url), 'utf8');
const cardSource = fs.readFileSync(new URL('../../../editor/core/overlays/cta-card/cta-card.js', import.meta.url), 'utf8');
const bridgeSource = fs.readFileSync(new URL('../../../editor/core/overlays/cta-bridge/cta-bridge.js', import.meta.url), 'utf8').replaceAll('__CTA_URL_KEY__', '__DRAGON_CUBE_CTA_URL__');
const readLevel = id => JSON.parse(fs.readFileSync(new URL(`../src/levels/${id}.json`, import.meta.url)));
const flush = () => new Promise(resolve => setImmediate(resolve));

function game({ first = readLevel(4), second = readLevel(10), intro = false, extraImages = {} } = {}) {
  const images = [], canvases = [], frames = [], timers = new Map(), nodes = new Map();
  let timerId = 0, clock = 0;
  class Node extends EventTarget {
    constructor(id) {
      super(); this.id = id; this.style = {}; this.hidden = false;
      this.classList = new Set(); this.classList.add = Set.prototype.add;
      this.classList.contains = Set.prototype.has;
      this.paused = true; this.volume = 1; this.currentTime = 0;
    }
    getBoundingClientRect() { return { left: 0, top: 0, width: 390, height: 640 }; }
    setPointerCapture() {}
    setAttribute() {}
    removeAttribute() {}
    remove() { nodes.delete(this.id); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  class Canvas extends Node {
    constructor(id) {
      super(id); this.width = 300; this.height = 150; this.calls = [];
      this.context = new Proxy({}, { get: (target, key) => {
        if (!(key in target)) target[key] = (...args) => this.calls.push({ method: key, args });
        return target[key];
      } });
      canvases.push(this);
    }
    getContext() { return this.context; }
  }
  class Image extends EventTarget {
    constructor() {
      super(); this.complete = false; this.naturalWidth = 0;
      this.decoded = new Promise(resolve => { this.finishDecode = resolve; });
      images.push(this);
    }
    decode() { return this.decoded; }
    load() { this.complete = true; this.naturalWidth = 128; this.dispatchEvent(new Event('load')); }
    fail() { this.complete = true; this.dispatchEvent(new Event('error')); }
  }
  const document = new EventTarget();
  document.baseURI = 'https://example.test/index.html';
  document.currentScript = { src: 'https://example.test/game.js' };
  document.hidden = false;
  document.readyState = 'complete';
  document.getElementById = id => nodes.get(id) || null;
  document.createElement = tag => tag === 'canvas' ? new Canvas() : new Node();
  for (const id of ['board-wrap', 'hint', 'win', 'replay', 'hud-title-line1', 'hud-title-line2', 'result-title', 'result-copy', 'reset', 'result-reset', 'replay-text', 'replay-btn']) nodes.set(id, new Node(id));
  nodes.set('board', new Canvas('board'));
  if (intro) for (const id of ['novvy-video-intro', 'novvy-intro-video', 'novvy-intro-sound', 'novvy-intro-countdown']) nodes.set(id, new Node(id));
  const setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; };
  const clearTimeout = id => timers.delete(id);
  const window = Object.assign(new EventTarget(), {
    __DRAGON_CUBE_LEVEL__: first,
    __DRAGON_CUBE_PHASE2__: second && { level: second, hud: {}, cta: { mode: 'steps', afterSteps: 8 } },
    __DRAGON_CUBE_IMAGES__: extraImages,
    devicePixelRatio: 2, setTimeout, clearTimeout,
  });
  const context = vm.createContext({ window, document, Image, Audio: Node, URL, CustomEvent, Event, performance, Date: { now: () => clock },
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {}, navigator: {},
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  });
  function boot() { vm.runInContext(source.replace('__DEFAULT_LEVEL_JSON__', JSON.stringify(first)), context); }
  if (!intro) boot();
  return {
    window, document, images, canvases, nodes, timers, boot,
    intro: () => vm.runInContext(introSource, context),
    cta: ({ endMask = false } = {}) => {
      nodes.set('novvy-cta', new Node('novvy-cta'));
      nodes.set('novvy-cta-btn', new Node('novvy-cta-btn'));
      nodes.get('novvy-cta').hidden = true;
      window.__NOVVY_CTA_END_MASK__ = endMask;
      window.__novvyTwoPhase = !!second;
      window.__novvyOutroEnabled = !!second;
      vm.runInContext(cardSource, context);
      vm.runInContext(bridgeSource, context);
    },
    tick: (ms = 400) => { clock += ms; },
    emit: (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail })),
    frame: () => { const callbacks = frames.splice(0); for (const callback of callbacks) callback(); },
    finish: list => { for (const image of list) { image.load(); image.finishDecode(); } },
    runTimers: ms => { for (const [id, timer] of [...timers]) if (timer.ms === ms) { timers.delete(id); timer.fn(); } },
  };
}

test('首帧等待所选关卡图片解码，第二关图片提前请求且只在就绪后交出画面', async () => {
  const g = game();
  const firstImages = [...g.images];
  assert.equal(firstImages.filter(i => i.src.includes('Cat_')).length, 4, '只加载第一关实际用到的四种小猫');
  for (const image of firstImages) image.load();
  await flush();
  assert.notEqual(g.window.__DRAGON_CUBE_READY__, true, '下载完成但尚未解码时不能就绪');
  for (const image of firstImages) image.finishDecode();
  await g.window.DragonCube.ready;
  assert.equal(g.window.__DRAGON_CUBE_READY__, true);
  assert.ok(g.canvases[0].calls.some(c => c.method === 'drawImage'), '就绪时已画出棋盘');
  const secondImages = g.images.filter(i => !firstImages.includes(i));
  assert.equal(secondImages.filter(i => i.src.includes('/boxes/')).length, 8);
  let started = 0;
  g.window.addEventListener('novvy:phase2-start', () => {
    started++;
    assert.ok(g.images.every(i => i.dragonDecoded));
    assert.equal(g.window.DragonCube.getState().levelId, 10);
  });
  g.emit('novvy:outro-finished', { reason: 'video_ended' });
  await flush();
  assert.equal(started, 0);
  assert.equal(g.window.DragonCube.getState().levelId, 4);
  g.finish(secondImages);
  await flush();
  assert.equal(started, 1);
  const imageCount = g.images.length;
  g.emit('novvy:outro-finished', { reason: 'video_ended' });
  g.frame();
  assert.equal(started, 1);
  assert.equal(g.images.length, imageCount, '换关及绘制不再创建新图片请求');
});

test('图片失败及超时仍完成准备，迟到的失败图片不会逐步替换兜底画面', async () => {
  const g = game({ second: null });
  const [failed, stalled, ...loaded] = g.images;
  failed.fail();
  g.finish(loaded);
  g.runTimers(8000);
  await g.window.DragonCube.ready;
  assert.equal(g.window.__DRAGON_CUBE_READY__, true);
  assert.equal(failed.dragonDecoded, false);
  assert.equal(stalled.dragonDecoded, false);
  stalled.load(); stalled.finishDecode();
  await flush();
  assert.equal(stalled.dragonDecoded, false);
});

test('静态地板跨帧复用，视频和后台期间停止绘制，尺寸改变后重建缓存', async () => {
  const g = game({ second: null });
  g.finish(g.images);
  await g.window.DragonCube.ready;
  const [board, floor] = g.canvases;
  const count = canvas => canvas.calls.filter(c => c.method === 'clearRect').length;
  const cached = count(floor);
  g.frame(); g.frame();
  assert.equal(count(floor), cached);
  const drawn = count(board);
  g.emit('novvy:outro-started'); g.frame();
  assert.equal(count(board), drawn);
  g.emit('novvy:outro-finished', { reason: 'video_error' }); g.frame();
  assert.equal(count(board), drawn + 1);
  g.document.hidden = true; g.frame();
  assert.equal(count(board), drawn + 1);
  g.document.hidden = false;
  g.emit('resize'); g.frame();
  assert.equal(count(floor), cached + 1);
});

test('一次拖动跨过多个格子仍正常收集，每帧只重画一次棋盘', async () => {
  const first = {
    Index: 1, TimeLimit: 60,
    Cells: Array.from({ length: 5 }, (_, x) => ({ Index: { x, y: 0 }, ...([1, 2, 4].includes(x) ? { Cat: { Color: 0 } } : {}) })),
    Boxes: [{ Index: 0, Color: 0, Count: 3, Cells: [{ x: 0, y: 0 }] }],
  };
  const g = game({ first, second: null });
  g.finish(g.images);
  await g.window.DragonCube.ready;
  const [board, floor] = g.canvases;
  const count = canvas => canvas.calls.filter(c => c.method === 'clearRect').length;
  const drawn = count(board), cached = count(floor);
  const pointer = (type, clientX) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { clientX, clientY: 320, pointerId: 1 });
    board.dispatchEvent(event);
  };
  pointer('pointerdown', 67);
  pointer('pointermove', 195);
  pointer('pointerup', 195);
  assert.equal(g.window.DragonCube.getState().collected, 2);
  assert.equal(count(board), drawn, '拖动事件只更新状态，不重复整板绘制');
  g.frame();
  assert.equal(count(board), drawn + 1);
  assert.equal(count(floor), cached);
});

test('HUD 与两关自定义背景也等待解码，资源 URL 相对页面解析', async () => {
  const g = game({ extraImages: { first: ['custom-bg.webp', '/uploads/left.png'], second: ['second-bg.webp'] } });
  const custom = g.images.filter(i => !i.src.includes('/assets/'));
  assert.deepEqual(custom.map(i => i.src), ['https://example.test/custom-bg.webp', 'https://example.test/uploads/left.png']);
  g.finish(g.images.filter(i => !custom.includes(i)));
  await flush();
  assert.notEqual(g.window.__DRAGON_CUBE_READY__, true);
  g.finish(custom);
  await g.window.DragonCube.ready;
  const secondBackground = g.images.find(i => i.src === 'https://example.test/second-bg.webp');
  assert.ok(secondBackground);
  g.finish(g.images.filter(i => !i.dragonDecoded && i !== secondBackground));
  g.emit('novvy:outro-finished', { reason: 'video_ended' });
  await flush();
  assert.equal(g.window.DragonCube.getState().levelId, 4);
  g.finish([secondBackground]);
  await flush();
  assert.equal(g.window.DragonCube.getState().levelId, 10);
});

test('视频先结束：core 片头立即收尾只派发一次，晚到的游戏脚本直接进试玩', async () => {
  const g = game({ intro: true, second: null });
  g.intro();
  let entries = 0;
  g.window.addEventListener('novvy:intro-finished', () => entries++);
  g.nodes.get('novvy-intro-video').dispatchEvent(new Event('ended'));
  assert.equal(entries, 1);
  assert.equal(g.window.__novvyIntroFinished, true);
  assert.equal(g.nodes.get('novvy-video-intro').classList.contains('is-finished'), true);
  g.boot();
  g.finish(g.images);
  await g.window.DragonCube.ready;
  assert.equal(entries, 1);
  g.emit('dragon-cube:ready');
  assert.equal(entries, 1);
  g.runTimers(220);
  assert.equal(g.nodes.has('novvy-video-intro'), false);
});

test('游戏脚本未能启动时视频层有超时出口，不会永久遮住页面', () => {
  const g = game({ intro: true, second: null });
  g.intro();
  let entries = 0;
  g.window.addEventListener('novvy:intro-finished', () => entries++);
  g.runTimers(12000);
  assert.equal(entries, 0, 'core 片头的 failsafe 是 30s，12s 时不应收尾');
  g.runTimers(30000);
  assert.equal(entries, 1);
  assert.equal(g.window.__novvyIntroFinished, true);
  g.cta();
  assert.equal(g.nodes.get('novvy-cta').hidden, false, '片头已结束但 DOM 还在时，晚到的桥也能显示卡片');
  g.emit('dragon-cube:ready');
  assert.equal(entries, 1);
  g.runTimers(220);
  assert.equal(g.nodes.has('novvy-video-intro'), false);
});

test('共享 CTA 卡片在片头结束且游戏就绪后显示，第一关最后一步完成即跳转', async () => {
  const first = {
    Index: 1, TimeLimit: 60,
    Cells: [0, 1].map(x => ({ Index: { x, y: 0 }, ...(x === 1 ? { Cat: { Color: 0 } } : {}) })),
    Boxes: [{ Index: 0, Color: 0, Count: 1, Cells: [{ x: 0, y: 0 }] }],
  };
  const g = game({ first, second: null, intro: true });
  let jumps = 0;
  g.window.NovvyPlayable = { click: () => jumps++ };
  g.cta(); g.intro();
  const card = g.nodes.get('novvy-cta');
  assert.equal(card.hidden, true);
  g.nodes.get('novvy-intro-video').dispatchEvent(new Event('ended'));
  assert.equal(g.window.__novvyIntroFinished, true);
  assert.equal(card.hidden, false, 'core 片头一收尾（不等游戏脚本）就亮出底部下载卡');
  assert.equal(g.window.__novvyCtaCardPhase, 'bar');
  assert.equal(jumps, 0, '显示卡片不会自动跳转');
  g.boot(); g.finish(g.images);
  await g.window.DragonCube.ready;
  assert.equal(jumps, 0, '游戏加载完成也不触发跳转');
  const board = g.nodes.get('board');
  for (const [type, clientX] of [['pointerdown', 163], ['pointermove', 227], ['pointerup', 227]]) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { clientX, clientY: 320, pointerId: 1 });
    board.dispatchEvent(event);
  }
  assert.equal(g.window.DragonCube.getState().collected, 1);
  g.runTimers(300);
  assert.equal(jumps, 1, '完成时即跳转，不等胜利音乐收尾');
  g.runTimers(5600);
  assert.equal(jumps, 1, '胜利事件不重复触发同一关的主动跳转');
});

test('第二关重置第一关转化状态，满 N 次有效拖放才跳转，后续每次交互再次触发', async () => {
  const row = Index => ({
    Index, TimeLimit: 60,
    Cells: Array.from({ length: 5 }, (_, x) => ({ Index: { x, y: 0 }, ...([1, 2, 4].includes(x) ? { Cat: { Color: 0 } } : {}) })),
    Boxes: [{ Index: 0, Color: 0, Count: 3, Cells: [{ x: 0, y: 0 }] }],
  });
  const g = game({ first: row(1), second: row(2) });
  g.window.__DRAGON_CUBE_PHASE2__.cta.afterSteps = 2;
  let jumps = 0;
  g.window.NovvyPlayable = { click: () => jumps++ };
  g.cta(); g.finish(g.images);
  await g.window.DragonCube.ready;
  const board = g.nodes.get('board');
  const drag = (from, to) => {
    g.tick();
    for (const [type, x] of [['pointerdown', from], ['pointermove', to], ['pointerup', to]]) {
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { clientX: 67 + 64 * x, clientY: 320, pointerId: 1 });
      if (type === 'pointerdown') g.document.dispatchEvent(new Event(type));
      board.dispatchEvent(event);
    }
  };
  drag(0, 4);
  g.runTimers(300);
  assert.equal(jumps, 1);
  g.emit('novvy:outro-finished', { reason: 'video_ended' });
  await flush();
  assert.equal(g.window.DragonCube.getState().levelId, 2);
  drag(0, 0);
  drag(0, 1);
  assert.equal(jumps, 1, '无效拖放不计数，第二关第一步也不继承上一关的触压转化');
  drag(1, 0);
  assert.equal(jumps, 2, '达到第二关 N 步即自动转化');
  assert.equal(g.window.__novvyCtaCardPhase, 'bar', '默认无遮罩，保留常驻下载条');
  drag(0, 1);
  assert.equal(jumps, 3);
  drag(1, 2);
  assert.equal(jumps, 4, '后续每次拖动继续触发，而非只跳转一次');
});
