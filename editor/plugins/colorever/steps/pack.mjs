import fs from 'node:fs';
import path from 'node:path';
import { requireFiles } from '../../../core/lib/helpers.mjs';
import { coloreverLevel, coloreverPhase2, coloreverHtml } from '../lib.mjs';

export function prerequisites(config) {
  const generated = ['level.json'];
  const uploads = [];
  if (config?.intro?.enabled === true) { uploads.push('intro-video'); generated.push('poster.webp'); }
  if (config?.background?.enabled === true) generated.push('background.webp');
  if (config?.secondPlayable?.enabled === true && config?.outro?.enabled === true) {
    generated.push('level2.json');
    if (config.secondPlayable.background?.enabled === true) generated.push('background2.webp');
  }
  return { uploads, generated };
}

export async function run(ctx) {
  const { level } = await coloreverLevel(ctx.templateRoot, ctx.config, ctx.template);
  const generated = path.join(ctx.generatedDir, 'level.json');
  requireFiles([generated]);
  if (JSON.stringify(JSON.parse(fs.readFileSync(generated, 'utf8'))) !== JSON.stringify(level)) throw new Error('关卡已改变，请重新运行关卡步骤');
  const enabled = { intro: ctx.config.intro?.enabled === true, outro: ctx.config.outro?.enabled === true && fs.existsSync(ctx.uploads['outro-video']), hud: ctx.config.hud?.enabled === true, background: ctx.config.background?.enabled === true };
  const phase2 = await coloreverPhase2(ctx.templateRoot, ctx.config, ctx.template, enabled.outro);
  if (phase2) {
    const generated2 = path.join(ctx.generatedDir, 'level2.json');
    requireFiles([generated2]);
    if (JSON.stringify(JSON.parse(fs.readFileSync(generated2, 'utf8'))) !== JSON.stringify(phase2.level)) throw new Error('第二关已改变，请重新运行关卡步骤');
  }
  enabled.background2 = phase2 !== null && ctx.config.secondPlayable?.background?.enabled === true;
  const files = [];
  if (enabled.intro) files.push([ctx.uploads['intro-video'], 'tail-ad-video.mp4'], [path.join(ctx.generatedDir, 'poster.webp'), 'poster.webp']);
  if (enabled.outro) files.push([ctx.uploads['outro-video'], 'outro-video.mp4']);
  const hudMedia = {};
  if (enabled.hud) for (const side of ['left', 'right']) {
    const name = `hud-${side}.webp`, source = path.join(ctx.generatedDir, name);
    if (fs.existsSync(source)) { files.push([source, name]); hudMedia[side] = name; }
  }
  if (enabled.background) files.push([path.join(ctx.generatedDir, 'background.webp'), 'background.webp']);
  if (enabled.background2) files.push([path.join(ctx.generatedDir, 'background2.webp'), 'background2.webp']);
  requireFiles(files.map(([source]) => source));
  const built = await coloreverHtml({ root: ctx.templateRoot, overlaysRoot: ctx.pluginDir, template: ctx.template, level, config: ctx.config, media: { introVideo: enabled.intro ? 'tail-ad-video.mp4' : null, introPoster: enabled.intro ? 'poster.webp' : null, outroVideo: enabled.outro ? 'outro-video.mp4' : null, hudLeft: hudMedia.left ?? null, hudRight: hudMedia.right ?? null, background: enabled.background ? 'background.webp' : null, background2: enabled.background2 ? 'background2.webp' : null } });
  enabled.hud = built.injection.hudEnabled;
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.mkdirSync(ctx.resultDir, { recursive: true });
  fs.copyFileSync(path.join(ctx.templateRoot, 'game/game.js'), path.join(ctx.resultDir, 'game.js'));
  fs.writeFileSync(path.join(ctx.resultDir, 'index.html'), built.html);
  for (const [source, name] of files) fs.copyFileSync(source, path.join(ctx.resultDir, name));
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  return { metrics: { packageFiles, outputBytes: packageFiles.reduce((n, name) => n + fs.statSync(path.join(ctx.resultDir, name)).size, 0), overlays: enabled, level: level.name, phase2: phase2 ? phase2.patternId : null }, warnings: [] };
}
