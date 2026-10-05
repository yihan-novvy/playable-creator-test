import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// 从 KittyHoleJam Unity 工程提取 H5 需要的盒子 sprite、地板贴图和音效。
// 只拷贝前 10 关实际用到的 (形状, 颜色) 组合，控制包体积。
// 运行: node scripts/extract-unity-assets.mjs [unity工程路径]

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unity = path.resolve(process.argv[2] || path.join(root, '..', '..', '..', 'novvy-game', 'KittyHoleJam_Unity2022_Source'));
const imagesDir = path.join(unity, 'Assets', 'Images');
const boxConfigAsset = path.join(unity, 'Assets', 'Resources', 'Configs', 'BoxConfig.asset');
const soundsDir = path.join(unity, 'Assets', 'Sounds');
const outAssets = path.join(root, 'src', 'assets');

// BoxObject.cs 里 BoxType 枚举的声明顺序，即 BoxConfig.asset 里的 boxType 序号。
const BOX_TYPES = ['Plus', 'I2', 'I2_90', 'I3', 'I3_90', 'J_0', 'J_90', 'J_180', 'J_270', 'L_0', 'L_90', 'L_180', 'L_270', 'Block_01', 'Block_02', 'R_0', 'R_90', 'R_180', 'R_270', 'T_0', 'T_90', 'T_180', 'T_270'];
const COLOR_NAMES = ['Blue', 'Green', 'Lime', 'Orange', 'Pink', 'Purple', 'Red', 'Sky', 'White', 'Yellow'];

// ---- BoxShapeDetector.cs 的忠实移植（以代码为准，注释与实现有出入的地方跟代码）----

function normalize(cells) {
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  return new Set(cells.map((c) => `${c.x - minX},${c.y - minY}`));
}

function detectBoxType(cells) {
  const s = normalize(cells);
  const has = (x, y) => s.has(`${x},${y}`);
  const parts = [...s].map((k) => k.split(',').map(Number));
  switch (s.size) {
    case 1: return 'Block_01';
    case 2:
      if (has(0, 0) && has(1, 0)) return 'I2_90';
      if (has(0, 0) && has(0, 1)) return 'I2';
      return 'Block_01';
    case 3: {
      if (has(0, 0) && has(1, 0) && has(2, 0)) return 'I3_90';
      if (has(0, 0) && has(0, 1) && has(0, 2)) return 'I3';
      if (has(0, 0) && has(0, 1) && has(1, 0)) return 'R_0';
      if (has(0, 0) && has(1, 0) && has(1, 1)) return 'R_90';
      if (has(1, 0) && has(1, 1) && has(0, 1)) return 'R_180';
      if (has(0, 0) && has(0, 1) && has(1, 1)) return 'R_270';
      return 'Block_01';
    }
    case 4: {
      if (has(0, 0) && has(1, 0) && has(0, 1) && has(1, 1)) return 'Block_02';
      // T：三连直线 + 居中凸起
      for (const y of [0, 1, 2]) {
        if (has(0, y) && has(1, y) && has(2, y)) {
          const stem = parts.find(([px, py]) => py !== y);
          if (stem && stem[0] === 1 && stem[1] < y) return 'T_0';
          if (stem && stem[0] === 1 && stem[1] > y) return 'T_180';
        }
      }
      for (const x of [0, 1, 2]) {
        if (has(x, 0) && has(x, 1) && has(x, 2)) {
          const stem = parts.find(([px, py]) => px !== x);
          if (stem && stem[1] === 1 && stem[0] > x) return 'T_90';
          if (stem && stem[1] === 1 && stem[0] < x) return 'T_270';
        }
      }
      // L
      if (has(0, 0) && has(1, 0) && has(0, 1) && has(0, 2)) return 'L_0';
      if (has(0, 0) && has(1, 0) && has(2, 0) && has(2, 1)) return 'L_90';
      if (has(1, 0) && has(1, 1) && has(1, 2) && has(0, 2)) return 'L_180';
      if (has(0, 0) && has(0, 1) && has(1, 1) && has(2, 1)) return 'L_270';
      // J
      if (has(0, 0) && has(1, 0) && has(1, 1) && has(1, 2)) return 'J_0';
      if (has(0, 1) && has(1, 1) && has(2, 1) && has(2, 0)) return 'J_90';
      if (has(0, 0) && has(0, 1) && has(0, 2) && has(1, 2)) return 'J_180';
      if (has(0, 0) && has(0, 1) && has(1, 0) && has(2, 0)) return 'J_270';
      // R（反 L）
      if (has(0, 0) && has(0, 1) && has(0, 2) && has(1, 0)) return 'R_0';
      if (has(0, 0) && has(1, 0) && has(2, 0) && has(0, 2)) return 'R_90';
      if (has(1, 0) && has(1, 1) && has(1, 2) && has(2, 2)) return 'R_180';
      if (has(0, 1) && has(1, 1) && has(2, 1) && has(2, 2)) return 'R_270';
      return 'Block_01';
    }
    case 5:
      if (has(1, 1) && has(0, 1) && has(2, 1) && has(1, 0) && has(1, 2)) return 'Plus';
      return 'Block_01';
    default:
      return 'Block_01';
  }
}

// ---- 解析 BoxConfig.asset：boxType → [颜色序号 → sprite GUID] ----

function parseBoxConfig() {
  const text = fs.readFileSync(boxConfigAsset, 'utf8');
  const table = new Map(); // boxType 序号 → [guid x10]
  const blocks = text.split(/^ {2}- boxType:/m).slice(1);
  for (const block of blocks) {
    const type = parseInt(block.slice(0, block.indexOf('\n')).trim(), 10);
    const guids = [...block.matchAll(/guid: ([0-9a-f]{32})/g)].map((m) => m[1]);
    if (guids.length !== COLOR_NAMES.length) throw new Error(`boxType ${type} 有 ${guids.length} 个颜色 sprite，应为 ${COLOR_NAMES.length}`);
    table.set(type, guids);
  }
  if (table.size !== BOX_TYPES.length) throw new Error(`BoxConfig 有 ${table.size} 个 boxType，应为 ${BOX_TYPES.length}`);
  return table;
}

// ---- 扫描 .meta 建立 guid → png 路径 ----

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.png.meta')) out.push(full);
  }
  return out;
}

function buildGuidMap() {
  const map = new Map();
  for (const metaPath of walk(imagesDir, [])) {
    const meta = fs.readFileSync(metaPath, 'utf8');
    const m = meta.match(/^guid: ([0-9a-f]{32})/m);
    if (m) map.set(m[1], metaPath.slice(0, -5)); // 去掉 .meta 得到 png 路径
  }
  return map;
}

// ---- 主流程 ----

const config = parseBoxConfig();
const guidMap = buildGuidMap();
const used = new Set(); // `${type}|${color}`
for (let i = 1; i <= 10; i++) {
  const level = JSON.parse(fs.readFileSync(path.join(root, 'src', 'levels', `${i}.json`), 'utf8'));
  for (const box of level.Boxes) used.add(`${detectBoxType(box.Cells)}|${box.Color}`);
}

const outBoxDir = path.join(outAssets, 'boxes');
fs.rmSync(outBoxDir, { recursive: true, force: true });
let copied = 0;
let missing = [];
for (const entry of used) {
  const [typeName, colorStr] = entry.split('|');
  const type = BOX_TYPES.indexOf(typeName);
  const color = parseInt(colorStr, 10);
  const guid = config.get(type)[color];
  const src = guidMap.get(guid);
  if (!src) { missing.push(`${typeName}/${COLOR_NAMES[color]}`); continue; }
  const dest = path.join(outBoxDir, COLOR_NAMES[color], `${typeName}.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

// 地板贴图
const floorSrc = path.join(imagesDir, 'Sprites', 'Cells', 'Floor_Sit.png');
fs.copyFileSync(floorSrc, path.join(outAssets, 'floor.png'));

// 音效转 m4a（ogg 在 iOS WebView 的 WebAudio 里解不了）
const SFX = {
  bgm: 'Cat In A Box (Tinker Bells Free).wav',
  click: 'SE_Click.ogg',
  drop: 'SFX_DropCat_LEGACY.ogg',
  collect: 'coin_collect_flying.ogg',
  coin: 'SE_coin.ogg',
  win: 'SE_win_popup1.ogg',
  fail: 'level_fail.ogg'
};
const outSfx = path.join(outAssets, 'sfx');
fs.mkdirSync(outSfx, { recursive: true });
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
for (const [name, file] of Object.entries(SFX)) {
  const dest = path.join(outSfx, `${name}.m4a`);
  if (!hasFfmpeg) { console.warn(`警告: 未安装 ffmpeg，跳过 ${name}`); continue; }
  const r = spawnSync('ffmpeg', ['-y', '-i', path.join(soundsDir, file), '-vn', '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', dest], { stdio: 'ignore' });
  if (r.status !== 0) console.warn(`警告: ${file} 转码失败`);
}

console.log(`盒子 sprite: ${copied} 张${missing.length ? `，缺失 ${missing.join(', ')}` : ''}`);
console.log(`输出目录: ${outBoxDir}`);
