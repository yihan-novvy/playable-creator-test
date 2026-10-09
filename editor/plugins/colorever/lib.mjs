import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { normalizeCtaPolicy } from '../../core/lib/helpers.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

import { taskGameScript, embeddedAudio } from './music.mjs';

const SCRIPT = '<script src="game.js" defer></script>';
const hash = (text) => createHash('sha256').update(text).digest('hex');

function catalogFile(root, template) {
  return path.join(root, template.patterns?.catalog || 'game/patterns/catalog.json');
}

function artifact(root, template) {
  const built = JSON.parse(fs.readFileSync(catalogFile(root, template), 'utf8'));
  if (built.version !== 2 || !Array.isArray(built.patterns) || typeof built.levelEngine !== 'string' || !/^[-a-z0-9]+\.mjs$/.test(built.levelEngine) || hash(fs.readFileSync(path.join(root, 'game/game.js'))) !== built.engineSha256) throw new Error('Colorever 构建产物不完整，请从源项目重新 build:template');
  return built;
}

export function coloreverPatterns(root, template) {
  return artifact(root, template).patterns.map(({ id, name, description }) => ({ id, name, description }));
}

// 任务级开局参数：做广告时才决定开局模式与随机种子；非法值回退默认，
// 与 normalizeCtaPolicy 同一套纪律。easy=整块搬运(验证 ≤6 步完成)。
export function normalizeOpening(raw) {
  const mode = ['easy', 'medium', 'scattered'].includes(raw?.mode) ? raw.mode : 'easy';
  const difficulty = Number.isInteger(raw?.difficulty) && raw.difficulty >= 1 && raw.difficulty <= 100 ? raw.difficulty : 21;
  const seed = Number.isInteger(raw?.seed) && raw.seed >= 0 && raw.seed <= 2147483647 ? raw.seed : 1;
  return { mode, difficulty, seed };
}

// 开局引擎由 build:template 随产物导出(catalog sha 锁定)。按 mtime 缓存
// import,模板重建后自动换新;校验失败必须阻断交付而非静默回退。
const engineCache = new Map();
async function levelEngine(root, template) {
  const built = artifact(root, template);
  const file = path.join(root, 'game', built.levelEngine);
  if (!fs.existsSync(file)) throw new Error('缺少开局引擎，请从源项目重新 build:template');
  const key = `${file}:${fs.statSync(file).mtimeMs}`;
  if (!engineCache.has(key)) {
    engineCache.set(key, (async () => {
      if (hash(fs.readFileSync(file)) !== built.levelEngineSha256) throw new Error('开局引擎与构建产物不匹配，请从源项目重新 build:template');
      return import(pathToFileURL(file).href);
    })());
  }
  return engineCache.get(key);
}

export async function coloreverLevel(root, config, template) {
  const id = config?.patternId ?? 'cat', picture = artifact(root, template).patterns.find((p) => p.id === id);
  if (!picture) throw new Error('未知已构建图案: ' + id);
  if (!/^[a-z][a-z0-9-]*\.json$/.test(picture.level)) throw new Error('无效的构建图案路径');
  const text = fs.readFileSync(path.join(root, 'game/patterns', picture.level), 'utf8');
  if (hash(text) !== picture.templateSha256) throw new Error('图案模板数据已改变，请在 colorever 中修改并重新构建');
  const pattern = JSON.parse(text);
  if (Array.isArray(pattern.opening)) throw new Error('构建产物携带固定开局，请从源项目重新 build:template');
  const engine = await levelEngine(root, template);
  const opening = normalizeOpening(config?.opening);
  // 开局模式+打散+种子全部来自任务配置;prepareLevel 生成开局并以真实解法
  // 回放验证,失败即拒绝(带可行动的错误信息)。
  const { level, proof } = engine.prepareLevel({ ...pattern, openingMode: opening.mode, difficulty: opening.difficulty, seed: opening.seed });
  return { level, proof, patternId: id, opening };
}

// CTA 时机策略(两关同构):实现上收到 core/lib/helpers.mjs 供各模板共享,
// 这里保留 re-export 兼容既有引用。
export { normalizeCtaPolicy };

// 双 playable 数据:仅在片尾已启用(存在片尾视频才算)时允许,否则视为未配置。
// 第二关数据全量内联进 index.html,打包文件列表不变。第二关开局同样由任务配置。
export async function coloreverPhase2(root, config, template, outroActive) {
  if (!outroActive || config?.secondPlayable?.enabled !== true) return null;
  const { level, patternId } = await coloreverLevel(root, { ...config, patternId: config.secondPlayable.patternId ?? 'house', opening: config.secondPlayable?.opening }, template);
  const title = config.secondPlayable?.hud;
  const hud = { titleLine1: title?.titleEnabled === false ? '' : String(title?.titleLine1 ?? level.name), titleLine2: title?.titleEnabled === false ? '' : String(title?.titleLine2 ?? '') };
  return { patternId, level, hud, cta: normalizeCtaPolicy(config.secondPlayable?.cta, 'steps') };
}

const inline = (value) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

export async function coloreverHtml({ root, overlaysRoot, template, level, config, media = {}, preview = false, gameScriptUrl = null }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  for (const anchor of [SCRIPT, '</head>', '<body>', '</body>']) if (html.split(anchor).length !== 2) throw new Error(`Colorever New 基础壳缺少唯一锚点 ${anchor}`);
  const url = '';
  // ws 组不感知 colorever 卡片:它的 cta 组是 water-sort 专用(还带 footer#hud
  // 壳层收缩样式),colorever 的自有卡片走 core/overlays/cta-card(下方注入),
  // 因此传给 ws 组的 media 始终剥掉 ctaIcon。
  const wsMedia = { ...media, ctaIcon: null };
  const outroEnabled = config?.outro?.enabled === true && !!media.outroVideo;
  const phase2 = await coloreverPhase2(root, config, template, outroEnabled);
  // Keep the title shell available when only the second playable needs a title.
  const firstTitleEnabled = config?.hud?.titleEnabled ?? [config?.hud?.titleLine1, config?.hud?.titleLine2].some(value => String(value ?? '').trim());
  const overlayConfig = phase2 ? { ...config, hud: { ...config.hud, titleEnabled: true, titleLine1: firstTitleEnabled ? config?.hud?.titleLine1 : '', titleLine2: firstTitleEnabled ? config?.hud?.titleLine2 : '' } } : config;
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config: overlayConfig, media: wsMedia, optionalHudPortraits: true, analytics: false });
  // 自有下载卡随包(服务零 UI 侵入契约:结算 UI 由素材自带):底部常驻条 +
  // 双 playable CTA 时刻的全屏接管,由桥的 novvy:cta-card 事件驱动显示。
  // 图标是插件资产(overlays/cta/icon.png),预览走 /plugins/ 静态路由,
  // 打包是 index.html 的兄弟文件 app-icon.png。
  const ctaCardEnabled = config?.cta?.enabled !== false && !!media.ctaIcon;
  injection.ctaCardEnabled = ctaCardEnabled;
  if (ctaCardEnabled) {
    const cardDir = fileURLToPath(new URL('../../core/overlays/cta-card/', import.meta.url));
    const readCard = name => fs.readFileSync(path.join(cardDir, name), 'utf8');
    const iconUrl = String(media.ctaIcon).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    injection.headStyles.push(`<style data-novvy-cta-card>${readCard('cta-card.css')}</style>`);
    injection.bodyDom.push(readCard('cta-card.html').replaceAll('__CTA_ICON__', iconUrl).replaceAll('__CTA_NAME__', 'Colorever'));
    injection.bodyScripts.push(`<script data-novvy-cta-card>${readCard('cta-card.js')}</script>`);
  }
  // 转化桥永远注入:胜利/片尾/CTA 时刻的转化时序 + 卡片显示事件的派发源 +
  // 服务结算时刻上报(showEndCard)。桥文件在 core/overlays 共享(colorever/
  // dragon-cube 同一份),占位符在注入时替换成本模板的 URL 变量名;排在卡片
  // 脚本之后,保证亮卡事件不会先于卡片监听注册。
  const bridgeFile = fileURLToPath(new URL('../../core/overlays/cta-bridge/cta-bridge.js', import.meta.url));
  const bridge = fs.readFileSync(bridgeFile, 'utf8').replaceAll('__CTA_URL_KEY__', '__COLOREVER_CTA_URL__');
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
  const background2Enabled = phase2 !== null && config?.secondPlayable?.background?.enabled === true && !!media.background2;
  if (phase2) {
    const backgroundRoot = path.join(overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template.overlays.background);
    injection.bodyScripts.push(`<script data-novvy-phase2-background>${fs.readFileSync(path.join(backgroundRoot, 'background.js'), 'utf8')}</script>`);
    if (background2Enabled) {
      const imageUrl = media.background2.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      injection.headStyles.push(`<link rel="preload" as="image" href="${imageUrl}">`);
      injection.bodyDom.push('<div id="novvy-dom-bg2" hidden aria-hidden="true"></div>');
      const css = fs.readFileSync(path.join(backgroundRoot, 'background.css'), 'utf8').replaceAll('#novvy-dom-bg', '#novvy-dom-bg2').replaceAll('__NOVVY_BG_FILE__', media.background2);
      injection.headStyles.push(`<style data-novvy-bg2>${css}#novvy-dom-bg2[hidden]{display:none}.novvy-phase2,.novvy-phase2 body,.novvy-phase2 .app{background:transparent}</style>`);
    }
  }
  injection.background2Enabled = background2Enabled;
  const ctaPolicy = injection.outroEnabled ? null : normalizeCtaPolicy(config?.playableCta, 'complete');
  const portraitHudEnabled = injection.hudEnabled && config?.hud?.enabled === true;
  // 底部卡在画布上方叠放,开启时画布上移留出卡位,托盘不被卡片盖住。
  const top = portraitHudEnabled ? '.18' : '0', bottom = injection.ctaCardEnabled ? '.16' : '0';
  // Only hex colors enter CSS; legacy/invalid values use the existing palette.
  const color = (key, fallback) => /^#[0-9a-f]{6}$/i.test(config?.hud?.[key] ?? '') ? config.hud[key] : fallback;
  const nativeColors = `--colorever-progress-text:${color('progressTextColor','#326b83')};--colorever-progress-fill:${color('progressFillColor','#329fc2')};--colorever-progress-track:${color('progressTrackColor','#dff3fc')}`;
  const overlayColors = `--colorever-progress-text:${color('progressTextColor','#ffffff')};--colorever-progress-fill:${color('progressFillColor','#ffd91e')};--colorever-progress-track:${color('progressTrackColor','#b7834a')}`;
  injection.headStyles.push(`<style data-colorever-progress>.app{${nativeColors}}.app>.hud{top:15%;color:var(--colorever-progress-text)}.app progress{accent-color:var(--colorever-progress-fill);background:var(--colorever-progress-track)}.app progress::-webkit-progress-bar{background:var(--colorever-progress-track)}.app progress::-webkit-progress-value{background:var(--colorever-progress-fill)}.app progress::-moz-progress-bar{background:var(--colorever-progress-fill)}#novvy-training-hud{${overlayColors}}</style>`);
  const styles = `<style data-colorever-shell>.app{z-index:1;position:fixed;top:calc(100svh * ${top});width:min(100vw,calc(100svh * (1 - ${top} - ${bottom}) * .558824));left:50%;transform:translateX(-50%)}${injection.backgroundEnabled ? ':root:not(.novvy-phase2),:root:not(.novvy-phase2) body,:root:not(.novvy-phase2) .app{background:transparent}' : ''}${portraitHudEnabled ? '.app>.hud{visibility:hidden}' : ''}#win{display:none!important}</style>`;
  const data = `<script>window.__COLOREVER_PATTERN_ID__=${inline(config?.patternId ?? 'cat')};window.__COLOREVER_LEVEL__=${inline(level)};window.__COLOREVER_CTA_URL__=${inline(url)};window.__novvyOutroEnabled=${injection.outroEnabled};window.__novvyTwoPhase=${phase2 !== null};window.__COLOREVER_CTA_POLICY__=${inline(ctaPolicy)};window.__COLOREVER_PHASE2__=${inline(phase2)};</script>`;
  html = html.replace('</head>', () => `${[...injection.headStyles, styles, ...injection.headScripts].join('\n')}</head>`)
    .replace(SCRIPT, () => `${injection.uiScript}${data}${preview ? `<script src="${gameScriptUrl || `/templates/${template.id}/game/game.js`}" defer></script>` : SCRIPT}`)
    .replace('<body>', () => `<body>${injection.bodyDom.join('\n')}`)
    .replace('</body>', () => `${injection.bodyScripts.join('\n')}</body>`);
  return { html, injection };
}

// 在线试玩预览（server /api/tasks/:id/preview 的插件钩子）。
export async function previewHtml({ plugin: entry, task, taskId }) {
  const root = entry.templateDir;
  const config = effectiveConfig(entry.template, task.config);
  const { level } = await coloreverLevel(root, config, entry.template);
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
    // CTA 图标是插件自带文件(非任务产物),按 /plugins/ 绝对 URL 注入。
    ctaIcon: config.cta?.enabled !== false && entry.template.overlays?.cta && fs.existsSync(path.join(entry.dir, entry.template.overlays.cta, 'icon.png'))
      ? `/plugins/${entry.id}/${entry.template.overlays.cta}/icon.png` : null,
  };
  return (await coloreverHtml({ root, overlaysRoot: entry.dir, template: entry.template, level, config, preview: true, media, gameScriptUrl: config.music?.source === 'custom' ? `/api/tasks/${taskId}/preview-game.js` : null })).html;
}

export { coloreverPatterns as patterns };

export function previewScript({ plugin: entry, task, taskId }) {
  artifact(entry.templateDir, entry.template);
  return taskGameScript(entry.templateDir, task.config, path.join(taskUploadsDir(taskId), 'background-music.mp3'));
}

export function previewMusic(script) {
  return Buffer.from(embeddedAudio(script).audio.bgm, 'base64');
}
