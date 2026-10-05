import { assertScrambleContract, scramblePatternByMoveCycle } from './lpcs.mjs';

// Advertising opening built from certified move cycles: the board stays equal
// to the target pattern except for K equal-size same-color patches whose
// colors rotate one step, so the puzzle is provably solvable in K+1 moves
// (scramblePatternByMoveCycle in lpcs.mjs). Patches grow only through
// "interior" cells — cells of a selected color whose neighbors all carry that
// same color, an unselected color, or empty — so a patch never borders another
// selected color's region. Free growth plus ordering search almost never
// satisfies the no-merge contract; pushing the constraint into growth makes
// any cyclic order valid deterministically.
//
// Completion targets are tried from simplest to hardest: an opening closer to
// the finished picture means fewer user moves before the win jump. Fragmented
// artwork (no large same-color blobs) drops to a lower target before falling
// back to the grouped scramble in write-levels.
export function scrambleMoveCycle({
  target,
  width,
  height,
  emptyValue = 0,
  seed = 1,
  maxCompletion = 0.9,
  completionTargets = [0.9, 0.85, 0.8, 0.75, 0.7],
  cacheCapacity = 65,
  minMoves = 3,
  maxMoves = 8,
  minPatchSize = 8,
  trialsPerStep = 48,
}) {
  assertScrambleContract({ target, scrambled: target, width, height, emptyValue });
  const occupied = target.flatMap((tile, index) => (tile === emptyValue ? [] : [index]));
  const activeCells = occupied.length;
  const counts = new Map();
  for (const index of occupied) counts.set(target[index], (counts.get(target[index]) || 0) + 1);
  if (activeCells < 2 || counts.size < 2) {
    throw new Error('图案至少需要两种颜色才能轮转色块。');
  }
  if (Math.ceil((1 - completionTargets[completionTargets.length - 1]) * activeCells) < 2 * minPatchSize) {
    throw new Error(`图案太小(${activeCells} 格),无法轮转至少 ${minPatchSize} 格的色块。`);
  }
  let state = (seed >>> 0) || 1;
  const random = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const neighbors = index => {
    const x = index % width, y = Math.floor(index / width);
    return [x > 0 ? index - 1 : -1, x + 1 < width ? index + 1 : -1,
      y > 0 ? index - width : -1, y + 1 < height ? index + width : -1].filter(i => i >= 0);
  };
  const cellsByColor = new Map();
  for (const index of occupied) {
    if (!cellsByColor.has(target[index])) cellsByColor.set(target[index], []);
    cellsByColor.get(target[index]).push(index);
  }
  const entries = [...counts];

  // Grow one patch of exactly `size` interior cells. Frontier cells whose
  // options run out can never regain options (the patch only grows), so the
  // loop always covers a connected blob of at least `size` cells.
  const growPatch = (blob, size) => {
    const cells = [...blob];
    const start = cells[Math.floor(random() * cells.length)];
    const patch = new Set([start]);
    const frontier = [start];
    while (patch.size < size && frontier.length > 0) {
      const pick = Math.floor(random() * frontier.length);
      const options = neighbors(frontier[pick]).filter(cell => blob.has(cell) && !patch.has(cell));
      if (options.length === 0) {
        frontier.splice(pick, 1);
        continue;
      }
      const next = options[Math.floor(random() * options.length)];
      patch.add(next);
      frontier.push(next);
    }
    return patch.size === size ? [...patch] : null;
  };

  // One attempt: pick K qualifying colors, mark their interior cells for this
  // selection, then grow one patch per color from the interior blobs.
  const attempt = (patchCount, patchSize) => {
    const order = entries.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const chosen = [];
    for (const [color, count] of order) {
      if (count >= patchSize) chosen.push(color);
      if (chosen.length === patchCount) break;
    }
    if (chosen.length < patchCount) return null;
    const chosenSet = new Set(chosen);
    const isInterior = new Uint8Array(target.length);
    for (const color of chosen) {
      for (const cell of cellsByColor.get(color)) {
        isInterior[cell] = neighbors(cell).every(n => target[n] === color || !chosenSet.has(target[n])) ? 1 : 0;
      }
    }
    const patches = [];
    for (const color of chosen) {
      const seen = new Set();
      let patch = null;
      for (const cell of cellsByColor.get(color)) {
        if (patch || seen.has(cell) || !isInterior[cell]) continue;
        const blob = new Set([cell]);
        seen.add(cell);
        const stack = [cell];
        while (stack.length) {
          const current = stack.pop();
          for (const next of neighbors(current)) {
            if (!seen.has(next) && isInterior[next] && target[next] === color) {
              seen.add(next);
              blob.add(next);
              stack.push(next);
            }
          }
        }
        if (blob.size >= patchSize) patch = growPatch(blob, patchSize);
      }
      if (!patch) return null;
      patches.push(patch);
    }
    return patches;
  };

  const targets = completionTargets.filter(completion => completion <= maxCompletion);
  let trials = 0;
  for (const completionTarget of targets) {
    const budget = Math.ceil((1 - completionTarget) * activeCells);
    if (budget < 2 * minPatchSize) continue;
    for (let patchCount = Math.max(2, minMoves - 1); patchCount <= maxMoves - 1; patchCount += 1) {
      const patchSize = Math.max(minPatchSize, Math.ceil(budget / patchCount));
      if (patchSize > cacheCapacity) continue;
      for (let t = 0; t < trialsPerStep; t += 1) {
        trials += 1;
        const patches = attempt(patchCount, patchSize);
        if (!patches) continue;
        try {
          const certified = scramblePatternByMoveCycle({
            target, width, height, patches, emptyValue, minMoves, maxMoves, cacheCapacity, maxCompletion,
          });
          // Same component metrics as scrambleGrouped so downstream consumers
          // (runner whitelist, editor board hint) stay unchanged.
          const seen = new Set();
          let componentCount = 0, largestComponent = 0, singletonCount = 0, matching = 0;
          for (const index of occupied) {
            if (certified.colors[index] === target[index]) matching += 1;
            if (seen.has(index)) continue;
            const stack = [index]; seen.add(index); let size = 0;
            while (stack.length) {
              const cell = stack.pop(); size += 1;
              for (const next of neighbors(cell)) {
                if (!seen.has(next) && certified.colors[next] === certified.colors[cell]) {
                  seen.add(next); stack.push(next);
                }
              }
            }
            componentCount += 1;
            largestComponent = Math.max(largestComponent, size);
            if (size === 1) singletonCount += 1;
          }
          return {
            colors: certified.colors,
            metrics: { completion: matching / activeCells, componentCount, largestComponent, singletonCount },
            method: 'move-cycle',
            seed: seed >>> 0,
            shift: null,
            certifiedMoveCount: certified.certifiedMoveCount,
            patchSize: certified.patchSize,
            movePatchCount: certified.metrics.movePatchCount,
            // Target color of each patch in cycle order. The guide needs this:
            // its park/place colors must be the PATCH colors (the only
            // lift-and-move gems on a near-complete board), not the largest
            // groups, whose gems are already correct and therefore locked.
            patchColors: certified.patchColors,
          };
        } catch {
          continue; // certificate refused: try a fresh selection
        }
      }
    }
  }
  throw new Error(
    `无法为 ${activeCells} 格图案找到合适的轮转色块组合(完成度目标 ${targets.join('/')} 共 ${trials} 次尝试已用尽)。` +
    '请简化图案色块分布或调低 maxOpeningCompletion 后重试。',
  );
}
