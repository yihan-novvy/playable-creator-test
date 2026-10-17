// Optional real-browser QA: npm run test:browser -w template-core/escape-arrow.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from '../../../editor/server.mjs';
import { createTask, updateTaskConfig, deleteTask } from '../../../editor/lib/store.mjs';
import { runStep } from '../../../editor/core/runner.mjs';
import { execFile } from '../../../editor/core/lib/exec.mjs';
import { createState, escapeRoute, solveLevel } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escape-arrow-browser-'));
const levels = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, JSON.parse(fs.readFileSync(path.join(root, `editor/templates/escape-arrow/levels/${i + 1}.json`), 'utf8'))]));
let browser, server;
const tasks = [];
const errors = [];
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await context.addInitScript(library => {
    const id = new URL(location.href).searchParams.get('qaLevel');
    if (id) window.__ESCAPE_ARROW_LEVEL__ = library[id];
    window.qaEvents = []; window.qaSdk = [];
    for (const name of ['novvy:playable-complete', 'novvy:victory', 'novvy:phase2-start', 'novvy:playable-failed', 'novvy:playable-replay']) window.addEventListener(name, e => window.qaEvents.push({ name, detail: e.detail }));
    window.NovvyPlayable = { setStageList: chain => window.qaSdk.push(['chain', chain]), setStage: (id, type) => window.qaSdk.push(['stage', id, type]), onStep: (step, data) => window.qaSdk.push(['step', step, data]), onComplete: data => window.qaSdk.push(['complete', data]), onReplay: () => window.qaSdk.push(['replay']), click: data => window.qaSdk.push(['click', data]) };
  }, levels);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const clickArrow = async id => {
    const p = await page.evaluate(id => { const p = window.EscapeArrow.getArrowScreenPoint(id), rect = document.getElementById('board').getBoundingClientRect(); return { x: rect.left + p.x, y: rect.top + p.y }; }, id);
    await page.mouse.click(p.x, p.y);
  };
  const solve = async id => {
    for (const [step, arrowId] of solveLevel(levels[id]).entries()) {
      await clickArrow(arrowId);
      await page.waitForFunction(expected => window.EscapeArrow.getState().escaped === expected, step + 1, { timeout: 3000 });
    }
    await page.waitForFunction(() => window.EscapeArrow.getState().moving === 0, null, { timeout: 4000 });
  };
  const entry = pathToFileURL(path.join(root, 'editor/templates/escape-arrow/game/index.html')).href;
  await page.goto(entry + '?qaLevel=1');
  await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__);
  await clickArrow(0);
  await page.waitForTimeout(250);
  const visibleCyanPixels = await page.evaluate(() => {
    const canvas = document.getElementById('board'), pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 130 && pixels[i + 1] > 190 && pixels[i + 2] > 210 && pixels[i + 3] > 150) count++;
    return count;
  });
  assert.ok(visibleCyanPixels > 100, 'the clicked arrow remains visibly moving after 250ms');
  console.log('PASS short arrow remains visible during its escape instead of vanishing in the first frames');
  for (let id = 1; !process.argv.includes('--integration-only') && id <= 20; id++) {
    await page.goto(entry + '?qaLevel=' + id);
    await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__);
    if ([1, 15, 16, 20].includes(id)) await page.screenshot({ path: path.join(tmp, `phone-${id}.png`) });
    await solve(id);
    const events = await page.evaluate(() => window.qaEvents);
    assert.equal(events.filter(e => e.name === 'novvy:playable-complete').length, 1);
    assert.equal(events.filter(e => e.name === 'novvy:victory').length, 1);
    assert.equal(await page.evaluate(() => window.EscapeArrow.getState().lives), 3);
    console.log(`PASS file:// mobile level ${id}: ${levels[id].Arrows.length} arrows`);
  }
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const task = createTask({ name: 'escape-arrow-browser-' + Date.now(), templateId: 'escape-arrow' }); tasks.push(task.id);
  updateTaskConfig(task.id, { levelId: 16 });
  await page.goto(`${base}/api/tasks/${task.id}/preview`);
  await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__);
  const blocked = createState(levels[16]).arrows.filter(a => !escapeRoute(createState(levels[16]), a.id).clear).slice(0, 3).map(a => a.id);
  for (const id of blocked) { await clickArrow(id); await page.waitForFunction(() => window.EscapeArrow.getState().moving === 0); }
  await page.locator('#result-reset').click();
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().lives), 3);
  const sdk = await page.evaluate(() => window.qaSdk);
  assert.deepEqual(sdk.filter(e => e[0] === 'complete'), [['complete', { result: 'fail', continue_playing: true }]]);
  assert.equal(sdk.filter(e => e[0] === 'replay').length, 1);
  await page.locator('#zoom-in').click();
  const board = await page.locator('#board').boundingBox();
  await page.mouse.move(board.x + 50, board.y + 60); await page.mouse.down();
  await page.mouse.move(board.x + 95, board.y + 100, { steps: 4 }); await page.mouse.up();
  let state = await page.evaluate(() => window.EscapeArrow.getState());
  assert.equal(state.escaped, 0); assert.equal(state.lives, 3); assert.ok(state.zoom > 1); assert.ok(state.pan.x !== 0);
  const cdp = await context.newCDPSession(page), y = board.y + board.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 120, y }, { x: 240, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y }, { x: 270, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok((await page.evaluate(() => window.EscapeArrow.getState().zoom)) > state.zoom, 'pinch zoom works through the viewport guard');
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().escaped), 0);
  await page.locator('#recenter').click(); await page.locator('#theme').click();
  assert.equal(await page.locator('body').getAttribute('data-theme'), 'day');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.screenshot({ path: path.join(tmp, 'small-phone-packed.png') });
  const layout = await page.evaluate(() => ({ board: document.getElementById('board').getBoundingClientRect().bottom, tools: document.querySelector('.game-toolbar').getBoundingClientRect().bottom, cta: document.getElementById('novvy-cta').getBoundingClientRect().top }));
  assert.ok(layout.board <= layout.tools && layout.tools <= layout.cta, 'board controls do not overlap the download card');
  console.log('PASS failure/retry SDK, zoom, drag, pinch, day theme and 320px layout');
  await page.setViewportSize({ width: 390, height: 844 });
  updateTaskConfig(task.id, { levelId: 1, intro: { enabled: true }, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 20, cta: { mode: 'steps', afterSteps: 4 }, background: { enabled: false } } });
  for (const name of ['intro', 'outro']) await execFile('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=10:d=0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path.join(root, `project/${task.id}/uploads/${name}-video.mp4`)]);
  const options = { taskId: task.id, templateId: 'escape-arrow', projectRoot: path.join(root, 'project', task.id), resultRoot: path.join(root, 'result', task.id), config: { levelId: 1, intro: { enabled: true }, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 20 } } };
  for (const stepId of ['intro', 'outro', 'level', 'pack']) { const result = await runStep({ ...options, stepId }); assert.equal(result.ok, true, result.error); }
  await page.goto(`${base}/result/${task.id}/index.html`);
  await page.waitForFunction(() => window.__novvyIntroFinished && window.__ESCAPE_ARROW_READY__, null, { timeout: 10000 });
  await solve(1);
  await page.waitForFunction(() => window.EscapeArrow.getState().levelId === 20, null, { timeout: 10000 });
  await solve(20);
  const stages = await page.evaluate(() => window.qaSdk.filter(e => e[0] === 'stage'));
  assert.deepEqual(stages, [['stage', 1, 'video'], ['stage', 2, 'playable'], ['stage', 3, 'video'], ['stage', 4, 'playable']]);
  const completes = await page.evaluate(() => window.qaSdk.filter(e => e[0] === 'complete'));
  assert.equal(completes.length, 2);
  assert.ok(completes.every(e => e[1].result === 'win'));
  assert.equal((await page.evaluate(() => window.qaSdk.filter(e => e[0] === 'step'))).length, 33);
  console.log('PASS packed intro → level 1 → outro → level 20, 33 progress steps, two final wins');
  for (const id of [49, 100]) {
    await page.goto(pathToFileURL(path.join(root, `editor/templates/escape-arrow/play/${id}.html`)).href);
    await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__);
    await page.locator('#hint').click();
    const state = await page.evaluate(() => window.EscapeArrow.getState());
    assert.ok(state.zoom > 1, 'dense boards zoom in when hinting');
    const arrowId = state.available[0];
    const point = await page.evaluate(id => window.EscapeArrow.getArrowScreenPoint(id), arrowId);
    const board = await page.locator('#board').boundingBox();
    assert.ok(point.x > 0 && point.x < board.width && point.y > 0 && point.y < board.height, 'hint brings the available arrow into view');
    await clickArrow(arrowId);
    await page.waitForFunction(() => window.EscapeArrow.getState().escaped === 1);
    assert.equal(await page.evaluate(() => window.EscapeArrow.getState().lives), 3);
    await page.screenshot({ path: path.join(tmp, `phone-${id}-hint.png`) });
  }
  console.log('PASS dense levels 49 and 100: hint zooms, centers an available arrow, and a real click escapes it');
  await page.goto(`${base}/task.html?id=${task.id}`);
  const select = page.getByRole('combobox', { name: '选择 Escape Arrow 关卡' });
  assert.equal(await select.locator('option').count(), 100);
  await select.selectOption('100');
  await page.waitForFunction(() => document.querySelector('img[alt^="第 100 关"]'));
  const second = page.getByRole('combobox', { name: '第二关编号' });
  assert.equal(await second.locator('option').count(), 100);
  await second.selectOption('100');
  await page.waitForFunction(() => document.getElementById('config-save-state').textContent === '已保存');
  const saved = await (await fetch(`${base}/api/tasks/${task.id}`)).json();
  assert.equal(saved.config.levelId, 100);
  assert.equal(saved.config.secondPlayable.levelId, 100);
  assert.equal(await page.getByRole('link', { name: '浏览前 100 关并试玩 ↗' }).getAttribute('href'), '/templates/escape-arrow/gallery.html');
  console.log('PASS editor offers 100 options for both playables, saves level 100, and links to the gallery');
  assert.deepEqual(errors, []);
  console.log('Screenshots: ' + tmp);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  for (const id of tasks) deleteTask(id);
}
