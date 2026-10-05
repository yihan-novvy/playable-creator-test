import { assertScrambleContract } from './lpcs.mjs';

// Advertising demo: keep each color's inventory together in large regions.
// Empty cells stay fixed. Try shuffled color orders across simple scan paths
// and prefer the fewest separate groups, rather than enforcing fragmentation.
export function scrambleGrouped({ target, width, height, emptyValue = 0, maxCompletion = 0.59, seed = 1 }) {
  assertScrambleContract({ target, scrambled: target, width, height, emptyValue });
  const occupied = target.flatMap((tile, index) => tile === emptyValue ? [] : [index]);
  const counts = new Map();
  for (const index of occupied) counts.set(target[index], (counts.get(target[index]) || 0) + 1);
  const activeCells = occupied.length;
  const largestInventory = Math.max(0, ...counts.values());
  const minimumCompletion = Math.max(0, 2 * largestInventory - activeCells) / activeCells;
  if (activeCells < 2 || counts.size < 2 || minimumCompletion > maxCompletion) {
    throw new Error('图案颜色过于集中,无法在保留每种颜色数量的同时生成可玩的开局。请减少大面积背景或增加主体颜色。');
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
  const analyze = colors => {
    const seen = new Set();
    let matching = 0, componentCount = 0, largestComponent = 0, singletonCount = 0;
    for (const index of occupied) {
      if (colors[index] === target[index]) matching++;
      if (seen.has(index)) continue;
      const stack = [index]; seen.add(index); let size = 0;
      while (stack.length) {
        const cell = stack.pop(); size++;
        for (const next of neighbors(cell)) {
          if (!seen.has(next) && colors[next] === colors[cell]) { seen.add(next); stack.push(next); }
        }
      }
      componentCount++; largestComponent = Math.max(largestComponent, size);
      if (size === 1) singletonCount++;
    }
    return { completion: matching / activeCells, componentCount, largestComponent, singletonCount };
  };
  const paths = [];
  for (const transpose of [false, true]) for (const reverse of [false, true]) for (const snake of [false, true]) {
    const path = occupied.slice().sort((a, b) => {
      const majorA = transpose ? a % width : Math.floor(a / width);
      const majorB = transpose ? b % width : Math.floor(b / width);
      const minorA = transpose ? Math.floor(a / width) : a % width;
      const minorB = transpose ? Math.floor(b / width) : b % width;
      return (majorA - majorB || (minorA - minorB) * (snake && majorA % 2 ? -1 : 1)) * (reverse ? -1 : 1);
    });
    paths.push(path);
  }
  let best = null;
  for (let trial = 0; trial < 256; trial++) {
    const inventory = [...counts];
    for (let i = inventory.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [inventory[i], inventory[j]] = [inventory[j], inventory[i]];
    }
    const path = paths[trial % paths.length];
    const colors = Array(target.length).fill(emptyValue);
    let cursor = 0;
    for (const [color, count] of inventory) for (let i = 0; i < count; i++) colors[path[cursor++]] = color;
    const metrics = analyze(colors);
    if (metrics.completion > maxCompletion) continue;
    // Fewer fragments dominates; for similar group counts prefer an easier
    // start with more beads already in the right place (below the win limit).
    const score = metrics.componentCount + metrics.singletonCount * 2 - metrics.completion;
    if (!best || score < best.score) best = { colors, metrics, score, method: 'grouped-colors', seed: seed >>> 0, shift: null };
  }
  if (!best) throw new Error('当前图案无法同时满足同色聚拢和开局匹配率上限,请调整图案后重试。');
  assertScrambleContract({ target, scrambled: best.colors, width, height, emptyValue });
  return best;
}
