(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__, active = !config.intro, settled = false, restarting = false;
  var allowReplay = !!(config.gameplay && config.gameplay.allowReplay === true);
  var steps = 0, lastProgress = 0, nextCta = config.policy.afterSteps, intervalIndex = 0;
  window.__novvyReplayable = allowReplay;
  var attached = new WeakSet();
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cta(manual, scene, timing) {
    if (active) emit('novvy:origin-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene, everySteps: timing && timing.gap, repeat: timing && timing.repeat, replayable: allowReplay });
  }
  function progress(field) {
    return Math.min(100, field.engine.foundations.columns.reduce(function (sum, column) { return sum + column.cards.length; }, 0) / 52 * 100);
  }
  function step(field) {
    if (!active || settled || restarting || Game.currentWindow.field !== field) return;
    steps += 1;
    lastProgress = progress(field);
    emit('novvy:origin-step', { step: steps, progress: lastProgress });
    if (config.policy.mode === 'steps' && steps >= nextCta && !field.engine.foundationsFilled()) {
      var gaps = config.policy.intervals;
      var gap = gaps[Math.min(intervalIndex, gaps.length - 1)];
      cta(false, 'valid-card-move', { gap: gap || 0, repeat: intervalIndex++ > 0 });
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function result(won) {
    if (!active || settled) return;
    if (won && steps && lastProgress < 100) {
      lastProgress = 100;
      emit('novvy:origin-step', { step: steps, progress: 100 });
    }
    settled = true;
    if (allowReplay) {
      CardView.ALLOW_INTERACTION = false;
      document.getElementById('freecell-result-title').textContent = won ? 'You win!' : 'No moves left';
      document.getElementById('freecell-result-copy').textContent = won ? 'All 52 cards are home.' : 'Start a fresh deal and try again.';
      document.getElementById('freecell-replay').textContent = won ? 'Play again' : 'Try again';
      document.getElementById('freecell-result').hidden = false;
    }
    emit('novvy:origin-result', { result: won ? 'win' : 'fail', replay: allowReplay });
  }
  function replay() {
    if (!allowReplay || !active || !settled || restarting) return false;
    restarting = true;
    var button = document.getElementById('freecell-replay');
    button.disabled = true;
    emit('novvy:replay-cta');
    // Clear the completed deal's native timers and animations before creating
    // another window. Cached textures and the one background track stay alive.
    var previous = Game.currentWindow;
    previous.field.stopAndRemoveTutorial();
    Timer.clear(); TWEEN.removeAll(); Tween.scope.removeAll();
    Game.round++;
    Game.showWindow(new MainWindow());
    previous.destroy({ children: true });
    steps = 0; lastProgress = 0; nextCta = config.policy.afterSteps; intervalIndex = 0;
    settled = false; restarting = false;
    document.getElementById('freecell-result').hidden = true;
    button.disabled = false;
    emit('novvy:origin-replay');
    return true;
  }
  function attach(field) {
    if (!field || attached.has(field)) return;
    attached.add(field);
    ['appliedTableauFoundations', 'appliedTableauTableau', 'appliedTableauEmptySlots', 'appliedEmptySlotsFoundation', 'appliedEmptySlotsTableau', 'appliedEmptySlotsEmptySlots'].forEach(function (name) {
      field.on(name, function () { step(field); });
    });
    field.on('userWin', function () { if (Game.currentWindow.field === field && field.engine.foundationsFilled()) result(true); });
  }
  var proto = MainWindow.prototype, final = proto.showFinalScene, noMoves = proto.showTryAgainElements, remove = proto.onRemove;
  proto.showFinalScene = function () { if (!allowReplay) return final.apply(this, arguments); };
  proto.showTryAgainElements = function () {
    if (allowReplay) return;
    var value = noMoves.apply(this, arguments);
    this.tryAgainButton.visible = false;
    this.tryAgainButton.interactiveChildren = false;
    return value;
  };
  proto.onTryAgainButtonPointerdown = replay;
  proto.onRemove = function () {
    Game.off('no-tutorial-options', this.showTryAgainElements, this);
    Game.off('on-Card-Pointer-Up', this.onCardPointerUpLogic, this);
    Game.off('on-Card-Interaction', this.field.onCardPointerDownLogic, this.field);
    this.field.removeAllListeners();
    // PIXI's destroy does not unregister the source's particle tickers.
    // Dispose only effects belonging to this window, before its sprites die.
    var previous = this;
    ProtonSprite.pool.slice().forEach(function (effect) {
      var parent = effect.parent;
      while (parent && parent !== previous) parent = parent.parent;
      if (parent === previous) {
        ProtonSprite.destroy(effect);
        effect.destroy({ children: true });
      }
    });
    return remove.apply(this, arguments);
  };
  var music = proto.playBackgroundMusic, musicStarted = false;
  proto.playBackgroundMusic = function () {
    if (musicStarted) return;
    musicStarted = true;
    return music.apply(this, arguments);
  };
  var showWindow = Game.showWindow;
  Game.showWindow = function (next) {
    // Native buttons animate immediately but delay callSDK by 300ms. Report
    // the hit during the gesture so the shared Canvas bridge can deduplicate
    // it against a post-completion background tap; retain button animations.
    if (next && typeof next.callSdk === 'function') {
      next.callSdk = function () { cta(true, 'native-cta'); };
    }
    var value = showWindow.apply(this, arguments);
    attach(next.field);
    return value;
  };
  var init = Game.init;
  Game.init = function () {
    var value = init.apply(this, arguments);
    Game.on('no-tutorial-options', function () { result(false); });
    return value;
  };
  // Disable the source's tap-count lock and redirect timer; normal moves remain playable after a store visit.
  CONFIG.application.tapsToRedirect = 0;
  CONFIG.application.secToRedirect = null;
  document.getElementById('freecell-replay').addEventListener('click', replay);
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    replay: replay,
    start: function (launch) {
      if (active) launch();
      else window.addEventListener('novvy:intro-finished', function () { active = true; launch(); }, { once: true });
    }
  };
})();
