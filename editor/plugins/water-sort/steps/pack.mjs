import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildWsOverlayInjection } from '../../../core/lib/ws-overlays.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';

export function prerequisites(config) {
  const generated = ['level.json', 'background.webp'];
  const uploads = [];
  if (config?.hud?.enabled !== false) generated.push('hud-left.webp', 'hud-right.webp');
  if (config?.intro?.enabled !== false) {
    uploads.push('intro-video');
    generated.push('poster.webp', 'intro-video.mp4');
  }
  return { uploads, generated };
}

// 壳契约:game.js 以带 defer 的经典标签加载——经典(file:// 直开不被 CORS 拦),
// defer 保证 head 里执行时 body 已就绪;前面的内联关卡脚本仍先于它运行。
const WS_SHELL_SCRIPT_TAG = '<script src="game.js" defer></script>';

// water-sort 无 Cocos 引擎,但带 colorever 同款三组 overlay(HUD/开场视频/
// DOM 背景):pack = 模板基础包 + 内联关卡 + overlay 注入 + 媒体兄弟文件。
// 基础包没有任何运行时 fetch(file:// 直开是硬要求),关卡以
// window.__WATER_SORT_LEVEL__ 内联注入到 game.js 标签之前,而不是文件替换。
export async function run(ctx) {
  const { config } = ctx;
  const levelPath = path.join(ctx.generatedDir, 'level.json');
  const posterPath = path.join(ctx.generatedDir, 'poster.webp');
  const backgroundPath = path.join(ctx.generatedDir, 'background.webp');
  const hudLeftPath = path.join(ctx.generatedDir, 'hud-left.webp');
  const hudRightPath = path.join(ctx.generatedDir, 'hud-right.webp');
  // 打包发的是 intro 步骤转码出的 540p 产物(上传原片不进包)。
  const introVideoPath = path.join(ctx.generatedDir, 'intro-video.mp4');
  const hudEnabled = config.hud?.enabled !== false;
  const introEnabled = config.intro?.enabled !== false;
  // CTA 叠层(含胜利跳转/自动重开)默认开启;图标随插件交付,无任务前置产物。
  const ctaOverlayDir = ctx.template.overlays?.cta;
  const ctaIconPath = ctaOverlayDir ? path.join(ctx.pluginDir, ctaOverlayDir, 'icon.png') : null;
  const ctaEnabled = config.cta?.enabled !== false && Boolean(ctaIconPath && fs.existsSync(ctaIconPath));
  const prereqs = [levelPath, backgroundPath];
  if (hudEnabled) prereqs.push(hudLeftPath, hudRightPath);
  if (introEnabled) prereqs.push(ctx.uploads['intro-video'], introVideoPath, posterPath);
  requireFiles(prereqs);
  const levelText = fs.readFileSync(levelPath, 'utf8');
  // 作者可控字段(关卡名等)直接进内联脚本,必须防 </script> 与行分隔符逃逸。
  const levelJson = JSON.stringify(JSON.parse(levelText))
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
  const levelInjection = `<script>window.__WATER_SORT_LEVEL__=${levelJson};</script>`;

  const injection = buildWsOverlayInjection({
    overlaysRoot: ctx.pluginDir,
    template: ctx.template,
    config,
    media: {
      hudLeft: hudEnabled ? 'hud-left.webp' : null,
      hudRight: hudEnabled ? 'hud-right.webp' : null,
      introVideo: introEnabled ? 'tail-ad-video.mp4' : null,
      introPoster: introEnabled ? 'poster.webp' : null,
      background: 'background.webp',
      ctaIcon: ctaEnabled ? 'app-icon.png' : null,
    },
  });

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'water-sort-pack-'));
  try {
    // 1. 模板只读:拷进工作区再改(templates 永远不落笔)。
    const wsGame = path.join(workspace, 'game');
    fs.cpSync(path.join(ctx.templateRoot, 'game'), wsGame, { recursive: true });

    // 2. 媒体兄弟文件:DOM 级引用(<img>/<video>/CSS url)按平铺文件发布,
    //    与 colorever 的交付布局同名(tail-ad-video.mp4 沿用埋点素材名)。
    fs.copyFileSync(backgroundPath, path.join(wsGame, 'background.webp'));
    if (hudEnabled) {
      fs.copyFileSync(hudLeftPath, path.join(wsGame, 'hud-left.webp'));
      fs.copyFileSync(hudRightPath, path.join(wsGame, 'hud-right.webp'));
    }
    if (introEnabled) {
      fs.copyFileSync(introVideoPath, path.join(wsGame, 'tail-ad-video.mp4'));
      fs.copyFileSync(posterPath, path.join(wsGame, 'poster.webp'));
    }
    if (ctaEnabled) {
      // 图标与 colorever 交付布局同名(app-icon.png)。
      fs.copyFileSync(ctaIconPath, path.join(wsGame, 'app-icon.png'));
    }

    // 3. 壳契约 + 注入:game.js 必须以经典标签加载(file:// 直开);锚点必须
    //    恰好出现一次才允许 splice,注入后不允许残留任何占位符。
    const shellPath = path.join(wsGame, 'index.html');
    let shell = fs.readFileSync(shellPath, 'utf8');
    for (const anchor of ['</head>', '<body>', '</body>']) {
      const count = shell.split(anchor).length - 1;
      if (count !== 1) throw new Error(`模板壳锚点 ${anchor} 出现 ${count} 次,拒绝注入`);
    }
    if (!shell.includes(WS_SHELL_SCRIPT_TAG)) {
      throw new Error('模板壳缺少 game.js 的经典 script 标签,模板包可能已漂移');
    }
    if (ctaEnabled) {
      // CTA 层的三个壳依赖:隐藏目标(footer#hud 引导条 / #win 结算浮层)与
      // 自动重开的注入点(#reset → game.reset())。缺一即视为模板漂移,拒绝
      // 静默打出「引导文案仍在/胜利无跳转」的包。
      for (const anchor of ['<footer id="hud">', 'id="win"', 'id="reset"']) {
        if (!shell.includes(anchor)) throw new Error(`模板壳缺少 CTA 层依赖的锚点 ${anchor},模板包可能已漂移`);
      }
    }
    if (/type="module"|crossorigin/.test(shell)) throw new Error('模板壳仍含 module/crossorigin 属性,模板包可能已漂移');
    shell = shell
      .replace('</head>', `${[...injection.headStyles, ...injection.headScripts].join('\n')}\n</head>`)
      // __NOVVY_UI__/关卡注入放 game.js 标签之前:defer 脚本在文档解析完后
      // 才执行,经典内联脚本此时早已就位。
      .replace(WS_SHELL_SCRIPT_TAG, `${injection.uiScript}${levelInjection}${WS_SHELL_SCRIPT_TAG}`)
      .replace('</body>', `${injection.bodyScripts.join('\n')}\n</body>`);
    const bodyDom = injection.bodyDom.join('\n');
    if (bodyDom) shell = shell.replace('<body>', `<body>\n${bodyDom}`);
    fs.writeFileSync(shellPath, shell);

    // 4. 发布到 result/。
    fs.rmSync(ctx.resultDir, { recursive: true, force: true });
    fs.cpSync(wsGame, ctx.resultDir, { recursive: true });

    // 5. 产物形状校验:壳契约、注入 marker、占位符残留、媒体文件缺一不可。
    const distShell = fs.readFileSync(path.join(ctx.resultDir, 'index.html'), 'utf8');
    if (fs.statSync(path.join(ctx.resultDir, 'game.js')).size === 0) throw new Error('打包产物 game.js 为空');
    if (!distShell.includes(WS_SHELL_SCRIPT_TAG)) throw new Error('dist 壳缺少 game.js 的经典 script 标签');
    if (/type="module"|crossorigin/.test(distShell)) throw new Error('dist 壳仍含 module/crossorigin 属性');
    if (!distShell.includes(levelInjection)) throw new Error('dist 壳缺少关卡注入脚本');
    if (fs.existsSync(path.join(ctx.resultDir, 'level.json'))) throw new Error('dist 不应包含 level.json(关卡已改为内联注入)');
    if (!distShell.includes(injection.uiScript)) throw new Error('dist 壳缺少 __NOVVY_UI__ 注入脚本');
    if (injection.hudEnabled && !distShell.includes('id="novvy-training-hud"')) throw new Error('dist 壳缺少 HUD overlay');
    if (injection.introEnabled && !distShell.includes('id="novvy-video-intro"')) throw new Error('dist 壳缺少开场视频 overlay');
    if (injection.backgroundEnabled && !distShell.includes('id="novvy-dom-bg"')) throw new Error('dist 壳缺少 DOM 背景层');
    if (injection.ctaEnabled) {
      if (!distShell.includes('id="novvy-cta"')) throw new Error('dist 壳缺少 CTA overlay');
      if (!distShell.includes('data-novvy-ws-shell')) throw new Error('dist 壳缺少壳层收缩样式(引导 footer/胜利浮层应被隐藏)');
      if (fs.statSync(path.join(ctx.resultDir, 'app-icon.png')).size === 0) throw new Error('打包产物 app-icon.png 为空');
    }
    // 埋点组永远随包:库(head)+ boot(body 末尾)缺一即拒,视频接线
    // (registerMedia + tail_ad_video)必须显式在 boot 里,防止回退成空埋点包。
    if (injection.analyticsEnabled) {
      if (!distShell.includes('<script data-novvy-analytics-lib>')) throw new Error('dist 壳缺少埋点库(head 内联)');
      if (!distShell.includes('<script data-novvy-analytics>')) throw new Error('dist 壳缺少埋点 boot(body 末尾)');
      if (!distShell.includes('registerMedia') || !distShell.includes('tail_ad_video')) throw new Error('dist 壳缺少开场视频埋点接线');
    }
    // 占位符残留用精确 token 清单(正则会误伤 window.__NOVVY_UI__ 本身)。
    const residual = ['__HUD_LEFT_DRAGON__', '__HUD_RIGHT_DRAGON__', '__NOVVY_INTRO_VIDEO__', '__NOVVY_INTRO_POSTER__', '__NOVVY_INTRO_ARIA__', '__NOVVY_BG_FILE__', '__CTA_ICON__']
      .filter((token) => distShell.includes(token));
    if (residual.length > 0) throw new Error(`dist 壳残留占位符: ${residual.join(', ')}`);
    for (const name of ['background.webp']) {
      if (fs.statSync(path.join(ctx.resultDir, name)).size === 0) throw new Error(`打包产物 ${name} 为空`);
    }
    const packageFiles = fs.readdirSync(ctx.resultDir).sort();
    const outputBytes = packageFiles.reduce((sum, name) => sum + fs.statSync(path.join(ctx.resultDir, name)).size, 0);
    const packedLevel = JSON.parse(levelText);
    return {
      metrics: {
        outputBytes,
        packageFiles,
        overlays: { hud: injection.hudEnabled, intro: injection.introEnabled, background: injection.backgroundEnabled, cta: injection.ctaEnabled, analytics: injection.analyticsEnabled },
        capacity: packedLevel.capacity,
        bottleCount: packedLevel.bottles.length,
        colorCount: Object.keys(packedLevel.colors).length,
      },
      warnings: [],
    };
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}
