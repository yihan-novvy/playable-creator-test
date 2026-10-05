export function validateLevel(data) {
  if (!data || !Number.isInteger(data.capacity) || data.capacity < 2 || data.capacity > 6) throw new Error('capacity 必须是 2–6 的整数');
  if (!Array.isArray(data.bottles) || data.bottles.length < 2 || data.bottles.length > 12) throw new Error('bottles 需要 2–12 个瓶子');
  if (!data.colors || !Object.keys(data.colors).length || Object.values(data.colors).some(c => !/^#[0-9a-f]{6}$/i.test(c))) throw new Error('colors 需要使用 #RRGGBB 颜色值');
  const counts = {};
  for (const bottle of data.bottles) {
    if (!Array.isArray(bottle) || bottle.length > data.capacity) throw new Error('瓶子层数不能超过 capacity');
    for (const color of bottle) {
      if (!Object.hasOwn(data.colors, color)) throw new Error(`未知颜色：${color}`);
      counts[color] = (counts[color] || 0) + 1;
    }
  }
  if (!Object.keys(counts).length || Object.values(counts).some(n => n % data.capacity)) throw new Error('每种颜色的格数必须是容量的整数倍');
  return data;
}
export function getMove(bottles, from, to, capacity) {
  const a = bottles[from], b = bottles[to];
  if (!a || !b || from === to || !a.length || b.length === capacity) return null;
  const color = a.at(-1);
  if (b.length && b.at(-1) !== color) return null;
  let count = 0;
  for (let i = a.length - 1; i >= 0 && a[i] === color; i--) count++;
  return { color, count: Math.min(count, capacity - b.length) };
}
export function pour(bottles, from, to, capacity) {
  const move = getMove(bottles, from, to, capacity);
  if (!move) return null;
  const next = structuredClone(bottles);
  next[from].splice(-move.count);
  next[to].push(...Array(move.count).fill(move.color));
  return next;
}
export const isWon = (bottles, capacity) => bottles.every(b => !b.length || b.length === capacity && b.every(c => c === b[0]));
