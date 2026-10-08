import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { normalizeCtaPolicy } from '../../core/lib/helpers.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

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

// 双 playable 数据:仅在片尾已启用(存在片尾视频才算)时允许,否则视为未配置。
// 第二关数据全量内联进 index.html,打包文件列表不变。第二关也是 Unity 固定
// 关卡,只选 levelId,没有开局参数。
function dragonPhase2(root, config, outroActive) {
  if (!outroActive || config?.secondPlayable?.enabled !== true) return null;
  const level = dragonLevel(root, config.secondPlayable?.levelId ?? 2);
  const title = config.secondPlayable?.hud;
  const hud = { titleLine1: String(title?.titleLine1 ?? ''), titleLine2: String(title?.titleLine2 ?? '') };
  return { levelId: level.Index, level, hud, cta: normalizeCtaPolicy(config.secondPlayable?.cta, 'steps') };
}

export function dragonHtml({ root, overlaysRoot, template, level, config, media, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  if (html.split(SCRIPT).length !== 2) throw new Error('DragonCube 基础包缺少唯一 game.js 脚本入口');
  // 下载卡片不随包:结算卡片、点击上报与商店跳转由落地页打包服务的注入引擎
  // 负责(novvy_landing_page_service /api/interactive-zip/generate)。强制置空
  // ctaIcon,任务里遗留的 cta 配置不再能唤起卡片组。
  const mediaWithoutCard = { ...media, ctaIcon: null };
  const outroEnabled = config?.outro?.enabled === true && !!media.outroVideo;
  const phase2 = dragonPhase2(root, config, outroEnabled);
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config, media: mediaWithoutCard, analytics: false });
  // 转化桥永远注入:胜利/片尾/CTA 时刻的转化时序 + 注入引擎结算卡片显露
  // (showEndCard)。桥文件在 core/overlays 共享(colorever 同一份);占位符
  // 注入时替换成本模板的 URL 变量名,SDK 包内恒空 —— 落地页由 SDK 取
  // adm.clicktrack,URL 只服务编辑器预览的裸兜底链。
  const bridgeFile = fileURLToPath(new URL('../../core/overlays/cta-bridge/cta-bridge.js', import.meta.url));
  const bridge = fs.readFileSync(bridgeFile, 'utf8').replaceAll('__CTA_URL_KEY__', '__DRAGON_CUBE_CTA_URL__');
  injection.bodyScripts.push(`<script data-novvy-cta-bridge>${bridge}</script>`);
  injection.outroEnabled = outroEnabled;
  if (injection.outroEnabled) {
    const outroRoot = path.join(overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template.overlays.outro);
    const read = name => fs.readFileSync(path.join(outroRoot, name), 'utf8');
    injection.headStyles.push(`<style data-novvy-outro>${read('outro.css')}</style>`);
    injection.bodyDom.push(read('outro.html').replaceAll('__NOVVY_OUTRO_VIDEO__', media.outroVideo));
    injection.bodyScripts.push(`<script data-novvy-outro>${read('outro.js')}</script>`);
  }
  // 双 playable:第二关数据与两关各自的 CTA 时机策略。第一关策略仅武装于
  // 无片尾场景(有片尾时第一关只负责引出片尾,转化由片尾链/第二关负责)。
  // 第二关背景未启用时两关共用包内默认底图(assets/bg-default.jpg),零切换。
  const background2Enabled = phase2 !== null && config?.secondPlayable?.background?.enabled === true && !!media.background2;
  if (phase2) {
    const backgroundRoot = path.join(overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template.overlays.background);
    injection.bodyScripts.push(`<script data-novvy-phase2-background>${fs.readFileSync(path.join(backgroundRoot, 'background.js'), 'utf8')}</script>`);
    if (background2Enabled) {
      const imageUrl = media.background2.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      injection.headStyles.push(`<link rel="preload" as="image" href="${imageUrl}">`);
      injection.bodyDom.push('<div id="novvy-dom-bg2" hidden aria-hidden="true"></div>');
      const css = fs.readFileSync(path.join(backgroundRoot, 'background.css'), 'utf8').replaceAll('#novvy-dom-bg', '#novvy-dom-bg2').replaceAll('__NOVVY_BG_FILE__', media.background2);
      injection.headStyles.push(`<style data-novvy-bg2>${css}#novvy-dom-bg2[hidden]{display:none}</style>`);
    }
  }
  injection.background2Enabled = background2Enabled;
  const ctaPolicy = injection.outroEnabled ? null : normalizeCtaPolicy(config?.playableCta, 'complete');
  // 壳内结算卡与底部按钮在广告形态下让位:第一关的结算就是片尾/服务结算
  // 卡片(双 playable 时片尾之后还有第二关)。
  const extra = `<style data-dragon-shell>#game-shell{position:relative;z-index:1;background:transparent}#novvy-dom-bg{z-index:0}.bottom-ui{visibility:hidden}#win{display:none!important}${injection.hudEnabled ? '.top-ui{visibility:hidden}' : ''}</style>`;
  const configScript = `<script>window.__DRAGON_CUBE_LEVEL__=${inline(level)};window.__DRAGON_CUBE_CTA_URL__='';window.__DRAGON_CUBE_HUD_TITLE__=${inline({ titleLine1: String(config?.hud?.titleLine1 ?? ''), titleLine2: String(config?.hud?.titleLine2 ?? '') })};window.__novvyOutroEnabled=${injection.outroEnabled};window.__novvyTwoPhase=${phase2 !== null};window.__DRAGON_CUBE_CTA_POLICY__=${inline(ctaPolicy)};window.__DRAGON_CUBE_PHASE2__=${inline(phase2)};</script>`;
  const gameScript = preview ? `<script src="/templates/${template.id}/game/game.js" defer></script>` : SCRIPT;
  if (preview) html = html.replace('href="style.css"', `href="/templates/${template.id}/game/style.css"`);
  html = html.replace('</head>', `${[...injection.headStyles, extra, ...injection.headScripts].join('\n')}\n</head>`)
    .replace(SCRIPT, `${injection.uiScript}${configScript}${gameScript}`)
    .replace('<body>', `<body>\n${injection.bodyDom.join('\n')}`)
    .replace('</body>', `${injection.bodyScripts.join('\n')}</body>`);
  return { html, injection };
}

// 在线试玩预览（server /api/tasks/:id/preview 的插件钩子）。
export function previewHtml({ plugin: entry, task, taskId }) {
  const root = entry.templateDir;
  const config = effectiveConfig(entry.template, task.config);
  const level = dragonLevel(root, config.levelId);
  const generated = (name) => fs.existsSync(path.join(taskGeneratedDir(taskId), name)) ? `/project/${taskId}/generated/${name}` : null;
  const intro = config.intro?.enabled === true, hud = config.hud?.enabled === true, bg = config.background?.enabled === true;
  const media = {
    introVideo: intro && fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null,
    introPoster: intro ? generated('poster.webp') : null,
    outroVideo: config.outro?.enabled === true && fs.existsSync(path.join(taskUploadsDir(taskId), 'outro-video.mp4')) ? `/project/${taskId}/uploads/outro-video.mp4` : null,
    hudLeft: hud ? generated('hud-left.webp') : null,
    hudRight: hud ? generated('hud-right.webp') : null,
    background: bg ? generated('background.webp') : null,
    background2: config.secondPlayable?.background?.enabled === true ? generated('background2.webp') : null,
  };
  return dragonHtml({ root, overlaysRoot: entry.dir, template: entry.template, level, config, preview: true, media }).html;
}
