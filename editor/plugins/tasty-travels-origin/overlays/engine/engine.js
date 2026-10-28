(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__, active = !config.intro, settled = false, installed = false;
  var steps = 0, peakTier = 0, nextCta = config.policy.afterSteps, intervalIndex = 0;
  var lastProgress = 0;
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cta(manual, scene, timing) { if (active) emit('novvy:origin-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene, everySteps: timing && timing.gap, repeat: timing && timing.repeat }); }
  function reportProgress(force) {
    if (!active || settled || !steps) return;
    var progress = Math.min(100, peakTier / 9 * 100);
    if (!force && progress <= lastProgress) return;
    lastProgress = progress;
    emit('novvy:origin-step', { step: steps, progress: progress });
  }
  function step() {
    if (!active || settled) return;
    steps += 1;
    reportProgress(true);
    if (config.policy.mode === 'steps' && steps >= nextCta) {
      var gaps = config.policy.intervals, gap = gaps[Math.min(intervalIndex, gaps.length - 1)];
      cta(false, 'valid-food-drop', { gap: gap || 0, repeat: intervalIndex++ > 0 });
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function result(won) {
    if (!active || settled) return;
    reportProgress(false);
    settled = true;
    emit('novvy:origin-result', { result: won ? 'win' : 'fail', replay: false });
  }
  function wrap(p, name, fn) { var original = p[name]; if (typeof original !== 'function') throw new Error('Missing original method: ' + name); p[name] = function () { return fn.call(this, original, arguments); }; }
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    install: function (requireModule) {
      if (installed) return;
      installed = true;
      var Game = requireModule('GameScript').default, p = Game.prototype;
      // Source telemetry reports CHALLENGE_SOLVED on touch-start. It is not a game result.
      requireModule('MarkUtil').MarkUtil.report = function () {};
      wrap(p, 'downLoadApp', function (original, args) {
        this.__originCtaGesture = true;
        if (args[0] && args[0].stopPropagation) args[0].stopPropagation();
        return original.apply(this, args);
      });
      wrap(p, 'game1_Start', function (original, args) {
        this.__originCtaGesture = false;
        if (!this.isEnd) return original.apply(this, args);
      });
      wrap(p, 'game1_End', function (original, args) {
        if (this.__originCtaGesture) { this.__originCtaGesture = false; return; }
        if (this.isEnd) return;
        var held = this.tool, out = original.apply(this, args);
        if (held && this.tool === null) step();
        return out;
      });
      wrap(p, 'createTool2', function (original, args) {
        peakTier = Math.max(peakTier, args[0]);
        var out = original.apply(this, args);
        reportProgress(false);
        return out;
      });
      wrap(p, 'EndStep', function (original, args) {
        var wasEnded = this.isEnd, out = original.apply(this, args);
        if (!wasEnded && this.isEnd) result(peakTier >= 9);
        return out;
      });
    },
    start: function (launch) { if (active) launch(); else window.addEventListener('novvy:intro-finished', function () { active = true; launch(); }, { once: true }); }
  };
})();
