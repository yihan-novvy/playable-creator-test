import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Text-placeholder substitution for the overlay HTML templates. The four
// ASSET placeholders (__HUD_LEFT_DRAGON__ / __HUD_RIGHT_DRAGON__ /
// __NOVVY_INTRO_VIDEO__ / __NOVVY_INTRO_POSTER__) stay in repack.mjs; this
// module only handles user-provided copy, with strict HTML escaping because
// the values land inside aria="..." attributes and <div> text of the Cocos
// host document.
//
//   node fill-overlays.mjs --overlays-root <dir> --hud-title-line1 "..." \
//     --hud-title-line2 "..." --hud-aria "..." --intro-aria "..."

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function fillHudHtml(templateHtml, { titleLine1, titleLine2, ariaLabel }) {
  return templateHtml
    .replaceAll('__HUD_ARIA_LABEL__', escapeHtml(ariaLabel))
    .replaceAll('__HUD_TITLE_LINE1__', escapeHtml(titleLine1))
    .replaceAll('__HUD_TITLE_LINE2__', escapeHtml(titleLine2));
}

export function fillIntroHtml(templateHtml, { ariaLabel }) {
  return templateHtml.replaceAll('__NOVVY_INTRO_ARIA__', escapeHtml(ariaLabel));
}

// CLI mode: fill overlay HTML files in a pack workspace.
export function main(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) throw new Error(`Unexpected argument: ${argv[i]}`);
    flags[argv[i].slice(2)] = argv[i + 1];
  }
  if (!flags['overlays-root']) throw new Error('Missing --overlays-root');
  const hudPath = path.join(flags['overlays-root'], 'hud', 'hud.html');
  const introPath = path.join(flags['overlays-root'], 'intro', 'intro.html');
  if (fs.existsSync(hudPath)) {
    fs.writeFileSync(
      hudPath,
      fillHudHtml(fs.readFileSync(hudPath, 'utf8'), {
        titleLine1: flags['hud-title-line1'] ?? '',
        titleLine2: flags['hud-title-line2'] ?? '',
        ariaLabel: flags['hud-aria'] ?? '',
      }),
    );
  }
  if (fs.existsSync(introPath)) {
    fs.writeFileSync(
      introPath,
      fillIntroHtml(fs.readFileSync(introPath, 'utf8'), {
        ariaLabel: flags['intro-aria'] ?? '',
      }),
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
