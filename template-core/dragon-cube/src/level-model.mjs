const point = (cell) => `${cell.x},${cell.y}`;

export function validateLevel(level, expectedId) {
  if (!Number.isInteger(level?.Index) || level.Index < 1 || level.Index > 10 || (expectedId && level.Index !== expectedId)) throw new Error('关卡编号无效');
  if (!Array.isArray(level.Cells) || !Array.isArray(level.Boxes) || level.Boxes.length === 0) throw new Error(`关卡 ${level.Index} 缺少棋盘或色块`);
  if (!Number.isInteger(level.TimeLimit) || level.TimeLimit < 1) throw new Error(`关卡 ${level.Index} 时间无效`);
  const cells = new Set();
  const cats = new Map();
  for (const cell of level.Cells) {
    if (!Number.isInteger(cell?.Index?.x) || !Number.isInteger(cell?.Index?.y)) throw new Error('格子坐标无效');
    const key = point(cell.Index);
    if (cells.has(key)) throw new Error(`重复格子 ${key}`);
    cells.add(key);
    if (cell.Cat) {
      if (!Number.isInteger(cell.Cat.Color) || cell.Cat.Gimmicks?.length) throw new Error(`关卡 ${level.Index} 有未支持的猫机关`);
      cats.set(cell.Cat.Color, (cats.get(cell.Cat.Color) || 0) + 1);
    }
    if (cell.Block) {
      if (cell.Block.Type !== 1 || ![0, 1, 2, 3].includes(cell.Block.Direction) || !Array.isArray(cell.Block.Cats)) throw new Error(`关卡 ${level.Index} 有未支持的猫块`);
      for (const cat of cell.Block.Cats) {
        if (cat.Gimmicks?.length) throw new Error('猫块里有未支持的机关');
        cats.set(cat.Color, (cats.get(cat.Color) || 0) + 1);
      }
    }
  }
  const targets = new Map();
  for (const box of level.Boxes) {
    if (!Number.isInteger(box.Color) || !Number.isInteger(box.Count) || box.Count < 1 || !Array.isArray(box.Cells) || !box.Cells.length || box.Gimmicks?.length) throw new Error(`关卡 ${level.Index} 有未支持的色块`);
    for (const cell of box.Cells) if (!cells.has(point(cell))) throw new Error(`色块引用了棋盘外格子 ${point(cell)}`);
    targets.set(box.Color, (targets.get(box.Color) || 0) + box.Count);
  }
  for (const [color, count] of targets) if (cats.get(color) !== count) throw new Error(`关卡 ${level.Index} 颜色 ${color} 的猫与目标数量不匹配`);
  for (const color of cats.keys()) if (!targets.has(color)) throw new Error(`关卡 ${level.Index} 颜色 ${color} 没有目标色块`);
  for (const key of ['Groups', 'Scratchers', 'Ropes', 'Barricades']) if (level[key]?.length || (level[key] && !Array.isArray(level[key]))) throw new Error(`关卡 ${level.Index} 有未支持的 ${key}`);
  return { id: level.Index, cells: cells.size, cats: [...cats.values()].reduce((a, b) => a + b, 0), boxes: level.Boxes.length };
}
