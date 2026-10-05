import fs from 'node:fs';
import path from 'node:path';
import { run as spawnRun, probeImage } from '../../../core/lib/exec.mjs';

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
    await spawnRun('python3', [
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
export async function ensurePatternRef(ctx, sourcePath) {
  const outPath = path.join(ctx.generatedDir, 'pattern-ref.webp');
  await spawnRun('python3', [
    path.join(ctx.scriptsRoot, 'crop-image.py'),
    '--source', sourcePath,
    '--out', outPath,
    '--trim-dark', '18',
    '--max-side', '480',
    '--quality', '78',
  ]);
  return outPath;
}

export function prerequisites(config) {
  if (config?.patternSource === 'upload') return { uploads: ['pattern-source'], generated: [] };
  const side = config?.patternSource === 'left' ? 'left' : 'right';
  return { uploads: [], generated: [`hud-${side}.png`] };
}

async function step(ctx) {
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
    path.join(ctx.pluginScriptsDir, useAi ? 'ai-image-to-pattern.py' : 'image-to-pattern.py'),
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
  await spawnRun('python3', patternArgs, useAi ? { timeoutMs: 30 * 60_000 } : {});
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

export { step as run };
