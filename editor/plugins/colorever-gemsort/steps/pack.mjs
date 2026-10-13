import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { run as spawnRun } from '../../../core/lib/exec.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';
import {
  INGEST_BEACON_HOST,
  enableTransparentCanvas,
  patchGlobalConfig,
  patchGuideConfig,
  pickGuideColors,
  routeStoreJumpThroughNovvyBridge,
  stripIngestTelemetry,
} from '../lib/meta-patch.mjs';
import { resolvePatternSource, ensurePatternRef } from './pattern.mjs';

export function prerequisites(config) {
  const uploads = [];
  const generated = ['background.webp', 'levels.json'];
  if (config?.hud?.enabled !== false) generated.push('hud-left.webp', 'hud-right.webp');
  if (config?.intro?.enabled !== false) {
    uploads.push('intro-video');
    generated.push('poster.webp', 'intro-video.mp4');
  }
  return { uploads, generated };
}

const TEXT_PLACEHOLDERS = [
  '__HUD_LEFT_DRAGON__',
  '__HUD_RIGHT_DRAGON__',
  '__PATTERN_REF__',
  '__NOVVY_INTRO_VIDEO__',
  '__NOVVY_INTRO_POSTER__',
  '__CTA_ICON__',
  '__HUD_TITLE_LINE1__',
  '__HUD_TITLE_LINE2__',
  '__HUD_ARIA_LABEL__',
  '__NOVVY_INTRO_ARIA__',
  '__NOVVY_BG_FILE__',
];

async function step(ctx) {
  const { template, config } = ctx;
  const generated = (name) => path.join(ctx.generatedDir, name);
  const prereqs = [generated('background.webp'), generated('levels.json')];
  if (config.hud.enabled) prereqs.push(generated('hud-left.webp'), generated('hud-right.webp'));
  if (config.intro.enabled) prereqs.push(ctx.uploads['intro-video'], generated('intro-video.mp4'), generated('poster.webp'));
  requireFiles(prereqs);

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'playable-pack-'));
  try {
    // 1. Copy the pristine template game into the workspace.
    const wsGame = path.join(workspace, 'game');
    fs.cpSync(path.join(ctx.templateRoot, 'game'), wsGame, { recursive: true });
    // Asset paths in template.json / levels.json are relative to the assets
    // unpack root (template.game.assetsRoot's basename, i.e. "assets").
    const wsAssets = path.join(wsGame, path.basename(template.game.assetsRoot));

    // 2. Apply the blurred background over the game_pic_bg sprite texture.
    fs.copyFileSync(generated('background.webp'), path.join(wsAssets, template.background.assetPath));

    // 3. Apply the level artifact to the workspace level JSONs (re-validating
    //    the Cocos contract so a bad artifact can never reach dist).
    const artifact = JSON.parse(fs.readFileSync(generated('levels.json'), 'utf8'));
    for (const levelPatch of artifact.levels) {
      const levelPath = path.join(wsAssets, levelPatch.assetPath);
      const packed = JSON.parse(fs.readFileSync(levelPath, 'utf8'));
      const asset = packed?.[5]?.[0];
      const level = asset?.[2];
      if (asset?.[1] !== levelPatch.name || !level?.layers) {
        throw new Error(`${levelPatch.name} 资产契约不符,拒绝写入`);
      }
      const boardLayer = level.layers.find((layer) => layer.name === 'Board');
      const gemsLayer = level.layers.find((layer) => layer.name === 'Gems');
      if (!boardLayer || !gemsLayer) {
        throw new Error(`${levelPatch.name} 缺少 Board/Gems 图层`);
      }
      for (let index = 0; index < levelPatch.boardData.length; index += 1) {
        if ((levelPatch.boardData[index] === 0) !== (levelPatch.gemsData[index] === 0)) {
          throw new Error(`${levelPatch.name} Board/Gems 占用不一致 (cell ${index})`);
        }
      }
      level.width = artifact.width;
      level.height = artifact.height;
      boardLayer.width = artifact.width;
      boardLayer.height = artifact.height;
      gemsLayer.width = artifact.width;
      gemsLayer.height = artifact.height;
      boardLayer.data = levelPatch.boardData;
      gemsLayer.data = levelPatch.gemsData;
      // Keep minified serialization — identical to the original tooling.
      fs.writeFileSync(levelPath, JSON.stringify(packed));
    }

    // 3.5 Meta-config patches (workspace copies only — templates stay
    //     pristine). GlobalConfig: the store-jump win fires after N
    //     net-correct placements (config.win.placements, 0 disables) — the
    //     game's only native switch is the progress percent, so derive it
    //     from the level artifact. GuideConfig: the hand-guide colors are
    //     hardcoded to 黄3/灰3, which generated patterns don't contain;
    //     rewire them to the board's two largest groups, and phases 5-6 are
    //     typed Close so the guide demonstrates exactly one from→to (lift
    //     patch 0 → park → place) before free play takes over.
    // win.placements: 0 disables the win; a positive integer is a fixed
    // net-correct-placement count; "patchSize" resolves to this level's
    // patch size (jump on the first patch — legacy); "complete" (template
    // default) resolves to ALL remaining misplaced cells so the percent
    // lands 1e-9 below 100% and the jump fires only on the FINAL move of
    // the guided solution, when the board completes.
    const activeCells = artifact.metrics.activeCells;
    const openingMatches = Number.isInteger(artifact.metrics.openingMatches)
      ? artifact.metrics.openingMatches
      : Math.round(artifact.metrics.openingCompletion * activeCells);
    const rawPlacements = config.win?.placements;
    let winPlacements;
    if (rawPlacements === 'complete') {
      winPlacements = activeCells - openingMatches;
      if (winPlacements <= 0) {
        throw new Error(`开局已无错位格可放置(openingMatches ${openingMatches} ≥ activeCells ${activeCells}),complete 胜利条件不可配置`);
      }
    } else if (rawPlacements === 'patchSize' || rawPlacements === 'patch') {
      winPlacements = Number.isInteger(artifact.metrics.patchSize) ? artifact.metrics.patchSize : 5;
    } else {
      winPlacements = Number(rawPlacements ?? 0) || 0;
    }
    const globalPath = path.join(wsAssets, template.meta.globalConfigAssetPath);
    const globalPacked = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
    const globalPatch = patchGlobalConfig(globalPacked, { placements: winPlacements, openingMatches, activeCells });
    fs.writeFileSync(globalPath, JSON.stringify(globalPacked));

    const guidePath = path.join(wsAssets, template.meta.guideConfigAssetPath);
    const guidePacked = JSON.parse(fs.readFileSync(guidePath, 'utf8'));
    let guideColors = null;
    const packWarnings = [];
    try {
      const patchColors = artifact.metrics.moveCyclePatchColors;
      guideColors = pickGuideColors({
        colorCounts: artifact.metrics.colorCounts,
        colorNames: artifact.tileNames,
        // Cycle order: color shown on patch 0 = patchColors[1] (park it),
        // color shown on the last patch = patchColors[0] (place onto the
        // freshly freed patch 0).
        preferredParkTile: Array.isArray(patchColors) ? patchColors[1] : undefined,
        preferredPlaceTile: Array.isArray(patchColors) ? patchColors[0] : undefined,
      });
      patchGuideConfig(guidePacked, { park: guideColors.park, place: guideColors.place });
      fs.writeFileSync(guidePath, JSON.stringify(guidePacked));
    } catch (error) {
      packWarnings.push(`引导配色未打补丁: ${error.message}`);
    }

    // 3.6 Strip leftover AI-dev telemetry from the workspace bundle copy: the
    //     template's built bundle_gemsort POSTs lift-cancel state to a
    //     dev-session-only local ingest server. Same policy as 3.5 — the
    //     pristine templates copy is never touched here.
    const bundlePath = path.join(wsAssets, 'assets', 'bundle_gemsort', 'index.js');
    const stripped = stripIngestTelemetry(fs.readFileSync(bundlePath, 'utf8'));
    if (stripped.removed > 0) fs.writeFileSync(bundlePath, stripped.source);

    // 3.6b Route the template's store handoff through the Novvy bridge:
    //     the win/fail completion jump (and the baked overlay button) funnel
    //     into installForGame(), whose window.open is a silent no-op inside
    //     an SDK WebView. Prepending a window.novvy.open() branch makes the
    //     designed completion conversion work in the SDK while browser
    //     previews keep the original chain; see routeStoreJumpThroughNovvyBridge.
    const mainBundlePath = path.join(wsAssets, 'assets', 'main', 'index.js');
    const storeJumpPatch = routeStoreJumpThroughNovvyBridge(fs.readFileSync(mainBundlePath, 'utf8'));
    if (storeJumpPatch.patched > 0) fs.writeFileSync(mainBundlePath, storeJumpPatch.source);

    // 3.7 Open the engine's transparent-canvas macro (cocos-js/cc.js, a zip
    //     entry — the patched bytes travel inside game.js). The background
    //     layer moves to the DOM (background.webp behind the canvas), which
    //     needs the GL context created with an alpha channel; the camera
    //     clear-color and GameBg-node runtime side lives in the background
    //     overlay.
    const ccPath = path.join(wsAssets, 'cocos-js', 'cc.js');
    fs.writeFileSync(ccPath, enableTransparentCanvas(fs.readFileSync(ccPath, 'utf8')).source);

    // 4. Stage overlays and clear the text placeholders. Package mode ships
    //    the shell byte-identical across tasks, so the per-task copy travels
    //    in materials.js (window.__NOVVY_UI__) and the overlay scripts fill
    //    it at boot; the inlined DOM only carries empty slots. fill-overlays
    //    still runs so no placeholder token survives into the output.
    const wsOverlays = path.join(workspace, 'overlays');
    fs.cpSync(path.join(ctx.pluginDir, 'overlays'), wsOverlays, { recursive: true });
    await spawnRun('node', [
      path.join(ctx.scriptsRoot, 'fill-overlays.mjs'),
      '--overlays-root', wsOverlays,
      '--hud-title-line1', '',
      '--hud-title-line2', '',
      '--hud-aria', '',
      '--intro-aria', '',
    ]);
    // HUD training-bar pacing (FALLBACK): the bar prefers the board model's
    // real getCorrectFillRatio() at runtime (hud.js scene scan); these paced
    // values stand in until that scan succeeds. The hooked placement audio
    // (Gem_othregion_place) fires once per BOARD placement — move-cycle
    // solutions place K patches (cache parks play Gem_store_place, never
    // hooked) — so pacing 10..100 over K placements ends on 100 like the real
    // metric does. Grouped fallbacks have no patch count and keep the legacy
    // +15 step.
    const HUD_BAR_START = 10;
    const hudPlacements = Number.isInteger(artifact.metrics.movePatchCount) && artifact.metrics.movePatchCount > 0
      ? artifact.metrics.movePatchCount
      : null;
    const hudStep = hudPlacements
      ? Math.round(((100 - HUD_BAR_START) / hudPlacements) * 10) / 10
      : undefined;
    const uiConfigPath = path.join(workspace, 'ui-config.json');
    fs.writeFileSync(uiConfigPath, JSON.stringify({
      hud: {
        titleLine1: config.hud.titleLine1,
        titleLine2: config.hud.titleLine2,
        ariaLabel: config.hud.ariaLabel,
        progressStart: HUD_BAR_START,
        ...(hudStep != null ? { progressStep: hudStep } : {}),
      },
      intro: { ariaLabel: config.intro.ariaLabel },
    }, null, 2));

    // 4.5 Package partition: the per-task variable resource keys (background
    //     texture + its import descriptors, regenerated levels, derived meta
    //     configs) move to materials.js so game.js stays byte-stable across
    //     tasks. Import descriptors are derived from the texture uuid and only
    //     included when the asset manifest actually carries them.
    const assetManifest = JSON.parse(fs.readFileSync(path.join(ctx.templateRoot, 'game', 'asset-manifest.json'), 'utf8'));
    const materialsKeys = new Set();
    materialsKeys.add(template.background.assetPath);
    const bgImportBase = template.background.assetPath.replace('/native/', '/import/').replace(/\.png$/, '');
    for (const candidate of [`${bgImportBase}.json`, `${bgImportBase}@f9941.json`]) {
      if (candidate in assetManifest) materialsKeys.add(candidate);
    }
    materialsKeys.add(template.meta.globalConfigAssetPath);
    materialsKeys.add(template.meta.guideConfigAssetPath);
    for (const levelPatch of artifact.levels) materialsKeys.add(levelPatch.assetPath);
    const materialsKeysPath = path.join(workspace, 'materials-keys.json');
    fs.writeFileSync(materialsKeysPath, JSON.stringify([...materialsKeys], null, 2));
    // NOTE: the background texture must stay INLINE as a data URI. Under the
    // file:// delivery mode a sibling image file is treated as cross-origin
    // when the engine uploads it into WebGL (texSubImage2D SecurityError,
    // Cocos error 16352) — DOM-level media (<img>/poster) is unaffected, but
    // anything consumed by the engine has to ride in materials.js.

    // 5. Repack. Overlay groups are toggled off by withholding their file
    //    flags — the ported repack skips injection exactly like the original
    //    existsSync guards did. Package mode is always on: it emits the spec
    //    multi-file layout (game.js/materials.js/analytics.js + media files)
    //    instead of the legacy single-file inline document.
    const repackArgs = [
      path.join(ctx.pluginScriptsDir, 'repack.mjs'),
      '--game', path.join(ctx.templateRoot, 'game'),
      '--assets-root', path.join(wsGame, 'assets'),
      '--overlays-root', wsOverlays,
      '--out', path.join(ctx.resultDir, 'index.html'),
      '--analytics', path.join(ctx.scriptsRoot, '..', 'vendor', 'analytics.js'),
      '--package', 'true',
      '--materials', materialsKeysPath,
      '--ui-config', uiConfigPath,
      '--dom-bg-file', generated('background.webp'),
    ];
    const hudPackaged = config.hud.enabled;
    if (hudPackaged) {
      // 图案参照小照片与 HUD 头像同组进包;老项目没有这个产物时,用与 pattern
      // 步骤相同的解析逻辑现算一份,避免打包前被迫重跑 pattern。
      const referencePath = generated('pattern-ref.webp');
      if (!fs.existsSync(referencePath)) {
        const { sourcePath } = await resolvePatternSource(ctx);
        await ensurePatternRef(ctx, sourcePath);
      }
      repackArgs.push('--hud-image-left', generated('hud-left.webp'));
      repackArgs.push('--hud-image-right', generated('hud-right.webp'));
      repackArgs.push('--pattern-ref', referencePath);
    }
    // The CTA overlay ships with the template (icon included); enabling it is
    // just passing the icon flag so repack's existsSync guard passes.
    const ctaOverlay = template.overlays && template.overlays.cta;
    const ctaPackaged = config.cta?.enabled !== false && Boolean(ctaOverlay);
    if (ctaPackaged) {
      repackArgs.push('--cta-icon', path.join(ctx.pluginDir, ctaOverlay, 'icon.png'));
    }
    if (config.intro.enabled) {
      // 打包发的是 intro 步骤转码出的 720p 产物(上传原片不进包)。
      repackArgs.push('--intro-video', generated('intro-video.mp4'));
      repackArgs.push('--intro-poster', generated('poster.webp'));
    }
    await spawnRun('node', repackArgs);

    // 6. Verify the packed output.
    const outputPath = path.join(ctx.resultDir, 'index.html');
    const output = fs.readFileSync(outputPath, 'utf8');
    const leftovers = TEXT_PLACEHOLDERS.filter((placeholder) => output.includes(placeholder));
    if (leftovers.length > 0) {
      throw new Error(`打包产物仍有未替换占位符: ${leftovers.join(', ')}`);
    }
    const readSibling = (name) => fs.readFileSync(path.join(ctx.resultDir, name), 'utf8');

    // 6.5 Package shape: the shell must delegate to the sibling scripts, and
    //     the inline zip/resource payloads must be gone from index.html.
    for (const tag of ['<script src="game.js"></script>', '<script src="materials.js"></script>', '<script src="analytics.js"></script>']) {
      if (!output.includes(tag)) throw new Error(`打包产物缺少 ${tag}`);
    }
    if (/window\.__zip\s*=\s*"[A-Za-z0-9+/=]+"/.test(output)) {
      throw new Error('打包产物仍内联引擎 zip,package 拆分未生效');
    }
    if (!output.includes('window.__res=window.__res||{}')) {
      throw new Error('打包产物 __res 字面量未改为 merge 语句');
    }
    const gameJs = readSibling('game.js');
    if (!gameJs.startsWith('window.__zip="')) throw new Error('game.js 缺少引擎 zip 载荷');
    const materialsJs = readSibling('materials.js');
    if (!materialsJs.includes('Object.assign(window.__res,')) throw new Error('materials.js 缺少可变资源合并语句');
    if (!materialsJs.includes(`data:${assetManifest[template.background.assetPath].mime}`)) throw new Error('materials.js 未内联背景纹理(file:// 下引擎纹理必须内联)');
    if (!materialsJs.includes('__NOVVY_UI__')) throw new Error('materials.js 缺少 UI 文案段,壳不再固定');
    const analyticsJs = readSibling('analytics.js');
    if (!analyticsJs.includes('window.NovvyAnalytics')) throw new Error('analytics.js 内容异常');

    const packageFiles = ['game.js', 'materials.js', 'analytics.js'];
    const requirePackageFile = (name) => {
      const filePath = path.join(ctx.resultDir, name);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        throw new Error(`打包产物缺少 ${name}`);
      }
      packageFiles.push(name);
    };
    const prunePackageFile = (name) => fs.rmSync(path.join(ctx.resultDir, name), { force: true });
    if (config.intro.enabled) {
      requirePackageFile('tail-ad-video.mp4');
      requirePackageFile('poster.webp');
    } else {
      prunePackageFile('tail-ad-video.mp4');
      prunePackageFile('poster.webp');
    }
    // 残留清理:poster/HUD 头像曾以 JPEG/PNG 外置,老 dist 升级打包时移除。
    prunePackageFile('poster.jpg');
    prunePackageFile('hud-left.png');
    prunePackageFile('hud-right.png');
    requirePackageFile('background.webp');
    // 残留清理:曾短暂外置过的背景文件不再是包成员,老 dist 升级打包时移除。
    prunePackageFile('background.png');
    if (ctaPackaged) requirePackageFile('app-icon.png');
    else prunePackageFile('app-icon.png');
    if (hudPackaged) {
      requirePackageFile('hud-left.webp');
      requirePackageFile('hud-right.webp');
      requirePackageFile('pattern-ref.webp');
    } else {
      prunePackageFile('hud-left.webp');
      prunePackageFile('hud-right.webp');
      prunePackageFile('pattern-ref.webp');
    }
    // 残留清理:HUD 头像曾以 PNG 外置,老 dist 升级打包时移除。
    prunePackageFile('hud-left.png');
    prunePackageFile('hud-right.png');

    // The win percent must survive into the packed variable resources — proves
    // repack actually read the patched workspace copies, not stale sources.
    if (winPlacements > 0 && !materialsJs.includes(JSON.stringify(globalPatch.percent))) {
      throw new Error('打包产物缺少获胜进度值,meta 补丁未生效');
    }
    // Same idea for the telemetry strip: the beacon must not survive packing.
    if (output.includes(INGEST_BEACON_HOST) || gameJs.includes(INGEST_BEACON_HOST) || materialsJs.includes(INGEST_BEACON_HOST)) {
      throw new Error('打包产物仍含 127.0.0.1:7243 埋点,strip 未生效');
    }
    const dataUriCount = (output.match(/data:/g) || []).length;
    return {
      metrics: {
        outputBytes: Buffer.byteLength(output),
        dataUriCount,
        analyticsEnabled: true,
        packageFiles,
        hudEnabled: config.hud.enabled,
        ctaEnabled: ctaPackaged,
        introEnabled: config.intro.enabled,
        levelsApplied: artifact.levels.map((level) => level.name),
        winPlacements,
        winTargetPercent: Number(globalPatch.percent.toFixed(4)),
        winOpeningMatches: openingMatches,
        winActiveCells: activeCells,
        guideColors: guideColors ? { park: guideColors.park, place: guideColors.place } : null,
      },
      warnings: packWarnings,
    };
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

export { step as run };
