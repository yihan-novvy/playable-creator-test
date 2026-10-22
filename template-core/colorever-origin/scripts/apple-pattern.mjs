import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = JSON.parse(fs.readFileSync(path.join(root, 'levels/flower5-original.json'), 'utf8'));
const level = JSON.parse(original.level1Text);
const map = level[5][0][2];

// 原样冻结 a.html 的 ScriptableObject；data[2] 是目标 RGBA，data[8]
// 是明确指定的 98 颗开局珠子位置和颜色，不再生成或打乱布局。
const reference = JSON.parse(fs.readFileSync(path.join(root, 'references/a-apple.json'), 'utf8'));
const [W, H, targetRgba] = reference.asset.data;
const colors = new Map([
  ['191,43,21', 1],  // 红皮
  ['255,255,191', 32], // 浅黄色果瓤
  ['106,64,21', 26], // 棕色果核/果柄
  ['255,149,0', 28], // 橙色圈
  ['106,191,85', 20], // 绿叶
]);
function colorGid(rgba) {
  if (rgba[3] < 0.5) return 0;
  const key = rgba.slice(0, 3).map((value) => Math.round(value * 255)).join(',');
  const gid = colors.get(key);
  if (!gid) throw new Error(`a.html 存在未映射的原版颜色: ${key}`);
  return gid;
}
// Unity 行序自下往上，转换成 Tiled 的从上往下；一格仍是一颗珠子。
const indexOf = (index) => (H - 1 - Math.floor(index / W)) * W + index % W;
map.width = W;
map.height = H;
const board = Array(W * H).fill(0);
for (let index = 0; index < W * H; index += 1) {
  board[indexOf(index)] = colorGid(targetRgba.slice(index * 4, index * 4 + 4));
}
const gems = Array(W * H).fill(0);
for (const [index, ...rgba] of reference.asset.data[8]) {
  gems[indexOf(index)] = colorGid(rgba) + 68;
}
// 原版棋盘缺少的 33 颗红珠在暂存区，暂存区尺寸来自原场景组件（12×4）。
const [cacheCols, cacheRows] = reference.trayComponent.data;
const remaining = new Map();
for (const gid of board) if (gid) remaining.set(gid, (remaining.get(gid) || 0) + 1);
for (const gid of gems) if (gid) remaining.set(gid - 68, remaining.get(gid - 68) - 1);
const tray = [...remaining].flatMap(([gid, count]) => Array(count).fill(gid - 1));
if (tray.length !== 33 || tray.some((color) => color !== 0)) throw new Error('a.html 原版暂存区应为 33 颗红珠');
map.cacheGemColor = tray.concat(Array(cacheCols * cacheRows - tray.length).fill(-1));
for (const layer of map.layers) {
  layer.width = W;
  layer.height = H;
  layer.data = layer.name === 'Board' ? board : gems;
}
const guide = JSON.parse(original.guideText);
const phases = guide[5][0][2];
const steps = [
  ['点击棋盘格宝石', '灰2', 'Tap these gems.', '点击这些珠子。'],
  ['点击棋盘格地块', '灰2', 'Fill the empty flesh cells.', '放到空出的果瓤格子里。'],
  ['点击暂存区宝石', '红1', 'Tap the red gems in the tray.', '点击暂存区的红色珠子。'],
  ['点击棋盘格地块', '红1', 'Fill the red apple skin.', '放到空出的红色果皮格子里。'],
];
for (let stage = 1; stage <= 6; stage += 1) {
  const step = steps[stage - 1];
  phases[`阶段${stage}类型`] = step?.[0] ?? '关闭';
  phases[`阶段${stage}颜色`] = step?.[1] ?? '';
  phases[`阶段${stage}文本`] = step ? { en: step[2], zh: step[3] } : {};
}
const data = {
  ...original,
  id: 'apple-red', name: '红色苹果',
  source: 'a.html 原始 13×14 格；浅黄色果瓤、橙色圈；原版开局逐格还原：棋盘 98 颗、暂存区 33 颗红珠',
  level1Text: JSON.stringify(level), guideText: JSON.stringify(guide),
  globalConfigResKey: 'assets/bundle_gemsort/import/69/69d06444-8382-41d3-a2b2-a8f157683a8f.json',
  globalConfigOverrides: { cacheCols, cacheRows },
};
fs.writeFileSync(path.join(root, 'levels/apple-red.json'), JSON.stringify(data, null, 1) + '\n');
