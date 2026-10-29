(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__, active = !config.intro, settled = false, restarting = false;
  var settings = config.gameplay || {}, allowReplay = settings.allowReplay !== false;
  var seconds = Number.isInteger(settings.countdownSeconds) && settings.countdownSeconds >= 1 && settings.countdownSeconds <= 3600 ? settings.countdownSeconds : 180;
  var game = null, clock = null, native = null, utilities = null;
  var steps = 0, nextCta = config.policy.afterSteps, intervalIndex = 0, lastProgress = 0;
  var patched = new WeakSet();
  window.__novvyReplayable = allowReplay;
  function element(id) { return document.getElementById(id); }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function playable() { return active && !settled && !restarting; }
  function cta(manual, scene, timing) {
    if (active) emit('novvy:origin-cta', { click_source: manual ? 'cta_click' : 'forced_click_to_appstore', scene: scene, everySteps: timing && timing.gap, repeat: timing && timing.repeat, replayable: allowReplay });
  }
  function reportProgress(force) {
    if (!playable() || !steps) return;
    var progress = Math.min(100, (game ? game._doneNum : 0) / 120 * 100);
    if (!force && progress <= lastProgress) return;
    lastProgress = progress;
    emit('novvy:origin-step', { step: steps, progress: progress });
  }
  function step() {
    if (!playable()) return;
    steps += 1;
    reportProgress(true);
    if (config.policy.mode === 'steps' && steps >= nextCta) {
      var gaps = config.policy.intervals, gap = gaps[Math.min(intervalIndex, gaps.length - 1)];
      cta(false, 'valid-skewer-move', { gap: gap || 0, repeat: intervalIndex++ > 0 });
      nextCta = gap ? nextCta + gap : Infinity;
    }
  }
  function showResult(won) {
    var panel = element('grill-result');
    if (!panel) return;
    element('grill-result-title').textContent = won ? 'All served!' : "Time’s up!";
    element('grill-result-copy').textContent = won ? 'Every skewer is ready. Great work!' : 'The kitchen is closed for this round.';
    var button = element('grill-replay');
    button.textContent = won ? 'Play again' : 'Try again';
    button.hidden = !allowReplay;
    button.disabled = false;
    panel.hidden = false;
  }
  function result(won) {
    if (!playable()) return;
    reportProgress(false);
    settled = true;
    if (clock) clock.stop();
    if (game) game.canClick = false;
    showResult(won);
    emit('novvy:origin-result', { result: won ? 'win' : 'fail', replay: allowReplay });
    // As in Escape Arrow, a retryable timeout converts on Try again.
    if (!won && !allowReplay) cta(false, 'time-expired');
  }
  function roundReady() {
    if (restarting) {
      restarting = false; settled = false;
      steps = 0; lastProgress = 0; nextCta = config.policy.afterSteps; intervalIndex = 0;
      var panel = element('grill-result');
      if (panel) panel.hidden = true;
      emit('novvy:origin-replay');
    }
    emit('novvy:grill-ready');
  }
  function stopTweens(node) {
    native.Tween.stopAllByTarget(node);
    node.children.forEach(stopTweens);
  }
  function replay() {
    if (!active || !settled || !allowReplay || restarting || !native) return false;
    restarting = true;
    var button = element('grill-replay');
    if (button) { button.disabled = true; button.textContent = 'Preparing…'; }
    // Conversion precedes reset; the video/stage chain remains untouched.
    emit('novvy:replay-cta');
    if (clock) clock.stop();
    if (game) game.unscheduleAllCallbacks();
    stopTweens(native.director.getScene());
    if (utilities) {
      var utils = utilities.ins;
      utils.Game = null;
      utils.validItemMap.clear(); utils.totalItemMap.clear();
      utils.itemPool.clear(); utils.platePool.clear();
    }
    function failed(error) {
      if (!error) return;
      restarting = false;
      if (button) { button.disabled = false; button.textContent = 'Try again'; }
      var copy = element('grill-result-copy');
      if (copy) copy.textContent = 'Unable to restart. Please try again.';
      console.error('Grill Sort restart failed', error);
    }
    // Cocos rebuilds the original scene from its cached asset. It restores all
    // 120 items and the native guide without reloading the document or video.
    if (!native.director.loadScene('scene', failed)) failed(new Error('Scene is already loading'));
    return true;
  }
  function wrap(proto, name, fn) {
    var original = proto[name];
    if (typeof original !== 'function') throw new Error('Missing original game method: ' + name);
    proto[name] = function () { return fn.call(this, original, arguments); };
  }
  function cleanup(proto) {
    var original = proto.onDestroy;
    proto.onDestroy = function () {
      native.director.targetOff(this);
      if (original) original.apply(this, arguments);
    };
  }
  function patch(name, value) {
    if (name === 'TIME') return seconds;
    if (typeof value !== 'function' || patched.has(value)) return value;
    var p = value.prototype;
    patched.add(value);
    if (name === 'Game') {
      wrap(p, 'initGame', function (original, args) { game = this; return original.apply(this, args); });
      wrap(p, 'initGuide', function (original, args) {
        var out = original.apply(this, args);
        // Wait for a real frame, not just downloaded resources, before pausing
        // the preloaded scene behind the intro.
        native.director.once(native.Director.EVENT_AFTER_DRAW, roundReady);
        return out;
      });
      ['onTouchStart', 'onTouchMove', 'onTouchEnd'].forEach(function (name) {
        wrap(p, name, function (original, args) { if (playable()) return original.apply(this, args); });
      });
      wrap(p, 'releaseDone', function (original, args) { if (settled || restarting) return; var out = original.apply(this, args); reportProgress(false); return out; });
      wrap(p, 'checkSuccess', function (original, args) {
        if (!playable() || this.isFail || this._doneNum < 120) return;
        var out = original.apply(this, args); result(true); return out;
      });
      wrap(p, 'checkFail', function (original, args) { if (!playable()) return; var out = original.apply(this, args); result(false); return out; });
      cleanup(p);
    } else if (name === 'Clock') {
      wrap(p, 'onLoad', function (original, args) { clock = this; return original.apply(this, args); });
      p.countDown = function () {
        if (!playable()) return;
        this.stop();
        var remaining = seconds, self = this;
        this.setTimeStr(remaining);
        this.schedule(function () { self.setTimeStr(Math.max(0, --remaining)); }, 1, seconds - 1, 1);
      };
    } else if (name === 'Main') {
      // The native anonymous resize subscription needs explicit cleanup when
      // replay destroys this scene; director subscriptions already carry this.
      wrap(p, 'onLoad', function (original, args) {
        var screen = native.screen, on = screen.on, subscriptions = this.__originResize = [];
        screen.on = function () { subscriptions.push(Array.prototype.slice.call(arguments)); return on.apply(this, arguments); };
        try { return original.apply(this, args); } finally { screen.on = on; }
      });
      wrap(p, 'showRes', function (original, args) {
        var out = original.apply(this, args);
        this.node.getChildByName('endUI').active = false;
        return out;
      });
      var destroy = p.onDestroy;
      p.onDestroy = function () {
        (this.__originResize || []).forEach(function (args) { native.screen.off.apply(native.screen, args); });
        if (destroy) destroy.apply(this, arguments);
      };
      cleanup(p);
    } else if (name === 'ResMgr') {
      // Native loadAll resets its maps but not its counters. Reuse the first
      // load promise on replay so cached resources and counts stay coherent.
      wrap(p, 'loadAll', function (original, args) { return this.__originLoad || (this.__originLoad = original.apply(this, args)); });
    } else if (name === 'Utils') {
      utilities = value;
    } else if (name === 'Box') {
      wrap(p, 'addItem', function (original, args) {
        if (settled || restarting) return;
        var item = args[0], target = args[1], automatic = args[2];
        var valid = !automatic && item && item._type >= 0 && item._boxIndex >= 0 && (item._boxIndex !== this._index || item._index !== target);
        var out = original.apply(this, args);
        if (valid) step();
        return out;
      });
    } else if (name === 'AudioManager') {
      wrap(p, '_playAudioByRes', function (original, args) {
        args[3] = window.__ORIGIN_MUTED__ ? 0 : 1;
        // The audio manager survives scene reloads. Main.start requests BGM
        // again on replay; reuse its source after the async resource load.
        var source = args[2] && this.getAudio(args[1]);
        if (source) {
          source.volume = args[3];
          if (!window.__ORIGIN_MUTED__ && !source.playing) source.play();
          return;
        }
        return original.apply(this, args);
      });
    }
    return value;
  }
  window.addEventListener('novvy:intro-finished', function () { active = true; });
  var button = element('grill-replay');
  if (button) button.addEventListener('click', replay);
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    replay: replay,
    install: function (system) {
      var register = system.register;
      system.register = function (id, deps, declare) {
        if (typeof id !== 'string' || !/^chunks:\/\/\/_virtual\/(Game|Box|AudioManager|Clock|Main|ResMgr2|Utils)\.ts$/.test(id)) return register.apply(this, arguments);
        return register.call(this, id, deps, function (publish, context) {
          var declaration = declare(function (name, value) { return publish(name, patch(name, value)); }, context);
          var index = deps.indexOf('cc');
          if (index >= 0) {
            var setter = declaration.setters[index];
            declaration.setters[index] = function (module) { native = module; setter(module); };
          }
          return declaration;
        });
      };
    }
  };
})();
