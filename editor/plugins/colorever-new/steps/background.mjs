import fs from 'node:fs';
import path from 'node:path';
import { run as runBackground } from '../../../core/steps/background.mjs';
import { run as spawnRun } from '../../../core/lib/exec.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';

function secondBackground(config) {
  if (config?.secondPlayable?.enabled !== true || config?.secondPlayable?.background?.enabled !== true) return false;
  // video-last 依赖片尾视频(按配置门控,不看上传残留);upload 来源独立于片尾。
  const source = config.secondPlayable.background.source ?? 'video-last';
  return source === 'upload' || config?.outro?.enabled === true;
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
  if (config.secondPlayable.background.source === 'upload') return { uploads: ['background2'], generated: [] };
  // video-last 依赖片尾视频;未启用片尾时不声明,runSecond 自然跳过,
  // pack 侧回退复用 background.webp 作为第二关简易背景。
  return { uploads: config?.outro?.enabled === true ? ['outro-video'] : [], generated: [] };
}

export async function runSecond(ctx) {
  const output = path.join(ctx.generatedDir, 'background2.webp');
  const settings = { source: 'video-last', blurSigma: 12, ...ctx.config.secondPlayable?.background };
  if (settings.source === 'auto') settings.source = fs.existsSync(ctx.uploads.background2) ? 'upload' : 'video-last';
  const missingSource = settings.source === 'upload' ? !fs.existsSync(ctx.uploads.background2) : !fs.existsSync(ctx.uploads['outro-video']);
  if (!secondBackground(ctx.config) || missingSource) {
    fs.rmSync(output, { force: true });
    return { metrics: { skipped: true }, warnings: [] };
  }
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
