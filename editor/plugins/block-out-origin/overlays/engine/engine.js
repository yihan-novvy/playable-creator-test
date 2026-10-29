(function () {
  'use strict';
  var config = window.__BLOCK_OUT_CONFIG__;
  var allowReplay = !!(config.gameplay && config.gameplay.allowReplay === true), restarting = false;
  var active = !config.intro, ready = false, settled = false, viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  var steps = 0, cleared = 0, nextCta = config.policy.afterSteps, ctaIndex = 0;
  var records = new WeakMap(), removed = new WeakSet();
  var api, releaseIntro;
  var gate = active ? Promise.resolve() : new Promise(function (resolve) { releaseIntro = resolve; });
  window.__novvyReplayable = allowReplay;
  function element(id) { return document.getElementById(id); }
  function playable() { return active && !settled && !restarting; }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cells(block) { return JSON.stringify((block.cellsData || []).map(function (cell) { return [cell.x, cell.y]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })); }
  function convert(manual, scene, timing) { emit('novvy:block-out-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene, everySteps: timing && timing.gap, repeat: timing && timing.repeat, replayable: allowReplay }); }
  function commit(record, block) {
    if (!playable() || !record || record.done || records.get(block) !== record) return;
    if (!removed.has(block) && record.cells === cells(block)) return;
    record.done = true;
    steps += 1;
    var progress = Math.min(100, cleared / config.totalBlocks * 100);
    emit('novvy:block-out-step', { step: steps, progress: progress });
    if (config.policy.mode === 'steps' && steps >= nextCta && cleared < config.totalBlocks) {
      var gaps = config.policy.intervals;
      var gap = gaps[Math.min(ctaIndex, gaps.length - 1)];
      convert(false, 'valid-move', { gap: gap || 0, repeat: ctaIndex++ > 0 });
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function finish(won) {
    if (!playable()) return;
    settled = true;
    if (allowReplay) {
      var manager = api.Manager.instance;
      manager.setBlockInputLocked(true);
      manager.hideInstructionalTutorial();
      manager.gameScene.stopTutorialForLevelCompletion();
      manager.uiScene.stopTimer();
      element('block-out-result-title').textContent = won ? 'You win!' : 'Try again!';
      element('block-out-result-copy').textContent = won ? 'All blocks cleared!' : 'Slide each block to its matching exit.';
      element('block-out-replay').textContent = won ? 'Play again' : 'Try again';
      element('block-out-result').hidden = false;
    }
    emit(won ? 'novvy:playable-complete' : 'novvy:playable-failed', { replayable: allowReplay });
    if (!won && !allowReplay) convert(false, 'playable-failed');
  }
  async function replay() {
    if (!active || !settled || !allowReplay || restarting || !ready) return false;
    restarting = true;
    var button = element('block-out-replay');
    button.disabled = true; button.textContent = 'Preparing…';
    emit('novvy:replay-cta');
    try {
      var manager = api.Manager.instance, scene = manager.gameScene;
      // Reuse the native scene and its level teardown, preserving the app,
      // music, intro and SDK stage. Only the two-level round starts over.
      manager.hideInstructionalTutorial();
      manager.setSelectedBlock(null);
      manager.currentLevel = 0;
      manager.nextLevelLoading = false;
      manager.plannedLevelTransitionDuration = null;
      manager.resetBlocks(); manager.resetDoors();
      manager.blockInputLockOwners.clear();
      manager.initializeChallengeProgress();
      manager.blockPassesCounter = 0; manager.lastGlobalExitTime = 0;
      if (manager.blockPassesCounterTimer) manager.blockPassesCounterTimer.kill();
      manager.blockPassesCounterTimer = null;
      scene.pendingTutorialRepeatDueTimeAfterLevelCompletionMs = null;
      scene.suppressTutorialUntilNextLevel = false;
      await scene.startLevel(api.Parameters.levelAssets[0], { transition: 'none' });
      scene.eventMode = 'static';
      // startLevel restores draw-attention tutorials itself; otherwise the
      // initial hand is normally added by onReady, which must not run twice.
      if (!api.Parameters.hasDrawAttentionOnStart && !scene.hand) scene.addTutorial();
      manager.uiScene.reInstantiateTimer();
      api.Layout.resize();
      records = new WeakMap(); removed = new WeakSet();
      steps = 0; cleared = 0; nextCta = config.policy.afterSteps; ctaIndex = 0;
      restarting = false; settled = false;
      element('block-out-result').hidden = true;
      button.disabled = false;
      emit('novvy:block-out-replay');
      lifecycle();
      return true;
    } catch (error) {
      restarting = false; button.disabled = false; button.textContent = 'Try again';
      element('block-out-result-copy').textContent = 'Unable to restart. Please try again.';
      console.error('Block Out restart failed', error);
      return false;
    }
  }
  function audio() {
    if (!api || !ready) return;
    var muted = !active || !viewable || document.hidden;
    if (muted) api.Sound.muteAll(); else api.Sound.unmuteAll();
  }
  function lifecycle() {
    if (!api || !ready) return;
    if (active && viewable && !document.hidden) api.App.instance.resumeGame(); else api.App.instance.pauseGame();
    audio();
  }
  window.addEventListener('novvy:intro-finished', function () {
    if (active) return;
    active = true;
    releaseIntro();
    lifecycle();
  });
  window.addEventListener('novvy:viewablechange', function (event) { viewable = !!event.detail.viewable; lifecycle(); });
  document.addEventListener('visibilitychange', lifecycle);
  document.addEventListener('pointerdown', audio, true);
  element('block-out-replay').addEventListener('click', replay);
  window.__BLOCK_OUT_ADAPTER__ = {
    replay: replay,
    // Native logo/endcard clicks use the same SDK route; no native hasOpenedStore
    // latch, AppLovin redirect, or gameplay lock survives a store visit.
    openStore: function (options) {
      if (!active || options.automatic) return false;
      convert(true, 'native-cta');
      return true;
    },
    install: function (engine) {
      if (api) throw new Error('Block Out adapter installed twice');
      api = engine;
      if (config.title) {
        [window.editorParameters, api.Parameters].filter(Boolean).forEach(function (parameters) {
          parameters.hasInGameLogo = false;
          parameters.hasInstructionText = false;
          parameters.hasLevelInstructionText = false;
        });
      }
      if (api.Layout) {
        var resize = api.Layout.resize;
        api.Layout.resize = function (width, height) {
          width = width || window.innerWidth; height = height || window.innerHeight;
          var style = getComputedStyle(document.documentElement);
          var top = parseFloat(style.getPropertyValue('--origin-hud-space')) || 64;
          var card = document.getElementById('novvy-cta');
          var bottom = Math.max(width > height ? 106 : 132, card ? card.getBoundingClientRect().height + 24 : 0);
          var p = api.Parameters;
          p.gameAreaPortraitTopOffsetY = p.gameAreaLandscapeTopOffsetY = top / height;
          p.gameAreaBottomOffsetY = bottom / height;
          p.gameAreaPortraitPosYRatios = String((top + height - bottom) / height / 2);
          p.gameAreaWidthRatios = '1.04';
          p.gameAreaHeightRatios = String(Math.max(100, height - top - bottom - 32) / height);
          // The native viewport caches per-level ratios at construction time.
          // Refresh those values before its resize, including on rotation.
          var scene = api.Manager.instance && api.Manager.instance.gameScene;
          var viewport = scene && scene.viewport;
          if (viewport) viewport.refreshRatiosForCurrentLevel({
            posXRatio: p.gameAreaPortraitPosXRatios, posYRatio: p.gameAreaPortraitPosYRatios,
            widthRatio: p.gameAreaWidthRatios, heightRatio: p.gameAreaHeightRatios
          });
          return resize.apply(this, arguments);
        };
      }
      var manager = api.Manager.prototype, drag = api.Drag.prototype;
      var select = manager.setSelectedBlock;
      manager.setSelectedBlock = function (block, id) {
        if (block && !playable()) return;
        if (block) records.set(block, { id: id, cells: cells(block), done: false });
        return select.apply(this, arguments);
      };
      var pass = manager.onBlockPassedExit;
      manager.onBlockPassedExit = function (block) {
        if (!playable() || !this.blocks.includes(block)) return;
        if (!removed.has(block)) {
          removed.add(block); cleared += 1;
          commit(records.get(block), block);
        }
        return pass.apply(this, arguments);
      };
      var up = drag.pointerUpHandler;
      drag.pointerUpHandler = async function () {
        var block = this.selectedBlock, record = block && records.get(block);
        var value = await up.apply(this, arguments);
        if (block && (removed.has(block) || block.state !== 'passed')) commit(record, block);
        return value;
      };
      var end = manager.showEndcard;
      manager.showEndcard = function () { finish(true); if (!allowReplay) return end.apply(this, arguments); };
      var endScene = manager.startEndcardScene;
      manager.startEndcardScene = function (won) { finish(!!won); if (!allowReplay) return endScene.apply(this, arguments); };
      var start = api.Boot.prototype.start;
      api.Boot.prototype.start = async function () {
        await gate;
        var value = await start.apply(this, arguments);
        ready = true; lifecycle();
        emit('novvy:block-out-ready');
        return value;
      };
      // Native focus/resize resumes must still respect SDK viewability and mute.
      var resume = api.App.prototype.resumeGame;
      api.App.prototype.resumeGame = function () {
        if (!active || !viewable || document.hidden) return;
        var value = resume.apply(this, arguments); audio(); return value;
      };
      api.Sound.muteAll();
    }
  };
})();
