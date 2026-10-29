import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildWsOverlayInjection } from './ws-overlays.mjs';
import { normalizeCtaPolicy, requireFiles } from './helpers.mjs';
import { effectiveConfig } from '../runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const inline = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const script = (tag, source) => `<script data-novvy-${tag}>${source.replace(/<\/script/gi, '<\\/script')}</script>`;
export function originCtaBridge(config) {
  const source = fs.readFileSync(new URL('../overlays/cta-bridge/cta-bridge.js', import.meta.url), 'utf8');
  return script('origin-cta-config', `window.__NOVVY_CTA_END_MASK__=${config?.cta?.endMask === true};window.__novvyDeferCanvasCta=true;window.__novvyCtaSdkOnly=true;`)
    + script('cta-bridge', source.replaceAll('__CTA_URL_KEY__', '__ORIGIN_CTA_URL__'));
}
export function originCtaPolicy(raw) {
  const policy = normalizeCtaPolicy(raw, 'steps');
  return { mode: policy.mode, afterSteps: policy.afterSteps,
    intervals: (Array.isArray(raw?.intervals) ? raw.intervals : []).filter(n => Number.isInteger(n) && n >= 1 && n <= 99).slice(0, 24) };
}
export function addOriginCtaCard(injection, card, read) {
  if (!card) return;
  const readCard = name => fs.readFileSync(new URL(`../overlays/cta-card/cta-card.${name}`, import.meta.url), 'utf8');
  const name = String(card.name).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const iconMime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(card.icon).toLowerCase()];
  if (!iconMime) throw new Error(`Unsupported CTA icon format: ${card.icon}`);
  const values = { __CTA_NAME__: name, __CTA_ICON__: `data:${iconMime};base64,${read(card.icon, null).toString('base64')}`,
    __CTA_TAKEOVER_TEXT__: '', __CTA_TAKEOVER_ACTION_TEXT__: '' };
  injection.headStyles.push(`<style data-novvy-cta-card>${readCard('css')}</style>`);
  injection.bodyDom.push(readCard('html').replace(/__CTA_(?:ICON|NAME|TAKEOVER_TEXT|TAKEOVER_ACTION_TEXT)__/g, key => values[key]));
  injection.bodyScripts.push(script('cta-card', readCard('js')));
}
export function originHtml({ root, pluginDir, template, config, media = {}, preview = false }) {
  const read = (file, encoding = 'utf8') => {
    const content = fs.readFileSync(path.join(root, file), encoding);
    if (createHash('sha256').update(content).digest('hex') !== template.fileHashes?.[file]) throw new Error(`模板产物校验失败，请重新 build: ${file}`);
    return content;
  };
  let html = read(template.game.indexHtml);
  const files = Object.fromEntries([...template.game.scripts, template.game.boot].map(file => [path.basename(file), read(file)]));
  const injection = buildWsOverlayInjection({ overlaysRoot: pluginDir, template, config, media, optionalHudPortraits: true, analytics: false });
  addOriginCtaCard(injection, template.game.ctaCard, read);
  const stageChain = [...(injection.introEnabled ? ['video'] : []), 'playable'];
  const policy = originCtaPolicy(config.playableCta);
  const settings = { intro: injection.introEnabled, title: injection.hudEnabled, policy };
  const readEngine = name => fs.readFileSync(path.join(pluginDir, template.overlays.engine, name), 'utf8');
  const sourceScript = file => preview ? script('origin-source', files[path.basename(file)]) : `<script src="${path.basename(file)}"></script>`;
  const boot = [
    ...injection.bodyDom, injection.uiScript,
    script('origin-config', `window.__novvyStageChain__=${inline(stageChain)};window.__ORIGIN_CONFIG__=${inline(settings)};`),
    script('playable-bridge', readEngine('events.js')),
    originCtaBridge(config),
    ...injection.bodyScripts,
    ...template.game.scripts.map(sourceScript),
    script('origin-adapter', readEngine('engine.js')),
    sourceScript(template.game.boot),
  ].filter(Boolean).join('\n');
  if (html.split('<!--ORIGIN_SCRIPTS-->').length !== 2) throw new Error('Original playable boot anchor missing');
  html = html.replace(/<!--ORIGIN_SCRIPTS-->[\s\S]*?<!--ORIGIN_SCRIPTS_END-->/, () => boot);
  html = html.replace('</head>', () => [...injection.headStyles,
    injection.hudEnabled && !template.game.hudInsideCanvas ? '<style data-novvy-origin-shell>#origin-game{top:88px}#novvy-training-hud{top:12px}@media(orientation:landscape){#origin-game{top:64px}#novvy-training-hud{top:4px}}</style>' : '', '</head>'].join('\n'));
  return { html, files, stageChain, policy, introEnabled: injection.introEnabled };
}
export function originPreview({ plugin: entry, task, taskId }) {
  const config = effectiveConfig(entry.template, task.config);
  const generated = taskGeneratedDir(taskId);
  const uploaded = path.join(taskUploadsDir(taskId), 'intro-video.mp4');
  const video = fs.existsSync(uploaded) ? `/project/${taskId}/uploads/intro-video.mp4?v=${fs.statSync(uploaded).mtimeMs}` : null;
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
