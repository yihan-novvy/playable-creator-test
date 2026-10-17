import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateLevel, solveLevel } from '../src/level-model.mjs';
import { LEVEL_IDS } from './level-range.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const levelsOnly = args.includes('--levels-only');
const unity = path.resolve(args.find(arg => !arg.startsWith('--')) || path.join(root, '../../../../game-project/Unity2022_EscapeArrow'));
const source = path.join(unity, 'Assets/TheVayuputra/ArrowGame');
const levels = path.join(root, 'src/levels'), assets = path.join(root, 'src/assets');
const sourceLevels = path.join(source, 'Resources/Levels');
// Unity's level 48 is named LeveL_48.json. Preserve its data and normalize the
// destination name; do not silently skip valid levels because of case.
const files = fs.readdirSync(sourceLevels).map(file => ({ file, match: /^level_(\d+)\.json$/i.exec(file) }))
  .filter(entry => entry.match).map(entry => ({ id: Number(entry.match[1]), file: entry.file }))
  .filter(entry => LEVEL_IDS.includes(entry.id)).sort((a, b) => a.id - b.id);
if (files.length !== LEVEL_IDS.length || files.some((entry, index) => entry.id !== LEVEL_IDS[index])) throw new Error('Unity 前 100 关缺失或存在重复编号');
const validated = files.map(({ id, file }) => {
  const data = fs.readFileSync(path.join(sourceLevels, file), 'utf8');
  const level = validateLevel(JSON.parse(data));
  if (!solveLevel(level)) throw new Error(`原版第 ${id} 关不可解`);
  return { id, data };
});
fs.mkdirSync(levels, { recursive: true });
const ids = new Set(validated.map(level => level.id));
for (const file of fs.readdirSync(levels)) if (/^\d+\.json$/.test(file) && !ids.has(Number(file.slice(0, -5)))) fs.rmSync(path.join(levels, file));
for (const { id, data } of validated) fs.writeFileSync(path.join(levels, `${id}.json`), data);
if (!levelsOnly) {
  fs.mkdirSync(path.join(assets, 'sfx'), { recursive: true });
  fs.copyFileSync(path.join(source, 'GUI/HandIcon.png'), path.join(assets, 'guide-hand.png'));
  fs.copyFileSync(path.join(unity, 'StoreAssets/google-play/app-icon-512.png'), path.join(assets, 'app-icon.png'));
  for (const [name, file] of Object.entries({ bgm: 'BGM', click: 'Click', escape: 'EscapeArrow', blocked: 'FailedArrow', win: 'LevelCompetled', fail: 'LevelFailed' })) {
    const result = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(source, `Sound/${file}.wav`), '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', name === 'bgm' ? '64k' : '80k', path.join(assets, `sfx/${name}.m4a`)], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`音频转换失败: ${file}`);
  }
}
console.log(`已同步 Unity 前 ${validated.length} 关（${validated[0].id}–${validated.at(-1).id}）${levelsOnly ? '' : '、手势、图标及 AAC 音频'}`);
