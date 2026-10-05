import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scramblePatternByMoveCycle } from './lpcs.mjs';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
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

const WIDTH = 29;
const HEIGHT = 46;

// Six isolated 65-cell patches form one color cycle. Parking the final patch,
// backfilling the other five, and restoring the parked patch solves the board
// in exactly seven successful user transfers.
const fullBodyRow = (symbol) => `#${symbol.repeat(23)}#`;
const partialBodyRow = (symbol) => `#rr${symbol.repeat(19)}rr#`;
const separatorBodyRow = fullBodyRow('r');

// This is the target board, not a decorative image. Each non-space character
// becomes both a colored socket and the matching gem. The runtime uses the
// Board layer as the answer key and the Gems layer as the movable pieces.
const bottleRows = [
  '#####',
  '#ppp#',
  '#ppppp#',
  '#ppppp#',
  '#ppppp#',
  '##ppp##',
  '#ppp#',
  '#ppp#',
  '##ppp##',
  '#ppppppp#',
  '##ppppppp##',
  '###############',
  '#####################',
  '#uuuuuuuuuuuuuuuuuuu#',
  '#######################',
  '#555555555555555555555#',
  '#####################',
  '##ppppppppppppppp##',
  '###################',
  '###uuuuuuuuuuuuu###',
  '##uuuuuuuuuuuuuuuuu##',
  fullBodyRow('A'),
  fullBodyRow('A'),
  partialBodyRow('A'),
  separatorBodyRow,
  fullBodyRow('B'),
  fullBodyRow('B'),
  partialBodyRow('B'),
  separatorBodyRow,
  fullBodyRow('C'),
  fullBodyRow('C'),
  partialBodyRow('C'),
  separatorBodyRow,
  fullBodyRow('D'),
  fullBodyRow('D'),
  partialBodyRow('D'),
  separatorBodyRow,
  fullBodyRow('E'),
  fullBodyRow('E'),
  partialBodyRow('E'),
  separatorBodyRow,
  fullBodyRow('F'),
  fullBodyRow('F'),
  partialBodyRow('F'),
  '##rrrrrrrrrrrrrrrrrrr##',
  '###################',
];

const boardTileBySymbol = {
  '#': 33, // dark bottle outline
  u: 31, // white milk / glass highlight
  r: 27, // warm gold collar
  p: 25, // pale gold collar highlight
  5: 5, // warm peach glass edge
  1: 1, // pink heart label
  A: 25, // move-cycle patch 1
  B: 5, // move-cycle patch 2
  C: 31, // move-cycle patch 3
  D: 1, // move-cycle patch 4
  E: 25, // move-cycle patch 5
  F: 5, // move-cycle patch 6
};

function centerRow(row) {
  const trimmed = row.trim();
  if (trimmed.length > WIDTH) {
    throw new Error(`Bottle row is ${trimmed.length} cells wide; maximum is ${WIDTH}`);
  }
  const left = Math.floor((WIDTH - trimmed.length) / 2);
  return `${' '.repeat(left)}${trimmed}`.padEnd(WIDTH, ' ');
}

if (bottleRows.length !== HEIGHT) {
  throw new Error(`Bottle must contain ${HEIGHT} rows, received ${bottleRows.length}`);
}

const centeredBottleRows = bottleRows.map(centerRow);
const boardData = centeredBottleRows.flatMap((row) =>
  [...row].map((symbol) => {
    if (symbol === ' ') return 0;
    const tile = boardTileBySymbol[symbol];
    if (!tile) throw new Error(`Unknown bottle symbol: ${symbol}`);
    return tile;
  }),
);

const movePatches = ['A', 'B', 'C', 'D', 'E', 'F'].map((patchSymbol) =>
  centeredBottleRows.flatMap((row, y) =>
    [...row].flatMap((symbol, x) => (symbol === patchSymbol ? [y * WIDTH + x] : [])),
  ),
);

const scramble = scramblePatternByMoveCycle({
  target: boardData,
  width: WIDTH,
  height: HEIGHT,
  patches: movePatches,
  minMoves: 5,
  maxMoves: 8,
  cacheCapacity: 65,
  maxCompletion: 0.59,
});
const scrambledBoardColors = scramble.colors;

// Gem tile IDs are exactly 68 greater than their matching socket IDs in the
// two tilesets. The colors are permuted at launch, but their counts are conserved,
// so every gem still has exactly one compatible destination in the target board.
const gemsData = scrambledBoardColors.map((tile) => (tile === 0 ? 0 : tile + 68));

for (let index = 0; index < boardData.length; index += 1) {
  const boardTile = boardData[index];
  const gemTile = gemsData[index];
  if ((boardTile === 0) !== (gemTile === 0)) {
    throw new Error(`Occupancy mismatch at cell ${index}`);
  }
}

const countColors = (tiles) =>
  tiles.reduce((counts, tile) => {
    if (tile !== 0) counts.set(tile, (counts.get(tile) ?? 0) + 1);
    return counts;
  }, new Map());
const targetCounts = countColors(boardData);
const scrambledCounts = countColors(scrambledBoardColors);
const sortedCounts = (counts) => [...counts].sort(([left], [right]) => left - right);
if (JSON.stringify(sortedCounts(targetCounts)) !== JSON.stringify(sortedCounts(scrambledCounts))) {
  throw new Error('Scramble changed the gem color inventory');
}

const initialMatches = boardData.reduce(
  (matches, tile, index) => matches + Number(tile !== 0 && tile === scrambledBoardColors[index]),
  0,
);
const initialCompletion = initialMatches / boardData.filter(Boolean).length;
if (initialCompletion > 0.59) {
  throw new Error(`Opening completion is still too high: ${(initialCompletion * 100).toFixed(1)}%`);
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
  gemsLayer.data = gemsData;
  fs.writeFileSync(levelPath, JSON.stringify(packed));
}

const activeCells = boardData.filter(Boolean).length;
const colorCounts = [...new Set(Object.values(boardTileBySymbol))]
  .map((tile) => `${tile}:${boardData.filter((value) => value === tile).length}`)
  .join(', ');
console.log(
  `Replaced ${levelAssets.map(({ name }) => name).join(' and ')} with a ${WIDTH}x${HEIGHT} baby bottle ` +
    `(${activeCells} gems; ${colorCounts}; opening completion ${(initialCompletion * 100).toFixed(1)}%; ` +
    `${scramble.metrics.movePatchCount} move patches of ${scramble.patchSize}; ` +
    `certified ${scramble.certifiedMoveCount}-move solution).`,
);
