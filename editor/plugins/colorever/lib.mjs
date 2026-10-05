import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const SCRIPT = '<script src="game.js" defer></script>';
const hash = (text) => createHash('sha256').update(text).digest('hex');

function catalogFile(root, template) {
  return path.join(root, template.patterns?.catalog || 'game/patterns/catalog.json');
}

function artifact(root, template) {
  const built = JSON.parse(fs.readFileSync(catalogFile(root, template), 'utf8'));
  if (built.version !== 1 || !Array.isArray(built.patterns) || hash(fs.readFileSync(path.join(root, 'game/game.js'))) !== built.engineSha256) throw new Error('Colorever 构建产物不完整，请从源项目重新 build:template');
  return built;
}

export function coloreverPatterns(root, template) {
  return artifact(root, template).patterns.map(({ id, name, description }) => ({ id, name, description }));
}

export function coloreverLevel(root, config, template) {
  const id = config?.patternId ?? 'cat', picture = artifact(root, template).patterns.find((p) => p.id === id);
  if (!picture) throw new Error('未知已构建图案: ' + id);
  if (!/^[a-z][a-z0-9-]*\.json$/.test(picture.level)) throw new Error('无效的构建图案路径');
  const text = fs.readFileSync(path.join(root, 'game/patterns', picture.level), 'utf8');
  if (hash(text) !== picture.levelSha256) throw new Error('固定图案数据已改变，请在 colorever 中修改并重新构建');
  const level = JSON.parse(text);
  if (!Array.isArray(level.opening)) throw new Error('构建产物缺少固定开局');
  return { level, proof: picture.proof, patternId: id };
}

const inline = (value) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

export function coloreverHtml({ root, overlaysRoot, template, level, config, media = {}, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  for (const anchor of [SCRIPT, '</head>', '<body>', '</body>']) if (html.split(anchor).length !== 2) throw new Error(`Colorever New 基础壳缺少唯一锚点 ${anchor}`);
  const url = String(config?.cta?.destinationUrl || '');
  if (url && !/^https?:\/\//i.test(url)) throw new Error('CTA 地址必须为 http(s) URL');
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config, media });
  const top = injection.hudEnabled ? '.18' : '0', bottom = injection.ctaEnabled ? '.16' : '0';
  const styles = `<style data-colorever-shell>.app{z-index:1;position:fixed;top:calc(100svh * ${top});width:min(100vw,calc(100svh * (1 - ${top} - ${bottom}) * .558824));left:50%;transform:translateX(-50%)}${injection.backgroundEnabled ? ':root,body,.app{background:transparent}' : ''}${injection.hudEnabled ? '.app>.hud{visibility:hidden}' : ''}${injection.ctaEnabled ? '#win{display:none!important}' : ''}</style>`;
  const data = `<script>window.__COLOREVER_PATTERN_ID__=${inline(config?.patternId ?? 'cat')};window.__COLOREVER_LEVEL__=${inline(level)};window.__COLOREVER_CTA_URL__=${inline(url)};</script>`;
  html = html.replace('</head>', () => `${[...injection.headStyles, styles, ...injection.headScripts].join('\n')}</head>`)
    .replace(SCRIPT, () => `${injection.uiScript}${data}${preview ? `<script src="/templates/${template.id}/game/game.js" defer></script>` : SCRIPT}`)
    .replace('<body>', () => `<body>${injection.bodyDom.join('\n')}`)
    .replace('</body>', () => `${injection.bodyScripts.join('\n')}</body>`);
  return { html, injection };
}

// 在线试玩预览（server /api/tasks/:id/preview 的插件钩子）。
export function previewHtml({ plugin: entry, task, taskId }) {
  const root = entry.templateDir;
  const config = effectiveConfig(entry.template, task.config);
  const { level } = coloreverLevel(root, config, entry.template);
  const generated = (name) => fs.existsSync(path.join(taskGeneratedDir(taskId), name)) ? `/project/${taskId}/generated/${name}` : null;
  const intro = config.intro?.enabled === true, hud = config.hud?.enabled === true, bg = config.background?.enabled === true;
  const media = {
    introVideo: intro && fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null,
    introPoster: intro ? generated('poster.webp') : null,
    hudLeft: hud ? generated('hud-left.webp') : null,
    hudRight: hud ? generated('hud-right.webp') : null,
    background: bg ? generated('background.webp') : null,
    ctaIcon: config.cta?.enabled === true ? `/plugins/${entry.id}/overlays/cta/icon.png` : null,
  };
  return coloreverHtml({ root, overlaysRoot: entry.dir, template: entry.template, level, config, preview: true, media }).html;
}

export { coloreverPatterns as patterns };
