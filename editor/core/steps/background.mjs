import fs from 'node:fs';
import path from 'node:path';
import { run as spawnRun } from '../lib/exec.mjs';

export function prerequisites(config) {
  return { uploads: [], generated: config?.background?.enabled === false ? [] : ['poster.webp'] };
}

async function step(ctx) {
  if (ctx.config.background?.enabled === false) return { metrics: { skipped: true }, warnings: [] };
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
  await spawnRun('node', [
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

export { step as run };
