import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readBundle, locateZipPayload, locateResourceObject } from '../plugins/colorever-gemsort/lib/res-bundle.mjs';
import { computeWinTargetPercent, pickGuideColors, routeStoreJumpThroughNovvyBridge } from '../plugins/colorever-gemsort/lib/meta-patch.mjs';
import { createServer } from '../server.mjs';

// Full-stack equivalence check: drive the real HTTP API to build a reference
// task from the EXAMPLE's own five assets, then compare dist/<id>/ against the
// known-good editable/index.html. Pack runs in package mode, so the shell
// index.html delegates to game.js (engine zip + fixed resources) and
// materials.js (variable resources) while the golden inlines everything.
// Equality is judged by: unzipped per-file bytes (from game.js), merged
// __res deep-equality (game.js + materials.js), normalized document
// equivalence, sibling byte-equality, marker counts, and size delta.

const execFile = promisify(execFileCallback);

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..', '..');
const EXAMPLE = path.join(ROOT, 'editor', 'test', 'fixtures', 'dragon-baby-color-ever');
const KNOWN_GOOD_PATH = path.join(EXAMPLE, 'editable', 'index.html');

const PLACEHOLDERS = [
  '__HUD_LEFT_DRAGON__', '__HUD_RIGHT_DRAGON__',
  '__NOVVY_INTRO_VIDEO__', '__NOVVY_INTRO_POSTER__',
  '__HUD_TITLE_LINE1__', '__HUD_TITLE_LINE2__', '__HUD_ARIA_LABEL__', '__NOVVY_INTRO_ARIA__',
];

const UPLOADS = [
  ['intro-video', path.join(EXAMPLE, 'ad-assets', 'final', 'intro-video.mp4')],
  ['background', path.join(EXAMPLE, 'editable', 'source-images', 'new-game-background.png')],
  // portrait SOURCE images; no crop configured → the full images become the
  // portraits byte-for-byte, matching the known-good build
  ['portrait-src-left', path.join(EXAMPLE, 'editable', 'hud', 'dragon-left.png')],
  ['portrait-src-right', path.join(EXAMPLE, 'editable', 'hud', 'dragon-right.png')],
  ['intro-poster', path.join(EXAMPLE, 'editable', 'intro', 'poster.jpg')],
];

const CONFIG = {
  hud: {
    enabled: true,
    titleLine1: 'HELP KAI UPGRADE',
    titleLine2: 'HIS LEFT ARMS',
    ariaLabel: 'Help Nox drink his golden milk',
  },
  intro: { enabled: true, ariaLabel: 'Nox story introduction' },
  recolorPortraits: false,
};

async function startServer() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

async function unzipTo(zipBase64, workDir, label) {
  const zipPath = path.join(workDir, `${label}.zip`);
  const destDir = path.join(workDir, label);
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(zipPath, Buffer.from(zipBase64, 'base64'));
  await execFile('unzip', ['-oq', zipPath, '-d', destDir]);
  return destDir;
}

function listFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(dir, full));
    }
  };
  walk(dir);
  return out.sort();
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + 1);
  }
  return count;
}

export default async function run(assert) {
  const { server, base } = await startServer();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-ref-'));
  try {
    // --- build the reference task through the real API ---
    const createRes = await fetch(`${base}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `e2e-ref-${Date.now()}`, templateId: 'colorever-gemsort' }),
    });
    const task = await createRes.json();
    assert.check(createRes.status === 201 && task.id, `task created (${task.id})`);
    const taskId = task.id;

    for (const [slot, file] of UPLOADS) {
      const bytes = fs.readFileSync(file);
      const res = await fetch(`${base}/api/tasks/${taskId}/uploads/${slot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': path.basename(file) },
        body: bytes,
      });
      assert.check(res.status === 200, `upload ${slot} accepted (${res.status})`);
    }

    const patchRes = await fetch(`${base}/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    assert.check(patchRes.status === 200, 'config patched');

    const runRes = await fetch(`${base}/api/tasks/${taskId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'all' }),
    });
    const results = await runRes.json();
    const failed = results.filter?.((r) => !r.ok) || [];
    if (failed.length > 0) {
      for (const f of failed) console.error(`  step ${f.stepId} failed: ${f.error}`);
    }
    assert.check(runRes.status === 200 && results.length === 6 && failed.length === 0, 'all six steps succeeded');

    const resultDir = path.join(ROOT, 'result', taskId);
    const distPath = path.join(resultDir, 'index.html');
    const output = fs.readFileSync(distPath, 'utf8');
    const knownGood = fs.readFileSync(KNOWN_GOOD_PATH, 'utf8');

    // --- 7-point equivalence ---
    const leftovers = PLACEHOLDERS.filter((p) => output.includes(p));
    assert.equal(leftovers, [], 'no unresolved placeholders in packed output');

    const markers = [
      '<script src="game.js"></script>',
      '<script src="materials.js"></script>',
      '<script src="analytics.js"></script>',
      '<script data-novvy-analytics>',
      '<style data-novvy-background>',
      '<script data-novvy-background>',
      '<div id="novvy-dom-bg"',
      'url("background.webp")',
      'window.__res=',
      '<style data-novvy-hud>',
      '<style data-novvy-intro>',
      '<div id="novvy-training-hud"',
      '<div id="novvy-video-intro"',
      'poster="poster.webp"',
    ];
    for (const marker of markers) {
      assert.check(countOccurrences(output, marker) === 1, `marker occurs exactly once: ${marker}`);
    }
    // The shell is task-independent: per-task copy lives in materials.js.
    for (const absent of ['HELP KAI UPGRADE', 'HIS LEFT ARMS', 'data:image/jpeg']) {
      assert.check(!output.includes(absent), `shell carries no per-task ${JSON.stringify(absent.slice(0, 24))}`);
    }
    // funnel wiring landed in the injected overlays
    for (const probe of ['novvy:intro-finished', "reason: detail.reason || 'video_ended'", 'novvy:victory', "'cta_click'", "'game_start'", "'first_interaction'", "'gem_place_success'", "interaction('sound_button'", "interaction('video'", 'sound_restored', 'novvy:viewablechange', 'autoplay_muted_fallback']) {
      assert.check(output.includes(probe), `funnel wiring present: ${probe}`);
    }
    // The sound toggle reports via interaction() (telemetry only).  A literal
    // video_mute event name would contradict the reference implementation the
    // template ports (docs/example) — pin its absence.
    assert.check(!output.includes("'video_mute'"), 'sound toggle never emits a literal video_mute track');

    // package-mode shape: no inline engine payload, merge-safe resource stub
    assert.check(!/window\.__zip\s*=\s*"[A-Za-z0-9+/=]+"/.test(output), 'shell carries no inline engine zip');
    assert.check(output.includes('window.__res=window.__res||{}'), 'inline __res literal replaced by merge stub');

    const gameJs = fs.readFileSync(path.join(resultDir, 'game.js'), 'utf8');
    const materialsJs = fs.readFileSync(path.join(resultDir, 'materials.js'), 'utf8');
    const analyticsJs = fs.readFileSync(path.join(resultDir, 'analytics.js'), 'utf8');
    assert.check(gameJs.startsWith('window.__zip="'), 'game.js embeds the engine zip');
    assert.check(materialsJs.includes('Object.assign(window.__res,'), 'materials.js merges variable resources');
    assert.check(analyticsJs === fs.readFileSync(path.join(ROOT, 'editor', 'core', 'vendor', 'analytics.js'), 'utf8'), 'analytics.js byte-equals the vendored lib');
    // per-task UI copy rides in materials.js
    assert.check(materialsJs.includes('__NOVVY_UI__'), 'materials.js carries the UI copy section');
    assert.check(materialsJs.includes(CONFIG.hud.titleLine1) && materialsJs.includes(CONFIG.hud.titleLine2), 'materials.js carries the HUD title lines');

    // --- resources: output splits __res across game.js/materials.js ---
    const gameRes = JSON.parse(/window\.__res=(\{[\s\S]*\});\s*$/.exec(gameJs)[1]);
    const materialsRes = JSON.parse(/Object\.assign\(window\.__res, (\{[\s\S]*\})\);\s*$/.exec(materialsJs)[1]);
    const outRes = { ...gameRes, ...materialsRes };
    const knownRes = readBundle(KNOWN_GOOD_PATH).resources;
    const templateJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'editor', 'templates', 'colorever-gemsort', 'template.json'), 'utf8'));
    const levelAssetPaths = templateJson.levels.map((level) => level.assetPath);
    // Package mode moves the zip-born level JSONs into the unified __res
    // namespace, so the packed store holds the golden's entries plus the
    // levels.
    assert.equal(
      Object.keys(outRes).length,
      Object.keys(knownRes).length + levelAssetPaths.length,
      '__res entry count matches known-good plus the zip-born level entries',
    );
    // The two meta configs are EXPECTED to differ from the known-good
    // editable build: pack rewrites GlobalConfig (win-by-count store jump)
    // and GuideConfig (guide colors present on the generated board). The
    // blurred background and the level JSONs are per-task materials now.
    // Compare everything else byte-for-byte, then verify the variable
    // entries against this run's own artifacts below.
    // The run's own level artifact — needed both for the zip comparison below
    // and for verifying the packed meta configs against it.
    const artifactPath = path.join(ROOT, 'project', taskId, 'generated', 'levels.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const globalConfigKey = templateJson.meta.globalConfigAssetPath;
    const guideConfigKey = templateJson.meta.guideConfigAssetPath;
    const backgroundKey = templateJson.background.assetPath;
    const outGlobalPayload = JSON.parse(outRes[globalConfigKey])?.[5]?.[0]?.[2];
    const outGuidePayload = JSON.parse(outRes[guideConfigKey])?.[5]?.[0]?.[2];
    delete outRes[globalConfigKey];
    delete knownRes[globalConfigKey];
    delete outRes[guideConfigKey];
    delete knownRes[guideConfigKey];
    delete outRes[backgroundKey];
    delete knownRes[backgroundKey];
    for (const key of levelAssetPaths) delete outRes[key];
    const fixedDiff = Object.keys(knownRes).filter((key) => outRes[key] !== knownRes[key]);
    if (fixedDiff.length > 0) {
      for (const key of fixedDiff) console.error(`  __res differs at: ${key}`);
    }
    assert.equal(fixedDiff, [], '__res resources deep-equal known-good (variable materials excluded)');

    // The variable materials must be exactly this run's artifacts: the
    // background as the data-URI of the freshly blurred WebP (with the
    // manifest's declared mime — the game_pic_bg slot is a webp asset).
    // It MUST stay inline: engine textures under file:// delivery taint WebGL
    // as sibling files (Cocos error 16352). The DOM copy that the transparent
    // canvas shows through is the externalized background.webp sibling below.
    const packManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'editor', 'templates', 'colorever-gemsort', 'game', 'asset-manifest.json'), 'utf8'));
    const runBackground = `data:${packManifest[backgroundKey].mime};base64,${fs.readFileSync(path.join(ROOT, 'project', taskId, 'generated', 'background.webp')).toString('base64')}`;
    assert.equal(materialsRes[backgroundKey], runBackground, 'packed background is this run’s blurred artifact');

    // The shell legitimately differs from the golden (script-src delegation
    // instead of inlined payloads, relative media refs, new overlay JS), so
    // the document comparison normalizes both sides: strip the delegation
    // tags and overlay bodies, collapse the payload statements, and map the
    // media references to shared tokens. Overlay content itself is covered by
    // the markers/probes above and the sibling byte-equality checks below.
    const stripDelegation = (source) => source
      .replace(/\s*<script src="(?:game|materials|analytics)\.js"><\/script>/g, '')
      .replace(/<script data-novvy-[a-z-]+>[\s\S]*?<\/script>/g, '')
      .replace(/<style data-novvy-[a-z-]+>[\s\S]*?<\/style>/g, '')
      .replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, 'MEDIA_PNG')
      .replace(/data:image\/jpeg;base64,[A-Za-z0-9+/=]+/g, 'MEDIA_JPEG')
      .replace(/data:video\/mp4;base64,[A-Za-z0-9+/=]+/g, 'MEDIA_MP4')
      .replace(/hud-left\.webp/g, 'MEDIA_PNG')
      .replace(/hud-right\.webp/g, 'MEDIA_PNG')
      .replace(/app-icon\.png/g, 'MEDIA_PNG')
      .replace(/tail-ad-video\.mp4/g, 'MEDIA_MP4')
      .replace(/poster\.webp/g, 'MEDIA_JPEG')
      .replace(/background\.webp/g, 'MEDIA_WEBP')
      .replace(/<div id="novvy-dom-bg"[^>]*><\/div>\n?/g, '')
      // per-task copy: the golden pre-fills the title/aria in the DOM, the
      // package shell leaves empty slots for materials.js runtime fill
      .replace(/HELP KAI UPGRADE|HIS LEFT ARMS/g, '')
      .replace(/aria-label="[^"]*"/g, 'aria-label=""')
      // the template title divs gained ids for the materials.js runtime fill
      .replace(/ id="novvy-hud-title-line[12]"/g, '')
      // intro builds strip the engine-boot splash from the shell (the video
      // overlay's poster covers parse-time paint, and an intact cover would
      // paint over the playing video); the golden predates that and still
      // carries it, so cut it on both sides. Tails mirror repack.mjs.
      .replace(/<script>\(function\(\)\{var t0=Date\.now\(\),same=0,last=-1;[\s\S]*?requestAnimationFrame\(tick\)\}\)\(\);<\/script>/, '')
      .replace(/<style>#__bootcover\{[\s\S]*?<\/style><div id="__bootcover"><div id="__bcspin"><\/div><div id="__bcn">Colorever<\/div><\/div>/, '')
      // the intro overlay's DOM evolves with the template (icon sound button,
      // lifecycle-driven playback); its identity in the packed shell is pinned
      // by the exactly-once markers and the funnel probes above, so cut the
      // block from both sides like the other overlay bodies. The intro root
      // nests no other div, so the lazy span ends at its own closing tag.
      // Deliberately non-global: a second occurrence must leave residue and
      // fail the comparison loudly instead of being normalized away.
      .replace(/<div id="novvy-video-intro"[\s\S]*?<\/div>\n?/, '')
      // overlay injection count changes how many newlines survive stripping
      .replace(/\n{2,}/g, '\n')
      // the package shell injects one more overlay block (analytics), so the
      // number of stripped newlines before </body> differs by one
      .replace(/\n+<\/body>/, '\n</body>');
    const knownNoZip = knownGood.replace(/window\.__zip\s*=\s*"[A-Za-z0-9+/=]*"\s*;?/, '');
    const knownNormalized = stripDelegation(
      knownNoZip.slice(0, locateResourceObject(knownNoZip).start) + '__RES_PAYLOAD__' + knownNoZip.slice(locateResourceObject(knownNoZip).end),
    );
    const outNormalized = stripDelegation(output.replace('window.__res=window.__res||{}', 'window.__res=__RES_PAYLOAD__'));
    assert.equal(outNormalized, knownNormalized, 'shell document matches known-good after package-mode normalization');

    // The engine zip now travels inside game.js.
    const outZipBase64 = /window\.__zip="([A-Za-z0-9+/=]+)"/.exec(gameJs)[1];
    const outTree = await unzipTo(outZipBase64, workDir, 'out');
    const knownTree = await unzipTo(locateZipPayload(knownGood).payload, workDir, 'known');
    const outFiles = listFiles(outTree);
    const knownFiles = listFiles(knownTree);
    // Level data JSONs are regenerated by the levels step on every run (the
    // grouped-colors scramble replaced the example's shipped arrangement), so
    // byte-equality against the shipped golden cannot hold for them — and in
    // package mode they travel inside materials.js, not the archive. The
    // transparent-canvas macro in cocos-js/cc.js is pack-flipped (!1 → !0).
    // assets/main/index.js has the template's store handoff rerouted through
    // the Novvy bridge (routeStoreJumpThroughNovvyBridge): the golden still
    // carries the raw window.open chain.
    // The remaining entries must match the golden's name set exactly.
    const CC_ZIP_REL = 'cocos-js/cc.js';
    const MAIN_BUNDLE_REL = 'assets/main/index.js';
    assert.equal(
      outFiles,
      knownFiles.filter((rel) => !levelAssetPaths.includes(rel)),
      'zip name set = known-good minus the variable level entries',
    );
    let zipDiffs = 0;
    for (const rel of outFiles) {
      const a = fs.readFileSync(path.join(outTree, rel));
      const b = fs.readFileSync(path.join(knownTree, rel));
      let expected = b;
      if (rel === CC_ZIP_REL) {
        expected = Buffer.from(b.toString('utf8').replace('ENABLE_TRANSPARENT_CANVAS:!1', 'ENABLE_TRANSPARENT_CANVAS:!0'), 'utf8');
      } else if (rel === MAIN_BUNDLE_REL) {
        expected = Buffer.from(routeStoreJumpThroughNovvyBridge(b.toString('utf8')).source, 'utf8');
      }
      if (!a.equals(expected)) {
        zipDiffs += 1;
        console.error(`  zip content differs: ${rel}`);
      }
    }
    assert.check(zipDiffs === 0, `zip per-file bytes identical outside the macro flip and generated levels (${outFiles.length} files, ${zipDiffs} diffs)`);
    if (outFiles.includes(CC_ZIP_REL)) {
      const packedCc = fs.readFileSync(path.join(outTree, CC_ZIP_REL), 'utf8');
      assert.equal(
        packedCc.split('ENABLE_TRANSPARENT_CANVAS:!0').length - 1,
        1,
        'packed cc.js flips the transparent-canvas macro exactly once',
      );
    }

    // The packed levels live in materials.js now: each entry must parse and
    // carry the level name the artifact generated for it.
    for (const levelPatch of artifact.levels) {
      const packed = JSON.parse(materialsRes[levelPatch.assetPath]);
      assert.equal(packed?.[5]?.[0]?.[1], levelPatch.name, `materials.js carries generated level ${levelPatch.name}`);
    }

    assert.check(fs.existsSync(artifactPath), 'levels.json artifact exists for packed-level comparison');
    if (fs.existsSync(artifactPath)) {
      // The meta patches must be derived from THIS run's level data.
      const activeCells = artifact.metrics.activeCells;
      const openingMatches = Number.isInteger(artifact.metrics.openingMatches)
        ? artifact.metrics.openingMatches
        : Math.round(artifact.metrics.openingCompletion * activeCells);
      // The run uses the template default win.placements = "complete",
      // which the pack step resolves to every remaining misplaced cell — the
      // win boundary sits 1e-9 below 100% (jump on the final move only).
      const placements = activeCells - openingMatches;
      const expectedPercent = computeWinTargetPercent({ openingMatches, placements, activeCells });
      assert.equal(outGlobalPayload?.['游戏获胜关卡条件'], 1, 'packed GlobalConfig enables the win on level 1');
      assert.check(
        Math.abs(outGlobalPayload?.['游戏获胜目标进度百分比'] - expectedPercent) < 1e-9,
        'packed GlobalConfig percent equals the count-derived boundary',
      );
      const patchColors = artifact.metrics.moveCyclePatchColors;
      const guideColors = pickGuideColors({
        colorCounts: artifact.metrics.colorCounts,
        colorNames: artifact.tileNames,
        preferredParkTile: Array.isArray(patchColors) ? patchColors[1] : undefined,
        preferredPlaceTile: Array.isArray(patchColors) ? patchColors[0] : undefined,
      });
      assert.equal(outGuidePayload?.['阶段1颜色'], guideColors.park, 'packed GuideConfig phase 1 uses the park color');
      assert.equal(outGuidePayload?.['阶段3颜色'], guideColors.place, 'packed GuideConfig phase 3 uses the place color');

      // The HUD bar paces 10..100 over the K board placements of the certified
      // solution, so it reads 100% exactly when the picture completes.
      const uiSection = JSON.parse(/window\.__NOVVY_UI__ = (\{[\s\S]*?\});\n/.exec(materialsJs)[1]);
      const expectedStep = Math.round((90 / artifact.metrics.movePatchCount) * 10) / 10;
      assert.equal(uiSection?.hud?.progressStart, 10, 'packed HUD bar starts at 10%');
      assert.equal(uiSection?.hud?.progressStep, expectedStep, 'packed HUD bar step splits the bar over K placements');
    }

    // The shell is now a thin document — the multi-MB payloads moved to
    // game.js/materials.js and the media files ship as siblings.
    assert.check(output.length < 400 * 1024, `shell index.html stays thin (${(output.length / 1024).toFixed(0)} KB)`);

    // --- package siblings: byte-equal to their exact sources ---
    const expectedSiblings = [
      ['background.webp', path.join(ROOT, 'project', taskId, 'generated', 'background.webp')],
      ['poster.webp', path.join(ROOT, 'project', taskId, 'generated', 'poster.webp')],
      ['tail-ad-video.mp4', path.join(ROOT, 'project', taskId, 'uploads', 'intro-video.mp4')],
      ['app-icon.png', path.join(ROOT, 'editor', 'plugins', 'colorever-gemsort', 'overlays', 'cta', 'icon.png')],
      ['hud-left.webp', path.join(ROOT, 'project', taskId, 'generated', 'hud-left.webp')],
      ['hud-right.webp', path.join(ROOT, 'project', taskId, 'generated', 'hud-right.webp')],
    ];
    for (const [name, sourcePath] of expectedSiblings) {
      const sibling = path.join(resultDir, name);
      assert.check(fs.existsSync(sibling) && fs.statSync(sibling).size > 0, `package sibling exists: ${name}`);
      if (fs.existsSync(sibling)) {
        assert.check(fs.readFileSync(sibling).equals(fs.readFileSync(sourcePath)), `package sibling byte-equals its source: ${name}`);
      }
    }

    // --- ZIP export: one link delivers the whole multi-file package ---
    const exportRes = await fetch(`${base}/api/tasks/${taskId}/export`);
    assert.check(exportRes.status === 200, `export endpoint responds (${exportRes.status})`);
    assert.check((exportRes.headers.get('content-type') || '').includes('zip'), 'export responds with a zip content type');
    const exportZip = await exportRes.arrayBuffer();
    const exportTree = await unzipTo(Buffer.from(exportZip).toString('base64'), workDir, 'export');
    assert.equal(listFiles(exportTree), ['analytics.js', 'app-icon.png', 'background.webp', 'game.js', 'hud-left.webp', 'hud-right.webp', 'index.html', 'materials.js', 'poster.webp', 'tail-ad-video.mp4'], 'export zip carries exactly the package layout');
    assert.check(
      fs.readFileSync(path.join(exportTree, 'index.html')).equals(fs.readFileSync(distPath)),
      'export zip index.html byte-equals the packed shell',
    );
    const missingExport = await fetch(`${base}/api/tasks/${taskId}/export`, { method: 'DELETE' });
    assert.check(missingExport.status === 404 || missingExport.status === 405, 'non-GET export is rejected');

    // cleanup the task
    await fetch(`${base}/api/tasks/${taskId}`, { method: 'DELETE' });
    assert.check(!fs.existsSync(path.join(ROOT, 'project', taskId)) && !fs.existsSync(path.join(ROOT, 'result', taskId)), 'task delete removes project and dist');
  } finally {
    server.close();
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
