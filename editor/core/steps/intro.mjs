import fs from 'node:fs';
import path from 'node:path';
import { run as spawnRun, probeVideo, isJpeg } from '../lib/exec.mjs';
import { requireFiles } from '../lib/helpers.mjs';

// 统一启用约定：config.<step>.enabled === false ⇒ 跳过（替代旧 per-workbench 包装函数）。
export function prerequisites(config) {
  return {
    uploads: config?.intro?.enabled === false ? [] : ['intro-video'],
    generated: config?.intro?.enabled === false ? [] : ['intro-video.mp4'],
  };
}

async function step(ctx) {
  if (ctx.config.intro?.enabled === false) return { metrics: { skipped: true }, warnings: [] };
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
    await spawnRun('python3', ['-c', transcode, posterOverride, posterPath]);
    posterBytes = fs.statSync(posterPath).size;
  } else {
    await spawnRun('node', [
      path.join(ctx.scriptsRoot, 'make-poster.mjs'),
      '--video', videoPath,
      '--out', posterPath,
    ]);
    posterBytes = fs.statSync(posterPath).size;
  }

  const videoMetrics = await probeVideo(videoPath);
  // 打包视频统一转码(540p H.264 码率封顶,见 transcode-video.mjs):上传原片
  // 是剪辑近无损档位(11–12 Mbps),原样进包会把 zip 撑爆;pack 只发这个产物。
  const packagedPath = path.join(ctx.generatedDir, 'intro-video.mp4');
  await spawnRun('node', [
    path.join(ctx.scriptsRoot, 'transcode-video.mjs'),
    '--video', videoPath,
    '--out', packagedPath,
  ]);
  const packaged = await probeVideo(packagedPath);
  const metrics = {
    ...videoMetrics,
    videoBytes: fs.statSync(videoPath).size,
    videoPackagedBytes: fs.statSync(packagedPath).size,
    packagedWidth: packaged.videoWidth,
    packagedHeight: packaged.videoHeight,
    posterBytes,
    posterOverridden,
  };
  const warnings = [];
  if (videoMetrics.durationSec > 0 && videoMetrics.durationSec < 6) {
    warnings.push(`片头只有 ${videoMetrics.durationSec.toFixed(1)} 秒,约定节奏是 6–8 秒`);
  }
  return { metrics, warnings };
}

export { step as run };
