(function () {
  var started = false, touched = false, muted = false;
  var sound = document.getElementById('origin-sound');
  window.super_html_channel = 'web';
  window.SW_qudao = 'web';
  window.isMute = 1;
  window.super_log = function () {};
  window.super_eval = function (key) {
    var source = window.__res[key];
    if (source) { (0, eval)(source); delete window.__res[key]; }
  };
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    var off = muted || !touched || !viewable();
    window.isMute = off ? 1 : 0;
    sound.textContent = off ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-label', off ? 'Unmute sound' : 'Mute sound');
    if (window.cc && cc.audioEngine) { cc.audioEngine.setEffectsVolume(off ? 0 : 1); cc.audioEngine.setMusicVolume(off ? 0 : 1); }
    if (window.__require) { try { window.__require('GameManager').GameManager.isMute = off; } catch (_) {} }
  }
  function lifecycle() { if (window.cc && started) { if (viewable()) cc.game.resume(); else cc.game.pause(); } audio(); }
  window.super_html = {
    is_hide_download: function () { return false; }, is_audio: function () { return !window.isMute; },
    game_end: function () {}, download: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  document.addEventListener('pointerdown', function (e) { if (started && e.target !== sound) { touched = true; audio(); } }, true);
  sound.addEventListener('click', function () { muted = touched ? !muted : false; touched = true; audio(); });
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  function launch() {
    if (started) return;
    started = true; sound.hidden = false;
    var video = document.getElementById('novvy-intro-video');
    if (video) muted = video.muted;
    audio();
    var originalBoot = window.boot;
    window.boot = function () {
      // Cocos 2 uses its canvas parent as the frame; keep the game inside the HUD inset.
      cc.view._frame = document.getElementById('origin-game');
      cc.view.enableAutoFullScreen(false);
      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, lifecycle);
      originalBoot();
    };
    window.super_boot_engine();
  }
  if (window.__ORIGIN_ADAPTER__) { sound.hidden = !!window.__ORIGIN_CONFIG__.intro; window.__ORIGIN_ADAPTER__.start(launch); }
  else launch();
})();
