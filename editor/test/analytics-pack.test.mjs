import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

// Unit-level checks for the package-mode pack split and the vendored
// analytics library:
//   A.  repack three-mode matrix against the EXAMPLE dirs — package mode
//       emits the spec multi-file layout with a clean partition of __res,
//       legacy mode stays faithful to the original tool (no new files),
//       inline-lib mode embeds the lib without siblings.
//   A2. game.js determinism — two identical packs produce identical bytes
//       (the staged zip gets pinned mtimes).
//   B.  the vendored analytics library runs in a bare sandbox (no SDK
//       bridge) and mirrors accepted emits into window.__novvyEventLog only
//       when debugging is enabled.
//   C.  the water-sort analytics boot, driven in the same sandbox, turns the
//       shell's raw signals (video element events, novvy:* broadcasts) into
//       the spec funnel — including media_progress 25/50/75 for the intro
//       video, which is the event class the water-sort packs used to omit.

const execFile = promisify(execFileCallback);

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..', '..');
const EXAMPLE = path.join(ROOT, 'editor', 'test', 'fixtures', 'dragon-baby-color-ever');
const TEMPLATE = path.join(ROOT, 'editor', 'templates', 'colorever-gemsort');
const PLUGIN = path.join(ROOT, 'editor', 'plugins', 'colorever-gemsort');
const VENDOR = path.join(ROOT, 'editor', 'core', 'vendor', 'analytics.js');

function stageExampleGame(workDir, label) {
  const gameDir = path.join(workDir, `${label}-game`);
  fs.mkdirSync(gameDir);
  fs.symlinkSync(path.join(EXAMPLE, 'index.html'), path.join(gameDir, 'index.html'));
  fs.symlinkSync(path.join(EXAMPLE, 'editable', 'asset-manifest.json'), path.join(gameDir, 'asset-manifest.json'));
  fs.symlinkSync(path.join(EXAMPLE, 'editable', 'zip-manifest.json'), path.join(gameDir, 'zip-manifest.json'));
  return gameDir;
}

function repackArgs(workDir, label) {
  return [
    path.join(ROOT, 'editor', 'plugins', 'colorever-gemsort', 'scripts', 'repack.mjs'),
    '--game', stageExampleGame(workDir, label),
    '--assets-root', path.join(EXAMPLE, 'editable', 'assets'),
    '--out', path.join(workDir, label, 'index.html'),
  ];
}

async function runRepack(workDir, label, extraArgs) {
  await execFile('node', [...repackArgs(workDir, label), ...extraArgs]);
}

function requestedMaterialsKeys() {
  const templateJson = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'template.json'), 'utf8'));
  const exampleManifest = JSON.parse(fs.readFileSync(path.join(EXAMPLE, 'editable', 'asset-manifest.json'), 'utf8'));
  const exampleZipEntries = JSON.parse(fs.readFileSync(path.join(EXAMPLE, 'editable', 'zip-manifest.json'), 'utf8'));
  const bgImportBase = templateJson.background.assetPath.replace('/native/', '/import/').replace(/\.png$/, '');
  return [
    templateJson.background.assetPath,
    `${bgImportBase}.json`,
    `${bgImportBase}@f9941.json`,
    templateJson.meta.globalConfigAssetPath,
    templateJson.meta.guideConfigAssetPath,
    ...templateJson.levels.map((level) => level.assetPath),
  ].filter((key) => key in exampleManifest || exampleZipEntries.includes(key));
}

async function modeMatrix(workDir, assert) {
  // The template HUD ships no images (the runner generates them per task),
  // so the matrix feeds the example's portrait art instead.
  const overlayArgs = [
    '--overlays-root', path.join(PLUGIN, 'overlays'),
    '--hud-image-left', path.join(EXAMPLE, 'editable', 'hud', 'dragon-left.png'),
    '--hud-image-right', path.join(EXAMPLE, 'editable', 'hud', 'dragon-right.png'),
    '--cta-icon', path.join(PLUGIN, 'overlays', 'cta', 'icon.png'),
    '--intro-video', path.join(EXAMPLE, 'ad-assets', 'final', 'intro-video.mp4'),
    '--intro-poster', path.join(EXAMPLE, 'editable', 'intro', 'poster.jpg'),
  ];
  const materialsPath = path.join(workDir, 'materials-keys.json');
  fs.writeFileSync(materialsPath, JSON.stringify(requestedMaterialsKeys()));

  // --- package mode ---
  await runRepack(workDir, 'package', [...overlayArgs, '--analytics', VENDOR, '--package', 'true', '--materials', materialsPath]);
  const packageDir = path.join(workDir, 'package');
  assert.equal(
    fs.readdirSync(packageDir).sort(),
    ['analytics.js', 'app-icon.png', 'game.js', 'hud-left.webp', 'hud-right.webp', 'index.html', 'materials.js', 'poster.webp', 'tail-ad-video.mp4'],
    'package mode emits exactly the spec multi-file layout',
  );
  assert.check(!fs.readFileSync(path.join(packageDir, 'index.html'), 'utf8').includes('novvy-dom-bg'), 'without --dom-bg-file no DOM background is injected');
  const shell = fs.readFileSync(path.join(packageDir, 'index.html'), 'utf8');
  for (const marker of [
    '<script src="game.js"></script>',
    '<script src="materials.js"></script>',
    '<script src="analytics.js"></script>',
    '<script data-novvy-analytics>',
    '<script data-novvy-audio-unlock>',
    'src="hud-left.webp"',
    'src="app-icon.png"',
    'src="tail-ad-video.mp4"',
    'poster="poster.webp"',
    'window.__res=window.__res||{}',
  ]) {
    assert.check(shell.includes(marker), `package shell contains ${marker}`);
  }
  // The WebAudio unlock wraps the AudioContext constructor, so it must run
  // before every other head script — in particular before game.js, the first
  // script that could ever construct a context.
  const audioUnlockAt = shell.indexOf('<script data-novvy-audio-unlock>');
  const gameJsAt = shell.indexOf('<script src="game.js"></script>');
  assert.check(
    audioUnlockAt !== -1 && audioUnlockAt < gameJsAt,
    'audio unlock injects into <head> ahead of game.js',
  );
  for (const absent of ['data:video/mp4', 'data:image/jpeg', /window\.__zip\s*=\s*"[A-Za-z0-9+/=]+"/.source]) {
    if (absent.startsWith('data:')) assert.check(!shell.includes(absent), `package shell has no ${absent}`);
    else assert.check(!new RegExp(absent).test(shell), 'package shell has no inline engine zip');
  }
  const gameJs = fs.readFileSync(path.join(packageDir, 'game.js'), 'utf8');
  const materialsJs = fs.readFileSync(path.join(packageDir, 'materials.js'), 'utf8');
  assert.check(gameJs.startsWith('window.__zip="'), 'game.js embeds the engine zip');
  const gameRes = JSON.parse(/window\.__res=(\{[\s\S]*\});\s*$/.exec(gameJs)[1]);
  const materialsRes = JSON.parse(/Object\.assign\(window\.__res, (\{[\s\S]*\})\);\s*$/.exec(materialsJs)[1]);
  const gameKeys = new Set(Object.keys(gameRes));
  const materialKeys = new Set(Object.keys(materialsRes));
  for (const key of materialKeys) assert.check(!gameKeys.has(key), `partition is disjoint at ${key}`);
  assert.equal([...materialKeys].sort(), [...new Set(requestedMaterialsKeys())].sort(), 'materials.js carries exactly the requested variable keys');
  // Engine textures must stay inline: under file:// a sibling image taints
  // WebGL and texSubImage2D throws (Cocos error 16352).
  const templateJson = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'template.json'), 'utf8'));
  assert.check(
    (materialsRes[templateJson.background.assetPath] || '').startsWith('data:image/'),
    'background texture rides inline as a data URI',
  );
  assert.check(
    fs.readFileSync(path.join(packageDir, 'analytics.js'), 'utf8') === fs.readFileSync(VENDOR, 'utf8'),
    'analytics.js sibling byte-equals the vendored lib',
  );

  // --- package mode + DOM background layer ---
  await runRepack(workDir, 'package-bg', [...overlayArgs, '--analytics', VENDOR, '--package', 'true', '--materials', materialsPath, '--dom-bg-file', path.join(EXAMPLE, 'editable', 'source-images', 'new-game-background.png')]);
  const bgDir = path.join(workDir, 'package-bg');
  assert.equal(
    fs.readdirSync(bgDir).sort(),
    ['analytics.js', 'app-icon.png', 'background.webp', 'game.js', 'hud-left.webp', 'hud-right.webp', 'index.html', 'materials.js', 'poster.webp', 'tail-ad-video.mp4'],
    'DOM background mode adds exactly one sibling file',
  );
  const bgShell = fs.readFileSync(path.join(bgDir, 'index.html'), 'utf8');
  for (const marker of [
    '<div id="novvy-dom-bg"',
    '<style data-novvy-background>',
    '<script data-novvy-background>',
    'url("background.webp")',
  ]) {
    assert.check(bgShell.includes(marker), `DOM background shell contains ${marker}`);
  }

  // --- legacy mode (no new flags) ---
  await runRepack(workDir, 'legacy', overlayArgs);
  const legacyDir = path.join(workDir, 'legacy');
  assert.equal(fs.readdirSync(legacyDir), ['index.html'], 'legacy mode writes only index.html');
  const legacyHtml = fs.readFileSync(path.join(legacyDir, 'index.html'), 'utf8');
  for (const absent of ['<script src="game.js"></script>', '<script src="materials.js"></script>', '<script src="analytics.js"></script>', '<script data-novvy-analytics', 'data-novvy-analytics-lib']) {
    assert.check(!legacyHtml.includes(absent), `legacy shell has no ${absent}`);
  }
  assert.check(legacyHtml.includes('data:video/mp4'), 'legacy shell keeps the video inlined');

  // --- inline-lib mode (--analytics without --package) ---
  await runRepack(workDir, 'inline', [...overlayArgs, '--analytics', VENDOR]);
  const inlineDir = path.join(workDir, 'inline');
  assert.equal(fs.readdirSync(inlineDir), ['index.html'], 'inline-lib mode writes only index.html');
  const inlineHtml = fs.readFileSync(path.join(inlineDir, 'index.html'), 'utf8');
  assert.check(inlineHtml.includes('<script data-novvy-analytics-lib>'), 'inline-lib mode embeds the library');
  assert.check(inlineHtml.includes('data:video/mp4'), 'inline-lib mode keeps the video inlined');
}

async function shellFixity(workDir, assert) {
  // The fixed-shell property: two packs that differ ONLY in per-task UI copy
  // must produce a byte-identical index.html (the copy rides in materials.js).
  const materialsPath = path.join(workDir, 'materials-keys.json');
  fs.writeFileSync(materialsPath, JSON.stringify(requestedMaterialsKeys()));
  const uiPaths = {};
  for (const label of ['a', 'b']) {
    const uiPath = path.join(workDir, `ui-${label}.json`);
    fs.writeFileSync(uiPath, JSON.stringify({
      hud: { titleLine1: `TITLE ${label}`, titleLine2: `SUB ${label}`, ariaLabel: `aria ${label}` },
      intro: { ariaLabel: `intro ${label}` },
    }));
    uiPaths[label] = uiPath;
  }
  const common = ['--analytics', VENDOR, '--package', 'true', '--materials', materialsPath];
  await runRepack(workDir, 'fix-a', [...common, '--ui-config', uiPaths.a]);
  await runRepack(workDir, 'fix-b', [...common, '--ui-config', uiPaths.b]);
  const shellA = fs.readFileSync(path.join(workDir, 'fix-a', 'index.html'));
  const shellB = fs.readFileSync(path.join(workDir, 'fix-b', 'index.html'));
  assert.check(shellA.equals(shellB), `index.html is byte-identical across different task copy (${shellA.length} bytes)`);
  const materialsA = fs.readFileSync(path.join(workDir, 'fix-a', 'materials.js'), 'utf8');
  const materialsB = fs.readFileSync(path.join(workDir, 'fix-b', 'materials.js'), 'utf8');
  assert.check(materialsA !== materialsB, 'materials.js differs when the task copy differs');
  assert.check(materialsA.includes('TITLE a') && materialsB.includes('TITLE b'), 'each materials.js carries its own UI copy');
}

async function determinism(workDir, assert) {
  const materialsPath = path.join(workDir, 'materials-keys.json');
  fs.writeFileSync(materialsPath, JSON.stringify(requestedMaterialsKeys()));
  const common = ['--analytics', VENDOR, '--package', 'true', '--materials', materialsPath];
  await runRepack(workDir, 'det-a', common);
  await runRepack(workDir, 'det-b', common);
  const a = fs.readFileSync(path.join(workDir, 'det-a', 'game.js'));
  const b = fs.readFileSync(path.join(workDir, 'det-b', 'game.js'));
  assert.check(a.equals(b), `game.js is byte-stable across packs (${a.length} bytes)`);
}

function runAnalyticsSandbox(source, search) {
  const sandbox = {
    console: { info() {}, error() {}, warn() {}, log() {} },
    document: { addEventListener() {}, getElementById() { return null; } },
    location: { search: search || '' },
    navigator: { language: 'en-US', userAgent: 'sandbox' },
    screen: { width: 390, height: 844, colorDepth: 24 },
    setInterval() { return 0; },
    clearInterval() {},
    setTimeout() { return 0; },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.addEventListener = function () {};
  sandbox.removeEventListener = function () {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'analytics.js' });
  return sandbox;
}

async function analyticsLibrary(assert) {
  await execFile('node', ['--check', VENDOR]);
  assert.check(true, 'vendor analytics.js passes node --check');
  await execFile('node', ['--check', path.join(PLUGIN, 'overlays', 'analytics', 'boot.js')]);
  assert.check(true, 'analytics boot.js passes node --check');
  await execFile('node', ['--check', path.join(PLUGIN, 'overlays', 'intro', 'intro.js')]);
  assert.check(true, 'intro overlay js passes node --check');
  await execFile('node', ['--check', path.join(PLUGIN, 'overlays', 'audio', 'audio.js')]);
  assert.check(true, 'audio unlock overlay js passes node --check');
  await execFile('node', ['--check', path.join(PLUGIN, 'overlays', 'cta', 'cta.js')]);
  assert.check(true, 'cta overlay js passes node --check');

  const source = fs.readFileSync(VENDOR, 'utf8');
  const debug = runAnalyticsSandbox(source, '?novvy-analytics-debug=1');
  assert.equal(debug.__novvyEventLog?.[0]?.event, 'creative_visible', 'debug log opens with creative_visible (bridge=0 activates at once)');
  assert.equal(typeof debug.NovvyAnalytics.track, 'function', 'NovvyAnalytics.track exposed');
  debug.NovvyAnalytics.track('game_start', { template: 'colorever_gem_array_v1' });
  assert.equal(debug.__novvyEventLog.length, 2, 'accepted track appends to the debug log');
  assert.equal(debug.__novvyEventLog[1].event, 'game_start', 'game_start mirrored');
  assert.equal(debug.NovvyAnalytics.track('Bad-Name', {}), false, 'malformed event name rejected');
  assert.equal(debug.__novvyEventLog.length, 2, 'rejected event does not reach the log');
  assert.equal(typeof debug.NovvyAnalytics.click, 'function', 'NovvyAnalytics.click exposed');
  assert.equal(typeof debug.NovvyAnalytics.registerMedia, 'function', 'NovvyAnalytics.registerMedia exposed');

  const quiet = runAnalyticsSandbox(source, '');
  assert.equal(quiet.__novvyEventLog, undefined, 'no debug log without the debug flag');
  assert.check(quiet.NovvyAnalytics.track('game_start', {}) === false, 'without transport track reports false');
}

function makeEventBus() {
  const map = new Map();
  return {
    addEventListener(type, fn) {
      if (!map.has(type)) map.set(type, []);
      map.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = map.get(type) || [];
      const at = list.indexOf(fn);
      if (at >= 0) list.splice(at, 1);
    },
    dispatch(type, detail) {
      for (const fn of (map.get(type) || []).slice()) fn({ detail });
    },
    count(type) {
      return (map.get(type) || []).length;
    },
  };
}

function makeVideoStub() {
  const bus = makeEventBus();
  return {
    muted: true,
    ended: false,
    currentTime: 0,
    duration: 12,
    error: null,
    addEventListener: bus.addEventListener,
    fire(type) { bus.dispatch(type, undefined); },
    bus,
  };
}

// The water-sort boot listens on window/document and the intro video element;
// the test plays the shell's part: firing the media events and dispatching the
// novvy:* broadcasts the shell (game.js) and intro overlay would emit live.
function runWsFunnelSandbox(vendorSource, bootSource, withIntroVideo) {
  const windowBus = makeEventBus();
  const documentBus = makeEventBus();
  const video = makeVideoStub();
  const sandbox = {
    console: { info() {}, error() {}, warn() {}, log() {} },
    document: {
      getElementById(id) {
        if (id === 'novvy-intro-video') return withIntroVideo ? video : null;
        return null; // no #novvy-video-intro overlay → the video phase is over
      },
      addEventListener: documentBus.addEventListener,
      removeEventListener: documentBus.removeEventListener,
    },
    location: { search: '?novvy-analytics-debug=1' },
    navigator: { language: 'en-US', userAgent: 'sandbox' },
    screen: { width: 390, height: 844, colorDepth: 24 },
    setInterval() { return 0; },
    clearInterval() {},
    setTimeout() { return 0; },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.addEventListener = windowBus.addEventListener;
  sandbox.removeEventListener = windowBus.removeEventListener;
  vm.createContext(sandbox);
  vm.runInContext(vendorSource, sandbox, { filename: 'analytics.js' });
  vm.runInContext(bootSource, sandbox, { filename: 'ws-boot.js' });
  return {
    sandbox,
    video,
    dispatchShell(type, detail) { windowBus.dispatch(type, detail); },
    dispatchDocument(type, detail) { documentBus.dispatch(type, detail); },
    documentBus,
    windowBus,
  };
}

async function wsBootFunnel(assert) {
  const vendorSource = fs.readFileSync(VENDOR, 'utf8');
  const wsTemplate = path.join(ROOT, 'editor', 'plugins', 'water-sort');
  const bootPath = path.join(wsTemplate, 'overlays', 'analytics', 'boot.js');
  await execFile('node', ['--check', bootPath]);
  assert.check(true, 'water-sort analytics boot.js passes node --check');
  const bootSource = fs.readFileSync(bootPath, 'utf8');

  // --- full funnel with the intro video present ---
  const run = runWsFunnelSandbox(vendorSource, bootSource, true);
  const { sandbox, video } = run;
  const names = () => sandbox.__novvyEventLog.map((entry) => entry.event);

  // Spec §2 media funnel on the intro video element.
  video.fire('play');
  video.currentTime = 3.5;
  video.fire('timeupdate');
  video.currentTime = 6.5;
  video.fire('timeupdate');
  video.currentTime = 3.5; // a seek backwards must not re-emit a checkpoint
  video.fire('timeupdate');
  video.currentTime = 9.5;
  video.fire('timeupdate');
  video.fire('pause');
  video.ended = true;
  video.fire('ended');
  assert.check(names().includes('media_play'), 'media_play 已上报');
  assert.equal(names().filter((name) => name === 'media_progress').length, 3, 'media_progress 恰好三次(25/50/75,回退不重发)');
  const percents = sandbox.__novvyEventLog.filter((entry) => entry.event === 'media_progress').map((entry) => entry.params.percent);
  assert.equal(percents, ['25', '50', '75'], 'media_progress 依次为 25/50/75');
  assert.check(names().includes('media_pause') && names().includes('media_complete'), 'media_pause 与 media_complete 已上报');

  // Spec §3 transition, then Spec §4 gameplay signals from the shell.
  run.dispatchShell('novvy:intro-finished', { reason: 'video_ended', switch_seconds: 12 });
  run.dispatchShell('novvy:hud-progress', { percent: 0 }); // shell boot emit
  run.dispatchShell('novvy:hud-progress', { percent: 20 });
  run.dispatchShell('novvy:hud-progress', { percent: 20 }); // selection re-emit
  run.dispatchShell('novvy:hud-progress', { percent: 10 }); // undo dips
  run.dispatchShell('novvy:hud-progress', { percent: 40 });
  run.dispatchShell('novvy:victory');
  run.dispatchShell('novvy:victory'); // latch: one victory per session
  assert.equal(names()[0], 'creative_visible', '沙箱激活事件照旧打头');
  assert.equal(names(), [
    'creative_visible',
    'media_play',
    'media_progress',
    'media_progress',
    'media_progress',
    'media_pause',
    'media_complete',
    'playable_entry',
    'game_start',
    'puzzle_placement',
    'puzzle_placement',
    'victory',
  ], '全漏斗事件序列符合规范(两次真实推进,选择/回退/重启不计数)');
  const placement = sandbox.__novvyEventLog.filter((entry) => entry.event === 'puzzle_placement');
  assert.equal(placement.map((entry) => entry.params.step), ['1', '2'], 'placement.step 递增');
  assert.equal(placement.map((entry) => entry.params.progress), ['20', '40'], 'placement.progress 为原始归位百分比');
  assert.equal(sandbox.__novvyEventLog.find((entry) => entry.event === 'playable_entry').params.switch_seconds, '12', 'playable_entry 携带切入秒数');
  assert.equal(sandbox.__novvyEventLog.find((entry) => entry.event === 'victory').params.successCount, '2', 'victory 携带推进步数');

  // Spec §4 first_interaction: CTA taps are excluded, board taps count once.
  run.dispatchDocument('pointerdown', { target: { closest: () => true } }); // on the CTA card
  run.dispatchDocument('touchstart', { target: { closest: () => null } }); // board touch
  run.dispatchDocument('pointerdown', { target: { closest: () => null } }); // already counted
  assert.equal(sandbox.__novvyEventLog.filter((entry) => entry.event === 'first_interaction').length, 1, 'first_interaction 只记一次且跳过 CTA');

  // --- no video element (intro disabled): boot degrades, gameplay keeps working ---
  const bare = runWsFunnelSandbox(vendorSource, bootSource, false);
  bare.dispatchShell('novvy:hud-progress', { percent: 30 });
  bare.dispatchShell('novvy:hud-progress', { percent: 60 });
  assert.equal(bare.sandbox.__novvyEventLog.map((entry) => entry.event), ['creative_visible', 'game_start', 'puzzle_placement'], '无开场视频时 boot 不产生媒体事件,试玩漏斗照常');
}

export default async function run(assert) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analytics-pack-'));
  try {
    await modeMatrix(workDir, assert);
    await determinism(workDir, assert);
    await shellFixity(workDir, assert);
    await analyticsLibrary(assert);
    await wsBootFunnel(assert);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
