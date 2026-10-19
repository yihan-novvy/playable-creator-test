import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fillHudHtml, fillIntroHtml } from '../scripts/fill-overlays.mjs';

// 埋点库随模板走:按本模块自身位置解析 src/vendor/analytics.js,pack 与在线
// 预览共用同一份,不存在「配置了埋点却没带库」的静默空埋点形态。
const VENDOR_ANALYTICS = new URL('../vendor/analytics.js', import.meta.url);

// water-sort 的 overlay 注入组装,pack 步(runner.mjs)与在线预览(editor
// server.mjs)共用:哪些组生效、占位符怎么填、三段 splice 内容的顺序,只在
// 这里决定一次(与 repack.mjs 给 colorever 的注入顺序同构)。
//
// media: { hudLeft, hudRight, introVideo, introPoster, background, ctaIcon } ——
// 每项是最终引用(pack 传兄弟文件名,预览传 /project/... 绝对 URL)或 null(产
// 物尚不存在)。组生效条件 = 配置 enabled 且对应 media 齐备;背景组没有开关,
// 有产物即注入(它的唯一来源是 background 步的 blur 产物)。
//
// CTA 组(与 colorever 的 cta 叠层同款卡片/桥链)同时承载 water-sort 的胜利
// 行为,是单一开关下的原子组合:
//   1. 底部下载卡(图标/文案先与 colorever 保持一致,后续由任务配置替换);
//   2. 藏掉基础包壳的底部引导 footer(「选择一个杯子…」/undo/reset)与胜利
//      结算浮层——CTA 卡取代 footer 的位置,novvy:victory(cta.js)负责跳转
//      与自动重开,不再需要结算页;
//   3. 胜利即经 Novvy 桥跳转(cta.js),重开后每一局胜利再次跳转。
// cta.html/css/icon 与 colorever-gemsort 逐字节一致,只有 cta.js 多出胜利接线。

// 作者可控文案进内联脚本,必须防 </script> 逃逸与行分隔符(与关卡注入同一套)。
function escapeInlineJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

// analytics=false 出"纯净包":不注入埋点库与 boot 接线(交付给落地页打包
// 服务再注入其官方 analytics.js 的交付形态),其余组不受影响。

// 片头覆盖层是通用能力(core/overlays/intro):模板自带 overlays/intro/intro.html
// 时整套装用模板自己的(废弃模板保持旧片头不动);否则回落核心版,并允许模板
// 用同目录的 intro.css 追加覆盖(如 water-sort 的层级契约)。
const CORE_OVERLAYS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'overlays');

export function buildWsOverlayInjection({ overlaysRoot, template, config, media, optionalHudPortraits = false, analytics = true }) {
  const overlayPath = (dir, name) => path.join(overlaysRoot, template.overlays?.[dir] || path.join('overlays', dir), name);
  const readOverlay = (dir, name) => fs.readFileSync(overlayPath(dir, name), 'utf8');
  const hasOverlay = (dir, name) => fs.existsSync(overlayPath(dir, name));
  // intro 组的三件套:模板自有整套优先;否则核心版 + 模板级 css 覆盖。
  const introFiles = () => {
    if (hasOverlay('intro', 'intro.html')) {
      return { html: readOverlay('intro', 'intro.html'), css: readOverlay('intro', 'intro.css'), script: readOverlay('intro', 'intro.js') };
    }
    const core = name => fs.readFileSync(path.join(CORE_OVERLAYS_ROOT, 'intro', name), 'utf8');
    return { html: core('intro.html'), css: core('intro.css') + (hasOverlay('intro', 'intro.css') ? readOverlay('intro', 'intro.css') : ''), script: core('intro.js') };
  };

  const hasHudTitle = [config?.hud?.titleLine1, config?.hud?.titleLine2].some(value => String(value ?? '').trim());
  const titlesEnabled = !optionalHudPortraits || (config?.hud?.titleEnabled ?? hasHudTitle);
  const hudEnabled = optionalHudPortraits
    ? titlesEnabled || config?.hud?.enabled === true
    : config?.hud?.enabled !== false && !!media.hudLeft && !!media.hudRight;
  const introEnabled = config?.intro?.enabled !== false && !!media.introVideo && !!media.introPoster;
  const backgroundEnabled = !!media.background;
  const ctaEnabled = config?.cta?.enabled !== false && !!media.ctaIcon;

  // 样式段按 hud → intro → background 排(与 colorever repack 一致,背景最后);
  // 埋点库脚本排在样式段之后、仍在 </head> 前(与 colorever 的 head 注入同位)。
  const headStyles = [];
  const headScripts = [];
  const bodyScripts = [];
  const uiConfig = {};
  let hudDom = '';
  let introDom = '';
  let bgDom = '';
  let ctaDom = '';

  if (hudEnabled) {
    // 文案占位符填空串:任务文案由 __NOVVY_UI__ 在运行时套用,壳跨任务字节
    // 一致(colorever 同构);资产占位符填最终引用。
    hudDom = fillHudHtml(readOverlay('hud', 'hud.html'), { titleLine1: '', titleLine2: '', ariaLabel: '' });
    if (optionalHudPortraits && config?.hud?.enabled !== true) {
      hudDom = hudDom.replace('id="novvy-training-hud"', 'id="novvy-training-hud" data-title-only')
        .replace(/<!--__HUD_PROGRESS_START__-->[\s\S]*?<!--__HUD_PROGRESS_END__-->/g, '');
    }
    for (const [side, source] of [['LEFT', media.hudLeft], ['RIGHT', media.hudRight]]) {
      const portrait = config?.hud?.enabled !== false && source;
      hudDom = optionalHudPortraits && !portrait
        ? hudDom.replace(new RegExp(`<img[^>]*src="__HUD_${side}_DRAGON__"[^>]*>`), '')
        : hudDom.replaceAll(`__HUD_${side}_DRAGON__`, source);
    }
    headStyles.push(`<style data-novvy-hud>${readOverlay('hud', 'hud.css')}</style>`);
    bodyScripts.push(`<script data-novvy-hud>${readOverlay('hud', 'hud.js')}</script>`);
    uiConfig.hud = {
      progressStart: 10,
      titleLine1: titlesEnabled ? String(config?.hud?.titleLine1 ?? '') : '',
      titleLine2: titlesEnabled ? String(config?.hud?.titleLine2 ?? '') : '',
      ariaLabel: String(config?.hud?.ariaLabel ?? ''),
    };
  }
  if (introEnabled) {
    const intro = introFiles();
    introDom = fillIntroHtml(intro.html, { ariaLabel: '' })
      .replaceAll('__NOVVY_INTRO_VIDEO__', media.introVideo)
      .replaceAll('__NOVVY_INTRO_POSTER__', media.introPoster);
    headStyles.push(`<style data-novvy-intro>${intro.css}</style>`);
    bodyScripts.push(`<script data-novvy-intro>${intro.script}</script>`);
    // 倒计时钩子与 GO 按钮(素材自可选实现):goEnabled 开启后,片尾 3-2-1
    // 倒计时下方亮一行钩子文案(未显式配置时取 HUD 标题),倒计时结束后不再
    // 直接进试玩,底部先亮 GO 按钮等点击。未开启时两者不注入,行为与旧版一致。
    const goEnabled = config?.intro?.goEnabled === true;
    const hookText = String(config?.intro?.hookText ?? '').trim()
      || (goEnabled ? [config?.hud?.titleLine1, config?.hud?.titleLine2].map(value => String(value ?? '').trim()).filter(Boolean).join(' ') : '');
    uiConfig.intro = {
      ariaLabel: String(config?.intro?.ariaLabel ?? ''),
      hookText,
      goEnabled,
      goText: String(config?.intro?.goText ?? '').trim() || 'GO',
    };
  }
  if (backgroundEnabled) {
    bgDom = readOverlay('background', 'background.html').replaceAll('__NOVVY_BG_FILE__', media.background);
    headStyles.push(`<style data-novvy-bg>${readOverlay('background', 'background.css').replaceAll('__NOVVY_BG_FILE__', media.background)}</style>`);
  }
  if (ctaEnabled) {
    ctaDom = readOverlay('cta', 'cta.html').replaceAll('__CTA_ICON__', media.ctaIcon);
    // 壳层收缩:引导 footer(含「选择一个杯子…」状态行)与胜利结算浮层都不
    // 进终包的可见 UI——footer#hud 是基础包的标签名+id,加上标签限定避免误伤
    // novvy HUD;#win 保持 hidden 属性之外再压一层 display,防壳内 JS 翻面。
    headStyles.push('<style data-novvy-ws-shell>footer#hud{display:none!important}#win{display:none!important}</style>');
    headStyles.push(`<style data-novvy-cta>${readOverlay('cta', 'cta.css')}</style>`);
    bodyScripts.push(`<script data-novvy-cta>${readOverlay('cta', 'cta.js')}</script>`);
  }
  // 埋点组默认注入(colorever 同款契约):boot 缺文件直接抛错——埋点接线是
  // 模板的一部分,不允许静默打出空埋点包。boot 收尾 body,注册在壳 game.js
  // (defer)执行之前,壳的首个 novvy:hud-progress 不会漏接。
  // analytics=false 时整组跳过(纯净包形态,见函数头注释)。
  if (analytics) {
    headScripts.push(`<script data-novvy-analytics-lib>${fs.readFileSync(VENDOR_ANALYTICS, 'utf8')}</script>`);
    bodyScripts.push(`<script data-novvy-analytics>${readOverlay('analytics', 'boot.js')}</script>`);
  }

  // DOM 顺序 = 页面叠放顺序:背景垫底,然后 intro、HUD,CTA 最后(colorever 的
  // repack 把 CTA 放在 body 首位,这里沿用 ws 组的尾插约定;z-index 另有高低,
  // 顺序只决定无 z-index 时的兜底)。
  const bodyDom = [bgDom, introDom, hudDom, ctaDom].filter(Boolean);
  const uiScript = Object.keys(uiConfig).length > 0
    ? `<script>window.__NOVVY_UI__=${escapeInlineJson(uiConfig)};</script>`
    : '';

  return {
    hudEnabled,
    introEnabled,
    backgroundEnabled,
    ctaEnabled,
    analyticsEnabled: analytics,
    headStyles,
    headScripts,
    bodyDom,
    bodyScripts,
    uiScript,
  };
}
