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

// 把 playable（aplv 单文件）+ 片头覆盖层 + 三座共享桥组装成最终 index.html。
// 注入纪律与 colorever-new/escape-arrow 同源：段桥最先（声明段链与首段
// setStage）、转化桥最后；playable 本体除锚点拼接外一字节不改。
export function originHtml({ root, overlaysRoot, template, config, media = {}, preview = false }) {
  let html = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  const sourceSha = template.constants?.sourceSha256;
  if (sourceSha && hash(html) !== sourceSha) throw new Error('Colorever Origin playable 与清单 sha 不符，请重新 npm run build');
  for (const anchor of [HEAD, BODY_END]) if (html.split(anchor).length !== 2) throw new Error(`Colorever Origin playable 缺少唯一锚点 ${anchor}`);

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
  return { html, stageChain, policy, introEnabled: injection.introEnabled };
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
