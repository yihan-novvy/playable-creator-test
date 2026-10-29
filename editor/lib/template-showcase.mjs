import { getEntry, getLib } from '../core/registry.mjs';
import { effectiveConfig } from '../core/runner.mjs';
import { originHtml } from '../core/lib/origin-playable.mjs';
import { fixedViewportHtml } from '../core/lib/fixed-viewport.mjs';

// Deliberately curated: retired templates and unrelated games stay out of this gallery.
export const SHOWCASE_IDS = new Set([
  'colorever-new', 'colorever-origin', 'escape-arrow', 'dragon-cube',
  'block-out-origin', 'freecell-origin', 'grill-sort-origin', 'tasty-travels-origin',
]);

export async function showcasePreview(templateId, searchParams) {
  if (!SHOWCASE_IDS.has(templateId)) {
    throw Object.assign(new Error('该模板不在展示范围内'), { statusCode: 404 });
  }
  const entry = getEntry(templateId);
  const lib = await getLib(entry);
  const config = effectiveConfig(entry.template, {
    intro: { enabled: false }, outro: { enabled: false },
    hud: { enabled: false, titleEnabled: false }, background: { enabled: false },
    secondPlayable: { enabled: false }, cta: { enabled: false, endMask: false },
    playableCta: { mode: 'complete' },
  });
  const options = {
    root: entry.templateDir, overlaysRoot: entry.dir, pluginDir: entry.dir,
    template: entry.template, config, media: {}, preview: true,
  };
  let built;
  if (templateId === 'colorever-new') {
    const requested = searchParams.get('pattern');
    if (requested) {
      if (!lib.patterns(entry.templateDir, entry.template).some(p => p.id === requested)) {
        throw Object.assign(new Error('未知图案'), { statusCode: 400 });
      }
      config.patternId = requested;
    }
    const { level } = await lib.coloreverLevel(entry.templateDir, config, entry.template);
    built = await lib.coloreverHtml({ ...options, level });
  } else if (templateId === 'colorever-origin') {
    built = lib.originHtml(options);
  } else if (templateId === 'dragon-cube' || templateId === 'escape-arrow') {
    const levelId = Number(searchParams.get('level') || 1);
    const max = templateId === 'dragon-cube' ? 10 : 100;
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > max) {
      throw Object.assign(new Error(`请选择第 1–${max} 关`), { statusCode: 400 });
    }
    config.levelId = levelId;
    built = templateId === 'dragon-cube'
      ? lib.dragonHtml({ ...options, level: lib.dragonLevel(entry.templateDir, levelId) })
      : lib.escapeHtmlPage({ ...options, level: lib.escapeLevel(entry.templateDir, levelId) });
  } else if (templateId === 'block-out-origin') {
    built = lib.blockOutHtml(options);
  } else {
    built = originHtml(options);
  }
  // This is a task-free demo: builders receive no project directory or uploaded media.
  return fixedViewportHtml(built.html);
}
