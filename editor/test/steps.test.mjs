import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { fillHudHtml, fillIntroHtml, escapeHtml } from '../core/scripts/fill-overlays.mjs';
import { probeImage } from '../core/lib/exec.mjs';
import { locateZipPayload } from '../core/lib/res-bundle.mjs';
import { stripIngestTelemetry } from '../core/lib/meta-patch.mjs';

const execFile = promisify(execFileCallback);

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..', '..');
const EXAMPLE = path.join(ROOT, 'editor', 'test', 'fixtures', 'dragon-baby-color-ever');
const TEMPLATE = path.join(ROOT, 'editor', 'templates', 'colorever-gemsort');

async function shasum(file) {
  const { stdout } = await execFile('shasum', ['-a', '256', file]);
  return stdout.trim().split(/\s+/)[0];
}

// Pristine bytes of the three hand-restored prototype files, snapshotted from
// the original repo at commit 026ad34 (the new monorepo carries no git
// history, so the previous `git show` baseline lives here as plain files).
const BASELINE = path.join(ROOT, 'editor', 'test', 'baseline');

function cmp(a, b) {
  return fs.readFileSync(a).equals(fs.readFileSync(b));
}

// Provenance comparison that tolerates the one intentional delta between the
// pristine template document and the shipped example: the example's embedded
// zip carries the ingest-telemetry strip (assets/bundle_gemsort/index.js),
// while the template stays pristine. Everything outside the __zip base64 span
// must still be byte-identical, and the example's zipped bundle must equal the
// template's standalone bundle exactly once the strip is applied to it.
function stripZipSpan(source) {
  const range = locateZipPayload(source);
  return source.slice(0, range.start) + source.slice(range.end);
}

export default async function run(assert) {
  /* ------------------------ template integrity ------------------------ */
  assert.check(
    stripZipSpan(fs.readFileSync(path.join(TEMPLATE, 'game', 'index.html'), 'utf8'))
      === stripZipSpan(fs.readFileSync(path.join(EXAMPLE, 'index.html'), 'utf8')),
    'template game/index.html matches example root outside the zip payload',
  );
  {
    // The example's embedded zip bundle is the template bundle minus the
    // ingest telemetry strip — proving the payloads diverge ONLY by the strip.
    const exampleZip = locateZipPayload(fs.readFileSync(path.join(EXAMPLE, 'index.html'), 'utf8'));
    const workZip = fs.mkdtempSync(path.join(os.tmpdir(), 'steps-zip-'));
    try {
      const zipFile = path.join(workZip, 'embedded.zip');
      fs.writeFileSync(zipFile, Buffer.from(exampleZip.payload, 'base64'));
      await execFile('unzip', ['-q', zipFile, '-d', path.join(workZip, 'tree')]);
      const zippedBundle = fs.readFileSync(path.join(workZip, 'tree', 'assets', 'bundle_gemsort', 'index.js'), 'utf8');
      const templateBundle = fs.readFileSync(path.join(TEMPLATE, 'game', 'assets', 'assets', 'bundle_gemsort', 'index.js'), 'utf8');
      assert.equal(zippedBundle, stripIngestTelemetry(templateBundle).source, 'example zip bundle equals stripped template bundle');
      assert.equal(stripIngestTelemetry(zippedBundle).removed, 0, 'example zip bundle carries no ingest telemetry');
    } finally {
      fs.rmSync(workZip, { recursive: true, force: true });
    }
  }
  assert.check(cmp(path.join(TEMPLATE, 'game', 'asset-manifest.json'), path.join(EXAMPLE, 'editable', 'asset-manifest.json')), 'asset-manifest byte-equals example');
  assert.check(cmp(path.join(TEMPLATE, 'game', 'zip-manifest.json'), path.join(EXAMPLE, 'editable', 'zip-manifest.json')), 'zip-manifest byte-equals example');

  const restored = [
    'assets/assets/bundle_gemsort/import/7e/7e004f8f-045a-4d95-8990-e680554d88e5.json',
    'assets/assets/bundle_gemsort/import/a3/a38a1f95-d085-455f-b030-220e7251927f.json',
    'assets/assets/resources/native/84/84bd2963-92cb-4267-a10d-869a4f71db21.png',
  ];
  for (const rel of restored) {
    const templateFile = path.join(TEMPLATE, 'game', rel);
    assert.check(await shasum(templateFile) === await shasum(path.join(BASELINE, path.basename(rel))), `restored pristine from baseline snapshot: ${path.basename(rel)}`);
  }

  // GlobalConfig must keep the hand-tuned win-condition values (not restored).
  const globalConfig = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'game', 'assets/assets/bundle_gemsort/import/69/69d06444-8382-41d3-a2b2-a8f157683a8f.json'), 'utf8'));
  assert.equal(globalConfig[5][0][2]['游戏获胜关卡条件'], 0, 'GlobalConfig keeps hand-tuned win condition off');

  // Overlay text placeholders exist; asset placeholders intact.
  const hudHtml = fs.readFileSync(path.join(TEMPLATE, 'overlays', 'hud', 'hud.html'), 'utf8');
  assert.check(hudHtml.includes('__HUD_TITLE_LINE1__') && hudHtml.includes('__HUD_TITLE_LINE2__') && hudHtml.includes('__HUD_ARIA_LABEL__'), 'hud.html has the three text placeholders');
  assert.check(hudHtml.includes('__HUD_LEFT_DRAGON__') && hudHtml.includes('__HUD_RIGHT_DRAGON__'), 'hud.html keeps asset placeholders');
  const introHtml = fs.readFileSync(path.join(TEMPLATE, 'overlays', 'intro', 'intro.html'), 'utf8');
  assert.check(introHtml.includes('__NOVVY_INTRO_ARIA__') && introHtml.includes('__NOVVY_INTRO_POSTER__') && introHtml.includes('__NOVVY_INTRO_VIDEO__'), 'intro.html has its placeholders');
  // hud.js intentionally extends the example's port in two documented spots:
  // a materials.js UI-fill block at the top (fixed-shell task copy) and the
  // Gem_success → novvy:victory dispatch inside the playOneShot hook (analytics
  // victory signal). The tail after the hook must stay byte-identical to the
  // example's file, and the ported core statements must survive verbatim.
  const templateHudJs = fs.readFileSync(path.join(TEMPLATE, 'overlays', 'hud', 'hud.js'), 'utf8');
  const exampleHudJs = fs.readFileSync(path.join(EXAMPLE, 'editable', 'hud', 'hud.js'), 'utf8');
  const hookEnd = 'prototype.__novvyProgressHooked';
  const sliceAfter = (source) => source.slice(source.lastIndexOf(hookEnd));
  assert.check(sliceAfter(templateHudJs) === sliceAfter(exampleHudJs), 'hud.js ported byte-identical after the playOneShot hook');
  assert.check(
    templateHudJs.includes(String.raw`/(^|\/)Gem_othregion_place(?:\.mp3)?$/i`),
    'hud.js keeps the ported placement audio match verbatim',
  );
  assert.check(templateHudJs.includes("new CustomEvent('novvy:victory')"), 'hud.js hook dispatches the victory signal');
  assert.check(templateHudJs.includes('window.__NOVVY_UI__'), 'hud.js applies the materials.js UI copy');

  /* ------------------- cta bridge order + audio unlock ------------------ */
  // openStore() must try the Novvy bridge before super_html: the pack's own
  // AppLovin shim is always present in an SDK WebView and its window.open
  // fallback is a silent no-op there, so a later branch would never run.
  const templateCtaJs = fs.readFileSync(path.join(TEMPLATE, 'overlays', 'cta', 'cta.js'), 'utf8');
  const novvyBranchAt = templateCtaJs.indexOf('__novvyBridgeVersion >= 1');
  const superHtmlBranchAt = templateCtaJs.indexOf('window.super_html.download');
  assert.check(novvyBranchAt !== -1, 'cta.js consults the Novvy bridge');
  assert.check(
    novvyBranchAt !== -1 && superHtmlBranchAt !== -1 && novvyBranchAt < superHtmlBranchAt,
    'cta.js tries novvy.open() before the super_html shim',
  );
  // The unlock overlay must wrap whichever AudioContext the engine will pick
  // and resume captured contexts from capture-phase gesture listeners (a
  // resume is only honored inside a user-gesture event stack).
  const templateAudioJs = fs.readFileSync(path.join(TEMPLATE, 'overlays', 'audio', 'audio.js'), 'utf8');
  assert.check(templateAudioJs.includes("window[key] = WrappedAudioContext"), 'audio.js wraps the engine-selected AudioContext');
  for (const gesture of ['touchend', 'mouseup', 'pointerup']) {
    assert.check(templateAudioJs.includes(`'${gesture}'`), `audio.js unlocks on ${gesture}`);
  }
  assert.check(templateAudioJs.includes("capture: true"), 'audio.js gesture listeners run in capture phase');

  /* --------------------------- crop-image ------------------------------ */
  const cropWork = fs.mkdtempSync(path.join(os.tmpdir(), 'steps-crop-'));
  try {
    const poster = path.join(EXAMPLE, 'editable', 'intro', 'poster.jpg');
    await execFile('python3', [
      path.join(ROOT, 'editor', 'core', 'scripts', 'crop-image.py'),
      '--source', poster,
      '--out', path.join(cropWork, 'crop.png'),
      '--x', '160', '--y', '400', '--width', '400', '--height', '400',
      '--min-side', '200',
    ]);
    const dims = await probeImage(path.join(cropWork, 'crop.png'));
    assert.equal(dims, { width: 400, height: 400, format: 'png' }, 'crop keeps native resolution');
    // clamping: a rect running past the bottom-right edge is clamped inside
    await execFile('python3', [
      path.join(ROOT, 'editor', 'core', 'scripts', 'crop-image.py'),
      '--source', poster,
      '--out', path.join(cropWork, 'clamped.png'),
      '--x', '600', '--y', '1100', '--width', '400', '--height', '400',
    ]);
    const clamped = await probeImage(path.join(cropWork, 'clamped.png'));
    assert.check(clamped.width === 120 && clamped.height === 180, `edge rect clamped into bounds (${clamped.width}x${clamped.height})`);
    // tiny selections are upscaled to --min-side
    await execFile('python3', [
      path.join(ROOT, 'editor', 'core', 'scripts', 'crop-image.py'),
      '--source', poster,
      '--out', path.join(cropWork, 'small.png'),
      '--x', '100', '--y', '100', '--width', '64', '--height', '64',
      '--min-side', '200',
    ]);
    const small = await probeImage(path.join(cropWork, 'small.png'));
    assert.check(small.width === 200 && small.height === 200, `tiny crop upscaled to min-side (${small.width}x${small.height})`);
  } finally {
    fs.rmSync(cropWork, { recursive: true, force: true });
  }

  /* -------------------------- fill-overlays --------------------------- */
  const filled = fillHudHtml(hudHtml, {
    titleLine1: 'HELP <SCRIPT>alert(1)</SCRIPT>',
    titleLine2: `HE'S "GOLDEN" & MILK`,
    ariaLabel: 'Drink <b>milk</b>',
  });
  assert.check(!filled.includes('<SCRIPT>') && filled.includes(escapeHtml('HELP <SCRIPT>alert(1)</SCRIPT>')), 'hud title escaping strips raw html');
  assert.check(filled.includes('HE&#39;S &quot;GOLDEN&quot; &amp; MILK'), 'hud title escapes quotes and ampersand');
  assert.check(filled.includes('aria-label="Drink &lt;b&gt;milk&lt;/b&gt;"'), 'aria label escaped inside attribute');
  const filledIntro = fillIntroHtml(introHtml, { ariaLabel: 'Nox "story" <intro>' });
  assert.check(filledIntro.includes('aria-label="Nox &quot;story&quot; &lt;intro&gt;"'), 'intro aria escaped');

  /* ------------------------- pattern step ----------------------------- */
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'steps-pattern-'));
  try {
    const reference = JSON.parse(fs.readFileSync(path.join(EXAMPLE, 'tools', 'dragon-pattern.generated.json'), 'utf8'));
    // Pin the reference's own palette: opening the template default to all 34
    // colors changed nearest-color mapping, so an unrestricted run no longer
    // hits this 11-color-era golden file. Explicit tiles keep the reference
    // covering the restricted-palette conversion path it was generated for.
    const referenceTiles = [...new Set(Object.values(reference.symbolToTile).map(Number))].sort((a, b) => a - b).join(',');
    await execFile('python3', [
      path.join(ROOT, 'editor', 'core', 'scripts', 'image-to-pattern.py'),
      '--source', path.join(EXAMPLE, 'editable', 'hud', 'dragon-right.png'),
      '--template-json', path.join(TEMPLATE, 'template.json'),
      '--allowed-tiles', referenceTiles,
      '--out', path.join(workDir, 'pattern.json'),
      '--preview', path.join(workDir, 'pattern-preview.png'),
    ]);
    const generated = JSON.parse(fs.readFileSync(path.join(workDir, 'pattern.json'), 'utf8'));
    assert.equal(generated, reference, 'image-to-pattern reproduces the reference pattern JSON exactly');

    const allowed = new Set(Object.values(generated.symbolToTile).map(Number));
    const templateJson = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'template.json'), 'utf8'));
    for (const tile of allowed) {
      assert.check(templateJson.pattern.allowedTiles.includes(tile), `pattern tile ${tile} is in the template allowed list`);
    }
    assert.check(generated.rows.length === generated.height, 'pattern row count equals height');
    assert.check(generated.rows.every((row) => row.length <= generated.width), 'pattern rows fit width');
    const filledCells = Object.values(generated.colorCounts).reduce((sum, count) => sum + count, 0);
    const activeCells = generated.rows.join('').replace(/ /g, '').length;
    assert.check(filledCells === activeCells, `colorCounts sum (${filledCells}) equals filled cells (${activeCells})`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }

  /* -------------------------- write-levels ---------------------------- */
  const levelsWork = fs.mkdtempSync(path.join(os.tmpdir(), 'steps-levels-'));
  try {
    await execFile('node', [
      path.join(ROOT, 'editor', 'core', 'scripts', 'write-levels.mjs'),
      '--pattern', path.join(EXAMPLE, 'tools', 'dragon-pattern.generated.json'),
      '--template-root', TEMPLATE,
      '--out', path.join(levelsWork, 'levels.json'),
    ]);
    const artifact = JSON.parse(fs.readFileSync(path.join(levelsWork, 'levels.json'), 'utf8'));
    const levelTemplate = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'template.json'), 'utf8'));
    assert.check(artifact.metrics.openingCompletion <= levelTemplate.maxOpeningCompletion,
      `opening completion ${artifact.metrics.openingCompletion.toFixed(3)} <= ${levelTemplate.maxOpeningCompletion}`);
    for (const level of artifact.levels) {
      assert.check(level.boardData.length === artifact.width * artifact.height, `${level.name} board length correct`);
      assert.check(level.gemsData.length === level.boardData.length, `${level.name} gems length matches board`);
      let parity = true;
      for (let index = 0; index < level.boardData.length; index += 1) {
        if ((level.boardData[index] === 0) !== (level.gemsData[index] === 0)) {
          parity = false;
          break;
        }
      }
      assert.check(parity, `${level.name} Board/Gems occupancy parity`);
      // deterministic scramble: must equal the example's shipped dragon run
      const exampleLevel = JSON.parse(fs.readFileSync(path.join(EXAMPLE, 'editable', 'assets', level.assetPath), 'utf8'))[5][0][2];
      assert.equal(level.boardData, exampleLevel.layers.find((l) => l.name === 'Board').data, `${level.name} board data equals example dragon run`);
      assert.check(artifact.metrics.scrambleMethod === 'move-cycle', `${level.name} uses move-cycle scramble`);
      assert.check(artifact.metrics.certifiedMoveCount >= 3 && artifact.metrics.certifiedMoveCount <= 8,
        `${level.name} certifies ${artifact.metrics.certifiedMoveCount} moves in 3-8 range`);
      assert.check(artifact.metrics.movePatchCount * artifact.metrics.patchSize >=
        Math.ceil((1 - levelTemplate.maxOpeningCompletion) * artifact.metrics.activeCells),
        `${level.name} misplaced cells meet the completion budget`);
      assert.check(Array.isArray(artifact.metrics.moveCyclePatchColors) &&
        artifact.metrics.moveCyclePatchColors.length === artifact.metrics.movePatchCount,
        `${level.name} reports one target color per patch for the guide wiring`);
      assert.check(artifact.metrics.componentCount >= 2, `${level.name} scramble keeps a playable board`);
    }
  } finally {
    fs.rmSync(levelsWork, { recursive: true, force: true });
  }
}
