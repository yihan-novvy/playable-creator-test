import fs from 'node:fs';
import path from 'node:path';
import { run as runBackground } from '../../../core/steps/background.mjs';
import { run as spawnRun } from '../../../core/lib/exec.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';

function secondBackground(config) {
  return config?.secondPlayable?.enabled === true && config?.outro?.enabled === true && config?.secondPlayable?.background?.enabled === true;
}
export function prerequisites(config) {
  const uploads = [];
  if (config?.background?.enabled === true) {
    const source = config.background.source ?? 'auto';
    if (source.startsWith('video-')) uploads.push('intro-video');
    if (source === 'upload') uploads.push('background');
  }
  return { uploads, generated: [] };
}

export function secondPrerequisites(config) {
  if (!secondBackground(config)) return { uploads: [], generated: [] };
  return { uploads: config.secondPlayable.background.source === 'upload' ? ['outro-video', 'background2'] : ['outro-video'], generated: [] };
}

export async function runSecond(ctx) {
  const output = path.join(ctx.generatedDir, 'background2.webp');
  if (!secondBackground(ctx.config) || !fs.existsSync(ctx.uploads['outro-video'])) {
    fs.rmSync(output, { force: true });
    return { metrics: { skipped: true }, warnings: [] };
  }
  const settings = { source: 'video-last', blurSigma: 12, ...ctx.config.secondPlayable.background };
  if (settings.source === 'auto') settings.source = fs.existsSync(ctx.uploads.background2) ? 'upload' : 'video-last';
  // Isolate temporary files so the first background can never be overwritten.
  const temp = fs.mkdtempSync(path.join(ctx.generatedDir, 'background2-'));
  try {
    const result = await run({ ...ctx, generatedDir: temp, config: { ...ctx.config, background: settings }, uploads: { ...ctx.uploads, background: ctx.uploads.background2, 'intro-video': ctx.uploads['outro-video'] } });
    fs.renameSync(path.join(temp, 'background.webp'), output);
    return result;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
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
