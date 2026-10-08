import fs from 'node:fs';
import path from 'node:path';
import { run as runBackground } from '../../../core/steps/background.mjs';

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
    const result = await runBackground({ ...ctx, generatedDir: temp, config: { ...ctx.config, background: settings }, uploads: { ...ctx.uploads, background: ctx.uploads.background2, 'intro-video': ctx.uploads['outro-video'] } });
    fs.renameSync(path.join(temp, 'background.webp'), output);
    return result;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
