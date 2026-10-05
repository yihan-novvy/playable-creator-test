import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
function audioGame() {
  class Audio {
    constructor(src) { this.src = src; this.paused = true; this.volume = 1; this.plays = 0; }
    play() { this.paused = false; this.plays++; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const context = vm.createContext({ Audio, URL, window: {}, document: { hidden: false, getElementById: () => null }, assetRoot: 'http://localhost/assets/' });
  vm.runInContext(source.slice(source.indexOf('  var SFX_NAMES'), source.indexOf('  function key(')), context);
  return context;
}

test('背景音乐首次手势开始循环，重复手势不重启也不静音音效', async () => {
  const g = audioGame();
  g.primeAudio();
  await Promise.resolve();
  assert.ok(g.audio.music.src.endsWith('/sfx/bgm.m4a'));
  assert.equal(g.audio.music.loop, true);
  assert.equal(g.audio.music.paused, false);
  g.play('drop');
  g.primeAudio();
  await Promise.resolve();
  assert.equal(g.audio.music.plays, 1);
  assert.equal(g.audio.elems.drop.paused, false);
  assert.equal(g.audio.elems.drop.volume, .9);
});

test('音频解锁完成不能中断同一手势触发的音效', async () => {
  const g = audioGame();
  g.primeAudio();
  g.play('drop');
  await Promise.resolve();
  assert.equal(g.audio.elems.drop.paused, false);
  assert.equal(g.audio.elems.drop.volume, .9);
});

test('片头视频播放中不起 BGM，覆盖层移除后恢复', async () => {
  const g = audioGame();
  g.document.getElementById = () => ({ id: 'novvy-video-intro' }); // 广告壳的片头覆盖层在场
  g.primeAudio(); // 视频阶段的手势(点跳过/静音)
  await Promise.resolve();
  assert.equal(g.audio.music.paused, true); // BGM 不能盖过片头视频
  g.document.getElementById = () => null; // novvy:intro-finished 后覆盖层移除,壳回调 startMusic
  g.startMusic();
  assert.equal(g.audio.music.paused, false);
});

test('静音同时控制音乐和音效，取消静音恢复音乐且不重置进度', () => {
  const g = audioGame();
  g.setMuted(true);
  g.primeAudio();
  assert.equal(g.audio.music.plays, 0);
  g.audio.music.currentTime = 12;
  g.setMuted(false);
  assert.equal(g.audio.music.paused, false);
  assert.equal(g.audio.music.currentTime, 12);
  g.setMuted(true);
  assert.equal(g.audio.music.paused, true);
  const plays = g.audio.elems.drop.plays;
  g.play('drop');
  assert.equal(g.audio.elems.drop.plays, plays);
});
