import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  computeWinTargetPercent,
  enableTransparentCanvas,
  INGEST_BEACON_HOST,
  jsonAssetPayload,
  patchGlobalConfig,
  patchGuideConfig,
  pickGuideColors,
  routeStoreJumpThroughNovvyBridge,
  stripIngestTelemetry,
  STORE_JUMP_ANCHOR,
  WIN_LEVEL_CONDITION,
} from '../plugins/colorever-gemsort/lib/meta-patch.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..', '..');
const TEMPLATE = path.join(ROOT, 'editor', 'templates', 'colorever-gemsort');

const readPacked = (rel) => JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'game', 'assets', rel), 'utf8'));

export default async function run(assert) {
  /* ------------------------- win percent math ------------------------- */

  // broken-arms-like board: 826 active cells, 486 correct at open, N=5 →
  // fires exactly on the 5th net-correct placement, never earlier.
  const percent = computeWinTargetPercent({ openingMatches: 486, placements: 5, activeCells: 826 });
  const firesAt = (count) => 100 * (count / 826) >= percent;
  assert.equal(firesAt(486 + 4), false, 'percent does not fire at N-1 placements');
  assert.equal(firesAt(486 + 5), true, 'percent fires exactly at N placements');

  // Band property on clean numbers: strictly above the (N-1) boundary, at or
  // below the N boundary.
  const round = computeWinTargetPercent({ openingMatches: 0, placements: 3, activeCells: 100 });
  assert.equal(round, 3 - 1e-9, 'clean numbers give the exact percent minus epsilon');

  assert.equal(computeWinTargetPercent({ openingMatches: 0, placements: 0, activeCells: 826 }), 0, 'placements 0 disables the win (percent 0)');

  // "complete" semantics: placements = every remaining misplaced cell puts the
  // boundary 1e-9 below 100%, so the check passes ONLY at full completion —
  // never at the (N-1) state, never on the N-th placement of a smaller count.
  const completePercent = computeWinTargetPercent({ openingMatches: 486, placements: 826 - 486, activeCells: 826 });
  const completeFiresAt = (correct, occupied) => 100 * (correct / occupied) >= completePercent;
  assert.check(completePercent > 99.99, 'complete percent sits just under 100%');
  assert.equal(completeFiresAt(825, 826), false, 'complete does not fire one gem before completion');
  assert.equal(completeFiresAt(826, 826), true, 'complete fires exactly at full completion');
  assert.equal(completeFiresAt(826, 826 - 20), true, 'complete fires on the final lift too (occupied denominator drops wrong gems)');

  let unreachable = '';
  try { computeWinTargetPercent({ openingMatches: 800, placements: 30, activeCells: 826 }); } catch (e) { unreachable = e.message; }
  assert.check(unreachable.includes('不可达'), 'placements beyond completion still throws');

  let threw = '';
  try { computeWinTargetPercent({ openingMatches: 10, placements: 5, activeCells: 0 }); } catch (e) { threw = e.message; }
  assert.check(threw.includes('activeCells'), 'rejects non-positive activeCells');

  /* --------------- GlobalConfig patch on the real asset --------------- */

  const globalPacked = readPacked('assets/bundle_gemsort/import/69/69d06444-8382-41d3-a2b2-a8f157683a8f.json');
  const result = patchGlobalConfig(globalPacked, { placements: 5, openingMatches: 486, activeCells: 826 });
  const payload = jsonAssetPayload(globalPacked, 'GlobalConfig');
  assert.equal(payload['游戏获胜关卡条件'], WIN_LEVEL_CONDITION, 'patch sets 游戏获胜关卡条件 to level 1');
  assert.equal(payload['游戏获胜目标进度百分比'], percent, 'patch writes the derived percent');
  assert.equal(result.placements, 5, 'patch result echoes placements');
  assert.equal(payload.levelStart, 1, 'patch collapses the level loop start to the win level');
  assert.equal(payload.levelEnd, 1, 'patch collapses the level loop end — an ad has no next level');

  const offPacked = readPacked('assets/bundle_gemsort/import/69/69d06444-8382-41d3-a2b2-a8f157683a8f.json');
  const offResult = patchGlobalConfig(offPacked, { placements: 0, openingMatches: 486, activeCells: 826 });
  assert.equal(offResult.percent, 0, 'placements 0 keeps percent 0');
  assert.equal(jsonAssetPayload(offPacked, 'GlobalConfig')['游戏获胜关卡条件'], 0, 'placements 0 keeps the win switch off');

  /* --------------- transparent-canvas macro patch --------------- */

  const ccSource = fs.readFileSync(path.join(TEMPLATE, 'game', 'assets', 'cocos-js', 'cc.js'), 'utf8');
  const flipped = enableTransparentCanvas(ccSource).source;
  assert.equal(
    ccSource.split('ENABLE_TRANSPARENT_CANVAS:!1').length - 1,
    1,
    'template cc.js carries exactly one off-state transparent-canvas macro',
  );
  assert.equal(
    flipped.split('ENABLE_TRANSPARENT_CANVAS:!0').length - 1,
    1,
    'patch flips the macro exactly once',
  );
  assert.check(
    flipped.length === ccSource.length,
    'patch changes only the macro literal, nothing else moves',
  );
  let macroThrew = '';
  try { enableTransparentCanvas(flipped); } catch (e) { macroThrew = e.message; }
  assert.check(macroThrew.includes('未找到'), 'already-flipped source is rejected, not silently skipped');

  /* ---------------- GuideConfig patch on the real asset ---------------- */

  const guidePacked = readPacked('assets/bundle_gemsort/import/79/799a8078-fd9c-49ab-b968-d1edee157d31.json');
  const colors = pickGuideColors({
    colorCounts: { 3: 244, 31: 382, 34: 21 },
    colorNames: { 3: '红3', 31: '灰1', 34: '灰4' },
  });
  assert.equal(colors.park, '红3', 'park color is the 2nd largest group');
  assert.equal(colors.place, '灰1', 'place color is the largest group');

  // Move-cycle openings pass the patch colors explicitly: the game locks
  // already-correct gems, so only the misplaced patches stay liftable.
  const patchPinned = pickGuideColors({
    colorCounts: { 3: 244, 31: 382, 34: 21 },
    colorNames: { 3: '红3', 31: '灰1', 34: '灰4' },
    preferredParkTile: 34,
    preferredPlaceTile: 3,
  });
  assert.equal(patchPinned.park, '灰4', 'preferred park tile wins over the largest-group ranking');
  assert.equal(patchPinned.place, '红3', 'preferred place tile wins over the largest-group ranking');
  const patchFallback = pickGuideColors({
    colorCounts: { 3: 244, 31: 382, 34: 21 },
    colorNames: { 3: '红3', 31: '灰1', 34: '灰4' },
    preferredParkTile: 999,
    preferredPlaceTile: 3,
  });
  assert.equal(patchFallback.park, '红3', 'unknown preferred tile falls back to the largest-group ranking');

  const guideResult = patchGuideConfig(guidePacked, { park: colors.park, place: colors.place });
  const guidePayload = jsonAssetPayload(guidePacked, 'GuideConfig');
  assert.equal(guidePayload['阶段1颜色'], '红3', 'phase 1 uses the park color');
  assert.equal(guidePayload['阶段2颜色'], '红3', 'phase 2 uses the park color');
  assert.equal(guidePayload['阶段3颜色'], '灰1', 'phase 3 uses the place color');
  assert.equal(guidePayload['阶段6颜色'], '灰1', 'phase 6 uses the place color');
  assert.equal(guideResult.applied.length, 6, 'all six phases patched');
  // One from→to only: the controller batch-skips Close-typed phases, so the
  // guide stops after the phase-4 placement and unlocks free input.
  assert.equal(guidePayload['阶段1类型'], '点击棋盘格宝石', 'demo phases keep their types');
  assert.equal(guidePayload['阶段4类型'], '点击棋盘格地块', 'phase 4 stays the guided drop');
  assert.equal(guidePayload['阶段5类型'], 'Close', 'phase 5 is closed (skipped by the controller)');
  assert.equal(guidePayload['阶段6类型'], 'Close', 'phase 6 is closed (skipped by the controller)');
  assert.check(guideResult.closed.join(',') === '阶段5类型,阶段6类型', 'closed echoes the two type keys');

  let missing = '';
  try { patchGuideConfig(guidePacked, { park: '紫9', place: '灰1' }); } catch (e) { missing = e.message; }
  assert.check(missing.includes('颜色映射'), 'rejects colors outside the mapping');

  let insufficient = '';
  try { pickGuideColors({ colorCounts: { 3: 10 }, colorNames: { 3: '红3' } }); } catch (e) { insufficient = e.message; }
  assert.check(insufficient.includes('引导色不足'), 'requires two colors');

  /* --------------- ingest telemetry strip on the real bundle --------------- */

  // The template's built bundle_gemsort must match the known statement bytes —
  // a re-extract with different obfuscation has to fail the test, not pack.
  const bundleRel = 'assets/assets/bundle_gemsort/index.js';
  const bundleSource = fs.readFileSync(path.join(TEMPLATE, 'game', bundleRel), 'utf8');
  assert.equal(bundleSource.split('fetch(').length - 1, 1, 'template bundle has exactly one fetch');
  const stripped = stripIngestTelemetry(bundleSource);
  assert.equal(stripped.removed, 1, 'strip removes the single ingest statement');
  assert.check(!stripped.source.includes('fetch('), 'no fetch left after the strip');
  assert.check(!stripped.source.includes(INGEST_BEACON_HOST), 'beacon host gone after the strip');
  assert.equal(stripIngestTelemetry(stripped.source).removed, 0, 'strip is idempotent');

  let shapeUnknown = '';
  try { stripIngestTelemetry(`x = 1; "${INGEST_BEACON_HOST}/ingest/abc";`); } catch (e) { shapeUnknown = e.message; }
  assert.check(shapeUnknown.includes('语句形态不符'), 'URL without the known statement shape is refused');

  /* ---------- Novvy-bridge store-jump routing on the real bundle ---------- */

  // installForGame() is the template's single store handoff (win/fail
  // completion auto-jump and the baked overlay button all funnel into it).
  // Its window.open is a silent no-op inside an SDK WebView, so the pack
  // prepends a window.novvy.open() branch — the same bridge the DOM CTA
  // card uses. The original mraid/FbPlayableAd/window.open chain must stay
  // intact behind it for browser previews.
  const mainBundleRel = 'assets/assets/main/index.js';
  const mainBundleSource = fs.readFileSync(path.join(TEMPLATE, 'game', mainBundleRel), 'utf8');
  assert.equal(
    mainBundleSource.split(STORE_JUMP_ANCHOR).length - 1,
    1,
    'template main bundle has exactly one installForGame anchor',
  );
  const bridgePatched = routeStoreJumpThroughNovvyBridge(mainBundleSource);
  assert.equal(bridgePatched.patched, 1, 'bridge routing patches the handoff');
  const branchAt = bridgePatched.source.indexOf('window.__novvyBridgeVersion>=1');
  const anchorAt = bridgePatched.source.indexOf(STORE_JUMP_ANCHOR);
  const varCyAt = bridgePatched.source.indexOf('var cy=b;');
  assert.check(
    branchAt !== -1 && anchorAt !== -1 && varCyAt !== -1 && anchorAt < branchAt && branchAt < varCyAt,
    'novvy branch sits inside installForGame ahead of the original chain',
  );
  assert.check(bridgePatched.source.includes("window.novvy.open();return;"), 'branch hands off to novvy.open and returns early');
  assert.check(bridgePatched.source.includes("mraid") && bridgePatched.source.includes('FbPlayableAd'), 'original mraid/FbPlayableAd chain untouched');
  const secondPass = routeStoreJumpThroughNovvyBridge(bridgePatched.source);
  assert.equal(secondPass.patched, 0, 'bridge routing is idempotent');
  assert.equal(secondPass.source, bridgePatched.source, 'idempotent pass returns identical bytes');

  let storeJumpDrift = '';
  try { routeStoreJumpThroughNovvyBridge(`'installForGame':function(){},${STORE_JUMP_ANCHOR}`); } catch (e) { storeJumpDrift = e.message; }
  assert.check(storeJumpDrift.includes('模板可能已变化'), 'bundle without exactly one anchor is refused');
}
