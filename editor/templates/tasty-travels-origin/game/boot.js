(function () {
  var started = false, ready = false;
  var entered = !(window.__ORIGIN_CONFIG__ || {}).intro || !!window.__novvyIntroFinished;
  window.super_html_channel = 'web';
  window.SW_qudao = 'web';
  window.isMute = 0;
  window.super_log = function () {};
  window.super_eval = function (key) {
    var source = window.__res[key];
    if (source) { (0, eval)(source); delete window.__res[key]; }
  };
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    var wasMuted = window.isMute === 1, off = !entered || !ready || !viewable();
    window.isMute = off ? 1 : 0;
    if (window.cc && cc.audioEngine) { cc.audioEngine.setEffectsVolume(off ? 0 : 1); cc.audioEngine.setMusicVolume(off ? 0 : 1); }
    if (window.__require) { try {
      window.__require('GameManager').GameManager.isMute = off;
      // Native onLoad skips BGM while muted. Start it when the prepared scene
      // becomes playable; the layout/adapter retain native first-touch unlock.
      if (wasMuted && !off) {
        var game = window.__require('GameScript').default.instance;
        if (game) game.playBgm();
      }
    } catch (_) {} }
  }
  function lifecycle() {
    // Finish initialization and one real draw under the video before pausing.
    // Pausing at scene launch would leave an unpainted canvas at the transition.
    audio();
    if (window.cc && ready) { if (entered && viewable()) cc.game.resume(); else cc.game.pause(); }
  }
  window.super_html = {
    is_hide_download: function () { return true; }, is_audio: function () { return !window.isMute; },
    game_end: function () {}, download: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  // The native first-touch handler unlocks browser audio and starts both BGM tracks.
  document.addEventListener('pointerdown', function () { if (started) audio(); }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  window.addEventListener('novvy:intro-finished', function () { entered = true; lifecycle(); });
  function launch() {
    if (started) return;
    started = true;
    audio();
    var originalBoot = window.boot;
    window.boot = function () {
      // Fill the embedded viewport; the scene camera reserves HUD/CTA space.
      // The build also disables the native onStart's later fullscreen request.
      cc.view._frame = document.getElementById('origin-game');
      cc.view.enableAutoFullScreen(false);
      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        // Cocos resumes on a native visibility event too. Reapply the intro
        // gate after that handler so returning to the ad cannot start play early.
        cc.game.on(cc.game.EVENT_SHOW, lifecycle);
        cc.director.once(cc.Director.EVENT_AFTER_DRAW, function () { ready = true; lifecycle(); });
      });
      originalBoot();
    };
    // Give the splash a paint before synchronous engine evaluation, including
    // the all-inline preview where no network request yields to the renderer.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { window.super_boot_engine(); });
    });
  }
  if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.start(launch);
  else launch();
})();
