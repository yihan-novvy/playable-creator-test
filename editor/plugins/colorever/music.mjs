import fs from 'node:fs';
import path from 'node:path';

// The build exports this JSON assignment before the game code. Replace only
// this object; never rewrite the shared, hash-checked template on disk.
const AUDIO = /^globalThis\.__COLOREVER_OFFLINE_AUDIO__=(\{[^\n]+\});\r?\n/;

export function embeddedAudio(script) {
  const match = AUDIO.exec(script);
  if (!match) throw new Error('Colorever 音频构建格式已改变，请检查音乐打包适配');
  const audio = JSON.parse(match[1]);
  if (typeof audio.bgm !== 'string') throw new Error('Colorever 构建缺少背景音乐');
  return { audio, length: match[0].length };
}

export function taskGameScript(root, config, musicFile) {
  const script = fs.readFileSync(path.join(root, 'game/game.js'), 'utf8');
  if (config?.music?.source !== 'custom') return script;
  if (!musicFile || !fs.existsSync(musicFile)) throw new Error('请上传 MP3 背景音乐，或选择 Colorever 原版音乐');
  const { audio, length } = embeddedAudio(script);
  audio.bgm = fs.readFileSync(musicFile).toString('base64');
  return `globalThis.__COLOREVER_OFFLINE_AUDIO__=${JSON.stringify(audio)};\n${script.slice(length)}`;
}
