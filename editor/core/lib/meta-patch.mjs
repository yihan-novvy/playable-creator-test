// Pack-time patches for the gemsort meta-game configs (GlobalConfig,
// GuideConfig). Both ship as Cocos JsonAssets whose payload object sits at
// packed[5][0][2]; repack inlines them as text resources from the pack
// workspace, so patching the workspace copies is enough.
//
// Why: the template assets were extracted from the REWORKED dragon project
// where the store-jump switch was left OFF (游戏获胜关卡条件=0 / 目标进度=0)
// and the guide colors (黄3/灰3) don't exist in generated patterns. The
// original ad delivery ran 关卡条件=1 / 进度=60 with guide colors present.

export const WIN_LEVEL_CONDITION = 1;

// The Cocos web device builds its GL context attributes from the macro table:
//   { alpha: <macro>.ENABLE_TRANSPARENT_CANVAS, ... }
// The macro ships false, so the canvas composites opaque. For the DOM
// background layer (background.webp behind a transparent canvas) the pack
// flips it to true in the workspace copy of cocos-js/cc.js (a zip entry, so
// the patched bytes travel inside game.js). The clear-color and GameBg-node
// runtime patches live in the background overlay.
export function enableTransparentCanvas(source) {
  const from = 'ENABLE_TRANSPARENT_CANVAS:!1';
  const to = 'ENABLE_TRANSPARENT_CANVAS:!0';
  const first = source.indexOf(from);
  if (first === -1) throw new Error('透明画布宏未找到(ENABLE_TRANSPARENT_CANVAS:!1),引擎版本可能已变化,拒绝盲改');
  if (source.indexOf(from, first + 1) !== -1) throw new Error('透明画布宏出现多次,替换有歧义,拒绝执行');
  return { source: source.slice(0, first) + to + source.slice(first + from.length) };
}

// The game's only native win switch is progress-based: BSGameDirector.update()
// fires 游戏成功 when currentLevel === 游戏获胜关卡条件 and
// 100 * correct/occupied >= 游戏获胜目标进度百分比. To make the win depend
// on a COUNT of placements instead, derive the percent from the board data:
// percent sits exactly N net-correct placements above the opening fill, so
// the N-th placement crosses it regardless of board geometry. placements may
// also equal ALL remaining misplaced cells (the win.placements="complete"
// sentinel): percent lands 1e-9 below 100%, so the check first passes only
// when every occupied cell is correct — the final move of the guided
// solution (the runtime denominator is occupied, so lifting the last
// misplaced patch already empties the board of wrong gems). The epsilon
// absorbs last-ulp rounding in the game's fill comparison.
export function computeWinTargetPercent({ openingMatches, placements, activeCells }) {
  if (!Number.isInteger(activeCells) || activeCells <= 0) throw new Error(`activeCells 非法: ${activeCells}`);
  if (!Number.isInteger(openingMatches) || openingMatches < 0) throw new Error(`openingMatches 非法: ${openingMatches}`);
  if (!Number.isInteger(placements) || placements < 0) throw new Error(`placements 非法: ${placements}`);
  if (placements === 0) return 0;
  if (openingMatches + placements > activeCells) {
    throw new Error(`胜利条件不可达:开局匹配 ${openingMatches} + 放置 ${placements} > 总格数 ${activeCells},请调低 win.placements`);
  }
  return (100 * (openingMatches + placements)) / activeCells - 1e-9;
}

export function jsonAssetPayload(packed, label) {
  const payload = packed?.[5]?.[0]?.[2];
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${label} 资产契约不符(缺少 [5][0][2] payload),拒绝补丁`);
  }
  return payload;
}

// placements <= 0 leaves the template's off state untouched (0/0 = disabled).
export function patchGlobalConfig(packed, { placements, openingMatches, activeCells }) {
  const payload = jsonAssetPayload(packed, 'GlobalConfig');
  if (!('游戏获胜关卡条件' in payload) || !('游戏获胜目标进度百分比' in payload)) {
    throw new Error('GlobalConfig 缺少获胜条件字段,拒绝补丁');
  }
  const percent = computeWinTargetPercent({ openingMatches, placements, activeCells });
  payload['游戏获胜关卡条件'] = placements > 0 ? WIN_LEVEL_CONDITION : 0;
  payload['游戏获胜目标进度百分比'] = percent;
  // This is an AD, not the full game: the template's levelStart..levelEnd=10
  // loop promises progression that a playable must never deliver. Collapsing
  // the loop to the win level means a player who keeps going after the win
  // replays the SAME board instead of advancing to a different one.
  if ('levelStart' in payload) payload.levelStart = WIN_LEVEL_CONDITION;
  if ('levelEnd' in payload) payload.levelEnd = WIN_LEVEL_CONDITION;
  return { percent, placements };
}

// Guide phases 1-2 (pick a gem, park it) and 3-6 (place cycles) hardcode their
// colors. The template's 黄3/灰3 rarely exist in generated patterns, so rewire
// them. Move-cycle openings: the game LOCKS already-correct gems, so the only
// liftable gems are the scramble's misplaced patches — park/place must be the
// patch colors (park = the color shown on patch 0, place = the color shown on
// patch K-1, i.e. patchColors[1] / patchColors[0]); the guided park frees
// patch 0 and the guided place fills it, which is exactly the certified
// solution. Grouped openings fall back to the two largest groups (park = 2nd,
// place = largest), mirroring the original 黄3→灰3 ordering.

// The hand guide demonstrates exactly ONE from→to (phases 1-2 lift patch 0
// into the cache, 3-4 drop the matching patch into the freed hole) and then
// ends: phases 5-6 are typed "Close" (关闭新手), which GuideController's
// advance loop batch-skips — past the last phase it stops the guide and
// unlocks free input. Leaving 5-6 live is worse than noise on move-cycle
// boards: their place-color patch is already placed-and-locked after phase 4,
// so the finger would point at an unliftable gem and the input gate would
// dead-lock the board before the "complete" win could ever fire.
export const GUIDE_LAST_DEMO_PHASE = 4;

export function pickGuideColors({ colorCounts, colorNames, preferredParkTile, preferredPlaceTile }) {
  const ranked = Object.entries(colorCounts || {})
    .map(([tile, count]) => ({ tile: String(tile), count, name: colorNames?.[String(tile)] }))
    .filter((entry) => entry.count > 0 && entry.name)
    .sort((left, right) => right.count - left.count);
  if (ranked.length < 2) {
    throw new Error(`可选引导色不足(需要 2 种,实际 ${ranked.length} 种)`);
  }
  if (preferredParkTile != null && preferredPlaceTile != null) {
    const parkEntry = ranked.find((entry) => entry.tile === String(preferredParkTile));
    const placeEntry = ranked.find((entry) => entry.tile === String(preferredPlaceTile));
    if (parkEntry && placeEntry) {
      return { park: parkEntry.name, place: placeEntry.name, ranked };
    }
  }
  return { park: ranked[1].name, place: ranked[0].name, ranked };
}

export function patchGuideConfig(packed, { park, place }) {
  const payload = jsonAssetPayload(packed, 'GuideConfig');
  const mapping = payload['颜色映射'];
  if (!mapping) throw new Error('GuideConfig 缺少颜色映射,拒绝补丁');
  for (const name of [park, place]) {
    if (!mapping[name]) throw new Error(`GuideConfig 颜色映射缺少「${name}」,拒绝补丁`);
  }
  const applied = [];
  for (const key of Object.keys(payload)) {
    const match = /^阶段(\d+)颜色$/.exec(key);
    if (!match) continue;
    payload[key] = Number(match[1]) <= 2 ? park : place;
    applied.push(key);
  }
  if (applied.length === 0) throw new Error('GuideConfig 没有可补丁的 阶段N颜色 字段');
  // "Close" normalizes to the enum's 关闭新手 — GuideController skips those
  // phases wholesale, so the guide ends after the first from→to (see
  // GUIDE_LAST_DEMO_PHASE). Type keys are patched separately from colors.
  const closed = [];
  for (const key of Object.keys(payload)) {
    const match = /^阶段(\d+)类型$/.exec(key);
    if (!match) continue;
    if (Number(match[1]) <= GUIDE_LAST_DEMO_PHASE) continue;
    payload[key] = 'Close';
    closed.push(key);
  }
  if (closed.length === 0) throw new Error('GuideConfig 没有可关闭的 阶段N类型 字段');
  return { applied, closed, park, place };
}

// Leftover AI-dev instrumentation in the extracted template: BoardModel ships
// a debug fetch that POSTs lift-cancel state to a log-ingest server on
// 127.0.0.1:7243 which only existed during the original dev session. The call
// is baked into the built bundle_gemsort (string-array obfuscated), fires on
// every cancelCurrentLiftGroup, and logs net::ERR_CONNECTION_REFUSED on any
// machine. src/templates stays pristine, so packs strip it from the workspace
// copy. INGEST_STATEMENT is the exact obfuscated statement text of the current
// template build; a re-extracted template with different obfuscation fails
// loudly here and in the pack output check instead of shipping the beacon.
export const INGEST_BEACON_HOST = '127.0.0.1:7243';

const INGEST_URL = 'http://127.0.0.1:7243/ingest/eadd282d-9fd9-4cb4-a200-497c607db50e';

const INGEST_STATEMENT = "fetch(cS(0x2f3),{'method':cS(0x42c),'headers':{'Content-Type':cS(0x2f8)},'body':JSON[cS(0x3c4)]({'runId':cS(0x1b9),'hypothesisId':'H4','location':cS(0x177),'message':cS(0x407),'data':{'liftedCount':this[cS(0x115)],'region':this['_liftedRegion'],'firstGemId':this[cS(0x21d)][0x0]},'timestamp':Date[cS(0x2a0)]()})})['catch'](function(){});";

// Idempotent: a source without the beacon returns removed 0 unchanged. A URL
// without the known statement shape means the template changed underneath us —
// refuse to pack rather than silently shipping (or blindly cutting) code.
export function stripIngestTelemetry(source) {
  if (typeof source !== 'string') throw new Error('bundle 源码必须是字符串,拒绝补丁');
  const removed = source.split(INGEST_STATEMENT).length - 1;
  if (removed === 0) {
    if (source.includes(INGEST_URL) || source.includes(INGEST_BEACON_HOST)) {
      throw new Error('检测到 ingest 埋点但语句形态不符,拒绝静默打包');
    }
    return { source, removed };
  }
  return { source: source.split(INGEST_STATEMENT).join('').split(INGEST_URL).join(''), removed };
}

// The template's store handoff is PlayableAdPlatform.installForGame(): the
// setOnGameSuccess / setOnGameFail handlers call onGameOverClick() on their
// own when the board completes (and the baked win-overlay button calls it on
// tap) → openStore() → installForGame() → mraid.open / FbPlayableAd /
// window.open(storeUrl, '_blank'). That is the designed conversion flow: the
// ad jumps to the store the moment the game is finished.
//
// The jump's implementation predates the Novvy SDK: in an SDK WebView neither
// mraid nor FbPlayableAd exists, and window.open is a silent no-op — so the
// completion jump only ever worked in browser previews. Fixing it means
// routing the SAME call through the Novvy bridge first: window.novvy.open()
// signals the SDK's unified click pipeline (destination owned by
// adm.clicktrack), exactly like the DOM CTA card. The bridge check mirrors
// intro.js/cta.js (`__novvyBridgeVersion >= 1`); with no bridge the original
// mraid/FbPlayableAd/window.open chain runs untouched, keeping browser
// previews and legacy integrations working as before.
//
// STORE_JUMP_ANCHOR is the exact raw bytes of the current template build; a
// re-extracted template with different minification must fail the pack
// loudly instead of silently shipping a dead jump — same policy as
// stripIngestTelemetry above.
export const STORE_JUMP_ANCHOR = `'installForGame':function(){`;

// Injected at the top of installForGame. The early return skips the
// trailing gameReady/gameClose stubs (empty hooks for the AppLovin flow,
// irrelevant once the SDK takes over).
export const STORE_JUMP_NOVVY_BRANCH =
  `if(typeof window!=='undefined'&&window.__novvyBridgeVersion>=1&&window.novvy&&typeof window.novvy.open==='function'){window.novvy.open();return;}`;

export function routeStoreJumpThroughNovvyBridge(source) {
  if (typeof source !== 'string') throw new Error('bundle 源码必须是字符串,拒绝补丁');
  if (source.includes(STORE_JUMP_NOVVY_BRANCH)) {
    // Idempotent: a workspace copy patched twice must not grow a second
    // branch inside installForGame.
    return { source, patched: 0 };
  }
  const hits = source.split(STORE_JUMP_ANCHOR).length - 1;
  if (hits !== 1) {
    throw new Error(`商店跳转函数锚点出现 ${hits} 次(期望 1 次),模板可能已变化,拒绝静默打包`);
  }
  return {
    source: source.replace(STORE_JUMP_ANCHOR, STORE_JUMP_ANCHOR + STORE_JUMP_NOVVY_BRANCH),
    patched: 1,
  };
}
