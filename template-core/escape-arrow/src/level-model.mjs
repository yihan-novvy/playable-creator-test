// Grid coordinates follow Unity: index = y * width + x, with y increasing up.
export function validateLevel(level, expectedId) {
  const { GridXSize: width, GridYSize: height, Arrows: arrows } = level || {};
  if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= 256)) throw new Error('无效的棋盘尺寸');
  if (expectedId !== undefined && level.Index !== expectedId) throw new Error('关卡编号不匹配');
  if (!Array.isArray(arrows) || !arrows.length) throw new Error('关卡缺少箭头');
  const occupied = new Set();
  for (const arrow of arrows) {
    if (!Array.isArray(arrow?.Indices) || arrow.Indices.length < 2) throw new Error('箭头至少需要两个格子');
    if (!Number.isInteger(arrow.ColorIndex) || arrow.ColorIndex < 0) throw new Error('箭头颜色无效');
    let previous;
    for (const index of arrow.Indices) {
      if (!Number.isInteger(index) || index < 0 || index >= width * height) throw new Error('箭头越界');
      if (occupied.has(index)) throw new Error('箭头格子重复占用');
      occupied.add(index);
      if (previous !== undefined) {
        const dx = Math.abs(index % width - previous % width);
        const dy = Math.abs(Math.floor(index / width) - Math.floor(previous / width));
        if (dx + dy !== 1) throw new Error('箭头路径不连续');
      }
      previous = index;
    }
  }
  return level;
}

export function createState(level, maxLives = 3) {
  validateLevel(level);
  const width = level.GridXSize, height = level.GridYSize;
  const occupancy = new Map();
  const arrows = level.Arrows.map((data, id) => {
    const points = data.Indices.map(index => ({ x: index % width, y: Math.floor(index / width) }));
    for (const index of data.Indices) occupancy.set(index, id);
    return { id, indices: [...data.Indices], points, color: data.ColorIndex, direction: { x: points[0].x - points[1].x, y: points[0].y - points[1].y }, escaped: false, marked: false };
  });
  return { width, height, arrows, occupancy, remaining: arrows.length, steps: 0, lives: maxLives, maxLives, won: false, failed: false };
}

export function escapeRoute(state, id) {
  const arrow = state.arrows[id];
  if (!arrow || arrow.escaped) return null;
  let { x, y } = arrow.points[0];
  for (let distance = 1; distance <= Math.max(state.width, state.height) + 1; distance++) {
    x += arrow.direction.x; y += arrow.direction.y;
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return { clear: true, distance, blocker: null };
    const blocker = state.occupancy.get(y * state.width + x);
    // Self-intersecting escape rays are blocked too, as in Unity CanEscape().
    if (blocker !== undefined) return { clear: false, distance, blocker };
  }
  throw new Error('箭头方向无效');
}

export function attemptEscape(state, id) {
  if (state.won || state.failed) return null;
  const arrow = state.arrows[id], route = escapeRoute(state, id);
  if (!route) return null;
  if (route.clear) {
    // Unity releases logical occupancy immediately, before the visual finishes.
    for (const index of arrow.indices) state.occupancy.delete(index);
    arrow.escaped = true;
    state.remaining--; state.steps++;
    state.won = state.remaining === 0;
    return { ...route, kind: 'escape', lifeLost: false };
  }
  const lifeLost = !arrow.marked;
  arrow.marked = true;
  if (lifeLost) state.lives--;
  state.failed = state.lives <= 0;
  return { ...route, kind: 'blocked', lifeLost };
}

export function availableArrows(state) {
  return state.arrows.filter(arrow => !arrow.escaped && escapeRoute(state, arrow.id).clear).map(arrow => arrow.id);
}

export function solveLevel(level) {
  const state = createState(level), solution = [];
  while (state.remaining) {
    const ready = availableArrows(state);
    if (!ready.length) return null;
    // Removing an arrow cannot block another. Consume each available batch
    // before rescanning large libraries and boards with hundreds of arrows.
    for (const next of ready) { attemptEscape(state, next); solution.push(next); }
  }
  return solution;
}

// The visible snake is a constant-length window along tail -> head -> escape ray.
// Render and hit testing use the same rounded path; rule checks stay on the grid.
export function roundedPath(points, radius = .23) {
  const result = [{ ...points[points.length - 1] }], reversed = [...points].reverse();
  for (let i = 1; i < reversed.length - 1; i++) {
    const a = reversed[i - 1], b = reversed[i], c = reversed[i + 1];
    const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y;
    if (ux === vx && uy === vy) { result.push({ ...b }); continue; }
    const p = { x: b.x - ux * radius, y: b.y - uy * radius }, q = { x: b.x + vx * radius, y: b.y + vy * radius };
    result.push(p);
    for (let j = 1; j <= 6; j++) {
      const t = j / 6, s = 1 - t;
      result.push({ x: s * s * p.x + 2 * s * t * b.x + t * t * q.x, y: s * s * p.y + 2 * s * t * b.y + t * t * q.y });
    }
  }
  result.push({ ...points[0] });
  return result;
}

export function pathMetrics(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  return { points, lengths, length: lengths[lengths.length - 1] };
}

export function escapeTiming(pathLength, headDistanceToEdge) {
  // Finish just after the tail clears the visible canvas. An extra viewport of
  // invisible travel made short animations appear to vanish almost instantly.
  const travel = pathLength + Math.max(0, headDistanceToEdge) + .5;
  return { travel, duration: Math.max(650, travel / 36 * 1000) };
}

export function movingPath(path, direction, distance) {
  function sample(d) {
    if (d >= path.length) { const head = path.points[path.points.length - 1]; return { x: head.x + direction.x * (d - path.length), y: head.y + direction.y * (d - path.length) }; }
    let i = 1;
    while (path.lengths[i] < d) i++;
    const span = path.lengths[i] - path.lengths[i - 1], t = span ? (d - path.lengths[i - 1]) / span : 0;
    const a = path.points[i - 1], b = path.points[i];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  const result = [sample(distance)];
  for (let i = 1; i < path.points.length; i++) if (path.lengths[i] > distance) result.push(path.points[i]);
  result.push(sample(path.length + distance));
  return result;
}
