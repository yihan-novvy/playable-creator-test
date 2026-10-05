import fs from 'node:fs';
import path from 'node:path';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const WS_SHELL_SCRIPT_TAG = '<script src="game.js" defer></script>';
const WS_SHELL_STONE_URL = 'url(./stone.svg)';

// 构造 water-sort 试玩预览页:关卡以内联对象注入 window.__WATER_SORT_LEVEL__
// (游戏优先读它;内联脚本先于后面的 game.js 标签执行,顺序可靠),资源全部
// 改写为模板绝对路径,绕开文档相对路径(./game.js、url(./stone.svg))的解析。
// 基础包是经典脚本、无运行时 fetch(file:// 直开可用),不再有 level.json 请求。
export function previewHtml({ plugin: entry, task, taskId }) {
  const root = entry.templateDir;
  const template = entry.template;
  const config = effectiveConfig(template, task.config);
  let level = task.config?.level;
  if (!level || typeof level !== 'object' || Array.isArray(level)) {
    level = JSON.parse(fs.readFileSync(path.join(root, template.level?.assetPath || 'level.json'), 'utf8'));
  }
  // 作者可控字段(关卡名等)直接进内联脚本,必须防 </script> 与行分隔符逃逸。
  const levelJson = JSON.stringify(level)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
  const shell = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  if (!shell.includes(WS_SHELL_SCRIPT_TAG) || !shell.includes(WS_SHELL_STONE_URL)) {
    throw new Error('预览改写失败:模板壳缺少预期的 script/url 标记');
  }
  for (const anchor of ['</head>', '<body>', '</body>']) {
    const count = shell.split(anchor).length - 1;
    if (count !== 1) throw new Error(`模板壳锚点 ${anchor} 出现 ${count} 次,拒绝注入`);
  }
  const generated = (name) => path.join(taskGeneratedDir(taskId), name);
  const uploaded = (name) => path.join(taskUploadsDir(taskId), name);
  const projectUrl = (kind, name, version = '') =>
    `/project/${taskId}/${kind}/${name}${version ? `?v=${encodeURIComponent(version)}` : ''}`;
  const media = {
    hudLeft: fs.existsSync(generated('hud-left.webp')) ? projectUrl('generated', 'hud-left.webp') : null,
    hudRight: fs.existsSync(generated('hud-right.webp')) ? projectUrl('generated', 'hud-right.webp') : null,
    introVideo: fs.existsSync(uploaded('intro-video.mp4'))
      ? projectUrl('uploads', 'intro-video.mp4', task.uploads?.['intro-video']?.uploadedAt || '')
      : null,
    introPoster: fs.existsSync(generated('poster.webp')) ? projectUrl('generated', 'poster.webp') : null,
    background: fs.existsSync(generated('background.webp')) ? projectUrl('generated', 'background.webp') : null,
    // CTA 图标是插件自带文件(非任务产物),按 /plugins/ 绝对 URL 注入。
    ctaIcon: template.overlays?.cta && fs.existsSync(path.join(entry.dir, template.overlays.cta, 'icon.png'))
      ? `/plugins/${entry.id}/${template.overlays.cta}/icon.png`
      : null,
  };
  const injection = buildWsOverlayInjection({ overlaysRoot: entry.dir, template, config: task.config, media });
  let html = shell
    .replace('</head>', `${[...injection.headStyles, ...injection.headScripts].join('\n')}\n</head>`)
    .replace(
      WS_SHELL_SCRIPT_TAG,
      `${injection.uiScript}<script>window.__WATER_SORT_LEVEL__=${levelJson};</script><script src="/templates/${template.id}/game/game.js" defer></script>`,
    );
  const bodyDom = injection.bodyDom.join('\n');
  if (bodyDom) html = html.replace('<body>', `<body>\n${bodyDom}`);
  const bodyScripts = injection.bodyScripts.join('\n');
  if (bodyScripts) html = html.replace('</body>', `${bodyScripts}\n</body>`);
  return html;
}
