import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 冻结静态模板：build = 把 src-game/ 原样复制到 editor/templates/colorever-gemsort/，
// 并落一份随源冻结的 game-manifest.json。除此之外没有任何构建逻辑。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '..', '..', 'editor', 'templates', 'colorever-gemsort');

fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'src-game'), path.join(out, 'game'), { recursive: true });
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(out, 'game-manifest.json'));
console.log(`colorever-gemsort: ${path.join(out, 'game')}`);
