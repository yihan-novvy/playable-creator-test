export const DEFAULT_LPCS_CONFIG = Object.freeze({
  maxCompletion: 0.3,
  targetCompletion: 0.25,
  maxComponentRatio: 0.2,
  minComponentCountRatio: 1 / 20,
  maxComponentCountRatio: 1 / 5,
  maxSingletonRatio: 0.05,
  targetAverageComponentSize: 12,
  singletonPenalty: 3,
  componentCountPenalty: 2,
  completionPenalty: 200,
});

function assertMatrix(name, matrix, width, height) {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error('width and height must be positive integers');
  }
  if (!Array.isArray(matrix) || matrix.length !== width * height) {
    throw new Error(`${name} must contain exactly width * height cells`);
  }
}

function colorCounts(matrix, emptyValue) {
  const counts = new Map();
  for (const color of matrix) {
    if (color !== emptyValue) counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return counts;
}

function neighborsOf(index, width, height) {
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors = [];
  if (x > 0) neighbors.push(index - 1);
  if (x + 1 < width) neighbors.push(index + 1);
  if (y > 0) neighbors.push(index - width);
  if (y + 1 < height) neighbors.push(index + width);
  return neighbors;
}

function assertConnectedPatch(cells, width, height) {
  const patch = new Set(cells);
  const visited = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const neighbor of neighborsOf(current, width, height)) {
      if (patch.has(neighbor) && !visited.has(neighbor)) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }
  if (visited.size !== cells.length) throw new Error('Every move-cycle patch must be four-neighbor connected');
}

export function assertScrambleContract({ target, scrambled, width, height, emptyValue = 0 }) {
  assertMatrix('target', target, width, height);
  assertMatrix('scrambled', scrambled, width, height);

  for (let index = 0; index < target.length; index += 1) {
    if ((target[index] === emptyValue) !== (scrambled[index] === emptyValue)) {
      throw new Error(`Scramble changed the occupied shape at cell ${index}`);
    }
  }

  const targetCounts = colorCounts(target, emptyValue);
  const scrambledCounts = colorCounts(scrambled, emptyValue);
  if (targetCounts.size !== scrambledCounts.size) {
    throw new Error('Scramble changed the set of colors');
  }
  for (const [color, count] of targetCounts) {
    if (scrambledCounts.get(color) !== count) {
      throw new Error(`Scramble changed the inventory for color ${String(color)}`);
    }
  }

  return true;
}

export function scramblePattern({ target, width, height, emptyValue = 0, config = {} }) {
  assertMatrix('target', target, width, height);
  const settings = { ...DEFAULT_LPCS_CONFIG, ...config };
  const occupied = target.flatMap((color, index) => (color === emptyValue ? [] : [index]));
  const sourceColors = occupied.map((index) => target[index]);
  const activeCells = occupied.length;

  if (activeCells < 2) throw new Error('图案至少需要两个有效格子才能打散。');
  const inventory = [...colorCounts(target, emptyValue)].sort((a, b) => b[1] - a[1]);
  const minimumCompletion = Math.max(0, 2 * inventory[0][1] - activeCells) / activeCells;
  const fallbackLimit = settings.fallbackMaxCompletion ?? settings.maxCompletion;
  const hardLimit = Math.max(settings.maxCompletion, fallbackLimit);
  if (inventory.length < 2 || minimumCompletion > hardLimit) {
    throw new Error(`图案颜色过于集中:主色占 ${(inventory[0][1] / activeCells * 100).toFixed(1)}%,最低开局匹配率为 ${(minimumCompletion * 100).toFixed(1)}%,超过允许的 ${(hardLimit * 100).toFixed(1)}%。请在人工筛选中去掉大面积背景,或使用颜色更丰富的图案。`);
  }

  const analyze = (colors) => {
    const visited = new Set();
    const componentSizes = [];
    let matchingCells = 0;
    let sameColorEdges = 0;

    for (const index of occupied) {
      if (colors[index] === target[index]) matchingCells += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x + 1 < width && colors[index] === colors[index + 1]) sameColorEdges += 1;
      if (y + 1 < height && colors[index] === colors[index + width]) sameColorEdges += 1;
      if (visited.has(index)) continue;

      const stack = [index];
      visited.add(index);
      let size = 0;
      while (stack.length > 0) {
        const current = stack.pop();
        size += 1;
        const currentX = current % width;
        const currentY = Math.floor(current / width);
        const neighbors = [
          [currentX - 1, currentY],
          [currentX + 1, currentY],
          [currentX, currentY - 1],
          [currentX, currentY + 1],
        ];
        for (const [neighborX, neighborY] of neighbors) {
          if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) continue;
          const neighbor = neighborY * width + neighborX;
          if (
            !visited.has(neighbor) &&
            colors[neighbor] !== emptyValue &&
            colors[neighbor] === colors[current]
          ) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        }
      }
      componentSizes.push(size);
    }

    return {
      completion: matchingCells / activeCells,
      componentCount: componentSizes.length,
      largestComponent: componentSizes.reduce((largest, size) => Math.max(largest, size), 0),
      singletonCount: componentSizes.filter((size) => size === 1).length,
      sameColorEdges,
    };
  };

  let best = null;
  for (let shift = 1; shift < activeCells; shift += 1) {
    const candidate = Array(target.length).fill(emptyValue);
    occupied.forEach((boardIndex, index) => {
      candidate[boardIndex] = sourceColors[(index + shift) % activeCells];
    });

    const metrics = analyze(candidate);
    if (metrics.completion > settings.maxCompletion) continue;
    if (metrics.largestComponent > activeCells * settings.maxComponentRatio) continue;
    if (metrics.componentCount < activeCells * settings.minComponentCountRatio) continue;
    if (metrics.componentCount > activeCells * settings.maxComponentCountRatio) continue;
    if (metrics.singletonCount > activeCells * settings.maxSingletonRatio) continue;

    const desiredComponents = Math.round(activeCells / settings.targetAverageComponentSize);
    const score =
      metrics.sameColorEdges -
      metrics.singletonCount * settings.singletonPenalty -
      Math.abs(metrics.componentCount - desiredComponents) * settings.componentCountPenalty -
      Math.abs(metrics.completion - settings.targetCompletion) * settings.completionPenalty;
    if (!best || score > best.score) best = { colors: candidate, metrics, score, shift };
  }

  // A cyclic shift explores only N-1 permutations and cannot handle many
  // uploaded images. Keep the reference path intact; if it fails, shuffle
  // short color runs with a deterministic seed, preserving every tile.
  // Only callers supplying a fallback limit may relax the completion goal.
  if (!best && settings.fallbackMaxCompletion !== undefined) {
    let seed = 123456789;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    for (let trial = 0; trial < 1800; trial += 1) {
      const size = [2, 3, 4, 5, 6, 8, 10, 12, 16][trial % 9];
      const chunks = [];
      for (const [color, count] of inventory) {
        for (let n = 0; n < count; n += size) chunks.push(Array(Math.min(size, count - n)).fill(color));
      }
      for (let i = chunks.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
      }
      const flat = chunks.flat();
      const candidate = Array(target.length).fill(emptyValue);
      occupied.forEach((index, i) => { candidate[index] = flat[i]; });
      const metrics = analyze(candidate);
      if (metrics.completion > fallbackLimit) continue;
      if (metrics.largestComponent > activeCells * settings.maxComponentRatio) continue;
      if (metrics.componentCount < activeCells * settings.minComponentCountRatio) continue;
      if (metrics.componentCount > activeCells * settings.maxComponentCountRatio) continue;
      if (metrics.singletonCount > activeCells * settings.maxSingletonRatio) continue;
      best = { colors: candidate, metrics, shift: null, method: 'color-runs' };
      break;
    }
  }
  if (!best) {
    throw new Error('未找到满足开局匹配率和色块大小限制的打散方案。请先在人工筛选中移除大面积背景或孤立格子,再生成关卡。');
  }

  assertScrambleContract({ target, scrambled: best.colors, width, height, emptyValue });
  return { ...best, config: settings };
}

// Builds a scramble with a certified solution length. If there are K equal-size
// patches, the solution is: park the last patch, place K-1 board patches in
// reverse order, then restore the parked patch. That is exactly K + 1 moves.
export function scramblePatternByMoveCycle({
  target,
  width,
  height,
  patches,
  emptyValue = 0,
  minMoves = 5,
  maxMoves = 8,
  cacheCapacity = 65,
  maxCompletion = 0.59,
}) {
  assertMatrix('target', target, width, height);
  if (!Array.isArray(patches) || patches.length < 2) {
    throw new Error('Move-cycle scrambling requires at least two patches');
  }

  const certifiedMoveCount = patches.length + 1;
  if (certifiedMoveCount < minMoves || certifiedMoveCount > maxMoves) {
    throw new Error(`Certified solution uses ${certifiedMoveCount} moves; expected ${minMoves}-${maxMoves}`);
  }

  const patchSize = patches[0]?.length ?? 0;
  if (patchSize === 0 || patches.some((patch) => !Array.isArray(patch) || patch.length !== patchSize)) {
    throw new Error('Every move-cycle patch must contain the same non-zero number of cells');
  }
  if (patchSize > cacheCapacity) {
    throw new Error(`Move-cycle patch has ${patchSize} cells but the cache only holds ${cacheCapacity}`);
  }

  const claimedCells = new Set();
  const patchColors = patches.map((patch, patchIndex) => {
    assertConnectedPatch(patch, width, height);
    const firstCell = patch[0];
    const color = target[firstCell];
    if (color === emptyValue) throw new Error(`Move-cycle patch ${patchIndex} contains an empty cell`);
    for (const cell of patch) {
      if (!Number.isInteger(cell) || cell < 0 || cell >= target.length) {
        throw new Error(`Move-cycle patch ${patchIndex} contains an invalid cell index`);
      }
      if (claimedCells.has(cell)) throw new Error(`Move-cycle patches overlap at cell ${cell}`);
      if (target[cell] !== color) throw new Error(`Move-cycle patch ${patchIndex} mixes target colors`);
      claimedCells.add(cell);
    }
    return color;
  });

  for (let index = 0; index < patchColors.length; index += 1) {
    if (patchColors[index] === patchColors[(index + 1) % patchColors.length]) {
      throw new Error('Adjacent patches in the move cycle must use different target colors');
    }
  }

  const scrambled = target.slice();
  patches.forEach((patch, patchIndex) => {
    const incomingColor = patchColors[(patchIndex + 1) % patchColors.length];
    for (const cell of patch) scrambled[cell] = incomingColor;
  });

  // Each rotated patch must remain its own selectable color group. If it
  // touches the same incoming color outside the patch, the real move count
  // would differ from the certified plan.
  patches.forEach((patch, patchIndex) => {
    const patchCells = new Set(patch);
    const incomingColor = patchColors[(patchIndex + 1) % patchColors.length];
    for (const cell of patch) {
      for (const neighbor of neighborsOf(cell, width, height)) {
        if (!patchCells.has(neighbor) && scrambled[neighbor] === incomingColor) {
          throw new Error(`Move-cycle patch ${patchIndex} merges with color outside its boundary`);
        }
      }
    }
  });

  assertScrambleContract({ target, scrambled, width, height, emptyValue });
  const activeCells = target.filter((color) => color !== emptyValue).length;
  const misplacedCells = patches.length * patchSize;
  const completion = (activeCells - misplacedCells) / activeCells;
  if (completion > maxCompletion) {
    throw new Error(
      `Certified scramble starts ${(completion * 100).toFixed(1)}% complete; maximum is ${(maxCompletion * 100).toFixed(1)}%`,
    );
  }

  return {
    colors: scrambled,
    certifiedMoveCount,
    patchColors,
    patchSize,
    solution: {
      parkPatch: patches.length - 1,
      boardPlacementOrder: Array.from({ length: patches.length - 1 }, (_, index) => patches.length - 2 - index),
      restoreTrayToPatch: 0,
    },
    metrics: {
      activeCells,
      completion,
      misplacedCells,
      movePatchCount: patches.length,
      patchSize,
    },
  };
}
