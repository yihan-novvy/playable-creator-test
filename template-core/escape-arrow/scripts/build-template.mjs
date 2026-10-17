import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateLevel, solveLevel, createState, availableArrows } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '../../editor/templates/escape-arrow');
const levels = Array.from({ length: 20 }, (_, index) => {
  const id = index + 1, data = { Index: id, ...JSON.parse(fs.readFileSync(path.join(root, `src/levels/${id}.json`), 'utf8')) };
  validateLevel(data, id);
  if (!solveLevel(data)) throw new Error(`第 ${id} 关不可解`);
  return data;
});
const inline = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const model = fs.readFileSync(path.join(root, 'src/level-model.mjs'), 'utf8');
const names = [...model.matchAll(/export function (\w+)/g)].map(match => match[1]);
const runtime = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8').replace('__DEFAULT_LEVEL_JSON__', inline(levels[0]));
const script = `(() => {\nconst EscapeArrowModel = (() => {\n${model.replace(/^export /gm, '')}\nreturn {${names.join(',')}};\n})();\n${runtime}\n})();\n`;
// Only this template's generated directory is replaced. Source assets are local.
fs.rmSync(out, { recursive: true, force: true });
for (const dir of ['game', 'levels', 'previews']) fs.mkdirSync(path.join(out, dir), { recursive: true });
for (const name of ['index.html', 'style.css']) fs.copyFileSync(path.join(root, 'src', name), path.join(out, 'game', name));
fs.cpSync(path.join(root, 'src/assets'), path.join(out, 'game/assets'), { recursive: true });
// The editor consumes the icon via manifest; ship it once when a CTA is enabled.
fs.renameSync(path.join(out, 'game/assets/app-icon.png'), path.join(out, 'app-icon.png'));
fs.writeFileSync(path.join(out, 'game/game.js'), script);
fs.writeFileSync(path.join(out, 'level-model.mjs'), model);
const palette = ['#5ee6ff', '#6cffb5', '#6fa8ff', '#b48cff', '#ff9e7a', '#ffd966', '#ff7fa8', '#4dffd2', '#c9b6ff', '#b6ff6a'];
const catalog = levels.map(level => {
  const id = level.Index, data = JSON.stringify(level);
  fs.writeFileSync(path.join(out, `levels/${id}.json`), data + '\n');
  const width = level.GridXSize, height = level.GridYSize;
  const arrows = level.Arrows.map(arrow => {
    const points = arrow.Indices.map(index => ({ x: index % width + 1, y: height - Math.floor(index / width) }));
    const head = points[0], dx = head.x - points[1].x, dy = head.y - points[1].y;
    const tip = { x: head.x + dx * .16, y: head.y + dy * .16 }, back = { x: head.x - dx * .17, y: head.y - dy * .17 };
    const color = palette[arrow.ColorIndex % palette.length];
    return `<g stroke="${color}" stroke-width=".19" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="${points.map(p => `${p.x},${p.y}`).join(' ')}"/><polyline points="${back.x - dy * .19},${back.y + dx * .19} ${tip.x},${tip.y} ${back.x + dy * .19},${back.y - dx * .19}"/></g>`;
  }).join('');
  fs.writeFileSync(path.join(out, `previews/${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 1} ${height + 1}"><rect width="100%" height="100%" rx=".5" fill="#191b2d"/>${arrows}</svg>\n`);
  return { id, name: `第 ${id} 关 · ${width}×${height} · ${level.Arrows.length} 根箭头`, path: `levels/${id}.json`, preview: `previews/${id}.svg`, width, height, arrows: level.Arrows.length, initiallyFree: availableArrows(createState(level)).length, sha256: createHash('sha256').update(data).digest('hex') };
});
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify({ id: 'escape-arrow', name: 'Escape Arrow（箭头逃脱）', version, entry: 'game/index.html', levels: catalog, constants: { levelModel: 'level-model.mjs', appIcon: 'app-icon.png' } }, null, 2) + '\n');
console.log(`Escape Arrow：已构建 20 关，运行脚本 ${Buffer.byteLength(script)} 字节 → ${out}`);
