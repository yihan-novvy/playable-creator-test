import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLevel } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const out = outFlag < 0 ? path.join(root, 'build', 'template') : path.resolve(args[outFlag + 1]);
if (outFlag >= 0 && !args[outFlag + 1]) throw new Error('--out 需要目录');
const levels = Array.from({ length: 10 }, (_, i) => JSON.parse(fs.readFileSync(path.join(root, 'src', 'levels', `${i + 1}.json`), 'utf8')));
for (let i = 0; i < levels.length; i++) validateLevel(levels[i], i + 1);
const source = fs.readFileSync(path.join(root, 'src', 'game.js'), 'utf8');
if (!source.includes('__DEFAULT_LEVEL_JSON__')) throw new Error('game.js 缺少默认关卡插入点');
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, 'src', 'assets'), path.join(out, 'assets'), { recursive: true, force: true });
fs.writeFileSync(path.join(out, 'game.js'), source.replace('__DEFAULT_LEVEL_JSON__', JSON.stringify(levels[0])));
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const entry = '<script src="game.js" defer></script>';
if (html.split(entry).length !== 2) throw new Error('index.html 缺少唯一 game.js 入口');
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const level of levels) {
  const json = JSON.stringify(level).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const page = html
    .replace(entry, `<script>window.__DRAGON_CUBE_LEVEL__=${json};</script>\n  ${entry}`)
    .replace('<title>DragonCube Playable</title>', `<title>DragonCube · 第 ${level.Index} 关</title>`)
    .replace('<strong id="level-number">1</strong>', `<strong id="level-number">${level.Index}</strong>`);
  fs.writeFileSync(path.join(out, `level${level.Index}.html`), page);
}
fs.copyFileSync(path.join(root, 'src', 'style.css'), path.join(out, 'style.css'));
console.log(`DragonCube 基础包: ${out}`);
console.log('独立关卡入口: level1.html–level10.html');
