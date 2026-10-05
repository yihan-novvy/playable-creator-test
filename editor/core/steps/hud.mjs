import fs from 'node:fs';
import path from 'node:path';
import { run as spawnRun, probeImage } from '../lib/exec.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

// Per side: pick a source image (the poster, or an uploaded one). The FULL
// image is the portrait by default; an optional crop rect (config.hudCrop)
// cuts it down. Everything is produced HERE so 重新运行 always reflects the
// current source + crop, and an uncropped source passes through
// byte-for-byte (no re-encode).
const HUD_SIDES = [
  { side: 'left', label: '左立绘' },
  { side: 'right', label: '右立绘' },
];

async function step(ctx) {
  if (ctx.config.hud?.enabled === false) return { metrics: { skipped: true }, warnings: [] };
  const recolor = ctx.config.recolorPortraits === true;
  const plan = [];
  for (const { side, label } of HUD_SIDES) {
    const source = ctx.config.hudImageSource?.[side];
    const outPath = path.join(ctx.generatedDir, `hud-${side}.webp`);
    if (source === 'upload') {
      const sourcePath = ctx.uploads[`portrait-src-${side}`];
      if (!fs.existsSync(sourcePath)) {
        if (ctx.hudOptionalPortraits) {
          fs.rmSync(outPath, { force: true });
          continue;
        }
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
    await spawnRun('python3', cropArgs);
  }

  if (recolor && plan.length === 2) {
    const hudLeft = path.join(ctx.generatedDir, 'hud-left.webp');
    const hudRight = path.join(ctx.generatedDir, 'hud-right.webp');
    await spawnRun('python3', [
      path.join(ctx.scriptsRoot, 'recolor-portraits.py'),
      '--left', hudLeft,
      '--right', hudRight,
      '--out-left', hudLeft,
      '--out-right', hudRight,
    ]);
  }

  // Outputs may be true PNGs (crop/recolor paths) or byte-copied sources that
  // are JPEG-in-.png like the example's shipped portraits — ffprobe reads both.
  const warnings = [];
  const metrics = { recolorApplied: recolor && plan.length === 2 };
  for (const item of plan) {
    const dims = await probeImage(item.outPath);
    const name = item.label;
    metrics[item.side] = { ...dims, source: item.source, cropped: item.cropped === true };
    metrics[`${item.side}Bytes`] = fs.statSync(item.outPath).size;
    const aspect = dims.width / dims.height;
    if (aspect < 0.75 || aspect > 1.33) {
      warnings.push(`${name}宽高比 ${aspect.toFixed(2)} 偏离正方形,HUD 头像按 1:1 圆形裁切显示`);
    }
    if (Math.min(dims.width, dims.height) < 200) {
      warnings.push(`${name}分辨率 ${dims.width}x${dims.height} 偏小,建议 ≥200px`);
    }
  }
  return { metrics: { ...metrics, ...(plan.length === 0 ? { skipped: true } : {}) }, warnings };
}

export { step as run };
