import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// 冻结静态模板：build = 把 src-game/index.html 原样复制到
// editor/templates/colorever-origin/game/，并落一份随源冻结的 game-manifest.json
// （constants.sourceSha256 由构建时对源文件现算，防插件侧注入时源/产物漂移）。
// 随源一并冻结的还有 assets/bgm.mp3（从 aplv 的 __zip 提取的游戏 BGM
// Gem_Bgm_ingame_play，供插件 BGM 媒体元素化），sha 同样锁进 manifest。
// 除此之外没有任何构建逻辑——playable 本体一字节不改，事件接线全部在插件侧。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '..', '..', 'editor', 'templates', 'colorever-origin');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'src-game'), path.join(out, 'game'), { recursive: true });
const bgmSource = path.join(root, 'assets', 'bgm.mp3');
const bgmSha = createHash('sha256').update(fs.readFileSync(bgmSource)).digest('hex');
fs.copyFileSync(bgmSource, path.join(out, 'bgm.mp3'));
const entrySha = createHash('sha256').update(fs.readFileSync(path.join(out, 'game', 'index.html'))).digest('hex');
fs.writeFileSync(path.join(out, 'game-manifest.json'), `${JSON.stringify({
  id: 'colorever-origin',
  name: 'Colorever Origin（5瓣花原版 playable）',
  version,
  entry: 'game/index.html',
  constants: {
    sourceSha256: entrySha,
    sourceName: '260827_GMP-真试玩-仿-colorever-5瓣花-v15-加15点_en_gc_aplv.html',
    bgmAsset: 'bgm.mp3',
    bgmSha256: bgmSha,
    bgmName: 'Gem_Bgm_ingame_play',
  },
}, null, 2)}\n`);
console.log(`colorever-origin: ${path.join(out, 'game')} (sha256 ${entrySha.slice(0, 12)}…, bgm ${bgmSha.slice(0, 12)}…)`);
