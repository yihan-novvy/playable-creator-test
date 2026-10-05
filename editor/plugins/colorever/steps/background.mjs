import fs from 'node:fs';
import path from 'node:path';
import { run as runBackground } from '../../../core/steps/background.mjs';
import { run as spawnRun } from '../../../core/lib/exec.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';

export function prerequisites(config) {
  if (config?.background?.enabled !== true) return { uploads: [], generated: [] };
  const source = config.background.source ?? 'auto';
  return { uploads: source.startsWith('video-') ? ['intro-video'] : source === 'upload' ? ['background'] : [], generated: [] };
}

export async function run(ctx) {
  if (ctx.config.background?.enabled !== true) return { metrics: { skipped: true }, warnings: [] };
  const source = ctx.config.background.source ?? 'auto';
  if (!['auto', 'upload', 'video-first', 'video-last'].includes(source)) throw new Error('未知背景来源');
  const sigma = Number(ctx.config.background.blurSigma);
  if (!Number.isFinite(sigma) || sigma < 0 || sigma > 50) throw new Error('背景模糊程度应为 0–50');
  if (source === 'auto') return runBackground(ctx);
  if (source === 'upload') {
    requireFiles([ctx.uploads.background]);
    return runBackground(ctx);
  }
  requireFiles([ctx.uploads['intro-video']]);
  const framePath = path.join(ctx.generatedDir, 'background-video-frame.webp');
  try {
    await spawnRun('node', [path.join(ctx.scriptsRoot, 'make-poster.mjs'), '--video', ctx.uploads['intro-video'], '--out', framePath, '--frame', source === 'video-last' ? 'last' : 'first']);
    const result = await runBackground({ ...ctx, uploads: { ...ctx.uploads, background: framePath } });
    result.metrics.source = source;
    return result;
  } finally {
    fs.rmSync(framePath, { force: true });
  }
}
