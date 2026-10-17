import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from '../../../editor/server.mjs';
import { createTask, updateTaskConfig, deleteTask } from '../../../editor/lib/store.mjs';
import { runStep } from '../../../editor/core/runner.mjs';
import { execFile } from '../../../editor/core/lib/exec.mjs';
import { solveLevel, createState, escapeRoute, availableArrows, attemptEscape } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'escape-arrow-replay-'));
const levels = Object.fromEntries([1, 2, 16].map(id => [id, JSON.parse(fs.readFileSync(path.join(root, `editor/templates/escape-arrow/levels/${id}.json`), 'utf8'))]));
const task = createTask({ name: 'escape-arrow-replay-' + Date.now(), templateId: 'escape-arrow' });
const server = createServer();
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.qaSdk = []; window.qaEvents = []; window.qaHideOnReplay = false;
    const snapshot = () => window.EscapeArrow?.getState() || null;
    for (const name of ['novvy:intro-finished', 'novvy:outro-started', 'novvy:outro-finished', 'novvy:phase2-start', 'novvy:playable-complete', 'novvy:playable-replay']) {
      window.addEventListener(name, event => {
        window.qaEvents.push({ name, detail: event.detail, state: snapshot() });
        if (name === 'novvy:playable-complete' && window.__novvyTwoPhase && !snapshot().allowReplay) {
          window.EscapeArrow.reset();
          window.qaEvents.push({ name: 'first-reset-denied', state: snapshot() });
        }
      });
    }
    window.NovvyPlayable = {
      setStageList: chain => window.qaSdk.push(['chain', chain]),
      setStage: (index, type) => window.qaSdk.push(['stage', index, type]),
      onStep: (step, detail) => window.qaSdk.push(['step', step, detail]),
      onComplete: detail => window.qaSdk.push(['complete', detail]),
      onReplay: () => window.qaSdk.push(['replay', snapshot()]),
      click: detail => {
        window.qaSdk.push(['click', detail, snapshot()]);
        if (detail.scene === 'playable-replay' && window.qaHideOnReplay) window.dispatchEvent(new CustomEvent('novvy:viewablechange', { detail: { viewable: false } }));
      },
    };
  });
  const pack = async patch => {
    const config = { levelId: 1, intro: { enabled: false }, outro: { enabled: false }, secondPlayable: { enabled: false }, gameplay: { lives: 2, hints: 2, allowReplay: true }, cta: { endMask: false }, ...patch };
    updateTaskConfig(task.id, config);
    const options = { taskId: task.id, templateId: 'escape-arrow', projectRoot: path.join(root, 'project', task.id), resultRoot: path.join(root, 'result', task.id), config };
    for (const stepId of ['intro', 'outro', 'level', 'pack']) {
      const result = await runStep({ ...options, stepId });
      assert.equal(result.ok, true, result.error);
    }
    await page.goto(`${base}/result/${task.id}/index.html`);
    await page.waitForFunction(() => window.__ESCAPE_ARROW_READY__ && (!document.getElementById('novvy-video-intro') || window.__novvyIntroFinished));
  };
  const clickArrow = async id => {
    const point = await page.evaluate(id => {
      const p = window.EscapeArrow.getArrowScreenPoint(id), rect = document.getElementById('board').getBoundingClientRect();
      return { x: p.x + rect.left, y: p.y + rect.top };
    }, id);
    await page.mouse.click(point.x, point.y);
  };
  const solve = async id => {
    for (const [step, arrowId] of solveLevel(levels[id]).entries()) {
      await clickArrow(arrowId);
      await page.waitForFunction(escaped => window.EscapeArrow.getState().escaped === escaped, step + 1);
    }
    await page.waitForFunction(() => window.EscapeArrow.getState().moving === 0);
  };
  const fail = async (id, progressed = true) => {
    const state = createState(levels[id]);
    if (progressed) {
      await page.locator('#hint').click();
      const free = availableArrows(state)[0];
      await clickArrow(free); attemptEscape(state, free);
      await page.waitForFunction(() => window.EscapeArrow.getState().moving === 0);
    }
    const lives = await page.evaluate(() => window.EscapeArrow.getState().lives);
    const blocked = state.arrows.filter(a => !a.escaped && !escapeRoute(state, a.id).clear).slice(0, lives);
    assert.equal(blocked.length, lives);
    for (const arrow of blocked) {
      await clickArrow(arrow.id);
      await page.waitForFunction(() => window.EscapeArrow.getState().moving === 0);
    }
    await page.locator('#result').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.EscapeArrow.getState().failed), true);
  };
  const assertCtaOnTop = async () => {
    const hit = await page.evaluate(() => {
      // Reproduce the service's body-level end-card overlay, including when
      // replay is disabled and the SDK has ended the playable stage.
      const dialog = document.createElement('div');
      dialog.id = 'qa-service-dialog';
      dialog.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0008';
      document.body.append(dialog);
      const root = document.getElementById('novvy-cta');
      const button = document.getElementById('novvy-cta-btn');
      const rect = button.getBoundingClientRect();
      const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      const layers = ['game-shell', 'result', 'novvy-training-hud', 'novvy-video-intro', 'novvy-video-outro', 'qa-service-dialog']
        .map(id => document.getElementById(id)).filter(Boolean).map(el => Number(getComputedStyle(el).zIndex) || 0);
      return { point, top: document.elementFromPoint(point.x, point.y)?.closest('#novvy-cta') === root,
        highest: Number(getComputedStyle(root).zIndex) > Math.max(...layers) };
    });
    assert.equal(hit.top, true, 'Download remains the topmost click target over the result dialog');
    assert.equal(hit.highest, true, 'CTA layer stays above game, video and service result dialogs');
    const before = await page.evaluate(() => ({ clicks: window.qaSdk.filter(call => call[0] === 'click').length, state: window.EscapeArrow.getState() }));
    await page.mouse.click(hit.point.x, hit.point.y);
    assert.equal(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'click').length), before.clicks + 1, 'Download click reaches CTA exactly once');
    assert.deepEqual(await page.evaluate(() => window.EscapeArrow.getState()), before.state, 'clicking the top CTA does not dismiss or reset the result');
    await page.evaluate(() => document.getElementById('qa-service-dialog').remove());
  };
  const replayAndReturn = async (id, won = true) => {
    assert.equal(await page.locator('#result-title').textContent(), won ? 'All clear!' : 'Out of lives');
    assert.equal(await page.locator('#result-reset').textContent(), won ? 'Play again' : 'Try again');
    assert.equal(await page.locator('#result-reset').isVisible(), true);
    await assertCtaOnTop();
    const stages = await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'stage'));
    const beforeClicks = await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'click').length);
    const beforeEvents = await page.evaluate(() => window.qaEvents.filter(event => ['novvy:intro-finished', 'novvy:outro-started', 'novvy:phase2-start'].includes(event.name)));
    await page.evaluate(() => { window.qaHideOnReplay = true; });
    await page.locator('#result-reset').click();
    const log = await page.evaluate(() => window.qaSdk);
    assert.equal(log.filter(call => call[0] === 'click').length, beforeClicks + 1, 'one replay button press makes exactly one CTA request');
    const clickIndex = log.findLastIndex(call => call[0] === 'click');
    const replayIndex = log.findLastIndex(call => call[0] === 'replay');
    assert.ok(clickIndex < replayIndex, 'CTA happens before the new round starts');
    assert.equal(log[clickIndex][1].scene, 'playable-replay');
    assert.equal(log[clickIndex][2].won, won, 'CTA snapshots the completed round');
    assert.equal(log[clickIndex][2].failed, !won, 'CTA sees the failure before retry resets it');
    assert.equal(log[replayIndex][1].escaped, 0, 'SDK replay sees the reset current round');
    let state = await page.evaluate(() => window.EscapeArrow.getState());
    assert.equal(state.levelId, id);
    assert.equal(state.escaped, 0);
    assert.equal(state.lives, 2);
    assert.equal(state.hintsRemaining, 2);
    assert.equal(state.trails, 0);
    assert.equal(state.won, false);
    assert.equal(state.failed, false);
    assert.equal(await page.locator('#progress-escaped').textContent(), '0');
    assert.equal(await page.locator('#result').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'stage')), stages);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('novvy:viewablechange', { detail: { viewable: true } })));
    assert.deepEqual(await page.evaluate(() => window.qaEvents.filter(event => ['novvy:intro-finished', 'novvy:outro-started', 'novvy:phase2-start'].includes(event.name))), beforeEvents, 'returning does not restart earlier media or phases');
    state = await page.evaluate(() => window.EscapeArrow.getState());
    assert.equal(state.levelId, id);
    assert.equal(state.escaped, 0, 'the fresh round is ready when the ad becomes viewable again');
    await solve(id);
    const replayStep = (await page.evaluate(() => window.qaSdk)).slice(replayIndex + 1).find(call => call[0] === 'step');
    assert.equal(replayStep[1], 1, 'progress restarts from step one in the same stage');
    assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'stage')), stages);
    assert.deepEqual(await page.evaluate(() => window.qaEvents.filter(event => ['novvy:intro-finished', 'novvy:outro-started', 'novvy:phase2-start'].includes(event.name))), beforeEvents);
    assert.deepEqual((await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete'))).at(-1), ['complete', { result: 'win', continue_playing: true }]);
  };
  for (const name of ['intro', 'outro']) await execFile('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=10:d=0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path.join(root, `project/${task.id}/uploads/${name}-video.mp4`)]);

  await pack({ intro: { enabled: true } });
  await page.waitForFunction(() => window.__novvyIntroFinished);
  await page.locator('#hint').click();
  await solve(1);
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'win', continue_playing: true }]]);
  await page.screenshot({ path: path.join(screenshots, 'single-all-clear.png') });
  await replayAndReturn(1);
  console.log('PASS single playable: All clear replay triggers one CTA, resets on leaving, and keeps intro and stage unchanged');

  await pack({ intro: { enabled: true }, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 2, cta: { mode: 'steps', afterSteps: 1 } }, cta: { endMask: true } });
  await page.waitForFunction(() => window.__novvyIntroFinished);
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().allowReplay), false);
  await solve(1);
  await page.waitForFunction(() => window.EscapeArrow.getState().levelId === 2);
  const firstAttempt = await page.evaluate(() => window.qaEvents.find(event => event.name === 'first-reset-denied'));
  assert.equal(firstAttempt.state.levelId, 1);
  assert.equal(firstAttempt.state.won, true, 'the first playable cannot be replayed through the API');
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().allowReplay), true);
  await page.locator('#hint').click();
  await solve(2);
  assert.equal(await page.locator('#novvy-cta').evaluate(node => node.classList.contains('novvy-cta-takeover')), false, 'end mask does not cover the replayable All clear result');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'win' }], ['complete', { result: 'win', continue_playing: true }]]);
  await replayAndReturn(2);
  await page.screenshot({ path: path.join(screenshots, 'second-all-clear.png') });
  console.log('PASS two playables: only the last offers replay, only that level restarts, and previous gameplay/videos never repeat');

  await pack({ levelId: 16, intro: { enabled: true } });
  await fail(16);
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'fail', continue_playing: true }]]);
  assert.equal(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'click').length), 1, 'last life still triggers its immediate CTA');
  await page.screenshot({ path: path.join(screenshots, 'single-out-of-lives.png') });
  await replayAndReturn(16, false);
  console.log('PASS single playable: failure offers Try again; CTA precedes reset, lives/hints/progress reset, and intro never repeats');

  await pack({ levelId: 16, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 2 } });
  await fail(16, false);
  assert.equal(await page.locator('#result-reset').isVisible(), false);
  await page.evaluate(() => window.EscapeArrow.reset());
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().failed), true, 'first-playable failure cannot be replayed through the API');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'fail' }]]);

  await pack({ intro: { enabled: true }, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 16, cta: { mode: 'complete' } }, cta: { endMask: true } });
  await solve(1);
  await page.waitForFunction(() => window.EscapeArrow.getState().levelId === 16);
  await fail(16);
  assert.equal(await page.locator('#novvy-cta').evaluate(node => node.classList.contains('novvy-cta-takeover')), false, 'end mask leaves the failure retry button accessible');
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'win' }], ['complete', { result: 'fail', continue_playing: true }]]);
  await replayAndReturn(16, false);
  console.log('PASS two playables: first failure denies replay; last failure retries only its own level and preserves previous stages/videos');

  await pack({ gameplay: { lives: 2, hints: 2, allowReplay: false } });
  await solve(1);
  await assertCtaOnTop();
  assert.equal(await page.locator('#result-reset').isVisible(), false);
  await page.evaluate(() => window.EscapeArrow.reset());
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().won), true);
  assert.deepEqual(await page.evaluate(() => window.qaSdk.filter(call => call[0] === 'complete')), [['complete', { result: 'win' }]]);

  await pack({ levelId: 16, gameplay: { lives: 2, hints: 2, allowReplay: false } });
  await fail(16);
  await assertCtaOnTop();
  assert.equal(await page.locator('#result-reset').isVisible(), false);
  console.log('PASS CTA stays topmost and clickable on win/failure dialogs with replay enabled or disabled');

  await pack({ outro: { enabled: true } });
  assert.equal(await page.evaluate(() => window.EscapeArrow.getState().allowReplay), false, 'a trailing video prevents replay back into an earlier stage');
  await page.goto(`${base}/task.html?id=${task.id}`);
  assert.equal(await page.getByRole('checkbox', { name: '允许重玩', exact: true }).isDisabled(), true);
  updateTaskConfig(task.id, { secondPlayable: { enabled: true, levelId: 2 } });
  await page.reload();
  assert.equal(await page.locator('#config-grid #final-playable-replay').count(), 0);
  assert.equal(await page.locator('#second-playable-settings #final-playable-replay').count(), 1);
  assert.equal(await page.getByRole('checkbox', { name: '允许重玩', exact: true }).isEnabled(), true);
  assert.deepEqual(errors, []);
  console.log('PASS replay disabled, trailing-video guard, and Chinese editor control shown only for the final playable');
  console.log('Screenshots: ' + screenshots);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  deleteTask(task.id);
}
