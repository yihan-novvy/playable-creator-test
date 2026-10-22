import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { originCtaPolicy, originCtaSchedule, originHtml } from '../plugins/colorever-origin/lib.mjs';
import { getEntry } from '../core/registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templateRoot = path.join(root, 'editor/templates/colorever-origin');
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export default async function run(assert) {
  const entry = getEntry('colorever-origin');

  // —— 冻结产物：源/产物/清单三方 sha 一致 ——
  const source = path.join(root, 'template-core/colorever-origin/src-game/index.html');
  const built = path.join(templateRoot, 'game/index.html');
  assert.equal(sha(source), sha(built), '入库产物与冻结源逐字节一致');
  const manifest = JSON.parse(fs.readFileSync(path.join(templateRoot, 'game-manifest.json'), 'utf8'));
  assert.equal(manifest.constants.sourceSha256, sha(built), '清单 sha 与产物一致');
  assert.equal(entry.template.game.indexHtml, 'game/index.html', 'registry 合成 game.indexHtml');

  // —— CTA 循环节奏纯函数 ——
  const defaults = entry.template.defaults.playableCta;
  assert.equal(originCtaPolicy(defaults), { mode: 'steps', afterSteps: 10, intervals: [5, 4, 3, 2] }, '默认策略 = 10 步首跳 + 5/4/3/2 间隔表');
  assert.equal(
    originCtaSchedule(originCtaPolicy(defaults)).slice(0, 8).map((item) => item.step),
    [10, 15, 19, 22, 24, 26, 28, 30],
    '触发点表 10 → +5 → +4 → +3 → +2 → 之后每 2 步',
  );
  assert.equal(originCtaSchedule({ mode: 'steps', afterSteps: 10, intervals: [] }).map((item) => item.step), [10], '间隔表剔空 = 只保留首跳');
  assert.equal(originCtaSchedule({ mode: 'complete', afterSteps: 10, intervals: [5] }), [], 'complete 模式无步数循环');
  assert.equal(originCtaPolicy({ mode: 'steps', afterSteps: 10, intervals: [3, 0, -1, 2.5, 'x', 200, 4] }).intervals, [3, 4], '非法间隔逐项剔除');
  assert.equal(originCtaPolicy({}).afterSteps, 8, '非法 afterSteps 回退共享默认 8');

  // —— 注入组装（预览形态，读真实冻结产物） ——
  const html = fs.readFileSync(built, 'utf8');
  const withIntro = originHtml({
    root: templateRoot, template: entry.template,
    config: { ...entry.template.defaults, intro: { ...entry.template.defaults.intro, enabled: true } },
    media: { introVideo: 'tail-ad-video.mp4', introPoster: 'poster.webp' },
    preview: true,
  });
  assert.equal(withIntro.stageChain, ['video', 'playable'], '片头启用时段链 = video + playable');
  assert.check(withIntro.html.includes('id="novvy-video-intro"') && withIntro.html.includes('data-novvy-intro'), '注入 core 片头三件套');
  assert.equal(withIntro.html.split('</head>').length - 1, 1, 'head 锚点拼接后仍唯一');
  assert.equal(withIntro.html.split('</body>').length - 1, 1, 'body 锚点拼接后仍唯一');

  const withoutIntro = originHtml({ root: templateRoot, template: entry.template, config: entry.template.defaults, media: {}, preview: true });
  assert.equal(withoutIntro.stageChain, ['playable'], '片头关闭时段链 = 单 playable');
  assert.check(!withoutIntro.html.includes('id="novvy-video-intro"'), '片头关闭不注入片头 DOM');

  for (const built of [withIntro, withoutIntro]) {
    const out = built.html;
    assert.check(out.includes('data-novvy-playable-bridge') && out.includes('data-novvy-cta-bridge'), '段桥与转化桥都在场');
    assert.check(out.includes('__ORIGIN_CTA_URL__'), '转化桥 URL 变量替换为 origin 专属全局名');
    assert.check(out.includes('data-novvy-origin-engine'), '注入 origin 引擎适配');
    assert.check(out.includes('data-novvy-origin-config'), '注入 GlobalConfig 胜利阈值补丁');
    assert.check(out.includes('%E6%B8%B8%E6%88%8F') === false && out.includes('99.99') && out.includes('\\"levelStart\\":1,\\"levelEnd\\":1'), '胜利阈值钉到 99.99（解完才到）且关卡循环收敛');
    assert.check(out.includes('15.0') || out.includes('15}'), '冻结源自身的烘焙阈值不被改动（运行时补丁）');
    assert.check(out.includes('"__novvyStageChain__"') || out.includes('window.__novvyStageChain__='), '段链字面量注入');
    assert.check(out.includes('window.__NOVVY_CTA_END_MASK__=false'), 'endMask 默认 false（colorever-new 回访每击语义）');
    assert.check(out.includes('"schedule":[{"step":10,"gap":5}'), '循环节奏表随策略注入');
    assert.check(out.includes('id="novvy-origin-cta-zone"') && out.includes('data-novvy-click-source="cta_click"'), '注入 CTA 直连区(横幅上方标记透明层)');
    assert.check(out.includes('data-novvy-origin-splash') && out.includes('#__bootcover{display:none!important}'), '隐藏 aplv 自带开机 splash');
    assert.check(!out.includes('data-novvy-cta-card') && !out.includes('id="novvy-cta"'), '不注入 cta-card（CTA 用 playable 自带横幅）');
    assert.check(out.includes('GameCanvas') && out.includes('bundle_gemsort') && out.includes('super_html'), 'playable 本体结构完整');
    assert.check(out.includes('__CTA_URL_KEY__') === false, '桥占位符无残留');
    assert.check(!/__NOVVY_INTRO_VIDEO__|__NOVVY_INTRO_POSTER__|__HUD_[LR]/.test(out), '覆盖层占位符无残留');
    // playable 本体除注入外一字节不改：剥掉注入后与源完全一致。
    const stripped = out
      .replace(/<style data-novvy-origin-splash>[\s\S]*?<\/style>\n?/, '')
      .replace(/<style data-novvy-hud>[\s\S]*?<\/style>\n?/, '')
      .replace(/<script data-novvy-origin-config>[\s\S]*?<\/script>\n?/, '')
      .replace(/<script>window\.__novvyStageChain__[\s\S]*?<\/script>\n?/, '')
      .replace(/<style data-novvy-intro>[\s\S]*?<\/style>\n?<\/head>/, '</head>')
      .replace(/<div id="novvy-video-intro"[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>')
      .replace(/<div id="novvy-training-hud"[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>')
      .replace(/<script data-novvy-playable-bridge>[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>');
    assert.equal(stripped, html, '剥离注入后与冻结源逐字节一致');
  }

  // —— pack 形态：可玩载荷拆分到 game.js（广告逻辑迭代不再触碰载荷文件） ——
  const packed = originHtml({ root: templateRoot, template: entry.template, config: entry.template.defaults, media: {} });
  assert.check(packed.gameJs && packed.gameJs.length > 1000000, '可玩载荷整体抽出为 game.js（>1MB）');
  assert.check(packed.gameJs.includes('window.__zip') && packed.gameJs.includes('window.__res') && packed.gameJs.includes('super_boot_engine') && packed.gameJs.includes('bundle_gemsort'), 'game.js 含引擎 zip/资产表/启动链');
  assert.equal(packed.html.split('<script src="game.js"></script>').length - 1, 1, 'game.js 以唯一外链脚本回插原位');
  assert.check(!packed.html.includes('window.__zip'), 'index.html 不再内联可玩载荷');
  assert.check(packed.html.includes('data-novvy-origin-config') && packed.html.includes('99.99'), '胜利阈值补丁仍注入 index.html');
  assert.check(packed.gameJs.includes('15.0'), 'game.js 内烘焙阈值保持原版（补丁是运行时的）');
  // HUD 标题（TitleSprite 原位接管）
  assert.check(packed.html.includes('id="novvy-training-hud"') && packed.html.includes('data-title-only'), 'HUD 标题层注入（title-only 形态）');
  assert.check(packed.html.includes('top: 7.5%'), 'HUD 钉在原标题横幅位置（top 7.5%）');
  assert.check(packed.html.includes('"titleLine1":"Colorever"') && packed.html.includes('"titleLine2":"The Best Brain-Training Game"'), '标题文案随 __NOVVY_UI__ 注入');
  const injectionCut = Math.min(...['<div id="novvy-training-hud"', '<div id="novvy-video-intro"'].map((s) => { const i = packed.html.indexOf(s); return i < 0 ? Infinity : i; }));
  const rebuilt = (packed.html.slice(0, injectionCut)
    .replace('<script src="game.js"></script>', () => '<script type="text/javascript">' + packed.gameJs + '</script>')
    .replace(/<style data-novvy-origin-splash>[\s\S]*?<\/style>\n?/, '')
    .replace(/<style data-novvy-hud>[\s\S]*?<\/style>\n?/, '')) + '</body></html>';
  assert.equal(rebuilt, html, '回填 game.js 并剥离注入后与冻结源逐字节一致');

  // —— previewHtml 钩子签名 ——
  assert.equal(typeof (await import('../plugins/colorever-origin/lib.mjs')).previewHtml, 'function', '提供在线预览钩子');

  // —— 图案变体（levels/ 图案库，2026-10-24）：产物间只差 level.js，游戏本体跨变体逐字节一致 ——
  const { originLevelData } = await import('../plugins/colorever-origin/lib.mjs');
  {
    // 数据文件全部可解析且字段齐备（levels/*.json 是打包时的唯一图案来源）
    const levelsDir = path.join(root, 'template-core/colorever-origin/levels');
    const levelFiles = fs.readdirSync(levelsDir).filter((f) => f.endsWith('.json'));
    assert.check(levelFiles.length >= 3, `图案库至少 3 个变体（当前 ${levelFiles.length} 个）`);
    for (const file of levelFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(levelsDir, file), 'utf8'));
      assert.equal(data.id, file.replace('.json', ''), `图案 ${file} id 与文件名一致`);
      for (const field of ['name', 'level1ZipPath', 'level1Text', 'guideResKey', 'guideText']) {
        assert.check(typeof data[field] === 'string' && data[field].length > 0, `图案 ${data.id} 字段 ${field} 在场`);
      }
      JSON.parse(data.level1Text);
      JSON.parse(data.guideText);
      // 引导 6 阶段颜色必须落在该图案的 tileset 色名内（否则新手引导指空）
      const level = JSON.parse(data.level1Text);
      const map = level[5][0][2];
      const names = new Set(map.tilesets[0].tiles.map((t) => t.image.split('/').pop().replace('.png', '').split('_')[2]));
      const guide = JSON.parse(data.guideText)[5][0][2];
      for (let s = 1; s <= 6; s += 1) {
        const color = guide[`阶段${s}颜色`];
        if (color) assert.check(names.has(color), `图案 ${data.id} 引导阶段${s}颜色 ${color} 在图案色板内`);
      }
    }
    // 原始五瓣花 = 不注入（产物与历史任务同管线）
    assert.equal(originLevelData(templateRoot, { patternId: 'flower5-original' }), null, '原始五瓣花不产生图案注入');
    assert.equal(originLevelData(templateRoot, {}), null, '未选图案不产生注入');
    // 非法图案拒绝打包
    let rejected = false;
    try { originLevelData(templateRoot, { patternId: 'no-such-pattern' }); } catch { rejected = true; }
    assert.check(rejected, '未知 patternId 拒绝打包');
    // 变体注入：预览内联 / pack 外链 level.js；引擎脚本必须晚于数据脚本
    const variantPreview = originHtml({ root: templateRoot, template: entry.template, config: { ...entry.template.defaults, patternId: 'flower4-blue' }, media: {}, preview: true });
    assert.equal(variantPreview.pattern, { id: 'flower4-blue', name: '蓝色四瓣花' }, '变体元数据回传');
    assert.check(variantPreview.levelJs?.startsWith('window.__ORIGIN_LEVEL_DATA__='), 'levelJs 载荷生成');
    assert.check(variantPreview.html.includes('<script data-novvy-origin-level>window.__ORIGIN_LEVEL_DATA__='), '预览形态内联图案数据');
    assert.check(variantPreview.html.indexOf('data-novvy-origin-level') < variantPreview.html.indexOf('data-novvy-origin-engine'), '图案数据脚本先于引擎适配');
    const variantPack = originHtml({ root: templateRoot, template: entry.template, config: { ...entry.template.defaults, patternId: 'flower4-blue' }, media: {} });
    assert.check(variantPack.html.includes('<script src="level.js"></script>'), 'pack 形态外链 level.js');
    assert.check(!variantPack.html.includes('window.__ORIGIN_LEVEL_DATA__='), 'pack 形态 index.html 不内联图案数据（只有 engine 里的标识符引用）');
    assert.check(variantPack.levelJs.includes('flower4-blue'), 'level.js 载荷携带变体 id');
    // game.js 跨变体逐字节一致（核心不变量）
    const gameJsDefault = originHtml({ root: templateRoot, template: entry.template, config: entry.template.defaults, media: {} }).gameJs;
    const gameJsBlue = variantPack.gameJs;
    const gameJsChanging = originHtml({ root: templateRoot, template: entry.template, config: { ...entry.template.defaults, patternId: 'flower5-changing' }, media: {} }).gameJs;
    assert.equal(gameJsBlue, gameJsDefault, 'game.js 与默认（原始五瓣花）逐字节一致');
    assert.equal(gameJsBlue, gameJsChanging, 'game.js 跨图案变体逐字节一致');
  }

  // —— 引擎适配 shim：桩环境全链路（手势节奏 / 真实进度 / 结算 / CTA 接线） ——
  const enginePath = path.join(root, 'editor/plugins/colorever-origin/overlays/engine/engine.js');
  const engineSrc = fs.readFileSync(enginePath, 'utf8');
  const scheduleDefaults = originCtaSchedule(originCtaPolicy(defaults));
  const scope = globalThis;
  const savedGlobals = { window: scope.window, document: scope.document, CustomEvent: scope.CustomEvent, setInterval: scope.setInterval, clearInterval: scope.clearInterval, console: scope.console, Audio: scope.Audio };

  function makeEnv(noSdk = false) {
    const docListeners = [], winListeners = [], events = [], timers = [], logs = [];
    const calls = { onStep: [], click: [], download: [], gameEndOriginal: 0, windowOpen: [], mraidOpen: [], stage: [], audioResumes: 0, audioPlay: 0, bufferStarts: 0, audioElements: [] };
    class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; } }
    const zoneEl = { addEventListener(type, fn) { zoneEl.clickHandler = fn; } };
    const fakeDocument = {
      getElementById: (id) => (id === 'novvy-origin-cta-zone' ? zoneEl : null),
      addEventListener: (type, fn) => docListeners.push({ type, fn }),
      dispatchEvent: (event) => {
        events.push({ bus: 'document', type: event.type, detail: event.detail });
        for (const l of docListeners) if (l.type === event.type) l.fn(event);
      },
    };
    const fakeWindow = {
      __ORIGIN_CTA_POLICY__: { mode: 'steps', afterSteps: 10, intervals: [5, 4, 3, 2], schedule: scheduleDefaults },
      addEventListener: (type, fn) => winListeners.push({ type, fn }),
      dispatchEvent: (event) => {
        events.push({ bus: 'window', type: event.type, detail: event.detail });
        for (const l of winListeners) if (l.type === event.type) l.fn(event);
      },
      PointerEvent: function () {},
      ...(noSdk ? {} : {
        NovvyPlayable: {
          click: (p) => calls.click.push(p),
          onStep: (step, detail) => calls.onStep.push({ step, detail }),
          setStage: (index, type) => calls.stage.push([index, type]),
          setStageList: (list) => calls.stageList ? calls.stageList.push(list) : (calls.stageList = [list]),
        },
      }),
      __audioCtxs: [],
      AudioContext: class {
        constructor() { this.state = 'suspended'; this.resume = () => { this.state = 'running'; calls.audioResumes += 1; }; fakeWindow.__audioCtxs.push(this); }
        decodeAudioData(buffer) { return Promise.resolve(buffer); }
        createBuffer() { return {}; }
        createBufferSource() { return { buffer: null, connect() {}, start: () => { calls.bufferStarts += 1; } }; }
      },
      __silentWavs: [],
      super_html: { download: (url) => calls.download.push(url), game_end: () => { calls.gameEndOriginal += 1; } },
      mraid: { open: (url) => calls.mraidOpen.push(url) },
      open: (url) => calls.windowOpen.push(url),
    };
    // 引擎闭包在事件回调期才读全局，桩必须在整个场景块期间保持安装
    scope.window = fakeWindow;
    scope.document = fakeDocument;
    scope.CustomEvent = CustomEvent;
    scope.setInterval = (fn) => { timers.push(fn); return timers.length; };
    scope.clearInterval = () => {};
    scope.Audio = class {
      constructor(src) { this.src = src; fakeWindow.__silentWavs.push(src); calls.audioElements.push(src); }
      play() { calls.audioPlay += 1; return Promise.resolve(); }
    };
    scope.console = { log: (m) => { logs.push(String(m)); savedGlobals.console.log(m); }, error: (m) => { logs.push(String(m)); savedGlobals.console.error(m); }, warn: (m) => { logs.push(String(m)); savedGlobals.console.warn(m); } };
    new Function(engineSrc)();
    const tap = () => { fakeDocument.dispatchEvent({ type: 'pointerdown', pointerId: 1 }); fakeDocument.dispatchEvent({ type: 'pointerup', pointerId: 1 }); };
    const fireTimers = () => { for (const fn of timers) fn(); };
    const of = (type) => events.filter((item) => item.type === type);
    return { events, calls, logs, tap, fireTimers, fakeWindow, of, zoneEl };
  }

  try {
    const env = makeEnv();
    // 音频解锁：引擎 boot 后创建的上下文（suspended），首次触压手势栈内解锁
    const gameCtx = new env.fakeWindow.AudioContext();
    assert.equal(gameCtx.state, 'suspended', '引擎创建的上下文初始 suspended');
    for (let i = 0; i < 10; i += 1) env.tap();
    assert.equal(gameCtx.state, 'running', '手势栈内解锁 WebAudio（suspended → running）');
    assert.check(env.calls.audioResumes > 0, '音频解锁走 ctx.resume');
    assert.equal(gameCtx.__novvyUnlockedBuffer, true, '空 buffer 过上下文（Howler 式 iOS 解锁）');
    assert.equal(env.calls.bufferStarts, 1, '空 buffer 每上下文只 start 一次');
    assert.equal(env.fakeWindow.__audioCtxs.length, 1, 'shim 记录全部 AudioContext');
    assert.check(env.logs.some((l) => l.includes('WebAudio running ✓')), 'WebAudio running 打日志');
    assert.equal(env.fakeWindow.__silentWavs.filter((s) => String(s).startsWith('data:audio/wav')).length, 1, 'iOS 静音键解锁：静音 wav 只播一次');
    assert.check(env.fakeWindow.__silentWavs[0].startsWith('data:audio/wav;base64,'), '静音 wav 走 data URI');
    assert.check(env.logs.some((l) => l.includes('iOS 静音键解锁')), '静音键解锁打日志');
    assert.equal(env.calls.onStep.map((item) => item.step), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], '进度源缺席时直接上报 onStep 步数');
    assert.equal(env.of('novvy:cta-moment').at(-1), { bus: 'document', type: 'novvy:cta-moment', detail: { repeat: false, everySteps: 5 } }, '第 10 步首跳 cta-moment（repeat=false, gap=5）');
    for (let i = 0; i < 5; i += 1) env.tap();
    assert.equal(env.of('novvy:cta-moment').at(-1).detail, { repeat: true, everySteps: 4 }, '第 15 步重复跳（gap=4）');
    for (let i = 0; i < 9; i += 1) env.tap();
    assert.equal(env.of('novvy:cta-moment').length, 5, '10/15/19/22/24 各触发一次（循环间隔表）');
    assert.equal(env.of('novvy:cta-moment').at(-1).detail.everySteps, 2, '表耗尽后按最后的 2 循环');

    // 真实进度源上线：BS_GameDirector._model 场景扫描命中后，hud-progress 接管 onStep
    const model = { ratio: 0.9, getCorrectFillRatio() { return this.ratio; } };
    const titleNode = { name: 'TitleSprite', active: true, children: [] };
    env.fakeWindow.cc = { director: { getScene: () => ({ children: [{ components: [{ _model: model }] }, titleNode] }) } };
    env.fireTimers();
    assert.equal(titleNode.active, false, 'TitleSprite 隐藏（HUD 标题接管）');
    assert.check(env.logs.some((l) => l.includes('TitleSprite 已隐藏')), 'TitleSprite 隐藏打日志');
    assert.equal(env.of('novvy:hud-progress').at(-1).detail, { percent: 90 }, '扫描命中后按真值派 hud-progress 90');
    assert.equal(env.of('novvy:hud-progress').length, 1, '同值不重复派发');
    assert.check(env.logs.some((l) => l.includes('[novvy-origin] hud-progress percent=90')), 'hud-progress 派发打日志');
    assert.check(env.logs.some((l) => l.includes('进度里程碑 25%（当前 90%）')) && env.logs.some((l) => l.includes('进度里程碑 75%（当前 90%）')), '25/50/75 里程碑跨越打日志');
    assert.check(env.logs.some((l) => l.includes('[novvy-origin] 试玩开始')), '试玩开始打日志');
    env.fakeWindow.NovvyPlayable.setStage(2, 'playable');
    assert.equal(env.calls.stage.at(-1), [2, 'playable'], 'stage 包装透传原调用');
    assert.check(env.logs.some((l) => l.includes('[novvy-origin] stage → 2 (playable)')), 'stage 切换打日志');
    assert.check(env.logs.some((l) => l.includes('SDK 段切换日志已挂接')), 'stage 日志挂接提示');
    const onStepBefore = env.calls.onStep.length;
    env.tap();
    model.ratio = 0.92;
    env.fireTimers();
    env.tap();
    env.fireTimers();
    assert.equal(env.of('novvy:hud-progress').at(-1).detail, { percent: 92 }, '真值上涨继续派发');
    assert.equal(env.calls.onStep.length, onStepBefore, '进度源在场后不再直接上报步数（段桥接管 onStep）');

    // 终局前的横幅 download = 手动 CTA
    env.fakeWindow.super_html.download('store://banner');
    assert.equal(env.of('novvy:cta-interact').map((item) => item.bus), ['window'], '终局前横幅 download 改派 cta-interact');
    assert.equal(env.calls.download.length, 0, 'SDK 在场时原生 download 不直调');

    // 结算：game_end → 收尾读数 100 + playable-complete + 原回调；终局后手势停计
    model.ratio = 1;
    env.fakeWindow.super_html.game_end();
    assert.equal(env.of('novvy:hud-progress').at(-1).detail, { percent: 100 }, '结算收尾读数给 100');
    assert.check(env.logs.some((l) => l.includes('进度里程碑 100%（当前 100%）')), '100 里程碑在结算读数打日志');
    assert.equal(env.of('novvy:playable-complete').length, 1, 'game_end 派发 playable-complete');
    assert.equal(env.calls.gameEndOriginal, 1, '原 game_end 回调保留');
    const momentsBefore = env.of('novvy:cta-moment').length;
    for (let i = 0; i < 3; i += 1) env.tap();
    assert.equal(env.of('novvy:cta-moment').length, momentsBefore, '终局后手势停计');
    assert.equal(env.calls.download.length, 0, 'SDK 在场时原生 download 不直调');

    { // window.open 双路区分：棋盘解完=完成；横幅等=手动 CTA（不触发完成/武装）
      const env2 = makeEnv();
      const model2 = { ratio: 0.3, getCorrectFillRatio() { return this.ratio; } };
      env2.fakeWindow.cc = { director: { getScene: () => ({ children: [{ components: [{ _model: model2 }] }] }) } };
      env2.fireTimers();
      env2.fakeWindow.open('store://banner'); // 未解完的跳转 = 横幅/按钮手动 CTA
      assert.equal(env2.of('novvy:cta-interact').length, 1, '未解完的 window.open 走手动 CTA（cta_click）');
      assert.equal(env2.of('novvy:playable-complete').length, 0, '未解完不触发完成信号');
      const momentsMid = env2.of('novvy:cta-moment').length;
      for (let i = 0; i < 3; i += 1) env2.tap();
      assert.equal(env2.of('novvy:cta-moment').length, momentsMid, '手动 CTA 不武装回访每击（节奏照常）');
      model2.ratio = 1;
      env2.fakeWindow.open('store://win-jump'); // 解完的跳转 = 原生胜利完成
      assert.equal(env2.of('novvy:playable-complete').length, 1, '解完的 window.open 派发 playable-complete');
      env2.fakeWindow.open('store://again');
      assert.equal(env2.of('novvy:playable-complete').length, 1, '完成信号幂等（once 闩锁）');
      env2.fakeWindow.super_html.download('store://banner');
      assert.equal(env2.of('novvy:cta-interact').length, 1, '终局后 download 不再派 cta-interact');
      assert.equal(env2.calls.download.length, 0, '终局后 download 不落裸跳转');
    }

    // CTA：终局后的横幅 download 静默（完成转化已发，回访触压由桥接管）
    env.fakeWindow.super_html.download('store://x');
    assert.equal(env.of('novvy:cta-interact').length, 1, '终局后不再追加 cta-interact（仅终局前一次）');
    assert.equal(env.calls.download.length, 0, 'SDK 在场不落裸跳转');

    { // mraid.open 裸跳归一:包装层原版 download 首选 mraid.open(SDK WebView 的
      // MRAID 兼容层),漏网即产生第二组 SDK 归因,一次点击双计转化
      const env3 = makeEnv();
      const model3 = { ratio: 0.3, getCorrectFillRatio() { return this.ratio; } };
      env3.fakeWindow.cc = { director: { getScene: () => ({ children: [{ components: [{ _model: model3 }] }] }) } };
      env3.fireTimers();
      assert.check(env3.logs.some((l) => l.includes('mraid 已换受控假身')), 'mraid 假身随定时器替换');
      assert.check(env3.fakeWindow.mraid.__novvyMraidDecoy === true, 'window.mraid 已整只换假身（宿主侦测层成孤儿）');
      env3.fakeWindow.mraid.open('store://banner');
      assert.equal(env3.of('novvy:cta-interact').length, 1, '未解完的 mraid.open 走手动 CTA（cta_click）');
      assert.equal(env3.calls.mraidOpen.length, 0, 'SDK 在场原始 mraid.open 不再被调用（裸调用到不了 SDK）');
      model3.ratio = 1;
      env3.fakeWindow.mraid.open('store://win');
      assert.equal(env3.of('novvy:playable-complete').length, 1, '解完的 mraid.open 派发 playable-complete');
      assert.check(env3.logs.some((l) => l.includes('裸跳 mraid.open 拦截')), 'mraid 拦截打验收日志');

      { // 一击多口:横幅 window.open + 包装层 download 的 mraid.open 前后脚 → 只派一次
        const env4 = makeEnv();
        const model4 = { ratio: 0.3, getCorrectFillRatio() { return this.ratio; } };
        env4.fakeWindow.cc = { director: { getScene: () => ({ children: [{ components: [{ _model: model4 }] }] }) } };
        env4.fireTimers();
        env4.fakeWindow.open('store://banner');
        env4.fakeWindow.mraid.open('store://banner');
        env4.fakeWindow.super_html.download('store://banner');
        assert.equal(env4.of('novvy:cta-interact').length, 1, '同一击的 window.open/mraid.open/download 多入口去抖为一次转化');
      }

      { // window.open 守卫:宿主在我方包装外再包一层(裸跳侦测)时,定时器把它孤儿化
        const env6 = makeEnv();
        let hostSawCall = 0;
        const ourOpen = env6.fakeWindow.open;
        env6.fakeWindow.open = function (url) { hostSawCall += 1; return ourOpen.call(this, url); };
        env6.fireTimers();
        env6.fakeWindow.open('store://x');
        assert.equal(hostSawCall, 0, '宿主包在 window.open 外层的侦测被孤儿化(不再被调用)');
        assert.equal(env6.of('novvy:cta-interact').length, 1, '裸跳仍收编为一次手动 CTA');
      }

      { // 预览(无 SDK):guardMraid 不动手,mraid.open 放行原生跳转,不派发事件
        const env5 = makeEnv(true);
        assert.check(env5.fakeWindow.mraid.__novvyMraidDecoy !== true, '预览不替换 mraid');
        env5.fakeWindow.mraid.open('store://native');
        assert.equal(env5.calls.mraidOpen, ['store://native'], '无 SDK 时 mraid.open 放行原生跳转');
        assert.equal(env5.of('novvy:cta-interact').length, 0, '预览 mraid 裸跳不派发事件');
      }
    }

    { // CTA 直连区:横幅点击直派 cta-interact,不走画布/裸跳链
      const envZ = makeEnv();
      assert.check(typeof envZ.zoneEl.clickHandler === 'function', '直连区在引擎 eval 时接线完成');
      envZ.zoneEl.clickHandler();
      assert.equal(envZ.of('novvy:cta-interact').length, 1, '直连区点击直派 cta-interact(不经画布/裸跳)');
      envZ.zoneEl.clickHandler();
      assert.equal(envZ.of('novvy:cta-interact').length, 1, '300ms 去抖:同击重复 click 只派一次');
      assert.check(envZ.logs.some((l) => l.includes('CTA 直连区已接线')), '直连区接线打日志');
    }

    { // 预览形态（无 SDK）：download 保留裸跳转且不派发事件（避免桥兜底成环）
      const env = makeEnv();
      delete env.fakeWindow.NovvyPlayable;
      env.fakeWindow.super_html.download('store://x');
      assert.equal(env.calls.download, ['store://x'], '无 SDK 时保留原始裸跳转');
      assert.equal(env.of('novvy:cta-interact').length, 0, '裸跳转路径不派发事件');
      assert.equal(env.of('novvy:cta-moment').length, 0, '未到步数不派发 cta-moment');
      env.fakeWindow.open('store://y');
      assert.equal(env.calls.windowOpen, ['store://y'], '无 SDK 时 window.open 保留原始裸跳转');
      assert.equal(env.of('novvy:playable-complete').length, 0, '预览不派发 playable-complete');
    }
  } finally {
    Object.assign(scope, savedGlobals);
  }
}
