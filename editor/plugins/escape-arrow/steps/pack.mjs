import fs from 'node:fs';
import path from 'node:path';
import { requireFiles } from '../../../core/lib/helpers.mjs';
import { escapeLevel, escapeHtmlPage } from '../lib.mjs';

export function prerequisites(config) {
  const generated = ['level.json'];
  const uploads = [];
  if (config?.intro?.enabled === true) { uploads.push('intro-video'); generated.push('poster.webp', 'intro-video.mp4'); }
  if (config?.hud?.enabled === true) generated.push('hud-left.webp', 'hud-right.webp');
  if (config?.background?.enabled === true) generated.push('background.webp');
  if (config?.secondPlayable?.enabled === true && config?.outro?.enabled === true) {
    generated.push('level2.json');
    if (config.secondPlayable.background?.enabled === true) generated.push('background2.webp');
  }
  return { uploads, generated };
}

export async function run(ctx) {
  const level = escapeLevel(ctx.templateRoot, ctx.config.levelId);
  const generatedLevel = path.join(ctx.generatedDir, 'level.json');
  requireFiles([generatedLevel]);
  if (JSON.stringify(JSON.parse(fs.readFileSync(generatedLevel, 'utf8'))) !== JSON.stringify(level)) throw new Error('关卡已更改，请重新运行关卡步骤');
  // 双 playable:第二关仅在有片尾视频时允许(与 level 步骤的 gating 同源)。
  const outroActive = ctx.config.outro?.enabled === true && fs.existsSync(ctx.uploads['outro-video']);
  const phase2Level = outroActive && ctx.config.secondPlayable?.enabled === true
    ? escapeLevel(ctx.templateRoot, ctx.config.secondPlayable?.levelId ?? 2)
    : null;
  if (phase2Level) {
    const generatedLevel2 = path.join(ctx.generatedDir, 'level2.json');
    requireFiles([generatedLevel2]);
    if (JSON.stringify(JSON.parse(fs.readFileSync(generatedLevel2, 'utf8'))) !== JSON.stringify(phase2Level)) throw new Error('第二关已更改，请重新运行关卡步骤');
  }
  const enabled = {
    intro: ctx.config.intro?.enabled === true,
    outro: outroActive,
    hud: ctx.config.hud?.enabled === true,
    background: ctx.config.background?.enabled === true,
  };
  enabled.background2 = phase2Level !== null && ctx.config.secondPlayable?.background?.enabled === true;
  const ctaIconSource = ctx.template.appIcon ? path.join(ctx.templateRoot, ctx.template.appIcon) : null;
  enabled.cta = ctx.config.cta?.enabled !== false && !!ctaIconSource && fs.existsSync(ctaIconSource);
  const media = {
    introVideo: enabled.intro ? 'tail-ad-video.mp4' : null,
    introPoster: enabled.intro ? 'poster.webp' : null,
    outroVideo: enabled.outro ? 'outro-video.mp4' : null,
    hudLeft: enabled.hud ? 'hud-left.webp' : null,
    hudRight: enabled.hud ? 'hud-right.webp' : null,
    background: enabled.background ? 'background.webp' : null,
    background2: enabled.background2 ? 'background2.webp' : null,
    ctaIcon: enabled.cta ? 'app-icon.png' : null,
  };
  const needed = [];
  if (enabled.intro) needed.push(ctx.uploads['intro-video'], path.join(ctx.generatedDir, 'poster.webp'), path.join(ctx.generatedDir, 'intro-video.mp4'));
  if (enabled.outro) needed.push(path.join(ctx.generatedDir, 'outro-video.mp4'));
  if (enabled.hud) needed.push(path.join(ctx.generatedDir, 'hud-left.webp'), path.join(ctx.generatedDir, 'hud-right.webp'));
  if (enabled.background) needed.push(path.join(ctx.generatedDir, 'background.webp'));
  if (enabled.background2) needed.push(path.join(ctx.generatedDir, 'background2.webp'));
  requireFiles(needed);
  const built = escapeHtmlPage({ root: ctx.templateRoot, overlaysRoot: ctx.pluginDir, template: ctx.template, level, config: ctx.config, media });
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.cpSync(path.join(ctx.templateRoot, 'game'), ctx.resultDir, { recursive: true });
  // levelN.html 是基础包的无埋点/无 CTA 独立入口,配置的关卡只经 index.html
  // 注入;混进广告包会绕过任务配置,这里兜底删除(模板侧 build 已不同步它们)。
  for (const file of fs.readdirSync(ctx.resultDir)) {
    if (/^level\d+\.html$/.test(file)) fs.rmSync(path.join(ctx.resultDir, file));
  }
  fs.writeFileSync(path.join(ctx.resultDir, 'index.html'), built.html);
  // 视频 pack 只发 intro/outro 步骤转码出的 720p 产物(上传原片不进包)。
  if (enabled.intro) {
    fs.copyFileSync(path.join(ctx.generatedDir, 'intro-video.mp4'), path.join(ctx.resultDir, 'tail-ad-video.mp4'));
    fs.copyFileSync(path.join(ctx.generatedDir, 'poster.webp'), path.join(ctx.resultDir, 'poster.webp'));
  }
  if (enabled.outro) fs.copyFileSync(path.join(ctx.generatedDir, 'outro-video.mp4'), path.join(ctx.resultDir, 'outro-video.mp4'));
  if (enabled.hud) {
    for (const side of ['left', 'right']) fs.copyFileSync(path.join(ctx.generatedDir, `hud-${side}.webp`), path.join(ctx.resultDir, `hud-${side}.webp`));
  }
  if (enabled.background) fs.copyFileSync(path.join(ctx.generatedDir, 'background.webp'), path.join(ctx.resultDir, 'background.webp'));
  if (enabled.background2) fs.copyFileSync(path.join(ctx.generatedDir, 'background2.webp'), path.join(ctx.resultDir, 'background2.webp'));
  if (enabled.cta) fs.copyFileSync(ctaIconSource, path.join(ctx.resultDir, 'app-icon.png'));
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  for (const file of ['index.html', 'game.js', 'style.css']) if (!packageFiles.includes(file)) throw new Error(`Escape Arrow 打包缺少 ${file}`);
  const sizeOf = (entry) => fs.statSync(entry).isDirectory()
    ? fs.readdirSync(entry).reduce((sum, name) => sum + sizeOf(path.join(entry, name)), 0)
    : fs.statSync(entry).size;
  return { metrics: { levelId: level.Index, packageFiles, outputBytes: packageFiles.reduce((n, name) => n + sizeOf(path.join(ctx.resultDir, name)), 0), overlays: enabled, phase2: phase2Level ? phase2Level.Index : null }, warnings: [] };
}
