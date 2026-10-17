import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { solveLevel, createState, escapeRoute } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'escape-arrow-confetti-'));
const read = id => JSON.parse(fs.readFileSync(path.join(root, `editor/templates/escape-arrow/levels/${id}.json`), 'utf8'));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await context.addInitScript(() => {
    window.qaBursts = 0;
    window.__ESCAPE_ARROW_GAMEPLAY__ = { lives: 1, hints: 2, allowReplay: true };
    window.addEventListener('escape-arrow:confetti', () => window.qaBursts++);
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const open = async id => {
    await page.goto(pathToFileURL(path.join(root, `editor/templates/escape-arrow/play/${id}.html`)).href);
    await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__);
  };
  const click = async id => {
    const p = await page.evaluate(id => {
      const p = window.EscapeArrow.getArrowScreenPoint(id), rect = document.getElementById('board').getBoundingClientRect();
      return { x: rect.left + p.x, y: rect.top + p.y };
    }, id);
    await page.mouse.click(p.x, p.y);
  };
  const solve = async id => { for (const arrow of solveLevel(read(id))) await click(arrow); };
  const pixels = () => page.locator('#win-confetti').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]) count++;
    return count;
  });
  await open(8);
  assert.equal(await page.locator('#win-confetti').isVisible(), false);
  await solve(8);
  await page.locator('#win-confetti').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#result').isVisible(), false, 'the opening burst precedes the result dialog');
  await page.waitForTimeout(220);
  assert.ok(await pixels() > 500, 'rainbow paper is visibly rendered');
  await page.screenshot({ path: path.join(screenshots, 'cannons.png') });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('novvy:viewablechange', { detail: { viewable: false } })));
  await page.waitForTimeout(50);
  const paused = await page.locator('#win-confetti').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('#win-confetti').evaluate(canvas => canvas.toDataURL()), paused, 'paper animation pauses while the ad is hidden');
  assert.equal(await page.locator('#result').isVisible(), false, 'hidden time does not consume the celebration');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('novvy:viewablechange', { detail: { viewable: true } })));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#win-confetti').evaluate(canvas => canvas.width), 640, 'particle surface resizes at the device pixel ratio');
  await page.locator('#result').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#result-title').textContent(), 'All clear!');
  assert.equal(await page.locator('#win-confetti').evaluate(canvas => getComputedStyle(canvas).pointerEvents), 'none');
  assert.equal(await page.locator('#result-reset').evaluate(button => {
    const r = button.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button;
  }), true, 'paper never blocks replay input');
  await page.screenshot({ path: path.join(screenshots, 'small-phone-result.png') });
  await page.locator('#result-reset').click();
  assert.equal(await page.locator('#win-confetti').isVisible(), false);
  assert.equal(await pixels(), 0, 'replay clears the previous particles');
  await solve(8);
  await page.locator('#result').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.qaBursts), 2, 'each successful round emits exactly one new celebration');
  await page.locator('#win-confetti').waitFor({ state: 'hidden', timeout: 6000 });
  assert.equal(await pixels(), 0, 'finished particles are disposed');
  await open(16);
  const state = createState(read(16)), blocked = state.arrows.find(arrow => !escapeRoute(state, arrow.id).clear).id;
  await click(blocked);
  await page.locator('#result').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#result-title').textContent(), 'Out of lives');
  assert.equal(await page.evaluate(() => window.qaBursts), 0, 'failure never celebrates');
  assert.equal(await page.locator('#win-confetti').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS visible confetti, pre-result celebration, pause/resume, resize, click-through, replay cleanup and no confetti on failure');
  console.log('Screenshots: ' + screenshots);
} finally { await browser.close(); }
