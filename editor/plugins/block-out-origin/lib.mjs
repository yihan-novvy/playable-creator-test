import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildWsOverlayInjection } from '../../core/lib/ws-overlays.mjs';
import { normalizeCtaPolicy } from '../../core/lib/helpers.mjs';
import { effectiveConfig } from '../../core/runner.mjs';
import { taskGeneratedDir, taskUploadsDir } from '../../lib/paths.mjs';

const inline = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const script = (tag, source) => `<script data-novvy-${tag}>${source.replace(/<\/script/gi, '<\\/script')}</script>`;
export function ctaPolicy(raw) {
  const normalized = normalizeCtaPolicy(raw, 'steps');
  return { mode: normalized.mode, afterSteps: normalized.afterSteps,
    intervals: (Array.isArray(raw?.intervals) ? raw.intervals : []).filter(n => Number.isInteger(n) && n >= 1 && n <= 99).slice(0, 24) };
}

export function blockOutHtml({ root, overlaysRoot, template, config, media = {}, preview = false }) {
  const read = file => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    if (createHash('sha256').update(content).digest('hex') !== template.fileHashes?.[file]) throw new Error(`Block Out 产物校验失败，请重新 build: ${file}`);
    return content;
  };
  let html = read(template.game.indexHtml);
  const assetsJs = read(template.game.assetsJs), coreJs = read(template.game.coreJs);
  const pluginDir = overlaysRoot || path.resolve(root, '../../plugins/block-out-origin');
  const injection = buildWsOverlayInjection({ overlaysRoot: pluginDir, template, config, media, optionalHudPortraits: true, analytics: false });
  const stageChain = [...(injection.introEnabled ? ['video'] : []), 'playable'];
  const policy = ctaPolicy(config.playableCta);
  const settings = { intro: injection.introEnabled, title: injection.hudEnabled, totalBlocks: template.blockCounts.reduce((a, b) => a + b, 0), policy };
  const readEngine = name => fs.readFileSync(path.join(pluginDir, template.overlays.engine, name), 'utf8');
  const boot = [
    ...injection.bodyDom, injection.uiScript,
    '<button id="novvy-cta" data-novvy-click-source="cta_click" type="button" aria-label="Download Block Out">Play Now</button>',
    '<button id="block-out-sound" type="button" aria-label="Unmute sound">Sound off</button>',
    script('block-out-config', `window.__novvyStageChain__=${inline(stageChain)};window.__BLOCK_OUT_CONFIG__=${inline(settings)};`),
    script('playable-bridge', readEngine('events.js')),
    script('block-out-engine', readEngine('engine.js')),
    ...injection.bodyScripts,
    preview ? script('block-out-assets', assetsJs) : '<script src="assets.js"></script>',
    preview ? script('block-out-core', coreJs) : '<script src="core.js"></script>',
  ].filter(Boolean).join('\n');
  if (html.split('<!--BLOCK_OUT_BOOT-->').length !== 2) throw new Error('Block Out boot anchor missing');
  html = html.replace(/<!--BLOCK_OUT_BOOT-->[\s\S]*?<!--BLOCK_OUT_BOOT_END-->/, () => boot);
  html = html.replace('</head>', () => [...injection.headStyles,
    `<style data-novvy-block-out-shell>
      #preloader{z-index:5}canvas{touch-action:none}
      #novvy-cta{position:fixed;z-index:15;bottom:max(14px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);padding:12px 38px;border:2px solid #c8ffb1;border-radius:16px;background:#62c437;color:white;font:bold 20px Arial;box-shadow:0 4px 0 #31871c;cursor:pointer;touch-action:manipulation}
      #block-out-sound{position:fixed;z-index:15;right:10px;top:max(10px,env(safe-area-inset-top));padding:7px 10px;border:1px solid #ffffff70;border-radius:20px;color:white;background:#173a6770;font:12px Arial;cursor:pointer}
      #novvy-cta[hidden],#block-out-sound[hidden]{display:none}
    </style>`, '</head>'].join('\n'));
  return { html, assetsJs, coreJs, stageChain, policy, introEnabled: injection.introEnabled };
}

export function previewHtml({ plugin: entry, task, taskId }) {
  const config = effectiveConfig(entry.template, task.config);
  const hasVideo = fs.existsSync(path.join(taskUploadsDir(taskId), 'intro-video.mp4'));
  const hasPoster = fs.existsSync(path.join(taskGeneratedDir(taskId), 'poster.webp'));
  return blockOutHtml({ root: entry.templateDir, overlaysRoot: entry.dir, template: entry.template, config, preview: true,
    media: { introVideo: hasVideo ? `/project/${taskId}/uploads/intro-video.mp4` : null, introPoster: hasPoster ? `/project/${taskId}/generated/poster.webp` : null } }).html;
}
