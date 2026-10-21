import fs from 'node:fs';
import path from 'node:path';
import { requireFiles } from '../../../core/lib/helpers.mjs';
import { originHtml } from '../lib.mjs';

export function prerequisites(config) {
  const intro = config?.intro?.enabled !== false;
  return {
    uploads: intro ? ['intro-video'] : [],
    generated: intro ? ['intro-video.mp4', 'poster.webp'] : [],
  };
}

export async function run(ctx) {
  const intro = ctx.config.intro?.enabled === true;
  const needed = [];
  if (intro) needed.push(ctx.uploads['intro-video'], path.join(ctx.generatedDir, 'poster.webp'), path.join(ctx.generatedDir, 'intro-video.mp4'));
  requireFiles(needed);
  // 视频 pack 只发 intro 步骤转码出的 720p 产物(上传原片不进包);playable
  // 与三座桥全部内联进 index.html,包里没有其他游戏文件。
  const media = {
    introVideo: intro ? 'tail-ad-video.mp4' : null,
    introPoster: intro ? 'poster.webp' : null,
  };
  const built = originHtml({ root: ctx.templateRoot, overlaysRoot: ctx.pluginDir, template: ctx.template, config: ctx.config, media });
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.mkdirSync(ctx.resultDir, { recursive: true });
  fs.writeFileSync(path.join(ctx.resultDir, 'index.html'), built.html);
  if (intro) {
    fs.copyFileSync(path.join(ctx.generatedDir, 'intro-video.mp4'), path.join(ctx.resultDir, 'tail-ad-video.mp4'));
    fs.copyFileSync(path.join(ctx.generatedDir, 'poster.webp'), path.join(ctx.resultDir, 'poster.webp'));
  }
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  return {
    metrics: {
      packageFiles,
      outputBytes: packageFiles.reduce((n, name) => n + fs.statSync(path.join(ctx.resultDir, name)).size, 0),
      stageChain: built.stageChain,
      introEnabled: built.introEnabled,
      ctaPolicy: built.policy,
    },
    warnings: [],
  };
}
