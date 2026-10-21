import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { normalizeCtaPolicy } from '../../core/lib/helpers.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const HEAD = '</head>';
const BODY_END = '</body>';
const inline = (value) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const hash = (text) => createHash('sha256').update(text).digest('hex');

// aplv 烘焙的 GlobalConfig 带"游戏获胜目标进度百分比":15（进度 15% 游戏就自己
// 跳转），会抢在转化时机之前按原版步数跳走。治理与 colorever-gemsort 的
// patchGlobalConfig 同语义，但走运行时改写（冻结文件一字节不改）：boot 前把
// window.__res 里的配置文本换成"解完才到"的阈值（棋盘全对=100%；99.99 高于
// 任意 n-1 中间态（n<10000 格），等于只在最后一手触发），关卡循环收敛到胜利关。
// 配置资产只在 __res 一份（__zip 内无同名文件），boot 是异步资源加载，body 末
// 的同步改写必然先于引擎读取。
function winConfigPatch(html) {
  const MARKER = '游戏获胜目标进度百分比';
  const markerAt = html.indexOf(MARKER);
  if (markerAt < 0) throw new Error('Colorever Origin 未找到 GlobalConfig 胜利阈值字段，拒绝打包（原版会提前抢跳）');
  // 值内转义的依赖路径（\"assets/…\"）会产生假键匹配：从最近的候选往前逐个
  // 试解析，第一个解出且含标记的才是真键。
  const candidates = [...html.matchAll(/"assets\/[^"]+\.json": "/g)].filter((match) => match.index < markerAt).reverse();
  for (const keyMatch of candidates) {
    const key = keyMatch[0].slice(1, -4); /* 尾部 ": " 共 4 字符（末位引号是值的开引号） */
    const valueStart = keyMatch.index + keyMatch[0].length;
    let valueEnd = valueStart + 1;
    while (true) {
      valueEnd = html.indexOf('"', valueEnd);
      let backslashes = 0;
      for (let p = valueEnd - 1; html[p] === '\\'; p -= 1) backslashes += 1;
      if (backslashes % 2 === 0) break;
      valueEnd += 1;
    }
    let text, packed;
    try {
      text = JSON.parse(html.slice(valueStart - 1, valueEnd + 1));
      if (!text.includes(MARKER)) continue;
      packed = JSON.parse(text);
    } catch { continue; }
    const payload = packed?.[5]?.[0]?.[2];
    if (!payload || !(MARKER in payload) || !('游戏获胜关卡条件' in payload)) throw new Error('Colorever Origin GlobalConfig 结构不符（packed[5][0][2]），拒绝补丁');
    payload['游戏获胜关卡条件'] = 1;
    payload[MARKER] = 99.99;
    if ('levelStart' in payload) payload.levelStart = 1;
    if ('levelEnd' in payload) payload.levelEnd = 1;
    return `<script data-novvy-origin-config>window.__res ? window.__res[${inline(key)}]=${inline(JSON.stringify(packed))} : console.error('[novvy-origin] window.__res 缺失,胜利阈值补丁未生效,原版会提前抢跳');</script>`;
  }
  throw new Error('Colorever Origin 无法定位 GlobalConfig 所属的 __res 键');
}

// CTA 时机策略（origin 专属，不动共享 normalizeCtaPolicy——dragon-cube/
// escape-arrow 注入 JSON 逐字节稳定的老约束）：steps 模式下首次第 afterSteps
// 步跳转，之后按 intervals 逐个间隔再跳；间隔表耗尽后全部按最后一个间隔循环
// （默认 10 → +5 → +4 → +3 → +2 → 之后每 2 步一次）。非法间隔逐项剔除；
// 剔空 = 只保留首跳。complete 模式无循环（完成时兜底跳转）。
export function originCtaPolicy(raw, fallbackMode = 'steps') {
  const policy = normalizeCtaPolicy(raw, fallbackMode);
  const intervals = (Array.isArray(raw?.intervals) ? raw.intervals : [])
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 99)
    .slice(0, 24);
  return { mode: policy.mode, afterSteps: policy.afterSteps, intervals };
}

// 循环节奏展开成触发点表（gap = 距上一次触发的间隔，供转化桥的
// detail.everySteps 循环语义使用；首跳 gap 取 intervals[0]）。cap 是防御性
// 上限：一次广告会话内 999 次有效操作不可达，表尾之后不再派发。
export function originCtaSchedule(policy, cap = 999) {
  if (!policy || policy.mode !== 'steps') return [];
  const intervals = Array.isArray(policy.intervals) ? policy.intervals : [];
  const gapAt = (index) => (index < intervals.length ? intervals[index] : intervals[intervals.length - 1] ?? 0);
  const schedule = [];
  let at = policy.afterSteps;
  for (let index = 0; at <= cap; index += 1) {
    schedule.push({ step: at, gap: gapAt(index) });
    const gap = gapAt(index);
    if (!(gap >= 1)) break;
    at += gap;
  }
  return schedule;
}

// 把 aplv 的可玩载荷（__zip 引擎 + __res 资产 + 启动链，约 2MB 的那个大
// 内联脚本）从文档里抽出来：pack 形态写成兄弟文件 game.js（与 gemsort/
// escape-arrow 的 game.js 同纪律——冻结 playable 载荷跨任务逐字节稳定，
// 广告逻辑迭代只动 index.html），预览形态保持内联（无静态路由可挂）。
// 抽取 = 定位含 window.__zip 的唯一 <script> 元素整体替换为
// <script src="game.js"></script>，执行位置与原内联脚本完全一致。
function extractPlayableScript(html) {
  const zipAt = html.indexOf('window.__zip');
  if (zipAt < 0) throw new Error('Colorever Origin 未找到可玩载荷（window.__zip），拒绝拆分');
  const scriptOpen = html.lastIndexOf('<script', zipAt);
  if (scriptOpen < 0) throw new Error('Colorever Origin 可玩载荷缺少 <script> 边界');
  const innerStart = html.indexOf('>', scriptOpen) + 1;
  const innerEnd = html.indexOf('</script>', zipAt);
  if (innerEnd < 0) throw new Error('Colorever Origin 可玩载荷缺少 </script> 边界');
  const tag = html.slice(scriptOpen, innerStart);
  if (!/^<script type="text\/javascript">$/.test(tag)) throw new Error(`Colorever Origin 可玩载荷脚本标签形态不符: ${tag}`);
  const gameJs = html.slice(innerStart, innerEnd);
  for (const marker of ['window.__res', 'super_boot_engine', 'bundle_gemsort']) {
    if (!gameJs.includes(marker)) throw new Error(`Colorever Origin 可玩载荷缺少结构标记 ${marker}，拒绝拆分`);
  }
  return { gameJs, start: scriptOpen, end: innerEnd + '</script>'.length };
}

// 把 playable（aplv 单文件）+ 片头覆盖层 + 三座共享桥组装成最终产物。
// pack 形态：index.html（壳 + 注入）+ game.js（可玩载荷）；预览形态：单文件内联。
// 注入纪律与 colorever-new/escape-arrow 同源：胜利阈值补丁最先（boot 前
// 改写 __res）、段桥先于业务脚本（声明段链与首段 setStage）、转化桥最后；
// playable 本体除"整体搬进 game.js"外一字节不改。
export function originHtml({ root, overlaysRoot, template, config, media = {}, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  const sourceSha = template.constants?.sourceSha256;
  if (sourceSha && hash(html) !== sourceSha) throw new Error('Colorever Origin playable 与清单 sha 不符，请重新 npm run build');
  for (const anchor of [HEAD, BODY_END]) if (html.split(anchor).length !== 2) throw new Error(`Colorever Origin playable 缺少唯一锚点 ${anchor}`);

  // 胜利阈值补丁必须先于拆分定位（标记在载荷里）；注入脚本运行时改写
  // window.__res，与载荷在哪个文件无关。
  const configScript = winConfigPatch(html);

  let gameJs = null;
  if (!preview) {
    const playable = extractPlayableScript(html);
    gameJs = playable.gameJs;
    html = html.slice(0, playable.start) + '<script src="game.js"></script>' + html.slice(playable.end);
  }

  // 片头组回落 core 三件套（插件不自带 overlays/intro）；hud/background/cta
  // 组的 media 恒为 null，天然不注入——CTA UI 由 playable 自带横幅承担。
  const pluginDir = overlaysRoot || path.resolve(root, '..', '..', 'plugins', template.id);
  const injection = buildWsOverlayInjection({ overlaysRoot: pluginDir, template, config, media, optionalHudPortraits: true, analytics: false });
  const stageChain = [...(injection.introEnabled ? ['video'] : []), 'playable'];
  const policy = originCtaPolicy(config?.playableCta, 'steps');
  const data = `<script>window.__novvyStageChain__=${inline(stageChain)};window.__novvyOutroEnabled=false;window.__NOVVY_CTA_END_MASK__=${inline(config?.cta?.endMask === true)};window.__ORIGIN_CTA_URL__='';window.__ORIGIN_CTA_POLICY__=${inline({ ...policy, schedule: originCtaSchedule(policy) })};</script>`;
  const readCore = (name) => fs.readFileSync(fileURLToPath(new URL(`../../core/overlays/${name}`, import.meta.url)), 'utf8');
  const engineFile = path.join(pluginDir, template.overlays.engine, 'engine.js');
  const bodyScripts = [
    configScript,
    injection.uiScript,
    data,
    `<script data-novvy-playable-bridge>${readCore('playable-bridge/playable-bridge.js')}</script>`,
    ...injection.bodyScripts,
    `<script data-novvy-origin-engine>${fs.readFileSync(engineFile, 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`,
    `<script data-novvy-cta-bridge>${readCore('cta-bridge/cta-bridge.js').replaceAll('__CTA_URL_KEY__', '__ORIGIN_CTA_URL__')}</script>`,
  ];
  const headExtra = injection.headStyles.join('\n')
    // aplv 自带开机 splash(#__bootcover,"Colorever"+转圈,z-index 2147483646)会
    // 盖在片头视频(intro 根层 z-index 20)上直到场景建好;广告形态里品牌由片头
    // 视频承担,整层隐藏(场景就绪前画布短暂空白,可接受)。
    + `<style data-novvy-origin-splash>#__bootcover{display:none!important}</style>`;
  const bodyExtra = [...injection.bodyDom, ...bodyScripts.filter(Boolean)].join('\n');
  html = html.replace(HEAD, () => headExtra ? `${headExtra}\n${HEAD}` : HEAD)
    .replace(BODY_END, () => bodyExtra ? `${bodyExtra}\n${BODY_END}` : BODY_END);
  return { html, gameJs, stageChain, policy, introEnabled: injection.introEnabled };
}

// 在线试玩预览（server /api/tasks/:id/preview 的插件钩子）。片头用上传原片
// + 海报产物，其余与打包同一条 originHtml 组装线。
export function previewHtml({ plugin: entry, task, taskId }) {
  const config = effectiveConfig(entry.template, task.config);
  const generated = (name) => fs.existsSync(path.join(taskGeneratedDir(taskId), name)) ? `/project/${taskId}/generated/${name}` : null;
  const intro = config.intro?.enabled === true;
  const media = {
    introVideo: intro && fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null,
    introPoster: intro ? generated('poster.webp') : null,
  };
  return originHtml({ root: entry.templateDir, overlaysRoot: entry.dir, template: entry.template, config, preview: true, media }).html;
}
