import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from '../../../editor/server.mjs';
import { createTask, updateTaskConfig, deleteTask } from '../../../editor/lib/store.mjs';
import { runStep } from '../../../editor/core/runner.mjs';

// 结算重玩弹窗契约(colorever-new/escape-arrow 同款语义,在 dragon-cube 的落地):
// ①可重玩回合的结算事件带 replayable:true,段桥按 continue_playing 结算并保留当前段;
// ②转化桥对可重玩回合不武装"回访每击转化";③点击弹窗 = 用户主动换条:
// novvy:replay-cta(手动转化,不读自动闩锁)→ 页内重开本关原版布局 →
// novvy:playable-replay(段桥调 SDK onReplay、重置本轮闩锁,下一轮重新可转化)。
// 未开启(enabled=false)时包行为与旧版完全一致。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const task = createTask({ name: 'dragon-cube-replay-' + Date.now(), templateId: 'dragon-cube' });
const server = createServer();
let browser;
try {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.qaSdk = []; window.qaEvents = [];
    for (const name of ['novvy:playable-complete', 'novvy:victory', 'novvy:cta-moment', 'novvy:replay-cta', 'novvy:playable-replay', 'novvy:phase2-start']) {
      window.addEventListener(name, (event) => window.qaEvents.push({ name, detail: event.detail, state: window.DragonCube?.getState() }));
    }
    window.NovvyPlayable = {
      setStageList: (chain) => window.qaSdk.push(['chain', chain]),
      setStage: (index, type) => window.qaSdk.push(['stage', index, type]),
      onStep: (step, detail) => window.qaSdk.push(['step', step, detail]),
      onComplete: (detail) => window.qaSdk.push(['complete', detail]),
      onReplay: () => window.qaSdk.push(['replay']),
      click: (detail) => window.qaSdk.push(['click', detail]),
    };
  });
  const pack = async (patch) => {
    const config = { levelId: 1, intro: { enabled: false }, outro: { enabled: false }, secondPlayable: { enabled: false }, cta: { endMask: false }, playableCta: { mode: 'complete', afterSteps: 8 }, replay: { enabled: true, text: '猫咪都回家啦！', button: '再玩一次！' }, ...patch };
    updateTaskConfig(task.id, config);
    const options = { taskId: task.id, templateId: 'dragon-cube', projectRoot: path.join(root, 'project', task.id), resultRoot: path.join(root, 'result', task.id), config };
    for (const stepId of ['level', 'pack']) {
      const result = await runStep({ ...options, stepId });
      assert.equal(result.ok, true, result.error);
    }
    await page.goto(`${base}/result/${task.id}/index.html`);
    await page.waitForFunction(() => window.__DRAGON_CUBE_READY__);
    await page.evaluate(() => window.DragonCube.setMuted(true)); // 静音跳过胜利音乐等待,结算回调立即放行
  };
  // 第 1 关原版布局:天蓝色盒 (0,3) 上推 3 格收 4 只天猫;粉色盒 (2,0) 下推 3 格收 4 只粉猫。
  const cellPoint = (x, y) => page.evaluate(([cx, cy]) => {
    const level = window.__DRAGON_CUBE_LEVEL__;
    const xs = level.Cells.map((cell) => cell.Index.x), ys = level.Cells.map((cell) => cell.Index.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const rect = document.getElementById('board').getBoundingClientRect();
    const columns = maxX - minX + 1, rows = maxY - minY + 1;
    const cell = Math.min((rect.width - 26) / columns, (rect.height - 28) / rows, 64);
    const left = (rect.width - columns * cell) / 2, top = (rect.height - rows * cell) / 2;
    return { x: rect.left + left + (cx - minX + .5) * cell, y: rect.top + top + (maxY - cy + .5) * cell };
  }, [x, y]);
  const drag = async (from, to) => {
    const a = await cellPoint(...from), b = await cellPoint(...to);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
  };
  const win = async () => {
    await drag([0, 3], [0, 0]);
    await page.waitForFunction(() => window.DragonCube.getState().collected === 4, undefined, { polling: 80 });
    await drag([2, 0], [2, 3]);
    await page.waitForFunction(() => window.DragonCube.getState().finished, undefined, { polling: 80 });
  };
  const clicks = () => page.evaluate(() => window.qaSdk.filter((call) => call[0] === 'click'));

  await pack({});
  const packed = fs.readFileSync(path.join(root, 'result', task.id, 'index.html'), 'utf8');
  assert.ok(packed.includes('window.__DRAGON_CUBE_REPLAY__={"enabled":true,"text":"猫咪都回家啦！","button":"再玩一次！"}'), 'custom replay copy is inlined');
  assert.ok(packed.includes('window.__novvyReplayable=true'), 'packed page declares __novvyReplayable');
  assert.ok(packed.includes('id="replay"') && packed.includes('data-novvy-replay'), 'replay prompt DOM ships with the package');

  await win();
  await page.waitForFunction(() => !document.getElementById('replay').hidden, undefined, { polling: 80 });
  assert.equal(await page.locator('#replay-btn').textContent(), '再玩一次！', 'button copy comes from the injected spec');
  assert.equal(await page.locator('#win').isHidden(), true, 'native result card stays hidden for replayable rounds');
  let events = await page.evaluate(() => window.qaEvents);
  assert.equal(events.find((event) => event.name === 'novvy:playable-complete')?.detail.replayable, true, 'playable-complete carries replayable:true');
  assert.equal(events.find((event) => event.name === 'novvy:victory')?.detail.replayable, true, 'victory carries replayable:true');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter((call) => call[0] === 'complete')), [['complete', { result: 'win', continue_playing: true }]], 'segment bridge settles win with continue_playing and holds the stage');
  assert.equal((await clicks()).length, 1, 'exactly one conversion at playable-complete');
  // 可重玩回合不武装"回访每击转化":转化后回访触压保持纯游玩。
  const board = await page.evaluate(() => {
    const rect = document.getElementById('board').getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.click(board.x, board.y);
  assert.equal((await clicks()).length, 1, 'post-conversion tap does not reconvert on a replayable round');

  const beforeClicks = (await clicks()).length;
  await page.locator('#replay-btn').click();
  await page.waitForFunction(() => !window.DragonCube.getState().finished, undefined, { polling: 80 });
  const log = await page.evaluate(() => window.qaSdk);
  assert.equal(log.filter((call) => call[0] === 'click').length, beforeClicks + 1, 'one replay press makes exactly one CTA request');
  assert.equal(log.findLast((call) => call[0] === 'click')[1].scene, 'playable-replay', 'replay converts via the playable-replay scene');
  assert.deepEqual(await page.evaluate(() => window.DragonCube.getState()), { levelId: 1, collected: 0, total: 8, boxes: 2, finished: false }, 'replay rebuilds the authored opening');
  assert.equal(await page.locator('#replay').isHidden(), true, 'prompt hides after replay');
  events = await page.evaluate(() => window.qaEvents);
  const names = events.map((event) => event.name);
  assert.ok(names.lastIndexOf('novvy:replay-cta') >= 0 && names.lastIndexOf('novvy:replay-cta') < names.lastIndexOf('novvy:playable-replay'), 'replay-cta precedes playable-replay');
  assert.equal(events.findLast((event) => event.name === 'novvy:playable-replay').state.finished, false, 'playable-replay fires after the fresh round is ready');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter((call) => call[0] === 'replay')), [['replay']], 'segment bridge calls SDK onReplay once');
  console.log('PASS replay enabled: settlement prompt converts once, rebuilds the round, and keeps conversion fresh');

  // 第二轮:闩锁已重置,完成事件/结算/转化照常再来一次。
  await win();
  await page.waitForFunction(() => !document.getElementById('replay').hidden, undefined, { polling: 80 });
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter((call) => call[0] === 'complete')), [['complete', { result: 'win', continue_playing: true }], ['complete', { result: 'win', continue_playing: true }]], 'second round settles again after onReplay');
  assert.equal((await clicks()).length, 3, 'complete + replay press + second-round complete, each exactly once');
  console.log('PASS second round replays the whole loop after onReplay');

  // 关闭重玩弹窗:包行为与旧版一致,胜利亮原生结算卡,不出现任何重玩通道。
  await pack({ replay: { enabled: false } });
  const offHtml = fs.readFileSync(path.join(root, 'result', task.id, 'index.html'), 'utf8');
  assert.ok(offHtml.includes('window.__DRAGON_CUBE_REPLAY__=null') && !offHtml.includes('window.__novvyReplayable=true;'), 'disabled replay injects null and no __novvyReplayable');
  await win();
  await page.waitForFunction(() => !document.getElementById('win').hidden, undefined, { polling: 80 });
  assert.equal(await page.locator('#replay').isHidden(), true, 'replay prompt stays hidden when disabled');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter((call) => call[0] === 'complete')), [['complete', { result: 'win' }]], 'final win settles without continue_playing');
  assert.deepEqual(await page.evaluate(() => window.qaEvents.map((event) => event.name).filter((name) => name.includes('replay'))), [], 'no replay events without the replay spec');
  console.log('PASS replay disabled: legacy settlement card and no replay events');
  assert.deepEqual(errors, [], 'no page errors');
  console.log('Screenshots dir not used');
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  deleteTask(task.id);
}
