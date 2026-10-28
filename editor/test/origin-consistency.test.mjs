import fs from 'node:fs';
import { getEntry } from '../core/registry.mjs';
import { runtime as blockRuntime } from './block-out-origin.test.mjs';
import { runtime as freecellRuntime } from './freecell-origin.test.mjs';
import { runtime as grillRuntime } from './grill-sort-origin.test.mjs';
import { runtime as tastyRuntime } from './tasty-travels-origin.test.mjs';
import { compileSource } from '../../template-core/grill-sort-origin/scripts/build.mjs';

function game(id) {
  const r = id === 'block-out-origin' ? blockRuntime(getEntry(id)) : id === 'freecell-origin' ? freecellRuntime(getEntry(id)) : id === 'grill-sort-origin' ? grillRuntime() : tastyRuntime();
  const field = id === 'freecell-origin' ? r.field() : null;
  const block = id === 'block-out-origin' ? r.block() : null;
  return { ...r,
    policy: (r.window.__ORIGIN_CONFIG__ || r.window.__BLOCK_OUT_CONFIG__).policy,
    async move() {
      if (block) { r.select(block, 1); r.drag.action = () => block.cellsData[0].x++; await r.drag.pointerUpHandler(); }
      else if (field) field.emit('appliedTableauTableau');
      else if (r.move) r.move();
      else r.drop();
    },
    win() {
      if (block) r.manager.showEndcard();
      else if (field) { field.engine.foundations.columns.forEach(c => c.cards = Array(13).fill({})); field.emit('userWin'); }
      else if (r.move) { r.game._doneNum = 120; r.game.checkSuccess(); }
      else r.game.createTool2(9);
    },
    manual() { if (block) r.window.__BLOCK_OUT_ADAPTER__.openStore({}); else r.window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); },
    clicks() { return r.calls.filter(c => c[0] === 'click'); },
  };
}

export default async function test(a) {
  for (const id of ['block-out-origin', 'freecell-origin', 'grill-sort-origin', 'tasty-travels-origin']) {
    const r = game(id);
    await r.move(); await r.move();
    a.equal(r.clicks().map(c => c[1]), [{ click_source: 'forced_click_to_appstore', scene: 'cta-moment' }], `${id}: shared step CTA source and scene`);
    r.win(); r.win();
    a.equal(r.clicks().length, 1, `${id}: completion after step CTA does not convert again`);
    a.equal(r.calls.filter(c => c[0] === 'onComplete').length, 1, `${id}: result still reported once`);
    r.cta.pointer('pointerdown');
    a.equal(r.clicks().length, 1, `${id}: Canvas press waits for native CTA hit test`);
    r.cta.pointer('pointerup'); r.cta.flush();
    a.equal(r.clicks().at(-1)[1], { click_source: 'forced_click_to_appstore', scene: 'post-complete-interact' }, `${id}: result background tap converts`);

    const manual = game(id); manual.win();
    manual.cta.pointer('pointerdown'); manual.cta.pointer('pointerup'); manual.manual(); manual.cta.flush();
    a.equal(manual.clicks().map(c => c[1].click_source), ['forced_click_to_appstore', 'cta_click'], `${id}: Canvas download produces only one manual conversion`);
    a.equal(manual.clicks().at(-1)[1].scene, 'cta-card', `${id}: manual CTA scene matches Colorever`);
    for (const selector of ['.novvy-intro-go', '#origin-sound', '#block-out-sound', '[data-novvy-replay]', '[data-novvy-click-source="cta_click"]']) {
      manual.cta.pointer('pointerdown', selector); manual.cta.pointer('pointerup', selector); manual.cta.flush();
    }
    a.equal(manual.clicks().length, 2, `${id}: controls and marked CTA do not trigger forced conversion`);

    const complete = game(id); complete.policy.mode = 'complete';
    await complete.move(); await complete.move();
    a.equal(complete.clicks().length, 0, `${id}: complete mode ignores step threshold`);
    complete.win();
    a.equal(complete.clicks().length, 1, `${id}: completion before step CTA converts once`);
    a.check(complete.calls.findIndex(c => c[0] === 'onComplete') < complete.calls.findIndex(c => c[0] === 'click'), `${id}: settle before conversion`);

    const empty = game(id); empty.policy.intervals = [];
    await empty.move(); await empty.move();
    empty.cta.pointer('pointerdown'); empty.cta.pointer('pointerup'); empty.cta.flush();
    a.equal(empty.clicks().map(c => c[1].scene), ['cta-moment', 'post-complete-interact'], `${id}: empty interval policy matches shared bridge`);
    const preview = game(id); delete preview.window.NovvyPlayable;
    // Tasty's super_html.download returns to its adapter. SDK-only previews
    // must not enter the common bridge's legacy fallback recursion.
    preview.window.super_html = { download() { throw new Error('recursive native fallback'); } };
    preview.manual(); preview.win();
    a.equal(preview.clicks().length, 0, `${id}: SDK-free preview stays inert`);
  }

  const freecell = game('freecell-origin');
  const core = fs.readFileSync(new URL('../templates/freecell-origin/game/core.js', import.meta.url), 'utf8');
  const onMainCta = new Function(core.match(/key:"onMainCta",value:function t\(\)\{([^}]+)\}/)[1]);
  let animations = 0, delayedDownloads = 0;
  const nativeWindow = {
    cta: { children: [{}] },
    animateButtonPress() { animations++; },
    callSdk() { delayedDownloads++; },
  };
  freecell.Game.showWindow(nativeWindow);
  freecell.win();
  freecell.cta.pointer('pointerdown');
  onMainCta.call(nativeWindow);
  freecell.cta.pointer('pointerup'); freecell.cta.flush();
  a.equal(freecell.clicks().map(c => c[1].click_source), ['forced_click_to_appstore', 'cta_click'], 'FreeCell: native delayed button does not duplicate post-completion CTA');
  a.equal(delayedDownloads, 0, 'FreeCell: native download timer is bypassed');
  a.equal(animations, 1, 'FreeCell: native button animation is preserved');

  // Use the actual native releaseDone body, including its third-release gate
  // and nested checkSuccess. This catches ordering lost in a trivial mock.
  const native = compileSource(fs.readFileSync(new URL('../../template-core/grill-sort-origin/source/original.html', import.meta.url), 'utf8')).assets['assets/main/index.js'];
  const body = native.match(/\.releaseDone=function\(e,t\)\{([\s\S]*?)\},\w+\.countOperated=/)[1];
  const release = new Function('e', 't', body);
  const grill = grillRuntime(false, release);
  grill.game._checkRelease = 0;
  grill.game.getBoxComp = () => ({ updateItems() {} });
  grill.game._doneNum = 117; grill.move();
  const clicksBefore = grill.calls.filter(c => c[0] === 'click').length;
  const pack = { donePack() {} };
  grill.game.releaseDone(0, pack); grill.game.releaseDone(0, pack);
  a.equal(grill.calls.filter(c => c[0] === 'onComplete').length, 0, 'Grill: partial release is not a completed pack');
  grill.game.releaseDone(0, pack);
  const finalStep = grill.calls.filter(c => c[0] === 'onStep').at(-1);
  a.equal(finalStep, ['onStep', 1, { progress: 100 }], 'Grill: final animation updates the same move to 100%');
  a.check(grill.calls.indexOf(finalStep) < grill.calls.findIndex(c => c[0] === 'onComplete'), 'Grill: final progress precedes onComplete');
  a.equal(grill.calls.filter(c => c[0] === 'click').length, clicksBefore + 1, 'Grill: progress update does not consume step CTA threshold');
  let wins = 0;
  const sourceGame = { _checkRelease: 0, _doneNum: 117, getBoxComp: () => ({ updateItems() {} }), checkSuccess() { wins++; } };
  for (let i = 0; i < 3; i++) release.call(sourceGame, 0, { donePack() {} });
  a.equal([sourceGame._doneNum, wins], [120, 1], 'Grill: native release contract reaches 120 on the third release');

  const tasty = tastyRuntime(); tasty.drop(); tasty.game.createTool2(8);
  a.equal(tasty.calls.filter(c => c[0] === 'onStep').at(-1), ['onStep', 1, { progress: 800 / 9 }], 'Tasty: merge progress updates without another drop');
  tasty.game.createTool2(9);
  const final = tasty.calls.filter(c => c[0] === 'onStep').at(-1);
  a.equal(final, ['onStep', 1, { progress: 100 }], 'Tasty: final merge updates the same drop to 100%');
  a.check(tasty.calls.indexOf(final) < tasty.calls.findIndex(c => c[0] === 'onComplete'), 'Tasty: final progress precedes onComplete');
  a.equal(tasty.calls.filter(c => c[0] === 'click').map(c => c[1].scene), ['playable-complete'], 'Tasty: merges do not consume drop CTA thresholds');
}
