import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {configurePayload, packageGame, unpackGame} from '../../../template-core/shared/standalone/build.mjs';
import {validateLevel} from '../../../template-core/water-sort/src/game.js';

const sha = data => createHash('sha256').update(data).digest('hex');
const cache = new Map();

// All consumers use this final artifact. A default task gets the exact checked
// standalone bytes; gameplay overrides are baked through the same packager.
export function standaloneGame(root, config = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'standalone/manifest.json'), 'utf8'));
  const output = fs.readFileSync(path.join(root, 'standalone/game.js'), 'utf8');
  if (sha(output) !== manifest.sha256 || Buffer.byteLength(output) !== manifest.bytes) {
    throw new Error('独立成品校验失败，请运行 npm run build:standalone');
  }
  const options = {gameplay: config.gameplay};
  if (manifest.id === 'water-sort' && config.level) {
    const level = validateLevel(config.level);
    options.level = {
      ...(level.id !== undefined ? {id:String(level.id)} : {}),
      ...(level.name !== undefined ? {name:String(level.name)} : {}),
      capacity:level.capacity, colors:level.colors, bottles:level.bottles,
    };
  }
  const key = manifest.sha256 + JSON.stringify(options);
  if (cache.has(key)) return cache.get(key);
  const {source, metadata} = unpackGame(output);
  if (sha(source) !== manifest.payloadSha256) throw new Error('独立成品载荷校验失败');
  const configured = configurePayload(source, options);
  const result = configured === source ? output : packageGame(configured, metadata).output;
  if (cache.size >= 16) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
