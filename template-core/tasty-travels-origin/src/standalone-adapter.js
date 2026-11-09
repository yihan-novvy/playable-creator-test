(function () {
  'use strict';
  var config = window.__ORIGIN_CONFIG__;
  var active = config.story ? !!false : !config.intro || !!false;
  var settled = false, installed = false, restarting = false;
  var allowReplay = !!(config.gameplay && config.gameplay.allowReplay === true);
  var spawnTierOffset = config.gameplay && config.gameplay.spawnTierOffset;
  if (!Number.isInteger(spawnTierOffset) || spawnTierOffset < 0 || spawnTierOffset > 8) spawnTierOffset = 0;
  var game = null, Game = null, data = null;
  window.ORIGIN_RUNTIME.resize = function () { if (game) game.changeLV(); };
  var steps = 0, peakTier = 0, nextCta = config.policy.afterSteps, intervalIndex = 0;
  var lastProgress = 0;
  
  function element(id) { return document.getElementById(id); }
  function playable() { return active && !settled && !restarting; }
  function emit(name, detail) { window.ORIGIN_RUNTIME.event(name, detail || {}); }
  function cta() {}

  function reportProgress(force) {
    if (!playable() || !steps) return;
    var progress = Math.min(100, peakTier / 9 * 100);
    if (!force && progress <= lastProgress) return;
    lastProgress = progress;
    if (force) emit('origin:origin-step', { step: steps, progress: progress });
  }
  function step() {
    if (!playable()) return;
    steps += 1;
    reportProgress(true);
  }
  function result(won) {
    if (!playable()) return;
    reportProgress(false);
    settled = true;
    if (allowReplay) {
      element('tasty-result-title').textContent = won ? 'You win!' : 'Try a fresh start!';
      element('tasty-result-copy').textContent = won ? 'A delicious finish!' : 'Drop, merge, and try again.';
      element('tasty-replay').textContent = won ? 'Play again' : 'Try again';
      element('tasty-result').hidden = false;
    }
    emit('origin:origin-result', { result: won ? 'win' : 'fail', replay: allowReplay });
  }
  function roundReady() {
    restarting = false; settled = false;
    element('tasty-result').hidden = true;
    element('tasty-replay').disabled = false;
    emit('origin:origin-replay');
  }
  function replay() {
    if (!active || !settled || !allowReplay || restarting || !game) return false;
    restarting = true;
    var button = element('tasty-replay');
    button.disabled = true; button.textContent = 'Preparing…';

    // Rebuild the native scene from the bundle cache. The page, intro and
    // analytics stage stay alive; only per-round state is reset.
    cc.assetManager.getBundle('main').loadScene('GameScene', function (error, scene) {
      if (error) {
        restarting = false; button.disabled = false; button.textContent = 'Try again';
        element('tasty-result-copy').textContent = 'Unable to restart. Please try again.';
        console.error('Tasty Travels restart failed', error);
        return;
      }
      game.unscheduleAllCallbacks();
      // Includes the source's coin-counter tweens, whose targets are plain
      // objects and would otherwise keep touching labels from the old scene.
      cc.Tween.stopAll();
      data.ToolArray = []; data.orderIdx = 0;
      data.all_Coin_Num = 0; data.last_Coin_Num = 0; data.isCanDown = false;
      Game.instance = null;
      steps = 0; peakTier = 0; lastProgress = 0; nextCta = config.policy.afterSteps; intervalIndex = 0;
      cc.director.once(cc.Director.EVENT_AFTER_DRAW, roundReady);
      cc.director.runSceneImmediate(scene);
    });
    return true;
  }
  function wrap(p, name, fn) { var original = p[name]; if (typeof original !== 'function') throw new Error('Missing original method: ' + name); p[name] = function () { return fn.call(this, original, arguments); }; }
  element('tasty-replay').addEventListener('click', replay);
  window.__ORIGIN_ADAPTER__ = {
    cta: cta,
    replay: replay,
    install: function (requireModule) {
      if (installed) return;
      installed = true;
      Game = requireModule('GameScript').default;
      data = requireModule('DataScript').default;
      var p = Game.prototype, tool = requireModule('Tool').default;
      var updateOrder = requireModule('EventString').EventName.updateOrder;
      wrap(p, 'onLoad', function (original, args) {
        game = this;
        // The native onLoad creates the first item. Keep an unmodified copy
        // per scene so initialization/replay never compounds the offset.
        if (!this.__originSpawnTiers) this.__originSpawnTiers = this.spToolAll.slice();
        this.spToolAll = this.__originSpawnTiers.map(function (tier) { return Math.min(8, tier + spawnTierOffset); });
        return original.apply(this, args);
      });
      wrap(p, 'createTool', function (original, args) {
        var out = original.apply(this, args);
        // Native NEXT reads past the sequence on its final item. Preview the
        // first tier here, matching the native wrap on the next spawn.
        if (this.toolNum >= this.spToolAll.length) {
          var tier = this.spToolAll[0];
          var frame = this.spTool[tier].getChildByName('sp').getComponent(cc.Sprite).spriteFrame;
          [this.nextToolSp, this.nextToolSp2].forEach(function (next) {
            next.getComponent(cc.Sprite).spriteFrame = frame;
            next.x = data.nextIconOffsetX[tier];
            next.scale = 0;
            cc.tween(next).to(.1, { scale: 0 }).to(.2, { scale: data.nextIconScale[tier] }, { easing: 'bounceOut' }).start();
          });
        }
        return out;
      });
      var destroy = p.onDestroy;
      p.onDestroy = function () {
        tool.off(updateOrder, this.updateOrder, this);
        if (Game.instance === this) Game.instance = null;
        if (game === this) game = null;
        if (destroy) destroy.apply(this, arguments);
      };
      // The native onLoad and first touch both request these loops. Reuse
      // each live track, including when async loading calls playEffect again.
      var sound = requireModule('SoundManager').SoundManager;
      wrap(sound, 'playEffect', function (original, args) {
        var name = typeof args[0] === 'string' ? args[0] : args[0] && args[0].name;
        var id = this.effectList.get(name);
        // The source channel adapter drops playEffect's return ID. Its map
        // still records the requested clip, and stopAll clears that map.
        if (args[1] && !args[2] && !args[3] && this.effectList.has(name) && (id == null || cc.audioEngine.getState(id) >= 0)) return;
        return original.apply(this, args);
      });
      // Source telemetry reports CHALLENGE_SOLVED on touch-start. It is not a game result.
      requireModule('MarkUtil').MarkUtil.report = function () {};
      wrap(p, 'downLoadApp', function (original, args) {
        this.__originCtaGesture = true;
        if (args[0] && args[0].stopPropagation) args[0].stopPropagation();
        return original.apply(this, args);
      });
      wrap(p, 'game1_Start', function (original, args) {
        this.__originCtaGesture = false;
        if (playable() && !this.isEnd) return original.apply(this, args);
      });
      wrap(p, 'game1_Move', function (original, args) {
        if (playable() && !this.isEnd) return original.apply(this, args);
      });
      wrap(p, 'game1_End', function (original, args) {
        if (this.__originCtaGesture) { this.__originCtaGesture = false; return; }
        if (!playable() || this.isEnd) return;
        var held = this.tool, out = original.apply(this, args);
        if (held && this.tool === null) step();
        return out;
      });
      wrap(p, 'createTool2', function (original, args) {
        if (!playable()) return;
        peakTier = Math.max(peakTier, args[0]);
        var out = original.apply(this, args);
        reportProgress(false);
        return out;
      });
      wrap(p, 'EndStep', function (original, args) {
        if (!playable()) return;
        var wasEnded = this.isEnd, out = original.apply(this, args);
        if (!wasEnded && this.isEnd) result(peakTier >= 9);
        return out;
      });
    },
    start: function (launch) {
      if (!active) window.addEventListener(config.story ? 'origin:story-finished' : 'origin:intro-finished', function () { active = true; }, { once: true });
      // Load behind the intro; input and reporting remain gated until entry.
      launch();
    }
  };
})();
