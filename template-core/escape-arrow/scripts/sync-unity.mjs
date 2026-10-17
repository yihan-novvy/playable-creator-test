import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateLevel, solveLevel } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unity = path.resolve(process.argv[2] || path.join(root, '../../../../game-project/Unity2022_EscapeArrow'));
const source = path.join(unity, 'Assets/TheVayuputra/ArrowGame');
const levels = path.join(root, 'src/levels'), assets = path.join(root, 'src/assets');
fs.mkdirSync(levels, { recursive: true });
fs.mkdirSync(path.join(assets, 'sfx'), { recursive: true });
for (let id = 1; id <= 20; id++) {
  const data = fs.readFileSync(path.join(source, `Resources/Levels/Level_${id}.json`), 'utf8');
  const level = validateLevel(JSON.parse(data));
  if (!solveLevel(level)) throw new Error(`原版第 ${id} 关不可解`);
  fs.writeFileSync(path.join(levels, `${id}.json`), data);
}
fs.copyFileSync(path.join(source, 'GUI/HandIcon.png'), path.join(assets, 'guide-hand.png'));
fs.copyFileSync(path.join(unity, 'StoreAssets/google-play/app-icon-512.png'), path.join(assets, 'app-icon.png'));
for (const [name, file] of Object.entries({ bgm: 'BGM', click: 'Click', escape: 'EscapeArrow', blocked: 'FailedArrow', win: 'LevelCompetled', fail: 'LevelFailed' })) {
  const result = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(source, `Sound/${file}.wav`), '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', name === 'bgm' ? '64k' : '80k', path.join(assets, `sfx/${name}.m4a`)], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`音频转换失败: ${file}`);
}
console.log('已同步 Unity 前 20 关、手势、图标及 AAC 音频');
