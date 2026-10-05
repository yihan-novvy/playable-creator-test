import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { scrambleGrouped } from '../lib/grouped-scramble.mjs';
import { scrambleMoveCycle } from '../lib/move-cycle-scramble.mjs';

// Parameterized port of the example's tools/replace-opening-levels-with-dragon.mjs.
// Instead of overwriting level JSONs in place, it reads the PRISTINE template
// level files (read-only), computes the scrambled Board/Gems data from a
// pattern JSON, and emits a data artifact:
//
//   { width, height, levels: [{name, assetPath, boardData, gemsData}], metrics }
//
// Applying that artifact onto a workspace copy of the template happens in the
// pack step, so src/templates is never mutated and re-packing is stable.
//
//   node write-levels.mjs --pattern <generated/pattern.json> \
//     --template-root <src/templates/colorever-gemsort> --out <generated/levels.json>

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(SCRIPT_DIR, '..');

function flag(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined;
}

const patternPath = path.resolve(flag('pattern') || '');
const templateRoot = path.resolve(flag('template-root') || '');
const outputPath = path.resolve(flag('out') || '');
if (!fs.existsSync(patternPath)) throw new Error(`Missing pattern JSON: ${patternPath}`);
if (!fs.existsSync(templateRoot)) throw new Error(`Missing template root: ${templateRoot}`);

const template = JSON.parse(fs.readFileSync(path.join(templateRoot, 'template.json'), 'utf8'));
const pattern = JSON.parse(fs.readFileSync(patternPath, 'utf8'));
const { width: WIDTH, height: HEIGHT } = pattern;
if (pattern.rows.length !== HEIGHT) {
  throw new Error(`Pattern must contain ${HEIGHT} rows, received ${pattern.rows.length}`);
}

// Rows come strictly WIDTH wide so the figure keeps its exact asymmetry.
// Do NOT trim+center here: that would re-align every row and destroy
// diagonal or off-center compositions (docs/pattern-replacement rule 4.5).
const gridRows = pattern.rows.map((row) => {
  if (row.length > WIDTH) {
    throw new Error(`Pattern row is ${row.length} cells wide; maximum is ${WIDTH}`);
  }
  return row.padEnd(WIDTH, ' ');
});

const boardData = gridRows.flatMap((row) =>
  [...row].map((symbol) => {
    if (symbol === ' ') return 0;
    const tile = pattern.symbolToTile[symbol];
    if (!tile) throw new Error(`Unknown pattern symbol: ${symbol}`);
    return tile;
  }),
);
// Advertising demo: the opening equals the finished picture except for K
// equal-size color patches rotated among themselves, certifying a K+1-move
// solution. Patterns whose color blobs cannot host such patches fall back to
// the grouped demo scramble. Save the random seed in the artifact so a result
// can be reproduced.
const seedFlag = flag('seed');
const seed = seedFlag === undefined ? randomBytes(4).readUInt32LE() : Number(seedFlag);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be a uint32');
const warnings = [];
let scramble;
try {
  scramble = scrambleMoveCycle({
    target: boardData,
    width: WIDTH,
    height: HEIGHT,
    maxCompletion: template.maxOpeningCompletion,
    seed,
    ...(template.scrambleMoveCycle || {}),
  });
} catch (error) {
  warnings.push(`move-cycle 打散不可用,已回退 grouped-colors:${error.message}`);
  scramble = scrambleGrouped({
    target: boardData,
    width: WIDTH,
    height: HEIGHT,
    maxCompletion: template.maxOpeningCompletion,
    seed,
  });
}
const scrambledBoardColors = scramble.colors;
const GEM_TILE_OFFSET = template.gemTileOffset;
const scrambledGems = scrambledBoardColors.map((tile) => (tile === 0 ? 0 : tile + GEM_TILE_OFFSET));

for (let index = 0; index < boardData.length; index += 1) {
  if ((boardData[index] === 0) !== (scrambledGems[index] === 0)) {
    throw new Error(`Occupancy mismatch at cell ${index}`);
  }
}

const countColors = (tiles) =>
  tiles.reduce((counts, tile) => {
    if (tile !== 0) counts.set(tile, (counts.get(tile) ?? 0) + 1);
    return counts;
  }, new Map());
const sortedCounts = (counts) => [...counts].sort(([left], [right]) => left - right);
if (
  JSON.stringify(sortedCounts(countColors(boardData))) !==
  JSON.stringify(sortedCounts(countColors(scrambledBoardColors)))
) {
  throw new Error('Scramble changed the gem color inventory');
}

const activeCells = boardData.filter(Boolean).length;
const initialMatches = boardData.reduce(
  (matches, tile, index) => matches + Number(tile !== 0 && tile === scrambledBoardColors[index]),
  0,
);
const initialCompletion = initialMatches / activeCells;
if (initialCompletion > template.maxOpeningCompletion) {
  throw new Error(`Opening completion is too high: ${(initialCompletion * 100).toFixed(1)}%`);
}

// Validate the template level contract before emitting data against it.
// level assetPath values are relative to the template's game assets root.
const assetsRoot = path.join(templateRoot, template.game.assetsRoot);
const levels = template.levels.map((levelAsset) => {
  const levelPath = path.join(assetsRoot, levelAsset.assetPath);
  const packed = JSON.parse(fs.readFileSync(levelPath, 'utf8'));
  const asset = packed?.[5]?.[0];
  const level = asset?.[2];
  if (asset?.[1] !== levelAsset.name || !level?.layers) {
    throw new Error(`${levelAsset.name} asset contract changed; refusing to target an unexpected level`);
  }
  const boardLayer = level.layers.find((layer) => layer.name === 'Board');
  const gemsLayer = level.layers.find((layer) => layer.name === 'Gems');
  if (!boardLayer || !gemsLayer) {
    throw new Error(`${levelAsset.name} must contain both Board and Gems tile layers`);
  }
  return {
    name: levelAsset.name,
    assetPath: levelAsset.assetPath,
    boardData,
    gemsData: scrambledGems,
  };
});

const colorSummary = Object.fromEntries(sortedCounts(countColors(boardData)).map(([tile, count]) => [String(tile), count]));
const payload = {
  width: WIDTH,
  height: HEIGHT,
  levels,
  metrics: {
    activeCells,
    openingCompletion: initialCompletion,
    // Exact correct-gem count at open; the pack step derives the count-based
    // win percent from this (src/lib/meta-patch.mjs).
    openingMatches: initialMatches,
    componentCount: scramble.metrics.componentCount,
    largestComponent: scramble.metrics.largestComponent,
    singletonCount: scramble.metrics.singletonCount,
    shift: scramble.shift ?? null,
    scrambleMethod: scramble.method,
    // Move-cycle only; dropped from the JSON for the grouped fallback.
    certifiedMoveCount: scramble.certifiedMoveCount,
    movePatchCount: scramble.movePatchCount,
    patchSize: scramble.patchSize,
    // Patch target colors in cycle order; the pack step wires the hand guide's
    // park/place colors to patches[1]/patches[0] so the guided moves stay
    // liftable on the near-complete opening.
    moveCyclePatchColors: scramble.patchColors,
    seed,
    colorCounts: colorSummary,
    gemTileOffset: GEM_TILE_OFFSET,
  },
  tileNames: pattern.tileNames,
  warnings,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
const methodSummary = scramble.method === 'move-cycle'
  ? `certified ${scramble.certifiedMoveCount} moves (${scramble.movePatchCount} patches x ${scramble.patchSize} cells)`
  : 'grouped colors';
for (const warning of warnings) console.log(`Warning: ${warning}`);
console.log(
  `Scrambled a ${WIDTH}x${HEIGHT} pattern (${activeCells} gems; opening completion ` +
    `${(initialCompletion * 100).toFixed(1)}%; clusters ${scramble.metrics.componentCount}, ` +
    `largest ${scramble.metrics.largestComponent}, singletons ${scramble.metrics.singletonCount}; ` +
    `${methodSummary}; seed ${seed}).`,
);
console.log(`Wrote ${outputPath}`);
