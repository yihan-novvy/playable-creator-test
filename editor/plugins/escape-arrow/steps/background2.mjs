import fs from 'node:fs';
import path from 'node:path';
import { run as runBackground } from '../../../core/steps/background.mjs';
import { run as spawnRun } from '../../../core/lib/exec.mjs';

// 第二关独立背景(colorever 同款管线):从片尾视频抽首/尾帧或用上传图,借
// core background 步骤跑高斯模糊。未启用/无片尾视频时跳过并清掉旧产物。
function secondBackground(config) {
  return config?.secondPlayable?.enabled === true && config?.outro?.enabled === true && config?.secondPlayable?.background?.enabled === true;
}

export function prerequisites(config) {
  if (!secondBackground(config)) return { uploads: [], generated: [] };
  return { uploads: config.secondPlayable.background.source === 'upload' ? ['outro-video', 'background2'] : ['outro-video'], generated: [] };
}

export async function run(ctx) {
  const output = path.join(ctx.generatedDir, 'background2.webp');
  if (!secondBackground(ctx.config) || !fs.existsSync(ctx.uploads['outro-video'])) {
    fs.rmSync(output, { force: true });
    return { metrics: { skipped: true }, warnings: [] };
  }
  const settings = { source: 'video-last', blurSigma: 12, ...ctx.config.secondPlayable.background };
  if (settings.source === 'auto') settings.source = fs.existsSync(ctx.uploads.background2) ? 'upload' : 'video-last';
  // 隔离临时目录,第一关背景(background.webp)永远不会被本步覆盖。
  const temp = fs.mkdtempSync(path.join(ctx.generatedDir, 'background2-'));
  try {
    if (!['upload', 'video-first', 'video-last'].includes(settings.source)) throw new Error('未知第二关背景来源');
    const sigma = Number(settings.blurSigma);
    if (!Number.isFinite(sigma) || sigma < 0 || sigma > 50) throw new Error('背景模糊程度应为 0–50');
    let source = ctx.uploads.background2;
    if (settings.source.startsWith('video-')) {
      source = path.join(temp, 'frame.webp');
      await spawnRun('node', [path.join(ctx.scriptsRoot, 'make-poster.mjs'), '--video', ctx.uploads['outro-video'], '--out', source, '--frame', settings.source === 'video-last' ? 'last' : 'first']);
    }
    const result = await runBackground({ ...ctx, generatedDir: temp, config: { ...ctx.config, background: settings }, uploads: { ...ctx.uploads, background: source } });
    result.metrics.source = settings.source;
    fs.renameSync(path.join(temp, 'background.webp'), output);
    return result;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
