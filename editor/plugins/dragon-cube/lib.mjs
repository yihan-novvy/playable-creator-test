import fs from 'node:fs';
import path from 'node:path';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';

const SCRIPT = '<script src="game.js" defer></script>';
export function dragonLevel(root, id) {
  if (!Number.isInteger(id) || id < 1 || id > 10) throw new Error('DragonCube 只能选择第 1–10 关');
  const level = JSON.parse(fs.readFileSync(path.join(root, 'levels', `${id}.json`), 'utf8'));
  if (level.Index !== id || !Array.isArray(level.Cells) || !Array.isArray(level.Boxes)) throw new Error(`关卡 ${id} 数据损坏`);
  return level;
}

function inline(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

export function dragonHtml({ root, overlaysRoot, template, level, config, media, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  if (html.split(SCRIPT).length !== 2) throw new Error('DragonCube 基础包缺少唯一 game.js 脚本入口');
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config, media });
  const extra = `<style data-dragon-shell>#game-shell{position:relative;z-index:1;background:transparent}#novvy-dom-bg{z-index:0}#novvy-training-hud{z-index:2147483000}#novvy-cta{z-index:2147482000}#novvy-video-intro{z-index:2147483646}${injection.hudEnabled ? '.top-ui{visibility:hidden}' : ''}${injection.ctaEnabled ? '.bottom-ui{visibility:hidden}#win{display:none!important}' : ''}</style>`;
  const configScript = `<script>window.__DRAGON_CUBE_LEVEL__=${inline(level)};window.__DRAGON_CUBE_CTA_URL__=${inline(String(config?.cta?.destinationUrl || ''))};</script>`;
  const gameScript = preview ? `<script src="/templates/${template.id}/game/game.js" defer></script>` : SCRIPT;
  if (preview) html = html.replace('href="style.css"', `href="/templates/${template.id}/game/style.css"`);
  html = html.replace('</head>', `${[...injection.headStyles, extra, ...injection.headScripts].join('\n')}\n</head>`)
    .replace(SCRIPT, `${injection.uiScript}${configScript}${gameScript}`)
    .replace('<body>', `<body>\n${injection.bodyDom.join('\n')}`)
    .replace('</body>', `${injection.bodyScripts.join('\n')}</body>`);
  return { html, injection };
}
