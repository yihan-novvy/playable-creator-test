import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
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
  if (built.version !== 2 || !Array.isArray(built.patterns) || typeof built.levelEngine !== 'string' || !/^[-a-z0-9]+\.mjs$/.test(built.levelEngine) || hash(fs.readFileSync(path.join(root, 'game/game.js'))) !== built.engineSha256) throw new Error('Colorever 构建产物不完整，请从源项目重新 build:template');
  return built;
}

export function coloreverPatterns(root, template) {
  return artifact(root, template).patterns.map(({ id, name, description }) => ({ id, name, description }));
}

// 任务级开局参数：做广告时才决定开局模式与随机种子；非法值回退默认，
// 与 normalizeCtaPolicy 同一套纪律。easy=整块搬运(验证 ≤6 步完成)。
export function normalizeOpening(raw) {
  const mode = raw?.mode === 'scattered' ? 'scattered' : 'easy';
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

// CTA 时机策略(两关同构):complete=完成后跳转;steps=第 N 步跳转(N 不是上限,
// 图案先完成则在完成时兜底跳转)。非法配置回退默认。
export function normalizeCtaPolicy(raw, fallbackMode) {
  const mode = raw?.mode === 'steps' || raw?.mode === 'complete' ? raw.mode : fallbackMode;
  const afterSteps = Number.isInteger(raw?.afterSteps) && raw.afterSteps >= 1 && raw.afterSteps <= 99 ? raw.afterSteps : 8;
  return { mode, afterSteps };
}

// 双 playable 数据:仅在片尾已启用(存在片尾视频才算)时允许,否则视为未配置。
// 第二关数据全量内联进 index.html,打包文件列表不变。第二关开局同样由任务配置。
export async function coloreverPhase2(root, config, template, outroActive) {
  if (!outroActive || config?.secondPlayable?.enabled !== true) return null;
  const { level, patternId } = await coloreverLevel(root, { ...config, patternId: config.secondPlayable.patternId ?? 'house', opening: config.secondPlayable?.opening }, template);
  return { patternId, level, cta: normalizeCtaPolicy(config.secondPlayable?.cta, 'steps') };
}

const inline = (value) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

export async function coloreverHtml({ root, overlaysRoot, template, level, config, media = {}, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  for (const anchor of [SCRIPT, '</head>', '<body>', '</body>']) if (html.split(anchor).length !== 2) throw new Error(`Colorever New 基础壳缺少唯一锚点 ${anchor}`);
  const url = '';
  // 下载卡片不随包:结算卡片、点击上报与商店跳转由落地页打包服务的注入引擎
  // 负责(novvy_landing_page_service /api/interactive-zip/generate)。强制置空
  // ctaIcon,任务里遗留的 cta 配置不再能唤起卡片组。
  const mediaWithoutCard = { ...media, ctaIcon: null };
  const injection = buildWsOverlayInjection({ overlaysRoot: overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template, config, media: mediaWithoutCard, optionalHudPortraits: true, analytics: false });
  // 转化桥永远注入:游戏期下载按钮(#downloadBtn)+ 胜利/片尾转化时序 +
  // 注入引擎结算卡片显露(showEndCard)。旧 cta.js 的行为语义全部迁入桥内。
  const bridgeRoot = path.join(overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), 'overlays', 'cta-bridge');
  injection.bodyScripts.push(`<script data-novvy-cta-bridge>${fs.readFileSync(path.join(bridgeRoot, 'cta-bridge.js'), 'utf8')}</script>`);
  injection.outroEnabled = config?.outro?.enabled === true && !!media.outroVideo;
  if (injection.outroEnabled) {
    const outroRoot = path.join(overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id), template.overlays.outro);
    const read = name => fs.readFileSync(path.join(outroRoot, name), 'utf8');
    injection.headStyles.push(`<style data-novvy-outro>${read('outro.css')}</style>`);
    injection.bodyDom.push(read('outro.html').replaceAll('__NOVVY_OUTRO_VIDEO__', media.outroVideo));
    injection.bodyScripts.push(`<script data-novvy-outro>${read('outro.js')}</script>`);
  }
  // 双 playable:第二关数据与两关各自的 CTA 时机策略。第一关策略仅武装于
  // 无片尾场景(有片尾时第一关只负责引出片尾,转化由片尾链/第二关负责)。
  const phase2 = await coloreverPhase2(root, config, template, injection.outroEnabled);
  const ctaPolicy = injection.outroEnabled ? null : normalizeCtaPolicy(config?.playableCta, 'complete');
  const portraitHudEnabled = injection.hudEnabled && config?.hud?.enabled === true;
  // 下载卡片移除后,画布不再需要为底部卡片留白。
  const top = portraitHudEnabled ? '.18' : '0', bottom = '0';
  // Only hex colors enter CSS; legacy/invalid values use the existing palette.
  const color = (key, fallback) => /^#[0-9a-f]{6}$/i.test(config?.hud?.[key] ?? '') ? config.hud[key] : fallback;
  const nativeColors = `--colorever-progress-text:${color('progressTextColor','#326b83')};--colorever-progress-fill:${color('progressFillColor','#329fc2')};--colorever-progress-track:${color('progressTrackColor','#dff3fc')}`;
  const overlayColors = `--colorever-progress-text:${color('progressTextColor','#ffffff')};--colorever-progress-fill:${color('progressFillColor','#ffd91e')};--colorever-progress-track:${color('progressTrackColor','#b7834a')}`;
  injection.headStyles.push(`<style data-colorever-progress>.app{${nativeColors}}.app>.hud{top:15%;color:var(--colorever-progress-text)}.app progress{accent-color:var(--colorever-progress-fill);background:var(--colorever-progress-track)}.app progress::-webkit-progress-bar{background:var(--colorever-progress-track)}.app progress::-webkit-progress-value{background:var(--colorever-progress-fill)}.app progress::-moz-progress-bar{background:var(--colorever-progress-fill)}#novvy-training-hud{${overlayColors}}</style>`);
  const styles = `<style data-colorever-shell>.app{z-index:1;position:fixed;top:calc(100svh * ${top});width:min(100vw,calc(100svh * (1 - ${top} - ${bottom}) * .558824));left:50%;transform:translateX(-50%)}${injection.backgroundEnabled ? ':root,body,.app{background:transparent}' : ''}${portraitHudEnabled ? '.app>.hud{visibility:hidden}' : ''}#win{display:none!important}</style>`;
  const data = `<script>window.__COLOREVER_PATTERN_ID__=${inline(config?.patternId ?? 'cat')};window.__COLOREVER_LEVEL__=${inline(level)};window.__COLOREVER_CTA_URL__=${inline(url)};window.__novvyOutroEnabled=${injection.outroEnabled};window.__novvyTwoPhase=${phase2 !== null};window.__COLOREVER_CTA_POLICY__=${inline(ctaPolicy)};window.__COLOREVER_PHASE2__=${inline(phase2)};</script>`;
  html = html.replace('</head>', () => `${[...injection.headStyles, styles, ...injection.headScripts].join('\n')}</head>`)
    .replace(SCRIPT, () => `${injection.uiScript}${data}${preview ? `<script src="/templates/${template.id}/game/game.js" defer></script>` : SCRIPT}`)
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
  };
  return (await coloreverHtml({ root, overlaysRoot: entry.dir, template: entry.template, level, config, preview: true, media })).html;
}

export { coloreverPatterns as patterns };
