import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {taskResultDir} from '../../lib/paths.mjs';

const run = promisify(execFile);
export function configureOriginGame(source, gameplay) {
  const marker = /const GAME_CONFIG=\/\*ORIGIN_GAME_CONFIG\*\/([^;]+);/;
  const match = source.match(marker);
  if (!match) throw new Error('独立游戏配置入口缺失，请重新构建模板');
  const defaults = JSON.parse(match[1]);
  const config = Object.fromEntries(Object.keys(defaults).map(key => [key, gameplay?.[key] ?? defaults[key]]));
  return source.replace(marker, () => 'const GAME_CONFIG=/*ORIGIN_GAME_CONFIG*/' + JSON.stringify(config).replaceAll('<', '\\u003c') + ';');
}
export function originHostScript(settings, blockOut = false) {
  const source = fs.readFileSync(new URL('../overlays/origin-host/host.js', import.meta.url), 'utf8');
  const json = JSON.stringify({...settings, blockOut}).replaceAll('<', '\\u003c');
  return `<script>window.ORIGIN_HOST_SETTINGS=${json};\n${source}</script>`;
}
export async function packageOriginGame(ctx) {
  const archive = path.join(ctx.resultDir, 'game-only.zip');
  await run('zip', ['-q', '-X', archive, 'game.js'], {cwd: ctx.resultDir});
  const gameZipBytes = fs.statSync(archive).size;
  if (gameZipBytes > 5000000) throw new Error('独立游戏 ZIP 超过 5 MB');
  const files = fs.readdirSync(ctx.resultDir).filter(file => !file.endsWith('.zip'));
  const rawBytes = files.reduce((sum, file) => sum + fs.statSync(path.join(ctx.resultDir, file)).size, 0);
  if (rawBytes > 30000000) throw new Error('完整素材包解压体积超过 30 MB');
  const budget = path.join(ctx.resultDir, 'assembly-budget.zip');
  await run('zip', ['-q', '-X', budget, ...files], {cwd: ctx.resultDir});
  const assemblyBytes = fs.statSync(budget).size;
  fs.rmSync(budget);
  if (assemblyBytes > 10000000) throw new Error('完整素材 ZIP 超过 10 MB，请压缩片头视频');
  return {gameZipBytes, assemblyBytes};
}
export function exportGameZip({taskId}) {
  const file = path.join(taskResultDir(taskId), 'game-only.zip');
  if (!fs.existsSync(file)) throw Object.assign(new Error('请重新打包，以生成独立游戏 ZIP'), {statusCode:400});
  return fs.readFileSync(file);
}
