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

const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function ctaCardAssets(config, icon) {
  const cardDir = fileURLToPath(new URL('../../core/overlays/cta-card/', import.meta.url));
  const readCard = name => fs.readFileSync(path.join(cardDir, name), 'utf8');
  const values = {
    __CTA_ICON__: escapeHtml(icon),
    __CTA_NAME__: 'DragonCube',
    __CTA_TAKEOVER_TEXT__: escapeHtml(config?.cta?.takeoverText ?? '还想继续挑战？\n更多精彩等你体验'),
    __CTA_TAKEOVER_ACTION_TEXT__: escapeHtml(config?.cta?.takeoverActionText ?? '点击屏幕，继续体验'),
  };
  return {
    style: `<style data-novvy-cta-card>${readCard('cta-card.css')}</style>`,
    dom: readCard('cta-card.html').replace(/__CTA_(?:ICON|NAME|TAKEOVER_TEXT|TAKEOVER_ACTION_TEXT)__/g, key => values[key]),
    script: `<script data-novvy-cta-card>${readCard('cta-card.js')}</script>`,
  };
}

// 双 playable 数据:仅在片尾已启用(存在片尾视频才算)时允许,否则视为未配置。
// 第二关数据全量内联进 index.html,打包文件列表不变。第二关也是 Unity 固定
// 关卡,只选 levelId,没有开局参数。
function dragonPhase2(root, config, outroActive) {
  if (!outroActive || config?.secondPlayable?.enabled !== true) return null;
  const level = dragonLevel(root, config.secondPlayable?.levelId ?? 2);
  const title = config.secondPlayable?.hud;
  // 第二关标题同样尊重 titleEnabled=false(colorever 同款):显式关闭时不带文案。
  const hud = {
    titleLine1: title?.titleEnabled === false ? '' : String(title?.titleLine1 ?? ''),
    titleLine2: title?.titleEnabled === false ? '' : String(title?.titleLine2 ?? ''),
  };
  return { levelId: level.Index, level, hud, cta: normalizeCtaPolicy(config.secondPlayable?.cta, 'steps') };
}

// 结算重玩弹窗(最后一个 playable 的结算时刻亮出):点击先请求一次 CTA,
// 再页内重开本关原版布局重玩。enabled 未开时注入 null,包行为与旧版完全
// 一致;文案/按钮留空回退默认(与 colorever-new 同款英文句式,引擎内同款兜底)。
export function normalizeReplay(raw) {
  if (raw?.enabled !== true) return null;
  return { enabled: true, text: String(raw?.text ?? '').trim() || 'Level complete! Play again?', button: String(raw?.button ?? '').trim() || 'Replay' };
}

export function dragonHtml({ root, overlaysRoot, template, level, config, media, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  if (html.split(SCRIPT).length !== 2) throw new Error('DragonCube 基础包缺少唯一 game.js 脚本入口');
  // 与 colorever 一样使用 core 的自有下载卡;ws 的旧卡片组不参与。
  const mediaWithoutCard = { ...media, ctaIcon: null };
  const outroEnabled = config?.outro?.enabled === true && !!media.outroVideo;
  const phase2 = dragonPhase2(root, config, outroEnabled);
  // 新事件规范(docs/original-zip-required-event-integration.md §2):段链打包时
  // 定稿 —— intro/outro 各算独立 video 段、第二关算独立 playable 段;字面量
  // 注入供静态预检与段桥(__novvyStageChain__)使用。
  const stageChain = [...(media.introVideo ? ['video'] : []), 'playable', ...(outroEnabled ? ['video'] : []), ...(phase2 ? ['playable'] : [])];
  // HUD 标题与立绘解耦(colorever 同款):titleEnabled 独立于立绘开关,标题可
  // 单独存在;双 playable 时第二关强制可展示标题,但第一关未启用标题则不带空文案。
  const firstTitleEnabled = config?.hud?.titleEnabled ?? [config?.hud?.titleLine1, config?.hud?.titleLine2].some(value => String(value ?? '').trim());
  const overlayConfig = phase2 ? { ...config, hud: { ...config.hud, titleEnabled: true, titleLine1: firstTitleEnabled ? config?.hud?.titleLine1 : '', titleLine2: firstTitleEnabled ? config?.hud?.titleLine2 : '' } } : config;
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config: overlayConfig, media: mediaWithoutCard, optionalHudPortraits: true, analytics: false });
  // 段桥必须最先执行(规范 §2:先声明段链与首段 setStage,再启动首段;媒体
  // 注册亦须赶在各段播放之前):unshift 到 bodyScripts 首位,先于 intro.js
  // 求值与 defer 的 game.js。
  const playableBridgeFile = fileURLToPath(new URL('../../core/overlays/playable-bridge/playable-bridge.js', import.meta.url));
  injection.bodyScripts.unshift(`<script data-novvy-playable-bridge>${fs.readFileSync(playableBridgeFile, 'utf8')}</script>`);
  injection.ctaCardEnabled = config?.cta?.enabled !== false && !!media.ctaIcon;
  if (injection.ctaCardEnabled) {
    const card = ctaCardAssets(config, media.ctaIcon);
    injection.headStyles.push(card.style);
    injection.bodyDom.push(card.dom);
    injection.bodyScripts.push(card.script);
  }
  // 转化桥排在卡片脚本之后:片头结束亮底部条,完成/步数命中触发跳转。
  // 桥文件在 core/overlays 共享(colorever 同一份);占位符
  // 注入时替换成本模板的 URL 变量名,SDK 包内恒空 —— 跳转由统一 click API
  // 上送,URL 只服务编辑器预览的裸兜底链。
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
  // 结算重玩弹窗:开启时共享段桥/转化桥按 __novvyReplayable 保留当前段等待
  // 重玩(结算 continue_playing),重玩按钮的 CTA 请求不读自动闩锁;可重玩
  // 回合的转化事件不武装"回访每击转化"。
  const replaySpec = normalizeReplay(config?.replay);
  // 壳内结算卡与底部按钮在广告形态下让位:第一关的结算就是片尾/服务结算
  // 卡片(双 playable 时片尾之后还有第二关)。HUD 叠层(立绘或仅标题)在场时
  // 收起引擎原生顶栏标题卡,避免双标题。
  const extra = `<style data-dragon-shell>#game-shell{position:relative;z-index:1;background:transparent}#novvy-dom-bg{z-index:0}.bottom-ui{visibility:hidden${injection.ctaCardEnabled ? ';min-height:calc(138px + env(safe-area-inset-bottom))' : ''}}#win{display:none!important}${injection.hudEnabled ? '.top-ui{visibility:hidden}' : ''}</style>`;
  const images = {
    first: [injection.backgroundEnabled && media.background, config?.hud?.enabled === true && media.hudLeft, config?.hud?.enabled === true && media.hudRight, injection.ctaCardEnabled && media.ctaIcon].filter(Boolean),
    second: background2Enabled ? [media.background2] : [],
  };
  const configScript = `<script>window.__DRAGON_CUBE_LEVEL__=${inline(level)};window.__DRAGON_CUBE_CTA_URL__='';window.__NOVVY_CTA_END_MASK__=${inline(config?.cta?.endMask === true)};window.__DRAGON_CUBE_HUD_TITLE__=${inline({ titleLine1: String(config?.hud?.titleLine1 ?? ''), titleLine2: String(config?.hud?.titleLine2 ?? '') })};window.__novvyOutroEnabled=${injection.outroEnabled};window.__novvyTwoPhase=${phase2 !== null};window.__novvyStageChain__=${inline(stageChain)};window.__DRAGON_CUBE_CTA_POLICY__=${inline(ctaPolicy)};window.__DRAGON_CUBE_PHASE2__=${inline(phase2)};window.__DRAGON_CUBE_REPLAY__=${inline(replaySpec)};${replaySpec ? 'window.__novvyReplayable=true;' : ''}window.__DRAGON_CUBE_IMAGES__=${inline(images)};</script>`;
  const gameScript = preview ? `<script src="/templates/${template.id}/game/game.js" defer></script>` : SCRIPT;
  if (preview) html = html.replace('href="style.css"', `href="/templates/${template.id}/game/style.css"`);
  html = html.replace('</head>', () => `${[...injection.headStyles, extra, ...injection.headScripts].join('\n')}\n</head>`)
    .replace(SCRIPT, () => `${injection.uiScript}${configScript}${gameScript}`)
    .replace('<body>', () => `<body>\n${injection.bodyDom.join('\n')}`)
    .replace('</body>', () => `${injection.bodyScripts.join('\n')}</body>`);
  return { html, injection };
}

// 在线试玩预览（server /api/tasks/:id/preview 的插件钩子）。
export function previewHtml({ plugin: entry, task, taskId, previewView }) {
  const root = entry.templateDir;
  const config = effectiveConfig(entry.template, task.config);
  const level = dragonLevel(root, config.levelId);
  const generated = (name) => fs.existsSync(path.join(taskGeneratedDir(taskId), name)) ? `/project/${taskId}/generated/${name}` : null;
  const ctaIcon = config.cta?.enabled !== false && entry.template.overlays?.cta && fs.existsSync(path.join(entry.dir, entry.template.overlays.cta, 'icon.png'))
    ? `/plugins/${entry.id}/${entry.template.overlays.cta}/icon.png` : null;
  if (previewView === 'cta') {
    const card = ctaCardAssets(config, ctaIcon || '');
    const background = (config.secondPlayable?.background?.enabled && generated('background2.webp')) || (config.background?.enabled && generated('background.webp'));
    const backdrop = background ? `<img src="${escapeHtml(background)}" alt="" style="position:fixed;inset:0;width:100%;height:100%;object-fit:cover">` : '';
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CTA 遮罩预览</title><style>html,body{margin:0;min-height:100%;background:#f9a27b}</style>${card.style}</head><body>${backdrop}${config.cta?.enabled !== false ? card.dom : ''}<script>window.__novvyCtaCardPhase='takeover';</script>${card.script}</body></html>`;
  }
  const intro = config.intro?.enabled === true, hud = config.hud?.enabled === true, bg = config.background?.enabled === true;
  const media = {
    introVideo: intro && fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null,
    introPoster: intro ? generated('poster.webp') : null,
    outroVideo: config.outro?.enabled === true && fs.existsSync(path.join(taskUploadsDir(taskId), 'outro-video.mp4')) ? `/project/${taskId}/uploads/outro-video.mp4` : null,
    hudLeft: hud ? generated('hud-left.webp') : null,
    hudRight: hud ? generated('hud-right.webp') : null,
    background: bg ? generated('background.webp') : null,
    background2: config.secondPlayable?.background?.enabled === true ? generated('background2.webp') : null,
    ctaIcon,
  };
  return dragonHtml({ root, overlaysRoot: entry.dir, template: entry.template, level, config, preview: true, media }).html;
}
