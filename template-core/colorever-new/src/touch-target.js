// Prefer a precise actionable hit, then the nearest actionable cell within a
// finger-sized radius in CSS pixels. Never change puzzle state during hit testing.
export function actionableCell(puzzle, region, index) {
  const list = region === 'board' ? puzzle.board : puzzle.tray;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return false;
  const selection = puzzle.selection;
  if (selection?.region === region && selection.indices.includes(index)) return true;
  if (selection && list[index] === 0) {
    if (region === 'board') return puzzle.target[index] === selection.color;
    return selection.region === 'board';
  }
  return !!list[index] && (region === 'tray' || list[index] !== puzzle.target[index]);
}

export function resolveTouchTarget(puzzle, direct, candidates, x, y, radius = 16) {
  if (direct && actionableCell(puzzle, direct.region, direct.index)) return direct;
  let closest = null, distance = radius * radius;
  for (const cell of candidates) {
    if (!actionableCell(puzzle, cell.region, cell.index)) continue;
    const d = (cell.x - x) ** 2 + (cell.y - y) ** 2;
    if (d <= distance) { closest = { region: cell.region, index: cell.index }; distance = d; }
  }
  return closest ?? direct;
}
