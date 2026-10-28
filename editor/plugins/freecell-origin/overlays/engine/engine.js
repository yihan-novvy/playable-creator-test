(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__, active = !config.intro, settled = false;
  var steps = 0, nextCta = config.policy.afterSteps, intervalIndex = 0;
  var attached = new WeakSet();
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cta(manual, scene) {
    if (active) emit('novvy:origin-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene });
  }
  function progress(field) {
    return Math.min(100, field.engine.foundations.columns.reduce(function (sum, column) { return sum + column.cards.length; }, 0) / 52 * 100);
  }
  function step(field) {
    if (!active || settled) return;
    steps += 1;
    emit('novvy:origin-step', { step: steps, progress: progress(field) });
    if (config.policy.mode === 'steps' && steps >= nextCta && !field.engine.foundationsFilled()) {
      cta(false, 'valid-card-move');
      var gaps = config.policy.intervals;
      var gap = gaps[Math.min(intervalIndex++, gaps.length - 1)];
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function result(won) {
    if (!active || settled) return;
    settled = true;
    emit('novvy:origin-result', { result: won ? 'win' : 'fail', replay: !won });
    if (won) cta(false, 'playable-complete');
  }
  function attach(field) {
    if (!field || attached.has(field)) return;
    attached.add(field);
    ['appliedTableauFoundations', 'appliedTableauTableau', 'appliedTableauEmptySlots', 'appliedEmptySlotsFoundation', 'appliedEmptySlotsTableau', 'appliedEmptySlotsEmptySlots'].forEach(function (name) {
      field.on(name, function () { step(field); });
    });
    field.on('userWin', function () { if (field.engine.foundationsFilled()) result(true); });
  }
  var showWindow = Game.showWindow;
  Game.showWindow = function (next) {
    var value = showWindow.apply(this, arguments);
    attach(next.field);
    return value;
  };
  var init = Game.init;
  Game.init = function () {
    var value = init.apply(this, arguments);
    Game.on('no-tutorial-options', function () { result(false); });
    Game.on('retry', function () {
      if (!settled) return;
      settled = false;
      emit('novvy:origin-replay');
    });
    return value;
  };
  // Disable the source's tap-count lock and redirect timer; normal moves remain playable after a store visit.
  CONFIG.application.tapsToRedirect = 0;
  CONFIG.application.secToRedirect = null;
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    start: function (launch) {
      if (active) launch();
      else window.addEventListener('novvy:intro-finished', function () { active = true; launch(); }, { once: true });
    }
  };
})();
