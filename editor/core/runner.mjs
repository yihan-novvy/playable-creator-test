import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { run, probeVideo, probeImage, pngDimensions, isJpeg } from './lib/exec.mjs';
import { buildWsOverlayInjection } from './lib/ws-overlays.mjs';
import {coloreverHtml,coloreverLevel} from './lib/colorever-new.mjs';
import { dragonHtml, dragonLevel } from './lib/dragon-cube.mjs';
import {
  computeWinTargetPercent,
  INGEST_BEACON_HOST,
  enableTransparentCanvas,
  patchGlobalConfig,
  patchGuideConfig,
  pickGuideColors,
  routeStoreJumpThroughNovvyBridge,
  stripIngestTelemetry,
} from './lib/meta-patch.mjs';

// Step orchestration. The runner is the only component that knows the
// per-step input/output contract; the editor server just dispatches step ids.
//
// Principles:
// - src/templates is READ-ONLY: pack copies it into an mkdtemp workspace and
//   applies task resources there; the runner never writes under src/.
// - Each step writes only into project/<id>/generated/ (or dist/ for pack).
// - project.json is owned by the editor store; the runner returns StepResults
//   and never persists them itself.

export const STEP_IDS = Object.freeze(['intro', 'hud', 'background', 'pattern', 'levels', 'pack']);

export function loadTemplate(templateRoot) {
  return JSON.parse(fs.readFileSync(path.join(templateRoot, 'template.json'), 'utf8'));
}

// Steps are declared per template in template.json; the colorever list stays
// as the fallback for templates that don't declare any.
export function templateSteps(template) {
  const steps = template?.steps;
  if (Array.isArray(steps) && steps.length > 0 && steps.every((step) => typeof step === 'string')) {
    return Object.freeze([...steps]);
  }
  return STEP_IDS;
}

// Also used by the editor server's manual-pattern endpoints, which need the
// effective patternConfig without spinning up a full step run.
export function effectiveConfig(template, configPatch) {
  function deepMerge(base, over) {
    if (over === undefined || over === null) return structuredClone(base);
    if (typeof base !== 'object' || base === null || Array.isArray(base)) return structuredClone(over);
    const out = { ...base };
    for (const [key, value] of Object.entries(over)) {
      out[key] = key in base ? deepMerge(base[key], value) : structuredClone(value);
    }
    return out;
  }
  return deepMerge(template.defaults || {}, configPatch || {});
}

function requireFiles(files) {
  const missing = files.filter((file) => !fs.existsSync(file));
  if (missing.length > 0) {
    const error = new Error(`缺少前置文件: ${missing.map((file) => path.basename(file)).join(', ')}`);
    error.missing = missing;
    throw error;
  }
}

/* ------------------------------ step: intro ------------------------------ */

async function stepIntro(ctx) {
  const videoPath = ctx.uploads['intro-video'];
  requireFiles([videoPath]);
  // 封面统一落成 WebP(全屏占位帧,视觉无损,体积约为 JPEG 的一半)。
  const posterPath = path.join(ctx.generatedDir, 'poster.webp');
  const posterOverride = ctx.uploads['intro-poster'];

  let posterOverridden = false;
  let posterBytes = 0;
  if (fs.existsSync(posterOverride)) {
    posterOverridden = true;
    const bytes = fs.readFileSync(posterOverride);
    if (!isJpeg(bytes)) throw new Error('上传的 intro-poster 不是 JPEG 文件');
    const transcode = `
import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=80, method=6)
`;
    await run('python3', ['-c', transcode, posterOverride, posterPath]);
    posterBytes = fs.statSync(posterPath).size;
  } else {
    await run('node', [
      path.join(ctx.scriptsRoot, 'make-poster.mjs'),
      '--video', videoPath,
      '--out', posterPath,
    ]);
    posterBytes = fs.statSync(posterPath).size;
  }

  const videoMetrics = await probeVideo(videoPath);
  const metrics = {
    ...videoMetrics,
    videoBytes: fs.statSync(videoPath).size,
    posterBytes,
    posterOverridden,
  };
  const warnings = [];
  if (videoMetrics.durationSec > 0 && videoMetrics.durationSec < 6) {
    warnings.push(`片头只有 ${videoMetrics.durationSec.toFixed(1)} 秒,约定节奏是 6–8 秒`);
  }
  return { metrics, warnings };
}

/* ------------------------------- step: hud ------------------------------- */

// Per side: pick a source image (the poster, or an uploaded one). The FULL
// image is the portrait by default; an optional crop rect (config.hudCrop)
// cuts it down. Everything is produced HERE so 重新运行 always reflects the
// current source + crop, and an uncropped source passes through
// byte-for-byte (no re-encode).
const HUD_SIDES = [
  { side: 'left', label: '左立绘' },
  { side: 'right', label: '右立绘' },
];

async function stepHud(ctx) {
  const recolor = ctx.config.recolorPortraits === true;
  const plan = [];
  for (const { side, label } of HUD_SIDES) {
    const source = ctx.config.hudImageSource?.[side];
    const outPath = path.join(ctx.generatedDir, `hud-${side}.webp`);
    if (source === 'upload') {
      const sourcePath = ctx.uploads[`portrait-src-${side}`];
      if (!fs.existsSync(sourcePath)) {
        const error = new Error(`${label}选择了「上传图片」,但还没有上传;请先上传源图。`);
        error.missing = [sourcePath];
        throw error;
      }
      plan.push({ side, label, source, sourcePath, outPath });
    } else if (source === 'poster') {
      const posterPath = path.join(ctx.generatedDir, 'poster.webp');
      if (!fs.existsSync(posterPath)) {
        const error = new Error(`${label}选择了「海报」,但海报还没生成;请先运行「开场视频」步骤。`);
        error.missing = [posterPath];
        throw error;
      }
      plan.push({ side, label, source, sourcePath: posterPath, outPath });
    } else {
      const error = new Error(`${label}还没有选择来源:请先「从海报获取」或「上传图片」。`);
      error.missing = [];
      throw error;
    }
  }

  for (const item of plan) {
    const crop = ctx.config.hudCrop?.[item.side];
    // 无论是否配置裁剪框,一律经 crop-image.py 转码:限长边 320 + WebP q80,
    // 上传的大图在打包层就被压到显示所需的尺寸(否则无裁剪路径是字节复制,
    // 原始 PNG 会原样进包)。
    const cropArgs = [
      path.join(ctx.scriptsRoot, 'crop-image.py'),
      '--source', item.sourcePath,
      '--out', item.outPath,
      '--min-side', '200',
      '--max-side', '320',
      '--quality', '80',
    ];
    if (crop && Number(crop.width) > 0 && Number(crop.height) > 0) {
      cropArgs.push(
        '--x', String(Math.round(Number(crop.x))),
        '--y', String(Math.round(Number(crop.y))),
        '--width', String(Math.round(Number(crop.width))),
        '--height', String(Math.round(Number(crop.height))),
      );
      item.cropped = true;
    } else {
      item.cropped = false;
    }
    await run('python3', cropArgs);
  }

  if (recolor) {
    const hudLeft = path.join(ctx.generatedDir, 'hud-left.webp');
    const hudRight = path.join(ctx.generatedDir, 'hud-right.webp');
    await run('python3', [
      path.join(ctx.scriptsRoot, 'recolor-portraits.py'),
      '--left', hudLeft,
      '--right', hudRight,
      '--out-left', hudLeft,
      '--out-right', hudRight,
    ]);
  }

  // Outputs may be true PNGs (crop/recolor paths) or byte-copied sources that
  // are JPEG-in-.png like the example's shipped portraits — ffprobe reads both.
  const left = await probeImage(path.join(ctx.generatedDir, 'hud-left.webp'));
  const right = await probeImage(path.join(ctx.generatedDir, 'hud-right.webp'));
  const warnings = [];
  for (const [name, dims] of [['左立绘', left], ['右立绘', right]]) {
    const aspect = dims.width / dims.height;
    if (aspect < 0.75 || aspect > 1.33) {
      warnings.push(`${name}宽高比 ${aspect.toFixed(2)} 偏离正方形,HUD 头像按 1:1 圆形裁切显示`);
    }
    if (Math.min(dims.width, dims.height) < 200) {
      warnings.push(`${name}分辨率 ${dims.width}x${dims.height} 偏小,建议 ≥200px`);
    }
  }
  return {
    metrics: {
      left: { ...left, source: plan[0].source, cropped: plan[0].cropped === true },
      right: { ...right, source: plan[1].source, cropped: plan[1].cropped === true },
      recolorApplied: recolor,
      leftBytes: fs.statSync(path.join(ctx.generatedDir, 'hud-left.webp')).size,
      rightBytes: fs.statSync(path.join(ctx.generatedDir, 'hud-right.webp')).size,
    },
    warnings,
  };
}

/* --------------------------- step: background ---------------------------- */

async function stepBackground(ctx) {
  // The upload is optional: without it the theme background is derived from
  // the poster (video first frame or uploaded override), keeping the intro
  // and the game backdrop visually consistent.
  const hasUpload = fs.existsSync(ctx.uploads.background);
  const posterPath = path.join(ctx.generatedDir, 'poster.webp');
  if (!hasUpload && !fs.existsSync(posterPath)) {
    const error = new Error('缺少前置文件: background.webp(或先运行「开场视频」生成 poster.webp)');
    error.missing = [ctx.uploads.background, posterPath];
    throw error;
  }
  const sourcePath = hasUpload ? ctx.uploads.background : posterPath;
  const outPath = path.join(ctx.generatedDir, 'background.webp');
  await run('node', [
    path.join(ctx.scriptsRoot, 'blur-background.mjs'),
    '--source', sourcePath,
    '--out', outPath,
    '--width', String(ctx.template.background.width),
    '--height', String(ctx.template.background.height),
    '--sigma', String(ctx.config.background.blurSigma),
  ]);
  const webp = fs.statSync(outPath);
  return {
    metrics: {
      source: hasUpload ? 'background-upload' : 'poster-fallback',
      sourceBytes: fs.statSync(sourcePath).size,
      outputBytes: webp.size,
      width: ctx.template.background.width,
      height: ctx.template.background.height,
      sigma: ctx.config.background.blurSigma,
    },
    warnings: hasUpload ? [] : ['未上传背景图,已用海报图计算模糊背景;上传 background.png 可覆盖。'],
  };
}

/* ---------------------------- step: pattern ------------------------------ */

// Resolve the pattern source image, applying the optional per-side pattern
// crop. Shared with the editor server's manual-pattern endpoints so both
// paths see exactly the same source picture.
export async function resolvePatternSource({ config, uploads, generatedDir, scriptsRoot }) {
  // Prefer the FULL source portrait over the final HUD portrait: the HUD
  // avatar usually carries a tight face crop (for the 1:1 circle display),
  // which would turn the board figure into a giant face. The board pattern
  // wants the full bust framing, so only fall back to hud-<side>.png when no
  // full upload exists (poster-derived portraits).
  const side = config.patternSource === 'upload' ? 'upload' : config.patternSource === 'left' ? 'left' : 'right';
  const fullSource = uploads[`portrait-src-${side}`];
  const hudPortrait = path.join(generatedDir, `hud-${side}.png`);
  let sourcePath = side === 'upload'
    ? uploads['pattern-source']
    : fullSource && fs.existsSync(fullSource) ? fullSource : hudPortrait;
  if (side === 'upload' && (!sourcePath || !fs.existsSync(sourcePath))) {
    throw new Error('请先在「珠子图案」上传图片,或切换回立绘来源。');
  }
  if (!fs.existsSync(sourcePath)) {
    const error = new Error(`还没有${side === 'left' ? '左' : '右'}立绘成品:请先运行「HUD 立绘」步骤。`);
    error.missing = [sourcePath];
    throw error;
  }
  // 图案独立裁剪(与 HUD 头像裁剪互不影响):config.patternCrop[side] 记录
  // 相对完整立绘的裁剪框,裁剪产物写入 generated/ 以便 重新运行 幂等复现。
  const crop = config.patternCrop?.[side];
  let cropped = false;
  if (crop && Number(crop.width) > 0 && Number(crop.height) > 0) {
    const croppedPath = path.join(generatedDir, `pattern-src-${side}.png`);
    await run('python3', [
      path.join(scriptsRoot, 'crop-image.py'),
      '--source', sourcePath,
      '--out', croppedPath,
      '--x', String(Math.round(Number(crop.x))),
      '--y', String(Math.round(Number(crop.y))),
      '--width', String(Math.round(Number(crop.width))),
      '--height', String(Math.round(Number(crop.height))),
      '--min-side', '200',
    ]);
    sourcePath = croppedPath;
    cropped = true;
  }
  return { sourcePath, side, cropped };
}

// The HUD overlay pins a small "this is what you're building" photo of the
// pattern source beside the board (hud.html's __PATTERN_REF__). The original
// picture reads instantly; the quantized board preview would just repeat what
// the board already shows. --trim-dark drops studio-black letterboxing so the
// figure fills the tiny frame. Shared by the pattern step and pack's legacy
// fallback so old projects pack without a pattern re-run.
async function ensurePatternRef(ctx, sourcePath) {
  const outPath = path.join(ctx.generatedDir, 'pattern-ref.webp');
  await run('python3', [
    path.join(ctx.scriptsRoot, 'crop-image.py'),
    '--source', sourcePath,
    '--out', outPath,
    '--trim-dark', '18',
    '--max-side', '480',
    '--quality', '78',
  ]);
  return outPath;
}

async function stepPattern(ctx) {
  const { sourcePath, cropped } = await resolvePatternSource(ctx);
  const referencePath = await ensurePatternRef(ctx, sourcePath);
  const patternPath = path.join(ctx.generatedDir, 'pattern.json');
  const previewPath = path.join(ctx.generatedDir, 'pattern-preview.png');
  const pc = ctx.config.patternConfig;
  // engine 'ai': the vision LLM draws the mask (ai-image-to-pattern.py),
  // colors are still sampled from the portrait deterministically. Default
  // engine keeps the brightness-threshold script for dragon-style sources.
  const useAi = ctx.engine === 'ai';
  if (useAi && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('AI 创建未配置模型凭据:请在项目根目录 .env 配置 ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN(或 ANTHROPIC_API_KEY)及 ANTHROPIC_MODEL,然后重启 editor。');
  }
  const patternArgs = [
    path.join(ctx.scriptsRoot, useAi ? 'ai-image-to-pattern.py' : 'image-to-pattern.py'),
    '--source', sourcePath,
    '--template-json', path.join(ctx.templateRoot, 'template.json'),
    '--out', patternPath,
    '--preview', previewPath,
    '--width', String(pc.width),
    '--height', String(pc.height),
  ];
  if (!useAi) {
    patternArgs.push(
      '--brightness-threshold', String(pc.brightnessThreshold),
      '--min-coverage', String(pc.minCoverage),
    );
  }
  patternArgs.push(
    '--prune-floor', String(pc.pruneFloor),
    '--smoothing-passes', String(pc.smoothingPasses),
  );
  if (useAi && pc.aiModel) {
    patternArgs.push('--model', String(pc.aiModel));
  }
  // Optional per-task palette restriction (comma-separated tile IDs or an
  // array from project.json). Empty → the template's default allowedTiles.
  const allowedTiles = Array.isArray(pc.allowedTiles)
    ? pc.allowedTiles
    : String(pc.allowedTiles || '')
        .split(',')
        .map((tile) => tile.trim())
        .filter(Boolean);
  if (allowedTiles.length > 0) {
    patternArgs.push('--allowed-tiles', allowedTiles.join(','));
  }
  // AI 引擎要跑多次 LLM 调用,给比默认 10 分钟更宽的超时。
  await run('python3', patternArgs, useAi ? { timeoutMs: 30 * 60_000 } : {});
  const pattern = JSON.parse(fs.readFileSync(patternPath, 'utf8'));
  const colorCounts = pattern.colorCounts || {};
  const filledCells = Object.values(colorCounts).reduce((sum, count) => sum + count, 0);
  const totalCells = pattern.width * pattern.height;
  const reference = await probeImage(referencePath);
  return {
    metrics: {
      engine: useAi ? 'ai' : 'threshold',
      model: pattern.generator?.model,
      aiAttempts: pattern.generator?.attempts,
      maskFillRatio: pattern.generator?.maskFillRatio,
      width: pattern.width,
      height: pattern.height,
      filledCells,
      coverage: filledCells / totalCells,
      colorCount: Object.keys(colorCounts).length,
      colorCounts,
      colorNames: pattern.tileNames,
      sourcePortrait: path.basename(sourcePath),
      patternCropped: cropped,
      reference: { ...reference, bytes: fs.statSync(referencePath).size },
    },
    warnings: [],
  };
}

/* ----------------------------- step: levels ------------------------------ */

async function stepLevels(ctx) {
  const patternPath = path.join(ctx.generatedDir, 'pattern.json');
  const outPath = path.join(ctx.generatedDir, 'levels.json');
  requireFiles([patternPath]);
  await run('node', [
    path.join(ctx.scriptsRoot, 'write-levels.mjs'),
    '--pattern', patternPath,
    '--template-root', ctx.templateRoot,
    '--out', outPath,
  ]);
  const artifact = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const { metrics } = artifact;
  return {
    metrics: {
      width: artifact.width,
      height: artifact.height,
      activeCells: metrics.activeCells,
      openingCompletion: metrics.openingCompletion,
      componentCount: metrics.componentCount,
      largestComponent: metrics.largestComponent,
      singletonCount: metrics.singletonCount,
      shift: metrics.shift,
      scrambleMethod: metrics.scrambleMethod,
      certifiedMoveCount: metrics.certifiedMoveCount,
      movePatchCount: metrics.movePatchCount,
      patchSize: metrics.patchSize,
      moveCyclePatchColors: metrics.moveCyclePatchColors,
      seed: metrics.seed,
      colorCounts: metrics.colorCounts,
      colorNames: artifact.tileNames,
      levels: artifact.levels.map((level) => level.name),
    },
    warnings: artifact.warnings || [],
  };
}

/* ------------------------ steps: water-sort ------------------------------ */

// 关卡规则移植自 water-sort-puzzle/src/game.js(模板 game.js 的未打包源码),
// 校验与可解性判据必须和游戏本体完全一致,否则打包出的关卡可能玩不通。

function validateWaterSortLevel(level) {
  const capacity = level?.capacity;
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 6) {
    throw new Error(`capacity 必须是 2-6 的整数,收到 ${JSON.stringify(capacity ?? null)}`);
  }
  const colors = level?.colors;
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || Object.keys(colors).length === 0) {
    throw new Error('colors 必须是非空的颜色表(名称 → #RRGGBB)');
  }
  for (const [name, hex] of Object.entries(colors)) {
    if (!/^#[0-9a-f]{6}$/i.test(String(hex))) {
      throw new Error(`颜色 ${name} 的值必须是 #RRGGBB,收到 ${JSON.stringify(hex ?? null)}`);
    }
  }
  const bottles = level?.bottles;
  if (!Array.isArray(bottles) || bottles.length < 2 || bottles.length > 12) {
    throw new Error('bottles 必须是 2-12 个瓶子的数组(瓶内自下而上,空瓶为 [])');
  }
  const colorCounts = {};
  for (const [index, bottle] of bottles.entries()) {
    if (!Array.isArray(bottle)) throw new Error(`瓶子 ${index} 不是数组`);
    if (bottle.length > capacity) throw new Error(`瓶子 ${index} 有 ${bottle.length} 层,超过 capacity ${capacity}`);
    for (const color of bottle) {
      if (typeof color !== 'string' || !(color in colors)) {
        throw new Error(`瓶子 ${index} 含未定义的颜色: ${JSON.stringify(color ?? null)}`);
      }
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }
  for (const [name, count] of Object.entries(colorCounts)) {
    if (count % capacity !== 0) {
      throw new Error(`颜色 ${name} 共 ${count} 层,无法被 capacity ${capacity} 整除(倒不满一整瓶)`);
    }
  }
  return colorCounts;
}

// BFS 可解性(与 water-sort-puzzle/src/game.test.js 同一判据):穷尽全部状态
// 都没有胜利局面 → 不可解;超过状态/时间上限 → truncated(结构已合法,降级
// 为告警而不是拦打包)。
const SOLVE_MAX_STATES = 150_000;
const SOLVE_DEADLINE_MS = 2000;

function waterSortSolvability(level) {
  const { capacity, bottles } = level;
  const isWon = (state) =>
    state.every((bottle) => bottle.length === 0 || (bottle.length === capacity && bottle.every((color) => color === bottle[0])));
  const topRun = (bottle) => {
    const color = bottle[bottle.length - 1];
    let count = 0;
    for (let index = bottle.length - 1; index >= 0 && bottle[index] === color; index -= 1) count += 1;
    return { color, count };
  };
  const keyOf = (state) => state.map((bottle) => bottle.join(',')).sort().join('|');
  const start = bottles.map((bottle) => [...bottle]);
  if (isWon(start)) return { solvable: true, explored: 0, truncated: false };
  const seen = new Set([keyOf(start)]);
  let frontier = [start];
  const deadline = Date.now() + SOLVE_DEADLINE_MS;
  let explored = 0;
  while (frontier.length > 0) {
    const next = [];
    for (const state of frontier) {
      explored += 1;
      if (explored > SOLVE_MAX_STATES || Date.now() > deadline) {
        return { solvable: false, explored, truncated: true };
      }
      for (let from = 0; from < state.length; from += 1) {
        const source = state[from];
        if (source.length === 0) continue;
        const { color, count } = topRun(source);
        for (let to = 0; to < state.length; to += 1) {
          if (to === from) continue;
          const target = state[to];
          if (target.length >= capacity) continue;
          if (target.length > 0 && target[target.length - 1] !== color) continue;
          // 剪枝:把整瓶同色倒进空瓶不产生新局面(同构),只拖慢 BFS。
          if (target.length === 0 && count === source.length) continue;
          const moved = Math.min(count, capacity - target.length);
          const child = state.map((bottle, index) => {
            if (index === from) return bottle.slice(0, bottle.length - moved);
            if (index === to) return [...bottle, ...Array(moved).fill(color)];
            return bottle;
          });
          const key = keyOf(child);
          if (seen.has(key)) continue;
          seen.add(key);
          if (isWon(child)) return { solvable: true, explored: explored + 1, truncated: false };
          next.push(child);
        }
      }
    }
    frontier = next;
  }
  return { solvable: false, explored, truncated: false };
}

async function stepLevel(ctx) {
  const authored = ctx.config?.level;
  let level;
  let source;
  if (authored && typeof authored === 'object' && !Array.isArray(authored)) {
    level = structuredClone(authored);
    source = 'config';
  } else {
    // 未编辑过关卡:回落到模板自带关卡,创建后一键跑全流程就能出可玩包。
    const assetPath = ctx.template.level?.assetPath || 'level.json';
    level = JSON.parse(fs.readFileSync(path.join(ctx.templateRoot, assetPath), 'utf8'));
    source = 'template-default';
  }
  // 归一化:只保留游戏认识的键,作者多写的字段不进产物。
  const normalized = {
    ...(level.id !== undefined ? { id: String(level.id) } : {}),
    ...(level.name !== undefined ? { name: String(level.name) } : {}),
    capacity: level.capacity,
    colors: level.colors,
    bottles: level.bottles,
  };
  const colorCounts = validateWaterSortLevel(normalized);
  const solvability = waterSortSolvability(normalized);
  if (!solvability.truncated && !solvability.solvable) {
    throw new Error(`关卡不可解:BFS 穷尽 ${solvability.explored} 个状态也没有胜利局面,请调整瓶内颜色`);
  }
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(normalized, null, 2));
  const warnings = [];
  if (solvability.truncated) {
    warnings.push(`瓶状态空间超过上限(已探索 ${solvability.explored} 个),未完成可解性验证;结构校验已通过`);
  }
  return {
    metrics: {
      source,
      capacity: normalized.capacity,
      bottleCount: normalized.bottles.length,
      emptyBottles: normalized.bottles.filter((bottle) => bottle.length === 0).length,
      colorCount: Object.keys(normalized.colors).length,
      colorCounts,
      solvable: solvability.solvable,
      bfsStatesExplored: solvability.explored,
      truncated: solvability.truncated,
    },
    warnings,
  };
}

// 壳契约:game.js 以带 defer 的经典标签加载——经典(file:// 直开不被 CORS 拦),
// defer 保证 head 里执行时 body 已就绪;前面的内联关卡脚本仍先于它运行。
const WS_SHELL_SCRIPT_TAG = '<script src="game.js" defer></script>';

// water-sort 无 Cocos 引擎,但带 colorever 同款三组 overlay(HUD/开场视频/
// DOM 背景):pack = 模板基础包 + 内联关卡 + overlay 注入 + 媒体兄弟文件。
// 基础包没有任何运行时 fetch(file:// 直开是硬要求),关卡以
// window.__WATER_SORT_LEVEL__ 内联注入到 game.js 标签之前,而不是文件替换。
async function stepPackWaterSort(ctx) {
  const { config } = ctx;
  const levelPath = path.join(ctx.generatedDir, 'level.json');
  const posterPath = path.join(ctx.generatedDir, 'poster.webp');
  const backgroundPath = path.join(ctx.generatedDir, 'background.webp');
  const hudLeftPath = path.join(ctx.generatedDir, 'hud-left.webp');
  const hudRightPath = path.join(ctx.generatedDir, 'hud-right.webp');
  const introVideoPath = ctx.uploads['intro-video'];
  const hudEnabled = config.hud?.enabled !== false;
  const introEnabled = config.intro?.enabled !== false;
  // CTA 叠层(含胜利跳转/自动重开)默认开启;图标随模板交付,无任务前置产物。
  const ctaOverlayDir = ctx.template.overlays?.cta;
  const ctaIconPath = ctaOverlayDir ? path.join(ctx.templateRoot, ctaOverlayDir, 'icon.png') : null;
  const ctaEnabled = config.cta?.enabled !== false && Boolean(ctaIconPath && fs.existsSync(ctaIconPath));
  const prereqs = [levelPath, backgroundPath];
  if (hudEnabled) prereqs.push(hudLeftPath, hudRightPath);
  if (introEnabled) prereqs.push(introVideoPath, posterPath);
  requireFiles(prereqs);
  const levelText = fs.readFileSync(levelPath, 'utf8');
  // 作者可控字段(关卡名等)直接进内联脚本,必须防 </script> 与行分隔符逃逸。
  const levelJson = JSON.stringify(JSON.parse(levelText))
    .replaceAll('<', '\\u003c')
    .replaceAll('\\u2028', '\\\\u2028')
    .replaceAll('\\u2029', '\\\\u2029');
  const levelInjection = `<script>window.__WATER_SORT_LEVEL__=${levelJson};</script>`;

  const injection = buildWsOverlayInjection({
    templateRoot: ctx.templateRoot,
    template: ctx.template,
    config,
    media: {
      hudLeft: hudEnabled ? 'hud-left.webp' : null,
      hudRight: hudEnabled ? 'hud-right.webp' : null,
      introVideo: introEnabled ? 'tail-ad-video.mp4' : null,
      introPoster: introEnabled ? 'poster.webp' : null,
      background: 'background.webp',
      ctaIcon: ctaEnabled ? 'app-icon.png' : null,
    },
  });

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'water-sort-pack-'));
  try {
    // 1. 模板只读:拷进工作区再改(src/templates 永远不落笔)。
    const wsGame = path.join(workspace, 'game');
    fs.cpSync(path.join(ctx.templateRoot, 'game'), wsGame, { recursive: true });

    // 2. 媒体兄弟文件:DOM 级引用(<img>/<video>/CSS url)按平铺文件发布,
    //    与 colorever 的交付布局同名(tail-ad-video.mp4 沿用埋点素材名)。
    fs.copyFileSync(backgroundPath, path.join(wsGame, 'background.webp'));
    if (hudEnabled) {
      fs.copyFileSync(hudLeftPath, path.join(wsGame, 'hud-left.webp'));
      fs.copyFileSync(hudRightPath, path.join(wsGame, 'hud-right.webp'));
    }
    if (introEnabled) {
      fs.copyFileSync(introVideoPath, path.join(wsGame, 'tail-ad-video.mp4'));
      fs.copyFileSync(posterPath, path.join(wsGame, 'poster.webp'));
    }
    if (ctaEnabled) {
      // 图标与 colorever 交付布局同名(app-icon.png)。
      fs.copyFileSync(ctaIconPath, path.join(wsGame, 'app-icon.png'));
    }

    // 3. 壳契约 + 注入:game.js 必须以经典标签加载(file:// 直开);锚点必须
    //    恰好出现一次才允许 splice,注入后不允许残留任何占位符。
    const shellPath = path.join(wsGame, 'index.html');
    let shell = fs.readFileSync(shellPath, 'utf8');
    for (const anchor of ['</head>', '<body>', '</body>']) {
      const count = shell.split(anchor).length - 1;
      if (count !== 1) throw new Error(`模板壳锚点 ${anchor} 出现 ${count} 次,拒绝注入`);
    }
    if (!shell.includes(WS_SHELL_SCRIPT_TAG)) {
      throw new Error('模板壳缺少 game.js 的经典 script 标签,模板包可能已漂移');
    }
    if (ctaEnabled) {
      // CTA 层的三个壳依赖:隐藏目标(footer#hud 引导条 / #win 结算浮层)与
      // 自动重开的注入点(#reset → game.reset())。缺一即视为模板漂移,拒绝
      // 静默打出「引导文案仍在/胜利无跳转」的包。
      for (const anchor of ['<footer id="hud">', 'id="win"', 'id="reset"']) {
        if (!shell.includes(anchor)) throw new Error(`模板壳缺少 CTA 层依赖的锚点 ${anchor},模板包可能已漂移`);
      }
    }
    if (/type="module"|crossorigin/.test(shell)) throw new Error('模板壳仍含 module/crossorigin 属性,模板包可能已漂移');
    shell = shell
      .replace('</head>', `${[...injection.headStyles, ...injection.headScripts].join('\n')}\n</head>`)
      // __NOVVY_UI__/关卡注入放 game.js 标签之前:defer 脚本在文档解析完后
      // 才执行,经典内联脚本此时早已就位。
      .replace(WS_SHELL_SCRIPT_TAG, `${injection.uiScript}${levelInjection}${WS_SHELL_SCRIPT_TAG}`)
      .replace('</body>', `${injection.bodyScripts.join('\n')}\n</body>`);
    const bodyDom = injection.bodyDom.join('\n');
    if (bodyDom) shell = shell.replace('<body>', `<body>\n${bodyDom}`);
    fs.writeFileSync(shellPath, shell);

    // 4. 发布到 dist/。
    fs.rmSync(ctx.resultDir, { recursive: true, force: true });
    fs.cpSync(wsGame, ctx.resultDir, { recursive: true });

    // 5. dist 形状校验:壳契约、注入 marker、占位符残留、媒体文件缺一不可。
    const distShell = fs.readFileSync(path.join(ctx.resultDir, 'index.html'), 'utf8');
    if (fs.statSync(path.join(ctx.resultDir, 'game.js')).size === 0) throw new Error('打包产物 game.js 为空');
    if (!distShell.includes(WS_SHELL_SCRIPT_TAG)) throw new Error('dist 壳缺少 game.js 的经典 script 标签');
    if (/type="module"|crossorigin/.test(distShell)) throw new Error('dist 壳仍含 module/crossorigin 属性');
    if (!distShell.includes(levelInjection)) throw new Error('dist 壳缺少关卡注入脚本');
    if (fs.existsSync(path.join(ctx.resultDir, 'level.json'))) throw new Error('dist 不应包含 level.json(关卡已改为内联注入)');
    if (!distShell.includes(injection.uiScript)) throw new Error('dist 壳缺少 __NOVVY_UI__ 注入脚本');
    if (injection.hudEnabled && !distShell.includes('id="novvy-training-hud"')) throw new Error('dist 壳缺少 HUD overlay');
    if (injection.introEnabled && !distShell.includes('id="novvy-video-intro"')) throw new Error('dist 壳缺少开场视频 overlay');
    if (injection.backgroundEnabled && !distShell.includes('id="novvy-dom-bg"')) throw new Error('dist 壳缺少 DOM 背景层');
    if (injection.ctaEnabled) {
      if (!distShell.includes('id="novvy-cta"')) throw new Error('dist 壳缺少 CTA overlay');
      if (!distShell.includes('data-novvy-ws-shell')) throw new Error('dist 壳缺少壳层收缩样式(引导 footer/胜利浮层应被隐藏)');
      if (fs.statSync(path.join(ctx.resultDir, 'app-icon.png')).size === 0) throw new Error('打包产物 app-icon.png 为空');
    }
    // 埋点组永远随包:库(head)+ boot(body 末尾)缺一即拒,视频接线
    // (registerMedia + tail_ad_video)必须显式在 boot 里,防止回退成空埋点包。
    if (injection.analyticsEnabled) {
      if (!distShell.includes('<script data-novvy-analytics-lib>')) throw new Error('dist 壳缺少埋点库(head 内联)');
      if (!distShell.includes('<script data-novvy-analytics>')) throw new Error('dist 壳缺少埋点 boot(body 末尾)');
      if (!distShell.includes('registerMedia') || !distShell.includes('tail_ad_video')) throw new Error('dist 壳缺少开场视频埋点接线');
    }
    // 占位符残留用精确 token 清单(正则会误伤 window.__NOVVY_UI__ 本身)。
    const residual = ['__HUD_LEFT_DRAGON__', '__HUD_RIGHT_DRAGON__', '__NOVVY_INTRO_VIDEO__', '__NOVVY_INTRO_POSTER__', '__NOVVY_INTRO_ARIA__', '__NOVVY_BG_FILE__', '__CTA_ICON__']
      .filter((token) => distShell.includes(token));
    if (residual.length > 0) throw new Error(`dist 壳残留占位符: ${residual.join(', ')}`);
    for (const name of ['background.webp']) {
      if (fs.statSync(path.join(ctx.resultDir, name)).size === 0) throw new Error(`打包产物 ${name} 为空`);
    }
    const packageFiles = fs.readdirSync(ctx.resultDir).sort();
    const outputBytes = packageFiles.reduce((sum, name) => sum + fs.statSync(path.join(ctx.resultDir, name)).size, 0);
    const packedLevel = JSON.parse(levelText);
    return {
      metrics: {
        outputBytes,
        packageFiles,
        overlays: { hud: injection.hudEnabled, intro: injection.introEnabled, background: injection.backgroundEnabled, cta: injection.ctaEnabled, analytics: injection.analyticsEnabled },
        capacity: packedLevel.capacity,
        bottleCount: packedLevel.bottles.length,
        colorCount: Object.keys(packedLevel.colors).length,
      },
      warnings: [],
    };
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

/* ------------------------------ step: pack ------------------------------- */

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

async function stepPack(ctx) {
  const { template, config } = ctx;
  const generated = (name) => path.join(ctx.generatedDir, name);
  const prereqs = [generated('background.webp'), generated('levels.json')];
  if (config.hud.enabled) prereqs.push(generated('hud-left.webp'), generated('hud-right.webp'));
  if (config.intro.enabled) prereqs.push(ctx.uploads['intro-video'], generated('poster.webp'));
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

    // 3.5 Meta-config patches (workspace copies only — src/templates stays
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
    //     pristine src/templates copy is never touched here.
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
    fs.cpSync(path.join(ctx.templateRoot, 'overlays'), wsOverlays, { recursive: true });
    await run('node', [
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
      path.join(ctx.scriptsRoot, 'repack.mjs'),
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
      repackArgs.push('--cta-icon', path.join(ctx.templateRoot, ctaOverlay, 'icon.png'));
    }
    if (config.intro.enabled) {
      repackArgs.push('--intro-video', ctx.uploads['intro-video']);
      repackArgs.push('--intro-poster', generated('poster.webp'));
    }
    await run('node', repackArgs);

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

/* ------------------------------ dispatch --------------------------------- */

const STEP_RUNNERS = {
  intro: stepIntro,
  hud: stepHud,
  background: stepBackground,
  pattern: stepPattern,
  levels: stepLevels,
  pack: stepPack,
};

// water-sort 声明自己的步骤集合(intro/hud/background/level/pack),前三步
// 与 colorever 共用同一实现;按 template.json 的 workbench 字段选表。
const WATER_SORT_STEP_RUNNERS = {
  intro: stepIntro,
  hud: stepHud,
  background: stepBackground,
  level: stepLevel,
  pack: stepPackWaterSort,
};

async function stepDragonIntro(ctx) {
  return ctx.config.intro?.enabled === true ? stepIntro(ctx) : { metrics: { skipped: true }, warnings: [] };
}

async function stepDragonHud(ctx) {
  return ctx.config.hud?.enabled === true ? stepHud(ctx) : { metrics: { skipped: true }, warnings: [] };
}

async function stepDragonBackground(ctx) {
  return ctx.config.background?.enabled === true ? stepBackground(ctx) : { metrics: { skipped: true }, warnings: [] };
}

async function stepDragonLevel(ctx) {
  const level = dragonLevel(ctx.templateRoot, ctx.config.levelId);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  return { metrics: { levelId: level.Index, cells: level.Cells.length, boxes: level.Boxes.length, timeLimit: level.TimeLimit }, warnings: [] };
}

async function stepDragonPack(ctx) {
  const level = dragonLevel(ctx.templateRoot, ctx.config.levelId);
  const generatedLevel = path.join(ctx.generatedDir, 'level.json');
  requireFiles([generatedLevel]);
  if (JSON.stringify(JSON.parse(fs.readFileSync(generatedLevel, 'utf8'))) !== JSON.stringify(level)) throw new Error('关卡已更改，请重新运行关卡步骤');
  const enabled = {
    intro: ctx.config.intro?.enabled === true,
    hud: ctx.config.hud?.enabled === true,
    background: ctx.config.background?.enabled === true,
    cta: ctx.config.cta?.enabled !== false,
  };
  const media = {
    introVideo: enabled.intro ? 'tail-ad-video.mp4' : null,
    introPoster: enabled.intro ? 'poster.webp' : null,
    hudLeft: enabled.hud ? 'hud-left.webp' : null,
    hudRight: enabled.hud ? 'hud-right.webp' : null,
    background: enabled.background ? 'background.webp' : null,
    ctaIcon: enabled.cta ? 'app-icon.png' : null,
  };
  const needed = [];
  if (enabled.intro) needed.push(ctx.uploads['intro-video'], path.join(ctx.generatedDir, 'poster.webp'));
  if (enabled.hud) needed.push(path.join(ctx.generatedDir, 'hud-left.webp'), path.join(ctx.generatedDir, 'hud-right.webp'));
  if (enabled.background) needed.push(path.join(ctx.generatedDir, 'background.webp'));
  requireFiles(needed);
  const url = String(ctx.config.cta?.destinationUrl || '');
  if (url && !/^https?:\/\//i.test(url)) throw new Error('CTA 目标地址必须是 http(s) URL');
  const built = dragonHtml({ root: ctx.templateRoot, template: ctx.template, level, config: ctx.config, media });
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.cpSync(path.join(ctx.templateRoot, 'game'), ctx.resultDir, { recursive: true });
  // levelN.html 是基础包的无埋点/无 CTA 独立入口,配置的关卡只经 index.html
  // 注入;混进广告包会绕过任务配置,这里兜底删除(模板侧 sync 已不同步它们)。
  for (const file of fs.readdirSync(ctx.resultDir)) {
    if (/^level\d+\.html$/.test(file)) fs.rmSync(path.join(ctx.resultDir, file));
  }
  fs.writeFileSync(path.join(ctx.resultDir, 'index.html'), built.html);
  if (enabled.intro) {
    fs.copyFileSync(ctx.uploads['intro-video'], path.join(ctx.resultDir, 'tail-ad-video.mp4'));
    fs.copyFileSync(path.join(ctx.generatedDir, 'poster.webp'), path.join(ctx.resultDir, 'poster.webp'));
  }
  if (enabled.hud) {
    for (const side of ['left', 'right']) fs.copyFileSync(path.join(ctx.generatedDir, `hud-${side}.webp`), path.join(ctx.resultDir, `hud-${side}.webp`));
  }
  if (enabled.background) fs.copyFileSync(path.join(ctx.generatedDir, 'background.webp'), path.join(ctx.resultDir, 'background.webp'));
  if (enabled.cta) fs.copyFileSync(path.join(ctx.templateRoot, ctx.template.overlays.cta, 'icon.png'), path.join(ctx.resultDir, 'app-icon.png'));
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  for (const file of ['index.html', 'game.js', 'style.css']) if (!packageFiles.includes(file)) throw new Error(`DragonCube 打包缺少 ${file}`);
  const sizeOf = (entry) => fs.statSync(entry).isDirectory()
    ? fs.readdirSync(entry).reduce((sum, name) => sum + sizeOf(path.join(entry, name)), 0)
    : fs.statSync(entry).size;
  return { metrics: { levelId: level.Index, packageFiles, outputBytes: packageFiles.reduce((n, name) => n + sizeOf(path.join(ctx.resultDir, name)), 0), overlays: enabled }, warnings: [] };
}

const DRAGON_STEP_RUNNERS = {
  intro: stepDragonIntro,
  hud: stepDragonHud,
  background: stepDragonBackground,
  level: stepDragonLevel,
  pack: stepDragonPack,
};

async function stepColoreverNewLevel(ctx) {
  const {level,proof}=coloreverLevel(ctx.templateRoot,ctx.config);
  fs.writeFileSync(path.join(ctx.generatedDir,'level.json'),JSON.stringify(level));
  return {metrics:{name:level.name,width:level.width,height:level.height,cells:level.target.filter(Boolean).length,colors:new Set(level.target.filter(Boolean)).size,solutionMoves:proof.moves,solvable:true},warnings:[]};
}

async function stepColoreverNewPack(ctx) {
  const {level}=coloreverLevel(ctx.templateRoot,ctx.config);
  const generated=path.join(ctx.generatedDir,'level.json');requireFiles([generated]);
  if(JSON.stringify(JSON.parse(fs.readFileSync(generated,'utf8')))!==JSON.stringify(level))throw new Error('关卡已改变，请重新运行关卡步骤');
  const enabled={intro:ctx.config.intro?.enabled===true,hud:ctx.config.hud?.enabled===true,background:ctx.config.background?.enabled===true,cta:ctx.config.cta?.enabled===true};
  const files=[];
  if(enabled.intro)files.push([ctx.uploads['intro-video'],'tail-ad-video.mp4'],[path.join(ctx.generatedDir,'poster.webp'),'poster.webp']);
  if(enabled.hud)for(const side of ['left','right'])files.push([path.join(ctx.generatedDir,`hud-${side}.webp`),`hud-${side}.webp`]);
  if(enabled.background)files.push([path.join(ctx.generatedDir,'background.webp'),'background.webp']);
  if(enabled.cta)files.push([path.join(ctx.templateRoot,ctx.template.overlays.cta,'icon.png'),'app-icon.png']);
  requireFiles(files.map(([source])=>source));
  const built=coloreverHtml({root:ctx.templateRoot,template:ctx.template,level,config:ctx.config,media:{introVideo:enabled.intro?'tail-ad-video.mp4':null,introPoster:enabled.intro?'poster.webp':null,hudLeft:enabled.hud?'hud-left.webp':null,hudRight:enabled.hud?'hud-right.webp':null,background:enabled.background?'background.webp':null,ctaIcon:enabled.cta?'app-icon.png':null}});
  fs.rmSync(ctx.resultDir,{recursive:true,force:true});fs.mkdirSync(ctx.resultDir,{recursive:true});
  fs.copyFileSync(path.join(ctx.templateRoot,'game/game.js'),path.join(ctx.resultDir,'game.js'));
  fs.writeFileSync(path.join(ctx.resultDir,'index.html'),built.html);
  for(const [source,name]of files)fs.copyFileSync(source,path.join(ctx.resultDir,name));
  const packageFiles=fs.readdirSync(ctx.resultDir).sort();
  return {metrics:{packageFiles,outputBytes:packageFiles.reduce((n,name)=>n+fs.statSync(path.join(ctx.resultDir,name)).size,0),overlays:enabled,level:level.name},warnings:[]};
}

const COLOREVER_NEW_STEP_RUNNERS={intro:stepDragonIntro,hud:stepDragonHud,background:stepDragonBackground,level:stepColoreverNewLevel,pack:stepColoreverNewPack};

function stepRunners(template) {
  if (template?.workbench === 'colorever-new') return COLOREVER_NEW_STEP_RUNNERS;
  if (template?.workbench === 'water-sort') return WATER_SORT_STEP_RUNNERS;
  if (template?.workbench === 'dragon-cube') return DRAGON_STEP_RUNNERS;
  return STEP_RUNNERS;
}

// Predecessor generated files each step needs (used for the prereq gate and
// by the editor for staleness marking).
const STEP_PREREQ_GENERATED = {
  intro: [],
  // source-dependent (poster vs upload); the hud step itself gates precisely
  hud: [],
  // background.png upload is optional; the no-upload default path needs the
  // poster (an explicit upload replaces it as the blur source).
  background: ['poster.webp'],
  pattern: [],
  levels: ['pattern.json'],
  pack: ['background.webp', 'levels.json', 'poster.webp', 'hud-left.webp', 'hud-right.webp'],
};

const STEP_PREREQ_UPLOADS = {
  intro: ['intro-video'],
  hud: [],
  background: ['background'],
  pattern: [], // resolved from patternSource (left|right) at run time
  levels: [],
  pack: [],
};

export function stepPrerequisites(stepId, config, template) {
  if (['dragon-cube','colorever-new'].includes(template?.workbench)) {
    if (stepId === 'intro') return { uploads: config?.intro?.enabled === true ? ['intro-video'] : [], generated: [] };
    if (stepId === 'hud') return { uploads: [], generated: [] };
    if (stepId === 'background') return { uploads: [], generated: [] };
    if (stepId === 'level') return { uploads: [], generated: [] };
    const generated = ['level.json'];
    const uploads = [];
    if (config?.intro?.enabled === true) { uploads.push('intro-video'); generated.push('poster.webp'); }
    if (config?.hud?.enabled === true) generated.push('hud-left.webp', 'hud-right.webp');
    if (config?.background?.enabled === true) generated.push('background.webp');
    return { uploads, generated };
  }
  if (template?.workbench === 'water-sort') {
    if (stepId === 'intro') return { uploads: ['intro-video'], generated: [] };
    // hud 步对来源(海报/上传)的校验足够精确,这里保持宽松(与 colorever 同)。
    if (stepId === 'hud') return { uploads: [], generated: [] };
    // 背景默认由海报模糊,上传 background.png 可覆盖(可选)。
    if (stepId === 'background') return { uploads: [], generated: ['poster.webp'] };
    if (stepId === 'level') return { uploads: [], generated: [] };
    const generated = ['level.json', 'poster.webp', 'background.webp'];
    if (config?.hud?.enabled !== false) generated.push('hud-left.webp', 'hud-right.webp');
    const uploads = [];
    if (config?.intro?.enabled !== false) uploads.push('intro-video');
    return { uploads, generated };
  }
  if (stepId === 'pattern') {
    if (config?.patternSource === 'upload') return { uploads: ['pattern-source'], generated: [] };
    const side = config?.patternSource === 'left' ? 'left' : 'right';
    return { uploads: [], generated: [`hud-${side}.png`] };
  }
  if (stepId === 'pack') {
    const uploads = [];
    const generated = ['background.webp', 'levels.json'];
    if (config?.hud?.enabled !== false) generated.push('hud-left.png', 'hud-right.png');
    if (config?.intro?.enabled !== false) {
      uploads.push('intro-video');
      generated.push('poster.jpg');
    }
    return { uploads, generated };
  }
  return { uploads: [...(STEP_PREREQ_UPLOADS[stepId] || [])], generated: [...(STEP_PREREQ_GENERATED[stepId] || [])] };
}

export async function runStep({ taskId, templateRoot, scriptsRoot, projectRoot, resultRoot, stepId, config, engine }) {
  const startedAt = Date.now();
  const template = loadTemplate(templateRoot);
  const runners = stepRunners(template);
  if (!runners[stepId]) {
    throw new Error(`未知步骤: ${stepId}`);
  }
  const effective = effectiveConfig(template, config);

  const uploads = {};
  const uploadFileBySlot = {
    'intro-video': 'intro-video.mp4',
    'intro-poster': 'intro-poster.jpg',
    background: 'background.png',
    'portrait-src-left': 'portrait-src-left.png',
    'portrait-src-right': 'portrait-src-right.png',
    'pattern-source': 'pattern-source.png',
  };
  for (const [slot, filename] of Object.entries(uploadFileBySlot)) {
    uploads[slot] = path.join(projectRoot, 'uploads', filename);
  }

  const ctx = {
    taskId,
    stepId,
    template,
    config: effective,
    engine, // per-step variant, e.g. pattern 'ai' vs the default threshold script
    templateRoot,
    scriptsRoot,
    uploadsDir: path.join(projectRoot, 'uploads'),
    generatedDir: path.join(projectRoot, 'generated'),
    resultDir: resultRoot,
    uploads,
  };

  try {
    const { metrics, warnings } = await runners[stepId](ctx);
    return {
      stepId,
      ok: true,
      metrics,
      warnings,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      stepId,
      ok: false,
      metrics: null,
      warnings: [],
      error: error.message,
      missing: error.missing,
      durationMs: Date.now() - startedAt,
    };
  }
}

export async function runAll(options) {
  const steps = options.steps || templateSteps(loadTemplate(options.templateRoot));
  const results = [];
  for (const stepId of steps) {
    const result = await runStep({ ...options, stepId });
    results.push(result);
    if (!result.ok) break;
  }
  return results;
}
