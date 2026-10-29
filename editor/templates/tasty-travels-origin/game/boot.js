(function () {
  var started = false;
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
    var off = !viewable();
    window.isMute = off ? 1 : 0;
    if (window.cc && cc.audioEngine) { cc.audioEngine.setEffectsVolume(off ? 0 : 1); cc.audioEngine.setMusicVolume(off ? 0 : 1); }
    if (window.__require) { try { window.__require('GameManager').GameManager.isMute = off; } catch (_) {} }
  }
  function lifecycle() { if (window.cc && started) { if (viewable()) cc.game.resume(); else cc.game.pause(); } audio(); }
  window.super_html = {
    is_hide_download: function () { return true; }, is_audio: function () { return !window.isMute; },
    game_end: function () {}, download: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  // The native first-touch handler unlocks browser audio and starts both BGM tracks.
  document.addEventListener('pointerdown', function () { if (started) audio(); }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  function launch() {
    if (started) return;
    started = true;
    audio();
    var originalBoot = window.boot;
    window.boot = function () {
      // Keep the canvas full screen; the scene camera reserves HUD/CTA space.
      cc.view._frame = document.getElementById('origin-game');
      cc.view.enableAutoFullScreen(false);
      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, lifecycle);
      originalBoot();
    };
    window.super_boot_engine();
  }
  if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.start(launch);
  else launch();
})();
