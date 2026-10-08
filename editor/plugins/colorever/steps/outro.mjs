import fs from 'node:fs';
import path from 'node:path';
import { probeVideo, run as spawnRun } from '../../../core/lib/exec.mjs';

// 统一启用约定：config.<step>.enabled === false ⇒ 跳过（替代旧 per-workbench 包装函数）。
export function prerequisites(config) {
  return {
    uploads: config?.outro?.enabled !== true ? [] : ['outro-video'],
    generated: config?.outro?.enabled !== true ? [] : ['outro-video.mp4'],
  };
}

export async function run(ctx) {
  const source = ctx.uploads['outro-video'];
  if (ctx.config.outro?.enabled !== true || !fs.existsSync(source)) {
    return { metrics: { skipped: true }, warnings: [] };
  }
  const video = await probeVideo(source);
  // 与 intro 同一转码纪律:pack 发的是 generated 里的 540p 产物,不是上传原片。
  const packagedPath = path.join(ctx.generatedDir, 'outro-video.mp4');
  await spawnRun('node', [
    path.join(ctx.scriptsRoot, 'transcode-video.mjs'),
    '--video', source,
    '--out', packagedPath,
  ]);
  const packaged = await probeVideo(packagedPath);
  return {
    metrics: {
      ...video,
      videoBytes: fs.statSync(source).size,
      videoPackagedBytes: fs.statSync(packagedPath).size,
      packagedWidth: packaged.videoWidth,
      packagedHeight: packaged.videoHeight,
    },
    warnings: [],
  };
}
