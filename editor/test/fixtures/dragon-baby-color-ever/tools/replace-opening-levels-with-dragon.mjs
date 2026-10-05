import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scramblePattern } from './lpcs.mjs';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const patternPath = path.join(toolDir, 'dragon-pattern.generated.json');

const levelAssets = [
  {
    name: 'Level_1',
    path: '../editable/assets/assets/bundle_gemsort/import/7e/7e004f8f-045a-4d95-8990-e680554d88e5.json',
  },
  {
    name: 'Level_2',
    path: '../editable/assets/assets/bundle_gemsort/import/a3/a38a1f95-d085-455f-b030-220e7251927f.json',
  },
];

// Gem tile IDs are exactly 68 greater than their matching socket IDs in the
// two tilesets (the +34 flat gems sit in between).
const GEM_TILE_OFFSET = 68;
const MAX_OPENING_COMPLETION = 0.59;

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
// The photo-derived pattern spreads 300 cells over six colors, so clusters
// run smaller than the defaults assume. Only the chunk-shape limits are
// relaxed here; completion stays well under the game's auto-win threshold.
const scramble = scramblePattern({
  target: boardData,
  width: WIDTH,
  height: HEIGHT,
  config: {
    targetAverageComponentSize: 6,
    maxComponentCountRatio: 1 / 3,
    maxSingletonRatio: 0.08,
    maxComponentRatio: 0.25,
  },
});
const scrambledBoardColors = scramble.colors;
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

const initialMatches = boardData.reduce(
  (matches, tile, index) => matches + Number(tile !== 0 && tile === scrambledBoardColors[index]),
  0,
);
const initialCompletion = initialMatches / boardData.filter(Boolean).length;
if (initialCompletion > MAX_OPENING_COMPLETION) {
  throw new Error(`Opening completion is too high: ${(initialCompletion * 100).toFixed(1)}%`);
}

for (const levelAsset of levelAssets) {
  const levelPath = path.resolve(toolDir, levelAsset.path);
  const packed = JSON.parse(fs.readFileSync(levelPath, 'utf8'));
  const asset = packed?.[5]?.[0];
  const level = asset?.[2];
  if (asset?.[1] !== levelAsset.name || !level?.layers) {
    throw new Error(`${levelAsset.name} asset contract changed; refusing to rewrite an unexpected level`);
  }

  const boardLayer = level.layers.find((layer) => layer.name === 'Board');
  const gemsLayer = level.layers.find((layer) => layer.name === 'Gems');
  if (!boardLayer || !gemsLayer) {
    throw new Error(`${levelAsset.name} must contain both Board and Gems tile layers`);
  }

  level.width = WIDTH;
  level.height = HEIGHT;
  boardLayer.width = WIDTH;
  boardLayer.height = HEIGHT;
  gemsLayer.width = WIDTH;
  gemsLayer.height = HEIGHT;
  boardLayer.data = boardData;
  gemsLayer.data = scrambledGems;
  fs.writeFileSync(levelPath, JSON.stringify(packed));
}

const colorSummary = [...countColors(boardData)]
  .sort(([left], [right]) => left - right)
  .map(([tile, count]) => `${tile}:${pattern.tileNames[String(tile)] ?? tile}×${count}`)
  .join(', ');
console.log(
  `Replaced ${levelAssets.map(({ name }) => name).join(' and ')} with a ${WIDTH}x${HEIGHT} energy-dragon ` +
    `(${boardData.filter(Boolean).length} gems; ${colorSummary}; opening completion ` +
    `${(initialCompletion * 100).toFixed(1)}%; clusters ${scramble.metrics.componentCount}, ` +
    `largest ${scramble.metrics.largestComponent}, singletons ${scramble.metrics.singletonCount}; shift ${scramble.shift}).`,
);
