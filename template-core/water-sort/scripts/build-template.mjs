#!/usr/bin/env node
// Assemble the ad base package consumed by the Playable-Wholehouse editor:
//
//   index.html   ad shell with a classic (non-module) script tag
//   game.js      all code — data-URI BGM, CSS (runtime-injected) and the
//                built-in default level included; static, never per-task
//   stone.svg    replaceable background (the background.webp analogue)
//
// file:// direct-open is a hard requirement, so the package does zero runtime
// fetches: the level ships inside game.js (bundled from src/level.json) and
// tasks override it via an inline window.__WATER_SORT_LEVEL__ script placed
// before game.js. Vite still emits the entry as type="module" + crossorigin
// (both CORS-blocked from file://), so this script normalizes the tag.
//
// Zero-dependency Node: shells out to the local vite for the bundle step,
// then does pure file assembly. Default output is build/template/;
// `--out <dir>` writes elsewhere (monorepo 内默认指向 editor/templates/water-sort/game)。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// vite 的 exports 不暴露 ./bin/vite.js，经 package.json 定位 CLI（兼容 workspaces 提升）。
const VITE_CLI = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const argv = process.argv.slice(2);
const outIndex = argv.indexOf('--out');
const OUT_DIR = outIndex !== -1 ? path.resolve(argv[outIndex + 1]) : path.join(ROOT, 'build', 'template');
const BUILT_DIR = path.join(ROOT, 'build', 'game');

function fail(message) {
  console.error(`build:game 失败: ${message}`);
  process.exit(1);
}

const vite = spawnSync(process.execPath, [VITE_CLI, 'build', '--mode', 'game'], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (vite.status !== 0) fail('vite build --mode game 未成功');

const readBuilt = name => {
  const file = path.join(BUILT_DIR, name);
  if (!fs.existsSync(file)) fail(`vite 产物缺少 ${name}`);
  return fs.readFileSync(file, 'utf8');
};

// Classic script tag, relative src: module scripts and crossorigin requests
// are both CORS-blocked when the package is opened directly from file://.
// The stylesheet is inlined so the whole shell keeps its url(./stone.svg)
// contract — that literal is what Wholehouse's pack/preview rewrite to swap
// in a per-task background.
const html = readBuilt('ad.html')
  .replace(/<link rel="stylesheet"[^>]*href="[^"]*\/([^/"]+\.css)"[^>]*>/, (_, cssName) =>
    `<style>${readBuilt(cssName).replace(/url\(["']?\/stone\.svg["']?\)/g, 'url(stone.svg)')}</style>`)
  .replace(/<script([^>]*)\ssrc="\.?\/?game\.js"([^>]*)><\/script>/, (_, before, after) =>
    // defer keeps classic-script semantics (file://-safe) while restoring the
    // deferred execution modules had — the tag sits in <head>, and without it
    // the game would run before the body's #scene/#status elements exist.
    `<script src="game.js" defer></script>`)
  .replaceAll('ad.html', 'index.html');
if (html.includes('<link rel="stylesheet"')) fail('样式内联失败:index.html 仍残留 <link rel="stylesheet">');
if (!html.includes('<style>')) fail('样式内联失败:未找到 <style> 块');
if (!html.includes('url(./stone.svg)')) fail('壳里缺少 url(./stone.svg),背景替换契约会失效');
if (/type="module"|crossorigin/.test(html)) fail('index.html 仍含 type="module" 或 crossorigin,file:// 直开会被 CORS 拦截');
if (!/<script\s+src="game\.js"\s+defer><\/script>/.test(html)) fail('index.html 未以带 defer 的经典 script 标签相对引用 game.js');
if (/src="\/game\.js"/.test(html)) fail('index.html 使用了绝对路径引用 game.js,子路径挂载会 404');

const gameJs = readBuilt('game.js');
const level = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'level.json'), 'utf8'));
if (gameJs.includes('fetch("./level.json")')) fail('game.js 仍在运行时 fetch level.json,file:// 下会失败');
if (!gameJs.includes(level.name)) fail(`game.js 未内联默认关卡(找不到关卡名 "${level.name}")`);

const files = [
  ['index.html', html],
  ['game.js', gameJs],
  ['stone.svg', fs.readFileSync(path.join(ROOT, 'public', 'stone.svg'), 'utf8')],
];

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, content] of files) {
  fs.writeFileSync(path.join(OUT_DIR, name), content);
}

// 关卡数据与契约清单落在模板目录（game/ 上一级），editor/plugin 只经它们消费。
fs.copyFileSync(path.join(ROOT, 'src', 'level.json'), path.join(OUT_DIR, '..', 'level.json'));
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const manifest = {
  id: 'water-sort',
  name: '水色排序',
  version,
  entry: 'game/index.html',
  levels: [{ id: 'default', name: level.name, path: 'level.json' }],
  constants: {},
};
fs.writeFileSync(path.join(OUT_DIR, '..', 'game-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`\n基础包输出: ${OUT_DIR}`);
for (const [name, content] of files) {
  console.log(`  ${name.padEnd(12)} ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
