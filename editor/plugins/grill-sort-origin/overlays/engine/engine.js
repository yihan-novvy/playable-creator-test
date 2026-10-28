(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__, active = !config.intro, settled = false;
  var game = null, steps = 0, nextCta = config.policy.afterSteps, intervalIndex = 0;
  var patched = new WeakSet();
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function cta(manual, scene) { if (active) emit('novvy:origin-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene }); }
  function step() {
    if (!active || settled) return;
    steps += 1;
    emit('novvy:origin-step', { step: steps, progress: Math.min(100, (game ? game._doneNum : 0) / 120 * 100) });
    if (config.policy.mode === 'steps' && steps >= nextCta) {
      cta(false, 'valid-skewer-move');
      var gaps = config.policy.intervals, gap = gaps[Math.min(intervalIndex++, gaps.length - 1)];
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function result(won) {
    if (!active || settled) return;
    settled = true;
    emit('novvy:origin-result', { result: won ? 'win' : 'fail', replay: false });
    if (won) cta(false, 'playable-complete');
  }
  function wrap(proto, name, fn) { var original = proto[name]; if (typeof original !== 'function') throw new Error('Missing original game method: ' + name); proto[name] = function () { return fn.call(this, original, arguments); }; }
  function patch(name, value) {
    if (typeof value !== 'function' || patched.has(value)) return;
    var p = value.prototype;
    if (name === 'Game') {
      patched.add(value);
      wrap(p, 'initGame', function (original, args) { game = this; return original.apply(this, args); });
      wrap(p, 'checkSuccess', function (original, args) { var valid = !this.isFail && this._doneNum >= 120; var out = original.apply(this, args); if (valid) result(true); return out; });
      wrap(p, 'checkFail', function (original, args) { var out = original.apply(this, args); result(false); return out; });
    } else if (name === 'Box') {
      patched.add(value);
      wrap(p, 'addItem', function (original, args) {
        var item = args[0], target = args[1], automatic = args[2];
        var valid = !automatic && item && item._type >= 0 && item._boxIndex >= 0 && (item._boxIndex !== this._index || item._index !== target);
        var out = original.apply(this, args);
        if (valid) step();
        return out;
      });
    } else if (name === 'AudioManager') {
      patched.add(value);
      wrap(p, '_playAudioByRes', function (original, args) { args[3] = window.__ORIGIN_MUTED__ ? 0 : 1; return original.apply(this, args); });
    }
  }
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    install: function (system) {
      var register = system.register;
      system.register = function (id, deps, declare) {
        if (typeof id !== 'string' || !/^chunks:\/\/\/_virtual\/(Game|Box|AudioManager)\.ts$/.test(id)) return register.apply(this, arguments);
        return register.call(this, id, deps, function (publish, context) {
          return declare(function (name, value) { patch(name, value); return publish(name, value); }, context);
        });
      };
    },
    start: function (launch) { if (active) launch(); else window.addEventListener('novvy:intro-finished', function () { active = true; launch(); }, { once: true }); }
  };
})();
