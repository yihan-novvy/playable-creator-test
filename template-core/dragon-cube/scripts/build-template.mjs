import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// 构建编辑器模板目录：game/（无独立关卡预览页）+ levels/ + game-manifest.json。
// 覆盖层与编辑契约属于 editor/plugins，不再由模板打包；也没有 ZIP——产物目录
// 就是 monorepo 内的 editor/templates/dragon-cube/，无需搬运介质。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
if (outIndex >= 0 && !args[outIndex + 1]) throw new Error('--out 需要目录');
const out = outIndex < 0 ? path.join(root, 'build', 'dragon-cube-template') : path.resolve(args[outIndex + 1]);
if (out === root || root.startsWith(out + path.sep)) throw new Error('请使用独立输出目录');
const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-game.mjs'), '--out', path.join(out, 'game')], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
// 独立关卡入口(levelN.html)只留在本地 build/ 供试玩；广告包的关卡只经
// index.html 注入，混进模板会绕过任务配置。
for (const file of fs.readdirSync(path.join(out, 'game'))) {
  if (/^level\d+\.html$/.test(file)) fs.rmSync(path.join(out, 'game', file));
}
fs.mkdirSync(path.join(out, 'levels'), { recursive: true });
const levels = [];
for (let i = 1; i <= 10; i++) {
  fs.copyFileSync(path.join(root, 'src', 'levels', `${i}.json`), path.join(out, 'levels', `${i}.json`));
  levels.push({ id: i, name: `Level ${i}`, path: `levels/${i}.json` });
}
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = { id: 'dragon-cube', name: 'DragonCube（Unity 前十关）', version, entry: 'game/index.html', levels };
fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`模板输出: ${out}`);
