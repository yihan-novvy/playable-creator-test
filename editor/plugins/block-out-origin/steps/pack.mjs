import fs from 'node:fs';
import path from 'node:path';
import { requireFiles } from '../../../core/lib/helpers.mjs';
import { blockOutHtml } from '../lib.mjs';

export function prerequisites(config) {
  return config?.intro?.enabled === true
    ? { uploads: ['intro-video'], generated: ['intro-video.mp4', 'poster.webp'] }
    : { uploads: [], generated: [] };
}
export async function run(ctx) {
  const intro = ctx.config.intro?.enabled === true;
  if (intro) requireFiles([ctx.uploads['intro-video'], path.join(ctx.generatedDir, 'intro-video.mp4'), path.join(ctx.generatedDir, 'poster.webp')]);
  const built = blockOutHtml({ root: ctx.templateRoot, overlaysRoot: ctx.pluginDir, template: ctx.template, config: ctx.config,
    media: { introVideo: intro ? 'intro-video.mp4' : null, introPoster: intro ? 'poster.webp' : null } });
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.mkdirSync(ctx.resultDir, { recursive: true });
  for (const [file, text] of Object.entries({ 'index.html': built.html, 'assets.js': built.assetsJs, 'core.js': built.coreJs })) fs.writeFileSync(path.join(ctx.resultDir, file), text);
  if (intro) for (const file of ['intro-video.mp4', 'poster.webp']) fs.copyFileSync(path.join(ctx.generatedDir, file), path.join(ctx.resultDir, file));
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  return { metrics: { packageFiles, outputBytes: packageFiles.reduce((n, file) => n + fs.statSync(path.join(ctx.resultDir, file)).size, 0), stageChain: built.stageChain, introEnabled: intro, ctaPolicy: built.policy, levels: 2 }, warnings: [] };
}
