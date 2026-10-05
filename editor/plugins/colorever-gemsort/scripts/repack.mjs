import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locateZipPayload, locateResourceObject, readBundle } from '../lib/res-bundle.mjs';

// Parameterized port of the example's tools/repack-assets.mjs. The assembly
// logic (resource inlining, zip staging, overlay injection order and anchors)
// is kept byte-for-byte faithful so its output can be diffed against the
// known-good editable/index.html; only path discovery became explicit flags.
//
//   node repack.mjs --game <dir> --assets-root <dir> --overlays-root <dir> \
//     --hud-image-left <png> --hud-image-right <png> \
//     --intro-video <mp4> --intro-poster <jpg> --out <html>
//
// --game holds index.html + asset-manifest.json + zip-manifest.json.
// HUD is injected when overlays-root/hud exists and both image flags are set;
// CTA when overlays-root/cta exists and --cta-icon is set; intro when
// overlays-root/intro exists and both --intro-video/--intro-poster are set
// (mirrors the original's existsSync guards).
//
// Multi-file package mode (--package true) instead emits the delivery layout
// of docs/PLAYABLE_MATERIAL_SPECIFICATION.md next to --out:
//
//   index.html (thin shell)  game.js  materials.js  analytics.js
//   tail-ad-video.mp4  poster.jpg  app-icon.png  hud-left.webp  hud-right.webp
//   background.webp (DOM 背景层,由 --dom-bg-file 提供)
//
// game.js carries window.__zip plus the FIXED window.__res entries and is
// byte-stable across tasks; materials.js Object.assign()s the per-task
// variable entries listed in --materials (JSON array of resource keys). All
// of it loads via plain <script src> tags so file:// delivery (ZIP unpacked
// by the SDK, no remote requests, fetch/XHR blocked) keeps working. The
// embedded zip is staged with fixed mtimes so game.js is byte-identical
// between packs. Without these flags the legacy single-file inline output is
// produced unchanged.

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${argv[i]}`);
    flags[key.slice(2)] = argv[i + 1];
  }
  return flags;
}

function resolveFrom(flagValue, baseDir) {
  return path.resolve(baseDir, flagValue);
}

function assertSingleAnchor(source, anchor) {
  const first = source.indexOf(anchor);
  if (first === -1) throw new Error(`Template anchor not found: ${anchor}`);
  if (source.indexOf(anchor, first + 1) !== -1) {
    throw new Error(`Template anchor occurs more than once; injection would be ambiguous: ${anchor}`);
  }
}

// removeOnce(source, pattern, label) — delete exactly one regex-matched span.
// Like assertSingleAnchor, 0 or 2+ matches are a loud pack failure: the block
// patterns carry exact template tails, so drift (a refactored boot splash,
// say) must break the build, never ship silently.
function removeOnce(source, pattern, label) {
  const first = source.match(pattern);
  if (!first) throw new Error(`${label} not found; template drifted?`);
  const rest = source.slice(first.index + first[0].length);
  if (pattern.test(rest)) throw new Error(`${label} occurs more than once; removal would be ambiguous`);
  return `${source.slice(0, first.index)}${rest}`;
}

function stampTree(root, epoch) {
  fs.utimesSync(root, epoch, epoch);
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const child = path.join(root, entry.name);
    if (entry.isDirectory()) stampTree(child, epoch);
    else fs.utimesSync(child, epoch, epoch);
  }
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  const gameRoot = resolveFrom(flags.game, process.cwd());
  const assetsRoot = resolveFrom(flags['assets-root'], process.cwd());
  const overlaysRoot = flags['overlays-root'] ? resolveFrom(flags['overlays-root'], process.cwd()) : null;
  const outputPath = resolveFrom(flags.out, process.cwd());
  const analyticsPath = flags.analytics ? resolveFrom(flags.analytics, process.cwd()) : null;
  const packageMode = flags.package === 'true';
  if (packageMode && (!analyticsPath || !flags.materials)) {
    throw new Error('--package true requires --analytics <file> and --materials <json file>');
  }
  const materialsKeys = packageMode
    ? new Set(JSON.parse(fs.readFileSync(resolveFrom(flags.materials, process.cwd()), 'utf8')))
    : null;
  // Deliberately NO "externalize engine resources as sibling files" option:
  // under the file:// delivery mode (ZIP unpacked by the SDK) the WebGL
  // upload of a sibling image is rejected as cross-origin (texSubImage2D
  // SecurityError, Cocos error 16352), and engine text resources load through
  // the request shim, which would receive a path string instead of content.
  // Engine-consumed materials always ride inline in materials.js; only
  // DOM-level media (<img>/poster/video tags) may live as real files.
  // Package mode moves the per-task UI texts (HUD title lines, aria labels)
  // into materials.js so the shell stays byte-identical across tasks; the
  // overlay scripts apply them at boot. Absent → pack-time substitution
  // (legacy single-file behavior).
  const uiConfig = packageMode && flags['ui-config']
    ? JSON.parse(fs.readFileSync(resolveFrom(flags['ui-config'], process.cwd()), 'utf8'))
    : null;
  // DOM background layer: the per-task blurred background ships as a real
  // sibling file and is displayed by a fixed-position <div> BEHIND the
  // transparent canvas (the engine macro ENABLE_TRANSPARENT_CANVAS is
  // flipped at pack time by the runner). CSS/image loading is DOM-level, so
  // file:// delivery is safe; the engine never touches this file.
  const domBgFile = packageMode && flags['dom-bg-file']
    ? resolveFrom(flags['dom-bg-file'], process.cwd())
    : null;
  // { name, content } written verbatim; { name, copy } copied from disk.
  const siblingContents = [];
  const siblingCopies = [];
  if (!flags.game || !flags['assets-root'] || !flags.out) {
    throw new Error('Usage: repack.mjs --game <dir> --assets-root <dir> --out <file> [--overlays-root <dir>] [--hud-image-left <png>] [--hud-image-right <png>] [--pattern-ref <webp>] [--cta-icon <png>] [--intro-video <mp4>] [--intro-poster <jpg>] [--analytics <file>] [--package true] [--materials <json>] [--ui-config <json>] [--dom-bg-file <webp>]');
  }

  const templatePath = path.join(gameRoot, 'index.html');
  const manifest = JSON.parse(fs.readFileSync(path.join(gameRoot, 'asset-manifest.json'), 'utf8'));
  const zipEntries = JSON.parse(fs.readFileSync(path.join(gameRoot, 'zip-manifest.json'), 'utf8'));
  const { source, range } = readBundle(templatePath);
  for (const anchor of ['</head>', '<body>', '</body>']) {
    assertSingleAnchor(source, anchor);
  }
  const resources = {};

  for (const [resourcePath, metadata] of Object.entries(manifest)) {
    const filePath = path.join(assetsRoot, resourcePath);
    if (!fs.existsSync(filePath)) throw new Error(`Missing extracted resource: ${resourcePath}`);
    if (metadata.mode === 'text') {
      resources[resourcePath] = fs.readFileSync(filePath, 'utf8');
    } else {
      const data = fs.readFileSync(filePath);
      const charset = metadata.charset ? `;charset=${metadata.charset}` : '';
      if (metadata.base64) {
        resources[resourcePath] = `data:${metadata.mime}${charset};base64,${data.toString('base64')}`;
      } else {
        resources[resourcePath] = `data:${metadata.mime}${charset},${encodeURIComponent(data.toString())}`;
      }
    }
  }

  let output = `${source.slice(0, range.start)}${JSON.stringify(resources)}${source.slice(range.end)}`;
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'playable-repack-'));
  let zipBase64 = null;
  try {
    const stagingRoot = path.join(temporaryRoot, 'staging');
    fs.mkdirSync(stagingRoot);
    for (const entry of zipEntries) {
      // Variable zip entries (e.g. the per-task level JSONs) move to
      // materials.js so the embedded archive — and therefore game.js — stays
      // byte-stable across tasks. The runtime store is one object: the loader
      // merges zip entries into window.__res, so a materials.js entry under
      // the same path is visible to the engine all the same.
      if (packageMode && materialsKeys.has(entry)) continue;
      const sourcePath = path.join(assetsRoot, entry);
      if (!fs.existsSync(sourcePath)) throw new Error(`Missing extracted ZIP resource: ${entry}`);
      const destinationPath = path.join(stagingRoot, entry);
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
    }
    if (packageMode) {
      // Freshly copied mtimes would leak into the archive headers and make
      // game.js differ on every pack; pin them so the fixed shell is stable.
      stampTree(stagingRoot, new Date(0));
    }
    const archivePath = path.join(temporaryRoot, 'embedded.zip');
    execFileSync('zip', ['-q', '-X', '-r', archivePath, '.'], { cwd: stagingRoot });
    zipBase64 = fs.readFileSync(archivePath).toString('base64');
    if (!packageMode) {
      const zipRange = locateZipPayload(output);
      output = `${output.slice(0, zipRange.start)}${zipBase64}${output.slice(zipRange.end)}`;
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }

  if (packageMode) {
    // game.js owns the engine zip; the inline statement must go or it would
    // wipe the head script's value when the body loader parses.
    const zipStatement = /window\.__zip\s*=\s*"[A-Za-z0-9+/=]*"\s*;?/;
    const zipMatch = zipStatement.exec(output);
    if (!zipMatch) throw new Error('Package mode: inline window.__zip statement not found');
    output = output.slice(0, zipMatch.index) + output.slice(zipMatch.index + zipMatch[0].length);
    // The inline resource literal becomes a merge so materials.js entries
    // (loaded earlier from <head>) survive.
    const resRange = locateResourceObject(output);
    output = `${output.slice(0, resRange.start)}window.__res||{}${output.slice(resRange.end)}`;

    const fixedResources = {};
    const variableResources = {};
    const zipEntrySet = new Set(zipEntries);
    for (const key of materialsKeys) {
      if (!(key in manifest) && !zipEntrySet.has(key)) {
        throw new Error(`Package mode: --materials key not present in asset/zip manifest: ${key}`);
      }
    }
    for (const [key, value] of Object.entries(resources)) {
      if (materialsKeys.has(key)) variableResources[key] = value;
      else fixedResources[key] = value;
    }
    // Zip-entry materials (the per-task level JSONs) ship as text resources:
    // they were excluded from the archive above and now merge into __res from
    // materials.js instead.
    for (const key of materialsKeys) {
      if (!(key in manifest)) {
        variableResources[key] = fs.readFileSync(path.join(assetsRoot, key), 'utf8');
      }
    }
    siblingContents.push({ name: 'game.js', content: `window.__zip="${zipBase64}";\nwindow.__res=${JSON.stringify(fixedResources)};\n` });
    const uiSection = uiConfig ? `window.__NOVVY_UI__ = ${JSON.stringify(uiConfig, null, 2)};\n` : '';
    siblingContents.push({ name: 'materials.js', content: `${uiSection}window.__res = window.__res || {};\nObject.assign(window.__res, ${JSON.stringify(variableResources)});\n` });
  }

  // The WebAudio unlock must precede the engine's loader in the document, so
  // it is injected into <head> — the constructor wrapper only helps if it is
  // installed before the engine first constructs its AudioContext. Presence
  // of overlays/audio opts a template in; nothing else is required.
  const audioRoot = overlaysRoot ? path.join(overlaysRoot, 'audio') : null;
  if (audioRoot && fs.existsSync(audioRoot)) {
    const audioJs = fs.readFileSync(path.join(audioRoot, 'audio.js'), 'utf8');
    output = output.replace('</head>', `<script data-novvy-audio-unlock>\n${audioJs}\n</script>\n</head>`);
  }

  // Haptics: presence of overlays/haptics opts a template in, same contract
  // as overlays/audio. Head-injected so the playOneShot hook is installed
  // before the engine can play its first clip; the module feature-detects
  // window.novvy.haptic per call, so bridgeless previews just no-op.
  const hapticsRoot = overlaysRoot ? path.join(overlaysRoot, 'haptics') : null;
  if (hapticsRoot && fs.existsSync(hapticsRoot)) {
    const hapticsJs = fs.readFileSync(path.join(hapticsRoot, 'haptics.js'), 'utf8');
    output = output.replace('</head>', `<script data-novvy-haptics>\n${hapticsJs}\n</script>\n</head>`);
  }

  const hudRoot = overlaysRoot ? path.join(overlaysRoot, 'hud') : null;
  const hudImageLeft = flags['hud-image-left'] ? resolveFrom(flags['hud-image-left'], process.cwd()) : null;
  const hudImageRight = flags['hud-image-right'] ? resolveFrom(flags['hud-image-right'], process.cwd()) : null;
  const patternRefPath = flags['pattern-ref'] ? resolveFrom(flags['pattern-ref'], process.cwd()) : null;
  if (hudRoot && fs.existsSync(hudRoot) && hudImageLeft && hudImageRight) {
    const leftRef = packageMode ? 'hud-left.webp' : `data:image/png;base64,${fs.readFileSync(hudImageLeft).toString('base64')}`;
    const rightRef = packageMode ? 'hud-right.webp' : `data:image/png;base64,${fs.readFileSync(hudImageRight).toString('base64')}`;
    if (packageMode) {
      siblingCopies.push({ name: 'hud-left.webp', copy: hudImageLeft });
      siblingCopies.push({ name: 'hud-right.webp', copy: hudImageRight });
    }
    let hudHtml = fs.readFileSync(path.join(hudRoot, 'hud.html'), 'utf8')
      .replace('__HUD_LEFT_DRAGON__', leftRef)
      .replace('__HUD_RIGHT_DRAGON__', rightRef);
    // Optional corner polaroid of the pattern source: same DOM-media-only
    // sibling policy as the HUD avatars. Absent flag → the template <img>
    // ships without a src (browsers ignore a srcless img) for templates
    // that don't carry a pattern step.
    if (patternRefPath) {
      const refRef = packageMode ? 'pattern-ref.webp' : `data:image/webp;base64,${fs.readFileSync(patternRefPath).toString('base64')}`;
      if (packageMode) siblingCopies.push({ name: 'pattern-ref.webp', copy: patternRefPath });
      hudHtml = hudHtml.replace('__PATTERN_REF__', refRef);
    }
    const hudCss = fs.readFileSync(path.join(hudRoot, 'hud.css'), 'utf8');
    const hudJs = fs.readFileSync(path.join(hudRoot, 'hud.js'), 'utf8');
    output = output.replace('</head>', `<style data-novvy-hud>\n${hudCss}\n</style>\n</head>`);
    output = output.replace('<body>', `<body>\n${hudHtml}\n`);
    output = output.replace('</body>', `<script data-novvy-hud>\n${hudJs}\n</script>\n</body>`);
  }


  const ctaRoot = overlaysRoot ? path.join(overlaysRoot, 'cta') : null;
  const ctaIconPath = flags['cta-icon'] ? resolveFrom(flags['cta-icon'], process.cwd()) : null;
  if (ctaRoot && fs.existsSync(ctaRoot) && ctaIconPath) {
    const iconRef = packageMode ? 'app-icon.png' : `data:image/png;base64,${fs.readFileSync(ctaIconPath).toString('base64')}`;
    if (packageMode) siblingCopies.push({ name: 'app-icon.png', copy: ctaIconPath });
    const ctaHtml = fs.readFileSync(path.join(ctaRoot, 'cta.html'), 'utf8')
      .replace('__CTA_ICON__', iconRef);
    const ctaCss = fs.readFileSync(path.join(ctaRoot, 'cta.css'), 'utf8');
    const ctaJs = fs.readFileSync(path.join(ctaRoot, 'cta.js'), 'utf8');
    output = output.replace('</head>', `<style data-novvy-cta>\n${ctaCss}\n</style>\n</head>`);
    output = output.replace('<body>', `<body>\n${ctaHtml}\n`);
    output = output.replace('</body>', `<script data-novvy-cta>\n${ctaJs}\n</script>\n</body>`);
  }

  const introRoot = overlaysRoot ? path.join(overlaysRoot, 'intro') : null;
  const introVideoPath = flags['intro-video'] ? resolveFrom(flags['intro-video'], process.cwd()) : null;
  const introPosterPath = flags['intro-poster'] ? resolveFrom(flags['intro-poster'], process.cwd()) : null;
  if (introRoot && fs.existsSync(introRoot) && introVideoPath && introPosterPath) {
    const videoRef = packageMode ? 'tail-ad-video.mp4' : `data:video/mp4;base64,${fs.readFileSync(introVideoPath).toString('base64')}`;
    // The poster is derived from the video's first frame. Package mode ships
    // it as a real sibling file (the shell must not vary per task); legacy
    // mode inlines the jpeg data URI.
    const posterRef = packageMode ? 'poster.webp' : `data:image/jpeg;base64,${fs.readFileSync(introPosterPath).toString('base64')}`;
    if (packageMode) {
      siblingCopies.push({ name: 'tail-ad-video.mp4', copy: introVideoPath });
      siblingCopies.push({ name: 'poster.webp', copy: introPosterPath });
    }
    const introHtml = fs.readFileSync(path.join(introRoot, 'intro.html'), 'utf8')
      .replace('__NOVVY_INTRO_VIDEO__', videoRef)
      .replace('__NOVVY_INTRO_POSTER__', posterRef);
    const introCss = fs.readFileSync(path.join(introRoot, 'intro.css'), 'utf8');
    const introJs = fs.readFileSync(path.join(introRoot, 'intro.js'), 'utf8');
    output = output.replace('</head>', `<style data-novvy-intro>\n${introCss}\n</style>\n</head>`);
    output = output.replace('<body>', `<body>\n${introHtml}\n`);
    output = output.replace('</body>', `<script data-novvy-intro>\n${introJs}\n</script>\n</body>`);
    // The template's __bootcover splash exists to paint something before the
    // engine's first frame. An intro build already has that: the video
    // overlay's poster renders at parse time. Worse, keeping the cover would
    // hide the video — both layers are position:fixed at the same z-index and
    // the cover lands later in the DOM, so it paints on top until the
    // scene-node poll drops it (engine boot runs in parallel with playback,
    // so up to the 5s failsafe — clipping the video's opening seconds). Strip
    // the cover here; builds without intro flags keep it untouched.
    output = removeOnce(
      output,
      /<script>\(function\(\)\{var t0=Date\.now\(\),same=0,last=-1;[\s\S]*?requestAnimationFrame\(tick\)\}\)\(\);<\/script>/,
      'boot-cover boot-poll script',
    );
    output = removeOnce(
      output,
      /<style>#__bootcover\{[\s\S]*?<\/style><div id="__bootcover"><div id="__bcspin"><\/div><div id="__bcn">Colorever<\/div><\/div>/,
      'boot-cover style+markup',
    );
  }

  if (analyticsPath) {
    if (!fs.existsSync(analyticsPath)) throw new Error(`Analytics library not found: ${analyticsPath}`);
    if (packageMode) {
      // Head scripts run in document order: game.js and materials.js populate
      // window.__zip/__res before the body loader parses; analytics.js only
      // defines window.NovvyAnalytics for the overlay scripts at </body>.
      siblingContents.push({ name: 'analytics.js', content: fs.readFileSync(analyticsPath, 'utf8') });
      output = output.replace(
        '</head>',
        '<script src="game.js"></script>\n<script src="materials.js"></script>\n<script src="analytics.js"></script>\n</head>',
      );
    } else {
      output = output.replace('</head>', `<script data-novvy-analytics-lib>\n${fs.readFileSync(analyticsPath, 'utf8')}\n</script>\n</head>`);
    }
  }
  const analyticsRoot = overlaysRoot ? path.join(overlaysRoot, 'analytics') : null;
  if (analyticsRoot && fs.existsSync(analyticsRoot) && analyticsPath) {
    const bootJs = fs.readFileSync(path.join(analyticsRoot, 'boot.js'), 'utf8');
    output = output.replace('</body>', `<script data-novvy-analytics>\n${bootJs}\n</script>\n</body>`);
  }

  const backgroundRoot = overlaysRoot ? path.join(overlaysRoot, 'background') : null;
  if (packageMode && backgroundRoot && fs.existsSync(backgroundRoot) && domBgFile) {
    if (!fs.existsSync(domBgFile)) throw new Error(`DOM background file not found: ${domBgFile}`);
    // Injected LAST: each overlay html is spliced right after <body>, so this
    // block ends up as the FIRST element — the DOM background sits behind
    // everything without depending on z-index alone.
    const bgHtml = fs.readFileSync(path.join(backgroundRoot, 'background.html'), 'utf8');
    const bgCss = fs.readFileSync(path.join(backgroundRoot, 'background.css'), 'utf8')
      .replace('__NOVVY_BG_FILE__', 'background.webp');
    const bgJs = fs.readFileSync(path.join(backgroundRoot, 'background.js'), 'utf8');
    output = output.replace('</head>', `<style data-novvy-background>\n${bgCss}\n</style>\n</head>`);
    output = output.replace('<body>', `<body>\n${bgHtml}\n`);
    output = output.replace('</body>', `<script data-novvy-background>\n${bgJs}\n</script>\n</body>`);
    siblingCopies.push({ name: 'background.webp', copy: domBgFile });
  }

  // Anchor re-check AFTER all injections: any injected block that itself
  // carried a literal anchor tag (e.g. in a comment) would silently poison
  // later injections and corrupt the document.
  for (const anchor of ['</head>', '<body>', '</body>']) {
    assertSingleAnchor(output, anchor);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const outputDir = path.dirname(outputPath);
  for (const { name, content } of siblingContents) {
    fs.writeFileSync(path.join(outputDir, name), content);
  }
  for (const { name, copy } of siblingCopies) {
    fs.copyFileSync(copy, path.join(outputDir, name));
  }
  fs.writeFileSync(outputPath, output);
  const siblings = [...siblingContents.map((s) => s.name), ...siblingCopies.map((s) => s.name)];
  console.log(`Built ${outputPath} (${Buffer.byteLength(output)} bytes)${siblings.length ? ` + ${siblings.join(', ')}` : ''}`);
}

main();
