import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildWsOverlayInjection } from './ws-overlays.mjs';
import { normalizeCtaPolicy, requireFiles } from './helpers.mjs';
import { effectiveConfig } from '../runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const inline = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const script = (tag, source) => `<script data-novvy-${tag}>${source.replace(/<\/script/gi, '<\\/script')}</script>`;
export function originCtaPolicy(raw) {
  const policy = normalizeCtaPolicy(raw, 'steps');
  return { mode: policy.mode, afterSteps: policy.afterSteps,
    intervals: (Array.isArray(raw?.intervals) ? raw.intervals : []).filter(n => Number.isInteger(n) && n >= 1 && n <= 99).slice(0, 24) };
}
export function originHtml({ root, pluginDir, template, config, media = {}, preview = false }) {
  const read = file => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    if (createHash('sha256').update(content).digest('hex') !== template.fileHashes?.[file]) throw new Error(`模板产物校验失败，请重新 build: ${file}`);
    return content;
  };
  let html = read(template.game.indexHtml);
  const files = Object.fromEntries([...template.game.scripts, template.game.boot].map(file => [path.basename(file), read(file)]));
  const injection = buildWsOverlayInjection({ overlaysRoot: pluginDir, template, config, media, optionalHudPortraits: true, analytics: false });
  const stageChain = [...(injection.introEnabled ? ['video'] : []), 'playable'];
  const policy = originCtaPolicy(config.playableCta);
  const settings = { intro: injection.introEnabled, title: injection.hudEnabled, policy };
  const readEngine = name => fs.readFileSync(path.join(pluginDir, template.overlays.engine, name), 'utf8');
  const sourceScript = file => preview ? script('origin-source', files[path.basename(file)]) : `<script src="${path.basename(file)}"></script>`;
  const boot = [
    ...injection.bodyDom, injection.uiScript,
    script('origin-config', `window.__novvyStageChain__=${inline(stageChain)};window.__ORIGIN_CONFIG__=${inline(settings)};`),
    script('playable-bridge', readEngine('events.js')),
    ...injection.bodyScripts,
    ...template.game.scripts.map(sourceScript),
    script('origin-adapter', readEngine('engine.js')),
    sourceScript(template.game.boot),
  ].filter(Boolean).join('\n');
  if (html.split('<!--ORIGIN_SCRIPTS-->').length !== 2) throw new Error('Original playable boot anchor missing');
  html = html.replace(/<!--ORIGIN_SCRIPTS-->[\s\S]*?<!--ORIGIN_SCRIPTS_END-->/, () => boot);
  html = html.replace('</head>', () => [...injection.headStyles,
    injection.hudEnabled ? '<style data-novvy-origin-shell>#origin-game{top:88px}#novvy-training-hud{top:12px}@media(orientation:landscape){#origin-game{top:64px}#novvy-training-hud{top:4px}}</style>' : '', '</head>'].join('\n'));
  return { html, files, stageChain, policy, introEnabled: injection.introEnabled };
}
export function originPreview({ plugin: entry, task, taskId }) {
  const config = effectiveConfig(entry.template, task.config);
  const generated = taskGeneratedDir(taskId);
  const video = fs.existsSync(path.join(generated, 'intro-video.mp4')) ? `/project/${taskId}/generated/intro-video.mp4`
    : fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null;
  const poster = fs.existsSync(path.join(generated, 'poster.webp')) ? `/project/${taskId}/generated/poster.webp` : null;
  return originHtml({ root: entry.templateDir, pluginDir: entry.dir, template: entry.template, config, preview: true,
    media: { introVideo: video, introPoster: poster } }).html;
}
export function originPrerequisites(config) {
  return config?.intro?.enabled === true ? { uploads: ['intro-video'], generated: ['intro-video.mp4', 'poster.webp'] } : { uploads: [], generated: [] };
}
export async function packOrigin(ctx) {
  const intro = ctx.config.intro?.enabled === true;
  if (intro) requireFiles([ctx.uploads['intro-video'], path.join(ctx.generatedDir, 'intro-video.mp4'), path.join(ctx.generatedDir, 'poster.webp')]);
  const built = originHtml({ root: ctx.templateRoot, pluginDir: ctx.pluginDir, template: ctx.template, config: ctx.config,
    media: { introVideo: intro ? 'intro-video.mp4' : null, introPoster: intro ? 'poster.webp' : null } });
  fs.rmSync(ctx.resultDir, { recursive: true, force: true });
  fs.mkdirSync(ctx.resultDir, { recursive: true });
  for (const [file, content] of Object.entries({ ...built.files, 'index.html': built.html })) fs.writeFileSync(path.join(ctx.resultDir, file), content);
  if (intro) for (const file of ['intro-video.mp4', 'poster.webp']) fs.copyFileSync(path.join(ctx.generatedDir, file), path.join(ctx.resultDir, file));
  const packageFiles = fs.readdirSync(ctx.resultDir).sort();
  return { metrics: { packageFiles, outputBytes: packageFiles.reduce((n, file) => n + fs.statSync(path.join(ctx.resultDir, file)).size, 0), stageChain: built.stageChain, introEnabled: intro, ctaPolicy: built.policy }, warnings: [] };
}
