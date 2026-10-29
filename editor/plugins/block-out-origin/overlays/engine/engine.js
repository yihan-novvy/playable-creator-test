(function () {
  'use strict';
  var config = window.__BLOCK_OUT_CONFIG__;
  var active = !config.intro, ready = false, settled = false, viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  var steps = 0, cleared = 0, nextCta = config.policy.afterSteps, ctaIndex = 0;
  var records = new WeakMap(), removed = new WeakSet();
  var api, releaseIntro;
  var gate = active ? Promise.resolve() : new Promise(function (resolve) { releaseIntro = resolve; });
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cells(block) { return JSON.stringify((block.cellsData || []).map(function (cell) { return [cell.x, cell.y]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })); }
  function convert(manual, scene, timing) { emit('novvy:block-out-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene, everySteps: timing && timing.gap, repeat: timing && timing.repeat }); }
  function commit(record, block) {
    if (!active || settled || !record || record.done || records.get(block) !== record) return;
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
    if (settled || !active) return;
    settled = true;
    emit(won ? 'novvy:playable-complete' : 'novvy:playable-failed');
    if (!won) convert(false, 'playable-failed');
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
  window.__BLOCK_OUT_ADAPTER__ = {
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
        if (block && active && !settled) records.set(block, { id: id, cells: cells(block), done: false });
        return select.apply(this, arguments);
      };
      var pass = manager.onBlockPassedExit;
      manager.onBlockPassedExit = function (block) {
        if (this.blocks.includes(block) && !removed.has(block)) {
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
      manager.showEndcard = function () { finish(true); return end.apply(this, arguments); };
      var endScene = manager.startEndcardScene;
      manager.startEndcardScene = function (won) { finish(!!won); return endScene.apply(this, arguments); };
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
