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
    assert.check(out.includes('data-novvy-origin-splash') && out.includes('#__bootcover{display:none!important}'), '隐藏 aplv 自带开机 splash');
    assert.check(!out.includes('data-novvy-cta-card') && !out.includes('id="novvy-cta"'), '不注入 cta-card（CTA 用 playable 自带横幅）');
    assert.check(out.includes('GameCanvas') && out.includes('bundle_gemsort') && out.includes('super_html'), 'playable 本体结构完整');
    assert.check(out.includes('__CTA_URL_KEY__') === false, '桥占位符无残留');
    assert.check(!/__NOVVY_INTRO_VIDEO__|__NOVVY_INTRO_POSTER__|__HUD_[LR]/.test(out), '覆盖层占位符无残留');
    // playable 本体除注入外一字节不改：剥掉注入后与源完全一致。
    const stripped = out
      .replace(/<style data-novvy-origin-splash>[\s\S]*?<\/style>\n?/, '')
      .replace(/<script data-novvy-origin-config>[\s\S]*?<\/script>\n?/, '')
      .replace(/<script>window\.__novvyStageChain__[\s\S]*?<\/script>\n?/, '')
      .replace(/<style data-novvy-intro>[\s\S]*?<\/style>\n?<\/head>/, '</head>')
      .replace(/<div id="novvy-video-intro"[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>')
      .replace(/<script data-novvy-playable-bridge>[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>');
    assert.equal(stripped, html, '剥离注入后与冻结源逐字节一致');
  }

  // —— previewHtml 钩子签名 ——
  assert.equal(typeof (await import('../plugins/colorever-origin/lib.mjs')).previewHtml, 'function', '提供在线预览钩子');

  // —— 引擎适配 shim：桩环境全链路（手势节奏 / 真实进度 / 结算 / CTA 接线） ——
  const enginePath = path.join(root, 'editor/plugins/colorever-origin/overlays/engine/engine.js');
  const engineSrc = fs.readFileSync(enginePath, 'utf8');
  const scheduleDefaults = originCtaSchedule(originCtaPolicy(defaults));
  const scope = globalThis;
  const savedGlobals = { window: scope.window, document: scope.document, CustomEvent: scope.CustomEvent, setInterval: scope.setInterval, clearInterval: scope.clearInterval, console: scope.console };

  function makeEnv() {
    const docListeners = [], winListeners = [], events = [], timers = [], logs = [];
    const calls = { onStep: [], click: [], download: [], gameEndOriginal: 0, windowOpen: [], stage: [] };
    class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; } }
    const fakeDocument = {
      getElementById: () => null,
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
      NovvyPlayable: {
        click: (p) => calls.click.push(p),
        onStep: (step, detail) => calls.onStep.push({ step, detail }),
        setStage: (index, type) => calls.stage.push([index, type]),
        setStageList: (list) => calls.stageList ? calls.stageList.push(list) : (calls.stageList = [list]),
      },
      super_html: { download: (url) => calls.download.push(url), game_end: () => { calls.gameEndOriginal += 1; } },
      open: (url) => calls.windowOpen.push(url),
    };
    // 引擎闭包在事件回调期才读全局，桩必须在整个场景块期间保持安装
    scope.window = fakeWindow;
    scope.document = fakeDocument;
    scope.CustomEvent = CustomEvent;
    scope.setInterval = (fn) => { timers.push(fn); return timers.length; };
    scope.clearInterval = () => {};
    scope.console = { log: (m) => logs.push(String(m)), error: (m) => logs.push(String(m)), warn: (m) => logs.push(String(m)) };
    new Function(engineSrc)();
    const tap = () => { fakeDocument.dispatchEvent({ type: 'pointerdown', pointerId: 1 }); fakeDocument.dispatchEvent({ type: 'pointerup', pointerId: 1 }); };
    const fireTimers = () => { for (const fn of timers) fn(); };
    const of = (type) => events.filter((item) => item.type === type);
    return { events, calls, logs, tap, fireTimers, fakeWindow, of };
  }

  try {
    const env = makeEnv();
    for (let i = 0; i < 10; i += 1) env.tap();
    assert.equal(env.calls.onStep.map((item) => item.step), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], '进度源缺席时直接上报 onStep 步数');
    assert.equal(env.of('novvy:cta-moment').at(-1), { bus: 'document', type: 'novvy:cta-moment', detail: { repeat: false, everySteps: 5 } }, '第 10 步首跳 cta-moment（repeat=false, gap=5）');
    for (let i = 0; i < 5; i += 1) env.tap();
    assert.equal(env.of('novvy:cta-moment').at(-1).detail, { repeat: true, everySteps: 4 }, '第 15 步重复跳（gap=4）');
    for (let i = 0; i < 9; i += 1) env.tap();
    assert.equal(env.of('novvy:cta-moment').length, 5, '10/15/19/22/24 各触发一次（循环间隔表）');
    assert.equal(env.of('novvy:cta-moment').at(-1).detail.everySteps, 2, '表耗尽后按最后的 2 循环');

    // 真实进度源上线：BS_GameDirector._model 场景扫描命中后，hud-progress 接管 onStep
    const model = { ratio: 0.9, getCorrectFillRatio() { return this.ratio; } };
    env.fakeWindow.cc = { director: { getScene: () => ({ children: [{ components: [{ _model: model }] }] }) } };
    env.fireTimers();
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

    { // 原生胜利跳转（window.open）归一到同一闩锁；终局后 download 静默
      const env2 = makeEnv();
      env2.tap();
      env2.fakeWindow.open('store://win-jump');
      assert.equal(env2.of('novvy:playable-complete').length, 1, 'window.open 原生跳转派发 playable-complete');
      assert.equal(env2.calls.windowOpen.length, 0, 'SDK 在场拦截裸 window.open');
      env2.fakeWindow.open('store://again');
      assert.equal(env2.of('novvy:playable-complete').length, 1, '完成信号幂等（once 闩锁）');
      env2.fakeWindow.super_html.download('store://banner');
      assert.equal(env2.of('novvy:cta-interact').length, 0, '终局后 download 不再派 cta-interact');
      assert.equal(env2.calls.download.length, 0, '终局后 download 不落裸跳转');
      const moments2 = env2.of('novvy:cta-moment').length;
      env2.tap();
      assert.equal(env2.of('novvy:cta-moment').length, moments2, '终局后节奏停表');
    }

    // CTA：终局后的横幅 download 静默（完成转化已发，回访触压由桥接管）
    env.fakeWindow.super_html.download('store://x');
    assert.equal(env.of('novvy:cta-interact').length, 1, '终局后不再追加 cta-interact（仅终局前一次）');
    assert.equal(env.calls.download.length, 0, 'SDK 在场不落裸跳转');

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
