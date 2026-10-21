import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// 冻结静态模板：build = 把 src-game/index.html 原样复制到
// editor/templates/colorever-origin/game/，并落一份随源冻结的 game-manifest.json
// （constants.sourceSha256 由构建时对源文件现算，防插件侧注入时源/产物漂移）。
// 除此之外没有任何构建逻辑——playable 本体一字节不改，事件接线全部在插件侧。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '..', '..', 'editor', 'templates', 'colorever-origin');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'src-game'), path.join(out, 'game'), { recursive: true });
const entrySha = createHash('sha256').update(fs.readFileSync(path.join(out, 'game', 'index.html'))).digest('hex');
fs.writeFileSync(path.join(out, 'game-manifest.json'), `${JSON.stringify({
  id: 'colorever-origin',
  name: 'Colorever Origin（5瓣花原版 playable）',
  version,
  entry: 'game/index.html',
  constants: {
    sourceSha256: entrySha,
    sourceName: '260827_GMP-真试玩-仿-colorever-5瓣花-v15-加15点_en_gc_aplv.html',
  },
}, null, 2)}\n`);
console.log(`colorever-origin: ${path.join(out, 'game')} (sha256 ${entrySha.slice(0, 12)}…)`);
